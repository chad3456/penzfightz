import { figure, type Face, type Hair, type Look } from './body';
import { disc, grain, Light, poly, type Frame } from './ink';
import { palette, PAPER, type Palette } from './palette';
import { prop, PROP_NAME, PROP_REACH, type PropId } from './props';
import { GODS, type God } from './gods';
import { mirror, POSE_BY_ID, skeleton, type Pose, type Pt } from './rig';

/**
 * One card.
 *
 * The whole point of the exercise is that the thirty-two Krishnas are
 * thirty-two *different pictures*, so a variant is not a recolour: it picks a
 * pose from the ones that suit the god, mirrors it or not, moves the light,
 * changes the hair, chooses which hand carries what, and reframes the camera.
 * Six independent choices, which is far more than thirty-two combinations, and
 * the seed is what makes any given one reproducible.
 */

export const ASPECT = 2 / 3;

export interface Variant {
  god: God;
  index: number;
  seed: number;
  pose: Pose;
  poseName: string;
  hair: Hair;
  holds: [PropId, PropId];
  /** How close the crop is. */
  frame: number;
  /** A blurb for the caption. */
  line: string;
}

const rng = (seed: number) => {
  let a = (seed ^ 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * The variants for one god.
 *
 * The pose is chosen by *index* rather than by the seed, so asking for
 * thirty-two gets you every pose in the god's list before it repeats any of
 * them — a random draw over twelve poses would give three or four duplicates
 * in thirty-two and they would be the first thing anybody noticed.
 */
export function variants(god: God, count: number, seed = 3): Variant[] {
  const out: Variant[] = [];
  for (let i = 0; i < count; i++) {
    const r = rng(seed * 7919 + i * 104729 + god.id.length * 31);
    const base = POSE_BY_ID[god.poses[i % god.poses.length]];
    const flipped = Math.floor(i / god.poses.length) % 2 === 1;
    const pose = flipped ? mirror(base) : base;
    const hair = god.hair[Math.floor(r() * god.hair.length) % god.hair.length];
    const a = god.holds[0] ?? 'none';
    const b = god.holds[1] ?? 'none';
    out.push({
      god,
      index: i,
      seed: seed * 131 + i * 7717 + god.id.charCodeAt(0),
      pose,
      poseName: base.name,
      hair,
      holds: r() < 0.5 ? [a, b] : [b, a],
      frame: 0.93 + r() * 0.05,
      line: `${base.name}${flipped ? ', turned' : ''} · ${PROP_NAME[a]}`,
    });
  }
  return out;
}

/** Every card in the gallery. */
export function deck(perGod: number, seed = 3): Variant[] {
  return GODS.flatMap((g) => variants(g, perGod, seed));
}

/**
 * The ground.
 *
 * A single soft ellipse and a horizon band. The reference has almost nothing
 * down there — a shadow and a change of tone — and resisting the urge to build
 * a floor is most of why the figure reads as being *on a page* rather than in
 * a room.
 */
function ground(f: Frame, L: Light, pal: Palette, y: number, x: number, wide: number, hover: number) {
  // A shadow, and nothing else. A band across the card gives the figure a
  // floor, and the moment it has a floor it is in a room; the reference keeps
  // it on a page, and the way it does that is by drawing almost nothing.
  for (let i = 3; i > 0; i--) {
    const t = i / 3;
    disc(f, [x, y + 0.012 + hover], wide * t * (1 - hover * 1.4), 0.026 * t * (1 - hover), 0, pal.ink, (0.09 - hover * 0.24) * t);
  }
  void L;
  void poly;
}

/**
 * Draw one portrait.
 *
 * `w` is the short side and everything is a fraction of it, so the same code
 * makes the atlas cell and the print.
 */
export function drawPortrait(g: CanvasRenderingContext2D, v: Variant, w: number, h: number) {
  const god = v.god;
  const r = rng(v.seed);
  g.save();
  g.clearRect(0, 0, w, h);

  const pal = palette(god.skin, r, god.cloth, god.wrap);
  g.fillStyle = pal.paper;
  g.fillRect(0, 0, w, h);

  // The god decides how many arms, not the pose. Durga was carved with eight
  // and was coming out with two, because `extraPairs` lived on the deity and
  // `skeleton` only ever read the pose.
  const sk = skeleton({ ...v.pose, extra: Math.max(god.extraPairs, v.pose.extra ?? 0) });
  // The camera. The figure is fitted to the frame by its own extent rather
  // than by a fixed number, so a leaping Hanuman and a seated Ganesha are both
  // comfortably inside the card instead of one being lost and one clipped.
  const pts: Pt[] = [
    sk.crown, sk.toe[0], sk.toe[1], sk.hand[0], sk.hand[1],
    sk.elbow[0], sk.elbow[1], sk.knee[0], sk.knee[1], ...sk.extra.map((e) => e.hand),
  ];
  // Where each attribute ends up, so the frame is drawn round the god *and*
  // the thing he is holding rather than round the god alone.
  const tip = (hand: Pt, wrist: Pt, id: PropId): Pt => {
    const dx = hand[0] - wrist[0];
    const dy = hand[1] - wrist[1];
    const n = Math.hypot(dx, dy) || 1;
    const reach = PROP_REACH[id] ?? 0;
    return [hand[0] + (dx / n) * reach, hand[1] + (dy / n) * reach];
  };
  for (const [k, which] of ([[0, v.pose.hold[0]], [1, v.pose.hold[1]]] as const)) {
    pts.push(tip(sk.hand[which], sk.wrist[which], v.holds[k]));
  }
  sk.extra.forEach((e, i) => pts.push(tip(e.hand, e.wrist, god.spare[i % Math.max(1, god.spare.length)] ?? 'none')));
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const p of pts) {
    x0 = Math.min(x0, p[0]);
    x1 = Math.max(x1, p[0]);
    y0 = Math.min(y0, p[1]);
    y1 = Math.max(y1, p[1]);
  }
  y0 -= 0.2;
  y1 = Math.max(y1, sk.ground) + 0.03;
  x0 -= 0.16;
  x1 += 0.16;
  // Fit on *height* and only give way to width when the arms genuinely need
  // it. Fitting on whichever is tighter makes a figure with its arms out come
  // out half the size of one standing still, and a contact sheet of that is a
  // gallery where the pose decides how important the god is.
  const spanY = Math.max(1.12, y1 - y0);
  const spanX = Math.max(0.62, x1 - x0);
  const byH = (h * v.frame) / spanY;
  const byW = (w * 0.98) / spanX;
  // Height decides, and width is allowed to argue only so far. Taking whichever
  // is tighter shrinks a dancing figure to half the size of a standing one,
  // and on a contact sheet that reads as the pose deciding how important the
  // god is. A wide pose may bleed a little past the edge instead.
  const fit = Math.max(byH * 0.72, Math.min(byH, byW));
  // Stand the figure on a line, rather than centring its bounding box. Centred,
  // a seated god floats in the middle of the card with a hand's width of
  // nothing under him and a standing one sits on the bottom edge; anchored, all
  // thirteen stand on the same ground.
  const f: Frame = { g, h: fit, x: w / 2 - ((x0 + x1) / 2) * fit, y: h * 0.88 - sk.ground * fit };
  const top = f.y + y0 * fit;
  if (top < h * 0.05) f.y += h * 0.05 - top;

  // The light. Kept close to vertical: the figure is two and a half times
  // taller than it is wide, so a terminator tilted more than about a fifth of
  // a radian stops reading as a line down the body and becomes a horizon
  // across it, which lights the head differently from the feet.
  const L = new Light((r() - 0.5) * 0.38, (r() - 0.5) * 1.1, 0.03 + r() * 0.05, v.seed);

  const look: Look = {
    hair: v.hair,
    face: god.face,
    facing: v.pose.headTurn >= 0 ? 1 : -1,
    thirdEye: god.thirdEye,
    thread: god.thread,
    ornament: god.ornament,
    crescent: god.crescent,
    feather: god.feather,
    garland: god.garland,
    halo: god.halo * (0.85 + r() * 0.3),
  };

  ground(f, L, pal, sk.ground, sk.pelvis[0], 0.13, v.pose.hover ?? 0);

  // The extra hands get their attributes first, because they are behind.
  sk.extra.forEach((e, i) => {
    const id = god.spare[i % Math.max(1, god.spare.length)] ?? 'none';
    prop(f, L, pal, id, e.hand, [e.hand[0] - e.wrist[0], e.hand[1] - e.wrist[1]], 1, v.seed + i);
  });

  figure(f, L, sk, pal, {
    skin: god.skin,
    look,
    garment: god.garment,
    female: god.female,
    extraTone: { light: god.skin.dark, dark: god.skin.dark },
  }, v.seed);

  // The principal attributes, in the hands the pose nominated.
  for (const [k, which] of ([[0, v.pose.hold[0]], [1, v.pose.hold[1]]] as const)) {
    const id = v.holds[k];
    if (id === 'none') continue;
    const i = which;
    const raised = sk.hand[i][1] < sk.chest[1];
    prop(f, L, pal, id, sk.hand[i], [sk.hand[i][0] - sk.wrist[i][0], sk.hand[i][1] - sk.wrist[i][1]], 1, v.seed + k, raised);
  }

  // The tooth of the paper, over everything, which is what stops flat colour
  // from looking like a screenshot of flat colour.
  grain(f, [-1.6, -1.2, 1.6, 2.4], '#8a7c5e', 900, v.seed + 5);
  g.restore();
}

export { PAPER, GODS };
export { GOD_BY_ID } from './gods';
export type { Face, God };
