import type { Topic } from '../types';
import { chapter, ctl } from './make';

const t = chapter('nerves');
const NV: [number, number, number] = [0, 0.2, 1], SV: [number, number, number] = [0.2, 0.15, 1];
const SPEED = ctl('speed', 'Signal speed', 0.3, 3, 1, 0.1, '×');
const SYN: [string, string][] = [['Resting', 'Vesicles full of transmitter wait at the active zone.'], ['Signal arrives', 'An action potential opens calcium channels; calcium floods in.'], ['Release', 'Vesicles fuse with the membrane and empty transmitter into the cleft.'], ['Binding', 'Transmitter binds receptors on the next cell, opening channels or starting signals.'], ['Clean-up', 'Transporters pump the transmitter back, or enzymes break it down, ending the signal.']];
const syn = (nt: string, x: Record<string, unknown> = {}) => ({ mode: 'synapse', nt, still: true, ...x });

export const NERVES: Topic[] = [
  t('nervous-system', 'The nervous system', 'Brain, spinal cord and nerves', 'body', { show: ['nerves'], still: true },
    'The central nervous system is the brain and spinal cord. The peripheral nervous system is everything else: 31 pairs of spinal nerves and 12 pairs of cranial nerves branching to every muscle, organ and patch of skin.\n\nSensory nerves carry information in; motor nerves carry commands out. A separate autonomic division runs the organs without conscious control: the sympathetic side prepares for action, the parasympathetic side for rest and digestion.',
    [['cord', 'Spinal cord', 'About 45 cm long, ending around the first lumbar vertebra.'], ['nerves', 'Peripheral nerves', 'Bundles of axons wrapped in connective tissue.'], ['sciatic', 'Sciatic nerve', 'The longest and widest nerve, about as thick as a thumb near its origin.'], ['brain', 'Brain', 'About 86 billion neurons.']],
    { view: [0.1, 0.05, 1], q: 'peripheral nervous system organization autonomic' }),

  t('neuron', 'The neuron', 'A cell built to send signals', 'neuron', { still: true },
    'A neuron has three main parts. Branching dendrites receive signals from other cells. The cell body (soma) contains the nucleus and adds up the incoming signals. If they push it past a threshold, an electrical pulse starts at the axon hillock and runs along the axon, a single fibre that can be over a metre long, to terminals that pass the signal on.\n\nMany axons are wrapped in myelin, which makes signals travel much faster. A typical neuron connects with thousands of others.',
    [['dendrite', 'Dendrites', 'Covered in synapses; the input side.'], ['soma', 'Cell body', 'Integrates inputs and keeps the cell alive.'], ['nucleus', 'Nucleus', 'Holds the DNA.'], ['hillock', 'Axon hillock', 'Where the action potential starts.'], ['axon', 'Axon', 'The output cable.'], ['myelin', 'Myelin sheath', 'Insulation made by glial cells.'], ['node', 'Node of Ranvier', 'Gaps where the signal is regenerated.'], ['terminal', 'Axon terminals', 'Release neurotransmitters at synapses.']],
    { view: NV, controls: [SPEED], q: 'neuron structure dendrite axon soma' }),

  t('action-potential', 'The action potential', 'An electrical wave along the axon', 'neuron', { still: true, myelin: false },
    'A resting neuron is about 70 millivolts more negative inside than out, kept that way by pumps that push sodium out and potassium in. When a patch of membrane is pushed past a threshold, sodium channels snap open and sodium rushes in, flipping the voltage positive for about a millisecond. Then potassium channels open and restore it.\n\nThat local flip triggers the next patch, so the pulse travels along the axon without fading, always the same size: it is all or nothing. Information is carried in how often the pulses fire.',
    [['axon', 'Axon membrane', 'Lined with voltage-gated sodium and potassium channels.'], ['signal', 'The travelling pulse', 'In an unmyelinated axon it crawls along at about 0.5–2 metres per second.'], ['hillock', 'Trigger zone', 'Has the highest density of sodium channels.']],
    { view: NV, controls: [SPEED], facts: ['Local anaesthetics such as lidocaine work by blocking sodium channels.', 'Hodgkin and Huxley worked this out in the giant axon of the squid, winning the 1963 Nobel Prize.'], q: 'action potential sodium potassium channels Hodgkin Huxley' }),

  t('myelin', 'Myelin and fast signals', 'Jumping from node to node', 'neuron', { still: true, myelin: true },
    'Myelin is a fatty insulation wrapped round axons in many layers: by oligodendrocytes in the brain and spinal cord and by Schwann cells in nerves. It stops current leaking, so the signal only needs to be regenerated at the small gaps between wraps, the nodes of Ranvier.\n\nThe pulse appears to jump from node to node (saltatory conduction), reaching up to about 120 metres per second, fast enough to get from toe to brain in about a hundredth of a second.',
    [['myelin', 'Myelin sheath', 'Each segment is about 1 mm long.'], ['node', 'Node of Ranvier', 'Packed with sodium channels.'], ['axon', 'Axon', 'Thicker axons are faster too.'], ['signal', 'Pulse', 'Leaps between nodes.']],
    { view: NV, controls: [SPEED], q: 'myelin saltatory conduction velocity' }),

  t('ms-nerve', 'Multiple sclerosis in a nerve fibre', 'When the insulation is stripped', 'neuron', { still: true, myelin: true, ms: true },
    'In multiple sclerosis, immune cells attack the myelin around axons in the brain and spinal cord. Where it is stripped away the signal slows down, becomes unreliable, or fails to get through at all, as here where the pulse dies at the damaged segment.\n\nSome repair (remyelination) happens, especially early on, which is why symptoms can come and go. Over time axons themselves can be lost, which causes lasting disability.',
    [['damage', 'Demyelinated segment', 'Signal leaks away.'], ['myelin', 'Healthy myelin', 'Conducts normally.'], ['signal', 'The pulse', 'Slows, then fails.']],
    { view: NV, controls: [SPEED], q: 'demyelination conduction block remyelination' }),

  t('synapse', 'The synapse', 'Passing the message on', 'neuron', syn('#7fe0ff'),
    'Neurons do not quite touch. At a chemical synapse, the end of one axon is separated from the next cell by a gap about 20 nanometres wide. When an electrical pulse arrives, it is converted into a chemical message: tiny bubbles (vesicles) release a neurotransmitter, which crosses the gap and binds receptors on the other side.\n\nSynapses can be excitatory or inhibitory and can strengthen or weaken with use, which is thought to be the basis of learning and memory.',
    [['presynaptic', 'Presynaptic terminal', 'The sending side.'], ['vesicle', 'Synaptic vesicles', 'Each holds a few thousand transmitter molecules.'], ['channel', 'Calcium channels', 'Their opening triggers release.'], ['cleft', 'Synaptic cleft', 'About 20 nm wide.'], ['receptor', 'Receptors', 'On the receiving cell.'], ['postsynaptic', 'Postsynaptic cell', 'The receiving side.'], ['transporter', 'Reuptake transporters', 'Clear the transmitter.'], ['mitochondrion', 'Mitochondrion', 'Supplies energy for recycling vesicles.']],
    { view: SV, steps: SYN, facts: ['The human brain has around 100 trillion synapses.'], q: 'chemical synapse neurotransmitter release calcium' }),

  t('dopamine', 'Dopamine', 'Reward, movement and motivation', 'neuron', syn('#ff9d3a'),
    'Dopamine is made by a few hundred thousand neurons in the midbrain whose axons spread widely. One pathway runs to the basal ganglia and is needed for smooth movement; another runs to the nucleus accumbens and prefrontal cortex and signals reward and motivation.\n\nMost drugs of abuse raise dopamine at these synapses; cocaine, for example, blocks the transporter that clears it. Antipsychotic medicines block dopamine receptors.',
    [['transmitter', 'Dopamine', 'A monoamine made from the amino acid tyrosine.'], ['receptor', 'Dopamine receptors', 'Five types, D1 to D5.'], ['transporter', 'Dopamine transporter', 'Blocked by cocaine.'], ['vesicle', 'Vesicles', 'Filled by a pump that amphetamines disrupt.']],
    { view: SV, steps: SYN, q: 'dopamine pathways reward movement' }),

  t('serotonin', 'Serotonin and SSRIs', 'How common antidepressants act', 'neuron', syn('#c98bd9', { ssri: true }),
    'Serotonin is released by neurons in the brainstem that project throughout the brain, influencing mood, sleep, appetite and pain. (Most of the body’s serotonin is actually in the gut.)\n\nSelective serotonin reuptake inhibitors (SSRIs) such as fluoxetine and sertraline block the serotonin transporter, so serotonin stays in the synapse longer. That happens within hours, but the mood effects take weeks, suggesting the benefit comes from slower adaptations in the brain.',
    [['drug', 'SSRI drug', 'Sits in the transporter and blocks it.'], ['transporter', 'Serotonin transporter (SERT)', 'Normally recycles serotonin.'], ['transmitter', 'Serotonin', 'Lingers longer in the cleft.'], ['receptor', 'Serotonin receptors', 'At least 14 types.']],
    { view: SV, steps: SYN, q: 'SSRI mechanism serotonin transporter antidepressant' }),

  t('gaba', 'GABA: the brake', 'Inhibitory synapses', 'neuron', syn('#5ac46a'),
    'GABA is the brain’s main inhibitory neurotransmitter. When it binds GABA-A receptors, they open a channel for chloride, making the receiving neuron more negative and harder to fire. Without this braking, activity runs away into seizures.\n\nBenzodiazepines, barbiturates, alcohol and many anaesthetics make GABA-A receptors work harder, which is why they calm and sedate, and why mixing them is dangerous.',
    [['transmitter', 'GABA', 'Made from glutamate.'], ['receptor', 'GABA-A receptors', 'Chloride channels.'], ['postsynaptic', 'Receiving neuron', 'Quietened.']],
    { view: SV, steps: SYN, q: 'GABA-A receptor inhibition benzodiazepine' }),

  t('glutamate', 'Glutamate and learning', 'Synapses that strengthen with use', 'neuron', syn('#f2c94c'),
    'Glutamate is the main excitatory transmitter, used at most synapses in the brain. One of its receptors, the NMDA receptor, opens only when glutamate is bound and the receiving cell is already active, making it a detector of coincident activity.\n\nWhen that happens repeatedly, calcium entry triggers long-term potentiation: more receptors are inserted and the synapse grows stronger, so the same input has a bigger effect next time. This is a leading model of how memories are stored.',
    [['transmitter', 'Glutamate', 'An amino acid.'], ['receptor', 'AMPA and NMDA receptors', 'AMPA carries most current; NMDA detects coincidences.'], ['postsynaptic', 'Dendritic spine', 'Grows larger as the synapse strengthens.']],
    { view: SV, steps: SYN, q: 'long-term potentiation NMDA receptor memory' }),

  t('nmj', 'Nerve meets muscle', 'The neuromuscular junction', 'neuron', syn('#5ac8ff', { post: 'muscle' }),
    'Every voluntary muscle contraction starts at a neuromuscular junction, where a motor neuron’s terminal meets a muscle fibre. The transmitter is acetylcholine; binding opens channels in the muscle membrane, triggering an electrical wave that sets off contraction.\n\nAn enzyme, acetylcholinesterase, breaks the acetylcholine down within a millisecond so the muscle can relax. Nerve agents block that enzyme; botulinum toxin stops release; in myasthenia gravis antibodies attack the receptors.',
    [['presynaptic', 'Motor nerve terminal', 'Releases acetylcholine.'], ['receptor', 'Acetylcholine receptors', 'Clustered on folds of the muscle membrane.'], ['postsynaptic', 'Muscle fibre', 'Contracts in response.'], ['vesicle', 'Vesicles', 'Botulinum toxin stops them fusing.']],
    { view: SV, steps: SYN, q: 'neuromuscular junction acetylcholine myasthenia botulinum' }),

  t('ion-channels', 'Pumps and channels', 'How a neuron keeps its charge', 'cell', { mode: 'transport', still: true },
    'A cell membrane is a barrier to charged particles, so cells control them with proteins. Channels are pores that open and let specific ions flow down their gradient. Pumps spend energy to push ions against it.\n\nThe sodium–potassium pump moves three sodium ions out and two potassium ions in with each molecule of ATP, building up the gradients that action potentials use. In the brain it consumes a large share of all the energy used.',
    [['pump', 'Sodium–potassium pump', 'An ATP-powered transporter.'], ['protein', 'Ion channel', 'Opens for one kind of ion.'], ['phospholipid', 'Membrane', 'Impermeable to ions on its own.']],
    { view: [0.3, 0.4, 1], q: 'sodium potassium ATPase resting membrane potential' }),

  t('reflex', 'The knee-jerk reflex', 'A loop that skips the brain', 'neuron', { mode: 'reflex', still: true },
    'Tap the tendon below the kneecap and the thigh muscle is stretched. Stretch receptors fire, and the signal races up a sensory nerve into the spinal cord, where it connects directly onto a motor neuron. The motor neuron sends a command straight back, and the muscle contracts: the leg kicks.\n\nThe whole loop takes about 50 milliseconds and involves only two neurons and one synapse. The brain hears about it afterwards. Doctors test reflexes to check the nerves and spinal cord.',
    [['receptor', 'Stretch receptor', 'A muscle spindle.'], ['sensory', 'Sensory neuron', 'Carries the signal in.'], ['ganglion', 'Dorsal root ganglion', 'Holds the sensory neuron’s cell body.'], ['grey', 'Grey matter', 'Where the synapse is.'], ['motor', 'Motor neuron', 'Carries the command out.'], ['quadriceps', 'Quadriceps', 'Contracts and kicks.'], ['cord', 'Spinal cord', 'Seen in cross-section.']],
    { view: [0.2, 0.3, 1], steps: [['Tap', 'The tendon is struck and the muscle stretched.'], ['Sensory signal', 'Stretch receptors fire into the sensory neuron.'], ['Synapse', 'In the cord it connects directly to a motor neuron.'], ['Motor signal', 'The motor neuron fires back to the muscle.'], ['Kick', 'The quadriceps contracts.']], q: 'stretch reflex monosynaptic patellar' }),

  t('reciprocal', 'Reflexes that relax the opposite muscle', 'Reciprocal inhibition', 'neuron', { mode: 'reflex', inhib: true, still: true },
    'For a limb to move, the muscle on the other side of the joint has to relax. In the knee-jerk, the sensory signal also excites a small inhibitory interneuron in the cord, which quietens the motor neurons of the hamstrings at the back of the thigh.\n\nThe same wiring underlies the withdrawal reflex: touch something hot and the arm pulls away before you feel pain, with the opposing muscles let go.',
    [['interneuron', 'Inhibitory interneuron', 'Releases glycine.'], ['hamstring', 'Hamstrings', 'Relaxed by the interneuron.'], ['quadriceps', 'Quadriceps', 'Contracts.'], ['sensory', 'Sensory neuron', 'Drives both pathways.']],
    { view: [0.2, 0.3, 1], steps: [['Tap', 'Stretch.'], ['Sensory signal', 'Into the cord.'], ['Split', 'One branch excites, one inhibits.'], ['Motor', 'Quadriceps ordered to contract.'], ['Result', 'Quadriceps kick, hamstrings relax.']], q: 'reciprocal inhibition interneuron spinal' }),

  t('spinal-nerves', 'Spine, cord and nerve roots', 'Where nerves leave the spine', 'bones', { mode: 'spine', still: true },
    'The spinal cord runs down a canal formed by the stacked vertebrae. Between each pair of vertebrae, nerve roots leave on each side through a small opening (the foramen) and join to form the spinal nerves.\n\nBecause the cord is shorter than the spine, the lower roots run down inside the canal before leaving, like a horse’s tail (cauda equina). Narrowing of the openings or a bulging disc can press on a root and cause pain or numbness down the arm or leg.',
    [['cord', 'Spinal cord', 'Carries signals between the brain and body.'], ['root', 'Nerve roots', 'Sensory roots enter at the back, motor roots leave at the front.'], ['vertebra', 'Vertebra', 'Protects the cord.'], ['disc', 'Intervertebral disc', 'A shock absorber.']],
    { view: [1, 0.3, 0.6], q: 'spinal nerve roots radiculopathy anatomy' }),

  t('glia', 'Glial cells', 'The other half of the brain', 'neuron', { mode: 'glia', still: true },
    'Glial cells are roughly as numerous as neurons in the human brain. Astrocytes feed neurons, mop up excess transmitters, regulate blood flow and help form the blood–brain barrier. Oligodendrocytes wrap myelin round axons, each serving many axons at once. Microglia are the brain’s resident immune cells, constantly sampling their surroundings and pruning unused synapses.\n\nOnce thought of as mere glue (glia is Greek for glue), they are now known to take an active part in brain signalling and disease.',
    [['astrocyte', 'Astrocyte', 'Star-shaped, with endfeet on blood vessels.'], ['oligodendrocyte', 'Oligodendrocyte', 'Myelinates up to about 50 axon segments.'], ['microglia', 'Microglia', 'Immune defence and housekeeping.'], ['vessel', 'Capillary', 'Wrapped by astrocyte endfeet.'], ['neuron', 'Neuron', 'Supported by all of these.'], ['axon', 'Axons', 'Wrapped in myelin.']],
    { view: [0.2, 0.3, 1], q: 'astrocytes oligodendrocytes microglia function', refs: ['azevedo2009'] }),

  t('network', 'Neural networks', 'Thinking as patterns of firing', 'neuron', { mode: 'network', still: true },
    'No single neuron holds a thought. Information is carried by patterns of activity across networks of neurons connected by synapses of different strengths. Perception, memory and decisions emerge from how these networks fire together.\n\nLearning changes the strengths of connections and even creates or removes synapses, so the network itself is rewired by experience, a property called neuroplasticity. Artificial neural networks used in AI are loosely inspired by this idea.',
    [['neuron', 'Neuron', 'A node in the network.'], ['connection', 'Connection', 'An axon and its synapses; signals travel along them as flashes here.']],
    { view: [0.2, 0.2, 1], q: 'neural circuits population coding plasticity' }),

  t('pain', 'How pain works', 'From nerve ending to brain', 'neuron', { mode: 'reflex', still: true },
    'Pain begins at nociceptors, nerve endings that respond to damaging heat, pressure or chemicals released by injured tissue. Their signals travel up the spinal cord to the thalamus and on to several brain areas that together produce the experience of pain and its unpleasantness.\n\nThe signal is heavily modified on the way: the spinal cord can turn it up or down, and the brain sends descending signals that can suppress it (which is part of how morphine and the placebo effect work). In chronic pain this system can become oversensitive.',
    [['receptor', 'Nociceptor', 'A free nerve ending.'], ['sensory', 'Sensory fibre', 'Fast fibres give sharp pain, slow ones a dull ache.'], ['grey', 'Dorsal horn', 'The first relay and a gate that can dampen signals.'], ['cord', 'Spinal cord', 'Carries the signal to the brain.']],
    { view: [0.2, 0.3, 1], steps: [['Injury', 'Tissue damage activates nociceptors.'], ['Signal', 'It travels into the cord.'], ['Relay', 'The dorsal horn passes it upward, more or less strongly.'], ['Reflex', 'A withdrawal reflex may already move you away.'], ['Perception', 'The brain constructs the feeling of pain.']], q: 'nociception pain pathways modulation' }),

  t('als', 'Motor neuron disease', 'When the motor neurons die', 'neuron', { still: true, myelin: true },
    'Amyotrophic lateral sclerosis (ALS), the commonest form of motor neuron disease, destroys the neurons that control voluntary muscles, both in the brain and in the spinal cord. Without their nerve supply, muscles weaken and waste, affecting the limbs, speech, swallowing and eventually breathing.\n\nAbout one case in ten runs in families; the commonest genetic cause is a repeated stretch of DNA in a gene called C9orf72. A protein called TDP-43 forms clumps in affected neurons in most cases.',
    [['soma', 'Motor neuron', 'Its cell body sits in the spinal cord or motor cortex.'], ['axon', 'Axon', 'Withdraws from the muscle as the disease progresses.'], ['terminal', 'Nerve terminal', 'Loses contact with muscle.']],
    { view: NV, controls: [SPEED], q: 'amyotrophic lateral sclerosis TDP-43 C9orf72 review' }),
];
