import type { Topic } from '../types';
import { chapter } from './make';

const t = chapter('bacteria');

export const BACTERIA: Topic[] = [
  t('bacterial-cell', 'A bacterial cell', 'Small, simple and everywhere', 'micro',
    { bg: 'void', actors: [
      { k: 'rod', id: 'cell', at: [0, 0, 0], s: 5 },
      { k: 'helix', id: 'nucleoid', at: [0.2, -1.6, 0.6], s: 1.1, rot: [0, 0, 1.5] },
      { k: 'ribosome', id: 'ribosome', at: [-1.4, -1.4, 0.4], n: 5, spread: 0.3, s: 0.7 },
      { k: 'vesicle', id: 'plasmid', at: [1.6, -1.3, 0.4], s: 0.6, color: '#4fb3d9' }] },
    'Bacteria are single cells about a thousandth of a millimetre long, with no nucleus: their DNA, usually one circular chromosome, floats in a region called the nucleoid. Most have a tough cell wall outside their membrane, and many swim with whip-like flagella or grip surfaces with hair-like pili.\n\nThey were the first life on Earth and are found everywhere, from hot springs to the human gut. Only a small minority cause disease; many are essential to us.',
    [['cell', 'Cell wall and membrane', 'The wall is made of peptidoglycan, a mesh of sugars and short peptides.'], ['nucleoid', 'Chromosome', 'One loop of DNA, often a few million base pairs.'], ['ribosome', 'Ribosomes', 'Smaller than ours, which lets some antibiotics target them.'], ['plasmid', 'Plasmids', 'Small extra DNA circles, often carrying resistance genes.']],
    { facts: ['E. coli can divide every 20 minutes in ideal conditions.'], q: 'bacterial cell structure prokaryote' }),

  t('bacterial-shapes', 'Shapes of bacteria', 'Rods, spheres and spirals', 'micro',
    { bg: 'void', actors: [{ k: 'rod', id: 'bacillus', at: [-2.2, 0, 0], s: 2 }, { k: 'coccus', id: 'coccus', at: [0, 0, 0], s: 1.8 }, { k: 'spiral', id: 'spirillum', at: [2.3, 0, 0], s: 1.6 }] },
    'Bacteria are often named by shape. Rods are bacilli (E. coli, Salmonella, the TB bacterium); spheres are cocci, which may stick together in clusters like grapes (staphylococci) or chains (streptococci); spiral and corkscrew forms include the spirochaetes that cause Lyme disease and syphilis.\n\nShape matters for how they move, attach and avoid being eaten, and it is still one of the first clues used to identify them under the microscope.',
    [['bacillus', 'Bacillus (rod)', 'With flagella here.'], ['coccus', 'Cocci in a cluster', 'Like Staphylococcus.'], ['spirillum', 'Spiral', 'Corkscrews through thick fluids.']],
    { q: 'bacterial morphology classification' }),

  t('gram-stain', 'Gram-positive and Gram-negative', 'Two kinds of wall', 'micro',
    { bg: 'void', actors: [{ k: 'rod', id: 'positive', at: [-1.3, 0, 0], s: 3, color: '#7a4ab8' }, { k: 'rod', id: 'negative', at: [1.3, 0, 0], s: 3, color: '#e8709a' }] },
    'In 1884 Hans Christian Gram found a stain that splits bacteria into two groups. Gram-positive bacteria have a thick peptidoglycan wall that holds the purple dye. Gram-negative bacteria have a thin wall covered by an extra outer membrane, so they lose the purple and are counter-stained pink.\n\nThe outer membrane of Gram-negatives keeps many antibiotics out, and it contains a molecule (lipopolysaccharide) that can trigger severe inflammation in sepsis. The Gram stain still guides first choices of antibiotics.',
    [['positive', 'Gram-positive', 'Thick wall: Staphylococcus, Streptococcus.'], ['negative', 'Gram-negative', 'Outer membrane: E. coli, Klebsiella, Pseudomonas.']],
    { q: 'Gram-negative outer membrane antibiotic permeability' }),

  t('binary-fission', 'Binary fission', 'One becomes two', 'micro',
    { bg: 'void', actors: [
      { k: 'rod', id: 'parent', at: [0, 0, 0], s: [3, 3.6, 0.01, 0.01], o: [1, 1, 0, 0] },
      { k: 'rod', id: 'daughter', at: [[0, 0, 0], [0, 0, 0], [-1.2, 0, 0], [-1.6, 0.3, 0]], s: [0.01, 0.01, 2.6, 3] },
      { k: 'rod', id: 'daughter', at: [[0, 0, 0], [0, 0, 0], [1.2, 0, 0], [1.6, -0.3, 0]], s: [0.01, 0.01, 2.6, 3] }] },
    'Bacteria reproduce by copying their chromosome, growing longer, and building a wall across the middle, so one cell becomes two identical daughters. In good conditions some species divide every 20 to 30 minutes.\n\nThat means a single bacterium could in theory become billions in a day, which is why infections can flare quickly, and why each division is a chance for a mutation, including one that resists an antibiotic.',
    [['parent', 'Parent cell', 'Copies its DNA and elongates.'], ['daughter', 'Daughter cells', 'Genetically identical.']],
    { steps: [['Grow', 'The cell lengthens and copies its chromosome.'], ['Stretch', 'The two copies separate.'], ['Divide', 'A new wall forms across the middle.'], ['Two cells', 'Each grows on.']], q: 'bacterial cell division FtsZ' }),

  t('flagella', 'How bacteria swim', 'A rotary motor', 'micro',
    { bg: 'void', actors: [{ k: 'rod', id: 'bacterium', path: [[-3, 0, 0], [-1, 1, 0.5], [1, -0.5, -0.5], [3, 0.4, 0]], n: 1, s: 2, spin: 3 }, { k: 'rod', id: 'others', n: 5, spread: [3, 1.5, 1.5], s: 1.2, spin: 1 }] },
    'A bacterial flagellum is a long helical filament driven at its base by a true rotary motor embedded in the cell wall, powered by protons flowing into the cell. It can spin over 100 times a second.\n\nWhen the motors turn one way, the flagella bundle together and push the cell forward in a run; when they reverse, the bundle flies apart and the cell tumbles and picks a new direction. By running longer toward food, bacteria steer up chemical gradients (chemotaxis).',
    [['bacterium', 'Swimming bacterium', 'Runs and tumbles.'], ['others', 'Neighbours', 'Each steers independently.']],
    { q: 'bacterial flagellar motor chemotaxis' }),

  t('biofilm', 'Biofilms', 'Bacterial cities', 'micro',
    { bg: 'tissue', actors: [
      { k: 'coccus', id: 'bacteria', at: [0, -0.6, 0], n: 36, spread: [2.6, 0.4, 1.4], s: 0.5 },
      { k: 'vesicle', id: 'matrix', at: [0, -0.5, 0], n: 6, spread: [2, 0.2, 1], s: 3.5, color: '#e8e2a0' },
      { k: 'antibody', id: 'blocked', at: [0, 1, 0], n: 10, spread: [2.6, 0.4, 1.4], s: 1 }] },
    'Most bacteria in nature live not as free swimmers but in biofilms: communities stuck to a surface and wrapped in a slimy matrix of sugars, proteins and DNA that they produce. Dental plaque is a biofilm; so are the slimes on catheters, artificial joints and heart valves.\n\nInside a biofilm, bacteria are protected from immune cells and can survive antibiotic doses up to a thousand times higher than free bacteria, which makes biofilm infections very hard to clear.',
    [['bacteria', 'Bacteria', 'Communicate by chemical signals (quorum sensing).'], ['matrix', 'Matrix', 'A protective slime.'], ['blocked', 'Antibodies', 'Struggle to get in.'], ['tissue', 'Surface', 'Tissue or an implant.']],
    { q: 'biofilm antibiotic tolerance medical devices' }),

  t('antibiotics', 'How antibiotics work', 'Hitting what bacteria have and we do not', 'micro',
    { bg: 'void', actors: [
      { k: 'rod', id: 'bacterium', at: [0, 0, 0], s: [3, 3, 3.2, 0.01], o: [1, 1, 1, 0] },
      { k: 'pill', id: 'drug', at: [[-2.6, 1.4, 0], [-1.2, 0.6, 0.3], [-0.4, 0.2, 0.4], [-0.4, 0.2, 0.4]], n: 8, spread: 0.6, s: 0.6, color: '#ffffff' },
      { k: 'fragment', id: 'burst', at: [0, 0, 0], n: 18, spread: 1.6, o: [0, 0, 0, 1], color: '#7fc98a' }] },
    'Antibiotics exploit differences between bacterial and human cells. Penicillin and its relatives block the enzymes that build the peptidoglycan wall, so growing bacteria burst. Others block bacterial ribosomes (tetracyclines, macrolides), copying of DNA (quinolones), or making folic acid (trimethoprim).\n\nAntibiotics do nothing against viruses, which have none of these targets. Alexander Fleming noticed penicillin killing bacteria on a mouldy plate in 1928; it became a medicine in the 1940s.',
    [['drug', 'Antibiotic', 'Here a penicillin-like drug.'], ['bacterium', 'Bacterium', 'Its wall is weakened as it grows.'], ['burst', 'Lysis', 'The cell bursts.']],
    { steps: [['Exposure', 'The drug reaches the bacteria.'], ['Binding', 'It blocks wall-building enzymes.'], ['Weakening', 'New wall is faulty.'], ['Burst', 'Osmotic pressure ruptures the cell.']], q: 'antibiotic mechanisms of action classes' }),

  t('resistance', 'Antibiotic resistance', 'Evolution in a few days', 'micro',
    { bg: 'void', actors: [
      { k: 'rod', id: 'susceptible', at: [0, 0, 0], n: 30, spread: [3, 1.6, 1.4], s: 0.7, o: [1, 1, 0.1, 0] },
      { k: 'rod', id: 'resistant', at: [0.5, 0.3, 0.2], n: 2, spread: 0.6, s: 0.7, color: '#e8584a', o: [1, 1, 1, 0] },
      { k: 'rod', id: 'regrowth', at: [0, 0, 0], n: 30, spread: [3, 1.6, 1.4], s: 0.7, color: '#e8584a', o: [0, 0, 0, 1], seed: 4 },
      { k: 'pill', id: 'drug', at: [0, 0, 0], n: 20, spread: [3, 1.6, 1.4], s: 0.4, o: [0, 1, 1, 0.3] }] },
    'In any large population of bacteria, a few may carry a mutation or a borrowed gene that protects them, perhaps an enzyme that destroys the drug, a pump that throws it out, or an altered target. An antibiotic kills the rest, and the resistant few multiply to take their place.\n\nResistance genes also spread between bacteria on plasmids. Overuse and misuse of antibiotics, in medicine and farming, speed this up. Drug-resistant infections were directly responsible for over a million deaths in 2019.',
    [['susceptible', 'Susceptible bacteria', 'Killed by the drug.'], ['resistant', 'Resistant bacteria', 'Survive.'], ['regrowth', 'Resistant population', 'Grows back.'], ['drug', 'Antibiotic', 'Applies the selection pressure.']],
    { steps: [['Mixed population', 'A few resistant cells among many.'], ['Treatment', 'The antibiotic is given.'], ['Survivors', 'Only resistant cells remain.'], ['Regrowth', 'Now the infection is resistant.']], q: 'global burden antimicrobial resistance 2019', refs: ['murray2022'] }),

  t('conjugation', 'Sharing genes', 'Plasmids and conjugation', 'dna', { mode: 'circle', still: true },
    'Bacteria do not only inherit genes from their parent cell; they also swap them with neighbours, even of other species (horizontal gene transfer). The main route is conjugation: a bacterium extends a tube (a pilus) to another and passes a copy of a plasmid, a small circle of DNA, across.\n\nPlasmids often carry genes for antibiotic resistance or toxins, which is how resistance can jump rapidly between unrelated bacteria in a hospital or a gut.',
    [['plasmid', 'Plasmid', 'Copies itself independently of the chromosome.'], ['gene', 'Genes on the plasmid', 'Such as resistance genes.']],
    { view: [0.3, 1, 0.6], q: 'plasmid conjugation horizontal gene transfer resistance' }),

  t('e-coli', 'Escherichia coli', 'Gut resident and occasional villain', 'micro',
    { bg: 'lumen', fit: [0, 0, 0, 2.2], actors: [{ k: 'rod', id: 'ecoli', n: 24, spread: [3.5, 1.3, 1.3], s: 0.7 }, { k: 'mol', id: 'toxin', n: 20, spread: [3.5, 1.3, 1.3], color: '#ff5a5a', s: 0.5 }] },
    'E. coli is a rod-shaped bacterium that lives harmlessly in the gut of people and animals, and is one of the most studied organisms in biology. Most strains are harmless or helpful.\n\nSome strains carry extra genes that make them dangerous: certain types cause urinary infections, traveller’s diarrhoea, or, like O157:H7, produce Shiga toxin that can damage the kidneys. These are usually caught from undercooked meat or contaminated food or water.',
    [['ecoli', 'E. coli', 'About 2 micrometres long.'], ['toxin', 'Toxin', 'Made only by some strains.'], ['wall', 'Gut wall', 'Its normal home.']],
    { q: 'Escherichia coli pathotypes Shiga toxin' }),

  t('staph', 'Staphylococcus and MRSA', 'Grape-like clusters', 'micro',
    { bg: 'tissue', actors: [{ k: 'coccus', id: 'staph', at: [0, 0, 0], n: 10, spread: [1.6, 0.5, 1], s: 1.1, color: '#e0b84f' }, { k: 'neutrophil', id: 'neutrophil', at: [[2, 0.6, 0], [1.2, 0.3, 0]], s: 0.8 }] },
    'Staphylococcus aureus is a round bacterium that grows in grape-like clusters. About a third of people carry it harmlessly in their nose, but it can cause boils, wound infections, pneumonia, bone and blood infections.\n\nMRSA (methicillin-resistant S. aureus) carries a gene for an altered wall-building enzyme that most penicillin-type antibiotics cannot block. Hand hygiene and screening in hospitals have reduced it in many countries.',
    [['staph', 'S. aureus', 'Golden colonies on a plate; aureus means golden.'], ['neutrophil', 'Neutrophil', 'Its main defence against staph.']],
    { q: 'Staphylococcus aureus MRSA epidemiology' }),

  t('cholera', 'Cholera', 'A toxin that turns the gut into a tap', 'micro',
    { bg: 'lumen', fit: [0, 0, 0, 2.2], actors: [
      { k: 'rod', id: 'vibrio', n: 14, spread: [3, 1, 1], s: 0.6, color: '#c9e07a' },
      { k: 'mol', id: 'toxin', at: [[0, 0, 0], [0, -0.6, 0], [0, -1.6, 0]], n: 20, spread: [2.4, 0.4, 1], color: '#ff5a5a', s: 0.7 },
      { k: 'plasma', id: 'water', at: [[0, -2.2, 0], [0, -1.4, 0], [0, 0, 0]], n: 80, spread: [3, 1, 1.2], color: '#7fd8ff', o: [0, 0.6, 1] }] },
    'Vibrio cholerae, a curved bacterium spread by contaminated water, sticks to the lining of the small intestine and releases cholera toxin. The toxin locks a switch inside gut cells in the “on” position, so they pump chloride and water out into the gut.\n\nThe result is torrents of watery diarrhoea, up to a litre an hour, which can kill by dehydration within hours. Oral rehydration solution, a simple mix of salt, sugar and water, saves most lives; the sugar helps the gut absorb the salt and water.',
    [['vibrio', 'Vibrio cholerae', 'Comma-shaped.'], ['toxin', 'Cholera toxin', 'The gene for it came from a phage.'], ['water', 'Water loss', 'Pours into the gut.']],
    { steps: [['Colonise', 'Bacteria attach to the gut lining.'], ['Toxin', 'It enters the cells.'], ['Flood', 'Water and salt pour out.']], q: 'cholera toxin mechanism oral rehydration' }),

  t('spores', 'Bacterial spores', 'Surviving almost anything', 'micro',
    { bg: 'void', actors: [{ k: 'rod', id: 'cell', at: [0, 0, 0], s: [3, 3, 1, 0.01], o: [1, 0.6, 0.3, 0] }, { k: 'spore', id: 'spore', at: [0.5, 0, 0], s: [0.01, 1.5, 2.2, 2.4] }] },
    'When food runs out, some bacteria, such as Clostridium and Bacillus species, build a tough, dried-out spore inside themselves, then the rest of the cell falls away. Spores survive boiling, drying, radiation and disinfectants for years, possibly centuries.\n\nWhen conditions improve, they germinate into active bacteria again. Tetanus, botulism, anthrax and Clostridioides difficile gut infections all start from spores, which is why hospitals use special cleaning against C. difficile.',
    [['cell', 'Parent cell', 'Breaks down around the spore.'], ['spore', 'Endospore', 'Layered coats around dormant DNA.']],
    { steps: [['Starving', 'The cell senses hard times.'], ['Forming', 'A spore develops inside.'], ['Released', 'The mother cell dies.'], ['Dormant', 'The spore waits.']], q: 'bacterial endospore resistance germination' }),

  t('fungi', 'Fungi and yeasts', 'Microbes with a nucleus', 'micro',
    { bg: 'tissue', actors: [{ k: 'yeast', id: 'yeast', n: 12, at: [0, 0, 0], spread: [2.4, 0.5, 1.2], s: 0.9 }, { k: 'parasite', id: 'hyphae', n: 6, at: [0, -0.5, 0], spread: [2, 0.2, 1], s: 1.6, color: '#f0e0c0' }] },
    'Fungi are closer relatives of animals than of bacteria: their cells have a nucleus and organelles. Yeasts are single cells that multiply by budding; moulds grow as threads (hyphae).\n\nCandida yeast lives harmlessly on skin and in the gut and mouth but can overgrow as thrush. In people with weak immune systems, fungi such as Candida, Aspergillus and Cryptococcus cause serious infections. Because their cells resemble ours, there are fewer safe antifungal drugs than antibiotics.',
    [['yeast', 'Yeast cells', 'Budding daughter cells visible.'], ['hyphae', 'Hyphae', 'Thread-like filaments that invade tissue.'], ['tissue', 'Tissue', 'Fungi invade when defences are low.']],
    { q: 'invasive fungal infections Candida Aspergillus' }),

  t('spirochaetes', 'Spirochaetes', 'Corkscrew bacteria', 'micro',
    { bg: 'void', actors: [{ k: 'spiral', id: 'borrelia', n: 8, spread: [3, 1.5, 1.5], s: 1.6, spin: 1.2 }, { k: 'rbc', id: 'rbc', n: 10, spread: [3, 1.5, 1.5] }] },
    'Spirochaetes are long, thin, corkscrew-shaped bacteria whose flagella run inside their outer membrane, so the whole body twists like a drill. That lets them bore through thick fluids and tissue.\n\nThey include Borrelia, carried by ticks, which causes Lyme disease; Treponema pallidum, which causes syphilis; and Leptospira, spread in water contaminated by animal urine. All are treated with antibiotics, best given early.',
    [['borrelia', 'Spirochaetes', 'Here Borrelia, about 20 micrometres long.'], ['rbc', 'Red cells', 'For scale.']],
    { q: 'spirochete motility Lyme disease syphilis' }),
];
