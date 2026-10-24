// Archival photo search across open collections. Every result carries its
// licence and source so the credits can be written for you.
//
// Providers (no keys needed): Wikimedia Commons, Openverse, Library of Congress,
// The Met, Art Institute of Chicago, NASA. Results are normalised to
// { id, provider, title, date, creator, license, licenseUrl, thumb, full, source }.
import fs from 'node:fs';
import path from 'node:path';

const UA = 'ReelStudio/1.0 (local tool; collage explainer reels)';
const strip = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function json(url) {
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' }, signal: AbortSignal.timeout(20000) })
    .catch((e) => { throw new Error(`couldn't reach ${new URL(url).host} (${e.cause?.code || e.name})`); });
  if (!r.ok) throw new Error(`${new URL(url).host} answered ${r.status}`);
  return r.json();
}

// licences we accept without asking: public domain, CC0, CC BY, CC BY-SA
const OPEN = /(public domain|pd|cc0|cc[- ]by(?!-n)|cc[- ]by-sa|no known copyright|no restrictions)/i;

export const PROVIDERS = {
  async wikimedia(q, n) {
    const u = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=${n}&gsrsearch=${encodeURIComponent(q + ' filetype:bitmap')}&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=900`;
    const j = await json(u);
    return Object.values(j.query?.pages || {}).map((p) => {
      const ii = p.imageinfo?.[0] || {}, m = ii.extmetadata || {};
      return { id: `wm:${p.pageid}`, provider: 'Wikimedia Commons', title: strip(m.ObjectName?.value) || p.title.replace(/^File:|\.\w+$/g, ''), date: strip(m.DateTimeOriginal?.value).slice(0, 40), creator: strip(m.Artist?.value).slice(0, 80), license: strip(m.LicenseShortName?.value), licenseUrl: m.LicenseUrl?.value || '', thumb: ii.thumburl, full: ii.thumburl || ii.url, source: ii.descriptionurl };
    }).filter((x) => x.thumb && /jpe?g|png/i.test(x.full));
  },
  async openverse(q, n) {
    const j = await json(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license_type=commercial,modification&page_size=${n}`);
    return (j.results || []).map((r) => ({ id: `ov:${r.id}`, provider: `Openverse (${r.source || r.provider})`, title: r.title || q, date: '', creator: r.creator || '', license: r.license === 'pdm' ? 'Public domain' : r.license === 'cc0' ? 'CC0' : `CC ${r.license.toUpperCase()} ${r.license_version || ''}`.trim(), licenseUrl: r.license_url, thumb: r.thumbnail || r.url, full: r.url, source: r.foreign_landing_url }));
  },
  async loc(q, n) {
    const j = await json(`https://www.loc.gov/photos/?q=${encodeURIComponent(q)}&fo=json&c=${n}&fa=online-format:image`);
    return (j.results || []).filter((r) => r.image_url?.length).map((r) => ({ id: `loc:${r.id}`, provider: 'Library of Congress', title: strip(r.title), date: r.date || '', creator: (r.contributor || []).join(', '), license: 'Check rights (most LoC photos: no known restrictions)', licenseUrl: r.url, thumb: r.image_url[0], full: r.image_url[r.image_url.length - 1].replace(/#.*$/, ''), source: r.url }));
  },
  async met(q, n) {
    const s = await json(`https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=${encodeURIComponent(q)}`);
    const ids = (s.objectIDs || []).slice(0, Math.min(n, 12));
    const objs = await Promise.all(ids.map((id) => json(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`).catch(() => null)));
    return objs.filter((o) => o && o.isPublicDomain && o.primaryImageSmall).map((o) => ({ id: `met:${o.objectID}`, provider: 'The Met', title: o.title, date: o.objectDate, creator: o.artistDisplayName, license: 'CC0 (Met Open Access)', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', thumb: o.primaryImageSmall, full: o.primaryImage || o.primaryImageSmall, source: o.objectURL }));
  },
  async aic(q, n) {
    const j = await json(`https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(q)}&limit=${n}&fields=id,title,image_id,artist_display,date_display,is_public_domain`);
    const iiif = j.config?.iiif_url || 'https://www.artic.edu/iiif/2';
    return (j.data || []).filter((a) => a.image_id && a.is_public_domain).map((a) => ({ id: `aic:${a.id}`, provider: 'Art Institute of Chicago', title: a.title, date: a.date_display, creator: (a.artist_display || '').split('\n')[0], license: 'CC0 (public domain)', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', thumb: `${iiif}/${a.image_id}/full/400,/0/default.jpg`, full: `${iiif}/${a.image_id}/full/1200,/0/default.jpg`, source: `https://www.artic.edu/artworks/${a.id}` }));
  },
  async nasa(q, n) {
    const j = await json(`https://images-api.nasa.gov/search?media_type=image&q=${encodeURIComponent(q)}`);
    return (j.collection?.items || []).slice(0, n).map((it) => { const d = it.data?.[0] || {}; const href = it.links?.[0]?.href; return { id: `nasa:${d.nasa_id}`, provider: 'NASA', title: d.title, date: (d.date_created || '').slice(0, 10), creator: d.photographer || d.center || 'NASA', license: 'NASA media (generally not copyrighted)', licenseUrl: 'https://www.nasa.gov/nasa-brand-center/images-and-media/', thumb: href, full: href?.replace(/~thumb\./, '~medium.'), source: `https://images.nasa.gov/details/${d.nasa_id}` }; }).filter((x) => x.thumb);
  },
};

export async function search(q, { providers = Object.keys(PROVIDERS), per = 12 } = {}) {
  const settled = await Promise.allSettled(providers.map((p) => PROVIDERS[p](q, per).then((r) => r.map((x) => ({ ...x, open: OPEN.test(x.license) || /Library of Congress|NASA/.test(x.provider) })))));
  const results = [], errors = [];
  settled.forEach((s, i) => (s.status === 'fulfilled' ? results.push(...s.value) : errors.push(`${providers[i]}: ${s.reason?.message || s.reason}`)));
  // interleave providers so the first screen is varied
  const by = {};
  results.forEach((r) => (by[r.provider] ||= []).push(r));
  const mixed = [];
  for (let k = 0; mixed.length < results.length; k++) for (const list of Object.values(by)) if (list[k]) mixed.push(list[k]);
  return { results: mixed, errors };
}

// download a chosen photo into the project's media folder and record its credit
export async function download(photo, mediaDir) {
  fs.mkdirSync(mediaDir, { recursive: true });
  const r = await fetch(photo.full || photo.thumb, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`download failed: ${r.status}`);
  const type = r.headers.get('content-type') || '';
  const ext = /png/.test(type) ? '.png' : /webp/.test(type) ? '.webp' : '.jpg';
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > 25e6) throw new Error('image too large');
  const name = `${photo.id.replace(/[^a-z0-9]+/gi, '-').slice(0, 60)}${ext}`;
  fs.writeFileSync(path.join(mediaDir, name), buf);
  return { file: name, credit: credit(photo) };
}

export function credit(p) {
  return { file: p.file, title: p.title, creator: p.creator, date: p.date, provider: p.provider, license: p.license, licenseUrl: p.licenseUrl, source: p.source };
}
