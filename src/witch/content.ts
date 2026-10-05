import { Frame, bubble, candle, cat, checkout, cup, drone, human, laptop, leaf, owl, phone, plant, scooter, speaker, stone, witch } from './art';
import { letter } from './pen';

/**
 * The Earth Issue: ten dispatches from Hazel Mothwick, Witchworld Weekly's
 * correspondent, on her first visit to Earth since 1974. Every word original.
 */

export interface Spread {
  id: string; kicker: string; title: string; caption: string; body: string; poke: string; stamp: string; x: number;
  /** Draw the scene, about 520 × 360 units, origin at the ground centre. */
  scene: (f: Frame, t: number, poked: boolean) => void;
}

export const SPREADS: Spread[] = [
  {
    id: 'mirrors', kicker: 'Field notes · No. 1', title: 'The glowing mirrors', stamp: 'phone', x: 900,
    caption: 'Every human carries a small glowing mirror and asks it everything. We called ours a crystal ball and got thrown in ponds for it.',
    body: 'They hold it at chest height and walk into lamp posts. They ask it the weather while standing in the weather. One man asked it how far away his own house was. It knew. I am impressed and I am not impressed.',
    poke: 'Tap the mirrors: they all light up at once. Nobody looks up.',
    scene: (f, t, poked) => {
      human(f.sub(-150, 0, 1, 0, 1, 1), { head: 'down', hold: 'phone' }, 0);
      human(f.sub(-40, 0, 1.05, 0, 1, 2), { head: 'down', hold: 'phone', kind: 'b' }, 0);
      human(f.sub(70, 0, 0.98, 0, 1, 3), { head: 'down', hold: 'phone', kind: 'c' }, 0);
      if (poked) for (const [x, k] of [[-143, 4], [-33, 5], [77, 6]] as const) phone(f.sub(x, -97, 0.5, 0, 1, k), 1, t);
      witch(f.sub(190, 0, 0.8, 0, -1, 9), poked ? 'shrug' : 'point', t, poked ? 'o' : 'grin');
    },
  },
  {
    id: 'checkout', kicker: 'Shopping', title: 'Unexpected item in bagging area', stamp: 'checkout', x: 1700,
    caption: 'There are shops with no shopkeeper, only a machine that accuses you. I put Parsnip on the scales to see what would happen. It was right.',
    body: 'The machine knows the price of a cabbage but not what a cabbage is. You wave the cabbage at it until it sings. Then it calls an assistant over anyway. The assistant presses one button and leaves. I have never seen a more powerful sorceress.',
    poke: 'Tap the scanner. Parsnip is an unexpected item.',
    scene: (f, t, poked) => {
      checkout(f.sub(30, 0, 1.2, 0, 1, 1), t, poked ? 1 : 0);
      cat(f.sub(-110, -116, 0.8, 0, 1, 2), t, poked ? 'cross' : 'sit');
      witch(f.sub(180, 0, 0.8, 0, -1, 3), 'hold', t, 'o');
      if (poked) { const b = f.sub(-230, -330, 1, 0, 1, 4); bubble(b, 230, 70, 0.6); letter(b.pen, 'UNEXPECTED ITEM IN BAGGING AREA', ...b.map([16, 14]), { size: 15 * b.s, maxWidth: 200 * b.s, seed: 4 }); }
    },
  },
  {
    id: 'cylinder', kicker: 'At home', title: 'The listening cylinder', stamp: 'speaker', x: 2500,
    caption: 'Every kitchen has a small cylinder that does spells if you say its name first. It mishears all of them. We have a word for this: apprentice.',
    body: 'I asked it to turn the lights off and it played a song about lights. I asked it to put the kettle on and it ordered a kettle. It listens all day, says nothing and sends everything to someone else. My cat does the same and is at least warm.',
    poke: 'Tap the cylinder. Say its name. It did not catch that.',
    scene: (f, t, poked) => {
      f.L([[-200, -90], [200, -90]], 1); f.L([[-180, -90], [-180, 0]], 2); f.L([[180, -90], [180, 0]], 3);
      speaker(f.sub(0, -90, 1.6, 0, 1, 4), poked ? 1 : 0, t);
      witch(f.sub(-250, 0, 0.8, 0, 1, 5), 'point', t, 'flat');
      if (poked) { const b = f.sub(30, -330, 1, 0, 1, 6); bubble(b, 200, 64, 0.2); letter(b.pen, "SORRY, I DIDN'T CATCH THAT.", ...b.map([16, 14]), { size: 15 * b.s, maxWidth: 170 * b.s, seed: 6 }); }
    },
  },
  {
    id: 'familiar', kicker: 'Technology', title: 'A familiar that writes poems', stamp: 'ai', x: 3300,
    caption: 'They have built a familiar out of every book ever written. It writes poems, answers letters and apologises a great deal. It cannot catch a single mouse.',
    body: 'I asked it for a curse. It gave me a recipe for soup, four ways to say no politely, and a reminder to drink water. Parsnip has been sitting on the warm part of it all afternoon, which he says is its only real use.',
    poke: 'Tap the familiar. Parsnip is not threatened. Parsnip is a little threatened.',
    scene: (f, t, poked) => {
      laptop(f.sub(0, 0, 1.4, 0, 1, 1));
      cat(f.sub(130, 0, 1.1, 0, 1, 2), t, poked ? 'cross' : 'loaf');
      witch(f.sub(-220, 0, 0.8, 0, 1, 3), 'hold', t, poked ? 'o' : 'grin');
      if (poked) { const b = f.sub(-90, -280, 1, 0, 1, 4); bubble(b, 230, 80, 0.4); letter(b.pen, 'ROSES ARE RED,\nCATS ARE NOT BLUE,\nI AM SO SORRY', ...b.map([16, 12]), { size: 13 * b.s, seed: 8 }); }
    },
  },
  {
    id: 'wellness', kicker: 'Wellness', title: 'They pay for it now', stamp: 'spa', x: 4100,
    caption: 'Candles, crystals, bitter teas, sitting very still in a hot room. Three hundred years ago this got you talked about. Now there is a waiting list.',
    body: 'A woman in white linen sold me a stone that I have had in my garden since the Tudors. She called it a journey. I called it the stone from my garden. We agreed on a price. I am thinking of opening a shop.',
    poke: 'Tap the candles. Everybody exhales at the same time.',
    scene: (f, t, poked) => {
      for (let i = 0; i < 5; i++) candle(f.sub(-160 + i * 50, 0, 1 + (i % 2) * 0.3, 0, 1, 10 + i), t * (poked ? 3 : 1));
      for (let i = 0; i < 4; i++) stone(f.sub(-130 + i * 60, -2, 0.9, 0, 1, 20 + i), 1);
      witch(f.sub(200, 0, 0.8, 0, -1, 3), poked ? 'arms-up' : 'stand', t, 'flat');
      if (poked) for (let i = 0; i < 6; i++) f.L([[-180 + i * 70, -120], [-176 + i * 70 + Math.sin(t + i) * 6, -170]], 40 + i);
    },
  },
  {
    id: 'autumn', kicker: 'Food & drink', title: 'A whole autumn in a cup', stamp: 'coffee', x: 4900,
    caption: 'They take a pumpkin, the smell of a bonfire and a whole month, put them in a paper cup, and drink it in August. I had three. I have seen sounds.',
    body: 'The milk comes from oats, almonds, peas and, once, I think, a cloud. The cup has your name on it, spelled wrong, which is an old and effective protective charm. I have started spelling my name wrong on everything.',
    poke: 'Tap the cup. Autumn leaks out.',
    scene: (f, t, poked) => {
      cup(f.sub(0, 0, 1.7, 0, 1, 1), t);
      letter(f.pen, 'HAZLE', ...f.map([-28, -70]), { size: 13 * f.s, seed: 3 });
      if (poked) for (let i = 0; i < 9; i++) leaf(f.sub(-160 + i * 40 + Math.sin(t + i) * 10, -260 + ((t * 40 + i * 50) % 260), 1, Math.sin(t + i), 1, 30 + i), 1);
      witch(f.sub(-200, 0, 0.8, 0, 1, 3), 'hold', t, poked ? 'o' : 'grin');
    },
  },
  {
    id: 'scooter', kicker: 'Transport', title: 'Nobody looked up', stamp: 'scooter', x: 5700,
    caption: 'I flew down the high street at rooftop height on a broom. Not one person looked up. A man went by on a small electric plank and everyone stared at him.',
    body: 'Their brooms have two wheels and a battery, are left lying in hedges, and are hired by the minute. Mine is four hundred years old and has never once been left in a hedge. Well, once. It was a long night and the hedge started it.',
    poke: 'Tap the road. Whoosh.',
    scene: (f, t, poked) => {
      const x = poked ? ((t * 220) % 700) - 350 : 0;
      const r = f.sub(x, 0, 1.2, 0, 1, 1);
      scooter(r, t);
      human(r.sub(20, -16, 0.75, 0, 1, 2), { kind: 'c' }, 0);
      witch(f.sub(-180, -200, 0.55, -0.2, 1, 3), 'fly', t, 'flat');
      f.L([[-260, -100], [-240, -150]], 30); f.L([[-280, -60], [-250, -110]], 31);
    },
  },
  {
    id: 'black', kicker: 'Fashion', title: 'Everyone dresses like my aunt', stamp: 'fashion', x: 6500,
    caption: 'Long black coats, heavy boots, silver rings, a single dramatic hat. I have never been so ordinary in my life. A girl asked where I got my look. I said: a bog.',
    body: 'The shops sell "witchy" things now, which are our things with a higher price and less soot. I bought back my own grandmother\'s style of hat for forty pounds. It was a good hat. She would have charged more.',
    poke: 'Tap the crowd: spot the witch.',
    scene: (f, t, poked) => {
      for (let i = 0; i < 4; i++) human(f.sub(-200 + i * 100, 0, 1 + (i % 2) * 0.05, 0, 1, 1 + i), { dress: i % 2 === 0, scarf: i === 1, kind: i === 3 ? 'b' : 'a' }, 0);
      // a hat on every head
      for (let i = 0; i < 4; i++) { const h = f.sub(-200 + i * 100, -160, 0.42, 0, 1, 20 + i); h.L([[-16, 0], [-6, -50], [6, -60], [16, 0]], 1); h.L([[-46, 2], [46, 2]], 2); }
      witch(f.sub(220, 0, 0.8, 0, -1, 9), poked ? 'wave' : 'stand', t, poked ? 'grin' : 'flat');
      if (poked) letter(f.pen, '← HER', ...f.map([150, -200]), { size: 18 * f.s, seed: 9 });
    },
  },
  {
    id: 'owls', kicker: 'Post', title: 'Their owls have propellers', stamp: 'drone', x: 7300,
    caption: 'Parcels arrive by small humming machines with four spinning arms. They have no feathers and no opinions. Ours have both, mostly about you.',
    body: 'It delivered a toothbrush to a woman in a field. She had not ordered a toothbrush. She was not in a field on purpose. I asked our owl, Reginald, what he made of it. He bit me, which is his answer to most things.',
    poke: 'Tap the sky. Reginald takes it personally.',
    scene: (f, t, poked) => {
      drone(f.sub(-60, -240 + Math.sin(t * 2) * 8, 1.4, 0, 1, 1), t);
      owl(f.sub(poked ? 120 + Math.sin(t * 3) * 30 : 160, poked ? -260 : -40, 1.2, 0, 1, 2), t, poked);
      witch(f.sub(-220, 0, 0.8, 0, 1, 3), 'point', t, 'o');
      if (poked) letter(f.pen, 'HOO DO YOU THINK YOU ARE', ...f.map([20, -340]), { size: 14 * f.s, seed: 10 });
    },
  },
  {
    id: 'plants', kicker: 'Homes', title: 'They talk to their plants', stamp: 'plant', x: 8100,
    caption: 'Every flat has one enormous leafy plant with holes in its leaves, and the humans talk to it, gently, every morning. Finally. My people.',
    body: 'They give it a name, a window and a little spray bottle. They worry about it more than about each other. One woman told me hers was "thriving". I asked it. It said it was fine but it would like to be moved away from the radiator, and it would like it noted.',
    poke: 'Tap the plant. It has notes.',
    scene: (f, t, poked) => {
      plant(f.sub(0, 0, 1.4, 0, 1, 1), t);
      human(f.sub(-150, 0, 1, 0, 1, 2), { kind: 'b', hold: 'cup' }, 0);
      witch(f.sub(200, 0, 0.8, 0, -1, 3), 'arms-up', t, 'grin');
      if (poked) { const b = f.sub(30, -360, 1, 0, 1, 4); bubble(b, 210, 64, 0.1); letter(b.pen, 'MORE LIGHT. LESS TALKING.', ...b.map([14, 14]), { size: 14 * b.s, maxWidth: 180 * b.s, seed: 12 }); }
    },
  },
];

export const COVER_LINES = [
  'Earth, 2026: a field guide',
  'Why are they all looking down?',
  'We try the autumn in a cup',
  'Ten spells humans call apps',
  'Parsnip reviews a laptop',
];

export const HOROSCOPES: [string, string][] = [
  ['Aries', 'A small glowing mirror will tell you something untrue. Believe the cat instead.'],
  ['Taurus', 'You will buy a stone. It was in someone\'s garden. Enjoy it anyway.'],
  ['Gemini', 'Two of you would get more done. Do not attempt this at home.'],
  ['Cancer', 'Stay in. Make soup. Tell no one.'],
  ['Leo', 'A hat will be admired. Not yours. Be gracious.'],
  ['Virgo', 'The machine will find an unexpected item. Stand your ground.'],
  ['Libra', 'Balance is overrated. Have the third coffee.'],
  ['Scorpio', 'You already know. You have always known. Stop looking at me like that.'],
  ['Sagittarius', 'Travel is favoured. Leave your broom somewhere other than a hedge.'],
  ['Capricorn', 'Hard work pays off, eventually, to someone.'],
  ['Aquarius', 'Talk to the plant. It has been waiting.'],
  ['Pisces', 'Water is your friend. Ponds are not. Remember the difference.'],
];

export const CLASSIFIEDS = [
  'LOST: one broom, answers to "oi". Last seen near a hedge. Reward: one cabbage.',
  'FOR SALE: cauldron, one careful owner, slight smell of 1974.',
  'WANTED: assistant who can make the self-checkout stop shouting. Must like cats.',
  'SWAP: two crystal balls for one glowing mirror. Will throw in the toad.',
  'FREE TO A GOOD HOME: a curse I no longer need. Mild. Mostly hiccups.',
];

export const ABOUT = 'Hazel Mothwick, 347, has been field correspondent and staff illustrator at Witchworld Weekly since the paper was a single sheet nailed to a tree. Previous assignments: the Moon (overrated), the 1970s (too much brown), and the inside of a whale (do not ask). She travels with Parsnip, a cat of firm opinions, and draws everything with one pen she has never once refilled.';
