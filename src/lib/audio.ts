/**
 * Every sound in this game is generated on the fly.
 *
 * There are no audio files: the corridor noise, the shouting, the bell and the
 * clack of two barrels meeting are all built out of oscillators and filtered
 * noise. That keeps the bundle honest and lets the ambience react to the match
 * — the class gets loud when a pen goes over the edge.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambienceGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let ambienceRunning = false;
let noiseBuffer: AudioBuffer | null = null;
let ambienceTimer: number | null = null;

const state = {
  muted: false,
  ambienceLevel: 0.85,
  sfxLevel: 1.0,
};

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = state.muted ? 0 : 1;
    master.connect(ctx.destination);

    ambienceGain = ctx.createGain();
    ambienceGain.gain.value = state.ambienceLevel;
    ambienceGain.connect(master);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = state.sfxLevel;
    sfxGain.connect(master);
  }
  return ctx;
}

function noise(): AudioBuffer {
  const c = ac()!;
  if (!noiseBuffer) {
    const len = c.sampleRate * 2;
    noiseBuffer = c.createBuffer(1, len, c.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function noiseSource(loop = false) {
  const c = ac()!;
  const src = c.createBufferSource();
  src.buffer = noise();
  src.loop = loop;
  return src;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

// ------------------------------------------------------------------ voices

/**
 * A child's shout, roughly.
 *
 * Two formant band-passes over a sawtooth with a wandering pitch gives the
 * vowel-ish "aaaay" of a corridor at lunch. Twenty of these at random offsets
 * and low gain is indistinguishable from a hundred kids two rooms away.
 */
function shout(when: number, opts?: { close?: boolean }) {
  const c = ac();
  if (!c || !ambienceGain) return;
  const close = opts?.close ?? false;
  const dur = rand(0.25, 0.75);
  const f0 = rand(230, 420);

  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(f0, when);
  osc.frequency.linearRampToValueAtTime(f0 * rand(0.75, 1.4), when + dur);

  const vibrato = c.createOscillator();
  vibrato.frequency.value = rand(4, 8);
  const vibratoGain = c.createGain();
  vibratoGain.gain.value = f0 * 0.03;
  vibrato.connect(vibratoGain).connect(osc.frequency);

  // two vowel formants
  const f1 = c.createBiquadFilter();
  f1.type = 'bandpass';
  f1.frequency.value = rand(600, 950);
  f1.Q.value = 6;
  const f2 = c.createBiquadFilter();
  f2.type = 'bandpass';
  f2.frequency.value = rand(1400, 2400);
  f2.Q.value = 8;

  const g = c.createGain();
  const peak = (close ? 0.12 : 0.04) * rand(0.6, 1.3);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(peak, when + dur * 0.18);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);

  const pan = c.createStereoPanner();
  pan.pan.value = rand(-0.9, 0.9);

  osc.connect(f1).connect(g);
  osc.connect(f2).connect(g);
  g.connect(pan).connect(ambienceGain);

  osc.start(when);
  vibrato.start(when);
  osc.stop(when + dur + 0.05);
  vibrato.stop(when + dur + 0.05);
}

/** A short burst of many voices — the roar when something happens. */
function crowdSwell(strength = 1) {
  const c = ac();
  if (!c) return;
  const now = c.currentTime;
  const n = Math.round(6 + strength * 10);
  for (let i = 0; i < n; i++) shout(now + rand(0, 0.5), { close: i < 3 });
}

/** The corridor bed: filtered noise that breathes. */
function startBed() {
  const c = ac();
  if (!c || !ambienceGain) return;

  const src = noiseSource(true);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 780;
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 140;
  const g = c.createGain();
  g.gain.value = 0.075;

  // slow swell so it never sits still
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.06;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 0.035;
  lfo.connect(lfoGain).connect(g.gain);

  src.connect(hp).connect(lp).connect(g).connect(ambienceGain);
  src.start();
  lfo.start();

  // a ceiling fan, always
  const fan = noiseSource(true);
  const fanBp = c.createBiquadFilter();
  fanBp.type = 'bandpass';
  fanBp.frequency.value = 190;
  fanBp.Q.value = 1.6;
  const fanG = c.createGain();
  fanG.gain.value = 0.045;
  const chop = c.createOscillator();
  chop.type = 'sine';
  chop.frequency.value = 4.6;
  const chopG = c.createGain();
  chopG.gain.value = 0.024;
  chop.connect(chopG).connect(fanG.gain);
  fan.connect(fanBp).connect(fanG).connect(ambienceGain);
  fan.start();
  chop.start();
}

function scheduleChatter() {
  const c = ac();
  if (!c) return;
  const now = c.currentTime;
  const burst = Math.random() < 0.25 ? rand(3, 7) : rand(1, 3);
  for (let i = 0; i < burst; i++) shout(now + rand(0, 2.4), { close: Math.random() < 0.12 });
  ambienceTimer = window.setTimeout(scheduleChatter, rand(1600, 3600));
}

// ------------------------------------------------------------------ sfx

function ping(freq: number, dur: number, gain: number, type: OscillatorType = 'sine', when = 0) {
  const c = ac();
  if (!c || !sfxGain) return;
  const t = c.currentTime + when;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(sfxGain);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function burst(opts: {
  freq: number;
  q: number;
  dur: number;
  gain: number;
  when?: number;
  type?: BiquadFilterType;
}) {
  const c = ac();
  if (!c || !sfxGain) return;
  const t = c.currentTime + (opts.when ?? 0);
  const src = noiseSource();
  const f = c.createBiquadFilter();
  f.type = opts.type ?? 'bandpass';
  f.frequency.value = opts.freq;
  f.Q.value = opts.q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(opts.gain, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
  src.connect(f).connect(g).connect(sfxGain);
  src.start(t);
  src.stop(t + opts.dur + 0.05);
}

let lastClack = 0;

export const sfx = {
  /** Two plastic barrels meeting. Pitch and bite scale with the impact. */
  clack(speed: number) {
    const c = ac();
    if (!c) return;
    const now = c.currentTime;
    if (now - lastClack < 0.035) return; // rapier can report a flurry
    lastClack = now;
    const v = Math.min(1, speed / 2.4);
    if (v < 0.04) return;
    burst({ freq: 1500 + v * 2200, q: 3.5, dur: 0.05 + v * 0.05, gain: 0.12 + v * 0.5 });
    ping(320 + v * 260, 0.07, 0.07 + v * 0.16, 'triangle');
  },

  /** The flick itself: nail on plastic, then a scrape across the desk. */
  flick(power: number) {
    burst({ freq: 2600, q: 2, dur: 0.035, gain: 0.2 + power * 0.34 });
    burst({ freq: 420 + power * 500, q: 1.1, dur: 0.16 + power * 0.22, gain: 0.07 + power * 0.12, type: 'lowpass' });
  },

  /** Fingertip settling on the barrel before a shot. */
  pickup() {
    burst({ freq: 1800, q: 1.4, dur: 0.02, gain: 0.1 });
  },

  /** A pen going over the edge and hitting a mosaic floor. */
  clatter() {
    const bounces = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < bounces; i++) {
      const when = 0.12 + i * rand(0.055, 0.13);
      burst({ freq: 2000 + Math.random() * 2600, q: 4, dur: 0.05, gain: 0.3 / (1 + i * 0.7), when });
      ping(180 + Math.random() * 200, 0.06, 0.1 / (1 + i), 'triangle', when);
    }
  },

  /** A point landed. The class reacts. */
  point(mine: boolean) {
    crowdSwell(mine ? 1 : 0.5);
    if (mine) {
      ping(660, 0.14, 0.18, 'triangle');
      ping(880, 0.2, 0.16, 'triangle', 0.09);
    } else {
      ping(330, 0.2, 0.13, 'sine');
    }
  },

  /** Match over. Somebody just lost a pen for real. */
  matchEnd(won: boolean) {
    crowdSwell(1.4);
    const notes = won ? [523, 659, 784, 1047] : [494, 440, 392];
    notes.forEach((n, i) => ping(n, 0.3, 0.17, 'triangle', i * 0.11));
  },

  /** The period bell. Used on the home screen and when a match starts. */
  bell() {
    const c = ac();
    if (!c || !sfxGain) return;
    // Capture the node: `sfxGain` is a mutable module binding, so the narrowing
    // above does not survive into the callback below.
    const out = sfxGain;
    const t = c.currentTime;
    [1046, 1568, 2093].forEach((f, i) => {
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f * (1 + i * 0.002);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16 / (i + 1), t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6 + i * 0.3);
      osc.connect(g).connect(out);
      osc.start(t);
      osc.stop(t + 2.2);
    });
  },

  /** UI: chalk tick on a slate. */
  chalk() {
    burst({ freq: 3200, q: 1.2, dur: 0.045, gain: 0.11 });
  },

  /** A card leaving a hand and landing on the pile. */
  cardPlay() {
    burst({ freq: 2200, q: 1.1, dur: 0.06, gain: 0.16, type: 'bandpass' });
    burst({ freq: 700, q: 0.9, dur: 0.09, gain: 0.1, when: 0.03, type: 'lowpass' });
  },

  /** Dragging one off the deck. */
  cardDraw() {
    burst({ freq: 3000, q: 0.8, dur: 0.11, gain: 0.11, type: 'bandpass' });
  },

  /** The whole deck riffled. */
  shuffle() {
    for (let i = 0; i < 14; i++) {
      burst({ freq: 1800 + Math.random() * 2400, q: 1.6, dur: 0.03, gain: 0.07, when: i * 0.028 });
    }
  },

  /** Folding a chit of paper, for Raja Rani. */
  paper() {
    for (let i = 0; i < 5; i++) {
      burst({ freq: 2600 + Math.random() * 1800, q: 1.2, dur: 0.045, gain: 0.09, when: i * 0.05 });
    }
  },

  /** Something good happened to you. */
  good() {
    [523, 659, 784].forEach((f, i) => ping(f, 0.22, 0.15, 'triangle', i * 0.075));
  },

  /** Something did not. */
  bad() {
    ping(392, 0.18, 0.14, 'sine');
    ping(294, 0.3, 0.12, 'sine', 0.1);
  },

  /** Night falls in Mafia — the room goes quiet and low. */
  nightfall() {
    ping(180, 1.1, 0.1, 'sine');
    ping(120, 1.4, 0.08, 'sine', 0.12);
    burst({ freq: 240, q: 0.7, dur: 0.9, gain: 0.06, type: 'lowpass' });
  },

  /** Morning, and everyone finds out what happened. */
  daybreak() {
    [440, 554, 659, 880].forEach((f, i) => ping(f, 0.4, 0.11, 'triangle', i * 0.09));
  },

  /** A vote landing on the board. */
  vote() {
    burst({ freq: 900, q: 3, dur: 0.05, gain: 0.14 });
    ping(520, 0.09, 0.09, 'square');
  },

  /** A plain UI tick, for buttons that deserve feedback. */
  tick() {
    burst({ freq: 2400, q: 2.4, dur: 0.018, gain: 0.07 });
  },
};

// ------------------------------------------------------------------ control

export const audio = {
  /** Must be called from a user gesture — browsers insist. */
  async unlock() {
    const c = ac();
    if (!c) return;
    if (c.state === 'suspended') await c.resume();
    if (!ambienceRunning) {
      ambienceRunning = true;
      startBed();
      scheduleChatter();
    }
  },

  get started() {
    return ambienceRunning;
  },

  setMuted(m: boolean) {
    state.muted = m;
    if (master && ctx) {
      master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.05);
    }
  },

  get muted() {
    return state.muted;
  },

  setAmbience(v: number) {
    state.ambienceLevel = v;
    if (ambienceGain && ctx) ambienceGain.gain.setTargetAtTime(v, ctx.currentTime, 0.1);
  },

  /** Duck the corridor while a shot is in the air, then let it back in. */
  duck(amount = 0.45, seconds = 1.2) {
    if (!ambienceGain || !ctx) return;
    const now = ctx.currentTime;
    ambienceGain.gain.cancelScheduledValues(now);
    ambienceGain.gain.setTargetAtTime(state.ambienceLevel * amount, now, 0.08);
    ambienceGain.gain.setTargetAtTime(state.ambienceLevel, now + seconds, 0.4);
  },

  dispose() {
    if (ambienceTimer) window.clearTimeout(ambienceTimer);
    ambienceTimer = null;
    ambienceRunning = false;
    ctx?.close();
    ctx = null;
    master = sfxGain = ambienceGain = null;
    noiseBuffer = null;
  },
};
