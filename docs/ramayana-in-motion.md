# Ramayana, in motion

The Ramayana in under two minutes, as an anime short.

`public/ramayana-anime/index.html` and `public/ramayana-anime/rama.js`. Plain
JavaScript: no libraries, no build step, no image or audio files. It opens from
a bare `file://` as well as from the shelf; `scripts/render-ramayana-anime.mjs`
writes it to a video.

## The cut

| time | shot |
| --- | --- |
| 0:00 | A clay lamp is lit in the dark. *Long ago, in Ayodhya…* |
| 0:06 | Ayodhya at sunrise over the Sarayu; the title. |
| 0:15 | The hall at Mithila, the bow of Shiva on its dais, Rama walking in. |
| 0:20 | Rama's eyes, very close, the bow's gold across them. |
| 0:23 | He lifts it; it bends; it breaks — an impact frame, two halves flying. |
| 0:29 | Sita and the garland. |
| 0:33 | Three figures on a ridge at dusk, walking into fourteen years. |
| 0:41 | A golden deer in a moonlit forest. It is a trap. |
| 0:46 | Ravana's flying palace in a storm, Sita on its deck. |
| 0:51 | Jatayu dives; the clash; the fall. |
| 0:55 | An anklet, falling slowly: the trail she left. |
| 0:58 | Hanuman on the cliff. |
| 1:01 | The leap across the sea. |
| 1:07 | Lanka burning, roof by roof, behind a burning tail. |
| 1:14 | The bridge of floating stones, each carved with राम. |
| 1:21 | Ravana's eyes. |
| 1:24 | Ten heads, twenty arms. |
| 1:28 | One arrow, gathering light. |
| 1:31 | Release — and white. |
| 1:33 | Petals falling from a quiet sky. |
| 1:37 | Ayodhya at night on the new moon, every lamp lit in a wave outward from the palace, the Pushpaka coming home. |
| 1:48 | The title again, and a lamp. |

## How it is made

**The look.** What makes a still read as anime rather than as a vector
illustration is mostly light. The skies are multi-stop gradients with a sun that
blooms and long soft wedges of light out of it. The clouds are sprites painted
once: a body shaded dark away from the light, lit tops towards it, and a hard
rim where the light grazes the edge. Everything is finished with a bloom pass —
the frame shrunk to a thumbnail and laid back over itself enlarged with
`screen`, which lets only the light through — then a vignette and grain.

**Figures as cels.** A person is a skeleton of capsules in units of their own
height, posed by joint angles: walking, lifting, drawing a bow, crouching,
flying. Each is drawn twice into a scratch canvas in flat colour — once in the
rim colour, once in the dark shifted away from the light — so what shows of the
first pass is a crisp rim on exactly the side the light is on. Ravana, Jatayu,
the deer and the flying palace are drawn the same way.

**The anime grammar.** Radial focus lines redrawn a dozen times a second like a
hand-drawn cel; parallel speed streaks; impact frames that invert and bleed the
picture of colour with black shards across it; screen shake that decays; extreme
close-ups of eyes with a reflection of the scene in the iris.

**The score is original and synthesised in the same file.** Sa is D. A tanpura
under nearly all of it, with a buzz that swells just after each pluck; a bansuri
with breath in the tone and glides between notes for the tunes — the main theme
leans on the sharp fourth, the way Yaman does, and the forest theme borrows
Bhairavi's flat second. Strings and a formant choir for the big moments, a
plucked santoor for Sita and the homecoming, dhol and taiko for the fights, and
the effects anime can't do without: risers, whooshes, impacts, the glint.

## What only showed up on screen

- **The crowns read as cat's ears.** A mukut drawn as a tall spike with two side
  points is, in silhouette, a pair of ears. It is one tall rounded cone now.
- **The scarves read as sticks.** Long and thin, blown straight back, they looked
  like something being carried. They are broader and shorter, and they ripple.
- **The clouds had boxed-off bottoms.** A rectangle under the puffs gave every
  cloud a flat base with a rim of light along it. The base is an ellipse now.
- **The title sat on the palace spire.** It moved up into the sky.
- **Lanka's fire was a white blob.** Sixty overlapping additive glows sum to
  white and hide the city they are meant to be burning. The glows are smaller and
  fainter, and the roofs show through.
- **Ravana's crowns were cropped** by the letterbox, and Hanuman flew upright
  like someone jumping. He flies flat out now, fist forward, mace trailing.
