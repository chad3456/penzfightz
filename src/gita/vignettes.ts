/**
 * The teaching, painted. While Krishna speaks, the chariot stands at the
 * left of the picture and a large roundel at the right shows what the verse
 * is about: the self that weapons cannot cut, worn clothes cast off, the
 * tortoise drawing in its limbs, the ocean that the rivers fill without
 * moving it, the lamp in a windless place, the boat blown by the wind.
 * Each vignette is drawn in a 400-unit box centred on the roundel.
 */
import { C, type G, circle, clamp, lerp, io, out, bump, devText, sunDisc, glory, cloud, star4, line, rng, flame, lotus, lotusLeaf, ocean, tree, ellipse, diya, mountain, smooth, fs } from '../chalisa/kit';
import { draw, onGround, P, type Fig, type Look } from '../chalisa/figures';
import { deity } from '../pichwai/frontal';
import { VISHNU, KRISHNA, ARJUNA, VISHVARUPA, fig, avatar, cow, om } from '../pichwai/cast';
import { emblem, type EmblemKey } from '../pichwai/emblems';
import { border, night, dusk, sky, field, cartouche, chariotPair, rays } from '../pichwai/paint';
import type { Beat, Scene } from '../pichwai/stage';

const ink = C.ink;
const SEEKER: Look = { head: 'man', skin: '#c98856', hair: '#15101e', hairStyle: 'short', crown: 'none', dhoti: C.white, dhotiFg: C.saffron, border: C.saffron, scarf: C.saffron, janeu: true, tilak: 'ram' };
const person = (g: G, x: number, y: number, s: number, t: number, o: Partial<Fig> & { look?: Look } = {}) => { const f = fig(o.look ?? SEEKER, { x, s, t, pose: P.stand, ...o }); onGround(f, y); draw(g, f); return f; };
const ring = (g: G, ks: EmblemKey[], r: number, t: number, p: number, s = 0.55) => ks.forEach((k, i) => { const L = out(clamp(p * (ks.length + 1) - i)); const a = -Math.PI / 2 + (i / ks.length) * Math.PI * 2; g.save(); g.globalAlpha = L; emblem(g, k, Math.cos(a) * r, Math.sin(a) * r, s * (0.7 + 0.3 * L), t); g.restore(); });
const selfLight = (g: G, x: number, y: number, r: number, t: number) => { const gr = g.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(0.4, 'rgba(255,214,110,0.8)'); gr.addColorStop(1, 'rgba(255,214,110,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.fillStyle = C.white; star4(g, x, y, r * 0.25 * (1 + 0.1 * Math.sin(t * 3))); };

type V = (g: G, t: number, p: number) => void;

const V: Record<string, V> = {
  atman: (g, t, p) => { // a body of clay, and within it a light that does not go out
    g.save(); g.globalAlpha = 0.85; person(g, 0, 170, 1.25, t, { pose: P.namaste, eye: 'closed' }); g.restore();
    selfLight(g, 4, -40, 90 + 20 * p, t);
  },
  ages: (g, t, p) => { // childhood, youth, age — the same light in each
    const looks: [Look, number][] = [[{ ...SEEKER, head: 'child' }, 0.8], [SEEKER, 1.0], [{ ...SEEKER, head: 'sage', beard: '#e9e2d4', hair: '#e9e2d4', hairStyle: 'bun' }, 1.0]];
    looks.forEach(([l, s], i) => { const x = -120 + i * 120; g.save(); g.globalAlpha = 0.4 + 0.6 * clamp(p * 3 - i); person(g, x, 150, s, t + i, { look: l, pose: i === 2 ? { ...P.stand, lean: 0.12 } : P.stand }); g.restore(); selfLight(g, x + 2, 40 - s * 40, 30, t); });
  },
  seasons: (g, t, p) => { // cold and heat come and go
    sunDisc(g, -90, -60, 60, t, true);
    for (let i = 0; i < 18; i++) { const ph = (t * 0.3 + i / 18) % 1; g.fillStyle = C.white; star4(g, 30 + (i * 37) % 150, -150 + ph * 300, 5); }
    person(g, 0, 170, 1.0, t, { pose: P.namaste, eye: 'closed' }); void p;
  },
  clothes: (g, t, p) => { // worn clothes cast off, new ones put on
    const k = io(clamp(p * 1.3));
    g.save(); g.globalAlpha = 1 - k * 0.7; g.translate(-80 - k * 40, 120 + k * 30); g.rotate(-k * 0.6); g.beginPath(); g.moveTo(-50, -80); g.lineTo(50, -80); g.lineTo(70, 40); g.lineTo(-70, 40); g.closePath(); fs(g, '#a89070', ink, 2); for (let i = 0; i < 4; i++) line(g, [[-40 + i * 25, -60], [-30 + i * 25, 20]], 'rgba(60,40,20,0.5)', 2); g.restore();
    person(g, 70, 170, 1.15, t, { look: { ...SEEKER, dhoti: C.gold, scarf: C.vermilion, scarfFg: C.gold }, pose: P.stand });
    selfLight(g, 72, 0, 40, t);
  },
  elements: (g, t, p) => { // weapons do not cut it, fire does not burn it, water does not wet it, wind does not dry it
    selfLight(g, 0, 0, 80, t);
    const ks: EmblemKey[] = ['sword', 'fire', 'ocean', 'wind'];
    ks.forEach((k, i) => { const a = -Math.PI / 2 + i * Math.PI / 2, d = lerp(170, 100, bump((t * 0.4 + i * 0.25) % 1)); g.save(); g.globalAlpha = clamp(p * 5 - i); emblem(g, k, Math.cos(a) * d, Math.sin(a) * d, 0.6, t); g.restore(); });
  },
  cycle: (g, t, p) => { // unmanifest, manifest, unmanifest again
    const ph = (t * 0.15) % 1, s = bump(ph);
    g.strokeStyle = 'rgba(122,70,30,0.4)'; g.lineWidth = 3; g.setLineDash([6, 8]); g.beginPath(); g.arc(0, 0, 140, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    g.save(); g.globalAlpha = s; lotus(g, 0, 40, 1.6 * s + 0.1, s); g.restore();
    emblem(g, 'wheel', 0, -150, 0.5, t); void p;
  },
  wonder: (g, t, p) => { // one sees it as a wonder, one speaks of it, one hears of it
    selfLight(g, 0, -60, 70, t);
    [[-130, 'eye'], [0, 'book'], [130, 'heart']].forEach(([x, k], i) => { g.save(); g.globalAlpha = clamp(p * 4 - i); person(g, x as number, 170, 0.75, t + i, { pose: i === 1 ? P.bless : P.namaste, eye: 'up' }); emblem(g, k as EmblemKey, x as number, 40, 0.4, t); g.restore(); });
  },
  warrior: (g, t, p) => { // the warrior's dharma: an open door to heaven
    g.beginPath(); g.moveTo(-90, 160); g.lineTo(-90, -60); g.quadraticCurveTo(0, -170, 90, -60); g.lineTo(90, 160); g.closePath(); fs(g, 'rgba(255,240,200,0.9)', C.gold, 6);
    rays(g, 0, -40, 260, t, 0.6 + 0.4 * p);
    person(g, 0, 170, 1.0, t, { look: ARJUNA, pose: P.stand, b: { k: 'bow' } });
  },
  karma: (g, t, p) => { // work offered, not grasped
    person(g, -60, 170, 1.1, t, { pose: { fa: [1.5, 0.3], ba: [1.3, 0.4], fl: [0.06, 0.04], bl: [-0.07, 0.04] }, f: { k: 'lotus' } });
    for (let i = 0; i < 3; i++) { const ph = (t * 0.3 + i / 3) % 1; g.save(); g.globalAlpha = bump(ph); circle(g, lerp(10, 150, ph), -20 - bump(ph) * 80, 12, C.saffron, ink, 1.4); g.restore(); }
    emblem(g, 'hands', 140, -40, 0.55, t); void p;
  },
  flowers: (g, t, p) => { // flowery words of those who want heaven
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2 + t * 0.1; lotus(g, Math.cos(a) * 130, -40 + Math.sin(a) * 90, 0.5, 1, [C.pink, C.marigold, C.lav][i % 3]); }
    person(g, 0, 170, 1.0, t, { pose: P.bless, mouth: 'sing', look: { ...SEEKER, dhoti: C.gold, crown: 'turban', turban: C.vermilion } }); void p;
  },
  well: (g, t, p) => { // a well when the land is flooded
    ocean(g, 20, 220, t * 0.6, [C.sky, C.blue, C.teal]);
    g.beginPath(); g.ellipse(0, 20, 60, 18, 0, 0, Math.PI * 2); fs(g, C.stone, ink, 2.4); g.beginPath(); g.rect(-60, 20, 120, 50); fs(g, C.stone, ink, 2);
    sunDisc(g, 110, -110, 40, t, false); void p;
  },
  lamp: (g, t, p) => { // understanding crossing the thicket of delusion
    for (let i = 0; i < 9; i++) tree(g, -170 + i * 45, 140, 0.5, 'ashoka', t, i);
    g.save(); g.fillStyle = `rgba(20,16,40,${0.6 * (1 - p)})`; g.fillRect(-200, -200, 400, 400); g.restore();
    diya(g, 0, 100, 1.6, t); selfLight(g, 0, 40, 120 * (0.4 + 0.6 * p), t);
  },
  sage: (g, t, p) => { // the sage of steady wisdom
    mountain(g, 0, 190, 380, 140, '#c9b68a', '#8a6a3a', 4);
    person(g, 0, 120, 1.15, t, { look: { ...SEEKER, head: 'sage', beard: '#e9e2d4', hair: '#2a1d1a', hairStyle: 'bun' }, pose: P.sitNamaste, eye: 'closed' });
    glory(g, 0, -40, 30, 90, t, 16, [C.gold, C.cream]); void p;
  },
  tortoise: (g, _t, p) => { // drawing in its limbs on every side
    const k = io(clamp(p * 1.2));
    g.save(); g.scale(2.4, 2.4);
    g.beginPath(); g.ellipse(0, 10, 50, 32, 0, Math.PI, 0); g.closePath(); fs(g, '#6d8a3a', ink, 1.6);
    for (let i = -1; i <= 1; i++) circle(g, i * 20, -4, 9, null, 'rgba(255,240,180,0.7)', 1.4);
    const ext = 1 - k;
    for (const [x, y] of [[-40, 14], [40, 14], [-26, 16], [26, 16]]) ellipse(g, x * (0.7 + 0.3 * ext), y + 6 * ext, 8, 6 * ext + 1, 0, '#7a9a52', ink, 1);
    ellipse(g, 52 * (0.6 + 0.4 * ext), 4, 10 * ext + 2, 8 * ext + 2, 0, '#7a9a52', ink, 1);
    g.restore();
  },
  fall: (g, _t, p) => { // dwelling on objects → attachment → desire → anger → delusion → ruin: a staircase down
    const steps = ['सङ्गः', 'कामः', 'क्रोधः', 'सम्मोहः', 'स्मृतिभ्रंशः', 'बुद्धिनाशः'];
    steps.forEach((w, i) => { const L = out(clamp(p * 7 - i)); g.save(); g.globalAlpha = 0.25 + 0.75 * L; g.beginPath(); g.rect(-180 + i * 56, -150 + i * 52, 120, 40); fs(g, [C.gold, C.marigold, C.saffron, C.vermilion, C.maroon, C.ink][i], ink, 1.6); devText(g, w, -120 + i * 56, -130 + i * 52, 18, i > 3 ? C.cream : C.ink); g.restore(); });
  },
  clear: (g, t, p) => { // the clear mind: still water reflecting the moon
    g.beginPath(); g.rect(-200, 20, 400, 200); g.fillStyle = C.navy; g.fill();
    circle(g, 0, -80, 50, '#fbf5e2'); g.save(); g.globalAlpha = 0.5 + 0.5 * p; g.beginPath(); g.ellipse(0, 100, 46, 16 + 10 * (1 - p) * Math.sin(t * 4), 0, 0, Math.PI * 2); g.fillStyle = '#fbf5e2'; g.fill(); g.restore();
  },
  boat: (g, t, p) => { // the wind carries off a ship on the water / the boat of knowledge
    ocean(g, 40, 220, t, [C.navy2, C.blue, C.teal]);
    const x = Math.sin(t * 0.6) * 60, tilt = Math.sin(t * 1.3) * 0.12 * (1 - p);
    g.save(); g.translate(x, 50); g.rotate(tilt);
    g.beginPath(); g.moveTo(-90, -10); g.quadraticCurveTo(0, 40, 90, -10); g.closePath(); fs(g, C.brown, ink, 2);
    line(g, [[0, -10], [0, -150]], ink, 4); g.beginPath(); g.moveTo(4, -146); g.quadraticCurveTo(80, -100, 4, -30); g.closePath(); fs(g, C.cream, ink, 2);
    g.restore();
  },
  night: (g, t, p) => { // what is night for all beings, the sage is awake in
    g.beginPath(); g.rect(-200, -200, 200, 400); g.fillStyle = '#0b1034'; g.fill();
    g.beginPath(); g.rect(0, -200, 200, 400); g.fillStyle = '#f6d590'; g.fill();
    for (let i = 0; i < 12; i++) { g.fillStyle = C.white; star4(g, -180 + (i * 47) % 170, -170 + (i * 71) % 200, 3); }
    person(g, -80, 170, 0.9, t, { pose: P.sitNamaste, eye: 'open', glow: 0.6 });
    person(g, 100, 170, 0.9, t, { pose: { legs: 'lotus', lean: 0.4, head: 0.5, fa: [0.2, 0.4], ba: [0.1, 0.3] }, eye: 'closed' }); void p;
  },
  ocean: (g, t, p) => { // rivers enter the ocean, which stays unmoved
    ocean(g, 30, 220, t * 0.3, [C.navy, C.navy2, C.blue]);
    for (let i = 0; i < 4; i++) { const sx = i % 2 ? 1 : -1; g.strokeStyle = C.sky; g.lineWidth = 10; g.beginPath(); g.moveTo(sx * 200, -170 + i * 40); g.bezierCurveTo(sx * 120, -100 + i * 30, sx * 60, -20, sx * 20, 40); g.stroke(); }
    for (let i = 0; i < 8; i++) { const ph = (t * 0.4 + i / 8) % 1; g.fillStyle = C.white; star4(g, (i % 2 ? 1 : -1) * lerp(180, 30, ph), lerp(-150, 40, ph), 4); }
    void p;
  },
  question: (g, t, p) => { // Arjuna asks
    emblem(g, 'heart', 0, -40, 1.6, t); devText(g, '?', 0, -40, 90, C.white); void p;
  },
  twopaths: (g, t, p) => { // two paths, of knowledge and of action, to one summit
    mountain(g, 0, 190, 380, 300, '#d6c49a', '#9a7a4a', 6);
    line(g, [[-160, 180], [-80, 80], [-40, 0], [0, -80]], C.gold, 5, true); line(g, [[160, 180], [90, 90], [40, 0], [0, -80]], C.vermilion, 5, true);
    emblem(g, 'book', -150, 60, 0.45, t); emblem(g, 'hands', 150, 60, 0.45, t);
    g.save(); g.globalAlpha = p; selfLight(g, 0, -100, 60, t); g.restore();
  },
  king: (g, t, p) => { // Janaka the king, perfected through action
    person(g, 0, 170, 1.2, t, { look: { ...ARJUNA, head: 'sage', beard: '#e9e2d4', crown: 'mukut' } as Look, pose: P.bless, f: { k: 'plough', a: 0.4 } });
    emblem(g, 'crown', -120, -120, 0.5, t); emblem(g, 'lotus', 120, -120, 0.5, t); void p;
  },
  sun: (g, t, p) => { // the Lord works without needing to, like the sun
    sunDisc(g, 0, -40, 90, t, true); rays(g, 0, -40, 220, t, 0.8);
    for (let i = 0; i < 5; i++) { tree(g, -160 + i * 80, 190, 0.45, 'mango', t, i); } void p;
  },
  gunas: (g, t, p) => { // the three qualities moving the puppet of the doer
    ['#f8f4e6', C.vermilion, '#2a2440'].forEach((c, i) => { const a = -Math.PI / 2 + (i / 3) * Math.PI * 2 + t * 0.2; circle(g, Math.cos(a) * 110, Math.sin(a) * 110, 48, c, ink, 2); line(g, [[Math.cos(a) * 110, Math.sin(a) * 110], [0, -10]], 'rgba(60,40,20,0.6)', 1.6); });
    person(g, 0, 150, 0.8, t, { pose: { fa: [1.0 + Math.sin(t * 2) * 0.5, 0.4], ba: [0.6 - Math.sin(t * 2) * 0.5, 0.4], fl: [0.06, 0.04], bl: [-0.07, 0.04] } }); void p;
  },
  surrender: (g, t, p) => { // laying all action on me
    deity(g, 60, 190, 0.62, t, { ...VISHNU, hands: ['abhaya', 'varada', 'chakra', 'conch'] });
    person(g, -110, 190, 0.85, t, { pose: { ...P.kneel, lean: 0.6 + 0.3 * p, head: 0.2 } });
  },
  nature: (g, t, p) => { // creatures follow their nature: a river runs downhill, the calf to its mother
    cow(g, -40, 160, 0.9, t, { face: 1 }); cow(g, 80, 160, 0.55, t, { face: -1, col: '#e9d2b0' });
    line(g, [[-200, -160], [-80, -80], [40, -120], [200, -40]], C.sky, 10, true); void p;
  },
  ascent: (g, t, p) => { // senses < mind < understanding < the self
    const steps: [string, EmblemKey][] = [['इन्द्रियाणि', 'eye'], ['मनः', 'heart'], ['बुद्धिः', 'lamp'], ['सः', 'om']];
    steps.forEach(([w, k], i) => { const L = out(clamp(p * 5 - i)); const y = 140 - i * 92; g.save(); g.globalAlpha = 0.3 + 0.7 * L; emblem(g, k, -60, y, 0.45, t); devText(g, w, 70, y, 24, C.maroon); g.restore(); if (i) line(g, [[-60, y + 70], [-60, y + 40]], C.gold, 4); });
  },
  paths: (g, t, p) => { // as people come to me, so I receive them: many paths to one centre
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; line(g, [[Math.cos(a) * 190, Math.sin(a) * 190], [Math.cos(a) * 40, Math.sin(a) * 40]], [C.gold, C.vermilion, C.teal, C.rani][i % 4], 4); const ph = (t * 0.2 + i / 8) % 1; circle(g, Math.cos(a) * lerp(180, 50, ph), Math.sin(a) * lerp(180, 50, ph), 7, C.white, ink, 1); }
    selfLight(g, 0, 0, 60, t); void p;
  },
  four: (g, t, p) => { // the four orders, by quality and work
    ring(g, ['book', 'sword', 'pot', 'hands'], 120, t, p, 0.6); emblem(g, 'om', 0, 0, 0.6, t);
  },
  inaction: (g, t, p) => { // inaction in action: the hub still while the wheel turns
    g.save(); g.rotate(t * 0.8); emblem(g, 'wheel', 0, 0, 2.6, t, false); g.restore();
    circle(g, 0, 0, 26, C.gold, ink, 2); selfLight(g, 0, 0, 40, t); void p;
  },
  fireash: (g, t, p) => { // the fire of knowledge burns all action to ash
    for (let i = 0; i < 9; i++) { g.save(); g.translate(-60 + (i % 3) * 60, 120 - Math.floor(i / 3) * 18); g.rotate((i % 2 ? 1 : -1) * 0.3); g.beginPath(); g.rect(-50, -6, 100, 12); fs(g, i / 9 < p ? '#7a7a7a' : C.brown, ink, 1); g.restore(); }
    flame(g, 0, 110, 1.4 * (0.5 + 0.5 * p), t, 3);
  },
  doubt: (g, t, p) => { // the doubting self: tangled thread
    g.strokeStyle = C.maroon; g.lineWidth = 3; g.beginPath(); for (let i = 0; i < 60; i++) { const a = i * 0.7; g.lineTo(Math.cos(a) * (40 + (i % 7) * 18) + Math.sin(t + i) * 4, Math.sin(a * 1.3) * (40 + (i % 5) * 20)); } g.stroke(); void p;
  },
  sword: (g, t, p) => { // cut the doubt in your heart with the sword of knowledge
    g.strokeStyle = C.maroon; g.lineWidth = 3; g.beginPath(); for (let i = 0; i < 40; i++) { const a = i * 0.7; g.lineTo(-40 + Math.cos(a) * (30 + (i % 7) * 10), 40 + Math.sin(a * 1.3) * (30 + (i % 5) * 12)); } g.stroke();
    const k = io(clamp(p * 1.5)); g.save(); g.translate(lerp(160, -40, k), lerp(-160, 40, k)); g.rotate(-0.8); emblem(g, 'sword', 0, 0, 1.6, t, false); g.restore();
  },
  city: (g, t, p) => { // the city of nine gates
    g.beginPath(); g.rect(-150, -80, 300, 220); fs(g, C.peach, ink, 3);
    for (let i = 0; i < 9; i++) { const x = -120 + (i % 5) * 60, y = i < 5 ? -40 : 60; g.beginPath(); g.moveTo(x - 14, y + 30); g.lineTo(x - 14, y); g.quadraticCurveTo(x, y - 20, x + 14, y); g.lineTo(x + 14, y + 30); g.closePath(); fs(g, C.maroon, ink, 1.6); }
    g.beginPath(); g.moveTo(-170, -80); g.lineTo(0, -180); g.lineTo(170, -80); g.closePath(); fs(g, C.gold, ink, 2.4);
    selfLight(g, 120, 110, 30, t); void p;
  },
  cosmos: (g, t, p) => { // seeing the self in all beings and all beings in the self
    emblem(g, 'cosmos', 0, 0, 3.2, t, false);
    person(g, 0, 90, 0.7, t, { pose: P.sitNamaste, eye: 'closed', glow: 0.7 }); void p;
  },
  wind: (g, t, p) => { // the mind as hard to hold as the wind
    for (let i = 0; i < 6; i++) { const y = -140 + i * 50; g.strokeStyle = [C.sky, C.white, C.lav][i % 3]; g.lineWidth = 6; g.beginPath(); for (let x = -200; x <= 200; x += 10) g.lineTo(x, y + Math.sin(x * 0.03 + t * 3 + i) * 14); g.stroke(); }
    tree(g, 0, 190, 0.8, 'peepal', t * 3, 4); void p;
  },
  cloud: (g, t, p) => { // fallen from both, like a broken cloud? no — none who do good come to harm
    sky(g, '#9fc8ea', '#cfe3f0', '#f2e3c6', -200, 200);
    const k = io(clamp(p * 1.4)); cloud(g, -60 - 60 * k, -60, 1.2, t, C.white); cloud(g, 60 + 60 * k, -50, 1.1, t, C.white);
    g.save(); g.globalAlpha = k; emblem(g, 'hands', 0, 60, 1.0, t); g.restore();
  },
  rebirth: (g, t, p) => { // born again in a house of the pure, and carried on by former practice
    g.beginPath(); g.moveTo(-120, 160); g.lineTo(-120, 20); g.lineTo(0, -80); g.lineTo(120, 20); g.lineTo(120, 160); g.closePath(); fs(g, C.cream, ink, 3);
    person(g, -40, 160, 0.85, t, { look: { ...SEEKER, head: 'sage', beard: '#e9e2d4', hair: '#2a1d1a', hairStyle: 'bun' }, pose: P.sitNamaste });
    person(g, 50, 160, 0.6, t, { look: { ...SEEKER, head: 'child' }, pose: P.sitNamaste, eye: 'closed' });
    selfLight(g, 52, 60, 30, t); void p;
  },
  gods: (g, t, p) => { // those who worship the gods go to the gods
    ['sun', 'moon', 'fire', 'rain'].forEach((k, i) => { const x = -150 + i * 100; emblem(g, k as EmblemKey, x, -80, 0.45, t); line(g, [[x, -50], [x, 40]], 'rgba(122,70,30,0.4)', 2); });
    person(g, 0, 170, 0.9, t, { pose: { legs: 'lotus', fa: [1.5, 0.3], ba: [1.3, 0.4] } }); void p;
  },
  om: (g, t, p) => { om(g, 0, -10, 230, t); void p; },
  secret: (g, t, p) => { // the king of knowledge, the king of secrets: a casket opening on a jewel
    const k = io(clamp(p * 1.5));
    g.beginPath(); g.rect(-110, 0, 220, 110); fs(g, C.maroon, ink, 3);
    g.save(); g.translate(-110, 0); g.rotate(-k * 1.2); g.beginPath(); g.rect(0, -40, 220, 40); fs(g, C.gold, ink, 3); g.restore();
    g.save(); g.globalAlpha = k; emblem(g, 'gem', 0, -40, 0.9, t, false); selfLight(g, 0, -40, 100, t); g.restore();
  },
  fools: (g, t, p) => { // fools despise me in human form
    person(g, 70, 170, 1.15, t, { look: KRISHNA, pose: P.stand, f: { k: 'flute' }, mouth: 'smile', face: -1 });
    person(g, -100, 170, 0.95, t, { look: { ...SEEKER, dhoti: C.maroon, crown: 'turban', turban: C.ink }, pose: { ...P.stand, fa: [1.6, 0.2] }, face: 1 }); void p;
  },
  heaven: (g, t, p) => { // to heaven and back again
    sky(g, '#9fc8ea', '#f6e3bc', '#f6e3bc', -200, 200);
    cloud(g, 0, -110, 1.3, t, C.white); emblem(g, 'crown', 0, -130, 0.45, t);
    const ph = (t * 0.2) % 1; const y = ph < 0.5 ? lerp(150, -60, io(ph * 2)) : lerp(-60, 150, io((ph - 0.5) * 2));
    person(g, 0, y, 0.6, t, { pose: P.namaste }); void p;
  },
  carry: (g, t, p) => { // I carry what they lack and keep what they have
    person(g, -90, 170, 1.0, t, { pose: P.sitNamaste, eye: 'closed' });
    person(g, 80, 170, 1.15, t, { look: KRISHNA, face: -1, pose: { fa: [1.4, 1.2], ba: [1.3, 1.3], fl: [0.06, 0.04], bl: [-0.07, 0.04] }, f: { k: 'pot' }, mouth: 'smile' }); void p;
  },
  heart: (g, t, p) => { // the same to all; those who love me are in me and I in them
    emblem(g, 'heart', 0, -10, 2.2, t, false);
    person(g, -60, 120, 0.6, t, { look: KRISHNA, face: 1, pose: P.stand, f: { k: 'flute' } }); person(g, 60, 120, 0.6, t, { pose: P.namaste, face: -1 }); void p;
  },
  origin: (g, t, p) => { // the source of the gods and the seers
    selfLight(g, 0, 0, 120, t); ring(g, ['crown', 'mala', 'star', 'fire', 'sun', 'book'], 140, t, p, 0.45);
  },
  states: (g, t, p) => { // all states of beings come from me
    ring(g, ['lamp', 'book', 'heart', 'mountain', 'hands', 'star', 'eye', 'lotus'], 140, t, p, 0.42); emblem(g, 'om', 0, 0, 0.7, t);
  },
  virtues: (g, t, p) => { // humility, non-violence, patience…: a lotus opening petal by petal
    lotus(g, 0, 60, 3.0, out(clamp(p * 1.2)), C.pink, C.rani); selfLight(g, 0, -10, 50 * p, t);
  },
  seed: (g, t, p) => { // the great womb, and the seed I place in it
    circle(g, 0, 40, 120, '#4a2a1a', ink, 3); g.fillStyle = 'rgba(255,240,200,0.06)';
    const k = io(clamp(p * 1.3)); ellipse(g, 0, 60, 14, 20, 0, C.gold, ink, 1.6);
    g.save(); g.globalAlpha = k; line(g, [[0, 40], [0, 40 - 160 * k]], C.green, 5); lotusLeaf(g, -30, 40 - 120 * k, 0.6); lotusLeaf(g, 30, 40 - 150 * k, 0.6); g.restore();
    rays(g, 0, -170, 260, t, 0.5);
  },
  abode: (g, t, p) => { // the sun does not light it, nor the moon, nor fire
    selfLight(g, 0, -10, 150, t);
    [['sun', -130], ['moon', 0], ['fire', 130]].forEach(([k, x]) => { g.save(); g.globalAlpha = 0.45; emblem(g, k as EmblemKey, x as number, 150, 0.45, t); g.restore(); }); void p;
  },
  purusha: (g, t, p) => { // the perishable, the imperishable, and the supreme person beyond both
    tree(g, -120, 170, 0.6, 'mango', t, 2); g.save(); g.globalAlpha = 0.6; for (let i = 0; i < 4; i++) { const ph = (t * 0.3 + i / 4) % 1; ellipse(g, -120 + i * 10, 40 + ph * 120, 8, 5, ph * 4, C.olive); } g.restore();
    mountain(g, 120, 180, 140, 160, '#c9b68a', '#8a6a3a', 3);
    g.save(); g.globalAlpha = 0.4 + 0.6 * p; deity(g, 0, 40, 0.4, t, { ...VISHNU, base: 'none' }); g.restore();
  },
  gates: (g, t, p) => { // the threefold gate of hell: desire, anger, greed
    ['कामः', 'क्रोधः', 'लोभः'].forEach((w, i) => { const x = -130 + i * 130; g.beginPath(); g.moveTo(x - 46, 150); g.lineTo(x - 46, -40); g.quadraticCurveTo(x, -110, x + 46, -40); g.lineTo(x + 46, 150); g.closePath(); fs(g, '#2a1020', C.vermilion, 4); flame(g, x, 140, 0.5, t, i); devText(g, w, x, -140, 26, C.maroon); }); void p;
  },
  scripture: (g, t, p) => { emblem(g, 'book', 0, -20, 2.4, t, false); diya(g, -120, 150, 1.0, t); diya(g, 120, 150, 1.0, t); void p; },
  relinquish: (g, t, p) => { // giving up the fruit, not the work
    tree(g, 0, 190, 1.0, 'mango', t, 5);
    for (let i = 0; i < 5; i++) { const ph = (t * 0.25 + i / 5) % 1; g.save(); g.globalAlpha = 1 - ph; circle(g, -60 + i * 30, -40 + ph * 220, 10, C.saffron, ink, 1.2); g.restore(); } void p;
  },
  five: (g, t, p) => { // the five causes of every action
    ring(g, ['earth', 'crown', 'hands', 'wind', 'star'], 130, t, p, 0.5); devText(g, '५', 0, 0, 80, C.maroon);
  },
  worship: (g, t, p) => { // worshipping him with one's own work
    person(g, -120, 170, 0.85, t, { pose: { ...P.stride, f: undefined } as Fig['pose'], f: { k: 'plough' } });
    person(g, 0, 170, 0.85, t, { pose: P.bless, f: { k: 'book' } });
    person(g, 120, 170, 0.85, t, { pose: P.mace, f: { k: 'sword' }, look: ARJUNA });
    selfLight(g, 0, -120, 60, t); void p;
  },
  cosmicTeach: (g, t, p) => { deity(g, 0, 200, 0.75, t, VISHVARUPA(10)); void p; },
  avatars: (g, t, p) => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2; g.save(); g.globalAlpha = clamp(p * 11 - i); avatar(g, i, Math.cos(a) * 140, Math.sin(a) * 140 + 40, 0.28, t); g.restore(); } },
};

/** The roundel image used on each chapter's card. */
export const CHAPTER_VIGNETTE = ['warrior', 'atman', 'karma', 'avatars', 'virtues', 'sage', 'cosmos', 'om', 'heart', 'origin', 'cosmicTeach', 'heart', 'seed', 'gunas', 'purusha', 'gates', 'om', 'surrender'];

/** A key word for each vignette, painted under the roundel. */
const LABEL: Record<string, string> = {
  atman: 'आत्मा', ages: 'देहान्तरप्राप्तिः', seasons: 'तितिक्षस्व', clothes: 'वासांसि जीर्णानि', elements: 'नैनं छिन्दन्ति', cycle: 'अव्यक्तादीनि', wonder: 'आश्चर्यवत्', warrior: 'स्वधर्मः', karma: 'योगः कर्मसु कौशलम्',
  flowers: 'पुष्पितां वाचम्', well: 'उदपाने', lamp: 'मोहकलिलम्', sage: 'स्थितप्रज्ञः', tortoise: 'कूर्मोऽङ्गानीव', fall: 'ध्यायतो विषयान्', clear: 'प्रसादः', boat: 'नावमिवाम्भसि', night: 'या निशा', ocean: 'समुद्रमापः',
  twopaths: 'द्विविधा निष्ठा', king: 'जनकादयः', sun: 'वर्त एव च कर्मणि', gunas: 'गुणा गुणेषु', surrender: 'मयि सर्वाणि कर्माणि', nature: 'प्रकृतिं यान्ति', ascent: 'बुद्धेः परतः', paths: 'मम वर्त्मानुवर्तन्ते',
  four: 'चातुर्वर्ण्यम्', inaction: 'कर्मण्यकर्म', fireash: 'ज्ञानाग्निः', doubt: 'संशयात्मा', sword: 'ज्ञानासिना', city: 'नवद्वारे पुरे', cosmos: 'सर्वभूतस्थमात्मानम्', wind: 'वायोरिव', cloud: 'छिन्नाभ्रमिव',
  rebirth: 'योगभ्रष्टः', gods: 'देवान्देवयजः', om: 'ॐ', secret: 'राजविद्या', fools: 'अवजानन्ति', heaven: 'क्षीणे पुण्ये', carry: 'योगक्षेमं वहाम्यहम्', heart: 'समोऽहं सर्वभूतेषु', origin: 'अहमादिः',
  states: 'मत्त एव', virtues: 'ज्ञानम्', seed: 'बीजप्रदः पिता', abode: 'न तद्भासयते सूर्यः', purusha: 'पुरुषोत्तमः', gates: 'त्रिविधं नरकस्य', scripture: 'शास्त्रम्', relinquish: 'त्यागः', five: 'पञ्च कारणानि', worship: 'स्वकर्मणा',
  question: 'पृच्छामि',
};

/** Draw a vignette into a circle of radius R at (cx, cy). */
export function vignette(g: G, key: string, cx: number, cy: number, R: number, t: number, p: number) {
  const f = V[key] ?? V.atman;
  g.save(); g.translate(cx, cy); g.scale(R / 200, R / 200);
  try { f(g, t, p); } finally { g.restore(); }
}

const sum = (b: Beat) => b.c.reduce((a, x) => a + x, 0) / Math.max(1, b.c.length);
const TINT: [string, string, string][] = [['#f6c47a', '#f7a26a', '#f3d6a8'], ['#9fd2ef', '#f6ead0', '#f3d6a8'], ['#3a2a6a', '#c8506a', '#f39a4a']];

/** Krishna teaching from the chariot, with the verse painted in a roundel. */
export const teach: Scene = (g, b) => {
  const t = b.T, key = String(b.arg ?? 'atman'), p = sum(b), ch = b.seg.sec;
  const tint = TINT[ch % 3];
  sky(g, tint[0], tint[1], tint[2]);
  field(g, 640, t);
  if (key === 'question') {
    // Arjuna asks; Krishna listens
    g.save(); cam0(g, b.run.p);
    chariotPair(g, 760, 870, 1.35, t, { arjuna: 'namaste', krishna: 'turn' });
    g.restore();
    cartouche(g, 'पृच्छामि', 560, 200, 40, { w: 300, alpha: clamp(p * 4) });
    border(g, C.peacock); return;
  }
  chariotPair(g, 380, 870, 0.95, t, { arjuna: 'namaste', krishna: 'teach', glow: 0.4 });
  // the roundel
  const cx = 1060, cy = 400, R = 290, k = out(clamp(b.run.t / 1.2));
  g.save(); g.globalAlpha = k;
  glory(g, cx, cy, R * 0.9, R * 1.15, t, 36, [C.gold, C.cream]);
  circle(g, cx, cy, R + 12, C.vermilion, ink, 2);
  circle(g, cx, cy, R, '#fbf3df', C.gold, 6);
  g.save(); g.beginPath(); g.arc(cx, cy, R - 3, 0, Math.PI * 2); g.clip();
  vignette(g, key, cx, cy, R - 10, t, clamp(b.run.p * 1.1));
  g.restore();
  for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; circle(g, cx + Math.cos(a) * (R + 6), cy + Math.sin(a) * (R + 6), 4, C.cream, ink, 1); }
  if (LABEL[key]) cartouche(g, LABEL[key], cx, cy + R + 40, 30, { w: Math.max(240, LABEL[key].length * 18) });
  g.restore();
  border(g, C.peacock);
};

function cam0(g: G, p: number) { const z = lerp(1.0, 1.12, io(p)); g.translate(800, 450); g.scale(z, z); g.translate(-800, -470); }

export { night, dusk, smooth, rng, bump, VISHVARUPA };
