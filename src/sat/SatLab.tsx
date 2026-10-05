import { useEffect, useMemo, useRef, useState } from 'react';
import { BY_ID, CATALOG, SLOTS, type Comp, type Slot } from './catalog';
import { LAUNCHERS, MISSIONS, SITES, STATIONS, capacity } from './missions';
import { ALT_RANGE, analyse, defaultDesign, fmt, gbFmt, money, pointFmt, type Analysis, type Design, type Status } from './analysis';
import { Scene3D, type View } from './scene';
import { COMMISSION, apogeeBurn, commissionStep, decide, fmtT, newOps, satPos, step, sunDir, type Ops } from './ops';
import { ascentState, ascentTimeline, launchAzimuth, makePoll, travel, type PollItem } from './launch';
import { EDGES, EDGE_TEACH, LESSONS, NODES } from './learn';
import { DAY, period, vCirc } from './physics';

/**
 * ORBIT WORKS: design a satellite for a real kind of mission, check it the
 * way engineers do, launch it, and fly it through its first weeks in orbit.
 */

type Stage = 'mission' | 'build' | 'review' | 'launch' | 'ops' | 'learn';
const STAGES: { id: Stage; n: string; label: string }[] = [
  { id: 'mission', n: '1', label: 'Mission' },
  { id: 'build', n: '2', label: 'Build' },
  { id: 'review', n: '3', label: 'Review' },
  { id: 'launch', n: '4', label: 'Launch' },
  { id: 'ops', n: '5', label: 'Operate' },
  { id: 'learn', n: '?', label: 'How it works' },
];
const KEY = 'orbitworks-v1';
const ICON: Record<Status, string> = { ok: '✓', warn: '!', fail: '✕' };
const WARPS = [1, 10, 60, 300, 1200, 3600];

type LaunchState = { phase: 'poll' | 'count' | 'ascent' | 'done' | 'failed'; poll: PollItem[]; risk: number; t: number; delayH: number; note: string; fail?: string };

function loadDesign(): Design {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null') as Design | null;
    if (d && MISSIONS.some((m) => m.id === d.mission) && Array.isArray(d.parts)) return { ...defaultDesign(MISSIONS.find((m) => m.id === d.mission)!), ...d, parts: d.parts.filter((p) => BY_ID[p]) };
  } catch { /* storage may be unavailable */ }
  return defaultDesign(MISSIONS[0]);
}

export function SatLab({ onExit }: { onExit: () => void }) {
  const [stage, setStage] = useState<Stage>('mission');
  const [d, setD] = useState<Design>(loadDesign);
  const a = useMemo(() => analyse(d), [d]);
  const [view, setView] = useState<View>('bench');
  const [openSlot, setOpenSlot] = useState<Slot | null>('payload');
  const [info, setInfo] = useState<Comp | null>(null);
  const [lesson, setLesson] = useState(LESSONS[0].id);
  const [edge, setEdge] = useState<string | null>(null);
  const [warp, setWarp] = useState(60);
  const [paused, setPaused] = useState(false);
  const [, setTick] = useState(0);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene3D | null>(null);
  const opsRef = useRef<Ops | null>(null);
  const launchRef = useRef<LaunchState | null>(null);
  const live = useRef({ stage, warp, paused, d, a });
  live.current = { stage, warp, paused, d, a };

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* ignore */ } }, [d]);
  useEffect(() => {
    const ls = ['/fonts-guitar/fonts.css'].map((href) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); return l; });
    return () => ls.forEach((l) => l.remove());
  }, []);

  // the 3D view and the main loop
  useEffect(() => {
    const cv = cvRef.current!;
    const sc = new Scene3D(cv);
    sceneRef.current = sc;
    const fit = () => sc.resize(cv.clientWidth, cv.clientHeight, Math.min(window.devicePixelRatio || 1, 1.75));
    fit();
    const ro = new ResizeObserver(fit); ro.observe(cv);
    let raf = 0, last = performance.now(), t = 0, uiT = 0, orbitT = 0, alive = true;
    const loop = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt;
      const L = live.current;
      const ops = opsRef.current, ls = launchRef.current;
      let pos = null as ReturnType<typeof satPos> | null;
      let launchV: Parameters<Scene3D['update']>[0]['launch'] = null;
      const gmstBase = (t * 0.02) % (Math.PI * 2);
      let gmst = gmstBase, sun: [number, number, number] = [0.8, 0.5, 0.2];
      if (L.stage === 'ops' && ops) {
        if (!L.paused) step(ops, dt * L.warp, { d: L.d, a: L.a, earth: sc.maps });
        pos = satPos(ops); gmst = ops.gmst; sun = sunDir(ops);
        orbitT -= dt;
        if (orbitT <= 0) { orbitT = 1; sc.setOrbit(ops); }
      }
      if (L.stage === 'launch' && ls && (ls.phase === 'ascent' || ls.phase === 'count')) {
        const site = L.a.site;
        if (ls.phase === 'count') { ls.t += dt; if (ls.t >= 0) { ls.phase = 'ascent'; } }
        else ls.t += dt * (ls.t < 200 ? 6 : 40);
        const tl = ascentTimeline(L.a);
        const sep = tl[tl.length - 1].t;
        const st = ascentState(L.a, Math.max(0, ls.t), tl);
        const inc = L.a.mission.orbit.kind === 'GEO' ? Math.abs(site.lat) : L.a.inc;
        const az = L.a.mission.orbit.inc === 'sso' ? 196 : launchAzimuth(Math.max(inc, Math.abs(site.lat)), site.lat);
        const trail: { lat: number; lon: number; alt: number }[] = [];
        // the trail stops at separation, so it never wraps round the globe
        const tEnd = Math.min(Math.max(0, ls.t), sep);
        for (let k = 0; k <= 120; k++) { const s2 = ascentState(L.a, (tEnd * k) / 120, tl); const g = travel(site.lat, site.lon, az, s2.down); trail.push({ ...g, alt: s2.alt }); }
        const here = trail[trail.length - 1];
        launchV = { lat: here.lat, lon: here.lon, alt: st.alt, trail, flame: ls.t < tl.find((e) => e.name === 'Second-stage cut-off')!.t ? 1 : 0 };
        gmst = 0;
        if (ls.phase === 'ascent' && ls.fail === undefined && ls.t > 60 && Math.random() < ls.risk * dt * 0.02) {
          ls.phase = 'failed';
          ls.fail = ls.risk > 0.05 ? 'The vehicle broke up after a waived launch rule. Investigators will look at that decision first.' : 'An anomaly in the second stage ended the flight. Even the best rockets fail a few percent of the time.';
        }
        if (ls.t >= sep && ls.phase === 'ascent') ls.phase = 'done';
      }
      sc.update({ t, dt, gmst, sun, pos, deploy: L.stage === 'ops' && ops ? ops.deploy : L.stage === 'launch' ? 0 : 1, tumbling: !!ops && ops.mode === 'tumbling', firing: ops?.firing ?? 0, inView: ops?.stationsInView ?? [], launch: launchV });
      uiT -= dt;
      if (uiT <= 0) { uiT = 0.2; setTick((x) => x + 1); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    (window as unknown as { __sat?: unknown }).__sat = { scene: sc, ops: () => opsRef.current, launch: () => launchRef.current, stop: () => { alive = false; cancelAnimationFrame(raf); } };
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); sc.dispose(); };
  }, []);

  // rebuild the model when the design changes
  useEffect(() => { sceneRef.current?.setDesign(a.parts, d.radiator); }, [a.parts, d.radiator]);
  useEffect(() => { sceneRef.current?.setView(view); }, [view]);
  useEffect(() => { sceneRef.current?.setStations(d.stations); sceneRef.current?.setSite(a.site.lat, a.site.lon); }, [d.stations, a.site]);
  useEffect(() => {
    // each stage has a sensible default view
    if (stage === 'mission' || stage === 'build' || stage === 'review') setView('bench');
    if (stage === 'launch') { setView('orbit'); setTimeout(() => sceneRef.current?.lookAtSite(a.site.lat, a.site.lon, 0, 2.4), 0); }
    if (stage === 'ops') setView(opsRef.current && opsRef.current.t > 0 ? 'orbit' : 'follow');
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const m = a.mission;
  const busClass = a.bus?.busClass ?? 0;
  const setMission = (id: string) => { const mm = MISSIONS.find((x) => x.id === id)!; setD(defaultDesign(mm)); opsRef.current = null; launchRef.current = null; };
  const toggle = (c: Comp) => setD((prev) => {
    const slot = SLOTS.find((s) => s.id === c.slot)!;
    let parts = prev.parts;
    if (parts.includes(c.id)) parts = parts.filter((p) => p !== c.id);
    else if (slot.multi) parts = [...parts, c.id];
    else parts = [...parts.filter((p) => BY_ID[p]?.slot !== c.slot), c.id];
    let prop = prev.prop;
    if (c.slot === 'propulsion') prop = parts.includes(c.id) ? Math.min(prev.prop || (c.maxProp ?? 0) * 0.3, c.maxProp ?? 0) : 0;
    return { ...prev, parts, prop };
  });
  const fitsReason = (c: Comp) => (c.slot !== 'bus' && c.minBus > busClass ? 'Too big for this bus' : c.slot !== 'bus' && c.maxBus !== undefined && c.maxBus < busClass ? 'Made for smaller satellites' : null);

  /* ---------------- stages ---------------- */

  const missionPanel = (
    <div className="ow-pane">
      <h2>Choose a mission</h2>
      <p className="ow-lead">Every satellite starts with a job. Pick one; each is modelled on real programmes, with the orbit and requirements they use.</p>
      <div className="ow-missions">
        {MISSIONS.map((mm) => (
          <button key={mm.id} className={`ow-mission ${mm.id === d.mission ? 'on' : ''}`} onClick={() => setMission(mm.id)}>
            <b>{mm.name}</b>
            <span>{mm.tagline}</span>
            <small>{mm.orbit.kind} · {mm.orbit.alt.toLocaleString('en-US')} km · {mm.lifeYears} yr · ${money(mm.budget)}M</small>
          </button>
        ))}
      </div>
      <section className="ow-card">
        <h3>{m.name}</h3>
        <p className="ow-inspired"><b>Real-world counterparts:</b> {m.inspired}</p>
        {m.story.map((p, i) => <p key={i}>{p}</p>)}
        <dl className="ow-req">
          <div><dt>Orbit</dt><dd>{m.orbit.kind}, {fmt(d.alt)} km, {fmt(a.inc)}°</dd></div>
          <div><dt>Delivered to</dt><dd>{m.insertion.kind === 'gto' ? 'GTO (250 × 35,786 km)' : m.insertion.kind === 'low' ? `${m.insertion.alt} km, then climbs` : m.insertion.kind === 'meo' ? 'MEO transfer' : 'the final orbit'}</dd></div>
          <div><dt>Lifetime</dt><dd>{m.lifeYears} years</dd></div>
          <div><dt>Pointing</dt><dd>{pointFmt(m.pointing)}</dd></div>
          {m.dataGBday > 0 && <div><dt>Data</dt><dd>{gbFmt(m.dataGBday)}/day</dd></div>}
          <div><dt>Budget</dt><dd>${money(m.budget)}M{m.batch ? ` per satellite (${m.batch} per launch)` : ''}</dd></div>
          <div className="ow-wide"><dt>Operations goal</dt><dd>{m.opsGoal}</dd></div>
        </dl>
      </section>
      <section className="ow-card">
        <h3>Orbit and ground segment</h3>
        {ALT_RANGE[m.id][0] !== ALT_RANGE[m.id][1] && (
          <label className="ow-slider">
            <span>Altitude <b>{fmt(d.alt)} km</b></span>
            <input type="range" min={ALT_RANGE[m.id][0]} max={ALT_RANGE[m.id][1]} step={m.orbit.kind === 'MEO' ? 100 : 10} value={d.alt} onChange={(e) => setD({ ...d, alt: +e.target.value })} />
            <small>Period {fmt(period(d.alt) / 60)} min · speed {vCirc(d.alt).toFixed(2)} km/s · longest eclipse {fmt(a.eclS / 60)} min{m.orbit.inc === 'sso' ? ` · SSO inclination ${a.inc.toFixed(2)}°` : ''}</small>
          </label>
        )}
        <label className="ow-field"><span>Launch site</span>
          <select value={d.site} onChange={(e) => setD({ ...d, site: e.target.value })}>
            {SITES.map((s) => <option key={s.id} value={s.id}>{s.name} ({Math.abs(s.lat).toFixed(1)}°{s.lat >= 0 ? 'N' : 'S'})</option>)}
          </select>
          <small>{a.site.note}</small>
        </label>
        <div className="ow-field"><span>Ground stations</span>
          <div className="ow-chips">
            {STATIONS.map((s) => (
              <button key={s.id} className={d.stations.includes(s.id) ? 'on' : ''} onClick={() => setD({ ...d, stations: d.stations.includes(s.id) ? d.stations.filter((x) => x !== s.id) : [...d.stations, s.id] })}>{s.name}</button>
            ))}
          </div>
          <small>{fmt(a.contact / 60)} minutes of contact a day with these stations.</small>
        </div>
      </section>
      <div className="ow-next"><button className="ow-btn" onClick={() => setStage('build')}>Build the satellite →</button></div>
    </div>
  );

  const budgets = (
    <div className="ow-budgets">
      <Meter label="Mass" v={a.wet} max={a.bus?.maxMass ?? 1} unit="kg" />
      <Meter label="Power" v={a.needSun} max={Math.max(1, a.gen)} unit="W" show={`${fmt(a.gen)} W made, ${fmt(a.needSun)} needed`} />
      <Meter label="Cost" v={a.cost} max={m.budget} unit="$M" show={`$${money(a.cost)}M of $${money(m.budget)}M`} />
      <div className="ow-verdict"><b className="fail">{a.fails}</b> failing · <b className="warn">{a.warns}</b> warnings</div>
    </div>
  );

  const buildPanel = (
    <div className="ow-pane">
      <h2>Build your satellite</h2>
      <p className="ow-lead">Open each subsystem and choose parts. The budgets above update as you go; tap ⓘ on any part to learn how it works.</p>
      <div className="ow-row">
        <button className="ow-btn ow-btn--ghost" onClick={() => setD(defaultDesign(m))}>Load the recommended build</button>
        <button className="ow-btn ow-btn--ghost" onClick={() => setD({ ...d, parts: d.parts.filter((p) => BY_ID[p]?.slot === 'bus'), prop: 0, radiator: 0 })}>Start from an empty bus</button>
      </div>
      {SLOTS.map((s) => {
        const chosen = a.parts.filter((c) => c.slot === s.id);
        const open = openSlot === s.id;
        return (
          <section key={s.id} className={`ow-slot ${open ? 'open' : ''}`}>
            <button className="ow-slot-head" onClick={() => setOpenSlot(open ? null : s.id)} aria-expanded={open}>
              <b>{s.name}</b>
              <span>{chosen.length ? chosen.map((c) => c.name).join(', ') : <em>none</em>}</span>
              <i aria-hidden="true">{open ? '−' : '+'}</i>
            </button>
            {open && (
              <div className="ow-slot-body">
                <p className="ow-what">{s.what}</p>
                <div className="ow-parts">
                  {CATALOG.filter((c) => c.slot === s.id && (s.id !== 'payload' || c.kind?.some((k) => m.payloadKinds.includes(k)))).map((c) => {
                    const why = fitsReason(c);
                    const on = d.parts.includes(c.id);
                    return (
                      <div key={c.id} className={`ow-part ${on ? 'on' : ''} ${why ? 'off' : ''}`}>
                        <button className="ow-part-main" onClick={() => !why && toggle(c)} disabled={!!why && !on}>
                          <b>{c.name}</b>
                          <span>{c.short}</span>
                          <small>{c.mass ? `${fmt(c.mass)} kg` : ''}{c.power ? ` · ${fmt(c.power)} W` : ''}{c.cost ? ` · $${money(c.cost)}M` : ''}{why ? ` · ${why}` : ''}</small>
                        </button>
                        <button className="ow-i" onClick={() => setInfo(c)} aria-label={`How ${c.name} works`}>ⓘ</button>
                      </div>
                    );
                  })}
                </div>
                {s.id === 'propulsion' && a.parts.some((c) => c.slot === 'propulsion' && c.prop !== 'none') && (
                  <label className="ow-slider">
                    <span>Propellant <b>{fmt(d.prop)} kg</b></span>
                    <input type="range" min={0} max={a.parts.find((c) => c.slot === 'propulsion')!.maxProp} step={a.parts.find((c) => c.slot === 'propulsion')!.maxProp! > 10 ? 1 : 0.01} value={d.prop} onChange={(e) => setD({ ...d, prop: +e.target.value })} />
                    <small>Gives {fmt(a.dvAvail)} m/s of Δv; the mission needs {fmt(a.dvRequired)} m/s.</small>
                  </label>
                )}
                {s.id === 'thermal' && (
                  <label className="ow-slider">
                    <span>Radiator area <b>{d.radiator.toFixed(d.radiator < 1 ? 2 : 1)} m²</b></span>
                    <input type="range" min={0} max={busClass <= 2 ? 0.1 : busClass === 3 ? 2 : busClass === 4 ? 12 : 45} step={busClass <= 2 ? 0.005 : 0.05} value={d.radiator} onChange={(e) => setD({ ...d, radiator: +e.target.value })} />
                    <small>Hot case {a.tHot.toFixed(0)} °C · cold case {a.tCold.toFixed(0)} °C{a.heaterNeed > 0.5 ? ` · heaters ${fmt(a.heaterNeed)} W` : ''}. Too little radiator overheats; too much needs heater power.</small>
                  </label>
                )}
              </div>
            )}
          </section>
        );
      })}
      <div className="ow-next"><button className="ow-btn" onClick={() => setStage('review')}>Design review →</button></div>
    </div>
  );

  const groups = Array.from(new Set(a.checks.map((c) => c.group)));
  const reviewPanel = (
    <div className="ow-pane">
      <h2>Design review</h2>
      <p className="ow-lead">The checks a real review board makes. {a.fails === 0 ? (a.warns === 0 ? 'Everything passes: you are ready for launch.' : 'No failures, a few warnings. You may launch, but read the warnings.') : `${a.fails} check${a.fails > 1 ? 's' : ''} failing: fix ${a.fails > 1 ? 'them' : 'it'} in Build, or launch at your own risk.`}</p>
      <section className="ow-card ow-facts">
        <h3>Your orbit</h3>
        <dl>
          <div><dt>Altitude</dt><dd>{fmt(a.h)} km</dd></div>
          <div><dt>Inclination</dt><dd>{a.inc.toFixed(2)}°</dd></div>
          <div><dt>Period</dt><dd>{a.h > 30000 ? `${(a.P / 3600).toFixed(2)} h` : `${fmt(a.P / 60)} min`}</dd></div>
          <div><dt>Speed</dt><dd>{vCirc(a.h).toFixed(2)} km/s</dd></div>
          <div><dt>Longest eclipse</dt><dd>{fmt(a.eclS / 60)} min</dd></div>
          <div><dt>Orbits per day</dt><dd>{(DAY / a.P).toFixed(2)}</dd></div>
          <div><dt>Plane drift (J2)</dt><dd>{a.raan.toFixed(3)}°/day</dd></div>
          <div><dt>Contact per day</dt><dd>{fmt(a.contact / 60)} min</dd></div>
        </dl>
      </section>
      {groups.map((g) => (
        <section key={g} className="ow-checks">
          <h3>{g}</h3>
          {a.checks.filter((c) => c.group === g).map((c) => (
            <details key={c.id} className={`ow-check ${c.status}`} open={c.status !== 'ok'}>
              <summary><i>{ICON[c.status]}</i><b>{c.title}</b><span>{c.value}</span></summary>
              <p><b>Requirement:</b> {c.need}</p>
              <p>{c.why}</p>
              {c.fix && <p className="ow-fix"><b>Fix:</b> {c.fix}</p>}
            </details>
          ))}
        </section>
      ))}
      <section className="ow-card">
        <h3>Budgets in detail</h3>
        <Table title="Power loads (orbit average)" rows={[...a.loads.map((l) => [l.name, `${fmt(l.w)} W`] as [string, string]), ['Total', `${fmt(a.load)} W`]]} />
        <Table title="Δv" rows={[...a.dvNeed.map((x) => [x.what, `${fmt(x.dv)} m/s`] as [string, string]), ['Required (+5%)', `${fmt(a.dvRequired)} m/s`], ['Available', `${fmt(a.dvAvail)} m/s`]]} />
        {a.link && <Table title="Main downlink budget (10° elevation)" rows={[['Slant range', `${fmt(a.link.range)} km`], ['EIRP', `${a.link.eirp.toFixed(1)} dBW`], ['Free-space loss', `−${a.link.fspl.toFixed(1)} dB`], ['Eb/N0 received', `${a.link.ebno.toFixed(1)} dB`], ['Needed', '4.5 dB'], ['Margin', `${a.link.margin.toFixed(1)} dB`]]} />}
        <Table title="Mass" rows={[...a.parts.filter((c) => c.mass > 0).map((c) => [c.name, `${fmt(c.mass)} kg`] as [string, string]), ['Radiators', `${fmt(d.radiator * (busClass <= 2 ? 1.5 : 4.5))} kg`], ['Harness (6%)', `${fmt(a.harness)} kg`], ['System margin (10%)', `${fmt(a.dry - a.compMass - a.harness)} kg`], ['Propellant', `${fmt(d.prop)} kg`], ['Launch mass', `${fmt(a.wet)} kg`]]} />
        <Table title="Cost" rows={[['Hardware', `$${money(a.hw)}M`], ['Integration & test', `$${money(a.ait)}M`], ['Launch', `$${money(a.launchCost)}M`], [`Operations (${m.lifeYears} yr)`, `$${money(a.ops)}M`], ['Total', `$${money(a.cost)}M`]]} />
      </section>
      <section className="ow-card">
        <h3>Choose a rocket</h3>
        <div className="ow-launchers">
          {LAUNCHERS.map((l) => {
            const cap = capacity(l, m);
            const ok = cap >= a.wet && (!l.cubesatOnly || busClass <= 2);
            return (
              <button key={l.id} className={`ow-launcher ${d.launcher === l.id ? 'on' : ''} ${ok ? '' : 'no'}`} onClick={() => setD({ ...d, launcher: l.id })}>
                <b>{l.name}</b><span>{l.example}</span>
                <small>{cap > 0 ? `${fmt(cap)} kg to this orbit` : 'cannot reach this orbit'} · ${money(m.batch && !l.cubesatOnly ? l.cost / m.batch : l.cost)}M{m.batch && !l.cubesatOnly ? ' per satellite' : ''} · {(l.rel * 100).toFixed(0)}% success</small>
                <em>{l.note}</em>
              </button>
            );
          })}
        </div>
      </section>
      <div className="ow-next">
        <button className={`ow-btn ${a.fails ? 'ow-btn--warn' : ''}`} onClick={() => { launchRef.current = { phase: 'poll', poll: makePoll(a), risk: 1 - a.launcher.rel + (a.fails ? 0.1 : 0), t: -10, delayH: 0, note: '' }; opsRef.current = null; setStage('launch'); }}>{a.fails ? 'Launch anyway →' : 'To the launch pad →'}</button>
      </div>
    </div>
  );

  const ls = launchRef.current;
  const tl = useMemo(() => ascentTimeline(a), [a]);
  const launchPanel = (
    <div className="ow-pane">
      <h2>Launch</h2>
      {!ls && <p className="ow-lead">Finish the design review first.</p>}
      {ls && ls.phase === 'poll' && (
        <>
          <p className="ow-lead">T−10 minutes at {a.site.name}. You are the launch director. Each console must call <b>go</b>.</p>
          <div className="ow-poll">
            {ls.poll.map((p, i) => (
              <div key={i} className={`ow-poll-row ${p.status}`}>
                <b>{p.who}</b><span>{p.status === 'go' ? 'GO' : 'HOLD'}</span><p>{p.text}</p>
                {p.issue && (
                  <div className="ow-issue">
                    <p>{p.issue.body}</p>
                    <p className="ow-teach">{p.issue.teach}</p>
                    <div className="ow-choices">
                      {p.issue.options.map((o) => (
                        <button key={o.label} className="ow-btn ow-btn--ghost" onClick={() => {
                          ls.risk += o.risk; ls.delayH += o.delayH; ls.note = o.result;
                          ls.poll = ls.poll.map((q, k) => (k === i ? { ...q, status: 'go', text: o.result, issue: undefined } : q));
                          setTick((x) => x + 1);
                        }}><b>{o.label}</b><small>{o.detail}</small></button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="ow-next">
            <button className="ow-btn" disabled={ls.poll.some((p) => p.status !== 'go')} onClick={() => { ls.phase = 'count'; ls.t = -10; setTick((x) => x + 1); }}>{ls.poll.some((p) => p.status !== 'go') ? 'Resolve the hold first' : 'All GO: start the terminal count'}</button>
          </div>
        </>
      )}
      {ls && (ls.phase === 'count' || ls.phase === 'ascent' || ls.phase === 'done' || ls.phase === 'failed') && (() => {
        const st = ascentState(a, Math.max(0, ls.t), tl);
        return (
          <>
            <div className="ow-telem">
              <div><span>Mission clock</span><b>{ls.t < 0 ? `T−${Math.ceil(-ls.t)} s` : `T+${Math.floor(ls.t / 60)}:${String(Math.floor(ls.t % 60)).padStart(2, '0')}`}</b></div>
              <div><span>Altitude</span><b>{fmt(st.alt)} km</b></div>
              <div><span>Speed</span><b>{(st.v * 1000).toFixed(0)} m/s</b></div>
              <div><span>Downrange</span><b>{fmt(st.down)} km</b></div>
            </div>
            <ol className="ow-timeline">
              {tl.map((e) => (
                <li key={e.name} className={ls.t >= e.t ? 'done' : ''}><b>{e.t < 60 ? `T+${e.t}s` : `T+${Math.floor(e.t / 60)}:${String(e.t % 60).padStart(2, '0')}`}</b> {e.name}{ls.t >= e.t && <p>{e.detail}</p>}</li>
              ))}
            </ol>
            {ls.phase === 'failed' && (
              <section className="ow-card ow-bad"><h3>Launch failure</h3><p>{ls.fail}</p><p>Real programmes often build a second flight unit for exactly this reason. Try again with the same design.</p>
                <button className="ow-btn" onClick={() => { launchRef.current = { phase: 'poll', poll: makePoll(a), risk: 1 - a.launcher.rel, t: -10, delayH: 0, note: '' }; setTick((x) => x + 1); }}>Build another and fly again</button></section>
            )}
            {ls.phase === 'done' && (
              <section className="ow-card ow-good"><h3>Separation!</h3><p>Your satellite is free. Telemetry should arrive at the first ground-station pass.</p>
                <button className="ow-btn" onClick={() => { opsRef.current = newOps(d, a); setStage('ops'); setView('follow'); setPaused(false); }}>Take control of the satellite →</button></section>
            )}
          </>
        );
      })()}
    </div>
  );

  const ops = opsRef.current;
  const opsPanel = !ops ? (
    <div className="ow-pane"><h2>Operate</h2><p className="ow-lead">Launch the satellite first: it needs to reach orbit before you can fly it.</p>
      <button className="ow-btn" onClick={() => { opsRef.current = newOps(d, a); setStage('ops'); setView('follow'); }}>Skip the launch and start in orbit</button></div>
  ) : (
    <div className="ow-pane">
      <h2>Mission control</h2>
      <div className="ow-phase"><b>{phaseName(ops.phase)}</b><span>{fmtT(ops.t)}</span></div>
      <p className="ow-lead">{phaseHelp(ops, a)}</p>
      <div className="ow-warp">
        <button className={`ow-btn ow-btn--ghost ${paused ? 'on' : ''}`} onClick={() => setPaused((p) => !p)}>{paused ? '▶ Run' : '❚❚ Pause'}</button>
        {WARPS.map((w) => <button key={w} className={warp === w ? 'on' : ''} onClick={() => setWarp(w)}>{w}×</button>)}
      </div>
      <div className="ow-tm">
        <Gauge label="Battery" v={ops.soc} text={`${(ops.soc * 100).toFixed(0)}%`} bad={ops.soc < 0.3} />
        <Gauge label="Solar / load" v={Math.min(1, ops.gen / Math.max(1, a.genBOL))} text={`${fmt(ops.gen)} / ${fmt(ops.load)} W`} />
        <Gauge label="Temperature" v={(ops.temp + 40) / 100} text={`${ops.temp.toFixed(0)} °C`} bad={ops.temp > 45 || ops.temp < -15} />
        <Gauge label="Recorder" v={a.parts.find((c) => c.slot === 'obc')?.gb ? ops.data / (a.parts.find((c) => c.slot === 'obc')!.gb!) : 0} text={gbFmt(ops.data)} bad={ops.lost > 0} />
        <Gauge label="Propellant" v={d.prop ? ops.prop / d.prop : 0} text={`${fmt(ops.prop)} kg`} />
        <Gauge label="Wheel momentum" v={ops.wheel} text={`${(ops.wheel * 100).toFixed(0)}%`} bad={ops.wheel > 0.8} />
      </div>
      <div className="ow-tm-text">
        <span>{ops.inSun ? '☀ Sunlit' : '● Eclipse'}</span>
        <span>{ops.contact ? `📡 ${ops.contact} (${ops.elev.toFixed(0)}°)` : 'No station in view'}</span>
        <span>{ops.apogee > ops.perigee + 50 ? `Orbit ${fmt(ops.perigee)} × ${fmt(ops.apogee)} km` : `Alt ${fmt(ops.alt)} km`}</span>
        <span>{ops.lat.toFixed(1)}°, {ops.lon.toFixed(1)}°</span>
        <span>Mode: {ops.mode}</span>
        <span>Delivered {gbFmt(ops.delivered)}</span>
      </div>
      {ops.phase === 'commission' && (
        <section className="ow-card">
          <h3>Commissioning checklist</h3>
          <p>You have contact. Work through the checks in order: each is a real commissioning activity.</p>
          {COMMISSION.map((c, i) => {
            const done = ops.commission.includes(c.id);
            const next = !done && ops.commission.length === i;
            return (
              <div key={c.id} className={`ow-step ${done ? 'done' : ''}`}>
                <button className="ow-btn ow-btn--ghost" disabled={!next} onClick={() => { commissionStep(ops, c.id, a); setTick((x) => x + 1); }}>{done ? '✓' : next ? 'Run' : '…'}</button>
                <div><b>{c.title}</b><p>{c.body}</p></div>
              </div>
            );
          })}
        </section>
      )}
      {ops.phase === 'transfer' && a.mission.insertion.kind === 'gto' && (
        <section className="ow-card">
          <h3>Climb to geostationary orbit</h3>
          <p>Fire the apogee engine three times, each at apogee, to raise the perigee and remove the {Math.abs(a.site.lat).toFixed(1)}° tilt left by the launch site.</p>
          <button className="ow-btn" onClick={() => { apogeeBurn(ops, a); setTick((x) => x + 1); }}>Fire apogee burn {ops.eventsSeen.filter((e) => e === 'burn').length + 1} of 3</button>
        </section>
      )}
      {(ops.phase === 'ops' || ops.phase === 'complete') && <Score ops={ops} a={a} />}
      {(ops.phase === 'lost') && <section className="ow-card ow-bad"><h3>Mission lost</h3><p>{ops.log[0]?.text}</p><p>Look back at the design review: which check was this?</p><button className="ow-btn" onClick={() => setStage('build')}>Back to the drawing board</button></section>}
      <section className="ow-log">
        <h3>Log</h3>
        <ul>{ops.log.slice(0, 40).map((l, i) => <li key={i} className={l.kind}><time>{fmtT(l.t)}</time>{l.text}</li>)}</ul>
      </section>
    </div>
  );

  const lessonObj = LESSONS.find((l) => l.id === lesson)!;
  const learnPanel = (
    <div className="ow-pane">
      <h2>How a satellite works</h2>
      <div className="ow-lessons">
        {LESSONS.map((l) => <button key={l.id} className={l.id === lesson ? 'on' : ''} onClick={() => setLesson(l.id)}>{l.title}</button>)}
      </div>
      <article className="ow-lesson">
        <span className="ow-kicker">{lessonObj.kicker}</span>
        <h3>{lessonObj.title}</h3>
        {lessonObj.paras.map((p, i) => <p key={i}>{p}</p>)}
        {lessonObj.numbers && <dl className="ow-nums">{lessonObj.numbers.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
        {lessonObj.fails && <><h4>How it fails</h4><ul>{lessonObj.fails.map((f) => <li key={f}>{f}</li>)}</ul></>}
        {lessonObj.real && <p className="ow-inspired">{lessonObj.real}</p>}
      </article>
      <section className="ow-card">
        <h3>How the parts connect</h3>
        <p>Tap a link to see what flows along it and why it matters.</p>
        <Diagram active={edge} onPick={setEdge} ops={ops} />
        {edge && <p className="ow-edge"><b>{EDGES.find((e) => `${e.from}-${e.to}` === edge)?.label}:</b> {EDGE_TEACH[edge]}</p>}
      </section>
    </div>
  );

  const decision = ops?.decision;
  return (
    <div className="ow-root">
      <header className="ow-top">
        <button className="ow-btn ow-btn--ghost" onClick={onExit}>← Shelf</button>
        <div className="ow-brand"><b>Orbit Works</b><span>build · test · launch · fly</span></div>
        <nav className="ow-stages" aria-label="Steps">
          {STAGES.map((s) => <button key={s.id} className={stage === s.id ? 'on' : ''} onClick={() => setStage(s.id)}><i>{s.n}</i>{s.label}</button>)}
        </nav>
      </header>
      <main className="ow-main">
        <aside className="ow-side">
          {(stage === 'build' || stage === 'review') && budgets}
          {stage === 'mission' && missionPanel}
          {stage === 'build' && buildPanel}
          {stage === 'review' && reviewPanel}
          {stage === 'launch' && launchPanel}
          {stage === 'ops' && opsPanel}
          {stage === 'learn' && learnPanel}
        </aside>
        <section className="ow-stage3d">
          <canvas ref={cvRef} className="ow-canvas" />
          <div className="ow-views">
            {(['bench', 'follow', 'orbit'] as View[]).map((v) => <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)} disabled={v !== 'bench' && stage !== 'ops' && stage !== 'launch'}>{v === 'bench' ? 'Satellite' : v === 'follow' ? 'Follow' : 'Whole orbit'}</button>)}
          </div>
          {stage === 'ops' && ops && <Diagram mini active={null} onPick={() => {}} ops={ops} />}
          {view === 'bench' && <div className="ow-label">{a.bus?.name ?? 'No bus'} · {fmt(a.wet)} kg · {a.parts.length} parts · drag to turn</div>}
        </section>
      </main>
      {info && (
        <div className="ow-modal" role="dialog" aria-label={info.name} onClick={() => setInfo(null)}>
          <div className="ow-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="ow-x" onClick={() => setInfo(null)} aria-label="Close">×</button>
            <span className="ow-kicker">{SLOTS.find((s) => s.id === info.slot)?.name}</span>
            <h3>{info.name}</h3>
            <p className="ow-short">{info.short}</p>
            <h4>How it works</h4><p>{info.how}</p>
            <h4>How it interacts</h4><p>{info.links}</p>
            <dl className="ow-nums">
              {info.mass > 0 && <div><dt>Mass</dt><dd>{fmt(info.mass)} kg</dd></div>}
              {info.power > 0 && <div><dt>Power</dt><dd>{fmt(info.power)} W</dd></div>}
              {info.cost > 0 && <div><dt>Cost</dt><dd>${money(info.cost)}M</dd></div>}
              <div><dt>5-year reliability</dt><dd>{(info.rel * 100).toFixed(1)}%</dd></div>
              {info.isp ? <div><dt>Isp</dt><dd>{info.isp} s</dd></div> : null}
              {info.mbps ? <div><dt>Data rate</dt><dd>{info.mbps >= 1 ? `${fmt(info.mbps)} Mbps` : `${(info.mbps * 1000).toFixed(1)} kbps`}</dd></div> : null}
              {info.acc ? <div><dt>Accuracy</dt><dd>{pointFmt(info.acc)}</dd></div> : null}
              {info.wh ? <div><dt>Energy</dt><dd>{fmt(info.wh)} Wh</dd></div> : null}
              {info.krad ? <div><dt>Radiation tolerance</dt><dd>{info.krad} krad</dd></div> : null}
            </dl>
          </div>
        </div>
      )}
      {decision && stage === 'ops' && (
        <div className="ow-modal">
          <div className="ow-modal-box ow-decision">
            <span className="ow-kicker">Decision needed · {fmtT(ops!.t)}</span>
            <h3>{decision.title}</h3>
            <p>{decision.body}</p>
            <p className="ow-teach">{decision.teach}</p>
            <div className="ow-choices">
              {decision.choices.map((c, i) => <button key={c.label} className="ow-btn ow-btn--ghost" onClick={() => { decide(ops!, i); setTick((x) => x + 1); }}><b>{c.label}</b><small>{c.detail}</small></button>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function phaseName(p: Ops['phase']) {
  return ({ separation: 'Separation', detumble: 'Detumbling', deploy: 'Deploying', acquire: 'Acquiring the Sun', contact: 'Waiting for first contact', commission: 'Commissioning', transfer: 'Orbit transfer', ops: 'Operations', safe: 'SAFE MODE', lost: 'Lost', complete: 'Mission complete' } as Record<string, string>)[p];
}

function phaseHelp(o: Ops, a: Analysis) {
  switch (o.phase) {
    case 'detumble': return `Stopping the tip-off spin (${o.rate.toFixed(2)}°/s). ${a.hasMtq ? 'Magnetorquers are pushing against Earth\'s field.' : ''} Speed up time to watch it settle.`;
    case 'deploy': return 'Burn wires fire and springs swing the arrays and antennas out.';
    case 'acquire': return 'Turning the arrays to face the Sun so the battery can charge.';
    case 'contact': return 'The satellite is alive but no one has heard it yet. It must reach a ground station in your network. Speed up time.';
    case 'commission': return 'First contact! Now check every subsystem before trusting it with the mission.';
    case 'transfer': return a.mission.insertion.kind === 'gto' ? 'In a transfer orbit. Command the apogee burns.' : 'Electric thrusters are slowly spiralling the orbit up. Use high time warp.';
    case 'ops': return `Operational. ${a.genGB > 0 ? 'Data flows to the ground at each pass.' : 'The payload is serving users.'} Anomalies will need your decisions.`;
    case 'safe': return 'The satellite has protected itself. It waits for a ground pass and your instructions.';
    case 'complete': return 'This campaign is complete. See your score.';
    case 'lost': return 'Contact has been lost.';
    default: return '';
  }
}

function Meter({ label, v, max, unit, show }: { label: string; v: number; max: number; unit: string; show?: string }) {
  const f = v / Math.max(1e-9, max);
  return (
    <div className={`ow-meter ${f > 1 ? 'fail' : f > 0.9 ? 'warn' : ''}`}>
      <span>{label}</span>
      <i><b style={{ width: `${Math.min(100, f * 100)}%` }} /></i>
      <small>{show ?? `${fmt(v)} / ${fmt(max)} ${unit}`}</small>
    </div>
  );
}

function Gauge({ label, v, text, bad }: { label: string; v: number; text: string; bad?: boolean }) {
  return (
    <div className={`ow-gauge ${bad ? 'bad' : ''}`}>
      <span>{label}</span>
      <i><b style={{ width: `${Math.max(0, Math.min(100, v * 100))}%` }} /></i>
      <small>{text}</small>
    </div>
  );
}

function Table({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <table className="ow-table">
      <caption>{title}</caption>
      <tbody>{rows.map(([k, v], i) => <tr key={i} className={i === rows.length - 1 ? 'total' : ''}><th>{k}</th><td>{v}</td></tr>)}</tbody>
    </table>
  );
}

function Score({ ops, a }: { ops: Ops; a: Analysis }) {
  const days = ops.score.opsTime / DAY;
  const avail = ops.score.opsTime > 0 ? ops.score.upTime / ops.score.opsTime : 0;
  const need = a.genGB * days;
  const dataScore = need > 0 ? Math.min(1, ops.delivered / need) : avail;
  const health = Object.values(ops.health).reduce((s, x) => s + x, 0) / 7;
  const total = Math.round((dataScore * 0.45 + avail * 0.35 + health * 0.2) * 100);
  return (
    <section className={`ow-card ${ops.phase === 'complete' ? 'ow-good' : ''}`}>
      <h3>{ops.phase === 'complete' ? `Campaign complete: ${total}/100` : `Mission score so far: ${total}/100`}</h3>
      <dl className="ow-nums">
        <div><dt>Days operating</dt><dd>{days.toFixed(1)} of {ops.missionDays}</dd></div>
        <div><dt>Availability</dt><dd>{(avail * 100).toFixed(0)}%</dd></div>
        {need > 0 && <div><dt>Data delivered</dt><dd>{gbFmt(ops.delivered)} of {gbFmt(need)} wanted</dd></div>}
        {ops.lost > 0 && <div><dt>Data lost</dt><dd>{gbFmt(ops.lost)}</dd></div>}
        <div><dt>Health</dt><dd>{(health * 100).toFixed(0)}%</dd></div>
        <div><dt>Δv used</dt><dd>{fmt(ops.dvUsed)} m/s</dd></div>
      </dl>
    </section>
  );
}

/** The interaction map, with live flows when a mission is running. */
function Diagram({ active, onPick, ops, mini }: { active: string | null; onPick: (e: string) => void; ops: Ops | null; mini?: boolean }) {
  const col: Record<string, string> = { power: '#f2c14e', data: '#66d1ff', command: '#b69cff', heat: '#ff7a59', force: '#9be38a' };
  const flowOn = (from: string, to: string) => {
    if (!ops) return true;
    if (from === 'sun') return ops.inSun;
    if (from === 'battery') return !ops.inSun;
    if (to === 'battery') return ops.inSun && ops.soc < 0.999;
    if (from === 'payload' || to === 'payload') return ops.payloadOn;
    if (to === 'ground' || from === 'ground' || (from === 'obc' && to === 'comms')) return !!ops.contact;
    if (from === 'prop' || to === 'prop') return ops.firing > 0.05;
    return true;
  };
  return (
    <svg className={`ow-diagram ${mini ? 'mini' : ''}`} viewBox="0 0 860 330" role="img" aria-label="How the subsystems connect">
      <defs>{Object.entries(col).map(([k, c]) => <marker key={k} id={`ar-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={c} /></marker>)}</defs>
      {EDGES.map((e, i) => {
        const A = NODES.find((n) => n.id === e.from)!, B = NODES.find((n) => n.id === e.to)!;
        const id = `${e.from}-${e.to}`;
        const on = flowOn(e.from, e.to);
        const back = EDGES.some((x) => x.from === e.to && x.to === e.from);
        const off = back ? (e.from < e.to ? 8 : -8) : 0;
        const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
        const nx = -dy / L * off, ny = dx / L * off;
        const x1 = A.x + dx / L * 48 + nx, y1 = A.y + dy / L * 22 + ny, x2 = B.x - dx / L * 52 + nx, y2 = B.y - dy / L * 24 + ny;
        return (
          <g key={i} className={`ow-edge-g ${active === id ? 'on' : ''}`} onClick={() => onPick(id)}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={16} />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col[e.kind]} strokeWidth={active === id ? 3.5 : 2} strokeOpacity={on ? 0.95 : 0.18} markerEnd={`url(#ar-${e.kind})`} className={on && ops ? 'flow' : ''} />
          </g>
        );
      })}
      {NODES.map((n) => (
        <g key={n.id} transform={`translate(${n.x},${n.y})`}>
          <rect x={-56} y={-20} width={112} height={40} rx={8} className="ow-node" />
          <text textAnchor="middle" dy="5">{n.label}</text>
        </g>
      ))}
      {!mini && Object.entries(col).map(([k, c], i) => <g key={k} transform={`translate(${30 + i * 120},318)`}><rect width={14} height={4} y={-6} fill={c} /><text x={20} className="ow-legend">{k}</text></g>)}
    </svg>
  );
}
