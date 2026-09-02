/**
 * Your values, as a deck.
 *
 * The whole game rests on one idea taken straight out of the *Genealogy of
 * Morals*: a morality is not a set of rules you consult, it is the **residue of
 * a history**. So there is no alignment meter here and no good/evil bar. There
 * is a deck, it starts small and even, and every choice you make puts another
 * copy of the card you played back into it.
 *
 * Two consequences fall out of that, and both of them are the lesson:
 *
 * **What you have done is what you can do.** A choice is only offered if the
 * card it costs is in your hand. Play pity for twenty years and cruelty stops
 * being available to you — not because the game forbids it, but because it is
 * not in the deck any more. That is Nietzsche's point about the ascetic and
 * Dostoevsky's about Zosima, and it is the same point.
 *
 * **Guilt cannot be played.** It is the one card with no use. It sits in your
 * hand taking up a slot, and the only thing that removes it is Confession,
 * which costs you everything the guilty act gained. That is *Crime and
 * Punishment* compressed into a rule, and it is also, exactly, Nietzsche's
 * genealogy of *Schuld* from *Schulden* — guilt from debt, morality as
 * bookkeeping that has forgotten it was bookkeeping.
 */

export type Suit = 'cross' | 'hammer' | 'weight';

export interface Card {
  id: CardId;
  name: string;
  /** What playing it means, in one line. */
  gloss: string;
  suit: Suit;
}

export type CardId =
  | 'pity' | 'duty' | 'mercy' | 'sacrifice' | 'faith' | 'confession'
  | 'pride' | 'cunning' | 'will' | 'contempt' | 'defiance' | 'laughter'
  | 'silence' | 'doubt' | 'reason' | 'spite' | 'guilt';

export const CARDS: Record<CardId, Card> = {
  // ------------------------------------------------------------- the cross
  pity: { id: 'pity', name: 'Pity', suit: 'cross', gloss: 'You feel it with them, and it moves your hand.' },
  duty: { id: 'duty', name: 'Duty', suit: 'cross', gloss: 'What is owed, whether or not it is felt.' },
  mercy: { id: 'mercy', name: 'Mercy', suit: 'cross', gloss: 'Less than they had coming.' },
  sacrifice: { id: 'sacrifice', name: 'Sacrifice', suit: 'cross', gloss: 'You pay, so that they do not have to.' },
  faith: { id: 'faith', name: 'Faith', suit: 'cross', gloss: 'Held without proof, and known to be held without proof.' },
  confession: { id: 'confession', name: 'Confession', suit: 'cross', gloss: 'Said out loud, to somebody, at a cost.' },

  // ------------------------------------------------------------ the hammer
  pride: { id: 'pride', name: 'Pride', suit: 'hammer', gloss: 'Your own measure, and no appeal above it.' },
  cunning: { id: 'cunning', name: 'Cunning', suit: 'hammer', gloss: 'The short way round, taken quietly.' },
  will: { id: 'will', name: 'Will', suit: 'hammer', gloss: 'You want it, and wanting is a reason.' },
  contempt: { id: 'contempt', name: 'Contempt', suit: 'hammer', gloss: 'They are less, and you have stopped pretending otherwise.' },
  defiance: { id: 'defiance', name: 'Defiance', suit: 'hammer', gloss: 'No — for the sake of the no.' },
  laughter: { id: 'laughter', name: 'Laughter', suit: 'hammer', gloss: 'The gravity goes out of it, and so does its hold.' },

  // ------------------------------------------------------------ the weight
  silence: { id: 'silence', name: 'Silence', suit: 'weight', gloss: 'You were there, and you said nothing.' },
  doubt: { id: 'doubt', name: 'Doubt', suit: 'weight', gloss: 'You cannot get to the bottom of it, and you have tried.' },
  reason: { id: 'reason', name: 'Reason', suit: 'weight', gloss: 'It adds up. That is all it does.' },
  spite: { id: 'spite', name: 'Spite', suit: 'weight', gloss: 'Against your own advantage, to prove you are not a piano key.' },
  guilt: {
    id: 'guilt',
    name: 'Guilt',
    suit: 'weight',
    gloss: 'Cannot be played. Takes the place of something that could have been.',
  },
};

/**
 * What everybody starts with.
 *
 * Twelve cards, two each of the six ordinary ones. Not because a person begins
 * life well equipped, but because a person begins life with *all* of it —
 * capable of pity and of cunning, of taking something on faith and of adding it
 * up — and the interesting thing is not what gets added, it is what gets
 * pruned. Ten scenes in, half of these will have grown to five copies and half
 * will be the cards you cannot get back.
 *
 * An earlier version opened with four kinds. Scene one of the first playtest
 * offered the Grand Inquisitor and locked two of its three answers, which is a
 * fine sentence and a bad game: nobody starts a life with no faith and no
 * arithmetic.
 */
export const OPENING: CardId[] = [
  'pity', 'pity', 'duty', 'duty', 'pride', 'pride',
  'cunning', 'cunning', 'reason', 'reason', 'faith', 'faith',
];

export const HAND_SIZE = 5;
