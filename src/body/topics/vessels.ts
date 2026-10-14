import type { Topic } from '../types';
import { chapter, ctl } from './make';

const t = chapter('vessels');
const SIDE: [number, number, number] = [0.15, 0.35, 1];

export const VESSELS: Topic[] = [
  t('circulation', 'The circulation', 'Some 100,000 km of vessels', 'body', { show: ['circulation'], pulse: true, still: true },
    'Blood leaves the heart in arteries, which branch into smaller arterioles and then into capillaries thinner than a hair, where oxygen and nutrients pass into the tissues. Capillaries join into venules and veins, which carry the blood back to the heart.\n\nThere are two circuits in series: the systemic circuit to the whole body (left heart to right heart) and the pulmonary circuit through the lungs (right heart to left heart). A red cell goes round the whole loop in about a minute at rest.',
    [['aorta', 'Aorta', 'The largest artery.'], ['arteries', 'Arteries', 'Carry blood away from the heart under high pressure.'], ['veins', 'Veins', 'Carry blood back at low pressure; most have valves.'], ['heart', 'Heart', 'Pumps both circuits at once.']],
    { view: [0.1, 0.05, 1], facts: ['Laid end to end, an adult’s blood vessels would stretch an estimated 100,000 km, mostly capillaries.', 'At any moment about two-thirds of the blood is in the veins.'], q: 'systemic pulmonary circulation physiology' }),

  t('artery-wall', 'Inside an artery', 'Three layers built for pressure', 'vessel', { mode: 'artery', still: true },
    'An artery wall has three layers. The inner lining (intima) is a single sheet of endothelial cells, smooth enough to keep blood flowing without clotting. The middle layer (media) is smooth muscle and elastic fibres, which stretch with each heartbeat and recoil between beats, keeping blood moving. The outer coat (adventitia) is tough connective tissue that anchors the vessel.\n\nThe endothelium is far from passive: it releases nitric oxide and other signals that relax the muscle, stop clots and calm inflammation.',
    [['endothelium', 'Endothelium (intima)', 'One cell thick; its health is central to heart disease.'], ['media', 'Media', 'Smooth muscle and elastin; thickest in arteries.'], ['adventitia', 'Adventitia', 'Collagen; carries the vessel’s own tiny blood vessels and nerves.'], ['lumen', 'Lumen', 'The channel the blood flows through.'], ['rbc', 'Red blood cells', 'Moving fastest in the centre of the vessel.']],
    { view: SIDE, controls: [ctl('tone', 'Muscle tone', 0, 1, 0, 0.05)], q: 'arterial wall structure endothelium nitric oxide' }),

  t('vein-valves', 'Veins and their valves', 'Keeping blood moving uphill', 'vessel', { mode: 'vein', still: true },
    'Veins have thinner walls and wider channels than arteries, and the pressure inside them is low. To return blood from the legs against gravity, veins in the limbs have one-way valves: pairs of thin cusps that open toward the heart and snap shut if blood starts to fall back.\n\nWhen leg muscles contract they squeeze the deep veins, pushing blood upward through the valves. This calf muscle pump is why walking helps prevent swollen ankles and clots on long journeys.',
    [['valve', 'Valve cusps', 'Open as blood flows toward the heart, close against backflow.'], ['media', 'Thin muscle layer', 'Veins can expand to hold extra blood.'], ['adventitia', 'Outer coat', 'Usually the thickest layer in a vein.'], ['lumen', 'Lumen', 'Wide, slow-moving blood.']],
    { view: SIDE, q: 'venous valves calf muscle pump' }),

  t('capillary', 'Capillaries', 'Where the exchange happens', 'vessel', { mode: 'capillary', still: true, fit: [0, 0, 0, 3] },
    'Capillaries are the smallest vessels, about 5 to 10 micrometres wide: so narrow that red blood cells pass through in single file, often folding to fit. Their wall is a single layer of endothelial cells.\n\nOxygen, carbon dioxide, glucose and wastes cross that thin wall by diffusion. Hardly any cell in the body is more than a few cells away from a capillary.',
    [['endothelium', 'Single-cell wall', 'Thin enough for gases to diffuse across in a fraction of a second.'], ['rbc', 'Red cells in single file', 'Their flexible shape lets them squeeze through.'], ['lumen', 'Lumen', 'Barely wider than a red cell.']],
    { view: SIDE, facts: ['A red cell spends about one second in a capillary, long enough to unload its oxygen.'], q: 'capillary exchange diffusion endothelium' }),

  t('capillary-bed', 'A capillary bed', 'From arteriole to venule', 'vessel', { mode: 'bed', still: true },
    'Blood reaches each tissue through an arteriole, flows through a mesh of capillaries, and leaves through a venule. Rings of muscle (precapillary sphincters) where capillaries branch off can open or close, so blood goes where it is needed: to working muscles in exercise, to the gut after a meal, away from the skin in the cold.\n\nAlong the way the blood turns from bright red to dark red as it gives up oxygen (shown here as red fading to purple).',
    [['arteriole', 'Arteriole', 'The main control point for blood pressure and flow.'], ['capillary', 'Capillaries', 'The exchange vessels.'], ['venule', 'Venule', 'Collects blood from the bed.'], ['sphincter', 'Precapillary sphincter', 'Opens and closes capillary branches.'], ['shunt', 'Shunt', 'A direct channel that can bypass the bed.'], ['tissue', 'Tissue cells', 'Take up oxygen and give off carbon dioxide.']],
    { view: [0, 0.6, 1], q: 'microcirculation capillary bed regulation' }),

  t('blood-pressure', 'Blood pressure', 'What the two numbers mean', 'vessel', { mode: 'pressure', still: true },
    'Each beat sends a surge of blood into the arteries, stretching their walls; between beats the walls recoil. The top number of a blood pressure reading (systolic) is the peak pressure during the beat; the bottom number (diastolic) is the lowest pressure between beats. A typical healthy reading is around 120 over 80 mmHg or lower.\n\nHigh blood pressure has no symptoms but strains the heart and damages arteries, raising the risk of stroke, heart attack and kidney disease. Move the slider to see the artery stretch more under higher pressure.',
    [['media', 'Elastic wall', 'Absorbs each pulse and releases it between beats.'], ['lumen', 'Lumen', 'Widens slightly with every beat.'], ['endothelium', 'Endothelium', 'Damaged by long-term high pressure.']],
    { view: SIDE, controls: [ctl('bp', 'Systolic pressure', 90, 200, 120, 1, ' mmHg')], facts: ['Arteries stiffen with age, which raises systolic pressure.', 'Lowering high blood pressure by 10 mmHg cuts the risk of major cardiovascular events by about a fifth.'], q: 'blood pressure lowering cardiovascular events meta-analysis', refs: ['ettehad2016'] }),

  t('vasoconstriction', 'Vessels that tighten and relax', 'How the body steers blood', 'vessel', { mode: 'artery', still: true },
    'The muscle in the walls of arteries and arterioles can contract (vasoconstriction) or relax (vasodilation). Because flow depends so steeply on width (roughly on the fourth power of the radius), a small change in diameter makes a big change in flow.\n\nNerves, hormones such as adrenaline and angiotensin, and local signals such as nitric oxide and carbon dioxide all adjust vessel tone. Many blood pressure drugs work by relaxing it. Move the slider.',
    [['media', 'Smooth muscle', 'Contracts to narrow the vessel.'], ['endothelium', 'Endothelium', 'Releases nitric oxide to relax it.'], ['lumen', 'Lumen', 'Halving its radius cuts flow about sixteen-fold.']],
    { view: SIDE, controls: [ctl('tone', 'Constriction', 0, 1, 0.5, 0.05)], q: 'vascular tone vasodilation nitric oxide Poiseuille' }),

  t('atherosclerosis', 'Atherosclerosis', 'How plaque builds up in an artery', 'vessel', { mode: 'plaque', still: true },
    'Atherosclerosis begins when LDL cholesterol particles get into the artery wall and are trapped there. White cells move in to clear them, swell into fat-laden foam cells, and set up a slow inflammation. Over years a plaque forms: a soft core of fat and dead cells under a fibrous cap.\n\nPlaques narrow the artery and can cause pain on exertion (angina). The greater danger is when a cap cracks: blood meets the plaque’s contents and clots, and that clot can block the artery within minutes, causing a heart attack or stroke.',
    [['plaque', 'Plaque core', 'Cholesterol, foam cells and debris.'], ['cap', 'Fibrous cap', 'A thin cap is more likely to rupture.'], ['clot', 'Clot', 'Forms on a ruptured plaque.'], ['endothelium', 'Endothelium', 'Damage here is the starting point.'], ['lumen', 'Narrowed lumen', 'Blood speeds up through the narrowing.']],
    { view: SIDE, steps: [['Fatty streak', 'LDL enters the wall and attracts white cells; it can start in childhood.'], ['Plaque', 'A fatty core and fibrous cap build up.'], ['Narrowing', 'The plaque bulges into the artery.'], ['Rupture and clot', 'The cap cracks and a clot blocks the vessel.']], facts: ['Lowering LDL cholesterol reduces the risk of heart attack and stroke in proportion to how far it falls.'], q: 'atherosclerosis pathogenesis plaque rupture inflammation', refs: ['libby2019'] }),

  t('ldl', 'Cholesterol in the bloodstream', 'LDL, HDL and the artery wall', 'micro',
    { bg: 'vessel', fit: [0, 0, 0, 2.6], actors: [
      { k: 'rbc', n: 22, spread: [5, 1.6, 1.6], id: 'rbc' },
      { k: 'ldl', id: 'ldl', n: 26, spread: [4, 1.4, 1.4], color: '#f2c94c', s: 1.3 },
      { k: 'ldl', id: 'hdl', n: 10, spread: [4, 1.4, 1.4], color: '#9fd0ff', s: 0.9, seed: 3 },
      { k: 'macrophage', id: 'foam', at: [[0.2, -2.4, 0.3], [0.2, -2.1, 0.3]], s: 0.7, color: '#f2dca0' },
      { k: 'ldl', at: [0.4, -2.05, 0.6], n: 8, spread: 0.3, s: 1.2, color: '#e8b43a' } ] },
    'Cholesterol does not dissolve in blood, so it travels inside particles called lipoproteins. LDL (low-density lipoprotein) delivers cholesterol to cells; when there is too much, LDL particles lodge in artery walls and start plaque. HDL (high-density lipoprotein) helps carry cholesterol away to the liver.\n\nStatins lower LDL by making the liver take more of it out of the blood. Inherited high cholesterol (familial hypercholesterolaemia) affects about one person in 250.',
    [['ldl', 'LDL particles', 'Each wrapped by one protein, apoB. The number of them that enter the wall drives plaque.'], ['hdl', 'HDL particles', 'Smaller; collect excess cholesterol.'], ['foam', 'Foam cell', 'A macrophage stuffed with cholesterol, the seed of a plaque.'], ['rbc', 'Red cells', 'For scale: an LDL particle is about 25 nm, a red cell about 8,000 nm.']],
    { facts: ['Particles are not to scale here; LDL is far smaller than a red cell.'], q: 'LDL cholesterol causal atherosclerosis consensus', refs: ['ference2017'] }),

  t('aneurysm', 'Aneurysm', 'A weak spot that balloons', 'vessel', { mode: 'aneurysm', still: true },
    'An aneurysm is a bulge where an artery wall has weakened. The commonest kind is in the abdominal aorta, mostly in older men who smoke or have smoked; another kind forms in the arteries at the base of the brain.\n\nThe bulge stretches the wall thinner, and the larger it grows the more likely it is to burst, which is a medical emergency. Many countries offer men a one-off ultrasound scan at 65 to find abdominal aneurysms before they rupture.',
    [['bulge', 'The bulge', 'Wall tension rises with diameter, so large aneurysms grow faster.'], ['media', 'Weakened media', 'Elastic fibres are lost.'], ['lumen', 'Slowed flow', 'Blood swirls in the widened section and clots can form on the wall.']],
    { view: SIDE, steps: [['Weak spot', 'The wall loses elastin and muscle.'], ['Growth', 'Pressure stretches it outward.'], ['Danger', 'Above about 5.5 cm in the aorta, repair is usually advised.']], q: 'abdominal aortic aneurysm screening rupture' }),

  t('dvt', 'Deep vein thrombosis', 'A clot in a leg vein, and where it can go', 'vessel', { mode: 'clot', still: true },
    'Blood can clot inside a deep vein of the leg when it flows slowly (long immobility, flights, surgery), when it clots more readily (pregnancy, some medicines, cancer, inherited tendencies), or when the vein is damaged. The leg may become swollen, warm and painful.\n\nThe danger is that part of the clot breaks off as an embolus, travels through the right side of the heart, and lodges in the lungs as a pulmonary embolism. Blood-thinning medicines stop clots growing while the body dissolves them.',
    [['thrombus', 'Thrombus', 'Often starts in the pocket behind a valve.'], ['valve', 'Vein valve', 'Slow flow behind its cusps encourages clotting.'], ['embolus', 'Embolus', 'A fragment carried away in the blood.'], ['lumen', 'Lumen', 'Partly or fully blocked.']],
    { view: SIDE, steps: [['Slow flow', 'Blood pools around the valve cusps.'], ['Clot forms', 'Platelets and fibrin build a thrombus.'], ['Growth', 'It grows along the vein.'], ['Embolus', 'A piece breaks free and heads for the lungs.']], q: 'deep vein thrombosis pulmonary embolism risk factors' }),

  t('pulmonary-embolism', 'Pulmonary embolism', 'A clot lodged in the lungs', 'lungs', { mode: 'lungs', disease: 'embolism', glass: true, still: true },
    'A pulmonary embolism is a blood clot, usually from a leg vein, that has travelled through the heart and jammed in an artery in the lungs. The part of the lung beyond it is no longer supplied with blood for gas exchange, and a large clot can strain the right side of the heart.\n\nSymptoms include sudden breathlessness, chest pain on breathing in and coughing up blood. It is treated with anticoagulants, and for large clots with clot-dissolving drugs or removal.',
    [['clot', 'Embolus', 'Lodged where the artery narrows.'], ['artery', 'Pulmonary artery', 'Carries blood from the right ventricle.'], ['rll', 'Affected lung', 'Ventilated but not perfused.']],
    { view: [0.1, 0.1, 1], q: 'pulmonary embolism diagnosis management' }),

  t('varicose', 'Varicose veins', 'When the valves fail', 'vessel', { mode: 'varicose', still: true },
    'When valves in the superficial leg veins stop closing properly, blood falls back and pools. The vein stretches, the next valve down fails too, and the vein becomes swollen, twisted and visible under the skin.\n\nVaricose veins are common, run in families, and are more likely with pregnancy, long hours standing and age. Many cause no trouble; others ache or lead to skin changes, and can be closed off with heat or foam injections.',
    [['valve', 'Failing valve', 'Cusps no longer meet.'], ['lumen', 'Pooling blood', 'Flows back toward the foot.'], ['media', 'Stretched wall', 'Thin and dilated.']],
    { view: SIDE, steps: [['Healthy', 'Valves close against backflow.'], ['Leak', 'One valve fails.'], ['Stretch', 'Pressure widens the vein and more valves fail.']], q: 'varicose veins chronic venous insufficiency treatment' }),

  t('angioplasty', 'Balloon and stent', 'Step by step', 'vessel', { mode: 'stent', still: true, fit: [0, 0, 0, 3] },
    'A guide wire is threaded through the narrowed artery. A catheter carrying a folded balloon wrapped in a crimped stent follows it. Inflating the balloon squashes the plaque and expands the stent against the wall; the balloon is then deflated and withdrawn, leaving the stent as scaffolding.\n\nThe same idea is used in arteries of the heart, legs, kidneys and neck.',
    [['balloon', 'Balloon', 'Inflated for a few seconds at high pressure.'], ['stent', 'Stent', 'Stays in place; tissue grows over it within weeks.'], ['plaque', 'Plaque', 'Compressed into the wall.']],
    { view: SIDE, steps: [['Narrowed', 'Plaque restricts flow.'], ['Wire and balloon', 'The catheter is positioned.'], ['Inflate', 'The balloon expands the stent.'], ['Open', 'The balloon is removed; the stent holds the artery open.']], q: 'balloon angioplasty stent restenosis' }),

  t('lymph-vessels', 'Lymph vessels', 'The body’s second drainage system', 'vessel', { mode: 'lymph', still: true },
    'Every day around 20 litres of fluid seep out of the capillaries into the tissues; most of it returns directly, but a few litres are collected by lymph vessels. They carry this lymph, along with white cells and particles from the tissues, through lymph nodes and back into large veins at the base of the neck.\n\nLymph vessels have valves and are squeezed along by muscle movement. Lymph nodes filter the fluid and are where immune responses often begin, which is why they swell during infections.',
    [['vessel', 'Lymph vessel', 'Thin-walled, with one-way valves.'], ['node', 'Lymph node', 'A filter packed with immune cells.'], ['follicle', 'Follicle', 'Where B cells gather and multiply.'], ['capsule', 'Capsule', 'The node’s outer coat.']],
    { view: SIDE, q: 'lymphatic vessels lymph node function' }),

  t('circle-of-willis', 'The brain’s blood supply', 'The circle of Willis', 'brain', { mode: 'glass', arteries: true, still: true },
    'Four arteries supply the brain: two internal carotids at the front of the neck and two vertebral arteries along the spine, which join to form the basilar artery. At the base of the brain they are linked in a ring called the circle of Willis, so if one is narrowed, blood can sometimes arrive from another route.\n\nFrom the ring, the anterior, middle and posterior cerebral arteries fan out over the brain. The brain is only 2% of body weight but receives about 15% of the heart’s output.',
    [['willis', 'Circle of Willis', 'A ring of linked arteries; complete in only a minority of people.'], ['arteries', 'Middle cerebral artery', 'Supplies much of the side of the brain; the most common site of stroke.']],
    { view: [0, -1, 0.35], q: 'circle of Willis anatomy collateral flow' }),

  t('bbb', 'The blood–brain barrier', 'A tight seal round brain capillaries', 'neuron', { mode: 'glia', still: true },
    'In most of the body, capillary walls have small gaps. In the brain, endothelial cells are sealed together by tight junctions and wrapped by the feet of star-shaped astrocytes, forming the blood–brain barrier. Only small, fat-soluble molecules and substances with dedicated transporters (such as glucose) get through easily.\n\nThe barrier protects the brain from toxins and infections, but it also keeps out most drugs, which makes brain diseases hard to treat.',
    [['vessel', 'Brain capillary', 'Its endothelial cells are tightly sealed.'], ['barrier', 'Tight junctions', 'Seal the gaps between endothelial cells.'], ['astrocyte', 'Astrocyte', 'Its endfeet wrap the vessel and help maintain the barrier.'], ['neuron', 'Neuron', 'Protected behind the barrier.']],
    { view: [0.2, 0.3, 1], q: 'blood-brain barrier tight junctions astrocyte drug delivery' }),

  t('raynaud', 'Cold hands and fingers', 'Raynaud’s phenomenon', 'vessel', { mode: 'artery', still: true },
    'In Raynaud’s phenomenon, small arteries in the fingers and toes clamp down too hard in response to cold or stress. The digits turn white, then blue as the trapped blood loses its oxygen, then red as the vessels reopen.\n\nIt is common, especially in young women, and is usually harmless, but it can also accompany autoimmune diseases such as scleroderma. Keeping warm and some blood-pressure medicines help. Move the slider to see the artery narrow.',
    [['media', 'Over-reactive muscle', 'Contracts strongly in the cold.'], ['lumen', 'Narrowed lumen', 'Too little blood reaches the fingertip.']],
    { view: SIDE, controls: [ctl('tone', 'Spasm', 0, 1, 0.8, 0.05)], q: 'Raynaud phenomenon pathophysiology' }),
];
