import * as THREE from 'three';

/**
 * The road. An endless ribbon, a function of distance along it: gentle curves
 * from a few sines on the heading, gentle hills from a few more on the
 * height. It is integrated a metre at a time into a table that grows as the
 * ride goes on, so any point on it — for the girl, the camera, or the next
 * block of houses — is a lookup and a lerp.
 *
 * The road passes through four kinds of place, in turn, for DISTRICT metres
 * each: a slope town above the sea, a shopping street, the city, and the
 * rice fields. Then round again, a little different each time, because
 * everything along it is seeded from where it is.
 */

export const DISTRICT = 380;
export type DistrictId = 'sea' | 'street' | 'city' | 'fields';
export const ORDER: DistrictId[] = ['sea', 'street', 'city', 'fields'];
export const NAMES: Record<DistrictId, [string, string]> = {
  sea: ['海辺の坂', 'the slope above the sea'],
  street: ['商店街', 'the shopping street'],
  city: ['街', 'the city'],
  fields: ['田んぼ道', 'the road through the rice fields'],
};

export function districtAt(s: number) {
  const k = Math.floor(s / DISTRICT);
  const id = ORDER[((k % 4) + 4) % 4]!;
  return { id, k, u: s / DISTRICT - k, start: k * DISTRICT };
}

/** How far into a district the railway crossing is. */
export const CROSSING_AT = 0.55;

const heading = (s: number) => 0.5 * Math.sin(s / 230) + 0.22 * Math.sin(s / 97 + 1.3) + 0.08 * Math.sin(s / 43 + 0.4);
const height = (s: number) => 7 * Math.sin(s / 170) + 2.5 * Math.sin(s / 63 + 0.7) + 0.8 * Math.sin(s / 23);

export class Road {
  private x: number[] = [0];
  private z: number[] = [0];

  private extend(to: number) {
    for (let i = this.x.length; i <= to + 2; i++) {
      const h = heading(i - 0.5);
      this.x.push(this.x[i - 1]! + Math.sin(h));
      this.z.push(this.z[i - 1]! - Math.cos(h));
    }
  }

  /** Position on the road's centre line, and the frame there. */
  at(s: number, out = { pos: new THREE.Vector3(), fwd: new THREE.Vector3(), right: new THREE.Vector3(), h: 0 }) {
    s = Math.max(0, s);
    const i = Math.floor(s);
    this.extend(i + 1);
    const f = s - i;
    out.pos.set(this.x[i]! + (this.x[i + 1]! - this.x[i]!) * f, height(s), this.z[i]! + (this.z[i + 1]! - this.z[i]!) * f);
    const h = heading(s);
    out.h = h;
    out.fwd.set(Math.sin(h), 0, -Math.cos(h));
    out.right.set(Math.cos(h), 0, Math.sin(h));
    return out;
  }

  y(s: number) {
    return height(Math.max(0, s));
  }

  /** The slope, as rise over run, for the bicycle to lean into. */
  slope(s: number) {
    return (height(s + 1) - height(s - 1)) / 2;
  }
}
