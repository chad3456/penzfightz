import type { Beast } from './beasts';

/**
 * A beast's mark.
 *
 * Twelve emblems, none of them drawn by hand. Each one is a radial figure whose
 * blade count, sweep, curl and core all come off the beast's own four stats, so
 * a heavy defensive beast gets a small number of broad overlapping plates and a
 * fast attacker gets a lot of thin swept ones. The mark is therefore never
 * arbitrary — you can read the stats off the sticker, which is what a good
 * sticker does.
 *
 * It is printed once into a canvas and used in three places: the face of the
 * top, the card in the case, and the thing that rises out of the dish when the
 * beast is called.
 */
export function drawSigil(
  c: HTMLCanvasElement,
  b: Beast,
  size: number,
  opts: { ground?: string } = {},
): HTMLCanvasElement {
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  if (!g) return c;
  const R = size / 2;
  g.clearRect(0, 0, size, size);
  g.translate(R, R);
  // On the face of a top the mark needs something to sit on: the pale half of
  // every beast's pair vanishes against a light disc, and the whole thing reads
  // as a smudge at the size it is actually seen at.
  if (opts.ground) {
    g.beginPath();
    g.arc(0, 0, R * 0.99, 0, Math.PI * 2);
    g.fillStyle = opts.ground;
    g.fill();
  }
  // Left-spin beasts are mirrored, so the mark itself tells you which way the
  // top turns before it has turned.
  g.scale(b.spin, 1);

  // Blades: many and thin for an attacker, few and broad for a wall.
  const blades = Math.round(5 + b.attack * 9 - b.defence * 2);
  const spread = (Math.PI * 2) / blades;
  const wide = spread * (0.3 + b.defence * 0.55);
  const reach = R * (0.62 + b.stamina * 0.3);
  const curl = 0.35 + b.attack * 0.75;

  g.lineJoin = 'round';
  for (let i = 0; i < blades; i++) {
    const a = i * spread;
    g.beginPath();
    g.moveTo(Math.cos(a) * R * 0.2, Math.sin(a) * R * 0.2);
    // A swept blade: out along one edge, back along the other, bent by `curl`.
    for (const side of [1, -1]) {
      const steps = 8;
      for (let s = 0; s <= steps; s++) {
        const t = side > 0 ? s / steps : 1 - s / steps;
        const rr = R * 0.2 + (reach - R * 0.2) * t;
        const off = side * wide * 0.5 * (1 - t) + curl * t * spread * 0.5;
        const aa = a + off;
        g.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
      }
    }
    g.closePath();
    g.fillStyle = i % 2 ? b.ink : b.wash;
    g.fill();
    g.strokeStyle = 'rgba(20,18,16,0.55)';
    g.lineWidth = Math.max(1, size / 90);
    g.stroke();
  }

  // The core. Heavy beasts get a solid slug, light ones a ring.
  g.beginPath();
  g.arc(0, 0, R * (0.14 + b.weight * 0.16), 0, Math.PI * 2);
  g.fillStyle = b.weight > 0.6 ? b.ink : b.wash;
  g.fill();
  g.lineWidth = Math.max(1.5, (size / 60) * (0.5 + b.weight));
  g.strokeStyle = b.ink;
  g.stroke();

  g.setTransform(1, 0, 0, 1, 0, 0);
  return c;
}

/** A sigil on its own canvas, ready to be a texture or an <img>. */
export function sigilCanvas(b: Beast, size = 256, ground?: string): HTMLCanvasElement {
  return drawSigil(document.createElement('canvas'), b, size, { ground });
}
