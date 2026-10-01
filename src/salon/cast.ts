/**
 * The Salon: the cast.
 *
 * Each thinker has a portrait recipe (drawn by Portrait.tsx), their dates,
 * and the one principle they are best known for: their Face. What they
 * actually did lives in the episodes, as stones and evidence.
 */

export interface Look {
  skin: string;
  hair: 'bald' | 'short' | 'side' | 'slick' | 'curly' | 'long' | 'wig' | 'bigwig' | 'ringlets' | 'center' | 'fringe' | 'none';
  hairColor: string;
  beard?: 'full' | 'long' | 'goatee' | 'mustache' | 'sideburns';
  beardColor?: string;
  head?: 'turban' | 'hat';
  headColor?: string;
  dress: 'toga' | 'coat' | 'robe' | 'trench' | 'gown' | 'tweed';
  dressColor: string;
  collar?: 'cravat' | 'fichu' | 'tie' | 'band' | 'none';
  extra?: 'flower' | 'cigarette' | 'quill';
}

export interface Thinker {
  id: string;
  name: string;
  short: string;
  dates: string;
  born: number;
  died: number;
  from: string;
  face: string;      // the principle they are known for
  tint: string;      // their colour in the chat
  look: Look;
}

export const CAST: Record<string, Thinker> = {
  vivekananda: { id: 'vivekananda', name: 'Swami Vivekananda', short: 'Vivekananda', dates: '1863–1902', born: 1863, died: 1902, from: 'Calcutta', face: 'Every soul is potentially divine; serve the divine in every person.', tint: '#d9772b',
    look: { skin: '#b98260', hair: 'none', hairColor: '#1c1410', head: 'turban', headColor: '#e2862f', dress: 'robe', dressColor: '#d9772b', collar: 'none' } },
  wollstonecraft: { id: 'wollstonecraft', name: 'Mary Wollstonecraft', short: 'Wollstonecraft', dates: '1759–1797', born: 1759, died: 1797, from: 'London', face: 'Women are rational beings and deserve the same education and rights as men.', tint: '#3f8f6b',
    look: { skin: '#f1cfb6', hair: 'curly', hairColor: '#8a4b2a', dress: 'gown', dressColor: '#2f5d4c', collar: 'fichu' } },
  rousseau: { id: 'rousseau', name: 'Jean-Jacques Rousseau', short: 'Rousseau', dates: '1712–1778', born: 1712, died: 1778, from: 'Geneva', face: 'Man is born free, and everywhere he is in chains.', tint: '#8a5a3c',
    look: { skin: '#ebc3a3', hair: 'wig', hairColor: '#d8d2c6', dress: 'coat', dressColor: '#7a4e34', collar: 'cravat' } },
  aristotle: { id: 'aristotle', name: 'Aristotle', short: 'Aristotle', dates: '384–322 BCE', born: -384, died: -322, from: 'Stagira', face: 'Knowledge begins in careful observation of the world.', tint: '#6b6fb3',
    look: { skin: '#d6a47e', hair: 'curly', hairColor: '#8d8a84', beard: 'full', beardColor: '#8d8a84', dress: 'toga', dressColor: '#e9e1cf' } },
  mill: { id: 'mill', name: 'John Stuart Mill', short: 'Mill', dates: '1806–1873', born: 1806, died: 1873, from: 'London', face: 'Liberty: the only purpose of power over anyone is to prevent harm to others.', tint: '#3d6fa8',
    look: { skin: '#f0c9aa', hair: 'bald', hairColor: '#4a3a2e', beard: 'sideburns', beardColor: '#4a3a2e', dress: 'coat', dressColor: '#22252b', collar: 'cravat' } },
  camus: { id: 'camus', name: 'Albert Camus', short: 'Camus', dates: '1913–1960', born: 1913, died: 1960, from: 'Mondovi, Algeria', face: 'I rebel — therefore we exist.', tint: '#b0663a',
    look: { skin: '#e2b490', hair: 'slick', hairColor: '#231a14', dress: 'trench', dressColor: '#b9a27e', collar: 'tie', extra: 'cigarette' } },
  plato: { id: 'plato', name: 'Plato', short: 'Plato', dates: 'c. 427–347 BCE', born: -427, died: -347, from: 'Athens', face: 'Love (eros) is the ladder from one beautiful person to beauty itself.', tint: '#5d82a8',
    look: { skin: '#d8a67e', hair: 'short', hairColor: '#e8e4dc', beard: 'long', beardColor: '#e8e4dc', dress: 'toga', dressColor: '#c9d3dc' } },
  kant: { id: 'kant', name: 'Immanuel Kant', short: 'Kant', dates: '1724–1804', born: 1724, died: 1804, from: 'Königsberg', face: 'Treat every person always as an end, never merely as a means.', tint: '#46507a',
    look: { skin: '#efc8a8', hair: 'wig', hairColor: '#ecebe6', dress: 'coat', dressColor: '#2f3a5e', collar: 'cravat' } },
  bentham: { id: 'bentham', name: 'Jeremy Bentham', short: 'Bentham', dates: '1748–1832', born: 1748, died: 1832, from: 'London', face: 'The greatest happiness of the greatest number is the measure of right and wrong.', tint: '#7b8b3a',
    look: { skin: '#f1cdb2', hair: 'long', hairColor: '#ecebe4', head: 'hat', headColor: '#3a3128', dress: 'coat', dressColor: '#2b2621', collar: 'cravat' } },
  wilde: { id: 'wilde', name: 'Oscar Wilde', short: 'Wilde', dates: '1854–1900', born: 1854, died: 1900, from: 'Dublin', face: 'The only way to get rid of a temptation is to yield to it.', tint: '#3a8f5a',
    look: { skin: '#f0d0b8', hair: 'center', hairColor: '#3a2a1e', dress: 'coat', dressColor: '#2e4a3a', collar: 'cravat', extra: 'flower' } },
  descartes: { id: 'descartes', name: 'René Descartes', short: 'Descartes', dates: '1596–1650', born: 1596, died: 1650, from: 'La Haye, Touraine', face: 'I think, therefore I am.', tint: '#56627a',
    look: { skin: '#e9be98', hair: 'long', hairColor: '#2a1d16', beard: 'goatee', beardColor: '#2a1d16', dress: 'coat', dressColor: '#1d1d22', collar: 'band' } },
  lovelace: { id: 'lovelace', name: 'Ada Lovelace', short: 'Lovelace', dates: '1815–1852', born: 1815, died: 1852, from: 'London', face: 'The Engine weaves algebraic patterns just as the Jacquard loom weaves flowers.', tint: '#8a4fa0',
    look: { skin: '#f3d6c2', hair: 'ringlets', hairColor: '#2b1d18', dress: 'gown', dressColor: '#5d3a78', collar: 'none' } },
  leibniz: { id: 'leibniz', name: 'Gottfried Wilhelm Leibniz', short: 'Leibniz', dates: '1646–1716', born: 1646, died: 1716, from: 'Leipzig', face: 'Let us calculate: every dispute could be settled by computation.', tint: '#a0503f',
    look: { skin: '#eec7a6', hair: 'bigwig', hairColor: '#4a3022', dress: 'coat', dressColor: '#7a2f26', collar: 'cravat' } },
  turing: { id: 'turing', name: 'Alan Turing', short: 'Turing', dates: '1912–1954', born: 1912, died: 1954, from: 'London', face: 'Can machines think? Ask instead whether they can play the imitation game.', tint: '#2f8a8a',
    look: { skin: '#efcaaa', hair: 'side', hairColor: '#2e2219', dress: 'tweed', dressColor: '#6d5a44', collar: 'tie' } },
};

export const yearLabel = (y: number) => (y < 0 ? `${-y} BCE` : `${y}`);
