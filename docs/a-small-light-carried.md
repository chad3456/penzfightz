# A Small Light, Carried

Twenty-seven seconds. Twelve plates. One lens. Rāma, with Rāma left out of it.

## The method, which is borrowed

The reference is a launch film that never shows the thing it is about. It points
a single lantern eyepiece at a dozen unrelated subjects — a bird, a foxglove
plate, an old coloured map, a cell under a microscope, a plotted curve, an
engineering drawing, the moon — and what those have in common *is* the subject.
Then it opens out onto an ordinary sky, puts a name on it, and comes back to a
small bird on a branch.

That shape is what this takes. Open on something alive and ordinary, go through
a run of plates down one lens, open out, name it, come back to the same branch.

## He is never drawn

The plates are: a bow measured in cubits, a natural-history plate of a deer that
never existed, a branch of ashoka mounted like a herbarium sheet, a chart of the
road south from Ayodhya to the sea, a section through the causeway, a diagram of
one flame, an arrow's arc with the paths it did not take, a lunar plate, two
wooden sandals drawn to scale, and a city of lit windows.

No figures. No face. **That is not squeamishness and it is not a dodge.** He is
a figure a great many people hold sacred, and a drawing of him is always going
to be somebody's idea of him — where a drawing of his bow is only ever a bow.
The reference's method and this subject happen to want exactly the same thing,
which is the sort of coincidence worth taking.

## The instrument

Everything holds together because it is one lens, not twelve pictures. The
barrel is a bright circular field with a feathered edge, five concentric
machined rings going off into the dark, grain over the whole frame including
the black, a little colour fringing where the glass gives up, a vignette, and a
slow drift because nobody holds a barrel still.

None of that is a filter laid over a finished picture. It is the reason the
plates are a set.

## Drawn by the same press as everything else

The plates go through the risograph from the rooms: coverage written onto five
greyscale plates, screened into dots at five angles, overprinted, with a line
plate over the top. What changes is the vocabulary. A room is isometric and
everything in it is a solid; a lantern plate is an engraving — line first, then
a flat wash inside the line, hatching where it needs to be dark and stipple
where it needs to be soft, with labels in the italic hand every natural-history
plate is captioned in.

Plates are drawn in a unit square and scaled to whatever field they are given,
so the same plate is a thumbnail on the page and a frame of film without a
number changing.

## One number

**Every frame is a pure function of its timestamp.** Nothing accumulates,
nothing is tweened off the previous frame, no plate holds state between calls.

That is not tidiness for its own sake. It is the only reason the film can be
written to a file at all: the renderer asks for frame *n* at *n/fps* and never
has to run anything in real time, drop anything, or catch up. The page and the
file are the same code, and the file is reproducible to the pixel.

```
node scripts/render-film.mjs out.mp4 1080 24
```

A slide change is a **dip to black, not a cross-fade** — two plates a frame
would double the cost for something the barrel mostly hides, and a lantern
operator changing a slide is a dip. The dip was four tenths of a second at each
end of a shot that is one and six, so nearly half of every plate was spent in
the dark; three tenths leaves it a clear second to be looked at, which is what
it is for.

## The score

Synthesised from scratch in `scripts/film-score.mjs` and written straight out as
a WAV: two drone strings a fifth apart and slightly detuned so they beat against
each other, a four-string pattern brushed every second and a half, and one note
per plate climbing a scale. No transcription of anything, because a scale is not
a composition — it is an alphabet.

## Files

| file | what it is |
| --- | --- |
| `src/film/draw.ts` | the flat vocabulary: wash, line, hatch, stipple, label, leader, dimension |
| `src/film/plates.ts` | the twelve subjects, and the branch the film opens and closes on |
| `src/film/lens.ts` | the barrel — field, rings, grain, fringing, vignette, drift |
| `src/film/film.ts` | the cut, and the projector that answers for any moment |
| `src/film/Film.tsx` | the player |
| `scripts/render-film.mjs` | frames out, ffmpeg in, one mp4 |
| `scripts/film-score.mjs` | the drone and the notes, as a WAV |
