/** The land mask lookup, kept apart from the map loader so the simulation can run anywhere. */
export type EarthMaps = { day: HTMLCanvasElement; mask: Uint8Array; mw: number; mh: number };

export function isLand(maps: EarthMaps | null, lat: number, lon: number) {
  if (!maps) return false;
  const x = Math.floor(((lon + 180) / 360) * maps.mw) % maps.mw;
  const y = Math.min(maps.mh - 1, Math.max(0, Math.floor(((90 - lat) / 180) * maps.mh)));
  return maps.mask[y * maps.mw + x] === 1;
}
