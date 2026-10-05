/**
 * The pond's sound, synthesised with Web Audio: the bamboo spout's trickle,
 * plips and splashes when things hit the water, the gulp of a koi at the
 * surface, rain, wind in the leaves, birds by day and crickets at night.
 */
export class PondAudio {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private noise!: AudioBuffer;
  private trickle!: GainNode;
  private rainG!: GainNode;
  private windG!: GainNode;
  private nightG!: GainNode;
  private birdT = 2;
  private cricketT = 0;
  on = false;
  night = 0;

  start() {
    if (this.ctx) { this.ctx.resume(); this.on = true; this.master.gain.setTargetAtTime(0.9, this.ctx.currentTime, 0.3); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain(); this.master.gain.value = 0; this.master.connect(ctx.destination);
    this.master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.4);
    // two seconds of pink-ish noise, looped wherever a bed is needed
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
    }
    const bed = (gain: number, type: BiquadFilterType, f: number, q: number) => {
      const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
      src.playbackRate.value = 0.8 + Math.random() * 0.4;
      const flt = ctx.createBiquadFilter(); flt.type = type; flt.frequency.value = f; flt.Q.value = q;
      const g = ctx.createGain(); g.gain.value = gain;
      src.connect(flt).connect(g).connect(this.master);
      src.start();
      return { g, flt };
    };
    // the spout: a band of bright noise with a fast flutter
    const tr = bed(0.12, 'bandpass', 2400, 0.7);
    this.trickle = tr.g;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 7.3;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.05; lfo.connect(lfoG).connect(tr.g.gain); lfo.start();
    bed(0.05, 'lowpass', 380, 0.5); // the low room tone of water
    this.rainG = bed(0, 'highpass', 1800, 0.4).g;
    const wind = bed(0, 'bandpass', 600, 0.6);
    this.windG = wind.g;
    this.nightG = ctx.createGain(); this.nightG.gain.value = 0; this.nightG.connect(this.master);
    this.on = true;
  }

  stop() { if (this.ctx) { this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2); this.on = false; } }

  /** A drop or pebble hitting the water; size 0..1. */
  plip(size = 0.3, pan = 0) {
    const ctx = this.ctx; if (!ctx || !this.on) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine';
    const f0 = 900 + (1 - size) * 1400 + Math.random() * 300;
    o.frequency.setValueAtTime(f0 * 0.6, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.6, t + 0.05 + size * 0.04);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12 * (0.4 + size), t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12 + size * 0.1);
    const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan));
    o.connect(g).connect(p).connect(this.master); o.start(t); o.stop(t + 0.3);
  }

  /** A stone going in: a thump, a burst of spray, then the plip of the cavity closing. */
  splash(size = 1, pan = 0) {
    const ctx = this.ctx; if (!ctx || !this.on) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = this.noise; src.playbackRate.value = 1.3;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(1800, t); f.frequency.exponentialRampToValueAtTime(500, t + 0.4); f.Q.value = 0.8;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * size, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6 + size * 0.3);
    const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan));
    src.connect(f).connect(g).connect(p).connect(this.master); src.start(t, Math.random()); src.stop(t + 1.2);
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.15);
    const og = ctx.createGain(); og.gain.setValueAtTime(0.35 * size, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(og).connect(p); o.start(t); o.stop(t + 0.25);
    window.setTimeout(() => this.plip(0.6, pan), 90 + Math.random() * 60);
  }

  gulp(pan = 0) {
    const ctx = this.ctx; if (!ctx || !this.on) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(320, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    o.connect(g).connect(p).connect(this.master); o.start(t); o.stop(t + 0.2);
  }

  private chirp() {
    const ctx = this.ctx!; const t = ctx.currentTime;
    const notes = 2 + Math.floor(Math.random() * 4);
    const base = 2600 + Math.random() * 1800;
    const p = ctx.createStereoPanner(); p.pan.value = Math.random() * 1.6 - 0.8; p.connect(this.master);
    for (let i = 0; i < notes; i++) {
      const t0 = t + i * (0.09 + Math.random() * 0.05);
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(base * (0.9 + Math.random() * 0.2), t0);
      o.frequency.exponentialRampToValueAtTime(base * (1.15 + Math.random() * 0.3), t0 + 0.06);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.035, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
      o.connect(g).connect(p); o.start(t0); o.stop(t0 + 0.1);
    }
  }

  private cricket() {
    const ctx = this.ctx!; const t = ctx.currentTime;
    const p = ctx.createStereoPanner(); p.pan.value = Math.random() * 1.6 - 0.8; p.connect(this.nightG);
    for (let i = 0; i < 3; i++) {
      const t0 = t + i * 0.06;
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 4300 + Math.random() * 300;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.03, t0 + 0.008); g.gain.linearRampToValueAtTime(0, t0 + 0.04);
      o.connect(g).connect(p); o.start(t0); o.stop(t0 + 0.05);
    }
  }

  /** Once per frame with the scene's state. */
  update(dt: number, s: { rain: number; wind: number; night: number }) {
    const ctx = this.ctx; if (!ctx || !this.on) return;
    const t = ctx.currentTime;
    this.rainG.gain.setTargetAtTime(s.rain * 0.22, t, 0.5);
    this.windG.gain.setTargetAtTime(0.01 + s.wind * 0.08, t, 0.8);
    this.nightG.gain.setTargetAtTime(s.night, t, 1);
    this.trickle.gain.setTargetAtTime(0.1, t, 0.5);
    this.birdT -= dt; this.cricketT -= dt;
    if (this.birdT <= 0) { this.birdT = 1.5 + Math.random() * 5; if (s.night < 0.5 && s.rain < 0.5) this.chirp(); }
    if (this.cricketT <= 0) { this.cricketT = 0.25 + Math.random() * 0.5; if (s.night > 0.3) this.cricket(); }
  }

  dispose() { this.ctx?.close(); this.ctx = null; }
}
