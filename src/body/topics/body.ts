import type { Topic } from '../types';
import { chapter } from './make';

const t = chapter('body');
const F: [number, number, number] = [0.15, 0.08, 1];

export const BODY: Topic[] = [
  t('body-map', 'The human body', 'Everything at once', 'body', { show: ['all'], still: true },
    'This is the body with all its systems showing through glass skin: the skeleton that holds it up, the organs packed into chest and abdomen, arteries and veins reaching every part, the brain and nerves, and the lymph nodes of the immune system.\n\nEvery system depends on the others. The lungs bring in oxygen, the heart and blood deliver it, the gut supplies fuel, the kidneys and liver clear waste, hormones and nerves coordinate everything, and the immune system defends it. Tap any numbered part, then explore each system in its own chapter.',
    [['brain', 'Brain', 'About 2% of body weight, 20% of its energy.'], ['heart', 'Heart', 'Beats about 100,000 times a day.'], ['lungs', 'Lungs', 'About 480 million alveoli.'], ['liver', 'Liver', 'The largest internal organ.'], ['stomach', 'Stomach', 'Holds and churns food with acid.'], ['kidneys', 'Kidneys', 'Filter about 180 litres of plasma a day.'], ['intestine', 'Small intestine', 'About 6 metres long.'], ['skull', 'Skeleton', '206 bones.'], ['aorta', 'Aorta', 'The body’s main artery.'], ['cord', 'Spinal cord', 'Carries signals between brain and body.'], ['nodes', 'Lymph nodes', 'Filters lymph; swells in infection.']],
    { view: F, facts: ['The body has about 30 trillion human cells and a similar number of bacteria.', 'An adult is about 60% water.'], q: 'human anatomy organ systems overview', refs: ['sender2016'] }),

  t('organ-systems', 'Organ systems', 'Eleven systems working together', 'body', { show: ['organs'], still: true },
    'Biologists group the body’s organs into systems by what they do together: circulatory, respiratory, digestive, urinary, nervous, endocrine, immune and lymphatic, skeletal, muscular, integumentary (skin) and reproductive.\n\nThe boundaries are fuzzy: the pancreas is both digestive and endocrine, the liver belongs to several systems, and bone marrow is skeletal and immune at once. Here the main organs of the chest and abdomen are shown.',
    [['heart', 'Heart', 'Circulatory.'], ['lungs', 'Lungs', 'Respiratory.'], ['liver', 'Liver', 'Digestive and metabolic.'], ['stomach', 'Stomach', 'Digestive.'], ['spleen', 'Spleen', 'Immune.'], ['pancreas', 'Pancreas', 'Digestive and endocrine.'], ['kidneys', 'Kidneys', 'Urinary.'], ['colon', 'Large intestine', 'Digestive.'], ['bladder', 'Bladder', 'Urinary.'], ['brain', 'Brain', 'Nervous.']],
    { view: F, q: 'organ systems integration physiology' }),

  t('circulatory-system', 'The circulatory system', 'A closed loop of tubes and a pump', 'body', { show: ['circulation'], pulse: true, still: true },
    'The heart pumps about 5 litres of blood a minute through arteries that branch down to capillaries in every tissue and back through veins. Arteries are drawn red and veins blue by convention.\n\nThe loop carries oxygen, nutrients, hormones, immune cells and heat, and takes away carbon dioxide and waste. It was William Harvey who showed in 1628 that the blood circulates, rather than being made fresh by the liver as had been believed.',
    [['aorta', 'Aorta', 'Leaves the heart, arches over and runs down the back of the abdomen.'], ['arteries', 'Arteries', 'Carry blood away from the heart.'], ['veins', 'Veins', 'Return blood to the heart.'], ['heart', 'Heart', 'The pump at the centre.']],
    { view: F, q: 'cardiovascular system overview Harvey circulation' }),

  t('respiratory-system', 'The respiratory system', 'Air in, carbon dioxide out', 'body', { show: ['respiratory', 'organs'], still: true },
    'Air enters through the nose and mouth, is warmed and filtered, passes the voice box and travels down the trachea into the lungs. There oxygen crosses into the blood and carbon dioxide leaves it.\n\nThe brainstem sets the rhythm of breathing, adjusting it mainly to the level of carbon dioxide in the blood rather than oxygen, which is why holding your breath becomes uncomfortable as carbon dioxide builds up.',
    [['trachea', 'Trachea', 'The windpipe.'], ['lungs', 'Lungs', 'Where gas exchange happens.'], ['heart', 'Heart', 'Pumps blood through the lungs.']],
    { view: F, q: 'respiratory system control of breathing CO2' }),

  t('digestive-system', 'The digestive system', 'The tube and its helpers', 'body', { show: ['digestive'], still: true },
    'The digestive tract runs from the mouth to the anus: oesophagus, stomach, small intestine and large intestine. The liver, gallbladder and pancreas pour bile and enzymes into it.\n\nIts lining is the largest surface the body presents to the outside world, and it holds about 70% of the body’s immune cells. The gut also has its own nervous system of around half a billion neurons that can run digestion on its own.',
    [['esophagus', 'Oesophagus', 'Carries swallowed food to the stomach.'], ['stomach', 'Stomach', 'Holds and churns food with acid.'], ['liver', 'Liver', 'Processes nutrients and makes bile.'], ['pancreas', 'Pancreas', 'Makes enzymes and insulin.'], ['intestine', 'Small intestine', 'Digests and absorbs food.'], ['colon', 'Large intestine', 'Reclaims water.']],
    { view: F, q: 'enteric nervous system gut immune' }),

  t('skin-organ', 'Skin as an organ', 'The body’s boundary', 'body', { show: ['skin'], still: true },
    'Skin is the largest organ, covering about 1.8 square metres and weighing around 4 kilograms. It is a barrier against water loss, microbes, chemicals and UV light; a temperature regulator; a sense organ; and a factory for vitamin D.\n\nIt renews itself constantly: you shed tens of thousands of skin cells every minute, and the outer layer is replaced roughly every month.',
    [['skin', 'Skin', 'A barrier, radiator and sense organ.']],
    { view: F, q: 'skin barrier function thermoregulation' }),

  t('homeostasis', 'Homeostasis', 'Keeping conditions steady', 'body', { show: ['all'], still: true },
    'The body keeps many things within narrow limits: core temperature around 37 °C, blood sugar, blood pH near 7.4, salt and water balance, blood pressure, oxygen and carbon dioxide levels. This stability is called homeostasis.\n\nMost of it works by negative feedback: a sensor detects a change, a control centre (often the hypothalamus or brainstem) responds, and effectors push the value back. Many diseases are failures of a feedback loop.',
    [['brain', 'Hypothalamus and brainstem', 'Main control centres.'], ['kidneys', 'Kidneys', 'Balance water, salt and acid.'], ['lungs', 'Lungs', 'Adjust carbon dioxide and so pH.'], ['pancreas', 'Pancreas', 'Balances blood sugar.'], ['skull', 'Skeleton', 'Stores calcium.']],
    { view: F, q: 'homeostasis negative feedback physiology' }),

  t('temperature', 'Body temperature', 'Staying at 37 °C', 'body', { show: ['circulation', 'skin'], pulse: true, still: true },
    'Core temperature is held near 37 °C by a thermostat in the hypothalamus. When too warm, blood vessels in the skin widen to shed heat and sweat glands release sweat, which cools as it evaporates. When too cold, skin vessels narrow, we shiver to make heat, and we instinctively seek warmth.\n\nIn a fever, immune signals reset the thermostat higher, so we feel cold and shiver even as temperature rises. Heat stroke is when the cooling system is overwhelmed.',
    [['skin', 'Skin', 'The main radiator.'], ['arteries', 'Skin blood vessels', 'Widen or narrow.'], ['heart', 'Heart', 'Pumps more blood to the skin when hot.']],
    { view: F, q: 'thermoregulation hypothalamus fever' }),

  t('exercise-body', 'The body in exercise', 'Everything ramps up', 'body', { show: ['circulation', 'respiratory', 'muscles'], pulse: true, still: true },
    'During hard exercise, muscles can use around 20 times more oxygen than at rest. The heart’s output rises four- to five-fold, breathing increases from about 6 to over 100 litres a minute, and blood is diverted from the gut and kidneys to the muscles and skin.\n\nRegular exercise strengthens the heart, lowers blood pressure, improves insulin sensitivity, builds bone and muscle and is linked to lower risks of heart disease, diabetes, some cancers, depression and dementia.',
    [['muscles', 'Muscles', 'The main consumers.'], ['heart', 'Heart', 'Pumps up to 25 litres a minute.'], ['lungs', 'Lungs', 'Where gas exchange happens.'], ['arteries', 'Arteries', 'Redirect flow.']],
    { view: F, q: 'physiological responses to exercise health benefits' }),

  t('body-numbers', 'The body by numbers', 'Some surprising figures', 'body', { show: ['all'], still: true },
    'About 30 trillion cells, mostly red blood cells; about 38 trillion bacteria; around 20,000 protein-coding genes; 86 billion neurons; 100 trillion synapses; 206 bones; about 600 skeletal muscles; 5 litres of blood; some 100,000 kilometres of blood vessels.\n\nYou replace your gut lining every few days, your red cells every four months and your skeleton about every ten years, but most of the neurons in your cerebral cortex are as old as you are.',
    [['brain', 'Brain', '86 billion neurons.'], ['heart', 'Heart', 'About 2.5 billion beats in a lifetime.'], ['skull', 'Skeleton', '206 bones.'], ['intestine', 'Gut', 'Home to most of your bacteria.']],
    { view: F, q: 'human body cell number estimate', refs: ['sender2016', 'azevedo2009'] }),
];
