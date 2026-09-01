import { Load, type Mark, type Pt } from './brush';
import type { Dress, Hair, Perch, Pose } from './pose';

/**
 * A woman, in two pigments and a lot of water.
 *
 * The crayon figure next door is built out of *lines* — a limb is a tapering
 * stroke and the drawing is the sum of them. This one cannot be, because
 * watercolour of this kind does not have lines in it. Look at what the
 * reference paintings actually consist of and it is three or four **masses**,
 * one of them enormous, with the figure implied at the places where they meet.
 * The dancer is a skirt with a person at the top of it. The horse is a body of
 * warm and a head of cool and no drawing between them at all.
 *
 * So the figure here is authored as mass, and in a strict order, because in
 * watercolour the order *is* the technique:
 *
 * 1. **The wet stage.** The largest shape in the picture — cloth, and the loose
 *    field of colour around the body — laid onto a soaked sheet with a great
 *    deal of water, so the solver has thirty steps to move it about before
 *    anything sets. Nothing in this stage keeps the shape it was given.
 * 2. **The body.** Torso, limbs, head, hair, laid while the sheet is damp. The
 *    edges soften but survive, which is why the figure reads as a figure and
 *    the cloth reads as weather.
 * 3. **The darks.** A handful of small, nearly dry marks — the head, the turn
 *    of a shoulder, a hand, whatever she is holding — put down at the very end
 *    when there is not enough water left to move them. These stay sharp, and
 *    they are the only sharp things in the picture. A watercolour with no
 *    stage 3 looks like a stain; a watercolour that is *all* stage 3 looks like
 *    a drawing that has been coloured in.
 *
 * The proportions are their own, not the crayon canon's. That figure is drawn
 * at seven heads with a deliberately large skull because it has to carry a face
 * made of six marks. Here the head is a single dab with nothing inside it, so
 * the drawing can run at a proper eight, and the length is worth having: almost
 * everything these poses are doing is said by a long line through the body.
 */

const BONE = {
  spine: 0.3,
  neck: 0.05,
  headR: 0.061,
  shoulder: 0.088,
  upperArm: 0.155,
  foreArm: 0.142,
  hand: 0.048,
  hip: 0.07,
  thigh: 0.235,
  shin: 0.222,
  foot: 0.072,
};

const rad = (d: number) => (d * Math.PI) / 180;
const step = (p: Pt, deg: number, len: number): Pt => [
  p[0] + Math.cos(rad(deg)) * len,
  p[1] + Math.sin(rad(deg)) * len,
];
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export interface Skeleton {
  pelvis: Pt;
  spine: [Pt, Pt, Pt];
  neck: Pt;
  head: Pt;
  headTilt: number;
  shoulder: [Pt, Pt];
  elbow: [Pt, Pt];
  hand: [Pt, Pt];
  hip: [Pt, Pt];
  knee: [Pt, Pt];
  foot: [Pt, Pt];
  toe: [Pt, Pt];
}

/** Bones for a pose, in figure units, pelvis at the origin, y down. */
export function skeleton(p: Pose, build: number): Skeleton {
  const s = 0.93 + build * 0.14;
  const lean = rad(p.lean);
  const spineLen = BONE.spine * s * (0.72 + p.stand * 0.28);
  const pelvis: Pt = [0, 0];
  const chest: Pt = [Math.sin(lean) * spineLen, -Math.cos(lean) * spineLen];
  const mid: Pt = [
    chest[0] / 2 + Math.cos(lean) * p.bend * spineLen,
    chest[1] / 2 + Math.sin(lean) * p.bend * spineLen,
  ];
  const neck: Pt = [
    chest[0] + Math.sin(lean) * BONE.neck * s,
    chest[1] - Math.cos(lean) * BONE.neck * s,
  ];
  const headTilt = lean + rad(p.head) * 0.45;
  const head: Pt = [
    neck[0] + Math.sin(headTilt) * BONE.headR * 1.15,
    neck[1] - Math.cos(headTilt) * BONE.headR * 1.15,
  ];

  const across = lean + Math.PI / 2;
  const shoulder: [Pt, Pt] = [
    [
      chest[0] - Math.cos(across) * BONE.shoulder * s,
      chest[1] - Math.sin(across) * BONE.shoulder * s,
    ],
    [
      chest[0] + Math.cos(across) * BONE.shoulder * s,
      chest[1] + Math.sin(across) * BONE.shoulder * s,
    ],
  ];
  const elbow: [Pt, Pt] = [
    step(shoulder[0], p.armL[0], BONE.upperArm * s),
    step(shoulder[1], p.armR[0], BONE.upperArm * s),
  ];
  const hand: [Pt, Pt] = [
    step(elbow[0], p.armL[1], BONE.foreArm * s),
    step(elbow[1], p.armR[1], BONE.foreArm * s),
  ];
  const hip: [Pt, Pt] = [
    [-BONE.hip * s, 0],
    [BONE.hip * s, 0],
  ];
  const knee: [Pt, Pt] = [
    step(hip[0], p.legL[0], BONE.thigh * s),
    step(hip[1], p.legR[0], BONE.thigh * s),
  ];
  const foot: [Pt, Pt] = [
    step(knee[0], p.legL[1], BONE.shin * s),
    step(knee[1], p.legR[1], BONE.shin * s),
  ];
  const toe: [Pt, Pt] = [
    step(foot[0], p.legL[1] - 74, BONE.foot * s),
    step(foot[1], p.legR[1] - 74, BONE.foot * s),
  ];

  const sk: Skeleton = {
    pelvis,
    spine: [pelvis, mid, chest],
    neck,
    head,
    headTilt,
    shoulder,
    elbow,
    hand,
    hip,
    knee,
    foot,
    toe,
  };

  if (p.spin) {
    const a = rad(p.spin);
    const c = Math.cos(a);
    const sn = Math.sin(a);
    const spun = (q: Pt): Pt => [q[0] * c - q[1] * sn, q[0] * sn + q[1] * c];
    const walk = (v: unknown): unknown =>
      Array.isArray(v) && v.length === 2 && typeof v[0] === 'number'
        ? spun(v as Pt)
        : Array.isArray(v)
          ? v.map(walk)
          : v;
    for (const k of Object.keys(sk) as (keyof Skeleton)[]) {
      if (k === 'headTilt') continue;
      (sk[k] as unknown) = walk(sk[k]);
    }
  }
  return sk;
}

/** Every joint, for measuring. */
function joints(k: Skeleton): Pt[] {
  return [
    k.pelvis,
    ...k.spine,
    k.neck,
    k.head,
    ...k.shoulder,
    ...k.elbow,
    ...k.hand,
    ...k.hip,
    ...k.knee,
    ...k.foot,
    ...k.toe,
  ];
}

export function extent(k: Skeleton) {
  let l = Infinity;
  let r = -Infinity;
  let t = Infinity;
  let b = -Infinity;
  for (const [x, y] of joints(k)) {
    l = Math.min(l, x);
    r = Math.max(r, x);
    t = Math.min(t, y);
    b = Math.max(b, y);
  }
  return { l, r, t, b, w: r - l, h: b - t };
}

// ------------------------------------------------------------------ painting

export interface Look {
  /** Pigment weights for this mark set: how cool, how warm. */
  cool: number;
  warm: number;
  seed: number;
  /**
   * Figure units to sheet units, and where the pelvis sits.
   *
   * Sheet x is 0..1 across the short side, so one unit of x is one unit of
   * brush width and a scale is the same number for both. Sheet y is 0..1 down
   * the long side, so everything vertical carries the aspect — which is the
   * one place in the whole study where the frame's shape leaks into the
   * drawing, and forgetting it stretches every figure.
   */
  scale: number;
  aspect: number;
  at: Pt;
  /** Left-right mirror. */
  flip: boolean;
  /** Extra sweep on the cloth beyond what the pose asks for. */
  billow: number;
}

export interface Stage {
  draw: (load: Load) => void;
  /** How wet the sheet is when this goes on. */
  water: number;
  /** Share of the drying run that happens after it. */
  after: number;
}

const rnd = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Figure units to sheet units. Includes the mirror. */
function mapper(look: Look) {
  const f = look.flip ? -1 : 1;
  return ([x, y]: Pt): Pt => [
    look.at[0] + x * look.scale * f,
    look.at[1] + y * look.scale * look.aspect,
  ];
}


/** Where the cloth hangs from, and how far it reaches. */
const HANG: Record<Dress, { from: 'hip' | 'chest'; reach: number; open: number }> = {
  gown: { from: 'hip', reach: 0.62, open: 0.9 },
  sari: { from: 'chest', reach: 0.6, open: 0.85 },
  skirt: { from: 'hip', reach: 0.38, open: 0.8 },
  sundress: { from: 'chest', reach: 0.42, open: 0.78 },
  coat: { from: 'chest', reach: 0.46, open: 0.5 },
  wrap: { from: 'chest', reach: 0.36, open: 0.55 },
  slip: { from: 'chest', reach: 0.3, open: 0.42 },
  trousers: { from: 'hip', reach: 0.0, open: 0.3 },
};

/**
 * Cloth.
 *
 * The first attempt fanned equal spokes out of a single point and every picture
 * came out with a starburst in it — the shape read as a splash, or a hand, and
 * never as a skirt. Three things fixed it, and all three are about cloth being
 * a *sheet* rather than a set of rays.
 *
 * **It hangs off a line, not a point.** Real cloth is gathered along a waist or
 * a shoulder several inches wide. Starting every fold at the same pixel makes a
 * pinch no fabric has.
 *
 * **It does not go up.** A fold can swing wide and it can trail behind, but the
 * fan is bounded well short of the horizontal or the figure ends up wearing
 * wings. Whatever the pose says, the cloth stays on the lower half of it.
 *
 * **The shape is the drawing, the folds are the texture.** The mass goes down
 * first and the sweeps go inside it. Drawn the other way round you get a
 * diagram of the folds with nothing hanging from them.
 */
function cloth(k: Skeleton, p: Pose, look: Look, r: () => number) {
  const h = HANG[p.dress];
  const anchor: Pt = h.from === 'hip' ? [0, 0] : lerp(k.spine[2], k.pelvis, 0.4);
  // A skirt on someone sitting down pools; it does not sweep. Without the
  // `stand` term every seated figure was wearing a train.
  const reach =
    h.reach * (0.72 + p.flow * 0.5) * (0.86 + look.billow * 0.24) * (0.62 + p.stand * 0.42);
  if (reach < 0.05) return { spokes: [] as Pt[][], anchor, rim: [] as Pt[] };
  // Cloth falls, and the clamp is much tighter than it looks like it should
  // be. Ninety degrees is straight down; the poses were authored with sweep
  // directions up around a hundred and fifty, which is nearly horizontal, and
  // every seated figure came out with a slab of colour lying on the floor
  // beside her. Only a pose actually in motion earns more than forty-odd
  // degrees off the vertical.
  const swing = 38 + p.flow * 26;
  const dir = Math.max(90 - swing, Math.min(90 + swing, p.flow > 0 ? p.flowAt : 96));
  const spread = 20 + h.open * 30 + p.flow * 18;
  const gather = (h.from === 'hip' ? BONE.hip : BONE.shoulder) * 1.1;
  const n = 5;
  const spokes: Pt[][] = [];
  const rim: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = dir + (t - 0.5) * 2 * spread;
    // The middle of the fall is the longest, and no two folds are the same
    // length. A fan of equal spokes is a lampshade.
    const fall = 0.66 + 0.34 * Math.cos((t - 0.5) * Math.PI);
    const len = reach * fall * (0.86 + r() * 0.28);
    const from: Pt = [anchor[0] + (t - 0.5) * 2 * gather, anchor[1] + Math.abs(t - 0.5) * 0.02];
    const bowAt = a + (r() - 0.5) * 22;
    const knee = step(from, bowAt, len * 0.55);
    const hem = step(knee, a + (r() - 0.5) * 30, len * 0.45);
    spokes.push([from, knee, hem]);
    rim.push(hem);
  }
  // The hem, between the folds. Cloth billows out between the two points where
  // it hangs, and a straight line from one fold to the next is exactly what
  // made the first skirts read as cut paper.
  const hem: Pt[] = [];
  for (let i = 0; i < rim.length - 1; i++) {
    hem.push(rim[i]);
    const a = rim[i];
    const b = rim[i + 1];
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const out = 0.1 + r() * 0.16;
    hem.push([mx + (mx - anchor[0]) * out, my + (my - anchor[1]) * out]);
  }
  hem.push(rim[rim.length - 1]);
  return { spokes, anchor, rim: hem };
}

function prop(load: Load, k: Skeleton, p: Pose, m: (q: Pt) => Pt, look: Look, r: () => number) {
  const what = p.prop;
  if (!what || what === 'none') return;
  const grip = p.grip ?? 1;
  const hands = grip === 2 ? [k.hand[0], k.hand[1]] : [k.hand[grip === 0 ? 0 : 1]];
  const at = hands.length === 2 ? lerp(hands[0], hands[1], 0.5) : hands[0];
  /**
   * The prop gets the *other* tube.
   *
   * It has to be darker than the figure holding it — at the first weights it
   * was lighter and it vanished into her, which took the whole subject with it,
   * because the object in the hand is the one mark that says what the picture
   * is about. A woman with her arms up is a woman with her arms up; a woman
   * with her arms up holding a book is reading.
   *
   * But value alone was not enough: a dark mark in the same pigment as the body
   * still reads as one of the body's own shadows. Painting it in the warm while
   * she is in the cool separates it by *hue* as well, which is the one thing a
   * two-pigment palette can always do and costs nothing — and it is what the
   * second tube is for.
   */
  const ink: Mark = {
    cool: look.cool * 0.22,
    warm: look.warm * 2.4,
    water: 0.14,
    width: 0.013,
    dry: 0.1,
    soft: 0.2,
  };
  const s = look.scale;
  const tilt = (r() - 0.5) * 0.5;

  switch (what) {
    case 'book': {
      // Two leaves and a spine, big enough to be a book rather than a smudge.
      const a = m([at[0] - 0.085, at[1] - 0.03]);
      const b = m([at[0] + 0.085, at[1] + 0.012]);
      const low = m([at[0], at[1] + 0.032]);
      const high = m([at[0], at[1] - 0.052]);
      load.mass([a, low, b, high], { ...ink, width: 0.006 });
      load.stroke([high, low], { ...ink, width: 0.009 });
      break;
    }
    case 'guitar': {
      const body = m([at[0] + 0.02, at[1] + 0.05]);
      load.dab(body[0], body[1], 0.11 * s, 0.14 * s, 0.35 + tilt, { ...ink, soft: 0.18 });
      load.stroke([m([at[0] - 0.02, at[1] + 0.01]), m([at[0] - 0.26, at[1] - 0.12])], {
        ...ink,
        width: 0.018,
        taper: 0.7,
      });
      break;
    }
    case 'umbrella': {
      const top = m([at[0], at[1] - 0.2]);
      const arc: Pt[] = [];
      for (let i = 0; i <= 8; i++) {
        const a = Math.PI + (i / 8) * Math.PI;
        arc.push([top[0] + Math.cos(a) * 0.3 * s, top[1] - Math.sin(a) * 0.115 * s]);
      }
      load.mass([...arc, [top[0], top[1] + 0.05 * s]], {
        ...ink,
        water: 0.3,
        dry: 0.12,
        width: 0.012,
      });
      load.stroke([m(at), top], { ...ink, width: 0.012, water: 0.12 });
      break;
    }
    case 'cat': {
      const c = m([at[0] + 0.01, at[1] + 0.03]);
      load.dab(c[0], c[1], 0.085 * s, 0.055 * s, 0.2, { ...ink, soft: 0.45, water: 0.4 });
      load.dab(c[0] - 0.075 * s, c[1] - 0.035 * s, 0.03 * s, 0.03 * s, 0, ink);
      break;
    }
    case 'flowers': {
      for (let i = 0; i < 5; i++) {
        const q = m([at[0] + (r() - 0.5) * 0.08, at[1] - 0.02 - r() * 0.07]);
        load.dab(q[0], q[1], 0.02 * s, 0.02 * s, 0, { ...ink, water: 0.42, soft: 0.6 });
      }
      break;
    }
    case 'scarf': {
      const path: Pt[] = [m(at)];
      let q: Pt = at;
      let a = p.flowAt - 30;
      for (let i = 0; i < 4; i++) {
        a += (r() - 0.5) * 70;
        q = step(q, a, 0.11);
        path.push(m(q));
      }
      load.stroke(path, { ...ink, width: 0.035, taper: 0.35, water: 0.62, dry: 0.35, soft: 0.7 });
      break;
    }
    case 'headphones': {
      const hd = m(k.head);
      load.stroke(
        [
          [hd[0] - 0.07 * s, hd[1] + 0.02 * s],
          [hd[0], hd[1] - 0.075 * s],
          [hd[0] + 0.07 * s, hd[1] + 0.02 * s],
        ],
        { ...ink, width: 0.01, water: 0.12, dry: 0.1 },
      );
      break;
    }
    case 'basket': {
      const c = m([at[0], at[1] + 0.055]);
      load.dab(c[0], c[1], 0.07 * s, 0.062 * s, 0, { ...ink, soft: 0.22, water: 0.22 });
      break;
    }
    case 'brush': {
      load.stroke([m(at), m([at[0] + 0.09, at[1] - 0.06])], {
        ...ink,
        width: 0.006,
        taper: 0.4,
        water: 0.12,
        dry: 0.05,
      });
      break;
    }
    default: {
      const c = m([at[0], at[1] + 0.016]);
      const size = what === 'cup' || what === 'glass' ? 0.042 : 0.034;
      load.dab(c[0], c[1], size * s, size * s * 1.15, 0, { ...ink, soft: 0.2, water: 0.2 });
    }
  }
}

function hairMass(load: Load, k: Skeleton, p: Pose, m: (q: Pt) => Pt, look: Look, r: () => number) {
  const style: Hair = p.hair;
  const s = look.scale;
  const hd = m(k.head);
  const dark: Mark = {
    cool: look.cool * 1.3,
    warm: look.warm * 0.42,
    water: 0.3,
    width: 0.02,
    dry: 0.18,
    soft: 0.35,
  };
  const back = p.lean > 0 ? 1 : -1;
  const down = k.headTilt;
  const away = (deg: number, len: number): Pt =>
    m([k.head[0] + Math.sin(down + rad(deg)) * len, k.head[1] - Math.cos(down + rad(deg)) * len]);

  if (style === 'bun' || style === 'up') {
    const b = away(back * 150, BONE.headR * 1.5);
    load.dab(b[0], b[1], 0.038 * s, 0.034 * s, 0, dark);
  }
  if (style === 'bob' || style === 'crop') {
    load.dab(hd[0], hd[1] + 0.012 * s, BONE.headR * 1.25 * s, BONE.headR * 1.2 * s, k.headTilt, {
      ...dark,
      soft: 0.5,
    });
  }
  if (style === 'loose' || style === 'braid' || style === 'wind') {
    // Hair is a shape with a few edges, not a bundle of hairs. The first pass
    // drew five long thin strands and every figure in the gallery came out
    // wearing antennae — at this size a single dark tube reads as a wire
    // whatever it is meant to be, which is the same lesson the crayon limbs
    // taught, arriving from the other direction.
    const n = style === 'wind' ? 3 : 2;
    const long = style === 'wind' ? 0.15 : style === 'braid' ? 0.13 : 0.1;
    load.group('max', () => {
      for (let i = 0; i < n; i++) {
        const a =
          style === 'wind' ? p.flowAt - 175 + (r() - 0.5) * 44 : back * (144 + (r() - 0.5) * 36);
        let q: Pt = k.head;
        const path: Pt[] = [m(q)];
        for (let j = 0; j < 3; j++) {
          q = step(q, style === 'wind' ? a : 90 + (a - 90) * 0.4 + (r() - 0.5) * 24, long / 3);
          path.push(m(q));
        }
        load.stroke(path, {
          ...dark,
          width: 0.05 + r() * 0.02,
          taper: 0.35,
          dry: 0.3,
          water: 0.34,
          soft: 0.55,
        });
      }
    });
  }
}

/**
 * The three stages of a painting, in the order a hand would do them.
 *
 * Nothing is drawn here — each stage is a closure over the pose, run by the
 * studio between passes of the solver, so what happens to a stage depends on
 * how much water is left when it goes down.
 */
export function figureStages(p: Pose, look: Look): Stage[] {
  const k = skeleton(p, 0.5);
  const m = mapper(look);
  const s = look.scale;

  return [
    // ------------------------------------------------------- 1. the wet stage
    {
      water: 1.0,
      // Most of the drying happens under the first stage and almost none under
      // the last. That ratio *is* the picture: diffusion divides pigment by the
      // area it spreads over, so anything laid on a soaked sheet with thirty
      // steps to travel arrives as a pale tint however strongly it went down.
      // The wash gets the bleeding; the figure does not.
      after: 0.58,
      draw: (load) => {
        const r = rnd(look.seed ^ 0x51ab);
        const { spokes, rim } = cloth(k, p, look, r);
        const warm: Mark = {
          cool: look.cool * 0.1,
          warm: look.warm * 0.56,
          water: 0.85,
          width: 0.07,
          taper: 1.8,
          dry: 0.42,
          tooth: 0.1,
          runout: 0.4,
          soft: 0.8,
        };
        load.group('max', () => {
          if (spokes.length) {
            // The shape first: hem, up one side, across the gather, down the
            // other. Then the folds, inside it and softer than it.
            const hull: Pt[] = [
              m(spokes[0][0]),
              m(spokes[0][1]),
              ...rim.map(m),
              m(spokes[spokes.length - 1][1]),
              m(spokes[spokes.length - 1][0]),
            ];
            // The field is light and broken; the folds inside it carry the
            // weight. Painted the other way up — a solid mass with pale folds
            // on it — a skirt comes out as a flat coloured shape with some
            // lines drawn on, which is what the first four passes all did.
            load.mass(hull, {
              ...warm,
              cool: warm.cool * 0.6,
              warm: warm.warm * 0.42,
              width: 0.022,
              dry: 0.5,
              tooth: 0.05,
            });
            for (const sp of spokes) {
              load.stroke(sp.map(m), {
                ...warm,
                width: 0.04 + r() * 0.035,
                dry: 0.34,
                tooth: 0.035,
                soft: 0.85,
              });
            }
          }
        });
        // A loose field of colour around the body: the thing that stops the
        // figure looking cut out and stuck on.
        const c = m(lerp(k.pelvis, k.spine[2], 0.5));
        load.dab(c[0], c[1], 0.3 * s * (0.8 + r() * 0.4), 0.36 * s, (r() - 0.5) * 0.6, {
          cool: look.cool * 0.08,
          warm: look.warm * 0.1,
          water: 0.5,
          width: 0,
          dry: 0.66,
          soft: 0.95,
        });
      },
    },

    // ----------------------------------------------------------- 2. the body
    {
      water: 0.28,
      after: 0.27,
      draw: (load) => {
        const r = rnd(look.seed ^ 0x77e3);
        const hidden = HANG[p.dress].reach > 0.34;
        // Twice the load it had, and it does not skip or run out.
        //
        // The figure is the darkest thing on the sheet and everything else is
        // weather round it. Painted at the same weight as the cloth — which is
        // what the first pass did — the whole picture sits in a band of mid
        // grey a fifth of a stop wide, and a woman reading becomes a smudge
        // that could be anything. A loaded brush on damp paper does not skip
        // either, so the dry-brush break-up is off: paper texture is the
        // solver's job, through granulation, not the brush's.
        const body: Mark = {
          cool: look.cool * 1.55,
          warm: look.warm * 0.4,
          water: 0.28,
          width: 0.04,
          dry: 0,
          tooth: 0.035,
          runout: 1,
          soft: 0.22,
        };

        load.group('max', () => {
          // Torso: shoulders, a waist, hips. Wide enough at the top that the
          // arms come *out of* it rather than being parked beside it.
          const trunk: Pt[] = [];
          const rightSide: Pt[] = [];
          for (let i = 0; i <= 6; i++) {
            const tt = i / 6;
            const a = lerp(k.spine[0], k.spine[1], tt);
            const b = lerp(k.spine[1], k.spine[2], tt);
            const spine = lerp(a, b, tt);
            const wide =
              (BONE.hip * 1.14 * (1 - tt) + BONE.shoulder * 1.12 * tt)
              * (1 - 0.16 * Math.sin(tt * Math.PI));
            const nx = k.spine[2][1] - k.spine[0][1];
            const ny = -(k.spine[2][0] - k.spine[0][0]);
            const len = Math.hypot(nx, ny) || 1;
            trunk.push(m([spine[0] + (nx / len) * wide, spine[1] + (ny / len) * wide]));
            rightSide.push(m([spine[0] - (nx / len) * wide, spine[1] - (ny / len) * wide]));
          }
          load.mass([...trunk, ...rightSide.reverse()], { ...body, width: 0.008, tooth: 0.04 });

          /**
           * A limb is a wedge, and a joint is a disc.
           *
           * The pass before this drew limbs as round-capped strokes of nearly
           * even width, and every figure came out as an armature of sausages
           * lying near a body rather than a person — the same failure the
           * crayon study hit from the other direction, and the same fix. Two
           * things are needed and neither works alone.
           *
           * **Taper.** A tapering quad narrows from shoulder to wrist the way
           * an arm does. Constant width reads as tubing at any weight.
           *
           * **A disc at every joint.** Two wedges meeting at an angle leave a
           * notch on the outside of the bend, and a notch at the elbow is the
           * single loudest signal that a drawing was assembled from parts.
           * Under `max` the disc costs nothing: it covers the paper once.
           */
          const seg = (a: Pt, b: Pt, wa: number, wb: number): Pt[] => {
            const dx = b[0] - a[0];
            const dy = b[1] - a[1];
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;
            return [
              m([a[0] + nx * wa, a[1] + ny * wa]),
              m([b[0] + nx * wb, b[1] + ny * wb]),
              m([b[0] - nx * wb, b[1] - ny * wb]),
              m([a[0] - nx * wa, a[1] - ny * wa]),
            ];
          };
          const joint = (at: Pt, w: number, mk: Mark) => {
            const q = m(at);
            load.dab(q[0], q[1], w * s, w * s, 0, { ...mk, soft: 0.2 });
          };

          const limb = (
            a: Pt, b: Pt, c: Pt, w0: number, w1: number, w2: number, far: boolean,
          ) => {
            const mk: Mark = {
              ...body,
              width: 0.006,
              tooth: 0.05,
              cool: body.cool * (far ? 0.88 : 1),
              warm: body.warm * (far ? 0.88 : 1),
            };
            load.mass(seg(a, b, w0, w1), mk);
            load.mass(seg(b, c, w1, w2), mk);
            joint(a, w0, mk);
            joint(b, w1, mk);
            joint(c, w2 * 1.15, mk);
          };

          limb(k.shoulder[0], k.elbow[0], k.hand[0], 0.03, 0.023, 0.015, true);
          limb(k.shoulder[1], k.elbow[1], k.hand[1], 0.032, 0.024, 0.016, false);
          // Under a long dress the legs stop where the cloth starts. Painting a
          // whole leg *and* a whole skirt over the same paper gives a figure
          // with her legs outside her clothes, which is the quickest way to
          // make a picture look assembled rather than painted.
          const shin = hidden ? 0.35 : 1;
          limb(k.hip[0], k.knee[0], lerp(k.knee[0], k.foot[0], shin), 0.048, 0.036, 0.023, true);
          limb(k.hip[1], k.knee[1], lerp(k.knee[1], k.foot[1], shin), 0.051, 0.038, 0.024, false);

          // Neck: a short wedge, and wide enough to be a neck rather than a
          // stalk. A head on a wire is a lollipop.
          load.mass(seg(k.spine[2], k.neck, 0.036, 0.028), { ...body, width: 0.005 });

          // The head. One dab: at this size a face is a lie you cannot tell
          // convincingly, and a blank head reads as a person looking away. It
          // is also the darkest and hardest-edged mark on the figure, because
          // it is the one the eye finds first.
          const hd = m(k.head);
          load.dab(hd[0], hd[1], BONE.headR * s * 0.95, BONE.headR * s * 1.15, k.headTilt, {
            ...body,
            cool: body.cool * 1.3,
            soft: 0.15,
            dry: 0,
          });
          hairMass(load, k, p, m, look, r);

          // Feet, and only where there are any showing.
          if (!hidden) {
            for (const [f, tp] of [
              [k.foot[0], k.toe[0]],
              [k.foot[1], k.toe[1]],
            ] as [Pt, Pt][]) {
              load.mass(seg(f, tp, 0.026, 0.014), { ...body, width: 0.005 });
            }
          }
        });
      },
    },

    // ------------------------------------------------------------ 3. the darks
    {
      water: 0.08,
      after: 0.15,
      draw: (load) => {
        const r = rnd(look.seed ^ 0x2bd1);
        const dark: Mark = {
          cool: look.cool * 2.3,
          warm: look.warm * 0.6,
          water: 0.16,
          width: 0.02,
          dry: 0.3,
          tooth: 0.05,
          soft: 0.3,
        };
        // The head and the shoulders carry the picture. In every one of the
        // references the tone runs from nearly black at the head to nearly
        // nothing at the feet, and a figure painted at one weight from top to
        // bottom reads as a silhouette cut out of coloured paper however good
        // the edges are.
        // Across the shoulders, not over the head. At its first size and
        // position this landed as a dark disc *on* the head — which read as a
        // hole in it, and the head is the one mark the eye goes to first.
        const crown = m(lerp(k.spine[2], k.neck, 0.35));
        load.dab(crown[0], crown[1], 0.075 * s, 0.05 * s, k.headTilt, {
          ...dark,
          cool: dark.cool * 0.5,
          warm: look.warm * 0.28,
          water: 0.26,
          dry: 0.45,
          soft: 0.95,
        });

        // The turn of the shoulder and the shadow under the chin: the two
        // darkest notes on a figure, and the ones that make it turn in space.
        load.stroke([m(k.shoulder[1]), m(lerp(k.shoulder[1], k.elbow[1], 0.45))], {
          ...dark,
          width: 0.024,
          taper: 0.5,
        });
        const chin = m(lerp(k.head, k.neck, 0.6));
        load.dab(chin[0], chin[1], 0.026 * s, 0.02 * s, k.headTilt, { ...dark, soft: 0.5 });

        // The weight-bearing side, from the hip down. Where the figure meets
        // the ground is where a watercolour is darkest.
        const low = k.foot[0][1] > k.foot[1][1] ? 0 : 1;
        load.stroke([m(k.hip[low]), m(lerp(k.hip[low], k.knee[low], 0.6))], {
          ...dark,
          width: 0.026,
          taper: 0.55,
        });

        prop(load, k, p, m, look, r);

        // A few flicks that go nowhere, which is how a loaded brush leaves the
        // paper. Take them out and the picture looks printed. Short, or they
        // read as somebody drawing a line through their own painting.
        for (let i = 0; i < 3; i++) {
          const from = m(lerp(k.pelvis, k.spine[2], r()));
          const a = rad(p.flowAt + (r() - 0.5) * 110);
          const len = (0.04 + r() * 0.03) * s;
          load.stroke(
            [
              from,
              [from[0] + Math.cos(a) * len * 0.6, from[1] + Math.sin(a) * len * 0.6 * look.aspect],
              [from[0] + Math.cos(a) * len, from[1] + Math.sin(a) * len * look.aspect],
            ],
            {
              ...dark,
              cool: dark.cool * 0.5,
              warm: look.warm * 0.6,
              width: 0.011,
              taper: 0.2,
              dry: 0.5,
              water: 0.3,
            },
          );
        }
      },
    },
  ];
}

/**
 * Where she meets the ground.
 *
 * A dab, not a stroke. The first version drew a horizontal line under the
 * figure and it read as a scratch on the paper every time — a straight mark
 * with two ends is a *drawn* thing, and this picture has no drawn things in it.
 * A soft wet ellipse with nothing else to it reads as contact and as nothing
 * else, which is all it is being asked to do.
 */
export function perchMark(load: Load, p: Pose, look: Look, footY: number) {
  const kind: Perch = p.perch ?? 'none';
  if (kind === 'none') return;
  const r = rnd(look.seed ^ 0x0a5f);
  load.dab(look.at[0] + (r() - 0.5) * 0.04, footY, (kind === 'ledge' ? 0.2 : 0.15) *
    (0.8 + r() * 0.4), 0.035 + r() * 0.02, 0, {
    cool: look.cool * 0.3,
    warm: look.warm * 0.28,
    water: 0.55,
    width: 0,
    dry: 0.5,
    soft: 0.95,
  });
}
