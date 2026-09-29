# Airstrip One

A game after George Orwell's *Nineteen Eighty-Four*. You play the Party.

It borrows the look and the idea of [Don't Look Up](https://www.dontlookup.app/):
- a crowd of little white people seen from above;
- black ink outlines on warm paper;
- instruction cards with chunky buttons;
- you, as the power over them, getting paid for their attention.

It is an original game about Orwell's Oceania. No art, code or text is copied
from that game or from the novel. The narration and all the card text are our
own words. The Party's slogans and the novel's names and coinages are the only
things taken from Orwell: Big Brother, the Two Minutes Hate, Newspeak, Room
101, Victory Gin.

## How it plays

**The square.** Victory Square is seen from above. About 150 citizens walk to
and fro; proles wear caps. Big Brother looks down from a hoarding at the head
of the square, and his eyes follow your pointer. The four Ministries stand on
the skyline as terraced pencil-hatched pyramids. Everything the citizens earn
flies up to them as little coins.

**The quota.** Drag the slider to set the quota. More quota means more money,
but past the red line (what the crowd will bear) doubt builds. Below the line
it slowly fades.

**Thinking.** A citizen whose doubt passes a threshold is *thinking*. They:
- turn yellow;
- stop, look up and say so ("wait, what?", "2 + 2 = 4?", "was it always?");
- stop working;
- set their neighbours thinking.

Every citizen has their own susceptibility. When the quota is over the line,
people also start thinking at random, which makes little knots rather than a
wave. If half the square is thinking for seven seconds, you have lost them.

**The tools.** Press 1–9 or click the dock.

| key | tool | cost | what it does |
| --- | --- | --- | --- |
| 1 | Two Minutes Hate | 20 | Goldstein on a screen. Party members within range stop thinking and scream for eleven seconds. |
| 2 | Victory Gin | 12 | Works on anyone, briefly, and they work badly while drunk. |
| 3 | The Lottery | 15 | Strong on proles, weak on the Party. |
| 4 | Hate Week Rally | 45 | Banners and drums over a big radius, for sixteen seconds. |
| 5 | Telescreen | 80 | Permanent. Thinking slows and fades within its ring. Winston is immune. |
| 6 | Junior Spies | 60 | Two children in red neckerchiefs who follow the nearest thinker and report them: a free arrest. |
| 7 | Records Desk | 100 | The Ministry of Truth. Arrests start no rumours, and history can be rewritten for free. |
| 8 | Newspeak Dictionary | 120 | Each one makes thinking spread more slowly, everywhere. |
| 9 | Thought Police | 50 | Click a citizen and a black van takes them away. Bystanders are afraid: they stop thinking, but they work at half speed. Without a Records Desk, the square hears rumours. |

**The year.** The year lasts four minutes, and the calendar brings events:

| month | event | what it does |
| --- | --- | --- |
| February | A man has bought a diary | Winston, who thinks all the time, spreads it fast and ignores distractions. |
| April | The chocolate ration | Announce the cut (everyone doubts), or announce it has been "raised to 20g". The lie helps, but the records must then be fixed. |
| May | A note: I love you | Julia. While the two are together, thinking spreads twice as fast. |
| July | Oceania is at war with Eastasia | Rewrite the records ($60, or free with a Records Desk), or everyone who remembers starts to wonder. |
| September | Hate Week | Distractions cost half, and the crowd bears more. |
| December | Room 101 | O'Brien holds up four fingers and you answer for Winston. Then comes the Chestnut Tree Café. |

**Winning.** Reach New Year's Eve and you get your stats: the Plan, unpersons,
telescreens. Then one last question: 2 + 2 = ?

**Losing.** You lose if the square looks up. The card asks which side you were
hoping for.

**Balance.** A simple scripted player wins at a 45–50% quota (80–97% of the
Plan) and loses at 55% or more. Left alone, a quota on the red line loses in
summer.

## How it is made

`src/airstrip/`:

| file | what it is |
| --- | --- |
| `sim.ts` | the rules: citizens, doubt, contagion, tolerance, tools, events, winning and losing; pure TypeScript, runs headless |
| `scene.ts` | three.js |
| `art.tsx` | SVG line illustrations for every card, and the nine tool icons |
| `Airstrip.tsx` | the React shell: title, the five instruction cards, the HUD, the dock, speech bubbles, event cards, Room 101 and the ending; plus a small WebAudio set (telescreen whistle, crowd roar, van, coins) |

`scene.ts` draws:
- the citizens as instanced toon capsules and heads with inverted-hull ink
  outlines and soft blob shadows;
- a pencil-hatching shader for buildings and Ministries;
- canvas-drawn Big Brother and Goldstein;
- vans, distraction boards and rings, and coins.

Type is Fredoka and Nunito (SIL OFL), self-hosted in `public/fonts-airstrip/`.
