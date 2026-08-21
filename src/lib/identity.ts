/**
 * Who you are, with no login screen.
 *
 * A pen fight never asked for a password. The browser keeps a uuid and a
 * nickname in localStorage; the server hands that id a row in `players` the
 * first time it turns up. Clear your storage and you are a new kid in class,
 * which is a fair trade for never having to sign up.
 */

const ID_KEY = 'penfight.player.id';
const NAME_KEY = 'penfight.player.name';
const PEN_KEY = 'penfight.player.pen';
const OWNED_KEY = 'penfight.player.owned';

const CLASS_NAMES = [
  'Laddu', 'Bunty', 'Chintu', 'Guddu', 'Pinky', 'Rinku', 'Golu', 'Munna',
  'Sonu', 'Tinku', 'Babli', 'Chotu', 'Raju', 'Dolly', 'Happy', 'Bittu',
];

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private browsing; the session just will not persist */
  }
}

export function playerId(): string {
  let id = read(ID_KEY);
  if (!id) {
    id = uuid();
    write(ID_KEY, id);
  }
  return id;
}

export function playerName(): string {
  let name = read(NAME_KEY);
  if (!name) {
    name = CLASS_NAMES[Math.floor(Math.random() * CLASS_NAMES.length)];
    write(NAME_KEY, name);
  }
  return name;
}

export function setPlayerName(name: string) {
  const clean = name.trim().slice(0, 18);
  if (clean) write(NAME_KEY, clean);
}

export function localPen(): string | null {
  return read(PEN_KEY);
}

export function setLocalPen(penId: string) {
  write(PEN_KEY, penId);
}

export function localOwned(): string[] | null {
  const raw = read(OWNED_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p) => typeof p === 'string') : null;
  } catch {
    return null;
  }
}

export function setLocalOwned(pens: string[]) {
  write(OWNED_KEY, JSON.stringify([...new Set(pens)]));
}

export function suggestName(): string {
  return CLASS_NAMES[Math.floor(Math.random() * CLASS_NAMES.length)];
}
