import { rng } from '../cards/ink';

/**
 * What is said, and who says it.
 *
 * *White Nights* is four nights and a morning in Petersburg in 1848, and it is
 * a two-hander: a young man who has never spoken to anybody, and a girl on the
 * embankment who is waiting for somebody else. Everything either of them says
 * is in one of a small number of registers — the dreamer explaining himself at
 * enormous length, Nastenka being kind and then being honest, and the third
 * thing that keeps happening, which is somebody saying more than they meant to.
 *
 * A handful of lines below are Dostoevsky's, in Constance Garnett's 1918
 * translation; both the original and that translation are long out of
 * copyright. The rest is a grammar in the same register, because a thousand
 * cards need a thousand lines and forty repeated eighteen times is not a deck.
 */

export type Voice = 'nastenka' | 'dreamer';

export interface Line {
  text: string;
  voice: Voice;
  /** Which of the five parts of the book it belongs to. */
  night: 0 | 1 | 2 | 3 | 4;
  seed: number;
}

export const NIGHTS = ['First Night', 'Second Night', 'Third Night', 'Fourth Night', 'Morning'] as const;

/** Dostoevsky's, and marked as his wherever one comes up. */
const QUOTED: [string, Voice, 0 | 1 | 2 | 3 | 4][] = [
  ['My God! A whole moment of happiness! Is that too little for the whole of a man’s life?', 'dreamer', 4],
  ['And so you are not angry with me?', 'nastenka', 1],
  ['I am a dreamer. I have so little real life that I look upon such moments as this now, as so rare, that I cannot help going over such moments again in my dreams.', 'dreamer', 1],
  ['Oh, how sad it is to be alone, quite alone, with not even anyone to regret.', 'dreamer', 0],
  ['Why are we not all like brothers to one another?', 'dreamer', 0],
  ['I love you because you have not fallen in love with me.', 'nastenka', 2],
  ['But how could you help knowing that I should love you like this?', 'nastenka', 3],
  ['You are better than he is. You are nearer to me.', 'nastenka', 3],
  ['Forgive me, forgive me! It was my fault. I have wounded you.', 'nastenka', 4],
  ['I did not want to say it. It said itself.', 'nastenka', 2],
  ['Do not remember it against me. Remember the other thing.', 'nastenka', 4],
  ['Listen, why are we not all like brothers? Why does even the best of us seem to hide something?', 'dreamer', 1],
];

const HER_HOPE = [
  'He said a year. It is a year, and three days over, and I am counting the days like a shopkeeper.',
  'If he comes tonight I shall not say a word about the waiting. Not one.',
  'I have decided to be pleased with whatever happens, and I have decided it four times today.',
  'Grandmother pinned me to her dress with a pin. I have had a great deal of time to think.',
  'I am not unhappy. I am only used to a particular unhappiness and now it has changed.',
  'When I am afraid I count the lamps along the embankment. There are nineteen.',
  'You may laugh, but I have rehearsed the whole conversation and in it he is very kind.',
  'He is not late. It is I who am early, and I have been early for eleven months.',
];

const HER_KINDNESS = [
  'Sit down. You are shaking, and it is not cold.',
  'You talk as if nobody had ever listened to you. Somebody is listening now.',
  'You are not to apologise again. That is the third time.',
  'I shall be your friend, and you are not allowed to make anything more of it than that.',
  'Tell it properly, from the beginning, and do not skip the part you are ashamed of.',
  'Do not stand so far off. I cannot be kind to you at that distance.',
  'You have a way of saying the saddest things as though they were arrangements.',
  'I am going to be very frank with you and you must not take it as unkindness.',
];

const HER_TURN = [
  'I am sorry. I did not know until I saw him that I still knew.',
  'You have been better to me in four nights than he was in a year, and I am going to him.',
  'I shall write to you. You will hate the letter and you will keep it.',
  'Do not look at me like that. I cannot bear to be forgiven so quickly.',
  'It was true when I said it. It is still true. It is only not the truest thing.',
  'You will be happy. I am saying it so that one of us has said it.',
  'I would take it back if taking it back would leave anything standing.',
  'You must not be alone tonight. Promise me, and then let go of my hand.',
];

const HIS_SPEECH = [
  'I have lived in this city eight years and I know the houses better than the people. I nod to a house on the canal.',
  'Nobody has asked me a question since April. You have asked me two.',
  'I am not a person exactly. I am a sort of long habit of walking about.',
  'When I am happy I begin at once to compose the account of it, which spoils it.',
  'I have had whole friendships with women who never turned round.',
  'A dreamer is not a man. He is a creature of the neuter gender, and he takes rooms.',
  'I shall remember this bridge for the rest of my life, and I am aware how absurd that is to say aloud.',
  'You are the first thing that has happened to me instead of being imagined.',
];

const HIS_LOVE = [
  'I am not asking for anything. I want that understood before I say the rest.',
  'I have been in love with you since the second night, which is a ridiculous thing to have measured.',
  'Let me be near you and I will not once mention it. I have had practice at not mentioning things.',
  'If you go, I shall not be worse off than before. I shall only know what before was.',
  'I would rather be the one you tell about him than not be told anything.',
  'Do not be sorry. Being pitied by you is still being thought about by you.',
  'One moment of this is enough for a whole life. I have checked, and it is.',
  'I shall not follow you. I want you to know that I thought about it and decided not to.',
];

const HIS_ALONE = [
  'The old woman is pinned to her chair and I am pinned to my window, and neither of us complains.',
  'My room has grown dusty in a way that feels like a judgment.',
  'Tomorrow I shall be fifteen years older and it will not have taken any time at all.',
  'I have a whole city of people I have never spoken to, and I miss them.',
  'It rained, and I was glad, because the rain gave me something to be in.',
  'I am going home to tell the walls about you, and they will be pleased for me.',
  'Do not pity me. I have arranged my life so that pity is the only thing that reaches it.',
  'Even now I am watching myself be unhappy, and finding it well done.',
];

const PLACE = [
  'on the embankment',
  'by the canal',
  'under the lamp at the bridge',
  'at the corner where the shops end',
  'on the Nevsky, in the wet',
  'outside the house with the green shutters',
  'at the third bench from the ironwork',
  'where the water goes under',
];

const WEATHER = [
  'The whole sky went the colour of the inside of a shell.',
  'It was light at midnight and nobody could sleep, and nobody minded.',
  'The wind came off the water and I was glad of a reason to stand closer.',
  'There was that white light that makes everybody look as though they had been forgiven.',
  'The lamps were lit and doing nothing, because it never got dark.',
  'It rained for a minute and stopped, as if it had thought better of it.',
];

const OPENERS: [string, Voice, 0 | 1 | 2 | 3 | 4][] = [
  ['I stood %P for an hour and did not think of one sensible thing.', 'dreamer', 0],
  ['You were %P again tonight. I have seen you there three times.', 'dreamer', 0],
  ['Do not walk behind me %P. Walk beside me, or go home.', 'nastenka', 0],
  ['%W And then you spoke to me, and ruined it, and improved it.', 'nastenka', 1],
  ['%W I have decided that this counts as a happy evening.', 'dreamer', 2],
  ['%W You said nothing for a long time and I liked you for it.', 'nastenka', 2],
];

const pick = <T,>(l: T[], r: () => number) => l[Math.floor(r() * l.length) % l.length];

/**
 * A thousand of them, deterministic and unique.
 *
 * The night a line belongs to is not decorative: the staging reads it, so the
 * first night is a stranger on a bridge and the fourth is two people who have
 * run out of ways to avoid saying it.
 */
export function lines(count: number, seed = 5): Line[] {
  const out: Line[] = [];
  const seen = new Set<string>();
  const banks: [string[], Voice, (0 | 1 | 2 | 3 | 4)[]][] = [
    [HER_HOPE, 'nastenka', [0, 1, 2]],
    [HER_KINDNESS, 'nastenka', [1, 2]],
    [HER_TURN, 'nastenka', [3, 4]],
    [HIS_SPEECH, 'dreamer', [0, 1]],
    [HIS_LOVE, 'dreamer', [2, 3]],
    [HIS_ALONE, 'dreamer', [0, 4]],
  ];
  let i = 0;
  let guard = 0;
  while (out.length < count && guard++ < count * 60) {
    const r = rng(seed * 8191 + i * 65537);
    const k = i % (banks.length + 2);
    i++;
    let text: string;
    let voice: Voice;
    let night: 0 | 1 | 2 | 3 | 4;
    if (k === banks.length) {
      const [t, v, n] = QUOTED[Math.floor(r() * QUOTED.length) % QUOTED.length];
      text = t;
      voice = v;
      night = n;
    } else if (k === banks.length + 1) {
      const [t, v, n] = pick(OPENERS, r);
      text = t.replace('%P', pick(PLACE, r)).replace('%W', pick(WEATHER, r));
      voice = v;
      night = n;
    } else {
      const [bank, v, nights] = banks[k];
      text = pick(bank, r);
      voice = v;
      night = pick(nights, r);
      // A second clause, sometimes, from the neighbouring register: two short
      // sentences in one hand is what a written line of dialogue looks like,
      // and it is also where most of the thousand come from.
      if (r() < 0.66) {
        const other = banks[(k + Math.floor(r() * banks.length)) % banks.length];
        if (other[1] === v) {
          const second = pick(other[0], r);
          if (second !== text) text += ' ' + second;
        }
      }
      // The white nights are the title, so the weather is allowed to open a
      // line — and it is also where the last few hundred distinct captions
      // come from, since the grammar without it tops out below a thousand.
      if (r() < 0.34) text = pick(WEATHER, r) + ' ' + text;
    }
    if (seen.has(text)) continue;
    seen.add(text);
    out.push({ text, voice, night, seed: seed * 41 + i * 7 });
  }
  return out;
}

/** Whether a line is Dostoevsky's own, so the card can say so. */
export function quoted(text: string): boolean {
  return QUOTED.some(([t]) => t === text);
}

/** How many distinct lines this grammar can make. */
export function capacity(): number {
  return lines(5000, 5).length;
}
