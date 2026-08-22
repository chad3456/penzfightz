/**
 * Keeping a hand of cards actually secret.
 *
 * Everything between browsers goes over one Supabase broadcast channel, and
 * anybody in the room receives every message on it. For Pen Fight that is fine
 * — both pens are on the table in full view. For a card game it is not: if the
 * host simply broadcast the game state, opening devtools would show you every
 * other hand, and Mafia would be over before it started.
 *
 * So each player generates an ECDH keypair on join and publishes the public
 * half. The host derives one AES-GCM key per player and encrypts that player's
 * private slice — their cards, their role — to them alone. Everyone receives
 * the ciphertext; only the intended seat can read it.
 *
 * This protects players from each other, which is the threat that matters at a
 * school desk. It does not protect anyone from a dishonest host, who is running
 * the game and necessarily knows everything. That is the same trust you gave
 * whoever was dealing.
 */

export interface KeyPairJwk {
  privateKey: CryptoKey;
  publicJwk: JsonWebKey;
}

export interface Sealed {
  iv: string;
  data: string;
}

const ALGO = { name: 'ECDH', namedCurve: 'P-256' } as const;

function subtle(): SubtleCrypto | null {
  return typeof crypto !== 'undefined' && crypto.subtle ? crypto.subtle : null;
}

/** True when this browser can do the handshake at all. */
export const canEncrypt = Boolean(subtle());

const b64 = {
  from(buf: ArrayBuffer): string {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  },
  to(str: string): Uint8Array<ArrayBuffer> {
    const bin = atob(str);
    const out = new Uint8Array(new ArrayBuffer(bin.length));
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  },
};

export async function makeKeyPair(): Promise<KeyPairJwk | null> {
  const s = subtle();
  if (!s) return null;
  const pair = await s.generateKey(ALGO, false, ['deriveKey']);
  const publicJwk = await s.exportKey('jwk', pair.publicKey);
  return { privateKey: pair.privateKey, publicJwk };
}

/** Derive the shared AES-GCM key for one peer. */
export async function sharedKey(
  mine: CryptoKey,
  theirPublicJwk: JsonWebKey,
): Promise<CryptoKey | null> {
  const s = subtle();
  if (!s) return null;
  try {
    const theirs = await s.importKey('jwk', theirPublicJwk, ALGO, false, []);
    return await s.deriveKey(
      { name: 'ECDH', public: theirs },
      mine,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  } catch {
    return null;
  }
}

export async function seal(key: CryptoKey, value: unknown): Promise<Sealed | null> {
  const s = subtle();
  if (!s) return null;
  try {
    const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    const data = await s.encrypt({ name: 'AES-GCM', iv }, key, bytes);
    return { iv: b64.from(iv.buffer), data: b64.from(data) };
  } catch {
    return null;
  }
}

export async function open<T>(key: CryptoKey, sealed: Sealed): Promise<T | null> {
  const s = subtle();
  if (!s) return null;
  try {
    const iv = b64.to(sealed.iv);
    const data = b64.to(sealed.data);
    const plain = await s.decrypt({ name: 'AES-GCM', iv }, key, data);
    return JSON.parse(new TextDecoder().decode(plain)) as T;
  } catch {
    // Not addressed to us, or a stale key after a rejoin. Either way, ignore.
    return null;
  }
}
