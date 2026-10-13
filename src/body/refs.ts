/**
 * References, each checked against PubMed. Where the PubMed record itself
 * was confirmed, the PMID is given; otherwise the article is linked by its
 * DOI. Topics point at these by key, and every topic also carries its own
 * PubMed search for further reading.
 */
export interface Ref { cite: string; pmid?: string; url?: string }
const doi = (d: string) => `https://doi.org/${d}`;
export const REFS: Record<string, Ref> = {
  hallmarks2022: { cite: 'Hanahan D. Hallmarks of cancer: new dimensions. Cancer Discov. 2022;12(1):31–46.', pmid: '35022204' },
  zhou2020: { cite: 'Zhou P, et al. A pneumonia outbreak associated with a new coronavirus of probable bat origin. Nature. 2020;579:270–273.', pmid: '32015507' },
  krammer2018: { cite: 'Krammer F, et al. Influenza. Nat Rev Dis Primers. 2018;4:3.', url: doi('10.1038/s41572-018-0002-y') },
  deeks2015: { cite: 'Deeks SG, Overbaugh J, Phillips A, Buchbinder S. HIV infection. Nat Rev Dis Primers. 2015;1:15035.', pmid: '27188527' },
  jacob2020: { cite: 'Jacob ST, et al. Ebola virus disease. Nat Rev Dis Primers. 2020;6:13.', url: doi('10.1038/s41572-020-0147-3') },
  mina2019: { cite: 'Mina MJ, et al. Measles virus infection diminishes preexisting antibodies that offer protection from other pathogens. Science. 2019;366:599–606.', pmid: '31672891' },
  fooks2017: { cite: 'Fooks AR, et al. Rabies. Nat Rev Dis Primers. 2017;3:17091.', pmid: '29188797' },
  lei2020: { cite: 'Lei J, et al. HPV vaccination and the risk of invasive cervical cancer. N Engl J Med. 2020;383:1340–1348.', pmid: '32997908' },
  bjornevik2022: { cite: 'Bjornevik K, et al. Longitudinal analysis reveals high prevalence of Epstein-Barr virus associated with multiple sclerosis. Science. 2022;375:296–301.', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=' + encodeURIComponent('Longitudinal analysis reveals high prevalence of Epstein-Barr virus associated with multiple sclerosis') },
  libby2019: { cite: 'Libby P, et al. Atherosclerosis. Nat Rev Dis Primers. 2019;5:56.', url: doi('10.1038/s41572-019-0106-z') },
  ettehad2016: { cite: 'Ettehad D, et al. Blood pressure lowering for prevention of cardiovascular disease and death: a systematic review and meta-analysis. Lancet. 2016;387:957–967.', url: doi('10.1016/S0140-6736(15)01225-8') },
  ference2017: { cite: 'Ference BA, et al. Low-density lipoproteins cause atherosclerotic cardiovascular disease. 1. Evidence from genetic, epidemiologic, and clinical studies. A consensus statement from the European Atherosclerosis Society Consensus Panel. Eur Heart J. 2017;38:2459–2472.', url: doi('10.1093/eurheartj/ehx144') },
  kato2018: { cite: 'Kato GJ, et al. Sickle cell disease. Nat Rev Dis Primers. 2018;4:18010.', url: doi('10.1038/nrdp.2018.10') },
  singer2016: { cite: 'Singer M, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315:801–810.', pmid: '26903338' },
  sender2016: { cite: 'Sender R, Fuchs S, Milo R. Revised estimates for the number of human and bacteria cells in the body. PLoS Biol. 2016;14:e1002533.', url: doi('10.1371/journal.pbio.1002533') },
  azevedo2009: { cite: 'Azevedo FAC, et al. Equal numbers of neuronal and nonneuronal cells make the human brain an isometrically scaled-up primate brain. J Comp Neurol. 2009;513:532–541.', pmid: '19226510' },
  saver2006: { cite: 'Saver JL. Time is brain—quantified. Stroke. 2006;37:263–266.', url: doi('10.1161/01.STR.0000196957.55928.ab') },
  scheltens2021: { cite: 'Scheltens P, et al. Alzheimer’s disease. Lancet. 2021;397:1577–1590.', pmid: '33667416' },
  poewe2017: { cite: 'Poewe W, et al. Parkinson disease. Nat Rev Dis Primers. 2017;3:17013.', pmid: '28332488' },
  xie2013: { cite: 'Xie L, et al. Sleep drives metabolite clearance from the adult brain. Science. 2013;342:373–377.', pmid: '24136970' },
  ribas2018: { cite: 'Ribas A, Wolchok JD. Cancer immunotherapy using checkpoint blockade. Science. 2018;359:1350–1355.', url: doi('10.1126/science.aar4060') },
  helander2014: { cite: 'Helander HF, Fändriks L. Surface area of the digestive tract – revisited. Scand J Gastroenterol. 2014;49:681–689.', pmid: '24694282' },
  jinek2012: { cite: 'Jinek M, et al. A programmable dual-RNA-guided DNA endonuclease in adaptive bacterial immunity. Science. 2012;337:816–821.', url: doi('10.1126/science.1225829') },
  jumper2021: { cite: 'Jumper J, et al. Highly accurate protein structure prediction with AlphaFold. Nature. 2021;596:583–589.', url: doi('10.1038/s41586-021-03819-2') },
  shattock2024: { cite: 'Shattock AJ, et al. Contribution of vaccination to improved survival and health: modelling 50 years of the Expanded Programme on Immunization. Lancet. 2024;403:2307–2316.', url: doi('10.1016/S0140-6736(24)00850-X') },
  ochs2004: { cite: 'Ochs M, et al. The number of alveoli in the human lung. Am J Respir Crit Care Med. 2004;169:120–124.', pmid: '14512270' },
  pai2016: { cite: 'Pai M, et al. Tuberculosis. Nat Rev Dis Primers. 2016;2:16076.', pmid: '27784885' },
  murray2022: { cite: 'Antimicrobial Resistance Collaborators. Global burden of bacterial antimicrobial resistance in 2019: a systematic analysis. Lancet. 2022;399:629–655.', url: doi('10.1016/S0140-6736(21)02724-0') },
};
