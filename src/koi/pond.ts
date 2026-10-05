/**
 * The pond itself: its outline, its depth, the ground around it, and the
 * ripple simulation that every touch, stone, raindrop and fish writes into.
 *
 * Units are metres. The pond is about 12.4 × 8.4 m, a little over a metre
 * deep in the middle, with the water surface at y = 0.
 */

/* ---------- small deterministic helpers ---------- */

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash2 = (x: number, y: number) => {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
};

/** Smooth value noise in [0, 1]. */
export function vnoise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, y: number, oct = 4) {
  let s = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f); n += a; a *= 0.5; f *= 2.03; }
  return s / n;
}

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const smoothstep = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ---------- outline ---------- */

export const RX = 6.2, RZ = 4.2;
/** A few low harmonics make the outline feel dug rather than drawn. */
const HARM: [k: number, amp: number, phase: number][] = [
  [2, 0.06, 0.6], [3, 0.075, 2.1], [4, 0.035, 4.0], [5, 0.025, 1.3], [7, 0.012, 5.2],
];

export function pondRadiusScale(theta: number) {
  let s = 1;
  for (const [k, a, p] of HARM) s += a * Math.cos(k * theta + p);
  return s;
}

/** Approximate signed distance (m) to the waterline: negative inside the pond. */
export function pondSDF(x: number, z: number) {
  const th = Math.atan2(z / RZ, x / RX);
  const s = pondRadiusScale(th);
  const ex = x / (RX * s), ez = z / (RZ * s);
  const r = Math.hypot(ex, ez);
  // scale back to metres with the local radius so the field is close to a distance
  const local = Math.hypot(Math.cos(th) * RX * s, Math.sin(th) * RZ * s);
  return (r - 1) * local;
}

/** GLSL copy of pondSDF, for shaders that need the outline. */
export const POND_GLSL = /* glsl */ `
float pondSDF(vec2 p){
  float th = atan(p.y / ${RZ.toFixed(3)}, p.x / ${RX.toFixed(3)});
  float s = 1.0${HARM.map(([k, a, ph]) => ` + ${a.toFixed(4)} * cos(${k.toFixed(1)} * th + ${ph.toFixed(3)})`).join('')};
  vec2 e = p / (vec2(${RX.toFixed(3)}, ${RZ.toFixed(3)}) * s);
  float local = length(vec2(cos(th) * ${RX.toFixed(3)} * s, sin(th) * ${RZ.toFixed(3)} * s));
  return (length(e) - 1.0) * local;
}`;

export const MAX_DEPTH = 1.15;

/** Ground height everywhere (pond floor inside, banks and garden outside). */
export function groundHeight(x: number, z: number) {
  const d = pondSDF(x, z);
  if (d < 0) {
    // floor: a short steep lip down from the bank (continuous with it, so the
    // waterline stays smooth), a wall for the first metre, then a rolling bottom
    const lip = 0.16 * smoothstep(0, 0.14, -d);
    const wall = smoothstep(0.05, 0.9, -d);
    const roll = (fbm(x * 0.35 + 3, z * 0.35 - 2, 3) - 0.5) * 0.25;
    return 0.1 - lip - wall * (MAX_DEPTH - 0.15 + roll) * (0.55 + 0.45 * smoothstep(0.6, 3.5, -d));
  }
  // banks: a lip just above the water, rising into the garden
  const lip = 0.1 + 0.14 * smoothstep(0, 0.7, d);
  const swell = (fbm(x * 0.22 - 7, z * 0.22 + 5, 4) - 0.45) * 0.9 * smoothstep(0.5, 3.5, d);
  const mound = 0.5 * Math.exp(-((x + 8.4) ** 2 + (z + 4.9) ** 2) / 9) + 0.38 * Math.exp(-((x - 8.8) ** 2 + (z + 4.5) ** 2) / 8);
  const h = lip + Math.max(-0.05, swell) + mound * smoothstep(0.5, 2.5, d);
  // flatten out towards the edge of the modelled ground, where the far lawn takes over
  const edge = smoothstep(0.8, 0.97, Math.max(Math.abs(x) / 17, Math.abs(z) / 13));
  return h + (0.11 - h) * edge;
}

/* ---------- ripple simulation ---------- */

export const SIM = { x0: -7.2, z0: -5.0, nx: 180, nz: 126, dx: 0.08 };

/**
 * A damped wave equation on a heightfield, stepped at a fixed 60 Hz:
 *   next = (2h − prev + c²∇²h) · damping
 * Cells outside the waterline stay at zero, so waves reflect from the banks.
 */
export class RippleSim {
  readonly nx = SIM.nx;
  readonly nz = SIM.nz;
  h = new Float32Array(SIM.nx * SIM.nz);
  prev = new Float32Array(SIM.nx * SIM.nz);
  next = new Float32Array(SIM.nx * SIM.nz);
  mask = new Float32Array(SIM.nx * SIM.nz);
  damp = new Float32Array(SIM.nx * SIM.nz);
  c2 = 0.07;
  acc = 0;

  constructor() {
    for (let j = 0; j < this.nz; j++) for (let i = 0; i < this.nx; i++) {
      const x = SIM.x0 + i * SIM.dx, z = SIM.z0 + j * SIM.dx;
      const d = pondSDF(x, z);
      const k = j * this.nx + i;
      this.mask[k] = d < -0.02 ? 1 : 0;
      // shallow margins soak up a little more energy, like a planted edge
      this.damp[k] = 0.9955 - 0.02 * smoothstep(-0.45, 0, d);
    }
  }

  /** Push the surface down (amount > 0) in a smooth bump of radius r metres. */
  disturb(x: number, z: number, r: number, amount: number) {
    const ci = (x - SIM.x0) / SIM.dx, cj = (z - SIM.z0) / SIM.dx, rc = r / SIM.dx;
    const i0 = Math.max(1, Math.floor(ci - rc)), i1 = Math.min(this.nx - 2, Math.ceil(ci + rc));
    const j0 = Math.max(1, Math.floor(cj - rc)), j1 = Math.min(this.nz - 2, Math.ceil(cj + rc));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const q = Math.hypot(i - ci, j - cj) / rc;
      if (q >= 1) continue;
      const k = j * this.nx + i;
      const f = 0.5 + 0.5 * Math.cos(Math.PI * q);
      this.h[k] -= amount * f * this.mask[k];
    }
  }

  step(dt: number) {
    this.acc = Math.min(this.acc + dt, 0.1);
    let steps = 0;
    while (this.acc >= 1 / 60 && steps < 4) {
      this.acc -= 1 / 60; steps++;
      const { nx, nz, h, prev, next, mask, damp, c2 } = this;
      for (let j = 1; j < nz - 1; j++) {
        let k = j * nx + 1;
        for (let i = 1; i < nx - 1; i++, k++) {
          if (mask[k] === 0) { next[k] = 0; continue; }
          const lap = h[k - 1] + h[k + 1] + h[k - nx] + h[k + nx] - 4 * h[k];
          next[k] = (2 * h[k] - prev[k] + c2 * lap) * damp[k];
        }
      }
      // rotate buffers: prev <- h, h <- next
      this.prev = h; this.h = next; this.next = prev;
    }
    return steps;
  }

  private sample(arr: Float32Array, x: number, z: number) {
    const fi = clamp((x - SIM.x0) / SIM.dx, 0, this.nx - 1.001), fj = clamp((z - SIM.z0) / SIM.dx, 0, this.nz - 1.001);
    const i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j;
    const k = j * this.nx + i;
    return (arr[k] * (1 - u) + arr[k + 1] * u) * (1 - v) + (arr[k + this.nx] * (1 - u) + arr[k + this.nx + 1] * u) * v;
  }

  heightAt(x: number, z: number) { return this.sample(this.h, x, z); }

  gradAt(x: number, z: number): [number, number] {
    const e = SIM.dx;
    return [
      (this.heightAt(x + e, z) - this.heightAt(x - e, z)) / (2 * e),
      (this.heightAt(x, z + e) - this.heightAt(x, z - e)) / (2 * e),
    ];
  }

  /** Vertical speed of the surface (m/s), for spray and bobbing. */
  velAt(x: number, z: number) { return (this.sample(this.h, x, z) - this.sample(this.prev, x, z)) * 60; }

  clear() { this.h.fill(0); this.prev.fill(0); this.next.fill(0); }
}
