# Shri Hanuman Chalisa

The whole Hanuman Chalisa of Goswami Tulsidas, animated verse by verse. Open it
from **Effects → श्री हनुमान चालीसा**. It runs about 9½ minutes.

## The text

- All 43 verses: two opening dohas, forty chaupais and the closing doha. The
  reading is that of the common Gita Press edition. Some printings differ in a
  word, for example संकर सुवन / संकर स्वयं, or सब पर राम तपस्वी राजा /
  सब पर राम राय सिरताजा.
- Every word carries a romanisation and a short English gloss. Every verse has
  a meaning in English and in Hindi. The glosses and meanings were written for
  this page (`src/chalisa/text.ts`).
- Tulsidas's text is 16th-century and in the public domain.

## Timing

- Each word lasts as long as its syllables weigh: a light syllable is one
  mātrā and a heavy one is two.
- Words are scaled so that each chaupai foot fills its sixteen mātrās (a
  quarter-second each) and each doha foot its thirteen or eleven (slower and
  freer). See `src/chalisa/time.ts`.
- A chaupai takes three cycles of an eight-beat keherwa: a lead-in, two
  feet, then a tail.

## Pictures

- The look borrows from Nathdwara pichwai hangings and Indian picture books:
  - navy grounds full of swirls, marigold, magenta and vermilion;
  - white curling clouds, lotus ponds and cusped arches;
  - flat gouache colour with ink outlines and a paper grain.
- Every figure is drawn in code from one posable skeleton (`figures.ts`):
  - Hanuman is golden, with a crown, mace and curling tail.
  - Rama is blue, with his bow.
  - The rest of the cast: Sita, Lakshmana, Bharata, Sugriva, Vibhishana,
    Ravana's demons, Shiva and Parvati, Brahma, Narada, Saraswati, the serpent
    Shesha, Yama, Kubera, sages, villagers, children, spirits and Tulsidas.
- Each verse is its own scene (`scenesA/B/C.ts`), staged foot by foot and moved
  between with an arch-shaped wipe. For example:
  - the guru's pollen polishes a clouded mirror until Rama appears in it;
  - a tiny Hanuman drops the ring to Sita, then grows huge over a burning Lanka;
  - the child swallows the sun and the sky goes dark;
  - the leap over the ocean with the ring in his mouth;
  - spirits flee at the name महावीर;
  - beads count to a hundred and the chains fall;
  - Tulsidas on the ghats of Varanasi, the Lord's light settling in his heart.

## Sound

The score is made in the browser and is original (`audio.ts`):

- a tanpura drone;
- dholak and manjira in keherwa under the chaupais, with the dohas left free;
- a bansuri that plays each syllable as a note, to an original tune.

Where the device has a Hindi voice, a **Voice** button can also speak each foot.

## Using it

- **Word by word / Verse only / No text**: what the captions show (W).
- **Meaning EN / हिंदी / off**: the meaning line (M).
- Tap any word for its gloss.
- **Read** opens the whole text laid out word by word, with ▶ to watch any verse.
- Space plays and pauses; ← and → move between verses. Speed can be 0.75×, 1× or
  1.25×, and there is a full-screen button.
