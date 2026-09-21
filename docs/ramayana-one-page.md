# The Ramayana, drawn along one very long page

Twenty scenes. One move. Two minutes forty-three.

## The shape

His whole life, left to right, in the order it happens: a fire in a hall with
no heir in it, four boys, a bow that breaks, two boons called in years late, a
road south, ten quiet years nobody records, a deer the wrong colour, a line
drawn across a doorway, an old bird on the road, a king in hiding, a leap, a
grove, a burning city, a bridge, a war, and a city that counted the days and lit
every window on the way in.

**There is one cut in the whole film and it is at the very end.** Everything
else is a single move along a single page. That is not a stylistic tic: the
middle of this story is a journey south, and a page can simply *be* the journey
— Ayodhya is at the start of the book and Lanka is a very long way into it, and
getting there takes the camera as long as it takes.

## Felt tip and crayon, on ruled paper

Three properties, all three taken off the reference and all three necessary:

1. **A thick wobbly outline.** Felt-tip, not a vector stroke. The line wanders
   off the path it meant to take by a pen-width or two, and it is gone over
   twice in places, so the weight is never constant.
2. **Crayon that does not respect the line.** Colour goes down first,
   overshooting the outline on one side and falling short on the other. Fill
   that exactly matches its outline is the fastest way to look like clip art.
3. **A shadow on the page.** Everything is a cut-out lying on the paper.
   Without it the drawings are printed *in* the book; with it they are sitting
   on it, and that is the whole conceit.

The page is ruled feint with a red margin every sheet-width, and it stays put in
world coordinates as the camera travels — which is what tells the eye it is one
very long page rather than a series of pictures.

**Everything is seeded from where it is and never from when it is.** A doodle
therefore looks hand-drawn and does not crawl about while the camera passes over
it, which is the failure mode of every "hand-drawn" filter.

## Things that had to be measured

- **The camera was framing itself in pixels.** A probe at 540 high showed a
  sensible band of ground; the same film at 720 showed twice as much empty
  paper. The view is now a fixed height in *world* units and the scale is
  derived from the output size.
- **The empty middle.** Left as-is, the band between the caption and the ground
  is bare ruled paper, and the whole thing reads as a diagram with a strip of
  drawing along the bottom. Every scene now gets a sky — a sun with a face,
  clouds, birds — and the reference page is busy for exactly this reason.
- **Clouds have to be a shape you barely notice.** The first ones were an arch
  of puffs over a flat bottom at full marker weight, and because the fill is
  nearly the colour of the paper all you saw was a large hollow outline with a
  straight edge: a croquet hoop, not a cloud. A low, wide, lumpy blob at half
  the size and half the line weight reads, and stops competing with the scene.
- **Crayon grain belongs to the page, not to each stroke.** Per-shape grain is a
  clip and a tiled blit *per doodle*, and a frame here has a couple of hundred
  doodles in it. One wax pass over the whole frame at the end costs the same as
  one doodle and looks the same.
- **Two suns.** Scenes that had been drawing their own sun kept drawing it after
  the sky started providing one.

## On drawing him

The earlier lantern film left him out entirely, and that was right for a film
with no story in it — it was twelve plates and the subject was whatever they had
in common.

This one is a life, and a life needs somebody living it. So he is drawn, as a
doodle in a school exercise book: two dots and a line for a face, the way
everything else in this world is drawn. **The register is the point.** It is
plainly a retelling in a notebook and not a devotional image, and it makes no
claim to be a likeness of anybody.

As before: scenes, not doctrine. The beats most tellings share, nothing invented
for effect, and nothing settled that the tradition leaves open.

## One number

Every frame is a pure function of its timestamp — the camera included. Nothing
eases off the frame before it and nothing accumulates, so the renderer asks for
frame *n* at *n/fps*, never runs the film in real time, and produces the same
file every time.

```
node scripts/render-frieze.mjs out.mp4 1280 24
```

The score is synthesised and written straight out as a WAV. Two and three
quarter minutes is long enough that one texture will not carry it, so it is in
five parts that follow the story rather than the clock: an open drone for the
palace, the same drone thinned for the road, a low fifth for the forest,
something restless with a drum under it for the sea and the war, and the opening
material again — slower — for the lamps.

## Files

| file | what it is |
| --- | --- |
| `src/frieze/paper.ts` | the page: rules, margin, grain, wax, vignette |
| `src/frieze/doodle.ts` | pen, crayon, shadow — how everything is drawn |
| `src/frieze/props.ts` | the cast and the crayon box: figures, trees, water, cards, sky |
| `src/frieze/story.ts` | the twenty scenes, in order, along the page |
| `src/frieze/camera.ts` | the travelling shot, and the projector |
| `src/frieze/Frieze.tsx` | the player |
| `scripts/render-frieze.mjs` | frames out, ffmpeg in, one mp4 |
| `scripts/frieze-score.mjs` | the drone, the phrase, and the drum |
