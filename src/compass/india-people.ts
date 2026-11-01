/**
 * Indian political and public figures on the twelve Compass axes.
 *
 * Placements are editorial judgements from each person's public record:
 * offices held, laws and campaigns, party, and statements reported in the
 * press. They are not drawn from private data or automated analysis of
 * social media. Figures with little political record are marked 'low'.
 * Offices checked against news reports on 1 November 2026.
 * v order: econ, welfare, trade, liberty, power, center, values, faith, nation, world, force, eco
 */
import type { AxisId, Vec } from './model';
import type { Leader } from './leaders';

type Rec = [string, string, AxisId[]];
const P = (
  id: string, name: string, era: 'indpol' | 'indpub', role: string, years: string, summary: string,
  v: Vec, confidence: Leader['confidence'], fam: string, school: string, record: Rec[], note?: string,
): Leader => ({
  id, name, country: 'India', region: 'Asia', era, role, years, summary, v, confidence, fam, school, note,
  wiki: `Special:Search?search=${encodeURIComponent(name)}`,
  record: record.map(([y, t, ax]) => ({ y, t, ax })),
});

export const INDIA_PEOPLE: Leader[] = [
  /* ------------------------------------------------------------- BJP and allies */
  P('amitshah', 'Amit Shah', 'indpol', 'Union Home Minister', '2019–', 'BJP strategist and Home Minister who carried the end of Kashmir’s special status and the citizenship amendment through Parliament.',
    [60, 50, 65, 85, 80, 85, 75, 82, 92, 72, 85, 25], 'high', 'hindutva', 'Hindutva (BJP)', [
      ['2019', 'Moved the resolution ending Article 370 and splitting Jammu and Kashmir into union territories', ['center', 'nation']],
      ['2019', 'Piloted the Citizenship Amendment Act through Parliament', ['faith', 'nation']],
      ['2023', 'Introduced the three new criminal codes replacing the colonial-era laws', ['liberty']],
    ]),
  P('yogi', 'Yogi Adityanath', 'indpol', 'Chief Minister of Uttar Pradesh', '2017–', 'Head priest of the Gorakhnath Math and BJP chief minister known for policing by “encounter”, anti-conversion law and renaming cities.',
    [55, 58, 65, 90, 85, 75, 88, 95, 92, 72, 88, 25], 'high', 'hindutva', 'Hindutva (Gorakhnath Math)', [
      ['2018', 'Renamed Allahabad as Prayagraj', ['nation', 'faith']],
      ['2021', 'Enacted Uttar Pradesh’s law against unlawful religious conversion, including by marriage', ['faith', 'liberty']],
      ['2023', 'State police reported 183 people killed in “encounters” since 2017', ['power', 'liberty']],
    ]),
  P('rajnath', 'Rajnath Singh', 'indpol', 'Union Defence Minister', '2019–', 'Former BJP president and Home Minister; as Defence Minister oversaw the Agnipath scheme and Operation Sindoor.',
    [60, 55, 62, 70, 60, 72, 72, 72, 85, 70, 82, 30], 'medium', 'hindutva', 'BJP', [
      ['2019', 'Said India’s no-first-use nuclear policy depends on future circumstances', ['force']],
      ['2022', 'Launched the Agnipath scheme of four-year military contracts', ['force', 'welfare']],
    ]),
  P('gadkari', 'Nitin Gadkari', 'indpol', 'Union Minister of Road Transport', '2014–', 'BJP minister known for building highways and expressways and for pragmatic, cross-party relations.',
    [65, 50, 50, 60, 50, 65, 65, 60, 70, 55, 60, 45], 'medium', 'conservative', 'BJP pragmatism', [
      ['2017', 'Launched the Bharatmala highway programme', ['econ']],
      ['2021', 'Pushed ethanol-blended fuel and flex-fuel vehicles', ['eco']],
    ]),
  P('sitharaman', 'Nirmala Sitharaman', 'indpol', 'Union Finance Minister', '2019–', 'India’s first full-time woman Finance Minister, behind corporate and income-tax cuts and GST rate cuts.',
    [68, 45, 60, 65, 60, 75, 65, 65, 80, 65, 70, 30], 'medium', 'conservative', 'BJP', [
      ['2019', 'Cut the corporate tax rate to 22% for existing companies', ['econ']],
      ['2025', 'Made income up to ₹12 lakh a year tax-free', ['econ', 'welfare']],
    ]),
  P('jaishankar', 'S. Jaishankar', 'indpol', 'Union External Affairs Minister', '2019–', 'Career diplomat turned BJP minister, voice of “strategic autonomy” and of buying Russian oil after 2022.',
    [62, 50, 60, 65, 60, 72, 62, 55, 82, 85, 70, 35], 'medium', 'conservative', 'Strategic autonomy', [
      ['2022', 'Defended buying Russian oil, saying Europe must grow out of the mindset that its problems are the world’s problems', ['world']],
      ['2025', 'Rejected third-party mediation with Pakistan after Operation Sindoor', ['world', 'force']],
    ]),
  P('himanta', 'Himanta Biswa Sarma', 'indpol', 'Chief Minister of Assam', '2021–', 'Former Congress minister who joined the BJP in 2015; known for crackdowns on child marriage and on illegal immigration. Re-elected in 2026.',
    [58, 55, 62, 82, 78, 70, 75, 80, 92, 72, 80, 30], 'high', 'hindutva', 'Hindutva (BJP)', [
      ['2023', 'Ordered a crackdown on child marriage with thousands of arrests', ['values', 'liberty']],
      ['2024', 'Repealed Assam’s 1935 law on registering Muslim marriages and divorces', ['faith']],
    ]),
  P('fadnavis', 'Devendra Fadnavis', 'indpol', 'Chief Minister of Maharashtra', '2014–2019, 2024–', 'BJP chief minister of Maharashtra, returned to office after the 2024 election.',
    [62, 55, 58, 70, 62, 65, 70, 70, 82, 65, 70, 35], 'medium', 'hindutva', 'BJP', [
      ['2018', 'Passed a law giving Marathas reservation in jobs and education', ['welfare']],
      ['2024', 'Became chief minister again after the Mahayuti alliance won the state', ['power']],
    ]),
  P('chouhan', 'Shivraj Singh Chouhan', 'indpol', 'Union Minister of Agriculture; former Chief Minister of Madhya Pradesh', '2005–2023 (CM)', 'Long-serving BJP chief minister known as “Mama”, whose cash scheme for women was copied across India.',
    [55, 72, 60, 65, 58, 65, 72, 72, 80, 65, 70, 35], 'medium', 'hindutva', 'BJP welfarism', [
      ['2023', 'Launched the Ladli Behna scheme of monthly cash transfers to women', ['welfare']],
      ['2024', 'Became Union Agriculture Minister', ['econ']],
    ]),
  P('advani', 'L. K. Advani', 'indpol', 'Deputy Prime Minister', '2002–2004', 'Co-founder of the BJP who led the 1990 Rath Yatra for a Ram temple at Ayodhya; awarded the Bharat Ratna in 2024.',
    [60, 50, 65, 72, 65, 75, 75, 85, 90, 70, 75, 30], 'high', 'hindutva', 'Ram Janmabhoomi movement', [
      ['1990', 'Led the Rath Yatra from Somnath towards Ayodhya; arrested in Bihar', ['faith', 'nation']],
      ['1998', 'Home Minister when India carried out the Pokhran-II nuclear tests', ['force']],
    ]),
  P('sushma', 'Sushma Swaraj', 'indpol', 'External Affairs Minister', '2014–2019', 'BJP leader who, as Foreign Minister, became known for answering Indians in trouble abroad on Twitter. Died 2019.',
    [58, 60, 60, 65, 55, 65, 70, 70, 78, 60, 65, 35], 'medium', 'conservative', 'BJP', [
      ['2015', 'Oversaw Operation Raahat evacuating Indians and foreigners from Yemen', ['world']],
      ['2016', 'Passport rules eased so applicants can name just one parent', ['values']],
    ]),
  P('jaitley', 'Arun Jaitley', 'indpol', 'Union Finance Minister', '2014–2019', 'BJP lawyer-politician who launched GST and the insolvency code. Died 2019.',
    [70, 45, 50, 65, 60, 75, 60, 55, 72, 55, 65, 35], 'medium', 'conservative', 'BJP economic liberalism', [
      ['2016', 'Passed the Insolvency and Bankruptcy Code', ['econ']],
      ['2017', 'Launched the Goods and Services Tax', ['econ', 'center']],
    ]),
  P('mohanbhagwat', 'Mohan Bhagwat', 'indpol', 'Sarsanghchalak (chief) of the RSS', '2009–', 'Head of the Rashtriya Swayamsevak Sangh, the BJP’s parent organisation.',
    [52, 55, 72, 72, 60, 75, 82, 90, 95, 72, 75, 40], 'medium', 'hindutva', 'RSS', [
      ['2018', 'Said at a Delhi lecture series that Hindutva would cease to be Hindutva if it did not want Muslims', ['faith', 'nation']],
      ['2022', 'Said there was no need to look for a shivling in every mosque', ['faith']],
    ]),
  P('annamalai', 'K. Annamalai', 'indpol', 'Tamil Nadu BJP president', '2021–2025', 'Former IPS officer who led the BJP’s push in Tamil Nadu.',
    [60, 50, 60, 72, 60, 70, 72, 80, 85, 65, 75, 30], 'medium', 'hindutva', 'BJP', [
      ['2019', 'Resigned from the Indian Police Service and joined the BJP in 2020', ['power']],
      ['2023', 'Led the En Mann En Makkal padayatra across Tamil Nadu', ['nation']],
    ]),
  P('tejasvisurya', 'Tejasvi Surya', 'indpol', 'BJP MP for Bangalore South', '2019–', 'BJP youth-wing president and MP, known for strong Hindutva speeches.',
    [65, 40, 60, 75, 65, 70, 80, 85, 92, 72, 80, 25], 'medium', 'hindutva', 'BJP', [
      ['2020', 'Became national president of the BJP youth wing', ['power']],
    ]),
  P('shinde', 'Eknath Shinde', 'indpol', 'Deputy Chief Minister of Maharashtra', '2022–2024 (CM)', 'Led the 2022 split in the Shiv Sena and became chief minister with BJP support.',
    [55, 60, 58, 68, 62, 60, 70, 72, 82, 65, 70, 35], 'medium', 'hindutva', 'Shiv Sena (Shinde)', [
      ['2022', 'Split the Shiv Sena and became chief minister with BJP support', ['power']],
      ['2024', 'Launched the Ladki Bahin cash scheme for women before the state election', ['welfare']],
    ]),
  P('pawankalyan', 'Pawan Kalyan', 'indpol', 'Deputy Chief Minister of Andhra Pradesh; Telugu film star', '2024–', 'Telugu actor who founded the Jana Sena Party and became Deputy CM in alliance with the TDP and BJP.',
    [52, 70, 55, 60, 55, 35, 65, 75, 75, 55, 60, 40], 'low', 'conservative', 'Jana Sena', [
      ['2014', 'Founded the Jana Sena Party', ['power']],
      ['2024', 'Called for a board to protect Sanatana Dharma after the Tirupati laddu controversy', ['faith']],
    ]),
  P('smriti', 'Smriti Irani', 'indpol', 'Former Union Minister; former TV actor', '2014–2024', 'Star of the TV serial Kyunki Saas Bhi Kabhi Bahu Thi turned BJP minister, who defeated Rahul Gandhi in Amethi in 2019.',
    [60, 55, 60, 70, 65, 70, 72, 75, 85, 65, 72, 30], 'medium', 'hindutva', 'BJP', [
      ['2019', 'Defeated Rahul Gandhi in Amethi; lost the seat in 2024', ['power']],
      ['2019', 'Minister for Women and Child Development', ['values']],
    ]),
  P('kangana', 'Kangana Ranaut', 'indpol', 'BJP MP for Mandi; actor', '2024–', 'National Award-winning actor and outspoken government supporter, elected BJP MP in 2024.',
    [62, 45, 62, 75, 75, 70, 70, 80, 92, 70, 80, 30], 'medium', 'hindutva', 'BJP', [
      ['2021', 'Said India won “real freedom” in 2014, drawing wide criticism', ['nation']],
      ['2025', 'Directed and starred in Emergency, a film on Indira Gandhi', ['power']],
    ]),
  P('hemamalini', 'Hema Malini', 'indpol', 'BJP MP for Mathura; actor', '2014–', 'Bollywood star of the 1970s, three-time BJP MP for Mathura.',
    [58, 55, 60, 65, 60, 65, 70, 75, 80, 65, 70, 35], 'low', 'hindutva', 'BJP', [
      ['2014', 'Elected MP for Mathura, re-elected 2019 and 2024', ['power']],
    ]),
  P('arungovil', 'Arun Govil', 'indpol', 'BJP MP for Meerut; actor', '2024–', 'Played Ram in the 1987 TV Ramayan; elected BJP MP in 2024.',
    [58, 55, 60, 65, 60, 65, 75, 82, 82, 65, 70, 35], 'low', 'hindutva', 'BJP', [
      ['1987', 'Played Ram in Ramanand Sagar’s Ramayan', ['faith']],
      ['2024', 'Elected MP for Meerut', ['power']],
    ]),
  P('sureshgopi', 'Suresh Gopi', 'indpol', 'Union Minister of State; Malayalam actor', '2024–', 'Malayalam action star who became the BJP’s first Lok Sabha MP from Kerala.',
    [58, 55, 60, 65, 60, 65, 70, 78, 80, 65, 70, 35], 'low', 'hindutva', 'BJP', [
      ['2024', 'Won Thrissur, the BJP’s first Lok Sabha seat in Kerala', ['power']],
    ]),
  P('pareshrawal', 'Paresh Rawal', 'indpol', 'Actor; former BJP MP', '2014–2019', 'Character actor (Hera Pheri, OMG) and BJP MP for Ahmedabad East.',
    [62, 50, 60, 68, 62, 65, 68, 70, 85, 65, 72, 35], 'low', 'hindutva', 'BJP', [
      ['2014', 'Elected BJP MP for Ahmedabad East', ['power']],
      ['2012', 'Starred in OMG – Oh My God!, satirising religious commerce', ['faith']],
    ]),
  P('gambhir', 'Gautam Gambhir', 'indpol', 'India cricket head coach; former BJP MP', '2019–2024 (MP)', 'World Cup-winning opener who served as BJP MP for East Delhi, then became India’s head coach in 2024.',
    [60, 55, 60, 70, 60, 65, 65, 70, 88, 70, 80, 35], 'low', 'hindutva', 'BJP', [
      ['2019', 'Elected BJP MP for East Delhi', ['power']],
      ['2024', 'Appointed head coach of India’s men’s cricket team', ['nation']],
    ]),
  P('babita', 'Babita Phogat', 'indpol', 'Wrestler; BJP politician', '2019–', 'Commonwealth Games gold medallist who joined the BJP in 2019.',
    [58, 60, 60, 68, 60, 65, 65, 70, 85, 65, 72, 35], 'low', 'hindutva', 'BJP', [
      ['2019', 'Joined the BJP and contested the Haryana election', ['power']],
    ]),

  /* ------------------------------------------------------------- Congress */
  P('manmohan', 'Manmohan Singh', 'indpol', 'Prime Minister of India', '2004–2014', 'Economist who opened India’s economy as Finance Minister in 1991 and, as PM, passed rights-based welfare laws. Died 2024.',
    [62, 68, 30, 40, 25, 55, 40, 20, 40, 30, 35, 50], 'high', 'soclib', 'Liberalisation with welfare', [
      ['1991', 'As Finance Minister, ended the licence raj, devalued the rupee and opened trade', ['econ', 'trade']],
      ['2005', 'Passed the Right to Information Act and the rural employment guarantee (MGNREGA)', ['welfare', 'liberty']],
      ['2008', 'Concluded the India–US civil nuclear agreement, surviving a confidence vote', ['world']],
    ]),
  P('sonia', 'Sonia Gandhi', 'indpol', 'Congress president', '1998–2017, 2019–2022', 'Led the Congress back to power in 2004; her National Advisory Council drove the rights-based laws of the UPA years.',
    [40, 80, 45, 40, 40, 55, 40, 20, 45, 40, 35, 55], 'high', 'socdem', 'Congress welfarism', [
      ['2004', 'Declined the prime ministership after the Congress-led UPA won', ['power']],
      ['2013', 'Championed the National Food Security Act', ['welfare']],
    ]),
  P('priyanka', 'Priyanka Gandhi Vadra', 'indpol', 'Congress MP for Wayanad', '2024–', 'Congress general secretary elected to the Lok Sabha from Wayanad in 2024.',
    [42, 78, 45, 38, 35, 50, 35, 25, 45, 40, 35, 55], 'medium', 'socdem', 'Congress centre-left', [
      ['2022', 'Gave 40% of Congress tickets in Uttar Pradesh to women (“Ladki hoon, lad sakti hoon”)', ['values']],
      ['2024', 'Won the Wayanad by-election', ['power']],
    ]),
  P('kharge', 'Mallikarjun Kharge', 'indpol', 'Congress president; Leader of the Opposition in the Rajya Sabha', '2022–', 'Veteran Dalit leader from Karnataka, the first non-Gandhi Congress president in 24 years.',
    [40, 80, 45, 40, 35, 50, 35, 20, 45, 40, 35, 50], 'medium', 'socdem', 'Congress', [
      ['2022', 'Elected Congress president', ['power']],
      ['2024', 'Campaigned for a nationwide caste census', ['welfare']],
    ]),
  P('tharoor', 'Shashi Tharoor', 'indpol', 'Congress MP for Thiruvananthapuram', '2009–', 'Former UN Under-Secretary-General, author and liberal Congress MP who also led an all-party delegation abroad after Operation Sindoor.',
    [55, 60, 35, 30, 25, 45, 25, 25, 45, 25, 45, 55], 'medium', 'soclib', 'Liberal Congress', [
      ['2015', 'Introduced a private member’s bill to decriminalise homosexuality; it was voted down', ['values']],
      ['2025', 'Led an all-party delegation abroad to explain Operation Sindoor', ['world', 'force']],
    ]),
  P('chidambaram', 'P. Chidambaram', 'indpol', 'Former Union Finance and Home Minister', '1996–2014', 'Congress lawyer and reformist Finance Minister of the 1997 “dream budget”.',
    [62, 55, 35, 50, 35, 60, 35, 25, 45, 35, 50, 45], 'medium', 'soclib', 'Congress liberalism', [
      ['1997', 'Cut income and corporate tax rates in the “dream budget”', ['econ']],
      ['2008', 'Became Home Minister after the Mumbai attacks; set up the National Investigation Agency', ['liberty', 'force']],
    ]),
  P('jairam', 'Jairam Ramesh', 'indpol', 'Congress general secretary (communications); former Environment Minister', '2009–2011 (minister)', 'Congress strategist who as Environment Minister refused clearances to several big projects.',
    [45, 70, 45, 35, 30, 50, 35, 20, 45, 35, 35, 80], 'medium', 'socdem', 'Congress environmentalism', [
      ['2010', 'Imposed a moratorium on Bt brinjal', ['eco']],
      ['2010', 'Refused clearance for Vedanta’s bauxite mine in the Niyamgiri hills', ['eco', 'econ']],
    ]),
  P('revanth', 'Revanth Reddy', 'indpol', 'Chief Minister of Telangana', '2023–', 'Congress leader who unseated the BRS in 2023.',
    [42, 78, 50, 45, 50, 35, 45, 35, 55, 45, 45, 45], 'medium', 'socdem', 'Congress', [
      ['2024', 'Carried out a statewide caste survey', ['welfare']],
    ]),
  P('siddaramaiah', 'Siddaramaiah', 'indpol', 'Chief Minister of Karnataka', '2013–2018, 2023–', 'Congress chief minister whose 2023 “five guarantees” included free bus travel for women.',
    [38, 85, 50, 40, 40, 30, 35, 25, 50, 45, 40, 45], 'medium', 'socdem', 'AHINDA social justice', [
      ['2023', 'Launched five guarantees, including free bus travel for women and ₹2,000 a month for women heads of household', ['welfare']],
    ]),
  P('rajivgandhi', 'Rajiv Gandhi', 'indpol', 'Prime Minister of India', '1984–1989', 'Youngest Indian PM, who pushed telecom and computers and reversed the Shah Bano judgement. Assassinated 1991.',
    [55, 60, 50, 50, 45, 65, 45, 40, 55, 50, 55, 45], 'medium', 'centrist', 'Congress modernisation', [
      ['1985', 'Passed the anti-defection law', ['power']],
      ['1986', 'Passed the Muslim Women Act, reversing the Supreme Court’s Shah Bano maintenance ruling', ['faith', 'values']],
      ['1987', 'Sent the Indian Peace Keeping Force to Sri Lanka', ['force']],
    ]),
  P('narasimharao', 'P. V. Narasimha Rao', 'indpol', 'Prime Minister of India', '1991–1996', 'Congress PM who, with Manmohan Singh, launched the 1991 economic reforms.',
    [65, 55, 35, 55, 40, 65, 50, 40, 55, 40, 50, 40], 'medium', 'neoliberal', '1991 liberalisation', [
      ['1991', 'Launched liberalisation during a balance-of-payments crisis', ['econ', 'trade']],
      ['1992', 'Prime Minister when the Babri Masjid was demolished', ['faith']],
    ]),
  P('shastri', 'Lal Bahadur Shastri', 'indpol', 'Prime Minister of India', '1964–1966', 'Coined “Jai Jawan Jai Kisan” and led India in the 1965 war with Pakistan.',
    [45, 60, 70, 55, 40, 65, 55, 50, 70, 60, 70, 45], 'medium', 'nehruvian', 'Congress', [
      ['1965', 'Led India in the war with Pakistan', ['force']],
      ['1965', 'Backed the push for food self-sufficiency that led to the Green Revolution', ['econ']],
    ]),
  P('azad', 'Maulana Abul Kalam Azad', 'indpol', 'Education Minister', '1947–1958', 'Congress president during the freedom struggle who opposed Partition and built India’s first institutions of higher learning.',
    [35, 65, 60, 40, 35, 60, 55, 65, 45, 45, 30, 50], 'medium', 'nehruvian', 'Composite nationalism', [
      ['1947', 'Became India’s first Education Minister', ['welfare']],
      ['1951', 'Founded the first IIT at Kharagpur', ['welfare']],
    ]),
  P('patel', 'Vallabhbhai Patel', 'indpol', 'Deputy Prime Minister and Home Minister', '1947–1950', 'Integrated more than 560 princely states into India and banned the RSS after Gandhi’s assassination.',
    [60, 50, 60, 65, 50, 85, 55, 40, 75, 55, 65, 40], 'high', 'conservative', 'Congress right', [
      ['1948', 'Integrated Hyderabad by military action (Operation Polo)', ['force', 'center']],
      ['1948', 'Banned the RSS after Gandhi’s assassination; the ban was lifted in 1949', ['liberty', 'faith']],
    ]),

  /* ------------------------------------------------------------- AAP and regional parties */
  P('kejriwal', 'Arvind Kejriwal', 'indpol', 'AAP national convener; former Chief Minister of Delhi', '2015–2024 (CM)', 'Former tax officer who rose from the 2011 anti-corruption movement to found the Aam Aadmi Party.',
    [45, 82, 50, 50, 60, 35, 45, 45, 60, 50, 45, 55], 'high', 'lpop', 'AAP welfare populism', [
      ['2015', 'Gave Delhi free water and subsidised electricity', ['welfare']],
      ['2024', 'Arrested by the Enforcement Directorate in the liquor-policy case weeks before the election; later granted bail', ['power', 'liberty']],
      ['2025', 'AAP lost Delhi to the BJP', ['power']],
    ]),
  P('bhagwantmann', 'Bhagwant Mann', 'indpol', 'Chief Minister of Punjab', '2022–', 'Comedian turned AAP chief minister of Punjab.',
    [42, 82, 55, 50, 55, 30, 45, 45, 55, 50, 45, 50], 'medium', 'lpop', 'AAP', [
      ['2022', 'Gave 300 units of free electricity a month to Punjab households', ['welfare']],
    ]),
  P('atishi', 'Atishi', 'indpol', 'Former Chief Minister of Delhi', 'Sept 2024–Feb 2025', 'AAP education minister who led Delhi’s school reforms and briefly served as chief minister.',
    [42, 82, 45, 40, 45, 35, 35, 35, 50, 45, 40, 60], 'medium', 'lpop', 'AAP', [
      ['2015', 'Adviser on Delhi’s government-school overhaul', ['welfare']],
      ['2024', 'Became Delhi’s chief minister', ['power']],
    ]),
  P('harbhajan', 'Harbhajan Singh', 'indpol', 'AAP Rajya Sabha MP; former cricketer', '2022–', 'World Cup-winning off-spinner nominated to the Rajya Sabha by AAP.',
    [45, 78, 55, 50, 50, 35, 50, 50, 60, 50, 50, 50], 'low', 'lpop', 'AAP', [
      ['2022', 'Elected to the Rajya Sabha from Punjab', ['power']],
    ]),
  P('mamata', 'Mamata Banerjee', 'indpol', 'TMC chair; Chief Minister of West Bengal', '2011–2026 (CM)', 'Founder of the Trinamool Congress who ended 34 years of Left rule in Bengal; lost power to the BJP in 2026.',
    [32, 82, 60, 60, 72, 18, 45, 40, 55, 50, 40, 50], 'high', 'lpop', 'Trinamool populism', [
      ['2008', 'Her agitation at Singur drove Tata’s Nano factory out of Bengal', ['econ']],
      ['2021', 'Launched Lakshmir Bhandar, monthly cash for women', ['welfare']],
      ['2023', 'Banned The Kerala Story in the state; the Supreme Court stayed the ban', ['liberty']],
    ]),
  P('mahua', 'Mahua Moitra', 'indpol', 'TMC MP for Krishnanagar', '2019–', 'Former investment banker and sharp parliamentary critic of the government and the Adani group.',
    [45, 70, 40, 25, 25, 30, 25, 15, 35, 35, 35, 55], 'medium', 'soclib', 'Trinamool', [
      ['2019', 'Maiden speech listing “seven signs of fascism”', ['power']],
      ['2023', 'Expelled from the Lok Sabha by the ethics committee; re-elected in 2024', ['power']],
    ]),
  P('yusufpathan', 'Yusuf Pathan', 'indpol', 'TMC MP for Baharampur; former cricketer', '2024–', 'World Cup-winning all-rounder elected for the Trinamool in 2024.',
    [45, 75, 55, 50, 50, 35, 50, 50, 55, 50, 45, 50], 'low', 'lpop', 'Trinamool', [
      ['2024', 'Defeated Congress veteran Adhir Ranjan Chowdhury in Baharampur', ['power']],
    ]),
  P('shatrughan', 'Shatrughan Sinha', 'indpol', 'TMC MP for Asansol; actor', '2022–', 'Film star who was a minister in Vajpayee’s BJP government, joined the Congress in 2019 and the Trinamool in 2022.',
    [50, 65, 55, 50, 45, 45, 55, 50, 60, 50, 50, 45], 'low', 'centrist', 'Trinamool', [
      ['2003', 'Union Minister in the Vajpayee government', ['power']],
      ['2022', 'Won the Asansol by-election for the Trinamool', ['power']],
    ]),
  P('akhilesh', 'Akhilesh Yadav', 'indpol', 'Samajwadi Party president', '2012–2017 (CM)', 'Former UP chief minister whose party won the most Lok Sabha seats in Uttar Pradesh in 2024.',
    [42, 75, 55, 45, 50, 35, 45, 35, 55, 50, 45, 50], 'medium', 'lohiaite', 'Samajwadi', [
      ['2016', 'Opened the Agra–Lucknow Expressway', ['econ']],
      ['2024', 'Won 37 of Uttar Pradesh’s 80 Lok Sabha seats', ['power']],
    ]),
  P('mulayam', 'Mulayam Singh Yadav', 'indpol', 'Founder of the Samajwadi Party', '1989–2007 (CM, three terms)', 'Lohiaite socialist and three-time UP chief minister. Died 2022.',
    [35, 72, 60, 55, 60, 40, 55, 35, 60, 55, 50, 40], 'medium', 'lohiaite', 'Samajwadi', [
      ['1990', 'As chief minister, ordered police to fire on kar sevaks at Ayodhya', ['faith', 'force']],
      ['1992', 'Founded the Samajwadi Party', ['power']],
    ]),
  P('jayabachchan', 'Jaya Bachchan', 'indpol', 'Samajwadi Party Rajya Sabha MP; actor', '2004–', 'Veteran actor and five-term Rajya Sabha MP.',
    [42, 72, 50, 40, 40, 40, 45, 35, 50, 45, 40, 50], 'low', 'lohiaite', 'Samajwadi', [
      ['2004', 'First elected to the Rajya Sabha for the Samajwadi Party', ['power']],
    ]),
  P('mayawati', 'Mayawati', 'indpol', 'BSP president; four-time Chief Minister of Uttar Pradesh', '1995–2012 (CM)', 'India’s most prominent Dalit woman politician, who won a majority in UP in 2007.',
    [42, 78, 50, 55, 72, 45, 35, 25, 50, 50, 50, 40], 'high', 'ambedkarite', 'Bahujan politics', [
      ['2007', 'Won a majority in Uttar Pradesh with “sarvajan” outreach beyond Dalits', ['power']],
      ['2008', 'Built memorial parks with statues of Ambedkar, Kanshi Ram and herself', ['nation']],
    ]),
  P('kanshiram', 'Kanshi Ram', 'indpol', 'Founder of the Bahujan Samaj Party', '1984–2006', 'Organised Dalit and backward-caste government employees and founded the BSP. Died 2006.',
    [35, 82, 55, 45, 55, 40, 25, 20, 45, 50, 40, 45], 'medium', 'ambedkarite', 'Bahujan politics', [
      ['1978', 'Founded BAMCEF for SC, ST, OBC and minority employees', ['welfare']],
      ['1984', 'Founded the Bahujan Samaj Party', ['power']],
    ]),
  P('chandrashekhar', 'Chandrashekhar Azad', 'indpol', 'Aazad Samaj Party MP for Nagina', '2024–', 'Founder of the Bhim Army, a Dalit rights movement, elected to the Lok Sabha in 2024.',
    [35, 85, 50, 35, 40, 40, 20, 15, 40, 45, 40, 45], 'medium', 'ambedkarite', 'Bhim Army', [
      ['2015', 'Co-founded the Bhim Army', ['welfare', 'values']],
      ['2024', 'Won Nagina in Uttar Pradesh', ['power']],
    ]),
  P('jignesh', 'Jignesh Mevani', 'indpol', 'Congress MLA, Gujarat; Dalit activist', '2017–', 'Lawyer and activist who led the 2016 Una march after Dalits were flogged by cow vigilantes.',
    [30, 85, 50, 30, 30, 40, 20, 15, 40, 45, 35, 50], 'medium', 'ambedkarite', 'Dalit rights', [
      ['2016', 'Led the Una “Dalit Asmita Yatra” after the flogging of Dalit men', ['values', 'liberty']],
    ]),
  P('lalu', 'Lalu Prasad Yadav', 'indpol', 'RJD president; former Chief Minister of Bihar', '1990–1997 (CM)', 'Mandal-era leader of Bihar’s backward castes; later convicted in the fodder scam.',
    [35, 78, 55, 50, 65, 40, 45, 30, 50, 50, 45, 40], 'medium', 'lohiaite', 'Mandal politics (RJD)', [
      ['1990', 'Had L. K. Advani’s Rath Yatra stopped and Advani arrested in Bihar', ['faith']],
      ['2004', 'Railway Minister in the UPA government', ['econ']],
    ]),
  P('tejashwi', 'Tejashwi Yadav', 'indpol', 'RJD leader; former Deputy Chief Minister of Bihar', '2015–', 'Lalu Prasad’s son, twice Deputy CM; led the RJD to the most seats in Bihar in 2020 but lost heavily in 2025.',
    [38, 80, 55, 45, 45, 40, 40, 30, 50, 50, 45, 45], 'medium', 'lohiaite', 'RJD', [
      ['2020', 'Led the RJD to 75 seats, the most of any party in Bihar', ['power']],
      ['2025', 'The NDA won 202 of 243 seats', ['power']],
    ]),
  P('nitish', 'Nitish Kumar', 'indpol', 'Chief Minister of Bihar', '2005–2014, 2015–', 'Socialist-turned-coalition-maker sworn in for a record tenth time in November 2025.',
    [45, 70, 55, 60, 50, 50, 55, 40, 55, 55, 50, 45], 'medium', 'lohiaite', 'JD(U) socialism', [
      ['2016', 'Banned alcohol in Bihar', ['liberty', 'values']],
      ['2023', 'Published Bihar’s caste survey', ['welfare']],
    ]),
  P('prashantkishor', 'Prashant Kishor', 'indpol', 'Founder of Jan Suraaj', '2024–', 'Election strategist for Modi in 2014 and later for several opposition parties, who launched his own party in Bihar.',
    [55, 60, 45, 45, 40, 45, 40, 35, 55, 50, 45, 50], 'low', 'centrist', 'Jan Suraaj', [
      ['2014', 'Ran the Modi campaign’s outreach as head of Citizens for Accountable Governance', ['power']],
      ['2024', 'Launched Jan Suraaj in Bihar', ['power']],
    ]),
  P('pawar', 'Sharad Pawar', 'indpol', 'Founder of the Nationalist Congress Party', '1999–', 'Four-time Maharashtra chief minister and Agriculture Minister 2004–14.',
    [55, 60, 50, 50, 45, 45, 45, 35, 55, 50, 45, 45], 'medium', 'centrist', 'NCP', [
      ['1999', 'Founded the NCP after opposing Sonia Gandhi’s leadership', ['power']],
      ['2004', 'Agriculture Minister in the UPA government', ['econ']],
    ]),
  P('uddhav', 'Uddhav Thackeray', 'indpol', 'Shiv Sena (UBT) president; former Chief Minister of Maharashtra', '2019–2022 (CM)', 'Bal Thackeray’s son, who allied with the Congress and NCP to become chief minister.',
    [50, 60, 55, 60, 55, 45, 60, 60, 80, 60, 60, 45], 'medium', 'conservative', 'Marathi regionalism', [
      ['2019', 'Broke with the BJP and formed the Maha Vikas Aghadi with the Congress and NCP', ['power']],
    ]),
  P('rajthackeray', 'Raj Thackeray', 'indpol', 'Founder of the Maharashtra Navnirman Sena', '2006–', 'Bal Thackeray’s nephew, known for “sons of the soil” campaigns against north Indian migrants.',
    [50, 50, 60, 75, 75, 40, 75, 70, 90, 65, 75, 35], 'medium', 'rpop', 'Marathi nativism', [
      ['2008', 'MNS workers attacked north Indian candidates and migrants in Mumbai', ['nation', 'liberty']],
      ['2022', 'Demanded loudspeakers be removed from mosques', ['faith']],
    ]),
  P('balthackeray', 'Bal Thackeray', 'indpol', 'Founder of the Shiv Sena', '1966–2012', 'Cartoonist who founded the Shiv Sena on Marathi “sons of the soil” politics, later turning to Hindutva. Died 2012.',
    [50, 50, 60, 80, 88, 50, 80, 80, 92, 70, 85, 25], 'high', 'hindutva', 'Shiv Sena', [
      ['1966', 'Founded the Shiv Sena', ['nation']],
      ['1995', 'His party took power in Maharashtra in alliance with the BJP', ['power']],
    ]),
  P('owaisi', 'Asaduddin Owaisi', 'indpol', 'AIMIM president; MP for Hyderabad', '2004–', 'Barrister and five-time MP, the most prominent Muslim political voice in Parliament.',
    [42, 72, 50, 32, 40, 40, 62, 72, 40, 45, 40, 45], 'medium', 'islamdem', 'AIMIM', [
      ['2019', 'Tore a copy of the citizenship amendment bill in the Lok Sabha', ['faith', 'nation']],
      ['2025', 'Opposed the Waqf (Amendment) Act and challenged it in the Supreme Court', ['faith']],
    ]),
  P('omar', 'Omar Abdullah', 'indpol', 'Chief Minister of Jammu and Kashmir', '2009–2015, 2024–', 'National Conference leader detained for months after August 2019, back in office in 2024 with the powers of a union territory.',
    [48, 65, 45, 30, 35, 10, 45, 45, 35, 40, 25, 50], 'medium', 'centrist', 'National Conference (autonomy)', [
      ['2019', 'Detained under the Public Safety Act after Article 370 was revoked', ['liberty', 'center']],
      ['2024', 'Became chief minister of the union territory', ['power']],
    ]),
  P('mehbooba', 'Mehbooba Mufti', 'indpol', 'PDP president; former Chief Minister of Jammu and Kashmir', '2016–2018 (CM)', 'Led a PDP–BJP coalition until 2018; detained for over a year after 2019.',
    [45, 65, 50, 30, 40, 5, 55, 60, 30, 40, 20, 50], 'medium', 'centrist', 'PDP self-rule', [
      ['2018', 'Her government fell when the BJP withdrew support', ['power']],
      ['2019', 'Detained under the Public Safety Act until October 2020', ['liberty']],
    ]),
  P('farooq', 'Farooq Abdullah', 'indpol', 'National Conference president', '1982–2002 (CM, three terms)', 'Three-time chief minister of Jammu and Kashmir and son of Sheikh Abdullah.',
    [50, 60, 45, 40, 40, 10, 50, 45, 40, 40, 35, 50], 'medium', 'centrist', 'National Conference', [
      ['2000', 'His assembly passed a resolution seeking greater autonomy', ['center']],
    ]),
  P('mkstalin', 'M. K. Stalin', 'indpol', 'DMK president; former Chief Minister of Tamil Nadu', '2021–2026 (CM)', 'Karunanidhi’s son, who opposed NEET and Hindi and lost power to Vijay’s TVK in 2026.',
    [40, 82, 50, 38, 42, 12, 30, 12, 45, 45, 35, 50], 'high', 'dravidian', 'DMK', [
      ['2021', 'Passed a bill to exempt Tamil Nadu from the NEET medical entrance exam', ['center']],
      ['2022', 'Launched free breakfast in government primary schools', ['welfare']],
      ['2026', 'Resigned after the DMK lost the state election', ['power']],
    ]),
  P('udhayanidhi', 'Udhayanidhi Stalin', 'indpol', 'DMK leader; former Deputy Chief Minister; actor-producer', '2024–2026 (Deputy CM)', 'Actor and producer whose 2023 call to “eradicate” Sanatana Dharma triggered police cases.',
    [40, 82, 50, 35, 40, 10, 25, 5, 45, 45, 35, 50], 'medium', 'dravidian', 'DMK', [
      ['2023', 'Said Sanatana Dharma should be eradicated like dengue and malaria', ['faith']],
      ['2024', 'Became Deputy Chief Minister', ['power']],
    ]),
  P('karunanidhi', 'M. Karunanidhi', 'indpol', 'Five-time Chief Minister of Tamil Nadu', '1969–2011', 'Screenwriter and DMK leader for half a century. Died 2018.',
    [40, 80, 50, 45, 55, 12, 35, 15, 55, 50, 40, 45], 'high', 'dravidian', 'DMK', [
      ['1969', 'Became chief minister after Annadurai’s death', ['power']],
      ['2006', 'Opened temple priesthood to people of all castes by ordinance', ['faith', 'values']],
    ]),
  P('annadurai', 'C. N. Annadurai', 'indpol', 'Chief Minister of Tamil Nadu', '1967–1969', 'Founder of the DMK who renamed Madras State as Tamil Nadu. Died 1969.',
    [40, 78, 55, 40, 40, 10, 30, 15, 55, 50, 35, 45], 'medium', 'dravidian', 'DMK', [
      ['1949', 'Founded the Dravida Munnetra Kazhagam', ['power']],
      ['1967', 'Legalised self-respect marriages held without Brahmin priests', ['values', 'faith']],
    ]),
  P('periyar', 'E. V. Ramasamy (Periyar)', 'indpol', 'Founder of the Self-Respect Movement', '1925–1973', 'Rationalist social reformer who attacked caste, Brahmin dominance and religion. Died 1973.',
    [35, 75, 55, 30, 40, 5, 5, 0, 55, 50, 30, 50], 'high', 'dravidian', 'Self-Respect Movement', [
      ['1925', 'Founded the Self-Respect Movement', ['values', 'faith']],
      ['1924', 'Led the Vaikom satyagraha for Dalits’ right to use temple roads', ['values']],
    ]),
  P('jayalalithaa', 'J. Jayalalithaa', 'indpol', 'Six-time Chief Minister of Tamil Nadu', '1991–2016', 'Film star and AIADMK leader known as “Amma”, whose subsidised canteens were copied across India. Died 2016.',
    [45, 82, 55, 65, 82, 20, 60, 55, 60, 50, 55, 40], 'high', 'dravidian', 'AIADMK', [
      ['1993', 'Pushed through 69% reservation in Tamil Nadu, protected under the Ninth Schedule', ['welfare']],
      ['2013', 'Opened Amma canteens selling meals for a few rupees', ['welfare']],
    ]),
  P('vijay', 'Vijay', 'indpol', 'Chief Minister of Tamil Nadu; TVK founder', '2026–', 'Tamil film superstar who founded Tamilaga Vettri Kazhagam in 2024 and ended six decades of DMK and AIADMK rule in 2026.',
    [42, 78, 50, 40, 45, 25, 35, 30, 55, 50, 40, 50], 'low', 'dravidian', 'TVK', [
      ['2024', 'Founded Tamilaga Vettri Kazhagam, naming Periyar, Ambedkar and Kamaraj among its ideological guides', ['values']],
      ['2026', 'Sworn in as chief minister on 10 May at the head of a coalition including the Congress', ['power']],
    ], 'A new government; placement rests mainly on his party’s stated programme.'),
  P('kamal', 'Kamal Haasan', 'indpol', 'Rajya Sabha MP; actor; MNM founder', '2018–', 'Actor-director who founded Makkal Needhi Maiam and entered the Rajya Sabha with DMK support in 2025.',
    [45, 70, 45, 30, 35, 25, 25, 15, 45, 40, 30, 60], 'low', 'soclib', 'Makkal Needhi Maiam', [
      ['2018', 'Founded Makkal Needhi Maiam', ['power']],
      ['2019', 'Called Nathuram Godse independent India’s “first terrorist”, triggering police complaints', ['faith']],
    ]),
  P('naveen', 'Naveen Patnaik', 'indpol', 'BJD president; former Chief Minister of Odisha', '2000–2024 (CM)', 'Odisha’s longest-serving chief minister, known for disaster preparedness; lost to the BJP in 2024.',
    [55, 70, 50, 55, 50, 30, 50, 40, 55, 50, 40, 55], 'medium', 'centrist', 'BJD', [
      ['2013', 'Evacuated nearly a million people before Cyclone Phailin', ['welfare']],
      ['2024', 'Lost power to the BJP', ['power']],
    ]),
  P('naidu', 'N. Chandrababu Naidu', 'indpol', 'Chief Minister of Andhra Pradesh', '1995–2004, 2014–2019, 2024–', 'TDP leader who built Hyderabad’s IT hub and is a key ally of the BJP-led government since 2024.',
    [70, 55, 40, 55, 50, 35, 50, 45, 55, 40, 45, 40], 'medium', 'neoliberal', 'TDP technocracy', [
      ['1998', 'Opened HITEC City in Hyderabad', ['econ']],
      ['2024', 'His TDP became the BJP’s largest partner in the NDA government', ['power']],
    ]),
  P('jagan', 'Y. S. Jagan Mohan Reddy', 'indpol', 'YSRCP president; former Chief Minister of Andhra Pradesh', '2019–2024 (CM)', 'Built his rule on direct cash-transfer schemes, the “Navaratnalu”.',
    [40, 85, 55, 55, 65, 30, 50, 45, 55, 50, 45, 40], 'medium', 'lpop', 'YSRCP welfarism', [
      ['2019', 'Launched the Navaratnalu cash-transfer programmes', ['welfare']],
      ['2024', 'Lost power to the TDP alliance', ['power']],
    ]),
  P('kcr', 'K. Chandrashekar Rao', 'indpol', 'BRS president; former Chief Minister of Telangana', '2014–2023 (CM)', 'Led the movement for Telangana statehood and became its first chief minister.',
    [42, 82, 55, 55, 70, 15, 55, 55, 60, 50, 45, 40], 'medium', 'lpop', 'Telangana regionalism', [
      ['2014', 'Became the first chief minister of Telangana', ['center']],
      ['2018', 'Launched Rythu Bandhu, per-acre cash support to farmers', ['welfare']],
    ]),
  P('hemantsoren', 'Hemant Soren', 'indpol', 'Chief Minister of Jharkhand', '2019–', 'JMM leader of Jharkhand’s Adivasi politics, arrested by the ED in 2024 and re-elected later that year.',
    [35, 80, 55, 45, 45, 25, 45, 40, 55, 50, 40, 60], 'medium', 'lpop', 'Adivasi politics (JMM)', [
      ['2020', 'His assembly passed a resolution for a separate Sarna religion code', ['faith']],
      ['2024', 'Arrested by the Enforcement Directorate; released on bail and re-elected', ['power']],
    ]),
  P('vinesh', 'Vinesh Phogat', 'indpol', 'Congress MLA, Haryana; wrestler', '2024–', 'Wrestler who led the 2023 protest against the wrestling federation chief; disqualified from the Paris Olympic final for being 100 g overweight.',
    [45, 70, 50, 35, 30, 45, 35, 40, 70, 50, 50, 50], 'low', 'socdem', 'Congress', [
      ['2023', 'Led wrestlers’ sit-in at Jantar Mantar accusing the federation chief of sexual harassment', ['liberty', 'values']],
      ['2024', 'Elected MLA for Julana', ['power']],
    ]),
  P('kanhaiya', 'Kanhaiya Kumar', 'indpol', 'Congress leader', '2021–', 'JNU student leader charged with sedition in 2016, later a CPI and then Congress politician.',
    [25, 85, 55, 30, 30, 45, 25, 15, 40, 50, 30, 55], 'medium', 'demsoc', 'Student left', [
      ['2016', 'Arrested on sedition charges over a JNU event; granted bail', ['liberty', 'nation']],
      ['2021', 'Joined the Congress', ['power']],
    ]),

  /* ------------------------------------------------------------- The Left */
  P('pinarayi', 'Pinarayi Vijayan', 'indpol', 'CPI(M) leader; former Chief Minister of Kerala', '2016–2026 (CM)', 'First Kerala chief minister to be re-elected, in 2021; lost power to the Congress-led UDF in 2026.',
    [22, 85, 60, 50, 55, 35, 30, 10, 40, 55, 30, 50], 'medium', 'demsoc', 'CPI(M)', [
      ['2019', 'Backed the “women’s wall” supporting women’s entry to Sabarimala', ['values', 'faith']],
      ['2018', 'Led Kerala through its worst floods in a century', ['eco']],
    ]),
  P('yechury', 'Sitaram Yechury', 'indpol', 'CPI(M) general secretary', '2015–2024', 'Marxist leader and coalition builder for the opposition. Died 2024.',
    [18, 85, 65, 35, 35, 40, 25, 5, 35, 55, 25, 55], 'medium', 'demsoc', 'CPI(M)', [
      ['2004', 'Helped draft the UPA’s common minimum programme', ['welfare']],
    ]),
  P('jyotibasu', 'Jyoti Basu', 'indpol', 'Chief Minister of West Bengal', '1977–2000', 'Led the Left Front government in Bengal for 23 years; land reform under Operation Barga. Died 2010.',
    [15, 82, 70, 50, 55, 35, 30, 5, 40, 60, 30, 45], 'medium', 'demsoc', 'CPI(M)', [
      ['1978', 'Operation Barga registered sharecroppers and secured their rights', ['econ', 'welfare']],
      ['1996', 'His party barred him from becoming prime minister', ['power']],
    ]),
  P('ems', 'E. M. S. Namboodiripad', 'indpol', 'Chief Minister of Kerala', '1957–1959, 1967–1969', 'Led India’s first elected communist state government. Died 1998.',
    [10, 85, 70, 50, 50, 35, 30, 5, 40, 60, 30, 45], 'medium', 'demsoc', 'Communist (CPI, then CPI(M))', [
      ['1957', 'Became chief minister of India’s first elected communist government', ['power']],
      ['1959', 'His government was dismissed by the centre after the “liberation struggle”', ['center']],
    ]),

  /* ------------------------------------------------------------- History */
  P('ambedkar', 'B. R. Ambedkar', 'indpol', 'Chairman of the Constitution’s Drafting Committee; first Law Minister', '1947–1951', 'Jurist, economist and Dalit leader who led the drafting of the Constitution. Died 1956.',
    [35, 82, 55, 30, 20, 60, 10, 10, 40, 40, 30, 45], 'high', 'ambedkarite', 'Ambedkarism', [
      ['1927', 'Led the Mahad satyagraha for Dalits’ right to drink from a public tank', ['values']],
      ['1951', 'Resigned as Law Minister when the Hindu Code Bill was stalled', ['values', 'faith']],
      ['1956', 'Converted to Buddhism with hundreds of thousands of followers', ['faith']],
    ]),
  P('bose', 'Subhas Chandra Bose', 'indpol', 'Leader of the Indian National Army', '1943–1945', 'Congress president who left for armed struggle, allying with Germany and Japan. Died 1945.',
    [25, 70, 70, 75, 85, 85, 40, 25, 85, 70, 92, 40], 'medium', 'anticol', 'Forward Bloc', [
      ['1938', 'As Congress president, set up the National Planning Committee', ['econ']],
      ['1943', 'Led the Indian National Army and the Azad Hind government with Japanese support', ['force']],
    ]),
  P('bhagatsingh', 'Bhagat Singh', 'indpol', 'Revolutionary', '1926–1931', 'Socialist revolutionary hanged by the British at 23.',
    [10, 80, 70, 40, 45, 60, 20, 0, 70, 60, 85, 45], 'medium', 'anticol', 'Revolutionary socialism', [
      ['1929', 'Threw smoke bombs in the Central Legislative Assembly to protest repressive laws', ['force']],
      ['1930', 'Wrote “Why I Am an Atheist” in jail', ['faith']],
    ]),
  P('savarkar', 'V. D. Savarkar', 'indpol', 'President of the Hindu Mahasabha', '1937–1943', 'Revolutionary jailed in the Cellular Jail who defined “Hindutva” as a political identity. Died 1966.',
    [55, 45, 65, 75, 70, 80, 55, 55, 95, 70, 85, 35], 'high', 'hindutva', 'Savarkarite Hindutva', [
      ['1923', 'Published Hindutva: Who Is a Hindu?', ['nation', 'faith']],
      ['1911', 'Sentenced to transportation to the Cellular Jail in the Andamans', ['liberty']],
    ]),
  P('hedgewar', 'K. B. Hedgewar', 'indpol', 'Founder of the RSS', '1925–1940', 'Founded the Rashtriya Swayamsevak Sangh in Nagpur. Died 1940.',
    [52, 50, 70, 70, 65, 75, 85, 88, 95, 70, 70, 40], 'medium', 'hindutva', 'RSS', [
      ['1925', 'Founded the RSS', ['nation', 'faith']],
    ]),
  P('golwalkar', 'M. S. Golwalkar', 'indpol', 'Sarsanghchalak of the RSS', '1940–1973', 'Second RSS chief, whose writings shaped Hindu nationalist thought. Died 1973.',
    [50, 50, 75, 75, 65, 85, 88, 92, 98, 75, 75, 40], 'high', 'hindutva', 'RSS', [
      ['1966', 'His speeches were collected in Bunch of Thoughts', ['nation', 'faith']],
    ]),
  P('mookerjee', 'Syama Prasad Mookerjee', 'indpol', 'Founder of the Bharatiya Jana Sangh', '1951–1953', 'Resigned from Nehru’s cabinet and founded the Jana Sangh, forerunner of the BJP. Died in detention in Kashmir in 1953.',
    [55, 50, 65, 70, 60, 85, 75, 75, 92, 70, 75, 35], 'medium', 'hindutva', 'Jana Sangh', [
      ['1951', 'Founded the Bharatiya Jana Sangh', ['power']],
      ['1953', 'Arrested entering Kashmir in protest at its separate status; died in custody', ['center', 'nation']],
    ]),
  P('deendayal', 'Deendayal Upadhyaya', 'indpol', 'Jana Sangh leader', '1951–1968', 'Ideologue of “integral humanism”, the BJP’s official philosophy. Died 1968.',
    [45, 60, 80, 60, 50, 40, 78, 80, 88, 65, 55, 60], 'medium', 'hindutva', 'Integral humanism', [
      ['1965', 'Set out integral humanism in four lectures', ['econ', 'faith']],
    ]),
  P('lohia', 'Ram Manohar Lohia', 'indpol', 'Socialist leader', '1934–1967', 'Champion of backward castes, Indian languages and anti-Congressism. Died 1967.',
    [25, 80, 65, 35, 30, 35, 40, 20, 65, 55, 35, 55], 'medium', 'lohiaite', 'Lohiaite socialism', [
      ['1963', 'Pushed anti-Congress alliances that won several states in 1967', ['power']],
      ['1950s', 'Campaigned to replace English with Indian languages (“Angrezi hatao”)', ['nation']],
    ]),
  P('jp', 'Jayaprakash Narayan', 'indpol', 'Leader of the 1974 movement', '1974–1979', 'Socialist and Sarvodaya leader whose “Total Revolution” movement led to the Emergency and the Janata victory. Died 1979.',
    [30, 75, 60, 25, 15, 15, 40, 35, 50, 50, 25, 65], 'medium', 'gandhian', 'Total Revolution', [
      ['1974', 'Led the Bihar movement calling for “Total Revolution”', ['power', 'liberty']],
      ['1975', 'Jailed during the Emergency', ['liberty']],
    ]),
  P('rajaji', 'C. Rajagopalachari', 'indpol', 'Founder of the Swatantra Party; last Governor-General', '1948–1972', 'Gandhi’s colleague who turned against the “licence-permit raj” and founded a free-market party. Died 1972.',
    [82, 30, 25, 45, 30, 40, 60, 60, 50, 35, 40, 40], 'medium', 'classlib', 'Swatantra Party', [
      ['1959', 'Founded the Swatantra Party against socialist planning', ['econ']],
      ['1965', 'Opposed the imposition of Hindi', ['center', 'nation']],
    ]),
  P('morarji', 'Morarji Desai', 'indpol', 'Prime Minister of India', '1977–1979', 'Led the first non-Congress government after the Emergency. Died 1995.',
    [60, 45, 55, 55, 35, 50, 70, 60, 60, 55, 35, 50], 'medium', 'conservative', 'Janata', [
      ['1977', 'Repealed Emergency-era amendments limiting civil liberties', ['liberty', 'power']],
    ]),
  P('charansingh', 'Charan Singh', 'indpol', 'Prime Minister of India', '1979–1980', 'Peasant leader who drove land reform in Uttar Pradesh; Bharat Ratna 2024. Died 1987.',
    [55, 60, 65, 50, 40, 40, 60, 45, 60, 55, 45, 55], 'medium', 'lohiaite', 'Peasant politics', [
      ['1952', 'As UP revenue minister, carried out zamindari abolition', ['econ']],
    ]),
  P('vpsingh', 'V. P. Singh', 'indpol', 'Prime Minister of India', '1989–1990', 'Implemented the Mandal Commission’s OBC reservation. Died 2008.',
    [40, 78, 55, 40, 35, 45, 35, 25, 50, 50, 40, 50], 'medium', 'lohiaite', 'Mandal politics', [
      ['1990', 'Implemented 27% reservation for Other Backward Classes in central jobs', ['welfare']],
    ]),

  /* ------------------------------------------------------------- Film, media, sport and public life */
  P('anupamkher', 'Anupam Kher', 'indpub', 'Actor', '1984–', 'Veteran actor and outspoken supporter of the government; star of The Kashmir Files.',
    [60, 50, 60, 70, 62, 65, 70, 72, 88, 65, 75, 35], 'medium', 'natcon', 'Government supporter', [
      ['2015', 'Led a march against the “award wapsi” protests by writers', ['nation']],
      ['2022', 'Starred in The Kashmir Files, on the exodus of Kashmiri Pandits', ['nation', 'faith']],
    ]),
  P('vivekagnihotri', 'Vivek Agnihotri', 'indpub', 'Film director', '2005–', 'Director of The Tashkent Files, The Kashmir Files and The Bengal Files.',
    [60, 45, 62, 72, 65, 68, 72, 75, 92, 70, 78, 30], 'medium', 'natcon', 'Nationalist cinema', [
      ['2022', 'The Kashmir Files was made tax-free in several BJP-ruled states', ['nation']],
    ]),
  P('akshay', 'Akshay Kumar', 'indpub', 'Actor', '1991–', 'Action star of patriotic films (Airlift, Kesari) and social-message films (Toilet, Pad Man).',
    [60, 55, 60, 60, 55, 60, 60, 60, 82, 60, 70, 45], 'low', 'natcon', 'Patriotic cinema', [
      ['2017', 'Starred in Toilet: Ek Prem Katha, backing the Swachh Bharat sanitation drive', ['welfare']],
      ['2023', 'Received Indian citizenship after giving up Canadian citizenship', ['nation']],
    ], 'Little explicit political record; placed mainly from his films and public campaigns.'),
  P('amitabh', 'Amitabh Bachchan', 'indpub', 'Actor; former Congress MP', '1969–', 'Bollywood’s biggest star of the 1970s–80s, briefly Congress MP for Allahabad.',
    [55, 55, 55, 55, 50, 55, 55, 55, 65, 55, 55, 45], 'low', 'centrist', 'Largely apolitical', [
      ['1984', 'Elected Congress MP for Allahabad; resigned in 1987', ['power']],
      ['2010', 'Became brand ambassador for Gujarat tourism', ['nation']],
    ], 'Little explicit political record; placed near the centre.'),
  P('shahrukh', 'Shah Rukh Khan', 'indpub', 'Actor', '1992–', 'Bollywood superstar whose rare political remarks drew boycott calls.',
    [55, 55, 40, 40, 35, 50, 40, 45, 45, 40, 45, 50], 'low', 'centrist', 'Largely apolitical', [
      ['2015', 'Said there was “extreme intolerance” in India; later said his words were misread', ['liberty']],
      ['2022', 'Pathaan’s “Besharam Rang” song drew protests over a saffron costume', ['faith']],
    ], 'Little explicit political record; placed near the centre.'),
  P('aamir', 'Aamir Khan', 'indpub', 'Actor and producer', '1988–', 'Actor whose TV show Satyamev Jayate tackled social issues.',
    [45, 65, 45, 35, 30, 45, 30, 30, 45, 40, 40, 60], 'low', 'soclib', 'Social reform', [
      ['2012', 'Hosted Satyamev Jayate on female foeticide, dowry and caste', ['values']],
      ['2015', 'Said his wife had wondered whether to leave India, prompting a backlash', ['liberty']],
    ]),
  P('deepika', 'Deepika Padukone', 'indpub', 'Actor', '2007–', 'Actor who spoke openly about her depression and founded a mental-health charity.',
    [50, 65, 45, 35, 35, 45, 35, 35, 50, 45, 45, 55], 'low', 'soclib', 'Mental-health advocacy', [
      ['2015', 'Founded the Live Love Laugh Foundation after speaking about her depression', ['welfare']],
      ['2020', 'Visited JNU after masked attackers assaulted students', ['liberty']],
    ]),
  P('swara', 'Swara Bhasker', 'indpub', 'Actor', '2009–', 'Actor and activist who spoke at protests against the citizenship law.',
    [35, 72, 45, 25, 25, 40, 20, 15, 30, 35, 30, 60], 'medium', 'soclib', 'Liberal activism', [
      ['2019', 'Spoke at protests against the Citizenship Amendment Act', ['faith', 'liberty']],
      ['2023', 'Married Fahad Ahmad, then a Samajwadi Party youth leader', ['values']],
    ]),
  P('prakashraj', 'Prakash Raj', 'indpub', 'Actor', '1988–', 'Multilingual actor and BJP critic who stood as an independent in 2019.',
    [38, 72, 45, 25, 25, 35, 25, 10, 35, 40, 30, 60], 'medium', 'soclib', '#JustAsking', [
      ['2017', 'Began speaking out after the murder of journalist Gauri Lankesh', ['liberty']],
      ['2019', 'Contested Bangalore Central as an independent and lost', ['power']],
    ]),
  P('naseeruddin', 'Naseeruddin Shah', 'indpub', 'Actor', '1975–', 'Veteran actor who warned about mob violence in 2018.',
    [45, 65, 40, 25, 25, 40, 25, 15, 30, 30, 30, 55], 'medium', 'soclib', 'Liberal secularism', [
      ['2018', 'Said the death of a cow was given more importance than a policeman’s, after a mob killing in Bulandshahr', ['liberty', 'faith']],
    ]),
  P('javedakhtar', 'Javed Akhtar', 'indpub', 'Lyricist and screenwriter', '1971–', 'Atheist writer who criticises both Hindu and Muslim fundamentalism; nominated Rajya Sabha MP 2010–16.',
    [45, 65, 40, 30, 25, 45, 20, 5, 45, 40, 40, 55], 'medium', 'soclib', 'Secular rationalism', [
      ['2010', 'Nominated to the Rajya Sabha; pushed copyright protection for lyricists', ['econ']],
      ['2023', 'Said in Lahore that the 26/11 attackers were still at large in Pakistan', ['nation']],
    ]),
  P('shabana', 'Shabana Azmi', 'indpub', 'Actor and activist', '1974–', 'Five-time National Award winner and housing-rights activist; nominated Rajya Sabha MP 1997–2003.',
    [35, 78, 45, 30, 25, 40, 20, 10, 35, 35, 30, 60], 'medium', 'socdem', 'Left-liberal activism', [
      ['1986', 'Hunger strike for Mumbai slum dwellers with Nivara Hakk', ['welfare']],
    ]),
  P('anuragkashyap', 'Anurag Kashyap', 'indpub', 'Film director', '2003–', 'Director (Gangs of Wasseypur) who has fought censorship and criticised the government.',
    [40, 65, 40, 20, 25, 40, 15, 15, 35, 40, 35, 55], 'medium', 'soclib', 'Anti-censorship', [
      ['2016', 'His company co-produced Udta Punjab, which the Bombay High Court cleared with one cut', ['liberty']],
    ]),
  P('sakshi', 'Sakshi Malik', 'indpub', 'Wrestler', '2010–2023', 'Olympic bronze medallist (2016) who quit wrestling in protest at the federation’s leadership.',
    [50, 65, 50, 40, 30, 45, 40, 45, 65, 50, 50, 50], 'low', 'socdem', 'Wrestlers’ protest', [
      ['2023', 'Joined the wrestlers’ protest and announced her retirement after an ally of the accused chief won the federation election', ['liberty', 'values']],
    ]),
  P('arundhatiroy', 'Arundhati Roy', 'indpub', 'Novelist and essayist', '1997–', 'Booker Prize winner and fierce critic of big dams, the state and capitalism.',
    [10, 85, 70, 15, 15, 25, 15, 10, 15, 50, 10, 90], 'high', 'demsoc', 'Anti-capitalist left', [
      ['1999', 'Wrote “The Greater Common Good” against the Narmada dams', ['eco']],
      ['2024', 'Delhi’s Lieutenant Governor sanctioned her prosecution under UAPA over a 2010 speech', ['liberty']],
    ]),
  P('medhapatkar', 'Medha Patkar', 'indpub', 'Activist', '1985–', 'Leader of the Narmada Bachao Andolan against the displacement caused by big dams.',
    [20, 82, 65, 20, 15, 10, 25, 20, 30, 45, 10, 95], 'high', 'green', 'Narmada Bachao Andolan', [
      ['1985', 'Began organising against the Sardar Sarovar dam', ['eco', 'welfare']],
      ['2024', 'Convicted of defaming Delhi’s Lieutenant Governor in a case from 2001', ['liberty']],
    ]),
  P('yogendrayadav', 'Yogendra Yadav', 'indpub', 'Psephologist and activist', '2012–', 'Co-founder of AAP, expelled in 2015; a leader of the 2020–21 farmers’ protest.',
    [35, 78, 60, 30, 25, 25, 35, 25, 45, 45, 30, 65], 'medium', 'lohiaite', 'Swaraj India', [
      ['2015', 'Expelled from AAP; founded Swaraj Abhiyan', ['power']],
      ['2020', 'Helped lead the farmers’ protest against the farm laws', ['econ']],
    ]),
  P('prashantbhushan', 'Prashant Bhushan', 'indpub', 'Lawyer', '1983–', 'Public-interest lawyer behind cases on the 2G spectrum, coal allocation and Rafale.',
    [40, 70, 50, 15, 15, 35, 25, 20, 35, 40, 30, 70], 'medium', 'soclib', 'Public-interest litigation', [
      ['2012', 'His petition led the Supreme Court to cancel 122 2G telecom licences', ['econ', 'power']],
      ['2020', 'Held in contempt by the Supreme Court over two tweets and fined ₹1', ['liberty']],
    ]),
  P('ramachandraguha', 'Ramachandra Guha', 'indpub', 'Historian', '1989–', 'Author of India After Gandhi and a liberal critic of both Hindutva and dynasty.',
    [50, 60, 40, 25, 20, 35, 30, 20, 40, 35, 30, 70], 'medium', 'soclib', 'Liberal history', [
      ['2007', 'Published India After Gandhi', ['nation']],
      ['2019', 'Detained in Bengaluru while protesting the citizenship law', ['liberty']],
    ]),
  P('amartyasen', 'Amartya Sen', 'indpub', 'Economist', '1960s–', 'Nobel laureate (1998) on welfare and famine, critic of demonetisation.',
    [35, 82, 35, 25, 20, 40, 25, 10, 30, 25, 25, 60], 'high', 'socdem', 'Capability approach', [
      ['1998', 'Nobel Prize in economics for work on welfare economics', ['welfare']],
      ['2016', 'Called demonetisation a “despotic action”', ['power']],
    ]),
  P('raghuramrajan', 'Raghuram Rajan', 'indpub', 'Economist; former RBI Governor', '2013–2016 (RBI)', 'Former IMF chief economist who led the RBI’s inflation targeting and bad-loan clean-up.',
    [70, 55, 25, 35, 25, 45, 35, 25, 40, 25, 40, 55], 'medium', 'soclib', 'Liberal economics', [
      ['2015', 'Ordered the asset-quality review that exposed banks’ bad loans', ['econ']],
      ['2022', 'Walked with Rahul Gandhi on the Bharat Jodo Yatra', ['power']],
    ]),
  P('narayanamurthy', 'N. R. Narayana Murthy', 'indpub', 'Co-founder of Infosys', '1981–', 'IT pioneer who said in 2023 that young Indians should work 70 hours a week.',
    [72, 35, 35, 55, 40, 55, 55, 40, 60, 40, 50, 40], 'low', 'classlib', 'Work-ethic capitalism', [
      ['2023', 'Said young Indians should work 70 hours a week', ['welfare']],
    ]),
  P('nilekani', 'Nandan Nilekani', 'indpub', 'Co-founder of Infosys; architect of Aadhaar', '2009–', 'Led the creation of Aadhaar and India’s digital public infrastructure; Congress candidate in 2014.',
    [68, 55, 30, 45, 30, 60, 35, 25, 40, 30, 40, 55], 'medium', 'centrist', 'Digital public infrastructure', [
      ['2009', 'Became chairman of the Unique Identification Authority (Aadhaar)', ['center', 'liberty']],
      ['2014', 'Contested Bangalore South for the Congress and lost', ['power']],
    ]),
  P('ratantata', 'Ratan Tata', 'indpub', 'Chairman of the Tata group', '1991–2012', 'Industrialist who globalised the Tata group and built the Nano. Died 2024.',
    [62, 55, 40, 50, 40, 50, 50, 40, 55, 40, 45, 55], 'low', 'centrist', 'Philanthropic capitalism', [
      ['2008', 'Moved the Nano factory from Singur to Gujarat after protests', ['econ']],
    ]),
  P('annahazare', 'Anna Hazare', 'indpub', 'Gandhian activist', '1975–', 'Led the 2011 hunger strike for an anti-corruption ombudsman (Jan Lokpal).',
    [40, 65, 60, 50, 35, 25, 60, 55, 60, 50, 30, 75], 'medium', 'gandhian', 'India Against Corruption', [
      ['2011', 'Fasted at Ramlila Maidan for a Jan Lokpal bill', ['power']],
      ['2013', 'Parliament passed the Lokpal and Lokayuktas Act', ['power']],
    ]),
  P('sonamwangchuk', 'Sonam Wangchuk', 'indpub', 'Educator and climate activist', '1988–', 'Ladakhi engineer who fasted for Sixth Schedule protection for Ladakh and was detained under the National Security Act in 2025.',
    [40, 60, 50, 25, 20, 10, 40, 35, 50, 45, 20, 95], 'medium', 'green', 'Ladakh autonomy', [
      ['2024', 'Held a 21-day climate fast for Ladakh’s statehood and Sixth Schedule status', ['center', 'eco']],
      ['2025', 'Detained under the National Security Act after violence in Leh', ['liberty']],
    ]),
  P('sadhguru', 'Sadhguru (Jaggi Vasudev)', 'indpub', 'Founder of the Isha Foundation', '1992–', 'Spiritual teacher whose environmental campaigns drew government backing.',
    [60, 40, 55, 60, 55, 60, 70, 85, 75, 55, 55, 75], 'low', 'conservative', 'Isha Foundation', [
      ['2017', 'Led the Rally for Rivers campaign', ['eco']],
      ['2019', 'Backed the citizenship amendment in a widely shared video', ['faith', 'nation']],
    ]),
  P('ramdev', 'Baba Ramdev', 'indpub', 'Yoga guru; co-founder of Patanjali', '2006–', 'TV yoga teacher whose Patanjali brand sells “swadeshi” goods; backed the BJP in 2014.',
    [55, 45, 80, 65, 60, 60, 80, 88, 88, 70, 65, 50], 'medium', 'natcon', 'Swadeshi', [
      ['2011', 'Held an anti-corruption fast at Ramlila Maidan, broken up by police', ['power']],
      ['2024', 'Apologised to the Supreme Court over misleading Patanjali health claims', ['liberty']],
    ]),
  P('srisri', 'Sri Sri Ravi Shankar', 'indpub', 'Founder of the Art of Living', '1981–', 'Spiritual leader who sat on the Supreme Court’s Ayodhya mediation panel.',
    [58, 50, 55, 55, 45, 55, 70, 85, 70, 50, 40, 60], 'low', 'conservative', 'Art of Living', [
      ['2019', 'Appointed to the Supreme Court’s Ayodhya mediation panel', ['faith']],
    ]),
  P('arnab', 'Arnab Goswami', 'indpub', 'Editor-in-chief, Republic TV', '2017–', 'Prime-time anchor whose combative, nationalist shows dominate Indian TV news.',
    [62, 45, 60, 80, 70, 70, 72, 70, 95, 72, 88, 25], 'medium', 'natcon', 'Nationalist television', [
      ['2017', 'Launched Republic TV', ['nation']],
      ['2020', 'Arrested in an abetment-to-suicide case; the Supreme Court granted bail', ['liberty']],
    ]),
  P('ravishkumar', 'Ravish Kumar', 'indpub', 'Journalist', '1996–', 'Hindi news anchor who left NDTV after the Adani group took control in 2022.',
    [35, 78, 50, 20, 20, 40, 25, 15, 30, 40, 25, 60], 'medium', 'socdem', 'Independent journalism', [
      ['2019', 'Won the Ramon Magsaysay Award', ['liberty']],
      ['2022', 'Resigned from NDTV after the Adani takeover', ['liberty', 'econ']],
    ]),
  P('dhruvrathee', 'Dhruv Rathee', 'indpub', 'YouTuber', '2014–', 'Explainer YouTuber whose 2024 video asking whether India was becoming a dictatorship drew tens of millions of views.',
    [50, 65, 40, 25, 20, 40, 20, 15, 35, 35, 35, 75], 'medium', 'soclib', 'Liberal explainers', [
      ['2024', 'Posted “Is India becoming a dictatorship?” before the general election', ['power']],
    ]),
  P('kunalkamra', 'Kunal Kamra', 'indpub', 'Comedian', '2013–', 'Stand-up comedian and government critic.',
    [42, 70, 45, 15, 15, 35, 20, 15, 30, 35, 30, 60], 'medium', 'soclib', 'Satire', [
      ['2020', 'Banned by several airlines after heckling Arnab Goswami on a flight', ['liberty']],
      ['2025', 'A parody song about Eknath Shinde led to the venue being vandalised and police cases', ['liberty']],
    ]),
  P('virdas', 'Vir Das', 'indpub', 'Comedian', '2010–', 'Comedian whose 2021 “I come from two Indias” monologue drew police complaints.',
    [50, 60, 40, 30, 25, 45, 25, 20, 40, 35, 35, 55], 'low', 'soclib', 'Satire', [
      ['2021', 'Performed “Two Indias” at the Kennedy Center; complaints were filed against him', ['liberty', 'nation']],
      ['2023', 'Won the International Emmy for comedy', ['nation']],
    ]),
];

/** Parties, placed from manifestos and record in government. */
export interface Party { id: string; name: string; short: string; note: string; v: Vec; fam: string }
export const INDIA_PARTIES: Party[] = [
  { id: 'bjp', short: 'BJP', name: 'Bharatiya Janata Party', note: 'Hindu nationalist party governing India since 2014.', v: [62, 55, 62, 72, 68, 75, 72, 75, 88, 72, 78, 30], fam: 'hindutva' },
  { id: 'inc', short: 'INC', name: 'Indian National Congress', note: 'The party of the freedom struggle; centre-left, secular and welfare-minded.', v: [45, 72, 45, 40, 38, 55, 38, 25, 48, 40, 40, 55], fam: 'socdem' },
  { id: 'aap', short: 'AAP', name: 'Aam Aadmi Party', note: 'Anti-corruption party built on free public services; governs Punjab.', v: [45, 82, 50, 50, 58, 35, 45, 45, 60, 50, 45, 55], fam: 'lpop' },
  { id: 'aitc', short: 'TMC', name: 'All India Trinamool Congress', note: 'Mamata Banerjee’s Bengal-based party; lost the state in 2026.', v: [35, 80, 58, 58, 70, 20, 45, 40, 55, 50, 40, 50], fam: 'lpop' },
  { id: 'sp', short: 'SP', name: 'Samajwadi Party', note: 'Lohiaite socialist party of Uttar Pradesh’s backward castes and Muslims.', v: [40, 75, 55, 48, 52, 38, 45, 35, 55, 50, 45, 48], fam: 'lohiaite' },
  { id: 'bsp', short: 'BSP', name: 'Bahujan Samaj Party', note: 'Ambedkarite party of Dalits and the Bahujan.', v: [40, 80, 50, 52, 68, 45, 32, 25, 48, 50, 48, 42], fam: 'ambedkarite' },
  { id: 'cpim', short: 'CPI(M)', name: 'Communist Party of India (Marxist)', note: 'India’s largest communist party; ruled Kerala until 2026.', v: [18, 85, 65, 45, 45, 40, 28, 8, 38, 58, 28, 55], fam: 'demsoc' },
  { id: 'dmk', short: 'DMK', name: 'Dravida Munnetra Kazhagam', note: 'Dravidian party of social justice and state autonomy.', v: [40, 82, 50, 40, 45, 12, 30, 12, 48, 48, 35, 50], fam: 'dravidian' },
  { id: 'tvk', short: 'TVK', name: 'Tamilaga Vettri Kazhagam', note: 'Vijay’s party, governing Tamil Nadu since 2026; placement rests on its stated programme.', v: [42, 78, 50, 40, 45, 25, 35, 30, 55, 50, 40, 50], fam: 'dravidian' },
  { id: 'ssubt', short: 'SS (UBT)', name: 'Shiv Sena (Uddhav Balasaheb Thackeray)', note: 'Marathi regionalist party allied with the Congress since 2019.', v: [50, 62, 55, 60, 55, 45, 60, 60, 78, 60, 60, 45], fam: 'conservative' },
  { id: 'aimim', short: 'AIMIM', name: 'All India Majlis-e-Ittehadul Muslimeen', note: 'Hyderabad-based party of Muslim political representation.', v: [42, 72, 50, 35, 42, 40, 62, 72, 40, 45, 40, 45], fam: 'islamdem' },
  { id: 'rjd', short: 'RJD', name: 'Rashtriya Janata Dal', note: 'Lalu Prasad’s Mandal-era party of Bihar.', v: [38, 78, 55, 48, 58, 40, 42, 30, 50, 50, 45, 42], fam: 'lohiaite' },
  { id: 'tdp', short: 'TDP', name: 'Telugu Desam Party', note: 'Andhra Pradesh party of Chandrababu Naidu, a BJP ally since 2024.', v: [65, 62, 42, 55, 50, 35, 50, 45, 55, 42, 45, 42], fam: 'neoliberal' },
  { id: 'jknc', short: 'JKNC', name: 'Jammu & Kashmir National Conference', note: 'Kashmir’s oldest party, seeking autonomy and statehood.', v: [48, 65, 45, 32, 38, 10, 45, 45, 35, 40, 25, 50], fam: 'centrist' },
];
