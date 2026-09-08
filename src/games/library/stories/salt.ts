import type { SceneSpec } from '../kit/scene';
import type { Story } from '../story';

/**
 * "The Salt Index" — an original story.
 *
 * Ken Liu is alive and his work is in copyright, so nothing of his is adapted
 * here and nothing here is his. What this is instead is a piece written in the
 * territory he works in — a language going under, a machine that keeps
 * something of a person, and the question of what translation costs the thing
 * translated — and it is credited as an original on the shelf card so nobody
 * is misled about whose it is.
 */

const coast = (extra: SceneSpec['props'] = []): SceneSpec => ({
  palette: 'paper',
  ground: { radius: 8.4, thickness: 3.4, dish: 0.4, lip: 1.0, bumps: 0.36, slot: 'rock' },
  cover: { radius: 8.0, thickness: 1.0, dish: 0.4, lip: 1.0, bumps: 0.36, slot: 'grass' },
  grass: { count: 900, radius: 7.4, inner: 1.4 },
  flowers: { count: 90, radius: 6.8, inner: 2.0 },
  // Just under the island's skirt. Any lower and the rim of the ground hides
  // it completely, which on a story about a coast is not a small loss.
  water: { y: -1.2, radius: 90 },
  clouds: true,
  props: [
    { prop: 'crag', args: [3, 1.5], at: [-6.2, -2.4], sink: 0.6 },
    { prop: 'crag', args: [19, 1.2], at: [5.8, -3.6], sink: 0.5 },
    { prop: 'boulder', args: [31, 0.9], at: [4.4, 3.6], sink: 0.35 },
    ...extra,
  ],
  camera: { from: [7.0, 5.0, 8.8], look: [-0.2, 1.0, -0.4], fov: 35 },
  drift: 0.07,
});

const workshop = (extra: SceneSpec['props'] = []): SceneSpec => ({
  palette: 'paper',
  room: { w: 7.4, d: 7.2, h: 3.2, wall: 'stone', floor: 'timber', ceiling: true, seed: 5 },
  props: [
    { prop: 'window', args: [2.0, 1.8, 1.2], at: [0, -3.5], look: 'The sea, doing what it does, at the far end of the room.' },
    { prop: 'table', args: [2.2, 0.78, 1.0], at: [-0.4, -0.6] },
    { prop: 'stool', args: [0.5], at: [-0.4, 0.7] },
    { prop: 'shelfOfBooks', args: [1.8, 4], at: [-3.4, 1.6, -1.2], turn: Math.PI / 2 },
    { prop: 'shelfOfBooks', args: [1.8, 9], at: [-3.4, 2.3, 1.4], turn: Math.PI / 2 },
    { prop: 'crate', args: [0.6], at: [2.7, 1.8] },
    ...extra,
  ],
  camera: { from: [3.4, 2.4, 5.2], look: [-0.3, 1.1, -1.4], fov: 40 },
  drift: 0.03,
});

export const SALT: Story = {
  id: 'salt',
  title: 'The Salt Index',
  author: 'An original story',
  source: 'Written for this shelf. Not an adaptation of anybody.',
  blurb:
    'A language with eleven speakers left, a machine that folds paper into the shape of a sentence, and a daughter deciding what a thing is worth once it has been made portable.',
  spine: '#2f7f8a',
  ink: '#48b7c4',
  start: 'shore',
  nodes: [
    {
      id: 'shore',
      scene: coast([
        { prop: 'figure', args: ['stand', 1.66, 2], at: [0.4, 1.6], turn: 0.3, look: 'Me. Nineteen, and back for the summer, and not pleased about it.' },
        { prop: 'tree', args: [12, 3.0, 1.3], at: [-3.4, -1.4] },
        { prop: 'bush', args: [7, 0.7], at: [2.6, 2.2] },
      ]),
      text: [
        'There are eleven people left who speak Waenu and nine of them are on this island and four of those are my aunts.',
        'My mother spent thirty years making the Index: forty thousand cards, one word to a card, and on the back of each the sound of my grandmother saying it. She died in March. The cards are in the workshop and the cards are now mine.',
        'The university has written twice. They would like to digitise it. They are very reasonable about what that would mean.',
      ],
      choices: [
        { text: 'Go up to the workshop.', to: 'workshop', echo: 'The door still sticks in the wet.' },
        { text: 'Walk down to the water first.', to: 'water', gives: ['walked'], echo: 'It is the same sea. It is not a comfort.' },
      ],
    },
    {
      id: 'water',
      scene: coast([
        { prop: 'figure', args: ['sit', 1.66, 2], at: [3.2, 2.6], turn: -0.8, look: 'Sitting where the grass gives out.' },
        { prop: 'figure', args: ['stand', 1.6, 33], at: [1.4, 3.4], turn: 2.2, look: 'Aunt Sero. She has walked down after me, which took her an hour.' },
      ]),
      text: [
        'Aunt Sero followed me down, which at eighty-one is a decision rather than a walk.',
        'She said the word for the line where a wave has been and is not any more — one word, four syllables, no equivalent — and then she said, in English, *your mother wrote that one down as tide-mark and it is not tide-mark.*',
        'I asked her what it was. She said: it is that. And pointed at it.',
      ],
      choices: [
        { text: 'Write down what she said.', to: 'workshop', gives: ['wrote'], echo: 'In English. On my phone. I notice myself doing it.' },
        { text: 'Just look at where she is pointing.', to: 'workshop', gives: ['looked'], echo: 'For a long time. She waits.' },
      ],
    },
    {
      id: 'workshop',
      scene: workshop([
        { prop: 'papers', args: [11, 1.3, 3], at: [-0.4, 0.8, -0.6], look: 'Forty thousand cards. Her hand on every one of them.' },
        { prop: 'lantern', args: [0.4], at: [1.2, 0.78, -0.9] },
      ]),
      text: [
        'The Index is in nine boxes and the boxes are in order and the order is my mother\'s and is not alphabetical.',
        'On the bench beside them is the other thing. She built it in the last two years and told nobody, and it is a press: you put a card in one end and it folds a sheet into a shape, and the shape, when you unfold it, is the sound.',
        'I have watched it once. It made a bird. The bird said *hetalo* in my grandmother\'s voice and then it was a flat sheet of paper again.',
      ],
      choices: [
        { text: 'Run a card through it.', to: 'press', gives: ['pressed'], echo: 'I choose one at random, which I regret.' },
        { text: 'Answer the university.', to: 'offer', gives: ['answered'], echo: 'I get as far as *Dear Dr* twice.' },
        { text: 'Open the boxes and start reading.', to: 'reading', gives: ['read'], echo: 'Nine hours. I do not eat.' },
      ],
    },
    {
      id: 'press',
      scene: workshop([
        { prop: 'papers', args: [11, 1.3, 3], at: [-0.4, 0.8, -0.6] },
        { prop: 'origami', args: [5, 0.34], at: [0.6, 0.84, -0.4], look: 'A bird, badly folded, and warm.' },
        { prop: 'lantern', args: [0.4], at: [1.2, 0.78, -0.9] },
        { prop: 'figure', args: ['reach', 1.66, 2], at: [-0.4, 0.7], turn: Math.PI, look: 'Not touching it. Not yet.' },
      ]),
      text: [
        'The card was *ohunwe*. The bird said it and I did not know it and then I did, the way you know a room you were carried through as a baby.',
        'It means the particular tiredness of somebody who has been kind all day. My mother\'s gloss on the back reads *weary (polite)*, which is not wrong and is not it.',
        'The bird unfolded itself flat after eleven seconds. It will do it again. It will do it exactly the same way as many times as I like, and that is the part that frightens me.',
      ],
      choices: [
        { text: 'Run another. And another.', to: 'many', gives: ['many'], echo: 'Forty in a row. My hands start shaking about the twelfth.' },
        { text: 'Stop. Put the card back in its place.', to: 'reading', gives: ['stopped'], echo: 'In its place, which is between two words that have nothing to do with it.' },
        {
          text: 'Take the bird down to Aunt Sero.',
          to: 'sero',
          needs: ['walked'],
          gives: ['showed'],
          echo: 'It is a twenty-minute walk and I carry it in both hands.',
        },
      ],
    },
    {
      id: 'many',
      scene: workshop([
        { prop: 'papers', args: [14, 1.6, 3], at: [-0.4, 0.8, -0.6] },
        { prop: 'origami', args: [5, 0.3], at: [0.5, 0.84, -0.5] },
        { prop: 'origami', args: [15, 0.26], at: [1.0, 0.84, -0.2] },
        { prop: 'origami', args: [25, 0.3], at: [-1.4, 0.84, -0.3] },
        { prop: 'origami', args: [35, 0.24], at: [0.1, 0.84, 0.2], look: 'Forty of them, unfolding and refolding on their own time.' },
        { prop: 'figure', args: ['sit', 1.66, 2], at: [-0.4, 0.7], turn: Math.PI },
      ]),
      text: [
        'By the fortieth the bench was full of birds unfolding at their own speeds and the room was full of my grandmother saying single words to nobody.',
        'It is not a recording. A recording is a person saying a word once. This is the word, and it will say itself for as long as there is paper.',
        'Somewhere in the middle of it I understood what my mother had actually built, and why she had not told anyone, and what she must have been afraid it was.',
      ],
      choices: [
        { text: 'Write to the university. They should have this.', to: 'offer', gives: ['answered', 'convinced'], echo: 'This time the letter takes four minutes.' },
        { text: 'Shut it down. Take the plate out.', to: 'closed', gives: ['broke'], echo: 'It is one brass plate and four screws.' },
        {
          text: 'Take one bird to Aunt Sero and ask her.',
          to: 'sero',
          needs: ['walked'],
          gives: ['showed'],
          echo: 'She is the last person alive who could tell me if it is right.',
        },
      ],
    },
    {
      id: 'reading',
      scene: workshop([
        { prop: 'papers', args: [16, 1.5, 7], at: [-0.4, 0.8, -0.6], look: 'Not alphabetical. Ordered by something else entirely.' },
        { prop: 'lantern', args: [0.4], at: [1.2, 0.78, -0.9] },
        { prop: 'figure', args: ['sit', 1.66, 2], at: [-0.4, 0.7], turn: Math.PI },
      ]),
      text: [
        'The order is not alphabetical and it is not by subject. It took me nine hours and a headache to see it: it is the order in which my grandmother said them.',
        'Forty thousand cards, and the whole thing is one conversation, and my mother spent thirty years pretending it was a dictionary so that somebody would fund it.',
        'The last card in the ninth box has nothing on the front. On the back, in her hand: *she stopped here. I have left room.*',
      ],
      choices: [
        { text: 'Write to the university. Send them everything.', to: 'offer', gives: ['answered'], echo: 'Everything. Including the ninth box.' },
        { text: 'Put a card of my own in the space.', to: 'own', gives: ['added'], echo: 'It takes me until the following March.' },
        {
          text: 'Take the ninth box down to Aunt Sero.',
          to: 'sero',
          needs: ['walked'],
          gives: ['showed'],
          echo: 'She reads the last card and does not say anything for a while.',
        },
      ],
    },
    {
      id: 'sero',
      scene: coast([
        { prop: 'figure', args: ['bow', 1.6, 33], at: [1.2, 2.8], turn: -0.5, look: 'She has had this argument before, with my mother, and lost it.' },
        { prop: 'figure', args: ['stand', 1.66, 2], at: [2.6, 3.2], turn: 2.6 },
        { prop: 'origami', args: [5, 0.3], at: [1.9, 3.4] },
        { prop: 'tree', args: [12, 3.0, 1.3], at: [-3.4, -1.4] },
      ]),
      text: [
        'She listened to it four times. Then she said the word herself, and the bird said it again, and the two were not the same, and she laughed at me for expecting them to be.',
        'She said: *when I say it, I am saying it to you. That one is saying it to nobody. Your mother knew. That is why she never showed it to me.*',
        'Then she said: *but I am the last one who can tell the difference, and I will not be here in the spring.*',
      ],
      choices: [
        { text: 'Ask her what she wants done with it.', to: 'asked', gives: ['asked'], echo: 'She thinks about it for most of an hour.' },
        { text: 'Send it all to the university.', to: 'offer', gives: ['answered', 'blessed'], echo: 'She does not object. That is not the same as agreeing.' },
        { text: 'Take the plate out of the press.', to: 'closed', gives: ['broke'], echo: 'She watches me do it and does not stop me.' },
      ],
    },
    {
      id: 'asked',
      scene: coast([
        { prop: 'figure', args: ['bow', 1.6, 33], at: [1.2, 2.8], turn: -0.5 },
        { prop: 'figure', args: ['stand', 1.66, 2], at: [2.6, 3.2], turn: 2.6 },
        { prop: 'origami', args: [5, 0.3], at: [1.9, 3.4] },
      ]),
      text: [
        'She said: *teach somebody. Anybody. One person who will be alive in fifty years and can say ohunwe to a person who is tired.*',
        'I said there was nobody. She said there was me.',
        'I said I have a flight on the ninth. She said: *yes. That is what your mother said, in nineteen eighty-four.*',
      ],
      choices: [
        { text: 'Stay.', to: 'stayed', gives: ['stayed'], echo: 'I do not go to the airport. I do not ring them either, for two days.' },
        { text: 'Go, and take the Index with me.', to: 'offer', gives: ['answered', 'carried'], echo: 'Nine boxes, hold luggage, insured for nothing.' },
        { text: 'Go, and leave the Index where it is.', to: 'left', gives: ['left'], echo: 'The workshop key goes back under the stone.' },
      ],
    },
    {
      id: 'own',
      scene: workshop([
        { prop: 'papers', args: [18, 1.6, 7], at: [-0.4, 0.8, -0.6] },
        { prop: 'origami', args: [45, 0.3], at: [0.7, 0.84, -0.3], look: 'The first one in my voice. It is not as good.' },
        { prop: 'figure', args: ['sit', 1.66, 2], at: [-0.4, 0.7], turn: Math.PI },
      ]),
      text: [
        'It took me until March to have a word worth putting there. I chose *nemeka*, which my grandmother used for the sound the press itself makes, because she used it for any machine that was trying its best.',
        'I recorded it in my own voice, which is wrong in about four ways that Aunt Sero listed for me at length.',
        'It is card forty thousand and one. It is the first one that is not a conversation somebody else had.',
      ],
      choices: [
        { text: 'Keep going. Card forty thousand and two.', to: 'stayed', gives: ['stayed'], echo: 'And three. And by June there are two hundred.' },
        { text: 'Send it all now, while there is something to send.', to: 'offer', gives: ['answered'], echo: 'Including mine, which they will treat exactly the same.' },
      ],
    },
    {
      id: 'offer',
      scene: workshop([
        { prop: 'crate', args: [0.62], at: [1.6, 0.6] },
        { prop: 'crate', args: [0.62], at: [2.4, 0.9] },
        { prop: 'papers', args: [6, 0.9, 3], at: [-0.6, 0.8, -0.5] },
        { prop: 'figure', args: ['stand', 1.66, 2], at: [-1.4, 1.2], turn: 0.5, look: 'Deciding what to put in the last box.' },
      ]),
      text: [
        'They came in June with two vans and a conservator and they were, genuinely, wonderful about it. Every card scanned at 1200 dpi. Every recording at a sample rate I could not have named.',
        'The Index is now in a repository with a permanent identifier and it will outlive the island, which is going, and the aunts, who are going.',
        'The press they photographed and did not take. I said it was a mechanism of my mother\'s and not part of the collection, and that was true, and it was not why I said it.',
      ],
      choices: [],
      ending: {
        title: 'A permanent identifier',
        kind: 'riddle',
        note: 'Everything is saved and nothing is kept. The Index survives as a thing that can be consulted, which is not the thing it was.',
      },
    },
    {
      id: 'closed',
      scene: workshop([
        { prop: 'papers', args: [8, 1.1, 3], at: [-0.4, 0.8, -0.6] },
        { prop: 'crate', args: [0.6], at: [2.6, 1.6], look: 'The plate is in there, wrapped, at the bottom.' },
        { prop: 'figure', args: ['stand', 1.66, 2], at: [-0.4, 0.9], turn: Math.PI },
      ]),
      text: [
        'Four screws and one brass plate, and afterwards the press is a very well-made machine for folding paper into the shape of a bird that does not say anything.',
        'I have the plate. I have not thrown it away and I am not going to, and I know what that means about the strength of the decision.',
        'Aunt Sero said one thing about it, which was *good*, and then asked whether I was staying for supper.',
      ],
      choices: [],
      ending: {
        title: 'Four screws',
        kind: 'ruin',
        note: 'The copy is destroyed to protect the original — and the original has eleven speakers and no plan.',
      },
    },
    {
      id: 'stayed',
      scene: coast([
        { prop: 'figure', args: ['sit', 1.6, 33], at: [0.8, 2.4], turn: -0.4 },
        { prop: 'figure', args: ['sit', 1.66, 2], at: [2.2, 2.9], turn: 2.6, look: 'Third summer. Getting there, slowly, and wrongly, and out loud.' },
        { prop: 'origami', args: [5, 0.28], at: [1.5, 3.2] },
        { prop: 'tree', args: [12, 3.0, 1.3], at: [-3.4, -1.4] },
        { prop: 'bush', args: [7, 0.7], at: [3.4, 1.4] },
      ]),
      text: [
        'Aunt Sero died in the February, as advertised, and by then I had about nine hundred words and an accent she described, in her last full sentence to me, as *criminal*.',
        'There are ten speakers of Waenu. One of them learned it out of nine boxes and a paper bird and is not a fluent speaker of anything and says *ohunwe* to the postman, who is tired, and who has started saying it back.',
        'The press is on the bench. I run a card through it about once a month, when I get stuck, which is the use my mother built it for and never wrote down.',
      ],
      choices: [],
      ending: {
        title: 'Ten speakers',
        kind: 'grace',
        note: 'The machine ends up as what it was always for — a tool for a person who is learning — rather than as the archive or as the threat.',
      },
    },
    {
      id: 'left',
      scene: coast([
        { prop: 'tree', args: [12, 3.0, 1.3], at: [-3.4, -1.4] },
        { prop: 'bush', args: [7, 0.7], at: [2.6, 2.2] },
        { prop: 'boulder', args: [51, 0.5], at: [0.6, 3.0], look: 'The key is under it. It has been under it since I was six.' },
      ]),
      text: [
        'I went on the ninth. The workshop is locked and the key is under the stone and the boxes are in their order and the press is on the bench with a cloth over it.',
        'It is all still there. I ring on Sundays and Aunt Sero tells me who has died and I say the four words I am sure of and she is kind about them.',
        'Nothing has been lost. Nothing has been done, either, and there is a difference, and I have eleven years to work out what it is.',
      ],
      choices: [],
      ending: {
        title: 'The key is under the stone',
        kind: 'riddle',
        note: 'Preservation by postponement — the one ending in which nobody has decided anything.',
      },
    },
  ],
};
