/**
 * Write the Ramayana anime short out to a video file.
 *
 *   node scripts/render-ramayana-anime.mjs [out.mp4] [height] [fps]
 */
import { renderPageFilm } from './page-film.mjs';

await renderPageFilm({
  dir: 'ramayana-anime',
  global: 'RAMA',
  out: process.argv[2] || 'ramayana-anime.mp4',
  height: Number(process.argv[3] || 1080),
  fps: Number(process.argv[4] || 30),
});
