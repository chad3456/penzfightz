import type { Topic } from '../types';
export const TEST: Topic[] = [
  { id: 'blood-cells', ch: 'blood', title: 'Blood test', sub: 't', kind: 'micro', body: 'x', p: { bg: 'vessel', fit: [0, 0, 0, 2.4], actors: [
    { k: 'rbc', n: 40, spread: [5, 1.8, 1.8], id: 'rbc' }, { k: 'neutrophil', at: [0.5, 0.2, 0.6], id: 'wbc' }, { k: 'lymph', at: [-1.2, -0.6, 0.4], id: 'lymph' }, { k: 'platelet', n: 12, spread: [4, 1.5, 1.5], id: 'platelet' }, { k: 'plasma', n: 80, spread: [5, 2, 2], color: '#f2c97a' } ] },
    parts: [{ id: 'rbc', label: 'Red cell', text: '' }, { id: 'wbc', label: 'Neutrophil', text: '' }, { id: 'lymph', label: 'Lymphocyte', text: '' }, { id: 'platelet', label: 'Platelets', text: '' }] },
  { id: 'tcell-kill', ch: 'immune', title: 'T cell kill test', sub: 't', kind: 'micro', body: 'x', p: { bg: 'tissue', actors: [
    { k: 'lymph', id: 'tcell', at: [[-2.5, 0, 0], [-0.95, 0, 0], [-0.9, 0, 0], [-2, 0.3, 0]], s: 1.2 },
    { k: 'cancer', id: 'cancer', at: [0.6, 0, 0], s: [1.3, 1.3, 1.1, 0.5], o: [1, 1, 0.8, 0.2], glow: [0, 0, 0.4, 0] },
    { k: 'mol', id: 'perforin', at: [[-0.5, 0, 0], [-0.5, 0, 0], [0.0, 0, 0], [0.3, 0, 0]], n: 14, spread: 0.25, o: [0, 0, 1, 0], color: '#ff8a5c' },
    { k: 'fragment', at: [0.6, 0, 0], n: 10, spread: 0.9, o: [0, 0, 0, 1], color: '#b06a96' },
    { k: 'arrow', path: [[-2.4, 0.9, 0], [-1.7, 1.2, 0], [-1.0, 0.9, 0]], o: [1, 0, 0, 0] } ] },
    parts: [{ id: 'tcell', label: 'T cell', text: '' }, { id: 'cancer', label: 'Cancer cell', text: '' }, { id: 'perforin', label: 'Perforin', text: '' }],
    steps: [{ label: 'Search', text: '' }, { label: 'Contact', text: '' }, { label: 'Kill', text: '' }, { label: 'Move on', text: '' }] },
];
