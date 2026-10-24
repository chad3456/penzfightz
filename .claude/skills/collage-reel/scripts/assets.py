#!/usr/bin/env python3
"""
Stickers for a reel, fetched from the internet on demand.

    python3 assets.py REEL.json [--cache DIR]

Every sticker a reel names ("money bag", "yacht", "graduation cap"...) is a
Microsoft Fluent 3D emoji (MIT licence, github.com/microsoft/fluentui-emoji),
downloaded once into the cache and reused. Names follow the Unicode emoji
names in plain English. Skin-toned people use the default tone.
Unknown names are reported so you can pick another.
"""
import argparse, json, os, re, sys, urllib.parse, urllib.request

BASE = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/'
HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CACHE = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..', 'video-work', 'reel-cache'))


def slug(name):
    return re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_')


def candidates(name):
    folder = name.strip()
    folder = folder[0].upper() + folder[1:]
    s = slug(name)
    for f in (folder, folder.title(), folder.lower()):
        q = urllib.parse.quote(f)
        yield f'{BASE}{q}/3D/{s}_3d.png'
        yield f'{BASE}{q}/Default/3D/{s}_3d_default.png'


def fetch(name, cache):
    out = os.path.join(cache, 'stickers', slug(name) + '.png')
    if os.path.exists(out) and os.path.getsize(out) > 0:
        return out
    os.makedirs(os.path.dirname(out), exist_ok=True)
    for url in candidates(name):
        try:
            with urllib.request.urlopen(url, timeout=30) as r:
                data = r.read()
            if data[:8] == b'\x89PNG\r\n\x1a\n':
                open(out, 'wb').write(data)
                return out
        except Exception:
            continue
    return None


def names_in(reel):
    found = set()
    def walk(x):
        if isinstance(x, dict):
            for k, v in x.items():
                if k in ('e', 'sticker') and isinstance(v, str):
                    found.add(v)
                elif k in ('e', 'stickers') and isinstance(v, list):
                    for it in v:
                        if isinstance(it, str): found.add(it)
                        elif isinstance(it, dict) and isinstance(it.get('e'), str): found.add(it['e'])
                walk(v)
        elif isinstance(x, list):
            for v in x: walk(v)
    walk(reel)
    return sorted(found)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('reel', nargs='?')
    ap.add_argument('--cache', default=os.environ.get('REEL_CACHE', DEFAULT_CACHE))
    ap.add_argument('--names', nargs='*', default=[])
    a = ap.parse_args()
    names = list(a.names)
    if a.reel:
        names += names_in(json.load(open(a.reel)))
    missing = []
    for n in sorted(set(names)):
        if not fetch(n, a.cache):
            missing.append(n)
    print(f'stickers: {len(set(names)) - len(missing)} ready in {a.cache}/stickers')
    if missing:
        print('NOT FOUND (try another emoji name):', ', '.join(missing))
        sys.exit(3)


if __name__ == '__main__':
    main()
