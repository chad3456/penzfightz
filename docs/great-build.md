# The Great Build

A scrolling visual story about twenty years of infrastructure (2004 to 2024)
in three chapters: container ports, metros and expressways. Each chapter pins
one graphic while its step cards scroll past. The graphic redraws for the
card in the middle of the screen.

## The story

1. **Ports: the box moved east.**
   - A world map of 15 container ports, circle area proportional to
     containers handled.
   - 2004: Hong Kong is the busiest port on Earth (about 22 M TEU).
   - 2024: the circles swell. Shanghai handles 51.5 M, and Ningbo-Zhoushan
     grows from 4 M to 39 M.
   - Six of the ten busiest are in mainland China.
   - A slope chart shows Hong Kong as the one big port that shrank, to
     13.7 M, its lowest since 1996.
   - The five most efficient ports in the World Bank's 2023 Container Port
     Performance Index are mostly not the biggest.
2. **Metros: eighteen new lines in a year.**
   - Lines drawn like metro maps, with a station dot every 50 km.
   - Beijing goes from 114 km to 909 km, now the world's longest.
   - New York adds 5 km and London 3.
   - Delhi, Dubai and Riyadh get whole new systems.
   - A waffle chart, 50 km per square, sets China's 10,946 km of urban rail
     beside India's metros and beside New York and London combined.
3. **Expressways: round the world, four times.**
   - China's expressways (34,300 km in 2004, 190,700 km in 2024) against the
     US Interstate. China passes it in 2011.
   - The 156,400 km China added, wound 3.9 times round the equator.
   - India's expressways: under 200 km in 2004, 7,332 km in 2026.

The page ends with a ledger of every number and its sources.

## How sure are the numbers?

Every figure has a source. Two kinds are shown differently:

- **Checked:** confirmed against the cited source while the page was made.
  - Port TEU: Shanghai, Singapore, Ningbo-Zhoushan, Shenzhen, Qingdao,
    Busan and Hong Kong in 2004; every port's 2024 figure except Los Angeles
    and Hamburg.
  - CPPI 2023 top five.
  - China's 2024 urban rail (10,945.6 km, 54 cities, 748 km and 18 lines
    added in 2024).
  - Beijing 909 km; Delhi 374.5 km; Riyadh 176 km; Dubai 89.6 km.
  - India metro 248 km before 2014, about 1,000 km in 2025.
  - China expressways 2004, 2023 and 2024.
  - US Interstate 2004 (46,572 miles).
  - India expressways 7,332 km (April 2026); national highways 91,287 km →
    146,195 km.
- **Not re-checked** (marked ○): from the same standard series, but not
  re-opened for this page.
  - The other 2004 port figures, and Los Angeles and Hamburg in 2024.
  - Delhi's length at the end of 2004 (about 25 km).
  - New York and London route lengths.
  - China's expressway figures for 2005–2022 (Ministry of Transport yearly
    bulletins), drawn as small dots.
  - The Interstate in 2023 (about 48,800 miles).

## How it is built

- `src/greatbuild/data.ts`: every figure, with a `checked` flag, and the
  sources.
- `src/greatbuild/GreatBuild.tsx`: the page.
  - An `IntersectionObserver` on the step cards picks the active step.
  - The pinned graphics are plain SVG with CSS transitions.
  - Port bubbles move and grow with CSS transforms. Overlapping bubbles are
    pushed apart and joined to their true location by a leader line.
  - Metro segments grow with `scaleX`.
  - The Earth spiral draws itself with a dash offset.
  - The map is `d3-geo` (Equal Earth) over Natural Earth 1:110m shapes. On
    tall, narrow screens it frames Europe to Japan.
- **Colours:** China, the US and India have one colour each, the same in
  every chapter. Everything else is grey. The three colours were checked
  with a colour-vision-deficiency validator against the page, light and
  dark. Every coloured mark also carries a direct label.
- **Fonts:** Oswald, shared with Airstrip One from `public/fonts-airstrip/`.

## Go deeper: the interactive labs (v2)

After each chapter a "Go deeper" lab adds something hands-on, plus four
insight cards with the small print. Each card is tagged **Lesser known**,
**Myth check**, **Read the small print** or **Fragility**, and links to its
sources. The sources go beyond encyclopaedias, to research papers, industry
reports, books and government bulletins.

- **01+ Wider, not longer.** Scrub through the record container ship of
  each era: Emma Mærsk (2006) to MSC Irina (2023, 24,346 TEU).
  - Side view: every record ship is about 400 m long; only the deck stack
    grows.
  - Front view: the beam widens.
  - A grid of 500-TEU squares shows capacity against an average ship today
    (about 5,000 TEU, BIMCO).
  - Cards:
    - why ships stopped at 400 m (Geography of Transport Systems);
    - the Hambantota "debt trap" story checked against Chatham House's 2020
      study;
    - Yangshan Phase IV automation (Xinhua);
    - the Ever Given's $9.6 bn a day (Lloyd's List via Bloomberg).
- **02+ What does a kilometre buy?** Pick a budget ($1–50 bn); each city's
  line shows how many km of metro it buys at that city's cost per km.
  - Data: Transit Costs Project (NYU Marron Institute) figures, plus the
    Grand Paris Express budget. Rows include New York's Second Avenue Subway
    phase 2 (about $2.2 bn/km), Shanghai Line 20, Istanbul, Milan, Stockholm
    and Seoul, against a world weighted average of $252 m/km.
  - Cards:
    - why New York costs about 9× the average;
    - China's falling passenger intensity, 2015→2022 (Urban Rail Transit,
      2025);
    - the 2018 State Council thresholds that halted metros in cities like
      Baotou (Caixin; International Railway Journal);
    - Chinese projects overrunning by 31% on average, like everyone else's
      (Ansar, Flyvbjerg et al., Oxford Review of Economic Policy, 2016).
- **03+ Draw it before you see it.** Draw your guess of China's expressway
  growth from 2004 to 2024 by dragging (touch works too), then reveal the
  Ministry of Transport curve.
  - The reveal shows your average miss, and a crosshair tooltip compares
    your guess with the real figure year by year.
  - Cards:
    - nearly ¥8 trillion of toll-road debt and a ¥600 bn shortfall in 2023
      (Journal of Asian Economics, 2024, from the ministry's toll-road
      bulletins);
    - India's record 37 km a day of national highway in 2020–21;
    - the caveat that about 50,000 km of India's national-highway growth was
      reclassified state roads (Construction World);
    - Flyvbjerg's iron law: 0.5% of 16,000 big projects hit budget,
      schedule and benefits.
- **?? Guess first.** Four slider guesses, locked in and then revealed
  with "you were N× too high or low":
  - the share of projects on budget and on time;
  - New York against the world average cost per km;
  - Suez trade held up per day;
  - the average overrun on Chinese projects.

The main story's India step now notes the reclassification caveat beside
the national-highway figure.

Accuracy notes:
- Cost-per-km rows use different bases (PPP-adjusted Transit Costs Project
  figures vs. an official budget). The page says so and asks readers to
  compare ratios, not decimals.
- Ship beam figures for the three middle ships are marked ○ (not
  re-checked).
- The 2022 passenger-intensity figure is noted as depressed by Covid
  restrictions.
- Code: `src/greatbuild/deep.ts` (data and sources) and
  `src/greatbuild/Labs.tsx` (the labs).
