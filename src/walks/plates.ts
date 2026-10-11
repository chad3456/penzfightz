/** Every plate in “Walks of Life”, in hanging order. */
import { type Plate } from './stage';
import { LIBRARY } from './library';
import { BROWNSTONE } from './brownstone';
import { NIGHTSHIFT } from './nightshift';
import { QUAD } from './quad';

export const PLATES: Plate[] = [LIBRARY, BROWNSTONE, NIGHTSHIFT, QUAD];
export type { Plate, Who } from './stage';
