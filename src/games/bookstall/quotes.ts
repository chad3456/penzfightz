/**
 * The stock.
 *
 * Every line here is Dostoevsky's. Where a line carries a `ref`, it was located
 * in the book itself — Constance Garnett's translation, Project Gutenberg
 * #2554 — by `scripts/cite-quotes.mjs`, which refuses to emit anything it
 * cannot find, so the chapter on the receipt is the chapter it came from and
 * not a chapter somebody remembered. The rest are lines in common English
 * circulation whose source text this build could not reach; they are kept
 * because they are his, and marked apart because they are not checked.
 *
 * Translations differ — he wrote in Russian, and the English wording depends
 * entirely on who was doing the carrying. The receipt says as much in its small
 * print, because a quote machine that pretends to be authoritative about
 * translation is lying to you.
 *
 * Five lines that earlier versions of this file carried have been removed: they
 * circulate widely under his name, they are not in Garnett, and nothing here
 * could place them. Two more were corrected to what the book actually says.
 */

export interface Quote {
  id: string;
  text: string;
  /** The book, as it would be printed on a secondhand spine. */
  work: string;
  year: number;
  /** Where in the book, when it was checked against the book. */
  ref?: string;
  /** Who says it, where that is a character rather than the narrator. */
  speaker?: string;
  /** What the stall charges for it, in rupees. Cheaper is not worse. */
  price: number;
}

export const QUOTES: Quote[] = [
  {
    id: 'cp01',
    text: 'Nothing in the world is harder than speaking the truth and nothing easier than flattery.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part VI, ch. IV',
    price: 30,
  },
  {
    id: 'cp02',
    text: 'People with new ideas, people with the faintest capacity for saying something new, are extremely few in number, extraordinarily so in fact.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part III, ch. V',
    price: 35,
  },
  {
    id: 'cp03',
    text: 'Truth won\'t escape you, but life can be cramped.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part III, ch. I',
    price: 20,
  },
  {
    id: 'cp04',
    text: 'It is in just such stupid things clever people are most easily caught.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part III, ch. VI',
    price: 25,
  },
  {
    id: 'cp05',
    text: 'The more cunning a man is, the less he suspects that he will be caught in a simple thing.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part III, ch. VI',
    price: 30,
  },
  {
    id: 'cp06',
    text: 'The more cunning a man is, the simpler the trap he must be caught in.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part III, ch. VI',
    price: 25,
  },
  {
    id: 'cp07',
    text: 'Everything which is _of use_ to mankind is honourable.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part V, ch. I',
    price: 20,
  },
  {
    id: 'cp08',
    text: 'There is a line in everything which it is dangerous to overstep; and when it has been overstepped, there is no return.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part IV, ch. II',
    price: 35,
  },
  {
    id: 'cp09',
    text: 'To my thinking, you, with all your virtues, are not worth the little finger of that unfortunate girl at whom you throw stones.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part IV, ch. II',
    price: 35,
  },
  {
    id: 'cp10',
    text: 'There are chance meetings with strangers that interest us from the first moment, before a word is spoken.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part I, ch. II',
    price: 30,
  },
  {
    id: 'cp11',
    text: 'Honoured sir, honoured sir, you know every man ought to have at least one place where people feel for him!',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part I, ch. II',
    price: 30,
  },
  {
    id: 'cp12',
    text: 'Almost every criminal is subject to a failure of will and reasoning power by a childish and phenomenal heedlessness, at the very instant when prudence and caution are most essential.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part I, ch. VI',
    price: 45,
  },
  {
    id: 'cp13',
    text: 'We prefer to live on other people\'s ideas, it\'s what we are used to!',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part III, ch. I',
    price: 25,
  },
  {
    id: 'cp14',
    text: 'I am not worthy to love you, but to do homage to you is the duty of every man who is not a perfect beast!',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part III, ch. I',
    price: 30,
  },
  {
    id: 'cp15',
    text: 'We must be patient, and much, much can be forgiven.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part III, ch. IV',
    price: 20,
  },
  {
    id: 'cp16',
    text: 'The man of genius is one of millions, and the great geniuses, the crown of humanity, appear on earth perhaps one in many thousand millions.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part III, ch. V',
    price: 35,
  },
  {
    id: 'cp17',
    text: 'Break what must be broken, once for all, that\'s all, and take the suffering on oneself.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part IV, ch. IV',
    price: 30,
  },
  {
    id: 'cp18',
    text: 'To what a pitch of stupidity a man can be brought by frenzy!',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part VI, ch. IV',
    price: 25,
  },
  {
    id: 'cp19',
    text: 'Everyone thinks of himself, and he lives most gaily who knows best how to deceive himself.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part VI, ch. IV',
    price: 30,
  },
  {
    id: 'cp20',
    text: 'The cellar rats will swim out, and men will curse in the rain and wind as they drag their rubbish to their upper storeys.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part VI, ch. VI',
    price: 35,
  },
  {
    id: 'cp21',
    text: 'If only a man is a gentleman, all the rest can be gained by talents, learning, good sense, genius.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part VI, ch. VIII',
    price: 30,
  },
  {
    id: 'cp22',
    text: 'In the first case you are a man, in the second you\'re no better than a bird.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part III, ch. I',
    price: 25,
  },
  {
    id: 'cp23',
    text: 'Human nature is not taken into account, it is excluded, it\'s not supposed to exist!',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part III, ch. V',
    price: 25,
  },
  {
    id: 'cp24',
    text: 'A man will commit a clever murder at the risk of his life and then at once he goes drinking in a tavern.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part II, ch. VI',
    price: 30,
  },
  {
    id: 'cp25',
    text: 'The first category is always the man of the present, the second the man of the future.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part III, ch. V',
    price: 30,
  },
  {
    id: 'cp26',
    text: 'It\'s not time, but yourself that will decide that.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part VI, ch. II',
    price: 20,
  },
  {
    id: 'cp27',
    text: 'I know that you don\'t believe it, but indeed, life will bring you through.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part VI, ch. II',
    price: 25,
  },
  {
    id: 'cp28',
    text: 'You must forgive in the hour of death, that\'s a sin, madam, such feelings are a great sin.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part II, ch. VII',
    price: 30,
  },
  {
    id: 'cp29',
    text: 'You must look things straight in the face at last, and not weep like a child and cry that God won\'t allow it.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part IV, ch. IV',
    price: 30,
  },
  {
    id: 'cp30',
    text: 'More than that, we become casuists, we learn to be Jesuitical and for a time maybe we can soothe ourselves, we can persuade ourselves that it is one\'s duty for a good object.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part I, ch. IV',
    price: 45,
  },
  {
    id: 'cp31',
    text: 'From which it follows that, if society is normally organised, all crime will cease at once, since there will be nothing to protest against and all men will become righteous in one instant.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part III, ch. V',
    price: 45,
  },
  {
    id: 'cp32',
    text: 'The idea is simple, but unhappily it has been a long time reaching us, being hindered by idealism and sentimentality.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part II, ch. V',
    price: 35,
  },
  {
    id: 'cp33',
    text: 'That\'s man\'s one privilege over all creation.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part III, ch. I',
    price: 20,
  },
  {
    id: 'cp34',
    text: 'Taking a new step, uttering a new word is what they fear most.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part I, ch. I',
    price: 25,
  },
  {
    id: 'cp35',
    text: 'Pain and suffering are always inevitable for a large intelligence and a deep heart.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part III, ch. V',
    price: 25,
  },
  {
    id: 'cp36',
    text: 'To go wrong in one\'s own way is better than to go right in someone else\'s.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part III, ch. I',
    price: 25,
  },
  {
    id: 'cp37',
    text: 'Man grows used to everything, the scoundrel.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part I, ch. II',
    price: 20,
  },
  {
    id: 'cp38',
    text: 'I did not bow down to you, I bowed down to all the suffering of humanity.',
    work: 'Crime and Punishment',
    year: 1866,
    ref: 'Part IV, ch. IV',
    price: 25,
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
