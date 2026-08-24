# Dot Field: how the numbers were arrived at

Every constant in `src/effects/dotfield.ts` was measured off a screen recording
of the effect rather than guessed at, and this is the record of how. It is here
so that if the effect ever looks wrong, you can check it against something
other than an opinion.

The reference: 6.4s of H.264, 1282×618, 59.94fps, captured on macOS. Two lines
of dot-matrix text on a near-black field, a crosshair pointer moving over them.

## What it turned out to be

| | value | how it was measured |
| --- | --- | --- |
| background | `#171717` | modal pixel colour, 759,538 of 792,276 pixels |
| dot colour | `#595959` | peak dot value over 81 averaged frames — white at α 0.284 over the background |
| lattice pitch | **6px** | run-length of lit columns and rows through undistorted glyphs; spacing median 6.0 in both axes, and the lattice phase held to ±0.47px across the whole clip |
| dot size | **3px square** | dot width mode 3; connected-component area exactly 9.00px² |
| force | **radial repulsion** | see below |
| radius | **166px** | grid search |
| strength | **55px** | grid search |
| falloff | **linear, `1 − d/R`** | exponent fit at 0.9–1.1, i.e. 1 |
| swirl | **none** | fitted rotation term came out at −0.00 rad |
| pointer easing | **12% per frame @60fps** | clean minimum over 0.04–1.0 |
| dot size or opacity near the pointer | **unchanged** | area 9.00–9.25px² and peak 88.3–88.7 at every distance band |

## Method

1. **Decode.** All 383 frames dumped to raw RGB with the video's tv→pc range
   conversion applied, so the colours are real sRGB and not limited-range.

2. **Find the dots.** Threshold at 45, connected-component label, take
   centroids, keep components of 4–14px so that merged pairs and compression
   speckle are both excluded.

3. **Reconstruct the undistorted text.** The lattice phase (x ≡ 0.93, y ≡ 4.98,
   both mod 6) was recovered from far-field dots across ten frames with the
   pointer in different places. Any dot more than 300px from that frame's
   pointer and sitting on the lattice was snapped and unioned into a rest set
   of 1,346 positions — the text as it stands with nothing touching it.

4. **Track the pointer.** The crosshair is the macOS `crosshair` cursor, not a
   drawn element, so it marks the true pointer exactly. Located per frame as
   the median of pixels above 200.

5. **Fit.** Warp the rest set with a candidate model, rasterise nothing —
   compare point sets directly with a symmetric Chamfer distance against the
   frame's detected dots, and grid-search the parameters.

## Two things that fell out of the fitting

**The smear that would not go away.** For the last three seconds of the clip
the word `own` stays distorted while the rest of the text is clean, which looks
at first like a decaying trail. It is not: the pointer track shows the cursor
parked at (990, 328) from t=3.5s and never moving again. The field has no
memory at all — it is a pure function of where the pointer is now. Once that
was clear the model got much simpler.

**The pointer the field uses is not the pointer.** Fitting frames where the
cursor was moving fast gave 2.5–2.7px error against 0.32px for frames where it
was parked, and the best-fit field centre lagged the real cursor by 50–85px in
the direction of travel. That is the 12%-per-frame easing. Fitting it as a free
parameter gives a clean minimum at 0.12.

## Verification

The engine is rendered in headless Chromium at the reference's exact viewport
and pointer positions, screenshotted, and put through the same dot detection.

- Dot rasterisation is exact: **9.00px²**, same as the reference. Dots are
  snapped to whole pixels when drawn, which is what keeps a displaced square
  crisp instead of smearing into a grey blob — the reference does this too, and
  it is visible in its constant 9.00px² area at every distance from the pointer.
- Undisturbed dots agree to **1.42px** after aligning for layout.
- Re-fitting radius and strength *from the engine's own rendered geometry*
  against the video independently recovers **R=166, S=56** — the shipped
  values. At the shipped R=166/S=55 the score is 1.17px against a best
  achievable 1.16px, so the force law has nothing left in it to correct.

The residual is typeface. The reference was recorded on a Mac and samples SF
Mono Bold; a Linux CI box has Liberation Mono Bold, which puts about 5% more
dots on the lattice. The advance width is right either way — 0.6em, measured —
and at a 6px lattice the difference is a dot here and there on a stroke edge.

## Where the engine deliberately differs

Below 900px wide the field scales with the viewport, and below about 650px it
drops to a 4px lattice with 2px dots. A phone fits roughly eight monospace
characters across, which at the reference lattice is eight dots of cap height —
not a letter any more. The force law is untouched; only the sampling gets finer.

## Re-running any of this

Nothing in this repo depends on the analysis, so it is not checked in as a
script. It needs `ffmpeg`, `numpy` and `scipy`, and the steps above in order.
