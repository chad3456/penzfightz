import type { Topic } from '../types';
import { chapter, ctl } from './make';

const t = chapter('digest');
const F: [number, number, number] = [0.2, 0.15, 1];

export const DIGEST: Topic[] = [
  t('food-journey', 'The journey of a meal', 'Nine metres from mouth to exit', 'organ', { mode: 'gut', still: true },
    'The digestive tract is one long tube, about 9 metres from mouth to anus, with helper organs along the way. Food is chewed and mixed with saliva, swallowed, churned with acid in the stomach, broken down by enzymes from the pancreas and bile from the liver in the small intestine, where nutrients are absorbed, and finally the remains lose their water in the large intestine.\n\nThe whole trip usually takes one to three days, most of it in the large intestine. Step through to follow the meal.',
    [['mouth', 'Mouth', 'Teeth break food up; saliva starts digesting starch.'], ['esophagus', 'Oesophagus', 'Waves of muscle (peristalsis) push food down in about 8 seconds.'], ['stomach', 'Stomach', 'Acid and enzymes turn food into a paste (chyme) over 2–4 hours.'], ['small', 'Small intestine', 'About 6 m long; most digestion and absorption happens here.'], ['large', 'Large intestine', 'Absorbs water and salts; home to trillions of bacteria.'], ['rectum', 'Rectum', 'Stores waste until it is passed.'], ['liver', 'Liver', 'Makes bile.'], ['pancreas', 'Pancreas', 'Makes most digestive enzymes.'], ['gallbladder', 'Gallbladder', 'Stores and concentrates bile.']],
    { view: F, steps: [['Mouth', 'Chewing and saliva.'], ['Swallow', 'Down the oesophagus.'], ['Stomach', 'Churning and acid.'], ['Small intestine', 'Enzymes and absorption.'], ['Large intestine', 'Water reclaimed, fibre fermented.'], ['Exit', 'Stored and passed.']], q: 'gastrointestinal transit time physiology' }),

  t('teeth', 'Inside a tooth', 'Enamel, dentin and pulp', 'organ', { mode: 'tooth', still: true },
    'A tooth is built in layers. Enamel, the hardest substance in the body, covers the crown. Beneath it is dentin, a softer, living bone-like tissue with tiny tubes that can carry sensations. At the centre, the pulp holds nerves and blood vessels, which enter through the root canals.\n\nRoots are anchored in the jawbone by a ligament that acts as a shock absorber. Adults have 32 teeth, including the wisdom teeth.',
    [['enamel', 'Enamel', 'About 96% mineral; it cannot regrow.'], ['dentin', 'Dentin', 'Makes up most of the tooth.'], ['pulp', 'Pulp', 'Nerves and blood vessels.'], ['nerve', 'Root canal', 'Carries the nerve and vessels.'], ['gum', 'Gum', 'Seals round the tooth.'], ['bone', 'Jawbone', 'Holds the root.']],
    { view: [0.4, 0.15, 1], q: 'tooth structure enamel dentin pulp' }),

  t('tooth-decay', 'Tooth decay', 'Acid, sugar and bacteria', 'organ', { mode: 'tooth', cavity: true, still: true },
    'Bacteria in dental plaque, especially Streptococcus mutans, feed on sugars and produce acid. Each sugary snack drops the pH on the tooth surface for about half an hour, dissolving minerals from the enamel. Saliva and fluoride help repair early damage, but if acid attacks are too frequent, a hole (cavity) forms.\n\nOnce decay reaches the dentin it spreads faster, and if it reaches the pulp, infection and toothache follow. Fluoride toothpaste, less frequent sugar, and fissure sealants prevent most decay.',
    [['cavity', 'Cavity', 'Here in a groove on the biting surface, a common site.'], ['enamel', 'Enamel', 'Dissolved by acid.'], ['dentin', 'Dentin', 'Decays faster.'], ['pulp', 'Pulp', 'Becomes inflamed if decay reaches it.']],
    { view: [0.4, 0.4, 1], q: 'dental caries pathogenesis fluoride' }),

  t('stomach', 'The stomach', 'A muscular bag of acid', 'organ', { mode: 'stomach', still: true },
    'The stomach stretches to hold about a litre and a half of food. Its lining makes hydrochloric acid strong enough to kill most microbes and an enzyme, pepsin, that starts breaking down protein. Three layers of muscle churn the contents into a thick liquid called chyme.\n\nIt does not digest itself because the lining is protected by a thick layer of mucus and bicarbonate and replaces its surface cells every few days. The pyloric sphincter lets chyme into the small intestine a little at a time.',
    [['esophagus', 'Oesophagus', 'Food enters here.'], ['fundus', 'Fundus', 'The upper dome, often holding swallowed air.'], ['body', 'Body', 'The main mixing chamber.'], ['pylorus', 'Pylorus', 'The outlet valve.'], ['rugae', 'Rugae', 'Folds that flatten as the stomach fills.'], ['acid', 'Gastric acid', 'pH about 1.5 to 3.5.']],
    { view: F, controls: [ctl('ph', 'Acidity (pH)', 1, 6, 2, 0.5)], q: 'gastric acid secretion mucosal protection' }),

  t('ulcer', 'Stomach ulcers', 'The bacterium that changed medicine', 'organ', { mode: 'stomach', ulcer: true, hpylori: true, still: true },
    'For decades ulcers were blamed on stress and spicy food. In the early 1980s Barry Marshall and Robin Warren showed that most are caused by a spiral bacterium, Helicobacter pylori, which survives stomach acid by burrowing into the mucus and neutralising acid around itself. Marshall famously drank a culture of it to prove the point. They won the 2005 Nobel Prize.\n\nThe other main cause is anti-inflammatory painkillers such as ibuprofen. H. pylori infection is cured with a short course of antibiotics plus acid-reducing drugs.',
    [['ulcer', 'Ulcer', 'A crater through the lining.'], ['hpylori', 'Helicobacter pylori', 'Lives in the mucus layer; infects about half the world’s people.'], ['rugae', 'Stomach lining', 'Inflamed around the ulcer.']],
    { view: F, q: 'Helicobacter pylori peptic ulcer discovery eradication' }),

  t('villi', 'Villi of the small intestine', 'A huge surface for absorption', 'organ', { mode: 'villi', still: true },
    'The lining of the small intestine is covered in villi, finger-like projections about a millimetre long, and each villus is covered in cells with their own microscopic projections (microvilli). Together with the large circular folds of the wall, they give an absorbing surface of around 30 square metres.\n\nInside each villus, a capillary loop collects sugars and amino acids, and a lymph vessel called a lacteal takes up fats.',
    [['villus', 'Villus', 'Lined with absorptive cells renewed every 3 to 5 days.'], ['capillary', 'Capillary loop', 'Carries nutrients to the liver.'], ['lacteal', 'Lacteal', 'Carries fats into the lymph.'], ['submucosa', 'Submucosa', 'Blood vessels and nerves.'], ['muscle', 'Muscle layers', 'Move food along.']],
    { view: [0.3, 0.45, 1], q: 'small intestine villi absorption surface area', refs: ['helander2014'] }),

  t('coeliac', 'Coeliac disease', 'Gluten and flattened villi', 'organ', { mode: 'villi', celiac: true, still: true },
    'In coeliac disease, an immune reaction to gluten, a protein in wheat, barley and rye, inflames the small intestine and wears the villi down until the lining is almost flat. With far less surface, nutrients are poorly absorbed, causing diarrhoea, weight loss, anaemia and tiredness.\n\nIt affects about 1 in 100 people and is diagnosed by blood tests and a biopsy. On a strict gluten-free diet the villi grow back.',
    [['villus', 'Flattened villi', 'Villous atrophy.'], ['submucosa', 'Inflamed lining', 'Full of immune cells.'], ['capillary', 'Capillaries', 'Less surface to absorb into.']],
    { view: [0.3, 0.45, 1], q: 'coeliac disease villous atrophy gluten' }),

  t('liver', 'The liver', 'The body’s chemical factory', 'organ', { mode: 'liver', still: true },
    'The liver is the largest internal organ, weighing about 1.5 kg. It receives blood from two sources: oxygen-rich blood from the hepatic artery, and nutrient-rich blood straight from the gut through the portal vein.\n\nIt carries out hundreds of jobs: storing sugar as glycogen and releasing it between meals, making blood proteins and clotting factors, processing fats and cholesterol, breaking down drugs, alcohol and toxins, recycling old red cells, and making bile. It can regrow from as little as a quarter of its mass.',
    [['right', 'Right lobe', 'The larger lobe.'], ['left', 'Left lobe', 'The smaller lobe.'], ['portal', 'Portal vein', 'Brings about 75% of its blood, from the gut.'], ['artery', 'Hepatic artery', 'Brings oxygen-rich blood.'], ['duct', 'Bile duct', 'Carries bile to the intestine.'], ['gallbladder', 'Gallbladder', 'Stores bile.'], ['ivc', 'Inferior vena cava', 'Blood leaves through the hepatic veins into it.']],
    { view: F, q: 'liver function regeneration portal circulation' }),

  t('liver-lobule', 'The liver lobule', 'A hexagon of liver cells', 'organ', { mode: 'lobule', still: true },
    'Under the microscope the liver is made of tiny hexagonal units called lobules. At each corner sits a portal triad: a branch of the portal vein, a branch of the hepatic artery and a bile duct. Blood from both flows inward through channels (sinusoids) between plates of liver cells to a central vein.\n\nAs blood seeps past, the liver cells (hepatocytes) take up nutrients and toxins and release their products, while bile flows the opposite way, out to the ducts.',
    [['triad', 'Portal triad', 'Vein, artery and bile duct.'], ['hepatocyte', 'Hepatocyte plates', 'One or two cells thick.'], ['sinusoid', 'Sinusoids', 'Leaky capillaries lined with immune cells.'], ['central', 'Central vein', 'Drains the lobule.']],
    { view: [0, 1, 0.4], q: 'hepatic lobule structure zonation' }),

  t('fatty-liver', 'Fatty liver disease', 'The commonest liver disease', 'organ', { mode: 'liver', fatty: true, still: true },
    'When more fat arrives in the liver than it can burn or export, droplets build up inside liver cells. Metabolic dysfunction-associated fatty liver disease, linked to excess weight, type 2 diabetes and high blood fats, now affects about a third of adults worldwide; alcohol causes a similar picture.\n\nIn some people the fat triggers inflammation that can lead to scarring and cirrhosis. Losing weight, through diet and exercise, can reverse it, and the first drugs for its inflamed form have recently been approved.',
    [['right', 'Fat-laden liver', 'Paler and enlarged.'], ['left', 'Left lobe', 'Also affected.'], ['portal', 'Portal vein', 'Delivers fats and sugars from the gut.']],
    { view: F, q: 'MASLD prevalence nonalcoholic fatty liver disease' }),

  t('cirrhosis', 'Cirrhosis', 'A liver scarred into nodules', 'organ', { mode: 'liver', cirrhosis: true, still: true },
    'Cirrhosis is the end stage of long-term liver injury from alcohol, viral hepatitis or fatty liver disease. Repeated damage and repair lay down bands of scar tissue, and surviving cells regrow in lumps (nodules), giving the liver a knobbly surface.\n\nScarring blocks blood flow through the liver, raising pressure in the portal vein, which can cause fluid in the abdomen and bleeding veins in the oesophagus. The liver gradually loses its ability to do its jobs. Treating the cause can halt it; a transplant may be needed.',
    [['right', 'Nodular liver', 'Shrunken and firm.'], ['portal', 'Portal vein', 'Pressure rises (portal hypertension).'], ['ivc', 'Vena cava', 'Returns blood to the heart.']],
    { view: F, q: 'cirrhosis fibrosis portal hypertension review' }),

  t('gallstones', 'Bile and gallstones', 'Breaking up fat', 'organ', { mode: 'liver', still: true },
    'The liver makes about half a litre of bile a day. Between meals it is stored and concentrated in the gallbladder; after a fatty meal the gallbladder squeezes it into the small intestine, where bile salts break fat into tiny droplets that enzymes can reach, rather like washing-up liquid.\n\nIf bile has too much cholesterol it can crystallise into gallstones. Most cause no trouble, but a stone stuck in a duct causes severe pain and sometimes infection; the gallbladder can be removed with keyhole surgery.',
    [['gallbladder', 'Gallbladder', 'Holds about 50 ml.'], ['duct', 'Bile duct', 'Stones can lodge here.'], ['right', 'Liver', 'Makes the bile.']],
    { view: [0.3, -0.2, 1], q: 'gallstone pathogenesis cholesterol bile' }),

  t('pancreas-enzymes', 'The pancreas', 'Enzymes and hormones', 'organ', { mode: 'gut', still: true },
    'The pancreas lies behind the stomach and has two jobs. Most of it makes digestive juice, about 1.5 litres a day, containing enzymes for protein, fat and starch, plus bicarbonate to neutralise stomach acid; it flows into the duodenum.\n\nScattered through it are about a million islets of Langerhans, which release insulin and glucagon into the blood to control blood sugar.',
    [['pancreas', 'Pancreas', 'About 15 cm long.'], ['small', 'Duodenum', 'Receives pancreatic juice and bile.'], ['stomach', 'Stomach', 'Lies in front of it.'], ['gallbladder', 'Gallbladder', 'Its duct joins the pancreatic duct.']],
    { view: F, q: 'exocrine pancreas digestive enzymes' }),

  t('islets', 'Islets of Langerhans', 'Where insulin is made', 'organ', { mode: 'islet', still: true },
    'An islet is a cluster of a few thousand hormone-making cells. Beta cells make insulin, which lowers blood sugar; alpha cells make glucagon, which raises it; delta cells make somatostatin, which damps both. They sense blood sugar directly and respond within minutes.\n\nSurrounding them are the acinar cells that make digestive enzymes. Step on to see insulin released.',
    [['beta', 'Beta cells', 'Most of the islet.'], ['alpha', 'Alpha cells', 'Glucagon.'], ['delta', 'Delta cells', 'Somatostatin.'], ['acinar', 'Acinar cells', 'Digestive enzymes.'], ['insulin', 'Insulin', 'Released into capillaries.']],
    { view: [0.2, 0.2, 1], steps: [['Fasting', 'Little insulin released.'], ['After a meal', 'Rising glucose triggers insulin release.']], q: 'pancreatic islet beta cell insulin secretion' }),

  t('large-intestine', 'The large intestine', 'Water, fibre and the microbiome', 'organ', { mode: 'colon', still: true },
    'The large intestine, about 1.5 metres long, reclaims water and salts from what is left after the small intestine, turning liquid into stool. Its wall is gathered into pouches called haustra.\n\nIt is home to the densest community of microbes on Earth. They ferment fibre the body cannot digest, producing short-chain fatty acids that feed the colon’s lining, and they make vitamins K and some B vitamins.',
    [['wall', 'Colon wall', 'Absorbs about 1.5 litres of water a day.'], ['haustra', 'Haustra', 'Pouches that churn contents slowly.'], ['microbiome', 'Gut bacteria', 'Roughly as many bacterial cells as human cells in the body.']],
    { view: F, q: 'colon physiology short chain fatty acids' }),

  t('microbiome', 'The gut microbiome', 'Trillions of tenants', 'micro',
    { bg: 'lumen', fit: [0, 0, 0, 2.2], actors: [
      { k: 'rod', id: 'bacteroides', n: 40, spread: [4, 1.3, 1.3], s: 0.5, color: '#7fc98a' }, { k: 'coccus', id: 'firmicutes', n: 25, spread: [4, 1.3, 1.3], s: 0.6, color: '#e0b84f', seed: 4 },
      { k: 'spiral', id: 'other', n: 10, spread: [4, 1.3, 1.3], s: 0.6, seed: 6 }, { k: 'mol', id: 'scfa', n: 60, spread: [4, 1.5, 1.5], color: '#7fe0ff', s: 0.6 }] },
    'Hundreds of species of bacteria, along with viruses, fungi and archaea, live in the gut, most of them in the colon. Together they weigh a few hundred grams and carry far more genes than our own genome.\n\nThey digest fibre into short-chain fatty acids, train the immune system, compete with harmful microbes and make vitamins. Antibiotics, diet and illness shift the community. Links to obesity, allergies and mood are active areas of research, though cause and effect are often unclear.',
    [['bacteroides', 'Bacteroidetes', 'Rod-shaped fibre digesters.'], ['firmicutes', 'Firmicutes', 'Another dominant group.'], ['other', 'Other microbes', 'Many still unnamed.'], ['scfa', 'Short-chain fatty acids', 'Butyrate, acetate and propionate.'], ['wall', 'Gut wall', 'Covered in protective mucus.']],
    { facts: ['A revised estimate puts the bacteria in a person at about 38 trillion, similar to the number of human cells.'], q: 'human gut microbiome function review', refs: ['sender2016'] }),

  t('ibd', 'Inflammatory bowel disease', 'Crohn’s disease and ulcerative colitis', 'organ', { mode: 'colon', ibd: true, still: true },
    'In inflammatory bowel disease, the immune system keeps attacking the lining of the gut. Ulcerative colitis affects the colon in a continuous stretch from the rectum; Crohn’s disease can affect any part of the gut in patches and go through the whole wall.\n\nSymptoms include diarrhoea, bleeding, pain and weight loss, often in flares. Causes involve genes, the microbiome and the environment. Treatments that dampen specific parts of the immune response have greatly improved care.',
    [['inflamed', 'Inflamed, ulcerated lining', 'Red and raw.'], ['wall', 'Colon wall', 'Can thicken and narrow.'], ['haustra', 'Lost folds', 'Long-standing colitis smooths them out.']],
    { view: F, q: 'inflammatory bowel disease Crohn ulcerative colitis pathogenesis' }),

  t('reflux', 'Heartburn and reflux', 'Acid where it should not be', 'organ', { mode: 'stomach', still: true },
    'A ring of muscle at the bottom of the oesophagus normally stops stomach acid washing back up. If it relaxes at the wrong times, or if part of the stomach slides up through the diaphragm (a hiatus hernia), acid irritates the oesophagus, causing a burning feeling behind the breastbone.\n\nLarge meals, lying down after eating, excess weight and smoking make it worse. Antacids and acid-reducing drugs help; long-term reflux can change the lining (Barrett’s oesophagus), which is monitored because of a small cancer risk.',
    [['esophagus', 'Lower oesophagus', 'Its lining is not built to resist acid.'], ['fundus', 'Top of the stomach', 'Can slide upward in a hiatus hernia.'], ['acid', 'Acid', 'Washes upward.']],
    { view: F, controls: [ctl('ph', 'Acidity (pH)', 1, 6, 2, 0.5)], q: 'gastroesophageal reflux disease pathophysiology' }),

  t('enzymes-digest', 'How enzymes digest food', 'Cutting big molecules into small ones', 'micro',
    { bg: 'void', actors: [
      { k: 'helix', id: 'starch', at: [[-1.2, 0.6, 0], [-1, 0.5, 0], [-0.8, 0.4, 0]], s: [2, 2, 0.01], color: '#f2e2a8', o: [1, 1, 0] },
      { k: 'ribosome', id: 'enzyme', at: [[-2.4, -0.6, 0], [-1, 0.2, 0.3], [0, -0.4, 0.3]], s: 2, color: '#5ab8a0' },
      { k: 'mol', id: 'glucose', at: [[-0.8, 0.4, 0], [-0.8, 0.4, 0], [1.2, 0.2, 0]], n: 18, spread: [0.3, 1, 0.3], color: '#f2e2a8', o: [0, 0, 1], s: 1.2 }] },
    'Food is made of large molecules: starch is a chain of thousands of glucose units, proteins are chains of amino acids, fats are three fatty acids hung on glycerol. They are too big to be absorbed, so digestive enzymes cut them into small pieces.\n\nEach enzyme has an active site that fits a particular kind of bond. Amylase in saliva and pancreatic juice cuts starch, proteases such as pepsin and trypsin cut proteins, lipases cut fats.',
    [['starch', 'Starch', 'A long chain of glucose.'], ['enzyme', 'Amylase', 'An enzyme that cuts the links between glucose units.'], ['glucose', 'Sugars', 'Small enough to be absorbed.']],
    { steps: [['Food', 'A large starch molecule.'], ['Enzyme binds', 'Amylase grips the chain.'], ['Cut', 'Small sugars are released for absorption.']], q: 'digestive enzymes amylase protease lipase' }),
];
