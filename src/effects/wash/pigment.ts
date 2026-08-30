/**
 * Pigments, and why a watercolour needs to know about them.
 *
 * Everything characteristic about this medium is a *pigment* property rather
 * than a brush one, which is the opposite of the crayon study next door.
 *
 * **Absorption, not colour.** Paint is not a colour you paste onto paper; it is
 * a filter you put between the light and the white sheet underneath. So a
 * pigment is stored as three absorption coefficients — how hungrily it eats
 * red, green and blue per unit of thickness — and the sheet is tinted with
 * Beer–Lambert, `paper · exp(−k·thickness)`. Two washes over each other
 * multiply, which is why a real second wash always darkens and never brightens,
 * and why a blue over an orange goes to a grey-brown rather than to the
 * halfway-house you get from averaging two RGB values.
 *
 * **Granulation** is whether the particles are heavy enough to fall into the
 * pits of the paper and sit there. French ultramarine does it so hard the
 * texture of the sheet becomes the subject; phthalo blue does not do it at all.
 * It is the single biggest reason a real wash does not look like an airbrush.
 *
 * **Staining** is whether the pigment lets go once it has dried. Alizarin bites
 * into the fibre and no amount of clean water lifts it; ultramarine sits on top
 * and can be washed almost back to white. In the solver this decides whether
 * pigment already deposited can be picked back up by later flow — which is what
 * lets a second stroke through a first *move* the first one around.
 */

export interface Pigment {
  id: string;
  name: string;
  /** Absorption per unit thickness, one coefficient per channel. */
  k: [number, number, number];
  /** 0 = dissolves evenly, 1 = falls into the tooth of the paper. */
  granulate: number;
  /** 0 = lifts straight off again, 1 = bites into the fibre for good. */
  stain: number;
  /** How fast it drops out of suspension. Heavy pigments settle sooner. */
  settle: number;
}

const P = (
  id: string,
  name: string,
  k: [number, number, number],
  granulate: number,
  stain: number,
  settle: number,
): Pigment => ({ id, name, k, granulate, stain, settle });

export const PIGMENTS: Pigment[] = [
  // ------------------------------------------------------------------- cool
  P('ultramarine', 'French ultramarine', [2.95, 1.85, 0.34], 0.95, 0.14, 1.15),
  P('indigo', 'Indigo', [3.15, 2.45, 1.35], 0.5, 0.42, 1.0),
  P('prussian', 'Prussian blue', [3.0, 1.62, 0.52], 0.1, 0.9, 0.85),
  P('payne', "Payne's grey", [2.3, 2.02, 1.52], 0.55, 0.34, 1.0),
  P('cerulean', 'Cerulean', [2.2, 1.02, 0.24], 0.92, 0.1, 1.25),
  P('viridian', 'Viridian', [2.42, 0.72, 1.6], 0.85, 0.2, 1.1),
  P('violet', 'Dioxazine violet', [2.1, 2.9, 1.02], 0.3, 0.85, 0.9),
  P('sap', 'Sap green', [1.9, 0.88, 2.4], 0.35, 0.5, 0.95),
  P('sepia', 'Sepia', [1.6, 2.2, 2.85], 0.5, 0.4, 1.0),
  // ------------------------------------------------------------------- warm
  P('vermilion', 'Vermilion', [0.3, 2.45, 2.8], 0.25, 0.55, 1.0),
  P('orange', 'Transparent orange', [0.24, 1.6, 3.0], 0.15, 0.6, 0.85),
  P('alizarin', 'Alizarin crimson', [0.46, 2.9, 2.1], 0.05, 0.92, 0.8),
  P('rose', 'Quinacridone rose', [0.3, 2.7, 1.5], 0.05, 0.95, 0.8),
  P('sienna', 'Burnt sienna', [0.9, 1.9, 2.7], 0.7, 0.3, 1.15),
  P('ochre', 'Yellow ochre', [0.26, 0.9, 2.4], 0.6, 0.3, 1.1),
  P('scarlet', 'Scarlet lake', [0.34, 2.65, 2.35], 0.12, 0.75, 0.85),
];

export const PIGMENT_BY_ID = Object.fromEntries(PIGMENTS.map((p) => [p.id, p])) as Record<
  string,
  Pigment
>;

/**
 * A palette is two pigments and nothing else.
 *
 * One cool, one warm, mixed on the paper rather than in a well — which is the
 * whole discipline the reference paintings are working under. Two pigments give
 * you four colours (each alone, the mix, and the paper), and the mix is
 * *earned*: it only appears where two strokes actually met while both were wet.
 * Add a third tube and the picture stops being about that meeting.
 */
export interface Palette {
  id: string;
  name: string;
  cool: string;
  warm: string;
  /** How the picture divides between them, 0 all cool, 1 all warm. */
  bias: number;
}

export const PALETTES: Palette[] = [
  { id: 'dusk', name: 'Indigo and vermilion', cool: 'indigo', warm: 'vermilion', bias: 0.52 },
  { id: 'canter', name: 'Ultramarine and burnt orange', cool: 'ultramarine', warm: 'orange',
    bias: 0.56 },
  { id: 'flamenco', name: 'Crimson and violet', cool: 'violet', warm: 'alizarin', bias: 0.6 },
  { id: 'cello', name: "Payne's grey and orange", cool: 'payne', warm: 'orange', bias: 0.48 },
  { id: 'harbour', name: 'Prussian blue and sienna', cool: 'prussian', warm: 'sienna', bias: 0.44 },
  { id: 'linen', name: 'Sepia and teal', cool: 'viridian', warm: 'sepia', bias: 0.5 },
  { id: 'balcony', name: 'Cerulean and rose', cool: 'cerulean', warm: 'rose', bias: 0.54 },
  { id: 'garden', name: 'Sap green and ochre', cool: 'sap', warm: 'ochre', bias: 0.5 },
  { id: 'shutter', name: 'Ultramarine and scarlet', cool: 'ultramarine', warm: 'scarlet',
    bias: 0.5 },
  { id: 'quiet', name: 'Payne’s grey and rose', cool: 'payne', warm: 'rose', bias: 0.46 },
  { id: 'monsoon', name: 'Indigo and sienna', cool: 'indigo', warm: 'sienna', bias: 0.42 },
  { id: 'peach', name: 'Viridian and scarlet', cool: 'viridian', warm: 'scarlet', bias: 0.55 },
];

export const PALETTE_BY_ID = Object.fromEntries(PALETTES.map((p) => [p.id, p])) as Record<
  string,
  Palette
>;

/** The four paper whites. Rag paper is never actually white. */
export const PAPERS: [number, number, number][] = [
  [0.976, 0.968, 0.953],
  [0.985, 0.98, 0.972],
  [0.968, 0.955, 0.929],
  [0.972, 0.964, 0.947],
];
