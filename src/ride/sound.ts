/**
 * The sound of the ride.
 *
 * An original piano waltz in F, thirty-two bars, looped — the second time
 * round an octave up with strings under it. Under the music, the country
 * she is riding through, each layer faded in and out by the world:
 * min-min cicadas by day, higurashi at dusk with their falling "kana-kana",
 * crickets at night, the sea on the slope, the hum of the city, the fumikiri
 * bell at a crossing, the tick of the freewheel at her speed, and the
 * bicycle bell whenever it is rung.
 *
 * Every layer is rendered once into a buffer and looped; the frame only moves
 * the faders.
 */

import type { DistrictId } from './path';

const TAU = Math.PI * 2;
const m2f = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Stereo = { L: Float32Array<ArrayBuffer>; R: Float32Array<ArrayBuffer> };
function buffer(sr: number, secs: number): Stereo & { add: (t0: number, dur: number, fn: (u: number) => number, g: number, pan: number) => void } {
  const N = Math.floor(sr * secs);
  const L = new Float32Array(N);
  const R = new Float32Array(N);
  return {
    L,
    R,
    add(t0, dur, fn, g, pan) {
      const i0 = Math.floor(t0 * sr);
      const n = Math.floor(dur * sr);
      const gl = Math.cos(((pan + 1) * Math.PI) / 4) * g;
      const gr = Math.sin(((pan + 1) * Math.PI) / 4) * g;
      for (let k = 0; k < n; k++) {
        const i = (i0 + k) % N;
        const v = fn(k / sr);
        L[i] += v * gl;
        R[i] += v * gr;
      }
    },
  };
}
function normalise(b: Stereo, to = 0.8) {
  let p = 0;
  for (let i = 0; i < b.L.length; i++) p = Math.max(p, Math.abs(b.L[i]!), Math.abs(b.R[i]!));
  const g = to / (p || 1);
  for (let i = 0; i < b.L.length; i++) { b.L[i]! *= g; b.R[i]! *= g; }
  return b;
}

/* ── the waltz ───────────────────────────────────────────────────────── */

const BEAT = 60 / 88;
const BAR = BEAT * 3;
type N = [number, number, number];
const MELODY: N[][] = [
  [[0, 72, 1.5], [1.5, 74, 0.5], [2, 72, 1]], [[0, 69, 2], [2, 65, 1]], [[0, 74, 1.5], [1.5, 76, 0.5], [2, 74, 1]], [[0, 69, 3]],
  [[0, 70, 1], [1, 72, 1], [2, 74, 1]], [[0, 77, 2], [2, 76, 1]], [[0, 74, 1.5], [1.5, 72, 0.5], [2, 70, 1]], [[0, 69, 1], [1, 67, 2]],
  [[0, 72, 1.5], [1.5, 74, 0.5], [2, 72, 1]], [[0, 76, 2], [2, 72, 1]], [[0, 74, 1], [1, 77, 1], [2, 76, 1]], [[0, 74, 2], [2, 72, 1]],
  [[0, 69, 1], [1, 70, 1], [2, 72, 1]], [[0, 74, 1.5], [1.5, 72, 0.5], [2, 70, 1]], [[0, 69, 1], [1, 67, 1], [2, 64, 1]], [[0, 65, 3]],
];
const CHORDS = ['F', 'F', 'Dm', 'Dm', 'Bb', 'Bb', 'C', 'C', 'F', 'Am', 'Bb', 'C', 'Dm', 'Bb', 'C', 'F'];
const VOICE: Record<string, [number, number[]]> = {
  F: [41, [57, 60, 65]], Dm: [38, [57, 62, 65]], Bb: [46, [58, 62, 65]], C: [36, [55, 60, 64]], Am: [45, [57, 60, 64]],
};

async function waltz(sr: number) {
  const b = buffer(sr, BAR * 32);
  const piano = (t: number, m: number, v: number, pan: number) => {
    const f = m2f(m);
    const dec = 1.2 + (m - 40) * 0.03;
    b.add(t, 3.2, (u) => {
      const a = Math.min(1, u / 0.004);
      return a * (Math.sin(TAU * f * u) * Math.exp(-u * dec) + 0.45 * Math.sin(TAU * f * 2.003 * u) * Math.exp(-u * dec * 1.8) + 0.18 * Math.sin(TAU * f * 3.007 * u) * Math.exp(-u * dec * 2.6) + 0.06 * Math.sin(TAU * f * 4.02 * u) * Math.exp(-u * dec * 4));
    }, 0.12 * v, pan);
  };
  for (let pass = 0; pass < 2; pass++) {
    for (let bar = 0; bar < 16; bar++) {
      const t0 = (pass * 16 + bar) * BAR;
      const [bass, chord] = VOICE[CHORDS[bar]!]!;
      piano(t0, bass, 0.9, -0.3);
      for (const beat of [1, 2]) for (const m of chord) piano(t0 + beat * BEAT, m, 0.42, -0.1);
      for (const [beat, m, dur] of MELODY[bar]!) {
        piano(t0 + beat * BEAT, m + pass * 12, pass ? 0.75 : 0.95, 0.2);
        void dur;
      }
      if (pass === 1) {
        // strings under the second time through
        const ms = chord.map((m) => m + 12).concat([bass + 12]);
        for (const m of ms) {
          const f = m2f(m);
          let p1 = 0;
          let p2 = 0;
          let lp = 0;
          b.add(t0, BAR + 0.3, (u) => {
            p1 += (f * 1.003) / sr;
            p2 += (f * 0.997) / sr;
            const saw = (p1 % 1) * 2 - 1 + ((p2 % 1) * 2 - 1);
            lp += 0.03 * (saw - lp);
            return lp * Math.min(1, u / 0.5, (BAR + 0.3 - u) / 0.3);
          }, 0.05, (m % 3) - 1);
        }
      }
    }
    await new Promise((r) => setTimeout(r, 0));
  }
  return normalise(b, 0.7);
}

/* ── the country ─────────────────────────────────────────────────────── */

function cicadas(sr: number) {
  const b = buffer(sr, 6);
  const r = mulberry(3);
  let lp = 0;
  let hp = 0;
  b.add(0, 6, (u) => {
    const x = r() * 2 - 1;
    lp += 0.55 * (x - lp);
    hp += 0.2 * (lp - hp);
    const band = lp - hp;
    // min-min: a pulsing buzz that swells and falls away every second and a bit
    const phrase = (u % 1.4) / 1.4;
    const swell = Math.sin(Math.PI * phrase) ** 2;
    return band * (0.5 + 0.5 * Math.sin(TAU * 88 * u)) * swell;
  }, 0.9, -0.3);
  b.add(0.7, 5.3, (u) => (r() * 2 - 1) * 0.15 * (0.5 + 0.5 * Math.sin(TAU * 110 * u)) * Math.sin(Math.PI * ((u % 1.1) / 1.1)) ** 2, 0.6, 0.4);
  return normalise(b, 0.6);
}
function higurashi(sr: number) {
  const b = buffer(sr, 7);
  for (let k = 0; k < 14; k++) {
    const t = 0.4 + k * 0.17;
    const f = 5600 - k * 90;
    b.add(t, 0.16, (u) => Math.sin(TAU * f * u) * (0.5 + 0.5 * Math.sin(TAU * 34 * u)) * Math.sin((Math.PI * u) / 0.16), 0.5, -0.4);
  }
  for (let k = 0; k < 10; k++) {
    const t = 4 + k * 0.19;
    const f = 5200 - k * 80;
    b.add(t, 0.17, (u) => Math.sin(TAU * f * u) * (0.5 + 0.5 * Math.sin(TAU * 30 * u)) * Math.sin((Math.PI * u) / 0.17), 0.3, 0.5);
  }
  return normalise(b, 0.5);
}
function crickets(sr: number) {
  const b = buffer(sr, 4);
  const r = mulberry(8);
  for (let c = 0; c < 3; c++) {
    const f = 4300 + c * 400;
    const pan = c - 1;
    for (let t = r() * 0.5; t < 4; t += 0.55 + r() * 0.3) {
      for (let p = 0; p < 3; p++) b.add(t + p * 0.045, 0.03, (u) => Math.sin(TAU * f * u) * Math.sin((Math.PI * u) / 0.03), 0.3, pan * 0.6);
    }
  }
  return normalise(b, 0.45);
}
function sea(sr: number) {
  const b = buffer(sr, 8);
  const r = mulberry(5);
  let lp = 0;
  let lp2 = 0;
  b.add(0, 8, (u) => {
    lp += 0.02 * ((r() * 2 - 1) - lp);
    lp2 += 0.2 * ((r() * 2 - 1) - lp2);
    const swell = 0.35 + 0.65 * Math.sin(Math.PI * ((u % 4) / 4)) ** 3;
    return (lp * 3 + lp2 * 0.3 * swell) * swell;
  }, 1, 0.2);
  return normalise(b, 0.55);
}
function city(sr: number) {
  const b = buffer(sr, 6);
  const r = mulberry(6);
  let lp = 0;
  b.add(0, 6, (u) => { lp += 0.01 * ((r() * 2 - 1) - lp); return lp * 5 + Math.sin(TAU * 58 * u) * 0.03; }, 1, 0);
  return normalise(b, 0.45);
}
/** Kan-kan-kan: the crossing bell, two strokes a second and a bit. */
function fumikiri(sr: number) {
  const b = buffer(sr, 0.74);
  for (const [t, f] of [[0, 740], [0.37, 700]] as const) {
    b.add(t, 0.37, (u) => (Math.sin(TAU * f * u) + 0.5 * Math.sin(TAU * f * 2.76 * u) * Math.exp(-u * 12) + 0.25 * Math.sin(TAU * f * 5.4 * u) * Math.exp(-u * 20)) * Math.exp(-u * 7) * Math.min(1, u / 0.002), 0.5, 0);
  }
  return normalise(b, 0.6);
}
function freewheel(sr: number) {
  const b = buffer(sr, 1);
  const r = mulberry(4);
  for (let k = 0; k < 24; k++) b.add(k / 24, 0.012, (u) => (r() * 2 - 1) * Math.exp(-u * 500), 0.4, 0);
  return normalise(b, 0.3);
}
function bell(sr: number) {
  const b = buffer(sr, 1.6);
  for (const t of [0, 0.22]) {
    b.add(t, 1.3, (u) => (Math.sin(TAU * 2350 * u) + 0.6 * Math.sin(TAU * 3950 * u) + 0.3 * Math.sin(TAU * 5870 * u)) * Math.exp(-u * 5) * Math.min(1, u / 0.001) * (1 + 0.3 * Math.sin(TAU * 18 * u)), 0.5, 0.1);
  }
  return normalise(b, 0.6);
}

export interface SoundState {
  night: number;
  tod: number;
  district: DistrictId;
  crossing: boolean;
  crossingDist: number;
  speed: number;
}

export class Sound {
  private ctx: AudioContext | null = null;
  private faders: Record<string, GainNode> = {};
  private srcs: Record<string, AudioBufferSourceNode> = {};
  private bellBuf: AudioBuffer | null = null;
  private master: GainNode | null = null;
  playing = false;
  loading = false;

  async start() {
    if (!this.ctx) {
      this.loading = true;
      const ctx = new AudioContext();
      this.ctx = ctx;
      const sr = ctx.sampleRate;
      this.master = ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(ctx.destination);
      const mk = (s: Stereo) => {
        const buf = ctx.createBuffer(2, s.L.length, sr);
        buf.copyToChannel(s.L, 0);
        buf.copyToChannel(s.R, 1);
        return buf;
      };
      const layers: Record<string, Stereo> = {
        music: await waltz(sr), cicadas: cicadas(sr), higurashi: higurashi(sr), crickets: crickets(sr),
        sea: sea(sr), city: city(sr), fumikiri: fumikiri(sr), freewheel: freewheel(sr),
      };
      for (const [name, s] of Object.entries(layers)) {
        const g = ctx.createGain();
        g.gain.value = 0;
        g.connect(this.master);
        const src = ctx.createBufferSource();
        src.buffer = mk(s);
        src.loop = true;
        src.connect(g);
        src.start();
        this.faders[name] = g;
        this.srcs[name] = src;
      }
      this.bellBuf = mk(bell(sr));
      this.loading = false;
    }
    await this.ctx.resume();
    this.playing = true;
  }

  async stop() {
    this.playing = false;
    if (this.ctx) await this.ctx.suspend();
  }

  ring() {
    if (!this.ctx || !this.bellBuf || !this.master || !this.playing) return;
    const s = this.ctx.createBufferSource();
    s.buffer = this.bellBuf;
    s.connect(this.master);
    s.start();
  }

  update(st: SoundState) {
    if (!this.ctx || !this.playing || this.loading) return;
    const now = this.ctx.currentTime;
    const set = (k: string, v: number) => this.faders[k]?.gain.setTargetAtTime(Math.max(0, v), now, 0.5);
    const day = 1 - st.night;
    const dusk = Math.max(0, 1 - Math.abs(st.tod - 0.78) / 0.04) + Math.max(0, 1 - Math.abs(st.tod - 0.24) / 0.03) * 0.6;
    const green = st.district === 'fields' || st.district === 'sea' ? 1 : st.district === 'street' ? 0.4 : 0.15;
    set('music', 0.55);
    set('cicadas', day * (1 - dusk) * green * 0.5);
    set('higurashi', dusk * green * 0.8);
    set('crickets', st.night * green * 0.6);
    set('sea', st.district === 'sea' ? 0.55 : 0);
    set('city', st.district === 'city' ? 0.5 : st.district === 'street' ? 0.2 : 0);
    set('fumikiri', st.crossing ? Math.max(0, 1 - st.crossingDist / 160) * 0.8 : 0);
    set('freewheel', Math.min(1, st.speed / 7) * 0.25);
    const fw = this.srcs.freewheel;
    if (fw) fw.playbackRate.setTargetAtTime(0.3 + st.speed / 7, now, 0.3);
  }
}
