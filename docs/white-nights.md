# White Nights

*A thousand story cards for Dostoevsky's four nights on the embankment. Every
face is built rather than drawn, and every word is written rather than set.*

---

## One · The two halves of a card

A card is a portrait and a line of dialogue. Both are generated, and the
interesting thing about the pair is that the *hard* parts are not where you
would expect: a plausible face is mostly a matter of getting a dozen
proportions right and then not ruining them, and a plausible line of
handwriting is a matter of getting the pen right, which is one function.

Nothing here is a picture of anybody, and nothing here is set in a face that
somebody drew to look casual.

## Two · The hand

The brief said *handwritten dialogue*, and the honest reading of that is that
the letters have to be **written** — drawn as the movement of a nib across
paper — rather than typeset in a script font. So `hand.ts` is a cursive
alphabet stored as skeletons in hundredths of an x-height, joined up word by
word, and inked with a pointed nib.

Three things separate this from a script font, and they are in order of how
much they matter:

### Downstrokes are heavy and upstrokes are hairlines

A pointed nib splays under pressure, and pressure happens on the *pull*. So
the width of a mark is a function of the direction it is travelling, and the
mark is built as an outline — the skeleton offset left and right by half its
width at each point — rather than stroked at a constant width.

```ts
const pull = Math.max(0, dy);            // screen y runs down, so this is a pull
const w = base * (contrast + (1 - contrast) * Math.pow(pull, 0.55)) * end;
```

Everything else here is detail. This is the thing your eye reads as *pen*.

### Letters join

Each glyph records where the pen arrives and where it leaves, and the bridge
between one letter's exit and the next letter's entry is drawn as a stroke that
sags towards the baseline — because the pen is being carried rather than
driven. A word is one gesture with lifts in it, not a row of stamps.

### Nothing repeats

Every glyph is jittered from the seed, the slant wanders a little per letter,
the baseline sags across the line the way a hand tires, and the jitter is
hashed from the point's own coordinates so the same skeleton point lands in the
same place whether a stroke or a join asks for it.

### The letters that had to be argued with

Three of the twenty-six did not work first time, and all three failed the same
way — by being some *other* letter.

- **`t` was a `v`.** A stem drawn up and retraced straight back down is rounded
  by the smoother into a V, so "with" read "wuvth". The fix is a doubled point
  at the very top, which holds the turn sharp.
- **`r` was an `n`.** Stem first, then the arm, gives exactly an n's
  silhouette: up, down, over. Shoulder first — the little flag at the top,
  *then* the stem — and it can only be an r. It also had to be *entered high*,
  or the join added a second upstroke in front of the letter's own and put the
  n back.
- **`i`'s dot was over the next letter.** The slant is a shear about the
  baseline, so anything high up moves right; the dot is set left of where it
  looks like it belongs so that it lands over the stem.

## Three · The face

A head is a set of landmarks in three dimensions — brow, eye line, nose base,
mouth line, chin — and a three-quarter view is those landmarks rotated about a
vertical axis and drawn flat. Do it that way and the far eye foreshortens, the
far cheek goes behind the nose and the near ear leaves the frame, all of them
for free and all of them correct. Warp a front view sideways instead, which is
the tempting shortcut, and you get a face that is looking at you and pretending
not to.

### The contour of a turned head

The edge of a turned head is not its widest point swung sideways. It is the
*contour generator* of the cross-section, and a head's cross-section is an
ellipse deeper than it is wide. For semi-axes `a` across and `b` deep, the
extreme of `x·cosθ + z·sinθ` on the ellipse is `√(a²cos²θ + b²sin²θ)`:

```ts
const b = a * DEEP;
const k = Math.hypot(a * c, b * sn);
return H.P((side * a * a * c) / k, y, (side * b * b * sn) / k);
```

Two lines of algebra, and the difference between a head that turns and a head
that slides sideways. It also has to be used by the *hair*: building the face
on the contour and the hair on raw half-widths meant the face's own fill spilled
over the hair on every turned head, which looked like a lighting bug and was a
geometry bug.

### What was wrong before it was right

Every one of these was found by rendering a contact sheet and looking at it,
and none of them by reading the code.

| It looked like | It was |
| --- | --- |
| a diagonal ruled across every face | `.reverse()` mutating the silhouette in place while the closed contour still held it |
| two dark spikes above every head | the hair's "dome" walking the full circle and closing through the chin |
| a bandage across the forehead | the headcloth's ring crossing itself, so a nonzero fill painted the enclosed cheek too |
| a notch in every jaw | the jaw drawn on the contour generator and the chin on raw half-widths, meeting at two different points |
| stitches down one cheek | a *contour* hatch across the terminator, which at portrait size is a row of short ticks |
| a swimming cap | a hairline arcing shallowly across the forehead instead of sweeping down over the temples |
| stubble | the jaw's shading hatch at four times the pitch it needed |
| buttons beside the ear | ringlets drawn as three stacked discs instead of a coil |

### The eye

More parameters than everything else together, because the gaze does most of
the work. The upper lid is heavier than the lower and sits *in front of* the
iris; the iris is cropped by it; the pupil carries exactly one highlight; and
the outer corner sits above the inner one by an amount that is the single
strongest lever on expression in the drawing. Two symmetrical almonds with
circles in them is a doll.

## Four · The dialogue

*White Nights* is public domain, and so is Constance Garnett's 1918
translation. A dozen lines are Dostoevsky's own and the card says so. The rest
is a grammar in the same register: six banks of lines split between the two
voices, a weather clause that can open a line, and a second clause drawn from
the same voice — 5,000 distinct captions, of which the deck asks for 1,000.

The night a line belongs to is not decoration. The staging reads it: the first
night is a stranger seen across a bridge and crops wide, and the fourth is a
face filling the plate.

## Five · What it costs

About seven milliseconds a card at thumbnail size, which is a hundred and forty
a second, and the bake is over in seconds on a machine with a graphics card.
Two things were nearly free to fix and were costing far more than the drawing:

- **The caption fitter drew seven invisible trial layouts.** Trying sizes until
  one fits is right; doing it by rendering the whole line at zero opacity costs
  exactly as much as rendering it properly. `write` now has a dry mode that
  returns where the text would end without inking any of it.
- **Nine hundred paper flecks on a hundred-and-fifty-pixel card** is nine
  hundred marks nobody will ever see. The count follows the size of the sheet.

Every timing here was measured on a software rasteriser inside a container, and
that environment stalls for tens of seconds roughly once a second of continuous
canvas work — reproducible with the *same card drawn three hundred times*, so
it is the container and not the drawing. None of these numbers say anything
about real hardware.

## Files

| file | what |
| --- | --- |
| `hand.ts` | the cursive alphabet, the joining, and the pointed nib |
| `face.ts` | the head in three dimensions, its hair, and the ink |
| `lines.ts` | six banks, the quoted lines, and the deduplicating generator |
| `card.ts` | the plate, the city behind her, and the written caption |
| `plates.ts` | the atlas bake and the print-size redraw |
