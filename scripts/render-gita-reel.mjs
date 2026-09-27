/**
 * Write the Gita reel out to a vertical video file.
 *
 *   node scripts/render-gita-reel.mjs [out.mp4] [height] [fps]
 */
import { renderPageFilm } from './page-film.mjs';

await renderPageFilm({
  dir: 'gita-reel',
  global: 'GITA',
  out: process.argv[2] || 'gita-reel.mp4',
  height: Number(process.argv[3] || 1920),
  fps: Number(process.argv[4] || 30),
});
