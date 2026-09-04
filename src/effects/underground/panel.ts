import { Pad, type Pt } from '../flat/pad';
import { rng } from '../cards/ink';
import type { Joke, Kind } from './joke';
import * as S from './scene';

/**
 * One panel.
 *
 * A single-panel cartoon is two things in a fixed relationship: a picture that
 * is not the joke, and a caption that is. Get that backwards — draw the
 * punchline — and the caption becomes a label and the whole thing dies. So the
 * picture here is always the *situation*: a man in a room, a man at a desk, a
 * man on a staircase. The turn happens in the words underneath and nowhere
 * else.
 *
 * Which staging a joke gets is read off its mechanism rather than chosen at
 * random. A joke about paperwork is at a desk; a joke about a party is in a
 * doorway with the light on the other side of it. That is not decoration — it
 * is the reason a thousand panels do not all look like the same panel.
 */

export const ASPECT = 1;
/** Where the picture stops and the caption begins. */
const RULE = 0.735;

const STANCE: Record<Kind, S.Stance[]> = {
  pride: ['stand', 'window'],
  confession: ['seated', 'bow'],
  debt: ['writing', 'stand'],
  slight: ['walk', 'stand'],
  paperwork: ['writing'],
  charity: ['walk', 'stand'],
  god: ['seated'],
  illness: ['seated', 'stand'],
  party: ['stand'],
  letter: ['writing', 'seated'],
  stairs: ['stairs'],
  funeral: ['hat', 'stand'],
};

/**
 * Draw one panel into a context.
 *
 * `w` is the short side and every measurement is a fraction of it, so the same
 * function makes a legible thumbnail and a print.
 */
export function drawPanel(g: CanvasRenderingContext2D, joke: Joke, w: number, h: number) {
  const pad = new Pad(g, w, h, joke.seed);
  const r = rng(joke.seed);
  g.save();
  g.clearRect(0, 0, w, h);
  S.sheet(pad, joke.seed);

  const box: [number, number, number, number] = [0.055, 0.055, 0.945, RULE - 0.03];
  g.save();
  g.beginPath();
  g.rect(box[0] * w, box[1] * h, (box[2] - box[0]) * w, (box[3] - box[1]) * h);
  g.clip();
  // Inside the plate the world gets its own space, one unit wide with its
  // origin at the plate's corner — which is why every scene function can be
  // written as though it had the whole sheet to itself.
  g.translate(box[0] * w, box[1] * h);
  const iw = (box[2] - box[0]) * w;
  const ih = (box[3] - box[1]) * h;
  const inner = new Pad(g, iw, ih, joke.seed);
  scene(inner, joke, r);
  g.restore();

  S.plateMark(pad, box);
  caption(pad, joke, w, h);
  g.restore();
}

/**
 * Where each mechanism can be set.
 *
 * More than one apiece, because a thousand panels drawn from twelve mechanisms
 * with one room each is twelve pictures repeated eighty-three times, and no
 * amount of jitter fixes that. The choice is made from the seed, so the same
 * joke is always in the same room.
 */
const ROOMS: Record<Kind, S.Setting[]> = {
  pride: ['room', 'garret', 'bridge'],
  confession: ['table', 'room', 'corridor'],
  debt: ['desk', 'table', 'corridor'],
  slight: ['street', 'bridge', 'corridor'],
  paperwork: ['desk', 'corridor'],
  charity: ['street', 'bridge', 'corridor'],
  god: ['table', 'garret', 'bridge'],
  illness: ['garret', 'room', 'table'],
  party: ['door', 'stairs'],
  letter: ['desk', 'garret', 'room'],
  stairs: ['stairs', 'corridor'],
  funeral: ['street', 'bridge', 'room'],
};

/**
 * The world behind the man, and the man.
 *
 * Everything a camera would decide is decided here from the seed: how high the
 * horizon sits, how big the figure is against it, where in the frame he
 * stands, and which way he is facing. Those four numbers do more for the
 * variety of a thousand panels than any amount of extra furniture.
 */
function scene(pad: Pad, joke: Joke, r: () => number) {
  const rooms = ROOMS[joke.kind];
  const setting = rooms[Math.floor(r() * rooms.length) % rooms.length];
  // The mechanism suggests a stance and the room has the final say. A seated
  // man is drawn from the waist up with nothing under him, which is only ever
  // right if there is a table in front of him — put him on a bridge like that
  // and he is a man hovering over the Neva, thinking.
  const stances = STANCE[joke.kind];
  let stance = stances[Math.floor(r() * stances.length) % stances.length];

  // The camera. Interiors sit lower in the frame than the outdoor ones do,
  // because a room has a ceiling and a bridge has weather.
  const inside = setting === 'room' || setting === 'garret' || setting === 'table' || setting === 'desk';
  const floor = (inside ? 0.74 : 0.8) + (r() - 0.5) * 0.1;

  // A table is the only thing here the man is *behind*, so it is painted in two
  // passes with him in between. See `S.tableBack`.
  const surface = setting === 'table' ? floor + 0.04 : setting === 'desk' ? floor + 0.06 : 0;

  switch (setting) {
    case 'room':
      S.room(pad, joke.seed, floor);
      break;
    case 'table':
      S.tableBack(pad, joke.seed, surface);
      break;
    case 'desk':
      S.deskBack(pad, joke.seed, surface);
      break;
    case 'street':
      S.street(pad, joke.seed, floor);
      break;
    case 'door':
      S.door(pad, joke.seed, floor + 0.06);
      break;
    case 'stairs':
      S.stairs(pad, joke.seed, floor + 0.1);
      break;
    case 'bridge':
      S.bridge(pad, joke.seed, floor);
      break;
    case 'corridor':
      S.corridor(pad, joke.seed, floor + 0.04);
      break;
    case 'garret':
      S.garret(pad, joke.seed, floor);
      break;
  }

  const table = setting === 'table' || setting === 'desk';
  if (table) stance = stance === 'writing' ? 'writing' : 'seated';
  else if (stance === 'seated' || stance === 'writing') stance = r() < 0.4 ? 'bow' : 'stand';
  else if (setting === 'stairs') stance = 'stairs';
  // Near or far. A man small in a big room is a different joke from the same
  // man filling the frame, and both are the right joke sometimes.
  const near = 0.34 + r() * r() * 0.42;
  const size = table ? 0.52 + near * 0.24 : 0.34 + near * 0.62;
  // Behind a table, where he stands is worked back from where his coat has to
  // *end* — a fraction below the surface — rather than guessed at. A seated
  // figure's hem sits 0.34 of his own height above his feet, and that height
  // varies, so a fixed offset leaves the tall ones hovering over the desk.
  const hem = 0.34 * size * S.look(joke.seed).tall;
  const stand = table ? surface + hem + 0.05 : setting === 'stairs' ? floor - 0.16 : floor;
  const at: Pt = [
    setting === 'door' ? 0.18 + r() * 0.1 : 0.2 + r() * 0.56,
    stand,
  ];

  // Two figures where the joke has two people in it, and the second is always
  // turned away: in this register nobody is ever quite facing anybody.
  const two = joke.kind === 'confession' || joke.kind === 'slight' || joke.kind === 'funeral' || joke.kind === 'debt';
  if (two && r() < 0.62) {
    const gap = (0.2 + r() * 0.16) * (at[0] > 0.5 ? -1 : 1);
    S.pair(pad, at, [at[0] + gap, stand], size, [stance, 'stand'], joke.seed);
  } else {
    S.figure(pad, at, size, stance, joke.seed, r() < 0.38 ? -1 : 1);
  }

  if (setting === 'table') S.tableFront(pad, joke.seed, surface);
  if (setting === 'desk') S.deskFront(pad, joke.seed, surface);
  if (setting === 'street' || setting === 'bridge') S.snow(pad, joke.seed + 5, 0.3);
}

interface Line {
  text: string;
  italic: boolean;
}

/**
 * The caption, typeset.
 *
 * Everything else on this panel is drawn and this is not, on purpose: a
 * single-panel cartoon has *set* type under it, in a face somebody chose, and
 * faking that with pen strokes would be a worse lie than using the type. The
 * rule above it is drawn, though, and it wobbles, because the rule is part of
 * the plate.
 *
 * The setup is roman and the turn is italic, which is the oldest way there is
 * of telling a reader where to slow down.
 */
function caption(pad: Pad, joke: Joke, w: number, h: number) {
  const g = pad.g;
  const base = w * 0.0335;
  g.save();
  g.textAlign = 'center';
  g.textBaseline = 'top';

  const lines: Line[] = [];
  const layout = (text: string, italic: boolean, size: number) => {
    g.font = font(italic, size);
    for (const t of wrap(g, text, w * 0.84)) lines.push({ text: t, italic });
  };
  layout(joke.setup, false, base);
  layout(joke.turn, true, base);

  const lead = base * 1.42;
  const top = h * RULE + w * 0.045;
  const room = h - top - w * 0.05;
  // If it will not fit, set it smaller rather than clipping it. A caption with
  // its last line missing is not a joke, it is a fault.
  const scale = Math.min(1, room / (lines.length * lead));
  const size = base * scale;
  const step = lead * scale;

  let y = top;
  for (const line of lines) {
    g.font = font(line.italic, size);
    g.fillStyle = line.italic ? S.INK : 'rgba(34, 32, 30, 0.82)';
    g.fillText(line.text, w / 2, y);
    y += step;
  }
  g.restore();
}

function font(italic: boolean, size: number) {
  return `${italic ? 'italic ' : ''}400 ${size}px Georgia, "Times New Roman", serif`;
}

function wrap(g: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(' ');
  const out: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (g.measureText(test).width > max && line) {
      out.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) out.push(line);
  return out;
}
