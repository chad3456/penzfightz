/**
 * One input for both the map and the levels: arrow keys or WASD to move,
 * Space or E for the action; on a phone, a thumb joystick and an action
 * button write into the same place.
 */
export class Input {
  /** −1…1 on each axis: x right, y forward (up the screen). */
  move = { x: 0, y: 0 };
  /** The joystick's share of it, set by the on-screen stick. */
  stick = { x: 0, y: 0 };
  private keys = new Set<string>();
  private pressed = new Set<string>();
  /** Actions pressed since the last frame (Space/E, or the button). */
  private queued = 0;
  private down = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (!this.keys.has(k)) this.pressed.add(k);
    this.keys.add(k);
    if ((k === ' ' || k === 'e' || k === 'enter') && !e.repeat) this.queued++;
  };
  private up = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
  private blur = () => this.keys.clear();

  constructor() {
    window.addEventListener('keydown', this.down);
    window.addEventListener('keyup', this.up);
    window.addEventListener('blur', this.blur);
  }

  /** Call once a frame. */
  poll() {
    const k = this.keys;
    let x = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0);
    let y = (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0);
    x += this.stick.x;
    y += this.stick.y;
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    this.move.x = x;
    this.move.y = y;
    const a = this.queued;
    this.queued = 0;
    const p = new Set(this.pressed);
    this.pressed.clear();
    return { action: a > 0, pressed: p, shift: k.has('shift') };
  }

  press() { this.queued++; }

  dispose() {
    window.removeEventListener('keydown', this.down);
    window.removeEventListener('keyup', this.up);
    window.removeEventListener('blur', this.blur);
  }
}
