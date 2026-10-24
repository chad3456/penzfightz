import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { analyze } from './analyze';
import { canExportFrames, exportFrames } from './exporter';
import { LOOKS, lookOf } from './looks';
import { drawOverlays, loadFonts, OUT_H, OUT_W } from './overlay';
import { autoPlan, frameState, newId, segmentAt, shuffleLooks, type Analysis, type AuraEvent, type Plan } from './plan';
import { AuraRenderer } from './renderer';

type Stage = 'pick' | 'analyze' | 'edit';
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}.${String(Math.floor((t % 1) * 10))}`;

function pickMime() {
  const opts = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return opts.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) ?? '';
}

export default function AuraFX({ onExit }: { onExit: () => void }) {
  const [stage, setStage] = useState<Stage>('pick');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [findPerson, setFindPerson] = useState(true);
  const [progress, setProgress] = useState({ step: '', frac: 0 });
  const [error, setError] = useState('');
  const [a, setA] = useState<Analysis | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [sel, setSel] = useState(0);
  const [tab, setTab] = useState<'looks' | 'text' | 'style'>('looks');
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState<number | null>(null);
  const [result, setResult] = useState<{ url: string; name: string; size: number; type: string } | null>(null);
  const [drag, setDrag] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const outRef = useRef<HTMLCanvasElement>(null);
  const rendRef = useRef<AuraRenderer | null>(null);
  const lastFreeze = useRef<AuraEvent | null>(null);
  const planRef = useRef<Plan | null>(null);
  const aRef = useRef<Analysis | null>(null);
  const cancelRef = useRef({ cancelled: false });
  const audioRef = useRef<{ ac: AudioContext; dest: MediaStreamAudioDestinationNode } | null>(null);
  const loopRef = useRef(0);
  const exportRef = useRef({ cancelled: false, busy: false });
  planRef.current = plan; aRef.current = a;

  useEffect(() => { loadFonts(); return () => { rendRef.current?.dispose(); cancelRef.current.cancelled = true; }; }, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  // ---------- drawing ----------
  const draw = useCallback((time: number) => {
    const p = planRef.current, an = aRef.current, v = videoRef.current, out = outRef.current;
    if (!p || !an || !v || !out) return;
    rendRef.current ||= new AuraRenderer();
    const frameNo = Math.round(time * 30);
    const st = frameState(p, an, time, frameNo, lastFreeze.current);
    rendRef.current.render({ ...st.params, source: v.readyState >= 2 ? v : null });
    lastFreeze.current = st.freeze;
    const g = out.getContext('2d')!;
    g.drawImage(rendRef.current.canvas, 0, 0, OUT_W, OUT_H);
    drawOverlays(g, p, an, st, time, frameNo);
    return st;
  }, []);

  const tick = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const now = v.currentTime;
    draw(now);
    setT(now);
    if (!v.paused && !v.ended) {
      const rvfc = (v as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number }).requestVideoFrameCallback;
      if (rvfc) loopRef.current = rvfc.call(v, tick); else loopRef.current = requestAnimationFrame(tick);
    }
  }, [draw]);

  const seekTo = useCallback((time: number) => {
    const v = videoRef.current; if (!v || !aRef.current) return;
    const tt = Math.max(0, Math.min(aRef.current.duration - 0.03, time));
    lastFreeze.current = null;
    v.currentTime = tt;
    setT(tt);
    const p = planRef.current;
    if (p) setSel(segmentAt(p, tt));
  }, []);

  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const onSeeked = () => { if (v.paused && !exportRef.current.busy) draw(v.currentTime); };
    const onEnd = () => setPlaying(false);
    v.addEventListener('seeked', onSeeked); v.addEventListener('ended', onEnd);
    return () => { v.removeEventListener('seeked', onSeeked); v.removeEventListener('ended', onEnd); };
  }, [draw, stage]);

  // redraw a paused frame whenever the edit changes
  useEffect(() => { const v = videoRef.current; if (v && v.paused && stage === 'edit') draw(v.currentTime); }, [plan, stage, draw]);

  const togglePlay = async () => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) {
      if (v.ended || v.currentTime >= (a?.duration ?? 0) - 0.05) v.currentTime = 0;
      lastFreeze.current = null;
      await audioRef.current?.ac.resume();
      await v.play(); setPlaying(true); tick();
    } else { v.pause(); setPlaying(false); }
  };

  // ---------- loading ----------
  const choose = (f: File | undefined) => {
    if (!f) return;
    if (!/^video\//.test(f.type) && !/\.(mp4|mov|webm|m4v|mkv)$/i.test(f.name)) { setError('Choose a video file (MP4, MOV or WebM).'); return; }
    setError(''); setFile(f); setResult(null);
    setUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(f); });
  };
  const start = async () => {
    if (!file || !url) return;
    setStage('analyze'); setError('');
    cancelRef.current = { cancelled: false };
    try {
      await loadFonts();
      const an = await analyze(file, url, { masks: findPerson, signal: cancelRef.current, onProgress: (step, frac) => setProgress({ step, frac }) });
      setA(an); setPlan(autoPlan(an)); setSel(0); setT(0); lastFreeze.current = null;
      setStage('edit');
    } catch (e) {
      if ((e as Error).message !== 'cancelled') setError((e as Error).message || String(e));
      setStage('pick');
    }
  };

  // ---------- edits ----------
  const update = (fn: (p: Plan) => Plan) => setPlan((p) => (p ? fn(p) : p));
  const seg = plan?.segments[Math.min(sel, (plan?.segments.length ?? 1) - 1)];
  const setSeg = (patch: Partial<Plan['segments'][number]>) => update((p) => ({ ...p, segments: p.segments.map((s, i) => (i === sel ? { ...s, ...patch } : s)) }));
  const splitHere = () => update((p) => {
    const s = p.segments[sel];
    if (!s || t <= s.t0 + 0.3 || t >= s.t1 - 0.3) return p;
    const segs = [...p.segments];
    segs.splice(sel, 1, { ...s, t1: +t.toFixed(3) }, { ...s, t0: +t.toFixed(3), look: LOOKS[(LOOKS.findIndex((l) => l.id === s.look) + 5) % (LOOKS.length - 1)].id });
    return { ...p, segments: segs };
  });
  const mergeNext = () => update((p) => {
    if (sel >= p.segments.length - 1) return p;
    const segs = [...p.segments];
    segs.splice(sel, 2, { ...segs[sel], t1: segs[sel + 1].t1 });
    return { ...p, segments: segs };
  });
  const addEvent = (kind: AuraEvent['kind'], style?: AuraEvent['style']) => update((p) => {
    const beat = a?.bpm ? 60 / a.bpm : 0.65;
    const e: AuraEvent = kind === 'freeze'
      ? { id: newId(), t: +t.toFixed(2), dur: +(beat * 2).toFixed(2), kind, text: '+1000 AURA' }
      : { id: newId(), t: +t.toFixed(2), dur: 1.3, kind, text: style === 'aura' ? '+500 AURA' : style === 'caption' ? 'your caption' : 'MAIN CHARACTER', style, y: style === 'impact' ? 0.74 : style === 'aura' ? 0.62 : 0.82 };
    return { ...p, events: [...p.events, e].sort((x, y) => x.t - y.t) };
  });
  const setEvent = (id: string, patch: Partial<AuraEvent>) => update((p) => ({ ...p, events: p.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  const delEvent = (id: string) => update((p) => ({ ...p, events: p.events.filter((e) => e.id !== id) }));

  // live thumbnails of every look on the current frame
  useEffect(() => {
    if (stage !== 'edit' || tab !== 'looks' || playing || !plan || !a) return;
    let alive = true;
    const id = setTimeout(() => {
      const v = videoRef.current;
      if (!v || v.readyState < 2) return;
      const r = (rendRef.current ||= new AuraRenderer());
      const c = document.createElement('canvas'); c.width = 90; c.height = 160;
      const g = c.getContext('2d')!;
      const out: Record<string, string> = {};
      for (const L of LOOKS) {
        if (!alive) return;
        const p2 = { ...plan, events: [], segments: plan.segments.map((s, i) => (i === sel ? { ...s, look: L.id } : s)) };
        const st = frameState(p2, a, v.currentTime, Math.round(v.currentTime * 30), null);
        r.render({ ...st.params, source: v, freeze: false, hold: false, flash: 0, rgb: 0 });
        g.drawImage(r.canvas, 0, 0, 90, 160);
        out[L.id] = c.toDataURL('image/jpeg', 0.75);
      }
      if (alive) { setThumbs(out); draw(v.currentTime); }
    }, 250);
    return () => { alive = false; clearTimeout(id); };
  }, [stage, tab, sel, playing, a, plan?.segments.length, seg?.frame]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- export ----------
  const exportVideo = async () => {
    const v = videoRef.current;
    if (!v || !a || !file) return;
    if (!canExportFrames()) return recordRealtime();
    v.pause(); setPlaying(false); setResult(null); setError('');
    exportRef.current = { cancelled: false, busy: true };
    lastFreeze.current = null;
    setExporting(0);
    try {
      const r = await exportFrames({
        duration: a.duration, fps: 30, width: OUT_W, height: OUT_H, audio: file, signal: exportRef.current,
        onProgress: (f) => setExporting(f),
        renderAt: async (time) => {
          if (Math.abs(v.currentTime - time) > 0.0005) {
            const seeked = new Promise((res) => v.addEventListener('seeked', res, { once: true }));
            v.currentTime = time;
            await seeked;
          }
          draw(time);
          return outRef.current!;
        },
      });
      const name = `${file.name.replace(/\.[^.]+$/, '')}-aura.mp4`;
      setResult({ url: URL.createObjectURL(r.blob), name, size: r.blob.size, type: `video/mp4; ${r.codec}; ${r.audio}` });
    } catch (e) {
      if ((e as Error).message !== 'cancelled') { console.warn('frame export failed, recording instead', e); exportRef.current.busy = false; setExporting(null); return recordRealtime(); }
    } finally { exportRef.current.busy = false; setExporting(null); }
    seekTo(0);
  };

  const recordRealtime = async () => {
    const v = videoRef.current, out = outRef.current;
    if (!v || !out || !a) return;
    const mime = pickMime();
    if (!mime || !('captureStream' in out)) { setError('This browser cannot record video. Try Chrome, Edge or Safari on a computer.'); return; }
    if (!v.paused) v.pause();
    setPlaying(false); setResult(null); setError('');
    if (!audioRef.current) {
      const ac = new AudioContext();
      const src = ac.createMediaElementSource(v);
      const dest = ac.createMediaStreamDestination();
      src.connect(dest); src.connect(ac.destination);
      audioRef.current = { ac, dest };
    }
    await audioRef.current.ac.resume();
    const stream = (out as HTMLCanvasElement & { captureStream: (fps: number) => MediaStream }).captureStream(30);
    audioRef.current.dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 14_000_000, audioBitsPerSecond: 192_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const stopped = new Promise<void>((res) => (rec.onstop = () => res()));
    v.currentTime = 0;
    await new Promise((res) => v.addEventListener('seeked', res, { once: true }));
    lastFreeze.current = null;
    draw(0);
    setExporting(0);
    rec.start(500);
    await v.play();
    await new Promise<void>((res) => {
      const step = () => {
        draw(v.currentTime);
        setExporting(v.currentTime / a.duration);
        if (v.ended || v.paused) { res(); return; }
        const rvfc = (v as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number }).requestVideoFrameCallback;
        if (rvfc) rvfc.call(v, step); else requestAnimationFrame(step);
      };
      step();
    });
    rec.stop();
    await stopped;
    stream.getVideoTracks().forEach((tr) => tr.stop());
    const type = mime.split(';')[0];
    const blob = new Blob(chunks, { type });
    const name = `${(file?.name || 'aura').replace(/\.[^.]+$/, '')}-aura.${type.includes('mp4') ? 'mp4' : 'webm'}`;
    setResult({ url: URL.createObjectURL(blob), name, size: blob.size, type: mime });
    setExporting(null);
    seekTo(0);
  };

  const segStyle = useMemo(() => (s: Plan['segments'][number]) => {
    const L = lookOf(s.look);
    return { left: `${(s.t0 / (a?.duration || 1)) * 100}%`, width: `${((s.t1 - s.t0) / (a?.duration || 1)) * 100}%`, background: `linear-gradient(135deg, ${L.swatch[0]}, ${L.swatch[1]})` };
  }, [a]);

  // ---------- views ----------
  return (
    <div className="af">
      <header className="af-top">
        <button className="af-exit" onClick={onExit}>← Exit</button>
        <div className="af-brand"><b>Aura FX</b><em>beat-synced aura edits, right in your browser</em></div>
        {stage === 'edit' && (
          <div className="af-topbtns">
            <button className="af-ghost" onClick={() => { videoRef.current?.pause(); setPlaying(false); setStage('pick'); }}>New video</button>
            <button className="af-hot" disabled={exporting !== null} onClick={exportVideo}>⬇ Export video</button>
          </div>
        )}
      </header>

      {stage !== 'edit' && (
        <main className="af-intro">
          <section className="af-pitch">
            <h1>Drop in a clip. <span>Farm the aura.</span></h1>
            <p>Your video gets a vertical 9:16 reframe that follows the person, a different look on every cut and beat (golden and neon aura glows, thermal, comic halftone, sketch, VHS, glitch, matrix rain, god rays, lightning, embers, noir red and more), zoom punches and flashes locked to the music, freeze-frame cut-outs, captions and an aura meter. Then you edit any of it and export.</p>
            <p className="af-note">Everything runs on your device. The video is never uploaded.</p>
          </section>
          {stage === 'pick' ? (
            <section className="af-pick">
              <label className={`af-drop${drag ? ' over' : ''}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); choose(e.dataTransfer.files[0]); }}>
                <input type="file" accept="video/*" hidden onChange={(e) => choose(e.target.files?.[0])} />
                {file ? <span><b>{file.name}</b><br />{(file.size / 1e6).toFixed(1)} MB · choose another</span> : <span><b>Choose a video</b><br />or drop it here · MP4, MOV, WebM</span>}
              </label>
              {url && <video className="af-peek" src={url} muted playsInline controls />}
              <label className="af-check"><input type="checkbox" checked={findPerson} onChange={(e) => setFindPerson(e.target.checked)} /> Find the person (needed for aura glows and cut-outs; adds a minute or two)</label>
              <button className="af-hot af-go" disabled={!file} onClick={start}>✨ Make it aura</button>
              {error && <p className="af-err">{error}</p>}
            </section>
          ) : (
            <section className="af-pick">
              <div className="af-prog"><i style={{ width: `${Math.round(progress.frac * 100)}%` }} /></div>
              <p className="af-step">{progress.step || 'reading the video'}… {Math.round(progress.frac * 100)}%</p>
              <button className="af-ghost" onClick={() => { cancelRef.current.cancelled = true; }}>Cancel</button>
            </section>
          )}
        </main>
      )}

      <video ref={videoRef} src={url || undefined} playsInline preload="auto" className="af-src" crossOrigin="anonymous" />

      {stage === 'edit' && plan && a && seg && (
        <main className="af-edit">
          <section className="af-left">
            <div className="af-phone"><canvas ref={outRef} width={OUT_W} height={OUT_H} onClick={togglePlay} /></div>
            <div className="af-transport">
              <button className="af-play" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : '▶'}</button>
              <input type="range" min={0} max={a.duration} step={0.01} value={t} onChange={(e) => { videoRef.current?.pause(); setPlaying(false); seekTo(+e.target.value); }} aria-label="Position" />
              <span>{fmt(t)} / {fmt(a.duration)}</span>
            </div>
            <div className="af-timeline" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seekTo(((e.clientX - r.left) / r.width) * a.duration); }}>
              {plan.segments.map((s, i) => <div key={i} className={`af-seg${i === sel ? ' on' : ''}`} style={segStyle(s)} title={`${lookOf(s.look).name} · ${fmt(s.t0)}–${fmt(s.t1)}`} />)}
              {a.downbeats.map((d) => <i key={d} className="af-db" style={{ left: `${(d / a.duration) * 100}%` }} />)}
              {plan.events.map((e) => <b key={e.id} className={`af-ev ${e.kind}`} style={{ left: `${(e.t / a.duration) * 100}%` }}>{e.kind === 'freeze' ? '★' : 'T'}</b>)}
              <span className="af-head" style={{ left: `${(t / a.duration) * 100}%` }} />
            </div>
            <p className="af-meta">{a.bpm ? `${a.bpm} BPM` : 'no beat found'} · {a.shots.length} shots · {a.masks ? 'person found' : 'no person mask'} · {plan.segments.length} looks</p>
          </section>

          <section className="af-panel">
            <nav className="af-tabs">
              {(['looks', 'text', 'style'] as const).map((k) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{{ looks: 'Looks', text: 'Text & freezes', style: 'Beat & style' }[k]}</button>)}
            </nav>
            {tab === 'looks' && (
              <div className="af-pane">
                <div className="af-seghead">
                  <button onClick={() => { const n = Math.max(0, sel - 1); setSel(n); seekTo(plan.segments[n].t0 + 0.05); }} aria-label="Previous segment">‹</button>
                  <div><b>Segment {sel + 1} of {plan.segments.length}</b><span>{fmt(seg.t0)} – {fmt(seg.t1)} · {lookOf(seg.look).name}</span></div>
                  <button onClick={() => { const n = Math.min(plan.segments.length - 1, sel + 1); setSel(n); seekTo(plan.segments[n].t0 + 0.05); }} aria-label="Next segment">›</button>
                </div>
                <div className="af-looks">
                  {LOOKS.map((L) => (
                    <button key={L.id} className={`af-look${seg.look === L.id ? ' on' : ''}`} onClick={() => setSeg({ look: L.id })} title={L.name}>
                      <span style={{ backgroundImage: thumbs[L.id] ? `url(${thumbs[L.id]})` : `linear-gradient(135deg, ${L.swatch[0]}, ${L.swatch[1]})` }} />
                      <em>{L.name}{L.mask && !a.masks ? ' *' : ''}</em>
                    </button>
                  ))}
                </div>
                <div className="af-row">
                  <div className="af-seg2"><button className={seg.frame === 'crop' ? 'on' : ''} onClick={() => setSeg({ frame: 'crop' })}>Follow person</button><button className={seg.frame === 'fit' ? 'on' : ''} onClick={() => setSeg({ frame: 'fit' })}>Whole frame</button></div>
                  <label className="af-check"><input type="checkbox" checked={seg.shake !== false} onChange={(e) => setSeg({ shake: e.target.checked })} /> shake</label>
                  <label className="af-check"><input type="checkbox" checked={!!seg.letterbox} onChange={(e) => setSeg({ letterbox: e.target.checked })} /> cinema bars</label>
                </div>
                <div className="af-row">
                  <button className="af-ghost" onClick={splitHere}>✂ Split at {fmt(t)}</button>
                  <button className="af-ghost" onClick={mergeNext} disabled={sel >= plan.segments.length - 1}>Merge with next</button>
                </div>
                {!a.masks && <p className="af-hint">* Aura glows look best with “Find the person” on; without it they glow around the centre.</p>}
              </div>
            )}
            {tab === 'text' && (
              <div className="af-pane">
                <div className="af-row">
                  <button className="af-ghost" onClick={() => addEvent('text', 'impact')}>＋ Big text</button>
                  <button className="af-ghost" onClick={() => addEvent('text', 'aura')}>＋ Aura pop</button>
                  <button className="af-ghost" onClick={() => addEvent('text', 'caption')}>＋ Caption</button>
                  <button className="af-ghost" onClick={() => addEvent('freeze')}>★ Freeze here</button>
                </div>
                <p className="af-hint">New items go at the playhead ({fmt(t)}). Use a new line in big text to stack words.</p>
                <ul className="af-events">
                  {plan.events.map((e) => (
                    <li key={e.id}>
                      <button className="af-jump" onClick={() => seekTo(e.t + 0.02)}>{fmt(e.t)}</button>
                      <span className={`af-kind ${e.kind}`}>{e.kind === 'freeze' ? 'freeze' : e.style}</span>
                      <textarea rows={e.text.includes('\n') ? 2 : 1} value={e.text} onChange={(ev) => setEvent(e.id, { text: ev.target.value })} />
                      <label>for <input type="number" min={0.3} max={10} step={0.1} value={e.dur} onChange={(ev) => setEvent(e.id, { dur: Math.max(0.3, +ev.target.value) })} />s</label>
                      <button className="af-x" onClick={() => delEvent(e.id)} aria-label="Delete">✕</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {tab === 'style' && (
              <div className="af-pane">
                <label className="af-slider">Beat punch <input type="range" min={0} max={0.1} step={0.005} value={plan.punch} onChange={(e) => update((p) => ({ ...p, punch: +e.target.value }))} /></label>
                <label className="af-slider">Downbeat punch <input type="range" min={0} max={0.25} step={0.01} value={plan.downbeatPunch} onChange={(e) => update((p) => ({ ...p, downbeatPunch: +e.target.value }))} /></label>
                <label className="af-check"><input type="checkbox" checked={plan.flashCuts} onChange={(e) => update((p) => ({ ...p, flashCuts: e.target.checked }))} /> Flash on cuts</label>
                <label className="af-check"><input type="checkbox" checked={plan.shake} onChange={(e) => update((p) => ({ ...p, shake: e.target.checked }))} /> Shake on hits</label>
                <label className="af-check"><input type="checkbox" checked={plan.meter} onChange={(e) => update((p) => ({ ...p, meter: e.target.checked }))} /> Aura meter</label>
                <div className="af-row">
                  <button className="af-ghost" onClick={() => update(shuffleLooks)}>🎲 Shuffle all looks</button>
                  <button className="af-ghost" onClick={() => { if (confirm('Start the edit over from the automatic version?')) { setPlan(autoPlan(a, Math.floor(Math.random() * 20))); setSel(0); } }}>↺ Auto edit again</button>
                </div>
              </div>
            )}
            {exporting !== null && (
              <div className="af-export"><b>Exporting your edit… {Math.round(exporting * 100)}%</b><div className="af-prog"><i style={{ width: `${Math.round(exporting * 100)}%` }} /></div><p>{canExportFrames() ? 'Every frame is rendered and encoded on this device, so nothing is dropped. Keep this tab open.' : 'It plays through once in real time. Keep this tab open and visible.'}</p><button className="af-ghost" onClick={() => { exportRef.current.cancelled = true; }}>Cancel</button></div>
            )}
            {result && (
              <div className="af-result">
                <video src={result.url} controls playsInline />
                <a className="af-hot" href={result.url} download={result.name}>⬇ Download {result.name} ({(result.size / 1e6).toFixed(1)} MB)</a>
                {/opus/.test(result.type) && /avc1/.test(result.type) && <p className="af-hint">The sound is Opus because this browser has no AAC encoder. It plays almost everywhere; if an app refuses it, export from Chrome on Windows or Mac, Edge or Safari for AAC.</p>}
                {!/avc1/.test(result.type) && <p className="af-hint">This browser can't make H.264, so the video is {result.type.includes('webm') ? 'WebM' : 'VP9'}. Instagram plays H.264 MP4 best: export from Chrome, Edge or Safari.</p>}
              </div>
            )}
            {error && <p className="af-err">{error}</p>}
          </section>
        </main>
      )}
    </div>
  );
}
