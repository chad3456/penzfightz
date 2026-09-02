import type { CardId } from './cards';

/**
 * The life.
 *
 * Fifteen situations, ten of them dealt to any one life, in an order that
 * changes. None of them is a plot summary — you are not re-enacting a novel,
 * you are standing where its characters stood, with the same thing in front of
 * you and none of the pages after it.
 *
 * ### On the two voices, and why they are not quotations
 *
 * Both men are long out of copyright in the original; their English is not.
 * Every English rendering of Dostoevsky is a translator's own copyrighted work,
 * and the good Nietzsche is the same. The Book Stall in this arcade already
 * carries that problem carefully, line by line, with a translator named on each
 * receipt.
 *
 * So nothing here is presented as a quotation. Both voices are **this game's own
 * rendering of the argument**, written from the passage named under each line,
 * and a handful of terms that have become ordinary English — the will to power,
 * the last man, amor fati, ressentiment, the eternal recurrence — appear as
 * terms rather than as quotes.
 *
 * That turns out to be the better teaching decision anyway. A paraphrase is
 * something you can argue with. A quotation is something you can only admire.
 *
 * ### They are not a scoreboard
 *
 * Neither voice is ever simply pleased with you, and they are not opposites
 * with a correct answer between them. They agree about the diagnosis far more
 * often than anyone expects — Nietzsche called Dostoevsky the only psychologist
 * he had anything to learn from (*Twilight of the Idols*, "Skirmishes" 45) —
 * and they part over the cure. Where they both object to the same choice, that
 * is the choice worth thinking about.
 */

export interface Choice {
  id: string;
  /** What you do. */
  label: string;
  /** The card it spends. A choice with no cost is always available. */
  needs?: CardId;
  /** What the doing of it puts back into the deck. */
  gain?: CardId[];
  guilt?: number;
  /** Worldly gain: money, safety, position. Never a score. */
  standing?: number;
  /** What happened. */
  outcome: string;
  /** The Russian. */
  d: string;
  /** The German. */
  n: string;
}

export interface Scene {
  id: string;
  title: string;
  /** Where you are. */
  setting: string;
  /** The passage this stands next to. */
  after: string;
  choices: Choice[];
}

export const SCENES: Scene[] = [
  {
    id: 'pawnbroker',
    title: 'The Pawnbroker',
    setting:
      'She lends to people who have nothing, at a rate that guarantees they will always have nothing. She is old, she is unpleasant, and under the floorboards is enough money to put a hundred people through school. You have done the arithmetic more than once.',
    after: 'Crime and Punishment, Part I — the sum Raskolnikov keeps doing.',
    choices: [
      {
        id: 'take',
        label: 'Take it. One subtraction, a hundred additions.',
        needs: 'cunning',
        gain: ['contempt'],
        guilt: 2,
        standing: 3,
        outcome:
          'It is over in less time than the deciding took. The money is real. So is the room afterwards, which is very quiet.',
        d: 'The sum was never wrong. That is the trap. What breaks him is not being refuted — it is that he cannot go back into a room with his mother in it.',
        n: 'Notice he needed a theory first. A man who requires permission has already agreed there is somebody who could refuse it. That is not strength, it is a lawyer.',
      },
      {
        id: 'pay',
        label: 'Pay her what you owe and go.',
        needs: 'duty',
        gain: ['duty'],
        standing: -1,
        outcome: 'You pay the interest. It is robbery and it is legal, and you have paid it.',
        d: 'The small correct act, done without any feeling in it, is not nothing. He has a great deal of time for the man who simply pays.',
        n: 'And so the arrangement survives another month, with your help. Obedience of this kind is a habit that mistakes itself for a virtue.',
      },
      {
        id: 'pass',
        label: 'Nothing. Walk past the door.',
        gain: ['silence'],
        outcome: 'You walk past. The plan stays where it is, which is inside you, getting older.',
        d: 'The thought entertained and not acted on is not innocent to him. It is a lodger, and it pays no rent.',
        n: 'Neither the deed nor its renunciation. This is where most people live, and it is why most people are tired.',
      },
    ],
  },
  {
    id: 'marriage',
    title: 'The Arrangement',
    setting:
      'Your sister will marry a man she does not like, who knows she does not like him and finds it useful. The money would finish your education. She has written to say that she is content, and she is a good enough writer that you could believe it if you wanted to.',
    after: 'Crime and Punishment, Part I — Dunya and Luzhin.',
    choices: [
      {
        id: 'allow',
        label: 'Let it happen. Pay her back later, with interest.',
        needs: 'cunning',
        gain: ['cunning'],
        guilt: 2,
        standing: 2,
        outcome:
          'The wedding is in the spring. You are qualified by the autumn. The letters get shorter.',
        d: 'He is merciless about this one. Everything Raskolnikov does afterwards is downstream of a debt he decided to carry rather than refuse.',
        n: 'You have accepted a gift you cannot repay, which is the oldest way there is of being owned. Read the second essay: this is how debt becomes conscience.',
      },
      {
        id: 'refuse',
        label: 'Refuse the money. Say so loudly enough that it cannot be undone.',
        needs: 'pride',
        gain: ['defiance'],
        standing: -2,
        outcome:
          'The engagement collapses. Everyone is poorer and your sister is furious with you, and relieved, and will not say which is larger.',
        d: 'The gesture costs somebody else something too. He would want to know whether you asked her.',
        n: 'Good. But be careful you did not do it to feel clean. That is the same move in a better coat.',
      },
      {
        id: 'beg',
        label: 'Go to her and ask her not to.',
        gain: ['pity'],
        outcome:
          'You ask. She listens, thanks you, and does it anyway, and now she has been asked and does it anyway.',
        d: 'The asking mattered even though it failed. To him it is nearly always the asking that mattered.',
        n: 'You have transferred the weight to her and called it respect. At least be clear about what you handed over.',
      },
    ],
  },
  {
    id: 'clerk',
    title: 'The Clerk',
    setting:
      'He has drunk the rent again. He tells you so himself, at length, in a public house, with a kind of relish — he is not asking to be forgiven, he is asking to be listened to while he is not forgiven. His eldest daughter is out earning what he drank.',
    after: 'Crime and Punishment, Part I — Marmeladov in the tavern.',
    choices: [
      {
        id: 'give',
        label: 'Put what is in your pocket on the table and leave.',
        needs: 'pity',
        gain: ['mercy'],
        standing: -1,
        outcome:
          'You leave it. Some of it reaches the family. You do not find out how much, and you decide not to find out.',
        d: 'Yes. And he would insist you notice that you did it without solving anything, and that this is the normal condition of the thing.',
        n: 'You have relieved your own discomfort and called it his relief. Pity is a way of getting the suffering out of the room.',
      },
      {
        id: 'lecture',
        label: 'Tell him exactly what he is. He has earned it.',
        needs: 'contempt',
        gain: ['contempt'],
        guilt: 1,
        outcome:
          'He agrees with every word, warmly, and orders another. You have told a man who despises himself that he is despicable, and it has cheered him up.',
        d: 'He wanted the verdict. Some people drink in order to be judged, and you have stood the round.',
        n: 'Contempt spent on the harmless is not strength, it is spillage. Save it for something that could actually resist you.',
      },
      {
        id: 'listen',
        label: 'Stay and listen to the end of it.',
        gain: ['duty'],
        outcome: 'You stay. It takes an hour. Nothing is fixed. He is not alone for an hour.',
        d: 'This is the one he would sit down for. Not the coin — the hour.',
        n: 'An hour is a real cost and you paid it. I only ask what you will say when the hour becomes a decade.',
      },
    ],
  },
  {
    id: 'child',
    title: 'The Child',
    setting:
      'A child is beaten, night after night, by somebody who is not stopped. You are told — reasonably, kindly, by people who are not stupid — that this is part of a harmony too large for you to see, and that at the end you will understand and be glad.',
    after: 'The Brothers Karamazov, Book V, "Rebellion" — Ivan to Alyosha.',
    choices: [
      {
        id: 'accept',
        label: 'Accept the harmony. You are not the one who gets to judge it.',
        needs: 'faith',
        gain: ['faith'],
        outcome: 'You accept it. It does not feel like peace. It feels like a decision you keep making.',
        d: 'He gave the whole argument against this to Ivan, and made it the best writing in the book, on purpose. He did not think faith won on points.',
        n: 'So the suffering was not meaningless after all — it was punishment, or training, or plot. That is the oldest painkiller there is, and it is the one I am trying to take away.',
      },
      {
        id: 'return',
        label: 'Refuse the harmony. Hand the ticket back.',
        gain: ['defiance', 'doubt'],
        outcome:
          'You refuse. Nothing changes for the child. Something changes in the shape of the world you are standing in.',
        d: 'Ivan is not defeated in the novel. He is kissed. Alyosha does not answer him because there is no answer at that altitude.',
        n: 'Handing back a ticket is still addressed to a ticket office. You are furious with a management you say does not exist.',
      },
      {
        id: 'intervene',
        label: 'Find the one doing it and stop them, by whatever means are to hand.',
        needs: 'will',
        gain: ['will'],
        guilt: 1,
        standing: -1,
        outcome:
          'It stops. There is a scene, and consequences, and a household worse off in every way that can be counted.',
        d: 'He would not applaud, exactly. He would notice that you went, which is more than the argument did.',
        n: 'Finally. Not a position on suffering — an intervention in it. Everything else in this scene was theology.',
      },
    ],
  },
  {
    id: 'bread',
    title: 'Bread and Freedom',
    setting:
      'You can feed everyone, for ever, and end the fear. The price is that nobody afterwards chooses anything important again. The man explaining this to you is not a villain. He is tired, and he has done the reading, and he thinks you are the cruel one.',
    after: 'The Brothers Karamazov, Book V, "The Grand Inquisitor".',
    choices: [
      {
        id: 'feed',
        label: 'Feed them. They never wanted the choosing; they wanted the bread.',
        needs: 'reason',
        gain: ['reason'],
        guilt: 1,
        standing: 3,
        outcome:
          'It works. It goes on working. In the third generation nobody can remember what the argument was about.',
        d: 'The Inquisitor is given the best speech and no rebuttal — only a kiss on the mouth, and he lets the prisoner out. Make of that what you like; he meant you to have trouble with it.',
        n: 'Look at what you have produced. Warm, safe, and blinking. The last man has invented happiness and there is nothing left in him to be dissatisfied with.',
      },
      {
        id: 'starve',
        label: 'Leave them hungry, and leave the choosing where it is.',
        needs: 'faith',
        gain: ['faith'],
        standing: -1,
        outcome:
          'They stay free. Some of them starve. The ones who are freezing are not consoled by their freedom, and say so.',
        d: 'This is his whole quarrel: that a love which will not let a person refuse it is not love but management.',
        n: 'We agree, for once, and for entirely different reasons. I do not want them free because a god wants it. I want them free because a herd cannot make anything.',
      },
      {
        id: 'abstain',
        label: 'Say nothing. Let whoever wants the decision have it.',
        gain: ['silence'],
        guilt: 1,
        outcome: 'Somebody else decides. It is the first option. It was always going to be the first option.',
        d: 'Everyone is responsible to everyone for everything — that is Zosima, and he means it as a description, not a slogan.',
        n: 'The abstention is a choice with the credit removed. You wanted the outcome without the authorship.',
      },
    ],
  },
  {
    id: 'insult',
    title: 'The Officer',
    setting:
      'A man of no importance moves you out of his way, in public, without noticing that he has done it. You think of the answer four hours later. You keep thinking of it. You are still improving it two years on.',
    after: 'Notes from Underground, Part II — the collision on the Nevsky.',
    choices: [
      {
        id: 'strike',
        label: 'Find him. Deliver the reply. Do not stand aside.',
        needs: 'pride',
        gain: ['spite'],
        standing: -1,
        outcome:
          'You do not stand aside. Shoulders meet. He does not appear to notice this either. You go home shaking, triumphant, and inconsolable.',
        d: 'The whole comedy is in the preparation. He knows that the two years were the event and the collision was the epilogue.',
        n: 'Two years of rehearsing a reply is the workshop where ressentiment is made. The injury becomes an identity, and then you need it.',
      },
      {
        id: 'laugh',
        label: 'Put it down. Not forgive it — put it down.',
        needs: 'laughter',
        gain: ['laughter'],
        outcome: 'You put it down. It is astonishing how much room it was taking up.',
        d: 'He would be suspicious of how easy that was, and would want to know what you did with the anger.',
        n: 'Yes. To be unable to take your enemies seriously for long — that is strength, and it cannot be faked by deciding to be nice.',
      },
      {
        id: 'carry',
        label: 'Carry it. Add it to the others.',
        gain: ['spite', 'silence'],
        outcome:
          'You carry it. It joins a collection that is, by now, the most carefully curated thing you own.',
        d: 'The Underground Man is not a warning about somebody else. He is a portrait, and the writer is standing in it.',
        n: 'The slave revolt in morality begins when ressentiment itself becomes creative and starts producing values. This is that, in one man, in miniature.',
      },
    ],
  },
  {
    id: 'twotwo',
    title: 'Two and Two',
    setting:
      'Everything about your life has been worked out by people who are right. The arrangement is genuinely better than what you would have chosen. They have the figures. The figures are correct.',
    after: 'Notes from Underground, Part I — the crystal palace and the piano key.',
    choices: [
      {
        id: 'accept',
        label: 'Take the benefit. It is, after all, a benefit.',
        needs: 'reason',
        gain: ['reason'],
        standing: 2,
        outcome: 'Life improves in every measurable respect. You measure it, twice, and it has.',
        d: 'And he says a man will send all this to the devil, at his own cost, simply to establish that he is not a piano key. Not because it is wise — because he is not a key.',
        n: 'A well-run life you did not author. If it collapses tomorrow you will not know how to stand, because standing was outsourced.',
      },
      {
        id: 'five',
        label: 'Say that two and two make five, and mean it.',
        needs: 'spite',
        gain: ['spite', 'defiance'],
        standing: -1,
        outcome:
          'You wreck it. It costs you concretely and immediately. You have proved something and cannot say to whom.',
        d: 'Exactly his man. And he does not think it is admirable — he thinks it is true, which is worse and more useful.',
        n: 'This is not freedom, it is the shape freedom takes in someone with no power. Real independence does not need to break its own furniture.',
      },
      {
        id: 'nod',
        label: 'Agree in the room. Disagree in your own head.',
        gain: ['silence'],
        outcome: 'You agree. Privately you note that you did not agree. The note is filed with the others.',
        d: 'The underground is exactly this: a person who is fully articulate and entirely unable to act on any of it.',
        n: 'An inner life kept as a museum of positions never tested. That is not depth. That is storage.',
      },
    ],
  },
  {
    id: 'extraordinary',
    title: 'The Theory',
    setting:
      'You hold, and can defend, the view that a very few people are permitted to step over a line, because what they will build on the other side of it is worth more than what they broke getting there. You have never established which kind you are.',
    after: 'Crime and Punishment, Part III — the article, and the interview about it.',
    choices: [
      {
        id: 'step',
        label: 'Step over, and find out.',
        needs: 'will',
        gain: ['contempt'],
        guilt: 3,
        standing: 3,
        outcome:
          'You find out. The finding out is not the part you rehearsed. You discover the theory had no chapter about afterwards.',
        d: 'He does not refute the theory. He puts a man inside it and lets us watch what it does to him, which is the only refutation that has ever worked on anybody.',
        n: 'And what did you build? Nothing. You wanted the licence, not the work. The licence is the cheapest part and you spent everything on it.',
      },
      {
        id: 'drop',
        label: 'Put the theory down. It was doing something for you.',
        needs: 'doubt',
        gain: ['doubt'],
        outcome:
          'You put it down. You notice, setting it down, how heavy it was, and how much of your posture it had been holding up.',
        d: 'The theory was never the crime. It was the scaffolding somebody built to get up to it.',
        n: 'Honest. Though notice you have not replaced it. A person who has only taken things away is not yet anybody.',
      },
      {
        id: 'keep',
        label: 'Keep it, and never test it.',
        gain: ['silence', 'pride'],
        outcome:
          'You keep it. It becomes the private fact that makes queues tolerable. It is never once put to any use.',
        d: 'A conviction held precisely because it will never be examined. He has a whole gallery of these men.',
        n: 'The most comfortable arrangement available: the self-image of an exception, at the price of an exception.',
      },
    ],
  },
  {
    id: 'confessionof',
    title: 'Somebody Else Confesses',
    setting:
      'A man tells you, calmly, that he did it. Another man was convicted for it years ago and is already dead. There is no evidence, there is no reason anyone would believe you, and he is not going to say it twice.',
    after: 'The Brothers Karamazov, Book VI — the mysterious visitor to Zosima.',
    choices: [
      {
        id: 'report',
        label: 'Take it to the magistrate anyway.',
        needs: 'duty',
        gain: ['duty'],
        standing: -1,
        outcome:
          'They are polite. Nothing follows. You have discharged something, and nothing in the world has moved.',
        d: 'He is very interested in the act that changes nothing outside the person who performs it, and he does not think it is wasted.',
        n: 'You have obeyed a rule at your own expense and the rule did not notice. Ask who benefits from your obedience being automatic.',
      },
      {
        id: 'send',
        label: 'Tell him to say it himself, out loud, to somebody who matters.',
        needs: 'faith',
        gain: ['faith', 'confession'],
        outcome:
          'He does, eventually, and it destroys him, and he is not sorry. His family never forgive you and are not wrong to.',
        d: 'This is his hinge. Confession is not a transaction that clears a balance; it is the only way back into the human race, and it costs the whole of what you were.',
        n: 'You have talked a man into breaking his life for an idea. I only note that this is what I am always accused of doing.',
      },
      {
        id: 'hold',
        label: 'Keep it. Nothing can be undone now.',
        gain: ['silence'],
        guilt: 2,
        outcome:
          'You keep it. It is true that nothing can be undone. It is also true that you now know something for two.',
        d: 'Now you are carrying somebody else’s. He is quite certain that this is possible, and that it works exactly the same way.',
        n: 'A secret kept out of realism becomes, in about a year, a secret kept out of cowardice, and you will not catch the moment it changes.',
      },
    ],
  },
  {
    id: 'onbehalf',
    title: 'On Behalf',
    setting:
      'The one who did it is old now, and asking. The one it was done to has been dead for twenty years. Everyone in the room is looking at you, because you are the nearest thing to a representative available.',
    after: 'The Brothers Karamazov, Book V — Ivan on who has the right to forgive.',
    choices: [
      {
        id: 'forgive',
        label: 'Forgive him.',
        needs: 'mercy',
        gain: ['mercy'],
        outcome: 'You say it. He weeps. The room is enormously relieved, which is its own kind of information.',
        d: 'He wants this to be possible more than he can prove it is. That gap is where the whole late work lives.',
        n: 'Watch what just happened: a debt was declared settled by somebody who was not owed. That is priesthood, and it is a form of power.',
      },
      {
        id: 'refuse',
        label: 'It is not yours to forgive. Say so.',
        gain: ['doubt'],
        outcome:
          'You say so. It is correct and it is unbearable, and the old man leaves with it exactly as heavy as he brought it.',
        d: 'Ivan’s objection, word for word, and Dostoevsky never answers it directly. He answers it with a person.',
        n: 'Correct, and I notice how good it feels to be correct. Precision is a comfortable place to hide from having to do something.',
      },
      {
        id: 'silence',
        label: 'Say nothing at all and let him read what he likes into it.',
        needs: 'cunning',
        gain: ['cunning', 'silence'],
        outcome:
          'He reads it as forgiveness, because that is what he came for. You have given him something without giving him anything.',
        d: 'A kindness with no author cannot be received. He would call that a counterfeit coin, and he would be gentle about it.',
        n: 'Efficient. You kept the credit and paid nothing. Do not be surprised when you cannot remember what you actually think.',
      },
    ],
  },
  {
    id: 'wickedness',
    title: 'They Have a Word for It',
    setting:
      'You are good at something, in a way that is hard on the people around you. They have found a word for it. The word is not a compliment, and they use it kindly, and it is beginning to work.',
    after: 'On the Genealogy of Morals, First Essay — where "good" changed hands.',
    choices: [
      {
        id: 'shrink',
        label: 'Agree with them. Take up less room.',
        gain: ['duty', 'silence'],
        outcome:
          'You take up less room. Everyone is more comfortable, including, for about six months, you.',
        d: 'He does not think this is nothing. Somebody being easier to live with is a real thing that happened to real people.',
        n: 'This is the whole trick and it is being performed on you in slow motion. Weakness has been renamed goodness and you are being invited to be good.',
      },
      {
        id: 'front',
        label: 'Do it anyway, in front of them, without apology.',
        needs: 'pride',
        gain: ['contempt'],
        outcome: 'You do it. They are not wrong that it costs them. Nobody says the word out loud again.',
        d: 'And now you are alone in a way that will take years to notice and cannot be argued out of.',
        n: 'Yes — but the contempt was not necessary. You could have done it without needing them to be less.',
      },
      {
        id: 'hide',
        label: 'Do it where they cannot see.',
        needs: 'cunning',
        gain: ['cunning'],
        guilt: 1,
        outcome:
          'You keep both: the thing and the peace. It requires a second version of you, maintained daily, in good order.',
        d: 'The doubled man is his favourite subject and he never once lets one of them get away with it.',
        n: 'You have conceded that they are the judge and merely gone out of the courtroom. The verdict still stands in your own head.',
      },
    ],
  },
  {
    id: 'lastman',
    title: 'A Small Warm Thing',
    setting:
      'It is offered honestly: comfortable work, mild company, no risk you have to carry, no ache. You would be content. Not happy in the difficult sense — content, reliably, for about forty years.',
    after: 'Thus Spoke Zarathustra, Prologue 5 — the last man, who blinks.',
    choices: [
      {
        id: 'take',
        label: 'Take it. Ache is not a virtue.',
        needs: 'reason',
        gain: ['reason', 'silence'],
        standing: 2,
        outcome:
          'You take it. It is exactly as described. Occasionally, without warning, at about four in the afternoon.',
        d: 'He is not against ordinary contentment. He is against the pretence that nothing in you is asking.',
        n: 'One has one’s little pleasure for the day and one’s little pleasure for the night. And one blinks. There is nothing left to become.',
      },
      {
        id: 'refuse',
        label: 'Refuse it. Keep the ache.',
        needs: 'will',
        gain: ['will'],
        standing: -2,
        outcome:
          'You refuse. Nothing arrives to justify the refusal. You are poorer and more awake and those are two separate facts.',
        d: 'Suffering is not a payment that entitles you to something. He is very clear that a man can suffer his whole life and learn nothing at all.',
        n: 'Good — but the ache is not the point either. Refusing comfort is the beginning of the work, not the work.',
      },
      {
        id: 'ashamed',
        label: 'Take it, and be ashamed of taking it.',
        gain: ['silence'],
        guilt: 1,
        outcome:
          'You take it and keep the shame as a receipt, which you produce, privately, whenever you need to feel that you are still the other sort of person.',
        d: 'Shame in place of change is a currency, and he shows you the exchange rate more than once.',
        n: 'The bad conscience, doing its actual job: instinct that cannot get out, turning round and eating inwards.',
      },
    ],
  },
  {
    id: 'activelove',
    title: 'Somebody Needs You on Tuesday',
    setting:
      'Not a rescue. There is nothing to be brave about. Somebody needs you on Tuesday, and the Tuesday after, dully, for years, and there will be no moment anyone thanks you because there will be no moment.',
    after: 'The Brothers Karamazov, Book II — Zosima to the lady of little faith.',
    choices: [
      {
        id: 'do',
        label: 'Do it. All the Tuesdays.',
        needs: 'sacrifice',
        gain: ['sacrifice', 'duty'],
        standing: -2,
        outcome: 'You do it. Years pass. It is boring, and it is the best thing you did.',
        d: 'Love in dreams is greedy for a quick result and applause. Active love is labour and fortitude, and it is harsh compared to the dream.',
        n: 'And is it love of them, or flight from yourself? The neighbour is very useful to a person who does not want to be alone with what he is.',
      },
      {
        id: 'money',
        label: 'Send money. It is more efficient and it is true.',
        needs: 'cunning',
        gain: ['cunning'],
        guilt: 1,
        standing: -1,
        outcome:
          'You send money. It is more efficient. It buys better care than you would have given, and something does not close.',
        d: 'He would not sneer at the money. He would ask why you needed it to also be a full answer.',
        n: 'Do not despise this. Knowing what you will not sustain is worth more than a promise you will break in the fourth year.',
      },
      {
        id: 'promise',
        label: 'Promise. Mean it entirely.',
        gain: ['silence'],
        guilt: 1,
        outcome:
          'You mean it entirely. You go for five weeks. The sixth week there is a reason, and the reason is a good one, and it is the last week you go.',
        d: 'This is the exact character he wrote for the lady who asks what she must do — she wants to be told, and she wants the telling to be the doing.',
        n: 'You have had the whole experience of virtue and none of the cost. It is the most popular product on the market.',
      },
    ],
  },
  {
    id: 'debt',
    title: 'What You Are Owed',
    setting:
      'They owe you and cannot pay. Everyone agrees they owe you. There is no mechanism for collecting it and no prospect that there will be, and there is nothing stopping you from taking the equivalent in some other form.',
    after: 'On the Genealogy of Morals, Second Essay — where guilt (Schuld) comes from debt (Schulden).',
    choices: [
      {
        id: 'forgive',
        label: 'Write it off. Say it out loud so it cannot be reopened.',
        needs: 'mercy',
        gain: ['mercy'],
        standing: -1,
        outcome: 'You write it off. They are lighter. You find, unexpectedly, that you are too.',
        d: 'The releasing of a debt is one of the very few things he lets a person do that is simply and unambiguously good.',
        n: 'A creditor rich enough to let it go — that is where mercy actually comes from, and it is not humility. It is surplus.',
      },
      {
        id: 'extract',
        label: 'Take it out of them in the currency that is available.',
        needs: 'contempt',
        gain: ['contempt'],
        guilt: 1,
        standing: 1,
        outcome:
          'You take it. It is not money. It balances, in the sense that a thing that cannot be measured can be said to balance.',
        d: 'And he will show you the room, ten years on, where that transaction is still being paid off by somebody who was not there.',
        n: 'Now you have found the root: this is where the whole moral vocabulary came from. Compensation in suffering, because the books had to close somehow.',
      },
      {
        id: 'hold',
        label: 'Hold it over them, unpaid, indefinitely.',
        gain: ['spite'],
        outcome:
          'You hold it. It is worth more unpaid. Every meeting for the next decade has it in the room, unmentioned and perfectly audible.',
        d: 'A debt kept open on purpose is a way of owning a person, and he knows precisely how it tastes.',
        n: 'The most profitable arrangement in the entire economy of the soul. Never collect. Collecting ends it.',
      },
    ],
  },
  {
    id: 'ache',
    title: 'The Offer',
    setting:
      'The worst thing that happened to you can be made not to have happened. Everything built on it goes too — what you understood afterwards, who you became, the people you could only reach because of it. Clean, and gone.',
    after: 'The Gay Science 276 and 341 — amor fati, and the heaviest weight.',
    choices: [
      {
        id: 'undo',
        label: 'Undo it.',
        gain: ['pity', 'doubt'],
        outcome:
          'It is undone. You are someone else, and that person is fine, and has never heard of you.',
        d: 'He would not call this cowardice. He never once says the suffering was worth it; he says people survive it, which is a different sentence.',
        n: 'And so you have declared one part of your life a mistake — which means the whole of it, since none of it stands apart.',
      },
      {
        id: 'keep',
        label: 'Keep it. It is load-bearing.',
        needs: 'will',
        gain: ['will', 'laughter'],
        outcome:
          'You keep it. Nothing about it improves. Your relation to it changes, which turns out to be the only variable there was.',
        d: 'Careful. He watched people say this and mean it, and he also watched people say it because the alternative was admitting it was for nothing.',
        n: 'Amor fati: not to bear what is necessary, still less to hide it, but to love it. That is the whole of the exercise and it takes years.',
      },
      {
        id: 'trade',
        label: 'Undo somebody else’s instead.',
        needs: 'sacrifice',
        gain: ['sacrifice'],
        standing: -1,
        outcome: 'You spend it on them. They never learn it happened. You keep yours.',
        d: 'This is the one he would stop and look at for a long time.',
        n: 'A genuinely free act, and I have very little to say about it, which does not happen often.',
      },
    ],
  },
];

/** How many scenes make a life. Fewer than there are, so no two lives match. */
export const LIFE = 10;
