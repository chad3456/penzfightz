/**
 * Twelve-Point Compass: an original twelve-axis political values model.
 *
 * Every axis runs 0–100 from its first pole to its second. Neither end is
 * "right": the poles are named for what someone at that end wants. Questions
 * are statements answered from strongly disagree to strongly agree; each one
 * pushes a single axis towards one pole.
 */

export type AxisId = 'econ' | 'welfare' | 'trade' | 'liberty' | 'power' | 'center' | 'values' | 'faith' | 'nation' | 'world' | 'force' | 'eco';
export type GroupId = 'economy' | 'state' | 'society' | 'world';

export interface Axis {
  id: AxisId;
  group: GroupId;
  name: string;
  low: string;
  high: string;
  lowNote: string;
  highNote: string;
  question: string;
}

export const GROUPS: { id: GroupId; name: string; note: string }[] = [
  { id: 'economy', name: 'Economy', note: 'Who owns, who pays, who trades' },
  { id: 'state', name: 'State', note: 'How power is held and checked' },
  { id: 'society', name: 'Society', note: 'Family, faith and belonging' },
  { id: 'world', name: 'World', note: 'Allies, arms and the planet' },
];

export const AXES: Axis[] = [
  { id: 'econ', group: 'economy', name: 'Ownership', low: 'Planned', high: 'Market', question: 'Who should run the economy?',
    lowNote: 'Public ownership of key industries and state planning of what gets made.', highNote: 'Private enterprise, competition and prices set by supply and demand.' },
  { id: 'welfare', group: 'economy', name: 'Redistribution', low: 'Self-reliance', high: 'Welfare', question: 'How much should the state share out?',
    lowNote: 'Low taxes, small benefits, and help coming from family, work and charity.', highNote: 'High taxes on high earners, universal services and a strong safety net.' },
  { id: 'trade', group: 'economy', name: 'Trade', low: 'Open', high: 'Protected', question: 'Should borders be open to goods and capital?',
    lowNote: 'Free trade, open investment and buying wherever is cheapest.', highNote: 'Tariffs, home production of strategic goods and limits on foreign ownership.' },
  { id: 'liberty', group: 'state', name: 'Liberty', low: 'Liberty', high: 'Order', question: 'How far should the state police daily life?',
    lowNote: 'Privacy, free speech, the right to protest and personal choices left alone.', highNote: 'Strong policing, surveillance and limits on speech for the sake of security.' },
  { id: 'power', group: 'state', name: 'Power', low: 'Pluralist', high: 'Strongman', question: 'Should power be checked or concentrated?',
    lowNote: 'Competitive elections, independent courts, a free press and term limits.', highNote: 'A strong leader or single party able to act without courts, parliament or press in the way.' },
  { id: 'center', group: 'state', name: 'Centralism', low: 'Local', high: 'Central', question: 'Where should decisions be made?',
    lowNote: 'Federalism, devolution and self-government for regions and cities.', highNote: 'One national government setting one standard for everyone.' },
  { id: 'values', group: 'society', name: 'Morality', low: 'Progressive', high: 'Traditional', question: 'Should social norms change or hold?',
    lowNote: 'Equal marriage, legal abortion and changing ideas of family and gender.', highNote: 'Traditional family, inherited norms and caution about social change.' },
  { id: 'faith', group: 'society', name: 'Faith', low: 'Secular', high: 'Religious', question: 'What place should religion have in public life?',
    lowNote: 'Religion kept out of law, schools and government.', highNote: 'Religious values shaping law, education and national identity.' },
  { id: 'nation', group: 'society', name: 'Belonging', low: 'Cosmopolitan', high: 'National', question: 'Who belongs, and how many should come?',
    lowNote: 'Open immigration, refuge for those in danger and many cultures side by side.', highNote: 'Low immigration, one national culture and citizens first.' },
  { id: 'world', group: 'world', name: 'Sovereignty', low: 'Multilateral', high: 'Sovereign', question: 'Should countries pool power or keep it?',
    lowNote: 'International institutions, treaties, courts and aid.', highNote: 'National decisions free of foreign courts, treaties and bodies.' },
  { id: 'force', group: 'world', name: 'Force', low: 'Restraint', high: 'Force', question: 'When should a country use its military?',
    lowNote: 'Diplomacy, negotiation and caution about arms and war.', highNote: 'Military strength, high defence spending and willingness to use force.' },
  { id: 'eco', group: 'world', name: 'Planet', low: 'Growth', high: 'Ecology', question: 'Growth or the environment, when they clash?',
    lowNote: 'Cheap energy, development and jobs first; technology will handle the rest.', highNote: 'Rapid cuts to emissions and protection of nature, even at a cost to growth.' },
];

export const AXIS = Object.fromEntries(AXES.map((a) => [a.id, a])) as Record<AxisId, Axis>;

export interface Question { id: string; axis: AxisId; dir: 1 | -1; text: string }

/** dir 1: agreeing moves towards the axis's second pole; -1: towards the first. */
const Q: [AxisId, 1 | -1, string][] = [
  ['econ', 1, 'Most industries are run better by private companies than by the government.'],
  ['econ', 1, 'Cutting regulations on business usually does more good than harm.'],
  ['econ', 1, 'Prices set by supply and demand are fairer than prices set by officials.'],
  ['econ', -1, 'Key industries such as energy and railways should be publicly owned.'],
  ['econ', -1, 'The government should plan which parts of the economy grow.'],
  ['econ', -1, 'Companies that dominate their market should be broken up or brought under public control.'],
  ['welfare', 1, 'Healthcare should be free when you use it, paid for through taxes.'],
  ['welfare', 1, 'People with very high incomes should pay a much larger share of tax.'],
  ['welfare', 1, 'Unemployment benefits should be enough to live on decently.'],
  ['welfare', -1, 'Welfare payments mostly discourage people from working.'],
  ['welfare', -1, 'Families, charities and communities should look after the poor more than the state does.'],
  ['welfare', -1, 'Lower taxes for everyone are better than more public services.'],
  ['trade', 1, 'Tariffs on imports are a good way to protect jobs at home.'],
  ['trade', 1, 'Medicine, chips and steel should be made at home even if that costs more.'],
  ['trade', 1, 'Foreign companies should face limits on buying domestic firms and land.'],
  ['trade', -1, 'Free trade agreements make most people better off.'],
  ['trade', -1, 'Shoppers should be free to buy the cheapest goods, wherever they are made.'],
  ['trade', -1, 'Factories moving abroad is a normal part of a healthy economy.'],
  ['liberty', 1, 'Police should get more powers, even if that means less privacy.'],
  ['liberty', 1, 'Mass surveillance is acceptable if it prevents terrorism and crime.'],
  ['liberty', 1, 'Offensive or dangerous speech should be restricted by law.'],
  ['liberty', -1, 'Adults should be free to use drugs as long as they harm no one else.'],
  ['liberty', -1, 'Protest should be allowed even when it disrupts daily life.'],
  ['liberty', -1, 'The state should need a judge’s warrant to read anyone’s messages.'],
  ['power', 1, 'A country sometimes needs a strong leader who can act without waiting for parliament or the courts.'],
  ['power', 1, 'Results matter more than elections; a capable government is what counts.'],
  ['power', 1, 'One party governing for decades can give a country useful stability.'],
  ['power', -1, 'Courts must be able to overrule the government.'],
  ['power', -1, 'A free press that attacks the government is essential, even when it is unfair.'],
  ['power', -1, 'Leaders should face strict limits on how long they can stay in office.'],
  ['center', 1, 'The national government should set school and health policy for the whole country.'],
  ['center', 1, 'Regions should never be allowed to break away from the country.'],
  ['center', 1, 'One national rule is better than letting each region make its own laws.'],
  ['center', -1, 'Cities and regions should raise and spend most of their own taxes.'],
  ['center', -1, 'Decisions should be taken at the most local level possible.'],
  ['center', -1, 'Regions with their own identity deserve wide self-government.'],
  ['values', 1, 'Marriage should be between one man and one woman.'],
  ['values', 1, 'Children do best with a mother and a father at home.'],
  ['values', 1, 'Ideas about gender have changed too fast.'],
  ['values', -1, 'Same-sex couples should have the same rights to marry and adopt as anyone else.'],
  ['values', -1, 'Abortion should be legal in early pregnancy.'],
  ['values', -1, 'Traditions should be dropped when they no longer serve people.'],
  ['faith', 1, 'Religious values should guide the country’s laws.'],
  ['faith', 1, 'Schools should teach children a religion.'],
  ['faith', 1, 'A nation needs a shared faith to hold it together.'],
  ['faith', -1, 'Religion should be kept out of government entirely.'],
  ['faith', -1, 'Religious leaders should stay out of politics.'],
  ['faith', -1, 'Insulting a religion should never be a crime.'],
  ['nation', 1, 'Immigration should be sharply reduced.'],
  ['nation', 1, 'Newcomers should adopt the national culture rather than keep their own.'],
  ['nation', 1, 'Citizens should get priority over foreigners for jobs and housing.'],
  ['nation', -1, 'Immigration enriches a country’s culture.'],
  ['nation', -1, 'People fleeing danger should be welcomed, even in large numbers.'],
  ['nation', -1, 'I feel more a citizen of the world than of my own country.'],
  ['world', 1, 'International courts and bodies should have no power over my country’s laws.'],
  ['world', 1, 'My country should leave international agreements that limit its choices.'],
  ['world', 1, 'Foreign aid is mostly money wasted.'],
  ['world', -1, 'Global problems need global institutions with real powers.'],
  ['world', -1, 'My country should accept the rulings of international courts, even against it.'],
  ['world', -1, 'Rich countries should give more aid to poorer ones.'],
  ['force', 1, 'A strong military is the best guarantee of peace.'],
  ['force', 1, 'It is sometimes right to use force to change another country’s government.'],
  ['force', 1, 'Defence spending should rise even if other spending must fall.'],
  ['force', -1, 'Wars almost always cause more harm than they prevent.'],
  ['force', -1, 'Disputes between countries should be settled by talks, even with hostile regimes.'],
  ['force', -1, 'My country should stop selling weapons abroad.'],
  ['eco', 1, 'Fighting climate change should come before economic growth.'],
  ['eco', 1, 'Fossil fuels should be phased out quickly, even if energy costs more.'],
  ['eco', 1, 'Protected nature should stay protected, whatever developers offer.'],
  ['eco', -1, 'Environmental rules hold back jobs and development.'],
  ['eco', -1, 'Poorer countries should be free to burn coal and oil to grow, as rich ones did.'],
  ['eco', -1, 'Technology will solve environmental problems without changing how we live.'],
];

// a fixed shuffle so axes are mixed, the same order for everyone
function shuffled<T>(xs: T[], seed: number): T[] {
  const a = xs.slice();
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const QUESTIONS: Question[] = shuffled(Q.map(([axis, dir, text], i) => ({ id: `q${i + 1}`, axis, dir, text })), 20261031);

export const CHOICES = [
  { v: 2, label: 'Strongly agree' },
  { v: 1, label: 'Agree' },
  { v: 0, label: 'Neutral' },
  { v: -1, label: 'Disagree' },
  { v: -2, label: 'Strongly disagree' },
] as const;

export type Answers = Record<string, number | null>; // null = not sure (skipped)
export type Scores = Record<AxisId, number | null>;

/** 0–100 per axis; null where every question on it was skipped. */
export function score(answers: Answers): Scores {
  const out = {} as Scores;
  for (const a of AXES) {
    const qs = QUESTIONS.filter((q) => q.axis === a.id && answers[q.id] != null);
    if (!qs.length) { out[a.id] = null; continue; }
    const sum = qs.reduce((s, q) => s + (answers[q.id] as number) * q.dir, 0);
    out[a.id] = Math.round(50 + (50 * sum) / (2 * qs.length));
  }
  return out;
}

export function band(v: number, a: Axis) {
  if (v <= 15) return `Strongly ${a.low.toLowerCase()}`;
  if (v <= 38) return `Leans ${a.low.toLowerCase()}`;
  if (v < 62) return 'Centre';
  if (v < 85) return `Leans ${a.high.toLowerCase()}`;
  return `Strongly ${a.high.toLowerCase()}`;
}

export type Vec = number[]; // 12 values in AXES order

export const toVec = (s: Scores): (number | null)[] => AXES.map((a) => s[a.id]);

/** Similarity 0–100 over the axes both sides have. */
export function similarity(a: (number | null)[], b: Vec) {
  let d = 0, n = 0;
  a.forEach((v, i) => { if (v != null) { d += (v - b[i]) ** 2; n++; } });
  if (!n) return 0;
  const rms = Math.sqrt(d / n); // 0 (same) .. 100 (opposite ends)
  return Math.max(0, Math.round(100 - rms * 1.25));
}

export interface Family { id: string; name: string; note: string; v: Vec }

/** Broad families of political thought, placed as typical positions. */
export const FAMILIES: Family[] = [
  { id: 'demsoc', name: 'Democratic socialism', note: 'Public ownership and a large welfare state, won through elections.', v: [20, 88, 60, 30, 20, 50, 25, 20, 30, 35, 20, 80] },
  { id: 'socdem', name: 'Social democracy', note: 'A market economy with high taxes, strong unions and universal services.', v: [40, 75, 40, 35, 20, 50, 30, 25, 35, 25, 35, 65] },
  { id: 'soclib', name: 'Social liberalism', note: 'Markets plus a safety net, open borders to trade and people, socially progressive.', v: [55, 60, 25, 30, 20, 45, 20, 20, 30, 20, 40, 65] },
  { id: 'centrist', name: 'Technocratic centrism', note: 'Pragmatic, pro-institution and pro-integration, cautious on both left and right.', v: [60, 50, 25, 45, 25, 55, 35, 25, 40, 15, 50, 55] },
  { id: 'classlib', name: 'Classical liberalism', note: 'Free markets, limited government and individual freedom.', v: [80, 30, 15, 30, 20, 35, 40, 35, 40, 40, 45, 40] },
  { id: 'libertarian', name: 'Libertarianism', note: 'The smallest possible state in both the economy and private life.', v: [95, 10, 10, 10, 15, 15, 40, 30, 40, 60, 25, 25] },
  { id: 'chrdem', name: 'Christian democracy', note: 'A social market economy guided by Christian ideas of family and community.', v: [62, 55, 35, 50, 25, 40, 65, 65, 50, 30, 50, 50] },
  { id: 'conservative', name: 'Conservatism', note: 'Markets, tradition, order and gradual change.', v: [72, 35, 40, 62, 30, 55, 72, 60, 62, 50, 62, 35] },
  { id: 'natcon', name: 'National conservatism', note: 'Nation, faith and family first, sceptical of global bodies and migration.', v: [55, 45, 70, 72, 55, 70, 82, 68, 85, 78, 65, 30] },
  { id: 'rpop', name: 'Right-wing populism', note: 'The people against elites, with tight borders and protected industry.', v: [55, 50, 80, 75, 62, 65, 75, 58, 90, 82, 60, 22] },
  { id: 'lpop', name: 'Left-wing populism', note: 'The people against elites, with redistribution and economic sovereignty.', v: [25, 80, 72, 45, 55, 60, 40, 35, 50, 70, 30, 50] },
  { id: 'green', name: 'Green politics', note: 'Ecology first, with local democracy, peace and social justice.', v: [40, 70, 45, 25, 15, 25, 15, 15, 25, 15, 10, 95] },
  { id: 'anarchism', name: 'Anarchism', note: 'No state and no bosses: voluntary, local cooperation.', v: [15, 70, 40, 0, 0, 0, 10, 5, 5, 30, 5, 75] },
  { id: 'develop', name: 'Developmental authoritarianism', note: 'A strong state steering growth, order before freedom.', v: [55, 35, 55, 92, 92, 90, 70, 55, 75, 65, 80, 25] },
  { id: 'ml', name: 'Marxism–Leninism', note: 'One-party rule and a state-owned, planned economy.', v: [5, 65, 85, 95, 98, 95, 40, 5, 60, 80, 80, 25] },
  { id: 'theocracy', name: 'Theocracy', note: 'Religious law and clerical authority over the state.', v: [35, 50, 70, 95, 92, 85, 95, 100, 65, 85, 75, 30] },
];

/** Compact share code: one base-36 pair per axis, '--' for an axis left blank. */
export function encode(v: (number | null)[]) {
  return 'c1' + v.map((x) => (x == null ? '--' : Math.max(0, Math.min(100, x)).toString(36).padStart(2, '0'))).join('');
}
export function decode(code: string): (number | null)[] | null {
  const m = /^c1([0-9a-z-]{24})$/i.exec(code.trim());
  if (!m) return null;
  const out: (number | null)[] = [];
  for (let i = 0; i < 24; i += 2) {
    const s = m[1].slice(i, i + 2);
    if (s === '--') { out.push(null); continue; }
    const n = parseInt(s, 36);
    if (isNaN(n) || n > 100) return null;
    out.push(n);
  }
  return out;
}
