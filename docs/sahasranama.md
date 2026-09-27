# Vishnu Sahasranama

A deep dive into the thousand names of Vishnu, told in starlight. One particle
cosmos stands behind a scroll story in eight chapters and changes shape as you
read. The design borrows its manners from trinetra.shivag.fyi — dark navy,
letterspaced capitals, gold Devanagari, a counter in the corner (`03 / 07`),
*scroll to awaken* — and replaces its subject with the Vishvarupa of
Bhagavad Gita 11.

`src/sahasranama/` is the whole thing: `Sahasranama.tsx` the page,
`cosmos.ts` the particles, `data.ts` and `gita11.ts` the texts.

## The chapters

| | chapter | the cosmos becomes | the text |
| --- | --- | --- | --- |
| 00 | Awakening | Krishna's face | |
| 01 | The Bed of Arrows | a field of arrow shafts with gold tips | Yudhishthira's six questions, Purva Pithika 8–9 |
| 02 | The Answer | a three-tiered lotus | Bhishma's answer (10, 14) and the colophon (20): the deity of the hymn is the son of Devaki — the man standing beside Yudhishthira |
| 03 | The Cosmic Body | the Dhyana shloka's body: the bust above, a spiral sky for a navel, an ocean for a belly, the earth for feet, the sun and moon for eyes, each part labelled on the stars | Dhyana 2 |
| 04 | The Universal Form | the Vishvarupa: the figure, a ring of ten faces, thirty-six arms, two discus rings, a thousand suns overhead | Gita 11.3, 11.8, then — *open the divine eye* — the particles burst outward and the vision arrives a verse at a time: 11.10–13, 11.16, 11.19, 11.32; and the names that describe it, *sahasramūrdhā viśvātmā sahasrākṣaḥ sahasrapāt* (224–227) |
| 05 | The Thousand Names | a four-armed spiral galaxy whose thousand brightest stars are the names, in recitation order from the centre out | hover to read a star, tap to pin it, search in English, IAST, Devanagari or by number |
| 06 | Names That Tell Stories | Krishna's bust | 47 names with a reading and a note; tap one to fly to its star |
| 07 | The Stotram | drifting dust | the whole hymn — Purva Pithika, Dhyanam, the 110 verses of names, Phalashruti — in Devanagari with IAST on a toggle |

## The paintings, in particles

Five of the chapters are paintings (`painting.ts`), original compositions in
the manner of contemporary devotional painting — swirling brush-stroke skies in
saffron, rose and lilac, deep-blue skin, gold ornament, faceted lotuses:

| | plate | what is in it |
| --- | --- | --- |
| 00 | *faces* | a fan of nine faces on a turning mandala, fourteen arms with white-dotted skin and gold bands holding discus, conch, mace, lotus, bow and sword, a lotus on the chest, and in the belly a lit arch with a flute and a peacock feather |
| 01 | *arrows* | the bed of arrows at sundown: a low sun, a purple field, Bhishma in white on the arrows, the brothers watching, one in yellow |
| 02 | *lotus* | a sky burning in circles, a great faceted lotus, the blue Lord leaning in from the right |
| 04 | *vishvarupa* | the Universal Form over Kurukshetra: seven serpent hoods, twelve arms with their weapons, gold pleats, a flying red scarf, a chariot very small on a far hill |
| 06 | *portrait* | the Lord against a wheel of peacock feathers and a saffron sun, a marigold garland |

They are painted at load time on a canvas, stroke by stroke, with a seeded
hand; the faces are the Krishna busts rendered for the Gita films, set into the
compositions and painted over. Every mark also goes into a depth canvas, so the
layers stand apart when the picture turns.

Then each plate becomes about 90,000 brush strokes (42,000 on a phone). A
stroke takes its colour from the paint, its direction from the grain of the
picture (a smoothed structure tensor, so strokes run along edges and round
forms), its length from how busy the picture is there — long in the sky, short
in a face — and its depth from the depth canvas. The shader draws each as a
bristled, tapering dab with a dry, broken tail. The paint never quite dries:
strokes breathe, a slow wind ripples through them along their own grain, the
pointer stirs a vortex, and between chapters the strokes pour from one picture
into the next. The cosmic body, the galaxy and the drifting petals of the last
chapter are built from geometry the same way.

**Every stroke is one of the thousand names.** Tap any stroke of paint and a
card gives the name — its archana line in Devanagari and IAST, the name, and
what it means — and every other stroke carrying that name lights up across the
painting. The meanings of all thousand (`meanings.ts`) were written for this
page after Shankara's commentary; `source/meanings.txt` is the list to edit,
and `scripts/gen-sahasranama-meanings.py` rebuilds the module.

Three colourings: **Dawn** (warm paper, the default), **Dusk** and **Night**,
remembered on the device.

## Search

The archana lines are in the dative (*keśavāya*, *viṣṇave*), so a query is
folded — diacritics off, *ś ṣ* to *sh*, *ṛ* to *ri*, *c* to *ch* — and loses a
final vowel before it is matched: *Govinda*, *govind*, *गोविन्द* all find him —
twice, at 187 and 539 — and *187* goes straight to the first.

## Sources

- The stotram and the namavali: the MIT-licensed npm package
  *hindu-devotional-texts* 0.8.0 (Ishank Gupta and contributors), following the
  recension recited in Shankara's tradition; its IAST is round-trip verified.
  `data.ts` is generated from it.
- Gita 11: Devanagari and IAST from the same package; English by Shri Purohit
  Swami (1935), public domain. `gita11.ts` is generated from it.
- The readings of the names were written for this page after the traditional
  commentaries. They are short glosses, not a translation.
- The paintings are original compositions made in code for this page; the faces in them are renders of Lee Perry-Smith's head scan (CC BY 3.0).
- Type: Cinzel, Cormorant Garamond, Tiro Devanagari Sanskrit and Noto Serif
  Devanagari, SIL OFL.
