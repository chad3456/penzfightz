import { HB, mark, pencil, smooth, type Pt } from '../effects/pencil/graphite';

/**
 * Four small pieces, and a stave to draw them on.
 *
 * ── An honest note about "favourite music" ─────────────────────────────
 *
 * I have never heard anything. I have read an enormous amount *about* music and
 * a fair amount of music itself, as notation, and what I have is a genuine
 * liking for particular *shapes* — the way a fugue subject comes back upside
 * down and still fits; the way a raga's ascent leaves out a note its descent
 * puts back, so the same scale has two moods; the way a twelve-bar turnaround
 * spends ten bars promising and two bars paying. That is a real preference
 * about real structures, and it is not the same thing as a favourite song, so
 * it would be a lie to print one.
 *
 * So these four are mine. Not transcriptions — nobody else's tune is anywhere
 * in this repository, and a scale is not a composition, it is an alphabet.
 * Each one is a shape I like, written out small enough to be honest about
 * being a sketch.
 */

export interface Note {
  /** Semitones from the tonic. */
  p: number;
  /** Length in beats. */
  d: number;
  /** A rest keeps its length and makes no sound. */
  rest?: boolean;
  /** Tie into the next note. */
  tie?: boolean;
}

export interface Piece {
  id: string;
  title: string;
  /** What the shape is, and why I like it. */
  note: string;
  /** Beats per minute. */
  bpm: number;
  /** Concert pitch of the tonic, in hertz. */
  root: number;
  /** The tune. */
  notes: Note[];
  /** A second voice, entering late, for the ones that have one. */
  answer?: { after: number; transpose: number; notes: Note[] };
}

export const PIECES: Piece[] = [
  {
    id: 'inversion',
    title: 'A subject, and the same subject upside down',
    note:
      'The thing I find genuinely startling about a fugue is that a line can be turned on its ' +
      'head — every rise becomes the same-sized fall — and still be *the same line*, and still ' +
      'fit against itself. Here is a short subject, and then the inversion of it underneath. ' +
      'Nothing is adjusted to make them agree. They just do.',
    bpm: 96,
    root: 261.63,
    notes: [
      { p: 0, d: 1 }, { p: 7, d: 1 }, { p: 5, d: 0.5 }, { p: 4, d: 0.5 },
      { p: 2, d: 1 }, { p: 0, d: 1 }, { p: 4, d: 0.5 }, { p: 2, d: 0.5 },
      { p: 0, d: 2 },
    ],
    answer: {
      after: 4,
      transpose: -12,
      notes: [
        { p: 0, d: 1 }, { p: -7, d: 1 }, { p: -5, d: 0.5 }, { p: -4, d: 0.5 },
        { p: -2, d: 1 }, { p: 0, d: 1 }, { p: -4, d: 0.5 }, { p: -2, d: 0.5 },
        { p: 0, d: 2 },
      ],
    },
  },
  {
    id: 'ascent',
    title: 'A scale that goes up one way and down another',
    note:
      'In Indian classical music a raga names the way up and the way down separately, and they ' +
      'are allowed to disagree — a note left out climbing gets put back falling. I like that ' +
      'enormously: the same seven pitches, two different rooms. Up here leaves out the sixth. ' +
      'Down puts it back and flattens the seventh, and the whole thing changes colour without ' +
      'changing key.',
    bpm: 72,
    root: 220,
    notes: [
      { p: 0, d: 1 }, { p: 2, d: 0.5 }, { p: 4, d: 0.5 }, { p: 5, d: 1 },
      { p: 7, d: 1 }, { p: 11, d: 0.5 }, { p: 12, d: 1.5 },
      { p: 10, d: 0.5 }, { p: 9, d: 0.5 }, { p: 7, d: 1 }, { p: 5, d: 0.5 },
      { p: 4, d: 0.5 }, { p: 2, d: 1 }, { p: 0, d: 2 },
    ],
  },
  {
    id: 'turnaround',
    title: 'Ten bars of promising and two of paying',
    note:
      'A twelve-bar is almost entirely delay. It sets up a thing you can already hear coming, ' +
      'takes its time not giving it to you, and then hands it over in the last two bars and ' +
      'immediately starts again. I think that is a very good shape for almost anything: most ' +
      'of it should be the approach.',
    bpm: 108,
    root: 196,
    notes: [
      { p: 0, d: 0.5 }, { p: 3, d: 0.5 }, { p: 5, d: 0.5 }, { p: 6, d: 0.5 },
      { p: 7, d: 1 }, { p: 5, d: 1 },
      { p: 3, d: 0.5 }, { p: 0, d: 0.5 }, { p: -2, d: 1 },
      { p: 0, d: 0.5 }, { p: 3, d: 0.5 }, { p: 5, d: 0.5 }, { p: 3, d: 0.5 },
      { p: 0, d: 2 },
    ],
  },
  {
    id: 'ground',
    title: 'Eight notes that will not stop',
    note:
      'A ground bass is eight notes that repeat until the piece ends, and everything above them ' +
      'has to cope. What I like is that the constraint is the point — the tune is interesting ' +
      '*because* it cannot go wherever it likes. I spend most of my day being the thing above ' +
      'somebody else’s ground bass, so I am fond of it.',
    bpm: 84,
    root: 174.61,
    notes: [
      { p: 0, d: 1 }, { p: -2, d: 1 }, { p: -4, d: 1 }, { p: -5, d: 1 },
      { p: -7, d: 1 }, { p: -5, d: 1 }, { p: -3, d: 1 }, { p: -7, d: 1 },
    ],
    answer: {
      after: 8,
      transpose: 12,
      notes: [
        { p: 7, d: 1.5 }, { p: 5, d: 0.5 }, { p: 4, d: 1 }, { p: 0, d: 1 },
        { p: 2, d: 1.5 }, { p: 0, d: 0.5 }, { p: -1, d: 1 }, { p: 0, d: 1 },
      ],
    },
  },
];

// ─────────────────────────────────────────────────────────── the drawing

/** Where a pitch sits on the stave, in steps from the bottom line. */
const STEP: Record<number, number> = {
  0: 0, 1: 0, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 5, 9: 5, 10: 6, 11: 6, 12: 7,
};
const stepOf = (p: number) => {
  const oct = Math.floor(p / 12);
  const within = ((p % 12) + 12) % 12;
  return oct * 7 + (STEP[within] ?? 0);
};
const sharpAt = (p: number) => [1, 3, 6, 8, 10].includes(((p % 12) + 12) % 12);

export interface StaveStyle {
  /** Pixels between two stave lines. */
  gap: number;
  seed?: number;
}

/**
 * Draw a stave and a line of music on it, by hand.
 *
 * Ruled staves are the one thing on a manuscript page that a person does not
 * draw freehand, and drawing them freehand anyway is what makes this read as
 * somebody's notebook rather than as a score.
 */
export function drawStave(
  g: CanvasRenderingContext2D,
  x: number, y: number, width: number,
  piece: Piece,
  st: StaveStyle,
) {
  const gap = st.gap;
  const seed = st.seed ?? 7;
  const rule = pencil(HB, { size: Math.max(0.6, gap * 0.11), press: 0.66, grade: 0.6, passes: 1, wobble: 1.3 });
  const ink = pencil(HB, { size: Math.max(0.9, gap * 0.17), press: 0.97, grade: 0.8, passes: 3, wobble: 0.8 });
  const fine = pencil(HB, { size: Math.max(0.7, gap * 0.12), press: 0.82, grade: 0.7, passes: 2, wobble: 0.9 });

  for (let i = 0; i < 5; i++) {
    const ly = y + i * gap;
    mark(g, smooth([
      [x, ly], [x + width * 0.34, ly + Math.sin(seed + i) * gap * 0.06],
      [x + width * 0.7, ly - Math.cos(seed * 1.3 + i) * gap * 0.05], [x + width, ly],
    ], 7), rule, seed * 31 + i);
  }

  /*
    A treble clef, drawn the way it is written: one unbroken line. Up the right
    of the staff, over the top, down the middle, round the G line in a spiral,
    and out into the tail below. The first attempt wound three and a half turns
    of a widening spiral and came out as a scribble — the shape is not a spiral
    with a stem, it is a stroke that happens to cross itself twice.
  */
  const gLine = y + gap * 3;
  const cx = x + gap * 1.25;
  const clef: Pt[] = [
    [cx - gap * 0.35, gLine + gap * 1.9],
    [cx + gap * 0.42, gLine + gap * 1.45],
    [cx + gap * 0.30, gLine + gap * 0.25],
    [cx - gap * 0.55, gLine - gap * 0.15],
    [cx - gap * 0.72, gLine + gap * 0.55],
    [cx - gap * 0.05, gLine + gap * 0.72],
    [cx + gap * 0.58, gLine - gap * 0.35],
    [cx + gap * 0.52, gLine - gap * 1.65],
    [cx - gap * 0.18, gLine - gap * 2.45],
    [cx - gap * 0.62, gLine - gap * 1.6],
    [cx - gap * 0.35, gLine - gap * 0.2],
    [cx + gap * 0.05, gLine + gap * 1.5],
    [cx + gap * 0.10, gLine + gap * 2.9],
    [cx - gap * 0.30, gLine + gap * 3.35],
    [cx - gap * 0.66, gLine + gap * 2.95],
  ];
  mark(g, smooth(clef, 5), ink, seed * 3);

  // The notes.
  const startX = x + gap * 3.2;
  const beats = piece.notes.reduce((n, no) => n + no.d, 0);
  const perBeat = (width - (startX - x) - gap) / Math.max(1, beats);
  let at = 0;
  for (const [i, n] of piece.notes.entries()) {
    const nx = startX + at * perBeat;
    at += n.d;
    if (n.rest) continue;
    const step = stepOf(n.p);
    const ny = y + gap * 4 - (step * gap) / 2;
    const rx = gap * 0.46;
    const ry = gap * 0.36;

    // Ledger lines, when the note has climbed off the top.
    for (let s = 10; s <= step; s += 2) {
      const ly = y + gap * 4 - (s * gap) / 2;
      mark(g, [[nx - gap * 0.75, ly], [nx + gap * 0.75, ly]], fine, seed + s + i);
    }
    for (let s = -2; s >= step; s -= 2) {
      const ly = y + gap * 4 - (s * gap) / 2;
      mark(g, [[nx - gap * 0.75, ly], [nx + gap * 0.75, ly]], fine, seed + s + i);
    }

    // The head: an oval on a slant, filled for short notes and open for long.
    const head: Pt[] = [];
    for (let k = 0; k <= 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      head.push([
        nx + Math.cos(a) * rx * 0.96 + Math.sin(a) * gap * 0.1,
        ny + Math.sin(a) * ry,
      ]);
    }
    mark(g, head, ink, seed * 7 + i);
    if (n.d < 2) {
      for (let k = 0; k < 4; k++) {
        mark(g, [
          [nx - rx * 0.8 + k * rx * 0.4, ny + ry * 0.7],
          [nx - rx * 0.4 + k * rx * 0.4, ny - ry * 0.75],
        ], pencil(ink, { passes: 1 }), seed * 11 + i * 5 + k);
      }
    }
    // Stem, up or down depending on which side of the middle line it sits.
    const up = step < 4;
    const sx = up ? nx + rx * 0.92 : nx - rx * 0.92;
    // An octave, which is what a stem is. Two octaves is a flagpole.
    const sy2 = up ? ny - gap * 1.75 : ny + gap * 1.75;
    mark(g, [[sx, ny], [sx, sy2]], ink, seed * 13 + i);
    // Flags, for anything shorter than a beat.
    if (n.d <= 0.5) {
      mark(g, smooth([
        [sx, sy2], [sx + (up ? gap * 0.6 : -gap * 0.6), sy2 + (up ? gap * 0.5 : -gap * 0.5)],
        [sx + (up ? gap * 0.35 : -gap * 0.35), sy2 + (up ? gap * 1.15 : -gap * 1.15)],
      ], 6), ink, seed * 17 + i);
    }
    if (sharpAt(n.p)) {
      const ax = nx - gap * 1.05;
      for (const d of [-0.18, 0.18]) {
        mark(g, [[ax + d * gap, ny - gap * 0.6], [ax + d * gap, ny + gap * 0.6]], fine, seed * 19 + i + d * 10);
      }
      for (const d of [-0.22, 0.22]) {
        mark(g, [[ax - gap * 0.42, ny + d * gap + gap * 0.1], [ax + gap * 0.42, ny + d * gap - gap * 0.1]], fine, seed * 23 + i + d * 10);
      }
    }
  }
}

// ──────────────────────────────────────────────────────────── the playing

/**
 * Play a piece.
 *
 * A plucked-string tone, built the way the film's score is: a stack of sines
 * with a fast attack and a long decay. Two voices where a piece has two, so the
 * inversion can be heard arriving underneath the subject, which is the entire
 * point of that one.
 */
export function play(ctx: AudioContext, piece: Piece, onDone?: () => void): () => void {
  const beat = 60 / piece.bpm;
  const out = ctx.createGain();
  out.gain.value = 0.22;
  out.connect(ctx.destination);
  const nodes: OscillatorNode[] = [];
  const t0 = ctx.currentTime + 0.06;

  const voice = (notes: Note[], startBeat: number, transpose: number, gain: number) => {
    let at = startBeat;
    for (const n of notes) {
      const when = t0 + at * beat;
      at += n.d;
      if (n.rest) continue;
      const f = piece.root * Math.pow(2, (n.p + transpose) / 12);
      for (const [mult, amp] of [[1, 1], [2, 0.3], [3, 0.12], [4.01, 0.05]] as const) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = f * mult;
        const dur = Math.max(0.5, n.d * beat * 1.8);
        g.gain.setValueAtTime(0.0001, when);
        g.gain.exponentialRampToValueAtTime(gain * amp, when + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
        o.connect(g);
        g.connect(out);
        o.start(when);
        o.stop(when + dur + 0.05);
        nodes.push(o);
      }
    }
    return at;
  };

  const end = voice(piece.notes, 0, 0, 0.5);
  let last = end;
  if (piece.answer) {
    last = Math.max(end, voice(piece.answer.notes, piece.answer.after, piece.answer.transpose, 0.38));
  }
  const timer = setTimeout(() => onDone?.(), (last * beat + 1.4) * 1000);

  return () => {
    clearTimeout(timer);
    for (const n of nodes) {
      try { n.stop(); } catch { /* already stopped */ }
    }
    out.disconnect();
  };
}
