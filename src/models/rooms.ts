/** Small shared things for cutaway-room plates: putting people in a PRoom. */
import { type G, Scene } from '../walks/kit';
import { person, type Look, type Fig } from '../walks/people';
import { PRoom } from '../walks/pers';
import { type Who } from '../walks/stage';

export interface RP { look: Look; pose: Fig['pose']; turn: number; back?: boolean; who?: [string, string]; hold?: Fig['hold']; over?: Fig['over']; mood?: Fig['face']; eyes?: Fig['eyes']; scale?: number; lw?: number }
export function rp(sc: Scene, R: PRoom, who: Who[], X: number, d: number, Z: number, o: RP, depth?: number) {
  sc.add(depth ?? d, () => {
    const [x, y] = R.p(X, d, Z), s = R.fig(d) * (o.scale ?? 1);
    const J = person(sc.g!, { x, y, s, turn: o.turn, back: o.back, look: o.look, pose: o.pose, lw: o.lw ?? 2, hold: o.hold, over: o.over, face: o.mood, eyes: o.eyes, anchor: o.pose.sit ? 'seat' : 'feet' });
    if (o.who) who.push({ x: J.H[0], y: (J.H[1] + J.P[1]) / 2, r: Math.max(34, s * 28), name: o.who[0], line: o.who[1] });
  });
}
/** Words painted on a room's back wall, centred at (X, Z). */
export function backText(g: G, R: PRoom, X: number, Z: number, text: string, size: number, font: string, col: string) {
  const [x, y] = R.p(X, 0, Z), k = R.k(0) / R.ppc; g.font = font.replace('{s}', String(Math.round(size * k))); g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x, y); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}
export { PRoom, Scene };
