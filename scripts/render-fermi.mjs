/**
 * Write "Where is everybody?" out to a video file.
 *
 *   node scripts/render-fermi.mjs [out.mp4] [height] [fps]
 */
import { renderPageFilm } from './page-film.mjs';

await renderPageFilm({
  dir: 'fermi',
  global: 'FERMI',
  out: process.argv[2] || 'where-is-everybody.mp4',
  height: Number(process.argv[3] || 1080),
  fps: Number(process.argv[4] || 30),
});
