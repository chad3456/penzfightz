/**
 * People, drawn the ligne-claire way: built from a pose by forward
 * kinematics, each part an outlined flat shape, the parts drawn in groups so
 * that seams vanish inside a silhouette (arm into hand, thigh into shin) but
 * the near arm keeps its line where it crosses the chest.
 *
 * A figure faces right in its own frame; `turn` in −1…1 says how far it is
 * turned from facing the viewer (0) to profile (±1), and its sign which way
 * it faces. Angles in a pose are absolute, in degrees: 0 is straight down,
 * 90 forward (the way the figure faces), −90 backward, 180 straight up.
 * Units are about a centimetre on a 170 cm figure: a standing figure is
 * about 96 units tall.
 */
import { type G, type Pt, type Part, group, INK, shade, TAU, D, ellipse, ln, rng, pick, rounded, SKIN, HAIR, C } from './kit';

export type HairStyle = 'short' | 'buzz' | 'long' | 'bob' | 'ponytail' | 'bun' | 'afro' | 'curly' | 'bald' | 'balding' | 'braids' | 'hijab' | 'locs' | 'side';
export type TopKind = 'tee' | 'shirt' | 'sweater' | 'hoodie' | 'jacket' | 'scrubs' | 'blouse' | 'tank' | 'coat' | 'dress' | 'vest';
export interface Look {
  skin: string; hair: string; style: HairStyle;
  top: string; topKind?: TopKind; sleeve?: 'long' | 'short' | 'none';
  inner?: string; accent?: string;
  bottom: string; bottomKind?: 'pants' | 'shorts' | 'skirt' | 'longskirt';
  shoes: string;
  fem?: boolean; build?: number; height?: number; age?: 'kid' | 'teen' | 'adult' | 'old';
  beard?: boolean | 'stubble' | 'mustache'; glasses?: string | boolean;
  hat?: { kind: 'cap' | 'beanie' | 'hardhat' | 'cowboy' | 'bucket' | 'headphones' | 'band' | 'mortar' | 'helmet' | 'shako'; color: string; tassel?: string };
  /** vertical stripes on the top (a referee, a sailor) */
  stripes?: string;
  /** a number on the chest */
  number?: string;
  bag?: { kind: 'backpack' | 'tote' | 'messenger'; color: string };
  apron?: string; lanyard?: string; scarf?: string; socks?: string;
  /** the cloth of a hijab */
  hijab?: string;
}
export interface Pose {
  lean?: number; head?: number;
  armN: [number, number]; armF: [number, number];
  legN: [number, number]; legF: [number, number];
  /** length factors for limbs coming toward the viewer */
  kArmN?: [number, number]; kArmF?: [number, number]; kLegN?: [number, number]; kLegF?: [number, number];
  /** the seat is under the pelvis (sitting) */
  sit?: boolean;
}
export interface Fig {
  x: number; y: number; s: number; turn: number; look: Look; pose: Pose;
  back?: boolean; rot?: number; lw?: number; anchor?: 'feet' | 'seat' | 'pelvis';
  /** drawn in front of the torso and behind the near arm (things held) */
  hold?: (g: G, J: Joints) => void;
  /** drawn over everything */
  over?: (g: G, J: Joints) => void;
  face?: 'smile' | 'flat' | 'open' | 'o' | 'sleep' | 'frown';
  eyes?: 'dot' | 'closed' | 'down';
}
export interface Joints { P: Pt; N: Pt; H: Pt; sN: Pt; sF: Pt; eN: Pt; eF: Pt; hN: Pt; hF: Pt; kN: Pt; kF: Pt; aN: Pt; aF: Pt; s: number; fwd: number; u: (x: number, y: number) => Pt }

/* ───────── poses ───────── */

export const POSES = {
  stand: { armN: [-5, 2], armF: [9, 16], legN: [-2, -1], legF: [4, 2] },
  standFront: { armN: [-10, -4], armF: [10, 4], legN: [-4, -2], legF: [4, 2] },
  hips: { armN: [-40, 40], armF: [40, -40], legN: [-5, -3], legF: [5, 3] },
  sit: { sit: true, lean: 2, armN: [18, 72], armF: [24, 76], legN: [86, 2], legF: [82, -4] },
  sitDesk: { sit: true, lean: 12, head: 14, armN: [36, 86], armF: [42, 90], legN: [86, 2], legF: [82, -4] },
  sitRead: { sit: true, lean: 6, head: 22, armN: [22, 122], armF: [30, 128], legN: [86, 2], legF: [82, -4] },
  sitPhone: { sit: true, lean: 4, head: 26, armN: [14, 120], armF: [30, 100], legN: [86, 2], legF: [82, -4] },
  sitBack: { sit: true, lean: -12, head: -4, armN: [-10, 30], armF: [10, 60], legN: [80, 30], legF: [70, 20] },
  sitCross: { sit: true, lean: 2, armN: [15, 70], armF: [24, 76], legN: [88, 0], legF: [70, -70] },
  walk: { lean: 3, armN: [-18, -6], armF: [18, 32], legN: [-20, -32], legF: [20, 6] },
  walk2: { lean: 3, armN: [16, 30], armF: [-16, -4], legN: [20, 6], legF: [-20, -32] },
  stride: { lean: 4, armN: [-28, -14], armF: [28, 50], legN: [-26, -44], legF: [26, 10] },
  run: { lean: 14, armN: [-40, 40], armF: [50, 120], legN: [-40, -100], legF: [55, -10] },
  phone: { head: 24, armN: [8, 126], armF: [-4, 6], legN: [-2, -1], legF: [4, 2] },
  call: { head: 4, armN: [10, 160], armF: [-4, 6], legN: [-2, -1], legF: [4, 2] },
  reach: { lean: -3, head: -20, armN: [-4, 4], armF: [164, 172], legN: [-2, -1], legF: [4, 2] },
  carry: { lean: -2, armN: [34, 82], armF: [40, 88], legN: [-2, -1], legF: [4, 2] },
  cradle: { lean: -2, head: 16, armN: [26, 98], armF: [36, 104], legN: [-2, -1], legF: [4, 2] },
  point: { head: -4, armN: [-4, 4], armF: [96, 98], legN: [-2, -1], legF: [4, 2] },
  wave: { armN: [-5, 2], armF: [140, 172], legN: [-2, -1], legF: [4, 2] },
  handsUp: { armN: [-130, -168], armF: [130, 168], legN: [-4, -2], legF: [4, 2] },
  lean: { lean: 18, head: -8, armN: [62, 92], armF: [68, 96], legN: [-6, -4], legF: [6, 4] },
  sweep: { lean: 8, armN: [40, 30], armF: [60, 20], legN: [-8, -6], legF: [10, 8] },
  kneel: { lean: 4, armN: [30, 70], armF: [40, 80], legN: [6, -88], legF: [80, 2] },
  floorCross: { sit: true, lean: 0, armN: [10, 40], armF: [20, 50], legN: [-62, 96], legF: [62, -96], kLegN: [0.8, 0.85], kLegF: [0.8, 0.85] },
  floorLegs: { sit: true, lean: -14, armN: [-40, -20], armF: [-30, -20], legN: [88, 92], legF: [84, 94] },
  guitar: { sit: true, lean: 6, head: 18, armN: [46, 100], armF: [30, 140], legN: [86, 2], legF: [82, -4] },
  play: { lean: 2, head: 10, armN: [40, 100], armF: [60, 120], legN: [-4, -2], legF: [6, 3] },
  cook: { lean: 8, head: 16, armN: [30, 80], armF: [44, 92], legN: [-3, -1], legF: [5, 2] },
  sleep: { sit: true, lean: -24, head: -26, armN: [-6, 40], armF: [24, 70], legN: [76, 24], legF: [66, 14] },
} satisfies Record<string, Pose>;

/* ───────── looks ───────── */

const TOPS = [C.red, C.mustard, C.teal, C.navy, C.pink, C.lav, C.olive, C.cream, C.sky, C.orange, C.green, C.white, C.coral, C.violet, C.butter, C.denim, C.wine, C.mint];
const BOTTOMS = [C.denim, C.navy, C.khaki, C.char, C.black, C.brown, C.olive, C.grey, C.tan, C.wine];
const SHOES = [C.white, C.black, C.brown, C.char, C.red, C.tan];
const STYLES_F: HairStyle[] = ['long', 'bob', 'ponytail', 'bun', 'curly', 'afro', 'braids', 'long', 'side', 'locs'];
const STYLES_M: HairStyle[] = ['short', 'buzz', 'short', 'curly', 'balding', 'side', 'afro', 'locs', 'short'];

/** A look drawn at random from the palette, with a few things forced. */
export function randomLook(seed: number, over: Partial<Look> = {}): Look {
  const R = rng(seed);
  const fem = over.fem ?? R() < 0.5;
  const skin = pick(R, SKIN);
  const dark = SKIN.indexOf(skin as (typeof SKIN)[number]) >= 4;
  const age = over.age ?? (R() < 0.12 ? 'old' : 'adult');
  const hair = age === 'old' ? pick(R, [HAIR.grey, HAIR.white, HAIR.ash]) : dark ? pick(R, [HAIR.black, HAIR.dark, HAIR.black]) : pick(R, [HAIR.black, HAIR.dark, HAIR.brown, HAIR.auburn, HAIR.blond, HAIR.ginger, HAIR.brown]);
  const style = over.style ?? (fem ? pick(R, STYLES_F) : pick(R, STYLES_M));
  const kinds: TopKind[] = fem ? ['tee', 'blouse', 'sweater', 'jacket', 'tee', 'dress', 'hoodie'] : ['tee', 'shirt', 'sweater', 'hoodie', 'jacket', 'tee'];
  const topKind = pick(R, kinds);
  const bottomKind = fem && topKind !== 'dress' ? pick(R, ['pants', 'pants', 'skirt', 'longskirt', 'shorts'] as const) : pick(R, ['pants', 'pants', 'pants', 'shorts'] as const);
  return {
    skin, hair, style, fem, age, topKind, bottomKind,
    top: pick(R, TOPS), inner: pick(R, TOPS), bottom: pick(R, BOTTOMS), shoes: pick(R, SHOES),
    sleeve: topKind === 'tee' ? 'short' : 'long',
    build: 0.9 + R() * 0.3, height: (fem ? 0.93 : 0.98) + R() * 0.08,
    beard: !fem && age !== 'kid' && R() < 0.25 ? (R() < 0.5 ? true : 'stubble') : false,
    glasses: R() < 0.22,
    ...over,
  };
}

/* ───────── the figure ───────── */

const v = (a: number, L: number): Pt => [Math.sin(a * D) * L, Math.cos(a * D) * L];
const add = (p: Pt, q: Pt): Pt => [p[0] + q[0], p[1] + q[1]];
const mid = (p: Pt, q: Pt, t = 0.5): Pt => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];

export function person(g: G, f: Fig): Joints {
  const L = f.look, P0 = f.pose;
  const kid = L.age === 'kid', teen = L.age === 'teen', old = L.age === 'old';
  const sc = (L.height ?? 1) * (kid ? 0.62 : teen ? 0.9 : 1), bw = (L.build ?? 1) * (kid ? 0.8 : 1);
  const hs = kid ? 1.22 : teen ? 1.04 : 1;
  const fwd = f.turn >= 0 ? 1 : -1, th = Math.min(1, Math.abs(f.turn)) * 90 * D, ct = Math.cos(th), st = Math.sin(th);
  const back = !!f.back;
  const lean = (P0.lean ?? 0) + (old ? 6 : 0), headTilt = P0.head ?? 0;
  const lwPx = f.lw ?? Math.max(1.1, Math.min(4.2, f.s * 0.62));
  const lw = lwPx / f.s;

  // skeleton, pelvis at the origin, facing +x
  const TL = 30 * sc * (kid ? 0.95 : 1);
  const P: Pt = [0, 0];
  const N: Pt = add(P, [Math.sin(lean * D) * TL, -Math.cos(lean * D) * TL]);
  const fem = !!L.fem;
  const TWs = (fem ? 8.4 : 9.6) * bw * (ct + st * 0.6), TWw = (fem ? 7 : 8.6) * bw * (ct + st * 0.66), TWh = (fem ? 9.2 : 8.4) * bw * (ct + st * 0.74);
  const sj = Math.max(0.6, (TWs - 3) * ct);
  const sN: Pt = add(N, [-sj - st * 0.6, 4.8]), sF: Pt = add(N, [sj + st * 0.6, 4.8]);
  const hj = Math.max(0.5, (TWh - 4.2) * ct);
  const hipN: Pt = [-hj - st * 0.5, 1.5], hipF: Pt = [hj + st * 0.5, 1.5];
  const UA = 15 * sc, LA = 14.5 * sc, TH = 24 * sc, SH = 23.5 * sc;
  const k = (q: [number, number] | undefined, i: number) => (q ? q[i] : 1);
  const eN = add(sN, v(P0.armN[0], UA * k(P0.kArmN, 0))), hN = add(eN, v(P0.armN[1], LA * k(P0.kArmN, 1)));
  const eF = add(sF, v(P0.armF[0], UA * k(P0.kArmF, 0))), hF = add(eF, v(P0.armF[1], LA * k(P0.kArmF, 1)));
  const kN = add(hipN, v(P0.legN[0], TH * k(P0.kLegN, 0))), aN = add(kN, v(P0.legN[1], SH * k(P0.kLegN, 1)));
  const kF = add(hipF, v(P0.legF[0], TH * k(P0.kLegF, 0))), aF = add(kF, v(P0.legF[1], SH * k(P0.kLegF, 1)));
  const neckL = 5.4 * sc * (kid ? 0.7 : 1);
  const H: Pt = add(N, [Math.sin((lean + headTilt * 0.5) * D) * neckL + st * 1.2, -Math.cos((lean + headTilt * 0.5) * D) * neckL]);
  const hx = 6.3 * hs * (fem ? 0.96 : 1), hy = 7.5 * hs * (fem ? 0.97 : 1);
  const Hc: Pt = add(H, [0, -hy * 0.82]);

  // where the figure stands
  const shoeR = 2.3;
  let oy = 0;
  if ((f.anchor ?? (P0.sit ? 'seat' : 'feet')) === 'feet') oy = -Math.max(aN[1], aF[1]) - shoeR - 0.6;
  else if ((f.anchor ?? 'seat') === 'seat') oy = -3.5;

  g.save();
  g.translate(f.x, f.y); if (f.rot) g.rotate(f.rot); g.scale(fwd * f.s, f.s); g.translate(0, oy);
  const M = g.getTransform();
  const u = (x: number, y: number): Pt => { const p = M.transformPoint({ x, y }); return [p.x, p.y]; };

  const sleeve = L.topKind === 'tank' || L.topKind === 'vest' ? 'none' : L.sleeve ?? (L.topKind === 'tee' || L.topKind === 'scrubs' ? 'short' : 'long');
  const top = L.top, bottom = L.bottom;
  const bk = L.bottomKind ?? 'pants';
  const skin = L.skin;
  const aw = 4.9 * bw, fw = 4.1 * bw, tw = 8.2 * bw * (fem ? 1.04 : 1), shw = 5.8 * bw;

  /* arm parts: [skin parts, cloth parts] */
  const armParts = (s: Pt, e: Pt, h: Pt): [Part[], Part[]] => {
    const handC = add(h, [(h[0] - e[0]) * 0.16, (h[1] - e[1]) * 0.16]);
    const hand: Part = { k: 'ell', x: handC[0], y: handC[1], rx: 2.4 * bw, ry: 2.8 * bw, rot: Math.atan2(h[0] - e[0], -(h[1] - e[1])) };
    if (sleeve === 'long') return [[hand], [{ k: 'limb', pts: [s, e, mid(e, h, 0.86)], w: aw }]];
    if (sleeve === 'short') return [[{ k: 'limb', pts: [mid(s, e, 0.5), e, h], w: fw }, hand], [{ k: 'limb', pts: [s, mid(s, e, 0.55)], w: aw + 1.2 }]];
    return [[{ k: 'limb', pts: [s, e, h], w: fw }, hand], []];
  };
  const arm = (s: Pt, e: Pt, h: Pt) => {
    const [sk, cl] = armParts(s, e, h);
    group(g, sk, skin, lw);
    // close up, the hand gets fingers: three short creases toward its tip
    if (f.s > 2.6) {
      const ang = Math.atan2(h[0] - e[0], h[1] - e[1]), hc = add(h, [(h[0] - e[0]) * 0.16, (h[1] - e[1]) * 0.16]);
      g.save(); g.translate(hc[0], hc[1]); g.rotate(-ang); g.strokeStyle = INK; g.lineWidth = lw * 0.7; g.lineCap = 'round';
      for (const dx of [-0.9, 0, 0.9]) { g.beginPath(); g.moveTo(dx * bw, 1.2 * bw); g.lineTo(dx * bw * 1.1, 2.7 * bw); g.stroke(); }
      g.beginPath(); g.ellipse(-2.2 * bw, -0.2, 0.9, 1.5, 0.5, 0, TAU); g.fillStyle = skin; g.fill(); g.stroke();
      g.restore();
    }
    if (cl.length) group(g, cl, L.topKind === 'jacket' || L.topKind === 'coat' ? top : top, lw);
  };
  /* leg parts */
  const leg = (hip: Pt, kn: Pt, an: Pt) => {
    const shoe: Part = { k: 'ell', x: an[0] + 2.8 * st + 0.6, y: an[1] + 1.2, rx: 2.8 + 2.6 * st, ry: shoeR, rot: 0 };
    if (bk === 'shorts' || bk === 'skirt' || bk === 'longskirt' || L.topKind === 'dress') {
      group(g, [{ k: 'limb', pts: [hip, kn], w: tw * 0.9 }, { k: 'limb', pts: [kn, an], w: shw * 0.95 }], skin, lw);
      if (L.socks) group(g, [{ k: 'limb', pts: [mid(kn, an, 0.7), an], w: shw }], L.socks, lw);
      if (bk === 'shorts') group(g, [{ k: 'limb', pts: [hip, mid(hip, kn, 0.78)], w: tw + 1.4 }], bottom, lw);
    } else {
      group(g, [{ k: 'limb', pts: [hip, kn], w: tw }, { k: 'limb', pts: [kn, mid(kn, an, 0.97)], w: shw + 0.6 }], bottom, lw);
    }
    group(g, [shoe], L.shoes, lw);
  };

  /* hair behind the body */
  const hairBack = () => {
    const s = L.style, hb = L.hair;
    if (s === 'long' || s === 'braids' || s === 'locs') {
      const len = s === 'long' ? 20 : 24;
      const bx = back ? 0 : -st * 2.5;
      group(g, [{ k: 'blob', pts: [[Hc[0] - hx * 1.08 + bx, Hc[1] - 2], [Hc[0] + bx - 1, Hc[1] - hy * 1.05], [Hc[0] + hx * 1.06 + bx * 0.4, Hc[1] - 1], [Hc[0] + hx * 1.15 + bx * 0.3, Hc[1] + len * 0.6], [Hc[0] + hx * 0.9 + bx, Hc[1] + len], [Hc[0] - hx * 0.9 + bx, Hc[1] + len + 1], [Hc[0] - hx * 1.2 + bx, Hc[1] + len * 0.55]] }], hb, lw);
      if (s !== 'long') { g.save(); g.strokeStyle = shade(hb.startsWith('#') ? hb : '#333333', 0.25); g.lineWidth = lw * 0.8; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(Hc[0] + i * 2.2 + bx, Hc[1] + 3); g.lineTo(Hc[0] + i * 2.6 + bx, Hc[1] + len - 1); g.stroke(); } g.restore(); }
    } else if (s === 'bob') {
      group(g, [{ k: 'blob', pts: [[Hc[0] - hx * 1.18, Hc[1] - 1], [Hc[0], Hc[1] - hy * 1.08], [Hc[0] + hx * 1.15, Hc[1] - 1], [Hc[0] + hx * 1.12, Hc[1] + hy * 0.95], [Hc[0] - hx * 1.15, Hc[1] + hy * 0.98]] }], L.hair, lw);
    } else if (s === 'afro') {
      group(g, [{ k: 'ell', x: Hc[0] - st * 1.2, y: Hc[1] - 2.2, rx: hx * 1.55, ry: hy * 1.35 }], L.hair, lw);
    } else if (s === 'ponytail') {
      const bx = Hc[0] - (back ? 0 : hx * (0.5 + st * 0.6));
      group(g, [{ k: 'blob', pts: [[bx - 1, Hc[1] - 3], [bx + 2.5, Hc[1] - 2], [bx + 1.5, Hc[1] + 8], [bx - 1, Hc[1] + 15], [bx - 3.5, Hc[1] + 9]] }], L.hair, lw);

    }
  };

  /* the head: face, features, hair on top */
  const head = () => {
    const fc = back ? 0 : st * hx * 0.5;
    // ears
    const ears: Part[] = [];
    if (!back && L.style !== 'hijab') {
      if (st < 0.5) { ears.push({ k: 'ell', x: Hc[0] - hx * 0.97 + fc * 0.3, y: Hc[1] + 1.0, rx: 0.95, ry: 1.7 }); }
      ears.push(st < 0.5 ? { k: 'ell', x: Hc[0] + hx * 0.97 + fc * 0.3, y: Hc[1] + 1.0, rx: 0.95, ry: 1.7 } : { k: 'ell', x: Hc[0] - hx * (0.6 + 0.25 * (1 - st)), y: Hc[1] + 1.3, rx: 1.05, ry: 1.9 });
    }
    // jaw
    const pts: Pt[] = [];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU, sa = Math.sin(a), ca = Math.cos(a);
      let x = hx * ca, y = hy * sa;
      if (sa > 0 && !back) { x = x * (1 - 0.16 * sa * (kid ? 0.3 : 1)) + st * 1.5 * sa; }
      pts.push([Hc[0] + x, Hc[1] + y]);
    }
    if (L.style === 'hijab') hijabDrape();
    const parts: Part[] = [...ears, { k: 'blob', pts }];
    if (!back && st > 0.8) parts.push({ k: 'poly', pts: [[Hc[0] + hx * 0.9, Hc[1] - 0.6], [Hc[0] + hx + 1.6, Hc[1] + 1.9], [Hc[0] + hx * 0.92, Hc[1] + 2.6]], r: 0.6 });
    group(g, parts, skin, lw);

    const ey = Hc[1] + 0.4 * hs, gap = 2.35 * ct * hs + 0.5;
    const eyeL: Pt = [Hc[0] + fc - gap, ey], eyeR: Pt = [Hc[0] + fc + gap * 0.82, ey];
    const showL = st < 0.88, showR = true;
    // beard below the features
    if (!back && L.beard && L.beard !== 'mustache') {
      const bp: Pt[] = [];
      // sideburn at the back of the cheek, round the jaw, and up under the nose
      const jaw = (a: number): Pt => [Hc[0] + Math.cos(a) * hx * (1 - 0.16 * Math.sin(a)) * 0.99 + st * 1.5 * Math.sin(a), Hc[1] + Math.sin(a) * hy * 0.99];
      for (let i = 0; i <= 12; i++) { const a = 0.05 + (i / 12) * (Math.PI - 0.1); bp.push(jaw(a)); }
      const mxx = Hc[0] + fc + st * 1.5, myy = Hc[1] + 4.3 * hs;
      bp.push([Hc[0] - hx * 0.86 + fc * 0.2, Hc[1] + 1.2], [mxx - 2.4, myy + 1.0], [mxx, myy + 1.5], [mxx + 2.6, myy + 1.0], [Hc[0] + hx * 0.9 + st, Hc[1] + 1.4]);
      g.save(); g.globalAlpha = L.beard === 'stubble' ? 0.22 : 1; group(g, [{ k: 'poly', pts: bp, r: 1.2 }], L.hair, L.beard === 'stubble' ? 0 : lw); g.restore();
      if (L.beard === true) group(g, [{ k: 'blob', pts: [[mxx - 2.6, myy - 0.2], [mxx, myy - 1.6], [mxx + 2.8, myy - 0.2], [mxx, myy - 0.5]] }], L.hair, lw * 0.8);
    }
    // the face
    if (!back) {
      const er = Math.max(0.62, 1.15 / f.s) * hs;
      g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = 'round'; g.lineWidth = lw * 0.9;
      const eye = (p: Pt) => {
        if (f.eyes === 'closed' || f.face === 'sleep') { g.beginPath(); g.arc(p[0], p[1] - 0.2, 1.0, 0.2, Math.PI - 0.2); g.stroke(); }
        else if (f.eyes === 'down') { g.beginPath(); g.moveTo(p[0] - 0.9, p[1] + 0.2); g.lineTo(p[0] + 0.9, p[1] + 0.2); g.stroke(); }
        else { g.beginPath(); g.ellipse(p[0], p[1], er * 0.9, er * 1.12, 0, 0, TAU); g.fill(); }
      };
      if (showL) eye(eyeL); if (showR) eye(eyeR);
      // brows
      if (f.s > 1.6) {
        g.lineWidth = lw * 0.85;
        const bro = (p: Pt) => { g.beginPath(); g.moveTo(p[0] - 1.1, p[1] - 2.3); g.quadraticCurveTo(p[0], p[1] - 2.9, p[0] + 1.2, p[1] - 2.4); g.stroke(); };
        if (showL) bro(eyeL); bro(eyeR);
      }
      // nose
      g.lineWidth = lw * 0.85;
      if (st <= 0.8) { const nx = Hc[0] + fc + st * 1.4, ny = Hc[1] + 2.5 * hs; g.beginPath(); g.moveTo(nx + 0.2, ny - 1.3); g.quadraticCurveTo(nx + 1.1 + st * 0.4, ny - 0.1, nx - 0.1, ny + 0.3); g.stroke(); }
      // mouth
      const mx = Hc[0] + fc + st * 1.5, my = Hc[1] + 4.3 * hs - (kid ? 0.6 : 0);
      g.beginPath();
      if (f.face === 'open') { g.ellipse(mx, my + 0.3, 1.2, 0.95, 0, 0, TAU); g.fillStyle = '#5a2020'; g.fill(); g.lineWidth = lw * 0.8; g.stroke(); }
      else if (f.face === 'o') { g.ellipse(mx, my + 0.2, 0.7, 0.85, 0, 0, TAU); g.fillStyle = INK; g.fill(); }
      else if (f.face === 'flat' || f.face === 'sleep') { g.moveTo(mx - 1.1, my); g.lineTo(mx + 1.1, my); g.stroke(); }
      else if (f.face === 'frown') { g.moveTo(mx - 1.2, my + 0.5); g.quadraticCurveTo(mx, my - 0.5, mx + 1.2, my + 0.5); g.stroke(); }
      else { g.moveTo(mx - 1.3, my - 0.2); g.quadraticCurveTo(mx, my + 1.1, mx + 1.4, my - 0.3); g.stroke(); }
      if (L.beard === 'mustache') group(g, [{ k: 'blob', pts: [[mx - 2.2, my - 0.6], [mx, my - 1.5], [mx + 2.2, my - 0.6], [mx, my - 0.4]] }], L.hair, lw * 0.7);
      if (old && f.s > 1.4) { g.globalAlpha = 0.5; g.lineWidth = lw * 0.6; g.beginPath(); g.moveTo(mx + 2, my - 2.4); g.quadraticCurveTo(mx + 2.6, my - 1, mx + 2.1, my); g.stroke(); g.globalAlpha = 1; }
      // glasses
      if (L.glasses) {
        const gc = typeof L.glasses === 'string' ? L.glasses : INK;
        g.strokeStyle = gc; g.lineWidth = lw * 0.9;
        const lens = (p: Pt, w: number) => { g.beginPath(); g.ellipse(p[0], p[1], 1.9 * w, 1.6, 0, 0, TAU); g.stroke(); };
        if (showL) lens(eyeL, ct * 0.6 + 0.4); lens(eyeR, ct * 0.5 + 0.5);
        g.beginPath(); g.moveTo(showL ? eyeL[0] + 1.9 * (ct * 0.6 + 0.4) : eyeR[0] - 3, ey - 0.3); g.lineTo(eyeR[0] - 1.9 * (ct * 0.5 + 0.5), ey - 0.3); g.stroke();
        g.beginPath(); g.moveTo(eyeL[0] - 1.9, ey - 0.4); g.lineTo(Hc[0] - hx * 0.85 + fc * 0.4, ey - 0.8); g.stroke();
      }
    }
    // hair on the head, then the ears over it where the hair is short
    hairCap();
    if (!back && ['short', 'buzz', 'balding', 'bald', 'side', 'ponytail', 'bun', 'curly'].includes(L.style) && !(L.hat && L.hat.kind === 'beanie')) {
      group(g, ears, skin, lw);
      g.save(); g.strokeStyle = INK; g.lineWidth = lw * 0.7; for (const e of ears) if (e.k === 'ell') { g.beginPath(); g.arc(e.x + (e.x < Hc[0] ? 0.2 : -0.2), e.y, 0.55, e.x < Hc[0] ? -1.1 : Math.PI - 1.1, e.x < Hc[0] ? 1.1 : Math.PI + 1.1); g.stroke(); } g.restore();
    }
    hat();
  };

  /* the hair that sits on the skull, with its hairline */
  const hairCap = () => {
    const s = L.style;
    if (s === 'bald' || s === 'hijab') { if (s === 'hijab') hijabFront(); return; }
    const fc = back ? 0 : st * hx * 0.5;
    const grow = s === 'buzz' ? 1.03 : s === 'curly' || s === 'afro' ? 1.12 : 1.08;
    if (s === 'balding') {
      // a fringe round the back of the skull, from above the ear to the nape
      const cres = (sg: number) => {
        const pts: Pt[] = [];
        for (let i = 0; i <= 10; i++) { const a = (140 + 80 * (i / 10)) * D; pts.push([Hc[0] + sg * -Math.cos(a) * -hx * 1.05, Hc[1] - Math.sin(a) * hy * 1.0]); }
        for (let i = 10; i >= 0; i--) { const a = (150 + 60 * (i / 10)) * D; pts.push([Hc[0] + sg * -Math.cos(a) * -hx * 0.74, Hc[1] - Math.sin(a) * hy * 0.72 + 0.6]); }
        return { k: 'blob' as const, pts };
      };
      const parts: Part[] = back ? [cres(1), cres(-1)] : st < 0.5 ? [cres(1), cres(-1)] : [cres(1)];
      group(g, parts, L.hair, lw);
      return;
    }
    // hairline: high over the face centre, falling toward the back and sides
    const top = s === 'side' ? -0.62 : -0.48, sideF = s === 'long' || s === 'bob' || s === 'braids' ? 0.12 : -0.05, sideB = s === 'long' || s === 'bob' ? 0.85 : 0.32;
    const pts: Pt[] = [];
    const N2 = 28;
    for (let i = 0; i <= N2; i++) {
      const a = Math.PI + (i / N2) * Math.PI; // over the top, left to right
      pts.push([Hc[0] + Math.cos(a) * hx * grow, Hc[1] + Math.sin(a) * hy * grow - (s === 'afro' ? 1.4 : 0)]);
    }
    // down the front side to the hairline, along the hairline, up the back
    const frontX = Hc[0] + hx * grow, backX = Hc[0] - hx * grow;
    const hl = (x: number) => {
      const r = x >= Hc[0] + fc ? (x - Hc[0] - fc) / Math.max(1, frontX - Hc[0] - fc) : (Hc[0] + fc - x) / Math.max(1, Hc[0] + fc - backX);
      const side = x >= Hc[0] + fc ? sideF : sideB;
      return Hc[1] + hy * (top + (side - top) * Math.pow(Math.min(1, r), 1.6));
    };
    if (back) {
      pts.push([frontX, Hc[1] + hy * 0.4], [Hc[0], Hc[1] + hy * 0.62], [backX, Hc[1] + hy * 0.4]);
    } else {
      for (let i = 0; i <= 16; i++) { const x = frontX - (i / 16) * (frontX - backX); pts.push([x, hl(x)]); }
      if (s === 'side') { pts.splice(N2 + 1, 0, [frontX - 0.5, Hc[1] - hy * 0.1]); }
    }
    const cap: Part = { k: 'path', d: (gg) => { gg.moveTo(pts[0][0], pts[0][1]); for (const p of pts) gg.lineTo(p[0], p[1]); gg.closePath(); } };
    if (s === 'curly' || s === 'afro') {
      const bumps: Part[] = [];
      for (let i = 0; i <= 9; i++) { const a = Math.PI + (i / 9) * Math.PI; bumps.push({ k: 'ell', x: Hc[0] + Math.cos(a) * hx * 1.0, y: Hc[1] + Math.sin(a) * hy * 1.0 - (s === 'afro' ? 1.4 : 0), rx: 2.2, ry: 2.2 }); }
      group(g, [cap, ...bumps], L.hair, lw);
    } else group(g, [cap], L.hair, lw);
    if (s === 'bun') group(g, [{ k: 'ell', x: Hc[0] - st * 3.2, y: Hc[1] - hy * 1.05, rx: 3.2, ry: 2.8 }], L.hair, lw);
  };
  const cloth = () => L.hijab ?? L.inner ?? C.teal;
  /** the drape over neck and shoulders, under the face */
  const hijabDrape = () => {
    const bx = back ? 0 : -st * 1.5;
    group(g, [{ k: 'blob', pts: [[Hc[0] - hx * 1.22 + bx, Hc[1] - 1], [Hc[0] + bx * 0.5, Hc[1] - hy * 1.2], [Hc[0] + hx * 1.22, Hc[1] - 1], [Hc[0] + hx * 1.35, Hc[1] + hy * 1.1], [Hc[0] + hx * 1.6, Hc[1] + hy * 2.0], [Hc[0] + st * 2, Hc[1] + hy * 2.35], [Hc[0] - hx * 1.65 + bx, Hc[1] + hy * 2.0], [Hc[0] - hx * 1.4 + bx, Hc[1] + hy * 1.0]] }], cloth(), lw);
  };
  /** the band round the face, with the face left open */
  const hijabFront = () => {
    const col = cloth();
    if (back) { group(g, [{ k: 'ell', x: Hc[0], y: Hc[1] - 0.5, rx: hx * 1.2, ry: hy * 1.16 }], col, lw); return; }
    const fc = st * hx * 0.5;
    const fx = Hc[0] + fc * 0.75 + st * 0.6, fy = Hc[1] + 1.1, frx = hx * (0.8 - 0.12 * st), fry = hy * 0.86;
    g.beginPath();
    g.ellipse(Hc[0] - st * 0.4, Hc[1] + 0.4, hx * 1.2, hy * 1.17, 0, 0, TAU);
    g.moveTo(fx + frx, fy); g.ellipse(fx, fy, frx, fry, 0, 0, TAU, false);
    g.fillStyle = col; g.fill('evenodd');
    g.lineWidth = lw; g.strokeStyle = INK; g.stroke();
    // a fold line
    g.beginPath(); g.moveTo(Hc[0] - hx * 0.9, Hc[1] - hy * 0.6); g.quadraticCurveTo(Hc[0] - hx * 1.05, Hc[1] + hy * 0.3, Hc[0] - hx * 0.7, Hc[1] + hy * 1.05); g.lineWidth = lw * 0.7; g.stroke();
  };
  const hat = () => {
    if (!L.hat) return;
    const c = L.hat.color, hk = L.hat.kind, fc = back ? 0 : st;
    if (hk === 'cap') {
      group(g, [{ k: 'blob', pts: [[Hc[0] - hx * 1.1, Hc[1] - 1.4], [Hc[0] - hx * 0.6, Hc[1] - hy * 1.02], [Hc[0] + hx * 0.4, Hc[1] - hy * 1.08], [Hc[0] + hx * 1.1, Hc[1] - 2.0]] }], c, lw);
      if (!back) group(g, [{ k: 'poly', pts: [[Hc[0] + hx * (0.2 + fc * 0.6), Hc[1] - 2.6], [Hc[0] + hx * 1.05 + 5.5 * fc, Hc[1] - 2.4 + 0.6], [Hc[0] + hx * 1.05 + 5 * fc, Hc[1] - 1.1], [Hc[0] - hx * 0.3, Hc[1] - 1.4]], r: 1 }], shade(c, -0.15), lw);
    } else if (hk === 'beanie') {
      group(g, [{ k: 'blob', pts: [[Hc[0] - hx * 1.12, Hc[1] - 0.6], [Hc[0] - hx * 0.7, Hc[1] - hy * 1.1], [Hc[0] + hx * 0.2, Hc[1] - hy * 1.25], [Hc[0] + hx * 1.08, Hc[1] - 1.6]] }, { k: 'poly', pts: [[Hc[0] - hx * 1.14, Hc[1] - 3.6], [Hc[0] + hx * 1.1, Hc[1] - 4.2], [Hc[0] + hx * 1.12, Hc[1] - 0.6], [Hc[0] - hx * 1.16, Hc[1] + 0.2]], r: 1 }], c, lw);
    } else if (hk === 'hardhat') {
      group(g, [{ k: 'blob', pts: [[Hc[0] - hx * 1.1, Hc[1] - 2], [Hc[0] - hx * 0.5, Hc[1] - hy * 1.25], [Hc[0] + hx * 0.6, Hc[1] - hy * 1.25], [Hc[0] + hx * 1.1, Hc[1] - 2]] }, { k: 'poly', pts: [[Hc[0] - hx * 1.4, Hc[1] - 2.6], [Hc[0] + hx * 1.5, Hc[1] - 2.8], [Hc[0] + hx * 1.5, Hc[1] - 1.4], [Hc[0] - hx * 1.4, Hc[1] - 1.2]], r: 0.6 }], c, lw);
    } else if (hk === 'cowboy') {
      group(g, [{ k: 'ell', x: Hc[0], y: Hc[1] - 3.2, rx: hx * 2.0, ry: 2.2 }], shade(c, -0.1), lw);
      group(g, [{ k: 'poly', pts: [[Hc[0] - hx * 0.95, Hc[1] - 3.4], [Hc[0] - hx * 0.85, Hc[1] - hy * 1.45], [Hc[0], Hc[1] - hy * 1.3], [Hc[0] + hx * 0.85, Hc[1] - hy * 1.45], [Hc[0] + hx * 0.95, Hc[1] - 3.4]], r: 1.5 }], c, lw);
    } else if (hk === 'bucket') {
      group(g, [{ k: 'poly', pts: [[Hc[0] - hx * 1.5, Hc[1] - 0.5], [Hc[0] - hx * 0.9, Hc[1] - hy * 1.15], [Hc[0] + hx * 0.9, Hc[1] - hy * 1.15], [Hc[0] + hx * 1.5, Hc[1] - 0.5]], r: 2 }], c, lw);
    } else if (hk === 'headphones') {
      g.save(); g.strokeStyle = INK; g.lineWidth = 2.2 + lw * 2; g.beginPath(); g.ellipse(Hc[0] - st * 1.5, Hc[1], hx * 1.12, hy * 1.12, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); g.strokeStyle = c; g.lineWidth = 2.2; g.stroke(); g.restore();
      group(g, [{ k: 'ell', x: Hc[0] - hx * (st > 0.5 ? 0.35 : 1.0), y: Hc[1] + 0.8, rx: 1.9, ry: 2.8 }], c, lw);
    } else if (hk === 'mortar') {
      group(g, [{ k: 'blob', pts: [[Hc[0] - hx * 1.04, Hc[1] - 1.6], [Hc[0] - hx * 0.5, Hc[1] - hy * 1.05], [Hc[0] + hx * 0.5, Hc[1] - hy * 1.05], [Hc[0] + hx * 1.04, Hc[1] - 1.8]] }], c, lw);
      group(g, [{ k: 'poly', pts: [[Hc[0], Hc[1] - hy * 1.45], [Hc[0] + hx * 1.6, Hc[1] - hy * 1.05], [Hc[0], Hc[1] - hy * 0.72], [Hc[0] - hx * 1.6, Hc[1] - hy * 1.05]] }], c, lw);
      const tc = L.hat.tassel ?? C.mustard; g.save(); g.strokeStyle = tc; g.lineWidth = lw * 1.6; g.beginPath(); g.moveTo(Hc[0], Hc[1] - hy * 1.05); g.lineTo(Hc[0] + hx * 1.3, Hc[1] - hy * 0.95); g.lineTo(Hc[0] + hx * 1.35, Hc[1] - hy * 0.3); g.stroke(); g.restore();
    } else if (hk === 'helmet') {
      group(g, [{ k: 'blob', pts: [[Hc[0] - hx * 1.18, Hc[1] + 2.5], [Hc[0] - hx * 1.15, Hc[1] - hy * 0.7], [Hc[0] - hx * 0.2, Hc[1] - hy * 1.22], [Hc[0] + hx * 0.9, Hc[1] - hy * 0.85], [Hc[0] + hx * 1.15, Hc[1] - 0.6], [Hc[0] + hx * 0.5, Hc[1] - 0.8], [Hc[0] - hx * 0.5, Hc[1] + 1], [Hc[0] - hx * 0.6, Hc[1] + 4]] }], c, lw);
      if (!back) { g.save(); g.strokeStyle = '#9aa0a6'; g.lineWidth = lw * 1.4; const fx = Hc[0] + st * hx * 0.5; g.beginPath(); g.moveTo(fx - hx * 0.55, Hc[1] + 1.2); g.lineTo(fx + hx * 0.75, Hc[1] + 1.2); g.moveTo(fx - hx * 0.45, Hc[1] + 3.4); g.lineTo(fx + hx * 0.65, Hc[1] + 3.4); g.moveTo(fx + 0.2, Hc[1] + 0.4); g.lineTo(fx + 0.2, Hc[1] + 4.6); g.stroke(); g.restore(); }
      g.save(); g.strokeStyle = '#fbfaf5'; g.lineWidth = lw * 1.6; g.beginPath(); g.moveTo(Hc[0] - hx * 0.2, Hc[1] - hy * 1.2); g.quadraticCurveTo(Hc[0] - hx * 0.9, Hc[1] - hy * 0.9, Hc[0] - hx * 1.1, Hc[1] - 1); g.stroke(); g.restore();
    } else if (hk === 'shako') {
      group(g, [{ k: 'poly', pts: [[Hc[0] - hx * 0.95, Hc[1] - 1], [Hc[0] - hx * 0.85, Hc[1] - hy * 1.9], [Hc[0] + hx * 0.85, Hc[1] - hy * 1.9], [Hc[0] + hx * 0.95, Hc[1] - 1]], r: 1 }], c, lw);
      group(g, [{ k: 'poly', pts: [[Hc[0] - hx * 1.0, Hc[1] - 2.2], [Hc[0] + hx * 1.0, Hc[1] - 2.2], [Hc[0] + hx * 1.0, Hc[1] - 0.6], [Hc[0] - hx * 1.0, Hc[1] - 0.6]], r: 0.4 }], '#2b2b30', lw);
      group(g, [{ k: 'ell', x: Hc[0], y: Hc[1] - hy * 2.25, rx: 1.6, ry: 3.4 }], L.hat.tassel ?? '#fbfaf5', lw);
    } else if (hk === 'band') {
      group(g, [{ k: 'poly', pts: [[Hc[0] - hx * 1.06, Hc[1] - 2.4], [Hc[0] + hx * 1.06, Hc[1] - 3.2], [Hc[0] + hx * 1.06, Hc[1] - 1.4], [Hc[0] - hx * 1.06, Hc[1] - 0.6]], r: 0.5 }], c, lw);
    }
  };

  /* torso polygon */
  const torsoPts = (bottomY: number, flare = 0): Pt[] => {
    const cx = st * 1.4, Wd: Pt = mid(P, N, 0.45);
    return [
      [N[0] - TWs + cx * 0.4, N[1] + 4.2], [N[0] - TWs * 0.4, N[1] - 0.2], [N[0] + TWs * 0.4 + cx, N[1] - 0.2], [N[0] + TWs + cx, N[1] + 4.4],
      [Wd[0] + TWw + cx * (fem ? 1.6 : 0.8), Wd[1]], [P[0] + TWh + flare, P[1] + bottomY], [P[0] - TWh - flare, P[1] + bottomY], [Wd[0] - TWw, Wd[1]],
    ];
  };

  /* ── draw, back to front ── */
  const tk = L.topKind ?? 'tee';
  // things on the back
  if (L.bag?.kind === 'backpack' && !back) group(g, [{ k: 'poly', pts: [[N[0] - TWs - 6 * st - 1, N[1] + 3], [N[0] - TWs + 2, N[1] + 2], [P[0] - TWh + 2, P[1] - 4], [P[0] - TWh - 6 * st - 1, P[1] - 3]], r: 3 }], L.bag.color, lw);
  if (!back) hairBack();
  if (back) { leg(hipF, kF, aF); leg(hipN, kN, aN); }
  arm(sF, eF, hF);
  if (!back) leg(hipF, kF, aF);
  // pelvis, skirt
  const pcx = st * 1.0, pelvis: Part = { k: 'poly', pts: [[-TWh + 0.6 + pcx, -6], [TWh - 0.2 + pcx, -6], [TWh + 0.2 + pcx, 3], [hipF[0] + 1, 6], [hipN[0] - 1, 6], [-TWh + 0.4 + pcx, 3]], r: 2 };
  const skirtish = bk === 'skirt' || bk === 'longskirt' || tk === 'dress';
  if (!skirtish) group(g, [pelvis], bk === 'shorts' ? bottom : bottom, lw);
  if (!back) leg(hipN, kN, aN);
  if (!skirtish && !back) group(g, [{ k: 'poly', pts: [[-TWh + 0.6 + pcx, -6], [TWh - 0.2 + pcx, -6], [TWh - 0.2 + pcx, 0], [-TWh + 0.6 + pcx, 0]] }], bottom, 0);
  if (skirtish) {
    const len = bk === 'longskirt' ? 0.92 : tk === 'dress' && bk !== 'skirt' ? 0.55 : 0.5;
    const col = tk === 'dress' ? top : bottom;
    if (P0.sit) {
      group(g, [pelvis, { k: 'limb', pts: [[0, 0], kN], w: tw + 4 }, { k: 'limb', pts: [[0, 0], kF], w: tw + 4 }, ...(len > 0.6 ? [{ k: 'limb' as const, pts: [kN, mid(kN, aN, len)], w: shw + 5 }] : [])], col, lw);
    } else {
      const lo = Math.max(kN[1], kF[1]) * (len / 0.5) * 0.98, sp = Math.min(3.5, (Math.abs(kN[0] - kF[0]) + Math.abs(aN[0] - aF[0])) * 0.12);
      const cxk = (kN[0] + kF[0]) / 2;
      group(g, [{ k: 'poly', pts: [[-TWh + 0.5, -6], [TWh - 0.5, -6], [TWh + 1.5, 2], [cxk + TWh + 2 + sp + len * 2, lo], [cxk - TWh - 2 - sp - len * 2, lo], [-TWh - 1.5, 2]], r: 2.5 }], col, lw);
    }
  }
  if (tk === 'coat') {
    const lo = P0.sit ? 6 : Math.max(kN[1], kF[1]) * 0.9;
    group(g, [{ k: 'poly', pts: [[-TWh - 1, -8], [TWh + 1, -8], [TWh + 3, lo], [-TWh - 3, lo]], r: 2 }], top, lw);
  }
  // neck
  group(g, [{ k: 'limb', pts: [add(N, [st * 0.6, 3]), add(H, [0, 1])], w: 4.6 * (fem ? 0.9 : 1) * bw }], skin, lw);
  if (back) hairBack();
  // torso
  const tb = tk === 'shirt' || tk === 'blouse' ? 1 : tk === 'jacket' || tk === 'hoodie' ? 3 : tk === 'coat' ? 4 : 0.5;
  group(g, [{ k: 'poly', pts: torsoPts(tb), r: 4.2 }], top, lw);
  if (L.stripes || L.number) {
    g.save(); rounded(g, torsoPts(tb), 4.2); g.clip();
    if (L.stripes) { g.fillStyle = L.stripes; for (let x = -16; x < 18; x += 4) g.fillRect(x + st * 1.4, N[1] - 4, 2, P[1] - N[1] + 10); }
    if (L.number && !back) { g.fillStyle = '#fbfaf5'; g.strokeStyle = INK; g.lineWidth = lw * 0.6; g.font = `bold 10px ${'Arial'}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const nx = (N[0] + P[0]) / 2 + st * 2, ny = (N[1] + P[1]) / 2 - 2; g.strokeText(L.number, nx, ny); g.fillText(L.number, nx, ny); }
    if (L.number && back) { g.fillStyle = '#fbfaf5'; g.font = `bold 12px ${'Arial'}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(L.number, (N[0] + P[0]) / 2, (N[1] + P[1]) / 2 - 2); }
    g.restore();
    g.save(); rounded(g, torsoPts(tb), 4.2); g.lineWidth = lw; g.strokeStyle = INK; g.stroke(); g.restore();
  }
  if (back && L.bag?.kind === 'backpack') group(g, [{ k: 'poly', pts: [[N[0] - TWs * 0.7, N[1] + 4], [N[0] + TWs * 0.7, N[1] + 4], [P[0] + TWh * 0.75, P[1] - 5], [P[0] - TWh * 0.75, P[1] - 5]], r: 3 }], L.bag.color, lw);
  // torso details
  if (!back) {
    g.save(); g.strokeStyle = INK; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
    const nc: Pt = add(N, [st * 1.6, -0.4]);
    if (tk === 'scrubs' || tk === 'blouse') { g.beginPath(); g.moveTo(nc[0] - 2.6, nc[1]); g.lineTo(nc[0] + 0.2, nc[1] + 5); g.lineTo(nc[0] + 2.8, nc[1]); g.closePath(); g.fillStyle = skin; g.fill(); g.stroke(); }
    if (tk === 'shirt') { g.fillStyle = L.accent ?? shade(top, 0.35); for (const sgn of [-1, 1]) { g.beginPath(); g.moveTo(nc[0], nc[1] + 2.6); g.lineTo(nc[0] + sgn * 3.4, nc[1] - 0.4); g.lineTo(nc[0] + sgn * 1.2, nc[1] - 1.0); g.closePath(); g.fill(); g.stroke(); } g.beginPath(); g.moveTo(nc[0] + 0.2, nc[1] + 2.6); g.lineTo(P[0] + st * 1.6, P[1] - 1); g.stroke(); }
    if (tk === 'jacket' || tk === 'coat' || tk === 'vest') {
      const inner = L.inner ?? C.white;
      g.beginPath(); g.moveTo(nc[0] - 2.8, nc[1] - 0.2); g.lineTo(nc[0] + 3.2, nc[1] - 0.2); g.lineTo(P[0] + st * 2 + 1.6, P[1] + tb - 0.4); g.lineTo(P[0] + st * 2 - 1.8, P[1] + tb - 0.4); g.closePath(); g.fillStyle = inner; g.fill(); g.stroke();
      g.beginPath(); g.moveTo(nc[0] - 3.2, nc[1] - 0.4); g.lineTo(nc[0] - 1, nc[1] + 6); g.moveTo(nc[0] + 3.4, nc[1] - 0.4); g.lineTo(nc[0] + 1.6, nc[1] + 6); g.stroke();
    }
    if (tk === 'hoodie') { g.beginPath(); g.moveTo(nc[0] - 3.6, nc[1] + 0.4); g.quadraticCurveTo(nc[0], nc[1] + 4.2, nc[0] + 3.8, nc[1] + 0.4); g.stroke(); ln(g, nc[0] - 1, nc[1] + 2.6, nc[0] - 1.2, nc[1] + 7, lw * 0.8); ln(g, nc[0] + 1.4, nc[1] + 2.6, nc[0] + 1.6, nc[1] + 7, lw * 0.8); g.beginPath(); g.moveTo(P[0] - TWh * 0.6 + st, P[1] - 7); g.lineTo(P[0] + TWh * 0.6 + st, P[1] - 7); g.stroke(); }
    if (tk === 'tee' || tk === 'sweater' || tk === 'dress' || tk === 'tank') { g.beginPath(); g.moveTo(nc[0] - 2.8, nc[1] - 0.2); g.quadraticCurveTo(nc[0] + 0.2, nc[1] + 2.6, nc[0] + 3.0, nc[1] - 0.2); g.stroke(); }
    if (tk === 'sweater') { g.beginPath(); g.moveTo(P[0] - TWh, P[1] - 1.4); g.lineTo(P[0] + TWh, P[1] - 1.4); g.stroke(); }
    if (L.scarf) { group(g, [{ k: 'limb', pts: [add(nc, [-3.6, 0.4]), add(nc, [0.2, 2]), add(nc, [3.8, 0.2])], w: 3 }, { k: 'limb', pts: [add(nc, [2, 1.6]), add(nc, [2.6, 10])], w: 2.6 }], L.scarf, lw); }
    if (L.apron) { g.restore(); group(g, [{ k: 'poly', pts: [[N[0] - TWs * 0.55 + st, N[1] + 4], [N[0] + TWs * 0.55 + st * 2, N[1] + 4], [TWh * 0.85 + st * 2 + 1, P0.sit ? 4 : Math.max(kN[1], kF[1]) * 0.75], [-TWh * 0.85 + st * 2, P0.sit ? 4 : Math.max(kN[1], kF[1]) * 0.75]], r: 1.5 }], L.apron, lw); g.save(); g.strokeStyle = INK; g.lineWidth = lw; }
    if (L.lanyard) { g.beginPath(); g.moveTo(nc[0] - 2.4, nc[1]); g.lineTo(nc[0] + 0.6, nc[1] + 11); g.lineTo(nc[0] + 3, nc[1]); g.strokeStyle = L.lanyard; g.lineWidth = lw * 1.4; g.stroke(); g.strokeStyle = INK; g.lineWidth = lw; g.beginPath(); g.rect(nc[0] - 1.2, nc[1] + 11, 3.6, 4.4); g.fillStyle = C.white; g.fill(); g.stroke(); }
    if (L.bag?.kind === 'backpack' || L.bag?.kind === 'messenger') { g.beginPath(); g.moveTo(sN[0] + 1.5, sN[1] - 2.6); g.quadraticCurveTo(sN[0] + 3, sN[1] + 8, sN[0] + 1.6, P[1] - 7); g.strokeStyle = INK; g.lineWidth = 1.8 + lw * 2; g.stroke(); g.strokeStyle = L.bag.color; g.lineWidth = 1.8; g.stroke(); }
    g.restore();
  }
  const J: Joints = { P: u(0, 0), N: u(N[0], N[1]), H: u(Hc[0], Hc[1]), sN: u(sN[0], sN[1]), sF: u(sF[0], sF[1]), eN: u(eN[0], eN[1]), eF: u(eF[0], eF[1]), hN: u(hN[0], hN[1]), hF: u(hF[0], hF[1]), kN: u(kN[0], kN[1]), kF: u(kF[0], kF[1]), aN: u(aN[0], aN[1]), aF: u(aF[0], aF[1]), s: f.s, fwd, u };
  // head, then the near arm in front of it all
  if (!back) {
    if (L.bag?.kind === 'tote') { /* drawn by the hold hook if wanted */ }
    head();
    if (f.hold) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); f.hold(g, J); g.restore(); }
    arm(sN, eN, hN);
  } else {
    arm(sN, eN, hN);
    head();
    if (f.hold) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); f.hold(g, J); g.restore(); }
  }
  if (f.over) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); f.over(g, J); g.restore(); }
  g.restore();
  return J;
}

/** A small flat shadow under a standing figure. */
export function footShadow(g: G, x: number, y: number, s: number, col = 'rgba(31,26,23,0.18)') { ellipse(g, x, y, 13 * s, 3.2 * s, 0, col, 0); }
