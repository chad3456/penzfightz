/**
 * Friday Night Lights — a small-town high-school football game, fourth
 * quarter, under the lights: the home stands, the marching band on the
 * track, the cheerleaders, the huddle, the coach, and the booster club
 * selling hot dogs behind the end zone.
 */
import { type G, Iso, Scene, C, HAIR, SKIN, INK, box, plane, onPlane, inkFill, ln, ellipse, rng, pick, grain, SERIF, SANS, TAU } from './kit';
import { POSES, randomLook, type Look, type Joints, type Pose } from './people';
import { wallText } from './props';
import { type Plate, type Who, ip, type IP } from './stage';

const W = 2400, H = 1600, LW = 1.4;
const TIGER = '#e8762c', TIGER2 = '#2b2b30', VIS = '#2c5fa8';
const look = (seed: number, o: Partial<Look>) => randomLook(seed, o);

function paint(g: G, who: Who[]) {
  const I = new Iso(1200, 50, 0.5);
  const sc = new Scene(g);
  const person = (x: number, y: number, z: number, o: IP) => ip(sc, I, who, x, y, z, o);

  /* ── the ground ── */
  g.fillStyle = '#2f4a3a'; g.fillRect(0, 0, W, H);
  // the track
  plane(g, I, 'z', 0, (gg) => gg.rect(0, -400, 520, 4400), '#b8574a', LW);
  onPlane(g, I, 'z', 0, (gg) => { for (let k = 1; k < 5; k++) { gg.moveTo(k * 104, -400); gg.lineTo(k * 104, 4000); } }); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.4; g.stroke();
  plane(g, I, 'z', 0, (gg) => gg.rect(520, 3000, 4000, 600), '#b8574a', LW);
  // the field, mown in five-yard stripes, end zone at the near end
  plane(g, I, 'z', 0, (gg) => gg.rect(520, -400, 4000, 3400), '#4f9a4a', LW);
  for (let k = 0; k < 8; k++) if (k % 2) plane(g, I, 'z', 0, (gg) => gg.rect(520, -400 + k * 457, 4000, 457), '#5aa654', 0);
  plane(g, I, 'z', 0, (gg) => gg.rect(520, 2086, 4000, 914), TIGER2, 0);
  onPlane(g, I, 'z', 0, (gg) => { for (let k = -1; k < 6; k++) { const y = 2086 - k * 457; gg.moveTo(520, y); gg.lineTo(4520, y); } gg.moveTo(520, 3000); gg.lineTo(4520, 3000); }); g.strokeStyle = '#fbfaf5'; g.lineWidth = 3; g.stroke();
  // hash marks and numbers
  onPlane(g, I, 'z', 0, (gg) => { for (let y = -400; y < 2086; y += 91) { gg.moveTo(1900, y); gg.lineTo(1960, y); gg.moveTo(3100, y); gg.lineTo(3160, y); } }); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; g.stroke();
  for (const [y, t] of [[1172, '10'], [258, '20']] as [number, string][]) { const p = I.p(900, y, 0); g.save(); g.translate(p[0], p[1]); g.transform(0.5, 0.25, -0.5, 0.25, 0, 0); g.rotate(-Math.PI / 2); g.fillStyle = '#fbfaf5'; g.font = `bold 150px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 0, 0); g.restore(); }
  // the end zone lettering
  { const p = I.p(2520, 2540, 0); g.save(); g.translate(p[0], p[1]); g.transform(0.5, 0.25, -0.5, 0.25, 0, 0); g.fillStyle = TIGER; g.font = `bold 320px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TIGERS', 0, 0); g.restore(); }

  /* ── the home stands ── */
  const ROWS = 8;
  sc.add(-1e6, () => {
    for (let k = ROWS - 1; k >= 0; k--) box(g, I, -100 * (k + 1), -400, 0, 100, 3600, 46 * (k + 1), { top: '#c9c9c4', left: '#9aa0a6', right: '#b8bcc0', lw: LW });
    // the rail at the front
    for (let y = -400; y < 3200; y += 200) { const a = I.p(-6, y, 46), b = I.p(-6, y, 140); ln(g, a[0], a[1], b[0], b[1], LW * 2.4); ln(g, a[0], a[1], b[0], b[1], LW, '#d8d6cf'); }
    const a = I.p(-6, -400, 140), b = I.p(-6, 3200, 140); ln(g, a[0], a[1], b[0], b[1], LW * 3); ln(g, a[0], a[1], b[0], b[1], LW * 1.4, '#d8d6cf');
    // a banner on the front of the stands
    plane(g, I, 'x', 0, (gg) => gg.rect(400, 6, 1400, 34), TIGER, LW);
    wallText(g, I, 'x', 0, 1100, 23, 'GO TIGERS · STATE 1987 · 2004', 24, `bold ${SANS}`, '#fbfaf5');
  });
  // the crowd, row by row
  const R = rng(41);
  const named: Record<string, [string, string, Partial<Look>, Pose?, IP['hold']?]> = {
    '1:5': ['Coach Dawson’s wife, Pam, 52', 'Has not sat down since the third quarter. Knows every play before it is called, and says so.', { fem: true, skin: SKIN[0], hair: HAIR.blond, style: 'bob', topKind: 'jacket', top: TIGER, inner: C.white, bottom: C.denim }, POSES.handsUp],
    '2:9': ['Mayor Ruiz, 61', 'Owns the hardware store. Mayor on the side. Has missed one home game since 1999, for his daughter’s wedding, and listened on the radio.', { fem: false, skin: SKIN[2], hair: HAIR.grey, style: 'short', topKind: 'jacket', top: '#5c6670', inner: C.white, bottom: C.khaki, hat: { kind: 'cowboy', color: C.tan } }],
    '0:14': ['Grandma Lou, 88', 'Watched her son play here, then her grandson, now her great-grandson, number 22. Under the same blanket.', { fem: true, age: 'old', skin: SKIN[5], hair: HAIR.white, style: 'short', topKind: 'coat', top: '#7d2a3a', bottom: C.navy, glasses: true }],
    '3:4': ['Brayden, 9', 'Orange face paint, tiger ears, total confidence. Will be the quarterback in 2033. He has told everyone.', { fem: false, age: 'kid', skin: SKIN[1], hair: HAIR.blond, style: 'short', topKind: 'hoodie', top: TIGER, bottom: C.denim }, POSES.handsUp],
    '4:12': ['Mr. and Mrs. Patel, 47', 'Own the motel off the highway. Their son kicks. Nobody in the family knew what a field goal was three years ago.', { fem: false, skin: SKIN[3], hair: HAIR.black, style: 'side', topKind: 'sweater', top: TIGER2, bottom: C.khaki, glasses: true }],
    '1:18': ['Pastor Green, 66', 'Opens every season with a prayer for both teams and a request, directed upward, regarding the kicker.', { fem: false, age: 'old', skin: SKIN[6], hair: HAIR.grey, style: 'balding', topKind: 'coat', top: C.char, bottom: C.char, glasses: true }],
    '5:7': ['Kayla, 16', 'Here for the band, specifically the third trombone. Has a sign. The sign is for the trombone.', { fem: true, age: 'teen', skin: SKIN[4], hair: HAIR.black, style: 'braids', topKind: 'hoodie', top: TIGER, bottom: C.black }, POSES.handsUp],
  };
  for (let k = 0; k < 6; k++) for (let j = 0; j < 26; j++) {
    const key = `${k}:${j}`, nm = named[key];
    if (!nm && R() < 0.22) continue;
    const x = -100 * k - 45, y = -300 + j * 130 + (R() - 0.5) * 30, z = 46 * (k + 1);
    const fan = R() < 0.55;
    const lk = nm ? look(1200 + k * 40 + j, nm[2]) : look(1300 + k * 40 + j, { topKind: pick(R, ['hoodie', 'jacket', 'sweater', 'coat'] as const), top: fan ? pick(R, [TIGER, TIGER, TIGER2]) : pick(R, [C.navy, C.red, C.grey, C.olive, C.wine, C.teal]), bottomKind: 'pants', hat: R() < 0.2 ? { kind: pick(R, ['cap', 'beanie', 'cowboy'] as const), color: pick(R, [TIGER, TIGER2, C.navy, C.tan]) } : undefined });
    const cheer = nm?.[3] ?? (R() < 0.18 ? POSES.handsUp : R() < 0.5 ? POSES.sit : { ...POSES.sit, armN: [20, 60], armF: [30, 80] });
    const stand = cheer === POSES.handsUp;
    person(x, y, stand ? z - 46 : z, { face: '+x', turn: 0.3 + R() * 0.25, look: lk, pose: stand ? { ...POSES.handsUp, armN: [-130, -165], armF: [130, 165] } : cheer, mood: stand ? 'open' : pick(R, ['smile', 'flat', 'open'] as const), who: nm ? [nm[0], nm[1]] : undefined, lw: LW });
  }

  /* ── the home sideline: bench, coach, players ── */
  sc.add(I.depth(700, 1000), () => box(g, I, 640, 300, 0, 60, 1500, 42, { top: '#9aa0a6', left: '#7a7a80', right: '#5c6670', lw: LW }));
  const player = (seed: number, num: string, skin: string, o: Partial<Look> = {}) => look(seed, { fem: false, age: 'teen', skin, hair: HAIR.black, style: 'short', topKind: 'tee', top: TIGER, sleeve: 'short', bottom: C.white, shoes: C.black, build: 1.3, number: num, hat: { kind: 'helmet', color: TIGER2 }, ...o });
  const sideline: [number, string, string, Pose][] = [[500, '55', SKIN[5], POSES.sit], [650, '71', SKIN[1], POSES.sit], [800, '34', SKIN[3], POSES.sit], [1500, '12', SKIN[0], POSES.sit]];
  for (const [y, n, sk, ps] of sideline) person(670, y, 42, { face: '+x', turn: 0.5, look: player(1400 + y, n, sk), pose: { ...ps, armN: [20, 70], armF: [30, 75] }, lw: LW });
  person(900, 1100, 0, { face: '+x', turn: 0.5, look: look(1410, { fem: false, skin: SKIN[0], hair: HAIR.grey, style: 'short', topKind: 'jacket', top: TIGER2, inner: TIGER, bottom: C.khaki, hat: { kind: 'cap', color: TIGER }, glasses: '#2b2b30' }), pose: { ...POSES.point, armF: [100, 110], armN: [150, 170] }, mood: 'open', who: ['Coach Dawson, 58', 'Thirty-one seasons. Teaches U.S. history in the mornings. Has never once raised his voice in a classroom and has never once lowered it on a Friday.'], lw: LW });
  person(980, 1300, 0, { face: '+x', turn: 0.5, look: look(1411, { fem: true, skin: SKIN[5], hair: HAIR.black, style: 'ponytail', topKind: 'tee', top: C.white, bottom: C.khaki, hat: { kind: 'headphones', color: C.char } }), pose: { ...POSES.cradle, head: 24 }, hold: (gg: G, J: Joints) => { const cx = (J.hN[0] + J.hF[0]) / 2, cy = (J.hN[1] + J.hF[1]) / 2 - 3; gg.beginPath(); gg.rect(cx - 7, cy - 9, 14, 18); inkFill(gg, '#fbfaf5', LW); }, who: ['Coach Reyes, 29', 'Offensive coordinator, the first woman on a varsity staff in the county. Played quarterback at this school in 2013, on the girls’ flag team that won state.'], lw: LW });
  // the huddle
  const hud: [number, number, string, string, string?][] = [[2150, 1350, '22', SKIN[5], 'Marcus, 17, number 22'], [2280, 1300, '7', SKIN[0], 'Tyler, 17, number 7'], [2380, 1380, '88', SKIN[3]], [2340, 1500, '64', SKIN[1]], [2200, 1520, '51', SKIN[6]], [2090, 1460, '3', SKIN[2], 'Diego, 16, number 3'], [2270, 1430, '9', SKIN[4]]];
  const huddleLine: Record<string, string> = { 'Marcus, 17, number 22': 'Running back. Grandma Lou’s great-grandson. Has offers from two colleges and a 3.8 GPA, and would like everybody to mention the GPA first.', 'Tyler, 17, number 7': 'Quarterback. Calling the play. His father was the quarterback in 2004, the last time the Tigers won state.', 'Diego, 16, number 3': 'Kicker. Played soccer until last year. Thirty-eight yards is his record. They will need forty.' };
  for (const [x, y, n, sk, nm] of hud) { const dx = 2240 - x, dy = 1420 - y; person(x, y, 0, { face: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? '+x' : '-x') : (dy > 0 ? '+y' : '-y'), turn: 0.45, look: player(1500 + x, n, sk, { top: TIGER }), pose: { ...POSES.lean, lean: 24, armN: [60, 80], armF: [60, 80] }, who: nm ? [nm, huddleLine[nm]] : undefined, lw: LW }); }
  // the visitors, waiting
  for (const [x, y, n] of [[2600, 1130, '44'], [2760, 1190, '12'], [2900, 1100, '67'], [2720, 1020, '21']] as [number, number, string][]) person(x, y, 0, { face: '+y', turn: 0.45, look: player(1600 + x, n, pick(rng(x), [...SKIN]), { top: VIS, hat: { kind: 'helmet', color: '#fbfaf5' } }), pose: { ...POSES.hips }, lw: LW });
  // the referee
  person(2500, 1650, 0, { face: '+y', turn: 0.4, look: look(1620, { fem: false, skin: SKIN[2], hair: HAIR.grey, style: 'short', topKind: 'tee', top: C.white, stripes: '#2b2b30', sleeve: 'short', bottom: C.white, hat: { kind: 'cap', color: C.white }, beard: 'mustache' }), pose: { ...POSES.handsUp, armN: [-120, -175], armF: [120, 175] }, mood: 'open', who: ['Ref Hollis, 63', 'Thirty-five years in stripes. Retired mail carrier. Has been called blind by four generations of the same families, and loves every one of them.'], lw: LW });

  /* ── the cheerleaders on the sideline ── */
  const cheer: [number, number, Pose, string, string?][] = [[580, 2000, POSES.handsUp, SKIN[3], 'Jasmine, 17, captain'], [590, 2120, { ...POSES.wave, armF: [150, 170] }, SKIN[0]], [580, 2240, POSES.handsUp, SKIN[5]], [600, 2360, { ...POSES.hips }, SKIN[1]]];
  for (const [x, y, pose, sk, nm] of cheer) person(x, y, 0, { face: '-x', turn: 0.45, look: look(1700 + y, { fem: true, age: 'teen', skin: sk, hair: pick(rng(y), [HAIR.black, HAIR.brown, HAIR.blond]), style: 'ponytail', topKind: 'tank', top: TIGER, bottom: TIGER2, bottomKind: 'skirt', shoes: C.white, socks: C.white }), pose, who: nm ? [nm, 'Captain of the squad, and of the debate team, and of the Saturday shift at the Dairy Queen. Wants to be a surgeon.'] : undefined, hold: (gg: G, J: Joints) => { for (const h of [J.hN, J.hF]) { gg.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; gg.moveTo(h[0], h[1]); gg.lineTo(h[0] + Math.cos(a) * 9, h[1] + Math.sin(a) * 9); } gg.lineWidth = 3; gg.strokeStyle = i2c(h[0]); gg.stroke(); } }, lw: LW });

  /* ── the band on the track ── */
  const bandColors: Partial<Look> = { topKind: 'jacket', top: '#7d2a3a', inner: '#fbfaf5', bottom: TIGER2, shoes: C.black, hat: { kind: 'shako', color: '#fbfaf5', tassel: TIGER } };
  const instruments = ['drum', 'trumpet', 'tuba', 'trombone'] as const;
  const Rb = rng(7);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const x = 120 + c * 150, y = 2500 + r * 160, inst = instruments[(r + c) % 4];
    const nm = r === 1 && c === 2 ? ['Devon, 16, third trombone', 'Practises in his grandmother’s garage every night. Has no idea there is a sign in the stands about him.'] as [string, string] : r === 3 && c === 0 ? ['Mrs. Okonjo, 45, band director', 'Came from Lagos to teach music in a town of four thousand. Her band has more trophies than the football team, and the football team is very good.'] as [string, string] : undefined;
    person(x, y, 0, { face: '+y', turn: 0.4, look: look(1800 + r * 3 + c, { ...bandColors, skin: pick(Rb, [...SKIN]), fem: Rb() < 0.5, age: nm && nm[0].startsWith('Mrs') ? 'adult' : 'teen' }), pose: inst === 'drum' ? { ...POSES.walk, armN: [30, 100], armF: [30, 100] } : { ...POSES.walk, armN: [40, 120], armF: [50, 130] }, hold: (gg: G, J: Joints) => instrument(gg, J, inst), who: nm, lw: LW });
  }
  // the drum major
  person(260, 2340, 0, { face: '+y', turn: 0.4, look: look(1850, { fem: true, age: 'teen', skin: SKIN[2], hair: HAIR.black, style: 'bun', topKind: 'coat', top: '#fbfaf5', bottom: '#fbfaf5', shoes: C.white, hat: { kind: 'shako', color: '#7d2a3a', tassel: TIGER } }), pose: { ...POSES.wave, armF: [175, 175] }, over: (gg: G, J: Joints) => { const [x, y] = J.hF; ln(gg, x, y, x + 4, y - 40, LW * 2.6); ln(gg, x, y, x + 4, y - 40, LW * 1.2, '#d8d6cf'); ellipse(gg, x + 4, y - 42, 4, 4, 0, '#fbfaf5', LW); }, who: ['Lucía, 17, drum major', 'Leads a hundred and twelve people with a baton and a look. Is going to Juilliard if the scholarship comes through; the town is holding a bake sale either way.'], lw: LW });

  /* ── the goal posts ── */
  sc.add(I.depth(2520, 3000), () => {
    const a = I.p(2520, 3060, 0), b = I.p(2520, 3060, 300); ln(g, a[0], a[1], b[0], b[1], LW * 5); ln(g, a[0], a[1], b[0], b[1], LW * 2.6, '#f3dc8a');
    const c1 = I.p(2520, 3000, 300); ln(g, b[0], b[1], c1[0], c1[1], LW * 5); ln(g, b[0], b[1], c1[0], c1[1], LW * 2.6, '#f3dc8a');
    const l = I.p(2240, 3000, 300), r = I.p(2800, 3000, 300); ln(g, l[0], l[1], r[0], r[1], LW * 5); ln(g, l[0], l[1], r[0], r[1], LW * 2.6, '#f3dc8a');
    for (const x of [2240, 2800]) { const p0 = I.p(x, 3000, 300), p1 = I.p(x, 3000, 900); ln(g, p0[0], p0[1], p1[0], p1[1], LW * 5); ln(g, p0[0], p0[1], p1[0], p1[1], LW * 2.6, '#f3dc8a'); }
  });

  /* ── the booster club stand behind the end zone ── */
  sc.add(I.depth(1700, 3500), () => {
    box(g, I, 1300, 3250, 0, 500, 300, 260, { top: '#7d2a3a', left: '#e9dfc6', right: '#d8cbb0', lw: LW });
    box(g, I, 1280, 3230, 260, 540, 340, 20, { top: TIGER, left: TIGER, right: '#c85a1a', lw: LW });
    plane(g, I, 'x', 1800, (gg) => gg.rect(3290, 100, 220, 110), '#3a3a40', LW);
    plane(g, I, 'x', 1800, (gg) => gg.rect(3280, 92, 240, 12), '#fbfaf5', LW);
    wallText(g, I, 'x', 1800, 3400, 236, 'BOOSTER CLUB', 30, `bold ${SANS}`, TIGER2);
    wallText(g, I, 'y', 3550, 1550, 150, 'HOT DOGS $2 · NACHOS $3', 22, `bold ${SANS}`, '#7d2a3a');
  });
  person(1760, 3400, 0, { face: '+x', turn: 0.45, look: look(1900, { fem: true, skin: SKIN[1], hair: HAIR.auburn, style: 'short', topKind: 'tee', top: TIGER, bottom: C.denim, apron: C.white }), pose: { ...POSES.point, armF: [80, 100] }, hold: (gg: G, J: Joints) => { const [x, y] = J.hF; gg.beginPath(); gg.ellipse(x + 8, y, 12, 5, 0, 0, TAU); inkFill(gg, '#e0c08a', LW); ln(gg, x + 2, y - 2, x + 16, y - 3, 2.4, '#c9433a'); }, mood: 'smile', who: ['Debbie, 49, booster club', 'Has sold hot dogs at every home game for fifteen years. The new scoreboard was paid for in hot dogs, and she can tell you how many.'], lw: LW });
  for (const [x, y, sd, nm] of [[1900, 3350, 1, ['Hank, 70', 'Farmer, soybeans and corn. Comes for the nachos and the fourth quarter, in that order.']], [2000, 3420, 2, undefined], [2100, 3380, 3, undefined]] as [number, number, number, [string, string] | undefined][]) person(x, y, 0, { face: '-x', turn: 0.45, look: look(1950 + sd, sd === 1 ? { fem: false, age: 'old', skin: SKIN[0], hair: HAIR.white, style: 'balding', topKind: 'jacket', top: '#4a5a3a', inner: C.white, bottom: C.denim, hat: { kind: 'cap', color: '#2c5f3a' } } : {}), pose: POSES.stand, who: nm, lw: LW });

  sc.draw();

  /* ── the lights: everything outside the field falls toward dusk ── */
  g.save(); g.globalCompositeOperation = 'multiply';
  const glow = g.createRadialGradient(1500, 820, 200, 1400, 820, 1500); glow.addColorStop(0, '#ffffff'); glow.addColorStop(0.6, '#e8e4f4'); glow.addColorStop(1, '#5a5a8a');
  g.fillStyle = glow; g.fillRect(0, 0, W, H); g.restore();
  g.save(); g.globalCompositeOperation = 'screen'; const warm = g.createRadialGradient(1500, 820, 100, 1500, 820, 1100); warm.addColorStop(0, 'rgba(255,240,200,0.18)'); warm.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = warm; g.fillRect(0, 0, W, H); g.restore();
  // a bank of lights at the top edge, and moths
  for (const x of [1700, 2050]) { const y = 30; g.beginPath(); g.rect(x - 90, y - 60, 180, 70); inkFill(g, '#3a3a40', LW * 1.4); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) ellipse(g, x - 66 + i * 44, y - 40 + j * 32, 14, 12, 0, '#fff6d8', LW); ln(g, x, y + 10, x, y + 200, LW * 4); ln(g, x, y + 10, x, y + 200, LW * 2, '#9aa0a6'); }
  g.save(); g.globalCompositeOperation = 'screen'; for (const x of [1700, 2050]) { const gl = g.createRadialGradient(x, 20, 10, x, 20, 420); gl.addColorStop(0, 'rgba(255,246,216,0.55)'); gl.addColorStop(1, 'rgba(255,246,216,0)'); g.fillStyle = gl; g.fillRect(x - 420, 0, 840, 440); } g.restore();

  // title
  g.beginPath(); g.rect(1560, 1360, 790, 170); inkFill(g, '#1f1f30', LW * 1.4, TIGER);
  g.fillStyle = '#fbfaf5'; g.textAlign = 'left'; g.font = `600 56px "Cinzel", ${SERIF}`; g.fillText('Friday Night Lights', 1592, 1430);
  g.font = `italic 28px ${SERIF}`; g.fillText('Tigers 21, Wildcats 17. Fourth quarter, 1:52 to go.', 1594, 1474);
  g.fillStyle = TIGER; g.font = `600 20px "Cinzel", ${SERIF}`; g.fillText('A TOWN OF 4,100 · ITS STADIUM SEATS 5,000', 1594, 1510);
  grain(g, W, H, 0.12, 13);
}

function i2c(x: number) { return Math.floor(x / 7) % 2 ? '#e8762c' : '#fbfaf5'; }

function instrument(g: G, J: Joints, kind: 'drum' | 'trumpet' | 'tuba' | 'trombone') {
  const s = J.s;
  if (kind === 'drum') { const cx = (J.hN[0] + J.hF[0]) / 2, cy = J.P[1] - 10 * s; g.beginPath(); g.rect(cx - 9 * s, cy - 4 * s, 18 * s, 10 * s); inkFill(g, '#fbfaf5', 1.3); ellipse(g, cx, cy - 4 * s, 9 * s, 3 * s, 0, '#e9e6dd', 1.3); for (let i = 0; i < 3; i++) ln(g, cx - 8 * s + i * 8 * s, cy - 3 * s, cx - 4 * s + i * 8 * s, cy + 5 * s, 0.8, '#7d2a3a'); }
  if (kind === 'trumpet') { const [x, y] = J.hF; ln(g, x - 6 * J.fwd, y - 2, x + 14 * s * J.fwd, y - 6 * s, 3.2); ln(g, x - 6 * J.fwd, y - 2, x + 14 * s * J.fwd, y - 6 * s, 1.6, '#f3c35a'); ellipse(g, x + 15 * s * J.fwd, y - 6.4 * s, 2.4 * s, 2.8 * s, 0, '#f3c35a', 1.2); }
  if (kind === 'trombone') { const [x, y] = J.hF; ln(g, x - 4 * J.fwd, y, x + 26 * s * J.fwd, y - 4 * s, 3.2); ln(g, x - 4 * J.fwd, y, x + 26 * s * J.fwd, y - 4 * s, 1.6, '#f3c35a'); ellipse(g, x - 6 * s * J.fwd, y - 2 * s, 2.6 * s, 3 * s, 0, '#f3c35a', 1.2); }
  if (kind === 'tuba') { const [x, y] = J.sN; g.beginPath(); g.ellipse(x - 2 * s * J.fwd, y - 8 * s, 8 * s, 7 * s, 0, 0, TAU); inkFill(g, '#f3c35a', 1.3); ellipse(g, x - 2 * s * J.fwd, y - 9 * s, 5 * s, 4 * s, 0, '#c99a2a', 1); g.beginPath(); g.ellipse(x + 2 * s * J.fwd, y + 6 * s, 6 * s, 9 * s, 0, 0, TAU); g.lineWidth = 2.6; g.strokeStyle = INK; g.stroke(); g.lineWidth = 1.4; g.strokeStyle = '#f3c35a'; g.stroke(); }
}

export const FRIDAY: Plate = {
  key: 'friday', title: 'Friday Night Lights', place: 'A small-town stadium',
  blurb: 'A high-school football game in a town of four thousand, fourth quarter, under the lights: the home stands, the marching band on the track, the cheerleaders, the huddle, the coach who teaches history, and the booster club selling hot dogs behind the end zone.',
  w: W, h: H, paint,
};
