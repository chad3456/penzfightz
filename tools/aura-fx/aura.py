#!/usr/bin/env python3
"""
Aura FX: turn any clip into a vertical "aura" reel with beat-synced effects.

    python3 aura.py INPUT.mp4 --out OUT_DIR [--plan PLAN.json] [--auto] [--workers 4] [--gallery] [--preview]

  --auto      write OUT_DIR/plan.json for this clip (shots, beats, a look per
              shot, freeze moments, captions) and render it; edit the plan and
              render again with --plan
  --gallery   one frame through every look, as gallery.jpg
  --preview   one still per segment (preview.jpg) instead of the full render
  --from/--to render a slice (seconds)

Steps: shots and beats are found from the clip itself; a person mask is
computed (U^2-Net human segmentation, run locally) for framing and the aura
looks; each frame is reframed to 9:16 (subject-tracked crop, or the full
frame in a band over a blurred fill), graded with its segment's look, hit
with beat punches, flashes, shake and RGB splits, and dressed with text, an
aura meter and freeze-frame cut-outs. The original audio is kept.
"""
import argparse, json, math, os, subprocess, sys, time, wave
from concurrent.futures import ProcessPoolExecutor
import numpy as np
import cv2

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import fx  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
CACHE = os.environ.get('REEL_CACHE', os.path.join(ROOT, 'video-work', 'reel-cache'))
MODEL = os.path.join(CACHE, 'models', 'u2net_human_seg.onnx')
MODEL_URL = 'https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net_human_seg.onnx'
FONT_BIG = os.path.join(HERE, 'fonts', 'Anton-Regular.ttf')
FONT_CAP = os.path.join(HERE, 'fonts', 'BebasNeue-Regular.ttf')
W, H = 720, 1280  # working size; the film is scaled to 1080 x 1920 at the end


def ffmpeg():
    return 'ffmpeg'


# ---------- analysis: shots and beats ----------
def probe(path):
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    w, h = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()
    return fps, n, w, h


def find_shots(path, fps, thresh=0.55, min_len=0.6):
    cap = cv2.VideoCapture(path)
    prev, cuts, i = None, [0.0], 0
    while True:
        ok, f = cap.read()
        if not ok:
            break
        s = cv2.resize(f, (96, 72))
        hsv = cv2.cvtColor(s, cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist([hsv], [0, 1, 2], None, [12, 6, 6], [0, 180, 0, 256, 0, 256])
        cv2.normalize(hist, hist)
        if prev is not None:
            d = 1 - cv2.compareHist(prev[0], hist, cv2.HISTCMP_CORREL)
            diff = float(np.mean(np.abs(s.astype(np.float32) - prev[1]))) / 255
            if (d > thresh or diff > 0.22) and i / fps - cuts[-1] >= min_len:
                cuts.append(round(i / fps, 3))
        prev = (hist, s.astype(np.float32))
        i += 1
    cap.release()
    return cuts, i / fps


def find_beats(path, total):
    wav = path + '.beats.wav'
    subprocess.run([ffmpeg(), '-v', 'error', '-y', '-i', path, '-ac', '1', '-ar', '22050', wav], check=True)
    w = wave.open(wav); sr = w.getframerate()
    x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    os.remove(wav)
    if len(x) < sr:
        return {'bpm': 0, 'beats': [], 'downbeats': [], 'onsets': []}
    hop, n = 512, 2048
    frames = np.lib.stride_tricks.sliding_window_view(x, n)[::hop] * np.hanning(n)
    S = np.abs(np.fft.rfft(frames, axis=1))
    flux = np.maximum(0, np.diff(np.log1p(S * 10), axis=0)).sum(1)
    flux = (flux - flux.mean()) / (flux.std() + 1e-9)
    rate = sr / hop
    ac = np.correlate(flux, flux, 'full')[len(flux) - 1:]
    lags = np.arange(1, len(ac)) / rate
    bpm_all = 60 / lags
    ok = (bpm_all > 70) & (bpm_all < 180)
    bpm = float(bpm_all[ok][np.argmax(ac[1:][ok])])
    period = 60 / bpm
    # phase: the grid offset that lands on the most onset energy
    best, phase = -1e9, 0.0
    for ph in np.arange(0, period, 0.01):
        idx = ((np.arange(ph, total, period)) * rate).astype(int)
        idx = idx[idx < len(flux)]
        sc = flux[idx].sum()
        if sc > best:
            best, phase = sc, ph
    beats = [round(float(b), 3) for b in np.arange(phase, total, period)]
    # downbeat: which of the four beat positions is strongest
    strength = [sum(flux[min(len(flux) - 1, int(b * rate))] for b in beats[k::4]) for k in range(4)]
    k0 = int(np.argmax(strength))
    onsets = [round((k + 1) / rate, 3) for k in range(1, len(flux) - 1) if flux[k] > 3 and flux[k] >= flux[k - 1] and flux[k] >= flux[k + 1]]
    return {'bpm': round(bpm, 2), 'beats': beats, 'downbeats': beats[k0::4], 'onsets': onsets}


# ---------- person masks ----------
def ensure_model():
    if os.path.exists(MODEL):
        return
    os.makedirs(os.path.dirname(MODEL), exist_ok=True)
    print('downloading the person-segmentation model (U^2-Net human seg, 176 MB), once')
    subprocess.run(['curl', '-sL', '-o', MODEL, MODEL_URL], check=True)


def compute_masks(path, out_npz, step=3):
    """mask every `step` frames at 240x320 (uint8), interpolated in between"""
    if os.path.exists(out_npz):
        return
    ensure_model()
    import onnxruntime as ort
    sess = ort.InferenceSession(MODEL, providers=['CPUExecutionProvider'])
    name = sess.get_inputs()[0].name
    cap = cv2.VideoCapture(path)
    keys, masks, i, t0 = [], [], 0, time.time()
    mean, std = np.array([0.485, 0.456, 0.406], np.float32), np.array([0.229, 0.224, 0.225], np.float32)
    while True:
        ok, f = cap.read()
        if not ok:
            break
        if i % step == 0:
            x = cv2.resize(cv2.cvtColor(f, cv2.COLOR_BGR2RGB), (320, 320)).astype(np.float32) / 255
            x = ((x - mean) / std).transpose(2, 0, 1)[None]
            m = sess.run(None, {name: x})[0][0, 0]
            m = (m - m.min()) / (m.max() - m.min() + 1e-6)
            masks.append((cv2.resize(m, (320, 240)) * 255).astype(np.uint8))
            keys.append(i)
            if len(keys) % 50 == 0:
                print(f'\r  masks {i} frames, {time.time() - t0:.0f}s', end='', flush=True)
        i += 1
    print(f'\r  masks: {len(keys)} keyframes in {time.time() - t0:.0f}s        ')
    np.savez_compressed(out_npz, keys=np.array(keys), masks=np.array(masks))


class Masks:
    def __init__(self, npz):
        d = np.load(npz)
        self.keys, self.m = d['keys'], d['masks']

    def at(self, i):
        k = np.searchsorted(self.keys, i)
        if k <= 0:
            return self.m[0].astype(np.float32) / 255
        if k >= len(self.keys):
            return self.m[-1].astype(np.float32) / 255
        a, b = self.keys[k - 1], self.keys[k]
        w = (i - a) / max(1, b - a)
        return (self.m[k - 1] * (1 - w) + self.m[k] * w).astype(np.float32) / 255


# ---------- auto plan ----------
CAPTIONS = ['AURA', 'UNBOTHERED', 'MAIN CHARACTER', 'SILENT. DANGEROUS.', 'NO WORDS NEEDED', 'BUILT DIFFERENT', 'FINAL BOSS']
AUTO_LOOKS = ['film', 'teal_orange', 'cyberpunk', 'noir_red', 'glitch', 'comic', 'golden_aura', 'neon_aura', 'purple_haze', 'green_rays', 'sketch', 'storm', 'embers', 'noir', 'oil', 'dream', 'vhs', 'infrared', 'thermal', 'kaleido', 'matrix']


def auto_plan(info, masks):
    segs = []
    cuts = info['shots'] + [info['duration']]
    for k in range(len(cuts) - 1):
        t0, t1 = cuts[k], cuts[k + 1]
        segs.append({'t0': t0, 't1': t1, 'look': AUTO_LOOKS[k % len(AUTO_LOOKS)], 'frame': 'crop'})
    # long shots get split on downbeats so the look keeps changing
    out = []
    for s in segs:
        dbs = [d for d in info['downbeats'] if s['t0'] + 2.5 < d < s['t1'] - 2.5]
        pts = [s['t0']] + dbs[1::2] + [s['t1']]
        for a, b in zip(pts, pts[1:]):
            out.append({**s, 't0': round(a, 3), 't1': round(b, 3), 'look': AUTO_LOOKS[len(out) % len(AUTO_LOOKS)]})
    events = []
    longest = max(out, key=lambda s: s['t1'] - s['t0'])
    events.append({'t': round((longest['t0'] + longest['t1']) / 2, 2), 'kind': 'freeze', 'dur': 1.4, 'text': '+1000 AURA'})
    for k, d in enumerate(info['downbeats'][2::4]):
        events.append({'t': d, 'kind': 'text', 'text': CAPTIONS[k % len(CAPTIONS)], 'style': 'impact', 'dur': 1.3})
    events.append({'t': max(0, info['duration'] - 3), 'kind': 'text', 'text': 'AURA: MAX', 'style': 'impact', 'dur': 3})
    return {'size': [1080, 1920], 'meter': True, 'punch': 0.04, 'downbeat_punch': 0.1, 'segments': out, 'events': events}


# ---------- text ----------
_font_cache = {}


def text_rgba(text, size, font=FONT_BIG, color=(255, 255, 255), glow=(255, 60, 200), stroke=0, spacing=0):
    key = (text, size, font, color, glow, stroke)
    if key in _font_cache:
        return _font_cache[key]
    from PIL import Image, ImageDraw, ImageFont
    f = ImageFont.truetype(font, size)
    lines = text.split('\n')
    bbs = [f.getbbox(l) for l in lines]
    tw = max(b[2] - b[0] for b in bbs) + stroke * 2
    lh = int(size * 1.08)
    pad = size // 2
    img = Image.new('RGBA', (tw + pad * 2, lh * len(lines) + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for i, l in enumerate(lines):
        b = f.getbbox(l)
        x = pad + (tw - (b[2] - b[0])) // 2 - b[0]
        d.text((x, pad + i * lh - b[1] + (lh - size) // 2), l, font=f, fill=color + (255,), stroke_width=stroke, stroke_fill=(0, 0, 0, 255))
    a = np.array(img).astype(np.float32) / 255  # RGBA
    rgb, al = a[..., :3][..., ::-1], a[..., 3]
    if glow:
        g = cv2.GaussianBlur(al, (0, 0), size * 0.18)
        g2 = cv2.GaussianBlur(al, (0, 0), size * 0.5)
        gcol = np.array(glow[::-1], np.float32) / 255
        glow_rgb = gcol * np.clip(g * 1.6 + g2 * 0.8, 0, 1)[..., None]
        rgb = rgb * al[..., None] + glow_rgb * (1 - al[..., None])
        al = np.clip(np.maximum(al, (g * 1.6 + g2 * 0.8)), 0, 1)
    out = (rgb.astype(np.float32), al.astype(np.float32))
    _font_cache[key] = out
    return out


def paste(img, rgba, cx, cy, scale=1.0, alpha=1.0, add=False):
    rgb, al = rgba
    if scale != 1.0:
        rgb = cv2.resize(rgb, None, fx=scale, fy=scale, interpolation=cv2.INTER_LINEAR)
        al = cv2.resize(al, None, fx=scale, fy=scale, interpolation=cv2.INTER_LINEAR)
    h, w = al.shape
    x0, y0 = int(cx - w / 2), int(cy - h / 2)
    xa, ya, xb, yb = max(0, x0), max(0, y0), min(img.shape[1], x0 + w), min(img.shape[0], y0 + h)
    if xa >= xb or ya >= yb:
        return img
    r = rgb[ya - y0:yb - y0, xa - x0:xb - x0]
    a = al[ya - y0:yb - y0, xa - x0:xb - x0, None] * alpha
    region = img[ya:yb, xa:xb]
    img[ya:yb, xa:xb] = region + r * a if add else region * (1 - a) + r * a
    return img


# ---------- procedural layers ----------
class Layers:
    def __init__(self, c):
        self.c = c

    def rain(self):
        c, out = self.c, np.zeros((H, W, 3), np.uint8)
        rng = np.random.default_rng(11)
        chars = '01Z7K3X9'
        cols = 26
        for k in range(cols):
            speed, off, x = rng.uniform(260, 620), rng.uniform(0, 2000), int((k + rng.uniform(0, 0.6)) * W / cols)
            head = (c.t * speed + off) % (H + 600) - 100
            for j in range(14):
                y = int(head - j * 30)
                if 0 <= y < H:
                    v = (1 - j / 14) ** 1.6
                    ch = chars[(k * 7 + j * 3 + int(c.t * 8)) % len(chars)]
                    g = int(255 * v)
                    cv2.putText(out, ch, (x, y), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (g, g, g), 2, cv2.LINE_AA)
        out = out.astype(np.float32) / 255
        return fx.blur(out, 3) * 0.8 + out

    def lightning(self):
        c = self.c
        out = np.zeros((H, W, 3), np.uint8)
        if c.pulse < 0.15:
            return out.astype(np.float32)
        rng = np.random.default_rng(int(c.beat_i) * 97 + 5)
        cx, cy = c.subject
        for b in range(2):
            x, y = rng.uniform(0.1, 0.9) * W, 0
            tx, ty = cx * W + rng.uniform(-150, 150), cy * H + rng.uniform(-100, 100)
            pts = [(x, y)]
            for s in range(1, 13):
                f = s / 12
                pts.append((x + (tx - x) * f + rng.normal(0, 38), y + (ty - y) * f + rng.normal(0, 12)))
            p = np.array(pts, np.int32)
            cv2.polylines(out, [p], False, (255, 255, 255), 9, cv2.LINE_AA)
        out = out.astype(np.float32) / 255
        glow = fx.blur(out, 30) * 2.2
        core = out.copy()
        return (glow + core) * c.pulse

    def embers(self):
        c = self.c
        out = np.zeros((H, W, 3), np.uint8)
        rng = np.random.default_rng(3)
        n = 140
        x0, y0 = rng.uniform(0, W, n), rng.uniform(0, H, n)
        sp, ph, sz = rng.uniform(40, 160, n), rng.uniform(0, 6.28, n), rng.uniform(1.5, 4.5, n)
        ys = (y0 - c.t * sp) % (H + 40)
        xs = x0 + np.sin(c.t * 1.7 + ph) * 22
        for k in range(n):
            v = 0.5 + 0.5 * math.sin(c.t * 9 + ph[k])
            g = int(255 * v)
            cv2.circle(out, (int(xs[k]), int(ys[k])), int(sz[k]), (g, g, g), -1, cv2.LINE_AA)
        out = out.astype(np.float32) / 255
        return fx.blur(out, 10) * 2.5 + out

    def leak(self):
        c = self.c
        out = np.zeros((H, W, 3), np.uint8)
        x = int((0.5 + 0.6 * math.sin(c.t * 0.35)) * W)
        y = int((0.3 + 0.4 * math.cos(c.t * 0.27)) * H)
        cv2.circle(out, (x, y), 260, (64, 115, 255), -1)
        cv2.circle(out, (W - x, H - y), 200, (51, 64, 230), -1)
        return fx.blur(out.astype(np.float32) / 255, 140) * (0.35 + 0.25 * math.sin(c.t * 1.3))


class Ctx:
    def __init__(self, **k):
        self.__dict__.update(k)
        self._layers = Layers(self)
        self._cache = {}

    def layer(self, name):
        if name not in self._cache:
            self._cache[name] = getattr(self._layers, name)()
        return self._cache[name]


# ---------- framing ----------
def frame_crop(src, cx):
    h, w = src.shape[:2]
    cw = int(h * 9 / 16)
    x0 = int(np.clip(cx * w - cw / 2, 0, w - cw))
    return cv2.resize(src[:, x0:x0 + cw], (W, H), interpolation=cv2.INTER_CUBIC), x0, cw


def frame_fit(src):
    h, w = src.shape[:2]
    bh = int(W * h / w)
    band = cv2.resize(src, (W, bh), interpolation=cv2.INTER_AREA)
    bg, _, _ = frame_crop(src, 0.5)
    bg = fx.blur(bg, 40) * 0.45
    y0 = (H - bh) // 2
    bg[y0:y0 + bh] = band
    return bg, y0, bh


def subject_x(masks, fi):
    if masks is None:
        return 0.5, 0.45
    m = masks.at(fi)
    tot = m.sum()
    if tot < m.size * 0.01:
        return 0.5, 0.45
    ys, xs = np.mgrid[0:m.shape[0], 0:m.shape[1]]
    return float((xs * m).sum() / tot / m.shape[1]), float((ys * m).sum() / tot / m.shape[0])


# ---------- one frame ----------
def render_frame(src, fi, t, plan, info, masks, track):
    seg = next((s for s in plan['segments'] if s['t0'] <= t < s['t1']), plan['segments'][-1])
    lt, dur = t - seg['t0'], max(0.05, seg['t1'] - seg['t0'])
    beats = info['beats']
    bi = max(0, np.searchsorted(beats, t, 'right') - 1)
    since = t - beats[bi] if beats else 9
    pulse = math.exp(-since * 7) if beats else 0
    downs = set(info['downbeats'])
    is_down = beats and beats[bi] in downs
    # framing
    cx = seg.get('x', track[fi][0] if track is not None else 0.5)
    mask = None
    if seg.get('frame', 'crop') == 'fit':
        img, y0, bh = frame_fit(src)
        if masks is not None:
            m = masks.at(fi)
            mm = np.zeros((H, W), np.float32)
            mm[y0:y0 + bh] = cv2.resize(m, (W, bh))
            mask = mm
        subj = (0.5, (y0 + bh * 0.45) / H)
    else:
        img, x0, cw = frame_crop(src, cx)
        if masks is not None:
            m = masks.at(fi)
            mh, mw = m.shape
            a, b = int(x0 / src.shape[1] * mw), int((x0 + cw) / src.shape[1] * mw)
            mask = cv2.resize(m[:, a:b], (W, H))
        subj = (0.5, track[fi][1] if track is not None else 0.45)
    img = img.astype(np.float32) / 255
    if mask is not None:
        mask = cv2.GaussianBlur(mask, (0, 0), 3)
    # freeze-frame events take over the picture
    ev = next((e for e in plan.get('events', []) if e['kind'] == 'freeze' and e['t'] <= t < e['t'] + e['dur']), None)
    c = Ctx(t=t, lt=lt, p=lt / dur, pulse=pulse, beat_i=bi, mask=mask, fi=fi, rng=np.random.default_rng(fi * 7919 + 13), subject=subj)
    look = fx.LOOKS.get(seg['look'], fx.teal_orange)
    out = look(img, c)
    # beat motion: punch-in, stronger on downbeats; shake on hard onsets
    amp = plan.get('downbeat_punch', 0.1) if is_down else plan.get('punch', 0.04)
    s = 1 + amp * pulse + seg.get('zoom', 0.06) * (lt / dur)
    on = [o for o in info.get('onsets', []) if 0 <= t - o < 0.18]
    sx = sy = 0
    if on and seg.get('shake', True):
        k = math.exp(-(t - on[-1]) * 18)
        r = np.random.default_rng(int(on[-1] * 1000))
        sx, sy = r.uniform(-14, 14) * k, r.uniform(-14, 14) * k
    M = cv2.getRotationMatrix2D((W / 2, H * subj[1]), seg.get('tilt', 0) * math.sin(t), s)
    M[:, 2] += (sx, sy)
    out = cv2.warpAffine(out, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    # cuts: white flash and an RGB split for a few frames
    since_cut = lt
    if since_cut < 0.15 and seg['t0'] > 0 and plan.get('flash_cuts', True):
        out = out + (1 - since_cut / 0.15) * 0.75
    if since_cut < 0.2 or (is_down and since < 0.1):
        out = fx.rgb_shift(out, 10)
    if ev is not None:
        out = freeze(src, ev, t, plan, info, masks, track)
    out = overlays(out, t, fi, plan, info, pulse)
    if seg.get('letterbox'):
        bar = int(H * 0.11)
        out[:bar] = 0; out[-bar:] = 0
    return (np.clip(out, 0, 1) * 255).astype(np.uint8)


_held = {}


def freeze(src_now, ev, t, plan, info, masks, track):
    """hold the frame at the event, cut the person out with a white sticker edge over a burst"""
    fps = info['fps']
    fi0 = int(ev['t'] * fps)
    if fi0 not in _held:
        cap = cv2.VideoCapture(info['path'])
        cap.set(cv2.CAP_PROP_POS_FRAMES, fi0)
        ok, f = cap.read()
        cap.release()
        _held[fi0] = f if ok else src_now
    src = _held[fi0]
    cx = track[fi0][0] if track is not None else 0.5
    img, x0, cw = frame_crop(src, cx)
    img = img.astype(np.float32) / 255
    lt = t - ev['t']
    pop = 1 + 0.25 * math.exp(-lt * 9) * math.cos(lt * 22)
    # background: rotating sunburst in hot colours
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    ang = np.arctan2(yy - H * 0.45, xx - W / 2) + lt * 0.8
    rays = (np.sin(ang * 14) > 0).astype(np.float32)
    bg = np.where(rays[..., None] > 0, np.array([0.55, 0.05, 0.75], np.float32), np.array([0.12, 0.0, 0.25], np.float32))
    bg = bg + fx.blur(fx.noir(img, Ctx(t=t, lt=lt, p=0, pulse=0, beat_i=0, mask=None, fi=0, rng=np.random.default_rng(1), subject=(0.5, 0.45))), 30) * 0.4
    if masks is not None:
        m = masks.at(fi0)
        mh, mw = m.shape
        a, b = int(x0 / src.shape[1] * mw), int((x0 + cw) / src.shape[1] * mw)
        m = cv2.GaussianBlur(cv2.resize(m[:, a:b], (W, H)), (0, 0), 2)
        m = (m > 0.45).astype(np.float32)
        edge = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
        subject = fx.teal_orange(img, Ctx(t=t, lt=0, p=0, pulse=0, beat_i=0, mask=m, fi=0, rng=np.random.default_rng(2), subject=(0.5, 0.45)))
        out = bg * (1 - edge[..., None]) + edge[..., None] * 1.0
        out = out * (1 - m[..., None]) + subject * m[..., None]
    else:
        out = bg * 0.4 + fx.teal_orange(img, Ctx(t=t, lt=0, p=0, pulse=0, beat_i=0, mask=None, fi=0, rng=np.random.default_rng(2), subject=(0.5, 0.45))) * 0.8
    M = cv2.getRotationMatrix2D((W / 2, H / 2), -3 * math.exp(-lt * 6), pop)
    out = cv2.warpAffine(out, M, (W, H), borderMode=cv2.BORDER_REFLECT)
    if lt < 0.12:
        out = out + (1 - lt / 0.12)
    if ev.get('text'):
        rg = text_rgba(ev['text'], 120, FONT_BIG, (255, 255, 255), (120, 255, 80), stroke=4)
        out = paste(out, rg, W / 2, H * 0.8 - 30 * min(1, lt * 4), scale=min(1, 0.4 + lt * 5))
    return out


def overlays(img, t, fi, plan, info, pulse):
    # captions
    for e in plan.get('events', []):
        if e['kind'] != 'text' or not (e['t'] <= t < e['t'] + e['dur']):
            continue
        lt = t - e['t']
        st = e.get('style', 'impact')
        if st == 'impact':
            rg = text_rgba(e['text'].replace(' ', '\n') if len(e['text']) > 11 else e['text'], int(e.get('size', 150)), FONT_BIG, (255, 255, 255), tuple(e.get('glow', (255, 40, 180))), stroke=3)
            fitk = min(1.0, W * 0.86 / max(1, rg[1].shape[1] - int(e.get('size', 150))))  # never wider than the frame
            sc = fitk * (1.3 - 0.3 * min(1, lt / 0.12) + 0.03 * pulse)
            a = min(1, lt / 0.06) * min(1, (e['dur'] - lt) / 0.2)
            jit = (np.random.default_rng(fi).uniform(-5, 5, 2) if lt < 0.25 else (0, 0))
            img = paste(img, rg, W / 2 + jit[0], H * e.get('y', 0.5) + jit[1], scale=sc, alpha=a)
        elif st == 'aura':
            rg = text_rgba(e['text'], int(e.get('size', 96)), FONT_BIG, (200, 255, 200), (60, 255, 120), stroke=2)
            img = paste(img, rg, W / 2, H * e.get('y', 0.3) - lt * 80, scale=1, alpha=min(1, lt * 6) * min(1, (e['dur'] - lt) / 0.4))
        else:  # caption
            rg = text_rgba(e['text'], int(e.get('size', 64)), FONT_CAP, (255, 255, 255), (0, 0, 0), stroke=0)
            img = paste(img, rg, W / 2, H * e.get('y', 0.82), alpha=min(1, lt * 5) * min(1, (e['dur'] - lt) / 0.3))
    # the aura meter
    if plan.get('meter', True):
        total = info['duration']
        lvl = min(1.0, (t / total) ** 0.8 * 1.08)
        x0, y0, bw, bh = 60, 96, W - 120, 22
        img[y0 - 3:y0 + bh + 3, x0 - 3:x0 + bw + 3] = 0.05
        fill = int(bw * lvl)
        bar = np.zeros((bh, bw, 3), np.float32)
        grad = np.linspace(0, 1, bw)[None, :, None]
        bar[:] = np.array([1.0, 0.2, 0.75], np.float32) * (1 - grad) + np.array([0.3, 1.0, 0.4], np.float32) * grad
        img[y0:y0 + bh, x0:x0 + fill] = bar[:, :fill] * (0.85 + 0.3 * pulse)
        glow = np.zeros_like(img[y0 - 30:y0 + bh + 30])
        glow[30:30 + bh, x0:x0 + fill] = bar[:, :fill]
        img[y0 - 30:y0 + bh + 30] += fx.blur(glow, 14) * (0.6 + 0.8 * pulse)
        score = 'MAX' if lvl >= 1 else f'{int(lvl * 9999):,}'
        lab = text_rgba(f'AURA  {score}', 46, FONT_CAP, (255, 255, 255), (255, 40, 180))
        img = paste(img, lab, W / 2, y0 - 34)
    return img


# ---------- rendering ----------
def work(args):
    path, plan, info, mask_npz, a, b, seg_path, track_path = args
    masks = Masks(mask_npz) if mask_npz and os.path.exists(mask_npz) else None
    track = np.load(track_path) if track_path else None
    cap = cv2.VideoCapture(path)
    cap.set(cv2.CAP_PROP_POS_FRAMES, a)
    fps = info['fps']
    enc = subprocess.Popen([ffmpeg(), '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-',
                            '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', seg_path], stdin=subprocess.PIPE)
    for fi in range(a, b):
        ok, src = cap.read()
        if not ok:
            break
        enc.stdin.write(render_frame(src, fi, fi / fps, plan, info, masks, track).tobytes())
    enc.stdin.close(); enc.wait()
    return seg_path


def tracking(info, masks, plan):
    """smoothed subject position per frame, held steady within each shot"""
    n = info['frames']
    raw = np.array([subject_x(masks, i) for i in range(n)]) if masks is not None else np.tile([0.5, 0.45], (n, 1))
    out = raw.copy()
    cuts = [int(c * info['fps']) for c in info['shots']] + [n]
    for a, b in zip(cuts, cuts[1:]):
        seg = raw[a:b]
        if len(seg) == 0:
            continue
        med = np.median(seg, 0)
        sm = med.copy(); res = []
        for v in seg:  # slow follow, starting from the shot's median
            sm = sm * 0.94 + v * 0.06
            res.append(sm.copy())
        out[a:b] = np.array(res) * 0.6 + med * 0.4
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('input')
    ap.add_argument('--out', required=True)
    ap.add_argument('--plan')
    ap.add_argument('--auto', action='store_true')
    ap.add_argument('--workers', type=int, default=max(1, (os.cpu_count() or 2)))
    ap.add_argument('--gallery', action='store_true')
    ap.add_argument('--preview', action='store_true')
    ap.add_argument('--from', dest='t0', type=float, default=0)
    ap.add_argument('--to', dest='t1', type=float)
    ap.add_argument('--name', default='aura.mp4')
    ap.add_argument('--no-masks', action='store_true')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    path = os.path.abspath(a.input)
    fps, n, sw, sh = probe(path)
    info_path = os.path.join(a.out, 'info.json')
    if os.path.exists(info_path):
        info = json.load(open(info_path))
    else:
        print('finding shots and beats')
        shots, dur = find_shots(path, fps)
        info = {'path': path, 'fps': fps, 'frames': n, 'duration': dur, 'shots': shots, **find_beats(path, dur)}
        json.dump(info, open(info_path, 'w'), indent=1)
    info['path'] = path
    print(f"  {len(info['shots'])} shots, {info['bpm']} bpm, {len(info['beats'])} beats, {info['duration']:.1f}s")
    mask_npz = None if a.no_masks else os.path.join(a.out, 'masks.npz')
    if mask_npz:
        compute_masks(path, mask_npz)
    masks = Masks(mask_npz) if mask_npz else None
    if a.plan:
        plan = json.load(open(a.plan))
    else:
        plan = auto_plan(info, masks)
        json.dump(plan, open(os.path.join(a.out, 'plan.json'), 'w'), indent=1)
        print(f"  wrote {os.path.join(a.out, 'plan.json')}: {len(plan['segments'])} segments")
    track = tracking(info, masks, plan)
    track_path = os.path.join(a.out, 'track.npy')
    np.save(track_path, track)

    if a.gallery:  # every look on one frame
        cap = cv2.VideoCapture(path); fi = int(n * 0.35); cap.set(cv2.CAP_PROP_POS_FRAMES, fi); ok, src = cap.read()
        tiles = []
        for name in fx.LOOKS:
            p = {**plan, 'segments': [{'t0': 0, 't1': 1e9, 'look': name, 'frame': 'crop'}], 'events': [], 'meter': False, 'flash_cuts': False}
            im = render_frame(src, fi, fi / fps, p, {**info, 'beats': [], 'onsets': []}, masks, track)
            im = cv2.resize(im, (216, 384))
            cv2.putText(im, name, (8, 372), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)
            tiles.append(im)
        while len(tiles) % 6:
            tiles.append(np.zeros_like(tiles[0]))
        cv2.imwrite(os.path.join(a.out, 'gallery.jpg'), np.vstack([np.hstack(tiles[k:k + 6]) for k in range(0, len(tiles), 6)]))
        print('gallery.jpg written')
        return
    if a.preview:
        cap = cv2.VideoCapture(path); tiles = []
        for s in plan['segments']:
            t = s['t0'] + (s['t1'] - s['t0']) * 0.6
            fi = int(t * fps); cap.set(cv2.CAP_PROP_POS_FRAMES, fi); ok, src = cap.read()
            if not ok:
                continue
            im = cv2.resize(render_frame(src, fi, t, plan, info, masks, track), (180, 320))
            cv2.putText(im, f"{s['t0']:.1f} {s['look']}", (6, 312), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
            tiles.append(im)
        while len(tiles) % 8:
            tiles.append(np.zeros_like(tiles[0]))
        cv2.imwrite(os.path.join(a.out, 'preview.jpg'), np.vstack([np.hstack(tiles[k:k + 8]) for k in range(0, len(tiles), 8)]))
        print('preview.jpg written')
        return

    f0 = int(a.t0 * fps)
    f1 = min(n, int((a.t1 or info['duration']) * fps))
    per = math.ceil((f1 - f0) / a.workers)
    jobs = [(path, plan, info, mask_npz, f0 + k * per, min(f1, f0 + (k + 1) * per), os.path.join(a.out, f'_seg{k}.mp4'), track_path) for k in range(a.workers) if f0 + k * per < f1]
    t0 = time.time()
    print(f'rendering {f1 - f0} frames on {len(jobs)} workers')
    with ProcessPoolExecutor(len(jobs)) as ex:
        segs = list(ex.map(work, jobs))
    print(f'  frames done in {time.time() - t0:.0f}s')
    lst = os.path.join(a.out, '_segs.txt')
    open(lst, 'w').write('\n'.join(f"file '{os.path.abspath(s)}'" for s in segs))
    out = os.path.join(a.out, a.name)
    tw, th = plan.get('size', [1080, 1920])
    subprocess.run([ffmpeg(), '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-ss', str(a.t0), '-t', str((f1 - f0) / fps), '-i', path,
                    '-map', '0:v', '-map', '1:a?', '-vf', f'scale={tw}:{th}:flags=lanczos,unsharp=5:5:0.6', '-c:v', 'libx264', '-preset', 'medium', '-crf', str(plan.get('crf', 21)),
                    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], check=True)
    for s in segs:
        os.remove(s)
    os.remove(lst)
    print(f'done: {out}')


if __name__ == '__main__':
    main()
