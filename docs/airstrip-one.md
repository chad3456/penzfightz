# Airstrip One

A game after George Orwell's *Nineteen Eighty-Four*. You play the Party.

It began from the look and the idea of [Don't Look Up](https://www.dontlookup.app/):
- a crowd of little white people seen from above;
- black ink outlines on warm paper;
- instruction cards with chunky buttons;
- you, as the power over them, getting paid for their attention.

It is an original game about Orwell's Oceania. No art, code or text is copied
from that game or from the novel. The narration and all the card text are our
own words. The Party's slogans and the novel's names and coinages are the only
things taken from Orwell: Big Brother, the Two Minutes Hate, Newspeak, Room
101, Victory Gin.

## The look

It started from the reference and then went its own way, towards Party
paperwork seen on a telescreen:
- **Cards are memos.** Every card is a typewritten memo in Special Elite on
  ruled, torn paper. It is headed by a Ministry, carries a red rubber stamp
  that thumps down, and has a paper-clipped "photograph" (the SVG line
  drawing).
- **Panels are consoles.** The HUD and the dock are dark telescreen consoles
  with scanlines and a scrolling news ticker. The quota is a lever in a slot
  with a hatched red danger zone.
- **Propaganda type.** Headings are in condensed Oswald, and the title is a
  red propaganda poster.
- **Citizens.** Party members wear the novel's blue overalls, proles brown
  with caps, and children red. They walk on grey concrete between buildings
  pasted with Big Brother posters.

## How it plays

### The Induction

The tutorial is a real first shift with memos from the office of O'Brien.
The square keeps running, and each step waits until you have done it. An
arrow and a pulsing outline show what to press.
1. Welcome.
2. Drag the quota lever to the red line.
3. A knot of six thinkers appears, ringed in red. Drop the Two Minutes Hate on
   them.
4. Put up a telescreen.
5. A man with a diary: take him with the Thought Police. Watch the bystanders
   freeze.
6. A Brotherhood agent under your telescreen, black with a red head: take him.
7. The rules of the year. Then *Begin 1984*.

You can skip it from the first memo, or from the title screen.

### The year

**The square and the quota.** About 150 citizens walk Victory Square. Past the
quota's red line, doubt builds; below it, doubt fades. A citizen past a
threshold is *thinking*. They turn yellow, stop, look up, say so, stop
working, and set their neighbours thinking. If half the square is thinking
for seven seconds, you have lost them.

**Tools.** Keys 1–9:

| key | tool | cost | what it does |
| --- | --- | --- | --- |
| 1 | Two Minutes Hate | 20 | Party members in range stop thinking and scream for eleven seconds. |
| 2 | Victory Gin | 12 | Works on anyone, briefly; they work worse drunk. |
| 3 | The Lottery | 15 | Strong on proles, weak on the Party. |
| 4 | Hate Week Rally | 45 | A big radius, for sixteen seconds. |
| 5 | Telescreen | 80 | Permanent. Thinking fades under it, and Brotherhood agents show up. |
| 6 | Junior Spies | 60 | Children who chase agents first, then thinkers, and report them: free arrests. |
| 7 | Records Desk | 100 | Arrests of the guilty start no rumours, and history is rewritten free. |
| 8 | Newspeak Dictionary | 120 | Each one slows the spread of thinking everywhere. |
| 9 | Thought Police | 50 | Take someone away. Bystanders freeze and work at half speed. Take an innocent and they talk, and doubt spreads. |

**Combos.** A distraction that turns three or more thinkers at once pays a
bonus: *DOUBLEPLUSGOOD ×n +$*.

**Brotherhood agents.** From March, agents slip into the crowd, at most two at
a time. They look like everyone else, walk a little faster, and whisper ("have
you heard of the Book?"), and anyone they pass starts to doubt. Only a
telescreen, or a child who has picked up the trail, shows them: black overalls
and a red head. Catch one for +$80, which also calms everyone nearby.

**Directives.** Every half-minute or so the Inner Party pins a Directive to
your desk, with a time limit and a reward in cash and a medal:

| Directive | what it asks |
| --- | --- |
| Exceed the Plan | push the Plan up eight points |
| A Quiet Square | keep thinking under 6% for twenty seconds |
| More Eyes | put up two telescreens |
| The Foreign Press | make no arrests for thirty seconds |
| Unity | reach 25 citizens with one distraction |
| Find the Traitor | catch an agent |
| Overtime | hold the quota over the line for fifteen seconds while keeping thinking under 25% |

Fail one and *the Inner Party is displeased*: for a while, the crowd bears
less.

**The calendar.** Each month closes with a *monthly return* (Plan, thinking,
arrests, medals). The events:
- the diary (Winston);
- the chocolate ration ("raised to 20g");
- Julia's note;
- Oceania's change of enemy (rewrite the records or pay for it);
- Hate Week;
- Room 101 ("How many fingers?") and the Chestnut Tree Café.

**The end.**
- **Win:** reach New Year's Eve and you are graded, from *Under Review* to
  *Big Brother's Own*, on:
  - the Plan;
  - medals;
  - agents caught;
  - your best Hate;
  - average thinking;
  - innocents taken.

  Then comes one last question: 2 + 2 = ?
- **Lose:** the square looks up, and the card asks which side you were hoping
  for.

**Balance**, checked with a headless run of the rules:
- Left alone below the red line, the square survives the year, though agents
  push thinking towards 30% by December.
- Left alone on the line, you lose in early summer.
- A simple scripted player who uses the tools wins at a 45–55% quota.

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

Type is self-hosted in `public/fonts-airstrip/`:
- Oswald (headings) and Nunito (speech bubbles), both SIL OFL;
- Special Elite (the typewriter), Apache 2.0;
- Fredoka (SIL OFL), which is no longer used.
