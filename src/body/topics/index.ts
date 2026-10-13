import type { Topic } from '../types';
import { HEART } from './heart';
import { VESSELS } from './vessels';
import { BLOOD } from './blood';
import { BRAIN } from './brain';
import { NERVES } from './nerves';
import { VIRUSES } from './viruses';
import { TEST } from './test';

export const TOPICS: Topic[] = [...HEART, ...VESSELS, ...BLOOD, ...BRAIN, ...NERVES, ...VIRUSES, ...TEST];
