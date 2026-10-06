/**
 * The sound of recitation: a tanpura drone (four strings, plucked by a
 * Karplus–Strong model with a buzzy bridge), a soft tick on each syllable —
 * long for heavy, short for light — and, where the device has a Hindi
 * voice, the verse spoken aloud.
 */

export class Recital {
  ctx: AudioContext | null = null;
  out!: GainNode;
  drone: AudioBufferSourceNode | null = null;
  droneGain!: GainNode;
  voice: SpeechSynthesisVoice | null = null;

  start() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.out = ctx.createGain(); this.out.gain.value = 0.8; this.out.connect(ctx.destination);
    this.droneGain = ctx.createGain(); this.droneGain.gain.value = 0; this.droneGain.connect(this.out);
    this.pickVoice();
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.onvoiceschanged = () => this.pickVoice();
  }
  private pickVoice() {
    if (typeof speechSynthesis === 'undefined') return;
    const vs = speechSynthesis.getVoices();
    this.voice = vs.find((v) => v.lang === 'hi-IN') ?? vs.find((v) => v.lang.startsWith('hi')) ?? vs.find((v) => v.lang.startsWith('mr') || v.lang.startsWith('sa')) ?? null;
  }
  get hasVoice() { return !!this.voice; }

  /** One tanpura cycle: Pa, Sa', Sa', Sa — rendered once, then looped. */
  private tanpura(ctx: AudioContext) {
    const sr = ctx.sampleRate, cycle = 4.8, n = Math.floor(sr * cycle);
    const buf = ctx.createBuffer(2, n, sr);
    const L = buf.getChannelData(0), Rt = buf.getChannelData(1);
    const SA = 138.59; // C#3
    const notes = [SA * 1.5, SA * 2, SA * 2, SA]; // Pa, Sa', Sa', Sa
    notes.forEach((f, k) => {
      const start = Math.floor(k * cycle / 4 * sr);
      const period = Math.round(sr / f);
      const ring = new Float32Array(period);
      for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
      let idx = 0;
      const len = n - start + Math.floor(sr * 3);
      for (let i = 0; i < len; i++) {
        const a = ring[idx], b = ring[(idx + 1) % period];
        const v = (a + b) * 0.4985;
        ring[idx] = v;
        idx = (idx + 1) % period;
        // jawari: a gentle buzz from the bridge
        const s = Math.tanh(v * 2.2) * 0.35 * Math.exp(-i / (sr * 3.5));
        const pos = (start + i) % n;
        const pan = k % 2 ? 0.6 : 0.4;
        L[pos] += s * (1 - pan); Rt[pos] += s * pan;
      }
    });
    return buf;
  }

  setDrone(on: boolean) {
    const ctx = this.ctx; if (!ctx) return;
    if (on && !this.drone) {
      const src = ctx.createBufferSource(); src.buffer = this.tanpura(ctx); src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2400;
      src.connect(f).connect(this.droneGain); src.start();
      this.drone = src;
    }
    this.droneGain.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 0.6);
  }

  tick(heavy: boolean) {
    const ctx = this.ctx; if (!ctx) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = heavy ? 277.18 : 415.3;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, t + (heavy ? 0.5 : 0.22));
    o.connect(g).connect(this.out); o.start(t); o.stop(t + 0.6);
  }

  speak(text: string, onEnd?: () => void) {
    if (typeof speechSynthesis === 'undefined' || !this.voice) { onEnd?.(); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = this.voice; u.lang = this.voice.lang; u.rate = 0.78; u.pitch = 0.95;
    u.onend = () => onEnd?.(); u.onerror = () => onEnd?.();
    speechSynthesis.speak(u);
  }
  hush() { if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); }
  stop() { this.hush(); void this.ctx?.close(); this.ctx = null; this.drone = null; }
}
