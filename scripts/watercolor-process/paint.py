"""
Paint a photograph in watercolour, from blank paper to the last glaze, as a
vertical time-lapse video — ending on the photograph itself, pixel for pixel.

    pip install numpy opencv-python-headless pillow soundfile
    python paint.py reference.jpg out.mp4 [--title "…"] [--sub "…"] [--stills 5,20,40]

How it works. The reference is resized to the canvas, then turned into five
layers a painter would put down in order:

  0  a graphite sketch (an XDoG edge drawing of the photo),
  1  a first wash: big flat shapes (mean-shift), blurred, pale,
  2  mid tones: smaller shapes, less water,
  3  details: edge-preserving smoothing, nearly full strength,
  4  the last glazes: the photograph itself.

Each layer goes down stroke by stroke. Strokes start where the layer differs
most from what is already on the paper, run along the image's edges, go on
light to dark, and have ragged, noise-cut edges; rasterising them gives every
pixel the moment the brush reaches it, and a frame is the paper with each layer
revealed up to that moment. Washes keep the darker rims of pigment pooling
where one stroke dried against another, and granulate in the darks; the paper
grain shows through until the last glaze; the pencil shows through the pale
washes and is covered by the dark ones. When the last layer is complete the
canvas is the photograph, exactly, and the video says so by laying one over
the other.

The pencil and the brush are drawn at the head of whichever stroke is being
laid, and a soft score (a drone, pencil scratch, brush swishes, a bell) is
synthesised to go with it.
"""
import argparse
import math
import os
import subprocess
import sys

import cv2
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
FONTS = os.path.join(ROOT, 'public', 'fonts-sacred')

W, H = 1080, 1920
CW, CH = 1080, 1440          # the canvas: the reference's 3:4, full width
CY = 250                     # top of the canvas in the frame
FPS = 30

# the timeline, in seconds
T_SKETCH = (1.4, 8.4)
T_L1 = (8.4, 15.4)
T_L2 = (15.4, 23.0)
T_L3 = (23.0, 31.0)
T_L4 = (31.0, 38.6)
T_HOLD = 38.6
T_COMPARE = 41.6
T_END = 48.0

STEPS = [
    (0.0, '00', 'Blank paper', 'कोरा कागज़'),
    (T_SKETCH[0], '01', 'Pencil sketch', 'रेखाचित्र'),
    (T_L1[0], '02', 'First wash', 'पहली परत'),
    (T_L2[0], '03', 'Mid tones', 'मध्य रंग'),
    (T_L3[0], '04', 'Details', 'बारीकी'),
    (T_L4[0], '05', 'Final glazes', 'अंतिम परत'),
    (T_HOLD, '06', 'Finished', 'सम्पूर्ण'),
    (T_COMPARE, '07', 'Painting vs reference', 'चित्र और मूल'),
]


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def sstep(e0, e1, x):
    t = min(1.0, max(0.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


# ───────────────────────────────────────────────────────────── the layers

def load(path):
    im = cv2.imread(path, cv2.IMREAD_COLOR)
    if im is None:
        sys.exit(f'cannot read {path}')
    h, w = im.shape[:2]
    # cover-crop to 3:4, then resize
    want = CW / CH
    if w / h > want:
        nw = int(round(h * want))
        x0 = (w - nw) // 2
        im = im[:, x0:x0 + nw]
    else:
        nh = int(round(w / want))
        y0 = (h - nh) // 2
        im = im[y0:y0 + nh]
    im = cv2.resize(im, (CW, CH), interpolation=cv2.INTER_AREA)
    return im  # BGR uint8


def paper_texture(rng):
    """Cold-pressed paper: a warm white, a tooth at two scales, a few fibres."""
    n1 = cv2.GaussianBlur(rng.standard_normal((CH, CW)).astype(np.float32), (0, 0), 1.1)
    n2 = cv2.GaussianBlur(rng.standard_normal((CH, CW)).astype(np.float32), (0, 0), 4.0)
    n3 = cv2.GaussianBlur(rng.standard_normal((CH, CW)).astype(np.float32), (0, 0), 30.0)
    tooth = 1.0 + 0.045 * n1 / n1.std() + 0.03 * n2 / n2.std() + 0.012 * n3 / n3.std()
    fib = np.zeros((CH, CW), np.float32)
    for _ in range(260):
        x, y = rng.uniform(0, CW), rng.uniform(0, CH)
        a = rng.uniform(0, math.pi)
        L = rng.uniform(10, 50)
        pts = []
        for k in range(6):
            a += rng.normal(0, 0.25)
            x += math.cos(a) * L / 6
            y += math.sin(a) * L / 6
            pts.append((x, y))
        cv2.polylines(fib, [np.int32(pts)], False, float(rng.uniform(0.3, 1.0)), 1, cv2.LINE_AA)
    fib = cv2.GaussianBlur(fib, (0, 0), 0.6)
    tex = tooth * (1 - 0.05 * fib)
    return np.clip(tex, 0.8, 1.1).astype(np.float32)


PAPER = np.array([0.965, 0.95, 0.915], np.float32)  # RGB


def focus_map(cx=0.52, cy=0.42, r=0.42):
    """Where the subject is: 1 at its centre, falling away towards the crowd."""
    yy, xx = np.mgrid[0:CH, 0:CW].astype(np.float32)
    d = np.hypot((xx / CW - cx) / 1.0, (yy / CH - cy) * CH / CW / 1.0)
    return np.clip(1.0 - d / r, 0, 1).astype(np.float32)


def sketch_of(bgr, focus):
    """A graphite drawing, 0 (paper) to 1 (a hard line): contours of the flattened
    image, as a painter would block in shapes — full on the subject, a few
    marks for the crowd."""
    small = cv2.resize(bgr, (CW // 2, CH // 2), interpolation=cv2.INTER_AREA)
    flat = cv2.pyrMeanShiftFiltering(small, 10, 30, maxLevel=2)
    flat = cv2.resize(flat, (CW, CH), interpolation=cv2.INTER_CUBIC)
    g = cv2.cvtColor(flat, cv2.COLOR_BGR2GRAY)
    g = cv2.GaussianBlur(g, (0, 0), 1.6)
    edges = cv2.Canny(g, 22, 60, L2gradient=True).astype(np.float32) / 255
    edges = cv2.GaussianBlur(edges, (0, 0), 0.9)
    edges = np.clip(edges * 2.2, 0, 1)
    # a looser second line, as when a contour is gone over twice
    g2 = cv2.GaussianBlur(cv2.cvtColor(flat, cv2.COLOR_BGR2GRAY), (0, 0), 3.2)
    e2 = cv2.Canny(g2, 16, 40).astype(np.float32) / 255
    e2 = np.roll(cv2.GaussianBlur(e2, (0, 0), 1.0), (1, 2), (0, 1))
    line = np.maximum(edges, np.clip(e2 * 1.4, 0, 1) * 0.5)
    w = 0.18 + 0.82 * np.clip(focus * 1.6, 0, 1)
    return np.clip(line * w, 0, 1).astype(np.float32)


def to_rgbf(bgr):
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0


def wash_image(bgr, kind):
    """The target colour of a layer, as it will look on the paper."""
    if kind == 1:
        small = cv2.resize(bgr, (CW // 3, CH // 3), interpolation=cv2.INTER_AREA)
        ms = cv2.pyrMeanShiftFiltering(small, 18, 42, maxLevel=2)
        ms = cv2.resize(ms, (CW, CH), interpolation=cv2.INTER_CUBIC)
        base = cv2.GaussianBlur(to_rgbf(ms), (0, 0), 9)
        g = 0.3
    elif kind == 2:
        small = cv2.resize(bgr, (CW // 2, CH // 2), interpolation=cv2.INTER_AREA)
        ms = cv2.pyrMeanShiftFiltering(small, 9, 30, maxLevel=2)
        ms = cv2.resize(ms, (CW, CH), interpolation=cv2.INTER_CUBIC)
        base = cv2.GaussianBlur(to_rgbf(ms), (0, 0), 2.5)
        g = 0.62
    else:
        bf = cv2.bilateralFilter(bgr, 9, 45, 6)
        bf = cv2.bilateralFilter(bf, 7, 30, 4)
        base = to_rgbf(bf)
        g = 0.92
    # watercolour is transparent pigment on white: a lighter layer is the same
    # colour with less pigment, i.e. the transmittance raised to a power < 1
    return (PAPER * np.power(np.clip(base, 1e-3, 1), g)).astype(np.float32)


# ───────────────────────────────────────────────────────────── the strokes

class Strokes:
    """Brush strokes for one layer, rasterised into a map of arrival times."""

    def __init__(self, rng, target, before, guide, radius, count, t0, t1, *, edges_only=None, ragged=0.5, order_luma=True, stroke_len=(3, 8), focus=None):
        self.t0, self.t1 = t0, t1
        self.radius = radius
        T = np.full((CH, CW), np.float32(t1), np.float32)
        diff = np.abs(target - before).sum(2) if before is not None else np.ones((CH, CW), np.float32)
        diff = cv2.GaussianBlur(diff, (0, 0), max(1.0, radius * 0.5))
        imp = diff + 0.02 * diff.mean() + 1e-6
        if edges_only is not None:
            imp = edges_only + 1e-6
        p = (imp / imp.sum()).ravel()
        idx = rng.choice(CH * CW, size=count, p=p)
        ys, xs = np.divmod(idx, CW)
        # stroke direction follows the edges of the guide image
        gy = cv2.Sobel(guide, cv2.CV_32F, 0, 1, ksize=5)
        gx = cv2.Sobel(guide, cv2.CV_32F, 1, 0, ksize=5)
        s = max(2.0, radius * 0.8)
        gx = cv2.GaussianBlur(gx, (0, 0), s)
        gy = cv2.GaussianBlur(gy, (0, 0), s)
        luma = (target @ np.array([0.3, 0.59, 0.11], np.float32))
        block = cv2.resize(rng.random((max(2, CH // 180), max(2, CW // 180))).astype(np.float32), (CW, CH), interpolation=cv2.INTER_LINEAR)
        key = []
        for k in range(count):
            y, x = ys[k], xs[k]
            if focus is not None:
                kk = (1 - focus[y, x]) * 1.0 + block[y, x] * 0.15 + rng.random() * 0.08
            else:
                kk = (1 - luma[y, x]) * (0.55 if order_luma else 0.1) + block[y, x] * 0.3 + (y / CH) * 0.15 + rng.random() * 0.12
            key.append(kk)
        order = np.argsort(key)
        span = t1 - t0
        dur_base = span / count * 14
        self.paths = []
        self.times = []
        self.durs = []
        self.cols = []
        # the ragged edge: a noise field the stroke's soft mask is cut against
        rag = cv2.GaussianBlur(rng.random((CH, CW)).astype(np.float32), (0, 0), max(1.0, radius * 0.18))
        rag = (rag - rag.mean()) / (rag.std() + 1e-6)
        for rank, k in enumerate(order):
            y, x = float(ys[k]), float(xs[k])
            ang = math.atan2(gy[int(y), int(x)], gx[int(y), int(x)]) + math.pi / 2 + rng.normal(0, 0.35)
            if rng.random() < 0.5:
                ang += math.pi
            L = radius * rng.uniform(*stroke_len)
            n = 7
            pts = [(x, y)]
            for j in range(n):
                ang += rng.normal(0, 0.18)
                x += math.cos(ang) * L / n
                y += math.sin(ang) * L / n
                pts.append((x, y))
            t_start = t0 + (rank / count) * span * 0.94
            dur = min(dur_base * rng.uniform(0.7, 1.3), span * 0.2)
            r = radius * rng.uniform(0.75, 1.2)
            self._raster(T, pts, r, t_start, dur, rag, ragged)
            self.paths.append(pts)
            self.times.append(t_start)
            self.durs.append(dur)
            cy, cx = int(min(CH - 1, max(0, pts[0][1]))), int(min(CW - 1, max(0, pts[0][0])))
            self.cols.append(tuple(float(v) for v in target[cy, cx]))
        # whatever no stroke reached is painted just after its neighbours
        miss = T >= t1 - 1e-4
        k = max(3, int(radius * 1.5)) | 1
        ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
        for _ in range(40):
            if not miss.any():
                break
            grown = cv2.erode(T, ker) + span * 0.015
            T = np.where(miss, np.minimum(grown, t1), T).astype(np.float32)
            miss = T >= t1 - 1e-4
        self.T = np.minimum(T, t1 - span * 0.02).astype(np.float32) if edges_only is None else T
        self.times = np.array(self.times)

    @staticmethod
    def _raster(T, pts, r, t_start, dur, rag, ragged):
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        pad = int(r * 1.6) + 2
        x0, x1 = max(0, int(min(xs)) - pad), min(CW, int(max(xs)) + pad)
        y0, y1 = max(0, int(min(ys)) - pad), min(CH, int(max(ys)) + pad)
        if x1 <= x0 or y1 <= y0:
            return
        sub = T[y0:y1, x0:x1]
        rg = rag[y0:y1, x0:x1]
        nseg = len(pts) - 1
        for j in range(nseg):
            m = np.zeros(sub.shape, np.float32)
            a = (int(round(pts[j][0] - x0)), int(round(pts[j][1] - y0)))
            b = (int(round(pts[j + 1][0] - x0)), int(round(pts[j + 1][1] - y0)))
            # the stroke thins at its two ends
            taper = 0.55 + 0.45 * math.sin(math.pi * (j + 0.5) / nseg)
            cv2.line(m, a, b, 1.0, max(1, int(r * 2 * taper)), cv2.LINE_AA)
            if r > 3:
                m = cv2.GaussianBlur(m, (0, 0), r * 0.3)
            cut = m + ragged * 0.18 * rg
            on = cut > 0.45
            tv = t_start + dur * (j + 1) / nseg
            np.minimum(sub, np.where(on, np.float32(tv), sub), out=sub)

    def mask(self, t, fade=0.35, soft=None):
        if t <= self.t0:
            return None
        if t >= self.t1 + fade:
            return 1.0
        m = np.clip((t - self.T) / fade, 0, 1).astype(np.float32)
        s = soft if soft is not None else max(0.8, self.radius * 0.12)
        return cv2.GaussianBlur(m, (0, 0), s)

    def brush(self, t):
        """Where the brush is: the head of the latest stroke begun."""
        if t < self.t0 or t > self.t1:
            return None
        k = int(np.searchsorted(self.times, t)) - 1
        if k < 0:
            return None
        f = min(1.0, (t - self.times[k]) / self.durs[k])
        pts = self.paths[k]
        pos = f * (len(pts) - 1)
        j = min(len(pts) - 2, int(pos))
        u = pos - j
        x = pts[j][0] * (1 - u) + pts[j + 1][0] * u
        y = pts[j][1] * (1 - u) + pts[j + 1][1] * u
        dx = pts[j + 1][0] - pts[j][0]
        dy = pts[j + 1][1] - pts[j][1]
        return x, y, math.atan2(dy, dx), self.cols[k], f < 1.0


def pooling_rims(T, strength, sigma):
    """Where one stroke dried against another, pigment collects in a darker rim."""
    gx = cv2.Sobel(T, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(T, cv2.CV_32F, 0, 1, ksize=3)
    e = np.clip(np.hypot(gx, gy) * 4.0, 0, 1)
    e = cv2.GaussianBlur(e, (0, 0), sigma)
    e = e / (e.max() + 1e-6)
    return (1 - strength * e)[..., None].astype(np.float32)


# ───────────────────────────────────────────────────────────── drawing tools

def font(name, size):
    p = os.path.join(FONTS, name)
    try:
        return ImageFont.truetype(p, size, layout_engine=ImageFont.Layout.RAQM)
    except Exception:
        return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf', size)


F_TITLE = font('cinzel-latin-600-normal.woff2', 50)
F_SMALL = font('cinzel-latin-400-normal.woff2', 22)
F_STEP = font('cinzel-latin-700-normal.woff2', 30)
F_DEVA = font('tiro-devanagari-sanskrit-devanagari-400-normal.woff2', 40)
F_DEVA_S = font('tiro-devanagari-sanskrit-devanagari-400-normal.woff2', 28)
F_ITAL = font('cormorant-garamond-latin-400-italic.woff2', 30)
INK = (240, 232, 214)
GOLD = (224, 180, 96)
DIM = (170, 160, 146)


def spaced(d, xy, text, f, fill, ls=0.0, anchor='mm'):
    if ls == 0:
        d.text(xy, text, font=f, fill=fill, anchor=anchor)
        return
    widths = [d.textlength(ch, font=f) for ch in text]
    total = sum(widths) + ls * (len(text) - 1)
    x = xy[0] - total / 2 if anchor[0] == 'm' else xy[0]
    for ch, w in zip(text, widths):
        d.text((x, xy[1]), ch, font=f, fill=fill, anchor='l' + anchor[1])
        x += w + ls


def draw_pencil(d, x, y, ang):
    # a yellow hexagonal pencil, held from the lower right
    a = 1.02 + 0.06 * math.sin(ang)
    ux, uy = math.cos(a), math.sin(a)   # from the tip toward the hand
    px, py = -uy, ux
    L, w = 520, 13
    tip = (x, y)
    cone = (x + ux * 46, y + uy * 46)
    tail = (x + ux * L, y + uy * L)
    d.polygon([tip, (cone[0] + px * w, cone[1] + py * w), (cone[0] - px * w, cone[1] - py * w)], fill=(226, 196, 150))
    g = (x + ux * 14, y + uy * 14)
    d.polygon([tip, (g[0] + px * 4, g[1] + py * 4), (g[0] - px * 4, g[1] - py * 4)], fill=(60, 60, 64))
    body = [(cone[0] + px * w, cone[1] + py * w), (tail[0] + px * w, tail[1] + py * w), (tail[0] - px * w, tail[1] - py * w), (cone[0] - px * w, cone[1] - py * w)]
    d.polygon(body, fill=(236, 186, 40))
    d.line([(cone[0] + px * w * 0.3, cone[1] + py * w * 0.3), (tail[0] + px * w * 0.3, tail[1] + py * w * 0.3)], fill=(250, 214, 90), width=5)
    d.line([(cone[0] - px * w * 0.6, cone[1] - py * w * 0.6), (tail[0] - px * w * 0.6, tail[1] - py * w * 0.6)], fill=(200, 150, 30), width=4)


def draw_brush(d, x, y, ang, col, r, wet):
    # a round sable brush from the lower right: tip, silver ferrule, dark handle
    a = 1.0 + 0.08 * math.sin(ang * 2)
    ux, uy = math.cos(a), math.sin(a)   # from the tip toward the hand
    px, py = -uy, ux
    bw = max(7.0, min(26.0, r * 0.55))
    tl = bw * 3.2
    base = (x + ux * tl, y + uy * tl)
    c = tuple(int(255 * v) for v in col)
    dark = tuple(int(v * 0.55) for v in c)
    # the bristles, a teardrop
    pts = [(x, y)]
    for k in range(1, 12):
        s = k / 11
        wdt = bw * math.sin(min(1.0, s * 1.15) * math.pi / 2) * (1 - 0.15 * s)
        pts.append((x + ux * tl * s + px * wdt, y + uy * tl * s + py * wdt))
    for k in range(11, 0, -1):
        s = k / 11
        wdt = bw * math.sin(min(1.0, s * 1.15) * math.pi / 2) * (1 - 0.15 * s)
        pts.append((x + ux * tl * s - px * wdt, y + uy * tl * s - py * wdt))
    d.polygon(pts, fill=(64, 44, 30))
    # paint loaded on the front two thirds
    pts2 = [(x, y)]
    for k in range(1, 8):
        s = k / 11
        wdt = bw * 0.92 * math.sin(min(1.0, s * 1.15) * math.pi / 2)
        pts2.append((x + ux * tl * s + px * wdt, y + uy * tl * s + py * wdt))
    for k in range(7, 0, -1):
        s = k / 11
        wdt = bw * 0.92 * math.sin(min(1.0, s * 1.15) * math.pi / 2)
        pts2.append((x + ux * tl * s - px * wdt, y + uy * tl * s - py * wdt))
    d.polygon(pts2, fill=c if wet else dark)
    fl = bw * 2.6
    f0, f1 = base, (base[0] + ux * fl, base[1] + uy * fl)
    fw = bw * 0.95
    d.polygon([(f0[0] + px * fw, f0[1] + py * fw), (f1[0] + px * fw * 0.9, f1[1] + py * fw * 0.9), (f1[0] - px * fw * 0.9, f1[1] - py * fw * 0.9), (f0[0] - px * fw, f0[1] - py * fw)], fill=(186, 188, 194))
    d.line([(f0[0] + px * fw * 0.4, f0[1] + py * fw * 0.4), (f1[0] + px * fw * 0.4, f1[1] + py * fw * 0.4)], fill=(236, 238, 242), width=3)
    hl = 560
    h1 = (f1[0] + ux * hl, f1[1] + uy * hl)
    hw0, hw1 = fw * 0.9, fw * 0.6
    d.polygon([(f1[0] + px * hw0, f1[1] + py * hw0), (h1[0] + px * hw1, h1[1] + py * hw1), (h1[0] - px * hw1, h1[1] - py * hw1), (f1[0] - px * hw0, f1[1] - py * hw0)], fill=(120, 30, 28))
    d.line([(f1[0] + px * hw0 * 0.35, f1[1] + py * hw0 * 0.35), (h1[0] + px * hw1 * 0.35, h1[1] + py * hw1 * 0.35)], fill=(170, 60, 50), width=4)


# ───────────────────────────────────────────────────────────── the sound

def score(n_sec, sketch, layers, sr=48000):
    rng = np.random.default_rng(11)
    N = int(n_sec * sr)
    t = np.arange(N) / sr
    out = np.zeros(N, np.float32)
    # a warm drone that changes chord with each stage
    chords = [(0, [146.83, 220.0, 293.66]), (T_L1[0], [130.81, 196.0, 329.63]), (T_L2[0], [146.83, 220.0, 369.99]),
              (T_L3[0], [123.47, 185.0, 293.66]), (T_L4[0], [146.83, 220.0, 293.66, 440.0]), (T_COMPARE, [146.83, 220.0, 293.66, 369.99])]
    for i, (c0, fs) in enumerate(chords):
        c1 = chords[i + 1][0] if i + 1 < len(chords) else n_sec
        i0, i1 = int(c0 * sr), min(N, int((c1 + 1.2) * sr))
        tt = np.arange(i1 - i0) / sr
        env = np.clip(tt / 1.2, 0, 1) * np.clip(((i1 - i0) / sr - tt) / 1.2, 0, 1)
        for k, f in enumerate(fs):
            out[i0:i1] += (0.05 / (1 + k * 0.4)) * env * (np.sin(2 * np.pi * f * tt + 0.3 * np.sin(2 * np.pi * 0.2 * tt + k)) + 0.3 * np.sin(4 * np.pi * f * tt))
    # soft plucks on the beat, a little melody
    notes = [587.33, 659.25, 739.99, 880.0, 739.99, 659.25, 587.33, 493.88]
    for i, bt in enumerate(np.arange(T_SKETCH[0], T_HOLD, 1.35)):
        f = notes[i % len(notes)]
        i0 = int(bt * sr)
        n = int(1.8 * sr)
        tt = np.arange(min(n, N - i0)) / sr
        out[i0:i0 + len(tt)] += 0.035 * np.sin(2 * np.pi * f * tt) * np.exp(-tt * 2.6) * (1 - np.exp(-tt * 200))
    # pencil scratching while the sketch goes down
    i0, i1 = int(sketch.t0 * sr), int(sketch.t1 * sr)
    nz = rng.standard_normal(i1 - i0).astype(np.float32)
    b = cv2.GaussianBlur(nz.reshape(1, -1), (0, 0), 2).ravel()
    hp = nz - b
    tt = np.arange(i1 - i0) / sr
    gate = 0.5 + 0.5 * np.sin(2 * np.pi * 3.1 * tt + np.sin(2 * np.pi * 0.7 * tt) * 3)
    out[i0:i1] += 0.05 * hp * gate ** 2
    # brush swishes: one per few strokes, louder for the big brushes
    for st, gain, every in layers:
        for k in range(0, len(st.times), every):
            i0 = int(st.times[k] * sr)
            n = int(0.35 * sr)
            if i0 + n >= N:
                continue
            tt = np.arange(n) / sr
            nz = rng.standard_normal(n).astype(np.float32)
            lp = cv2.GaussianBlur(nz.reshape(1, -1), (0, 0), 6).ravel()
            env = np.sin(np.pi * tt / 0.35) ** 2
            out[i0:i0 + n] += gain * lp * env
    # a bell when it is finished, and again when they match
    for at, g in ((T_HOLD, 0.12), (T_COMPARE + 3.2, 0.1)):
        i0 = int(at * sr)
        n = min(int(4 * sr), N - i0)
        tt = np.arange(n) / sr
        out[i0:i0 + n] += g * sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * dcy) for f, dcy in ((587.33, 0.8), (1480, 1.4), (2640, 2.2)))
    fade = np.clip((n_sec - t) / 1.5, 0, 1) * np.clip(t / 0.6, 0, 1)
    out *= fade
    out = np.tanh(out * 1.6) / 1.6
    out /= np.max(np.abs(out)) + 1e-9
    out *= 0.85
    # a little stereo width
    d = int(0.011 * sr)
    L = out
    R = np.concatenate([np.zeros(d, np.float32), out[:-d]])
    return np.stack([L, R * 0.9 + L * 0.1], 1)


# ───────────────────────────────────────────────────────────── the film

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('reference')
    ap.add_argument('out')
    ap.add_argument('--title', default='GANPATI BAPPA MORYA')
    ap.add_argument('--deva', default='गणपती बाप्पा मोरया')
    ap.add_argument('--sub', default='watercolour · from blank paper')
    ap.add_argument('--stills', default='')
    ap.add_argument('--ffmpeg', default=os.environ.get('FFMPEG', 'ffmpeg'))
    a = ap.parse_args()

    rng = np.random.default_rng(5)
    bgr = load(a.reference)
    photo = to_rgbf(bgr)
    photo8 = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    tex = paper_texture(rng)[..., None]
    guide = cv2.GaussianBlur(cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255, (0, 0), 2)
    print('layers…', flush=True)
    focus = focus_map()
    sk = sketch_of(bgr, focus)
    l1 = wash_image(bgr, 1)
    l2 = wash_image(bgr, 2)
    l3 = wash_image(bgr, 3)
    paper = np.broadcast_to(PAPER, (CH, CW, 3)).astype(np.float32)

    print('strokes…', flush=True)
    s0 = Strokes(rng, np.repeat(sk[..., None], 3, 2), None, guide, 3, 3600, *T_SKETCH, edges_only=cv2.GaussianBlur(sk, (0, 0), 1) ** 1.5, ragged=0.0, order_luma=False, stroke_len=(5, 14), focus=focus)
    s1 = Strokes(rng, l1, paper, guide, 60, 900, *T_L1, ragged=0.9)
    s2 = Strokes(rng, l2, l1, guide, 26, 2200, *T_L2, ragged=0.8)
    s3 = Strokes(rng, l3, l2, guide, 12, 3400, *T_L3, ragged=0.6)
    s4 = Strokes(rng, photo, l3, guide, 5, 6000, *T_L4, ragged=0.3)

    # the washes keep their pooled rims and granulate in the darks
    gran = cv2.GaussianBlur(rng.standard_normal((CH, CW)).astype(np.float32), (0, 0), 1.0)
    gran = (gran / gran.std())[..., None]
    l1 = l1 * pooling_rims(s1.T, 0.1, 3.0) * (1 - 0.05 * gran * (1 - l1))
    l2 = l2 * pooling_rims(s2.T, 0.08, 2.0) * (1 - 0.06 * gran * (1 - l2))
    l3 = l3 * pooling_rims(s3.T, 0.06, 1.0)
    graphite = np.array([0.33, 0.33, 0.36], np.float32)

    # the static chrome, drawn once
    bg = Image.new('RGB', (W, H), (14, 11, 10))
    d = ImageDraw.Draw(bg)
    for i in range(CY):
        v = int(14 + 10 * (1 - i / CY))
        d.line([(0, i), (W, i)], fill=(v, v - 3, v - 4))
    spaced(d, (W / 2, 78), a.title, F_TITLE, INK, ls=9)
    d.text((W / 2, 140), a.deva, font=F_DEVA, fill=GOLD, anchor='mm')
    spaced(d, (W / 2, 196), a.sub.upper(), F_SMALL, DIM, ls=6)
    # a shadow under the paper
    sh = Image.new('L', (W, H), 0)
    ImageDraw.Draw(sh).rectangle([12, CY + 16, W - 12, CY + CH + 18], fill=150)
    sh = sh.filter(ImageFilter.GaussianBlur(18))
    bg = Image.composite(Image.new('RGB', (W, H), (0, 0, 0)), bg, sh)
    bg_np = np.asarray(bg).copy()

    stills = [float(x) for x in a.stills.split(',') if x]
    nframes = int(T_END * FPS)
    ff = None
    tmp_video = a.out + '.video.mp4'
    if not stills:
        ff = subprocess.Popen([a.ffmpeg, '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                               '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', tmp_video], stdin=subprocess.PIPE)

    def canvas_at(t):
        """The painting at time t, as float RGB."""
        m0 = s0.mask(t, fade=0.25, soft=0.6)
        c = paper.copy()
        m1 = s1.mask(t)
        if m1 is not None:
            m = m1 if np.isscalar(m1) else m1[..., None]
            c = c + (l1 - c) * m
        m2 = s2.mask(t)
        if m2 is not None:
            m = m2 if np.isscalar(m2) else m2[..., None]
            c = c + (l2 - c) * m
        m3 = s3.mask(t)
        if m3 is not None:
            m = m3 if np.isscalar(m3) else m3[..., None]
            c = c + (l3 - c) * m
        # graphite under the washes: visible through the pale ones, lost under the dark
        if m0 is not None:
            vis = sk if np.isscalar(m0) else sk * m0
            cover = 0.0 if m3 is None else (m3 if np.isscalar(m3) else m3)
            cover2 = 0.0 if m2 is None else (m2 if np.isscalar(m2) else m2)
            vis = vis * (1 - 0.55 * cover2) * (1 - 0.9 * cover) * 0.75
            c = c * (1 - vis[..., None]) + graphite * vis[..., None]
        m4 = s4.mask(t, fade=0.3)
        if m4 is not None:
            m = m4 if np.isscalar(m4) else m4[..., None]
            c = c + (photo - c) * m
        # the paper's grain, until the last glaze has covered it
        g = 1.0 if m4 is None else (m4 if np.isscalar(m4) else m4[..., None])
        if not (np.isscalar(g) and g >= 1.0):
            c = c * (tex + (1 - tex) * g)
        return c

    def tool_at(t):
        for st, kind in ((s0, 'pencil'), (s1, 'brush'), (s2, 'brush'), (s3, 'brush'), (s4, 'brush')):
            b = st.brush(t)
            if b:
                return kind, b, st.radius
        return None

    def frame(t):
        if t >= T_L4[1] + 0.4:
            canvas = photo8.copy()
            painted = photo8
        else:
            canvas = (np.clip(canvas_at(t), 0, 1) * 255 + 0.5).astype(np.uint8)
            painted = canvas
        img = bg_np.copy()
        # the comparison: a divider sweeps across, painting on the left, reference on the right
        if t >= T_COMPARE:
            u = sstep(T_COMPARE + 0.4, T_COMPARE + 2.8, t)
            back = sstep(T_COMPARE + 3.2, T_COMPARE + 4.6, t)
            xdiv = int(CW * (1 - 0.5 * u - 0.0 * back))
            comp = painted.copy()
            comp[:, xdiv:] = photo8[:, xdiv:]
            canvas = comp
        img[CY:CY + CH] = canvas
        pil = Image.fromarray(img)
        dr = ImageDraw.Draw(pil)
        # the tool
        tl = tool_at(t)
        if tl:
            kind, (x, y, ang, col, wet), r = tl
            if kind == 'pencil':
                draw_pencil(dr, x, y + CY, ang)
            else:
                draw_brush(dr, x, y + CY, ang, col, r, wet)
        # the step caption
        step = [s for s in STEPS if s[0] <= t][-1]
        k = sstep(step[0], step[0] + 0.5, t)
        a8 = int(255 * k)
        y0 = CY + CH + 70
        spaced(dr, (W / 2, y0), f'{step[1]}  ·  {step[2].upper()}', F_STEP, tuple(int(v * k + 14 * (1 - k)) for v in INK), ls=6)
        dr.text((W / 2, y0 + 50), step[3], font=F_DEVA_S, fill=tuple(int(v * k + 14 * (1 - k)) for v in GOLD), anchor='mm')
        # progress: painting time, as a time-lapse clock
        if t < T_HOLD:
            f = max(0.0, (t - T_SKETCH[0]) / (T_L4[1] - T_SKETCH[0]))
            mins = int(f * 6 * 60 + 0.5)
            clock = f'{mins // 60}h {mins % 60:02d}m of painting'
        else:
            clock = '6h 00m of painting'
        dr.text((W / 2, y0 + 106), clock, font=F_ITAL, fill=DIM, anchor='mm')
        x0, x1 = 140, W - 140
        yb = y0 + 146
        dr.line([(x0, yb), (x1, yb)], fill=(60, 52, 46), width=2)
        pf = min(1.0, max(0.0, (t - T_SKETCH[0]) / (T_L4[1] - T_SKETCH[0])))
        dr.line([(x0, yb), (x0 + (x1 - x0) * pf, yb)], fill=GOLD, width=2)
        if t >= T_COMPARE:
            u = sstep(T_COMPARE + 0.4, T_COMPARE + 2.8, t)
            xdiv = int(CW * (1 - 0.5 * u))
            dr.line([(xdiv, CY), (xdiv, CY + CH)], fill=(255, 255, 255), width=3)
            la = sstep(T_COMPARE + 1.0, T_COMPARE + 2.0, t)
            if la > 0:
                c = tuple(int(255 * la) for _ in range(3))
                spaced(dr, (xdiv - 150, CY + 44), 'PAINTING', F_SMALL, c, ls=5)
                spaced(dr, (xdiv + 150, CY + 44), 'REFERENCE', F_SMALL, c, ls=5)
            ma = sstep(T_COMPARE + 3.2, T_COMPARE + 4.0, t)
            if ma > 0:
                diff = int(np.abs(painted.astype(np.int16) - photo8.astype(np.int16)).max())
                box = (W / 2 - 250, CY + CH - 150, W / 2 + 250, CY + CH - 50)
                ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
                od = ImageDraw.Draw(ov)
                od.rounded_rectangle(box, 18, fill=(8, 6, 6, int(200 * ma)), outline=GOLD + (int(255 * ma),), width=2)
                spaced(od, (W / 2, CY + CH - 118), 'PIXEL DIFFERENCE', F_SMALL, INK + (int(255 * ma),), ls=5)
                od.text((W / 2, CY + CH - 78), f'{diff} of 255  ·  a perfect match', font=F_ITAL, fill=GOLD + (int(255 * ma),), anchor='mm')
                pil = Image.alpha_composite(pil.convert('RGBA'), ov).convert('RGB')
        return np.asarray(pil)

    if stills:
        os.makedirs(a.out, exist_ok=True)
        for t in stills:
            Image.fromarray(frame(t)).save(os.path.join(a.out, f'still_{t:05.1f}.jpg'), quality=88)
            print('still', t, flush=True)
        return

    for i in range(nframes):
        t = i / FPS
        ff.stdin.write(frame(t).tobytes())
        if i % 60 == 0:
            print(f'{i}/{nframes}', flush=True)
    ff.stdin.close()
    ff.wait()

    wav = a.out + '.wav'
    sf.write(wav, score(T_END, s0, [(s1, 0.09, 1), (s2, 0.05, 3), (s3, 0.03, 9), (s4, 0.02, 25)]), 48000)
    subprocess.check_call([a.ffmpeg, '-v', 'error', '-y', '-i', tmp_video, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k',
                           '-shortest', '-movflags', '+faststart', a.out])
    os.remove(tmp_video)
    os.remove(wav)
    print('wrote', a.out, flush=True)


if __name__ == '__main__':
    main()
