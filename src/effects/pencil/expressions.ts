/**
 * A hundred faces, and the argument for doing it this way.
 *
 * The lazy version generates a hundred faces by jittering a few numbers, and it
 * fails for a reason worth stating: a face is not a random point in parameter
 * space. Expressions are a small, structured set of muscle actions, and a
 * viewer reads them categorically — a brow raised at the inner end is *sad* and
 * the same brow raised at the outer end is *sceptical*, and halfway between
 * them is not half as sad, it is nothing at all.
 *
 * So every one of these hundred is a named expression first and a set of
 * numbers second, and the numbers were chosen to produce that name. That is
 * also what makes them distinguishable at thumbnail size: they differ along the
 * axes a face actually uses rather than along all of them at once.
 *
 * The axes, and what each one really controls:
 *
 *   browInner   raised is grief, pleading, worry. Lowered is anger. The single
 *               most informative number on the face.
 *   browOuter   raised is surprise and scepticism; lowered is weariness.
 *   lid         how open the eye is. Under about 0.35 the eye reads as closed
 *               and the lash line does the work instead.
 *   squint      the lower lid pushing up. This is what separates a real smile
 *               from a polite one, and a glare from a stare.
 *   gazeX/Y     where the pupil sits. Away and down is evasion; up is longing.
 *   pupil       small is shock and fury; large is affection and fear.
 *   curve       the mouth, -1 down to +1 up.
 *   open        how far the jaw has dropped.
 *   width       a wide flat mouth is a grimace; a small one is prim.
 *
 * Plus the marks the drawing itself can make, which in this idiom carry as
 * much as the anatomy: a sweat bead, a blush, the vertical shadow down the
 * face, the cross-popping vein, sparkle, tears.
 */

export type MouthShape =
  | 'curve' | 'open' | 'cat' | 'wave' | 'line' | 'grin' | 'tooth' | 'o' | 'tight' | 'gape';
export type EyeShape = 'round' | 'arc-up' | 'arc-down' | 'line' | 'wide' | 'half' | 'x' | 'swirl' | 'dot';

export interface Face {
  name: string;
  family: Family;
  browInner: number;
  browOuter: number;
  /** Thicker brows read as more forceful whatever their angle. */
  browWeight?: number;
  lid: number;
  squint: number;
  eye: EyeShape;
  gazeX: number;
  gazeY: number;
  pupil: number;
  curve: number;
  open: number;
  width: number;
  mouth: MouthShape;
  tilt?: number;
  blush?: number;
  sweat?: number;
  tears?: number;
  /** The vertical gloom down the upper face. */
  gloom?: number;
  sparkle?: number;
  /** The popping-vein cross. */
  vein?: number;
  /** Lines radiating off the head: shock, realisation. */
  shock?: number;
  note?: string;
}

export type Family =
  | 'joy' | 'sorrow' | 'anger' | 'fear' | 'surprise'
  | 'disdain' | 'tender' | 'thought' | 'exhaustion' | 'unhinged';

export const FAMILIES: { id: Family; label: string }[] = [
  { id: 'joy', label: 'Joy' },
  { id: 'sorrow', label: 'Sorrow' },
  { id: 'anger', label: 'Anger' },
  { id: 'fear', label: 'Fear' },
  { id: 'surprise', label: 'Surprise' },
  { id: 'disdain', label: 'Disdain' },
  { id: 'tender', label: 'Tender' },
  { id: 'thought', label: 'Thought' },
  { id: 'exhaustion', label: 'Exhaustion' },
  { id: 'unhinged', label: 'Unhinged' },
];

const f = (
  name: string, family: Family,
  browInner: number, browOuter: number,
  lid: number, squint: number, eye: EyeShape,
  gazeX: number, gazeY: number, pupil: number,
  curve: number, open: number, width: number, mouth: MouthShape,
  extra: Partial<Face> = {},
): Face => ({
  name, family, browInner, browOuter, lid, squint, eye,
  gazeX, gazeY, pupil, curve, open, width, mouth, ...extra,
});

export const FACES: Face[] = [
  // ── joy ───────────────────────────────────────────────────────────────
  f('Small smile', 'joy', 0.1, 0.15, 0.78, 0.15, 'round', 0, 0, 1, 0.5, 0, 0.5, 'curve'),
  f('Pleased', 'joy', 0.15, 0.2, 0.7, 0.3, 'round', 0, 0, 1.05, 0.7, 0.1, 0.55, 'curve'),
  f('Beaming', 'joy', 0.2, 0.3, 0.55, 0.55, 'arc-up', 0, 0, 1, 0.95, 0.35, 0.7, 'grin', { blush: 0.3 }),
  f('Eyes-shut delight', 'joy', 0.25, 0.35, 0.1, 0.9, 'arc-up', 0, 0, 1, 1, 0.45, 0.72, 'grin', { blush: 0.45 }),
  f('Laughing', 'joy', 0.2, 0.3, 0.12, 0.85, 'arc-up', 0, 0, 1, 1, 0.8, 0.8, 'gape', { tilt: -0.06 }),
  f('Giggling', 'joy', 0.15, 0.25, 0.3, 0.7, 'arc-up', 0.2, 0, 1, 0.85, 0.25, 0.45, 'curve', { blush: 0.4, tilt: 0.08 }),
  f('Cat grin', 'joy', 0.05, 0.1, 0.6, 0.4, 'round', 0, 0, 1, 0.8, 0, 0.6, 'cat'),
  f('Triumphant', 'joy', -0.1, 0.35, 0.7, 0.35, 'round', 0, -0.15, 0.95, 0.85, 0.25, 0.65, 'grin', { tilt: -0.1 }),
  f('Relieved', 'joy', 0.3, 0.1, 0.35, 0.5, 'arc-up', 0, 0.1, 1, 0.45, 0.05, 0.45, 'curve', { sweat: 0.3 }),
  f('Shy pleasure', 'joy', 0.35, 0.1, 0.45, 0.4, 'half', -0.3, 0.2, 1.1, 0.4, 0, 0.35, 'curve', { blush: 0.7 }),
  f('Mischievous', 'joy', -0.15, 0.25, 0.5, 0.45, 'half', 0.45, 0, 1, 0.75, 0.05, 0.55, 'cat'),
  f('Delighted gasp', 'joy', 0.4, 0.4, 0.95, 0, 'wide', 0, 0, 1.25, 0.6, 0.55, 0.4, 'o', { sparkle: 0.8 }),

  // ── sorrow ────────────────────────────────────────────────────────────
  f('Downcast', 'sorrow', 0.65, -0.15, 0.5, 0.1, 'round', 0, 0.55, 1.1, -0.45, 0, 0.45, 'curve'),
  f('Welling up', 'sorrow', 0.8, -0.1, 0.9, 0, 'wide', 0, 0.2, 1.3, -0.5, 0.1, 0.4, 'wave', { tears: 0.5 }),
  f('Crying', 'sorrow', 0.85, -0.2, 0.2, 0.3, 'arc-down', 0, 0.3, 1.2, -0.7, 0.6, 0.6, 'gape', { tears: 1 }),
  f('Silent tears', 'sorrow', 0.7, -0.1, 0.65, 0.15, 'round', -0.2, 0.3, 1.2, -0.3, 0, 0.35, 'line', { tears: 0.7 }),
  f('Trying not to cry', 'sorrow', 0.9, -0.05, 0.55, 0.35, 'round', 0, 0.35, 1.15, -0.25, 0.05, 0.3, 'tight', { tears: 0.35 }),
  f('Crestfallen', 'sorrow', 0.6, -0.25, 0.4, 0.2, 'half', 0, 0.6, 1, -0.5, 0, 0.4, 'curve', { gloom: 0.3 }),
  f('Lonely', 'sorrow', 0.5, -0.1, 0.55, 0.1, 'round', -0.5, 0.25, 1.1, -0.2, 0, 0.35, 'line'),
  f('Apologetic', 'sorrow', 0.75, 0, 0.45, 0.3, 'arc-down', 0, 0.4, 1.05, -0.15, 0.05, 0.4, 'wave', { sweat: 0.4, tilt: 0.1 }),
  f('Homesick', 'sorrow', 0.55, -0.05, 0.6, 0.15, 'round', 0.3, -0.35, 1.15, -0.25, 0, 0.35, 'curve'),
  f('Grieving', 'sorrow', 0.95, -0.3, 0.15, 0.4, 'arc-down', 0, 0.4, 1, -0.75, 0.35, 0.55, 'wave', { tears: 0.85, gloom: 0.45 }),
  f('Hurt', 'sorrow', 0.8, -0.1, 0.75, 0.05, 'wide', 0, 0.1, 1.25, -0.4, 0.15, 0.35, 'wave'),
  f('Resigned sadness', 'sorrow', 0.45, -0.2, 0.35, 0.25, 'half', 0, 0.45, 1, -0.3, 0, 0.4, 'line'),

  // ── anger ─────────────────────────────────────────────────────────────
  f('Annoyed', 'anger', -0.45, -0.1, 0.6, 0.35, 'half', 0.2, 0, 0.95, -0.3, 0, 0.45, 'wave', { browWeight: 1.2 }),
  f('Scowling', 'anger', -0.7, -0.2, 0.5, 0.5, 'round', 0, 0, 0.85, -0.5, 0, 0.5, 'curve', { browWeight: 1.4 }),
  f('Glaring', 'anger', -0.8, -0.3, 0.45, 0.6, 'half', 0, 0, 0.7, -0.4, 0, 0.4, 'line', { browWeight: 1.5 }),
  f('Furious', 'anger', -0.95, -0.4, 0.7, 0.4, 'wide', 0, 0, 0.55, -0.6, 0.5, 0.7, 'gape', { browWeight: 1.7, vein: 0.9 }),
  f('Sulking', 'anger', -0.35, -0.3, 0.45, 0.3, 'half', -0.45, 0.2, 1, -0.45, 0, 0.35, 'curve', { blush: 0.2 }),
  f('Pouting', 'anger', -0.2, -0.25, 0.55, 0.2, 'round', 0.3, 0.1, 1.1, -0.5, 0.15, 0.3, 'tight', { blush: 0.25, tilt: 0.09 }),
  f('Indignant', 'anger', -0.6, 0.1, 0.8, 0.2, 'wide', 0, 0, 0.8, -0.35, 0.4, 0.55, 'open', { browWeight: 1.3 }),
  f('Quietly seething', 'anger', -0.55, -0.2, 0.3, 0.55, 'line', 0, 0, 0.9, -0.2, 0, 0.35, 'tight', { vein: 0.5, gloom: 0.3 }),
  f('Snapping', 'anger', -0.85, -0.25, 0.65, 0.45, 'round', 0, 0, 0.6, -0.5, 0.75, 0.75, 'gape', { browWeight: 1.6 }),
  f('Betrayed', 'anger', -0.3, 0.35, 0.85, 0.1, 'wide', 0, 0, 0.9, -0.55, 0.2, 0.4, 'wave', { tears: 0.25 }),
  f('Cold fury', 'anger', -0.65, -0.35, 0.35, 0.5, 'half', 0, 0, 0.65, -0.15, 0, 0.35, 'line', { gloom: 0.55, browWeight: 1.4 }),
  f('Vein-popping', 'anger', -0.9, -0.3, 0.25, 0.7, 'x', 0, 0, 0.8, -0.4, 0.55, 0.7, 'gape', { vein: 1, browWeight: 1.7 }),

  // ── fear ──────────────────────────────────────────────────────────────
  f('Nervous', 'fear', 0.4, 0.2, 0.7, 0.15, 'round', -0.35, 0.1, 1.1, -0.2, 0.05, 0.4, 'wave', { sweat: 0.5 }),
  f('Anxious', 'fear', 0.55, 0.15, 0.8, 0.1, 'wide', 0.3, 0.15, 1.15, -0.3, 0.1, 0.35, 'wave', { sweat: 0.65 }),
  f('Frightened', 'fear', 0.6, 0.45, 1, 0, 'wide', 0, 0, 0.55, -0.5, 0.45, 0.5, 'gape', { sweat: 0.8 }),
  f('Terrified', 'fear', 0.7, 0.5, 1, 0, 'wide', 0, -0.1, 0.35, -0.6, 0.85, 0.65, 'gape', { sweat: 1, shock: 0.8 }),
  f('Cornered', 'fear', 0.5, 0.3, 0.9, 0.1, 'wide', -0.6, 0.1, 0.6, -0.4, 0.3, 0.45, 'wave', { sweat: 0.7 }),
  f('Flinching', 'fear', 0.45, 0.3, 0.25, 0.5, 'arc-down', 0, 0, 0.9, -0.35, 0.3, 0.5, 'tight', { sweat: 0.5, tilt: 0.14 }),
  f('Dread', 'fear', 0.5, 0.05, 0.55, 0.2, 'round', 0, 0.2, 0.7, -0.35, 0.05, 0.35, 'line', { gloom: 0.7 }),
  f('Panicking', 'fear', 0.65, 0.5, 0.95, 0, 'swirl', 0, 0, 0.8, -0.3, 0.7, 0.6, 'gape', { sweat: 0.9, shock: 0.6 }),
  f('Guilty', 'fear', 0.5, 0.05, 0.5, 0.3, 'half', -0.55, 0.3, 1.05, -0.25, 0.05, 0.35, 'wave', { sweat: 0.55, blush: 0.2 }),
  f('Braced', 'fear', 0.3, 0.1, 0.15, 0.6, 'line', 0, 0, 0.9, -0.3, 0.1, 0.45, 'tight', { sweat: 0.4 }),

  // ── surprise ──────────────────────────────────────────────────────────
  f('Blinking surprise', 'surprise', 0.35, 0.45, 0.95, 0, 'wide', 0, 0, 1, 0.05, 0.25, 0.3, 'o'),
  f('Startled', 'surprise', 0.3, 0.55, 1, 0, 'wide', 0, 0, 0.6, 0, 0.5, 0.4, 'o', { shock: 0.7 }),
  f('Astonished', 'surprise', 0.4, 0.6, 1, 0, 'wide', 0, -0.05, 0.75, 0.15, 0.8, 0.55, 'gape', { shock: 0.5 }),
  f('Double take', 'surprise', 0.2, 0.5, 0.95, 0.05, 'wide', 0.55, 0, 0.8, -0.1, 0.35, 0.4, 'open', { tilt: -0.12 }),
  f('Realisation', 'surprise', 0.25, 0.45, 0.85, 0.1, 'round', 0, -0.2, 0.9, 0.2, 0.4, 0.4, 'o', { shock: 0.45, sparkle: 0.3 }),
  f('Caught out', 'surprise', 0.45, 0.4, 0.95, 0, 'wide', -0.4, 0, 0.7, -0.15, 0.3, 0.35, 'o', { sweat: 0.6, blush: 0.3 }),
  f('Speechless', 'surprise', 0.3, 0.35, 0.9, 0, 'wide', 0, 0, 0.95, -0.05, 0.45, 0.35, 'gape'),
  f('Wonder', 'surprise', 0.35, 0.4, 0.95, 0, 'wide', 0, -0.25, 1.3, 0.35, 0.3, 0.35, 'o', { sparkle: 1 }),
  f('Jolted', 'surprise', 0.1, 0.55, 1, 0, 'dot', 0, 0, 0.3, -0.2, 0.6, 0.5, 'gape', { shock: 1, sweat: 0.5 }),

  // ── disdain ───────────────────────────────────────────────────────────
  f('Unimpressed', 'disdain', -0.25, -0.05, 0.35, 0.4, 'half', 0.15, 0, 0.9, -0.15, 0, 0.4, 'line'),
  f('Deadpan', 'disdain', 0, 0, 0.3, 0.3, 'line', 0, 0, 0.85, 0, 0, 0.4, 'line'),
  f('Side-eye', 'disdain', -0.2, 0.15, 0.5, 0.35, 'half', 0.8, 0, 0.95, -0.2, 0, 0.4, 'wave'),
  f('Smug', 'disdain', -0.1, 0.3, 0.45, 0.4, 'half', 0, 0, 0.95, 0.55, 0, 0.5, 'cat', { tilt: -0.1 }),
  f('Sceptical', 'disdain', -0.15, 0.55, 0.6, 0.25, 'round', 0.25, 0, 0.95, -0.15, 0, 0.4, 'wave', { note: 'one brow up' }),
  f('Withering', 'disdain', -0.5, -0.05, 0.3, 0.5, 'half', 0.2, -0.1, 0.8, -0.3, 0, 0.45, 'line', { tilt: -0.07 }),
  f('Bored', 'disdain', -0.1, -0.2, 0.4, 0.25, 'half', -0.5, 0.15, 0.95, -0.1, 0.15, 0.35, 'curve'),
  f('Pitying', 'disdain', 0.35, 0.1, 0.45, 0.35, 'arc-down', 0, 0.1, 1, 0.2, 0, 0.4, 'curve', { tilt: 0.1 }),
  f('Scoffing', 'disdain', -0.3, 0.35, 0.5, 0.4, 'half', 0.3, 0, 0.9, 0.35, 0.2, 0.45, 'cat'),
  f('Blank refusal', 'disdain', 0, -0.1, 0.2, 0.45, 'line', 0, 0, 0.9, -0.05, 0, 0.3, 'tight', { gloom: 0.4 }),

  // ── tender ────────────────────────────────────────────────────────────
  f('Fond', 'tender', 0.25, 0.1, 0.55, 0.35, 'half', 0, 0.05, 1.15, 0.45, 0, 0.45, 'curve', { blush: 0.25 }),
  f('In love', 'tender', 0.3, 0.2, 0.7, 0.3, 'round', 0, 0, 1.35, 0.6, 0.1, 0.5, 'curve', { blush: 0.6, sparkle: 0.7 }),
  f('Longing', 'tender', 0.45, 0.05, 0.65, 0.2, 'round', 0.2, -0.4, 1.25, 0.15, 0.05, 0.35, 'curve'),
  f('Grateful', 'tender', 0.4, 0.15, 0.4, 0.45, 'arc-up', 0, 0.1, 1.1, 0.55, 0.05, 0.45, 'curve', { tears: 0.2 }),
  f('Protective', 'tender', -0.15, 0.1, 0.65, 0.3, 'round', 0, 0, 0.95, 0.15, 0, 0.45, 'line', { browWeight: 1.2 }),
  f('Sleepy affection', 'tender', 0.2, 0, 0.3, 0.45, 'half', 0, 0.15, 1.2, 0.4, 0.05, 0.4, 'curve', { blush: 0.3 }),
  f('Reassuring', 'tender', 0.2, 0.15, 0.6, 0.3, 'round', 0, 0, 1.05, 0.5, 0, 0.5, 'curve'),
  f('Wistful', 'tender', 0.5, 0, 0.5, 0.25, 'half', -0.3, -0.2, 1.15, 0.25, 0, 0.35, 'curve'),
  f('Adoring', 'tender', 0.35, 0.25, 0.75, 0.2, 'round', 0, -0.1, 1.4, 0.65, 0.15, 0.45, 'curve', { sparkle: 0.9, blush: 0.5 }),

  // ── thought ───────────────────────────────────────────────────────────
  f('Thinking', 'thought', 0.1, 0.2, 0.6, 0.2, 'round', 0.5, -0.35, 1, 0, 0, 0.35, 'wave'),
  f('Puzzled', 'thought', 0.3, 0.4, 0.7, 0.15, 'round', 0.3, 0, 1.05, -0.1, 0.1, 0.35, 'wave', { tilt: 0.12 }),
  f('Suspicious', 'thought', -0.3, 0.1, 0.4, 0.45, 'half', 0.4, 0, 0.9, -0.2, 0, 0.35, 'tight' ),
  f('Calculating', 'thought', -0.1, 0.25, 0.45, 0.35, 'half', -0.4, -0.2, 0.9, 0.2, 0, 0.4, 'cat'),
  f('Distracted', 'thought', 0.15, 0.05, 0.55, 0.15, 'round', -0.55, -0.15, 1.05, 0.05, 0.15, 0.3, 'curve'),
  f('Concentrating', 'thought', -0.35, -0.05, 0.5, 0.45, 'round', 0, 0.05, 0.9, -0.1, 0, 0.3, 'tight', { sweat: 0.25 }),
  f('Remembering', 'thought', 0.25, 0.15, 0.35, 0.3, 'half', -0.5, -0.4, 1.1, 0.2, 0, 0.35, 'curve'),
  f('Unconvinced', 'thought', -0.2, 0.45, 0.55, 0.3, 'half', 0.35, 0, 0.95, -0.25, 0.1, 0.4, 'wave'),
  f('Deciding', 'thought', -0.2, 0.1, 0.45, 0.4, 'half', 0, -0.15, 0.9, -0.05, 0, 0.35, 'line'),
  f('Daydreaming', 'thought', 0.3, 0.1, 0.45, 0.25, 'half', 0.2, -0.45, 1.25, 0.3, 0.1, 0.35, 'curve', { sparkle: 0.4 }),

  // ── exhaustion ────────────────────────────────────────────────────────
  f('Tired', 'exhaustion', 0.25, -0.15, 0.4, 0.2, 'half', 0, 0.2, 1, -0.1, 0.05, 0.35, 'curve'),
  f('Dead on feet', 'exhaustion', 0.2, -0.3, 0.2, 0.25, 'line', 0, 0.3, 0.9, -0.15, 0.2, 0.4, 'wave', { gloom: 0.5 }),
  f('Sleepy', 'exhaustion', 0.15, -0.1, 0.25, 0.35, 'half', 0, 0.25, 1.15, 0.1, 0.25, 0.35, 'o'),
  f('Yawning', 'exhaustion', 0.3, 0.1, 0.1, 0.5, 'arc-down', 0, 0, 1, 0.1, 1, 0.5, 'gape', { tears: 0.2 }),
  f('Hungover', 'exhaustion', 0.35, -0.25, 0.3, 0.3, 'half', -0.2, 0.2, 0.85, -0.3, 0.1, 0.4, 'wave', { gloom: 0.4, sweat: 0.3 }),
  f('Done with today', 'exhaustion', -0.05, -0.35, 0.15, 0.3, 'line', 0, 0.15, 0.9, -0.2, 0, 0.45, 'line', { gloom: 0.6 }),
  f('Fading out', 'exhaustion', 0.2, -0.2, 0.18, 0.3, 'half', 0.15, 0.3, 1.1, 0, 0.15, 0.3, 'curve'),
  f('Asleep sitting up', 'exhaustion', 0.15, -0.05, 0.05, 0.4, 'arc-down', 0, 0, 1, 0.15, 0.2, 0.3, 'o', { tilt: 0.2 }),

  // ── unhinged ──────────────────────────────────────────────────────────
  f('Manic grin', 'unhinged', -0.3, 0.4, 0.95, 0.1, 'wide', 0, 0, 0.45, 1, 0.55, 0.85, 'grin', { shock: 0.4 }),
  f('Lost it', 'unhinged', 0.2, 0.5, 1, 0, 'swirl', 0, 0, 0.9, 0.7, 0.7, 0.7, 'gape', { sweat: 0.6 }),
  f('Blank horror', 'unhinged', 0.1, 0.2, 0.9, 0, 'dot', 0, 0, 0.25, -0.1, 0.3, 0.35, 'wave', { gloom: 0.8 }),
  f('Soul left the body', 'unhinged', 0.05, -0.1, 0.45, 0.1, 'dot', 0, 0.1, 0.3, -0.05, 0.35, 0.3, 'o', { gloom: 0.6 }),
  f('Sinister calm', 'unhinged', -0.2, 0.2, 0.35, 0.45, 'half', 0, 0, 0.7, 0.6, 0, 0.55, 'cat', { gloom: 0.5 }),
  f('Cackling', 'unhinged', -0.35, 0.45, 0.2, 0.7, 'arc-up', 0, 0, 0.8, 1, 0.85, 0.8, 'gape', { tilt: -0.14 }),
  f('Knocked out', 'unhinged', 0.1, 0.05, 0.3, 0.2, 'x', 0, 0, 0.9, -0.1, 0.35, 0.4, 'wave', { tilt: 0.16 }),
  f('Utterly defeated', 'unhinged', 0.3, -0.35, 0.12, 0.2, 'line', 0, 0.35, 0.9, -0.45, 0.15, 0.4, 'wave', { gloom: 0.9 }),
];

if (FACES.length !== 100) {
  // Better a loud failure at import than a grid that quietly holds ninety-six.
  throw new Error(`expressions: expected 100 faces, have ${FACES.length}`);
}
