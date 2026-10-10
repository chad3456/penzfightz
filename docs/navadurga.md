# नवदुर्गा — Nine Nights of the Goddess

A small gallery for Navaratri. Open it from **Effects → नवदुर्गा · Nine
Nights**. There are three rooms:

- the nine forms of Durga, one for each night;
- six battles from the Devi Mahatmya that you play through;
- a music room for the nine nights.

## The look

The gallery follows hand-drawn pen and ballpoint illustration:

- lines that tremble like a nib;
- shapes filled with hatching, crosshatch, stipple, waves, chevrons, diamonds,
  dotted rules and fish-scale water;
- a sun whose rays each carry a different pattern;
- the ballpoint fan motif;
- crayon scribble on taped paper scraps;
- chalk crescents;
- a tiled roof with its chimney and a lit window.

Everything is drawn in code (`src/navadurga/ink.ts`). Shapes are point lists,
so their outlines can be drawn with a wobbling pen and their fills clipped to
them.

The figures are folk prints (`figures.ts`):

- **The goddess:** frontal, with a tall crown, wide almond eyes and a third
  eye. Her skirt is in hatched bands, and her arms fan out with what each
  hand holds.
- **Weapons:** trident, discus, conch, mace, sword, bow and others are inked
  separately.
- **Mounts and demons:** the lion, tiger, bull and donkey are drawn in profile
  like a frieze, and so are the buffalo, the elephant and the asura warriors.

## The nine forms

Each portrait is painted once into a 1000 × 1250 canvas and kept. A thin live
layer is drawn over some of them: the bell's sound, the egg's glow,
Kalaratri's breath of fire.

| Night | Form | Manner |
| --- | --- | --- |
| 1 | Shailaputri, daughter of the mountain | pen on ochre, a sunrise of patterned rays, the bull Nandi, a quilt of nine moons |
| 2 | Brahmacharini, the ascetic | blue and red ballpoint, rings of fans, the hut |
| 3 | Chandraghanta, the moon-bell | crayon on taped scraps, ten arms, a tiger |
| 4 | Kushmanda, the cosmic egg | gold on night paper |
| 5 | Skandamata, mother of Skanda | teal pen, a lotus pond, the peacock |
| 6 | Katyayani | cream on rust, the hermitage, the buffalo fleeing |
| 7 | Kalaratri, night of time | chalk on indigo, a donkey, lightning |
| 8 | Mahagauri, the white one | grey pencil and gold, the Ganga poured over her |
| 9 | Siddhidatri, giver of perfection | every manner at once |

**Wall labels:** each label gives a short retelling of the story most often
told of the form, what she holds, what she rides, and her mantra
(ॐ देवी … नमः).

**Day colours:** Navaratri's colour for each day differs from year to year
and region to region, so the gallery doesn't assign them.

## Her battles

The six stories follow the Devi Mahatmya (`battles.ts`). Each is a few steps;
each step has its piece of the story and one thing to do.

1. **Madhu and Kaitabha (ch. 1).**
   - Tap Brahma three times to sing to Yoganidra. Lines of his hymn appear:
     त्वं स्वाहा त्वं स्वधा…
   - Drag the sleep up out of Vishnu.
   - Choose the boon Vishnu asks for.
   - Drag the demons onto his thighs, the only dry ground left.
2. **Mahishasura (chs. 2–3).**
   - Tap eight gods to send out their light.
   - Drag eight weapons into her hands.
   - Meet each shape Mahisha takes in turn: noose for the buffalo, sword for
     the lion, arrows for the man, sword for the elephant's trunk, trident
     for the buffalo again.
   - Leap, and strike.
3. **Dhumralochana (ch. 6).** Hold the syllable हुं and let it go; he is
   burnt to ash.
4. **Chanda and Munda (ch. 7).**
   - Drag across her brow until Kali springs out.
   - Tap away Chanda's discs.
   - Take both heads; she is named Chamunda.
5. **Raktabija (ch. 8).**
   - Bring in the seven Mothers.
   - Strike him, and catch every drop of his blood in Chamunda's mouth before
     it lands. Drops that land rise as his doubles.
6. **Shumbha and Nishumbha (chs. 9–10).**
   - Drag the Mothers back into the goddess:
     एकैवाहं जगत्यत्र द्वितीया का ममापरा.
   - Follow Shumbha into the sky and throw him down.

**Testing:** every step was played through by a scripted player
(`video-work/nd/playall.html`).

**Drawing:** figures are painted once per pose into sprites and moved about,
so a frame costs a few milliseconds.

## The music room

**Rhythms:** four rhythms are synthesised as you listen (`music.ts`). Nothing
is sampled.

- **Garba:** 6/8 on the dhol, with claps and manjira, a harmonium drone and a
  shehnai line. It quickens over 48 bars, the way a circle does over a night,
  then starts slow again.
- **Dandiya raas:** sticks clacking in pairs.
- **Dhaak:** the Bengali Pujo drum, with the kansar gong, the conch every
  eight bars, and a flute line.
- **Dhunuchi:** dhaak at dancing speed, with ulu.

**Dancers:** the dancers keep time from the same clock (`dance.ts`).

- A garba circle turns round the garbo, the pierced pot with its lamp, and
  claps on the beat.
- Dandiya pairs strike sticks.
- For the Pujo, two dhakis beat plumed drums before the goddess, and
  dhunuchi dancers swing smoking pots.

**Joining in:** tap the picture to clap, strike or drum along.

**Speed:** a slider sets the speed.

## The listening list

**Shape of the list:** Gujarati garba for every night, Bengali Pujo songs from
Shashthi (night 6) on, the Mahalaya dawn broadcast before the first night,
and two picks for Vijayadashami.

**Links:** each entry links to a YouTube search, and the recordings belong to
their makers. No audio is embedded or copied.

**Checking:** credits were checked against published listings before being
included. Titles that couldn't be confirmed were left out.

- **Mahishasuramardini:**
  - the Mahalaya programme on All India Radio since 1931;
  - recited by Birendra Krishna Bhadra;
  - script by Bani Kumar;
  - music by Pankaj Mullick.
  - Supriti Ghosh's "Bajlo Tomar Alor Benu" and Krishna Dasgupta's "Akhilo
    Bimane Tabo Jayagaane" are from it.
- **Gujarati:**
  - Jai Adhya Shakti and Aarasur Na Ambe Maa (aartis to Ambe Maa);
  - Tara Vina Shyam Mane Ekladu Lage (attributed to Pankaj Bhatt);
  - Chogada Tara (the folk original of the later film song);
  - Kesariyo Rang Tane Lagyo;
  - Lagyo Chundiye Rang;
  - Ramti Aave Maadi;
  - Garbe Ghumjo Raaj;
  - Mor Bani Thanghat Kare (from the 2013 film *Ram-Leela*).
- **Bengali:**
  - Dhaker Taale (Abhijeet Bhattacharya, *Poran Jai Jolia Re*);
  - Dhak Baja Kashor Baja (Shreya Ghoshal);
  - Jaago Uma (Rupankar and Anupam Roy);
  - Dugga Ma (Arijit Singh);
  - Dugga Elo (Monali Thakur);
  - Elo Je Maa (*Bela Sheshe*);
  - the Puja albums of R. D. Burman and Asha Bhosle.

**Sources used for the list:**

- [Mahisasuramardini (radio programme) — Wikipedia](https://en.wikipedia.org/wiki/Mahisasuramardini_(radio_programme))
- [Supriti Ghosh — Wikipedia](https://en.wikipedia.org/wiki/Supriti_Ghosh)
- [Mahishasuramardini playlist — JioSaavn](https://www.jiosaavn.com/featured/mahishasuramardini-/1lsZwfgMVBgwkg5tVhI3fw__)
- [Krishna Dasgupta — Wikipedia](https://en.wikipedia.org/wiki/Krishna_Dasgupta)
- [Tara Vina Shyam Mane — Wordzz](https://wordzz.com/tara-vina-shyam-mane-navratri-garba/)
- [Best garba songs — Saregama](https://www.saregama.com/blog/?p=1726)
- [Garba songs — Vi blog](https://www.myvi.in/blog/best-garba-songs-navratri)
- [Garba songs, dandiya raas — Inditales](https://inditales.com/garba-songs-dandiya-raas-navratri/)
- [Bengali songs for Durga Puja — t2online](https://t2online.in/music/indian/super-hit-bengali-songs-that-are-a-must-listen-on-durga-puja/128633)
- [Durga Puja music albums — Different Truths](https://www.differenttruths.com/durga-puja-music-albums-bengalis-cultural-legacy-worldwide/)

## Code

`src/navadurga/`:

- `ink.ts` — the kit;
- `figures.ts` — the goddess, mounts, demons;
- `portraits.ts` — the nine;
- `battles.ts` — the six battles and their sprites;
- `music.ts` — the synth and the list;
- `dance.ts` — the dancers;
- `Navadurga.tsx` — the rooms.

The gallery loads only when it is opened.
