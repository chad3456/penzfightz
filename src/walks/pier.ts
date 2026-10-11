/**
 * The Pier — a California pier on a bright Saturday, from above: the old
 * men fishing at the rail, a busker, a lemonade cart, the bait shop, kids
 * and skaters, and below, the surfers in the break, the lifeguard tower, the
 * sand and the sunbathers.
 */
import { type G, Iso, Scene, C, HAIR, SKIN, INK, box, plane, onPlane, inkFill, ln, ellipse, rng, pick, shade, grain, SERIF, SANS, TAU, type Pt } from './kit';
import { POSES, randomLook, type Look, type Joints } from './people';
import { bench, dog, wallText } from './props';
import { type Plate, type Who, ip, type IP } from './stage';

const W = 2400, H = 1600, LW = 1.5, DECK = 420, X0 = 1400, X1 = 1900;
const look = (seed: number, o: Partial<Look>) => randomLook(seed, o);
const SEA = '#4fa9a6', SEA2 = '#3f9893', SAND = '#efd6a0', WOOD = '#c9a070';

function paint(g: G, who: Who[]) {
  const I = new Iso(500, 236, 0.6);
  const person = (sc: Scene, x: number, y: number, z: number, o: IP) => ip(sc, I, who, x, y, z, o);

  /* ── the sea ── */
  const sea = g.createLinearGradient(0, 0, W * 0.3, H); sea.addColorStop(0, '#3a8f94'); sea.addColorStop(1, SEA);
  g.fillStyle = sea; g.fillRect(0, 0, W, H);
  // ripples
  const R = rng(5); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.lineCap = 'round';
  for (let i = 0; i < 260; i++) { const x = R() * W, y = R() * H, w = 14 + R() * 26; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 5, x + w, y); g.stroke(); }
  g.strokeStyle = 'rgba(20,70,70,0.25)'; for (let i = 0; i < 160; i++) { const x = R() * W, y = R() * H, w = 12 + R() * 22; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y + 4, x + w, y); g.stroke(); }
  // the beach: sand beyond a wavy shoreline at y ≈ 1050
  const shore = (x: number) => 1050 + Math.sin(x / 260) * 60 + Math.sin(x / 90) * 14;
  const sandPts: Pt[] = []; for (let x = -1600; x <= 4200; x += 40) sandPts.push(I.p(x, shore(x), 0));
  g.beginPath(); g.moveTo(...sandPts[0]); for (const p of sandPts) g.lineTo(...p); g.lineTo(I.p(4200, 6000, 0)[0], H + 400); g.lineTo(-400, H + 400); g.closePath(); g.fillStyle = SAND; g.fill();
  // wet sand and foam
  g.beginPath(); g.moveTo(...sandPts[0]); for (const p of sandPts) g.lineTo(...p); g.lineWidth = 26; g.strokeStyle = '#d9c08a'; g.stroke();
  for (const [off, a, w] of [[-30, 0.95, 10], [-90, 0.7, 7], [-170, 0.45, 5]] as [number, number, number][]) { g.beginPath(); for (let x = -1600; x <= 4200; x += 30) { const p = I.p(x, shore(x) + off + Math.sin(x / 40) * 8, 0); if (x === -1600) g.moveTo(...p); else g.lineTo(...p); } g.lineWidth = w; g.strokeStyle = `rgba(255,255,255,${a})`; g.stroke(); }
  g.beginPath(); g.moveTo(...sandPts[0]); for (const p of sandPts) g.lineTo(...p); g.lineWidth = LW; g.strokeStyle = INK; g.stroke();
  // speckle on the sand
  const Rs = rng(9); g.fillStyle = 'rgba(150,110,60,0.25)'; for (let i = 0; i < 1400; i++) { const x = -400 + Rs() * 3200, y = 1100 + Rs() * 2400; const p = I.p(x, y, 0); if (p[1] > 0 && p[1] < H) g.fillRect(p[0], p[1], 2, 2); }

  // the pier's shadow on the water and sand
  onPlane(g, I, 'z', 0, (gg) => { gg.moveTo(X1, -4000); gg.lineTo(X1 + 260, -4000); gg.lineTo(X1 + 260, 3000); gg.lineTo(X1, 3000); gg.closePath(); }); g.fillStyle = 'rgba(10,50,60,0.28)'; g.fill();

  /* ── behind the pier (x < X0): the sailboat, the swimmers, the left beach ── */
  const back = new Scene(g);
  back.add(I.depth(400, -300), () => {
    // a small sailboat
    const x = 500, y = -300;
    onPlane(g, I, 'z', 0, (gg) => { gg.moveTo(x - 160, y); gg.quadraticCurveTo(x, y - 60, x + 200, y); gg.quadraticCurveTo(x, y + 60, x - 160, y); }); inkFill(g, C.white, LW);
    const m0 = I.p(x, y, 10), m1 = I.p(x, y, 520); ln(g, m0[0], m0[1], m1[0], m1[1], LW * 1.6);
    g.beginPath(); g.moveTo(m1[0], m1[1]); g.lineTo(...I.p(x + 170, y, 40)); g.lineTo(m0[0] + 2, m0[1] - 20); g.closePath(); inkFill(g, '#f7f1df', LW);
    g.beginPath(); g.moveTo(m1[0] - 2, m1[1] + 30); g.lineTo(...I.p(x - 130, y, 40)); g.lineTo(m0[0] - 2, m0[1] - 20); g.closePath(); inkFill(g, '#e3584a', LW);
    for (let k = 0; k < 4; k++) { const p = I.p(x + 220 + k * 50, y + k * 20, 0); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + 30, p[1] + 8); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 3; g.stroke(); }
  });
  // swimmers near the shore on the left
  for (const [x, y, sd, c] of [[700, 900, 1, C.red], [900, 980, 2, C.navy]] as [number, number, number, string][]) back.add(I.depth(x, y), () => { const [px, py] = I.p(x, y, 0); g.save(); g.beginPath(); g.ellipse(px, py, 26, 9, 0, 0, TAU); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 3; g.stroke(); g.restore(); ellipse(g, px, py - 8, 8, 9, 0, pick(rng(sd), [...SKIN]), LW); g.beginPath(); g.arc(px, py - 10, 8, Math.PI, TAU); g.fillStyle = c; g.fill(); g.lineWidth = LW; g.strokeStyle = INK; g.stroke(); });
  // left beach: a sandcastle crew
  back.draw();

  /* ── the pier ── */
  const pier = new Scene(g);
  // pilings
  for (let y = -3600; y < 2800; y += 300) for (const x of [X0 + 20, X1 - 40]) pier.add(-1e6 + I.depth(x, y), () => { box(g, I, x, y, -40, 20, 20, DECK, { top: '#6b4128', left: '#8a5a3a', right: '#6b4128', lw: LW }); const p = I.p(x + 20, y + 20, 0); g.beginPath(); g.ellipse(p[0] - 6, p[1] - 4, 22, 7, 0, 0, TAU); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 2; g.stroke(); });
  for (let y = -3600; y < 2800; y += 300) pier.add(-1e6 + I.depth(X0, y) + 1, () => { const a = I.p(X0 + 30, y + 10, 60), b = I.p(X1 - 30, y + 10, 300); ln(g, a[0], a[1], b[0], b[1], LW * 2.4); ln(g, a[0], a[1], b[0], b[1], LW, '#8a5a3a'); });
  // the deck
  pier.add(-5e5, () => {
    box(g, I, X0, -4000, DECK - 24, X1 - X0, 7000, 24, { top: WOOD, left: '#a8804e', right: '#8a6a40', lw: LW });
    onPlane(g, I, 'z', DECK, (gg) => { for (let y = -4000; y < 3000; y += 26) { gg.moveTo(X0, y); gg.lineTo(X1, y); } }); g.strokeStyle = 'rgba(80,50,20,0.28)'; g.lineWidth = 1; g.stroke();
    // far railing (along x = X0)
    for (let y = -4000; y < 3000; y += 150) { const a = I.p(X0 + 4, y, DECK), b = I.p(X0 + 4, y, DECK + 100); ln(g, a[0], a[1], b[0], b[1], LW * 2.6); ln(g, a[0], a[1], b[0], b[1], LW, '#f4ecd6'); }
    for (const z of [DECK + 100, DECK + 55]) { const a = I.p(X0 + 4, -4000, z), b = I.p(X0 + 4, 3000, z); ln(g, a[0], a[1], b[0], b[1], LW * 3.4); ln(g, a[0], a[1], b[0], b[1], LW * 1.6, '#f4ecd6'); }
  });
  const pp = (x: number, y: number, o: IP) => person(pier, x, y, DECK, o);
  // the bait shop out along the pier
  pier.add(I.depth(1650, -1250), () => {
    box(g, I, X0 + 60, -1500, DECK, 360, 300, 260, { top: '#e3584a', left: '#f4ecd6', right: '#e6dcc4', lw: LW });
    box(g, I, X0 + 40, -1520, DECK + 260, 400, 340, 16, { top: '#d9493f', left: '#c9433a', right: '#a9302a', lw: LW });
    plane(g, I, 'x', X0 + 420, (gg) => gg.rect(-1440, 60, 180, 120), '#a9cfe0', LW);
    wallText(g, I, 'x', X0 + 420, -1350, 220, 'BAIT & TACKLE', 34, `bold ${SANS}`, '#d9493f');
    plane(g, I, 'y', -1200, (gg) => gg.rect(X0 + 140, 0, 80, 200), '#6b4128', LW);
  });
  // fishermen at the near rail
  const fishers: [number, Partial<Look>, string, string][] = [
    [-1150, { fem: false, age: 'old', skin: SKIN[1], hair: HAIR.grey, style: 'short', topKind: 'jacket', top: C.olive, inner: C.white, bottom: C.khaki, hat: { kind: 'bucket', color: C.khaki }, glasses: true }, 'Mr. Nguyen, 74', 'Fishes this pier every Saturday since 1979. Feeds his catch to whoever on the block is having a hard week.'],
    [-950, { fem: true, age: 'old', skin: SKIN[2], hair: HAIR.black, style: 'bun', topKind: 'sweater', top: C.coral, bottom: C.navy, hat: { kind: 'bucket', color: C.white } }, 'Doña Rosa, 69', 'Out-fishes her husband every single week. He has started bringing a book.'],
    [-700, { fem: false, skin: SKIN[5], hair: HAIR.black, style: 'short', topKind: 'tee', top: C.white, bottom: C.denim, hat: { kind: 'cap', color: C.navy }, beard: true }, 'Darius, 38', 'Taught his son to cast this morning. The son caught the first fish. Darius is very proud and slightly devastated.'],
    [-450, { fem: false, age: 'kid', skin: SKIN[5], hair: HAIR.black, style: 'short', topKind: 'tee', top: C.red, bottom: C.khaki, bottomKind: 'shorts', hat: { kind: 'cap', color: C.red } }, 'Jaden, 8', 'Caught a mackerel. Has named it, and would like to keep it as a pet.'],
  ];
  const rod = (gg: G, J: Joints) => { const [x, y] = J.hF; const tipx = x + 90 * J.fwd, tipy = y - 70; ln(gg, x, y, tipx, tipy, LW * 2.4); ln(gg, x, y, tipx, tipy, LW, C.chocolate); gg.beginPath(); gg.moveTo(tipx, tipy); gg.quadraticCurveTo(tipx + 20 * J.fwd, tipy + 60, tipx + 26 * J.fwd, tipy + 200); gg.lineWidth = 0.8; gg.strokeStyle = 'rgba(31,26,23,0.6)'; gg.stroke(); };
  for (const [y, lk, n, l] of fishers) pp(X1 - 70, y, { face: '+x', turn: 0.5, look: look(1010 - y, lk), pose: { ...POSES.lean, armF: [70, 100] }, hold: rod, who: [n, l] });
  pier.add(I.depth(X1 - 110, -2100), () => { for (const y of [-1200, -1000, -760]) { box(g, I, X1 - 140, y, DECK, 30, 30, 34, { top: '#f4ecd6', left: '#3b7dd8', right: '#2c5fa8', lw: LW }); } });
  // the busker with an open case
  pp(1580, -100, { face: '+y', turn: 0.4, look: look(1020, { fem: true, skin: SKIN[0], hair: HAIR.blond, style: 'long', topKind: 'jacket', top: C.denim, inner: C.white, bottom: C.black, bottomKind: 'skirt', hat: { kind: 'cowboy', color: C.tan } }), pose: POSES.play, hold: (gg: G, J: Joints) => guitarSmall(gg, J), mood: 'open', who: ['Lacey, 27', 'Moved out from Tennessee to make it. Plays the pier on weekends, waits tables during the week, and has written two hundred songs, eleven of them good.'] });
  pier.add(I.depth(1600, 0), () => { plane(g, I, 'z', DECK + 1, (gg) => gg.rect(1560, -20, 80, 40), '#2b2b30', LW); plane(g, I, 'z', DECK + 2, (gg) => gg.rect(1566, -14, 68, 28), '#a8303a', LW * 0.6); for (let k = 0; k < 5; k++) { const p = I.p(1580 + k * 10, -6 + (k % 2) * 10, DECK + 3); ellipse(g, p[0], p[1], 3, 2, 0, k % 2 ? '#7ac08a' : '#e3c060', 0.6); } });
  pp(1700, 120, { face: '-y', turn: 0.45, look: look(1021, { fem: false, age: 'old', skin: SKIN[6], hair: HAIR.white, style: 'balding', topKind: 'shirt', top: C.sky, accent: C.white, bottom: C.khaki, hat: { kind: 'cap', color: C.khaki } }), pose: { ...POSES.hips }, mood: 'smile', who: ['Mr. Pruitt, 82', 'Played trumpet in a Navy band in 1962. Stops for every busker on the pier and tips the good ones a five.'] });
  pp(1780, 60, { face: '-y', turn: 0.45, look: look(1022, { fem: true, age: 'old', skin: SKIN[6], hair: HAIR.grey, style: 'short', topKind: 'blouse', top: C.lav, bottom: C.navy, bottomKind: 'skirt' }), pose: POSES.stand, mood: 'smile', who: ['Mrs. Pruitt, 80', 'Married to the trumpet player for fifty-nine years. Holds his ice cream while he listens.'] });
  // the lemonade cart
  pier.add(I.depth(1560, 700), () => {
    box(g, I, X0 + 60, 620, DECK + 20, 140, 90, 90, { top: '#fbfaf5', left: '#f3dc8a', right: '#e3c060', lw: LW });
    for (const y of [630, 700]) { const p = I.p(X0 + 200, y, DECK + 20); ellipse(g, p[0], p[1], 9, 9, 0, C.char, LW); }
    const a = I.p(X0 + 130, 665, DECK + 110), b = I.p(X0 + 130, 665, DECK + 220); ln(g, a[0], a[1], b[0], b[1], LW * 1.6);
    g.beginPath(); g.ellipse(b[0], b[1], 70, 26, 0, Math.PI, TAU); g.closePath(); inkFill(g, '#f4a6a0', LW);
    for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(b[0], b[1] - 26); g.lineTo(b[0] - 70 + k * 28, b[1]); g.strokeStyle = 'rgba(31,26,23,0.4)'; g.lineWidth = 1; g.stroke(); }
    wallText(g, I, 'y', 710, X0 + 130, DECK + 70, 'LEMONADE', 22, `bold ${SANS}`, '#c9433a');
  });
  pp(X0 + 120, 560, { face: '+y', turn: 0.4, look: look(1030, { fem: false, skin: SKIN[2], hair: HAIR.black, style: 'short', topKind: 'tee', top: C.butter, bottom: C.khaki, apron: C.white, hat: { kind: 'cap', color: C.mustard }, beard: 'mustache' }), pose: { ...POSES.point, armF: [80, 100] }, mood: 'smile', who: ['Héctor, 49', 'Lemonade and raspados since 2004, from his father’s cart. Mango with chamoy is the best seller and the one he recommends.'] });
  pp(1700, 760, { face: '-x', turn: 0.5, look: look(1031, { fem: true, age: 'kid', skin: SKIN[1], hair: HAIR.black, style: 'bob', topKind: 'dress', top: C.mint, bottom: C.mint, shoes: C.red }), pose: { ...POSES.reach, armF: [120, 150] }, mood: 'open', who: ['Hana, 6', 'Buying her first lemonade with her own money: four quarters, counted twice.'] });
  // the bench pair and a dog
  pier.add(I.depth(X0 + 30, 300), () => { g.save(); g.translate(0, -DECK * I.zs); bench(g, I, X0 + 20, 250, 'y', LW); g.restore(); });
  person(pier, X0 + 42, 290, DECK + 45, { face: '+x', turn: 0.55, look: look(1040, { fem: false, skin: SKIN[3], hair: HAIR.dark, style: 'curly', topKind: 'tee', top: C.teal, bottom: C.denim }), pose: { ...POSES.sit, armF: [60, 80] }, mood: 'smile', who: ['Gabe, 30', 'Proposed on this bench ten minutes ago. She said yes. He has not yet stopped smiling.'] });
  person(pier, X0 + 42, 360, DECK + 45, { face: '+x', turn: 0.55, look: look(1041, { fem: true, skin: SKIN[0], hair: HAIR.auburn, style: 'long', topKind: 'dress', top: C.coral, bottom: C.coral }), pose: { ...POSES.sit, armN: [40, 120] }, mood: 'open', hold: (gg: G, J: Joints) => { const [x, y] = J.hN; ellipse(gg, x, y - 6, 4, 4, 0, '#fbfaf5', LW); }, who: ['Maya, 29', 'Looking at the ring, then the ocean, then the ring.'] });
  pier.add(I.depth(1700, -300), () => { const [x, y] = I.p(1720, -300, DECK); dog(g, x, y, I.zs * 0.75, 1, '#f2efe6', LW, { tail: 10, ear: '#3a3a40' }); });
  pp(1640, -340, { face: '+y', turn: 0.45, look: look(1042, { fem: true, skin: SKIN[3], hair: HAIR.black, style: 'ponytail', topKind: 'tank', top: C.mustard, bottom: C.black, bottomKind: 'shorts' }), pose: POSES.walk, who: ['Sofia, 34', 'Walking Frank, who is fourteen and sets the pace. They will reach the end of the pier by sunset.'] });
  // rollerblader and runner
  pp(1760, 1400, { face: '-y', turn: 0.5, look: look(1050, { fem: false, skin: SKIN[5], hair: HAIR.black, style: 'locs', topKind: 'tank', top: C.red, bottom: C.black, bottomKind: 'shorts', hat: { kind: 'headphones', color: C.white } }), pose: POSES.stride, who: ['Andre, 44', 'Has skated this pier every morning for twenty years. Still does the little spin at the end.'] });
  pp(1520, 1800, { face: '-y', turn: 0.5, look: look(1051, { fem: true, skin: SKIN[1], hair: HAIR.black, style: 'ponytail', topKind: 'tank', top: C.sky, bottom: C.navy, bottomKind: 'shorts' }), pose: POSES.run, who: ['Jin, 36', 'ER doctor, running off a night shift. Mile four of six.'] });
  // lamp posts along the near rail
  for (let y = -3400; y < 2800; y += 900) pier.add(I.depth(X1 - 10, y), () => { const a = I.p(X1 - 14, y, DECK), b = I.p(X1 - 14, y, DECK + 300); ln(g, a[0], a[1], b[0], b[1], LW * 3); ln(g, a[0], a[1], b[0], b[1], LW * 1.4, '#2c3f6b'); ellipse(g, b[0], b[1] - 6, 9, 11, 0, '#fff1c8', LW); });
  // near railing, post by post, so people pass behind it properly
  for (let y = -4000; y < 3000; y += 150) pier.add(I.depth(X1 - 4, y) + 30, () => { const a = I.p(X1 - 4, y, DECK), b = I.p(X1 - 4, y, DECK + 100); ln(g, a[0], a[1], b[0], b[1], LW * 2.6); ln(g, a[0], a[1], b[0], b[1], LW, '#f4ecd6'); for (const z of [DECK + 100, DECK + 55]) { const c = I.p(X1 - 4, y, z), d = I.p(X1 - 4, y + 150, z); ln(g, c[0], c[1], d[0], d[1], LW * 3.4); ln(g, c[0], c[1], d[0], d[1], LW * 1.6, '#f4ecd6'); } });
  pier.draw();

  /* ── in front of the pier (x > X1): surfers in the break, the beach on the right ── */
  const front = new Scene(g);
  front.add(I.depth(2050, 1260), () => { const p = I.p(2050, 1260, 0); g.beginPath(); g.moveTo(p[0] - 30, p[1]); g.lineTo(p[0] - 22, p[1] - 30); g.lineTo(p[0] - 8, p[1] - 30); g.lineTo(p[0] - 6, p[1] - 44); g.lineTo(p[0] + 6, p[1] - 44); g.lineTo(p[0] + 8, p[1] - 30); g.lineTo(p[0] + 22, p[1] - 30); g.lineTo(p[0] + 30, p[1]); g.closePath(); inkFill(g, '#e0c080', LW); ln(g, p[0], p[1] - 44, p[0], p[1] - 62, LW); g.beginPath(); g.moveTo(p[0], p[1] - 62); g.lineTo(p[0] + 14, p[1] - 57); g.lineTo(p[0], p[1] - 52); inkFill(g, C.red, LW * 0.6); });
  person(front, 1990, 1300, 0, { face: '+x', turn: 0.55, look: look(1001, { age: 'kid', fem: false, skin: SKIN[4], hair: HAIR.black, style: 'short', topKind: 'tank', top: C.mustard, bottom: C.teal, bottomKind: 'shorts', shoes: SKIN[4] }), pose: POSES.kneel, mood: 'open', who: ['Kai, 7', 'Building the tallest sandcastle on the beach. The tide has other ideas and is on its way.'] });
  person(front, 2120, 1210, 0, { face: '-x', turn: 0.5, look: look(1002, { age: 'kid', fem: true, skin: SKIN[4], hair: HAIR.black, style: 'ponytail', topKind: 'tank', top: C.pink, bottom: C.pink, bottomKind: 'shorts', shoes: SKIN[4] }), pose: POSES.floorCross, mood: 'smile', who: ['Leilani, 5', 'In charge of the moat. Takes it very seriously.'] });
  // the break: lines of white water toward the shore
  front.add(-1e6, () => {
    for (const [y0, a] of [[620, 0.9], [760, 0.75], [880, 0.6]] as [number, number][]) { g.beginPath(); for (let x = X1 + 300; x <= 4200; x += 40) { const p = I.p(x, y0 + Math.sin(x / 150) * 30, 0); if (x === X1 + 300) g.moveTo(...p); else g.lineTo(...p); } g.lineWidth = 12; g.strokeStyle = `rgba(255,255,255,${a})`; g.stroke(); g.lineWidth = 4; g.strokeStyle = 'rgba(30,110,110,0.45)'; g.stroke(); }
  });
  const surfer = (x: number, y: number, board: string, o: IP, stand: boolean) => {
    front.add(I.depth(x, y) - 1, () => { onPlane(g, I, 'z', 0, (gg) => gg.ellipse(x, y, 130, 30, 0.3, 0, TAU)); inkFill(g, board, LW); onPlane(g, I, 'z', 0, (gg) => gg.ellipse(x - 120, y - 20, 60, 30, 0.3, 0, TAU)); g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 4; g.stroke(); });
    person(front, x, y, stand ? 4 : 0, { ...o, pose: stand ? { ...POSES.hips, armN: [-80, -60], armF: [80, 60], legN: [-20, -10], legF: [20, 10], lean: 10 } : { ...POSES.sitBack, armN: [10, 30], armF: [20, 40] } });
  };
  surfer(2500, 650, C.butter, { face: '+x', turn: 0.5, look: look(1060, { fem: true, skin: SKIN[4], hair: HAIR.black, style: 'ponytail', topKind: 'tank', top: C.black, bottom: C.black, bottomKind: 'shorts', shoes: SKIN[4] }), pose: POSES.stand, who: ['Malia, 19', 'Surfing since she was four, on her grandfather’s old board. Lifeguard certification next month.'] }, true);
  surfer(2900, 500, C.red, { face: '+y', turn: 0.5, look: look(1061, { fem: false, skin: SKIN[0], hair: HAIR.blond, style: 'curly', topKind: 'tank', top: C.navy, bottom: C.navy, bottomKind: 'shorts', shoes: SKIN[0] }), pose: POSES.stand, who: ['Brody, 52', 'Accountant. Out at six every Saturday. Has been waiting for this particular wave since about 1989.'] }, false);
  surfer(2300, 420, C.white, { face: '+y', turn: 0.5, look: look(1062, { fem: false, skin: SKIN[3], hair: HAIR.black, style: 'short', topKind: 'tank', top: C.teal, bottom: C.teal, bottomKind: 'shorts', shoes: SKIN[3] }), pose: POSES.stand, who: ['Luis, 23', 'Lesson three. Stood up once this morning, for almost a second. It counted.'] }, false);
  // the lifeguard tower on the right beach
  front.add(I.depth(2600, 1500), () => {
    const x = 2560, y = 1450;
    for (const [dx, dy] of [[0, 0], [160, 0], [0, 160], [160, 160]]) { const a = I.p(x + dx, y + dy, 0), b = I.p(x + dx, y + dy, 260); ln(g, a[0], a[1], b[0], b[1], LW * 3.4); ln(g, a[0], a[1], b[0], b[1], LW * 1.6, '#f4ecd6'); }
    box(g, I, x - 20, y - 20, 260, 200, 200, 20, { top: '#f4ecd6', left: '#e6dcc4', right: '#d8cbb0', lw: LW });
    box(g, I, x, y, 280, 160, 160, 150, { top: '#e3584a', left: '#7ac0d8', right: '#6ab0c8', lw: LW });
    plane(g, I, 'x', x + 160, (gg) => gg.rect(y + 20, 320, 120, 70), '#cfe7ec', LW);
    box(g, I, x - 20, y - 20, 430, 200, 200, 14, { top: '#d9493f', left: '#c9433a', right: '#a9302a', lw: LW });
    wallText(g, I, 'y', y + 160, x + 80, 300, 'TOWER 7', 22, `bold ${SANS}`, '#fbfaf5');
  });
  person(front, 2740, 1560, 260, { face: '-y', turn: 0.5, look: look(1070, { fem: false, skin: SKIN[2], hair: HAIR.black, style: 'short', topKind: 'tank', top: C.red, bottom: C.red, bottomKind: 'shorts', shoes: SKIN[2], glasses: '#2b2b30' }), pose: POSES.hips, who: ['Officer Tavita, 31, lifeguard', 'Samoan, raised in Long Beach. Has pulled one hundred and nine people out of rip currents. Remembers every one.'] });
  // sunbathers and an umbrella
  front.add(I.depth(2200, 1500) - 1, () => { for (const [x, y, c] of [[2120, 1420, '#3b7dd8'], [2300, 1560, '#f4a6a0']] as [number, number, string][]) { plane(g, I, 'z', 0, (gg) => gg.rect(x, y, 90, 190), c, LW); onPlane(g, I, 'z', 0, (gg) => { for (let k = 1; k < 4; k++) { gg.moveTo(x + k * 22, y); gg.lineTo(x + k * 22, y + 190); } }); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3; g.stroke(); } });
  person(front, 2165, 1600, 0, { face: '+x', turn: 0.4, rot: -1.5, look: look(1080, { fem: true, skin: SKIN[5], hair: HAIR.black, style: 'afro', topKind: 'tank', top: C.mustard, bottom: C.mustard, bottomKind: 'shorts', shoes: SKIN[5], glasses: '#2b2b30' }), pose: { ...POSES.stand, armN: [170, 150], armF: [175, 160] }, mood: 'smile', who: ['Tasha, 40', 'High-school principal. First Saturday all year with nothing on the calendar. Plans to do nothing for six hours, with intent.'] });
  person(front, 2345, 1740, 0, { face: '+x', turn: 0.4, rot: -1.5, look: look(1081, { fem: false, skin: SKIN[1], hair: HAIR.dark, style: 'short', topKind: 'tank', top: C.green, bottom: C.navy, bottomKind: 'shorts', shoes: SKIN[1] }), pose: { ...POSES.stand, armN: [20, 120], armF: [20, 120] }, hold: (gg: G, J: Joints) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2; gg.beginPath(); gg.rect(cx - 10, cy - 8, 20, 14); inkFill(gg, C.red, LW); }, who: ['Daniel, 45', 'Reading the same detective novel he started on this beach last summer. Has not progressed. Does not mind.'] });
  front.add(I.depth(2260, 1440), () => { const a = I.p(2260, 1440, 0), b = I.p(2260, 1440, 230); ln(g, a[0], a[1], b[0], b[1], LW * 2); g.beginPath(); g.ellipse(b[0], b[1], 90, 34, 0, Math.PI, TAU); g.closePath(); inkFill(g, '#f3dc8a', LW); for (let k = 0; k < 6; k++) { if (k % 2) continue; g.beginPath(); g.moveTo(b[0], b[1] - 34); g.lineTo(b[0] - 90 + k * 30, b[1]); g.lineTo(b[0] - 90 + (k + 1) * 30, b[1]); g.closePath(); g.fillStyle = '#e3584a'; g.fill(); } g.beginPath(); g.ellipse(b[0], b[1], 90, 34, 0, Math.PI, TAU); g.closePath(); g.lineWidth = LW; g.strokeStyle = INK; g.stroke(); });
  front.draw();

  // gulls
  const Rg = rng(14); for (let i = 0; i < 12; i++) { const x = 300 + Rg() * 2000, y = 120 + Rg() * 500, s = 0.8 + Rg() * 0.5; g.save(); g.translate(x, y); g.scale(s, s); g.beginPath(); g.moveTo(-16, 0); g.quadraticCurveTo(-8, -10, 0, -1); g.quadraticCurveTo(8, -10, 16, 0); g.quadraticCurveTo(8, -4, 0, 3); g.quadraticCurveTo(-8, -4, -16, 0); inkFill(g, '#fbfaf5', 1.4); g.restore(); }

  // title
  g.beginPath(); g.rect(1620, 1380, 720, 150); inkFill(g, '#fbf6e6', LW * 1.4);
  g.fillStyle = '#1f3a40'; g.textAlign = 'left'; g.font = `600 60px "Cinzel", ${SERIF}`; g.fillText('The Pier', 1652, 1452);
  g.font = `italic 29px ${SERIF}`; g.fillText('Southern California, a Saturday in June, 10:15 a.m.', 1654, 1498);
  grain(g, W, H, 0.12, 31);
  void shade; void SEA2;
}

function guitarSmall(g: G, J: Joints) {
  const s = J.s, bx = (J.P[0] + J.hN[0]) / 2 + 4 * s * J.fwd, by = J.P[1] - 10 * s;
  g.save(); g.translate(bx, by); g.rotate(J.fwd * -0.5);
  g.beginPath(); g.ellipse(-6 * s, 2 * s, 9 * s, 7.5 * s, 0, 0, TAU); g.ellipse(4 * s, 0, 6.5 * s, 5.5 * s, 0, 0, TAU); inkFill(g, '#d9893a', 1.5);
  ellipse(g, -1 * s, 1 * s, 2.2 * s, 2.2 * s, 0, INK, 0);
  g.beginPath(); g.rect(8 * s, -1.4 * s, 26 * s, 2.8 * s); inkFill(g, C.chocolate, 1.5);
  g.restore();
}

export const PIER: Plate = {
  key: 'pier', title: 'The Pier', place: 'A California pier',
  blurb: 'A pier on a bright Saturday morning: old fishermen at the rail, a busker from Tennessee, a lemonade cart, a proposal on a bench, surfers in the break, a lifeguard in Tower 7, and sunbathers doing nothing, with intent.',
  w: W, h: H, paint,
};
