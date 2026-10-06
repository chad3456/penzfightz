# The Outrage Dividend

A long-scroll visual data essay about three economies that grow around public
anger: protest (disruption as leverage), riot (the flashpoint and its second
life online) and grift (outrage and urgency turned into clicks, donations and
fraud). The state's off switch appears as a fourth character. The essay is
focused on India, with its neighbours and the world for comparison.

## Files

| File | What it holds |
|---|---|
| `src/outrage/data.ts` | Every series, the incident ledger, the quotations and the source list |
| `src/outrage/charts.tsx` | Hand-built SVG charts: bars, horizontal bars, timeline, sparklines, tooltip, figure frame with table view |
| `src/outrage/Hero.tsx` | The canvas opening: crowd → phone, driven by scroll |
| `src/outrage/Outrage.tsx` | The essay, the word-price widget and the tracker dashboard |
| `src/styles/global.css` | Styles under the `oe-` prefix |

## Chart rules followed

- **Palette:** four categorical colours, validated for colour-blind separation
  and contrast on `#fcfcfb`:
  - Protest `#2a78d6`
  - Riot `#eb6834`
  - State response `#4a3aa7`
  - Grift `#eda100`

  Grift is under 3:1 contrast, so its marks always carry visible labels.
- **Text:** labels use the ink colours, never the series colour.
- **No dual axes:** riot cases and shutdowns are small multiples, each with
  its own scale.
- **Marks:** thin, with 4px rounded data-ends and selective direct labels.
- **Accessibility:** every chart has a tooltip and a table view, and a legend
  wherever there are two or more types.
- **Layout:** charts measure their own width, so text stays at true size on
  a phone.

## Data and caveats

- **NCRB rioting cases:** 2016–2022. The national total for 2023 was not in
  the sources used.
- **Internet shutdowns:** Access Now counts for India 2016–2025. Worldwide
  counts are only for the years checked against the reports (2022–2025), and
  shutdowns alongside violence for 2019–2022.
- **Rupee conversions:** costs given in dollars are converted at the year's
  average rate and marked ≈.
- **Disputed figures:** where sources disagree, the lower figure is used and
  the range goes in a note. Examples are the Jat agitation's
  ₹20,000–34,000 crore and Manipur's 258 deaths by the government's count
  against 300+ in other counts.
- **Deaths:** a dash means no reliable count, not zero.
- **Word-price widget:** it multiplies the two published average effects
  (×1.67 for each out-group word, ×1.2 for each moral-emotional word). The
  page says it is an illustration, not a forecast.
- **What "grift" covers:** measured fraud and attention spending. The essay
  makes no claim about any particular movement's finances, and says so.

## Quotations

Le Bon, Dostoevsky (in Garnett's translation) and Ambedkar's speech of
25 November 1949 are in the public domain. Hoffer, Nietzsche (Scarpitti's
translation), Dostoevsky (Pevear's translation) and the Supreme Court are
quoted in short extracts. The popular Hoffer line "every great cause begins
as a movement…" is given as a paraphrase. The essay uses his actual wording
from *The Temper of Our Time*.
