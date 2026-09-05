import { CLOTHS, SKIN, WRAPS, type Tone } from './palette';
import type { Face, Hair } from './body';
import type { PropId } from './props';

/**
 * Who is who.
 *
 * The colour of the skin, the thing in the hand and the animal at the foot are
 * not decoration in this tradition: they are how the figure is named. Krishna
 * is the colour of a rain cloud and holds a flute; put a discus in that hand
 * and it is Vishnu, whose incarnation he is, and the picture now means
 * something else. So everything below is the received iconography rather than
 * anything invented, and where a detail varies by region I have taken the one
 * that is most widely painted.
 *
 * These are living figures for a great many people. They are drawn here with
 * the attributes they are given in the texts and in temple bronzes, and the
 * notes are things that are actually said about them.
 */

export interface God {
  id: string;
  name: string;
  script: string;
  /** How the figure is usually named in one line. */
  epithet: string;
  /** Something true, for the caption. */
  note: string;
  skin: Tone;
  face: Face;
  hair: Hair[];
  /** Traditional cloth colour, where there is one. */
  cloth?: Tone;
  wrap?: Tone;
  garment: 'dhoti' | 'sari' | 'short' | 'skin';
  /** Pairs beyond the first. Durga has four, so eight arms in all. */
  extraPairs: number;
  /** What the principal hands hold, in order of preference. */
  holds: PropId[];
  /** What the extra hands hold, cycled. */
  spare: PropId[];
  /** Pose ids that suit this god. */
  poses: string[];
  female: boolean;
  thirdEye: boolean;
  crescent: boolean;
  feather: boolean;
  garland: boolean;
  thread: boolean;
  ornament: number;
  halo: number;
  /** The animal that carries them. Named in the caption. */
  vahana: string;
}

const gold = { light: '#d8952f', dark: '#8e4d17' };
const saffron = { light: '#c96a34', dark: '#7e3418' };
const crimson = { light: '#b8342c', dark: '#6d1c1c' };
const white = { light: '#e8dfc6', dark: '#9d947c' };
const teal = { light: '#3f7f7a', dark: '#1f4547' };

export const GODS: God[] = [
  {
    id: 'krishna',
    name: 'Krishna',
    script: 'कृष्ण',
    epithet: 'the dark one, the cowherd, the charioteer',
    note: 'The colour of a rain cloud, and the only god whose weapon is a flute. The feather is a peacock’s, and he wears it because the peacocks danced when he played.',
    skin: SKIN.rainCloud, face: 'human', hair: ['bun', 'high', 'crown'],
    cloth: gold, garment: 'dhoti', extraPairs: 0,
    holds: ['flute', 'none'], spare: [],
    poses: ['tribhanga', 'venu', 'abhanga', 'nrtya', 'abhaya', 'varada', 'samabhanga', 'katya', 'nirikshana', 'strideBack', 'padmasana', 'stride'],
    female: false, thirdEye: false, crescent: false, feather: true, garland: true, thread: true,
    ornament: 0.9, halo: 0.9, vahana: 'no mount — he goes on foot, or drives yours',
  },
  {
    id: 'rama',
    name: 'Rama',
    script: 'राम',
    epithet: 'the seventh descent, the king who kept his word',
    note: 'Always with the bow Kodanda, and always in the posture of somebody who would rather not use it. The exile of fourteen years was accepted in an afternoon.',
    skin: SKIN.darkBlue, face: 'human', hair: ['crown', 'bun'],
    cloth: gold, wrap: WRAPS[2], garment: 'dhoti', extraPairs: 0,
    holds: ['bow', 'none'], spare: [],
    poses: ['samabhanga', 'dhanurdhara', 'alidha', 'abhaya', 'abhanga', 'stride', 'varada', 'sula', 'thrust', 'vyakhyana'],
    female: false, thirdEye: false, crescent: false, feather: false, garland: true, thread: true,
    ornament: 0.85, halo: 0.85, vahana: 'the chariot of Ayodhya',
  },
  {
    id: 'hanuman',
    name: 'Hanuman',
    script: 'हनुमान',
    epithet: 'son of the wind, and the best of monkeys',
    note: 'Sent for one herb, he could not tell which it was, so he brought the mountain. He is the patron of wrestlers, and of anyone who has been asked to do the impossible before Tuesday.',
    skin: SKIN.vermilion, face: 'monkey', hair: ['high', 'crown'],
    cloth: saffron, garment: 'short', extraPairs: 0,
    holds: ['mace', 'mountain'], spare: [],
    poses: ['gada', 'gadaUp', 'leap', 'flight', 'janu', 'anjali', 'hrdaya', 'stride', 'jaya', 'thrust', 'samabhanga', 'abhanga'],
    female: false, thirdEye: false, crescent: false, feather: false, garland: true, thread: true,
    ornament: 0.6, halo: 0.7, vahana: 'his own two feet, and the wind',
  },
  {
    id: 'durga',
    name: 'Durga',
    script: 'दुर्गा',
    epithet: 'the unassailable, who was made from the anger of every god',
    note: 'Each god gave her a weapon, which is why she has so many arms to hold them in. She was made for one job and she did it in nine nights.',
    skin: SKIN.gold, face: 'human', hair: ['crown', 'flow'],
    cloth: crimson, garment: 'sari', extraPairs: 3,
    holds: ['trident', 'sword'], spare: ['chakra', 'conch', 'bow', 'mace', 'lotus', 'shield'],
    poses: ['samabhanga', 'sula', 'khadga', 'alidha', 'abhanga', 'thrust', 'stride', 'abhaya', 'vyakhyana', 'nrtya'],
    female: true, thirdEye: true, crescent: false, feather: false, garland: true, thread: false,
    ornament: 1, halo: 1, vahana: 'a lion',
  },
  {
    id: 'shiva',
    name: 'Shiva',
    script: 'शिव',
    epithet: 'the auspicious one, the ascetic, the dancer',
    note: 'The Ganges falls out of the sky and he catches it in his hair. The ash is from the burning ground, the crescent is the moon, and the third eye is closed almost always.',
    skin: SKIN.ash, face: 'human', hair: ['matted', 'high'],
    cloth: { light: '#c99a4e', dark: '#7a5520' }, garment: 'skin', extraPairs: 1,
    holds: ['trident', 'damaru'], spare: ['none', 'lotus'],
    poses: ['padmasana', 'tandava', 'sula', 'samabhanga', 'abhaya', 'nrtya', 'varada', 'abhanga', 'vyakhyana'],
    female: false, thirdEye: true, crescent: true, feather: false, garland: false, thread: true,
    ornament: 0.4, halo: 0.8, vahana: 'Nandi, the bull',
  },
  {
    id: 'parvati',
    name: 'Parvati',
    script: 'पार्वती',
    epithet: 'daughter of the mountain',
    note: 'She wanted the ascetic and got him by out-ascetic-ing him. Durga and Kali are both her, in the moods the situation called for.',
    skin: SKIN.gold, face: 'human', hair: ['flow', 'crown', 'bun'],
    cloth: { light: '#c9a227', dark: '#7c5c11' }, garment: 'sari', extraPairs: 0,
    holds: ['lotus', 'none'], spare: [],
    poses: ['tribhanga', 'abhanga', 'varada', 'abhaya', 'padmasana', 'samabhanga', 'katya', 'nirikshana', 'anjali'],
    female: true, thirdEye: false, crescent: false, feather: false, garland: true, thread: false,
    ornament: 1, halo: 0.85, vahana: 'a lion, when she needs one',
  },
  {
    id: 'ganesha',
    name: 'Ganesha',
    script: 'गणेश',
    epithet: 'lord of beginnings, remover of obstacles',
    note: 'Nothing starts without him, which is why he is at the front of every ceremony and the top of every letter. He broke off his own tusk to finish writing the Mahabharata.',
    skin: SKIN.vermilion, face: 'elephant', hair: ['crown'],
    cloth: { light: '#d8952f', dark: '#8e4d17' }, garment: 'dhoti', extraPairs: 1,
    holds: ['goad', 'modak'], spare: ['noose', 'axe'],
    poses: ['padmasana', 'samabhanga', 'abhaya', 'varada', 'abhanga', 'nrtya', 'vyakhyana'],
    female: false, thirdEye: false, crescent: false, feather: false, garland: true, thread: true,
    ornament: 0.9, halo: 0.9, vahana: 'a mouse',
  },
  {
    id: 'kali',
    name: 'Kali',
    script: 'काली',
    epithet: 'she who is time, and takes everything back',
    note: 'She danced until the world shook, and stopped only when she found she was standing on her husband. Terrifying, and in Bengal addressed as Ma.',
    skin: SKIN.night, face: 'human', hair: ['matted', 'flow'],
    cloth: crimson, garment: 'short', extraPairs: 1,
    holds: ['sword', 'skull'], spare: ['trident', 'none'],
    poses: ['tandava', 'khadga', 'nrtya', 'thrust', 'jaya', 'stride', 'abhaya', 'samabhanga'],
    female: true, thirdEye: true, crescent: false, feather: false, garland: true, thread: false,
    ornament: 0.5, halo: 0.6, vahana: 'nothing carries her',
  },
  {
    id: 'vishnu',
    name: 'Vishnu',
    script: 'विष्णु',
    epithet: 'the preserver, asleep on the serpent between worlds',
    note: 'Four hands, and the four things in them name him: conch, discus, mace, lotus. He comes down ten times, and Rama and Krishna are two of them.',
    skin: SKIN.rainCloud, face: 'human', hair: ['crown'],
    cloth: gold, garment: 'dhoti', extraPairs: 1,
    holds: ['chakra', 'conch'], spare: ['mace', 'lotus'],
    poses: ['samabhanga', 'cakra', 'abhaya', 'varada', 'sula', 'vyakhyana', 'padmasana', 'abhanga'],
    female: false, thirdEye: false, crescent: false, feather: false, garland: true, thread: true,
    ornament: 1, halo: 1, vahana: 'Garuda, the eagle',
  },
  {
    id: 'lakshmi',
    name: 'Lakshmi',
    script: 'लक्ष्मी',
    epithet: 'fortune, and the reason the lamps go out at Diwali and come back',
    note: 'She stands on a lotus and the coins fall from her lower hand. She is said to leave a house where there is quarrelling, which is a threat and a piece of advice.',
    skin: SKIN.gold, face: 'human', hair: ['crown', 'bun'],
    cloth: crimson, garment: 'sari', extraPairs: 1,
    holds: ['lotus', 'pot'], spare: ['lotus', 'none'],
    poses: ['padmasana', 'samabhanga', 'varada', 'abhaya', 'abhanga', 'tribhanga', 'vyakhyana'],
    female: true, thirdEye: false, crescent: false, feather: false, garland: true, thread: false,
    ornament: 1, halo: 1, vahana: 'an owl',
  },
  {
    id: 'saraswati',
    name: 'Saraswati',
    script: 'सरस्वती',
    epithet: 'speech, learning, and the arts',
    note: 'White, because she is what is left when the ornament is taken off. Every schoolchild’s books go at her feet once a year, and are not to be read that day.',
    skin: SKIN.pale, face: 'human', hair: ['flow', 'bun'],
    cloth: white, wrap: WRAPS[3], garment: 'sari', extraPairs: 1,
    holds: ['veena', 'book'], spare: ['lotus', 'none'],
    poses: ['padmasana', 'samabhanga', 'abhanga', 'tribhanga', 'varada', 'vyakhyana'],
    female: true, thirdEye: false, crescent: false, feather: false, garland: false, thread: false,
    ornament: 0.7, halo: 1, vahana: 'a swan, or a peacock',
  },
  {
    id: 'kartikeya',
    name: 'Kartikeya',
    script: 'कार्तिकेय',
    epithet: 'the general of the gods, called Murugan in the south',
    note: 'Six faces, in the old descriptions, and a spear his mother gave him. He lost a race round the world to his brother Ganesha, who went round his parents instead.',
    skin: SKIN.amber, face: 'human', hair: ['crown', 'high'],
    cloth: { light: '#c96a34', dark: '#7e3418' }, garment: 'dhoti', extraPairs: 0,
    holds: ['spear', 'none'], spare: [],
    poses: ['sula', 'thrust', 'alidha', 'samabhanga', 'stride', 'abhaya', 'abhanga', 'jaya'],
    female: false, thirdEye: false, crescent: false, feather: false, garland: true, thread: true,
    ornament: 0.85, halo: 0.85, vahana: 'a peacock',
  },
  {
    id: 'narasimha',
    name: 'Narasimha',
    script: 'नरसिंह',
    epithet: 'the man-lion, the loophole',
    note: 'A demon could not be killed by man or beast, indoors or out, by day or night. So Vishnu came as neither, on a threshold, at dusk.',
    skin: SKIN.saffron, face: 'lion', hair: ['matted', 'high'],
    cloth: gold, garment: 'dhoti', extraPairs: 1,
    holds: ['chakra', 'conch'], spare: ['mace', 'none'],
    poses: ['thrust', 'khadga', 'jaya', 'stride', 'samabhanga', 'tandava', 'padmasana', 'alidha'],
    female: false, thirdEye: false, crescent: false, feather: false, garland: true, thread: true,
    ornament: 0.8, halo: 0.9, vahana: 'none — he arrives',
  },
];

export const GOD_BY_ID = Object.fromEntries(GODS.map((g) => [g.id, g])) as Record<string, God>;
export { CLOTHS, WRAPS, teal };
