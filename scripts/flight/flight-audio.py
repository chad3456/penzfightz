#!/usr/bin/env python3
"""
An original soundtrack for "Hanuman in Flight": wind that rises and falls
with the shots, the sea below, a low drone, and a rush as he passes overhead.

    python3 scripts/flight/flight-audio.py --out flight-audio.wav [--seconds 38]
"""
import argparse
import wave

import numpy as np

SR = 44100


def lowpass(x, a):
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a * (x[i] - acc)
        y[i] = acc
    return y


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--seconds', type=float, default=38)
    a = ap.parse_args()
    n = int(a.seconds * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(5)
    noise = rng.standard_normal(n).astype(np.float32)
    # wind: two filtered noise bands, gusting
    gust = 0.55 + 0.25 * np.sin(t * 0.7) + 0.15 * np.sin(t * 1.9 + 1) + 0.1 * np.sin(t * 4.3)
    shots = [(0, 6.5, 0.5), (6.5, 13, 1.0), (13, 19.5, 0.85), (19.5, 25.5, 1.15), (25.5, 32, 0.7), (32, a.seconds, 0.6)]
    level = np.zeros(n)
    for s0, s1, lv in shots:
        m = (t >= s0) & (t < s1)
        level[m] = lv
    level = np.convolve(level, np.ones(SR) / SR, mode='same')
    low = lowpass(noise, 0.02)
    mid = lowpass(noise, 0.12) - lowpass(noise, 0.03)
    wind = (low * 3.0 + mid * 1.4) * gust * level
    # the sea: slow swells of low noise
    sea = lowpass(noise[::-1].copy(), 0.006) * 6 * (0.6 + 0.4 * np.sin(t * 0.45)) * (1 - 0.4 * (t > 25))
    # the rush overhead at about 6 s
    rush = np.exp(-((t - 6.1) / 0.55) ** 2) * mid * 4.5
    # a low drone: D and A, slowly breathing, rising for the end
    drone = np.zeros(n)
    for f, g in ((73.42, 0.5), (110.0, 0.32), (146.83, 0.22), (220.0, 0.08)):
        drone += g * np.sin(2 * np.pi * f * t + np.sin(t * 0.3) * 0.4)
    drone *= 0.06 * (0.5 + 0.5 * np.clip((t - 2) / 10, 0, 1)) * (1 + 0.6 * np.clip((t - 30) / 6, 0, 1))
    mix = wind * 0.09 + sea * 0.05 + rush * 0.12 + drone
    fade = np.minimum(1, np.minimum(t / 1.0, (a.seconds - t) / 1.5))
    mix *= np.clip(fade, 0, 1)
    mix /= max(1e-6, np.abs(mix).max()) / 0.7
    stereo = np.stack([mix, np.roll(mix, 220)], axis=1)
    with wave.open(a.out, 'w') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((stereo * 32767).astype(np.int16).tobytes())
    print('audio', a.out)


if __name__ == '__main__':
    main()
