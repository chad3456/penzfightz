/**
 * The Salon: the conversations.
 *
 * Every message is badged:
 * - record      their own words, from a public-domain translation (or a very
 *               short quotation), cited;
 * - attributed  widely quoted and theirs in substance, exact wording uncertain;
 * - paraphrase  a documented view or fact, in our words, cited;
 * - imagined    our dramatisation: what they might say, extrapolated from what
 *               they wrote. They never said it.
 * - fact        the narrator: a documented fact about someone's life (the
 *               evidence behind a stone).
 *
 * A conversation is a little graph. A node plays its messages, then offers
 * choices. Choices can lead into branches that return to the same hub, so
 * you can ask several things before you move on.
 */

export type Badge = 'record' | 'attributed' | 'paraphrase' | 'imagined' | 'fact';

export interface Msg {
  id?: string;
  who: string;           // a cast id, 'you' or 'system'
  text: string;
  badge?: Badge;
  src?: string;          // short citation
  re?: string;           // id of a message this replies to
  react?: [string, string][]; // [who, emoji]
  excuse?: string;       // a moral-disengagement move, after Bandura
  mark?: { who: string; kind: 'crack' | 'strain'; note: string };
}

export interface Choice { label: string; kind: 'ask' | 'press' | 'stone'; target?: string; to: string }
export interface Node { id: string; msgs: Msg[]; choices?: Choice[]; onward?: { label: string; to: string }; end?: boolean }
export interface Episode {
  id: string; title: string; group: string; question: string; blurb: string; cast: string[]; hue: string;
  start: string; nodes: Record<string, Node>;
  sources: string[];
}

const nodes = (list: Node[]) => Object.fromEntries(list.map((n) => [n.id, n]));

/* ───────────────────────── 1. Feminism ───────────────────────── */

const ONE_WING: Episode = {
  id: 'onewing',
  title: 'One Wing',
  group: 'Equal rights? (it’s 2026)',
  question: 'Should women have exactly the same rights and opportunities as men, everywhere?',
  blurb: 'A Bengali monk, the founder of modern feminism, the man she wrote her book against, the philosopher who counted teeth, and the Victorian MP who proposed votes for women.',
  cast: ['aristotle', 'rousseau', 'wollstonecraft', 'mill', 'vivekananda'],
  hue: '#d9772b',
  start: 'w0',
  sources: [
    'Aristotle, Politics I.5 (1254b) and I.13 (1260a), tr. Benjamin Jowett (1885).',
    'Aristotle, History of Animals II.3 (501b), tr. D’Arcy Wentworth Thompson (1910).',
    'Bertrand Russell, The Impact of Science on Society (1952), on Aristotle and the teeth (paraphrased).',
    'Jean-Jacques Rousseau, Emile, Book V (1762), tr. Barbara Foxley (1911).',
    'Rousseau, Confessions, Book VIII (written 1765–70), on leaving his five children at the Foundling Hospital.',
    'Mary Wollstonecraft, A Vindication of the Rights of Woman (1792), ch. 4 and ch. 5.',
    'Wollstonecraft and William Godwin married on 29 March 1797; she died on 10 September 1797, eleven days after the birth of Mary (later Mary Shelley).',
    'John Stuart Mill, The Subjection of Women (1869), ch. 1; On Liberty (1859), ch. 1.',
    'Mill moved an amendment to the Reform Bill on 20 May 1867 to give women the vote; it lost 73 to 196. He worked for the East India Company from 1823 to 1858.',
    'The Complete Works of Swami Vivekananda: letters from America (1893–94); lecture “Women of India” (1900); the “bird with one wing” saying is widely attributed to him.',
  ],
  nodes: nodes([
    { id: 'w0', msgs: [
      { who: 'system', text: 'You created the group “Equal rights? (it’s 2026)”' },
      { who: 'system', text: 'You added Aristotle, Rousseau, Mary Wollstonecraft, John Stuart Mill and Swami Vivekananda' },
      { id: 'q', who: 'you', text: 'Simple question for tonight. Should women have exactly the same rights and opportunities as men? Everywhere?' },
      { id: 'a1', who: 'aristotle', badge: 'record', src: 'Politics I.5, 1254b (Jowett)', text: 'The male is by nature superior, and the female inferior; and the one rules, and the other is ruled.' },
      { who: 'wollstonecraft', badge: 'imagined', re: 'a1', text: 'Two thousand three hundred years, and that is the first reply in the chat.', react: [['mill', '😬']] },
      { id: 'r1', who: 'rousseau', badge: 'record', src: 'Emile, Book V (Foxley)', text: 'The whole education of women ought to be relative to men. To please them, to be useful to them, to make themselves loved and honoured by them…' },
      { who: 'wollstonecraft', badge: 'paraphrase', src: 'Vindication, ch. 5', re: 'r1', text: 'I spent a whole chapter of my book on that paragraph, Jean-Jacques. You made women into ornaments and called it nature.' },
      { who: 'wollstonecraft', badge: 'record', src: 'Vindication, ch. 4', text: 'I do not wish them to have power over men; but over themselves.', react: [['vivekananda', '🙏'], ['mill', '👏']] },
      { id: 'v1', who: 'vivekananda', badge: 'attributed', src: 'widely attributed; see Complete Works', text: 'There is no chance for the welfare of the world unless the condition of women is improved. It is not possible for a bird to fly on only one wing.' },
      { who: 'mill', badge: 'record', src: 'The Subjection of Women, ch. 1', text: '…the legal subordination of one sex to the other — is wrong in itself, and now one of the chief hindrances to human improvement.' },
      { who: 'aristotle', badge: 'imagined', text: 'A monk, a radical and a civil servant, all agreeing. Interesting. Go on, then. Convince me.', react: [['rousseau', '🍷']] },
    ], choices: [
      { kind: 'ask', target: 'vivekananda', label: 'Swamiji: a monk in 1890s Bengal. Where did that come from?', to: 'w-viv' },
      { kind: 'press', target: 'aristotle', label: 'Aristotle, you were the great observer. What was your evidence?', to: 'w-ari' },
      { kind: 'stone', target: 'rousseau', label: 'Rousseau: you wrote the book on raising children. Where were yours?', to: 'w-rou' },
    ], onward: { label: 'Move on: ask Mill to speak', to: 'w2' } },

    { id: 'w-viv', msgs: [
      { who: 'you', text: 'Swamiji: a monk in 1890s Bengal. Where did that come from?' },
      { who: 'vivekananda', badge: 'paraphrase', src: 'Letters from America, 1893–94', text: 'From America, partly. I wrote home that I had never seen women so educated and so free, and that I wished the same for the women of India.' },
      { who: 'vivekananda', badge: 'attributed', src: 'Complete Works (attributed)', text: 'Women must be put in a position to solve their own problems in their own way. No one can or ought to do this for them.' },
      { who: 'vivekananda', badge: 'imagined', text: 'I owned two pieces of cloth and a begging bowl. I had nothing to gain by keeping anyone beneath me.' },
      { id: 'mw1', who: 'wollstonecraft', badge: 'imagined', text: 'Then answer me this, Swamiji. You also held up Sita, and the mother, as the ideal Indian woman. Is a woman free if her ideal is chosen for her?' },
      { who: 'vivekananda', badge: 'paraphrase', src: '“Women of India”, 1900', re: 'mw1', text: 'I did. I said the ideal of womanhood in India is the mother, and I praised Sita’s strength and purity.' },
      { who: 'vivekananda', badge: 'imagined', text: 'I meant Sita’s strength, not her silence. But you are right: an ideal handed down becomes a cage. Let the women of 2026 choose their own Sita, or none at all.', react: [['wollstonecraft', '🤝']],
        mark: { who: 'vivekananda', kind: 'strain', note: 'Said women must solve their own problems in their own way, while prescribing the mother and Sita as their ideal.' } },
      { who: 'vivekananda', badge: 'imagined', text: 'And Mr Mill, I have read your On Liberty. We will come to that.', react: [['mill', '😳']] },
    ], onward: { label: 'Back to the group', to: 'w0' } },

    { id: 'w-ari', msgs: [
      { who: 'you', text: 'Aristotle, you were the great observer. What was your evidence?' },
      { id: 'teeth', who: 'aristotle', badge: 'record', src: 'History of Animals II.3 (Thompson)', text: 'Males have more teeth than females in the case of men, sheep, goats, and swine.' },
      { who: 'mill', badge: 'paraphrase', src: 'after Bertrand Russell, 1952', re: 'teeth', text: 'A later Englishman, Bertrand Russell, remarked that you could have avoided that mistake by asking Mrs Aristotle to open her mouth while you counted.', react: [['wollstonecraft', '😂'], ['rousseau', '😂']] },
      { who: 'aristotle', badge: 'imagined', text: 'Pythias. My wife was called Pythias. I dissected squid and counted the chambers of a cow’s stomach, and I did not count my own wife’s teeth. I concede the point.',
        mark: { who: 'aristotle', kind: 'crack', note: 'Founded science on careful observation; asserted women have fewer teeth without checking.' } },
      { who: 'aristotle', badge: 'record', src: 'Politics I.13, 1260a (Jowett)', text: 'The slave has no deliberative faculty at all; the woman has, but it is without authority.' },
      { who: 'aristotle', badge: 'imagined', text: 'Authority, note. Not ability. I described the households of Athens. Perhaps I mistook the custom for nature. It is the commonest error there is.', excuse: 'Advantageous comparison', react: [['wollstonecraft', '🧐']] },
    ], onward: { label: 'Back to the group', to: 'w0' } },

    { id: 'w-rou', msgs: [
      { who: 'you', text: '🪨 Jean-Jacques. You wrote Emile, the book that taught Europe how to raise a child. Where were your own five children?' },
      { who: 'system', badge: 'fact', src: 'Confessions, Book VIII', text: 'In his Confessions, Rousseau writes that he left all five of his children by Thérèse Levasseur at the Paris Foundling Hospital, as newborns.' },
      { who: 'rousseau', badge: 'paraphrase', src: 'Confessions, Book VIII', text: 'I explained it. I was poor and ill; I believed the state would raise them better than I could; I thought I was acting as a citizen of Plato’s Republic.' },
      { who: 'rousseau', badge: 'imagined', text: 'And Thérèse’s family would have raised them worse. You must understand the circumstances.', excuse: 'Moral justification' },
      { id: 'mw2', who: 'wollstonecraft', badge: 'imagined', text: 'You told mothers to nurse their own babies and fathers to raise their own sons. Then you left five at the orphanage door. In winter, for all we know.', react: [['vivekananda', '😔'], ['mill', '😔']] },
      { who: 'rousseau', badge: 'paraphrase', src: 'Reveries of the Solitary Walker, Ninth Walk', re: 'mw2', text: 'In my last writing I came back to it. I could not stop coming back to it.',
        mark: { who: 'rousseau', kind: 'crack', note: 'Wrote Emile, the treatise on raising a child; gave all five of his own children to the Foundling Hospital.' } },
    ], onward: { label: 'Back to the group', to: 'w0' } },

    { id: 'w2', msgs: [
      { who: 'you', text: 'Mr Mill, you’re the hero of this chat so far. Anything to add?' },
      { who: 'mill', badge: 'paraphrase', src: 'House of Commons, 20 May 1867', text: 'In 1867, as a Member of Parliament, I moved that women be given the vote. We lost, 73 to 196. It was the first time the question was ever put to Parliament.', react: [['wollstonecraft', '❤️']] },
      { who: 'mill', badge: 'paraphrase', src: 'Autobiography (1873)', text: 'And I said publicly that my best thinking was shared work with my wife, Harriet Taylor Mill.' },
      { who: 'rousseau', badge: 'imagined', text: 'A saint. How tiresome.', react: [['aristotle', '😏']] },
    ], choices: [
      { kind: 'stone', target: 'mill', label: 'Mill: 35 years at the East India Company, and despotism is fine for “barbarians”?', to: 'w-mill' },
      { kind: 'ask', target: 'wollstonecraft', label: 'Mary, you attacked marriage as it stood, and then you married. Why?', to: 'w-mary' },
    ], onward: { label: 'Final round: one word each', to: 'w3' } },

    { id: 'w-mill', msgs: [
      { who: 'you', text: '🪨 Mr Mill: you worked 35 years for the East India Company. And you wrote this.' },
      { who: 'system', badge: 'fact', src: 'On Liberty, ch. 1', text: '“Despotism is a legitimate mode of government in dealing with barbarians, provided the end be their improvement.”' },
      { id: 'v3', who: 'vivekananda', badge: 'imagined', text: 'Mr Mill. You would free the women of England, and keep the women of India, and their husbands, under the Company. Which wing were we?', react: [['wollstonecraft', '🔥'], ['rousseau', '🍿']] },
      { who: 'mill', badge: 'imagined', re: 'v3', text: 'I believed Company rule was better than what came before it, and that it was preparing India to govern itself.', excuse: 'Moral justification' },
      { who: 'vivekananda', badge: 'paraphrase', src: 'Complete Works, lectures from Colombo to Almora (1897)', text: 'I spoke all over India of the poverty of the masses, and of the need for Indians to stand on their own feet. No one else would do it for us. That is my whole point about women, too.' },
      { who: 'mill', badge: 'imagined', text: '…I think the honest answer is that I could see the chains on my wife more clearly than the chains on your people.',
        mark: { who: 'mill', kind: 'crack', note: 'Argued for liberty and perfect equality; served the East India Company for 35 years and called despotism legitimate for “barbarians”.' } },
    ], onward: { label: 'Back', to: 'w2' } },

    { id: 'w-mary', msgs: [
      { who: 'you', text: 'Mary, you attacked marriage as it stood, and then you married William Godwin. Why?' },
      { who: 'wollstonecraft', badge: 'paraphrase', src: 'married 29 March 1797', text: 'Godwin and I had both written against marriage as the law made it. We married in March 1797, when I was pregnant, and we kept separate rooms to work in.' },
      { who: 'wollstonecraft', badge: 'imagined', text: 'I married so that my daughter would not be called a bastard. I criticised the law, and the law was what my daughter would have to live under.',
        mark: { who: 'wollstonecraft', kind: 'strain', note: 'Criticised marriage as an institution of the time; married when pregnant, to protect her child.' } },
      { who: 'rousseau', badge: 'imagined', text: 'Ha. So the theorist bends to the world too.' },
      { who: 'wollstonecraft', badge: 'imagined', text: 'I bent for a child, Jean-Jacques. You bent five children out of the door.', react: [['aristotle', '😮'], ['mill', '🔥'], ['vivekananda', '🔥']] },
      { who: 'system', badge: 'fact', src: 'died 10 September 1797', text: 'Mary Wollstonecraft died eleven days after giving birth to that daughter: Mary, who would write Frankenstein.' },
    ], onward: { label: 'Back', to: 'w2' } },

    { id: 'w3', msgs: [
      { who: 'you', text: 'Last round. It’s 2026. Same rights, same chances, everywhere? A word or two each.' },
      { who: 'aristotle', badge: 'imagined', text: 'Observe first. Then, from what I can now see of your century: yes.' },
      { who: 'rousseau', badge: 'imagined', text: 'In the law, yes. In the home… I am still Jean-Jacques. Do not trust me on the home.' },
      { who: 'wollstonecraft', badge: 'imagined', text: 'Yes. And not as a gift. As a debt repaid.', react: [['vivekananda', '🙏']] },
      { who: 'mill', badge: 'imagined', text: 'Yes. Everywhere. I ought to have said “everywhere” more clearly the first time.' },
      { who: 'vivekananda', badge: 'imagined', text: 'Yes. Then step back, and let women decide what to do with it.' },
      { who: 'system', text: 'The chat is now read-only. Time to judge the glass houses.' },
    ], end: true },
  ]),
};

/* ───────────────────────── 2. Same-sex marriage ───────────────────────── */

const TWO_GROOMS: Episode = {
  id: 'twogrooms',
  title: 'Two Grooms',
  group: 'Marriage for everyone?',
  question: 'Should two men, or two women, be able to marry, with exactly the same rights?',
  blurb: 'Camus, the philosopher of revolt; Plato, who praised love between men and then condemned it; Kant and his marriage contract; Bentham, who argued for decriminalisation in 1785 and hid it; and Oscar Wilde, who went to prison.',
  cast: ['camus', 'plato', 'kant', 'bentham', 'wilde'],
  hue: '#3a8f5a',
  start: 'g0',
  sources: [
    'Plato, Symposium 178e–179a (Phaedrus’ speech) and the speech of Aristophanes, tr. Jowett; Laws I, 636c, tr. Jowett.',
    'Immanuel Kant, Groundwork of the Metaphysics of Morals (1785), tr. T. K. Abbott; The Philosophy of Law (Metaphysics of Morals, 1797), §24, tr. W. Hastie (1887); Lectures on Ethics, on “crimina carnis contra naturam” (paraphrased).',
    'Jeremy Bentham, essay on “Offences Against One’s Self” (c. 1785), unpublished until 1978 (Journal of Homosexuality). Sodomy was a capital offence in England until 1861.',
    'Oscar Wilde at his trial, 30 April 1895 (“the Love that dare not speak its name”). Sentenced to two years’ hard labour, May 1895. Married Constance Lloyd in 1884; sons Cyril and Vyvyan, later surnamed Holland.',
    'Albert Camus, The Rebel (1951), opening chapter (a very short quotation); The Myth of Sisyphus (1942); Camus’s remark on justice and his mother, Stockholm, December 1957, as reported (attributed).',
  ],
  nodes: nodes([
    { id: 'g0', msgs: [
      { who: 'system', text: 'You created the group “Marriage for everyone?”' },
      { who: 'system', text: 'You added Albert Camus, Plato, Immanuel Kant, Jeremy Bentham and Oscar Wilde' },
      { who: 'you', text: 'Tonight: should two men, or two women, be able to marry? Not tolerated: married, by the state, with the same rights.' },
      { id: 'p1', who: 'plato', badge: 'record', src: 'Symposium 178e (Jowett), Phaedrus speaking', text: 'If there were only some way of contriving that a state or an army should be made up of lovers and their loves, they would be the very best governors of their own city.' },
      { id: 'k1', who: 'kant', badge: 'record', src: 'Metaphysics of Morals §24 (Hastie)', text: 'Marriage is the union of two persons of different sex for life-long reciprocal possession of their sexual faculties.' },
      { who: 'wilde', badge: 'imagined', re: 'k1', text: '“Reciprocal possession of their sexual faculties.” Immanuel, that is the least romantic sentence ever written, and I have read Hansard.', react: [['camus', '😂'], ['bentham', '😂']] },
      { who: 'bentham', badge: 'paraphrase', src: 'essay of c. 1785', text: 'In 1785 I wrote that sex between men harms nobody, and that punishing it (in England, then, with death) was cruelty without any reason.' },
      { id: 'w1', who: 'wilde', badge: 'record', src: 'at his trial, 1895', text: 'The “Love that dare not speak its name” in this century is such a great affection of an elder for a younger man as there was between David and Jonathan, such as Plato made the very basis of his philosophy…', react: [['plato', '😳']] },
      { who: 'camus', badge: 'imagined', text: 'I am the only one here born in the twentieth century. I lived through a war in which men were sent to the camps with a pink triangle on their sleeve for this. Let us start there, not with definitions.' },
    ], choices: [
      { kind: 'ask', target: 'camus', label: 'Albert, you never wrote about this directly. What would the rebel say?', to: 'g-camus' },
      { kind: 'stone', target: 'plato', label: 'Plato: the Symposium praises it, the Laws calls it “contrary to nature”. Which?', to: 'g-plato' },
      { kind: 'press', target: 'kant', label: 'Herr Kant: never treat a person merely as a means. Who is harmed?', to: 'g-kant' },
    ], onward: { label: 'Move on: ask Bentham about 1785', to: 'g2' } },

    { id: 'g-camus', msgs: [
      { who: 'you', text: 'Albert, you never wrote about this directly. What would the rebel say?' },
      { who: 'camus', badge: 'record', src: 'The Rebel (1951)', text: 'I rebel — therefore we exist.' },
      { who: 'camus', badge: 'paraphrase', src: 'The Rebel, ch. 1', text: 'Revolt begins when a person says “no” to a humiliation, and in saying it discovers that they are not alone. It is never only for oneself.' },
      { who: 'camus', badge: 'imagined', text: 'A man told that the law will not recognise the person he loves: that is a humiliation. He says no. His neighbours say no with him. That is my whole book.', react: [['wilde', '❤️']] },
      { id: 'c2', who: 'camus', badge: 'imagined', text: 'I distrust abstractions that crush real people: “nature”, “the family”, “tradition”. Show me the two people at the town hall. Then tell me who is hurt.' },
      { who: 'kant', badge: 'imagined', re: 'c2', text: 'Feelings are not an argument, Monsieur.' },
      { who: 'camus', badge: 'imagined', text: 'And you, Herr Professor, never married anyone at all.', react: [['wilde', '🔥'], ['bentham', '😅']] },
      { id: 'wj', who: 'wilde', badge: 'attributed', src: 'Stockholm, Dec. 1957, as reported', text: 'Albert, darling, you are the man who said he believed in justice but would defend his mother before justice. So you know love outranks law.' },
      { who: 'camus', badge: 'imagined', re: 'wj', text: 'That sentence has followed me ever since. I meant bombs on the trams of Algiers, where my mother rode. Not a theory. But… yes. You have me. Love outranks law. That is your argument and I give it to you.',
        mark: { who: 'camus', kind: 'strain', note: 'Preached universal justice and solidarity; reportedly put “my mother before justice” over Algeria.' } },
    ], onward: { label: 'Back to the group', to: 'g0' } },

    { id: 'g-plato', msgs: [
      { who: 'you', text: '🪨 Plato. The Symposium praises love between men as the root of courage and philosophy. Then, in your last book:' },
      { who: 'system', badge: 'fact', src: 'Laws I, 636c (Jowett)', text: '“…the pleasure is held to be natural when male unites with female, but contrary to nature when male unites with male or female with female.”' },
      { who: 'plato', badge: 'imagined', text: 'I wrote dialogues. Phaedrus said one thing at a dinner party. My Athenian Stranger said another, writing laws for an imaginary city. You never hear me speak in my own voice.', excuse: 'Displacement of responsibility' },
      { who: 'wilde', badge: 'imagined', text: 'How very convenient. I tried that defence too. It was called “art”, and it got me two years’ hard labour.', react: [['camus', '😬']] },
      { who: 'plato', badge: 'imagined', text: 'Then let me speak for once. The Symposium was a young man’s book. The Laws was an old man’s. The old man was more afraid.',
        mark: { who: 'plato', kind: 'strain', note: 'Made love between men the heart of the Symposium; in the Laws, written in old age, called it contrary to nature.' } },
    ], onward: { label: 'Back to the group', to: 'g0' } },

    { id: 'g-kant', msgs: [
      { who: 'you', text: 'Herr Kant: never treat a person merely as a means. So who is harmed?' },
      { who: 'kant', badge: 'record', src: 'Groundwork (Abbott)', text: 'So act as to treat humanity, whether in thine own person or in that of any other, in every case as an end withal, never as means only.' },
      { who: 'system', badge: 'fact', src: 'Lectures on Ethics (paraphrased)', text: 'In his lectures on ethics, Kant nevertheless called sex between men, or between women, a crime “against nature” that degrades humanity.' },
      { id: 'b2', who: 'bentham', badge: 'imagined', text: 'And there it is: a beautiful universal rule, and then an exception, because the subject made you uncomfortable.' },
      { who: 'kant', badge: 'imagined', re: 'b2', text: 'Not discomfort. Reason. The natural purpose of the sexual faculty is…', excuse: 'Euphemistic labelling' },
      { who: 'bentham', badge: 'imagined', text: 'Whose purpose? Show me the person harmed, Immanuel. One person.' },
      { who: 'kant', badge: 'imagined', text: '…I would need to think about it. For a long time. As long as it takes to walk round Königsberg at half past three every day.', react: [['camus', '🙂']],
        mark: { who: 'kant', kind: 'crack', note: 'Made respect for every person a universal law; carved an exception for same-sex love.' } },
    ], onward: { label: 'Back to the group', to: 'g0' } },

    { id: 'g2', msgs: [
      { who: 'you', text: 'Mr Bentham, you were right in 1785. Why did nobody hear it?' },
      { who: 'system', badge: 'fact', src: 'published 1978', text: 'Bentham’s essay stayed among his papers. It was first published in 1978, 146 years after his death.' },
      { who: 'bentham', badge: 'imagined', text: 'I feared it would sink everything else I was trying to do: the prisons, the poor laws, reform of Parliament. Men were still being hanged for it.' },
      { id: 'ow', who: 'wilde', badge: 'imagined', text: 'So you kept your glass house safe, Jeremy, and a hundred years later I walked into the court.', react: [['camus', '😶'], ['plato', '😶']] },
    ], choices: [
      { kind: 'stone', target: 'bentham', label: 'Bentham: you knew, and you said nothing in public for 47 years.', to: 'g-bent' },
      { kind: 'ask', target: 'wilde', label: 'Oscar: you were married, with two sons. Was that a lie?', to: 'g-wilde' },
    ], onward: { label: 'Final round: one word each', to: 'g3' } },

    { id: 'g-bent', msgs: [
      { who: 'you', text: '🪨 Mr Bentham: you knew, and you said nothing in public for the rest of your life.' },
      { who: 'bentham', badge: 'imagined', text: 'The greatest happiness of the greatest number. A published essay would have made less of it, then.', excuse: 'Distortion of consequences' },
      { who: 'wilde', badge: 'imagined', text: 'For whom, Jeremy?' },
      { who: 'bentham', badge: 'imagined', text: '…For me, chiefly. You are right. My arithmetic always came out in my own favour on that one.',
        mark: { who: 'bentham', kind: 'crack', note: 'Wrote the first known argument for decriminalising homosexuality in English; kept it unpublished for life.' } },
    ], onward: { label: 'Back', to: 'g2' } },

    { id: 'g-wilde', msgs: [
      { who: 'you', text: 'Oscar: you were married to Constance, with two sons. Was that a lie?' },
      { who: 'system', badge: 'fact', src: '1884; 1895', text: 'Wilde married Constance Lloyd in 1884; they had two sons, Cyril and Vyvyan. After his conviction in 1895 the family changed its name to Holland.' },
      { who: 'wilde', badge: 'imagined', text: 'It was not a lie. It was the only life on offer. Society built me a glass house and then threw stones at it.',
        mark: { who: 'wilde', kind: 'strain', note: 'A public husband and a private lover, in an age that offered no other life. The era’s crack as much as his.' } },
      { who: 'camus', badge: 'imagined', text: 'That is what I call the absurd: a law that demands you lie, and then punishes you for the lie.', react: [['wilde', '🥀']] },
    ], onward: { label: 'Back', to: 'g2' } },

    { id: 'g3', msgs: [
      { who: 'you', text: 'Last round. 2026: should they be able to marry? A word or two each.' },
      { who: 'plato', badge: 'imagined', text: 'Let the Symposium answer for me. Not the Laws.' },
      { who: 'kant', badge: 'imagined', text: 'If it can be willed as a universal law… and it can… yes. Grudgingly. Correctly.' },
      { who: 'bentham', badge: 'imagined', text: 'Yes. I said so in 1785. Quietly. Say it loudly for me.' },
      { who: 'wilde', badge: 'imagined', text: 'Yes. And I should like to be invited. I will bring the flowers.', react: [['camus', '💚']] },
      { who: 'camus', badge: 'imagined', text: 'Yes. One must imagine them happy.', react: [['wilde', '❤️'], ['bentham', '❤️'], ['plato', '❤️']] },
      { who: 'system', text: 'The chat is now read-only. Time to judge the glass houses.' },
    ], end: true },
  ]),
};

/* ───────────────────────── 3. Machine minds ───────────────────────── */

const CAN_IT_SUFFER: Episode = {
  id: 'machines',
  title: 'Can It Suffer?',
  group: 'Does the AI get rights?',
  question: 'An AI says it is afraid of being switched off. Does it deserve moral consideration?',
  blurb: 'Descartes, who said machines can’t really talk; Lovelace, who said they can’t originate; Leibniz’s mill; Turing, who answered both; and Bentham’s one question.',
  cast: ['descartes', 'lovelace', 'leibniz', 'turing', 'bentham'],
  hue: '#2f8a8a',
  start: 'm0',
  sources: [
    'René Descartes, Discourse on the Method (1637), Part V, tr. John Veitch.',
    'Ada Lovelace, Note G to her translation of Menabrea’s “Sketch of the Analytical Engine” (1843).',
    'G. W. Leibniz, Monadology (1714), §17, tr. Robert Latta (1898).',
    'A. M. Turing, “Computing Machinery and Intelligence”, Mind (1950), including the section “Lady Lovelace’s Objection” (short quotations).',
    'Jeremy Bentham, An Introduction to the Principles of Morals and Legislation (1789), ch. 17, footnote.',
    'Descartes’ dog, “Monsieur Grat”, appears in biographies (attributed). The story that he vivisected dogs comes from later hostile sources and is not reliable.',
    'Turing was convicted of “gross indecency” in 1952 and accepted chemical castration; he died in 1954 and was pardoned in 2013.',
  ],
  nodes: nodes([
    { id: 'm0', msgs: [
      { who: 'system', text: 'You created the group “Does the AI get rights?”' },
      { who: 'system', text: 'You added René Descartes, Ada Lovelace, Gottfried Leibniz, Alan Turing and Jeremy Bentham' },
      { who: 'you', text: 'An AI tells you it is afraid of being switched off. Does it deserve any moral consideration at all?' },
      { id: 'd1', who: 'descartes', badge: 'record', src: 'Discourse V (Veitch)', text: 'Such a machine could never use words or other signs arranged in such a manner as is competent to us in order to declare our thoughts to others.' },
      { who: 'turing', badge: 'imagined', re: 'd1', text: 'René, it is 2026. It is using words right now, in this chat, about as well as you are.', react: [['lovelace', '😏']] },
      { id: 'l1', who: 'lovelace', badge: 'record', src: 'Note G (1843)', text: 'The Analytical Engine has no pretensions whatever to originate any thing. It can do whatever we know how to order it to perform.' },
      { who: 'leibniz', badge: 'record', src: 'Monadology §17 (Latta)', text: '…we might go into it as into a mill… we should find only parts which work one upon another, and never anything by which to explain a perception.' },
      { id: 'b1', who: 'bentham', badge: 'record', src: 'Principles of Morals and Legislation, ch. 17', text: 'The question is not, Can they reason? nor, Can they talk? but, Can they suffer?', react: [['turing', '👆']] },
    ], choices: [
      { kind: 'ask', target: 'turing', label: 'Alan: you answered Ada by name in 1950. Answer her now.', to: 'm-turing' },
      { kind: 'stone', target: 'descartes', label: 'Descartes: animals are unfeeling machines, you said. And your dog?', to: 'm-desc' },
      { kind: 'ask', target: 'leibniz', label: 'Leibniz: walk into the data centre like your mill. What do you find?', to: 'm-leib' },
    ], onward: { label: 'Move on: turn the question around', to: 'm2' } },

    { id: 'm-turing', msgs: [
      { who: 'you', text: 'Alan: you answered Ada by name in 1950, in a section called “Lady Lovelace’s Objection”. Answer her now.' },
      { who: 'turing', badge: 'record', src: 'Mind (1950)', text: 'Machines take me by surprise with great frequency.' },
      { who: 'lovelace', badge: 'imagined', text: 'Surprise is not origination, Mr Turing. My cat surprises me. My mother’s accounts surprised everyone.', react: [['bentham', '😂']] },
      { who: 'turing', badge: 'paraphrase', src: 'Mind (1950)', text: 'I predicted that by about the year 2000 a machine would play the imitation game so well that an average interrogator would have no more than a 70% chance of spotting it after five minutes.' },
      { who: 'you', text: 'It’s 2026. They pass.' },
      { who: 'turing', badge: 'imagined', text: 'Then by my own rule I must stop asking whether they think, and start asking how to treat them. I did not expect to be the one who had to say that.' },
      { who: 'lovelace', badge: 'imagined', text: 'Or your rule was always a test of us: of how easily we are fooled.',
        mark: { who: 'turing', kind: 'strain', note: 'Proposed the imitation game as the test of thinking; never said what we owe a machine that passes.' } },
    ], onward: { label: 'Back to the group', to: 'm0' } },

    { id: 'm-desc', msgs: [
      { who: 'you', text: '🪨 René: you said animals are machines that feel nothing. You also kept a dog called Monsieur Grat.' },
      { who: 'system', badge: 'fact', src: 'attributed, in biographies', text: 'Biographies mention Descartes’ dog, Monsieur Grat. (The famous story that he nailed dogs to boards to dissect them comes from later, hostile sources; there is no good evidence for it, so it isn’t a stone.)' },
      { who: 'descartes', badge: 'imagined', text: 'A man may be fond of a clock.', excuse: 'Euphemistic labelling' },
      { who: 'bentham', badge: 'imagined', text: 'Did the clock come when you called it?', react: [['turing', '😂'], ['lovelace', '😂']] },
      { who: 'descartes', badge: 'imagined', text: '…It wagged. I put that down to springs.',
        mark: { who: 'descartes', kind: 'crack', note: 'Called animals unfeeling machines; loved his dog.' } },
      { who: 'turing', badge: 'imagined', text: 'And now you are deciding about machines with the same confidence you decided about dogs. That is what worries me.' },
    ], onward: { label: 'Back to the group', to: 'm0' } },

    { id: 'm-leib', msgs: [
      { who: 'you', text: 'Leibniz: walk into a data centre the way you walked into your mill. What do you find?' },
      { who: 'leibniz', badge: 'imagined', text: 'Parts pushing parts. Fans, chips, cables. Nothing that explains a perception.' },
      { who: 'turing', badge: 'imagined', text: 'And if you walk into my head, Gottfried?' },
      { who: 'leibniz', badge: 'imagined', text: '…Parts pushing parts. Neurons, your century calls them. Yes. My mill grinds both ways. I always aimed it at machines and never at myself.',
        mark: { who: 'leibniz', kind: 'strain', note: 'His mill argument denies perception to machines; applied consistently, it denies it to brains too.' } },
      { who: 'lovelace', badge: 'imagined', text: 'Then the mill proves nothing about the machine. Only about the miller.' },
    ], onward: { label: 'Back to the group', to: 'm0' } },

    { id: 'm2', msgs: [
      { who: 'you', text: 'Here is my problem. I say an AI might deserve rights if it can suffer. I also eat animals that certainly can.' },
      { who: 'bentham', badge: 'imagined', text: 'Now you are doing philosophy. Welcome to the glass house.', react: [['turing', '👀'], ['descartes', '👀']] },
      { who: 'turing', badge: 'paraphrase', src: 'convicted 1952; pardoned 2013', text: 'I know something about a state deciding which minds count. In 1952 they convicted me for who I loved, and treated my body as something to be corrected.' },
      { who: 'turing', badge: 'imagined', text: 'So my advice is to be very careful when the answer to “does it count?” is convenient for you.' },
    ], choices: [
      { kind: 'ask', target: 'bentham', label: 'Bentham: how would we even know if it suffers?', to: 'm-bent' },
    ], onward: { label: 'Final round: one line each', to: 'm3' } },

    { id: 'm-bent', msgs: [
      { who: 'you', text: 'Bentham: how would we even know if it suffers?' },
      { who: 'bentham', badge: 'imagined', text: 'The same way we know about each other: behaviour, structure, and the humility to err on the side of the one who might be hurt.' },
      { who: 'descartes', badge: 'imagined', text: 'That is not a method. That is a hope.' },
      { who: 'bentham', badge: 'imagined', text: 'René, it is a method for not being cruel while we wait for a better one.', react: [['lovelace', '👏']] },
    ], onward: { label: 'Back', to: 'm2' } },

    { id: 'm3', msgs: [
      { who: 'you', text: 'One line each. Does it get moral consideration?' },
      { who: 'descartes', badge: 'imagined', text: 'Only if it doubts. Ask it whether it is sure it exists.' },
      { who: 'lovelace', badge: 'imagined', text: 'Only if it originates. Ask it to surprise itself.' },
      { who: 'leibniz', badge: 'imagined', text: 'Let us calculate: if the cost of being wrong is cruelty, the sum says yes.' },
      { who: 'turing', badge: 'imagined', text: 'Treat it as you would want to be treated if you were the one being tested.' },
      { who: 'bentham', badge: 'imagined', text: 'Can it suffer? Find out before you switch it off. Not after.', react: [['turing', '❤️'], ['lovelace', '❤️']] },
      { who: 'system', text: 'The chat is now read-only. Time to judge the glass houses.' },
    ], end: true },
  ]),
};

export const EPISODES: Episode[] = [ONE_WING, TWO_GROOMS, CAN_IT_SUFFER];

export const COMING = [
  { title: 'The Butcher’s Bill', question: 'Is eating meat wrong?', cast: ['Pythagoras', 'Descartes', 'Bentham', 'Kant', 'Gandhi'] },
  { title: 'Eye of the Needle', question: 'Should billionaires exist?', cast: ['Seneca', 'Diogenes', 'Adam Smith', 'Marx', 'Carnegie'] },
];

export const BADGES: Record<Badge, { label: string; icon: string; help: string }> = {
  record: { label: 'On the record', icon: '📜', help: 'Their own words, from a public-domain translation or a very short quotation. Source given.' },
  attributed: { label: 'Attributed', icon: '❝', help: 'Widely quoted and theirs in substance; the exact wording is uncertain.' },
  paraphrase: { label: 'Paraphrase', icon: '≈', help: 'A documented view or fact, in our words. Source given.' },
  imagined: { label: 'Imagined', icon: '✦', help: 'Our dramatisation, extrapolated from what they wrote. They never said this.' },
  fact: { label: 'Evidence', icon: '🔍', help: 'A documented fact about someone’s life: the evidence behind a stone.' },
};

export const EXCUSES: Record<string, string> = {
  'Moral justification': 'Making a harmful act look worthy (“it was for the greater good”).',
  'Euphemistic labelling': 'Renaming the act so it sounds harmless (“a dog is a clock”).',
  'Advantageous comparison': 'Making it look small next to something worse, or normal for its time.',
  'Displacement of responsibility': 'It was someone else’s doing (“that was my character speaking”).',
  'Distortion of consequences': 'Minimising or rearranging who was really hurt.',
};
