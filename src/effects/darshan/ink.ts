import type { Pt } from './rig';
import type { Tone } from './palette';

/**
 * Flat colour, and the one light.
 *
 * There is no outline anywhere in this style — every edge is a change of fill —
 * so the primitives here are all *shapes*, never strokes. What holds thirty
 * separate shapes together as one body is that they share a terminator: a
 * single line across the whole card with the lit side on one hand and the
 * shadow on the other. Each part is painted its light colour, then the shadow
 * colour is painted over it clipped to that part, and because every part is
 * clipped against the same line the arm, the sash and the mace all turn away
 * from the light at the same moment.
 *
 * Get that wrong — shade each part on its own local normal, which is the
 * obvious thing — and you get thirty small correctly-lit objects that do not
 * add up to a person.
 */

export interface Frame {
  g: CanvasRenderingContext2D;
  /** Figure height in pixels. */
  h: number;
  /** Where the crown of the head sits on the canvas. */
  x: number;
  y: number;
}

export const at = (f: Frame, p: Pt): Pt => [f.x + p[0] * f.h, f.y + p[1] * f.h];

export function poly(f: Frame, pts: Pt[], colour: string, alpha = 1) {
  if (pts.length < 3) return;
  const g = f.g;
  g.globalAlpha = alpha;
  g.fillStyle = colour;
  g.beginPath();
  const a = at(f, pts[0]);
  g.moveTo(a[0], a[1]);
  for (let i = 1; i < pts.length; i++) {
    const p = at(f, pts[i]);
    g.lineTo(p[0], p[1]);
  }
  g.closePath();
  g.fill();
  g.globalAlpha = 1;
}

/** The same, with the corners rounded off by cutting through the midpoints. */
export function blob(f: Frame, pts: Pt[], colour: string, alpha = 1) {
  if (pts.length < 3) return;
  const g = f.g;
  const q = pts.map((p) => at(f, p));
  g.globalAlpha = alpha;
  g.fillStyle = colour;
  g.beginPath();
  const m0: Pt = [(q[q.length - 1][0] + q[0][0]) / 2, (q[q.length - 1][1] + q[0][1]) / 2];
  g.moveTo(m0[0], m0[1]);
  for (let i = 0; i < q.length; i++) {
    const c = q[i];
    const n = q[(i + 1) % q.length];
    g.quadraticCurveTo(c[0], c[1], (c[0] + n[0]) / 2, (c[1] + n[1]) / 2);
  }
  g.closePath();
  g.fill();
  g.globalAlpha = 1;
}

export function disc(f: Frame, c: Pt, rx: number, ry: number, rot: number, colour: string, alpha = 1) {
  const g = f.g;
  const p = at(f, c);
  g.globalAlpha = alpha;
  g.fillStyle = colour;
  g.beginPath();
  g.ellipse(p[0], p[1], rx * f.h, ry * f.h, rot, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;
}

/**
 * A limb: a tapered shape between two joints.
 *
 * Six points rather than four, with the widest part at two fifths along, which
 * is where the belly of a muscle actually is. A straight-sided quad between
 * two joints reads as a plank, and a whole figure made of planks reads as a
 * mannequin — which is what the first pass of this looked like.
 */
export function limb(a: Pt, b: Pt, wa: number, wb: number, bulge = 1.12): Pt[] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const m: Pt = [a[0] + dx * 0.4, a[1] + dy * 0.4];
  const wm = ((wa + wb) / 2) * bulge;
  return [
    [a[0] + nx * wa, a[1] + ny * wa],
    [m[0] + nx * wm, m[1] + ny * wm],
    [b[0] + nx * wb, b[1] + ny * wb],
    [b[0] - nx * wb, b[1] - ny * wb],
    [m[0] - nx * wm, m[1] - ny * wm],
    [a[0] - nx * wa, a[1] - ny * wa],
  ];
}

/** A point a fraction of the way along a segment, offset sideways. */
export function along(a: Pt, b: Pt, t: number, off = 0): Pt {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return [a[0] + dx * t - (dy / len) * off, a[1] + dy * t + (dx / len) * off];
}

export const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

/**
 * The light.
 *
 * One line, one direction, and everything on the card obeys it. The line is
 * allowed a few facets because the reference has them — the shadow across a
 * chest breaks at the sternum rather than running smoothly over it — and the
 * facets are what stop the whole thing looking like a gradient someone
 * threshold-ed.
 */
export class Light {
  private edge: Pt[];
  /** The half-plane on the far side of the terminator, for callers that clip. */
  readonly shadow: Pt[];

  constructor(
    /** Direction the light comes from, radians. 0 is from the top. */
    public angle: number,
    /** How far across the figure the terminator falls, −1..1. */
    public offset: number,
    /** How much the line breaks. 0 is a clean edge. */
    public facet: number,
    seed: number,
  ) {
    let a = (seed ^ 0x51a3) >>> 0;
    const r = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const c: Pt = [this.offset * 0.26, 0.5];
    const dir: Pt = [Math.sin(angle), -Math.cos(angle)];
    const nrm: Pt = [Math.cos(angle), Math.sin(angle)];
    const steps = 7;
    this.edge = [];
    for (let i = 0; i <= steps; i++) {
      const t = -1.6 + (i / steps) * 3.2;
      // Facets, not a wobble: each break holds for a stretch and then jumps.
      const k = Math.round(t * 2.2 + r() * 0.4);
      const off = (((k * 2654435761) % 1000) / 1000 - 0.5) * facet;
      this.edge.push([c[0] + dir[0] * t + nrm[0] * off, c[1] + dir[1] * t + nrm[1] * off]);
    }
    const far = 3;
    this.shadow = [
      ...this.edge,
      [this.edge[steps][0] + nrm[0] * far, this.edge[steps][1] + nrm[1] * far],
      [this.edge[0][0] + nrm[0] * far, this.edge[0][1] + nrm[1] * far],
    ];
  }

  /** Paint a shape lit: the light colour, then the shadow clipped to it. */
  shade(f: Frame, pts: Pt[], tone: Tone, alpha = 1) {
    poly(f, pts, tone.light, alpha);
    this.clipTo(f, pts, () => poly(f, this.shadow, tone.dark, alpha));
  }

  /** The same for a rounded shape. */
  shadeBlob(f: Frame, pts: Pt[], tone: Tone, alpha = 1) {
    blob(f, pts, tone.light, alpha);
    this.clipBlob(f, pts, () => poly(f, this.shadow, tone.dark, alpha));
  }

  shadeDisc(f: Frame, c: Pt, rx: number, ry: number, rot: number, tone: Tone) {
    disc(f, c, rx, ry, rot, tone.light);
    const g = f.g;
    const p = at(f, c);
    g.save();
    g.beginPath();
    g.ellipse(p[0], p[1], rx * f.h, ry * f.h, rot, 0, Math.PI * 2);
    g.clip();
    poly(f, this.shadow, tone.dark);
    g.restore();
  }

  clipTo(f: Frame, pts: Pt[], fn: () => void) {
    const g = f.g;
    g.save();
    g.beginPath();
    const a = at(f, pts[0]);
    g.moveTo(a[0], a[1]);
    for (let i = 1; i < pts.length; i++) {
      const p = at(f, pts[i]);
      g.lineTo(p[0], p[1]);
    }
    g.closePath();
    g.clip();
    fn();
    g.restore();
  }

  private clipBlob(f: Frame, pts: Pt[], fn: () => void) {
    const g = f.g;
    const q = pts.map((p) => at(f, p));
    g.save();
    g.beginPath();
    const m0: Pt = [(q[q.length - 1][0] + q[0][0]) / 2, (q[q.length - 1][1] + q[0][1]) / 2];
    g.moveTo(m0[0], m0[1]);
    for (let i = 0; i < q.length; i++) {
      const c = q[i];
      const n = q[(i + 1) % q.length];
      g.quadraticCurveTo(c[0], c[1], (c[0] + n[0]) / 2, (c[1] + n[1]) / 2);
    }
    g.closePath();
    g.clip();
    fn();
    g.restore();
  }

  /** Is this point on the lit side? Used to decide which way a detail faces. */
  lit(p: Pt): boolean {
    const nrm: Pt = [Math.cos(this.angle), Math.sin(this.angle)];
    const c: Pt = [this.offset * 0.26, 0.5];
    return (p[0] - c[0]) * nrm[0] + (p[1] - c[1]) * nrm[1] < 0;
  }
}

/**
 * Grain.
 *
 * The reference is flat but not *clean* — there is a fine speckle in the
 * larger fields, of the sort a risograph or a screen leaves. Scattered inside
 * a clip so it stops at the edge of the shape, and pale enough that you only
 * notice it when it is missing.
 */
export function grain(f: Frame, box: [number, number, number, number], colour: string, n: number, seed: number) {
  let a = (seed ^ 0x7f2b) >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const g = f.g;
  g.fillStyle = colour;
  for (let i = 0; i < n; i++) {
    const x = box[0] + r() * (box[2] - box[0]);
    const y = box[1] + r() * (box[3] - box[1]);
    const p = at(f, [x, y]);
    const s = (0.4 + r() * 1.1) * (f.h / 300);
    g.globalAlpha = 0.05 + r() * 0.16;
    g.fillRect(p[0], p[1], s, s);
  }
  g.globalAlpha = 1;
}
