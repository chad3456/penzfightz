import * as THREE from 'three';

/**
 * The loaded brush.
 *
 * This is the only part of the medium that is *drawn* rather than solved, and
 * it deliberately does very little: it lays down how much of each pigment is
 * sitting on the sheet and how much water came with it, and then hands the
 * whole thing to the solver, which decides where any of it ends up. The brush
 * is not painting the picture. It is wetting the paper in the shape of one.
 *
 * That split is what makes the style possible. If the brush drew the finished
 * mark it would have to fake bleeding, blooming, granulation and edge
 * darkening, and the fakes would be the same fakes on every stroke. Here a
 * stroke is three numbers per pixel and everything that makes it look like
 * paint happens afterwards, differently every time, because the water is
 * running over a different part of the sheet.
 *
 * Two things the brush does have to get right, because the solver cannot
 * invent them:
 *
 * **The load runs out.** A real brush is fullest where it lands and driest
 * where it leaves, and a stroke of even weight from end to end is the single
 * most obvious tell of a painting made by a computer.
 *
 * **The whites are reserved, not added.** You cannot paint white back on. Every
 * light in the picture has to be paper that was never touched, so the brush
 * skips — it rides the high points and misses the pits, harder the drier it is.
 */

export interface Mark {
  /** How much cool pigment, how much warm. Either may be zero. */
  cool: number;
  warm: number;
  /** Water carried. High is a wash that will run; low is a mark that stays. */
  water: number;
  /** Nib width in sheet units (fraction of the short side). */
  width: number;
  /** Width at the end of the stroke as a fraction of the start. */
  taper?: number;
  /** 0 fully loaded, 1 nearly dry: how much paper the stroke skips. */
  dry?: number;
  /** Scale of the skipping, in sheet units. Large is scrubbed, small is grainy. */
  tooth?: number;
  /** Load left at the end of the stroke, as a fraction of the start. */
  runout?: number;
  /** Softness of the edge across the nib, 0 hard to 1 all falloff. */
  soft?: number;
}

const mulberry = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Cheap 2-D value noise. The brush needs a field, not a sequence. */
function field(seed: number) {
  const g = new Float32Array(64 * 64);
  const r = mulberry(seed);
  for (let i = 0; i < g.length; i++) g[i] = r();
  const fade = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const tx = fade(x - x0);
    const ty = fade(y - y0);
    const i0 = ((x0 % 64) + 64) % 64;
    const j0 = ((y0 % 64) + 64) % 64;
    const i1 = (i0 + 1) % 64;
    const j1 = (j0 + 1) % 64;
    const a = g[j0 * 64 + i0] * (1 - tx) + g[j0 * 64 + i1] * tx;
    const b = g[j1 * 64 + i0] * (1 - tx) + g[j1 * 64 + i1] * tx;
    return a * (1 - ty) + b * ty;
  };
}

export type Pt = [number, number];

/**
 * The wet sheet, before the water has done anything.
 *
 * Held as floats rather than as a canvas because pigment load is not bounded at
 * one: three passes of the same dark over each other is a legitimate thing to
 * ask for, and it has to survive into the solver rather than clip.
 */
export class Load {
  readonly w: number;
  readonly h: number;
  readonly px: Float32Array;
  private skip: (x: number, y: number) => number;
  private wob: (x: number, y: number) => number;
  private texture: THREE.DataTexture | null = null;
  private mode: 'add' | 'max' = 'add';

  constructor(w: number, h: number, seed: number) {
    this.w = w;
    this.h = h;
    this.px = new Float32Array(w * h * 4);
    this.skip = field(seed ^ 0x1f77);
    this.wob = field(seed ^ 0x9b31);
  }

  /**
   * New paper grain, same buffer.
   *
   * A thousand paintings would otherwise be a thousand float buffers and a
   * thousand GPU textures created and thrown away; the sheet is the expensive
   * part and it is the same size every time. Only the two noise fields have to
   * change, or every figure in the gallery skips the paper in the same places.
   */
  reseed(seed: number) {
    this.skip = field(seed ^ 0x1f77);
    this.wob = field(seed ^ 0x9b31);
    this.px.fill(0);
  }

  clear() {
    this.px.fill(0);
  }

  /**
   * Sheet units to buffer rows: x across, y *down*, both 0..1.
   *
   * The row flip is not a detail. This buffer is uploaded as a texture and read
   * by the solver in UV space, where v = 0 is the bottom of the picture, while
   * every coordinate in the figure code has y increasing downwards the way a
   * page does. Miss it and the whole gallery is painted upside down — which is
   * exactly how the first one came out, and it is not immediately obvious,
   * because a watercolour of a person standing on their head is still a
   * perfectly plausible watercolour until you look for the feet.
   */
  private at(x: number, y: number) {
    return [x * this.w, (1 - y) * this.h] as Pt;
  }

  /**
   * One shape, or many marks?
   *
   * A body is *one* shape. Painted as eleven overlapping ribbons that add
   * together, every joint comes out darker than the limbs either side of it —
   * which is exactly backwards, because a shoulder is where a silhouette is
   * thickest, not where it is darkest, and the first figures here read as
   * insects for precisely that reason. Under `max` a group of marks covers the
   * paper once however many times it is painted over, and the arm that passes
   * in front of the body disappears into it the way it should.
   *
   * Marks that are genuinely separate events — a second wash, a dark laid over
   * a dry one — stay additive, because those really do build.
   */
  group(mode: 'add' | 'max', fn: () => void) {
    const was = this.mode;
    this.mode = mode;
    fn();
    this.mode = was;
  }

  private put(gx: number, gy: number, cool: number, warm: number, water: number) {
    const x = gx | 0;
    const y = gy | 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    if (this.mode === 'max') {
      if (cool > this.px[i]) this.px[i] = cool;
      if (warm > this.px[i + 1]) this.px[i + 1] = warm;
    } else {
      this.px[i] += cool;
      this.px[i + 1] += warm;
    }
    if (water > this.px[i + 2]) this.px[i + 2] = water;
  }

  /**
   * Drag a loaded brush along a path.
   *
   * Resampled to even steps and smoothed twice, because a brush arriving at a
   * corner does not turn it — it rounds it, and the amount it rounds it by is
   * one of the things that reads as a hand.
   */
  stroke(path: Pt[], m: Mark) {
    if (path.length < 2) return;
    let pts = path.map((p) => this.at(p[0], p[1]));
    for (let pass = 0; pass < 2; pass++) {
      const out: Pt[] = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, ay] = pts[i];
        const [bx, by] = pts[i + 1];
        out.push([ax + (bx - ax) * 0.25, ay + (by - ay) * 0.25]);
        out.push([ax + (bx - ax) * 0.75, ay + (by - ay) * 0.75]);
      }
      out.push(pts[pts.length - 1]);
      pts = out;
    }

    // Even spacing along the path, so load per unit length is constant.
    const even: Pt[] = [pts[0]];
    let carry = 0;
    const step = 0.5;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      const len = Math.hypot(bx - ax, by - ay);
      let t = carry;
      while (t < len) {
        even.push([ax + ((bx - ax) * t) / len, ay + ((by - ay) * t) / len]);
        t += step;
      }
      carry = t - len;
    }
    if (even.length < 2) return;

    const short = Math.min(this.w, this.h);
    const w0 = Math.max(0.7, m.width * short);
    const taper = m.taper ?? 1;
    const dry = m.dry ?? 0;
    const soft = m.soft ?? 0.45;
    const runout = m.runout ?? 0.72;
    const toothScale = 1 / Math.max(1e-4, (m.tooth ?? 0.06) * short);
    const wide = w0 * Math.max(1, taper);

    for (let i = 0; i < even.length; i++) {
      const t = i / (even.length - 1);
      const [cx, cy] = even[i];
      const [px, py] = even[Math.max(0, i - 1)];
      const dx = cx - px;
      const dy = cy - py;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      const width = w0 * (1 + (taper - 1) * t);
      const load = 1 + (runout - 1) * t;
      const span = Math.max(2, wide * 2);

      for (let s = -span; s <= span; s++) {
        const u = s / Math.max(1e-4, width);
        if (Math.abs(u) > 1) continue;
        // Across the nib: flat in the middle, falling off at the edge. A
        // Gaussian all the way across makes every stroke look airbrushed.
        const across = soft <= 0 ? 1 : Math.min(1, (1 - Math.abs(u)) / soft);
        const gx = cx + nx * s;
        const gy = cy + ny * s;
        const bite = this.skip(gx * toothScale, gy * toothScale);
        const hold = across * load;
        const k = hold * (1 - dry * (1 - bite) * 1.4);
        if (k <= 0.01) continue;
        this.put(gx, gy, m.cool * k, m.warm * k, m.water * Math.min(1, hold * 1.6));
      }
    }
  }

  /**
   * Flood a shape. The edge wobbles at brush scale, not at pixel scale — a
   * shape with a clean outline reads as a fill however wet it is afterwards.
   */
  mass(poly: Pt[], m: Mark) {
    if (poly.length < 3) return;
    const pts = poly.map((p) => this.at(p[0], p[1]));
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [x, y] of pts) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    const short = Math.min(this.w, this.h);
    const wobble = (m.width ?? 0.02) * short;
    const dry = m.dry ?? 0;
    const toothScale = 1 / Math.max(1e-4, (m.tooth ?? 0.08) * short);

    for (let y = Math.max(0, Math.floor(minY) - 2); y <= Math.min(this.h - 1, maxY + 2); y++) {
      for (let x = Math.max(0, Math.floor(minX) - 2); x <= Math.min(this.w - 1, maxX + 2); x++) {
        const ox = this.wob(x * 0.09, y * 0.09) - 0.5;
        const oy = this.wob(x * 0.09 + 21, y * 0.09 + 13) - 0.5;
        if (!inside(pts, x + ox * wobble * 2, y + oy * wobble * 2)) continue;
        const bite = this.skip(x * toothScale, y * toothScale);
        const k = 1 - dry * (1 - bite) * 1.5;
        if (k <= 0.02) continue;
        this.put(x, y, m.cool * k, m.warm * k, m.water);
      }
    }
  }

  /** A single press of the brush. The head, a hand, a stone in the water. */
  dab(x: number, y: number, rx: number, ry: number, rot: number, m: Mark) {
    const short = Math.min(this.w, this.h);
    const [cx, cy] = this.at(x, y);
    const a = rx * short;
    const b = ry * short;
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    const r = Math.max(a, b) + 2;
    const dry = m.dry ?? 0;
    const soft = m.soft ?? 0.4;
    for (let gy = Math.floor(cy - r); gy <= cy + r; gy++) {
      for (let gx = Math.floor(cx - r); gx <= cx + r; gx++) {
        const dx = gx - cx;
        const dy = gy - cy;
        const u = (dx * c + dy * s) / a;
        const v = (-dx * s + dy * c) / b;
        const d = Math.hypot(u, v) * (0.94 + this.wob(gx * 0.16, gy * 0.16) * 0.12);
        if (d > 1) continue;
        const across = soft <= 0 ? 1 : Math.min(1, (1 - d) / soft);
        const bite = this.skip(gx * 0.12, gy * 0.12);
        const k = across * (1 - dry * (1 - bite) * 1.4);
        if (k <= 0.02) continue;
        this.put(gx, gy, m.cool * k, m.warm * k, m.water * Math.min(1, across * 1.6));
      }
    }
  }

  /** Upload as-is. One texel per simulation cell, so no filtering is wanted. */
  toTexture(): THREE.DataTexture {
    if (!this.texture) {
      this.texture = new THREE.DataTexture(this.px, this.w, this.h, THREE.RGBAFormat,
        THREE.FloatType);
      this.texture.minFilter = THREE.NearestFilter;
      this.texture.magFilter = THREE.NearestFilter;
    }
    this.texture.needsUpdate = true;
    return this.texture;
  }

  dispose() {
    this.texture?.dispose();
    this.texture = null;
  }
}

function inside(poly: Pt[], x: number, y: number) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
