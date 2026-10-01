# Glass Houses: The Salon

A group chat with the dead. Philosophers, scientists and writers are added
to chats about questions their own century never faced. You moderate, and
the glass houses crack.

Part of **Glass Houses** (see `docs/glass-houses.md`), the game about the
distance between what we say and what we do.

## The salons

| Salon | Question | In the chat |
|---|---|---|
| **One Wing** | Should women have exactly the same rights and opportunities as men, everywhere? | Aristotle, Rousseau, Mary Wollstonecraft, John Stuart Mill, Swami Vivekananda |
| **Two Grooms** | Should two men, or two women, be able to marry with the same rights? | Albert Camus, Plato, Immanuel Kant, Jeremy Bentham, Oscar Wilde |
| **Can It Suffer?** | An AI says it is afraid of being switched off. Does it deserve moral consideration? | René Descartes, Ada Lovelace, G. W. Leibniz, Alan Turing, Jeremy Bentham |

Coming next:
- **The Butcher's Bill:** Pythagoras, Descartes, Bentham, Kant and Gandhi on
  eating meat.
- **Eye of the Needle:** Seneca, Diogenes, Adam Smith, Marx and Carnegie on
  billionaires.

## How a salon plays

- **It looks like a messaging app.** Doodle wallpaper, bubbles, typing
  dots, reactions, quoted replies, read ticks. The members are drawn as
  engraved busts, and each one's mouth moves while they type.
- **You moderate.** At each turn you pick from cards like smart replies:
  - **💬 Ask** a question.
  - **🔎 Press** a weak point in an argument.
  - **🪨 Throw a stone.** The stone flies across the screen to their house.
    A narrator card then states a documented fact from the thinker's own
    life, set against what they wrote. Examples:
    - Rousseau wrote the treatise on raising children and left his five at
      the Foundling Hospital.
    - Mill argued for liberty while serving the East India Company for 35
      years and calling despotism legitimate for "barbarians".
    - Bentham wrote the first known English case for decriminalising
      homosexuality in 1785 and never published it.
    - Descartes called animals unfeeling machines and doted on his dog.
- **The glass houses.** Each member has a four-pane house in the side
  panel; on a phone, a badge on their avatar.
  - A **crack** means a documented contradiction between word and deed.
  - **Fog** means a tension inside their own ideas, or a compromise their
    era forced on them. Plato's Symposium against his Laws, and Wilde's
    marriage, are fog, not cracks.
- **Excuses.** When a thinker defends themselves, the excuse is labelled
  with one of Albert Bandura's mechanisms of moral disengagement: moral
  justification, euphemistic labelling, advantageous comparison,
  displacement of responsibility, distortion of consequences.
- **The verdict.**
  - You judge each thinker as **Consistent**, **Of their time** or
    **Hypocrite**, seeing every crack and excuse you uncovered.
  - Then comes "Now, your glass house": three private questions about your
    own views, starting with "which will 2226 find embarrassing?". The
    answers are kept in `localStorage` only and never sent anywhere.
- **Replay.** Each salon has two choice points, with two or three branches
  each. One playthrough can't uncover everything.

## Honesty rules

The dead don't chat, so every message carries a badge, and tapping it opens
the source:

- **📜 On the record:** their own words, from a public-domain translation
  (Jowett's Plato and Aristotle, Foxley's Rousseau, Abbott's and Hastie's
  Kant, Veitch's Descartes, Latta's Leibniz), or a very short quotation
  (Camus, Turing) for commentary.
- **❝ Attributed:** widely quoted and theirs in substance, exact wording
  uncertain. Used for Vivekananda's "bird with one wing", his "women must
  solve their own problems", Camus's "my mother before justice", and
  Descartes's dog.
- **≈ Paraphrase:** a documented view or fact, in our words.
- **✦ Imagined:** our dramatisation, extrapolated from their writing.
  Clearly marked, never presented as their words.
- **🔍 Evidence:** the narrator's documented fact behind a stone.

Where a famous story is unreliable, the narrator says so and it is not a
stone. Example: the claim that Descartes vivisected dogs, which comes from
later hostile sources.

Each salon's verdict page lists its sources in full.

## Files

- `src/salon/cast.ts`: 14 thinkers, with dates, birthplace, their
  best-known principle (their "Face"), colour and portrait recipe.
- `src/salon/Portrait.tsx`: engraved-bust portraits drawn from the recipe
  (hair, beard, turban or hat, coat and collar, a carnation for Wilde, a
  cigarette for Camus), with a speaking animation and crack overlays.
- `src/salon/episodes.ts`: the three conversations as small graphs.
  - Nodes play messages, then offer choices.
  - Branches return to their hub, so you can ask several things before
    moving on.
  - Every message carries its badge, source, reactions, reply-to, excuse
    and any crack or fog mark.
- `src/salon/Salon.tsx`:
  - the hub, with an animated phone preview and a marquee of portraits;
  - the chat engine (typing pacing, skip, speed toggle, stone animation,
    glass-crack sound and toasts, source drawer);
  - the verdict and private mirror.
- Styles: the `.sa-*` block in `src/styles/global.css`, light and dark.
- Fonts: Fraunces, shared with Guitar Atlas from `public/fonts-guitar/`.

## Adding a salon

Add a `Thinker` to `cast.ts` for anyone new, then an `Episode` to
`episodes.ts`:
- a `start` node and hub nodes with `choices` and an `onward`;
- branch nodes whose `onward` returns to the hub;
- an `end` node.

Badge every line. Give every 📜 and ≈ line a `src`. Add a `mark` only for a
documented contradiction (crack) or tension (fog).
