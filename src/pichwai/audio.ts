/**
 * The sound of the films, made in the browser.
 *
 * Under everything a tanpura (Pa, Sa', Sa', Sa) plucked by Karplus–Strong.
 * Over it a small choir chants the text: every syllable is a note, held one
 * mātrā or two, voiced on the formants of its own vowel — so "ā" opens, "ī"
 * narrows, "u" darkens — with a breath of noise for a sibilant and a click
 * for a stop. The tune is the plain recitation shape of an anuṣṭubh: the
 * first half-line on the tonic, a lift to the second and third in the middle,
 * and a fall home at the end of each half-verse. A temple bell closes every
 * verse; a conch opens every section; in the Gita a bansuri plays over the
 * chapter cards.
 */
import type { Timeline, LineT } from './time';

const SCALE = [0, 2, 4, 5, 7, 9, 11];
const FORMANT: Record<string, [number, number, number]> = {
  a: [700, 1220, 2600], 'ā': [760, 1180, 2550], i: [310, 2250, 2950], 'ī': [280, 2320, 3000],
  u: [330, 820, 2300], 'ū': [300, 760, 2300], e: [460, 1950, 2600], ai: [560, 1800, 2600],
  o: [490, 860, 2500], au: [570, 960, 2500], 'ṛ': [420, 1350, 1750], 'ṝ': [420, 1350, 1750], 'ḷ': [400, 1100, 2500],
};

interface Ev { t: number; f: (when: number, rate: number) => void }

export interface ChantOpts { sa: number; flute?: boolean; bellEvery?: number }

export class Chant {
  ctx: AudioContext | null = null;
  out!: GainNode; rev!: ConvolverNode; wet!: GainNode; choirBus!: GainNode;
  drone: AudioBufferSourceNode | null = null; droneGain!: GainNode;
  events: Ev[] = [];
  cursor = 0;
  live: AudioScheduledSourceNode[] = [];
  on = true;
  voice: SpeechSynthesisVoice | null = null;
  speakOn = false;
  private nb: AudioBuffer | null = null;

  constructor(private tl: Timeline, private o: ChantOpts) {}

  private deg(d: number, oct = 0) {
    const o = Math.floor(d / 7), i = ((d % 7) + 7) % 7;
    return this.o.sa * Math.pow(2, (SCALE[i] + 12 * (o + oct)) / 12);
  }

  start() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.out = ctx.createGain(); this.out.gain.value = 0.9; this.out.connect(ctx.destination);
    this.rev = ctx.createConvolver(); this.rev.buffer = this.impulse(ctx, 3.2);
    this.wet = ctx.createGain(); this.wet.gain.value = 0.38; this.rev.connect(this.wet).connect(this.out);
    this.choirBus = ctx.createGain(); this.choirBus.gain.value = 0.8;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3400;
    this.choirBus.connect(lp); lp.connect(this.out); lp.connect(this.rev);
    this.droneGain = ctx.createGain(); this.droneGain.gain.value = 0; this.droneGain.connect(this.out); this.droneGain.connect(this.rev);
    this.pickVoice();
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.onvoiceschanged = () => this.pickVoice();
    this.events = this.build();
  }
  private pickVoice() {
    if (typeof speechSynthesis === 'undefined') return;
    const vs = speechSynthesis.getVoices();
    this.voice = vs.find((v) => v.lang === 'sa-IN') ?? vs.find((v) => v.lang === 'hi-IN') ?? vs.find((v) => v.lang.startsWith('hi')) ?? null;
  }
  get hasVoice() { return !!this.voice; }

  private impulse(ctx: AudioContext, secs: number) {
    const n = Math.floor(ctx.sampleRate * secs), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.8); }
    return b;
  }
  private noise(ctx: AudioContext, secs: number) { const n = Math.floor(ctx.sampleRate * secs), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
  private keep(n: AudioScheduledSourceNode) { this.live.push(n); n.onended = () => { const i = this.live.indexOf(n); if (i >= 0) this.live.splice(i, 1); }; }

  /** Tanpura: Pa, Sa', Sa', Sa, plucked by Karplus–Strong into one looping buffer. */
  private tanpura(ctx: AudioContext) {
    const sr = ctx.sampleRate, cycle = 4.4, n = Math.floor(sr * cycle);
    const buf = ctx.createBuffer(2, n, sr), L = buf.getChannelData(0), R = buf.getChannelData(1);
    const S = this.o.sa, notes = [S * 1.5, S * 2, S * 2, S];
    notes.forEach((f, k) => {
      const start = Math.floor((k * cycle / 4) * sr), period = Math.round(sr / f), ring = new Float32Array(period);
      for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
      let idx = 0;
      for (let i = 0; i < n + sr * 2; i++) {
        const v = (ring[idx] + ring[(idx + 1) % period]) * 0.4986; ring[idx] = v; idx = (idx + 1) % period;
        const s = Math.tanh(v * 2.2) * 0.3 * Math.exp(-i / (sr * 3.4)), pos = (start + i) % n, pan = k % 2 ? 0.64 : 0.36;
        L[pos] += s * (1 - pan); R[pos] += s * pan;
      }
    });
    return buf;
  }
  setDrone(on: boolean) {
    const ctx = this.ctx; if (!ctx) return;
    if (on && !this.drone) { const src = ctx.createBufferSource(); src.buffer = this.tanpura(ctx); src.loop = true; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2400; src.connect(f).connect(this.droneGain); src.start(); this.drone = src; }
    this.droneGain.gain.setTargetAtTime(on && this.on ? 0.36 : 0, ctx.currentTime, 0.5);
  }

  /* ── instruments ── */

  /** One chanted syllable: three slightly detuned voices through the vowel's formants. */
  choir(t: number, dur: number, freq: number, vowel: string, onset: string, vel = 1, from = 0, nasal = false) {
    const ctx = this.ctx!;
    const F = FORMANT[vowel] ?? FORMANT.a;
    const bus = ctx.createGain();
    const env = ctx.createGain();
    const a = 0.16 * vel, att = Math.min(0.05, dur * 0.3), rel = Math.min(0.1, dur * 0.35);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(a, t + att);
    env.gain.setValueAtTime(a * 0.92, t + Math.max(att, dur - rel));
    env.gain.linearRampToValueAtTime(0.0001, t + dur + 0.04);
    const filters = F.map((f, i) => {
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = [7, 11, 14][i];
      const g = ctx.createGain(); g.gain.value = [1.0, 0.55, 0.22][i];
      bus.connect(bp).connect(g).connect(env);
      return bp;
    });
    if (nasal) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(2400, t); lp.frequency.linearRampToValueAtTime(600, t + dur); env.connect(lp).connect(this.choirBus); }
    else env.connect(this.choirBus);
    void filters;
    const oscs: OscillatorNode[] = [];
    for (const [det, lvl, oct] of [[-7, 0.5, 1], [6, 0.5, 1], [2, 0.3, 0.5]] as [number, number, number][]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      const f0 = freq * oct, fs = (from || freq) * oct;
      o.frequency.setValueAtTime(fs, t); o.frequency.exponentialRampToValueAtTime(f0, t + Math.min(0.06, dur * 0.4));
      o.detune.value = det;
      // a slow natural vibrato on long notes
      if (dur > 0.3) { const v = ctx.createOscillator(), vg = ctx.createGain(); v.frequency.value = 5; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f0 * 0.005, t + dur); v.connect(vg).connect(o.frequency); v.start(t); v.stop(t + dur + 0.08); this.keep(v); }
      const g = ctx.createGain(); g.gain.value = lvl;
      o.connect(g).connect(bus);
      o.start(t); o.stop(t + dur + 0.08); this.keep(o); oscs.push(o);
    }
    // consonant: a breath for sibilants and h, a click for stops
    if (onset) {
      this.nb ??= this.noise(ctx, 0.3);
      const fric = /^(ś|ṣ|s|h)/.test(onset), stop = /^(k|g|c|j|ṭ|ḍ|t|d|p|b)/.test(onset);
      if (fric || stop) {
        const n = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
        n.buffer = this.nb; bp.type = fric ? 'highpass' : 'bandpass'; bp.frequency.value = fric ? (onset[0] === 's' ? 5200 : 3400) : 1800;
        const len = fric ? 0.06 : 0.018;
        g.gain.setValueAtTime(fric ? 0.05 * vel : 0.07 * vel, t - (fric ? 0.03 : 0.005)); g.gain.exponentialRampToValueAtTime(0.0005, t + len);
        n.connect(bp).connect(g).connect(this.choirBus);
        n.start(Math.max(0, t - 0.03)); n.stop(t + len + 0.02); this.keep(n);
      }
    }
  }

  bell(t: number, freq = 660, vel = 1) {
    const ctx = this.ctx!;
    for (const [r, a, d] of [[1, 0.09, 3.2], [2.76, 0.05, 1.8], [5.4, 0.025, 1.0], [8.93, 0.012, 0.6]] as [number, number, number][]) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = freq * r;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a * vel, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0002, t + d);
      o.connect(g); g.connect(this.out); g.connect(this.rev); o.start(t); o.stop(t + d + 0.05); this.keep(o);
    }
  }

  /** The conch: a breathy horn that swells and bends up at the end. */
  conch(t: number, vel = 1, len = 2.6) {
    const ctx = this.ctx!;
    const f = this.o.sa * 1.5;
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = 'sawtooth'; o2.type = 'square';
    o.frequency.setValueAtTime(f * 0.97, t); o.frequency.linearRampToValueAtTime(f, t + 0.4); o.frequency.setValueAtTime(f, t + len - 0.5); o.frequency.linearRampToValueAtTime(f * 1.06, t + len);
    o2.frequency.setValueAtTime(f * 2.002, t);
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1600, t + 0.8); lp.frequency.linearRampToValueAtTime(900, t + len);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12 * vel, t + 0.5); g.gain.setValueAtTime(0.12 * vel, t + len - 0.4); g.gain.linearRampToValueAtTime(0.0001, t + len);
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    o.connect(lp); o2.connect(g2).connect(lp); lp.connect(g); g.connect(this.out); g.connect(this.rev);
    this.nb ??= this.noise(ctx, 0.3);
    const n = ctx.createBufferSource(), nb = ctx.createBiquadFilter(), ng = ctx.createGain(); n.buffer = this.nb; n.loop = true; nb.type = 'bandpass'; nb.frequency.value = f * 3; nb.Q.value = 3;
    ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(0.03 * vel, t + 0.3); ng.gain.linearRampToValueAtTime(0, t + len);
    n.connect(nb).connect(ng).connect(this.out);
    for (const x of [o, o2, n]) { x.start(t); x.stop(t + len + 0.05); this.keep(x); }
  }

  flute(t: number, dur: number, freq: number, vel = 1) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    const vib = ctx.createOscillator(), vg = ctx.createGain();
    o.frequency.setValueAtTime(freq, t); o2.frequency.setValueAtTime(freq * 2, t);
    vib.frequency.value = 5.2; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(freq * 0.007, t + Math.min(0.4, dur * 0.6));
    vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
    const g2 = ctx.createGain(); g2.gain.value = 0.1; o2.connect(g2).connect(lp);
    lp.type = 'lowpass'; lp.frequency.value = 2800;
    const a = 0.1 * vel, rel = Math.min(0.15, dur * 0.3);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.05); g.gain.setValueAtTime(a * 0.9, t + Math.max(0.06, dur - rel)); g.gain.linearRampToValueAtTime(0, t + dur + 0.02);
    o.connect(lp); lp.connect(g); g.connect(this.out); g.connect(this.rev);
    this.nb ??= this.noise(ctx, 0.3);
    const n = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng = ctx.createGain(); n.buffer = this.nb; n.loop = true; nf.type = 'bandpass'; nf.frequency.value = freq * 2; nf.Q.value = 1.5;
    ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(0.022 * vel, t + 0.03); ng.gain.exponentialRampToValueAtTime(0.002, t + Math.min(0.25, dur));
    n.connect(nf).connect(ng).connect(this.out);
    for (const x of [o, o2, vib, n]) { x.start(t); x.stop(t + dur + 0.06); this.keep(x); }
  }

  /* ── the tune ── */

  /** Scale degree for syllable k of n in a line: the plain recitation shape. */
  private contour(k: number, n: number, li: number, last: boolean) {
    const u = n > 1 ? k / (n - 1) : 0;
    if (k === n - 1) return last ? 0 : li % 2 ? 0 : -1;
    if (li % 2 === 0) return u < 0.3 ? 0 : u < 0.62 ? 2 : 1;
    return u < 0.22 ? 1 : u < 0.55 ? 2 : u < 0.86 ? 1 : 0;
  }

  private chantLine(ev: Ev[], base: number, L: LineT, li: number, last: boolean, vel = 1) {
    let prev = 0;
    L.syl.forEach((s, k) => {
      const d = L.speaker ? 0 : this.contour(k, L.syl.length, li, last && k === L.syl.length - 1);
      const f = this.deg(d), from = prev;
      const onset = (s.rom.match(/^[^aāiīuūṛṝḷeo]+/)?.[0] ?? '');
      const nasal = /ṃ$/.test(s.rom) || s.dev === 'ॐ';
      const dur = s.dur * 0.97 + (k === L.syl.length - 1 ? 0.12 : 0);
      ev.push({ t: base + s.start, f: (w, r) => this.choir(w, dur / r, f, s.v, onset, (s.heavy ? 1 : 0.86) * vel * (L.speaker ? 0.75 : 1), from, nasal) });
      prev = f;
    });
  }

  private build(): Ev[] {
    const ev: Ev[] = [];
    for (const s of this.tl.segs) {
      if (s.kind === 'card') {
        ev.push({ t: s.start + 0.3, f: (w) => this.conch(w, 0.9) });
        ev.push({ t: s.start + 0.2, f: (w) => this.bell(w, this.deg(4, 2), 0.7) });
        if (this.o.flute) for (const [dt, d, f] of [[3.4, 0.7, 4], [4.1, 0.5, 5], [4.6, 1.2, 4], [5.9, 0.5, 2], [6.4, 1.6, 0]] as [number, number, number][]) ev.push({ t: s.start + dt + (s.lines.length ? 3 : 0), f: (w, r) => this.flute(w, d / r, this.deg(f, 1), 0.7) });
        s.lines.forEach((L, li) => this.chantLine(ev, s.start, L, li, li === s.lines.length - 1, 0.9));
      } else if (s.kind === 'verse') {
        const own = s.lines.filter((l) => !l.speaker);
        let li = 0;
        for (const L of s.lines) {
          if (L.speaker) this.chantLine(ev, s.start, L, 0, false, 0.85);
          else { this.chantLine(ev, s.start, L, li, li === own.length - 1); li++; }
        }
        const lastL = own[own.length - 1];
        if (lastL) ev.push({ t: s.start + lastL.start + lastL.dur + 0.15, f: (w) => this.bell(w, this.deg(4, 2), 0.32) });
      } else {
        ev.push({ t: s.start + 0.5, f: (w) => this.conch(w, 1, 3.4) });
        for (let i = 0; i < 5; i++) ev.push({ t: s.start + 4 + i * 1.6, f: (w) => this.bell(w, this.deg([4, 2, 0, 4, 7][i], 2), 0.6) });
      }
    }
    return ev.sort((a, b) => a.t - b.t);
  }

  pump(T: number, rate: number, horizon = 0.3) {
    const ctx = this.ctx; if (!ctx || !this.on) return;
    while (this.cursor < this.events.length && this.events[this.cursor].t < T + horizon * rate) {
      const e = this.events[this.cursor++];
      if (e.t < T - 0.05) continue;
      e.f(ctx.currentTime + Math.max(0, (e.t - T) / rate), rate);
    }
  }
  seek(T: number) {
    for (const n of this.live.splice(0)) { try { n.stop(); } catch { /* already stopped */ } }
    let lo = 0, hi = this.events.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (this.events[mid].t < T) lo = mid + 1; else hi = mid; }
    this.cursor = lo;
    this.hush();
  }
  setOn(on: boolean) { this.on = on; if (!on) this.seek(0); this.droneGain?.gain.setTargetAtTime(on && this.drone ? 0.36 : 0, this.ctx?.currentTime ?? 0, 0.3); }
  speak(text: string, secs: number) {
    if (!this.speakOn || typeof speechSynthesis === 'undefined' || !this.voice) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.voice = this.voice; u.lang = this.voice.lang;
    u.rate = Math.max(0.7, Math.min(1.2, (text.length / 14) / secs)); u.pitch = 0.85; u.volume = 0.9;
    speechSynthesis.speak(u);
  }
  hush() { if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); }
  suspend() { void this.ctx?.suspend(); this.hush(); }
  resume() { void this.ctx?.resume(); }
  stop() { this.hush(); void this.ctx?.close(); this.ctx = null; this.drone = null; }
}
