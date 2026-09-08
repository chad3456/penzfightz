import type { SceneSpec } from '../kit/scene';
import type { Story } from '../story';

/**
 * After Poe, "The Tell-Tale Heart" (1843). Public domain.
 *
 * The story is one long argument that the narrator is not mad, conducted by a
 * man who is plainly mad, and the reader's job is to keep noticing the gap. So
 * the choices are not "kill him or don't" — they are the small procedural
 * decisions the narrator is so proud of. You are invited to be careful with
 * him, and that is the trap.
 */

const landing = (extra: SceneSpec['props'] = []): SceneSpec => ({
  palette: 'usher',
  room: { w: 7.2, d: 7.6, h: 3.4, wall: 'stone', floor: 'timber', ceiling: true, seed: 3 },
  props: [
    { prop: 'door', args: [1.15, 2.4, 0.0], at: [0.4, -3.7], look: 'Shut. Behind it, the old man, and the eye, asleep.' },
    { prop: 'shelfOfBooks', args: [1.4, 9], at: [-3.3, 0, 1.6], turn: -Math.PI / 2 },
    { prop: 'stool', args: [0.46], at: [-2.4, -1.4] },
    ...extra,
  ],
  camera: { from: [3.0, 2.3, 5.6], look: [0.1, 1.3, -2.8], fov: 40 },
  drift: 0.035,
});

const bedroom = (ajar: number, extra: SceneSpec['props'] = []): SceneSpec => ({
  palette: 'usher',
  room: { w: 7.6, d: 7.4, h: 3.4, wall: 'stone', floor: 'timber', ceiling: true, seed: 7 },
  props: [
    { prop: 'window', args: [1.2, 1.6, 1.4], at: [-2.2, -3.6] },
    { prop: 'bed', args: [1.25, 2.2], at: [1.5, -1.6] },
    { prop: 'chair', args: [0.95], at: [-2.6, 0.6], turn: 0.6 },
    { prop: 'door', args: [1.15, 2.4, ajar], at: [-0.9, 3.55], turn: Math.PI },
    ...extra,
  ],
  camera: { from: [-2.9, 2.4, 5.4], look: [0.7, 1.2, -1.8], fov: 40 },
  drift: 0.03,
});

export const HEART: Story = {
  id: 'heart',
  title: 'The Tell-Tale Heart',
  author: 'Edgar Allan Poe',
  source: 'Adapted from the 1843 story. Public domain.',
  blurb:
    'Seven nights of opening a door one hinge at a time, and a great deal of insistence that this is exactly what a sane man would do. You make the careful decisions. He supplies the reasoning.',
  spine: '#5a2420',
  ink: '#e0662f',
  start: 'nights',
  nodes: [
    {
      id: 'nights',
      scene: landing([{ prop: 'lantern', args: [0.38], at: [-1.8, 0.9], look: 'Shuttered all round. A hair of light and no more.' }]),
      text: [
        'True! nervous, very dreadfully nervous I had been and am; but why will you say that I am mad? The disease had sharpened my senses, not destroyed them.',
        'I loved the old man. He had never wronged me. He had never given me insult. For his gold I had no desire. I think it was his eye — a pale blue eye, with a film over it.',
        'And every night for seven nights, about midnight, I turned the latch of his door and opened it — oh, so gently.',
      ],
      choices: [
        { text: 'Open it an inch. No more.', to: 'inch', gives: ['patient'], echo: 'An hour to put my head in. A whole hour.' },
        { text: 'Open it properly. Get it over with.', to: 'wake', gives: ['hasty'], echo: 'The hinge speaks.' },
        { text: 'Stand outside and listen instead.', to: 'listen', gives: ['listened'], echo: 'I can hear him not sleeping.' },
      ],
    },
    {
      id: 'listen',
      scene: landing([{ prop: 'figure', args: ['stand', 1.72, 3], at: [-1.4, 1.4], turn: 2.8, look: 'Not breathing, on purpose, for the better part of an hour.' }]),
      text: [
        'A watch\'s minute hand moves more quickly than did mine. I could hear him through the door, awake, sitting up in the bed as I had done night after night, listening — as I was listening.',
        'He was harkening to the death watches in the wall. He knew. Not what, but that.',
      ],
      choices: [
        { text: 'Go in now, while he is sitting up.', to: 'wake', gives: ['hasty'], echo: 'He does not cry out. He waits.' },
        { text: 'Open it an inch, as on the other nights.', to: 'inch', gives: ['patient'], echo: 'Slowly. Slowly.' },
        { text: 'Go back to my own room. There is always tomorrow.', to: 'nights', echo: 'And an eighth night, and a ninth.' },
      ],
    },
    {
      id: 'inch',
      scene: bedroom(0.35, [
        { prop: 'lantern', args: [0.38], at: [-2.4, 2.6], look: 'One thin ray, and I have an hour of practice at aiming it.' },
        { prop: 'figure', args: ['lie', 1.72, 11], at: [1.5, -1.6], turn: 0, look: 'Asleep. His eye is shut, and a shut eye is nothing to me.' },
      ]),
      text: [
        'It took me an hour to place my whole head within the opening. Would a madman have been so wise as this?',
        'And then, when my head was well in the room, I undid the lantern cautiously — cautiously, for the hinges creaked — and I let a single thin ray fall upon the vulture eye.',
        'And it was closed. And so I could not do the work; for it was not the old man who vexed me, but his Evil Eye.',
      ],
      choices: [
        { text: 'Withdraw. Come again tomorrow.', to: 'nights', gives: ['withdrew'], echo: 'Seven nights become eight.' },
        { text: 'Wait, with the light on his lid, until it opens.', to: 'eye', gives: ['waited'], echo: 'It opens. Of course it opens.' },
        { text: 'Make a small noise, and see.', to: 'wake', gives: ['noise'], echo: 'My thumb slips upon the tin fastening.' },
      ],
    },
    {
      id: 'wake',
      scene: bedroom(0.9, [
        { prop: 'lantern', args: [0.38], at: [-2.4, 2.6] },
        { prop: 'figure', args: ['sit', 1.72, 11], at: [1.5, -1.0], turn: 3.0, look: 'Sitting up in the dark. Not calling out. Listening.' },
      ]),
      text: [
        'He sprang up in bed, crying out — "Who\'s there?"',
        'I kept quite still and said nothing. For a whole hour I did not move a muscle, and in the meantime I did not hear him lie down. He was still sitting up in the bed listening, just as I have done, night after night.',
        'Presently I heard a slight groan, and I knew it was the groan of mortal terror. I knew the sound well. Many a night it has welled up from my own bosom.',
      ],
      choices: [
        { text: 'Wait him out. He must lie down eventually.', to: 'eye', gives: ['waited'], echo: 'The lantern ray goes on to the pillow, and to the lid.' },
        { text: 'Speak to him. Tell him it is only me.', to: 'spoke', gives: ['spoke'], echo: 'My own voice surprises me.' },
        { text: 'Go, and shut the door behind me.', to: 'nights', gives: ['withdrew'], echo: 'He hears me go. He does not sleep.' },
      ],
    },
    {
      id: 'spoke',
      scene: bedroom(1.2, [
        { prop: 'candle', args: [0.3], at: [-2.6, 0.98, 0.4] },
        { prop: 'figure', args: ['sit', 1.72, 11], at: [1.5, -1.0], turn: 3.0 },
        { prop: 'figure', args: ['stand', 1.72, 3], at: [-1.2, 2.0], turn: 3.1, look: 'Explaining. At length. About the eye.' },
      ]),
      text: [
        'I told him. All of it — the seven nights, the hour it takes to put a head through a door, the film over the eye and what it does to me.',
        'He listened. He is an old man and he has been afraid for a week and now he knew what of, and the knowing seemed to steady him.',
        'He said: then we shall have the eye seen to, and we shall have you seen to, and neither of us shall sit up in the dark again. He said it kindly. That was the worst of it.',
      ],
      choices: [
        { text: 'Let him take my hand.', to: 'seen', gives: ['taken'], echo: 'His hand is cold and does not shake.' },
        { text: 'Blow out the candle.', to: 'eye', gives: ['dark'], echo: 'And in the dark the eye is open again, I know it is.' },
      ],
    },
    {
      id: 'eye',
      scene: bedroom(0.9, [
        { prop: 'lantern', args: [0.42], at: [-2.3, 2.5], look: 'The whole ray upon it now, as if by instinct.' },
        { prop: 'figure', args: ['lie', 1.72, 11], at: [1.5, -1.6], turn: 0, look: 'The eye is open. Wide, wide open. I grow furious as I gaze upon it.' },
      ]),
      text: [
        'It was open — wide, wide open — and I grew furious as I gazed upon it. I saw it with perfect distinctness: a dull blue, with a hideous veil over it that chilled the very marrow in my bones.',
        'And now there came to my ears a low, dull, quick sound, such as a watch makes when enveloped in cotton. It was the beating of the old man\'s heart.',
        'It grew quicker and quicker and louder and louder every instant. And the neighbours — would they not hear it?',
      ],
      choices: [
        { text: 'Now.', to: 'boards', gives: ['killed'], echo: 'In an instant I dragged him to the floor and pulled the heavy bed over him.' },
        { text: 'Shutter the lantern. Get out of the room.', to: 'fled', gives: ['fled'], echo: 'The sound comes with me down the stairs.' },
        {
          text: 'It is my own heart. Put my hand on my own chest and count.',
          to: 'counted',
          needs: ['spoke'],
          gives: ['counted'],
          echo: 'One hundred and forty. It has been my heart for a week.',
        },
      ],
    },
    {
      id: 'boards',
      scene: {
        ...landing([
          { prop: 'lantern', args: [0.38], at: [-2.0, 1.4] },
          { prop: 'papers', args: [4, 0.5, 2], at: [0.6, -0.9] },
        ]),
        camera: { from: [3.6, 3.26, 6.55], look: [0.4, 0.5, -1.0], fov: 40 },
      },
      text: [
        'I then took up three planks from the flooring of the chamber, and deposited all between the scantlings. I then replaced the boards so cleverly, so cunningly, that no human eye — not even his — could have detected anything wrong.',
        'There was nothing to wash out. No stain of any kind. No blood-spot whatever. I had been too wary for that. A tub had caught all — ha! ha!',
        'When I had made an end of these labours it was four o\'clock, and still dark as midnight. As the bell sounded the hour, there came a knocking at the street door.',
      ],
      choices: [
        { text: 'Open it. I have nothing to fear.', to: 'police', gives: ['opened'], echo: 'Three officers. A shriek had been heard by a neighbour.' },
        { text: 'Do not answer.', to: 'police', gives: ['ignored'], echo: 'They knock again, and then they try the handle, and it is not locked.' },
      ],
    },
    {
      id: 'police',
      scene: {
        ...landing([
          { prop: 'table', args: [1.5, 0.76, 0.9], at: [0.4, -0.4] },
          { prop: 'chair', args: [0.95], at: [-0.6, 0.9], turn: 0.3 },
          { prop: 'chair', args: [0.95], at: [1.5, 0.7], turn: -0.5 },
          { prop: 'lantern', args: [0.38], at: [0.4, 0.78, -0.4] },
          { prop: 'figure', args: ['stand', 1.74, 41], at: [-1.9, -1.4], turn: 2.4, look: 'Perfectly satisfied. Chatting about the weather.' },
          { prop: 'figure', args: ['stand', 1.74, 43], at: [2.1, -1.2], turn: 3.6 },
          { prop: 'figure', args: ['sit', 1.72, 3], at: [0.5, 1.4], turn: Math.PI, look: 'Sitting directly over the spot. It was my own idea.' },
        ]),
        camera: { from: [4.14, 3.39, 7.01], look: [0.2, 1.0, -0.6], fov: 39 },
      },
      text: [
        'I smiled — for what had I to fear? I bade them search — search well. I led them, at length, to his chamber. I brought chairs here, and desired them to rest from their fatigues.',
        'I, in the wild audacity of my perfect triumph, placed my own seat upon the very spot beneath which reposed the corpse of the victim.',
        'They sat, and chatted of familiar things. But ere long I felt myself getting pale and wished them gone. My head ached and I fancied a ringing in my ears — and it continued, and it became more distinct.',
      ],
      choices: [
        { text: 'Talk louder. Talk over it.', to: 'louder', gives: ['louder'], echo: 'I argued about trifles, in a high key and with violent gesticulations.' },
        { text: 'Say nothing. It is a ringing in my ears and nothing else.', to: 'held', gives: ['held'], echo: 'It is not in my ears. It is under the boards.' },
        {
          text: 'Ask them, quite calmly, whether they can hear it.',
          to: 'asked',
          needs: ['counted'],
          gives: ['asked'],
          echo: 'They look at one another. One of them says: hear what, sir?',
        },
      ],
    },
    {
      id: 'louder',
      scene: {
        ...landing([
          { prop: 'table', args: [1.5, 0.76, 0.9], at: [0.4, -0.4] },
          { prop: 'chair', args: [0.95], at: [-0.6, 0.9], turn: 0.3 },
          { prop: 'lantern', args: [0.38], at: [0.4, 0.78, -0.4] },
          { prop: 'figure', args: ['stand', 1.74, 41], at: [-1.9, -1.4], turn: 2.4 },
          { prop: 'figure', args: ['stand', 1.74, 43], at: [2.1, -1.2], turn: 3.6 },
          { prop: 'figure', args: ['reach', 1.72, 3], at: [0.5, 1.4], turn: Math.PI, look: 'On his feet now. Raving, and pleasant with it.' },
        ]),
        camera: { from: [3.73, 3.16, 6.79], look: [0.3, 1.2, -0.4], fov: 42 },
      },
      text: [
        'I talked more quickly — more vehemently; but the noise steadily increased. I arose and argued about trifles, in a high key and with violent gesticulations; but the noise steadily increased.',
        'Why would they not be gone? I paced the floor to and fro with heavy strides, as if excited to fury by the observations of the men — but the noise steadily increased.',
        'Oh God! what could I do? They heard! — they suspected! — they knew! — they were making a mockery of my horror!',
      ],
      choices: [
        { text: '"Villains! dissemble no more! I admit the deed!"', to: 'confess', gives: ['confessed'], echo: 'I tear up the planks myself.' },
        { text: 'Bite my tongue and hold on. They will leave.', to: 'held', echo: 'They do not leave. They have all night.' },
      ],
    },
    {
      id: 'confess',
      scene: {
        ...landing([
          { prop: 'papers', args: [6, 1.1, 2], at: [0.6, -0.4] },
          { prop: 'figure', args: ['kneel', 1.72, 3], at: [0.5, 0.4], turn: Math.PI, look: 'Tearing up the boards with his hands, and shouting.' },
          { prop: 'figure', args: ['stand', 1.74, 41], at: [-1.9, -1.0], turn: 2.4 },
          { prop: 'figure', args: ['stand', 1.74, 43], at: [2.1, -0.8], turn: 3.6 },
        ]),
        camera: { from: [3.98, 3.21, 6.77], look: [0.4, 0.6, -0.4], fov: 41 },
      },
      text: [
        '"Villains!" I shrieked, "dissemble no more! I admit the deed! — tear up the planks! — here, here! — it is the beating of his hideous heart!"',
        'They had heard nothing. There had been nothing to hear. There is a tub in the cellar and three planks in the floor and a very great deal of care taken, and none of it was ever the point.',
      ],
      choices: [],
      ending: {
        title: 'It is the beating of his hideous heart',
        kind: 'ruin',
        note: 'The story’s own ending. Everything he was proud of — the hour at the door, the tub, the planks — worked perfectly. He gave himself up over a sound that was not there.',
      },
    },
    {
      id: 'held',
      scene: {
        ...landing([
          { prop: 'table', args: [1.5, 0.76, 0.9], at: [0.4, -0.4] },
          { prop: 'chair', args: [0.95], at: [0.5, 1.4], turn: Math.PI },
          { prop: 'lantern', args: [0.38], at: [0.4, 0.78, -0.4] },
          { prop: 'figure', args: ['sit', 1.72, 3], at: [0.5, 1.4], turn: Math.PI, look: 'Sitting where he sat. Still sitting there.' },
        ]),
        camera: { from: [4.24, 3.42, 7.17], look: [0.3, 0.9, -0.4], fov: 39 },
      },
      text: [
        'They went at last, satisfied, and wished me good morning, and I saw them down the stairs and shut the door and stood in the hall.',
        'That was eleven years ago. The house is mine now and I have not taken up the boards and I have not moved the chair.',
        'The sound has never stopped. I do not any longer think it will. But I have found that a man can be got used to almost anything, and that being got used to it is not at all the same as it going away.',
      ],
      choices: [],
      ending: {
        title: 'Eleven years, and the chair has not moved',
        kind: 'riddle',
        note: 'He keeps his nerve and gets away with it, and the story simply carries on being true underneath the floor for the rest of his life.',
      },
    },
    {
      id: 'asked',
      scene: {
        ...landing([
          { prop: 'table', args: [1.5, 0.76, 0.9], at: [0.4, -0.4] },
          { prop: 'chair', args: [0.95], at: [0.5, 1.4], turn: Math.PI },
          { prop: 'figure', args: ['sit', 1.72, 3], at: [0.5, 1.4], turn: Math.PI },
          { prop: 'figure', args: ['stand', 1.74, 41], at: [-1.5, -0.8], turn: 2.2, look: 'Kneeling down beside the chair, not unkindly.' },
        ]),
        camera: { from: [4.32, 3.23, 7.36], look: [0.2, 1.0, -0.2], fov: 39 },
      },
      text: [
        'I asked them whether they could hear it. It seemed a reasonable question and I asked it in a reasonable voice.',
        'One of them knelt down by my chair and asked how long I had been hearing it, and I said a week, and he said: and before the week?',
        'And I found that I could not answer him, because the honest answer was: since I was a boy, and it has never once been anybody else\'s heart.',
      ],
      choices: [],
      ending: {
        title: 'And before the week?',
        kind: 'grace',
        note: 'The only route out of this story is noticing whose heart it is — which the narrator, in Poe, never does.',
      },
    },
    {
      id: 'counted',
      scene: bedroom(1.2, [
        { prop: 'candle', args: [0.3], at: [-2.6, 0.98, 0.4] },
        { prop: 'figure', args: ['sit', 1.72, 11], at: [1.5, -1.0], turn: 3.0 },
        { prop: 'figure', args: ['stand', 1.72, 3], at: [-1.2, 2.0], turn: 3.1, look: 'With his hand flat on his own chest, counting.' },
      ]),
      text: [
        'I put my hand on my chest and counted, and it was a hundred and forty, and it had been a hundred and forty every night for a week.',
        'The old man watched me do it. He did not say anything clever. He said: sit down, and I sat down, and we waited together until it slowed, which took a long time.',
      ],
      choices: [
        { text: 'Stay until morning.', to: 'seen', gives: ['stayed'], echo: 'It gets light at about five.' },
        { text: 'Go back up. I know what the eye is now.', to: 'police', gives: ['knowing'], echo: 'And I know what it is not.' },
      ],
    },
    {
      id: 'fled',
      scene: {
        ...landing([{ prop: 'lantern', args: [0.38], at: [-2.0, 1.6] }, { prop: 'figure', args: ['stand', 1.72, 3], at: [0.6, 2.2], turn: 0.1, look: 'On the landing. Not going up, not going down.' }]),
        camera: { from: [3.97, 3.1, 6.76], look: [0.3, 1.2, -1.4], fov: 38 },
      },
      text: [
        'I shuttered the lantern and got out of the room, and the sound came down the stairs after me and has not left since.',
        'He lived another nine years. I brought him his tea in the mornings and I never once looked at his face, and there is not a court in the country that would call that a crime.',
      ],
      choices: [
        { text: 'Live with it.', to: 'held', echo: 'Which is what I have done.' },
        { text: 'Tell someone. A doctor. Anyone.', to: 'seen', gives: ['told'], echo: 'It takes four years to get the sentence out.' },
      ],
    },
    {
      id: 'seen',
      scene: {
        palette: 'chancery',
        ground: { radius: 5.2, thickness: 1.6, dish: 0, lip: 0, bumps: 0.015, square: true, slot: 'stone' },
        props: [
          { prop: 'boards', args: [9, 9, 3], at: [0, 0] },
          { prop: 'wall', args: [8, 3.4, 0.4, 2], at: [0, -4] },
          { prop: 'window', args: [1.6, 2.0, 1.2], at: [0, -3.75], look: 'Daylight, which I had rather stopped expecting.' },
          { prop: 'chair', args: [0.95], at: [-1.1, 0.4], turn: 0.4 },
          { prop: 'chair', args: [0.95], at: [1.1, 0.4], turn: -0.4 },
          { prop: 'figure', args: ['sit', 1.72, 3], at: [-1.1, 0.4], turn: 0.4 },
          { prop: 'figure', args: ['sit', 1.7, 55], at: [1.1, 0.4], turn: -0.4, look: 'Writing it down. Not alarmed by any of it.' },
        ],
        camera: { from: [3.85, 3.19, 7.43], look: [0, 1.1, -0.6], fov: 38 },
        drift: 0.02,
      },
      text: [
        'It is a long business and a dull one and there is nothing in it that would make a story: a room with a window in it, and a chair, and somebody who has heard all of this before and was not frightened by any of it.',
        'The eye, it turns out, was a cataract. The heart was mine. The seven nights were seven nights of a thing that has a name and is not rare.',
        'I am told the sound may come back. I am told that if it does I am to come here and say so, and that is the whole of the treatment, and it works.',
      ],
      choices: [],
      ending: {
        title: 'A room with a window in it',
        kind: 'grace',
        note: 'The unromantic ending, and the only one in which the old man is alive at the end of it.',
      },
    },
  ],
};
