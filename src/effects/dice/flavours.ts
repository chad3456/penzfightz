/**
 * Six jellies.
 *
 * The body colour is not what you see. A transmissive material tints by
 * *absorption* — light is coloured by how far it travelled through the medium —
 * so the visible colour comes from `attenuation` and the base `color` mostly
 * decides the surface tint. A saturated base colour on top of a saturated
 * attenuation gives an opaque sweet rather than a jelly, so the base stays pale
 * and the attenuation does the work.
 */

export interface Flavour {
  id: string;
  /** What is printed under the swatches. */
  name: string;
  /** Surface tint. Kept pale — the depth colour is `attenuation`. */
  body: string;
  /** The colour light picks up on its way through. */
  attenuation: string;
  /** How far light gets before it is fully that colour. Small = dense. */
  depth: number;
  pip: string;
  /** The thing set in the middle of the jelly, like a sweet. */
  fruit: string;
  /** Cherries and the like get a stalk; a berry does not. */
  stalk: boolean;
  /** The swatch, and the tint of the ring around the tray. */
  swatch: string;
  rim: string;
}

export const FLAVOURS: Flavour[] = [
  {
    id: 'strawberry',
    name: 'Strawberry jelly',
    body: '#ffcbe6',
    attenuation: '#fb2ba4',
    depth: 0.34,
    pip: '#fff3f8',
    fruit: '#a8003c',
    stalk: true,
    swatch: '#f5399b',
    rim: 'rgba(233, 92, 160, 0.2)',
  },
  {
    id: 'cherry',
    name: 'Cherry jelly',
    body: '#f6eef0',
    attenuation: '#e9c9d2',
    depth: 1.5,
    pip: '#1d1a1c',
    fruit: '#c00d28',
    stalk: true,
    swatch: '#6e3038',
    rim: 'rgba(120, 60, 70, 0.17)',
  },
  {
    id: 'lime',
    name: 'Lime jelly',
    body: '#cbf59b',
    attenuation: '#5fc41a',
    depth: 0.36,
    pip: '#fbfff3',
    fruit: '#3d8a06',
    stalk: false,
    swatch: '#8fe23f',
    rim: 'rgba(122, 196, 60, 0.19)',
  },
  {
    id: 'raspberry',
    name: 'Raspberry jelly',
    body: '#ffc6ee',
    attenuation: '#e321ad',
    depth: 0.33,
    pip: '#fff2fb',
    fruit: '#7a0050',
    stalk: false,
    swatch: '#d94bb4',
    rim: 'rgba(200, 70, 165, 0.19)',
  },
  {
    id: 'blueberry',
    name: 'Blueberry jelly',
    body: '#c8c2ff',
    attenuation: '#3a2ad4',
    depth: 0.36,
    pip: '#f4f2ff',
    fruit: '#1c1170',
    stalk: false,
    swatch: '#6a5cf0',
    rim: 'rgba(96, 84, 220, 0.19)',
  },
  {
    id: 'candy',
    name: 'Candy apple',
    body: '#ffc0bb',
    attenuation: '#d4102c',
    depth: 0.36,
    pip: '#fff1ef',
    fruit: '#7d0410',
    stalk: true,
    swatch: '#e04a4a',
    rim: 'rgba(214, 62, 70, 0.19)',
  },
];

export const FLAVOUR_BY_ID = Object.fromEntries(FLAVOURS.map((f) => [f.id, f]));
