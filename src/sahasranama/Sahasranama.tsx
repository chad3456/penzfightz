import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BODY_ANCHORS, Cosmos, type FormationName } from './cosmos';
import { CURATED, NAMES, STOTRAM } from './data';
import { GITA11 } from './gita11';

/**
 * Vishnu Sahasranama — a deep dive, in starlight.
 *
 * One particle cosmos sits behind the page and changes shape as you scroll:
 * Krishna's face, the bed of arrows Bhishma lay on, a lotus, the cosmic body
 * of the Dhyana shloka, the Vishvarupa of Gita 11, and at last a galaxy whose
 * thousand brightest stars are the thousand names — each one touchable, and
 * searchable. The chrome borrows its manners from trinetra.shivag.fyi: navy,
 * letterspaced capitals, gold Devanagari, a chapter counter in the corner.
 */

interface Chapter { key: string; form: FormationName; label: string; sa: string }

const CHAPTERS: Chapter[] = [
  { key: 'awaken', form: 'face', label: 'Awakening', sa: 'प्रबोधः' },
  { key: 'arrows', form: 'arrows', label: 'The Bed of Arrows', sa: 'शरशय्या' },
  { key: 'answer', form: 'lotus', label: 'The Answer', sa: 'उत्तरम्' },
  { key: 'body', form: 'body', label: 'The Cosmic Body', sa: 'त्रिभुवनवपुः' },
  { key: 'vishvarupa', form: 'vishvarupa', label: 'The Universal Form', sa: 'विश्वरूपम्' },
  { key: 'names', form: 'galaxy', label: 'The Thousand Names', sa: 'सहस्रनाम' },
  { key: 'stories', form: 'hero', label: 'Names That Tell Stories', sa: 'कथाः' },
  { key: 'stotram', form: 'dust', label: 'The Stotram', sa: 'स्तोत्रम्' },
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Split a shloka at its danda marks, for setting it in lines. */
function lines(deva: string) {
  return deva
    .replace(/॥\s*[०-९]+\s*॥?/g, '॥')
    .split(/\s*[।॥|]+\s*|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Loose Latin for search: diacritics off, the aspirated sibilants as people type them. */
function loose(s: string) {
  return s
    .toLowerCase()
    .replace(/ṛ/g, 'ri')
    .replace(/[śṣ]/g, 'sh')
    .replace(/c(?!h)/g, 'ch')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ऀ-ॿ]/g, '');
}

const INDEX = NAMES.map(([n, deva, iast]) => ({
  n,
  deva,
  iast,
  key: loose(iast) + ' ' + (CURATED[n] ? loose(CURATED[n]!.n) : ''),
}));

function search(q: string) {
  const t = q.trim();
  if (!t) return null;
  if (/^\d+$/.test(t)) {
    const n = +t;
    return n >= 1 && n <= 1000 ? [n] : [];
  }
  const dev = /[ऀ-ॿ]/.test(t);
  // the names are in the dative (Keshavaya, Vishnave), so drop a final vowel from what was typed
  const l = dev ? t : loose(t).replace(/([^aeiou])[aeiou]+$/, '$1');
  if (!l) return null;
  return INDEX.filter((r) => (dev ? r.deva.includes(l) : r.key.includes(l))).map((r) => r.n);
}

const GOLD = new Set(Object.keys(CURATED).map(Number));

export function Sahasranama({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const cosmosRef = useRef<Cosmos | null>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pinRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [eye, setEye] = useState(0);
  const [tab, setTab] = useState(0);
  const [iast, setIast] = useState(false);

  const low = useMemo(() => {
    const q = new URLSearchParams(window.location.search);
    return q.has('low') || window.matchMedia('(max-width: 700px)').matches || (navigator.hardwareConcurrency ?? 8) <= 4;
  }, []);

  // fonts: the sacred set lives in public/, shared with the films
  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '/fonts-sacred/fonts.css';
    document.head.appendChild(l);
    return () => l.remove();
  }, []);

  // the cosmos
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const cos = new Cosmos(c, '/', low);
    cosmosRef.current = cos;
    const fit = () => cos.resize(window.innerWidth, window.innerHeight);
    fit();
    window.addEventListener('resize', fit);
    cos.onHover = (i, x, y) => setHover(i < 0 ? null : { i, x, y });
    cos.paintStars(GOLD, null);
    let alive = true;
    void cos.load().then(() => {
      if (!alive) return;
      setReady(true);
    });
    return () => {
      alive = false;
      window.removeEventListener('resize', fit);
      cos.dispose();
      cosmosRef.current = null;
    };
  }, [low]);

  // scroll drives the chapter
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const mid = window.innerHeight * 0.55;
    let a = 0;
    sectionRefs.current.forEach((s, i) => {
      if (s && s.getBoundingClientRect().top < mid) a = i;
    });
    setActive(a);
    setProgress(el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight));
  }, []);

  useEffect(() => {
    if (ready) cosmosRef.current?.go(CHAPTERS[active]!.form);
  }, [active, ready]);

  // the Vishvarupa: once the eye is open, the vision comes a verse at a time
  useEffect(() => {
    if (eye < 1 || eye >= GITA11.length - 1) return;
    const t = window.setTimeout(() => setEye((e) => e + 1), eye === 1 ? 1600 : 2600);
    return () => window.clearTimeout(t);
  }, [eye]);

  const gitaRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  activeRef.current = active;
  useEffect(() => {
    if (eye < 1 || activeRef.current !== 4) return;
    const last = gitaRef.current?.lastElementChild as HTMLElement | null;
    last?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [eye]);

  const openEye = () => {
    cosmosRef.current?.unleash();
    setEye(1);
  };

  // search lights up the matching stars
  const matches = useMemo(() => search(query), [query]);
  useEffect(() => {
    cosmosRef.current?.paintStars(GOLD, matches ? new Set(matches.map((n) => n - 1)) : null);
  }, [matches]);

  // labels that ride on the particles: the body's parts, and a pinned star
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const cos = cosmosRef.current;
      if (!cos) return;
      const onBody = CHAPTERS[active]!.form === 'body';
      BODY_ANCHORS.forEach((b, i) => {
        const el = labelRefs.current[i];
        if (!el) return;
        const p = cos.toScreen(b[3]);
        el.style.transform = `translate(${p.x}px, ${p.y}px)`;
        el.style.opacity = onBody && !p.behind ? '1' : '0';
      });
      const pin = pinRef.current;
      if (pin) {
        if (pinned != null && cos.starsVisible > 0.5) {
          const p = cos.starScreen(pinned - 1);
          pin.style.transform = `translate(${p.x}px, ${p.y}px)`;
          pin.style.opacity = '1';
        } else pin.style.opacity = '0';
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, pinned]);

  const jump = (i: number) => sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const pin = (n: number) => {
    setPinned(n);
    if (active !== 5) jump(5);
  };

  // a click on a hovered star pins it
  const onClick = () => {
    const cos = cosmosRef.current;
    if (cos && active === 5 && cos.hover >= 0) setPinned(cos.hover + 1);
  };

  const card = (n: number) => {
    const row = NAMES[n - 1]!;
    const c = CURATED[n];
    return (
      <>
        <div className="vs-tip__num">Name {n} of 1000</div>
        <div className="vs-tip__deva">ॐ {row[1]} नमः</div>
        <div className="vs-tip__iast">oṃ {row[2]} namaḥ</div>
        {c ? (
          <>
            <div className="vs-tip__name">{c.n}</div>
            <div className="vs-tip__m">{c.m}</div>
            {c.note ? <div className="vs-tip__note">{c.note}</div> : null}
          </>
        ) : null}
      </>
    );
  };

  const random = () => {
    const keys = [...GOLD];
    pin(keys[Math.floor(Math.random() * keys.length)]!);
  };

  const ch = CHAPTERS[active]!;
  const sec = STOTRAM[tab]!;
  const set = (i: number) => (el: HTMLElement | null) => {
    sectionRefs.current[i] = el;
  };

  return (
    <div className="vs" onClick={onClick}>
      <canvas ref={canvasRef} className="vs__canvas" aria-hidden="true" />
      <div className="vs__veil" />

      {/* corners */}
      <div className="vs-chrome vs-chrome--tl">
        <button className="vs-back" onClick={onExit}>
          ← Shelf
        </button>
        <span>Vishnu Sahasranama</span>
      </div>
      <div className="vs-chrome vs-chrome--tr" lang="sa">
        ॐ नमो भगवते वासुदेवाय
      </div>
      <div className="vs-chrome vs-chrome--bl">
        <b>
          {pad(active)} <i>/</i> {pad(CHAPTERS.length - 1)}
        </b>
        <span>{ch.label}</span>
      </div>
      <div className="vs-chrome vs-chrome--br">
        <div className="vs-progress">
          <div style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>
      <nav className="vs-dots" aria-label="Chapters">
        {CHAPTERS.map((c, i) => (
          <button key={c.key} className={i === active ? 'on' : ''} onClick={() => jump(i)} title={c.label} aria-label={c.label} />
        ))}
      </nav>
      <div className="vs-side" lang="sa">
        {ch.sa}
      </div>

      {/* labels that ride the cosmos */}
      {BODY_ANCHORS.map((b, i) => (
        <div
          key={b[0]}
          className="vs-anchor"
          ref={(el) => {
            labelRefs.current[i] = el;
          }}
        >
          <i />
          <span>
            <b>{b[0]}</b> {b[1]} — {b[2]}
          </span>
        </div>
      ))}
      <div className="vs-pin" ref={pinRef}>
        <i />
      </div>
      {hover && active === 5 ? (
        <div
          className="vs-tip"
          style={{
            left: Math.min(hover.x + 16, window.innerWidth - 300),
            top: Math.min(hover.y + 16, window.innerHeight - 220),
          }}
        >
          {card(hover.i + 1)}
        </div>
      ) : null}

      {!ready ? <div className="vs-loading">Gathering starlight…</div> : null}

      <div className="vs__scroll" ref={scrollRef} onScroll={onScroll}>
        {/* 00 */}
        <section className="vs-sec vs-sec--hero" ref={set(0)}>
          <p className="vs-kicker">Mahabharata · Anushasana Parva · 149</p>
          <h1 className="vs-deva vs-deva--xl" lang="sa">
            श्रीविष्णुसहस्रनाम
          </h1>
          <h2 className="vs-title">The Thousand Names of Vishnu</h2>
          <p className="vs-lede">
            A dying warrior, a grieving king, and a question the whole war could not answer. Bhishma's reply was a list — a
            thousand names for one God — and it has been recited, every morning, somewhere, for two thousand years.
          </p>
          <div className="vs-awaken">
            <span>Scroll to awaken</span>
            <i />
          </div>
        </section>

        {/* 01 */}
        <section className="vs-sec" ref={set(1)}>
          <p className="vs-kicker">01 · Kurukshetra, after</p>
          <h2 className="vs-title">The Bed of Arrows</h2>
          <p className="vs-body">
            The war is over. Eighteen days, eighteen armies, and almost nobody left. On the field lies Bhishma, grandsire of both
            sides, pierced so thickly with Arjuna's arrows that they hold him off the ground. He was granted the power to choose the
            hour of his death, and he has chosen to wait — for the sun to turn north.
          </p>
          <p className="vs-body">
            Yudhishthira has won a kingdom and lost everyone in it. He comes to the old man with Krishna beside him, and after days
            of teaching on duty and law and grief, he asks the questions underneath all the others:
          </p>
          <blockquote className="vs-verse">
            {[STOTRAM[0]!.verses[12]!, STOTRAM[0]!.verses[13]!].map((v, i) => (
              <div key={i} className="vs-verse__deva" lang="sa">
                {lines(v[0]).map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </div>
            ))}
            <ol className="vs-qs">
              <li>Who is the one God in the world?</li>
              <li>What is the one final refuge?</li>
              <li>By praising whom,</li>
              <li>by worshipping whom, do people reach the good?</li>
              <li>Of all dharmas, which do you hold the highest?</li>
              <li>By chanting what is a creature freed from the bonds of birth and death?</li>
            </ol>
            <cite>Yudhishthira · Purva Pithika, verses 8–9</cite>
          </blockquote>
        </section>

        {/* 02 */}
        <section className="vs-sec" ref={set(2)}>
          <p className="vs-kicker">02 · Bhishma speaks</p>
          <h2 className="vs-title">The Answer</h2>
          <blockquote className="vs-verse">
            <div className="vs-verse__deva" lang="sa">
              {lines(STOTRAM[0]!.verses[15]![0]).map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
            <p className="vs-verse__en">
              The Lord of the world, God of gods, the Infinite, the Highest Person — praise Him with a thousand names, staying
              awake to Him always.
            </p>
            <cite>Bhishma · verse 10</cite>
          </blockquote>
          <blockquote className="vs-verse">
            <div className="vs-verse__deva" lang="sa">
              {lines(STOTRAM[0]!.verses[19]![0]).map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
            <p className="vs-verse__en">
              This, to me, is the greatest of all dharmas: that a person worship the lotus-eyed one with devotion, with hymns,
              always.
            </p>
            <cite>verse 14</cite>
          </blockquote>
          <p className="vs-body">
            Then the colophon, which says who the hymn is <em>to</em>:
          </p>
          <blockquote className="vs-verse vs-verse--gold">
            <div className="vs-verse__deva" lang="sa">
              {lines(STOTRAM[0]!.verses[24]![0]).map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
            <p className="vs-verse__en">
              The seer of the thousand names is Veda Vyasa; the metre, anuṣṭubh; and the deity, the Lord — <b>the son of Devaki</b>.
            </p>
            <cite>verse 20</cite>
          </blockquote>
          <p className="vs-body">
            The son of Devaki is Krishna. The God Bhishma is describing is the man standing at Yudhishthira's shoulder, listening.
          </p>
        </section>

        {/* 03 */}
        <section className="vs-sec" ref={set(3)}>
          <p className="vs-kicker">03 · Dhyanam — before the names, a picture</p>
          <h2 className="vs-title">The Cosmic Body</h2>
          <p className="vs-body">
            Before a single name is said, the reciter is asked to see Him. Not as a figure in a temple, but as the three worlds
            arranged as a body. Drag to turn it; the parts are labelled on the stars.
          </p>
          <blockquote className="vs-verse">
            <div className="vs-verse__deva" lang="sa">
              {lines(STOTRAM[1]!.verses[1]![0]).map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
            <p className="vs-verse__en">
              Earth is His feet and the sky His navel; the wind is His breath, the moon and the sun His eyes, the directions His
              ears, heaven His head, fire His mouth and the ocean His belly. Inside Him the whole universe — gods, humans, birds,
              cattle, serpents, gandharvas and demons — plays in all its colours. To Vishnu, the Lord whose body is the three worlds,
              I bow.
            </p>
            <cite>Dhyana shloka 2</cite>
          </blockquote>
        </section>

        {/* 04 */}
        <section className="vs-sec vs-sec--vision" ref={set(4)}>
          <p className="vs-kicker">04 · Bhagavad Gita, chapter 11</p>
          <h2 className="vs-title">The Universal Form</h2>
          <p className="vs-body">
            Years earlier, on the same field, Arjuna had asked to see it with his own eyes. The Gita's eleventh chapter is what he
            saw — and the Sahasranama names that form too:{' '}
            <span className="vs-inline-deva" lang="sa">
              सहस्रमूर्धा विश्वात्मा सहस्राक्षः सहस्रपात्
            </span>{' '}
            — thousand-headed, Self of all, thousand-eyed, thousand-footed (names 224–227).
          </p>
          <div className="vs-gita" ref={gitaRef}>
            {GITA11.slice(0, eye === 0 ? 2 : eye + 1).map((g, i) => (
              <blockquote key={g.v} className={'vs-verse vs-verse--gita' + (i >= 2 ? ' vs-rise' : '')}>
                <div className="vs-verse__who">{g.who}</div>
                <div className="vs-verse__deva" lang="sa">
                  {lines(g.deva).map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </div>
                <p className="vs-verse__en">{g.en}</p>
                <cite>Gita {g.v}</cite>
              </blockquote>
            ))}
          </div>
          {eye === 0 ? (
            <button className="vs-cta" onClick={openEye}>
              <span lang="sa">दिव्यं ददामि ते चक्षुः</span>
              Open the divine eye
            </button>
          ) : null}
          <p className="vs-small">English: Shri Purohit Swami (1935).</p>
        </section>

        {/* 05 */}
        <section className="vs-sec vs-sec--names" ref={set(5)}>
          <div className="vs-panel" data-nodrag>
            <p className="vs-kicker">05 · a thousand stars</p>
            <h2 className="vs-title vs-title--sm">The Thousand Names</h2>
            <p className="vs-body vs-body--sm">
              Every star in the spiral arms is a name, in the order they are recited, from <b>Viśvam</b> at the centre to{' '}
              <b>Sarvapraharaṇāyudha</b> at the rim. Gold stars carry a reading. Hover to read one; tap to pin it; search by name
              or number.
            </p>
            <div className="vs-search">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Keshava, Govinda, 108, गोविन्द…"
                aria-label="Search the names"
              />
              <button onClick={random}>A name</button>
            </div>
            {matches ? (
              <div className="vs-results">
                {matches.length === 0 ? <span className="vs-small">No name matches.</span> : null}
                {matches.slice(0, 18).map((n) => (
                  <button key={n} className={GOLD.has(n) ? 'gold' : ''} onClick={() => setPinned(n)}>
                    <b>{n}</b> {NAMES[n - 1]![2]}
                  </button>
                ))}
                {matches.length > 18 ? <span className="vs-small">+{matches.length - 18} more lit</span> : null}
              </div>
            ) : null}
            {pinned != null ? (
              <div className="vs-tip vs-tip--pinned">
                {card(pinned)}
                <button className="vs-x" onClick={() => setPinned(null)} aria-label="Unpin">
                  ×
                </button>
              </div>
            ) : null}
          </div>
        </section>

        {/* 06 */}
        <section className="vs-sec vs-sec--wide" ref={set(6)}>
          <p className="vs-kicker">06 · read slowly</p>
          <h2 className="vs-title">Names That Tell Stories</h2>
          <p className="vs-body">
            None of the thousand is a mere title: Bhishma calls them <em>gauṇa</em>, names that describe. Some are whole
            philosophies in a word; some are an avatar's life in two. Tap one to find its star.
          </p>
          <div className="vs-cards" data-nodrag>
            {Object.entries(CURATED).map(([k, c]) => (
              <button key={k} className="vs-card" onClick={() => pin(+k)}>
                <span className="vs-card__n">{pad(+k)}</span>
                <span className="vs-card__deva" lang="sa">
                  {NAMES[+k - 1]![1]}
                </span>
                <span className="vs-card__name">{c.n}</span>
                <span className="vs-card__m">{c.m}</span>
                {c.note ? <span className="vs-card__note">{c.note}</span> : null}
              </button>
            ))}
          </div>
        </section>

        {/* 07 */}
        <section className="vs-sec vs-sec--wide" ref={set(7)}>
          <p className="vs-kicker">07 · the whole hymn</p>
          <h2 className="vs-title">The Stotram</h2>
          <div className="vs-tabs" data-nodrag>
            {STOTRAM.map((s, i) => (
              <button key={s.key} className={i === tab ? 'on' : ''} onClick={() => setTab(i)}>
                <span lang="sa">{s.sa}</span>
                {s.en.split(' — ')[0]}
                <i>{s.verses.length}</i>
              </button>
            ))}
            <button className={'vs-toggle' + (iast ? ' on' : '')} onClick={() => setIast((v) => !v)}>
              IAST
            </button>
          </div>
          <div className="vs-reader" data-nodrag>
            <h3>{sec.en}</h3>
            {sec.verses.map(([d, t], i) => (
              <div key={i} className="vs-reader__v">
                <div className="vs-reader__deva" lang="sa">
                  {lines(d).map((l, j) => (
                    <span key={j}>{l}</span>
                  ))}
                </div>
                {iast ? <div className="vs-reader__iast">{t}</div> : null}
              </div>
            ))}
          </div>
          <footer className="vs-credits">
            <p lang="sa" className="vs-deva">
              ॐ तत् सत्
            </p>
            <p>
              Text of the stotram and the namavali: the MIT-licensed <em>hindu-devotional-texts</em> package (Ishank Gupta and
              contributors), following the recension recited in Shankara's tradition. Gita 11 in English: Shri Purohit Swami,
              1935, public domain. The readings of the names were written for this page after the traditional commentaries; they
              are glosses, not a translation.
            </p>
            <p>
              The particle figure is sampled from renders of Lee Perry-Smith's head scan (CC BY 3.0), sculpted and dressed for the
              Gita films. Type: Cinzel, Cormorant Garamond, Tiro Devanagari Sanskrit and Noto Serif Devanagari (SIL OFL). Design
              after trinetra.shivag.fyi.
            </p>
          </footer>
        </section>
      </div>
    </div>
  );
}
