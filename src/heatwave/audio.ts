/**
 * The sound of it, synthesised: no audio files.
 *
 * Continuous voices — the engine (pitch with speed), the tyres (with drift),
 * and up to five sirens, each wailing at its own rate so that more cops
 * means more chaos — and one-shots made from noise and oscillators: knocks,
 * metal crunches, explosions, the close-call whoosh, score blips, the
 * wanted-level sting, and the end.
 */

export class Audio {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private engine!: { a: OscillatorNode; b: OscillatorNode; lp: BiquadFilterNode; g: GainNode };
  private tyres!: { g: GainNode; bp: BiquadFilterNode };
  private sirens: { osc: OscillatorNode; g: GainNode; pan: StereoPannerNode; rate: number; yelp: boolean; phase: number }[] = [];
  private noise!: AudioBuffer;
  muted = false;

  /** Must be called from a user gesture. */
  start() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.7;
    const comp = ctx.createDynamicsCompressor();
    this.master.connect(comp).connect(ctx.destination);
    // one second of noise, shared by everything that hisses
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // the engine: a saw and a square an octave apart, through a low-pass
    const a = ctx.createOscillator();
    const b = ctx.createOscillator();
    a.type = 'sawtooth';
    b.type = 'square';
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    const g = ctx.createGain();
    g.gain.value = 0;
    const bg = ctx.createGain();
    bg.gain.value = 0.4;
    a.connect(lp);
    b.connect(bg).connect(lp);
    lp.connect(g).connect(this.master);
    a.start();
    b.start();
    this.engine = { a, b, lp, g };
    // tyres: looped noise through a narrow band
    const tn = ctx.createBufferSource();
    tn.buffer = this.noise;
    tn.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1900;
    bp.Q.value = 6;
    const tg = ctx.createGain();
    tg.gain.value = 0;
    tn.connect(bp).connect(tg).connect(this.master);
    tn.start();
    this.tyres = { g: tg, bp };
    for (let i = 0; i < 5; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 2200;
      const sg = ctx.createGain();
      sg.gain.value = 0;
      const pan = ctx.createStereoPanner();
      osc.connect(f).connect(sg).connect(pan).connect(this.master);
      osc.start();
      this.sirens.push({ osc, g: sg, pan, rate: 0.35 + i * 0.13, yelp: i % 3 === 2, phase: i * 1.7 });
    }
  }

  suspend() { void this.ctx?.suspend(); }
  resume() { void this.ctx?.resume(); }
  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.05);
  }

  /** Called every frame. `cops` are pans (−1..1) and loudnesses (0..1) of the nearest few. */
  update(speed: number, drift: number, cops: { pan: number; near: number }[], chaos: number, alive: boolean) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const k = speed / 30;
    this.engine.a.frequency.setTargetAtTime(38 + k * 95, t, 0.05);
    this.engine.b.frequency.setTargetAtTime(19 + k * 47, t, 0.05);
    this.engine.lp.frequency.setTargetAtTime(350 + k * 1200, t, 0.05);
    this.engine.g.gain.setTargetAtTime(alive ? 0.05 + k * 0.06 : 0, t, 0.1);
    this.tyres.g.gain.setTargetAtTime(alive ? Math.min(0.14, drift * 0.02) : 0, t, 0.05);
    this.tyres.bp.frequency.setTargetAtTime(1600 + drift * 40, t, 0.1);
    this.sirens.forEach((s, i) => {
      const c = cops[i];
      if (!c) { s.g.gain.setTargetAtTime(0, t, 0.2); return; }
      // a wail goes up and down; a yelp goes fast; more heat, more of them, faster
      s.phase += (1 / 60) * s.rate * (1 + chaos * 0.8) * (s.yelp ? 5 : 1);
      const u = s.yelp ? (s.phase % 1) : 0.5 - 0.5 * Math.cos(s.phase * Math.PI * 2);
      s.osc.frequency.setTargetAtTime(620 + u * 620 + i * 23, t, 0.02);
      s.g.gain.setTargetAtTime(0.028 * c.near, t, 0.1);
      s.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, c.pan)), t, 0.1);
    });
  }

  private burst(dur: number, freq: number, q: number, gain: number, type: BiquadFilterType = 'lowpass') {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random() * 0.5, dur + 0.05);
  }
  private tone(freq: number, to: number, dur: number, gain: number, type: OscillatorType = 'sine', delay = 0) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const o = ctx.createOscillator();
    o.type = type;
    const g = ctx.createGain();
    const t = ctx.currentTime + delay;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  impact(strength: number) {
    const s = Math.min(1, strength / 30);
    this.burst(0.12 + s * 0.2, 900 + s * 1500, 0.7, 0.25 + s * 0.5);
    this.tone(120, 50, 0.15 + s * 0.15, 0.2 + s * 0.4, 'triangle');
    if (s > 0.4) this.burst(0.3, 3200, 3, 0.15 * s, 'bandpass');
  }
  crunch() {
    this.burst(0.35, 2600, 2.5, 0.35, 'bandpass');
    this.tone(200, 60, 0.3, 0.3, 'square');
  }
  explosion(big = 1) {
    this.burst(1.2 * big, 500, 0.6, 0.9);
    this.tone(90, 28, 0.9 * big, 0.8, 'sine');
    this.burst(0.5, 2400, 1.2, 0.25, 'bandpass');
  }
  whoosh() {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 2;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    f.frequency.setValueAtTime(400, t);
    f.frequency.exponentialRampToValueAtTime(3000, t + 0.25);
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, 0, 0.4);
  }
  score(level: number) {
    const base = 660 * Math.pow(2, Math.min(level, 4) / 6);
    this.tone(base, base * 1.02, 0.09, 0.18, 'square');
    this.tone(base * 1.5, base * 1.5, 0.12, 0.15, 'square', 0.07);
  }
  wanted() {
    for (let i = 0; i < 3; i++) this.tone(440 + i * 220, 440 + i * 220, 0.14, 0.2, 'sawtooth', i * 0.09);
  }
  busted() {
    this.tone(330, 110, 0.9, 0.35, 'sawtooth');
    this.tone(220, 70, 1.1, 0.3, 'square', 0.15);
  }
  thump() { this.tone(80, 40, 0.2, 0.5, 'sine'); }
}
