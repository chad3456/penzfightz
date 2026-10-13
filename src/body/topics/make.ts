/** Shorthand for writing topics: parts and steps as tuples, controls as calls. */
import type { ChapterId, Control, Topic } from '../types';

type Extra = Omit<Partial<Topic>, 'steps' | 'parts'> & { steps?: [string, string][] };
export function chapter(ch: ChapterId) {
  return (id: string, title: string, sub: string, kind: string, p: Record<string, unknown>, body: string, parts: [string, string, string][], x: Extra = {}): Topic => ({
    ...x, id, ch, title, sub, kind, p, body,
    parts: parts.map(([pid, label, text]) => ({ id: pid, label, text })),
    steps: x.steps?.map(([label, text]) => ({ label, text })),
  });
}
export const ctl = (id: string, label: string, min: number, max: number, value: number, step = 1, unit = ''): Control => ({ id, label, min, max, value, step, unit });
export const CUT = ctl('cut', 'Cut away', 0, 1, 0, 0.01);
