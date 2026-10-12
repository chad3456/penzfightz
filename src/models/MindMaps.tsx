/**
 * Mind Maps — psychological and mental models drawn as scenes, in the same
 * clean-ink manner as Walks of Life, each with numbered callouts whose
 * explanations open on hover or tap.
 */
import { Gallery, type GalleryConfig } from '../walks/WalksOfLife';
import { MODELS } from './plates';

const CFG: GalleryConfig = {
  plates: MODELS, title: 'Mind Maps', sub: 'Mental models in ink and flat colour', heading: 'Mind Maps',
  intro: 'Ten ideas from psychology and decision-making, each drawn as a scene you can walk around in: the iceberg under what people do, the circles of what you can control, Maslow’s house of needs, the spotlight nobody is really under, the planes that never came back, the fence you should not pull down yet, the map that is not the land, the shallows where learning happens, four rooms of urgency, and the ticket you already paid for. Open a plate and hover over or tap the numbers.',
  prefix: 'mind-maps', noun: 'notes', markLabel: 'Mark notes', listLabel: 'All notes', hint: 'Drag to look around · scroll or pinch to zoom · hover or tap a number',
};

export default function MindMaps({ onExit }: { onExit: () => void }) {
  return <Gallery cfg={CFG} onExit={onExit} />;
}
