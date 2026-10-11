/** Every plate in “Walks of Life”, in hanging order. */
import { type Plate } from './stage';
import { LIBRARY } from './library';
import { BROWNSTONE } from './brownstone';

export const PLATES: Plate[] = [LIBRARY, BROWNSTONE];
export type { Plate, Who } from './stage';
