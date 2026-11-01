/**
 * The 8values test (MIT, see eightvalues-data.ts): four axes, each scored
 * 0–100 towards the first-named value, as the original site does. Anything
 * placed on the twelve Compass axes can also be projected onto these four,
 * so leaders, countries and families can be compared here too.
 */
import { EV_IDEOLOGIES, EV_QUESTIONS } from './eightvalues-data';

export type EVAxisId = 'econ' | 'dipl' | 'govt' | 'scty';
export interface EVAxis { id: EVAxisId; name: string; high: string; low: string; labels: string[] }

/** high = the value at 100 (left on the original site). */
export const EV_AXES: EVAxis[] = [
  { id: 'econ', name: 'Economic', high: 'Equality', low: 'Markets', labels: ['Communist', 'Socialist', 'Social', 'Centrist', 'Market', 'Capitalist', 'Laissez-Faire'] },
  { id: 'dipl', name: 'Diplomatic', high: 'World', low: 'Nation', labels: ['Cosmopolitan', 'Internationalist', 'Peaceful', 'Balanced', 'Patriotic', 'Nationalist', 'Chauvinist'] },
  { id: 'govt', name: 'Civil', high: 'Liberty', low: 'Authority', labels: ['Anarchist', 'Libertarian', 'Liberal', 'Moderate', 'Statist', 'Authoritarian', 'Totalitarian'] },
  { id: 'scty', name: 'Societal', high: 'Progress', low: 'Tradition', labels: ['Revolutionary', 'Very Progressive', 'Progressive', 'Neutral', 'Traditional', 'Very Traditional', 'Reactionary'] },
];

export const EV_CHOICES = [
  { v: 1, label: 'Strongly agree' },
  { v: 0.5, label: 'Agree' },
  { v: 0, label: 'Neutral / unsure' },
  { v: -0.5, label: 'Disagree' },
  { v: -1, label: 'Strongly disagree' },
] as const;

export const EV_QUESTIONS_LIST = EV_QUESTIONS.map((q, i) => ({ id: `e${i + 1}`, ...q }));
export type EVAnswers = Record<string, number>;
export type EVVec = [number, number, number, number]; // econ, dipl, govt, scty

/** The original formula: 100 × (max + score) / (2 × max), over every question. */
export function evScore(answers: EVAnswers): EVVec {
  const out: number[] = [];
  for (const a of EV_AXES) {
    let max = 0, s = 0;
    for (const q of EV_QUESTIONS_LIST) {
      max += Math.abs(q.effect[a.id]);
      s += (answers[q.id] ?? 0) * q.effect[a.id];
    }
    out.push(Math.round((1000 * (max + s)) / (2 * max)) / 10);
  }
  return out as EVVec;
}

/** The original site's label bands. */
export function evLabel(v: number, a: EVAxis) {
  if (v > 90) return a.labels[0];
  if (v > 75) return a.labels[1];
  if (v > 60) return a.labels[2];
  if (v >= 40) return a.labels[3];
  if (v >= 25) return a.labels[4];
  if (v >= 10) return a.labels[5];
  return a.labels[6];
}

/** Nearest 8values ideology, with the original's distance weights. */
export function evIdeology(v: EVVec) {
  let best = EV_IDEOLOGIES[0], bd = Infinity;
  for (const i of EV_IDEOLOGIES) {
    const d = Math.abs(i.stats.econ - v[0]) ** 2 + Math.abs(i.stats.govt - v[2]) ** 2 + Math.abs(i.stats.dipl - v[1]) ** 1.73856063 + Math.abs(i.stats.scty - v[3]) ** 1.73856063;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

const avg = (...xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const r1 = (x: number) => Math.round(x * 10) / 10;

/**
 * Twelve Compass axes → the four 8values axes. A projection, not a measurement:
 * Equality from ownership, redistribution and (lightly) protection; World from
 * belonging, sovereignty and force; Liberty from liberty, power and centralism;
 * Progress from morality, faith and ecology.
 */
export function project12(v: (number | null)[]): EVVec {
  const g = (i: number) => v[i] ?? 50;
  const [econ, welfare, trade, liberty, power, center, values, faith, nation, world, force, eco] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(g);
  return [
    r1(0.45 * (100 - econ) + 0.45 * welfare + 0.1 * trade),
    r1(avg(100 - nation, 100 - world, 100 - force)),
    r1(0.425 * (100 - liberty) + 0.425 * (100 - power) + 0.15 * (100 - center)),
    r1(avg(100 - values, 100 - faith, eco)),
  ];
}

/** Similarity 0–100 between two 8values results. */
export function evSimilarity(a: EVVec, b: EVVec) {
  const rms = Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0) / 4);
  return Math.max(0, Math.round(100 - rms * 1.25));
}

export function evEncode(v: EVVec) { return 'e1' + v.map((x) => Math.round(x * 10).toString(36).padStart(3, '0')).join(''); }
export function evDecode(code: string): EVVec | null {
  const m = /^e1([0-9a-z]{12})$/i.exec(code.trim());
  if (!m) return null;
  const v = [0, 3, 6, 9].map((i) => parseInt(m[1].slice(i, i + 3), 36) / 10);
  return v.some((x) => isNaN(x) || x > 100) ? null : (v as EVVec);
}

export { EV_IDEOLOGIES };
