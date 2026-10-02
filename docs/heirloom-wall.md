# Heirloom Wall

Twenty-eight ways to display three Nathdwara paintings from an old family
house in a new living room. Each is drawn to scale and written as a brief
you can hand to a carpenter, electrician or artisan.

## The paintings

All three are signed अमृतलाल शर्मा नाथद्वारा and mounted on terracotta
board with a blue inner line. They have raised gold work and glued kundan
stones.

| Slot | Painting | Faces | Hang |
|---|---|---|---|
| `ac` | A Pushtimarg acharya in white, long hair, yellow tilak, green halo, a gaumukhi (rosary bag) with a cow in gold, lotus buds | right | left |
| `sh` | Shrinathji, pichwai style, gold cows in black side borders, peacocks along the top, royal-blue ground | front | centre |
| `kr` | Krishna in profile, offering a pink lotus-bud garland, forest with waterfall and peacock | left | right |

The one rule in every drawing: the two profile figures face inward, toward
Shrinathji.

The acharya is probably Shri Vallabhacharya (Mahaprabhuji). Shri Gusainji
is painted in a similar way, so the family should confirm.

## How it is built

The effect lives in `src/heirloom/`:

- **`ideas.ts`** holds the 28 ideas.
  - Each idea has tags, a cost range in ₹ thousands, a skill level (1–3), a
    duration, and a minimum wall width.
  - Each also has eight points: Layout, Materials & build, Who makes it,
    Fixing, Lighting, Protecting the paintings, Cost & time, and Why.
  - `BASICS` holds eight fundamentals: gaze order, hang height, glazing,
    light, humidity, soot, fixings, and loose stones.
- **`Mock.tsx`** draws the scale SVG elevations.
  - Scale is 1 unit = 0.35 cm. The floor is at y = 740. The visible wall is
    4.2 m × 2.6 m.
  - Each mockup declares its wall colour, furniture, painting positions (via
    `trio()`), its lights, and a `draw` function.
  - Evening mode darkens the room with a mask punched by blurred light
    ellipses, then adds warm screen-blended glows and spot cones.
  - **Dimensions** draws the group width and the centre height.
  - The paintings are stand-ins drawn in SVG. When the user adds photos,
    `<image>` elements (object URLs) replace them. Photos are never uploaded
    or stored.
- **`HeirloomWall.tsx`** is the page. It has:
  - the hero, with three photo slots;
  - the gaze note;
  - filters by tag and starting cost;
  - the idea grid and a detail sheet (arrow keys page through ideas);
  - the fundamentals;
  - a planner that outputs left edge, top edge, two hook positions and hook
    height for each painting, with warnings;
  - a shortlist kept in `localStorage`, which prints one brief per page.

## Facts used, and how sure they are

Craft geography and techniques:
- Molela terracotta (Rajsamand district, near Nathdwara).
- Thikri mirror work (Udaipur, Jaipur).
- Araish lime plaster (Jaipur, Shekhawati).
- Jaipur blue pottery (quartz-based, cobalt and copper oxides).
- Parchin kari in Agra.
- Moradabad brass.
- Pindwara temple carving.
- Bansi Paharpur sandstone, from Bharatpur district and used for the Ayodhya
  Ram Mandir.

These are well established.

Nathdwara practice:
- Pichwai hangings change with festival and season.
- There are eight daily darshans.
- A Hindola swing festival is held in Shravan.

These are standard descriptions of Pushtimarg haveli worship.

Conservation guidance follows common museum practice:
- Centre lines at 145–152 cm.
- Lights aimed about 30° from vertical.
- About 50 lux for light-sensitive works on paper.
- 40–60% RH.
- UV-filtering glazing held off raised surfaces.

Brand names are examples, not endorsements.

Costs are rough 2026 ballparks for an Indian metro and are labelled that way
on the page. Painting sizes are assumed (45 × 65 cm, Shrinathji 50 × 68 cm),
and the planner takes the real ones.
