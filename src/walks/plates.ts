/** Every plate in “Walks of Life”, in hanging order. */
import { type Plate } from './stage';
import { LIBRARY } from './library';
import { BROWNSTONE } from './brownstone';
import { NIGHTSHIFT } from './nightshift';
import { QUAD } from './quad';
import { AQUARIUM } from './aquarium';
import { LAUNDROMAT } from './laundromat';

export const PLATES: Plate[] = [LIBRARY, BROWNSTONE, NIGHTSHIFT, QUAD, AQUARIUM, LAUNDROMAT];
export type { Plate, Who } from './stage';
