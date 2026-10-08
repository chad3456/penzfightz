# Shrimad Bhagavad Gita, painted

The whole Bhagavad Gita, all 701 verses, chanted in Sanskrit with a new
English translation and painted as a moving pichwai. Open it from
**Effects → श्रीमद्भगवद्गीता**. It runs about two hours and fifteen minutes,
and it remembers where you stopped.

## The text

- **Sanskrit:** the 701-verse text, in which Arjuna's question opens chapter
  13, with each chapter's colophon (ॐ तत्सदिति …).
  - The Devanagari comes from the public-domain `gita/gita` dataset by way of
    the MIT-licensed `hindu-devotional-texts` package (`src/gita/verses.json`).
  - In fifteen long (triṣṭubh) lines the source breaks a word in two across a
    line end, as in kadāci / n nāyaṃ. Those lines were rejoined in the data.
- **Speakers:** the speaker of every verse is carried from the "उवाच" lines.
  - In 1.21 and 1.28 Arjuna begins speaking only in the second half of the
    verse. There his name is chanted where he starts, not before the verse.
- **English:** a new translation of all 701 verses, written for this page
  (`src/gita/en1.ts` … `en6.ts`).
  - It follows the Sanskrit closely and keeps the epithets (Partha, Keshava,
    scorcher of foes).
  - The colophons are translated from each chapter's own title.
- **Chapter cards:** each chapter opens on a card that chants its number —
  अथ प्रथमोऽध्यायः — and shows its name. The first card also chants
  ॐ श्रीपरमात्मने नमः.

## Pictures

Every verse names its painting in `PLAN` (`src/gita/text.ts`). Neighbouring
verses that share a painting form a run, so the picture keeps moving through
them.

- **The story** (`story.ts`):
  - Dhritarashtra in his palace, with Sanjaya's divine sight shown as a
    vision of the field;
  - Duryodhana before Drona, and the heroes on both sides named as they are
    chanted;
  - the conches blown one by one, and the uproar;
  - the chariot driven between the armies, and the faces of Arjuna's kin in
    the enemy ranks;
  - Gandiva slipping from his hand, his sinking down, his tears, and his
    kneeling as a disciple;
  - the archer letting go while the fruit falls into the Lord's hands, for
    karmaṇy evādhikāras te.
  - The cosmic form:
    - forms by hundreds and thousands;
    - the light of a thousand suns;
    - the gods inside his body;
    - the mouths of Time, with the warriors streaming in like rivers into
      the sea;
    - Kāla;
    - Arjuna's hymn;
    - the return to the four-armed form, and then to the human one.
  - The surrender, Arjuna rising with his bow, and "yatra yogeśvaraḥ kṛṣṇaḥ".
- **The teaching** (`vignettes.ts`): while Krishna teaches, the chariot stands
  at the left and a great roundel paints the verse. There are about fifty
  vignettes, each captioned with its key Sanskrit words:
  - the self within the body;
  - childhood, youth and age;
  - worn clothes cast off;
  - weapons, fire, water and wind that cannot touch the self;
  - the tortoise;
  - the staircase down from dwelling on objects to ruin;
  - the boat in the wind;
  - the night of all beings;
  - the ocean the rivers fill without moving it;
  - the two paths to one summit;
  - the hub that stays still while the wheel turns;
  - the fire that burns all action to ash;
  - the sword of knowledge;
  - the city of nine gates;
  - the broken cloud;
  - the casket of the royal secret;
  - the threefold gate of hell;
  - and more.
- **The set pieces** (`tableaux.ts`):
  - the wheel of sacrifice;
  - desire as smoke over fire;
  - the teaching handed down from the sun;
  - the avatars age after age;
  - the lotus leaf;
  - the brahmin, cow, elephant, dog and outcaste with the same light in each;
  - the yogi and the lamp in a windless place;
  - the eight elements;
  - pearls on a thread;
  - the veil of the qualities;
  - the four who worship;
  - the hour of death;
  - the days and nights of Brahma;
  - the bright and dark paths;
  - the wind in space;
  - devotees singing;
  - "I am the rite, the father, the mother, the goal";
  - a leaf, a flower, a fruit and water offered to Shrinathji;
  - a gallery for every verse of the glories in chapter 10;
  - the steps of devotion;
  - the field and its knower;
  - the three qualities and where they lead;
  - the tree with its roots above, and the axe;
  - the divine and the demonic;
  - the three foods, sacrifices, austerities and gifts;
  - ॐ तत् सत्;
  - the Lord turning all beings on a wheel from their hearts.

## The player

- **Player:** the same as the Sahasranama's (`src/pichwai/Film.tsx`), with a
  chapter menu and a chapter scrub bar.
- **Timing:** 0.15 s a mātrā.
- **Score:** a bansuri joins the drone and the choir.
- **Loading:** the Gita loads only when it is opened (a 360 kB chunk with its
  text).

## Code

- `src/gita/text.ts` — chapters, speakers, colophons, cards, the scene plan.
- `src/gita/en1.ts` … `en6.ts` — the translation.
- `src/gita/story.ts`, `vignettes.ts`, `tableaux.ts` — the paintings.
- `src/gita/scenes.ts`, `GitaFilm.tsx` — wiring.
