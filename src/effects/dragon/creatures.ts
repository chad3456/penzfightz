import type p5 from 'p5';
import type { Splat } from './fluid';

/**
 * The two of them.
 *
 * The hard part of this piece is not the water, it is that a dragon has to look
 * like a dragon while dissolving. So both creatures are drawn as **geometry,
 * every frame, sharp** — and only their wake is handed to the fluid. You are
 * always looking at a clear silhouette trailing something that is coming apart,
 * which is the composition of every ink painting of a dragon ever made, and it
 * is also the only arrangement in which the subject survives the medium.
 *
 * What makes each one readable is a very short list, and it is not the body.
 *
 * **A Chinese dragon is whiskers, horns and a serrated back.** Take those three
 * away and a long ribbon with legs is a caterpillar. The whiskers do more work
 * than anything else: two long curves trailing from the snout, and the eye
 * finds the head instantly.
 *
 * **A phoenix is a tail.** The bird at the front of it is small and nearly
 * generic; the four plumes streaming behind, each three times the body's
 * length, are the whole animal. They also happen to be the perfect thing to
 * hand to a fluid solver.
 *
 * Neither is rigged. The dragon's body is a chain that follows its own head at
 * a fixed spacing, so the undulation is a *consequence* of steering rather than
 * an animation played over it, and the tail whips because a chain whips. The
 * phoenix's plumes are four more chains hung off the same idea.
 */

export interface Node {
  x: number;
  y: number;
}

/** A chain that follows its own head. The oldest trick and still the best. */
function follow(nodes: Node[], spacing: number) {
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1];
    const b = nodes[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    b.x = a.x + (dx / d) * spacing;
    b.y = a.y + (dy / d) * spacing;
  }
}

/**
 * Steer away from the edges of the picture.
 *
 * The first version nudged the heading by `sign(cos(want))` near a vertical
 * wall, which is a guess dressed as a rule: it has no idea which way is *in*.
 * This builds the vector pointing back into the frame and turns towards it,
 * which is the same thing every flocking model has done since 1986 and is
 * right for the same reason.
 */
function inward(at: Node, b: Bounds, want: number) {
  const m = Math.min(b.w, b.h) * 0.3;
  let px = 0;
  let py = 0;
  if (at.x < m) px += 1 - at.x / m;
  if (at.x > b.w - m) px -= 1 - (b.w - at.x) / m;
  if (at.y < m) py += 1 - at.y / m;
  if (at.y > b.h - m) py -= 1 - (b.h - at.y) / m;
  const push = Math.hypot(px, py);
  if (push < 1e-3) return want;
  let d = Math.atan2(py, px) - want;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return want + d * Math.min(0.95, push);
}

const norm = (a: Node, b: Node) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  return { x: dx / d, y: dy / d, nx: -dy / d, ny: dx / d };
};

export interface Bounds {
  w: number;
  h: number;
}

/**
 * What a unit of push is worth.
 *
 * The solver advects by `uv - v · dt · texel`, so a velocity of 1 moves the ink
 * one texel per second — nothing. The creatures think in "one unit is a firm
 * shove", and this is the conversion into the solver's units: at 340 a body
 * wave moves the water about one part in a hundred of the field per frame,
 * which is the difference between ink that curls and ink that sits there.
 */
const FORCE = 340;

/** How fast the head swims, in scale-units per second. */
const SWIM = 138;

/**
 * The tightest turn the dragon is allowed, in radians per second.
 *
 * Not a taste value — a ratio. A chain moving at `v` and turning at `ω` traces
 * a circle of radius `v/ω` and circumference `2πv/ω`; once that circumference
 * is shorter than the body, the animal closes into a ring and stops being a
 * dragon. The body is 35 links of 11 units, so
 *
 *     ω = 3.2 · SWIM / 385 ≈ 1.15 rad/s
 *
 * puts the tightest circle at a third of the body length, and the most the
 * dragon can ever wrap is about half a turn. Both terms carry the same `scale`
 * factor, so the number is the same on a phone as on a desk — which matters,
 * because a fixed cap that behaved on a wide screen turned the dragon into a
 * doughnut on a narrow one, where everything is a third the size *and* a third
 * the speed and only the turn rate stayed where it was.
 */
const MAX_TURN = (3.2 * SWIM) / 385;

// --------------------------------------------------------------------- dragon

export class Dragon {
  nodes: Node[] = [];
  private readonly spacing: number;
  private heading: number;
  private wander: number;
  private t = 0;
  readonly scale: number;

  constructor(b: Bounds, scale: number, seed: number) {
    this.scale = scale;
    this.spacing = 11 * scale;
    this.heading = seed;
    this.wander = seed * 3.1;
    const n = 36;
    // Laid out along its own heading, so the first frame is a dragon rather
    // than forty-two nodes on top of each other sorting themselves out.
    for (let i = 0; i < n; i++) {
      this.nodes.push({
        x: b.w * 0.62 - Math.cos(seed) * i * this.spacing,
        y: b.h * 0.58 - Math.sin(seed) * i * this.spacing,
      });
    }
  }

  update(dt: number, b: Bounds, pointer: { x: number; y: number; on: boolean }) {
    this.t += dt;
    this.wander += dt * 0.6;

    // Steering, not a path. The undulation everybody recognises is what a
    // chain does when its head keeps changing its mind.
    const head = this.nodes[0];

    // Where it wants to *be*, not what it wants to avoid.
    //
    // Reactive wall avoidance cannot work for this animal and the arithmetic
    // says so before the screenshot does: capped at 2.2 rad/s and moving at
    // 155 px/s, a U-turn takes 1.4 seconds and 220 pixels of travel, which is
    // most of the height of the picture. By the time a wall is close enough to
    // react to, the turn no longer fits. So it chases a point drifting slowly
    // round the middle of the frame instead, and the composition is a set of
    // long arcs that stay in it.
    const tx = b.w * (0.5 + 0.26 * Math.cos(this.wander * 0.7));
    const ty = b.h * (0.5 + 0.15 * Math.sin(this.wander * 0.53 + 1.1));
    // And the fast one on top is the swimming: a chain only carries an S-wave
    // if its head is putting one in, and at roughly half a hertz against a body
    // two and a half seconds long there is about one and a half waves in the
    // dragon at any moment — which is what a dragon looks like. Without it the
    // chain is a straight stick that happens to steer.
    let want = Math.atan2(ty - head.y, tx - head.x) + Math.sin(this.t * 3.4) * 0.5;

    if (pointer.on) {
      const a = Math.atan2(pointer.y - head.y, pointer.x - head.x);
      let d = a - want;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      want += d * 0.5;
    }

    want = inward(head, b, want);

    let turn = want - this.heading;
    while (turn > Math.PI) turn -= Math.PI * 2;
    while (turn < -Math.PI) turn += Math.PI * 2;
    // Capped, in radians per second rather than per frame: a dragon cannot
    // turn inside its own body, and left uncapped the head came round faster
    // than the tail could follow and the animal tied itself in a knot.
    const step = turn * Math.min(1, dt * 9);
    this.heading += Math.max(-MAX_TURN * dt, Math.min(MAX_TURN * dt, step));

    const speed = SWIM * this.scale * dt;
    head.x += Math.cos(this.heading) * speed;
    head.y += Math.sin(this.heading) * speed;
    // Kept inside the picture as a last resort, after the steering has had its
    // say. The turn cap means the head can and does overshoot the orbit it is
    // chasing, and a dragon whose head is off the top edge is a length of rope.
    head.x = Math.max(b.w * 0.04, Math.min(b.w * 0.96, head.x));
    head.y = Math.max(b.h * 0.13, Math.min(b.h * 0.87, head.y));
    follow(this.nodes, this.spacing);
  }

  /** Thickness along the body: thickest a third of the way back, like a snake. */
  private girth(i: number) {
    const t = i / (this.nodes.length - 1);
    const swell = Math.sin(Math.pow(t, 0.55) * Math.PI) * 0.72 + 0.28;
    return swell * 19 * this.scale * (1 - t * 0.55);
  }

  pushes(b: Bounds): Splat[] {
    const out: Splat[] = [];
    // A swimmer pushes water *sideways* as its body waves, which is why the
    // wake behind this thing is a row of alternating vortices rather than a
    // straight streak. Nothing else in the piece produces that.
    for (let i = 2; i < this.nodes.length - 2; i += 4) {
      const n = this.nodes[i];
      const d = norm(this.nodes[i - 1], this.nodes[i + 1]);
      const wave = Math.sin(this.t * 5.0 - i * 0.42);
      const k = FORCE * this.scale * (1 - i / this.nodes.length);
      out.push({
        x: n.x / b.w,
        y: n.y / b.h,
        v: [d.nx * wave * k - d.x * 0.35 * k, d.ny * wave * k - d.y * 0.35 * k, 0],
        r: 0.00022,
      });
    }
    return out;
  }

  draw(q: p5, ink: [number, number, number], gold: [number, number, number]) {
    const n = this.nodes;
    const s = this.scale;

    // The body, as one ribbon down each side. Drawn as a single shape so the
    // additive blend does not seam at every segment join.
    const left: Node[] = [];
    const right: Node[] = [];
    for (let i = 0; i < n.length; i++) {
      const a = n[Math.max(0, i - 1)];
      const c = n[Math.min(n.length - 1, i + 1)];
      const d = norm(a, c);
      const g = this.girth(i);
      left.push({ x: n[i].x + d.nx * g, y: n[i].y + d.ny * g });
      right.push({ x: n[i].x - d.nx * g, y: n[i].y - d.ny * g });
    }
    q.fill(ink[0], ink[1], ink[2]);
    q.beginShape();
    for (const p of left) q.vertex(p.x, p.y);
    for (let i = right.length - 1; i >= 0; i--) q.vertex(right[i].x, right[i].y);
    q.endShape(q.CLOSE);

    // The pale belly, run down the inside of the ribbon rather than the middle
    // of it. A flat band of one colour is a strap; a band with an underside is
    // an animal, and this is the cheapest possible version of that — a second
    // ribbon at a third the width, pushed off centre.
    q.fill(ink[0] * 1.45 + 30, ink[1] * 1.45 + 34, ink[2] * 1.2 + 26);
    q.beginShape();
    for (let i = 0; i < n.length; i++) {
      const a = n[Math.max(0, i - 1)];
      const c = n[Math.min(n.length - 1, i + 1)];
      const d = norm(a, c);
      const g = this.girth(i);
      q.vertex(n[i].x - d.nx * g * 0.28, n[i].y - d.ny * g * 0.28);
    }
    for (let i = n.length - 1; i >= 0; i--) {
      const a = n[Math.max(0, i - 1)];
      const c = n[Math.min(n.length - 1, i + 1)];
      const d = norm(a, c);
      const g = this.girth(i);
      q.vertex(n[i].x - d.nx * g * 0.86, n[i].y - d.ny * g * 0.86);
    }
    q.endShape(q.CLOSE);

    // The serrated back. Three of the five things that say "dragon".
    q.fill(gold[0] * 0.55, gold[1] * 0.55, gold[2] * 0.55);
    for (let i = 3; i < n.length - 3; i += 2) {
      const d = norm(n[i - 1], n[i + 1]);
      const g = this.girth(i);
      const h = g * 1.5;
      q.beginShape();
      q.vertex(n[i].x + d.nx * g, n[i].y + d.ny * g);
      q.vertex(n[i].x + d.nx * (g + h) - d.x * g * 1.1, n[i].y + d.ny * (g + h) - d.y * g * 1.1);
      q.vertex(n[i + 1].x + d.nx * g, n[i + 1].y + d.ny * g);
      q.endShape(q.CLOSE);
    }

    // Legs, at the shoulder and the haunch, paddling.
    for (const [at, phase] of [
      [6, 0],
      [17, Math.PI],
    ] as [number, number][]) {
      const d = norm(n[at - 1], n[at + 1]);
      for (const side of [1, -1]) {
        const swing = Math.sin(this.t * 4.2 + phase + (side > 0 ? 0 : 1.6)) * 0.6;
        const hip = { x: n[at].x + d.nx * side * this.girth(at) * 0.7,
          y: n[at].y + d.ny * side * this.girth(at) * 0.7 };
        const a1 = Math.atan2(d.ny * side, d.nx * side) + swing;
        const knee = { x: hip.x + Math.cos(a1) * 15 * s, y: hip.y + Math.sin(a1) * 15 * s };
        // Bent *away* from the body on whichever side it is on. Subtracting a
        // fixed angle instead put both legs through the same crook, and a
        // dragon with two left knees reads as an insect.
        const a2 = a1 - side * 0.95 + swing * 0.5;
        const paw = { x: knee.x + Math.cos(a2) * 13 * s, y: knee.y + Math.sin(a2) * 13 * s };
        q.fill(ink[0], ink[1], ink[2]);
        q.strokeWeight(9 * s);
        q.stroke(ink[0], ink[1], ink[2]);
        q.line(hip.x, hip.y, knee.x, knee.y);
        q.strokeWeight(6.5 * s);
        q.line(knee.x, knee.y, paw.x, paw.y);
        // Three claws.
        q.strokeWeight(2.2 * s);
        q.stroke(gold[0], gold[1], gold[2]);
        for (let c = -1; c <= 1; c++) {
          q.line(paw.x, paw.y, paw.x + Math.cos(a2 + c * 0.5) * 9 * s,
            paw.y + Math.sin(a2 + c * 0.5) * 9 * s);
        }
        q.noStroke();
      }
    }

    // The head, and the four marks that make it one.
    const head = n[0];
    const d0 = norm(n[1], n[0]);
    const ang = Math.atan2(d0.y, d0.x);
    q.push();
    q.translate(head.x, head.y);
    q.rotate(ang);

    // Skull and snout.
    q.fill(ink[0], ink[1], ink[2]);
    q.beginShape();
    q.vertex(30 * s, 0);
    q.vertex(14 * s, -9 * s);
    q.vertex(-6 * s, -13 * s);
    q.vertex(-16 * s, -6 * s);
    q.vertex(-16 * s, 6 * s);
    q.vertex(-6 * s, 13 * s);
    q.vertex(14 * s, 9 * s);
    q.endShape(q.CLOSE);
    // The open jaw.
    q.beginShape();
    q.vertex(30 * s, 2 * s);
    q.vertex(12 * s, 14 * s);
    q.vertex(2 * s, 10 * s);
    q.vertex(6 * s, 3 * s);
    q.endShape(q.CLOSE);

    // Horns, swept back and branched.
    q.stroke(gold[0] * 0.7, gold[1] * 0.7, gold[2] * 0.7);
    q.noFill();
    for (const side of [-1, 1]) {
      q.strokeWeight(4 * s);
      q.beginShape();
      q.vertex(-8 * s, side * 9 * s);
      q.vertex(-24 * s, side * 15 * s);
      q.vertex(-40 * s, side * 12 * s);
      q.endShape();
      q.strokeWeight(2.6 * s);
      q.beginShape();
      q.vertex(-26 * s, side * 14 * s);
      q.vertex(-34 * s, side * 24 * s);
      q.endShape();
    }

    // Whiskers. The single most identifying mark on the animal.
    q.stroke(gold[0], gold[1], gold[2]);
    q.strokeWeight(3.2 * s);
    for (const side of [-1, 1]) {
      const w = Math.sin(this.t * 2.6 + side) * 8 * s;
      q.beginShape();
      q.vertex(26 * s, side * 6 * s);
      q.vertex(4 * s, side * (26 * s) + w * 0.3);
      q.vertex(-30 * s, side * (34 * s) + w);
      q.vertex(-70 * s, side * (22 * s) + w * 1.6);
      q.endShape();
    }
    q.noStroke();

    // Eye.
    q.fill(gold[0] * 1.6, gold[1] * 1.4, gold[2] * 0.9);
    q.ellipse(6 * s, -6 * s, 6 * s, 5 * s);
    q.pop();

    // Mane, behind the head, streaming.
    //
    // It was twice this size and half this transparent, and the result was a
    // navy cushion exactly where the face is — the one place on the animal
    // that has to stay legible. A mane is hair: it goes behind the head, it is
    // thinner than the head, and you should be able to see through it.
    q.fill(ink[0] * 0.42, ink[1] * 0.42, ink[2] * 0.5);
    for (let i = 2; i < 6; i++) {
      const d = norm(n[i], n[i + 1]);
      const g = this.girth(i) * 1.45;
      const flick = Math.sin(this.t * 3.1 + i) * 0.35;
      for (const side of [1, -1]) {
        q.beginShape();
        q.vertex(n[i].x, n[i].y);
        q.vertex(n[i].x + (d.nx * side + d.x * flick) * g, n[i].y + (d.ny * side + d.y * flick) * g);
        q.vertex(n[i + 1].x + d.x * g * 0.4, n[i + 1].y + d.y * g * 0.4);
        q.endShape(q.CLOSE);
      }
    }

    // Tail flame.
    const tail = n[n.length - 1];
    const dt2 = norm(n[n.length - 2], tail);
    q.fill(gold[0] * 0.8, gold[1] * 0.6, gold[2] * 0.4);
    for (let c = -1; c <= 1; c++) {
      const a = Math.atan2(dt2.y, dt2.x) + c * 0.5;
      q.beginShape();
      q.vertex(tail.x, tail.y);
      q.vertex(tail.x + Math.cos(a - 0.2) * 34 * s, tail.y + Math.sin(a - 0.2) * 34 * s);
      q.vertex(tail.x + Math.cos(a + 0.25) * 22 * s, tail.y + Math.sin(a + 0.25) * 22 * s);
      q.endShape(q.CLOSE);
    }
  }
}

// -------------------------------------------------------------------- phoenix

export class Phoenix {
  pos: Node;
  private vel: Node = { x: 0, y: 0 };
  private heading: number;
  private wander: number;
  private t = 0;
  /** Where this one sits on the shared orbit, so three of them never stack. */
  private readonly phase: number;
  readonly scale: number;
  /** Four chains, streaming behind. The bird is mostly these. */
  private plumes: Node[][] = [];

  constructor(b: Bounds, scale: number, seed: number) {
    this.scale = scale;
    this.pos = { x: b.w * (0.18 + 0.64 * ((seed * 7) % 1)), y: b.h * (0.2 + 0.5 * ((seed * 3) % 1)) };
    this.heading = seed;
    this.wander = seed * 5.7;
    this.phase = seed * 2.1;
    for (let p = 0; p < 4; p++) {
      const chain: Node[] = [];
      for (let i = 0; i < 22; i++) chain.push({ x: this.pos.x, y: this.pos.y });
      this.plumes.push(chain);
    }
  }

  get beat() {
    return Math.sin(this.t * 4.6);
  }

  update(dt: number, b: Bounds, pointer: { x: number; y: number; on: boolean }) {
    this.t += dt;
    this.wander += dt * 0.8;
    // Same idea as the dragon, on its own orbit and a good deal wider, so the
    // birds work the outside of the frame while the dragon works the middle.
    const tx = b.w * (0.5 + 0.36 * Math.cos(this.wander * 0.85 + this.phase));
    const ty = b.h * (0.5 + 0.34 * Math.sin(this.wander * 0.61 + this.phase * 1.7));
    let want = Math.atan2(ty - this.pos.y, tx - this.pos.x) + Math.sin(this.t * 1.9) * 0.3;
    if (pointer.on) {
      const a = Math.atan2(pointer.y - this.pos.y, pointer.x - this.pos.x);
      let d = a - want;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      want += d * 0.3;
    }
    want = inward(this.pos, b, want);

    let turn = want - this.heading;
    while (turn > Math.PI) turn -= Math.PI * 2;
    while (turn < -Math.PI) turn += Math.PI * 2;
    this.heading += turn * Math.min(1, dt * 2.2);

    // A bird surges on the downbeat and coasts on the up, which is why it
    // bobs. Constant speed reads as a paper aeroplane.
    const surge = 150 * this.scale * (1 + Math.max(0, -this.beat) * 0.9);
    this.vel.x += (Math.cos(this.heading) * surge - this.vel.x) * Math.min(1, dt * 3);
    this.vel.y += (Math.sin(this.heading) * surge - this.vel.y) * Math.min(1, dt * 3);
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.pos.x = Math.max(b.w * 0.06, Math.min(b.w * 0.94, this.pos.x));
    this.pos.y = Math.max(b.h * 0.08, Math.min(b.h * 0.92, this.pos.y));

    const back = { x: this.pos.x - Math.cos(this.heading) * 22 * this.scale,
      y: this.pos.y - Math.sin(this.heading) * 22 * this.scale };
    for (let p = 0; p < this.plumes.length; p++) {
      const spread = (p - 1.5) * 0.22;
      const c = this.plumes[p];
      c[0].x = back.x;
      c[0].y = back.y;
      // Each plume trails a little to one side and lags a little differently,
      // so they fan instead of lying on top of each other.
      const drift = Math.sin(this.t * 2.2 + p) * 0.25 + spread;
      const a = this.heading + Math.PI + drift;
      c[1].x = back.x + Math.cos(a) * 12 * this.scale;
      c[1].y = back.y + Math.sin(a) * 12 * this.scale;
      follow(c, 11 * this.scale);
    }
  }

  pushes(b: Bounds): Splat[] {
    const out: Splat[] = [];
    const down = Math.max(0, -this.beat);
    // The downbeat, thrown backwards and down off both wingtips.
    for (const side of [1, -1]) {
      const a = this.heading + side * 1.5;
      const x = this.pos.x + Math.cos(a) * 42 * this.scale;
      const y = this.pos.y + Math.sin(a) * 42 * this.scale;
      out.push({
        x: x / b.w,
        y: y / b.h,
        v: [-Math.cos(this.heading) * down * 1.5 * FORCE * this.scale,
          (-Math.sin(this.heading) * down * 1.5 + down * 1.1) * FORCE * this.scale, 0],
        r: 0.0004,
      });
    }
    for (const c of this.plumes) {
      const tip = c[c.length - 1];
      out.push({ x: tip.x / b.w, y: tip.y / b.h,
        v: [(Math.random() - 0.5) * 0.5 * FORCE * this.scale, -0.35 * FORCE * this.scale, 0],
        r: 0.0002 });
    }
    return out;
  }

  draw(q: p5, fire: [number, number, number], gold: [number, number, number]) {
    const s = this.scale;
    const beat = this.beat;

    // Tail first, so the bird sits on top of its own plumes.
    for (let p = 0; p < this.plumes.length; p++) {
      const c = this.plumes[p];
      const hue = 0.6 + p * 0.14;
      q.noFill();
      // Drawn a segment at a time rather than as one polyline, because the
      // whole character of a feather is in the taper: thick at the quill,
      // nothing at the tip, fading as it goes. At one width, four of these
      // behind a bird are four lengths of hosepipe — which is what they were.
      for (let i = 1; i < c.length; i++) {
        const t = i / (c.length - 1);
        const k = hue * (1 - t * 0.5);
        q.stroke(fire[0] * k, fire[1] * k * 0.8, fire[2] * 0.5);
        q.strokeWeight((5.4 * Math.pow(1 - t, 0.7) + 0.5) * s);
        q.line(c[i - 1].x, c[i - 1].y, c[i].x, c[i].y);
        // Barbs, off both sides, every third node. Cheap, and the silhouette
        // stops being a line the moment they are there.
        if (i % 3 === 0 && t < 0.86) {
          const d = norm(c[i - 1], c[i]);
          const len = (13 - t * 8) * s;
          q.strokeWeight(1.1 * s);
          for (const side of [1, -1]) {
            q.line(c[i].x, c[i].y,
              c[i].x + (d.nx * side - d.x * 0.7) * len, c[i].y + (d.ny * side - d.y * 0.7) * len);
          }
        }
      }
      // The eye at the end of each plume, which is the mark that says peacock,
      // pheasant, phoenix — a bird whose tail is for looking at.
      const tip = c[c.length - 1];
      const prev = c[c.length - 3];
      const d = norm(prev, tip);
      q.noStroke();
      q.fill(gold[0], gold[1] * 0.8, gold[2] * 0.4);
      q.push();
      q.translate(tip.x, tip.y);
      q.rotate(Math.atan2(d.y, d.x));
      q.ellipse(4 * s, 0, 20 * s, 11 * s);
      q.fill(fire[0] * 1.3, fire[1] * 0.5, fire[2] * 0.5);
      q.ellipse(4 * s, 0, 9 * s, 5 * s);
      q.pop();
    }

    q.push();
    q.translate(this.pos.x, this.pos.y);
    q.rotate(this.heading);
    q.noStroke();

    // Wings: a fan of blades that sweeps. Drawn from the far wing first so the
    // near one overlaps it and the bird has a front and a back.
    for (const side of [-1, 1]) {
      const sweep = beat * 0.55 * side;
      for (let f = 0; f < 7; f++) {
        const t = f / 6;
        const len = (34 + t * 62) * s;
        const a = side * (0.55 + t * 0.95) + sweep * (0.4 + t * 0.9);
        const k = 0.55 + t * 0.5;
        q.fill(fire[0] * k, fire[1] * k * 0.75, fire[2] * 0.42);
        q.beginShape();
        q.vertex(-4 * s, side * 6 * s);
        q.vertex(Math.cos(a) * len - 5 * s, Math.sin(a) * len);
        q.vertex(Math.cos(a + 0.16) * len * 0.92 + 4 * s, Math.sin(a + 0.16) * len * 0.92);
        q.endShape(q.CLOSE);
      }
    }

    // Body, neck and head.
    q.fill(fire[0], fire[1] * 0.72, fire[2] * 0.4);
    q.ellipse(0, 0, 46 * s, 30 * s);
    q.stroke(fire[0], fire[1] * 0.72, fire[2] * 0.4);
    q.strokeWeight(11 * s);
    q.noFill();
    q.beginShape();
    q.vertex(14 * s, -2 * s);
    q.vertex(30 * s, -14 * s);
    q.vertex(42 * s, -24 * s);
    q.endShape();
    q.noStroke();
    q.fill(fire[0] * 1.1, fire[1] * 0.8, fire[2] * 0.45);
    q.ellipse(44 * s, -26 * s, 17 * s, 14 * s);
    // Beak.
    q.fill(gold[0], gold[1] * 0.85, gold[2] * 0.4);
    q.triangle(50 * s, -27 * s, 66 * s, -24 * s, 50 * s, -22 * s);
    // Crest: three backswept plumes, and the reason it is not a duck.
    q.stroke(gold[0], gold[1] * 0.7, gold[2] * 0.35);
    q.noFill();
    for (let c = 0; c < 3; c++) {
      q.strokeWeight((3.4 - c * 0.7) * s);
      q.beginShape();
      q.vertex(42 * s, -32 * s);
      q.vertex((28 - c * 5) * s, (-46 - c * 5) * s);
      q.vertex((10 - c * 9) * s, (-44 - c * 9) * s);
      q.endShape();
    }
    q.noStroke();
    // Eye.
    q.fill(gold[0] * 1.7, gold[1] * 1.5, gold[2]);
    q.ellipse(48 * s, -28 * s, 4.5 * s, 4.5 * s);
    q.pop();
  }
}
