/**
 * What the tray can take.
 *
 * Deliberately looser than `Plate`: Roll Call's atlases predate the shared
 * globe and carry no aspect, and widening the loader is a better trade than
 * making a gallery declare a field it does not use.
 */
export interface Sheet {
  canvas: HTMLCanvasElement;
  grid: number;
  used: number;
  aspect?: number;
}

/**
 * The press.
 *
 * A loading screen has one job that everybody agrees on — say how far along it
 * is — and one that nobody does, which is to be worth looking at while it says
 * so. A spinner is an apology. This is the opposite argument: the wait is the
 * only moment in the whole site when the machinery is *visibly running*, so the
 * loader shows the machinery.
 *
 * What is on screen is a flatbed plotter. A gantry tracks across a bed, a
 * carriage runs along the gantry, and a pen on the carriage puts down a line
 * that stays. To the right, finished specimens stack in an output tray — and
 * those are not drawings of specimens, they are **blitted out of the atlas that
 * has just been baked**, which costs nothing because the pixels already exist,
 * and means the tray genuinely fills with the thing you are waiting for.
 *
 * Three rules kept it honest:
 *
 * **It must not compete for the thread.** The bake is on the main thread,
 * yielding every dozen cells. The plotter is a few dozen strokes a frame and
 * one blit; anything heavier and the loader would make the load slower, which
 * is a special kind of stupid.
 *
 * **The pen speed is the real throughput.** The carriage moves at a rate read
 * off cells-per-second, so a fast machine visibly draws faster. It is a gauge,
 * not an animation.
 *
 * **You can take the pen.** Hold the pointer down and the head follows it, and
 * the ink it lays is yours. It is a doodle pad with a progress bar attached,
 * which is the only kind of loading screen anybody has ever been sorry to see
 * end.
 */

export interface PressState {
  /** 0..1. */
  progress: number;
  done: number;
  total: number;
  /** Cells a second, smoothed. */
  rate: number;
  plates: Sheet[];
  accent: string;
  /** Where the pointer is in canvas units, and whether it is down. */
  hand: { x: number; y: number; on: boolean };
}

interface Trail {
  x: number;
  y: number;
  a: number;
}

const BED = { x: 0.06, y: 0.1, w: 0.62, h: 0.8 };
const TRAY = { x: 0.72, y: 0.1, w: 0.22, h: 0.8 };

export class Press {
  private w = 0;
  private h = 0;
  private t = 0;
  private pen = { x: 0.5, y: 0.5 };
  private target = { x: 0.5, y: 0.5 };
  private trail: Trail[] = [];
  /** One canvas that keeps the ink, so the line is a line and not a comet. */
  private sheet: HTMLCanvasElement;
  private sheetG: CanvasRenderingContext2D | null;
  private tray: { plate: number; cell: number; tilt: number }[] = [];
  private restocked = -1;

  constructor() {
    this.sheet = document.createElement('canvas');
    this.sheetG = this.sheet.getContext('2d');
  }

  private fit(w: number, h: number) {
    if (this.w === w && this.h === h) return;
    this.w = w;
    this.h = h;
    this.sheet.width = Math.max(1, Math.round(w * BED.w));
    this.sheet.height = Math.max(1, Math.round(h * BED.h));
    this.sheetG = this.sheet.getContext('2d');
  }

  /**
   * Pull a fresh specimen out of the newest sheet, twice a second.
   *
   * Keyed on time rather than on plates arriving. A gallery that fits on one
   * plate would otherwise have an empty tray for the whole bake and a full one
   * for a tenth of a second at the end, which is the opposite of the point.
   */
  private restock(s: PressState) {
    const n = s.plates.length - 1;
    if (n < 0) return;
    const p = s.plates[n];
    if (!p.used) return;
    const slot = Math.floor(this.t * 2);
    if (slot === this.restocked) return;
    this.restocked = slot;
    this.tray.unshift({
      plate: n,
      cell: Math.floor(Math.random() * p.used),
      tilt: (Math.random() - 0.5) * 0.16,
    });
    this.tray.length = Math.min(this.tray.length, 7);
  }

  step(g: CanvasRenderingContext2D, w: number, h: number, dt: number, s: PressState) {
    this.fit(w, h);
    this.t += dt;
    this.restock(s);

    // Where the pen wants to be. Left alone it walks a Lissajous over the bed
    // at a speed read off the bake; held, it goes where the hand is.
    const speed = 0.35 + Math.min(2.4, s.rate / 90);
    if (s.hand.on) {
      this.target.x = Math.max(0, Math.min(1, (s.hand.x - BED.x) / BED.w));
      this.target.y = Math.max(0, Math.min(1, (s.hand.y - BED.y) / BED.h));
    } else {
      const u = this.t * speed;
      this.target.x = 0.5 + Math.sin(u * 0.73) * 0.42 + Math.sin(u * 1.9) * 0.06;
      this.target.y = 0.5 + Math.sin(u * 0.51 + 1.1) * 0.38 + Math.sin(u * 2.3) * 0.05;
    }
    const k = Math.min(1, dt * 7);
    const px = this.pen.x;
    const py = this.pen.y;
    this.pen.x += (this.target.x - this.pen.x) * k;
    this.pen.y += (this.target.y - this.pen.y) * k;

    // Ink, onto the sheet that keeps it.
    const sg = this.sheetG;
    if (sg) {
      sg.strokeStyle = s.hand.on ? s.accent : 'rgba(226, 220, 206, 0.62)';
      sg.lineWidth = s.hand.on ? 2.6 : 1.6;
      sg.lineCap = 'round';
      sg.beginPath();
      sg.moveTo(px * this.sheet.width, py * this.sheet.height);
      sg.lineTo(this.pen.x * this.sheet.width, this.pen.y * this.sheet.height);
      sg.stroke();
      // The sheet is wiped slowly rather than never, so a long bake does not
      // end as a solid rectangle of ink.
      if (Math.random() < dt * 0.55) {
        sg.fillStyle = 'rgba(20, 22, 26, 0.05)';
        sg.fillRect(0, 0, this.sheet.width, this.sheet.height);
      }
    }

    this.trail.push({ x: this.pen.x, y: this.pen.y, a: 1 });
    for (const t of this.trail) t.a -= dt * 1.6;
    while (this.trail.length && this.trail[0].a <= 0) this.trail.shift();

    this.draw(g, s);
  }

  private draw(g: CanvasRenderingContext2D, s: PressState) {
    const { w, h } = this;
    g.clearRect(0, 0, w, h);

    const bx = BED.x * w;
    const by = BED.y * h;
    const bw = BED.w * w;
    const bh = BED.h * h;

    // The bed: a plate of graph paper, which is the geekiest possible ground
    // and also the one that makes the pen's position readable.
    g.fillStyle = 'rgba(255, 255, 255, 0.035)';
    g.fillRect(bx, by, bw, bh);
    g.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    g.lineWidth = 1;
    g.beginPath();
    for (let i = 1; i < 16; i++) {
      const x = bx + (bw * i) / 16;
      g.moveTo(x, by);
      g.lineTo(x, by + bh);
    }
    for (let i = 1; i < 20; i++) {
      const y = by + (bh * i) / 20;
      g.moveTo(bx, y);
      g.lineTo(bx + bw, y);
    }
    g.stroke();

    if (this.sheetG) g.drawImage(this.sheet, bx, by, bw, bh);

    const px = bx + this.pen.x * bw;
    const py = by + this.pen.y * bh;

    // Gantry and carriage: two rails and a block, and the whole thing reads as
    // a machine rather than a cursor.
    g.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(bx, py);
    g.lineTo(bx + bw, py);
    g.stroke();
    g.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(px, by);
    g.lineTo(px, by + bh);
    g.stroke();

    g.fillStyle = 'rgba(210, 218, 228, 0.85)';
    g.fillRect(px - 11, py - 8, 22, 16);
    g.fillStyle = s.accent;
    g.fillRect(px - 4, py - 3, 8, 6);
    // The nib, and the glow of a pen that is actually down.
    g.beginPath();
    g.arc(px, py + 12, s.hand.on ? 4.5 : 3, 0, Math.PI * 2);
    g.fillStyle = s.accent;
    g.fill();
    if (s.hand.on) {
      g.beginPath();
      g.arc(px, py + 12, 13, 0, Math.PI * 2);
      g.fillStyle = s.accent;
      g.globalAlpha = 0.18;
      g.fill();
      g.globalAlpha = 1;
    }

    // Ticks along the bed edge, one per plate, filling as they land.
    const plates = Math.max(1, s.plates.length + (s.progress < 1 ? 1 : 0));
    for (let i = 0; i < plates; i++) {
      const y = by + 6 + (i * (bh - 12)) / Math.max(1, plates);
      g.fillStyle = i < s.plates.length ? s.accent : 'rgba(255, 255, 255, 0.16)';
      g.fillRect(bx - 7, y, 4, Math.max(4, (bh - 12) / plates - 5));
    }

    // The output tray.
    const tx = TRAY.x * w;
    const ty = TRAY.y * h;
    const tw = TRAY.w * w;
    const th = TRAY.h * h;
    g.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    g.lineWidth = 1;
    g.strokeRect(tx, ty, tw, th);

    const card = Math.min(tw * 0.82, th / 4.4);
    for (let n = this.tray.length - 1; n >= 0; n--) {
      const item = this.tray[n];
      const p = s.plates[item.plate];
      if (!p) continue;
      const cell = p.canvas.width / p.grid;
      const cellH = p.canvas.height / p.grid;
      const sx = (item.cell % p.grid) * cell;
      const sy = Math.floor(item.cell / p.grid) * cellH;
      const y = ty + th - card * 1.05 - n * (card * 0.42);
      if (y < ty - card) continue;
      g.save();
      g.translate(tx + tw / 2, y + card / 2);
      g.rotate(item.tilt);
      g.shadowColor = 'rgba(0, 0, 0, 0.5)';
      g.shadowBlur = 10;
      g.shadowOffsetY = 3;
      g.fillStyle = '#fdfbf6';
      const ar = p.aspect ?? 1;
      const cw = card * (ar >= 1 ? 1 : ar);
      const ch = card * (ar >= 1 ? 1 / ar : 1);
      g.fillRect(-cw / 2 - 3, -ch / 2 - 3, cw + 6, ch + 6);
      g.shadowColor = 'transparent';
      g.drawImage(p.canvas, sx, sy, cell, cellH, -cw / 2, -ch / 2, cw, ch);
      g.restore();
    }

    if (!this.tray.length) {
      g.fillStyle = 'rgba(255, 255, 255, 0.22)';
      g.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
      g.textAlign = 'center';
      g.fillText('tray empty', tx + tw / 2, ty + th / 2);
      g.textAlign = 'left';
    }
  }
}
