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

/** A screen-space rectangle: where a mark can possibly land. */
export type Bounds = [x: number, y: number, w: number, h: number];

/** A press-load: every plate of a finished drawing, kept for reuse. */
export interface Sheet {
  plates: Map<Ink, HTMLCanvasElement>;
  mask: HTMLCanvasElement;
  key: HTMLCanvasElement;
  used: Set<Ink>;
  w: number;
  h: number;
}

/** The union of two rectangles. */
export function span(a: Bounds, b: Bounds): Bounds {
  const x = Math.min(a[0], b[0]);
  const y = Math.min(a[1], b[1]);
  return [x, y, Math.max(a[0] + a[2], b[0] + b[2]) - x, Math.max(a[1] + a[3], b[1] + b[3]) - y];
}

/**
 * Where the last frame drew and where this one did, as one rectangle.
 *
 * Both have to be repainted: the old place to erase the movement and the new
 * place to show it. Kept as a single rectangle rather than two, because two
 * near-identical rectangles are two reads of six plates over almost the same
 * pixels — which measured three times the cost of reading their union once.
 */
export function bothFrames(a: Bounds[] | null, b: Bounds[] | null): Bounds[] | null {
  const all = [...(a ?? []), ...(b ?? [])];
  if (!all.length) return null;
  return [all.reduce((u, r) => span(u, r))];
}

const BY_ID = new Map(INKS.map((i) => [i.id, i]));

/**
 * The screen, precomputed.
 *
 * A halftone dot is drawn wherever the coverage under it beats the threshold
 * for that position inside its cell — which depends only on the geometry of the
 * screen, never on the picture. So the threshold is computed once per ink per
 * sheet size and reused for every frame of every room at that size, and
 * printing becomes one integer comparison per pixel per ink.
 *
 * The version this replaced walked the rotated lattice and called `arc()` at
 * every point: about two hundred thousand canvas arcs for one small room, which
 * is fine once and hopeless sixty times a second. Same dots, same growth curve,
 * two orders of magnitude apart.
 */
const SCREENS = new Map<string, Uint8Array>();

function screen(w: number, h: number, spec: InkSpec, pitch: number): Uint8Array {
  const key = `${w}x${h}@${spec.angle}/${pitch}`;
  const had = SCREENS.get(key);
  if (had) return had;

  const t = new Uint8Array(w * h);
  const a = (spec.angle * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const [dx, dy] = spec.slip;
  const cx = w / 2;
  const cy = h / 2;
  // Dot radius at full coverage. Area — not radius — tracks coverage, so the
  // threshold is the *square* of the fractional radius.
  const full = pitch * 0.62;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Into the screen's own frame, including the drum's slip.
      const px = x - cx - dx;
      const py = y - cy - dy;
      const u = px * ca + py * sa;
      const vv = -px * sa + py * ca;
      const fu = u - Math.round(u / pitch) * pitch;
      const fv = vv - Math.round(vv / pitch) * pitch;
      const r = Math.hypot(fu, fv) / full;
      const need = r * r;
      t[y * w + x] = need >= 1 ? 255 : Math.round(need * 255);
    }
  }
  SCREENS.set(key, t);
  return t;
}

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
  /** Which plates have been touched. A blank plate is skipped when printing. */
  private used: Set<Ink> = new Set();
  /** Where anything has been drawn since the last sheet was loaded. */
  private dirtyBox: Bounds[] = [];
  /**
   * How many separate repaint rectangles a frame is allowed.
   *
   * One is the right answer, and it took measuring to believe it. Seven
   * rectangles do cover half the area of their union — but each one is a
   * separate read of six plates, and the per-read overhead swallows the saving
   * three times over: the same frame went from ten milliseconds to thirty-three.
   * The pixels are cheap. The calls are not.
   */
  private static readonly PATCHES = 1;
  /** Reused between frames: allocating these per frame is most of the cost. */
  private sheet: ImageData | null = null;

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
    const mg = m.getContext('2d', { willReadFrequently: true });
    if (!mg) throw new Error('no 2d context for the mask');
    this.mask = mg;

    const k = document.createElement('canvas');
    k.width = this.w;
    k.height = this.h;
    const kg = k.getContext('2d', { willReadFrequently: true });
    if (!kg) throw new Error('no 2d context for the key');
    this.keyG = kg;

    const st = document.createElement('canvas');
    st.width = this.w;
    st.height = this.h;
    const sg = st.getContext('2d', { willReadFrequently: true });
    if (!sg) throw new Error('no 2d context for the stencil');
    sg.lineJoin = 'round';
    sg.lineCap = 'round';
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
    this.used.add(ink);
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
  knockout(paint: (g: CanvasRenderingContext2D) => void, bb?: Bounds) {
    /*
      Bounded, or this is the whole cost of the picture.

      A knockout touches seven plates. Done across the full sheet that is eight
      canvas-sized operations for every solid object in the room, and a room has
      sixty of them — which is why a single frame of one small room took a sixth
      of a second and a big one took most of a second. Every primitive knows the
      rectangle its own mark can land in, so every plate operation is clipped to
      it and the work drops by the ratio of the object to the room.
    */
    const x = bb ? Math.max(0, Math.floor(bb[0])) : 0;
    const y = bb ? Math.max(0, Math.floor(bb[1])) : 0;
    const w = bb ? Math.min(this.w - x, Math.ceil(bb[2] + (bb[0] - x))) : this.w;
    const h = bb ? Math.min(this.h - y, Math.ceil(bb[3] + (bb[1] - y))) : this.h;
    if (w <= 0 || h <= 0) return;
    // And this is where the frame's repaint rectangle comes from: every solid
    // in the moving layer reports where it landed, so a frame re-prints the
    // ground the movement covered and nothing else.
    this.touch([x, y, w, h]);

    /*
      The clip is not decoration. `source-in` is a whole-canvas operation —
      everything the source does not cover is cleared — so without a clip the
      flatten below touches every pixel of the sheet for every object in the
      room, and removing the clip to "save a save and a restore" made a frame
      half again as slow. Clipped, it costs the rectangle and nothing else.
    */
    const st = this.stencil;
    st.clearRect(x, y, w, h);
    st.save();
    st.beginPath();
    st.rect(x, y, w, h);
    st.clip();
    st.fillStyle = '#000';
    st.strokeStyle = '#000';
    paint(st);
    st.globalCompositeOperation = 'source-in';
    st.fillStyle = '#fff';
    st.fillRect(x, y, w, h);
    st.restore();

    for (const ink of INKS) {
      this.plates.get(ink.id)?.drawImage(st.canvas, x, y, w, h, x, y, w, h);
    }
    this.mask.drawImage(st.canvas, x, y, w, h, x, y, w, h);

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
    this.keyG.drawImage(st.canvas, x, y, w, h, x, y, w, h);
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
  solid(ink: Ink, paint: (g: CanvasRenderingContext2D) => void, bb?: Bounds) {
    // The knockout has already marked the sheet over this shape, so the ink
    // goes on with `over` rather than `on`: painting the mask a second time is
    // a third of the drawing work in the room for no change to the result.
    this.knockout(paint, bb);
    this.over(ink, paint);
  }

  /**
   * Take a copy of the sheet as it stands.
   *
   * Everything in a room that does not move — the shell, the furniture, the
   * shelves, the trees — is drawn once and kept. A frame of animation then puts
   * that back and draws only the people and the light over it, which is the
   * difference between a tenth of a second a frame and a sixtieth: the moving
   * parts cover a small part of the room, and redrawing the other ninety per
   * cent sixty times a second is the entire cost.
   *
   * The copy is handed back rather than held, so one press can serve
   * twenty-five rooms in turn: each room keeps its own still sheet and the
   * press keeps nothing.
   */
  take(): Sheet {
    const copy = (src: HTMLCanvasElement) => {
      const c = document.createElement('canvas');
      c.width = this.w;
      c.height = this.h;
      c.getContext('2d', { willReadFrequently: true })?.drawImage(src, 0, 0);
      return c;
    };
    const plates = new Map<Ink, HTMLCanvasElement>();
    for (const ink of INKS) {
      const g = this.plates.get(ink.id);
      if (g) plates.set(ink.id, copy(g.canvas));
    }
    return {
      plates,
      mask: copy(this.mask.canvas),
      key: copy(this.keyG.canvas),
      used: new Set(this.used),
      w: this.w,
      h: this.h,
    };
  }

  /** Load a kept sheet back onto the press, ready for a frame drawn over it. */
  put(sheet: Sheet) {
    for (const ink of INKS) {
      const g = this.plates.get(ink.id);
      const src = sheet.plates.get(ink.id);
      if (!g) continue;
      if (src) g.drawImage(src, 0, 0);
      else {
        g.fillStyle = '#fff';
        g.fillRect(0, 0, this.w, this.h);
      }
    }
    this.mask.clearRect(0, 0, this.w, this.h);
    this.mask.drawImage(sheet.mask, 0, 0);
    this.keyG.clearRect(0, 0, this.w, this.h);
    this.keyG.drawImage(sheet.key, 0, 0);
    this.used = new Set(sheet.used);
    this.dirtyBox = [];
  }

  /** Note that something was drawn here, for the frame's dirty rectangle. */
  touch(bb: Bounds) {
    const list = this.dirtyBox;
    if (list.length < Press.PATCHES) {
      list.push([bb[0], bb[1], bb[2], bb[3]]);
      return;
    }
    // Merge into whichever rectangle it costs the least to grow.
    let best = 0;
    let cheapest = Infinity;
    for (let i = 0; i < list.length; i++) {
      const u = span(list[i]!, bb);
      const cost = u[2] * u[3] - list[i]![2] * list[i]![3];
      if (cost < cheapest) {
        cheapest = cost;
        best = i;
      }
    }
    list[best] = span(list[best]!, bb);
  }

  /** The rectangles this frame has drawn in. */
  get dirty(): Bounds[] | null {
    return this.dirtyBox.length ? this.dirtyBox.map((b) => [b[0], b[1], b[2], b[3]] as Bounds) : null;
  }

  /**
   * Wipe every plate for the next frame.
   *
   * A room that moves is redrawn from nothing many times a second, and
   * allocating seven canvases each time is more expensive than everything else
   * here put together. One press, cleared and reused.
   */
  reset() {
    for (const ink of INKS) {
      const g = this.plates.get(ink.id);
      if (!g) continue;
      g.fillStyle = '#fff';
      g.fillRect(0, 0, this.w, this.h);
    }
    this.mask.clearRect(0, 0, this.w, this.h);
    this.keyG.clearRect(0, 0, this.w, this.h);
    this.used.clear();
    this.dirtyBox = [];
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
    this.used.add(ink);
    g.save();
    g.fillStyle = '#000';
    g.strokeStyle = '#000';
    paint(g);
    g.restore();
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
  /**
   * Run the sheet.
   *
   * One pass over the pixels. For each one: if the mask says nothing was drawn
   * there the sheet stays transparent and the page shows through; otherwise it
   * starts as paper and every ink whose coverage beats its screen threshold at
   * that position multiplies into it. That is exactly what a press does and
   * exactly what the lattice-and-arcs version did, at a speed that can be put
   * on a clock.
   *
   * Plates nothing was drawn on are skipped outright, which in practice is one
   * or two of the five in most rooms.
   */
  print(out: CanvasRenderingContext2D, pitch = 3.1, patches?: Bounds[] | null) {
    if (!patches) {
      this.printOne(out, pitch);
      return;
    }
    for (const bb of patches) this.printOne(out, pitch, bb);
  }

  private printOne(out: CanvasRenderingContext2D, pitch: number, bb?: Bounds) {
    const bx = bb ? Math.max(0, Math.floor(bb[0])) : 0;
    const by = bb ? Math.max(0, Math.floor(bb[1])) : 0;
    const bw = bb ? Math.min(this.w - bx, Math.ceil(bb[2] + (bb[0] - bx))) : this.w;
    const bh = bb ? Math.min(this.h - by, Math.ceil(bb[3] + (bb[1] - by))) : this.h;
    if (bw <= 0 || bh <= 0) return;
    const maskData = this.mask.getImageData(bx, by, bw, bh).data;

    const live = INKS.filter((s) => this.used.has(s.id));
    const covs = live.map((s) => this.plates.get(s.id)!.getImageData(bx, by, bw, bh).data);
    const scr = live.map((s) => screen(this.w, this.h, s, pitch));
    const rgb = live.map((s) => [
      parseInt(s.hex.slice(1, 3), 16),
      parseInt(s.hex.slice(3, 5), 16),
      parseInt(s.hex.slice(5, 7), 16),
    ] as const);

    if (!this.sheet || this.sheet.width !== bw || this.sheet.height !== bh) {
      this.sheet = out.createImageData(bw, bh);
    }
    const px = this.sheet.data;

    const pr = parseInt(PAPER.slice(1, 3), 16);
    const pg = parseInt(PAPER.slice(3, 5), 16);
    const pb = parseInt(PAPER.slice(5, 7), 16);

    for (let i = 0; i < bw * bh; i++) {
      const o = i * 4;
      if (maskData[o + 3] === 0) {
        px[o + 3] = 0;
        continue;
      }
      // The screen is a property of the sheet, not of the crop, so the
      // threshold has to be looked up at the pixel's place on the whole sheet.
      const sx = bx + (i % bw);
      const sy = by + ((i / bw) | 0);
      const si = sy * this.w + sx;
      let r = pr;
      let g = pg;
      let b = pb;
      for (let k = 0; k < live.length; k++) {
        // The plate holds coverage as a grey: white is none, black is a solid.
        const cov = 255 - covs[k]![o]!;
        if (cov > scr[k]![si]!) {
          const c = rgb[k]!;
          r = (r * c[0]) / 255;
          g = (g * c[1]) / 255;
          b = (b * c[2]) / 255;
        }
      }
      px[o] = r;
      px[o + 1] = g;
      px[o + 2] = b;
      px[o + 3] = 255;
    }

    // A crop has to be cleared first: `putImageData` overwrites, but the key
    // plate underneath it was drawn with alpha and would otherwise accumulate.
    out.clearRect(bx, by, bw, bh);
    out.putImageData(this.sheet, bx, by);

    // The line plate last, solid and on top, which is the order a press runs
    // it in and the only order in which the drawing stays a drawing.
    out.drawImage(this.keyG.canvas, bx, by, bw, bh, bx, by, bw, bh);
  }
}

export const inkHex = (id: Ink): string => BY_ID.get(id)?.hex ?? '#000';

/** Density as a grey, for painting onto a plate. */
export const tone = (v: number): string => {
  const g = Math.round(255 * (1 - Math.max(0, Math.min(1, v))));
  return `rgb(${g},${g},${g})`;
};
