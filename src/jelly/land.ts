/**
 * The shape of Jellynoor.
 *
 * One height function describes the whole hill: a peak to the north, a
 * shoulder east, a wooded knoll west, a flat bench in the middle where the
 * village sits, and a valley that falls away south-east into the mist. Over
 * the tea slopes the height is quantised into terraces, and because it is
 * quantised, the bushes can be planted simply by keeping the sample points
 * that land on a bench and dropping the ones on a riser. The rows then follow
 * the contours by themselves, the way they do on a real estate.
 */

export const WORLD = 128;          // half-width of the playable ground
export const TERRACE = 1.6;        // the rise from one bench to the next
export const VILLAGE = { x: 0, z: 30, r: 30, y: 7.2 };
export const POND = { x: 26, z: 66, r: 7 };


export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};
const gauss = (x: number, z: number, cx: number, cz: number, r: number) =>
  Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (r * r));

/** A cheap, repeatable value noise, enough to keep the ground from looking milled. */
function noise(x: number, z: number): number {
  const s = Math.sin(x * 0.0912 + 1.7) * Math.sin(z * 0.1071 - 0.4)
    + Math.sin(x * 0.2311 - 2.1) * Math.sin(z * 0.1917 + 1.1) * 0.5
    + Math.sin((x + z) * 0.3517) * 0.25;
  return s / 1.75;
}

/** The hill before it is cut into terraces. */
function bare(x: number, z: number): number {
  let h = 1.5;
  h += 30 * gauss(x, z, -14, -112, 104);     // the peak the estate climbs towards
  h += 19 * gauss(x, z, 66, -58, 66);        // the eastern shoulder
  h += 13 * gauss(x, z, -86, -34, 60);       // the wooded knoll
  h += 5 * gauss(x, z, -40, 40, 40);         // a swell south-west
  h += noise(x, z) * 1.9;
  // the land falls away to the south-east, into the valley and the haze
  h -= 20 * smoothstep(40, 150, x * 0.75 + z * 0.75);
  // and a little to the south
  h -= 9 * smoothstep(50, 130, z);
  return h;
}

/** 1 over the tea slopes, 0 in the village and the woods. */
export function teaMask(x: number, z: number): number {
  const up = smoothstep(14, -8, z);                              // north of the village
  const notFar = 1 - smoothstep(86, 120, Math.hypot(x, z + 20));
  const notWood = smoothstep(-72, -48, x);
  return clamp(up * notFar * notWood, 0, 1);
}

/** 1 on the village bench, falling off at its edge. */
export function villageMask(x: number, z: number): number {
  return 1 - smoothstep(VILLAGE.r * 0.55, VILLAGE.r, Math.hypot(x - VILLAGE.x, z - VILLAGE.z));
}

export function forestMask(x: number, z: number): number {
  const west = 1 - smoothstep(-80, -52, x);
  const north = smoothstep(-20, -58, z);
  return clamp(Math.max(west, north * 0.9), 0, 1);
}

/**
 * The ground. Over the tea the height is stepped into benches with a short
 * ramp between them, which is what gives the hillside its corduroy.
 */
export function heightAt(x: number, z: number): number {
  let h = bare(x, z);

  // the stream has cut its own smooth channel, so the benches stop at it
  const sd0 = streamDist(x, z);
  const tea = teaMask(x, z) * smoothstep(3.5, 10, sd0);
  if (tea > 0.001) {
    const t = h / TERRACE;
    const fl = Math.floor(t), fr = t - fl;
    // flat for most of the step, then a quick rise: walkable, but clearly cut
    const stepped = (fl + smoothstep(0.80, 1.0, fr)) * TERRACE;
    h = h + (stepped - h) * tea;
  }

  // the village bench is levelled, with its lip blended into the slope
  const v = villageMask(x, z);
  if (v > 0.001) h = h + (VILLAGE.y + noise(x * 0.4, z * 0.4) * 0.22 - h) * v;

  // the pond is scooped out
  const pd = Math.hypot(x - POND.x, z - POND.z);
  if (pd < POND.r * 2.1) h -= 2.3 * (1 - smoothstep(0, POND.r * 2.1, pd));

  // the stream cuts a shallow channel down the hill
  if (sd0 < 5) h -= 1.7 * (1 - smoothstep(0, 5, sd0));

  return h;
}

/** The surface normal, taken by differences. Used for sliding and for laying things flat. */
export function normalAt(x: number, z: number, e = 0.6): [number, number, number] {
  const hx = heightAt(x + e, z) - heightAt(x - e, z);
  const hz = heightAt(x, z + e) - heightAt(x, z - e);
  const nx = -hx, ny = 2 * e, nz = -hz;
  const l = Math.hypot(nx, ny, nz) || 1;
  return [nx / l, ny / l, nz / l];
}

/** How steep the ground is here, 0 flat to 1 sheer. */
export function slopeAt(x: number, z: number): number {
  return 1 - normalAt(x, z)[1];
}

/* ───────── the stream ───────── */

export const STREAM: [number, number][] = [
  [-20, -78], [-16, -58], [-10, -38], [-6, -20], [-4, -4], [-2, 10], [2, 24], [8, 40], [16, 54], [24, 62], [26, 66],
];

/** Distance from a point to the stream's course. */
export function streamDist(x: number, z: number): number {
  let best = 1e9;
  for (let i = 0; i < STREAM.length - 1; i++) {
    const [ax, az] = STREAM[i], [bx, bz] = STREAM[i + 1];
    const dx = bx - ax, dz = bz - az;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
    const px = ax + dx * t, pz = az + dz * t;
    best = Math.min(best, Math.hypot(x - px, z - pz));
  }
  return best;
}

/* ───────── laying out the garden ───────── */

export interface BushSpot { x: number; z: number; y: number; row: number }

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Walk a grid over the tea slopes and keep the points that sit on a bench.
 * Because the benches are level bands of the height field, the survivors fall
 * into contour rows without anyone having to draw one.
 */
export function layOutGarden(max = 1800): BushSpot[] {
  const rng = mulberry(20260107);
  const all: BushSpot[] = [];
  const step = 1.35;
  for (let z = -92; z < 13; z += step) {
    for (let x = -64; x < 78; x += step) {
      if (teaMask(x, z) < 0.75) continue;
      if (streamDist(x, z) < 5) continue;
      if (Math.hypot(x - VILLAGE.x, z - VILLAGE.z) < VILLAGE.r - 1) continue;
      const jx = x + (rng() - 0.5) * 0.42, jz = z + (rng() - 0.5) * 0.22;
      const h = bare(jx, jz);
      const fr = h / TERRACE - Math.floor(h / TERRACE);
      if (fr > 0.34) continue;                      // a band along each bench, which is what makes the rows
      if (slopeAt(jx, jz) > 0.42) continue;         // too steep to work
      all.push({ x: jx, z: jz, y: heightAt(jx, jz), row: Math.floor(h / TERRACE) });
    }
  }
  // thin the whole garden evenly rather than filling up the first rows and
  // stopping, which would leave the slope above the village bare
  if (all.length <= max) return all;
  const stride = all.length / max;
  const out: BushSpot[] = [];
  for (let i = 0; out.length < max && Math.floor(i * stride) < all.length; i++) out.push(all[Math.floor(i * stride)]);
  return out;
}

/** A path from the village up into the garden, for steps and for villagers to walk. */
export const PATH: [number, number][] = [
  [0, 26], [-2, 14], [-6, 2], [-12, -12], [-16, -28], [-14, -44], [-8, -58], [0, -70],
];

export function pathDist(x: number, z: number): number {
  let best = 1e9;
  for (let i = 0; i < PATH.length - 1; i++) {
    const [ax, az] = PATH[i], [bx, bz] = PATH[i + 1];
    const dx = bx - ax, dz = bz - az;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
    best = Math.min(best, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
  }
  return best;
}

/** Scatter points for trees, rocks and flowers, kept clear of everything built. */
export function scatter(n: number, seed: number, test: (x: number, z: number) => boolean): [number, number][] {
  const rng = mulberry(seed);
  const out: [number, number][] = [];
  for (let i = 0; i < n * 60 && out.length < n; i++) {
    const x = (rng() - 0.5) * 2 * WORLD, z = (rng() - 0.5) * 2 * WORLD;
    if (test(x, z)) out.push([x, z]);
  }
  return out;
}

export { mulberry };
