# Four Nights and a Morning

Dostoevsky's *White Nights* (1848), told as a painted film you scroll through (effect `fournights`). The book's own words, in passages, sit beside one long, living view of Petersburg along the water, which changes with the story. Every scene is painted by code in the browser. There are no images and no video.

## The text

- **Translation:** Constance Garnett (1918), which is public domain. It is the translation in the epub the user supplied.
- **Passages:** 60, quoted verbatim.
  - `[…]` marks a cut of ours; a plain `. . .` is the book's own.
  - Every chapter is represented: First Night, Second Night, Nastenka's History, Third Night, Fourth Night and Morning.
- **Source files:** the epub itself is not in the repository. The passages live in `src/fournights/story.ts`.

## How to read it

- **Scrolling:** scroll, or use the arrow keys or Space, to move a passage at a time. Each passage holds while you read it, then the scene moves to the next.
- **Read to me:** scrolls by itself, resting on each passage for as long as it takes to read.
- **Chapters:** the chapter menu at the top jumps to any night. The thin bar at the bottom shows how far you are.
- **Sound** is off until you turn it on. It is all synthesised:
  - water at the granite;
  - rain;
  - the bell striking eleven on the third night;
  - a slow piano that turns warmer in the happy hours.
- **Phones:** the passage card moves to the bottom, and the camera turns to keep the people in the narrow frame.

## The scenes

| Chapter | What you see |
|---|---|
| First Night | The starry pale night over the canal. The dreamer in emptied streets. Waggons and barges heaped with furniture leaving for the summer villas. The little pink house being painted yellow. The city gate, then fields, birches and a dacha in the golden evening. Back along the canal at ten: a girl in a yellow hat crying at the railing, the gentleman in evening dress, the knotted stick, arm in arm, “Till to-morrow!”, dawn. |
| Second Night | The seat on the embankment. His confession: the sky darkens and the Goddess of Fancy's golden warp rises from him. His dreams are drawn in light (laurels, a gondola, a knight, Cleopatra's barge, a little house in Kolomna), then the palazzo and its balcony. Dreams fall like yellow leaves into the canal. |
| Nastenka's History | Silhouette cameos in gilt ovals, in the manner of 1840s cut-paper portraits, over a sepia city: the pinned dresses, the wooden house and its lodger, Walter Scott by candlelight, the box at *The Barber of Seville*, the staircase, the bundle, the promise on this seat. Then her letter, written out in her hand as you read, the envelope sealed “Rosina”, and notes rising. |
| Third Night | Rain on the canal. The third white night. A stranger's footsteps. The bell striking eleven, as rings in the air. Alone on the seat in the rain. |
| Fourth Night | At the railing as on the first night. “No, there is no letter.” His confession and hers. Walking like children over the bridge at dawn. The moon and the yellow cloud. The young man who stops and looks, the run to him, the kiss, the two vanishing down her lane. |
| Morning | His room: grimy green walls, the spider's web, rain on the glass, the yellow house opposite. Her last letter in her hand. The house ageing before his eyes, then the sun breaking through. Last, the canal once more: “My God, a whole moment of happiness!” |

## How it is made

- **The panorama** (`world.ts`) is laid out once from a seed. It is about 12,000 units long:
  - countryside;
  - the city gate (columns, a striped sentry box, the barrier pole);
  - streets along the Fontanka;
  - the canal embankment, with a humped bridge over a side canal, Nastenka's lane and the seat.

  The façades are Petersburg stucco colours:
  - styles: plain, pilastered, rusticated and porticoed;
  - pedimented windows and balconies;
  - weathered with a stain pattern.

  A far layer moves at 0.4× for parallax. It holds rooftops, a gilded dome, two needle spires, cupolas and the clock tower.
- **The painter** (`painter.ts`) uses Canvas 2D and draws vectors every frame, so it stays crisp at any zoom:
  - **Sky:** a gradient with the low northern glow of a white night, stars, the moon and drifting clouds tinted for the hour.
  - **Grading:** the city layer is graded by the light of the scene (white night, starry, day, golden, rain, dawn, dream, memory, grey, moonlit).
  - **Lights:** lit windows and lamps are added after the grade, so they stay warm.
  - **Water:** a rippled mirror of everything above the waterline, copied row by row, with lamp light breaking down it in streaks, sky glints, and rain rings.
- **The people** (`figures.ts`) are cut-paper silhouettes on a small posed skeleton:
  - poses: walk, run, stagger, lean on the railing, weep, sit, hold hands, embrace, point at the sky, raise a stick;
  - clothes: frock coats, tails, top hats, a bell skirt and mantle;
  - the only colour is Nastenka's yellow hat, from the book.
- **The story** (`story.ts`) is a list of beats: a passage plus a scene.
  - A scene sets the camera position, zoom and height, the sky, rain, stars, lamps, windows, poplar fluff, the moon, the people (position, pose, facing, drift while you read) and a vision.
  - Scrolling interpolates between neighbouring beats. Each beat holds for the first half of its scroll distance and transitions in the second.
- **Visions** (`visions.ts`):
  - the golden threads, the dreams and the palazzo, drawn in light;
  - the cameos, drawn once into cached canvases;
  - the letters, written with the site's existing pen-and-nib cursive engine (`src/effects/whitenights/hand.ts`) in Nastenka's hand;
  - the room seen through the dreamer's window.

## Testing hooks

`window.__nights = { painter, frameAt, beats, stop(), show(b, t) }`. `show` renders beat `b` at time `t`, which is how the screenshots were made, headless with SwiftShader.

## Limits

- The figures are silhouettes, not detailed portraits: that is the style, and it keeps them readable at every zoom.
- The piano is generative, not a composed score. The “Rosina” notes are a visual motif, not Rossini's melody.
- Frame rate on real phones has not been measured, only headless rendering.
