/**
 * The people, as cut-paper silhouettes in the dress of the 1840s, the way
 * portraits were cut in Dostoevsky's day. A small skeleton is posed, then
 * fleshed out with coats, a bell skirt, a mantle and hats. The one colour
 * is Nastenka's hat: “a very charming yellow hat and a jaunty little black
 * mantle.”
 *
 * Local coordinates: feet at (0, 0), up is negative y, facing +x.
 */

import type { PoseName, Who } from './story';

export const INK = '#1f1b27';
export const HAT = '#e8b53a';
export const FIG_SCALE = 1.35;

type V = [number, number];

type Skel = {
  hip: V; neck: V; head: V; headR: number;
  kneeF: V; footF: V; kneeB: V; footB: V;
  elbowF: V; handF: V; elbowB: V; handB: V;
  lean: number; sit: boolean; front: boolean;
};

const rot = (a: number, len: number, from: V): V => [from[0] + Math.sin(a) * len, from[1] + Math.cos(a) * len];

/** Build a profile skeleton for a pose at walk phase w and time t. */
function skeleton(pose: PoseName, w: number, t: number, tall: number): Skel {
  const L = 18 * tall; // thigh and shin
  const T = 26 * tall; // hip to neck
  let lean = 0, thF = 0, thB = 0, shF = 0, shB = 0;
  let arF = 0.08, foF = 0.15, arB = -0.06, foB = 0.1;
  let hipDrop = 0, sit = false;
  const breathe = Math.sin(t * 1.3) * 0.015;
  switch (pose) {
    case 'walk': case 'lookBack': {
      const s = Math.sin(w), c = Math.cos(w);
      thF = 0.38 * s; thB = -0.38 * s;
      shF = thF - 0.65 * Math.max(0, -c) * (s < 0 ? 1 : 0.4);
      shB = thB - 0.65 * Math.max(0, c) * (s > 0 ? 1 : 0.4);
      arF = -0.32 * s; arB = 0.32 * s; foF = arF + 0.25; foB = arB + 0.25;
      lean = 0.05; hipDrop = -Math.abs(c) * 1.2;
      break;
    }
    case 'run': {
      const s = Math.sin(w), c = Math.cos(w);
      thF = 0.7 * s; thB = -0.7 * s;
      shF = thF - 1.1 * Math.max(0, -c); shB = thB - 1.1 * Math.max(0, c);
      arF = -0.7 * s; arB = 0.7 * s; foF = arF + 1.2; foB = arB + 1.2;
      lean = 0.22; hipDrop = -Math.abs(c) * 2.5;
      break;
    }
    case 'stagger': {
      const s = Math.sin(t * 2.2);
      lean = 0.18 * s - 0.05;
      thF = 0.25 + 0.15 * s; thB = -0.3; shF = thF; shB = thB - 0.2;
      arF = 0.9 + 0.4 * Math.sin(t * 3.1); foF = arF + 0.6; arB = -0.7; foB = -0.2;
      break;
    }
    case 'raiseStick': {
      lean = 0.12; thF = 0.4; shF = 0.1; thB = -0.35; shB = -0.6;
      arF = 2.6; foF = 2.9; arB = -0.4; foB = 0.1;
      break;
    }
    case 'hold': {
      lean = 0.04 + breathe; arF = 1.15; foF = 1.45; arB = 0.05; foB = 0.15; thF = 0.04; thB = -0.04;
      break;
    }
    case 'embrace': {
      lean = 0.14; arF = 1.45; foF = 2.05; arB = 1.2; foB = 1.85; thF = 0.08; thB = -0.06;
      break;
    }
    case 'pointUp': {
      lean = -0.06; arF = 2.55 + Math.sin(t * 0.8) * 0.05; foF = 2.75; arB = 0.1; foB = 0.2; thF = 0.06; thB = -0.06;
      break;
    }
    case 'weep': {
      lean = 0.2 + breathe * 2; arF = 0.9; foF = 2.9; arB = 0.7; foB = 2.7; thF = 0.02; thB = -0.03;
      break;
    }
    case 'bow': {
      lean = 0.5; arF = 0.3; foF = 0.4; arB = -0.1; foB = 0;
      break;
    }
    case 'sit': case 'sitClose': {
      sit = true;
      lean = pose === 'sitClose' ? 0.14 + breathe : 0.04 + breathe;
      thF = 1.5; thB = 1.42; shF = 0.1; shB = 0.05;
      arF = 0.55; foF = 1.4; arB = 0.25; foB = 1.2;
      break;
    }
    default: {
      lean = breathe; arF = 0.06; foF = 0.12; arB = -0.05; foB = 0.08; thF = 0.04; thB = -0.04;
    }
  }
  const hipY = sit ? -22 * tall : -(L * 2) + hipDrop;
  const hip: V = [0, hipY];
  const kneeF = rot(thF, L, hip), kneeB = rot(thB, L, hip);
  const footF = rot(shF, L, kneeF), footB = rot(shB, L, kneeB);
  if (sit) { footF[1] = Math.min(0, footF[1]); footB[1] = Math.min(0, footB[1]); }
  const neck: V = [hip[0] + Math.sin(lean) * T, hip[1] - Math.cos(lean) * T];
  const headTilt = pose === 'weep' ? 0.6 : pose === 'pointUp' ? -0.5 : pose === 'sitClose' ? 0.25 : lean * 0.6;
  const headR = 5.4 * tall;
  const head: V = [neck[0] + Math.sin(headTilt) * headR * 1.25, neck[1] - Math.cos(headTilt) * headR * 1.25];
  const sh: V = [neck[0] - Math.sin(lean) * 3, neck[1] + 3];
  const elbowF = rot(arF, 13 * tall, sh), handF = rot(foF, 12 * tall, elbowF);
  const elbowB = rot(arB, 13 * tall, sh), handB = rot(foB, 12 * tall, elbowB);
  return { hip, neck, head, headR, kneeF, footF, kneeB, footB, elbowF, handF, elbowB, handB, lean, sit, front: false };
}

function line(g: CanvasRenderingContext2D, pts: V[], w: number) {
  g.lineWidth = w;
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.stroke();
}

function head(g: CanvasRenderingContext2D, s: Skel, nose = true) {
  const [hx, hy] = s.head, r = s.headR;
  g.beginPath();
  g.ellipse(hx, hy, r * 0.92, r, 0, 0, Math.PI * 2);
  g.fill();
  if (nose) {
    // brow, nose and chin, cut the way a silhouettist would
    const a = Math.atan2(s.head[0] - s.neck[0], -(s.head[1] - s.neck[1]));
    g.save(); g.translate(hx, hy); g.rotate(a);
    g.beginPath();
    g.moveTo(r * 0.75, -r * 0.35);
    g.lineTo(r * 1.22, r * 0.1);
    g.lineTo(r * 0.85, r * 0.25);
    g.quadraticCurveTo(r * 0.95, r * 0.6, r * 0.7, r * 0.85);
    g.lineTo(0, r * 0.6);
    g.closePath();
    g.fill();
    g.restore();
  }
  // neck
  line(g, [s.neck, [s.head[0] - 1, s.head[1] + r * 0.6]], r * 0.75);
}

/** A man in a frock coat (or tails), trousers and, for most, a top hat. */
function man(g: CanvasRenderingContext2D, s: Skel, who: Who, t: number) {
  g.lineCap = 'round'; g.lineJoin = 'round';
  const trouser = 5.8;
  line(g, [s.hip, s.kneeB, s.footB], trouser);
  line(g, [s.footB, [s.footB[0] + 6.5, s.footB[1]]], 3.2);
  // back arm behind the body
  line(g, [[s.neck[0], s.neck[1] + 4], s.elbowB, s.handB], 4.6);
  line(g, [s.hip, s.kneeF, s.footF], trouser);
  line(g, [s.footF, [s.footF[0] + 7, s.footF[1]]], 3.4);
  // the coat: shoulders to a flared hem around the knees
  const [nx, ny] = s.neck;
  const tails = who === 'gent';
  const hemY = s.sit ? s.hip[1] + 4 : Math.max(s.kneeF[1], s.kneeB[1]) - 2;
  const swing = (s.kneeF[0] - s.kneeB[0]) * 0.35;
  g.beginPath();
  g.moveTo(nx - 6, ny + 3);
  g.quadraticCurveTo(nx - 8.5, (ny + s.hip[1]) / 2, s.hip[0] - 7, s.hip[1] + 1);
  if (tails) {
    g.lineTo(s.hip[0] - 9 - swing, hemY + 3);
    g.lineTo(s.hip[0] - 3, hemY);
    g.lineTo(s.hip[0] + 1, s.hip[1] + 2);
    g.lineTo(s.hip[0] + 6, s.hip[1] - 2);
  } else if (s.sit) {
    g.lineTo(s.kneeF[0] + 1, s.kneeF[1] - 1);
    g.lineTo(s.kneeF[0] + 1, s.kneeF[1] + 5);
    g.lineTo(s.hip[0] - 6, s.hip[1] + 6);
  } else {
    g.lineTo(s.hip[0] - 9 - swing * 0.6, hemY);
    g.quadraticCurveTo(s.hip[0], hemY + 2.5, s.hip[0] + 8 + swing * 0.5, hemY - 1);
    g.lineTo(s.hip[0] + 6, s.hip[1] - 1);
  }
  g.quadraticCurveTo(nx + 7.5, (ny + s.hip[1]) / 2, nx + 6, ny + 3);
  g.closePath();
  g.fill();
  head(g, s);
  // front arm over the coat
  const sh: V = [s.neck[0] + 1, s.neck[1] + 4];
  line(g, [sh, s.elbowF, s.handF], 5);
  g.beginPath(); g.arc(s.handF[0], s.handF[1], 2.1, 0, Math.PI * 2); g.fill();
  const [hx, hy] = s.head, r = s.headR;
  if (who === 'dreamer') {
    // no hat: an untidy crop, and a scarf whose ends lift in the air off the canal
    g.beginPath();
    g.ellipse(hx - 1.2, hy - r * 0.45, r * 1.02, r * 0.68, -0.2, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(hx - r * 0.2, hy - r * 0.95); g.lineTo(hx + r * 0.9, hy - r * 0.75); g.lineTo(hx + r * 0.3, hy - r * 0.55); g.fill();
    const flick = Math.sin(t * 2.4) * 2;
    g.beginPath();
    g.moveTo(s.neck[0] - 3, s.neck[1] + 2);
    g.quadraticCurveTo(s.neck[0] - 12, s.neck[1] + 6 + flick, s.neck[0] - 18, s.neck[1] + 12 + flick * 1.5);
    g.lineTo(s.neck[0] - 15, s.neck[1] + 13 + flick * 1.5);
    g.quadraticCurveTo(s.neck[0] - 9, s.neck[1] + 7, s.neck[0] - 1, s.neck[1] + 4);
    g.fill();
  } else if (who === 'passer') {
    // a peaked cap
    g.beginPath();
    g.ellipse(hx, hy - r * 0.6, r * 1.05, r * 0.55, 0, Math.PI, 0);
    g.fill();
    g.fillRect(hx, hy - r * 0.68, r * 1.5, r * 0.25);
  } else {
    // a top hat; the gentleman's sits at an angle
    g.save();
    g.translate(hx, hy - r * 0.7);
    g.rotate(who === 'gent' ? -0.22 : -0.04);
    g.fillRect(-r * 1.45, -r * 0.08, r * 2.9, r * 0.3);
    g.beginPath();
    g.moveTo(-r * 0.85, 0); g.lineTo(-r * 0.95, -r * 2.05); g.lineTo(r * 0.95, -r * 2.05); g.lineTo(r * 0.85, 0);
    g.fill();
    g.restore();
  }
  if (who === 'dreamer' && (s.handF[1] > s.neck[1] + 20 || s.elbowF[1] < s.neck[1])) {
    // the excellent knotted stick
    g.save();
    g.lineWidth = 1.8;
    const raised = s.handF[1] < s.neck[1];
    const end: V = raised ? [s.handF[0] - 22, s.handF[1] - 18] : [s.handF[0] + 6, s.footF[1]];
    g.beginPath(); g.moveTo(s.handF[0], s.handF[1]); g.lineTo(end[0], end[1]); g.stroke();
    g.beginPath(); g.arc(s.handF[0] + (end[0] - s.handF[0]) * 0.5, s.handF[1] + (end[1] - s.handF[1]) * 0.5, 1.6, 0, Math.PI * 2); g.fill();
    g.restore();
  }
}

/** Nastenka: bell skirt, bodice, the little black mantle and the yellow hat. */
function woman(g: CanvasRenderingContext2D, s: Skel, t: number, walking: boolean, running: boolean) {
  g.lineCap = 'round'; g.lineJoin = 'round';
  const waist: V = [s.hip[0] + Math.sin(s.lean) * 6, s.hip[1] - 6];
  // arms behind
  line(g, [[s.neck[0], s.neck[1] + 4], s.elbowB, s.handB], 3.8);
  if (s.sit) {
    // skirt falls over the knees to the ground
    g.beginPath();
    g.moveTo(waist[0] - 5, waist[1]);
    g.quadraticCurveTo(waist[0] - 9, waist[1] + 14, waist[0] - 10, 0);
    g.lineTo(s.kneeF[0] + 8, 0);
    g.quadraticCurveTo(s.kneeF[0] + 7, s.kneeF[1] + 8, s.kneeF[0] + 3, s.kneeF[1] - 3);
    g.lineTo(waist[0] + 5, waist[1]);
    g.closePath();
    g.fill();
  } else {
    const sway = walking || running ? Math.sin(t * (running ? 9 : 5.5)) * (running ? 3.5 : 1.8) : Math.sin(t * 0.9) * 0.5;
    const flare = running ? 5 : 0;
    g.beginPath();
    g.moveTo(waist[0] - 4.5, waist[1]);
    g.bezierCurveTo(waist[0] - 9, waist[1] + 10, s.hip[0] - 15 - flare + sway, -10, s.hip[0] - 15 - flare + sway, -1.5);
    g.quadraticCurveTo(s.hip[0] + sway * 0.5, 1.5, s.hip[0] + 15 + flare * 0.5 + sway, -2);
    g.bezierCurveTo(s.hip[0] + 15 + sway, -12, waist[0] + 8, waist[1] + 10, waist[0] + 4.5, waist[1]);
    g.closePath();
    g.fill();
    if (walking || running) {
      line(g, [[s.footF[0] - 2, -1], [s.footF[0] + 4, -1]], 2.4);
    }
  }
  // bodice
  g.beginPath();
  g.moveTo(waist[0] - 4.5, waist[1] + 1);
  g.lineTo(s.neck[0] - 4.5, s.neck[1] + 3);
  g.lineTo(s.neck[0] + 4.5, s.neck[1] + 3);
  g.lineTo(waist[0] + 4.5, waist[1] + 1);
  g.closePath(); g.fill();
  // the little black mantle, a short cape that lifts as she moves
  const lift = running ? 6 : walking ? 2.5 : 0.6;
  g.beginPath();
  g.moveTo(s.neck[0] - 4, s.neck[1] + 1);
  g.quadraticCurveTo(s.neck[0] - 12 - lift, s.neck[1] + 10, s.neck[0] - 11 - lift * 1.5, s.neck[1] + 18 + Math.sin(t * 3) * lift * 0.4);
  g.lineTo(s.neck[0] + 9, s.neck[1] + 17);
  g.quadraticCurveTo(s.neck[0] + 9, s.neck[1] + 7, s.neck[0] + 4, s.neck[1] + 1);
  g.fill();
  head(g, s);
  // dark hair gathered at the back
  const [hx, hy] = s.head, r = s.headR;
  g.beginPath(); g.arc(hx - r * 0.95, hy + r * 0.15, r * 0.48, 0, Math.PI * 2); g.fill();
  line(g, [[s.neck[0] + 1, s.neck[1] + 4], s.elbowF, s.handF], 3.6);
  g.beginPath(); g.arc(s.handF[0], s.handF[1], 1.7, 0, Math.PI * 2); g.fill();
  // the yellow hat: a small round crown, a brim, a ribbon trailing
  g.save();
  g.translate(hx - r * 0.1, hy - r * 0.62);
  g.rotate(-0.12 + Math.atan2(s.head[0] - s.neck[0], -(s.head[1] - s.neck[1])) * 0.6);
  g.fillStyle = HAT;
  g.beginPath(); g.ellipse(0, 0, r * 1.55, r * 0.32, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(0, -r * 0.3, r * 0.9, r * 0.62, 0, Math.PI, 0); g.fill();
  g.fillStyle = 'rgba(255,240,190,0.55)';
  g.beginPath(); g.ellipse(r * 0.2, -r * 0.55, r * 0.45, r * 0.18, -0.2, 0, Math.PI * 2); g.fill();
  g.strokeStyle = HAT; g.lineWidth = 1.2;
  const rib = Math.sin(t * 2.2) * 2 - (walking || running ? 3 : 0);
  g.beginPath(); g.moveTo(-r * 0.9, -r * 0.1); g.quadraticCurveTo(-r * 2, r * 0.6 + rib * 0.3, -r * 2.6, r * 1.3 + rib); g.stroke();
  g.restore();
}

/** Facing the viewer with her elbows on the canal railing, looking down at the water. */
function nastenkaAtRail(g: CanvasRenderingContext2D, t: number, tall: number) {
  const r = 5 * tall;
  const breathe = Math.sin(t * 1.2) * 0.4;
  g.lineCap = 'round'; g.lineJoin = 'round';
  // skirt (mostly hidden by the railing)
  g.beginPath();
  g.moveTo(-5, -32); g.bezierCurveTo(-11, -22, -15, -8, -15, -1); g.quadraticCurveTo(0, 2, 15, -1); g.bezierCurveTo(15, -8, 11, -22, 5, -32);
  g.closePath(); g.fill();
  // shoulders hunched forward, the mantle over them
  g.beginPath();
  g.moveTo(-5, -32);
  g.quadraticCurveTo(-12, -40 + breathe, -10, -47 + breathe);
  g.quadraticCurveTo(0, -51 + breathe, 10, -47 + breathe);
  g.quadraticCurveTo(12, -40 + breathe, 5, -32);
  g.fill();
  // elbows out on the rail, hands together under the chin
  line(g, [[-9, -46 + breathe], [-15, -40], [-3, -44]], 3.6);
  line(g, [[9, -46 + breathe], [15, -40], [3, -44]], 3.6);
  // bowed head
  g.beginPath(); g.ellipse(0, -51 + breathe, r * 0.85, r * 0.95, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = HAT;
  g.beginPath(); g.ellipse(0, -55 + breathe, r * 1.75, r * 0.42, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(0, -56.5 + breathe, r * 0.95, r * 0.6, 0, Math.PI, 0); g.fill();
  g.fillStyle = 'rgba(255,240,190,0.5)';
  g.beginPath(); g.ellipse(-r * 0.3, -57.5 + breathe, r * 0.5, r * 0.16, 0, 0, Math.PI * 2); g.fill();
}

export function drawFigure(g: CanvasRenderingContext2D, who: Who, pose: PoseName, x: number, y: number, face: 1 | -1, w: number, t: number, alpha = 1) {
  if (alpha <= 0.01) return;
  const tall = who === 'nastenka' ? 0.9 : who === 'lodger' ? 1.06 : who === 'gent' ? 1.02 : 1;
  g.save();
  g.globalAlpha *= alpha;
  g.translate(x, y);
  // drawn a little larger than life against the houses, as an illustrator would
  g.scale(FIG_SCALE, FIG_SCALE);
  g.fillStyle = INK; g.strokeStyle = INK;
  if (who === 'nastenka' && pose === 'lean') {
    nastenkaAtRail(g, t, tall);
    g.restore();
    return;
  }
  g.scale(face, 1);
  const s = skeleton(pose, w, t, tall);
  if (who === 'nastenka') woman(g, s, t, pose === 'walk', pose === 'run');
  else man(g, s, who, t);
  g.restore();
}
