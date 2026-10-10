/**
 * The music room: four rhythms of the nine nights, synthesised as they
 * play, and a listener who can join in.
 *
 *   garba     — 6/8 on the dhol: the round bass “dhin”, the slap, the circle’s
 *               claps and the manjira, a harmonium drone and a shehnai line
 *   dandiya   — 4/4, faster, sticks clacking in pairs
 *   dhaak     — the Bengali drum of Durga Puja, with the kansar gong
 *   dhunuchi  — dhaak at dancing speed, conch and ululation (ulu)
 *
 * The garba speeds up as it goes, the way a circle does over a night, and
 * starts slow again. Taps on the page add a clap, a stick, a drum stroke.
 * Everything is original; nothing is sampled.
 */

export type Mode = 'garba' | 'dandiya' | 'dhaak' | 'dhunuchi';

const m2f = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

interface Pattern { steps: number; bass: number[]; slap: number[]; clap: number[]; stick: number[]; gong: number[]; bpm: [number, number] }
const PAT: Record<Mode, Pattern> = {
  garba: { steps: 6, bass: [0, 3], slap: [2, 4, 5], clap: [0, 2, 4], stick: [], gong: [], bpm: [96, 156] },
  dandiya: { steps: 8, bass: [0, 4, 6], slap: [2, 5, 7], clap: [], stick: [0, 2, 4, 5, 6], gong: [], bpm: [120, 168] },
  dhaak: { steps: 8, bass: [0, 3, 6], slap: [2, 4, 5, 7], clap: [], stick: [], gong: [0, 4], bpm: [104, 132] },
  dhunuchi: { steps: 8, bass: [0, 2, 3, 6], slap: [1, 4, 5, 7], clap: [], stick: [], gong: [0, 2, 4, 6], bpm: [138, 176] },
};
/** Scales for the melody: Khamaj-like for the garba nights, Bhairavi-like for the pujo. */
const SCALE: Record<Mode, number[]> = { garba: [0, 2, 4, 5, 7, 9, 10, 12], dandiya: [0, 2, 4, 5, 7, 9, 10, 12], dhaak: [0, 1, 3, 5, 7, 8, 10, 12], dhunuchi: [0, 1, 3, 5, 7, 8, 10, 12] };
/** Original melodic cells, in scale degrees, one per bar; −1 rests. */
const CELLS: number[][] = [[4, 3, 2, -1, 4, 5], [5, 4, 3, 2, 1, 2], [2, 4, 5, 7, 5, 4], [3, 2, 1, 0, -1, 0], [0, 2, 3, 4, 3, 2], [4, 5, 7, 6, 5, 4], [3, 4, 2, 1, 0, -1], [7, 6, 5, 4, 2, 0]];

export interface Hit { t: number; kind: 'bass' | 'slap' | 'clap' | 'stick' | 'gong' | 'conch' | 'ulu' | 'tap'; step: number }

export class Utsav {
  ctx: AudioContext | null = null;
  private out!: GainNode;
  private verb!: ConvolverNode;
  private wet!: GainNode;
  private noise: AudioBuffer | null = null;
  private drone: { stop: () => void } | null = null;
  private timer = 0;
  private nextT = 0;
  private step = 0;
  private bar = 0;
  private startT = 0;
  mode: Mode = 'garba';
  playing = false;
  /** 0 → 1 over a cycle: the circle getting faster. */
  heat = 0;
  speed = 1;
  /** Recent strokes, for the dancers to answer. */
  hits: Hit[] = [];

  private ensure() {
    if (this.ctx) return this.ctx;
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.out = ctx.createGain(); this.out.gain.value = 0.8;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    this.out.connect(comp).connect(ctx.destination);
    // a courtyard's worth of reverb
    const len = Math.floor(ctx.sampleRate * 1.6), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    this.verb = ctx.createConvolver(); this.verb.buffer = ir; this.wet = ctx.createGain(); this.wet.gain.value = 0.22;
    this.verb.connect(this.wet).connect(this.out);
    const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.noise = nb;
    return ctx;
  }

  private dest(g: GainNode, wet = 0.5) { g.connect(this.out); const s = this.ctx!.createGain(); s.gain.value = wet; g.connect(s).connect(this.verb); }
  private env(t: number, a: number, d: number, peak: number) { const g = this.ctx!.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); return g; }
  private tone(t: number, f0: number, f1: number, dur: number, type: OscillatorType, peak: number, wet = 0.4, a = 0.004) {
    const ctx = this.ctx!, o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur * 0.6);
    const g = this.env(t, a, dur, peak); o.connect(g); this.dest(g, wet); o.start(t); o.stop(t + a + dur + 0.05);
  }
  private burst(t: number, f: number, q: number, dur: number, peak: number, wet = 0.4, type: BiquadFilterType = 'bandpass') {
    const ctx = this.ctx!, s = ctx.createBufferSource(); s.buffer = this.noise; const bp = ctx.createBiquadFilter(); bp.type = type; bp.frequency.value = f; bp.Q.value = q;
    const g = this.env(t, 0.002, dur, peak); s.connect(bp).connect(g); this.dest(g, wet); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  /* the instruments */
  bass(t: number, v = 1) { this.tone(t, this.mode.startsWith('dh') ? 96 : 120, 52, 0.42, 'sine', 0.9 * v, 0.25); this.burst(t, 180, 1, 0.05, 0.25 * v, 0.1, 'lowpass'); }
  slap(t: number, v = 1) { this.burst(t, this.mode.startsWith('dh') ? 900 : 2400, 1.2, 0.07, 0.55 * v, 0.3); this.tone(t, this.mode.startsWith('dh') ? 260 : 380, 300, 0.08, 'triangle', 0.25 * v, 0.2); }
  clap(t: number, v = 1) { for (let i = 0; i < 3; i++) this.burst(t + i * 0.009, 1500, 0.9, 0.05, 0.35 * v, 0.5); }
  stick(t: number, v = 1) { this.tone(t, 1250, 1100, 0.04, 'square', 0.12 * v, 0.3); this.burst(t, 2600, 3, 0.04, 0.45 * v, 0.35); }
  manjira(t: number, v = 1) { for (const f of [2793, 4180, 5310]) this.tone(t, f, f * 0.998, 0.22, 'sine', 0.035 * v, 0.6); }
  gong(t: number, v = 1) { for (const [f, a] of [[523, 0.12], [1391, 0.07], [2285, 0.05], [3120, 0.03]] as [number, number][]) this.tone(t, f, f * 0.995, 1.1, 'sine', a * v, 0.7); }
  conch(t: number) {
    const ctx = this.ctx!, o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(m2f(58), t);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5; lg.gain.value = 3; lfo.connect(lg).connect(o.frequency);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.22, t + 0.35); g.gain.setValueAtTime(0.22, t + 1.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    o.connect(lp).connect(g); this.dest(g, 0.8); o.start(t); lfo.start(t); o.stop(t + 2.5); lfo.stop(t + 2.5);
    this.burst(t, 900, 0.6, 2.2, 0.05, 0.6);
  }
  ulu(t: number) {
    const ctx = this.ctx!, o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 1150;
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 13; lg.gain.value = 140; lfo.connect(lg).connect(o.frequency);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09, t + 0.08); g.gain.setValueAtTime(0.09, t + 1.4); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
    o.connect(g); this.dest(g, 0.7); o.start(t); lfo.start(t); o.stop(t + 1.8); lfo.stop(t + 1.8);
  }
  /** A reedy melody note: shehnai for the garba, a flute-ish tone for the pujo. */
  note(t: number, midi: number, dur: number) {
    const ctx = this.ctx!, reed = !this.mode.startsWith('dh');
    const o = ctx.createOscillator(); o.type = reed ? 'sawtooth' : 'triangle'; o.frequency.setValueAtTime(m2f(midi) * 0.985, t); o.frequency.linearRampToValueAtTime(m2f(midi), t + 0.06);
    const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5.5; vg.gain.value = m2f(midi) * 0.006; vib.connect(vg).connect(o.frequency);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = reed ? 1400 : 1800; f.Q.value = reed ? 1.4 : 0.8;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(reed ? 0.13 : 0.16, t + 0.04); g.gain.setValueAtTime(reed ? 0.12 : 0.14, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
    o.connect(f).connect(g); this.dest(g, 0.6); o.start(t); vib.start(t); o.stop(t + dur + 0.15); vib.stop(t + dur + 0.15);
  }
  private startDrone() {
    this.drone?.stop();
    const ctx = this.ctx!, t = ctx.currentTime, g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 1.5);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    const os = [m2f(50), m2f(57), m2f(62)].map((f) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(t); return o; });
    lp.connect(g); this.dest(g, 0.5);
    this.drone = { stop: () => { const n = ctx.currentTime; g.gain.setTargetAtTime(0, n, 0.3); os.forEach((o) => o.stop(n + 1.5)); } };
  }

  bpm() { const [a, b] = PAT[this.mode].bpm; return (a + (b - a) * this.heat) * this.speed; }
  /** Seconds per step (an eighth note). */
  stepDur() { return 60 / this.bpm() / 2; }

  private tick = () => {
    const ctx = this.ctx!; const P = PAT[this.mode];
    while (this.nextT < ctx.currentTime + 0.12) {
      const t = this.nextT, s = this.step % P.steps;
      const push = (kind: Hit['kind']) => this.hits.push({ t, kind, step: s });
      if (P.bass.includes(s)) { this.bass(t, s === 0 ? 1 : 0.8); push('bass'); }
      if (P.slap.includes(s)) { this.slap(t, 0.8 + Math.random() * 0.2); push('slap'); }
      if (P.clap.includes(s)) { this.clap(t, s === 0 ? 1 : 0.8); push('clap'); }
      if (P.stick.includes(s)) { this.stick(t); push('stick'); }
      if (P.gong.includes(s)) { this.gong(t, s === 0 ? 1 : 0.6); push('gong'); }
      if (this.mode === 'garba' || this.mode === 'dandiya') this.manjira(t, s % 2 ? 0.5 : 1);
      if (this.mode === 'dhunuchi' && s % 2 === 1 && Math.random() < 0.5) this.slap(t + this.stepDur() / 2, 0.5);
      // the melody: one cell a bar, skipping some bars to breathe
      if (this.bar % 8 < 6) { const cell = CELLS[(this.bar + (this.mode === 'dandiya' ? 3 : 0)) % CELLS.length], d = cell[s % cell.length]; if (d >= 0 && s < 6) { const sc = SCALE[this.mode], base = this.mode.startsWith('dh') ? 62 : 64; this.note(t, base + sc[d % sc.length] + (d >= sc.length ? 12 : 0), this.stepDur() * 0.95); } }
      // conch and ulu open the dhaak and recur
      if (this.mode.startsWith('dh') && s === 0 && this.bar % 8 === 0) { this.conch(t); push('conch'); }
      if (this.mode === 'dhunuchi' && s === 0 && this.bar % 4 === 2) { this.ulu(t); push('ulu'); }
      this.nextT += this.stepDur();
      this.step++;
      if (this.step % P.steps === 0) {
        this.bar++;
        // the circle quickens over 48 bars, then starts slow again
        this.heat = this.mode === 'garba' || this.mode === 'dandiya' ? (this.bar % 48) / 47 : Math.min(1, (this.bar % 64) / 32);
      }
    }
    const now = ctx.currentTime; this.hits = this.hits.filter((h) => h.t > now - 2);
  };

  async start(mode?: Mode) {
    const ctx = this.ensure();
    if (mode) this.mode = mode;
    await ctx.resume();
    if (!this.playing) {
      this.playing = true; this.step = 0; this.bar = 0; this.heat = 0;
      this.nextT = ctx.currentTime + 0.1; this.startT = this.nextT;
      this.startDrone();
      this.timer = window.setInterval(this.tick, 25);
    }
  }
  setMode(m: Mode) { this.mode = m; this.step = 0; this.bar = 0; this.heat = 0; if (this.ctx) this.nextT = this.ctx.currentTime + 0.05; }
  stop() { this.playing = false; clearInterval(this.timer); this.drone?.stop(); this.drone = null; }
  close() { this.stop(); void this.ctx?.close(); this.ctx = null; }

  /** The listener joins in. */
  tap(kind?: Hit['kind']) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.005;
    const k = kind ?? (this.mode === 'garba' ? 'clap' : this.mode === 'dandiya' ? 'stick' : 'slap');
    if (k === 'clap') this.clap(t, 1.1); else if (k === 'stick') this.stick(t, 1.2); else if (k === 'gong') this.gong(t); else if (k === 'conch') this.conch(t); else if (k === 'ulu') this.ulu(t); else this.slap(t, 1.1);
    this.hits.push({ t, kind: 'tap', step: -1 });
  }

  /** Where the dance is: beats since starting, with a fractional part. */
  beat() { if (!this.ctx || !this.playing) return 0; const P = PAT[this.mode]; return (this.step - (this.nextT - this.ctx.currentTime) / this.stepDur()) / (P.steps / (this.mode === 'garba' ? 2 : 2)); }
  now() { return this.ctx?.currentTime ?? 0; }
  elapsed() { return this.ctx ? this.ctx.currentTime - this.startT : 0; }
}

/* ───────── the playlist ───────── */

export interface Song { title: string; dev?: string; lang: 'Gujarati' | 'Bengali'; who: string; note: string; q: string }
export interface Night { n: number | 'mahalaya' | 'dashami'; label: string; songs: Song[] }

const yt = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
export const songLink = (s: Song) => yt(s.q);

/**
 * A listening list for the nine nights: Gujarati garba for every night and,
 * from Shashthi, the Bengali songs of the Pujo, with the dawn broadcast of
 * Mahalaya before the first night. Links open a YouTube search; the
 * recordings belong to their makers.
 */
export const NIGHTS: Night[] = [
  { n: 'mahalaya', label: 'Mahalaya dawn — before the first night', songs: [
    { title: 'Mahishasuramardini', dev: 'মহিষাসুরমর্দিনী', lang: 'Bengali', who: 'All India Radio, Kolkata · recited by Birendra Krishna Bhadra · script by Bani Kumar · music by Pankaj Mullick', note: 'The dawn programme of hymns, recitation and song broadcast every Mahalaya since 1931; it opens with the conch and “Ya Chandi”.', q: 'Mahishasuramardini Birendra Krishna Bhadra Mahalaya' },
    { title: 'Bajlo Tomar Alor Benu', dev: 'বাজলো তোমার আলোর বেণু', lang: 'Bengali', who: 'Supriti Ghosh', note: 'From Mahishasuramardini — the song most Bengalis hum on Mahalaya morning.', q: 'Bajlo Tomar Alor Benu Supriti Ghosh' },
    { title: 'Akhilo Bimane Tabo Jayagaane', lang: 'Bengali', who: 'Krishna Dasgupta', note: 'Another song from the Mahalaya programme.', q: 'Akhilo Bimane Tabo Jayagaane Krishna Dasgupta' },
  ] },
  { n: 1, label: 'Night 1 · Shailaputri', songs: [
    { title: 'Jai Adhya Shakti', dev: 'જય આદ્યા શક્તિ', lang: 'Gujarati', who: 'traditional aarti to Ambe Maa', note: 'The aarti sung to open the night before the circle starts.', q: 'Jai Adhya Shakti aarti Ambe Maa' },
    { title: 'Aarasur Na Ambe Maa', lang: 'Gujarati', who: 'traditional', note: 'A song to Amba of Arasur — Ambaji, in north Gujarat.', q: 'Aarasur Na Ambe Maa garba' },
  ] },
  { n: 2, label: 'Night 2 · Brahmacharini', songs: [
    { title: 'Tara Vina Shyam Mane Ekladu Lage', dev: 'તારા વિના શ્યામ મને એકલડું લાગે', lang: 'Gujarati', who: 'attributed to Pankaj Bhatt; sung by many', note: 'A garba of the gopis missing Krishna on an autumn night — “without you, Shyam, I feel alone”.', q: 'Tara Vina Shyam Mane Ekladu Lage garba' },
  ] },
  { n: 3, label: 'Night 3 · Chandraghanta', songs: [
    { title: 'Chogada Tara', lang: 'Gujarati', who: 'Gujarati folk song', note: 'The folk original behind the later film version (Loveyatri, 2018).', q: 'Chogada Tara Gujarati folk garba' },
  ] },
  { n: 4, label: 'Night 4 · Kushmanda', songs: [
    { title: 'Kesariyo Rang Tane Lagyo', lang: 'Gujarati', who: 'traditional; often heard live from Falguni Pathak', note: 'A dandiya favourite: “the saffron colour has caught you”.', q: 'Kesariyo Rang Tane Lagyo garba Falguni Pathak' },
  ] },
  { n: 5, label: 'Night 5 · Skandamata', songs: [
    { title: 'Lagyo Chundiye Rang', lang: 'Gujarati', who: 'traditional', note: 'Simple, steady beats for a long circle.', q: 'Lagyo Chundiye Rang garba' },
  ] },
  { n: 6, label: 'Night 6 · Katyayani · Shashthi', songs: [
    { title: 'Ramti Aave Maadi', lang: 'Gujarati', who: 'traditional', note: 'The softer side of the garba: the Mother comes, playing.', q: 'Ramti Aave Maadi garba' },
    { title: 'Dhaker Taale', dev: 'ঢাকের তালে', lang: 'Bengali', who: 'Abhijeet Bhattacharya · film Poran Jai Jolia Re', note: 'A Pujo dance staple from Shashthi on.', q: 'Dhaker Taale Poran Jai Jolia Re Abhijeet' },
  ] },
  { n: 7, label: 'Night 7 · Kalaratri · Saptami', songs: [
    { title: 'Garbe Ghumjo Raaj', lang: 'Gujarati', who: 'devotional', note: 'A Mataji song to begin the circle.', q: 'Garbe Ghumjo Raaj Mataji' },
    { title: 'Dhak Baja Kashor Baja', dev: 'ঢাক বাজা কাঁসর বাজা', lang: 'Bengali', who: 'Shreya Ghoshal', note: 'Beat the dhaak, beat the kansar.', q: 'Dhak Baja Kashor Baja Shreya Ghoshal' },
  ] },
  { n: 8, label: 'Night 8 · Mahagauri · Ashtami', songs: [
    { title: 'Mor Bani Thanghat Kare', lang: 'Gujarati', who: 'Aditi Paul and Osman Mir · film Goliyon Ki Raasleela Ram-Leela (2013)', note: 'A film garba that every ground now plays.', q: 'Mor Bani Thanghat Kare Ram Leela' },
    { title: 'Jaago Uma', dev: 'জাগো উমা', lang: 'Bengali', who: 'Rupankar and Anupam Roy · film Uma', note: 'A call to Uma, the goddess as a daughter come home.', q: 'Jaago Uma Rupankar Anupam Roy' },
  ] },
  { n: 9, label: 'Night 9 · Siddhidatri · Navami', songs: [
    { title: 'Dugga Ma', lang: 'Bengali', who: 'Arijit Singh · Bolo Dugga Maiki', note: 'Set against a family Pujo in an old Kolkata house.', q: 'Dugga Ma Arijit Singh Bolo Dugga Maiki' },
    { title: 'Dugga Elo', lang: 'Bengali', who: 'Monali Thakur', note: 'Durga has come.', q: 'Dugga Elo Monali Thakur' },
  ] },
  { n: 'dashami', label: 'Vijayadashami — the immersion', songs: [
    { title: 'Elo Je Maa', lang: 'Bengali', who: 'film Bela Sheshe', note: 'A Pujo song people return to as the festival ends.', q: 'Elo Je Maa Bela Sheshe' },
    { title: 'Puja songs of R. D. Burman and Asha Bhosle', lang: 'Bengali', who: 'R. D. Burman, Asha Bhosle', note: 'The pujor gaan albums of the late 1960s and 70s, once played round the clock in Kolkata’s pandals.', q: 'RD Burman Asha Bhosle pujor gaan' },
  ] },
];
