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

## The particles

110,000 points on a desktop (40,000 on a phone or a modest machine, or with
`?low` in the address), each carrying where it came from, where it is going and a seed. A
vertex shader mixes the two with a stagger, so a change of formation pours
rather than jumps and swirls on the way; the pointer pushes the stars aside; a
drag turns the figure with inertia. The figure formations are sampled from the
renders of the Krishna bust made for the Gita films: every lit pixel is a
candidate, weighted by brightness and by edge strength so the eyes, brows,
lips and the contours of the crown get more stars than a flat cheek, with
brightness as depth. On a wide screen the figure stands to the right of a
column of text; on a phone it stands behind the text.

The thousand name-stars are a second, smaller cloud, raycast for hover. Gold
stars are the names with a reading; a search dims everything else.

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
- The particle figure: renders of Lee Perry-Smith's head scan (CC BY 3.0).
- Type: Cinzel, Cormorant Garamond, Tiro Devanagari Sanskrit and Noto Serif
  Devanagari, SIL OFL.
