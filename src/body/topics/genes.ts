import type { Topic } from '../types';
import { chapter } from './make';

const t = chapter('genes');
const F: [number, number, number] = [0.2, 0.15, 1];

export const GENES: Topic[] = [
  t('double-helix', 'The double helix', 'The shape of DNA', 'dna', { still: true },
    'DNA is two long strands wound round each other. Each strand has a backbone of alternating sugar and phosphate, with one of four bases sticking inward from every sugar: adenine (A), thymine (T), guanine (G) and cytosine (C). The bases pair across the middle, A with T and G with C, like rungs of a twisted ladder.\n\nThe helix makes a full turn every 10.5 base pairs and is about 2 nanometres wide. Its structure was worked out in 1953 by James Watson and Francis Crick, using X-ray images made by Rosalind Franklin and Raymond Gosling.',
    [['backbone', 'Sugar–phosphate backbone', 'Runs in opposite directions on the two strands.'], ['base', 'Bases', 'A green, T red, G yellow, C blue here.'], ['pair', 'Base pair', 'Held by hydrogen bonds: two for A–T, three for G–C.'], ['major', 'Major groove', 'Where most proteins read the sequence.'], ['minor', 'Minor groove', 'The narrower groove.']],
    { view: F, facts: ['Each human cell holds about 2 metres of DNA.', 'The human genome is about 3.1 billion base pairs.'], q: 'DNA double helix structure Franklin Watson Crick' }),

  t('base-pairing', 'Base pairing', 'A with T, G with C', 'dna', { still: true, seq: 'AATTGGCCATGCATGCGGCCTTAA', n: 24 },
    'The bases fit together in only two ways because of their shapes and the hydrogen bonds they can form: adenine pairs with thymine, guanine with cytosine. So each strand carries the full information for the other.\n\nThat simple rule is the basis of copying DNA, reading genes into RNA, and almost every DNA technology, from PCR to sequencing to CRISPR guides.',
    [['pair', 'Base pair', 'One small (pyrimidine) plus one large (purine) base, so every rung is the same width.'], ['base', 'Bases', 'The letters of the code.'], ['backbone', 'Backbones', 'Sugar–phosphate chain.']],
    { view: F, q: 'Watson-Crick base pairing hydrogen bonds' }),

  t('replication', 'DNA replication', 'Copying 3 billion letters', 'dna', { mode: 'replication', still: true, fit: [0, -0.5, 0, 3.6] },
    'Before a cell divides it copies its entire genome. An enzyme called helicase unzips the helix at a replication fork. DNA polymerase then builds a new strand on each old one, matching every base to its partner, so each new double helix has one old and one new strand (semi-conservative replication).\n\nPolymerase can only build in one direction, so one strand is made continuously (leading) and the other in short pieces (Okazaki fragments) that are joined later (lagging). Proofreading keeps errors to about one per billion bases.',
    [['parent', 'Parent DNA', 'Being unzipped.'], ['helicase', 'Helicase', 'A ring that unwinds the helix.'], ['polymerase', 'DNA polymerase', 'Builds the new strands.'], ['leading', 'Leading strand', 'Built continuously.'], ['lagging', 'Lagging strand', 'Built in pieces.'], ['primer', 'Primer', 'A short RNA starter.'], ['okazaki', 'Okazaki fragments', 'Joined by ligase.']],
    { view: F, steps: [['Start', 'Helicase opens the helix.'], ['Unwinding', 'The fork moves along.'], ['Copying', 'Polymerases add matching bases.'], ['Two helices', 'Each half old, half new.']], q: 'DNA replication fork leading lagging strand fidelity' }),

  t('transcription', 'Transcription', 'Reading a gene into RNA', 'dna', { mode: 'transcription', still: true, fit: [0, -0.3, 0, 3.6] },
    'To use a gene, the cell copies it into messenger RNA. RNA polymerase binds a start region (the promoter), opens a short bubble in the helix, and moves along one strand, adding matching RNA letters (with U in place of T). The RNA peels away behind it.\n\nWhich genes are transcribed, and how often, is controlled by proteins called transcription factors. This is the main way cells with the same DNA become different.',
    [['promoter', 'Promoter', 'Where transcription starts.'], ['polymerase', 'RNA polymerase', 'Reads about 50 bases a second.'], ['template', 'Template strand', 'The strand being read.'], ['mrna', 'Messenger RNA', 'The working copy.'], ['dna', 'DNA', 'Closes up again behind the polymerase.']],
    { view: F, steps: [['Bind', 'Polymerase binds the promoter.'], ['Open', 'The helix unwinds locally.'], ['Elongate', 'RNA grows.'], ['Release', 'The transcript leaves for the ribosome.']], q: 'transcription RNA polymerase II promoter' }),

  t('translation', 'Translation', 'From RNA to protein', 'dna', { mode: 'translation', still: true, fit: [0, 0.4, 0, 3.4] },
    'Ribosomes read messenger RNA three letters at a time. Each three-letter word, a codon, stands for one amino acid. Transfer RNA molecules, each carrying one amino acid and with a matching anticodon, bring the right amino acid; the ribosome links them into a growing chain.\n\nWhen it reaches a stop codon, the finished chain is released and folds into a working protein. A ribosome adds a few amino acids per second, and many ribosomes can read one mRNA at once.',
    [['mrna', 'mRNA', 'The message.'], ['codon', 'Codon', 'Three bases = one amino acid.'], ['small', 'Small subunit', 'Holds the mRNA.'], ['large', 'Large subunit', 'Joins the amino acids.'], ['trna', 'Transfer RNA', 'The adaptor.'], ['chain', 'Growing protein', 'Emerges through a tunnel.']],
    { view: F, steps: [['Start', 'The ribosome finds the start codon (AUG).'], ['Elongation', 'tRNAs deliver amino acids.'], ['Growing', 'The chain lengthens.'], ['More', 'One amino acid per codon.'], ['Stop', 'A stop codon releases the protein.']], q: 'ribosome translation mechanism tRNA' }),

  t('genetic-code', 'The genetic code', '64 codons, 20 amino acids', 'dna', { mode: 'translation', still: true, fit: [0, 0.4, 0, 3.4] },
    'With four letters in groups of three there are 64 possible codons. Sixty-one code for the 20 amino acids, so most amino acids have several codons; three mean stop. AUG means both methionine and start.\n\nThe code is almost universal: the same codons mean the same amino acids in bacteria, plants and people, which is strong evidence of common descent, and why a human gene can be made into protein by bacteria, as with insulin.',
    [['codon', 'Codon', 'Read without gaps or overlaps.'], ['mrna', 'mRNA', 'The message read by ribosomes.'], ['trna', 'tRNA', 'Matches codon to amino acid.'], ['chain', 'Protein chain', 'The growing protein.']],
    { view: F, steps: [['AUG', 'Start: methionine.'], ['Next codon', 'Each adds one amino acid.'], ['Redundancy', 'Several codons can mean the same amino acid.'], ['Chain', 'The sequence decides the protein.'], ['Stop', 'UAA, UAG or UGA end it.']], q: 'genetic code universality codon table' }),

  t('point-mutation', 'Point mutations', 'One letter changed', 'dna', { mode: 'mutation', mut: 'sub', still: true, n: 40 },
    'A point mutation changes a single base pair. Its effect depends on where it falls. It may make no difference (a silent change, since several codons mean the same amino acid), swap one amino acid for another (as in sickle cell disease), or create a premature stop codon that cuts the protein short.\n\nMutations arise from copying errors, chemicals, radiation and natural decay of DNA. Most are repaired; those in egg and sperm can be inherited; those in body cells can contribute to cancer.',
    [['mutation', 'Changed base pair', 'The changed DNA.'], ['base', 'Bases', 'The letters of the code.'], ['backbone', 'Backbone', 'Sugar–phosphate chain.']],
    { view: F, steps: [['Original', 'The correct sequence.'], ['Mutated', 'One base pair differs.']], q: 'point mutation missense nonsense silent' }),

  t('frameshift', 'Insertions and deletions', 'Shifting the reading frame', 'dna', { mode: 'mutation', mut: 'ins', still: true, n: 40 },
    'Because the code is read in threes, inserting or deleting a number of bases that is not a multiple of three shifts every codon downstream: THE CAT ATE THE RAT becomes THE CAA TAT ETH ERA T. The result is usually a garbled, shortened protein.\n\nFrameshifts cause many inherited diseases, including some forms of cystic fibrosis and Duchenne muscular dystrophy. The commonest cystic fibrosis mutation, though, deletes exactly three bases, removing one amino acid without a frameshift.',
    [['mutation', 'Inserted bases', 'The changed DNA.'], ['base', 'Downstream codons', 'All read wrongly after the insertion.'], ['backbone', 'Backbone', 'Sugar–phosphate chain.']],
    { view: F, steps: [['Original', 'In frame.'], ['Insertion', 'Extra bases shift the frame.']], q: 'frameshift mutation insertion deletion disease' }),

  t('chromatin', 'Chromatin', 'How 2 metres of DNA fits in a nucleus', 'dna', { mode: 'chromatin', still: true },
    'DNA is wound round spools of proteins called histones: about 147 base pairs wrap 1.65 turns round each eight-histone core, forming a nucleosome. Strings of nucleosomes coil and loop further into chromatin.\n\nHow tightly chromatin is packed controls which genes can be read. Chemical tags on the histone tails, added and removed by enzymes, loosen or tighten it, a key layer of gene regulation.',
    [['histone', 'Histone octamer', 'Eight histone proteins.'], ['dna', 'DNA', 'Wrapped round the core.'], ['nucleosome', 'Nucleosome', 'The basic unit.'], ['linker', 'Linker DNA', 'Between nucleosomes.'], ['tail', 'Histone tails', 'Carry chemical tags.']],
    { view: F, q: 'nucleosome structure chromatin organization histone modification' }),

  t('chromosome', 'Chromosomes', 'DNA packed for division', 'dna', { mode: 'chromosome', still: true },
    'When a cell divides, its chromatin condenses into compact chromosomes, visible under a light microscope. Each has been copied, so it consists of two identical sister chromatids joined at a pinched region, the centromere, where spindle fibres attach.\n\nHumans have 23 pairs: one of each pair from each parent. The ends are capped by protective telomeres.',
    [['chromatid', 'Sister chromatids', 'Identical copies.'], ['centromere', 'Centromere', 'Attachment point for the spindle.'], ['telomere', 'Telomeres', 'Protective end caps.'], ['chromosome', 'Chromosome', 'Thousands of times more compact than stretched-out DNA.']],
    { view: F, q: 'chromosome structure centromere telomere' }),

  t('karyotype', 'The human karyotype', '23 pairs', 'dna', { mode: 'karyotype', still: true, sex: 'XY' },
    'A karyotype arranges a person’s chromosomes in pairs by size. Pairs 1 to 22 are the autosomes, the same in everyone; the 23rd pair is the sex chromosomes: XX in most females, XY in most males. The Y carries the SRY gene that triggers male development.\n\nKaryotypes reveal large changes, such as an extra or missing chromosome, or pieces moved from one chromosome to another.',
    [['autosome', 'Autosomes', '22 pairs, numbered roughly by size.'], ['sex', 'Sex chromosomes', 'Here X and the smaller Y.']],
    { view: [0, 0, 1], q: 'human karyotype chromosome number' }),

  t('down-syndrome', 'Down syndrome', 'An extra chromosome 21', 'dna', { mode: 'karyotype', trisomy: 21, sex: 'XX', still: true },
    'Down syndrome is caused by a third copy of chromosome 21 (trisomy 21), usually from an error when chromosomes separate during the making of the egg. The chance rises with maternal age.\n\nThe extra copies of genes lead to characteristic features, learning disability of varying degree, and higher rates of heart defects, thyroid problems and early Alzheimer’s disease. Life expectancy has risen dramatically, to around 60 years in many countries.',
    [['extra', 'Third chromosome 21', 'The additional copy.'], ['autosome', 'Other chromosomes', 'In normal pairs.'], ['sex', 'Sex chromosomes', 'XX here.']],
    { view: [0, 0, 1], q: 'Down syndrome trisomy 21 review' }),

  t('crispr', 'CRISPR gene editing', 'Molecular scissors with a guide', 'dna', { mode: 'crispr', still: true, fit: [0, 0.3, 0, 3.4] },
    'CRISPR began as a bacterial immune system against viruses. Cas9 is an enzyme that carries a short guide RNA; it scans DNA, and where the guide matches (next to a short tag sequence called PAM), it unwinds the helix and cuts both strands.\n\nThe cell then repairs the cut, and scientists can use that repair to disable a gene or write in a new sequence. Jennifer Doudna and Emmanuelle Charpentier won the 2020 Nobel Prize, and the first CRISPR therapy, for sickle cell disease and beta-thalassaemia, was approved in 2023.',
    [['cas9', 'Cas9', 'The cutting enzyme.'], ['guide', 'Guide RNA', 'About 20 bases matching the target.'], ['pam', 'PAM site', 'NGG next to the target.'], ['cut', 'Double-strand cut', 'Where Cas9 cuts both strands.'], ['dna', 'Target DNA', 'The target sequence.']],
    { view: F, steps: [['Search', 'Cas9 scans the DNA.'], ['Match', 'The guide pairs with the target.'], ['Cut', 'Both strands are cut.'], ['Repair', 'The cell rejoins the ends, sometimes with an edit.']], q: 'CRISPR Cas9 mechanism genome editing therapy', refs: ['jinek2012'] }),

  t('pcr', 'PCR', 'Copying DNA billions of times', 'dna', { mode: 'pcr', still: true },
    'The polymerase chain reaction copies a chosen stretch of DNA over and over. A tube holds the sample, short primers that mark the two ends of the target, DNA letters, and a heat-stable polymerase. Each cycle heats the mix to separate the strands, cools it so primers attach, then warms it so the polymerase copies.\n\nEvery cycle doubles the target, so 30 cycles give about a billion copies. Kary Mullis devised it in 1983. It is used in diagnosis, including COVID-19 tests, forensics and research.',
    [['copies', 'DNA copies', 'Doubling each cycle.']],
    { view: F, steps: [['Start', 'One target molecule.'], ['Two cycles', 'Four copies.'], ['Four cycles', 'Sixteen copies.'], ['Six cycles', '64 copies; after 30 cycles, about a billion.']], q: 'polymerase chain reaction principle' }),

  t('epigenetics', 'Epigenetics', 'Marks on the DNA', 'dna', { mode: 'methyl', still: true, seq: 'ACGTCGACGGCATCGCGTTACGCGATCG', n: 40 },
    'Epigenetic marks change how genes are used without changing the sequence. The best known is DNA methylation: a small chemical group added to cytosines, usually where C is followed by G. Methylated stretches near a gene’s start tend to keep it switched off.\n\nThese marks are copied when cells divide, which is how a liver cell stays a liver cell. They shift with age and environment, and abnormal methylation is common in cancer. How far they pass between generations in humans is still debated.',
    [['methyl', 'Methyl groups', 'Shown as pink dots.'], ['base', 'Cytosines', 'The usual site.'], ['backbone', 'DNA', 'Sugar–phosphate chain.']],
    { view: F, q: 'DNA methylation epigenetic regulation gene silencing' }),

  t('splicing', 'RNA splicing', 'Cutting out the gaps', 'dna', { mode: 'splicing', still: true },
    'Most human genes are interrupted. The first RNA copy contains exons, which carry the code, and introns, stretches that are cut out. A large machine called the spliceosome removes the introns and joins the exons.\n\nBy choosing different combinations of exons (alternative splicing), one gene can make several different proteins, which helps explain how about 20,000 genes make so many proteins.',
    [['exon', 'Exons', 'Kept.'], ['intron', 'Introns', 'Removed.'], ['spliceosome', 'Spliceosome', 'Made of RNA and protein.']],
    { view: F, steps: [['Pre-mRNA', 'Exons and introns together.'], ['Splicing', 'Introns are looped out.'], ['Mature mRNA', 'Only exons remain.']], q: 'pre-mRNA splicing alternative spliceosome' }),

  t('protein-folding', 'Protein folding', 'From chain to shape', 'dna', { mode: 'protein', still: true, fit: [0, 0, 0, 2.2] },
    'A protein starts as a string of amino acids, but works only when folded into a precise 3D shape. Parts of the chain curl into spirals (alpha helices) or zig-zag sheets (beta sheets), and these pack together, with water-hating parts buried inside.\n\nShape decides function: an enzyme’s active site, a receptor’s binding pocket. Misfolded proteins can clump, as in Alzheimer’s and Parkinson’s. Predicting shape from sequence was a 50-year problem until AlphaFold largely solved it in 2020.',
    [['protein', 'Protein chain', 'Coloured from start (blue) to end (red).'], ['helix', 'Alpha helix', 'A spiral section of the chain.'], ['sheet', 'Beta strand', 'A flat, pleated section.'], ['site', 'Active site', 'Where the work is done.']],
    { view: F, steps: [['Unfolded', 'A straight chain.'], ['Folding', 'Helices and strands form.'], ['Packing', 'They come together.'], ['Folded', 'A working shape.']], q: 'protein folding structure prediction AlphaFold', refs: ['jumper2021'] }),

  t('telomeres', 'Telomeres and ageing', 'Chromosome caps that wear down', 'dna', { mode: 'telomere', still: true },
    'Telomeres are long runs of the repeat TTAGGG at chromosome ends, bound by protective proteins. Because DNA copying cannot reach the very end of a strand, telomeres shorten a little with every division.\n\nShort telomeres are associated with ageing, and when they get critically short cells stop dividing. Stem cells and egg and sperm precursors use telomerase to keep theirs long. Rare inherited telomere faults cause early bone marrow failure and lung scarring.',
    [['telomere', 'Telomere', 'Protective end cap.'], ['chromatid', 'Chromatids', 'One of two identical copies.'], ['centromere', 'Centromere', 'Holds the sister chromatids together.']],
    { view: F, steps: [['Young', 'Long telomeres.'], ['Dividing', 'Shortening.'], ['Old', 'Short.'], ['Senescent', 'Division stops.']], q: 'telomere length ageing telomerase' }),

  t('mitochondrial-dna', 'Mitochondrial DNA', 'A second genome, from mother', 'dna', { mode: 'circle', still: true },
    'Each mitochondrion carries a small circle of DNA of its own, 16,569 base pairs coding 37 genes, all for the machinery of energy production. It is a relic of the bacteria mitochondria once were.\n\nBecause sperm mitochondria are destroyed after fertilisation, it is inherited only from the mother. That makes it useful for tracing maternal ancestry. Mutations in it cause rare diseases affecting energy-hungry organs such as muscle and brain.',
    [['plasmid', 'Mitochondrial genome', 'Hundreds to thousands of copies per cell.'], ['gene', 'Genes', '13 proteins, 22 tRNAs and 2 rRNAs.']],
    { view: [0.3, 1, 0.6], q: 'mitochondrial DNA inheritance disease' }),

  t('sex-chromosomes', 'X and Y', 'Sex chromosomes', 'dna', { mode: 'karyotype', sex: 'XX', still: true },
    'The X chromosome is large and carries about 800 protein-coding genes; the Y is small, with fewer than 100, including SRY, which starts development of testes. In XX cells, one X is switched off early in development (X-inactivation), so both sexes have one active X.\n\nBecause males have only one X, faults in X-linked genes, such as those causing haemophilia or red–green colour blindness, show up far more often in males.',
    [['sex', 'Sex chromosomes', 'Here XX.'], ['autosome', 'Autosomes', 'Non-sex chromosomes.']],
    { view: [0, 0, 1], q: 'X inactivation Y chromosome SRY' }),
];
