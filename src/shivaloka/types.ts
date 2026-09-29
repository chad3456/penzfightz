/** Shiva Loka: the shapes of the data. */

export type Kind = 'jyotirlinga' | 'linga' | 'shakti' | 'krishna';

/** The land a level is built on. */
export type Biome = 'coast' | 'river' | 'snow' | 'hills' | 'forest' | 'city' | 'island' | 'plains' | 'desert';

/** How the temple is built. */
export type Style = 'nagara' | 'dravida' | 'himalayan' | 'cave' | 'kalinga' | 'rock' | 'pagoda' | 'bengal' | 'kerala' | 'hemadpanti' | 'modern' | 'natural' | 'haveli';

/**
 * What the pilgrim does to earn the darshan.
 * - lamps: light lamps in order
 * - offer: gather offerings and bring them to the shrine
 * - water: fetch water from the river or tank, one pot at a time
 * - trek: climb to the shrine with a stamina that altitude drains
 * - demon: hold off the demon of the story
 * - bells: ring the bells in time
 * - carry: carry something to the shrine without letting it tip
 * - quiz: answer questions about the story
 */
export type TaskKind = 'lamps' | 'offer' | 'water' | 'trek' | 'demon' | 'bells' | 'carry' | 'quiz';

export interface Task {
  kind: TaskKind;
  title: string;
  detail: string;
  count?: number;
  item?: 'lamp' | 'jasmine' | 'lotus' | 'bilva' | 'clay' | 'flower' | 'hibiscus' | 'butter' | 'pot' | 'tulsi' | 'sweet';
  foe?: string;
}

export interface Site {
  id: string;
  kind: Kind;
  name: string;
  /** The name in Devanagari. */
  sa?: string;
  place: string;
  lat: number;
  lon: number;
  /** Retold, in our own words. */
  story: string;
  /** Where the story is told. */
  source: string;
  /** For the time-lapse: [when, what happened]. */
  timeline?: [string, string][];
  biome: Biome;
  style: Style;
  /** 1 (a walk in town) to 5 (a Himalayan climb). */
  difficulty: 1 | 2 | 3 | 4 | 5;
  task: Task;
  quiz?: [string, string[], number][];
  /** Shakti Peethas: the part of Sati, her form and her Bhairava. */
  peetha?: { part: string; shakti: string; bhairava: string };
}
