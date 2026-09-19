/**
 * A risograph, simulated properly.
 *
 * The look in the reference is not "a picture with a dot texture over it". It
 * is separation printing: each ink is its own screen of dots, each screen is
 * rotated to a different angle, and the sheet goes through the drum once per
 * colour. Everything characteristic about riso falls out of that one fact —
 * the moiré where two screens cross, the way a light tint becomes visibly
 * sparse dots rather than pale colour, the slight misregistration at the edges
 * of a shape, and the fact that overlapping inks multiply into a third colour
 * the palette never contained.
 *
 * So nothing here paints a colour directly. A drawing writes **coverage** —
 * how much of each ink lands on each pixel, nought to one — into one greyscale
 * buffer per ink. Only at the end is each buffer screened into dots at its own
 * angle and multiplied onto the sheet.
 *
 * Screen angles are the traditional ones, 30° apart, because two screens at
 * the same angle print as one muddy screen and two screens 5° apart print as a
 * wall of moiré. Fifteen, forty-five, seventy-five and zero is what a print
 * shop uses, and it is what a print shop uses for a reason.
 */

export type Ink = 'rose' | 'teal' | 'navy' | 'mustard' | 'brick';

export interface InkSpec {
  id: Ink;
  /** The ink itself, at full strength on white. */
  hex: string;
  /** Screen angle, degrees. Kept 30 apart between any two inks. */
  angle: number;
  /** Misregistration, in pixels: the drum never lands twice in the same place. */
  slip: [number, number];
}

export const INKS: InkSpec[] = [
  { id: 'navy', hex: '#3d4f78', angle: 75, slip: [0, 0] },
  { id: 'teal', hex: '#3f9e8c', angle: 15, slip: [0.6, -0.4] },
  { id: 'rose', hex: '#e2856f', angle: 45, slip: [-0.5, 0.5] },
  { id: 'mustard', hex: '#e8bc47', angle: 0, slip: [0.4, 0.6] },
  { id: 'brick', hex: '#b5543f', angle: 60, slip: [-0.3, -0.6] },
];

export const PAPER = '#f4eee2';

/**
 * The key line.
 *
 * The thing that separates these prints from a flat vector picture is that
 * every object is *drawn* first and coloured second: there is a crisp dark
 * keyline round the whole of everything, and the halftone colour sits inside
 * it. Take the line away and the same shapes read as a chart.
 *
 * So the key is not one of the five screened inks — it prints solid, over the
 * top of all of them, the way a black line plate goes on last.
 */
export const KEY = '#2c3346';

const BY_ID = new Map(INKS.map((i) => [i.id, i]));

/**
 * The plates.
 *
 * One canvas per ink, holding coverage as greyscale. White is no ink, black is
 * a solid. Drawing into a plate is ordinary 2-D canvas work in shades of grey,
 * which means every fill, gradient and clip the platform already has comes for
 * free and lands as ink density.
 */
export class Press {
  readonly w: number;
  readonly h: number;
  private plates = new Map<Ink, CanvasRenderingContext2D>();
  /**
   * Where the sheet has anything on it at all.
   *
   * Without this a room prints as an opaque cream rectangle, and a page of
   * rooms laid on an interlocking lattice becomes a stack of tiles that
   * occlude each other along their bounding boxes — the exact thing the
   * isometric layout exists to avoid. The cream between the dots has to be the
   * *page* showing through, not paint.
   *
   * So every stroke goes onto its ink plate and onto this one, and the paper
   * is laid down only where this says something was drawn.
   */
  private mask: CanvasRenderingContext2D;
  /** The line plate, held in colour and printed solid over the screens. */
  private keyG: CanvasRenderingContext2D;
  /** Scratch, for turning a drawing into a stencil. */
  private stencil: CanvasRenderingContext2D;

  constructor(w: number, h: number) {
    this.w = Math.max(1, Math.round(w));
    this.h = Math.max(1, Math.round(h));
    for (const ink of INKS) {
      const c = document.createElement('canvas');
      c.width = this.w;
      c.height = this.h;
      const g = c.getContext('2d', { willReadFrequently: true });
      if (!g) throw new Error('no 2d context for a plate');
      g.fillStyle = '#fff';
      g.fillRect(0, 0, this.w, this.h);
      this.plates.set(ink.id, g);
    }
    const m = document.createElement('canvas');
    m.width = this.w;
    m.height = this.h;
    const mg = m.getContext('2d');
    if (!mg) throw new Error('no 2d context for the mask');
    this.mask = mg;

    const k = document.createElement('canvas');
    k.width = this.w;
    k.height = this.h;
    const kg = k.getContext('2d');
    if (!kg) throw new Error('no 2d context for the key');
    this.keyG = kg;

    const st = document.createElement('canvas');
    st.width = this.w;
    st.height = this.h;
    const sg = st.getContext('2d');
    if (!sg) throw new Error('no 2d context for the stencil');
    this.stencil = sg;
  }

  /**
   * Draw on the line plate.
   *
   * The context arrives already set to the key colour with round joins, so a
   * caller only sets `lineWidth` and describes a path. Marks land solid and on
   * top of every screen, which is exactly where a line plate belongs.
   */
  key(paint: (g: CanvasRenderingContext2D) => void) {
    const g = this.keyG;
    g.save();
    g.strokeStyle = KEY;
    g.fillStyle = KEY;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    paint(g);
    g.restore();

    const m = this.mask;
    m.save();
    m.fillStyle = '#000';
    m.strokeStyle = '#000';
    m.lineJoin = 'round';
    m.lineCap = 'round';
    paint(m);
    m.restore();
  }

  /**
   * Paint on one plate.
   *
   * The callback gets a context whose fills are read as density: `#000` is a
   * solid, `#888` is a half tone, and `globalAlpha` works the way a lighter
   * touch on the stencil would.
   */
  on(ink: Ink, paint: (g: CanvasRenderingContext2D) => void) {
    const g = this.plates.get(ink);
    if (!g) return;
    g.save();
    g.fillStyle = '#000';
    g.strokeStyle = '#000';
    paint(g);
    g.restore();

    // The same marks again, solid, so the mask knows the sheet is inked here
    // whatever density the plate was given.
    const m = this.mask;
    m.save();
    m.fillStyle = '#000';
    m.strokeStyle = '#000';
    paint(m);
    m.restore();
  }

  /**
   * Take ink *off* every plate, in a shape.
   *
   * The brightest thing obtainable on a press is the paper. Nothing a drum can
   * lay down is lighter than not printing, so a light in a riso is never a
   * pale ink — it is a shape none of the drums touch, with the ink around it
   * doing the work by contrast. The mask is still marked, so the hole is part
   * of the sheet rather than a window through it.
   *
   * The shape is taken as a *stencil*: the drawing is run once onto a scratch
   * plate, then flattened to solid white through its own alpha. Running the
   * caller's drawing straight onto each plate does not work, because a drawing
   * sets its own greys as it goes and a knockout done in mid-grey is not a
   * knockout — it is a smear, and it looks like the object went translucent.
   *
   * Only removes what is already there: anything drawn afterwards prints
   * straight back over it.
   */
  knockout(paint: (g: CanvasRenderingContext2D) => void) {
    const st = this.stencil;
    st.clearRect(0, 0, this.w, this.h);
    st.save();
    st.fillStyle = '#000';
    st.strokeStyle = '#000';
    st.lineJoin = 'round';
    st.lineCap = 'round';
    paint(st);
    st.restore();
    st.save();
    st.globalCompositeOperation = 'source-in';
    st.fillStyle = '#fff';
    st.fillRect(0, 0, this.w, this.h);
    st.restore();

    for (const ink of INKS) this.plates.get(ink.id)?.drawImage(st.canvas, 0, 0);
    this.mask.drawImage(st.canvas, 0, 0);

    /*
      And take the line plate back too.

      The key prints last and over everything, which is correct for a press and
      wrong for a picture unless something gives it depth: without this, the
      room's own floor-and-wall lines draw straight across the front of every
      object standing in the room. Clearing the key under each solid is what
      puts the line plate into painter's order along with the colour.
    */
    this.keyG.save();
    this.keyG.globalCompositeOperation = 'destination-out';
    this.keyG.drawImage(st.canvas, 0, 0);
    this.keyG.restore();
  }

  /**
   * An opaque object: clear the shape out of every plate, then print this ink
   * into it.
   *
   * This is the difference between a picture and a pile of transparencies. A
   * press multiplies, so a box drawn straight onto a wall comes out as box
   * *times* wall — two screens at two angles, both visible, and the object
   * reads as though you can see through it. Real separation art does not work
   * that way: things in front knock out the things behind them and only the
   * deliberate overprints — light, shadow, a thin rug — are left to multiply.
   */
  solid(ink: Ink, paint: (g: CanvasRenderingContext2D) => void) {
    this.knockout(paint);
    this.on(ink, paint);
  }

  /**
   * Ink on a plate, without claiming any sheet.
   *
   * For light. A glow is a gradient that reaches nought long before its
   * bounding circle does, and marking the mask across the whole of it lays down
   * paper where there is no ink — which on a page of interlocking rooms shows
   * up as a cream halo hanging off the edge of the room the lamp is in. Light
   * should only be visible where something was already printed.
   */
  over(ink: Ink, paint: (g: CanvasRenderingContext2D) => void) {
    const g = this.plates.get(ink);
    if (!g) return;
    g.save();
    g.fillStyle = '#000';
    g.strokeStyle = '#000';
    paint(g);
    g.restore();
  }

  /** Coverage 0..1 for one plate, as a flat array. */
  private coverage(ink: Ink): Uint8ClampedArray {
    const g = this.plates.get(ink)!;
    return g.getImageData(0, 0, this.w, this.h).data;
  }

  /**
   * Run the sheet.
   *
   * Each plate is screened on its own rotated lattice: at every lattice point
   * the coverage underneath decides the radius of one dot. That is what a
   * halftone *is*, and doing it this way rather than by thresholding a texture
   * is why a gradient comes out as dots that grow rather than as a pale wash
   * with speckles in it.
   */
  print(out: CanvasRenderingContext2D, pitch = 3.1) {
    out.clearRect(0, 0, this.w, this.h);

    // Paper, but only inside the shape. Drawn by stamping the mask and then
    // filling through it, so the edge of the sheet is the edge of the room.
    out.save();
    out.drawImage(this.mask.canvas, 0, 0);
    out.globalCompositeOperation = 'source-in';
    out.fillStyle = PAPER;
    out.fillRect(0, 0, this.w, this.h);
    out.restore();

    const diag = Math.hypot(this.w, this.h);
    out.save();
    out.globalCompositeOperation = 'multiply';

    for (const spec of INKS) {
      const data = this.coverage(spec.id);
      const a = (spec.angle * Math.PI) / 180;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const [dx, dy] = spec.slip;

      out.fillStyle = spec.hex;
      out.beginPath();

      // Walk the lattice in the *rotated* frame and map each point back, so the
      // dots sit on a true rotated grid rather than on an axis-aligned grid
      // with jitter pretending to be one.
      const half = diag * 0.6;
      const cx = this.w / 2;
      const cy = this.h / 2;
      for (let v = -half; v <= half; v += pitch) {
        for (let u = -half; u <= half; u += pitch) {
          const x = cx + u * ca - v * sa + dx;
          const y = cy + u * sa + v * ca + dy;
          const px = x | 0;
          const py = y | 0;
          if (px < 0 || py < 0 || px >= this.w || py >= this.h) continue;
          const cov = 1 - data[(py * this.w + px) * 4]! / 255;
          if (cov < 0.02) continue;
          // Area, not radius, is proportional to coverage — a dot of twice the
          // radius is four times the ink, and getting this wrong makes every
          // mid-tone print far too dark.
          const r = Math.sqrt(cov) * pitch * 0.62;
          out.moveTo(x + r, y);
          out.arc(x, y, r, 0, Math.PI * 2);
        }
      }
      out.fill();
    }
    out.restore();

    // The line plate last, solid and on top, which is the order a press runs
    // it in and the only order in which the drawing stays a drawing.
    out.drawImage(this.keyG.canvas, 0, 0);
  }
}

export const inkHex = (id: Ink): string => BY_ID.get(id)?.hex ?? '#000';

/** Density as a grey, for painting onto a plate. */
export const tone = (v: number): string => {
  const g = Math.round(255 * (1 - Math.max(0, Math.min(1, v))));
  return `rgb(${g},${g},${g})`;
};
