#!/usr/bin/env python3
"""
Get a reference video into the work folder.

    python3 fetch.py URL_OR_PATH --out DIR [--max-height 720]

A local file is copied as DIR/source.<ext>. A URL is fetched with yt-dlp
when it is installed and the network allows it. Only use videos you have
the right to download and study: your own, licensed, or ones whose terms
permit it. The reference is for analysis only and is never copied into the
output.
"""
import argparse
import os
import shutil
import subprocess
import sys


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('--out', required=True)
    ap.add_argument('--max-height', type=int, default=720)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    if os.path.exists(a.src):
        ext = os.path.splitext(a.src)[1] or '.mp4'
        dst = os.path.join(a.out, 'source' + ext)
        shutil.copyfile(a.src, dst)
        print(dst)
        return
    exe = shutil.which('yt-dlp')
    cmd = [exe] if exe else [sys.executable, '-m', 'yt_dlp']
    try:
        subprocess.run(cmd + ['--version'], check=True, capture_output=True)
    except Exception:
        sys.exit('yt-dlp is not installed. Install it (pip install yt-dlp) or download the video yourself and pass the file path.')
    tmpl = os.path.join(a.out, 'source.%(ext)s')
    fmt = f'bv*[height<={a.max_height}][ext=mp4]+ba[ext=m4a]/b[height<={a.max_height}]/b'
    r = subprocess.run(cmd + ['-f', fmt, '--merge-output-format', 'mp4', '--no-playlist', '-o', tmpl, '--write-info-json', a.src])
    if r.returncode != 0:
        sys.exit('Download failed (network policy, region or format). Download the video yourself and pass the file path instead.')
    for f in os.listdir(a.out):
        if f.startswith('source.') and not f.endswith('.json'):
            print(os.path.join(a.out, f))
            return
    sys.exit('download produced no video file')


if __name__ == '__main__':
    main()
