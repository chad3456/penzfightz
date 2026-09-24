# Where is everybody?

The Fermi Paradox in fifty-eight seconds, explained by a cat who may or may not
be in this box.

`public/fermi/index.html` and `public/fermi/fermi.js`. Plain JavaScript: no
libraries, no build step, no image files, no audio files. It opens from a bare
`file://` as well as from the shelf, and `scripts/render-fermi.mjs` writes it
to a video.

## What it says

1. **1950.** Over lunch at Los Alamos, Enrico Fermi asks: *“But where is
   everybody?”*
2. **The numbers.** A few hundred billion stars in our galaxy, most with
   planets, many of them billions of years older than the Sun.
3. **The arithmetic.** Crawling at 1% of the speed of light, one curious
   species could cross the galaxy (about 100,000 light-years) in roughly ten
   million years. The galaxy is about thirteen billion years old — it has had
   time to be crossed a thousand times over. Two torn strips of paper make the
   point at the same scale: at that scale the long one would be about nineteen
   screens wide.
4. **The silence.** So the sky should be full of their noise, and it is not.
5. **Five guesses,** pulled out of the box: the Great Filter is behind us and
   life is rare; the Great Filter is still ahead of us; they are out there
   keeping quiet; civilisations flicker, a million years apart; and we have
   barely looked — searches so far amount to about a hot tub's worth of all
   Earth's oceans (Wright, Kanodia and Lubar, 2018).
6. **The box.** Schrödinger's cat is alive and dead until somebody opens the
   box. The galaxy is the same sort of box: until we find someone, or are sure
   there is no one, it is both crowded and empty. A footnote on screen says
   what this is — a metaphor — and that Schrödinger meant his cat to sound
   absurd too, which he did: it was a 1935 argument against taking
   superposition literally at the scale of cats.
7. **So we keep listening.** A far star blinks three times. The cat's ears go
   up. The box is still closed.

The film does not pick an answer, because nobody has one.

## How it is made

**Every frame is a pure function of its timestamp.** `frame(ctx, t)` depends on
nothing but `t`: no accumulated state, no `Math.random`, no clock. Every
"random" thing is a hash of something fixed. That is the only reason the same
code can play live and render frame by frame to a file.

**Collage.** Cut-outs get a hard shadow where they lift off the sheet, a white
rim where the colour was cut through to the paper, then their colour, then a
texture glued inside — newsprint, halftone, gingham, corrugated card. Captions
are torn strips held down with washi tape and written onto.

**Paper does not boil; ink does.** A cut edge is seeded from the shape and never
changes. Ink outlines are re-traced eight times a second with a fresh wobble,
the way a hand-drawn line shivers when every frame is drawn again. Cut-outs
move on twelves, like stop-motion.

**The lettering is a hand, not a font** — the stroke-order letterforms from the
rest of the Back Bench, ported into the script so the film has no
dependencies, and drawn on in stroke order so text arrives the way
handwriting does.

**The sound is synthesised in the same file,** sample by sample, into one
buffer: a music box (three decaying partials), a Karplus–Strong plucked bass, a
soft pad, paper rustles, star plinks timed off the same star table the picture
pops them from, a clock that speeds up while the galaxy fills, radio static, a
heartbeat, a cat's chirp, three beeps from very far away, and a small Freeverb
hall. Everything stops for the silence scene. In the superposition scene the
tune is played on two music boxes fourteen cents apart — the nearest a
soundtrack gets to being two things at once. The buffer is synthesised while
the poster frame is on screen, because only *playing* audio needs a click.

## What only showed up on screen

- **Every e read as a 6.** The glyph drew its bar and then ran its bowl
  clockwise from the bar's end, which leaves the opening at the top right. At a
  hundred and thirty pixels in a title it was impossible to miss — and it was
  the same glyph the whole site is lettered in, so it is fixed there too.
- **The captions were still being written when the scene cut away.** At a
  thirtieth of a second a letter the subtitle finished after the title scene
  had ended.
- **The halo was on the wrong cat.** It was drawn relative to the cat, not to
  its head, and the lying cat's head is nowhere near the cat's origin — so the
  dead cat's halo floated over the living cat's head, which rather muddles the
  point of the scene.
- **The speech bubble sat on the speaker's head**, and when moved, on the
  caption.
- **A three-hundred-pixel tile of gouache repeats as a grid you can count.** It
  is laid twice now, at two scales and an angle.
- **One `ink()` call overwrote the caller's alpha** instead of multiplying it,
  so fading captions and ghost cats drew their outlines at full strength.

## Rendering

    node scripts/render-fermi.mjs out.mp4 1080 30

The script opens the page with `?render`, asks it for the score (the very
buffer the browser would play, at 48 kHz), then asks for each frame at n/30 s
and pipes the JPEGs straight into ffmpeg, so nothing a minute long ever sits on
disk as PNGs.
