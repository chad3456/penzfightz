import type { Topic } from '../types';
import { VIRUSES } from './viruses';
import { HEART } from './heart';
import { TEST } from './test';

export const TOPICS: Topic[] = [...TEST, ...HEART, ...VIRUSES];
