import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Diorama, type Look } from './diorama';
import { SHELF } from './stories';
import { begin, nodeOf, offered, take, type Choice, type Reading, type Story } from './story';
import { sfx } from '../../lib/audio';

/**
 * The Reading Room.
 *
 * Four short stories, each one built as a set you are standing in rather than
 * a picture you are shown. Three are adaptations of work long out of
 * copyright — Dostoevsky, Kafka, Poe — and the fourth is an original written
 * for this shelf. Every card says which it is, because a reader is entitled to
 * know whose sentences they are reading.
 *
 * The reading itself is a graph, and the graph is checked rather than trusted:
 * every node offers at least one choice with nothing gating it, every node can
 * still reach an ending, and eight thousand random readings of each story
 * finish. A reader cannot arrive somewhere with the wrong things in their
 * pockets and find every door locked.
 */

const KIND: Record<string, string> = { grace: 'a way through', ruin: 'a way down', riddle: 'no way to tell' };

/**
 * The one piece of mark-up the prose is allowed.
 *
 * `*like this*` is emphasis, and it earns its place: three of the four stories
 * lean on it for a word said aloud, and the fourth uses it for words in a
 * language the narrator is losing. Rendered raw it puts asterisks on the page,
 * which is worse than having no emphasis at all.
 */
function emphasise(line: string) {
  return line.split(/(\*[^*]+\*)/g).map((piece, i) =>
    piece.startsWith('*') && piece.endsWith('*') && piece.length > 2 ? (
      <em key={i}>{piece.slice(1, -1)}</em>
    ) : (
      <span key={i}>{piece}</span>
    ),
  );
}

export function Library({ onExit }: { onExit: () => void }) {
  const [story, setStory] = useState<Story | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const [echo, setEcho] = useState<string | null>(null);
  const [look, setLook] = useState<Look | null>(null);
  const [ready, setReady] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dioramaRef = useRef<Diorama | null>(null);

  const node = useMemo(() => (reading ? nodeOf(reading.story, reading.at) : null), [reading]);
  const open = useMemo(() => (reading && node ? offered(node, reading.marks) : []), [node, reading]);

  // --- the renderer: one per reading, torn down on the way out
  useEffect(() => {
    if (!story) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const d = new Diorama(canvas);
    dioramaRef.current = d;
    d.onLook = setLook;

    const fit = () => d.resize(canvas.clientWidth, canvas.clientHeight);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    let raf = 0;
    const tick = () => {
      d.frame();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    setReady(true);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      d.dispose();
      dioramaRef.current = null;
      setReady(false);
    };
  }, [story]);

  // --- the scene follows the node
  useEffect(() => {
    if (!node || !ready) return;
    dioramaRef.current?.show(node.scene);
    setLook(null);
  }, [node, ready]);

  const openBook = useCallback((s: Story) => {
    sfx.paper();
    setStory(s);
    setReading(begin(s));
    setEcho(null);
  }, []);

  const choose = useCallback(
    (c: Choice) => {
      if (!reading) return;
      sfx.chalk();
      setEcho(c.echo ?? null);
      setReading(take(reading, c));
    },
    [reading],
  );

  const shut = useCallback(() => {
    setStory(null);
    setReading(null);
    setEcho(null);
    setLook(null);
  }, []);

  // ------------------------------------------------------------------- shelf

  if (!story || !reading || !node) {
    return (
      <div className="library">
        <div className="library__head glass">
          <div className="library__eyebrow">four short stories · you decide how they go</div>
          <h1 className="library__title">The Reading Room</h1>
          <p className="library__note">
            Each one is a room you stand in rather than a page you turn. Three are adaptations of stories long out of
            copyright; the fourth was written for this shelf. Every card says which.
          </p>
        </div>

        <div className="library__shelf">
          {SHELF.map((s) => (
            <button key={s.id} className="library__book" style={{ ['--spine' as string]: s.spine, ['--ink' as string]: s.ink }} onClick={() => openBook(s)}>
              <span className="library__spine" />
              <span className="library__bookTitle">{s.title}</span>
              <span className="library__author">{s.author}</span>
              <span className="library__blurb">{emphasise(s.blurb)}</span>
              <span className="library__source">{s.source}</span>
              <span className="library__open">open it →</span>
            </button>
          ))}
        </div>

        <button className="library__exit glass" onClick={onExit}>
          ← back to the shelf
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------------ reading

  const ending = node.ending;

  return (
    <div className="library library--reading" style={{ ['--ink' as string]: story.ink, ['--spine' as string]: story.spine }}>
      <canvas
        ref={canvasRef}
        className="library__stage"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          dioramaRef.current?.point(e.clientX - r.left, e.clientY - r.top);
        }}
        onPointerLeave={() => dioramaRef.current?.leave()}
      />

      {look && (
        <div className="library__look" style={{ left: look.x, top: look.y }}>
          {look.text}
        </div>
      )}

      <div className="library__bar glass">
        <button className="library__back" onClick={shut}>
          ← shut the book
        </button>
        <span className="library__running">{story.title}</span>
        <span className="library__count">
          {reading.path.length} {reading.path.length === 1 ? 'scene' : 'scenes'}
        </span>
      </div>

      <div className={`library__page glass${ending ? ' library__page--end' : ''}`}>
        {echo && !ending && <p className="library__echo">{emphasise(echo)}</p>}

        {ending && (
          <div className="library__ending">
            <span className="library__kind">{KIND[ending.kind] ?? ending.kind}</span>
            <h2 className="library__endTitle">{ending.title}</h2>
          </div>
        )}

        <div className="library__prose">
          {node.text.map((p, i) => (
            <p key={i}>{emphasise(p)}</p>
          ))}
        </div>

        {ending ? (
          <>
            <p className="library__endNote">{emphasise(ending.note)}</p>
            <div className="library__choices">
              <button className="library__choice" onClick={() => openBook(story)}>
                read it again — it goes differently
              </button>
              <button className="library__choice library__choice--quiet" onClick={shut}>
                back to the shelf
              </button>
            </div>
          </>
        ) : (
          <div className="library__choices">
            {open.map((c, i) => (
              <button key={`${c.to}-${i}`} className="library__choice" onClick={() => choose(c)}>
                {emphasise(c.text)}
              </button>
            ))}
          </div>
        )}

        {reading.marks.length > 0 && (
          <div className="library__marks">
            <span className="library__marksLabel">carrying</span>
            {reading.marks.map((m) => (
              <span key={m} className="library__mark">
                {m.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
