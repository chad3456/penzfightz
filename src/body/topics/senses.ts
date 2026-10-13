import type { Topic } from '../types';
import { chapter, ctl } from './make';

const t = chapter('senses');
const EYE: [number, number, number] = [0.15, 0.25, 1], F: [number, number, number] = [0.3, 0.3, 1];
const DIST = ctl('distance', 'Looking at something', 0.5, 6, 6, 0.1, ' m');

export const SENSES: Topic[] = [
  t('eye', 'The eye', 'A living camera', 'senses', { mode: 'eye', still: true },
    'Light enters through the clear cornea, which does most of the focusing, passes through the pupil, and is fine-focused by the lens onto the retina at the back of the eye. The iris, a ring of muscle, widens or narrows the pupil to control how much light gets in.\n\nThe eyeball is about 24 mm across and filled with a clear jelly (the vitreous). The image on the retina is upside down; the brain turns it the right way up. Move the slider to look at something close and watch the lens thicken.',
    [['cornea', 'Cornea', 'Provides about two-thirds of the focusing power.'], ['iris', 'Iris', 'Gives eyes their colour.'], ['pupil', 'Pupil', ''], ['lens', 'Lens', 'Changes shape to focus.'], ['ciliary', 'Ciliary muscle', 'Adjusts the lens.'], ['vitreous', 'Vitreous', ''], ['retina', 'Retina', 'The light-sensitive layer.'], ['macula', 'Macula and fovea', 'The centre of sharp vision.'], ['nerve', 'Optic nerve', 'Its exit makes the blind spot.'], ['sclera', 'Sclera', 'The white of the eye.'], ['choroid', 'Choroid', 'A blood-rich layer feeding the retina.']],
    { view: EYE, controls: [DIST], q: 'eye anatomy optics accommodation' }),

  t('short-sight', 'Short sight', 'Myopia', 'senses', { mode: 'eye', focus: 'myopia', still: true },
    'In short sight the eye is slightly too long, or focuses too strongly, so light from distant objects comes to a focus in front of the retina and they look blurred; close objects are still clear. Glasses or contact lenses with a diverging (concave) lens correct it, and laser surgery can reshape the cornea.\n\nMyopia has become much commoner worldwide, affecting the majority of young people in parts of East Asia. Time outdoors in childhood is linked with lower risk.',
    [['lens', 'Lens', ''], ['retina', 'Retina', 'The focus falls in front of it.'], ['cornea', 'Cornea', 'Can be reshaped by laser.']],
    { view: EYE, controls: [DIST], q: 'myopia prevalence outdoor time prevention' }),

  t('long-sight', 'Long sight and presbyopia', 'Struggling with near things', 'senses', { mode: 'eye', focus: 'hyperopia', still: true },
    'In long sight (hyperopia) the eye is slightly too short, so light focuses behind the retina; young people can often compensate by focusing harder, but close work becomes tiring. A converging (convex) lens corrects it.\n\nPresbyopia is different: from the mid-forties the lens stiffens and can no longer thicken enough to focus close up, which is why most people eventually need reading glasses.',
    [['lens', 'Lens', 'Stiffens with age.'], ['retina', 'Retina', 'The focus falls behind it.'], ['ciliary', 'Ciliary muscle', 'Works harder to compensate.']],
    { view: EYE, controls: [DIST], q: 'hyperopia presbyopia lens accommodation' }),

  t('cataract', 'Cataract', 'A cloudy lens', 'senses', { mode: 'eye', cataract: true, still: true },
    'The lens is made of tightly packed proteins arranged so precisely that it is transparent. With age, sunlight, diabetes or smoking, those proteins clump and the lens turns cloudy and yellow: a cataract. Vision becomes blurred and dim, colours fade and lights glare.\n\nCataract is the leading cause of blindness worldwide, yet it is curable: in a short operation the cloudy lens is broken up and replaced with a clear plastic one.',
    [['lens', 'Cloudy lens', ''], ['retina', 'Retina', 'Receives less light.'], ['cornea', 'Cornea', 'The surgeon works through a tiny cut here.']],
    { view: EYE, q: 'cataract global blindness surgery' }),

  t('glaucoma', 'Glaucoma', 'Damage to the optic nerve', 'senses', { mode: 'eye', glaucoma: true, still: true },
    'The eye is constantly topped up with a clear fluid that drains out at the angle between the iris and cornea. In glaucoma, often but not always because the drainage is poor and pressure rises, the optic nerve fibres are slowly damaged.\n\nSide vision is lost first, so people often do not notice until a lot has gone, and the damage cannot be reversed. Regular eye checks find it early; eye drops, laser or surgery lower the pressure and protect what remains.',
    [['nerve', 'Optic nerve', 'Its fibres die.'], ['iris', 'Iris and drainage angle', ''], ['retina', 'Retina', '']],
    { view: EYE, q: 'glaucoma intraocular pressure optic neuropathy' }),

  t('retina', 'The retina', 'Rods, cones and wiring', 'senses', { mode: 'retina', still: true },
    'The retina is a thin sheet of brain tissue at the back of the eye. Light has to pass through layers of nerve cells before it reaches the photoreceptors at the back: about 120 million rods for dim light, and about 6 million cones for colour and detail, concentrated in the fovea.\n\nPhotoreceptors pass their signals through bipolar cells to ganglion cells, whose axons form the optic nerve. A dark pigment layer behind them absorbs stray light and recycles the light-sensitive pigment.',
    [['light', 'Incoming light', 'Travels through the other layers first.'], ['rods', 'Rods', 'Very sensitive; no colour.'], ['cones', 'Cones', 'Three types: red, green and blue sensitive.'], ['bipolar', 'Bipolar cells', ''], ['ganglion', 'Ganglion cells', 'Their axons make the optic nerve.'], ['pigment', 'Pigment epithelium', ''], ['nerve', 'Nerve fibres', '']],
    { view: [0.3, 0.2, 1], q: 'retina photoreceptors rods cones circuitry' }),

  t('ear', 'The ear', 'From sound wave to nerve signal', 'senses', { mode: 'ear', still: true },
    'The outer ear funnels sound waves down the ear canal to the eardrum, which vibrates. Three tiny bones in the middle ear, the malleus, incus and stapes, pass the vibrations on and concentrate them onto a small window in the fluid-filled cochlea of the inner ear.\n\nNext to the cochlea, three semicircular canals and two small sacs sense head movement and gravity, giving us balance. The Eustachian tube links the middle ear to the throat and equalises pressure, which is why ears pop.',
    [['pinna', 'Outer ear', ''], ['canal', 'Ear canal', 'About 2.5 cm long.'], ['eardrum', 'Eardrum', ''], ['ossicles', 'Ossicles', 'The smallest bones in the body.'], ['cochlea', 'Cochlea', 'Turns vibration into nerve signals.'], ['canals', 'Semicircular canals', 'Detect rotation.'], ['nerve', 'Auditory nerve', ''], ['eustachian', 'Eustachian tube', '']],
    { view: [0.2, 0.2, 1], q: 'auditory system anatomy middle ear ossicles' }),

  t('cochlea', 'Hair cells and pitch', 'How the cochlea hears', 'senses', { mode: 'cochlea', still: true },
    'Inside the cochlea, a long membrane (the basilar membrane) runs along the spiral. Sound sets up a travelling wave in it that peaks at a particular place depending on pitch: high notes near the base, low notes near the tip. The cochlea is shown uncoiled here; change the frequency to move the peak.\n\nRows of hair cells sit on the membrane, with tiny bundles touching an overlying membrane. When they bend, channels open and the cells signal the auditory nerve. Loud noise damages hair cells, and in humans they do not grow back.',
    [['basilar', 'Basilar membrane', 'Stiff at the base, floppy at the apex.'], ['hair', 'Hair cells', 'About 15,000 per ear.'], ['tectorial', 'Tectorial membrane', ''], ['nerve', 'Auditory nerve fibres', ''], ['base', 'Base', 'High frequencies.'], ['apex', 'Apex', 'Low frequencies.']],
    { view: [0.2, 0.6, 1], controls: [ctl('freq', 'Pitch', 20, 20000, 1000, 10, ' Hz')], q: 'cochlea tonotopy hair cells noise-induced hearing loss' }),

  t('skin', 'The skin', 'The largest organ', 'senses', { mode: 'skin', still: true },
    'Skin covers about 1.8 square metres and weighs several kilograms. The outer epidermis is a waterproof barrier of cells that are made at its base, flatten as they rise and are shed from the surface. Beneath it, the dermis holds collagen and elastic fibres, blood vessels, nerves, hair follicles, sweat glands and oil glands. Below that is a layer of fat.\n\nSkin keeps water in and germs out, controls temperature by sweating and adjusting blood flow, makes vitamin D in sunlight, and senses touch, pressure, temperature and pain.',
    [['epidermis', 'Epidermis', 'Renewed about every 4 weeks.'], ['dermis', 'Dermis', ''], ['fat', 'Subcutaneous fat', ''], ['hair', 'Hair', ''], ['follicle', 'Hair follicle', ''], ['sweat', 'Sweat gland', 'About 2–4 million of them.'], ['oil', 'Sebaceous gland', ''], ['vessels', 'Blood vessels', ''], ['receptor', 'Pressure receptor', 'Pacinian corpuscle, deep in the dermis.'], ['nerve', 'Touch receptor', ''], ['melanin', 'Melanocytes', 'Make pigment.']],
    { view: F, q: 'skin structure function layers' }),

  t('sunburn', 'Sunburn and UV', 'Damage to skin DNA', 'senses', { mode: 'skin', burn: 0.4, still: true },
    'Ultraviolet light from the sun damages DNA in skin cells, mainly by welding neighbouring bases together. In sunburn, so many cells are damaged that the skin becomes inflamed, red and painful a few hours later; badly damaged cells kill themselves and peel.\n\nMelanin from melanocytes absorbs UV and shields the cell nucleus, which is why tanning is a response to damage, not protection from it. Repeated burns, especially in childhood, raise the risk of skin cancers including melanoma.',
    [['burn', 'Burned area', ''], ['epidermis', 'Epidermis', 'Takes most of the damage.'], ['melanin', 'Melanin', 'A natural sunscreen.'], ['vessels', 'Dilated vessels', 'Cause the redness.']],
    { view: F, controls: [ctl('burn', 'Depth', 0.1, 1, 0.4, 0.05)], q: 'ultraviolet DNA damage sunburn melanoma risk' }),

  t('burns', 'Burns', 'How deep they go', 'senses', { mode: 'skin', burn: 0.8, still: true },
    'Burns are graded by depth. Superficial burns affect only the epidermis and heal in days. Partial-thickness burns reach into the dermis and blister; deep ones damage hair follicles and glands. Full-thickness burns destroy the whole skin and its nerves, so they may be painless, and need skin grafts.\n\nFirst aid is to cool the burn under cool running water for 20 minutes. Large burns threaten life through fluid loss and infection.',
    [['burn', 'Burn', ''], ['epidermis', 'Epidermis', ''], ['dermis', 'Dermis', 'Partial-thickness burns reach here.'], ['fat', 'Fat', 'Full-thickness burns reach here.']],
    { view: F, controls: [ctl('burn', 'Depth', 0.1, 1.4, 0.8, 0.05)], q: 'burn depth classification first aid cooling' }),

  t('smell', 'Smell', 'Hundreds of receptors', 'senses', { mode: 'nose', still: true },
    'High in the nose is a patch of tissue holding millions of olfactory neurons. Each makes just one of about 400 kinds of odour receptor; an odour molecule activates a particular combination of them, so we can tell apart a huge number of smells.\n\nThe neurons send their axons up through small holes in the skull to the olfactory bulb. They are among the few neurons replaced throughout life. Linda Buck and Richard Axel won the 2004 Nobel Prize for discovering the receptor family.',
    [['odor', 'Odour molecules', ''], ['receptor', 'Olfactory neurons', ''], ['epithelium', 'Olfactory epithelium', 'About the size of a postage stamp.'], ['bone', 'Cribriform plate', 'A sieve of bone.'], ['bulb', 'Olfactory bulb', '']],
    { view: [0.2, 0.2, 1], q: 'olfactory receptors combinatorial coding' }),

  t('taste', 'Taste', 'Five basic tastes', 'senses', { mode: 'taste', still: true },
    'Taste buds are onion-shaped clusters of 50 to 100 cells, found mostly on the bumps (papillae) of the tongue. Different cells detect sweet, sour, salty, bitter and umami (savoury); every region of the tongue can sense all five, so the old “tongue map” is a myth.\n\nMuch of what we call flavour actually comes from smell, which is why food tastes bland with a blocked nose. Taste cells are replaced every one to two weeks.',
    [['bud', 'Taste bud', ''], ['cells', 'Taste receptor cells', ''], ['pore', 'Taste pore', 'Where dissolved food reaches the cells.'], ['papilla', 'Papillae', ''], ['nerve', 'Nerve', '']],
    { view: [0.2, 0.4, 1], q: 'taste receptor cells taste bud tongue map' }),

  t('balance', 'Balance', 'The vestibular system', 'senses', { mode: 'ear', still: true },
    'The inner ear holds three semicircular canals at right angles to each other, filled with fluid. When the head turns, the fluid lags behind and bends hair cells, signalling rotation in that plane. Two small sacs nearby contain tiny crystals that sense gravity and straight-line acceleration.\n\nThe brain combines these signals with vision and body position to keep us upright and the eyes steady. When the signals disagree, as at sea, the result can be motion sickness.',
    [['canals', 'Semicircular canals', ''], ['cochlea', 'Cochlea', 'Next door, for hearing.'], ['nerve', 'Vestibular nerve', '']],
    { view: [0.2, 0.2, 1], q: 'vestibular system semicircular canals otolith' }),

  t('touch', 'Touch', 'Receptors in the skin', 'senses', { mode: 'skin', still: true },
    'Several kinds of receptor in the skin respond to different aspects of touch: light touch and texture, vibration, stretch, deep pressure, as well as heat, cold, itch and pain. Fingertips and lips have the most, which is why they are so sensitive.\n\nPacinian corpuscles, onion-like capsules deep in the dermis, respond to vibration; free nerve endings sense pain and temperature. Ardem Patapoutian shared the 2021 Nobel Prize for finding PIEZO channels that open when touch receptors are stretched.',
    [['receptor', 'Pacinian corpuscle', 'Vibration.'], ['nerve', 'Nerve ending', ''], ['epidermis', 'Epidermis', ''], ['dermis', 'Dermis', '']],
    { view: F, q: 'cutaneous mechanoreceptors PIEZO touch' }),
];
