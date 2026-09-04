# Fifty-Two Cats: a deck where the pips are objects

A full deck — fifty-two cards and both jokers — generated in canvas 2d at
request time. No image files, no fonts, no traced anything: the card stock, the
pen line, the pips, the cats and the indices are all drawn.

The reference that started it is a single card, a five of diamonds, and it does
one thing perfectly.

---

## One · The pips are things

On that card, five diamonds are not a count printed on a piece of board. They
are five things somebody has washed and pegged out on a line, and a cat is
helping.

That is the whole design, and adopting it turns every card into the same puzzle:
**find a reason for exactly this many of exactly this shape to be somewhere a
cat can interfere with them.** Fifty-two times, with a different answer each
time. Ten clubs are what was on the shelf before the shelf was investigated.
Four diamonds have been buried with enormous care in the wrong place. An ace of
spades is a hole in the garden that nobody is answering questions about.

The constraint is what makes it a deck rather than a set of illustrations,
because the constraint is the same one a card printer has.

## Two · The count is audited, not assumed

Pips reach the paper through exactly one function, and it counts as it goes:

```ts
put: (at, size, o) => {
  pip(pad, ink, suit, at, size, o);
  if (pass === 0) count++;
},
```

`auditDeck()` redraws all fifty-four into an offscreen context and checks the
count against the rank. It currently returns an empty array, and there is a
button in the UI that runs it, because a claim you cannot check is a claim you
should not make.

The `pass === 0` guard is not incidental. Every card is drawn three times —
see the press, below — so a naive counter reports three times as many pips as
the card has.

A five with four diamonds on it is not a stylistic choice. It is a misprint.

## Three · Six techniques and one ink

The whole card is one printing colour: vermilion for the red suits, a warm
near-black for the black ones. Everything that makes it look like a card rather
than a drawing in a browser comes from *how* the ink is put down.

| technique | what it is for |
| --- | --- |
| tapered line | anything drawn by hand — a pen laid down and lifted is thin, fat, thin |
| hatch | tone on made things, at one angle, because a hand does not change its wrist per stroke |
| cross-hatch | where one pass will not go dark enough; a second angle, never at ninety degrees, because ninety degrees reads as graph paper |
| stipple | soft tone, graded by **density** and never by dot size — an engraver has one burin, and varying the dot size reads as an airbrush |
| contour hatch | lines that follow the surface instead of crossing it, which is the only shading that describes a shape rather than darkening it |
| spot black | solid ink, used almost never, and therefore loudly |

Then the press. Each card is drawn three times: a soft blurred impression
offset by less than a hair, which is the ink spreading sideways under pressure;
the impression proper; and a faint ghost of the whole plate a fraction out of
register. The ghost is the single most convincing tell that a thing came off a
press, and it costs one extra draw.

The stock underneath is cream with fifteen hundred fibre flecks, three or four
blooms of foxing placed anywhere except the middle, and corners lightened where
a card is held.

## Four · Four things that were wrong

Each was found by looking at the output, and each looked like something else
first.

**Every y coordinate was off the bottom of the card.** `Pad` normalises x and y
independently, which is right for the square cards it was built for and wrong
for a 0.7 aspect: it puts the bottom of the picture at y = 1 rather than at
y = 1/0.7, and stretches every circle by a factor of 1.43. The fix is a two-line
subclass, because everything in `Pad` goes through one `px`:

```ts
export class CardPad extends Pad {
  px(p: Pt): Pt { return [p[0] * this.w, p[1] * this.w]; }
}
```

**Every manufactured object came out oval.** The stroke smooths through the
midpoints of its polyline, which is what a hand does and is right for a cat. It
is catastrophic for a window, a box or a shelf: the first window on these cards
was a perfect ellipse. *Smooth what grew; keep the corners on what was made.*

**The cats read as snowmen.** A cat drawn in true profile has one eye, no ear on
the far side, and a snout — and it reads as a fox, or a dog, or a snowman with a
nose. The convention every cartoon cat since the twenties has used is to keep
the **body in profile and turn the head to the front**: two ears, two eyes side
by side, a muzzle in the middle. It is anatomically impossible and it is
instantly a cat.

**A curled cat came out half the size of a sitting one.** `size` meant "one unit
of the pose's own coordinate space", and in that space a sleeping cat only
reaches y = 0.5 while a rearing one reaches 1.15. Normalising on height alone
then made the lying poses enormous, because a cat asleep is wider than it is
tall. Every pose is now measured at load and normalised on its **longest side**,
which is the number a person means when they say how big a cat is.

## Five · The rig

Sixteen poses, each an authored closed silhouette plus joint chains for the legs
and tail. There is no solver, on purpose: a solver gives you plausible joints,
and what this needs is the exact pear of a sitting cat and the exact stretch of
one standing on its back legs to reach something it should not.

The gags ask the pose where its paws ended up rather than guessing:

```ts
const c = s.cat({ pose: 'hold', at: [0.54, H * 0.44], size: 0.38 });
const p = pawAt(c, 'fore', 1);
s.put([p[0] + 0.014, p[1] + 0.022], 0.125, { rot: 0.2 });
```

`reach(pose, size)` answers the other constant question — how far above its feet
the highest front paw gets — so a cat reaching for a pip on a washing line
actually reaches it, and goes on reaching it after the pose is edited.

Cats are drawn as smoothed outline and furniture as hatched shapes with the
corners kept. That contrast is how an engraver tells a creature from a chair
without reaching for a second colour.

## Six · The staging vocabulary

Ten primitives — a line, a shelf, a stack, a scatter, a grid, a fan, a planted
row, a box, a pile — and each card is three or four lines of that vocabulary
plus a cat doing something specific. That is how an illustrated deck is really
made: a small number of set-ups, and the joke is in the casting.

Every primitive takes a **maximum** pip size and works out what will actually fit
in the span it was given. Sizing pips by hand works right up until somebody
changes the global pip size once, and then a ten has six pips on top of each
other and a two looks like it lost something.

## Files

| file | what |
| --- | --- |
| `ink.ts` | the six techniques, the press, the stock, the cut edge, `CardPad` |
| `pip.ts` | the four suit shapes, pegged pips, the ace ornament |
| `cat.ts` | sixteen poses, the front-facing head, `pawAt` / `reach` |
| `props.ts` | line, box, shelf, bowl, sofa, slot, tray, ladder, mirror, and the rest |
| `numeral.ts` | the index, drawn as pen strokes rather than typed |
| `gags.ts` | the staging vocabulary and fifty-four jokes |
| `card.ts` | one card start to finish, the deck, and the audit |
