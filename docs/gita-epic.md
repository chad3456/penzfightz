# Gita, the epic cut

The reel again, rebuilt for a harder brief: real faces, the verses laid over
them in gold, a voice with weight, and music that lifts where the story does.
1080 × 1920, 102.5 seconds, 30 fps. `public/gita-epic/` is the film —
`epic.js` draws every frame on a canvas, `index.html` plays it with the voice
track — and `scripts/render-gita-epic.mjs` writes it to a video file:

    node scripts/render-gita-epic.mjs gita-epic.mp4 [soundtrack.wav] [fps]

Without a soundtrack argument the page's own `audio/voice.mp3` is used. The
published cut was muxed with a mix that also carries a music track the user
supplied (KING OF LYARI); that track is not in this repository and never will
be, so a render from the repository alone has the voices, the ambience and the
effects but no music.

## The faces

Krishna and Arjuna are 3D busts, built in three.js in `public/bust3d/bust.js`
from Lee Perry-Smith's head scan “Infinite” (CC BY 3.0, licence file alongside
it), with its colour, normal and specular maps:

- **skin** is the scan's own colour map, retoned on a canvas: Krishna a deep
  blue that keeps the scan's pores and shading, Arjuna bronze;
- **Krishna** wears a lathe-turned mukut with a lotus plate, pearls, gems and a
  painted peacock feather; a Vaishnava tilak projected onto the brow as a decal;
  earrings; collars, a pearl necklace and the Kaustubha jewel; a vaijayanti
  garland; long hair as tubes and cards;
- **Arjuna** wears a kirita, a collar, armour scales and his own hair;
- **ornaments sit on the skin**: each collar and necklace is found by casting
  rays at the scan and following its surface, not by guessing a radius.

Each shot is a camera, a lens and a lighting setup (key, two rims, fill, under,
ambient, exposure) rendered in headless Chromium to a transparent WebP;
`public/bust3d/shots.json` lists the nine used in the film and

    node scripts/render-busts.mjs

renders them again into `public/gita-epic/img/`.

## The verses

Every lesson arrives as a verse: Devanagari in gold, the English beneath it in
Shri Purohit Swami's 1935 translation (public domain), and a reference, laid
over the face that is speaking in a dark band. Where the voice paraphrases, the
subtitle says what was said and the verse says what is written.

| time | scene | verse |
| --- | --- | --- |
| 0:00 | Kurukshetra: two armies, one field | |
| 0:07 | title | |
| 0:10 | Arjuna drops his bow | 1.30 |
| 0:21 | Krishna turns | 2.3 |
| 0:30 | *uttiṣṭha* — stand up | 2.3 |
| 0:36 | the Self that cannot die | 2.23 |
| 0:44 | the right to the work, not its fruit | 2.47 |
| 0:54 | whenever dharma fades | 4.7–8 |
| 1:00 | SHOW ME WHO YOU ARE — beat cuts | |
| 1:04 | the Vishvarupa: a galaxy, a ring of faces, twenty-four arms, *kālo 'smi*, a thousand suns | 11.12, 11.32 |
| 1:20 | surrender | 18.66 |
| 1:25 | Arjuna rises | 18.73 |
| 1:33 | titles and credits | |

## The voices

Kokoro (Apache-2.0), run locally through kokoro-onnx, with the treatment done
in numpy and librosa — `scripts/gita-epic-voice/`:

    python speak.py          # every line in vo.json to vo/*.wav
    python mix.py [music]    # voice.wav, timeline.json, and mix.wav if given music

A British narrator; Arjuna with a tremor on his first line; Krishna in English
pitched down two semitones with a sub-octave under him, saturated, in a hall;
the Sanskrit doubled, chorused and shadowed an octave down in a long temple
reverb. Under them: a drone, wind, a heartbeat while Arjuna breaks, a shimmer
when Krishna turns, impacts on the title and the drop, a riser into it, a bell
at the end. `timeline.json` tells the film when each line is spoken, for the
subtitles.

## The music

The user's track is used where it lifts the story and nowhere else: its opening
hits under the cold open, silence for Arjuna's collapse and Krishna's first
words, then its build, lined up so that its drop (29.45 s into the track) lands
exactly on the Vishvarupa at 64.2 s, carried to the end and ducked under every
line of voice.

## The look

Navy and gold, after the chrome of trinetra.shivag.fyi: letterspaced Cinzel,
Cormorant Garamond, Tiro Devanagari Sanskrit and Noto Serif Devanagari (all SIL
OFL, in `public/fonts-sacred/`), a chapter counter and a progress line in the
corners, a chapter name running up the side. Cuts are ink-wash wipes; light
comes as rays, embers, bloom and flashes on the beat (89 bpm).
