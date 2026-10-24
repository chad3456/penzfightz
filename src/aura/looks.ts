// The looks, in the order the shader knows them. `mask` looks use the person
// mask (they still work without one, around the centre of the frame);
// `layer` asks the 2D overlay for particles or lightning.
export interface Look {
  id: string;
  name: string;
  mask?: boolean;
  layer?: 'embers' | 'lightning';
  swatch: [string, string];
}

export const LOOKS: Look[] = [
  { id: 'teal_orange', name: 'Teal & Orange', swatch: ['#1f6f78', '#f39a4a'] },
  { id: 'noir_red', name: 'Noir Red', swatch: ['#111', '#e0242f'] },
  { id: 'cyberpunk', name: 'Cyberpunk', swatch: ['#3a0b5e', '#26e6ff'] },
  { id: 'golden_aura', name: 'Golden Aura', mask: true, swatch: ['#2a1606', '#ffc23d'] },
  { id: 'neon_aura', name: 'Neon Aura', mask: true, swatch: ['#ff2bd6', '#2bffd5'] },
  { id: 'thermal', name: 'Thermal', mask: true, swatch: ['#2b0a5e', '#ffcf2b'] },
  { id: 'comic', name: 'Comic', swatch: ['#f7e7c6', '#e8402f'] },
  { id: 'sketch', name: 'Sketch', swatch: ['#f3ede0', '#555'] },
  { id: 'vhs', name: 'VHS', swatch: ['#3d4a8a', '#e89acb'] },
  { id: 'glitch', name: 'Glitch', swatch: ['#ff004c', '#00e5ff'] },
  { id: 'dream', name: 'Dream Glow', swatch: ['#f4c6e4', '#bcd2ff'] },
  { id: 'purple_haze', name: 'Purple Haze', swatch: ['#2a0838', '#ffd27a'] },
  { id: 'infrared', name: 'Infrared', swatch: ['#ff4fa1', '#2ec4c4'] },
  { id: 'matrix', name: 'Matrix', swatch: ['#021a05', '#39ff6a'] },
  { id: 'green_rays', name: 'God Rays', swatch: ['#06210f', '#c8ff9a'] },
  { id: 'storm', name: 'Storm', layer: 'lightning', swatch: ['#0b1a2e', '#d9ecff'] },
  { id: 'embers', name: 'Embers', layer: 'embers', swatch: ['#2a0c02', '#ff8a1f'] },
  { id: 'noir', name: 'Noir', swatch: ['#000', '#fff'] },
  { id: 'oil', name: 'Oil Paint', swatch: ['#3a2a1e', '#e9b872'] },
  { id: 'kaleido', name: 'Kaleido', swatch: ['#2b1460', '#9ad8ff'] },
  { id: 'film', name: '16mm Film', swatch: ['#3b2a1a', '#f0c58a'] },
  { id: 'invert', name: 'Negative', swatch: ['#e8f4ff', '#0a1a33'] },
  { id: 'clean', name: 'Clean', swatch: ['#444', '#ccc'] },
];
export const LOOK_INDEX: Record<string, number> = Object.fromEntries(LOOKS.map((l, i) => [l.id, i]));
export const lookOf = (id: string) => LOOKS[LOOK_INDEX[id] ?? 0];
