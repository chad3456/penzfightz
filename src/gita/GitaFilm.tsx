/**
 * श्रीमद्भगवद्गीता — the whole Bhagavad Gita as a moving pichwai, chanted
 * verse by verse with an English translation. The shared film player, with
 * a bansuri over the drone.
 */
import { useMemo } from 'react';
import { Film } from '../pichwai/Film';
import { SCENES, WORK } from './scenes';

export default function GitaFilm({ onExit }: { onExit: () => void }) {
  const scenes = useMemo(() => SCENES, []);
  return <Film work={WORK} scenes={scenes} chant={{ sa: 138.6, flute: true }} onExit={onExit} className="pw-gita" />;
}
