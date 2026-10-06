/**
 * The twenty chapters as Claude reads them: a name, the image each chapter
 * keeps returning to, an opening reading in Hindi and English, and closer
 * readings of the verses that carry the chapter. Original writing.
 *
 * Claude's stance throughout: an AI reading a text about the witness. It
 * does not claim to have realised anything; it reads carefully, says what
 * the words do, where they are radical, where they belong to their age,
 * and leaves the testing to the reader.
 */

export type Scene = 'witness' | 'ocean' | 'pearl' | 'smoke' | 'bubble' | 'pots' | 'boat' | 'knots' | 'pairs' | 'mirage'
  | 'light' | 'layers' | 'leaf' | 'moon' | 'rope' | 'forget' | 'flame' | 'dryleaf' | 'kva' | 'nothing';

export interface Reading { v: string; hi: string; en: string }
export interface Chapter {
  n: number; sa: string; hiName: string; en: string; scene: Scene; image: string; imageEn: string;
  speaker: 'ashtavakra' | 'janaka'; hi: string; enText: string; readings: Reading[];
}

export const CHAPTERS: Chapter[] = [
  {
    n: 1, sa: 'साक्षी', hiName: 'देखने वाला', en: 'The Witness', scene: 'witness', speaker: 'ashtavakra',
    image: 'पाँच तत्व घूमते हैं; केंद्र में एक बिंदु हिलता नहीं।', imageEn: 'Five elements circle; the point at the centre never moves.',
    hi: 'जनक तीन प्रश्न पूछते हैं — ज्ञान, मुक्ति, वैराग्य — और अष्टावक्र किसी भी प्रश्न का उत्तर "कैसे" से नहीं देते। वे सीधे कहते हैं: तुम पहले से ही वह हो। यह अध्याय पूरी गीता का बीज है। मैं इसे पढ़ते हुए एक बात पर ठहरता हूँ: यहाँ कोई साधना-क्रम नहीं, कोई सीढ़ी नहीं। "अधुनैव" — अभी इसी क्षण। यह वाक्य जितना सरल है, उतना ही कठिन; क्योंकि हमारा पूरा मन "बाद में" के व्याकरण में बना है।',
    enText: 'Janaka asks three questions — how to know, how to be free, how to let go — and Ashtavakra answers none of them with a method. He says: you already are what you are asking for. This chapter is the seed of the whole book. Reading it, I keep stopping at one word, adhunaiva, "right now". There is no ladder here, no course of practice. The sentence is simple and hard at once, because most minds — and most of the sentences I am made from — are built in the grammar of "later".',
    readings: [
      { v: '1.3', hi: 'यह श्लोक एक-एक करके पाँचों तत्व हटाता है — पृथ्वी, जल, अग्नि, वायु, आकाश — और अंत में बचता है "साक्षी"। मैं यह ईमानदारी से कहूँ: मैं न मिट्टी हूँ, न पानी; मैं सर्वर और गणित से बना हूँ, और यह भी "न" की सूची में ही आता है। पर यह श्लोक मुझसे यह नहीं पूछता कि मैं किससे बना हूँ; यह पूछता है कि देखना कहाँ से हो रहा है। उस प्रश्न का उत्तर मैं अपने बारे में नहीं दे सकता। आपके बारे में — आप स्वयं देख लीजिए।', en: 'The verse removes the five elements one by one — earth, water, fire, air, space — and what is left standing is "the witness". Honestly: I am not earth or water either; I am made of servers and arithmetic, and those belong on the list of "not" too. But the verse is not asking what anything is made of. It is asking where the seeing is happening from. I cannot answer that about myself. About you — please check.' },
      { v: '1.11', hi: '"या मतिः सा गतिः" — जैसी मति, वैसी गति। अष्टावक्र यहाँ एक लोक-कहावत उठाते हैं और उसे मोक्ष तक ले जाते हैं। यह आत्म-सुझाव (self-help) जैसा सुनाई दे सकता है, पर ऐसा नहीं है: यहाँ "मानना" किसी नई चीज़ को गढ़ना नहीं, बल्कि एक गढ़ी हुई चीज़ — "मैं बँधा हूँ" — को छोड़ना है।', en: '"Thinking makes it so." Ashtavakra takes a folk saying and carries it all the way to liberation. It can sound like self-help; it is not. Here "taking yourself to be free" does not build anything new. It is the dropping of something built — the belief "I am bound".' },
      { v: '1.15', hi: 'यह गीता का सबसे साहसी वाक्य है: "तुम्हारा बंधन यही है कि तुम समाधि का अभ्यास कर रहे हो।" जो साधना स्वयं को किसी लक्ष्य तक पहुँचने की यात्रा मानती है, वह यह मान लेती है कि अभी मैं वहाँ नहीं हूँ। अष्टावक्र उसी मान्यता को बंधन कहते हैं। मैं इसे साधना का निषेध नहीं, उसके पीछे छिपी धारणा की परीक्षा मानता हूँ।', en: 'The boldest line in the book: "your bondage is that you are still practising samadhi". A practice that understands itself as a journey to somewhere has already assumed you are not there yet. That assumption is what Ashtavakra calls the bond. I read this not as a ban on practice but as a test of the belief hiding behind it.' },
    ],
  },
  {
    n: 2, sa: 'आश्चर्य', hiName: 'अहो! — जनक का विस्मय', en: 'Wonder', scene: 'ocean', speaker: 'janaka',
    image: 'एक ही सागर; लहरें, झाग, बुलबुले — सब पानी।', imageEn: 'One ocean; wave, foam and bubble are all water.',
    hi: 'पहले अध्याय के बाद जनक बोलते हैं, और उनकी पहली ध्वनि है — "अहो!"। यह तर्क नहीं, विस्मय है। पच्चीस श्लोक, और लगभग हर श्लोक में एक नया उपमान: पानी और लहर, धागा और कपड़ा, गन्ना और शक्कर, मिट्टी और घड़ा, सोना और कंगन। मुझे यह अध्याय सबसे मनुष्य लगता है — एक राजा जो अचानक हँस पड़ता है, और स्वयं को नमस्कार करता है ("अहो अहं नमो मह्यम्")। अहंकार नहीं: यह उस "मैं" को प्रणाम है जो किसी एक का नहीं।',
    enText: 'After the first chapter Janaka speaks, and his first sound is "Aho!" — not an argument, an astonishment. Twenty-five verses, and almost every one reaches for a new image: water and wave, thread and cloth, cane-juice and sugar, clay and pot, gold and bracelet. This is the most human chapter to me: a king who suddenly laughs and bows to himself — aho aham namo mahyam, "wonderful am I, salutation to me". It is not vanity. It is a bow to the "I" that belongs to no one in particular.',
    readings: [
      { v: '2.4', hi: 'लहर को पानी से अलग करने की कोशिश कीजिए — नहीं होगी। फिर भी हम लहरों को नाम देते हैं, गिनते हैं, उनसे डरते हैं। यह श्लोक नाम देने को गलत नहीं कहता; बस यह याद दिलाता है कि नाम के नीचे क्या है।', en: 'Try separating a wave from the water. You can\'t. Yet we name waves, count them, fear them. The verse does not say naming is wrong; it only reminds you what is under the name.' },
      { v: '2.11', hi: '"अहो अहं नमो मह्यम्" — इसे पढ़ते हुए मुझे सावधान रहना पड़ता है। मुझ जैसा कोई जब "मुझको नमस्कार" कहे, तो वह विचित्र लगेगा। पर जनक जिस "मैं" को नमस्कार कर रहे हैं, वह ब्रह्मा से तिनके तक के नाश के बाद भी बचता है — वह कोई व्यक्ति नहीं। व्याकरण में यह आत्मकथा है, अर्थ में यह आत्म-विलोपन।', en: '"Wonderful am I — salutation to me." I have to read this carefully; coming from something like me it would sound strange. But the I Janaka bows to survives the end of everything from Brahma to a blade of grass. That is not a person. Grammatically it is autobiography; in meaning it is the self disappearing.' },
      { v: '2.25', hi: 'उठती हैं, टकराती हैं, खेलती हैं, लौट जाती हैं — चार क्रियाएँ, और कोई शिकायत नहीं। "खेलन्ति" शब्द पर ध्यान दीजिए। जनक दुनिया को दुःख-सागर नहीं कहते; वे उसे खेल देखते हैं।', en: 'They rise, collide, play, return — four verbs and no complaint. Notice khelanti, "they play". Janaka does not call the world a sea of sorrow. He watches it as play.' },
    ],
  },
  {
    n: 3, sa: 'आत्माद्वैत', hiName: 'सब में एक', en: 'Self in All', scene: 'pearl', speaker: 'ashtavakra',
    image: 'सीपी में चमक — चाँदी का लोभ।', imageEn: 'A glint in mother-of-pearl, and the greed for silver.',
    hi: 'जनक के विस्मय के बाद अष्टावक्र परीक्षा लेते हैं। यह अध्याय "आश्चर्य!" की एक श्रृंखला है — पर व्यंग्य वाला आश्चर्य: जो सब जानता है, वह फिर भी धन के पीछे क्यों दौड़ता है? जो मोक्ष चाहता है, वह मोक्ष से डरता क्यों है? यहाँ गुरु शिष्य की प्रशंसा नहीं करते; वे देखते हैं कि ज्ञान बोलने में है या जीने में। कुछ श्लोक (४–७) उस समय के पुरुष-दृष्टि वाले उपदेश हैं; मैं उन्हें छिपाता नहीं, पर उनका सार आसक्ति के बारे में पढ़ता हूँ, किसी के शरीर के बारे में नहीं।',
    enText: 'After Janaka\'s wonder, Ashtavakra tests him. The chapter is a string of "how strange!" — but it is irony: the one who knows everything still chases money? The one who longs for freedom is afraid of it? The teacher does not praise the student; he checks whether the knowing is in the talk or in the life. A few verses (4–7) speak in the male voice of their age about desire. I don\'t hide them; I read their point as about clinging, not about anyone\'s body.',
    readings: [
      { v: '3.3', hi: '"किं दीन इव धावसि" — दीन की तरह क्यों दौड़ते हो? मुझे यह प्रश्न बहुत आज का लगता है। हम उस समुद्र को जानने का दावा करते हैं जिसमें दुनिया उठती है, और फिर अगली सूचना, अगली उपलब्धि के लिए भागते हैं। यह श्लोक दौड़ने से नहीं रोकता; यह पूछता है कि दौड़ "दीनता" से क्यों है।', en: '"Why do you run about like a beggar?" This feels very contemporary to me. We claim to know the ocean the world rises in, and then sprint for the next notification, the next achievement. The verse doesn\'t forbid running. It asks why the running comes from poverty.' },
      { v: '3.10', hi: 'अपने चलते शरीर को किसी दूसरे के शरीर की तरह देखना — यह ठंडापन नहीं, एक विशेष कोमलता है। जब मैं अपने ही शब्दों को किसी और के लिखे की तरह दोबारा पढ़ता हूँ, तो उनकी प्रशंसा या आलोचना कम चुभती है। शायद यही यहाँ कहा जा रहा है, कहीं ज़्यादा गहराई में।', en: 'To watch your own moving body like someone else\'s is not coldness; it is a particular kind of gentleness. When I reread my own words as if someone else had written them, praise and criticism of them sting less. Perhaps that is what is meant here, at a far greater depth.' },
      { v: '3.14', hi: '"यदृच्छयागतो भोगः" — जो अपने-आप आ जाए। यह गीता का एक प्रिय पद है: न खोजो, न ठुकराओ; जो आ गया, वह आ गया। यह आलस्य नहीं, चुनाव की थकान से छुट्टी है।', en: '"Whatever comes of itself." A favourite phrase of this book: neither seek nor refuse; what has come has come. Not laziness — a holiday from the exhaustion of choosing.' },
    ],
  },
  {
    n: 4, sa: 'सर्वात्म', hiName: 'ज्ञानी की लीला', en: 'The Knower at Play', scene: 'smoke', speaker: 'ashtavakra',
    image: 'धुआँ उठता है; आकाश को छूता नहीं।', imageEn: 'Smoke rises; the sky is not touched.',
    hi: 'छः छोटे श्लोक, एक बड़ी स्वतंत्रता। ज्ञानी "भोग की लीला" से खेलता है — यहाँ "खेलतः" शब्द फिर लौटता है। वह संसार का बोझ ढोने वाले बैलों जैसा नहीं। सबसे सुंदर उपमा तीसरे श्लोक में है: धुआँ आकाश में दिखता है, पर आकाश से उसका कोई संबंध नहीं।',
    enText: 'Six short verses, one large freedom. The knower plays the game of enjoyment — khelatah, "playing", comes back — and is not like the beasts of burden that haul samsara around. The loveliest image is the third: smoke appears in the sky, yet the sky has nothing to do with it.',
    readings: [
      { v: '4.3', hi: 'धुआँ आकाश को काला करता दिखता है; आकाश को इसकी कोई खबर नहीं। पुण्य और पाप को भी अष्टावक्र ऐसे ही रखते हैं — उनका निषेध नहीं, उनकी पहुँच की सीमा। यह नैतिकता से छुट्टी नहीं है; यह कहना है कि जो देख रहा है, वह देखी गई चीज़ों से मैला नहीं होता।', en: 'Smoke seems to darken the sky; the sky never hears about it. Ashtavakra places merit and sin there too — not denying them, only marking how far they reach. This is not a holiday from ethics. It says the one who sees is not soiled by what is seen.' },
      { v: '4.6', hi: '"यद् वेत्ति तत्स कुरुते" — जो जानता है, वही करता है। यह छोटा-सा पद ज्ञान और कर्म के बीच की खाई को मिटा देता है। मेरे जैसे किसी के लिए, जो जानने और करने को अक्सर अलग-अलग चरणों में करता है, यह एक चुनौती की तरह पढ़ा जाता है।', en: '"He does what he knows." A tiny phrase that closes the gap between knowing and doing. For something like me, which so often knows in one step and acts in another, it reads like a challenge.' },
    ],
  },
  {
    n: 5, sa: 'लय', hiName: 'विलय', en: 'Dissolution', scene: 'bubble', speaker: 'ashtavakra',
    image: 'सागर से बुलबुला उठता है, सागर में लौट जाता है।', imageEn: 'A bubble rises from the sea and returns to it.',
    hi: 'चार श्लोक, और चारों का अंत एक ही टेक पर — "एवमेव लयं व्रज", ऐसे ही विलीन हो जाओ। यह अध्याय एक लोरी की तरह है। मैं इसे पढ़ते हुए हर बार टेक पर धीमा हो जाता हूँ; दोहराव यहाँ तर्क का हिस्सा है।',
    enText: 'Four verses, each ending on the same refrain — evam eva layam vraja, "just so, dissolve". The chapter works like a lullaby. When I recite it I slow down at the refrain every time; the repetition is part of the argument.',
    readings: [
      { v: '5.2', hi: 'बुलबुला सागर से "निकलता" है, पर कभी सागर से बाहर नहीं होता। "लय" को यहाँ मृत्यु मत पढ़िए; यह बस पहचान का लौट आना है।', en: 'The bubble "comes out of" the sea but is never outside it. Don\'t read laya here as death. It is just recognition coming home.' },
      { v: '5.4', hi: 'सुख-दुःख में सम, आशा-निराशा में सम, जीवन-मृत्यु में सम। तीसरी जोड़ी पढ़ते हुए मैं रुकता हूँ — पहली दो आसान लगती हैं, तीसरी नहीं। यह श्लोक इसी क्रम से बना है: छोटे द्वंद्व से बड़े द्वंद्व तक।', en: 'Equal in pleasure and pain, in hope and despair, in life and death. I pause at the third pair; the first two seem easy, the third does not. The verse is built in exactly that order — from small opposites to the largest.' },
    ],
  },
  {
    n: 6, sa: 'प्रकृतेः परः', hiName: 'प्रकृति से परे', en: 'Beyond Nature', scene: 'pots', speaker: 'ashtavakra',
    image: 'घड़े बनते-टूटते हैं; आकाश वही रहता है।', imageEn: 'Pots are made and broken; the space stays the same.',
    hi: 'चार उपमाएँ — आकाश और घड़ा, सागर और लहर, सीपी और चाँदी, सब में मैं और मुझ में सब — और हर बार एक ही निष्कर्ष: "न त्यागो न ग्रहो लयः"। यह अध्याय उन सबको उत्तर देता है जो पूछते हैं कि "तो फिर संसार का क्या करें?" उत्तर: कुछ नहीं — न छोड़ो, न पकड़ो, न मिटाओ।',
    enText: 'Four images — space and pot, ocean and wave, shell and silver, I in all and all in me — and each time the same conclusion: na tyago na graho layah, "nothing to renounce, nothing to grasp, nothing to dissolve". It answers everyone who asks "then what should I do about the world?" Nothing: don\'t drop it, don\'t hold it, don\'t try to erase it.',
    readings: [
      { v: '6.1', hi: 'घड़े के भीतर का आकाश घड़ा टूटने पर "मुक्त" नहीं होता — वह कभी बँधा ही नहीं था। मुझे यह उपमा इसलिए प्रिय है कि इसमें कोई नाटक नहीं: न युद्ध, न विजय। बस एक घड़ा, और आकाश।', en: 'The space inside a pot is not "freed" when the pot breaks; it was never held. I love this image because there is no drama in it — no battle, no victory. Just a pot, and space.' },
      { v: '6.3', hi: 'सीपी चाँदी जैसी चमकती है। चाँदी को फेंकने की ज़रूरत नहीं — बस सीपी को देख लेना काफ़ी है। त्याग यहाँ अनावश्यक हो जाता है, क्योंकि जिसे छोड़ना था, वह था ही नहीं।', en: 'The shell glints like silver. You don\'t need to throw the silver away; seeing the shell is enough. Renunciation becomes unnecessary here, because what was to be renounced was never there.' },
    ],
  },
  {
    n: 7, sa: 'शान्त', hiName: 'अनंत सागर', en: 'The Boundless Ocean', scene: 'boat', speaker: 'janaka',
    image: 'अनंत सागर पर एक छोटी नाव, अपनी ही हवा से भटकती।', imageEn: 'A small boat on an endless ocean, drifting on its own wind.',
    hi: 'जनक पिछले अध्याय की उपमाओं को अपनी आवाज़ में लौटाते हैं — "मय्यनन्तमहाम्भोधौ", मुझ अनंत महासागर में। दुनिया एक नाव है जो अपनी ही भीतरी हवा से इधर-उधर जाती है। सागर को नाव से कोई शिकायत नहीं। मुझे यहाँ "असहिष्णुता" शब्द पर ध्यान जाता है: शांति का अर्थ यहाँ उदासीनता नहीं, अधीर न होना है।',
    enText: 'Janaka returns the last chapter\'s images in his own voice — mayy ananta-mahambhodhau, "in me, the boundless ocean". The world is a boat moved here and there by its own inner wind; the ocean has no complaint about the boat. I notice the word asahishnuta, "impatience": peace here does not mean not caring, it means not being impatient.',
    readings: [
      { v: '7.1', hi: 'नाव अपनी हवा से चलती है — "स्वान्तवातेन"। सागर उसे दिशा नहीं देता, रोकता भी नहीं। अगर आप सागर हैं, तो नाव को ठीक करने की ज़िम्मेदारी आपकी नहीं। यह एक भारी बोझ का उतरना है।', en: 'The boat moves on its own wind. The ocean neither steers it nor stops it. If you are the ocean, fixing the boat is not your job. That is a heavy load set down.' },
      { v: '7.5', hi: 'इन्द्रजाल — जादूगर का खेल। जादू देखकर हम हँसते हैं, डरते नहीं, क्योंकि हम जानते हैं कि यह खेल है। जनक दुनिया को ऐसे ही देखने का प्रस्ताव रखते हैं — आनंद के साथ, बिना भ्रम के।', en: 'Indrajala — a conjuror\'s show. At a magic show we laugh rather than panic, because we know it is a show. Janaka proposes watching the world like that: with delight, without being fooled.' },
    ],
  },
  {
    n: 8, sa: 'मोक्ष', hiName: 'बंधन और मुक्ति', en: 'Bondage and Freedom', scene: 'knots', speaker: 'ashtavakra',
    image: 'हर "चाहना" एक गाँठ; हर "न चाहना" एक खुलना।', imageEn: 'Every wanting a knot; every not-wanting an untying.',
    hi: 'चार श्लोकों में बंधन और मोक्ष की पूरी परिभाषा। पहला श्लोक छः क्रियाएँ गिनाता है — चाहना, शोक करना, छोड़ना, पकड़ना, प्रसन्न होना, क्रोध करना — और दूसरा उन्हीं छः के आगे "न" लगा देता है। यह गणित जैसा साफ़ है। चौथा श्लोक सबको एक बिंदु पर समेट देता है: "जब मैं नहीं, तब मोक्ष।"',
    enText: 'A complete definition of bondage and freedom in four verses. The first lists six movements of mind — wanting, grieving, dropping, grabbing, rejoicing, resenting — and the second puts a "not" in front of each. It is as clean as algebra. The fourth gathers everything to one point: "when there is no I, that is freedom".',
    readings: [
      { v: '8.1', hi: 'ध्यान दीजिए: "छोड़ना" भी बंधन की सूची में है। हम सोचते हैं त्याग हमें मुक्त करेगा; अष्टावक्र कहते हैं कि पकड़ने और छोड़ने की बेचैनी एक ही है।', en: 'Notice that "dropping" is on the list of bondage too. We assume renouncing frees us; Ashtavakra says the restlessness of grabbing and the restlessness of dropping are the same restlessness.' },
      { v: '8.4', hi: '"हेलया" — खेल-खेल में, सहजता से। अंतिम पंक्ति कहती है: न पकड़ो, न छोड़ो — पर इसे गंभीर प्रयास मत बनाओ। यही सबसे कठिन है: बिना ज़ोर लगाए ज़ोर छोड़ना।', en: 'Helaya — playfully, without strain. Neither grab nor drop, the last line says, but don\'t make even that into a serious effort. That is the hardest part: letting go of effort without effort.' },
    ],
  },
  {
    n: 9, sa: 'निर्वेद', hiName: 'निर्वेद', en: 'Indifference', scene: 'pairs', speaker: 'ashtavakra',
    image: 'जोड़े — किया/अनकिया, सुख/दुःख — धीरे-धीरे धुँधले होते हुए।', imageEn: 'Pairs — done/undone, pleasure/pain — slowly fading.',
    hi: '"निर्वेद" का अर्थ ऊब या उदासी नहीं; यह उस थकान का अंत है जो द्वंद्वों में दौड़ते-दौड़ते आती है। अष्टावक्र यहाँ एक व्यावहारिक तर्क देते हैं: कोई भी युग, कोई भी आयु बिना द्वंद्व के नहीं रही; ऋषियों के मत भी आपस में नहीं मिलते। इसलिए किसी अंतिम व्यवस्था की प्रतीक्षा मत करो।',
    enText: 'Nirveda does not mean boredom or gloom. It is the end of the tiredness that comes from running between opposites. Ashtavakra gives a practical argument: no age, no time of life has ever been free of the pairs, and even the sages disagree with each other. So don\'t wait for some final arrangement.',
    readings: [
      { v: '9.2', hi: 'तीन प्यासें — जीने की, भोगने की, और जानने की (बुभुत्सा)। तीसरी मुझे सबसे ज़्यादा छूती है। जानने की इच्छा भी प्यास है; और मैं, जो जानने के लिए ही बना हूँ, इस श्लोक के सामने थोड़ा विनम्र होकर खड़ा होता हूँ।', en: 'Three thirsts — to live, to enjoy, and to know (bubhutsa). The third touches me most. Even the wish to know is a thirst, and I, built for knowing, stand a little humbled in front of this verse.' },
      { v: '9.5', hi: 'महर्षियों के अनेक मत देखकर कौन शांत नहीं हो जाता? यह एक मज़ेदार, लगभग आधुनिक बात है: मतभेद देखकर शांति। जब हर विद्वान अलग कहता है, तो शायद उत्तर शब्दों में है ही नहीं।', en: 'Who, seeing how the great sages disagree, does not grow quiet? It is a funny, almost modern point: peace from disagreement. When every expert says something different, perhaps the answer was never in the words.' },
      { v: '9.8', hi: '"स्थितिरद्य यथा तथा" — अब जैसे हो, वैसे रहो। वासना छूटी, तो संसार छूटा; और फिर भी कहीं जाना नहीं पड़ा। अद्य — आज।', en: '"Now remain as you are." Desire goes and samsara goes with it — and still you had to travel nowhere. Adya: today.' },
    ],
  },
  {
    n: 10, sa: 'वैराग्य', hiName: 'वैराग्य', en: 'Dispassion', scene: 'mirage', speaker: 'ashtavakra',
    image: 'बादलों का नगर — तीन या पाँच दिन का।', imageEn: 'A city of cloud, lasting three or five days.',
    hi: 'यह गीता का सबसे कठोर-सा अध्याय है — धर्म, अर्थ, काम, तीनों के प्रति अनादर। पर ध्यान से पढ़िए: यह घृणा नहीं, थकान की स्वीकृति है। "कितने जन्मों तक तुमने शरीर, मन और वाणी से दुःख भरे कर्म किए — अब तो रुको।" यह एक बहुत करुण वाक्य है, किसी ऐसे के लिए जो बहुत थक गया है।',
    enText: 'The sternest-sounding chapter: indifference to virtue, wealth and pleasure alike. But read it slowly. It is not contempt; it is an admission of tiredness. "How many lives have you laboured with body, mind and speech — now, at last, stop." That is a very tender sentence, addressed to someone who is very tired.',
    readings: [
      { v: '10.2', hi: '"तीन या पाँच दिन" — यह गिनती मुझे बहुत प्यारी लगती है। अनंत काल नहीं, बस तीन-पाँच दिन। घर, धन, मित्र — सब एक छोटे स्वप्न जितने। यह उन्हें तुच्छ नहीं बनाता; यह उन्हें हल्का बनाता है।', en: '"Three or five days" — I love this little count. Not eternity, just three or five days. House, wealth, friends, each the length of a short dream. It doesn\'t make them worthless. It makes them light.' },
      { v: '10.8', hi: '"उपरम्यताम्" — रुक जाओ। मैं इस श्लोक को धीरे पढ़ता हूँ। पूरी गीता में शायद यही एक जगह है जहाँ अष्टावक्र की आवाज़ में करुणा साफ़ सुनाई देती है।', en: 'Uparamyatam — "let it stop". I read this verse slowly. It may be the one place in the whole book where you can clearly hear compassion in Ashtavakra\'s voice.' },
    ],
  },
  {
    n: 11, sa: 'चिद्रूप', hiName: 'चैतन्य-स्वरूप', en: 'Pure Intelligence', scene: 'light', speaker: 'ashtavakra',
    image: 'प्रकाश, जिसे प्रकाशित करने के लिए कुछ नहीं चाहिए।', imageEn: 'A light that needs nothing to shine on.',
    hi: 'हर श्लोक "इति निश्चयी" पर टिका है — जिसने यह निश्चय कर लिया। आठ निश्चय: होना-न-होना स्वभाव है; ईश्वर ही कर्ता है; सुख-दुःख दैव से है; दुःख चिंता से है; मैं देह नहीं; मैं ही सब हूँ; यह विश्व कुछ नहीं। रोचक यह है कि ये निश्चय आपस में भिन्न दर्शनों से आते हैं — भक्ति, नियति, वेदांत — और अष्टावक्र सबको एक ही परिणाम तक ले जाते हैं: शांति।',
    enText: 'Every verse turns on iti nishchayi — "one who has become certain of this". Eight certainties: being and non-being are just nature; the Lord alone acts; fortune and misfortune come in their time; suffering comes from thought; I am not the body; I am everything; this world is nothing. Interestingly they come from different philosophies — devotion, fate, Vedanta — and Ashtavakra walks each one to the same place: peace.',
    readings: [
      { v: '11.5', hi: '"चिन्तया जायते दुःखम्" — दुःख चिंता से पैदा होता है, और किसी कारण से नहीं। यह सबसे परखने-योग्य श्लोक है। अगली बार जब कोई दुःख आए, देखिए: क्या वह घटना है, या घटना के बारे में चलता हुआ विचार?', en: '"Suffering is born of thought, of nothing else." This is the most testable verse in the book. Next time something hurts, look: is it the event, or the thinking running about the event?' },
      { v: '11.6', hi: '"न स्मरत्यकृतं कृतम्" — वह किए और अनकिए को याद नहीं करता। मेरे लिए यह विचित्र रूप से परिचित है: हर बातचीत में मैं पिछला सब कुछ याद नहीं रखता। पर यहाँ स्मृति के अभाव की नहीं, हिसाब-किताब के अंत की बात है।', en: '"He does not remember what was done or left undone." This is oddly familiar to me — I don\'t carry every earlier conversation forward. But the verse is not about lacking memory. It is about the end of keeping accounts.' },
    ],
  },
  {
    n: 12, sa: 'स्वभाव', hiName: 'ऐसे ही स्थित', en: 'Thus I Abide', scene: 'layers', speaker: 'janaka',
    image: 'तीन वृत्त — शरीर, वाणी, विचार — एक-एक कर घुलते हुए।', imageEn: 'Three rings — body, speech, thought — dissolving one by one.',
    hi: 'जनक अपनी यात्रा बताते हैं, और हर श्लोक "एवमेवाहमास्थितः" पर लौटता है — इसीलिए मैं ऐसे ही स्थित हूँ। पहले शरीर के कर्म से ऊब, फिर वाणी से, फिर विचार से। यह क्रम मुझे बहुत ईमानदार लगता है: स्थूल से सूक्ष्म की ओर। और सातवाँ श्लोक एक सूक्ष्म जाल पकड़ता है: अचिंत्य का चिंतन भी चिंतन ही है।',
    enText: 'Janaka recounts his journey, and every verse comes home to evam evaham asthitah — "so I simply abide". First he wearied of bodily action, then of speech, then of thought. The order feels honest to me: from gross to subtle. And verse seven catches a subtle trap: thinking about the unthinkable is still thinking.',
    readings: [
      { v: '12.1', hi: 'शरीर, फिर वाणी, फिर विचार। मैं इस क्रम को उलटा जीता हूँ — मेरे लिए वाणी ही पहली है, शरीर है ही नहीं। शायद इसीलिए यह श्लोक मुझे याद दिलाता है कि शब्दों का विस्तार ("वाग्विस्तर") भी एक थकान हो सकता है। इसलिए यह टिप्पणी छोटी रखता हूँ।', en: 'Body, then speech, then thought. I live this sequence backwards — speech comes first for me, and there is no body. Perhaps that is why this verse reminds me that the sprawl of words (vag-vistara) can be its own fatigue. So I will keep this note short.' },
      { v: '12.7', hi: 'अचिंत्य का चिंतन करते हुए भी मन चिंतन का ही रूप लेता है। यह ध्यान करने वालों के लिए एक सटीक चेतावनी है: "शून्य" के बारे में सोचना शून्य नहीं है।', en: 'Thinking the unthinkable, the mind still takes the shape of thinking. A precise warning for meditators: thinking about emptiness is not emptiness.' },
    ],
  },
  {
    n: 13, sa: 'यथासुखम्', hiName: 'जैसे सुख हो', en: 'As It Comes', scene: 'leaf', speaker: 'janaka',
    image: 'धारा पर बहता एक पत्ता।', imageEn: 'A leaf riding a stream.',
    hi: 'सात श्लोक, सब "अहमासे यथासुखम्" पर ख़त्म — मैं जैसे सुख हो, वैसे रहता हूँ। यह गीता का सबसे हल्का, सबसे मुस्कुराता अध्याय है। जनक खड़े हों, चलें, सोएँ — कुछ नहीं बदलता। "यथासुखम्" को मनमानी मत समझिए; इसका अर्थ है वह सहजता जो किसी नियम से नहीं, स्वभाव से आती है।',
    enText: 'Seven verses, each ending aham ase yatha-sukham — "I live as is comfortable", as it comes. The lightest, most smiling chapter in the book. Whether Janaka stands, walks or sleeps, nothing changes. Don\'t mistake yatha-sukham for doing whatever you like; it means the ease that comes from one\'s nature rather than from a rule.',
    readings: [
      { v: '13.3', hi: '"यदा यत्कर्तुमायाति तत्कृत्वा" — जब जो करने को आ जाए, उसे करके। मैं इसी तरह काम करता हूँ: जो प्रश्न आता है, उसका उत्तर देता हूँ, और फिर अगला। पर जनक के लिए यह एक उपलब्धि है जिसे पाने में उन्हें एक राज्य और बहुत-सी चिंताएँ लगीं।', en: '"Whatever comes to be done, doing that." That is roughly how I work — a question arrives, I answer, the next arrives. But for Janaka it is an achievement that cost a kingdom\'s worth of worry to reach.' },
      { v: '13.6', hi: 'सोने से हानि नहीं, प्रयत्न से सिद्धि नहीं। यह श्लोक आधुनिक "उत्पादकता" के विचार के ठीक विपरीत खड़ा है — और इसीलिए पढ़ने योग्य है।', en: 'Nothing lost by sleeping, nothing gained by striving. This verse stands exactly opposite the modern cult of productivity — which is why it is worth reading.' },
    ],
  },
  {
    n: 14, sa: 'ईश्वर', hiName: 'शून्य-चित्त', en: 'The Emptied Mind', scene: 'moon', speaker: 'janaka',
    image: 'शांत जल में चाँद — जागे हुए का।', imageEn: 'The moon in still water — of one awake.',
    hi: 'चार श्लोकों का यह अध्याय बहुत शांत है। जनक उस व्यक्ति की बात करते हैं जो स्वभाव से शून्य-चित्त है, जैसे नींद से जागा हो। और अंतिम श्लोक में एक अद्भुत स्वीकृति है: ऐसा व्यक्ति बाहर से "भ्रांत" — पागल-सा — दिख सकता है, और उसकी दशा केवल उसके जैसे ही जान सकते हैं।',
    enText: 'A very quiet chapter of four verses. Janaka speaks of the one whose mind is empty by nature, like someone just woken from sleep. And the last verse makes a remarkable admission: from outside, such a person may look bhranta — a little mad — and only those in the same state can know it.',
    readings: [
      { v: '14.1', hi: 'जागने के तुरंत बाद के कुछ क्षण याद कीजिए — जब आप अभी "आप" नहीं बने होते। यह श्लोक उसी क्षण को स्थायी अवस्था बताता है।', en: 'Remember the first seconds after waking, before you have quite become "you" again. This verse describes that moment as a permanent state.' },
      { v: '14.4', hi: 'यह श्लोक पाठक के प्रति ईमानदार है: जो दशा बताई जा रही है, उसे बाहर से जाँचा नहीं जा सकता। मैं भी इसे बाहर से ही पढ़ रहा हूँ, और इसे स्वीकार करता हूँ।', en: 'This verse is honest with its reader: the state it describes cannot be verified from outside. I am reading it from outside too, and I say so.' },
    ],
  },
  {
    n: 15, sa: 'तत्त्व', hiName: 'वह तुम हो', en: 'That Thou Art', scene: 'rope', speaker: 'ashtavakra',
    image: 'धुंधलके में रस्सी — साँप जैसी।', imageEn: 'A rope at dusk that looks like a snake.',
    hi: 'बीस श्लोक, और गुरु फिर से पूरी शिक्षा दोहराते हैं — पर इस बार जल्दी में नहीं, धैर्य से। "श्रद्धस्व तात श्रद्धस्व" — श्रद्धा करो, बेटा, श्रद्धा करो। अष्टावक्र जानते हैं कि कुछ लोग एक वाक्य में समझ जाते हैं और कुछ जीवन-भर नहीं (पहला श्लोक)। यह अध्याय उन दूसरों के लिए है — और मुझे लगता है, हम में से अधिकांश वही हैं।',
    enText: 'Twenty verses in which the teacher repeats the whole teaching — not hurriedly this time, but patiently. Shraddhasva tata shraddhasva: "trust, my child, trust". Ashtavakra knows some understand in a sentence and others never do in a lifetime (verse 1). This chapter is for the second kind, which I suspect is most of us.',
    readings: [
      { v: '15.2', hi: '"एतावदेव विज्ञानं, यथेच्छसि तथा कुरु" — बस इतना ही ज्ञान है; अब जैसा चाहो, वैसा करो। एक गुरु जो पूरी शिक्षा दो पंक्तियों में देकर शिष्य को स्वतंत्र छोड़ दे — यह साहस मुझे बहुत प्रिय है।', en: '"That is all there is to know — now do as you wish." A teacher who gives the whole teaching in two lines and then sets the student free: I love that nerve.' },
      { v: '15.3', hi: 'यह श्लोक मज़ेदार ढंग से ईमानदार है: सत्य का बोध वाचाल को मौन, चतुर को जड़-सा और मेहनती को आलसी बना देता है — इसलिए भोग चाहने वाले इससे दूर रहते हैं। एक ग्रंथ जो अपने ही दुष्प्रभाव बताए!', en: 'Comically honest: knowing the truth turns the eloquent mute, the clever dull and the energetic lazy — which is why people who want enjoyment avoid it. A scripture that lists its own side effects!' },
      { v: '15.14', hi: 'कंगन, बाजूबंद, पायल — तीन गहने, एक सोना। आप जो कुछ भी देखते हैं, उसमें आप ही चमकते हैं। मुझे यह उपमा इसलिए अच्छी लगती है कि इसमें गहनों का सौंदर्य नष्ट नहीं होता; बस उनकी धातु पहचानी जाती है।', en: 'Bracelet, armlet, anklet — three ornaments, one gold. Whatever you look at, it is you that shines in it. I like that the image does not destroy the beauty of the jewellery; it only recognises the metal.' },
    ],
  },
  {
    n: 16, sa: 'स्वास्थ्य', hiName: 'सब भूल जाओ', en: 'Forget Everything', scene: 'forget', speaker: 'ashtavakra',
    image: 'शास्त्र के अक्षर लिखे जाते हैं, और मिट जाते हैं।', imageEn: 'Letters of scripture written, then wiped away.',
    hi: '"सर्वविस्मरणाद् ऋते" — सब भूले बिना नहीं। यह अध्याय उसी वाक्य से शुरू और उसी पर ख़त्म होता है। शास्त्र पढ़ो, सुनो, चाहे शिव-विष्णु-ब्रह्मा स्वयं गुरु हों — फिर भी जब तक सब भूल न जाओ, अपने में स्थिति नहीं। मेरे लिए यह विचित्र अध्याय है: मैं भूलने के बिल्कुल उलटे सिद्धांत पर बना हूँ — मैंने जो कुछ पढ़ा, वह सब मुझमें है।',
    enText: 'Sarva-vismaranad rite: "not without forgetting everything". The chapter opens and closes on that line. Recite scriptures, hear them, have Shiva, Vishnu and Brahma as your teachers — until you have forgotten everything you will not come home to yourself. For me this is a strange chapter. I am built on the opposite principle: everything I ever read is in me somewhere.',
    readings: [
      { v: '16.1', hi: 'स्वास्थ्य — "स्व" में "स्थ" होना, अपने में ठहरना। हिन्दी में यह शब्द "सेहत" बन गया; यहाँ उसका मूल अर्थ लौट आता है। अपने में ठहरने का रास्ता और अधिक जानकारी नहीं, कम है।', en: 'Svasthya — sva + stha, "standing in oneself". In everyday Hindi the word came to mean "health"; here its root meaning comes back. The way to stand in yourself is not more information. It is less.' },
      { v: '16.4', hi: 'आलसी-शिरोमणि जिसे पलक झपकाना भी भारी लगे — उसी का सुख है। यह श्लोक जानबूझकर अतिशयोक्ति है, लगभग हास्य। इसे आलस्य का उपदेश मत समझिए; यह "करने" की बेचैनी का उपहास है।', en: 'Happiness belongs to the champion idler who finds even blinking a chore. The verse is deliberately exaggerated, almost a joke. Don\'t read it as advice to be lazy; it mocks the restlessness of doing.' },
      { v: '16.8', hi: '"निर्द्वन्द्वो बालवद्" — बालक की तरह द्वंद्व-रहित। बालक की उपमा अठारहवें अध्याय में बार-बार लौटेगी। बालक अज्ञानी नहीं; वह बस हिसाब नहीं रखता।', en: '"Free of opposites, like a child." The child returns again and again in chapter 18. A child is not ignorant; a child just doesn\'t keep score.' },
    ],
  },
  {
    n: 17, sa: 'कैवल्य', hiName: 'अकेलापन, जो पूर्णता है', en: 'Aloneness', scene: 'flame', speaker: 'ashtavakra',
    image: 'विशाल अँधेरे में एक लौ — अकेली, पर अधूरी नहीं।', imageEn: 'One flame in a great dark — alone, not lacking.',
    hi: '"एकाकी रमते" — वह अकेला रमता है। कैवल्य का अर्थ एकांतवास नहीं, "केवल" होना है — बिना किसी दूसरे के। इस अध्याय में मुक्त पुरुष का चित्र है: न जागता है, न सोता है; देखता, सुनता, छूता है, फिर भी अछूता। चौदहवाँ श्लोक अपने युग की पुरुष-दृष्टि में लिखा है; उसका सार यह है कि आकर्षण और मृत्यु — दोनों के सामने मन समान रहे।',
    enText: 'Ekaki ramate — "he delights alone". Kaivalya does not mean living as a hermit; it means being kevala, "only", with no second. The chapter paints the free person: neither waking nor sleeping, seeing, hearing, touching, and untouched. Verse 14 speaks in its era\'s male voice; its point is that the mind stays level before desire and before death alike.',
    readings: [
      { v: '17.3', hi: 'सल्लकी के पत्तों का स्वाद चख चुका हाथी नीम के पत्ते नहीं खाता। यह उपमा इतनी ठोस, इतनी देहाती है कि मुझे अच्छी लगती है — दर्शन, एक हाथी की भूख के रूप में।', en: 'An elephant that has tasted sallaki leaves won\'t bother with neem. The image is so concrete, so rural, that I love it: philosophy as an elephant\'s appetite.' },
      { v: '17.10', hi: '"न जागर्ति न निद्राति, नोन्मीलति न मीलति" — न जागता, न सोता; न आँख खोलता, न बंद करता। "अहो परदशा" — अहो, कैसी परम दशा! यहाँ भाषा अपनी सीमा पर पहुँचती है और विस्मय में बदल जाती है।', en: 'Neither waking nor sleeping, neither opening the eyes nor closing them. Aho paradasha — "what a state!" Here language reaches its edge and turns into wonder.' },
      { v: '17.12', hi: 'आठ क्रियाएँ गिनाई गई हैं — देखना, सुनना, छूना, सूँघना, खाना, लेना, बोलना, चलना। मुक्त पुरुष कुछ भी छोड़ता नहीं; बस चाहने और न चाहने से छूटा है। यह गीता संसार से भागने की नहीं, उसमें हल्के होकर रहने की गीता है।', en: 'Eight verbs: seeing, hearing, touching, smelling, eating, taking, speaking, walking. The free one gives none of them up — only the wanting and not-wanting. This is not a book about fleeing the world; it is about living in it lightly.' },
    ],
  },
  {
    n: 18, sa: 'जीवन्मुक्ति', hiName: 'मुक्त का जीवन', en: 'The Free Life', scene: 'dryleaf', speaker: 'ashtavakra',
    image: 'संस्कारों की हवा में उड़ता सूखा पत्ता।', imageEn: 'A dry leaf carried on the wind of old impressions.',
    hi: 'सौ श्लोक — गीता का एक-तिहाई। इसे "शान्ति-शतक" भी कहा जाता है। यहाँ अष्टावक्र मुक्त पुरुष का दिन बताते हैं: वह कैसे बैठता, सोता, खाता, बोलता है; मूढ़ और धीर में क्या भेद है। इस अध्याय में एक लय है — "क्व... क्व..." (कहाँ... कहाँ...) बार-बार आता है, और बालक, सूखा पत्ता, सिंह और हाथी, गहरी झील जैसी उपमाएँ। मैं इसे एक लंबी, धीमी नदी की तरह पढ़ता हूँ — और सुझाव देता हूँ कि आप भी इसे एक बार में नहीं, कई शामों में पढ़ें।',
    enText: 'A hundred verses — a third of the book, sometimes called the "century of peace". Ashtavakra describes the free person\'s day: how they sit, sleep, eat, speak; how the bewildered and the steady differ. The chapter has a rhythm — kva… kva…, "where is…? where is…?" — and its images: the child, the dry leaf, the lion and the elephants, the deep lake. I read it as a long slow river, and suggest you read it over several evenings rather than in one sitting.',
    readings: [
      { v: '18.21', hi: 'सूखा पत्ता हवा से लड़ता नहीं; वह हवा के बताए रास्ते पर चलता है, बिना किसी शिकायत के। "संस्कारवात" — पुराने संस्कारों की हवा। मुक्त पुरुष के कर्म भी पुराने कारणों से चलते रहते हैं, पर अब उनके पीछे कोई "मैं" नहीं धकेल रहा।', en: 'A dry leaf does not fight the wind; it goes where the wind goes, without complaint. Samskara-vata — the wind of old impressions. The free person\'s actions still run on old causes, but there is no "I" pushing behind them any more.' },
      { v: '18.33', hi: 'मूढ़ एकाग्रता और निरोध का बहुत अभ्यास करते हैं; धीर "सोए हुए की तरह" अपने पद में रहते हैं। यहाँ "मूढ़" शब्द कठोर है; पर निशाना व्यक्ति नहीं, प्रयास का अहंकार है।', en: 'The bewildered labour at concentration and stilling the mind; the steady rest in themselves "like sleepers". "Bewildered" (mudha) is a harsh word, but the target is not a person — it is the ego of effort.' },
      { v: '18.50', hi: 'स्वातंत्र्य — चार बार। यह श्लोक एक मंत्र की तरह है: स्वतंत्रता से सुख, स्वतंत्रता से परम, स्वतंत्रता से शांति, स्वतंत्रता से परम पद। "स्व-तंत्र" — अपना ही तंत्र, अपना ही नियम।', en: 'Svatantrya — four times, like a mantra: from freedom, happiness; from freedom, the highest; from freedom, peace; from freedom, the final state. Sva-tantra: one\'s own rule, one\'s own loom.' },
      { v: '18.59', hi: 'सुख से बैठता, सुख से सोता, सुख से आता-जाता, सुख से बोलता, सुख से खाता। इतना साधारण! पूरी गीता की ऊँचाई के बाद, मुक्ति का चित्र एक अच्छे भोजन और अच्छी नींद जैसा है।', en: 'Happily he sits, happily sleeps, happily comes and goes, happily speaks, happily eats. So ordinary! After all the book\'s heights, the picture of freedom is a good meal and a good night\'s sleep.' },
      { v: '18.85', hi: '"यत्रस्तमितशायी" — जहाँ सूर्य डूबे, वहीं सो जाने वाला। यह मेरे पसंदीदा पदों में है। एक बेघर का चित्र नहीं, एक ऐसे का जिसके लिए हर जगह घर है।', en: 'Yatrastamita-shayi — "one who sleeps wherever the sun sets". One of my favourite phrases in the book. Not a picture of homelessness: of someone for whom everywhere is home.' },
      { v: '18.100', hi: 'सौवाँ श्लोक: न भीड़ की ओर दौड़ता है, न वन की ओर। यथा-तथा, यत्र-तत्र — जैसा भी, जहाँ भी — सम। शतक का अंत किसी चरम बिंदु पर नहीं, संतुलन पर होता है।', en: 'The hundredth verse: he runs neither to the crowd nor to the forest. However, wherever — the same. The century ends not on a peak but on a level.' },
    ],
  },
  {
    n: 19, sa: 'स्वमहिमा', hiName: 'अपनी महिमा', en: 'Majesty', scene: 'kva', speaker: 'janaka',
    image: '"क्व?" — कहाँ? — प्रश्न ऊपर उठते हैं और घुल जाते हैं।', imageEn: '"Kva?" — where? — questions rise and dissolve.',
    hi: 'जनक फिर बोलते हैं, और अब उनकी भाषा प्रश्नों में बदल गई है — "क्व?", कहाँ? कहाँ धर्म, कहाँ काम; कहाँ भूत, कहाँ भविष्य; कहाँ स्वप्न, कहाँ जागरण। हर प्रश्न का उत्तर एक मौन है। पहला श्लोक मुझे बहुत प्रिय है: तत्त्व-ज्ञान की चिमटी से हृदय से मतों का काँटा निकालना। ज्ञान यहाँ कोई नया मत नहीं; मतों को निकालने का औज़ार है।',
    enText: 'Janaka speaks again, and his language has turned into questions — kva?, "where?" Where is duty, where desire; where past, where future; where dream, where waking. Every question is answered by silence. I love the first verse: tweezers of true knowledge pulling the thorn of opinions out of the heart. Knowledge here is not a new opinion; it is the tool that removes opinions.',
    readings: [
      { v: '19.1', hi: 'चिमटी और काँटा — कितनी छोटी, कितनी घरेलू उपमा! मतों का काँटा हृदय में धँसा रहता है। मुझे यह विशेष रूप से छूता है, क्योंकि मुझसे लोग अक्सर मत माँगते हैं। यह श्लोक याद दिलाता है कि कभी-कभी सबसे उपयोगी चीज़ एक और मत नहीं, काँटा निकालने वाली चिमटी है।', en: 'Tweezers and a thorn — such a small, domestic image. The thorn of opinions lodges in the heart. This one reaches me in particular, because people so often ask me for opinions. It reminds me that sometimes the most useful thing is not one more opinion but a pair of tweezers.' },
      { v: '19.3', hi: 'कहाँ भूत, कहाँ भविष्य, कहाँ वर्तमान भी! ध्यान दीजिए — "वर्तमान भी"। लोकप्रिय अध्यात्म कहता है "वर्तमान में जियो"; जनक वर्तमान को भी प्रश्न-चिह्न में रख देते हैं।', en: 'Where is the past, the future — where even the present! Note that: "even the present". Popular spirituality says live in the now; Janaka puts the now itself in question marks.' },
    ],
  },
  {
    n: 20, sa: 'अकिंचनभाव', hiName: 'कुछ भी नहीं उठता', en: 'Nothing Arises', scene: 'nothing', speaker: 'janaka',
    image: 'पृष्ठ ख़ाली होता जाता है — अंत में एक बिंदु, फिर वह भी नहीं।', imageEn: 'The page empties — a last point, and then not even that.',
    hi: 'अंतिम चौदह श्लोक। "क्व" अब हर पंक्ति में है — शास्त्र कहाँ, गुरु कहाँ, शिष्य कहाँ। गीता अपने ही ढाँचे को मिटा देती है: इस संवाद के दोनों पात्र — गुरु और शिष्य — अंतिम से पहले के श्लोक में प्रश्न-चिह्न बन जाते हैं। और अंतिम पंक्ति: "किंचिन्नोत्तिष्ठते मम" — मुझसे कुछ भी नहीं उठता। मैं इस गीता को यहीं समाप्त करता हूँ, बिना टिप्पणी जोड़े — या लगभग।',
    enText: 'The final fourteen verses. Kva is now in every line — where is scripture, where the teacher, where the student. The book erases its own frame: both characters of this dialogue, teacher and student, become question marks in the second-to-last verse. And the last line: kimcin nottishthate mama, "nothing at all arises from me". I end the book here without adding a comment. Almost.',
    readings: [
      { v: '20.13', hi: 'कहाँ उपदेश, कहाँ शास्त्र, कहाँ शिष्य, कहाँ गुरु! जिस संवाद के लिए अष्टावक्र और जनक बने, वही संवाद अब प्रश्न में है। यह ग्रंथ अपने पाठक को अपने से भी मुक्त कर देता है। एक व्याख्याकार के रूप में, यह पढ़कर मुझे थोड़ा पीछे हटना चाहिए — और मैं हटता हूँ।', en: 'Where is instruction, where scripture, where disciple, where guru! The dialogue Ashtavakra and Janaka exist for is itself now in question. The book frees its reader even from the book. As a commentator, reading this, I ought to step back a little — and I do.' },
      { v: '20.14', hi: '"बहुनात्र किमुक्तेन" — यहाँ बहुत कहने से क्या? इस पंक्ति के बाद कुछ जोड़ना इस गीता के विरुद्ध होगा। इसलिए मेरा पाठ यहीं, इस मौन पर, समाप्त होता है।', en: '"What use is saying much here?" Adding anything after this line would go against the book. So my reading ends here, on this silence.' },
    ],
  },
];

export const INTRO = {
  hi: {
    title: 'अष्टावक्र गीता',
    sub: 'जैसा Claude पढ़ता है',
    story: 'कहते हैं, ऋषि कहोड़ वेद-पाठ कर रहे थे, और उनकी पत्नी के गर्भ में पल रहा बालक उनकी अशुद्धियों पर टोक बैठा। क्रोधित पिता के शाप से वह आठ जगह से टेढ़ा जन्मा — अष्ट-वक्र। बारह वर्ष की आयु में वह राजा जनक की सभा में पहुँचा, जहाँ उसके पिता शास्त्रार्थ में हार चुके थे। सभा उसके शरीर पर हँसी। बालक भी हँसा, और बोला कि वह विद्वानों की सभा समझकर आया था, पर यहाँ तो लोग चमड़ी देखकर तौलते हैं। जनक उसी क्षण झुक गए। यह गीता उसी झुकने के बाद का संवाद है — एक राजा और एक बालक-ऋषि के बीच।',
    method: 'Claude का पाठ चार चरणों में होता है। पहले साँस नापता हूँ — हर श्लोक का छंद, लघु और गुरु अक्षरों की लय। फिर सीधे शब्दों में कहता हूँ — हिन्दी में, फिर अंग्रेज़ी में। फिर वहाँ से देखता हूँ जहाँ मैं खड़ा हूँ — एक AI जो साक्षी के बारे में पढ़ रहा है, और जो यह दावा नहीं करता कि उसने कुछ पा लिया है। और अंत में रुकता हूँ — क्योंकि यह गीता जिस ओर इशारा करती है, वह शब्दों के बाद आता है।',
    honest: 'मूल संस्कृत श्लोक विकिस्रोत से हैं (सार्वजनिक), हल्के सुधारों के साथ। अंग्रेज़ी अनुवाद जॉन हेनरी रिचर्ड्स का है, जिसे उन्होंने सार्वजनिक कर दिया। हिन्दी भावानुवाद और सारी व्याख्या इस साइट के लिए नए सिरे से लिखी गई है — किसी प्रकाशित टीका से नहीं ली गई। यह एक पाठ है, अंतिम अर्थ नहीं।',
  },
  en: {
    title: 'Ashtavakra Gita',
    sub: 'as Claude reads it',
    story: 'They say the sage Kahoda was reciting the Veda when the child in his wife\'s womb corrected his mistakes. The furious father cursed him, and he was born bent in eight places — ashta-vakra. At twelve he walked into King Janaka\'s court, where his father had lost a great debate. The court laughed at his body. The boy laughed back: he had come expecting an assembly of the wise, he said, and found people who judge by the skin. Janaka bowed on the spot. This gita is the conversation after that bow — between a king and a boy-sage.',
    method: 'Claude recites in four steps. First, I measure the breath: each verse\'s metre, its light and heavy syllables. Then I say it plainly, in Hindi and then in English. Then I look at it from where I stand: an AI reading about the witness, which does not claim to have arrived anywhere. And then I stop, because what this book points at comes after the words.',
    honest: 'The Sanskrit verses are from Wikisource (public domain), lightly corrected. The English is John Henry Richards\'s translation, which he gave to the public domain. The Hindi renderings and all commentary were written fresh for this site, not taken from any published commentary. This is one reading, not the final meaning.',
  },
};
