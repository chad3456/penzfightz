/**
 * Through Their Eyes: 52 authors and philosophers, each placed on the twelve
 * Compass axes and each given a "lens" — a scoring rule built from the ideas
 * in their writing (Orwell's Big Brother, Atwood's Gilead, Chanakya's
 * statecraft). Lenses are applied to countries (using the twelve axes, the
 * Social Atlas and its legal indicators) and to leaders (twelve axes only).
 *
 * Both the placements and the lenses are editorial interpretations. Every
 * criterion states which data it reads and why it follows from the work, so
 * the judgement can be checked and argued with.
 */
import { AXES, similarity, type AxisId, type Vec } from './model';
import { INDICATORS, SOC_AXES, SOC_VEC, valueOf, type SocAxisId } from './social';
import { ECON, giniScaled, redistScaled } from './economy';

/** 'ax:<axis>' twelve-axis value · 'soc:<axis>' Social Atlas axis · 'ind:<id>' indicator score ·
 *  'near:<axis>:<target>' closeness to a value · 'calc:moderation' closeness to the middle of every axis. */
export type Src = `ax:${AxisId}` | `soc:${SocAxisId}` | `ind:${string}` | `near:${AxisId}:${number}` | 'calc:moderation' | 'eco:gini' | 'eco:redist';
export interface Criterion { src: Src; dir: 1 | -1; w: number; why: string }
export interface Lens { name: string; kind: 'nightmare' | 'ideal'; question: string; top: string; criteria: Criterion[] }
export interface Author {
  id: string; name: string; years: string; from: string; era: 'Ancient' | 'Early modern' | 'Modern' | 'Contemporary';
  works: string; idea: string; quote?: string; v: Vec; lens: Lens;
}

const C = (src: Src, dir: 1 | -1, w: number, why: string): Criterion => ({ src, dir, w, why });

export const AUTHORS: Author[] = [
  /* ------------------------------------------------------------ dystopias */
  { id: 'orwell', name: 'George Orwell', years: '1903–1950', from: 'Britain', era: 'Modern', works: 'Nineteen Eighty-Four (1949), Animal Farm (1945), Homage to Catalonia (1938)',
    idea: 'A democratic socialist who spent his life warning that any ideology, left or right, can end in a state that controls truth itself.', quote: 'Big Brother is watching you.',
    v: [25, 80, 50, 20, 10, 45, 45, 25, 55, 45, 45, 50],
    lens: { name: 'Big Brother Index', kind: 'nightmare', top: 'Oceania', question: 'How close is this place to Oceania: one Party, a rewritten record, the Thought Police and endless war?', criteria: [
      C('soc:pluralism', -1, 2, 'One Party rules Oceania and no opposition can win.'),
      C('soc:speech', -1, 2, 'The Ministry of Truth rewrites the record and controls what may be said.'),
      C('ind:s_fake', -1, 1, '“False information” laws let the state decide what is true.'),
      C('ind:s_block', -1, 1, 'Cutting off outside sources keeps citizens inside the Party’s version of reality.'),
      C('ind:s_vpn', -1, 1, 'Every channel is watched; there is no private way out.'),
      C('ind:p_police', -1, 1, 'The Thought Police patrol behaviour in public.'),
      C('ax:power', 1, 1, 'Big Brother: the cult of one leader.'),
      C('ax:liberty', 1, 1, 'Surveillance and order over liberty.'),
      C('ax:force', 1, 1, 'Oceania is always at war; war keeps the population in line.'),
      C('ind:j_exec', -1, 1, 'Enemies of the Party are “vaporised”.'),
    ] } },
  { id: 'huxley', name: 'Aldous Huxley', years: '1894–1963', from: 'Britain', era: 'Modern', works: 'Brave New World (1932), Brave New World Revisited (1958), Island (1962)',
    idea: 'Feared that people would be controlled not by pain but by pleasure, consumption and distraction.',
    v: [45, 55, 40, 20, 15, 25, 35, 55, 35, 30, 15, 70],
    lens: { name: 'Brave New World Index', kind: 'nightmare', top: 'The World State', question: 'How close is this place to Huxley’s World State, where people are kept content rather than free?', criteria: [
      C('soc:private', 1, 1, 'Casual sex is encouraged; pleasure replaces private attachment.'),
      C('ind:c_cannabis', 1, 1, 'Soma: a legal drug that keeps everyone content.'),
      C('ax:econ', 1, 1, 'Consumption is a civic duty.'),
      C('ax:liberty', 1, 1, 'Stability is the supreme value.'),
      C('ax:center', 1, 1, 'Ten World Controllers run everything from the centre.'),
      C('soc:pluralism', -1, 1, 'No one votes; contentment makes politics unnecessary.'),
      C('soc:religion', -1, 1, 'Religion is replaced by the worship of Ford.'),
    ] } },
  { id: 'bradbury', name: 'Ray Bradbury', years: '1920–2012', from: 'United States', era: 'Contemporary', works: 'Fahrenheit 451 (1953), The Martian Chronicles (1950)',
    idea: 'Warned of a society that burns books so that no one is ever offended or troubled by an idea.',
    v: [60, 40, 45, 15, 20, 35, 55, 45, 50, 45, 40, 55],
    lens: { name: 'Fahrenheit 451 Index', kind: 'nightmare', top: 'Montag’s city', question: 'How far does this place censor ideas, books and speech?', criteria: [
      C('soc:speech', -1, 3, 'Firemen burn books so no one meets a dangerous idea.'),
      C('ind:r_blas', -1, 1, 'Ideas are banned to protect feelings, as blasphemy laws protect faith.'),
      C('ind:s_fake', -1, 1, 'The state decides what information may circulate.'),
      C('ind:s_insult', -1, 1, 'Criticising rulers is a crime.'),
      C('ax:liberty', 1, 1, 'Order over intellectual freedom.'),
    ] } },
  { id: 'atwood', name: 'Margaret Atwood', years: '1939–', from: 'Canada', era: 'Contemporary', works: 'The Handmaid’s Tale (1985), The Testaments (2019), Oryx and Crake (2003)',
    idea: 'Imagined Gilead, a theocracy that strips women of property, reading and control of their own bodies — built only from things that had happened somewhere.',
    v: [45, 70, 40, 25, 15, 40, 15, 15, 30, 25, 30, 85],
    lens: { name: 'Gilead Index', kind: 'nightmare', top: 'Gilead', question: 'How close is this place to Gilead, where religion rules and women’s bodies belong to the state?', criteria: [
      C('ind:w_abort', -1, 2, 'Reproduction is controlled by the state.'),
      C('soc:women', -1, 2, 'Women may not read, own property or work.'),
      C('ind:p_dress', -1, 1, 'Women wear assigned religious dress.'),
      C('ind:p_adult', -1, 1, 'Adultery is punished by the state.'),
      C('soc:lgbt', -1, 1, 'Gay people are executed as “gender traitors”.'),
      C('ax:faith', 1, 1, 'A theocracy governs in the name of scripture.'),
      C('ind:m_wali', -1, 1, 'Women are given in marriage by men.'),
      C('ind:j_hudud', -1, 1, 'Death for private conduct.'),
    ] } },
  { id: 'zamyatin', name: 'Yevgeny Zamyatin', years: '1884–1937', from: 'Russia', era: 'Modern', works: 'We (1924)',
    idea: 'His One State, where people live in glass houses and every hour is scheduled, inspired both Huxley and Orwell.',
    v: [45, 50, 45, 10, 10, 25, 30, 35, 40, 40, 30, 55],
    lens: { name: 'One State Index', kind: 'nightmare', top: 'The One State', question: 'How close is this place to the One State of We, where life is planned and the Benefactor is elected unanimously?', criteria: [
      C('ax:center', 1, 1, 'The One State schedules every hour of every citizen’s day.'),
      C('ax:liberty', 1, 1, 'Freedom is called the root of crime; the Guardians watch.'),
      C('ax:econ', -1, 1, 'Production and life follow the Table of Hours.'),
      C('soc:pluralism', -1, 2, 'The Benefactor is re-elected unanimously every year.'),
      C('soc:private', -1, 1, 'Even sex is scheduled, with pink tickets.'),
      C('ind:j_exec', -1, 1, 'Dissenters are liquidated by the Benefactor’s Machine.'),
    ] } },
  { id: 'kafka', name: 'Franz Kafka', years: '1883–1924', from: 'Austria-Hungary (Prague)', era: 'Modern', works: 'The Trial (1925), The Castle (1926), In the Penal Colony (1919)',
    idea: 'Described people crushed by an opaque, unaccountable authority that never explains itself.',
    v: [35, 65, 45, 15, 10, 30, 40, 40, 35, 40, 25, 50],
    lens: { name: 'Kafka Index', kind: 'nightmare', top: 'The Court of The Trial', question: 'How unaccountable and opaque is authority here?', criteria: [
      C('soc:speech', -1, 1, 'No one may learn or say what the charge is.'),
      C('ind:s_insult', -1, 1, 'Offending authority is itself an offence.'),
      C('soc:justice', -1, 1, 'Punishment arrives without visible justice.'),
      C('ax:power', 1, 1, 'Power answers to no one.'),
      C('soc:pluralism', -1, 1, 'No higher court, no appeal, no exit.'),
      C('ax:center', 1, 1, 'A vast, distant bureaucracy decides.'),
    ] } },
  { id: 'vonnegut', name: 'Kurt Vonnegut', years: '1922–2007', from: 'United States', era: 'Contemporary', works: 'Harrison Bergeron (1961), Slaughterhouse-Five (1969), Player Piano (1952)',
    idea: 'A humanist who satirised a future where equality is enforced by handicapping anyone above average.',
    v: [35, 75, 40, 20, 15, 35, 30, 20, 30, 25, 5, 70],
    lens: { name: 'Handicapper General Index', kind: 'nightmare', top: 'Harrison Bergeron’s America', question: 'How far does this place enforce sameness from the centre?', criteria: [
      C('ax:welfare', 1, 1, 'Everyone is made equal by law.'),
      C('eco:gini', -1, 1, 'Equality of outcome, as measured.'),
      C('ax:liberty', 1, 1, 'Agents enforce the handicaps.'),
      C('ax:center', 1, 1, 'The United States Handicapper General.'),
      C('ax:econ', -1, 1, 'Talent is levelled down by the state.'),
    ] } },

  /* ------------------------------------------------------------ Russian conscience */
  { id: 'dostoevsky', name: 'Fyodor Dostoevsky', years: '1821–1881', from: 'Russia', era: 'Modern', works: 'The Brothers Karamazov (1880), Demons (1872), Crime and Punishment (1866)',
    idea: 'An Orthodox believer who feared that people would trade freedom for bread, and that revolutionaries without God would justify anything.', quote: 'Miracle, mystery and authority.',
    v: [55, 50, 65, 60, 60, 70, 85, 95, 85, 70, 60, 40],
    lens: { name: 'Grand Inquisitor Index', kind: 'nightmare', top: 'The Inquisitor’s kingdom', question: 'How far does the state give bread, faith and authority in exchange for freedom, as the Grand Inquisitor did?', criteria: [
      C('ax:welfare', 1, 1, '“Bread”: the Inquisitor feeds the people.'),
      C('ax:faith', 1, 1, '“Mystery”: faith administered by an institution.'),
      C('ax:power', 1, 1, '“Authority”: a few decide so the many need not choose.'),
      C('ax:liberty', 1, 1, 'Freedom is taken away as a burden.'),
      C('ind:r_blas', -1, 1, 'Doubting the official faith is punished.'),
      C('soc:pluralism', -1, 1, 'The people surrender choice.'),
    ] } },
  { id: 'tolstoy', name: 'Leo Tolstoy', years: '1828–1910', from: 'Russia', era: 'Modern', works: 'War and Peace (1869), The Kingdom of God Is Within You (1894), Resurrection (1899)',
    idea: 'A Christian anarchist who rejected all violence, including the state’s armies, prisons and executions.',
    v: [25, 70, 50, 10, 5, 5, 70, 85, 15, 30, 0, 85],
    lens: { name: 'Tolstoyan Non-violence', kind: 'ideal', top: 'A society without violence', question: 'How far does this place renounce force, executions and conscription?', criteria: [
      C('ax:force', -1, 2, 'Do not resist evil by force.'),
      C('soc:justice', 1, 2, 'He condemned executions and prisons.'),
      C('ind:c_service', 1, 1, 'He urged refusal of military service.'),
      C('ax:power', -1, 1, 'Government is organised violence.'),
      C('ax:center', -1, 1, 'Peasant communities, not the state.'),
      C('ax:eco', 1, 1, 'Simple living on the land.'),
    ] } },
  { id: 'solzhenitsyn', name: 'Aleksandr Solzhenitsyn', years: '1918–2008', from: 'Russia', era: 'Contemporary', works: 'The Gulag Archipelago (1973), One Day in the Life of Ivan Denisovich (1962)',
    idea: 'Survivor of the Soviet camps who documented them, and a Russian Orthodox traditionalist.',
    v: [60, 45, 60, 40, 30, 30, 80, 85, 80, 70, 45, 65],
    lens: { name: 'Gulag Test', kind: 'nightmare', top: 'The Gulag state', question: 'How close is this place to a one-party state that imprisons dissent and persecutes belief?', criteria: [
      C('soc:pluralism', -1, 2, 'One party ruled and imprisoned millions.'),
      C('ind:r_ban', -1, 1, 'Believers were persecuted.'),
      C('ind:s_fake', -1, 1, 'Article 58 punished “anti-Soviet agitation”.'),
      C('ind:j_exec', -1, 1, 'Executions and deaths in the camps.'),
      C('soc:speech', -1, 1, 'Writers were silenced.'),
      C('ax:liberty', 1, 1, 'Order through fear.'),
    ] } },
  { id: 'havel', name: 'Václav Havel', years: '1936–2011', from: 'Czechoslovakia', era: 'Contemporary', works: 'The Power of the Powerless (1978), Letters to Olga (1988)',
    idea: 'Dissident playwright, later president, who said a regime of lies falls when ordinary people refuse to live within them.',
    v: [55, 55, 30, 20, 10, 35, 35, 35, 35, 20, 40, 65],
    lens: { name: 'Living in Truth', kind: 'ideal', top: 'Living in truth', question: 'Can ordinary people say what is true and remove those in power?', criteria: [
      C('soc:speech', 1, 2, 'The greengrocer can take the slogan out of his window.'),
      C('soc:pluralism', 1, 2, 'Power must answer to citizens.'),
      C('ind:s_insult', 1, 1, 'Mocking power is not a crime.'),
      C('ax:power', -1, 1, 'The power of the powerless, not of one leader.'),
      C('ax:center', -1, 1, 'Civil society and local initiative.'),
    ] } },

  /* ------------------------------------------------------------ liberal thought */
  { id: 'arendt', name: 'Hannah Arendt', years: '1906–1975', from: 'Germany, United States', era: 'Contemporary', works: 'The Origins of Totalitarianism (1951), Eichmann in Jerusalem (1963), The Human Condition (1958)',
    idea: 'Explained how totalitarianism uses ideology, terror and isolation, and how ordinary officials carry out great evil.',
    v: [50, 55, 35, 25, 10, 35, 40, 30, 35, 30, 40, 50],
    lens: { name: 'Totalitarian Elements', kind: 'nightmare', top: 'Totalitarian rule', question: 'How many of the elements of totalitarian rule does this place show?', criteria: [
      C('ind:pl_regime', -1, 2, 'One movement absorbs the state.'),
      C('ind:r_ban', -1, 1, 'A designated enemy group is persecuted.'),
      C('ind:j_exec', -1, 1, 'Terror is the essence of the regime.'),
      C('soc:speech', -1, 1, 'Ideology replaces reality.'),
      C('ax:power', 1, 1, 'The leader principle.'),
      C('ax:nation', 1, 1, 'Tribal nationalism.'),
      C('ind:s_block', -1, 1, 'The masses are isolated from the world.'),
    ] } },
  { id: 'popper', name: 'Karl Popper', years: '1902–1994', from: 'Austria, Britain', era: 'Contemporary', works: 'The Open Society and Its Enemies (1945), The Poverty of Historicism (1957)',
    idea: 'Defended the open society, where rulers can be removed without bloodshed and every idea can be criticised.',
    v: [55, 55, 25, 25, 10, 45, 30, 25, 30, 25, 45, 50],
    lens: { name: 'Open Society', kind: 'ideal', top: 'An open society', question: 'Can people criticise power and remove rulers without bloodshed?', criteria: [
      C('ind:pl_turnover', 1, 2, 'Democracy is the power to remove rulers peacefully.'),
      C('soc:speech', 1, 2, 'Criticism is how societies correct mistakes.'),
      C('soc:pluralism', 1, 1, 'No one holds the final truth.'),
      C('ax:power', -1, 1, 'Institutions, not great leaders.'),
      C('ax:liberty', -1, 1, 'Freedom of thought.'),
    ] } },
  { id: 'berlin', name: 'Isaiah Berlin', years: '1909–1997', from: 'Russia, Britain', era: 'Contemporary', works: 'Two Concepts of Liberty (1958), The Hedgehog and the Fox (1953)',
    idea: 'Distinguished freedom from interference from the dangerous promise of a “true” self imposed by the state.',
    v: [58, 50, 30, 20, 15, 45, 40, 30, 45, 30, 45, 45],
    lens: { name: 'Negative Liberty', kind: 'ideal', top: 'Freedom from interference', question: 'How large is the area in which people are left alone?', criteria: [
      C('soc:private', 1, 1, 'An area where a person is left alone.'),
      C('soc:choices', 1, 1, 'Freedom to choose one’s own ends.'),
      C('soc:speech', 1, 1, 'Freedom of expression.'),
      C('ax:liberty', -1, 1, 'Absence of coercion.'),
      C('soc:religion', 1, 1, 'Pluralism of values and faiths.'),
    ] } },
  { id: 'mill', name: 'John Stuart Mill', years: '1806–1873', from: 'Britain', era: 'Modern', works: 'On Liberty (1859), The Subjection of Women (1869), Utilitarianism (1863)',
    idea: 'Argued that the state may restrict a person only to prevent harm to others.', quote: 'Over himself, over his own body and mind, the individual is sovereign.',
    v: [62, 50, 15, 10, 15, 35, 20, 20, 35, 30, 40, 55],
    lens: { name: 'Harm Principle', kind: 'ideal', top: 'Mill’s liberty', question: 'Does the law leave people sovereign over their own lives, bodies and opinions?', criteria: [
      C('soc:private', 1, 2, 'Self-regarding conduct is no business of the state.'),
      C('soc:speech', 1, 2, 'Silencing an opinion robs the human race.'),
      C('soc:choices', 1, 1, '“Experiments in living.”'),
      C('soc:lgbt', 1, 1, 'Private conduct between adults.'),
      C('soc:women', 1, 1, 'The Subjection of Women.'),
    ] } },
  { id: 'locke', name: 'John Locke', years: '1632–1704', from: 'England', era: 'Early modern', works: 'Two Treatises of Government (1689), A Letter Concerning Toleration (1689)',
    idea: 'Government exists by consent to protect life, liberty and property, and may be replaced if it does not.',
    v: [72, 30, 30, 25, 20, 40, 55, 55, 45, 40, 45, 40],
    lens: { name: 'Lockean Rights', kind: 'ideal', top: 'Government by consent', question: 'Does government rest on consent, protect property and tolerate faiths?', criteria: [
      C('soc:pluralism', 1, 2, 'Government by consent; the people may replace it.'),
      C('ax:econ', 1, 1, 'Property as a natural right.'),
      C('soc:religion', 1, 1, 'A Letter Concerning Toleration.'),
      C('ax:power', -1, 1, 'Limited government.'),
      C('ax:liberty', -1, 1, 'Life, liberty and estate.'),
    ] } },
  { id: 'montesquieu', name: 'Montesquieu', years: '1689–1755', from: 'France', era: 'Early modern', works: 'The Spirit of the Laws (1748), Persian Letters (1721)',
    idea: 'Freedom survives only where legislative, executive and judicial power are separated.', quote: 'Power should be a check to power.',
    v: [60, 45, 30, 35, 10, 30, 50, 45, 45, 35, 40, 50],
    lens: { name: 'Separation of Powers', kind: 'ideal', top: 'Moderate government', question: 'Is power divided and checked, and are punishments moderate?', criteria: [
      C('ax:power', -1, 2, 'Power must check power.'),
      C('soc:pluralism', 1, 1, 'Moderate government.'),
      C('soc:justice', 1, 1, 'Punishments proportionate to crimes.'),
      C('ax:center', -1, 1, 'Intermediate powers between ruler and people.'),
    ] } },
  { id: 'voltaire', name: 'Voltaire', years: '1694–1778', from: 'France', era: 'Early modern', works: 'Candide (1759), Treatise on Tolerance (1763), Philosophical Dictionary (1764)',
    idea: 'Campaigned against religious persecution, censorship and judicial cruelty.', quote: 'Écrasez l’infâme.',
    v: [65, 40, 30, 25, 35, 50, 30, 10, 35, 30, 35, 45],
    lens: { name: 'Tolerance', kind: 'ideal', top: 'Voltaire’s tolerance', question: 'Are people free to believe, doubt and speak, without cruel punishment?', criteria: [
      C('soc:religion', 1, 2, 'Treatise on Tolerance, written after the Calas affair.'),
      C('ind:r_blas', 1, 1, 'He defended people prosecuted for blasphemy.'),
      C('soc:speech', 1, 1, 'Free thought and a free press.'),
      C('ax:faith', -1, 1, 'Against clerical power.'),
      C('soc:justice', 1, 1, 'Against torture and judicial cruelty.'),
    ] } },
  { id: 'tocqueville', name: 'Alexis de Tocqueville', years: '1805–1859', from: 'France', era: 'Modern', works: 'Democracy in America (1835–40), The Old Regime and the Revolution (1856)',
    idea: 'Saw local self-government, voluntary associations and a free press as the defences against a tyranny of the majority.',
    v: [65, 40, 35, 30, 15, 15, 55, 60, 45, 45, 50, 50],
    lens: { name: 'Democracy in America', kind: 'ideal', top: 'Self-governing townships', question: 'Is democracy local, associational and protected against the majority’s tyranny?', criteria: [
      C('ax:center', -1, 2, 'Township self-government and associations.'),
      C('soc:pluralism', 1, 1, 'Equality of conditions with free institutions.'),
      C('soc:religion', 1, 1, 'Religious freedom.'),
      C('soc:speech', 1, 1, 'A free press against the tyranny of the majority.'),
    ] } },
  { id: 'smith', name: 'Adam Smith', years: '1723–1790', from: 'Scotland', era: 'Early modern', works: 'The Wealth of Nations (1776), The Theory of Moral Sentiments (1759)',
    idea: 'Showed how free exchange and the division of labour create wealth, and warned against merchants colluding with rulers.', quote: 'An invisible hand.',
    v: [78, 35, 15, 35, 25, 40, 55, 50, 45, 35, 45, 40],
    lens: { name: 'Wealth of Nations', kind: 'ideal', top: 'A system of natural liberty', question: 'Are trade and enterprise free, and is justice secure?', criteria: [
      C('ax:trade', -1, 2, 'Free trade enriches nations; mercantilism impoverishes them.'),
      C('ax:econ', 1, 1, 'Markets coordinate millions of choices.'),
      C('soc:justice', 1, 1, 'Justice is the main pillar of society.'),
      C('ax:power', -1, 1, 'Wary of collusion between merchants and rulers.'),
    ] } },
  { id: 'hayek', name: 'Friedrich Hayek', years: '1899–1992', from: 'Austria, Britain', era: 'Contemporary', works: 'The Road to Serfdom (1944), The Constitution of Liberty (1960)',
    idea: 'Argued that central economic planning leads step by step to political tyranny.',
    v: [88, 25, 10, 25, 15, 25, 55, 45, 35, 30, 45, 30],
    lens: { name: 'Road to Serfdom', kind: 'nightmare', top: 'Serfdom', question: 'How far down the road from economic planning to political control has this place gone?', criteria: [
      C('ax:econ', -1, 2, 'Central planning concentrates economic power in the state.'),
      C('ax:center', 1, 1, 'Decisions taken centrally instead of by millions of people.'),
      C('ax:trade', 1, 1, 'Controls on trade and prices.'),
      C('soc:pluralism', -1, 1, 'Planning means “the worst get on top”.'),
      C('ax:liberty', 1, 1, 'Control of the economy becomes control of life.'),
    ] } },
  { id: 'rand', name: 'Ayn Rand', years: '1905–1982', from: 'Russia, United States', era: 'Contemporary', works: 'Atlas Shrugged (1957), The Fountainhead (1943), Anthem (1938)',
    idea: 'Championed rational self-interest and laissez-faire capitalism against altruism and the welfare state.',
    v: [98, 5, 5, 15, 20, 20, 30, 0, 45, 50, 50, 10],
    lens: { name: 'Atlas Shrugged', kind: 'ideal', top: 'Galt’s Gulch', question: 'How close is this place to laissez-faire capitalism with no forced altruism?', criteria: [
      C('ax:econ', 1, 2, 'Laissez-faire capitalism.'),
      C('ax:welfare', -1, 2, 'No one may be forced to serve others’ needs.'),
      C('eco:redist', -1, 1, 'Forced redistribution, as actually measured.'),
      C('ax:faith', -1, 1, 'Reason, not faith.'),
      C('ax:liberty', -1, 1, 'Individual rights against force.'),
      C('ax:trade', -1, 1, 'Free trade.'),
    ] } },
  { id: 'nozick', name: 'Robert Nozick', years: '1938–2002', from: 'United States', era: 'Contemporary', works: 'Anarchy, State, and Utopia (1974)',
    idea: 'Defended a minimal state limited to protection and contracts; anything more violates rights.',
    v: [92, 10, 10, 10, 10, 15, 40, 35, 35, 40, 40, 30],
    lens: { name: 'Minimal State', kind: 'ideal', top: 'The night-watchman state', question: 'How close is this place to a state that only protects rights?', criteria: [
      C('ax:welfare', -1, 2, 'Taxing earnings is on a par with forced labour.'),
      C('eco:redist', -1, 1, 'How much the state redistributes in practice.'),
      C('ax:econ', 1, 1, 'Free exchange is just.'),
      C('ax:liberty', -1, 1, 'Rights as side constraints.'),
      C('soc:choices', 1, 1, 'A framework for voluntary utopias.'),
      C('ax:center', -1, 1, 'Minimal central authority.'),
    ] } },
  { id: 'rawls', name: 'John Rawls', years: '1921–2002', from: 'United States', era: 'Contemporary', works: 'A Theory of Justice (1971), Political Liberalism (1993)',
    idea: 'Asked what society you would choose behind a “veil of ignorance”, not knowing who you would be born as.',
    v: [40, 80, 35, 25, 15, 45, 25, 20, 30, 30, 35, 55],
    lens: { name: 'Veil of Ignorance', kind: 'ideal', top: 'Justice as fairness', question: 'Would you choose to be born here not knowing your sex, faith, sexuality or wealth?', criteria: [
      C('ax:welfare', 1, 2, 'Inequalities must benefit the worst off.'),
      C('eco:gini', -1, 2, 'Measured inequality: would you accept it not knowing where you’d land?'),
      C('soc:women', 1, 1, 'Equal basic liberties for all.'),
      C('soc:lgbt', 1, 1, 'Equal basic liberties for all.'),
      C('soc:religion', 1, 1, 'Liberty of conscience.'),
      C('soc:pluralism', 1, 1, 'Fair value of political liberties.'),
      C('soc:speech', 1, 1, 'Freedom of thought.'),
    ] } },
  { id: 'keynes', name: 'John Maynard Keynes', years: '1883–1946', from: 'Britain', era: 'Modern', works: 'The General Theory of Employment, Interest and Money (1936), The Economic Consequences of the Peace (1919)',
    idea: 'Argued that governments must manage demand to prevent mass unemployment, and helped design Bretton Woods.',
    v: [50, 65, 35, 35, 25, 60, 30, 25, 35, 20, 40, 45],
    lens: { name: 'Managed Capitalism', kind: 'ideal', top: 'A Keynesian mixed economy', question: 'How close is this place to a market economy steered by the state, open to the world?', criteria: [
      C('near:econ:50', 1, 2, 'A market economy steered by government.'),
      C('near:welfare:65', 1, 1, 'Public spending to keep employment high.'),
      C('ax:trade', -1, 1, 'International cooperation on trade.'),
      C('ax:world', -1, 1, 'Multilateral institutions like the IMF and World Bank.'),
    ] } },
  { id: 'wollstonecraft', name: 'Mary Wollstonecraft', years: '1759–1797', from: 'England', era: 'Early modern', works: 'A Vindication of the Rights of Woman (1792)',
    idea: 'Argued that women are rational beings owed the same education and rights as men.',
    v: [50, 60, 40, 25, 20, 40, 10, 40, 35, 35, 35, 50],
    lens: { name: 'Rights of Woman', kind: 'ideal', top: 'Wollstonecraft’s equality', question: 'Do women have equal standing in law, marriage and property?', criteria: [
      C('soc:women', 1, 2, 'Equal rights for women.'),
      C('soc:marriage', 1, 1, 'Marriage as a partnership, not ownership.'),
      C('ind:m_age', 1, 1, 'Against marrying girls young.'),
      C('ind:w_testify', 1, 1, 'Equal standing in law.'),
      C('ind:f_inherit', 1, 1, 'Women’s property.'),
    ] } },
  { id: 'beauvoir', name: 'Simone de Beauvoir', years: '1908–1986', from: 'France', era: 'Contemporary', works: 'The Second Sex (1949), The Mandarins (1954)',
    idea: 'Showed how womanhood is shaped by society, and fought for women’s economic and sexual freedom.',
    v: [25, 80, 45, 15, 25, 45, 5, 0, 25, 35, 35, 50],
    lens: { name: 'The Second Sex', kind: 'ideal', top: 'Women’s freedom', question: 'Are women free in law, marriage, sexuality and reproduction?', criteria: [
      C('soc:women', 1, 2, 'Woman is made by society, not born.'),
      C('ind:w_abort', 1, 1, 'She signed the 1971 Manifesto of the 343 for abortion rights.'),
      C('soc:private', 1, 1, 'Sexual freedom.'),
      C('soc:marriage', 1, 1, 'Against marriage as dependency.'),
      C('ax:faith', -1, 1, 'Existentialist atheism.'),
    ] } },

  /* ------------------------------------------------------------ order and the state */
  { id: 'hobbes', name: 'Thomas Hobbes', years: '1588–1679', from: 'England', era: 'Early modern', works: 'Leviathan (1651)',
    idea: 'Without a sovereign strong enough to keep peace, life is a war of all against all.', quote: 'Solitary, poor, nasty, brutish, and short.',
    v: [55, 40, 50, 92, 90, 90, 60, 55, 70, 80, 70, 35],
    lens: { name: 'Leviathan', kind: 'ideal', top: 'The Leviathan', question: 'How strong and undivided is the sovereign that keeps the peace?', criteria: [
      C('ax:power', 1, 2, 'An absolute sovereign to end the war of all against all.'),
      C('ax:center', 1, 1, 'Sovereignty must be undivided.'),
      C('ax:liberty', 1, 1, 'Security before liberty.'),
    ] } },
  { id: 'machiavelli', name: 'Niccolò Machiavelli', years: '1469–1527', from: 'Florence', era: 'Early modern', works: 'The Prince (1532), Discourses on Livy (1531)',
    idea: 'Described how rulers actually win and keep power, separating politics from conventional morality.',
    v: [55, 40, 55, 75, 70, 75, 55, 40, 80, 75, 85, 30],
    lens: { name: 'The Prince', kind: 'ideal', top: 'Machiavelli’s prince', question: 'How far does this state follow the Prince’s advice: be feared, rely on your own arms, secure the state first?', criteria: [
      C('ax:power', 1, 2, 'Better to be feared than loved, if one cannot be both.'),
      C('ax:force', 1, 1, 'A prince must study war.'),
      C('ax:liberty', 1, 1, 'The security of the state comes first.'),
      C('ax:nation', 1, 1, 'Unify and free the homeland.'),
      C('ax:world', 1, 1, 'Rely on your own arms, not allies or mercenaries.'),
    ] } },
  { id: 'burke', name: 'Edmund Burke', years: '1729–1797', from: 'Ireland, Britain', era: 'Early modern', works: 'Reflections on the Revolution in France (1790)',
    idea: 'Defended inherited institutions and gradual reform against revolutionary schemes built on abstract reason.', quote: 'The little platoon we belong to in society.',
    v: [62, 40, 45, 60, 30, 45, 85, 75, 65, 55, 55, 55],
    lens: { name: 'Burkean Tradition', kind: 'ideal', top: 'An ordered, inherited liberty', question: 'Does this place preserve tradition and faith while keeping constitutional, limited government?', criteria: [
      C('ax:values', 1, 1, 'Society is a partnership of the dead, the living and the unborn.'),
      C('ax:faith', 1, 1, 'Established religion as a pillar of society.'),
      C('soc:pluralism', 1, 1, 'Constitutional government, not revolution.'),
      C('near:center:45', 1, 1, '“Little platoons”, not a centralised state.'),
      C('ax:power', -1, 1, 'Against arbitrary power.'),
    ] } },
  { id: 'rousseau', name: 'Jean-Jacques Rousseau', years: '1712–1778', from: 'Geneva, France', era: 'Early modern', works: 'The Social Contract (1762), Discourse on Inequality (1755), Emile (1762)',
    idea: 'Legitimate power comes only from the general will of a free and equal people.', quote: 'Man is born free, and everywhere he is in chains.',
    v: [30, 75, 60, 55, 40, 20, 60, 55, 70, 60, 45, 70],
    lens: { name: 'General Will', kind: 'ideal', top: 'Rousseau’s republic', question: 'Does the people rule directly, as equals, in a small and frugal republic?', criteria: [
      C('ax:center', -1, 1, 'Sovereignty cannot be represented; small republics.'),
      C('ax:welfare', 1, 1, 'No citizen rich enough to buy another, none so poor as to sell himself.'),
      C('eco:gini', -1, 1, 'No one rich enough to buy another: measured inequality.'),
      C('soc:pluralism', 1, 1, 'Sovereignty of the people.'),
      C('ax:eco', 1, 1, 'Distrust of luxury and commerce.'),
      C('ax:nation', 1, 1, 'Civic patriotism and a civil religion.'),
    ] } },
  { id: 'plato', name: 'Plato', years: 'c. 428–348 BCE', from: 'Athens', era: 'Ancient', works: 'The Republic, The Laws',
    idea: 'Imagined a city ruled by philosopher-kings, with guardians who own nothing and poets who are censored.',
    v: [25, 60, 60, 90, 75, 80, 70, 60, 70, 60, 65, 50],
    lens: { name: 'Kallipolis', kind: 'ideal', top: 'The Republic’s ideal city', question: 'How close is this place to rule by a guardian elite, with censored arts and no democracy?', criteria: [
      C('ax:power', 1, 1, 'Rule by philosopher-kings.'),
      C('ax:liberty', 1, 1, 'Guardians keep order.'),
      C('soc:speech', -1, 1, 'Poets are censored.'),
      C('ax:econ', -1, 1, 'Guardians own no property.'),
      C('eco:gini', -1, 1, 'In the Laws, no citizen may own more than four times the poorest citizen’s holding.'),
      C('soc:pluralism', -1, 1, 'Democracy degenerates into tyranny.'),
    ] } },
  { id: 'aristotle', name: 'Aristotle', years: '384–322 BCE', from: 'Macedonia, Athens', era: 'Ancient', works: 'Politics, Nicomachean Ethics',
    idea: 'The best practical constitution is a “polity” resting on a large middle class and the rule of law, avoiding extremes.',
    v: [55, 50, 50, 55, 35, 45, 65, 55, 60, 55, 55, 55],
    lens: { name: 'Polity of the Mean', kind: 'ideal', top: 'Aristotle’s polity', question: 'Does this place avoid extremes, with a strong middle and the rule of law?', criteria: [
      C('calc:moderation', 1, 2, 'Virtue lies in the mean between extremes.'),
      C('soc:pluralism', 1, 1, 'Rule of law and a mixed constitution.'),
      C('near:welfare:55', 1, 1, 'A large middle class makes a stable state.'),
      C('eco:gini', -1, 1, 'Neither very rich nor very poor: measured inequality.'),
    ] } },

  /* ------------------------------------------------------------ socialist and anarchist */
  { id: 'marx', name: 'Karl Marx', years: '1818–1883', from: 'Germany, Britain', era: 'Modern', works: 'The Communist Manifesto (1848, with Engels), Capital (1867)',
    idea: 'History is a story of class struggle; workers would abolish private ownership of the means of production.', quote: 'Workers of the world, unite!',
    v: [0, 90, 50, 50, 50, 70, 25, 0, 10, 40, 75, 45],
    lens: { name: 'Communist Manifesto', kind: 'ideal', top: 'Communism', question: 'How close is this economy and society to the Manifesto’s aims?', criteria: [
      C('ax:econ', -1, 2, 'Abolition of private ownership of the means of production.'),
      C('ax:welfare', 1, 2, 'From each according to his ability, to each according to his needs.'),
      C('eco:gini', -1, 1, 'A classless society: income inequality as it is actually measured.'),
      C('ax:faith', -1, 1, 'Religion as “the opium of the people”.'),
      C('ax:nation', -1, 1, 'The working men have no country.'),
    ] } },
  { id: 'kropotkin', name: 'Peter Kropotkin', years: '1842–1921', from: 'Russia', era: 'Modern', works: 'Mutual Aid (1902), The Conquest of Bread (1892)',
    idea: 'Anarchist geographer who argued that cooperation, not competition, drives survival, and that free communes could replace the state.',
    v: [10, 85, 45, 5, 0, 0, 20, 5, 10, 30, 15, 80],
    lens: { name: 'Mutual Aid', kind: 'ideal', top: 'Free federated communes', question: 'How far is power local, cooperative and free of coercion?', criteria: [
      C('ax:center', -1, 2, 'Free federations of communes.'),
      C('ax:power', -1, 1, 'No rulers.'),
      C('ax:welfare', 1, 1, 'Bread for all.'),
      C('eco:gini', -1, 1, 'Wealth held in common: measured inequality.'),
      C('ax:liberty', -1, 1, 'No coercive state.'),
      C('soc:justice', 1, 1, 'He wanted prisons abolished.'),
    ] } },
  { id: 'steinbeck', name: 'John Steinbeck', years: '1902–1968', from: 'United States', era: 'Contemporary', works: 'The Grapes of Wrath (1939), Of Mice and Men (1937)',
    idea: 'Told the story of migrant farm workers driven off their land and exploited.',
    v: [30, 85, 50, 30, 20, 40, 40, 35, 35, 35, 30, 70],
    lens: { name: 'Grapes of Wrath', kind: 'ideal', top: 'Dignity for the Joads', question: 'Would the Joads find dignity here?', criteria: [
      C('ax:welfare', 1, 2, 'Dignity and support for migrant workers.'),
      C('eco:gini', -1, 1, 'The gap between landowners and the dispossessed.'),
      C('ax:nation', -1, 1, '“Okies” were treated as foreigners in their own land.'),
      C('ax:eco', 1, 1, 'The Dust Bowl came from over-farming.'),
      C('ax:econ', -1, 1, 'Against banks and landowners squeezing tenants.'),
    ] } },
  { id: 'dickens', name: 'Charles Dickens', years: '1812–1870', from: 'England', era: 'Modern', works: 'Oliver Twist (1838), Hard Times (1854), Bleak House (1853)',
    idea: 'Exposed workhouses, child labour, debtors’ prisons and the cruelty of a system that forgot the poor.',
    v: [45, 75, 45, 40, 30, 45, 55, 55, 50, 40, 40, 50],
    lens: { name: 'Hard Times Test', kind: 'ideal', top: 'A society that cares for Oliver', question: 'Does this place protect the poor and children?', criteria: [
      C('ax:welfare', 1, 2, 'Against workhouses and child labour.'),
      C('eco:redist', 1, 1, 'Does the state actually lift the poor? Measured redistribution.'),
      C('ind:f_smack', 1, 1, 'Against cruel schoolmasters like Squeers in Nicholas Nickleby.'),
      C('soc:family', 1, 1, 'Children and families protected.'),
      C('soc:justice', 1, 1, 'Against debtors’ prisons and harsh courts.'),
    ] } },
  { id: 'hugo', name: 'Victor Hugo', years: '1802–1885', from: 'France', era: 'Modern', works: 'Les Misérables (1862), The Last Day of a Condemned Man (1829)',
    idea: 'Campaigned against the death penalty and showed how poverty and harsh law crush people like Jean Valjean.',
    v: [40, 75, 40, 25, 15, 40, 40, 45, 40, 25, 25, 55],
    lens: { name: 'Les Misérables Test', kind: 'ideal', top: 'Mercy over Javert', question: 'Does justice here show mercy, and does society relieve poverty?', criteria: [
      C('soc:justice', 1, 2, 'Against harsh punishment.'),
      C('ind:j_death', 1, 1, 'He campaigned to abolish the death penalty.'),
      C('ax:welfare', 1, 1, 'Poverty breeds crime.'),
      C('eco:redist', 1, 1, 'Relief for the poor, as actually delivered.'),
    ] } },
  { id: 'fanon', name: 'Frantz Fanon', years: '1925–1961', from: 'Martinique, Algeria', era: 'Contemporary', works: 'The Wretched of the Earth (1961), Black Skin, White Masks (1952)',
    idea: 'Psychiatrist of colonialism who argued for full decolonisation, and warned against a new national elite replacing the old one.',
    v: [15, 75, 75, 65, 60, 70, 35, 20, 75, 85, 90, 45],
    lens: { name: 'Decolonisation', kind: 'ideal', top: 'Fanon’s free nation', question: 'Is this nation economically and politically free of outside domination?', criteria: [
      C('ax:world', 1, 1, 'Freedom from foreign domination.'),
      C('ax:econ', -1, 1, 'Against a national bourgeoisie that serves outside capital.'),
      C('ax:welfare', 1, 1, 'Land and resources for the peasants.'),
      C('ax:trade', 1, 1, 'Economic self-reliance.'),
    ] } },

  /* ------------------------------------------------------------ nature and conscience */
  { id: 'thoreau', name: 'Henry David Thoreau', years: '1817–1862', from: 'United States', era: 'Modern', works: 'Walden (1854), Civil Disobedience (1849)',
    idea: 'Went to jail rather than pay taxes for slavery and war, and lived simply in the woods.', quote: 'In wildness is the preservation of the world.',
    v: [65, 20, 50, 5, 5, 5, 40, 45, 30, 40, 5, 95],
    lens: { name: 'Walden', kind: 'ideal', top: 'Walden Pond', question: 'Does government govern little, avoid war and leave nature wild?', criteria: [
      C('ax:eco', 1, 2, 'In wildness is the preservation of the world.'),
      C('ax:liberty', -1, 1, 'That government is best which governs least.'),
      C('ax:force', -1, 1, 'He refused taxes for the Mexican War.'),
      C('ax:power', -1, 1, 'Conscience above the law.'),
    ] } },
  { id: 'carson', name: 'Rachel Carson', years: '1907–1964', from: 'United States', era: 'Contemporary', works: 'Silent Spring (1962), The Sea Around Us (1951)',
    idea: 'Showed how pesticides poison birds, water and people, and started the modern environmental movement.',
    v: [45, 55, 45, 40, 25, 50, 45, 40, 40, 25, 30, 100],
    lens: { name: 'Silent Spring', kind: 'ideal', top: 'A living spring', question: 'Does this place put ecology before industrial growth?', criteria: [
      C('ax:eco', 1, 3, 'Protect nature from industrial poisons.'),
      C('ax:world', -1, 1, 'Pollution crosses every border.'),
    ] } },
  { id: 'tagore', name: 'Rabindranath Tagore', years: '1861–1941', from: 'India', era: 'Modern', works: 'Gitanjali (1910), Nationalism (1917), The Home and the World (1916)',
    idea: 'Nobel laureate who warned that the nation-state organises selfishness, and dreamed of a mind without fear.',
    v: [40, 60, 40, 25, 15, 25, 35, 55, 10, 10, 10, 85],
    lens: { name: 'Where the Mind Is Without Fear', kind: 'ideal', top: 'Tagore’s free mind', question: 'Is this place free of fear, aggressive nationalism and militarism?', criteria: [
      C('ax:nation', -1, 2, 'Nationalism (1917): the nation as organised selfishness.'),
      C('ax:world', -1, 1, 'Universal humanism; Visva-Bharati, a university for the world.'),
      C('ax:force', -1, 1, 'Against militarism.'),
      C('soc:speech', 1, 1, 'Where the mind is without fear.'),
      C('ax:eco', 1, 1, 'Education in nature at Santiniketan.'),
    ] } },
  { id: 'gandhi', name: 'Mahatma Gandhi', years: '1869–1948', from: 'India', era: 'Modern', works: 'Hind Swaraj (1909), The Story of My Experiments with Truth (1927)',
    idea: 'Non-violence, village self-rule, swadeshi and equal respect for all religions.',
    v: [30, 62, 75, 25, 15, 10, 60, 70, 45, 30, 0, 88],
    lens: { name: 'Hind Swaraj', kind: 'ideal', top: 'Ram Rajya of the villages', question: 'Is this place non-violent, self-reliant, local and tolerant of all faiths?', criteria: [
      C('ax:force', -1, 2, 'Ahimsa: non-violence.'),
      C('ax:center', -1, 1, 'Village self-rule.'),
      C('ax:trade', 1, 1, 'Swadeshi.'),
      C('ax:eco', 1, 1, 'Simple living and local production.'),
      C('soc:religion', 1, 1, 'Equal respect for all religions.'),
      C('soc:justice', 1, 1, 'Against the death penalty.'),
    ] } },
  { id: 'ambedkar', name: 'B. R. Ambedkar', years: '1891–1956', from: 'India', era: 'Modern', works: 'Annihilation of Caste (1936), The Problem of the Rupee (1923), Who Were the Shudras? (1946)',
    idea: 'Argued that political democracy must rest on social democracy — liberty, equality and fraternity — and that caste must be destroyed.',
    v: [35, 82, 55, 30, 20, 60, 10, 10, 40, 40, 30, 45],
    lens: { name: 'Annihilation of Caste', kind: 'ideal', top: 'Social democracy', question: 'Does this place guarantee equal rights, freedom of conscience and the freedom to marry across lines?', criteria: [
      C('soc:women', 1, 1, 'The Hindu Code Bill for women’s rights.'),
      C('soc:religion', 1, 1, 'Freedom of conscience; he left Hinduism for Buddhism.'),
      C('ax:welfare', 1, 1, 'State socialism for economic democracy.'),
      C('eco:gini', -1, 1, 'Economic democracy: measured inequality.'),
      C('soc:pluralism', 1, 1, 'Constitutional democracy.'),
      C('ind:m_faith', 1, 1, 'Inter-marriage as the real remedy for caste.'),
      C('ax:values', -1, 1, 'Against hierarchy sanctioned by tradition.'),
    ] } },
  { id: 'chanakya', name: 'Chanakya (Kautilya)', years: 'c. 350–275 BCE', from: 'India (Maurya Empire)', era: 'Ancient', works: 'Arthashastra',
    idea: 'Minister to Chandragupta Maurya whose Arthashastra sets out statecraft: a rich treasury, spies, realist diplomacy and the welfare of subjects.', quote: 'In the happiness of his subjects lies the king’s happiness.',
    v: [45, 60, 70, 85, 75, 90, 65, 55, 80, 85, 80, 50],
    lens: { name: 'Arthashastra Statecraft', kind: 'ideal', top: 'The Mauryan state', question: 'How closely does this state follow Kautilya: a strong centre, watchful spies, realist force abroad and care for subjects?', criteria: [
      C('ax:center', 1, 1, 'A strong central treasury and administration.'),
      C('ax:liberty', 1, 1, 'Spies watch officials and subjects.'),
      C('ax:force', 1, 1, 'The mandala: a neighbour is a natural enemy; diplomacy is backed by force.'),
      C('ax:world', 1, 1, 'The state’s own interest decides foreign policy.'),
      C('ax:welfare', 1, 1, 'In the happiness of his subjects lies the king’s happiness.'),
    ] } },
  { id: 'thiruvalluvar', name: 'Thiruvalluvar', years: 'c. 1st–5th century CE', from: 'Tamilakam (South India)', era: 'Ancient', works: 'Thirukkural',
    idea: 'The Kural’s book on wealth describes the just king: protective, generous, open to criticism and never cruel.',
    v: [45, 65, 55, 55, 45, 55, 70, 60, 55, 50, 40, 60],
    lens: { name: 'The Just Sceptre', kind: 'ideal', top: 'The Kural’s just king', question: 'Is rule here protective, merciful and open to criticism?', criteria: [
      C('ax:welfare', 1, 1, 'The king protects and provides for his people.'),
      C('soc:justice', 1, 1, 'The cruel sceptre ruins the kingdom.'),
      C('ax:power', -1, 1, 'A ruler should heed counsel.'),
      C('soc:speech', 1, 1, 'The world shelters under the king who can bear bitter words.'),
    ] } },

  /* ------------------------------------------------------------ East Asia */
  { id: 'confucius', name: 'Confucius', years: '551–479 BCE', from: 'China (Lu)', era: 'Ancient', works: 'The Analects',
    idea: 'Order rests on virtue, ritual and family duty; rulers should lead by example rather than punishment.',
    v: [45, 60, 55, 70, 55, 65, 90, 60, 65, 55, 30, 55],
    lens: { name: 'Confucian Order', kind: 'ideal', top: 'Rule by virtue', question: 'Does order here rest on family, ritual and moral example rather than punishment?', criteria: [
      C('ax:values', 1, 2, 'Ritual, filial piety and family hierarchy.'),
      C('ax:liberty', 1, 1, 'Harmony and social order.'),
      C('soc:justice', 1, 1, 'Lead by virtue, not by punishments.'),
      C('ax:force', -1, 1, 'Rule by moral example.'),
      C('ax:welfare', 1, 1, 'The ruler cares for the people.'),
    ] } },
  { id: 'laozi', name: 'Laozi', years: 'c. 6th–4th century BCE', from: 'China', era: 'Ancient', works: 'Tao Te Ching',
    idea: 'The best government acts little and lets people be; weapons and laws multiply troubles.', quote: 'Governing a large country is like cooking a small fish.',
    v: [55, 45, 50, 10, 5, 5, 60, 55, 30, 35, 5, 95],
    lens: { name: 'Wu Wei', kind: 'ideal', top: 'Government by non-interference', question: 'Does government here act little and let people and nature be?', criteria: [
      C('ax:center', -1, 1, 'Do not stir the small fish.'),
      C('ax:power', -1, 1, 'The best ruler is barely known.'),
      C('ax:force', -1, 1, 'Weapons are instruments of ill omen.'),
      C('soc:justice', 1, 1, 'The more laws, the more thieves.'),
      C('ax:eco', 1, 1, 'Harmony with nature.'),
      C('ax:liberty', -1, 1, 'Let people be.'),
    ] } },
  { id: 'mencius', name: 'Mencius', years: 'c. 372–289 BCE', from: 'China (Zou)', era: 'Ancient', works: 'Mencius',
    idea: 'Benevolent government feeds the people; a tyrant who does not has lost the mandate of Heaven and may be removed.',
    v: [40, 75, 50, 55, 35, 55, 80, 55, 60, 50, 25, 65],
    lens: { name: 'Benevolent Government', kind: 'ideal', top: 'The mandate of Heaven', question: 'Does the ruler feed the people, tax lightly and accept that a tyrant may be removed?', criteria: [
      C('ax:welfare', 1, 2, 'Rulers must ensure the people have land and food.'),
      C('eco:redist', 1, 1, 'The ruler shares the granaries with the people.'),
      C('soc:pluralism', 1, 1, 'Heaven sees as the people see; a tyrant may be removed.'),
      C('soc:justice', 1, 1, 'Light punishments.'),
      C('ax:force', -1, 1, 'Against wars of conquest.'),
    ] } },
  { id: 'hanfeizi', name: 'Han Feizi', years: 'c. 280–233 BCE', from: 'China (Han state)', era: 'Ancient', works: 'Han Feizi',
    idea: 'The Legalist: people are governed by clear laws, heavy punishments and a ruler who trusts no one.',
    v: [40, 35, 60, 98, 95, 98, 60, 20, 75, 80, 85, 30],
    lens: { name: 'Legalist State', kind: 'ideal', top: 'The Qin model', question: 'How far does this state govern by strict law, heavy punishment and central control?', criteria: [
      C('soc:justice', -1, 2, 'Strict laws and heavy punishments.'),
      C('ax:center', 1, 1, 'All power to the ruler.'),
      C('ax:power', 1, 1, 'Techniques of control over ministers.'),
      C('ax:liberty', 1, 1, 'Law and order over individual will.'),
    ] } },
  { id: 'mozi', name: 'Mozi', years: 'c. 470–391 BCE', from: 'China', era: 'Ancient', works: 'Mozi',
    idea: 'Taught impartial care for all and condemned wars of aggression and wasteful luxury.',
    v: [35, 80, 50, 60, 45, 60, 55, 70, 40, 40, 10, 70],
    lens: { name: 'Universal Care', kind: 'ideal', top: 'Impartial care', question: 'Does this state avoid aggression and spend on people rather than display?', criteria: [
      C('ax:force', -1, 2, 'Condemn offensive war.'),
      C('ax:welfare', 1, 1, 'Benefit all people.'),
      C('ax:eco', 1, 1, 'Frugality, against waste.'),
    ] } },
  { id: 'ibnkhaldun', name: 'Ibn Khaldun', years: '1332–1406', from: 'Tunis', era: 'Early modern', works: 'Muqaddimah (1377)',
    idea: 'States rise on group solidarity (asabiyyah) and decline in luxury, heavy taxes and arbitrary rule.',
    v: [65, 40, 40, 55, 50, 55, 65, 75, 70, 60, 55, 45],
    lens: { name: 'Asabiyyah', kind: 'ideal', top: 'A rising dynasty', question: 'Does this state show the solidarity and light taxation of a rising power?', criteria: [
      C('ax:nation', 1, 1, 'Group feeling binds a people.'),
      C('ax:faith', 1, 1, 'Religion strengthens group feeling.'),
      C('ax:econ', 1, 1, 'Low taxes bring high revenue; heavy taxes kill enterprise.'),
      C('ax:power', -1, 1, 'Absolute, luxurious rule brings decline.'),
    ] } },
];

/* ---------------------------------------------------------------- scoring */
export interface Target { v: (number | null)[]; cid?: string }
const AX_I = Object.fromEntries(AXES.map((a, i) => [a.id, i]));
const SOC_I = Object.fromEntries(SOC_AXES.map((a, i) => [a.id, i]));
const IND = Object.fromEntries(INDICATORS.map((i) => [i.id, i]));

function read(src: Src, t: Target): number | null {
  if (src === 'calc:moderation') { const vs = t.v.filter((x): x is number => x != null); return vs.length ? Math.max(0, 100 - 2 * (vs.reduce((s, x) => s + Math.abs(x - 50), 0) / vs.length)) : null; }
  const [kind, id, target] = src.split(':');
  if (kind === 'ax') return t.v[AX_I[id]] ?? null;
  if (kind === 'near') { const x = t.v[AX_I[id]]; return x == null ? null : Math.max(0, 100 - 2 * Math.abs(x - Number(target))); }
  if (!t.cid) return null;
  if (src === 'eco:gini') { const g = ECON[t.cid]?.gini?.v; return g == null ? null : giniScaled(g); }
  if (src === 'eco:redist') { const x = ECON[t.cid]?.redist?.v; return x == null ? null : redistScaled(x); }
  if (kind === 'soc') return SOC_VEC[t.cid]?.[SOC_I[id]] ?? null;
  if (kind === 'ind') { const ind = IND[id]; const s = ind ? valueOf(ind, t.cid)?.score : null; return s ?? null; }
  return null;
}

export interface LensResult { v: number | null; used: number; total: number; parts: { c: Criterion; x: number | null }[] }
export function lensScore(lens: Lens, t: Target): LensResult {
  let sw = 0, s = 0, used = 0;
  const parts = lens.criteria.map((c) => {
    const raw = read(c.src, t);
    const x = raw == null ? null : c.dir === 1 ? raw : 100 - raw;
    if (x != null) { sw += c.w; s += c.w * x; used++; }
    return { c, x: x == null ? null : Math.round(x) };
  });
  return { v: used >= 2 ? Math.round(s / sw) : null, used, total: lens.criteria.length, parts };
}

export function band(v: number, kind: Lens['kind']) {
  const n = ['Far from it', 'Traces of it', 'Partly there', 'Largely there', 'Fully realised'];
  const i = ['Far from it', 'Weak', 'Partial', 'Strong', 'Close to the ideal'];
  const k = v >= 80 ? 4 : v >= 65 ? 3 : v >= 45 ? 2 : v >= 25 ? 1 : 0;
  return (kind === 'nightmare' ? n : i)[k];
}

export const kinship = (a: Author, v: (number | null)[]) => similarity(v, a.v);

/** Describe a criterion's data source for display. */
export function srcLabel(src: Src): string {
  if (src === 'calc:moderation') return 'Closeness to the middle of all twelve Compass axes';
  if (src === 'eco:gini') return 'Measured inequality: Gini after taxes and transfers (SWIID)';
  if (src === 'eco:redist') return 'Measured redistribution: how much taxes and transfers cut inequality (SWIID)';
  const [kind, id, target] = src.split(':');
  if (kind === 'ax') { const a = AXES[AX_I[id]]; return `Compass axis ${a.name} (${a.low} → ${a.high})`; }
  if (kind === 'near') { const a = AXES[AX_I[id]]; return `Closeness to ${target} on ${a.name}`; }
  if (kind === 'soc') return `Social Atlas: ${SOC_AXES[SOC_I[id]].name}`;
  return `Law: ${IND[id]?.name ?? id}`;
}
export const countryOnly = (src: Src) => src.startsWith('soc:') || src.startsWith('ind:') || src.startsWith('eco:');
