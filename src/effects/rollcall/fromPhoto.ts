import { DIALS, FAMILIES, GENE_COUNT,
  PINNED,
  SPECIES_MASK, mulberry, type Categorical, type Dial, type Genome } from './genome';
import { HAIR_INK, TONES } from './face';

/**
 * Reading a photograph into a genome.
 *
 * Be clear about what this is. It is **not** a likeness, and it is not trying
 * to be: forty-four doodle genes cannot resolve to a particular person, and
 * anything claiming otherwise from a system like this would be lying. What it
 * does is *measure* a handful of things a photograph genuinely tells you —
 * proportions, tones, how much hair there is and where — and set the genes
 * those correspond to. Everything it cannot measure stays random, which is why
 * two reads of the same photograph give two different faces that agree on the
 * things that were measured.
 *
 * The picture never leaves the browser. It is read with FileReader, drawn to a
 * canvas, sampled, and dropped. There is no upload, no request, and nothing is
 * stored.
 */

export interface Marks {
  /** Left eye, right eye, and chin, in image pixels. */
  leftEye: [number, number];
  rightEye: [number, number];
  chin: [number, number];
}

export interface Reading {
  /** 0..1 across the tone ramp. */
  tone: number;
  toneHex: string;
  /** Mean luma of the hair region, 0..255. */
  hairLuma: number;
  hairHex: string;
  /** How much darker the crown is than the cheek: 0 is bald, 1 is a full head. */
  hairAmount: number;
  /** Same, for the jaw. */
  beardAmount: number;
  /** Eye separation as a fraction of eye-line-to-chin. */
  eyeGap: number;
  /** Face width over height, from the marks. */
  aspect: number;
  /** How far the eye line sits above the chin, in pixels — the scale. */
  unit: number;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const luma = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Mean colour of a disc, ignoring anything fully transparent. */
function patch(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  cx: number,
  cy: number,
  r: number,
): [number, number, number] {
  let R = 0;
  let G = 0;
  let B = 0;
  let n = 0;
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(w - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(h - 1, Math.ceil(cy + r));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy > r * r) continue;
      const i = (y * w + x) * 4;
      if (data[i + 3] < 8) continue;
      R += data[i];
      G += data[i + 1];
      B += data[i + 2];
      n++;
    }
  }
  if (!n) return [128, 128, 128];
  return [R / n, G / n, B / n];
}

const hex = (c: [number, number, number]) =>
  '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/** Nearest entry in a ramp, by squared distance in RGB. */
function nearest(ramp: string[], c: [number, number, number]): number {
  let best = 0;
  let bestD = Infinity;
  ramp.forEach((h, i) => {
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    const d = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/**
 * Take the measurements.
 *
 * Everything is expressed relative to the distance from the eye line to the
 * chin, so the reading does not care how large the photograph is or how close
 * the camera was.
 */
export function readFace(
  img: CanvasImageSource,
  width: number,
  height: number,
  marks: Marks,
): Reading {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);

  const [lx, ly] = marks.leftEye;
  const [rx, ry] = marks.rightEye;
  const [cx, cy] = marks.chin;
  const eyeMidX = (lx + rx) / 2;
  const eyeMidY = (ly + ry) / 2;
  const gapPx = Math.hypot(rx - lx, ry - ly);
  const unit = Math.max(8, Math.hypot(cx - eyeMidX, cy - eyeMidY));
  const r = Math.max(3, unit * 0.13);

  // Cheek: out to the side of the eye line, a third of the way down.
  const cheekL = patch(data, width, height, lx - gapPx * 0.42, ly + unit * 0.34, r);
  const cheekR = patch(data, width, height, rx + gapPx * 0.42, ry + unit * 0.34, r);
  const skin: [number, number, number] = [
    (cheekL[0] + cheekR[0]) / 2,
    (cheekL[1] + cheekR[1]) / 2,
    (cheekL[2] + cheekR[2]) / 2,
  ];

  // Background, from the four corners. Needed because the crown probe can
  // easily sit above the head — which is exactly what the first version did on
  // a short face, reading the wall behind somebody as a 9% head of hair.
  const bg: [number, number, number] = [0, 0, 0];
  for (const [px, py] of [
    [width * 0.03, height * 0.03],
    [width * 0.97, height * 0.03],
    [width * 0.03, height * 0.97],
    [width * 0.97, height * 0.97],
  ]) {
    const c4 = patch(data, width, height, px, py, Math.max(3, unit * 0.08));
    bg[0] += c4[0] / 4;
    bg[1] += c4[1] / 4;
    bg[2] += c4[2] / 4;
  }
  const isBackground = (c3: [number, number, number]) =>
    (c3[0] - bg[0]) ** 2 + (c3[1] - bg[1]) ** 2 + (c3[2] - bg[2]) ** 2 < 26 * 26;

  // Crown: three probes up the forehead rather than one. A hairline can sit
  // anywhere between a little above the brows and the top of the skull, and a
  // single probe finds it only by luck.
  const crownProbes: [number, number, number][] = [0.42, 0.62, 0.82]
    .map((f) => patch(data, width, height, eyeMidX, eyeMidY - unit * f, unit * 0.17))
    .filter((c3) => !isBackground(c3));
  const crown =
    crownProbes.length === 0
      ? skin
      : crownProbes.reduce((a, b) => (luma(...a) <= luma(...b) ? a : b));

  // Jaw: inside the chin marker, and likewise ignored if it is the wall.
  const jawProbe = patch(data, width, height, cx, cy - unit * 0.16, unit * 0.2);
  const jaw = isBackground(jawProbe) ? skin : jawProbe;

  const skinL = luma(...skin);
  const crownL = luma(...crown);
  const jawL = luma(...jaw);

  return {
    tone: nearest(TONES, skin) / (TONES.length - 1),
    toneHex: hex(skin),
    hairLuma: crownL,
    hairHex: hex(crown),
    // Hair reads as the crown being darker than the cheek. Normalised so a
    // difference of about eighty levels counts as a full head.
    hairAmount: clamp01((skinL - crownL) / 80),
    beardAmount: clamp01((skinL - jawL) / 70),
    eyeGap: clamp01(gapPx / unit / 1.3),
    aspect: clamp01((gapPx * 2.1) / unit / 1.6),
    unit,
  };
}

const CATS = Object.keys(FAMILIES) as Categorical[];
const setCat = (g: number[], k: Categorical, v: number) => {
  g[CATS.indexOf(k)] = (v + 0.5) / FAMILIES[k];
};
const setDial = (g: number[], k: Dial, v: number) => {
  g[CATS.length + DIALS.indexOf(k)] = clamp01(v);
};

/**
 * Turn a reading into a face.
 *
 * The genes the photograph speaks to are set from it; every other gene is left
 * to the seed. That split is the honest part of this — you can see exactly
 * which eight things came from the picture, and everything else is the house
 * style filling in the rest.
 */
export function genomeFromReading(reading: Reading, seed: number): Genome {
  const r = mulberry(seed);
  // Genes a person does not draw — petal counts, which piece of stationery —
  // are held at the same constant every other person is held at, so they cannot
  // drift and cannot show.
  const mask = SPECIES_MASK[0];
  const g: number[] = Array.from({ length: GENE_COUNT }, (_, i) => (mask[i] ? r() : PINNED));

  // Always a person, never a creature, and always with a wash so the measured
  // tone is actually visible.
  setCat(g, 'species', 0);
  setCat(g, 'kingdom', 0);
  setCat(g, 'paper', 1);
  setDial(g, 'skin', reading.tone);

  // Nothing that would hide or contradict a measurement. The first version left
  // these to the seed and produced a portrait wearing a cap — which covers the
  // hair it had just gone to the trouble of measuring — and a monocle.
  setCat(g, 'wear', 0);
  setCat(g, 'neck', r() < 0.5 ? 0 : 6);
  setCat(g, 'specs', 0);
  setCat(g, 'extra', r() < 0.75 ? 0 : 6);
  setCat(g, 'whisker', 0);
  setCat(g, 'muzzle', 0);
  setCat(g, 'ears', r() < 0.7 ? 0 : 1 + Math.floor(r() * 2));
  setCat(g, 'view', 0);

  setDial(g, 'eyeGap', reading.eyeGap);
  setDial(g, 'headWidth', reading.aspect);
  setDial(g, 'headHeight', 1 - reading.aspect * 0.6);
  // A long face gets a long silhouette family, a wide one a wide family.
  setCat(g, 'head', reading.aspect < 0.35 ? 5 : reading.aspect < 0.5 ? 0 : reading.aspect < 0.7 ? 4 : 6);

  // Hair: how much, and how dark. The family follows the coverage, so a head
  // measured as nearly all hair does not come back as three tufts.
  setDial(g, 'hairAmount', reading.hairAmount);
  setDial(
    g,
    'hairInk',
    nearest(HAIR_INK, [reading.hairLuma, reading.hairLuma, reading.hairLuma]) /
      (HAIR_INK.length - 1),
  );
  setDial(g, 'hairLoud', 0);
  if (reading.hairAmount < 0.15) setCat(g, 'hair', 0);
  else if (reading.hairAmount < 0.4) setCat(g, 'hair', r() < 0.5 ? 1 : 4);
  else if (reading.hairAmount < 0.7) setCat(g, 'hair', r() < 0.5 ? 5 : 3);
  else setCat(g, 'hair', r() < 0.5 ? 2 : 6);

  // Beard: only when the jaw is meaningfully darker than the cheek.
  if (reading.beardAmount < 0.16) setCat(g, 'beard', 0);
  else if (reading.beardAmount < 0.4) setCat(g, 'beard', 5);
  else if (reading.beardAmount < 0.65) setCat(g, 'beard', 3);
  else setCat(g, 'beard', 4);
  setDial(g, 'beardAmount', reading.beardAmount);

  return { g };
}

/** Which genes the photograph actually set. Shown in the UI, verbatim. */
export const MEASURED: { gene: string; from: string }[] = [
  { gene: 'skin', from: 'mean colour of both cheeks, matched to the nearest tone' },
  { gene: 'eyeGap', from: 'eye separation over eye-line-to-chin' },
  { gene: 'headWidth / headHeight', from: 'the same ratio, as an aspect' },
  { gene: 'hairAmount / hairInk / hair', from: 'how much darker the crown is than the cheek' },
  { gene: 'beardAmount / beard', from: 'how much darker the jaw is than the cheek' },
  { gene: 'head', from: 'the aspect again, choosing a long or a wide silhouette' },
  { gene: 'kingdom / paper', from: 'pinned, so the result is a person with a visible tone' },
  { gene: 'wear / specs / muzzle', from: 'pinned off — a hat would hide the hair just measured' },
];
