/** What a topic in the Body Atlas is made of. */
export type ChapterId = 'body' | 'heart' | 'vessels' | 'blood' | 'brain' | 'nerves' | 'lungs' | 'digest' | 'kidney' | 'immune' | 'viruses' | 'bacteria' | 'cancer' | 'cells' | 'genes' | 'bones' | 'senses' | 'hormones';
export interface Part { id: string; label: string; text: string }
export interface Step { label: string; text: string }
export interface Control { id: string; label: string; min: number; max: number; step?: number; value: number; unit?: string }
export interface Topic {
  id: string; ch: ChapterId; title: string; sub: string;
  /** which 3D engine draws it, and how */
  kind: string; p?: Record<string, unknown>;
  /** backdrop colour and the direction the camera looks from */
  bg?: string; view?: [number, number, number];
  /** the explanation, in a few short paragraphs */
  body: string;
  parts: Part[]; steps?: Step[]; controls?: Control[]; facts?: string[];
  /** keys into the verified reference list */
  refs?: string[];
  /** a PubMed search for further reading */
  q?: string;
}
export interface Chapter { id: ChapterId; title: string; blurb: string; color: string; icon: string }
