import type { Joints } from './mascot';

/**
 * Every pose is a function of time, so every pose is also an animation: a
 * wave waves, a laugh shakes, a run runs. `t` is seconds; each mascot gets
 * its own phase so the two are never in step.
 */

export type Pose =
  | 'idle' | 'hold' | 'hold2' | 'point' | 'hips' | 'wave' | 'cheer' | 'namaste' | 'think' | 'facepalm'
  | 'shrug' | 'flex' | 'cross' | 'thumbs' | 'salute' | 'selfie' | 'swing' | 'throw' | 'run' | 'dance'
  | 'tug' | 'sit' | 'meditate' | 'tree' | 'bow' | 'clap' | 'sweep' | 'drum' | 'ride' | 'shiver'
  | 'talk' | 'laugh' | 'sleep' | 'hug' | 'stomp' | 'kite' | 'mic' | 'scroll' | 'wrestle' | 'plank'
  | 'crouch' | 'kick' | 'stir' | 'carry' | 'plant' | 'rest' | 'guard' | 'march' | 'jump' | 'splat';

const S = Math.sin;
const base = (): Joints => ({
  la: [0.08, 0.16, 0.25, 0], ra: [0.08, 0.16, 0.25, 0], ll: [0, 0.04, 0], rl: [0, 0.04, 0],
  lean: 0, turn: 0, sway: 0, nod: 0, tilt: 0, yaw: 0, y: 0, pitch: 0,
});
const bob = (j: Joints, t: number, k = 1) => { j.y += Math.abs(S(t * 2.2)) * 0.03 * k; j.sway += S(t * 1.1) * 0.03 * k; return j; };

const HIPS = [-0.25, 0.62, 1.7, 1.45];
const SEAT = { ll: [1.5, 0.12, 1.5], rl: [1.5, 0.12, 1.5], y: -0.24 };

export const POSES: Record<Pose, (t: number) => Joints> = {
  idle: (t) => bob(base(), t),
  hold: (t) => bob({ ...base(), ra: [0.75, 0.2, 0.95 + S(t * 2) * 0.08, 0.25] }, t),
  hold2: (t) => bob({ ...base(), la: [0.8, 0.02, 0.8, 0], ra: [0.8, 0.02, 0.8 + S(t * 2) * 0.05, 0] }, t),
  point: (t) => bob({ ...base(), ra: [1.45 + S(t * 7) * 0.08, 0.12, 0.05, 0], la: HIPS, lean: 0.08 }, t),
  hips: (t) => bob({ ...base(), la: HIPS, ra: HIPS, lean: -0.06, nod: -0.1 }, t),
  wave: (t) => bob({ ...base(), ra: [0.25, 2.55 + S(t * 9) * 0.28, 0.35, 0], la: [0.1, 0.18, 0.3, 0], tilt: 0.1 }, t),
  cheer: (t) => { const j = base(); j.la = [0.2, 2.75 + S(t * 8) * 0.2, 0.2, 0]; j.ra = [0.2, 2.75 + S(t * 8 + 1.6) * 0.2, 0.2, 0]; j.y = Math.abs(S(t * 4)) * 0.14; j.nod = -0.2; return j; },
  namaste: (t) => bob({ ...base(), la: [0.62, -0.42, 1.75, 0], ra: [0.62, -0.42, 1.75, 0], nod: 0.12 + S(t * 1.4) * 0.04 }, t),
  think: (t) => bob({ ...base(), ra: [0.45, -0.12, 2.35, 0], la: [0.55, -0.35, 1.5, 0], tilt: 0.14, yaw: S(t * 0.7) * 0.1, nod: -0.08 }, t, 0.5),
  facepalm: (t) => bob({ ...base(), ra: [0.95, -0.3, 2.3, 0], la: [0.1, 0.16, 0.3, 0], nod: 0.32 + S(t * 3) * 0.04, lean: 0.1 }, t, 0.5),
  shrug: (t) => { const k = (S(t * 2.4) + 1) / 2; return bob({ ...base(), la: [0.3, 0.55 + k * 0.2, 1.5, 1.2], ra: [0.3, 0.55 + k * 0.2, 1.5, 1.2], tilt: 0.18, y: k * 0.05 }, t); },
  flex: (t) => { const k = S(t * 3) * 0.12; return bob({ ...base(), la: [0, 1.45, 1.9 + k, 1.57], ra: [0, 1.45, 1.9 - k, 1.57], lean: -0.05, nod: -0.12 }, t); },
  cross: (t) => bob({ ...base(), la: [0.62, -0.18, 1.95, 0], ra: [0.72, -0.18, 1.85, 0], lean: -0.08, nod: -0.12, yaw: S(t * 0.6) * 0.12 }, t, 0.5),
  thumbs: (t) => bob({ ...base(), ra: [0.5, 0.3, 1.5 + S(t * 4) * 0.1, 1.0], la: HIPS }, t),
  salute: (t) => bob({ ...base(), ra: [0.85, 1.25, 2.35, 0.6], nod: -0.05 + S(t) * 0.01 }, t, 0.3),
  selfie: (t) => bob({ ...base(), ra: [2.2, 0.35, 0.15, 0], la: [0.1, 0.35, 0.8, 0], nod: -0.28, tilt: 0.14, yaw: 0.2 }, t),
  swing: (t) => { const k = S(t * 3.2); const j = base(); j.la = [1.1, -0.35, 0.5, 0]; j.ra = [1.1, -0.1, 0.5, 0]; j.turn = k * 0.9; j.ll = [0.25, 0.15, 0.2]; j.rl = [-0.2, 0.15, 0.1]; j.lean = 0.12; return j; },
  throw: (t) => {
    // wind up, then let go: the release is at the top of each two-second cycle
    const c = (t % 2) / 2;
    const f = c < 0.6 ? -0.8 + (c / 0.6) * -0.4 : c < 0.72 ? -1.2 + ((c - 0.6) / 0.12) * 4 : 2.8 - (c - 0.72) * 3;
    return { ...base(), ra: [f, 0.35, 0.3, 0], la: [1.1, 0.2, 0.3, 0], turn: c < 0.6 ? -0.4 : 0.35, lean: c < 0.6 ? -0.1 : 0.15, ll: [0.35, 0.1, 0.1], rl: [-0.25, 0.1, 0.15] };
  },
  run: (t) => { const k = S(t * 10); return { ...base(), la: [-k * 0.9, 0.1, 1.3, 0], ra: [k * 0.9, 0.1, 1.3, 0], ll: [k * 0.8, 0.02, Math.max(0, -k) * 1.1 + 0.2], rl: [-k * 0.8, 0.02, Math.max(0, k) * 1.1 + 0.2], lean: 0.22, y: Math.abs(S(t * 10)) * 0.08 }; },
  march: (t) => { const k = S(t * 6); return { ...base(), la: [-k * 0.6, 0.1, 0.3, 0], ra: [k * 0.6, 0.1, 0.3, 0], ll: [Math.max(0, k) * 0.9, 0.02, Math.max(0, k) * 1.0], rl: [Math.max(0, -k) * 0.9, 0.02, Math.max(0, -k) * 1.0], y: Math.abs(k) * 0.04, nod: -0.08 }; },
  dance: (t) => { const k = S(t * 5); return { ...base(), la: [0.3, 2.2 + k * 0.4, 0.8, 0], ra: [0.3, 2.2 - k * 0.4, 0.8, 0], sway: k * 0.18, turn: k * 0.3, ll: [0.1, 0.1 + Math.max(0, k) * 0.4, 0.5], rl: [0.1, 0.1 + Math.max(0, -k) * 0.4, 0.5], y: Math.abs(S(t * 10)) * 0.07, tilt: -k * 0.15 }; },
  tug: (t) => { const k = S(t * 2.6) * 0.08; return { ...base(), la: [1.35, 0.05, 0.25, 0], ra: [1.3, -0.05, 0.3, 0], lean: -0.45 + k, ll: [0.5, 0.05, 0.3], rl: [-0.2, 0.05, 0.4], y: -0.08, nod: 0.25 }; },
  sit: (t) => bob({ ...base(), ...SEAT, la: [0.7, 0.1, 0.5, 0], ra: [0.7, 0.1, 0.5, 0] }, t, 0.4),
  rest: (t) => bob({ ...base(), ...SEAT, la: [0.75, 0.1, 1.4, 0], ra: [0.75, 0.25, 1.1, 0.3] }, t, 0.4),
  meditate: (t) => ({ ...base(), ll: [1.45, 0.85, 2.35], rl: [1.45, 0.85, 2.35], y: -0.42 + S(t * 1.2) * 0.012, la: [0.35, 0.42, 0.9, 1.1], ra: [0.35, 0.42, 0.9, 1.1], nod: 0.06 }),
  tree: (t) => ({ ...base(), rl: [0.25, 1.15, 2.4], la: [3.02, -0.14, 0, 0], ra: [3.02, -0.14, 0, 0], sway: S(t * 1.3) * 0.04 }),
  bow: (t) => ({ ...base(), la: [0.62, -0.42, 1.75, 0], ra: [0.62, -0.42, 1.75, 0], lean: 0.45 + S(t * 2) * 0.12, nod: 0.2 }),
  clap: (t) => { const k = (S(t * 12) + 1) / 2; return bob({ ...base(), la: [1.0, -0.1 - k * 0.3, 0.7, 0], ra: [1.0, -0.1 - k * 0.3, 0.7, 0], nod: -0.1 }, t); },
  sweep: (t) => { const k = S(t * 4); return { ...base(), la: [0.9, -0.2, 0.3, 0], ra: [0.55, -0.1, 0.4, 0], turn: k * 0.35, lean: 0.2, ll: [0.15, 0.1, 0.2], rl: [-0.1, 0.1, 0.2], nod: 0.2 }; },
  drum: (t) => { const k = S(t * 12); return bob({ ...base(), la: [0.9 + k * 0.25, 0.25, 1.0, 0], ra: [0.9 - k * 0.25, 0.25, 1.0, 0], nod: 0.12 }, t, 2); },
  ride: (t) => ({ ...base(), ...SEAT, y: -0.22 + Math.abs(S(t * 9)) * 0.02, la: [1.0, 0.1, 0.4, 0], ra: [1.0, 0.1, 0.4, 0], lean: 0.1, sway: S(t * 2) * 0.05 }),
  shiver: (t) => { const k = S(t * 60) * 0.03; return { ...base(), la: [0.62, -0.18, 1.95, 0], ra: [0.72, -0.18, 1.85, 0], sway: k, turn: k, nod: 0.1, ll: [0, -0.05, 0.1], rl: [0, -0.05, 0.1] }; },
  talk: (t) => bob({ ...base(), ra: [0.7 + S(t * 3) * 0.3, 0.35, 1.1 + S(t * 3) * 0.3, 0.8], la: [0.5, 0.3, 1.2, 0.8], nod: S(t * 5) * 0.06, yaw: S(t * 1.3) * 0.15 }, t),
  laugh: (t) => { const k = S(t * 18) * 0.04; return { ...base(), la: [0.5, 0.1, 1.55, 0], ra: [0.5, 0.1, 1.55, 0], lean: -0.22 + k, nod: -0.25 + k, y: Math.abs(S(t * 9)) * 0.04 }; },
  sleep: (t) => ({ ...base(), ...SEAT, la: [0.5, 0.1, 1.2, 0], ra: [0.5, 0.1, 1.2, 0], nod: 0.35, tilt: 0.3 + S(t * 0.8) * 0.05, lean: 0.1 + S(t * 0.8) * 0.03 }),
  hug: (t) => bob({ ...base(), la: [1.25, 0.8 + S(t * 3) * 0.1, 0.5, 0], ra: [1.25, 0.8 + S(t * 3) * 0.1, 0.5, 0], lean: 0.1, nod: -0.1 }, t),
  stomp: (t) => { const k = S(t * 8); return { ...base(), la: [0.1, 0.4, 0.4, 0], ra: [0.1, 0.4, 0.4, 0], ll: [Math.max(0, k) * 0.8, 0.05, Math.max(0, k) * 1.2], y: Math.max(0, k) * 0.06, nod: 0.15 }; },
  kite: (t) => bob({ ...base(), ra: [2.0 + S(t * 3) * 0.15, 0.3, 0.3, 0], la: [0.8, 0.1, 0.9, 0], nod: -0.4, lean: -0.1 }, t),
  mic: (t) => bob({ ...base(), ra: [0.8, 0.05, 1.95, 0.2], la: [0.3 + S(t * 3) * 0.2, 0.6, 0.9, 0.8], nod: S(t * 5) * 0.05 }, t),
  scroll: (t) => bob({ ...base(), la: [0.95, 0.35, 0.55, 0], ra: [0.95, 0.35, 0.55, 0], nod: 0.18 + S(t * 4) * 0.03 }, t),
  wrestle: (t) => { const k = S(t * 5) * 0.1; return { ...base(), ra: [1.3 + k, -0.15, 0.9, 0], la: [0.6, 0.3, 1.0, 0], lean: 0.35, y: -0.12, ll: [0.4, 0.15, 0.5], rl: [0.2, 0.15, 0.4], nod: -0.25 }; },
  plank: (t) => ({ ...base(), pitch: 1.2, y: 0.28 + Math.abs(S(t * 3)) * 0.1, la: [1.2, 0.25, 0, 0], ra: [1.2, 0.25, 0, 0], nod: -0.9 }),
  crouch: (t) => { const k = S(t * 4) * 0.2; return { ...base(), la: [0.9, 0.7 + k, 0.4, 0], ra: [0.9, 0.7 - k, 0.4, 0], ll: [0.9, 0.25, 1.2], rl: [0.9, 0.25, 1.2], y: -0.18, lean: 0.35, nod: -0.3 }; },
  kick: (t) => { const c = (t % 1.6) / 1.6; const k = c < 0.35 ? -0.6 : c < 0.5 ? 1.4 : 0.3; return { ...base(), rl: [k, 0.05, k < 0 ? 0.9 : 0.1], la: [0.6, 0.6, 0.3, 0], ra: [-0.4, 0.5, 0.3, 0], lean: -0.1 }; },
  stir: (t) => bob({ ...base(), ra: [0.8 + S(t * 5) * 0.12, 0.2 + S(t * 5 + 1.6) * 0.15, 0.8, 0], la: HIPS, nod: 0.25 }, t),
  carry: (t) => bob({ ...base(), la: [0.3, 2.5, 1.3, 0], ra: [0.3, 2.5, 1.3, 0], nod: 0.05 }, t, 1.5),
  plant: (t) => ({ ...base(), lean: 0.55 + S(t * 2) * 0.05, la: [1.0, 0.15, 0.3, 0], ra: [1.0, 0.15, 0.3, 0], ll: [0.35, 0.1, 0.6], rl: [0.35, 0.1, 0.6], y: -0.06, nod: 0.3 }),
  guard: (t) => { const k = S(t * 6) * 0.06; return { ...base(), la: [1.2, 0.4, 1.3, 0], ra: [1.0, 0.4, 1.5, 0], ll: [0.25, 0.2, 0.3], rl: [-0.2, 0.2, 0.3], y: -0.05 + k * 0.3, sway: k, nod: 0.12 }; },
  jump: (t) => { const k = Math.abs(S(t * 4)); return { ...base(), la: [0.3, 2.4, 0.3, 0], ra: [0.3, 2.4, 0.3, 0], y: k * 0.45, ll: [0.3 * k, 0.1, 0.6 * k], rl: [0.3 * k, 0.1, 0.6 * k] }; },
  splat: (t) => ({ ...base(), la: [0.2, 1.3, 0.2, 0], ra: [0.2, 1.3, 0.2, 0], ll: [0.1, 0.35, 0], rl: [0.1, 0.35, 0], sway: S(t * 20) * 0.05, nod: -0.1 }),
};
