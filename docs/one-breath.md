# One Breath

*A hundred brush drawings, four or five marks apiece, and a great deal of paper.*

---

## One · A stroked path is the wrong tool

`lineWidth` is constant along a path. A brush is nothing *but* its change of
width — the mark is a ribbon whose thickness is how hard the hand was pressing,
tapering to nothing where it lifts. Stroke a path and you get a wire; the shape
of the mark has to be built.

So every mark here is a filled polygon. The gesture is authored as a handful of
control points, splined, resampled to an even step **in pixels**, given a width
at each step, and offset to both sides:

```ts
const line = even(spline(px, 16), Math.max(1.4, w * 0.006));
// … a width per step, from a base, some swells, some skips and two tapers …
A.push([line[i][0] + nx * half * ja, line[i][1] + ny * half * ja]);
B.push([line[i][0] - nx * half * jb, line[i][1] - ny * half * jb]);
```

The resampling has to be even or nothing else works: the width profile is
indexed by position along the mark, so a swell authored at the halfway point
otherwise lands wherever the control points happened to bunch up.

## Two · Thin is also pale

This is the rule that sells it as wet media rather than a fat pen, and it is one
line of code. A brush carrying less pigment lays down less of it, so **the width
and the depth of the colour are the same variable**. Draw the ribbon at one flat
colour and it reads as a cut-out ribbon. Let the colour ride the width and it
reads as ink.

Which means the ribbon cannot be one polygon — each stretch needs its own
colour. Overlapping translucent fills double up at every join and print a ladder
of dark rungs across the mark, so the run is composited with `darken`: two
overlapping pieces of ink take the deeper of the two rather than the sum, which
is also roughly what wet ink does. Butted exactly end to end the pieces share an
edge but not a pixel, and the antialiasing down that shared edge leaves a pale
hairline — the same ladder, in the negative. Two steps of overlap, and each
piece outlined in its own colour.

Three smaller things carry the rest of the hand:

- **Two independent wobbles, one per rim.** One shared wobble moves the whole
  ribbon and reads as a shaky line. Two that disagree read as a brush.
- **Skips, not noise.** Losing the paper for a moment is a short, sharp,
  isolated event — a narrow notch in the width, not a general roughness.
- **Pooling at the corners.** Where the mark turns hard the brush stops
  travelling and sits down. It is the one place a corner is not sharp.

The pressure range matters more than any of them. The reference runs from a
hairline at the edge of the paper to a shoulder nine times as thick; a base of
much over a third of the peak cannot get near that, and every mark comes out the
same confident middleweight.

## Three · The silhouette is almost never the face

The economy is the whole subject, and the thing that makes four marks enough is
structural: **a head turned towards you shows its hair and its shoulder in
outline.** The face is interior, and it is three small marks — a nostril, a
mouth, a closed lid. Put the profile on the silhouette as well and you have
drawn two people.

So each of the six attitudes decides two things: what the one long contour
encloses, and where inside it the face sits.

| attitude | what the contour is | where the face is |
| --- | --- | --- |
| **recline** | hair, the dip at the neck, the point of the shoulder, the arm | interior, low, turned up |
| **profile** | the face itself, nape to throat in one pass | on the contour |
| **turned** | hair falling to both shoulders | nowhere — the nape carries it |
| **thrown** | the profile, tipped back about the throat | on the contour, upside down |
| **arms** | the head, tucking in at the jaw to meet the arm | interior, resting |
| **bust** | crown, jaw, neck, both shoulders | interior, central |

Three things went wrong in the drawing rather than the code, and all three are
about anatomy:

**Head to shoulder in one smooth swell prints a bell.** `turned`, `bust` and
`arms` all did this. What makes a silhouette a person is two narrowings and one
widening, in that order — jaw, neck, shoulder. Where the hair covers the neck
(`turned`) the outline can stay smooth, but then the hairline at the nape has to
do the work instead, and it has to be wide, shallow and low. Put it high and
small and it reads as a face peering out of the back of her head.

**The lips have a fraction of the nose's relief.** Given swings of the same size
in the landmark chain, a profile prints as a zigzag. The nose tip is the one
landmark allowed to travel.

**Rotate the outline and the features stay behind.** `thrown` was authored from
scratch first and came out as a mountain range — a throat and a mass of hair at
much the same height, with nothing saying which was which. It is the profile
chain tipped back about the throat instead, since those landmarks are already
right and rotating them keeps the chin the highest thing on the card, which is
the only reading that says the head has gone back. That works only if everything
belonging to the head makes the same journey, so `spin` returns the transform
rather than the transformed chain. It also has to be re-centred afterwards:
rotating about the throat swings the head a long way sideways, and where the
figure lands depends on how far back it went.

## Four · A hundred of them

Six attitudes taken strictly in turn come out as diagonal stripes on any grid
whose width is not a multiple of six. Shuffled within each block of six they
stay balanced — about seventeen of each — without the pattern. Beyond that each
drawing varies in scale, drift, which of the small marks the hand bothered with,
whether it is reversed, and the hand itself: weight, wobble, wetness and how
readily it skips.

The palette is deliberately narrow. Six warm inks a shade apart and four cream
stocks, so the set reads as one sitting with one jar rather than as a paint
chart.

## On the reference

The drawing this was built from carries a real artist's signature. What is
generated here is the *technique* — a single loaded brush, tapered ends, cream
ground, the face as interior marks — and the plates are numbered in the corner
where a signature would go. They are not signed, and nothing here reproduces
that drawing.

## Files

| file | what |
| --- | --- |
| `brush.ts` | the ribbon: pressure, taper, wobble, skip, pooling, and the paper |
| `figure.ts` | the six attitudes, the interior marks, and the hundred |
| `plates.ts` | baked to atlases of portrait cells |
| `OneBreath.tsx` | the gallery |
