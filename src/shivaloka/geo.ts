/**
 * The map: longitude and latitude to world units, the coastline, the rivers
 * and the mountain ranges.
 *
 * One unit is one degree of latitude; longitude is squeezed by the cosine of
 * 22°N so the subcontinent keeps its shape. North is −z.
 *
 * The coastline is Natural Earth's 1:50m land (public domain, via the
 * world-atlas npm package), clipped to 60–100°E, 4–38°N and simplified. The
 * rivers and ranges are drawn by hand through well-known points — close
 * enough for a map you walk across, not for navigation.
 */
import LAND from './land.json';

const K = Math.cos((22 * Math.PI) / 180);
export const toWorld = (lon: number, lat: number): [number, number] => [(lon - 80) * K, 22 - lat];
export const toLonLat = (x: number, z: number): [number, number] => [x / K + 80, 22 - z];

export const LAND_RINGS = LAND as [number, number][][];

export const RIVERS: { name: string; pts: [number, number][] }[] = [
  { name: 'Ganga', pts: [[78.94, 30.99], [78.48, 30.35], [78.16, 29.95], [78.4, 29.0], [79.9, 27.1], [80.35, 26.5], [81.88, 25.43], [83.01, 25.3], [84.1, 25.55], [85.14, 25.62], [86.5, 25.3], [87.93, 24.8], [88.2, 24.1], [88.5, 23.1], [88.35, 22.55], [88.1, 21.7]] },
  { name: 'Yamuna', pts: [[78.45, 31.0], [77.6, 30.3], [77.3, 29.5], [77.25, 28.6], [77.7, 27.5], [78.0, 27.18], [79.2, 26.6], [80.4, 25.9], [81.88, 25.43]] },
  { name: 'Narmada', pts: [[81.75, 22.67], [80.9, 22.6], [79.95, 23.15], [78.5, 22.9], [77.3, 22.6], [76.15, 22.25], [74.8, 22.1], [73.5, 21.9], [72.97, 21.7]] },
  { name: 'Godavari', pts: [[73.53, 19.93], [74.8, 19.6], [75.9, 19.3], [77.3, 19.15], [78.9, 18.9], [80.0, 18.0], [81.1, 17.4], [81.8, 17.0], [82.2, 16.6]] },
  { name: 'Krishna', pts: [[73.66, 17.92], [74.6, 16.8], [76.0, 16.4], [77.3, 16.3], [78.87, 16.07], [80.1, 16.6], [80.6, 16.5], [81.1, 15.9]] },
  { name: 'Kaveri', pts: [[75.49, 12.38], [76.3, 12.5], [76.69, 12.42], [77.6, 12.2], [77.8, 11.8], [78.7, 10.85], [79.4, 10.9], [79.85, 11.1]] },
  { name: 'Brahmaputra', pts: [[95.3, 29.5], [94.8, 28.0], [94.2, 27.4], [93.0, 26.8], [91.74, 26.18], [90.3, 26.1], [89.7, 25.2], [89.9, 24.3], [90.5, 23.5]] },
  { name: 'Indus', pts: [[81.3, 31.3], [79.0, 32.8], [77.6, 34.1], [75.0, 35.4], [73.2, 35.2], [72.3, 33.9], [71.5, 32.5], [70.6, 30.2], [69.6, 27.8], [68.4, 25.4], [67.4, 24.0]] },
  { name: 'Mahanadi', pts: [[81.9, 20.1], [82.7, 21.2], [83.9, 21.4], [84.9, 20.6], [85.9, 20.4], [86.7, 20.3]] },
];

/** Mountain ranges as lines of peaks: [lon, lat] points, peak height, spread. */
export const RANGES: { name: string; pts: [number, number][]; h: number; spread: number; snow: boolean }[] = [
  { name: 'Himalaya', pts: [[73.5, 35.3], [75.5, 34.6], [77.0, 33.4], [78.4, 31.6], [79.5, 30.7], [81.0, 29.9], [83.5, 28.8], [85.5, 28.1], [87.5, 27.9], [89.5, 27.8], [91.5, 27.9], [93.5, 28.3], [95.0, 28.8]], h: 1.9, spread: 1.4, snow: true },
  { name: 'Karakoram & Tibet', pts: [[76.0, 35.8], [78.0, 35.0], [80.0, 33.5], [81.3, 31.1], [84.0, 30.5], [87.0, 30.0], [90.0, 29.8], [92.5, 30.0]], h: 1.5, spread: 1.8, snow: true },
  { name: 'Hindu Kush & Sulaiman', pts: [[71.0, 35.5], [70.2, 33.5], [69.8, 31.5], [68.5, 29.8], [67.5, 28.0], [66.8, 26.5]], h: 1.0, spread: 1.0, snow: false },
  { name: 'Western Ghats', pts: [[73.6, 21.0], [73.6, 19.5], [73.7, 18.0], [74.0, 16.3], [74.5, 14.5], [75.5, 12.5], [76.7, 10.8], [77.2, 9.5], [77.3, 8.6]], h: 0.55, spread: 0.45, snow: false },
  { name: 'Eastern Ghats', pts: [[85.0, 20.6], [83.4, 18.6], [82.0, 17.8], [80.3, 15.9], [79.3, 14.4], [78.6, 12.8], [78.0, 11.8]], h: 0.35, spread: 0.45, snow: false },
  { name: 'Vindhya & Satpura', pts: [[74.0, 22.7], [76.0, 22.6], [78.0, 23.1], [80.0, 23.6], [81.5, 23.5], [74.5, 21.7], [76.5, 21.6], [78.5, 21.9]], h: 0.35, spread: 0.5, snow: false },
  { name: 'Aravalli', pts: [[72.8, 24.3], [73.7, 25.3], [74.6, 26.4], [75.8, 27.5], [76.8, 28.3]], h: 0.3, spread: 0.35, snow: false },
  { name: 'North-east hills', pts: [[92.8, 25.6], [93.8, 25.2], [94.4, 24.2], [93.2, 23.2], [92.5, 22.8], [91.5, 25.4]], h: 0.45, spread: 0.5, snow: false },
];
