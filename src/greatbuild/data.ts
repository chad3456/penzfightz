/**
 * The Great Build: ports, metros and expressways, 2004 → 2024.
 *
 * `ok: true` marks a figure confirmed against the cited source while this
 * page was made. `ok: false` marks a figure from the same standard series
 * (Lloyd's List / Containerisation International port tables, China's
 * Ministry of Transport yearly bulletins, FHWA Highway Statistics) that was
 * not re-opened. The page shows those with a small open circle.
 */

export type Nation = 'CN' | 'US' | 'IN' | 'other';

export interface Src { id: string; title: string; url: string }
export const SOURCES: Src[] = [
  { id: 'ports24', title: 'Upply — Containers: 2024 ranking of the world\'s major ports', url: 'https://market-insights.upply.com/en/containers-2024-ranking-of-the-worlds-major-ports' },
  { id: 'portsWiki', title: 'Wikipedia — List of busiest container ports (2004 and 2024 columns)', url: 'https://en.wikipedia.org/wiki/List_of_busiest_container_ports' },
  { id: 'hk04', title: 'Ship Technology — The world\'s record-breaking container ports (Hong Kong 2004)', url: 'https://www.ship-technology.com/features/feature75321/' },
  { id: 'hk24', title: 'Seatrade Maritime — Hong Kong port container volume hit a 28-year low in 2024', url: 'https://www.seatrade-maritime.com/ports-logistics/hong-kong-port-container-volume-hit-a-28-year-low-in-2024' },
  { id: 'eu24', title: 'PortEconomics — Top-15 EU container ports in 2024', url: 'https://www.porteconomics.eu/top-15-europen-union-container-ports-in-2024/' },
  { id: 'cppi', title: 'Seatrade Maritime — Yangshan and Salalah top container port efficiency index (CPPI 2023)', url: 'https://www.seatrade-maritime.com/ports-logistics/yangshan-and-salalah-top-container-port-efficiency-index' },
  { id: 'cppiWB', title: 'World Bank — The Container Port Performance Index', url: 'https://openknowledge.worldbank.org/entities/publication/fa57ba78-0402-4eb4-b168-51708cf526f7' },
  { id: 'cnRail24', title: 'gov.cn — China\'s urban rail transit trips up 9.5 pct in 2024 (10,945.6 km at end of 2024)', url: 'https://english.www.gov.cn/archive/statistics/202501/30/content_WS679b5f38c6d0868f4e8ef492.html' },
  { id: 'cnRail19', title: 'ResearchGate — Operating mileage of urban metro in China 2013–2021', url: 'https://www.researchgate.net/figure/Development-of-operating-mileage-of-urban-metro-in-China-2013-2021_fig3_368696042' },
  { id: 'inMetro', title: 'PIB — Metro Rail Expansion: Connecting Urban India (248 km before 2014)', url: 'https://static.pib.gov.in/WriteReadData/specificdocs/documents/2024/mar/doc2024314324401.pdf' },
  { id: 'beijing', title: 'Wikipedia — Beijing Subway (909 km; world\'s longest since Dec 2023)', url: 'https://en.wikipedia.org/wiki/Beijing_Subway' },
  { id: 'delhi', title: 'Wikipedia — Delhi Metro (374.5 km today; Red Line opened 2002, Yellow Line Dec 2004)', url: 'https://en.wikipedia.org/wiki/Delhi_Metro' },
  { id: 'riyadh', title: 'CNN — Inside Saudi Arabia\'s $22-billion metro system (176 km, opened Dec 2024)', url: 'https://www.cnn.com/travel/saudi-arabia-riyadh-metro-railway' },
  { id: 'dubai', title: 'Wikipedia — Dubai Metro (89.6 km, opened 2009)', url: 'https://en.wikipedia.org/wiki/Dubai_Metro' },
  { id: 'secondave', title: 'Wikipedia — Second Avenue Subway (phase 1 opened 1 Jan 2017)', url: 'https://en.wikipedia.org/wiki/Second_Avenue_Subway' },
  { id: 'cnExp04', title: 'china.org.cn — Expressways (34,300 km at end of 2004)', url: 'http://www.china.org.cn/english/features/Brief/193079.htm' },
  { id: 'cnExp24', title: 'Wikipedia — Expressways of China (190,700 km at end of 2024, Ministry of Transport)', url: 'https://en.wikipedia.org/wiki/Expressways_of_China' },
  { id: 'fhwa04', title: 'FHWA — Highway Statistics 2004 (Interstate: 46,572 miles)', url: 'https://www.fhwa.dot.gov/policy/ohim/hs04/pdf/hm30.pdf' },
  { id: 'fhwa23', title: 'FHWA — Highway Statistics 2023, public road length', url: 'https://www.fhwa.dot.gov/policyinformation/statistics/2023/hm18.cfm' },
  { id: 'inExp', title: 'Wikipedia — Expressways of India (7,332 km operational, April 2026)', url: 'https://en.wikipedia.org/wiki/Expressways_of_India' },
  { id: 'inNH', title: 'DD News — India\'s National Highways record 60% growth in 10 years (91,287 → 146,195 km)', url: 'https://ddnews.gov.in/en/indias-national-highways-record-60-growth-in-last-10-years-to-become-2nd-largest-network-in-world/' },
];

/* ───────────── ports ───────────── */

export interface Port {
  id: string; name: string; short?: string; country: string; nation: Nation; lat: number; lon: number;
  t04: number; t24: number;   // million TEU
  ok04: boolean; ok24: boolean;
  src: string[];
}

export const PORTS: Port[] = [
  { id: 'shanghai', name: 'Shanghai', country: 'China', nation: 'CN', lat: 31.23, lon: 121.47, t04: 14.56, t24: 51.51, ok04: true, ok24: true, src: ['portsWiki', 'ports24'] },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', nation: 'other', lat: 1.26, lon: 103.84, t04: 21.33, t24: 41.12, ok04: true, ok24: true, src: ['hk04', 'ports24'] },
  { id: 'ningbo', short: 'Ningbo', name: 'Ningbo-Zhoushan', country: 'China', nation: 'CN', lat: 29.87, lon: 121.55, t04: 4.01, t24: 39.3, ok04: true, ok24: true, src: ['portsWiki', 'ports24'] },
  { id: 'shenzhen', name: 'Shenzhen', country: 'China', nation: 'CN', lat: 22.5, lon: 113.9, t04: 13.62, t24: 33.4, ok04: true, ok24: true, src: ['portsWiki', 'ports24'] },
  { id: 'qingdao', name: 'Qingdao', country: 'China', nation: 'CN', lat: 36.07, lon: 120.38, t04: 5.14, t24: 30.87, ok04: true, ok24: true, src: ['portsWiki', 'ports24'] },
  { id: 'guangzhou', name: 'Guangzhou', country: 'China', nation: 'CN', lat: 22.9, lon: 113.5, t04: 3.31, t24: 26.07, ok04: false, ok24: true, src: ['portsWiki', 'ports24'] },
  { id: 'busan', name: 'Busan', country: 'South Korea', nation: 'other', lat: 35.1, lon: 129.04, t04: 11.43, t24: 24.4, ok04: true, ok24: true, src: ['portsWiki', 'ports24'] },
  { id: 'tianjin', name: 'Tianjin', country: 'China', nation: 'CN', lat: 39.0, lon: 117.7, t04: 3.82, t24: 23.29, ok04: false, ok24: true, src: ['portsWiki', 'ports24'] },
  { id: 'jebelali', short: 'Jebel Ali', name: 'Jebel Ali (Dubai)', country: 'UAE', nation: 'other', lat: 25.0, lon: 55.06, t04: 6.43, t24: 15.5, ok04: false, ok24: true, src: ['portsWiki', 'ports24'] },
  { id: 'klang', name: 'Port Klang', country: 'Malaysia', nation: 'other', lat: 3.0, lon: 101.4, t04: 5.24, t24: 14.6, ok04: false, ok24: true, src: ['portsWiki', 'ports24'] },
  { id: 'rotterdam', name: 'Rotterdam', country: 'Netherlands', nation: 'other', lat: 51.95, lon: 4.14, t04: 8.28, t24: 13.82, ok04: false, ok24: true, src: ['portsWiki', 'eu24'] },
  { id: 'hongkong', short: 'HK', name: 'Hong Kong', country: 'China (SAR)', nation: 'other', lat: 22.3, lon: 114.17, t04: 21.98, t24: 13.69, ok04: true, ok24: true, src: ['hk04', 'hk24'] },
  { id: 'antwerp', short: 'Antwerp', name: 'Antwerp-Bruges', country: 'Belgium', nation: 'other', lat: 51.26, lon: 4.4, t04: 6.06, t24: 13.53, ok04: false, ok24: true, src: ['portsWiki', 'eu24'] },
  { id: 'la', short: 'LA', name: 'Los Angeles', country: 'USA', nation: 'US', lat: 33.74, lon: -118.26, t04: 7.32, t24: 10.3, ok04: false, ok24: false, src: ['portsWiki'] },
  { id: 'hamburg', name: 'Hamburg', country: 'Germany', nation: 'other', lat: 53.54, lon: 9.97, t04: 7.0, t24: 7.8, ok04: false, ok24: false, src: ['portsWiki'] },
];

/** The five most efficient container ports in the World Bank / S&P Global CPPI 2023. */
export const CPPI_2023 = [
  { rank: 1, name: 'Yangshan (Shanghai)', country: 'China', lat: 30.62, lon: 122.07 },
  { rank: 2, name: 'Salalah', country: 'Oman', lat: 16.94, lon: 54.0 },
  { rank: 3, name: 'Cartagena', country: 'Colombia', lat: 10.39, lon: -75.51 },
  { rank: 4, name: 'Tanger Med', country: 'Morocco', lat: 35.88, lon: -5.5 },
  { rank: 5, name: 'Tanjung Pelepas', country: 'Malaysia', lat: 1.36, lon: 103.55 },
];

/* ───────────── metros ───────────── */

export interface Metro { id: string; city: string; nation: Nation; km04: number; km24: number; note: string; ok04: boolean; ok24: boolean; src: string[] }

export const METROS: Metro[] = [
  { id: 'beijing', city: 'Beijing', nation: 'CN', km04: 114, km24: 909, note: 'the world\'s longest metro since December 2023', ok04: true, ok24: true, src: ['beijing'] },
  { id: 'delhi', city: 'Delhi', nation: 'IN', km04: 25, km24: 374.5, note: 'the Red Line and the first stretch of the Yellow Line at the end of 2004; ten lines now', ok04: false, ok24: true, src: ['delhi'] },
  { id: 'riyadh', city: 'Riyadh', nation: 'other', km04: 0, km24: 176, note: 'six driverless lines, all opened from December 2024', ok04: true, ok24: true, src: ['riyadh'] },
  { id: 'dubai', city: 'Dubai', nation: 'other', km04: 0, km24: 89.6, note: 'first line opened in 2009', ok04: true, ok24: true, src: ['dubai'] },
  { id: 'newyork', city: 'New York', nation: 'US', km04: 394, km24: 399, note: '+5 km: the 7 line to Hudson Yards (2015) and the Second Avenue Subway (2017)', ok04: false, ok24: false, src: ['secondave'] },
  { id: 'london', city: 'London', nation: 'other', km04: 399, km24: 402, note: '+3 km: the Northern line to Battersea (2021); the Elizabeth line is counted as rail', ok04: false, ok24: false, src: [] },
];

export const CHINA_URBAN_RAIL = { km24: 10945.6, km19: 5761, added24: 748, cities: 54 };
export const INDIA_METRO = { km14: 248, km25: 1000 };

/* ───────────── expressways ───────────── */

/** China's expressways, km, end of each year. 2004 and 2023–24 checked; the years between are Ministry of Transport bulletin figures, not re-opened. */
export const CN_EXPRESSWAY: [number, number][] = [
  [2004, 34300], [2005, 41000], [2006, 45300], [2007, 53900], [2008, 60300], [2009, 65100], [2010, 74100], [2011, 84900], [2012, 96200],
  [2013, 104400], [2014, 111900], [2015, 123500], [2016, 131000], [2017, 136500], [2018, 142600], [2019, 149600], [2020, 161000],
  [2021, 169100], [2022, 177300], [2023, 184000], [2024, 190700],
];
export const CN_EXP_CHECKED = new Set([2004, 2023, 2024]);
/** The US Interstate system: 46,572 miles in 2004 (checked); about 48,800 miles in 2023 (not re-opened). */
export const US_INTERSTATE: [number, number][] = [[2004, 74950], [2023, 78500]];
/** India's access-controlled expressways: about 190 km in 2004 (Mumbai–Pune and Ahmedabad–Vadodara), 7,332 km in April 2026. */
export const IN_EXPRESSWAY: [number, number][] = [[2004, 190], [2026, 7332]];
export const IN_NH = { km14: 91287, km24: 146195 };
export const EARTH_KM = 40075;

export const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: n < 100 ? 1 : 0 });
