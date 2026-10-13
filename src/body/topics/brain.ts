import type { Topic } from '../types';
import { chapter, ctl } from './make';

const t = chapter('brain');
const SIDE: [number, number, number] = [-1, 0.35, 0.5], TQ: [number, number, number] = [-1, 0.45, 0.85], MID: [number, number, number] = [-1, 0.1, 0.05];

export const BRAIN: Topic[] = [
  t('brain-lobes', 'The lobes of the brain', 'Four lobes, a little brain and a stem', 'brain', { lobes: true, still: true },
    'Each half of the cerebrum is divided by deep grooves into four lobes, named after the skull bones over them. Broadly, the frontal lobe plans, decides and moves; the parietal lobe handles touch and where things are in space; the temporal lobe deals with hearing, language and memory; the occipital lobe is for vision.\n\nBelow and behind sits the cerebellum, which fine-tunes movement and balance, and the brainstem, which runs breathing, heart rate and sleep and connects the brain to the spinal cord. Real brains are not colour-coded; the colours mark the regions.',
    [['frontal', 'Frontal lobe', 'Planning, judgement, personality, speech production and voluntary movement.'], ['parietal', 'Parietal lobe', 'Touch, body position, spatial attention, number sense.'], ['temporal', 'Temporal lobe', 'Hearing, understanding language, recognising faces, memory.'], ['occipital', 'Occipital lobe', 'Vision.'], ['cerebellum', 'Cerebellum', 'Coordination and timing; contains more than half the brain’s neurons.'], ['brainstem', 'Brainstem', 'Breathing, heart rate, swallowing, arousal.']],
    { view: SIDE, facts: ['The brain weighs about 1.3–1.4 kg and contains around 86 billion neurons.', 'It uses about 20% of the body’s energy at rest.'], q: 'human brain lobes function neuron count', refs: ['azevedo2009'] }),

  t('cortex-folds', 'Folds of the cortex', 'Why the brain is wrinkled', 'brain', { still: true },
    'The cerebral cortex is a sheet of grey matter only 2 to 4 millimetres thick, but with a surface area of about a quarter of a square metre. To fit inside the skull it is folded into ridges (gyri) and grooves (sulci); about two-thirds of it is hidden in the folds.\n\nA few large grooves are the same in everyone and are used as landmarks: the central sulcus between the frontal and parietal lobes, and the lateral fissure above the temporal lobe. The longitudinal fissure separates the two hemispheres.',
    [['cortex', 'Gyrus', 'A ridge of cortex.'], ['sulcus', 'Sulcus', 'A groove.'], ['fissure', 'Longitudinal fissure', 'Divides left and right hemispheres.'], ['cerebellum', 'Cerebellum', 'Even more tightly folded, into thin leaves called folia.']],
    { view: TQ, q: 'cortical folding gyrification surface area' }),

  t('inside-brain', 'Inside the brain', 'The deep structures', 'brain', { mode: 'glass', still: true, deep: ['hippocampus', 'amygdala', 'thalamus', 'hypothalamus', 'caudate', 'putamen', 'callosum', 'ventricles', 'pituitary'] },
    'Under the cortex, buried in white matter, lie clusters of grey matter that do much of the brain’s essential work: relaying signals (thalamus), controlling hormones, hunger and temperature (hypothalamus), selecting movements (basal ganglia), forming memories (hippocampus) and detecting threats (amygdala).\n\nThe corpus callosum, a broad band of about 200 million nerve fibres, links the two halves, and fluid-filled ventricles cushion the brain from inside.',
    [['thalamus', 'Thalamus', 'The relay station for almost all sensory information on its way to the cortex.'], ['hypothalamus', 'Hypothalamus', 'Body temperature, hunger, thirst, sleep, hormones.'], ['hippocampus', 'Hippocampus', 'Forms new memories and maps space.'], ['amygdala', 'Amygdala', 'Fear, threat and emotional memory.'], ['caudate', 'Caudate nucleus', 'Part of the basal ganglia.'], ['putamen', 'Putamen', 'Part of the basal ganglia.'], ['callosum', 'Corpus callosum', 'Connects the hemispheres.'], ['ventricles', 'Ventricles', 'Spaces filled with cerebrospinal fluid.'], ['pituitary', 'Pituitary gland', 'The master hormone gland, hanging below the hypothalamus.']],
    { view: TQ, q: 'subcortical structures function review' }),

  t('limbic-system', 'The limbic system', 'Emotion, memory and motivation', 'brain', { mode: 'glass', still: true, deep: ['hippocampus', 'amygdala', 'fornix', 'thalamus', 'hypothalamus', 'accumbens'] },
    'The limbic system is a group of structures curving round the inner edge of each hemisphere that work together on emotion, motivation and memory. The hippocampus lays down new memories, the amygdala tags experiences with emotional weight, and the hypothalamus turns emotions into bodily responses such as a racing heart.\n\nThe idea of a single “emotional brain” is now seen as too simple, but these structures are tightly connected and are involved in anxiety, depression and addiction.',
    [['hippocampus', 'Hippocampus', 'Shaped like a seahorse, which is what its name means.'], ['amygdala', 'Amygdala', 'Almond-shaped.'], ['fornix', 'Fornix', 'The arching fibre tract that carries signals out of the hippocampus.'], ['hypothalamus', 'Hypothalamus', 'Links emotion to hormones and the autonomic nervous system.'], ['thalamus', 'Thalamus', 'Relays signals.'], ['accumbens', 'Nucleus accumbens', 'Central to reward and motivation.']],
    { view: TQ, q: 'limbic system emotion memory circuits' }),

  t('hippocampus', 'The hippocampus and memory', 'Where new memories are made', 'brain', { mode: 'glass', still: true, activity: false, deep: ['hippocampus', 'fornix', 'amygdala'] },
    'The hippocampus is needed to form new memories of facts and events. The patient known as H.M., who had both hippocampi removed in 1953 to treat epilepsy, could no longer form new lasting memories, though he could still learn new motor skills.\n\nMemories are thought to be stored first through strengthened connections in the hippocampus and gradually transferred to the cortex, partly during sleep. The hippocampus also contains place cells that fire when you are in a particular location, building a map of space. It is one of the first areas affected in Alzheimer’s disease.',
    [['hippocampus', 'Hippocampus', 'One of the few places in the adult brain where new neurons may still be born, though how much this happens in humans is debated.'], ['fornix', 'Fornix', 'Its output pathway.'], ['amygdala', 'Amygdala', 'Next door; strengthens memories of emotional events.']],
    { view: TQ, q: 'hippocampus episodic memory consolidation place cells' }),

  t('amygdala', 'The amygdala and fear', 'An early-warning system', 'brain', { mode: 'glass', still: true, deep: ['amygdala', 'thalamus', 'hypothalamus', 'hippocampus'] },
    'The amygdala detects threats and triggers the fear response. Signals from the senses reach it by a fast, rough route through the thalamus and a slower, detailed route through the cortex, so you can flinch from a snake-shaped stick before you know what it is.\n\nThrough the hypothalamus and brainstem it raises heart rate, releases stress hormones and freezes or readies the body. An overactive amygdala is linked with anxiety disorders and post-traumatic stress.',
    [['amygdala', 'Amygdala', 'A cluster of nuclei deep in the temporal lobe.'], ['thalamus', 'Thalamus', 'Sends it a quick early signal.'], ['hypothalamus', 'Hypothalamus', 'Turns alarm into body changes.'], ['hippocampus', 'Hippocampus', 'Supplies context: is this place dangerous?']],
    { view: TQ, q: 'amygdala fear conditioning threat detection' }),

  t('basal-ganglia', 'The basal ganglia', 'Choosing which movement to make', 'brain', { mode: 'glass', still: true, deep: ['caudate', 'putamen', 'pallidus', 'nigra', 'thalamus'] },
    'The basal ganglia are a set of linked nuclei deep in the brain that help select wanted movements and suppress unwanted ones, and are involved in habits and learning from reward. They form loops from the cortex, through the basal ganglia and thalamus, back to the cortex.\n\nDopamine from the substantia nigra tunes these loops. Losing it slows movement (Parkinson’s disease); damage to the caudate and putamen causes uncontrolled movements (Huntington’s disease).',
    [['caudate', 'Caudate nucleus', 'C-shaped; involved in learning and planning.'], ['putamen', 'Putamen', 'Mainly movement.'], ['pallidus', 'Globus pallidus', 'The main output, which holds the thalamus in check.'], ['nigra', 'Substantia nigra', 'Dark with pigment; supplies dopamine.'], ['thalamus', 'Thalamus', 'Passes the result back to the cortex.']],
    { view: TQ, q: 'basal ganglia circuits action selection dopamine' }),

  t('thalamus', 'Thalamus and hypothalamus', 'The relay and the regulator', 'brain', { mode: 'half', still: true, deep: ['thalamus', 'hypothalamus', 'pituitary', 'pineal', 'callosum'] },
    'The thalamus, two egg-shaped masses at the centre of the brain, relays nearly every sense (except smell) to the cortex and helps control attention and wakefulness.\n\nJust below it, the hypothalamus is only the size of an almond but keeps the body in balance: it sets body temperature, hunger and thirst, controls the sleep–wake clock, and directs the pituitary gland, linking the nervous system to the hormone system.',
    [['thalamus', 'Thalamus', 'Relay and gatekeeper.'], ['hypothalamus', 'Hypothalamus', 'The body’s thermostat and hormone controller.'], ['pituitary', 'Pituitary', 'Hangs from it on a stalk.'], ['pineal', 'Pineal gland', 'Makes melatonin at night.'], ['callosum', 'Corpus callosum', 'Arches above.']],
    { view: MID, q: 'hypothalamus homeostasis thalamus relay' }),

  t('ventricles', 'Ventricles and spinal fluid', 'A cushion of clear fluid', 'brain', { mode: 'glass', still: true, glymph: true, deep: ['ventricles'] },
    'Four connected cavities inside the brain, the ventricles, are filled with cerebrospinal fluid (CSF). It is made by the choroid plexus at about half a litre a day, flows out around the brain and spinal cord, and is reabsorbed into the blood.\n\nCSF lets the brain float, which cuts its effective weight from about 1,400 grams to about 25, cushions it, and carries away waste. If its flow is blocked, the ventricles swell (hydrocephalus).',
    [['ventricles', 'Ventricles', 'Two lateral ventricles, a narrow third ventricle and the fourth ventricle in front of the cerebellum.'], ['csf', 'Cerebrospinal fluid', 'About 150 ml at any time, renewed several times a day.']],
    { view: TQ, q: 'cerebrospinal fluid production circulation' }),

  t('corpus-callosum', 'Two hemispheres', 'The corpus callosum and the split brain', 'brain', { mode: 'half', still: true, deep: ['callosum', 'thalamus'] },
    'Each hemisphere mostly controls and feels the opposite side of the body, and the two specialise: in most people language is concentrated in the left. The corpus callosum lets them share information continuously.\n\nIn the 1960s some patients with severe epilepsy had it cut. Experiments by Roger Sperry and Michael Gazzaniga showed that information shown only to the right hemisphere could guide the left hand but could not be named, since speech lived in the left. In everyday life, though, the brain works as one integrated whole.',
    [['callosum', 'Corpus callosum', 'About 200 million axons.'], ['medial', 'Inner surface of a hemisphere', 'Seen here by cutting the brain down the middle.'], ['thalamus', 'Thalamus', 'Each hemisphere has its own.']],
    { view: MID, q: 'split-brain corpus callosotomy hemispheric specialization' }),

  t('cerebellum', 'The cerebellum', 'The brain’s coordinator', 'brain', { lobes: true, still: true },
    'The cerebellum sits under the back of the brain. It compares the movement you intended with what actually happened and corrects it, smoothing timing, balance and posture. It is also involved in learning skills such as riding a bike, and in some aspects of thinking and language.\n\nThough only about a tenth of the brain’s volume, it contains around 69 billion neurons, most of them tiny granule cells. Damage makes movements clumsy and unsteady; alcohol affects it early, which is why drunk people sway.',
    [['cerebellum', 'Cerebellum', 'Its surface is folded into fine leaves.'], ['brainstem', 'Brainstem', 'Connects it to the rest of the nervous system.'], ['occipital', 'Occipital lobe', 'Lies just above it.']],
    { view: [-0.6, 0.1, -1], q: 'cerebellum motor learning coordination' }),

  t('brainstem', 'The brainstem', 'Life support', 'brain', { mode: 'half', still: true, deep: ['thalamus', 'nigra', 'ventricles'] },
    'The brainstem connects the brain to the spinal cord and keeps the body alive without any conscious effort. It has three parts: the midbrain (eye movements, alertness, part of the dopamine system), the pons (breathing rhythm, sleep, facial sensation) and the medulla (heart rate, blood pressure, swallowing, vomiting).\n\nTen of the twelve cranial nerves emerge from it. Because so much is packed into a small space, even a small stroke here can be serious.',
    [['brainstem', 'Brainstem', 'Midbrain, pons and medulla.'], ['nigra', 'Substantia nigra', 'In the midbrain.'], ['cerebellum', 'Cerebellum', 'Attached behind it.'], ['ventricles', 'Fourth ventricle', 'Between the brainstem and cerebellum.']],
    { view: MID, q: 'brainstem function respiratory control' }),

  t('grey-white', 'Grey and white matter', 'Cells on the outside, cables on the inside', 'brain', { mode: 'slice', still: true },
    'Cut across, the brain shows two kinds of tissue. Grey matter, in the outer cortex and the deep nuclei, is packed with nerve cell bodies and synapses: where processing happens. White matter is made of long axons wrapped in fatty myelin, which looks pale: the wiring between regions.\n\nWhite matter makes up about half the brain. Its tracts keep developing into the mid-twenties, and they are damaged in diseases such as multiple sclerosis.',
    [['grey', 'Grey matter', 'The cortex, following every fold.'], ['white', 'White matter', 'Myelinated axons.'], ['ventricles', 'Lateral ventricles', 'Fluid-filled spaces.'], ['deepgrey', 'Deep grey matter', 'The basal ganglia and thalamus.']],
    { view: [-0.25, 0.25, 1], q: 'grey matter white matter myelin development' }),

  t('motor-sensory', 'Motor and sensory strips', 'The body mapped on the brain', 'brain', { motor: true, still: true },
    'Just in front of the central sulcus runs the primary motor cortex, which sends commands to the muscles; just behind it, the primary somatosensory cortex receives touch. Both hold a map of the opposite side of the body, laid out from the toes at the top to the face at the side.\n\nThe map is not to scale: the hands, lips and tongue take up far more cortex than the back or legs, because they need finer control and sensation. Drawn as a figure, this is the famous distorted “homunculus”.',
    [['motor', 'Primary motor cortex', 'In front of the central sulcus.'], ['sensory', 'Primary somatosensory cortex', 'Behind it.'], ['frontal', 'Frontal lobe', 'Plans the movements the motor strip carries out.'], ['parietal', 'Parietal lobe', 'Builds a picture of the body from touch.']],
    { view: TQ, q: 'motor cortex somatotopy homunculus' }),

  t('language', 'Language areas', 'Broca’s and Wernicke’s areas', 'brain', { regions: ['broca', 'wernicke', 'auditory'], still: true },
    'In most people language depends on the left hemisphere. Broca’s area in the frontal lobe is involved in producing speech and grammar; damage leaves people understanding well but speaking slowly and with effort. Wernicke’s area, where the temporal and parietal lobes meet, is involved in understanding; damage produces fluent speech that makes little sense.\n\nModern imaging shows language is spread over a wider network linked by a tract called the arcuate fasciculus, but these two areas remain key nodes.',
    [['broca', 'Broca’s area', 'Described by Paul Broca in 1861.'], ['wernicke', 'Wernicke’s area', 'Described by Carl Wernicke in 1874.'], ['auditory', 'Auditory cortex', 'Receives sound.']],
    { view: SIDE, q: 'language network Broca Wernicke aphasia' }),

  t('visual-pathway', 'The visual pathway', 'From the eyes to the back of the brain', 'brain', { mode: 'glass', still: true, deep: ['optic', 'thalamus', 'radiation'], regions: ['visual'] },
    'Light falling on the retina is turned into signals that leave each eye through the optic nerve. At the optic chiasm, fibres from the inner half of each retina cross over, so everything in your left field of view ends up in the right hemisphere, and vice versa.\n\nAfter a relay in the thalamus, the optic radiations fan back to the visual cortex in the occipital lobe, at the very back of the head. From there, streams carry the information forward to work out what things are and where they are.',
    [['optic', 'Optic nerves and chiasm', 'About a million fibres from each eye.'], ['thalamus', 'Lateral geniculate nucleus', 'The relay in the thalamus.'], ['radiation', 'Optic radiation', 'Carries signals to the cortex.'], ['visual', 'Primary visual cortex', 'Detects edges, orientation and motion.']],
    { view: [-0.6, 0.6, 0.6], q: 'visual pathway optic chiasm primary visual cortex' }),

  t('prefrontal', 'The prefrontal cortex', 'Planning and self-control', 'brain', { regions: ['prefrontal'], still: true },
    'The prefrontal cortex, at the front of the frontal lobes, holds goals in mind, weighs options, shifts attention and puts the brakes on impulses. These “executive functions” let us plan ahead and act on long-term goals rather than immediate urges.\n\nIt is among the last regions to mature, continuing to change into the mid-twenties. The case of Phineas Gage, the railway worker whose personality changed after an iron rod passed through his frontal lobe in 1848, was an early clue to its role.',
    [['prefrontal', 'Prefrontal cortex', 'Its connections run to almost every other part of the brain.'], ['frontal', 'Frontal lobe', 'The rest of it handles movement and speech.']],
    { view: [-0.5, 0.35, 1], q: 'prefrontal cortex executive function development' }),

  t('reward', 'The reward system', 'Dopamine and wanting', 'brain', { mode: 'glass', still: true, deep: ['vta', 'accumbens', 'nigra', 'caudate', 'putamen'], regions: ['prefrontal'] },
    'Dopamine neurons in the ventral tegmental area (VTA) send fibres to the nucleus accumbens and the prefrontal cortex. They fire when something turns out better than expected, signalling “that was worth it, do it again”. This teaches us which actions lead to food, company and other rewards.\n\nAddictive drugs hijack the circuit, causing large dopamine surges that the brain adapts to, building craving and tolerance. Dopamine is more about wanting and learning than about pleasure itself.',
    [['vta', 'Ventral tegmental area', 'Source of the reward dopamine.'], ['accumbens', 'Nucleus accumbens', 'A key target.'], ['prefrontal', 'Prefrontal cortex', 'Weighs rewards against goals.'], ['nigra', 'Substantia nigra', 'The neighbouring dopamine source for movement.']],
    { view: TQ, q: 'dopamine reward prediction error addiction' }),

  t('stroke', 'Stroke', 'When blood flow to part of the brain stops', 'brain', { stroke: true, arteries: false, still: true },
    'About 85% of strokes are ischaemic: a clot blocks an artery, often the middle cerebral artery shown here. Brain cells in the core die within minutes; around them is a zone (the penumbra) that is starved but can still be saved if blood flow is restored in time. The rest are haemorrhagic: a vessel bursts and bleeds.\n\nThe signs are sudden: face drooping, arm weakness, speech difficulty: time to call an ambulance (FAST). Clot-dissolving drugs and mechanical removal of the clot work best within hours.',
    [['clot', 'Clot', 'Blocks the artery.'], ['mca', 'Middle cerebral artery', 'Supplies much of the side of the brain, including movement and, on the left, language areas.'], ['infarct', 'Infarct core', 'Tissue already lost.'], ['penumbra', 'Penumbra', 'At risk but salvageable.']],
    { view: SIDE, facts: ['An untreated large stroke destroys an estimated 1.9 million neurons every minute.'], q: 'acute ischemic stroke thrombectomy penumbra time', refs: ['saver2006'] }),

  t('alzheimers', 'Alzheimer’s disease', 'Plaques, tangles and shrinking', 'brain', { plaques: true, atrophy: 0.5, still: true, mode: 'whole' },
    'Alzheimer’s disease is the commonest cause of dementia. Two proteins misbehave: amyloid-beta clumps into plaques between neurons, and tau forms tangles inside them. Synapses and then neurons are lost, starting in memory regions such as the hippocampus and spreading through the cortex.\n\nThe brain shrinks: grooves widen and the ventricles enlarge. Move the slider to see the folds thin. New antibody drugs that clear amyloid modestly slow decline in early disease.',
    [['plaques', 'Amyloid plaques', 'Build up for years, even decades, before symptoms.'], ['cortex', 'Shrinking cortex', 'Gyri thin and sulci widen.'], ['temporal', 'Temporal lobe', 'Hit early, including the hippocampus within it.']],
    { view: SIDE, controls: [ctl('atrophy', 'Atrophy', 0, 1, 0.5, 0.25)], q: 'Alzheimer disease amyloid tau pathology review', refs: ['scheltens2021'] }),

  t('parkinsons', 'Parkinson’s disease', 'Losing the dopamine cells', 'brain', { mode: 'glass', still: true, nigra: 'fade', deep: ['nigra', 'caudate', 'putamen', 'pallidus', 'thalamus'] },
    'In Parkinson’s disease, the dopamine-making neurons of the substantia nigra gradually die, and clumps of the protein alpha-synuclein (Lewy bodies) build up in them. By the time symptoms appear, more than half of these neurons may already be lost.\n\nWithout dopamine, the basal ganglia loops cannot easily release movement: tremor at rest, stiffness and slowness follow. Levodopa, which the brain turns into dopamine, eases symptoms, and deep brain stimulation can help when drugs wear off unpredictably.',
    [['nigra', 'Substantia nigra (fading)', 'Loses its dark pigment as neurons die.'], ['putamen', 'Putamen', 'Starved of dopamine.'], ['caudate', 'Caudate', 'Also affected.'], ['pallidus', 'Globus pallidus', 'A target for deep brain stimulation.']],
    { view: TQ, q: 'Parkinson disease substantia nigra alpha-synuclein review', refs: ['poewe2017'] }),

  t('brain-tumour', 'Brain tumour', 'Glioblastoma', 'brain', { tumor: true, still: true },
    'Glioblastoma is the commonest malignant tumour that starts in the brain. It grows from glial cells and spreads tendrils into the surrounding tissue, which makes it impossible to remove completely. Its centre often dies off (necrosis) as it outgrows its blood supply, and fluid builds up around it (oedema), raising pressure in the skull.\n\nTreatment combines surgery, radiotherapy and chemotherapy with temozolomide. Despite this, it remains one of the hardest cancers to treat.',
    [['tumor', 'Tumour', 'Infiltrates beyond its visible edge.'], ['necrosis', 'Necrotic core', 'Dead tissue at the centre.'], ['edema', 'Oedema', 'Swelling around the tumour.']],
    { view: SIDE, q: 'glioblastoma treatment temozolomide review' }),

  t('ms-brain', 'Multiple sclerosis', 'Patches of lost myelin', 'brain', { mode: 'glass', lesions: true, still: true, deep: ['ventricles', 'callosum'] },
    'In multiple sclerosis (MS), the immune system attacks myelin, the insulating sheath around nerve fibres in the brain and spinal cord. Patches of damage (lesions or plaques) slow or block signals, causing symptoms such as blurred vision, numbness, weakness and fatigue that depend on where the lesions are.\n\nLesions often cluster around the ventricles. Most people start with relapses and recoveries. Disease-modifying drugs that dampen the immune attack have changed the outlook; infection with Epstein–Barr virus appears to be a necessary trigger for most cases.',
    [['lesions', 'MS lesions', 'Seen as bright spots on MRI.'], ['ventricles', 'Ventricles', 'Lesions often sit next to them.'], ['callosum', 'Corpus callosum', 'Another common site.']],
    { view: TQ, q: 'multiple sclerosis pathogenesis lesions', refs: ['bjornevik2022'] }),

  t('sleep-brain', 'The brain asleep', 'Clearing waste at night', 'brain', { mode: 'glass', glymph: true, still: true, deep: ['ventricles', 'hypothalamus', 'pineal'] },
    'Sleep is controlled by the hypothalamus and brainstem, timed by the body clock and by the build-up of sleep pressure through the day. Through the night we cycle through light sleep, deep slow-wave sleep and dreaming (REM) sleep about every 90 minutes.\n\nIn mice, the spaces between brain cells widen during sleep and cerebrospinal fluid flushes through more quickly, clearing waste products including amyloid (the glymphatic system). How important this is in humans is still being studied.',
    [['csf', 'Cerebrospinal fluid', 'Flows through the brain tissue along vessels.'], ['hypothalamus', 'Hypothalamus', 'Holds the master clock and sleep switches.'], ['pineal', 'Pineal gland', 'Releases melatonin in darkness.'], ['ventricles', 'Ventricles', 'Fluid reservoirs.']],
    { view: TQ, q: 'glymphatic system sleep clearance', refs: ['xie2013'] }),

  t('epilepsy', 'Epilepsy', 'Electrical storms in the brain', 'brain', { activity: true, still: true },
    'Neurons communicate with brief electrical pulses that are normally kept in balance by excitation and inhibition. A seizure is a burst of excessive, synchronised firing. It can start in one area (focal), causing twitching, odd sensations or absences depending on the place, or involve both hemispheres at once (generalised).\n\nEpilepsy means a tendency to have repeated seizures. Most people become seizure-free with medicines; for others, surgery to remove the starting point, nerve stimulators or special diets can help.',
    [['activity', 'Neural activity', 'Shown here as flashes over the cortex.'], ['temporal', 'Temporal lobe', 'The commonest place for focal seizures to start in adults.'], ['cortex', 'Cortex', 'Where most seizures arise.']],
    { view: SIDE, q: 'epilepsy seizure mechanisms treatment' }),

  t('smell-brain', 'Smell and the brain', 'A direct line to emotion', 'brain', { regions: ['smell'], mode: 'glass', still: true, deep: ['amygdala', 'hippocampus'] },
    'Smell is the only sense that does not pass through the thalamus first. Signals from the nose go straight to the olfactory bulbs under the frontal lobes and on to the olfactory cortex, which is closely wired to the amygdala and hippocampus.\n\nThat may be why smells can bring back vivid emotional memories so suddenly. Loss of smell can be an early sign of Parkinson’s and Alzheimer’s disease, and it was a common symptom of COVID-19.',
    [['smell', 'Olfactory area', 'Under the front of the brain.'], ['amygdala', 'Amygdala', 'Emotional response to smells.'], ['hippocampus', 'Hippocampus', 'Links smells with memories.']],
    { view: [-0.6, -0.5, 1], q: 'olfactory pathway emotion memory' }),
];
