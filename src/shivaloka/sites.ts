import { JYOTIRLINGAS, LINGAS } from './sites-shiva';
import { SHAKTI } from './sites-shakti';
import { KRISHNA } from './sites-krishna';
import type { Kind, Site } from './types';

export { DAKSHA } from './sites-shakti';

/** Every place on the map, in the order the diary lists them. */
export const SITES: Site[] = [...JYOTIRLINGAS, ...LINGAS, ...SHAKTI, ...KRISHNA];
export const SITE_BY_ID: Record<string, Site> = Object.fromEntries(SITES.map((s) => [s.id, s]));

export const KINDS: { id: Kind; name: string; sa: string; blurb: string }[] = [
  { id: 'jyotirlinga', name: 'Jyotirlingas', sa: 'ज्योतिर्लिंग', blurb: 'The twelve places where Shiva appeared as a pillar of light.' },
  { id: 'linga', name: 'Shivalingas', sa: 'शिवलिंग', blurb: 'Kailash, the five elements, the Panch Kedar, the Pancharama and more.' },
  { id: 'shakti', name: 'Shakti Peethas', sa: 'शक्तिपीठ', blurb: 'The fifty-one seats of the goddess, where Sati\'s body fell.' },
  { id: 'krishna', name: 'Krishna', sa: 'कृष्ण', blurb: 'Braj, Dwarka, the field of the Gita, Shrinathji and the great temples.' },
];
