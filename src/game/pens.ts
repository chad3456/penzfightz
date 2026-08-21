/**
 * The roster.
 *
 * Every pen that ever mattered on an Indian back bench between about 1994 and
 * 2003. The numbers below are the single source of truth: the 3D models read
 * them, the physics reads them, and `scripts/gen-pen-seed.mjs` turns them into
 * the SQL seed for the `pens` table so the DB never drifts from the client.
 *
 * Units are the units of the table: metres and kilograms. A real Reynolds 045
 * is about 14cm long and weighs about 9 grams, and that is exactly what it is
 * here.
 */

export type BarrelStyle = 'round' | 'hex' | 'tapered' | 'stepped';

export interface PenSpec {
  id: string;
  name: string;
  brand: string;
  /** 1 common .. 5 legendary. Drives the pen-box ordering and unlock cost. */
  tier: 1 | 2 | 3 | 4 | 5;
  blurb: string;

  // ---- physics ----
  /** kilograms. Heavier pens shrug off hits but need a harder flick. */
  mass: number;
  /** metres, tip to tail. */
  length: number;
  /** metres, barrel radius. */
  radius: number;
  /** sliding friction against the desk. Low = skids, high = bites. */
  friction: number;
  /** bounciness on pen-to-pen contact. */
  restitution: number;
  /** 0 = nose heavy, 0.5 = neutral, 1 = tail heavy. Shifts the centre of mass. */
  balance: number;
  /** How much the pen resists spinning up. Fat grips settle quicker. */
  angularDamping: number;

  // ---- flavour, shown on the team sheet ----
  weightLabel: string;
  woodLabel: string;
  habitLabel: string;

  // ---- looks ----
  bodyColor: string;
  capColor: string;
  gripColor: string;
  accentColor: string;
  inkColor: string;
  barrelStyle: BarrelStyle;
  /** Translucent barrel — Cello Gripper, V5 and friends. */
  transparent: boolean;
  /** Has a rubber grip section near the nib. */
  hasGrip: boolean;
  /** Clip on the cap. */
  hasClip: boolean;

  unlockPoints: number;
}

export const PENS: PenSpec[] = [
  {
    id: 'reynolds045',
    name: 'Reynolds 045',
    brand: 'Reynolds',
    tier: 1,
    blurb: 'The one everybody started with. Honest, cheap, and it always writes.',
    mass: 0.009,
    length: 0.142,
    radius: 0.0044,
    friction: 0.42,
    restitution: 0.22,
    balance: 0.48,
    angularDamping: 1.5,
    weightLabel: 'middling',
    woodLabel: 'steady',
    habitLabel: 'dead touch',
    bodyColor: '#f4f1ea',
    capColor: '#1c48b8',
    gripColor: '#1c48b8',
    accentColor: '#d92b2b',
    inkColor: '#1c48b8',
    barrelStyle: 'hex',
    transparent: false,
    hasGrip: false,
    hasClip: true,
    unlockPoints: 0,
  },
  {
    id: 'cello_gripper',
    name: 'Cello Gripper',
    brand: 'Cello',
    tier: 1,
    blurb: 'That squishy blue grip. Sweaty palms in a Chennai May had no answer.',
    mass: 0.0105,
    length: 0.147,
    radius: 0.0052,
    friction: 0.55,
    restitution: 0.18,
    balance: 0.42,
    angularDamping: 2.2,
    weightLabel: 'middling',
    woodLabel: 'bites',
    habitLabel: 'stops dead',
    bodyColor: '#2a6fd6',
    capColor: '#16407f',
    gripColor: '#0d2a5c',
    accentColor: '#f0f0f0',
    inkColor: '#16407f',
    barrelStyle: 'round',
    transparent: true,
    hasGrip: true,
    hasClip: true,
    unlockPoints: 0,
  },
  {
    id: 'natraj_621',
    name: 'Natraj 621',
    brand: 'Natraj',
    tier: 1,
    blurb: 'Red and black stripes. Technically a pencil brand pen. Nobody cared.',
    mass: 0.0072,
    length: 0.138,
    radius: 0.004,
    friction: 0.3,
    restitution: 0.3,
    balance: 0.55,
    angularDamping: 1.1,
    weightLabel: 'light',
    woodLabel: 'skids',
    habitLabel: 'runs long',
    bodyColor: '#c8342a',
    capColor: '#1a1a1a',
    gripColor: '#1a1a1a',
    accentColor: '#f2c14b',
    inkColor: '#1a1a1a',
    barrelStyle: 'hex',
    transparent: false,
    hasGrip: false,
    hasClip: true,
    unlockPoints: 40,
  },
  {
    id: 'linc_ocean',
    name: 'Linc Ocean Gel',
    brand: 'Linc',
    tier: 2,
    blurb: 'Gel ink that smudged across your palm and your answer sheet alike.',
    mass: 0.0115,
    length: 0.145,
    radius: 0.0055,
    friction: 0.38,
    restitution: 0.26,
    balance: 0.5,
    angularDamping: 1.4,
    weightLabel: 'solid',
    woodLabel: 'steady',
    habitLabel: 'dead touch',
    bodyColor: '#0f7d8c',
    capColor: '#073d47',
    gripColor: '#0a5560',
    accentColor: '#c9f0f5',
    inkColor: '#073d47',
    barrelStyle: 'round',
    transparent: false,
    hasGrip: true,
    hasClip: true,
    unlockPoints: 120,
  },
  {
    id: 'montex_hitecpoint',
    name: 'Montex Hi-Tecpoint',
    brand: 'Montex',
    tier: 2,
    blurb: 'The two-rupee needle point. Light, mean, and gone by lunch break.',
    mass: 0.0068,
    length: 0.139,
    radius: 0.0041,
    friction: 0.26,
    restitution: 0.34,
    balance: 0.58,
    angularDamping: 0.9,
    weightLabel: 'feather',
    woodLabel: 'skids bad',
    habitLabel: 'runs long',
    bodyColor: '#e8e4d8',
    capColor: '#1d7a3e',
    gripColor: '#1d7a3e',
    accentColor: '#1d7a3e',
    inkColor: '#155c2e',
    barrelStyle: 'tapered',
    transparent: true,
    hasGrip: false,
    hasClip: true,
    unlockPoints: 160,
  },
  {
    id: 'camlin_exam',
    name: 'Camlin Exam',
    brand: 'Camlin',
    tier: 2,
    blurb: 'Handed out before board exams like a lucky charm. Fat, blunt, reliable.',
    mass: 0.0128,
    length: 0.144,
    radius: 0.0062,
    friction: 0.5,
    restitution: 0.2,
    balance: 0.45,
    angularDamping: 2.4,
    weightLabel: 'solid',
    woodLabel: 'bites',
    habitLabel: 'stops dead',
    bodyColor: '#1f3f7a',
    capColor: '#122a52',
    gripColor: '#0c1f3d',
    accentColor: '#e2b33c',
    inkColor: '#122a52',
    barrelStyle: 'stepped',
    transparent: false,
    hasGrip: true,
    hasClip: true,
    unlockPoints: 200,
  },
  {
    id: 'rotomac_gel',
    name: 'Rotomac Gel',
    brand: 'Rotomac',
    tier: 3,
    blurb: '"Likhte likhte love ho jaaye." Wrote smooth, fought smoother.',
    mass: 0.0132,
    length: 0.148,
    radius: 0.0058,
    friction: 0.4,
    restitution: 0.28,
    balance: 0.44,
    angularDamping: 1.6,
    weightLabel: 'heavy-ish',
    woodLabel: 'steady',
    habitLabel: 'dead touch',
    bodyColor: '#2b2b2f',
    capColor: '#8c1c2b',
    gripColor: '#151518',
    accentColor: '#d6b45a',
    inkColor: '#151518',
    barrelStyle: 'round',
    transparent: false,
    hasGrip: true,
    hasClip: true,
    unlockPoints: 320,
  },
  {
    id: 'pilot_v5',
    name: 'Pilot V5',
    brand: 'Pilot',
    tier: 3,
    blurb: 'Hi-Tecpoint. The rich kid pen. Skidded across the desk like it was ice.',
    mass: 0.0098,
    length: 0.151,
    radius: 0.0049,
    friction: 0.24,
    restitution: 0.32,
    balance: 0.56,
    angularDamping: 1.0,
    weightLabel: 'light',
    woodLabel: 'skids',
    habitLabel: 'dead touch',
    bodyColor: '#2f7fd6',
    capColor: '#1b4f96',
    gripColor: '#123a71',
    accentColor: '#f5f7fa',
    inkColor: '#1b4f96',
    barrelStyle: 'round',
    transparent: true,
    hasGrip: false,
    hasClip: true,
    unlockPoints: 400,
  },
  {
    id: 'addgel_chetak',
    name: 'Add Gel Chetak',
    brand: 'Add Gel',
    tier: 3,
    blurb: 'Named after a warhorse. Behaved like one on a wooden desk.',
    mass: 0.0142,
    length: 0.146,
    radius: 0.006,
    friction: 0.46,
    restitution: 0.24,
    balance: 0.4,
    angularDamping: 2.0,
    weightLabel: 'heavy',
    woodLabel: 'bites',
    habitLabel: 'stops dead',
    bodyColor: '#1a1a1e',
    capColor: '#0d0d10',
    gripColor: '#3a3a42',
    accentColor: '#c0902f',
    inkColor: '#0d0d10',
    barrelStyle: 'stepped',
    transparent: false,
    hasGrip: true,
    hasClip: true,
    unlockPoints: 520,
  },
  {
    id: 'flair_carbonix',
    name: 'Flair Carbonix',
    brand: 'Flair',
    tier: 4,
    blurb: 'Matte black barrel, carbon pattern, absurd confidence. Feared.',
    mass: 0.0158,
    length: 0.149,
    radius: 0.0063,
    friction: 0.44,
    restitution: 0.26,
    balance: 0.38,
    angularDamping: 2.1,
    weightLabel: 'heavy',
    woodLabel: 'steady',
    habitLabel: 'stops dead',
    bodyColor: '#141418',
    capColor: '#0a0a0c',
    gripColor: '#26262c',
    accentColor: '#8f9aa8',
    inkColor: '#0a0a0c',
    barrelStyle: 'hex',
    transparent: false,
    hasGrip: true,
    hasClip: true,
    unlockPoints: 720,
  },
  {
    id: 'hero_616',
    name: 'Hero 616',
    brand: 'Hero',
    tier: 4,
    blurb: 'A Chinese fountain pen with a brass barrel. Illegal in spirit, unbanned in fact.',
    mass: 0.0185,
    length: 0.134,
    radius: 0.0058,
    friction: 0.52,
    restitution: 0.16,
    balance: 0.34,
    angularDamping: 2.8,
    weightLabel: 'brick',
    woodLabel: 'bites hard',
    habitLabel: 'stops dead',
    bodyColor: '#0f3b2a',
    capColor: '#c8a33a',
    gripColor: '#0b2c20',
    accentColor: '#e0c463',
    inkColor: '#0b2c20',
    barrelStyle: 'tapered',
    transparent: false,
    hasGrip: false,
    hasClip: true,
    unlockPoints: 900,
  },
  {
    id: 'reynolds_trimax',
    name: 'Reynolds Trimax',
    brand: 'Reynolds',
    tier: 5,
    blurb:
      'The Trimax. Triangular grip, perfect weight, and whoever brought one to class was not losing that day.',
    mass: 0.0148,
    length: 0.152,
    radius: 0.0061,
    friction: 0.36,
    restitution: 0.3,
    balance: 0.46,
    angularDamping: 1.3,
    weightLabel: 'perfect',
    woodLabel: 'grips true',
    habitLabel: 'never wobbles',
    bodyColor: '#1e2a44',
    capColor: '#0f1729',
    gripColor: '#2f6fd0',
    accentColor: '#e6e9f0',
    inkColor: '#0f1729',
    barrelStyle: 'hex',
    transparent: false,
    hasGrip: true,
    hasClip: true,
    unlockPoints: 1200,
  },
];

export const PEN_BY_ID: Record<string, PenSpec> = Object.fromEntries(
  PENS.map((p) => [p.id, p]),
);

export const DEFAULT_PEN_ID = 'reynolds045';
export const STARTER_PENS = ['reynolds045', 'cello_gripper'];

export function getPen(id: string | null | undefined): PenSpec {
  return (id && PEN_BY_ID[id]) || PEN_BY_ID[DEFAULT_PEN_ID];
}

export const TIER_NAMES: Record<number, string> = {
  1: 'tuck shop',
  2: 'decent',
  3: 'showing off',
  4: 'feared',
  5: 'legend',
};
