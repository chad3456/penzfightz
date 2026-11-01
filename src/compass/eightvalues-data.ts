/*
 * 8values questions and ideologies, from https://github.com/8values/8values.github.io
 * used under the MIT License below. Data unchanged; only converted to TypeScript.
 *
 * The MIT License
 *
 * Copyright (c) 2020 8values. http://8values.github.io.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
export interface EVQuestion { text: string; effect: { econ: number; dipl: number; govt: number; scty: number } }
export interface EVIdeology { name: string; stats: { econ: number; dipl: number; govt: number; scty: number } }
export const EV_QUESTIONS: EVQuestion[] = [
 {
  "text": "Oppression by corporations is more of a concern than oppression by governments.",
  "effect": {
   "econ": 10,
   "dipl": 0,
   "govt": -5,
   "scty": 0
  }
 },
 {
  "text": "It is necessary for the government to intervene in the economy to protect consumers.",
  "effect": {
   "econ": 10,
   "dipl": 0,
   "govt": 0,
   "scty": 0
  }
 },
 {
  "text": "The freer the markets, the freer the people.",
  "effect": {
   "econ": -10,
   "dipl": 0,
   "govt": 0,
   "scty": 0
  }
 },
 {
  "text": "It is better to maintain a balanced budget than to ensure welfare for all citizens.",
  "effect": {
   "econ": -10,
   "dipl": 0,
   "govt": 0,
   "scty": 0
  }
 },
 {
  "text": "Publicly-funded research is more beneficial to the people than leaving it to the market.",
  "effect": {
   "econ": 10,
   "dipl": 0,
   "govt": 0,
   "scty": 10
  }
 },
 {
  "text": "Tariffs on international trade are important to encourage local production.",
  "effect": {
   "econ": 5,
   "dipl": 0,
   "govt": -10,
   "scty": 0
  }
 },
 {
  "text": "From each according to his ability, to each according to his needs.",
  "effect": {
   "econ": 10,
   "dipl": 0,
   "govt": 0,
   "scty": 0
  }
 },
 {
  "text": "It would be best if social programs were abolished in favor of private charity.",
  "effect": {
   "econ": -10,
   "dipl": 0,
   "govt": 0,
   "scty": 0
  }
 },
 {
  "text": "Taxes should be increased on the rich to provide for the poor.",
  "effect": {
   "econ": 10,
   "dipl": 0,
   "govt": 0,
   "scty": 0
  }
 },
 {
  "text": "Inheritance is a legitimate form of wealth.",
  "effect": {
   "econ": -10,
   "dipl": 0,
   "govt": 0,
   "scty": -5
  }
 },
 {
  "text": "Basic utilities like roads and electricity should be publicly owned.",
  "effect": {
   "econ": 10,
   "dipl": 0,
   "govt": 0,
   "scty": 0
  }
 },
 {
  "text": "Government intervention is a threat to the economy.",
  "effect": {
   "econ": -10,
   "dipl": 0,
   "govt": 0,
   "scty": 0
  }
 },
 {
  "text": "Those with a greater ability to pay should receive better healthcare.",
  "effect": {
   "econ": -10,
   "dipl": 0,
   "govt": 0,
   "scty": 0
  }
 },
 {
  "text": "Quality education is a right of all people.",
  "effect": {
   "econ": 10,
   "dipl": 0,
   "govt": 0,
   "scty": 5
  }
 },
 {
  "text": "The means of production should belong to the workers who use them.",
  "effect": {
   "econ": 10,
   "dipl": 0,
   "govt": 0,
   "scty": 0
  }
 },
 {
  "text": "The United Nations should be abolished.",
  "effect": {
   "econ": 0,
   "dipl": -10,
   "govt": -5,
   "scty": 0
  }
 },
 {
  "text": "Military action by our nation is often necessary to protect it.",
  "effect": {
   "econ": 0,
   "dipl": -10,
   "govt": -10,
   "scty": 0
  }
 },
 {
  "text": "I support regional unions, such as the European Union.",
  "effect": {
   "econ": -5,
   "dipl": 10,
   "govt": 10,
   "scty": 5
  }
 },
 {
  "text": "It is important to maintain our national sovereignty.",
  "effect": {
   "econ": 0,
   "dipl": -10,
   "govt": -5,
   "scty": 0
  }
 },
 {
  "text": "A united world government would be beneficial to mankind.",
  "effect": {
   "econ": 0,
   "dipl": 10,
   "govt": 0,
   "scty": 0
  }
 },
 {
  "text": "It is more important to retain peaceful relations than to further our strength.",
  "effect": {
   "econ": 0,
   "dipl": 10,
   "govt": 0,
   "scty": 0
  }
 },
 {
  "text": "Wars do not need to be justified to other countries.",
  "effect": {
   "econ": 0,
   "dipl": -10,
   "govt": -10,
   "scty": 0
  }
 },
 {
  "text": "Military spending is a waste of money.",
  "effect": {
   "econ": 0,
   "dipl": 10,
   "govt": 10,
   "scty": 0
  }
 },
 {
  "text": "International aid is a waste of money.",
  "effect": {
   "econ": -5,
   "dipl": -10,
   "govt": 0,
   "scty": 0
  }
 },
 {
  "text": "My nation is great.",
  "effect": {
   "econ": 0,
   "dipl": -10,
   "govt": 0,
   "scty": 0
  }
 },
 {
  "text": "Research should be conducted on an international scale.",
  "effect": {
   "econ": 0,
   "dipl": 10,
   "govt": 0,
   "scty": 10
  }
 },
 {
  "text": "Governments should be accountable to the international community.",
  "effect": {
   "econ": 0,
   "dipl": 10,
   "govt": 5,
   "scty": 0
  }
 },
 {
  "text": "Even when protesting an authoritarian government, violence is not acceptable.",
  "effect": {
   "econ": 0,
   "dipl": 5,
   "govt": -5,
   "scty": 0
  }
 },
 {
  "text": "My religious values should be spread as much as possible.",
  "effect": {
   "econ": 0,
   "dipl": -5,
   "govt": -10,
   "scty": -10
  }
 },
 {
  "text": "Our nation's values should be spread as much as possible.",
  "effect": {
   "econ": 0,
   "dipl": -10,
   "govt": -5,
   "scty": 0
  }
 },
 {
  "text": "It is very important to maintain law and order.",
  "effect": {
   "econ": 0,
   "dipl": -5,
   "govt": -10,
   "scty": -5
  }
 },
 {
  "text": "The general populace makes poor decisions.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": -10,
   "scty": 0
  }
 },
 {
  "text": "Physician-assisted suicide should be legal.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": 10,
   "scty": 0
  }
 },
 {
  "text": "The sacrifice of some civil liberties is necessary to protect us from acts of terrorism.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": -10,
   "scty": 0
  }
 },
 {
  "text": "Government surveillance is necessary in the modern world.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": -10,
   "scty": 0
  }
 },
 {
  "text": "The very existence of the state is a threat to our liberty.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": 10,
   "scty": 0
  }
 },
 {
  "text": "Regardless of political opinions, it is important to side with your country.",
  "effect": {
   "econ": 0,
   "dipl": -10,
   "govt": -10,
   "scty": -5
  }
 },
 {
  "text": "All authority should be questioned.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": 10,
   "scty": 5
  }
 },
 {
  "text": "A hierarchical state is best.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": -10,
   "scty": 0
  }
 },
 {
  "text": "It is important that the government follows the majority opinion, even if it is wrong.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": 10,
   "scty": 0
  }
 },
 {
  "text": "The stronger the leadership, the better.",
  "effect": {
   "econ": 0,
   "dipl": -10,
   "govt": -10,
   "scty": 0
  }
 },
 {
  "text": "Democracy is more than a decision-making process.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": 10,
   "scty": 0
  }
 },
 {
  "text": "Environmental regulations are essential.",
  "effect": {
   "econ": 5,
   "dipl": 0,
   "govt": 0,
   "scty": 10
  }
 },
 {
  "text": "A better world will come from automation, science, and technology.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": 0,
   "scty": 10
  }
 },
 {
  "text": "Children should be educated in religious or traditional values.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": -5,
   "scty": -10
  }
 },
 {
  "text": "Traditions are of no value on their own.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": 0,
   "scty": 10
  }
 },
 {
  "text": "Religion should play a role in government.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": -10,
   "scty": -10
  }
 },
 {
  "text": "Churches should be taxed the same way other institutions are taxed.",
  "effect": {
   "econ": 5,
   "dipl": 0,
   "govt": 0,
   "scty": 10
  }
 },
 {
  "text": "Climate change is currently one of the greatest threats to our way of life.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": 0,
   "scty": 10
  }
 },
 {
  "text": "It is important that we work as a united world to combat climate change.",
  "effect": {
   "econ": 0,
   "dipl": 10,
   "govt": 0,
   "scty": 10
  }
 },
 {
  "text": "Society was better many years ago than it is now.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": 0,
   "scty": -10
  }
 },
 {
  "text": "It is important that we maintain the traditions of our past.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": 0,
   "scty": -10
  }
 },
 {
  "text": "It is important that we think in the long term, beyond our lifespans.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": 0,
   "scty": 10
  }
 },
 {
  "text": "Reason is more important than maintaining our culture.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": 0,
   "scty": 10
  }
 },
 {
  "text": "Drug use should be legalized or decriminalized.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": 10,
   "scty": 2
  }
 },
 {
  "text": "Same-sex marriage should be legal.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": 10,
   "scty": 10
  }
 },
 {
  "text": "No cultures are superior to others.",
  "effect": {
   "econ": 0,
   "dipl": 10,
   "govt": 5,
   "scty": 10
  }
 },
 {
  "text": "Sex outside marriage is immoral.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": -5,
   "scty": -10
  }
 },
 {
  "text": "If we accept migrants at all, it is important that they assimilate into our culture.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": -5,
   "scty": -10
  }
 },
 {
  "text": "Abortion should be prohibited in most or all cases.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": -10,
   "scty": -10
  }
 },
 {
  "text": "Gun ownership should be prohibited for those without a valid reason.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": -10,
   "scty": 0
  }
 },
 {
  "text": "I support single-payer, universal healthcare.",
  "effect": {
   "econ": 10,
   "dipl": 0,
   "govt": 0,
   "scty": 0
  }
 },
 {
  "text": "Prostitution should be illegal.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": -10,
   "scty": -10
  }
 },
 {
  "text": "Maintaining family values is essential.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": 0,
   "scty": -10
  }
 },
 {
  "text": "To chase progress at all costs is dangerous.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": 0,
   "scty": -10
  }
 },
 {
  "text": "Genetic modification is a force for good, even on humans.",
  "effect": {
   "econ": 0,
   "dipl": 0,
   "govt": 0,
   "scty": 10
  }
 },
 {
  "text": "We should open our borders to immigration.",
  "effect": {
   "econ": 0,
   "dipl": 10,
   "govt": 10,
   "scty": 0
  }
 },
 {
  "text": "Governments should be as concerned about foreigners as they are about their own citizens.",
  "effect": {
   "econ": 0,
   "dipl": 10,
   "govt": 0,
   "scty": 0
  }
 },
 {
  "text": "All people - regardless of factors like culture or sexuality - should be treated equally.",
  "effect": {
   "econ": 10,
   "dipl": 10,
   "govt": 10,
   "scty": 10
  }
 },
 {
  "text": "It is important that we further my group's goals above all others.",
  "effect": {
   "econ": -10,
   "dipl": -10,
   "govt": -10,
   "scty": -10
  }
 }
];
export const EV_IDEOLOGIES: EVIdeology[] = [
 {
  "name": "Anarcho-Communism",
  "stats": {
   "econ": 100,
   "dipl": 50,
   "govt": 100,
   "scty": 90
  }
 },
 {
  "name": "Libertarian Communism",
  "stats": {
   "econ": 100,
   "dipl": 70,
   "govt": 80,
   "scty": 80
  }
 },
 {
  "name": "Trotskyism",
  "stats": {
   "econ": 100,
   "dipl": 100,
   "govt": 60,
   "scty": 80
  }
 },
 {
  "name": "Marxism",
  "stats": {
   "econ": 100,
   "dipl": 70,
   "govt": 40,
   "scty": 80
  }
 },
 {
  "name": "De Leonism",
  "stats": {
   "econ": 100,
   "dipl": 30,
   "govt": 30,
   "scty": 80
  }
 },
 {
  "name": "Leninism",
  "stats": {
   "econ": 100,
   "dipl": 40,
   "govt": 20,
   "scty": 70
  }
 },
 {
  "name": "Stalinism/Maoism",
  "stats": {
   "econ": 100,
   "dipl": 20,
   "govt": 0,
   "scty": 60
  }
 },
 {
  "name": "Religious Communism",
  "stats": {
   "econ": 100,
   "dipl": 50,
   "govt": 30,
   "scty": 30
  }
 },
 {
  "name": "State Socialism",
  "stats": {
   "econ": 80,
   "dipl": 30,
   "govt": 30,
   "scty": 70
  }
 },
 {
  "name": "Theocratic Socialism",
  "stats": {
   "econ": 80,
   "dipl": 50,
   "govt": 30,
   "scty": 20
  }
 },
 {
  "name": "Religious Socialism",
  "stats": {
   "econ": 80,
   "dipl": 50,
   "govt": 70,
   "scty": 20
  }
 },
 {
  "name": "Democratic Socialism",
  "stats": {
   "econ": 80,
   "dipl": 50,
   "govt": 50,
   "scty": 80
  }
 },
 {
  "name": "Revolutionary Socialism",
  "stats": {
   "econ": 80,
   "dipl": 20,
   "govt": 50,
   "scty": 70
  }
 },
 {
  "name": "Libertarian Socialism",
  "stats": {
   "econ": 80,
   "dipl": 80,
   "govt": 80,
   "scty": 80
  }
 },
 {
  "name": "Anarcho-Syndicalism",
  "stats": {
   "econ": 80,
   "dipl": 50,
   "govt": 100,
   "scty": 80
  }
 },
 {
  "name": "Left-Wing Populism",
  "stats": {
   "econ": 60,
   "dipl": 40,
   "govt": 30,
   "scty": 70
  }
 },
 {
  "name": "Theocratic Distributism",
  "stats": {
   "econ": 60,
   "dipl": 40,
   "govt": 30,
   "scty": 20
  }
 },
 {
  "name": "Distributism",
  "stats": {
   "econ": 60,
   "dipl": 50,
   "govt": 50,
   "scty": 20
  }
 },
 {
  "name": "Social Liberalism",
  "stats": {
   "econ": 60,
   "dipl": 60,
   "govt": 60,
   "scty": 80
  }
 },
 {
  "name": "Christian Democracy",
  "stats": {
   "econ": 60,
   "dipl": 60,
   "govt": 50,
   "scty": 30
  }
 },
 {
  "name": "Social Democracy",
  "stats": {
   "econ": 60,
   "dipl": 70,
   "govt": 60,
   "scty": 80
  }
 },
 {
  "name": "Progressivism",
  "stats": {
   "econ": 60,
   "dipl": 80,
   "govt": 60,
   "scty": 100
  }
 },
 {
  "name": "Anarcho-Mutualism",
  "stats": {
   "econ": 60,
   "dipl": 50,
   "govt": 100,
   "scty": 70
  }
 },
 {
  "name": "National Totalitarianism",
  "stats": {
   "econ": 50,
   "dipl": 20,
   "govt": 0,
   "scty": 50
  }
 },
 {
  "name": "Global Totalitarianism",
  "stats": {
   "econ": 50,
   "dipl": 80,
   "govt": 0,
   "scty": 50
  }
 },
 {
  "name": "Technocracy",
  "stats": {
   "econ": 60,
   "dipl": 60,
   "govt": 20,
   "scty": 70
  }
 },
 {
  "name": "Centrist",
  "stats": {
   "econ": 50,
   "dipl": 50,
   "govt": 50,
   "scty": 50
  }
 },
 {
  "name": "Liberalism",
  "stats": {
   "econ": 50,
   "dipl": 60,
   "govt": 60,
   "scty": 60
  }
 },
 {
  "name": "Religious Anarchism",
  "stats": {
   "econ": 50,
   "dipl": 50,
   "govt": 100,
   "scty": 20
  }
 },
 {
  "name": "Right-Wing Populism",
  "stats": {
   "econ": 40,
   "dipl": 30,
   "govt": 30,
   "scty": 30
  }
 },
 {
  "name": "Moderate Conservatism",
  "stats": {
   "econ": 40,
   "dipl": 40,
   "govt": 50,
   "scty": 30
  }
 },
 {
  "name": "Reactionary",
  "stats": {
   "econ": 40,
   "dipl": 40,
   "govt": 40,
   "scty": 10
  }
 },
 {
  "name": "Social Libertarianism",
  "stats": {
   "econ": 60,
   "dipl": 70,
   "govt": 80,
   "scty": 70
  }
 },
 {
  "name": "Libertarianism",
  "stats": {
   "econ": 40,
   "dipl": 60,
   "govt": 80,
   "scty": 60
  }
 },
 {
  "name": "Anarcho-Egoism",
  "stats": {
   "econ": 40,
   "dipl": 50,
   "govt": 100,
   "scty": 50
  }
 },
 {
  "name": "Nazism",
  "stats": {
   "econ": 40,
   "dipl": 0,
   "govt": 0,
   "scty": 5
  }
 },
 {
  "name": "Autocracy",
  "stats": {
   "econ": 50,
   "dipl": 20,
   "govt": 20,
   "scty": 50
  }
 },
 {
  "name": "Fascism",
  "stats": {
   "econ": 40,
   "dipl": 20,
   "govt": 20,
   "scty": 20
  }
 },
 {
  "name": "Capitalist Fascism",
  "stats": {
   "econ": 20,
   "dipl": 20,
   "govt": 20,
   "scty": 20
  }
 },
 {
  "name": "Conservatism",
  "stats": {
   "econ": 30,
   "dipl": 40,
   "govt": 40,
   "scty": 20
  }
 },
 {
  "name": "Neo-Liberalism",
  "stats": {
   "econ": 30,
   "dipl": 30,
   "govt": 50,
   "scty": 60
  }
 },
 {
  "name": "Classical Liberalism",
  "stats": {
   "econ": 30,
   "dipl": 60,
   "govt": 60,
   "scty": 80
  }
 },
 {
  "name": "Authoritarian Capitalism",
  "stats": {
   "econ": 20,
   "dipl": 30,
   "govt": 20,
   "scty": 40
  }
 },
 {
  "name": "State Capitalism",
  "stats": {
   "econ": 20,
   "dipl": 50,
   "govt": 30,
   "scty": 50
  }
 },
 {
  "name": "Neo-Conservatism",
  "stats": {
   "econ": 20,
   "dipl": 20,
   "govt": 40,
   "scty": 20
  }
 },
 {
  "name": "Fundamentalism",
  "stats": {
   "econ": 20,
   "dipl": 30,
   "govt": 30,
   "scty": 5
  }
 },
 {
  "name": "Libertarian Capitalism",
  "stats": {
   "econ": 20,
   "dipl": 50,
   "govt": 80,
   "scty": 60
  }
 },
 {
  "name": "Market Anarchism",
  "stats": {
   "econ": 20,
   "dipl": 50,
   "govt": 100,
   "scty": 50
  }
 },
 {
  "name": "Objectivism",
  "stats": {
   "econ": 10,
   "dipl": 50,
   "govt": 90,
   "scty": 40
  }
 },
 {
  "name": "Totalitarian Capitalism",
  "stats": {
   "econ": 0,
   "dipl": 30,
   "govt": 0,
   "scty": 50
  }
 },
 {
  "name": "Ultra-Capitalism",
  "stats": {
   "econ": 0,
   "dipl": 40,
   "govt": 50,
   "scty": 50
  }
 },
 {
  "name": "Anarcho-Capitalism",
  "stats": {
   "econ": 0,
   "dipl": 50,
   "govt": 100,
   "scty": 50
  }
 }
];
