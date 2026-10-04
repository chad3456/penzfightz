#!/usr/bin/env python3
"""
Narration for every scene that has a "narration" line.

    python3 voice.py STORYBOARD.json --out DIR [--engine auto|piper|espeak|say|none] [--voice NAME] [--rate WPM]

Engines, in order of preference for --engine auto:
  piper   neural TTS; needs `pip install piper-tts` and a voice model file,
          given with PIPER_MODEL=/path/to/voice.onnx
  say     macOS built-in
  espeak  espeak-ng (robotic but everywhere: apt install espeak-ng)
  none    no audio; durations are estimated from word count

Writes DIR/vo_<scene>.wav and DIR/narration.json with each clip's length,
which render.mjs uses to time the scenes.
"""
import argparse
import json
import os
import shutil
import subprocess
import wave


def wav_seconds(p):
    with wave.open(p) as w:
        return w.getnframes() / w.getframerate()


def to_wav(src, dst):
    try:
        import imageio_ffmpeg
        ff = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        ff = 'ffmpeg'
    subprocess.run([ff, '-v', 'error', '-y', '-i', src, '-ac', '1', '-ar', '44100', dst], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('storyboard')
    ap.add_argument('--out', required=True)
    ap.add_argument('--engine', default='auto')
    ap.add_argument('--voice', default='')
    ap.add_argument('--rate', type=int, default=172)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    sb = json.load(open(a.storyboard))
    eng = a.engine
    if eng == 'auto':
        if os.environ.get('PIPER_MODEL') and shutil.which('piper'):
            eng = 'piper'
        elif shutil.which('say'):
            eng = 'say'
        elif shutil.which('espeak-ng') or shutil.which('espeak'):
            eng = 'espeak'
        else:
            eng = 'none'
    out = {'engine': eng, 'clips': {}}
    for sc in sb['scenes']:
        text = (sc.get('narration') or '').strip()
        if not text:
            continue
        fn = os.path.join(a.out, f"vo_{sc['id']}.wav")
        if eng == 'piper':
            subprocess.run(['piper', '--model', os.environ['PIPER_MODEL'], '--output_file', fn], input=text.encode(), check=True)
        elif eng == 'say':
            aiff = fn[:-4] + '.aiff'
            subprocess.run(['say', '-r', str(a.rate)] + (['-v', a.voice] if a.voice else []) + ['-o', aiff, text], check=True)
            to_wav(aiff, fn); os.remove(aiff)
        elif eng == 'espeak':
            exe = shutil.which('espeak-ng') or shutil.which('espeak')
            raw = fn[:-4] + '.raw.wav'
            subprocess.run([exe, '-v', a.voice or 'en-gb+m3', '-s', str(a.rate), '-p', '38', '-g', '4', '-w', raw, text], check=True)
            to_wav(raw, fn); os.remove(raw)
        if eng != 'none':
            out['clips'][sc['id']] = {'file': os.path.basename(fn), 'seconds': round(wav_seconds(fn), 3)}
        else:
            out['clips'][sc['id']] = {'file': None, 'seconds': round(len(text.split()) / (a.rate / 60), 3)}
    json.dump(out, open(os.path.join(a.out, 'narration.json'), 'w'), indent=1)
    print(f"{eng}: {len(out['clips'])} clips, {sum(c['seconds'] for c in out['clips'].values()):.1f}s of narration")


if __name__ == '__main__':
    main()
