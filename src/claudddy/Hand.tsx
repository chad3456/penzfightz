import { useEffect, useRef } from 'react';
import { measure, write, writeBlock, type WriteOptions } from './hand';
import { drawStave, type Piece } from './music';

/**
 * A line of writing.
 *
 * It is a canvas, because the letters are drawn rather than set: a real hand
 * needs a real mark, and a mark that flickers with the tooth of the paper is
 * not something a font file can hold.
 *
 * Redrawn on resize and at the device's own pixel density, because hand
 * lettering blurred to a grey smear is worse than type.
 */
export function Hand({
  text, size = 46, className, colour = '#2b2721', align = 'left', seed = 1, slant, waver, press,
}: {
  text: string;
  size?: number;
  className?: string;
  colour?: string;
  align?: 'left' | 'center';
  seed?: number;
  slant?: number;
  waver?: number;
  press?: number;
}) {
  const host = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = host.current;
    if (!c) return;
    const draw = () => {
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      const w = Math.ceil(measure(text) * size + size * 0.8);
      const h = Math.ceil(size * 1.5);
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      const g = c.getContext('2d');
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      g.fillStyle = colour;
      g.strokeStyle = colour;
      const o: WriteOptions = {
        size, seed, slant, waver,
        align: align === 'center' ? 'center' : 'left',
        /*
          Pressed harder than felt right in the abstract. Graphite on screen is
          always paler than graphite on paper — the deposits are sub-pixel and
          the antialiasing eats a third of every one — so a hand that looks
          correct in the numbers comes out as a whisper on the page.
        */
        pencil: { press: press ?? 0.95, grade: 0.78, passes: 3 },
      };
      write(g, text, align === 'center' ? w / 2 : size * 0.2, size * 1.05, o);
    };
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [text, size, colour, align, seed, slant, waver, press]);
  return <canvas className={className} ref={host} aria-label={text} role="img" />;
}

/** A paragraph in the same hand, for the notes in the margins. */
export function HandNote({
  text, size = 17, width = 260, className, colour = '#5c5348', seed = 3,
}: {
  text: string; size?: number; width?: number; className?: string; colour?: string; seed?: number;
}) {
  const host = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = host.current;
    if (!c) return;
    const draw = () => {
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      const w = width;
      // Two passes: once to find the height, once to draw it. Cheaper than
      // laying the text out twice in two places and getting them out of step.
      const probe = document.createElement('canvas').getContext('2d');
      let h = size * 4;
      if (probe) h = writeBlock(probe, text, 0, size, w - size * 0.4, { size, seed }) + size;
      c.width = w * dpr;
      c.height = Math.ceil(h) * dpr;
      c.style.width = `${w}px`;
      c.style.height = `${Math.ceil(h)}px`;
      const g = c.getContext('2d');
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      g.fillStyle = colour;
      g.strokeStyle = colour;
      writeBlock(g, text, size * 0.2, size, w - size * 0.4, {
        size, seed, waver: 0.016,
        pencil: { press: 0.88, grade: 0.7, passes: 2, size: Math.max(1.05, size * 0.05) },
      });
    };
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [text, size, width, colour, seed]);
  return <canvas className={className} ref={host} aria-label={text} role="img" />;
}

/** One piece of music, ruled and written out by hand. */
export function Stave({ piece, height = 118, seed = 5 }: { piece: Piece; height?: number; seed?: number }) {
  const host = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = host.current;
    if (!c) return;
    const draw = () => {
      const parent = c.parentElement;
      const w = Math.max(280, (parent?.clientWidth ?? 600) - 4);
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      c.width = w * dpr;
      c.height = height * dpr;
      c.style.width = '100%';
      c.style.height = `${height}px`;
      const g = c.getContext('2d');
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, height);
      g.fillStyle = '#2b2721';
      g.strokeStyle = '#2b2721';
      const gap = 11;
      drawStave(g, 10, height / 2 - gap * 2 - 6, w - 20, piece, { gap, seed });
    };
    draw();
    const ro = new ResizeObserver(draw);
    if (c.parentElement) ro.observe(c.parentElement);
    return () => ro.disconnect();
  }, [piece, height, seed]);
  return <canvas ref={host} aria-label={`${piece.title}, written out`} role="img" />;
}
