// The host: an original bobblehead paper-doll (big head, small body) cut out
// with a white sticker edge. Copper curls, star clip, gold hoops, lilac
// turtleneck. Mouth follows the voice; eyes blink.
// Swap in your own cut-out photo with meta.host.image (a transparent PNG).
(function () {
  const skin = '#eab08c', skinD = '#d48f6c', hair = '#b8552b', hairL = '#de7b43', hairD = '#86391d';

  function curls(cx, cy, rx, ry, n, rmin, rmax, fill, seed) {
    let s = seed, out = '';
    const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      out += `<circle cx="${(cx + Math.cos(a) * rx).toFixed(1)}" cy="${(cy + Math.sin(a) * ry).toFixed(1)}" r="${(rmin + r() * (rmax - rmin)).toFixed(1)}" fill="${fill}"/>`;
    }
    return out;
  }

  // head + shoulders, viewBox 0 0 400 470; body adds legs below (0 0 400 860)
  function shapes(full) {
    const back = `${curls(200, 190, 150, 140, 22, 46, 62, hairD, 7)}<ellipse cx="200" cy="200" rx="150" ry="150" fill="${hairD}"/>`;
    const neck = `<rect x="168" y="300" width="64" height="70" rx="20" fill="${skinD}"/>`;
    const torso = full
      ? `<path d="M88 470 C 88 400, 130 360, 200 360 C 270 360, 312 400, 312 470 L 300 640 H 100Z" fill="#b9a2e6"/><path d="M150 352 h100 v40 q -50 18 -100 0Z" fill="#a58bdc"/>
         <path d="M100 630 h 200 l -8 190 h -78 l -14 -150 l -14 150 h -78Z" fill="#9fc2ec"/><path d="M196 640 v 90" stroke="#7fa4d4" stroke-width="5"/>
         <ellipse cx="146" cy="832" rx="52" ry="22" fill="#fff"/><ellipse cx="254" cy="832" rx="52" ry="22" fill="#fff"/><path d="M100 828 h 92 M208 828 h 92" stroke="#f08fb6" stroke-width="6"/>
         <path d="M88 450 q -30 80 -6 170" stroke="#b9a2e6" stroke-width="42" stroke-linecap="round" fill="none"/><path d="M312 450 q 30 80 6 170" stroke="#b9a2e6" stroke-width="42" stroke-linecap="round" fill="none"/>
         <circle cx="82" cy="628" r="22" fill="${skin}"/><circle cx="318" cy="628" r="22" fill="${skin}"/>`
      : `<path d="M60 470 C 60 400, 120 360, 200 360 C 280 360, 340 400, 340 470Z" fill="#b9a2e6"/><path d="M150 352 h100 v40 q -50 18 -100 0Z" fill="#a58bdc"/>`;
    const face = `<ellipse cx="200" cy="215" rx="112" ry="128" fill="url(#hsk)"/>
      <ellipse cx="88" cy="225" rx="18" ry="26" fill="${skinD}"/><ellipse cx="312" cy="225" rx="18" ry="26" fill="${skinD}"/>
      <circle cx="86" cy="268" r="17" fill="none" stroke="#e7b83c" stroke-width="6"/><circle cx="314" cy="268" r="17" fill="none" stroke="#e7b83c" stroke-width="6"/>
      <ellipse cx="140" cy="262" rx="26" ry="15" fill="#f27fa6" opacity="0.45"/><ellipse cx="260" cy="262" rx="26" ry="15" fill="#f27fa6" opacity="0.45"/>
      ${[[128, 248], [142, 256], [156, 246], [246, 246], [258, 256], [272, 248]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#a8603e" opacity="0.7"/>`).join('')}
      <path d="M128 168 q 30 -16 56 -4" stroke="${hairD}" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M216 164 q 26 -12 56 4" stroke="${hairD}" stroke-width="9" stroke-linecap="round" fill="none"/>
      <g class="eyeL"><ellipse cx="156" cy="210" rx="20" ry="23" fill="#fff"/><circle cx="158" cy="212" r="14" fill="#3b2a24"/><circle cx="163" cy="206" r="5" fill="#fff"/></g>
      <g class="eyeR"><ellipse cx="244" cy="210" rx="20" ry="23" fill="#fff"/><circle cx="246" cy="212" r="14" fill="#3b2a24"/><circle cx="251" cy="206" r="5" fill="#fff"/></g>
      <rect class="lidL" x="132" y="184" width="48" height="0" fill="${skin}"/><rect class="lidR" x="220" y="184" width="48" height="0" fill="${skin}"/>
      <path d="M134 194 q 22 -16 44 -2 M222 192 q 22 -14 44 2" stroke="#3b2a24" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M196 226 q -8 22 4 26" stroke="${skinD}" stroke-width="6" stroke-linecap="round" fill="none"/>
      <g class="mouth"></g>`;
    const front = `<path d="M92 170 C 90 80, 170 50, 210 58 C 280 60, 318 110, 310 178 C 290 130, 250 110, 214 118 C 190 140, 140 150, 92 170Z" fill="url(#hhr)"/>
      ${curls(200, 112, 108, 52, 14, 22, 32, hair, 19)}${curls(205, 100, 70, 30, 9, 16, 24, hairL, 3)}
      <g transform="translate(276 112) rotate(18)"><path d="${window.REEL_ART.starPath(1, 0.48)}" transform="scale(30)" fill="#f8d23c" stroke="#fff" stroke-width="0.12"/></g>`;
    return { back, neck, torso, face, front };
  }

  function mouthSVG(open, smile = 1) {
    const o = Math.max(0, Math.min(1, open));
    const w = 34 + o * 6, h = 4 + o * 30, y = 284;
    if (o < 0.06) return `<path d="M${200 - w} ${y - 6} q ${w} ${18 * smile} ${w * 2} 0" stroke="#9c3b3b" stroke-width="7" stroke-linecap="round" fill="none"/>`;
    return `<path d="M${200 - w} ${y - 6} q ${w} ${-4} ${w * 2} 0 q ${-6} ${h + 10} ${-w} ${h + 10} q ${-w + 6} 0 ${-w} ${-h - 10}Z" fill="#7a2230"/>
      <path d="M${200 - w + 6} ${y - 5} q ${w - 6} -3 ${(w - 6) * 2} 0 v ${Math.min(10, h * 0.4)} q ${-(w - 6)} 4 ${-(w - 6) * 2} 0Z" fill="#fff"/>
      <ellipse cx="200" cy="${y + h * 0.75}" rx="${w * 0.45}" ry="${Math.max(2, h * 0.28)}" fill="#e5707f"/>`;
  }

  function build(full) {
    const s = shapes(full);
    const vb = full ? '0 0 400 860' : '0 0 400 470';
    const body = `${s.back}${s.neck}${s.torso}${s.face}${s.front}`;
    // a white sticker edge: the same silhouette, stroked fat and white, behind
    const edge = `<g fill="#fff" stroke="#fff" stroke-width="22" stroke-linejoin="round">${(s.back + s.neck + s.torso + s.front).replace(/fill="[^"]*"/g, '').replace(/url\(#[^)]+\)/g, '')}<ellipse cx="200" cy="215" rx="112" ry="128"/><ellipse cx="88" cy="225" rx="18" ry="26"/><ellipse cx="312" cy="225" rx="18" ry="26"/></g>`;
    return `<svg class="host-svg" viewBox="${vb}" overflow="visible"><defs>
      <radialGradient id="hsk" cx="45%" cy="38%" r="70%"><stop offset="0" stop-color="#f4c7a6"/><stop offset="1" stop-color="${skin}"/></radialGradient>
      <linearGradient id="hhr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hairL}"/><stop offset="1" stop-color="${hair}"/></linearGradient>
      <filter id="hsh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000" flood-opacity="0.25"/></filter></defs>
      <g filter="url(#hsh)">${edge}</g><g class="host-body">${body}</g></svg>`;
  }

  function laptop() {
    return `<svg class="laptop-svg" viewBox="0 0 320 210"><defs><linearGradient id="lpg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eceef2"/><stop offset="0.55" stop-color="#c3c6ce"/><stop offset="1" stop-color="#9a9ea8"/></linearGradient>
      <filter id="lps" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#000" flood-opacity="0.28"/></filter></defs>
      <g filter="url(#lps)"><rect x="6" y="6" width="308" height="184" rx="18" fill="#fff"/><rect x="14" y="14" width="292" height="168" rx="12" fill="url(#lpg)"/></g>
      <rect x="0" y="182" width="320" height="22" rx="8" fill="#b9bcc4"/>
      <g transform="translate(160 98) rotate(-8)"><path d="M0 18 C -4 12,-26 4,-26 -10 C -26 -24,-8 -26,0 -14 C 8 -26,26 -24,26 -10 C 26 4,4 12,0 18Z" fill="#f06aa6" stroke="#fff" stroke-width="4"/></g>
      <g transform="translate(232 60) rotate(14)"><path d="${window.REEL_ART.starPath(1, 0.48)}" transform="scale(17)" fill="#e3ff3b" stroke="#fff" stroke-width="0.16"/></g>
      <g transform="translate(82 142) rotate(-12)"><rect x="-30" y="-12" width="60" height="24" rx="12" fill="#7385cf" stroke="#fff" stroke-width="3"/></g></svg>`;
  }

  function update(el, open, blink) {
    const m = el.querySelector('.mouth');
    if (m) m.innerHTML = mouthSVG(open);
    const h = 46 * blink;
    for (const c of ['.lidL', '.lidR']) { const l = el.querySelector(c); if (l) l.setAttribute('height', h.toFixed(1)); }
  }

  window.REEL_HOST = { build, laptop, update };
})();
