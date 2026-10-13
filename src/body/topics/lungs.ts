import type { Topic } from '../types';
import { chapter, ctl } from './make';

const t = chapter('lungs');
const F: [number, number, number] = [0.1, 0.1, 1];
const RATE = ctl('rate', 'Breaths per minute', 6, 40, 14, 1), DEPTH = ctl('depth', 'Depth', 0.2, 2, 1, 0.1, '×');

export const LUNGS: Topic[] = [
  t('lungs', 'The lungs', 'Two spongy bags of air', 'lungs', { still: true },
    'The lungs fill most of the chest. The right lung has three lobes and the left only two, leaving room for the heart in a notch. Each is wrapped in a thin, slippery double membrane (the pleura) that lets it glide against the chest wall as it moves.\n\nInside, an airway tree divides about 23 times, ending in some 480 million tiny air sacs, the alveoli, whose combined surface is roughly the size of a tennis court. Watch the lungs inflate and the diaphragm drop with each breath.',
    [['trachea', 'Trachea', 'The windpipe, held open by C-shaped cartilage rings.'], ['rul', 'Right upper lobe', 'Separated from the middle lobe by the horizontal fissure.'], ['rml', 'Right middle lobe', 'Only the right lung has one.'], ['rll', 'Right lower lobe', 'Below the oblique fissure; the largest lobe.'], ['lul', 'Left upper lobe', 'Includes a tongue-like part, the lingula, next to the heart.'], ['lll', 'Left lower lobe', 'Sits on the diaphragm.'], ['notch', 'Cardiac notch', 'Space for the heart.'], ['diaphragm', 'Diaphragm', 'The main breathing muscle.'], ['pleura', 'Pleura', 'A double membrane with a film of fluid between its layers.']],
    { view: F, controls: [RATE], facts: ['An adult breathes about 12–20 times a minute at rest, roughly 11,000 litres of air a day.'], q: 'lung anatomy alveoli number surface area', refs: ['ochs2004'] }),

  t('airway-tree', 'The airway tree', 'From windpipe to bronchioles', 'lungs', { mode: 'tree', still: true },
    'The trachea splits into the left and right main bronchi, which divide again and again into smaller bronchi and then bronchioles less than a millimetre wide. The larger airways are held open by cartilage; the smaller ones have smooth muscle that can tighten.\n\nThe airways warm and moisten the air and trap dust in a layer of mucus, which tiny beating hairs (cilia) sweep back up toward the throat.',
    [['trachea', 'Trachea', 'About 12 cm long and 2 cm wide.'], ['cartilage', 'Cartilage rings', 'Open at the back, where the oesophagus lies.'], ['bronchi', 'Main bronchi', 'The right is wider and steeper, so inhaled objects more often end up there.'], ['bronchiole', 'Bronchioles', 'No cartilage; muscle controls their width.']],
    { view: F, controls: [RATE], q: 'airway branching generations bronchial tree' }),

  t('breathing', 'How breathing works', 'The diaphragm and a pressure difference', 'lungs', { still: true },
    'Lungs have no muscle of their own. Breathing in, the dome-shaped diaphragm contracts and flattens, and muscles between the ribs lift the ribcage out. The chest gets bigger, the pressure inside the lungs drops slightly below the air outside, and air flows in.\n\nAt rest, breathing out is passive: the muscles relax and the elastic lungs recoil. The rate is set automatically by the brainstem, mainly in response to the level of carbon dioxide in the blood. Try changing the rate and depth.',
    [['diaphragm', 'Diaphragm', 'Moves about 1–2 cm in quiet breathing, up to 10 cm in deep breaths.'], ['rul', 'Lungs', 'Follow the chest wall because of the sealed pleural space.'], ['trachea', 'Trachea', 'Air flows in and out here.']],
    { view: F, controls: [RATE, DEPTH], facts: ['A quiet breath moves about 0.5 litres; a maximal one about 4–5 litres in an adult.'], q: 'mechanics of breathing diaphragm respiratory control' }),

  t('alveoli', 'Alveoli', 'Where air meets blood', 'lungs', { mode: 'alveoli', still: true },
    'Each bronchiole ends in clusters of alveoli, tiny air sacs about 0.2 mm across, wrapped in a dense net of capillaries. The wall between air and blood is incredibly thin, about half a micrometre, less than a hundredth of the width of a hair.\n\nA film of surfactant lines each alveolus. It lowers surface tension so the sacs do not collapse when you breathe out. Premature babies may lack it and need it given.',
    [['alveolus', 'Alveolus', 'About 480 million in an adult.'], ['bronchiole', 'Respiratory bronchiole', 'Delivers the air.'], ['capillary', 'Capillary net', 'Blood arrives oxygen-poor (purple here) and leaves oxygen-rich (red).'], ['wall', 'Air–blood barrier', 'Alveolar cell, a shared basement membrane, and capillary cell.']],
    { view: [0.2, 0.2, 1], q: 'alveolar structure surfactant blood-gas barrier' }),

  t('gas-exchange', 'Gas exchange', 'Oxygen in, carbon dioxide out', 'lungs', { mode: 'alveoli', still: true },
    'Gases move by diffusion, from where they are more concentrated to where they are less. Air in the alveoli is rich in oxygen and poor in carbon dioxide; blood arriving from the body is the reverse. So oxygen diffuses into the blood and carbon dioxide out of it, with no pumping needed.\n\nIt happens fast: blood spends under a second in an alveolar capillary and is fully loaded in about a third of that time, leaving a reserve for exercise.',
    [['oxygen', 'Oxygen', 'Shown in blue: moves into the blood.'], ['co2', 'Carbon dioxide', 'Shown in grey: moves into the air to be breathed out.'], ['capillary', 'Capillary', 'Where red cells pick up oxygen.'], ['alveolus', 'Alveolus', 'Air space.']],
    { view: [0.2, 0.2, 1], q: 'pulmonary gas exchange diffusion' }),

  t('asthma', 'Asthma', 'When the airways tighten', 'lungs', { mode: 'airway', disease: 'asthma', still: true },
    'In asthma, the smaller airways are chronically inflamed and over-sensitive. Triggers such as allergens, cold air, exercise or infections make the muscle around them tighten, the lining swell and mucus build up, narrowing the airway. Breathing out becomes hard, causing wheeze, cough and breathlessness.\n\nReliever inhalers relax the muscle within minutes; preventer inhalers containing corticosteroids calm the inflammation over time. Use the slider to tighten and relax the airway.',
    [['muscle', 'Smooth muscle', 'Contracts in an attack.'], ['wall', 'Swollen lining', 'Inflamed and thickened.'], ['mucus', 'Mucus plug', 'Further blocks the airway.'], ['lumen', 'Airway', 'Narrowed.'], ['cartilage', 'Cartilage', 'Only in larger airways.']],
    { view: [0, 0, 1], controls: [ctl('constrict', 'Tightening', 0, 1, 0.7, 0.05)], q: 'asthma airway inflammation bronchoconstriction treatment' }),

  t('emphysema', 'COPD and emphysema', 'Broken air sacs', 'lungs', { mode: 'alveoli', disease: 'emphysema', still: true },
    'Chronic obstructive pulmonary disease (COPD) is long-term damage to the lungs, most often from cigarette smoke, and in some countries from smoke from cooking fires. In emphysema the walls between alveoli break down, merging many small sacs into fewer large ones with much less surface for gas exchange. Damaged lungs also lose their elastic recoil, so air gets trapped.\n\nThe damage cannot be undone, but stopping smoking slows it, and inhalers and pulmonary rehabilitation help.',
    [['alveolus', 'Enlarged air spaces', 'Walls destroyed.'], ['capillary', 'Fewer capillaries', 'Less area for oxygen to cross.'], ['bronchiole', 'Small airways', 'Collapse when breathing out.']],
    { view: [0.2, 0.2, 1], q: 'COPD emphysema pathogenesis smoking' }),

  t('smokers-lungs', 'Smoking and the lungs', 'Tar, inflammation and cancer', 'lungs', { disease: 'smoker', still: true },
    'Cigarette smoke contains thousands of chemicals, dozens of which cause cancer. It paralyses the cilia that clear the airways, inflames the lining, and leaves dark deposits in lung tissue. Over years it causes COPD and is responsible for most lung cancers.\n\nStopping at any age helps: within weeks the cilia start working again, and over ten years the risk of lung cancer roughly halves compared with continuing to smoke.',
    [['rul', 'Darkened lung tissue', 'Pigment from tar deposits.'], ['bronchi', 'Airways', 'Inflamed and producing extra mucus.'], ['trachea', 'Trachea', 'Smoke damages its lining first.']],
    { view: F, q: 'smoking cessation lung function cancer risk' }),

  t('pneumonia', 'Pneumonia', 'Air sacs filled with fluid', 'lungs', { mode: 'alveoli', disease: 'pneumonia', still: true },
    'Pneumonia is an infection of the lung tissue, most often caused by bacteria such as Streptococcus pneumoniae or by viruses. White cells pour into the alveoli to fight it, and the sacs fill with fluid, pus and cells, so oxygen can no longer reach the blood there.\n\nSymptoms are cough, fever, breathlessness and chest pain on breathing in. It is especially dangerous for babies and older people. Bacterial pneumonia is treated with antibiotics, and vaccines protect against several causes.',
    [['fluid', 'Fluid-filled alveoli', 'Cannot exchange gas.'], ['alveolus', 'Alveoli', 'Some still work.'], ['capillary', 'Capillaries', 'Blood passing filled sacs stays oxygen-poor.']],
    { view: [0.2, 0.2, 1], q: 'community-acquired pneumonia pathophysiology' }),

  t('covid-lungs', 'COVID-19 in the lungs', 'Damage deep in the alveoli', 'lungs', { mode: 'alveoli', disease: 'covid', still: true },
    'SARS-CoV-2 binds ACE2, which is found on cells lining the alveoli as well as the nose. In severe COVID-19 the infection and the inflammation it triggers damage the alveolar walls and the capillaries beside them; fluid and debris fill the sacs, and small clots form in the lung’s blood vessels.\n\nThe result can be low oxygen levels, sometimes without much breathlessness at first. Steroids, which damp the inflammation, were one of the first treatments shown to save lives.',
    [['fluid', 'Filled alveoli', 'Fluid and inflammatory cells.'], ['wall', 'Alveolar wall', 'Infected and inflamed.'], ['capillary', 'Capillaries', 'Prone to clotting.']],
    { view: [0.2, 0.2, 1], q: 'COVID-19 lung pathology diffuse alveolar damage' }),

  t('lung-cancer', 'Lung cancer', 'The deadliest common cancer', 'lungs', { disease: 'cancer', still: true },
    'Lung cancer causes more deaths worldwide than any other cancer. About 85% are non-small-cell types; most are caused by smoking, though a significant share occur in people who never smoked, linked to radon, air pollution and gene changes.\n\nIt often causes no symptoms until it has spread, which is why some countries now offer low-dose CT screening to people at high risk. Treatments include surgery, radiotherapy, drugs targeting specific mutations (such as in EGFR or ALK) and immunotherapy.',
    [['tumor', 'Tumour', 'Here in the right upper lobe, a common site.'], ['rul', 'Right upper lobe', 'Upper lobes are the commonest site.'], ['bronchi', 'Airways', 'Many cancers start in their lining.']],
    { view: F, q: 'lung cancer screening low-dose CT targeted therapy' }),

  t('pneumothorax', 'Collapsed lung', 'Pneumothorax', 'lungs', { disease: 'collapse', still: true },
    'The lung stays inflated because the space between the two layers of pleura is sealed and at slightly negative pressure. If air gets into that space, through an injury or a small burst blister on the lung surface, the seal is lost and the lung shrinks away from the chest wall.\n\nIt causes sudden chest pain and breathlessness. Small ones resolve on their own; larger ones need the air let out through a needle or a chest drain.',
    [['lul', 'Collapsed lung', 'Here the left.'], ['pleura', 'Pleural space', 'Now filled with air.'], ['rul', 'Other lung', 'Still working.']],
    { view: F, q: 'pneumothorax management chest drain' }),

  t('cystic-fibrosis', 'Cystic fibrosis', 'Sticky mucus that will not clear', 'lungs', { mode: 'airway', disease: 'cf', still: true },
    'Cystic fibrosis is an inherited disease caused by faults in the CFTR gene, which makes a channel that moves chloride across the surface of cells. Without it, the airway surface dries out and mucus becomes thick and sticky. The cilia cannot shift it, bacteria thrive in it, and repeated infections scar the lungs.\n\nIt affects the pancreas and gut too. Newer drugs called CFTR modulators help the faulty channel work and have transformed the outlook for most patients.',
    [['mucus', 'Thick mucus', 'Plugs the airway.'], ['wall', 'Airway lining', 'Dehydrated surface.'], ['muscle', 'Muscle', 'Inflammation also makes it twitchy.'], ['lumen', 'Airway', 'Narrowed by mucus.']],
    { view: [0, 0, 1], controls: [ctl('constrict', 'Narrowing', 0, 1, 0.3, 0.05)], q: 'cystic fibrosis CFTR modulators' }),

  t('cilia', 'The mucus escalator', 'Cilia that sweep the airways clean', 'cell', { mode: 'cilia', still: true },
    'The airways are lined with cells each carrying about 200 cilia, hair-like projections that beat about 10 to 20 times a second in coordinated waves. They push a thin layer of mucus, with trapped dust and microbes, up toward the throat, where it is swallowed.\n\nThis mucociliary escalator is a key defence. Smoking, some infections and rare inherited conditions stop the cilia working, and mucus and infections build up.',
    [['cilia', 'Cilia', 'Each about 6 micrometres long.'], ['mucus', 'Mucus layer', 'Floats on a thin watery layer.'], ['epithelium', 'Airway cells', 'Ciliated cells and mucus-making goblet cells.']],
    { view: [0.3, 0.4, 1], q: 'mucociliary clearance cilia airway' }),

  t('tuberculosis', 'Tuberculosis', 'A bacterium that hides inside macrophages', 'micro',
    { bg: 'void', actors: [
      { k: 'macrophage', id: 'macrophage', at: [0, 0, 0], s: 1.6 },
      { k: 'rod', id: 'mtb', at: [[-2, 1.2, 0], [-0.6, 0.4, 0.3], [0, 0, 0.3], [0, 0, 0.3]], n: 6, spread: 0.25, s: 0.45, color: '#c98a3a' },
      { k: 'lymph', id: 'tcell', at: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], n: 14, spread: 1.9, s: [0.01, 0.01, 0.6, 0.8], o: [0, 0, 1, 1] },
      { k: 'macrophage', id: 'granuloma', at: [0, 0, 0], n: 8, spread: 1.6, s: [0.01, 0.01, 0.5, 0.7], o: [0, 0, 1, 1], color: '#e8d0b8' }] },
    'Mycobacterium tuberculosis is breathed into the lungs, where macrophages swallow it. Unusually, it survives and multiplies inside them. The immune system responds by walling off infected cells inside a granuloma, a ball of macrophages and lymphocytes.\n\nIn most infected people the bacteria stay contained for life (latent TB). If immunity weakens, they break out and destroy lung tissue (active TB), which spreads by coughing. TB is curable with several months of combined antibiotics, but drug resistance is a growing problem.',
    [['mtb', 'M. tuberculosis', 'A slow-growing rod with a waxy coat.'], ['macrophage', 'Macrophage', 'Swallows the bacteria but cannot kill them.'], ['tcell', 'T cells', 'Arrive to help contain the infection.'], ['granuloma', 'Granuloma', 'A wall of immune cells.']],
    { steps: [['Inhaled', 'Bacteria reach the alveoli.'], ['Swallowed', 'Macrophages take them in.'], ['Walled off', 'Immune cells gather.'], ['Contained', 'A granuloma holds them in check.']], facts: ['About a quarter of the world’s population is thought to carry latent TB.'], q: 'tuberculosis granuloma latent infection', refs: ['pai2016'] }),

  t('altitude', 'Breathing at altitude', 'Thin air and how the body adapts', 'lungs', { still: true },
    'Air at the top of Everest has the same proportion of oxygen as at sea level, but about a third of the pressure, so each breath carries a third as much oxygen. The body responds at once by breathing faster and deeper, and over days by making more red blood cells.\n\nGoing up too quickly can cause altitude sickness, and fluid can leak into the lungs or brain. Populations who have lived at altitude for thousands of years, such as Tibetans, carry gene variants that help them cope.',
    [['rul', 'Lungs', 'Work harder at altitude.'], ['diaphragm', 'Diaphragm', 'Drives faster breathing.'], ['trachea', 'Airway', 'Moves more air per minute.']],
    { view: F, controls: [ctl('rate', 'Breaths per minute', 6, 40, 24, 1)], q: 'high altitude adaptation hypoxia Tibetan' }),
];
