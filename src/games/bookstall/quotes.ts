/**
 * The stock.
 *
 * Every line below is Dostoevsky's, and every one carries the book it came out
 * of. Translations differ — he wrote in Russian and the English wording depends
 * entirely on who was doing the carrying — so these are the renderings in
 * common English circulation, not a single scholarly edition. The receipt says
 * as much in its small print, because a quote machine that pretends to be
 * authoritative about translation is lying to you.
 *
 * Lines widely passed around as his but without a traceable source are
 * deliberately absent. There are plenty of real ones.
 */

export interface Quote {
  id: string;
  text: string;
  /** The book, as it would be printed on a secondhand spine. */
  work: string;
  year: number;
  /** Who says it, where that is a character rather than the narrator. */
  speaker?: string;
  /** What the stall charges for it, in rupees. Cheaper is not worse. */
  price: number;
}

export const QUOTES: Quote[] = [
  {
    id: 'q01',
    text: 'Pain and suffering are always inevitable for a large intelligence and a deep heart.',
    work: 'Crime and Punishment',
    year: 1866,
    speaker: 'Raskolnikov',
    price: 35,
  },
  {
    id: 'q02',
    text: 'To go wrong in one’s own way is better than to go right in someone else’s.',
    work: 'Crime and Punishment',
    year: 1866,
    speaker: 'Razumikhin',
    price: 30,
  },
  {
    id: 'q03',
    text: 'Taking a new step, uttering a new word, is what people fear most.',
    work: 'Crime and Punishment',
    year: 1866,
    price: 25,
  },
  {
    id: 'q04',
    text: 'Talking nonsense is the sole privilege mankind possesses over the other organisms. It is by talking nonsense that one gets to the truth.',
    work: 'Crime and Punishment',
    year: 1866,
    speaker: 'Razumikhin',
    price: 40,
  },
  {
    id: 'q05',
    text: 'Man grows used to everything, the scoundrel.',
    work: 'Crime and Punishment',
    year: 1866,
    speaker: 'Raskolnikov',
    price: 20,
  },
  {
    id: 'q06',
    text: 'Power is given only to those who dare to lower themselves and pick it up.',
    work: 'Crime and Punishment',
    year: 1866,
    speaker: 'Raskolnikov',
    price: 35,
  },
  {
    id: 'q07',
    text: 'We sometimes encounter people, even perfect strangers, who begin to interest us at first sight, somehow suddenly, all at once, before a word has been spoken.',
    work: 'Crime and Punishment',
    year: 1866,
    price: 45,
  },
  {
    id: 'q08',
    text: 'It takes something more than intelligence to act intelligently.',
    work: 'Crime and Punishment',
    year: 1866,
    price: 20,
  },
  {
    id: 'q09',
    text: 'Much unhappiness has come into the world because of bewilderment and things left unsaid.',
    work: 'Crime and Punishment',
    year: 1866,
    price: 35,
  },
  {
    id: 'q10',
    text: 'I did not bow down to you, I bowed down to all the suffering of humanity.',
    work: 'Crime and Punishment',
    year: 1866,
    speaker: 'Raskolnikov',
    price: 40,
  },
  {
    id: 'q11',
    text: 'Sarcasm is the last refuge of modest and chaste-souled people when the privacy of their soul is coarsely and intrusively invaded.',
    work: 'Crime and Punishment',
    year: 1866,
    price: 45,
  },

  {
    id: 'q12',
    text: 'The mystery of human existence lies not in just staying alive, but in finding something to live for.',
    work: 'The Brothers Karamazov',
    year: 1880,
    price: 40,
  },
  {
    id: 'q13',
    text: 'Above all, do not lie to yourself. The man who lies to himself and listens to his own lie comes to a point where he cannot distinguish the truth within him, or around him.',
    work: 'The Brothers Karamazov',
    year: 1880,
    speaker: 'Father Zosima',
    price: 55,
  },
  {
    id: 'q14',
    text: 'What is hell? I maintain that it is the suffering of being unable to love.',
    work: 'The Brothers Karamazov',
    year: 1880,
    speaker: 'Father Zosima',
    price: 35,
  },
  {
    id: 'q15',
    text: 'Love in action is a harsh and dreadful thing compared with love in dreams.',
    work: 'The Brothers Karamazov',
    year: 1880,
    speaker: 'Father Zosima',
    price: 35,
  },
  {
    id: 'q16',
    text: 'Beauty is mysterious as well as terrible. God and the devil are fighting there, and the battlefield is the heart of man.',
    work: 'The Brothers Karamazov',
    year: 1880,
    speaker: 'Dmitri',
    price: 50,
  },
  {
    id: 'q17',
    text: 'Everyone is really responsible to all men for all men and for everything.',
    work: 'The Brothers Karamazov',
    year: 1880,
    speaker: 'Father Zosima',
    price: 30,
  },
  {
    id: 'q18',
    text: 'Men reject their prophets and slay them, but they love their martyrs and honour those whom they have slain.',
    work: 'The Brothers Karamazov',
    year: 1880,
    speaker: 'The Grand Inquisitor',
    price: 45,
  },
  {
    id: 'q19',
    text: 'I think the devil does not exist, but man has created him, he has created him in his own image and likeness.',
    work: 'The Brothers Karamazov',
    year: 1880,
    speaker: 'Ivan',
    price: 40,
  },

  {
    id: 'q20',
    text: 'I am a sick man. I am a spiteful man. I am an unattractive man.',
    work: 'Notes from Underground',
    year: 1864,
    speaker: 'the Underground Man',
    price: 25,
  },
  {
    id: 'q21',
    text: 'Man only likes to count his troubles; he does not calculate his happiness.',
    work: 'Notes from Underground',
    year: 1864,
    price: 30,
  },
  {
    id: 'q22',
    text: 'Man is sometimes extraordinarily, passionately, in love with suffering.',
    work: 'Notes from Underground',
    year: 1864,
    price: 30,
  },
  {
    id: 'q23',
    text: 'Every man has reminiscences which he would not tell to everyone, but only to his friends. He has other matters in his mind which he would not reveal even to his friends, but only to himself, and that in secret.',
    work: 'Notes from Underground',
    year: 1864,
    price: 60,
  },
  {
    id: 'q24',
    text: 'I say let the world go to hell, but I should always have my tea.',
    work: 'Notes from Underground',
    year: 1864,
    price: 20,
  },
  {
    id: 'q25',
    text: 'To be too conscious is an illness — a real thoroughgoing illness.',
    work: 'Notes from Underground',
    year: 1864,
    price: 30,
  },

  {
    id: 'q26',
    text: 'Beauty will save the world.',
    work: 'The Idiot',
    year: 1869,
    speaker: 'reported of Prince Myshkin',
    price: 20,
  },
  {
    id: 'q27',
    text: 'It is life that matters, nothing but life — the process of discovering, the everlasting and perpetual process, not the discovery itself at all.',
    work: 'The Idiot',
    year: 1869,
    price: 45,
  },
  {
    id: 'q28',
    text: 'Compassion is the chief law of human existence.',
    work: 'The Idiot',
    year: 1869,
    speaker: 'Prince Myshkin',
    price: 25,
  },
  {
    id: 'q29',
    text: 'What if I were not to die! What if life were given back to me — what infinity! And it would all be mine! I would turn every minute into an age.',
    work: 'The Idiot',
    year: 1869,
    speaker: 'Prince Myshkin',
    price: 40,
  },

  {
    id: 'q30',
    text: 'My God, a whole moment of happiness! Is that too little for the whole of a man’s life?',
    work: 'White Nights',
    year: 1848,
    speaker: 'the Dreamer',
    price: 30,
  },
  {
    id: 'q31',
    text: 'I am a dreamer. I have so little real life that I look upon such moments as this one now as so rare that I cannot help repeating them in my dreams.',
    work: 'White Nights',
    year: 1848,
    speaker: 'the Dreamer',
    price: 40,
  },

  {
    id: 'q32',
    text: 'One can know a man from his laugh, and if you like a man’s laugh before you know anything of him, you may confidently say that he is a good man.',
    work: 'The Adolescent',
    year: 1875,
    price: 45,
  },
  {
    id: 'q33',
    text: 'If you want to be respected by others, the great thing is to respect yourself. Only by that, only by self-respect, will you compel others to respect you.',
    work: 'The Insulted and Humiliated',
    year: 1861,
    price: 45,
  },
  {
    id: 'q34',
    text: 'The degree of civilisation in a society can be judged by entering its prisons.',
    work: 'The House of the Dead',
    year: 1862,
    price: 35,
  },
  {
    id: 'q35',
    text: 'Man is a creature that can get accustomed to anything, and I think that is the best definition of him.',
    work: 'The House of the Dead',
    year: 1862,
    price: 35,
  },
  {
    id: 'q36',
    text: 'Money is coined liberty, and so it is ten times dearer to a man who is deprived of freedom.',
    work: 'The House of the Dead',
    year: 1862,
    price: 35,
  },
  {
    id: 'q37',
    text: 'Man is a mystery. It must be unravelled, and if you spend your whole life unravelling it, do not say that you have wasted time.',
    work: 'Letter to his brother Mikhail',
    year: 1839,
    price: 50,
  },
  {
    id: 'q38',
    text: 'Without a firm idea of what he lives for, man will not accept life and will rather destroy himself than remain on this earth.',
    work: 'Demons',
    year: 1872,
    price: 45,
  },
  {
    id: 'q39',
    text: 'Nothing has ever been more insupportable for a man and a human society than freedom.',
    work: 'The Brothers Karamazov',
    year: 1880,
    speaker: 'The Grand Inquisitor',
    price: 40,
  },
  {
    id: 'q40',
    text: 'A man who bows down to nothing can never bear the burden of himself.',
    work: 'Demons',
    year: 1872,
    price: 35,
  },
];

export const TOTAL_QUOTES = QUOTES.length;

/** The stall itself, printed at the top of every bill. */
export const STALL = {
  name: 'NEW LIGHT BOOK STALL',
  line1: 'Secondhand · Russian classics a speciality',
  line2: 'Opp. Gandhi Maidan, Platform Road',
  phone: 'PH 2274 4190',
  est: 'EST. 1971',
  gst: '10ABCDE1234F1Z5',
};

/**
 * Deal the next line.
 *
 * Draws from a shuffled bag rather than picking at random, so you see every
 * line once before you see any of them twice — "unique each time" meaning
 * genuinely unique, not merely unlikely to repeat.
 */
export function drawNext(seen: string[]): { quote: Quote; bagReset: boolean } {
  const unseen = QUOTES.filter((q) => !seen.includes(q.id));
  if (unseen.length > 0) {
    return { quote: unseen[Math.floor(Math.random() * unseen.length)], bagReset: false };
  }

  // Bag empty: tip it out and start again. Hold back the line you just read,
  // so the seam between one bag and the next cannot hand you a repeat either.
  const last = seen[seen.length - 1];
  const fresh = QUOTES.filter((q) => q.id !== last);
  const pool = fresh.length > 0 ? fresh : QUOTES;
  return { quote: pool[Math.floor(Math.random() * pool.length)], bagReset: true };
}
