/**
 * Seventy afternoons.
 *
 * Bone directions are absolute degrees, the same convention the crayon study
 * uses and for the same authoring reason: ninety is straight down, zero is off
 * to the right, minus ninety is straight up, and a pose can be read off the
 * page without composing anything down a chain. `bend` is the line of action.
 *
 * What is different here is what the poses are *for*. A watercolour of this
 * kind has no face to speak of — at the size these are painted the head is a
 * single loaded dab — so everything the picture says has to be said by the
 * shape of the body and by where the weight is. That rules out most of what
 * would be obvious: no gestures towards the viewer, nothing mid-explanation,
 * nothing that needs a second person to make sense. What is left is a person
 * *absorbed* — reading, listening, stretching, waiting, watching something out
 * of frame — and it turns out that reads instantly at any size, because the
 * whole body does it at once.
 *
 * The other thing carried in a pose is `flow`: how much cloth the picture has
 * and which way it is going. In the references it is the largest shape on the
 * paper by a distance — the dancer is nine tenths skirt — and it is where the
 * warm pigment lives. A pose with no flow is a pose with nowhere for the second
 * colour to be.
 */

export type Tag = 'reading' | 'music' | 'outdoors' | 'home' | 'quiet' | 'movement';

export const TAGS: { id: Tag; name: string }[] = [
  { id: 'reading', name: 'Reading' },
  { id: 'music', name: 'Music' },
  { id: 'outdoors', name: 'Outdoors' },
  { id: 'home', name: 'At home' },
  { id: 'quiet', name: 'Quiet' },
  { id: 'movement', name: 'Moving' },
];

export type Hair = 'up' | 'loose' | 'bob' | 'braid' | 'bun' | 'crop' | 'wind';
export type Dress = 'gown' | 'skirt' | 'sundress' | 'wrap' | 'trousers' | 'coat' | 'sari' | 'slip';
export type Prop =
  | 'none' | 'book' | 'cup' | 'guitar' | 'umbrella' | 'hat' | 'cat' | 'camera' | 'flowers'
  | 'phone' | 'basket' | 'fan' | 'letter' | 'brush' | 'glass' | 'scarf' | 'headphones';
/** A single horizontal wash under the figure. Not furniture — a suggestion. */
export type Perch = 'none' | 'floor' | 'ledge' | 'seat';

export interface Pose {
  id: string;
  name: string;
  tag: Tag;
  /** Curve of the spine. The line of action, and the number that matters most. */
  bend: number;
  /** Lean of the torso, degrees from upright. */
  lean: number;
  /** [upper, fore] bone directions. Left is the far arm. */
  armL: [number, number];
  armR: [number, number];
  /** [thigh, shin] bone directions. */
  legL: [number, number];
  legR: [number, number];
  head: number;
  /** Pelvis height: 1 standing, 0.5 perched, 0.15 on the floor. */
  stand: number;
  /** How much cloth, 0 none, 1 the picture is mostly skirt. */
  flow: number;
  /** Which way the cloth goes, degrees. */
  flowAt: number;
  hair: Hair;
  dress: Dress;
  prop?: Prop;
  /** Which hand: 0 left, 1 right, 2 both. */
  grip?: 0 | 1 | 2;
  perch?: Perch;
  /** The whole figure rotated — for anything lying down. */
  spin?: number;
  /** Lifted off the ground. */
  air?: number;
}

export const POSES: Pose[] = [
  // ------------------------------------------------------------------ reading
  { id: 'curled', name: 'Curled up with it', tag: 'reading', bend: 0.34, lean: 26,
    armL: [58, 26], armR: [62, 30], legL: [8, 74], legR: [16, 82], head: 30, stand: 0.24,
    flow: 0.5, flowAt: 150, hair: 'bun', dress: 'wrap', prop: 'book', grip: 2, perch: 'floor' },
  { id: 'kneebook', name: 'The book on her knees', tag: 'reading', bend: 0.22, lean: 18,
    armL: [66, 34], armR: [70, 30], legL: [0, 66], legR: [-6, 72], head: 26, stand: 0.3,
    flow: 0.44, flowAt: 160, hair: 'loose', dress: 'skirt', prop: 'book', grip: 2, perch: 'floor' },
  { id: 'proneread', name: 'On her front, feet up', tag: 'reading', bend: -0.3, lean: 74,
    armL: [40, -22], armR: [46, -18], legL: [-4, -64], legR: [2, -58], head: -34, stand: 0.12,
    flow: 0.3, flowAt: 12, hair: 'braid', dress: 'trousers', prop: 'book', grip: 2,
    perch: 'floor' },
  { id: 'sillread', name: 'Reading in the window', tag: 'reading', bend: 0.26, lean: 22,
    armL: [62, 22], armR: [58, 34], legL: [4, 78], legR: [26, 92], head: 28, stand: 0.5,
    flow: 0.52, flowAt: 140, hair: 'up', dress: 'sundress', prop: 'book', grip: 2,
    perch: 'ledge' },
  { id: 'holdup', name: 'Holding it to the light', tag: 'reading', bend: -0.16, lean: -6,
    armL: [-62, -46], armR: [-56, -40], legL: [86, 92], legR: [96, 88], head: -30, stand: 0.96,
    flow: 0.6, flowAt: 100, hair: 'loose', dress: 'gown', prop: 'book', grip: 2 },
  { id: 'elbowprop', name: 'Propped on one elbow', tag: 'reading', bend: 0.4, lean: 62,
    armL: [104, 132], armR: [50, 4], legL: [-2, 22], legR: [6, 30], head: 20, stand: 0.16,
    flow: 0.46, flowAt: 18, hair: 'loose', dress: 'slip', prop: 'book', grip: 1,
    perch: 'floor' },
  { id: 'pageturn', name: 'Turning the page', tag: 'reading', bend: 0.2, lean: 14,
    armL: [72, 40], armR: [56, 6], legL: [88, 90], legR: [92, 94], head: 24, stand: 0.94,
    flow: 0.56, flowAt: 118, hair: 'bob', dress: 'skirt', prop: 'book', grip: 2 },
  { id: 'bookchest', name: 'The book against her', tag: 'reading', bend: -0.12, lean: -4,
    armL: [78, 130], armR: [82, 126], legL: [88, 90], legR: [94, 92], head: -18, stand: 0.95,
    flow: 0.5, flowAt: 108, hair: 'up', dress: 'coat', prop: 'book', grip: 2 },
  { id: 'stairsread', name: 'On the stairs', tag: 'reading', bend: 0.3, lean: 24,
    armL: [64, 28], armR: [60, 36], legL: [24, 96], legR: [40, 104], head: 28, stand: 0.42,
    flow: 0.42, flowAt: 148, hair: 'braid', dress: 'trousers', prop: 'book', grip: 2,
    perch: 'seat' },
  { id: 'lampread', name: 'Late, still reading', tag: 'reading', bend: 0.36, lean: 30,
    armL: [70, 44], armR: [66, 40], legL: [10, 60], legR: [4, 68], head: 32, stand: 0.26,
    flow: 0.48, flowAt: 156, hair: 'bun', dress: 'wrap', prop: 'book', grip: 2, perch: 'floor' },

  // -------------------------------------------------------------------- music
  { id: 'guitar', name: 'Cross-legged with a guitar', tag: 'music', bend: 0.2, lean: 16,
    armL: [46, 20], armR: [72, 6], legL: [12, 168], legR: [-8, 14], head: 22, stand: 0.2,
    flow: 0.38, flowAt: 164, hair: 'loose', dress: 'trousers', prop: 'guitar', grip: 2,
    perch: 'floor' },
  { id: 'headphones', name: 'Headphones, eyes shut', tag: 'music', bend: -0.26, lean: -12,
    armL: [96, 118], armR: [100, 122], legL: [84, 88], legR: [92, 96], head: -36, stand: 0.92,
    flow: 0.54, flowAt: 96, hair: 'crop', dress: 'coat', prop: 'headphones' },
  { id: 'swaying', name: 'Swaying to it', tag: 'music', bend: 0.44, lean: -22,
    armL: [-40, -70], armR: [-24, -58], legL: [82, 84], legR: [104, 96], head: -26, stand: 0.94,
    flow: 0.82, flowAt: 66, hair: 'wind', dress: 'gown' },
  { id: 'floorsing', name: 'Singing to the ceiling', tag: 'music', bend: -0.4, lean: -20,
    armL: [130, 154], armR: [-52, -74], legL: [4, 58], legR: [12, 66], head: -46, stand: 0.22,
    flow: 0.42, flowAt: 172, hair: 'loose', dress: 'slip', perch: 'floor' },
  { id: 'record', name: 'Choosing a record', tag: 'music', bend: 0.34, lean: 32,
    armL: [58, 44], armR: [66, 52], legL: [58, 106], legR: [78, 96], head: 30, stand: 0.56,
    flow: 0.5, flowAt: 140, hair: 'bob', dress: 'sundress' },
  { id: 'hum', name: 'Humming, cup in hand', tag: 'music', bend: -0.2, lean: -8,
    armL: [72, 96], armR: [78, 120], legL: [86, 90], legR: [96, 92], head: -22, stand: 0.95,
    flow: 0.6, flowAt: 104, hair: 'up', dress: 'wrap', prop: 'cup', grip: 1 },
  { id: 'sitstrum', name: 'Strumming on the step', tag: 'music', bend: 0.24, lean: 20,
    armL: [40, 14], armR: [70, 2], legL: [40, 100], legR: [52, 92], head: 24, stand: 0.44,
    flow: 0.4, flowAt: 150, hair: 'braid', dress: 'skirt', prop: 'guitar', grip: 2,
    perch: 'seat' },
  { id: 'closed', name: 'Listening with her eyes closed', tag: 'music', bend: -0.16, lean: -6,
    armL: [86, 108], armR: [90, 112], legL: [88, 92], legR: [90, 94], head: -30, stand: 0.62,
    flow: 0.58, flowAt: 118, hair: 'bun', dress: 'gown', perch: 'seat' },

  // ----------------------------------------------------------------- outdoors
  { id: 'rain', name: 'Out in the rain', tag: 'outdoors', bend: 0.18, lean: 10,
    armL: [-56, -70], armR: [84, 96], legL: [74, 92], legR: [104, 88], head: 12, stand: 0.96,
    flow: 0.66, flowAt: 112, hair: 'wind', dress: 'coat', prop: 'umbrella', grip: 0 },
  { id: 'grass', name: 'Sitting in the grass', tag: 'outdoors', bend: 0.26, lean: 22,
    armL: [116, 150], armR: [56, 24], legL: [-2, 26], legR: [4, 34], head: 18, stand: 0.16,
    flow: 0.54, flowAt: 22, hair: 'loose', dress: 'sundress', perch: 'floor' },
  { id: 'lieback', name: 'Flat on her back in the sun', tag: 'outdoors', bend: -0.1, lean: 88,
    armL: [-10, -34], armR: [186, 210], legL: [-4, -2], legR: [4, 8], head: -86, stand: 0.08,
    flow: 0.4, flowAt: 4, hair: 'loose', dress: 'sundress', perch: 'floor', spin: 4 },
  { id: 'cycle', name: 'Freewheeling', tag: 'outdoors', bend: -0.24, lean: 24,
    armL: [34, 16], armR: [40, 20], legL: [52, 108], legR: [116, 62], head: -14, stand: 0.66,
    flow: 0.62, flowAt: 132, hair: 'wind', dress: 'skirt', air: 0.1 },
  { id: 'pick', name: 'Picking something', tag: 'outdoors', bend: 0.5, lean: 52,
    armL: [72, 82], armR: [64, 74], legL: [78, 96], legR: [96, 84], head: 44, stand: 0.72,
    flow: 0.7, flowAt: 128, hair: 'braid', dress: 'sundress', prop: 'flowers', grip: 1 },
  { id: 'birds', name: 'Feeding the birds', tag: 'outdoors', bend: 0.16, lean: 8,
    armL: [22, -4], armR: [86, 100], legL: [86, 90], legR: [98, 94], head: 16, stand: 0.94,
    flow: 0.6, flowAt: 110, hair: 'up', dress: 'coat', prop: 'basket', grip: 1 },
  { id: 'pockets', name: 'Hands in her pockets', tag: 'outdoors', bend: -0.14, lean: -6,
    armL: [78, 104], armR: [82, 108], legL: [80, 90], legR: [100, 92], head: -16, stand: 0.97,
    flow: 0.48, flowAt: 100, hair: 'crop', dress: 'coat' },
  { id: 'cliff', name: 'Wind off the sea', tag: 'outdoors', bend: -0.34, lean: -16,
    armL: [-30, -60], armR: [70, 92], legL: [78, 88], legR: [102, 94], head: -30, stand: 0.96,
    flow: 0.9, flowAt: 34, hair: 'wind', dress: 'gown', prop: 'scarf', grip: 0 },
  { id: 'wall', name: 'Legs over the wall', tag: 'outdoors', bend: 0.12, lean: 8,
    armL: [96, 118], armR: [92, 114], legL: [66, 84], legR: [78, 72], head: 14, stand: 0.5,
    flow: 0.52, flowAt: 128, hair: 'bob', dress: 'skirt', perch: 'ledge', air: 0.22 },
  { id: 'paddle', name: 'Ankle-deep', tag: 'outdoors', bend: 0.3, lean: 24,
    armL: [46, 68], armR: [58, 78], legL: [84, 92], legR: [96, 88], head: 34, stand: 0.94,
    flow: 0.72, flowAt: 122, hair: 'loose', dress: 'sundress', perch: 'floor' },
  { id: 'photo', name: 'Taking the picture', tag: 'outdoors', bend: -0.18, lean: -8,
    armL: [24, -20], armR: [28, -16], legL: [82, 90], legR: [102, 94], head: -20, stand: 0.96,
    flow: 0.44, flowAt: 98, hair: 'up', dress: 'trousers', prop: 'camera', grip: 2 },
  { id: 'swing', name: 'On the swing', tag: 'outdoors', bend: -0.36, lean: -26,
    armL: [-44, -66], armR: [-40, -62], legL: [24, -14], legR: [32, -6], head: -38, stand: 0.5,
    flow: 0.78, flowAt: 40, hair: 'wind', dress: 'sundress', air: 0.5 },

  // ------------------------------------------------------------------ at home
  { id: 'window', name: 'Coffee at the window', tag: 'home', bend: -0.2, lean: -8,
    armL: [88, 116], armR: [70, 96], legL: [84, 90], legR: [98, 92], head: -18, stand: 0.95,
    flow: 0.58, flowAt: 104, hair: 'bun', dress: 'wrap', prop: 'cup', grip: 1 },
  { id: 'cat', name: 'The cat has decided', tag: 'home', bend: 0.28, lean: 22,
    armL: [70, 46], armR: [66, 42], legL: [-4, 62], legR: [2, 68], head: 26, stand: 0.26,
    flow: 0.5, flowAt: 158, hair: 'loose', dress: 'wrap', prop: 'cat', grip: 2, perch: 'floor' },
  { id: 'water', name: 'Watering the plants', tag: 'home', bend: 0.2, lean: 14,
    armL: [30, 46], armR: [84, 100], legL: [84, 90], legR: [100, 94], head: 22, stand: 0.94,
    flow: 0.56, flowAt: 112, hair: 'up', dress: 'sundress', prop: 'basket', grip: 0 },
  { id: 'stretchup', name: 'The first stretch of the day', tag: 'home', bend: -0.42, lean: -18,
    armL: [-78, -88], armR: [-70, -84], legL: [86, 90], legR: [96, 92], head: -40, stand: 0.99,
    flow: 0.5, flowAt: 96, hair: 'loose', dress: 'slip' },
  { id: 'tieup', name: 'Tying her hair up', tag: 'home', bend: -0.22, lean: -10,
    armL: [-58, -108], armR: [-52, -114], legL: [86, 90], legR: [98, 92], head: -14, stand: 0.96,
    flow: 0.52, flowAt: 100, hair: 'up', dress: 'slip' },
  { id: 'sofa', name: 'Poured into the sofa', tag: 'home', bend: 0.16, lean: 54,
    armL: [128, 156], armR: [30, 6], legL: [40, 8], legR: [48, 16], head: 34, stand: 0.28,
    flow: 0.56, flowAt: 26, hair: 'loose', dress: 'wrap', perch: 'seat' },
  { id: 'kitchen', name: 'On the kitchen floor', tag: 'home', bend: 0.3, lean: 26,
    armL: [110, 146], armR: [64, 34], legL: [2, 40], legR: [10, 48], head: 24, stand: 0.16,
    flow: 0.46, flowAt: 18, hair: 'bun', dress: 'trousers', prop: 'cup', grip: 1,
    perch: 'floor' },
  { id: 'doorframe', name: 'Leaning on the doorframe', tag: 'home', bend: 0.36, lean: -16,
    armL: [-40, -76], armR: [86, 104], legL: [84, 92], legR: [110, 78], head: -18, stand: 0.96,
    flow: 0.54, flowAt: 106, hair: 'bob', dress: 'skirt' },
  { id: 'stairsit', name: 'Halfway down the stairs', tag: 'home', bend: 0.24, lean: 18,
    armL: [102, 128], armR: [58, 30], legL: [30, 98], legR: [46, 106], head: 20, stand: 0.4,
    flow: 0.44, flowAt: 146, hair: 'braid', dress: 'trousers', perch: 'seat' },
  { id: 'phone', name: 'On the phone by the window', tag: 'home', bend: -0.16, lean: -6,
    armL: [86, 112], armR: [-24, -70], legL: [82, 90], legR: [104, 94], head: -12, stand: 0.95,
    flow: 0.5, flowAt: 102, hair: 'loose', dress: 'wrap', prop: 'phone', grip: 1 },
  { id: 'easel', name: 'At the easel', tag: 'home', bend: 0.18, lean: 12,
    armL: [78, 100], armR: [16, -26], legL: [82, 92], legR: [104, 90], head: 14, stand: 0.95,
    flow: 0.52, flowAt: 110, hair: 'up', dress: 'coat', prop: 'brush', grip: 1 },
  { id: 'letter', name: 'A letter, standing up', tag: 'home', bend: 0.22, lean: 12,
    armL: [64, 40], armR: [68, 44], legL: [86, 90], legR: [96, 92], head: 26, stand: 0.94,
    flow: 0.54, flowAt: 106, hair: 'bun', dress: 'gown', prop: 'letter', grip: 2 },

  // -------------------------------------------------------------------- quiet
  { id: 'knees', name: 'Head on her knees', tag: 'quiet', bend: 0.5, lean: 40,
    armL: [16, 62], armR: [22, 68], legL: [-8, 66], legR: [-2, 72], head: 46, stand: 0.24,
    flow: 0.4, flowAt: 166, hair: 'loose', dress: 'wrap', perch: 'floor' },
  { id: 'hug', name: 'Arms round her shins', tag: 'quiet', bend: 0.32, lean: 28,
    armL: [30, 78], armR: [36, 84], legL: [-6, 60], legR: [0, 66], head: 30, stand: 0.24,
    flow: 0.42, flowAt: 164, hair: 'bun', dress: 'trousers', perch: 'floor' },
  { id: 'chinhand', name: 'Chin on her hand', tag: 'quiet', bend: 0.26, lean: 18,
    armL: [92, 116], armR: [52, -12], legL: [80, 92], legR: [92, 96], head: 20, stand: 0.58,
    flow: 0.5, flowAt: 132, hair: 'bob', dress: 'skirt', perch: 'seat' },
  { id: 'lookup', name: 'Flat out, looking up', tag: 'quiet', bend: 0.06, lean: 86,
    armL: [176, 200], armR: [-6, -30], legL: [-2, 4], legR: [6, 12], head: -84, stand: 0.08,
    flow: 0.38, flowAt: 8, hair: 'loose', dress: 'slip', perch: 'floor', spin: -3 },
  { id: 'sidelegs', name: 'Legs folded to one side', tag: 'quiet', bend: 0.22, lean: 16,
    armL: [100, 124], armR: [70, 52], legL: [26, 4], legR: [34, 12], head: 20, stand: 0.18,
    flow: 0.62, flowAt: 12, hair: 'up', dress: 'gown', perch: 'floor' },
  { id: 'chinlift', name: 'Chin lifted, watching', tag: 'quiet', bend: -0.28, lean: -12,
    armL: [92, 116], armR: [88, 112], legL: [86, 90], legR: [96, 92], head: -34, stand: 0.96,
    flow: 0.56, flowAt: 100, hair: 'loose', dress: 'gown' },
  { id: 'asleep', name: 'Asleep where she sat', tag: 'quiet', bend: 0.44, lean: 46,
    armL: [124, 148], armR: [40, 66], legL: [16, 46], legR: [22, 54], head: 52, stand: 0.18,
    flow: 0.48, flowAt: 20, hair: 'loose', dress: 'wrap', perch: 'floor' },
  { id: 'tabletop', name: 'Head down on the table', tag: 'quiet', bend: 0.36, lean: 58,
    armL: [22, -6], armR: [28, 0], legL: [78, 94], legR: [88, 98], head: 60, stand: 0.56,
    flow: 0.44, flowAt: 140, hair: 'braid', dress: 'coat', perch: 'seat' },
  { id: 'kneel', name: 'Kneeling, hands down', tag: 'quiet', bend: 0.2, lean: 14,
    armL: [82, 96], armR: [86, 100], legL: [4, 92], legR: [10, 96], head: 22, stand: 0.34,
    flow: 0.58, flowAt: 152, hair: 'bun', dress: 'gown', perch: 'floor' },
  { id: 'cushion', name: 'Holding a cushion', tag: 'quiet', bend: 0.28, lean: 20,
    armL: [70, 116], armR: [76, 122], legL: [10, 56], legR: [16, 62], head: 24, stand: 0.24,
    flow: 0.46, flowAt: 160, hair: 'loose', dress: 'wrap', perch: 'floor' },

  // ----------------------------------------------------------------- movement
  { id: 'reachup', name: 'Reaching for the top shelf', tag: 'movement', bend: -0.34, lean: -14,
    armL: [-84, -88], armR: [64, 40], legL: [86, 88], legR: [98, 82], head: -36, stand: 1.0,
    flow: 0.5, flowAt: 98, hair: 'up', dress: 'skirt' },
  { id: 'fold', name: 'Folded all the way over', tag: 'movement', bend: 0.6, lean: 76,
    armL: [96, 104], armR: [100, 108], legL: [86, 90], legR: [92, 92], head: 76, stand: 0.9,
    flow: 0.62, flowAt: 130, hair: 'loose', dress: 'trousers' },
  { id: 'spin', name: 'Turning on one foot', tag: 'movement', bend: -0.3, lean: -18,
    armL: [-46, -20], armR: [-34, -8], legL: [88, 92], legR: [56, 24], head: -24, stand: 0.98,
    flow: 0.94, flowAt: 58, hair: 'wind', dress: 'gown' },
  { id: 'jump', name: 'Both feet off the ground', tag: 'movement', bend: -0.44, lean: -12,
    armL: [-70, -86], armR: [-62, -80], legL: [70, 40], legR: [104, 76], head: -34, stand: 0.94,
    flow: 0.74, flowAt: 76, hair: 'wind', dress: 'sundress', air: 0.34 },
  { id: 'twirl', name: 'Skirt out, arms wide', tag: 'movement', bend: 0.24, lean: -10,
    armL: [-16, -6], armR: [-6, 4], legL: [84, 92], legR: [66, 46], head: -20, stand: 0.96,
    flow: 1.0, flowAt: 50, hair: 'wind', dress: 'gown' },
  { id: 'taichi', name: 'Slowly, on one leg', tag: 'movement', bend: 0.18, lean: -6,
    armL: [10, -8], armR: [46, 22], legL: [88, 92], legR: [46, 108], head: -10, stand: 0.94,
    flow: 0.58, flowAt: 104, hair: 'bun', dress: 'wrap' },
  { id: 'hairflip', name: 'Hair thrown back', tag: 'movement', bend: -0.46, lean: -24,
    armL: [-52, -96], armR: [-46, -90], legL: [82, 88], legR: [104, 94], head: -50, stand: 0.96,
    flow: 0.66, flowAt: 84, hair: 'wind', dress: 'slip' },
  { id: 'sitdown', name: 'Halfway to sitting', tag: 'movement', bend: 0.3, lean: 26,
    armL: [58, 72], armR: [64, 78], legL: [58, 104], legR: [70, 96], head: 26, stand: 0.6,
    flow: 0.56, flowAt: 128, hair: 'bob', dress: 'skirt' },
  { id: 'laugh', name: 'Leaning back laughing', tag: 'movement', bend: -0.52, lean: -28,
    armL: [110, 140], armR: [-30, -12], legL: [80, 88], legR: [104, 96], head: -48, stand: 0.94,
    flow: 0.6, flowAt: 88, hair: 'loose', dress: 'sundress' },
  { id: 'skip', name: 'Skipping a step', tag: 'movement', bend: -0.28, lean: -8,
    armL: [-34, -58], armR: [56, 84], legL: [52, 22], legR: [116, 96], head: -22, stand: 0.96,
    flow: 0.68, flowAt: 92, hair: 'wind', dress: 'skirt', air: 0.14 },
  { id: 'sweepdance', name: 'One long step across', tag: 'movement', bend: 0.36, lean: 20,
    armL: [-6, -34], armR: [40, 64], legL: [56, 78], legR: [124, 104], head: 14, stand: 0.86,
    flow: 0.86, flowAt: 128, hair: 'wind', dress: 'gown' },
  { id: 'backarch', name: 'Arched right back', tag: 'movement', bend: -0.62, lean: -34,
    armL: [-104, -132], armR: [-96, -126], legL: [80, 86], legR: [102, 96], head: -60,
    stand: 0.92, flow: 0.72, flowAt: 78, hair: 'wind', dress: 'gown' },
];

export const POSE_BY_ID = Object.fromEntries(POSES.map((p) => [p.id, p])) as Record<string, Pose>;
