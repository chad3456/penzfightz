---
name: video-recipe
description: Take apart a reference video (YouTube link or local file) to learn its format and visual style — shot pacing, colour palette, surface (flat/gradient/outlined/grainy), glow, camera motion, transitions, narration density — write a reusable "recipe" for that format, then make a brand-new animated video in that style from the user's own description, rendered entirely from code (original shapes, characters, type, voice and score). Use when the user pastes a video link or file and asks to "study its style", "make a video like this", "recreate this format", "remake in this style", or gives a reference video plus a topic/description for a new animation.
---

# video-recipe

You turn **a reference video** and **the user's description** into **a new animated video** that follows the reference's *format and visual grammar* but contains only original material.

The pipeline is:

```
fetch → analyze → look → recipe.md + style.json → storyboard.json → voice → stills → render → compare
```

All scripts live next to this file (`scripts/`, `engine/`). Work in a folder the user will not commit, e.g. `video-work/<slug>/` (it is git-ignored in this repo).

## Ground rules (read first)

- **Style, not content.** Learn palette, pacing, composition, surface, motion and structure. Never trace, crop, re-use or re-encode frames, never use the reference's audio, narration, music, logos, title cards or text, and **never recreate its characters, mascots or recognisable designs** (for example a channel's signature animal or robot). Draw new characters with the engine's original figures, or design new ones.
- **Rights.** Only download videos the user has the right to download and study (their own, licensed, or allowed by the platform's terms). If a URL can't be fetched, ask for a local file; don't hunt for mirrors.
- **Facts.** Explainers teach. Check every claim in the script. If the user's premise is wrong, keep their intent and fix the claim on screen (e.g. "how Ramanujan *invented* infinity" becomes "how Ramanujan *tamed* infinity", and the film says why). Keep the title/brief they gave in `meta.brief`.
- **Say what's synthetic.** Tell the user which voice engine was used (espeak is robotic; piper or macOS `say` are better) and that music is generated.

## 1. Fetch

```bash
python3 scripts/fetch.py "<url or path>" --out video-work/<slug>
```

Uses `yt-dlp` if installed (`pip install yt-dlp`). If the download is blocked, ask the user for the file.

## 2. Analyze

```bash
pip install opencv-python numpy imageio-ffmpeg   # once
python3 scripts/analyze.py video-work/<slug>/source.mp4 --out video-work/<slug>/ref
```

This produces:

| File | What it holds |
|---|---|
| `analysis.json` | Duration and shot count. Shot length (mean, median, p10, p90) and cuts per minute. Fade share. A global palette of 10 colours with screen share, plus guessed **roles** (bg, ink, accents, highlight, shadow). **Surface** measures: flatness, gradient, outline, glow, grain, saturation, contrast, vignette and centre of weight. **Motion**: frame difference and seconds per camera move (locked, pan, push-in, pull-out). **Audio**: loudness, speech share, syllables per second. A per-shot list. |
| `contact_NN.jpg` | One frame per shot, with timecode, length and camera move. |
| `palette.png` | The global palette. |
| `timeline.png` | The shot rhythm, with colour and motion per shot. |
| `style.auto.json` | A first guess at engine tokens. |

## 3. Look

Open every `contact_NN.jpg`, plus `palette.png` and `timeline.png`, with the Read tool. Numbers miss what eyes catch, so note:

- **Shape language:** geometric or organic, corner roundness, outlines or none, how depth is shown (overlap, scale, haze).
- **Light:** rim lights, glows, gradients, shadows, and where the light comes from.
- **Characters:** proportions, how faces are simplified, and how they emote. Describe these traits in general terms only, and do not copy the designs.
- **Composition:** centred or rule-of-thirds, how much empty space, and where text sits.
- **Type:** weight, case, how much text is on screen, and how equations or labels appear.
- **Motion and edit:** idle loops (floating, bobbing), camera habits, transitions, and how often a new idea appears.
- **Structure:** cold open, title card placement, chapters, ending, call to action.

## 4. Write the recipe and the style

Fill `reference/recipe-template.md` into `video-work/<slug>/recipe.md`. This is the human-readable format recipe, and the user may reuse it for many videos.

Then write `video-work/<slug>/style.json`:
- Start from `style.auto.json`.
- Fix the palette roles by eye. Choose 4–5 accents; keep the background two-tone.
- Set `shading` (`flat`, `soft` or `cel`), `outline` (px, 0 for none), `rimLight`, `glow`, `grain`, `vignette` and `corner`.
- Set `motion` (`energy`, `drift`, `float`), `pacing` (`meanShot`, `transitions`) and `type` (`font`, `weight`, `case`).

`reference/presets/flat-explainer.json` is a genre starting point if analysis isn't possible. Say so if you use it.

## 5. Storyboard the user's description

Write `video-work/<slug>/storyboard.json` (schema: `reference/storyboard.md`; a full example is in `examples/ramanujan/`).

- **Match the recipe's rhythm.** Size the scenes so the average shot ≈ the reference's median shot length. Long narration lines can hold several visual beats; schedule elements with `at`/`out`.
- **Match its structure:** cold open, title card, chapters, ending.
- **Colour by role, not hex** (`bg`, `a2/d40`, …), so the same storyboard re-renders in any learned style.
- **One idea per scene, shown visually.** Use the engine vocabulary: figures, places, maths props, counters, journeys, particles. If something is missing, add a new draw function to `engine/engine.js` in the same house style. It must use `fillShape`, `rim` and `glow` so it inherits the style tokens.
- **Write narration for the ear:** short sentences, numbers spoken plainly. Aim for the reference's syllables per second.

## 6. Voice, stills, render

Run from the folder that holds this skill, or use absolute paths:

```bash
python3 scripts/voice.py  video-work/<slug>/storyboard.json --out video-work/<slug>/vo         # piper | say | espeak-ng | none
node    scripts/render.mjs --storyboard video-work/<slug>/storyboard.json --style video-work/<slug>/style.json \
        --vo video-work/<slug>/vo --out video-work/<slug>/out --stills                              # one PNG per scene
node    scripts/render.mjs ... --out video-work/<slug>/out                                          # full film → film.mp4
```

- **Check the stills before rendering the film.** Look at every still for overlaps, things off-frame, captions covering content, and unreadable text. Fix the storyboard or the engine, then re-run `--stills`.
- **Then render the full film.** Scenes stretch to fit their narration. Narration is laid at each scene start plus `voOffset`. The original score (`scripts/music.py`) follows the scene moods and ducks under the voice.
- **Needs:** Playwright (`npm i -D playwright`) with Chromium (or set `CHROMIUM_PATH`), ffmpeg (or `pip install imageio-ffmpeg`), and python3 with numpy.
- **Better voice:** `pip install piper-tts`, then `PIPER_MODEL=/path/voice.onnx`.

## 7. Compare

```bash
python3 scripts/analyze.py video-work/<slug>/out/film.mp4 --out video-work/<slug>/out/check
python3 scripts/compare.py video-work/<slug>/ref/analysis.json video-work/<slug>/out/check/analysis.json
```

`compare.py` reports how close the new film is to the reference on palette (ΔE), shot length, cut rate, surface and motion. If something is far off, adjust `style.json` or the scene lengths and re-render.

## Report back

When you report back:
- Give the path to `film.mp4`, its length, and the voice engine used.
- Summarise the recipe in 5–8 bullets.
- Show 3–4 stills.
- Give the compare table.
- List any facts you corrected in the user's premise.
- List anything you could not do (download blocked, no good TTS).
