/**
 * The score for the long one, written as a WAV.
 *
 * Two and three quarter minutes is long enough that one texture will not carry
 * it, so the piece is in five parts that follow the story rather than the
 * clock: a bright open drone for the palace, the same drone thinned out for the
 * road, a low fifth for the forest and the taking, something restless for the
 * sea and the war, and the opening material again — slower, and a fourth lower
 * — for the lamps.
 *
 * Nothing here is a transcription. The scale is the one the earlier film used,
 * which is to say an alphabet rather than a composition.
 */
import fs from 'node:fs';

const RATE = 44100;
const hz = (root, semis) => root * Math.pow(2, semis / 12);

function pluck(buf, at, freq, seconds, gain, bright = 1) {
  const start = Math.floor(at * RATE);
  const n = Math.floor(seconds * RATE);
  if (start > buf.length) return;
  for (let i = 0; i < n; i++) {
    const k = i / n;
    const env = Math.min(1, i / (RATE * 0.014)) * Math.pow(1 - k, 2.7);
    const p = (i / RATE) * Math.PI * 2;
    const s =
      Math.sin(p * freq) +
      Math.sin(p * freq * 2) * 0.34 * bright +
      Math.sin(p * freq * 3) * 0.15 * bright +
      Math.sin(p * freq * 4.01) * 0.06 * bright;
    const j = start + i;
    if (j >= 0 && j < buf.length) buf[j] += s * env * gain;
  }
}

function drone(buf, at, freq, seconds, gain) {
  const start = Math.floor(at * RATE);
  const n = Math.floor(seconds * RATE);
  for (let i = 0; i < n; i++) {
    const k = i / n;
    const env = Math.min(1, i / (RATE * 1.6)) * Math.min(1, (1 - k) * 8);
    const p = (i / RATE) * Math.PI * 2;
    const s =
      Math.sin(p * freq) * 0.6 +
      Math.sin(p * freq * 1.004) * 0.6 +
      Math.sin(p * freq * 2) * 0.15 +
      Math.sin(p * freq * 3.003) * 0.06;
    const j = start + i;
    if (j >= 0 && j < buf.length) buf[j] += s * env * gain;
  }
}

/** A low struck drum, for the war. */
function drum(buf, at, freq, seconds, gain) {
  const start = Math.floor(at * RATE);
  const n = Math.floor(seconds * RATE);
  for (let i = 0; i < n; i++) {
    const k = i / n;
    const env = Math.pow(1 - k, 4);
    const f = freq * (1 + Math.pow(1 - k, 6) * 0.6);
    const s = Math.sin((i / RATE) * Math.PI * 2 * f) + (Math.random() - 0.5) * 0.25 * env;
    const j = start + i;
    if (j >= 0 && j < buf.length) buf[j] += s * env * gain;
  }
}

export function score(duration) {
  const buf = new Float32Array(Math.ceil(duration * RATE));
  const D = 146.83;

  // Under everything, the whole way.
  drone(buf, 0, D, duration, 0.085);
  drone(buf, 1.2, hz(D, 7), duration - 1.2, 0.06);

  // The tanpura pattern, slowing where the story does and pressing where it
  // does not. The intervals are the film's, not a metronome's.
  const parts = [
    { from: 0, to: 40, every: 1.7, gain: 0.08, bright: 1 },     // the palace
    { from: 40, to: 76, every: 2.3, gain: 0.06, bright: 0.7 },  // the road out
    { from: 76, to: 104, every: 2.9, gain: 0.05, bright: 0.5 }, // the forest
    { from: 104, to: 144, every: 1.35, gain: 0.075, bright: 1 },// sea, and war
    { from: 144, to: duration, every: 2.6, gain: 0.07, bright: 0.8 }, // the lamps
  ];
  const cycle = [0, 7, 12, 0];
  for (const p of parts) {
    let i = 0;
    for (let t = p.from; t < p.to; t += p.every, i++) {
      pluck(buf, t, hz(D, cycle[i % cycle.length]), p.every * 1.7, p.gain, p.bright);
    }
  }

  // One phrase per scene, climbing then falling — the shape of the journey.
  const asc = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16];
  const desc = [16, 14, 12, 11, 9, 7, 5, 4, 2, 0];
  const line = [...asc, ...desc];
  for (let i = 0; i < 20; i++) {
    const at = 5.2 + i * 7.7 + 0.5;
    if (at > duration) break;
    pluck(buf, at, hz(D * 2, line[i]), 3.2, 0.05, 0.9);
    if (i % 3 === 1) pluck(buf, at + 0.9, hz(D * 2, line[i] + 3), 2.2, 0.03, 0.8);
  }

  // The war gets a drum, and only the war.
  for (let t = 140; t < 155 && t < duration; t += 0.62) {
    drum(buf, t, 58, 0.5, 0.13 * Math.min(1, (155 - t) / 5));
  }

  // The last chord, as the camera pulls back off the page.
  const end = Math.max(0, duration - 7);
  pluck(buf, end, hz(D, 0), 6, 0.07, 0.8);
  pluck(buf, end + 0.5, hz(D, 7), 5.5, 0.05, 0.8);
  pluck(buf, end + 1.1, hz(D * 2, 0), 5, 0.04, 0.7);

  return buf;
}

export function writeWav(path, samples) {
  const n = samples.length;
  const data = Buffer.alloc(n * 4);
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
