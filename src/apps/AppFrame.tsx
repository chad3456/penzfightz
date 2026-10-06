import { useEffect, useRef } from 'react';

/**
 * Hosts one of the standalone apps in public/apps/ (built from apps/ by
 * scripts/apps/build-apps.mjs) full-screen inside the site, with a way back.
 */
export function AppFrame({ src, title, onExit }: { src: string; title: string; onExit: () => void }) {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="appframe">
      <iframe ref={ref} src={src} title={title} className="appframe__frame" allow="fullscreen" />
      <button className="appframe__exit" onClick={onExit} aria-label={`Leave ${title}`}>← Shelf</button>
    </div>
  );
}
