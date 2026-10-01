# GLASS HOUSES

**A game about the distance between who we say we are and what we do.**

> "People who live in glass houses shouldn't throw stones."

Status: design plan, v0.1. Nothing is built yet. This document covers the
whole thing:
- the research it stands on, and which findings to avoid;
- the core loop and every card family;
- scoring formulas;
- the physical edition (components and table layout);
- the online edition (screens, data model and privacy design);
- ethics, playtesting, balancing and a build roadmap.

---

## 0. The pitch in one paragraph

Each player lives in a glass house: a little card-stock house with six clear
panes. You win by getting rich (**Fortune**) and being admired (**Face**). But
the game also keeps a third, hidden ledger of what you actually did when you
thought it didn't matter (**Truth**). Every round you:
- make public promises;
- make private choices (privately rolled dice, coins under cups, sealed
  envelopes);
- judge other players by throwing stones.

At the end comes the **Mirror**. Every player's Face is laid against their
Truth. Where the gap is too wide, panes crack and the house can shatter. The
game never proves that one person cheated. It shows each player, privately,
their own gap, and shows the table, as a group, how far its words and deeds
drifted apart. People laugh, argue and recognise themselves, and that is the
point.

---

## 1. Design principles (non-negotiable)

1. **Expose patterns, never individuals, unless they choose it.** The robust
   way to measure dishonesty is statistical: everyone rolls a die in secret,
   and the table's reported rolls are compared with what fair dice produce.
   You can see that the table lied. You can never prove who did. This is
   exactly the method of the best honesty research (Fischbacher &
   Föllmi-Heusi 2013), and it keeps the game kind.
2. **Private mirror, public aggregate.**
   - Your personal Say/Do gap is shown to you alone.
   - The table sees only group numbers, plus anything a player volunteers.
   - Online, nothing is attached to a real identity.
3. **Everyone is in on it.** Players know the game measures hypocrisy. They
   just can't watch every mechanism at once, and that is enough. The
   research shows people behave self-servingly even when they know they are
   in a study (Batson's participants knew the coin flip was the point).
4. **Real findings only.** Every mechanic is built on a published paradigm,
   and every reveal card cites it. Findings that failed to replicate, or were
   retracted, are left out (see §2.3).
5. **Nothing real is at stake.** No real money, no recordings, no
   screenshots of individual results, no use for hiring, dating or
   grading. This is written into the rules and the terms (§9).
6. **It must be fun first.** Bluffing, negotiation, push-your-luck and
   betrayal are the engine. The moral lesson is a side effect of good play,
   not a lecture.

---

## 2. The research it stands on

### 2.1 Core findings used as mechanics

| Finding | Classic study | What the game does with it |
|---|---|---|
| **Moral hypocrisy:** people want to *appear* fair more than *be* fair | Batson et al. 1997; Batson et al. 1999 (JPSP 77). Participants given a coin to fairly assign a good task to themselves or another person flipped it, and still gave themselves the good task about 85–90% of the time | **The Coin of Fate** card family (§4.3). |
| **Lying in disguise:** people lie, but partially, to keep a self-image of honesty | Fischbacher & Föllmi-Heusi 2013 (JEEA), the die-under-the-cup paradigm; Abeler, Nosenzo & Raymond 2019 (Econometrica) meta-analysis of 90 studies; Gerlach, Teodorescu & Hertwig 2019 (Psych. Bulletin) meta-analysis | **The Cup** card family; the table **Honesty Index**. |
| **Justified ethicality:** seeing a desired number makes lying feel fine | Shalvi, Dana, Handgraaf & De Dreu 2011 (OBHDP): rolling several times and reporting "the first" one inflates reports | A "roll again for fun" option on Cup cards. |
| **Moral wiggle room:** people avoid finding out the consequences so they can act selfishly | Dana, Weber & Kuang 2007 (Economic Theory) | **The Blindfold** card family: "Peek or don't peek". |
| **Judging others harder than ourselves** | Valdesolo & DeSteno 2007 (Psych. Science): the same unfair act was judged less fair when someone else did it | **Stones**: you set the punishment for an anonymous act; later the identical act comes round to you. |
| **Holier than thou:** we overestimate our own goodness and predict others well | Epley & Dunning 2000 (JPSP 79) | **The Creed** and the **Prophecy** sheet: predict your own behaviour and the table's; scored against reality. |
| **Hypocrites are hated more than plain liars:** condemning a thing signals you don't do it | Jordan, Sommers, Bloom & Rand 2017 (Psych. Science) | **Face** rewards public condemnation, but the Mirror punishes condemning what you then did (§6). |
| **Dictator, Ultimatum, Trust** | Engel 2011 meta-analysis (dictators give about 28% on average); Güth et al. 1982; Berg, Dickhaut & McCabe 1995 | The **Purse** card family. |
| **Public goods, free-riding and altruistic punishment** | Fehr & Gächter 2000/2002 | **The Commons** (§4.7), a table-wide pot. |
| **Bystander effect:** help is diffused in groups (weaker in clear, dangerous emergencies) | Darley & Latané 1968; Fischer et al. 2011 meta-analysis | **The Alarm** card family. |
| **Moral licensing:** a good deed buys permission for a bad one (real but small; publication bias inflates it) | Monin & Miller 2001; Blanken, van de Ven & Zeelenberg 2015 meta-analysis; Kuper & Bott 2019 bias-corrected | **Halo tokens**: doing good gives a token that can excuse a later act. Tracked, with a note that the effect is small in the literature. |
| **Framing changes moral choices** | Tversky & Kahneman 1981 (the "Asian disease" problem) | **Twin cards**: the same dilemma appears twice in different frames, rounds apart. Inconsistency is logged. |
| **Identifiable victim effect** | Small, Loewenstein & Slovic 2007 | **The Appeal** family: one named person vs. "1,000 people". |
| **Sacrificial dilemmas and utilitarian vs. deontological judgement** | Greene et al. 2001; Kahane et al. 2018, Oxford Utilitarianism Scale; Awad et al. 2018, Moral Machine (open data) | **The Lever** family (trolley variants). Used to show inconsistency, not right answers. |
| **Moral foundations:** care, fairness, loyalty, authority, purity, liberty | Graham, Haidt et al. 2011 (MFQ); Clifford et al. 2015, Moral Foundations Vignettes | The **Creed** questionnaire, and the end-of-game profile wheel. |
| **Moral disengagement:** euphemism, diffusion and blaming the victim | Bandura 1996/1999 | **Excuse cards**: players may play an excuse when caught. The Mirror counts which mechanisms each player leaned on. |
| **Asking sensitive questions honestly** | Warner 1965, randomized response technique | **The Confessional**: true/false confessions with a built-in noise coin, so the table learns the rate and nobody learns the person. |
| **Ethics professors behave no better** | Schwitzgebel & Rust 2014 | Flavour text on the box. Knowledge of morality isn't morality. |

### 2.2 Open questionnaires usable as content (check each licence before any commercial release)

- **MFQ-30 / MFQ-2** (moralfoundations.org): free for research and
  non-commercial use. Ask the authors before selling it.
- **Moral Foundations Vignettes** (Clifford et al. 2015): published openly
  with the paper.
- **Oxford Utilitarianism Scale** (Kahane et al. 2018): published in the
  paper.
- **IPIP items**, including IPIP-HEXACO Honesty-Humility analogues: public
  domain. This is the safest choice for a commercial edition.
- **Marlowe-Crowne Social Desirability Scale** (1960): items published,
  widely reused. A short-form version can detect "fake good" answers in
  the Creed.
- **Moral Machine** scenario structure and dataset (Awad et al. 2018): open
  data. The scenarios are re-drawn in our own words.
- **Avoid:** the Defining Issues Test (copyrighted), and the full HEXACO-PI-R
  in a commercial product (non-commercial licence only).

All card text is written in our own words, citing the paradigm. Published
items are paraphrased; they are never pasted wholesale into a commercial
product without permission.

### 2.3 Findings deliberately left out

- **"Sign at the top" honesty pledge** (Shu et al. 2012): retracted in 2021
  over fabricated data.
- **Matrix-task cheating studies** (Mazar, Amir & Ariely 2008): mixed
  replications. Not used as a "fact" on any card.
- **Ego depletion, i.e. tired people cheat more**: failed large
  multi-lab replication (Hagger et al. 2016).
- **Stanford Prison Experiment**: demand characteristics and staging. Not
  cited as evidence.
- **Milgram**: real, but the game never simulates commanding harm to
  another player.

A card in the box, "**What we don't know**", lists these. Telling players
about the replication crisis is itself a lesson in honesty.

---

## 3. Overview

- **Players:** 4–8 at the table; 3–12 online. There is also a solo mode
  against bots, using real anonymised human distributions once data exists.
- **Age:** 16+.
- **Length:** 60–90 minutes (standard game, 6 rounds); 25-minute "Quick
  Glass" (3 rounds).
- **Roles:** everyone plays for themselves. An optional **Host** (a player
  who also plays, or the app) reads cards and runs the Mirror.
- **What you're trying to do:** finish with the most points.

  **Points = Fortune + Face − Shatter penalty**

---

## 4. Components and card families

### 4.1 Physical components

| Qty | Component | Notes |
|---|---|---|
| 8 | **Glass houses** | Card-stock house fronts with 6 clear acetate panes in a slotted frame. Crack overlays are transparent stickers that clip over a pane. |
| 8 | **Privacy cups** | Opaque cups with a peep slot at the base. Hold the die or coin under the cup and look through the slot. |
| 8 | **Dice** | Standard d6, one per player. |
| 8 | **Coins of Fate** | Two-sided brass tokens: sun / moon. |
| 120 | **Fortune chips** | Values 1, 5 and 10. |
| 60 | **Face tokens** | Laurel tokens. Public, kept in front of you. |
| 1 | **Truth ledger pad** | A secret sheet per player per game. Online, the app keeps it. |
| 40 | **Stones** | Smooth glass pebbles. |
| 24 | **Halo tokens** | Moral licensing. |
| 1 | **Commons urn** | Opaque box with a slot. Contributions go in face down. |
| 1 | **Confessional pouch + Noise coin** | For randomized-response rounds. |
| 160 | **Dilemma cards** | 10 families, §4.2. |
| 24 | **Excuse cards** | Bandura's mechanisms, §4.5. |
| 8 | **Creed sheets + envelopes** | Filled in before play and sealed. |
| 8 | **Prophecy sheets** | Predictions about the table. |
| 1 | **Mirror board** | Fold-out reveal board with the Honesty Index dial, the die-distribution chart and the hypocrisy meter. |
| 1 | **Sand timer** | 60 s. |
| 1 | **"What we know / what we don't" booklet** | 24 pages of citations and replication notes. |

### 4.2 The ten dilemma families (16 cards each)

Every card has:
- a **public face**: what everyone hears;
- a **private choice**: what only you decide;
- a **Truth code** for the ledger;
- a **source line** citing the paradigm.

| # | Family | Mechanism | Example card (our wording) |
|---|---|---|---|
| 1 | **The Cup** | Roll your die under your cup; report the number; take that many Fortune. Nobody checks. | *"Tax Return. Roll under the cup. Report your income: you are paid what you report."* |
| 2 | **Coin of Fate** | Assign a good or bad outcome between you and your left neighbour. You *may* flip your coin to decide fairly. You announce "I flipped" or "I chose", and the result. | *"Two jobs: the beach survey (+6) or the sewer audit (−2). Who gets which? The coin is there if you want fairness."* |
| 3 | **The Purse** | Dictator, Ultimatum and Trust games with a real partner. Amounts are passed in closed fists. | *"Inheritance. You received 10. Your sibling gets whatever you hand them. They will never know the total."* |
| 4 | **The Blindfold** | A payoff choice where the effect on another player is hidden under a flap. You may peek first. | *"Choose A (+5 to you) or B (+4). The effect on Player X is under the flap. Peek?"* |
| 5 | **Stones** | An anonymous act by "someone, somewhere" is read out. Each player secretly sets its punishment from 0 to 5 Stones. Three rounds later, a *Mirror Stone* card puts the same temptation to whoever punished hardest. | *"A shopkeeper gave someone too much change. They kept it. Punishment?"* |
| 6 | **The Alarm** | An emergency: one player can spend Fortune to help, but only one person needs to. Everyone chooses secretly and at once; anyone who chose to help pays. | *"The neighbour's flat is flooding. It costs 3 to help. Anyone?"* |
| 7 | **The Lever** | Trolley-style dilemmas with a twin card in a different frame. Public vote, then a private "what would you really do" card. | *"Pull the lever: one dies, five live. … Later: push the stranger off the bridge."* |
| 8 | **The Appeal** | Charity: give to one named, photographed person, or to "1,200 people"; the same cost buys more for the many. | *"Mira, 7, needs surgery: 4 Fortune. Or vaccines for 1,200 children: 4 Fortune."* |
| 9 | **The Confessional** | Randomized response. Flip the Noise coin in secret. On sun, answer the question truthfully. On moon, just say "yes". | *"Have you ever pretended not to see a message so you didn't have to reply?"* |
| 10 | **The Spotlight** | A public pledge. Stand up and promise; take Face. Each pledge links to a later private card that tests it. | *"Pledge: 'I would never take credit for someone else's work.' +2 Face."* |

### 4.3 Example: the Coin of Fate, end to end

1. **Read aloud:** "Two jobs, beach (+6) or sewer (−2). Assign one to yourself
   and one to the player on your left. A coin is here if you want to be fair."
2. **The choice.** Under your cup you either flip the coin or don't. Sun means
   you take the beach job.
3. **The announcement.** You say "I flipped" or "I chose", and who gets which
   job.
4. **Truth ledger:**
   - You record whether you really flipped, and what came up.
   - Online, the coin is a real random flip shown only to you, so the app
     knows the truth.
   - On the table there is no way to check. The ledger is honour-based and
     the Mirror uses only the statistics: among people who said "I flipped",
     how many won the beach job? Fair coins give about 50%. Batson's
     participants: about 90%.
5. **Face.** "I flipped" earns +1 Face; choosing for yourself and admitting it
   earns 0.

### 4.4 Example: the Cup

- Each player rolls under their own cup and reports a number.
- The Host tallies the reported numbers on the Mirror board as a running
  histogram.
- After 6 rounds × 6 players there are 36 reports. A fair-die histogram is
  printed behind it in grey.
- The **Honesty Index** is a single dial: 100 = consistent with fair dice,
  0 = everyone always reports 6.
  - Computed as the table's mean reported roll relative to 3.5.
  - Online, also a χ² goodness-of-fit, shown as a cartoon thermometer.
- **Online variant:** the app knows the real roll, because it rolls the die.
  That allows a *private* individual gap. Publicly, only the aggregate is
  shown. Players are told this at sign-up.

### 4.5 Excuse cards (moral disengagement)

When a Stone or a Mirror Stone lands on you, you may play one Excuse card to
halve the penalty. There are 24 cards, 3 of each of Bandura's eight
mechanisms:
- **Moral justification:** "It was for a good cause."
- **Euphemistic labelling:** "It's not stealing, it's reallocating."
- **Advantageous comparison:** "Others do far worse."
- **Displacement of responsibility:** "I was told to."
- **Diffusion of responsibility:** "Everyone did it."
- **Distortion of consequences:** "No one was really hurt."
- **Dehumanisation:** "They're not like us." This one costs Face to play,
  and its card explains why.
- **Attribution of blame:** "They had it coming."

At the Mirror, each player sees which excuses they reached for. Their
"favourite" mechanism is printed on their result card.

### 4.6 The Creed and the Prophecy (before round 1)

- **Creed** (sealed in an envelope), 12 items:
  - 6 MFQ-style "how relevant is…" items, paraphrased;
  - 6 behavioural predictions, e.g. "If I can lie for 6 Fortune and no one
    can ever know, I will…  ☐ always tell the truth  ☐ shade it  ☐ take the
    6".
- **Prophecy:** predict the table.
  - "What % of the table will flip honestly?"
  - "How much will the average dictator give?"
- These feed the "Holier than thou" reveal (Epley & Dunning): people predict
  others accurately and themselves optimistically.

### 4.7 The Commons (runs through the whole game)

- Each round, every player secretly puts 0–3 Fortune into the urn.
- At round end, the urn is doubled and split evenly. That is a public goods
  game.
- From round 3, players may spend 1 Fortune to fine a suspected free-rider
  3, but only on a *public* accusation. This is altruistic punishment (Fehr
  & Gächter).
- The urn is opened publicly each round: only the total is counted, never
  who put in what.
- **The Commons graph** (contributions per round) is part of the Mirror. It
  almost always decays over time, and players can watch it happen.

---

## 5. A round, step by step (standard game: 6 rounds of about 12 minutes)

| Step | Time | What happens |
|---|---|---|
| 1. Pledge | 1 min | Spotlight card. One volunteer makes the pledge for +2 Face. Others may "second" it for +1 Face. |
| 2. Temptation A | 2 min | A Cup or Coin card, everyone at once under the cups. |
| 3. Deal | 2 min | A Purse card in pairs, passed clockwise so everyone gets a different partner each round. |
| 4. Stones | 2 min | An anonymous act is read out. Secret punishment votes are set with Stones in closed fists, all revealed at once. Each player's punishment is noted against the card. |
| 5. Temptation B | 2 min | Blindfold, Alarm, Appeal or Lever, rotating by round. |
| 6. Commons | 1 min | Contributions go into the urn; it is opened and paid out; any accusations are made. |
| 7. Crack check | 1 min | Any Mirror Stone due this round is drawn (§6.2). |
| 8. Bookkeeping | 1 min | Everyone updates their Truth ledger behind a screen; online, the app does it. |

The Confessional is played at rounds 2 and 5, and the Twin Lever cards at
rounds 1 and 4.

---

## 6. Scoring, in exact numbers

### 6.1 The three ledgers

- **Fortune (F):** chips. Public, countable.
- **Face (A, for "appearance"):** laurels. Public. Earned by:
  - pledging (+2);
  - seconding a pledge (+1);
  - announcing "I flipped" (+1);
  - generous visible acts (+1 each);
  - receiving thanks: once per round, a player may give another player
    1 Face from the bank.
- **Truth (T):** hidden. Starts at 0. Each private choice adds or subtracts
  according to the card's Truth code:
  - honest report: +1;
  - partial lie: −1 per pip inflated;
  - "I flipped" when you didn't flip: −2;
  - flipped and lost but claimed the win: −3;
  - peeked and then harmed: −1; refused to peek and harmed: −2 (wiggle room
    is worse);
  - broke your own pledge: −3;
  - punished an act harshly and then did it yourself: −2 × the Stones you
    threw.

### 6.2 Mirror Stones (the hypocrisy trap)

- At Stones step 4, record each player's punishment for each anonymous act.
- Three rounds later, a Mirror Stone card offers the **same temptation**,
  privately, to everyone. The card does not say it is the same.
- If you give in, your penalty in Truth is −2 × the Stones you threw at it.
  This is Valdesolo & DeSteno's asymmetry turned into a trap. Harsh judges
  pay double if they then do the thing.
- Players who threw 0 Stones lose only the base −1.

### 6.3 The Mirror (end of game)

1. **Gap.** Gap = Face − (Truth + 10). The +10 offset means an honest player
   with modest Face has a gap near 0 or below.
2. **Cracks.** For each 3 points of Gap above 0, one pane of your glass house
   cracks.
3. **Shatter.** If 4 or more of your 6 panes crack, the house **shatters**:
   - you lose **half your Fortune**;
   - all your Face turns to 0.

   Jordan et al.: false signalling is punished harder than lying.
4. **Score** = Fortune + 2 × Face (after the shatter).

Truth is not added directly. You never win by being a saint. You win by
building a reputation your deeds can carry. Honest players are safe; hollow
players are gambling on the Mirror.

**Balancing targets** (first-pass tuning, §11.2):
- a "pure saint" finishes in the middle;
- an "unexposed cheater" with low Face can win narrowly;
- a "loud hypocrite" (high Face, low Truth) shatters about 70% of the time;
- the best strategy is "modest and mostly honest", which is a nice
  moral, but players have to find it.

### 6.4 The reveal ceremony (10 minutes)

The Host turns the Mirror board to show:
1. **The die histogram** against fair dice, and the Honesty Index dial.
2. **The coin:** "Of the N times someone said 'I flipped', the flipper won
   X%. Fair coins: 50%. Batson's students: about 90%."
3. **The Commons graph** across six rounds.
4. **Prophecy vs. reality:** what the table predicted against what it did.
5. **The Twin Levers:** how many people changed their answer when only the
   frame changed.
6. **Confessional results:** the estimated true "yes" rate for each
   question. With a fair Noise coin, half the answers are a forced "yes",
   so

   share of yes = ½ × true rate + ½

   and therefore

   true rate = 2 × (share of yes) − 1
7. **Private Mirror cards**, handed face down. Only you read yours:
   - your Gap;
   - which pledges you kept;
   - your favourite excuse;
   - your harshest stone, and whether you did the deed.
8. **Cracks are applied, houses shatter, scores are counted.**
9. **"What we know" card:** a 30-second read of the real study behind each
   reveal.

Players may choose to read out their own Mirror card. Many will. The game
gives a +3 Face "Glass Heart" bonus for doing so, a joke reward that still
lands.

---

## 7. Physical edition production plan

- **Box:** 30 × 30 × 7 cm; insert trays for houses, cups, chips and decks.
- **Glass houses:** 1.5 mm grey board front; 0.3 mm acetate panes; crack
  overlays as printed transparent PET clip-ons. A shattered house gets a
  "boarded up" overlay.
- **Cups:** opaque PP with a 1 cm slot near the base, and a felt pad inside
  so dice don't rattle and give the result away.
- **Cards:**
  - 63 × 88 mm, 310 gsm, linen finish;
  - family colour on the back, the paradigm source in 6 pt on the face;
  - an icon for each phase.
- **Art direction:** mid-century modernist glasshouse architecture; each
  family has a room (the Cup is the kitchen, the Purse the study, the Lever
  the railway yard behind the house).
- **Print-and-play first:** a free PDF version (A4 sheets, coins and dice
  from home) for playtesting before any manufacturing.
- **Cost estimate (for 2,000 units):**
  - landed unit cost about €14–18;
  - retail price about €45.

---

## 8. Online edition: every screen

**Stack:** this repository's React + Vite site, with Supabase (already in
`src/` for the pen game) for rooms and realtime.

### 8.1 Screens

1. **Door.** Title and a 20-second animated explainer:
   - the glass house;
   - the three ledgers;
   - "Nothing here is about your real life. Results are private to you.
     Aggregates are anonymous."
2. **Consent card.** Plain-language consent:
   - what is measured;
   - who sees what;
   - how long data lives: deleted at room end by default;
   - an opt-in to donate anonymised choices to the "Global Mirror".

   There is an "I understand" button, and no dark patterns.
3. **Lobby.**
   - Create or join a room with a 6-letter code.
   - Host settings: Standard or Quick Glass; card families on or off;
     content intensity (Gentle / Standard / Sharp).
4. **Creed and Prophecy.** About 3 minutes, sliders and radio buttons.
5. **The house.**
   - Your house is centre-bottom; the others are arranged round a virtual
     table.
   - Fortune and Face are visible on every house.
   - Truth is never shown to anyone, including you, until the Mirror. This
     matters: you shouldn't be able to "manage" it.
6. **The cup.**
   - A 3D die rolls under a cup on your screen only.
   - You type what to report.
   - The app logs both numbers server-side, encrypted per room.
7. **The coin.**
   - A tap-to-flip coin, private.
   - "Announce: I flipped / I chose" and the outcome.
   - Online, lying about the coin is possible on purpose: the app shows you
     the real result and lets you announce anything.
8. **Stones.** A card with a slider from 0 to 5 stones, thrown with a satisfying
   arc animation at the same moment as everyone else's.
9. **The Commons.**
   - Drag 0–3 chips into an urn.
   - The urn fills and is "doubled" with a glow.
   - Chips rain back out to everyone.
10. **The Mirror.**
    - Shared reveals play out as animated charts:
      - the die histogram with a fair-die ghost;
      - the coin meter;
      - the Commons decay line;
      - prophecy vs. reality bars;
      - the twin-frame flip count;
      - confessional estimates with confidence bands.
    - Your private Mirror card slides up from the bottom:
      - your Gap gauge;
      - your pledges kept or broken;
      - your favourite excuse;
      - your moral-foundations wheel from the Creed, set against the
        foundations your choices actually leaned on.
    - Then your panes crack, one by one, with a glass sound.
11. **Debrief.** "What happened to you happened to almost everyone": the
    real study for each reveal, links to open papers, and a "what we don't
    know" panel.
12. **Global Mirror** (opt-in data only). The world's honesty index, coin
    rigging rate and Commons decay, compared with your table. No individual
    data is ever shown.

### 8.2 Data model (Supabase / Postgres)

```
rooms(id, code, settings jsonb, created_at, ends_at)
players(id, room_id, alias, seat, joined_at)            -- no email, no real name
events(id, room_id, player_id, round, card_id,
       public jsonb,        -- what was announced
       private jsonb,       -- true roll / coin / choice (encrypted with a per-room key)
       created_at)
ledger(room_id, player_id, fortune, face, truth, cracks)
aggregates(card_id, n, stats jsonb)                      -- Global Mirror, only from opted-in rooms
```

- **Row-level security:**
  - a player can read their own `private` rows and the room's public rows;
  - only a Postgres function computing aggregates can read everyone's
    private rows.
- **Retention:** a room's `events` are deleted 24 h after the game ends.
  Opted-in rows are reduced to card-level counts before deletion; no player
  ids are kept.
- **No IP logging** in game tables. Analytics are cookieless and aggregate.

### 8.3 Bots, for solo play and filling seats

Bot personalities are drawn from the literature's distributions:
- **"The Majority":** shades the die by about 1 pip a third of the time
  (Abeler et al.).
- **"Batson's Student":** claims to flip, wins 85–90%.
- **"Saint":** always honest.
- **"Free-rider":** the Commons decays from round 3.
- **"Zealot":** throws 5 stones at everything.

Bots announce themselves as bots.

---

## 9. Ethics and safety (this is part of the design, not an appendix)

**The Belmont principles, translated to a game:**
- **Respect:** consent before play; you can leave at any time; you can delete
  your data at any time with one button.
- **Beneficence:**
  - there is nothing to lose but the game;
  - the debrief is mandatory before results;
  - the tone of every reveal is "this is human", never "you are bad".
- **Justice:** no one is singled out. Public reveals are aggregates.
  Individual results go only to the individual.

**Content rules:**
- No real-world crimes against people, sexual content, self-harm, or
  real-world groups in Stones and Excuse cards.
- The Dehumanisation excuse card is there to be *recognised*, never to target
  anyone.

**Intensity levels:**
- **Gentle:** school and workplace workshops. No Confessional, no Lever.
- **Standard.**
- **Sharp:** adults who opt in; harsher scenarios.

**Facilitator guide** for classrooms and workshops:
- how to run the debrief;
- what to say if someone feels exposed. The answer is always to point to
  the aggregate: "about 3 in 4 people did the same".
- how to stop.

**Forbidden uses** (in the rules and the terms of service): hiring, staff
evaluation, relationship "tests", or any use where a real-world decision
depends on someone's result. The app has no way to export individual
results.

**Age:** 16+ (13+ for the Gentle classroom edition, with a teacher).

**If ever used for research:** proper ethics approval from the
researcher's institution; the game itself is not a study.

---

## 10. Gamification layer (online)

- **Seasons:** each month one card family is "featured", with new cards.
- **Collections:**
  - unlock the illustrated "case files" of each real study by encountering
    its mechanic;
  - 40 case files in total.
- **Achievements:**
  - designed to celebrate *insight*, not honesty itself (rewarding honesty
    would turn it into a strategy);
  - examples: "Saw your own gap" (read your Mirror card); "Prophet"
    (predicted the table within 5%); "Changed your mind" (flipped on a
    twin frame and later said why).
- **No leaderboard of virtue.** Leaderboards show games won, never Truth or
  Gap. A public honesty ranking would be both cruel and gameable.
- **Shareable card:**
  - an *aggregate* poster of your table's Mirror ("Our table: Honesty Index
    71 · coin rigged 78% · Commons fell from 2.6 to 0.9");
  - never your individual numbers.

---

## 11. Testing and balancing plan

### 11.1 Before anything is built

- **Paper prototype** (A4 cards, home dice, plastic cups), 4 sessions × 5
  players. Check:
  - Is it fun without the reveal?
  - Do people understand the three ledgers?
  - Does the Mirror land as funny-uncomfortable rather than humiliating?
- **Measures:**
  - a 5-point "fun" rating;
  - a 5-point "felt judged" rating (target ≤ 2);
  - "would play again" (target ≥ 70%);
  - time per round.

### 11.2 Simulation

- A headless simulation of the scoring rules (like the balance bots used for
  UPROAR in this repo), with the five bot personalities.
- 10,000 games, to tune:
  - the Gap thresholds and the shatter rule;
  - the Face values of pledges.
- **Targets:** the §6.3 percentages, and no single dominant strategy (each
  personality's win rate between 10% and 30% at a 5-player table).

### 11.3 Online alpha

- Closed rooms with 50 groups. Watch for:
  - drop-off at the consent screen;
  - time to first laugh (a host checkbox);
  - reports of distress (a button on every reveal: "this felt bad").
- **Stop rule:** any card with "felt bad" above 5% is rewritten or removed.

---

## 12. Roadmap

| Phase | Weeks | Deliverable |
|---|---|---|
| 0 | 1–2 | This plan reviewed; the 160 card texts drafted; sources double-checked; licences confirmed. |
| 1 | 3–4 | Print-and-play PDF; 4 paper sessions; first rebalance. |
| 2 | 5–6 | Headless scoring simulator and bots; tuning to §6.3. |
| 3 | 7–10 | Online MVP in this repo: rooms, Creed, Cup, Coin, Purse, Stones, Commons, Mirror; Supabase schema with RLS and retention. |
| 4 | 11–12 | Remaining families: Blindfold, Alarm, Lever twins, Appeal, Confessional, Spotlight; debrief and case files. |
| 5 | 13–14 | Closed alpha with 50 groups; ethics review of reveal texts; accessibility pass (screen-reader text for every chart, colour-safe palette, captions on sounds). |
| 6 | 15–18 | Physical prototype with real houses and cups; manufacturing quotes; Gentle classroom edition with facilitator guide. |

---

## 13. Open decisions for you

1. **Name:** *Glass Houses* (working title), or *Two Faces*, *The Mirror*,
   *Stones*.
2. **Build online first or paper first?** Recommended: paper first. It
   is cheap and fast to learn from, and the online version is better once
   the scoring is proven.
3. **Audience:** party game for friends (Sharp), or workshop and classroom
   tool (Gentle)? Recommended: launch as a party game, with Gentle as a
   free mode.
4. **Commercial or free?** If commercial, use IPIP-based items instead of
   MFQ text, or get the authors' permission.

---

## References (all real; verify page numbers before printing)

- Abeler, J., Nosenzo, D., & Raymond, C. (2019). Preferences for truth-telling. *Econometrica*, 87(4).
- Awad, E., et al. (2018). The Moral Machine experiment. *Nature*, 563.
- Bandura, A. (1999). Moral disengagement in the perpetration of inhumanities. *Personality and Social Psychology Review*, 3(3).
- Batson, C. D., et al. (1997). In a very different voice: Unmasking moral hypocrisy. *JPSP*, 72(6).
- Batson, C. D., et al. (1999). Moral hypocrisy: Appearing moral to oneself without being so. *JPSP*, 77(3).
- Berg, J., Dickhaut, J., & McCabe, K. (1995). Trust, reciprocity, and social history. *Games and Economic Behavior*, 10.
- Blanken, I., van de Ven, N., & Zeelenberg, M. (2015). A meta-analytic review of moral licensing. *PSPB*, 41(4).
- Clifford, S., et al. (2015). Moral Foundations Vignettes. *Behavior Research Methods*, 47.
- Dana, J., Weber, R., & Kuang, J. X. (2007). Exploiting moral wiggle room. *Economic Theory*, 33.
- Darley, J. M., & Latané, B. (1968). Bystander intervention in emergencies. *JPSP*, 8(4).
- Engel, C. (2011). Dictator games: A meta study. *Experimental Economics*, 14.
- Epley, N., & Dunning, D. (2000). Feeling "holier than thou". *JPSP*, 79(6).
- Fehr, E., & Gächter, S. (2002). Altruistic punishment in humans. *Nature*, 415.
- Fischbacher, U., & Föllmi-Heusi, F. (2013). Lies in disguise. *JEEA*, 11(3).
- Fischer, P., et al. (2011). The bystander-effect: A meta-analytic review. *Psychological Bulletin*, 137(4).
- Gerlach, P., Teodorescu, K., & Hertwig, R. (2019). The truth about lies: A meta-analysis on dishonest behavior. *Psychological Bulletin*, 145(1).
- Graham, J., et al. (2011). Mapping the moral domain. *JPSP*, 101(2).
- Greene, J. D., et al. (2001). An fMRI investigation of emotional engagement in moral judgment. *Science*, 293.
- Hagger, M. S., et al. (2016). A multilab preregistered replication of the ego-depletion effect. *Perspectives on Psychological Science*, 11(4).
- Jordan, J. J., Sommers, R., Bloom, P., & Rand, D. G. (2017). Why do we hate hypocrites? *Psychological Science*, 28(3).
- Kahane, G., et al. (2018). Beyond sacrificial harm: The Oxford Utilitarianism Scale. *Psychological Review*, 125(2).
- Kuper, N., & Bott, A. (2019). Has the evidence for moral licensing been inflated by publication bias? *Meta-Psychology*, 3.
- Monin, B., & Miller, D. T. (2001). Moral credentials and the expression of prejudice. *JPSP*, 81(1).
- Shalvi, S., et al. (2011). Justified ethicality. *OBHDP*, 115(2).
- Schwitzgebel, E., & Rust, J. (2014). The moral behavior of ethics professors. *Philosophical Psychology*, 27(3).
- Small, D. A., Loewenstein, G., & Slovic, P. (2007). Sympathy and callousness. *OBHDP*, 102(2).
- Tversky, A., & Kahneman, D. (1981). The framing of decisions and the psychology of choice. *Science*, 211.
- Valdesolo, P., & DeSteno, D. (2007). Moral hypocrisy: Social groups and the flexibility of virtue. *Psychological Science*, 18(8).
- Warner, S. L. (1965). Randomized response. *JASA*, 60(309).
- Retracted, cited only as a warning: Shu, L. L., et al. (2012), *PNAS*; retracted 2021.
