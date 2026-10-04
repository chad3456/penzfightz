#!/usr/bin/env python3
"""
How close is the new film to the reference?

    python3 compare.py REF/analysis.json OUT/analysis.json

Palette distance is the mean CIE76 ΔE from each of the reference's top
colours (weighted by screen share) to the nearest colour in the new film's
palette: under ~10 reads as "same palette", over ~25 as a different one.
"""
import json
import sys

import numpy as np


def lab(h):
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    rgb = np.array([r, g, b])
    rgb = np.where(rgb > 0.04045, ((rgb + 0.055) / 1.055) ** 2.4, rgb / 12.92)
    xyz = rgb @ np.array([[0.4124, 0.2126, 0.0193], [0.3576, 0.7152, 0.1192], [0.1805, 0.0722, 0.9505]])
    xyz /= np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.array([116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])])


def main():
    ref, out = (json.load(open(p)) for p in sys.argv[1:3])
    rp = [(lab(c['hex']), c['share']) for c in ref['palette']]
    op = [lab(c['hex']) for c in out['palette']]
    de = sum(w * min(np.linalg.norm(c - o) for o in op) for c, w in rp) / sum(w for _, w in rp)
    rows = [('palette ΔE (lower is closer)', '', f'{de:.1f}')]
    rows.append(('median shot (s)', ref['shotLength']['median'], out['shotLength']['median']))
    rows.append(('cuts per minute', ref['cutsPerMinute'], out['cutsPerMinute']))
    for k in ('flat', 'gradient', 'outline', 'glow', 'grain', 'saturation', 'brightness', 'contrast', 'vignette'):
        rows.append((k, ref['surface'][k], out['surface'][k]))
    rows.append(('motion (frame diff)', ref['motion']['meanFrameDiff'], out['motion']['meanFrameDiff']))
    if ref.get('audio') and out.get('audio'):
        rows.append(('syllables / s', ref['audio']['syllablesPerSecond'], out['audio']['syllablesPerSecond']))
    w = max(len(r[0]) for r in rows)
    print(f"{'measure'.ljust(w)}  {'reference':>10}  {'new film':>10}")
    for name, a, b in rows:
        print(f'{name.ljust(w)}  {str(a):>10}  {str(b):>10}')


if __name__ == '__main__':
    main()
