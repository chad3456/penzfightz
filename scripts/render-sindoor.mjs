/**
 * Write "Operation Sindoor, explained" out to a video file.
 *
 *   node scripts/render-sindoor.mjs [out.mp4] [height] [fps]
 */
import { renderPageFilm } from './page-film.mjs';

await renderPageFilm({
  dir: 'sindoor',
  global: 'SINDOOR',
  out: process.argv[2] || 'operation-sindoor.mp4',
  height: Number(process.argv[3] || 1080),
  fps: Number(process.argv[4] || 30),
});
