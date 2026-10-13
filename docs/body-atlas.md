# Body Atlas

How the human body works, in 321 interactive 3D models in eighteen chapters. Open it from the Effects shelf (**Body Atlas**).

Every topic has a 3D model you can turn and zoom, numbered parts (tap one to fly to it and read what it does), a short plain-language explanation, facts worth knowing, and links for further reading: references checked against PubMed where the topic cites one, and a ready-made PubMed search for every topic. Many topics also have **steps** (play a process through: a heartbeat, a synapse firing, a T cell killing, DNA being copied) and **sliders** that change the model (heart rate, wall thickness, airway tightening, cut-away, brain atrophy, knee bend, pitch in the cochlea, bladder filling).

It is for learning, not medical advice. Models are simplified and not to scale unless stated.

## Chapters

| Chapter | Topics | Examples |
| --- | --- | --- |
| The Whole Body | 10 | body map, organ systems, homeostasis, temperature, exercise |
| Heart | 20 | four chambers with valves and blood flow, cardiac cycle, conduction, ECG, heart attack, stent, bypass, AF, pacemaker, valve disease |
| Blood Vessels | 18 | artery wall layers, vein valves, capillary bed, blood pressure, atherosclerosis, LDL, aneurysm, DVT, varicose veins, blood–brain barrier |
| Blood | 16 | red cells, haemoglobin, white cells, platelets and clotting, blood groups, marrow, anaemia, sickle cell, leukaemia, malaria, sepsis |
| Brain | 25 | lobes, folds, limbic system, hippocampus, basal ganglia, ventricles, grey and white matter, language, vision, stroke, Alzheimer’s, Parkinson’s, MS |
| Neurons & Nerves | 19 | the neuron, action potential, myelin, synapse, dopamine, SSRIs, GABA, glutamate, neuromuscular junction, reflex arc, glia, pain |
| Lungs & Breathing | 16 | airway tree, breathing, alveoli, gas exchange, asthma, COPD, pneumonia, COVID-19, lung cancer, cystic fibrosis, TB |
| Digestion & Liver | 19 | the journey of a meal, teeth, stomach, ulcers, villi, coeliac, liver and lobule, cirrhosis, islets, microbiome, IBD |
| Kidneys | 11 | nephron, glomerulus, concentrating urine, stones, bladder, dialysis, diabetes, renin–angiotensin |
| Immune System | 19 | macrophages, neutrophils, inflammation, antibodies, B and T cells, NK cells, complement, vaccines, mRNA vaccines, allergy, autoimmunity |
| Viruses | 30 | SARS-CoV-2, influenza, HIV, Ebola, measles, rabies, adenovirus, polio, HPV, hepatitis B and C, herpes, mpox, norovirus, phage T4, life cycles, variants |
| Bacteria & Microbes | 15 | the bacterial cell, shapes, Gram stain, fission, flagella, biofilms, antibiotics, resistance, cholera, spores, fungi |
| Cancer | 20 | hallmarks, mutations, tumour growth, angiogenesis, metastasis, checkpoint drugs, CAR-T, chemo, radiotherapy, targeted therapy, liquid biopsy, BRCA |
| The Cell | 16 | cutaway cell, nucleus, mitochondria, membrane, ER and Golgi, motor proteins, mitosis, meiosis, apoptosis, ATP synthase, stem cells |
| DNA & Genes | 20 | double helix, replication, transcription, translation, mutations, chromatin, karyotype, CRISPR, PCR, epigenetics, splicing, protein folding |
| Bones, Joints & Muscle | 17 | inside a bone, osteon, osteoporosis, knee, ACL, arthritis, hip, spine, slipped disc, sarcomere, fracture healing, skull |
| Senses & Skin | 15 | the eye, short and long sight, cataract, glaucoma, retina, ear, cochlea, skin, sunburn, burns, smell, taste, balance, touch |
| Hormones | 14 | glands, insulin, type 1 and 2 diabetes, glucagon, thyroid, stress, pituitary, melatonin, appetite, how hormones act |

## How it is made

Everything is generated in code with three.js through @react-three/fiber; there are no model files or textures.

- `src/body/kit.ts`: seeded randomness, 3D simplex noise, displacement, variable-radius tubes, branching trees (vessels, bronchi, dendrites), materials.
- `src/body/sdf.ts`: signed distance fields (ellipsoids, capsules, tubes along curves, smooth unions) and a surface-nets mesher that labels every triangle with the part nearest to it. The heart, brain, lungs, liver, kidney, stomach, skull and joints are built this way, so each part can be highlighted and cut open.
- `src/body/stage.tsx`: the shared scene context, anchors (numbered pins that fade on the far side), and highlight materials that glow when a part is chosen.
- `src/body/Scene.tsx`: the stage: light panels for reflections (no image files), bloom, vignette, a camera that frames each model and flies to the chosen part.
- `src/body/engines/`: thirteen engines. `virus` (parametric viruses and the phage), `micro` (a small scene language of cells and molecules whose positions, sizes and glow change with each step), `heart` (beating, sectioned, conduction), `brain` (folded cortex, deep structures, slices, overlays), `neuron` (neuron, synapse, network, reflex, glia), `dna` (base-pair helix, replication, transcription, translation, CRISPR, chromatin, karyotype, protein), `cell`, `lungs`, `vessel`, `body`, `organs`, `senses`, `bones`.
- `src/body/topics/`: one file per chapter; `make.ts` is the shorthand for writing a topic. `src/body/refs.ts` holds the references.
- `src/body/Atlas.tsx`: home page, chapter pages, search, and the topic viewer (topic list, 3D stage, steps, sliders, parts, facts, references). A topic can be opened directly with `?t=<id>`.

## References

References were checked against PubMed; where the PubMed record itself was confirmed the PMID is linked, otherwise the article is linked by DOI. Every topic also offers a PubMed search. A PubMed connector for Claude can be added to search the literature directly.
