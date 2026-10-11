/** Every plate in “Walks of Life”, in hanging order. */
import { type Plate } from './stage';
import { LIBRARY } from './library';
import { BROWNSTONE } from './brownstone';
import { NIGHTSHIFT } from './nightshift';
import { QUAD } from './quad';
import { AQUARIUM } from './aquarium';

export const PLATES: Plate[] = [LIBRARY, BROWNSTONE, NIGHTSHIFT, QUAD, AQUARIUM];
export type { Plate, Who } from './stage';
