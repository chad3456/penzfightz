/**
 * Sound for the nights, all synthesised: water lapping at the granite, rain,
 * the distant bell striking eleven, and a slow, soft piano that brightens and
 * darkens with the story. Off until the reader turns it on.
 */

const SCALES: Record<string, number[]> = {
  // semitone offsets from A3; melancholy-sweet for most of it, warmer for the happy hours
  minor: [0, 2, 3, 5, 7, 8, 10, 12, 14, 15],
  major: [3, 5, 7, 8, 10, 12, 14, 15, 17, 19],
};

export class NightAudio {
  ctx: AudioContext | null = null;
  private out!: GainNode;
  private verb!: ConvolverNode;
  private waterG!: GainNode;
  private rainG!: GainNode;
  private noise!: AudioBuffer;
  private next = 0;
  private step = 0;
  on = false;
  mood: 'minor' | 'major' = 'minor';
  private lastBell = -1;

  start() {
    if (this.ctx) { this.ctx.resume(); this.out.gain.setTargetAtTime(0.8, this.ctx.currentTime, 0.5); this.on = true; return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    this.ctx = ctx;
    this.out = ctx.createGain(); this.out.gain.value = 0; this.out.connect(ctx.destination);
    this.out.gain.setTargetAtTime(0.8, ctx.currentTime, 0.8);
    // a generated hall: two seconds of decaying noise
    const len = ctx.sampleRate * 3.2;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    this.verb = ctx.createConvolver(); this.verb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.55;
    this.verb.connect(wet).connect(this.out);
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    let b = 0;
    for (let i = 0; i < d.length; i++) { b = 0.97 * b + (Math.random() * 2 - 1) * 0.12; d[i] = b; }
    const bed = (f: number, type: BiquadFilterType) => {
      const s = ctx.createBufferSource(); s.buffer = this.noise; s.loop = true;
      const flt = ctx.createBiquadFilter(); flt.type = type; flt.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = 0;
      s.connect(flt).connect(g).connect(this.out); s.start();
      return g;
    };
    this.waterG = bed(520, 'lowpass');
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.18;
    const lg = ctx.createGain(); lg.gain.value = 0.05; lfo.connect(lg).connect(this.waterG.gain); lfo.start();
    this.rainG = bed(2600, 'highpass');
    this.next = ctx.currentTime + 0.5;
    this.on = true;
  }

  stop() { if (this.ctx) { this.out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3); this.on = false; } }

  private note(semi: number, when: number, vel: number, len = 3.2) {
    const ctx = this.ctx!;
    const f = 220 * Math.pow(2, semi / 12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(0.11 * vel, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, when + len);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    for (const [mul, a] of [[1, 1], [2, 0.32], [3, 0.12], [4.01, 0.05]] as const) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * mul;
      const og = ctx.createGain(); og.gain.value = a;
      o.connect(og).connect(lp); o.start(when); o.stop(when + len);
    }
    lp.connect(g);
    g.connect(this.out); g.connect(this.verb);
  }

  bell(n: number) {
    const ctx = this.ctx; if (!ctx || !this.on) return;
    for (let k = 0; k < n; k++) {
      const when = ctx.currentTime + 0.4 + k * 1.6;
      for (const [mul, a, dec] of [[1, 1, 5], [2.76, 0.4, 3], [5.4, 0.2, 1.6], [0.5, 0.5, 6]] as const) {
        const o = ctx.createOscillator(); o.frequency.value = 196 * mul;
        const g = ctx.createGain(); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(0.05 * a, when + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, when + dec);
        o.connect(g); g.connect(this.verb); g.connect(this.out); o.start(when); o.stop(when + dec);
      }
    }
  }

  /** Called every frame with the story's state. */
  update(s: { rain: number; water: number; beat: number; bell: number; mood: 'minor' | 'major'; tempo: number }) {
    const ctx = this.ctx; if (!ctx || !this.on) return;
    const t = ctx.currentTime;
    this.waterG.gain.setTargetAtTime(0.12 * s.water, t, 0.8);
    this.rainG.gain.setTargetAtTime(0.16 * s.rain, t, 0.8);
    this.mood = s.mood;
    if (s.bell > 0.5 && this.lastBell !== s.beat) { this.lastBell = s.beat; this.bell(11); }
    // the piano: a slow, wandering line over a held low note, a phrase every few seconds
    while (this.next < t + 0.3) {
      const sc = SCALES[this.mood];
      const phrase = this.step % 16;
      if (phrase === 0) this.note(sc[0] - 12, this.next, 0.6, 6);
      if (phrase === 8) this.note(sc[3] - 12, this.next, 0.5, 6);
      if (Math.random() < 0.72) {
        const idx = Math.floor((Math.sin(this.step * 0.7) * 0.5 + 0.5) * (sc.length - 1) + (Math.random() - 0.5) * 2);
        this.note(sc[Math.max(0, Math.min(sc.length - 1, idx))], this.next, 0.45 + Math.random() * 0.35);
      }
      this.next += s.tempo * (Math.random() < 0.2 ? 2 : 1);
      this.step++;
    }
  }

  dispose() { this.ctx?.close(); this.ctx = null; }
}
