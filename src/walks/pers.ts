/**
 * One-point cutaway rooms in centimetres: X across from the left wall, d in
 * from the back wall (0) to the open front (D), Z up from the floor. The
 * front opening is a rectangle on the page; everything behind it shrinks
 * toward the vanishing point in true perspective.
 */
import { type G, type Pt, INK, inkFill, shade, poly, lerp } from './kit';

export interface PBoxStyle { front: string; top?: string; side?: string; lw: number; ink?: string }

export class PRoom {
  ppc: number; Wc: number; vx: number; vy: number; f: number;
  constructor(public x: number, public y: number, public w: number, public h: number, public Hc = 270, public D = 400, depthShrink = 0.72, vyFrac = 0.42, vxFrac = 0.5) {
    this.ppc = h / Hc; this.Wc = w / this.ppc; this.vx = x + w * vxFrac; this.vy = y + h * vyFrac; this.f = depthShrink;
  }
  /** pixels per centimetre at depth d */
  sc(d: number) { const t = d / this.D; return 1 / (1 + (1 - t) * (1 / this.f - 1)); }
  k(d: number) { return this.sc(d) * this.ppc; }
  p(X: number, d: number, Z: number): Pt {
    const fx = this.x + X * this.ppc, fy = this.y + this.h - Z * this.ppc, s = this.sc(d);
    return [this.vx + (fx - this.vx) * s, this.vy + (fy - this.vy) * s];
  }
  quad(g: G, a: [number, number, number], b: [number, number, number], c: [number, number, number], d: [number, number, number], fill: string | null, lw: number, ink = INK) {
    poly(g, [this.p(...a), this.p(...b), this.p(...c), this.p(...d)]); inkFill(g, fill, lw, ink);
  }
  /** Walls, floor and ceiling. */
  shell(g: G, c: { back: string; left: string; right: string; floor: string; ceil: string }, lw: number) {
    const { Wc: W, D, Hc: H } = this;
    this.quad(g, [0, 0, 0], [W, 0, 0], [W, D, 0], [0, D, 0], c.floor, lw);
    this.quad(g, [0, 0, H], [W, 0, H], [W, D, H], [0, D, H], c.ceil, lw);
    this.quad(g, [0, 0, 0], [0, D, 0], [0, D, H], [0, 0, H], c.left, lw);
    this.quad(g, [W, 0, 0], [W, D, 0], [W, D, H], [W, 0, H], c.right, lw);
    this.quad(g, [0, 0, 0], [W, 0, 0], [W, 0, H], [0, 0, H], c.back, lw);
  }
  /** A box standing in the room. */
  box(g: G, X0: number, X1: number, d0: number, d1: number, Z0: number, Z1: number, st: PBoxStyle) {
    const ink = st.ink ?? INK, top = st.top ?? shade(st.front, 0.12), side = st.side ?? shade(st.front, -0.15);
    const P = (X: number, d: number, Z: number) => this.p(X, d, Z);
    // side faces: the one facing the vanishing point is the one we see
    if (P(X0, d0, Z0)[0] < P(X0, d1, Z0)[0] - 0.5) { poly(g, [P(X0, d0, Z0), P(X0, d1, Z0), P(X0, d1, Z1), P(X0, d0, Z1)]); inkFill(g, side, st.lw, ink); }
    if (P(X1, d0, Z0)[0] > P(X1, d1, Z0)[0] + 0.5) { poly(g, [P(X1, d0, Z0), P(X1, d1, Z0), P(X1, d1, Z1), P(X1, d0, Z1)]); inkFill(g, side, st.lw, ink); }
    // top, if we look down on it; underside if up
    if (P(X0, d1, Z1)[1] > P(X0, d0, Z1)[1] + 0.3) { poly(g, [P(X0, d0, Z1), P(X1, d0, Z1), P(X1, d1, Z1), P(X0, d1, Z1)]); inkFill(g, top, st.lw, ink); }
    else if (P(X0, d1, Z0)[1] < P(X0, d0, Z0)[1] - 0.3) { poly(g, [P(X0, d0, Z0), P(X1, d0, Z0), P(X1, d1, Z0), P(X0, d1, Z0)]); inkFill(g, shade(st.front, -0.3), st.lw, ink); }
    poly(g, [P(X0, d1, Z0), P(X1, d1, Z0), P(X1, d1, Z1), P(X0, d1, Z1)]); inkFill(g, st.front, st.lw, ink);
  }
  /** A flat rectangle on the back wall (a window, a frame, a poster). */
  onBack(g: G, X0: number, Z0: number, X1: number, Z1: number, fill: string | null, lw: number, d = 0) { this.quad(g, [X0, d, Z0], [X1, d, Z0], [X1, d, Z1], [X0, d, Z1], fill, lw); }
  /** A flat rectangle on the left (side 0) or right (side 1) wall, from d0 to d1. */
  onSide(g: G, side: 0 | 1, d0: number, d1: number, Z0: number, Z1: number, fill: string | null, lw: number) { const X = side ? this.Wc : 0; this.quad(g, [X, d0, Z0], [X, d1, Z0], [X, d1, Z1], [X, d0, Z1], fill, lw); }
  /** A rectangle on the floor. */
  onFloor(g: G, X0: number, d0: number, X1: number, d1: number, fill: string | null, lw: number, Z = 0) { this.quad(g, [X0, d0, Z], [X1, d0, Z], [X1, d1, Z], [X0, d1, Z], fill, lw); }
  /** Pixel scale for a 96-unit figure standing at depth d (a 170 cm adult). */
  fig(d: number) { return (this.k(d) * 172) / 96; }
}
export { lerp };
