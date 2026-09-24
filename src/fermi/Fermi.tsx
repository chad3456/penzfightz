import { useEffect } from 'react';

/**
 * WHERE IS EVERYBODY? — on the shelf.
 *
 * The film itself is a standalone page in `public/fermi/`: one HTML file and
 * one classic script, no framework, no build step, nothing imported from the
 * rest of this app. That is deliberate. It was asked for as pure JavaScript,
 * it has to open from a bare `file://` as well as from here, and the render
 * script drives exactly the same file to write the video. So the shelf shows
 * it in a frame rather than folding it into React, and only owns the way out.
 */
export function Fermi({ onExit }: { onExit: () => void }) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => { if (e.key === 'Escape') onExit(); };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [onExit]);

  return (
    <div className="fermi">
      <iframe
        className="fermi__frame"
        src="/fermi/index.html"
        title="Where is everybody? The Fermi Paradox, explained by a cat."
        allow="autoplay"
      />
      <button className="fermi__exit" onClick={onExit}>← back to the shelf</button>
    </div>
  );
}
