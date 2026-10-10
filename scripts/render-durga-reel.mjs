/**
 * Write “Maa Durga’s Valour” — the one-minute Navadurga reel — to a vertical
 * video file (1080 × 1920, 30 fps, AAC score).
 *
 *   node scripts/render-durga-reel.mjs [out.mp4] [height] [fps]
 *
 * The reel is TypeScript (src/navadurga/reel.ts), so this starts a Vite
 * server of its own for reels/durga.html, renders through it, and stops it.
 */
import { createServer } from 'vite';
import { renderPageFilm } from './page-film.mjs';

const server = await createServer({ server: { port: 0, host: '127.0.0.1' }, logLevel: 'warn' });
await server.listen();
const { port } = server.httpServer.address();
try {
  await renderPageFilm({
    url: `http://127.0.0.1:${port}/reels/durga.html?render`,
    global: 'DURGA',
    out: process.argv[2] || 'durga-reel.mp4',
    height: Number(process.argv[3] || 1920),
    fps: Number(process.argv[4] || 30),
    // the hatched paper is all fine detail; a touch more compression keeps the file postable
    crf: 21,
  });
} finally {
  await server.close();
}
