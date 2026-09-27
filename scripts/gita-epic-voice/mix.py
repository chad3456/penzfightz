"""
Treat the voices and mix the epic cut's soundtrack.

    pip install numpy scipy soundfile librosa
    python mix.py [music.wav]

Reads vo/<line>.wav from speak.py and writes voice.wav (voices, a drone, wind,
a heartbeat under Arjuna, impacts, a riser and a bell) and timeline.json (when
each line is spoken, for the subtitles). Given a music file, it also writes
mix.wav with the music laid in: its opening hits under the cold open, then its
build and drop lined up so the drop lands on the Vishvarupa at 64.2 s, ducked
under the voice. The published reel used a track the user supplied, which is
not in this repository; public/gita-epic/audio/voice.mp3 is voice.wav.

Krishna is pitched down two semitones with a sub-octave under him, saturated,
in a hall; the Sanskrit is doubled, chorused and shadowed an octave down, in a
long temple reverb; Arjuna trembles.
"""
import sys
import json, numpy as np, soundfile as sf, librosa
from scipy.signal import fftconvolve, butter, sosfilt
SR = 48000
DUR = 102.5
N = int(DUR * SR)
rng = np.random.default_rng(7)
TL = [("N1",0.6),("N2",9.9),("A1",14.0),("N3",21.6),("K1",25.8),("K2",30.4),("K3",36.0),("K4",44.3),("K5",48.6),("K6",54.6),("N4",60.2),("K7",64.3),("K8",68.1),("N5",72.6),("K9",79.8),("A2",85.3),("A3",88.2),("N6",93.5)]
DROP = 64.2
BGM_DROP = 29.45

def load(name):
    x, sr = sf.read(f"vo/{name}.wav")
    return librosa.resample(x.astype(np.float32), orig_sr=sr, target_sr=SR)

def ir(sec, decay, seed):
    r = np.random.default_rng(seed)
    t = np.arange(int(sec * SR)) / SR
    env = np.exp(-t * decay)
    L = r.standard_normal(len(t)) * env
    R = r.standard_normal(len(t)) * env
    sos = butter(2, 6000, 'low', fs=SR, output='sos')
    return sosfilt(sos, L), sosfilt(sos, R)

IR_HALL = ir(3.2, 2.1, 1)
IR_ROOM = ir(1.2, 5.0, 2)
IR_TEMPLE = ir(4.5, 1.5, 3)

def reverb(x, irp, wet):
    L = fftconvolve(x, irp[0])[:len(x) + int(SR * 2.5)]
    R = fftconvolve(x, irp[1])[:len(x) + int(SR * 2.5)]
    n = max(len(L), len(x))
    dry = np.zeros(n); dry[:len(x)] = x
    s = np.sqrt(np.mean(L ** 2) + 1e-12) / (np.sqrt(np.mean(x ** 2)) + 1e-12)
    return np.stack([dry + wet * np.pad(L, (0, n - len(L))) / s, dry + wet * np.pad(R, (0, n - len(R))) / s], 1)

def compress(x, thr=0.2, ratio=3.0):
    env = np.abs(x)
    a = np.exp(-1 / (0.01 * SR)); r = np.exp(-1 / (0.15 * SR))
    e = np.zeros_like(env); cur = 0.0
    for i in range(0, len(env), 64):
        v = env[i:i + 64].max()
        cur = a * cur + (1 - a) * v if v > cur else r * cur + (1 - r) * v
        e[i:i + 64] = cur
    g = np.where(e > thr, (thr + (e - thr) / ratio) / (e + 1e-9), 1.0)
    return x * g

def lowshelf(x, gain_db, f=180):
    sos = butter(2, f, 'low', fs=SR, output='sos')
    return x + (10 ** (gain_db / 20) - 1) * sosfilt(sos, x)

def norm_rms(x, target):
    return x * (target / (np.sqrt(np.mean(x ** 2)) + 1e-9))

def process(name):
    x = load(name)
    k = name[0]
    sanskrit = name in ("K1", "K4", "K7", "A2")
    if sanskrit:
        x = librosa.effects.pitch_shift(x, sr=SR, n_steps=-1.5)
        d = np.roll(librosa.effects.pitch_shift(x, sr=SR, n_steps=0.12), int(0.022 * SR)) * 0.6
        low = librosa.effects.pitch_shift(x, sr=SR, n_steps=-12) * 0.28
        x = compress(norm_rms(x + d + low, 0.12))
        x = norm_rms(x, 0.12)
        return reverb(x, IR_TEMPLE, 0.55)
    if k == "K":
        x = librosa.effects.pitch_shift(x, sr=SR, n_steps=-2)
        low = librosa.effects.pitch_shift(x, sr=SR, n_steps=-12) * 0.22
        x = lowshelf(x + low, 5)
        x = np.tanh(compress(norm_rms(x, 0.14)) * 1.4) / 1.4
        return reverb(norm_rms(x, 0.13), IR_HALL, 0.32)
    if k == "A":
        x = librosa.effects.pitch_shift(x, sr=SR, n_steps=-0.5)
        t = np.arange(len(x)) / SR
        x = x * (1 - 0.12 * (0.5 + 0.5 * np.sin(2 * np.pi * 5.5 * t))) if name == "A1" else x
        x = compress(norm_rms(x, 0.12))
        return reverb(norm_rms(x, 0.11), IR_ROOM, 0.22)
    x = librosa.effects.pitch_shift(x, sr=SR, n_steps=-1)
    x = lowshelf(x, 3)
    x = compress(norm_rms(x, 0.12))
    return reverb(norm_rms(x, 0.115), IR_ROOM, 0.14)

vo = np.zeros((N, 2)); presence = np.zeros(N)
spans = []
for name, t0 in TL:
    y = process(name)
    i0 = int(t0 * SR); n = min(len(y), N - i0)
    vo[i0:i0 + n] += y[:n]
    raw = load(name); spans.append([name, t0, round(t0 + len(raw) / SR, 2)])
    presence[i0:i0 + len(raw)] = 1
    print(name, t0, round(len(raw) / SR, 2))

# ambient bed: a low drone, wind, a heartbeat under Arjuna, a shimmer when Krishna turns
t = np.arange(N) / SR
bed = np.zeros(N)
for f, g in [(73.42, 0.05), (110.0, 0.03), (146.83, 0.02), (220.0, 0.008)]:
    bed += g * np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * 0.07 * t) * 2)
wind = sosfilt(butter(2, [200, 900], 'band', fs=SR, output='sos'), rng.standard_normal(N)) * 0.02 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * t))
bedenv = np.clip((t - 8.5) / 2, 0, 1) * np.clip((48.5 - t) / 3, 0, 1)
bed = (bed + wind) * bedenv
hb = np.zeros(N)
for b in np.arange(13.6, 22, 1.0):
    for dt, a in [(0, 1), (0.28, 0.7)]:
        i = int((b + dt) * SR); n = int(0.25 * SR)
        tt = np.arange(n) / SR
        hb[i:i + n] += a * np.sin(2 * np.pi * (55 + 30 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 14)
shim = np.zeros(N)
i0 = int(21.8 * SR); n = int(9 * SR); tt = np.arange(n) / SR
for f in [1174.7, 1760, 2349.3, 2637]:
    shim[i0:i0 + n] += 0.006 * np.sin(2 * np.pi * f * tt + np.sin(tt * 3 + f)) * np.clip(tt / 2, 0, 1) * np.clip((9 - tt) / 3, 0, 1)
amb = np.stack([bed + hb * 0.35 + shim, bed + hb * 0.35 + shim * 0.9], 1)

# the music the user gave: the opening hits, then the build into the drop and on to the end
BGM_FILE = sys.argv[1] if len(sys.argv) > 1 else None
bgm = None
if BGM_FILE:
    bgm, bsr = sf.read(BGM_FILE)
    if bgm.ndim == 1:
        bgm = np.stack([bgm, bgm], 1)
    if bsr != SR:
        bgm = librosa.resample(bgm.T.astype(np.float32), orig_sr=bsr, target_sr=SR).T
def seg(src_start, dst_start, dst_end, fade_in=0.05, fade_out=1.0):
    n = int((dst_end - dst_start) * SR)
    s0 = int(src_start * SR)
    x = bgm[s0:s0 + n].copy()
    ramp = np.ones(len(x))
    fi = int(fade_in * SR); fo = int(fade_out * SR)
    ramp[:fi] = np.linspace(0, 1, fi)
    ramp[-fo:] = np.linspace(1, 0, fo)
    out = np.zeros((N, 2)); d0 = int(dst_start * SR)
    out[d0:d0 + len(x)] = x * ramp[:, None]
    return out
off = DROP - BGM_DROP
music = None
if bgm is not None:
    music = seg(0.8, 0.0, 9.9, 0.02, 1.1) + seg(11.0, 11.0 + off, DUR, 1.5, 3.0)
    # duck the music under the voice
    env = np.convolve(presence, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same')
    duck = 1 - 0.5 * np.clip(env, 0, 1)
    music *= duck[:, None]

# effects: impacts on the title and the drop, a riser into the drop, a bell at the end
fx = np.zeros((N, 2))
def boom(at, g):
    n = int(2.0 * SR); tt = np.arange(n) / SR; i = int(at * SR)
    b = np.sin(2 * np.pi * (38 + 60 * np.exp(-tt * 9)) * tt) * np.exp(-tt * 2.2) + rng.standard_normal(n) * np.exp(-tt * 18) * 0.3
    fx[i:i + n] += (g * b)[:, None]
boom(6.7, 0.5); boom(DROP, 0.45); boom(93.4, 0.3)
n = int(1.5 * SR); tt = np.arange(n) / SR; i = int((DROP - 1.5) * SR)
noise = rng.standard_normal(n)
rise = np.zeros(n); lp = 0; bp = 0
for j in range(n):
    fc = 300 + (tt[j] / 1.5) ** 2 * 7000
    k = 2 * np.pi * fc / SR
    lp += k * bp; hp = noise[j] - lp - bp * 0.5; bp += k * hp; rise[j] = bp
fx[i:i + n] += (rise * (tt / 1.5) ** 2 * 0.25)[:, None]
n = int(4 * SR); tt = np.arange(n) / SR; i = int(98.5 * SR)
bell = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, d in [(587.3, 0.9), (1620, 1.6), (3170, 2.4)]) * 0.05
fx[i:i + len(bell)] += bell[:, None]

voice_only = vo + amb * 0.9 + fx
vp = np.max(np.abs(voice_only))
sf.write('voice.wav', (np.tanh(voice_only / vp * 1.2) / np.tanh(1.2) * 0.94).astype(np.float32), SR)
if music is not None:
    mix = vo + amb * 0.9 + music * 0.8 + fx
    peak = np.max(np.abs(mix))
    mix = np.tanh(mix / peak * 1.3) / np.tanh(1.3) * 0.94
    sf.write('mix.wav', mix.astype(np.float32), SR)
json.dump({"duration": DUR, "drop": DROP, "vo": spans}, open('timeline.json', 'w'), indent=1)
print('written')
