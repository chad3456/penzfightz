/**
 * The garba, synthesised.
 *
 * Sixteen bars of 6/8 at a step every 0.18 s, made once into a buffer and
 * looped: the dhol — a low, round "dhin" on the bass head and a slap on the
 * treble — the claps of the circle, manjira, a harmonium holding Sa and Pa,
 * and a shehnai playing an original tune in Khamaj, with its flat seventh.
 * Under it all, a crowd. The page turns the whole thing up as the camera
 * nears a garba and down as it leaves.
 *
 * The dancers keep time from the same clock, so when the music is on they
 * are on the beat, not merely at the same tempo.
 */

export const STEP = 0.18;
const BARS = 16;
const LOOP = STEP * 6 * BARS;
const TAU = Math.PI * 2;

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
const m2f = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// the tune: one number per step, null to hold
const _ = null;
const A = [74, _, _, 76, _, 74, 72, _, 71, 69, _, _, 71, _, 72, 74, _, 72, 71, _, 69, 67, _, _];
const A2 = [74, _, _, 76, _, 74, 72, _, 71, 69, _, _, 67, _, 69, 71, _, 69, 66, _, 64, 62, _, _];
const B = [69, _, 71, 72, _, 74, 76, _, _, 74, _, 72, 74, _, 72, 71, _, 69, 71, _, _, _, _, _];
const TUNE: (number | null)[] = [...A, ...A2, ...B, ...A2];

async function render(sr: number) {
  const N = Math.ceil(LOOP * sr);
  const L = new Float32Array(N);
  const R = new Float32Array(N);
  // everything wraps round the end of the loop, so the seam is inaudible
  const add = (t0: number, dur: number, fn: (u: number) => number, gain: number, pan: number) => {
    const i0 = Math.floor(t0 * sr);
    const n = Math.floor(dur * sr);
    const gl = Math.cos(((pan + 1) * Math.PI) / 4) * gain;
    const gr = Math.sin(((pan + 1) * Math.PI) / 4) * gain;
    for (let k = 0; k < n; k++) {
      const i = (i0 + k) % N;
      const v = fn(k / sr);
      L[i] += v * gl;
      R[i] += v * gr;
    }
  };
  const rnd = mulberry(7);
  const noise = () => rnd() * 2 - 1;

  const dhin = (t: number, v = 1) => add(t, 0.7, (u) => Math.sin(TAU * (78 + 50 * Math.exp(-u * 18)) * u) * Math.exp(-u * 5.5) + Math.sin(TAU * 156 * u) * 0.2 * Math.exp(-u * 12), 0.55 * v, -0.1);
  const ta = (t: number, v = 1) => {
    let lp = 0;
    add(t, 0.25, (u) => { lp += 0.4 * (noise() - lp); return (Math.sin(TAU * 420 * u) * 0.6 + Math.sin(TAU * 910 * u) * 0.25) * Math.exp(-u * 22) + lp * Math.exp(-u * 50) * 0.8; }, 0.28 * v, 0.15);
  };
  const clap = (t: number, v = 1) => {
    // a hundred people clapping is never quite together
    for (let k = 0; k < 5; k++) {
      const dt = k * 0.006 + rnd() * 0.004;
      let hp = 0;
      let bp = 0;
      add(t + dt, 0.12, (u) => { const x = noise(); hp += 0.5 * (x - hp); bp += 0.35 * ((x - hp) - bp); return bp * Math.exp(-u * 40); }, 0.22 * v, (rnd() - 0.5) * 0.8);
    }
  };
  const manjira = (t: number, v = 1) => add(t, 0.8, (u) => (Math.sin(TAU * 2650 * u) + Math.sin(TAU * 3890 * u) * 0.6 + Math.sin(TAU * 5210 * u) * 0.3) * Math.exp(-u * 6), 0.05 * v, 0.4);
  const harmonium = (t: number, dur: number, ms: number[]) => {
    for (const m of ms) {
      const f = m2f(m);
      let ph1 = 0;
      let ph2 = 0;
      add(t, dur, (u) => {
        ph1 += f / sr;
        ph2 += (f * 1.004) / sr;
        const sq = (p: number) => (p % 1 < 0.5 ? 1 : -1) * 0.6 + Math.sin(TAU * p) * 0.4;
        return (sq(ph1) + sq(ph2)) * 0.5 * Math.min(1, u / 0.08, (dur - u) / 0.08);
      }, 0.035, (m % 2) - 0.5);
    }
  };
  const shehnai = (t: number, dur: number, m: number, prev: number) => {
    let ph = 0;
    let lp = 0;
    let bp = 0;
    add(t, dur + 0.05, (u) => {
      const glide = Math.min(1, u / 0.06);
      const mm = prev + (m - prev) * glide;
      const vib = 1 + 0.012 * Math.sin(TAU * 6 * u) * Math.min(1, u / 0.3);
      ph += (m2f(mm) * vib) / sr;
      const saw = 2 * (ph % 1) - 1;
      // a nasal reed: a saw pushed through a resonance round 1.4 kHz
      lp += 0.25 * (saw - lp);
      bp += 0.18 * ((saw - lp) - bp);
      const env = Math.min(1, u / 0.03) * Math.min(1, (dur + 0.05 - u) / 0.05);
      return (lp * 0.5 + bp * 1.6) * env;
    }, 0.09, 0.05);
  };

  // the dhol and the circle, bar by bar
  for (let bar = 0; bar < BARS; bar++) {
    const b0 = bar * STEP * 6;
    dhin(b0, 1);
    ta(b0 + STEP * 2, 0.8);
    dhin(b0 + STEP * 3, 0.85);
    ta(b0 + STEP * 4, 0.7);
    ta(b0 + STEP * 5, 0.9);
    if (bar % 4 === 3) { dhin(b0 + STEP * 4.5, 0.6); dhin(b0 + STEP * 5, 0.7); }
    // three claps to the phrase, where the dancers clap
    clap(b0 + STEP * 0, 0.9);
    clap(b0 + STEP * 2, 0.8);
    clap(b0 + STEP * 3, 0.9);
    manjira(b0, 1);
    manjira(b0 + STEP * 3, 0.7);
    if (bar % 2 === 0) harmonium(b0, STEP * 12, [50, 57, 62]);
    await new Promise((r) => setTimeout(r, 0));
  }
  // the tune
  let prev = TUNE[0] as number;
  for (let i = 0; i < TUNE.length; i++) {
    const m = TUNE[i];
    if (m == null) continue;
    let j = i + 1;
    while (j < TUNE.length && TUNE[j] == null) j++;
    shehnai(i * STEP, (j - i) * STEP, m, prev);
    prev = m;
  }
  await new Promise((r) => setTimeout(r, 0));
  let peak = 0;
  for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]!), Math.abs(R[i]!));
  const g = 0.8 / (peak || 1);
  for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i]! * g * 1.2); R[i] = Math.tanh(R[i]! * g * 1.2); }
  return { L, R };
}

/** A crowd: a few thousand people talking, shouting and singing along, far off. */
function crowd(sr: number) {
  const N = Math.floor(sr * 6);
  const L = new Float32Array(N);
  const R = new Float32Array(N);
  const r = mulberry(99);
  let a = 0;
  let b = 0;
  for (let i = 0; i < N; i++) {
    a += 0.03 * ((r() * 2 - 1) - a);
    b += 0.03 * ((r() * 2 - 1) - b);
    const swell = 0.7 + 0.3 * Math.sin((i / N) * TAU * 3);
    L[i] = a * 2.4 * swell;
    R[i] = b * 2.4 * swell;
  }
  // fade the ends into each other so the loop does not click
  const f = Math.floor(sr * 0.5);
  for (let i = 0; i < f; i++) {
    const k = i / f;
    L[i] = L[i]! * k + L[N - f + i]! * (1 - k);
    R[i] = R[i]! * k + R[N - f + i]! * (1 - k);
  }
  return { L: L.subarray(0, N - f), R: R.subarray(0, N - f) };
}

export class Garba {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private t0 = 0;
  playing = false;

  async start() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      const sr = this.ctx.sampleRate;
      const music = await render(sr);
      const noise = crowd(sr);
      const buf = this.ctx.createBuffer(2, music.L.length, sr);
      buf.copyToChannel(music.L, 0);
      buf.copyToChannel(music.R, 1);
      const cbuf = this.ctx.createBuffer(2, noise.L.length, sr);
      cbuf.copyToChannel(noise.L, 0);
      cbuf.copyToChannel(noise.R, 1);
      this.gain = this.ctx.createGain();
      this.gain.gain.value = 0;
      this.gain.connect(this.ctx.destination);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(this.gain);
      const csrc = this.ctx.createBufferSource();
      csrc.buffer = cbuf;
      csrc.loop = true;
      const cg = this.ctx.createGain();
      cg.gain.value = 0.35;
      csrc.connect(cg).connect(this.gain);
      this.t0 = this.ctx.currentTime + 0.05;
      src.start(this.t0);
      csrc.start(this.t0);
    }
    await this.ctx.resume();
    this.playing = true;
  }

  async stop() {
    this.playing = false;
    if (this.ctx) await this.ctx.suspend();
  }

  /** 0 to 1: how close we are to the dancing. */
  level(x: number) {
    if (!this.ctx || !this.gain) return;
    this.gain.gain.setTargetAtTime(0.1 + 0.9 * x, this.ctx.currentTime, 0.4);
  }

  /** Seconds into the music, for the dancers to keep time by. */
  time() {
    return this.ctx ? this.ctx.currentTime - this.t0 : 0;
  }
}
