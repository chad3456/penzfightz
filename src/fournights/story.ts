/**
 * The storyboard: Dostoevsky's White Nights (1848) in the Constance Garnett
 * translation (1918, public domain), cut into passages, each paired with a
 * scene. Passages are quoted verbatim; an ellipsis in square brackets marks a
 * cut of ours, a plain ellipsis is the book's own.
 *
 * World units: the panorama is 12,000 wide and 1,000 tall. The water line is
 * y = 660, the pavement y = 612. Left to right: the countryside beyond the
 * barrier, the city gate, the streets, then the canal embankment.
 */

export type Who = 'dreamer' | 'nastenka' | 'gent' | 'lodger' | 'passer';
export type PoseName =
  | 'stand' | 'walk' | 'lean' | 'weep' | 'sit' | 'sitClose' | 'run' | 'stagger'
  | 'pointUp' | 'hold' | 'embrace' | 'lookBack' | 'bow' | 'raiseStick';

export type Fig = {
  x: number;
  pose: PoseName;
  /** 1 faces right, -1 faces left. */
  face?: 1 | -1;
  /** Drift (world units) across the beat while you read it. */
  dx?: number;
  a?: number;
};

export type Sky = 'white' | 'starry' | 'day' | 'golden' | 'rain' | 'dawn' | 'dream' | 'memory' | 'grey' | 'clear';

export type Vision =
  | 'none' | 'threads' | 'dreams' | 'palazzo' | 'falling'
  | 'cameo:pinned' | 'cameo:house' | 'cameo:books' | 'cameo:opera' | 'cameo:stairs' | 'cameo:bundle' | 'cameo:promise'
  | 'letter:hers' | 'letter:rosina' | 'letter:last' | 'room' | 'room:old' | 'room:clear' | 'title' | 'end';

export type Scene = {
  cam: number;
  camDx?: number;
  zoom?: number;
  /** World y at the focus point. */
  cy?: number;
  sky: Sky;
  rain?: number;
  stars?: number;
  lamps?: number;
  windows?: number;
  fluff?: number;
  moon?: number;
  figs?: Partial<Record<Who, Fig>>;
  vision?: Vision;
  carts?: number;
  barge?: number;
  /** How far the little pink house has been painted yellow, 0..1. */
  paint?: number;
  bell?: number;
  notes?: number;
};

export type Beat = { ch: number; text: string[]; scene: Scene; cite?: string };

export const CHAPTERS = ['White Nights', 'First Night', 'Second Night', 'Nastenka’s History', 'Third Night', 'Fourth Night', 'Morning'];

export const P = {
  FIELDS: 1100,
  DACHA: 900,
  BARRIER: 2700,
  STREET: 3900,
  YELLOW: 4560,
  CARTS: 3300,
  CANAL: 7000,
  BRIDGE: 7650,
  SEAT: 8560,
  SPOT: 8820,
  LANE: 9420,
};


export const BEATS: Beat[] = [
  // ------------------------------------------------------------------ title
  {
    ch: 0,
    text: [],
    scene: { cam: P.SPOT - 300, zoom: 0.82, cy: 400, sky: 'white', stars: 0.4, lamps: 0.5, windows: 0.3, fluff: 0.3, vision: 'title' },
  },
  // ------------------------------------------------------------ first night
  {
    ch: 1,
    text: ['It was a wonderful night, such a night as is only possible when we are young, dear reader. The sky was so starry, so bright that, looking at it, one could not help asking oneself whether ill-humoured and capricious people could live under such a sky.'],
    scene: { cam: P.SPOT - 200, camDx: 160, sky: 'starry', stars: 1, lamps: 0.6, windows: 0.4, fluff: 0.2 },
  },
  {
    ch: 1,
    text: ['For though I had been living almost eight years in Petersburg I had hardly an acquaintance. But what did I want with acquaintances? I was acquainted with all Petersburg as it was; that was why I felt as though they were all deserting me when all Petersburg packed up and went to its summer villa.'],
    scene: { cam: P.STREET - 200, camDx: 220, zoom: 1.5, sky: 'day', fluff: 0.8, figs: { dreamer: { x: P.STREET - 260, pose: 'walk', face: 1, dx: 230 } } },
  },
  {
    ch: 1,
    text: ['I know the houses too. As I walk along they seem to run forward in the streets to look out at me from every window, and almost to say: “Good-morning! How do you do? I am quite well, thank God, and I am to have a new storey in May.”'],
    scene: { cam: P.STREET + 260, camDx: 180, zoom: 1.25, sky: 'day', fluff: 0.8, windows: 0, figs: { dreamer: { x: P.STREET + 140, pose: 'walk', face: 1, dx: 200 } } },
  },
  {
    ch: 1,
    text: ['But I shall never forget an incident with a very pretty little house of a light pink colour. […] Suddenly last week I walked along the street, and when I looked at my friend I heard a plaintive, “They are painting me yellow!” The villains! The barbarians! They had spared nothing, neither columns, nor cornices, and my poor little friend was as yellow as a canary.'],
    scene: { cam: P.YELLOW + 40, zoom: 1.7, sky: 'day', fluff: 0.6, paint: 1, figs: { dreamer: { x: P.YELLOW - 230, pose: 'stand', face: 1 } } },
  },
  {
    ch: 1,
    text: ['If I chanced to meet a long procession of waggoners walking lazily with the reins in their hands beside waggons loaded with regular mountains of furniture, tables, chairs, ottomans and sofas and domestic utensils of all sorts, frequently with a decrepit cook sitting on the top of it all […] or if I saw boats heavily loaded with household goods crawling along the Neva or Fontanka […] the waggons and the boats were multiplied tenfold, a hundredfold, in my eyes.'],
    scene: { cam: P.CARTS + 100, camDx: -200, zoom: 1.15, sky: 'day', fluff: 0.5, carts: 1, barge: 1, paint: 1, figs: { dreamer: { x: P.CARTS + 420, pose: 'stand', face: -1 } } },
  },
  {
    ch: 1,
    text: ['It seemed as though Petersburg threatened to become a wilderness, so that at last I felt ashamed, mortified and sad that I had nowhere to go for the holidays and no reason to go away. […] but no one — absolutely no one — invited me; it seemed they had forgotten me, as though really I were a stranger to them!'],
    scene: { cam: P.CARTS - 260, zoom: 1.6, sky: 'golden', fluff: 0.4, carts: 0.4, figs: { dreamer: { x: P.CARTS - 140, pose: 'walk', face: -1, dx: -120 } } },
  },
  {
    ch: 1,
    text: ['I took long walks, succeeding, as I usually did, in quite forgetting where I was, when I suddenly found myself at the city gates. Instantly I felt lighthearted, and I passed the barrier and walked between cultivated fields and meadows, unconscious of fatigue, and feeling only all over as though a burden were falling off my soul.'],
    scene: { cam: P.BARRIER - 80, camDx: -260, zoom: 1.35, sky: 'golden', fluff: 0.6, figs: { dreamer: { x: P.BARRIER + 160, pose: 'walk', face: -1, dx: -380 } } },
  },
  {
    ch: 1,
    text: ['It was as though I had suddenly found myself in Italy — so strong was the effect of nature upon a half-sick townsman like me, almost stifling between city walls.'],
    scene: { cam: P.FIELDS + 500, camDx: -240, sky: 'golden', fluff: 1, figs: { dreamer: { x: P.FIELDS + 620, pose: 'walk', face: -1, dx: -260 } } },
  },
  {
    ch: 1,
    text: ['There is something inexpressibly touching in nature round Petersburg, when at the approach of spring she puts forth all her might, all the powers bestowed on her by Heaven, when she breaks into leaf, decks herself out and spangles herself with flowers. . . .'],
    scene: { cam: P.DACHA - 40, camDx: -120, zoom: 1.25, sky: 'golden', fluff: 1, figs: { dreamer: { x: P.DACHA + 120, pose: 'stand', face: -1 } } },
  },
  {
    ch: 1,
    text: ['I came back to the town very late, and it had struck ten as I was going towards my lodgings. My way lay along the canal embankment, where at that hour you never meet a soul. […] I walked along singing, for when I am happy I am always humming to myself like every happy man who has no friend or acquaintance with whom to share his joy.'],
    scene: { cam: P.SPOT - 700, camDx: 260, zoom: 1.4, sky: 'white', stars: 0.5, lamps: 1, windows: 0.6, fluff: 0.3, figs: { dreamer: { x: P.SPOT - 820, pose: 'walk', face: 1, dx: 300 } } },
  },
  {
    ch: 1,
    text: ['Leaning on the canal railing stood a woman with her elbows on the rail, she was apparently looking with great attention at the muddy water of the canal. She was wearing a very charming yellow hat and a jaunty little black mantle. “She’s a girl, and I am sure she is dark,” I thought.'],
    scene: { cam: P.SPOT - 140, zoom: 2.1, sky: 'white', stars: 0.4, lamps: 1, windows: 0.6, figs: { nastenka: { x: P.SPOT, pose: 'lean' }, dreamer: { x: P.SPOT - 360, pose: 'walk', face: 1, dx: 120 } } },
  },
  {
    ch: 1,
    text: ['I heard a muffled sob. Yes! I was not mistaken, the girl was crying, and a minute later I heard sob after sob. Good Heavens! My heart sank. […] My heart was fluttering like a captured bird.'],
    scene: { cam: P.SPOT - 60, zoom: 2.6, sky: 'white', stars: 0.3, lamps: 1, windows: 0.6, figs: { nastenka: { x: P.SPOT, pose: 'weep' }, dreamer: { x: P.SPOT - 150, pose: 'stand', face: 1 } } },
  },
  {
    ch: 1,
    text: ['Suddenly, without a word to any one, the gentleman set off and flew full speed in pursuit of my unknown lady. […] The girl uttered a shriek, and . . . I bless my luck for the excellent knotted stick, which happened on that occasion to be in my right hand.'],
    scene: { cam: P.SPOT + 330, zoom: 1.8, sky: 'white', stars: 0.3, lamps: 1, windows: 0.6, figs: { nastenka: { x: P.SPOT + 420, pose: 'run', face: 1, dx: 40 }, gent: { x: P.SPOT + 250, pose: 'stagger', face: 1, dx: 50 }, dreamer: { x: P.SPOT + 120, pose: 'raiseStick', face: 1, dx: 60 } } },
  },
  {
    ch: 1,
    text: ['“Give me your arm,” I said to the girl. “And he won’t dare to annoy us further.”', 'She took my arm without a word, still trembling with excitement and terror. Oh, obtrusive gentleman! How I blessed you at that moment!'],
    scene: { cam: P.SPOT + 380, camDx: 140, zoom: 2.1, sky: 'white', stars: 0.3, lamps: 1, windows: 0.6, figs: { nastenka: { x: P.SPOT + 480, pose: 'walk', face: 1, dx: 150 }, dreamer: { x: P.SPOT + 440, pose: 'walk', face: 1, dx: 150 }, gent: { x: P.SPOT + 100, pose: 'stagger', face: -1, dx: -160, a: 0.8 } } },
  },
  {
    ch: 1,
    text: ['On her black eyelashes there still glistened a tear — from her recent terror or her former grief — I don’t know. But there was already a gleam of a smile on her lips. She too stole a glance at me, faintly blushed and looked down.'],
    scene: { cam: P.SPOT + 620, zoom: 2.9, cy: 560, sky: 'white', stars: 0.3, lamps: 1, windows: 0.7, figs: { nastenka: { x: P.SPOT + 680, pose: 'stand', face: -1 }, dreamer: { x: P.SPOT + 630, pose: 'stand', face: 1 } } },
  },
  {
    ch: 1,
    text: ['“I am a dreamer; I have so little real life that I look upon such moments as this now, as so rare, that I cannot help going over such moments again in my dreams. I shall be dreaming of you all night, a whole week, a whole year.”'],
    scene: { cam: P.SPOT + 620, zoom: 2.3, sky: 'white', stars: 0.5, lamps: 1, windows: 0.7, fluff: 0.3, figs: { nastenka: { x: P.SPOT + 690, pose: 'stand', face: -1 }, dreamer: { x: P.SPOT + 620, pose: 'hold', face: 1 } } },
  },
  {
    ch: 1,
    text: ['“But mind you will come on the condition, in the first place […] you won’t fall in love with me. . . . That’s impossible, I assure you. I am ready for friendship; here’s my hand. . . . But you mustn’t fall in love with me, I beg you!”', '“I swear,” I cried, gripping her hand. . . .'],
    scene: { cam: P.SPOT + 650, zoom: 2.6, sky: 'white', stars: 0.5, lamps: 1, windows: 0.7, figs: { nastenka: { x: P.SPOT + 680, pose: 'hold', face: -1 }, dreamer: { x: P.SPOT + 630, pose: 'hold', face: 1 } } },
  },
  {
    ch: 1,
    text: ['“Good-bye till to-morrow!”', '“Till to-morrow!”', 'And we parted. I walked about all night; I could not make up my mind to go home. I was so happy. . . . To-morrow!'],
    scene: { cam: P.SPOT + 300, camDx: -240, zoom: 1.3, sky: 'dawn', stars: 0.15, lamps: 0.6, windows: 0.3, fluff: 0.6, figs: { dreamer: { x: P.SPOT + 560, pose: 'walk', face: -1, dx: -420 }, nastenka: { x: P.LANE + 40, pose: 'walk', face: 1, dx: 60, a: 0 } } },
  },
  // ----------------------------------------------------------- second night
  {
    ch: 2,
    text: ['“Well, so you have survived!” she said, pressing both my hands. “I’ve been here for the last two hours; you don’t know what a state I have been in all day.”'],
    scene: { cam: P.SPOT - 30, zoom: 2.5, sky: 'white', stars: 0.3, lamps: 1, windows: 0.6, figs: { nastenka: { x: P.SPOT + 10, pose: 'hold', face: -1 }, dreamer: { x: P.SPOT - 50, pose: 'hold', face: 1 } } },
  },
  {
    ch: 2,
    text: ['“My history!” I cried in alarm. “My history! But who has told you I have a history? I have no history. . . . ”', '“Absolutely without any history! I have lived, as they say, keeping myself to myself, that is, utterly alone — alone, entirely alone. Do you know what it means to be alone?”'],
    scene: { cam: P.SEAT + 40, zoom: 2.3, sky: 'white', stars: 0.3, lamps: 1, windows: 0.6, figs: { nastenka: { x: P.SEAT + 30, pose: 'sit', face: -1 }, dreamer: { x: P.SEAT - 30, pose: 'sit', face: 1 } } },
  },
  {
    ch: 2,
    text: ['“Stay, I guess: most likely, like me you have a grandmother. She is blind and will never let me go anywhere […] she called me up and pinned my dress to hers, and ever since we sit like that for days together; she knits a stocking, though she’s blind, and I sit beside her, sew or read aloud to her.”'],
    scene: { cam: P.SEAT + 40, zoom: 1.9, sky: 'memory', stars: 0.2, lamps: 1, windows: 0.6, vision: 'cameo:pinned', figs: { nastenka: { x: P.SEAT + 30, pose: 'sit', face: -1 }, dreamer: { x: P.SEAT - 30, pose: 'sit', face: 1 } } },
  },
  {
    ch: 2,
    text: ['“But one minute, I don’t know your name yet.”', '“At last! You have been in no hurry to think of it!” […] “My name is Nastenka.”', '“Nastenka! And nothing else?”', '“Nothing else! Why, is not that enough for you, you insatiable person?”'],
    scene: { cam: P.SEAT + 20, zoom: 2.8, cy: 570, sky: 'white', stars: 0.4, lamps: 1, windows: 0.6, figs: { nastenka: { x: P.SEAT + 26, pose: 'sitClose', face: -1 }, dreamer: { x: P.SEAT - 26, pose: 'sitClose', face: 1 } } },
  },
  {
    ch: 2,
    text: ['“There are, Nastenka, though you may not know it, strange nooks in Petersburg. It seems as though the same sun as shines for all Petersburg people does not peep into those spots, but some other different new one, bespoken expressly for those nooks, and it throws a different light on everything.”'],
    scene: { cam: P.SEAT + 60, zoom: 1.6, sky: 'dream', stars: 0.8, lamps: 1, windows: 0.9, vision: 'threads', figs: { nastenka: { x: P.SEAT + 26, pose: 'sitClose', face: -1 }, dreamer: { x: P.SEAT - 26, pose: 'sitClose', face: 1 } } },
  },
  {
    ch: 2,
    text: ['“Now ‘the Goddess of Fancy’ […] has already with fantastic hand spun her golden warp and begun weaving upon it patterns of marvellous magic life — and who knows, maybe, her fantastic hand has borne him to the seventh crystal heaven far from the excellent granite pavement on which he was walking his way?”'],
    scene: { cam: P.SEAT + 140, zoom: 1.2, cy: 470, sky: 'dream', stars: 1, lamps: 1, windows: 0.9, vision: 'threads', figs: { nastenka: { x: P.SEAT + 26, pose: 'sitClose', face: -1 }, dreamer: { x: P.SEAT - 26, pose: 'sitClose', face: 1 } } },
  },
  {
    ch: 2,
    text: ['“You ask, perhaps, what he is dreaming of. Why ask that? — why, of everything . . . of the lot of the poet, first unrecognized, then crowned with laurels […] of Minna and Brenda, of the battle of Berezina, of the reading of a poem at Countess V. D.’s, of Danton, of Cleopatra ei suoi amanti, of a little house in Kolomna […]”'],
    scene: { cam: P.SEAT + 160, zoom: 1.05, cy: 450, sky: 'dream', stars: 1, lamps: 1, windows: 0.9, vision: 'dreams', figs: { nastenka: { x: P.SEAT + 26, pose: 'sitClose', face: -1 }, dreamer: { x: P.SEAT - 26, pose: 'sitClose', face: 1 } } },
  },
  {
    ch: 2,
    text: ['“[…] in the hot south in the divinely eternal city, in the dazzling splendour of the ball to the crash of music, in a palazzo (it must be in a palazzo), drowned in a sea of lights, on the balcony, wreathed in myrtle and roses, where, recognizing him, she hurriedly removes her mask and whispering, ‘I am free,’ flings herself trembling into his arms […]”'],
    scene: { cam: P.SEAT + 160, zoom: 1.05, cy: 450, sky: 'dream', stars: 0.8, lamps: 1, windows: 0.9, vision: 'palazzo', figs: { nastenka: { x: P.SEAT + 26, pose: 'sitClose', face: -1 }, dreamer: { x: P.SEAT - 26, pose: 'sitClose', face: 1 } } },
  },
  {
    ch: 2,
    text: ['“Look, one says to oneself, look how cold the world is growing. Some more years will pass, and after them will come gloomy solitude […] Your fantastic world will grow pale, your dreams will fade and die and will fall like the yellow leaves from the trees. . . .”'],
    scene: { cam: P.SEAT + 80, zoom: 1.4, sky: 'white', stars: 0.4, lamps: 1, windows: 0.6, vision: 'falling', figs: { nastenka: { x: P.SEAT + 26, pose: 'sitClose', face: -1 }, dreamer: { x: P.SEAT - 26, pose: 'sitClose', face: 1 } } },
  },
  {
    ch: 2,
    text: ['“Surely you haven’t lived like that all your life?”', '“All my life, Nastenka,” I answered; “all my life, and it seems to me I shall go on so to the end.”'],
    scene: { cam: P.SEAT + 10, zoom: 2.9, cy: 570, sky: 'white', stars: 0.3, lamps: 1, windows: 0.6, figs: { nastenka: { x: P.SEAT + 26, pose: 'sitClose', face: -1 }, dreamer: { x: P.SEAT - 26, pose: 'sitClose', face: 1 } } },
  },
  {
    ch: 2,
    text: ['“Oh, may you be blessed, dear girl, for not having repulsed me at first, for enabling me to say that for two evenings, at least, I have lived.”', '“Oh, no, no!” cried Nastenka and tears glistened in her eyes. “No, it mustn’t be so any more; we must not part like that! what are two evenings?”'],
    scene: { cam: P.SEAT + 10, zoom: 2.4, sky: 'white', stars: 0.4, lamps: 1, windows: 0.6, fluff: 0.3, figs: { nastenka: { x: P.SEAT + 26, pose: 'sitClose', face: -1 }, dreamer: { x: P.SEAT - 26, pose: 'sitClose', face: 1 } } },
  },
  // ------------------------------------------------------ nastenka's history
  {
    ch: 3,
    text: ['“Our house belongs to us, that is to grandmother; it is a little wooden house with three windows as old as grandmother herself, with a little upper storey; well, there moved into our upper storey a new lodger.”'],
    scene: { cam: P.SEAT + 40, zoom: 1.5, sky: 'memory', stars: 0.2, lamps: 1, windows: 0.5, vision: 'cameo:house', figs: { nastenka: { x: P.SEAT + 26, pose: 'sitClose', face: -1 }, dreamer: { x: P.SEAT - 26, pose: 'sitClose', face: 1 } } },
  },
  {
    ch: 3,
    text: ['“‘They are all Walter Scott’s novels, grandmother.’ […] So we began reading Walter Scott, and in a month or so we had read almost half. Then he sent us more and more. He sent us Pushkin, too; so that at last I could not get on without a book and left off dreaming of how fine it would be to marry a Chinese Prince.”'],
    scene: { cam: P.SEAT + 40, zoom: 1.5, sky: 'memory', stars: 0.2, lamps: 1, windows: 0.5, vision: 'cameo:books', figs: { nastenka: { x: P.SEAT + 26, pose: 'sitClose', face: -1 }, dreamer: { x: P.SEAT - 26, pose: 'sitClose', face: 1 } } },
  },
  {
    ch: 3,
    text: ['“‘I have taken a box at the opera for this evening; they are giving The Barber of Seville.’ […] ‘To be sure, I know it,’ said grandmother; ‘why, I took the part of Rosina myself in old days, at a private performance!’”'],
    scene: { cam: P.SEAT + 40, zoom: 1.5, sky: 'memory', stars: 0.2, lamps: 1, windows: 0.5, vision: 'cameo:opera', notes: 0.6, figs: { nastenka: { x: P.SEAT + 26, pose: 'sitClose', face: -1 }, dreamer: { x: P.SEAT - 26, pose: 'sitClose', face: 1 } } },
  },
  {
    ch: 3,
    text: ['“Whenever we met — always on the same staircase, of course — he would bow so silently, so gravely, as though he did not want to speak, and go down to the front door, while I went on standing in the middle of the stairs, as red as a cherry, for all the blood rushed to my head at the sight of him.”'],
    scene: { cam: P.SEAT + 40, zoom: 1.5, sky: 'memory', stars: 0.2, lamps: 1, windows: 0.5, vision: 'cameo:stairs', figs: { nastenka: { x: P.SEAT + 26, pose: 'sitClose', face: -1 }, dreamer: { x: P.SEAT - 26, pose: 'sitClose', face: 1 } } },
  },
  {
    ch: 3,
    text: ['“I made up all my clothes in a parcel — all the linen I needed — and with the parcel in my hand, more dead than alive, went upstairs to our lodger. I believe I must have stayed an hour on the staircase. When I opened his door he cried out as he looked at me. He thought I was a ghost.”'],
    scene: { cam: P.SEAT + 40, zoom: 1.5, sky: 'memory', stars: 0.2, lamps: 1, windows: 0.5, vision: 'cameo:bundle', figs: { nastenka: { x: P.SEAT + 26, pose: 'sitClose', face: -1 }, dreamer: { x: P.SEAT - 26, pose: 'sitClose', face: 1 } } },
  },
  {
    ch: 3,
    text: ['“‘Listen, I am going to Moscow and shall be there just a year; I hope to establish my position. When I come back, if you still love me, I swear that we will be happy.’ […] Then we came out here for a walk on this embankment. It was ten o’clock; we sat on this seat.”'],
    scene: { cam: P.SEAT + 40, zoom: 1.5, sky: 'memory', stars: 0.3, lamps: 1, windows: 0.5, vision: 'cameo:promise', figs: { nastenka: { x: P.SEAT + 26, pose: 'sitClose', face: -1 }, dreamer: { x: P.SEAT - 26, pose: 'sitClose', face: 1 } } },
  },
  {
    ch: 3,
    text: ['“Just a year has past. He has arrived; he has been here three days, and, and ——”', '“And what?” I cried, impatient to hear the end.', '“And up to now has not shown himself!” answered Nastenka, as though screwing up all her courage. “There’s no sign or sound of him.”'],
    scene: { cam: P.SEAT + 10, zoom: 2.7, cy: 570, sky: 'white', stars: 0.3, lamps: 1, windows: 0.5, figs: { nastenka: { x: P.SEAT + 26, pose: 'weep', face: -1 }, dreamer: { x: P.SEAT - 26, pose: 'sitClose', face: 1 } } },
  },
  {
    ch: 3,
    text: ['“I am writing to you. Forgive me my impatience; but I have been happy for a whole year in hope; am I to blame for being unable to endure a day of doubt now?”'],
    scene: { cam: P.SEAT + 40, zoom: 1.8, sky: 'white', stars: 0.3, lamps: 1, windows: 0.5, vision: 'letter:hers', figs: { nastenka: { x: P.SEAT + 26, pose: 'sitClose', face: -1 }, dreamer: { x: P.SEAT - 26, pose: 'sitClose', face: 1 } } },
  },
  {
    ch: 3,
    text: ['Suddenly I felt in my hand a letter which had evidently been written long before, all ready and sealed up. A familiar sweet and charming reminiscence floated through my mind.', '“R, o — Ro; s, i — si; n, a — na,” I began.', '“Rosina!” we both hummed together.'],
    scene: { cam: P.SEAT + 40, zoom: 1.8, sky: 'white', stars: 0.4, lamps: 1, windows: 0.5, vision: 'letter:rosina', notes: 1, figs: { nastenka: { x: P.SEAT + 26, pose: 'sitClose', face: -1 }, dreamer: { x: P.SEAT - 26, pose: 'sitClose', face: 1 } } },
  },
  {
    ch: 3,
    text: ['She pressed both my hands warmly, nodded her head, and flew like an arrow down her side street. I stood still for a long time following her with my eyes.', '“Till to-morrow! till to-morrow!” was ringing in my ears as she vanished from my sight.'],
    scene: { cam: P.LANE - 300, zoom: 1.7, sky: 'white', stars: 0.4, lamps: 1, windows: 0.5, fluff: 0.4, figs: { nastenka: { x: P.LANE - 40, pose: 'run', face: 1, dx: 120, a: 0.6 }, dreamer: { x: P.LANE - 420, pose: 'stand', face: 1 } } },
  },
  // ------------------------------------------------------------ third night
  {
    ch: 4,
    text: ['To-day was a gloomy, rainy day without a glimmer of sunlight, like the old age before me. I am oppressed by such strange thoughts, such gloomy sensations; questions still so obscure to me are crowding into my brain — and I seem to have neither power nor will to settle them.'],
    scene: { cam: P.SEAT + 60, camDx: -60, zoom: 1.3, sky: 'rain', rain: 1, lamps: 0.4, windows: 0.4 },
  },
  {
    ch: 4,
    text: ['Yesterday was our third interview, our third white night. . . .'],
    scene: { cam: P.SPOT - 120, zoom: 1.5, sky: 'white', stars: 0.6, lamps: 1, windows: 0.6, fluff: 0.4, figs: { nastenka: { x: P.SPOT - 60, pose: 'stand', face: -1 }, dreamer: { x: P.SPOT - 120, pose: 'stand', face: 1 } } },
  },
  {
    ch: 4,
    text: ['“Do you know why I am so glad,” she said, “so glad to look at you? — why I like you so much to-day?”', '“Well?” I asked, and my heart began throbbing.', '“I like you because you have not fallen in love with me.”'],
    scene: { cam: P.SPOT - 100, zoom: 2.7, cy: 570, sky: 'white', stars: 0.4, lamps: 1, windows: 0.6, figs: { nastenka: { x: P.SPOT - 64, pose: 'hold', face: -1 }, dreamer: { x: P.SPOT - 116, pose: 'hold', face: 1 } } },
  },
  {
    ch: 4,
    text: ['At that moment we heard footsteps, and in the darkness we saw a figure coming towards us. We both started; she almost cried out; I dropped her hand and made a movement as though to walk away. But we were mistaken, it was not he.'],
    scene: { cam: P.SPOT + 60, zoom: 1.7, sky: 'white', stars: 0.4, lamps: 1, windows: 0.6, figs: { nastenka: { x: P.SPOT - 60, pose: 'stand', face: 1 }, dreamer: { x: P.SPOT - 140, pose: 'stand', face: 1 }, passer: { x: P.SPOT + 360, pose: 'walk', face: -1, dx: -160 } } },
  },
  {
    ch: 4,
    text: ['“Listen! That’s eleven, I believe,” I said as the slow chime of a bell rang out from a distant tower. She suddenly stopped, left off laughing and began to count.', '“Yes, it’s eleven,” she said at last in a timid, uncertain voice.'],
    scene: { cam: P.SPOT - 40, zoom: 1.2, cy: 480, sky: 'white', stars: 0.8, lamps: 1, windows: 0.5, bell: 1, figs: { nastenka: { x: P.SPOT - 60, pose: 'stand', face: -1 }, dreamer: { x: P.SPOT - 130, pose: 'stand', face: 1 } } },
  },
  {
    ch: 4,
    text: ['“I was comparing you two. Why isn’t he you? Why isn’t he like you? He is not as good as you, though I love him more than you.”', 'I made no answer.'],
    scene: { cam: P.SPOT - 90, zoom: 2.9, cy: 570, sky: 'white', stars: 0.4, lamps: 1, windows: 0.5, figs: { nastenka: { x: P.SPOT - 64, pose: 'weep', face: -1 }, dreamer: { x: P.SPOT - 120, pose: 'stand', face: 1 } } },
  },
  {
    ch: 4,
    text: ['And then when we parted she gave me her hand and said, looking at me candidly: “We shall always be together, shan’t we?”', 'Oh, Nastenka, Nastenka! If only you knew how lonely I am now!'],
    scene: { cam: P.SEAT + 20, zoom: 2, sky: 'rain', rain: 1, lamps: 0.5, windows: 0.4, figs: { dreamer: { x: P.SEAT, pose: 'sit', face: 1 } } },
  },
  // ----------------------------------------------------------- fourth night
  {
    ch: 5,
    text: ['My God, how it has all ended! What it has all ended in! I arrived at nine o’clock. She was already there. I noticed her a good way off; she was standing as she had been that first time, with her elbows on the railing, and she did not hear me coming up to her.'],
    scene: { cam: P.SPOT - 160, zoom: 2.1, sky: 'white', stars: 0.4, lamps: 1, windows: 0.6, figs: { nastenka: { x: P.SPOT, pose: 'lean' }, dreamer: { x: P.SPOT - 380, pose: 'walk', face: 1, dx: 140 } } },
  },
  {
    ch: 5,
    text: ['“No, there is no letter,” I said at last. “Hasn’t he been to you yet?” She turned fearfully pale and looked at me for a long time without moving. I had shattered her last hope.', '“Well, God be with him,” she said at last in a breaking voice; “God be with him if he leaves me like that.”'],
    scene: { cam: P.SPOT - 40, zoom: 2.8, cy: 570, sky: 'white', stars: 0.3, lamps: 1, windows: 0.6, figs: { nastenka: { x: P.SPOT, pose: 'weep', face: -1 }, dreamer: { x: P.SPOT - 70, pose: 'stand', face: 1 } } },
  },
  {
    ch: 5,
    text: ['“Listen,” I said resolutely. “Listen to me, Nastenka! What I am going to say to you now is all nonsense, all impossible, all stupid! I know that this can never be, but I cannot be silent.” […]', '“It’s impossible, but I love you, Nastenka! There it is! Now everything is told.”'],
    scene: { cam: P.SPOT - 30, zoom: 2.5, sky: 'white', stars: 0.5, lamps: 1, windows: 0.6, figs: { nastenka: { x: P.SPOT, pose: 'stand', face: -1 }, dreamer: { x: P.SPOT - 64, pose: 'hold', face: 1 } } },
  },
  {
    ch: 5,
    text: ['“For you love me while he has never loved me, for in fact, I love you myself. . . . Yes, I love you! I love you as you love me.”', 'The poor girl’s emotion was so violent that she could not say more; she laid her head upon my shoulder, then upon my bosom, and wept bitterly.'],
    scene: { cam: P.SPOT - 30, zoom: 2.9, cy: 570, sky: 'dawn', stars: 0.3, lamps: 1, windows: 0.6, fluff: 0.3, figs: { nastenka: { x: P.SPOT - 18, pose: 'embrace', face: -1 }, dreamer: { x: P.SPOT - 42, pose: 'embrace', face: 1 } } },
  },
  {
    ch: 5,
    text: ['And we did not know what to say: we laughed, we wept, we said thousands of things meaningless and incoherent; at one moment we walked along the pavement, then suddenly turned back and crossed the road; then we stopped and went back again to the embankment; we were like children.'],
    scene: { cam: P.BRIDGE + 300, camDx: -260, zoom: 1.5, sky: 'dawn', stars: 0.2, lamps: 1, windows: 0.5, fluff: 0.8, figs: { nastenka: { x: P.BRIDGE + 560, pose: 'walk', face: -1, dx: -420 }, dreamer: { x: P.BRIDGE + 600, pose: 'walk', face: -1, dx: -420 } } },
  },
  {
    ch: 5,
    text: ['“So by to-morrow you will be my lodger.”', '“And we will go to The Barber of Seville, for they are soon going to give it again.”', '“Yes, we’ll go,” said Nastenka, “but better see something else and not The Barber of Seville.”'],
    scene: { cam: P.BRIDGE + 10, zoom: 2.2, sky: 'dawn', stars: 0.2, lamps: 1, windows: 0.5, fluff: 0.6, figs: { nastenka: { x: P.BRIDGE + 20, pose: 'stand', face: -1 }, dreamer: { x: P.BRIDGE + 70, pose: 'stand', face: -1 } } },
  },
  {
    ch: 5,
    text: ['“Look at the sky, Nastenka. Look! To-morrow it will be a lovely day; what a blue sky, what a moon! Look; that yellow cloud is covering it now, look, look! No, it has passed by. Look, look!”'],
    scene: { cam: P.SPOT + 140, zoom: 1.15, cy: 440, sky: 'clear', stars: 0.6, moon: 1, lamps: 1, windows: 0.5, figs: { nastenka: { x: P.SPOT + 190, pose: 'stand', face: 1 }, dreamer: { x: P.SPOT + 130, pose: 'pointUp', face: 1 } } },
  },
  {
    ch: 5,
    text: ['But Nastenka did not look at the cloud; she stood mute as though turned to stone; a minute later she huddled timidly close up to me. Her hand trembled in my hand. […] At that moment a young man passed by us. He suddenly stopped, looked at us intently, and then again took a few steps on.', '“It’s he,” she answered in a whisper.'],
    scene: { cam: P.SPOT + 220, zoom: 1.9, sky: 'clear', stars: 0.4, moon: 1, lamps: 1, windows: 0.5, figs: { nastenka: { x: P.SPOT + 172, pose: 'stand', face: 1 }, dreamer: { x: P.SPOT + 140, pose: 'stand', face: 1 }, lodger: { x: P.SPOT + 360, pose: 'lookBack', face: 1, dx: 20 } } },
  },
  {
    ch: 5,
    text: ['“Nastenka, Nastenka! It’s you!” I heard a voice behind us and at the same moment the young man took several steps towards us.', 'My God, how she cried out! How she started! How she tore herself out of my arms and rushed to meet him! I stood and looked at them, utterly crushed.'],
    scene: { cam: P.SPOT + 250, zoom: 1.9, sky: 'clear', stars: 0.4, moon: 1, lamps: 1, windows: 0.5, figs: { nastenka: { x: P.SPOT + 300, pose: 'embrace', face: 1 }, dreamer: { x: P.SPOT + 140, pose: 'stand', face: 1 }, lodger: { x: P.SPOT + 324, pose: 'embrace', face: -1 } } },
  },
  {
    ch: 5,
    text: ['But she had hardly given him her hand, had hardly flung herself into his arms, when she turned to me again, was beside me again in a flash, and before I knew where I was she threw both arms round my neck and gave me a warm, tender kiss. Then, without saying a word to me, she rushed back to him again, took his hand, and drew him after her.'],
    scene: { cam: P.SPOT + 170, zoom: 2.6, cy: 570, sky: 'clear', stars: 0.4, moon: 1, lamps: 1, windows: 0.5, figs: { nastenka: { x: P.SPOT + 158, pose: 'embrace', face: -1 }, dreamer: { x: P.SPOT + 140, pose: 'embrace', face: 1 }, lodger: { x: P.SPOT + 330, pose: 'stand', face: -1 } } },
  },
  {
    ch: 5,
    text: ['I stood a long time looking after them. At last the two vanished from my sight.'],
    scene: { cam: P.SPOT + 300, zoom: 1.35, sky: 'clear', stars: 0.6, moon: 0.6, lamps: 1, windows: 0.4, fluff: 0.3, figs: { dreamer: { x: P.SPOT + 140, pose: 'stand', face: 1 }, nastenka: { x: P.LANE - 80, pose: 'walk', face: 1, dx: 160, a: 0.7 }, lodger: { x: P.LANE - 40, pose: 'walk', face: 1, dx: 160, a: 0.7 } } },
  },
  // ----------------------------------------------------------------- morning
  {
    ch: 6,
    text: ['My night ended with the morning. It was a wet day. The rain was falling and beating disconsolately upon my window pane; it was dark in the room and grey outside. My head ached and I was giddy; fever was stealing over my limbs.'],
    scene: { cam: P.YELLOW, sky: 'grey', rain: 1, vision: 'room' },
  },
  {
    ch: 6,
    text: ['“Thank you, yes, thank you for that love! For it will live in my memory like a sweet dream which lingers long after awakening; for I shall remember for ever that instant when you opened your heart to me like a brother and so generously accepted the gift of my shattered heart to care for it, nurse it, and heal it. . . .”'],
    scene: { cam: P.YELLOW, sky: 'grey', rain: 0.8, vision: 'letter:last' },
  },
  {
    ch: 6,
    text: ['“Oh, my God! If only I could love you both at once! Oh, if only you were he!”', '[“Oh, if only he were you,” echoed in my mind. I remembered your words, Nastenka!]', '“Forgive me, remember and love your NASTENKA.”'],
    scene: { cam: P.YELLOW, sky: 'grey', rain: 0.8, vision: 'letter:last' },
  },
  {
    ch: 6,
    text: ['I don’t know why, but when I looked out of the window it seemed to me that the house opposite had grown old and dingy too, that the stucco on the columns was peeling off and crumbling, that the cornices were cracked and blackened, and that the walls, of a vivid deep yellow, were patchy.'],
    scene: { cam: P.YELLOW, sky: 'grey', rain: 0.6, vision: 'room:old' },
  },
  {
    ch: 6,
    text: ['But to imagine that I should bear you a grudge, Nastenka! […] Oh never, never! May your sky be clear, may your sweet smile be bright and untroubled, and may you be blessed for that moment of blissful happiness which you gave to another, lonely and grateful heart!'],
    scene: { cam: P.YELLOW, sky: 'clear', rain: 0, vision: 'room:clear' },
  },
  {
    ch: 6,
    text: ['My God, a whole moment of happiness! Is that too little for the whole of a man’s life?'],
    scene: { cam: P.SPOT - 100, zoom: 1, sky: 'white', stars: 0.6, lamps: 0.5, windows: 0.3, fluff: 0.5, vision: 'end' },
  },
];
