/**
 * Forty things a person can be doing.
 *
 * A pose is written as **absolute bone directions in degrees**, not as joint
 * rotations composed down a chain. Ninety is straight down, zero is off to the
 * right, minus ninety is straight up. That choice is entirely about being able
 * to author these by hand: with composed rotations you have to hold the parent's
 * angle in your head to know where a forearm ends up, and forty poses written
 * that way is forty poses full of arithmetic mistakes. Absolute directions read
 * off the page — `[-70, -85]` is an arm up and slightly back, and you can see
 * that it is.
 *
 * `bend` is the one that matters most. It is the curve of the spine, and it is
 * the **line of action**: the single arc that runs from the head through the
 * body to whichever foot is carrying the weight. Get it right and the figure is
 * doing something even before the limbs are attached; leave it at zero and you
 * have a mannequin with its arms in an interesting position, which is not the
 * same thing at all.
 */

export type Tag = 'cricket' | 'football' | 'games' | 'everyday' | 'work' | 'motion';

export type Prop =
  | 'none' | 'bat' | 'ball' | 'football' | 'racket' | 'shuttle' | 'umbrella'
  | 'bag' | 'book' | 'phone' | 'guitar' | 'pan' | 'broom' | 'camera'
  | 'flag' | 'rope' | 'stick' | 'cup';

export interface Pose {
  id: string;
  name: string;
  tag: Tag;
  /** Spine curve. The line of action, and the most important number here. */
  bend: number;
  /** Lean of the whole torso, degrees from upright. */
  lean: number;
  /** [upper, fore] bone directions in degrees. Left arm is the far one. */
  armL: [number, number];
  armR: [number, number];
  /** [thigh, shin] bone directions in degrees. */
  legL: [number, number];
  legR: [number, number];
  /** Head tilt, degrees. */
  head: number;
  /** Pelvis height, 1 standing, lower crouched. */
  stand: number;
  /** Which hand holds the prop: -1 none, 0 left, 1 right, 2 both. */
  grip: -1 | 0 | 1 | 2;
  prop: Prop;
  /** Angle the prop is held at, degrees. */
  propAt?: number;
  /** Off the ground. Adds a gap under the lowest foot. */
  air?: number;
  /** The whole figure rotated, for dives and falls. */
  spin?: number;
}

export const POSES: Pose[] = [
  // ------------------------------------------------------------------ cricket
  { id: 'drive', name: 'The cover drive', tag: 'cricket', bend: 0.3, lean: 16,
    armL: [55, 20], armR: [62, 22], legL: [70, 84], legR: [110, 96], head: 22,
    stand: 0.86, grip: 2, prop: 'bat', propAt: -30 },
  { id: 'pull', name: 'The pull shot', tag: 'cricket', bend: -0.28, lean: -10,
    armL: [-40, -10], armR: [-30, 10], legL: [96, 88], legR: [78, 100], head: -14,
    stand: 0.9, grip: 2, prop: 'bat', propAt: 60 },
  { id: 'sweep', name: 'The sweep', tag: 'cricket', bend: 0.34, lean: 22,
    armL: [36, 4], armR: [46, 10], legL: [46, 96], legR: [128, 146], head: 22,
    stand: 0.62, grip: 2, prop: 'bat', propAt: -6 },
  { id: 'block', name: 'Playing it back', tag: 'cricket', bend: 0.16, lean: 12,
    armL: [72, 60], armR: [76, 62], legL: [88, 90], legR: [96, 92], head: 16,
    stand: 0.82, grip: 2, prop: 'bat', propAt: 74 },
  { id: 'bowl', name: 'The delivery stride', tag: 'cricket', bend: -0.34, lean: -14,
    armL: [-92, -88], armR: [-60, -20], legL: [58, 80], legR: [128, 108], head: -10,
    stand: 0.94, grip: 1, prop: 'ball', propAt: 0 },
  { id: 'followthrough', name: 'The follow-through', tag: 'cricket', bend: 0.36, lean: 24,
    armL: [130, 150], armR: [40, 70], legL: [50, 74], legR: [136, 120], head: 18,
    stand: 0.88, grip: -1, prop: 'none' },
  { id: 'catch', name: 'Taking the catch', tag: 'cricket', bend: -0.2, lean: -6,
    armL: [-72, -78], armR: [-64, -74], legL: [86, 88], legR: [98, 90], head: -22,
    stand: 0.9, grip: 2, prop: 'ball', propAt: 0 },
  { id: 'dive', name: 'The dive at cover', tag: 'cricket', bend: 0.14, lean: 78,
    armL: [10, -6], armR: [20, 4], legL: [162, 176], legR: [172, 186], head: 6,
    stand: 0.95, grip: 0, prop: 'ball', air: 0.3, spin: -14 },
  { id: 'appeal', name: 'How was that', tag: 'cricket', bend: 0.24, lean: 14,
    armL: [-70, -96], armR: [4, -18], legL: [72, 84], legR: [108, 96], head: -18,
    stand: 0.94, grip: -1, prop: 'none' },
  { id: 'six', name: 'The umpire signals six', tag: 'cricket', bend: 0, lean: 0,
    armL: [-88, -90], armR: [-92, -90], legL: [88, 90], legR: [92, 90], head: 0,
    stand: 1, grip: -1, prop: 'none' },
  { id: 'stumps', name: 'Walking off', tag: 'cricket', bend: 0.1, lean: 6,
    armL: [98, 104], armR: [82, 70], legL: [76, 86], legR: [106, 94], head: 10,
    stand: 0.96, grip: 1, prop: 'bat', propAt: 100 },

  // ----------------------------------------------------------------- football
  { id: 'shoot', name: 'The shot', tag: 'football', bend: -0.3, lean: -12,
    armL: [-20, 20], armR: [150, 130], legL: [40, 30], legR: [110, 96], head: -6,
    stand: 0.92, grip: -1, prop: 'football' },
  { id: 'dribble', name: 'Running with it', tag: 'football', bend: 0.22, lean: 14,
    armL: [126, 100], armR: [46, 74], legL: [58, 20], legR: [124, 118], head: 10,
    stand: 0.94, grip: -1, prop: 'football' },
  { id: 'header', name: 'The header', tag: 'football', bend: -0.36, lean: -18,
    armL: [-30, -60], armR: [-150, -120], legL: [100, 130], legR: [80, 120], head: -26,
    stand: 0.98, grip: -1, prop: 'football', air: 0.34 },
  { id: 'keeper', name: 'The keeper goes full length', tag: 'football', bend: -0.1, lean: 72,
    armL: [-10, -26], armR: [-4, -20], legL: [166, 178], legR: [176, 190], head: -16,
    stand: 0.96, grip: -1, prop: 'football', air: 0.42, spin: 10 },
  { id: 'throwin', name: 'The throw-in', tag: 'football', bend: -0.24, lean: -8,
    armL: [-80, -100], armR: [-100, -80], legL: [86, 88], legR: [96, 92], head: -14,
    stand: 1, grip: 2, prop: 'football', propAt: 0 },
  { id: 'celebrate', name: 'The celebration', tag: 'football', bend: -0.3, lean: -6,
    armL: [-56, -70], armR: [-124, -110], legL: [82, 84], legR: [102, 96], head: -20,
    stand: 0.98, grip: -1, prop: 'none' },
  { id: 'tackle', name: 'Going in for it', tag: 'football', bend: 0.3, lean: 44,
    armL: [30, 0], armR: [140, 160], legL: [30, 12], legR: [150, 168], head: 30,
    stand: 0.58, grip: -1, prop: 'football' },

  // -------------------------------------------------------------------- games
  { id: 'smash', name: 'The smash', tag: 'games', bend: -0.34, lean: -14,
    armL: [-40, -20], armR: [-96, -110], legL: [78, 82], legR: [104, 96], head: -24,
    stand: 0.96, grip: 1, prop: 'racket', propAt: -100 },
  { id: 'serve', name: 'The serve', tag: 'games', bend: -0.3, lean: -8,
    armL: [-84, -88], armR: [-120, -140], legL: [84, 86], legR: [98, 92], head: -30,
    stand: 1, grip: 1, prop: 'racket', propAt: -140 },
  { id: 'shuttle', name: 'The drop shot', tag: 'games', bend: 0.16, lean: 10,
    armL: [110, 130], armR: [-30, -50], legL: [70, 84], legR: [110, 96], head: -8,
    stand: 0.9, grip: 1, prop: 'shuttle', propAt: -46 },
  { id: 'raid', name: 'The raid', tag: 'games', bend: 0.34, lean: 26,
    armL: [24, -4], armR: [40, 8], legL: [48, 30], legR: [134, 120], head: 18,
    stand: 0.78, grip: -1, prop: 'none' },
  { id: 'kite', name: 'Flying the kite', tag: 'games', bend: -0.26, lean: -10,
    armL: [-70, -86], armR: [-46, -64], legL: [86, 88], legR: [96, 92], head: -34,
    stand: 1, grip: 0, prop: 'flag', propAt: -80 },
  { id: 'skip', name: 'Skipping', tag: 'games', bend: -0.14, lean: -2,
    armL: [124, 150], armR: [56, 30], legL: [96, 128], legR: [84, 122], head: -6,
    stand: 0.96, grip: 2, prop: 'rope', propAt: 0, air: 0.2 },
  { id: 'marbles', name: 'Down at the marbles', tag: 'games', bend: 0.4, lean: 52,
    armL: [40, 10], armR: [96, 130], legL: [30, 150], legR: [140, 170], head: 40,
    stand: 0.34, grip: 0, prop: 'ball', propAt: 0 },
  { id: 'topspin', name: 'Letting the top go', tag: 'games', bend: 0.28, lean: 22,
    armL: [104, 116], armR: [46, 16], legL: [76, 86], legR: [104, 94], head: 24,
    stand: 0.82, grip: 1, prop: 'rope', propAt: 20 },

  // ----------------------------------------------------------------- everyday
  { id: 'wave', name: 'Waving', tag: 'everyday', bend: -0.1, lean: -3,
    armL: [98, 106], armR: [-64, -84], legL: [88, 90], legR: [94, 90], head: -6,
    stand: 1, grip: -1, prop: 'none' },
  { id: 'point', name: 'Pointing it out', tag: 'everyday', bend: -0.08, lean: 4,
    armL: [96, 100], armR: [10, -6], legL: [88, 90], legR: [94, 90], head: 8,
    stand: 1, grip: -1, prop: 'none' },
  { id: 'folded', name: 'Arms folded', tag: 'everyday', bend: 0.04, lean: 0,
    armL: [70, 4], armR: [110, 176], legL: [88, 90], legR: [94, 90], head: -4,
    stand: 1, grip: -1, prop: 'none' },
  { id: 'hips', name: 'Hands on hips', tag: 'everyday', bend: -0.06, lean: -2,
    armL: [64, 128], armR: [116, 52], legL: [84, 88], legR: [98, 92], head: 2,
    stand: 1, grip: -1, prop: 'none' },
  { id: 'shrug', name: 'The shrug', tag: 'everyday', bend: 0, lean: 0,
    armL: [46, 8], armR: [134, 172], legL: [88, 90], legR: [94, 90], head: 6,
    stand: 0.98, grip: -1, prop: 'none' },
  { id: 'think', name: 'Thinking about it', tag: 'everyday', bend: 0.12, lean: 6,
    armL: [92, 96], armR: [74, 8], legL: [88, 90], legR: [94, 90], head: 14,
    stand: 1, grip: -1, prop: 'none' },
  { id: 'bag', name: 'Carrying the bag', tag: 'everyday', bend: 0.16, lean: 8,
    armL: [86, 92], armR: [100, 104], legL: [80, 86], legR: [102, 94], head: 8,
    stand: 0.98, grip: 1, prop: 'bag', propAt: 92 },
  { id: 'read', name: 'Reading', tag: 'everyday', bend: 0.24, lean: 12,
    armL: [66, 26], armR: [112, 154], legL: [88, 90], legR: [94, 90], head: 22,
    stand: 1, grip: 2, prop: 'book', propAt: 10 },
  { id: 'phone', name: 'On the phone', tag: 'everyday', bend: 0.06, lean: 4,
    armL: [94, 98], armR: [62, -18], legL: [88, 90], legR: [96, 92], head: 12,
    stand: 1, grip: 1, prop: 'phone', propAt: -20 },
  { id: 'brolly', name: 'Under the umbrella', tag: 'everyday', bend: -0.08, lean: -2,
    armL: [96, 100], armR: [-58, -78], legL: [86, 88], legR: [96, 92], head: -4,
    stand: 1, grip: 1, prop: 'umbrella', propAt: -84 },
  { id: 'namaste', name: 'Namaste', tag: 'everyday', bend: 0.06, lean: 2,
    armL: [58, 24], armR: [122, 156], legL: [88, 90], legR: [94, 90], head: 6,
    stand: 1, grip: -1, prop: 'none' },
  { id: 'chai', name: 'Holding the cup', tag: 'everyday', bend: 0.08, lean: 4,
    armL: [92, 96], armR: [74, 20], legL: [88, 90], legR: [94, 90], head: 10,
    stand: 1, grip: 1, prop: 'cup', propAt: 20 },
  { id: 'sit', name: 'Sitting on the floor', tag: 'everyday', bend: 0.18, lean: 10,
    armL: [80, 44], armR: [104, 140], legL: [8, 168], legR: [172, 14], head: 10,
    stand: 0.24, grip: -1, prop: 'none' },
  { id: 'sleep', name: 'Asleep at the desk', tag: 'everyday', bend: 0.3, lean: 40,
    armL: [40, 4], armR: [64, 20], legL: [88, 90], legR: [96, 92], head: 46,
    stand: 0.86, grip: -1, prop: 'none' },
  { id: 'stretch', name: 'The stretch', tag: 'everyday', bend: -0.24, lean: -6,
    armL: [-78, -92], armR: [-104, -88], legL: [88, 90], legR: [94, 90], head: -22,
    stand: 1.02, grip: -1, prop: 'none' },
  { id: 'clap', name: 'Clapping', tag: 'everyday', bend: -0.04, lean: 0,
    armL: [52, 16], armR: [128, 164], legL: [88, 90], legR: [94, 90], head: -6,
    stand: 1, grip: -1, prop: 'none' },

  // --------------------------------------------------------------------- work
  { id: 'cook', name: 'Tossing the pan', tag: 'work', bend: -0.26, lean: -8,
    armL: [100, 120], armR: [-24, -58], legL: [86, 88], legR: [98, 92], head: -26,
    stand: 1, grip: 1, prop: 'pan', propAt: -50 },
  { id: 'sweep2', name: 'Sweeping the yard', tag: 'work', bend: 0.3, lean: 22,
    armL: [66, 40], armR: [104, 128], legL: [76, 86], legR: [106, 94], head: 24,
    stand: 0.86, grip: 2, prop: 'broom', propAt: 46 },
  { id: 'paint', name: 'At the easel', tag: 'work', bend: 0.12, lean: 6,
    armL: [96, 104], armR: [38, -4], legL: [84, 88], legR: [98, 92], head: 4,
    stand: 1, grip: 1, prop: 'stick', propAt: -6 },
  { id: 'photo', name: 'Taking the photograph', tag: 'work', bend: 0.08, lean: 4,
    armL: [58, -14], armR: [122, 194], legL: [86, 88], legR: [96, 92], head: 2,
    stand: 1, grip: 2, prop: 'camera', propAt: 0 },
  { id: 'guitar', name: 'Playing it badly', tag: 'work', bend: 0.14, lean: 8,
    armL: [70, 26], armR: [110, 150], legL: [86, 88], legR: [98, 92], head: 12,
    stand: 1, grip: 2, prop: 'guitar', propAt: 24 },
  { id: 'carry', name: 'Carrying it on the head', tag: 'work', bend: -0.06, lean: 0,
    armL: [-58, -80], armR: [-122, -100], legL: [88, 90], legR: [94, 90], head: 0,
    stand: 1, grip: -1, prop: 'none' },

  // ------------------------------------------------------------------- motion
  { id: 'run', name: 'Running', tag: 'motion', bend: 0.24, lean: 16,
    armL: [130, 96], armR: [42, 78], legL: [52, 14], legR: [132, 124], head: 12,
    stand: 0.96, grip: -1, prop: 'none', air: 0.12 },
  { id: 'sprint', name: 'Out of the blocks', tag: 'motion', bend: 0.36, lean: 40,
    armL: [150, 116], armR: [26, 60], legL: [36, 4], legR: [146, 140], head: 30,
    stand: 0.9, grip: -1, prop: 'none' },
  { id: 'jump', name: 'The jump', tag: 'motion', bend: -0.3, lean: -8,
    armL: [-70, -88], armR: [-110, -92], legL: [104, 138], legR: [80, 128], head: -18,
    stand: 1, grip: -1, prop: 'none', air: 0.4 },
  { id: 'hurdle', name: 'Over the hurdle', tag: 'motion', bend: 0.2, lean: 26,
    armL: [24, -8], armR: [140, 160], legL: [10, 30], legR: [150, 116], head: 22,
    stand: 0.98, grip: -1, prop: 'none', air: 0.3 },
  { id: 'cycle', name: 'On the cycle', tag: 'motion', bend: 0.24, lean: 30,
    armL: [40, 20], armR: [52, 28], legL: [50, 120], legR: [130, 60], head: 22,
    stand: 0.62, grip: -1, prop: 'none' },
  { id: 'dance', name: 'Dancing', tag: 'motion', bend: -0.3, lean: -12,
    armL: [-40, -84], armR: [-140, -100], legL: [70, 66], legR: [112, 118], head: -14,
    stand: 0.94, grip: -1, prop: 'none' },
  { id: 'bhangra', name: 'Shoulders up', tag: 'motion', bend: -0.18, lean: -4,
    armL: [-66, -46], armR: [-114, -134], legL: [76, 82], legR: [104, 96], head: -10,
    stand: 0.96, grip: -1, prop: 'none' },
  { id: 'fall', name: 'Going over', tag: 'motion', bend: 0.2, lean: 62,
    armL: [-20, -50], armR: [30, 70], legL: [150, 120], legR: [166, 140], head: 40,
    stand: 0.9, grip: -1, prop: 'none', air: 0.24, spin: 18 },
];

export const POSE_BY_ID = Object.fromEntries(POSES.map((p) => [p.id, p])) as Record<string, Pose>;

export const TAGS: { id: Tag; name: string }[] = [
  { id: 'cricket', name: 'Cricket' },
  { id: 'football', name: 'Football' },
  { id: 'games', name: 'Games' },
  { id: 'everyday', name: 'Everyday' },
  { id: 'work', name: 'Work' },
  { id: 'motion', name: 'Moving' },
];
