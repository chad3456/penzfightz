/**
 * श्री हनुमान चालीसा — Goswami Tulsidas (16th century), in the reading of the
 * common Gita Press edition. Every word carries its romanisation and a short
 * English gloss; every verse carries a meaning in English and in Hindi. The
 * glosses and meanings are this project's own.
 *
 * A charan is one metrical foot: a chaupai line has two (16 + 16 mātrās), a
 * doha four (13 + 11, 13 + 11). Words are written `devanagari=roman=gloss`,
 * separated by `;`.
 */

export interface Word { d: string; r: string; g: string }
export interface Verse {
  id: string;
  kind: 'doha' | 'chaupai';
  n: number;          // chaupai number 1–40, doha 1–3
  charans: Word[][];
  en: string;
  hi: string;
  scene: string;
  title: string;      // a short English name for the picture
}

const W = (s: string): Word[] => s.split(';').map((x) => x.trim()).filter(Boolean).map((x) => { const [d, r, g] = x.split('='); return { d: d.trim(), r: r.trim(), g: g.trim() }; });

const V = (id: string, kind: Verse['kind'], n: number, scene: string, title: string, ch: string[], en: string, hi: string): Verse => ({ id, kind, n, scene, title, charans: ch.map(W), en, hi });

export const VERSES: Verse[] = [
  V('d1', 'doha', 1, 'mirror', 'The mirror of the mind', [
    'श्रीगुरु=Shrī Guru=the revered Guru’s; चरन=charan=feet; सरोज=saroj=lotus; रज=raj=dust, pollen',
    'निज=nij=my own; मनु=manu=mind; मुकुरु=mukuru=mirror; सुधारि=sudhāri=having polished',
    'बरनउँ=baranaun=I describe; रघुबर=Raghubar=the best of the Raghus, Rama; बिमल=bimal=spotless; जसु=jasu=glory',
    'जो=jo=which; दायकु=dāyaku=bestows; फल=phal=fruits; चारि=chāri=the four',
  ],
  'With the pollen of my Guru’s lotus feet I polish the mirror of my mind, then describe the spotless glory of Rama, best of the Raghus, which grants life’s four fruits: righteousness, wealth, fulfilment and freedom.',
  'श्री गुरु के चरण-कमलों की धूल से अपने मन रूपी दर्पण को निर्मल करके मैं श्री रघुवीर के निर्मल यश का वर्णन करता हूँ, जो धर्म, अर्थ, काम और मोक्ष — चारों फल देने वाला है।'),

  V('d2', 'doha', 2, 'wind', 'The Son of the Wind', [
    'बुद्धिहीन=buddhihīn=without wisdom; तनु=tanu=this self; जानिके=jānike=knowing',
    'सुमिरौं=sumiraun=I remember; पवन=Pavan=the Wind’s; कुमार=kumār=son',
    'बल=bal=strength; बुधि=budhi=understanding; बिद्या=bidyā=learning; देहु=dehu=grant; मोहिं=mohin=me',
    'हरहु=harahu=take away; कलेस=kales=sorrows; बिकार=bikār=flaws',
  ],
  'Knowing myself to be without wisdom, I call to mind the Son of the Wind. Grant me strength, understanding and learning; take away my sorrows and my flaws.',
  'अपने को बुद्धिहीन जानकर मैं पवनपुत्र हनुमान का स्मरण करता हूँ। हे प्रभु! मुझे बल, बुद्धि और विद्या दीजिए और मेरे क्लेशों तथा विकारों को हर लीजिए।'),

  V('c1', 'chaupai', 1, 'ocean', 'Ocean of wisdom', [
    'जय=jay=glory; हनुमान=Hanumān=to Hanuman; ज्ञान=gyān=wisdom; गुन=gun=virtue; सागर=sāgar=ocean',
    'जय=jay=glory; कपीस=kapīs=to the lord of monkeys; तिहुँ=tihun=the three; लोक=lok=worlds; उजागर=ujāgar=who lights up',
  ],
  'Glory to Hanuman, ocean of wisdom and virtue. Glory to the lord of the monkeys, who lights up the three worlds.',
  'हे हनुमान! आपकी जय हो, आप ज्ञान और गुणों के सागर हैं। हे कपीश्वर! आपकी जय हो, आप तीनों लोकों को प्रकाशित करने वाले हैं।'),

  V('c2', 'chaupai', 2, 'birth', 'Anjani’s son', [
    'राम=Rām=Rama’s; दूत=dūt=messenger; अतुलित=atulit=matchless; बल=bal=strength; धामा=dhāmā=home of',
    'अंजनि=Anjani=Anjani’s; पुत्र=putra=son; पवनसुत=Pavansut=Son of the Wind; नामा=nāmā=by name',
  ],
  'Rama’s messenger, home of matchless strength, called Anjani’s son and the Son of the Wind.',
  'आप श्रीराम के दूत और अतुलनीय बल के धाम हैं; अंजनीपुत्र और पवनसुत आपके नाम हैं।'),

  V('c3', 'chaupai', 3, 'thunder', 'Body of thunderbolt', [
    'महाबीर=Mahābīr=great hero; बिक्रम=bikram=valiant; बजरंगी=Bajrangī=with limbs hard as the thunderbolt',
    'कुमति=kumati=bad thought; निवार=nivār=you dispel; सुमति=sumati=good sense; के=ke=of; संगी=sangī=companion',
  ],
  'Great hero, valiant, with limbs hard as the thunderbolt: you drive away bad thoughts and keep company with good sense.',
  'आप महावीर, पराक्रमी और वज्र के समान अंगों वाले हैं; आप दुर्बुद्धि को दूर करते हैं और सुबुद्धि के साथी हैं।'),

  V('c4', 'chaupai', 4, 'portrait', 'Golden one', [
    'कंचन=kanchan=gold; बरन=baran=in colour; बिराज=birāj=shining; सुबेसा=subesā=finely dressed',
    'कानन=kānan=in the ears; कुंडल=kundal=earrings; कुंचित=kunchit=curling; केसा=kesā=hair',
  ],
  'Golden in colour, shining in fine clothes, with rings in your ears and curling hair.',
  'आपका वर्ण सोने जैसा है, सुंदर वेश में आप शोभित हैं; कानों में कुंडल और घुँघराले केश हैं।'),

  V('c5', 'chaupai', 5, 'banner', 'Thunderbolt and banner', [
    'हाथ=hāth=in your hands; बज्र=bajra=the thunderbolt; औ=au=and; ध्वजा=dhvajā=the banner; बिराजै=birājai=shine',
    'काँधे=kāndhe=on your shoulder; मूँज=mūnj=of munja grass; जनेऊ=janeū=the sacred thread; साजै=sājai=is adorned',
  ],
  'In your hands shine the thunderbolt and the banner; a sacred thread of munja grass adorns your shoulder.',
  'आपके हाथों में वज्र और ध्वजा शोभित हैं; कंधे पर मूँज का जनेऊ सजा है।'),

  V('c6', 'chaupai', 6, 'parents', 'Shiva’s own, Kesari’s joy', [
    'संकर=Sankar=Shankara’s; सुवन=suvan=son; केसरीनंदन=Kesarīnandan=the joy of Kesari',
    'तेज=tej=radiance; प्रताप=pratāp=might; महा=mahā=great; जग=jag=the world; बंदन=bandan=bows to',
  ],
  'Born of Shankara’s own being, the joy of Kesari: great are your radiance and your might, and the whole world bows to you.',
  'आप भगवान शंकर के अंश और केसरी के पुत्र हैं; आपका तेज और प्रताप महान है, सारा जगत आपकी वंदना करता है।'),

  V('c7', 'chaupai', 7, 'student', 'The eager student', [
    'बिद्यावान=bidyāvān=learned; गुनी=gunī=virtuous; अति=ati=very; चातुर=chātur=clever',
    'राम=Rām=Rama’s; काज=kāj=work; करिबे=karibe=to do; को=ko=for; आतुर=ātur=eager',
  ],
  'Learned, virtuous and very clever, always eager to do Rama’s work.',
  'आप विद्वान, गुणवान और अत्यंत चतुर हैं; श्रीराम के कार्य करने को सदा आतुर रहते हैं।'),

  V('c8', 'chaupai', 8, 'katha', 'The listener', [
    'प्रभु=prabhu=the Lord’s; चरित्र=charitra=story; सुनिबे=sunibe=hearing; को=ko=in; रसिया=rasiyā=delighting',
    'राम=Rām=Rama; लखन=Lakhan=Lakshmana; सीता=Sītā=Sita; मन=man=in your heart; बसिया=basiyā=dwell',
  ],
  'You delight in hearing the Lord’s story; Rama, Lakshmana and Sita dwell in your heart.',
  'आप प्रभु के चरित्र सुनने के रसिक हैं; श्रीराम, लक्ष्मण और सीता आपके हृदय में बसते हैं।'),

  V('c9', 'chaupai', 9, 'lanka', 'Tiny, then terrible', [
    'सूक्ष्म=sūkshma=tiny; रूप=rūp=form; धरि=dhari=taking; सियहिं=Siyahin=to Sita; दिखावा=dikhāvā=you appeared',
    'बिकट=bikat=fearsome; रूप=rūp=form; धरि=dhari=taking; लंक=Lank=Lanka; जरावा=jarāvā=you burned',
  ],
  'Taking a tiny form you showed yourself to Sita; taking a fearsome form you set Lanka on fire.',
  'आपने सूक्ष्म रूप धारण करके सीताजी को दर्शन दिए और विकराल रूप धारण करके लंका को जलाया।'),

  V('c10', 'chaupai', 10, 'battle', 'The terrible form', [
    'भीम=bhīm=terrible; रूप=rūp=form; धरि=dhari=taking; असुर=asur=the demons; सँहारे=sanhāre=you destroyed',
    'रामचंद्र=Rāmchandra=Ramachandra’s; के=ke=of; काज=kāj=tasks; सँवारे=sanvāre=you accomplished',
  ],
  'Taking a terrible form you destroyed the demons and accomplished Ramachandra’s tasks.',
  'आपने भयंकर रूप धारण करके असुरों का संहार किया और श्री रामचंद्र जी के कार्यों को सँवारा।'),

  V('c11', 'chaupai', 11, 'sanjeevani', 'The life-giving herb', [
    'लाय=lāy=bringing; सजीवन=sajīvan=the life-giving herb; लखन=Lakhan=Lakshmana; जियाये=jiyāye=you revived',
    'श्रीरघुबीर=Shrī Raghubīr=Rama, hero of the Raghus; हरषि=harashi=rejoicing; उर=ur=to his heart; लाये=lāye=held you',
  ],
  'You brought the life-giving herb and revived Lakshmana; Rama, hero of the Raghus, rejoiced and held you to his heart.',
  'आपने संजीवनी बूटी लाकर लक्ष्मण जी को जीवित किया; श्री रघुवीर ने हर्षित होकर आपको हृदय से लगा लिया।'),

  V('c12', 'chaupai', 12, 'praise', 'Dear as Bharata', [
    'रघुपति=Raghupati=the lord of the Raghus; कीन्ही=kīnhī=gave; बहुत=bahut=great; बड़ाई=barāī=praise',
    'तुम=tum=you; मम=mam=my; प्रिय=priya=dear; भरतहि=Bharatahi=Bharata; सम=sam=as; भाई=bhāī=brother',
  ],
  'The lord of the Raghus praised you greatly: “You are as dear to me as my brother Bharata.”',
  'श्री रघुनाथ जी ने आपकी बहुत प्रशंसा की और कहा — तुम मुझे भरत के समान प्रिय भाई हो।'),

  V('c13', 'chaupai', 13, 'shesha', 'A thousand mouths', [
    'सहस=sahas=a thousand; बदन=badan=mouths; तुम्हरो=tumharo=your; जस=jas=glory; गावैं=gāvain=sing',
    'अस=as=thus; कहि=kahi=saying; श्रीपति=Shrīpati=the Lord of Shri, Rama; कंठ=kanth=to his neck; लगावैं=lagāvain=draws you',
  ],
  '“The thousand-mouthed serpent sings your glory,” said the Lord of Shri, and drew you into his embrace.',
  'हज़ार मुखों वाले शेषनाग आपका यश गाते हैं — ऐसा कहकर श्रीपति ने आपको गले से लगा लिया।'),

  V('c14', 'chaupai', 14, 'chorus', 'The heavenly chorus', [
    'सनकादिक=Sanakādik=Sanaka and the child sages; ब्रह्मादि=Brahmādi=Brahma and the gods; मुनीसा=munīsā=the great seers',
    'नारद=Nārad=Narada; सारद=Sārad=Sharada, Saraswati; सहित=sahit=together with; अहीसा=Ahīsā=the lord of serpents',
  ],
  'Sanaka and the child sages, Brahma and the gods, the great seers, Narada and Saraswati with the lord of serpents…',
  'सनक आदि ऋषि, ब्रह्मा आदि देवता, मुनीश्वर, नारद, सरस्वती और शेषनाग सहित…'),

  V('c15', 'chaupai', 15, 'guardians', 'Beyond all telling', [
    'जम=Jam=Yama; कुबेर=Kuber=Kubera; दिगपाल=digpāl=the guardians of the directions; जहाँ=jahān=where; ते=te=even they',
    'कबि=kabi=poets; कोबिद=kobid=scholars; कहि=kahi=tell it; सके=sake=could; कहाँ=kahān=how; ते=te=then',
  ],
  '…Yama, Kubera and the guardians of the directions: when even they cannot tell your glory, how could poets and scholars?',
  'यमराज, कुबेर और सभी दिक्पाल भी जब आपके यश का वर्णन नहीं कर सकते, तो कवि और विद्वान कैसे कह सकते हैं?'),

  V('c16', 'chaupai', 16, 'sugriva', 'A throne for Sugriva', [
    'तुम=tum=you; उपकार=upkār=a great kindness; सुग्रीवहिं=Sugrīvahin=to Sugriva; कीन्हा=kīnhā=did',
    'राम=Rām=Rama; मिलाय=milāy=bringing him to; राज=rāj=royal; पद=pad=throne; दीन्हा=dīnhā=gave',
  ],
  'You did Sugriva a great kindness: you brought him to Rama and gave him back his throne.',
  'आपने सुग्रीव पर बड़ा उपकार किया; उन्हें श्रीराम से मिलाकर राजपद दिलाया।'),

  V('c17', 'chaupai', 17, 'vibhishana', 'Vibhishana’s crown', [
    'तुम्हरो=tumharo=your; मंत्र=mantra=counsel; बिभीषन=Bibhīshan=Vibhishana; माना=mānā=heeded',
    'लंकेस्वर=Lankesvar=lord of Lanka; भए=bhae=became; सब=sab=all; जग=jag=the world; जाना=jānā=knows',
  ],
  'Vibhishana heeded your counsel and became lord of Lanka, as the whole world knows.',
  'आपकी सलाह विभीषण ने मानी, जिससे वे लंका के राजा बने — यह सारा संसार जानता है।'),

  V('c18', 'chaupai', 18, 'sun', 'The sweet fruit', [
    'जुग=jug=ages; सहस्र=sahasra=thousands; जोजन=jojan=of yojanas; पर=par=away; भानू=bhānū=the sun',
    'लील्यो=līlyo=you swallowed; ताहि=tāhi=it; मधुर=madhur=sweet; फल=phal=a fruit; जानू=jānū=taking it for',
  ],
  'The sun, thousands upon thousands of yojanas away, you swallowed, taking it for a sweet fruit.',
  'हज़ारों योजन दूर स्थित सूर्य को आपने मीठा फल समझकर निगल लिया।'),

  V('c19', 'chaupai', 19, 'leap', 'The ring and the ocean', [
    'प्रभु=prabhu=the Lord’s; मुद्रिका=mudrikā=ring; मेलि=meli=placing; मुख=mukh=mouth; माहीं=māhīn=in your',
    'जलधि=jaladhi=the ocean; लाँघि=lānghi=leaping over; गये=gaye=you went; अचरज=acharaj=wonder; नाहीं=nāhīn=no',
  ],
  'With the Lord’s ring in your mouth you leapt across the ocean — no wonder in that.',
  'प्रभु की अँगूठी मुख में रखकर आप समुद्र लाँघ गए — इसमें कोई आश्चर्य नहीं।'),

  V('c20', 'chaupai', 20, 'path', 'Hard made easy', [
    'दुर्गम=durgam=hard; काज=kāj=tasks; जगत=jagat=the world; के=ke=of; जेते=jete=however many',
    'सुगम=sugam=easy; अनुग्रह=anugrah=by the grace; तुम्हरे=tumhare=your; तेते=tete=all of them become',
  ],
  'However many hard tasks there are in the world, all of them become easy by your grace.',
  'संसार के जितने भी कठिन कार्य हैं, वे सब आपकी कृपा से सरल हो जाते हैं।'),

  V('c21', 'chaupai', 21, 'door', 'Keeper of Rama’s door', [
    'राम=Rām=Rama’s; दुआरे=duāre=at the door; तुम=tum=you; रखवारे=rakhvāre=are the guard',
    'होत=hot=there is; न=na=no; आज्ञा=āgyā=leave; बिनु=binu=without; पैसारे=paisāre=entry',
  ],
  'You guard Rama’s door; no one enters without your leave.',
  'आप श्रीराम के द्वार के रखवाले हैं; आपकी आज्ञा के बिना कोई भीतर प्रवेश नहीं कर सकता।'),

  V('c22', 'chaupai', 22, 'refuge', 'Refuge', [
    'सब=sab=all; सुख=sukh=joys; लहै=lahai=finds; तुम्हारी=tumhārī=your; सरना=sarnā=refuge',
    'तुम=tum=you; रच्छक=rachchhak=protector; काहू=kāhū=anyone; को=ko=of; डर=dar=fear; ना=nā=none',
  ],
  'Whoever takes refuge in you finds every joy; with you as protector, there is nothing to fear.',
  'आपकी शरण में आने वाला सब सुख पाता है; जब आप रक्षक हैं, तो किसी का डर नहीं।'),

  V('c23', 'chaupai', 23, 'roar', 'The roar', [
    'आपन=āpan=your own; तेज=tej=power; सम्हारो=samhāro=can hold; आपै=āpai=you alone',
    'तीनों=tīnon=all three; लोक=lok=worlds; हाँक=hānk=your roar; तें=ten=at; काँपै=kānpai=tremble',
  ],
  'You alone can hold your own power; the three worlds tremble at your roar.',
  'अपने तेज को आप ही सँभाल सकते हैं; आपकी एक हुंकार से तीनों लोक काँप उठते हैं।'),

  V('c24', 'chaupai', 24, 'ghosts', 'Spirits flee', [
    'भूत=bhūt=ghosts; पिसाच=pisāch=goblins; निकट=nikat=near; नहिं=nahin=do not; आवै=āvai=come',
    'महाबीर=Mahābīr=“Mahavir”; जब=jab=when; नाम=nām=the name; सुनावै=sunāvai=is spoken',
  ],
  'Ghosts and goblins come nowhere near when the name “Mahavir” is spoken.',
  'जहाँ महावीर हनुमान का नाम सुनाया जाता है, वहाँ भूत-पिशाच पास नहीं आते।'),

  V('c25', 'chaupai', 25, 'healing', 'Healing', [
    'नासै=nāsai=destroys; रोग=rog=disease; हरै=harai=removes; सब=sab=all; पीरा=pīrā=pain',
    'जपत=japat=chanting; निरंतर=nirantar=unceasingly; हनुमत=Hanumat=Hanuman; बीरा=bīrā=the brave',
  ],
  'Disease is destroyed and all pain removed by chanting unceasingly the name of brave Hanuman.',
  'वीर हनुमान का निरंतर जप करने से सब रोग नष्ट होते हैं और सारी पीड़ा मिट जाती है।'),

  V('c26', 'chaupai', 26, 'rescue', 'The rescue', [
    'संकट=sankat=trouble; तें=ten=from; हनुमान=Hanumān=Hanuman; छुड़ावै=chhurāvai=frees',
    'मन=man=mind; क्रम=kram=deed; बचन=bachan=word; ध्यान=dhyān=in meditation; जो=jo=whoever; लावै=lāvai=holds him',
  ],
  'Hanuman frees from trouble whoever holds him in mind, in deed and in word.',
  'जो मन, कर्म और वचन से हनुमान जी का ध्यान करता है, उसे वे संकटों से छुड़ा लेते हैं।'),

  V('c27', 'chaupai', 27, 'king', 'The ascetic king', [
    'सब=sab=all; पर=par=above; राम=Rām=Rama; तपस्वी=tapasvī=the ascetic; राजा=rājā=king',
    'तिन=tin=his; के=ke=of; काज=kāj=tasks; सकल=sakal=all; तुम=tum=you; साजा=sājā=accomplished',
  ],
  'Above all is Rama, the ascetic king; and every one of his tasks you accomplished.',
  'तपस्वी राजा श्रीराम सबसे श्रेष्ठ हैं; उनके सब कार्य आपने ही सँवारे।'),

  V('c28', 'chaupai', 28, 'wishes', 'Every wish', [
    'और=aur=and; मनोरथ=manorath=wish; जो=jo=whatever; कोई=koī=anyone; लावै=lāvai=brings',
    'सोइ=soi=that one; अमित=amit=boundless; जीवन=jīvan=of life; फल=phal=the fruit; पावै=pāvai=receives',
  ],
  'Whatever wish anyone brings to you, they receive the boundless fruit of life.',
  'जो कोई भी आपके पास अपनी मनोकामना लेकर आता है, वह जीवन का असीम फल पाता है।'),

  V('c29', 'chaupai', 29, 'ages', 'Through the four ages', [
    'चारों=chāron=all four; जुग=jug=ages; परताप=partāp=glory; तुम्हारा=tumhārā=your',
    'है=hai=is; परसिद्ध=parsiddh=renowned; जगत=jagat=the world; उजियारा=ujiyārā=lighting',
  ],
  'Your glory fills all four ages; renowned, it lights up the world.',
  'चारों युगों में आपका प्रताप है; आपका यश संसार में प्रसिद्ध है और जगत को प्रकाशित करता है।'),

  V('c30', 'chaupai', 30, 'saints', 'Guardian of saints', [
    'साधु=sādhu=the good; संत=sant=saints; के=ke=of; तुम=tum=you; रखवारे=rakhvāre=are the guardian',
    'असुर=asur=demons; निकंदन=nikandan=destroyer of; राम=Rām=Rama’s; दुलारे=dulāre=beloved',
  ],
  'You are the guardian of the good and the saints; destroyer of demons, beloved of Rama.',
  'आप साधु-संतों के रक्षक, असुरों का नाश करने वाले और श्रीराम के दुलारे हैं।'),

  V('c31', 'chaupai', 31, 'boon', 'Mother Janaki’s boon', [
    'अष्ट=ashta=eight; सिद्धि=siddhi=powers; नौ=nau=nine; निधि=nidhi=treasures; के=ke=of; दाता=dātā=the giver',
    'अस=as=such; बर=bar=a boon; दीन=dīn=gave; जानकी=Jānakī=Janaki, Sita; माता=mātā=mother',
  ],
  'Giver of the eight powers and the nine treasures: such was the boon Mother Janaki gave you.',
  'आप आठ सिद्धियों और नौ निधियों के दाता हैं — ऐसा वरदान आपको माता जानकी ने दिया।'),

  V('c32', 'chaupai', 32, 'elixir', 'The elixir of Rama', [
    'राम=Rām=Rama’s; रसायन=rasāyan=elixir; तुम्हरे=tumhare=your; पासा=pāsā=is with',
    'सदा=sadā=always; रहो=raho=you remain; रघुपति=Raghupati=of the lord of the Raghus; के=ke=the; दासा=dāsā=servant',
  ],
  'You hold the elixir of Rama; you remain forever the servant of the lord of the Raghus.',
  'आपके पास राम-नाम रूपी रसायन है; आप सदा श्री रघुनाथ जी के दास बने रहते हैं।'),

  V('c33', 'chaupai', 33, 'bhajan', 'The song', [
    'तुम्हरे=tumhare=through your; भजन=bhajan=worship; राम=Rām=Rama; को=ko=—; पावै=pāvai=one reaches',
    'जनम=janam=birth; जनम=janam=after birth; के=ke=of; दुख=dukh=sorrows; बिसरावै=bisrāvai=forgets',
  ],
  'Through singing of you one reaches Rama and forgets the sorrows of birth after birth.',
  'आपके भजन से श्रीराम की प्राप्ति होती है और जन्म-जन्मांतर के दुख भूल जाते हैं।'),

  V('c34', 'chaupai', 34, 'saket', 'Rama’s city', [
    'अंत=ant=the last; काल=kāl=hour; रघुबर=Raghubar=Rama’s; पुर=pur=city; जाई=jāī=one goes to',
    'जहाँ=jahān=wherever; जन्म=janma=born; हरि-भक्त=Hari-bhakt=a devotee of Hari; कहाई=kahāī=is called',
  ],
  'At the last hour one goes to Rama’s city, and wherever born again is called a devotee of Hari.',
  'अंत समय में वह श्री रघुनाथ जी के धाम जाता है और जहाँ भी जन्म लेता है, हरि-भक्त कहलाता है।'),

  V('c35', 'chaupai', 35, 'devotion', 'One devotion', [
    'और=aur=other; देवता=devtā=gods; चित्त=chitt=in mind; न=na=not; धरई=dharaī=holding',
    'हनुमत=Hanumat=Hanuman; सेइ=sei=serving; सर्ब=sarb=all; सुख=sukh=joy; करई=karaī=brings',
  ],
  'Even holding no other god in mind, one finds every joy by serving Hanuman.',
  'दूसरे देवताओं को मन में न रखते हुए भी, केवल हनुमान जी की सेवा से सब सुख मिलते हैं।'),

  V('c36', 'chaupai', 36, 'storm', 'The storm cut', [
    'संकट=sankat=troubles; कटै=katai=are cut; मिटै=mitai=vanishes; सब=sab=all; पीरा=pīrā=pain',
    'जो=jo=whoever; सुमिरै=sumirai=remembers; हनुमत=Hanumat=Hanuman; बलबीरा=balbīrā=the mighty hero',
  ],
  'Troubles are cut away and all pain vanishes for whoever remembers Hanuman, the mighty hero.',
  'जो बलवीर हनुमान का स्मरण करता है, उसके संकट कट जाते हैं और सारी पीड़ा मिट जाती है।'),

  V('c37', 'chaupai', 37, 'guru', 'Glory, glory, glory', [
    'जै=jai=glory; जै=jai=glory; जै=jai=glory; हनुमान=Hanumān=to Hanuman; गोसाईं=gosāīn=the lord',
    'कृपा=kripā=grace; करहु=karahu=show me; गुरुदेव=gurudev=a divine teacher; की=kī=of; नाईं=nāīn=like',
  ],
  'Glory, glory, glory to Lord Hanuman! Be gracious to me as a guru is.',
  'हे स्वामी हनुमान! आपकी जय हो, जय हो, जय हो। आप गुरुदेव की भाँति मुझ पर कृपा कीजिए।'),

  V('c38', 'chaupai', 38, 'freedom', 'A hundred times', [
    'जो=jo=whoever; सत=sat=a hundred; बार=bār=times; पाठ=pāth=recitation; कर=kar=makes; कोई=koī=anyone',
    'छूटहि=chhūtahi=is freed; बंदि=bandi=from bondage; महा=mahā=great; सुख=sukh=joy; होई=hoī=comes',
  ],
  'Whoever recites this a hundred times is freed from bondage and great joy comes.',
  'जो कोई इसका सौ बार पाठ करता है, वह बंधनों से छूट जाता है और उसे महान सुख मिलता है।'),

  V('c39', 'chaupai', 39, 'witness', 'Shiva bears witness', [
    'जो=jo=whoever; यह=yah=this; पढ़ै=parhai=reads; हनुमान=Hanumān=Hanuman; चालीसा=chālīsā=Chalisa, the forty verses',
    'होय=hoy=attains; सिद्धि=siddhi=perfection; साखी=sākhī=witness; गौरीसा=Gaurīsā=Gauri’s lord, Shiva',
  ],
  'Whoever reads this Hanuman Chalisa attains perfection; Gauri’s lord, Shiva, is witness.',
  'जो इस हनुमान चालीसा को पढ़ता है, उसे सिद्धि प्राप्त होती है; इसके साक्षी स्वयं गौरीपति शिव हैं।'),

  V('c40', 'chaupai', 40, 'tulsi', 'Tulsidas prays', [
    'तुलसीदास=Tulsīdās=Tulsidas; सदा=sadā=forever; हरि=Hari=Hari’s; चेरा=cherā=servant',
    'कीजै=kījai=make; नाथ=nāth=O Lord; हृदय=hriday=heart; महँ=mahan=in my; डेरा=derā=your home',
  ],
  'Tulsidas is forever Hari’s servant: O Lord, make your home in my heart.',
  'तुलसीदास सदा हरि के सेवक हैं; हे नाथ! आप मेरे हृदय में निवास कीजिए।'),

  V('d3', 'doha', 3, 'heart', 'Dwell in my heart', [
    'पवन=Pavan=the Wind’s; तनय=tanay=son; संकट=sankat=troubles; हरन=haran=remover of',
    'मंगल=mangal=auspicious; मूरति=mūrati=embodiment; रूप=rūp=in form',
    'राम=Rām=Rama; लखन=Lakhan=Lakshmana; सीता=Sītā=Sita; सहित=sahit=together with',
    'हृदय=hriday=in my heart; बसहु=basahu=dwell; सुर=sur=of the gods; भूप=bhūp=king',
  ],
  'Son of the Wind, remover of troubles, embodiment of all that is auspicious: with Rama, Lakshmana and Sita, dwell in my heart, king among the gods.',
  'हे संकट हरने वाले पवनपुत्र! आप मंगल की मूर्ति हैं। हे देवराज! आप श्रीराम, लक्ष्मण और सीता सहित मेरे हृदय में निवास कीजिए।'),
];

export const DEV_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
export const devNum = (n: number | string) => String(n).replace(/[0-9]/g, (d) => DEV_DIGITS[+d]);
export const verseLabel = (v: Verse, lang: 'hi' | 'en') => v.kind === 'doha' ? (lang === 'hi' ? `दोहा ${devNum(v.n)}` : `Doha ${v.n}`) : (lang === 'hi' ? `चौपाई ${devNum(v.n)}` : `Chaupai ${v.n}`);
