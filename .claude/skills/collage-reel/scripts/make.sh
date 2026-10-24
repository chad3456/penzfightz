#!/usr/bin/env bash
# One command from script to video.
#
#   scripts/make.sh REEL.json OUT_DIR [--stills] [--scale 0.5] [other render.mjs flags]
#
# 1. downloads the narrator voice once (Piper LibriTTS, CC BY 4.0) into the reel cache
# 2. downloads every sticker the script names (Microsoft Fluent 3D emoji, MIT)
# 3. synthesises the narration with word timings
# 4. renders stills (--stills) or the full 1080 x 1920 film with score and sound effects
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
reel="$1"; out="$2"; shift 2
cache="${REEL_CACHE:-$here/../../../../video-work/reel-cache}"
model="$cache/voices/en-us-libritts-high/en-us-libritts-high.onnx"
if [ ! -f "$model" ] && [ -z "${PIPER_MODEL:-}" ]; then
  mkdir -p "$cache/voices/en-us-libritts-high"
  echo "fetching narrator voice (Piper LibriTTS high, CC BY 4.0)..."
  curl -sL https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-libritts-high.tar.gz | tar -xz -C "$cache/voices/en-us-libritts-high"
fi
python3 -c "import piper" 2>/dev/null || python3 -m pip install -q piper-tts
python3 "$here/assets.py" "$reel"
python3 "$here/voice.py" "$reel" --out "$out/vo"
node "$here/render.mjs" "$reel" --vo "$out/vo" --out "$out" "$@"
