import type { CardId } from './cards';
import { census, weight, type Run } from './engine';

/**
 * The reading.
 *
 * Ten positions, matched against the deck you finished with rather than against
 * a tally of good deeds — because the deck *is* the argument. A person is not
 * what they intended; they are the residue of what they repeatedly did, which
 * is the one thing both of these men agree about completely.
 *
 * Every reading is written to be uncomfortable. None of them is a win. Two of
 * them are the ones everybody is aiming at and both come with a bill attached.
 */

export interface Reading {
  id: string;
  name: string;
  /** Which cards it is made of, and how much each counts. */
  of: Partial<Record<CardId, number>>;
  /** Extra weight from guilt carried; negative if the position needs a clean deck. */
  guilt?: number;
  /** Extra weight from worldly standing. */
  standing?: number;
  /** Only reachable if you confessed, or only if you did not. */
  requires?: 'confessed' | 'unconfessed';
  verdict: string;
  d: string;
  n: string;
}

export const READINGS: Reading[] = [
  {
    id: 'extraordinary',
    name: 'The Extraordinary Man',
    of: { contempt: 3, will: 2, cunning: 1, pride: 1 },
    guilt: 2,
    standing: 1,
    requires: 'unconfessed',
    verdict:
      'You held that the line does not apply to everyone, you found out you were willing, and you have not told anybody. The theory did its work: not the work of building anything, the work of getting you across.',
    d: 'He never argues with the theory. He puts a man inside it for four hundred pages and lets you watch the arithmetic stop helping.',
    n: 'And the great thing you were going to make with the permission — where is it? You wanted to be allowed. Being allowed is not a project.',
  },
  {
    id: 'sonya',
    name: 'The One Who Waits',
    of: { mercy: 3, sacrifice: 3, faith: 2, pity: 1 },
    standing: -1,
    verdict:
      'You spent it on other people, in small unglamorous instalments, over years, and it is not clear that anything was fixed. You would do it again, which is the part nobody else can account for.',
    d: 'This is the only kind of person he ever fully trusts, and he never makes them clever, and he never lets them win an argument.',
    n: 'I will not sneer at it. I will only ask whether you chose this or were handed it, because from outside the two look identical and from inside they do not.',
  },
  {
    id: 'underground',
    name: 'The Underground Man',
    of: { spite: 3, silence: 3, doubt: 1 },
    verdict:
      'You are entirely right about everything and it has cost you every room you were ever in. The clarity is real. It has never once been put to any use.',
    d: 'He is not warning you about this person. He wrote him from the inside and did not give himself an exit.',
    n: 'Ressentiment become creative: unable to act, it makes values instead, and calls the inability depth.',
  },
  {
    id: 'zarathustra',
    name: 'The One Who Went Up',
    of: { will: 3, laughter: 3, defiance: 2, pride: 1 },
    guilt: -1,
    verdict:
      'You stopped asking permission, and — this is the rarer half — you stopped needing anyone to be smaller for it. What you built with the room is a separate question and you have started on it.',
    d: 'And who is with you? He would ask that first and he would ask it again.',
    n: 'Yes. Now the difficult part, which is that this is not an achievement but a condition, and it has to be true again tomorrow.',
  },
  {
    id: 'lastman',
    name: 'The Last Man',
    of: { reason: 3, silence: 2, cunning: 1 },
    standing: 2,
    guilt: -1,
    verdict:
      'It went well. It went well by every measure available, including the ones you chose, and you would struggle to name a single thing in it you would defend to somebody who wasn’t already convinced.',
    d: 'He does not despise comfort. He despises the arrangement where nothing in you is permitted to ask for anything.',
    n: 'One has one’s little pleasure for the day and one’s little pleasure for the night. And one blinks.',
  },
  {
    id: 'priest',
    name: 'The Ascetic',
    of: { duty: 3, faith: 2, sacrifice: 1 },
    guilt: 3,
    requires: 'unconfessed',
    verdict:
      'You carried it, and you found a way to make the carrying mean something, and the meaning has become the reason to keep carrying. It is load-bearing now.',
    d: 'Suffering does not automatically purify anybody. He says so plainly, in his own voice, more than once.',
    n: 'Here is the whole trick of the ascetic ideal: the problem was never suffering, it was suffering *without a reason*. Give it one and people will take any amount.',
  },
  {
    id: 'ivan',
    name: 'The One Who Returned the Ticket',
    of: { doubt: 3, defiance: 2, reason: 2 },
    verdict:
      'You will not sign. Not because you have a better account of it, but because you have read the terms and they include a child, and no total is going to make that a line item.',
    d: 'He gave the objection to Ivan and gave it the best writing in the book and never answered it in argument. Alyosha kisses him. That is the reply.',
    n: 'A refusal addressed to a management you have already declared does not exist. Very moral of you, and still theology.',
  },
  {
    id: 'alyosha',
    name: 'The One Who Stayed',
    of: { pity: 2, faith: 2, duty: 2, confession: 3, mercy: 1 },
    requires: 'confessed',
    verdict:
      'You said it out loud, to somebody, and paid what it cost, and then went back the next day. Nothing was resolved. You were in the room.',
    d: 'Everyone is responsible to everyone for everything, and he means it as a description of how things are, not a rule you could be graded on.',
    n: 'You have discharged a debt in suffering and felt it close. That relief is real, and it is manufactured, and both of those are true at once.',
  },
  {
    id: 'inquisitor',
    name: 'The Grand Inquisitor',
    of: { reason: 2, cunning: 3, contempt: 1, duty: 1 },
    standing: 2,
    verdict:
      'You took the decisions off people who did not want them and you were right that they did not want them. It works. It will go on working, and in the third generation nobody will remember what was traded.',
    d: 'He gives him the best speech in the book, no rebuttal, and one kiss — and the Inquisitor lets the prisoner go and does not change his mind.',
    n: 'A herd, well kept. Nothing will be made here again, but nothing will be lost either, and that is the offer.',
  },
  {
    id: 'amorfati',
    name: 'Amor Fati',
    of: { will: 2, laughter: 2, sacrifice: 2, mercy: 1, faith: 1 },
    guilt: -1,
    verdict:
      'Not that it was worth it — that is a different and cheaper claim. That you would have it again, in the same order, with the same losses in the same places, and not to grit your teeth through it but to want it.',
    d: 'He watched people say this and mean it. He also watched people say it because the alternative was admitting it had been for nothing, and he could always tell the difference.',
    n: 'My formula for greatness: not to bear what is necessary, still less to conceal it, but to love it.',
  },
];

export function read(run: Run): Reading {
  const counts = new Map<CardId, number>();
  for (const { id, n } of census(run)) counts.set(id, n);
  const g = weight(run);
  const clean = run.confessions > 0;

  let best = READINGS[0];
  let bestScore = -Infinity;
  for (const r of READINGS) {
    if (r.requires === 'confessed' && !clean) continue;
    if (r.requires === 'unconfessed' && clean) continue;
    let score = 0;
    for (const [id, w] of Object.entries(r.of)) score += (counts.get(id as CardId) ?? 0) * (w as number);
    score += (r.guilt ?? 0) * g;
    score += (r.standing ?? 0) * run.standing * 0.6;
    // Amor fati is only available to somebody who actually said yes.
    if (r.id === 'amorfati' && run.again !== true) score -= 40;
    if (r.id === 'lastman' && run.again === true) score -= 6;
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return best;
}
