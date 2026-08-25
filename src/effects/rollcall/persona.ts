import { cat, dial, mulberry, type Genome } from './genome';

/**
 * Who this is.
 *
 * The persona is read off the genome rather than rolled alongside it, so the
 * description and the drawing can never contradict each other. A face with a
 * monocle is not described as the one who lost his glasses; the monocle is why
 * he is described the way he is. Everything below reads the same genes the
 * drawing code reads.
 */

const FIRST = [
  'Anil', 'Sunita', 'Ravi', 'Meena', 'Deepak', 'Kavita', 'Sanjay', 'Rekha', 'Arun', 'Shalini',
  'Vikram', 'Nisha', 'Rajesh', 'Anita', 'Manoj', 'Poonam', 'Sandeep', 'Geeta', 'Ashok', 'Priya',
  'Naveen', 'Seema', 'Rohit', 'Asha', 'Vinod', 'Neha', 'Suresh', 'Jyoti', 'Pankaj', 'Ruchi',
  'Amit', 'Sarita', 'Girish', 'Madhu', 'Alok', 'Kiran', 'Prakash', 'Veena', 'Tarun', 'Usha',
  'Mahesh', 'Bhavna', 'Nitin', 'Lata', 'Devendra', 'Sudha', 'Yogesh', 'Sneha', 'Hemant', 'Chitra',
];

const LAST = [
  'Sharma', 'Verma', 'Gupta', 'Nair', 'Iyer', 'Reddy', 'Banerjee', 'Chatterjee', 'Pillai', 'Menon',
  'Joshi', 'Kulkarni', 'Deshpande', 'Rao', 'Bose', 'Dutta', 'Mishra', 'Tiwari', 'Pandey', 'Saxena',
  'Chauhan', 'Rathore', 'Bhatt', 'Trivedi', 'Kapoor', 'Malhotra', 'Sethi', 'Ahuja', 'Grover', 'Bakshi',
];

/** A nickname, the kind a class actually uses. */
const HANDLE = [
  'Chashma', 'Lambu', 'Chhotu', 'Motu', 'Doctor', 'Professor', 'Pehelwan', 'Kabootar',
  'Guru', 'Bhai', 'Chief', 'Master', 'Ustad', 'Pandit', 'Chacha', 'Bandar',
];

/** Same clamp as the drawing code: a gene of exactly 1.0 must not run off the end. */
const pick = <T,>(arr: T[], t: number): T =>
  arr[Math.min(arr.length - 1, Math.floor(t * arr.length))];

export interface Persona {
  roll: number;
  name: string;
  handle: string;
  /** The line under the name on the register. */
  note: string;
  /** Three short trait words, for the card. */
  traits: string[];
}

/** The most telling thing about a face, in the order a person would notice it. */
function headline(gn: Genome): { trait: string; note: string } {
  const specs = cat(gn, 'specs');
  const beard = cat(gn, 'beard');
  const hair = cat(gn, 'hair');
  const extra = cat(gn, 'extra');
  const eye = cat(gn, 'eye');
  const mouth = cat(gn, 'mouth');
  const view = cat(gn, 'view');

  if (extra === 1)
    return { trait: 'smoker', note: 'Caught behind the science block twice. Denies both.' };
  if (extra === 2)
    return { trait: 'walking wounded', note: 'The plaster changes position weekly. Nobody asks any more.' };
  if (specs === 5)
    return { trait: 'monocle', note: 'Owns one lens and the confidence of a man who owns two.' };
  if (specs === 3)
    return { trait: 'half-moons', note: 'Reads over the top of them, which is the entire point.' };
  if (beard === 4)
    return { trait: 'full beard', note: 'Grew it in one term and has been asked for identification ever since.' };
  if (beard === 2)
    return { trait: 'curled moustache', note: 'Twirls it during tests. Believes this helps.' };
  if (hair === 6)
    return { trait: 'unbrushed', note: 'Arrives looking as though the bus was open at the top.' };
  if (hair === 1)
    return { trait: 'spikes', note: 'A whole tin of gel and a great deal of optimism.' };
  if (hair === 0)
    return { trait: 'shaved', note: 'Lost a bet in the second week and never grew it back.' };
  if (eye === 4)
    return { trait: 'eyes shut', note: 'Present in the register, absent in every other sense.' };
  if (eye === 3)
    return { trait: 'square eyes', note: 'Sat too close to the television for eleven years.' };
  if (view !== 0)
    return { trait: 'never faces front', note: 'Photographed forty times and side-on in all of them.' };
  if (mouth === 6)
    return { trait: 'says nothing', note: 'Has not volunteered an answer since the fourth standard.' };
  if (mouth === 3)
    return { trait: 'grins', note: 'Cheerful in a way the staff find faintly suspicious.' };
  return { trait: 'unremarkable', note: 'Sits in the middle row and gets away with everything.' };
}

const TRAIT_WORDS: Record<string, string[]> = {
  head: ['long-headed', 'heavy-jawed', 'top-heavy', 'sharp-faced', 'square', 'tall', 'wide'],
  eye: ['beady', 'round-eyed', 'wide', 'boxy', 'sleepy', 'hooded', 'staring'],
  mouth: ['flat-mouthed', 'smiling', 'open-mouthed', 'toothy', 'tight-lipped', 'crooked', 'silent', 'lopsided'],
  brow: ['browless', 'level', 'cross', 'surprised', 'knitted'],
};

export function personaFor(gn: Genome, index: number): Persona {
  const r = mulberry((index + 1) * 2654435761);
  const first = pick(FIRST, dial(gn, 'skin'));
  const last = pick(LAST, dial(gn, 'headLump'));
  const handle = pick(HANDLE, dial(gn, 'mouthWidth'));
  const h = headline(gn);

  const traits = [
    TRAIT_WORDS.head[cat(gn, 'head')],
    TRAIT_WORDS.eye[cat(gn, 'eye')],
    TRAIT_WORDS.mouth[cat(gn, 'mouth')],
  ];
  if (h.trait !== 'unremarkable') traits[2] = h.trait;
  void r;

  return {
    roll: index + 1,
    name: `${first} ${last}`,
    handle,
    note: h.note,
    traits,
  };
}
