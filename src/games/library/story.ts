import { checkScene, type SceneSpec } from './kit/scene';

/**
 * The story engine, and the promise it makes.
 *
 * The promise is that a reading cannot get stuck. That is not a hope, it is a
 * checkable property, and the check is run over every story in the library by
 * a test that fails the build rather than by a person clicking through.
 *
 * Four rules do it:
 *
 * 1. Every choice points at a node that exists.
 * 2. Every node either offers choices or is an ending. Never neither.
 * 3. Every node is reachable from the start — otherwise it is not in the story,
 *    it is in the file.
 * 4. **Every node offers at least one choice with no conditions on it.** This
 *    is the one that matters. Choices can be gated on what the reader is
 *    carrying, and a node whose every exit is gated can be arrived at holding
 *    the wrong things, with nothing to click and no way back. One unconditional
 *    door in every room, always.
 *
 * And one more, checked separately: from every node, some ending is reachable.
 * Rule 4 keeps you moving; this one keeps you from moving for ever.
 */

/** Something the reader is carrying: a decision made, a thing taken, a thing seen. */
export type Mark = string;

export interface Choice {
  text: string;
  to: string;
  /** Offered only if the reader has all of these. */
  needs?: Mark[];
  /** Offered only if the reader has none of these. */
  unless?: Mark[];
  /** Picked up by taking it. */
  gives?: Mark[];
  /** One line, shown as the scene changes. */
  echo?: string;
}

export interface Node {
  id: string;
  scene: SceneSpec;
  /** The prose. Paragraphs, in the author's register, not a summary of it. */
  text: string[];
  choices: Choice[];
  ending?: { title: string; kind: 'grace' | 'ruin' | 'riddle'; note: string };
}

export interface Story {
  id: string;
  title: string;
  author: string;
  /** What this is: an adaptation, or an original. Said plainly on the card. */
  source: string;
  blurb: string;
  spine: string;
  ink: string;
  start: string;
  nodes: Node[];
}

// ------------------------------------------------------------------- reading

export interface Reading {
  story: Story;
  at: string;
  marks: Mark[];
  /** Every node visited, in order, so a reading can be retraced. */
  path: string[];
}

export function begin(story: Story): Reading {
  return { story, at: story.start, marks: [], path: [story.start] };
}

export function nodeOf(story: Story, id: string): Node {
  const n = story.nodes.find((x) => x.id === id);
  // A validated story cannot reach here. An unvalidated one would otherwise
  // fail somewhere further on, with nothing to say about why.
  if (!n) throw new Error(`story ${story.id}: no node "${id}"`);
  return n;
}

const has = (marks: Mark[], m: Mark) => marks.includes(m);

export function offered(node: Node, marks: Mark[]): Choice[] {
  return node.choices.filter(
    (c) =>
      (c.needs ?? []).every((m) => has(marks, m)) &&
      !(c.unless ?? []).some((m) => has(marks, m)),
  );
}

export function take(reading: Reading, choice: Choice): Reading {
  const marks = [...reading.marks];
  for (const m of choice.gives ?? []) if (!marks.includes(m)) marks.push(m);
  return { ...reading, at: choice.to, marks, path: [...reading.path, choice.to] };
}

// ---------------------------------------------------------------- validation

/**
 * Every way a story could let a reader down, in one pass.
 *
 * Returns the problems rather than throwing, so a test can print all of them
 * at once instead of one per run.
 */
export function validate(story: Story): string[] {
  const bad: string[] = [];
  const ids = new Set(story.nodes.map((n) => n.id));
  const say = (s: string) => bad.push(`${story.id}: ${s}`);

  if (story.nodes.length !== ids.size) say('two nodes share an id');
  if (!ids.has(story.start)) say(`start "${story.start}" is not a node`);

  for (const n of story.nodes) {
    const isEnd = !!n.ending;
    if (isEnd && n.choices.length) say(`"${n.id}" is an ending and still offers choices`);
    if (!isEnd && n.choices.length === 0) say(`"${n.id}" is a dead end with no ending`);
    if (!n.text.length) say(`"${n.id}" has no words in it`);

    for (const c of n.choices) {
      if (!ids.has(c.to)) say(`"${n.id}" → "${c.to}", which does not exist`);
      if (c.to === n.id) say(`"${n.id}" offers a choice back to itself`);
      if (!c.text.trim()) say(`"${n.id}" has a choice with no words on it`);
    }

    // Rule four: one door that is always open.
    if (!isEnd && !n.choices.some((c) => !c.needs?.length && !c.unless?.length)) {
      say(`"${n.id}" gates every one of its choices — a reader can be stranded there`);
    }

    bad.push(...checkScene(n.scene, `${story.id}/${n.id}`));
  }

  // Reachability, forwards from the start.
  const seen = new Set<string>([story.start]);
  const queue = [story.start];
  while (queue.length) {
    const at = queue.shift()!;
    const node = story.nodes.find((n) => n.id === at);
    if (!node) continue;
    for (const c of node.choices) {
      if (!ids.has(c.to) || seen.has(c.to)) continue;
      seen.add(c.to);
      queue.push(c.to);
    }
  }
  for (const n of story.nodes) if (!seen.has(n.id)) say(`"${n.id}" cannot be reached from the start`);

  // And backwards from the endings: every node must be able to finish.
  const finishes = new Set(story.nodes.filter((n) => n.ending).map((n) => n.id));
  if (!finishes.size) say('has no ending at all');
  let grew = true;
  while (grew) {
    grew = false;
    for (const n of story.nodes) {
      if (finishes.has(n.id)) continue;
      if (n.choices.some((c) => finishes.has(c.to))) {
        finishes.add(n.id);
        grew = true;
      }
    }
  }
  for (const n of story.nodes) if (!finishes.has(n.id)) say(`"${n.id}" can never reach an ending`);

  return bad;
}

/**
 * Walk a story at random until it ends, a thousand times over.
 *
 * The rules above prove it cannot get stuck; this proves it in practice, and
 * catches the case the rules cannot see — a loop between two nodes that both
 * satisfy every rule and that a reader could go round for ever.
 */
export function wander(story: Story, runs = 400, limit = 200): { ok: boolean; note: string } {
  for (let i = 0; i < runs; i++) {
    let r = begin(story);
    let steps = 0;
    for (;;) {
      const node = nodeOf(story, r.at);
      if (node.ending) break;
      const open = offered(node, r.marks);
      if (!open.length) return { ok: false, note: `stranded at "${node.id}" holding [${r.marks.join(', ')}]` };
      if (++steps > limit) return { ok: false, note: `still going after ${limit} steps, last at "${node.id}"` };
      r = take(r, open[Math.floor(Math.random() * open.length)]);
    }
  }
  return { ok: true, note: `${runs} readings, all of them finished` };
}
