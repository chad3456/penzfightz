// Frame-exact export: every frame is rendered and encoded with WebCodecs, so
// a slow device takes longer but never drops frames. Video is H.264 when the
// browser can encode it (VP9 otherwise); the clip's own sound is re-encoded
// to AAC (or Opus) and everything is muxed into one MP4.
import { ArrayBufferTarget, Muxer } from 'mp4-muxer';

export const canExportFrames = () => typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoFrame' in window;

async function pickVideo(w: number, h: number, fps: number) {
  const tries: [string, 'avc' | 'vp9'][] = [['avc1.640033', 'avc'], ['avc1.640028', 'avc'], ['avc1.4d0033', 'avc'], ['avc1.42003e', 'avc'], ['vp09.00.41.08', 'vp9'], ['vp09.00.40.08', 'vp9']];
  for (const [codec, kind] of tries) {
    const cfg: VideoEncoderConfig = { codec, width: w, height: h, bitrate: 14_000_000, framerate: fps, latencyMode: 'quality', ...(kind === 'avc' ? { avc: { format: 'avc' } } : {}) } as VideoEncoderConfig;
    try { if ((await VideoEncoder.isConfigSupported(cfg)).supported) return { cfg, kind }; } catch { /* next */ }
  }
  return null;
}

async function pickAudio(sampleRate: number, channels: number) {
  if (!('AudioEncoder' in window)) return null;
  for (const [codec, kind] of [['mp4a.40.2', 'aac'], ['opus', 'opus']] as const) {
    const rate = kind === 'opus' ? 48000 : sampleRate;
    const cfg: AudioEncoderConfig = { codec, sampleRate: rate, numberOfChannels: channels, bitrate: 192_000 };
    try { if ((await AudioEncoder.isConfigSupported(cfg)).supported) return { cfg, kind, rate }; } catch { /* next */ }
  }
  return null;
}

function resample(buf: AudioBuffer, rate: number) {
  const ch = Math.min(2, buf.numberOfChannels);
  const n = Math.floor(buf.duration * rate);
  const out = Array.from({ length: ch }, () => new Float32Array(n));
  const k = buf.sampleRate / rate;
  for (let c = 0; c < ch; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < n; i++) { const x = i * k, i0 = Math.floor(x), f = x - i0; out[c][i] = d[i0] * (1 - f) + (d[i0 + 1] ?? d[i0]) * f; }
  }
  return out;
}

export async function exportFrames(opts: {
  duration: number; fps: number; width: number; height: number;
  renderAt: (t: number, i: number) => Promise<HTMLCanvasElement>;
  audio: Blob; onProgress: (f: number, step: string) => void; signal: { cancelled: boolean };
}) {
  const { duration, fps, width, height } = opts;
  const v = await pickVideo(width, height, fps);
  if (!v) throw new Error('this browser cannot encode video');
  let audioBuf: AudioBuffer | null = null;
  try { const ac = new AudioContext(); audioBuf = await ac.decodeAudioData(await opts.audio.arrayBuffer()); ac.close(); } catch { audioBuf = null; }
  const channels = audioBuf ? Math.min(2, audioBuf.numberOfChannels) : 2;
  const a = audioBuf ? await pickAudio(audioBuf.sampleRate, channels) : null;
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: v.kind, width, height, frameRate: fps },
    ...(a ? { audio: { codec: a.kind, numberOfChannels: channels, sampleRate: a.rate } } : {}),
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });
  let fail: Error | null = null;
  const venc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: (e) => { fail = e as Error; } });
  venc.configure(v.cfg);
  const frames = Math.floor(duration * fps);
  for (let i = 0; i < frames; i++) {
    if (opts.signal.cancelled) { venc.close(); throw new Error('cancelled'); }
    if (fail) throw fail;
    const canvas = await opts.renderAt(i / fps, i);
    const frame = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
    venc.encode(frame, { keyFrame: i % (fps * 2) === 0 });
    frame.close();
    while (venc.encodeQueueSize > 4) await new Promise((r) => setTimeout(r, 4));
    opts.onProgress((i + 1) / frames, 'rendering frames');
  }
  await venc.flush();
  venc.close();
  if (a && audioBuf) {
    opts.onProgress(1, 'adding the sound');
    const aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: (e) => { fail = e as Error; } });
    aenc.configure(a.cfg);
    const pcm = resample(audioBuf, a.rate);
    const total = Math.min(pcm[0].length, Math.floor(duration * a.rate));
    const block = 4096;
    for (let s = 0; s < total; s += block) {
      const n = Math.min(block, total - s);
      const planar = new Float32Array(n * channels);
      for (let c = 0; c < channels; c++) planar.set(pcm[Math.min(c, pcm.length - 1)].subarray(s, s + n), c * n);
      const data = new AudioData({ format: 'f32-planar', sampleRate: a.rate, numberOfFrames: n, numberOfChannels: channels, timestamp: Math.round((s * 1e6) / a.rate), data: planar });
      aenc.encode(data);
      data.close();
    }
    await aenc.flush();
    aenc.close();
  }
  if (fail) throw fail;
  muxer.finalize();
  const blob = new Blob([muxer.target.buffer], { type: 'video/mp4' });
  return { blob, codec: v.cfg.codec, audio: a?.cfg.codec ?? 'none' };
}
