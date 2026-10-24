// Backdrops and illustrated "clip" scenes for the collage reel, all drawn here.
// Scenes are SVG strings on a 1000 x 1300 canvas (portrait), sliced to fit
// whatever window they sit in. Backdrops fill the whole 1080 x 1920 frame.
(function () {
  const P = {
    pink: '#f4a9c6', pink2: '#f7c9da', hot: '#e8458f', cream: '#fbf6dd', mint: '#d6e3a3', green: '#b9cf78',
    lilac: '#bdb5e8', blue: '#7385cf', sky1: '#6f97d3', sky2: '#d7e6f5', brown: '#8a6a4c', lime: '#e3ff3b',
  };
  let uid = 0;
  const id = (p) => `${p}${++uid}`;

  // ---------- shared bits ----------
  // rounded 5-point star, centred on 0,0 with outer radius 1
  function starPath(r = 1, inner = 0.48) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? inner * r : r;
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    return 'M' + pts.map((p) => p.map((v) => v.toFixed(3)).join(' ')).join('L') + 'Z';
  }
  function rand(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  function cloud(cx, cy, s, c1 = '#fbd3e3', c2 = '#e99abb', gid) {
    const r = rand(Math.round(cx * 7 + cy * 13));
    let puffs = '';
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI, rx = (60 + r() * 50) * s;
      puffs += `<circle cx="${cx + Math.cos(a + Math.PI) * 120 * s}" cy="${cy - Math.sin(a) * 45 * s + r() * 20 * s}" r="${rx}"/>`;
    }
    puffs += `<ellipse cx="${cx}" cy="${cy + 20 * s}" rx="${190 * s}" ry="${55 * s}"/>`;
    return `<g fill="url(#${gid})">${puffs}</g>`;
  }
  function cloudDefs(gid, c1 = '#fde3ee', c2 = '#ec9fc1') {
    return `<radialGradient id="${gid}" cx="45%" cy="30%" r="80%"><stop offset="0" stop-color="${c1}"/><stop offset="0.6" stop-color="#f6bcd4"/><stop offset="1" stop-color="${c2}"/></radialGradient>`;
  }

  // ---------- backdrops (1080 x 1920) ----------
  function starsLayer(seed, color = '#ec8db4', opacity = 0.85, big = 1) {
    const r = rand(seed);
    let s = '';
    const cols = 3, rows = 5;
    for (let j = -1; j <= rows; j++) for (let i = -1; i <= cols; i++) {
      const x = (i + 0.5 + (j % 2) * 0.5) * (1080 / cols) + (r() - 0.5) * 120;
      const y = (j + 0.5) * (1920 / rows) + (r() - 0.5) * 120;
      const sz = (130 + r() * 90) * big, rot = r() * 72;
      s += `<path d="${starPath(1, 0.44)}" transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${rot.toFixed(0)}) scale(${sz.toFixed(0)})" stroke="${color}" stroke-width="0.12" stroke-linejoin="round"/>`;
    }
    return `<svg class="bg-stars" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice"><g fill="${color}" opacity="${opacity}">${s}</g></svg>`;
  }

  function pattern(kind, tone) {
    const t = {
      pink: [P.pink2, P.cream, '#f08fb6'], green: [P.mint, P.cream, '#9fb860'], lilac: [P.lilac, '#ece9fb', '#8f86cf'],
      blue: ['#8e9ce0', '#aab5ea', '#5a69bd'], hot: ['#f278ad', '#f9b6d1', P.hot], cream: [P.cream, '#fffbe9', '#e8d9a0'],
    }[tone || 'pink'] || [P.pink2, P.cream, '#f08fb6'];
    if (kind === 'stripes') return `background: repeating-linear-gradient(90deg, ${t[0]} 0 38px, ${t[1]} 38px 76px);`;
    if (kind === 'grid') return `background-color: ${t[1]}; background-image: linear-gradient(${t[2]} 3px, transparent 3px), linear-gradient(90deg, ${t[2]} 3px, transparent 3px); background-size: 66px 66px;`;
    if (kind === 'gingham') return `background-color: ${t[1]}; background-image: linear-gradient(90deg, ${t[0]}cc 50%, transparent 50%), linear-gradient(${t[0]}cc 50%, transparent 50%); background-size: 120px 120px;`;
    if (kind === 'check') return `background-color: ${t[1]}; background-image: conic-gradient(${t[0]} 25%, transparent 0 50%, ${t[0]} 0 75%, transparent 0); background-size: 140px 140px;`;
    if (kind === 'plaid') return `background-color: ${t[1]}; background-image: repeating-linear-gradient(90deg, ${t[2]}55 0 10px, transparent 10px 60px, ${t[0]}aa 60px 90px, transparent 90px 150px), repeating-linear-gradient(0deg, ${t[2]}55 0 10px, transparent 10px 60px, ${t[0]}aa 60px 90px, transparent 90px 150px);`;
    return `background: ${tone || P.cream};`;
  }

  function skyScene(w = 1080, h = 1920, seed = 3) {
    const g = id('cl'), sk = id('sk'), hl = id('hl'), hl2 = id('hl');
    const r = rand(seed);
    let flowers = '';
    for (let i = 0; i < 70; i++) {
      const x = r() * w, y = h * (0.8 + r() * 0.2), c = ['#f7a1c4', '#ffffff', '#f4d35e', '#e86fa5'][i % 4];
      flowers += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(6 + r() * 9).toFixed(1)}" fill="${c}"/>`;
    }
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice"><defs>
      <linearGradient id="${sk}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky1}"/><stop offset="0.75" stop-color="${P.sky2}"/></linearGradient>
      ${cloudDefs(g)}
      <linearGradient id="${hl}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fcb4f"/><stop offset="1" stop-color="#2f8a3a"/></linearGradient>
      <linearGradient id="${hl2}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9edb63"/><stop offset="1" stop-color="#3f9c3f"/></linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#${sk})"/>
    ${cloud(w * 0.18, h * 0.32, 1.25, 0, 0, g)}${cloud(w * 0.86, h * 0.24, 1.0, 0, 0, g)}${cloud(w * 0.55, h * 0.5, 1.4, 0, 0, g)}${cloud(w * 0.08, h * 0.6, 0.9, 0, 0, g)}${cloud(w * 0.95, h * 0.62, 1.1, 0, 0, g)}
    <path d="M0 ${h * 0.78} C ${w * 0.25} ${h * 0.68}, ${w * 0.45} ${h * 0.74}, ${w * 0.6} ${h * 0.78} S ${w * 0.9} ${h * 0.7}, ${w} ${h * 0.74} V ${h} H 0Z" fill="url(#${hl2})"/>
    <path d="M0 ${h * 0.86} C ${w * 0.3} ${h * 0.78}, ${w * 0.55} ${h * 0.86}, ${w} ${h * 0.82} V ${h} H 0Z" fill="url(#${hl})"/>
    ${flowers}</svg>`;
  }

  function tvScene() {
    // hypnotic heart tunnel inside a rounded CRT bezel, with stage lights
    const hp = 'M0 0.35 C -0.05 0.2,-0.5 0.05,-0.5 -0.2 C -0.5 -0.45,-0.15 -0.5,0 -0.3 C 0.15 -0.5,0.5 -0.45,0.5 -0.2 C 0.5 0.05,0.05 0.2,0 0.35Z';
    let rings = '';
    for (let i = 26; i >= 1; i--) rings += `<path class="ring" d="${hp}" transform="translate(540 820) scale(${i * 170})" fill="${i % 2 ? '#ef5fa3' : '#fbd0e2'}"/>`;
    let lights = '';
    for (let i = 0; i < 4; i++) {
      const x = 380 + i * 150;
      lights += `<g transform="translate(${x} 250) rotate(${-20 + i * 14})"><rect x="-38" y="-30" width="76" height="70" rx="10" fill="#4a4040"/><circle cx="0" cy="44" r="30" fill="#fff6c8"/><circle cx="0" cy="44" r="54" fill="#fff3b0" opacity="0.35"/></g>`;
    }
    return `<svg viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice"><rect width="1080" height="1920" fill="#141012"/>
      <defs><clipPath id="tvc"><rect x="40" y="70" width="1000" height="1780" rx="150"/></clipPath>
      <radialGradient id="tvv" cx="50%" cy="50%" r="70%"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.65"/></radialGradient></defs>
      <g clip-path="url(#tvc)"><g class="tunnel">${rings}</g>
      <rect x="0" y="0" width="1080" height="200" fill="#000" opacity="0.15"/>
      <line x1="300" y1="190" x2="900" y2="230" stroke="#2c2626" stroke-width="12"/>${lights}
      <path d="M40 1520 C 300 1440, 700 1480, 1040 1450 V 1850 H 40Z" fill="#7cc04d"/>
      <rect x="40" y="70" width="1000" height="1780" fill="url(#tvv)"/></g>
      <rect x="40" y="70" width="1000" height="1780" rx="150" fill="none" stroke="#2b2626" stroke-width="22"/>
    </svg>`;
  }

  // ---------- illustrated clip scenes (1000 x 1300) ----------
  const S = {};
  S.sky = () => skyScene(1000, 1300, 9);
  S.solid = (o = {}) => `<svg viewBox="0 0 1000 1300" preserveAspectRatio="none"><rect width="1000" height="1300" fill="${o.color || P.brown}"/></svg>`;
  S.paper = (o = {}) => `<svg viewBox="0 0 1000 1300" preserveAspectRatio="xMidYMid slice"><rect width="1000" height="1300" fill="${o.color || '#fffaf0'}"/>${Array.from({ length: 26 }, (_, i) => `<line x1="0" x2="1000" y1="${120 + i * 48}" y2="${120 + i * 48}" stroke="#bcd3ef" stroke-width="3"/>`).join('')}<line x1="120" x2="120" y1="0" y2="1300" stroke="#f0a0b8" stroke-width="4"/></svg>`;
  S.room = (o = {}) => {
    const w = o.wall || '#efe2d3';
    return `<svg viewBox="0 0 1000 1300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="rmw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${w}"/><stop offset="1" stop-color="#d8c3ad"/></linearGradient>
      <linearGradient id="rmwin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc3ec"/><stop offset="1" stop-color="#e8f1fb"/></linearGradient>
      <radialGradient id="rml" cx="75%" cy="20%" r="70%"><stop offset="0" stop-color="#fff6dc" stop-opacity="0.85"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></radialGradient></defs>
      <rect width="1000" height="1300" fill="url(#rmw)"/>
      <rect x="560" y="120" width="340" height="460" rx="14" fill="url(#rmwin)" stroke="#fff" stroke-width="22"/><line x1="730" y1="120" x2="730" y2="580" stroke="#fff" stroke-width="14"/>
      <rect x="80" y="260" width="300" height="20" rx="6" fill="#b8916e"/>
      <rect x="100" y="190" width="40" height="70" rx="6" fill="#e86fa5"/><rect x="146" y="200" width="36" height="60" rx="6" fill="#7385cf"/><rect x="188" y="180" width="44" height="80" rx="6" fill="#f4d35e"/>
      <circle cx="320" cy="225" r="34" fill="#9bc96a"/><rect x="300" y="225" width="40" height="35" rx="6" fill="#f2f2f2"/>
      <path d="M140 1300 V 900 q 0 -40 40 -40 h 160 q 40 0 40 40 V 1300Z" fill="#c9a17c"/>
      <g transform="translate(860 980)"><path d="M0 0 C -60 -120, -10 -200, 0 -260 C 10 -200, 60 -120, 0 0Z" fill="#5f9c4a"/><path d="M0 0 C -120 -80, -140 -160, -150 -200 C -80 -170, -30 -90, 0 0Z" fill="#76b55a"/><path d="M0 0 C 120 -80, 140 -160, 150 -200 C 80 -170, 30 -90, 0 0Z" fill="#76b55a"/><rect x="-60" y="0" width="120" height="120" rx="16" fill="#e9a37f"/></g>
      <rect width="1000" height="1300" fill="url(#rml)"/></svg>`;
  };
  S.campus = () => {
    let win = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) win += `<path d="M${130 + c * 130} ${520 + r * 150} v -60 a 30 30 0 0 1 60 0 v 60Z" fill="#30425f" stroke="#efe3c8" stroke-width="8"/>`;
    let ivy = '';
    const rr = rand(41);
    for (let i = 0; i < 160; i++) ivy += `<circle cx="${(rr() * 1000).toFixed(0)}" cy="${(420 + rr() * 520 * (rr() * 0.6 + 0.4)).toFixed(0)}" r="${(10 + rr() * 16).toFixed(0)}" fill="${['#3f7d3a', '#5c9b45', '#2f6a33'][i % 3]}" opacity="0.9"/>`;
    return `<svg viewBox="0 0 1000 1300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="cps" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fb4e3"/><stop offset="1" stop-color="#e9f0f8"/></linearGradient>
      <linearGradient id="cpb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8664a"/><stop offset="1" stop-color="#8e4a36"/></linearGradient></defs>
      <rect width="1000" height="1300" fill="url(#cps)"/>
      <path d="M180 360 l 40 -150 l 40 150Z M740 360 l 40 -150 l 40 150Z" fill="#9a523c"/>
      <rect x="60" y="360" width="880" height="620" fill="url(#cpb)"/><path d="M40 360 h 920 l -40 -50 h -840Z" fill="#c9b18a"/>
      ${win}${ivy}<path d="M420 980 v -170 a 80 80 0 0 1 160 0 v 170Z" fill="#3a2a22" stroke="#efe3c8" stroke-width="10"/>
      <rect x="0" y="980" width="1000" height="320" fill="#6fae4c"/><path d="M430 1300 L 470 980 h 60 L 570 1300Z" fill="#d9c9a3"/>
      <circle cx="120" cy="980" r="110" fill="#4f8f3d"/><circle cx="900" cy="990" r="120" fill="#4f8f3d"/></svg>`;
  };
  S.city = (o = {}) => {
    const rr = rand(o.seed || 7);
    let b = '';
    for (let i = 0; i < 12; i++) {
      const x = i * 90 - 20, w = 80 + rr() * 60, h = 400 + rr() * 600, c = ['#f3b5a8', '#c9b6e6', '#f7d6a8', '#b4c7ec', '#f2a2c0'][i % 5];
      b += `<rect x="${x.toFixed(0)}" y="${(1300 - h - 200).toFixed(0)}" width="${w.toFixed(0)}" height="${(h + 200).toFixed(0)}" fill="${c}"/>`;
      for (let k = 0; k < h / 70; k++) b += `<rect x="${(x + 14).toFixed(0)}" y="${(1300 - h - 160 + k * 70).toFixed(0)}" width="${(w - 28).toFixed(0)}" height="26" fill="#fff8e6" opacity="0.7"/>`;
    }
    return `<svg viewBox="0 0 1000 1300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="cts" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6a6b8"/><stop offset="0.6" stop-color="#fbd7b0"/></linearGradient></defs><rect width="1000" height="1300" fill="url(#cts)"/><circle cx="760" cy="300" r="120" fill="#fff1c9"/>${b}</svg>`;
  };
  S.suburb = () => `<svg viewBox="0 0 1000 1300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="sbs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc3ec"/><stop offset="1" stop-color="#eef5fc"/></linearGradient></defs>
    <rect width="1000" height="1300" fill="url(#sbs)"/><rect y="880" width="1000" height="420" fill="#7cbf57"/>
    <path d="M200 520 L 500 300 L 800 520Z" fill="#c25b5b"/><rect x="240" y="520" width="520" height="380" fill="#fff4e4"/>
    <rect x="300" y="590" width="120" height="110" fill="#9cc3ec" stroke="#fff" stroke-width="12"/><rect x="580" y="590" width="120" height="110" fill="#9cc3ec" stroke="#fff" stroke-width="12"/>
    <rect x="450" y="720" width="100" height="180" rx="8" fill="#7385cf"/><circle cx="535" cy="815" r="7" fill="#f4d35e"/>
    ${Array.from({ length: 21 }, (_, i) => `<path d="M${i * 50} 1000 v -110 l 18 -22 l 18 22 v 110Z" fill="#fff"/>`).join('')}<rect y="930" width="1000" height="16" fill="#fff"/>
    <circle cx="130" cy="700" r="120" fill="#5e9e45"/><rect x="118" y="760" width="24" height="140" fill="#7a5638"/></svg>`;
  S.street = () => `<svg viewBox="0 0 1000 1300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="sts" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3f6b"/><stop offset="1" stop-color="#8b7aa8"/></linearGradient></defs>
    <rect width="1000" height="1300" fill="url(#sts)"/>
    <rect x="0" y="420" width="420" height="700" fill="#6b6e82"/><rect x="460" y="300" width="560" height="820" fill="#7d7891"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="${40 + (i % 3) * 120}" y="${480 + Math.floor(i / 3) * 140}" width="80" height="90" fill="${i % 2 ? '#ffd27a' : '#3a3c55'}"/>`).join('')}
    ${Array.from({ length: 9 }, (_, i) => `<rect x="${500 + (i % 3) * 150}" y="${360 + Math.floor(i / 3) * 160}" width="100" height="100" fill="${i % 3 === 1 ? '#3a3c55' : '#ffd27a'}" opacity="0.9"/>`).join('')}
    <rect y="1120" width="1000" height="180" fill="#4a4a5c"/><rect y="1110" width="1000" height="16" fill="#9a98a8"/>
    <rect x="860" y="700" width="14" height="420" fill="#2b2b3a"/><circle cx="867" cy="690" r="34" fill="#ffe9a8"/><circle cx="867" cy="690" r="90" fill="#ffe9a8" opacity="0.25"/></svg>`;
  S.vintage = () => `<svg viewBox="0 0 1000 1300" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="vg" cx="50%" cy="40%" r="80%"><stop offset="0" stop-color="#9a6b43"/><stop offset="1" stop-color="#3b2516"/></radialGradient></defs>
    <rect width="1000" height="1300" fill="url(#vg)"/>${Array.from({ length: 60 }, (_, i) => `<line x1="${(i * 97) % 1000}" y1="0" x2="${(i * 97 + 30) % 1000}" y2="1300" stroke="#e8c79a" stroke-width="1.5" opacity="0.12"/>`).join('')}</svg>`;
  S.stage = () => `<svg viewBox="0 0 1000 1300" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="stg" cx="50%" cy="55%" r="55%"><stop offset="0" stop-color="#ffe9f2"/><stop offset="1" stop-color="#b03a6e"/></radialGradient></defs><rect width="1000" height="1300" fill="url(#stg)"/>
    ${Array.from({ length: 6 }, (_, i) => `<path d="M${i * 30} 0 q 40 650 ${-10 + i * 6} 1300 h 30 q 0 -650 -${20 - i * 2} -1300Z" fill="#c2185b" opacity="0.6"/><path d="M${1000 - i * 30} 0 q -40 650 ${10 - i * 6} 1300 h -30 q 0 -650 ${20 - i * 2} -1300Z" fill="#c2185b" opacity="0.6"/>`).join('')}
    <ellipse cx="500" cy="1180" rx="380" ry="70" fill="#fff" opacity="0.5"/></svg>`;
  S.dream = () => skyScene(1000, 1300, 21);

  window.REEL_ART = { P, starPath, starsLayer, pattern, skyScene, tvScene, scenes: S, rand };
})();
