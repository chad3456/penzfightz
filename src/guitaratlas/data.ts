/**
 * Where guitars are made: the data behind the atlas.
 *
 * Every figure carries a source id (see SOURCES). Unit figures are what the
 * company or local government has said in public, not audited production
 * statistics. They are rounded, and flagged `approx` where the source gives a
 * daily rate or a range. Places without a published figure are still on the
 * map, drawn hollow, so absence of a number never reads as "small".
 */

export type Kind = 'electric' | 'acoustic' | 'classical';

export const KINDS: { id: Kind; label: string; glyph: string }[] = [
  { id: 'electric', label: 'Electric', glyph: 'E' },
  { id: 'acoustic', label: 'Steel-string acoustic', glyph: 'A' },
  { id: 'classical', label: 'Classical / nylon', glyph: 'C' },
];

export interface Source { id: string; title: string; url: string; year: string }

export const SOURCES: Source[] = [
  { id: 'cd-zhengan-2021', title: 'China Daily — "How remote county became world\'s guitar manufacturing hub"', url: 'https://www.chinadaily.com.cn/a/202112/02/WS61a7fa7ca310cdd39bc78c03.html', year: '2021' },
  { id: 'cd-zhengan-2026', title: 'China Daily — "China\'s guitar capital provides instruments for the world"', url: 'https://www.chinadaily.com.cn/a/202601/27/WS6978909ba310d6866eb36076.html', year: '2026' },
  { id: 'eguizhou-2022', title: 'eGuizhou — "World\'s biggest guitar-maker: How does Zheng\'an sing to its own tune?"', url: 'https://www.eguizhou.gov.cn/2022-04/22/c_746256.htm', year: '2022' },
  { id: 'newsgd-huizhou', title: 'Newsgd — "Strumming up a milestone" (Huizhou)', url: 'https://www.newsgd.com/node_5c070fdd03/14925d835a.shtml', year: '2024' },
  { id: 'cdhk-hub', title: 'China Daily HK — "World\'s largest guitar production hub strikes the right chord"', url: 'https://www.chinadailyhk.com/hk/article/589788', year: '2023' },
  { id: 'trend-920290', title: 'TrendEconomy / UN Comtrade — HS 920290 "String musical instruments n.e.s. (guitars, harps)", world exports 2023', url: 'https://trendeconomy.com/data/commodity_h2/920290', year: '2023' },
  { id: 'trend-mex-9202', title: 'TrendEconomy / UN Comtrade — Mexico exports, HS 9202', url: 'https://trendeconomy.com/data/h2/Mexico/9202', year: '2023' },
  { id: 'pg-ensenada', title: 'Premier Guitar — "Fender Ensenada: Celebrating 25 Years in Mexico"', url: 'https://www.premierguitar.com/fender-ensenada-25th-anniversary-inside-the-mexico-factory', year: '2012' },
  { id: 'gw-ensenada', title: 'Guitar World — "Fender Mexico: 35 years of the game-changing guitar factory"', url: 'https://www.guitarworld.com/features/35-years-fender-mexico', year: '2022' },
  { id: 'sdbj-taylor', title: 'San Diego Business Journal — "Taylor Is in Tune With Its Mexico Operations"', url: 'https://sdbj.com/manufacturing/taylor-tune-its-mexico-operations/', year: '2023' },
  { id: 'assembly-taylor', title: 'Assembly Magazine — "2023 Assembly Plant of the Year: Taylor Guitars"', url: 'https://www.assemblymag.com/articles/98037-hand-craftsmanship-meets-high-tech-at-taylor-guitars', year: '2023' },
  { id: 'cort-1m', title: 'jazzguitar.be forum — "Inside the biggest guitar factory in the world: Cort, Indonesia"', url: 'https://www.jazzguitar.be/forum/guitar-amps-gizmos/105127-inside-biggest-guitar-factory-world-cort-indonesia-1-million-guitars.html', year: '2016' },
  { id: 'wiki-squier', title: 'Wikipedia — Squier', url: 'https://en.wikipedia.org/wiki/Squier', year: '—' },
  { id: 'general', title: 'Manufacturer websites and widely documented factory locations', url: '', year: '—' },
];

export interface Site {
  id: string;
  name: string;          // the place
  who: string;           // who makes guitars there
  country: string;       // ISO alpha-2
  lat: number; lon: number;
  kind: Kind;            // what it is best known for
  also?: Kind[];
  units?: number;        // guitars a year, where a figure has been published
  approx?: boolean;
  unitsNote?: string;
  since?: number;
  note: string;
  src: string[];
  cluster?: boolean;     // a whole town or county, not one factory
}

export const SITES: Site[] = [
  // China
  { id: 'zhengan', name: 'Zheng’an County, Guizhou', who: 'dozens of guitar companies', country: 'CN', lat: 28.55, lon: 107.44, kind: 'acoustic', also: ['electric', 'classical'], units: 6_000_000, unitsNote: 'reported for 2021; a 2026 report gives 2.4 million+', since: 2012, cluster: true, note: 'A mountain county with no musical tradition that became the world\'s largest guitar-making hub after migrant workers came home from the factories of Guangdong around 2012. Local reports put it at about one in five Chinese guitars and one in seven worldwide.', src: ['cd-zhengan-2021', 'eguizhou-2022', 'cd-zhengan-2026'] },
  { id: 'changle', name: 'Changle County, Shandong', who: '108 companies in the supply chain', country: 'CN', lat: 36.70, lon: 118.83, kind: 'acoustic', also: ['electric'], units: 2_000_000, cluster: true, note: 'A county near Weifang with a supply chain of about a hundred firms: bodies, necks, hardware, cases.', src: ['cdhk-hub'] },
  { id: 'huizhou', name: 'Huizhou, Guangdong', who: 'guitar and ukulele makers', country: 'CN', lat: 23.08, lon: 114.42, kind: 'acoustic', also: ['classical'], units: 1_500_000, unitsNote: 'plus about 3 million ukuleles', cluster: true, note: 'Described as China\'s largest guitar production base in Guangdong; about 30% of output is sold at home.', src: ['newsgd-huizhou'] },
  { id: 'guangzhou', name: 'Guangzhou, Guangdong', who: 'OEM factories for many brands', country: 'CN', lat: 23.13, lon: 113.26, kind: 'acoustic', also: ['electric'], cluster: true, note: 'With Huizhou, the Pearl River Delta has the oldest and deepest export supply chain for guitars in China.', src: ['cdhk-hub'] },
  { id: 'qingdao', name: 'Qingdao, Shandong', who: 'Epiphone', country: 'CN', lat: 36.07, lon: 120.38, kind: 'electric', also: ['acoustic'], since: 2004, note: 'Epiphone (Gibson\'s lower-priced brand) opened its own factory here in 2004 rather than relying only on contract makers.', src: ['general'] },
  // Indonesia
  { id: 'surabaya', name: 'Surabaya, East Java', who: 'Cort / Cor-Tek (Cort, PRS SE and others)', country: 'ID', lat: -7.25, lon: 112.75, kind: 'electric', also: ['acoustic'], units: 1_000_000, approx: true, unitsNote: 'Cort\'s total across its Indonesian, Chinese and Korean plants', note: 'Cort, a Korean firm, is one of the largest guitar makers in the world, building its own guitars and many other brands\' under contract. Its Surabaya plant has more than 2,000 workers.', src: ['cort-1m'] },
  { id: 'bogor', name: 'Cibinong, West Java', who: 'Samick', country: 'ID', lat: -6.48, lon: 106.85, kind: 'electric', also: ['acoustic'], note: 'Samick, another Korean maker, moved production to Indonesia in the 1990s and builds for many brands.', src: ['wiki-squier', 'general'] },
  { id: 'jakarta', name: 'Jakarta area', who: 'Yamaha', country: 'ID', lat: -6.30, lon: 107.15, kind: 'acoustic', also: ['classical', 'electric'], note: 'Yamaha makes many of its mass-market acoustic and classical guitars in Indonesia.', src: ['general'] },
  // Mexico
  { id: 'ensenada', name: 'Ensenada, Baja California', who: 'Fender', country: 'MX', lat: 31.87, lon: -116.60, kind: 'electric', also: ['acoustic'], units: 150_000, approx: true, unitsNote: 'from a capacity of about 600 instruments a day in 1995', since: 1987, note: 'Fender\'s Mexican factory opened in 1987 and now has more than 1,000 workers making the Player and Vintera lines, some acoustics and amplifiers.', src: ['pg-ensenada', 'gw-ensenada'] },
  { id: 'tecate', name: 'Tecate, Baja California', who: 'Taylor', country: 'MX', lat: 32.57, lon: -116.63, kind: 'acoustic', units: 137_000, approx: true, unitsNote: 'about 550 a day', note: 'Taylor\'s second factory, just over the border from San Diego: the GS Mini, the Academy series and the 100 and 200 series.', src: ['sdbj-taylor', 'assembly-taylor'] },
  { id: 'navojoa', name: 'Navojoa, Sonora', who: 'Martin', country: 'MX', lat: 27.08, lon: -109.44, kind: 'acoustic', note: 'Martin\'s Mexican plant builds its lower-priced X, Road and Junior series.', src: ['general'] },
  { id: 'paracho', name: 'Paracho, Michoacán', who: 'hundreds of family workshops', country: 'MX', lat: 19.65, lon: -102.06, kind: 'classical', cluster: true, note: 'A town of luthiers in the highlands where guitar-making has been handed down for generations; it holds a national guitar fair every August.', src: ['general'] },
  // USA and Canada
  { id: 'elcajon', name: 'El Cajon, California', who: 'Taylor', country: 'US', lat: 32.79, lon: -116.96, kind: 'acoustic', units: 38_000, approx: true, unitsNote: 'about 150 a day: 700 a day across both factories, less Tecate', note: 'Taylor\'s home factory builds the 300 series and up, and pioneered CNC-built acoustic necks.', src: ['sdbj-taylor', 'assembly-taylor'] },
  { id: 'corona', name: 'Corona, California', who: 'Fender', country: 'US', lat: 33.87, lon: -117.57, kind: 'electric', note: 'Fender\'s US factory and Custom Shop: the American Professional, Ultra and Original lines.', src: ['general'] },
  { id: 'nashville', name: 'Nashville, Tennessee', who: 'Gibson', country: 'US', lat: 36.16, lon: -86.78, kind: 'electric', note: 'Les Pauls, SGs and the Custom Shop. Gibson moved here from Kalamazoo, Michigan, in the 1970s and 80s.', src: ['general'] },
  { id: 'bozeman', name: 'Bozeman, Montana', who: 'Gibson Acoustic', country: 'US', lat: 45.68, lon: -111.04, kind: 'acoustic', note: 'Where Gibson\'s flat-tops (J-45, Hummingbird, Dove) have been built since 1989.', src: ['general'] },
  { id: 'nazareth', name: 'Nazareth, Pennsylvania', who: 'C.F. Martin & Co.', country: 'US', lat: 40.74, lon: -75.31, kind: 'acoustic', since: 1839, note: 'Martin has built guitars in Nazareth since 1839; the dreadnought shape was born here.', src: ['general'] },
  { id: 'stevensville', name: 'Stevensville, Maryland', who: 'PRS', country: 'US', lat: 38.98, lon: -76.31, kind: 'electric', note: 'PRS Core and Private Stock models, on Kent Island in Chesapeake Bay.', src: ['general'] },
  { id: 'lapatrie', name: 'La Patrie, Québec', who: 'Godin, Seagull, Norman', country: 'CA', lat: 45.40, lon: -71.25, kind: 'acoustic', also: ['electric'], note: 'A village in the Eastern Townships where Godin\'s family of brands builds its guitars.', src: ['general'] },
  // Japan
  { id: 'matsumoto', name: 'Matsumoto, Nagano', who: 'FujiGen (Ibanez Prestige and others)', country: 'JP', lat: 36.24, lon: 137.97, kind: 'electric', note: 'FujiGen built Ibanez and Greco copies in the 1970s and Fender Japan\'s early guitars; it still makes Ibanez\'s Prestige line.', src: ['general'] },
  { id: 'nagoya', name: 'Nagoya, Aichi', who: 'Terada (Gretsch)', country: 'JP', lat: 35.18, lon: 136.90, kind: 'electric', also: ['acoustic'], note: 'Terada builds Gretsch\'s Japanese Professional Collection hollow bodies.', src: ['general'] },
  { id: 'tokyo', name: 'Tokyo', who: 'ESP', country: 'JP', lat: 35.68, lon: 139.69, kind: 'electric', note: 'ESP\'s own-brand and custom guitars; its LTD line is built in Korea, Indonesia and China.', src: ['general'] },
  { id: 'gifu', name: 'Nakatsugawa, Gifu', who: 'Takamine', country: 'JP', lat: 35.49, lon: 137.50, kind: 'acoustic', note: 'Takamine\'s Japanese factory, at the foot of Mount Ena; its G series is made in China.', src: ['general'] },
  { id: 'hamamatsu', name: 'Hamamatsu, Shizuoka', who: 'Yamaha', country: 'JP', lat: 34.71, lon: 137.73, kind: 'acoustic', also: ['classical'], note: 'Yamaha\'s home town and the base for its high-end guitars.', src: ['general'] },
  // Europe
  { id: 'alcoy', name: 'Muro de Alcoy, Valencia', who: 'Alhambra', country: 'ES', lat: 38.78, lon: -0.44, kind: 'classical', note: 'Spain\'s biggest classical-guitar maker, founded in 1965 in the hills behind Alicante.', src: ['general'] },
  { id: 'madrid', name: 'Madrid', who: 'Ramírez', country: 'ES', lat: 40.42, lon: -3.70, kind: 'classical', since: 1882, note: 'The Ramírez workshop, making classical and flamenco guitars since 1882.', src: ['general'] },
  { id: 'granada', name: 'Granada', who: 'independent luthiers', country: 'ES', lat: 37.18, lon: -3.60, kind: 'classical', cluster: true, note: 'A city of guitar workshops at the foot of the Alhambra, famous for flamenco guitars.', src: ['general'] },
  { id: 'markneukirchen', name: 'Markneukirchen, Saxony', who: 'Warwick, Framus', country: 'DE', lat: 50.31, lon: 12.33, kind: 'electric', cluster: true, note: 'The "Musikwinkel" on the Czech border has made string instruments since the 1600s.', src: ['general'] },
  { id: 'bubenreuth', name: 'Bubenreuth, Bavaria', who: 'Höfner', country: 'DE', lat: 49.63, lon: 11.02, kind: 'electric', since: 1949, note: 'Settled after 1945 by instrument makers from Schönbach; home of the Höfner "Beatle bass".', src: ['general'] },
  // Elsewhere
  { id: 'cebu', name: 'Lapu-Lapu, Cebu', who: 'family workshops', country: 'PH', lat: 10.31, lon: 123.95, kind: 'classical', also: ['acoustic'], cluster: true, note: 'On Mactan island, where guitars have been hand-built from local and imported woods for generations.', src: ['general'] },
  { id: 'melbourne', name: 'Box Hill, Melbourne', who: 'Maton', country: 'AU', lat: -37.82, lon: 145.12, kind: 'acoustic', since: 1946, note: 'Australia\'s best-known guitar maker, building with Australian timbers since 1946.', src: ['general'] },
];

/** Exports of HS 920290 (non-bowed string instruments: guitars dominate) in 2023, US$ million. */
export const EXPORTS_2023 = { world: 831, rows: [
  { id: 'CN', name: 'China', usd: 321 },
  { id: 'US', name: 'United States', usd: 164 },
  { id: 'ID', name: 'Indonesia', usd: 64 },
  { id: 'NL', name: 'Netherlands', usd: 61, note: 'mostly distribution: brands ship to Europe through Dutch warehouses' },
  { id: 'DE', name: 'Germany', usd: 60 },
] };
export const MEXICO_9202 = 29.8; // US$ million, 2023, the wider HS 9202 heading

/** Rough country centroids for the export bubbles (lat, lon). */
export const CENTROID: Record<string, [number, number]> = {
  CN: [34, 104], US: [39, -98], ID: [-2, 117], NL: [52.2, 5.3], DE: [51, 10.4], MX: [23.6, -102.5], JP: [36.5, 138], ES: [40, -3.7],
  KR: [36.3, 127.9], CA: [53, -95], AU: [-25, 134], PH: [12.5, 122], BR: [-10, -52], IN: [22, 79], CZ: [49.8, 15.5], VN: [16, 107],
};

/** ISO 3166 numeric codes, to find countries in the world atlas. */
export const ISO_NUM: Record<string, string> = {
  CN: '156', US: '840', ID: '360', NL: '528', DE: '276', MX: '484', JP: '392', ES: '724', KR: '410', CA: '124', AU: '036', PH: '608',
  BR: '076', IN: '356', CZ: '203', VN: '704', GB: '826', SE: '752', TW: '158',
};

export interface Wood { id: string; name: string; part: string; region: string; lat: number; lon: number; to: string[]; note: string }

/** Where tonewood comes from, and the factories it is best known in. */
export const WOODS: Wood[] = [
  { id: 'sitka', name: 'Sitka spruce', part: 'acoustic tops', region: 'Alaska & British Columbia coast', lat: 57, lon: -134, to: ['elcajon', 'nazareth', 'tecate', 'bozeman'], note: 'The standard steel-string top: stiff, light and straight-grained, from old-growth coastal forest.' },
  { id: 'adirondack', name: 'Adirondack spruce', part: 'premium tops', region: 'Appalachians, New England', lat: 44, lon: -74.5, to: ['nazareth', 'bozeman'], note: 'Red spruce, the pre-war top wood, prized again for high-end builds.' },
  { id: 'euro', name: 'European spruce', part: 'classical tops', region: 'The Alps (Val di Fiemme)', lat: 46.3, lon: 11.5, to: ['alcoy', 'madrid', 'granada'], note: 'Alpine spruce, the same forests that gave Stradivari his violin tops.' },
  { id: 'hmahog', name: 'Honduran mahogany', part: 'necks, backs & sides', region: 'Central America', lat: 15, lon: -86.5, to: ['nashville', 'nazareth'], note: 'The classic neck wood; trade limited since 2003 under CITES Appendix II.' },
  { id: 'khaya', name: 'African mahogany & sapele', part: 'necks, backs & sides', region: 'West & Central Africa', lat: 5, lon: 9, to: ['nashville', 'tecate', 'zhengan'], note: 'Khaya and sapele took over from Honduran mahogany in most factories.' },
  { id: 'ebony', name: 'Ebony', part: 'fretboards & bridges', region: 'Cameroon', lat: 3.9, lon: 11.5, to: ['elcajon', 'tecate', 'alcoy'], note: 'Most guitar ebony comes from Cameroon, where Taylor co-owns the Crelicam mill in Yaoundé.' },
  { id: 'irose', name: 'Indian rosewood', part: 'fretboards, backs & sides', region: 'Southern India', lat: 12, lon: 76, to: ['nazareth', 'alcoy', 'madrid', 'zhengan'], note: 'The workhorse rosewood since the Brazilian ban.' },
  { id: 'brose', name: 'Brazilian rosewood', part: 'vintage backs & sides', region: 'Bahia, Brazil', lat: -14, lon: -40, to: ['madrid', 'nazareth'], note: 'The legendary back-and-sides wood, CITES Appendix I since 1992: essentially no new trade.' },
  { id: 'maple', name: 'Hard maple', part: 'electric necks', region: 'Great Lakes & New England', lat: 45.5, lon: -79, to: ['corona', 'ensenada', 'nashville', 'stevensville'], note: 'Rock maple for Fender necks and Les Paul tops.' },
  { id: 'alder', name: 'Alder', part: 'electric bodies', region: 'Pacific Northwest', lat: 46.5, lon: -123, to: ['corona', 'ensenada'], note: 'The Stratocaster\'s body wood since the late 1950s.' },
  { id: 'koa', name: 'Koa', part: 'backs, sides & tops', region: 'Hawaii', lat: 19.6, lon: -155.5, to: ['elcajon', 'nazareth'], note: 'Hawaiian acacia, grown only on the islands.' },
];

export interface Place { label: string; site?: string; country?: string }
export interface Brand { id: string; name: string; lines: { line: string; places: Place[] }[] }

export const BRANDS: Brand[] = [
  { id: 'fender', name: 'Fender', lines: [
    { line: 'American Professional, Ultra, Custom Shop', places: [{ label: 'Corona, California', site: 'corona' }] },
    { line: 'Player, Vintera', places: [{ label: 'Ensenada, Mexico', site: 'ensenada' }] },
    { line: 'Squier', places: [{ label: 'China', country: 'CN' }, { label: 'Indonesia', country: 'ID' }] },
  ] },
  { id: 'gibson', name: 'Gibson', lines: [
    { line: 'Les Paul, SG, ES and Custom Shop', places: [{ label: 'Nashville, Tennessee', site: 'nashville' }] },
    { line: 'Acoustics', places: [{ label: 'Bozeman, Montana', site: 'bozeman' }] },
    { line: 'Epiphone', places: [{ label: 'Qingdao, China', site: 'qingdao' }, { label: 'Indonesia', country: 'ID' }] },
  ] },
  { id: 'martin', name: 'Martin', lines: [
    { line: 'Standard, Modern Deluxe, Custom', places: [{ label: 'Nazareth, Pennsylvania', site: 'nazareth' }] },
    { line: 'X, Road, Junior series', places: [{ label: 'Navojoa, Mexico', site: 'navojoa' }] },
  ] },
  { id: 'taylor', name: 'Taylor', lines: [
    { line: '300 series and up', places: [{ label: 'El Cajon, California', site: 'elcajon' }] },
    { line: 'GS Mini, Academy, 100 & 200 series', places: [{ label: 'Tecate, Mexico', site: 'tecate' }] },
  ] },
  { id: 'prs', name: 'PRS', lines: [
    { line: 'Core, Private Stock', places: [{ label: 'Stevensville, Maryland', site: 'stevensville' }] },
    { line: 'SE', places: [{ label: 'Surabaya, Indonesia (Cor-Tek)', site: 'surabaya' }] },
  ] },
  { id: 'ibanez', name: 'Ibanez', lines: [
    { line: 'Prestige, J Custom', places: [{ label: 'Matsumoto, Japan (FujiGen)', site: 'matsumoto' }] },
    { line: 'Premium, Standard, GIO', places: [{ label: 'Indonesia', country: 'ID' }, { label: 'China', country: 'CN' }] },
  ] },
  { id: 'yamaha', name: 'Yamaha', lines: [
    { line: 'L series and custom', places: [{ label: 'Hamamatsu, Japan', site: 'hamamatsu' }] },
    { line: 'FG, C and Pacifica lines', places: [{ label: 'Jakarta area, Indonesia', site: 'jakarta' }, { label: 'China', country: 'CN' }] },
  ] },
  { id: 'gretsch', name: 'Gretsch', lines: [
    { line: 'Professional Collection', places: [{ label: 'Nagoya, Japan (Terada)', site: 'nagoya' }] },
    { line: 'Electromatic, Streamliner', places: [{ label: 'Indonesia', country: 'ID' }, { label: 'China', country: 'CN' }] },
  ] },
  { id: 'esp', name: 'ESP / LTD', lines: [
    { line: 'ESP, E-II', places: [{ label: 'Tokyo, Japan', site: 'tokyo' }] },
    { line: 'LTD', places: [{ label: 'Korea', country: 'KR' }, { label: 'Indonesia', country: 'ID' }, { label: 'China', country: 'CN' }] },
  ] },
  { id: 'takamine', name: 'Takamine', lines: [
    { line: 'Japan series', places: [{ label: 'Nakatsugawa, Japan', site: 'gifu' }] },
    { line: 'G series', places: [{ label: 'China', country: 'CN' }] },
  ] },
  { id: 'cort', name: 'Cort', lines: [{ line: 'Everything', places: [{ label: 'Surabaya, Indonesia', site: 'surabaya' }, { label: 'China', country: 'CN' }] }] },
  { id: 'godin', name: 'Godin', lines: [{ line: 'Godin, Seagull, Norman', places: [{ label: 'La Patrie, Québec', site: 'lapatrie' }] }] },
  { id: 'alhambra', name: 'Alhambra', lines: [{ line: 'Classical and flamenco', places: [{ label: 'Muro de Alcoy, Spain', site: 'alcoy' }] }] },
  { id: 'maton', name: 'Maton', lines: [{ line: 'Everything', places: [{ label: 'Melbourne, Australia', site: 'melbourne' }] }] },
];

export interface Era { id: string; years: string; title: string; countries: string[]; sites: string[]; text: string }

/** The factory moves: who built most of the world's guitars, decade by decade. */
export const ERAS: Era[] = [
  { id: 'e1', years: '1830s–1960s', title: 'Made in America (and Germany)', countries: ['US', 'DE', 'CZ', 'ES'], sites: ['nazareth', 'bubenreuth', 'markneukirchen', 'madrid'], text: 'Martin in Nazareth, Gibson in Kalamazoo, Fender in Fullerton; Höfner and Framus in Bavaria; the Ramírez workshop in Madrid. The electric guitar is an American invention, and so is its first boom.' },
  { id: 'e2', years: '1970s', title: 'Japan learns fast', countries: ['JP', 'US'], sites: ['matsumoto', 'hamamatsu'], text: 'FujiGen, Matsumoku and Yamaha build copies so good they earn a lawsuit, then designs of their own. Fender Japan follows in 1982.' },
  { id: 'e3', years: '1980s–1990s', title: 'Korea, and over the border', countries: ['KR', 'MX', 'JP', 'US'], sites: ['ensenada'], text: 'Samick, Cort and Young Chang in Korea become the world\'s contract makers. Fender opens Ensenada in 1987, an hour south of the US border.' },
  { id: 'e4', years: '2000s', title: 'China and Indonesia', countries: ['CN', 'ID', 'MX', 'US'], sites: ['qingdao', 'surabaya', 'bogor', 'guangzhou', 'tecate'], text: 'Korean makers move to Java; Epiphone opens its own factory in Qingdao (2004); the Pearl River Delta builds for everyone. Taylor opens Tecate.' },
  { id: 'e5', years: '2010s–now', title: 'Guitar counties', countries: ['CN', 'ID', 'MX', 'US'], sites: ['zhengan', 'changle', 'huizhou', 'surabaya', 'ensenada', 'tecate'], text: 'Whole Chinese counties turn into guitar towns: Zheng\'an alone reports about one in seven of the world\'s guitars. The US keeps the premium end; Mexico and Indonesia the middle.' },
];

export const fmtUnits = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(n % 1e6 ? 1 : 0)} M` : `${Math.round(n / 1000)} k`);
