"""
Speak every line of the epic cut with Kokoro (Apache-2.0), locally.

    pip install kokoro-onnx soundfile
    # kokoro-v1.0.onnx and voices-v1.0.bin from the kokoro-onnx GitHub releases
    python speak.py            # writes vo/<line>.wav

vo.json is [name, voice, lang, speed, text] per line: bm_lewis narrates,
am_michael is Arjuna, am_onyx is Krishna in English, hm_omega and hm_psi say
the Sanskrit.
"""
import json, os, soundfile as sf
from kokoro_onnx import Kokoro

here = os.path.dirname(os.path.abspath(__file__))
k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
os.makedirs("vo", exist_ok=True)
for name, voice, lang, speed, text in json.load(open(os.path.join(here, "vo.json"))):
    s, sr = k.create(text, voice=voice, speed=speed, lang=lang)
    sf.write(f"vo/{name}.wav", s, sr)
    print(name, round(len(s) / sr, 2))
