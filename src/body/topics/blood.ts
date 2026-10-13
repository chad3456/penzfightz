import type { Topic } from '../types';
import { chapter } from './make';

const t = chapter('blood');
type V3 = [number, number, number];
const FLOW = (n = 34, extra: Record<string, unknown> = {}) => ({ k: 'rbc', n, spread: [5, 1.7, 1.7] as V3, id: 'rbc', ...extra });

export const BLOOD: Topic[] = [
  t('blood-overview', 'What blood is made of', 'Cells floating in plasma', 'micro',
    { bg: 'vessel', fit: [0, 0, 0, 2.4], actors: [FLOW(40), { k: 'neutrophil', at: [0.5, 0.2, 0.6], id: 'wbc' }, { k: 'lymph', at: [-1.3, -0.6, 0.3], id: 'lymph' }, { k: 'platelet', n: 14, spread: [4, 1.5, 1.5], id: 'platelet' }, { k: 'plasma', n: 90, spread: [5, 2, 2], id: 'plasma', color: '#f2c97a' }] },
    'An adult has about five litres of blood. Just over half is plasma, a straw-coloured liquid that is mostly water carrying salts, proteins, sugar, fats, hormones and waste. The rest is cells: red cells by the trillion, a much smaller number of white cells, and platelets, which are fragments of cells.\n\nBlood carries oxygen and nutrients out to the tissues and carbon dioxide and waste away, spreads heat, carries hormones, defends against infection and seals leaks.',
    [['rbc', 'Red blood cells', 'About 45% of blood volume; roughly 5 million in every microlitre.'], ['wbc', 'Neutrophil', 'The commonest white cell, first to arrive at infections.'], ['lymph', 'Lymphocyte', 'B and T cells of the adaptive immune system.'], ['platelet', 'Platelets', 'Cell fragments that start clots.'], ['plasma', 'Plasma', 'About 55% of blood: 92% water plus proteins such as albumin, antibodies and clotting factors.']],
    { facts: ['A drop of blood holds around 250 million red cells.', 'Red cells outnumber white cells by roughly 600 to 1.'], q: 'blood composition plasma cells' }),

  t('red-cell', 'The red blood cell', 'A bag of haemoglobin', 'micro',
    { bg: 'void', actors: [{ k: 'rbc', id: 'rbc', at: [0, 0, 0], s: 5, rot: [0.5, 0, 0] }, { k: 'mol', id: 'oxygen', n: 30, at: [0, 0, 0], spread: [2.4, 1.4, 1.4], color: '#ff6b5a', o: [0.2, 1, 1], drift: 0.3 }] },
    'Mature red cells have no nucleus and almost no internal parts: they are flexible bags of the protein haemoglobin, which carries oxygen. Their biconcave disc shape, thin in the middle, gives a large surface for gas exchange and lets them fold through capillaries narrower than themselves.\n\nThey are made in the bone marrow at a rate of about two million a second, and each lasts about 120 days before the spleen and liver recycle it.',
    [['rbc', 'Biconcave disc', 'About 7.5 micrometres across and 2 thick.'], ['oxygen', 'Oxygen', 'Each red cell carries about a billion oxygen molecules on its 270 million haemoglobin molecules.']],
    { steps: [['In the tissues', 'Haemoglobin releases oxygen where it is scarce.'], ['In the lungs', 'It picks up oxygen as the cell passes the alveoli.'], ['Loaded', 'Fully loaded blood is bright red.']], q: 'erythrocyte structure deformability lifespan' }),

  t('haemoglobin', 'Haemoglobin', 'Four chains, four irons, four oxygens', 'micro',
    { bg: 'void', actors: [
      { k: 'fragment', id: 'alpha', at: [-0.38, 0.38, 0], s: 3.4, color: '#e8584a' }, { k: 'fragment', at: [0.38, -0.38, 0.1], s: 3.4, color: '#e8584a', id: 'alpha' },
      { k: 'fragment', id: 'beta', at: [0.38, 0.38, -0.1], s: 3.4, color: '#c98bd9' }, { k: 'fragment', at: [-0.38, -0.38, 0], s: 3.4, color: '#c98bd9', id: 'beta' },
      { k: 'pore', id: 'heme', at: [0, 0, 0.55], n: 4, spread: 0.45, s: 0.8, color: '#7a2a1a' },
      { k: 'mol', id: 'oxygen', at: [[0, 2.2, 0.8], [0, 0.9, 0.8], [0, 0, 0.8]], n: 4, spread: 0.5, color: '#ff6b5a' }] },
    'Haemoglobin is made of four protein chains, two alpha and two beta in adults, each cradling a flat heme group with an iron atom at its centre. Each iron can bind one oxygen molecule.\n\nBinding is cooperative: once one oxygen attaches, the molecule changes shape and the others bind more easily. That gives the S-shaped oxygen curve that lets blood load up fully in the lungs and unload generously in working muscle.',
    [['alpha', 'Alpha chains', 'Two of them.'], ['beta', 'Beta chains', 'Two; a change in the beta gene causes sickle cell disease.'], ['heme', 'Heme groups', 'An iron atom held in a ring; it is what makes blood red.'], ['oxygen', 'Oxygen', 'Up to four per haemoglobin.']],
    { steps: [['Empty', 'Deoxyhaemoglobin, a tense shape.'], ['First oxygen', 'Binding loosens the structure.'], ['Full', 'All four sites fill easily.']], q: 'hemoglobin cooperativity oxygen binding structure' }),

  t('white-cells', 'The white blood cells', 'Five kinds of defender', 'micro',
    { bg: 'void', actors: [
      { k: 'neutrophil', id: 'neutrophil', at: [-2.4, 0, 0] }, { k: 'lymph', id: 'lymphocyte', at: [-1.2, 0, 0], s: 0.9 }, { k: 'monocyte', id: 'monocyte', at: [0.1, 0, 0], s: 1.15 },
      { k: 'eosinophil', id: 'eosinophil', at: [1.35, 0, 0] }, { k: 'basophil', id: 'basophil', at: [2.5, 0, 0], s: 0.9 }] },
    'White cells (leukocytes) are the mobile part of the immune system. They are made in the bone marrow, travel in the blood, and squeeze out of capillaries into tissues wherever they are needed.\n\nThey are told apart by size, the shape of the nucleus, and the granules in their cytoplasm. A blood count measures each kind, and shifts in the numbers point to infections, allergies or blood disorders.',
    [['neutrophil', 'Neutrophil', '40–70% of white cells. Multi-lobed nucleus; eats bacteria.'], ['lymphocyte', 'Lymphocyte', '20–40%. B cells make antibodies, T cells kill infected cells and coordinate.'], ['monocyte', 'Monocyte', '2–8%. Becomes a macrophage in the tissues.'], ['eosinophil', 'Eosinophil', '1–4%. Two-lobed nucleus; fights parasites and drives allergy.'], ['basophil', 'Basophil', 'Under 1%. Releases histamine.']],
    { q: 'leukocyte types function differential count' }),

  t('platelets', 'Platelets and the first plug', 'Sealing a leak in seconds', 'micro',
    { bg: 'vessel', fit: [0, -0.8, 0, 2.6], actors: [FLOW(20), { k: 'platelet', id: 'platelet', n: 16, at: [[0, 0, 0], [0, -1.2, 0.4], [0, -2.05, 0.3]], spread: [[2, 1, 1], [1, 0.5, 0.6], [0.6, 0.2, 0.5]][0], s: [1.6, 1.8, 2.2] }, { k: 'mol', id: 'collagen', at: [0, -2.35, 0.3], n: 12, spread: [0.8, 0.05, 0.5], color: '#f0e0a0', o: [0, 1, 1] }] },
    'When a blood vessel is cut, the collagen beneath its lining is exposed. Platelets, tiny cell fragments about 2 to 3 micrometres across, stick to it within seconds, change shape, sprout spiky projections and release chemicals that call in more platelets.\n\nThe result is a soft platelet plug. Clotting proteins then reinforce it with a mesh of fibrin.',
    [['platelet', 'Platelets', 'Made by giant marrow cells called megakaryocytes; each lasts about 10 days.'], ['collagen', 'Exposed collagen', 'The signal that the wall is damaged.'], ['wall', 'Vessel wall', 'Here torn on its lower side.']],
    { steps: [['Circulating', 'Platelets tumble along as smooth discs.'], ['Stick', 'They bind exposed collagen.'], ['Plug', 'Activated platelets clump into a plug.']], facts: ['Aspirin works by permanently blocking an enzyme platelets need to activate one another.'], q: 'platelet adhesion activation aggregation' }),

  t('blood-clot', 'The fibrin clot', 'A net that traps red cells', 'micro',
    { bg: 'void', actors: [{ k: 'fibrin', id: 'fibrin', at: [0, 0, 0], s: 1.2, o: [0, 0.5, 1] }, { k: 'rbc', id: 'rbc', n: 26, spread: [1.6, 1.4, 1.2], drift: 0.02 }, { k: 'platelet', id: 'platelet', n: 12, spread: [1.5, 1.2, 1.1], s: 1.5 }] },
    'The clotting cascade is a chain of enzymes in plasma, each activating the next, that ends with thrombin cutting fibrinogen into fibrin. Fibrin strands knit together into a net that binds the platelet plug and traps red cells, turning liquid blood into a solid clot.\n\nThe system is balanced by natural anticoagulants, and once the vessel has healed, an enzyme called plasmin dissolves the clot.',
    [['fibrin', 'Fibrin net', 'Polymerised fibrinogen, cross-linked by factor XIII.'], ['rbc', 'Trapped red cells', 'Give clots their red colour.'], ['platelet', 'Platelets', 'Contract and pull the clot tight.']],
    { steps: [['Plug', 'Platelets gather.'], ['Cascade', 'Clotting factors amplify a small trigger into a burst of thrombin.'], ['Net', 'Fibrin strands stabilise the clot.']], q: 'coagulation cascade thrombin fibrin' }),

  t('blood-types', 'Blood groups', 'A, B, AB and O', 'micro',
    { bg: 'void', actors: [
      { k: 'rbc', id: 'rbc', at: [[-1.6, 0.8, 0], [-1.6, 0.8, 0], [-1.6, 0.8, 0], [-1.6, 0.8, 0]], s: 3.6, rot: [0.6, 0, 0] },
      { k: 'mol', id: 'antigen-a', at: [-1.6, 0.8, 0.4], n: 16, spread: [1.4, 0.8, 0.4], color: '#5ac46a', o: [1, 0, 1, 0] },
      { k: 'mol', id: 'antigen-b', at: [-1.6, 0.8, 0.4], n: 16, spread: [1.4, 0.8, 0.4], color: '#c98bd9', o: [0, 1, 1, 0], seed: 5 },
      { k: 'antibody', id: 'antibodies', at: [1.6, -0.6, 0], n: 8, spread: 0.8, s: 1.4, color: '#f2c94c' }] },
    'Red cells carry sugar markers on their surface. Group A cells carry the A marker, B cells the B marker, AB cells both and O cells neither. People naturally make antibodies against the markers they lack: a group A person has anti-B in their plasma.\n\nIn a mismatched transfusion those antibodies attack the donor cells, which can be fatal. The Rh (D) marker is checked as well, which is where “positive” and “negative” come from. Group O negative red cells can be given to almost anyone in an emergency.',
    [['rbc', 'Red cell', 'The markers sit on its membrane.'], ['antigen-a', 'A antigen', 'A sugar added by an enzyme from the A gene.'], ['antigen-b', 'B antigen', 'A slightly different sugar from the B gene.'], ['antibodies', 'Antibodies in plasma', 'Against whichever markers you lack.']],
    { steps: [['Group A', 'A markers; anti-B antibodies.'], ['Group B', 'B markers; anti-A antibodies.'], ['Group AB', 'Both markers; no anti-A or anti-B.'], ['Group O', 'Neither; both antibodies.']], q: 'ABO blood group antigens transfusion compatibility' }),

  t('plasma', 'Plasma', 'The liquid half of blood', 'micro',
    { bg: 'vessel', fit: [0, 0, 0, 2.3], actors: [
      { k: 'mol', id: 'albumin', n: 40, spread: [4, 1.6, 1.6], color: '#f2c97a', s: 1.4 }, { k: 'antibody', id: 'antibodies', n: 10, spread: [4, 1.5, 1.5], s: 1.2 },
      { k: 'mol', id: 'glucose', n: 30, spread: [4, 1.6, 1.6], color: '#7fe0ff', s: 0.8, seed: 3 }, { k: 'ldl', id: 'lipids', n: 12, spread: [4, 1.5, 1.5], seed: 4 },
      { k: 'mol', id: 'hormones', n: 12, spread: [4, 1.6, 1.6], color: '#ff9d3a', s: 0.7, seed: 6 }, FLOW(10)] },
    'Plasma is about 92% water. Dissolved in it are salts that keep cells working, glucose and fats for fuel, hormones, waste products such as urea, and around 7% protein.\n\nThe main protein, albumin, holds water in the bloodstream by osmosis and carries drugs and hormones. Others are antibodies, clotting factors and transport proteins. Plasma donated from blood is used to make treatments such as clotting factor concentrates and immunoglobulins.',
    [['albumin', 'Albumin', 'Made by the liver; about 60% of plasma protein.'], ['antibodies', 'Antibodies', 'Immunoglobulins made by plasma cells.'], ['glucose', 'Glucose', 'Kept around 4 to 7 mmol/L.'], ['lipids', 'Lipoproteins', 'Carry cholesterol and fats.'], ['hormones', 'Hormones', 'Messages between organs.']],
    { q: 'plasma proteins albumin function' }),

  t('bone-marrow', 'How blood is made', 'From one stem cell to every blood cell', 'micro',
    { bg: 'void', actors: [
      { k: 'stem', id: 'stem', at: [0, 0, 0], s: 1.2, glow: [0.3, 0.3, 0.3] },
      { k: 'rbc', id: 'rbc', at: [[0, 0, 0], [1.6, 1.1, 0], [2.4, 1.6, 0]], n: 5, spread: 0.35, s: [0.01, 1.2, 1.5] },
      { k: 'platelet', id: 'platelet', at: [[0, 0, 0], [1.8, -0.9, 0], [2.6, -1.4, 0]], n: 6, spread: 0.3, s: [0.01, 1.5, 1.8] },
      { k: 'neutrophil', id: 'myeloid', at: [[0, 0, 0], [-1.5, 1.2, 0], [-2.3, 1.7, 0]], s: [0.01, 0.6, 0.8] },
      { k: 'lymph', id: 'lymphoid', at: [[0, 0, 0], [-1.6, -1.1, 0], [-2.4, -1.6, 0]], s: [0.01, 0.7, 0.9] }] },
    'Blood cells live short lives, so the bone marrow makes hundreds of billions every day. They all descend from rare haematopoietic stem cells, which can both renew themselves and give rise to every blood cell type.\n\nStem cells first split into two families: myeloid (red cells, platelets, neutrophils, monocytes and other granulocytes) and lymphoid (B cells, T cells and natural killer cells). Hormones steer production: erythropoietin from the kidney raises red cell output when oxygen is low.',
    [['stem', 'Haematopoietic stem cell', 'The basis of bone marrow transplants.'], ['rbc', 'Red cells', 'Lose their nucleus before leaving the marrow.'], ['platelet', 'Platelets', 'Budded off from megakaryocytes.'], ['myeloid', 'Myeloid line', 'Granulocytes and monocytes.'], ['lymphoid', 'Lymphoid line', 'B, T and NK cells.']],
    { steps: [['Stem cell', 'Self-renews in the marrow.'], ['Commitment', 'Daughters choose a lineage.'], ['Mature cells', 'Released into the blood.']], q: 'hematopoiesis stem cell lineage' }),

  t('anaemia', 'Anaemia', 'Too little haemoglobin', 'micro',
    { bg: 'vessel', fit: [0, 0, 0, 2.4], actors: [FLOW(12, { color: '#d86a6a', s: 0.75 }), { k: 'plasma', n: 60, spread: [5, 2, 2], color: '#f2c97a' }] },
    'Anaemia means the blood carries less haemoglobin than normal, so tissues get less oxygen. People feel tired and breathless and may look pale.\n\nThe commonest cause worldwide is iron deficiency, from blood loss, pregnancy or too little iron in the diet; the red cells come out small and pale, as here. Other causes are lack of vitamin B12 or folate (large cells), chronic disease, kidney failure (too little erythropoietin) and inherited conditions such as thalassaemia and sickle cell disease.',
    [['rbc', 'Small, pale red cells', 'Typical of iron deficiency.'], ['wall', 'Vessel', 'Carries less oxygen per litre of blood.']],
    { facts: ['Anaemia affects around a quarter of the world’s population, most often young children and women.'], q: 'iron deficiency anaemia global burden' }),

  t('sickle-cell', 'Sickle cell disease', 'One letter, a bent cell', 'micro',
    { bg: 'vessel', fit: [0, 0, 0, 2.4], actors: [FLOW(16), { k: 'sickle', id: 'sickle', n: 18, spread: [4, 1.4, 1.4], s: 1.5 }, { k: 'sickle', id: 'block', at: [1.6, 0, 0], n: 8, spread: [0.3, 0.5, 0.5], s: 1.6, drift: 0.01 }] },
    'Sickle cell disease is caused by a single change in the beta-globin gene that swaps one amino acid in haemoglobin. When oxygen is low, the altered haemoglobin clumps into stiff rods that bend red cells into crescents.\n\nSickled cells are rigid and sticky. They block small vessels, causing painful crises and organ damage, and break down early, causing anaemia. Inheriting one copy of the gene (sickle trait) protects against severe malaria, which is why it is common where malaria is. Gene therapies have recently been approved.',
    [['sickle', 'Sickled cells', 'Stiff crescents.'], ['block', 'Blockage', 'Sickled cells jam in small vessels.'], ['rbc', 'Normal cells', 'Flexible discs.']],
    { facts: ['The mutation changes glutamic acid to valine at position 6 of beta-globin.'], q: 'sickle cell disease pathophysiology gene therapy', refs: ['kato2018'] }),

  t('leukaemia', 'Leukaemia', 'Cancer of the blood-forming cells', 'micro',
    { bg: 'vessel', fit: [0, 0, 0, 2.4], actors: [FLOW(14), { k: 'lymph', id: 'blast', n: 22, spread: [4.5, 1.5, 1.5], color: '#b88fd9', s: 0.9 }, { k: 'platelet', id: 'platelet', n: 3, spread: [4, 1.5, 1.5] }] },
    'In leukaemia, a blood-forming cell in the marrow acquires mutations that make it multiply without maturing. Its immature copies (blasts) crowd out normal blood production and spill into the blood.\n\nWith too few normal cells, people become anaemic, bruise and bleed easily, and catch infections. Leukaemias are classed as acute or chronic and as myeloid or lymphoid. Treatments include chemotherapy, targeted drugs, stem cell transplants and CAR-T cells; most children with the commonest childhood leukaemia are now cured.',
    [['blast', 'Leukaemic blasts', 'Immature cells that do not work as defenders.'], ['rbc', 'Fewer red cells', 'Causing anaemia.'], ['platelet', 'Few platelets', 'Causing bleeding.']],
    { q: 'acute lymphoblastic leukemia children survival' }),

  t('haemophilia', 'Haemophilia', 'When a clotting factor is missing', 'micro',
    { bg: 'void', actors: [{ k: 'fibrin', id: 'fibrin', at: [0, 0, 0], s: 1.2, o: [0, 0.3, 0.15] }, { k: 'rbc', id: 'rbc', n: 22, spread: [1.8, 1.4, 1.2] }, { k: 'platelet', id: 'platelet', n: 12, spread: [1.4, 1.2, 1.1], s: 1.5 }, { k: 'mol', id: 'factor', at: [0, 0, 0], n: 10, spread: 1.4, color: '#5ac8ff', o: [1, 1, 0] }] },
    'Haemophilia A and B are inherited lacks of clotting factor VIII or IX. Platelets can form a plug, but the cascade cannot make enough thrombin, so the fibrin net stays thin and bleeds go on for longer, especially into joints and muscles.\n\nThe genes are on the X chromosome, so it mostly affects males. Regular infusions of the missing factor, longer-lasting drugs that mimic it, and gene therapy now let most people lead normal lives.',
    [['factor', 'Missing factor', 'VIII in haemophilia A, IX in haemophilia B.'], ['fibrin', 'Weak fibrin net', 'Too little is made.'], ['platelet', 'Platelets', 'Work normally.']],
    { steps: [['Injury', 'Platelets gather.'], ['Weak cascade', 'Too little thrombin is made.'], ['Fragile clot', 'The bleed keeps oozing.']], q: 'hemophilia factor VIII gene therapy' }),

  t('malaria', 'Malaria in the blood', 'A parasite that lives inside red cells', 'micro',
    { bg: 'vessel', fit: [0, 0, 0, 2.4], actors: [FLOW(26), { k: 'parasite', id: 'parasite', at: [[-2.4, 1, 0.5], [-0.4, 0.3, 0.6], [0, 0, 0.6], [0.2, 0, 0.6]], n: 4, spread: 0.3, s: [0.6, 0.6, 0.4, 0.3], color: '#c98bd9' }, { k: 'rbc', id: 'infected', at: [0, 0, 0.6], s: [1.4, 1.4, 1.6, 0.01], color: '#a8506a', o: [1, 1, 1, 0] }, { k: 'parasite', at: [0, 0, 0.6], n: 16, spread: 0.6, s: [0.01, 0.01, 0.01, 0.4], color: '#c98bd9' }] },
    'Malaria is caused by Plasmodium parasites spread by Anopheles mosquitoes. After a stop in the liver, the parasites invade red blood cells, multiply inside them over about two days, then burst out together to infect more. The synchronised bursting causes the cycles of fever.\n\nP. falciparum, the most dangerous species, makes infected cells sticky so they cling to vessel walls, including in the brain. Bed nets, preventive drugs, artemisinin treatment and, recently, two vaccines are the main defences.',
    [['parasite', 'Merozoites', 'The form that invades red cells.'], ['infected', 'Infected red cell', 'Parasites multiply inside it.'], ['rbc', 'Uninfected red cells', 'Targets for the next round.']],
    { steps: [['Free', 'Merozoites released into the blood.'], ['Invade', 'Each enters a red cell.'], ['Multiply', 'It divides into 16–32 new parasites.'], ['Burst', 'The cell ruptures, releasing them.']], q: 'Plasmodium falciparum erythrocytic cycle malaria vaccine' }),

  t('oxygen-delivery', 'Oxygen delivery', 'From lung to muscle', 'micro',
    { bg: 'void', actors: [
      { k: 'rbc', id: 'rbc', at: [[-2.6, 0.6, 0], [-1, 0.5, 0], [1, -0.4, 0], [2.6, -0.6, 0]], n: 6, spread: 0.3, color: '#d0202a', s: 1.6 },
      { k: 'mol', id: 'oxygen', at: [[-2.6, 0.6, 0], [-1, 0.5, 0], [1.4, -0.9, 0], [2.4, -1.6, 0]], n: 16, spread: 0.6, color: '#ff6b5a', o: [0.5, 1, 1, 0.6] },
      { k: 'mol', id: 'co2', at: [[2.4, -1.6, 0], [1.4, -0.9, 0], [-1, 0.5, 0], [-2.4, 1.4, 0]], n: 10, spread: 0.6, color: '#c0c0c0', seed: 3 },
      { k: 'cell', id: 'muscle', at: [2.6, -1.8, 0], s: 1.4, color: '#b8443f', o: 0.8 }, { k: 'vesicle', id: 'alveolus', at: [-2.6, 1.5, 0], s: 3, o: 0.5 }] },
    'In the lungs, oxygen diffuses into red cells and binds haemoglobin. Blood leaving the lungs is about 98% saturated. In working tissue, where oxygen is low and acid and carbon dioxide are high, haemoglobin lets its oxygen go more easily (the Bohr effect), exactly where it is needed.\n\nCarbon dioxide travels back mostly dissolved as bicarbonate in plasma, with some carried on haemoglobin, and is breathed out.',
    [['alveolus', 'Lung', 'Oxygen enters the blood.'], ['rbc', 'Red cells', 'The carriers.'], ['oxygen', 'Oxygen', 'Bound to haemoglobin.'], ['muscle', 'Working muscle', 'Takes oxygen, gives off carbon dioxide.'], ['co2', 'Carbon dioxide', 'Returned to the lungs.']],
    { steps: [['Load', 'In the lungs.'], ['Travel', 'Through arteries.'], ['Unload', 'In the tissues.'], ['Return', 'Carbon dioxide goes back to the lungs.']], q: 'oxygen hemoglobin dissociation Bohr effect' }),

  t('sepsis', 'Sepsis', 'When the response to infection harms the body', 'micro',
    { bg: 'vessel', fit: [0, 0, 0, 2.4], actors: [FLOW(16), { k: 'rod', id: 'bacteria', n: 18, spread: [4, 1.5, 1.5], s: 0.6 }, { k: 'neutrophil', id: 'neutrophil', n: 6, spread: [4, 1.3, 1.3], s: 0.7 }, { k: 'mol', id: 'cytokines', n: 60, spread: [4.5, 1.8, 1.8], color: '#ff5a5a', s: 0.6, drift: 0.3 }] },
    'Sepsis happens when the body’s response to an infection spirals out of control and starts to damage its own organs. A flood of inflammatory signals (cytokines) makes blood vessels leaky and widened, blood pressure falls, small clots form, and organs such as the kidneys, lungs and brain begin to fail.\n\nIt is a medical emergency: antibiotics, fluids and support for failing organs given early save lives. Warning signs include fever or low temperature, fast breathing, a racing heart, confusion and mottled skin.',
    [['bacteria', 'Bacteria in the blood', 'Or other microbes.'], ['cytokines', 'Cytokine storm', 'Signals that amplify inflammation.'], ['neutrophil', 'Neutrophils', 'Overactivated.'], ['wall', 'Leaky vessels', 'Fluid escapes into tissues.']],
    { q: 'sepsis definition pathophysiology Sepsis-3', refs: ['singer2016'] }),
];
