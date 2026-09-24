# The Diary

Two minutes inside a schoolboy's diary. It writes, and then it drinks the ink.

`public/riddle/index.html` and `public/riddle/riddle.js`. Plain JavaScript: no
libraries, no build step, no image or audio files. It opens from a bare
`file://` as well as from the shelf; `scripts/render-diary.mjs` writes it to a
video.

## What this is

**A fan work.** Tom Riddle, his diary and the world around him are J. K.
Rowling's. What is here is original: every word written in the diary is new —
nothing is quoted from the books — and the score is an original waltz rather
than anything from the films. It is non-commercial, it credits the character
to its author on the page itself, and it borrows the well-known facts of his
story (the orphanage, the Chamber, the name, the six objects) rather than any
of the prose that tells it.

Earlier pieces on this site took a stricter line and would not use the
character at all. That was more cautious than it needed to be: a short
original fan piece that does not reproduce the source is a different thing
from a reproduction of it, and this is the former.

## The film

1. **The desk.** One candle is lit. A black leather diary with a name stamped
   on it in gold. It opens.
2. **The first page.** A drop of ink falls, blots, and is taken. *You found
   me. Most people never look twice at an empty book.*
3. **Wool's, 1938.** A barred window with a thin moon, an iron bed, a spoon
   that will not stay still. *They called me strange, as if strange were a
   smaller word than special.* A letter comes.
4. **Notes on Potions.** A cauldron with green fumes, five bottles, and five
   entries with his remarks on each — *Amortentia: smells of whatever you
   love. To me it smelled of nothing at all.* — a note in red that the Potions
   master is easy to flatter, and a potion against dying, struck through:
   *none. Yet.*
5. **The Chamber.** A round door with seven serpents for bolts, and a snake
   that writes itself across both pages while the hiss follows it left to
   right. *A girl died. I was given an award.*
6. **The name.** *Tom Marvolo Riddle*, written in ordinary ink, comes off the
   page letter by letter in gold and lands as the other name.
7. **Seven.** A hooded figure, and the only thing he was ever afraid of. It
   cracks along six green seams and flies apart into a diary, a cup, a ring, a
   diadem, a locket and a snake; the seventh piece stays where it was. *One of
   them is in your hands.*
8. **Write to me.** The book closes. The candle goes out.

When it ends you can write in the diary yourself. Your ink sinks, and after a
moment it writes back.

## How it is made

**Every frame is a pure function of its timestamp**, and every "random" thing
is a hash, so the page plays it live and the render script asks it for frame n
at n/30 s.

**A broad nib.** Each stroke is drawn segment by segment, as wide as a nib held
at forty-five degrees looks from the direction the segment travels — thick on
the downstrokes, thin across. That single rule is what turns a monoline scrawl
into pen and ink. A wet bead sits at the nib while it is writing.

**The drinking.** Nothing fades. For a second and a bit the ink spreads outward
into the paper, browner and fainter as it goes, and then it is not there.

**Pages turn** as a leaf pivoting on the spine, drawn front and back in page
coordinates, throwing a shadow on the page underneath.

**The score is original and synthesised in the same file**: a D-minor waltz on
celesta and harp over low strings; the same tune on a cheap, detuned music box
in the orphanage, with a clock; a choir built from vowel formants, so an "oo"
depends on the note sung; a tritone, a heartbeat and a hiss that pans with the
snake for the Chamber; a celesta glissando as the letters lift and a timpani
and brass hit as they land; glass for each crack and a shatter. A quill scratch
runs under every line the diary writes, taken from the same schedule as the
writing, so it is always the right length. It is synthesised in slices so the
page stays responsive while it is made.

## What only showed up on screen

- **Every flying shard carried a whole green disc.** The pieces were clipped
  with a wedge and the middle punched out with an even-odd circle — and
  even-odd is exclusive-or, so the part of that circle *outside* each wedge was
  added rather than removed. The pieces are now bounded properly: two cracks,
  carried on past the edge of the figure, and the rim of the piece that stays.
- **The cracks ran off the figure onto the page.**
- **The new name landed inside a white flare.** Sixteen generous additive
  glows, overlapping, summed to white; and gold on cream has no contrast
  anyway. Each letter now has a small glow and sits on a dark stroke.
- **The night was hatched straight across the moon.** The hatching was
  filtered by each line's midpoint, and the lines run the full width of the
  window, so no midpoint was ever near the moon. The lines are cut at the
  circle now.
- **The room was lit like a reading room.** One candle does not light a desk
  evenly; the light now falls off away from it.
- **The score sat twenty-five decibels under its own peaks,** which were a few
  timpani hits. It is driven harder into the soft clip now.
