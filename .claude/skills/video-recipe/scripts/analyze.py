#!/usr/bin/env python3
"""
Take a video apart: shots, pacing, colour, surface and motion.

    python3 analyze.py VIDEO --out DIR [--fps 6] [--max-seconds 900]

Writes into DIR:
  analysis.json      every measurement, per shot and overall
  style.auto.json    a first guess at engine style tokens (refine by eye)
  contact_NN.jpg     keyframe sheets, one frame per shot, with timecodes
  palette.png        the global palette, sized by share of screen
  timeline.png       shot lengths, colour per shot, motion per shot

Nothing here decides what the style *means*; it gives Claude numbers and
pictures to look at. Frames stay in DIR for study only and are never
copied into the output video.
"""
import argparse
import json
import math
import os
import subprocess
import sys

import cv2
import numpy as np


def ffmpeg_exe():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return 'ffmpeg'


def read_frames(path, fps, max_seconds, size=320):
    """Decode at a fixed sample rate with OpenCV; fall back to ffmpeg if needed."""
    cap = cv2.VideoCapture(path)
    src_fps = cap.get(cv2.CAP_PROP_FPS) or 0
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
    frames, times = [], []
    if src_fps > 0 and n > 0:
        step = max(1, int(round(src_fps / fps)))
        i = 0
        while True:
            ok = cap.grab()
            if not ok:
                break
            if i % step == 0:
                ok, f = cap.retrieve()
                if not ok:
                    break
                t = i / src_fps
                if t > max_seconds:
                    break
                h, w = f.shape[:2]
                s = size / max(h, w)
                frames.append(cv2.resize(f, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA))
                times.append(t)
            i += 1
        cap.release()
        return frames, times, src_fps, (W, H), n / src_fps
    cap.release()
    # ffmpeg fallback
    tmp = os.path.join(os.path.dirname(os.path.abspath(path)), '_frames')
    os.makedirs(tmp, exist_ok=True)
    subprocess.run([ffmpeg_exe(), '-v', 'error', '-y', '-i', path, '-t', str(max_seconds), '-vf', f'fps={fps},scale={size}:-2', os.path.join(tmp, 'f%06d.png')], check=True)
    names = sorted(os.listdir(tmp))
    for k, nm in enumerate(names):
        frames.append(cv2.imread(os.path.join(tmp, nm)))
        times.append(k / fps)
    return frames, times, fps, (frames[0].shape[1], frames[0].shape[0]) if frames else (0, 0), len(frames) / fps


def hist(f):
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    h = cv2.calcHist([hsv], [0, 1, 2], None, [16, 6, 6], [0, 180, 0, 256, 0, 256])
    return cv2.normalize(h, h).flatten()


def detect_shots(frames, times, fps):
    """Cuts from histogram jumps against a rolling baseline; fades from luminance dips."""
    if not frames:
        return []
    hs = [hist(f) for f in frames]
    d = np.array([0.0] + [cv2.compareHist(hs[i - 1], hs[i], cv2.HISTCMP_BHATTACHARYYA) for i in range(1, len(hs))])
    lum = np.array([cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).mean() / 255 for f in frames])
    cuts = [0]
    win = max(3, int(fps * 2))
    for i in range(1, len(d)):
        base = np.median(d[max(0, i - win):i]) if i > 1 else 0
        thr = max(0.28, base * 3.5 + 0.12)
        if d[i] > thr and (i - cuts[-1]) >= max(1, int(fps * 0.4)):
            cuts.append(i)
    shots = []
    for k, s in enumerate(cuts):
        e = cuts[k + 1] if k + 1 < len(cuts) else len(frames)
        t0 = times[s]
        t1 = times[e] if e < len(times) else times[-1] + 1 / fps
        # was it entered by a fade? (luminance near black just before)
        fade = bool(s > 1 and lum[max(0, s - 2):s + 1].min() < 0.06)
        shots.append({'i0': s, 'i1': e, 't0': round(t0, 3), 't1': round(t1, 3), 'dur': round(t1 - t0, 3), 'cutStrength': round(float(d[s]), 3), 'fadeIn': fade})
    return shots


def kmeans_palette(pixels, k=8):
    pixels = pixels.astype(np.float32)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.5)
    _, labels, centers = cv2.kmeans(pixels, k, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    counts = np.bincount(labels.flatten(), minlength=k)
    order = np.argsort(-counts)
    return centers[order], counts[order] / counts.sum()


def lab_to_hex(lab):
    px = np.uint8([[np.clip(lab, 0, 255)]])
    bgr = cv2.cvtColor(px, cv2.COLOR_LAB2BGR)[0, 0]
    return '#%02x%02x%02x' % (bgr[2], bgr[1], bgr[0])


def hex_to_hsl(h):
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    mx, mn = max(r, g, b), min(r, g, b)
    l = (mx + mn) / 2
    if mx == mn:
        return 0.0, 0.0, l
    d = mx - mn
    s = d / (2 - mx - mn) if l > 0.5 else d / (mx + mn)
    if mx == r:
        hh = (g - b) / d + (6 if g < b else 0)
    elif mx == g:
        hh = (b - r) / d + 2
    else:
        hh = (r - g) / d + 4
    return hh * 60, s, l


def surface_metrics(f):
    """How flat, how outlined, how glowy, how grainy one frame is."""
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    lab = cv2.cvtColor(f, cv2.COLOR_BGR2LAB).astype(np.float32)
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV).astype(np.float32)
    # flatness: share of pixels whose 5x5 neighbourhood barely varies
    mu = cv2.blur(g, (5, 5))
    var = cv2.blur(g * g, (5, 5)) - mu * mu
    flat = float((var < 0.0004).mean())
    # smooth gradients: low local variance but non-zero large-scale slope
    big = cv2.GaussianBlur(g, (0, 0), 6)
    gx, gy = cv2.Sobel(big, cv2.CV_32F, 1, 0), cv2.Sobel(big, cv2.CV_32F, 0, 1)
    slope = np.hypot(gx, gy)
    gradient = float(((var < 0.0006) & (slope > 0.004) & (slope < 0.05)).mean())
    # edges and outlines: thin dark strokes between two lighter sides
    edges = cv2.Canny((g * 255).astype(np.uint8), 60, 160) > 0
    edge_density = float(edges.mean())
    dark = g < 0.16
    opened = cv2.morphologyEx(dark.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    thin_dark = dark & (opened == 0)
    outline = float((thin_dark & cv2.dilate(edges.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)).sum() / max(1, edges.sum()))
    # glow: bright cores with soft halos around them
    bright = (g > 0.82).astype(np.float32)
    halo = cv2.GaussianBlur(bright, (0, 0), 6)
    ring = (halo > 0.08) & (bright == 0)
    glow = float(ring.mean() / max(1e-4, bright.mean() + ring.mean())) if bright.mean() > 0.0005 else 0.0
    # grain: high-frequency energy inside flat-ish areas
    hp = g - cv2.GaussianBlur(g, (0, 0), 1.2)
    grain = float(np.abs(hp[var < 0.002]).mean()) if (var < 0.002).any() else 0.0
    sat = float(hsv[..., 1].mean() / 255)
    val = float(hsv[..., 2].mean() / 255)
    contrast = float(g.std())
    # where does the weight sit? (centre of luminance-contrast mass)
    w = np.abs(g - g.mean())
    ys, xs = np.mgrid[0:g.shape[0], 0:g.shape[1]]
    tot = w.sum() + 1e-6
    cx, cy = float((w * xs).sum() / tot / g.shape[1]), float((w * ys).sum() / tot / g.shape[0])
    # vignette: corners darker than centre
    h, wdt = g.shape
    corner = np.concatenate([g[:h // 6, :wdt // 6].ravel(), g[:h // 6, -wdt // 6:].ravel(), g[-h // 6:, :wdt // 6].ravel(), g[-h // 6:, -wdt // 6:].ravel()]).mean()
    centre = g[h // 3:2 * h // 3, wdt // 3:2 * wdt // 3].mean()
    return {
        'flat': flat, 'gradient': gradient, 'edgeDensity': edge_density, 'outline': outline, 'glow': glow, 'grain': grain,
        'saturation': sat, 'brightness': val, 'contrast': contrast, 'weightX': cx, 'weightY': cy, 'vignette': float(centre - corner),
        'L': float(lab[..., 0].mean() / 255),
    }


def camera_motion(a, b):
    """Similarity transform between two frames from ORB matches: pan, zoom, rotation."""
    ga, gb = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY), cv2.cvtColor(b, cv2.COLOR_BGR2GRAY)
    orb = cv2.ORB_create(500)
    ka, da = orb.detectAndCompute(ga, None)
    kb, db = orb.detectAndCompute(gb, None)
    if da is None or db is None or len(ka) < 12 or len(kb) < 12:
        return None
    m = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(da, db)
    if len(m) < 12:
        return None
    pa = np.float32([ka[x.queryIdx].pt for x in m])
    pb = np.float32([kb[x.trainIdx].pt for x in m])
    M, inl = cv2.estimateAffinePartial2D(pa, pb, method=cv2.RANSAC, ransacReprojThreshold=2.5)
    if M is None or inl is None or inl.sum() < 10:
        return None
    s = math.hypot(M[0, 0], M[1, 0])
    return {'dx': float(M[0, 2]) / a.shape[1], 'dy': float(M[1, 2]) / a.shape[0], 'scale': float(s), 'rot': float(math.degrees(math.atan2(M[1, 0], M[0, 0]))), 'inliers': int(inl.sum())}


def classify_camera(moves, dt):
    if not moves:
        return 'unknown', 0.0
    dx = np.mean([m['dx'] for m in moves]) / dt
    dy = np.mean([m['dy'] for m in moves]) / dt
    zs = np.mean([math.log(m['scale']) for m in moves]) / dt
    pan = math.hypot(dx, dy)
    if abs(zs) > 0.02 and abs(zs) > pan * 0.6:
        return ('push-in' if zs > 0 else 'pull-out'), float(abs(zs))
    if pan > 0.012:
        return ('pan-' + ('h' if abs(dx) > abs(dy) else 'v')), float(pan)
    return 'locked', float(pan)


def audio_metrics(path, out_dir):
    wav = os.path.join(out_dir, '_audio.wav')
    try:
        subprocess.run([ffmpeg_exe(), '-v', 'error', '-y', '-i', path, '-ac', '1', '-ar', '16000', '-t', '900', wav], check=True)
    except Exception:
        return None
    try:
        import wave
        with wave.open(wav) as w:
            x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    except Exception:
        return None
    finally:
        try:
            os.remove(wav)
        except OSError:
            pass
    if len(x) < 16000:
        return None
    hop = 1600
    frames = x[: len(x) // hop * hop].reshape(-1, hop)
    rms = np.sqrt((frames ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(rms + 1e-9)
    spec = np.abs(np.fft.rfft(frames * np.hanning(hop), axis=1))
    freqs = np.fft.rfftfreq(hop, 1 / 16000)
    speech = spec[:, (freqs > 300) & (freqs < 3400)].sum(axis=1)
    total = spec.sum(axis=1) + 1e-9
    ratio = speech / total
    voiced = (ratio > 0.55) & (db > db.max() - 30)
    # syllable-ish rate: peaks of the speech-band envelope while voiced
    env = np.convolve(speech, np.ones(3) / 3, mode='same')
    peaks = ((env[1:-1] > env[:-2]) & (env[1:-1] > env[2:]) & voiced[1:-1]).sum()
    dur = len(x) / 16000
    return {
        'loudnessDb': round(float(db.mean()), 1), 'dynamicRangeDb': round(float(np.percentile(db, 95) - np.percentile(db, 10)), 1),
        'speechShare': round(float(voiced.mean()), 3), 'syllablesPerSecond': round(float(peaks / max(1, voiced.sum() * hop / 16000)), 2),
        'silences': int((db < db.max() - 40).sum()), 'seconds': round(dur, 1),
    }


def contact_sheets(frames, shots, out_dir, per=24):
    files = []
    if not frames:
        return files
    th, tw = frames[0].shape[:2]
    cols = 6
    for page in range(0, len(shots), per):
        chunk = shots[page:page + per]
        rows = math.ceil(len(chunk) / cols)
        sheet = np.full((rows * (th + 22), cols * tw, 3), 18, np.uint8)
        for k, s in enumerate(chunk):
            mid = (s['i0'] + max(s['i0'], s['i1'] - 1)) // 2
            r, c = divmod(k, cols)
            y, x = r * (th + 22), c * tw
            sheet[y:y + th, x:x + tw] = frames[mid]
            cv2.putText(sheet, f"#{page + k + 1} {s['t0']:.1f}s ({s['dur']:.1f}s) {s.get('camera', '')}", (x + 4, y + th + 15), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (230, 230, 230), 1, cv2.LINE_AA)
        fn = os.path.join(out_dir, f'contact_{page // per + 1:02d}.jpg')
        cv2.imwrite(fn, sheet, [cv2.IMWRITE_JPEG_QUALITY, 88])
        files.append(os.path.basename(fn))
    return files


def palette_png(pal, out_dir):
    W, H = 900, 140
    img = np.zeros((H, W, 3), np.uint8)
    x = 0
    for c in pal:
        w = max(18, int(round(c['share'] * W)))
        h = c['hex']
        img[:, x:min(W, x + w)] = (int(h[5:7], 16), int(h[3:5], 16), int(h[1:3], 16))
        cv2.putText(img, h, (x + 4, H - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255) if hex_to_hsl(h)[2] < 0.55 else (0, 0, 0), 1, cv2.LINE_AA)
        x += w
    cv2.imwrite(os.path.join(out_dir, 'palette.png'), img)


def timeline_png(shots, total, out_dir):
    W, H = 1200, 120
    img = np.full((H, W, 3), 20, np.uint8)
    for s in shots:
        x0, x1 = int(s['t0'] / total * W), max(int(s['t0'] / total * W) + 1, int(s['t1'] / total * W))
        h = s['palette'][0]['hex']
        img[0:70, x0:x1] = (int(h[5:7], 16), int(h[3:5], 16), int(h[1:3], 16))
        a = s['palette'][1]['hex'] if len(s['palette']) > 1 else h
        img[70:84, x0:x1] = (int(a[5:7], 16), int(a[3:5], 16), int(a[1:3], 16))
        m = min(1.0, s['motion'] * 8)
        img[H - int(m * 34):H, x0:x1] = (90, 200, 240)
        img[:, x0:x0 + 1] = (0, 0, 0)
    cv2.imwrite(os.path.join(out_dir, 'timeline.png'), img)


def roles(pal):
    """Guess palette roles: background, ink, accents, highlight."""
    by_share = sorted(pal, key=lambda c: -c['share'])
    bg = by_share[0]['hex']
    hsl = {c['hex']: hex_to_hsl(c['hex']) for c in pal}
    sat = sorted(pal, key=lambda c: -(hsl[c['hex']][1] * (1 - abs(hsl[c['hex']][2] - 0.55))))
    accents = [c['hex'] for c in sat if c['hex'] != bg][:4]
    bl = hsl[bg][2]
    ink = max(pal, key=lambda c: abs(hsl[c['hex']][2] - bl))['hex']
    highlight = max(pal, key=lambda c: hsl[c['hex']][2])['hex']
    shadow = min(pal, key=lambda c: hsl[c['hex']][2])['hex']
    second = by_share[1]['hex'] if len(by_share) > 1 else bg
    return {'bg': bg, 'bg2': second, 'ink': ink, 'accents': accents, 'highlight': highlight, 'shadow': shadow}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('video')
    ap.add_argument('--out', required=True)
    ap.add_argument('--fps', type=float, default=6)
    ap.add_argument('--max-seconds', type=float, default=900)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)

    frames, times, src_fps, (W, H), duration = read_frames(a.video, a.fps, a.max_seconds)
    if not frames:
        sys.exit('no frames decoded')
    print(f'{len(frames)} frames sampled from {duration:.1f}s at {W}x{H}', file=sys.stderr)
    shots = detect_shots(frames, times, a.fps)

    all_px = []
    for s in shots:
        idx = list(range(s['i0'], max(s['i0'] + 1, s['i1'])))
        sub = idx[:: max(1, len(idx) // 4)][:4]
        px = np.concatenate([cv2.cvtColor(cv2.resize(frames[i], (80, 45)), cv2.COLOR_BGR2LAB).reshape(-1, 3) for i in sub])
        cent, share = kmeans_palette(px, 5)
        s['palette'] = [{'hex': lab_to_hex(c), 'share': round(float(w), 3)} for c, w in zip(cent, share)]
        all_px.append(px[:: max(1, len(px) // 1200)])
        mets = [surface_metrics(frames[i]) for i in sub]
        s['surface'] = {k: round(float(np.mean([m[k] for m in mets])), 4) for k in mets[0]}
        diffs = [float(np.abs(frames[i].astype(np.float32) - frames[i - 1].astype(np.float32)).mean() / 255) for i in idx[1:]]
        s['motion'] = round(float(np.mean(diffs)) if diffs else 0.0, 4)
        moves = [m for m in (camera_motion(frames[i - 1], frames[i]) for i in idx[1:][:: max(1, len(idx) // 6)]) if m]
        cam, speed = classify_camera(moves, 1 / a.fps)
        s['camera'], s['cameraSpeed'] = cam, round(speed, 4)

    pal_c, pal_s = kmeans_palette(np.concatenate(all_px), 10)
    pal = [{'hex': lab_to_hex(c), 'share': round(float(w), 3)} for c, w in zip(pal_c, pal_s)]
    durs = np.array([s['dur'] for s in shots])
    surf = {k: round(float(np.average([s['surface'][k] for s in shots], weights=durs)), 4) for k in shots[0]['surface']}
    cams = {}
    for s in shots:
        cams[s['camera']] = round(cams.get(s['camera'], 0) + s['dur'], 2)
    analysis = {
        'source': os.path.basename(a.video), 'durationSeconds': round(duration, 2), 'resolution': [W, H], 'sourceFps': round(src_fps, 2),
        'shots': len(shots), 'shotLength': {'mean': round(float(durs.mean()), 2), 'median': round(float(np.median(durs)), 2), 'p10': round(float(np.percentile(durs, 10)), 2), 'p90': round(float(np.percentile(durs, 90)), 2)},
        'cutsPerMinute': round(len(shots) / max(1e-6, duration) * 60, 1), 'fadeShare': round(float(np.mean([s['fadeIn'] for s in shots])), 3),
        'palette': pal, 'roles': roles(pal), 'surface': surf,
        'motion': {'meanFrameDiff': round(float(np.average([s['motion'] for s in shots], weights=durs)), 4), 'cameraSeconds': cams},
        'audio': audio_metrics(a.video, a.out),
        'shotList': [{k: v for k, v in s.items() if k not in ('i0', 'i1')} for s in shots],
    }
    analysis['contactSheets'] = contact_sheets(frames, shots, a.out)
    palette_png(pal, a.out)
    timeline_png(shots, duration, a.out)
    with open(os.path.join(a.out, 'analysis.json'), 'w') as f:
        json.dump(analysis, f, indent=1)

    # a first guess at engine tokens; Claude refines these after looking at the sheets
    r = analysis['roles']
    auto = {
        'palette': {'bg': [r['bg'], r['bg2']], 'ink': r['ink'], 'accents': r['accents'] or [r['highlight']], 'highlight': r['highlight'], 'shadow': r['shadow']},
        'outline': round(min(6.0, surf['outline'] * 14), 2) if surf['outline'] > 0.12 else 0,
        'shading': 'flat' if surf['gradient'] < 0.08 else 'soft',
        'glow': round(min(1.0, surf['glow'] * 1.6), 2),
        'grain': round(min(0.12, surf['grain'] * 2.5), 3),
        'vignette': round(max(0.0, min(0.6, surf['vignette'] * 2)), 2),
        'motion': {'energy': round(min(1.0, analysis['motion']['meanFrameDiff'] * 25), 2), 'drift': 0.015 if cams.get('locked', 0) > duration * 0.5 else 0.035, 'float': 1},
        'pacing': {'meanShot': analysis['shotLength']['median'], 'transitions': ['fade', 'cut'] if analysis['fadeShare'] > 0.15 else ['cut']},
    }
    with open(os.path.join(a.out, 'style.auto.json'), 'w') as f:
        json.dump(auto, f, indent=1)
    print(json.dumps({k: analysis[k] for k in ('durationSeconds', 'shots', 'shotLength', 'cutsPerMinute', 'roles', 'surface', 'motion', 'audio', 'contactSheets')}, indent=1))


if __name__ == '__main__':
    main()
