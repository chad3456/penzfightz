import type { Story } from '../story';
import { RIDICULOUS } from './ridiculous';
import { GATE } from './gate';
import { HEART } from './heart';
import { SALT } from './salt';

/**
 * The shelf, in the order the books stand on it.
 *
 * Three of the four are adaptations of stories long out of copyright, and each
 * one says so on its card. The fourth is an original, written for this shelf,
 * and its card says that too — the point of the row is that a reader knows
 * whose words they are reading before they open the cover.
 */
export const SHELF: Story[] = [RIDICULOUS, GATE, HEART, SALT];

export { RIDICULOUS, GATE, HEART, SALT };
