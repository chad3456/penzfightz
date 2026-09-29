/**
 * "Ghost Days" as a sequence of beats. The narration is ours — a retelling
 * and a reading, never the story's own sentences; the only words quoted are
 * from The Cloud of Unknowing, a fourteenth-century English text in the
 * public domain, which one of the characters is reading.
 *
 * Each beat is a stretch of scroll (`len`, in screen heights) over which the
 * camera travels `u` of its scene. A gate beat stops the scroll until the
 * player has done the thing.
 */

export type Mark = 'patina' | 'zi' | 'initials' | 'alien' | 'gleam';

export type Beat = { scene: number; u: [number, number]; len: number } & (
  | { kind: 'title' }
  | { kind: 'text'; text: string; tone?: 'narrator' | 'margin' | 'quote' | 'code'; cite?: string; gives?: Mark }
  | { kind: 'rub'; prompt: string; coins: ('gold' | 'old')[]; done: string; gives?: Mark }
  | { kind: 'hold'; lines: { who: string; said: string; unsaid: string; reply?: string }[]; prompt: string }
  | { kind: 'trace'; glyph: 'zi' | 'initials' | 'crown'; prompt: string; done: string; gives?: Mark }
  | { kind: 'choice'; key: 'authentic' | 'keep'; q: string; a: [string, string]; notes: [string, string] }
  | { kind: 'end' }
);

export interface Era { stack: string[]; place: string; year: string; fade: string }

/** Scenes, in order: what the call stack reads, and how each one ends. */
export const ERAS: Era[] = [
  { stack: ['(fib 3)'], place: 'Nova Pacifica', year: '2313', fade: '#e8c56a' },
  { stack: ['(fib 3)', '(fib 2)'], place: 'East Norbury, Connecticut', year: '1989', fade: '#e8c56a' },
  { stack: ['(fib 3)', '(fib 2)', '(fib 1)'], place: 'Hong Kong', year: '1905', fade: '#f1e6d6' },
  { stack: ['(fib 3)', '(fib 2)'], place: 'East Norbury, Connecticut', year: '1989', fade: '#efe0cf' },
  { stack: ['(fib 3)'], place: 'Nova Pacifica', year: '2313', fade: '#ffffff' },
  { stack: ['(fib 3)'], place: 'Nova Pacifica', year: '2313', fade: '#f3f2e6' },
];

export const BEATS: Beat[] = [
  { scene: 0, u: [0, 0.02], len: 1.2, kind: 'title' },

  // ── 3 · Nova Pacifica, 2313 ──
  { scene: 0, u: [0.02, 0.1], len: 1.1, kind: 'text', text: 'Nova Pacifica, 2313. A colony ship came through a wormhole and could never go back. The planet is hot and its air is poison. The adults live under a Dome, breathing the air of a world none of them will see again.' },
  { scene: 0, u: [0.1, 0.18], len: 1.1, kind: 'text', text: 'Their children were designed for this place instead: scales, six-lobed lungs, blood borrowed from the local animals. Outside the Dome, the children take off their helmets and breathe.' },
  { scene: 0, u: [0.18, 0.26], len: 1.2, kind: 'text', tone: 'code', text: '(define (fib n)\n  (if (< n 2) 1\n      (+ (fib (- n 1)) (fib (- n 2)))))', cite: 'On the classroom board: a function that solves itself by calling smaller, earlier versions of itself.' },
  { scene: 0, u: [0.26, 0.34], len: 1.1, kind: 'text', text: 'You are Ona. The Teacher says you must know where you came from. You say you came from a vat, grown in a nursery with the poison air piped in, and that the dead aliens of this planet are more like you than she is.' },
  { scene: 0, u: [0.34, 0.4], len: 1, kind: 'text', tone: 'margin', text: 'What is an inheritance you cannot use? A language nobody speaks, a sky you will never stand under, a dress you would freeze in.' },
  { scene: 0, u: [0.4, 0.5], len: 1.1, kind: 'text', text: 'It is the Day of Remembrance. Every child must present an heirloom from Earth, in costume. You were lent a small green metal thing shaped like a spade, which belongs to your Teacher. At lunch, furious, you threw it into the whitewood forest.' },
  { scene: 0, u: [0.5, 0.62], len: 1.1, kind: 'text', text: 'The forest grows over the ruins of the people who lived here first, dead for thousands of years. The Teachers have never been curious about them. Go and find the spade.' },
  { scene: 0, u: [0.62, 0.9], len: 1.4, kind: 'text', text: 'There, on a heap of old rubble, with steam hissing up beneath it. The heat has eaten through the green crust in one place, and something bright shows underneath.' },
  { scene: 0, u: [0.9, 0.93], len: 1, kind: 'rub', prompt: 'Rub away the patina.', coins: ['gold'], gives: 'patina', done: 'Gold under the green, and marks cut into the crust in layers: a written character you cannot read, two scratched letters. Someone wrote on this, and then someone else. A strange sweet smell rises with the steam. You breathe it in —' },
  { scene: 0, u: [0.93, 1], len: 1, kind: 'text', tone: 'margin', text: 'To compute the third term, the function must first call the second. Down the stack.' },

  // ── 2 · East Norbury, Connecticut, 1989 ──
  { scene: 1, u: [0, 0.1], len: 1.1, kind: 'text', text: '— and the spade is warm in another pocket, three hundred years earlier. Halloween, 1989, a small town on the Connecticut shore.' },
  { scene: 1, u: [0.1, 0.2], len: 1.2, kind: 'text', text: 'Fred Ho came here as a boy, smuggled from China by boat, truck and ship, hidden in vans, handed a new name and told never to talk to the police. His parents run the only Chinese restaurant in town. He is the only student whose first language is not English.' },
  { scene: 1, u: [0.2, 0.3], len: 1.1, kind: 'text', text: 'Tonight he is at the dance with Carrie, in a rubber Reagan mask from the dollar store and his father\'s only suit; she came as Nancy. Behind a mask, nobody stares at him. He wishes it could be Halloween every day.' },
  { scene: 1, u: [0.3, 0.38], len: 1, kind: 'text', tone: 'margin', text: 'A mask hides a face. It also lets the face underneath stop performing.' },
  { scene: 1, u: [0.38, 0.58], len: 1.1, kind: 'text', text: 'Afterwards, dinner at her parents\': a white house over the sea, with a jack-o\'-lantern on the step. An American castle.' },
  {
    scene: 1, u: [0.58, 0.66], len: 1, kind: 'hold', prompt: 'Hold to look under the mask.',
    lines: [
      { who: 'Carrie\'s mother', said: 'Your English is so good!', unsaid: 'Why is everyone always surprised?', reply: 'Fred says: "Thank you."' },
      { who: 'Carrie\'s father', said: 'Your parents were dissidents, weren\'t they? Like those brave students in Tiananmen Square.', unsaid: 'His father called the students spoiled fools. The dissident story is one the family memorised so they could apply for asylum and stay.', reply: 'Fred says: "Yes. That\'s why we came."' },
      { who: 'Carrie\'s father, his friendly face slipping', said: 'She\'s going through a phase. You\'re part of how she rebels against me. People belong with their own kind.', unsaid: 'For a moment the man\'s face looks exactly like his own father\'s.', reply: 'Fred says nothing.' },
    ],
  },
  { scene: 1, u: [0.66, 0.84], len: 1.2, kind: 'text', text: 'In his pocket his fingers close round the little bronze spade: his grandfather\'s, meant as a present for Carrie. He imagines throwing it at the man\'s face. Instead he says it is late, and he should go.' },
  { scene: 1, u: [0.84, 1], len: 1.2, kind: 'text', text: 'His grandfather said it was saved, long ago, from foreigners who wanted to carry it away. His father says it is a fake. Go down into it.' },

  // ── 1 · Hong Kong, 1905 ──
  { scene: 2, u: [0, 0.12], len: 1.2, kind: 'text', text: 'Hong Kong, 1905: Yu Lan, the Hungry Ghost Festival, when the gates of the underworld open and the dead walk. Paper houses, paper cars and paper money will be burned for the ancestors; the street smells of smoke and incense.' },
  { scene: 2, u: [0.12, 0.24], len: 1.2, kind: 'text', text: 'William is home after ten years at school in England, though his father still calls him Jyu-zung. He blocks his ears against the Cantonese, glues paper headlights onto a paper car for his dead grandfather, and thinks his father might as well be an alien.' },
  { scene: 2, u: [0.24, 0.32], len: 1, kind: 'text', tone: 'quote', text: 'For He may wel be loved, bot not thought.', cite: 'The Cloud of Unknowing, 14th century: the book he is reading, a parting gift from a girl in England' },
  { scene: 2, u: [0.32, 0.5], len: 1.2, kind: 'text', text: 'Sent to fetch the good table from the warehouse, he finds two ancient bronze spade coins on his father\'s workbench. They are Zhou-dynasty bubi, made in the shape of a spade to honour the earth, and they are a matched pair: rare. Too rare.' },
  { scene: 2, u: [0.5, 0.56], len: 1, kind: 'rub', prompt: 'Rub both coins. Which is old?', coins: ['old', 'gold'], done: 'One is dark to the core. Under the other\'s crust the bronze is bright yellow, and bronze only shines like that when it has just been cast. Beside them: a dish of coppery blue powder, and a brush.' },
  { scene: 2, u: [0.56, 0.62], len: 1, kind: 'text', tone: 'margin', text: 'Mock duck, paper money, paper cars, he thinks; and now forged bronzes. A whole culture of imitation.' },
  { scene: 2, u: [0.62, 0.68], len: 1.1, kind: 'text', text: 'At the altar his father turns the coins over. Collectors carve their own reading of the old script into the patina, he says, layer on layer. And he points out that the character for the universe, the first syllable of his son\'s name, is nearly the same as the character for writing.' },
  { scene: 2, u: [0.68, 0.72], len: 1, kind: 'trace', glyph: 'zi', prompt: '宇 is the universe. 字 is writing. Draw the stroke that turns one into the other.', gives: 'zi', done: 'The universe is plain; to put it into words takes a twist, a sharp turn. Between the World and the Word lies one extra curve.' },
  { scene: 2, u: [0.72, 0.78], len: 1.2, kind: 'text', text: '"You are a forger!" His father answers without looking at him. For years foreigners, gwailou (the word also means ghosts), have brought him treasures looted from the Summer Palace to restore. He gives them back copies and keeps the originals for this land, and for his son. The true and the false carry different characters.' },
  { scene: 2, u: [0.78, 0.8], len: 1, kind: 'text', tone: 'margin', text: 'Is a copy that keeps faith truer than an original in the wrong hands?' },
  {
    scene: 2, u: [0.8, 0.86], len: 1, kind: 'hold', prompt: 'Hold to look under the mask.',
    lines: [
      { who: 'Mr. Dixon, with two men from the docks', said: 'Your English is very good. Almost no accent.', unsaid: 'Ten years of an English school, and to this man he is still a monkey doing a trick.', reply: 'William lets his face go blank, and knows it is now his father\'s face: calm over helpless rage.' },
    ],
  },
  { scene: 2, u: [0.86, 0.93], len: 1.2, kind: 'text', text: 'Father and son move together. The feast goes to the floor, and William ends up kneeling on the Englishman, a bronze spade raised. "Get out of our house." And his father says, for the first time William can remember, that he is proud of him. Through tears the characters on the two coins blur into one.' },
  { scene: 2, u: [0.93, 0.97], len: 1, kind: 'text', tone: 'code', text: '(fib 1) → 1', cite: 'The base case: no further back to go. Now the calls begin to return.' },
  { scene: 2, u: [0.97, 1], len: 1, kind: 'choice', key: 'authentic', q: 'Which is more authentic?', a: ['The World: the thing itself', 'The Word: the story carved on it'], notes: ['You held to the World: the bronze, whatever anyone wrote on it.', 'You held to the Word: the marks we cut into things, which are how we understand them.'] },

  // ── 2 · East Norbury, 1989 (return) ──
  { scene: 3, u: [0, 0.14], len: 1.2, kind: 'text', text: 'The beach below the Wynnes\' house. Across the bay, a mansion lit red as a haunted house for the week, and the screams of delighted children.' },
  { scene: 3, u: [0.14, 0.28], len: 1.2, kind: 'text', text: 'Carrie tells him not to mind her father. He is not his parents, she says, and she is not hers: family is the story other people hand you, but the one that counts is the one you write for yourself.' },
  { scene: 3, u: [0.28, 0.4], len: 1.2, kind: 'text', text: 'He gives her the coin and tells her the truth about it: his grandfather\'s, rescued once from foreigners, nearly smashed in the Cultural Revolution, called a fake by his father. It is the only thing he has of the old man, who died last year when they could not go back.' },
  { scene: 3, u: [0.4, 0.45], len: 1, kind: 'trace', glyph: 'initials', prompt: 'Scratch their initials into the patina, beside the old character.', gives: 'initials', done: 'Now it carries their story too.' },
  { scene: 3, u: [0.45, 0.7], len: 1.3, kind: 'text', text: 'Then he takes off the mask and the suit and runs into the cold sea, and swims for the far lights through a glow of jellyfish, like swimming through stars. It tastes of salt, of hope, and of the sting of leaving the past behind.' },
  { scene: 3, u: [0.7, 0.86], len: 1.1, kind: 'text', tone: 'margin', text: 'What he loves about America is its faith that the past is only a story, and that even a story which began as a lie can become true.' },
  { scene: 3, u: [0.86, 1], len: 1, kind: 'choice', key: 'keep', q: 'What would you hand on?', a: ['The true object', 'The better story'], notes: ['You would hand on the true object, and trust its marks to speak.', 'You would hand on the better story, and trust it to become true.'] },

  // ── 3 · Nova Pacifica, 2313 (return) ──
  { scene: 4, u: [0, 0.16], len: 1.2, kind: 'text', text: 'Ona wakes in a street she has never seen. Six-sided towers stand as close as the trunks of the whitewood grove. Vehicles dart past like fish. And the people: six legs, a low body, twelve tentacles on the head, each ending in a black eye.' },
  { scene: 4, u: [0.16, 0.32], len: 1.1, kind: 'text', text: 'They walk through her as if she were the ghost. Signs of angular writing flutter overhead, and the noise of the crowd sounds like a language.' },
  { scene: 4, u: [0.32, 0.5], len: 1.2, kind: 'text', text: 'Then everything stops. The crowd turns its thousands of eyes up to the sun, which is swelling. Parents fold their arms round their children. Two lovers lean together.' },
  { scene: 4, u: [0.5, 0.66], len: 1.1, kind: 'text', text: 'Then they turn, and all of them look at her. They can see her now.' },
  { scene: 4, u: [0.66, 0.82], len: 1.2, kind: 'text', text: 'A small one, about her size, comes forward and puts the spade in her hand. There is a new mark on it, all sharp angles and hooks, like the writing on the signs. A thought arrives without any words: keep us.', gives: 'alien' },
  { scene: 4, u: [0.82, 1], len: 1.3, kind: 'text', tone: 'margin', text: 'The sun grows until there is nothing but light.' },

  // ── 3 · the meadow ──
  { scene: 5, u: [0, 0.14], len: 1.2, kind: 'text', text: 'She is under the whitewood again with the spade in her fist. Steam rises from every mound: each one, perhaps, another window.' },
  { scene: 5, u: [0.14, 0.28], len: 1.3, kind: 'text', text: 'Their sun was dying. So the first people wrote themselves into every living thing that might outlast them, their six-fold symmetry in leaf and wing and trunk. They hid a record in their ruins that would play only for someone holding a thing that was made, aged and layered, and kept because someone loved it.' },
  { scene: 5, u: [0.28, 0.4], len: 1.3, kind: 'text', text: 'And now she understands the Teachers. It was never arrogance; it was fear. They are stranded somewhere they cannot live, and they know they will give way to a new people and survive only as memory. Parents are afraid of being forgotten by their children.' },
  { scene: 5, u: [0.4, 0.46], len: 1, kind: 'trace', glyph: 'crown', prompt: 'Weave her a crown: twelve branches, like tentacles, like hair, like olive branches.', gives: 'gleam', done: 'Now she has her costume.' },
  { scene: 5, u: [0.46, 0.62], len: 1.2, kind: 'text', text: 'Inside her, like calls nested in a function, are the girl written in Earth\'s code and the girl grown from this planet\'s blood, the rebel and the good pupil, and every generation before them, all the way back.' },
  { scene: 5, u: [0.62, 0.78], len: 1.2, kind: 'text', tone: 'margin', text: 'Digging into the past is not worship, and it is not a chore. It is how we make sense of the universe, one layer of patina at a time.' },
  { scene: 5, u: [0.78, 1], len: 1.6, kind: 'end' },
];
