import { LOOK_INDEX, LOOKS, lookOf, type Doodle } from './looks';
import type { FrameParams } from './renderer';

export interface Segment { t0: number; t1: number; look: string; frame: 'crop' | 'fit'; shake?: boolean; letterbox?: boolean; tint?: string; doodle?: Doodle; bursts?: boolean }
export interface AuraEvent { id: string; t: number; dur: number; kind: 'freeze' | 'text'; text: string; style?: 'impact' | 'aura' | 'caption'; y?: number; size?: number; glow?: string }
export interface Plan { segments: Segment[]; events: AuraEvent[]; meter: boolean; punch: number; downbeatPunch: number; flashCuts: boolean; shake: boolean }

export interface Masks { w: number; h: number; times: number[]; data: Uint8Array[] } // rows bottom-up
export interface Analysis {
  duration: number; width: number; height: number;
  bpm: number; beats: number[]; downbeats: number[]; onsets: number[];
  shots: number[];
  masks: Masks | null;
  track: { times: number[]; x: number[]; y: number[] };
}

let uid = 0;
export function hexToRgb(h: string): [number, number, number] { const n = parseInt(h.replace('#', '').padEnd(6, '0').slice(0, 6), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
export const doodleOf = (s: Segment): Doodle => s.doodle ?? lookOf(s.look).doodle ?? 'off';
export const burstsOf = (s: Segment) => s.bursts ?? !!lookOf(s.look).bursts;
export const newId = () => `e${Date.now().toString(36)}${(uid++).toString(36)}`;

const ROTATION = ['film', 'teal_orange', 'comic_book', 'cyberpunk', 'neon_doodle', 'noir_red', 'glitch', 'halftone', 'golden_aura', 'single_tone', 'neon_aura', 'doodle', 'purple_haze', 'thermal_rainbow', 'green_rays', 'scribble', 'storm', 'embers', 'halftone_mono', 'noir', 'night_vision', 'oil', 'chalk', 'dream', 'vhs', 'infrared', 'thermal', 'kaleido', 'matrix', 'sketch'];
const PHRASES = ['UNBOTHERED', 'MAIN CHARACTER', 'SILENT. DANGEROUS.', 'NO WORDS NEEDED', 'BUILT DIFFERENT', 'FINAL BOSS', 'AURA'];

// A first edit for any clip: a look per shot (long shots change on downbeats),
// a freeze-frame cut-out in the longest shot, captions every few bars.
export function autoPlan(a: Analysis, seed = 0): Plan {
  const cuts = [...a.shots, a.duration];
  const segs: Segment[] = [];
  let k = seed;
  for (let i = 0; i < cuts.length - 1; i++) {
    const t0 = cuts[i], t1 = cuts[i + 1];
    const inner = a.downbeats.filter((d) => d > t0 + 2.2 && d < t1 - 2.2);
    const pts = [t0, ...inner.filter((_, j) => j % 2 === 1), t1];
    for (let j = 0; j < pts.length - 1; j++) segs.push({ t0: pts[j], t1: pts[j + 1], look: ROTATION[k++ % ROTATION.length], frame: 'crop' });
  }
  const events: AuraEvent[] = [];
  if (a.duration > 4) {
    events.push({ id: newId(), t: 0.05, dur: Math.min(1.4, a.duration / 4), kind: 'text', text: 'AURA\nFARMING', style: 'impact', y: 0.5, size: 230 });
    const beat = a.bpm ? 60 / a.bpm : 0.65;
    // freeze where the person is clearly found: a solid mask over a sensible share of the frame
    const clarity = (t: number) => {
      const m = maskAt(a.masks, t);
      if (!m) return 0;
      let on = 0, mid = 0;
      for (let i = 0; i < m.length; i += 7) { if (m[i] > 170) on++; else if (m[i] > 60) mid++; }
      const n = m.length / 7, cov = on / n;
      return cov < 0.06 || cov > 0.55 ? 0 : cov * (1 - mid / (on + mid + 1)) * (1 - Math.abs(t / a.duration - 0.45));
    };
    const cands = a.downbeats.filter((d) => d > 2 && d < a.duration - 4).map((d) => [d, clarity(d)] as const).filter(([, c]) => c > 0).sort((x, y) => y[1] - x[1]);
    let snap = cands.length ? cands[0][0] : -1;
    if (snap < 0 && !a.masks) {
      const longest = segs.reduce((m, s) => (s.t1 - s.t0 > m.t1 - m.t0 ? s : m), segs[0]);
      const mid = (longest.t0 + longest.t1) / 2;
      snap = a.downbeats.reduce((b, d) => (Math.abs(d - mid) < Math.abs(b - mid) ? d : b), mid);
    }
    if (snap >= 0) events.push({ id: newId(), t: snap, dur: beat * 2, kind: 'freeze', text: '+1000 AURA' });
    if (cands.length > 3 && a.duration > 40) { const far = cands.find(([d]) => Math.abs(d - snap) > a.duration * 0.3); if (far) events.push({ id: newId(), t: far[0], dur: beat * 2, kind: 'freeze', text: '+9999 AURA' }); }
    a.downbeats.filter((_, j) => j % 4 === 3).forEach((d, j) => {
      if (events.some((e) => e.kind === 'freeze' && Math.abs(d - e.t) < 2) || d > a.duration - 4) return;
      events.push({ id: newId(), t: d, dur: 1.3, kind: 'text', text: j % 3 === 2 ? `+${(j + 1) * 500} AURA` : PHRASES[j % PHRASES.length], style: j % 3 === 2 ? 'aura' : 'impact', y: j % 3 === 2 ? 0.62 : 0.74 });
    });
    events.push({ id: newId(), t: Math.max(0, a.duration - 3.2), dur: 3.2, kind: 'text', text: 'AURA: MAX', style: 'impact', y: 0.72, size: 210, glow: '#78ff50' });
  }
  return { segments: segs, events, meter: true, punch: 0.04, downbeatPunch: 0.1, flashCuts: true, shake: true };
}

export function shuffleLooks(p: Plan): Plan {
  const pool = LOOKS.filter((l) => l.id !== 'clean').map((l) => l.id);
  let last = '';
  return { ...p, segments: p.segments.map((s) => { let l; do { l = pool[Math.floor(Math.random() * pool.length)]; } while (l === last); last = l; return { ...s, look: l }; }) };
}

export function segmentAt(p: Plan, t: number) {
  const i = p.segments.findIndex((s) => t >= s.t0 && t < s.t1);
  return i < 0 ? p.segments.length - 1 : i;
}

function interp(times: number[], vals: number[], t: number) {
  if (!times.length) return 0.5;
  let k = 0;
  while (k < times.length - 1 && times[k + 1] <= t) k++;
  if (k >= times.length - 1) return vals[vals.length - 1];
  const w = Math.max(0, Math.min(1, (t - times[k]) / (times[k + 1] - times[k] || 1)));
  return vals[k] * (1 - w) + vals[k + 1] * w;
}

// mask for time t, blended between the two nearest samples
let scratch: Uint8Array | null = null;
export function maskAt(m: Masks | null, t: number): Uint8Array | null {
  if (!m || !m.times.length) return null;
  let k = 0;
  while (k < m.times.length - 1 && m.times[k + 1] <= t) k++;
  if (k >= m.times.length - 1) return m.data[m.data.length - 1];
  const a = m.data[k], b = m.data[k + 1];
  const w = Math.max(0, Math.min(1, (t - m.times[k]) / (m.times[k + 1] - m.times[k] || 1)));
  if (!scratch || scratch.length !== a.length) scratch = new Uint8Array(a.length);
  const iw = Math.round(w * 256);
  for (let i = 0; i < a.length; i++) scratch[i] = (a[i] * (256 - iw) + b[i] * iw) >> 8;
  return scratch;
}

export interface FrameState { params: Omit<FrameParams, 'source'>; seg: Segment; segIndex: number; pulse: number; beatIndex: number; freeze: AuraEvent | null; freezeT: number }

// everything about the frame at time t that is not pixels
export function frameState(plan: Plan, a: Analysis, t: number, frameNo: number, wasFreeze: AuraEvent | null): FrameState {
  const si = segmentAt(plan, t);
  const seg = plan.segments[si];
  const lt = t - seg.t0, dur = Math.max(0.05, seg.t1 - seg.t0);
  let bi = -1;
  for (let i = 0; i < a.beats.length && a.beats[i] <= t; i++) bi = i;
  const since = bi >= 0 ? t - a.beats[bi] : 9;
  const pulse = bi >= 0 ? Math.exp(-since * 7) : 0;
  const isDown = bi >= 0 && a.downbeats.includes(a.beats[bi]);
  const freeze = plan.events.find((e) => e.kind === 'freeze' && t >= e.t && t < e.t + e.dur) ?? null;
  const look = lookOf(seg.look);
  const amp = isDown ? plan.downbeatPunch : plan.punch;
  const zoom = 1 + amp * pulse + 0.06 * (lt / dur);
  let shift: [number, number] = [0, 0];
  const on = a.onsets.filter((o) => t - o >= 0 && t - o < 0.18);
  if (plan.shake && seg.shake !== false && on.length) {
    const k = Math.exp(-(t - on[on.length - 1]) * 18);
    const r1 = Math.sin(on[on.length - 1] * 9137.1) * 43758.5453, r2 = Math.sin(on[on.length - 1] * 1311.7) * 24634.6345;
    shift = [((r1 - Math.floor(r1)) - 0.5) * 28 * k, ((r2 - Math.floor(r2)) - 0.5) * 28 * k];
  }
  const cut = si > 0 && lt < 0.15 && plan.flashCuts;
  const flash = freeze ? Math.max(0, 1 - (t - freeze.t) / 0.12) : cut ? (1 - lt / 0.15) * 0.75 : 0;
  const rgb = lt < 0.2 || (isDown && since < 0.1) ? 10 : seg.look === 'glitch' ? 6 + 10 * pulse : seg.look === 'vhs' ? 3 : 0;
  const chroma = seg.look === 'cyberpunk' || seg.look === 'kaleido' ? 0.008 + 0.006 * pulse : seg.look === 'glitch' ? 0.004 : 0;
  const cropX = interp(a.track.times, a.track.x, freeze ? freeze.t : t);
  const cy = interp(a.track.times, a.track.y, t);
  const storm = seg.look === 'storm' && pulse > 0.15 ? pulse * 0.18 : 0;
  return {
    seg, segIndex: si, pulse, beatIndex: bi, freeze, freezeT: freeze ? t - freeze.t : 0,
    params: {
      srcW: a.width, srcH: a.height, mode: seg.frame === 'fit' ? 1 : 0, cropX,
      mask: maskAt(a.masks, freeze ? freeze.t : t), maskW: a.masks?.w ?? 0, maskH: a.masks?.h ?? 0,
      look: LOOK_INDEX[look.id], time: t, p: lt / dur, pulse, seed: frameNo,
      freeze: !!freeze, hold: !!freeze && wasFreeze?.id !== freeze.id, flashAdd: storm,
      zoom, center: [0.5, seg.frame === 'fit' ? 0.5 : 1 - cy], shift, rgb, chroma, flash, letterbox: !!seg.letterbox,
      tint: hexToRgb(seg.tint ?? look.tint ?? '#ff2fb2'),
    },
  };
}
