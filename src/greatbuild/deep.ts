/**
 * The Great Build, going deeper: the less obvious findings behind the
 * headline numbers. They come from research papers, industry reports and
 * books as well as government bulletins, and each carries its source. Where
 * a figure comes from a secondary report of the source rather than the
 * original, `via` names the report.
 */

export interface Ref { title: string; url: string; via?: string }

export type Kind = 'lesser' | 'myth' | 'caveat' | 'fragile';
export const KIND_LABEL: Record<Kind, string> = { lesser: 'Lesser known', myth: 'Myth check', caveat: 'Read the small print', fragile: 'Fragility' };

export interface Insight { kind: Kind; title: string; body: string; stat?: string; statLabel?: string; refs: Ref[] }

/* ───────────── ports ───────────── */

/** The largest container ship of each era. Lengths stopped at about 400 m; ships got wider instead. */
export const SHIPS = [
  { year: 2006, name: 'Emma Mærsk', teu: 14770, beam: 56, note: 'Officially rated about 11,000 TEU when launched; 14,770 by the later standard method.', checked: true },
  { year: 2013, name: 'Mærsk Mc-Kinney Møller', teu: 18270, beam: 59, note: 'First of Maersk’s Triple-E class.', checked: false },
  { year: 2017, name: 'OOCL Hong Kong', teu: 21413, beam: 58.8, note: 'First ship rated over 21,000 TEU.', checked: false },
  { year: 2019, name: 'MSC Gülsün', teu: 23756, beam: 61.5, note: 'Stacks containers 24 rows across.', checked: false },
  { year: 2023, name: 'MSC Irina', teu: 24346, beam: 61.3, note: 'The record holder, about 150 TEU more than OOCL Spain.', checked: true },
];
export const SHIP_LENGTH_M = 400;
export const AVG_SHIP_TEU_2025 = 5000;

export const PORT_INSIGHTS: Insight[] = [
  { kind: 'lesser', title: 'Ships stopped getting longer', stat: '400 m', statLabel: 'the length the biggest ships stopped at, since 2006',
    body: 'Every record ship since Emma Mærsk has been about 400 metres long, the practical limit of locks, turning basins and berths. Capacity has grown by making ships wider and stacking higher. That forces ports to dredge deeper and buy taller cranes with longer reach, which only a few hub ports can afford. It is one reason growth concentrated in so few places.',
    refs: [{ title: 'The Geography of Transport Systems: Evolution of containerships', url: 'https://transportgeography.org/contents/chapter5/maritime-transportation/evolution-containerships-classes/' }, { title: 'Ships Monthly: MSC Irina delivered at 24,346 TEU', url: 'https://shipsmonthly.com/news/msc-shatters-records-with-delivery-of-24346teu-msc-irina/' }] },
  { kind: 'myth', title: 'Hambantota is not the “debt trap” it is usually told as', stat: '99 years', statLabel: 'lease of a 70% stake, for $1.12 bn',
    body: 'The usual story is that China lent Sri Lanka money for a port it couldn’t repay, then seized the port. A 2020 Chatham House study found that the port was proposed by Sri Lanka’s own government, and that the country’s debt distress came mainly from borrowing on Western capital markets. The 2017 deal leased a 70% stake to China Merchants Port for 99 years; the port remains Sri Lankan territory.',
    refs: [{ title: 'Jones & Hameiri, Debunking the Myth of “Debt-trap Diplomacy”, Chatham House (2020)', url: 'https://www.chathamhouse.org/sites/default/files/2020-08-25-debunking-myth-debt-trap-diplomacy-jones-hameiri.pdf' }] },
  { kind: 'lesser', title: 'The biggest port runs almost without dockers', stat: 'Dec 2017', statLabel: 'Yangshan Phase IV opens',
    body: 'Yangshan Phase IV, Shanghai’s deep-water terminal on islands 30 km out to sea, opened in December 2017 as the world’s largest automated container terminal built in a single phase. Cranes and driverless vehicles are run from a control room. The same terminal tops the World Bank’s efficiency index.',
    refs: [{ title: 'Xinhua: World’s largest automated container terminal opens in Shanghai (2017)', url: 'http://www.xinhuanet.com/english/2017-12/10/c_136815480.htm' }, { title: 'World Bank: The Container Port Performance Index', url: 'https://openknowledge.worldbank.org/entities/publication/fa57ba78-0402-4eb4-b168-51708cf526f7' }] },
  { kind: 'fragile', title: 'One ship, six days', stat: '$9.6 bn', statLabel: 'of goods held up per day',
    body: 'In March 2021 the 400-metre Ever Given ran aground across the Suez Canal for six days. Lloyd’s List estimated about $5.1 bn a day of westbound and $4.5 bn of eastbound traffic was held up, and at least 369 ships queued. Bigger ships mean fewer, larger single points of failure.',
    refs: [{ title: 'Bloomberg / Lloyd’s List: Suez snarl halting $9.6 billion a day of ship traffic', url: 'https://www.bloomberg.com/news/articles/2021-03-25/suez-snarl-seen-halting-9-6-billion-a-day-worth-of-ship-traffic' }, { title: 'Port Economics, Management and Policy: Blockage of the Suez Canal, March 2021', url: 'https://porteconomicsmanagement.org/pemp/contents/part10/port-resilience/suez-canal-blockage-2021/' }] },
];

/* ───────────── metros ───────────── */

export interface Cost { id: string; place: string; project: string; usdM: number; nation: 'CN' | 'US' | 'IN' | 'other'; basis: string; ref: Ref }

/** What a kilometre of metro costs, US$ million per km. Bases differ (PPP-adjusted Transit Costs Project figures vs. official budgets), so read as orders of magnitude. */
export const COSTS: Cost[] = [
  { id: 'nyc', place: 'New York', project: 'Second Avenue Subway, phase 2', usdM: 2200, nation: 'US', basis: 'Transit Costs Project estimate', ref: { title: 'Transit Costs Project', url: 'https://transitcosts.com/transit-costs-study-final-report/', via: 'Vital City; Transit Costs Project' } },
  { id: 'sh20', place: 'Shanghai', project: 'Line 20, phase 1', usdM: 604, nation: 'CN', basis: 'Transit Costs Project, PPP', ref: { title: 'Transit Costs Project data', url: 'https://transitcosts.com/new-data/' } },
  { id: 'world', place: 'World average', project: '755 lines, 60 countries (weighted)', usdM: 252, nation: 'other', basis: 'Transit Costs Project, PPP', ref: { title: 'Transit Costs Project final report', url: 'https://transitcosts.com/transit-costs-study-final-report/' } },
  { id: 'paris', place: 'Paris region', project: 'Grand Paris Express (budget ÷ 200 km)', usdM: 213, nation: 'other', basis: 'official budget, €35 bn', ref: { title: 'G20 Global Infrastructure Hub: Grand Paris Express', url: 'https://infrastructuredeliverymodels.gihub.org/case-studies/grand-paris-express/' } },
  { id: 'sthlm', place: 'Stockholm', project: 'Nya Tunnelbanan', usdM: 190, nation: 'other', basis: 'Transit Costs Project, PPP', ref: { title: 'Transit Costs Project: the Sweden case', url: 'https://marroninstitute.nyu.edu/blog/transit-costs-project-releases-the-sweden-case' } },
  { id: 'milan', place: 'Milan', project: 'Line M4', usdM: 145, nation: 'other', basis: 'Transit Costs Project, PPP 2020', ref: { title: 'Transit Costs Project: the Italy case', url: 'https://transitcosts.com/transit-costs-study-final-report/' } },
  { id: 'ist', place: 'Istanbul', project: 'rapid-rail lines (weighted average)', usdM: 126, nation: 'other', basis: 'Transit Costs Project, PPP', ref: { title: 'Transit Costs Project: the Turkey case', url: 'https://transitcosts.com/transit-costs-study-final-report/' } },
  { id: 'seoul', place: 'Seoul', project: 'Sin-Bundang Line (2005–11)', usdM: 87, nation: 'other', basis: 'as reported', ref: { title: 'Pedestrian Observations: comparative subway construction costs', url: 'https://pedestrianobservations.com/2013/06/03/comparative-subway-construction-costs-revised/' } },
];

export const METRO_INSIGHTS: Insight[] = [
  { kind: 'lesser', title: 'New York’s problem isn’t engineering, it’s cost', stat: '≈9×', statLabel: 'the world average cost per km',
    body: 'NYU’s Transit Costs Project compared 755 lines in 60 countries. The weighted average was about $252 m per km. New York’s Second Avenue Subway phase 2 is estimated at about $2.2 bn per km. The study blames oversized stations, consultant-heavy procurement, labour practices and lost in-house expertise, not geology. That is why New York added 5 km while Beijing added 795.',
    refs: [{ title: 'Transit Costs Project final report (NYU Marron Institute)', url: 'https://transitcosts.com/transit-costs-study-final-report/' }, { title: 'Vital City: Why it costs $4 billion per mile of subway track', url: 'https://www.vitalcitynyc.org/articles/why-it-costs-4-billion-per-mile-of-subway-track' }] },
  { kind: 'caveat', title: 'China built faster than riders arrived', stat: '12,100 → 3,800', statLabel: 'riders per km per day, national average, 2015 → 2022',
    body: 'China’s metro association data show average passenger intensity falling from about 12,100 to 3,800 riders per km per day between 2015 and 2022. Covid restrictions depressed 2022, but newer lines in smaller cities carry far fewer people: Dalian’s network carried about 1,900 per km per day in 2022, against two to three times the national average in Beijing and Shanghai.',
    refs: [{ title: 'Urban Rail Transit in China: Progress Report and Analysis (2015–2023), Urban Rail Transit (2025)', url: 'https://link.springer.com/article/10.1007/s40864-024-00231-7' }] },
  { kind: 'lesser', title: 'In 2018, Beijing pulled the brake', stat: '3 m · ¥300 bn', statLabel: 'minimum population and GDP for a new metro',
    body: 'A July 2018 State Council directive limited new subway approvals to cities with over 3 million people, ¥300 bn of GDP and ¥30 bn of fiscal revenue, after debt-funded projects spread to cities that could not fill them. Baotou, Hohhot, Lanzhou and Urumqi were among the cities that no longer qualified; Baotou’s metro was halted.',
    refs: [{ title: 'Caixin: China makes it harder to get OK to build subways (2018)', url: 'https://www.caixinglobal.com/2018-07-14/china-makes-it-harder-to-get-ok-to-build-subways-light-rail-101302749.html' }, { title: 'International Railway Journal: China revises policy for urban rail planning', url: 'https://www.railjournal.com/in_depth/china-revises-policy-for-urban-rail-planning-and-construction/' }] },
  { kind: 'myth', title: 'Chinese projects overrun too, about as much as everyone else', stat: '+31%', statLabel: 'average cost overrun, 95 Chinese road and rail projects',
    body: 'Oxford researchers compared 95 large Chinese road and rail projects with 806 in rich democracies. Chinese projects overran their budgets by about 31% on average: no better and no worse. Their more uncomfortable finding was that for over half of the projects, costs exceeded the benefits.',
    refs: [{ title: 'Ansar, Flyvbjerg, Budzier & Lunn, Oxford Review of Economic Policy 32(3), 2016', url: 'https://www.ssrn.com/abstract=2834326' }] },
];

/* ───────────── roads ───────────── */

export const ROAD_INSIGHTS: Insight[] = [
  { kind: 'caveat', title: 'The road network is built on debt', stat: '≈ ¥8 tn', statLabel: 'outstanding toll-road debt',
    body: 'Cumulative investment in China’s toll roads has passed ¥12 trillion, with nearly ¥8 trillion still owed. The ministry’s own toll-road bulletins show the system as a whole running at a loss. In 2021 more than 82% of its ¥1.2 trillion of spending went on repaying principal and interest; in 2023 the shortfall was about ¥600 bn.',
    refs: [{ title: 'Highway usage efficiency and debt burden: Evidence from China, Journal of Asian Economics (2024)', url: 'https://www.sciencedirect.com/science/article/abs/pii/S1049007824000046', via: 'Ministry of Transport toll-road statistical bulletins' }, { title: 'Caixin: Transport ministry tightens toll road rules as losses spiral (2018)', url: 'https://www.caixinglobal.com/2018-12-21/transport-ministry-tightens-toll-road-rules-as-losses-spiral-101362141.html' }] },
  { kind: 'lesser', title: 'India’s record: 37 km a day', stat: '37 km/day', statLabel: 'national highways built in 2020–21',
    body: 'India built national highways at a record 37 km a day in 2020–21, during the pandemic. The pace was about 34 km a day in 2023–24 and 29 a day in 2024–25 (10,660 km in the year).',
    refs: [{ title: 'Hindustan Times: Highway building at record 37 km per day (2021)', url: 'https://www.pressreader.com/india/hindustan-times-east-up/20210403/281917365879851' }, { title: 'Swarajya: 10,660 km built in FY25', url: 'https://swarajyamag.com/news-brief/indias-national-highways-network-expands-to-146342-km-with-10660-km-built-in-fy25' }] },
  { kind: 'caveat', title: 'Not every new kilometre is new road', stat: '≈50,000 km', statLabel: 'of national-highway growth from reclassification',
    body: 'India’s national highways grew from 91,287 km in 2014 to over 146,000 km. Critics point out that about 50,000 km of that came from re-labelling existing state roads as national highways, and that switching to lane-km reporting makes a 100 km six-lane road count as 600. The 7,332 km of access-controlled expressway is the cleaner measure of truly new road.',
    refs: [{ title: 'Construction World: India’s highway crisis', url: 'https://www.constructionworld.in/gold/transport-infrastructure/highways-and-roads-infrastructure/india-s-highway-crisis-/85417' }] },
  { kind: 'myth', title: 'The iron law of megaprojects', stat: '0.5%', statLabel: 'of 16,000 big projects hit budget, schedule and benefits',
    body: 'Bent Flyvbjerg’s database of more than 16,000 large projects (roads, rail, tunnels, dams, IT, the Olympics) finds that 47.9% come in on budget, 8.5% on budget and on time, and just 0.5% on budget, on time and delivering the benefits promised. Speed and scale are not the same as value.',
    refs: [{ title: 'Flyvbjerg & Gardner, How Big Things Get Done (2023)', url: 'https://www.goodreads.com/book/show/73004305-how-big-things-get-done' }, { title: 'The Independent Review: book review', url: 'https://www.independent.org/tir/2023-fall/how-big-things-get-done/' }] },
];

/* ───────────── guess first ───────────── */

export interface Quiz { id: string; q: string; unit: string; min: number; max: number; log?: boolean; answer: number; fmt: (v: number) => string; reveal: string; ref: Ref }

export const QUIZ: Quiz[] = [
  { id: 'q1', q: 'Of 16,000 big infrastructure and IT projects, what share came in on budget AND on time?', unit: '%', min: 0, max: 100, answer: 8.5, fmt: (v) => `${v.toFixed(v < 10 ? 1 : 0)}%`,
    reveal: 'Only 8.5%. And just 0.5% also delivered the benefits promised.', ref: { title: 'Flyvbjerg & Gardner, How Big Things Get Done (2023)', url: 'https://www.goodreads.com/book/show/73004305-how-big-things-get-done' } },
  { id: 'q2', q: 'New York’s Second Avenue Subway phase 2: how many times the world-average cost per km?', unit: '×', min: 1, max: 30, log: true, answer: 2200 / 252, fmt: (v) => `${v.toFixed(1)}×`,
    reveal: 'About 9×: roughly $2.2 bn per km against a weighted world average of $252 m.', ref: { title: 'Transit Costs Project', url: 'https://transitcosts.com/transit-costs-study-final-report/' } },
  { id: 'q3', q: 'When the Ever Given blocked Suez for six days in 2021, how much trade was held up per day?', unit: '$ bn', min: 0.1, max: 50, log: true, answer: 9.6, fmt: (v) => `$${v < 1 ? v.toFixed(2) : v.toFixed(1)} bn`,
    reveal: '$9.6 bn a day, by Lloyd’s List’s estimate, with 369 ships queued.', ref: { title: 'Bloomberg / Lloyd’s List (2021)', url: 'https://www.bloomberg.com/news/articles/2021-03-25/suez-snarl-seen-halting-9-6-billion-a-day-worth-of-ship-traffic' } },
  { id: 'q4', q: 'Chinese road and rail megaprojects: average cost overrun?', unit: '%', min: -20, max: 200, answer: 31, fmt: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`,
    reveal: '+31%, about the same as projects in rich democracies (Oxford, 2016).', ref: { title: 'Ansar, Flyvbjerg, Budzier & Lunn (2016)', url: 'https://www.ssrn.com/abstract=2834326' } },
];
