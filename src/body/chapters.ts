import type { Chapter } from './types';

export const CHAPTERS: Chapter[] = [
  { id: 'body', title: 'The Whole Body', blurb: 'The eleven organ systems, where everything sits and how it fits together.', color: '#e0a36b', icon: '◍' },
  { id: 'heart', title: 'Heart', blurb: 'Four chambers, four valves, an electrical system of its own, and what goes wrong.', color: '#e0474c', icon: '♥' },
  { id: 'vessels', title: 'Blood Vessels', blurb: 'Arteries, veins and capillaries: walls, pressure, plaque, clots and repair.', color: '#d1363a', icon: '⟟' },
  { id: 'blood', title: 'Blood', blurb: 'Red cells, white cells, platelets, plasma, clotting and blood disorders.', color: '#b3141c', icon: '●' },
  { id: 'brain', title: 'Brain', blurb: 'Lobes, deep structures, ventricles, and the diseases that change them.', color: '#c98bd9', icon: '❋' },
  { id: 'nerves', title: 'Neurons & Nerves', blurb: 'Signals, synapses, transmitters, reflexes and the spinal cord.', color: '#f2d16b', icon: '⌁' },
  { id: 'lungs', title: 'Lungs & Breathing', blurb: 'The airway tree, alveoli, gas exchange and lung disease.', color: '#f08fa0', icon: '⧖' },
  { id: 'digest', title: 'Digestion & Liver', blurb: 'From mouth to colon: enzymes, villi, the liver, the microbiome.', color: '#e5a14a', icon: '⟆' },
  { id: 'kidney', title: 'Kidneys & Urinary Tract', blurb: 'A million nephrons filtering your blood about forty times a day.', color: '#b9603f', icon: '◖' },
  { id: 'immune', title: 'Immune System', blurb: 'Innate and adaptive defences, antibodies, T cells, vaccines and allergy.', color: '#5ab8a0', icon: '⛨' },
  { id: 'viruses', title: 'Viruses', blurb: 'The shapes of thirty viruses and how they enter, copy and escape cells.', color: '#9ad04f', icon: '✺' },
  { id: 'bacteria', title: 'Bacteria & Microbes', blurb: 'Cell walls, flagella, toxins, biofilms, antibiotics and resistance.', color: '#7fc98a', icon: '⬭' },
  { id: 'cancer', title: 'Cancer', blurb: 'How a cell turns, how tumours grow and spread, and how they are treated.', color: '#c44f9e', icon: '✸' },
  { id: 'cells', title: 'The Cell', blurb: 'Organelles, membranes, transport, division and cell death.', color: '#6fa8dc', icon: '◉' },
  { id: 'genes', title: 'DNA & Genes', blurb: 'The helix, copying, reading, editing and inheriting.', color: '#4fb3d9', icon: '⧚' },
  { id: 'bones', title: 'Bones, Joints & Muscle', blurb: 'Living bone, cartilage, the sarcomere and how we move.', color: '#e8dcc0', icon: '⟂' },
  { id: 'senses', title: 'Senses & Skin', blurb: 'The eye, the ear, smell, taste, touch, and the skin that holds it all.', color: '#7fd0e0', icon: '◎' },
  { id: 'hormones', title: 'Hormones', blurb: 'Glands, messengers and feedback loops: insulin, thyroid, stress and sleep.', color: '#f2a23a', icon: '⬡' },
];
export const CHAPTER = Object.fromEntries(CHAPTERS.map((c) => [c.id, c])) as Record<Chapter['id'], Chapter>;
