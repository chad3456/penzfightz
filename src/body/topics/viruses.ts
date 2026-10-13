import type { Topic } from '../types';

export const VIRUSES: Topic[] = [
  {
    id: 'sars-cov-2', ch: 'viruses', title: 'SARS-CoV-2', sub: 'The coronavirus that causes COVID-19', kind: 'virus',
    p: { shape: 'sphere', r: 1, envelope: true, spikes: { n: 60, kind: 'crown' }, spikes2: { n: 40, kind: 'knob', color: '#f2c94c', len: 0.1 }, genome: 'rna', matrix: false },
    body: 'A ball of fatty envelope about 100 nanometres across, studded with spike proteins that give coronaviruses their crown-like look. Inside, a single long strand of RNA about 30,000 letters long is wrapped in nucleocapsid protein.\n\nThe spike latches onto the ACE2 receptor on cells in the nose, throat and lungs; a human enzyme then cuts the spike so the virus can fuse with the cell and pour its RNA in.',
    parts: [
      { id: 'spike', label: 'Spike (S) protein', text: 'A three-part protein that binds ACE2. It is the target of most vaccines and neutralising antibodies, and the part whose mutations define new variants.' },
      { id: 'spike2', label: 'Membrane and envelope proteins', text: 'Smaller M and E proteins shape the envelope and help new viruses bud from the cell.' },
      { id: 'envelope', label: 'Lipid envelope', text: 'A fatty membrane stolen from the infected cell. Soap and alcohol dissolve it, which is why hand-washing works.' },
      { id: 'genome', label: 'RNA genome', text: 'About 30,000 bases of positive-sense RNA, among the largest RNA genomes known, coding for the virus’s proteins including its own copying machinery.' },
    ],
    controls: [{ id: 'cut', label: 'Cut away', min: 0, max: 1, step: 0.01, value: 0 }],
    facts: ['About 100 nm across: some 700 would fit across a human hair.', 'Each virus carries roughly 25–100 spikes.'],
    q: 'SARS-CoV-2 structure spike ACE2',
  },
  {
    id: 'adenovirus', ch: 'viruses', title: 'Adenovirus', sub: 'A naked icosahedron with fibres at its corners', kind: 'virus',
    p: { shape: 'icosa', r: 1, envelope: false, spikes: { n: 12, kind: 'fiber', color: '#f2c94c', len: 0.6 }, genome: 'dna' },
    body: 'A protein shell with twenty triangular faces and no envelope, tough enough to survive on surfaces and in swimming pools. A long fibre with a knob at the end sticks out from each of its twelve corners and grips the cell.',
    parts: [
      { id: 'capsid', label: 'Icosahedral capsid', text: 'Built from 252 capsomers: hexons on the faces and pentons at the corners.' },
      { id: 'spike', label: 'Fibre and knob', text: 'The fibre knob binds the coxsackie–adenovirus receptor (CAR) on the cell.' },
      { id: 'genome', label: 'Double-stranded DNA', text: 'About 36,000 base pairs. Disabled adenoviruses are used as vectors in some vaccines and gene therapies.' },
    ],
    controls: [{ id: 'cut', label: 'Cut away', min: 0, max: 1, step: 0.01, value: 0 }],
    q: 'adenovirus capsid structure fiber',
  },
  {
    id: 'phage-t4', ch: 'viruses', title: 'Bacteriophage T4', sub: 'A virus that infects bacteria', kind: 'virus', p: { shape: 'phage' },
    body: 'A head full of DNA on a contractile tail, standing on six legs. It lands on E. coli, contracts its tail sheath like a syringe and injects its DNA through the bacterial wall.',
    parts: [
      { id: 'head', label: 'Head', text: 'An elongated icosahedron packed with 169,000 base pairs of DNA at very high pressure.' },
      { id: 'tail', label: 'Tail sheath', text: 'Contracts to drive the inner tube through the cell wall.' },
      { id: 'baseplate', label: 'Baseplate', text: 'Senses that the legs are attached and triggers the contraction.' },
      { id: 'fiber', label: 'Tail fibres', text: 'Long legs that recognise the bacterial surface.' },
      { id: 'genome', label: 'DNA', text: 'Injected into the bacterium, it takes over the cell to make about 100–200 new phages.' },
    ],
    q: 'bacteriophage T4 structure',
  },
];
