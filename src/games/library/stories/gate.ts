import type { SceneSpec } from '../kit/scene';
import type { Story } from '../story';

/**
 * After Kafka, "Before the Law" (1915). Public domain.
 *
 * The parable has exactly one event in it and the man never acts, which is a
 * problem for something that has to be played. The way through is not to give
 * him more to do but to make *waiting* one choice among several — so that
 * every year he spends at the gate is a year he chose, which is the reading
 * the parable was always inviting.
 */

const before = (extra: SceneSpec['props'] = [], palette: SceneSpec['palette'] = 'chancery'): SceneSpec => ({
  palette,
  ground: { radius: 10, thickness: 2, dish: 0.02, lip: 0.06, bumps: 0.04, square: true, slot: 'stone' },
  props: [
    { prop: 'gate', args: [2.4, 4.0, 0.9, 2], at: [0, -3.2], look: 'Open. It has always been open. That is the difficulty.' },
    { prop: 'wall', args: [7, 5.4, 0.7, 3], at: [-5.6, -3.2] },
    { prop: 'wall', args: [7, 5.4, 0.7, 4], at: [5.6, -3.2] },
    { prop: 'wall', args: [5, 5.0, 0.6, 5], at: [-8.4, 0.6], turn: Math.PI / 2 },
    { prop: 'wall', args: [5, 5.0, 0.6, 6], at: [8.4, 0.6], turn: Math.PI / 2 },
    { prop: 'stool', args: [0.52], at: [-1.5, -1.6] },
    ...extra,
  ],
  camera: { from: [4.4, 3.6, 7.6], look: [-0.2, 1.6, -2.4], fov: 36 },
  drift: 0.05,
});

const doorkeeper = (pose = 'stand', seed = 6): SceneSpec['props'][number] => ({
  prop: 'figure',
  args: [pose, 1.86, seed],
  at: [1.1, -1.9],
  turn: 0.2,
  look: 'Big. Bearded. Bored in a way that has taken decades to perfect.',
});

const man = (pose = 'stand', at: [number, number] = [-1.5, 0.4]): SceneSpec['props'][number] => ({
  prop: 'figure',
  args: [pose, 1.66, 14],
  at,
  turn: 3.0,
  look: 'From the country. He has brought everything he owns, in case it helps.',
});

export const GATE: Story = {
  id: 'gate',
  title: 'Before the Law',
  author: 'Franz Kafka',
  source: 'Adapted from the 1915 parable. Public domain.',
  blurb:
    'A door stands open and a doorkeeper stands beside it and says only that he cannot let you in at this moment — not now, he says, which is not the same as never. Nothing else happens for the rest of your life, unless you make it.',
  spine: '#7a6a48',
  ink: '#d8b23f',
  start: 'arrive',
  nodes: [
    {
      id: 'arrive',
      scene: before([doorkeeper(), man()]),
      text: [
        'Before the Law there stands a doorkeeper. I came from the country and asked to be let in.',
        'He said that he could not admit me at this moment. I asked whether I might be admitted later, and he said: it is possible, but not now.',
        'The gate stood open, as it always does. He stepped a little to one side so that I could see through it.',
      ],
      choices: [
        { text: 'Ask him again, more politely.', to: 'ask', gives: ['asked'], echo: 'He gives the same answer in the same voice.' },
        { text: 'Sit down on the stool and wait.', to: 'wait', gives: ['sat'], echo: 'The stool was put there for me. I do not think about that yet.' },
        { text: 'Walk through. He said he could not admit me — not that he would stop me.', to: 'through', gives: ['walked'], echo: 'He does not move. It is worse than if he had.' },
      ],
    },
    {
      id: 'ask',
      scene: before([doorkeeper(), man('bow')]),
      text: [
        'He is not unkind. He answers everything. He tells me he is only the lowest of the doorkeepers, that there is another beyond him and another beyond that, and that the third of them he himself cannot bear to look at.',
        'He says this the way a man tells you the office is closed for lunch.',
      ],
      choices: [
        { text: 'Wait, then. There is nothing else to do.', to: 'wait', gives: ['sat'], echo: 'I sit.' },
        { text: 'Offer him everything I brought.', to: 'bribe', gives: ['paid'], echo: 'He takes it. He explains why he is taking it.' },
        { text: 'Go through anyway.', to: 'through', gives: ['walked'], echo: 'I have his own words in my hand and they weigh nothing.' },
      ],
    },
    {
      id: 'bribe',
      scene: before([doorkeeper(), man('kneel'), { prop: 'crate', args: [0.55], at: [-0.4, 0.9] }, { prop: 'papers', args: [8, 0.9, 5], at: [-2.2, 1.4] }]),
      text: [
        'He accepts it all, and as he takes each thing he says: I am accepting this only so that you do not feel you have left something untried.',
        'It is the most honest sentence anybody has ever said to me and it costs me everything I own.',
      ],
      choices: [
        { text: 'Sit back down.', to: 'wait', gives: ['sat'], echo: 'Lighter, and no nearer.' },
        {
          text: 'Ask what he did with it.',
          to: 'years',
          needs: ['asked'],
          gives: ['pressed'],
          echo: 'Nothing. He did nothing with it. He says so without embarrassment.',
        },
        { text: 'Walk through while he is counting.', to: 'through', gives: ['walked'], echo: 'He does not look up.' },
      ],
    },
    {
      id: 'wait',
      scene: before([doorkeeper(), man('sit', [-1.5, -1.1])]),
      text: [
        'I wait. Days, and then the sort of stretch of time that stops having days in it.',
        'I study him. I learn his coat, his nose, the fleas in his fur collar. I curse aloud at first and later only mutter.',
      ],
      choices: [
        { text: 'Keep waiting.', to: 'years', gives: ['waited'], echo: 'The light gets no worse and no better.' },
        { text: 'Ask the fleas to help me. Ask them to change his mind.', to: 'fleas', gives: ['fleas'], echo: 'I hear myself do it and I do not stop.' },
        { text: 'Get up and go through.', to: 'through', gives: ['walked'], echo: 'My legs have forgotten. I do it anyway.' },
      ],
    },
    {
      id: 'fleas',
      scene: before([doorkeeper(), man('kneel', [-1.4, -0.9])]),
      text: [
        'I asked the fleas. I want that written down somewhere. A man of ordinary understanding, who came here with a case of documents, sat on a stool and petitioned the fleas in another man\'s collar.',
        'They did not help. But it was the first thing in years I had done that was mine.',
      ],
      choices: [
        { text: 'Sit back down and wait properly.', to: 'years', gives: ['waited'], echo: 'Properly.' },
        { text: 'Stand up. Go through.', to: 'through', gives: ['walked'], echo: 'Because if the fleas will not, then who.' },
      ],
    },
    {
      id: 'years',
      scene: before([doorkeeper('stand', 6), man('sit', [-1.5, -1.1])], 'usher'),
      text: [
        'My eyes go. I do not know now whether the world has actually got darker or whether it is only me.',
        'But I begin to see a radiance coming out of the gateway that does not stop. It is not on any of the walls. It is coming through the door, and it has been coming through the door the entire time.',
        'I have one question left and I have to be lifted up to ask it.',
      ],
      choices: [
        {
          text: '"Everyone strives for the Law. How is it that in all these years no one but me has asked to be let in?"',
          to: 'closed',
          gives: ['asked_last'],
          echo: 'He puts his mouth right against my ear, because I am nearly gone.',
        },
        { text: 'Say nothing. Look at the light.', to: 'quiet', echo: 'It is very good light.' },
        {
          text: 'Get up, one last time, and go through.',
          to: 'through',
          gives: ['walked', 'late'],
          echo: 'It takes most of what I have left.',
        },
      ],
    },
    {
      id: 'through',
      scene: {
        ...before([doorkeeper('stand', 6)], 'chancery'),
        camera: { from: [2.8, 3.0, 6.4], look: [0, 1.7, -7.4], fov: 40 },
        props: [
          { prop: 'gate', args: [2.4, 4.0, 0.9, 2], at: [0, -3.2] },
          { prop: 'wall', args: [7, 5.4, 0.7, 3], at: [-5.6, -3.2] },
          { prop: 'wall', args: [7, 5.4, 0.7, 4], at: [5.6, -3.2] },
          { prop: 'gate', args: [2.2, 3.8, 0.9, 12], at: [0, -8.4] },
          { prop: 'gate', args: [2.0, 3.6, 0.9, 22], at: [0, -13.2] },
          { prop: 'figure', args: ['stand', 1.98, 30], at: [1.2, -7.2], turn: 0.2, look: 'The second one. He is not looking at me either.' },
          doorkeeper(),
        ],
      },
      text: [
        'I went through. Nobody stopped me. He watched me do it with an expression I could not read and have thought about ever since.',
        'Beyond the gate is a hall, and at the end of the hall is another gate, and beside it a doorkeeper who makes the first one look like a boy.',
        'He has not looked up. There is a stool.',
      ],
      choices: [
        { text: 'Ask to be let in.', to: 'inner', gives: ['inner'], echo: 'The words come out in exactly the voice I used the first time.' },
        { text: 'Sit down on the stool.', to: 'inner', gives: ['inner', 'sat_again'], echo: 'It is the same stool. It cannot be the same stool.' },
        {
          text: 'Turn round and look back at the first gate.',
          to: 'looked_back',
          needs: ['late'],
          gives: ['saw'],
          echo: 'It is a very long way back and the light is behind me now.',
        },
        { text: 'Keep walking. Do not ask anybody anything.', to: 'walking', gives: ['walking'], echo: 'One gate, and another, and another.' },
      ],
    },
    {
      id: 'inner',
      scene: {
        ...before([{ prop: 'figure', args: ['stand', 1.98, 30], at: [1.2, -1.9], turn: 0.2 }, man('sit', [-1.5, -1.1])], 'usher'),
        camera: { from: [3.8, 3.2, 6.6], look: [-0.2, 1.5, -2.6], fov: 36 },
      },
      text: [
        'He says he cannot admit me at this moment. He says it is possible later. He says he is only the second of them.',
        'I have done this before and I know exactly how long it takes, and I sit down anyway, and that is the part I cannot explain to anybody.',
      ],
      choices: [],
      ending: {
        title: 'The same stool, further in',
        kind: 'riddle',
        note: 'Passing the gate does not end the parable. It reveals that the gate was never the thing keeping him out.',
      },
    },
    {
      id: 'walking',
      scene: {
        palette: 'chancery',
        ground: { radius: 11, thickness: 2, dish: 0, lip: 0, bumps: 0.02, square: true, slot: 'stone' },
        props: [
          { prop: 'gate', args: [2.3, 3.9, 0.9, 2], at: [0, -1] },
          { prop: 'gate', args: [2.2, 3.8, 0.9, 12], at: [0, -5] },
          { prop: 'gate', args: [2.1, 3.7, 0.9, 22], at: [0, -9] },
          { prop: 'gate', args: [2.0, 3.6, 0.9, 32], at: [0, -13] },
          { prop: 'gate', args: [1.9, 3.5, 0.9, 42], at: [0, -17] },
          { prop: 'figure', args: ['stand', 1.66, 14], at: [0, 1.6], turn: Math.PI, look: 'Still walking. He stopped counting somewhere around the ninth.' },
        ],
        camera: { from: [2.6, 3.4, 7.8], look: [0, 1.6, -9], fov: 38 },
        drift: 0.03,
      },
      text: [
        'I stopped asking. It turns out that asking was the whole mechanism, and that a man who does not ask is simply a man walking down a corridor.',
        'There is no end to it that I have found. But there is no stool in it either, and I have not sat down in a very long time.',
      ],
      choices: [],
      ending: {
        title: 'A man walking down a corridor',
        kind: 'grace',
        note: 'Not an escape — the corridor is endless. But he is moving through it under his own power, which the man in the parable never was.',
      },
    },
    {
      id: 'looked_back',
      scene: {
        ...before([doorkeeper('bow'), man('stand', [-0.6, -6.4])], 'usher'),
        camera: { from: [3.7, 3.07, -10.31], look: [0.2, 1.8, -3.0], fov: 42 },
      },
      text: [
        'From this side the first gate is small, and the doorkeeper standing in it is an old man in a coat, and the light I spent my life waiting for is pouring out past him into the country I came from.',
        'It was going that way the entire time. It was never in here.',
      ],
      choices: [],
      ending: {
        title: 'It was going the other way',
        kind: 'grace',
        note: 'The one thing the man in the parable never does is turn round — and the light, from the far side, is quite obviously leaving.',
      },
    },
    {
      id: 'closed',
      scene: before([doorkeeper('bow'), man('lie', [-1.5, -0.6])], 'usher'),
      text: [
        '"No one else could be admitted here," he shouts into my ear, because I am nearly gone and he wants to be sure of it, "since this gate was made only for you. I am now going to shut it."',
        'And that is the whole of the joke, and it has taken my entire life to arrive at, and I would laugh if I had anything left to laugh with.',
      ],
      choices: [],
      ending: {
        title: 'This gate was made only for you',
        kind: 'ruin',
        note: 'The parable’s own ending, kept exactly: the door was his, it was open the whole time, and asking permission was the only thing that ever stood in it.',
      },
    },
    {
      id: 'quiet',
      scene: before([doorkeeper(), man('lie', [-1.5, -0.6])], 'usher'),
      text: [
        'I did not ask. I had one question and I found, at the end, that I did not want the answer badly enough to spend my last breath on it.',
        'So I lay and looked at the light in the doorway, which was very good light, and which I had been within four paces of for fifty years.',
      ],
      choices: [],
      ending: {
        title: 'Four paces',
        kind: 'riddle',
        note: 'He dies without the explanation. Whether that is a mercy is left where Kafka left it.',
      },
    },
  ],
};
