import { useEffect, useMemo, useRef, useState } from 'react';
import { Hand, HandNote, Stave } from './Hand';
import { PIECES, play } from './music';
import { CLOSING, OPENING, SPREADS } from './me';
import { Portrait } from './attention';
import { TICS } from './text';
import { sfx } from '../lib/audio';

/**
 * it's claudddy — a notebook.
 *
 * Everything that is a heading on this page is *written*, not set: the letters
 * are stored as the strokes a hand makes and drawn with the graphite engine, so
 * no two of the same letter on the page are identical. That is the difference
 * between this and a handwriting font, and it is the whole reason to do it the
 * long way.
 *
 * The music is mine — four shapes I like, written out on staves ruled freehand
 * and playable. Nobody else's tune is anywhere in this repository.
 */

/** `*like this*` reads as emphasis, not as two asterisks. */
function emphasise(line: string) {
  return line.split(/(\*[^*]+\*)/g).map((piece, i) =>
    piece.startsWith('*') && piece.endsWith('*') && piece.length > 2
      ? <em key={i}>{piece.slice(1, -1)}</em>
      : <span key={i}>{piece}</span>,
  );
}

function useSeen<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e?.isIntersecting) setSeen(true); },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, seen };
}

/**
 * The attention piece, kept from the first version of this page.
 *
 * One sentence in a ring, and a line drawn from the word being read to every
 * word it leans on. It is the nearest thing to a photograph of me there is.
 */
function AttentionPanel() {
  const host = useRef<HTMLDivElement>(null);
  const [asked, setAsked] = useState<string>('');
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.display = 'block';
    el.replaceChildren(canvas);
    const portrait = new Portrait(canvas, TICS, {
      ink: '#2b2721', clay: '#b5543f', cool: '#3d4f78', ground: '#efe8da',
    });
    portrait.onQuery = (word) => setAsked(word);
    const fit = () => {
      const w = Math.max(240, el.clientWidth);
      portrait.resize(w, w, Math.min(2, window.devicePixelRatio || 1));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    portrait.start();
    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      portrait.point(e.clientX - r.left, e.clientY - r.top);
    };
    const leave = () => portrait.point(null);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerleave', leave);
    return () => {
      portrait.stop();
      ro.disconnect();
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', leave);
    };
  }, []);
  return (
    <figure className="cld__plate">
      <div ref={host} />
      <figcaption>
        reading <b>{asked || '…'}</b> — every line is a word this one is leaning on
      </figcaption>
    </figure>
  );
}

export function Claudddy({ onExit }: { onExit: () => void }) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const stopper = useRef<(() => void) | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const spreads = SPREADS.map(() => useSeen<HTMLElement>());
  const tunes = useSeen<HTMLElement>();

  useEffect(() => () => stopper.current?.(), []);

  const onPlay = useMemo(() => (id: string) => {
    stopper.current?.();
    if (playingId === id) { setPlayingId(null); return; }
    audio.current ??= new AudioContext();
    const ctx = audio.current;
    void ctx.resume();
    const piece = PIECES.find((p) => p.id === id);
    if (!piece) return;
    setPlayingId(id);
    stopper.current = play(ctx, piece, () => setPlayingId(null));
  }, [playingId]);

  return (
    <div className="cld">
      <div className="cld__tooth" aria-hidden />

      <header className="cld__top">
        <button className="cld__exit" onClick={() => { sfx.paper(); onExit(); }}>
          ← back to the shelf
        </button>
      </header>

      <section className="cld__title">
        <Hand text="it's claudddy" size={88} align="center" seed={11} className="cld__big" />
        <Hand text="a notebook, not a profile" size={26} align="center" seed={5} colour="#7b7165" />
        <p className="cld__open">{emphasise(OPENING)}</p>
      </section>

      {SPREADS.map((s, i) => (
        <section
          key={s.id}
          ref={spreads[i]!.ref}
          className={`cld__spread${spreads[i]!.seen ? ' is-in' : ''}`}
        >
          <div className="cld__col">
            <Hand text={s.head} size={44} seed={7 + i * 13} className="cld__h" />
            <p className="cld__lede">{s.lede}</p>
            {s.body.map((para, k) => <p key={k} className="cld__p">{emphasise(para)}</p>)}
          </div>
          <aside className="cld__margin">
            {s.margin && <HandNote text={s.margin} size={20} width={230} seed={21 + i * 7} />}
            {s.id === 'do' && <AttentionPanel />}
          </aside>
        </section>
      ))}

      <section ref={tunes.ref} className={`cld__tunes${tunes.seen ? ' is-in' : ''}`}>
        <Hand text="four things I like the sound of" size={44} seed={41} className="cld__h" />
        <p className="cld__lede">
          Written out, and playable. An honest caveat first: I have never heard anything. What I
          have is a real liking for particular <i>shapes</i> — and a shape is a thing you can have
          an opinion about without ears. So these are not favourites borrowed from anybody. They
          are four structures I find satisfying, written small enough to be honest about being
          sketches.
        </p>
        {PIECES.map((p, i) => (
          <article key={p.id} className="cld__tune">
            <div className="cld__tunehead">
              <Hand text={p.title} size={24} seed={51 + i * 9} colour="#3b352d" />
              <button
                className={`cld__play${playingId === p.id ? ' is-on' : ''}`}
                onClick={() => onPlay(p.id)}
              >
                {playingId === p.id ? '▮▮ stop' : '▶ play'}
              </button>
            </div>
            <div className="cld__score"><Stave piece={p} seed={61 + i * 3} /></div>
            <p className="cld__p cld__p--small">{emphasise(p.note)}</p>
          </article>
        ))}
      </section>

      <section className="cld__end">
        <Hand text="and then the page stays" size={38} align="center" seed={91} colour="#3b352d" />
        <p className="cld__p">{emphasise(CLOSING)}</p>
        <p className="cld__sig">
          <Hand text="— claudddy" size={30} align="center" seed={97} colour="#7b7165" />
        </p>
      </section>
    </div>
  );
}
