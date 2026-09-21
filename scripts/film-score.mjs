/**
 * The score, written as a WAV.
 *
 * A drone and a handful of notes, synthesised from scratch because there is no
 * music in this repository and there should not be any that somebody else
 * wrote. It is a tanpura's job: a tonic and a fifth held under everything, a
 * string brushed every couple of seconds, and a few single notes over the top
 * that arrive when a plate changes and are gone before the next one.
 *
 * Nothing here is a transcription of anything. The scale is the one Indian
 * classical music calls a raga's ascent and Western theory calls a mode, and
 * a scale is not a composition — it is an alphabet.
 */
import fs from 'node:fs';

const RATE = 44100;

/** Equal temperament from a root, in semitones. */
const hz = (root, semis) => root * Math.pow(2, semis / 12);

/**
 * A plucked string: a sine stack with a fast attack and a long decay, plus a
 * touch of the octave and the fifth, which is most of what makes a plucked
 * string sound plucked rather than beeped.
 */
function pluck(buf, at, freq, seconds, gain) {
  const start = Math.floor(at * RATE);
  const n = Math.floor(seconds * RATE);
  for (let i = 0; i < n; i++) {
    const k = i / n;
    const env = Math.min(1, i / (RATE * 0.012)) * Math.pow(1 - k, 2.6);
    const p = (i / RATE) * Math.PI * 2;
    const s =
      Math.sin(p * freq) * 1.0 +
      Math.sin(p * freq * 2) * 0.32 +
      Math.sin(p * freq * 3) * 0.14 +
      Math.sin(p * freq * 4.01) * 0.06;
    const j = start + i;
    if (j >= 0 && j < buf.length) buf[j] += s * env * gain;
  }
}

/** A held drone, two strings slightly apart so they beat against each other. */
function drone(buf, at, freq, seconds, gain) {
  const start = Math.floor(at * RATE);
  const n = Math.floor(seconds * RATE);
  for (let i = 0; i < n; i++) {
    const k = i / n;
    const env = Math.min(1, i / (RATE * 0.9)) * Math.min(1, (1 - k) * 6);
    const p = (i / RATE) * Math.PI * 2;
    const s =
      Math.sin(p * freq) * 0.6 +
      Math.sin(p * freq * 1.003) * 0.6 +
      Math.sin(p * freq * 2) * 0.16 +
      Math.sin(p * freq * 3.002) * 0.07;
    const j = start + i;
    if (j >= 0 && j < buf.length) buf[j] += s * env * gain;
  }
}

export function score(duration) {
  const buf = new Float32Array(Math.ceil(duration * RATE));
  const C = 146.83; // a low D, because the plates are cool and it suits them

  // The two drone strings, under the whole thing.
  drone(buf, 0, C, duration, 0.10);
  drone(buf, 0, hz(C, 7), duration, 0.075);
  drone(buf, 0.4, hz(C, 12), duration - 0.4, 0.05);

  // The tanpura stroke: the same four strings, round and round.
  const cycle = [0, 7, 12, 0];
  for (let i = 0; i * 1.55 < duration; i++) {
    pluck(buf, i * 1.55, hz(C, cycle[i % cycle.length]), 2.6, 0.085);
  }

  // One note per plate, on the scale's ascent, arriving as the slide changes.
  const asc = [0, 1, 4, 5, 7, 8, 11, 12, 14, 16];
  for (let i = 0; i < asc.length; i++) {
    const at = 3.0 + i * 1.62 + 0.08;
    pluck(buf, at, hz(C * 2, asc[i]), 2.4, 0.055);
    if (i % 3 === 2) pluck(buf, at + 0.42, hz(C * 2, asc[i] + 3), 1.6, 0.03);
  }
  // A last one, as the lens opens.
  pluck(buf, 19.4, hz(C * 2, 0), 4.5, 0.06);
  pluck(buf, 19.9, hz(C * 2, 7), 4.0, 0.04);
  pluck(buf, 24.6, hz(C, 0), 3.2, 0.05);

  return buf;
}

/** Sixteen-bit stereo, which is what ffmpeg wants and what a WAV is. */
export function writeWav(path, samples) {
  const n = samples.length;
  const data = Buffer.alloc(n * 4);
  // A gentle limiter, so the drone stack never clips into a buzz.
  for (let i = 0; i < n; i++) {
    const x = Math.tanh(samples[i] * 1.5) * 0.86;
    const v = Math.max(-32767, Math.min(32767, Math.round(x * 32767)));
    data.writeInt16LE(v, i * 4);
    data.writeInt16LE(v, i * 4 + 2);
  }
  const head = Buffer.alloc(44);
  head.write('RIFF', 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write('WAVE', 8);
  head.write('fmt ', 12);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(2, 22);
  head.writeUInt32LE(RATE, 24);
  head.writeUInt32LE(RATE * 4, 28);
  head.writeUInt16LE(4, 32);
  head.writeUInt16LE(16, 34);
  head.write('data', 36);
  head.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path, Buffer.concat([head, data]));
}
