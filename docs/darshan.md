# Darshan

*Thirteen gods, thirty-two postures each, and not one of the four hundred and
sixteen exists as a drawing anywhere.*

---

## One · What is being generated

Flat mid-century vector: no outline anywhere, every edge a change of fill,
eight or nine colours for a whole figure on unbleached cream. That style is
easy to imitate badly — pick some flat shapes, pick a warm palette — and the
thing that separates an imitation from the real article is not the palette at
all. It is the light.

## Two · One light, and one line

There is a single terminator, and it crosses the *entire card*. Every part of
the body is painted its light colour and then the shadow colour is painted over
it clipped to that part, against the same line:

```ts
shade(f, pts, tone) {
  poly(f, pts, tone.light);
  this.clipTo(f, pts, () => poly(f, this.shadow, tone.dark));
}
```

Because the line is shared, the arm, the sash, the mace and the ear all turn
away from the light at the same moment, and thirty separate polygons read as
one solid person standing in one room. Shade each part on its own local
normal — which is the obvious thing to do and is what makes the version of this
that looks wrong — and you get thirty small correctly-lit objects that do not
add up to anybody.

The line is allowed a few facets, because the reference has them: a shadow
across a chest breaks at the sternum rather than running smoothly over it, and
the breaks are what stop the whole thing looking like a gradient somebody
threshold-ed.

It also has to stay near vertical. The figure is two and a half times taller
than it is wide, so a terminator tilted more than about a fifth of a radian
stops being a line down the body and becomes a horizon across it — which lights
the head differently from the feet. The first pass used a third of a radian and
every god came out with a dark chest and pale legs.

## Three · A rig, not a silhouette

Thirty-two Krishnas are only thirty-two pictures if the body moves, so there is
a jointed skeleton and a pose is a set of angles at its joints. Limbs are then
built as tapered shapes between the joints, which means a raised arm
foreshortens into a shorter, fatter shape by itself rather than needing a
second drawing.

Half the poses are named from the tradition, because the tradition already has
better names than I would invent: **samabhanga**, the straight symmetric
stance; **abhanga**, the single bend with the weight on one hip;
**tribhanga**, the triple bend at neck, waist and knee that every Krishna in
stone stands in; **alidha**, the archer's lunge; **padmasana**, seated.

### Angles are absolute, not deltas

The obvious design is a shoulder angle plus an elbow *bend*, and it is
miserable: half the poses want the forearm pointing somewhere specific, and
working out the bend that gets it there is arithmetic rather than drawing. Both
angles are measured from hanging straight down and are side-relative, so a
positive number always swings away from the body and π is straight up.

### Things that were wrong, and what they were

| It looked like | It was |
| --- | --- |
| a squat blob with its head near its own hips | the spine built *downwards* — `step` takes a negative length to go up the page |
| plumbing | two tapered capsules meeting at a point, with no joint between them, notching every bent elbow |
| a gourd with a god standing in it | a seven-point dhoti smoothed through its midpoints into an egg |
| a startled expression, on all of them | the eye line under the hairline instead of half way down the head |
| a face with no nose | the profile rounded through its midpoints — the nose is the one feature that leaves the skull, and smoothing takes the half that was working |
| a cross-legged god floating above his own shadow | the ground taken from the toes, which on a seated figure are up by the waist |
| Durga with two arms | `extraPairs` living on the deity while `skeleton` only ever read the pose |

The seated poses are worth their own note. A cross-legged figure is not a
standing one with its knees bent: the whole body drops, and what you can
actually *see* of the legs is cloth. Modelling the folded shins and then
covering them costs the same and looks worse, because every error in the
folding shows at the silhouette. So a lotus pose draws a broad low triangle of
cloth with two soles turned up on it, which is how it is carved.

## Four · The iconography is not invented

In this tradition the object in the hand is not a prop, it is the name of the
god written down. Four hands holding conch, discus, mace and lotus *is* Vishnu,
and swapping any one of them makes the picture mean somebody else. Krishna is
the colour of a rain cloud and holds a flute; put a discus in that hand and it
is Vishnu, whose incarnation he is, and the picture now says something
different.

So the skin colours, the attributes and the mounts below are the received ones,
and where a detail varies by region I have taken the one that is most widely
painted. These are living figures for a great many people and they are drawn
here with the attributes the texts and the temple bronzes give them.

| | colour | holds | carried by |
| --- | --- | --- | --- |
| Krishna | rain cloud | the bansuri | no mount |
| Rama | dark blue | the bow Kodanda | the chariot of Ayodhya |
| Hanuman | vermilion | the gada, and a mountain | the wind |
| Durga | gold, eight arms | trishula, khadga, chakra, shankha, bow, gada | a lion |
| Shiva | ash | trishula and damaru | Nandi, the bull |
| Parvati | gold | the padma | a lion, when she needs one |
| Ganesha | vermilion, elephant-headed | ankusha, pasha, a modak | a mouse |
| Kali | night | khadga and kapala | nothing carries her |
| Vishnu | rain cloud, four arms | shankha, chakra, gada, padma | Garuda |
| Lakshmi | gold | the padma and the kalasha | an owl |
| Saraswati | white | the veena and the pustaka | a swan |
| Kartikeya | amber | the vel | a peacock |
| Narasimha | saffron, lion-headed | chakra and shankha | none — he arrives |

The attributes also decide the framing: each has a *reach*, so the camera fits
the god **and the thing he is holding**. Without it the frame fits the body and
a trident a metre longer than its owner runs off both edges, which is what the
first contact sheet of Durga looked like.

## Five · Where the variants come from

A variant is not a recolour. Six independent choices: which pose (taken by
index, so thirty-two runs through every pose the god has before repeating any),
mirrored or not, where the light falls, which hair, which hand carries what,
and how close the crop is. That is far more than thirty-two combinations, and
the seed makes any given one reproducible.

Choosing the pose by index rather than at random matters more than it sounds. A
random draw over twelve poses gives three or four duplicates in thirty-two, and
the duplicates are the first thing anybody notices on a contact sheet.

## Six · The camera stands them on a line

The figure is fitted on **height**, and width is allowed to argue only so far.
Fitting on whichever is tighter shrinks a dancing figure to half the size of a
standing one, and a contact sheet of that reads as the pose deciding how
important the god is.

And the composition is anchored on the ground line rather than centred on the
bounding box. Centred, a seated god floats in the middle of the card with a
hand's width of nothing under him while a standing one sits on the bottom edge.
Anchored, all thirteen stand on the same ground.

## Files

| file | what |
| --- | --- |
| `palette.ts` | the colours, and why skin is iconography rather than pigment |
| `rig.ts` | the skeleton, and twenty-eight poses |
| `ink.ts` | flat fills, tapered limbs, and the one light |
| `body.ts` | the figure, four kinds of head, garments and jewellery |
| `props.ts` | twenty-one attributes, and how far each reaches |
| `gods.ts` | who is who |
| `portrait.ts` | the variants, the camera, and the card |
| `plates.ts` | the atlas bake and the print-size redraw |
