/**
 * The source.
 *
 * Every one of the hundred styles is a *resampling* of the same picture, so
 * the picture gets drawn once, tonally, into an offscreen buffer and then read
 * back as a field. That is the whole architecture and it is what makes a
 * hundred renderers depict the same thing rather than a hundred different
 * things: engraving, stipple and voronoi are not three drawings, they are
 * three ways of asking the same luminance field what it looks like.
 *
 * What is drawn is a *composition*, not a likeness — the framing, the light
 * and the mood of the reference: a head and bare shoulders low-key against a
 * dark bar interior, hair centre-parted and falling past the shoulders, a
 * level gaze, a pressed-down mouth, a fine chain, and a red-and-blue sign
 * burning out of focus behind.
 */

// Near square, like the reference frame. A tall crop makes the head narrow
// for its height and no amount of widening the face fixes it.
export const SRC_W = 288;
export const SRC_H = 300;

export const enum Region {
  Back = 0,
  Neon = 1,
  Hair = 2,
  Skin = 3,
  Feature = 4,
  Metal = 5,
}

export interface Field {
  w: number;
  h: number;
  /** Straight RGB, four bytes a pixel. */
  rgb: Uint8ClampedArray;
  /** 0 black, 1 white. */
  lum: Float32Array;
  region: Uint8Array;
  canvas: HTMLCanvasElement;
}

/** Luminance at a normalised point, with the edges clamped. */
export function lum(f: Field, x: number, y: number): number {
  const i = Math.max(0, Math.min(f.w - 1, Math.round(x * (f.w - 1))));
  const j = Math.max(0, Math.min(f.h - 1, Math.round(y * (f.h - 1))));
  return f.lum[j * f.w + i];
}

export function regionAt(f: Field, x: number, y: number): Region {
  const i = Math.max(0, Math.min(f.w - 1, Math.round(x * (f.w - 1))));
  const j = Math.max(0, Math.min(f.h - 1, Math.round(y * (f.h - 1))));
  return f.region[j * f.w + i] as Region;
}

export function rgbAt(f: Field, x: number, y: number): [number, number, number] {
  const i = Math.max(0, Math.min(f.w - 1, Math.round(x * (f.w - 1))));
  const j = Math.max(0, Math.min(f.h - 1, Math.round(y * (f.h - 1))));
  const k = (j * f.w + i) * 4;
  return [f.rgb[k], f.rgb[k + 1], f.rgb[k + 2]];
}

/**
 * The direction the tone is changing, and how fast.
 *
 * Half the styles need this rather than the tone itself — hatching that runs
 * *along* the form, a flow field, contour lines, a single continuous line that
 * follows an edge. A Sobel over the luminance, which is four lookups and is
 * the difference between shading that describes the head and shading that
 * lies on top of it.
 */
export function slope(f: Field, x: number, y: number, step = 0.012): { angle: number; mag: number } {
  const l = lum(f, x - step, y);
  const r = lum(f, x + step, y);
  const u = lum(f, x, y - step);
  const d = lum(f, x, y + step);
  const gx = r - l;
  const gy = d - u;
  return { angle: Math.atan2(gy, gx), mag: Math.hypot(gx, gy) };
}

const rng = (seed: number) => {
  let a = (seed ^ 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** The landmarks, in fractions of the frame, so a style can find the eyes. */
export const L = {
  midX: 0.5,
  hairTop: 0.05,
  hairline: 0.2,
  brow: 0.295,
  eye: 0.345,
  nose: 0.44,
  mouth: 0.508,
  chin: 0.585,
  jaw: 0.535,
  neck: 0.68,
  shoulder: 0.735,
  faceHalf: 0.156,
  hairHalf: 0.262,
  eyeGap: 0.072,
  neon: [0.775, 0.2] as [number, number],
} as const;

/**
 * Draw the composition.
 *
 * Tonal rather than flat: soft gradients, because everything downstream reads
 * luminance and a flat-shaded source gives a hundred styles that all look
 * posterised. The regions are painted into a parallel buffer as it goes, so a
 * style can treat hair differently from skin without having to guess from the
 * colour.
 */
export function buildSource(seed = 1): Field {
  const canvas = document.createElement('canvas');
  canvas.width = SRC_W;
  canvas.height = SRC_H;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  const region = new Uint8Array(SRC_W * SRC_H);
  if (!g) throw new Error('no 2d context');
  const r = rng(seed);
  const W = SRC_W;
  const H = SRC_H;
  const px = (x: number) => x * W;
  const py = (y: number) => y * H;

  // A region is stamped by re-drawing the same path into a scratch mask, which
  // is cheaper and far more reliable than trying to infer "this pixel is hair"
  // from the colour of a pixel that is also nearly black in the background.
  const mask = document.createElement('canvas');
  mask.width = W;
  mask.height = H;
  const mg = mask.getContext('2d', { willReadFrequently: true });
  const stamp = (draw: (c: CanvasRenderingContext2D) => void, id: Region) => {
    if (!mg) return;
    mg.clearRect(0, 0, W, H);
    draw(mg);
    const d = mg.getImageData(0, 0, W, H).data;
    for (let i = 0; i < region.length; i++) if (d[i * 4 + 3] > 110) region[i] = id;
  };

  // ------------------------------------------------------------ the room
  g.fillStyle = '#090707';
  g.fillRect(0, 0, W, H);
  const room = g.createRadialGradient(px(0.5), py(0.4), 0, px(0.5), py(0.45), py(0.9));
  room.addColorStop(0, 'rgba(112,86,66,0.5)');
  room.addColorStop(0.55, 'rgba(60,46,38,0.26)');
  room.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = room;
  g.fillRect(0, 0, W, H);

  // Out-of-focus warmth: the room behind, reduced to what a long lens leaves.
  for (let i = 0; i < 18; i++) {
    const bx = r();
    const by = r() * 0.6;
    const rad = (0.03 + r() * 0.09) * W;
    const glow = g.createRadialGradient(px(bx), py(by), 0, px(bx), py(by), rad);
    const warm = r() < 0.7;
    glow.addColorStop(0, warm ? 'rgba(176,116,56,0.34)' : 'rgba(80,104,150,0.28)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = glow;
    g.fillRect(px(bx) - rad, py(by) - rad, rad * 2, rad * 2);
  }

  // The sign. A rounded rectangle in red with a blue field inside it, thrown
  // well out of focus — it is the only saturated thing on the card and every
  // two-colour style downstream keys off it.
  const nx = px(L.neon[0]);
  const ny = py(L.neon[1]);
  const nw = W * 0.15;
  const nh = H * 0.17;
  const neonPath = (c: CanvasRenderingContext2D) => {
    c.beginPath();
    const rr = nw * 0.42;
    c.moveTo(nx - nw / 2 + rr, ny - nh / 2);
    c.arcTo(nx + nw / 2, ny - nh / 2, nx + nw / 2, ny + nh / 2, rr);
    c.arcTo(nx + nw / 2, ny + nh / 2, nx - nw / 2, ny + nh / 2, rr);
    c.arcTo(nx - nw / 2, ny + nh / 2, nx - nw / 2, ny - nh / 2, rr);
    c.arcTo(nx - nw / 2, ny - nh / 2, nx + nw / 2, ny - nh / 2, rr);
    c.closePath();
  };
  const halo = g.createRadialGradient(nx, ny, 0, nx, ny, nw * 1.9);
  halo.addColorStop(0, 'rgba(214,60,58,0.55)');
  halo.addColorStop(1, 'rgba(214,60,58,0)');
  g.fillStyle = halo;
  g.fillRect(nx - nw * 2, ny - nw * 2, nw * 4, nw * 4);
  g.lineWidth = nw * 0.16;
  g.strokeStyle = '#e0504a';
  neonPath(g);
  g.stroke();
  g.fillStyle = '#3f7fc4';
  g.beginPath();
  g.ellipse(nx, ny - nh * 0.1, nw * 0.2, nh * 0.16, 0, 0, Math.PI * 2);
  g.fill();
  stamp((c) => {
    c.lineWidth = nw * 0.3;
    c.strokeStyle = '#fff';
    neonPath(c);
    c.stroke();
  }, Region.Neon);

  // ------------------------------------------------------------ the figure
  const hairPath = (c: CanvasRenderingContext2D) => {
    c.beginPath();
    c.moveTo(px(L.midX), py(L.hairTop));
    c.bezierCurveTo(px(L.midX + L.hairHalf * 0.9), py(L.hairTop + 0.01), px(L.midX + L.hairHalf * 1.06), py(0.34), px(L.midX + L.hairHalf * 0.98), py(0.66));
    c.bezierCurveTo(px(L.midX + L.hairHalf * 0.94), py(0.86), px(L.midX + L.hairHalf * 0.8), py(0.97), px(L.midX + L.hairHalf * 0.72), py(1.02));
    c.lineTo(px(L.midX - L.hairHalf * 0.72), py(1.02));
    c.bezierCurveTo(px(L.midX - L.hairHalf * 0.8), py(0.97), px(L.midX - L.hairHalf * 0.94), py(0.86), px(L.midX - L.hairHalf * 0.98), py(0.66));
    c.bezierCurveTo(px(L.midX - L.hairHalf * 1.06), py(0.34), px(L.midX - L.hairHalf * 0.9), py(L.hairTop + 0.01), px(L.midX), py(L.hairTop));
    c.closePath();
  };

  const shoulderPath = (c: CanvasRenderingContext2D) => {
    c.beginPath();
    c.moveTo(px(-0.06), py(1.04));
    c.bezierCurveTo(px(0.06), py(L.shoulder + 0.03), px(0.26), py(L.shoulder - 0.02), px(L.midX - 0.11), py(L.neck + 0.01));
    c.lineTo(px(L.midX + 0.11), py(L.neck + 0.01));
    c.bezierCurveTo(px(0.74), py(L.shoulder - 0.02), px(0.94), py(L.shoulder + 0.03), px(1.06), py(1.04));
    c.closePath();
  };

  const facePath = (c: CanvasRenderingContext2D) => {
    c.beginPath();
    c.moveTo(px(L.midX), py(L.hairTop + 0.03));
    c.bezierCurveTo(px(L.midX + L.faceHalf * 1.16), py(0.1), px(L.midX + L.faceHalf * 1.16), py(0.4), px(L.midX + L.faceHalf * 0.98), py(L.jaw));
    c.bezierCurveTo(px(L.midX + L.faceHalf * 0.62), py(L.chin + 0.02), px(L.midX + L.faceHalf * 0.28), py(L.chin + 0.035), px(L.midX), py(L.chin + 0.038));
    c.bezierCurveTo(px(L.midX - L.faceHalf * 0.28), py(L.chin + 0.035), px(L.midX - L.faceHalf * 0.62), py(L.chin + 0.02), px(L.midX - L.faceHalf * 0.98), py(L.jaw));
    c.bezierCurveTo(px(L.midX - L.faceHalf * 1.16), py(0.4), px(L.midX - L.faceHalf * 1.16), py(0.1), px(L.midX), py(L.hairTop + 0.03));
    c.closePath();
  };

  // Hair behind, shoulders, then the face, then the hair that falls in front.
  g.fillStyle = '#0c0a0b';
  hairPath(g);
  g.fill();
  stamp(hairPath, Region.Hair);

  const skinLo = '#6d4436';
  const skinHi = '#d8a887';
  g.fillStyle = skinLo;
  shoulderPath(g);
  g.fill();
  stamp(shoulderPath, Region.Skin);
  // The key light: high and slightly to the camera's left, falling off fast,
  // which is the whole reason the shoulders go dark at the edges.
  // Wide, not tight. A small hot key models beautifully in colour and then
  // collapses to a narrow white wedge the moment a technique thresholds it —
  // which is what all hundred of them do.
  const key = g.createRadialGradient(px(0.46), py(0.34), py(0.14), px(0.5), py(0.44), py(0.84));
  key.addColorStop(0, 'rgba(255,236,210,1)');
  key.addColorStop(0.42, 'rgba(226,178,140,0.86)');
  key.addColorStop(0.78, 'rgba(120,72,50,0.5)');
  key.addColorStop(1, 'rgba(24,12,10,0)');
  g.save();
  shoulderPath(g);
  g.clip();
  g.fillStyle = key;
  g.fillRect(0, 0, W, H);
  g.restore();

  // Neck, in shadow under the jaw.
  g.save();
  g.beginPath();
  g.moveTo(px(L.midX - 0.075), py(L.jaw));
  g.lineTo(px(L.midX + 0.075), py(L.jaw));
  g.lineTo(px(L.midX + 0.095), py(L.neck + 0.03));
  g.lineTo(px(L.midX - 0.095), py(L.neck + 0.03));
  g.closePath();
  g.fillStyle = '#8a5a44';
  g.fill();
  const nsh = g.createLinearGradient(0, py(L.jaw), 0, py(L.neck));
  nsh.addColorStop(0, 'rgba(24,12,10,0.72)');
  nsh.addColorStop(1, 'rgba(24,12,10,0)');
  g.fillStyle = nsh;
  g.fill();
  g.restore();

  g.fillStyle = skinHi;
  facePath(g);
  g.fill();
  stamp(facePath, Region.Skin);
  g.save();
  facePath(g);
  g.clip();
  g.fillStyle = key;
  g.fillRect(0, 0, W, H);
  // Modelling: the brow shelf, the sockets, the side of the nose, and the
  // shadow under the lower lip. Four soft marks, and they are what stop the
  // face reading as an egg once a style throws the colour away.
  const soft = (x: number, y: number, rx: number, ry: number, a: number, rot = 0) => {
    const grd = g.createRadialGradient(px(x), py(y), 0, px(x), py(y), Math.max(px(rx), py(ry)));
    grd.addColorStop(0, `rgba(58,28,20,${a})`);
    grd.addColorStop(1, 'rgba(58,28,20,0)');
    g.save();
    g.translate(px(x), py(y));
    g.rotate(rot);
    g.scale(1, (py(ry) / px(rx)) || 1);
    g.translate(-px(x), -py(y));
    g.fillStyle = grd;
    g.fillRect(px(x) - px(rx) * 2, py(y) - px(rx) * 2, px(rx) * 4, px(rx) * 4);
    g.restore();
  };
  soft(L.midX, L.brow - 0.01, 0.14, 0.04, 0.72);
  soft(L.midX - L.eyeGap, L.eye, 0.055, 0.032, 0.86);
  soft(L.midX + L.eyeGap, L.eye, 0.055, 0.032, 0.86);
  soft(L.midX + 0.03, L.nose - 0.035, 0.032, 0.07, 0.8);
  soft(L.midX, L.mouth + 0.038, 0.055, 0.026, 0.72);
  soft(L.midX, L.chin + 0.022, 0.1, 0.034, 0.75);
  soft(L.midX - L.faceHalf * 0.95, 0.42, 0.055, 0.16, 0.85);
  soft(L.midX + L.faceHalf * 0.92, 0.4, 0.045, 0.15, 0.6);
  // The cheekbone catching the key, which is the brightest thing on the card
  // and the reason the face has a structure at all once the colour is gone.
  const lit = g.createRadialGradient(px(L.midX - 0.045), py(0.4), 0, px(L.midX - 0.045), py(0.4), py(0.1));
  lit.addColorStop(0, 'rgba(255,244,224,0.5)');
  lit.addColorStop(1, 'rgba(255,244,224,0)');
  g.fillStyle = lit;
  g.fillRect(0, 0, W, H);
  g.restore();

  // The features. Small, dark, and placed rather than modelled: at this scale
  // an eye is a mark and a mouth is a mark, and every style downstream will
  // find them because they are the darkest things inside the face.
  const featureShapes = (c: CanvasRenderingContext2D) => {
    for (const s of [-1, 1]) {
      c.beginPath();
      c.ellipse(px(L.midX + s * L.eyeGap), py(L.eye), px(0.031), py(0.0165), 0, 0, Math.PI * 2);
      c.fill();
      // The brow: level, and a shade heavier at the inner end, which is what
      // makes the expression unimpressed rather than surprised.
      c.beginPath();
      c.moveTo(px(L.midX + s * 0.024), py(L.brow - 0.008));
      c.lineTo(px(L.midX + s * 0.105), py(L.brow + 0.004));
      c.lineTo(px(L.midX + s * 0.105), py(L.brow + 0.019));
      c.lineTo(px(L.midX + s * 0.024), py(L.brow + 0.013));
      c.closePath();
      c.fill();
    }
    // The mouth: closed, pressed, corners down. One shape and a shadow.
    // Corners *below* the centre. The first version dipped in the middle,
    // which is a smile, and no amount of brow-lowering rescued it.
    c.beginPath();
    c.moveTo(px(L.midX - 0.055), py(L.mouth + 0.016));
    c.bezierCurveTo(px(L.midX - 0.022), py(L.mouth - 0.004), px(L.midX + 0.022), py(L.mouth - 0.004), px(L.midX + 0.055), py(L.mouth + 0.016));
    c.bezierCurveTo(px(L.midX + 0.022), py(L.mouth + 0.009), px(L.midX - 0.022), py(L.mouth + 0.009), px(L.midX - 0.055), py(L.mouth + 0.016));
    c.closePath();
    c.fill();
    // The lower lip pushed up under it, which is what "pressed" looks like.
    c.beginPath();
    c.ellipse(px(L.midX), py(L.mouth + 0.024), px(0.034), py(0.008), 0, 0, Math.PI * 2);
    c.fill();
    // Nostrils.
    for (const s of [-1, 1]) {
      c.beginPath();
      c.ellipse(px(L.midX + s * 0.022), py(L.nose), px(0.009), py(0.006), 0, 0, Math.PI * 2);
      c.fill();
    }
  };
  g.fillStyle = '#2b1512';
  featureShapes(g);
  stamp((c) => {
    c.fillStyle = '#fff';
    featureShapes(c);
  }, Region.Feature);
  // A catchlight in each eye, which is the one bright accent on the face.
  g.fillStyle = 'rgba(255,246,230,0.85)';
  for (const s of [-1, 1]) {
    g.beginPath();
    g.ellipse(px(L.midX + s * L.eyeGap - 0.008), py(L.eye - 0.005), px(0.007), py(0.005), 0, 0, Math.PI * 2);
    g.fill();
  }

  // The hair in front: two curtains from the centre part, over the face edges.
  const frontHair = (c: CanvasRenderingContext2D) => {
    for (const s of [-1, 1]) {
      c.beginPath();
      // Outer: the silhouette of the mass.
      c.moveTo(px(L.midX + s * 0.006), py(L.hairTop));
      c.bezierCurveTo(
        px(L.midX + s * L.hairHalf * 0.72), py(L.hairTop + 0.02),
        px(L.midX + s * L.hairHalf * 1.04), py(0.3),
        px(L.midX + s * L.hairHalf * 1.0), py(0.74),
      );
      c.lineTo(px(L.midX + s * L.hairHalf * 1.02), py(1.02));
      c.lineTo(px(L.midX + s * L.hairHalf * 0.42), py(1.02));
      // Inner: down the side of the face, then *out along the hairline* rather
      // than back up to the parting. Running the inner edge to the crown
      // pinches the face into a spearhead, which is what every threshold
      // technique then prints — a white wedge with two eyes in it.
      c.bezierCurveTo(
        px(L.midX + s * L.hairHalf * 0.46), py(0.7),
        px(L.midX + s * L.faceHalf * 1.02), py(0.42),
        px(L.midX + s * L.faceHalf * 0.98), py(L.hairline + 0.05),
      );
      c.bezierCurveTo(
        px(L.midX + s * L.faceHalf * 0.78), py(L.hairline - 0.012),
        px(L.midX + s * L.faceHalf * 0.34), py(L.hairline - 0.028),
        px(L.midX + s * 0.006), py(L.hairline - 0.03),
      );
      c.lineTo(px(L.midX + s * 0.006), py(L.hairTop));
      c.closePath();
      c.fill();
    }
  };

  g.fillStyle = '#0e0c0d';
  frontHair(g);
  stamp((c) => {
    c.fillStyle = '#fff';
    frontHair(c);
  }, Region.Hair);
  // Sheen on the hair, so it is a mass with light on it rather than a hole.
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (const s of [-1, 1]) {
    const sh = g.createLinearGradient(px(L.midX + s * 0.11), 0, px(L.midX + s * 0.2), 0);
    sh.addColorStop(0, 'rgba(120,104,104,0)');
    sh.addColorStop(0.5, 'rgba(118,102,104,0.34)');
    sh.addColorStop(1, 'rgba(120,104,104,0)');
    g.fillStyle = sh;
    g.fillRect(px(L.midX + s * 0.06), py(0.1), px(0.2) * s, py(0.8));
  }
  g.restore();

  // The chain, and the pendant sitting in the hollow of the throat.
  const chain = (c: CanvasRenderingContext2D) => {
    c.beginPath();
    c.moveTo(px(L.midX - 0.11), py(L.neck + 0.035));
    c.quadraticCurveTo(px(L.midX), py(L.neck + 0.11), px(L.midX + 0.11), py(L.neck + 0.035));
    c.stroke();
    c.beginPath();
    c.ellipse(px(L.midX), py(L.neck + 0.125), px(0.017), py(0.016), 0, 0, Math.PI * 2);
    c.fill();
  };
  g.strokeStyle = '#c9a95e';
  g.fillStyle = '#e0c078';
  g.lineWidth = Math.max(1, W * 0.005);
  chain(g);
  stamp((c) => {
    c.strokeStyle = '#fff';
    c.fillStyle = '#fff';
    c.lineWidth = Math.max(2, W * 0.012);
    chain(c);
  }, Region.Metal);

  // A last vignette, which is what a bar looks like at f/1.8.
  const vig = g.createRadialGradient(px(0.5), py(0.42), py(0.2), px(0.5), py(0.5), py(0.78));
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.3)');
  g.fillStyle = vig;
  g.fillRect(0, 0, W, H);

  const data = g.getImageData(0, 0, W, H);
  const lumArr = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const k = i * 4;
    lumArr[i] = (data.data[k] * 0.299 + data.data[k + 1] * 0.587 + data.data[k + 2] * 0.114) / 255;
  }
  return { w: W, h: H, rgb: data.data, lum: lumArr, region, canvas };
}
