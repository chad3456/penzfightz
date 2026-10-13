import type { Topic } from '../types';
import { chapter } from './make';

const t = chapter('immune');

export const IMMUNE: Topic[] = [
  t('immune-system', 'The immune system', 'Organs, vessels and cells of defence', 'body', { show: ['lymph'], still: true },
    'The immune system is spread through the body rather than sitting in one organ. White cells are born in the bone marrow; T cells mature in the thymus; lymph nodes, the spleen, the tonsils and patches in the gut wall are meeting points where immune cells encounter invaders. Lymph vessels connect them.\n\nIt works in two layers. The innate system responds within minutes to anything that looks foreign or damaged. The adaptive system takes days but targets one specific invader precisely, and remembers it.',
    [['nodes', 'Lymph nodes', 'Around 600 of them; they swell when fighting infection.'], ['thymus', 'Thymus', 'Where T cells learn not to attack the body; it shrinks after puberty.'], ['spleen', 'Spleen', 'Filters the blood and removes old red cells.'], ['duct', 'Thoracic duct', 'Returns lymph to the blood.']],
    { view: [0.1, 0.05, 1], q: 'immune system organs innate adaptive overview' }),

  t('phagocytosis', 'Macrophages eat bacteria', 'Phagocytosis', 'micro',
    { bg: 'tissue', actors: [
      { k: 'macrophage', id: 'macrophage', at: [[-1.2, 0, 0], [-0.4, 0, 0], [0.3, 0, 0], [0.3, 0, 0]], s: 1.4 },
      { k: 'rod', id: 'bacteria', at: [[1.2, 0.3, 0.2], [1.0, 0.3, 0.2], [0.5, 0.1, 0.2], [0.3, 0, 0]], n: 4, spread: 0.3, s: [0.6, 0.6, 0.5, 0.2], o: [1, 1, 1, 0.1] },
      { k: 'vesicle', id: 'phagosome', at: [0.3, 0, 0.3], s: [0.01, 0.01, 1.5, 1.3], color: '#c44f9e', o: [0, 0, 0.8, 0.8] }] },
    'Macrophages, which means “big eaters”, patrol the tissues. When receptors on their surface recognise a bacterium, often helped by antibodies or complement stuck to it, the macrophage reaches round it with arms of membrane and swallows it into a bubble called a phagosome.\n\nThe phagosome fuses with lysosomes full of enzymes and toxic oxygen compounds that destroy the bacterium. The macrophage then displays fragments of it to T cells and releases signals that summon more help.',
    [['macrophage', 'Macrophage', 'Develops from a monocyte that leaves the blood.'], ['bacteria', 'Bacteria', 'Recognised by patterns common to microbes.'], ['phagosome', 'Phagosome', 'Where the bacterium is digested.'], ['tissue', 'Tissue', 'Macrophages live here for months.']],
    { steps: [['Detect', 'Receptors recognise the microbe.'], ['Reach', 'Pseudopods extend around it.'], ['Swallow', 'It is enclosed in a phagosome.'], ['Destroy', 'Enzymes and oxidants digest it.']], q: 'macrophage phagocytosis phagosome lysosome' }),

  t('neutrophils', 'Neutrophils', 'First responders', 'micro',
    { bg: 'vessel', fit: [0, -0.7, 0, 2.6], actors: [
      { k: 'rbc', n: 18, spread: [5, 1.6, 1.6] },
      { k: 'neutrophil', id: 'neutrophil', at: [[-2, 0.5, 0], [-0.8, -1.3, 0.3], [0, -2.2, 0.3], [0.6, -3.1, 0.3]], n: 3, spread: 0.4, s: 0.8 },
      { k: 'rod', id: 'bacteria', at: [0.8, -3.2, 0.3], n: 8, spread: 0.6, s: 0.5, o: [1, 1, 1, 0.3] },
      { k: 'fibrin', id: 'net', at: [0.8, -3.2, 0.3], s: 0.5, o: [0, 0, 0, 1], color: '#e0d0f0' }] },
    'Neutrophils are the most numerous white cells and the first to arrive at an infection, within minutes to hours. Chemical signals from damaged tissue make them roll along and stick to the vessel wall, then squeeze between the cells of the wall and crawl toward the source.\n\nThey swallow bacteria, release toxic granules, and can even throw out nets of their own DNA (neutrophil extracellular traps) to snare microbes. They live only a day or two; dead neutrophils are a large part of pus.',
    [['neutrophil', 'Neutrophil', 'Multi-lobed nucleus.'], ['wall', 'Vessel wall', 'Becomes sticky near an infection.'], ['bacteria', 'Bacteria', 'In the tissue outside the vessel.'], ['net', 'NET', 'A web of DNA and antimicrobial proteins.']],
    { steps: [['Rolling', 'They slow along the vessel wall.'], ['Exit', 'They squeeze through the wall.'], ['Chase', 'They crawl toward chemical signals.'], ['Attack', 'Swallowing, granules and nets.']], q: 'neutrophil extravasation NETs' }),

  t('inflammation', 'Inflammation', 'Heat, redness, swelling and pain', 'micro',
    { bg: 'tissue', actors: [
      { k: 'mast', id: 'mast', at: [-1.4, -0.4, 0.4], s: 0.9 },
      { k: 'mol', id: 'histamine', at: [[-1.4, -0.4, 0.4], [-0.8, 0, 0.4], [0, 0.2, 0.4]], n: 30, spread: [0.4, 0.3, 0.4], color: '#ff6b8a', o: [0, 1, 1] },
      { k: 'rod', id: 'bacteria', at: [1.4, -0.6, 0.3], n: 8, spread: 0.6, s: 0.5 },
      { k: 'neutrophil', id: 'neutrophil', at: [[0, 2.2, 0], [0.4, 1.2, 0], [1.2, -0.2, 0.3]], n: 4, spread: 0.4, s: 0.7 },
      { k: 'plasma', id: 'fluid', at: [[0, 2.0, 0], [0.2, 0.8, 0], [0.4, 0, 0]], n: 60, spread: [1.6, 0.6, 1], color: '#f2e2a0', o: [0, 0.8, 1] }] },
    'Inflammation is the body’s alarm response to injury or infection. Damaged cells and sentinel cells such as mast cells release signals like histamine and cytokines. Nearby blood vessels widen and become leaky: blood flow rises (redness and heat), fluid seeps out (swelling), and nerve endings are sensitised (pain).\n\nThe leaky vessels let white cells and antibodies get to the problem. Inflammation normally switches itself off once the threat is gone; when it does not, chronic inflammation drives diseases from arthritis to atherosclerosis.',
    [['mast', 'Mast cell', 'Releases histamine.'], ['histamine', 'Histamine and cytokines', 'Signal the vessels.'], ['fluid', 'Leaked fluid', 'Swelling.'], ['neutrophil', 'Neutrophils', 'Recruited.'], ['bacteria', 'Invaders', 'The trigger.']],
    { steps: [['Injury', 'Bacteria enter; sentinel cells notice.'], ['Signal', 'Histamine and cytokines are released.'], ['Response', 'Vessels leak fluid and white cells arrive.']], q: 'acute inflammation mechanisms resolution' }),

  t('antibody', 'Antibodies', 'Y-shaped guided proteins', 'micro',
    { bg: 'void', actors: [
      { k: 'antibody', id: 'antibody', at: [0, -0.2, 0], s: 5.5 },
      { k: 'virus', id: 'antigen', at: [[-2.4, 2.6, 0], [-2.0, 2.4, 0]], s: 1.2 }, { k: 'virus', at: [[2.4, 2.6, 0], [2.0, 2.4, 0]], s: 1.2 }] },
    'An antibody (immunoglobulin) is made of two identical heavy chains and two identical light chains joined into a Y. The tips of both arms form the same binding site, which fits one small patch (epitope) of one target, called the antigen. The stem determines what happens next: calling in white cells, activating complement, or crossing the placenta.\n\nEach B cell makes antibodies with one unique binding site, created by shuffling gene segments; together our B cells can recognise billions of different shapes.',
    [['antibody', 'Antibody', 'About 10 nanometres across.'], ['antigen', 'Antigen', 'Here a virus, held by one arm.']],
    { steps: [['Free antibody', 'Circulating in the blood.'], ['Bound', 'Each arm grips an antigen; one antibody can link two.']], facts: ['There are five classes: IgG, IgA, IgM, IgE and IgD.'], q: 'antibody structure immunoglobulin classes diversity' }),

  t('b-cells', 'B cells and plasma cells', 'Antibody factories', 'micro',
    { bg: 'void', actors: [
      { k: 'lymph', id: 'bcell', at: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [-1.5, 0, 0]], s: 1.6, color: '#7fb8e8' },
      { k: 'virus', id: 'antigen', at: [[2, 1.2, 0], [0.8, 0.5, 0.3], [0.8, 0.5, 0.3], [0.8, 0.5, 0.3]], s: 1, o: [1, 1, 0.5, 0] },
      { k: 'lymph', id: 'helper', at: [[2.5, -1.5, 0], [2.5, -1.5, 0], [1, -0.6, 0], [1.5, -1.5, 0]], s: 1.2 },
      { k: 'lymph', id: 'plasma', at: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0.8, 0.8, 0]], n: 4, spread: 0.8, s: [0.01, 0.01, 0.01, 1.2], color: '#5a8ad8' },
      { k: 'antibody', id: 'antibody', at: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [2, 1.5, 0]], n: 18, spread: 1.4, s: [0.01, 0.01, 0.01, 1], seed: 4 }] },
    'Each B cell wears copies of its one antibody on its surface as a receptor. When an antigen fits, and a helper T cell that recognises the same invader gives the go-ahead, the B cell multiplies into a clone.\n\nSome of the clone become plasma cells, which pour out thousands of antibodies a second. In lymph-node germinal centres the antibodies are refined by mutation and selection, so they fit better and better. Others become long-lived memory B cells.',
    [['bcell', 'B cell', 'Its receptor is a membrane-bound antibody.'], ['antigen', 'Antigen', 'Binds the receptor.'], ['helper', 'Helper T cell', 'Provides the second signal.'], ['plasma', 'Plasma cells', 'Antibody factories.'], ['antibody', 'Antibodies', 'Released into the blood.']],
    { steps: [['Waiting', 'A naive B cell.'], ['Recognition', 'The antigen binds its receptor.'], ['Help', 'A helper T cell activates it.'], ['Clonal expansion', 'Plasma cells release antibodies.']], q: 'B cell activation germinal center plasma cell' }),

  t('helper-t', 'Helper T cells', 'The coordinators', 'micro',
    { bg: 'void', actors: [
      { k: 'dendritic', id: 'dc', at: [-0.9, 0, 0], s: 1.6 },
      { k: 'lymph', id: 'helper', at: [[2.4, 0.4, 0], [0.8, 0.1, 0], [0.8, 0.1, 0]], s: 1.3, glow: [0, 0.2, 0.6] },
      { k: 'mol', id: 'cytokines', at: [[0.8, 0.1, 0], [0.8, 0.1, 0], [1.8, 0.5, 0]], n: 40, spread: [0.3, 0.3, 0.3], color: '#ffd25a', o: [0, 0, 1], drift: 0.5 }] },
    'Helper T cells carry the protein CD4. They do not kill anything themselves; they recognise fragments of invaders displayed by other cells on MHC class II molecules, and then release cytokines that direct the rest of the response: switching on B cells to make antibodies, arming macrophages, and helping killer T cells.\n\nThis central role is why HIV, which destroys CD4 T cells, cripples the whole immune system.',
    [['helper', 'Helper T cell', 'CD4 positive.'], ['dc', 'Dendritic cell', 'Presents the antigen.'], ['cytokines', 'Cytokines', 'Interleukins and interferons that direct other cells.']],
    { steps: [['Search', 'The T cell checks cells passing by.'], ['Match', 'Its receptor fits the presented fragment.'], ['Instruct', 'It releases cytokines.']], q: 'CD4 helper T cell subsets cytokines' }),

  t('killer-t', 'Killer T cells', 'Destroying infected and cancer cells', 'micro',
    { bg: 'tissue', actors: [
      { k: 'lymph', id: 'tcell', at: [[-2.5, 0, 0], [-1.05, 0, 0], [-1.0, 0, 0], [-2.2, 0.3, 0]], s: 1.2 },
      { k: 'cancer', id: 'target', at: [0.5, 0, 0], s: [1.3, 1.3, 1.1, 0.5], o: [1, 1, 0.8, 0.15], glow: [0, 0, 0.4, 0] },
      { k: 'mol', id: 'perforin', at: [[-0.4, 0, 0], [-0.4, 0, 0], [0.0, 0, 0], [0.3, 0, 0]], n: 16, spread: 0.25, o: [0, 0, 1, 0], color: '#ff8a5c' },
      { k: 'fragment', id: 'fragments', at: [0.5, 0, 0], n: 10, spread: 0.9, o: [0, 0, 0, 1], color: '#b06a96' }] },
    'Cytotoxic (killer) T cells carry CD8. Every cell in the body displays fragments of its own proteins on MHC class I molecules. If a cell is infected or cancerous, some fragments are foreign or abnormal, and a killer T cell whose receptor fits will lock on.\n\nIt then injects perforin, which punches holes in the target’s membrane, and granzymes, which enter and trigger the cell’s self-destruct programme (apoptosis). The T cell detaches and moves on to the next target.',
    [['tcell', 'Killer T cell', 'CD8 positive.'], ['target', 'Infected or cancer cell', 'Displays abnormal fragments.'], ['perforin', 'Perforin and granzymes', 'The lethal payload.'], ['fragments', 'Apoptotic fragments', 'Tidily cleared by macrophages.']],
    { steps: [['Search', 'The T cell scans cells.'], ['Lock on', 'A tight contact (immune synapse) forms.'], ['Kill', 'Perforin and granzymes are released.'], ['Move on', 'The target dies; the T cell leaves.']], q: 'cytotoxic T lymphocyte perforin granzyme killing' }),

  t('nk-cells', 'Natural killer cells', 'Killing cells that hide', 'micro',
    { bg: 'tissue', actors: [
      { k: 'lymph', id: 'nk', at: [[-2.4, 0, 0], [-1.0, 0, 0], [-1.0, 0, 0]], s: 1.3, color: '#c9e88a' },
      { k: 'cell', id: 'healthy', at: [0.4, 1.2, -0.6], s: 0.8 },
      { k: 'cell', id: 'target', at: [0.4, 0, 0], s: [1, 1, 0.4], color: '#b07ad0', o: [1, 1, 0.2] }] },
    'Some viruses and cancers escape killer T cells by removing the MHC molecules from their surface. Natural killer (NK) cells catch exactly these: they check each cell for “self” MHC, and a cell that is missing it, while showing stress signals, is killed with the same perforin-and-granzyme weapons.\n\nNK cells need no prior training, so they act within hours, bridging the innate and adaptive responses.',
    [['nk', 'NK cell', 'A large granular lymphocyte.'], ['healthy', 'Healthy cell', 'Shows normal MHC and is spared.'], ['target', 'Altered cell', 'Missing MHC: killed.']],
    { steps: [['Patrol', 'The NK cell meets cells.'], ['Check', 'No MHC, plus stress signals.'], ['Kill', 'The altered cell dies.']], q: 'natural killer cells missing self recognition' }),

  t('antigen-presentation', 'Dendritic cells', 'Showing the enemy to T cells', 'micro',
    { bg: 'void', actors: [
      { k: 'rod', id: 'bacteria', at: [[-2.6, 1, 0], [-1.2, 0.4, 0], [-1, 0.3, 0], [-1, 0.3, 0]], n: 3, spread: 0.3, s: 0.5, o: [1, 1, 0.4, 0] },
      { k: 'dendritic', id: 'dc', at: [[-1.2, 0, 0], [-1.2, 0, 0], [-0.4, 0, 0], [0.4, 0, 0]], s: 1.6 },
      { k: 'lymph', id: 'tcell', at: [[2.6, 0.6, 0], [2.6, 0.6, 0], [2.4, 0.4, 0], [1.6, 0.2, 0]], s: 1.1, glow: [0, 0, 0, 0.5] }] },
    'Dendritic cells sit in skin and mucous membranes, sampling everything around them. When they pick up a microbe, they cut its proteins into fragments, load them onto MHC molecules, and travel through lymph vessels to the nearest lymph node.\n\nThere they display the fragments to passing T cells, along with co-stimulatory signals that confirm a real threat. The rare T cell whose receptor fits is activated and multiplies. Ralph Steinman won a Nobel Prize in 2011 for discovering them.',
    [['dc', 'Dendritic cell', 'Named for its branching arms.'], ['bacteria', 'Captured microbe', 'Chopped into peptides.'], ['tcell', 'Naive T cell', 'Activated if its receptor fits.']],
    { steps: [['Capture', 'The microbe is taken up in the tissue.'], ['Process', 'Its proteins are cut into fragments.'], ['Travel', 'The cell migrates to a lymph node.'], ['Present', 'A matching T cell is activated.']], q: 'dendritic cell antigen presentation T cell priming' }),

  t('complement', 'The complement system', 'Proteins that punch holes', 'micro',
    { bg: 'void', actors: [
      { k: 'rod', id: 'bacterium', at: [0, 0, 0], s: [3, 3, 3, 2.4], o: [1, 1, 1, 0.4] },
      { k: 'mol', id: 'c3b', at: [[0, 0, 0], [0, 0, 0.6], [0, 0, 0.6], [0, 0, 0.6]], n: 20, spread: [1.4, 0.7, 0.3], color: '#ff9d6b', o: [0, 1, 1, 1] },
      { k: 'complement', id: 'mac', at: [0, 0, 0.62], n: 10, spread: [1.3, 0.6, 0.05], s: [0.01, 0.01, 1.2, 1.4] }] },
    'Complement is a set of about 30 proteins in the blood that work as a cascade. Once triggered by antibodies or directly by microbial surfaces, they coat the microbe with a fragment called C3b, which marks it for eating, and release small fragments that call in white cells.\n\nThe last components assemble into a ring, the membrane attack complex, that drills a hole through the microbe’s membrane, causing it to burst.',
    [['bacterium', 'Bacterium', 'The target.'], ['c3b', 'C3b coating', 'Opsonisation: “eat me” tags.'], ['mac', 'Membrane attack complex', 'A pore about 10 nm wide.']],
    { steps: [['Trigger', 'Complement meets the microbe.'], ['Coat', 'C3b covers its surface.'], ['Assemble', 'Pores form.'], ['Burst', 'The microbe leaks and dies.']], q: 'complement system membrane attack complex opsonization' }),

  t('vaccines', 'How vaccines work', 'A rehearsal for the immune system', 'micro',
    { bg: 'void', actors: [
      { k: 'virus', id: 'vaccine', at: [[-2.4, 0.8, 0], [-1, 0.3, 0], [-1, 0.3, 0], [-1, 0.3, 0]], n: 3, spread: 0.3, color: '#9fb8c0', s: [1, 1, 0.5, 0], o: [1, 1, 0.5, 0] },
      { k: 'dendritic', id: 'dc', at: [-0.6, 0, 0], s: 1.3 },
      { k: 'lymph', id: 'memory', at: [1.2, 0, 0], n: 6, spread: 0.7, s: [0.01, 0.01, 0.8, 0.8], color: '#7fb8e8', glow: [0, 0, 0, 0.4] },
      { k: 'antibody', id: 'antibody', at: [1.6, 1.2, 0], n: 16, spread: 1, s: [0.01, 0.01, 1, 1] },
      { k: 'virus', id: 'real', at: [[3, 1.5, 0], [3, 1.5, 0], [3, 1.5, 0], [2.2, 1.1, 0]], n: 3, spread: 0.4, o: [0, 0, 0, 1], antibodies: 3 }] },
    'A vaccine shows the immune system a harmless version or piece of a germ, such as a killed or weakened virus, a purified protein, or instructions to make one. The immune system responds as if to a real infection: T cells and B cells that recognise it multiply, antibodies are made, and long-lived memory cells remain.\n\nIf the real germ arrives later, the response is much faster and stronger, often stopping illness before it starts. When enough people are immune, spread is blocked even for those who cannot be vaccinated.',
    [['vaccine', 'Vaccine antigen', 'Cannot cause the disease.'], ['dc', 'Dendritic cell', 'Picks it up and presents it.'], ['memory', 'Memory cells', 'Persist for years.'], ['antibody', 'Antibodies', 'Ready in advance.'], ['real', 'The real virus', 'Met by a ready defence.']],
    { steps: [['Dose', 'The vaccine is given.'], ['Recognition', 'Antigen is presented to lymphocytes.'], ['Memory', 'Antibodies and memory cells are made.'], ['Protection', 'A later infection is quickly neutralised.']], facts: ['Vaccines are estimated to have saved around 150 million lives in the last 50 years.'], q: 'vaccine immunology memory protection', refs: ['shattock2024'] }),

  t('mrna-vaccine', 'mRNA vaccines', 'Instructions, not the protein', 'micro',
    { bg: 'void', actors: [
      { k: 'vesicle', id: 'lnp', at: [[-2.6, 1, 0], [-1, 0.4, 0], [-0.6, 0.2, 0], [-0.6, 0.2, 0], [-0.6, 0.2, 0]], s: [1.4, 1.4, 1, 0.01, 0.01], color: '#ffd8a0' },
      { k: 'cell', id: 'cell', at: [0, 0, 0], s: 2.6, o: 0.5 },
      { k: 'mrna', id: 'mrna', at: [[-2.6, 1, 0], [-1, 0.4, 0], [-0.3, 0.1, 0.3], [0, 0, 0.3], [0, 0, 0.3]], color: '#f28c3a', o: [1, 1, 1, 1, 0.3] },
      { k: 'ribosome', id: 'ribosome', at: [0.2, -0.3, 0.3], n: 4, spread: 0.6, o: [0.3, 0.3, 0.6, 1, 1] },
      { k: 'virus', id: 'spike', at: [[1.2, 0.6, 0.3], [1.2, 0.6, 0.3], [1.2, 0.6, 0.3], [1.4, 0.8, 0.3], [2.2, 1.2, 0.3]], n: 5, spread: 0.5, s: [0.01, 0.01, 0.01, 0.6, 0.8], color: '#e8584a' }] },
    'An mRNA vaccine carries a strand of messenger RNA wrapped in a tiny fat bubble (lipid nanoparticle). Muscle and immune cells at the injection site take it in, and their ribosomes read it to make a viral protein, such as the coronavirus spike. The cells display the protein, and the immune system learns to recognise it.\n\nThe mRNA never enters the nucleus and is broken down within days. Chemically modified building blocks (Katalin Karikó and Drew Weissman, Nobel Prize 2023) stop it from setting off excess inflammation.',
    [['lnp', 'Lipid nanoparticle', 'Protects the mRNA and helps it into cells.'], ['mrna', 'mRNA', 'Instructions for one protein.'], ['ribosome', 'Ribosomes', 'Read the mRNA.'], ['spike', 'Spike protein', 'Displayed to the immune system.'], ['cell', 'Cell', 'Becomes a temporary protein factory.']],
    { steps: [['Injection', 'Nanoparticles reach cells.'], ['Entry', 'They fuse and release mRNA.'], ['Reading', 'Ribosomes translate it.'], ['Display', 'Spike proteins appear.'], ['Response', 'Antibodies and T cells are trained.']], q: 'mRNA vaccine mechanism lipid nanoparticle nucleoside modification' }),

  t('immune-memory', 'Immune memory', 'Why you rarely catch measles twice', 'micro',
    { bg: 'void', actors: [
      { k: 'lymph', id: 'memory', at: [0, 0, 0], n: [1, 1, 1].length, spread: 0.5, s: 1.2, color: '#7fb8e8' },
      { k: 'lymph', id: 'clone', at: [0, 0, 0], n: 24, spread: 2, s: [0.01, 0.01, 0.9], color: '#7fb8e8' },
      { k: 'virus', id: 'virus', at: [[2.6, 1.4, 0], [1.2, 0.6, 0], [1.2, 0.6, 0]], n: 4, spread: 0.4, o: [1, 1, 0.2] }] },
    'After an infection or vaccine, most of the expanded B and T cells die off, but a fraction remain as memory cells, some for decades. There are far more of them than there were naive cells at the start, and they respond faster and more strongly.\n\nA second encounter therefore triggers a response within a day or two instead of a week, usually clearing the invader before it causes illness. This is why many infections cause lifelong immunity, and why booster doses strengthen protection.',
    [['memory', 'Memory cells', 'Long-lived B and T cells.'], ['clone', 'Rapid expansion', 'On second contact.'], ['virus', 'Returning virus', 'Cleared quickly.']],
    { steps: [['Waiting', 'Memory cells circulate.'], ['Re-exposure', 'The same virus returns.'], ['Fast response', 'A large, quick response stops it.']], q: 'immunological memory B cells T cells longevity' }),

  t('allergy', 'Allergy', 'An immune response to something harmless', 'micro',
    { bg: 'tissue', actors: [
      { k: 'mast', id: 'mast', at: [0, 0, 0], s: 1.6, glow: [0, 0, 0.4] },
      { k: 'antibody', id: 'ige', at: [0, 0, 0.9], n: 8, spread: [0.8, 0.8, 0.1], s: 0.8, color: '#c98bd9' },
      { k: 'mol', id: 'pollen', at: [[1.8, 1.6, 0.6], [0.4, 0.6, 1.0], [0.3, 0.4, 1.0]], n: 6, spread: 0.3, color: '#f2c94c', s: 1.6 },
      { k: 'mol', id: 'histamine', at: [[0, 0, 0], [0, 0, 0], [0, 0, 0.6]], n: 50, spread: 1.6, color: '#ff6b8a', o: [0, 0, 1], drift: 0.4 }] },
    'In allergy, the immune system makes IgE antibodies against harmless substances such as pollen, dust mites, peanuts or cat dander. The IgE coats mast cells in the skin, airways and gut, priming them.\n\nNext time the allergen arrives, it cross-links the IgE, and the mast cells burst open, releasing histamine and other chemicals within minutes: sneezing, itching, hives, wheeze. A severe whole-body reaction, anaphylaxis, can drop blood pressure and close the airway and needs adrenaline at once.',
    [['mast', 'Mast cell', 'Packed with histamine granules.'], ['ige', 'IgE antibodies', 'Sit on the mast cell surface.'], ['pollen', 'Allergen', 'Here pollen proteins.'], ['histamine', 'Histamine', 'Causes the symptoms; antihistamines block its receptor.']],
    { steps: [['Primed', 'IgE coats mast cells.'], ['Exposure', 'The allergen binds the IgE.'], ['Release', 'Mast cells degranulate.']], q: 'IgE mast cell allergy anaphylaxis mechanism' }),

  t('autoimmunity', 'Autoimmune disease', 'When the immune system attacks the body', 'micro',
    { bg: 'tissue', actors: [
      { k: 'cell', id: 'self', at: [0.6, 0, 0], n: 5, spread: [1.2, 0.6, 0.6], s: 0.8, o: [1, 1, 0.5] },
      { k: 'lymph', id: 'tcell', at: [[-2.4, 0.5, 0], [-0.6, 0.2, 0], [0, 0, 0]], n: 4, spread: 0.6, s: 0.9 },
      { k: 'antibody', id: 'autoantibody', at: [[-2, -0.8, 0], [0, -0.3, 0.4], [0.6, 0, 0.6]], n: 12, spread: 0.9, s: 1, color: '#e8584a' }] },
    'The immune system is trained to tolerate the body’s own molecules: self-reactive T cells are mostly deleted in the thymus and others are held in check by regulatory T cells. Occasionally this tolerance breaks, and T cells or antibodies (autoantibodies) attack healthy tissue.\n\nThe target decides the disease: insulin-making cells in type 1 diabetes, joint linings in rheumatoid arthritis, myelin in multiple sclerosis, many tissues in lupus. Most autoimmune diseases are commoner in women. Treatments damp or redirect the immune response.',
    [['self', 'Healthy cells', 'Mistaken for a threat.'], ['tcell', 'Self-reactive T cells', 'Escaped tolerance.'], ['autoantibody', 'Autoantibodies', 'Bind the body’s own proteins.']],
    { steps: [['Tolerance', 'Self is normally ignored.'], ['Break', 'Self-reactive cells activate.'], ['Attack', 'Tissue is damaged.']], q: 'autoimmunity tolerance breakdown regulatory T cells' }),

  t('lymph-node', 'The lymph node', 'Where immune responses begin', 'vessel', { mode: 'lymph', still: true },
    'Lymph nodes are bean-shaped stations, a few millimetres to a couple of centimetres long, strung along the lymph vessels. Lymph from the tissues filters through them, bringing microbes and the dendritic cells that captured them.\n\nInside, B cells gather in follicles and T cells in the zones between, so a rare lymphocyte that recognises a particular invader can find it. When a response starts, the node fills with dividing cells and swells: the “swollen glands” of a sore throat.',
    [['node', 'Lymph node', 'Hundreds of them, clustered in the neck, armpits, groin and abdomen.'], ['follicle', 'Follicles', 'B-cell zones; germinal centres form here.'], ['vessel', 'Lymph vessels', 'Bring lymph in and carry it out.'], ['capsule', 'Capsule', 'Fibrous outer layer.']],
    { view: [0.15, 0.35, 1], q: 'lymph node structure germinal center' }),

  t('herd-immunity', 'Herd immunity', 'Protecting those who cannot be vaccinated', 'micro',
    { bg: 'void', actors: [
      { k: 'cell', id: 'immune', at: [0, 0, 0], n: 40, spread: [3.2, 1.8, 1.4], color: '#5ab8a0', s: 0.4 },
      { k: 'cell', id: 'susceptible', at: [0, 0, 0], n: 8, spread: [3.2, 1.8, 1.4], color: '#e7a28c', s: 0.4, seed: 9 },
      { k: 'virus', id: 'virus', at: [[-3.4, 0, 0], [-2, 0.3, 0], [-1.4, 0.1, 0]], s: 1, glow: [0.2, 0.2, 0] }] },
    'Each infectious disease spreads from one person to a typical number of others in a population with no immunity. When a large enough share of people are immune, an infected person usually meets only immune contacts, and chains of transmission fizzle out.\n\nThe threshold depends on how contagious the disease is: about 95% for measles, much lower for less contagious infections. Above it, babies too young for vaccines and people whose immune systems are weak are protected too.',
    [['immune', 'Immune people', 'Block onward spread.'], ['susceptible', 'Susceptible people', 'Shielded when they are few.'], ['virus', 'A virus', 'Runs out of new hosts.']],
    { steps: [['Introduction', 'One case arrives.'], ['Contacts', 'Most of them are immune.'], ['Fizzle', 'The chain dies out.']], q: 'herd immunity threshold basic reproduction number' }),

  t('spleen', 'The spleen and thymus', 'A blood filter and a T-cell school', 'body', { show: ['lymph', 'organs'], still: true },
    'The spleen, under the left ribs, filters the blood the way lymph nodes filter lymph: its macrophages remove old red cells and bacteria, and its B and T cells respond to blood-borne infections. People without a spleen are more vulnerable to some bacteria and need extra vaccines.\n\nThe thymus, behind the breastbone, is where T cells mature. Developing T cells that cannot recognise MHC or that react too strongly against the body are eliminated; only a few percent survive. It is largest in childhood and gradually turns to fat.',
    [['spleen', 'Spleen', 'About 150 g, holding a reserve of blood and platelets.'], ['thymus', 'Thymus', 'Where T cells are selected.'], ['nodes', 'Lymph nodes', 'Part of the same network.']],
    { view: [0.1, 0.05, 1], q: 'thymic selection spleen function' }),
];
