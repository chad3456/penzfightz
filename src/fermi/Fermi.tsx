import { useEffect } from 'react';

/**
 * A standalone page film, on the shelf.
 *
 * The films themselves live in `public/`: one HTML file and one classic script
 * each, no framework, no build step, nothing imported from the rest of this
 * app. That is deliberate — they were asked for as pure JavaScript, they have
 * to open from a bare `file://` as well as from here, and the render script
 * drives exactly the same files to write the videos. So the shelf shows them
 * in a frame rather than folding them into React, and only owns the way out.
 */
export function PageFilm({ src, title, onExit }: { src: string; title: string; onExit: () => void }) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => { if (e.key === 'Escape') onExit(); };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [onExit]);

  return (
    <div className="fermi">
      <iframe className="fermi__frame" src={src} title={title} allow="autoplay" />
      <button className="fermi__exit" onClick={onExit}>← back to the shelf</button>
    </div>
  );
}

export const Fermi = ({ onExit }: { onExit: () => void }) => (
  <PageFilm src="/fermi/index.html" title="Where is everybody? The Fermi Paradox, explained by a cat." onExit={onExit} />
);

export const Diary = ({ onExit }: { onExit: () => void }) => (
  <PageFilm src="/riddle/index.html" title="The Diary: two minutes inside a schoolboy's diary." onExit={onExit} />
);
