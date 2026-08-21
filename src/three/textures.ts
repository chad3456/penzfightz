import * as THREE from 'three';

/**
 * Every surface in this classroom is painted at runtime onto a 2D canvas.
 *
 * That keeps the whole game a single JS bundle with no image downloads, and it
 * means the desk can be scratched with a different set of initials each time
 * you load the page — which is the most authentic thing about it.
 */

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, g: c.getContext('2d')! };
}

function finish(c: HTMLCanvasElement, repeat: [number, number] = [1, 1]) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

let seed = 20030815;
function rnd() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

/** Restart the noise sequence so a given desk always looks the same per load. */
export function reseed(n: number) {
  seed = n >>> 0 || 1;
}

// ---------------------------------------------------------------- wood

export function makeWoodTexture(base = '#8a5a2b', dark = '#5d3a17', scale = 1) {
  const { c, g } = canvas(1024, 512);
  g.fillStyle = base;
  g.fillRect(0, 0, 1024, 512);

  // long grain lines
  for (let i = 0; i < 260 * scale; i++) {
    const y = rnd() * 512;
    const alpha = 0.03 + rnd() * 0.12;
    g.strokeStyle = rnd() > 0.5 ? dark : '#a97a44';
    g.globalAlpha = alpha;
    g.lineWidth = 0.5 + rnd() * 2.4;
    g.beginPath();
    g.moveTo(0, y);
    const amp = 3 + rnd() * 12;
    const freq = 0.004 + rnd() * 0.01;
    for (let x = 0; x <= 1024; x += 16) {
      g.lineTo(x, y + Math.sin(x * freq + i) * amp);
    }
    g.stroke();
  }

  // knots
  g.globalAlpha = 1;
  for (let k = 0; k < 3; k++) {
    const cx = rnd() * 1024;
    const cy = rnd() * 512;
    for (let ring = 12; ring > 0; ring--) {
      g.strokeStyle = ring % 2 ? dark : '#7a4d22';
      g.globalAlpha = 0.16;
      g.lineWidth = 1.6;
      g.beginPath();
      g.ellipse(cx, cy, ring * 3.2, ring * 1.9, 0.4, 0, Math.PI * 2);
      g.stroke();
    }
  }
  g.globalAlpha = 1;
  return finish(c);
}

/**
 * The desk top: wood, plus a decade of ballpoint graffiti.
 */
export function makeDeskTopTexture() {
  const { c, g } = canvas(1024, 640);
  const grain = makeWoodTexture('#a9743c', '#7a4f22').image as HTMLCanvasElement;
  g.drawImage(grain, 0, 0, 1024, 640);

  // sun-bleached middle where a thousand elbows have rested
  const glow = g.createRadialGradient(512, 320, 40, 512, 320, 520);
  glow.addColorStop(0, 'rgba(255,226,180,0.22)');
  glow.addColorStop(1, 'rgba(120,70,20,0.12)');
  g.fillStyle = glow;
  g.fillRect(0, 0, 1024, 640);

  // scratched-in initials and the eternal "9B ROCKS"
  const scribbles = [
    { t: 'AJ', x: 120, y: 520, s: 54, r: -0.12 },
    { t: '9B ROCKS', x: 690, y: 560, s: 34, r: 0.04 },
    { t: 'Rahul', x: 190, y: 190, s: 26, r: -0.2 },
    { t: 'M+S', x: 830, y: 210, s: 30, r: 0.16 },
    { t: 'BORED', x: 460, y: 120, s: 22, r: -0.05 },
  ];
  for (const s of scribbles) {
    g.save();
    g.translate(s.x, s.y);
    g.rotate(s.r);
    g.font = `${s.s}px Georgia, serif`;
    g.strokeStyle = 'rgba(60,35,10,0.30)';
    g.lineWidth = 2;
    g.strokeText(s.t, 0, 0);
    g.fillStyle = 'rgba(255,235,200,0.10)';
    g.fillText(s.t, -1, -1);
    g.restore();
  }

  // idle compass-point scratches
  for (let i = 0; i < 70; i++) {
    g.strokeStyle = `rgba(255,240,215,${0.05 + rnd() * 0.09})`;
    g.lineWidth = 0.7 + rnd();
    g.beginPath();
    const x = rnd() * 1024;
    const y = rnd() * 640;
    g.moveTo(x, y);
    g.lineTo(x + (rnd() - 0.5) * 190, y + (rnd() - 0.5) * 80);
    g.stroke();
  }

  // ink blots
  for (let i = 0; i < 8; i++) {
    g.fillStyle = `rgba(30,45,110,${0.10 + rnd() * 0.16})`;
    g.beginPath();
    g.ellipse(rnd() * 1024, rnd() * 640, 2 + rnd() * 7, 2 + rnd() * 5, rnd() * 3, 0, Math.PI * 2);
    g.fill();
  }

  // a ring where somebody's tiffin flask stood
  g.strokeStyle = 'rgba(70,40,10,0.20)';
  g.lineWidth = 4;
  g.beginPath();
  g.arc(560, 470, 46, 0, Math.PI * 2);
  g.stroke();

  return finish(c);
}

// ---------------------------------------------------------------- floor

export function makeTileTexture() {
  const { c, g } = canvas(512, 512);
  g.fillStyle = '#cfc9b4';
  g.fillRect(0, 0, 512, 512);

  // four mosaic tiles per tile of texture, with grubby grout
  const cell = 256;
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      const x = tx * cell;
      const y = ty * cell;
      const shade = 0.94 + rnd() * 0.09;
      g.fillStyle = `rgb(${Math.floor(214 * shade)},${Math.floor(207 * shade)},${Math.floor(186 * shade)})`;
      g.fillRect(x + 5, y + 5, cell - 10, cell - 10);

      // terrazzo speckle
      for (let i = 0; i < 260; i++) {
        const a = 0.05 + rnd() * 0.18;
        g.fillStyle = rnd() > 0.5 ? `rgba(120,110,90,${a})` : `rgba(255,255,245,${a})`;
        g.fillRect(x + rnd() * cell, y + rnd() * cell, 1 + rnd() * 2.5, 1 + rnd() * 2.5);
      }
    }
  }

  // grout
  g.strokeStyle = 'rgba(96,88,72,0.75)';
  g.lineWidth = 6;
  g.strokeRect(0, 0, 512, 512);
  g.beginPath();
  g.moveTo(256, 0);
  g.lineTo(256, 512);
  g.moveTo(0, 256);
  g.lineTo(512, 256);
  g.stroke();

  return finish(c, [9, 9]);
}

// ---------------------------------------------------------------- walls

export function makeWallTexture() {
  const { c, g } = canvas(512, 512);
  g.fillStyle = '#8d9276';
  g.fillRect(0, 0, 512, 512);
  // distemper mottling and damp patches
  for (let i = 0; i < 900; i++) {
    const a = 0.02 + rnd() * 0.06;
    g.fillStyle = rnd() > 0.5 ? `rgba(255,255,240,${a})` : `rgba(60,66,44,${a})`;
    g.beginPath();
    g.ellipse(rnd() * 512, rnd() * 512, 3 + rnd() * 26, 3 + rnd() * 20, rnd() * 3, 0, Math.PI * 2);
    g.fill();
  }
  return finish(c, [3, 2]);
}

// ---------------------------------------------------------------- board

export interface BoardLines {
  subject: string;
  thought: string;
  homework: string[];
  scoreTitle: string;
  hostName: string;
  guestName: string;
  hostScore: number;
  guestScore: number;
  format: number;
  monitor: string;
}

/**
 * The blackboard is redrawn whenever the score changes — the running tally
 * genuinely lives in chalk at the front of the class.
 */
export function drawBlackboard(c: HTMLCanvasElement, lines: BoardLines) {
  const g = c.getContext('2d')!;
  const W = c.width;
  const H = c.height;

  g.fillStyle = '#1f3b2c';
  g.fillRect(0, 0, W, H);

  // ghosts of last week's lessons, half-wiped
  g.save();
  for (let i = 0; i < 60; i++) {
    g.strokeStyle = `rgba(220,235,225,${0.012 + Math.random() * 0.03})`;
    g.lineWidth = 8 + Math.random() * 26;
    g.beginPath();
    const y = Math.random() * H;
    g.moveTo(Math.random() * W * 0.4, y);
    g.lineTo(Math.random() * W, y + (Math.random() - 0.5) * 30);
    g.stroke();
  }
  g.restore();

  const chalk = (
    text: string,
    x: number,
    y: number,
    size: number,
    alpha = 0.86,
    font = 'Georgia, serif',
  ) => {
    g.font = `${size}px ${font}`;
    g.fillStyle = `rgba(238,244,236,${alpha})`;
    g.fillText(text, x, y);
    // chalk dust doubling
    g.fillStyle = `rgba(238,244,236,${alpha * 0.22})`;
    g.fillText(text, x + 1.5, y + 1.5);
  };

  chalk(`Sub : ${lines.subject}`, 44, 62, 34);
  chalk('Thought for the Day :', W * 0.32, 62, 34);
  chalk(`" ${lines.thought} "`, W * 0.28, 112, 32, 0.8);

  // vertical divider before the homework column
  g.strokeStyle = 'rgba(238,244,236,0.5)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(W * 0.76, 24);
  g.lineTo(W * 0.76, H - 24);
  g.stroke();

  chalk('H.W.', W * 0.78, 60, 34);
  lines.homework.forEach((h, i) => chalk(h, W * 0.78, 108 + i * 44, 28, 0.78));
  chalk(`Monitor : ${lines.monitor}`, W * 0.78, H - 46, 26, 0.62);

  // ---- the pen fight tally, bottom left, in a different hand ----
  const bx = 60;
  const by = H * 0.42;
  chalk('PEN FIGHT', bx, by, 40, 0.92);
  g.strokeStyle = 'rgba(238,244,236,0.7)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(bx, by + 12);
  g.lineTo(bx + 250, by + 12);
  g.stroke();

  chalk(`best of ${lines.format}`, bx, by + 42, 22, 0.55);
  chalk(lines.hostName, bx, by + 92, 32, 0.9);
  chalk(String(lines.hostScore), bx + 210, by + 92, 38, 0.95);
  chalk(lines.guestName, bx, by + 146, 32, 0.9);
  chalk(String(lines.guestScore), bx + 210, by + 146, 38, 0.95);

  // rally boxes: filled as the match runs
  const boxes = lines.format;
  const done = lines.hostScore + lines.guestScore;
  for (let i = 0; i < boxes; i++) {
    const x = bx + 290 + i * 40;
    const y = by + 96;
    g.strokeStyle = 'rgba(238,244,236,0.65)';
    g.lineWidth = 2.5;
    g.strokeRect(x, y, 28, 28);
    if (i < done) {
      chalk(i % 2 === 0 ? '✓' : '✗', x + 4, y + 24, 26, 0.9);
    }
  }

  // chalk smear along the bottom rail
  const smear = g.createLinearGradient(0, H - 70, 0, H);
  smear.addColorStop(0, 'rgba(255,255,255,0)');
  smear.addColorStop(1, 'rgba(230,240,230,0.10)');
  g.fillStyle = smear;
  g.fillRect(0, H - 70, W, 70);
}

export function makeBlackboardTexture(lines: BoardLines) {
  const { c } = canvas(2048, 1024);
  drawBlackboard(c, lines);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return { texture: t, canvas: c };
}

// ---------------------------------------------------------------- paper

export function makePosterTexture(kind: 'tables' | 'calendar' | 'map') {
  const { c, g } = canvas(512, 700);
  g.fillStyle = '#f2ead6';
  g.fillRect(0, 0, 512, 700);
  g.strokeStyle = '#8a2b2b';
  g.lineWidth = 8;
  g.strokeRect(10, 10, 492, 680);

  if (kind === 'tables') {
    g.fillStyle = '#8a2b2b';
    g.font = 'bold 46px Georgia, serif';
    g.textAlign = 'center';
    g.fillText('TABLES', 256, 76);
    g.textAlign = 'left';
    for (let col = 0; col < 2; col++) {
      for (let row = 0; row < 5; row++) {
        const x = 46 + col * 232;
        const y = 128 + row * 112;
        g.strokeStyle = '#333';
        g.lineWidth = 1.5;
        g.strokeRect(x, y, 200, 96);
        g.fillStyle = '#333';
        g.font = '18px Georgia, serif';
        g.fillText(`Table of ${col * 5 + row + 2}`, x + 12, y + 26);
        for (let i = 0; i < 4; i++) {
          g.fillStyle = '#5a5a5a';
          g.font = '13px Georgia, serif';
          g.fillText(
            `${col * 5 + row + 2} x ${i + 1} = ${(col * 5 + row + 2) * (i + 1)}`,
            x + 12,
            y + 48 + i * 15,
          );
        }
      }
    }
  } else if (kind === 'calendar') {
    g.fillStyle = '#8a2b2b';
    g.font = 'bold 40px Georgia, serif';
    g.textAlign = 'center';
    g.fillText('AUGUST', 256, 74);
    g.fillStyle = '#333';
    g.font = '28px Georgia, serif';
    g.fillText('2003', 256, 112);
    g.textAlign = 'left';
    for (let r = 0; r < 5; r++) {
      for (let d = 0; d < 7; d++) {
        const n = r * 7 + d + 1;
        if (n > 31) break;
        g.fillStyle = d === 0 ? '#a33' : '#333';
        g.font = '22px Georgia, serif';
        g.fillText(String(n), 44 + d * 62, 180 + r * 62);
      }
    }
  } else {
    g.fillStyle = '#8a2b2b';
    g.font = 'bold 36px Georgia, serif';
    g.textAlign = 'center';
    g.fillText('BHARAT', 256, 66);
    g.textAlign = 'left';
    // a very rough outline, the way it looked on every classroom wall
    g.strokeStyle = '#2f5d3a';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(250, 110);
    g.bezierCurveTo(360, 140, 400, 250, 340, 380);
    g.bezierCurveTo(300, 470, 270, 600, 250, 640);
    g.bezierCurveTo(230, 600, 190, 470, 160, 380);
    g.bezierCurveTo(110, 250, 150, 140, 250, 110);
    g.stroke();
    g.fillStyle = 'rgba(120,170,120,0.25)';
    g.fill();
  }
  return finish(c);
}

export function makeNotebookTexture() {
  const { c, g } = canvas(512, 640);
  g.fillStyle = '#f6f1e2';
  g.fillRect(0, 0, 512, 640);
  g.strokeStyle = 'rgba(90,120,170,0.45)';
  g.lineWidth = 1.5;
  for (let y = 40; y < 640; y += 26) {
    g.beginPath();
    g.moveTo(20, y);
    g.lineTo(492, y);
    g.stroke();
  }
  g.strokeStyle = 'rgba(190,70,70,0.55)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(64, 0);
  g.lineTo(64, 640);
  g.stroke();
  // faint handwriting
  for (let y = 66; y < 520; y += 26) {
    g.strokeStyle = `rgba(40,60,130,${0.18 + Math.random() * 0.12})`;
    g.lineWidth = 2;
    g.beginPath();
    let x = 80;
    g.moveTo(x, y - 4);
    while (x < 400 + Math.random() * 80) {
      x += 6 + Math.random() * 8;
      g.lineTo(x, y - 10 + Math.random() * 12);
    }
    g.stroke();
  }
  return finish(c);
}
