/**
 * Six colours, and why exactly six.
 *
 * The reference drawings carry their own palette in the corner: a stack of six
 * rounded pills, and every line in the picture is one of them. That is not
 * decoration, it is the *rule the drawing was made under*, printed on the
 * drawing — and it turns out to be the whole discipline of the style. With six
 * inks and no mixing you cannot render anything. You cannot shade, you cannot
 * blend, you cannot correct. What you can do is *choose*, over and over, and
 * the choosing is what the picture is made of.
 *
 * So each drawing here draws six from the pool and then may use nothing else
 * for its line work. The strip in the corner is generated from the same six,
 * which means it is a claim the picture can be checked against rather than a
 * flourish.
 *
 * The pool is deliberately loud and deliberately unbalanced — no browns worth
 * the name, no greys at all, half of it barely a step off primary. Anything
 * tasteful in here reads as a colour *scheme*, and the point of the style is
 * that the colours have nothing to do with the object. A Coke bottle drawn in
 * blue, lime and orange is a Coke bottle you have to look at.
 */

export interface Ink {
  id: string;
  name: string;
  hex: string;
  /** Roughly where it sits on the wheel, for keeping a set spread out. */
  hue: number;
  /** Dark enough to read as a line on white. */
  dark: boolean;
}

const I = (id: string, name: string, hex: string, hue: number, dark = false): Ink => ({
  id, name, hex, hue, dark,
});

export const INKS: Ink[] = [
  I('blue', 'Electric blue', '#1668f0', 218, true),
  I('sky', 'Sky', '#8fd0f2', 200),
  I('navy', 'Navy', '#152742', 218, true),
  I('teal', 'Teal', '#16bfc0', 182),
  I('mint', 'Mint', '#7fe3b6', 155),
  I('green', 'Grass', '#2cb92c', 122, true),
  I('lime', 'Lime', '#a9e22c', 78),
  I('acid', 'Acid yellow', '#eff31a', 62),
  I('yellow', 'Yellow', '#fbd415', 48),
  I('ochre', 'Ochre', '#d9a520', 42),
  I('orange', 'Orange', '#f89a15', 34),
  I('tangerine', 'Tangerine', '#f4621d', 18, true),
  I('red', 'Red', '#ee1c1c', 0, true),
  I('coral', 'Coral', '#ec5a6c', 353),
  I('magenta', 'Magenta', '#f42ea0', 325, true),
  I('purple', 'Purple', '#7a3fd1', 268, true),
  I('plum', 'Plum', '#5c3038', 348, true),
  I('ink', 'Near black', '#1d1d24', 240, true),
];

export const INK_BY_ID = Object.fromEntries(INKS.map((i) => [i.id, i])) as Record<string, Ink>;

const wheel = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

/**
 * Draw six.
 *
 * Rejection on hue spacing, not a random six. Six inks picked freely come out
 * with three yellows in them about a third of the time, and a palette with
 * three yellows in it has four colours — the strip in the corner then promises
 * a variety the drawing cannot deliver. Two of the six are held to be dark
 * enough to carry a contour on white, for the same reason: a set of six pastels
 * cannot draw an outline, and the outline is the drawing.
 */
export function sixColours(r: () => number): Ink[] {
  const out: Ink[] = [];
  let guard = 0;
  while (out.length < 6 && guard++ < 600) {
    const ink = INKS[Math.floor(r() * INKS.length) % INKS.length];
    if (out.some((o) => o.id === ink.id)) continue;
    if (out.some((o) => wheel(o.hue, ink.hue) < 22)) continue;
    out.push(ink);
  }
  while (out.length < 6) out.push(INKS[Math.floor(r() * INKS.length) % INKS.length]);
  if (out.filter((o) => o.dark).length < 2) {
    const darks = INKS.filter((i) => i.dark);
    for (let k = 0; k < out.length && out.filter((o) => o.dark).length < 2; k++) {
      if (!out[k].dark) out[k] = darks[Math.floor(r() * darks.length) % darks.length];
    }
  }
  return out;
}

/**
 * What the thing is actually made of.
 *
 * Separate from the six, and much quieter. The subject colours are the only
 * place in the drawing where colour is allowed to be *local* — cola is brown,
 * tea is amber, glass is barely anything — and they go on first, translucent
 * and broad, so the six can be laid over them and disagree. Take this layer out
 * and you have a colouring-in of an outline; take the six out and you have a
 * flat illustration. The style is the argument between them.
 */
export interface Body {
  id: string;
  name: string;
  /** Two to four translucent fills, painted broad. */
  tints: string[];
  /** How opaque the fills go. Glass is a whisper, cola is not. */
  weight: number;
}

export const BODIES: Body[] = [
  { id: 'glass', name: 'Clear glass', tints: ['#dfe7e2', '#cbd8d6', '#eef1ea'], weight: 0.34 },
  { id: 'cola', name: 'Cola', tints: ['#6d2a2a', '#8c2f2c', '#43191c'], weight: 0.92 },
  { id: 'tea', name: 'Tea', tints: ['#c98a3a', '#a9662a', '#e0b070'], weight: 0.72 },
  { id: 'wine', name: 'Wine', tints: ['#5c1c30', '#7d2038', '#3a1220'], weight: 0.9 },
  { id: 'milk', name: 'Milk', tints: ['#f2ece0', '#e6dccb', '#fbf7ee'], weight: 0.6 },
  { id: 'water', name: 'Water', tints: ['#cfe4ea', '#b7d6e0', '#e8f2f4'], weight: 0.3 },
  { id: 'oil', name: 'Oil', tints: ['#d8c14e', '#bda033', '#eddc8a'], weight: 0.66 },
  { id: 'juice', name: 'Juice', tints: ['#e88420', '#d16a12', '#f6b45c'], weight: 0.82 },
  { id: 'ceramic', name: 'Glazed clay', tints: ['#e8e2d4', '#d3caba', '#f3efe6'], weight: 0.78 },
  { id: 'enamel', name: 'Enamel', tints: ['#eef1f3', '#d7dee2', '#fbfcfc'], weight: 0.74 },
  { id: 'copper', name: 'Copper', tints: ['#c07038', '#9d5326', '#e0996a'], weight: 0.8 },
  { id: 'greenglass', name: 'Green glass', tints: ['#c3d8bd', '#9dbd9c', '#e2ece0'], weight: 0.4 },
];

export const BODY_BY_ID = Object.fromEntries(BODIES.map((b) => [b.id, b])) as Record<string, Body>;

/** Faces get their own, because there is no sensible palette that covers both. */
export const SKINS = ['#f7d9bd', '#eec49f', '#dda87b', '#c2854f', '#9a5f34', '#6f4326',
  '#f3cbb0', '#e0b48c'];

/** Hair is never local colour here. It is one of the six, at full strength. */
export const LIPS = ['#e0485c', '#c8324a', '#e8697a', '#b8404e', '#d95a52'];
