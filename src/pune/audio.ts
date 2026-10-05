/**
 * Pune 411's sound, all synthesised: engines, horns (a lot of horns), the
 * police siren, crows by day and crickets by night, temple bells, and three
 * radio stations playing original music generated on the fly.
 */

export const STATIONS = [
  { id: 'off', name: 'Radio off', sub: '' },
  { id: 'peth', name: 'Radio Peth 92.7', sub: 'Harmonium, tabla and tanpura in raag Yaman' },
  { id: 'dhol', name: 'Dhol Tasha FM 101.1', sub: 'The pathak is rehearsing for Ganeshotsav' },
  { id: 'kp', name: 'Koregaon Lo-fi 104', sub: 'Late-night beats from Lane 7' },
] as const;
export type StationId = (typeof STATIONS)[number]['id'];

export class Sound {
  ctx: AudioContext | null = null;
  master!: GainNode; sfx!: GainNode; music!: GainNode; amb!: GainNode;
  noise!: AudioBuffer;
  eng: { osc: OscillatorNode; osc2: OscillatorNode; f: BiquadFilterNode; g: GainNode; trem: OscillatorNode; tg: GainNode } | null = null;
  siren: { osc: OscillatorNode; lfo: OscillatorNode; g: GainNode } | null = null;
  hum: { g: GainNode; f: BiquadFilterNode } | null = null;
  station: StationId = 'off';
  private next = 0; private beat = 0; private timer = 0;
  muted = false;

  start() {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain(); this.master.gain.value = 0.8; this.master.connect(ctx.destination);
    this.sfx = ctx.createGain(); this.sfx.gain.value = 0.7; this.sfx.connect(this.master);
    this.music = ctx.createGain(); this.music.gain.value = 0.45; this.music.connect(this.master);
    this.amb = ctx.createGain(); this.amb.gain.value = 0.5; this.amb.connect(this.master);
    const n = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    // city hum: low rumble of a hundred engines
    const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220;
    const g = ctx.createGain(); g.gain.value = 0.0;
    src.connect(f).connect(g).connect(this.amb); src.start();
    this.hum = { g, f };
    this.timer = window.setInterval(() => this.schedule(), 60);
  }
  stop() {
    window.clearInterval(this.timer);
    void this.ctx?.close();
    this.ctx = null; this.eng = null; this.siren = null; this.hum = null;
  }
  setMuted(m: boolean) { this.muted = m; if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05); }

  // ---------------------------------------------------------------- engine
  engine(kind: 'none' | 'two' | 'auto' | 'car' | 'bus', rpm: number, throttle: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    if (kind === 'none') { if (this.eng) this.eng.g.gain.setTargetAtTime(0, ctx.currentTime, 0.1); return; }
    if (!this.eng) {
      const osc = ctx.createOscillator(), osc2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      const trem = ctx.createOscillator(), tg = ctx.createGain();
      osc.type = 'sawtooth'; osc2.type = 'square'; f.type = 'lowpass'; f.Q.value = 2;
      g.gain.value = 0; tg.gain.value = 0.3; trem.frequency.value = 18;
      const og = ctx.createGain(); og.gain.value = 0.5;
      osc.connect(f); osc2.connect(og).connect(f); f.connect(g).connect(this.sfx);
      trem.connect(tg).connect(g.gain);
      osc.start(); osc2.start(); trem.start();
      this.eng = { osc, osc2, f, g, trem, tg };
    }
    const e = this.eng, t = ctx.currentTime;
    const base = kind === 'two' ? 34 : kind === 'auto' ? 24 : kind === 'bus' ? 18 : 30;
    const span = kind === 'two' ? 110 : kind === 'auto' ? 52 : kind === 'bus' ? 40 : 95;
    const fr = base + rpm * span;
    e.osc.frequency.setTargetAtTime(fr, t, 0.05);
    e.osc2.frequency.setTargetAtTime(fr * (kind === 'auto' ? 0.5 : 1.01), t, 0.05);
    e.f.frequency.setTargetAtTime(kind === 'two' ? 900 + rpm * 1400 : kind === 'auto' ? 500 + rpm * 700 : 300 + rpm * 900, t, 0.05);
    e.trem.frequency.setTargetAtTime(kind === 'auto' ? 9 + rpm * 14 : fr / 2, t, 0.05);
    e.tg.gain.setTargetAtTime(kind === 'auto' ? 0.06 : 0.015, t, 0.1);
    e.g.gain.setTargetAtTime((kind === 'bus' ? 0.08 : 0.055) * (0.55 + throttle * 0.45), t, 0.08);
  }

  sirenOn(on: boolean, near: number) {
    const ctx = this.ctx; if (!ctx) return;
    if (!this.siren) {
      const osc = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = 900; lfo.frequency.value = 0.45; lg.gain.value = 320;
      lfo.connect(lg).connect(osc.frequency); osc.connect(g).connect(this.sfx); g.gain.value = 0;
      osc.start(); lfo.start();
      this.siren = { osc, lfo, g };
    }
    this.siren.g.gain.setTargetAtTime(on ? 0.05 * near : 0, ctx.currentTime, 0.2);
  }

  cityHum(level: number) { if (this.ctx && this.hum) this.hum.g.gain.setTargetAtTime(0.05 + level * 0.12, this.ctx.currentTime, 0.5); }

  // ---------------------------------------------------------------- one-shots
  private tone(f: number, dur: number, type: OscillatorType, vol: number, when = 0, out?: AudioNode, pan = 0) {
    const ctx = this.ctx!; const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.setValueAtTime(vol, t + dur - 0.03); g.gain.linearRampToValueAtTime(0, t + dur);
    let node: AudioNode = g;
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); node = p; }
    o.connect(g); node.connect(out ?? this.sfx);
    o.start(t); o.stop(t + dur + 0.02);
  }
  private burst(dur: number, freq: number, vol: number, type: BiquadFilterType = 'lowpass', when = 0, out?: AudioNode, q = 1) {
    const ctx = this.ctx!; const t = ctx.currentTime + when;
    const s = ctx.createBufferSource(); s.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(out ?? this.sfx);
    s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  /** kind 0 two-wheeler peep, 1 car, 2 bus/truck. */
  horn(kind: number, dist: number, pan = 0) {
    if (!this.ctx) return;
    const v = Math.max(0, 1 - dist / 160) ** 1.5 * 0.09;
    if (v < 0.003) return;
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const w = i * (kind === 2 ? 0.45 : 0.22);
      if (kind === 0) this.tone(430 + Math.random() * 60, 0.16, 'square', v * 0.6, w, undefined, pan);
      else if (kind === 1) { this.tone(392, 0.2, 'square', v * 0.5, w, undefined, pan); this.tone(494, 0.2, 'square', v * 0.45, w, undefined, pan); }
      else { this.tone(233, 0.38, 'sawtooth', v * 0.5, w, undefined, pan); this.tone(294, 0.38, 'sawtooth', v * 0.4, w, undefined, pan); }
    }
  }
  playerHorn(kind: number) { if (this.ctx) { if (kind === 0) this.tone(450, 0.25, 'square', 0.07); else if (kind === 2) { this.tone(233, 0.5, 'sawtooth', 0.07); this.tone(294, 0.5, 'sawtooth', 0.06); } else { this.tone(392, 0.3, 'square', 0.06); this.tone(494, 0.3, 'square', 0.05); } } }
  crash(power: number) { if (this.ctx) { this.burst(0.4, 900, Math.min(0.5, 0.1 + power * 0.03)); this.burst(0.15, 3000, Math.min(0.2, power * 0.02), 'highpass'); } }
  thud() { if (this.ctx) this.burst(0.18, 300, 0.25); }
  coin() { if (this.ctx) { this.tone(988, 0.08, 'square', 0.05); this.tone(1319, 0.2, 'square', 0.05, 0.08); } }
  fail() { if (this.ctx) { this.tone(330, 0.25, 'sawtooth', 0.06); this.tone(247, 0.5, 'sawtooth', 0.06, 0.25); } }
  pass() { if (this.ctx) [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.08, i * 0.11)); }
  bell() { if (this.ctx) { this.tone(1480, 1.6, 'sine', 0.05); this.tone(2220, 1.0, 'sine', 0.025); this.tone(740, 2.2, 'sine', 0.03); } }
  crow() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    for (let i = 0; i < 1 + Math.floor(Math.random() * 3); i++) {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 3;
      const s = t + i * 0.42;
      o.frequency.setValueAtTime(620, s); o.frequency.linearRampToValueAtTime(480, s + 0.28);
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(0.03, s + 0.03); g.gain.linearRampToValueAtTime(0, s + 0.3);
      o.connect(f).connect(g).connect(this.amb); o.start(s); o.stop(s + 0.32);
    }
  }
  cricket() { if (this.ctx) for (let i = 0; i < 6; i++) this.tone(4200 + Math.random() * 300, 0.03, 'sine', 0.008, i * 0.06, this.amb); }

  // ---------------------------------------------------------------- radio
  setStation(id: StationId) { this.station = id; this.beat = 0; if (this.ctx) this.next = this.ctx.currentTime + 0.1; }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || this.station === 'off') return;
    if (this.next < ctx.currentTime) this.next = ctx.currentTime + 0.05;
    while (this.next < ctx.currentTime + 0.25) {
      const st = this.station;
      const step = st === 'peth' ? 60 / 92 / 2 : st === 'dhol' ? 60 / (118 + Math.min(40, (this.beat / 64) * 8)) / 2 : 60 / 84 / 4;
      this.playStep(st, this.beat, this.next - ctx.currentTime, step);
      this.beat++;
      this.next += step;
    }
  }

  private drum(f0: number, f1: number, dur: number, vol: number, when: number) {
    const ctx = this.ctx!; const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.8);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.music); o.start(t); o.stop(t + dur + 0.02);
  }

  private playStep(st: StationId, b: number, when: number, step: number) {
    const SA = 277.18; // Sa on C#
    const r = (k: number) => SA * Math.pow(2, k / 12);
    if (st === 'peth') {
      // teentaal: 16 matras, two steps each
      const m = Math.floor(b / 2) % 16, half = b % 2;
      const bols = ['dha', 'dhin', 'dhin', 'dha', 'dha', 'dhin', 'dhin', 'dha', 'dha', 'tin', 'tin', 'ta', 'ta', 'dhin', 'dhin', 'dha'];
      if (!half) {
        const bol = bols[m];
        const bass = bol.startsWith('dh');
        this.drum(bass ? 110 : 160, bass ? 70 : 140, bass ? 0.45 : 0.2, bass ? 0.22 : 0.1, when);
        this.drum(bol.includes('in') ? 520 : 680, 480, 0.12, 0.09, when);
      } else if (Math.random() < 0.3) this.drum(700, 600, 0.06, 0.04, when);
      // tanpura: Pa Sa Sa Sa, every 4 matras
      if (b % 8 === 0) { const k = (b / 8) % 4; this.tone(k === 0 ? r(-5) : r(k === 3 ? -12 : 0), step * 7.5, 'sawtooth', 0.012, when, this.music); }
      // harmonium phrase in Yaman: N R G M' D N S'
      if (b % 2 === 0) {
        const yaman = [-1, 2, 4, 6, 7, 9, 11, 12, 14, 16];
        const phr = [0, 1, 2, 3, 2, 1, 0, -1, 4, 5, 6, 5, 4, 3, 2, 2];
        const k = phr[(b / 2) % 16] ?? 0;
        if (k >= 0 && Math.random() < 0.85) {
          const f = r(yaman[Math.max(0, Math.min(yaman.length - 1, k + Math.floor(b / 64) % 3))]);
          this.tone(f, step * 1.9, 'square', 0.018, when, this.music); this.tone(f * 2, step * 1.9, 'sawtooth', 0.006, when, this.music);
        }
      }
    } else if (st === 'dhol') {
      // dhol on the downbeats, tasha rolls on top, zanj marking time
      const k = b % 16;
      const dholPat = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0];
      if (dholPat[k]) { this.drum(85, 45, 0.5, 0.35, when); this.burst(0.08, 400, 0.12, 'lowpass', when, this.music); }
      if (k % 2 === 1 || (b % 64 > 48)) this.burst(0.06, 2400, 0.12, 'bandpass', when, this.music, 2);
      if (k % 4 === 0) this.burst(0.25, 7000, 0.06, 'highpass', when, this.music);
      if (b % 128 === 120) for (let i = 0; i < 8; i++) this.burst(0.05, 2600, 0.1, 'bandpass', when + i * step / 4, this.music, 2);
    } else if (st === 'kp') {
      const k = b % 16, bar = Math.floor(b / 16) % 4;
      if (k % 4 === 0) this.drum(120, 45, 0.3, 0.3, when);
      if (k % 8 === 4) this.burst(0.12, 1800, 0.08, 'bandpass', when, this.music, 0.8);
      if (k % 2 === 1) this.burst(0.04, 8000, 0.03, 'highpass', when, this.music);
      const chords = [[-3, 0, 4, 7], [-7, -3, 0, 5], [-12, -5, 0, 4], [-10, -5, -1, 2]];
      if (k === 0) for (const n of chords[bar]) this.tone(r(n - 12) * 0.5 * 2, step * 15, 'triangle', 0.012, when, this.music);
      if (k % 4 === 2) this.tone(r(chords[bar][0] - 24), step * 1.5, 'sine', 0.05, when, this.music);
    }
  }
}
