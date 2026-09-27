# Gita, the reel

Krishna talks Arjuna back onto his feet in eighty seconds: the Bhagavad Gita as
a vertical reel, 1080 × 1920, cut to a 96-bpm beat. `public/gita-reel/` is the
whole thing — `gita.js` draws every frame and makes every sound, `index.html`
plays it — and `scripts/render-gita-reel.mjs` writes it to a video file:

    node scripts/render-gita-reel.mjs gita-reel.mp4 1920 30

## The look

It borrows the visual language of a particular kind of explainer reel:

- **paper**, off-white and flat, with a few fibres in it;
- **stippled ink**: each figure is drawn as a map of how much ink every place
  wants, at quarter size, and each grain is then inked or left against a
  noise threshold, so shading is made of dots; crisp outlines go on top;
- **washes**: loose watercolour blobs in pastel — blue for Krishna, ochre,
  lavender, pink, teal — multiplied over the drawings, not quite in register;
- **type**: a heavy condensed display face with wear on it, a plain grotesque,
  an italic serif with one mustard word to a line, and a small mono for the
  interface; captions arrive a word at a time with the words to come waiting in
  grey;
- **interface jokes**: a group chat, a live feed from the battlefield, two
  posts and a reply, a graph, a meter in the corner — AURA, and DOUBT, which
  empties as the lessons land.

Only system fonts are used (Liberation Sans or Arial, Charter or Georgia,
DejaVu Sans Mono or Menlo, FreeSerif or a system Devanagari face), so nothing is
downloaded.

## The reel

| time | what |
| --- | --- |
| 0–5 | STAND UP, ARJUNA. — Krishna in profile |
| 5–10 | you just dropped your bow, didn't you? |
| 10–15 | the Pandava group chat; three dots in the middle of a war |
| 15–20 | LIVE from Kurukshetra: two armies, one chariot, a smiling charioteer |
| 20–25 | Krishna didn't panic — the aura meter jumps |
| 25–35 | GYAN 01 · the self no weapon cuts and no fire burns (2.23) |
| 35–45 | GYAN 02 · do the work, drop the outcome (2.47), as a graph |
| 45–55 | GYAN 03 · win or lose, same energy (2.48), as a post and a reply |
| 55–63 | GYAN 04 · the mind, friend or enemy (6.5), as a branching tree |
| 63–70 | the universal form: I AM TIME (11.32) |
| 70–75 | he picks up the bow |
| 75–80 | DO YOUR DHARMA — and it loops |

The verses are shown in Sanskrit; the English around them is a paraphrase
written for this, not anyone's translation.

## The sound

All synthesised in the page: a tanpura on D the whole way through; a bansuri
in Yaman (D E F♯ G♯ A B C♯) with a scoop into each note, vibrato and breath; a
lo-fi beat and electric-piano chords (Dmaj7, Bm7, Gmaj7, A); a conch for the
war and for the vision; a choir and bells for the universal form; whooshes and
impacts for the stamps; pops and keystrokes for the chat; a little vinyl
crackle; tape saturation over the lot.
