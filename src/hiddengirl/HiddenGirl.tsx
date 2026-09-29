import { useEffect, useRef, useState } from 'react';
import { GhostDays } from './ghostdays/GhostDays';
import { canvas as mk, hexTree, meadow, paper, rng, roundTree } from './paint';

/**
 * The Hidden Girl and Other Stories, one story at a time: a contents page
 * drawn like a landscape architect's presentation board, and each story a
 * game you scroll through. "Ghost Days" is the first; the rest are waiting.
 */

const STORIES: { title: string; ready?: boolean; note?: string }[] = [
  { title: 'Ghost Days', ready: true, note: 'Nova Pacifica 2313 · Connecticut 1989 · Hong Kong 1905' },
  { title: 'Maxwell\'s Demon' },
  { title: 'The Reborn' },
  { title: 'Thoughts and Prayers' },
  { title: 'Byzantine Empathy' },
  { title: 'The Gods Will Not Be Chained' },
  { title: 'Staying Behind' },
  { title: 'Real Artists' },
  { title: 'The Gods Will Not Be Slain' },
  { title: 'Altogether Elsewhere, Vast Herds of Reindeer' },
  { title: 'The Gods Have Not Died in Vain' },
  { title: 'Memories of My Mother' },
  { title: 'Dispatches from the Cradle' },
  { title: 'Grey Rabbit, Crimson Mare, Coal Leopard' },
  { title: 'A Chase Beyond the Storms' },
  { title: 'The Hidden Girl' },
  { title: 'Seven Birthdays' },
  { title: 'The Message' },
  { title: 'Cutting' },
];

function Board() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const W = 1200, H = 600;
    const off = mk(W, H);
    const g = off.getContext('2d')!;
    const R = rng(11);
    paper(g, W, H, R);
    meadow(g, W, H * 0.55, H, R, { density: 1.6, leaves: true });
    for (let i = 0; i < 9; i++) roundTree(g, R() * W, H * (0.58 + R() * 0.1), 30 + R() * 30, R, { light: '#cfe3b8', mid: '#a9c98a', dark: '#7fae63' });
    for (let i = 0; i < 5; i++) hexTree(g, W * (0.55 + R() * 0.4), H * (0.62 + R() * 0.05), 160 + R() * 80, R);
    c.width = W; c.height = H;
    c.getContext('2d')!.drawImage(off, 0, 0);
  }, []);
  return <canvas ref={ref} className="hgb-board" aria-hidden />;
}

export function HiddenGirl({ onExit }: { onExit: () => void }) {
  const [story, setStory] = useState<number | null>(() => (new URLSearchParams(location.search).get('story') === 'ghost-days' ? 0 : null));
  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = '/fonts-sacred/fonts.css';
    document.head.appendChild(l);
    return () => l.remove();
  }, []);
  if (story === 0) return <GhostDays onExit={() => setStory(null)} />;
  return (
    <div className="hgb-root">
      <button className="hg-icon hgb-back" onClick={onExit} aria-label="Back to the shelf">←</button>
      <header className="hgb-head">
        <p className="hg-kicker">after Ken Liu</p>
        <h1>The Hidden Girl<br /><span>and Other Stories</span></h1>
        <p className="hgb-lede">Nineteen stories, told as games you scroll through, each in its own way. Start with the first.</p>
      </header>
      <Board />
      <ol className="hgb-list">
        {STORIES.map((s, i) => (
          <li key={s.title} className={s.ready ? 'ready' : ''}>
            <button disabled={!s.ready} onClick={() => setStory(i)}>
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <span className="t">{s.title}</span>
              <span className="s">{s.ready ? s.note : 'in the making'}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="hgb-foot">A retelling and a reading, in our own words, of stories from <i>The Hidden Girl and Other Stories</i> by Ken Liu (Saga Press, 2020). The book tells them far better.</p>
    </div>
  );
}
