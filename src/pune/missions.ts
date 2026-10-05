import type { Car } from './traffic';
import type { VType } from './vehicles';
import type { City } from './data';
import { Driver } from './police';
import { randomLook, type Look } from './people';

/**
 * The story: Sanket comes home to Pune from a Bengaluru IT job that ended,
 * and runs errands round the city for his family and neighbours. Every place
 * in it is real; the people are made up.
 */

export interface Pt { x: number; z: number }

export interface WorldAPI {
  city: City;
  spot(lat: number, lon: number, road?: boolean): Pt;
  player(): { x: number; z: number; y: number; onFoot: boolean; car: Car | null; health: number; speed: number };
  spawnCar(type: VType, at: Pt, yaw?: number): Car;
  removeCar(c: Car): void;
  route(to: Pt | null): void;
  objective(text: string): void;
  say(who: string, text: string, mr?: string, dur?: number): void;
  money(delta: number, why?: string): void;
  setStars(n: number): void;
  stars(): number;
  getHour(): number;
  setHour(h: number): void;
  marker(id: string, at: Pt | null, r?: number, color?: string): void;
  timer(sec: number | null): void;
  sfx(kind: 'pass' | 'fail' | 'coin' | 'bell'): void;
  radio(id: 'off' | 'peth' | 'dhol' | 'kp'): void;
  passenger(look: Look | null): void;
  stepTarget(car: Car | null): void;
}

type Result = 'done' | 'fail' | null;
interface Step { enter?(w: WorldAPI): void; update?(w: WorldAPI, dt: number): Result; exit?(w: WorldAPI): void; failText?: string }

export interface Mission {
  id: string; title: string; mr: string; giver: string; where: string;
  at: [number, number]; reward: number; needs?: number; night?: boolean;
  steps: (w: WorldAPI, m: Run) => Step[];
}

export interface Run { cars: Car[]; data: Record<string, unknown>; startDamage: number; fail: string; earned: number }

// ---------------------------------------------------------------- step helpers
const say = (who: string, text: string, mr?: string, dur = 5.5): Step => {
  let t = 0;
  return { enter: (w) => { w.say(who, text, mr, dur); t = 0; }, update: (_w, dt) => ((t += dt) > Math.min(dur, 3.2) ? 'done' : null) };
};

const spawn = (key: string, type: VType, at: (w: WorldAPI) => Pt, run: Run): Step => ({
  enter: (w) => {
    const p = at(w);
    const h = w.city.roads.nearest(p.x, p.z, 40);
    let yaw = 0;
    if (h && h.k + 1 < h.p.n) yaw = Math.atan2(h.p.x[h.k + 1] - h.p.x[h.k], h.p.z[h.k + 1] - h.p.z[h.k]);
    const c = w.spawnCar(type, p, yaw);
    c.mission = key;
    run.cars.push(c);
    run.data[key] = c;
  },
  update: () => 'done',
});

const enter = (key: string, text: string, run: Run): Step => ({
  enter: (w) => { const c = run.data[key] as Car; w.objective(text); w.marker('car', c.body, 2.5, '#9ad1ff'); w.route(null); },
  update: (w) => { const c = run.data[key] as Car; if (c.body.sunk || c.body.health <= 0) return 'fail'; return w.player().car === c ? 'done' : null; },
  exit: (w) => w.marker('car', null),
  failText: 'The vehicle is wrecked.',
});

const anyVehicle = (text: string, fallback: VType, run: Run): Step => {
  let spawned = false;
  return {
    enter: (w) => {
      w.objective(text);
      if (!w.player().car) {
        const p = w.player();
        const h = w.city.roads.nearest(p.x, p.z, 60);
        if (h) {
          const c = w.spawnCar(fallback, { x: h.x, z: h.z }, h.k + 1 < h.p.n ? Math.atan2(h.p.x[h.k + 1] - h.p.x[h.k], h.p.z[h.k + 1] - h.p.z[h.k]) : 0);
          c.mission = 'loaner'; run.cars.push(c); spawned = true;
          w.marker('car', c.body, 2.5, '#9ad1ff');
        }
      }
    },
    update: (w) => (w.player().car ? 'done' : null),
    exit: (w) => { w.marker('car', null); void spawned; },
  };
};

interface GotoOpts { r?: number; car?: string | 'any'; foot?: boolean; timer?: number; gentle?: number; slow?: boolean; label?: string }
const goto = (text: string, at: (w: WorldAPI) => Pt, run: Run, o: GotoOpts = {}): Step => {
  let target: Pt = { x: 0, z: 0 }, t = 0, warned = false;
  return {
    enter: (w) => {
      target = at(w); t = o.timer ?? 0;
      w.objective(text); w.marker('goal', target, o.r ?? 6, '#ffd23f'); w.route(target);
      if (o.timer) w.timer(o.timer);
      run.startDamage = w.player().car ? 100 - w.player().car!.body.health : 0;
    },
    update: (w, dt) => {
      const p = w.player();
      if (o.timer) { t -= dt; w.timer(Math.max(0, t)); if (t <= 0) { run.fail = 'Out of time.'; return 'fail'; } }
      if (o.car && o.car !== 'any') {
        const c = run.data[o.car] as Car;
        if (c.body.sunk || c.body.health <= 0) { run.fail = 'The vehicle is wrecked.'; return 'fail'; }
        if (p.car !== c) { w.objective('Get back in the ' + c.spec.label.toLowerCase() + '.'); w.marker('car', c.body, 2.5, '#9ad1ff'); return null; }
        w.marker('car', null); w.objective(text);
      }
      if (o.gentle !== undefined && p.car) {
        const dmg = 100 - p.car.body.health - run.startDamage;
        if (dmg > o.gentle) { run.fail = o.label ?? 'Too many knocks.'; return 'fail'; }
        if (dmg > o.gentle * 0.5 && !warned) { warned = true; w.say('', 'Careful! One more knock like that…', undefined, 3); }
      }
      if (o.foot && !p.onFoot) { w.objective('Go on foot. ' + text); }
      const d = Math.hypot(p.x - target.x, p.z - target.z);
      if (d < (o.r ?? 6) && (!o.foot || p.onFoot) && (o.car !== 'any' || p.car) && (!o.slow || p.speed < 3)) return 'done';
      return null;
    },
    exit: (w) => { w.marker('goal', null); w.route(null); if (o.timer) w.timer(null); },
  };
};

// ---------------------------------------------------------------- spots
const LL = {
  station: [18.5287, 73.8738], kasba: [18.5206, 73.8586], laxmi: [18.5142, 73.8517], kpHall: [18.5378, 73.8931],
  fc: [18.5232, 73.8410], dattawadi: [18.5012, 73.8434], pandal: [18.5171, 73.8574], swargate: [18.5001, 73.8584],
  paytha: [18.4985, 73.85012], parvatiTop: [18.49758, 73.84819], wadaGate: [18.5212, 73.8551], deccan: [18.5166, 73.8420],
  yerawada: [18.5521, 73.8899], agakhan: [18.5510, 73.9017],
} as const;
const at = (k: keyof typeof LL, road = true) => (w: WorldAPI) => w.spot(LL[k][0], LL[k][1], road);

export const FARES: [string, number, number][] = [
  ['Saras Baug', 18.5016, 73.8521], ['Pune Station', 18.5287, 73.8738], ['Deccan Gymkhana', 18.5166, 73.8420],
  ['Shaniwar Wada', 18.5212, 73.8551], ['Kalyani Nagar', 18.5481, 73.9026], ['Model Colony', 18.5314, 73.8375],
  ['MG Road, Camp', 18.5150, 73.8789], ['Koregaon Park', 18.5369, 73.8935], ['Fergusson College', 18.5229, 73.8406],
  ['Tulshibaug', 18.5139, 73.8556], ['Bund Garden', 18.5416, 73.8842], ['Kasba Ganpati', 18.5206, 73.8586],
];

// ---------------------------------------------------------------- the missions
export const MISSIONS: Mission[] = [
  {
    id: 'gharwapsi', title: 'Ghar Wapsi', mr: 'घरवापसी', giver: 'Mandar', where: 'Pune Railway Station', at: [18.5287, 73.8738], reward: 500,
    steps: (_w, run) => [
      say('Mandar (phone)', 'Sanket! Welcome back to Pune, bhau. My scooter is outside the station. Key is in it, obviously.', 'आलास का पुण्यात?'),
      spawn('scooter', 'scooter', (w) => { const s = at('station')(w); return { x: s.x + 6, z: s.z + 2 }; }, run),
      enter('scooter', 'Get on Mandar\'s scooter.', run),
      say('Mandar (phone)', 'Aaji is waiting at the wada in Kasba Peth. Follow the purple line. And wear a helmet, the mama on the chowk will fine you.', undefined, 6),
      goto('Ride to Aaji\'s wada in Kasba Peth.', at('kasba'), run, { car: 'scooter', r: 9 }),
      say('Aaji', 'Aala maza baal! You have gone so thin in Bengaluru. Sit. Eat. Then go and help Joshi Kaka on Laxmi Road.', 'आला माझा बाळ!', 6),
    ],
  },
  {
    id: 'dupari', title: 'Dupari Ek te Char', mr: 'दुपारी १ ते ४', giver: 'Joshi Kaka', where: 'Laxmi Road', at: [18.5142, 73.8517], reward: 1500,
    steps: (_w, run) => [
      { enter: (w) => { const h = w.getHour(); if (h < 11 || h > 12.5) w.setHour(12.2); }, update: () => 'done' },
      say('Joshi Kaka', 'At one o\'clock I close. My father closed at one, his father closed at one. Three boxes of pedhe for a wedding in Koregaon Park. You have till one.', 'दुपारी १ ते ४ दुकान बंद राहील.', 7),
      anyVehicle('Get any vehicle. Fast.', 'scooter', run),
      goto('Deliver the pedhe to the wedding hall in Koregaon Park.', at('kpHall'), run, { r: 10, timer: 200, car: 'any' }),
      say('Bride\'s uncle', 'Pedhe from the peth! Now it is a proper wedding. Tell Joshi Kaka his shop is still the best. Don\'t tell him I said so.', undefined, 6),
    ],
  },
  {
    id: 'chainchor', title: 'Chain Chor', mr: 'चेन चोर', giver: 'A lady on FC Road', where: 'FC Road', at: [18.5232, 73.8410], reward: 2000,
    steps: (_w, run) => {
      let thief: Car | null = null, drv: Driver | null = null, dest: Pt = { x: 0, z: 0 }, down = 0;
      return [
        say('A lady', 'Chor! Chor! That man on the black bike took my mangalsutra!', 'चोर! चोर!', 4),
        anyVehicle('Get on a bike — anything with wheels!', 'bike', run),
        {
          enter: (w) => {
            const p = w.player();
            const h = w.city.roads.nearest(p.x + 30, p.z - 20, 80, (q) => q.cls <= 4);
            thief = w.spawnCar('bike', h ? { x: h.x, z: h.z } : { x: p.x + 25, z: p.z }, 0);
            thief.mission = 'thief'; thief.driver = randomLook(Math.random, 'man'); thief.helmet = 0;
            thief.body.health = 100;
            run.cars.push(thief);
            drv = new Driver(thief, w.city);
            const far = [LL.swargate, LL.yerawada, LL.station, LL.deccan, LL.agakhan][Math.floor(Math.random() * 5)];
            dest = w.spot(far[0], far[1]);
            w.objective('Chase the chain snatcher. Knock him off his bike.');
            w.stepTarget(thief);
          },
          update: (w, dt) => {
            if (!thief || !drv) return 'fail';
            const p = w.player();
            const d = Math.hypot(p.x - thief.body.x, p.z - thief.body.z);
            w.marker('target', thief.body, 2, '#ff3b3b');
            if (thief.body.health <= 0 || thief.body.sunk) {
              thief.input.throttle = 0; thief.input.brake = 1; down += dt;
              if (down > 1.0) return 'done';
              return null;
            }
            drv.drive(dt, dest.x, dest.z, { top: thief.spec.top * 0.78, direct: 20 });
            if (Math.hypot(thief.body.x - dest.x, thief.body.z - dest.z) < 30) {
              const far = [LL.swargate, LL.yerawada, LL.station, LL.deccan, LL.agakhan, LL.kpHall][Math.floor(Math.random() * 6)];
              dest = w.spot(far[0], far[1]);
            }
            if (d > 320) { run.fail = 'He got away.'; return 'fail'; }
            return null;
          },
          exit: (w) => { w.marker('target', null); w.stepTarget(null); },
        },
        goto('He\'s down! Get off and take the chain back.', (_w) => ({ x: thief!.body.x, z: thief!.body.z }), run, { r: 3, foot: true }),
        say('Constable Shinde', 'Shabbas! The Deccan police thanks you. Now go home before you get ideas about becoming a hero.', 'शाब्बास!', 5),
      ];
    },
  },
  {
    id: 'bappa', title: 'Bappa Morya', mr: 'गणपती बाप्पा मोरया', giver: 'Mandal president', where: 'Dattawadi', at: [18.5012, 73.8434], reward: 2500,
    steps: (_w, run) => [
      say('Mandal president', 'Chaturthi is tomorrow. Bring Bappa from the murti workshop to our pandal in Budhwar Peth. If one ear chips, the whole peth will talk about it for ten years.', 'गणपती बाप्पा मोरया!', 7),
      spawn('tempo', 'tempo', (w) => { const s = at('dattawadi')(w); return { x: s.x + 5, z: s.z + 3 }; }, run),
      enter('tempo', 'Get in the tempo with Bappa on the back.', run),
      { enter: (w) => w.radio('dhol'), update: () => 'done' },
      goto('Drive Bappa to the pandal near Dagdusheth. Gently.', at('pandal'), run, { car: 'tempo', r: 10, gentle: 18, label: 'Bappa\'s trunk is chipped. The whole peth is talking.' }),
      say('Everyone', 'Ganpati Bappa Morya! Pudhchya varshi lavkar ya!', 'गणपती बाप्पा मोरया! पुढच्या वर्षी लवकर या!', 6),
    ],
  },
  {
    id: 'meter', title: 'Meter Down', mr: 'मीटर डाउन', giver: 'Raju rickshawala', where: 'Swargate', at: [18.5001, 73.8584], reward: 0,
    steps: (_w, run) => {
      const steps: Step[] = [
        say('Raju', 'My back has gone, bhau. Run my auto for an hour? Four fares from Swargate. Meter down — don\'t cheat anybody, this is Pune, they will argue to the last rupee.', 'मीटर डाउन', 7),
        spawn('auto', 'auto', (w) => { const s = at('swargate')(w); return { x: s.x + 5, z: s.z }; }, run),
        enter('auto', 'Get in Raju\'s auto.', run),
      ];
      const order = [...FARES].sort(() => Math.random() - 0.5).slice(0, 4);
      for (let i = 0; i < 4; i++) {
        let pickup: Pt = { x: 0, z: 0 }, dropT = 0, startX = 0, startZ = 0;
        const look = randomLook(Math.random);
        steps.push({
          enter: (w) => {
            const p = w.player();
            const a = Math.random() * 6.28, r = 150 + Math.random() * 250;
            const h = w.city.roads.nearest(p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, 80, (q) => q.cls <= 5 && !q.elevated);
            pickup = h ? { x: h.x, z: h.z } : { x: p.x + 50, z: p.z };
            w.objective(`Fare ${i + 1} of 4: pick up the passenger waving at the kerb.`);
            w.marker('goal', pickup, 7, '#3ddc97'); w.route(pickup);
            run.data['waving'] = pickup;
          },
          update: (w) => {
            const p = w.player(), c = run.data['auto'] as Car;
            if (p.car !== c) { w.objective('Get back in the auto.'); return null; }
            if (Math.hypot(p.x - pickup.x, p.z - pickup.z) < 8 && p.speed < 2.5) return 'done';
            return null;
          },
          exit: (w) => { w.marker('goal', null); w.route(null); delete run.data['waving']; },
        });
        const [name, la, lo] = order[i];
        steps.push({
          enter: (w) => {
            const t = w.spot(la, lo);
            run.data['drop'] = t;
            const p = w.player(); startX = p.x; startZ = p.z;
            dropT = 25 + Math.hypot(t.x - p.x, t.z - p.z) / 7;
            w.passenger(look);
            w.say('Passenger', `${name}. And take the shortest way, I know all of them.`, undefined, 4);
            w.objective(`Take the passenger to ${name}.`);
            w.marker('goal', t, 8, '#ffd23f'); w.route(t); w.timer(dropT);
          },
          update: (w, dt) => {
            const p = w.player(), t = run.data['drop'] as Pt, c = run.data['auto'] as Car;
            dropT -= dt; w.timer(Math.max(0, dropT));
            if (p.car !== c) { w.objective('Get back in the auto.'); return null; }
            if (Math.hypot(p.x - t.x, p.z - t.z) < 9 && p.speed < 2.5) {
              const km = Math.hypot(t.x - startX, t.z - startZ) * 1.3 / 1000;
              const fare = Math.round(26 + Math.max(0, km - 1.5) * 17);
              const tip = dropT > 0 ? Math.round(10 + dropT) : 0;
              w.money(fare + tip, dropT > 0 ? `Fare ₹${fare} + tip ₹${tip}` : `Fare ₹${fare}. No tip — "you took the long way".`);
              run.earned += fare + tip;
              return 'done';
            }
            return null;
          },
          exit: (w) => { w.marker('goal', null); w.route(null); w.timer(null); w.passenger(null); },
        });
      }
      steps.push(say('Raju', 'Four fares and nobody fought with you? You are a born rickshawala. Keep the money.', undefined, 5));
      return steps;
    },
  },
  {
    id: 'parvati', title: 'Parvati Chya Payrya', mr: 'पर्वतीच्या पायऱ्या', giver: 'Kulkarni Kaka', where: 'Parvati Paytha', at: [18.4985, 73.85012], reward: 1000,
    steps: (_w, run) => [
      say('Kulkarni Kaka', 'Every morning since 1978 I climb Parvati before six. You young fellows from Bengaluru cannot do it in two minutes.', 'पर्वती चढायची?', 6),
      goto('Run up the steps to the temple on top of Parvati. On foot.', (w) => { const l = w.city.meta.landmarks.find((q) => q.key === 'parvati')!; return { x: l.x + 22, z: l.z + 4 }; }, run, { foot: true, timer: 130, r: 10 }),
      say('Kulkarni Kaka', '…', undefined, 2),
      say('', 'Kulkarni Kaka says nothing at all. In Pune, that is the highest praise.', undefined, 4),
    ],
  },
  {
    id: 'bhoot', title: 'Kaka, Mala Vachva', mr: 'काका, मला वाचवा', giver: 'The night watchman', where: 'Shaniwar Wada', at: [18.5212, 73.8551], reward: 1800, night: true,
    steps: (_w, run) => {
      const lamps: Pt[] = [];
      let lit = 0, t = 150, whisper = 4;
      return [
        say('Watchman', 'On full-moon nights, they say a boy\'s voice calls from the walls: "Kaka, mala vachva" — uncle, save me. Probably bats. Light the five diyas inside and nobody will bother you.', 'काका, मला वाचवा!', 8),
        {
          enter: (w) => {
            const l = w.city.meta.landmarks.find((q) => q.key === 'shaniwarwada')!;
            const cs = Math.cos(l.rot ?? 0), sn = Math.sin(l.rot ?? 0);
            for (const [a, b] of [[-45, -30], [40, -35], [-40, 35], [45, 40], [0, 8]]) lamps.push({ x: l.x + a * cs - b * sn, z: l.z + a * sn + b * cs });
            lamps.forEach((p, i) => w.marker('diya' + i, p, 2, '#ffb347'));
            w.objective('Light the five diyas inside Shaniwar Wada. On foot.'); w.timer(t);
          },
          update: (w, dt) => {
            const p = w.player();
            t -= dt; w.timer(Math.max(0, t));
            if (t <= 0) { run.fail = 'The diyas have gone out. So has your nerve.'; return 'fail'; }
            whisper -= dt;
            if (whisper < 0) { whisper = 7 + Math.random() * 6; w.say('…', ['…kaka…', '…mala vachva…', '(something moves on the wall)', '(a bat. Probably a bat.)'][Math.floor(Math.random() * 4)], undefined, 2.5); }
            lamps.forEach((l, i) => {
              if (l.x !== Infinity && p.onFoot && Math.hypot(p.x - l.x, p.z - l.z) < 2.5) { l.x = Infinity; lit++; w.marker('diya' + i, null); w.sfx('bell'); }
            });
            return lit >= 5 ? 'done' : null;
          },
          exit: (w) => { lamps.forEach((_, i) => w.marker('diya' + i, null)); w.timer(null); },
        },
        say('Watchman', 'See? Nothing. Only bats. (He is standing very close to you.)', undefined, 5),
      ];
    },
  },
  {
    id: 'sunny', title: 'Sunny\'s Getaway', mr: 'सनीची पळापळ', giver: 'Sunny', where: 'Deccan Gymkhana', at: [18.5166, 73.8420], reward: 3000,
    steps: (_w, run) => [
      say('Sunny', 'Bhau, I did ONE wheelie on JM Road and now the whole Deccan police is after me. Take my SUV to my uncle\'s garage in Yerawada. I\'ll take the bus. Bye!', undefined, 6),
      spawn('suv', 'suv', (w) => { const s = at('deccan')(w); return { x: s.x + 4, z: s.z + 4 }; }, run),
      enter('suv', 'Get in Sunny\'s SUV.', run),
      { enter: (w) => { w.setStars(3); w.objective('Lose the police.'); }, update: (w) => (w.stars() === 0 ? 'done' : null) },
      goto('Take the SUV to the garage in Yerawada.', at('yerawada'), run, { car: 'suv', r: 9 }),
      say('Sunny\'s uncle', 'Sunny sent you? That boy. Here — for your trouble. And for not telling his mother.', undefined, 5),
    ],
  },
  {
    id: 'agakhan', title: 'Aajicha Hatt', mr: 'आजीचा हट्ट', giver: 'Aaji', where: 'Kasba Peth', at: [18.5206, 73.8586], reward: 5000, needs: 5,
    steps: (_w, run) => [
      say('Aaji', 'Take me to Aga Khan Palace. Kasturba is resting there — Gandhiji was kept there in \'42, you know. And drive gently. My knees are older than your scooter.', 'हळू चालव!', 7),
      spawn('car', 'sedan', (w) => { const s = at('kasba')(w); return { x: s.x + 5, z: s.z + 3 }; }, run),
      enter('car', 'Get in Mandar\'s car. Aaji is already in the back seat.', run),
      { enter: (w) => { w.passenger(randomLook(() => 0.9, 'woman')); w.radio('peth'); }, update: () => 'done' },
      goto('Drive Aaji to Aga Khan Palace. Gently.', at('agakhan'), run, { car: 'car', r: 12, gentle: 15, label: 'Aaji has asked to be taken home. "You drive like your grandfather."' }),
      { enter: (w) => w.passenger(null), update: () => 'done' },
      say('Aaji', 'Pune has changed so much. The palace hasn\'t. Good. Now — you are staying, no? Pune needs people who know which lane is one-way.', undefined, 8),
    ],
  },
];

// ---------------------------------------------------------------- the runner
export class Missions {
  active: Mission | null = null;
  steps: Step[] = [];
  i = 0;
  run: Run | null = null;
  done = new Set<string>();
  onEnd: (m: Mission, ok: boolean, text: string) => void = () => {};
  constructor(public w: WorldAPI) {}
  available() { return MISSIONS.filter((m) => !this.done.has(m.id) && (!m.needs || this.done.size >= m.needs)); }
  start(m: Mission) {
    if (this.active) return;
    this.active = m;
    this.run = { cars: [], data: {}, startDamage: 0, fail: '', earned: 0 };
    this.steps = m.steps(this.w, this.run);
    this.i = 0;
    this.steps[0]?.enter?.(this.w);
  }
  update(dt: number) {
    if (!this.active || !this.run) return;
    const s = this.steps[this.i];
    if (!s) return this.finish(true);
    const r = s.update ? s.update(this.w, dt) : 'done';
    if (r === 'fail') { s.exit?.(this.w); return this.finish(false, this.run.fail || s.failText || 'Mission failed.'); }
    if (r === 'done') {
      s.exit?.(this.w);
      this.i++;
      if (this.i >= this.steps.length) return this.finish(true);
      this.steps[this.i].enter?.(this.w);
    }
  }
  abort(why = 'Mission abandoned.') { if (this.active) { this.steps[this.i]?.exit?.(this.w); this.finish(false, why); } }
  private finish(ok: boolean, text = '') {
    const m = this.active!, run = this.run!;
    for (const c of run.cars) if (this.w.player().car !== c) this.w.removeCar(c); else c.mission = '';
    this.w.objective(''); this.w.route(null); this.w.timer(null); this.w.passenger(null);
    for (const k of ['goal', 'car', 'target']) this.w.marker(k, null);
    this.active = null; this.run = null;
    if (ok) { this.done.add(m.id); if (m.reward) this.w.money(m.reward, 'Mission passed'); this.w.sfx('pass'); }
    else this.w.sfx('fail');
    this.onEnd(m, ok, ok ? (m.reward ? `+₹${m.reward.toLocaleString('en-IN')}` : `Earned ₹${run.earned}`) : text);
  }
}
