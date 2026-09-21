/**
 * The instrument.
 *
 * Every shot in the reference is the same lens pointed at a different subject,
 * and it is the lens that makes the film hold together: a bright circular field
 * with a feathered edge, concentric machined rings around it going into the
 * dark, grain over everything, a little colour fringing at the edge where the
 * glass gives up, and a slow drift because nobody holds a barrel perfectly
 * still.
 *
 * None of this is a filter laid over a picture. It is the reason the pictures
 * are a set: twelve unrelated subjects, one eyepiece.
 */

export interface Barrel {
  /** How much of the frame the bright field fills, 0..1 of the half-width. */
  aperture: number;
  /** Softness of the field edge, in the same units. */
  feather: number;
  /** Grain strength, 0..1. */
  grain: number;
  /** Colour fringing at the rim, in pixels. */
  fringe: number;
}

export const EYEPIECE: Barrel = { aperture: 0.74, feather: 0.1, grain: 0.15, fringe: 2.2 };

const noise = (() => {
  let tile: HTMLCanvasElement | null = null;
  return (size: number) => {
    if (tile && tile.width === size) return tile;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const g = c.getContext('2d');
    if (!g) return c;
    const d = g.createImageData(size, size);
    for (let i = 0; i < size * size; i++) {
      const v = 118 + Math.random() * 74;
      d.data[i * 4] = v;
      d.data[i * 4 + 1] = v;
      d.data[i * 4 + 2] = v;
      d.data[i * 4 + 3] = 255;
    }
    g.putImageData(d, 0, 0);
    tile = c;
    return c;
  };
})();

/**
 * Put a drawn field inside the barrel.
 *
 * `plate` is the picture, already drawn, square. `out` is the frame. The drift
 * is fed in rather than generated, so a frame is a pure function of time and
 * the film renders identically every time it is run.
 */
export function throughLens(
  out: CanvasRenderingContext2D,
  plate: HTMLCanvasElement,
  W: number,
  t: number,
  b: Barrel = EYEPIECE,
  zoom = 1,
) {
  const cx = W / 2;
  const cy = W / 2;
  const R = (W / 2) * b.aperture * zoom;

  // The dark the barrel sits in.
  out.fillStyle = '#0b0c10';
  out.fillRect(0, 0, W, W);

  // The bright field, with the plate inside it. Drifting, because a hand.
  const dx = Math.sin(t * 0.31) * W * 0.004 + Math.sin(t * 0.13) * W * 0.002;
  const dy = Math.cos(t * 0.26) * W * 0.004 + Math.cos(t * 0.11) * W * 0.002;
  const breathe = 1 + Math.sin(t * 0.22) * 0.006;

  out.save();
  out.beginPath();
  out.arc(cx + dx, cy + dy, R * breathe, 0, Math.PI * 2);
  out.clip();
  const s = R * 2 * breathe;
  out.drawImage(plate, cx + dx - s / 2, cy + dy - s / 2, s, s);

  // Fringing: the same picture a hair bigger in warm and a hair smaller in
  // cool, both very faint, which is what an uncorrected edge does to a colour.
  if (b.fringe > 0) {
    out.globalCompositeOperation = 'lighter';
    out.globalAlpha = 0.07;
    out.drawImage(plate,
      cx + dx - s / 2 - b.fringe, cy + dy - s / 2, s + b.fringe * 2, s + b.fringe * 2);
    out.globalAlpha = 0.05;
    out.drawImage(plate,
      cx + dx - s / 2 + b.fringe, cy + dy - s / 2, s - b.fringe * 2, s - b.fringe * 2);
    out.globalAlpha = 1;
    out.globalCompositeOperation = 'source-over';
  }
  out.restore();

  // The feathered edge of the field, fading into the barrel.
  const edge = out.createRadialGradient(
    cx + dx, cy + dy, R * breathe * (1 - b.feather),
    cx + dx, cy + dy, R * breathe * 1.02,
  );
  edge.addColorStop(0, 'rgba(11,12,16,0)');
  edge.addColorStop(1, 'rgba(11,12,16,1)');
  out.fillStyle = edge;
  out.beginPath();
  out.arc(cx + dx, cy + dy, R * breathe * 1.04, 0, Math.PI * 2);
  out.fill();

  // Machined rings. Each one is a soft ellipse of grey, slightly off-centre
  // from the last, which is what makes a barrel look turned rather than drawn.
  for (let i = 0; i < 5; i++) {
    const k = 1.06 + i * 0.13;
    const ox = dx * (1 - i * 0.12);
    const oy = dy * (1 - i * 0.12);
    const ring = out.createRadialGradient(
      cx + ox, cy + oy, R * k * 0.965,
      cx + ox, cy + oy, R * k * 1.045,
    );
    ring.addColorStop(0, 'rgba(255,255,255,0)');
    ring.addColorStop(0.5, `rgba(212,216,226,${0.06 - i * 0.008})`);
    ring.addColorStop(1, 'rgba(255,255,255,0)');
    out.fillStyle = ring;
    out.fillRect(0, 0, W, W);
  }

  // Grain, over the whole frame including the dark. Without it the barrel is
  // a flat black hole; with it, it is a photograph of one.
  if (b.grain > 0) {
    const tile = noise(180);
    out.save();
    out.globalCompositeOperation = 'overlay';
    out.globalAlpha = b.grain;
    const off = ((t * 61) | 0) % 90;
    for (let y = -off; y < W; y += tile.height) {
      for (let x = -off; x < W; x += tile.width) out.drawImage(tile, x, y);
    }
    out.restore();
  }

  // And a last vignette, so the corners are never quite black-zero.
  const vig = out.createRadialGradient(cx, cy, W * 0.3, cx, cy, W * 0.78);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.55)');
  out.fillStyle = vig;
  out.fillRect(0, 0, W, W);
}

/** The open frame: no barrel, for the shots at either end and the titles. */
export function openFrame(
  out: CanvasRenderingContext2D, plate: HTMLCanvasElement, W: number, t: number, b = EYEPIECE,
) {
  const breathe = 1 + Math.sin(t * 0.19) * 0.012;
  const s = W * breathe * 1.04;
  out.fillStyle = '#0b0c10';
  out.fillRect(0, 0, W, W);
  out.drawImage(plate, (W - s) / 2, (W - s) / 2, s, s);
  if (b.grain > 0) {
    const tile = noise(180);
    out.save();
    out.globalCompositeOperation = 'overlay';
    out.globalAlpha = b.grain * 0.8;
    const off = ((t * 61) | 0) % 90;
    for (let y = -off; y < W; y += tile.height) {
      for (let x = -off; x < W; x += tile.width) out.drawImage(tile, x, y);
    }
    out.restore();
  }
  const vig = out.createRadialGradient(W / 2, W / 2, W * 0.34, W / 2, W / 2, W * 0.8);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.38)');
  out.fillStyle = vig;
  out.fillRect(0, 0, W, W);
}

/** A title, set the way the reference sets one: light serif, centred, nothing else. */
export function title(
  out: CanvasRenderingContext2D, W: number, text: string, sub: string, alpha: number,
) {
  if (alpha <= 0) return;
  out.save();
  out.globalAlpha = Math.min(1, alpha);
  out.fillStyle = '#f6f2ea';
  out.textAlign = 'center';
  out.textBaseline = 'alphabetic';
  out.font = `${W * 0.085}px Georgia, "Times New Roman", serif`;
  out.fillText(text, W / 2, W * 0.52);
  if (sub) {
    out.font = `${W * 0.023}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    out.letterSpacing = `${W * 0.004}px`;
    out.globalAlpha = Math.min(1, alpha) * 0.82;
    out.fillText(sub.toUpperCase(), W / 2, W * 0.575);
    out.letterSpacing = '0px';
  }
  out.restore();
}
