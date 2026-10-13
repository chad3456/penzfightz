import type { Topic } from '../types';
import { chapter, ctl } from './make';

const t = chapter('bones');
const F: [number, number, number] = [0.3, 0.2, 1];

export const BONES: Topic[] = [
  t('skeleton', 'The skeleton', '206 bones', 'body', { show: ['skeleton'], still: true },
    'The adult skeleton has 206 bones; a newborn has around 300, many of which fuse as they grow. It holds the body up, protects the brain, heart and lungs, anchors muscles so we can move, stores calcium and phosphate, and houses the bone marrow that makes blood.\n\nMore than half the bones are in the hands and feet. The smallest, the stapes in the middle ear, is about 3 millimetres long; the largest is the femur.',
    [['skull', 'Skull', '22 bones, mostly locked together.'], ['spine', 'Spine', '33 vertebrae, some fused.'], ['ribs', 'Ribcage', '12 pairs of ribs.'], ['pelvis', 'Pelvis', 'Bears the weight of the upper body.'], ['femur', 'Femur', 'The longest bone, about a quarter of your height.'], ['humerus', 'Humerus', 'The upper arm bone.']],
    { view: [0.1, 0.05, 1], q: 'human skeleton functions bone count' }),

  t('long-bone', 'Inside a bone', 'Living, layered and full of marrow', 'bones', { mode: 'bone', still: true },
    'Bone is a living tissue of collagen fibres hardened with calcium phosphate crystals: the collagen gives flexibility, the mineral hardness. A long bone has a shell of dense compact bone round a shaft hollow with marrow, and ends filled with spongy bone, a lattice of struts aligned with the forces it carries.\n\nIn children a growth plate of cartilage near each end lets the bone lengthen. Blood vessels enter through small holes, and a tough skin, the periosteum, covers the outside.',
    [['compact', 'Compact bone', 'Dense outer shell.'], ['spongy', 'Spongy bone', 'Light but strong lattice.'], ['red', 'Red marrow', 'Makes blood cells.'], ['marrow', 'Yellow marrow', 'Mostly fat in adult long bones.'], ['plate', 'Growth plate', 'Closes after puberty.'], ['cartilage', 'Articular cartilage', 'Smooth joint surface.'], ['periosteum', 'Periosteum', 'Carries nerves; why bone injuries hurt.'], ['vessel', 'Nutrient artery', '']],
    { view: [0, 0.1, 1], q: 'bone structure cortical trabecular marrow' }),

  t('osteon', 'The osteon', 'The building block of compact bone', 'bones', { mode: 'osteon', still: true },
    'Compact bone is made of osteons: cylinders of concentric layers (lamellae) around a central canal carrying blood vessels and nerves, running along the length of the bone. Bone cells (osteocytes) live in small spaces between the layers, linked to each other by hair-thin channels.\n\nOsteocytes sense strain and direct the cells that remove and lay down bone, so the skeleton constantly remodels itself, replacing about a tenth of itself each year.',
    [['lamellae', 'Lamellae', 'Collagen fibres in alternating directions.'], ['canal', 'Haversian canal', 'Blood vessels.'], ['nerve', 'Nerve', ''], ['osteocyte', 'Osteocytes', 'The most numerous bone cells.'], ['volkmann', 'Volkmann canal', 'Connects canals sideways.']],
    { view: F, q: 'osteon Haversian system osteocyte mechanosensing' }),

  t('osteoporosis', 'Osteoporosis', 'Thinning bones', 'bones', { mode: 'bone', osteoporosis: true, still: true },
    'Throughout life, bone is broken down by osteoclasts and rebuilt by osteoblasts. After about age 30 the balance slowly tips toward loss, and in women it speeds up after menopause, when oestrogen falls. In osteoporosis the spongy struts thin and break and the compact shell thins, so bones fracture easily, especially the hip, spine and wrist.\n\nExercise, enough calcium and vitamin D, and not smoking build and protect bone. Drugs that slow breakdown or stimulate formation reduce fractures.',
    [['spongy', 'Thinned spongy bone', 'Fewer, thinner struts.'], ['compact', 'Thinner shell', ''], ['marrow', 'Marrow', 'Takes up more space.']],
    { view: [0, 0.1, 1], q: 'osteoporosis pathophysiology fracture prevention' }),

  t('knee', 'The knee', 'A hinge held by ligaments', 'bones', { mode: 'knee', still: true },
    'The knee is the largest joint in the body. The rounded end of the femur rocks and glides on the flatter top of the tibia, cushioned by two C-shaped pads of cartilage (the menisci). Four strong ligaments hold it together: two collateral ligaments at the sides and two cruciate ligaments crossing inside.\n\nAll joint surfaces are covered in slippery articular cartilage and bathed in lubricating fluid, giving less friction than ice on ice. Drag the slider to bend it.',
    [['femur', 'Femur', ''], ['tibia', 'Tibia', ''], ['patella', 'Kneecap', 'Increases the leverage of the thigh muscle.'], ['cartilage', 'Articular cartilage', 'No blood supply; heals poorly.'], ['meniscus', 'Menisci', 'Shock absorbers.'], ['acl', 'Anterior cruciate ligament', 'Stops the tibia sliding forward.'], ['pcl', 'Posterior cruciate ligament', ''], ['mcl', 'Medial collateral ligament', ''], ['lcl', 'Lateral collateral ligament', '']],
    { view: [0.6, 0.2, 1], controls: [ctl('bend', 'Bend', 0, 120, 25, 1, '°')], q: 'knee joint anatomy ligaments menisci' }),

  t('acl-tear', 'ACL tear', 'A common sports injury', 'bones', { mode: 'knee', acl: true, still: true },
    'The anterior cruciate ligament runs diagonally inside the knee and stops the shin bone sliding forward and twisting. It most often tears in sports with sudden stops, landings and changes of direction, sometimes with a pop and rapid swelling.\n\nWithout it the knee can give way. Some people manage with physiotherapy; athletes usually have it reconstructed using a graft of their own tendon, followed by months of rehabilitation.',
    [['acl', 'Torn ACL', ''], ['meniscus', 'Menisci', 'Often injured at the same time.'], ['femur', 'Femur', ''], ['tibia', 'Tibia', '']],
    { view: [0.6, 0.2, 1], controls: [ctl('bend', 'Bend', 0, 120, 30, 1, '°')], q: 'anterior cruciate ligament injury reconstruction' }),

  t('osteoarthritis', 'Osteoarthritis', 'Worn joint surfaces', 'bones', { mode: 'knee', arthritis: true, still: true },
    'Osteoarthritis is the commonest joint disease. The cartilage covering the bone ends roughens and thins, the joint lining becomes inflamed, and the bone underneath reacts by thickening and growing spurs (osteophytes). It causes pain, stiffness and reduced movement, often in knees, hips and hands.\n\nIt is not just wear and tear: age, previous injury, weight and genes all play a part. Exercise and weight loss help; badly damaged joints can be replaced.',
    [['cartilage', 'Thinned cartilage', ''], ['spur', 'Bone spurs', ''], ['meniscus', 'Menisci', 'Often degenerate.'], ['femur', 'Femur', '']],
    { view: [0.6, 0.2, 1], controls: [ctl('bend', 'Bend', 0, 120, 15, 1, '°')], q: 'osteoarthritis pathogenesis management' }),

  t('hip', 'The hip', 'A ball and socket', 'bones', { mode: 'hip', still: true },
    'The hip joint is a deep ball and socket: the round head of the femur fits into the cup-shaped acetabulum of the pelvis, allowing movement in every direction while staying very stable. A rim of cartilage, the labrum, deepens the socket.\n\nThe narrow neck of the femur is where many fractures happen in older people with osteoporosis. Hip replacement, in which both ball and socket are replaced, is one of the most successful operations in medicine.',
    [['pelvis', 'Pelvis', ''], ['socket', 'Acetabulum', 'The socket.'], ['head', 'Femoral head', 'The ball.'], ['neck', 'Femoral neck', 'A common fracture site.'], ['femur', 'Femur', ''], ['cartilage', 'Cartilage', 'Lines both surfaces.']],
    { view: [0.5, 0.1, 1], q: 'hip joint anatomy hip fracture arthroplasty' }),

  t('spine', 'The spine', 'Vertebrae and discs', 'bones', { mode: 'spine', still: true },
    'The spine is a column of 33 vertebrae: 7 in the neck, 12 in the chest, 5 in the lower back, plus the fused sacrum and coccyx. Each vertebra has a solid body at the front that bears weight, and an arch at the back that encloses the spinal cord.\n\nBetween the bodies lie intervertebral discs: a tough fibrous ring around a soft, gel-like centre, acting as shock absorbers. Seen from the side, the spine curves in an S shape that spreads load.',
    [['vertebra', 'Vertebra', ''], ['disc', 'Disc', 'About a quarter of the spine’s length.'], ['nucleus', 'Nucleus pulposus', 'The gel centre.'], ['cord', 'Spinal cord', ''], ['root', 'Nerve roots', ''], ['spinous', 'Spinous process', 'The bumps you can feel down your back.']],
    { view: [1, 0.3, 0.6], q: 'vertebral column anatomy intervertebral disc' }),

  t('slipped-disc', 'Slipped disc', 'A bulge that presses on a nerve', 'bones', { mode: 'spine', hernia: true, still: true },
    'With age or strain, the fibrous ring of a disc can crack, letting the soft centre bulge out (a herniated or “slipped” disc). If it presses on a nearby nerve root it causes pain, numbness or weakness along that nerve: in the lower back, the familiar shooting pain down the leg called sciatica.\n\nMost improve within weeks to months with activity and pain relief; surgery is for severe or persisting cases.',
    [['hernia', 'Herniated disc', ''], ['root', 'Compressed nerve root', ''], ['disc', 'Disc', ''], ['vertebra', 'Vertebra', '']],
    { view: [1, 0.3, 0.6], q: 'lumbar disc herniation sciatica natural history' }),

  t('sarcomere', 'How muscle contracts', 'The sliding filaments', 'bones', { mode: 'sarcomere', still: true },
    'Muscle fibres are packed with repeating units called sarcomeres, about 2.5 micrometres long. Thin filaments of actin are anchored to the Z-discs at each end; thick filaments of myosin sit in the middle, overlapping them.\n\nWhen a nerve signal releases calcium inside the fibre, myosin heads grab actin, pivot, let go and grab again, pulling the thin filaments toward the centre. Thousands of sarcomeres shortening at once shorten the whole muscle. Each stroke uses ATP. Drag the slider to contract.',
    [['actin', 'Actin (thin filaments)', ''], ['myosin', 'Myosin (thick filaments)', ''], ['heads', 'Myosin heads', 'The motors.'], ['zdisc', 'Z-discs', 'Mark the ends of a sarcomere.'], ['titin', 'Titin', 'A giant spring protein.']],
    { view: [0.2, 0.3, 1], controls: [ctl('contract', 'Contraction', 0, 1, 0, 0.05)], q: 'sliding filament theory cross-bridge cycle' }),

  t('muscle-structure', 'Muscle, unpacked', 'From muscle to myofibril', 'bones', { mode: 'muscle', still: true },
    'A skeletal muscle is a bundle of bundles. The whole muscle, wrapped in connective tissue, is made of fascicles; each fascicle holds dozens to hundreds of muscle fibres, single long cells with many nuclei; each fibre is packed with myofibrils, chains of sarcomeres.\n\nThe connective tissue wrappings merge at each end into a tendon that pulls on bone. There are about 600 skeletal muscles in the body.',
    [['muscle', 'Muscle', ''], ['fascicle', 'Fascicle', ''], ['fiber', 'Muscle fibre', 'Can be many centimetres long.'], ['myofibril', 'Myofibril', 'Chains of sarcomeres.'], ['tendon', 'Tendon', 'Collagen, very strong in tension.']],
    { view: [0.2, 0.3, 1], q: 'skeletal muscle structure hierarchy' }),

  t('fracture-healing', 'How a broken bone heals', 'Clot, callus, remodelling', 'bones', { mode: 'fracture', still: true },
    'A broken bone heals in overlapping stages. First a blood clot (haematoma) forms around the break and inflammation brings in repair cells. Within days to weeks they build a soft callus of cartilage and fibrous tissue that bridges the gap, which is gradually turned into a hard callus of woven bone.\n\nOver months to years the callus is remodelled back into normal bone shape. Holding the ends still, with a cast or metal fixation, lets this happen in the right position.',
    [['break', 'Fracture', ''], ['hematoma', 'Haematoma', ''], ['callus', 'Callus', 'Soft, then hard.'], ['bone', 'Bone', 'Remodelled over time.']],
    { view: F, steps: [['Break', 'The bone cracks.'], ['Haematoma', 'A clot forms.'], ['Soft callus', 'Cartilage bridges the gap.'], ['Hard callus', 'New bone forms.'], ['Remodelled', 'Shape restored.']], q: 'fracture healing stages callus' }),

  t('skull', 'The skull', 'Plates locked by sutures', 'bones', { mode: 'skull', still: true },
    'The skull has 22 bones. Eight form the cranium, which encloses the brain: one frontal, two parietal, two temporal, one occipital, and two at the base. The rest form the face; only the lower jaw moves.\n\nThe cranial bones meet at wavy seams called sutures that slowly fuse in adulthood. The temporal bones house the delicate parts of the ear.',
    [['frontal', 'Frontal bone', 'The forehead.'], ['parietal', 'Parietal bones', 'Top and sides.'], ['temporal', 'Temporal bones', 'Contain the ear.'], ['occipital', 'Occipital bone', 'The back, with a hole for the spinal cord.'], ['mandible', 'Mandible', 'The lower jaw.'], ['suture', 'Sutures', 'Fibrous joints between bones.']],
    { view: [0.6, 0.2, 1], q: 'skull anatomy cranial bones sutures' }),

  t('baby-skull', 'A baby’s skull', 'Soft spots and growth', 'bones', { mode: 'skull', baby: true, still: true },
    'At birth the skull bones are not yet joined. Gaps between them, the fontanelles, let the head mould slightly during birth and give room for the very fast growth of the brain, which doubles in size in the first year.\n\nThe larger front fontanelle usually closes by about 18 months to 2 years. If sutures close too early (craniosynostosis), the skull grows in an abnormal shape and may need surgery.',
    [['fontanelle', 'Anterior fontanelle', 'The “soft spot”.'], ['suture', 'Sutures', 'Still open.'], ['frontal', 'Frontal bone', 'Still two halves at birth.']],
    { view: [0.3, 0.6, 1], q: 'fontanelle closure infant skull growth' }),

  t('muscles', 'The muscles', 'About 600 of them', 'body', { show: ['muscles', 'skeleton'], still: true },
    'Skeletal muscles make up about 40% of body weight in many adults. They work in pairs across joints: as one contracts, its opposite relaxes, since muscles can only pull, never push. They also keep us upright, stabilise joints and produce most of our body heat.\n\nThe body has two other kinds of muscle: cardiac muscle in the heart, and smooth muscle in the walls of the gut, blood vessels and airways, which works without conscious control.',
    [['muscles', 'Skeletal muscle', ''], ['pectoral', 'Pectoral muscles', ''], ['quadriceps', 'Quadriceps', 'Straighten the knee.'], ['skull', 'Skeleton', 'The levers they pull on.']],
    { view: [0.1, 0.05, 1], q: 'skeletal muscle mass function' }),

  t('rheumatoid', 'Rheumatoid arthritis', 'When the immune system attacks joints', 'bones', { mode: 'knee', arthritis: true, still: true },
    'In rheumatoid arthritis the immune system attacks the lining of the joints (the synovium), which becomes inflamed and thickened and releases enzymes that erode cartilage and bone. It usually affects small joints of the hands and feet on both sides, with morning stiffness.\n\nUnlike osteoarthritis, it is a whole-body autoimmune disease. Starting disease-modifying drugs early, including methotrexate and biologics that block inflammatory signals such as TNF, prevents much of the joint damage.',
    [['cartilage', 'Eroded cartilage', ''], ['femur', 'Bone', 'Erosions at the joint margins.'], ['meniscus', 'Joint', 'Swollen and painful.']],
    { view: [0.6, 0.2, 1], controls: [ctl('bend', 'Bend', 0, 120, 20, 1, '°')], q: 'rheumatoid arthritis pathogenesis treatment' }),
];
