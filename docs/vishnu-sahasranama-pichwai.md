# Shri Vishnu Sahasranama, painted

The Vishnu Sahasranama chanted from beginning to end and painted as a moving
pichwai. Open it from **Effects → श्रीविष्णुसहस्रनाम**. It runs about 35
minutes.

## The text

- **Four parts:**
  - the opening (pūrva-pīṭhikā), 25 verses;
  - the eight meditation verses (dhyānam);
  - the 108 shlokas of the thousand names, plus the closing Om lines;
  - the phalaśruti and closing verses, 40 verses.
- **Recension:** the Sanskrit is Shankara's recension, from the
  MIT-licensed `hindu-devotional-texts` package, as already used by the
  site's Sahasranama page (`src/sahasranama/data.ts`).
- **Meanings:** the meanings of the thousand names are the ones written for
  that page (`src/sahasranama/meanings.ts`).
- **Translation:** the English of every other verse is a new translation made
  for this film (`src/vishnu/text.ts`).
- **Speakers:** each speaker is named and chanted when the voice changes:
  Vaishampayana, Yudhishthira, Bhishma, Arjuna, Krishna, Vyasa, Parvati,
  Shiva and Brahma.

## Placing the thousand names

- Each name is found inside the shloka that chants it. The code walks the
  shloka's syllables in order and looks for the stem of each name in turn
  (`placeNames`).
- **Sandhi:** sandhi changes the edges of words, so matching uses a skeleton:
  - the case ending and last letter of each name are dropped;
  - voiced and unvoiced stops count as one;
  - the nasals count as one, and so do the sibilants;
  - visarga is ignored.
- **Result:**
  - All 1000 names are placed.
  - Shloka 1 holds names 1–9, and shloka 107 ends on name 1000.
  - Five names whose spelling differs from the text (Divispṛk for the chanted
    divaḥspṛk, for example) are placed next to their neighbours instead.
- The film uses the placement to light each name as it is sung. The name
  itself is written in its cartouche from its own spelling, converted from
  roman to Devanagari (`iastToDev`).

## Pictures

- **The opening:**
  - four niches for Narayana, Nara, Sarasvati and Vyasa;
  - the Lord in white under a full moon, with the clouds of obstacles
    parting;
  - Vishvaksena and his attendants;
  - Vyasa's lineage.
  - Kurukshetra at dusk, where Bhishma lies on his bed of arrows. Yudhishthira
    and his brothers come with Krishna to ask him their questions, and
    Bhishma's words rise as he answers.
- **The meditations:**
  - the pearl throne by the ocean of milk;
  - the cosmic body, with the earth for feet and the sun and moon for eyes;
  - the Lord asleep on Shesha, with Brahma rising on a lotus from his navel;
  - the four-armed form;
  - Krishna under the parijata tree with Rukmini and Satyabhama.
- **The thousand names:**
  - **The form:** the Lord stands at the centre in whatever form the
    shloka's names call up — reclining, as Krishna among the cows,
    Narasimha, Vamana, Varaha, Rama, Garuda's rider, the sun's own form, the
    yogi, the cosmic form. The form is chosen by keywords in the names; when
    the next shloka calls for another, it cross-fades.
  - **The lights:** around him a sunflower spiral of a thousand lights fills
    from the centre outward, one for each name, lit as it is chanted.
  - **The cartouche:** each name appears in a cartouche with its number and an
    emblem chosen from its meaning (sun, moon, fire, ocean, eye, discus, cow,
    feather, serpent, and so on: `src/pichwai/emblems.ts`).
  - **The sky:** over the 108 shlokas the night sky slowly turns to dawn.
- **The closing:**
  - the four kinds of seeker;
  - the devotee at dawn;
  - the sick healed and the bound freed;
  - the worlds held in Vasudeva;
  - one moon reflected in many pots of water;
  - Arjuna asking and Krishna answering;
  - Parvati and Shiva on Kailasa;
  - Brahma before the thousand-formed one;
  - Krishna and Arjuna on the chariot;
  - the ten avatars;
  - everything offered to Narayana.

## The player

The player is shared with the Gita film (`src/pichwai/Film.tsx`):

- **Captions:**
  - every syllable is lit as it is chanted, in Devanagari and roman;
  - the speaker is named;
  - the English of the verse sits beneath;
  - during the stotram, the name being chanted is shown with its number and
    meaning.
- **Controls:**
  - verse by verse with ← → or the buttons;
  - section menu;
  - section scrub bar;
  - repeat a verse (R);
  - captions in Devanagari and roman, Devanagari only, or none (C);
  - English on or off (E);
  - speed from 0.75× to 1.5×;
  - full screen.
- **Your place** is remembered.
- **Reading view:** the reading view sets out every verse in Devanagari, roman
  and English, with all thousand names and their meanings.
- **Timing:**
  - a light syllable takes one mātrā and a heavy one two (0.16 s a mātrā);
  - there is a breath between half-verses and a breath after each verse.
- **The chant score** (`src/pichwai/audio.ts`) is synthesised in the browser:
  - a tanpura drone;
  - a choir that sings each syllable on the formants of its own vowel, with a
    puff of noise for its consonant, along a recitation contour;
  - bells at each verse and the conch on section cards.
- **Voice:** where the device has a Hindi or Sanskrit voice, it can also read
  each line aloud.

## Code

- `src/vishnu/` — the text and placement (`text.ts`), the mandala of names
  (`mandala.ts`), the opening and meditations (`opening.ts`), the phalaśruti
  (`phala.ts`), the component (`VishnuFilm.tsx`).
- `src/pichwai/` — the shared engine:
  - the work and its timeline (`work.ts`, `time.ts`, `stage.ts`);
  - the player (`Film.tsx`) and the chant score (`audio.ts`);
  - the frontal deities (`frontal.ts`), the cast and animals (`cast.ts`);
  - the emblems (`emblems.ts`) and the painted grounds (`paint.ts`).
