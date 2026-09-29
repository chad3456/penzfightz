/**
 * Sound, made on the spot with WebAudio: nothing is recorded.
 *
 *  - Nova Pacifica: an airy chord that breathes, wind, and the tick of
 *    insects that are not insects.
 *  - 1989: waves on Long Island Sound; in the first visit, a dance thumping
 *    through a gym wall.
 *  - 1905: fire crackle, a slow pentatonic pluck, and a gong far off.
 *
 * Plus the sounds of the hands: scraping, a chime, a held breath.
 */

type Bed = 'nova' | 'dance' | 'sea' | 'hk' | 'none';

export class Sound {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private beds: Record<Exclude<Bed, 'none'>, GainNode> = {} as never;
  private noise!: AudioBuffer;
  private timer = 0;
  private bed: Bed = 'none';
  private scrapeGain: GainNode | null = null;
  private breathGain: GainNode | null = null;
  muted = false;

  start() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const c = (this.ctx = new AC());
    this.master = c.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    const comp = c.createDynamicsCompressor();
    this.master.connect(comp).connect(c.destination);
    // a second of white noise, reused everywhere
    this.noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    for (const k of ['nova', 'dance', 'sea', 'hk'] as const) { const g = c.createGain(); g.gain.value = 0; g.connect(this.master); this.beds[k] = g; }
    this.buildNova(); this.buildSea(); this.buildHk();
    // hands
    const sc = this.loopNoise(2400, 'bandpass', 1.4); this.scrapeGain = c.createGain(); this.scrapeGain.gain.value = 0; sc.connect(this.scrapeGain).connect(this.master);
    const br = this.loopNoise(600, 'lowpass', 0.7); this.breathGain = c.createGain(); this.breathGain.gain.value = 0; br.connect(this.breathGain).connect(this.master);
    this.timer = window.setInterval(() => this.tick(), 125);
    this.setBed(this.bed);
  }

  private loopNoise(freq: number, type: BiquadFilterType, q: number) {
    const c = this.ctx!;
    const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    s.connect(f); s.start();
    return f;
  }

  private buildNova() {
    const c = this.ctx!, out = this.beds.nova;
    for (const [f, g] of [[196, 0.05], [293.66, 0.04], [392, 0.035], [493.88, 0.025], [587.33, 0.02]] as [number, number][]) {
      for (const det of [-3, 3]) {
        const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.detune.value = det;
        const gg = c.createGain(); gg.gain.value = g;
        const lfo = c.createOscillator(); lfo.frequency.value = 0.05 + Math.random() * 0.08; const lg = c.createGain(); lg.gain.value = g * 0.8; lfo.connect(lg).connect(gg.gain); lfo.start();
        o.connect(gg).connect(out); o.start();
      }
    }
    const wind = this.loopNoise(500, 'bandpass', 0.6); const wg = c.createGain(); wg.gain.value = 0.05; wind.connect(wg).connect(out);
    const lfo = c.createOscillator(); lfo.frequency.value = 0.07; const lg = c.createGain(); lg.gain.value = 0.04; lfo.connect(lg).connect(wg.gain); lfo.start();
  }

  private buildSea() {
    const c = this.ctx!;
    for (const k of ['sea', 'dance'] as const) {
      const w = this.loopNoise(420, 'lowpass', 0.5); const wg = c.createGain(); wg.gain.value = k === 'sea' ? 0.22 : 0.08; w.connect(wg).connect(this.beds[k]);
      const lfo = c.createOscillator(); lfo.frequency.value = 0.11; const lg = c.createGain(); lg.gain.value = k === 'sea' ? 0.18 : 0.06; lfo.connect(lg).connect(wg.gain); lfo.start();
    }
  }

  private buildHk() {
    const c = this.ctx!;
    const fire = this.loopNoise(900, 'highpass', 0.3); const fg = c.createGain(); fg.gain.value = 0.015; fire.connect(fg).connect(this.beds.hk);
  }

  private step = 0;
  private tick() {
    const c = this.ctx; if (!c) return;
    this.step++;
    const now = c.currentTime;
    if (this.bed === 'nova' && Math.random() < 0.18) this.blip(3800 + Math.random() * 2600, 0.03, 0.012, this.beds.nova, now);
    if (this.bed === 'dance' && this.step % 4 === 0) this.kick(now);
    if (this.bed === 'hk') {
      if (Math.random() < 0.3) this.crackle(now);
      if (this.step % 12 === 0 && Math.random() < 0.7) { const scale = [293.66, 329.63, 369.99, 440, 493.88, 587.33]; this.pluck(scale[Math.floor(Math.random() * scale.length)]!, now); }
      if (this.step % 96 === 0) this.gong(now);
    }
  }

  private env(g: GainNode, now: number, peak: number, a: number, d: number) {
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(peak, now + a); g.gain.exponentialRampToValueAtTime(0.0001, now + a + d);
  }
  private blip(f: number, d: number, peak: number, out: AudioNode, now: number) {
    const c = this.ctx!; const o = c.createOscillator(); o.frequency.value = f; const g = c.createGain(); this.env(g, now, peak, 0.005, d); o.connect(g).connect(out); o.start(now); o.stop(now + d + 0.05);
  }
  private kick(now: number) {
    const c = this.ctx!; const o = c.createOscillator(); o.frequency.setValueAtTime(110, now); o.frequency.exponentialRampToValueAtTime(40, now + 0.15);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180;
    const g = c.createGain(); this.env(g, now, 0.35, 0.005, 0.25); o.connect(f).connect(g).connect(this.beds.dance); o.start(now); o.stop(now + 0.3);
  }
  private crackle(now: number) {
    const c = this.ctx!; const s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2000 + Math.random() * 3000;
    const g = c.createGain(); this.env(g, now, 0.05, 0.002, 0.03); s.connect(f).connect(g).connect(this.beds.hk); s.start(now, Math.random()); s.stop(now + 0.05);
  }
  private pluck(f: number, now: number) {
    const c = this.ctx!; const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
    const g = c.createGain(); this.env(g, now, 0.07, 0.004, 1.6); o.connect(g).connect(this.beds.hk); o.start(now); o.stop(now + 1.8);
  }
  private gong(now: number) {
    const c = this.ctx!;
    for (const [f, a] of [[98, 0.12], [146.8, 0.06], [233, 0.04], [311, 0.03]] as [number, number][]) {
      const o = c.createOscillator(); o.frequency.value = f; const g = c.createGain(); this.env(g, now, a, 0.02, 7); o.connect(g).connect(this.beds.hk); o.start(now); o.stop(now + 7.2);
    }
  }

  /** Crossfade to the bed for a scene. */
  setBed(b: Bed) {
    this.bed = b;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const [k, g] of Object.entries(this.beds)) g.gain.setTargetAtTime(k === b ? 1 : 0, now, 1.2);
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.2);
  }

  scrape(k: number) {
    if (!this.ctx || !this.scrapeGain) return;
    const now = this.ctx.currentTime;
    this.scrapeGain.gain.cancelScheduledValues(now);
    this.scrapeGain.gain.setTargetAtTime(0.25 * k, now, 0.02);
    this.scrapeGain.gain.setTargetAtTime(0, now + 0.08, 0.06);
  }
  breath(on: boolean) {
    if (!this.ctx || !this.breathGain) return;
    this.breathGain.gain.setTargetAtTime(on ? 0.18 : 0, this.ctx.currentTime, on ? 0.4 : 0.15);
  }
  chime(f = 784) {
    const c = this.ctx; if (!c) return;
    const now = c.currentTime;
    for (const [m, a] of [[1, 0.12], [2.76, 0.04], [5.4, 0.02]] as [number, number][]) {
      const o = c.createOscillator(); o.frequency.value = f * m; const g = c.createGain(); this.env(g, now, a, 0.005, 2.2); o.connect(g).connect(this.master); o.start(now); o.stop(now + 2.4);
    }
  }
  thud() { if (this.ctx) this.kick(this.ctx.currentTime); }

  dispose() {
    clearInterval(this.timer);
    void this.ctx?.close();
    this.ctx = null;
  }
}

/** The narrator, if the reader wants one: the browser's own voice. */
export class Voice {
  on = false;
  private v: SpeechSynthesisVoice | null = null;
  constructor() {
    if (!('speechSynthesis' in window)) return;
    const pick = () => {
      const vs = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'));
      this.v = vs.find((v) => /Daniel|Serena|Google UK English Female|Samantha|Karen|Moira/.test(v.name)) ?? vs[0] ?? null;
    };
    pick();
    speechSynthesis.onvoiceschanged = pick;
  }
  say(text: string) {
    if (!this.on || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\n/g, ' '));
    if (this.v) u.voice = this.v;
    u.rate = 0.94; u.pitch = 0.98;
    speechSynthesis.speak(u);
  }
  stop() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
}
