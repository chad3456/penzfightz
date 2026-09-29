import type { Site } from './types';

/**
 * Krishna's places: Braj, where he grew up; Dwarka, where he ruled; the field
 * of the Gita; and the great temples where he is worshipped, Shrinathji among
 * them. Stories are retold from the Bhagavata Purana (Skandha 10–11) and the
 * Mahabharata, or from temple tradition where noted.
 */
export const KRISHNA: Site[] = [
  {
    id: 'mathura', kind: 'krishna', name: 'Krishna Janmabhoomi', sa: 'कृष्ण जन्मभूमि', place: 'Mathura, Uttar Pradesh', lat: 27.5, lon: 77.67,
    story: 'Kamsa, warned that Devaki\'s eighth son would kill him, locked Devaki and Vasudeva in his prison and killed six of their children. At midnight in a storm the eighth was born, four-armed, and at his word the chains fell, the guards slept and the doors opened; Vasudeva carried him across the flooding Yamuna to Gokul in a basket.',
    source: 'Bhagavata Purana 10.3', timeline: [['by tradition', 'Krishna is born in Kamsa\'s prison'], ['1st c. BCE', 'Inscriptions record a shrine to Vasudeva at Mathura'], ['1618', 'Bir Singh Deo Bundela builds a great temple'], ['1670', 'It is destroyed; the Shahi Idgah is built on the site'], ['1965–1982', 'The present Janmabhoomi temples are built beside it']],
    biome: 'city', style: 'haveli', difficulty: 1,
    task: { kind: 'quiz', title: 'Midnight in the prison', detail: 'Answer the questions of the night of Janmashtami.' },
    quiz: [['Who carried the baby Krishna across the Yamuna?', ['Nanda', 'Vasudeva', 'Balarama'], 1], ['Where was he taken?', ['Gokul', 'Dwarka', 'Ayodhya'], 0], ['Which child of Devaki was Krishna?', ['The first', 'The fifth', 'The eighth'], 2]],
  },
  {
    id: 'gokul', kind: 'krishna', name: 'Gokul', sa: 'गोकुल', place: 'Mathura district, Uttar Pradesh', lat: 27.44, lon: 77.72,
    story: 'In Nanda and Yashoda\'s house the child grew up stealing butter — breaking the hanging pots, feeding the monkeys, and making up stories when caught. When Yashoda looked into his mouth to see if he had eaten earth, she saw the whole universe there.',
    source: 'Bhagavata Purana 10.8–9', timeline: [['by tradition', 'Krishna\'s childhood with Yashoda']],
    biome: 'river', style: 'haveli', difficulty: 1,
    task: { kind: 'offer', title: 'The butter thief', detail: 'Find the butter pots hung around the village before Yashoda does.', count: 10, item: 'butter' },
  },
  {
    id: 'vrindavan', kind: 'krishna', name: 'Vrindavan', sa: 'वृन्दावन', place: 'Mathura district, Uttar Pradesh', lat: 27.58, lon: 77.7,
    story: 'In the groves of Vrindavan Krishna herded cows, played his flute, danced the Rasa with Radha and the gopis on autumn nights, and subdued the serpent Kaliya in the Yamuna by dancing on his hoods.',
    source: 'Bhagavata Purana 10.16, 10.29–33', timeline: [['by tradition', 'The Rasa Lila'], ['16th c.', 'Chaitanya\'s disciples, the Goswamis, rediscover the lila places'], ['1590', 'Raja Man Singh builds Govind Dev temple'], ['1864', 'Banke Bihari temple is built']],
    biome: 'forest', style: 'haveli', difficulty: 1,
    task: { kind: 'bells', title: 'The flute', detail: 'Keep time with the flute as the gopis dance.', count: 12 },
  },
  {
    id: 'govardhan', kind: 'krishna', name: 'Govardhan', sa: 'गोवर्धन', place: 'Mathura district, Uttar Pradesh', lat: 27.5, lon: 77.46,
    story: 'Krishna told the cowherds to worship the hill that fed their cows instead of Indra. Indra sent seven days of storm; Krishna lifted the Govardhan hill on his little finger and all of Braj sheltered under it until Indra gave in.',
    source: 'Bhagavata Purana 10.24–27', timeline: [['by tradition', 'Krishna lifts the hill'], ['every day', 'Pilgrims walk the 21-km parikrama round the hill']],
    biome: 'hills', style: 'haveli', difficulty: 2,
    task: { kind: 'trek', title: 'Parikrama', detail: 'Walk round the hill, stopping at the kunds to rest.', count: 5 },
  },
  {
    id: 'barsana', kind: 'krishna', name: 'Barsana', sa: 'बरसाना', place: 'Mathura district, Uttar Pradesh', lat: 27.65, lon: 77.38,
    story: 'Radha\'s village. On a hill stands the temple of Shriji, Radha herself; every spring the women of Barsana drive off the men of Krishna\'s Nandgaon with sticks and colour in the Lathmar Holi.',
    source: 'Braj tradition', timeline: [['1675', 'Raja Bir Singh\'s temple to Radha is built on the hill']],
    biome: 'hills', style: 'haveli', difficulty: 1,
    task: { kind: 'offer', title: 'Colours for Holi', detail: 'Gather flowers for the colours of Lathmar Holi.', count: 10, item: 'flower' },
  },
  {
    id: 'dwarka', kind: 'krishna', name: 'Dwarkadhish', sa: 'द्वारकाधीश', place: 'Dwarka, Gujarat', lat: 22.24, lon: 68.97,
    story: 'To shelter his people from endless attack, Krishna built a city of gold on the western sea, Dwaraka, and ruled it as its king. After his departure the sea swallowed it. The temple of Dwarkadhish rises five storeys on the Gomti creek, its flag changed five times a day.',
    source: 'Bhagavata Purana 10.50; Mahabharata, Mausala Parva', timeline: [['by tradition', 'Krishna builds Dwaraka'], ['by tradition', 'The sea takes the city'], ['15th–16th c.', 'The present temple is built on older foundations'], ['1980s', 'Marine archaeologists study submerged walls off the coast']],
    biome: 'coast', style: 'nagara', difficulty: 1,
    task: { kind: 'lamps', title: 'The city of gold', detail: 'Light the lamps of Dwaraka along the shore.', count: 12, item: 'lamp' },
  },
  {
    id: 'bet-dwarka', kind: 'krishna', name: 'Bet Dwarka', sa: 'बेट द्वारका', place: 'Okha, Gujarat', lat: 22.47, lon: 69.12,
    story: 'Krishna\'s island home. Here, it is said, his poor boyhood friend Sudama came with a handful of beaten rice, too ashamed to ask for help, and went home to find his hut turned into a palace.',
    source: 'Bhagavata Purana 10.80–81', timeline: [['by tradition', 'Sudama\'s visit'], ['2024', 'The Sudarshan Setu bridge links the island']],
    biome: 'island', style: 'haveli', difficulty: 2,
    task: { kind: 'offer', title: 'Sudama\'s rice', detail: 'Gather handfuls of beaten rice to bring to Krishna, as Sudama did.', count: 8, item: 'sweet' },
  },
  {
    id: 'shrinathji', kind: 'krishna', name: 'Shrinathji', sa: 'श्रीनाथजी', place: 'Nathdwara, Rajasthan', lat: 24.93, lon: 73.82,
    story: 'Shrinathji is Krishna at seven, holding up Govardhan with his left hand. The image was revealed on the hill, it is said, and worshipped there by Vallabhacharya\'s followers; in 1672, fearing its destruction, they carried it away on a cart, and at Sihad the wheels sank into the mud and would not move — so there the temple was built. He is served eight times a day, with food and clothes for the season.',
    source: 'Pushtimarg tradition', timeline: [['1409 / 1478', 'By tradition the image appears on Govardhan'], ['1672', 'The image leaves Braj by cart'], ['1672', 'The cart stops at Sihad; the haveli temple is built'], ['every day', 'Eight darshans, from Mangala to Shayan']],
    biome: 'hills', style: 'haveli', difficulty: 2,
    task: { kind: 'offer', title: 'Chhappan bhog', detail: 'Gather the dishes of the fifty-six offerings for Shrinathji\'s feast.', count: 14, item: 'sweet' },
  },
  {
    id: 'jagannath', kind: 'krishna', name: 'Jagannath', sa: 'जगन्नाथ', place: 'Puri, Odisha', lat: 19.8, lon: 85.82,
    story: 'King Indradyumna was told to carve the Lord from a log that washed up on the shore. An old carpenter — Vishwakarma, or Vishnu himself — agreed to do it behind closed doors if he was not disturbed for three weeks. The queen grew anxious and opened the doors early; the carpenter was gone, and Jagannath, Balabhadra and Subhadra were left as they are, with great round eyes and no hands. Every year they ride out in chariots.',
    source: 'Purushottama Kshetra Mahatmya of the Skanda Purana', timeline: [['by tradition', 'Indradyumna finds the log'], ['12th c.', 'Anantavarman Chodaganga builds the present temple'], ['every 12–19 yrs', 'Nabakalebara: new images are carved']],
    biome: 'coast', style: 'kalinga', difficulty: 1,
    task: { kind: 'carry', title: 'The Rath Yatra', detail: 'Guide the chariot steady down the Bada Danda.', count: 1 },
  },
  {
    id: 'udupi', kind: 'krishna', name: 'Udupi Krishna', sa: 'उडुपि श्रीकृष्ण', place: 'Udupi, Karnataka', lat: 13.34, lon: 74.75,
    story: 'Madhvacharya found an image of Krishna in a block of gopichandana clay from a shipwreck and installed it here in the 13th century. The poet Kanakadasa, kept out of the temple for his caste, prayed outside; the wall cracked and the image turned round to face him. Devotees still see Krishna through that window, the Kanakana Kindi.',
    source: 'Madhva tradition', timeline: [['13th c.', 'Madhvacharya installs the image'], ['16th c.', 'Krishna turns to Kanakadasa']],
    biome: 'coast', style: 'kerala', difficulty: 1,
    task: { kind: 'quiz', title: 'Kanaka\'s window', detail: 'Answer the questions of the eight mathas.' },
    quiz: [['Who installed the Udupi image?', ['Ramanuja', 'Madhvacharya', 'Shankara'], 1], ['What is the Kanakana Kindi?', ['A window', 'A lamp', 'A drum'], 0], ['Where was the image found?', ['In a river', 'In a cave', 'In a block of clay from a ship'], 2]],
  },
  {
    id: 'guruvayur', kind: 'krishna', name: 'Guruvayur', sa: 'गुरुवायूर्', place: 'Thrissur, Kerala', lat: 10.59, lon: 76.04,
    story: 'Guru, the teacher of the gods, and Vayu, the wind, installed this image of Krishna after Dwaraka sank, and the place is named for them. It is lit at night by thousands of oil lamps on the lamp-towers around the shrine.',
    source: 'Guruvayur Mahatmya', timeline: [['by tradition', 'Guru and Vayu bring the image'], ['1638', 'The temple is rebuilt'], ['1970', 'A fire burns much of it; it is restored']],
    biome: 'forest', style: 'kerala', difficulty: 1,
    task: { kind: 'lamps', title: 'Vilakku', detail: 'Light the brass lamps of the vilakku madam.', count: 16, item: 'lamp' },
  },
  {
    id: 'pandharpur', kind: 'krishna', name: 'Vitthal, Pandharpur', sa: 'विठ्ठल', place: 'Pandharpur, Maharashtra', lat: 17.68, lon: 75.33,
    story: 'Krishna came to visit his devotee Pundalik, who was busy caring for his parents. Pundalik threw him a brick to stand on until he was done; Krishna waited, hands on his hips, and is still standing there as Vitthal. Every Ashadhi Ekadashi, lakhs of warkaris walk here singing.',
    source: 'Varkari tradition', timeline: [['by tradition', 'Krishna waits on Pundalik\'s brick'], ['13th c.', 'Jnaneshwar and Namdev sing of Vitthal'], ['every Ashadh', 'The wari walks from Alandi and Dehu']],
    biome: 'river', style: 'hemadpanti', difficulty: 2,
    task: { kind: 'trek', title: 'The wari', detail: 'Walk with the palkhi to Pandharpur, resting with the dindis.', count: 5 },
  },
  {
    id: 'kurukshetra', kind: 'krishna', name: 'Jyotisar, Kurukshetra', sa: 'ज्योतिसर', place: 'Kurukshetra, Haryana', lat: 29.99, lon: 76.78,
    story: 'Under a banyan here, tradition says, Krishna spoke the Bhagavad Gita to Arjuna, who had dropped his bow between the two armies — and showed him the Universal Form.',
    source: 'Mahabharata, Bhishma Parva (the Gita)', timeline: [['by tradition', 'The Gita is spoken'], ['1924', 'The Shankaracharya of Jyotirmath marks the banyan']],
    biome: 'plains', style: 'natural', difficulty: 1,
    task: { kind: 'quiz', title: 'The Gita', detail: 'Answer the charioteer\'s questions.' },
    quiz: [['What did Arjuna drop?', ['His bow, Gandiva', 'His conch', 'His crown'], 0], ['In chapter 11, what does Krishna show him?', ['A palace', 'The Universal Form', 'The ocean'], 1], ['"You have the right to the work, never to its …"', ['fame', 'end', 'fruits'], 2]],
  },
  {
    id: 'bhalka', kind: 'krishna', name: 'Bhalka Tirth', sa: 'भालका तीर्थ', place: 'Veraval, Gujarat', lat: 20.9, lon: 70.37,
    story: 'Resting under a tree near Prabhasa, Krishna was struck in the foot by an arrow from the hunter Jara, who took it for a deer. Krishna forgave him and left the world here, and the Dvapara age ended.',
    source: 'Bhagavata Purana 11.30; Mahabharata, Mausala Parva', timeline: [['by tradition', 'Krishna leaves the world']],
    biome: 'coast', style: 'nagara', difficulty: 1,
    task: { kind: 'lamps', title: 'The last evening', detail: 'Light lamps under the peepal where Krishna rested.', count: 8, item: 'lamp' },
  },
  {
    id: 'dakor', kind: 'krishna', name: 'Ranchhodrai, Dakor', sa: 'रणछोड़राय', place: 'Dakor, Gujarat', lat: 22.75, lon: 73.15,
    story: 'The devotee Bodana walked to Dwarka twice a year until he was too old; then, it is said, Krishna came back with him to Dakor. When the Dwarka priests came for their image, it was weighed against a single gold nose-ring of Bodana\'s wife — and the ring was heavier.',
    source: 'Temple tradition', timeline: [['1772', 'The present temple is built']],
    biome: 'plains', style: 'haveli', difficulty: 1,
    task: { kind: 'offer', title: 'The nose-ring', detail: 'Gather offerings for Ranchhodrai before the priests of Dwarka arrive.', count: 8, item: 'flower' },
  },
  {
    id: 'sandipani', kind: 'krishna', name: 'Sandipani Ashram', sa: 'सांदीपनि आश्रम', place: 'Ujjain, Madhya Pradesh', lat: 23.19, lon: 75.79,
    story: 'Krishna, Balarama and Sudama studied here with the sage Sandipani and, it is said, learned the sixty-four arts in sixty-four days. As the teacher\'s fee, Krishna brought back Sandipani\'s son from the dead.',
    source: 'Bhagavata Purana 10.45', timeline: [['by tradition', 'Krishna studies here']],
    biome: 'city', style: 'nagara', difficulty: 1,
    task: { kind: 'quiz', title: 'The sixty-four arts', detail: 'Answer the guru\'s questions.' },
    quiz: [['Who studied with Krishna here?', ['Arjuna and Bhima', 'Balarama and Sudama', 'Rama and Lakshmana'], 1], ['How many arts did he learn?', ['Sixty-four', 'Eighteen', 'Seven'], 0], ['What was his fee to the guru?', ['A cow', 'A kingdom', 'Bringing back the guru\'s son'], 2]],
  },
];
