import type { Topic } from '../types';
import { chapter } from './make';

const t = chapter('hormones');

export const HORMONES: Topic[] = [
  t('endocrine-system', 'The hormone glands', 'A slow, body-wide messaging system', 'body', { show: ['glands'], still: true },
    'Hormones are chemical messengers released into the blood by glands, reaching every cell but acting only on those with the right receptor. They control growth, metabolism, salt and water balance, stress responses, sleep, and reproduction, usually more slowly and for longer than nerve signals.\n\nThe main glands are the pituitary and hypothalamus in the brain, the thyroid in the neck, the adrenals on the kidneys, the pancreatic islets, and the ovaries or testes. Many other organs, including the gut, fat, heart and kidneys, also release hormones.',
    [['pituitary', 'Pituitary', 'The master gland.'], ['thyroid', 'Thyroid', 'Sets the metabolic rate.'], ['thymus', 'Thymus', 'Trains T cells.'], ['adrenals', 'Adrenal glands', 'Make stress hormones.'], ['pancreas', 'Pancreas', 'Insulin and glucagon.'], ['gonads', 'Ovaries or testes', 'Sex hormones.']],
    { view: [0.1, 0.05, 1], q: 'endocrine system glands hormones overview' }),

  t('insulin', 'Insulin and blood sugar', 'Opening the door for glucose', 'micro',
    { bg: 'membrane', actors: [
      { k: 'receptor', id: 'receptor', at: [-1, -1.05, 0], s: 1.2, glow: [0, 0, 0.6, 0.6] },
      { k: 'mol', id: 'insulin', at: [[-1, 1.6, 0], [-1, 0.4, 0], [-1, -0.25, 0], [-1, -0.25, 0]], s: 1.6, color: '#5ac46a' },
      { k: 'channel', id: 'glut4', at: [[1, -2.4, 0.2], [1, -2.4, 0.2], [1, -1.7, 0.2], [1, -1.05, 0.2]], s: 1.2, color: '#5ab8a0' },
      { k: 'mol', id: 'glucose', at: [[1, 1.4, 0.2], [1, 1.2, 0.2], [1, 0.8, 0.2], [1, -2.2, 0.2]], n: 14, spread: 0.5, color: '#7fe0ff', s: 0.8 }] },
    'After a meal, rising blood sugar makes beta cells in the pancreas release insulin. Insulin binds receptors on muscle, fat and liver cells and sets off signals inside; in muscle and fat these move glucose transporters (GLUT4) from inside the cell to its surface, so glucose can flow in. Insulin also tells the liver to store glucose as glycogen and stop releasing it.\n\nAs glucose moves into cells, blood sugar falls back to normal. Between meals, glucagon does the reverse.',
    [['insulin', 'Insulin', 'A small protein of 51 amino acids.'], ['receptor', 'Insulin receptor', 'Binds the signal.'], ['glut4', 'GLUT4 transporter', 'Brought to the surface by insulin.'], ['glucose', 'Glucose', 'The cell’s main fuel.'], ['membrane', 'Cell membrane', 'The cell’s outer boundary.']],
    { steps: [['After a meal', 'Glucose is high outside the cell.'], ['Insulin arrives', 'It binds its receptor.'], ['Doors open', 'GLUT4 moves to the membrane.'], ['Glucose enters', 'Blood sugar falls.']], q: 'insulin signaling GLUT4 translocation' }),

  t('type1-diabetes', 'Type 1 diabetes', 'When beta cells are destroyed', 'organ', { mode: 'islet', diabetic: true, still: true },
    'In type 1 diabetes the immune system destroys the insulin-making beta cells of the pancreas, usually starting in childhood or young adulthood. Without insulin, glucose cannot get into cells: blood sugar rises, the body burns fat instead and can produce dangerous acids (ketoacidosis).\n\nTreatment is insulin replacement, by injections or a pump, guided by glucose monitoring; automated “artificial pancreas” systems now adjust insulin using a sensor. Insulin was first used in a patient in 1922.',
    [['beta', 'Beta cells', 'Mostly lost.'], ['alpha', 'Alpha cells', 'Spared.'], ['insulin', 'Insulin', 'Little or none released.'], ['acinar', 'Acinar tissue', 'Make digestive enzymes.']],
    { view: [0.2, 0.2, 1], steps: [['Fasting', 'Little insulin.'], ['After a meal', 'Still almost none.']], q: 'type 1 diabetes autoimmunity beta cell' }),

  t('type2-diabetes', 'Type 2 diabetes', 'Insulin that is not heard', 'micro',
    { bg: 'membrane', actors: [
      { k: 'receptor', id: 'receptor', at: [-1, -1.05, 0], s: 1.2 },
      { k: 'mol', id: 'insulin', at: [[-1, 1.6, 0], [-1, 0.6, 0], [-1, 0.2, 0]], n: 8, spread: 0.7, s: 1.4, color: '#5ac46a' },
      { k: 'channel', id: 'glut4', at: [1, -2.4, 0.2], s: 1.2, color: '#5ab8a0' },
      { k: 'mol', id: 'glucose', at: [0.6, 0.8, 0.2], n: 30, spread: [1.6, 0.6, 1], color: '#7fe0ff', s: 0.8 },
      { k: 'fat', id: 'fat', at: [2.2, -2.4, -0.6], s: 0.5 }] },
    'In type 2 diabetes, cells respond poorly to insulin (insulin resistance), especially in the liver, muscle and fat, often linked to excess fat around the organs and inactivity. The pancreas makes more insulin to compensate, but over years the beta cells cannot keep up, and blood sugar rises.\n\nIt accounts for about 90% of diabetes. High sugar damages blood vessels, nerves, kidneys and eyes. Weight loss and exercise can put it into remission in some people; medicines include metformin, SGLT2 inhibitors and GLP-1 drugs.',
    [['insulin', 'Plenty of insulin', 'Lowers blood sugar.'], ['receptor', 'Resistant receptor signalling', 'Binds the signal.'], ['glut4', 'Transporters stay inside', 'Lets glucose into the cell.'], ['glucose', 'Glucose', 'Builds up in the blood.'], ['fat', 'Fat', 'Organ fat drives resistance.']],
    { steps: [['After a meal', 'Glucose rises.'], ['Insulin', 'Released in large amounts.'], ['Resistance', 'Cells respond weakly; glucose stays high.']], q: 'type 2 diabetes insulin resistance beta cell failure remission' }),

  t('glucagon', 'Glucagon', 'Keeping sugar up between meals', 'organ', { mode: 'islet', still: true },
    'When blood sugar falls, during fasting, overnight or in exercise, alpha cells in the islets release glucagon. It acts mainly on the liver, telling it to break down stored glycogen and make new glucose, pushing blood sugar back up.\n\nInsulin and glucagon work as a pair, keeping blood sugar within a narrow range, usually around 4 to 7 millimoles per litre. Glucagon injections are used to rescue people with severe hypoglycaemia.',
    [['alpha', 'Alpha cells', 'Make glucagon.'], ['beta', 'Beta cells', 'Quiet when sugar is low.'], ['delta', 'Delta cells', 'Make somatostatin.'], ['acinar', 'Acinar cells', 'Make digestive enzymes.']],
    { view: [0.2, 0.2, 1], q: 'glucagon hepatic glucose production' }),

  t('thyroid', 'The thyroid', 'Setting the body’s pace', 'body', { show: ['glands'], still: true },
    'The thyroid is a butterfly-shaped gland in the front of the neck. It uses iodine from food to make the hormones T4 and T3, which set the metabolic rate of almost every cell, affecting energy, heart rate, temperature and weight. In children they are essential for brain development and growth.\n\nToo little (hypothyroidism) causes tiredness, cold and weight gain; too much (hyperthyroidism) causes anxiety, weight loss and a racing heart. Iodine deficiency, still common worldwide, causes goitre.',
    [['thyroid', 'Thyroid', 'About 20–25 g.'], ['pituitary', 'Pituitary', 'Sends TSH to control it.']],
    { view: [0.2, 0.6, 1], q: 'thyroid hormone physiology hypothyroidism iodine' }),

  t('stress', 'The stress response', 'Adrenaline and cortisol', 'body', { show: ['glands'], still: true },
    'Faced with a threat, the brain triggers two waves. Within seconds, nerves make the adrenal medulla release adrenaline: heart rate and blood pressure rise, airways widen, glucose floods the blood, blood flow shifts to muscles (fight or flight).\n\nOver minutes, the hypothalamus and pituitary make the adrenal cortex release cortisol, which keeps glucose up and damps inflammation. Cortisol switches off its own release by feedback. Long-term stress keeps it raised, which is linked to high blood pressure, poor sleep and weakened immunity.',
    [['adrenals', 'Adrenal glands', 'Medulla: adrenaline; cortex: cortisol and aldosterone.'], ['pituitary', 'Pituitary', 'Releases ACTH.'], ['heart', 'Heart', 'Speeds up.']],
    { view: [0.1, 0.1, -1], q: 'stress response HPA axis cortisol adrenaline' }),

  t('pituitary', 'The pituitary and hypothalamus', 'The master control', 'brain', { mode: 'half', still: true, deep: ['hypothalamus', 'pituitary', 'thalamus'] },
    'The pituitary, the size of a pea, hangs from the hypothalamus at the base of the brain. The hypothalamus releases hormones that tell the front part of the pituitary when to release its own: growth hormone, prolactin, and stimulating hormones for the thyroid, adrenals and gonads.\n\nThe back part of the pituitary releases two hormones made in the hypothalamus itself: antidiuretic hormone, which saves water, and oxytocin. Most of these systems are controlled by negative feedback, like a thermostat.',
    [['pituitary', 'Pituitary', 'Front (anterior) and back (posterior) lobes.'], ['hypothalamus', 'Hypothalamus', 'Links the brain to the hormone system.'], ['thalamus', 'Thalamus', 'Above.']],
    { view: [-1, 0.1, 0.05], q: 'hypothalamic pituitary axis feedback' }),

  t('growth-hormone', 'Growth hormone', 'Growing taller', 'bones', { mode: 'bone', still: true },
    'Growth hormone from the pituitary, released mostly in pulses during deep sleep, makes the liver produce IGF-1, which drives cartilage cells in the growth plates to multiply, lengthening bones. In adults it continues to influence muscle, fat and bone.\n\nToo little in childhood causes short stature, treatable with injections; too much causes gigantism, or acromegaly in adults, usually from a pituitary tumour. Growth stops when sex hormones at the end of puberty close the growth plates.',
    [['plate', 'Growth plate', 'Where bone lengthens.'], ['spongy', 'Spongy bone', 'Light lattice bone near the ends.'], ['cartilage', 'Cartilage', 'Smooth, slippery joint lining.']],
    { view: [0, 0.1, 1], q: 'growth hormone IGF-1 growth plate' }),

  t('melatonin', 'Melatonin and the body clock', 'Day, night and jet lag', 'brain', { mode: 'glass', still: true, deep: ['pineal', 'hypothalamus', 'optic'] },
    'A master clock in the hypothalamus, the suprachiasmatic nucleus, keeps a roughly 24-hour rhythm and is reset each day by light reaching it from the eyes. As darkness falls, it lets the pineal gland release melatonin, which signals night to the body.\n\nNearly every cell has its own clock genes, coordinated by the master clock. Jet lag and shift work throw these clocks out of step. Jeffrey Hall, Michael Rosbash and Michael Young won the 2017 Nobel Prize for discovering how the clock works.',
    [['pineal', 'Pineal gland', 'Releases melatonin at night.'], ['hypothalamus', 'Hypothalamus', 'Holds the master clock.'], ['optic', 'Optic nerves', 'Carry light signals to the clock.']],
    { view: [-1, 0.45, 0.85], q: 'circadian clock suprachiasmatic melatonin' }),

  t('appetite', 'Hunger and fullness', 'Ghrelin, leptin and GLP-1', 'body', { show: ['digestive', 'organs'], still: true },
    'Appetite is controlled by the hypothalamus, which listens to hormones from the gut and fat. Ghrelin from the empty stomach signals hunger. After eating, the gut releases GLP-1 and other hormones that signal fullness and slow stomach emptying. Fat tissue releases leptin in proportion to fat stores.\n\nDrugs that mimic GLP-1, first developed for type 2 diabetes, cause substantial weight loss and are now widely used to treat obesity.',
    [['stomach', 'Stomach', 'Releases ghrelin when empty.'], ['intestine', 'Small intestine', 'Releases GLP-1 after meals.'], ['brain', 'Hypothalamus', 'Integrates the signals.']],
    { view: [0.1, 0.1, 1], q: 'appetite regulation ghrelin leptin GLP-1 obesity' }),

  t('sex-hormones', 'Sex hormones', 'Oestrogen, progesterone and testosterone', 'body', { show: ['glands'], still: true },
    'The ovaries make oestrogen and progesterone, which run the menstrual cycle and pregnancy and help maintain bone; the testes make testosterone, which drives sperm production and male development. Both sexes make all three, in different amounts. Their release is controlled by the hypothalamus and pituitary.\n\nAt puberty, rising sex hormones trigger growth spurts and body changes. In women, oestrogen falls at menopause, which can cause hot flushes and speeds bone loss.',
    [['gonads', 'Ovaries or testes', 'Make sex hormones.'], ['pituitary', 'Pituitary', 'Releases FSH and LH.'], ['adrenals', 'Adrenal glands', 'Make small amounts of sex hormones too.']],
    { view: [0.1, 0.05, 1], q: 'sex steroid hormones menstrual cycle testosterone' }),

  t('hormone-receptor', 'How hormones act', 'Keys and locks', 'micro',
    { bg: 'void', actors: [
      { k: 'cell', id: 'cell', at: [0, 0, 0], s: 3, o: 0.55 },
      { k: 'mol', id: 'steroid', at: [[-3, 1.4, 0], [-1, 0.6, 0.2], [-0.2, 0.1, 0.2], [-0.1, 0, 0.2]], s: 1.3, color: '#ff9d3a' },
      { k: 'helix', id: 'dna', at: [0.3, -0.2, 0.3], s: 0.5, o: [0.5, 0.5, 0.8, 1], glow: [0, 0, 0, 0.6] },
      { k: 'receptor', id: 'receptor', at: [-0.1, -0.15, 0.2], s: 0.6, rot: [0, 0, 1.2] }] },
    'Hormones work in two broad ways. Protein hormones such as insulin cannot cross the cell membrane, so they bind receptors on the surface and act through signals inside the cell. Steroid hormones such as cortisol, oestrogen and testosterone, and thyroid hormone, are small and fat-soluble: they slip through the membrane and bind receptors inside, which then go into the nucleus and switch genes on or off directly.\n\nOnly cells with the matching receptor respond, which is how one hormone in the blood can have very specific effects.',
    [['steroid', 'Steroid hormone', 'Here entering the cell.'], ['receptor', 'Nuclear receptor', 'Binds the hormone, then DNA.'], ['dna', 'Target genes', 'Switched on.'], ['cell', 'Target cell', 'The whole cell.']],
    { steps: [['In the blood', 'The hormone travels.'], ['Entry', 'It crosses the membrane.'], ['Binding', 'It meets its receptor.'], ['Gene switch', 'The complex activates genes.']], q: 'nuclear receptor steroid hormone mechanism' }),

  t('oxytocin', 'Oxytocin', 'Birth, milk and bonding', 'brain', { mode: 'half', still: true, deep: ['hypothalamus', 'pituitary'] },
    'Oxytocin is made in the hypothalamus and released from the back of the pituitary. During labour it drives the rhythmic contractions of the womb, in a positive feedback loop: contractions trigger more oxytocin. During breastfeeding, a baby’s suckling triggers its release, which makes milk flow.\n\nIt also acts in the brain, where it is involved in social bonding and trust, though popular claims about it as a “love hormone” go well beyond the evidence.',
    [['hypothalamus', 'Hypothalamus', 'Makes oxytocin.'], ['pituitary', 'Posterior pituitary', 'Releases it.']],
    { view: [-1, 0.1, 0.05], q: 'oxytocin labor lactation social behavior' }),
];
