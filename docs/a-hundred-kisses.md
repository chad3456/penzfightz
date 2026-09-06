# A Hundred Kisses

*One unbroken line each, and none of them has a plan.*

---

## One · What a scribble actually is

Scribble is not a texture you apply to a finished drawing. It is a way of
*finding* a drawing, and its whole character is that the line never stops and
never quite commits. So nothing here is outlined and then filled.

This took three attempts and the first two are instructive, because they are the
obvious things and they are both wrong:

1. **A zigzag traversing the shape's bounding box, clipped.** This is corduroy.
   Evenly spaced parallel passes with a small oscillation read as ruled lines,
   because that is what they are.
2. **The same zigzag at an angle, with a bow in each stroke.** This is hatching.
   Better, and still a plan — the eye reads the regular spacing immediately.

What actually works is a **pen with momentum, confined to the shape**:

```ts
a += (r() - 0.5) * turn;                 // the direction is only ever the
const next = [x + cos(a) * step, ...];   // last direction plus a nudge
if (!inside(path, ...next)) {
  a += Math.PI * (0.7 + r() * 0.6);      // turn back in, but not neatly
  continue;
}
```

It wanders, and when the next step would take it outside it turns roughly back
in and carries on. One line, no lifts. The density is not a parameter of the
mark — it is **how long the pen was left running**, which is also true of a real
scribble.

The bounce is deliberately untidy. A scribble that reflects off the boundary
like a billiard ball reads as a machine; adding most of a half-turn plus a
random amount is what keeps it looking like a hand.

## Two · The searching outline

The edges are gone round two or three times, each pass slightly off the last.
That overlap — the same edge found more than once and never in quite the same
place — is the single thing that separates a scribble from a shaky line. A
single wobbling outline looks like someone drawing badly; three offset ones look
like someone drawing quickly.

## Three · The lips are the anchor

The two heads are placed from their **mouths** outward rather than from their
centres, so `close` means what it says: at zero the lips meet, and either side
of that is a moment before or a moment into it.

That also forces the profile to be right in the one place it matters. In a true
profile the **upper lip is the furthest forward point of the whole face** —
further than the nose. Get that wrong and the two of them are touching noses.

Everything else varies: nine kinds of hair, the tilt of each head towards the
other, the difference in their heights, six inks, six papers, and a hand that
varies in how loose it is, how fast it is going, and how many times it goes
round. A hand at the jaw, a heart, loose hair, or rain.

## Files

| file | what |
| --- | --- |
| `kiss.ts` | the hundred, the profile, the searching outline and the scribble |
| `plates.ts` | the atlas bake and the print-size redraw |
