import type { Topic } from '../types';
export const TEST: Topic[] = [
  { id: 'n1', ch: 'nerves', title: 'neuron', sub: 't', kind: 'neuron', body: 'x', p: { still: true }, view: [0, 0.2, 1], parts: [{ id: 'soma', label: 'Soma', text: '' }, { id: 'myelin', label: 'Myelin', text: '' }, { id: 'node', label: 'Node', text: '' }] },
  { id: 'n2', ch: 'nerves', title: 'synapse', sub: 't', kind: 'neuron', body: 'x', p: { mode: 'synapse', still: true }, view: [0.2, 0.15, 1], parts: [{ id: 'vesicle', label: 'Vesicle', text: '' }, { id: 'receptor', label: 'Receptor', text: '' }], steps: [{ label: 'a', text: '' }, { label: 'b', text: '' }, { label: 'c', text: '' }, { label: 'd', text: '' }, { label: 'e', text: '' }] },
  { id: 'n3', ch: 'nerves', title: 'reflex', sub: 't', kind: 'neuron', body: 'x', p: { mode: 'reflex', inhib: true, still: true }, view: [0.2, 0.3, 1], parts: [{ id: 'sensory', label: 'Sensory', text: '' }, { id: 'motor', label: 'Motor', text: '' }], steps: [{ label: 'a', text: '' }, { label: 'b', text: '' }, { label: 'c', text: '' }, { label: 'd', text: '' }, { label: 'e', text: '' }] },
  { id: 'n4', ch: 'nerves', title: 'glia', sub: 't', kind: 'neuron', body: 'x', p: { mode: 'glia', still: true }, view: [0.2, 0.3, 1], parts: [{ id: 'astrocyte', label: 'Astro', text: '' }] },
  { id: 'b1', ch: 'brain', title: 'lobes', sub: 't', kind: 'brain', body: 'x', p: { lobes: true, still: true }, view: [-1, 0.35, 0.5], parts: [{ id: 'frontal', label: 'Frontal', text: '' }, { id: 'cerebellum', label: 'Cerebellum', text: '' }] },
  { id: 'b2', ch: 'brain', title: 'glass', sub: 't', kind: 'brain', body: 'x', p: { mode: 'glass', still: true, deep: ['hippocampus', 'amygdala', 'thalamus', 'ventricles', 'caudate', 'putamen', 'callosum', 'fornix'] }, view: [-1, 0.35, 0.5], parts: [{ id: 'hippocampus', label: 'Hippocampus', text: '' }, { id: 'thalamus', label: 'Thalamus', text: '' }] },
  { id: 'b3', ch: 'brain', title: 'slice', sub: 't', kind: 'brain', body: 'x', p: { mode: 'slice', still: true }, view: [-0.3, 0.3, 1], parts: [{ id: 'grey', label: 'Grey', text: '' }, { id: 'white', label: 'White', text: '' }] },
  { id: 'b4', ch: 'brain', title: 'half', sub: 't', kind: 'brain', body: 'x', p: { mode: 'half', still: true, deep: ['callosum', 'thalamus', 'pituitary', 'hypothalamus'] }, view: [-1, 0.1, 0.05], parts: [{ id: 'callosum', label: 'CC', text: '' }] },
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
