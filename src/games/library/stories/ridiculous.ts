import type { SceneSpec } from '../kit/scene';
import type { Story } from '../story';

/**
 * After Dostoevsky, "The Dream of a Ridiculous Man" (1877). Public domain.
 *
 * The story is already a branching one: a man who has decided to shoot himself
 * is stopped by a child asking for help, and everything after turns on whether
 * he answers her. So the choices are the story's own, not decorations bolted
 * to a summary of it.
 */

const street = (extra: SceneSpec['props'] = []): SceneSpec => ({
  palette: 'petersburg',
  ground: { radius: 9, thickness: 2.4, dish: 0.05, lip: 0.1, bumps: 0.05, square: true, slot: 'stone' },
  props: [
    { prop: 'lamp', args: [3.4], at: [-2.6, 1.2], look: 'The gas is low. The light does not reach the ground.' },
    { prop: 'lamp', args: [3.4], at: [3.8, -3.4] },
    { prop: 'wall', args: [9, 4.6, 0.5, 3], at: [0, -5.4] },
    { prop: 'wall', args: [7, 5.2, 0.5, 8], at: [-6.2, -0.6], turn: Math.PI / 2 },
    { prop: 'window', args: [1.2, 1.5, 2.6], at: [-2, -5.1] },
    { prop: 'window', args: [1.2, 1.5, 2.6], at: [2.4, -5.1] },
    { prop: 'railing', args: [5, 0.9], at: [4.6, 2.2], turn: Math.PI / 2 },
    ...extra,
  ],
  camera: { from: [5.2, 3.4, 8.4], look: [-0.4, 1.2, -0.6], fov: 36 },
  drift: 0.06,
});

const garret = (extra: SceneSpec['props'] = []): SceneSpec => ({
  palette: 'petersburg',
  room: { w: 6.4, d: 6.8, h: 3.0, wall: 'rock', floor: 'timber', ceiling: true, seed: 3 },
  props: [
    { prop: 'window', args: [1.3, 1.7, 1.2], at: [1.2, -3.3], look: 'A square of night, and one star in it that will not go out.' },
    { prop: 'table', args: [1.5, 0.76, 0.86], at: [-0.7, -0.9] },
    { prop: 'chair', args: [0.95], at: [-0.7, 0.3], turn: Math.PI },
    { prop: 'candle', args: [0.3], at: [-1.2, 0.76, -1.1] },
    { prop: 'bed', args: [1.1, 2.0], at: [2.3, 0.6], turn: -Math.PI / 2 },
    { prop: 'shelfOfBooks', args: [1.6, 4], at: [-2.9, 1.4, -2.2], turn: 0.2 },
    ...extra,
  ],
  camera: { from: [3.6, 2.4, 5.2], look: [-0.2, 1.1, -1.0], fov: 41 },
  drift: 0.04,
});

const eden: SceneSpec = {
  palette: 'paper',
  ground: { radius: 8, thickness: 3.6, dish: 0.5, lip: 1.2, bumps: 0.4, slot: 'rock' },
  cover: { radius: 7.6, thickness: 1.0, dish: 0.5, lip: 1.2, bumps: 0.4, slot: 'grass' },
  grass: { count: 1200, radius: 7.2, inner: 0.6 },
  flowers: { count: 140, radius: 6.6, inner: 1.2 },
  water: { y: -1.2, radius: 90 },
  clouds: true,
  props: [
    { prop: 'tree', args: [3, 4.2, 1.9], at: [-3.4, -2.2], look: 'Nobody planted it. Nobody needed to.' },
    { prop: 'tree', args: [11, 3.4, 1.5], at: [4.2, -3.4] },
    { prop: 'bush', args: [5, 0.8], at: [2.2, 2.6] },
    { prop: 'bush', args: [9, 0.6], at: [-4.6, 1.8] },
    { prop: 'crag', args: [21, 1.2], at: [5.8, 1.4], sink: 0.4 },
    { prop: 'figure', args: ['stand', 1.7, 2], at: [-0.8, 0.4], turn: 0.5, look: 'They have no word for mine, and no need of one yet.' },
    { prop: 'figure', args: ['sit', 1.7, 8], at: [0.9, 1.2], turn: -0.7 },
    { prop: 'figure', args: ['reach', 1.7, 13], at: [1.9, -1.4], turn: 2.4 },
  ],
  camera: { from: [7.4, 5.2, 9.2], look: [0, 1.2, 0], fov: 34 },
  drift: 0.1,
};

export const RIDICULOUS: Story = {
  id: 'ridiculous',
  title: 'The Dream of a Ridiculous Man',
  author: 'Fyodor Dostoevsky',
  source: 'Adapted from the 1877 story. Public domain.',
  blurb:
    'A man who has settled the question of his own life is stopped on a wet pavement by a child who wants help. Everything else in the story is the consequence of what he does in that half a minute.',
  spine: '#2f3d6b',
  ink: '#f5c264',
  start: 'street',
  nodes: [
    {
      id: 'street',
      scene: street([
        { prop: 'figure', args: ['stand', 1.24, 4], at: [1.1, 1.6], turn: 2.6, look: 'Soaked through. She has been running a long way to find anybody at all.' },
      ]),
      text: [
        'It is November and everything is wet. I had settled it that afternoon — quite calmly, the way one settles a bill — and I was going home to do it, and I was thinking about nothing at all.',
        'Then a little girl caught at my elbow. Wet through, eight years old, terrified. Something about her mother. She was saying it over and over and the rain was taking most of it.',
        'I remember thinking, very clearly: it does not matter. In an hour none of this will be anything to me. That thought is the whole of what I am ashamed of.',
      ],
      choices: [
        { text: 'Stop. Ask her where.', to: 'follow', gives: ['answered'], echo: 'She pulls, and I go.' },
        { text: 'Shout at her, and walk on.', to: 'garret', gives: ['refused'], echo: 'I hear myself do it from a long way off.' },
        { text: 'Say nothing. Simply keep walking.', to: 'garret', gives: ['refused'], echo: 'She calls after me twice and then stops.' },
      ],
    },
    {
      id: 'follow',
      scene: street([
        { prop: 'figure', args: ['stand', 1.24, 4], at: [0.4, 3.2], turn: 3.1 },
        { prop: 'door', args: [1.1, 2.3, 0.8], at: [-1.6, -5.1], look: 'The stair behind it goes up further than the house looks tall.' },
      ]),
      text: [
        'The door she wanted was four streets away and it was not a good door. On the stair a woman was ill in the way people are ill when nobody has been paid for a month.',
        'I did what could be done, which was almost nothing, and it took two hours, and by the end of it I was too tired to be anything.',
      ],
      choices: [
        { text: 'Go home. The question can wait a night.', to: 'garret', gives: ['tired'], echo: 'It waits.' },
        { text: 'Go home, and take the question with me.', to: 'garret', echo: 'It comes up the stairs behind me.' },
      ],
    },
    {
      id: 'garret',
      scene: garret([
        { prop: 'book', args: [0.3, 0.06, 0.22], at: [-0.3, 0.78, -0.7], look: 'A revolver, loaded that afternoon, lying where a book should be.' },
      ]),
      text: [
        'My room is five paces by four and has a window in the roof. On the table is the thing I bought two months ago and have looked at every night since.',
        'I sat down in the chair opposite it, as one sits opposite a guest, and I found I was arguing. Not about whether. About whether it mattered that I had left a child in the rain.',
        'And somewhere in the middle of that argument, with my hand on the table, I fell asleep.',
      ],
      choices: [
        { text: 'Take it up.', to: 'shot', gives: ['fired'], echo: 'The room is suddenly very loud, and then very quiet.' },
        { text: 'Sleep. Decide in the morning.', to: 'grave', echo: 'I do not get to the morning.' },
        {
          text: 'Think about the girl first.',
          to: 'grave',
          needs: ['answered'],
          gives: ['carried'],
          echo: 'I take her up the stairs with me, into the dream.',
        },
      ],
    },
    {
      id: 'shot',
      scene: garret([{ prop: 'candle', args: [0.3], at: [1.6, 0.02, 1.2] }]),
      text: [
        'In the dream I did it, and it was not the end of anything. I was carried out and put in the ground, and I lay in the ground and was extremely annoyed.',
        'Water came through the lid, one drop at a time, and I found that I was still exactly the person who had walked past a child in the rain, and that being dead had not improved that in the least.',
      ],
      choices: [
        { text: 'Call out. To anyone. To whatever is listening.', to: 'grave', gives: ['called'], echo: 'Something hears.' },
        { text: 'Lie still and be nothing.', to: 'grave', echo: 'It makes no difference. I am taken up anyway.' },
      ],
    },
    {
      id: 'grave',
      scene: {
        palette: 'usher',
        ground: { radius: 6.5, thickness: 3, dish: 0.9, lip: 0.4, bumps: 0.3, slot: 'rockDark' },
        props: [
          { prop: 'boulder', args: [3, 1.3], at: [-3.2, -2.4], sink: 0.5 },
          { prop: 'boulder', args: [17, 0.9], at: [3.4, -1.2], sink: 0.3 },
          { prop: 'deadTree', args: [7, 3.8], at: [-4.2, 1.6] },
          { prop: 'figure', args: ['lie', 1.7, 21], at: [0, -0.2], turn: 0.3, look: 'Face up, hands folded. Still arguing.' },
          { prop: 'candle', args: [0.4], at: [1.4, 1.4] },
        ],
        camera: { from: [4.6, 3.6, 6.4], look: [0, 0.4, 0], fov: 36 },
        drift: 0.05,
      },
      text: [
        'Then something took me up out of the ground and carried me through the dark at a speed that had no sound in it, and we came out past the sun, and past a great many suns, and stopped.',
        'It was the same earth. The same seas in the same places. But nothing on it had ever been spoiled.',
      ],
      choices: [
        { text: 'Go down to them.', to: 'eden', echo: 'They come out to meet me as if I were expected.' },
        {
          text: 'Ask first what I am doing here.',
          to: 'eden',
          needs: ['called'],
          gives: ['warned'],
          echo: 'The answer is: you will see. It is not reassuring.',
        },
      ],
    },
    {
      id: 'eden',
      scene: eden,
      text: [
        'They were not stupid and they were not children. They knew a great deal more than we do — only none of it was the kind of knowledge you get by taking a thing apart.',
        'They loved me at once, which I did not deserve, and they asked me about where I had come from, which I could not explain.',
        'And I found, standing among them, that I wanted very badly to tell them something true about myself.',
      ],
      choices: [
        { text: 'Tell them. All of it.', to: 'lie', gives: ['told'], echo: 'It goes into them like a dye into water.' },
        { text: 'Say nothing. Let them keep it.', to: 'keep', echo: 'I hold my tongue for what feels like a year.' },
        {
          text: 'Warn them about me before I say anything.',
          to: 'keep',
          needs: ['warned'],
          gives: ['confessed'],
          echo: 'They do not understand the warning. That is the trouble.',
        },
      ],
    },
    {
      id: 'lie',
      scene: {
        ...eden,
        palette: 'chancery',
        flowers: { count: 30, radius: 6 },
        props: [
          ...eden.props.filter((p) => p.prop !== 'figure'),
          { prop: 'figure', args: ['bow', 1.7, 2], at: [-1.4, 0.8], turn: 0.9, look: 'He has learned to look away, and he taught the rest.' },
          { prop: 'figure', args: ['stand', 1.7, 8], at: [1.4, 1.0], turn: -1.4 },
          { prop: 'wall', args: [4, 2.2, 0.4, 6], at: [0.6, -3.4], turn: 0.3 },
          { prop: 'gate', args: [1.8, 2.8, 0.5, 4], at: [-3.6, -1.2], turn: -0.4 },
        ],
        // Further out and higher than Eden's own shot: this scene has a wall
        // and a gate in it, and from Eden's camera they are behind the trees.
        camera: { from: [8.6, 6.4, 10.4], look: [0, 1.0, -0.6], fov: 33 },
      },
      text: [
        'I taught them to lie. Not on purpose — I only told them the truth about myself, and they found it interesting, and then they found it useful.',
        'Within a lifetime they had shame, and after shame the rest of it followed on quite naturally: walls, and courts, and a word for mine, and wars fought entirely over which account of a thing was the correct one.',
        'They still remembered the old life. They had made it into a religion, which is what you do with a thing you can no longer manage.',
      ],
      choices: [
        { text: 'Beg them to crucify me. It is the least I can offer.', to: 'wake_ruin', gives: ['begged'], echo: 'They laugh, kindly, and explain that I am not well.' },
        { text: 'Try to teach them back.', to: 'wake_ruin', echo: 'I have no idea how. That is the whole of the problem.' },
        {
          text: 'Tell them it was me, and that it can be undone.',
          to: 'wake_grace',
          needs: ['answered'],
          gives: ['owned'],
          echo: 'One of them believes me. One is enough.',
        },
      ],
    },
    {
      id: 'keep',
      scene: eden,
      text: [
        'So I said nothing about myself, and lived among them, and it was the happiest I have ever been or will be.',
        'And it did not hold. Not because of anything I said in the end, but because I was there — and a man who has been ashamed carries it about with him whether he opens his mouth or not.',
        'It went slower. That is all silence bought.',
      ],
      choices: [
        { text: 'Stay to the end of it.', to: 'wake_riddle', echo: 'I watch the whole slow business through.' },
        {
          text: 'Ask to be sent back before I do any more damage.',
          to: 'wake_grace',
          needs: ['confessed'],
          gives: ['owned'],
          echo: 'Granted, immediately, which is its own kind of answer.',
        },
      ],
    },
    {
      id: 'wake_grace',
      scene: garret([
        { prop: 'figure', args: ['sit', 1.7, 4], at: [-0.6, 0.3], turn: Math.PI },
        { prop: 'window', args: [1.3, 1.7, 1.2], at: [1.4, -3.5], look: 'Morning, and it is an ordinary one.' },
      ]),
      text: [
        'I woke in the chair with my face on the table and the thing still lying where I had left it, and I did not touch it, then or since.',
        'I know what I saw. I know I cannot prove a word of it and that saying it aloud makes me exactly as ridiculous as I have always been. It does not matter. I know where the child lives.',
        'I went that morning and I have gone most mornings since. It is a very small thing to have brought back from paradise, and it is the only part of it I can actually do.',
      ],
      choices: [],
      ending: {
        title: 'And I found the little girl',
        kind: 'grace',
        note: 'The story’s own ending. He does not fix the world; he goes back for one person in it, which is the only thing the dream actually asked of him.',
      },
    },
    {
      id: 'wake_ruin',
      scene: garret([{ prop: 'book', args: [0.3, 0.06, 0.22], at: [-0.3, 0.78, -0.7] }]),
      text: [
        'I woke, and the room was the room, and I had the whole of it — the golden age, the ruin of it, my own hand in the ruin — sitting in me like a stone that had been swallowed.',
        'I have told people. They are very kind about it. They say: you dreamed it, you are unwell, you should eat something.',
        'And they are right, and it changes nothing, because I am the man who walked past a child in the rain and then went and spoiled a world, and I have not been back to that street once.',
      ],
      choices: [],
      ending: {
        title: 'A vision, they said, and quite understandable',
        kind: 'ruin',
        note: 'He keeps the revelation and does nothing with it — which in Dostoevsky is not tragedy, only waste.',
      },
    },
    {
      id: 'wake_riddle',
      scene: garret([
        { prop: 'papers', args: [9, 0.8, 3], at: [-0.6, 0.82, -0.9] },
        { prop: 'candle', args: [0.3], at: [-1.1, 0.76, -1.1], look: 'Burnt down to nothing while I was away.' },
      ]),
      text: [
        'I woke and began writing it down at once, and I have been writing it down ever since, and every version is a little further from the thing itself.',
        'The truth is I saw it. The other truth is that the seeing of it has become a habit, like the revolver was a habit, and I am no longer certain the two are different.',
        'I have three hundred pages. I have not been down that street once.',
      ],
      choices: [],
      ending: {
        title: 'Three hundred pages',
        kind: 'riddle',
        note: 'The account becomes the thing itself — a way of holding the vision that costs nothing and does nothing.',
      },
    },
  ],
};
