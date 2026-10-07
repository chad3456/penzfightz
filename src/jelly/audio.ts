/**
 * The noise Jellynoor makes. All of it is synthesised: there are no files.
 *
 * Nearly every sound in the village is a variation on one idea — a tone whose
 * pitch wobbles as it dies away, which is what a struck piece of jelly would
 * sound like if jelly rang. On top of that sit the birds in the morning, the
 * crickets at night, the stream when you are near it and the rain when it
 * comes over the ridge.
 */
import type * as THREE from 'three';
import type { Estate } from './chores';

type Ctx = AudioContext & { _unlocked?: boolean };

export class Sound {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private ambGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private streamGain: GainNode | null = null;
  private birdT = 0;
  private cricket: { osc: OscillatorNode; gain: GainNode } | null = null;
  muted = false;

  /** Browsers will not let us make a sound until the player has touched something. */
  resume() {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return;
    const c = new C() as Ctx;
    this.ctx = c;
    const m = c.createGain(); m.gain.value = this.muted ? 0 : 0.5; m.connect(c.destination);
    this.master = m;

    // the hill: a soft bed of wind
    const amb = c.createGain(); amb.gain.value = 0.0; amb.connect(m);
    this.ambGain = amb;
    const wind = c.createBufferSource();
    wind.buffer = this.noiseBuffer(c, 3);
    wind.loop = true;
    const wf = c.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 420; wf.Q.value = 0.6;
    wind.connect(wf).connect(amb); wind.start();

    // the stream, louder as you come down to it
    const sg = c.createGain(); sg.gain.value = 0; sg.connect(m);
    this.streamGain = sg;
    const w2 = c.createBufferSource(); w2.buffer = this.noiseBuffer(c, 3); w2.loop = true;
    const sf = c.createBiquadFilter(); sf.type = 'bandpass'; sf.frequency.value = 1600; sf.Q.value = 0.7;
    w2.connect(sf).connect(sg); w2.start();

    // rain
    const rg = c.createGain(); rg.gain.value = 0; rg.connect(m);
    this.rainGain = rg;
    const w3 = c.createBufferSource(); w3.buffer = this.noiseBuffer(c, 3); w3.loop = true;
    const rf = c.createBiquadFilter(); rf.type = 'highpass'; rf.frequency.value = 900;
    w3.connect(rf).connect(rg); w3.start();

    // crickets, only after dark
    const co = c.createOscillator(); co.type = 'triangle'; co.frequency.value = 4300;
    const cg = c.createGain(); cg.gain.value = 0;
    co.connect(cg).connect(m); co.start();
    this.cricket = { osc: co, gain: cg };
  }

  private noiseBuffer(c: AudioContext, secs: number) {
    const len = Math.floor(c.sampleRate * secs);
    const b = c.createBuffer(1, len, c.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = 0.96 * last + 0.04 * w; d[i] = last * 2.4; }
    return b;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.1);
  }

  /**
   * The wobble note: a tone that bends as it fades. Every chore is one of
   * these with the knobs in a different place.
   */
  private boing(freq: number, dur: number, o: { type?: OscillatorType; gain?: number; bend?: number; wobble?: number; delay?: number } = {}) {
    const c = this.ctx, m = this.master;
    if (!c || !m) return;
    const t0 = c.currentTime + (o.delay ?? 0);
    const osc = c.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * (o.bend ?? 0.55)), t0 + dur);

    // the wobble itself: a fast vibrato that dies with the note
    if (o.wobble !== 0) {
      const lfo = c.createOscillator(); lfo.frequency.value = 13;
      const lg = c.createGain(); lg.gain.setValueAtTime(freq * (o.wobble ?? 0.18), t0);
      lg.gain.exponentialRampToValueAtTime(0.01, t0 + dur);
      lfo.connect(lg).connect(osc.frequency);
      lfo.start(t0); lfo.stop(t0 + dur + 0.05);
    }
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.gain ?? 0.22, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(m);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  /** A short burst of filtered noise: scissors, a broom, a chop. */
  private hiss(dur: number, freq: number, gain = 0.14, type: BiquadFilterType = 'bandpass', delay = 0) {
    const c = this.ctx, m = this.master;
    if (!c || !m) return;
    const t0 = c.currentTime + delay;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuffer(c, 0.4);
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = 1.2;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f).connect(g).connect(m);
    s.start(t0); s.stop(t0 + dur + 0.05);
  }

  play(name: string) {
    if (!this.ctx) return;
    const r = (a: number, b: number) => a + Math.random() * (b - a);
    switch (name) {
      case 'hop': this.boing(r(360, 420), 0.26, { gain: 0.2, bend: 2.0, wobble: 0.1 }); break;
      case 'land': this.boing(r(150, 190), 0.4, { gain: 0.26, bend: 0.35, wobble: 0.3 }); break;
      case 'pluck': this.boing(r(620, 760), 0.16, { gain: 0.16, bend: 1.5, wobble: 0.25 }); this.hiss(0.08, 3200, 0.07); break;
      case 'plant': this.boing(r(200, 250), 0.3, { gain: 0.2, bend: 0.5 }); this.hiss(0.16, 700, 0.1, 'lowpass'); break;
      case 'pull': this.hiss(0.22, 1800, 0.13); this.boing(300, 0.18, { gain: 0.1, bend: 0.6 }); break;
      case 'water': this.hiss(0.5, 2600, 0.12, 'bandpass'); this.boing(520, 0.3, { gain: 0.06, bend: 0.7, wobble: 0.4 }); break;
      case 'snip': this.hiss(0.05, 5200, 0.16); this.hiss(0.05, 4600, 0.14, 'bandpass', 0.09); break;
      case 'pick': this.boing(r(500, 600), 0.14, { gain: 0.15, bend: 1.4 }); break;
      case 'weigh': this.boing(280, 0.5, { gain: 0.2, bend: 0.6, wobble: 0.35, type: 'triangle' }); this.boing(560, 0.4, { gain: 0.08, delay: 0.06 }); break;
      case 'spread': this.hiss(0.4, 1400, 0.12); break;
      case 'roll': this.boing(120, 0.7, { gain: 0.18, bend: 0.9, wobble: 0.5, type: 'sawtooth' }); break;
      case 'fire': this.hiss(0.7, 600, 0.14, 'lowpass'); this.boing(90, 0.6, { gain: 0.12, bend: 1.3 }); break;
      case 'pack': [0, 0.11, 0.23].forEach((d, i) => this.boing(420 + i * 110, 0.2, { gain: 0.17, bend: 1.3, delay: d })); break;
      case 'milk': [0, 0.17, 0.33].forEach((d) => this.boing(r(700, 900), 0.1, { gain: 0.1, bend: 0.5, delay: d })); break;
      case 'moo': this.boing(150, 0.9, { gain: 0.24, bend: 0.75, wobble: 0.12, type: 'sawtooth' }); break;
      case 'cluck': for (let i = 0; i < 4; i++) this.boing(r(800, 1200), 0.06, { gain: 0.1, bend: 0.5, delay: i * 0.09 }); break;
      case 'boil': this.hiss(1.2, 900, 0.1, 'bandpass'); for (let i = 0; i < 6; i++) this.boing(r(300, 500), 0.08, { gain: 0.05, bend: 2, delay: i * 0.17 }); break;
      case 'pour': this.hiss(0.45, 2200, 0.12); this.boing(600, 0.4, { gain: 0.07, bend: 1.6, wobble: 0.3 }); break;
      case 'chop': this.hiss(0.09, 900, 0.2, 'lowpass'); this.boing(r(170, 210), 0.45, { gain: 0.24, bend: 0.4, wobble: 0.45 }); break;
      case 'wood': [0, 0.09, 0.19].forEach((d) => this.boing(r(180, 260), 0.18, { gain: 0.14, bend: 0.5, delay: d })); break;
      case 'cloth': this.hiss(0.3, 2400, 0.1, 'highpass'); break;
      case 'sweep': [0, 0.26, 0.52].forEach((d) => this.hiss(0.22, 1700, 0.11, 'bandpass', d)); break;
      case 'light': this.hiss(0.14, 3000, 0.1); this.boing(900, 0.25, { gain: 0.08, bend: 1.4 }); break;
      case 'bell': [0, 0.012].forEach((d, i) => this.boing(i ? 1320 : 880, 2.6, { gain: i ? 0.08 : 0.2, bend: 0.97, wobble: 0.02, type: 'triangle', delay: d })); break;
      case 'sleep': this.boing(220, 1.4, { gain: 0.16, bend: 0.4, wobble: 0.25, type: 'triangle' }); break;
      default: this.boing(400, 0.2, { gain: 0.14 });
    }
  }

  /** The ambience, mixed by where you are standing and what time it is. */
  listen(cam: THREE.Vector3, estate: Estate, night: number) {
    const c = this.ctx;
    if (!c || !this.ambGain || !this.streamGain || !this.cricket) return;
    const t = c.currentTime;
    // wind picks up with height
    this.ambGain.gain.setTargetAtTime(0.035 + Math.max(0, cam.y - 8) * 0.0022, t, 0.6);
    // the stream, by distance
    const d = Math.hypot(cam.x - 0, cam.z - 20);
    this.streamGain.gain.setTargetAtTime(Math.max(0, 0.07 * (1 - d / 46)), t, 0.6);
    // crickets after dark, chirping in bursts
    const on = night > 0.3;
    this.cricket.gain.gain.setTargetAtTime(on && (Math.sin(t * 9) > 0.4) ? 0.012 : 0, t, 0.05);

    // birds in the morning
    if (!estate.raining && estate.clock > 5.6 && estate.clock < 10.5) {
      this.birdT -= 1 / 60;
      if (this.birdT <= 0) {
        this.birdT = 1.6 + Math.random() * 4;
        const f = 1700 + Math.random() * 1400;
        for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++)
          this.boing(f * (1 + i * 0.12), 0.07, { gain: 0.045, bend: 1.5, wobble: 0.3, type: 'sine', delay: i * 0.1 });
      }
    }
  }

  rain(on: boolean) {
    if (!this.ctx || !this.rainGain) return;
    this.rainGain.gain.setTargetAtTime(on ? 0.075 : 0, this.ctx.currentTime, 1.2);
  }

  stop() {
    if (!this.ctx) return;
    void this.ctx.close();
    this.ctx = null;
  }
}
