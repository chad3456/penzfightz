/**
 * References, each checked against PubMed. Topics point at these by key;
 * every topic also carries its own PubMed search for further reading.
 */
export interface Ref { cite: string; pmid?: string; url?: string }
export const REFS: Record<string, Ref> = {
  hallmarks2022: { cite: 'Hanahan D. Hallmarks of Cancer: New Dimensions. Cancer Discov. 2022;12(1):31–46.', pmid: '35022204' },
};
