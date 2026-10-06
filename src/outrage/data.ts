/**
 * Every number in "The Outrage Dividend", with where it came from. Values are
 * as published; where sources disagree the lower figure is used and the range
 * is given in the note. Rupee conversions of dollar figures use the year's
 * average rate and are marked ≈.
 */

export type Kind = 'protest' | 'riot' | 'state' | 'grift';

/** Validated categorical palette (light surface #fcfcfb). Grift sits below 3:1
 *  contrast, so it is always drawn with a visible label beside it. */
export const KIND: Record<Kind, { label: string; color: string }> = {
  protest: { label: 'Protest', color: '#2a78d6' },
  riot: { label: 'Riot', color: '#eb6834' },
  state: { label: 'State response', color: '#4a3aa7' },
  grift: { label: 'Grift', color: '#eda100' },
};
export const KIND_ORDER: Kind[] = ['protest', 'riot', 'state', 'grift'];

export interface Pt { x: number; v: number; note?: string }

/** NCRB, Crime in India: cases registered under rioting, all India. */
export const RIOTS: Pt[] = [
  { x: 2016, v: 61974 }, { x: 2017, v: 58880 }, { x: 2018, v: 57828 }, { x: 2019, v: 45985 },
  { x: 2020, v: 51606 }, { x: 2021, v: 41954 }, { x: 2022, v: 37816, note: '66.2% of 57,082 offences against public tranquillity' },
];

/** Access Now #KeepItOn: internet shutdowns ordered in India. */
export const SHUTDOWNS_IN: Pt[] = [
  { x: 2016, v: 30 }, { x: 2017, v: 69 }, { x: 2018, v: 134, note: 'India first in the world' }, { x: 2019, v: 121 },
  { x: 2020, v: 109 }, { x: 2021, v: 106 }, { x: 2022, v: 84 }, { x: 2023, v: 116, note: 'most in the world; Manipur cut off for months' },
  { x: 2024, v: 84, note: 'second to Myanmar (85)' }, { x: 2025, v: 65, note: 'still the most of any democracy' },
];

/** Access Now: shutdowns worldwide (only the years checked against the reports). */
export const SHUTDOWNS_WORLD: Pt[] = [
  { x: 2022, v: 187, note: '35 countries' }, { x: 2023, v: 283, note: '39 countries' },
  { x: 2024, v: 296, note: '54 countries' }, { x: 2025, v: 313, note: '52 countries; 125 tied to conflict' },
];

/** Access Now: shutdowns that came alongside violence, worldwide. */
export const SHUTDOWNS_VIOLENCE: Pt[] = [
  { x: 2019, v: 75 }, { x: 2020, v: 99 }, { x: 2021, v: 112 }, { x: 2022, v: 133 },
];

/** I4C / MHA: money reported lost to cyber fraud, ₹ crore. */
export const CYBER_LOSS: Pt[] = [
  { x: 2023, v: 7465 }, { x: 2024, v: 22846, note: '≈206% more than 2023' },
];
/** National Cybercrime Reporting Portal complaints, lakh. */
export const CYBER_COMPLAINTS: Pt[] = [
  { x: 2022, v: 10.29 }, { x: 2023, v: 15.96 }, { x: 2024, v: 22.68 },
];

/** "The bill": measured or estimated costs, ₹ crore. Not additive. */
export interface Bill { label: string; v: number; kind: Kind; note: string; src: string }
export const BILL: Bill[] = [
  { label: 'Cyber fraud, 2024', v: 22846, kind: 'grift', note: 'Losses reported to I4C in one year', src: 'i4c' },
  { label: 'Jat quota agitation, 2016', v: 20000, kind: 'riot', note: 'ASSOCHAM estimate for Haryana; other estimates run to ₹34,000 cr', src: 'jat' },
  { label: 'Internet shutdowns, 2023', v: 4835, kind: 'state', note: '≈ ₹ from $585.4M (Top10VPN), 7,812 hours', src: 'top10' },
  { label: 'Toll lost, farm stir 2020–21', v: 2731, kind: 'protest', note: 'NHAI: plazas shut in Punjab, Haryana, Rajasthan', src: 'nhai' },
  { label: 'Internet shutdowns, 2024', v: 2695, kind: 'state', note: '≈ ₹ from $322M (Top10VPN)', src: 'top10' },
  { label: 'Punjab rail blockade, 2020', v: 2220, kind: 'protest', note: 'Railways’ own figure for lost freight and passenger revenue', src: 'rail' },
];

export interface Incident {
  id: string; name: string; year: number; end?: number; place: string; region: 'India' | 'World';
  kind: Kind; deaths?: number; deathsNote?: string; cost?: string; trigger: string; detail: string; src: string[];
}

/** The ledger. Deaths are the lowest official or UN count; blank means no
 *  reliable count was found, not zero. */
export const INCIDENTS: Incident[] = [
  { id: 'jat', name: 'Jat quota agitation', year: 2016, place: 'Haryana', region: 'India', kind: 'riot', deaths: 30,
    cost: '₹20,000 cr+ (ASSOCHAM)', trigger: 'Demand for OBC reservation',
    detail: 'Roads and rail cut for days; shops, schools and a minister’s house set on fire; Delhi’s water from the Munak canal shut off.', src: ['jat', 'jatw'] },
  { id: 'lynch', name: 'WhatsApp rumour lynchings', year: 2017, end: 2018, place: 'Jharkhand, Maharashtra, Assam, Tripura +', region: 'India', kind: 'riot', deaths: 20,
    deathsNote: 'at least 19–20 in 2018 alone', trigger: 'Forwarded "child-kidnapper" videos',
    detail: 'Strangers beaten to death by villagers acting on forwarded clips. WhatsApp capped forwards in India at five chats in 2018.', src: ['lynch'] },
  { id: 'caa', name: 'CAA–NRC protests, Shaheen Bagh', year: 2019, end: 2020, place: 'Delhi and nationwide', region: 'India', kind: 'protest',
    trigger: 'Citizenship (Amendment) Act', cost: 'Kalindi Kunj road shut ~100 days',
    detail: 'A sit-in blocked a main road for about a hundred days. The Supreme Court later held that public ways cannot be occupied indefinitely.', src: ['sc'] },
  { id: 'delhi', name: 'North-east Delhi riots', year: 2020, place: 'Delhi', region: 'India', kind: 'riot', deaths: 53,
    cost: '185 homes, 468 shops, 747 vehicles damaged', trigger: 'Clashes over the CAA',
    detail: '53 dead and 473+ injured; 19 places of worship damaged, according to a Delhi Police affidavit.', src: ['delhi'] },
  { id: 'farm', name: 'Farmers’ agitation', year: 2020, end: 2021, place: 'Delhi borders, Punjab, Haryana', region: 'India', kind: 'protest',
    cost: '₹3,000–3,500 cr a day (ASSOCHAM est.)', trigger: 'Three farm laws',
    detail: 'A year-long camp at Delhi’s borders; NHAI lost ₹2,731 cr in tolls and Punjab’s railways ₹2,220 cr. The laws were repealed in November 2021.', src: ['assocham', 'nhai', 'rail'] },
  { id: 'agni', name: 'Agnipath protests', year: 2022, place: 'Bihar, UP, Telangana +', region: 'India', kind: 'riot', deaths: 1,
    cost: '₹12 cr at Secunderabad station alone', trigger: 'Short-service army recruitment',
    detail: 'At least four trains set on fire; 300+ trains affected and 200+ cancelled in a few days.', src: ['agni'] },
  { id: 'manipur', name: 'Manipur ethnic violence', year: 2023, end: 2025, place: 'Manipur', region: 'India', kind: 'riot', deaths: 258,
    deathsNote: '258 by the government’s count (Nov 2024); other counts exceed 300', cost: '4,786 houses burnt; 60,000 displaced',
    trigger: 'High Court order on Meitei ST status; a tribal march', detail: '386 religious structures vandalised; the state had 5,421 rioting cases in 2023 and months without mobile internet.', src: ['manipur', 'krc'] },
  { id: 'us', name: 'George Floyd unrest', year: 2020, place: 'United States', region: 'World', kind: 'riot',
    cost: '$1–2 bn insured losses', trigger: 'A police killing filmed on a phone',
    detail: 'The first civil disorder to pass $1 bn in insured losses, beating Los Angeles 1992 ($1.4 bn in today’s money).', src: ['ins'] },
  { id: 'lanka', name: 'Aragalaya', year: 2022, place: 'Sri Lanka', region: 'World', kind: 'protest',
    trigger: 'Default, fuel and food shortages', detail: 'Crowds occupied the president’s house; the president fled and resigned.', src: ['carnegie'] },
  { id: 'bd', name: 'July uprising', year: 2024, place: 'Bangladesh', region: 'World', kind: 'protest', deaths: 1400,
    deathsNote: 'about 1,400 (OHCHR), most killed by security forces; 12–13% were children', trigger: 'Job quota ruling',
    detail: 'The government fell in five weeks. The UN found most deaths were caused by the state’s crackdown, not by protesters.', src: ['ohchr'] },
  { id: 'kenya', name: 'Finance Bill protests', year: 2024, place: 'Kenya', region: 'World', kind: 'protest',
    trigger: 'Tax rises', detail: 'Organised on TikTok and X; part of Parliament was set alight and the bill was withdrawn.', src: ['carnegie'] },
  { id: 'nepal', name: 'Gen Z uprising', year: 2025, place: 'Nepal', region: 'World', kind: 'riot', deaths: 76,
    deathsNote: '76 dead, 2,660 injured', cost: '1,254 govt offices, 452 police posts damaged',
    trigger: 'Ban on 26 social platforms', detail: 'Parliament and Singha Durbar burnt within two days; 259 party offices and 458 private buildings damaged. The prime minister resigned.', src: ['nepal', 'nepalk'] },
];

export interface Quote { text: string; who: string; work: string; note?: string }
export const QUOTES: Record<string, Quote> = {
  devil: { text: 'Mass movements can rise and spread without belief in a God, but never without belief in a devil.', who: 'Eric Hoffer', work: 'The True Believer, 1951' },
  hatred: { text: 'Passionate hatred can give meaning and purpose to an empty life.', who: 'Eric Hoffer', work: 'The True Believer, 1951' },
  faith: { text: 'Faith in a holy cause is to a considerable extent a substitute for the lost faith in ourselves.', who: 'Eric Hoffer', work: 'The True Believer, 1951' },
  racket: { text: 'What starts out here as a mass movement ends up as a racket, a cult, or a corporation.', who: 'Eric Hoffer', work: 'The Temper of Our Time, 1967',
    note: 'Often quoted as "every great cause begins as a movement, becomes a business, and eventually degenerates into a racket", a paraphrase.' },
  words: { text: 'The men of words are of diverse types. They can be priests, scribes, prophets, writers, artists, professors, students and intellectuals in general.', who: 'Eric Hoffer', work: 'The True Believer, 1951' },
  ressent: { text: 'The slaves’ revolt in morality begins when resentment itself becomes creative and gives birth to values.', who: 'Friedrich Nietzsche', work: 'On the Genealogy of Morals, 1887' },
  shigalyov: { text: 'Starting from unlimited freedom, I arrive at unlimited despotism.', who: 'Shigalyov, in Fyodor Dostoevsky’s Demons', work: '1872, tr. Constance Garnett' },
  sick: { text: 'I am a sick man . . . I am a wicked man.', who: 'Fyodor Dostoevsky', work: 'Notes from Underground, 1864' },
  lebon: { text: 'In crowds it is stupidity and not mother-wit that is accumulated.', who: 'Gustave Le Bon', work: 'The Crowd, 1895' },
  ambedkar: { text: 'Where constitutional methods are open, there can be no justification for these unconstitutional methods. These methods are nothing but the Grammar of Anarchy.', who: 'B. R. Ambedkar', work: 'Constituent Assembly, 25 November 1949' },
  court: { text: 'Public ways and public spaces cannot be occupied in such a manner and that too indefinitely.', who: 'Supreme Court of India', work: 'Amit Sahni v. Commissioner of Police, 7 October 2020' },
};

export interface Source { id: string; title: string; url: string }
export const SOURCES: Source[] = [
  { id: 'ncrb', title: 'NCRB, Crime in India 2022, vol. 1', url: 'https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1701607577CrimeinIndia2022Book1.pdf' },
  { id: 'krc', title: 'NCRB 2023: Manipur tops the North-east in rioting cases (KRC Times)', url: 'https://www.krctimes.com/news/manipur-tops-northeast-in-violent-crimes-rioting-cases-in-2023-ncrb/' },
  { id: 'an22', title: 'Access Now, Internet shutdowns in 2022', url: 'https://www.accessnow.org/internet-shutdowns-2022/' },
  { id: 'an23', title: 'Access Now, India and internet shutdowns in 2023', url: 'https://www.accessnow.org/press-release/india-keepiton-internet-shutdowns-2023-en/' },
  { id: 'an24', title: 'Access Now, Internet shutdowns in 2024', url: 'https://www.accessnow.org/internet-shutdowns-2024/' },
  { id: 'an25', title: 'Access Now, Internet shutdowns in 2025', url: 'https://www.accessnow.org/internet-shutdowns-2025/' },
  { id: 'top10', title: 'Top10VPN, The cost of internet shutdowns 2023', url: 'https://www.top10vpn.com/research/cost-of-internet-shutdowns/2023/' },
  { id: 'brady', title: 'Brady et al., Emotion shapes the diffusion of moralized content, PNAS 2017', url: 'https://www.pnas.org/doi/10.1073/pnas.1618923114' },
  { id: 'rathje', title: 'Rathje, Van Bavel & van der Linden, Out-group animosity drives engagement on social media, PNAS 2021', url: 'https://ui.adsabs.harvard.edu/abs/2021PNAS..11824292R/abstract' },
  { id: 'dr', title: 'DataReportal, India reports', url: 'https://datareportal.com/reports/tag/India' },
  { id: 'acled', title: 'ACLED, Demonstrations in India', url: 'https://acleddata.com/report/demonstrations-india' },
  { id: 'ortiz', title: 'Ortiz et al., World Protests: 2006–2020 (Palgrave, open access)', url: 'https://link.springer.com/book/10.1007/978-3-030-88513-7' },
  { id: 'carnegie', title: 'Carnegie Endowment, Global Protest Tracker', url: 'https://carnegieendowment.org/features/global-protest-tracker' },
  { id: 'carn25', title: 'Carnegie, Global protests in 2025', url: 'https://carnegieendowment.org/emissary/2025/12/global-protests-2025-genz-corruption-economy' },
  { id: 'gpi', title: 'Institute for Economics & Peace, Global Peace Index 2024', url: 'https://www.economicsandpeace.org/wp-content/uploads/2024/06/GPI-2024-web.pdf' },
  { id: 'ins', title: 'WEF, How the 2020 protests changed insurance', url: 'https://www.weforum.org/stories/2021/02/2020-protests-changed-insurance-forever/' },
  { id: 'assocham', title: 'Business Today, Farmers’ protest costing ₹3,500 crore a day: ASSOCHAM', url: 'https://www.businesstoday.in/current/economy-politics/farmers-protest-resulting-in-losses-of-rs-3500-crore-everydayassocham/story/424952.html' },
  { id: 'phd', title: 'Deccan Herald, ₹70,000 crore loss in Q3 from the agitation: PHDCCI', url: 'https://www.deccanherald.com/amp/story/india%2Fover-rs-70000-crore-economic-loss-in-q3-due-to-farmers-agitation-phdcci-933751.html' },
  { id: 'nhai', title: 'Tribune, NHAI lost ₹2,731 crore during farmers’ stir', url: 'https://www.tribuneindia.com/news/nation/nhai-lost-rs-2-731-cr-during-farmers-stir-345283' },
  { id: 'rail', title: 'Deccan Herald, Railways lost ₹2,220 crore to the Punjab protest', url: 'https://www.deccanherald.com/amp/story/india%2Fsuffered-loss-of-rs-2220-crore-due-to-farmers-protest-in-punjab-railways-918025.html' },
  { id: 'jat', title: 'DNA, Jat agitation: Haryana lost ₹20,000 crore, says ASSOCHAM', url: 'https://www.dnaindia.com/business/report-jat-agitation-haryana-suffers-loss-of-rs-20000-crore-says-assocham-2180464' },
  { id: 'jatw', title: 'Scroll, Jat violence: what happened in Haryana', url: 'https://scroll.in/article/804313/jat-violence-what-exactly-happened-in-haryana-and-why' },
  { id: 'agni', title: 'Business Standard, One killed, trains torched as Agnipath protests spread', url: 'https://www.business-standard.com/article/current-affairs/one-killed-trains-torched-as-agnipath-protests-spread-across-india-122061700716_1.html' },
  { id: 'delhi', title: 'Delhi riots: police affidavit figures (LawChakra)', url: 'https://lawchakra.in/legal-updates/delhi-riots-february-2020/' },
  { id: 'sc', title: 'Deccan Herald, Shaheen Bagh verdict: public places cannot be occupied indefinitely', url: 'https://www.deccanherald.com/india/shaheen-bagh-verdict-public-places-cannot-be-occupied-indefinitely-898452.html' },
  { id: 'manipur', title: 'Scroll, Manipur: more than 300 killed since 2023', url: 'https://scroll.in/latest/1095523/manipur-more-than-300-killed-49-missing-since-2023-violence' },
  { id: 'crisis', title: 'Crisis Group, Finding a way out of Manipur’s festering conflict', url: 'https://www.crisisgroup.org/rpt/asia/south-asia/india/346-finding-way-out-festering-conflict-indias-manipur' },
  { id: 'lynch', title: 'CNN, WhatsApp rumours and lynchings in India (2018)', url: 'https://www.cnn.com/2018/07/02/asia/india-lynching-whatsapp-intl/' },
  { id: 'ohchr', title: 'Dhaka Tribune on the OHCHR report: 1,400 killed in July uprising', url: 'https://www.dhakatribune.com/bangladesh/373524/un-report-1-400-people-killed-in-july-uprising' },
  { id: 'nepal', title: 'ABC, Nepal’s Gen Z protests cause millions in damage', url: 'https://www.abc.net.au/news/2025-09-16/nepal-gen-z-protests-cause-millions-of-dollars-in-damage/105781578' },
  { id: 'nepalk', title: 'Kathmandu Post, A third of torched buildings fully destroyed', url: 'https://kathmandupost.com/national/2025/10/09/a-third-of-buildings-torched-in-gen-z-protests-fully-destroyed' },
  { id: 'i4c', title: 'Telangana Today, Indians lost ₹22,845 crore to cyber fraud in 2024', url: 'https://telanganatoday.com/indians-lost-a-whopping-rs-22845-crore-to-cyber-fraud-in-2024-govt' },
  { id: 'ads', title: 'The Quint, Digital ad spending in the 2024 Lok Sabha elections', url: 'https://www.thequint.com/elections/digital-advertisement-spending-lok-sabha-elections-2024-political-parties' },
  { id: 'adsm', title: 'BOOM, BJP and Congress ads on Meta, Google, Snap', url: 'https://www.boomlive.in/news/bjp-congress-ads-meta-google-snap-spotify-lok-sabha-elections-25618' },
  { id: 'fcra', title: 'Tribune, FCRA licences of 16,000 NGOs cancelled', url: 'https://www.tribuneindia.com/news/india/fcra-licences-of-16-000-ngos-cancelled-in-9-years-582883' },
  { id: 'gfm', title: 'The Hill, GoFundMe CEO: under 1% of campaigns are fraud', url: 'https://thehill.com/blogs/blog-briefing-room/news/437958-gofundme-ceo-says-less-than-1-percent-of-campaigns-are-fraud/' },
  { id: 'cbs', title: 'CBS, Crowdfunding sites and fraud', url: 'https://www.cbsnews.com/amp/news/crowdfunding-sites-gofundme-youcaring-fraud-unregulated-ftc' },
  { id: 'hoffer', title: 'Eric Hoffer, The Temper of Our Time (quotations)', url: 'https://www.goodreads.com/work/quotes/1210985-the-temper-of-our-time' },
  { id: 'demons', title: 'Dostoevsky, The Possessed / Demons, tr. Garnett (Project Gutenberg)', url: 'https://www.gutenberg.org/ebooks/8117' },
  { id: 'crowd', title: 'Le Bon, The Crowd (Project Gutenberg)', url: 'https://www.gutenberg.org/ebooks/445' },
];
export const SRC = Object.fromEntries(SOURCES.map((s) => [s.id, s])) as Record<string, Source>;
