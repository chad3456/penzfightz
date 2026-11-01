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
writeFileSync(`${out}/index.json`, JSON.stringify(index, null, 2));
console.log('countries', COUNTRIES.length, 'ideologies', FAMILIES.length, 'leaders', LEADERS.length);
