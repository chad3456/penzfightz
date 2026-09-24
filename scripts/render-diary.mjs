/**
 * Write "The Diary" out to a video file.
 *
 *   node scripts/render-diary.mjs [out.mp4] [height] [fps]
 */
import { renderPageFilm } from './page-film.mjs';

await renderPageFilm({
  dir: 'riddle',
  global: 'RIDDLE',
  out: process.argv[2] || 'the-diary.mp4',
  height: Number(process.argv[3] || 1080),
  fps: Number(process.argv[4] || 30),
});
