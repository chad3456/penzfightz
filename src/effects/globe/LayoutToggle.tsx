import type { Layout } from './Globe';
import { sfx } from '../../lib/audio';

/**
 * Grid or sphere.
 *
 * One button rather than two, because it is a two-state thing and a segmented
 * control for two states is a switch with extra chrome on it. The label names
 * the *destination*, not the current state — a button that says "Grid" while
 * you are looking at a grid is a button nobody presses.
 */
export function LayoutToggle({
  layout,
  onChange,
  className = 'stage__spec',
}: {
  layout: Layout;
  onChange: (l: Layout) => void;
  className?: string;
}) {
  const next: Layout = layout === 'grid' ? 'sphere' : 'grid';
  return (
    <button
      className={className}
      title={next === 'sphere' ? 'Hang them on a sphere' : 'Lay them out as a sheet'}
      onClick={() => {
        sfx.tick();
        onChange(next);
      }}
    >
      {next === 'sphere' ? '◍ Sphere' : '▦ Grid'}
    </button>
  );
}
