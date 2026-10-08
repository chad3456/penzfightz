/**
 * श्रीविष्णुसहस्रनाम — the Vishnu Sahasranama as a moving pichwai. The
 * shared film player, with the name being chanted (its number, its roman
 * spelling and its meaning) under the captions, and every name with its
 * meaning in the reading view.
 */
import { useMemo } from 'react';
import { Film } from '../pichwai/Film';
import { dn } from '../pichwai/work';
import { SCENES, WORK } from './scenes';

export function VishnuFilm({ onExit }: { onExit: () => void }) {
  const scenes = useMemo(() => SCENES, []);
  return (
    <Film
      work={WORK}
      scenes={scenes}
      chant={{ sa: 146.8 }}
      onExit={onExit}
      className="pw-vishnu"
      extra={(seg, cap) => {
        const names = seg.verse?.names;
        if (!names?.length) return null;
        // which name holds the syllable being chanted
        let idx = -1;
        if (cap.li >= 0) { idx = cap.k; for (let i = 0; i < cap.li; i++) idx += seg.lines[i].syl.length; }
        let nm = idx >= 0 ? names.find((x) => idx >= x.from && idx < x.to) : undefined;
        if (!nm) { const T = cap.t - seg.start; nm = T > seg.dur - 2 ? names[names.length - 1] : names[0]; }
        return (
          <div className="pw-name" aria-live="off">
            <span className="no">{nm.n} · {dn(nm.n)}</span>
            <span className="nm">{nm.name}</span>
            <span className="mn">{nm.meaning}</span>
          </div>
        );
      }}
      readExtra={(v) => v.names?.length ? (
        <div className="pw-names">{v.names.map((x) => <div key={x.n}><b>{x.n}</b>{x.name} — <i>{x.meaning}</i></div>)}</div>
      ) : null}
    />
  );
}
