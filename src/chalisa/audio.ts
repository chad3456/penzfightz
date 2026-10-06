/**
 * The score, made in the browser: a tanpura drone; a dholak and manjira in
 * an eight-beat keherwa under every chaupai (the dohas are left free, over
 * drone alone); and a bansuri that sings the verse — one note for every
 * syllable, held twice as long for a heavy one — to an original tune in a
 * gentle Bilawal-like scale. Where the device has a Hindi voice it can also
 * speak each foot of the verse.
 *
 * Everything is scheduled against the film clock, a quarter-second ahead.
 */
import { TL, MATRA, type Segment } from './time';

const SA = 277.18; // C#4
const SCALE = [0, 2, 4, 5, 7, 9, 11];
const deg = (d: number) => { const o = Math.floor(d / 7), i = ((d % 7) + 7) % 7; return SA * Math.pow(2, (SCALE[i] + 12 * o) / 12); };

/* original melodic contours, one degree per mātrā */
const TUNES: Record<string, number[]> = {
  c0: [0, 0, 1, 2, 2, 2, 3, 4, 4, 4, 5, 4, 3, 2, 2, 2],
  c1: [4, 4, 5, 6, 7, 7, 6, 5, 4, 4, 3, 2, 1, 1, 0, 0],
  c0b: [2, 2, 3, 4, 4, 5, 4, 4, 5, 6, 7, 6, 5, 4, 4, 4],
  c1b: [7, 7, 6, 5, 4, 4, 5, 4, 3, 2, 3, 2, 1, 0, 0, 0],
  d0: [4, 4, 5, 4, 3, 4, 2, 2, 1, 2, 3, 2, 2],
  d1: [2, 2, 1, 0, 1, 2, 1, 0, -1, 0, 0],
  d2: [4, 5, 7, 7, 6, 5, 4, 5, 4, 3, 2, 2, 2],
  d3: [3, 2, 1, 2, 1, 0, -1, -2, -1, 0, 0],
};

interface Ev { t: number; f: (when: number, rate: number) => void }

export class Score {
  ctx: AudioContext | null = null;
  out!: GainNode; rev!: ConvolverNode; wet!: GainNode;
  drone: AudioBufferSourceNode | null = null; droneGain!: GainNode;
  voice: SpeechSynthesisVoice | null = null;
  speakOn = false;
  events: Ev[] = [];
  cursor = 0;
  live: AudioScheduledSourceNode[] = [];
  on = true;

  start() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.out = ctx.createGain(); this.out.gain.value = 0.9; this.out.connect(ctx.destination);
    this.rev = ctx.createConvolver(); this.rev.buffer = this.impulse(ctx, 2.4);
    this.wet = ctx.createGain(); this.wet.gain.value = 0.32; this.rev.connect(this.wet).connect(this.out);
    this.droneGain = ctx.createGain(); this.droneGain.gain.value = 0; this.droneGain.connect(this.out); this.droneGain.connect(this.rev);
    this.pickVoice();
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.onvoiceschanged = () => this.pickVoice();
    this.events = this.build();
  }
  private pickVoice() {
    if (typeof speechSynthesis === 'undefined') return;
    const vs = speechSynthesis.getVoices();
    this.voice = vs.find((v) => v.lang === 'hi-IN') ?? vs.find((v) => v.lang.startsWith('hi')) ?? null;
  }
  get hasVoice() { return !!this.voice; }

  private impulse(ctx: AudioContext, secs: number) {
    const n = Math.floor(ctx.sampleRate * secs), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
    return b;
  }
  /** One tanpura cycle (Pa, Sa', Sa', Sa) by Karplus–Strong, looped. */
  private tanpura(ctx: AudioContext) {
    const sr = ctx.sampleRate, cycle = 4.0, n = Math.floor(sr * cycle);
    const buf = ctx.createBuffer(2, n, sr), L = buf.getChannelData(0), R = buf.getChannelData(1);
    const S = SA / 2, notes = [S * 1.5, S * 2, S * 2, S];
    notes.forEach((f, k) => {
      const start = Math.floor((k * cycle / 4) * sr), period = Math.round(sr / f), ring = new Float32Array(period);
      for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
      let idx = 0;
      for (let i = 0; i < n + sr * 2; i++) {
        const v = (ring[idx] + ring[(idx + 1) % period]) * 0.4985; ring[idx] = v; idx = (idx + 1) % period;
        const s = Math.tanh(v * 2.2) * 0.3 * Math.exp(-i / (sr * 3.2)), pos = (start + i) % n, pan = k % 2 ? 0.62 : 0.38;
        L[pos] += s * (1 - pan); R[pos] += s * pan;
      }
    });
    return buf;
  }
  setDrone(on: boolean) {
    const ctx = this.ctx; if (!ctx) return;
    if (on && !this.drone) { const src = ctx.createBufferSource(); src.buffer = this.tanpura(ctx); src.loop = true; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2600; src.connect(f).connect(this.droneGain); src.start(); this.drone = src; }
    this.droneGain.gain.setTargetAtTime(on && this.on ? 0.42 : 0, ctx.currentTime, 0.5);
  }

  /* ── instruments ── */
  private keep(n: AudioScheduledSourceNode) { this.live.push(n); n.onended = () => { const i = this.live.indexOf(n); if (i >= 0) this.live.splice(i, 1); }; }
  private noise(ctx: AudioContext, secs: number) { const n = Math.floor(ctx.sampleRate * secs), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
  private nb: AudioBuffer | null = null;
  bass(t: number, vel = 1) {
    const ctx = this.ctx!; const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(62, t + 0.18);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.42 * vel, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.45);
    o.connect(g).connect(this.out); o.start(t); o.stop(t + 0.5); this.keep(o);
  }
  treble(t: number, vel = 1, pitch = 440) {
    const ctx = this.ctx!; const o = ctx.createOscillator(), g = ctx.createGain(), bp = ctx.createBiquadFilter();
    o.type = 'triangle'; o.frequency.setValueAtTime(pitch, t);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18 * vel, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.16);
    o.connect(g).connect(this.out); o.start(t); o.stop(t + 0.2); this.keep(o);
    this.nb ??= this.noise(ctx, 0.2);
    const n = ctx.createBufferSource(), ng = ctx.createGain(); n.buffer = this.nb; bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 2;
    ng.gain.setValueAtTime(0.12 * vel, t); ng.gain.exponentialRampToValueAtTime(0.0005, t + 0.05);
    n.connect(bp).connect(ng).connect(this.out); n.start(t); n.stop(t + 0.08); this.keep(n);
  }
  manjira(t: number, vel = 1) {
    const ctx = this.ctx!;
    for (const [f, a] of [[2637, 0.05], [3951, 0.035], [5274, 0.02], [7040, 0.012]] as [number, number][]) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.004);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a * vel, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0003, t + 0.9);
      o.connect(g); g.connect(this.out); g.connect(this.rev); o.start(t); o.stop(t + 1); this.keep(o);
    }
  }
  flute(t: number, dur: number, freq: number, vel = 1) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    const vib = ctx.createOscillator(), vg = ctx.createGain();
    o.frequency.setValueAtTime(freq, t); o2.frequency.setValueAtTime(freq * 2, t);
    vib.frequency.value = 5.2; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(freq * 0.006, t + Math.min(0.3, dur * 0.6));
    vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
    const g2 = ctx.createGain(); g2.gain.value = 0.12; o2.connect(g2).connect(lp);
    lp.type = 'lowpass'; lp.frequency.value = 2600;
    const a = 0.11 * vel, rel = Math.min(0.12, dur * 0.3);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.04); g.gain.setValueAtTime(a * 0.9, t + Math.max(0.05, dur - rel)); g.gain.linearRampToValueAtTime(0, t + dur + 0.02);
    o.connect(lp); lp.connect(g); g.connect(this.out); g.connect(this.rev);
    // breath
    this.nb ??= this.noise(ctx, 0.2);
    const n = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng = ctx.createGain(); n.buffer = this.nb; n.loop = true; nf.type = 'bandpass'; nf.frequency.value = freq * 2; nf.Q.value = 1.5; ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(0.025 * vel, t + 0.03); ng.gain.exponentialRampToValueAtTime(0.002, t + Math.min(0.25, dur));
    n.connect(nf).connect(ng).connect(this.out);
    for (const x of [o, o2, vib, n]) { x.start(t); x.stop(t + dur + 0.06); this.keep(x); }
  }

  /** Every sound in the film, as film-time events. */
  private build(): Ev[] {
    const ev: Ev[] = [];
    let chaupaiN = 0;
    for (const s of TL.segs) {
      if (s.kind === 'chaupai') {
        const beat = MATRA * 2, n = Math.round(s.dur / beat);
        // keherwa: dha ge na ti | na ka dhi na
        for (let i = 0; i < n; i++) {
          const t = s.start + i * beat, k = i % 8, soft = i < 4 || i >= n - 2 ? 0.55 : 1;
          if (k === 0 || k === 6) ev.push({ t, f: (w) => { this.bass(w, soft); this.treble(w, 0.8 * soft, 520); } });
          if (k === 1) ev.push({ t, f: (w) => this.bass(w, 0.6 * soft) });
          if (k === 2 || k === 4 || k === 7) ev.push({ t, f: (w) => this.treble(w, 0.9 * soft, k === 4 ? 470 : 520) });
          if (k === 3 || k === 5) ev.push({ t, f: (w) => this.treble(w, 0.45 * soft, 600) });
          if (k === 0 || k === 4) ev.push({ t, f: (w) => this.manjira(w, k === 0 ? 0.9 * soft : 0.6 * soft) });
          if (k === 2 || k === 6) ev.push({ t: t + beat * 0.5, f: (w) => this.manjira(w, 0.25 * soft) });
        }
        const alt = chaupaiN++ % 2 === 1;
        s.charans.forEach((c, ci) => this.melody(ev, s, c.words, alt ? (ci ? 'c1b' : 'c0b') : (ci ? 'c1' : 'c0'), MATRA));
      } else if (s.kind === 'doha') {
        ev.push({ t: s.start + 0.2, f: (w) => this.manjira(w, 0.7) });
        s.charans.forEach((c, ci) => { ev.push({ t: s.start + c.start, f: (w) => this.manjira(w, 0.35) }); this.melody(ev, s, c.words, 'd' + ci, 0.3); });
      } else if (s.kind === 'title' || s.kind === 'end') {
        for (const [dt, d, f] of [[1.5, 0.9, 0], [2.4, 0.5, 2], [2.9, 0.5, 4], [3.4, 1.4, 4], [5.2, 0.6, 5], [5.8, 0.6, 4], [6.4, 1.8, 2], [8.4, 2.4, 0]] as [number, number, number][]) ev.push({ t: s.start + dt, f: (w, r) => this.flute(w, d / r, deg(f), 0.8) });
        ev.push({ t: s.start + 0.4, f: (w) => this.manjira(w, 0.8) });
      }
    }
    return ev.sort((a, b) => a.t - b.t);
  }
  private melody(ev: Ev[], s: Segment, words: { syl: { start: number; dur: number; heavy: boolean }[] }[], tune: string, _m: number) {
    const contour = TUNES[tune] ?? TUNES.c0;
    let mi = 0;
    words.forEach((w) => w.syl.forEach((y) => {
      const d = contour[Math.min(contour.length - 1, Math.floor(mi))];
      const f = deg(d), dur = y.dur * 0.94;
      ev.push({ t: s.start + y.start, f: (w2, r) => this.flute(w2, dur / r, f, y.heavy ? 1 : 0.85) });
      mi += y.heavy ? 2 : 1;
    }));
  }

  /** Schedule events between film times [from, to) at playback `rate`. */
  pump(T: number, rate: number, horizon = 0.3) {
    const ctx = this.ctx; if (!ctx || !this.on) return;
    while (this.cursor < this.events.length && this.events[this.cursor].t < T + horizon * rate) {
      const e = this.events[this.cursor++];
      if (e.t < T - 0.05) continue;
      const when = ctx.currentTime + Math.max(0, (e.t - T) / rate);
      e.f(when, rate);
    }
  }
  /** Jump the cursor to film time T and silence what is sounding. */
  seek(T: number) {
    for (const n of this.live.splice(0)) { try { n.stop(); } catch { /* already stopped */ } }
    let lo = 0, hi = this.events.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (this.events[mid].t < T) lo = mid + 1; else hi = mid; }
    this.cursor = lo;
    this.hush();
  }
  setOn(on: boolean) { this.on = on; if (!on) this.seek(0); this.droneGain?.gain.setTargetAtTime(on && this.drone ? 0.42 : 0, this.ctx?.currentTime ?? 0, 0.3); }
  speak(text: string, secs: number) {
    if (!this.speakOn || typeof speechSynthesis === 'undefined' || !this.voice) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.voice = this.voice; u.lang = this.voice.lang;
    u.rate = Math.max(0.7, Math.min(1.2, (text.length / 14) / secs)); u.pitch = 0.9; u.volume = 0.9;
    speechSynthesis.speak(u);
  }
  hush() { if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); }
  suspend() { void this.ctx?.suspend(); this.hush(); }
  resume() { void this.ctx?.resume(); }
  stop() { this.hush(); void this.ctx?.close(); this.ctx = null; this.drone = null; }
}
