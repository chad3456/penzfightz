import { Frame, bubble, flying, human, witch, owl, cloud, bird, house } from './art';
import { letter, line, arc, smooth, type Pen, type P } from './pen';

/**
 * THE AGREEABLE CITY — Hazel Mothwick's second assignment. Earth, 2026: a
 * city run by the Bureau of Agreement, where cameras watch every corner, the
 * Kindly Uncle smiles from every screen, and the streets are full of people
 * who have stopped agreeing. Hazel has to fit in — cap on, hat in the bag,
 * nod when the screens say NOD — while she quietly saves the place.
 *
 * An original allegory: no real country, party or person. The Bureau's red
 * is the only colour it owns; Hazel's spells are the only gold.
 */

const RED = '#c0392b', GOLD = '#e0a800', WASH = 'rgba(20,20,20,0.045)';
const WORLD = 11000;

type Spell = 'cozy' | 'unmute' | 'calm' | 'birds' | 'flowers' | 'truth' | 'mirror';
const COST: Record<Spell, number> = { cozy: 20, unmute: 14, calm: 24, birds: 9, flowers: 14, truth: 28, mirror: 0 };

interface Cam { x: number; h: number; ph: number; cozy: number; on: boolean }
interface Screen { x: number; h: number; w: number; truth: boolean; big?: boolean }
interface Marcher { x: number; sign: number; open: boolean; calm: number; kind: 'a' | 'b' | 'c'; sp: number }
interface Proj { x: number; y: number; vx: number; vy: number; kind: 'stone' | 'can'; bird: boolean; life: number }
interface Fire { x: number; out: boolean; t: number }
interface Page { x: number; y: number; got: boolean; lost: boolean; text: number }
interface Drone { x0: number; y: number; ph: number; span: number }
interface Person { x: number; kind: 'child' | 'old' | 'dog'; hurt: number }

export interface District { name: string; x0: number; x1: number; goal: string[]; enter: string; dispatch: [string, string] }

export const DISTRICTS: District[] = [
  { name: 'THE SQUARE OF CONSENSUS', x0: 0, x1: 2300, goal: ['Nod when the screens say NOD (2)', 'Knit a sock over a camera'],
    enter: 'RULE ONE OF FITTING IN: DO WHAT THE SCREEN DOES, A SECOND LATER. AND HIDE THE HAT.',
    dispatch: ['HOW TO NOD', 'Nobody here is cruel. Everybody here is watched. They nod together, a second after the screen, and look at the pavement. I learned to nod. I also learned that a camera in a woolly sock sees nothing but wool.'] },
  { name: 'BREAD STREET', x0: 2300, x1: 4700, goal: ['Unmute 6 taped-up signs', 'Calm the march (anger low)'],
    enter: 'THE BREAD COSTS THREE TIMES WHAT THE SCREENS SAY. THE SIGNS ARE TAPED SHUT. A SIGN THAT CANNOT SPEAK IS JUST A PLANK.',
    dispatch: ['BREAD, NOT SLOGANS', 'The march wanted three things: bread they could afford, to be allowed to say so, and for someone to look at them. The Bureau sent shields. I sent the signs their voices back, and asked everyone, shields included, to breathe out.'] },
  { name: 'THE RECORDS OFFICE', x0: 4700, x1: 7000, goal: ['Rescue 8 true pages before the Forgetting Chute eats them'],
    enter: 'THEY ARE REWRITING YESTERDAY. I LIKED YESTERDAY. IT HAD BREAD IN IT.',
    dispatch: ['YESTERDAY, RESCUED', 'Rows of tired clerks retype last week until it agrees with this week. The originals go down a chute into a furnace. I caught eight pages on the way down. They say small true things. Small true things are the hardest to burn.'] },
  { name: 'THE BRIDGE', x0: 7000, x1: 9600, goal: ['Turn 10 missiles into birds', 'Put out every fire', 'Calm both sides'],
    enter: 'NOBODY ON THIS BRIDGE WANTS TO HURT ANYONE. EVERYBODY ON THIS BRIDGE IS ABOUT TO.',
    dispatch: ['THE RIOT SAT DOWN', 'One side threw stones; the other threw canisters. In the middle, a child with a balloon, an old man with his shopping, a woman with a very confused dog. The stones became sparrows, the fires became marigolds, and after a while somebody brought soup. Nobody won. Everybody went home.'] },
  { name: 'THE TOWER OF THE KINDLY UNCLE', x0: 9600, x1: WORLD, goal: ['Fly up past the drones', 'Turn the Uncle into a mirror'],
    enter: 'THE UNCLE LIVES AT THE TOP. EVERYONE LOOKS UP AT HIM. NOBODY LOOKS ACROSS AT EACH OTHER.',
    dispatch: ['THE CITY LOOKED UP', 'I did not defeat anyone. I changed one screen into a mirror, and then every screen in the city showed the street it was on. People saw each other: tired, angry, kind, ordinary. Some of them argued. It was wonderful.'] },
];

export const POSTERS = ['SMILE: YOU ARE BEING HELPED', 'AGREEMENT IS SAFETY', 'WHY ASK? WE KNOW.', 'YESTERDAY IS UNDER REVIEW', 'A QUIET CITY IS A HAPPY CITY', 'REPORT SADNESS', 'YOUR SCORE LOVES YOU', 'BREAD IS CHEAPER THAN EVER', 'LOOK DOWN. WALK ON.', 'THE UNCLE IS LISTENING (KINDLY)'];
export const SIGNS = ['LET US SPEAK', 'BREAD NOT SLOGANS', 'WE REMEMBER YESTERDAY', 'STOP COUNTING US', 'WE ARE NOT A SCORE', 'TRUTH IS NOT A RUMOUR', 'THE AIR IS HOT, THE NEWS IS COLD', 'LOOK UP', 'ASK US', 'WE CAN\'T EAT PROMISES'];
export const PAGES = ['BREAD WAS TWO COINS LAST WEEK', 'THERE WAS A PROTEST. IT WAS PEACEFUL', 'THE RIVER WAS CLEAN IN MAY', 'NOBODY VOTED FOR THE UNCLE', 'THE LIBRARY OPENED ON SUNDAYS', 'MRS. OKAFOR WAS RIGHT', 'THE HEATWAVE WAS REAL', 'WE USED TO TALK ON BUSES', 'THE SCHOOL HAD A CHOIR', 'THE BRIDGE HAD A NAME'];
export const BROADCASTS = ['THERE IS NO PROTEST. PLEASE STOP PROTESTING.', 'TODAY\'S WEATHER: AGREEABLE', 'BREAD PRICES ARE LOWER THAN EVER', 'REMEMBER: SADNESS IS A RUMOUR', 'THANK YOU FOR NOT ASKING'];

export interface Input { left: boolean; right: boolean; up: boolean; down: boolean }

export class AgreeableCity {
  // hazel
  x = 220; y = 0; vx = 0; vy = 0; face = 1; broom = false; disguise = true; ground = true;
  ink = 100; sus = 0; nodT = 0;
  // world
  cams: Cam[] = []; screens: Screen[] = []; posters: { x: number; h: number; i: number }[] = [];
  march: Marcher[] = []; police1: number[] = []; anger1 = 0.7;
  projs: Proj[] = []; fires: Fire[] = []; rioters: number[] = []; police3: number[] = []; angerL = 0.85; angerR = 0.8; people: Person[] = [];
  pages: Page[] = []; pageT = 0;
  drones: Drone[] = [];
  district = 0; cleared = [false, false, false, false, false];
  // counters
  nods = 0; cozies = 0; birds = 0; mirrored = false; mirrorT = 0;
  // events
  nodWindow = 0; nextNod = 9; nodded = false; broadcast = 0; nodFail = 0;
  caughtT = 0; caughtCount = 0;
  says: { text: string; t: number }[] = [];
  card: { title: string; body: string; n: number } | null = null; cardT = 0;
  zaps: { x0: number; y0: number; x1: number; y1: number; t: number; spell: Spell }[] = [];
  flowers: { x: number; y: number; t: number }[] = [];
  birdsFly: { x: number; y: number; vx: number; vy: number; t: number }[] = [];
  camX = 0; camY = 0; t = 0; seen = false; conceal = 1;
  ended = false;
  onCleared: (d: number) => void = () => {};
  sfx: (k: 'zap' | 'alarm' | 'nod' | 'clear' | 'caught' | 'page') => void = () => {};

  constructor() {
    const R = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    // cameras on poles
    for (const x of [700, 1600, 2900, 3900, 5150, 5850, 6550, 7550, 8950]) this.cams.push({ x, h: x > 4700 && x < 7000 ? 330 : 270, ph: R() * 6, cozy: 0, on: true });
    for (const [x, h, w, big] of [[1100, 300, 230, true], [1950, 260, 160, false], [3400, 280, 180, false], [5550, 290, 200, false], [8200, 300, 190, false]] as [number, number, number, boolean][]) this.screens.push({ x, h, w, truth: false, big });
    for (let x = 300; x < 9500; x += 330 + R() * 160) if (!(x > 4650 && x < 9700)) this.posters.push({ x, h: 120 + R() * 60, i: Math.floor(R() * POSTERS.length) });
    for (let i = 0; i < 14; i++) this.march.push({ x: 2450 + i * 122 + R() * 14, sign: i % SIGNS.length, open: false, calm: 0, kind: (['a', 'b', 'c'] as const)[i % 3], sp: 0.8 + R() * 0.4 });
    for (let i = 0; i < 5; i++) this.police1.push(4380 + i * 46);
    for (let i = 0; i < 6; i++) this.rioters.push(7250 + i * 70);
    for (let i = 0; i < 6; i++) this.police3.push(8850 + i * 60);
    for (let i = 0; i < 6; i++) this.fires.push({ x: 7200 + i * 240 + R() * 80, out: false, t: R() * 6 });
    this.people = [{ x: 8020, kind: 'child', hurt: 0 }, { x: 8190, kind: 'old', hurt: 0 }, { x: 8360, kind: 'dog', hurt: 0 }];
    for (let i = 0; i < 5; i++) this.drones.push({ x0: 10200 + (i % 2 ? 140 : -140), y: 260 + i * 210, ph: R() * 6, span: 170 });
    this.say(DISTRICTS[0].enter, 6);
    this.say('ARROWS TO WALK. H: HAT OR CAP. B: BROOM. N: NOD. CLICK THINGS TO CAST.', 7);
  }

  say(text: string, t = 4.5) { this.says.push({ text, t }); if (this.says.length > 2) this.says.shift(); }

  get goalDone(): boolean[] {
    switch (this.district) {
      case 0: return [this.nods >= 2, this.cozies >= 1];
      case 1: return [this.march.filter((m) => m.open).length >= 6, this.anger1 < 0.3];
      case 2: return [this.pages.filter((p) => p.got).length >= 8];
      case 3: return [this.birds >= 10, this.fires.every((f) => f.out), this.angerL < 0.2 && this.angerR < 0.2];
      default: return [this.y > 1150, this.mirrored];
    }
  }
  progress(d: number) {
    if (d === 1) return `${this.march.filter((m) => m.open).length}/6 signs · anger ${Math.round(this.anger1 * 100)}%`;
    if (d === 2) return `${this.pages.filter((p) => p.got).length}/8 pages`;
    if (d === 3) return `${this.birds}/10 birds · ${this.fires.filter((f) => f.out).length}/6 fires · anger ${Math.round(this.angerL * 100)}% / ${Math.round(this.angerR * 100)}%`;
    if (d === 0) return `${this.nods}/2 nods · ${this.cozies}/1 sock`;
    return this.y > 1150 ? 'at the top' : `height ${Math.round(this.y)} / 1150`;
  }

  // ------------------------------------------------------------------ simulation
  update(dt: number, inp: Input) {
    this.t += dt;
    const t = this.t;
    if (this.ended) { this.mirrorT += dt; this.stepBirds(dt); return; }
    if (this.caughtT > 0) { this.caughtT -= dt; if (this.caughtT <= 0) this.release(); return; }
    if (this.cardT > 0) this.cardT -= dt;
    this.says.forEach((s) => (s.t -= dt)); this.says = this.says.filter((s) => s.t > 0);

    // move
    const gate = this.cleared[this.district] || this.district === 4 ? WORLD - 60 : DISTRICTS[this.district].x1 - 40;
    if (this.broom) {
      const ax = (inp.right ? 1 : 0) - (inp.left ? 1 : 0), ay = (inp.up ? 1 : 0) - (inp.down ? 1 : 0);
      this.vx += ax * 1100 * dt; this.vy += ay * 1100 * dt;
      this.vx *= 1 - Math.min(1, dt * 2.6); this.vy *= 1 - Math.min(1, dt * 3);
      this.vy += Math.sin(t * 2) * 8 * dt;
    } else {
      const ax = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      this.vx = ax * 190;
      if (inp.up && this.ground) { this.vy = 430; this.ground = false; }
      this.vy -= 1100 * dt;
    }
    if (Math.abs(this.vx) > 10) this.face = this.vx > 0 ? 1 : -1;
    this.x = Math.max(60, Math.min(gate, this.x + this.vx * dt));
    this.y += this.vy * dt;
    const ceiling = this.x > 9900 && this.x < 10500 ? 1420 : this.x > 4700 && this.x < 7000 ? 430 : 900;
    if (this.y > ceiling) { this.y = ceiling; this.vy = Math.min(0, this.vy); }
    if (this.y <= 0) { this.y = 0; this.vy = 0; this.ground = true; } else if (!this.broom) this.ground = false;
    // district bookkeeping
    const d = DISTRICTS.findIndex((q) => this.x >= q.x0 && this.x < q.x1);
    if (d > this.district) { this.district = d; this.say(DISTRICTS[d].enter, 7); }

    this.ink = Math.min(100, this.ink + 7 * dt);
    this.nodT = Math.max(0, this.nodT - dt);
    for (const c of this.cams) c.cozy = Math.max(0, c.cozy - dt);

    // the Bureau's eyes
    this.conceal = 1;
    if (this.ground && this.district === 1) { const xs = this.march.map((m) => m.x); if (this.x > Math.min(...xs) - 50 && this.x < Math.max(...xs) + 50) this.conceal = 0.25; }
    this.seen = this.watched();
    const rate = this.broom ? 38 : this.disguise ? 2 : 14;
    if (this.seen) this.sus += rate * this.conceal * dt; else this.sus -= 7 * dt;

    // the daily nod
    this.nextNod -= dt;
    if (this.nextNod <= 0 && this.nodWindow <= 0) { this.nodWindow = 2.8; this.nodded = false; this.sfx('alarm'); }
    if (this.nodWindow > 0) {
      this.nodWindow -= dt;
      if (this.nodWindow <= 0) {
        this.nextNod = 16 + Math.random() * 10;
        if (!this.nodded && (this.seen || this.screens.some((s) => Math.abs(s.x - this.x) < 1000 && !s.truth) || this.district === 0)) {
          this.sus += 26 * this.conceal; this.say('...I FORGOT TO NOD. EVERYONE NOTICED THAT I FORGOT TO NOD.', 4); this.nodFail++;
        }
      }
    }
    this.broadcast = Math.floor(t / 7) % BROADCASTS.length;
    this.sus = Math.max(0, this.sus);
    if (this.sus >= 100) this.caught();

    // Bread Street: the march walks to the shields
    if (this.district >= 1) {
      for (const m of this.march) { if (m.x < 3050 + this.march.indexOf(m) * 122) m.x += 14 * m.sp * dt * (this.x > 2300 ? 1 : 0); m.calm = Math.max(0, m.calm - dt); }
      const gagged = this.march.filter((m) => !m.open).length;
      if (!this.cleared[1]) this.anger1 = Math.min(1, this.anger1 + (gagged > 6 ? 0.012 : -0.004) * dt * 10 / 10);
      if (this.anger1 > 0.6 && Math.random() < dt * 0.6 * this.anger1 && Math.abs(this.x - 4000) < 900) this.throwOne(4250, 4380, 'stone');
    }
    // the Records Office: pages fly to the chute
    if (this.district === 2 || (this.x > 4500 && this.x < 7100)) {
      this.pageT -= dt;
      const live = this.pages.filter((p) => !p.got && !p.lost).length;
      if (this.pageT <= 0 && live < 5 && this.pages.filter((p) => p.got).length < 8) { this.pageT = 2.2; this.pages.push({ x: 4850 + Math.random() * 1500, y: 140 + Math.random() * 120, got: false, lost: false, text: this.pages.length % PAGES.length }); }
      for (const p of this.pages) {
        if (p.got || p.lost) continue;
        p.x += 34 * dt; p.y += Math.sin(t * 2 + p.text) * 22 * dt;
        if (p.x > 6720) { p.lost = true; continue; }
        if (Math.hypot(p.x - this.x, p.y - (this.y + 70)) < 60) { p.got = true; this.sfx('page'); this.say(`PAGE: "${PAGES[p.text]}"`, 4); }
      }
    }
    // the Bridge
    if (this.district === 3 && !this.cleared[3]) {
      if (Math.random() < dt * 1.2 * this.angerL) this.throwOne(this.rioters[Math.floor(Math.random() * 6)], 8900, 'stone');
      if (Math.random() < dt * 1.0 * this.angerR) this.throwOne(this.police3[Math.floor(Math.random() * 6)], 7500, 'can');
      for (const f of this.fires) f.t += dt;
      this.angerL = Math.max(0, this.angerL - 0.004 * dt); this.angerR = Math.max(0, this.angerR - 0.004 * dt);
    }
    for (const p of this.projs) {
      p.life += dt;
      if (p.bird) continue;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 420 * dt;
      if (p.y < 0) {
        p.y = -999;
        for (const q of this.people) if (Math.abs(q.x - p.x) < 40) { q.hurt = 4; this.say(q.kind === 'child' ? 'THE CHILD IS CRYING. NOBODY MEANT IT. IT HAPPENED ANYWAY.' : 'SOMEONE IN THE MIDDLE GOT HIT. THE MIDDLE ALWAYS GETS HIT.', 4); }
        if (p.kind === 'stone' && Math.random() < 0.35 && this.district === 3) { const f = this.fires.find((q) => q.out && Math.abs(q.x - p.x) < 300); if (f) { f.out = false; f.t = 0; } }
      }
    }
    this.projs = this.projs.filter((p) => p.y > -900 && p.life < 8);
    for (const q of this.people) q.hurt = Math.max(0, q.hurt - dt);
    this.stepBirds(dt);
    this.flowers.forEach((f) => (f.t += dt));
    this.zaps.forEach((z) => (z.t += dt)); this.zaps = this.zaps.filter((z) => z.t < 0.6);

    // completion
    if (!this.cleared[this.district] && this.goalDone.every(Boolean)) this.clear(this.district);
  }

  private stepBirds(dt: number) {
    for (const b of this.birdsFly) { b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 12 * dt; }
    this.birdsFly = this.birdsFly.filter((b) => b.t < 9);
  }

  private throwOne(from: number, to: number, kind: 'stone' | 'can') {
    const dx = to - from, T = 1.7 + Math.random() * 0.6;
    this.projs.push({ x: from, y: 120, vx: dx / T + (Math.random() - 0.5) * 120, vy: 420 * T / 2 - 120 / T, kind, bird: false, life: 0 });
  }

  watched(): boolean {
    const hx = this.x, hy = this.y + 80;
    for (const c of this.cams) {
      if (c.cozy > 0 || Math.abs(c.x - hx) > 700) continue;
      const a = this.camAngle(c);
      const vx = hx - c.x, vy = hy - c.h, d = Math.hypot(vx, vy);
      let diff = Math.atan2(vy, vx) - a; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      if (Math.abs(diff) < 0.36 && d < 620) return true;
    }
    for (const dr of this.drones) {
      const dx0 = this.droneX(dr), vx = hx - dx0, vy = hy - dr.y;
      let diff = Math.atan2(vy, vx) + Math.PI / 2; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      if (Math.abs(diff) < 0.42 && Math.hypot(vx, vy) < 420 && vy < 0) return true;
    }
    return false;
  }
  camAngle(c: Cam) { return -Math.PI / 2 + Math.sin(this.t * 0.55 + c.ph) * 0.95; }
  droneX(d: Drone) { return d.x0 + Math.sin(this.t * 0.6 + d.ph) * d.span; }

  nod() {
    this.nodT = 0.7; this.sfx('nod');
    if (this.nodWindow > 0 && !this.nodded) { this.nodded = true; this.nods++; if (this.nods === 1) this.say('NOD. GOOD. THE CAMERA SEEMS PLEASED. THE CAMERA IS NOT PLEASED; IT IS A CAMERA.', 4); }
    else if (this.nodWindow <= 0) this.say('NODDING AT NOTHING. VERY CONVINCING, HAZEL.', 2.5);
  }
  toggleBroom() {
    if (this.broom && this.y > 4 && !(this.x > 4700 && this.x < 7000)) { this.say('I SHALL LAND FIRST, THANK YOU.', 2); }
    this.broom = !this.broom;
    if (this.broom) { this.disguise = false; this.say(this.district >= 4 ? 'UP WE GO.' : 'A WITCH ON A BROOM IS NOT, STRICTLY SPEAKING, FITTING IN.', 3); }
    else { this.vy = 0; }
  }
  toggleHat() { if (this.broom) { this.say('NOT ON THE BROOM. THE HAT IS LOAD-BEARING.', 2.5); return; } this.disguise = !this.disguise; this.say(this.disguise ? 'CAP ON. HAT IN THE BAG. I AM A NORMAL PERSON WITH A NORMAL NOSE.' : 'HAT ON. THIS IS EITHER BRAVE OR STUPID.', 3); }

  private caught() {
    this.caughtT = 5; this.caughtCount++; this.sus = 0; this.sfx('caught');
  }
  private release() {
    const d = DISTRICTS[this.district];
    this.x = d.x0 + 120; this.y = 0; this.vx = this.vy = 0; this.broom = false; this.disguise = true; this.sus = 30;
    this.say('RELEASED FROM AGREEMENT CLASS. I AGREE. (I DO NOT.)', 4);
  }
  private clear(d: number) {
    this.cleared[d] = true; this.sfx('clear');
    const [title, body] = DISTRICTS[d].dispatch;
    this.card = { title, body, n: d + 1 }; this.cardT = 9;
    if (d === 1) { this.anger1 = 0; for (const m of this.march) m.open = true; }
    if (d === 3) { this.angerL = this.angerR = 0; this.projs = []; }
    if (d === 4) { this.ended = true; this.mirrorT = 0; for (const s of this.screens) s.truth = true; for (const m of this.march) m.open = true; }
    this.onCleared(d);
  }

  // ------------------------------------------------------------------ casting
  /** A click in world coordinates: find the nearest thing a spell can change. */
  cast(wx: number, wy: number): string | null {
    if (this.ended || this.caughtT > 0) return null;
    type C = { d: number; spell: Spell; x: number; y: number; act: () => void };
    const cands: C[] = [];
    const near = (x: number, y: number, r = 70) => Math.hypot(x - wx, y - wy) < r;
    for (const c of this.cams) if (c.cozy <= 0 && near(c.x + 14, c.h, 60)) cands.push({ d: Math.hypot(c.x - wx, c.h - wy), spell: 'cozy', x: c.x + 14, y: c.h, act: () => { c.cozy = 26; this.cozies++; this.say(this.cozies === 1 ? 'A HAND-KNITTED SOCK. THE CAMERA NOW SEES THE INSIDE OF A SOCK. IT IS VERY COSY IN THERE.' : 'ANOTHER SOCK.', 4); } });
    for (const s of this.screens) if (!s.truth && Math.abs(s.x - wx) < s.w / 2 && Math.abs(s.h + s.w * 0.35 - wy) < s.w * 0.45) cands.push({ d: 30, spell: 'truth', x: s.x, y: s.h + s.w * 0.35, act: () => { s.truth = true; this.say('THE SCREEN NOW SHOWS WHAT IS IN FRONT OF IT. PEOPLE STOP TO LOOK AT THEMSELVES.', 4); } });
    for (const m of this.march) {
      if (!m.open && near(m.x + 18, 200, 55)) cands.push({ d: Math.hypot(m.x + 18 - wx, 200 - wy), spell: 'unmute', x: m.x + 18, y: 200, act: () => { m.open = true; this.anger1 = Math.max(0, this.anger1 - 0.05); } });
      else if (near(m.x, 90, 50)) cands.push({ d: Math.hypot(m.x - wx, 90 - wy) + 20, spell: 'calm', x: m.x, y: 90, act: () => { this.anger1 = Math.max(0, this.anger1 - 0.3); for (const q of this.march) if (Math.abs(q.x - m.x) < 200) q.calm = 4; } });
    }
    if (this.district >= 1) for (const px of this.police1) if (near(px, 90, 50)) cands.push({ d: Math.hypot(px - wx, 90 - wy) + 15, spell: 'calm', x: px, y: 90, act: () => { this.anger1 = Math.max(0, this.anger1 - 0.2); this.say('THE SHIELDS LOWER AN INCH. INSIDE THEM, SOMEBODY\'S SON BREATHES OUT.', 4); } });
    for (const p of this.projs) if (!p.bird && p.y > 0 && near(p.x, p.y, 75)) cands.push({ d: Math.hypot(p.x - wx, p.y - wy), spell: 'birds', x: p.x, y: p.y, act: () => { const py = p.y; p.bird = true; p.y = -999; this.birds++; for (let i = 0; i < 3; i++) this.birdsFly.push({ x: p.x, y: py, vx: (Math.random() - 0.5) * 120, vy: 60 + Math.random() * 60, t: 0 }); } });
    for (const f of this.fires) if (!f.out && near(f.x, 30, 60)) cands.push({ d: Math.hypot(f.x - wx, 30 - wy), spell: 'flowers', x: f.x, y: 30, act: () => { f.out = true; this.flowers.push({ x: f.x, y: 0, t: 0 }); } });
    if (this.district === 3) {
      for (const rx of this.rioters) if (near(rx, 90, 50)) cands.push({ d: Math.hypot(rx - wx, 90 - wy) + 20, spell: 'calm', x: rx, y: 90, act: () => { this.angerL = Math.max(0, this.angerL - 0.25); this.say(['SOMEONE PUTS DOWN A STONE AND LOOKS AT IT FOR A WHILE.', 'A BOY IN A HOOD SITS DOWN ON THE KERB AND CRIES. HE IS SEVENTEEN.'][Math.floor(Math.random() * 2)], 4); } });
      for (const px of this.police3) if (near(px, 90, 50)) cands.push({ d: Math.hypot(px - wx, 90 - wy) + 20, spell: 'calm', x: px, y: 90, act: () => { this.angerR = Math.max(0, this.angerR - 0.25); this.say('AN OFFICER TAKES OFF HER HELMET. HER HAIR IS FLAT AND SHE LOOKS ABOUT TWENTY.', 4); } });
    }
    // the Uncle at the top
    if (this.district === 4 && this.y > 1100 && near(10300, 1330, 170)) cands.push({ d: 1, spell: 'mirror', x: 10300, y: 1330, act: () => { this.mirrored = true; } });
    if (!cands.length) return null;
    cands.sort((a, b) => a.d - b.d);
    const c = cands[0];
    if (Math.hypot(c.x - this.x, c.y - (this.y + 110)) > 700) { this.say('TOO FAR. MY ARMS ARE LONG, NOT THAT LONG.', 2.5); return null; }
    if (this.ink < COST[c.spell]) { this.say('OUT OF INK. GIVE IT A MOMENT.', 2); return null; }
    this.ink -= COST[c.spell];
    c.act();
    this.zaps.push({ x0: this.x + this.face * 40, y0: this.y + 140, x1: c.x, y1: c.y, t: 0, spell: c.spell });
    this.sfx('zap');
    if (this.seen && c.spell !== 'mirror') { this.sus += 26 * this.conceal; this.say('THE CAMERA SAW THAT.', 2); }
    return c.spell;
  }

  // ------------------------------------------------------------------ drawing
  lastK = 1; lastGy = 600;
  toWorld(sx: number, sy: number) { return { x: this.camX + sx / this.lastK, y: this.camY + (this.lastGy - sy) / this.lastK }; }

  draw(pen: Pen, W: number, H: number, top: number) {
    const g = pen.ctx, t = this.t;
    const k = Math.max(0.45, Math.min(1.05, H / 860));
    const gy = H - 64 - 70 * k; // the street, in screen pixels
    this.lastK = k; this.lastGy = gy;
    // camera follows Hazel; vertically only at the tower
    const tx = Math.max(0, Math.min(WORLD - W / k, this.x - (W / k) * 0.4));
    this.camX += (tx - this.camX) * 0.12;
    const ty = Math.max(0, this.y - ((gy - top - 40) / k) * 0.55);
    this.camY += (ty - this.camY) * 0.1;
    const SX = (x: number) => (x - this.camX) * k, SY = (y: number) => gy - (y - this.camY) * k;
    const F = (x: number, y: number, s = 1, id = 1, flip = 1, rot = 0) => new Frame(pen, SX(x), SY(y), k * s, rot, flip, id);
    const inView = (x: number, m = 300) => x > this.camX - m && x < this.camX + W / k + m;
    pen.width = 2;

    // sky: grey in the Bureau's city; it clears as the city looks up
    const clear = this.ended ? Math.min(1, this.mirrorT / 3) : 0;
    g.fillStyle = `rgba(20,20,20,${0.05 * (1 - clear)})`; g.fillRect(0, 0, W, gy);
    for (let i = 0; i < 9; i++) { const cx = ((i * 1300 - this.camX * 0.3) % (W / k + 400)) - 200; cloud(new Frame(pen, cx * k, (90 + (i % 3) * 40) * k + top, k * (1.1 + (i % 2) * 0.5), 0, 1, 100 + i), 1); }

    // the street and its buildings
    line(pen, [[-10, SY(0)], [W + 10, SY(0)]], 10, { w: 2.4 });
    for (let x = Math.floor(this.camX / 260) * 260; x < this.camX + W / k + 260; x += 260) {
      if (x > 4600 && x < 7000) continue;
      if (x > 7000 && x < 9600) continue; // the bridge
      if (x > 9900 && x < 10500) continue; // the tower
      const hh = 260 + ((x * 37) % 5) * 60, ww = 200;
      g.fillStyle = WASH; g.fillRect(SX(x + 30), SY(hh), ww * k, hh * k);
      house(F(x + 30 + ww / 2, 0, 1, 200 + (x % 97)), ww, hh, 200 + (x % 97));
    }
    // posters
    for (const p of this.posters) {
      if (!inView(p.x)) continue;
      const txt = this.ended ? SIGNS[p.i % SIGNS.length] : POSTERS[p.i];
      const pw = 170, ph = 74;
      g.fillStyle = '#fffefb'; g.fillRect(SX(p.x), SY(p.h + ph), pw * k, ph * k);
      line(pen, [[SX(p.x), SY(p.h + ph)], [SX(p.x + pw), SY(p.h + ph)], [SX(p.x + pw), SY(p.h)], [SX(p.x), SY(p.h)]], 300 + p.i, { close: true, w: 1.6 });
      pen.ink = this.ended ? '#141414' : RED; pen.width = 1.5;
      letter(pen, txt, SX(p.x + 10), SY(p.h + ph - 8), { size: 12 * k, maxWidth: (pw - 20) * k, seed: 400 + p.i, lineGap: 1.3 });
      pen.ink = '#141414'; pen.width = 2;
    }

    // district 2: the Records Office interior
    if (inView(5800, 1400)) this.drawArchive(pen, F, SX, SY, k);
    // district 3: the bridge
    if (inView(8300, 1500)) this.drawBridge(pen, F, SX, SY, k);
    // district 4: the tower
    if (inView(10200, 800)) this.drawTower(pen, F, SX, SY, k);

    // screens
    for (const s of this.screens) if (inView(s.x)) this.drawScreen(pen, s, SX, SY, k);
    // cameras
    for (const c of this.cams) if (inView(c.x, 700)) this.drawCam(pen, c, SX, SY, k);
    // gates between districts
    for (let d = 0; d < 4; d++) if (inView(DISTRICTS[d].x1)) this.drawGate(pen, d, F, SX, SY, k);

    // Bread Street: the march and the shields
    if (this.district >= 1 || inView(2500)) {
      for (const m of this.march) if (inView(m.x)) this.drawMarcher(pen, m, F, SX, SY, k);
      for (const px of this.police1) if (inView(px)) this.drawCop(pen, F(px, 0, 0.62, 600 + px, -1), this.cleared[1]);
    }

    // missiles, birds, flowers
    for (const p of this.projs) if (!p.bird && p.y > 0 && inView(p.x)) {
      if (p.kind === 'stone') line(pen, smooth([[SX(p.x) - 6 * k, SY(p.y)], [SX(p.x), SY(p.y) - 6 * k], [SX(p.x) + 6 * k, SY(p.y)], [SX(p.x), SY(p.y) + 5 * k], [SX(p.x) - 6 * k, SY(p.y)]]), 700, { close: true, fill: '#444' });
      else { line(pen, [[SX(p.x) - 5 * k, SY(p.y) - 8 * k], [SX(p.x) + 5 * k, SY(p.y) - 8 * k], [SX(p.x) + 5 * k, SY(p.y) + 8 * k], [SX(p.x) - 5 * k, SY(p.y) + 8 * k]], 701, { close: true }); for (let i = 0; i < 3; i++) line(pen, [[SX(p.x) - 20 * k * i, SY(p.y) + 4 * k], [SX(p.x) - 20 * k * i - 10 * k, SY(p.y) + 10 * k]], 702 + i, { w: 1 }); }
    }
    pen.ink = '#141414';
    for (const b of this.birdsFly) bird(F(b.x, b.y, 1.1, 800 + Math.floor(b.x)), t, 3 + Math.floor(b.x) % 5);
    for (const fl of this.flowers) this.drawFlowers(pen, F(fl.x, 0, 1, 900 + Math.floor(fl.x)), Math.min(1, fl.t * 2));

    // Hazel
    const hz = F(this.x, this.y, this.broom ? 0.7 : 0.56, 5000, this.broom ? this.face : this.face);
    if (this.broom) flying(hz, t, Math.max(-0.3, Math.min(0.3, -this.vy * 0.0008)) * this.face);
    else witch(hz, this.ground && Math.abs(this.vx) > 10 ? 'stand' : 'hold', t, this.seen ? 'o' : 'grin', { disguise: this.disguise, nod: this.nodT > 0 ? Math.sin((0.7 - this.nodT) / 0.7 * Math.PI * 2) * 1.2 : 0 });
    if (this.seen) { pen.ink = RED; letter(pen, '!', SX(this.x) - 6 * k, SY(this.y + 270), { size: 30 * k, seed: 77 }); pen.ink = '#141414'; }

    // spells in flight
    for (const z of this.zaps) {
      const a = 1 - z.t / 0.6;
      pen.ink = GOLD; pen.width = 2.4;
      const pts: P[] = [];
      for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([SX(z.x0 + (z.x1 - z.x0) * u) + Math.sin(u * 9 + t * 20) * 6 * a, SY(z.y0 + (z.y1 - z.y0) * u + Math.sin(u * Math.PI) * 60)]); }
      line(pen, pts, 990, { w: 2.4 * a + 0.5 });
      for (let i = 0; i < 5; i++) { const a2 = i * 1.26 + t * 6; line(pen, [[SX(z.x1) + Math.cos(a2) * 8, SY(z.y1) + Math.sin(a2) * 8], [SX(z.x1) + Math.cos(a2) * (18 + 20 * (1 - a)), SY(z.y1) + Math.sin(a2) * (18 + 20 * (1 - a))]], 991 + i, { w: 1.6 }); }
      pen.ink = '#141414'; pen.width = 2;
    }

    // the ending: every screen a mirror, everybody looking across
    if (this.ended && this.mirrorT > 2.5) {
      const a = Math.min(1, (this.mirrorT - 2.5) / 2);
      g.fillStyle = `rgba(253,252,248,${0.85 * a})`; g.fillRect(0, top, W, H - top);
      if (a > 0.6) {
        pen.width = 2.6;
        letter(pen, 'THE CITY LOOKED UP', W / 2, top + 40, { size: Math.min(46, W / 16), align: 'center', seed: 1200 });
        pen.width = 1.8;
        letter(pen, 'THE SCREENS TURNED INTO MIRRORS. PEOPLE STOPPED LOOKING AT THE UNCLE AND STARTED LOOKING AT EACH OTHER. SOME OF THEM ARGUED. IT WAS WONDERFUL.', W / 2, top + 40 + Math.min(70, W / 10), { size: Math.min(18, W / 34), align: 'center', maxWidth: Math.min(760, W - 40), seed: 1201, lineGap: 1.6 });
        for (let i = 0; i < 7; i++) human(new Frame(pen, W * (0.12 + i * 0.13), H - 40, Math.min(0.9, H / 900), 0, i % 2 ? 1 : -1, 1300 + i), { head: 'up', kind: (['a', 'b', 'c'] as const)[i % 3], dress: i % 3 === 1 }, 0);
        witch(new Frame(pen, W * 0.5, H - 30, Math.min(0.8, H / 1000), 0, 1, 1400), 'arms-up', t, 'grin');
        owl(new Frame(pen, W * 0.85, top + 200, 0.9, 0, 1, 1401), t, true);
      }
    }
  }

  private drawCam(pen: Pen, c: Cam, SX: (x: number) => number, SY: (y: number) => number, k: number) {
    const g = pen.ctx;
    line(pen, [[SX(c.x), SY(0)], [SX(c.x), SY(c.h)]], 1500 + c.x, { w: 2 });
    line(pen, [[SX(c.x), SY(c.h)], [SX(c.x + 16), SY(c.h)]], 1501 + c.x);
    const a = this.camAngle(c);
    const bx = SX(c.x + 16), by = SY(c.h);
    // the body of the camera, pointing where it looks
    const ca = Math.cos(-a), sa = Math.sin(-a);
    const box: P[] = [[-10, -9], [26, -9], [26, 9], [-10, 9]].map(([x, y]) => [bx + (x * ca - y * sa) * k, by + (x * sa + y * ca) * k] as P);
    line(pen, box, 1502 + c.x, { close: true, fill: c.cozy > 0 ? '#fffefb' : '#e9e9e6' });
    if (c.cozy > 0) {
      // a hand-knitted sock, with stripes
      for (let i = 0; i < 4; i++) { const u = -6 + i * 9; line(pen, [[bx + (u * ca + 9 * sa) * k, by + (u * sa - 9 * ca) * k], [bx + (u * ca - 9 * sa) * k, by + (u * sa + 9 * ca) * k]], 1510 + i + c.x, { w: 1.2 }); }
      return;
    }
    g.fillStyle = RED; g.beginPath(); g.arc(bx + 22 * ca * k, by + 22 * sa * k, 3.2 * k, 0, 7); g.fill();
    // the cone of its attention
    const R = 620;
    const p1: P = [bx + Math.cos(-a - 0.36) * R * k, by + Math.sin(-a - 0.36) * R * k], p2: P = [bx + Math.cos(-a + 0.36) * R * k, by + Math.sin(-a + 0.36) * R * k];
    g.fillStyle = this.seen && Math.abs(c.x - this.x) < 700 ? 'rgba(192,57,43,0.12)' : 'rgba(192,57,43,0.05)';
    g.beginPath(); g.moveTo(bx, by); g.lineTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); g.closePath(); g.fill();
    g.setLineDash([6, 8]); g.strokeStyle = 'rgba(192,57,43,0.45)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(bx, by); g.lineTo(p1[0], p1[1]); g.moveTo(bx, by); g.lineTo(p2[0], p2[1]); g.stroke(); g.setLineDash([]);
  }

  private drawScreen(pen: Pen, s: Screen, SX: (x: number) => number, SY: (y: number) => number, k: number) {
    const g = pen.ctx, w = s.w, h = w * 0.7, x0 = s.x - w / 2, y1 = s.h + h;
    line(pen, [[SX(s.x), SY(0)], [SX(s.x), SY(s.h)]], 1600 + s.x, { w: 2.4 });
    g.fillStyle = s.truth ? '#fffefb' : '#f1efea'; g.fillRect(SX(x0), SY(y1), w * k, h * k);
    line(pen, [[SX(x0), SY(y1)], [SX(x0 + w), SY(y1)], [SX(x0 + w), SY(s.h)], [SX(x0), SY(s.h)]], 1601 + s.x, { close: true, w: 2.4 });
    const cx = SX(s.x), cy = SY(s.h + h * 0.55);
    if (s.truth) {
      // a mirror: it shows the street in front of it — little people looking back
      for (let i = 0; i < 4; i++) human(new Frame(pen, SX(x0 + w * (0.2 + i * 0.2)), SY(s.h + 8), k * 0.28, 0, 1, 1650 + i), { head: 'up', kind: (['a', 'b', 'c'] as const)[i % 3] }, 0);
      pen.width = 1.2; letter(pen, 'YOU', SX(x0) + 6 * k, SY(y1) + 6 * k, { size: 11 * k, seed: 1660 }); pen.width = 2;
      return;
    }
    // the Kindly Uncle: a round smiling face with glasses and nothing behind the eyes
    line(pen, arc(cx, cy, h * 0.28 * k, h * 0.32 * k, 0, Math.PI * 2, 24), 1610 + s.x, { close: true });
    line(pen, arc(cx - h * 0.1 * k, cy - h * 0.06 * k, h * 0.07 * k, h * 0.06 * k, 0, Math.PI * 2, 12), 1611 + s.x, { close: true });
    line(pen, arc(cx + h * 0.1 * k, cy - h * 0.06 * k, h * 0.07 * k, h * 0.06 * k, 0, Math.PI * 2, 12), 1612 + s.x, { close: true });
    line(pen, [[cx - h * 0.03 * k, cy - h * 0.06 * k], [cx + h * 0.03 * k, cy - h * 0.06 * k]], 1613 + s.x);
    line(pen, arc(cx, cy + h * 0.08 * k, h * 0.14 * k, h * 0.08 * k, 0.15, Math.PI - 0.15, 12), 1614 + s.x);
    pen.ink = RED; pen.width = 1.5;
    const msg = this.nodWindow > 0 ? 'NOD NOW' : (s.big ? 'THE KINDLY UNCLE' : BROADCASTS[(this.broadcast + Math.floor(s.x)) % BROADCASTS.length]);
    letter(pen, msg, cx, SY(s.h + h * 0.18), { size: (this.nodWindow > 0 ? 20 : 10) * k, align: 'center', maxWidth: (w - 16) * k, seed: 1620 + s.x });
    pen.ink = '#141414'; pen.width = 2;
  }

  private drawMarcher(pen: Pen, m: Marcher, F: (x: number, y: number, s?: number, id?: number, flip?: number) => Frame, SX: (x: number) => number, SY: (y: number) => number, k: number) {
    const g = pen.ctx;
    const bob = Math.sin(this.t * 5 + m.x) * 3;
    human(F(m.x, 0, 0.66, 2000 + m.sign * 13 + Math.floor(m.x / 7) % 3), { kind: m.kind, head: m.calm > 0 ? 'up' : 'side' }, this.t * m.sp);
    // the sign on its stick
    const sx = m.x + 18, sy = 170 + bob;
    line(pen, [[SX(sx), SY(80)], [SX(sx), SY(sy)]], 2100 + m.sign, { w: 1.8 });
    const sw = 90, sh = 48;
    g.fillStyle = '#fffefb'; g.fillRect(SX(sx - sw / 2), SY(sy + sh), sw * k, sh * k);
    line(pen, [[SX(sx - sw / 2), SY(sy + sh)], [SX(sx + sw / 2), SY(sy + sh)], [SX(sx + sw / 2), SY(sy)], [SX(sx - sw / 2), SY(sy)]], 2110 + m.sign, { close: true, w: 1.6 });
    if (m.open) { pen.width = 1.5; letter(pen, SIGNS[m.sign], SX(sx), SY(sy + sh - 6), { size: 11 * k, align: 'center', maxWidth: (sw - 12) * k, seed: 2120 + m.sign, lineGap: 1.25 }); pen.width = 2; }
    else { // taped shut: a big X of grey tape
      g.strokeStyle = 'rgba(120,120,120,0.85)'; g.lineWidth = 9 * k;
      g.beginPath(); g.moveTo(SX(sx - sw / 2 + 6), SY(sy + sh - 6)); g.lineTo(SX(sx + sw / 2 - 6), SY(sy + 6)); g.moveTo(SX(sx + sw / 2 - 6), SY(sy + sh - 6)); g.lineTo(SX(sx - sw / 2 + 6), SY(sy + 6)); g.stroke();
    }
    if (m.calm > 0 && m.sign % 3 === 0) { const b = F(m.x - 10, 250, 0.7, 2140 + m.sign); bubble(b, 150, 40, 0.2, 2141 + m.sign); pen.width = 1.4; letter(pen, 'WE ARE PEACEFUL', ...b.map([10, 10]), { size: 10 * k, seed: 2142 }); pen.width = 2; }
  }

  private drawCop(_pen: Pen, f: Frame, calm: boolean) {
    human(f, { kind: 'c' }, 0);
    // helmet visor and a tall shield
    f.L([[-16, -168], [16, -168], [16, -150], [-16, -150]], 31, { close: true });
    if (!calm) { f.L([[18, -130], [48, -132], [50, -20], [20, -18], [18, -130]], 32, { close: true, fill: 'rgba(240,240,240,0.7)' }); f.L([[26, -110], [42, -110]], 33, { w: 1 }); }
    else f.L([[30, -40], [70, -40], [72, -10], [32, -10]], 32, { close: true }); // the shield, put down
  }

  private drawFlowers(pen: Pen, f: Frame, a: number) {
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 14, h = (24 + (i % 2) * 12) * a;
      f.L([[x, 0], [x + 2, -h]], 1 + i, { w: 1.4 });
      f.L(arc(x + 2, -h - 5, 6 * a, 6 * a, 0, Math.PI * 2, 10), 10 + i, { close: true, fill: 'rgba(224,168,0,0.55)' });
    }
    void pen;
  }

  private drawGate(pen: Pen, d: number, F: (x: number, y: number, s?: number, id?: number, flip?: number) => Frame, SX: (x: number) => number, SY: (y: number) => number, k: number) {
    const x = DISTRICTS[d].x1 - 20, open = this.cleared[d];
    line(pen, [[SX(x - 60), SY(0)], [SX(x - 60), SY(130)], [SX(x - 120), SY(130)], [SX(x - 120), SY(0)]], 3000 + d);
    line(pen, [[SX(x - 128), SY(140)], [SX(x - 52), SY(140)]], 3001 + d);
    pen.width = 1.3; letter(pen, 'CHECKPOINT', SX(x - 118), SY(124), { size: 10 * k, seed: 3002 + d }); pen.width = 2;
    if (open) line(pen, [[SX(x - 50), SY(70)], [SX(x - 20), SY(260)]], 3003 + d, { w: 3 });
    else { line(pen, [[SX(x - 50), SY(70)], [SX(x + 120), SY(70)]], 3003 + d, { w: 3 }); for (let i = 0; i < 6; i++) line(pen, [[SX(x - 30 + i * 28), SY(64)], [SX(x - 18 + i * 28), SY(76)]], 3010 + i + d * 10, { w: 1.2 }); }
    human(F(x - 90, 0, 0.55, 3100 + d), { kind: 'c' }, 0);
    if (Math.abs(this.x - x) < 260 && !open) {
      const b = F(x - 220, 230, 0.8, 3200 + d); bubble(b, 200, 50, 0.7, 3201 + d);
      pen.width = 1.4; letter(pen, 'AGREEMENT CARD? FINISH YOUR BUSINESS HERE FIRST.', ...b.map([10, 8]), { size: 10 * k, maxWidth: 180 * k, seed: 3202 + d, lineGap: 1.2 }); pen.width = 2;
    }
  }

  private drawArchive(pen: Pen, F: (x: number, y: number, s?: number, id?: number, flip?: number) => Frame, SX: (x: number) => number, SY: (y: number) => number, k: number) {
    const g = pen.ctx, x0 = 4720, x1 = 6980, H = 440;
    g.fillStyle = 'rgba(20,20,20,0.05)'; g.fillRect(SX(x0), SY(H), (x1 - x0) * k, H * k);
    line(pen, [[SX(x0), SY(0)], [SX(x0), SY(H)], [SX(x1), SY(H)], [SX(x1), SY(0)]], 4000);
    pen.width = 2.2; letter(pen, 'THE RECORDS OFFICE · YESTERDAY UNDER REVIEW', SX(x0 + 30), SY(H - 20), { size: 16 * k, seed: 4001 }); pen.width = 2;
    // clerks at desks, retyping
    for (let i = 0; i < 9; i++) {
      const x = x0 + 140 + i * 210;
      line(pen, [[SX(x - 50), SY(70)], [SX(x + 50), SY(70)]], 4010 + i); line(pen, [[SX(x - 44), SY(70)], [SX(x - 44), SY(0)]], 4020 + i); line(pen, [[SX(x + 44), SY(70)], [SX(x + 44), SY(0)]], 4030 + i);
      line(pen, [[SX(x - 20), SY(70)], [SX(x - 20), SY(96)], [SX(x + 18), SY(96)], [SX(x + 18), SY(70)]], 4040 + i); // typewriter
      human(F(x - 70, 0, 0.5, 4050 + i), { head: 'down', kind: (['a', 'b', 'c'] as const)[i % 3] }, 0);
      line(pen, [[SX(x - 6), SY(96)], [SX(x - 4 + Math.sin(this.t * 9 + i) * 3), SY(126)]], 4060 + i, { w: 1.2 }); // paper in the roller
    }
    // the Forgetting Chute and its furnace glow
    const cx = 6760;
    line(pen, [[SX(cx - 40), SY(0)], [SX(cx - 30), SY(330)], [SX(cx + 50), SY(330)], [SX(cx + 60), SY(0)]], 4100);
    g.fillStyle = 'rgba(192,57,43,0.12)'; g.fillRect(SX(cx - 34), SY(60), 90 * k, 60 * k);
    pen.width = 1.5; letter(pen, 'FORGETTING CHUTE', SX(cx - 60), SY(370), { size: 11 * k, seed: 4101 }); pen.width = 2;
    // the pages
    for (const p of this.pages) {
      if (p.got || p.lost) continue;
      const px = SX(p.x), py = SY(p.y), r = Math.sin(this.t * 3 + p.text) * 0.4;
      const pts: P[] = [[-14, -18], [14, -18], [14, 18], [-14, 18]].map(([x, y]) => [px + (x * Math.cos(r) - y * Math.sin(r)) * k, py + (x * Math.sin(r) + y * Math.cos(r)) * k] as P);
      line(pen, pts, 4200 + p.text, { close: true, fill: '#fffefb', w: 1.6 });
      for (let i = 0; i < 3; i++) line(pen, [[px - 8 * k, py + (-8 + i * 7) * k], [px + 8 * k, py + (-8 + i * 7) * k]], 4210 + i, { w: 0.9 });
    }
  }

  private drawBridge(pen: Pen, F: (x: number, y: number, s?: number, id?: number, flip?: number) => Frame, SX: (x: number) => number, SY: (y: number) => number, k: number) {
    const g = pen.ctx, x0 = 7000, x1 = 9600;
    // deck, railings, arches over the river
    for (let x = x0; x < x1; x += 40) line(pen, [[SX(x), SY(0)], [SX(x), SY(50)]], 5000 + (x % 400), { w: 1.2 });
    line(pen, [[SX(x0), SY(50)], [SX(x1), SY(50)]], 5001);
    for (let i = 0; i < 4; i++) { const ax = x0 + 330 + i * 650; line(pen, arc(SX(ax), SY(0), 300 * k, 90 * k, 0, Math.PI, 20), 5010 + i); }
    g.fillStyle = 'rgba(20,20,20,0.03)'; g.fillRect(SX(x0), SY(0) + 4, (x1 - x0) * k, 120 * k);
    for (let i = 0; i < 12; i++) line(pen, [[SX(x0 + i * 220 + (this.t * 20) % 220), SY(-70)], [SX(x0 + i * 220 + 60 + (this.t * 20) % 220), SY(-70)]], 5020 + i, { w: 1 });
    pen.width = 1.6; letter(pen, 'THE BRIDGE (IT HAD A NAME)', SX(x0 + 40), SY(-110), { size: 13 * k, seed: 5030 }); pen.width = 2;
    // fires
    for (const f of this.fires) {
      if (f.out || this.cleared[3]) continue;
      const fx = SX(f.x), fy = SY(0), s = k * (0.8 + 0.2 * Math.sin(f.t * 7));
      for (let i = 0; i < 3; i++) line(pen, smooth([[fx - 18 * s + i * 12 * s, fy], [fx - 22 * s + i * 12 * s + Math.sin(this.t * 8 + i) * 4, fy - 30 * s], [fx - 10 * s + i * 12 * s, fy - (50 + i * 8) * s]]), 5100 + i + Math.floor(f.x) % 7, { w: 2 });
      g.fillStyle = 'rgba(224,120,0,0.12)'; g.beginPath(); g.arc(fx, fy - 25 * s, 34 * s, 0, 7); g.fill();
    }
    // the two sides
    for (const rx of this.rioters) human(F(rx, 0, 0.64, 5200 + rx, 1), { kind: 'b', head: this.angerL < 0.3 ? 'up' : 'side' }, this.t * (this.angerL > 0.3 ? 1.5 : 0));
    for (const px of this.police3) this.drawCop(pen, F(px, 0, 0.64, 5300 + px, -1), this.cleared[3] || this.angerR < 0.2);
    // the people in the middle
    for (const q of this.people) {
      const f = F(q.x, 0, q.kind === 'child' ? 0.42 : 0.6, 5400 + q.x);
      if (q.kind === 'child') { human(f, { kind: 'b', head: 'up' }, 0); f.L([[18, -100], [30, -200]], 40, { w: 1 }); f.L(arc(32, -222, 16, 20, 0, Math.PI * 2, 14), 41, { close: true, fill: 'rgba(192,57,43,0.25)' }); }
      else if (q.kind === 'old') { human(f, { kind: 'a', head: 'down', hold: 'none' }, 0); f.L([[24, -60], [32, 0]], 42); f.L([[-30, -40], [-12, -40], [-14, -10], [-28, -10]], 43, { close: true }); }
      else { human(f, { kind: 'c', dress: true }, 0); f.L([[16, -80], [60, -20]], 44, { w: 1 }); f.L(smooth([[50, -10], [56, -26], [80, -26], [86, -10], [80, 0], [56, 0]]), 45, { close: true }); f.L([[86, -20], [94, -30]], 46); }
      if (q.hurt > 0) { pen.ink = RED; letter(pen, '+', SX(q.x) + 20 * k, SY(150), { size: 22 * k, seed: 5500 }); pen.ink = '#141414'; }
    }
    if (this.cleared[3]) {
      // somebody brought soup
      const sx = 8150;
      line(pen, arc(SX(sx), SY(30), 26 * k, 14 * k, 0, Math.PI, 12), 5600); line(pen, [[SX(sx - 26), SY(30)], [SX(sx + 26), SY(30)]], 5601);
      for (let i = 0; i < 3; i++) line(pen, smooth([[SX(sx - 10 + i * 10), SY(46)], [SX(sx - 14 + i * 10 + Math.sin(this.t * 2 + i) * 3), SY(66)], [SX(sx - 8 + i * 10), SY(86)]]), 5610 + i, { w: 1.2 });
      pen.width = 1.4; letter(pen, 'SOUP', SX(sx - 18), SY(10), { size: 10 * k, seed: 5620 }); pen.width = 2;
    }
  }

  private drawTower(pen: Pen, _F: (x: number, y: number, s?: number, id?: number, flip?: number) => Frame, SX: (x: number) => number, SY: (y: number) => number, k: number) {
    const g = pen.ctx, cx = 10300, w0 = 300, w1 = 120, top = 1200;
    g.fillStyle = 'rgba(20,20,20,0.05)';
    g.beginPath(); g.moveTo(SX(cx - w0 / 2), SY(0)); g.lineTo(SX(cx - w1 / 2), SY(top)); g.lineTo(SX(cx + w1 / 2), SY(top)); g.lineTo(SX(cx + w0 / 2), SY(0)); g.closePath(); g.fill();
    line(pen, [[SX(cx - w0 / 2), SY(0)], [SX(cx - w1 / 2), SY(top)]], 6000); line(pen, [[SX(cx + w0 / 2), SY(0)], [SX(cx + w1 / 2), SY(top)]], 6001);
    for (let i = 1; i < 12; i++) { const y = (top / 12) * i, hw = (w0 + (w1 - w0) * (y / top)) / 2; line(pen, [[SX(cx - hw), SY(y)], [SX(cx + hw), SY(y)]], 6010 + i, { w: 1 }); }
    // the great screen at the top
    const sw = 260, sh = 180, sy0 = top + 40;
    g.fillStyle = this.mirrored ? '#fffefb' : '#f1efea'; g.fillRect(SX(cx - sw / 2), SY(sy0 + sh), sw * k, sh * k);
    line(pen, [[SX(cx - sw / 2), SY(sy0 + sh)], [SX(cx + sw / 2), SY(sy0 + sh)], [SX(cx + sw / 2), SY(sy0)], [SX(cx - sw / 2), SY(sy0)]], 6100, { close: true, w: 3 });
    line(pen, [[SX(cx), SY(sy0 + sh)], [SX(cx), SY(sy0 + sh + 120)]], 6101, { w: 2 });
    const fx = SX(cx), fy = SY(sy0 + sh * 0.55);
    if (!this.mirrored) {
      line(pen, arc(fx, fy, 60 * k, 70 * k, 0, Math.PI * 2, 24), 6110, { close: true });
      line(pen, arc(fx - 22 * k, fy - 12 * k, 15 * k, 12 * k, 0, Math.PI * 2, 12), 6111, { close: true }); line(pen, arc(fx + 22 * k, fy - 12 * k, 15 * k, 12 * k, 0, Math.PI * 2, 12), 6112, { close: true });
      line(pen, arc(fx, fy + 18 * k, 30 * k, 16 * k, 0.15, Math.PI - 0.15, 12), 6113);
      pen.ink = RED; pen.width = 1.6; letter(pen, this.y > 1100 ? 'HELLO, HAZEL. WE KNOW.' : 'EVERYONE AGREES', fx, SY(sy0 + 24), { size: 13 * k, align: 'center', seed: 6114 }); pen.ink = '#141414'; pen.width = 2;
      if (this.district === 4 && this.y > 1100) { pen.ink = GOLD; pen.width = 1.6; letter(pen, 'CLICK THE UNCLE', fx, SY(sy0 - 30), { size: 12 * k, align: 'center', seed: 6115 }); pen.ink = '#141414'; pen.width = 2; }
    } else for (let i = 0; i < 6; i++) human(new Frame(pen, SX(cx - sw / 2 + 30 + i * 40), SY(sy0 + 6), k * 0.3, 0, 1, 6120 + i), { head: 'up', kind: (['a', 'b', 'c'] as const)[i % 3] }, 0);
    // drones with their searchlights
    for (const d of this.drones) {
      const dx = this.droneX(d);
      const f = new Frame(pen, SX(dx), SY(d.y), k * 0.7, 0, 1, 6200 + d.x0);
      f.L([[-30, 0], [30, 0], [30, 12], [-30, 12]], 1, { close: true }); f.L([[-30, 0], [-46, -10]], 2); f.L([[30, 0], [46, -10]], 3);
      const ww = 14 * Math.abs(Math.sin(this.t * 30)); f.L([[-46 - ww, -12], [-46 + ww, -9]], 4); f.L([[46 - ww, -12], [46 + ww, -9]], 5);
      g.fillStyle = 'rgba(192,57,43,0.06)'; g.beginPath(); g.moveTo(SX(dx), SY(d.y)); g.lineTo(SX(dx - 180), SY(d.y - 420)); g.lineTo(SX(dx + 180), SY(d.y - 420)); g.closePath(); g.fill();
    }
  }

  /** The Agreement Class, where they take you when the meter fills. */
  drawCaught(pen: Pen, W: number, H: number, top: number) {
    const g = pen.ctx;
    g.fillStyle = 'rgba(253,252,248,0.94)'; g.fillRect(0, top, W, H - top);
    const k = Math.min(1, W / 900, (H - top) / 600);
    pen.width = 2.6;
    letter(pen, 'AGREEMENT CLASS', W / 2, top + 20, { size: 40 * k, align: 'center', seed: 7000 });
    pen.width = 2;
    witch(new Frame(pen, W / 2 - 120 * k, top + 430 * k, 1.1 * k, 0, 1, 7001), 'hold', this.t, 'flat', { disguise: true });
    line(pen, [[W / 2 - 220 * k, top + 330 * k], [W / 2 - 20 * k, top + 330 * k]], 7002);
    line(pen, [[W / 2 + 40 * k, top + 120 * k], [W / 2 + 260 * k, top + 120 * k], [W / 2 + 260 * k, top + 280 * k], [W / 2 + 40 * k, top + 280 * k]], 7003, { close: true });
    pen.ink = RED; pen.width = 1.6;
    letter(pen, 'REPEAT AFTER ME:\nI AGREE.\nI AGREE.\nI AGREE.', W / 2 + 60 * k, top + 140 * k, { size: 14 * k, seed: 7004, lineGap: 1.4 });
    pen.ink = '#141414';
    letter(pen, `"I AGREE," SAID HAZEL. SHE DID NOT. (ATTEMPT ${this.caughtCount})`, W / 2, top + 470 * k, { size: 15 * k, align: 'center', seed: 7005, maxWidth: W - 40 });
    pen.width = 2;
  }
}

