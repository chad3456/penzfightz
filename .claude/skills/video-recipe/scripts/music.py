#!/usr/bin/env python3
"""
An original ambient score, synthesised from scratch, that follows the scenes.

    python3 music.py TIMING.json --out score.wav [--key D] [--mood wonder|tense|warm|sad]

TIMING.json is written by render.mjs (scene starts, lengths and moods). Each
scene gets a chord from a slow progression; pads swell at scene changes and
a soft pluck arpeggio carries the "wonder" scenes. No samples, no borrowed
melodies.
"""
import argparse
import json
import math
import wave

import numpy as np

SR = 44100
NOTES = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
PROG = {
    'wonder': [[0, 4, 7, 11], [9, 0, 4, 7], [5, 9, 0, 4], [7, 11, 2, 5]],
    'warm': [[0, 4, 7, 14], [5, 9, 0, 7], [9, 0, 4, 7], [7, 11, 2, 9]],
    'tense': [[0, 3, 7, 10], [8, 0, 3, 7], [5, 8, 0, 3], [7, 10, 2, 5]],
    'sad': [[9, 0, 4, 7], [5, 9, 0, 4], [0, 4, 7, 11], [7, 11, 2, 4]],
}


def hz(semi, octave):
    return 440 * 2 ** ((semi - 9) / 12 + (octave - 4))


def pad(freq, n, rng):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for det in (-0.07, 0.0, 0.06):
        f = freq * 2 ** (det / 12)
        ph = rng.random() * 6.28
        out += np.sin(2 * np.pi * f * t + ph) + 0.35 * np.sin(4 * np.pi * f * t + ph) + 0.12 * np.sin(6 * np.pi * f * t)
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 0.11 * t + rng.random() * 6)
    return out * lfo / 4.5


def pluck(freq, n):
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(4 * np.pi * freq * t)) * np.exp(-t * 3.2)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('timing')
    ap.add_argument('--out', required=True)
    ap.add_argument('--key', default='D')
    a = ap.parse_args()
    tm = json.load(open(a.timing))
    total = tm['total'] + 2.5
    N = int(total * SR)
    mix = np.zeros(N)
    rng = np.random.default_rng(7)
    root = NOTES.get(a.key, 2)
    for k, sc in enumerate(tm['scenes']):
        mood = sc.get('mood', 'wonder')
        chord = PROG.get(mood, PROG['wonder'])[k % 4]
        s0 = int(sc['start'] * SR)
        n = int((sc['dur'] + 1.6) * SR)
        n = min(n, N - s0)
        if n <= 0:
            continue
        env = np.minimum(1, np.arange(n) / (SR * 1.2)) * np.minimum(1, (n - np.arange(n)) / (SR * 1.6))
        seg = sum(pad(hz(root + c, 3), n, rng) for c in chord) * 0.16
        seg += pad(hz(root + chord[0], 2), n, rng) * 0.22
        if mood in ('wonder', 'warm'):
            step = 0.5 if sc.get('energy', 0.5) > 0.6 else 0.75
            for j in range(int(sc['dur'] / step)):
                p0 = int(j * step * SR)
                note = chord[j % 4] + (12 if j % 8 >= 4 else 0)
                L = min(int(SR * 1.4), n - p0)
                if L > 0:
                    seg[p0:p0 + L] += pluck(hz(root + note, 5), L) * 0.05
        mix[s0:s0 + n] += seg * env
    # a long, cheap reverb: a few decaying echoes
    wet = np.zeros_like(mix)
    for d, g in ((0.031, 0.5), (0.053, 0.42), (0.089, 0.35), (0.137, 0.28), (0.211, 0.2), (0.33, 0.14)):
        o = int(d * SR)
        wet[o:] += mix[:-o] * g
    mix = mix * 0.7 + wet * 0.5
    mix /= max(1e-6, np.abs(mix).max()) / 0.32
    with wave.open(a.out, 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
    print(f'score {total:.1f}s -> {a.out}')


if __name__ == '__main__':
    main()
