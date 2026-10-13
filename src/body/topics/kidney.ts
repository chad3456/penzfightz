import type { Topic } from '../types';
import { chapter, ctl } from './make';

const t = chapter('kidney');
const F: [number, number, number] = [0.15, 0.1, 1];

export const KIDNEY: Topic[] = [
  t('urinary-system', 'The urinary system', 'Kidneys, ureters and bladder', 'body', { show: ['urinary'], still: true },
    'Two kidneys, each about the size of a fist, sit at the back of the abdomen on either side of the spine, tucked under the lower ribs. Together they filter about 180 litres of blood plasma a day, returning almost all of it and producing 1 to 2 litres of urine.\n\nUrine trickles down the ureters, narrow muscular tubes, into the bladder, which stores it until it is passed through the urethra.',
    [['kidneys', 'Kidneys', 'Each holds about a million filtering units, the nephrons.'], ['ureters', 'Ureters', 'About 25–30 cm long; move urine by waves of muscle.'], ['bladder', 'Bladder', 'Stretches to hold about half a litre.'], ['adrenals', 'Adrenal glands', 'Sit on top of the kidneys but are hormone glands.']],
    { view: [0.1, 0.05, -1], q: 'kidney physiology glomerular filtration rate' }),

  t('kidney', 'Inside a kidney', 'Cortex, medulla and pelvis', 'organ', { mode: 'kidney', still: true },
    'Cut in half, a kidney shows an outer layer (cortex) where blood is filtered, and an inner layer (medulla) arranged in striped, cone-shaped pyramids made of tubules and collecting ducts. The pyramids drain into cups that join the funnel-shaped renal pelvis, which leads to the ureter.\n\nThe kidneys receive about a fifth of all the blood the heart pumps, far more than their size suggests, because their job is to filter it.',
    [['cortex', 'Cortex', 'Holds the glomeruli.'], ['medulla', 'Medullary pyramids', 'Concentrate the urine.'], ['pelvis', 'Renal pelvis', 'Collects the urine.'], ['artery', 'Renal artery', 'Brings blood straight from the aorta.'], ['vein', 'Renal vein', 'Returns filtered blood.'], ['ureter', 'Ureter', 'Carries urine to the bladder.'], ['capsule', 'Capsule', 'A tough outer coat.']],
    { view: F, q: 'renal anatomy cortex medulla blood flow' }),

  t('nephron', 'The nephron', 'A filter and a long tube', 'organ', { mode: 'nephron', still: true },
    'Each kidney has about a million nephrons. In each, blood is first filtered in a knot of capillaries, the glomerulus, into a cup called Bowman’s capsule. The filtrate then passes along a winding tube where useful things are taken back and waste is added.\n\nThe proximal tubule reclaims most of the water, salt, glucose and amino acids. The loop of Henle dips into the medulla and builds a salt gradient. The distal tubule fine-tunes salts and acid, and the collecting duct decides how much water to keep, under the control of hormones.',
    [['glomerulus', 'Glomerulus', 'The filter.'], ['bowman', 'Bowman’s capsule', 'Collects the filtrate.'], ['proximal', 'Proximal tubule', 'Reabsorbs about two-thirds of the filtrate.'], ['loop', 'Loop of Henle', 'Creates the concentration gradient.'], ['distal', 'Distal tubule', 'Adjusts sodium, potassium and acid.'], ['collecting', 'Collecting duct', 'Antidiuretic hormone opens water channels here.'], ['cortex', 'Cortex', 'Where the glomeruli sit.']],
    { view: F, q: 'nephron segments reabsorption loop of Henle' }),

  t('glomerulus', 'The glomerulus', 'Filtering blood under pressure', 'organ', { mode: 'glomerulus', still: true },
    'Blood enters the glomerulus through a wider arteriole than it leaves by, so pressure builds and pushes fluid out through the capillary walls. The filter has three layers, which let water, salts, sugar and waste through but hold back blood cells and most proteins.\n\nThe total rate of filtering by all the glomeruli, the glomerular filtration rate (GFR), about 120 ml a minute in a healthy young adult, is the standard measure of kidney function.',
    [['afferent', 'Afferent arteriole', 'Brings blood in.'], ['efferent', 'Efferent arteriole', 'Narrower; keeps pressure up.'], ['glomerulus', 'Capillary tuft', 'The filter itself.'], ['bowman', 'Bowman’s capsule', 'Catches the filtrate.'], ['filtrate', 'Filtrate', 'Plasma without its proteins.'], ['tubule', 'Tubule', 'Where processing begins.']],
    { view: F, q: 'glomerular filtration barrier podocytes GFR' }),

  t('concentrating-urine', 'Concentrating urine', 'How the kidney saves water', 'organ', { mode: 'nephron', still: true },
    'The loop of Henle pumps salt out of its rising limb into the surrounding tissue, making the deep medulla very salty. When the body needs to save water, the pituitary releases antidiuretic hormone (ADH), which inserts water channels (aquaporins) into the collecting ducts; water then flows out into the salty medulla by osmosis, leaving concentrated urine.\n\nWithout ADH the ducts stay watertight and lots of dilute urine is made. Alcohol suppresses ADH, which is one reason it makes you urinate.',
    [['loop', 'Loop of Henle', 'A countercurrent multiplier.'], ['collecting', 'Collecting duct', 'Its water permeability is set by ADH.'], ['distal', 'Distal tubule', 'Dilute fluid arrives here.']],
    { view: F, q: 'urine concentration countercurrent ADH aquaporin' }),

  t('kidney-stones', 'Kidney stones', 'Crystals that grow', 'organ', { mode: 'kidney', stone: true, still: true },
    'When urine holds more minerals than it can keep dissolved, crystals form and can grow into stones, most often of calcium oxalate. Not drinking enough is the biggest risk; diet, genes and some conditions play a part.\n\nSmall stones often pass unnoticed. A stone moving into the ureter causes renal colic, among the worst pains people describe, coming in waves. Most pass on their own; larger ones are broken up with shock waves or removed through a fine telescope.',
    [['stone', 'Stone', 'Here in the renal pelvis.'], ['pelvis', 'Renal pelvis', 'Where many stones form.'], ['ureter', 'Ureter', 'Stones get stuck at its narrowest points.']],
    { view: F, q: 'nephrolithiasis kidney stone prevention' }),

  t('bladder', 'The bladder', 'A stretchy store', 'organ', { mode: 'bladder', still: true },
    'The bladder is a hollow bag of muscle (the detrusor) lined with a stretchy layer that folds when empty. As it fills, stretch sensors signal the brain; the first urge comes at about 150 to 250 ml, and it can hold about 400 to 600 ml.\n\nTwo sphincters keep it shut: an internal one controlled automatically and an external one under voluntary control. When you decide to go, the brain relaxes the sphincters and contracts the detrusor. Move the slider to fill it.',
    [['bladder', 'Detrusor muscle', 'Contracts to empty the bladder.'], ['urine', 'Urine', 'Stored until it is passed.'], ['ureter', 'Ureters', 'Enter at an angle that acts as a valve against backflow.'], ['sphincter', 'Sphincter', 'Keeps urine in.'], ['urethra', 'Urethra', 'The exit.']],
    { view: F, controls: [ctl('fill', 'Fullness', 0, 1, 0.6, 0.05)], q: 'bladder physiology micturition control' }),

  t('dialysis', 'Dialysis', 'An artificial kidney', 'micro',
    { bg: 'membrane', actors: [
      { k: 'rbc', id: 'cells', at: [0, 1.4, 0], n: 10, spread: [2.4, 0.4, 1.2], s: 1.2 }, { k: 'mol', id: 'protein', at: [0, 1.0, 0], n: 8, spread: [2.4, 0.3, 1.2], color: '#f2c97a', s: 1.8 },
      { k: 'mol', id: 'waste', at: [[0, 1.1, 0], [0, -0.3, 0], [0, -2.4, 0]], n: 30, spread: [2.4, 0.4, 1.2], color: '#e8584a', s: 0.6, seed: 3 }] },
    'When the kidneys fail, waste products and excess water and salts build up in the blood. In haemodialysis, blood is pumped through a filter (dialyser) containing thousands of hollow fibres made of a membrane with tiny pores. On the other side flows a clean fluid.\n\nSmall waste molecules such as urea and potassium diffuse through the pores into the fluid, while blood cells and proteins are too big to pass. A typical regime is about four hours, three times a week. A kidney transplant gives far better quality of life where possible.',
    [['membrane', 'Dialysis membrane', 'Pores let small molecules through.'], ['waste', 'Urea and other wastes', 'Diffuse out.'], ['cells', 'Blood cells', 'Too big to pass.'], ['protein', 'Proteins', 'Mostly kept in.']],
    { steps: [['Blood in', 'Waste-laden blood flows past the membrane.'], ['Diffusion', 'Small molecules cross.'], ['Cleaned', 'Waste leaves in the dialysis fluid.']], q: 'hemodialysis principles diffusion membrane' }),

  t('diabetic-kidney', 'Diabetes and the kidneys', 'A leaky filter', 'organ', { mode: 'glomerulus', diabetic: true, still: true },
    'Years of high blood sugar and blood pressure damage the delicate glomerular filter. At first it works too hard; then its walls thicken and become leaky, letting protein (albumin) escape into the urine, an early warning sign picked up by a simple urine test.\n\nDiabetes is the commonest cause of kidney failure. Controlling sugar and blood pressure, and newer drugs such as SGLT2 inhibitors, slow the damage considerably.',
    [['glomerulus', 'Damaged glomerulus', 'Thickened and scarred.'], ['filtrate', 'Leaking protein', 'Shown in orange.'], ['afferent', 'Arteriole', 'High pressure worsens the damage.']],
    { view: F, q: 'diabetic kidney disease SGLT2 inhibitors albuminuria' }),

  t('raas', 'Kidneys and blood pressure', 'The renin–angiotensin system', 'organ', { mode: 'kidney', still: true },
    'When blood pressure or salt falls, cells near each glomerulus release the enzyme renin. It starts a chain that produces angiotensin II, which tightens blood vessels and makes the adrenal glands release aldosterone, which tells the kidney to keep salt and water. Pressure rises.\n\nMany blood pressure medicines block this system: ACE inhibitors stop angiotensin II being made, and angiotensin receptor blockers stop it acting. The kidneys also make erythropoietin, which drives red cell production, and activate vitamin D.',
    [['cortex', 'Juxtaglomerular cells', 'In the cortex; release renin.'], ['artery', 'Renal artery', 'Narrowing can trigger high blood pressure.'], ['medulla', 'Medulla', 'Reabsorbs salt and water under hormonal control.']],
    { view: F, q: 'renin angiotensin aldosterone system blood pressure' }),

  t('uti', 'Urinary tract infection', 'Bacteria in the bladder', 'micro',
    { bg: 'lumen', bgColor: '#f0c8b0', fit: [0, 0, 0, 2.2], actors: [
      { k: 'rod', id: 'ecoli', n: 30, spread: [3.5, 1.3, 1.3], s: 0.5, color: '#7fc98a' }, { k: 'neutrophil', id: 'neutrophil', n: 6, spread: [3, 1.2, 1.2], s: 0.6 }, { k: 'mol', id: 'urine', n: 40, spread: [4, 1.5, 1.5], color: '#f2e070', s: 0.5 }] },
    'Most urinary infections are caused by E. coli from the gut that climb the urethra into the bladder. Hair-like pili let them grip the bladder lining so they are not washed out. Women are affected much more often because the urethra is shorter.\n\nSymptoms are burning, frequency and urgency. White cells rush in to fight. Most bladder infections clear with a short course of antibiotics; infections that reach the kidneys cause fever and back pain and need prompt treatment.',
    [['ecoli', 'E. coli', 'Use pili to stick to the lining.'], ['neutrophil', 'White cells', 'Appear in the urine (pyuria).'], ['wall', 'Bladder lining', 'Inflamed.']],
    { q: 'uropathogenic E coli cystitis pathogenesis' }),
];
