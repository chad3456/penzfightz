# Format recipe: "Tesserae" (this site), as studied

Source: a 42 s screen recording of the Tesserae page, analysed with `analyze.py` (10 shots; the first five are page loading and were ignored). This example shows how the measurements become a recipe and a style. Your own reference gives you your own.

## 1. In one line
One continuous build: something precious appears at the centre, and the camera keeps pulling back as the world assembles around it.

## 2. Structure
| Part | Share | What happens |
|---|---|---|
| Seed | ~10% | a single detail (the pupil), held long enough to read |
| Build | ~70% | one unbroken pull-out (`pull-out` for 12.3 s in `analysis.json`) |
| Reveal | ~20% | the whole picture, locked off, with only the light moving |

## 3. Pacing
- Long holds: the content shots run 5–12 s, and the median is pulled down only by the loading cuts.
- New information arrives through growth inside a shot, not through cuts.

## 4. Colour script
- Background: near-black olive `#0d0d0a` / `#1d1f16`, about 53% of the screen.
- Accents: gold `#b28c63`, lapis `#496091`, cream `#d7c5af` and umber `#745547`, refined to `#d9a441`, `#3f63a8`, `#e3cfa6` and `#b0532e`.
- Low overall saturation (0.25), with the colour concentrated in the subject.

## 5. Surface and light
- `flat` 0.69 and `gradient` 0.15: mostly flat fields with soft modelling. No outlines (`outline` 0.07).
- Glow 0.39 (gold highlights), vignette 0.16. A gritty texture reads as grain in the recipe, so grain is raised to 0.09.

## 6. Shapes
Small, hard-edged pieces with tight corners (`corner` 0.2); cel shading suits the faceted look.

## 7. Composition and type
- The subject is centred, slightly high (`weightY` 0.33).
- Type is small, in serif small caps, at the edges.

## 8. Motion and edit
- The camera is either locked or pulling out; it never pans for its own sake.
- Fades over cuts. Barely any idle float.

## 10. Engine settings
See `style.json` next to this file.
