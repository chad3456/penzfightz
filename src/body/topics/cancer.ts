import type { Topic } from '../types';
import { chapter } from './make';

const t = chapter('cancer');
type V3 = [number, number, number];
const NORMAL = (n = 16, spread: V3 = [3, 0.4, 1.6]) => ({ k: 'cell', id: 'normal', at: [0, -0.7, 0] as V3, n, spread, s: 0.6 });

export const CANCER: Topic[] = [
  t('what-is-cancer', 'What cancer is', 'Cells that stop following the rules', 'micro',
    { bg: 'tissue', actors: [NORMAL(), { k: 'cancer', id: 'cancer', at: [0, -0.3, 0.2], n: 1, s: 0.7 }, { k: 'cancer', id: 'clone', at: [0, 0, 0.2], n: 14, spread: [0.9, 0.6, 0.7], s: [0.01, 0.4, 0.55, 0.65] }] },
    'Cancer is not one disease but hundreds, all sharing one feature: cells that have accumulated changes in their DNA (mutations) that let them grow and divide without the usual controls, ignore signals to stop or die, and eventually invade surrounding tissue and spread.\n\nThe mutations build up over years, from copying errors, tobacco smoke, UV light, some viruses and inherited faults. That is why most cancers become commoner with age.',
    [['normal', 'Normal cells', 'Divide only when told to, and stop when crowded.'], ['cancer', 'First cancer cell', 'Has gathered several key mutations.'], ['clone', 'Tumour', 'All descended from one cell, still gathering new mutations.']],
    { steps: [['One cell', 'A cell acquires driver mutations.'], ['Growth', 'Its descendants outgrow neighbours.'], ['Tumour', 'A mass forms.'], ['Invasion', 'Cells push into nearby tissue.']], q: 'cancer somatic evolution driver mutations' }),

  t('hallmarks', 'The hallmarks of cancer', 'What a cancer cell must learn to do', 'micro',
    { bg: 'tissue', actors: [{ k: 'cancer', id: 'tumour', at: [0, 0, 0], n: 12, spread: 0.8, s: 0.6 }, { k: 'lymph', id: 'immune', at: [1.8, 0.3, 0.6], n: 3, spread: 0.4, s: 0.6 }, { k: 'macrophage', id: 'macrophage', at: [-1.8, 0.2, -0.4], s: 0.6 }, { k: 'arrow', id: 'vessels', path: [[-2.4, -0.6, 0.8], [-1, 0.2, 0.6], [0, 0.3, 0.5]], color: '#d1363a' }] },
    'In 2000, Douglas Hanahan and Robert Weinberg proposed that, despite their variety, cancers share a small set of acquired capabilities, which they updated in 2011 and Hanahan expanded in 2022. Among them: sustaining growth signals, evading growth suppressors, resisting cell death, unlimited replication, growing new blood vessels, invading and spreading, reprogramming metabolism, and evading the immune system.\n\nUnderlying them are enabling features such as genome instability and tumour-promoting inflammation. The framework helps explain why combination treatments that hit several hallmarks can work better.',
    [['tumour', 'Tumour cells', 'Each hallmark is a skill acquired through mutation and selection.'], ['vessels', 'New blood vessels', 'Angiogenesis.'], ['immune', 'Evaded T cells', 'Immune escape.'], ['macrophage', 'Co-opted macrophage', 'Tumour-promoting inflammation.']],
    { q: 'hallmarks of cancer new dimensions', refs: ['hallmarks2022'] }),

  t('cancer-mutation', 'A mutation in a cancer gene', 'One letter, a switch stuck on', 'dna', { mode: 'mutation', mut: 'sub', still: true, n: 40 },
    'Genes that control cell division come in two kinds. Proto-oncogenes, such as RAS, are accelerators; a mutation can jam them on, turning them into oncogenes. Tumour suppressor genes, such as TP53 and RB1, are brakes; both copies usually have to be lost for the brake to fail.\n\nA single changed base pair can be enough to alter the protein. Here one pair swaps; step through to see it change.',
    [['mutation', 'The mutated base pair', 'A substitution: one letter for another.'], ['backbone', 'DNA backbone', ''], ['base', 'Bases', 'A–T and G–C pairs.']],
    { steps: [['Normal', 'The original sequence.'], ['Mutated', 'One base pair changes.']], q: 'oncogenes tumor suppressor genes RAS TP53' }),

  t('tumour-growth', 'How a tumour grows', 'From a few cells to a mass', 'micro',
    { bg: 'tissue', actors: [NORMAL(20, [3, 0.4, 1.8]), { k: 'cancer', id: 'tumour', at: [0, -0.2, 0], n: 22, spread: [0.4, 0.3, 0.4], s: [0.3, 0.5, 0.6, 0.65] }, { k: 'cancer', id: 'tumour', at: [0, 0.1, 0], n: 20, spread: [1.1, 0.7, 0.9], s: [0.01, 0.01, 0.5, 0.6], seed: 7 }, { k: 'fragment', id: 'necrosis', at: [0, 0.1, 0], n: 8, spread: 0.3, s: [0.01, 0.01, 0.01, 1.2], color: '#4a3040' }] },
    'A tumour starts as a microscopic cluster. Without its own blood supply it can grow to only about 1 to 2 millimetres, because cells further than that from a vessel run out of oxygen. Beyond that it must recruit new vessels.\n\nAs it grows, the cells keep mutating and competing, so a tumour becomes a patchwork of different subclones. The centre of large tumours often dies (necrosis) where blood flow cannot keep up.',
    [['tumour', 'Tumour cells', 'Crowding out normal tissue.'], ['normal', 'Normal tissue', 'Displaced.'], ['necrosis', 'Necrotic core', 'Starved cells at the centre.']],
    { steps: [['Cluster', 'A small group of cells.'], ['Expansion', 'They divide faster than they die.'], ['Mass', 'A visible lump.'], ['Necrosis', 'The centre outgrows its supply.']], q: 'tumor growth hypoxia necrosis clonal heterogeneity' }),

  t('angiogenesis', 'Angiogenesis', 'Tumours that grow their own blood supply', 'micro',
    { bg: 'tissue', actors: [{ k: 'cancer', id: 'tumour', at: [0, 0, 0], n: 18, spread: 0.7, s: 0.55 }, { k: 'mol', id: 'vegf', at: [0, 0, 0], n: 40, spread: 1.6, color: '#ffd25a', s: 0.5, o: [1, 1, 0.5] },
      { k: 'arrow', id: 'vessels', path: [[-3, -0.8, 0], [-1.8, -0.4, 0.3], [-0.8, -0.1, 0.4]], color: '#d1363a', o: [0, 1, 1] }, { k: 'arrow', path: [[3, -0.6, 0.2], [1.8, -0.2, 0.5], [0.8, 0, 0.5]], color: '#d1363a', o: [0, 0, 1] }, { k: 'arrow', path: [[0.2, -1.6, 1.2], [0.1, -1, 0.9], [0.1, -0.5, 0.6]], color: '#d1363a', o: [0, 0, 1] }] },
    'Starved of oxygen, tumour cells release growth factors, chiefly VEGF (vascular endothelial growth factor). Nearby blood vessels respond by sprouting new branches toward the tumour, bringing oxygen and nutrients and a route to spread.\n\nThese new vessels are disorganised and leaky. Judah Folkman proposed in 1971 that blocking this process could starve tumours; drugs such as bevacizumab that block VEGF are now used in several cancers, usually together with chemotherapy.',
    [['tumour', 'Tumour', 'Hypoxic cells signal for blood.'], ['vegf', 'VEGF', 'Diffuses out as a signal.'], ['vessels', 'New vessel sprouts', 'Grow toward the signal.']],
    { steps: [['Hypoxia', 'The tumour outgrows its oxygen supply.'], ['Signal', 'It releases VEGF.'], ['Sprouts', 'Vessels grow in.']], q: 'tumor angiogenesis VEGF anti-angiogenic therapy' }),

  t('metastasis', 'Metastasis', 'How cancer spreads', 'micro',
    { bg: 'vessel', fit: [0, -0.4, 0, 2.6], actors: [
      { k: 'rbc', n: 16, spread: [5, 1.6, 1.6] },
      { k: 'cancer', id: 'tumour', at: [-1.8, -2.5, 0.4], n: 10, spread: 0.5, s: 0.5 },
      { k: 'cancer', id: 'ctc', at: [[-1.6, -2.1, 0.4], [-1.2, -1.0, 0.3], [0.8, 0, 0], [2.0, -1.0, 0.3], [2.2, -2.4, 0.3]], s: 0.55, glow: [0, 0.3, 0.3, 0.3, 0] },
      { k: 'platelet', id: 'platelets', at: [[-1.2, -1.0, 0.3], [-1.2, -1.0, 0.3], [0.8, 0, 0], [2.0, -1.0, 0.3], [2.0, -1.0, 0.3]], n: 6, spread: 0.3, o: [0, 0, 1, 1, 0] },
      { k: 'cancer', id: 'secondary', at: [2.2, -2.6, 0.3], n: 6, spread: 0.4, s: [0.01, 0.01, 0.01, 0.01, 0.45] }] },
    'Most cancer deaths are caused not by the first tumour but by its spread. To metastasise, a cell must break away, squeeze into a blood or lymph vessel, survive the journey (often cloaked in platelets), stick to a vessel wall somewhere else, squeeze out, and grow in a foreign organ.\n\nEach step is hard, so only a tiny fraction of the cells that escape succeed. Different cancers favour different destinations: breast and prostate cancers often go to bone, colon cancer to the liver.',
    [['tumour', 'Primary tumour', ''], ['ctc', 'Circulating tumour cell', 'Travelling in the blood.'], ['platelets', 'Platelet cloak', 'Shields it from immune cells.'], ['secondary', 'Secondary tumour', 'A metastasis.'], ['wall', 'Vessel wall', 'Crossed twice.']],
    { steps: [['Invade', 'Cells loosen and move.'], ['Enter', 'They cross into a vessel.'], ['Travel', 'Carried in the blood.'], ['Exit', 'They stick and squeeze out.'], ['Colonise', 'A new tumour grows.']], q: 'metastatic cascade circulating tumor cells' }),

  t('microenvironment', 'The tumour microenvironment', 'A tumour is not just cancer cells', 'micro',
    { bg: 'tissue', actors: [{ k: 'cancer', id: 'cancer', at: [0, 0, 0], n: 12, spread: 0.9, s: 0.5 }, { k: 'macrophage', id: 'macrophage', at: [0, 0, 0], n: 3, spread: 1.4, s: 0.55 }, { k: 'lymph', id: 'tcell', at: [1.8, 0.2, 0.5], n: 4, spread: 0.5, s: 0.55 }, { k: 'cell', id: 'fibroblast', at: [0, -0.4, 0], n: 4, spread: [2, 0.2, 1.4], s: 0.6, color: '#e8c8a8' }, { k: 'arrow', id: 'vessel', path: [[-2.8, -0.5, -0.6], [-1, -0.2, -0.3], [0.6, 0, -0.4]], color: '#d1363a' }] },
    'A tumour is an organ of sorts: cancer cells live alongside fibroblasts that lay down tough tissue, immune cells, and blood vessels. Many of these normal cells are co-opted: tumour-associated macrophages release growth signals, and fibroblasts build barriers that keep T cells out.\n\nWhether T cells can get into a tumour (“hot” versus “cold” tumours) strongly predicts how well it will respond to immunotherapy.',
    [['cancer', 'Cancer cells', ''], ['macrophage', 'Tumour-associated macrophages', 'Often help the tumour.'], ['tcell', 'T cells', 'Often held at the edge.'], ['fibroblast', 'Cancer-associated fibroblasts', 'Build stiff surrounding tissue.'], ['vessel', 'Blood vessel', '']],
    { q: 'tumor microenvironment immune infiltration hot cold' }),

  t('checkpoint-inhibitors', 'Immune checkpoint drugs', 'Releasing the brakes on T cells', 'micro',
    { bg: 'tissue', actors: [
      { k: 'lymph', id: 'tcell', at: [[-1.05, 0, 0], [-1.05, 0, 0], [-1.0, 0, 0]], s: 1.2, glow: [0, 0, 0.4] },
      { k: 'cancer', id: 'cancer', at: [0.55, 0, 0], s: [1.2, 1.2, 0.5], o: [1, 1, 0.2] },
      { k: 'receptor', id: 'pd1', at: [-0.25, 0.1, 0.4], s: 0.5, rot: [0, 0, -1.57], color: '#8fb8ff' },
      { k: 'nanobody', id: 'drug', at: [[-1.6, 1.4, 0.4], [-0.25, 0.4, 0.4], [-0.25, 0.4, 0.4]], s: 1.6, color: '#ffffff', o: [0, 1, 1] }] },
    'T cells carry “checkpoint” receptors such as PD-1 and CTLA-4 that switch them off, a safety system that prevents autoimmunity. Many tumours exploit it by displaying PD-L1, which binds PD-1 and tells attacking T cells to stand down.\n\nCheckpoint inhibitors are antibodies that block these receptors, letting T cells attack again. They have produced long-lasting remissions in some patients with melanoma, lung cancer and other cancers, and won James Allison and Tasuku Honjo the 2018 Nobel Prize. Side effects come from T cells attacking normal organs.',
    [['tcell', 'T cell', 'Switched off by the tumour, then released.'], ['pd1', 'PD-1', 'The brake receptor.'], ['cancer', 'Cancer cell with PD-L1', 'Uses PD-L1 to switch off T cells.'], ['drug', 'Checkpoint antibody', 'Blocks PD-1.']],
    { steps: [['Stand-off', 'PD-L1 binds PD-1; the T cell is disabled.'], ['Drug', 'An anti-PD-1 antibody blocks the receptor.'], ['Attack', 'The T cell kills the cancer cell.']], q: 'immune checkpoint inhibitors PD-1 CTLA-4 mechanism', refs: ['ribas2018'] }),

  t('car-t', 'CAR-T cell therapy', 'Engineering a patient’s own T cells', 'micro',
    { bg: 'vessel', fit: [0, 0, 0, 2.4], actors: [{ k: 'rbc', n: 12, spread: [5, 1.6, 1.6] }, { k: 'lymph', id: 'car', at: [[-2.4, 0.5, 0], [-0.8, 0.2, 0], [0.4, 0, 0]], n: 4, spread: 0.6, s: 0.8, color: '#9fe8c8', glow: [0.2, 0.3, 0.5] }, { k: 'lymph', id: 'leukaemia', at: [0.8, 0, 0], n: 10, spread: [1.6, 1, 1], s: [0.75, 0.75, 0.3], color: '#b88fd9', o: [1, 1, 0.2] }] },
    'In CAR-T therapy, T cells are taken from a patient’s blood and given a gene for a chimeric antigen receptor (CAR): an artificial receptor that recognises a protein on cancer cells, such as CD19 on B-cell leukaemias and lymphomas, and switches the T cell on.\n\nThe cells are multiplied in the lab and infused back, where they hunt and kill cancer cells and can persist for years. It has cured some patients with otherwise untreatable blood cancers. Side effects include a strong inflammatory reaction (cytokine release syndrome).',
    [['car', 'CAR-T cells', 'The patient’s own T cells, re-armed.'], ['leukaemia', 'Cancer cells', 'Recognised by their CD19.'], ['wall', 'Blood vessel', 'CAR-T cells circulate and enter tissues.']],
    { steps: [['Infused', 'CAR-T cells enter the blood.'], ['Hunt', 'They find cells carrying the target.'], ['Kill', 'Cancer cells are destroyed.']], q: 'CAR-T cell therapy CD19 outcomes' }),

  t('chemotherapy', 'Chemotherapy', 'Hitting dividing cells', 'micro',
    { bg: 'tissue', actors: [NORMAL(14), { k: 'cancer', id: 'cancer', at: [0, 0.1, 0], n: 16, spread: 0.8, s: [0.55, 0.55, 0.35], o: [1, 1, 0.3] }, { k: 'pill', id: 'drug', at: [[0, 2.4, 0], [0, 0.6, 0], [0, 0.2, 0]], n: 20, spread: 1.3, s: 0.35 }, { k: 'fragment', id: 'dead', at: [0, 0.1, 0], n: 18, spread: 0.9, o: [0, 0, 1], color: '#b06a96' }] },
    'Most traditional chemotherapy drugs damage DNA or the machinery of cell division, so they hit cells that divide often. Cancer cells are especially vulnerable because they divide rapidly and often have broken DNA repair.\n\nBut some healthy cells also divide quickly: hair follicles, the gut lining, bone marrow. That causes hair loss, nausea, mouth sores and low blood counts. Treatment is given in cycles so healthy tissue can recover between doses.',
    [['drug', 'Chemotherapy drug', ''], ['cancer', 'Cancer cells', 'Killed in greater numbers.'], ['normal', 'Normal cells', 'Mostly survive.'], ['dead', 'Dying cells', 'Cleared by the body.']],
    { steps: [['Before', 'A tumour in normal tissue.'], ['Dose', 'The drug reaches all cells.'], ['Effect', 'Dividing cancer cells die.']], q: 'chemotherapy mechanism cell cycle side effects' }),

  t('radiotherapy', 'Radiotherapy', 'Breaking DNA with focused energy', 'micro',
    { bg: 'tissue', actors: [NORMAL(14), { k: 'cancer', id: 'cancer', at: [0, 0, 0], n: 14, spread: 0.7, s: [0.55, 0.55, 0.3], o: [1, 1, 0.3] }, { k: 'arrow', id: 'beam', path: [[-3, 2.4, 0], [-1.5, 1.2, 0], [-0.1, 0.1, 0]], color: '#9fe8ff', o: [0, 1, 0] }, { k: 'arrow', path: [[3, 2.4, 0.4], [1.5, 1.2, 0.2], [0.1, 0.1, 0]], color: '#9fe8ff', o: [0, 1, 0] }, { k: 'arrow', path: [[0, 2.8, -1.2], [0, 1.5, -0.6], [0, 0.2, 0]], color: '#9fe8ff', o: [0, 1, 0] }] },
    'Radiotherapy uses beams of high-energy X-rays or particles to break DNA, mostly through short-lived reactive molecules made from water. Cells that cannot repair the breaks die when they next try to divide.\n\nModern machines shape and aim beams from many angles so they overlap on the tumour while each passes lightly through healthy tissue. Doses are split into many small fractions, letting normal cells, which repair DNA better, recover in between.',
    [['beam', 'Radiation beams', 'Converge on the tumour.'], ['cancer', 'Tumour', 'Receives the full dose.'], ['normal', 'Surrounding tissue', 'Receives much less.']],
    { steps: [['Plan', 'The tumour is mapped on scans.'], ['Treat', 'Beams converge from several angles.'], ['Effect', 'Damaged cancer cells die over the following weeks.']], q: 'radiotherapy fractionation DNA damage' }),

  t('targeted-therapy', 'Targeted therapy', 'Blocking the broken switch', 'micro',
    { bg: 'membrane', actors: [
      { k: 'receptor', id: 'receptor', at: [0, -1.05, 0], s: 1.2, glow: [0.6, 0.6, 0] },
      { k: 'receptor', at: [1.4, -1.05, 0.4], s: 1.2, glow: [0.6, 0.6, 0] },
      { k: 'mol', id: 'signal', at: [[0, -2.0, 0], [0, -2.0, 0], [0, -2.0, 0]], n: 20, spread: [1.5, 0.3, 1], color: '#ffd25a', o: [1, 1, 0] },
      { k: 'pill', id: 'drug', at: [[-2.4, 1.2, 0], [-0.1, -0.2, 0.2], [-0.1, -0.2, 0.2]], n: 2, spread: [1.4, 0.1, 0.4], s: 0.6, color: '#ffffff' }] },
    'Some cancers depend on a single overactive protein, often a receptor or enzyme switched on by a mutation. Targeted drugs block that protein specifically: imatinib shuts down the BCR-ABL enzyme in chronic myeloid leukaemia, trastuzumab blocks the HER2 receptor in some breast cancers, and EGFR inhibitors treat lung cancers with EGFR mutations.\n\nTesting the tumour for the target first is essential. Responses can be dramatic, but cancers often evolve resistance, so new drugs and combinations keep being developed.',
    [['receptor', 'Overactive receptor', 'Sends constant growth signals.'], ['signal', 'Growth signals', 'Shut off by the drug.'], ['drug', 'Targeted drug', 'Fits one protein.'], ['membrane', 'Cell membrane', '']],
    { steps: [['Signalling', 'The receptor is stuck on.'], ['Drug binds', 'It blocks the receptor.'], ['Silenced', 'Growth signals stop.']], q: 'targeted cancer therapy imatinib HER2 EGFR' }),

  t('avoiding-death', 'Escaping cell death', 'Apoptosis and how cancer avoids it', 'cell', { mode: 'apoptosis', still: true },
    'Healthy cells with badly damaged DNA normally kill themselves in a tidy, programmed way called apoptosis: they shrink, bulge into blebs and break into neat packages that macrophages clear without inflammation. The protein p53 often triggers it.\n\nCancer cells frequently disable this programme, by losing p53 or making too much of anti-death proteins such as BCL-2. Venetoclax, a drug that blocks BCL-2, restores the ability to die in some leukaemias.',
    [['cell', 'Cell', 'Commits to dying.'], ['nucleus', 'Nucleus', 'Condenses and breaks up.'], ['bleb', 'Blebs', 'The membrane bulges.'], ['body', 'Apoptotic bodies', 'Packages for clean-up.']],
    { view: [0.2, 0.3, 1], steps: [['Healthy', 'A normal cell.'], ['Trigger', 'Damage activates the death programme.'], ['Blebbing', 'The cell shrinks and blebs.'], ['Fragments', 'It breaks into apoptotic bodies.']], q: 'apoptosis evasion cancer BCL-2 p53' }),

  t('telomeres-cancer', 'Telomeres and immortal cells', 'Counting divisions', 'dna', { mode: 'telomere', still: true },
    'The ends of each chromosome are capped by telomeres, thousands of repeats of the sequence TTAGGG. Every time a normal cell divides, its telomeres shorten slightly; when they get too short, the cell stops dividing. This limits how many times most cells can divide (about 50, the Hayflick limit).\n\nAbout 90% of cancers switch on telomerase, an enzyme that rebuilds telomeres, letting them divide indefinitely. Elizabeth Blackburn, Carol Greider and Jack Szostak won the 2009 Nobel Prize for this work.',
    [['telomere', 'Telomeres', 'Protective caps that shorten with each division.'], ['chromatid', 'Chromatids', ''], ['centromere', 'Centromere', '']],
    { view: [0.2, 0.2, 1], steps: [['Young cell', 'Long telomeres.'], ['Many divisions', 'Shorter.'], ['Critical', 'Very short: division stops, unless telomerase rebuilds them.'], ['Senescence', 'The cell retires.']], q: 'telomerase cancer replicative immortality' }),

  t('warburg', 'Cancer metabolism', 'The Warburg effect', 'micro',
    { bg: 'void', actors: [{ k: 'cancer', id: 'cancer', at: [0.8, 0, 0], s: 1.5 }, { k: 'cell', id: 'normal', at: [-1.6, 0, 0], s: 1.2 }, { k: 'mol', id: 'glucose', at: [[0.8, 2.2, 0], [0.8, 1.0, 0], [0.8, 0.1, 0]], n: 30, spread: 0.7, color: '#7fe0ff', s: 0.7 }, { k: 'mol', at: [[-1.6, 2.2, 0], [-1.6, 1.2, 0], [-1.6, 0.4, 0]], n: 6, spread: 0.6, color: '#7fe0ff', s: 0.7 }, { k: 'mol', id: 'lactate', at: [[0.8, 0, 0], [1.6, -0.6, 0], [2.6, -1.4, 0]], n: 20, spread: 0.5, color: '#ff9d6b', s: 0.6, o: [0, 1, 1] }] },
    'In the 1920s Otto Warburg noticed that tumours gulp glucose and turn much of it into lactate even when oxygen is plentiful, rather than burning it fully in their mitochondria. This is wasteful for energy but may help supply the building blocks dividing cells need.\n\nThe hunger for glucose is exploited in PET scans: a radioactive glucose look-alike (FDG) is injected and lights up tumours that take up large amounts.',
    [['cancer', 'Cancer cell', 'Takes up glucose fast.'], ['normal', 'Normal cell', 'Takes up less and burns it fully.'], ['glucose', 'Glucose', ''], ['lactate', 'Lactate', 'Released, acidifying the tumour surroundings.']],
    { steps: [['Uptake', 'Glucose arrives.'], ['Fermentation', 'Cancer cells ferment it.'], ['Lactate', 'Lactate is exported.']], q: 'Warburg effect aerobic glycolysis FDG-PET' }),

  t('colorectal-cancer', 'From polyp to bowel cancer', 'A slow sequence, and a chance to catch it', 'organ', { mode: 'colon', polyp: true, still: true },
    'Most bowel cancers begin as a small, harmless growth in the lining of the colon, a polyp. Over about ten years, a series of mutations, often starting with the APC gene and adding KRAS and TP53, can turn some polyps into cancer that invades the wall.\n\nThis long, visible lead time is why screening works: stool tests and colonoscopy find polyps and early cancers, and polyps can be removed during colonoscopy before they ever become cancer.',
    [['polyp', 'Polyp', 'Grows, and may turn malignant.'], ['wall', 'Colon wall', 'Cancer invades through its layers.'], ['microbiome', 'Gut bacteria', 'Some may contribute.']],
    { view: [0.2, 0.15, 1], steps: [['Small polyp', 'An early adenoma.'], ['Growing', 'More mutations accumulate.'], ['Cancer', 'Invasion begins.']], q: 'adenoma carcinoma sequence colorectal screening' }),

  t('melanoma', 'Melanoma', 'Cancer of the pigment cells', 'senses', { mode: 'skin', melanoma: true, still: true },
    'Melanoma starts in melanocytes, the cells that make skin pigment. UV radiation from the sun and sunbeds is the main cause; many melanomas carry mutations in a gene called BRAF. It can also arise in places never exposed to sun.\n\nWarning signs in a mole follow the ABCDE rule: asymmetry, irregular border, uneven colour, diameter over 6 mm, and evolving over time. Caught early it is usually cured by removal; for advanced melanoma, immunotherapy and BRAF-targeted drugs have greatly improved survival.',
    [['melanin', 'Melanocytes', 'Pigment cells at the base of the epidermis.'], ['epidermis', 'Epidermis', 'Where melanoma begins.'], ['dermis', 'Dermis', 'Invasion depth predicts outcome.']],
    { view: [0.3, 0.4, 1], q: 'melanoma BRAF immunotherapy survival' }),

  t('liquid-biopsy', 'Liquid biopsy', 'Finding cancer in a blood sample', 'micro',
    { bg: 'vessel', fit: [0, 0, 0, 2.4], actors: [{ k: 'rbc', n: 22, spread: [5, 1.6, 1.6] }, { k: 'mrna', id: 'ctdna', n: 18, spread: [4, 1.4, 1.4], color: '#c44f9e', s: 0.5 }, { k: 'cancer', id: 'ctc', at: [0.5, 0.3, 0.3], s: 0.45 }, { k: 'mrna', id: 'cfdna', n: 26, spread: [4, 1.4, 1.4], color: '#4fb3d9', s: 0.5, seed: 4 }] },
    'Dying cells shed fragments of DNA into the blood. In people with cancer, a small fraction of this free-floating DNA comes from the tumour (circulating tumour DNA) and carries its mutations. Rarely, whole tumour cells are found too.\n\nSequencing these fragments can identify mutations for targeted treatment, track response, and spot relapse earlier than scans, without a needle biopsy of the tumour. Tests that screen healthy people for many cancers at once are being studied.',
    [['ctdna', 'Tumour DNA', 'Carries cancer mutations.'], ['cfdna', 'Normal cell-free DNA', 'From healthy cells, mostly blood cells.'], ['ctc', 'Circulating tumour cell', 'Rare: perhaps one in a billion blood cells.']],
    { q: 'circulating tumor DNA liquid biopsy clinical use' }),

  t('brca', 'Inherited cancer risk', 'BRCA and DNA repair', 'dna', { mode: 'mutation', mut: 'del', still: true, n: 40 },
    'About 5 to 10% of cancers are strongly linked to an inherited fault. BRCA1 and BRCA2 genes make proteins that repair broken DNA. People born with one faulty copy have a much higher lifetime risk of breast and ovarian cancer, and some others, because losing the second copy in a cell disables repair.\n\nKnowing about the fault allows screening, preventive surgery, and treatment with PARP inhibitors, drugs that exploit the broken repair to kill cancer cells.',
    [['mutation', 'Inherited fault', 'Here a deleted stretch.'], ['base', 'Bases', ''], ['backbone', 'Backbone', '']],
    { steps: [['Normal', 'Both gene copies work.'], ['One fault', 'A deletion inherited from a parent.']], q: 'BRCA1 BRCA2 homologous recombination PARP inhibitors' }),

  t('cervical-screening', 'HPV and cervical cancer', 'A preventable cancer', 'virus', { shape: 'icosa', r: 0.95, envelope: false, color: '#e8a0c0', genome: 'circular', genomeColor: '#4fb3d9', seed: 2 },
    'Almost all cervical cancers are caused by long-lasting infection with high-risk types of human papillomavirus. The virus’s E6 and E7 proteins disable the cell’s p53 and Rb brakes, and over years infected cells can become pre-cancerous and then cancerous.\n\nThree tools make it largely preventable: vaccination before exposure, screening tests for HPV and abnormal cells, and treatment of pre-cancerous changes. The World Health Organization has set a goal to eliminate it as a public health problem.',
    [['capsid', 'HPV capsid', 'The L1 protein used in vaccines.'], ['genome', 'Viral DNA', 'Carries E6 and E7.']],
    { q: 'HPV cervical cancer elimination vaccination screening', refs: ['lei2020'] }),
];
