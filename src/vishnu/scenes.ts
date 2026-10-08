/** Every tableau of the Vishnu Sahasranama film, by the key a verse names. */
import type { Scene } from '../pichwai/stage';
import { mandala } from './mandala';
import * as O from './opening';
import * as F from './phala';
import { VISHNU_WORK } from './text';

export const WORK = VISHNU_WORK;
export const SCENES: Record<string, Scene> = {
  'v-card': O.card, 'v-close': O.close,
  'v-invoke': O.invoke, 'v-shukla': O.shukla, 'v-vishvaksena': O.vishvaksena, 'v-vyasa': O.vyasa, 'v-arrows': O.arrows,
  'v-light': O.light, 'v-dissolve': O.dissolve, 'v-nyasa': O.nyasa,
  'd-milk': O.milk, 'd-cosmic': O.cosmic, 'd-om': O.omScene, 'd-shesha': O.sheshaScene, 'd-cloud': O.cloudScene, 'd-chaturbhuja': O.chaturbhuja, 'd-parijata': O.parijataScene,
  mandala,
  ...F.PHALA_SCENES,
  __fallback: O.chaturbhuja,
};
