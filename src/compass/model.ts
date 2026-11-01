/**
 * Twelve-Point Compass: an original twelve-axis political values model.
 *
 * Every axis runs 0–100 from its first pole to its second. Neither end is
 * "right": the poles are named for what someone at that end wants. Questions
 * are statements answered from strongly disagree to strongly agree; each one
 * pushes a single axis towards one pole.
 */

export type AxisId = 'econ' | 'welfare' | 'trade' | 'liberty' | 'power' | 'center' | 'values' | 'faith' | 'nation' | 'world' | 'force' | 'eco';
export type GroupId = 'economy' | 'state' | 'society' | 'world';

export interface Axis {
  id: AxisId;
  group: GroupId;
  name: string;
  low: string;
  high: string;
  lowNote: string;
  highNote: string;
  question: string;
}

export const GROUPS: { id: GroupId; name: string; note: string }[] = [
  { id: 'economy', name: 'Economy', note: 'Who owns, who pays, who trades' },
  { id: 'state', name: 'State', note: 'How power is held and checked' },
  { id: 'society', name: 'Society', note: 'Family, faith and belonging' },
  { id: 'world', name: 'World', note: 'Allies, arms and the planet' },
];

export const AXES: Axis[] = [
  { id: 'econ', group: 'economy', name: 'Ownership', low: 'Planned', high: 'Market', question: 'Who should run the economy?',
    lowNote: 'Public ownership of key industries and state planning of what gets made.', highNote: 'Private enterprise, competition and prices set by supply and demand.' },
  { id: 'welfare', group: 'economy', name: 'Redistribution', low: 'Self-reliance', high: 'Welfare', question: 'How much should the state share out?',
    lowNote: 'Low taxes, small benefits, and help coming from family, work and charity.', highNote: 'High taxes on high earners, universal services and a strong safety net.' },
  { id: 'trade', group: 'economy', name: 'Trade', low: 'Open', high: 'Protected', question: 'Should borders be open to goods and capital?',
    lowNote: 'Free trade, open investment and buying wherever is cheapest.', highNote: 'Tariffs, home production of strategic goods and limits on foreign ownership.' },
  { id: 'liberty', group: 'state', name: 'Liberty', low: 'Liberty', high: 'Order', question: 'How far should the state police daily life?',
    lowNote: 'Privacy, free speech, the right to protest and personal choices left alone.', highNote: 'Strong policing, surveillance and limits on speech for the sake of security.' },
  { id: 'power', group: 'state', name: 'Power', low: 'Pluralist', high: 'Strongman', question: 'Should power be checked or concentrated?',
    lowNote: 'Competitive elections, independent courts, a free press and term limits.', highNote: 'A strong leader or single party able to act without courts, parliament or press in the way.' },
  { id: 'center', group: 'state', name: 'Centralism', low: 'Local', high: 'Central', question: 'Where should decisions be made?',
    lowNote: 'Federalism, devolution and self-government for regions and cities.', highNote: 'One national government setting one standard for everyone.' },
  { id: 'values', group: 'society', name: 'Morality', low: 'Progressive', high: 'Traditional', question: 'Should social norms change or hold?',
    lowNote: 'Equal marriage, legal abortion and changing ideas of family and gender.', highNote: 'Traditional family, inherited norms and caution about social change.' },
  { id: 'faith', group: 'society', name: 'Faith', low: 'Secular', high: 'Religious', question: 'What place should religion have in public life?',
    lowNote: 'Religion kept out of law, schools and government.', highNote: 'Religious values shaping law, education and national identity.' },
  { id: 'nation', group: 'society', name: 'Belonging', low: 'Cosmopolitan', high: 'National', question: 'Who belongs, and how many should come?',
    lowNote: 'Open immigration, refuge for those in danger and many cultures side by side.', highNote: 'Low immigration, one national culture and citizens first.' },
  { id: 'world', group: 'world', name: 'Sovereignty', low: 'Multilateral', high: 'Sovereign', question: 'Should countries pool power or keep it?',
    lowNote: 'International institutions, treaties, courts and aid.', highNote: 'National decisions free of foreign courts, treaties and bodies.' },
  { id: 'force', group: 'world', name: 'Force', low: 'Restraint', high: 'Force', question: 'When should a country use its military?',
    lowNote: 'Diplomacy, negotiation and caution about arms and war.', highNote: 'Military strength, high defence spending and willingness to use force.' },
  { id: 'eco', group: 'world', name: 'Planet', low: 'Growth', high: 'Ecology', question: 'Growth or the environment, when they clash?',
    lowNote: 'Cheap energy, development and jobs first; technology will handle the rest.', highNote: 'Rapid cuts to emissions and protection of nature, even at a cost to growth.' },
];

export const AXIS = Object.fromEntries(AXES.map((a) => [a.id, a])) as Record<AxisId, Axis>;

export interface Question { id: string; axis: AxisId; dir: 1 | -1; text: string; cue: string; agree: string; disagree: string }

/**
 * dir 1: agreeing moves towards the axis's second pole; -1: towards the first.
 * cue explains the statement in plain words; agree and disagree give a real
 * country whose law or policy looks like each answer. They are illustrations,
 * not endorsements.
 */
type QDef = { axis: AxisId; dir: 1 | -1; text: string; cue: string; agree: string; disagree: string };
const Q: QDef[] = [
  { axis: 'econ', dir: 1, text: 'Most industries are run better by private companies than by the government.',
    cue: 'Who should own businesses such as telecoms, airlines and utilities: private shareholders or the state?',
    agree: 'The UK sold British Telecom (1984), British Gas (1986) and its water companies (1989) to private investors.',
    disagree: 'Norway’s state owns about two-thirds of Equinor, its biggest oil and gas company.' },
  { axis: 'econ', dir: 1, text: 'Cutting regulations on business usually does more good than harm.',
    cue: 'Rules protect consumers, workers and nature, but each one adds cost and paperwork for firms.',
    agree: 'Argentina’s Decree 70/2023 repealed or loosened hundreds of economic rules at once.',
    disagree: 'The EU’s GDPR (2018) put strict data-protection duties on any firm handling Europeans’ data.' },
  { axis: 'econ', dir: 1, text: 'Prices set by supply and demand are fairer than prices set by officials.',
    cue: 'Should prices of things like rent, fuel and bread follow the market, or be capped by the state?',
    agree: 'India freed petrol prices in 2010 and diesel prices in 2014 to follow the market.',
    disagree: 'Berlin froze most rents in 2020, until Germany’s Constitutional Court struck the law down in 2021.' },
  { axis: 'econ', dir: -1, text: 'Key industries such as energy and railways should be publicly owned.',
    cue: 'Some say natural monopolies like rail and power grids work best in public hands; others say private firms run them better.',
    agree: 'France fully renationalised its electricity company, EDF, in 2023.',
    disagree: 'Japan privatised Japan National Railways in 1987, splitting it into regional JR companies.' },
  { axis: 'econ', dir: -1, text: 'The government should plan which parts of the economy grow.',
    cue: 'Industrial policy means the state choosing sectors, like chips or green energy, to fund and protect.',
    agree: 'China’s Made in China 2025 plan (2015) targeted ten high-tech sectors for state support.',
    disagree: 'New Zealand ended most farm subsidies in the 1980s, leaving farmers to the market.' },
  { axis: 'econ', dir: -1, text: 'Companies that dominate their market should be broken up or brought under public control.',
    cue: 'Antitrust law decides what happens when one company controls most of a market.',
    agree: 'The US broke up AT&T’s telephone monopoly in 1984.',
    disagree: 'A US appeals court overturned the order to break up Microsoft in 2001, leaving the company whole.' },
  { axis: 'welfare', dir: 1, text: 'Healthcare should be free when you use it, paid for through taxes.',
    cue: 'Tax-funded systems pay for care out of general taxes; insurance systems rely on premiums and charges.',
    agree: 'The UK’s NHS has provided care free at the point of use since 1948.',
    disagree: 'In the US most people under 65 are covered by private insurance, often through their employer.' },
  { axis: 'welfare', dir: 1, text: 'People with very high incomes should pay a much larger share of tax.',
    cue: 'A progressive tax charges higher rates on higher incomes; a flat tax charges everyone the same rate.',
    agree: 'Sweden’s top marginal income tax rate is above 50%.',
    disagree: 'Estonia has taxed personal income at a single flat rate since 1994.' },
  { axis: 'welfare', dir: 1, text: 'Unemployment benefits should be enough to live on decently.',
    cue: 'Generous benefits protect people between jobs; critics say they can slow the return to work.',
    agree: 'Denmark’s unemployment insurance replaces up to 90% of previous pay, up to a ceiling.',
    disagree: 'Regular US state unemployment benefits usually last up to 26 weeks and on average replace less than half of previous pay.' },
  { axis: 'welfare', dir: -1, text: 'Welfare payments mostly discourage people from working.',
    cue: 'Do benefits trap people out of work, or give them the security to find better work?',
    agree: 'The US 1996 welfare reform added work requirements and a five-year lifetime limit on cash aid.',
    disagree: 'In Finland’s 2017–2018 trial, unemployed people given an unconditional basic income worked slightly more and reported better well-being.' },
  { axis: 'welfare', dir: -1, text: 'Families, charities and communities should look after the poor more than the state does.',
    cue: 'Who should be the first source of help: the state, or family and civil society?',
    agree: 'Singapore’s Maintenance of Parents Act (1995) lets elderly parents claim support from their children.',
    disagree: 'Germany made long-term care for the elderly a public insurance entitlement in 1995.' },
  { axis: 'welfare', dir: -1, text: 'Lower taxes for everyone are better than more public services.',
    cue: 'The trade-off between how much tax people pay and how much the state provides.',
    agree: 'The United Arab Emirates levies no personal income tax.',
    disagree: 'France collects over 40% of GDP in taxes, among the highest in the OECD, and funds wide public services.' },
  { axis: 'trade', dir: 1, text: 'Tariffs on imports are a good way to protect jobs at home.',
    cue: 'Tariffs are taxes on imports. They shelter home industry but raise prices for buyers.',
    agree: 'The US imposed broad tariffs on most of its trading partners in 2025.',
    disagree: 'Singapore charges no import duty on almost all goods.' },
  { axis: 'trade', dir: 1, text: 'Medicine, chips and steel should be made at home even if that costs more.',
    cue: 'Supply chains broke during the pandemic, reviving the idea of making strategic goods at home.',
    agree: 'The US CHIPS Act (2022) set aside about $52 billion to bring chip-making home.',
    disagree: 'Singapore imports more than 90% of its food rather than trying to grow it.' },
  { axis: 'trade', dir: 1, text: 'Foreign companies should face limits on buying domestic firms and land.',
    cue: 'Screening rules let governments block foreign takeovers, especially of land or sensitive firms.',
    agree: 'Thailand bars foreigners from owning land outright, with narrow exceptions.',
    disagree: 'The UK let foreign buyers take over major firms such as Cadbury (2010) and ARM (2016).' },
  { axis: 'trade', dir: -1, text: 'Free trade agreements make most people better off.',
    cue: 'Trade deals cut tariffs between countries. Most economists see overall gains, but some industries and towns lose.',
    agree: 'The EU single market has removed tariffs and most trade barriers between member states since 1993.',
    disagree: 'India stayed out of the RCEP Asian trade pact in 2019 to protect its farmers and industry.' },
  { axis: 'trade', dir: -1, text: 'Shoppers should be free to buy the cheapest goods, wherever they are made.',
    cue: 'Whose interest comes first: buyers who want low prices, or producers who want protection?',
    agree: 'Hong Kong is a free port with no tariffs on most goods.',
    disagree: 'Japan charges a tariff of about 778% on imported rice above a set quota.' },
  { axis: 'trade', dir: -1, text: 'Factories moving abroad is a normal part of a healthy economy.',
    cue: 'Offshoring moves production to cheaper countries: lower prices and higher profits, but lost jobs at home.',
    agree: 'Apple designs iPhones in California and has them assembled mostly in China and, increasingly, India.',
    disagree: 'The US Inflation Reduction Act (2022) tied electric-car tax credits to North American assembly.' },
  { axis: 'liberty', dir: 1, text: 'Police should get more powers, even if that means less privacy.',
    cue: 'Powers such as stop-and-search, longer detention and phone access help catch criminals but can be misused.',
    agree: 'The UK’s Investigatory Powers Act (2016) allows bulk collection of communications data.',
    disagree: 'The US Supreme Court ruled in 2018 (Carpenter) that police generally need a warrant for phone location records.' },
  { axis: 'liberty', dir: 1, text: 'Mass surveillance is acceptable if it prevents terrorism and crime.',
    cue: 'Cameras, facial recognition and data collection on everyone, not only on suspects.',
    agree: 'China runs one of the world’s largest networks of CCTV and facial-recognition cameras.',
    disagree: 'The EU’s AI Act (2024) bans most real-time facial recognition by police in public places.' },
  { axis: 'liberty', dir: 1, text: 'Offensive or dangerous speech should be restricted by law.',
    cue: 'Hate-speech laws protect groups from abuse; free-speech advocates say they let the state decide what may be said.',
    agree: 'Germany’s Network Enforcement Act (2017) makes large platforms remove clearly illegal hate speech within 24 hours.',
    disagree: 'The US First Amendment protects even hateful speech unless it incites imminent violence (Brandenburg v. Ohio, 1969).' },
  { axis: 'liberty', dir: -1, text: 'Adults should be free to use drugs as long as they harm no one else.',
    cue: 'Should drug use be treated as a personal or health matter, or as a crime?',
    agree: 'Portugal decriminalised possession of all drugs for personal use in 2001.',
    disagree: 'Singapore imposes the death penalty for trafficking above set amounts.' },
  { axis: 'liberty', dir: -1, text: 'Protest should be allowed even when it disrupts daily life.',
    cue: 'Marches and blockades disrupt traffic and business; how much disruption should a free society accept?',
    agree: 'Chile’s mass protests in 2019 brought cities to a standstill and led to a referendum on a new constitution.',
    disagree: 'The UK’s Public Order Act 2023 created offences such as “locking on” and widened police powers over disruptive protest.' },
  { axis: 'liberty', dir: -1, text: 'The state should need a judge’s warrant to read anyone’s messages.',
    cue: 'A warrant puts a judge between investigators and private communications.',
    agree: 'The US Fourth Amendment requires warrants based on probable cause for most searches.',
    disagree: 'Russia’s 2016 Yarovaya laws require telecoms to store users’ communications and give security services access.' },
  { axis: 'power', dir: 1, text: 'A country sometimes needs a strong leader who can act without waiting for parliament or the courts.',
    cue: 'Supporters point to speed in a crisis; critics fear unchecked power.',
    agree: 'El Salvador has renewed a state of exception every month since 2022, suspending some rights to fight gangs.',
    disagree: 'Germany’s 1949 constitution was built to prevent one-man rule, with a strong constitutional court and federal checks.' },
  { axis: 'power', dir: 1, text: 'Results matter more than elections; a capable government is what counts.',
    cue: 'Some point to fast-growing countries without competitive elections; others say only elections keep rulers accountable.',
    agree: 'China’s leaders are chosen inside the Communist Party, not by national elections.',
    disagree: 'India has held national elections since 1951–52, now the largest in the world.' },
  { axis: 'power', dir: 1, text: 'One party governing for decades can give a country useful stability.',
    cue: 'Dominant-party systems can plan long term but risk complacency and corruption.',
    agree: 'Singapore’s People’s Action Party has won every general election since 1959.',
    disagree: 'Mexico’s PRI governed for 71 years; its defeat in 2000 is widely seen as the start of competitive democracy there.' },
  { axis: 'power', dir: -1, text: 'Courts must be able to overrule the government.',
    cue: 'Judicial review lets courts strike down laws or decisions that break the constitution.',
    agree: 'Israel’s Supreme Court struck down a law limiting its own powers in January 2024.',
    disagree: 'In the UK no court can strike down an Act of Parliament; parliament is sovereign.' },
  { axis: 'power', dir: -1, text: 'A free press that attacks the government is essential, even when it is unfair.',
    cue: 'Press freedom against fears of misinformation and hostile media.',
    agree: 'Norway has topped Reporters Without Borders’ press-freedom index every year since 2017.',
    disagree: 'Russia has labelled many independent outlets “foreign agents” or “undesirable”, forcing them to close or move abroad.' },
  { axis: 'power', dir: -1, text: 'Leaders should face strict limits on how long they can stay in office.',
    cue: 'Term limits force turnover; opponents say voters should decide.',
    agree: 'The US 22nd Amendment (1951) limits presidents to two elected terms.',
    disagree: 'China removed presidential term limits in 2018.' },
  { axis: 'center', dir: 1, text: 'The national government should set school and health policy for the whole country.',
    cue: 'One national system means equal standards; local control lets regions experiment and fit local needs.',
    agree: 'France sets a single national school curriculum.',
    disagree: 'In the US, states and local school districts run most schooling.' },
  { axis: 'center', dir: 1, text: 'Regions should never be allowed to break away from the country.',
    cue: 'Should a region be able to vote itself out of the country?',
    agree: 'Spain’s Constitutional Court declared Catalonia’s 2017 independence referendum illegal.',
    disagree: 'The UK agreed to a legal Scottish independence referendum in 2014; 55% voted to stay.' },
  { axis: 'center', dir: 1, text: 'One national rule is better than letting each region make its own laws.',
    cue: 'Uniform national law against regional differences on issues such as drugs, guns and abortion.',
    agree: 'Japan is a unitary state in which most law is made nationally.',
    disagree: 'Since 2022, abortion law in the US has been set state by state.' },
  { axis: 'center', dir: -1, text: 'Cities and regions should raise and spend most of their own taxes.',
    cue: 'Fiscal federalism: who raises the money and who spends it.',
    agree: 'Swiss cantons and municipalities set their own income tax rates.',
    disagree: 'In the UK most taxes are raised nationally and passed down to local councils.' },
  { axis: 'center', dir: -1, text: 'Decisions should be taken at the most local level possible.',
    cue: 'This principle is called subsidiarity.',
    agree: 'The EU’s treaties say it should act only where member states cannot achieve the aim well enough themselves.',
    disagree: 'Turkey’s 2017 referendum concentrated power in a national executive presidency.' },
  { axis: 'center', dir: -1, text: 'Regions with their own identity deserve wide self-government.',
    cue: 'Autonomy for regions with their own language, culture or history.',
    agree: 'Spain’s Basque Country collects its own taxes under its “economic agreement” with Madrid.',
    disagree: 'India ended Jammu and Kashmir’s special autonomous status in 2019.' },
  { axis: 'values', dir: 1, text: 'Marriage should be between one man and one woman.',
    cue: 'Whether same-sex couples can marry.',
    agree: 'Russia’s 2020 constitutional amendments define marriage as a union of a man and a woman.',
    disagree: 'The Netherlands became the first country to legalise same-sex marriage, in 2001.' },
  { axis: 'values', dir: 1, text: 'Children do best with a mother and a father at home.',
    cue: 'About family structure and policy, such as who may adopt.',
    agree: 'Hungary amended its constitution in 2020 to state that the mother is a woman and the father a man.',
    disagree: 'Same-sex couples can adopt jointly in countries including the UK, Canada, Spain and Brazil.' },
  { axis: 'values', dir: 1, text: 'Ideas about gender have changed too fast.',
    cue: 'About laws on gender identity, such as changing your legal sex by declaration.',
    agree: 'The UK Supreme Court ruled in 2025 that “sex” in the Equality Act means biological sex.',
    disagree: 'Germany’s Self-Determination Act (2024) lets adults change their legal gender by declaration at a registry office.' },
  { axis: 'values', dir: -1, text: 'Same-sex couples should have the same rights to marry and adopt as anyone else.',
    cue: 'Equal marriage and adoption rights regardless of the couple’s sex.',
    agree: 'The US Supreme Court legalised same-sex marriage nationwide in 2015 (Obergefell v. Hodges).',
    disagree: 'Same-sex relations are still a crime in countries including Saudi Arabia, Iran and Nigeria.' },
  { axis: 'values', dir: -1, text: 'Abortion should be legal in early pregnancy.',
    cue: 'Whether a woman can end a pregnancy on request in its first weeks.',
    agree: 'France wrote the freedom to have an abortion into its constitution in 2024.',
    disagree: 'The Philippines bans abortion in all circumstances.' },
  { axis: 'values', dir: -1, text: 'Traditions should be dropped when they no longer serve people.',
    cue: 'Change against continuity in customs and inherited rules.',
    agree: 'Saudi Arabia lifted its ban on women driving in 2018.',
    disagree: 'Japan keeps its imperial throne for men only.' },
  { axis: 'faith', dir: 1, text: 'Religious values should guide the country’s laws.',
    cue: 'Whether law should follow a religion’s teaching or stay neutral between beliefs.',
    agree: 'Iran’s constitution requires all laws to be based on Islamic criteria.',
    disagree: 'France’s 1905 law separated the churches from the state.' },
  { axis: 'faith', dir: 1, text: 'Schools should teach children a religion.',
    cue: 'Religious instruction or worship in state schools.',
    agree: 'State schools in England must hold a daily act of collective worship, mainly Christian in character.',
    disagree: 'US public schools may not lead prayers, after Engel v. Vitale (1962).' },
  { axis: 'faith', dir: 1, text: 'A nation needs a shared faith to hold it together.',
    cue: 'Is religion part of what makes a nation, or a private matter?',
    agree: 'Saudi Arabia’s Basic Law names the Quran and the Sunnah as its constitution.',
    disagree: 'India’s constitution has described the country as a secular republic since 1976.' },
  { axis: 'faith', dir: -1, text: 'Religion should be kept out of government entirely.',
    cue: 'A strict separation of religion and state.',
    agree: 'Turkey’s constitution defines it as a secular republic.',
    disagree: 'In England the monarch is Supreme Governor of the Church of England, and 26 bishops sit in the House of Lords.' },
  { axis: 'faith', dir: -1, text: 'Religious leaders should stay out of politics.',
    cue: 'Whether clergy should hold or seek political power.',
    agree: 'Mexico’s constitution bars ministers of religion from holding public office.',
    disagree: 'In Iran a senior cleric is Supreme Leader, the highest authority in the state.' },
  { axis: 'faith', dir: -1, text: 'Insulting a religion should never be a crime.',
    cue: 'Blasphemy laws punish speech that offends a religion.',
    agree: 'Ireland removed blasphemy from its constitution by referendum in 2018.',
    disagree: 'Pakistan’s blasphemy laws carry penalties up to death.' },
  { axis: 'nation', dir: 1, text: 'Immigration should be sharply reduced.',
    cue: 'How many people from other countries should be allowed to settle.',
    agree: 'Denmark has some of Europe’s strictest asylum rules, with an official aim of very few new asylum seekers.',
    disagree: 'Canada planned to admit about 485,000 new permanent residents in 2024.' },
  { axis: 'nation', dir: 1, text: 'Newcomers should adopt the national culture rather than keep their own.',
    cue: 'Assimilation into one national culture, or multiculturalism.',
    agree: 'France banned conspicuous religious symbols, including headscarves, in state schools in 2004.',
    disagree: 'Canada made multiculturalism official policy in 1971 and law in 1988.' },
  { axis: 'nation', dir: 1, text: 'Citizens should get priority over foreigners for jobs and housing.',
    cue: 'Whether the state should favour its own citizens in work and housing.',
    agree: 'Saudi Arabia’s Nitaqat programme requires firms to employ quotas of Saudi nationals.',
    disagree: 'EU law guarantees citizens of every member state equal treatment in jobs anywhere in the EU.' },
  { axis: 'nation', dir: -1, text: 'Immigration enriches a country’s culture.',
    cue: 'Whether migration adds to a country’s culture or strains it.',
    agree: 'Nearly a third of Australia’s residents were born overseas.',
    disagree: 'Japan admits relatively few immigrants; foreign residents are about 3% of its population.' },
  { axis: 'nation', dir: -1, text: 'People fleeing danger should be welcomed, even in large numbers.',
    cue: 'How open to be to refugees and asylum seekers.',
    agree: 'Germany took in more than a million asylum seekers in 2015–16.',
    disagree: 'Hungary built a border fence in 2015 to stop migrants crossing.' },
  { axis: 'nation', dir: -1, text: 'I feel more a citizen of the world than of my own country.',
    cue: 'Cosmopolitan identity against national loyalty.',
    agree: 'EU citizens can live and work in any member state and vote there in local elections.',
    disagree: 'India and China do not allow their citizens to hold a second nationality.' },
  { axis: 'world', dir: 1, text: 'International courts and bodies should have no power over my country’s laws.',
    cue: 'Whether outside institutions should be able to overrule national decisions.',
    agree: 'The US, China, Russia and India are not members of the International Criminal Court.',
    disagree: 'EU member states accept that EU law takes precedence over national law in EU matters.' },
  { axis: 'world', dir: 1, text: 'My country should leave international agreements that limit its choices.',
    cue: 'Treaties trade some freedom of action for cooperation.',
    agree: 'The UK left the European Union in 2020.',
    disagree: 'Finland and Sweden ended long military non-alignment to join NATO, in 2023 and 2024.' },
  { axis: 'world', dir: 1, text: 'Foreign aid is mostly money wasted.',
    cue: 'Whether aid to poorer countries works and is worth paying for.',
    agree: 'The US dismantled most of its aid agency, USAID, in 2025.',
    disagree: 'Norway and Sweden have long given around 1% of national income in aid.' },
  { axis: 'world', dir: -1, text: 'Global problems need global institutions with real powers.',
    cue: 'Climate, pandemics and trade cross borders; should international bodies have teeth?',
    agree: 'The WTO can authorise trade sanctions against members that break its rules.',
    disagree: 'The US announced its withdrawal from the World Health Organization in 2025.' },
  { axis: 'world', dir: -1, text: 'My country should accept the rulings of international courts, even against it.',
    cue: 'Whether to obey international courts when they rule against you.',
    agree: 'Japan stopped its Antarctic whaling programme after the International Court of Justice ruled against it in 2014.',
    disagree: 'China rejected the 2016 South China Sea arbitration ruling in favour of the Philippines.' },
  { axis: 'world', dir: -1, text: 'Rich countries should give more aid to poorer ones.',
    cue: 'The UN target is 0.7% of national income in aid.',
    agree: 'Norway and Luxembourg are among the few donors that meet the 0.7% target.',
    disagree: 'The UK cut its aid from 0.7% to 0.5% of national income in 2021 and announced a further cut to 0.3% by 2027.' },
  { axis: 'force', dir: 1, text: 'A strong military is the best guarantee of peace.',
    cue: 'Deterrence: being too strong to attack.',
    agree: 'Poland raised defence spending above 4% of GDP, the highest share in NATO.',
    disagree: 'Costa Rica abolished its army in 1948.' },
  { axis: 'force', dir: 1, text: 'It is sometimes right to use force to change another country’s government.',
    cue: 'Regime change by military force.',
    agree: 'In 2003 the US and the UK invaded Iraq and removed Saddam Hussein.',
    disagree: 'The UN Charter (1945) bans the use of force against another state’s territory or independence.' },
  { axis: 'force', dir: 1, text: 'Defence spending should rise even if other spending must fall.',
    cue: 'Guns or butter: what to cut to pay for defence.',
    agree: 'NATO members agreed in 2025 to raise defence spending to 5% of GDP by 2035.',
    disagree: 'Japan kept defence spending near 1% of GDP for decades.' },
  { axis: 'force', dir: -1, text: 'Wars almost always cause more harm than they prevent.',
    cue: 'Whether war can ever be the lesser evil.',
    agree: 'Japan’s constitution renounces war as a sovereign right (Article 9, 1947).',
    disagree: 'The Allied victory in the Second World War ended Nazi rule in Europe.' },
  { axis: 'force', dir: -1, text: 'Disputes between countries should be settled by talks, even with hostile regimes.',
    cue: 'Diplomacy with adversaries against isolation and pressure.',
    agree: 'The 2015 Iran nuclear deal was negotiated between Iran and six world powers.',
    disagree: 'The US withdrew from the Iran nuclear deal in 2018.' },
  { axis: 'force', dir: -1, text: 'My country should stop selling weapons abroad.',
    cue: 'Arms exports bring money and influence, and can fuel conflicts.',
    agree: 'Germany halted new arms exports to Saudi Arabia in 2018 after the killing of Jamal Khashoggi.',
    disagree: 'The US is the world’s largest arms exporter.' },
  { axis: 'eco', dir: 1, text: 'Fighting climate change should come before economic growth.',
    cue: 'When cutting emissions and growing the economy clash, which wins?',
    agree: 'The UK legislated a target of net-zero emissions by 2050 in 2019.',
    disagree: 'Australia remains one of the world’s largest coal exporters.' },
  { axis: 'eco', dir: 1, text: 'Fossil fuels should be phased out quickly, even if energy costs more.',
    cue: 'The speed of moving off coal, oil and gas.',
    agree: 'The UK closed its last coal power station, Ratcliffe-on-Soar, in 2024.',
    disagree: 'The US left the Paris agreement again in 2025 and expanded oil and gas drilling.' },
  { axis: 'eco', dir: 1, text: 'Protected nature should stay protected, whatever developers offer.',
    cue: 'Whether parks and protected land should ever give way to development.',
    agree: 'Costa Rica protects about a quarter of its land in national parks and reserves.',
    disagree: 'Brazil’s Congress passed a law loosening environmental licensing in 2025.' },
  { axis: 'eco', dir: -1, text: 'Environmental rules hold back jobs and development.',
    cue: 'Whether green rules cost jobs or create them.',
    agree: 'Canada ended its consumer carbon tax in 2025, citing the cost of living.',
    disagree: 'Germany’s renewable energy law (2000) helped build a large wind and solar industry.' },
  { axis: 'eco', dir: -1, text: 'Poorer countries should be free to burn coal and oil to grow, as rich ones did.',
    cue: 'Who should bear the cost of cutting emissions: countries that polluted first, or everyone?',
    agree: 'India still generates most of its electricity from coal.',
    disagree: 'Under the Paris agreement (2015), developing countries also set emissions targets.' },
  { axis: 'eco', dir: -1, text: 'Technology will solve environmental problems without changing how we live.',
    cue: 'Green technology against changes in how much we consume.',
    agree: 'Almost 9 in 10 new cars sold in Norway in 2024 were fully electric.',
    disagree: 'The Netherlands is paying farmers to close livestock farms to cut nitrogen pollution.' },
];

// a fixed shuffle so axes are mixed, the same order for everyone
function shuffled<T>(xs: T[], seed: number): T[] {
  const a = xs.slice();
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const QUESTIONS: Question[] = shuffled(Q.map((q, i) => ({ id: `q${i + 1}`, ...q })), 20261031);

export const CHOICES = [
  { v: 2, label: 'Strongly agree' },
  { v: 1, label: 'Agree' },
  { v: 0, label: 'Neutral' },
  { v: -1, label: 'Disagree' },
  { v: -2, label: 'Strongly disagree' },
] as const;

export type Answers = Record<string, number | null>; // null = not sure (skipped)
export type Scores = Record<AxisId, number | null>;

/** 0–100 per axis; null where every question on it was skipped. */
export function score(answers: Answers): Scores {
  const out = {} as Scores;
  for (const a of AXES) {
    const qs = QUESTIONS.filter((q) => q.axis === a.id && answers[q.id] != null);
    if (!qs.length) { out[a.id] = null; continue; }
    const sum = qs.reduce((s, q) => s + (answers[q.id] as number) * q.dir, 0);
    out[a.id] = Math.round(50 + (50 * sum) / (2 * qs.length));
  }
  return out;
}

export function band(v: number, a: Axis) {
  if (v <= 15) return `Strongly ${a.low.toLowerCase()}`;
  if (v <= 38) return `Leans ${a.low.toLowerCase()}`;
  if (v < 62) return 'Centre';
  if (v < 85) return `Leans ${a.high.toLowerCase()}`;
  return `Strongly ${a.high.toLowerCase()}`;
}

export type Vec = number[]; // 12 values in AXES order

export const toVec = (s: Scores): (number | null)[] => AXES.map((a) => s[a.id]);

/** Similarity 0–100 over the axes both sides have. */
export function similarity(a: (number | null)[], b: Vec) {
  let d = 0, n = 0;
  a.forEach((v, i) => { if (v != null) { d += (v - b[i]) ** 2; n++; } });
  if (!n) return 0;
  const rms = Math.sqrt(d / n); // 0 (same) .. 100 (opposite ends)
  return Math.max(0, Math.round(100 - rms * 1.25));
}

export interface Family { id: string; name: string; note: string; v: Vec }

/** Broad families of political thought, placed as typical positions. */
export const FAMILIES: Family[] = [
  { id: 'demsoc', name: 'Democratic socialism', note: 'Public ownership and a large welfare state, won through elections.', v: [20, 88, 60, 30, 20, 50, 25, 20, 30, 35, 20, 80] },
  { id: 'socdem', name: 'Social democracy', note: 'A market economy with high taxes, strong unions and universal services.', v: [40, 75, 40, 35, 20, 50, 30, 25, 35, 25, 35, 65] },
  { id: 'soclib', name: 'Social liberalism', note: 'Markets plus a safety net, open borders to trade and people, socially progressive.', v: [55, 60, 25, 30, 20, 45, 20, 20, 30, 20, 40, 65] },
  { id: 'centrist', name: 'Centrism', note: 'Pragmatic, pro-institution and pro-integration, wary of both left and right.', v: [60, 50, 25, 45, 25, 55, 35, 25, 40, 15, 50, 55] },
  { id: 'classlib', name: 'Classical liberalism', note: 'Free markets, limited government and individual freedom.', v: [80, 30, 15, 30, 20, 35, 40, 35, 40, 40, 45, 40] },
  { id: 'libertarian', name: 'Libertarianism', note: 'The smallest possible state in both the economy and private life.', v: [95, 10, 10, 10, 15, 15, 40, 30, 40, 60, 25, 25] },
  { id: 'chrdem', name: 'Christian democracy', note: 'A social market economy guided by Christian ideas of family and community.', v: [62, 55, 35, 50, 25, 40, 65, 65, 50, 30, 50, 50] },
  { id: 'conservative', name: 'Conservatism', note: 'Markets, tradition, order and gradual change.', v: [72, 35, 40, 62, 30, 55, 72, 60, 62, 50, 62, 35] },
  { id: 'natcon', name: 'National conservatism', note: 'Nation, faith and family first, sceptical of global bodies and migration.', v: [55, 45, 70, 72, 55, 70, 82, 68, 85, 78, 65, 30] },
  { id: 'rpop', name: 'Right-wing populism', note: 'The people against elites, with tight borders and protected industry.', v: [55, 50, 80, 75, 62, 65, 75, 58, 90, 82, 60, 22] },
  { id: 'lpop', name: 'Left-wing populism', note: 'The people against elites, with redistribution and economic sovereignty.', v: [25, 80, 72, 45, 55, 60, 40, 35, 50, 70, 30, 50] },
  { id: 'green', name: 'Green politics', note: 'Ecology first, with local democracy, peace and social justice.', v: [40, 70, 45, 25, 15, 25, 15, 15, 25, 15, 10, 95] },
  { id: 'anarchism', name: 'Anarchism', note: 'No state and no bosses: voluntary, local cooperation.', v: [15, 70, 40, 0, 0, 0, 10, 5, 5, 30, 5, 75] },
  { id: 'develop', name: 'Developmental authoritarianism', note: 'A strong state steering growth, order before freedom.', v: [55, 35, 55, 92, 92, 90, 70, 55, 75, 65, 80, 25] },
  { id: 'ml', name: 'Marxism–Leninism', note: 'One-party rule and a state-owned, planned economy.', v: [5, 65, 85, 95, 98, 95, 40, 5, 60, 80, 80, 25] },
  { id: 'theocracy', name: 'Theocracy', note: 'Religious law and clerical authority over the state.', v: [35, 50, 70, 95, 92, 85, 95, 100, 65, 85, 75, 30] },
  { id: 'authnat', name: 'Authoritarian nationalism', note: 'A strong leader and a strong state built around the nation, with elections and courts kept weak.', v: [40, 55, 72, 88, 90, 90, 68, 45, 88, 78, 75, 25] },
  { id: 'anticol', name: 'Anti-colonial socialism', note: 'National liberation and self-reliance through a state-led economy, usually under one party.', v: [15, 72, 80, 72, 82, 78, 45, 20, 65, 60, 55, 55] },
  { id: 'hindutva', name: 'Hindu nationalism (Hindutva)', note: 'India as a Hindu civilisational nation: cultural unity, a strong centre, a muscular state and suspicion of minority appeasement.', v: [58, 52, 62, 72, 68, 78, 75, 80, 92, 70, 78, 30] },
  { id: 'nehruvian', name: 'Nehruvian socialism', note: 'A planned, state-led economy, secularism, a strong union and non-alignment abroad.', v: [25, 70, 75, 40, 35, 72, 35, 15, 45, 55, 30, 40] },
  { id: 'ambedkarite', name: 'Ambedkarism', note: 'The annihilation of caste through constitutional rights, reservations, education and social democracy.', v: [35, 82, 50, 30, 20, 55, 12, 10, 38, 40, 30, 45] },
  { id: 'dravidian', name: 'Dravidian movement', note: 'Self-respect, rationalism, social justice and state autonomy, opposed to caste hierarchy and Hindi imposition.', v: [40, 82, 50, 40, 42, 12, 28, 10, 50, 48, 35, 48] },
  { id: 'gandhian', name: 'Gandhism', note: 'Non-violence, village self-rule, swadeshi and a moral, religious but tolerant public life.', v: [30, 62, 75, 25, 15, 10, 60, 70, 45, 30, 0, 88] },
  { id: 'lohiaite', name: 'Lohiaite socialism', note: 'Socialism built on backward-caste empowerment, anti-Congressism and Indian languages.', v: [30, 78, 62, 42, 42, 40, 42, 28, 58, 55, 40, 48] },
  { id: 'maoism', name: 'Maoism', note: 'Armed revolution by peasants against the state, landlords and capital.', v: [0, 75, 85, 85, 85, 60, 30, 0, 55, 80, 98, 55] },
  { id: 'neoliberal', name: 'Neoliberalism', note: 'Privatisation, deregulation, low taxes and free trade, with a state that enables markets.', v: [85, 25, 10, 50, 30, 55, 48, 38, 45, 20, 55, 30] },
  { id: 'islamdem', name: 'Muslim democracy', note: 'Religious values and minority rights pursued within a democratic constitution.', v: [45, 65, 50, 45, 38, 45, 75, 88, 42, 55, 40, 45] },
  { id: 'moderate', name: 'Moderate', note: 'No strong lean on most questions: weighing each issue on its merits, close to the middle of every axis.', v: [52, 55, 50, 50, 42, 50, 50, 45, 55, 45, 45, 55] },
  { id: 'fascism', name: 'Fascism', note: 'Total state power fused with ethnic nationalism, militarism and the cult of a leader.', v: [35, 42, 88, 99, 99, 96, 88, 55, 99, 96, 97, 30] },
];

/** Compact share code: one base-36 pair per axis, '--' for an axis left blank. */
export function encode(v: (number | null)[]) {
  return 'c1' + v.map((x) => (x == null ? '--' : Math.max(0, Math.min(100, x)).toString(36).padStart(2, '0'))).join('');
}
export function decode(code: string): (number | null)[] | null {
  const m = /^c1([0-9a-z-]{24})$/i.exec(code.trim());
  if (!m) return null;
  const out: (number | null)[] = [];
  for (let i = 0; i < 24; i += 2) {
    const s = m[1].slice(i, i + 2);
    if (s === '--') { out.push(null); continue; }
    const n = parseInt(s, 36);
    if (isNaN(n) || n > 100) return null;
    out.push(n);
  }
  return out;
}
