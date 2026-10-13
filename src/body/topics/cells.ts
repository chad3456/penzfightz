import type { Topic } from '../types';
import { chapter } from './make';

const t = chapter('cells');
const V3: [number, number, number] = [0.2, 0.3, 1];

export const CELLS: Topic[] = [
  t('animal-cell', 'Inside a cell', 'A city in a droplet', 'cell', { mode: 'cell', still: true },
    'Your body is made of about 30 trillion cells. A typical one is around 10 to 30 micrometres across, bounded by a membrane and filled with a jelly-like cytoplasm packed with organelles, each with a job: the nucleus holds the DNA, mitochondria make energy, the endoplasmic reticulum and Golgi build and ship proteins and fats, lysosomes recycle waste.\n\nA scaffold of protein fibres (the cytoskeleton) gives it shape and acts as a road network for transport. The cell has been cut open here to show inside.',
    [['membrane', 'Cell membrane', 'A double layer of lipids with proteins in it.'], ['nucleus', 'Nucleus', 'The control centre.'], ['nucleolus', 'Nucleolus', 'Builds ribosomes.'], ['pore', 'Nuclear pores', 'Gateways for RNA and proteins.'], ['rough-er', 'Rough ER', 'Studded with ribosomes that make proteins.'], ['smooth-er', 'Smooth ER', 'Makes lipids and stores calcium.'], ['golgi', 'Golgi apparatus', 'Packages and labels proteins.'], ['mitochondrion', 'Mitochondria', 'Power stations.'], ['lysosome', 'Lysosomes', 'Recycling.'], ['peroxisome', 'Peroxisomes', 'Break down fatty acids and toxins.'], ['vesicle', 'Vesicles', 'Transport bubbles.'], ['centrosome', 'Centrosome', 'Organises microtubules.'], ['cytoskeleton', 'Cytoskeleton', 'Fibres and tracks.'], ['ribosome', 'Free ribosomes', 'Make proteins for use inside the cell.'], ['cytoplasm', 'Cytoplasm', 'Crowded with proteins.']],
    { view: V3, facts: ['A revised estimate puts the human body at about 30 trillion cells, most of them red blood cells.'], q: 'eukaryotic cell organelles overview', refs: ['sender2016'] }),

  t('nucleus', 'The nucleus', 'Where the DNA lives', 'cell', { mode: 'cell', still: true },
    'The nucleus is wrapped in a double membrane, the nuclear envelope, pierced by thousands of nuclear pores that control traffic in and out: messenger RNA goes out, and proteins needed inside come in.\n\nInside, two metres of DNA are packed into a sphere about 6 micrometres across, organised with proteins into chromatin. Genes are read here into RNA. The dense nucleolus is where ribosome parts are made.',
    [['nucleus', 'Nucleus', 'Typically the largest organelle.'], ['pore', 'Nuclear pore', 'A huge protein gate made of about 30 kinds of protein.'], ['nucleolus', 'Nucleolus', 'Ribosome factory.'], ['rough-er', 'Rough ER', 'Continuous with the outer nuclear membrane.']],
    { view: V3, q: 'nuclear envelope nuclear pore complex nucleolus' }),

  t('mitochondria', 'Mitochondria', 'The cell’s power stations', 'cell', { mode: 'mito', still: true },
    'Mitochondria burn sugars and fats with oxygen to make ATP, the molecule cells spend as energy. Their inner membrane is folded into shelves (cristae) packed with the machinery of respiration, which pumps protons across the membrane; the protons flowing back drive ATP synthase.\n\nMitochondria were once free-living bacteria that were engulfed by another cell over 1.5 billion years ago. They still have their own small circle of DNA, inherited only from the mother.',
    [['outer', 'Outer membrane', 'Smooth.'], ['cristae', 'Cristae', 'Folds of the inner membrane that increase its surface.'], ['matrix', 'Matrix', 'Where the citric acid cycle runs.'], ['synthase', 'ATP synthase', 'Makes ATP.'], ['mitochondrion', 'Mitochondrion', 'Hundreds to thousands per cell; most in heart and muscle.']],
    { view: [0, 0.2, 1], q: 'mitochondria oxidative phosphorylation endosymbiosis' }),

  t('cell-membrane', 'The cell membrane', 'A fluid mosaic', 'cell', { mode: 'membrane', still: true },
    'The cell membrane is a double layer of phospholipids, molecules with a water-loving head and two water-hating tails. In water they arrange themselves tails-in, heads-out, forming a barrier only about 5 nanometres thick that keeps most charged and large molecules out.\n\nEmbedded in it, and drifting about within it, are proteins: channels, pumps, receptors and anchors, many carrying sugar chains that act as identity tags. Cholesterol tucked between the lipids adjusts its fluidity.',
    [['phospholipid', 'Phospholipid bilayer', 'Self-assembling.'], ['head', 'Heads', 'Face the watery inside and outside.'], ['tail', 'Tails', 'Make the oily core.'], ['protein', 'Channel protein', 'Lets particular molecules through.'], ['glycoprotein', 'Glycoprotein', 'Sugar chains used in recognition.'], ['cholesterol', 'Cholesterol', 'Stiffens and steadies the membrane.']],
    { view: [0.3, 0.4, 1], q: 'fluid mosaic model membrane structure' }),

  t('protein-factory', 'ER and Golgi', 'Building and shipping proteins', 'cell', { mode: 'cell', still: true },
    'Proteins destined for the membrane or for export are made by ribosomes on the rough endoplasmic reticulum, threaded into its interior as they are built, and folded there. Small vesicles carry them to the Golgi apparatus, a stack of flattened sacs where sugars are added and trimmed and the proteins are sorted.\n\nFrom the far side of the Golgi, vesicles bud off and deliver their contents to the membrane, to lysosomes, or out of the cell, as when insulin or antibodies are secreted.',
    [['rough-er', 'Rough ER', 'Folds new proteins.'], ['ribosome', 'Ribosomes', 'Translate mRNA.'], ['golgi', 'Golgi apparatus', 'Processes and sorts.'], ['vesicle', 'Vesicles', 'Carry cargo.'], ['membrane', 'Cell membrane', 'Vesicles fuse here to release their cargo.']],
    { view: V3, q: 'secretory pathway endoplasmic reticulum Golgi' }),

  t('lysosomes', 'Lysosomes and autophagy', 'Recycling inside the cell', 'cell', { mode: 'cell', still: true },
    'Lysosomes are acidic bubbles full of about 60 kinds of digestive enzyme. They break down material taken in from outside, worn-out proteins and even whole old organelles, and the building blocks are reused.\n\nIn autophagy (“self-eating”), the cell wraps damaged parts in a membrane and delivers them to lysosomes. It speeds up during fasting and stress. Yoshinori Ohsumi won the 2016 Nobel Prize for working out how it works.',
    [['lysosome', 'Lysosome', 'pH about 4.5.'], ['mitochondrion', 'Old mitochondria', 'Recycled by autophagy.'], ['vesicle', 'Vesicles', 'Deliver cargo.']],
    { view: V3, q: 'lysosome autophagy mechanism Ohsumi' }),

  t('motor-proteins', 'Motor proteins', 'Walking cargo along microtubules', 'cell', { mode: 'kinesin', still: true },
    'Cells move cargo along microtubules, hollow tubes of the protein tubulin, using motor proteins. Kinesin walks toward the cell’s edge, dynein toward the centre. Each step uses one molecule of ATP and advances 8 nanometres, with the two “feet” passing each other hand over hand.\n\nIn nerve cells, motors carry supplies along axons up to a metre long. Faults in this transport are linked to several neurological diseases.',
    [['kinesin', 'Kinesin', 'A two-headed walking motor.'], ['microtubule', 'Microtubule', 'A track 25 nanometres wide.'], ['cargo', 'Cargo vesicle', 'Many times larger than the motor.']],
    { view: [0.2, 0.25, 1], q: 'kinesin stepping mechanism axonal transport' }),

  t('mitosis', 'Mitosis', 'One cell becomes two', 'cell', { mode: 'mitosis', still: true },
    'Before dividing, a cell copies all its DNA. In mitosis the copies are shared out exactly. The chromosomes condense into compact rods, each made of two identical sister chromatids; a spindle of microtubules forms; the chromosomes line up across the middle, the sisters are pulled apart to opposite ends, and the cell pinches in two.\n\nThe result is two genetically identical cells. Errors produce cells with too many or too few chromosomes, which is common in cancer.',
    [['nucleus', 'Nucleus', 'Its envelope breaks down.'], ['chromosome', 'Chromosomes', 'Condensed copies; four shown, humans have 46.'], ['spindle', 'Spindle', 'Microtubules that pull chromosomes apart.'], ['centrosome', 'Centrosomes', 'Spindle poles.'], ['membrane', 'Cell membrane', 'Pinches in at the end.']],
    { view: V3, steps: [['Interphase', 'DNA is copied inside the nucleus.'], ['Prophase', 'Chromosomes condense; the spindle forms.'], ['Metaphase', 'Chromosomes line up at the middle.'], ['Anaphase', 'Sister chromatids are pulled apart.'], ['Telophase', 'Two nuclei form and the cell divides (cytokinesis).']], q: 'mitosis stages spindle chromosome segregation' }),

  t('meiosis', 'Meiosis', 'Making eggs and sperm', 'cell', { mode: 'meiosis', still: true },
    'Meiosis is a special division that halves the chromosome number, from 46 to 23, so that egg and sperm together restore 46. It takes two divisions. In the first, matching chromosomes from mother and father pair up, swap segments (crossing over) and separate; in the second, sister chromatids separate, as in mitosis.\n\nCrossing over and the random sorting of chromosomes mean every egg and sperm is genetically unique. The animation shows the first division in simplified form.',
    [['chromosome', 'Chromosome pairs', 'One from each parent.'], ['spindle', 'Spindle', 'Microtubules that pull chromosomes.'], ['membrane', 'Cell', 'Divides twice, giving four cells.'], ['centrosome', 'Poles', 'Organises the spindle.']],
    { view: V3, steps: [['Interphase', 'DNA copied.'], ['Pairing', 'Matching chromosomes pair and cross over.'], ['Line up', 'Pairs line up at the middle.'], ['Separate', 'Each pair is split.'], ['Divide', 'Two cells; a second division follows.']], q: 'meiosis crossing over recombination aneuploidy' }),

  t('apoptosis', 'Apoptosis', 'Programmed cell death', 'cell', { mode: 'apoptosis', still: true },
    'Every day tens of billions of cells in your body die on purpose. In apoptosis, a cell activates enzymes called caspases that dismantle it from inside: it shrinks, its DNA is chopped up, the membrane bulges into blebs, and it breaks into neat packages that neighbouring cells and macrophages swallow, without spilling contents or causing inflammation.\n\nApoptosis sculpts the developing body (it separates fingers in the embryo) and removes damaged or infected cells.',
    [['cell', 'Dying cell', 'The whole cell.'], ['nucleus', 'Fragmenting nucleus', 'Holds the DNA.'], ['bleb', 'Blebs', 'Bulges of the membrane.'], ['body', 'Apoptotic bodies', 'Eaten by phagocytes.']],
    { view: V3, steps: [['Healthy', 'A normal cell.'], ['Signal', 'A death signal activates caspases.'], ['Blebbing', 'The cell shrinks and blebs.'], ['Fragments', 'It packages itself for removal.']], q: 'apoptosis caspases mechanism development' }),

  t('endocytosis', 'Endocytosis', 'How cells swallow things', 'cell', { mode: 'endocytosis', still: true },
    'Large molecules cannot cross the membrane directly. Instead, the membrane folds inward around them, forming a pit that pinches off as a bubble (vesicle) inside the cell. Often specific receptors gather the cargo, and a protein coat called clathrin helps bend the membrane.\n\nThis is how cells take up cholesterol in LDL particles and iron, and how many viruses sneak in. The reverse process, exocytosis, releases cargo.',
    [['pit', 'Coated pit', 'The membrane bends inward.'], ['cargo', 'Cargo', 'Here held by receptors.'], ['phospholipid', 'Membrane', 'Fuses back behind the vesicle.']],
    { view: [0.3, 0.3, 1], steps: [['Binding', 'Cargo binds receptors.'], ['Pit', 'The membrane curves in.'], ['Pinch', 'The neck narrows.'], ['Vesicle', 'The bubble is inside.']], q: 'clathrin-mediated endocytosis' }),

  t('atp-synthase', 'ATP synthase', 'A rotary motor that makes energy', 'cell', { mode: 'atp', still: true },
    'ATP synthase is one of the smallest motors in nature. Protons flowing through its membrane part (Fo) spin a rotor, which turns a stalk inside the head (F1). The turning stalk squeezes the head’s three catalytic sites in turn, forcing ADP and phosphate together into ATP.\n\nEach full turn makes three ATP. Your body makes, and uses up, roughly its own weight in ATP every day.',
    [['fo', 'Fo rotor', 'Turned by protons.'], ['f1', 'F1 head', 'Makes ATP.'], ['stalk', 'Central stalk', 'Transfers the rotation.'], ['proton', 'Protons', 'Flow down their gradient.'], ['membrane', 'Inner mitochondrial membrane', 'The cell’s outer boundary.']],
    { view: [0.3, 0.2, 1], q: 'ATP synthase rotary mechanism' }),

  t('cell-types', 'Kinds of cells', 'Same genes, different jobs', 'cell', { mode: 'types', still: true },
    'There are a few hundred cell types in the body, and almost all carry the same DNA. They differ in which genes they switch on, which gives them very different shapes and jobs.\n\nNeurons grow long wires; red cells lose their nucleus to make room for haemoglobin; muscle cells fuse into long fibres with many nuclei; fat cells are mostly a single droplet of fat; sperm are built to swim, and the egg is one of the largest cells in the body.',
    [['neuron', 'Neuron', 'Sends electrical signals.'], ['rbc', 'Red blood cell', 'Carries oxygen.'], ['muscle', 'Muscle fibre', 'Many cells fused into one long fibre.'], ['epithelial', 'Epithelial cell', 'Lines surfaces.'], ['fat', 'Fat cell', 'Stores energy as a single fat droplet.'], ['sperm', 'Sperm', 'Swims with its tail.'], ['egg', 'Egg', 'About 0.1 mm, just visible to the eye.'], ['osteocyte', 'Bone cell', 'Lives inside bone and senses strain.'], ['photoreceptor', 'Rod cell', 'Detects light.']],
    { view: [0, 0.15, 1], q: 'human cell types atlas' }),

  t('stem-cells', 'Stem cells', 'Cells that can become other cells', 'micro',
    { bg: 'void', actors: [
      { k: 'stem', id: 'stem', at: [0, 0, 0], s: 1.2 },
      { k: 'stem', id: 'daughter', at: [[0, 0, 0], [0.9, 0.6, 0], [1.2, 0.8, 0]], s: [0.01, 1, 1] },
      { k: 'cell', id: 'specialised', at: [[0, 0, 0], [-1, 0.7, 0], [-1.8, 1.2, 0]], s: [0.01, 0.6, 0.9], color: '#e8b04a' },
      { k: 'rbc', id: 'blood', at: [[0, 0, 0], [-1, -0.8, 0], [-1.8, -1.3, 0]], s: [0.01, 1.2, 1.6] },
      { k: 'cell', id: 'muscle', at: [[0, 0, 0], [1, -0.8, 0], [1.8, -1.3, 0]], s: [0.01, 0.6, 0.9], color: '#b8443f' }] },
    'Stem cells can divide to make more of themselves and also give rise to specialised cells. Embryonic stem cells can become any cell type. Adult stem cells are more limited: blood stem cells make blood cells, gut stem cells renew the gut lining every few days.\n\nIn 2006, Shinya Yamanaka showed that adult skin cells could be reprogrammed into induced pluripotent stem cells by switching on four genes. These are now used to study disease and are being tested to replace lost cells, for example in Parkinson’s disease and eye disease.',
    [['stem', 'Stem cell', 'Self-renews.'], ['daughter', 'New stem cell', 'Keeps the supply going.'], ['specialised', 'Specialised cell', 'A committed descendant.'], ['blood', 'Blood cells', 'From blood stem cells.'], ['muscle', 'Muscle cells', 'From muscle satellite cells.']],
    { steps: [['Stem cell', 'Waiting.'], ['Division', 'One daughter stays a stem cell.'], ['Specialisation', 'The other becomes a working cell.']], q: 'stem cells induced pluripotent Yamanaka regenerative medicine' }),

  t('cell-signalling', 'Cell signalling', 'How a message gets into a cell', 'micro',
    { bg: 'membrane', actors: [
      { k: 'receptor', id: 'receptor', at: [0, -1.05, 0], s: 1.2, glow: [0, 0, 0.6, 0.6] },
      { k: 'mol', id: 'ligand', at: [[0, 1.6, 0], [0, 0.4, 0], [0, -0.25, 0], [0, -0.25, 0]], s: 1.4, color: '#ffd25a' },
      { k: 'mol', id: 'cascade', at: [[0, -2.3, 0], [0, -2.3, 0], [0, -2.3, 0], [0.2, -3.2, 0]], n: 20, spread: [1.2, 0.5, 0.8], color: '#7fe0ff', o: [0, 0, 0.5, 1], s: 0.8 }] },
    'Cells talk with chemical messages: hormones, growth factors, neurotransmitters. Most cannot cross the membrane, so they bind a receptor protein on the surface whose shape fits them. Binding changes the receptor’s shape on the inside, which sets off a relay of proteins inside the cell, amplifying the signal, and ends by changing what the cell does, often which genes it switches on.\n\nAbout a third of all medicines act on one family of receptors alone, the G-protein-coupled receptors.',
    [['ligand', 'Signal molecule', 'Here a hormone.'], ['receptor', 'Receptor', 'Spans the membrane.'], ['cascade', 'Signal cascade', 'Relay proteins inside the cell.'], ['membrane', 'Membrane', 'The cell’s outer boundary.']],
    { steps: [['Signal', 'The messenger arrives.'], ['Binding', 'It fits the receptor.'], ['Activation', 'The receptor changes shape.'], ['Response', 'A cascade carries the message inward.']], q: 'signal transduction receptor GPCR drug targets' }),

  t('cell-scale', 'How small is a cell?', 'Cells, bacteria and viruses to scale', 'micro',
    { bg: 'void', actors: [{ k: 'cell', id: 'cell', at: [-1.6, 0, 0], s: 3.6, o: 0.8 }, { k: 'rbc', id: 'rbc', at: [1.1, 0, 0], s: 2.6, rot: [1.2, 0, 0] }, { k: 'rod', id: 'bacterium', at: [2.4, 0, 0], s: 0.5 }, { k: 'virus', id: 'virus', at: [2.9, 0, 0], s: 0.15 }] },
    'Sizes in biology span huge ranges. A typical human cell is around 20 micrometres across; a red blood cell 7.5; a bacterium like E. coli about 2; a virus about 0.1 (100 nanometres). A protein is a few nanometres, and a water molecule about a third of a nanometre.\n\nPut another way: if a human cell were the size of a football pitch, a bacterium would be a car and a virus a tennis ball.',
    [['cell', 'Human cell', 'About 20 µm.'], ['rbc', 'Red blood cell', '7.5 µm.'], ['bacterium', 'Bacterium', 'About 2 µm.'], ['virus', 'Virus', 'About 0.1 µm.']],
    { q: 'cell size scale biology' }),
];
