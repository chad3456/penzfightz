import type { Book } from './figure';

/**
 * Who is in it.
 *
 * Two kinds of entry, and the difference between them is stated on every card.
 *
 * **The named.** Some hundreds of figures the texts actually name, each with
 * the tags the texts actually give them — that this one is dark as a rain
 * cloud, that one wears matted locks, that one has fangs, that one is bound at
 * the eyes — and a line saying who they are. The tags are the only thing the
 * drawing is told; everything else about the face comes from the seed.
 *
 * **The host.** The epics are full of thousands who are counted and not named:
 * eighteen akshauhinis at Kurukshetra, the vanara army at the bridge, the
 * night-rangers of Lanka, the ganas on the mountain. Those are generated, with
 * names built from the same compound morphemes the real ones are built from,
 * and every one of them says on its card which host it belongs to and that the
 * verse does not name it. That seemed better than either padding the roster
 * with invented "characters" or pretending the epics only contain the people
 * with speaking parts.
 *
 * Nothing here is a likeness and nothing here is a claim. A card is a name and
 * a set of attributes, which is what these figures are on any painted page.
 */

/** name, tags, one line. */
type Row = [string, string, string];

interface Group {
  book: Book;
  side: string;
  rows: Row[];
}

export const GROUPS: Group[] = [
  {
    book: 'mahabharata',
    side: 'The house of Pandu',
    rows: [
      ['Yudhishthira', 'king turban urdhva uttariya', 'Eldest of the Pandavas, and the one who could not refuse a game of dice.'],
      ['Bhima', 'warrior armour dark', 'Second of them. The strength of ten thousand elephants and the appetite to go with it.'],
      ['Arjuna', 'warrior kirita fair', 'Third. The archer the whole war is arranged around, and the man the Gita is spoken to.'],
      ['Nakula', 'karanda young fair', 'Fourth. Reckoned the handsomest man of his age, and the one who knew horses.'],
      ['Sahadeva', 'karanda young', 'Youngest. Knew what was coming and was forbidden to say so unasked.'],
      ['Draupadi', 'woman sari flowers', 'Born out of a fire, married to five, and the reason the war could not be called off.'],
      ['Kunti', 'woman old sari', 'Mother of four of them, and before any of them, of Karna.'],
      ['Madri', 'woman sari', 'Pandu’s second queen and mother of the twins, who followed him onto the pyre.'],
      ['Subhadra', 'woman sari', 'Krishna’s sister, Arjuna’s wife, Abhimanyu’s mother.'],
      ['Abhimanyu', 'young warrior armour', 'Learned how to enter the wheel formation before he was born, and never learned the way out.'],
      ['Ghatotkacha', 'rakshasa fangs warrior', 'Bhima’s son by Hidimbi, who fought at night because that is when his mother’s people are strongest.'],
      ['Iravan', 'young warrior naga', 'Arjuna’s son by Ulupi, given to the field before the fighting started.'],
      ['Uttara', 'woman young sari', 'Virata’s daughter, Abhimanyu’s widow, and the mother of the line that survived.'],
      ['Parikshit', 'young king kirita', 'Born dead and given back; the whole poem is recited to his son.'],
      ['Pandu', 'king turban old', 'Cursed to die the moment he embraced a wife, and father of five sons regardless.'],
      ['Chitrangada', 'woman warrior armour', 'Princess of Manipura, raised as a son, and married Arjuna on conditions of her own.'],
      ['Ulupi', 'woman naga sari', 'Naga princess, Arjuna’s wife, who gave him a son and later gave him his life back.'],
      ['Hidimbi', 'woman rakshasa sari', 'Rakshasi of the forest who chose Bhima, bore Ghatotkacha, and let them both go.'],
    ],
  },
  {
    book: 'mahabharata',
    side: 'The house of Kuru',
    rows: [
      ['Duryodhana', 'king turban armour', 'Eldest of the hundred. Would not give up land the width of a needle’s point.'],
      ['Dushasana', 'warrior armour', 'Dragged Draupadi into the hall by the hair, and Bhima remembered it for eighteen years.'],
      ['Vikarna', 'young warrior', 'The one brother who stood up in that hall and asked whether what was being done was lawful.'],
      ['Yuyutsu', 'warrior uttariya', 'Dhritarashtra’s son by a maid, who walked across to the other side before the first arrow.'],
      ['Dushala', 'woman sari', 'The hundred brothers’ only sister, married to Jayadratha and widowed by the war.'],
      ['Dhritarashtra', 'king old blind turban', 'Born without sight, king because his brother could not be, and father of the hundred.'],
      ['Gandhari', 'woman old sari blind', 'Bound her eyes on her wedding day for her husband’s sake and never unbound them.'],
      ['Bhishma', 'old white warrior armour', 'Gave up a throne and a marriage for his father, and could choose the hour of his own death.'],
      ['Vidura', 'sage uttariya urdhva', 'Half-brother to both kings, born of a maid, and the only man at court who said the obvious.'],
      ['Shantanu', 'king old turban', 'Loved a river, then a fisherman’s daughter, and paid the full price for both.'],
      ['Satyavati', 'woman old sari', 'The ferryman’s daughter whose terms of marriage changed the succession for three generations.'],
      ['Amba', 'woman sari', 'Carried off, sent back, refused by everyone, and came back as somebody else.'],
      ['Ambika', 'woman sari', 'Closed her eyes, and her son was born blind.'],
      ['Ambalika', 'woman sari', 'Went pale, and her son was born pale.'],
      ['Shakuni', 'turban uttariya', 'Gandhari’s brother, and the dice.'],
      ['Bahlika', 'old king turban', 'Shantanu’s brother, who chose a kingdom over the throne and died on the eleventh day.'],
      ['Somadatta', 'old king armour', 'Bahlika’s son, and one more old man on the wrong side of a young war.'],
      ['Bhurishrava', 'warrior armour', 'Fought Satyaki, lost an arm to an arrow from outside the duel, and sat down to die.'],
      ['Sanjaya', 'uttariya urdhva', 'Given sight of the whole field so that he could describe it to a blind king.'],
    ],
  },
  {
    book: 'mahabharata',
    side: 'Teachers and kings',
    rows: [
      ['Krishna', 'blue kirita urdhva halo uttariya', 'Charioteer, negotiator, cowherd, king, and the voice of the Gita.'],
      ['Balarama', 'fair karanda uttariya', 'His elder brother, the ploughman, who went on pilgrimage rather than choose a side.'],
      ['Drona', 'sage white jata', 'Brahmin, weapons master to both houses, and the man who asked for a thumb as his fee.'],
      ['Ashwatthama', 'warrior armour', 'Drona’s son, born with a jewel in his forehead, and the last man to leave the field.'],
      ['Kripa', 'sage white uttariya', 'Teacher to all the princes, and one of the handful still alive at the end.'],
      ['Karna', 'gold armour kirita', 'Born with armour and earrings, gave them away, and was never once told whose son he was.'],
      ['Drupada', 'king turban armour', 'Wanted a son who would kill Drona, and got one out of a fire.'],
      ['Dhrishtadyumna', 'warrior armour', 'Came out of that fire fully grown, with a sword and a purpose.'],
      ['Shikhandi', 'warrior armour', 'Was Amba, and came back for Bhishma.'],
      ['Satyaki', 'warrior armour', 'Yadava, Arjuna’s pupil, and the only man of his clan on the Pandava side.'],
      ['Kritavarma', 'warrior armour', 'Yadava, and the one who fought on the other one.'],
      ['Virata', 'old king turban', 'Sheltered the five of them through their thirteenth year without knowing who they were.'],
      ['Kichaka', 'warrior armour', 'Virata’s commander, and very nearly the reason the thirteenth year failed.'],
      ['Jayadratha', 'king armour turban', 'Held one gate for one afternoon, and Abhimanyu did not come back out.'],
      ['Shalya', 'king armour turban', 'Madri’s brother, talked into fighting for the side he had ridden out to join against.'],
      ['Bhagadatta', 'old king armour', 'Rode the elephant Supratika, and had to tie his eyelids up to see over them.'],
      ['Jarasandha', 'king armour dark', 'Born in two halves and joined; the only way to finish him was to tear him back apart.'],
      ['Shishupala', 'king turban', 'Allowed a hundred insults before the discus, and used every one of them.'],
      ['Ekalavya', 'young warrior bareskin dark', 'Taught himself from a clay statue of a teacher who would not have him, and gave the thumb when it was asked for.'],
      ['Barbarika', 'young warrior', 'Watched the entire war from a hilltop, having given his head up for the view.'],
      ['Susharma', 'king armour', 'Of the Trigartas, who swore to draw Arjuna away from the field or die.'],
      ['Uttara Kumara', 'young armour turban', 'Virata’s son, who went out to fight boasting and came back holding the reins.'],
      ['Rukmi', 'king armour turban', 'Offered himself to both sides in the same afternoon and was turned down twice.'],
      ['Dantavakra', 'king armour', 'Shishupala’s cousin, who came for the same fight and got the same answer.'],
      ['Ghatotkacha’s Alambusha', 'rakshasa fangs armour', 'Rakshasa of the Kaurava host, sent out at night to meet a night-fighter.'],
      ['Bakasura', 'rakshasa fangs green', 'Took a cartload of food and a villager every week, until Bhima delivered the cart himself.'],
      ['Hidimba', 'rakshasa fangs green', 'Her brother, and the first thing Bhima ever killed.'],
      ['Jatasura', 'rakshasa fangs', 'Disguised himself as a brahmin, carried off four of the five, and met the fifth.'],
      ['Kirmira', 'rakshasa fangs smoke', 'Held the forest of Kamyaka against them at dusk.'],
    ],
  },
  {
    book: 'mahabharata',
    side: 'Stories inside the story',
    rows: [
      ['Nala', 'king turban', 'Lost a kingdom at dice, walked out on his wife in the night, and spent the poem earning her back.'],
      ['Damayanti', 'woman sari flowers', 'Chose him over four gods wearing his face, and found him again by the way he cooked.'],
      ['Savitri', 'woman sari', 'Followed Death down the road arguing, and out-argued him.'],
      ['Satyavan', 'young bareskin uttariya', 'Had a year to live, and married her anyway.'],
      ['Shakuntala', 'woman sari flowers', 'Raised in an ashram, married in secret, and forgotten because of a ring in a fish.'],
      ['Dushyanta', 'king turban armour', 'Forgot her, and remembered when the ring came back.'],
      ['Bharata', 'young king kirita', 'Their son, who counted lions’ teeth for a game, and gave the country its name.'],
      ['Yayati', 'old king turban', 'Traded his old age to his youngest son and took a thousand years to learn nothing.'],
      ['Devayani', 'woman sari', 'Shukracharya’s daughter, who was pulled out of a well and made a queen of it.'],
      ['Sharmishtha', 'woman sari', 'Pushed her in, served her, and outlasted her.'],
      ['Puru', 'young king turban', 'Gave his father his youth and got the kingdom for it.'],
      ['Harishchandra', 'king turban', 'Gave away everything he had, twice, rather than break a sentence he had said.'],
      ['Rantideva', 'king uttariya urdhva', 'Fed everyone who came for forty-eight days and kept nothing back.'],
      ['Shibi', 'king turban', 'Weighed his own flesh against a pigeon and kept adding.'],
      ['Astika', 'young sage naga uttariya', 'Stopped the snake sacrifice with a sentence, being half snake himself.'],
      ['Jaratkaru', 'sage jata white', 'Married a serpent because his ancestors were hanging by a thread.'],
      ['Uttanka', 'sage uttariya', 'Went into the underworld for a pair of earrings and came back with them.'],
      ['Dhaumya', 'sage uttariya tripundra', 'The Pandavas’ own priest through the forest years.'],
    ],
  },
  {
    book: 'ramayana',
    side: 'Ayodhya',
    rows: [
      ['Rama', 'blue kirita urdhva halo uttariya', 'Prince of Ayodhya, exiled fourteen years on a promise his father had made to somebody else.'],
      ['Lakshmana', 'fair karanda uttariya', 'Went with him, and by most accounts did not sleep for the fourteen years.'],
      ['Bharata', 'karanda uttariya urdhva', 'Refused the throne and ruled from beneath it, with his brother’s sandals on the seat.'],
      ['Shatrughna', 'karanda armour', 'The fourth brother, who stayed and held the city while the other three were elsewhere.'],
      ['Sita', 'woman sari flowers halo', 'Found in a furrow, won by the breaking of a bow, and in the end gave herself back to the ground.'],
      ['Dasharatha', 'old king kirita', 'Owed two boons for forty years and spent them both in one night.'],
      ['Kausalya', 'woman old sari', 'The eldest queen, and the one who had to let him go without argument.'],
      ['Kaikeyi', 'woman sari', 'Asked for the two boons, and had the rest of her life to think about it.'],
      ['Sumitra', 'woman sari', 'The third queen, mother of the two who went with the other two.'],
      ['Manthara', 'woman old sari', 'The maid who did the arithmetic out loud.'],
      ['Urmila', 'woman sari', 'Lakshmana’s wife, who slept his fourteen years for him so that he could stay awake.'],
      ['Sumantra', 'old turban uttariya', 'The charioteer who drove them to the forest and had to drive back empty.'],
      ['Guha', 'bareskin dark', 'The Nishada chief who ferried them across and would not take a fee.'],
      ['Lava', 'young flowers bareskin', 'One of the twins, raised in Valmiki’s ashram and taught the poem before he knew he was in it.'],
      ['Kusha', 'young flowers bareskin', 'The other one.'],
    ],
  },
  {
    book: 'ramayana',
    side: 'Kishkindha',
    rows: [
      ['Hanuman', 'vanara halo bareskin', 'Son of the wind. Crossed the sea in a leap and brought back a whole mountain rather than risk the wrong herb.'],
      ['Sugriva', 'vanara karanda', 'King of Kishkindha after his brother, who kept his word late but kept it.'],
      ['Vali', 'vanara kirita', 'Took half the strength of anyone who faced him, which is why he was shot from behind a tree.'],
      ['Angada', 'vanara young karanda', 'Vali’s son, who planted a foot in Ravana’s hall and invited the court to move it.'],
      ['Tara', 'vanara woman sari', 'Vali’s queen, and the sharpest political mind on that side of the water.'],
      ['Jambavan', 'old white bareskin', 'The bear. Old enough to have watched the earth measured out in three strides.'],
      ['Nala', 'vanara bareskin', 'Built the bridge, being the son of the architect of the gods.'],
      ['Nila', 'vanara armour', 'Commanded the host that carried the stones to him.'],
      ['Kesari', 'vanara old', 'Hanuman’s father by adoption, and lord of a mountain.'],
      ['Anjana', 'vanara woman sari', 'His mother, an apsara under a curse that a son would lift.'],
      ['Sushena', 'vanara old white', 'The physician of the host, who knew which herb and sent for it.'],
      ['Mainda', 'vanara bareskin', 'One of the two brothers who could not be killed by ordinary means.'],
      ['Dvivida', 'vanara bareskin', 'The other, and the more trouble of the two afterwards.'],
      ['Ruma', 'vanara woman sari', 'Sugriva’s queen, taken by his brother and given back by the war.'],
    ],
  },
  {
    book: 'ramayana',
    side: 'Lanka',
    rows: [
      ['Ravana', 'rakshasa tenheads kirita fangs green', 'King of Lanka, scholar of the Vedas, master of the veena, and would not give her back.'],
      ['Kumbhakarna', 'rakshasa fangs smoke', 'Slept six months at a stretch by the terms of his own boon, and was woken once too often.'],
      ['Vibhishana', 'rakshasa karanda urdhva', 'Told his brother he was wrong in open court, and walked out to the other side.'],
      ['Indrajit', 'rakshasa helm fangs', 'Beat Indra and took the name for it. Fought from inside a cloud where nobody could see him.'],
      ['Meghanada', 'rakshasa helm', 'The name he was born with, for the noise he made instead of crying.'],
      ['Mandodari', 'rakshasa woman sari', 'Ravana’s queen, who told him the truth every day for twenty years.'],
      ['Shurpanakha', 'rakshasa woman fangs', 'Asked, was refused twice, was disfigured for it, and brought the whole war home.'],
      ['Trijata', 'rakshasa woman sari', 'The only one in the grove who was kind, and the one who read the dream right.'],
      ['Prahasta', 'rakshasa armour fangs', 'Ravana’s commander, and the first of the great captains to fall.'],
      ['Atikaya', 'rakshasa armour fangs', 'Kumbhakarna’s son, who was as big as his father and half as easy to wake.'],
      ['Akshayakumara', 'rakshasa young armour', 'Ravana’s son, sent out against a monkey in a garden.'],
      ['Maricha', 'rakshasa smoke fangs', 'Turned himself into a golden deer, knowing exactly how it would end.'],
      ['Subahu', 'rakshasa fangs green', 'His companion at the sacrifice, and rather quicker to find out.'],
      ['Tataka', 'rakshasa woman fangs', 'Held the road through the forest, and was the first thing the boy was asked to kill.'],
      ['Khara', 'rakshasa armour fangs', 'Held Janasthana with fourteen thousand and lost all of them in an afternoon.'],
      ['Dushana', 'rakshasa armour fangs', 'His second, and no luckier.'],
      ['Trishira', 'rakshasa heads2 fangs', 'Three heads, three helmets, and one arrow apiece.'],
      ['Kabandha', 'rakshasa fangs smoke', 'A trunk with a mouth in it and no head at all, until they gave him one back.'],
      ['Viradha', 'rakshasa fangs green', 'Carried both brothers off under his arms and had to be buried alive.'],
      ['Kalanemi', 'rakshasa fangs', 'Sent to delay Hanuman with a hermitage and a pool.'],
      ['Malyavan', 'rakshasa old white', 'The grandfather of the house, who advised giving her back and was not thanked for it.'],
      ['Sumali', 'rakshasa old', 'His brother, who advised the opposite, and was.'],
      ['Narantaka', 'rakshasa young armour', 'One of the two brothers who rode out together and did not ride back.'],
      ['Devantaka', 'rakshasa young armour', 'The other.'],
      ['Vidyutjihva', 'rakshasa fangs', 'The sorcerer who made a false head to break her.'],
      ['Sulochana', 'rakshasa woman sari', 'Indrajit’s wife, who came out onto the field to ask for what was left of him.'],
    ],
  },
  {
    book: 'ramayana',
    side: 'On the road',
    rows: [
      ['Jatayu', 'old bird bareskin', 'The vulture who was too old to win and fought anyway, and lived long enough to say which way south.'],
      ['Sampati', 'old bird bareskin', 'His brother, who lost his wings to the sun and got his eyes to make up for it.'],
      ['Shabari', 'woman old bark', 'Waited most of a lifetime, and tasted every berry first to be sure they were sweet.'],
      ['Ahalya', 'woman sari ash', 'Turned to stone for something done to her, and given back her shape by a footstep.'],
      ['Valmiki', 'sage jata white bark', 'Was a robber, watched a bird shot out of the air, and the grief came out as a metre.'],
      ['Nishada', 'bareskin dark', 'The hunter whose arrow started the metre.'],
    ],
  },
  {
    book: 'asura',
    side: 'Daityas and Danavas',
    rows: [
      ['Hiranyakashipu', 'rakshasa kirita fangs gold', 'Could not be killed by man or beast, indoors or out, by day or night, on the ground or off it.'],
      ['Hiranyaksha', 'rakshasa armour fangs green', 'Rolled the earth up and took it under the sea.'],
      ['Prahlada', 'young urdhva uttariya halo', 'His son, who would not stop saying the name, through fire, poison and a pillar.'],
      ['Virochana', 'kirita armour', 'Prahlada’s son, who asked the same question as Indra and heard the answer he wanted.'],
      ['Bali', 'king kirita urdhva armour', 'Gave three strides of ground to a small brahmin and was measured out of the world.'],
      ['Banasura', 'rakshasa kirita fangs', 'A thousand arms, a fortress, and a daughter he could not keep locked up.'],
      ['Vritra', 'rakshasa smoke fangs horns', 'Held all the rivers inside himself until the thunderbolt.'],
      ['Namuchi', 'rakshasa fangs smoke', 'Could not be killed by anything wet or dry, so it was done with sea foam.'],
      ['Shumbha', 'rakshasa kirita fangs', 'Would only fight her if she came alone, and she did.'],
      ['Nishumbha', 'rakshasa armour fangs', 'His brother, who went first.'],
      ['Raktabija', 'rakshasa fangs red', 'Every drop of his blood that touched the ground stood up as another of him.'],
      ['Mahishasura', 'rakshasa horns fangs green', 'Buffalo-headed, and unkillable by any man — which is not the same thing as unkillable.'],
      ['Chanda', 'rakshasa fangs smoke', 'One of the two generals sent to fetch her, and half of the name she took for it.'],
      ['Munda', 'rakshasa fangs smoke', 'The other half.'],
      ['Dhumralochana', 'rakshasa fangs smoke', 'Smoke-eyed, and sent to be reasonable first.'],
      ['Madhu', 'rakshasa fangs night', 'Came out of an ear at the beginning of things.'],
      ['Kaitabha', 'rakshasa fangs night', 'Came out of the other one.'],
      ['Tarakasura', 'rakshasa kirita fangs', 'Could only be killed by a son of Shiva, at a time when Shiva had no sons.'],
      ['Andhaka', 'rakshasa fangs horns', 'Born of a moment’s dark, and blind until the end of it.'],
      ['Jalandhara', 'rakshasa kirita armour', 'Born of the sea and the anger of a god, and undone by his wife’s own virtue.'],
      ['Bhasmasura', 'rakshasa fangs', 'Given a hand that turned to ash whatever it touched, and talked into scratching his head.'],
      ['Mayasura', 'rakshasa turban uttariya', 'The architect. Built the halls that both sides of the other epic fought over.'],
      ['Shukracharya', 'sage white jata tripundra', 'Teacher to the asuras, and the only man alive who knew how to bring the dead back.'],
      ['Vrishaparva', 'king kirita armour', 'Danava king, and Sharmishtha’s father.'],
      ['Rahu', 'rakshasa fangs night', 'Drank a mouthful of the nectar and was cut in two before he swallowed. The head kept going.'],
      ['Ketu', 'rakshasa smoke', 'And that is the rest of him.'],
      ['Sunda', 'rakshasa armour fangs', 'One of two brothers who could not be beaten by anyone but each other.'],
      ['Upasunda', 'rakshasa armour fangs', 'The other, and they were introduced to Tilottama.'],
      ['Vatapi', 'rakshasa fangs green', 'Was cooked and served to guests, and called out of them afterwards. Once.'],
      ['Ilvala', 'rakshasa fangs green', 'His brother, who did the calling.'],
      ['Puloman', 'rakshasa fangs', 'Danava, and the father-in-law Indra did not ask.'],
      ['Diti', 'woman sari old', 'Mother of the daityas, and of the storm that came out of a broken vow.'],
      ['Danu', 'woman sari old', 'Mother of the danavas.'],
      ['Simhika', 'rakshasa woman fangs', 'Caught things by their shadow, which worked until it was a flying monkey.'],
    ],
  },
  {
    book: 'asura',
    side: 'Mathura and after',
    rows: [
      ['Kamsa', 'king kirita armour', 'Locked up his sister because of a voice from the sky, and killed six of her children on the arithmetic.'],
      ['Putana', 'rakshasa woman fangs green', 'Came to the village as a nurse with poison on her.'],
      ['Trinavarta', 'rakshasa smoke fangs', 'Came as a whirlwind and took the child up with the dust.'],
      ['Aghasura', 'rakshasa fangs green', 'Lay across the road as a cave with a mouth at one end.'],
      ['Bakasura', 'rakshasa fangs smoke', 'Came as a heron the size of a hill.'],
      ['Keshi', 'rakshasa fangs', 'Came as a horse, and it was done with an arm down its throat.'],
      ['Dhenukasura', 'rakshasa fangs green', 'Held a grove of palm fruit that nobody was allowed to eat.'],
      ['Pralamba', 'rakshasa fangs smoke', 'Joined the game as a cowherd and offered to carry somebody.'],
      ['Shankhachuda', 'rakshasa fangs', 'Wore a jewel in his head and took what was not his at a festival.'],
      ['Narakasura', 'rakshasa kirita fangs', 'Held sixteen thousand prisoners in a hill fort and asked for a day to be named after him.'],
      ['Kalayavana', 'king armour fangs', 'Could not be beaten in a straight fight, so was walked into a cave with somebody asleep in it.'],
      ['Shalva', 'king armour kirita', 'Flew a city that could not be seen and dropped it on Dwarka.'],
      ['Kaliya', 'naga fangs green', 'Poisoned a bend of the river and was danced off it.'],
    ],
  },
  {
    book: 'deva',
    side: 'The gods',
    rows: [
      ['Indra', 'gold kirita halo armour', 'King of the devas, holder of the thunderbolt, and the reason it rains.'],
      ['Agni', 'red jata halo bareskin', 'The fire, and the mouth everything offered is offered into.'],
      ['Vayu', 'gold uttariya halo', 'The wind, and Hanuman’s father and Bhima’s.'],
      ['Varuna', 'blue kirita halo uttariya', 'The waters, the oath, and the noose for anyone who breaks one.'],
      ['Yama', 'deepblue kirita halo armour', 'The first man to die, and the one who has kept the road ever since.'],
      ['Surya', 'gold kirita halo', 'The sun. Karna’s father, and too bright for his own wife to live with.'],
      ['Chandra', 'ash karanda halo uttariya', 'The moon, who married twenty-seven sisters and had a favourite.'],
      ['Kubera', 'gold karanda halo uttariya', 'Keeper of the treasure, lord of the yakshas, and Ravana’s half-brother.'],
      ['Brahma', 'gold jata white halo heads4 urdhva', 'Four faces, one for each direction, and the one who keeps granting the boons.'],
      ['Vishnu', 'blue kirita halo urdhva uttariya', 'The one who keeps it going, and comes down when it stops going.'],
      ['Shiva', 'ash jata thirdeye tripundra serpent bareskin halo', 'Ash from the ground, a river in his hair, and a snake round his throat.'],
      ['Ganesha', 'red karanda halo uttariya elephant', 'Elephant-headed, written down for the scribe of the Mahabharata, and moved first in every list.'],
      ['Kartikeya', 'gold kirita halo armour young heads6', 'Six heads, born to end Taraka, and general of the host from the day he could stand.'],
      ['Parvati', 'gold woman sari halo flowers', 'The mountain’s daughter, who waited him out.'],
      ['Sati', 'woman sari halo', 'Who did not, and walked into her father’s fire.'],
      ['Durga', 'gold woman kirita halo armour', 'Made out of the anger of all of them at once, with a weapon in every hand.'],
      ['Kali', 'night woman fangs flowers halo', 'What was left when the anger stopped being decorative.'],
      ['Lakshmi', 'gold woman kirita halo flowers', 'Came out of the churned ocean and chose where to sit.'],
      ['Saraswati', 'woman sari halo flowers', 'The river that dried up, and the sentence that did not.'],
      ['Ganga', 'blue woman sari halo', 'The river. Married a king and drowned seven sons before he stopped her.'],
      ['Yamuna', 'deepblue woman sari halo', 'Her sister, and Yama’s.'],
      ['Aditi', 'gold woman old sari halo', 'Mother of the adityas, and of the small brahmin who took three strides.'],
      ['Sachi', 'gold woman sari halo', 'Indra’s queen, and Puloman’s daughter.'],
      ['Dhanvantari', 'gold karanda halo uttariya', 'Came up out of the ocean holding the pot, and stayed to write the medicine down.'],
      ['Kamadeva', 'young flowers halo uttariya', 'Fired one flower arrow at the wrong meditation and was ash before it landed.'],
      ['Rati', 'woman sari flowers halo', 'Who negotiated him back, on the condition that only she could see him.'],
      ['Vishvakarma', 'gold turban uttariya', 'Built Lanka, Dwarka and Indraprastha, and was not asked what he thought of the tenants.'],
      ['Nandi', 'white bareskin tripundra thirdeye', 'At the door, and nobody goes in without him.'],
      ['Virabhadra', 'rakshasa fangs jata tripundra red', 'Made out of one hair, and sent to break up a sacrifice.'],
      ['Narada', 'sage jata white urdhva uttariya halo', 'Carries news between the three worlds, and is not always sorry about how it lands.'],
      ['Chitraratha', 'gold karanda uttariya', 'King of the gandharvas, and the one who taught Arjuna music.'],
      ['Tumburu', 'gold uttariya flowers', 'Sang, and everyone stopped.'],
      ['Menaka', 'woman sari flowers halo', 'Sent to interrupt a thousand years of penance, and did.'],
      ['Rambha', 'woman sari flowers', 'Sent on the same errand more than once.'],
      ['Urvashi', 'woman sari flowers halo', 'Loved a mortal on conditions, and left when one of them was broken.'],
      ['Tilottama', 'woman sari flowers', 'Made a grain at a time out of every beautiful thing, and walked between two brothers.'],
      ['Vasuki', 'naga kirita fangs', 'The rope the mountain was churned with, and did not enjoy it.'],
      ['Shesha', 'naga kirita white', 'The couch, the canopy, and the one holding the ground up.'],
      ['Takshaka', 'naga fangs green', 'Killed a king for an insult and nearly cost his whole people for it.'],
      ['Karkotaka', 'naga fangs', 'Bit Nala on purpose, to hide him inside a worse shape.'],
      ['Manasa', 'naga woman sari', 'Asked to be worshipped and would not take no for a final answer.'],
    ],
  },
  {
    book: 'rishi',
    side: 'The seers',
    rows: [
      ['Vyasa', 'sage jata white bark tripundra', 'Compiled the Vedas, fathered two kings, and dictated the poem he appears in.'],
      ['Vashistha', 'sage jata white bark', 'Kept the cow that could give anything, and would not sell her.'],
      ['Vishvamitra', 'sage jata white bark tilak', 'Was a king, wanted the cow, could not have it, and became a brahmin the hard way.'],
      ['Agastya', 'sage white jata bark', 'Drank the ocean, flattened a mountain, and took the language south.'],
      ['Atri', 'sage white jata bark', 'One of the seven, and Anasuya’s husband.'],
      ['Anasuya', 'woman old sari', 'Who turned three gods into infants for asking the wrong thing.'],
      ['Bhrigu', 'sage white jata tripundra', 'Kicked a god in the chest to see what he would do about it.'],
      ['Angiras', 'sage white jata', 'One of the seven, and the fire’s own line.'],
      ['Pulastya', 'sage white jata bark', 'One of the seven, and — awkwardly — Ravana’s grandfather.'],
      ['Kratu', 'sage white jata bark', 'One of the seven.'],
      ['Marichi', 'sage white jata bark', 'One of the seven, and Kashyapa’s father.'],
      ['Kashyapa', 'sage white jata tripundra bark', 'Father of the devas, the asuras, the nagas and the birds, by thirteen different wives.'],
      ['Gautama', 'sage white jata bark', 'Ahalya’s husband, and quicker to curse than to ask.'],
      ['Jamadagni', 'sage white jata bark', 'Asked his sons to kill their mother, and only one of them would.'],
      ['Renuka', 'woman sari', 'Who was killed for a moment’s wandering attention and asked back in the same breath.'],
      ['Parashurama', 'sage jata bark armour', 'That son. Cleared the earth of kings twenty-one times and taught three of the men who fought at Kurukshetra.'],
      ['Bharadwaja', 'sage white jata bark', 'Drona’s father, and the ashram everyone stops at on the way.'],
      ['Durvasa', 'sage jata red tripundra bark', 'A guest you feed carefully. Most of the curses in the literature are his.'],
      ['Markandeya', 'sage young jata tripundra', 'Was to die at sixteen, held onto the stone, and was given the rest of an age.'],
      ['Dattatreya', 'sage heads2 jata white tripundra', 'Three heads for three gods, and twenty-four teachers, none of them human.'],
      ['Chyavana', 'sage old white jata', 'Was an anthill until somebody poked his eyes with a stick, and got his youth back for it.'],
      ['Ashtavakra', 'sage young bark', 'Bent in eight places from correcting his father’s Sanskrit before he was born.'],
      ['Uddalaka', 'sage white jata bark', 'Told his son that the salt is still in the water when you cannot see it.'],
      ['Shvetaketu', 'young sage bark', 'The son, who came home from twelve years of study knowing everything except that.'],
      ['Yajnavalkya', 'sage white jata bark', 'Gave the cows back, then argued for them and won.'],
      ['Gargi', 'woman sari', 'Who asked him the question that had no floor under it.'],
      ['Maitreyi', 'woman sari', 'Who asked whether the whole earth would make her immortal, and was told no.'],
      ['Lopamudra', 'woman sari flowers', 'Made for Agastya out of the best of the animals, and made her own terms.'],
      ['Arundhati', 'woman old sari', 'Vashistha’s wife, and the faint star beside the bright one.'],
      ['Rishyasringa', 'young sage horns bark', 'Raised in a forest without ever seeing a woman, and brought out of it to make it rain.'],
      ['Sanatkumara', 'young sage jata halo', 'Stayed four years old on purpose, and taught Narada.'],
      ['Brihaspati', 'gold sage jata halo', 'Teacher to the gods, and the planet.'],
      ['Kanva', 'sage white jata bark', 'Raised Shakuntala, and was away when it mattered.'],
      ['Lomasha', 'sage white jata bark', 'Walked the Pandavas round every holy place in the country, telling stories the whole way.'],
      ['Suka', 'young sage jata halo bark', 'Vyasa’s son, who left home the day he was born and did not look back.'],
    ],
  },
];

// --------------------------------------------------------------------- host

/**
 * The unnamed.
 *
 * Names are compounded the way the real ones are: a qualifying first element
 * and a noun. `Ugra` + `sena` is a fierce army; `Chitra` + `ketu` is a bright
 * banner. Some of what comes out will collide with names in the texts, which is
 * expected — the epics are drawing from the same box of morphemes — and every
 * one of these cards says plainly that the verse counts this person and does
 * not name them.
 */
const FIRST = [
  'Ugra', 'Chitra', 'Su', 'Dur', 'Maha', 'Vira', 'Deva', 'Rana', 'Bhima', 'Jaya',
  'Vijaya', 'Satya', 'Dhrita', 'Krita', 'Prati', 'Anu', 'Vish', 'Nara', 'Bala', 'Ripu',
  'Shatru', 'Simha', 'Vyaghra', 'Gaja', 'Kula', 'Danta', 'Vaji', 'Soma', 'Surya', 'Chandra',
  'Amita', 'Ananta', 'Ari', 'Asta', 'Bhanu', 'Dhanur', 'Ghora', 'Hari', 'Indra', 'Kanaka',
  'Loka', 'Megha', 'Nila', 'Padma', 'Rudra', 'Sahasra', 'Tapas', 'Uttama', 'Vayu', 'Yuga',
];

const SECOND = [
  'sena', 'varman', 'datta', 'ketu', 'dhwaja', 'bahu', 'jit', 'pala', 'deva', 'teja',
  'mitra', 'ratha', 'yodhin', 'mardana', 'bhanu', 'kirti', 'shravas', 'vahana', 'danda', 'kesha',
  'netra', 'mukha', 'griva', 'danta', 'nabha', 'ojas', 'bala', 'vikrama', 'gupta', 'aksha',
];

export interface HostKind {
  book: Book;
  side: string;
  /** Tags every member of this host carries. */
  tags: string;
  /** What the card says instead of a biography. */
  note: string;
  /** Relative size, used to divide up whatever count is asked for. */
  weight: number;
}

export const HOSTS: HostKind[] = [
  {
    book: 'mahabharata', side: 'The eleven akshauhinis', tags: 'warrior armour',
    note: 'One of Duryodhana’s eleven divisions. The verse counts them by the akshauhini and moves on.',
    weight: 11,
  },
  {
    book: 'mahabharata', side: 'The seven akshauhinis', tags: 'warrior armour',
    note: 'One of the Pandavas’ seven divisions. Counted, marched, and not named.',
    weight: 7,
  },
  {
    book: 'mahabharata', side: 'The Narayani sena', tags: 'warrior armour turban',
    note: 'One of the Narayani host, lent to the side that asked for the army instead of the man.',
    weight: 4,
  },
  {
    book: 'mahabharata', side: 'The Samshaptakas', tags: 'warrior armour red',
    note: 'One of the Trigartas who swore to draw Arjuna off the field or not come back.',
    weight: 3,
  },
  {
    book: 'mahabharata', side: 'The Panchala foot', tags: 'warrior bareskin turban',
    note: 'One of Drupada’s foot, on the field for the whole eighteen days.',
    weight: 4,
  },
  {
    book: 'ramayana', side: 'The vanara host', tags: 'vanara bareskin',
    note: 'One of the vanara army at Kishkindha. The poem gives the number and a handful of the names.',
    weight: 9,
  },
  {
    book: 'ramayana', side: 'The bridge-builders', tags: 'vanara bareskin',
    note: 'One of the host that carried stones to the water for five days.',
    weight: 5,
  },
  {
    book: 'ramayana', side: 'The night-rangers', tags: 'rakshasa fangs armour smoke',
    note: 'One of Ravana’s night-rangers. Lanka is described by its towers, not by its people.',
    weight: 8,
  },
  {
    book: 'ramayana', side: 'Janasthana', tags: 'rakshasa fangs green bareskin',
    note: 'One of the fourteen thousand who held Janasthana for an afternoon.',
    weight: 5,
  },
  {
    book: 'asura', side: 'The Kalakeyas', tags: 'rakshasa fangs night armour',
    note: 'One of the Kalakeyas, who hid in the sea by day and came out at night for the ashrams.',
    weight: 4,
  },
  {
    book: 'asura', side: 'The horde of Mahisha', tags: 'rakshasa fangs horns green',
    note: 'One of Mahishasura’s horde, on the field for nine nights.',
    weight: 5,
  },
  {
    book: 'asura', side: 'The daityas of Hiranyakashipu', tags: 'rakshasa fangs armour',
    note: 'One of the daityas of that court, where the only dissenter was the king’s own son.',
    weight: 4,
  },
  {
    book: 'deva', side: 'The Maruts', tags: 'gold armour halo',
    note: 'One of the Maruts, born of a vow that was interrupted, and counted in sevens.',
    weight: 4,
  },
  {
    book: 'deva', side: 'The ganas', tags: 'ash jata tripundra fangs bareskin',
    note: 'One of the ganas on the mountain. Shapes nobody has written down individually.',
    weight: 5,
  },
  {
    book: 'deva', side: 'The Adityas', tags: 'gold kirita halo uttariya',
    note: 'One of Aditi’s sons. Twelve of them, one for each turn of the sun.',
    weight: 2,
  },
  {
    book: 'rishi', side: 'The seven ashrams', tags: 'sage jata bark white',
    note: 'One of the ashram, in the years the forest was full of them.',
    weight: 5,
  },
];

export function hostName(seed: number) {
  const a = FIRST[seed % FIRST.length];
  const b = SECOND[Math.floor(seed / FIRST.length) % SECOND.length];
  return a + b;
}
