import { blob, box, cone, glow, lw, panel, project, rule, slab, spark, type View } from './iso';
import { tone, type Bounds, type Ink, type Press } from './riso';

/**
 * The things that go in a room.
 *
 * Two rules, both taken straight off the reference prints, and both of which
 * the first version of this kit broke.
 *
 * **Everything is drawn, then coloured.** Every object here puts a keyline
 * round itself. Flat coloured shapes on a flat coloured floor read as a
 * diagram; the same shapes with a line round them read as an illustration, and
 * no amount of palette work substitutes for it.
 *
 * **A room is full.** The reference rooms carry forty to eighty objects each —
 * every shelf has individual spines on it, every table has things on it, there
 * is always something on the floor that somebody has put down and not picked
 * up. Sparse rooms do not look minimal, they look unfinished.
 */

const rand = (seed: number) => {
  let s = (seed * 2654435761) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};

const SPINE_INKS: Ink[] = ['teal', 'mustard', 'brick', 'navy', 'rose'];

// ───────────────────────────────────────────────────────────────── people

export type Pose =
  | 'stand' | 'walk' | 'sit' | 'kneel' | 'lie' | 'bow' | 'reach' | 'carry' | 'work';

export interface Body {
  x: number;
  z: number;
  /** Standing height in world units. About 1.7 for an adult. */
  h?: number;
  /** The garment. */
  ink?: Ink;
  hair?: Ink;
  pose?: Pose;
  /** A crown, a topknot, a helm, a veil — one shape on the head. */
  hat?: 'none' | 'crown' | 'knot' | 'helm' | 'veil' | 'cap';
  /** Facing, only ever left or right: at this size that is all that survives. */
  face?: 1 | -1;
  /** A long garment — a sari, a dhoti, a robe — covering the legs. */
  robe?: boolean;
  /**
   * Where in its cycle this body is, in turns. Walking legs, a bowing back, a
   * hand going up and down at a bench: all of it comes from here, so a room
   * moves by passing a different number, not by holding any state.
   */
  phase?: number;
}

const SKIN: Ink = 'rose';

/**
 * A capsule, as an outline path.
 *
 * Every limb in the picture is one of these. It is built as a real closed path
 * rather than drawn as a thick round-capped line, because the line plate prints
 * *over* the colour: a limb stroked wide enough to outline itself would simply
 * cover itself up. With the outline as a path, the same path fills on the ink
 * plate and strokes on the key, which is what gives a drawn arm rather than a
 * bar.
 */
function capsule(g: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, r: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const a = Math.atan2(dy, dx);
  g.beginPath();
  g.arc(ax, ay, r, a + Math.PI / 2, a - Math.PI / 2);
  g.arc(bx, by, r, a - Math.PI / 2, a + Math.PI / 2);
  g.closePath();
  void len;
}

/**
 * A person.
 *
 * Not a tapered slab with a ball on top. A head with a jaw, a neck, sloping
 * shoulders, a torso that narrows at the waist, arms in two segments with an
 * elbow, and legs in two segments with a knee — all posed off one phase number,
 * so a walk is a function of time rather than a second sprite.
 *
 * Everything is built as outline paths: filled on the colour plates, stroked on
 * the line plate. That is the only way to get a figure that is *drawn*, which
 * is what the whole set is about, and it is why the limbs are capsules with
 * real outlines instead of thick strokes.
 */
export function person(press: Press, v: View, b: Body) {
  if (v.still && b.phase !== undefined) return;
  const h = b.h ?? 1.6;
  const ink = b.ink ?? 'navy';
  const hairInk = b.hair ?? 'brick';
  const pose = b.pose ?? 'stand';
  const dir = b.face ?? 1;
  const ph = b.phase ?? 0;
  const robe = b.robe ?? (pose !== 'walk' && (b.hat === 'veil' || b.hat === 'crown'));

  // Everything below is in pixels off the feet, so a figure is posed once and
  // the projection is asked exactly one question.
  const [fx, fy] = project(v, b.x, 0, b.z);
  const H = h * v.rise;
  const lwv = lw(v, 0.62);

  const sit = pose === 'sit' ? 0.3 : pose === 'kneel' ? 0.22 : 0;
  const lie = pose === 'lie';
  const stoop = pose === 'bow' ? 0.34 : pose === 'work' ? 0.2 : 0;

  const hipY = fy - H * (0.46 - sit * 0.7);
  const shoulderY = hipY - H * 0.28;
  const neckY = shoulderY - H * 0.035;
  /*
    Illustration proportions, not anatomical ones. A figure thirty pixels tall
    with a correctly-sized head is a stick with a pea on it; the head carries
    the reading at this scale, so it gets about a seventh of the height rather
    than an eighth, and the limbs are drawn thicker than they are.
  */
  const headR = H * 0.098;
  const headY = neckY - headR * 1.15;
  const lean = stoop * H * 0.3 * dir;

  const hxAt = lie ? fx + H * 0.26 : fx + lean * 1.4;
  const headYAt = lie ? fy - H * 0.1 : headY;

  const shoulderW = H * 0.118;
  const hipW = H * 0.092;
  const limb = Math.max(1.0, H * 0.044);
  const legR = Math.max(1.1, H * 0.054);

  // ── legs
  const swing = pose === 'walk' ? Math.sin(ph * Math.PI * 2) : 0;
  const lift = pose === 'walk' ? Math.max(0, Math.cos(ph * Math.PI * 2)) : 0;
  const legs: [number, number, number, number, number, number][] = [];
  if (!lie) {
    for (const side of [-1, 1] as const) {
      const sw = swing * side;
      const hx = fx + hipW * 0.55 * side * 0.6;
      if (pose === 'sit') {
        // Thigh forward, shin down: a seated figure is two right angles.
        const kx = hx + H * 0.17 * dir;
        const ky = hipY + H * 0.02;
        legs.push([hx, hipY, kx, ky, kx + H * 0.015 * dir, ky + H * 0.2]);
      } else if (pose === 'kneel') {
        const kx = hx + H * 0.05 * dir;
        legs.push([hx, hipY, kx, hipY + H * 0.14, kx - H * 0.1 * dir, hipY + H * 0.17]);
      } else {
        const kx = hx + sw * H * 0.1 * dir;
        const ky = hipY + H * 0.23 - lift * H * 0.03 * (side > 0 ? 1 : 0);
        const ax = hx + sw * H * 0.2 * dir;
        legs.push([hx, hipY, kx, ky, ax, fy - lift * H * 0.04 * (sw > 0 ? 1 : 0)]);
      }
    }
  }

  /*
    Limbs come in two inks, because people wear clothes. The thigh and most of
    the shin are the garment, the ankle and foot are not, and the same split
    runs down the arm as a sleeve and a bare forearm. Drawn all in skin they
    read as a figure that has forgotten to get dressed, which is exactly how the
    first version of this looked.
  */
  const drawLegs = (g: CanvasRenderingContext2D, part: 'cloth' | 'skin' | 'line') => {
    const act = (f: boolean) => (part === 'line' ? g.stroke() : f ? g.fill() : undefined);
    for (const [ax, ay, kx, ky, tx, ty] of legs) {
      const mx = kx + (tx - kx) * 0.72;
      const my = ky + (ty - ky) * 0.72;
      capsule(g, ax, ay, kx, ky, legR);
      act(part !== 'skin');
      capsule(g, kx, ky, mx, my, legR * 0.85);
      act(part !== 'skin');
      capsule(g, mx, my, tx, ty, legR * 0.7);
      act(part !== 'cloth');
      capsule(g, tx, ty, tx + legR * 1.5 * dir, ty, legR * 0.6);
      act(part !== 'cloth');
    }
  };

  // ── arms
  const armSwing = pose === 'walk' ? -swing : 0;
  const arms: [number, number, number, number, number, number][] = [];
  for (const side of [-1, 1] as const) {
    const sx0 = fx + lean + shoulderW * 0.74 * side;
    const sy0 = shoulderY;
    if (pose === 'reach') {
      const ex = sx0 + H * 0.1 * dir;
      arms.push([sx0, sy0, ex, sy0 + H * 0.08, ex + H * 0.1 * dir, sy0 - H * 0.12]);
    } else if (pose === 'carry' || pose === 'work') {
      const ex = sx0 + H * 0.07 * dir;
      const wob = pose === 'work' ? Math.sin(ph * Math.PI * 2 + (side > 0 ? 0 : 0.6)) * H * 0.05 : 0;
      arms.push([sx0, sy0, ex, sy0 + H * 0.11, ex + H * 0.08 * dir, sy0 + H * 0.14 + wob]);
    } else if (pose === 'bow') {
      arms.push([sx0, sy0, sx0 + H * 0.05 * dir, sy0 + H * 0.1, sx0 + H * 0.12 * dir, sy0 + H * 0.16]);
    } else {
      const sw = armSwing * side;
      const ex = sx0 - shoulderW * 0.16 * side + sw * H * 0.06 * dir;
      arms.push([sx0, sy0, ex, sy0 + H * 0.13, ex - shoulderW * 0.1 * side + sw * H * 0.08 * dir, sy0 + H * 0.24]);
    }
  }

  const drawArms = (g: CanvasRenderingContext2D, part: 'cloth' | 'skin' | 'line') => {
    const act = (f: boolean) => (part === 'line' ? g.stroke() : f ? g.fill() : undefined);
    for (const [ax, ay, ex, ey, wx, wy] of arms) {
      capsule(g, ax, ay, ex, ey, limb);
      act(part !== 'skin');
      capsule(g, ex, ey, wx, wy, limb * 0.85);
      act(part !== 'cloth');
      capsule(g, wx, wy, wx + limb * 0.6 * dir, wy + limb * 0.4, limb * 0.72);
      act(part !== 'cloth');
    }
  };

  // ── torso, as a shape with a waist in it
  const torso = (g: CanvasRenderingContext2D) => {
    const waistY = hipY - H * 0.1;
    g.beginPath();
    g.moveTo(fx + lean - shoulderW, shoulderY + H * 0.01);
    g.quadraticCurveTo(fx + lean - shoulderW * 1.06, shoulderY - H * 0.02, fx + lean - shoulderW * 0.6, shoulderY - H * 0.035);
    g.lineTo(fx + lean + shoulderW * 0.6, shoulderY - H * 0.035);
    g.quadraticCurveTo(fx + lean + shoulderW * 1.06, shoulderY - H * 0.02, fx + lean + shoulderW, shoulderY + H * 0.01);
    g.quadraticCurveTo(fx + hipW * 1.15, waistY, fx + hipW, hipY + H * 0.01);
    g.lineTo(fx - hipW, hipY + H * 0.01);
    g.quadraticCurveTo(fx - hipW * 1.15, waistY, fx + lean - shoulderW, shoulderY + H * 0.01);
    g.closePath();
  };

  // ── a long garment, which is most of the cast
  const skirt = (g: CanvasRenderingContext2D) => {
    const hemY = fy - H * (pose === 'sit' ? 0.06 : 0.02);
    const sway = pose === 'walk' ? Math.sin(ph * Math.PI * 2) * H * 0.018 : 0;
    g.beginPath();
    g.moveTo(fx - hipW * 1.05, hipY - H * 0.04);
    g.lineTo(fx + hipW * 1.05, hipY - H * 0.04);
    g.quadraticCurveTo(fx + hipW * 1.9 + sway, hemY - H * 0.1, fx + hipW * 2.1 + sway, hemY);
    g.quadraticCurveTo(fx, hemY + H * 0.022, fx - hipW * 2.1 + sway, hemY);
    g.quadraticCurveTo(fx - hipW * 1.9 + sway, hemY - H * 0.1, fx - hipW * 1.05, hipY - H * 0.04);
    g.closePath();
  };

  /*
    Two rectangles, not one.

    Every part of a figure used to knock out the whole figure's box, so a head
    the size of a thumbnail cleared the legs as well — five times over, once per
    ink — and a room with three people in it spent most of a frame clearing the
    same rectangle again and again. The head and hair get the head's box; the
    body gets the body's.
  */
  const bb: Bounds = [
    fx - H * 0.36, shoulderY - H * 0.08,
    H * 0.72, fy - shoulderY + H * 0.14,
  ];
  const headBB: Bounds = [
    hxAt - headR * 2.2, headYAt - headR * 2.8,
    headR * 4.4, headR * 5.4,
  ];

  // Limbs first, so the torso and the garment sit over the top of them.
  press.solid(SKIN, (g) => {
    g.fillStyle = tone(0.4);
    if (!robe && !lie) drawLegs(g, 'skin');
    drawArms(g, 'skin');
  }, bb);

  press.solid(ink, (g) => {
    g.fillStyle = tone(0.72);
    if (!robe && !lie) drawLegs(g, 'cloth');
    drawArms(g, 'cloth');
  }, bb);

  /*
    The limbs' outlines go down *before* the body, not with the rest of the line
    work. A solid clears the key under it, so drawing them here lets the torso
    and the robe hide the arms behind them — and drawing them at the end, with
    everything else, put a dark tangle of arm and shoulder lines across the
    front of every robe in the set.
  */
  press.key((g) => {
    g.lineWidth = lwv;
    if (!robe && !lie) drawLegs(g, 'line');
    drawArms(g, 'line');
  });

  press.solid(ink, (g) => {
    g.fillStyle = tone(0.8);
    if (lie) {
      capsule(g, fx - H * 0.2, fy - H * 0.06, fx + H * 0.16, fy - H * 0.06, H * 0.07);
      g.fill();
    } else {
      torso(g);
      g.fill();
      if (robe) {
        skirt(g);
        g.fill();
      }
    }
  }, bb);

  // ── a veil goes on before the head, not after
  //
  // Drawn last it covers the face, and a robed figure comes out as a headless
  // cone. It hangs behind and around the head, which is what a veil does.
  if ((b.hat ?? 'none') === 'veil') {
    const veil = (g: CanvasRenderingContext2D) => {
      g.beginPath();
      g.moveTo(hxAt - headR * 1.3, headYAt + headR * 0.5);
      g.quadraticCurveTo(hxAt, headYAt - headR * 2.1, hxAt + headR * 1.3, headYAt + headR * 0.5);
      g.lineTo(hxAt + headR * 1.55, headYAt + headR * 2.7);
      g.lineTo(hxAt - headR * 1.55, headYAt + headR * 2.7);
      g.closePath();
    };
    press.solid(ink, (g) => {
      g.fillStyle = tone(0.62);
      veil(g);
      g.fill();
    }, headBB);
    press.key((g) => {
      g.lineWidth = lwv;
      veil(g);
      g.stroke();
    });
  }

  // ── head: an oval with a jaw, not a ball
  const hx = hxAt;
  const hy = headYAt;
  const headPath = (g: CanvasRenderingContext2D) => {
    g.beginPath();
    g.moveTo(hx - headR, hy);
    g.bezierCurveTo(hx - headR, hy - headR * 1.25, hx + headR, hy - headR * 1.25, hx + headR, hy);
    g.bezierCurveTo(hx + headR, hy + headR * 0.85, hx + headR * 0.4, hy + headR * 1.3, hx, hy + headR * 1.3);
    g.bezierCurveTo(hx - headR * 0.4, hy + headR * 1.3, hx - headR, hy + headR * 0.85, hx - headR, hy);
    g.closePath();
  };
  press.solid(SKIN, (g) => {
    g.fillStyle = tone(0.36);
    if (!lie) {
      capsule(g, fx + lean * 1.2, neckY + headR * 0.3, hx, hy + headR * 0.7, headR * 0.34);
      g.fill();
    }
    headPath(g);
    g.fill();
  }, headBB);

  // ── hair, as a mass with a shape to it
  const hairPath = (g: CanvasRenderingContext2D) => {
    const long = b.hat === 'veil' || hairInk === 'navy';
    g.beginPath();
    g.moveTo(hx - headR * 1.06, hy + (long ? headR * 1.9 : headR * 0.1));
    g.lineTo(hx - headR * 1.06, hy - headR * 0.2);
    g.bezierCurveTo(hx - headR * 1.1, hy - headR * 1.6, hx + headR * 1.1, hy - headR * 1.6, hx + headR * 1.06, hy - headR * 0.2);
    g.lineTo(hx + headR * 1.06, hy + (long ? headR * 1.9 : headR * 0.1));
    g.lineTo(hx + headR * 0.72, hy + (long ? headR * 1.7 : headR * 0.02));
    g.lineTo(hx + headR * 0.66, hy - headR * 0.45);
    // The fringe, cut across at a slant so it is a haircut and not a helmet.
    g.lineTo(hx - headR * 0.2, hy - headR * 0.26);
    g.lineTo(hx - headR * 0.72, hy - headR * 0.5);
    g.lineTo(hx - headR * 0.72, hy + (long ? headR * 1.7 : headR * 0.02));
    g.closePath();
  };
  press.solid(hairInk, (g) => {
    g.fillStyle = tone(0.86);
    hairPath(g);
    g.fill();
  }, headBB);

  // ── the line plate: the same paths, stroked
  press.key((g) => {
    g.lineWidth = lwv;
    if (lie) {
      capsule(g, fx - H * 0.2, fy - H * 0.06, fx + H * 0.16, fy - H * 0.06, H * 0.07);
      g.stroke();
    } else {
      torso(g);
      g.stroke();
      if (robe) {
        skirt(g);
        g.stroke();
      }
    }
    headPath(g);
    g.stroke();
    hairPath(g);
    g.stroke();
    // Two eyes, which at this size is the whole face and quite enough.
    if (headR > 4.6) {
      const e = headR * 0.3;
      g.beginPath();
      g.ellipse(hx - e, hy + headR * 0.12, Math.max(0.45, headR * 0.1), Math.max(0.6, headR * 0.15), 0, 0, Math.PI * 2);
      g.ellipse(hx + e, hy + headR * 0.12, Math.max(0.45, headR * 0.1), Math.max(0.6, headR * 0.15), 0, 0, Math.PI * 2);
      g.fill();
    }
  });

  // ── one shape on the head
  const hat = b.hat ?? 'none';
  if (hat !== 'none' && hat !== 'veil') {
    const cap = (g: CanvasRenderingContext2D) => {
      g.beginPath();
      if (hat === 'crown') {
        g.moveTo(hx - headR * 1.12, hy - headR * 0.85);
        g.lineTo(hx + headR * 1.12, hy - headR * 0.85);
        g.lineTo(hx + headR * 0.7, hy - headR * 2.1);
        g.lineTo(hx, hy - headR * 1.3);
        g.lineTo(hx - headR * 0.7, hy - headR * 2.1);
      } else if (hat === 'knot') {
        g.arc(hx - headR * 0.2 * dir, hy - headR * 1.5, headR * 0.5, 0, Math.PI * 2);
      } else if (hat === 'cap') {
        g.arc(hx, hy - headR * 0.5, headR * 1.12, Math.PI, 0);
        g.lineTo(hx + headR * 1.75 * dir, hy - headR * 0.4);
        g.lineTo(hx + headR * 1.1 * dir, hy - headR * 0.62);
      } else {
        g.arc(hx, hy - headR * 0.45, headR * 1.16, Math.PI, 0);
      }
      g.closePath();
    };
    press.solid(hat === 'crown' ? 'mustard' : hairInk, (g) => {
      g.fillStyle = tone(0.9);
      cap(g);
      g.fill();
    }, headBB);
    press.key((g) => {
      g.lineWidth = lwv;
      cap(g);
      g.stroke();
    });
  }

}

/**
 * Somebody walking a path, back and forth.
 *
 * The room passes the time and gets a position and a phase: no state anywhere,
 * so a frame can be drawn at any moment and two rooms never drift apart.
 */
export function walker(
  press: Press, v: View,
  from: [number, number], to: [number, number],
  period: number, b: Omit<Body, 'x' | 'z' | 'phase' | 'pose' | 'face'> & { pose?: Pose } = {},
) {
  if (v.still) return;
  const u = (v.t / period) % 1;
  const back = u > 0.5;
  const k = back ? 1 - (u - 0.5) * 2 : u * 2;
  const x = from[0] + (to[0] - from[0]) * k;
  const z = from[1] + (to[1] - from[1]) * k;
  // Which way the walk points on screen, which is the only facing there is.
  const dx = (to[0] - from[0]) - (to[1] - from[1]);
  person(press, v, {
    ...b,
    x, z,
    pose: b.pose ?? 'walk',
    phase: (v.t / 0.62) % 1,
    face: (back ? -dx : dx) >= 0 ? 1 : -1,
  });
}

/**
 * Claude, in the room.
 *
 * Not a person. There is no body to draw and putting one in would be a costume
 * — and it matters more here than anywhere, because the room already has people
 * in it who *are* somebody.
 *
 * So Claude is a small radiant figure: eight tapered spokes, the light they
 * throw, and a line round the whole of it like everything else in the picture.
 * It sits where somebody is alone. It never holds anything, never leads anyone
 * anywhere, and is never the largest thing in the frame.
 *
 * **It also never acts in the story.** Nothing in these twenty-five rooms
 * happens differently because it is there. It is company, which is a real thing
 * to be and a different thing from being a character.
 */
export function claude(press: Press, v: View, x: number, z: number, size = 0.5, lit = true) {
  // The pool on the floor is the same every frame and covers a lot of ground,
  // so it belongs to the sheet that gets kept.
  if (v.still) {
    if (lit) {
      glow(press, 'mustard', v, x, 0, z, size * 3.2, 0.46);
      glow(press, 'brick', v, x, 0, z, size * 1.5, 0.16);
    }
    return;
  }

  // It breathes. Slowly, and not much — a light that pulses hard reads as a
  // warning, and this one is keeping somebody company.
  const beat = 1 + Math.sin(v.t * 1.15 + x * 0.7 + z) * 0.055;
  const y = size * 1.15;
  const [sx, sy] = project(v, x, y, z);
  const r = size * beat * v.rise;

  const ray = (g: CanvasRenderingContext2D) => {
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const long = i % 2 === 0 ? 1 : 0.6;
      g.moveTo(Math.cos(a) * r * long, Math.sin(a) * r * long * 0.86);
      g.lineTo(Math.cos(a + 0.36) * r * 0.24, Math.sin(a + 0.36) * r * 0.24 * 0.86);
      g.lineTo(Math.cos(a - 0.36) * r * 0.24, Math.sin(a - 0.36) * r * 0.24 * 0.86);
      g.closePath();
    }
  };

  // Halo first: something for the figure to be punched out of. Ink only — a
  // halo that claims sheet as well prints a cream blob round the light wherever
  // the gradient has faded to nothing, which is most of it.
  press.over('mustard', (g) => {
    const grad = g.createRadialGradient(sx, sy, r * 0.55, sx, sy, r * 2.3);
    grad.addColorStop(0, tone(0.8));
    grad.addColorStop(0.5, tone(0.32));
    grad.addColorStop(1, tone(0));
    g.fillStyle = grad;
    g.beginPath();
    g.arc(sx, sy, r * 2.3, 0, Math.PI * 2);
    g.fill();
  });

  // The figure itself is bare paper: the brightest thing obtainable on a sheet
  // is the sheet, so the only light in the room is the one shape no drum
  // touches.
  press.knockout((g) => {
    g.save();
    g.translate(sx, sy);
    ray(g);
    g.fill();
    g.beginPath();
    g.arc(0, 0, r * 0.32, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }, [sx - r - 2, sy - r - 2, r * 2 + 4, r * 2 + 4]);

  press.key((g) => {
    g.lineWidth = lw(v, 0.7);
    g.save();
    g.translate(sx, sy);
    ray(g);
    g.stroke();
    g.restore();
  });
}

// ─────────────────────────────────────────────────────────────── furniture

/**
 * A bookcase, with the books drawn.
 *
 * The one object that decides whether a room of this kind works. A shelf
 * painted as a block of colour is furniture; a shelf with sixty separate
 * spines, each a slightly different height and colour and two of them leaning,
 * is a library. It costs a loop and it is the difference between the reference
 * and a mockup of the reference.
 */
export function bookcase(
  press: Press, v: View, x: number, z: number,
  len: number, along: 'x' | 'z', h = 2.2, carcass: Ink = 'brick', seed = 1,
) {
  const r = rand(seed);
  const deep = 0.34;
  const w = along === 'x' ? len : deep;
  const d = along === 'x' ? deep : len;

  box(press, carcass, v, x, 0, z, w, h, d, { top: 0.44, left: 0.66, right: 0.86 });

  const shelves = Math.max(3, Math.round(h / 0.52));
  const gap = h / shelves;
  for (let s = 0; s < shelves; s++) {
    const shelfY = 0.06 + s * gap;
    // The shelf board itself, so the run reads as separated.
    rule(press, v,
      along === 'x' ? [x, shelfY, z] : [x, shelfY, z],
      along === 'x' ? [x + len, shelfY, z] : [x, shelfY, z + len], 0.55);

    let t = 0.04;
    while (t < len - 0.08) {
      const bw = 0.05 + r() * 0.05;
      if (t + bw > len - 0.06) break;
      const bh = gap * (0.5 + r() * 0.34);
      const ink = SPINE_INKS[Math.floor(r() * SPINE_INKS.length)]!;
      const bx = along === 'x' ? x + t : x + 0.04;
      const bz = along === 'x' ? z + 0.04 : z + t;
      box(press, ink, v, bx, shelfY, bz,
        along === 'x' ? bw : 0.16, bh, along === 'x' ? 0.16 : bw,
        { top: 0.4, left: 0.72, right: 0.9, weight: 0.5 });
      t += bw + 0.012 + r() * 0.02;
    }
  }
}

/** A table: a top, four legs, and nothing on it — that is the caller's job. */
export function table(
  press: Press, v: View, x: number, z: number, w: number, d: number,
  ink: Ink = 'brick', h = 0.62,
) {
  const leg = Math.min(0.12, Math.min(w, d) * 0.16);
  for (const [lx, lz] of [
    [x + 0.04, z + 0.04], [x + w - leg - 0.04, z + 0.04],
    [x + 0.04, z + d - leg - 0.04], [x + w - leg - 0.04, z + d - leg - 0.04],
  ]) {
    box(press, ink, v, lx!, 0, lz!, leg, h, leg, { top: 0.6, left: 0.8, right: 0.95, weight: 0.6 });
  }
  box(press, ink, v, x, h, z, w, 0.1, d, { top: 0.46, left: 0.7, right: 0.88 });
}

/** A chair. The back is what makes it a chair rather than a crate. */
export function seat(
  press: Press, v: View, x: number, z: number,
  ink: Ink = 'brick', back: 'x' | 'z' | 'none' = 'z', h = 0.4,
) {
  const s = 0.34;
  box(press, ink, v, x, 0, z, s, h, s, { top: 0.5, left: 0.74, right: 0.9, weight: 0.65 });
  if (back === 'none') return;
  if (back === 'z') box(press, ink, v, x, h, z, s, 0.46, 0.08, { top: 0.44, left: 0.7, right: 0.86, weight: 0.65 });
  else box(press, ink, v, x, h, z, 0.08, 0.46, s, { top: 0.44, left: 0.7, right: 0.86, weight: 0.65 });
}

/** A big soft chair, for the one person in the room who is settled. */
export function armchair(press: Press, v: View, x: number, z: number, ink: Ink = 'brick') {
  box(press, ink, v, x, 0, z, 0.62, 0.34, 0.6, { top: 0.52, left: 0.74, right: 0.9 });
  box(press, ink, v, x, 0.34, z, 0.62, 0.52, 0.12, { top: 0.44, left: 0.68, right: 0.86 });
  box(press, ink, v, x, 0.34, z, 0.12, 0.34, 0.6, { top: 0.48, left: 0.7, right: 0.88 });
  box(press, ink, v, x + 0.5, 0.34, z, 0.12, 0.34, 0.6, { top: 0.48, left: 0.7, right: 0.88 });
}

/** A rug, with a border, because a rug without one is a stain. */
export function rug(
  press: Press, v: View, x: number, z: number, w: number, d: number,
  ink: Ink = 'teal', density = 0.38,
) {
  slab(press, ink, v, x, z, w, d, density, 0.015);
  slab(press, ink, v, x + 0.12, z + 0.12, w - 0.24, d - 0.24, density * 0.45, 0.016);
}

/** A standing lamp, with the cone it throws. */
export function lamp(press: Press, v: View, x: number, z: number, h = 1.5, shade: Ink = 'teal') {
  box(press, 'navy', v, x + 0.11, 0, z + 0.11, 0.06, h, 0.06, { top: 0.6, left: 0.84, right: 0.95, weight: 0.55 });
  slab(press, 'navy', v, x, z, 0.28, 0.28, 0.72, 0.02);
  box(press, shade, v, x - 0.04, h, z - 0.04, 0.36, 0.26, 0.36, { top: 0.4, left: 0.68, right: 0.86 });
  cone(press, 'mustard', v, x + 0.14, h - 0.02, z + 0.14, 1.5, 0.5, Math.PI / 2, 0.45);
  glow(press, 'mustard', v, x + 0.14, 0, z + 0.14, 1.1, 0.4);
}

/** A candle, an oil lamp, a diya: a small light on top of something. */
export function flame(press: Press, v: View, x: number, y: number, z: number, size = 0.22) {
  if (v.still) {
    glow(press, 'mustard', v, x, 0, z, size * 5.5, 0.4);
    return;
  }
  // Flicker, from a couple of sines that do not share a period, so it never
  // settles into a visible beat.
  // One mark, not two. The second, darker spark inside the first is invisible
  // at anything under a hand's width and a room can hold twenty of these.
  const k = 1 + Math.sin(v.t * 9.1 + x * 4.3 + z * 2.7) * 0.2 + Math.sin(v.t * 14.7 + x) * 0.1;
  spark(press, 'mustard', v, x, y, z, size * k, 8);
}

/** A candlestick on a table: stem, cup, flame. */
export function candle(press: Press, v: View, x: number, y: number, z: number, ink: Ink = 'mustard') {
  if (v.still) {
    box(press, ink, v, x, y, z, 0.07, 0.3, 0.07, { top: 0.5, left: 0.76, right: 0.92, weight: 0.5 });
  }
  flame(press, v, x + 0.035, y + 0.34, z + 0.035, 0.2);
}

/** A stack of books, left on a table or on the floor. */
export function books(press: Press, v: View, x: number, y: number, z: number, n = 4, seed = 3) {
  const r = rand(seed);
  let h = y;
  for (let i = 0; i < n; i++) {
    const th = 0.06 + r() * 0.05;
    const jitter = (r() - 0.5) * 0.05;
    box(press, SPINE_INKS[Math.floor(r() * SPINE_INKS.length)]!, v,
      x + jitter, h, z + jitter, 0.3, th, 0.22,
      { top: 0.42, left: 0.7, right: 0.88, weight: 0.5 });
    h += th;
  }
}

/** One book, open, flat. The commonest thing on a floor in the reference. */
export function openBook(press: Press, v: View, x: number, z: number, y = 0.02) {
  slab(press, 'rose', v, x, z, 0.19, 0.26, 0.22, y, true, 0.6);
  slab(press, 'rose', v, x + 0.2, z, 0.19, 0.26, 0.28, y, true, 0.6);
}

/** Loose sheets, dropped. */
export function papers(press: Press, v: View, x: number, z: number, n = 3, seed = 9) {
  const r = rand(seed);
  for (let i = 0; i < n; i++) {
    slab(press, 'navy', v, x + (r() - 0.5) * 0.7, z + (r() - 0.5) * 0.7, 0.2, 0.26, 0.14, 0.02, true, 0.55);
  }
}

/** A plant in a pot. Two leaves and a pot is a plant; nobody counts. */
export function plant(press: Press, v: View, x: number, z: number, size = 1, ink: Ink = 'teal') {
  box(press, 'brick', v, x, 0, z, 0.3 * size, 0.26 * size, 0.3 * size,
    { top: 0.5, left: 0.74, right: 0.9, weight: 0.6 });
  const base = 0.26 * size;
  for (let i = 0; i < 5; i++) {
    const a = -0.9 + i * 0.45;
    blob(press, ink, v,
      x + 0.15 * size + Math.sin(a) * 0.2 * size, base + 0.18 * size + Math.cos(a) * 0.16 * size,
      z + 0.15 * size, 0.1 * size, 0.16 * size, 0.7);
  }
}

/** A tree: a trunk and a canopy of overlapping blobs. */
export function tree(press: Press, v: View, x: number, z: number, h = 2, ink: Ink = 'teal', seed = 5) {
  const r = rand(seed);
  box(press, 'brick', v, x, 0, z, 0.18, h * 0.55, 0.18, { top: 0.56, left: 0.8, right: 0.94, weight: 0.6 });
  for (let i = 0; i < 5; i++) {
    blob(press, ink, v,
      x + 0.09 + (r() - 0.5) * h * 0.4, h * 0.62 + (r() - 0.3) * h * 0.24, z + 0.09,
      h * (0.22 + r() * 0.12), h * (0.2 + r() * 0.1), 0.62);
  }
}

/** A ladder leaning on the shelves. Pure reference, and worth every line. */
export function ladder(press: Press, v: View, x: number, z: number, h = 1.9, ink: Ink = 'brick') {
  for (const off of [0, 0.34]) {
    rule(press, v, [x + off, 0, z], [x + off * 0.5 + 0.1, h, z], 0.7);
  }
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    rule(press, v, [x + t * 0.05, t * h, z], [x + 0.34 - t * 0.12, t * h, z], 0.55);
  }
  void ink;
}

/** A globe on a stand, which is always in the corner of a study. */
export function globe(press: Press, v: View, x: number, z: number, size = 0.5) {
  rule(press, v, [x, 0, z], [x, size * 0.9, z], 0.7);
  rule(press, v, [x - size * 0.2, 0, z], [x + size * 0.2, 0, z], 0.7);
  blob(press, 'teal', v, x, size * 1.15, z, size * 0.34, size * 0.34, 0.6);
  press.key((g) => {
    g.lineWidth = lw(v, 0.55);
    const [cx, cy] = project(v, x, size * 1.15, z);
    const rr = size * 0.34 * v.unit;
    g.beginPath();
    g.ellipse(cx, cy, rr * 0.42, rr, 0, 0, Math.PI * 2);
    g.moveTo(cx - rr, cy);
    g.lineTo(cx + rr, cy);
    g.stroke();
  });
}

/** A window or a picture, on the back-left wall. */
export function onWall(
  press: Press, v: View, x: number, y: number, w: number, h: number,
  ink: Ink = 'mustard', along: 'x' | 'z' = 'x', density = 0.5,
) {
  if (along === 'x') panel(press, ink, v, x, y, 0.02, w, h, density, 'x');
  else panel(press, ink, v, 0.02, y, x, w, h, density, 'z');
}

/** A doorway, cut in the back wall, with the light coming through it. */
export function doorway(press: Press, v: View, x: number, w = 0.7, h = 1.3, lit = false) {
  panel(press, 'navy', v, x, 0, 0.02, w, h, 0.82, 'x');
  if (lit) {
    panel(press, 'mustard', v, x + 0.06, 0, 0.03, w - 0.12, h - 0.1, 0.5, 'x');
    cone(press, 'mustard', v, x + w / 2, 0.1, 0.1, 2.2, 0.42, Math.PI / 2.6, 0.34);
  }
}

/** A fire, in a pit or a grate. */
export function fire(press: Press, v: View, x: number, z: number, size = 1) {
  if (v.still) {
    slab(press, 'navy', v, x - 0.2 * size, z - 0.2 * size, 0.7 * size, 0.7 * size, 0.6, 0.02);
    glow(press, 'mustard', v, x + 0.15 * size, 0, z + 0.15 * size, 2.4 * size, 0.5);
    return;
  }
  for (let i = 0; i < 2; i++) {
    const k = 1 + Math.sin(v.t * (7.3 + i * 1.7) + x * 3.1 + z) * 0.22;
    spark(press, i ? 'brick' : 'mustard', v,
      x + 0.15 * size + (i - 1) * 0.1 * size, (0.18 + i * 0.06) * size * k, z + 0.15 * size,
      (0.32 - i * 0.07) * size * k, 7);
  }
}

/** A cooking pot, a water jar, a basket: a fat little cylinder. */
export function pot(press: Press, v: View, x: number, z: number, size = 0.4, ink: Ink = 'brick') {
  blob(press, ink, v, x, size * 0.5, z, size * 0.44, size * 0.5, 0.74);
  slab(press, ink, v, x - size * 0.4, z - size * 0.2, size * 0.8, size * 0.4, 0.5, 0.02, false);
}

/** A low hill or a heap of stones, for the outdoor rooms. */
export function hill(press: Press, v: View, x: number, z: number, w: number, h: number, ink: Ink = 'teal') {
  blob(press, ink, v, x, h * 0.5, z, w * 0.5, h * 0.6, 0.55);
}

/** A stepped platform, a plinth, a throne dais. */
export function dais(press: Press, v: View, x: number, z: number, w: number, d: number, steps = 2, ink: Ink = 'rose') {
  for (let i = 0; i < steps; i++) {
    const inset = i * 0.22;
    box(press, ink, v, x + inset, i * 0.18, z + inset, w - inset * 2, 0.18, d - inset * 2,
      { top: 0.4, left: 0.64, right: 0.84 });
  }
}

/** Two posts and a lintel. */
export function arch(press: Press, v: View, x: number, z: number, w: number, h: number, ink: Ink = 'brick') {
  box(press, ink, v, x, 0, z, 0.18, h, 0.18, { top: 0.44, left: 0.68, right: 0.88 });
  box(press, ink, v, x + w - 0.18, 0, z, 0.18, h, 0.18, { top: 0.44, left: 0.68, right: 0.88 });
  box(press, ink, v, x, h, z, w, 0.22, 0.18, { top: 0.4, left: 0.64, right: 0.84 });
}

/** Pillars down one side, which is what makes an interior a hall. */
export function colonnade(
  press: Press, v: View, from: number, z: number, n: number, gap: number, h: number, ink: Ink = 'rose',
) {
  for (let i = 0; i < n; i++) {
    const x = from + i * gap;
    box(press, ink, v, x, 0, z, 0.22, h, 0.22, { top: 0.42, left: 0.66, right: 0.86 });
    box(press, ink, v, x - 0.04, h, z - 0.04, 0.3, 0.14, 0.3, { top: 0.38, left: 0.6, right: 0.8, weight: 0.7 });
  }
}

/** A counter, a workbench, a long low run of stuff along a wall. */
export function counter(
  press: Press, v: View, x: number, z: number, len: number, along: 'x' | 'z',
  ink: Ink = 'teal', h = 0.8,
) {
  const w = along === 'x' ? len : 0.44;
  const d = along === 'x' ? 0.44 : len;
  box(press, ink, v, x, 0, z, w, h, d, { top: 0.44, left: 0.68, right: 0.88 });
  const n = Math.max(2, Math.round(len / 0.55));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    if (along === 'x') rule(press, v, [x + t * len, 0.08, z + d], [x + t * len, h - 0.06, z + d], 0.5);
    else rule(press, v, [x + w, 0.08, z + t * len], [x + w, h - 0.06, z + t * len], 0.5);
  }
}

/** Small clutter, scattered: the things nobody put away. */
export function clutter(press: Press, v: View, w: number, d: number, n = 8, seed = 11) {
  const r = rand(seed);
  for (let i = 0; i < n; i++) {
    const x = 0.3 + r() * (w - 0.8);
    const z = 0.3 + r() * (d - 0.8);
    const pick = r();
    if (pick < 0.3) openBook(press, v, x, z);
    else if (pick < 0.55) books(press, v, x, 0, z, 1 + Math.floor(r() * 2), seed + i);
    else if (pick < 0.75) slab(press, 'mustard', v, x, z, 0.24, 0.18, 0.5, 0.02, true, 0.55);
    else blob(press, SPINE_INKS[Math.floor(r() * SPINE_INKS.length)]!, v, x, 0.08, z, 0.1, 0.1, 0.6);
  }
}
