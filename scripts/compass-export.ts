/**
 * Writes the Twelve-Point Compass data as JSON, one file per country and per
 * family of thought, plus all leaders, into public/compass-data/.
 * Run: node_modules/.bin/rolldown scripts/compass-export.ts --platform node --format esm --file /tmp/compass-export.mjs && node /tmp/compass-export.mjs
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { AXES, FAMILIES, similarity } from '../src/compass/model';
import { LEADERS, CHECKED } from '../src/compass/leaders';
import { COUNTRIES, COUNTRY_BY_NAME, SAMESEX_LABEL, DEATH_LABEL, CONSCRIPTION_LABEL, ABORTION_LABEL, WORLD_MILEX } from '../src/compass/countries';
import { EV_AXES, evIdeology, project12 } from '../src/compass/eightvalues';
import { INDIA_QUESTIONS, INDIA_TRIVIA } from '../src/compass/india';
import { AUTHORS, band, lensScore, srcLabel } from '../src/compass/authors';
import { INDIA_PARTIES } from '../src/compass/india-people';
import { INDICATORS, SOC_AXES, SOC_TOTAL, STANCES, STANCE_TOPICS, countryAxes, valueOf } from '../src/compass/social';

const out = 'public/compass-data';
rmSync(out, { recursive: true, force: true });
for (const d of ['countries', 'ideologies']) mkdirSync(`${out}/${d}`, { recursive: true });

const axes = (v: number[]) => Object.fromEntries(AXES.map((a, i) => [a.id, { name: a.name, low: a.low, high: a.high, value: v[i] }]));
const ev = (v: number[]) => { const p = project12(v); return { ...Object.fromEntries(EV_AXES.map((a, i) => [a.id, { name: `${a.high} (vs ${a.low})`, value: p[i] }])), nearest8valuesIdeology: evIdeology(p).name, note: 'Projected from the twelve-axis placement' }; };
const nearestFamilies = (v: number[]) => FAMILIES.map((f) => ({ id: f.id, name: f.name, similarity: similarity(v, f.v) })).sort((a, b) => b.similarity - a.similarity).slice(0, 3);
const leaderBrief = (l: (typeof LEADERS)[number]) => ({ id: l.id, name: l.name, role: l.role, years: l.years, tag: FAMILIES.find((f) => f.id === l.fam)?.name, school: l.school });
const meta = { generated: new Date().toISOString().slice(0, 10), officesChecked: CHECKED, method: 'Placements are editorial judgements from laws and records on a 0–100 scale per axis. See the Method page of the Twelve-Point Compass.' };

const index = { ...meta, countries: [] as unknown[], ideologies: [] as unknown[], files: { leaders: 'leaders.json' } };

for (const c of COUNTRIES) {
  const leaders = LEADERS.filter((l) => COUNTRY_BY_NAME[l.country] === c).map(leaderBrief);
  const doc = {
    ...meta, id: c.id, name: c.name, region: c.region, system: c.system,
    axes: axes(c.v), eightvalues: ev(c.v), nearestFamilies: nearestFamilies(c.v),
    laws: c.laws.map((l) => ({ year: l.y, law: l.t, axes: l.ax.map((x) => AXES.find((a) => a.id === x)!.name) })),
    facts: {
      sameSexCouples: SAMESEX_LABEL[c.facts.samesex] + (c.facts.samesexYear ? ` (${c.facts.samesexYear})` : ''),
      deathPenalty: DEATH_LABEL[c.facts.death], conscription: CONSCRIPTION_LABEL[c.facts.conscription], abortion: ABORTION_LABEL[c.facts.abortion],
      religionAndState: c.facts.religion, nuclearWeapons: c.facts.nuclear, nato: c.facts.nato, eu: c.facts.eu, note: c.facts.note,
    },
    militarySpending: c.milex ?? null, onlineDating: c.dating ?? null, leaders,
    socialAtlas: {
      overall: SOC_TOTAL(c.id),
      axes: Object.fromEntries(SOC_AXES.map((a) => { const s = countryAxes(c.id)[a.id]; return [a.name, { score: s.v, indicatorsKnown: s.known, indicatorsScored: s.total }]; })),
      indicators: INDICATORS.map((i) => { const v = valueOf(i, c.id); return { id: i.id, axis: SOC_AXES.find((a) => a.id === i.axis)!.name, question: i.q, answer: v?.label ?? 'Unknown', score: v?.score ?? null, note: i.notes[c.id] ?? null, confidence: i.conf }; }),
    },
  };
  writeFileSync(`${out}/countries/${c.id}.json`, JSON.stringify(doc, null, 2));
  index.countries.push({ id: c.id, name: c.name, file: `countries/${c.id}.json` });
}

for (const f of FAMILIES) {
  const members = LEADERS.filter((l) => l.fam === f.id).map(leaderBrief);
  const closestLeaders = LEADERS.map((l) => ({ name: l.name, similarity: similarity(f.v, l.v) })).sort((a, b) => b.similarity - a.similarity).slice(0, 8);
  const closestCountries = COUNTRIES.map((c) => ({ name: c.name, similarity: similarity(f.v, c.v) })).sort((a, b) => b.similarity - a.similarity).slice(0, 8);
  writeFileSync(`${out}/ideologies/${f.id}.json`, JSON.stringify({ ...meta, id: f.id, name: f.name, description: f.note, axes: axes(f.v), eightvalues: ev(f.v), taggedLeaders: members, closestLeaders, closestCountries }, null, 2));
  index.ideologies.push({ id: f.id, name: f.name, file: `ideologies/${f.id}.json` });
}

writeFileSync(`${out}/leaders.json`, JSON.stringify({ ...meta, leaders: LEADERS.map((l) => ({ ...leaderBrief(l), country: l.country, region: l.region, era: l.era, summary: l.summary, confidence: l.confidence, note: l.note, axes: axes(l.v), eightvalues: ev(l.v), record: l.record.map((r) => ({ year: r.y, event: r.t, axes: r.ax.map((x) => AXES.find((a) => a.id === x)!.name) })), wikipedia: `https://en.wikipedia.org/wiki/${l.wiki}` })) }, null, 2));
writeFileSync(`${out}/military-reference.json`, JSON.stringify(WORLD_MILEX, null, 2));
writeFileSync(`${out}/social-atlas.json`, JSON.stringify({ ...meta,
  method: 'Each indicator answer scores 0 (most restrictive or punitive) to 100 (freest or best protected), or is shown as a fact (score null). An axis is the mean of its scored indicators known for that country. Unknown answers are left blank.',
  axes: SOC_AXES.map((a) => ({ id: a.id, name: a.name, question: a.question, low: a.low, high: a.high })),
  indicators: INDICATORS.map((i) => ({ id: i.id, axis: i.axis, name: i.name, question: i.q, basis: i.basis, confidence: i.conf, values: i.values, countries: Object.fromEntries(COUNTRIES.map((c) => [c.id, { answer: valueOf(i, c.id)?.label ?? 'Unknown', note: i.notes[c.id] ?? null }])) })),
  scores: Object.fromEntries(COUNTRIES.map((c) => [c.id, { overall: SOC_TOTAL(c.id), ...Object.fromEntries(SOC_AXES.map((a) => [a.id, countryAxes(c.id)[a.id].v])) }])),
  leaderRecords: Object.fromEntries(Object.entries(STANCES).map(([id, st]) => [id, Object.fromEntries(STANCE_TOPICS.filter((t) => st[t.id]).map((t) => [t.name, { score: st[t.id]![0], evidence: st[t.id]![1] }]))])),
}, null, 2));
(index.files as Record<string, string>).socialAtlas = 'social-atlas.json';
writeFileSync(`${out}/india-compass.json`, JSON.stringify({ ...meta,
  method: 'Ten statements per axis, five pointing each way; answers −2 to +2; axis = 50 + 50 × mean(answer × direction) / 2.',
  questions: INDIA_QUESTIONS.map((q) => ({ id: q.id, axis: AXES.find((a) => a.id === q.axis)!.name, direction: q.dir === 1 ? AXES.find((a) => a.id === q.axis)!.high : AXES.find((a) => a.id === q.axis)!.low, topic: q.topic, statement: q.text, context: q.cue, ifAgree: q.agree, ifDisagree: q.disagree })),
  parties: INDIA_PARTIES.map((p) => ({ id: p.id, short: p.short, name: p.name, note: p.note, family: FAMILIES.find((f) => f.id === p.fam)!.name, axes: axes(p.v) })),
  indianFigures: LEADERS.filter((l) => l.country === 'India').map((l) => l.id),
  trivia: INDIA_TRIVIA,
}, null, 2));
(index.files as Record<string, string>).indiaCompass = 'india-compass.json';
writeFileSync(`${out}/authors.json`, JSON.stringify({ ...meta,
  method: 'Each lens is a weighted mean of 0–100 criteria; “lower adds” criteria use 100 minus the value. Leaders are scored on twelve-axis criteria only; scores need at least two criteria with data. Placements and lenses are editorial interpretations.',
  authors: AUTHORS.map((a) => ({
    id: a.id, name: a.name, years: a.years, from: a.from, works: a.works, idea: a.idea, quote: a.quote ?? null, axes: axes(a.v),
    lens: { name: a.lens.name, kind: a.lens.kind, question: a.lens.question, top: a.lens.top, criteria: a.lens.criteria.map((c) => ({ why: c.why, data: srcLabel(c.src), direction: c.dir === 1 ? 'higher adds' : 'lower adds', weight: c.w })) },
    countries: Object.fromEntries(COUNTRIES.map((c) => { const r = lensScore(a.lens, { v: c.v, cid: c.id }); return [c.id, r.v == null ? null : { score: r.v, band: band(r.v, a.lens.kind), criteriaKnown: r.used }]; })),
    leaders: Object.fromEntries(LEADERS.map((l) => [l.id, lensScore(a.lens, { v: l.v }).v])),
  })),
}, null, 2));
(index.files as Record<string, string>).authors = 'authors.json';
writeFileSync(`${out}/index.json`, JSON.stringify(index, null, 2));
console.log('countries', COUNTRIES.length, 'ideologies', FAMILIES.length, 'leaders', LEADERS.length);
