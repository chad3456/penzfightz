"""
The effect library for aura edits. Every look is a function

    look(img, c) -> img

where img is a float32 BGR frame in 0..1 and c is the frame context
(time, progress through the shot, beat phase, person mask, frame index, rng).
Looks only touch pixels; framing, beat punches, text and transitions live in
aura.py. Add a look by writing a function and listing it in LOOKS.
"""
import math
import cv2
import numpy as np

# ---------- building blocks ----------
def lum(img):
    return img[..., 0] * 0.114 + img[..., 1] * 0.587 + img[..., 2] * 0.299


def blur(img, r):
    """fast wide blur: downsample, blur, upsample"""
    if r <= 0:
        return img
    if img.ndim == 3 and img.shape[2] == 1:
        return blur(img[..., 0], r)[..., None]
    h, w = img.shape[:2]
    k = max(1, int(r // 6))
    small = cv2.resize(img, (max(1, w // k), max(1, h // k)), interpolation=cv2.INTER_AREA)
    s = max(1.0, r / k)
    small = cv2.GaussianBlur(small, (0, 0), s)
    return cv2.resize(small, (w, h), interpolation=cv2.INTER_LINEAR)


def bloom(img, thresh=0.6, strength=0.9, radius=28, tint=None):
    L = lum(img)
    bright = img * np.clip((L - thresh) / (1 - thresh + 1e-6), 0, 1)[..., None]
    g = blur(bright, radius) + 0.5 * blur(bright, radius * 3)
    if tint is not None:
        g = g * np.array(tint, np.float32)
    return img + g * strength


def curve(img, contrast=1.2, pivot=0.45, lift=0.0, gamma=1.0):
    out = (img - pivot) * contrast + pivot
    out = np.clip(out, 0, 1) ** gamma
    return out * (1 - lift) + lift


def saturate(img, s):
    L = lum(img)[..., None]
    return L + (img - L) * s


def split_tone(img, shadow, highlight, amount=0.5):
    L = lum(img)[..., None]
    sh = np.array(shadow, np.float32)
    hi = np.array(highlight, np.float32)
    tone = sh * (1 - L) + hi * L
    return img * (1 - amount) + (img * tone * 2) * amount


def duotone(img, dark, light, gamma=1.0):
    L = np.clip(lum(img), 0, 1)[..., None] ** gamma
    return np.array(dark, np.float32) * (1 - L) + np.array(light, np.float32) * L


def vignette(img, strength=0.55, power=2.2):
    h, w = img.shape[:2]
    y, x = np.ogrid[-1:1:complex(0, h), -1:1:complex(0, w)]
    v = 1 - strength * np.clip(np.sqrt(x * x * 0.8 + y * y) / 1.25, 0, 1) ** power
    return img * v[..., None].astype(np.float32)


def grain(img, c, amount=0.06, size=1):
    h, w = img.shape[:2]
    n = c.rng.standard_normal((h // size, w // size)).astype(np.float32)
    if size > 1:
        n = cv2.resize(n, (w, h), interpolation=cv2.INTER_LINEAR)
    return img + n[..., None] * amount


def chroma(img, amount=0.006):
    """radial chromatic aberration: red scaled out, blue scaled in"""
    h, w = img.shape[:2]
    out = img.copy()
    for ch, s in ((2, 1 + amount), (0, 1 - amount)):
        M = cv2.getRotationMatrix2D((w / 2, h / 2), 0, s)
        out[..., ch] = cv2.warpAffine(img[..., ch], M, (w, h), borderMode=cv2.BORDER_REFLECT)
    return out


def rgb_shift(img, px):
    out = img.copy()
    px = int(px)
    if px:
        out[..., 2] = np.roll(img[..., 2], px, axis=1)
        out[..., 0] = np.roll(img[..., 0], -px, axis=1)
    return out


def screen(a, b):
    return 1 - (1 - a) * (1 - b)


def mask_or_center(c, img):
    if c.mask is not None:
        return c.mask
    h, w = img.shape[:2]
    y, x = np.ogrid[-1:1:complex(0, h), -1:1:complex(0, w)]
    return np.clip(1.2 - np.sqrt(x * x * 1.6 + (y * 0.9) ** 2), 0, 1).astype(np.float32)


def rim(mask, width=14, outer=60):
    """a soft band just outside the person"""
    m8 = (np.clip(mask, 0, 1) * 255).astype(np.uint8)
    k = max(3, int(width) | 1)
    dil = cv2.dilate(m8, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k * 2 + 1, k * 2 + 1))).astype(np.float32) / 255
    band = np.clip(dil - mask, 0, 1)
    return np.clip(band + blur(band[..., None], outer)[..., 0] * 1.6, 0, 1)


def flow_noise(h, w, t, scale=0.012, seed=3):
    """smooth moving noise field (sum of sines), for flames and heat"""
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.random.default_rng(seed)
    n = np.zeros((h, w), np.float32)
    for k in range(4):
        a, b, p = r.uniform(0.5, 1.5), r.uniform(0.5, 1.5), r.uniform(0, 6.28)
        f = scale * (k + 1)
        n += np.sin(x * f * a + t * (1.3 + k) + p) * np.cos(y * f * b - t * (2.1 + k) + p * 1.7) / (k + 1)
    return n


# ---------- looks ----------
def teal_orange(img, c):
    img = curve(img, 1.25, 0.42)
    img = split_tone(img, (0.62, 0.52, 0.30), (0.30, 0.55, 0.78), 0.55)  # BGR: teal shadows, orange highlights
    img = saturate(img, 1.25)
    img = bloom(img, 0.55, 0.7, 30, (0.6, 0.8, 1.0))
    return vignette(img, 0.5)


def noir_red(img, c):
    B, G, R = img[..., 0], img[..., 1], img[..., 2]
    red = np.clip((R - np.maximum(G, B) * 1.25) * 6, 0, 1)
    red = blur(red[..., None], 3)[..., 0]
    gray = curve(lum(img)[..., None].repeat(3, 2), 1.55, 0.4)
    keep = saturate(img, 1.6) * np.array([0.6, 0.6, 1.35], np.float32)
    out = gray * (1 - red[..., None]) + keep * red[..., None]
    out = bloom(out, 0.6, 0.6, 24, (0.5, 0.5, 1.0))
    return vignette(grain(out, c, 0.05), 0.6)


def cyberpunk(img, c):
    L = lum(img)[..., None]
    out = duotone(img, (0.28, 0.02, 0.10), (0.95, 0.95, 0.35), 0.9)  # deep purple -> cyan-white
    out = out * 0.55 + saturate(img, 1.6) * np.array([1.3, 0.75, 1.15], np.float32) * 0.45 + L * 0.1
    out = bloom(out, 0.5, 1.1, 34, (1.0, 0.4, 1.0))
    out = chroma(out, 0.008 + 0.006 * c.pulse)
    h = out.shape[0]
    out[::3] *= 0.92  # scanlines
    return vignette(out, 0.45)


def golden_aura(img, c):
    m = mask_or_center(c, img)
    out = curve(img, 1.2, 0.4)
    out = split_tone(out, (0.45, 0.42, 0.40), (0.25, 0.62, 1.0), 0.5)
    out = out * (0.55 + 0.45 * m[..., None])  # darker world, lit person
    r = rim(m, 10, 70)
    hfield = flow_noise(m.shape[0] // 4, m.shape[1] // 4, c.t * 1.4, scale=0.048)
    dx = cv2.resize(hfield, (m.shape[1], m.shape[0]))
    ys, xs = np.mgrid[0:m.shape[0], 0:m.shape[1]].astype(np.float32)
    mx = (xs + dx * 10).astype(np.float32)
    my = (ys + 22 + dx * 14 + 18 * math.sin(c.t * 3)).astype(np.float32)
    flame = cv2.remap(r, mx, my, cv2.INTER_LINEAR)  # licks upward
    glow = np.maximum(r, flame * 0.85)[..., None] * np.array([0.25, 0.75, 1.0], np.float32)
    out = out + glow * (0.9 + 0.5 * c.pulse)
    out = bloom(out, 0.55, 0.9, 30, (0.4, 0.75, 1.0))
    return vignette(out, 0.55)


def neon_aura(img, c):
    m = mask_or_center(c, img)
    out = saturate(curve(img, 1.3, 0.4), 0.35) * (0.35 + 0.65 * m[..., None])
    hue = (c.t * 60) % 180
    col = cv2.cvtColor(np.uint8([[[hue, 255, 255]]]), cv2.COLOR_HSV2BGR)[0, 0].astype(np.float32) / 255
    col2 = cv2.cvtColor(np.uint8([[[(hue + 60) % 180, 255, 255]]]), cv2.COLOR_HSV2BGR)[0, 0].astype(np.float32) / 255
    r1 = rim(m, 6, 22)
    r2 = rim(m, 24, 90)
    out = out + r1[..., None] * col * 1.4 + r2[..., None] * col2 * (0.7 + 0.6 * c.pulse)
    return vignette(bloom(out, 0.6, 0.6, 20), 0.5)


def thermal(img, c):
    L = np.clip(lum(img) * 1.8, 0, 1) ** 0.8
    if c.mask is not None:
        L = np.clip(L * 0.7 + c.mask * 0.22 + blur(c.mask[..., None], 30)[..., 0] * 0.12, 0, 1)
    u8 = (np.clip(curve(L, 1.15, 0.4), 0, 1) * 255).astype(np.uint8)
    out = cv2.applyColorMap(u8, cv2.COLORMAP_INFERNO).astype(np.float32) / 255
    return grain(bloom(out, 0.7, 0.5, 18), c, 0.025)


def comic(img, c):
    lift = np.clip(img * 2.2, 0, 1) ** 0.75  # comics need light: open up dark footage first
    u8 = (np.clip(curve(lift, 1.25, 0.45), 0, 1) * 255).astype(np.uint8)
    sm = cv2.bilateralFilter(cv2.resize(u8, None, fx=0.5, fy=0.5), 7, 60, 7)
    q = (sm // 56) * 56 + 28
    q = cv2.resize(q, (u8.shape[1], u8.shape[0]), interpolation=cv2.INTER_NEAREST).astype(np.float32) / 255
    gray = cv2.medianBlur(cv2.cvtColor(u8, cv2.COLOR_BGR2GRAY), 5)
    edges = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 4).astype(np.float32) / 255
    h, w = gray.shape
    yy, xx = np.mgrid[0:h, 0:w]
    cell = 9
    dots = (((xx % cell) - cell / 2) ** 2 + ((yy % cell) - cell / 2) ** 2) < ((1 - lum(q)) * cell * 0.62) ** 2
    out = saturate(q, 1.5) * edges[..., None]
    out[dots & (lum(q) < 0.55)] *= 0.55
    return out * np.array([0.88, 0.97, 1.03], np.float32)


def sketch(img, c):
    u8 = (np.clip(img, 0, 1) * 255).astype(np.uint8)
    g, col = cv2.pencilSketch(cv2.resize(u8, None, fx=0.5, fy=0.5), sigma_s=40, sigma_r=0.07, shade_factor=0.04)
    g = cv2.resize(g, (u8.shape[1], u8.shape[0])).astype(np.float32) / 255
    paper = np.array([0.88, 0.93, 0.96], np.float32)
    out = g[..., None] * paper
    reveal = np.clip((c.p - 0.45) * 3, 0, 1)  # colour bleeds in through the shot
    return out * (1 - reveal) + teal_orange(img, c) * reveal


def vhs(img, c):
    out = cv2.GaussianBlur(img, (5, 1), 0)
    out = rgb_shift(out, 3)
    out = saturate(curve(out, 1.1, 0.5, lift=0.05), 1.3)
    out = grain(out, c, 0.05)
    h = out.shape[0]
    out[::2] *= 0.85
    band = int((c.t * 300) % (h + 200)) - 100  # tracking band rolling down
    if 0 < band < h - 30:
        out[band:band + 30] = np.roll(out[band:band + 30], int(c.rng.integers(-25, 25)), axis=1) + 0.08
    return out


def glitch(img, c):
    out = rgb_shift(img, 6 + 10 * c.pulse)
    h, w = out.shape[:2]
    n = 6 + int(14 * c.pulse)
    for _ in range(n):
        y = int(c.rng.integers(0, h - 10)); hh = int(c.rng.integers(4, 60)); dx = int(c.rng.integers(-80, 80))
        out[y:y + hh] = np.roll(out[y:y + hh], dx, axis=1)
    if c.pulse > 0.3:
        for _ in range(4):
            y, x = int(c.rng.integers(0, h - 80)), int(c.rng.integers(0, w - 120))
            blk = out[y:y + 80, x:x + 120]
            out[y:y + 80, x:x + 120] = np.round(blk * 3) / 3 * np.array(c.rng.uniform(0.6, 1.4, 3), np.float32)
    return saturate(curve(out, 1.2, 0.45), 1.2)


def dream(img, c):
    base = curve(img, 1.1, 0.4, lift=0.04)
    soft = blur(np.clip(base * 1.6, 0, 1), 26)
    out = screen(base * 0.85, soft * 0.75)  # Orton effect
    out = split_tone(out, (0.75, 0.45, 0.55), (0.55, 0.7, 0.95), 0.4)
    return vignette(bloom(out, 0.5, 0.6, 40, (1.0, 0.8, 1.0)), 0.4)


def purple_haze(img, c):
    out = duotone(curve(img, 1.3, 0.4), (0.18, 0.02, 0.10), (0.55, 0.85, 1.0), 0.85)  # violet shadows, gold highlights
    out = out * 0.8 + saturate(img, 0.5) * 0.2
    return vignette(bloom(out, 0.45, 1.2, 40, (0.9, 0.6, 1.0)), 0.55)


def infrared(img, c):
    hsv = cv2.cvtColor(np.clip(img, 0, 1), cv2.COLOR_BGR2HSV)
    hsv[..., 0] = (hsv[..., 0] + 150) % 360
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.6, 0, 1)
    out = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    return vignette(bloom(curve(out, 1.2, 0.45), 0.55, 0.8, 30, (1.0, 0.6, 1.0)), 0.45)


def matrix(img, c):
    L = curve(lum(img), 1.4, 0.35)
    out = np.stack([L * 0.25, np.clip(L * 1.15, 0, 1), L * 0.35], -1)
    out = bloom(out, 0.45, 1.0, 30, (0.4, 1.0, 0.5))
    return out + c.layer('rain') * np.array([0.5, 1.0, 0.55], np.float32)


def god_rays(img, c, center=(0.5, 0.15), steps=10, decay=0.88, strength=0.55):
    h, w = img.shape[:2]
    small = cv2.resize(img, (w // 3, h // 3))
    L = lum(small)
    src = small * np.clip((L - 0.45) * 3, 0, 1)[..., None]
    acc = np.zeros_like(src)
    cx, cy = center[0] * small.shape[1], center[1] * small.shape[0]
    wgt = 1.0
    for i in range(steps):
        s = 1 + 0.045 * i
        M = np.float32([[s, 0, cx * (1 - s)], [0, s, cy * (1 - s)]])
        acc += cv2.warpAffine(src, M, (small.shape[1], small.shape[0])) * wgt
        wgt *= decay
    rays = cv2.resize(acc / steps, (w, h))
    return img + rays * strength * 3


def green_rays(img, c):
    out = matrix(img, c) * 0.55 + teal_orange(img, c) * 0.45
    return god_rays(out, c, (0.45, 0.25), strength=0.7)


def storm(img, c):
    out = duotone(curve(img, 1.35, 0.4), (0.12, 0.04, 0.0), (1.0, 0.92, 0.8), 0.95)
    out = out * 0.75 + saturate(img, 0.6) * np.array([1.25, 1.0, 0.8], np.float32) * 0.25
    bolt = c.layer('lightning')
    out = out + bolt * np.array([1.0, 0.85, 0.7], np.float32) + bolt.max() * 0.18
    return vignette(bloom(out, 0.55, 0.9, 26, (1.0, 0.8, 0.6)), 0.55)


def embers(img, c):
    out = curve(img, 1.25, 0.4)
    out = split_tone(out, (0.35, 0.40, 0.55), (0.2, 0.55, 1.0), 0.6)
    out = saturate(out, 1.3) + c.layer('embers') * np.array([0.25, 0.6, 1.0], np.float32)
    return vignette(bloom(out, 0.5, 1.0, 34, (0.3, 0.6, 1.0)), 0.55)


def noir(img, c):
    g = curve(lum(img), 1.7, 0.38, gamma=1.1)
    out = np.repeat(g[..., None], 3, 2)
    out = bloom(out, 0.55, 0.8, 30)
    return vignette(grain(out, c, 0.07, 2), 0.65)


def oil(img, c):
    u8 = (np.clip(np.clip(img * 1.9, 0, 1) ** 0.8, 0, 1) * 255).astype(np.uint8)
    small = cv2.resize(u8, None, fx=0.5, fy=0.5)
    st = cv2.stylization(small, sigma_s=40, sigma_r=0.25)
    out = cv2.resize(st, (u8.shape[1], u8.shape[0]), interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255
    return vignette(bloom(saturate(curve(out, 1.2, 0.42), 1.3), 0.6, 0.6, 24), 0.5)


def kaleido(img, c):
    h, w = img.shape[:2]
    left = img[:, : w // 2]
    out = np.concatenate([left, left[:, ::-1]], 1)
    if out.shape[1] != w:
        out = cv2.resize(out, (w, h))
    return cyberpunk(out, c)


def film(img, c):
    h, w = img.shape[:2]
    dx, dy = c.rng.normal(0, 1.2), c.rng.normal(0, 1.5)  # gate weave
    img = cv2.warpAffine(img, np.float32([[1, 0, dx], [0, 1, dy]]), (w, h), borderMode=cv2.BORDER_REFLECT)
    out = curve(img, 1.15, 0.45, lift=0.05)
    out = split_tone(out, (0.42, 0.48, 0.45), (0.35, 0.55, 0.85), 0.45)
    out = grain(out, c, 0.07, 2)
    marks = np.zeros((h, w), np.uint8)
    for _ in range(int(c.rng.integers(2, 7))):  # dust
        cv2.circle(marks, (int(c.rng.integers(0, w)), int(c.rng.integers(0, h))), int(c.rng.integers(1, 4)), 255, -1)
    if c.rng.random() < 0.6:  # scratch
        x = int(c.rng.integers(0, w)); cv2.line(marks, (x, 0), (x + int(c.rng.integers(-6, 6)), h), 200, 1)
    out = np.maximum(out, (marks.astype(np.float32) / 255 * 0.9)[..., None])
    leak = c.layer('leak')
    return vignette(screen(np.clip(out, 0, 1), leak), 0.6)


def invert(img, c):
    return 1 - curve(img, 1.2, 0.5)


LOOKS = {f.__name__: f for f in [teal_orange, noir_red, cyberpunk, golden_aura, neon_aura, thermal, comic, sketch, vhs, glitch, dream,
                                  purple_haze, infrared, matrix, green_rays, storm, embers, noir, oil, kaleido, film, invert]}
NEEDS_MASK = {'golden_aura', 'neon_aura', 'thermal'}
