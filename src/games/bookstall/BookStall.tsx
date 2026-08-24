import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QUOTES, STALL, TOTAL_QUOTES, drawNext, type Quote } from './quotes';
import { sfx } from '../../lib/audio';
import { Rosette } from './Rosette';

/**
 * The book stall.
 *
 * Cheap Soviet-printed Russian classics were everywhere in Indian bookshops in
 * the eighties and nineties — Progress and Raduga editions, sold by weight off
 * a pavement table next to the exam guides. This is that table, reduced to its
 * final act: you hand over a coin and the till prints you one line.
 *
 * The receipt is the whole interface. Thermal paper, a monospace till font, a
 * barcode nobody will ever scan, and small print that admits the translation is
 * somebody's rather than the author's.
 */

const SEEN_KEY = 'backbench.bookstall.seen';
const COUNT_KEY = 'backbench.bookstall.bills';

function readSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeSeen(ids: string[]) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
  } catch {
    /* private window; the bag just resets next visit */
  }
}

function readBills(): number {
  try {
    return Number(localStorage.getItem(COUNT_KEY) ?? '0') || 0;
  } catch {
    return 0;
  }
}

function writeBills(n: number) {
  try {
    localStorage.setItem(COUNT_KEY, String(n));
  } catch {
    /* ignore */
  }
}

/** A till prints two decimal places whether you like it or not. */
const rs = (n: number) => n.toFixed(2);

function pad(left: string, right: string, width = 32): string {
  const gap = Math.max(1, width - left.length - right.length);
  return left + ' '.repeat(gap) + right;
}

/** Bars of arbitrary width, exactly as meaningless as the real thing. */
function Barcode({ seed }: { seed: string }) {
  const bars = useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return Array.from({ length: 44 }, () => {
      h = (h * 1664525 + 1013904223) >>> 0;
      return 1 + ((h >>> 8) % 4);
    });
  }, [seed]);

  const digits = useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 17 + seed.charCodeAt(i)) >>> 0;
    return Array.from({ length: 12 }, (_, i) => ((h >>> (i * 2)) % 10).toString()).join('');
  }, [seed]);

  return (
    <div className="rcpt__barcode" aria-hidden="true">
      <div className="rcpt__bars">
        {bars.map((w, i) => (
          <i key={i} style={{ width: `${w}px`, opacity: i % 3 === 0 ? 0.9 : 0.75 }} />
        ))}
      </div>
      <div className="rcpt__barnum">{digits.replace(/(\d{4})(?=\d)/g, '$1 ')}</div>
    </div>
  );
}

interface Bill {
  quote: Quote;
  no: number;
  at: Date;
  counter: number;
  bagReset: boolean;
}

export function BookStall({ onExit }: { onExit: () => void }) {
  const [seen, setSeen] = useState<string[]>(() => readSeen());
  const [bills, setBills] = useState<number>(() => readBills());
  const [bill, setBill] = useState<Bill | null>(null);
  const [printing, setPrinting] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const press = useCallback(() => {
    if (printing) return;
    setPrinting(true);
    sfx.printer();

    // Let the printer run for a beat before the paper appears.
    timer.current = window.setTimeout(() => {
      const { quote, bagReset } = drawNext(seen);
      const nextSeen = bagReset ? [quote.id] : [...seen, quote.id];
      const nextBills = bills + 1;

      setSeen(nextSeen);
      writeSeen(nextSeen);
      setBills(nextBills);
      writeBills(nextBills);

      setBill({
        quote,
        no: nextBills,
        at: new Date(),
        counter: 1 + (nextBills % 3),
        bagReset,
      });
      setPrinting(false);
      sfx.tick();
    }, 900);
  }, [printing, seen, bills]);

  const reset = useCallback(() => {
    setSeen([]);
    writeSeen([]);
    setBill(null);
    sfx.paper();
  }, []);

  const collected = seen.length;
  const complete = collected >= TOTAL_QUOTES;

  const share = useCallback(async () => {
    if (!bill) return;
    const text = `"${bill.quote.text}"\n— Dostoevsky, ${bill.quote.work} (${bill.quote.year})`;
    try {
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
    } catch {
      /* dismissed */
    }
  }, [bill]);

  return (
    <div className="stall">
      <div className="stall__sign">
        <div className="stall__signname">{STALL.name}</div>
        <div className="stall__signsub">{STALL.line1}</div>
      </div>

      {/* ---------------------------------------------------- the receipt */}
      <div className="rcpt-slot">
        {bill ? (
          <div className="rcpt" key={bill.no}>
            <div className="rcpt__head">
              <div className="rcpt__shop">{STALL.name}</div>
              <div className="rcpt__sub">{STALL.line2}</div>
              <div className="rcpt__sub">
                {STALL.phone} · {STALL.est}
              </div>
              <div className="rcpt__sub">GSTIN {STALL.gst}</div>
            </div>

            <div className="rcpt__rule" />

            <pre className="rcpt__line">
              {pad(`BILL NO ${String(bill.no).padStart(4, '0')}`, bill.at.toLocaleDateString('en-GB'))}
            </pre>
            <pre className="rcpt__line">
              {pad(
                `COUNTER ${bill.counter}`,
                bill.at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
              )}
            </pre>

            <div className="rcpt__rule rcpt__rule--dash" />
            <pre className="rcpt__line rcpt__line--faint">{pad('ITEM', 'AMOUNT')}</pre>
            <div className="rcpt__rule rcpt__rule--dash" />

            <pre className="rcpt__line">{`1  DOSTOEVSKY, F.`}</pre>
            <pre className="rcpt__line">
              {pad(`   ${bill.quote.work.toUpperCase().slice(0, 22)}`, rs(bill.quote.price))}
            </pre>
            <pre className="rcpt__line rcpt__line--faint">
              {`   ${bill.quote.year} ed. · secondhand`}
            </pre>
            <pre className="rcpt__line">{pad('   ONE LINE, READ ALOUD', '0.00')}</pre>

            <div className="rcpt__rule rcpt__rule--dash" />

            {/* the thing you actually came for */}
            <blockquote className="rcpt__quote">
              <span className="rcpt__mark">“</span>
              {bill.quote.text}
              <span className="rcpt__mark">”</span>
            </blockquote>
            <div className="rcpt__attr">
              — {bill.quote.work}, {bill.quote.year}
              {bill.quote.ref && (
                <>
                  <br />
                  <span className="rcpt__ref">{bill.quote.ref}</span>
                </>
              )}
              {bill.quote.speaker && (
                <>
                  <br />
                  <span className="rcpt__speaker">{bill.quote.speaker}</span>
                </>
              )}
            </div>

            {/* The stall's flower, cut for this line and no other. */}
            <div className="rcpt__stamp">
              <Rosette seed={bill.quote.id} size={104} />
            </div>

            <div className="rcpt__rule rcpt__rule--dash" />

            <pre className="rcpt__line">{pad('SUBTOTAL', rs(bill.quote.price))}</pre>
            <pre className="rcpt__line rcpt__line--faint">{pad('DISCOUNT (REGULAR)', '0.00')}</pre>
            <pre className="rcpt__line rcpt__line--faint">{pad('ROUNDED OFF', '0.00')}</pre>
            <div className="rcpt__rule" />
            <pre className="rcpt__line rcpt__line--total">
              {pad('TOTAL', `INR ${rs(bill.quote.price)}`)}
            </pre>
            <div className="rcpt__rule" />
            <pre className="rcpt__line rcpt__line--faint">{pad('CASH', rs(bill.quote.price))}</pre>
            <pre className="rcpt__line rcpt__line--faint">{pad('CHANGE', '0.00')}</pre>

            <Barcode seed={bill.quote.id + bill.no} />

            <div className="rcpt__foot">
              <div>NO EXCHANGE · NO REFUND</div>
              <div>
                LINE {collected} OF {TOTAL_QUOTES} COLLECTED
              </div>
              {bill.bagReset && <div className="rcpt__reset">** NEW STOCK ARRIVED **</div>}
              <div className="rcpt__thanks">THANK YOU — COME AGAIN</div>
              <div className="rcpt__fineprint">
                {bill.quote.translator
                  ? `Translated from the Russian by ${bill.quote.translator}. Another translator would give you different words for the same line.`
                  : 'Translated from the Russian. Wording varies by translator; the stall does not vouch for any one of them.'}
              </div>
            </div>
          </div>
        ) : (
          <div className={`rcpt-empty${printing ? ' rcpt-empty--busy' : ''}`}>
            <div className="rcpt-empty__mouth" aria-hidden="true" />
            <p>
              {printing
                ? 'Printing…'
                : 'The man behind the table will find you something. He always does.'}
            </p>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- the counter */}
      <div className="stall__counter">
        <button className="stall__start" onClick={press} disabled={printing}>
          {printing ? 'Printing…' : bill ? 'Another one' : 'Start'}
        </button>

        <div className="stall__meter">
          <div className="stall__meter-track">
            <span style={{ width: `${(collected / TOTAL_QUOTES) * 100}%` }} />
          </div>
          <div className="stall__meter-read">
            {complete
              ? `All ${TOTAL_QUOTES} lines collected. The stall starts again.`
              : `${collected} of ${TOTAL_QUOTES} lines · ${bills} bill${bills === 1 ? '' : 's'} printed`}
          </div>
        </div>

        <div className="btn-row">
          {bill && (
            <button className="btn btn--small" style={{ flex: 1 }} onClick={share}>
              Keep this line
            </button>
          )}
          {collected > 0 && (
            <button className="btn btn--small" style={{ flex: 1 }} onClick={reset}>
              Clear the shelf
            </button>
          )}
        </div>

        <button className="btn btn--ghost" onClick={onExit}>
          Back to the shelf
        </button>
      </div>
    </div>
  );
}

/** Exported so the shelf can say how much stock there is. */
export const stallSize = QUOTES.length;
