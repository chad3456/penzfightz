/**
 * The tableau for the thousand names. The Lord stands at the centre in the
 * form the shloka's names call up — reclining on Shesha, as Krishna among
 * the cows, as Narasimha, as the cosmic form — and around him a sunflower
 * spiral of a thousand lights fills from the centre outward, one light for
 * each name, lit at the moment the name is chanted. The name itself is
 * painted in a cartouche above with its emblem and its number, and across
 * the 108 shlokas the night sky slowly turns to dawn.
 */
import { C, PW, type G, circle, clamp, lerp, io, out, devText, sunDisc, glory, star4, ocean, lotus } from '../chalisa/kit';
import { deity, aureole } from '../pichwai/frontal';
import { VISHNU, KRISHNA_ICON, LAKSHMI, NARASIMHA, VISHVARUPA, avatar, garuda, om } from '../pichwai/cast';
import { emblem, emblemFor, reclining, weaponWheel, type EmblemKey } from '../pichwai/emblems';
import { border, cows, night, cartouche } from '../pichwai/paint';
import { dn, iastToDev, type NameSpan } from '../pichwai/work';
import type { Beat, Scene } from '../pichwai/stage';
import { VISHNU_WORK } from './text';

/* ───────── the spiral of a thousand lights ───────── */

const CX = PW / 2, CY = 470, R0 = 250, R1 = 600, SQ = 0.74;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const SPOT: [number, number][] = Array.from({ length: 1000 }, (_, k) => {
  const r = Math.sqrt(R0 * R0 + (k / 999) * (R1 * R1 - R0 * R0)), a = k * GOLDEN - Math.PI / 2;
  return [CX + Math.cos(a) * r, CY + Math.sin(a) * r * SQ];
});
const HUES = [C.gold, C.marigold, C.pink, C.white, C.sky, C.lime, C.fire2, C.lav, C.peach];
export const spotOf = (n: number) => SPOT[clamp(n - 1, 0, 999)];

const emCache = new Map<number, EmblemKey>();
export function emblemOf(nm: NameSpan): EmblemKey {
  let e = emCache.get(nm.n);
  if (!e) { e = emblemFor(nm.name, nm.meaning, nm.n); emCache.set(nm.n, e); }
  return e;
}

/** The lit and unlit lamps up to `lit`, painted once into a layer and reused. */
let layer: { lit: number; cv: HTMLCanvasElement } | null = null;
function lampLayer(lit: number) {
  if (layer && layer.lit === lit) return layer.cv;
  const cv = layer?.cv ?? document.createElement('canvas');
  cv.width = 1600; cv.height = 900;
  const g = cv.getContext('2d')!;
  g.clearRect(0, 0, 1600, 900);
  g.fillStyle = 'rgba(255,240,210,0.16)';
  for (let k = lit; k < 1000; k++) { const [x, y] = SPOT[k]; g.fillRect(x - 1.5, y - 1.5, 3, 3); }
  for (let k = 0; k < lit; k++) { const [x, y] = SPOT[k]; circle(g, x, y, 6.5, HUES[Math.floor(k / 9) % HUES.length], 'rgba(40,20,10,0.7)', 1); }
  layer = { lit, cv };
  return cv;
}

function lights(g: G, lit: number, cur: NameSpan[], nc: number[], t: number) {
  g.drawImage(lampLayer(lit), 0, 0);
  // a few lamps flicker at a time
  for (let i = 0; i < Math.min(lit, 24); i++) {
    const k = Math.floor((i * 97 + Math.floor(t * 0.7) * 131) % lit), [x, y] = SPOT[k];
    g.globalAlpha = 0.5 * Math.max(0, Math.sin(t * 2 + i)); g.fillStyle = C.white; star4(g, x, y, 5);
  }
  g.globalAlpha = 1;
  // this verse's names, blooming as they are chanted
  cur.forEach((nm, i) => {
    const f = nc[i]; if (f <= 0) return;
    const [x, y] = SPOT[nm.n - 1], k = out(clamp(f * 1.6));
    const live = f < 1;
    if (live) { const gr = g.createRadialGradient(x, y, 2, x, y, 46); gr.addColorStop(0, 'rgba(255,230,140,0.8)'); gr.addColorStop(1, 'rgba(255,230,140,0)'); g.fillStyle = gr; g.fillRect(x - 46, y - 46, 92, 92); }
    circle(g, x, y, lerp(2, live ? 11 : 6.5, k), HUES[Math.floor((nm.n - 1) / 9) % HUES.length], 'rgba(40,20,10,0.7)', 1.2);
    if (live) { g.fillStyle = C.white; star4(g, x, y, 5 + 4 * Math.sin(t * 8)); }
  });
}

/* ───────── the forms ───────── */

const FEET = 830;
function form(g: G, k: string, t: number, b: Beat) {
  switch (k) {
    case 'shayana':
      reclining(g, CX, 640, 1.05, t, { brahma: 1 });
      break;
    case 'lakshmi':
      aureole(g, CX, 400, 1.15, t);
      deity(g, CX - 120, FEET, 1.0, t, { ...VISHNU, base: 'lotus' });
      deity(g, CX + 140, FEET, 0.86, t, { ...LAKSHMI, base: 'lotus' });
      break;
    case 'krishna':
      cows(g, 300, 520, 820, 0.6, t, 3, 5); cows(g, 1080, 1300, 820, 0.6, t, 3, 9);
      aureole(g, CX, 390, 1.1, t);
      deity(g, CX, FEET, 1.15, t, { ...KRISHNA_ICON, garland: true });
      break;
    case 'narasimha':
      glory(g, CX, 380, 120, 330, t, 30, [C.fire, C.fire2]);
      deity(g, CX, FEET, 1.15, t, NARASIMHA);
      break;
    case 'vishvarupa':
      deity(g, CX, FEET, 1.1, t, VISHVARUPA(12));
      break;
    case 'surya':
      sunDisc(g, CX, 380, 170, t, false);
      deity(g, CX, FEET, 1.1, t, VISHNU);
      break;
    case 'yogi':
      aureole(g, CX, 470, 1.0, t, [C.lav, C.cream]);
      deity(g, CX, FEET, 1.15, t, { ...VISHNU, stance: 'sit', eyes: 'half', hands: ['mala', 'book', 'chakra', 'conch'] });
      break;
    case 'vamana': aureole(g, CX, 470, 1.0, t); avatar(g, 4, CX, FEET, 1.5, t); break;
    case 'varaha': aureole(g, CX, 430, 1.0, t); avatar(g, 2, CX, FEET, 1.5, t); break;
    case 'rama': aureole(g, CX, 430, 1.0, t); avatar(g, 6, CX, FEET, 1.5, t); break;
    case 'garuda':
      garuda(g, CX, FEET + 10, 0.8, t);
      deity(g, CX, FEET - 270, 0.62, t, { ...VISHNU, base: 'none' });
      break;
    case 'weapons':
      aureole(g, CX, 400, 1.1, t);
      deity(g, CX, FEET, 1.1, t, VISHNU);
      weaponWheel(g, CX, 470, 330, t, 0.7);
      break;
    default:
      aureole(g, CX, 400, 1.15, t);
      deity(g, CX, FEET, 1.15, t, VISHNU);
  }
  void b;
}

/* ───────── the scene ───────── */

const stotram = () => VISHNU_WORK.sections[2].verses;

export const mandala: Scene = (g, b) => {
  const t = b.T, v = b.v!, names = v.names ?? [];
  const first = names.length ? names[0].n - 1 : (b.seg.vi < 5 ? 0 : 1000);
  const q = first / 1000;
  // night that turns, over the thousand names, towards dawn
  night(g, t, 5, 70);
  if (q > 0.4) {
    // dawn rises from the horizon: the top of the sky stays night
    const k = io(clamp((q - 0.4) / 0.6)), gr = g.createLinearGradient(0, 0, 0, 900);
    gr.addColorStop(0, 'rgba(40,40,110,0)'); gr.addColorStop(0.45, `rgba(214,90,120,${0.35 * k})`); gr.addColorStop(1, `rgba(250,170,90,${0.8 * k})`);
    g.fillStyle = gr; g.fillRect(-100, -100, 1800, 1100);
  }
  om(g, CX, CY, 150, t, 'rgba(255,215,120,0.12)');
  if (b.arg === 'shayana') ocean(g, 700, 900, t * 0.5, [C.indigo, C.navy2, C.peacock]);

  lights(g, first, names, b.nc, t);

  // the form, cross-fading from the previous shloka's
  const prev = stotram()[b.seg.vi - 1]?.arg as string | undefined, now = String(b.arg ?? 'chaturbhuja');
  const k = prev && prev !== now ? io(clamp(b.t / 1.6)) : 1;
  if (k < 1 && prev) { g.save(); g.globalAlpha = 1 - k; form(g, prev, t, b); g.restore(); }
  g.save(); g.globalAlpha = k; form(g, now, t, b); g.restore();

  // the name being chanted, in its cartouche, with its emblem and number
  const i = b.ni >= 0 ? b.ni : names.findIndex((_, j) => b.nc[j] > 0 && b.nc[j] < 1);
  const last = (() => { for (let j = names.length - 1; j >= 0; j--) if (b.nc[j] >= 1) return j; return -1; })();
  const show = i >= 0 ? i : last;
  if (show >= 0) {
    const nm = names[show], a = clamp(b.d - b.t - 0.2);
    cartouche(g, iastToDev(nm.name), CX + 40, 92, 46, { alpha: a, w: 420 });
    g.save(); g.globalAlpha = a;
    emblem(g, emblemOf(nm), CX - 230, 92, 0.78, t);
    devText(g, dn(nm.n), CX + 300, 92, 34, C.gold);
    // a thread of light from the cartouche to the name's own lamp
    const [sx, sy] = spotOf(nm.n);
    if (i >= 0) { g.strokeStyle = `rgba(255,220,130,${0.6 * a})`; g.lineWidth = 2; g.setLineDash([4, 8]); g.beginPath(); g.moveTo(CX + 40, 120); g.quadraticCurveTo(lerp(CX, sx, 0.5), lerp(140, sy, 0.2), sx, sy); g.stroke(); g.setLineDash([]); }
    g.restore();
  } else if (!names.length) {
    // the closing Om and the shloka of the weapons
    cartouche(g, 'ॐ नम इति', CX, 92, 44, { w: 340 });
  }
  // counter in the corner
  const done = first + b.nc.filter((f) => f >= 1).length;
  g.save(); g.textAlign = 'right'; devText(g, `${dn(done)} / १०००`, PW - 54, 60, 26, C.cream, 'right'); g.restore();
  border(g, C.maroon);
};

export const NAME_LIGHTS = SPOT;
export { lotus };
