#!/usr/bin/env python3
"""
Narration for a collage reel: one clip per line, word timings for the
captions, and a mouth envelope for the host.

    python3 voice.py REEL.json --out DIR [--model PATH.onnx] [--speaker N] [--speed 1.12]

Uses Piper (pip install piper-tts) with a voice model. The default model is
the LibriTTS "high" voice (CC BY 4.0, 904 speakers), downloaded by
fetch_voice.sh into the reel cache. meta.voice in the reel can set
{"speaker": 60, "speed": 1.12}. A line may carry "speak" to be read
differently from how it is shown ("1899" -> "eighteen ninety-nine").

Piper's older voices give no word timings, so words are placed from the
audio: each sentence is synthesised as its own chunk (exact anchors), pauses
inside a sentence are matched to commas, and the rest is shared out by
syllables. Good to about a tenth of a second, which is what captions need.

Writes DIR/line_NN.wav and DIR/voice.json.
"""
import argparse, json, os, re, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.environ.get('REEL_CACHE', os.path.abspath(os.path.join(HERE, '..', '..', '..', '..', 'video-work', 'reel-cache')))
DEFAULT_MODEL = os.path.join(CACHE, 'voices', 'en-us-libritts-high', 'en-us-libritts-high.onnx')
ENV_FPS = 30


def syl(w):
    w2 = re.sub(r'[^a-z]', '', w.lower())
    n = len(re.findall(r'[aeiouy]+', w2)) or 1
    if w2.endswith('e') and n > 1 and not w2.endswith('le'):
        n -= 1
    digits = re.sub(r'\D', '', w)
    return n + len(digits) * 1.2


def frames_rms(x, sr, hop):
    n = len(x) // hop
    return np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(n)]) if n else np.zeros(0)


def speech_segments(x, sr, thr, min_gap=0.11):
    hop = int(sr * 0.01)
    e = frames_rms(x, sr, hop)
    on = e > thr
    segs, i = [], 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and on[j]:
                j += 1
            segs.append([i * 0.01, j * 0.01])
            i = j
        else:
            i += 1
    merged = []
    for s in segs:
        if merged and s[0] - merged[-1][1] < min_gap:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return [s for s in merged if s[1] - s[0] > 0.04]


def spread(words, t0, t1):
    w = [syl(x) for x in words]
    tot = sum(w) or 1
    out, t = [], t0
    for k, x in enumerate(words):
        d = (t1 - t0) * w[k] / tot
        out.append([t, t + d])
        t += d
    return out


def place(words, segs, t0, t1):
    """words of one sentence inside [t0, t1]; match pauses to punctuation."""
    groups, g = [], []
    for w in words:
        g.append(w)
        if re.search(r'[,;:—-]$', w):
            groups.append(g); g = []
    if g:
        groups.append(g)
    inner = [s for s in segs if s[1] > t0 and s[0] < t1]
    if len(groups) > 1 and len(inner) == len(groups):
        out = []
        for grp, s in zip(groups, inner):
            out += spread(grp, max(t0, s[0]), min(t1, s[1]))
        return out
    return spread(words, t0, t1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('reel')
    ap.add_argument('--out', required=True)
    ap.add_argument('--model', default=os.environ.get('PIPER_MODEL', DEFAULT_MODEL))
    ap.add_argument('--speaker', type=int)
    ap.add_argument('--speed', type=float)
    a = ap.parse_args()
    from piper import PiperVoice
    from piper.config import SynthesisConfig

    reel = json.load(open(a.reel))
    vm = (reel.get('meta') or {}).get('voice') or {}
    speaker = a.speaker if a.speaker is not None else vm.get('speaker', 60)
    speed = a.speed or vm.get('speed', 1.12)
    os.makedirs(a.out, exist_ok=True)
    voice = PiperVoice.load(a.model)
    multi = (voice.config.num_speakers or 1) > 1
    cfg = SynthesisConfig(speaker_id=speaker if multi else None, length_scale=1 / speed, noise_scale=vm.get('noise', 0.72), noise_w_scale=vm.get('noise_w', 0.9))
    res = {'model': os.path.basename(a.model), 'speaker': speaker if multi else None, 'speed': speed, 'envFps': ENV_FPS, 'lines': []}
    for li, ln in enumerate(reel['lines']):
        shown = ln['say'].split()
        spoken = ln.get('speak') or ln['say']
        chunks = list(voice.synthesize(spoken, cfg))
        sr = chunks[0].sample_rate
        pause = np.zeros(int(sr * vm.get('sentenceGap', 0.16)), dtype=np.float32)
        parts, spans, t = [], [], 0.0
        for k, c in enumerate(chunks):
            x = c.audio_float_array.astype(np.float32)
            # trim each sentence to its speech so anchors are tight
            thr = max(0.012, np.percentile(np.abs(x), 95) * 0.06)
            idx = np.where(np.abs(x) > thr)[0]
            if len(idx):
                x = x[max(0, idx[0] - int(sr * 0.03)): idx[-1] + int(sr * 0.06)]
            if k:
                parts.append(pause); t += len(pause) / sr
            spans.append([t, t + len(x) / sr, x])
            parts.append(x); t += len(x) / sr
        audio = np.concatenate(parts)
        dur = len(audio) / sr
        # words per sentence chunk (only when the shown text is what was spoken)
        sentences = [s.split() for s in re.split(r'(?<=[.!?])\s+', ln['say'].strip()) if s.strip()]
        times = []
        if not ln.get('speak') and len(sentences) == len(spans):
            for words, (s0, s1, x) in zip(sentences, spans):
                thr = max(0.01, np.percentile(np.abs(x), 95) * 0.08)
                segs = [[s0 + p, s0 + q] for p, q in speech_segments(x, sr, thr)]
                times += place(words, segs, s0, s1)
        else:
            times = spread(shown, 0.0, dur)
        env = frames_rms(audio, sr, int(sr / ENV_FPS))
        env = np.clip(env / (np.percentile(env, 92) + 1e-6), 0, 1)
        fn = f'line_{li:02d}.wav'
        with wave.open(os.path.join(a.out, fn), 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
            w.writeframes((np.clip(audio, -1, 1) * 32767).astype(np.int16).tobytes())
        res['lines'].append({'file': fn, 'dur': round(dur, 3), 'words': [{'w': w, 't0': round(p, 3), 't1': round(q, 3)} for w, (p, q) in zip(shown, times)], 'env': [round(float(v), 2) for v in env], 'envFps': ENV_FPS})
        print(f'line {li:02d} {dur:5.2f}s  {ln["say"][:60]}')
    tot = sum(l['dur'] for l in res['lines'])
    json.dump(res, open(os.path.join(a.out, 'voice.json'), 'w'))
    print(f'{len(res["lines"])} lines, {tot:.1f}s of speech (piper {res["model"]}, speaker {res["speaker"]})')


if __name__ == '__main__':
    main()
