#!/usr/bin/env python3
"""
Original bubblegum-pop score and sound effects for a collage reel.

    python3 audio.py OUT/timing.json --out OUT

Reads timing.json (written by render.mjs: total length, shot cuts, item
events) and writes score.wav (a bright four-on-the-floor loop: plucky bass,
offbeat keys, claps, hats, a bell hook) and sfx.wav (pops, blips, dings,
typewriter ticks, stamps, whooshes) placed on the events. Everything is
synthesised here; nothing is sampled. meta.music can set {"bpm": 116, "key": "F"}.
"""
import argparse, json, os, wave
import numpy as np

SR = 44100
NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
rng = np.random.default_rng(7)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env(n, a=0.004, d=0.2, sustain=0.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * (sustain + (1 - sustain) * np.exp(-t / max(d, 1e-4)))
    return e


def add(buf, x, at):
    i = int(at * SR)
    if i >= len(buf) or i + len(x) <= 0:
        return
    if i < 0:
        x = x[-i:]; i = 0
    j = min(len(buf), i + len(x))
    buf[i:j] += x[:j - i]


def lp(x, k=0.15):
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += k * (v - acc); y[i] = acc
    return y


def onepole_hp(x, k=0.9):
    y = np.empty_like(x); prev_x = 0.0; prev_y = 0.0
    for i, v in enumerate(x):
        prev_y = k * (prev_y + v - prev_x); prev_x = v; y[i] = prev_y
    return y


# ---------- instruments ----------
def kick(n=int(0.32 * SR)):
    t = np.arange(n) / SR
    f = 48 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9) * 0.9 + rng.normal(0, 1, n) * np.exp(-t * 300) * 0.08


def clap(n=int(0.25 * SR)):
    t = np.arange(n) / SR
    noise = onepole_hp(rng.normal(0, 1, n), 0.85)
    e = np.exp(-t * 22) + 0.6 * np.exp(-((t - 0.012) % 0.011) * 300) * (t < 0.035)
    return noise * e * 0.32


def hat(open_=False):
    n = int((0.16 if open_ else 0.05) * SR)
    t = np.arange(n) / SR
    x = onepole_hp(onepole_hp(rng.normal(0, 1, n), 0.6), 0.6)
    return x * np.exp(-t * (18 if open_ else 70)) * 0.12


def pluck(m, dur, vol=0.3, bright=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m)
    x = np.sin(2 * np.pi * f * t) + 0.5 * bright * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 14) + 0.25 * bright * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 22)
    return x * env(n, 0.003, dur * 0.45) * vol


def keys(ms, dur, vol=0.12):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for m in ms:
        f = hz(m)
        x += np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * f * t)) + 0.2 * np.sin(2 * np.pi * 2 * f * t)
    return x * env(n, 0.005, 0.18, 0.15) * vol / len(ms)


def bell(m, dur=0.9, vol=0.12):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m)
    x = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6) + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 12)
    return x * env(n, 0.002, 0.35) * vol


# ---------- score ----------
def score(total, bpm, key):
    buf = np.zeros(int((total + 2) * SR))
    beat = 60 / bpm
    root = 41 + NOTE.get(key, 5)  # bass octave
    prog = [(0, [0, 4, 7]), (7, [7, 11, 14]), (9, [9, 12, 16]), (5, [5, 9, 12])]  # I V vi IV
    hook = [12, 16, 19, 16, 21, 19, 16, 14]  # bell arpeggio, scale degrees in semitones over the root+24
    nbeats = int(total / beat) + 2
    for b in range(nbeats):
        t = b * beat
        bar, pos = divmod(b, 4)
        deg, chord = prog[bar % 4]
        intro = bar < 1
        if not intro:
            add(buf, kick(), t)
        if pos in (1, 3) and not intro:
            add(buf, clap(), t)
        add(buf, hat(), t + beat / 2)
        if pos == 3:
            add(buf, hat(True), t + beat * 0.75)
        # bass: root on the beat, octave bounce on the off-beat
        if not intro:
            add(buf, pluck(root + deg, beat * 0.45, 0.32, 0.6), t)
            add(buf, pluck(root + deg + 12, beat * 0.3, 0.18, 0.8), t + beat * 0.5)
        # offbeat key stabs
        add(buf, keys([root + 24 + deg + c for c in chord], beat * 0.4), t + beat * 0.5)
        # bell hook on eighths, every other bar
        if bar % 2 == 1 or intro:
            for k in range(2):
                note = hook[(pos * 2 + k) % len(hook)]
                add(buf, bell(root + 24 + deg + note - 12 + 12), t + k * beat / 2)
    # ending: a ringing chord
    deg, chord = prog[0]
    add(buf, keys([root + 24 + c for c in chord] + [root + 36], 2.5, 0.2), total - 1.2)
    add(buf, bell(root + 36, 2.0, 0.15), total - 1.2)
    buf = buf[: int(total * SR)]
    fade = int(0.6 * SR)
    buf[-fade:] *= np.linspace(1, 0, fade)
    return buf


# ---------- sound effects ----------
def sfx(kind, dur=0.3):
    if kind == 'pop':
        n = int(0.09 * SR); t = np.arange(n) / SR
        f = 300 + 900 * np.exp(-t * 60)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 40) * 0.5
    if kind == 'blip':
        n = int(0.12 * SR); t = np.arange(n) / SR
        f = np.where(t < 0.05, 1250, 1680)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 25) * 0.28
    if kind == 'ding':
        return bell(84, 0.9, 0.35) + bell(91, 0.9, 0.18)
    if kind == 'swish':
        n = int(0.16 * SR); t = np.arange(n) / SR
        x = onepole_hp(rng.normal(0, 1, n), 0.7)
        return x * np.sin(np.pi * t / t[-1]) ** 2 * 0.07
    if kind == 'whoosh':
        n = int(0.42 * SR); t = np.arange(n) / SR
        x = lp(rng.normal(0, 1, n), 0.25)
        return x * np.sin(np.pi * t / t[-1]) ** 2 * 0.5
    if kind == 'stamp':
        n = int(0.2 * SR); t = np.arange(n) / SR
        return (np.sin(2 * np.pi * 70 * t) * np.exp(-t * 25) * 0.7 + rng.normal(0, 1, n) * np.exp(-t * 60) * 0.2)
    if kind == 'type':
        n = int(dur * SR); x = np.zeros(n)
        k = 0.0
        while k < dur:
            m = int(0.018 * SR); tt = np.arange(m) / SR
            c = onepole_hp(rng.normal(0, 1, m), 0.5) * np.exp(-tt * 300) * 0.22
            add(x, c, k)
            k += 0.055 + rng.random() * 0.03
        return x
    if kind == 'scribble':
        n = int(0.45 * SR); t = np.arange(n) / SR
        x = onepole_hp(rng.normal(0, 1, n), 0.8) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t)) ** 2
        return x * np.sin(np.pi * t / t[-1]) * 0.06
    if kind == 'rise':
        n = int(0.5 * SR); t = np.arange(n) / SR
        f = 300 + 900 * t / t[-1]
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / t[-1]) * 0.12
    return None


def write(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('timing')
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    tm = json.load(open(a.timing))
    total = tm['total']
    music = (tm.get('meta') or {}).get('music') or {}
    s = score(total, music.get('bpm', 116), music.get('key', 'F'))
    s = s / (np.max(np.abs(s)) + 1e-9) * 0.8
    write(os.path.join(a.out, 'score.wav'), s)
    fx = np.zeros(int((total + 1) * SR))
    last = {}
    for e in tm.get('events', []):
        k = e['kind']
        if k == 'cut':
            continue
        if e['t'] - last.get(k, -9) < 0.09:  # don't machine-gun the same sound
            continue
        last[k] = e['t']
        x = sfx(k, e.get('dur', 0.3))
        if x is not None:
            add(fx, x, e['t'])
    write(os.path.join(a.out, 'sfx.wav'), fx[: int(total * SR)])
    print(f'score {total:.1f}s at {music.get("bpm", 116)} bpm in {music.get("key", "F")}, {len(tm.get("events", []))} sound effects')


if __name__ == '__main__':
    main()
