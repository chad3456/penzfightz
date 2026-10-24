// The director: turns a simple plan (what each shot says and shows) into a
// full collage-reel script with every position, size and timing worked out.
// Shared by the studio page (live preview) and the server (render).
//
// plan = { title, look, lines: [{ say, speak?, shots: [{ words, layout, headline, style?,
//          stickers?: [], photo?: { file, fx?, frame?, cap? }, photo2?, number?, label?,
//          bubbles?: [], note?: [], definition?, stamp? }] }] }

export const LAYOUTS = ['intro', 'tv', 'window', 'tvphoto', 'polaroid', 'stack', 'cutout', 'count', 'type', 'note', 'chat', 'stamp', 'definition', 'outro'];
export const STYLES = ['bold', 'huge', 'neon', 'hot', 'pink', 'ink', 'caps', 'script', 'hand', 'handpink', 'type'];
export const FX = ['none', 'faded', 'sepia', 'bw', 'duotone', 'pinkwash', 'halftone', 'riso', 'vhs'];
export const FRAMES = ['polaroid', 'tape', 'torn', 'white', 'cutout', 'stamp', 'tv', 'plain'];
export const LOOKS = {
  archival: { fx: ['sepia', 'faded', 'bw', 'faded'], frames: ['polaroid', 'tape', 'torn', 'stamp'] },
  pop: { fx: ['pinkwash', 'halftone', 'riso', 'duotone'], frames: ['tape', 'cutout', 'polaroid', 'white'] },
  clean: { fx: ['none'], frames: ['white', 'polaroid', 'tape', 'cutout'] },
};
const BGS = ['stripes:pink', 'grid:pink', 'stripes:green', 'gingham:pink', 'grid:blue', 'stripes:lilac', 'check:pink', 'plaid:pink', 'grid:green'];
const SCENES = ['room', 'city', 'stage', 'paper', 'suburb', 'campus', 'dream', 'street'];
const WINDOW_STYLES = ['bold', 'caps', 'neon', 'hot', 'huge'];
const WIN_FRAMES = ['white', 'white', 'pink', 'tape', 'navy'];

// font size that fits the frame width for a given style
const FACTOR = { caps: 0.7, huge: 0.64, bold: 0.6, neon: 0.6, hot: 0.62, pink: 0.6, ink: 0.6, script: 0.42, hand: 0.44, handpink: 0.44, type: 0.6, mono: 0.62, sub: 0.55 };
const MAX = { huge: 250, caps: 150, script: 210, hand: 200, handpink: 190, type: 130 };
export function wrap(text, at = 12) {
  if (!text || text.includes('\n') || text.length <= at || !text.includes(' ')) return text || '';
  const mid = text.length / 2; let best = -1;
  for (let i = 0; i < text.length; i++) if (text[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return text.slice(0, best) + '\n' + text.slice(best + 1);
}
export function fit(text, style, width = 980) {
  const L = Math.max(...String(text).split('\n').map((l) => l.length), 3);
  const lines = String(text).split('\n').length;
  const size = Math.min(MAX[style] || 170, width / (L * (FACTOR[style] || 0.6)));
  return Math.round(lines > 2 ? size * 0.85 : size);
}
function headline(text, style, x, y, extra = {}) {
  const t = wrap(text, style === 'script' || style === 'hand' ? 14 : 12);
  return { t, style, size: fit(t, style), x, y, ...extra };
}
const STK = [[78, 44, 10], [26, 46, -10], [72, 62, 8], [82, 16, 12], [24, 18, -8]];
function stickers(list = [], slots = STK, at = (i) => 0.12 + i * 0.25) {
  return list.slice(0, slots.length).map((e, i) => ({ e, x: slots[i][0], y: slots[i][1], r: slots[i][2], size: i === 0 ? 290 : 240, at: at(i) }));
}

export function compile(plan, opts = {}) {
  const look = LOOKS[plan.look || 'archival'] || LOOKS.archival;
  let n = 0, bgk = 0, last = '';
  const nextBg = () => { let b; do { b = BGS[bgk++ % BGS.length]; } while (b === last); last = b; return b; };
  const lines = (plan.lines || []).filter((l) => l.say && l.say.trim()).map((ln) => {
    const shots = (ln.shots && ln.shots.length ? ln.shots : [{ layout: 'window', headline: '' }]).map((s, si, arr) => {
      const i = n++;
      const fx = s.photo?.fx || look.fx[i % look.fx.length];
      const frame = s.photo?.frame || look.frames[i % look.frames.length];
      const hasPhoto = !!s.photo?.file;
      let layout = s.layout || 'window';
      if (['polaroid', 'stack', 'cutout', 'tvphoto'].includes(layout) && !hasPhoto) layout = layout === 'tvphoto' ? 'tv' : 'window';
      const out = { items: [] };
      if (si < arr.length - 1) out.w = Math.max(1, s.words || 2);
      const H = s.headline || '';
      const style = s.style || null;
      const st = (list, slots) => out.items.push(...stickers(list ?? s.stickers, slots));
      switch (layout) {
        case 'intro':
          Object.assign(out, { bg: 'sky', win: false, host: 'center' });
          if (H) out.items.push(headline(H, style || 'bold', 50, 14));
          st(s.stickers, [[22, 70, -10], [80, 68, 10]]);
          break;
        case 'tv':
          Object.assign(out, { bg: 'tv', win: false, host: 'center' });
          if (H) out.items.push(headline(H, style || 'neon', 50, 17));
          st(s.stickers, [[22, 72, -12], [78, 72, 10]]);
          break;
        case 'outro':
          Object.assign(out, { bg: 'sky', win: false, host: 'center', flash: true });
          out.items.push(headline(H || 'follow for more', style || 'hand', 50, 15));
          st(s.stickers?.length ? s.stickers : ['red heart', 'sparkles'], [[22, 68, -12], [80, 66, 12], [78, 33, 0]]);
          break;
        case 'tvphoto':
          Object.assign(out, { bg: nextBg(), win: { img: s.photo.file, fx, frame: 'tv', box: [12, 16, 76, 50], cam: 'push' } });
          if (H) out.items.push(headline(H, style || 'hot', 50, 8));
          st(s.stickers, [[84, 62, 10], [17, 62, -8]]);
          break;
        case 'polaroid':
          Object.assign(out, { bg: nextBg(), win: false });
          out.items.push({ k: 'photo', src: s.photo.file, fx, frame: frame === 'cutout' ? 'polaroid' : frame, cap: s.photo.cap || '', size: 640, x: 52, y: 37, r: i % 2 ? 4 : -4, at: 0.05 });
          if (H) out.items.push(headline(H, style || (i % 2 ? 'caps' : 'hot'), 50, 9, { at: 0.25 }));
          st(s.stickers, [[84, 58, 10], [20, 60, -10]]);
          break;
        case 'stack': {
          Object.assign(out, { bg: nextBg(), win: false });
          const p2 = s.photo2?.file ? s.photo2 : s.photo;
          out.items.push({ k: 'photo', src: s.photo.file, fx, frame: 'polaroid', cap: s.photo.cap || '', size: 470, x: 34, y: 31, r: -8, at: 0.05 });
          out.items.push({ k: 'photo', src: p2.file, fx: p2 === s.photo ? look.fx[(i + 1) % look.fx.length] : (p2.fx || fx), frame: 'tape', size: 460, x: 67, y: 47, r: 7, at: 0.35 });
          if (H) out.items.push(headline(H, style || 'bold', 50, 8, { at: 0.2 }));
          st(s.stickers, [[84, 18, 10]]);
          break;
        }
        case 'cutout':
          Object.assign(out, { bg: nextBg(), win: false });
          out.items.push({ k: 'photo', src: s.photo.file, fx, frame: 'cutout', size: 640, x: 52, y: 40, r: i % 2 ? 3 : -3, at: 0.05 });
          if (H) out.items.push(headline(H, style || 'hot', 50, 10, { at: 0.2 }));
          st(s.stickers, [[82, 62, 10], [22, 22, -10]]);
          break;
        case 'count':
          Object.assign(out, { bg: nextBg(), win: { scene: i % 2 ? '#e8458f' : '#22306b', cam: 'push', frame: 'white' } });
          out.items.push({ k: 'count', n: s.number || H || '1', label: wrap(s.label || '', 8), size: String(s.number || '').length > 4 ? 200 : 280, x: 50, y: 30 });
          st(s.stickers, [[24, 52, -10], [76, 54, 12]]);
          break;
        case 'type':
          Object.assign(out, { bg: nextBg(), win: { scene: '#8a6a4c', cam: 'still' } });
          out.items.push({ t: H, style: 'type', size: fit(H, 'type', 760), x: 50, y: 36, w: 76, at: 0.1 });
          st(s.stickers, [[74, 17, 10]]);
          break;
        case 'note': {
          Object.assign(out, { bg: 'plaid:pink', win: false });
          const lines2 = (s.note && s.note.length ? s.note : wrap(H, 14).split('\n')).slice(0, 4);
          out.items.push({ k: 'note', lines: lines2, x: 52, y: 32, w: 80, r: -2, per: 0.55, at: 0.05 });
          st(s.stickers, [[82, 58, 12], [20, 10, -10]]);
          break;
        }
        case 'chat': {
          Object.assign(out, { bg: nextBg(), win: { scene: 'stage', cam: 'push' } });
          if (H) out.items.push(headline(H, style || 'huge', 50, 13));
          (s.bubbles || []).slice(0, 3).forEach((b, k) => out.items.push({ k: 'bubble', t: b, side: k % 2 ? 'r' : 'l', x: k % 2 ? 62 : 42, y: 31 + k * 9, at: 0.15 + k * 0.35 }));
          break;
        }
        case 'stamp':
          Object.assign(out, { bg: nextBg(), win: hasPhoto ? { img: s.photo.file, fx, cam: 'push' } : { scene: SCENES[i % SCENES.length], cam: 'push' } });
          if (H) out.items.push(headline(H, style || 'caps', 50, 15));
          out.items.push({ k: 'stamp', t: s.stamp || 'true story', size: 90, x: 54, y: 44, r: -10, at: 0.4 });
          st(s.stickers, [[78, 62, 10]]);
          break;
        case 'definition':
          Object.assign(out, { bg: 'grid:pink', win: false });
          out.items.push({ k: 'def', word: H, pos: 'noun', def: s.definition || '', x: 50, y: 33, w: 84, at: 0.05 });
          st(s.stickers, [[84, 13, 14], [80, 57, -10]]);
          break;
        default: // window
          Object.assign(out, { bg: nextBg(), win: hasPhoto ? { img: s.photo.file, fx, cam: ['push', 'up', 'pull', 'left'][i % 4], frame: WIN_FRAMES[i % WIN_FRAMES.length] } : { scene: s.scene || SCENES[i % SCENES.length], cam: ['push', 'up', 'pull', 'left'][i % 4] } });
          if (H) out.items.push(headline(H, style || WINDOW_STYLES[i % WINDOW_STYLES.length], 50, 14));
          st(s.stickers);
      }
      if (s.flash) out.flash = true;
      return out;
    });
    return { say: ln.say.trim(), ...(ln.speak ? { speak: ln.speak } : {}), shots };
  });
  return {
    meta: { title: plan.title || 'Reel', fps: 30, lead: 0.25, gap: 0.16, tail: 1.8, voice: { speaker: opts.speaker ?? 60, speed: opts.speed ?? 1.0 }, music: { bpm: opts.bpm || 116, key: opts.key || 'F' }, ...(opts.host ? { host: { image: opts.host } } : {}) },
    lines,
  };
}
