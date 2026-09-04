/**
 * A thousand jokes in one register.
 *
 * Dostoevsky's comedy is not about death and it is not about cruelty. It is
 * about a particular failure mode of the self: a man does something, and then
 * immediately begins performing his own reaction to it for an audience of one.
 * The confession that wants applause. The generosity that follows the beggar
 * for six streets to see what he does with the money. The two-year campaign of
 * revenge for a slight the other man never noticed. That is the joke, and it is
 * the same joke every time, which is exactly why a thousand of them works.
 *
 * ### Why a grammar and not a list
 *
 * A thousand written jokes would be a thousand jokes. A thousand *generated*
 * jokes are only funny if the generator knows what a joke is, so nothing here
 * fills blanks in a sentence. Each template is a **mechanism** — a reversal, an
 * escalation, a category error, a confession that is really a request — and the
 * vocabulary supplies the specifics that the mechanism then does something to.
 * Swap a noun and the joke survives; swap the mechanism and it is a different
 * joke. That is the test a grammar has to pass and the reason most of them
 * fail it.
 *
 * The turn always lands on the last clause. It is the one formal rule here and
 * it is not negotiable: a punchline in the middle of a sentence is a fact.
 */

export interface Joke {
  /** The situation. */
  setup: string;
  /** The turn. Always last, always the shortest of the two. */
  turn: string;
  /** Which mechanism made it, for the staging to read. */
  kind: Kind;
  seed: number;
}

export type Kind =
  | 'pride'
  | 'confession'
  | 'debt'
  | 'slight'
  | 'paperwork'
  | 'charity'
  | 'god'
  | 'illness'
  | 'party'
  | 'letter'
  | 'stairs'
  | 'funeral';

const rng = (seed: number) => {
  let a = (seed ^ 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// ------------------------------------------------------------- vocabularies

const OTHER = [
  'the clerk from the ministry',
  'his landlady',
  'the student on the floor above',
  'a creditor of long standing',
  'an officer who has never once looked at him',
  'his sister who writes',
  'the doctor',
  'a man who was kind to him in 1846',
  'the woman who sells the newspapers',
  'the porter',
  'a cousin with opinions',
  'the pawnbroker',
  'a colleague of exactly equal rank',
  'the tailor who is owed',
  'a friend from the seminary',
  'the girl at the tobacconist',
  'his superior who is younger',
  'a neighbour who plays the flute',
  'the man who sold him the coat',
  'a relative who prospered',
  'the copyist with the good handwriting',
  'a woman he was rude to on a Tuesday',
  'the priest who is patient',
  'the caretaker of the building opposite',
];

const SUM = [
  'four roubles',
  'eleven kopecks',
  'the exact price of a cab',
  'thirty roubles he did not have',
  'a sum he still refers to as "the sum"',
  'half of what he was owed',
  'seven roubles and a promise',
  'twenty-five roubles, borrowed twice',
  'the rent, less a little',
  'three roubles and the postage',
  'a hundred, once, briefly',
  'whatever was in the coat',
];

const SLIGHT = [
  'did not look up',
  'said his name with the stress on the wrong syllable',
  'held the door a moment too long',
  'used the familiar form, once',
  'laughed at something else',
  'offered him the smaller chair',
  'was already leaving',
  'asked after his health in the past tense',
  'moved him aside without seeing him',
  'repeated his remark, improved',
  'thanked him twice, which is once too many',
  'agreed with him immediately',
  'called him by the name of a duller man',
  'was kind in front of witnesses',
];

/**
 * A length of time.
 *
 * Everything here has to survive every frame it is dropped into — "for ___",
 * "takes ___", "in ___", "waiting ___", "overdue by ___" — which is why it is
 * durations only. Mixing a point in time into this list is how you get "takes
 * since the business with the coat", and a joke with a broken sentence in it
 * is not a joke, it is a fault.
 */
const SPAN = [
  'three weeks',
  'two years',
  'the whole of Lent',
  'eleven months',
  'a winter',
  'four days, which felt structural',
  'the better part of a decade',
  'nine days and the two nights that count',
  'a period he declines to specify',
  'long enough to have opinions about it',
  'most of a spring',
  'a year, and then a second year',
];

/** A point things have run from. Only ever after "as of" or "ever since". */
const SINCE = [
  'the thaw',
  'the business with the coat',
  'his name-day',
  'the funeral in November',
  'the letter he did not send',
  'a Tuesday he can date exactly',
  'the winter before last',
  'the evening at the Ivanov house',
  'the day he was thanked',
  'the promotion that went elsewhere',
  'the first frost',
  'some point in Lent',
];

/**
 * The same people, in the possessive.
 *
 * "A man who was kind to him in 1846’s" is not a phrase, so the templates that
 * need a genitive draw from a list of people short enough to own something.
 */
const HOST = [
  'his landlady',
  'the doctor',
  'the porter',
  'the pawnbroker',
  'his sister',
  'the priest',
  'his cousin',
  'the tailor',
  'his superior',
  'the copyist',
  'the flute-player upstairs',
  'the officer',
];

const PLACE = [
  'on the Nevsky',
  'at the corner by the canal',
  'on the stairs',
  'outside the pawnbroker’s',
  'in the corridor of the department',
  'under the lamp at the bridge',
  'in the doorway of a tavern he does not like',
  'at the tea-shop with the bad windows',
  'on the Haymarket, in the rain',
  'in the anteroom, waiting',
  'by the stove at the back',
  'on the embankment, in a wind',
];

const OBJECT = [
  'a coat he cannot afford to be seen in twice',
  'a samovar that has never once been used for guests',
  'a letter he did not send',
  'a watch that is wrong in a way he finds companionable',
  'a chair with a history',
  'a book he has told four people he is reading',
  'a candle he is rationing on principle',
  'a mirror he has turned to the wall, twice',
  'a boot that is being repaired indefinitely',
  'a photograph of somebody who did well',
  'a bell he has never rung',
  'a window that does not open, which suits him',
];

const VIRTUE = ['generosity', 'restraint', 'humility', 'forgiveness', 'patience', 'honesty', 'discretion', 'plain dealing'];

const AILMENT = [
  'a fever',
  'a cough',
  'a pain he has named',
  'the liver',
  'nerves',
  'a headache with a theory',
  'a weakness of the chest',
  'something the doctor called nothing',
];

const pick = <T,>(list: T[], r: () => number) => list[Math.floor(r() * list.length) % list.length];

// ---------------------------------------------------------------- templates

type Make = (r: () => number) => [string, string];

interface Template {
  kind: Kind;
  make: Make;
}

/**
 * Fifty mechanisms.
 *
 * Every one of them turns on the same hinge — the gap between what a man did
 * and the account he is already composing of it — and each finds a different
 * way through. The vocabulary changes the specifics; the mechanism is what
 * makes it a joke. Every template takes at least one slot, because a template
 * with none can only ever be one joke, and forty of those is forty jokes and
 * nine hundred and sixty repeats.
 */
const T: Template[] = [
  { kind: 'charity', make: (r) => [
    `He gave away ${pick(SUM, r)}, ${pick(PLACE, r)}, this morning, which is more than he had.`,
    'He followed the man for six streets to see what he would spend it on.',
  ] },
  { kind: 'charity', make: (r) => [
    `He has decided to be known for his ${pick(VIRTUE, r)}.`,
    `The difficulty is being seen at it, ${pick(PLACE, r)}, without appearing to arrange anything.`,
  ] },
  { kind: 'charity', make: (r) => [
    `He gave ${pick(OTHER, r)} ${pick(SUM, r)}, and refused all thanks.`,
    'He refused them at some length, and in a carrying voice.',
  ] },
  { kind: 'confession', make: (r) => [
    `He confessed everything to ${pick(OTHER, r)}, at length, and left nothing out.`,
    'He is now waiting to be told how brave that was.',
  ] },
  { kind: 'confession', make: (r) => [
    `He has written a full account of his worst act, composed over ${pick(SPAN, r)}.`,
    'He has revised it eleven times, and it is getting better.',
  ] },
  { kind: 'confession', make: (r) => [
    `He told ${pick(OTHER, r)} the truth about himself, which took an hour.`,
    'The other said "ah" and asked about the weather, and that was the real punishment.',
  ] },
  { kind: 'confession', make: (r) => [
    `He has stopped lying entirely, as of ${pick(SINCE, r)}.`,
    'He now tells the truth in a tone that makes it worse.',
  ] },
  { kind: 'confession', make: (r) => [
    `He apologised to ${pick(OTHER, r)} for something they had not noticed.`,
    'They have noticed now, and he has made an enemy honestly.',
  ] },
  { kind: 'slight', make: (r) => [
    `${cap(pick(OTHER, r))} ${pick(SLIGHT, r)}, ${pick(PLACE, r)}, in April.`,
    `He has been composing the reply for ${pick(SPAN, r)}.`,
  ] },
  { kind: 'slight', make: (r) => [
    `He has decided not to step aside for ${pick(OTHER, r)} the next time they pass ${pick(PLACE, r)}.`,
    'He has been deciding this for two years and they have not passed once.',
  ] },
  { kind: 'slight', make: (r) => [
    `The insult was so small that describing it takes ${pick(SPAN, r)}.`,
    'He has begun describing it.',
  ] },
  { kind: 'slight', make: (r) => [
    `He was thanked, ${pick(PLACE, r)}, in front of two people.`,
    `He has spent ${pick(SPAN, r)} examining the thanks for irony.`,
  ] },
  { kind: 'slight', make: (r) => [
    `${cap(pick(OTHER, r))} ${pick(SLIGHT, r)}.`,
    'It has become the organising principle of his week.',
  ] },
  { kind: 'pride', make: (r) => [
    `He was not invited to ${pick(HOST, r)}’s, and he would not have gone.`,
    'He has prepared remarks explaining that he would not have gone.',
  ] },
  { kind: 'pride', make: (r) => [
    `He refused ${pick(SUM, r)}, from ${pick(OTHER, r)}, on a point of principle.`,
    'The principle is that it was offered kindly.',
  ] },
  { kind: 'pride', make: (r) => [
    `He has resolved to say nothing about it to anybody, for ${pick(SPAN, r)}.`,
    'He has told four people about the resolution.',
  ] },
  { kind: 'pride', make: (r) => [
    `He is the only honest man he knows, which he mentions ${pick(PLACE, r)}.`,
    'The honesty is chiefly about other people.',
  ] },
  { kind: 'pride', make: (r) => [
    `He sold ${pick(OBJECT, r)}, rather than ask ${pick(OTHER, r)} for anything.`,
    'He has arranged for this to come up.',
  ] },
  { kind: 'pride', make: (r) => [
    `He has been in the room for ${pick(SPAN, r)}, with ${pick(OBJECT, r)}.`,
    'He is not unhappy; he is furnished.',
  ] },
  { kind: 'pride', make: (r) => [
    `His ${pick(VIRTUE, r)} has gone unremarked for ${pick(SPAN, r)}.`,
    'He is keeping a record, in case anybody asks, and nobody will.',
  ] },
  { kind: 'debt', make: (r) => [
    `He owes ${pick(OTHER, r)} ${pick(SUM, r)}.`,
    'The debt is the closest relationship in his life and he is not sure he wants it settled.',
  ] },
  { kind: 'debt', make: (r) => [
    `He forgave a debt of ${pick(SUM, r)}, in 1849.`,
    'He mentions it the way other men mention the weather, and about as often.',
  ] },
  { kind: 'debt', make: (r) => [
    `He has repaid ${pick(SUM, r)}, and expects to be thanked.`,
    'It was his own money and he was late.',
  ] },
  { kind: 'debt', make: (r) => [
    `${cap(pick(OTHER, r))} has offered to help him, kindly and without conditions.`,
    'This is the worst thing that has happened to him this year.',
  ] },
  { kind: 'debt', make: (r) => [
    `He has pawned ${pick(OBJECT, r)}, for ${pick(SUM, r)}.`,
    'He goes to look at it on Sundays, which the pawnbroker permits.',
  ] },
  { kind: 'paperwork', make: (r) => [
    `The form requires him to state his reason, ${pick(PLACE, r)}, by Friday.`,
    'There is a box for it. The box is nine millimetres.',
  ] },
  { kind: 'paperwork', make: (r) => [
    `He has been copying the same document for ${pick(SPAN, r)}.`,
    'He has begun to feel it is about him, and to resent the punctuation.',
  ] },
  { kind: 'paperwork', make: (r) => [
    `A department has written to say his petition has been received by another department.`,
    `Both are one floor apart and have not spoken in ${pick(SPAN, r)}.`,
  ] },
  { kind: 'paperwork', make: (r) => [
    `His rank entitles him to ${pick(OBJECT, r)}.`,
    'He has measured it and finds it insufficient to the rank.',
  ] },
  { kind: 'paperwork', make: (r) => [
    `He has been promoted half a grade, ahead of ${pick(OTHER, r)}.`,
    'He is now senior to nobody and junior to everybody, in writing.',
  ] },
  { kind: 'god', make: (r) => [
    `If there is no God, he says, then everything is permitted.`,
    `Including, he adds bitterly, being seated near the door ${pick(PLACE, r)}.`,
  ] },
  { kind: 'god', make: (r) => [
    'He has settled the question of the immortality of the soul.',
    `He settled it at a table with ${pick(OTHER, r)}, who had gone home.`,
  ] },
  { kind: 'god', make: (r) => [
    `He would forgive God, he says, if it were asked of him properly.`,
    `He has rehearsed the scene for ${pick(SPAN, r)}, and in it he is very gracious.`,
  ] },
  { kind: 'god', make: (r) => [
    'Suffering, he explains, is the only door to the truth.',
    `He has been standing at the door for ${pick(SPAN, r)}, describing it to passers-by.`,
  ] },
  { kind: 'god', make: (r) => [
    `He prayed, once, in earnest, ${pick(PLACE, r)}, and something happened.`,
    'He has spent the years since establishing that it was a coincidence.',
  ] },
  { kind: 'illness', make: (r) => [
    `He has ${pick(AILMENT, r)} and will not see the doctor.`,
    'He is keeping it for later, when it can mean something.',
  ] },
  { kind: 'illness', make: (r) => [
    `The doctor says it is ${pick(AILMENT, r)} and will pass.`,
    'He has changed doctors.',
  ] },
  { kind: 'illness', make: (r) => [
    `He is dying, he thinks, and has been for ${pick(SPAN, r)}.`,
    'It is the only appointment he has kept.',
  ] },
  { kind: 'illness', make: (r) => [
    `He has given up tea, which was the last thing, and told ${pick(OTHER, r)} nothing.`,
    'He is waiting to be asked why, and the question is not coming.',
  ] },
  { kind: 'illness', make: (r) => [
    `He described ${pick(AILMENT, r)} for twenty minutes, to ${pick(OTHER, r)}.`,
    'He is aware that this was the illness.',
  ] },
  { kind: 'party', make: (r) => [
    `He arrived determined to be gracious to ${pick(OTHER, r)}.`,
    'By the door he had already begun the speech that would ruin it.',
  ] },
  { kind: 'party', make: (r) => [
    `He stood in the doorway for a full minute deciding on an expression.`,
    `Nobody had looked up. He has taken the silence as a verdict, and is appealing it ${pick(PLACE, r)}.`,
  ] },
  { kind: 'party', make: (r) => [
    `He left ${pick(HOST, r)}’s early, with dignity, and rehearsed the exit on the stairs.`,
    'Then he came back for his hat.',
  ] },
  { kind: 'party', make: (r) => [
    `He was seated beside ${pick(OTHER, r)} at dinner.`,
    'He conducted the entire conversation afterwards, alone, and won it.',
  ] },
  { kind: 'party', make: (r) => [
    `He has an anecdote about ${pick(OTHER, r)} which is very good.`,
    `He has been holding it for ${pick(SPAN, r)}, waiting for the conversation that would need it.`,
  ] },
  { kind: 'letter', make: (r) => [
    `He has written to ${pick(OTHER, r)}, finally, and said all of it.`,
    'The letter is in the drawer with the others, which is where the said things live.',
  ] },
  { kind: 'letter', make: (r) => [
    `The letter is four pages and the last line is the only true one.`,
    `He has decided to cut the last line, after considering it for ${pick(SPAN, r)}.`,
  ] },
  { kind: 'letter', make: (r) => [
    `He has burnt the letter to ${pick(OTHER, r)}, which felt final.`,
    'He remembers all of it and can burn it again tomorrow.',
  ] },
  { kind: 'letter', make: (r) => [
    `He has replied to a letter from ${pick(OTHER, r)} that was warm and short.`,
    'His reply is fourteen pages and begins by explaining the delay.',
  ] },
  { kind: 'letter', make: (r) => [
    `He is owed a letter by ${pick(OTHER, r)}, overdue by ${pick(SPAN, r)}.`,
    'He has drafted the forgiving reply and is holding it against them.',
  ] },
  { kind: 'stairs', make: (r) => [
    `He met ${pick(OTHER, r)} on the stairs and said nothing at all.`,
    'On the landing he thought of the thing to say, which is what the landing is for.',
  ] },
  { kind: 'stairs', make: (r) => [
    `He passes the door where it happened twice a day, for ${pick(SPAN, r)}.`,
    'He has started going round, which takes eleven minutes and proves something.',
  ] },
  { kind: 'stairs', make: (r) => [
    `He climbed four flights to apologise to ${pick(OTHER, r)}.`,
    'He apologised for the wrong thing, which he noticed on the way down.',
  ] },
  { kind: 'stairs', make: (r) => [
    `He has begun to nod to ${pick(OTHER, r)}.`,
    'They have always nodded, and this is now a defeat.',
  ] },
  { kind: 'funeral', make: (r) => [
    `At the graveside he thought of something funny.`,
    `He has not forgiven himself in ${pick(SPAN, r)}, which is at least an activity.`,
  ] },
  { kind: 'funeral', make: (r) => [
    `He wept at the funeral of ${pick(OTHER, r)}, whom he disliked.`,
    'He was moved by his own weeping, and stayed for the second service.',
  ] },
  { kind: 'funeral', make: (r) => [
    `He has planned his own funeral in detail, ${pick(PLACE, r)}, on paper.`,
    'The detail is chiefly about who will be sorry, and how sorry.',
  ] },
  { kind: 'funeral', make: (r) => [
    `He carried the coffin of ${pick(OTHER, r)}, and thought about his grip.`,
    'He thinks his grip was noticed, and that it was good.',
  ] },
];

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * A thousand of them, deterministic and unique.
 *
 * The mechanism is chosen by the index and the vocabulary by the seed, so
 * consecutive panels are never the same joke twice running — and the whole set
 * is deduplicated on the finished text, because a grammar with forty templates
 * and seven-word lists will collide long before it reaches a thousand and the
 * only honest way to find out is to check.
 */
export function jokes(count: number, seed = 7): Joke[] {
  const out: Joke[] = [];
  const seen = new Set<string>();
  let i = 0;
  let guard = 0;
  while (out.length < count && guard++ < count * 40) {
    const t = T[i % T.length];
    const r = rng(seed * 7919 + i * 104729);
    const [setup, turn] = t.make(r);
    const key = setup + '|' + turn;
    i++;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ setup, turn, kind: t.kind, seed: seed * 31 + i });
  }
  return out;
}

/** How many distinct jokes this grammar can actually make. */
export function capacity(): number {
  return jokes(4000, 7).length;
}
