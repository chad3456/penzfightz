/** Every tableau of the Bhagavad Gita film, by the key a verse names. */
import type { Scene } from '../pichwai/stage';
import * as S from './story';
import * as T from './tableaux';
import { teach } from './vignettes';
import { GITA_WORK, PLAN } from './text';

export const WORK = GITA_WORK;
export const SCENES: Record<string, Scene> = {
  'g-card': S.card, 'g-close': S.close, 'g-colophon': S.colophon,
  'g-palace': S.palace, 'g-review': S.review, 'g-conch': S.conch, 'g-chariot': S.chariotScene, 'g-despair': S.despair, 'g-karma': S.karma,
  'g-vishvarupa': S.vishvarupa, 'g-kala': S.kala, 'g-praise': S.praise, 'g-gentle': S.gentle, 'g-surrender': S.surrender, 'g-rise': S.rise, 'g-yatra': S.yatra,
  'g-teach': teach,
  'g-yajna': T.yajna, 'g-desire': T.desire, 'g-lineage': T.lineage, 'g-avatar': T.avatarScene, 'g-guru': T.guru, 'g-lotusleaf': T.lotusleaf, 'g-sameness': T.sameness,
  'g-yogi': T.yogi, 'g-elements': T.elements, 'g-pearls': T.pearls, 'g-maya': T.maya, 'g-four': T.four, 'g-death': T.death, 'g-brahmaday': T.brahmaday, 'g-paths': T.paths,
  'g-pervade': T.pervade, 'g-kirtan': T.kirtan, 'g-iam': T.iam, 'g-offer': T.offer, 'g-sages': T.sages, 'g-vibhuti': T.vibhuti, 'g-steps': T.steps, 'g-devotee': T.devoteeScene,
  'g-field': T.fieldScene, 'g-gunas': T.gunas, 'g-ashvattha': T.ashvattha, 'g-divine': T.divine, 'g-faith': T.faith, 'g-omtatsat': T.omtatsat, 'g-machine': T.machine,
  __fallback: teach,
};

/** Every tableau the plan names must exist. */
export const MISSING = [...new Set(PLAN.flat().map((s) => s[1]))].filter((k) => !SCENES[k]);
