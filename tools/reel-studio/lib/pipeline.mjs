// Voice and render: runs the collage-reel scripts for a project and reports
// progress. Also builds the preview soundtrack (narration laid on the timeline).
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { compile } from '../public/director.js';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
export const SKILL = path.join(ROOT, '.claude', 'skills', 'collage-reel');
export const CACHE = process.env.REEL_CACHE || path.join(ROOT, 'video-work', 'reel-cache');
export const VOICE_MODEL = process.env.PIPER_MODEL || path.join(CACHE, 'voices', 'en-us-libritts-high', 'en-us-libritts-high.onnx');

function run(cmd, args, { cwd = ROOT, onLine = () => {}, env = {} } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, env: { ...process.env, REEL_CACHE: CACHE, ...env } });
    let tail = '';
    const feed = (d) => { const s = d.toString(); tail = (tail + s).slice(-4000); s.split(/[\r\n]+/).forEach((l) => l.trim() && onLine(l.trim())); };
    p.stdout.on('data', feed); p.stderr.on('data', feed);
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve(tail) : reject(new Error(`${path.basename(args[0] || cmd)} failed (${code}): ${tail.split('\n').filter(Boolean).slice(-4).join(' | ')}`))));
  });
}

export async function ensureVoice(log) {
  if (fs.existsSync(VOICE_MODEL)) return;
  log('downloading the narrator voice (Piper LibriTTS, CC BY 4.0), once');
  const dir = path.dirname(VOICE_MODEL);
  fs.mkdirSync(dir, { recursive: true });
  const r = await fetch('https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-libritts-high.tar.gz');
  if (!r.ok) throw new Error(`voice download failed: ${r.status}`);
  const tgz = path.join(dir, 'voice.tgz');
  fs.writeFileSync(tgz, Buffer.from(await r.arrayBuffer()));
  await run('tar', ['-xzf', tgz, '-C', dir]);
  fs.rmSync(tgz);
}

export function voiceKey(reel) {
  return crypto.createHash('sha1').update(JSON.stringify([reel.lines.map((l) => [l.say, l.speak || '']), reel.meta.voice])).digest('hex').slice(0, 12);
}

export function writeReel(project, dir) {
  const reel = compile(project.plan, { speaker: project.voice?.speaker, speed: project.voice?.speed, host: project.hostImage });
  reel.meta.title = project.title || reel.meta.title;
  fs.writeFileSync(path.join(dir, 'reel.json'), JSON.stringify(reel, null, 1));
  return reel;
}

export async function voice(project, dir, log) {
  const reel = writeReel(project, dir);
  const key = voiceKey(reel);
  const vo = path.join(dir, 'vo');
  if (fs.existsSync(path.join(vo, 'key.txt')) && fs.readFileSync(path.join(vo, 'key.txt'), 'utf8') === key && fs.existsSync(path.join(vo, 'preview.wav'))) { log('narration is up to date'); return reel; }
  await ensureVoice(log);
  log('fetching stickers');
  await run('python3', [path.join(SKILL, 'scripts', 'assets.py'), path.join(dir, 'reel.json')], { onLine: (l) => /NOT FOUND/.test(l) && log(l) }).catch((e) => log(String(e.message).slice(0, 200)));
  log('recording the narration');
  fs.rmSync(vo, { recursive: true, force: true });
  await run('python3', [path.join(SKILL, 'scripts', 'voice.py'), path.join(dir, 'reel.json'), '--out', vo, '--model', VOICE_MODEL], { onLine: (l) => /^line/.test(l) && log(l) });
  previewMix(reel, vo);
  fs.writeFileSync(path.join(vo, 'key.txt'), key);
  log('narration ready');
  return reel;
}

export async function render(project, dir, log, progress) {
  const reel = await voice(project, dir, log);
  const out = path.join(dir, 'out');
  const name = `${(project.title || 'reel').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'reel'}.mp4`;
  log('rendering frames');
  await run('node', [path.join(SKILL, 'scripts', 'render.mjs'), path.join(dir, 'reel.json'), '--vo', path.join(dir, 'vo'), '--out', out, '--media', path.join(dir, 'media'), '--name', name, '--workers', String(project.workers || 4), ...(project.draft ? ['--scale', '0.5'] : [])], {
    onLine: (l) => { const m = l.match(/(\d+)\/(\d+) frames/); if (m) progress(+m[1] / +m[2]); else if (/score|done|reel:/.test(l)) log(l); },
  });
  fs.writeFileSync(path.join(out, 'credits.txt'), creditsText(project, reel));
  return { file: name, credits: 'credits.txt' };
}

export function creditsText(project, reel) {
  const L = [`${project.title || reel.meta.title}`, '', 'Sources'];
  for (const s of project.sources || []) L.push(`- ${s.title}${s.url ? ` <${s.url}>` : ''}${s.license ? ` (${s.license})` : ''}`);
  for (const s of project.plan?.sources || []) if (!(project.sources || []).some((x) => x.url === s.url)) L.push(`- ${s.title} <${s.url}>`);
  L.push('', 'Photos');
  const used = new Set(JSON.stringify(reel).match(/"(?:src|img)":"([^"]+)"/g)?.map((m) => m.split('"')[3]) || []);
  for (const p of project.photos || []) if (used.has(p.file)) L.push(`- ${p.title || p.file}${p.creator ? `, ${p.creator}` : ''}${p.date ? ` (${p.date})` : ''}. ${p.provider || ''}. ${p.license || ''}${p.source ? ` <${p.source}>` : ''}`);
  L.push('', 'Voice: Piper text-to-speech, LibriTTS voice model (CC BY 4.0)', 'Stickers: Microsoft Fluent Emoji (MIT)', 'Fonts: Poppins, Great Vibes, Caveat, Courier Prime (SIL OFL)', 'Music and sound effects: generated for this video');
  return L.join('\n') + '\n';
}

// ---------- preview soundtrack: the narration clips at their timeline positions ----------
function readWav(f) {
  const b = fs.readFileSync(f);
  let p = 12, rate = 22050, data = null;
  while (p < b.length - 8) {
    const id = b.toString('ascii', p, p + 4), size = b.readUInt32LE(p + 4);
    if (id === 'fmt ') rate = b.readUInt32LE(p + 12);
    if (id === 'data') { data = new Int16Array(b.buffer.slice(b.byteOffset + p + 8, b.byteOffset + p + 8 + size)); break; }
    p += 8 + size + (size % 2);
  }
  return { rate, data };
}
export function previewMix(reel, vo) {
  const v = JSON.parse(fs.readFileSync(path.join(vo, 'voice.json'), 'utf8'));
  const m = reel.meta;
  let t = m.lead ?? 0.2;
  const clips = v.lines.map((l, i) => { const at = t; t += l.dur + (reel.lines[i].gap ?? m.gap ?? 0.12); return { at, ...readWav(path.join(vo, l.file)) }; });
  const rate = clips[0]?.rate || 22050;
  const total = t + (m.tail ?? 1);
  const out = new Int16Array(Math.ceil(total * rate));
  for (const c of clips) out.set(c.data.subarray(0, Math.max(0, out.length - Math.round(c.at * rate))), Math.round(c.at * rate));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + out.length * 2, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(out.length * 2, 40);
  fs.writeFileSync(path.join(vo, 'preview.wav'), Buffer.concat([h, Buffer.from(out.buffer)]));
}
