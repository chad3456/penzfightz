import { Bricks, P } from './bricks';

/**
 * HALLOWDENE — a school for the magically inclined, built out of bricks.
 *
 * ── What this is, and what it deliberately is not ────────────────────────
 *
 * It is a castle school on a lake with towers, a great hall, a moving
 * staircase, a bridge, a clock, a boathouse and a dark wood at the edge of the
 * grounds. Those are the furniture of a genre and nobody owns the genre.
 *
 * It is **not** a reproduction of any particular school from any particular
 * series, and none of the names, houses, crests, characters or licensed brick
 * parts of one appear anywhere in it. That was a choice rather than an
 * oversight: a castle is a castle, but a specific castle with a specific name
 * on it is somebody's work, and so is the brick system it would be built from.
 *
 * ── The grid ─────────────────────────────────────────────────────────────
 *
 * X runs east across the grounds, Z runs north into them, Y counts brick
 * courses. The lake is south-west, the wood is north-east, and the castle sits
 * on the rock between them. Everything is laid out in studs so that a wall can
 * be given a length and bonded properly rather than scaled to fit.
 */

export interface Landmark {
  id: string;
  name: string;
  /** Where the camera should stand to look at it, and what it should look at. */
  from: [number, number, number];
  look: [number, number, number];
  /** One line for the caption. */
  note: string;
}

export const GROUND = 0;

/**
 * The rock the castle stands on.
 *
 * Terraced, and *small* — the first version paved a hundred and fifty studs
 * square in eight-stud bricks and what it produced was not a crag, it was a
 * wooden pallet stretching to the horizon with a castle parked on it. A rock
 * has to end somewhere for there to be a lake, and the lake is half the view.
 */
function crag(b: Bricks) {
  /*
    Two rocks with water between them.

    The first version paved one slab a hundred and fifty studs square, which
    was a wooden pallet with a castle parked on it. The second was the right
    size but still one piece, so the bridge — the whole of the fourth term —
    crossed a gorge that was in fact a lawn. There are two rocks now and the
    gap between them is lake, which is what the bridge is for.
  */
  const terraces: [number, number, number, number, number, string][] = [
    [-50, -30, 110, 70, 0, P.stoneDark],
    [-47, -27, 104, 64, 1, P.stoneDark],
    [-44, -24, 98, 58, 2, P.greenDark],
    [-42, -22, 94, 54, 3, P.green],
  ];
  for (const [x, z, w, d, y, c] of terraces) b.slab(x, z, w, d, y, c, 6);

  // The skirt down to the water, and under it. A cliff, not a kerb: the
  // terraces start at course zero and the lake sits at minus two, so without
  // this the castle stands on a shelf and reads as floating on the surface.
  const skirt = (x0: number, z0: number, w: number, d: number, top = 0) => {
    for (let c = -7; c < top; c++) {
      // Narrowing as it goes down, not up: the rock has to be at its widest
      // where it meets the terrace above it or the terrace overhangs it.
      const i = (top - c) * 0.55;
      b.wall(x0 + i, z0 + i, Math.round(w - i * 2), 1, c, P.stoneDark, 'x', 2);
      b.wall(x0 + i, z0 + d - 1 - i, Math.round(w - i * 2), 1, c, P.stoneDark, 'x', 2);
      b.wall(x0 + i, z0 + 1 + i, Math.round(d - i * 2), 1, c, P.stoneDark, 'z', 2);
      b.wall(x0 + w - 1 - i, z0 + 1 + i, Math.round(d - i * 2), 1, c, P.stoneDark, 'z', 2);
    }
  };
  skirt(-50, -30, 110, 70);

  // Broken rock down the south face, below the lawn where it belongs.
  let s = 7;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 46; i++) {
    const x = -50 + rnd() * 110;
    const z = -31 - rnd() * 5;
    b.put(2, 2, x, -2 - Math.floor(rnd() * 3), z, rnd() > 0.5 ? P.stoneDark : P.earth);
  }

  // A shelf at the water for the boathouse, and the path up off it.
  b.slab(-90, -62, 34, 20, -2, P.earth, 6);
  b.stair(-58, -40, 6, 6, -2, P.stoneDark, 1);

  /*
    The far rock, across the gorge — and a good deal higher than the castle's.

    Level with it the bridge was a twelve-stud plank over a puddle. Standing
    eleven courses above the lawn it is a crossing: the deck runs out at the
    height of the stair hall's first landing and the water is fifteen courses
    below it, which is a drop worth not looking down.
  */
  for (let c = 10; c < 14; c++) {
    const i = (13 - c) * 3;
    b.slab(14 - i, 62 - i, 82 + i * 2, 54 + i * 2, c,
      c < 13 ? P.stoneDark : c < 14 ? P.greenDark : P.green, 6);
  }
  b.slab(17, 65, 76, 48, 14, P.green, 6);
  skirt(5, 53, 100, 72, 10);
}

/** The great hall: a long nave with buttresses, a rose window and a roof. */
function greatHall(b: Bricks) {
  const x = -34;
  const z = -16;
  const w = 54;
  const d = 26;
  const courses = 22;

  b.slab(x, z, w, d, 4, P.stoneDark, 8);
  b.box(x, z, w, d, courses, 5, P.stone);

  /*
    Buttresses, and then the windows in the bays between them.

    The order matters and so does the plane each thing sits on. A buttress
    laid at z-2 with a depth of two occupies the studs from z-2.5 to z-0.5,
    which leaves exactly one stud of clear air in front of the wall face. The
    first pass put the glass flush in the wall and the banners at z-1.2 —
    inside the buttress — so from outside the hall was fifty-four studs of
    blank grey with some pale columns on it, and none of the light or colour
    that is supposed to be the whole point of the elevation.
  */
  const zs = z - 2;
  const zn = z + d + 1;
  for (let i = 4; i < w - 4; i += 7) {
    b.wall(x + i, zs, 3, 14, 5, P.stoneLight, 'x', 2);
    b.wall(x + i, zn, 3, 14, 5, P.stoneLight, 'x', 2);
    // A weathered set-off at the top of each, and a pinnacle above it.
    b.put(3, 2, x + i + 1, 19, zs + 1, P.stoneDark);
    b.put(3, 2, x + i + 1, 19, zn, P.stoneDark);
    for (let c = 0; c < 3; c++) b.put(1, 1, x + i + 1, 20 + c, zs + 1, P.stoneLight);
    for (let c = 0; c < 3; c++) b.put(1, 1, x + i + 1, 20 + c, zn, P.stoneLight);
  }

  // Tall windows in the bays, standing a stud proud of the wall so they are
  // read as windows and not as a tone.
  for (let i = 7; i < w - 6; i += 7) {
    for (let c = 8; c < 20; c++) {
      const wide = c < 18 ? 3 : c < 19 ? 2 : 1;
      for (let j = 0; j < wide; j++) {
        b.put(1, 1, x + i + j, c, z - 1, P.glass);
        b.put(1, 1, x + i + j, c, z + d, P.glass);
      }
      // A mullion up the middle of each light, in stone, because a pane three
      // studs wide with nothing in it is a hole rather than a window.
      if (c % 4 === 0 && wide === 3) {
        b.put(3, 1, x + i + 1, c, z - 1, P.stoneDark);
        b.put(3, 1, x + i + 1, c, z + d, P.stoneDark);
      }
    }
    b.put(3, 1, x + i + 1, 7, z - 1, P.stoneDark);
    b.put(3, 1, x + i + 1, 7, z + d, P.stoneDark);
  }

  // Banners in the four house colours, hung clear of the buttresses so they
  // hang in front of the building rather than inside it.
  const colours = ['#8d2f3a', '#2f5d8d', '#2f7d55', '#8d7a2f'];
  for (const [n, c] of colours.entries()) {
    const bx = x + 8 + n * 13;
    for (let row = 9; row < 19; row++) {
      b.put(3, 1, bx, row, zs - 1.4, c);
      if (row === 18) b.put(3, 1, bx, row + 1, zs - 1.4, P.gold);
    }
    // A point at the bottom.
    b.put(1, 1, bx, 8, zs - 1.4, c);
  }

  // The rose window on the west gable.
  for (let c = 12; c < 20; c++) {
    const half = Math.round(Math.sqrt(Math.max(0, 16 - (c - 16) ** 2)));
    for (let j = -half; j <= half; j++) {
      b.put(1, 1, x - 1, c, z + d / 2 + j, c === 16 || j === 0 ? P.gold : P.glass);
    }
  }

  // And the doors under it: two leaves, an arch, and steps down to the court.
  for (let c = 5; c < 11; c++) {
    const half = c < 9 ? 4 : c < 10 ? 3 : 2;
    for (let j = -half; j <= half; j++) {
      b.put(1, 1, x - 1, c, z + d / 2 + j, j === 0 ? P.gold : P.woodDark);
    }
  }
  // Steps down from the doors, running west away from the building.
  for (let step = 0; step < 4; step++) {
    b.slab(x - 2 - step, z + d / 2 - 5 - step, 1, 11 + step * 2, 4 - step, P.stoneLight, 4);
  }

  b.gable(x, z, w, d, 5 + courses, P.roof);
  b.crenels(x, z - 2, w, 19, P.stoneLight, 'x');
  b.crenels(x, z + d + 1, w, 19, P.stoneLight, 'x');
}

/** A round tower with a cone on it, used four times over. */
function tower(
  b: Bricks, cx: number, cz: number, r: number, courses: number, y0: number,
  body = P.stone, roof = P.slate,
) {
  b.tower(cx, cz, r, courses, y0, body);
  // Banded courses, because a tower all one colour is a pipe.
  for (const c of [Math.round(courses * 0.32), Math.round(courses * 0.64)]) {
    b.tower(cx, cz, r + 0.35, 1, y0 + c, P.stoneDark);
  }
  // Windows, spiralling up it.
  for (let c = 6; c < courses - 4; c += 5) {
    const a = c * 0.7;
    b.put(1, 1, cx + Math.cos(a) * (r + 0.2), y0 + c, cz + Math.sin(a) * (r + 0.2), P.glass);
    b.put(1, 1, cx + Math.cos(a + 2.1) * (r + 0.2), y0 + c, cz + Math.sin(a + 2.1) * (r + 0.2), P.glass);
  }
  b.tower(cx, cz, r + 0.8, 2, y0 + courses, P.stoneLight);
  b.cone(cx, cz, r + 0.6, Math.round(r * 2.6), y0 + courses + 2, roof);
}

/**
 * The staircase hall.
 *
 * Four flights hanging in a shaft, at four different angles and four different
 * heights, which is the one piece of the building that is allowed to be
 * impossible. They move; that is handled in the scene rather than here.
 */
function stairHall(b: Bricks) {
  const cx = 34;
  const cz = 6;
  const r = 14;

  /*
    Solid for the first dozen courses, then a cage.

    Built as one closed cylinder all the way up — which is what it was — the
    shaft is a grain silo. The four flights turning inside it are the whole
    reason the room exists and not one of them is visible from any angle. So
    the top four fifths is eight piers with open bays between them and a ring
    course every eleven, which is how a real lantern stage is built anyway.
  */
  b.tower(cx, cz, r, 12, 4, P.stone);
  for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    for (let c = 4; c < 12; c++) {
      const half = c < 10 ? 2 : 1;
      for (let k = -half; k <= half; k++) {
        const ang = a + k * 0.1;
        b.put(1, 1, cx + Math.cos(ang) * (r + 0.2), c, cz + Math.sin(ang) * (r + 0.2), P.stoneDark);
      }
    }
  }

  const piers = 8;
  for (let p = 0; p < piers; p++) {
    const a = (p / piers) * Math.PI * 2 + 0.2;
    for (let c = 0; c < 34; c++) {
      for (let k = -1; k <= 1; k++) {
        const ang = a + k * 0.085;
        b.put(2, 1, cx + Math.cos(ang) * r, 16 + c, cz + Math.sin(ang) * r,
          c % 11 === 10 ? P.stoneLight : P.stone, -ang);
      }
    }
  }
  for (const c of [15, 27, 38, 50]) b.tower(cx, cz, r + 0.3, 1, c, P.stoneDark);

  // A crown of merlons round the open top.
  const per = Math.round(r * 1.7);
  for (let i = 0; i < per; i++) {
    const a = (i / per) * Math.PI * 2;
    for (let c = 0; c < 2; c++) {
      b.put(1, 1, cx + Math.cos(a) * r, 51 + c, cz + Math.sin(a) * r, P.stoneLight);
    }
  }
}

/** The bridge across the gorge to the north wing. */
function bridge(b: Bricks) {
  const x = 15;
  const z0 = 26;
  const len = 34;

  // The abutment on the castle side: the bridge has to start from somewhere
  // fifteen courses up, and a plank that begins in mid-air on the lawn is
  // worse than no bridge at all.
  b.box(x - 2, z0 - 8, 11, 10, 12, 3, P.stone);
  b.slab(x - 2, z0 - 8, 11, 10, 14, P.stoneLight, 4);
  for (let c = 4; c < 11; c++) {
    const half = c < 9 ? 3 : c < 10 ? 2 : 1;
    for (let j = -half; j <= half; j++) b.put(1, 1, x + 3 + j, c, z0 - 8, P.stoneDark);
  }
  for (let step = 0; step < 6; step++) {
    b.slab(x - 4 - step * 2, z0 - 7, 2, 8, 13 - step * 2, P.stoneLight, 4);
  }

  b.slab(x, z0, 7, len, 15, P.wood, 4);
  for (let i = 0; i < len; i += 2) {
    for (let c = 16; c < 18; c++) {
      b.put(1, 1, x, c, z0 + i, P.woodDark);
      b.put(1, 1, x + 6, c, z0 + i, P.woodDark);
    }
    if (i % 6 === 0) {
      b.put(1, 1, x, 18, z0 + i, P.woodDark);
      b.put(1, 1, x + 6, 18, z0 + i, P.woodDark);
    }
  }
  // Trestles, down into the water.
  for (const zz of [z0 + 7, z0 + 15, z0 + 23]) {
    for (const xx of [x + 1, x + 5]) {
      for (let c = -6; c < 15; c++) b.put(1, 1, xx, c, zz, P.woodDark);
    }
    for (let i = 1; i < 6; i++) b.put(1, 1, x + i, 6, zz, P.woodDark);
  }
}

/** The boathouse, down at the water. */
function boathouse(b: Bricks) {
  const x = -84;
  const z = -58;
  const w = 15;
  const d = 11;

  /*
    Small, and off the arrival axis.

    It used to be eighteen studs of dark brown sitting exactly between the
    boat and the castle, so the shot the whole first term is built around was
    a wooden box with a castle behind it. It is a boathouse. It should be the
    thing you have just left, down at the edge of the frame.
  */
  b.slab(x, z, w, d, 0, P.wood, 4);
  b.box(x, z, w, d, 6, 1, P.woodDark);
  // The open mouth, facing the water.
  for (let c = 1; c < 5; c++) {
    for (let i = 4; i < w - 4; i++) b.put(1, 1, x + i, c, z, P.water);
  }
  b.gable(x, z, w, d, 7, P.roof);

  // A jetty running out, and two boats tied to it.
  b.slab(x + w + 1, z + 3, 22, 3, 0, P.wood, 4);
  for (let i = 0; i < 22; i += 4) b.put(1, 1, x + w + 1 + i, 1, z + 3, P.woodDark);
  for (const [bx, bz] of [[x + w + 5, z + 7], [x + w + 14, z + 7]] as const) {
    for (let i = 0; i < 7; i++) {
      const wide = i === 0 || i === 6 ? 1 : 2;
      b.put(1, wide, bx + i, -1, bz, P.woodDark);
    }
    b.put(1, 1, bx + 3, 0, bz, P.gold);
  }
}

/**
 * Three boats on the water, on the line the first term arrives along.
 *
 * The crossing is the one shot in the whole thing that is about being small
 * and outside, and it was being told with a boathouse: a shed. A boat with a
 * lamp in it, out on the water below the rock, says it in one object.
 */
function boats(b: Bricks) {
  const where: [number, number, number][] = [[-14, -76, 0.35], [4, -92, -0.5], [-34, -64, 0.1]];
  for (const [x, z, turn] of where) {
    for (let i = 0; i < 9; i++) {
      const wide = i === 0 || i === 8 ? 1 : 2;
      const dx = Math.cos(turn) * (i - 4);
      const dz = Math.sin(turn) * (i - 4);
      b.put(1, wide, x + dx, -2, z + dz, P.woodDark, turn);
      if (i > 1 && i < 7) b.put(1, wide, x + dx, -1, z + dz, P.wood, turn);
    }
    b.put(1, 1, x + Math.cos(turn) * 3.4, 0, z + Math.sin(turn) * 3.4, P.gold);
  }
}

/** The dark wood along the north-east edge of the grounds. */
function wood(b: Bricks) {
  const trees: [number, number, number][] = [];
  let s = 12345;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 90; i++) {
    const x = 20 + rnd() * 70;
    const z = 68 + rnd() * 44;
    if (x < 30 && z < 78) continue; // leave the bridge landing clear
    trees.push([x, z, 6 + Math.round(rnd() * 9)]);
  }
  for (const [x, z, h] of trees) {
    for (let c = 0; c < 3; c++) b.put(1, 1, x, 15 + c, z, P.woodDark);
    for (let c = 0; c < h; c++) {
      const r = Math.max(0.8, (1 - c / h) * 3.4);
      const per = Math.max(4, Math.round(r * 3));
      for (let i = 0; i < per; i++) {
        const a = (i / per) * Math.PI * 2 + c * 0.6;
        b.put(1, 1, x + Math.cos(a) * r, 18 + c, z + Math.sin(a) * r,
          c > h * 0.6 ? P.greenDark : P.green);
      }
    }
  }
}

/** The courtyard, its cloister and the well in the middle of it. */
function courtyard(b: Bricks) {
  // West of the bridge's abutment, which used to stand in the middle of it,
  // and far enough west that the quad can be looked down end to end.
  const x = -40;
  const z = 14;
  const w = 40;
  const d = 18;

  b.slab(x, z, w, d, 4, P.stoneLight, 8);
  /*
    A cloister is a covered walk, and the covering is the point.

    Laid as a row of free-standing two-by-two columns with a lintel on top it
    read as a ruin: stumps in a field. Springing an arch between each pair and
    roofing the walk behind them turns the same brick count into an arcade.
  */
  for (const side of [0, d - 2]) {
    for (let i = 0; i < w - 4; i += 5) {
      for (let c = 5; c < 11; c++) b.put(2, 2, x + i, c, z + side, P.stone);
      // The arch between this pier and the next.
      for (const [j, c] of [[2, 11], [3, 12], [4, 12], [5, 11]] as const) {
        b.put(1, 2, x + i + j, c, z + side, P.stoneLight);
      }
    }
    b.wall(x, z + side, w - 2, 1, 13, P.stoneDark, 'x', 2);
    // The walk behind the arcade: a back wall, and a lean-to over it. Roofed
    // three studs deep it was two red planks hanging in the air.
    const back = side === 0 ? z - 3 : z + d + 1;
    for (let c = 5; c < 12; c++) b.wall(x, back, w - 2, 1, c, P.stone, 'x');
    b.slab(x, Math.min(back, z + side), w - 2, 5, 12, P.roof, 4);
  }
  // The well, and the water in it.
  b.tower(x + 20, z + 9, 3, 5, 5, P.stoneDark);
  b.slab(x + 18, z + 7, 5, 5, 8, P.water, 4);
  for (const a of [0.5, 3.6]) {
    for (let c = 0; c < 6; c++) {
      b.put(1, 1, x + 20 + Math.cos(a) * 3.4, 10 + c, z + 9 + Math.sin(a) * 3.4, P.woodDark);
    }
  }
  b.wall(x + 17, z + 9, 7, 1, 16, P.woodDark, 'x');
}

/** Every brick in the world, built once. */
export function buildCastle(): Bricks {
  const b = new Bricks();
  crag(b);
  greatHall(b);
  courtyard(b);
  stairHall(b);
  bridge(b);
  boathouse(b);
  boats(b);
  wood(b);

  // The four towers, and the clock on the tallest.
  tower(b, -34, -16, 7, 34, 4);
  tower(b, -34, 10, 7, 28, 4);
  tower(b, 20, -16, 8, 44, 4, P.stone, P.slateDark);
  tower(b, 30, 76, 6, 26, 15, P.stoneDark, P.slate);

  // The clock face.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    b.put(1, 1, 20 + Math.cos(a) * 5.4, 40 + Math.sin(a) * 4, -24.2, P.gold);
  }
  for (let r = 0; r < 5; r++) b.put(1, 1, 20, 40 + r, -24.2, P.gold);
  for (let r = 0; r < 4; r++) b.put(1, 1, 20 + r, 40, -24.2, P.gold);

  return b;
}

/**
 * Seven terms, and where each one happens.
 *
 * The time track is not a slideshow bolted onto a model — each term is a place
 * in the castle as well as a moment in the year, so moving through time moves
 * you through the building.
 */
export const TERMS: Landmark[] = [
  {
    id: 'arrival', name: 'First term · the crossing',
    from: [72, 12, -164], look: [-6, 30, -10],
    note: 'Arriving by water, at night, in a boat somebody else is rowing. The castle is the first thing you see and it is above you.',
  },
  {
    id: 'hall', name: 'First term · the hall',
    from: [-86, 30, -74], look: [-4, 18, -12],
    note: 'Four hundred people under one roof and a ceiling that does not behave. You are sorted into a colour and you keep it.',
  },
  {
    id: 'stairs', name: 'Second term · the stairs',
    from: [106, 50, 70], look: [34, 28, 6],
    note: 'The staircases move. Nobody has ever explained why and after a fortnight nobody asks.',
  },
  {
    id: 'courtyard', name: 'Third term · the courtyard',
    from: [-30, 48, 60], look: [-20, 5, 23],
    note: 'Where everything that is going to happen this year is arranged, badly, by people leaning on the well.',
  },
  {
    id: 'bridge', name: 'Fourth term · the bridge',
    from: [-46, 46, 92], look: [22, 16, 44],
    note: 'Out to the north wing over a drop nobody looks down. In winter it ices and is closed, and in winter is when you most want it.',
  },
  {
    id: 'wood', name: 'Fifth term · the wood',
    from: [116, 52, 150], look: [56, 22, 86],
    note: 'Out of bounds, which has never once stopped anybody. The trees get older the further in you go.',
  },
  {
    id: 'tower', name: 'Seventh term · the clock',
    from: [168, 128, -142], look: [14, 20, 22],
    note: 'The last of it, from the top of the tower, where the whole thing is finally small enough to see at once.',
  },
];
