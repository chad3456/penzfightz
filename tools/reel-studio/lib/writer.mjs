// Script writing. With Claude (ANTHROPIC_API_KEY or an `ant auth login`
// profile): optional web research with the server-side web search tool, then
// a plan written straight into a JSON schema. Without it: an offline draft
// picked out of your sources, for you to edit.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { LAYOUTS, STYLES } from '../public/director.js';

const MODEL = process.env.REEL_MODEL || 'claude-opus-5-5';
const WORDS_PER_SECOND = 2.7;

let client = null;
export function claudeReady() {
  if (process.env.REEL_OFFLINE) return false;
  const creds = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_PROFILE || process.env.ANTHROPIC_FEDERATION_RULE_ID || fs.existsSync(path.join(os.homedir(), '.config', 'anthropic'));
  if (!creds) return false;
  try { client ||= new Anthropic(); return true; } catch { return false; }
}

// ---------- the plan's shape ----------
const shot = {
  type: 'object', additionalProperties: false,
  properties: {
    words: { type: 'integer', description: 'how many words of the line this shot covers' },
    layout: { type: 'string', enum: LAYOUTS },
    headline: { type: 'string', description: 'the one loud word or short phrase on screen (1-4 words)' },
    style: { type: 'string', enum: ['', ...STYLES] },
    stickers: { type: 'array', items: { type: 'string' }, description: 'Unicode emoji names, e.g. "money bag", "books", "light bulb"' },
    photo_query: { type: 'string', description: 'search words for a real archival photo, or empty' },
    number: { type: 'string' }, label: { type: 'string' },
    bubbles: { type: 'array', items: { type: 'string' } },
    note: { type: 'array', items: { type: 'string' } },
    definition: { type: 'string' }, stamp: { type: 'string' },
  },
  required: ['words', 'layout', 'headline', 'style', 'stickers', 'photo_query', 'number', 'label', 'bubbles', 'note', 'definition', 'stamp'],
};
export const PLAN_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    title: { type: 'string' },
    lines: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { say: { type: 'string' }, speak: { type: 'string' }, shots: { type: 'array', items: shot } }, required: ['say', 'speak', 'shots'] } },
    corrections: { type: 'array', items: { type: 'string' }, description: 'anything in the brief that was wrong, and how the script fixed it' },
    sources: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { title: { type: 'string' }, url: { type: 'string' } }, required: ['title', 'url'] } },
  },
  required: ['title', 'lines', 'corrections', 'sources'],
};

const SYSTEM = `You write one-minute vertical explainer reels in a pastel scrapbook-collage style: a host bobblehead in the corner, a framed window or archival photo in the middle, one or two loud words per shot, glossy emoji stickers, fast cuts.

Writing
- Write for the ear: short sentences, plain words, numbers spoken plainly. Use "speak" when a line should be read differently from how it is shown (years, symbols, acronyms); otherwise leave it empty.
- Structure: a hook line starting "Hey!" with a provocative one-liner; name the idea; who and when; how it works; one or two concrete examples; the strongest criticism or nuance; a one-line takeaway; "Follow for more ..." as the last line.
- Accuracy first. Use only facts supported by the sources or your research, attribute claims ("Shelley writes", "critics argue"), and never present a contested claim as settled. If the brief contains a wrong premise, keep its intent, fix the claim, and say what you fixed in "corrections".
- Paraphrase sources in your own words. Quotations must be short (at most 15 words), exact and attributed. Never invent quotes, posts or messages from real people.

Shots
- Split each line into shots of 2 to 6 spoken words ("words" counts the line's words in order; the counts must add up to the line). Aim for 35 to 45 shots a minute.
- One idea per shot. The headline is what is said or its keyword, 1 to 4 words.
- Layouts: intro (first shot, host in the clouds), tv (host in a retro TV, for the hook or a reveal), window (a framed scene or photo), tvphoto (an archival photo on a CRT screen), polaroid (one archival photo pinned), stack (two archival photos), cutout (a photo cut out like a sticker), count (a big number + label), type (a phrase typed out with a cursor), note (2-3 handwritten notebook lines), chat (2-3 chat bubbles), stamp (a rubber stamp over a scene), definition (dictionary card: headline is the term, definition the meaning), outro (last shot).
- Use real archival photos where they exist (people, places, objects, documents, historical events): set photo_query to 2-5 search words for open collections such as Wikimedia Commons and the Library of Congress, e.g. "Mary Shelley portrait", "Geneva 1816". Leave it empty for abstract ideas.
- Stickers: 0 to 3 per shot, named as Unicode emoji names in plain English ("money bag", "graduation cap", "high voltage", "skull", "ship", "envelope").
- Vary layouts; don't repeat one more than twice in a row.`;

async function call(params) {
  const stream = client.beta.messages.stream({ model: MODEL, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default', ...params });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === 'refusal') throw new Error(`Claude declined: ${msg.stop_details?.explanation || msg.stop_details?.category || 'refusal'}`);
  return msg;
}

// web research with the server-side search tool; returns notes + links
export async function research(topic, angle, onStep = () => {}) {
  if (!claudeReady()) throw new Error('no Anthropic credentials: set ANTHROPIC_API_KEY or run `ant auth login`');
  const messages = [{ role: 'user', content: `Research this for a one-minute explainer reel: ${topic}${angle ? ` (angle: ${angle})` : ''}.\n\nReturn compact fact notes: what it is, who coined or discovered it and when, how it works, two concrete examples, the main criticism or nuance, and any common misconceptions. Prefer primary and reputable sources. End with a list of the links you relied on.` }];
  let msg, links = new Map();
  for (let k = 0; k < 4; k++) {
    onStep(k ? 'continuing research' : 'searching the web');
    msg = await call({ max_tokens: 32000, output_config: { effort: 'medium' }, tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 8 }], messages });
    for (const b of msg.content) {
      if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) b.content.forEach((r) => r.url && links.set(r.url, r.title || r.url));
      if (b.type === 'text') (b.citations || []).forEach((c) => c.url && links.set(c.url, c.title || c.url));
    }
    if (msg.stop_reason !== 'pause_turn') break;
    messages.push({ role: 'assistant', content: msg.content });
  }
  const notes = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  return { kind: 'research', title: `Web research: ${topic}`, text: notes, words: notes.split(/\s+/).length, links: [...links].map(([url, title]) => ({ url, title })) };
}

export async function writeWithClaude({ topic, angle, seconds = 60, sources = [] }, onStep = () => {}) {
  if (!claudeReady()) throw new Error('no Anthropic credentials');
  const words = Math.round(seconds * WORDS_PER_SECOND);
  const docs = sources.map((s, i) => `<source id="${i + 1}" title="${(s.title || '').replace(/"/g, "'")}"${s.url ? ` url="${s.url}"` : ''}>\n${s.text}\n</source>`).join('\n\n');
  onStep('writing the script');
  const msg = await call({
    max_tokens: 64000,
    output_config: { effort: 'high', format: { type: 'json_schema', schema: PLAN_SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content: `${docs ? `Sources:\n\n${docs}\n\n` : ''}Brief: a ${seconds}-second reel (about ${words} spoken words) on: ${topic}${angle ? `\nAngle: ${angle}` : ''}\n\nWrite the plan.` }],
  });
  const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const plan = JSON.parse(text);
  return { plan: tidy(plan), usage: msg.usage, model: msg.model };
}

// ---------- offline draft ----------
const STOP = new Set('a an the and or but if then than so of in on at to for from by with without as is are was were be been being it its this that these those he she they them his her their we you i my our your not no yes do does did have has had will would can could should may might must there here which who whom whose what when where why how all any each more most some such only own same very just also into over under again further once about against between through during before after above below up down out off'.split(' '));
const EMOJI = [
  [/money|rich|wealth|price|cost|pay|cash|dollar/, 'money bag'], [/book|novel|read|author|write|wrote|story|page/, 'books'], [/letter|mail|wrote to/, 'envelope'],
  [/science|experiment|chemist|laborator/, 'test tube'], [/electric|lightning|spark|power/, 'high voltage'], [/death|dead|die|grave|murder|kill/, 'skull'],
  [/love|heart|beloved/, 'red heart'], [/war|battle|army|soldier/, 'crossed swords'], [/ship|sea|voyage|sail|ocean/, 'ship'], [/ice|arctic|frozen|snow|cold|north/, 'snowflake'],
  [/monster|creature|fiend/, 'ogre'], [/storm|thunder/, 'cloud with lightning'], [/school|university|student|college/, 'graduation cap'], [/king|queen|royal|crown/, 'crown'],
  [/city|town|street/, 'cityscape'], [/home|house|family/, 'house'], [/computer|code|software|program/, 'laptop'], [/phone/, 'mobile phone'], [/space|moon|planet|rocket|star/, 'rocket'],
  [/idea|invent|discover|think/, 'light bulb'], [/time|year|century|age|old/, 'hourglass done'], [/law|court|judge|justice/, 'balance scale'], [/doctor|medic|disease|health/, 'stethoscope'],
  [/fire|burn|flame/, 'fire'], [/tree|forest|nature/, 'deciduous tree'], [/mountain|alps/, 'mountain'], [/travel|journey/, 'world map'], [/secret|hidden/, 'locked'], [/eye|see|saw|watch/, 'eyes'],
  [/brain|mind|memory/, 'brain'], [/ghost|haunt/, 'ghost'], [/news|paper|press/, 'newspaper'], [/photo|camera/, 'camera with flash'], [/film|movie/, 'movie camera'], [/art|paint/, 'artist palette'],
];
function stickersFor(t, k) { const s = []; for (const [re, e] of EMOJI) if (re.test(t.toLowerCase()) && !s.includes(e)) s.push(e); return (s.length ? s : [['sparkles', 'glowing star', 'light bulb', 'thinking face'][k % 4]]).slice(0, 2); }

function sentences(text) {
  return text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-Z“"])/).map((s) => s.trim()).filter((s) => s.length > 40 && s.length < 400 && !/[{}|<>]|\[\d+\]|https?:/.test(s));
}
function shorten(s) {
  let w = s.split(' ');
  if (w.length > 26) { const cut = w.findIndex((x, i) => i > 10 && i < 24 && /[,;:]$/.test(x)); w = w.slice(0, cut > 0 ? cut + 1 : 22); }
  return w.join(' ').replace(/[,;:—–-]+$/, '').replace(/[^.!?]$/, '$&.');
}
const GENERIC = new Set('first last many much great little time times hours hour days years thing things made make makes said says upon shall would could even still every never ever long well being other others another whole part place world people person man men woman women life lives come came going went felt feel seemed seem began begun found find gave give take took know knew known like also already almost always often perhaps rather quite really something nothing everything anything someone everyone'.split(' '));

// the shot's loud word: a year, a name, or the rarest meaningful word
function keyword(s, idf) {
  const year = s.match(/\b(1[0-9]{3}|20[0-9]{2})\b/); if (year) return year[1];
  const names = [...s.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g)].filter((m) => m.index > 0 || m[1].includes(' ')).map((m) => m[1]).filter((n) => !STOP.has(n.toLowerCase()) && !GENERIC.has(n.toLowerCase()));
  if (names.length) return names.sort((a, b) => b.length - a.length)[0];
  const words = (s.toLowerCase().match(/[a-z][a-z'-]{3,}/g) || []).filter((x) => !STOP.has(x) && !GENERIC.has(x));
  return words.map((w, i) => [w, (idf.get(w) ?? 9) + i * 0.01 + w.length * 0.02]).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}
function idfOf(sents) {
  const df = new Map();
  for (const t of sents) for (const w of new Set(t.toLowerCase().match(/[a-z][a-z'-]{3,}/g) || [])) df.set(w, (df.get(w) || 0) + 1);
  const N = sents.length || 1, idf = new Map();
  for (const [w, d] of df) idf.set(w, Math.log((N + 1) / d) + (d > 1 ? 0.5 : 0)); // seen more than once beats a one-off
  return idf;
}

const LAY = ['window', 'polaroid', 'type', 'cutout', 'note', 'stack', 'tvphoto', 'stamp', 'window', 'count'];
// shots for lines of narration: two or three per line, layouts in rotation,
// photos where there are any, stickers by keyword
export function planLines(says, { topic = '', photos = [], idf = idfOf(says), offset = 0 } = {}) {
  let pi = 0;
  const photoAt = () => (photos.length ? { file: photos[pi++ % photos.length] } : null);
  return says.map((say, li) => {
    const w = say.split(/\s+/).filter(Boolean);
    const parts = w.length > 14 ? 3 : w.length > 6 ? 2 : 1;
    const size = Math.ceil(w.length / parts);
    const shots = [];
    for (let k = 0; k < parts; k++) {
      const chunk = w.slice(k * size, (k + 1) * size).join(' ');
      if (!chunk) continue;
      const i = offset + li * 3 + k;
      const kw = keyword(chunk, idf) || keyword(say, idf) || (chunk.match(/[A-Za-z]{4,}/) || [''])[0];
      let layout = /^\d{4}$/.test(kw) ? 'count' : LAY[i % LAY.length];
      if (layout === 'count' && !/\d/.test(chunk)) layout = 'window';
      const needs = ['polaroid', 'cutout', 'stack', 'tvphoto'].includes(layout) || (layout === 'window' && i % 2 === 0) || layout === 'stamp';
      const photo = needs ? photoAt() : null;
      shots.push({ words: Math.min(size, w.length - k * size), layout, headline: kw, number: layout === 'count' ? (chunk.match(/\d+(?:[.,]\d+)*/) || [kw])[0] : '', label: '', stickers: stickersFor(chunk, i),
        photo: photo || (needs && topic ? { query: `${topic} ${kw}`.trim() } : null), note: layout === 'note' ? [kw, keyword(say.replace(kw, ''), idf)].filter(Boolean) : [], stamp: layout === 'stamp' ? kw : '' });
    }
    return { say, speak: '', shots };
  });
}

// your own narration, one sentence per line, turned into a plan
export function planFromText({ topic = '', text = '', photos = [] }) {
  const says = text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
  if (says.length > 1 && /^(hey|hi|hello)\b[!.,]*$/i.test(says[0])) says.splice(0, 2, `${says[0]} ${says[1]}`); // "Hey!" leads into the hook
  const lines = planLines(says, { topic, photos, idf: idfOf(says) });
  if (lines.length && /^(hey|hi|hello)\b/i.test(lines[0].say)) {
    const rest = lines[0].shots;
    lines[0].shots = [{ words: 1, layout: 'intro', headline: lines[0].say.split(/[\s!,.]/)[0].toLowerCase(), stickers: [] }, { ...rest[0], layout: 'tv', photo: null, words: 99 }];
  }
  if (lines.length > 1 && /follow/i.test(lines.at(-1).say)) lines.at(-1).shots = [{ words: 99, layout: 'outro', headline: 'follow for more', stickers: ['red heart', 'sparkles'] }];
  return { plan: tidy({ title: topic || says[0]?.slice(0, 40) || 'Reel', lines, corrections: [], sources: [] }) };
}

export function writeOffline({ topic, seconds = 60, sources = [], photos = [] }) {
  const words = Math.round(seconds * WORDS_PER_SECOND);
  const all = sources.flatMap((s, si) => sentences(s.text).map((t, k) => ({ t, si, k })));
  const idf = idfOf(all.map((x) => x.t));
  const topicWords = (topic.toLowerCase().match(/[a-z]{3,}/g) || []).filter((w) => !STOP.has(w));
  const scored = all.map((x) => {
    const ws = x.t.toLowerCase().match(/[a-z][a-z'-]{3,}/g) || [];
    const hits = topicWords.filter((w) => ws.some((v) => v.startsWith(w))).length;
    const info = ws.reduce((a, w) => a + (STOP.has(w) || GENERIC.has(w) ? 0 : Math.min(3, idf.get(w) || 0)), 0) / Math.sqrt(ws.length + 1);
    return { ...x, score: hits * 2 + info + (/\b\d{3,4}\b/.test(x.t) ? 1 : 0) + (/^[A-Z][a-z]+ (is|was|were|are)\b/.test(x.t) ? 1 : 0) - x.k * 0.002 };
  }).sort((a, b) => b.score - a.score);
  const picked = [];
  let budget = words - 20;
  for (const x of scored) {
    if (budget <= 0) break;
    const t = shorten(x.t);
    const set = new Set(t.toLowerCase().split(' '));
    if (picked.some((p) => [...set].filter((w) => p.set.has(w)).length / set.size > 0.5)) continue;
    picked.push({ ...x, t, set }); budget -= t.split(' ').length;
  }
  picked.sort((a, b) => a.si - b.si || a.k - b.k);
  const lines = [
    { say: `Hey! Let's talk about ${topic}.`, speak: '', shots: [{ words: 1, layout: 'intro', headline: 'hey', stickers: [] }, { words: 9, layout: 'tv', headline: topic.split(' ').slice(0, 4).join(' '), stickers: ['sparkles'] }] },
    ...planLines(picked.map((p) => p.t), { topic, photos, idf, offset: 1 }),
    { say: `Follow for more on ${topic}.`, speak: '', shots: [{ words: 5, layout: 'outro', headline: 'follow for more', stickers: ['red heart', 'sparkles'] }] },
  ];
  return { plan: tidy({ title: topic, lines, corrections: [], sources: sources.filter((s) => s.url).map((s) => ({ title: s.title, url: s.url })) }), offline: true };
}

// make shot word counts add up to each line, and turn photo_query into a request
export function tidy(plan) {
  for (const ln of plan.lines || []) {
    const n = ln.say.split(/\s+/).filter(Boolean).length;
    let left = n;
    ln.shots = (ln.shots || []).filter(Boolean);
    ln.shots.forEach((s, i) => {
      if (i === ln.shots.length - 1) s.words = Math.max(1, left);
      else { s.words = Math.max(1, Math.min(left - (ln.shots.length - 1 - i), s.words || 2)); left -= s.words; }
      if (!s.photo && s.photo_query) s.photo = { query: s.photo_query };
      for (const k of ['style', 'number', 'label', 'definition', 'stamp']) if (s[k] === '') delete s[k];
    });
    ln.shots = ln.shots.filter((s) => s.words > 0);
    if (!ln.speak) delete ln.speak;
  }
  return plan;
}
