/**
 * The four cities.
 *
 * A location is not a palette swap. Each one changes the shape of the streets,
 * what is standing in them, how much of it you can flatten, and how the ground
 * behaves under the car — Chandni Chowk is a knot of six-metre lanes packed
 * with stalls, and Shimla is the same idea tipped forty metres onto its side.
 * The unlock order is the difficulty order.
 */

export type PlaceId = 'marine' | 'chowk' | 'goa' | 'shimla';

export interface Place {
  id: PlaceId;
  name: string;
  where: string;
  /** One line on the card, in the voice of somebody who has driven there. */
  blurb: string;
  /** Total earned across all runs before this one opens. */
  unlock: number;
  /** Blocks across. The map is this squared. */
  grid: number;
  /** Metres from one street centreline to the next. */
  pitch: number;
  /** Carriageway width. */
  road: number;
  /** How tall the buildings get. */
  storeys: [number, number];
  /** How much of the block footprint is built on. */
  density: number;
  /** Props per hundred square metres of pavement. */
  clutter: number;
  /** 0 dead flat, 1 a hillside. */
  relief: number;
  /** Fares get this much less time. */
  pressure: number;
  /** Money multiplier, because the hard ones have to be worth it. */
  purse: number;
  sky: [string, string];
  ground: string;
  kerb: string;
  wall: [string, string];
  /** Sun elevation and azimuth, radians. */
  sun: [number, number];
  night: boolean;
  /** Water on one edge, which is out of bounds and also the view. */
  sea: boolean;
  /** What is standing about in the streets here. */
  props: PropKind[];
}

export type PropKind =
  | 'stall'
  | 'cart'
  | 'bin'
  | 'cone'
  | 'crate'
  | 'hoarding'
  | 'palm'
  | 'tree'
  | 'lamp'
  | 'shelter'
  | 'scooter'
  | 'barrel'
  | 'chai'
  | 'pot'
  | 'melon'
  | 'sign'
  | 'bollard'
  | 'pile';

export const PLACES: Place[] = [
  {
    id: 'marine',
    name: 'Marine Drive',
    where: 'Bombay, half past eleven',
    blurb:
      'Six lanes of nothing in the way and the sea on your right. Everybody learns to drive fast here and unlearns it somewhere else.',
    unlock: 0,
    grid: 7,
    pitch: 78,
    road: 17,
    storeys: [4, 11],
    density: 0.62,
    clutter: 0.5,
    relief: 0,
    pressure: 1,
    purse: 1,
    sky: ['#1a2233', '#3b4257'],
    ground: '#41434a',
    kerb: '#8d8779',
    wall: ['#c8bfa8', '#a9a08c'],
    sun: [-0.12, 2.1],
    night: true,
    sea: true,
    props: ['lamp', 'palm', 'bin', 'bollard', 'cone', 'shelter', 'scooter', 'sign', 'hoarding'],
  },
  {
    id: 'chowk',
    name: 'Chandni Chowk',
    where: 'Old Delhi, market hours',
    blurb:
      'Lanes the width of a handcart, and there is always a handcart. Nothing here is more than four metres from something you can flatten.',
    unlock: 900,
    grid: 10,
    pitch: 46,
    road: 9.5,
    storeys: [2, 5],
    density: 0.82,
    clutter: 2.4,
    relief: 0,
    pressure: 1.18,
    purse: 1.45,
    sky: ['#b98f52', '#e0c08a'],
    ground: '#5b5245',
    kerb: '#8a7c66',
    wall: ['#c99f6b', '#a87b52'],
    sun: [0.42, 1.1],
    night: false,
    sea: false,
    props: ['stall', 'cart', 'crate', 'chai', 'pot', 'melon', 'bin', 'sign', 'scooter', 'pile', 'barrel'],
  },
  {
    id: 'goa',
    name: 'The Coast Road',
    where: 'Goa, an hour before the rain',
    blurb:
      'Wide, empty, sandy, and the corners come with no warning at all. Half the hazards are palms and the other half are dogs asleep in the road.',
    unlock: 2600,
    grid: 8,
    pitch: 92,
    road: 13,
    storeys: [1, 3],
    density: 0.34,
    clutter: 0.9,
    relief: 0.22,
    pressure: 1.08,
    purse: 1.35,
    sky: ['#5d7f9a', '#c2cbc4'],
    ground: '#6d6350',
    kerb: '#9c8f74',
    wall: ['#d8d3c2', '#b9634c'],
    sun: [0.3, 4.2],
    night: false,
    sea: true,
    props: ['palm', 'crate', 'barrel', 'cone', 'tree', 'sign', 'bin', 'shelter', 'scooter'],
  },
  {
    id: 'shimla',
    name: 'The Hill Road',
    where: 'Shimla, first snow',
    blurb:
      'Forty metres of drop across the map and every junction is on a slope. The brakes are the upgrade you will want first.',
    unlock: 5800,
    grid: 8,
    pitch: 70,
    road: 11,
    storeys: [2, 6],
    density: 0.5,
    clutter: 1.1,
    relief: 1,
    pressure: 1.24,
    purse: 1.7,
    sky: ['#8fa2b4', '#dfe6ea'],
    ground: '#7b7c79',
    kerb: '#9aa0a0',
    wall: ['#b9ada0', '#8e7f6f'],
    sun: [0.24, 5.4],
    night: false,
    sea: false,
    props: ['tree', 'lamp', 'bin', 'cone', 'crate', 'shelter', 'sign', 'barrel', 'bollard', 'pile'],
  },
];

export const PLACE_BY_ID = Object.fromEntries(PLACES.map((p) => [p.id, p])) as Record<PlaceId, Place>;
