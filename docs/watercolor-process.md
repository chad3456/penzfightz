# Watercolour, from blank paper

A time-lapse of a watercolour being painted from a photograph — pencil sketch,
first wash, mid tones, details, last glazes — that ends on the photograph
itself, pixel for pixel, and then proves it by sliding one over the other.
Vertical, 1080 × 1920, 48 seconds, with a synthesised score.

    pip install numpy opencv-python-headless pillow soundfile
    python scripts/watercolor-process/paint.py reference.jpg out.mp4 \
        [--title "GANPATI BAPPA MORYA"] [--deva "गणपती बाप्पा मोरया"] [--sub "watercolour · from blank paper"]
    python scripts/watercolor-process/paint.py reference.jpg stills/ --stills 5,12,20,30   # frames to check

The reference is cover-cropped to 3:4. It is not stored in the repository: the
first film was made from a photograph the user supplied, of a Ganesh
procession.

## The layers

| | stage | what goes down |
| --- | --- | --- |
| 0:01 | pencil sketch | Canny contours of a mean-shift-flattened copy of the photo, gone over twice, full on the subject and a few marks for the crowd; drawn outward from the subject |
| 0:08 | first wash | big flat shapes (mean shift at a third of the size), blurred, at 30 % pigment |
| 0:15 | mid tones | smaller shapes at half size, 62 % |
| 0:23 | details | bilateral-smoothed photo, 92 % |
| 0:31 | final glazes | the photograph |
| 0:38 | finished | |
| 0:41 | painting vs reference | a divider sweeps across; the pixel difference is computed and shown: 0 of 255 |

“Pigment” is transparent colour on white paper: a paler layer is the same
colour with its transmittance raised to a power below one, so the washes keep
their hue and only lose depth.

## The strokes

Each layer is put down stroke by stroke. Starts are sampled where the layer
differs most from what is already on the paper; each stroke runs along the
image's edges with a little wander, tapers at both ends, and has a ragged edge
cut against noise. They go on light to dark in loose patches (the sketch goes
from the subject outward). Rasterising them gives every pixel the moment the
brush reaches it; anything no stroke touched is painted just after its
neighbours. A frame is then the paper with each layer revealed up to that
moment, softened by a blur the size of the brush.

What makes it look wet:

- **pooling** — where one stroke dried against another, pigment collects in a
  darker rim that stays until a later layer covers it;
- **granulation** in the darks of the washes;
- **paper** — a cold-pressed tooth at two scales and a few fibres, multiplied
  into everything until the last glaze covers it;
- **graphite** showing through the pale washes and lost under the dark ones.

The pencil (for the sketch) or a loaded round brush — its tip in the colour it
is laying — is drawn at the head of the stroke being painted. The score is a
drone that changes chord with each stage, a few plucked notes, pencil scratch,
brush swishes and a bell at the finish.
