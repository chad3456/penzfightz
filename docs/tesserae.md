# Tesserae: Ayodhya, laid by hand

A mosaic laid one tessera at a time, entirely in browser code. It uses no
image, video or generative model. It starts with an eye: nine tiles for the
pupil and a ring of gold. 7,446 tiles later there is a city and a
battlefield.

## The picture

The panel is 1000 × 1250 units, drawn as canvas paths in
`src/mosaic/scene.ts`.

- **The eye is the sun.** The Rigveda (1.115.1) calls Surya "the eye of
  Mitra, Varuna and Agni". Ayodhya's kings were the Suryavamsha. The eye is
  cut by hand, in rings:

  | Ring | Tiles |
  |---|---|
  | Pupil | 9 (an octagon and eight wedges: seven black glass, one white marble catchlight) |
  | Gold ring | 13 |
  | Iris, three rings | 19, 25 and 31 (saffron and vermilion) |
  | Gold rim | 37 |

- **Sky:**
  - lapis down to dawn rose, with an aureole and alternating gold and
    vermilion rays;
  - clouds in the Rajput manner;
  - the Pushpaka vimana coming home.
- **Himavat:** two ranges with snow caps.
- **Ayodhya:**
  - houses and palaces with domes, chhatris and saffron flags;
  - three Nagara shikharas;
  - a crenellated wall with bastions and a gate;
  - ghats down to the Sarayu, with boats and the sun's gold reflection.
- **Kurukshetra**, below a gold line:
  - Krishna and Arjuna in a chariot drawn by white horses (Gita 1.14);
  - Hanuman on Arjuna's banner (Gita 1.20, *kapi-dhvaja*);
  - banners, parasols and an elephant with a howdah.
- **The frame:** slate, a terracotta and cream chequer, and gold.

There is one piece of artistic licence. The temple style is centuries later
than any date for the epics, and the page says so.

## How it is cut (`src/mosaic/build.ts`, in a Web Worker)

1. The cartoon is rasterised three times at 0.5 px/unit: colour, a metal
   mask, and a region map.
2. A density map is built from:
   - the region (sky gets big tiles; the chariot gets small ones);
   - blurred edge strength;
   - closeness to the eye;
   - hand-placed detail zones.
3. The eye (134 tiles) is cut as annular sectors, and the frame (830 tiles)
   as three courses of rectangles.
4. The remaining tiles, `7,446 − 134 − 830`, are seeded by importance
   sampling. They then go through 18 rounds of weighted Lloyd relaxation on
   the raster, using `d3-delaunay`'s `find` with a walking hint.
5. Each Voronoi cell is:
   - clipped by a square turned to the local *andamento*;
   - inset for the grout joint;
   - pushed off the eye;
   - roughened.

   The andamento comes from the structure tensor of the cartoon. It blends
   to concentric courses around the sun.
6. Each tile is coloured by averaging five samples and snapping to a
   25-colour palette of stones and smalti. Where a tone falls between two
   palette colours, the nearer two are dithered. Metal comes from the mask
   by majority vote.
7. Tiles are ordered by distance from the eye, plus a little noise. The
   count is checked to be exactly 7,446.

## How it is drawn (`src/mosaic/render.ts`)

- **The bed.** Each tile is a cached `Path2D`. Stone and glass tiles are
  baked into a 2 px/unit bed canvas when they settle. The bed is grey mortar
  with grain and a red-ochre sinopia underdrawing, made from the cartoon's
  edges.
- **Shading.** Each tile gets:
  - a shadow;
  - a gradient from a fixed key light;
  - bevel lines;
  - a glassy highlight on smalti, or a speck on stone.
- **Gold and silver** are redrawn every frame. Each metal tile has a random
  tilt and is shaded with diffuse plus Blinn-Phong specular, against a lamp
  that drifts like a candle or follows the mouse.
- **Close up.** When zoomed in past the bed's resolution, visible tiles are
  drawn as vectors, with screen-wide grain. That layer is cached until the
  view or the tile count changes.
- **The lamp.** A soft-light radial gradient over the whole panel acts as
  the lamp.
- **Laying.** New tiles drop in with a scale-and-fade before they are baked.
  The camera follows the growing front: it starts at the pupil and clamps to
  the panel until the whole mosaic fits beside the story panel.

## Controls

- Pause and play, at 1×, 4× or 16×.
- **Finish** lays every remaining tile at once.
- **Follow** puts the camera back on the work after you pan or zoom.
- Wheel or pinch to zoom, drag to pan, double-click to fit.
- Optional click sounds.
- At 1×, the full lay takes about a minute.

## Honest notes

- India's great ancient wall arts were mural painting (Ajanta) and relief.
  Tessellated mosaic of this kind is mainly a Mediterranean and Byzantine
  technique. This piece borrows that technique for an Indian subject.
- Quotations:
  - Rigveda 1.115.1;
  - Valmiki, Bala Kanda sarga 5 (Ayodhya twelve yojanas long and three
    wide, founded by Manu on the Sarayu);
  - Bhagavad Gita 1.14 and 1.20.

  The Mahabharata retells the Rama story as the Ramopakhyana in the Vana
  Parva. The link between Diwali and Rama's return is described as popular
  tradition.
