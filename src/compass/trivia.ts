/** Short, documented facts shown while taking the test, three for each axis. */
import type { AxisId } from './model';

export const TRIVIA: Record<AxisId, string[]> = {
  econ: [
    'Adam Smith’s The Wealth of Nations was published in 1776, the same year as the US Declaration of Independence.',
    'China’s market reforms began in 1978 when farmers in Xiaogang village secretly divided their collective land into household plots.',
    'Economists trace one of the earliest large privatisation programmes to 1930s Germany, decades before Thatcher’s Britain.',
  ],
  welfare: [
    'Germany passed the world’s first national health insurance law in 1883, under Otto von Bismarck.',
    'Britain’s National Health Service opened on 5 July 1948.',
    'In Agrarian Justice (1797), Thomas Paine proposed a lump sum for every 21-year-old, paid for by a tax on inheritances.',
  ],
  trade: [
    'Britain repealed the Corn Laws, its tariffs on imported grain, in 1846.',
    'The US Smoot–Hawley Tariff of 1930 raised duties on thousands of imports; many economists say it deepened the Depression.',
    'The World Trade Organization was founded in 1995, replacing the GATT of 1947.',
  ],
  liberty: [
    'Magna Carta (1215) promised that no free man would be imprisoned except by the lawful judgement of his peers or the law of the land.',
    'The US Fourth Amendment, banning unreasonable searches and seizures, was ratified in 1791.',
    'Portugal decriminalised personal possession of all drugs in 2001, treating use as a health issue.',
  ],
  power: [
    'Ancient Athens filled many public offices by drawing lots rather than by election.',
    'The US two-term limit was only a custom, begun by Washington, until the 22nd Amendment made it law in 1951.',
    'Montesquieu’s The Spirit of the Laws (1748) set out the separation of powers into legislative, executive and judicial branches.',
  ],
  center: [
    'Swiss citizens can force a national referendum on a new law by collecting 50,000 signatures.',
    'Revolutionary France was divided into departments in 1790, drawn so that each capital could be reached within about a day’s ride.',
    'India’s constitution lists which powers belong to the Union, which to the states and which are shared.',
  ],
  values: [
    'New Zealand was the first self-governing country to give women the vote, in 1893.',
    'The Netherlands became the first country to legalise same-sex marriage, in 2001.',
    'Iceland’s Jóhanna Sigurðardóttir became the world’s first openly gay head of government in 2009.',
  ],
  faith: [
    'France’s law separating the churches and the state dates from 1905.',
    'The US First Amendment’s ban on an established religion was ratified in 1791.',
    'The British monarch is Supreme Governor of the Church of England, a role dating from Elizabeth I.',
  ],
  nation: [
    'About 3.7% of the world’s people, some 304 million, lived outside their country of birth in 2024, according to the UN.',
    'Ellis Island processed about 12 million immigrants to the US between 1892 and 1954.',
    'Canada introduced a points system for choosing immigrants by skills in 1967.',
  ],
  world: [
    'The United Nations was founded in 1945 by 51 countries; it now has 193 members.',
    'The European Union began as the European Coal and Steel Community of six countries in 1951.',
    'The Peace of Westphalia (1648) is often cited as the origin of the modern idea of state sovereignty.',
  ],
  force: [
    'Costa Rica abolished its army in 1948.',
    'The Treaty on the Non-Proliferation of Nuclear Weapons came into force in 1970.',
    'Article 9 of Japan’s 1947 constitution renounces war as a sovereign right of the nation.',
  ],
  eco: [
    'Finland introduced the world’s first carbon tax in 1990.',
    'The first Earth Day, in 1970, drew an estimated 20 million Americans.',
    'The Montreal Protocol (1987), which protects the ozone layer, is ratified by every country in the world.',
  ],
};

/** For the 8values test, whose questions have no Compass axis. */
export const ALL_TRIVIA = Object.values(TRIVIA).flat();
