/**
 * The crossing, after Valmiki's Sundara Kanda (sarga 1): the leap from
 * Mahendra, Mainaka rising to offer rest, Surasa's test, Simhika who seizes
 * shadows, and Lanka on Trikuta, then the Ashoka grove.
 *
 * Distance d runs from 0 (Mahendra) to END (the shimshapa tree). The ocean
 * is a hundred yojanas wide, so d / END * 100 is the yojana count.
 */

export const END = 6150;
export const PLACES = {
  mahendra: { x: 0, z: 0, h: 150 },
  mainaka: { x: 150, z: -1500, h: 120 },
  surasa: { x: 0, z: -2800, mouthY: 92 },
  simhika: { x: 0, z: -4000, r: 190 },
  lanka: { x: 0, z: -6550, r: 700 },
  vatika: { x: -220, z: -6150, ground: 14 },
  tree: { x: -220, y: 32.5, z: -6150 },
  perch: { x: -213.8, y: 28.6, z: -6148.5 },
};

type Key = [d: number, x: number, y: number, size: number, speed: number];
/** Story-mode flight path: distance → position, size and speed. */
export const PATH: Key[] = [
  [0, 0, 151, 3.2, 40],
  [250, 0, 235, 4.6, 70],
  [900, -40, 175, 3, 62],
  [1350, 70, 130, 2.6, 40],
  [1500, 118, 128, 2.6, 30],
  [1750, 50, 150, 2.6, 55],
  [2450, 0, 105, 4.2, 45],
  [2690, 0, 94, 5.4, 26],
  [2765, 0, 92, 0.35, 20],
  [2860, 0, 92, 0.35, 26],
  [2960, 0, 102, 0.9, 40],
  [3150, 0, 130, 2.6, 60],
  [3820, 0, 72, 2.6, 42],
  [3960, 0, 40, 0.6, 26],
  [4040, 0, 20, 0.5, 30],
  [4180, 0, 120, 2.8, 75],
  [5150, 0, 165, 2.2, 62],
  [5750, -110, 125, 1.3, 42],
  [6060, -205, 60, 0.7, 24],
  [END, PLACES.perch.x, PLACES.perch.y, 0.9, 8],
];

const smooth = (t: number) => t * t * (3 - 2 * t);
export function pathAt(d: number) {
  const D = Math.max(0, Math.min(END, d));
  let i = 0;
  while (i < PATH.length - 2 && PATH[i + 1][0] < D) i++;
  const a = PATH[i], b = PATH[i + 1], t = smooth((D - a[0]) / Math.max(1, b[0] - a[0]));
  const L = (k: number) => a[k] + (b[k] - a[k]) * t;
  return { x: L(1), y: L(2), size: L(3), speed: L(4) };
}

export type Caption = { d: number; title: string; body: string; who?: string };
export const CAPTIONS: Caption[] = [
  { d: -1, title: 'Mount Mahendra', body: 'To find Sita, someone has to cross the ocean to Lanka. Hanuman grows to an immense size, crouches on Mahendra, and the mountain shakes under him.' },
  { d: 60, title: 'The leap', body: 'He springs into the sky. The ocean is a hundred yojanas wide, and there is nowhere to land.' },
  { d: 1150, title: 'Mainaka', body: 'The golden mountain Mainaka rises out of the sea to offer him a place to rest. Hanuman touches it with his hand, thanks it, and flies on.' },
  { d: 2350, title: 'Surasa', body: 'The gods send Surasa, mother of serpents, to test him. Every time he grows, she opens her mouth wider.' },
  { d: 2740, title: 'Smaller than a thumb', body: 'So he becomes tiny, darts into her mouth and out again before she can close it. Surasa blesses him.' },
  { d: 3600, title: 'Simhika', body: 'A demoness in the water seizes creatures by their shadows. She catches his, and he feels himself dragged down.' },
  { d: 3980, title: 'Through and out', body: 'He shrinks, dives into her, and tears his way free.' },
  { d: 5000, title: 'Lanka', body: 'Ahead, on the peaks of Trikuta, the golden city of Ravana. Hanuman makes himself small and waits for night.' },
  { d: 5900, title: 'The Ashoka grove', body: 'Searching the city by moonlight, he reaches a garden of ashoka trees, climbs a shimshapa tree, and looks down through its leaves.' },
];
export const FINALE: Caption = { d: END, title: 'Sita', body: 'Under the tree sits Sita, guarded and grieving. Hanuman has carried one thing across the ocean for her: Rama\'s ring.' };
export const RING: Caption = { d: END, title: 'Rama\'s ring', body: 'He drops softly from the branch, tells her Rama\'s story, and gives her the ring with Rama\'s name on it. She knows it at once.' };

/** Encounter markers for the progress bar. */
export const MARKS = [
  { d: 1500, label: 'Mainaka' },
  { d: 2800, label: 'Surasa' },
  { d: 4000, label: 'Simhika' },
  { d: 5600, label: 'Lanka' },
];
