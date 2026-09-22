/**
 * The plate: everything on the sheet that does not move.
 *
 * Walls, water, the wood, the rock, the lettering, the cartouche and the
 * compass are drawn once into an offscreen canvas that covers rather more
 * than the window, and then blitted. Only the people are redrawn every frame.
 *
 * That split is the whole performance story. Ink is expensive — every line on
 * this map is resampled and wobbled and drawn in short segments — and there
 * are a few thousand of them. Drawing them at sixty hertz is out of the
 * question; drawing them once every time the view leaves the margin costs
 * about a fifth of a second and then nothing at all.
 */

import { PIECES, PLACES, WAYS, EXTENT, type Piece, type Shape } from './plan';
import {
  circlePath, hatch, INK, INK_PALE, INK_RED, line, nib, parchment, ring, type Pt,
} from './paper';
import { scribe } from './scribe';

export interface View {
  /** Pixels per stud. */
  scale: number;
  /** World point at the centre of the window. */
  cx: number;
  cz: number;
  /** Window size, in CSS pixels. */
  w: number;
  h: number;
}

const rnd = (s: number) => {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* ── shapes, in world units ───────────────────────────────────────────── */

/** A rectangle's outline as a polygon, with the corners left sharp. */
const rectPath = (x: number, z: number, w: number, d: number): Pt[] =>
  [[x, z], [x + w, z], [x + w, z + d], [x, z + d]];

/**
 * A coastline.
 *
 * The rock in the model is a rectangle because bricks are rectangles. On a map
 * it has to be a shore, so the rectangle is walked round and every sample is
 * pushed in or out by a slow wave. Seeded from the rectangle, so the same rock
 * has the same coast every time the plate is redrawn — otherwise the island
 * breathes whenever you pan.
 */
function coast(x: number, z: number, w: number, d: number, amp: number, seed: number): Pt[] {
  const out: Pt[] = [];
  const per = 2.4;
  const walk = (ax: number, az: number, bx: number, bz: number) => {
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(2, Math.round(len / per));
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const px = ax + (bx - ax) * t;
      const pz = az + (bz - az) * t;
      const s = seed + px * 0.21 + pz * 0.17;
      const push = (Math.sin(s * 1.7) * 0.6 + Math.sin(s * 4.3 + 1.1) * 0.3 + Math.sin(s * 9.1) * 0.1) * amp;
      const nx = (bz - az) / (len || 1);
      const nz = -(bx - ax) / (len || 1);
      out.push([px + nx * push, pz + nz * push]);
    }
  };
  walk(x, z, x + w, z);
  walk(x + w, z, x + w, z + d);
  walk(x + w, z + d, x, z + d);
  walk(x, z + d, x, z);
  return out;
}

/** Push a closed polygon out from its own centre. Good enough for a shoreline. */
function swell(pts: Pt[], by: number): Pt[] {
  let cx = 0;
  let cz = 0;
  for (const [x, z] of pts) { cx += x; cz += z; }
  cx /= pts.length;
  cz /= pts.length;
  return pts.map(([x, z]) => {
    const dx = x - cx;
    const dz = z - cz;
    const l = Math.hypot(dx, dz) || 1;
    return [x + (dx / l) * by, z + (dz / l) * by] as Pt;
  });
}

const ROCKS: { pts: Pt[]; seed: number }[] = [
  { pts: coast(-50, -30, 110, 70, 2.6, 3), seed: 3 },
  { pts: coast(5, 47, 100, 72, 3.2, 11), seed: 11 },
  { pts: coast(-90, -62, 34, 20, 1.6, 21), seed: 21 },
];

/* ── the plate ────────────────────────────────────────────────────────── */

export class Plate {
  /*
    Two canvases, not one.

    The sheet starts blank and the ink arrives when you say the words, so the
    parchment and what is written on it have to be separable. Keeping them as
    two layers means the reveal is a clip on the second blit and nothing else
    — no masking buffer, no per-pixel work, and the paper underneath is the
    same paper before and after, which it would not be if the blank sheet were
    drawn by a different code path.
  */
  private paper = document.createElement('canvas');
  private canvas = document.createElement('canvas');
  private g = this.canvas.getContext('2d')!;
  /** World rect the cached canvas covers. */
  private rect = { x0: 0, z0: 0, x1: 0, z1: 0 };
  private scale = 0;
  /** How long the last redraw took, in milliseconds. */
  lastDraw = 0;
  /** The cached canvases' size in layout pixels, for culling. */
  private plateW = 0;
  private plateH = 0;

  /** Redraw if the window has left the margin or the zoom has changed. */
  ensure(v: View) {
    const halfW = v.w / 2 / v.scale;
    const halfH = v.h / 2 / v.scale;
    const need = { x0: v.cx - halfW, z0: v.cz - halfH, x1: v.cx + halfW, z1: v.cz + halfH };
    const inside =
      need.x0 >= this.rect.x0 && need.x1 <= this.rect.x1 &&
      need.z0 >= this.rect.z0 && need.z1 <= this.rect.z1;
    const sameScale = Math.abs(v.scale - this.scale) / (this.scale || 1) < 0.015;
    if (inside && sameScale) return false;

    // A third of a window of margin in every direction, so an ordinary drag
    // never needs a redraw.
    const mx = halfW * 0.6;
    const mz = halfH * 0.6;
    this.rect = { x0: need.x0 - mx, z0: need.z0 - mz, x1: need.x1 + mx, z1: need.z1 + mz };
    this.scale = v.scale;
    this.draw();
    return true;
  }

  /** Where the cached canvases sit in window pixels. */
  private origin(v: View): [number, number] {
    return [
      Math.round((this.rect.x0 - v.cx) * v.scale + v.w / 2),
      Math.round(-(this.rect.z1 - v.cz) * v.scale + v.h / 2),
    ];
  }

  blitPaper(g: CanvasRenderingContext2D, v: View) {
    const [x, y] = this.origin(v);
    g.drawImage(this.paper, x, y);
  }

  blitInk(g: CanvasRenderingContext2D, v: View) {
    const [x, y] = this.origin(v);
    g.drawImage(this.canvas, x, y);
  }

  /** World → plate pixels. */
  px = (x: number) => (x - this.rect.x0) * this.scale;
  py = (z: number) => (this.rect.z1 - z) * this.scale;

  private path(s: Shape, inset = 0): Pt[] {
    if (s.t === 'rect') {
      return rectPath(s.x + inset, s.z + inset, s.w - inset * 2, s.d - inset * 2)
        .map(([x, z]) => [this.px(x), this.py(z)] as Pt);
    }
    if (s.t === 'disc') {
      return circlePath(this.px(s.x), this.py(s.z), Math.max(0.5, (s.r - inset) * this.scale), 72);
    }
    return s.pts.map(([x, z]) => [this.px(x), this.py(z)] as Pt);
  }

  private bbox(s: Shape): [number, number, number, number] {
    if (s.t === 'rect') {
      return [this.px(s.x), this.py(s.z + s.d), s.w * this.scale, s.d * this.scale];
    }
    if (s.t === 'disc') {
      const r = s.r * this.scale;
      return [this.px(s.x) - r, this.py(s.z) - r, r * 2, r * 2];
    }
    let x0 = Infinity; let x1 = -Infinity; let z0 = Infinity; let z1 = -Infinity;
    for (const [x, z] of s.pts) {
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
    }
    return [this.px(x0), this.py(z1), (x1 - x0) * this.scale, (z1 - z0) * this.scale];
  }

  private draw() {
    const t0 = performance.now();
    const w = Math.max(1, Math.ceil((this.rect.x1 - this.rect.x0) * this.scale));
    const h = Math.max(1, Math.ceil((this.rect.z1 - this.rect.z0) * this.scale));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const pw = Math.min(4096, Math.round(w * dpr));
    const ph = Math.min(4096, Math.round(h * dpr));
    for (const c of [this.paper, this.canvas]) {
      c.width = pw;
      c.height = ph;
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
    }

    const pg = this.paper.getContext('2d')!;
    pg.setTransform(pw / w, 0, 0, ph / h, 0, 0);
    pg.clearRect(0, 0, w, h);
    parchment(pg, w, h, { scale: this.scale, ox: this.rect.x0, oy: -this.rect.z1 });

    const g = this.g;
    g.setTransform(pw / w, 0, 0, ph / h, 0, 0);
    g.clearRect(0, 0, w, h);

    this.plateW = w;
    this.plateH = h;
    const s = this.scale;
    this.water(g, s);
    this.land(g, s);
    this.wood(g, s);
    this.tracks(g, s);
    for (const p of PIECES) this.piece(g, p, s);
    this.labels(g, s);
    this.furniture(g, w, h, s);

    this.lastDraw = performance.now() - t0;
  }

  /* ── the lake ──────────────────────────────────────────────────────── */

  /**
   * Water lines: four contours following each shore and fading outwards.
   *
   * The map convention, and cheaper than hatching the whole lake — which is
   * the first thing anyone tries and which buries the sheet under about nine
   * thousand strokes for a result that reads as corduroy.
   */
  private water(g: CanvasRenderingContext2D, s: number) {
    for (const rock of ROCKS) {
      for (let k = 1; k <= 4; k++) {
        const pts = swell(rock.pts, k * 3.4).map(([x, z]) => [this.px(x), this.py(z)] as Pt);
        ring(g, pts, nib({
          ink: INK_PALE,
          width: Math.max(0.5, s * 0.1),
          wobble: s * 0.14,
          alpha: 0.4 - k * 0.07,
        }), rock.seed + k * 5);
      }
    }
  }

  private land(g: CanvasRenderingContext2D, s: number) {
    for (const rock of ROCKS) {
      const pts = rock.pts.map(([x, z]) => [this.px(x), this.py(z)] as Pt);
      // A pale wash inside the shore, so the land is not the same tone as the
      // lake and the eye gets the figure–ground for free.
      g.save();
      g.beginPath();
      g.moveTo(pts[0]![0], pts[0]![1]);
      for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
      g.closePath();
      g.fillStyle = 'rgba(243, 233, 205, 0.5)';
      g.fill();
      g.restore();
      ring(g, pts, nib({ ink: INK, width: Math.max(0.7, s * 0.16), wobble: s * 0.1, passes: 2 }), rock.seed);
    }
  }

  /** The wood: a few hundred little ink crowns on the far rock. */
  private wood(g: CanvasRenderingContext2D, s: number) {
    if (s < 1.4) return;
    g.save();
    g.strokeStyle = INK;
    g.lineWidth = Math.max(0.4, s * 0.09);
    g.lineCap = 'round';
    for (let i = 0; i < 210; i++) {
      const x = 16 + rnd(i * 3.1) * 78;
      const z = 62 + rnd(i * 5.7 + 2) * 50;
      if (x < 30 && z < 76) continue; // the bridge landing is kept clear
      const px = this.px(x);
      const py = this.py(z);
      if (px < -20 || py < -20 || px > this.plateW + 20 || py > this.plateH + 20) continue;
      const r = (1.1 + rnd(i * 9.3) * 0.7) * s;
      g.globalAlpha = 0.5 + rnd(i * 7.1) * 0.35;
      g.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = Math.PI + (k / 5) * Math.PI;
        const b = Math.PI + ((k + 1) / 5) * Math.PI;
        g.arc(px + Math.cos((a + b) / 2) * r * 0.62, py + Math.sin((a + b) / 2) * r * 0.5, r * 0.42, 0, Math.PI * 2);
      }
      g.stroke();
      g.beginPath();
      g.moveTo(px, py + r * 0.3);
      g.lineTo(px, py + r * 1.1);
      g.stroke();
    }
    g.restore();
  }

  /* ── the building ──────────────────────────────────────────────────── */

  private piece(g: CanvasRenderingContext2D, p: Piece, s: number) {
    const box = this.bbox(p.shape);
    if (box[0] + box[2] < -40 || box[1] + box[3] < -40) return;
    if (box[0] > this.plateW + 40 || box[1] > this.plateH + 40) return;
    const seed = p.id.length * 31 + p.id.charCodeAt(0);

    if (p.kind === 'rock') return; // drawn with the coast

    if (p.kind === 'water') {
      const out = this.path(p.shape);
      ring(g, out, nib({ ink: INK, width: Math.max(0.6, s * 0.13), wobble: s * 0.06 }), seed);
      g.save();
      g.globalAlpha = 0.5;
      g.strokeStyle = INK_PALE;
      g.lineWidth = Math.max(0.4, s * 0.08);
      const [bx, by, bw, bh] = box;
      for (let i = 1; i < 5; i++) {
        g.beginPath();
        g.moveTo(bx + bw * 0.15, by + (bh * i) / 5);
        g.lineTo(bx + bw * 0.85, by + (bh * i) / 5);
        g.stroke();
      }
      g.restore();
      return;
    }

    if (p.kind === 'deck') {
      const out = this.path(p.shape);
      ring(g, out, nib({ ink: INK, width: Math.max(0.6, s * 0.14), wobble: s * 0.08 }), seed);
      // Planks, across the short way.
      if (p.shape.t === 'rect' && s > 1.2) {
        const along = p.shape.d > p.shape.w;
        const n = Math.round((along ? p.shape.d : p.shape.w) / 2.5);
        g.save();
        g.strokeStyle = INK_PALE;
        g.globalAlpha = 0.45;
        g.lineWidth = Math.max(0.35, s * 0.07);
        for (let i = 1; i < n; i++) {
          const t = i / n;
          g.beginPath();
          if (along) {
            const z = p.shape.z + p.shape.d * t;
            g.moveTo(this.px(p.shape.x), this.py(z));
            g.lineTo(this.px(p.shape.x + p.shape.w), this.py(z));
          } else {
            const x = p.shape.x + p.shape.w * t;
            g.moveTo(this.px(x), this.py(p.shape.z));
            g.lineTo(this.px(x), this.py(p.shape.z + p.shape.d));
          }
          g.stroke();
        }
        g.restore();
      }
      return;
    }

    if (p.kind === 'open') {
      ring(g, this.path(p.shape), nib({
        ink: INK_PALE, width: Math.max(0.4, s * 0.09), wobble: s * 0.07, alpha: 0.6,
      }), seed);
      return;
    }

    /*
      Walled: two outlines and poché between them.

      The band is clipped with an even-odd path made of the outer figure and
      the inner one, which is the one trick that makes this work for a
      rectangle and a circle without writing a polygon offsetter.
    */
    const t = p.wall ?? 1.5;
    const outer = this.path(p.shape, 0);
    const inner = this.path(p.shape, t);
    g.save();
    hatch(g, () => {
      g.moveTo(outer[0]![0], outer[0]![1]);
      for (const [x, y] of outer.slice(1)) g.lineTo(x, y);
      g.closePath();
      g.moveTo(inner[0]![0], inner[0]![1]);
      for (const [x, y] of inner.slice(1)) g.lineTo(x, y);
      g.closePath();
    }, box, Math.max(1.3, Math.min(4.6, s * 0.5)), nib({
      ink: INK, width: Math.max(0.35, s * 0.075), alpha: 0.55,
    }), Math.PI / 4, seed);
    g.restore();

    const nb = nib({ ink: INK, width: Math.max(0.7, s * 0.16), wobble: s * 0.07, passes: 2 });
    ring(g, outer, nb, seed);
    ring(g, inner, nb, seed + 97);
  }

  /**
   * Room names, and the names of places.
   *
   * Both are capped. Lettering that simply scales with the zoom is how a map
   * made of vectors gives itself away: lean all the way in on the hall and
   * 'The Great Hall' is four hundred pixels tall and the room it names has
   * gone. A label on a real sheet is a fixed size in ink, so past a certain
   * zoom these stop growing and the building grows past them, which is what
   * the eye expects even though nobody can say why.
   */
  private labels(g: CanvasRenderingContext2D, s: number) {
    const ink = nib({ ink: INK, width: Math.max(0.45, Math.min(1.5, s * 0.1)), wobble: Math.min(0.5, s * 0.04), tremble: 0.7, passes: 1 });
    for (const p of PIECES) {
      if (!p.label) continue;
      const { text, at, size, angle } = p.label;
      const em = Math.min(size * s, size * 7.5);
      if (em < 6) continue;
      scribe(g, text, this.px(at[0]), this.py(at[1]), {
        size: em, nib: ink, align: 'center', angle, seed: at[0] + at[1],
      });
    }
    const big = nib({ ink: INK_PALE, width: Math.max(0.5, Math.min(1.8, s * 0.11)), wobble: Math.min(0.6, s * 0.05), passes: 1, alpha: 0.75 });
    for (const pl of PLACES) {
      const em = Math.min(pl.size * s, pl.size * 7.5);
      if (em < 6) continue;
      scribe(g, pl.text, this.px(pl.at[0]), this.py(pl.at[1]), {
        size: em, nib: big, align: 'center', angle: pl.angle, tracking: 0.16, seed: pl.at[0],
      });
    }
  }

  /**
   * The tracks across the grounds.
   *
   * Only the ways that are out of doors, and only the ones that are not
   * secret. Inside the building the walls say where a corridor goes; outside
   * there are no walls, so without these the whole west side of the sheet is
   * a blank rock with a boathouse at the bottom of it and no way of telling
   * that you can get from one to the other.
   */
  private tracks(g: CanvasRenderingContext2D, s: number) {
    g.save();
    g.strokeStyle = INK_PALE;
    g.lineCap = 'round';
    for (const way of WAYS) {
      if (way.secret || !way.outside) continue;
      const pts = way.pts.map(([x, z]) => [this.px(x), this.py(z)] as Pt);
      for (const [k, dash] of ([[0, [s * 1.1, s * 1.3]], [1, [s * 0.16, s * 2.2]]] as const)) {
        g.setLineDash([...dash]);
        g.lineDashOffset = k ? s * 0.6 : 0;
        g.globalAlpha = k ? 0.3 : 0.5;
        g.lineWidth = Math.max(0.5, s * (k ? 0.1 : 0.14));
        g.beginPath();
        g.moveTo(pts[0]![0], pts[0]![1]);
        for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
        g.stroke();
      }
    }
    g.restore();
  }

  /* ── what is drawn in the margins ──────────────────────────────────── */

  private furniture(g: CanvasRenderingContext2D, w: number, h: number, s: number) {
    void w; void h;
    // ── the compass, out in the lake to the south-east
    const cx = this.px(96);
    const cy = this.py(-56);
    const r = 13 * s;
    if (cx > -r * 3 && cy > -r * 3 && cx < this.plateW + r * 3 && cy < this.plateH + r * 3) {
      const fine = nib({ ink: INK, width: Math.max(0.5, s * 0.11), wobble: s * 0.05 });
      ring(g, circlePath(cx, cy, r, 48), fine, 5);
      ring(g, circlePath(cx, cy, r * 0.78, 40), nib({ ...fine, alpha: 0.5 }), 6);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const long = i % 2 === 0;
        const rr = long ? r : r * 0.5;
        line(g, [
          [cx, cy],
          [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr],
        ], nib({ ...fine, alpha: long ? 0.8 : 0.4 }), 7 + i);
      }
      // The needle, and a fleur that is only a long thin triangle.
      line(g, [[cx - r * 0.13, cy + r * 0.2], [cx, cy - r * 1.18], [cx + r * 0.13, cy + r * 0.2]],
        nib({ ink: INK_RED, width: Math.max(0.6, s * 0.14), wobble: s * 0.04, passes: 2 }), 9);
      scribe(g, 'N', cx, cy - r * 1.34, {
        size: 3.4 * s, nib: fine, align: 'center', seed: 4,
      });
    }

    // ── the scale bar, under the compass
    const bx = this.px(80);
    const by = this.py(-76);
    if (bx > -400 && by > -200 && bx < this.plateW + 400 && by < this.plateH + 200) {
      const unit = 10 * s;
      const fine = nib({ ink: INK, width: Math.max(0.5, s * 0.1), wobble: s * 0.04 });
      line(g, [[bx, by], [bx + unit * 4, by]], fine, 11);
      for (let i = 0; i <= 4; i++) {
        line(g, [[bx + unit * i, by - 3 * s * 0.5], [bx + unit * i, by + 3 * s * 0.5]], fine, 12 + i);
      }
      g.save();
      g.globalAlpha = 0.6;
      g.fillStyle = INK;
      for (let i = 0; i < 4; i += 2) g.fillRect(bx + unit * i, by - s * 0.9, unit, s * 1.8);
      g.restore();
      scribe(g, 'forty paces', bx + unit * 2, by + 6 * s, {
        size: 2.4 * s, nib: fine, align: 'center', seed: 17,
      });
    }

    // ── the cartouche, north-west, where the lake is empty
    // Out in the empty north-west water, where it is off the screen at the
    // opening zoom and has to be found by panning. A cartouche that sits in
    // the middle of the view is a watermark; a cartouche you come across in a
    // corner of the sheet is a cartouche.
    const tx = this.px(-100);
    const ty = this.py(92);
    if (tx > -900 && ty > -500 && tx < this.plateW + 900 && ty < this.plateH + 500) {
      const fine = nib({ ink: INK, width: Math.max(0.5, s * 0.11), wobble: s * 0.06 });
      const wBox = 58 * s;
      const hBox = 34 * s;
      ring(g, [
        [tx - wBox / 2, ty - hBox / 2], [tx + wBox / 2, ty - hBox / 2],
        [tx + wBox / 2, ty + hBox / 2], [tx - wBox / 2, ty + hBox / 2],
      ], fine, 21);
      ring(g, [
        [tx - wBox / 2 + s, ty - hBox / 2 + s], [tx + wBox / 2 - s, ty - hBox / 2 + s],
        [tx + wBox / 2 - s, ty + hBox / 2 - s], [tx - wBox / 2 + s, ty + hBox / 2 - s],
      ], nib({ ...fine, alpha: 0.45 }), 22);
      scribe(g, "The Nightwalkers' Map", tx, ty - hBox * 0.18, {
        size: 5.2 * s, nib: fine, align: 'center', seed: 31,
      });
      scribe(g, 'of Hallowdene and its grounds', tx, ty + hBox * 0.06, {
        size: 2.6 * s, nib: nib({ ...fine, alpha: 0.7 }), align: 'center', seed: 32,
      });
      const names = 'Odile Vance · Toby Marchmain · Ruth Okonjo · Sparrow';
      scribe(g, names, tx, ty + hBox * 0.3, {
        size: 1.9 * s, nib: nib({ ink: INK_PALE, width: Math.max(0.4, s * 0.09), wobble: s * 0.04, alpha: 0.7 }),
        align: 'center', seed: 33,
      });
      scribe(g, 'drawn from the inside, at night', tx, ty + hBox * 0.42, {
        size: 1.7 * s, nib: nib({ ink: INK_PALE, width: Math.max(0.4, s * 0.08), alpha: 0.55 }),
        align: 'center', seed: 34,
      });
    }
  }
}

/** The zoom that fits the whole estate into a window. */
export function fitScale(w: number, h: number) {
  return Math.min(w / (EXTENT.x1 - EXTENT.x0), h / (EXTENT.z1 - EXTENT.z0)) * 0.96;
}
