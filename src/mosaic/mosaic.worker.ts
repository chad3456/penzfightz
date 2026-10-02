import { buildMosaic } from './build';

self.onmessage = () => {
  const d = buildMosaic();
  (self as unknown as Worker).postMessage(d, [d.verts.buffer, d.start.buffer, d.cx.buffer, d.cy.buffer, d.col.buffer, d.metal.buffer, d.tilt.buffer, d.shade.buffer, d.region.buffer, d.key.buffer, d.sinopia.buffer]);
};
