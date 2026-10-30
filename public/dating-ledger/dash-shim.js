/* A small stand-in for the claude.ai Dashboard runtime, so the tracker's page
   runs on this site unchanged: datasets come from ./data/<id>.json. */
(() => {
  const IDS = ['us_usage', 'how_met', 'app_payers', 'uk_apps', 'society', 'marriages', 'findings', 'timeline', 'tracker_log'];
  const store = Object.fromEntries(IDS.map((id) => [id, { status: 'loading', data: [] }]));
  const calcs = {}, draws = {}, onData = [];
  let params = {};
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const data = (id) => {
    if (calcs[id]) {
      const ins = calcs[id].inputs.map(data);
      if (ins.some((d) => d.status === 'error')) return { status: 'error', data: [] };
      if (!ins.every((d) => d.status === 'ok')) return { status: 'loading', data: [] };
      try { return { status: 'ok', data: calcs[id].fn(...ins.map((d) => d.data)) }; } catch (e) { console.error(e); return { status: 'error', data: [] }; }
    }
    return store[id] || { status: 'missing', data: [] };
  };
  const redraw = () => {
    dash.colors = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => css('--dl-s' + i));
    onData.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    Object.entries(draws).forEach(([name, fn]) => document.querySelectorAll(`[data-draw="${name}"]`).forEach((el) => {
      try { fn(el); } catch (e) { console.error(e); }
    }));
  };
  window.dash = {
    colors: [],
    data,
    calc(id, o) { calcs[id] = o; },
    loader() {},
    refresh() {},
    draw(name, fn) { draws[name] = fn; },
    onData(fn) { onData.push(fn); try { fn(); } catch (e) { console.error(e); } },
    params: () => ({ ...params }),
    setParams(p) { Object.entries(p).forEach(([k, v]) => (v == null ? delete params[k] : (params[k] = v))); redraw(); },
    resetParams() { params = {}; redraw(); },
    setLink(id) { try { history.replaceState(null, '', '#' + id); } catch { /* framed: fine */ } },
  };
  Promise.all(IDS.map((id) => fetch(`data/${id}.json`).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((d) => { store[id] = { status: 'ok', data: d }; }, () => { store[id] = { status: 'error', data: [] }; })))
    .then(redraw);
  document.addEventListener('DOMContentLoaded', redraw);
  let w = innerWidth, t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { if (Math.abs(innerWidth - w) > 20) { w = innerWidth; redraw(); } }, 200); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', redraw);
})();
