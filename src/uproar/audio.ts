/**
 * UPROAR's sound, all synthesised: a street drum line that gets louder and
 * busier as the crowd grows, the murmur of the crowd itself, a megaphone,
 * sirens that rise with the heat, and a bass line when a sound system is up.
 */

export class Sound {
  ctx: AudioContext | null = null;
  master!: GainNode;
  crowd!: GainNode;
  siren!: GainNode;
  sirenOsc!: OscillatorNode;
  noise!: AudioBuffer;
  muted = false;
  private beat = 0;
  private next = 0;
  private timer = 0;
  /** What the drum line should play: set by the game each frame. */
  mood = { crowd: 0, heat: 0, party: false, on: false };

  start() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;
    this.master = ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.7; this.master.connect(ctx.destination);
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // the crowd: brown-ish noise through a formant, always on, level follows the crowd
    const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'bandpass'; lp.frequency.value = 520; lp.Q.value = 0.7;
    this.crowd = ctx.createGain(); this.crowd.gain.value = 0;
    src.connect(lp).connect(this.crowd).connect(this.master); src.start();
    // a siren, two tones, level follows the heat
    this.sirenOsc = ctx.createOscillator(); this.sirenOsc.type = 'triangle'; this.sirenOsc.frequency.value = 700;
    const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 1.1;
    const lfoG = ctx.createGain(); lfoG.gain.value = 110;
    lfo.connect(lfoG).connect(this.sirenOsc.frequency);
    this.siren = ctx.createGain(); this.siren.gain.value = 0;
    this.sirenOsc.connect(this.siren).connect(this.master); this.sirenOsc.start(); lfo.start();
    this.next = ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 60);
  }

  setMuted(m: boolean) { this.muted = m; if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.05); }

  stop() { window.clearInterval(this.timer); void this.ctx?.close(); this.ctx = null; }

  /** Keep the levels in step with the game. */
  update() {
    const c = this.ctx; if (!c) return;
    const m = this.mood;
    this.crowd.gain.setTargetAtTime(m.on ? Math.min(0.22, 0.015 + Math.sqrt(m.crowd) * 0.016) : 0.01, c.currentTime, 0.4);
    this.siren.gain.setTargetAtTime(m.on && m.heat > 0.5 ? Math.min(0.05, m.heat * 0.011) : 0, c.currentTime, 0.5);
  }

  /** The drum line: a look-ahead scheduler, sixteenth notes. */
  private schedule() {
    const c = this.ctx; if (!c) return;
    const m = this.mood;
    const bpm = 96 + Math.min(40, m.crowd * 0.2) + (m.party ? 10 : 0);
    const sixteenth = 60 / bpm / 4;
    while (this.next < c.currentTime + 0.15) {
      const b = this.beat % 16, t = this.next;
      if (m.on) {
        const n = m.crowd;
        if (b % 4 === 0) this.kick(t, n > 5 || m.party ? 0.55 : 0.3);
        if ((b === 4 || b === 12) && n > 12) this.snare(t, 0.3);
        if (n > 30 && (b === 7 || b === 10 || b === 15)) this.snare(t, 0.14);
        if (n > 3 && b % 2 === 0) this.hat(t, 0.05 + Math.min(0.06, n * 0.001));
        if (m.party) { const notes = [55, 55, 65.4, 73.4]; if (b % 4 === 2) this.bass(t, notes[Math.floor(this.beat / 16) % 4]!, sixteenth * 2); }
        if (n > 60 && b === 14) this.clap(t, 0.2);
      }
      this.next += sixteenth;
      this.beat++;
    }
    this.update();
  }

  private env(t: number, peak: number, attack: number, decay: number) {
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    g.connect(this.master);
    return g;
  }
  private noiseAt(t: number, dur: number, type: BiquadFilterType, freq: number, peak: number, q = 1) {
    const c = this.ctx!;
    const s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    s.connect(f).connect(this.env(t, peak, 0.003, dur));
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }
  kick(t: number, v: number) {
    const c = this.ctx!, o = c.createOscillator();
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    o.connect(this.env(t, v, 0.004, 0.22)); o.start(t); o.stop(t + 0.3);
  }
  snare(t: number, v: number) { this.noiseAt(t, 0.14, 'bandpass', 1900, v, 0.8); }
  hat(t: number, v: number) { this.noiseAt(t, 0.04, 'highpass', 7000, v); }
  clap(t: number, v: number) { for (let k = 0; k < 3; k++) this.noiseAt(t + k * 0.012, 0.08, 'bandpass', 1200, v, 1.5); }
  bass(t: number, f: number, dur: number) {
    const c = this.ctx!, o = c.createOscillator(), lp = c.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 420;
    o.connect(lp).connect(this.env(t, 0.22, 0.01, dur)); o.start(t); o.stop(t + dur + 0.05);
  }

  /** One-off effects. */
  sfx(kind: 'chant' | 'join' | 'party' | 'mural' | 'balls' | 'holi' | 'umbrella' | 'pizza' | 'bad' | 'capture' | 'honk' | 'no') {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + 0.01;
    const tone = (f: number, at: number, dur: number, type: OscillatorType = 'square', v = 0.12, to?: number) => {
      const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, at);
      if (to) o.frequency.exponentialRampToValueAtTime(to, at + dur);
      o.connect(this.env(at, v, 0.01, dur)); o.start(at); o.stop(at + dur + 0.05);
    };
    switch (kind) {
      case 'chant': {
        // the megaphone: a buzzy "hey! hey!" through a narrow band, and the crowd's answer
        for (const [k, f] of [[0, 330], [0.22, 392]] as const) {
          const o = c.createOscillator(), bp = c.createBiquadFilter(), g = this.env(t + k, 0.2, 0.02, 0.16);
          o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t + k); o.frequency.linearRampToValueAtTime(f * 0.92, t + k + 0.16);
          bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 3;
          o.connect(bp).connect(g); o.start(t + k); o.stop(t + k + 0.25);
        }
        this.noiseAt(t + 0.5, 0.35, 'bandpass', 700, Math.min(0.35, 0.06 + this.mood.crowd * 0.003), 2);
        break;
      }
      case 'join': tone(660, t, 0.08, 'triangle', 0.08, 990); break;
      case 'party': [0, 0.1, 0.2, 0.3].forEach((k, i) => tone([262, 330, 392, 523][i]!, t + k, 0.12, 'square', 0.08)); this.kick(t, 0.6); break;
      case 'mural': this.noiseAt(t, 0.5, 'highpass', 3500, 0.2); this.noiseAt(t + 0.55, 0.3, 'highpass', 3000, 0.15); break;
      case 'balls': [0, 0.12, 0.24].forEach((k) => tone(200, t + k, 0.15, 'sine', 0.25, 90)); break;
      case 'holi': this.noiseAt(t, 1.0, 'lowpass', 900, 0.3); tone(880, t, 0.5, 'sine', 0.06, 1760); break;
      case 'umbrella': [0, 0.06, 0.12, 0.18, 0.24].forEach((k) => this.noiseAt(t + k, 0.06, 'bandpass', 2500, 0.18, 2)); break;
      case 'pizza': tone(523, t, 0.1, 'triangle', 0.1); tone(784, t + 0.1, 0.16, 'triangle', 0.1); break;
      case 'bad': tone(300, t, 0.25, 'sawtooth', 0.08, 150); break;
      case 'capture': [0, 0.14, 0.28, 0.42].forEach((k, i) => tone([392, 523, 659, 784][i]!, t + k, 0.3, 'square', 0.09)); this.noiseAt(t + 0.5, 1.2, 'lowpass', 1200, 0.3); break;
      case 'honk': tone(392, t, 0.18, 'square', 0.05); tone(370, t, 0.18, 'square', 0.05); break;
      case 'no': tone(160, t, 0.12, 'square', 0.06); break;
    }
  }
}
