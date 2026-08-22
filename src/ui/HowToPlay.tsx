import { Sheet, SheetHeader } from './Sheet';

export function HowToPlay({ onBack }: { onBack: () => void }) {
  return (
    <Sheet seed={31}>
      <SheetHeader title="Pen Fight" subtitle="Rules of the desk" />

      <h2 className="title center">How to play</h2>

      <div className="rule--thin" />

      <ol className="list-note">
        <li>
          <b>Press on your pen</b> — the one on your side of the desk.
        </li>
        <li>
          <b>Drag backwards</b> and let go. The further you pull, the harder the
          flick. The arrow shows where it is going.
        </li>
        <li>
          <b>Where you press matters.</b> Press the middle of the barrel for a
          clean push. Press near the nib or the cap and the pen pivots as it
          goes — useful when their pen is behind yours.
        </li>
        <li>
          Then it is <b>their turn</b>. One flick each, back and forth.
        </li>
        <li>
          <b>The pen that goes off the desk loses the point.</b> Knock your own
          pen off and the point is theirs — that has always been the rule.
        </li>
        <li>
          First to win the majority of the rallies takes the match. In a
          two-player match the loser hands over <b>the pen they were holding</b>.
        </li>
      </ol>

      <div className="rule--thin" />

      <div className="eyebrow">Choosing a pen</div>
      <p className="lede" style={{ textAlign: 'left', marginTop: 8 }}>
        Heavy pens like the Hero 616 shove anything out of the way but need a
        real flick to move. Light ones like the Montex fly, and fly off the edge
        just as easily. A pen that <b>skids</b> keeps running; one that{' '}
        <b>bites</b> stops where you left it — which is safer, and duller.
      </p>
      <p className="lede" style={{ textAlign: 'left' }}>
        The Trimax is the Trimax. You will know when you get one.
      </p>

      <div className="rule--thin" />

      <div className="eyebrow">The ladder</div>
      <p className="lede" style={{ textAlign: 'left', marginTop: 8 }}>
        You can only challenge the player one rank above you. Beat them and you
        take their place; lose and you drop points. Practice matches never cost
        you a pen and barely move your points, so warm up there.
      </p>

      <div className="mt-lg">
        <button className="btn btn--primary" onClick={onBack}>
          Got it
        </button>
      </div>
    </Sheet>
  );
}
