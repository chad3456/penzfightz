# Guitar Atlas

An illustrated, interactive atlas of where the world's guitars are made.

## What is on it

- **Factories.** 31 places that build guitars, from single factories to whole
  guitar towns. Each is a guitar pick:
  - Pick area is proportional to the number of guitars a year the place has
    reported in public.
  - Colour and a letter give what the place is best known for: **E**lectric,
    steel-string **A**coustic, or **C**lassical.
  - A place without a published figure is drawn as a small hollow pick. Its
    size says nothing about how much it makes.
- **Exports.** Circles sized by 2023 exports of HS 920290. That is the UN
  trade code for guitars and other plucked string instruments; electric
  guitars have their own code and are not included. The five largest
  exporters are shaded. Mexico is shown hollow, from the wider HS 9202
  heading.
- **Tonewood.** Where eleven guitar woods grow, and routes to the factories
  each is best known in:
  - Sitka, Adirondack and European spruce;
  - Honduran and African mahogany;
  - ebony;
  - Indian and Brazilian rosewood;
  - maple, alder and koa.
- **History.** Five eras of "the factory moves":
  - America and Germany;
  - Japan in the 1970s;
  - Korea and Mexico;
  - China and Indonesia;
  - today's Chinese "guitar counties".
- **Brand finder.** Fourteen brands, line by line. For example, Fender
  American is made in Corona, Player in Ensenada, and Squier in China and
  Indonesia. One button fits the map to a brand's places.
- **Two charts.** Exports by country, and published output by place. The
  Zheng'an bar also marks the lower 2026 figure.
- **A table view** of every place.

Every figure links to its source in the list at the foot of the page.

## Figures, and how far to trust them

- **Unit figures** are what companies or local governments have said in
  public. They are not audited production statistics.
  - Zheng'an's six million a year and its "one in seven worldwide" claim come
    from Chinese state media (2021). A 2026 report gives 2.4 million or more,
    and the chart shows both.
  - Where only a daily rate is known (Taylor: about 550 a day in Tecate and
    700 across both plants; Fender Ensenada: about 600 a day in 1995), the
    yearly figure assumes 250 working days and is marked ≈.
- **Export values** are UN Comtrade figures for HS 920290 for 2023, as
  reported by TrendEconomy: world $831M; China $321M; USA $164M; Indonesia
  $64M; Netherlands $61M; Germany $60M. Much of the Dutch figure is likely
  brands' European distribution rather than manufacturing.
- **Factory locations** come from the makers' own sites and well-documented
  company histories.

## How it is built

- `d3-geo`: Natural Earth projection and path generation.
- `topojson-client`, `world-atlas`: country shapes at 1:50m. They are served
  as a separate asset and fetched when the page opens.
- `d3-zoom`:
  - Drag to pan. Ctrl/⌘ + scroll, pinch, or the buttons to zoom.
  - One finger scrolls the page, so the map never traps you on a phone.
  - Clicking a place flies to it and opens its card beside it.
- **The look.** A paper-cut map:
  - a drop-shadowed land layer;
  - stippled land;
  - a wave-hatched sea;
  - a compass rose;
  - an illustrated guitar whose strings twang on hover.
- **Labels** are placed greedily (right, left, above, below) and dropped
  rather than overlapped.
- **Marks** scale with the map's width, so China stays visible under its
  picks on a phone.
- **Colours.** The three guitar-type colours were checked with a
  colour-vision-deficiency validator against the page's paper, in light and
  dark. Each also carries a letter, so colour is never the only cue.
- **Dark mode** has its own steps, not an automatic inversion.

## Files

- `src/guitaratlas/data.ts`: places, exports, woods, brands, eras and
  sources.
- `src/guitaratlas/GuitarAtlas.tsx`: the page, map, charts and brand finder.
- `public/fonts-guitar/`: Fraunces and IBM Plex Mono, both under the SIL Open
  Font License.
