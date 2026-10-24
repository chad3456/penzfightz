# Aura FX

Turn any clip into a vertical "aura" reel (1080 × 1920) with beat-synced effects. The original audio is kept.

```bash
pip install numpy opencv-python-headless onnxruntime pillow   # once; ffmpeg on your PATH too
python3 tools/aura-fx/aura.py my-clip.mp4 --out video-work/my-edit --auto        # plan + render
python3 tools/aura-fx/aura.py my-clip.mp4 --out video-work/my-edit --gallery     # every look on one frame
python3 tools/aura-fx/aura.py my-clip.mp4 --out video-work/my-edit --plan video-work/my-edit/plan.json --preview   # a still per segment
python3 tools/aura-fx/aura.py my-clip.mp4 --out video-work/my-edit --plan video-work/my-edit/plan.json            # render
```

## What it does

The first run analyses the clip. The results are cached in the output folder.
- **Shots:** found from colour-histogram cuts.
- **Beats:** tempo, beat grid, downbeats and hard onsets, all from the soundtrack.
- **Person mask:** computed for every third frame with U²-Net human segmentation, running locally (the 176 MB model downloads once).

Every output frame then goes through these steps:
1. **Reframe to 9:16.** Either `crop` (a crop that follows the subject, held steady within a shot) or `fit` (the whole frame in a band over a blurred fill).
2. **Look.** One of 22 Photoshop-style looks for the segment.
3. **Beat motion.** A punch-in on every beat (stronger on downbeats), a slow drift zoom, shake on hard onsets, and a white flash and RGB split on cuts.
4. **Events.** Freeze-frame cut-outs (the person cut out with a white edge over a spinning sunburst) and captions: `impact` for big glowing words, `aura` for rising "+1000 AURA" pops, `caption` for smaller text.
5. **Aura meter.** A bar across the top that fills to MAX by the end.

Frames render in parallel, then get scaled to 1080 × 1920 with a light sharpen and muxed with the original audio.

## Looks (`fx.py`)

| Look | What it does |
|---|---|
| `teal_orange` | Cinematic split-tone and bloom |
| `noir_red` | Black and white that keeps the reds |
| `cyberpunk` | Purple/cyan duotone, chromatic aberration, scanlines |
| `golden_aura` | A gold flame rim around the person, darker world |
| `neon_aura` | A two-tone colour-cycling rim |
| `thermal` | Heat camera |
| `comic` | Posterised pop art, ink lines, halftone dots |
| `sketch` | Pencil drawing that bleeds into colour |
| `vhs` | Tape blur, colour bleed, tracking band |
| `glitch` | Slice displacement, RGB split, blocky data damage |
| `dream` | Orton glow |
| `purple_haze` | Violet and gold duotone with heavy bloom |
| `infrared` | Aerochrome-style hue swap |
| `matrix` | Green grade with digital rain |
| `green_rays` | Matrix grade plus god rays |
| `storm` | Steel-blue grade with lightning bolts on the beats |
| `embers` | Warm grade with rising sparks |
| `noir` | Hard black and white with grain |
| `oil` | Painterly |
| `kaleido` | Mirrored symmetry |
| `film` | 16 mm weave, grain, dust, scratches, light leaks |
| `invert` | Negative |

Add a look by writing `def mylook(img, c): ...` in `fx.py` and listing it in `LOOKS`. `img` is float BGR in the range 0 to 1. `c` gives you:
- times: `t`, `lt`, `p`;
- the beat: `pulse`, `beat_i`;
- the subject: `mask`, `subject`;
- a seeded `rng`;
- procedural layers through `c.layer('rain' | 'lightning' | 'embers' | 'leak')`.

## The plan

```json
{
  "size": [1080, 1920], "meter": true, "punch": 0.04, "downbeat_punch": 0.1, "flash_cuts": true,
  "segments": [ { "t0": 0, "t1": 1.33, "look": "film", "frame": "crop" },
                { "t0": 6.63, "t1": 9.4, "look": "noir_red", "frame": "fit", "shake": false, "zoom": 0.1, "letterbox": true } ],
  "events": [ { "t": 26.78, "kind": "freeze", "dur": 1.35, "text": "+1000 AURA" },
              { "t": 34.86, "kind": "text", "text": "SILENT.\nDANGEROUS.", "style": "impact", "dur": 1.4, "y": 0.74, "glow": [60, 255, 120] } ]
}
```

- `--auto` writes a plan for any clip:
  - a look per shot, with long shots split on downbeats;
  - a freeze in the longest shot;
  - captions every few bars;
  - an "AURA: MAX" ending.
- `info.json` in the output folder lists the shots, beats and downbeats, so you can line things up by hand.
- `examples/aura-edit.json` is a hand-tuned plan for a 76-second clip.
- A minute of video renders in about 5 to 10 minutes on 4 cores.

Fonts: Anton and Bebas Neue (SIL OFL), in `fonts/`.

Only post edits of footage you have the right to use. Clips from films and shows belong to their owners.
