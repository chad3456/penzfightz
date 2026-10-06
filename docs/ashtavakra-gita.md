# अष्टावक्र गीता — the Ashtavakra Gita, as Claude reads it

Open it from **Effects → अष्टावक्र गीता**. The interface can be in Hindi,
English, or both; the choice is remembered.

## The text

- **Sanskrit:** all 298 verses in 20 chapters, from the Wikisource text
  (public domain). The source is the
  [dhrmaorg/ashtavakra_gita](https://github.com/dhrmaorg/ashtavakra_gita)
  dataset.
  - `scripts/ashtavakra/build.py` joins the dataset's broken lines, removes
    the speaker lines, and splits each verse into its two half-verses.
  - It also corrects the clear slips against the commonly printed reading,
    for example वैराग्यं च … प्राप्तमेतद् (1.1), मुक्तिमिच्छसि … विषयान्
    (1.2), गृह्णाति (8.1), and the garbled 18.16, 18.22 and 18.27.
  - A check afterwards: 589 of the 596 half-verses come out at exactly 16
    syllables. That is the anuṣṭubh metre the work is composed in, which
    suggests the text is clean.
- **English:** John Henry Richards's translation, which he donated to the
  public domain.
- **Hindi** (`src/ashtavakra/hi.ts`): every verse rendered fresh for this
  site, in plain, dignified Hindi, meaning first. It is not taken from any
  published translation or commentary. In particular nothing comes from the
  Osho volume in `data-sources/`. Its text layer is garbled by a
  font-encoding problem, and it is copyrighted commentary, so it was not
  used.
- **Who speaks** follows Richards: Janaka speaks 1.1 and chapters 2, 7, 12,
  13, 14, 19 and 20; Ashtavakra speaks the rest.

## Claude's reading

`src/ashtavakra/chapters.ts` holds Claude's reading of the text.
- **For each chapter:** its name in Sanskrit, Hindi and English, the image
  it keeps returning to, and an opening reading in Hindi and in English.
- **Close readings** of 52 verses that carry their chapters.

Throughout, Claude reads as what it is: an AI reading a text about the
witness, without claiming to have realised anything. The readings:
- say what the words do;
- notice the grammar: *adhunaiva* "right now", *khelanti* "they play",
  *helayā* "playfully", *svāsthya* "standing in oneself";
- point out where the text is most radical (1.15: your bondage is that you
  still practise samādhi);
- say plainly where verses speak in the male voice of their age (3.4–3.7,
  17.14);
- end, on 20.14, by declining to add anything.

## Recitation (पाठ)

Claude recites in four steps: measure the breath, say it plainly, look from
where it stands, then stop.
- **The metre.** `translit.ts` turns Devanagari into IAST and splits each
  half-verse into syllables. A syllable is heavy (guru) if its vowel is long,
  if it carries anusvāra or visarga, or if two or more consonants follow it.
- **The sound.** `audio.ts` renders a tanpura cycle (Pa, Sa', Sa', Sa on C♯)
  with a Karplus–Strong string model and a buzzing jawari bridge. It also
  plays a soft tick on each syllable, long for heavy and short for light.
- **The sequence.** The verse lights up one syllable at a time: one beat for
  a light syllable, two for a heavy one, with a breath at each quarter. Then
  the Hindi appears, then the English, then Claude's note if there is one,
  then three seconds of silence, then the next verse.
- **Voice.** If the device has a Hindi voice, the verse can also be spoken
  aloud through the Web Speech API.
- **Controls:** pace, the tanpura on or off, and skipping between verses.

## The pictures

Each chapter opens on a canvas picture of its central image, and the pointer
can disturb it:

| Chapter | Image |
|---|---|
| 1 | Five elements circling a point that never moves |
| 2 | One ocean, with "aho" glowing over it |
| 3 | Mother-of-pearl that reads as silver until you come close |
| 4 | Smoke that never touches the sky |
| 5 | Bubbles returning to the sea |
| 6 | Pots made and broken in unbroken space |
| 7 | A boat drifting on its own wind |
| 8 | Threads that knot while you move and loosen when you rest |
| 9 | Pairs of opposites fading as they rise |
| 10 | A city of cloud lasting "three or five days" |
| 11 | A light with nothing to shine on |
| 12 | Body, speech and thought dissolving in that order |
| 13 | A leaf on a stream |
| 14 | The moon in still water |
| 15 | A rope that is a snake until your light reaches it |
| 16 | Scripture written and wiped away |
| 17 | One flame |
| 18 | Dry leaves on the wind while the sun crosses the day |
| 19 | "Kva?" questions rising and dissolving |
| 20 | The page emptying to a point, and then not even that |

The landing page draws Ashtavakra's name as a golden line bent in eight
places, which straightens as you come near it. The twenty chapters appear as
a mala, each bead sized by its chapter's length (chapter 18 has 100 verses).

## Typography

- **Sanskrit:** Tiro Devanagari Sanskrit.
- **Hindi:** Noto Serif Devanagari.
- **English and IAST:** Cormorant Garamond.
- **Labels:** Cinzel.
- **Numbers:** Devanagari numerals in Hindi mode (१.३).
- **Language:** the page sets `lang="hi"` unless English-only is chosen.
