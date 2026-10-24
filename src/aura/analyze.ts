// In-browser analysis of a clip: the beat (Web Audio), the cuts (sampled
// frames), and where the person is (U^2-Net-p segmentation via onnxruntime-web,
// run on this device). Nothing leaves the browser.
import type { Analysis, Masks } from './plan';

export type Progress = (step: string, frac: number) => void;

// ---------- beats ----------
function fft(re: Float32Array, im: Float32Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}

export async function analyzeAudio(file: Blob, duration: number) {
  const empty = { bpm: 0, beats: [] as number[], downbeats: [] as number[], onsets: [] as number[] };
  let buf: AudioBuffer;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    buf = await ctx.decodeAudioData(await file.arrayBuffer());
    ctx.close();
  } catch {
    return fallbackGrid(duration, empty);
  }
  const step = Math.max(1, Math.round(buf.sampleRate / 22050));
  const sr = buf.sampleRate / step;
  const len = Math.floor(buf.length / step);
  const x = new Float32Array(len);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) x[i] += d[i * step] / buf.numberOfChannels;
  }
  const N = 2048, hop = 512;
  const frames = Math.floor((len - N) / hop);
  if (frames < 20) return fallbackGrid(duration, empty);
  const win = new Float32Array(N).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
  const re = new Float32Array(N), im = new Float32Array(N);
  let prev = new Float32Array(N / 2);
  const flux = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    for (let i = 0; i < N; i++) { re[i] = x[f * hop + i] * win[i]; im[i] = 0; }
    fft(re, im);
    const mag = new Float32Array(N / 2);
    let s = 0;
    for (let k = 0; k < N / 2; k++) { mag[k] = Math.log1p(Math.hypot(re[k], im[k]) * 10); if (f) s += Math.max(0, mag[k] - prev[k]); }
    flux[f] = s; prev = mag;
  }
  let mean = 0; for (const v of flux) mean += v; mean /= frames;
  let sd = 0; for (const v of flux) sd += (v - mean) ** 2; sd = Math.sqrt(sd / frames) || 1;
  for (let i = 0; i < frames; i++) flux[i] = (flux[i] - mean) / sd;
  const rate = sr / hop;
  // tempo from autocorrelation, 70-180 bpm
  let best = -Infinity, bestLag = 0;
  for (let lag = Math.floor(rate * 60 / 180); lag <= Math.ceil(rate * 60 / 70); lag++) {
    let s = 0;
    for (let i = 0; i + lag < frames; i++) s += flux[i] * flux[i + lag];
    if (s > best) { best = s; bestLag = lag; }
  }
  const bpm = (60 * rate) / bestLag;
  const period = 60 / bpm;
  let bestPh = 0, bestScore = -Infinity;
  for (let ph = 0; ph < period; ph += 0.01) {
    let s = 0;
    for (let b = ph; b < duration; b += period) { const i = Math.round(b * rate); if (i < frames) s += flux[i]; }
    if (s > bestScore) { bestScore = s; bestPh = ph; }
  }
  const beats: number[] = [];
  for (let b = bestPh; b < duration; b += period) beats.push(+b.toFixed(3));
  const strength = [0, 1, 2, 3].map((k) => beats.filter((_, i) => i % 4 === k).reduce((a, b) => a + (flux[Math.min(frames - 1, Math.round(b * rate))] || 0), 0));
  const k0 = strength.indexOf(Math.max(...strength));
  const onsets: number[] = [];
  for (let i = 1; i < frames - 1; i++) if (flux[i] > 3 && flux[i] >= flux[i - 1] && flux[i] >= flux[i + 1]) onsets.push(+((i + 1) / rate).toFixed(3));
  return { bpm: +bpm.toFixed(1), beats, downbeats: beats.filter((_, i) => i % 4 === k0), onsets };
}

function fallbackGrid(duration: number, e: { bpm: number; beats: number[]; downbeats: number[]; onsets: number[] }) {
  const period = 0.6;
  for (let b = 0.3; b < duration; b += period) e.beats.push(+b.toFixed(3));
  e.downbeats = e.beats.filter((_, i) => i % 4 === 0);
  e.bpm = 100;
  return e;
}

// ---------- frames: cuts and the person ----------
function seek(v: HTMLVideoElement, t: number) {
  return new Promise<void>((res) => {
    const done = () => { v.removeEventListener('seeked', done); res(); };
    v.addEventListener('seeked', done);
    v.currentTime = Math.min(t, Math.max(0, v.duration - 0.05));
  });
}

type Session = { run: (feeds: Record<string, unknown>) => Promise<Record<string, { data: Float32Array; dims: number[] }>>; inputNames: string[] };
let sessionPromise: Promise<{ ort: typeof import('onnxruntime-web/wasm'); session: Session }> | null = null;
async function segmenter() {
  sessionPromise ||= (async () => {
    const ort = await import('onnxruntime-web/wasm');
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.wasmPaths = { wasm: new URL('../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm', import.meta.url).href };
    const model = new URL('./u2netp.onnx', import.meta.url).href;
    const session = (await ort.InferenceSession.create(model, { executionProviders: ['wasm'] })) as unknown as Session;
    return { ort, session };
  })();
  return sessionPromise;
}

export async function analyzeFrames(url: string, opts: { masks: boolean; onProgress: Progress; signal?: { cancelled: boolean } }) {
  const v = document.createElement('video');
  v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
  await new Promise<void>((res, rej) => { v.onloadeddata = () => res(); v.onerror = () => rej(new Error('this video could not be read by the browser')); });
  const duration = v.duration, W = v.videoWidth, H = v.videoHeight;
  const small = document.createElement('canvas'); small.width = 64; small.height = 48;
  const sg = small.getContext('2d', { willReadFrequently: true })!;
  const big = document.createElement('canvas'); big.width = 320; big.height = 320;
  const bg = big.getContext('2d', { willReadFrequently: true })!;
  const MW = 320, MH = Math.max(60, Math.round(320 * H / W));
  let seg: Awaited<ReturnType<typeof segmenter>> | null = null;
  if (opts.masks) {
    opts.onProgress('loading the person finder', 0);
    try { seg = await segmenter(); } catch (e) { console.warn('segmentation unavailable', e); seg = null; }
  }
  const step = 1 / 5; // seconds between sampled frames
  const shots = [0];
  let prevHist: Float32Array | null = null, prevPix: Uint8ClampedArray | null = null;
  const masks: Masks = { w: MW, h: MH, times: [], data: [] };
  const track = { times: [] as number[], x: [] as number[], y: [] as number[] };
  const n = Math.ceil(duration / step);
  const mean = [0.485, 0.456, 0.406], std = [0.229, 0.224, 0.225];
  for (let i = 0; i < n; i++) {
    if (opts.signal?.cancelled) throw new Error('cancelled');
    const t = i * step;
    await seek(v, t);
    sg.drawImage(v, 0, 0, 64, 48);
    const pix = sg.getImageData(0, 0, 64, 48).data;
    const hist = new Float32Array(12 * 4 * 4);
    for (let p = 0; p < pix.length; p += 4) {
      const r = pix[p], g = pix[p + 1], b = pix[p + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      let h = 0;
      if (mx !== mn) h = mx === r ? ((g - b) / (mx - mn) + 6) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4;
      hist[Math.floor(h * 2) * 16 + Math.min(3, Math.floor(((mx - mn) / (mx || 1)) * 4)) * 4 + Math.min(3, Math.floor(mx / 64))]++;
    }
    if (prevHist && prevPix) {
      let inter = 0, tot = 0, diff = 0;
      for (let k = 0; k < hist.length; k++) { inter += Math.min(hist[k], prevHist[k]); tot += hist[k]; }
      for (let p = 0; p < pix.length; p += 4) diff += Math.abs(pix[p] - prevPix[p]) + Math.abs(pix[p + 1] - prevPix[p + 1]) + Math.abs(pix[p + 2] - prevPix[p + 2]);
      diff /= (pix.length / 4) * 3 * 255;
      if ((1 - inter / tot > 0.45 || diff > 0.2) && t - shots[shots.length - 1] >= 0.6) shots.push(+t.toFixed(3));
    }
    prevHist = hist; prevPix = pix;
    // the person, at 2.5 samples a second
    if (seg && i % 2 === 0) {
      bg.drawImage(v, 0, 0, 320, 320);
      const d = bg.getImageData(0, 0, 320, 320).data;
      const input = new Float32Array(3 * 320 * 320);
      for (let p = 0, q = 0; p < d.length; p += 4, q++) {
        input[q] = (d[p] / 255 - mean[0]) / std[0];
        input[q + 102400] = (d[p + 1] / 255 - mean[1]) / std[1];
        input[q + 204800] = (d[p + 2] / 255 - mean[2]) / std[2];
      }
      const out = await seg.session.run({ [seg.session.inputNames[0]]: new seg.ort.Tensor('float32', input, [1, 3, 320, 320]) });
      const m = Object.values(out)[0].data;
      let lo = Infinity, hi = -Infinity;
      for (let k = 0; k < m.length; k++) { if (m[k] < lo) lo = m[k]; if (m[k] > hi) hi = m[k]; }
      const sc = 255 / (hi - lo + 1e-6);
      const mk = new Uint8Array(MW * MH);
      let sx = 0, sy = 0, sw = 0;
      for (let y = 0; y < MH; y++) {
        const sy0 = Math.floor((y / MH) * 320);
        for (let x = 0; x < MW; x++) {
          const val = (m[sy0 * 320 + Math.floor((x / MW) * 320)] - lo) * sc;
          mk[(MH - 1 - y) * MW + x] = val; // bottom-up rows for WebGL
          if (val > 128) { sx += x; sy += y; sw++; }
        }
      }
      masks.times.push(t); masks.data.push(mk);
      if (sw > MW * MH * 0.01) { track.times.push(t); track.x.push(sx / sw / MW); track.y.push(sy / sw / MH); }
    }
    opts.onProgress(seg ? 'finding cuts and the person' : 'finding cuts', (i + 1) / n);
  }
  v.removeAttribute('src'); v.load();
  return { duration, width: W, height: H, shots, masks: seg && masks.times.length ? masks : null, track: smoothTrack(track, shots, duration) };
}

// hold the framing steady within a shot, following the person slowly
function smoothTrack(tr: { times: number[]; x: number[]; y: number[] }, shots: number[], duration: number) {
  if (!tr.times.length) return { times: [0, duration], x: [0.5, 0.5], y: [0.45, 0.45] };
  const out = { times: [] as number[], x: [] as number[], y: [] as number[] };
  const cuts = [...shots, duration + 1];
  for (let s = 0; s < cuts.length - 1; s++) {
    const idx = tr.times.map((t, i) => [t, i] as const).filter(([t]) => t >= cuts[s] && t < cuts[s + 1]).map(([, i]) => i);
    if (!idx.length) { out.times.push(cuts[s], Math.min(duration, cuts[s + 1] - 0.01)); out.x.push(0.5, 0.5); out.y.push(0.45, 0.45); continue; }
    const med = (a: number[]) => [...a].sort((p, q) => p - q)[Math.floor(a.length / 2)];
    const mx = med(idx.map((i) => tr.x[i])), my = med(idx.map((i) => tr.y[i]));
    let ex = mx, ey = my;
    out.times.push(cuts[s]); out.x.push(mx); out.y.push(my);
    for (const i of idx) { ex = ex * 0.8 + tr.x[i] * 0.2; ey = ey * 0.8 + tr.y[i] * 0.2; out.times.push(tr.times[i]); out.x.push(ex * 0.6 + mx * 0.4); out.y.push(ey * 0.6 + my * 0.4); }
    out.times.push(Math.min(duration, cuts[s + 1] - 0.01)); out.x.push(out.x[out.x.length - 1]); out.y.push(out.y[out.y.length - 1]);
  }
  return out;
}

export async function analyze(file: File, url: string, opts: { masks: boolean; onProgress: Progress; signal?: { cancelled: boolean } }): Promise<Analysis> {
  const frames = await analyzeFrames(url, opts);
  opts.onProgress('finding the beat', 1);
  const audio = await analyzeAudio(file, frames.duration);
  return { ...frames, ...audio };
}
