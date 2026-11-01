/**
 * The Social Atlas: twelve axes on how each country's laws treat private
 * and social life, built from legal indicators rather than opinion.
 *
 * Every indicator is a question about the law, with a fixed list of answers.
 * Scored indicators give each answer a value from 0 (the state restricts or
 * punishes the most) to 100 (the person is freest or best protected); an axis
 * is the mean of its scored indicators that are known for that country.
 * Descriptive indicators (score null) are shown as facts and not scored.
 *
 * Values reflect the law as understood on 1 November 2026. `conf` marks how
 * firm an indicator's data is: 'documented' for well-established law,
 * 'check' where sources disagree or the law is changing. '?' means unknown,
 * and an unknown is never guessed.
 */
import { COUNTRIES, type Country } from './countries';

export type SocAxisId = 'marriage' | 'family' | 'private' | 'violence' | 'lgbt' | 'women' | 'religion' | 'pluralism' | 'speech' | 'justice' | 'digital' | 'choices';

export interface SocAxis { id: SocAxisId; name: string; question: string; low: string; high: string; hue: string }

export const SOC_AXES: SocAxis[] = [
  { id: 'marriage', name: 'Marriage', question: 'Who may marry whom, and from what age?', low: 'Restricted', high: 'Open', hue: '#b36b12' },
  { id: 'family', name: 'Family', question: 'Divorce, inheritance, children and leave', low: 'Unequal', high: 'Equal', hue: '#c08a1e' },
  { id: 'private', name: 'Private life', question: 'Does the state police sex and morality between adults?', low: 'Policed', high: 'Private', hue: '#8a3f9e' },
  { id: 'violence', name: 'Sexual violence', question: 'How fully does the law protect against rape and harassment?', low: 'Gaps', high: 'Protected', hue: '#c2412d' },
  { id: 'lgbt', name: 'LGBTQ+', question: 'Are same-sex relationships and trans people legal, equal and protected?', low: 'Criminalised', high: 'Equal', hue: '#d0568a' },
  { id: 'women', name: 'Women', question: 'Equal standing in law, freedom of movement and reproductive choice', low: 'Unequal', high: 'Equal', hue: '#9b2d5a' },
  { id: 'religion', name: 'Religion', question: 'Can people of every faith, or none, practise freely?', low: 'Restricted', high: 'Free', hue: '#1f7a6b' },
  { id: 'pluralism', name: 'Pluralism', question: 'Can parties compete and power change hands?', low: 'One party', high: 'Competitive', hue: '#1b5fae' },
  { id: 'speech', name: 'Speech', question: 'Can people criticise rulers and reach the open internet?', low: 'Censored', high: 'Open', hue: '#3c7fc4' },
  { id: 'justice', name: 'Punishment', question: 'How harsh is the penal system: death, flogging, executions?', low: 'Harsh', high: 'Restrained', hue: '#5a5a5a' },
  { id: 'digital', name: 'Online dating', question: 'Can people date online, and are they protected from image abuse?', low: 'Blocked', high: 'Open & protected', hue: '#e07b39' },
  { id: 'choices', name: 'Personal choices', question: 'Drugs, alcohol, dying and military service', low: 'Prohibited', high: 'Permitted', hue: '#4f8a3a' },
];
export const SOC_AXIS = Object.fromEntries(SOC_AXES.map((a) => [a.id, a])) as Record<SocAxisId, SocAxis>;

export interface IndValue { code: string; label: string; score: number | null }
export interface Indicator {
  id: string;
  axis: SocAxisId;
  name: string;
  q: string;
  values: IndValue[];
  conf: 'documented' | 'check';
  basis: string;
  /** code per country id ('?' when unknown) */
  data: Record<string, string>;
  notes: Record<string, string>;
  /** tags for themed views */
  theme?: ('muslim' | 'ideology' | 'dating' | 'rape' | 'lgbt' | 'marriage')[];
}

const ALL = COUNTRIES.map((c) => c.id);

/** d: lists of country ids per answer code; rest: code for every unlisted country (else '?'). */
function I(
  id: string, axis: SocAxisId, name: string, q: string, values: [string, string, number | null][], conf: Indicator['conf'], basis: string,
  d: Record<string, string>, rest: string | null, notes: Record<string, string> = {}, theme?: Indicator['theme'],
): Indicator {
  const data: Record<string, string> = {};
  for (const [code, list] of Object.entries(d)) for (const c of list.split(/\s+/).filter(Boolean)) {
    if (!ALL.includes(c)) throw new Error(`${id}: unknown country ${c}`);
    if (data[c]) throw new Error(`${id}: ${c} listed twice`);
    data[c] = code;
  }
  for (const c of ALL) if (!data[c]) data[c] = rest ?? '?';
  return { id, axis, name, q, values: values.map(([code, label, score]) => ({ code, label, score })), conf, basis, data, notes, theme };
}
/** An indicator read from the country facts already kept in countries.ts. */
function F(id: string, axis: SocAxisId, name: string, q: string, values: [string, string, number | null][], basis: string, pick: (c: Country) => string, theme?: Indicator['theme']): Indicator {
  return { id, axis, name, q, values: values.map(([code, label, score]) => ({ code, label, score })), conf: 'documented', basis, data: Object.fromEntries(COUNTRIES.map((c) => [c.id, pick(c)])), notes: {}, theme };
}

export const INDICATORS: Indicator[] = [
  /* ------------------------------------------------------------ marriage */
  I('m_age', 'marriage', 'Minimum marriage age', 'Is 18 the minimum age for marriage, with no exceptions?',
    [['y', '18 or over, no exceptions', 100], ['e', 'Exceptions allow marriage under 18', 55], ['l', 'Girls may marry below 18 as standard, or no floor', 0]], 'check',
    'National marriage and child-protection law; Girls Not Brides country pages.',
    { y: 'de nl se dk no ch mx co cl jp kr cn in eg ph vn', e: 'us gb fr it es pt pl hu ua ca au br ar tr il et sg ve id za ru th', l: 'pk ir sa ng bd kp' }, null,
    { us: 'Varies by state; a growing number of states ban all marriage under 18.', gb: 'England and Wales banned under-18 marriage in 2023; in Scotland the age is 16.', co: 'Law 2447 of 2025 banned all marriage under 18.', cl: 'Raised to 18 without exceptions in 2022.', ve: 'Age 16 with parental consent since a 2014 amendment.', in: '21 for men and 18 for women; child marriages are voidable rather than void.', pk: '16 for girls in most provinces; 18 in Sindh and Islamabad.', bd: 'A 2017 “special circumstances” clause allows marriage below the minimum with no floor.', ir: '13 for girls, lower with a father’s and a court’s approval.', sa: 'No codified minimum; court approval is required under 18.', ng: 'The Child Rights Act sets 18, but several northern states have not adopted it.', kp: '18 for men and 17 for women.' }, ['marriage']),
  I('m_poly', 'marriage', 'Polygamy', 'May a man take more than one wife?',
    [['b', 'Banned', 100], ['p', 'Allowed for some communities', 40], ['l', 'Legal', 0]], 'documented',
    'Family and personal-status codes.',
    { l: 'sa ir eg pk bd id', p: 'in ng sg ph za' }, 'b',
    { in: 'Allowed for Muslims under personal law; banned for others, and in Uttarakhand under its 2024 civil code.', sg: 'Muslims only, with Registry of Muslim Marriages permission.', ph: 'Muslims only, under the Code of Muslim Personal Laws.', za: 'Customary marriages may be polygamous.', ng: 'Allowed under customary and Islamic law.', id: 'Requires court permission and the first wife’s consent.', pk: 'Requires an arbitration council’s permission.', il: 'Banned since 1977, though practised among some Bedouin.' }, ['marriage']),
  I('m_faith', 'marriage', 'Marriage across religions', 'Can two people of different religions marry in the country?',
    [['y', 'Yes, freely', 100], ['r', 'Restricted', 25]], 'check',
    'Personal-status law; whether civil marriage exists.',
    { r: 'sa ir eg pk bd id il', '?': 'ng' }, 'y',
    { il: 'There is no civil marriage; interfaith couples marry abroad and are registered.', id: 'Marriages must follow one religion, so one partner usually converts.', eg: 'A Muslim woman may not marry a non-Muslim man.', in: 'Allowed under the Special Marriage Act, but several states’ anti-conversion laws target interfaith marriages.' }, ['marriage']),
  I('m_civil', 'marriage', 'Civil marriage', 'Can a couple marry without a religious ceremony or authority?',
    [['y', 'Yes', 100], ['n', 'No, marriage goes through religion', 20]], 'check',
    'Marriage and personal-status law.',
    { n: 'il sa ir eg pk bd id' }, 'y',
    { il: 'Marriage is controlled by the religious courts of each community.' }, ['marriage']),
  I('m_wali', 'marriage', 'Male guardian for a bride', 'Does an adult woman need a male guardian’s consent to marry?',
    [['n', 'No', 100], ['v', 'In some regions or communities', 50], ['y', 'Yes', 0]], 'check',
    'Personal-status law; Hanafi law lets an adult woman marry without a guardian.',
    { y: 'sa ir id', v: 'ng' }, 'n',
    { ir: 'A father’s consent is required for a first marriage.', id: 'A wali is required for Muslim marriages.', pk: 'The courts ruled in 2003 that an adult woman may marry without a guardian.' }, ['marriage']),
  I('m_equal', 'marriage', 'Equal marriage age', 'Is the minimum marriage age the same for women and men?',
    [['y', 'Yes', 100], ['n', 'No', 50]], 'documented',
    'Marriage law.',
    { n: 'cn in vn kp ir pk bd', '?': 'sa ng' }, 'y',
    { cn: '22 for men, 20 for women.', vn: '20 for men, 18 for women.', bd: '21 for men, 18 for women.' }, ['marriage']),

  /* -------------------------------------------------------------- family */
  I('f_divorce', 'family', 'Divorce', 'Can both spouses divorce on equal terms?',
    [['e', 'Yes, equally', 100], ['p', 'Depends on religious personal law', 60], ['u', 'Husbands have an easier route', 30], ['r', 'No divorce for most people', 0]], 'check',
    'Family and personal-status law.',
    { r: 'ph', u: 'sa ir eg pk bd il', p: 'in ng sg id', '?': 'kp' }, 'e',
    { ph: 'Only Muslims can divorce; others can seek an annulment. Divorce bills have stalled in the Senate.', il: 'In rabbinical courts a Jewish wife needs her husband to grant a get.', cl: 'Divorce was legalised in 2004.', it: 'Divorce was legalised in 1970.' }),
  I('f_inherit', 'family', 'Daughters’ inheritance', 'Do daughters inherit equally with sons?',
    [['y', 'Yes', 100], ['p', 'Depends on religious personal law', 60], ['n', 'No, usually half a son’s share', 30]], 'documented',
    'Succession law; Islamic inheritance gives a daughter half a son’s share.',
    { n: 'sa ir eg pk bd', p: 'in id ng sg ph', '?': 'kp' }, 'y',
    { in: 'Hindu daughters gained equal rights in 2005; Muslim personal law applies to Muslims.', za: 'Customary male primogeniture was struck down in 2004.' }),
  I('f_mat', 'family', 'Paid maternity leave', 'Does the law give at least 14 weeks of paid maternity leave (the ILO standard)?',
    [['y', 'Yes', 100], ['n', 'No', 40]], 'check',
    'Labour codes; ILO Convention 183 sets 14 weeks.',
    { n: 'us kr mx id sa ar ng pk', '?': 'eg' }, 'y',
    { us: 'There is no national paid leave; some states provide it.', kr: '90 days, just under 13 weeks, plus generous parental leave.', in: '26 weeks since 2017.', au: 'Government-paid parental leave reaches 26 weeks in 2026.' }),
  I('f_smack', 'family', 'Corporal punishment of children', 'Is hitting children banned in all settings, including the home?',
    [['y', 'Yes', 100], ['p', 'In part of the country', 60], ['n', 'No', 30]], 'check',
    'Global Initiative to End All Corporal Punishment of Children.',
    { y: 'se no dk de nl pt es pl hu ua br ar co mx fr ve il kr jp', p: 'gb', '?': 'cl ch za kp' }, 'n',
    { se: 'The first country to ban it, in 1979.', gb: 'Banned in Scotland (2020) and Wales (2022), not in England or Northern Ireland.' }),

  /* ------------------------------------------------------- private life */
  I('p_adult', 'private', 'Adultery', 'Is adultery a crime?',
    [['n', 'No', 100], ['v', 'Some states, rarely enforced', 70], ['c', 'Yes, prison or fine', 30], ['d', 'Yes, flogging or stoning in law', 0]], 'documented',
    'Penal codes.',
    { d: 'ir sa ng pk', c: 'eg bd ph id', v: 'us', '?': 'kp et' }, 'n',
    { ng: 'Stoning applies under Sharia penal codes in northern states.', pk: 'Stoning remains in the Hudood law but has never been carried out.', id: 'Under the new criminal code in force from January 2026, on complaint by a spouse.', in: 'Struck down by the Supreme Court in 2018.', kr: 'Struck down by the Constitutional Court in 2015.', tr: 'Decriminalised in 1996–98.' }, ['marriage']),
  I('p_premar', 'private', 'Sex outside marriage', 'Is sex between unmarried adults a crime?',
    [['n', 'No', 100], ['v', 'In some regions', 50], ['c', 'Yes', 25], ['d', 'Yes, flogging in law', 0]], 'documented',
    'Penal codes.',
    { d: 'ir sa pk', c: 'id', v: 'ng', '?': 'kp' }, 'n',
    { id: 'Up to one year in prison under the 2026 criminal code, on complaint by a parent, child or spouse; Aceh canes offenders.', pk: 'Zina remains a hadd offence.' }),
  I('p_cohab', 'private', 'Living together unmarried', 'Is it a crime for an unmarried couple to live together?',
    [['n', 'No', 100], ['c', 'Yes', 20]], 'documented',
    'Penal codes.',
    { c: 'id ir sa', '?': 'pk ng kp' }, 'n',
    { id: 'Up to six months in prison under the 2026 criminal code.' }),
  I('p_sexwork', 'private', 'Sex work', 'How does the law treat selling and buying sex between adults?',
    [['l', 'Legal and regulated', 100], ['p', 'Selling legal, organising illegal', 70], ['n', 'Buying illegal (Nordic model)', 45], ['i', 'Illegal', 15]], 'check',
    'Penal codes and prostitution laws.',
    { l: 'de nl ch tr co hu bd', p: 'gb it es pt pl dk br ar cl mx in jp sg ve au', n: 'se no fr ca il', i: 'us cn ru kr sa ir eg pk id ph th vn kp ua za ng', '?': 'et' }, null,
    { us: 'Illegal except in some Nevada counties.', au: 'Varies by state; decriminalised in New South Wales and Victoria.', mx: 'Varies by state.', th: 'Illegal but widely tolerated.', bd: 'Legal for adults in registered brothels.' }),
  I('p_porn', 'private', 'Pornography for adults', 'Is pornography legal for adults?',
    [['l', 'Legal', 100], ['r', 'Legal with mandatory age checks or censorship', 70], ['b', 'Production or distribution banned', 10]], 'check',
    'Obscenity, media and online-safety laws.',
    { b: 'cn kp sa ir pk bd id vn th ru ua kr in', r: 'gb fr de it jp us sg tr eg au', l: 'nl se dk no pt es ch ca br mx ar cl co za il pl hu', '?': 'ph ng et ve' }, null,
    { us: 'About half the states require age verification for pornographic sites.', gb: 'The Online Safety Act requires age checks from July 2025.', fr: 'Age checks required from 2025.', jp: 'Genitals must be pixelated by law.', in: 'Production and distribution are illegal; private viewing is not.' }),
  I('p_dress', 'private', 'Compulsory religious dress', 'Must women wear religious dress such as the hijab in public?',
    [['n', 'No', 100], ['v', 'In some regions', 50], ['y', 'Yes', 0]], 'documented',
    'Penal and administrative law.',
    { y: 'ir', v: 'id' }, 'n',
    { ir: 'Enforced since 1983; protests after Mahsa Amini’s death in custody in 2022.', id: 'Aceh enforces Islamic dress.', sa: 'The abaya was declared no longer legally required in 2018–19.' }),
  I('p_police', 'private', 'Morality police', 'Is there a religious or morality police that can stop people in public?',
    [['n', 'No', 100], ['v', 'In some regions', 50], ['y', 'Yes', 0]], 'check',
    'Laws on religious police.',
    { y: 'ir kp', v: 'ng id' }, 'n',
    { sa: 'Stripped of arrest powers in 2016.', ng: 'Hisbah boards in Kano and other northern states.', id: 'Aceh’s Wilayatul Hisbah.', kp: 'Youth-league patrols enforce dress and hairstyle rules.' }),

  /* --------------------------------------------------- sexual violence */
  I('v_marital', 'violence', 'Marital rape', 'Is rape within marriage a crime?',
    [['y', 'Yes', 100], ['p', 'Not explicit; general rape law may apply', 40], ['n', 'No, a husband is exempt', 0]], 'check',
    'Penal codes; UN Women and UNFPA reviews.',
    { n: 'in ir sa bd eg et', p: 'cn ru ng', '?': 'pk vn kp' }, 'y',
    { in: 'Exception 2 to section 63 of the 2023 penal code exempts husbands where the wife is over 18; challenged in the Supreme Court.', bd: 'Exempt if the wife is over 13.', et: 'The criminal code defines rape as intercourse outside wedlock.', sg: 'Marital immunity was repealed in 2020.', ng: 'Exempt under the Penal Code used in the north.' }, ['rape']),
  I('v_consent', 'violence', 'Consent-based definition', 'Does the law define rape as sex without consent, rather than requiring force?',
    [['y', 'Consent-based', 100], ['v', 'Varies by state', 70], ['f', 'Force or threat must be shown', 40]], 'check',
    'Penal codes; Amnesty International reviews of European law.',
    { y: 'gb ca se de es dk nl no ch fr pl au il za jp ua in', v: 'us', f: 'it hu kr br ru cn ph', '?': 'tr ar mx pt cl co ve id th vn sg sa ir pk bd eg ng et kp' }, null,
    { fr: 'Adopted in October 2025.', es: '“Only yes is yes” law of 2022.', se: '2018.', pl: '2025.', it: 'A consent bill passed the Chamber in 2025; the Senate committee rewrote it around “dissent” in 2026.', jp: 'The 2023 reform created the offence of non-consensual sexual intercourse.', in: 'Rape is defined as against her will or without consent, but with the marital exemption.' }, ['rape']),
  I('v_marry', 'violence', '“Marry your rapist” clause', 'Can marrying the victim end a rape prosecution or sentence?',
    [['n', 'No', 100], ['y', 'Yes', 0]], 'check',
    'UNFPA State of World Population 2021 and penal codes.',
    { y: 'ru th ve ph', '?': 'sa ir kp' }, 'n',
    { ru: 'Applies to statutory rape of a minor.', ph: 'Subsequent marriage extinguishes the criminal action.' }, ['rape']),
  I('v_max', 'violence', 'Maximum penalty for rape', 'What is the heaviest sentence the law allows for rape?',
    [['d', 'Death', null], ['l', 'Life imprisonment', null], ['t', 'A fixed term only', null]], 'check',
    'Penal codes; usually for aggravated rape.',
    { d: 'sa ir cn in pk bd eg vn th id ng', l: 'us gb fr de jp kr ca au tr za ru ph', t: 'br es il ua se nl ch no pt dk co sg', '?': 'it mx ar pl hu cl ve et kp' }, null,
    { in: 'Death for rape of a girl under 12 since 2018.', bd: 'Death since 2020.', us: 'Death for rape was ruled unconstitutional in 2008; Florida and Tennessee passed child-rape death laws in 2023–24.', id: 'Death or chemical castration for aggravated child sexual abuse since 2016.', ng: 'Under Sharia law and some state laws.' }, ['rape']),
  I('v_castr', 'violence', 'Chemical castration', 'Does the law allow chemical castration of sex offenders?',
    [['y', 'Yes', null], ['v', 'In some states', null], ['n', 'No', null]], 'check',
    'Penal codes.',
    { y: 'kr id pk ua pl ru', v: 'us ng', n: 'gb fr de it es pt nl se no dk ch ca au br ar mx cl co jp in cn za tr il' }, null,
    { kr: 'Since 2011.', pk: '2021, for repeat offenders.', ng: 'Kaduna State, 2020.' }, ['rape']),
  I('v_harass', 'violence', 'Sexual-harassment law', 'Is there a law against sexual harassment at work?',
    [['y', 'Yes', 100], ['n', 'No', 0]], 'check',
    'World Bank, Women, Business and the Law.',
    { n: 'ru', '?': 'ir kp' }, 'y',
    { eg: 'Criminalised in 2014.', sa: 'Anti-Harassment Law, 2018.' }, ['rape']),

  /* ------------------------------------------------------------- LGBTQ+ */
  I('l_legal', 'lgbt', 'Same-sex relations', 'Is sex between people of the same sex legal?',
    [['y', 'Legal', 100], ['f', 'Prosecuted under other laws', 25], ['c', 'Crime with prison', 10], ['d', 'Death penalty in law', 0]], 'documented',
    'ILGA World; penal codes.',
    { d: 'ir sa ng', c: 'pk bd et', f: 'eg' }, 'y',
    { ng: 'Death by stoning under Sharia penal codes in twelve northern states; 14 years elsewhere.', eg: 'Prosecuted under “debauchery” laws.', in: 'Decriminalised by the Supreme Court in 2018.', sg: 'Section 377A was repealed in 2022.', id: 'Legal nationally; criminalised in Aceh.', ru: 'Legal, but the “international LGBT movement” was declared extremist in 2023.' }, ['lgbt']),
  F('l_union', 'lgbt', 'Same-sex couples', 'Can same-sex couples marry or form a legal union?',
    [['marriage', 'Marriage', 100], ['unions', 'Civil unions', 65], ['none', 'No recognition', 30], ['criminal', 'Relationships criminalised', 0]],
    'Country facts in this atlas; ILGA World.', (c) => c.facts.samesex, ['lgbt']),
  I('l_adopt', 'lgbt', 'Joint adoption', 'Can same-sex couples adopt jointly?',
    [['y', 'Yes', 100], ['n', 'No', 0]], 'check',
    'ILGA World.',
    { y: 'us gb fr de br ca es au mx za ar il se nl ch pt dk no co cl', '?': 'th' }, 'n',
    { it: 'Only stepchild adoption, through the courts.' }, ['lgbt']),
  I('l_work', 'lgbt', 'Job protection', 'Does national law ban firing someone for their sexual orientation?',
    [['y', 'Yes', 100], ['n', 'No', 0]], 'check',
    'ILGA World; employment law.',
    { y: 'us gb fr de br ca it es au mx za ar il ua pl se nl pt dk no co cl hu th', '?': 'ch ve kr' }, 'n',
    { us: 'Bostock v. Clayton County, 2020.', jp: 'The 2023 LGBT understanding law has no binding ban.' }, ['lgbt']),
  I('l_hate', 'lgbt', 'Hate-crime law', 'Does hate-crime law cover sexual orientation?',
    [['y', 'Yes', 100], ['n', 'No', 30]], 'check',
    'ILGA World; penal codes.',
    { y: 'us gb fr de br ca es cl co nl se no dk pt ch za hu', n: 'pl it jp kr cn in ru ph sg', '?': 'au mx ar ua il th' }, 'n',
    { br: 'The Supreme Court made homophobia a crime under the racism law in 2019.', it: 'The Zan bill failed in 2021.' }, ['lgbt']),
  I('l_gender', 'lgbt', 'Legal gender change', 'Can a trans person change their legal gender?',
    [['y', 'By self-declaration', 100], ['v', 'Varies by state', 70], ['m', 'With medical or court requirements', 60], ['n', 'Not possible', 0]], 'check',
    'ILGA World; Transgender Europe.',
    { y: 'ar dk no pt es de ch cl co br ca', v: 'us au mx', m: 'gb fr it nl se pl ua jp kr cn in ir tr sg id il za', n: 'hu ru th ph sa ng et ve', '?': 'pk vn eg bd kp' }, null,
    { hu: 'Banned in 2020.', ru: 'Banned in 2023, with gender-affirming care.', de: 'Self-determination law in force since November 2024.', us: 'The federal government stopped issuing X and changed passport markers in 2025.', ir: 'Permitted after surgery since a 1980s fatwa.' }, ['lgbt']),
  I('l_conv', 'lgbt', 'Conversion practices', 'Are “conversion therapy” practices banned nationally?',
    [['y', 'Yes', 100], ['v', 'In some states', 60], ['p', 'Professional ban only', 50], ['n', 'No', 30]], 'check',
    'ILGA World.',
    { y: 'de fr es pt ca mx no', v: 'us au', p: 'br', '?': 'ch dk se ar' }, 'n',
    {}, ['lgbt']),
  I('l_prop', 'lgbt', 'Restrictions on LGBT expression', 'Does the law restrict LGBT content, groups or Pride events?',
    [['n', 'No', 100], ['v', 'In some states', 60], ['p', 'Partly', 40], ['y', 'Yes', 0]], 'check',
    'ILGA World; media and assembly law.',
    { y: 'ru hu sa ir eg ng', p: 'cn id tr', v: 'us', '?': 'kp pk bd et' }, 'n',
    { ru: '“LGBT propaganda” law of 2013, extended to adults in 2022.', hu: '2021 child-protection law; Pride banned in 2025.', ng: 'The 2014 act bans gay clubs and organisations.', tr: 'Istanbul Pride banned every year since 2015.', us: 'Several states restrict teaching about sexual orientation and gender identity.' }, ['lgbt']),

  /* --------------------------------------------------------------- women */
  I('w_permit', 'women', 'Husband’s permission', 'Does a married woman need her husband’s permission to travel abroad or to work?',
    [['n', 'No', 100], ['y', 'Yes', 0]], 'documented',
    'World Bank, Women, Business and the Law.',
    { y: 'ir', '?': 'kp' }, 'n',
    { sa: 'Women over 21 may travel without a guardian’s permission since 2019.', ir: 'A husband may bar his wife from a job he deems against the family’s interests.' }),
  I('w_testify', 'women', 'Testimony', 'Does a woman’s testimony count the same as a man’s in court?',
    [['y', 'Yes', 100], ['v', 'Not in some courts', 50], ['n', 'No, in some matters', 0]], 'documented',
    'Evidence law.',
    { n: 'ir sa pk', v: 'ng', '?': 'kp' }, 'y',
    { pk: 'Under the 1984 Qanun-e-Shahadat in financial matters.', ng: 'In Sharia courts.' }),
  I('w_nation', 'women', 'Passing on citizenship', 'Can a mother pass her citizenship to her children on the same terms as a father?',
    [['y', 'Yes', 100], ['p', 'With extra conditions', 50], ['n', 'No', 0]], 'documented',
    'UNHCR, Background note on gender equality and nationality laws.',
    { n: 'sa', p: 'ir', '?': 'kp' }, 'y',
    { ir: 'Children of Iranian mothers may apply since 2019.' }),
  I('w_dv', 'women', 'Domestic-violence law', 'Is there a specific law against domestic violence?',
    [['y', 'Yes', 100], ['p', 'In some provinces', 50], ['n', 'No', 0]], 'check',
    'World Bank, Women, Business and the Law.',
    { n: 'ir eg ru', p: 'pk', '?': 'kp et' }, 'y',
    { ru: 'First-offence domestic battery was made an administrative offence in 2017.', br: 'Maria da Penha Law, 2006.' }),
  F('w_abort', 'women', 'Abortion', 'When is abortion legal?',
    [['request', 'On request', 100], ['broad', 'On broad grounds', 70], ['varies', 'Varies by state', 50], ['restricted', 'Only in limited cases', 30], ['banned', 'Banned', 0]],
    'Country facts in this atlas; Center for Reproductive Rights.', (c) => c.facts.abortion),
  I('w_contra', 'women', 'Contraception', 'Is contraception freely available?',
    [['y', 'Yes', 100], ['r', 'Restricted by the state', 30]], 'check',
    'Reproductive-health law.',
    { r: 'ir', '?': 'kp' }, 'y',
    { ir: 'The 2021 Youthful Population law restricts free contraception and sterilisation.', ph: 'Guaranteed by the 2012 Reproductive Health Act.' }),
  I('w_femicide', 'women', 'Femicide as a crime', 'Is killing a woman because she is a woman a separate crime?',
    [['y', 'Yes', null], ['n', 'No', null]], 'check',
    'Penal codes.',
    { y: 'mx br ar cl co ve it' }, 'n',
    { it: 'Made a separate crime with life imprisonment in November 2025.', mx: '2012.' }),
  I('w_quota', 'women', 'Gender quota in parliament', 'Does the law reserve seats or set candidate quotas for women?',
    [['y', 'Yes', null], ['n', 'No', null]], 'check',
    'IDEA Gender Quotas Database.',
    { y: 'fr es pt it pl ar mx br cl co kr id pk bd in eg ua', n: 'us gb de jp ca au ru tr ir il se nl ch sg hu no dk et ng za sa', '?': 'cn kp vn th ph ve' }, null,
    { in: 'The 2023 Women’s Reservation Act takes effect after the next delimitation.', pk: '60 reserved seats.', bd: '50 reserved seats.' }),
  I('w_leader', 'women', 'A woman has led', 'Has a woman been head of government or elected head of state?',
    [['y', 'Yes', null], ['n', 'No', null]], 'documented',
    'Historical record; monarchs excluded.',
    { y: 'gb de fr it jp br ca au kr mx id tr ar il ua pl se ch pk cl ph no pt dk th bd et in ve sg', n: 'us cn ru es sa za ng eg ir nl hu co kp vn' }, null,
    { jp: 'Sanae Takaichi, from 2025.', mx: 'Claudia Sheinbaum, from 2024.', it: 'Giorgia Meloni, from 2022.', ve: 'Delcy Rodríguez, interim president from January 2026.', in: 'Indira Gandhi, 1966.', il: 'Golda Meir, 1969.', et: 'Sahle-Work Zewde, president 2018–24.' }),

  /* ------------------------------------------------------------ religion */
  I('r_blas', 'religion', 'Blasphemy law', 'Is insulting religion a crime?',
    [['n', 'No', 100], ['y', 'Yes, prison', 30], ['d', 'Yes, death in law', 0]], 'check',
    'Pew Research Center review of blasphemy laws; penal codes.',
    { d: 'pk ir sa', y: 'in id eg bd ng tr ru pl it de es ch br ph sg th il dk', '?': 'kp za et ve vn' }, 'n',
    { pk: 'Section 295-C carries a mandatory death sentence; no one has been executed under it.', dk: 'A 2023 law bans the improper treatment of holy scriptures, after Quran burnings.', gb: 'Abolished in England and Wales in 2008.', nl: 'Abolished in 2014.', no: 'Abolished in 2015.', ca: 'Abolished in 2018.' }),
  I('r_apost', 'religion', 'Leaving religion', 'Is there a penalty for leaving Islam or the state religion?',
    [['n', 'No', 100], ['v', 'In some regions', 50], ['c', 'Civil penalties, such as annulled marriage', 40], ['d', 'Death in law or practice', 0]], 'check',
    'Penal and personal-status law.',
    { d: 'ir sa', c: 'eg pk', v: 'ng', '?': 'kp' }, 'n',
    {}),
  I('r_veil', 'religion', 'Face-veil ban', 'Is wearing a face veil such as the niqab or burqa banned in public?',
    [['n', 'No', 100], ['p', 'Partial or regional ban', 60], ['y', 'Nationwide ban', 30]], 'documented',
    'National legislation.',
    { y: 'fr dk ch', p: 'nl de it no ca cn ru', '?': 'eg' }, 'n',
    { fr: '2011.', dk: '2018.', ch: 'National ban in force from January 2025, after a 2021 referendum.', nl: 'Banned on public transport and in schools, hospitals and government buildings, 2019.', ca: 'Québec bans face coverings for giving and receiving public services.', cn: 'Banned in Xinjiang since 2017.', ru: 'Banned in Dagestan in 2024.' }, ['muslim']),
  I('r_scarf', 'religion', 'Headscarf restrictions', 'Are headscarves banned for students or public servants?',
    [['n', 'No', 100], ['p', 'Some regions or roles', 60], ['y', 'Yes, nationally', 30]], 'check',
    'National and regional law.',
    { y: 'fr cn', p: 'ca de in ru' }, 'n',
    { fr: 'Banned in state schools since 2004 and for public servants; the abaya was banned in schools in 2023.', ca: 'Québec’s Bill 21 (2019) bars religious symbols for teachers, police and judges.', in: 'Karnataka’s 2022 school-uniform order.', tr: 'Turkey lifted its headscarf bans in 2010–13.', cn: 'Restrictions on religious dress in Xinjiang.' }, ['muslim']),
  I('r_mosque', 'religion', 'Mosque and minaret limits', 'Does the law limit minarets or mosque architecture?',
    [['n', 'No', 100], ['y', 'Yes', 30]], 'check',
    'National law and policy.',
    { y: 'ch cn' }, 'n',
    { ch: 'Minarets banned by referendum in 2009.', cn: 'Domes and minarets removed under “sinicisation” campaigns.' }, ['muslim']),
  I('r_slaughter', 'religion', 'Religious slaughter', 'Is slaughter without stunning, as in halal and kosher practice, banned?',
    [['n', 'Allowed', 100], ['y', 'Banned', 60]], 'documented',
    'Animal-welfare law.',
    { y: 'se no dk ch' }, 'n',
    { ch: 'Banned for mammals since 1893.', pl: 'A 2013 ban was overturned in 2014.' }, ['muslim']),
  I('r_citizen', 'religion', 'Religion in citizenship law', 'Does citizenship or immigration law treat people differently by religion?',
    [['n', 'No', 100], ['p', 'Preference for one religion', 60], ['y', 'Excludes a religion from a benefit', 20]], 'check',
    'Citizenship and immigration law.',
    { y: 'in', p: 'il' }, 'n',
    { in: 'The 2019 Citizenship Amendment Act fast-tracks citizenship for Hindu, Sikh, Buddhist, Jain, Parsi and Christian refugees from three neighbouring countries, not Muslims.', il: 'The Law of Return gives Jews the right to immigrate.' }, ['muslim']),
  I('r_ban', 'religion', 'Banned religious groups', 'Does the state ban or criminalise a religious group?',
    [['n', 'No', 100], ['p', 'Restrictions on some groups', 50], ['y', 'Yes', 0]], 'check',
    'US State Department religious-freedom reports; national law.',
    { y: 'ru cn kp ir sa sg pk eg', p: 'id vn hu' }, 'n',
    { ru: 'Jehovah’s Witnesses banned as extremist in 2017.', cn: 'Falun Gong banned; Uyghur Muslims detained in Xinjiang, which the UN human rights office said in 2022 may amount to crimes against humanity.', ir: 'Baha’is are persecuted.', sa: 'Non-Muslim public worship is banned.', sg: 'Jehovah’s Witnesses banned since 1972.', pk: 'Ahmadis may not call themselves Muslims (1984 ordinance).', eg: 'Jehovah’s Witnesses banned since 1960; Baha’is cannot register.', id: 'A 2008 decree restricts Ahmadiyya.' }, ['muslim']),

  /* ----------------------------------------------------------- pluralism */
  I('pl_regime', 'pluralism', 'Party competition', 'Can opposition parties compete for power?',
    [['c', 'Yes, competitive elections', 100], ['r', 'Restricted', 40], ['o', 'One party, or no parties', 0]], 'check',
    'Constitutions and election law; V-Dem regime classifications.',
    { o: 'cn vn kp sa', r: 'ru ir eg ve et tr th bd pk sg ua' }, 'c',
    { ua: 'Elections postponed under martial law since 2022; some parties banned.', bd: 'The Awami League was barred from the February 2026 election.', th: 'Move Forward was dissolved and its leaders banned from politics in 2024.', tr: 'Istanbul mayor and opposition candidate Ekrem İmamoğlu was jailed in 2025.', ir: 'The Guardian Council vets all candidates.', sg: 'Competitive elections with one dominant party since 1959.' }, ['ideology']),
  I('pl_turnover', 'pluralism', 'Opposition won power', 'Has an opposition party won power at a national election since 2000?',
    [['y', 'Yes', 100], ['n', 'No', 0]], 'check',
    'Election results.',
    { n: 'cn ru sa tr za eg ir sg kp vn ve et', '?': 'ch' }, 'y',
    { hu: 'Péter Magyar’s Tisza won in April 2026.', za: 'The ANC lost its majority in 2024 but still leads the government.', ch: 'Governed by a standing coalition of all major parties.' }, ['ideology']),
  I('pl_comrule', 'pluralism', 'Ruled by a communist party', 'Is the country ruled by a communist party?',
    [['y', 'Yes', null], ['n', 'No', null]], 'documented',
    'Constitutions.',
    { y: 'cn vn kp' }, 'n', {}, ['ideology']),
  I('pl_comban', 'pluralism', 'Communism banned', 'Are communist parties or symbols banned?',
    [['y', 'Yes', null], ['p', 'Partly', null], ['n', 'No', null]], 'check',
    'National law.',
    { y: 'ua pl id hu', p: 'kr' }, 'n',
    { ua: 'Decommunisation laws of 2015.', id: 'Banned since 1966.', kr: 'The National Security Act; a party was dissolved in 2014.', pl: 'The constitution bans parties with totalitarian programmes.' }, ['ideology']),
  I('pl_nazban', 'pluralism', 'Nazism or fascism banned', 'Are Nazi or fascist parties or symbols banned?',
    [['y', 'Yes', null], ['n', 'No', null]], 'check',
    'National law.',
    { y: 'de it ua pl hu br ru', '?': 'ch ar fr' }, 'n',
    { it: 'The 1952 Scelba law bans reorganising the Fascist party.', de: 'Section 86a of the criminal code.', ru: 'Public display of Nazi symbols banned in 2014.' }, ['ideology']),
  I('pl_denial', 'pluralism', 'Holocaust denial a crime', 'Is Holocaust denial a crime?',
    [['y', 'Yes', null], ['n', 'No', null]], 'check',
    'National law.',
    { y: 'de fr ch it pl hu il ru ca', n: 'us gb se dk no nl au jp', '?': 'es pt ua br' }, null,
    { ca: 'Added to the criminal code in 2022.' }, ['ideology']),

  /* --------------------------------------------------------------- speech */
  I('s_insult', 'speech', 'Insulting the ruler', 'Is insulting the head of state or ruler a crime?',
    [['n', 'No', 100], ['y', 'Yes', 30]], 'check',
    'Penal codes.',
    { y: 'th tr id sa ir ru cn kp vn ve eg es pl it de pt', n: 'us gb fr nl jp kr ar br ca au se no cl co mx za', '?': 'ng in pk bd et il ua hu sg ph dk ch' }, null,
    { th: 'Lèse-majesté, Article 112, up to 15 years per count.', tr: 'Article 299.', id: 'Restored in the 2026 criminal code.', nl: 'Abolished in 2020.', fr: 'Abolished in 2013.' }),
  I('s_block', 'speech', 'Social media blocked', 'Are major platforms such as Facebook, X, Instagram or YouTube blocked?',
    [['n', 'No', 100], ['p', 'Blocked at times in 2024–26', 50], ['y', 'Yes', 0]], 'check',
    'Access Now and OONI measurements.',
    { y: 'cn kp ir ru', p: 'tr pk ve bd et vn' }, 'n',
    { ru: 'Facebook, Instagram and X since 2022; YouTube throttled.', pk: 'X blocked from February 2024 into 2025.', ve: 'X blocked from August 2024.', vn: 'Telegram blocked in 2025.' }),
  I('s_fake', 'speech', '“Fake news” law', 'Can spreading “false information” lead to prison?',
    [['n', 'No', 100], ['y', 'Yes', 20]], 'check',
    'Penal codes and online-content laws.',
    { y: 'ru sg cn eg tr pk ve et hu vn th kp ir sa id ng', n: 'us gb fr de jp ca au nl se no dk ch pt es it br ar cl mx za kr', '?': 'in bd ph pl ua il co' }, null,
    { ru: 'Up to 15 years for “fakes” about the army, 2022.', sg: 'POFMA, 2019.', tr: 'Disinformation law, 2022.', pk: 'PECA amendments, 2025.' }),
  I('s_vpn', 'speech', 'VPN restrictions', 'Is using unapproved VPNs restricted?',
    [['n', 'No', 100], ['p', 'Partly', 50], ['y', 'Yes', 10]], 'check',
    'National internet regulation.',
    { y: 'cn ru ir kp', p: 'pk' }, 'n',
    { pk: 'VPN registration required from 2024.', ru: 'Advertising VPNs banned in 2024.' }),
  I('s_shutdown', 'speech', 'Internet shutdowns', 'Has the government cut internet access in a region or nationwide since 2023?',
    [['y', 'Yes', null], ['n', 'No', null]], 'check',
    'Access Now #KeepItOn reports.',
    { y: 'in ir pk et bd ru', '?': 've tr kp' }, 'n',
    { in: 'The world’s most frequent shutdowns, mostly regional.' }, ['dating']),

  /* ------------------------------------------------------------- justice */
  F('j_death', 'justice', 'Death penalty', 'Does the law still allow the death penalty?',
    [['abolished', 'Abolished', 100], ['ordinary', 'Abolished for ordinary crimes', 85], ['practice', 'Abolished in practice', 65], ['retains', 'Retained', 20]],
    'Country facts in this atlas; Amnesty International.', (c) => c.facts.death),
  I('j_exec', 'justice', 'Recent executions', 'Has the country carried out executions in 2024–26?',
    [['n', 'No', 100], ['y', 'Yes', 0]], 'check',
    'Amnesty International death-penalty reports.',
    { y: 'cn ir sa us sg eg vn kp jp' }, 'n',
    { cn: 'Believed to execute thousands a year; figures are a state secret.', vn: 'Believed; figures are secret.', kp: 'Reported by defectors and UN investigators.', jp: 'One execution, in June 2025.' }),
  I('j_flog', 'justice', 'Flogging and caning', 'Does the law allow judicial flogging or caning?',
    [['n', 'No', 100], ['v', 'In some regions or rarely', 50], ['y', 'Yes', 0]], 'documented',
    'Penal codes.',
    { y: 'sg ir sa', v: 'ng id pk', '?': 'kp' }, 'n',
    { sg: 'Caning for some 30 offences, including vandalism.', id: 'Aceh.' }),
  I('j_drugs', 'justice', 'Death for drugs', 'Can drug trafficking carry the death penalty?',
    [['n', 'No', 100], ['y', 'Yes', 0]], 'documented',
    'Harm Reduction International.',
    { y: 'cn ir sa sg id vn th in pk bd eg', '?': 'kp kr ng' }, 'n',
    {}),
  I('j_hudud', 'justice', 'Death for private conduct', 'Can adultery, same-sex relations or apostasy carry the death penalty?',
    [['n', 'No', 100], ['y', 'Yes', 0]], 'documented',
    'Penal codes.',
    { y: 'ir sa ng pk' }, 'n',
    { ng: 'Under Sharia penal codes in northern states.', pk: 'Stoning for adultery is in the Hudood law but has never been carried out.' }),

  /* ------------------------------------------------------- online dating */
  I('d_apps', 'digital', 'Dating apps', 'Are mainstream dating apps such as Tinder and Bumble available?',
    [['y', 'Yes', 100], ['r', 'Foreign apps blocked; local apps allowed', 60], ['b', 'Blocked', 0]], 'check',
    'OONI measurements and press reports.',
    { b: 'kp ir', r: 'cn', '?': 'pk' }, 'y',
    { cn: 'Tantan and Momo are allowed; Tinder is not available.', pk: 'Tinder was blocked in 2020; its status since is unclear.', ir: 'The state launched its own matchmaking app, Hamdam, in 2020.' }, ['dating']),
  I('d_gay', 'digital', 'Gay dating apps', 'Are gay dating apps such as Grindr blocked or removed from app stores?',
    [['n', 'No', 100], ['y', 'Yes', 0]], 'check',
    'Grindr help centre; OONI; Access Now.',
    { y: 'tr id sa ir pk cn kp', '?': 'ru eg' }, 'n',
    { cn: 'Grindr left Chinese app stores in 2022; Blued and Finka were removed from Apple’s China store on government order in 2025.' }, ['dating', 'lgbt']),
  I('d_image', 'digital', 'Image-based abuse', 'Is sharing intimate images without consent (“revenge porn”) a crime?',
    [['y', 'Yes', 100], ['n', 'No', 0]], 'check',
    'Penal codes and cyber-crime laws.',
    { y: 'us gb fr de jp br ca it es au kr mx ph sg il za ar pk in id se nl no ch', '?': 'cl co bd tr dk pt pl hu ua ru cn vn th ve et ng eg sa ir kp' }, null,
    { us: '49 states plus the federal TAKE IT DOWN Act of 2025.', mx: 'Ley Olimpia, 2021.', kr: 'Sexual Violence Punishment Act.', id: '2022 Sexual Violence Crimes law covers electronic sexual violence.' }, ['dating']),
  I('d_deepfake', 'digital', 'Sexual deepfakes', 'Is making or sharing sexual deepfakes of a real person a crime?',
    [['y', 'Yes', 100], ['n', 'No', 30]], 'check',
    'Recent legislation.',
    { y: 'kr gb au us' }, null,
    { kr: 'Possessing or viewing them was also criminalised in 2024.', gb: 'Creating them was made an offence in 2025.', us: 'Sharing them is covered by the TAKE IT DOWN Act, 2025.' }, ['dating']),
  I('d_entrap', 'digital', 'App entrapment', 'Have security forces been documented using dating apps to arrest LGBT people?',
    [['y', 'Yes', null], ['n', 'Not documented', null]], 'check',
    'Human Rights Watch, “All This Terror Because of a Photo”, 2023.',
    { y: 'eg' }, null, {}, ['dating', 'lgbt']),

  /* ---------------------------------------------------- personal choices */
  I('c_cannabis', 'choices', 'Cannabis', 'Is recreational cannabis legal?',
    [['l', 'Legal', 100], ['d', 'Decriminalised or tolerated', 70], ['v', 'Varies by state', 60], ['i', 'A crime', 20]], 'check',
    'Drug laws.',
    { l: 'ca de', d: 'mx za nl pt es ch it ar cl co br il th', v: 'us au', '?': 'kp' }, 'i',
    { ca: '2018.', de: 'Partial legalisation in 2024.', th: 'Decriminalised in 2022; restricted back towards medical use in 2025.', br: 'The Supreme Court decriminalised possession of up to 40 g in 2024.', us: 'Legal in about 24 states; illegal federally.' }),
  I('c_alcohol', 'choices', 'Alcohol', 'Is alcohol banned?',
    [['n', 'No', 100], ['v', 'In some states', 60], ['m', 'For Muslims, or by permit', 30], ['y', 'Yes', 0]], 'documented',
    'National law.',
    { y: 'sa', m: 'ir pk bd', v: 'in ng id' }, 'n',
    { in: 'Banned in Gujarat, Bihar, Nagaland and Mizoram.', id: 'Aceh.' }),
  I('c_dying', 'choices', 'Assisted dying', 'Is assisted dying or euthanasia legal?',
    [['y', 'Yes', 100], ['v', 'In some states', 70], ['p', 'Only in narrow cases set by courts', 60], ['n', 'No', 40]], 'check',
    'National law.',
    { y: 'nl ca es co ch au de', v: 'us', p: 'it', '?': 'gb fr pt' }, 'n',
    { gb: 'An assisted-dying bill for England and Wales passed the Commons in 2025; its final status should be checked.', de: 'Assisted suicide has been legal since a 2020 court ruling, without a regulating law.', ch: 'Assisted suicide is legal; euthanasia is not.' }),
  F('c_service', 'choices', 'Military service', 'Is military service compulsory?',
    [['none', 'No conscription', 100], ['suspended', 'Suspended', 90], ['nominal', 'In law; mostly volunteers', 70], ['compulsory', 'Compulsory', 30]],
    'Country facts in this atlas.', (c) => c.facts.conscription),
  I('c_suicide', 'choices', 'Attempted suicide', 'Is attempting suicide a crime?',
    [['n', 'No', 100], ['y', 'Yes', 30]], 'check',
    'Penal codes.',
    { y: 'bd ng', '?': 'sa ir kp et' }, 'n',
    { in: 'Dropped from the 2023 penal code.', pk: 'Decriminalised in 2022.', sg: 'Decriminalised in 2020.' }),
];

/* ------------------------------------------------------------- scoring */
export interface SocScore { v: number | null; known: number; total: number }
export function countryAxes(cid: string): Record<SocAxisId, SocScore> {
  const out = {} as Record<SocAxisId, SocScore>;
  for (const a of SOC_AXES) {
    const inds = INDICATORS.filter((i) => i.axis === a.id && i.values.some((v) => v.score !== null));
    const scores = inds.map((i) => i.values.find((v) => v.code === i.data[cid])?.score).filter((s): s is number => typeof s === 'number');
    out[a.id] = { v: scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : null, known: scores.length, total: inds.length };
  }
  return out;
}
export const SOC_VEC: Record<string, (number | null)[]> = Object.fromEntries(COUNTRIES.map((c) => { const s = countryAxes(c.id); return [c.id, SOC_AXES.map((a) => s[a.id].v)]; }));
export const SOC_TOTAL = (cid: string) => { const v = SOC_VEC[cid].filter((x): x is number => x != null); return Math.round(v.reduce((a, b) => a + b, 0) / v.length); };
export const valueOf = (ind: Indicator, cid: string) => ind.values.find((v) => v.code === ind.data[cid]);
export const SCORED = INDICATORS.filter((i) => i.values.some((v) => v.score !== null));

/* ------------------------------------------------------ leaders’ records */
export type StanceTopic = 'lgbt' | 'women' | 'religion' | 'speech';
export const STANCE_TOPICS: { id: StanceTopic; name: string; low: string; high: string }[] = [
  { id: 'lgbt', name: 'LGBTQ+', low: 'Restricts', high: 'Expands rights' },
  { id: 'women', name: 'Women and reproduction', low: 'Restricts', high: 'Expands rights' },
  { id: 'religion', name: 'Religious minorities', low: 'Restricts', high: 'Protects' },
  { id: 'speech', name: 'Speech and press', low: 'Restricts', high: 'Protects' },
];
/** Leaders’ records on social questions: a placement and the documented act it rests on. Only where the record is clear. */
export const STANCES: Record<string, Partial<Record<StanceTopic, [number, string]>>> = {
  trump: { lgbt: [20, '2025 executive order recognising only two sexes in federal policy; reinstated the ban on transgender military service'], women: [30, 'Appointed three of the justices in the majority that overturned Roe v. Wade (2022)'], religion: [35, '2017 entry ban on travellers from several Muslim-majority countries, upheld by the Supreme Court in 2018'], speech: [35, 'Barred the Associated Press from White House events in 2025 over its style for the Gulf of Mexico'] },
  xi: { lgbt: [20, 'The Beijing LGBT Center closed in 2023 and campus LGBT groups were shut'], women: [35, 'Feminist and #MeToo activists jailed, including Huang Xueqin in 2024'], religion: [5, 'Mass detention of Uyghurs in Xinjiang; the UN human rights office said in 2022 it may amount to crimes against humanity'], speech: [5, 'Hong Kong National Security Law (2020)'] },
  modi: { lgbt: [40, 'The government opposed same-sex marriage before the Supreme Court, which declined to legalise it in 2023'], women: [60, 'Women’s Reservation Act (2023), reserving a third of Lok Sabha seats after the next delimitation'], religion: [25, 'Citizenship Amendment Act (2019, in force 2024) fast-tracks non-Muslim refugees from three neighbours'], speech: [30, 'Internet cut in Kashmir from August 2019, with 4G restored only in 2021'] },
  putin: { lgbt: [0, '“LGBT propaganda” ban extended to adults (2022); the LGBT movement declared extremist and gender transition banned (2023)'], women: [30, 'Signed the 2017 law reducing first-offence domestic battery to an administrative offence'], religion: [20, 'Jehovah’s Witnesses banned as extremist (2017)'], speech: [0, '2022 law punishing “fakes” about the army with up to 15 years in prison'] },
  zelensky: { lgbt: [60, 'Backed legal partnerships for same-sex couples in response to a 2022 petition; no law has passed'], women: [75, 'Ratified the Istanbul Convention on violence against women (2022)'], religion: [50, 'Signed the 2024 law banning religious groups tied to the Russian Orthodox Church'], speech: [40, 'National TV channels merged into a single wartime broadcast under martial law (2022)'] },
  lula: { lgbt: [75, 'Created a national secretariat for LGBTQIA+ rights (2023)'], women: [65, 'Equal Pay Law (2023) requiring companies to report pay gaps'] },
  sheinbaum: { women: [80, 'Constitutional reform on substantive equality for women (2024)'] },
  milei: { lgbt: [30, '2025 decree barring gender-affirming treatment for minors'], women: [25, 'Abolished the Ministry of Women, Genders and Diversity (2023)'] },
  macron: { lgbt: [70, 'Signed the ban on conversion practices (2022)'], women: [90, 'Freedom to have an abortion written into the constitution (2024)'], religion: [40, '2021 law against what the government called Islamist separatism; the abaya banned in schools (2023)'] },
  meloni: { lgbt: [25, 'Made surrogacy a crime even when done abroad (2024); registries told to stop listing two mothers on birth certificates (2023)'], women: [55, 'Made femicide a separate crime with life imprisonment (2025)'] },
  sanchez: { lgbt: [90, 'Trans law allowing self-declaration of legal gender from 16 (2023)'], women: [90, '“Only yes is yes” consent law (2022)'] },
  takaichi: { lgbt: [30, 'Has opposed same-sex marriage'], women: [35, 'Has opposed letting married couples keep separate surnames'] },
  erdogan: { lgbt: [10, 'Istanbul Pride banned every year since 2015; 2025 declared the “Year of the Family”'], women: [20, 'Withdrew Turkey from the Istanbul Convention (2021)'], speech: [15, 'Istanbul mayor Ekrem İmamoğlu jailed (2025); X and Instagram blocked at times'] },
  mbs: { lgbt: [5, 'Same-sex relations remain punishable by death'], women: [55, 'Ended the driving ban (2018) and let women over 21 travel without a guardian’s permission (2019)'], speech: [5, 'US intelligence assessed in 2021 that he approved the 2018 operation that killed journalist Jamal Khashoggi'] },
  ramaphosa: { women: [70, 'Signed three laws against gender-based violence (2022)'] },
  sisi: { lgbt: [5, 'Mass arrests after a rainbow flag was raised at a Cairo concert (2017)'], speech: [5, 'Hundreds of news websites blocked since 2017'] },
  abiy: { speech: [30, 'Internet and social media cut during the Tigray war and in Amhara (2023)'] },
  albanese: { women: [80, 'Extended government-paid parental leave to 26 weeks by 2026'] },
  kim: { speech: [0, '2020 law punishing the consumption of South Korean media'], religion: [0, 'Religious practice outside state control is punished'] },
  netanyahu: { speech: [30, '“Al Jazeera law” used to close the channel’s Israeli operations (2024)'] },
  tusk: { women: [65, 'Restored state funding for IVF (2024)'] },
  bukele: { speech: [20, 'Foreign Agents Law taxing foreign-funded NGOs and media (2025); state of exception since 2022'] },
  shehbaz: { speech: [20, 'PECA amendments criminalising “fake news” (2025); X blocked in 2024–25'] },
  orban: { lgbt: [5, '2021 law banning LGBT content for minors; Pride banned in 2025'], speech: [20, 'Sovereignty Protection Office (2023)'] },
  maduro: { speech: [5, 'X blocked (2024); opposition leader María Corina Machado barred from the presidential election'] },
  khamenei: { women: [0, 'Compulsory hijab enforced; Mahsa Amini died in morality-police custody (2022)'], lgbt: [0, 'Same-sex relations punishable by death'] },
  biden: { lgbt: [90, 'Signed the Respect for Marriage Act (2022)'], women: [75, 'Executive orders protecting access to abortion medication after Dobbs (2022)'] },
  obama: { lgbt: [85, 'Repealed “Don’t Ask, Don’t Tell” (2010)'] },
  merkel: { lgbt: [60, 'Allowed the 2017 free vote that legalised same-sex marriage, voting against it herself'] },
  thatcher: { lgbt: [15, 'Section 28 (1988) banned the “promotion” of homosexuality by local authorities'] },
  khomeini: { women: [5, 'Compulsory hijab and the 1979 suspension of the Family Protection Law'] },
  ataturk: { women: [85, 'Women’s right to vote in national elections (1934); civil code banning polygamy (1926)'], religion: [50, 'Abolished the caliphate (1924) and made the state secular'] },
  hitler: { lgbt: [0, 'Tightened Paragraph 175 (1935); thousands of gay men sent to concentration camps'], religion: [0, 'The Holocaust: the murder of six million Jews'], speech: [0, 'Abolished the free press and all other parties (1933)'] },
  stalin: { lgbt: [5, 'Recriminalised male homosexuality (1933)'], religion: [5, 'Mass persecution of clergy in the 1930s'], speech: [0, 'Show trials and the Great Terror (1936–38)'] },
  mandela: { lgbt: [90, 'South Africa’s 1996 constitution became the first to ban discrimination by sexual orientation'], women: [85, 'Choice on Termination of Pregnancy Act (1996)'] },
};
