---
name: collage-reel
description: Make a one-minute vertical explainer reel (1080 x 1920) on any topic in the pastel scrapbook-collage style - candy-stripe and gingham backdrops with giant pink stars, a white-framed clip window, glossy die-cut stickers, a cut-out bobblehead host behind a laptop, loud mixed-font words and fast cuts - with narration, original music and sound effects. Use when the user asks for a reel, short, TikTok or Instagram-style video "in this collage style", or names the collage-reel generator, for any topic.
---

# collage-reel

Topic in, MP4 out. You write one JSON script; the scripts fetch what is needed from the internet (fonts are bundled, stickers and the voice are downloaded once), voice it, and render.

```
script.json -> assets.py (stickers) -> voice.py (narration + word times) -> render.mjs --stills -> render.mjs (film)
```

For an app with sources (web, Wikipedia, EPUB), Claude research and writing, archival photo search and a storyboard editor, run **Reel Studio**: `npm run reel-studio` (see `tools/reel-studio/README.md`).

One command does all of it: `scripts/make.sh SCRIPT.json video-work/<slug> [--stills]`.
The style itself is described in `recipe.md`. A full example is in `examples/luxury-beliefs.json`.

## 1. Write the script (the part that is yours)

- **Research first.** Check every claim. Name who coined or found what, and when. Give the strongest criticism a line. Correct the user's premise on screen if it is wrong, and say so in your report.
- **Length.** About 150–165 spoken words is one minute with the default voice. Use short sentences, written for the ear.
- **Structure**, as in `recipe.md`:
  1. Hook: "Hey!" plus a provocative one-liner. Host full-body on `sky`, then on `tv`.
  2. Name it.
  3. Who and when.
  4. The mechanism.
  5. One or two concrete examples.
  6. The pushback.
  7. A one-line takeaway or test.
  8. A follow call to action on `sky`.
- **Pace.** Aim for about 35–45 cuts a minute: a new shot every 2–6 spoken words. Every shot shows one loud word or phrase and one to four stickers.

```json
{
  "meta": { "title": "...", "brief": "the user's words", "voice": { "speaker": 60, "speed": 1.0 },
            "music": { "bpm": 116, "key": "F" }, "lead": 0.25, "gap": 0.16, "tail": 1.8,
            "host": { "image": "me.png" } },
  "lines": [
    { "say": "Back in 1899, Thorstein Veblen said...", "speak": "Back in eighteen ninety-nine, ...",
      "shots": [ { "w": 3, "bg": "plaid:pink", "win": { "scene": "vintage", "cam": "pull" }, "items": [ ... ] }, { ... } ] }
  ]
}
```

### Lines and their fields

- `say`: what is shown, and what the words are timed against.
- `speak`: optional. Use it when the text should be read differently from how it is shown, such as numbers or acronyms.
- `gap`: optional. The pause after the line.
- `shots`: these split the line. Each shot takes its `w` words, and the last shot takes the rest.

### Shot fields

| Field | Values |
|---|---|
| `bg` | `stripes`, `grid`, `gingham`, `check` or `plaid`, followed by `:pink`, `:green`, `:lilac`, `:blue`, `:hot` or `:cream`; or `sky` (cloud meadow), or `tv` (CRT heart tunnel). `stars: false` removes the star layer. |
| `win` | `{ scene, frame, box, cam }`, or `false` for no window. Details in the next table. |
| `win2` | A second window, for example with `box: "top"` and `box: "bottom"`. |
| `host` | `"corner"` (default), `"right"`, `"center"` (full body, for `sky` and `tv`), or `false`. |
| `flash` | `true` adds a white flash and whoosh on a reveal. |

`win` fields:

| Field | Values |
|---|---|
| `scene` | `room`, `campus`, `city`, `suburb`, `street`, `stage`, `vintage`, `dream`, `sky`, `paper`, or a colour such as `"#8a6a4c"`. Use `img: "photo.jpg"` (with an optional `fx`, as for `photo` items) instead of `scene` for a photo. |
| `frame` | `white`, `pink`, `navy`, `mat`, `tape`, `tv` (CRT bezel with scanlines) or `none`. |
| `box` | `main` (default), `tall`, `top`, `bottom`, `inset`, `mid`, `full`, or `[x, y, w, h]` in %. |
| `cam` | `push`, `pull`, `up`, `down`, `left`, `right` or `still`. |

### Items

All coordinates are percentages of the 1080 × 1920 frame, and `x`/`y` is the item's centre.

| Item | Fields |
|---|---|
| sticker | `{ "e": "money bag", x, y, size, r }`. Any Unicode emoji name as a Fluent 3D sticker. Not every object exists: there is no "yacht" (use "speedboat") and no "piggy bank" (use "pig face"). `assets.py` lists names it could not find. |
| text | `{ "t": "line one\nline two", style, size, x, y, w, color, mark, reveal }`. `style` is one of `bold`, `huge`, `neon`, `hot`, `pink`, `ink`, `caps`, `script`, `hand`, `handpink`, `type` (types out with a cursor), `mono` or `sub`. `mark: "#e3ff3b"` adds a highlighter swipe behind the text. `reveal` is `pop`, `words` (in time with the voice), `type` or `none`. |
| count | `{ "k": "count", "n": "3", "label": "Brand\nTrips", size }`. A big lime number with a stacked label. |
| bubble | `{ "k": "bubble", "t": "...", "side": "l" or "r" }`. A chat bubble. |
| tag | `{ "k": "tag", "t": "..." }`. A white pill label. |
| def | `{ "k": "def", "word", "pos", "def", "by" }`. A dictionary card that fills in as it is spoken. |
| note | `{ "k": "note", "lines": [...] }`. A notebook page written in pink marker. |
| stamp | `{ "k": "stamp", "t": "...", "color" }`. Slams on with a thud. |
| bars | `{ "k": "bars", "bars": [{ "label", "v", "color" }] }`. Growing columns. |
| pola | `{ "k": "pola", "scene" or "img", "cap" }`. A Polaroid. |
| photo | `{ "k": "photo", "src": "file.jpg", "fx", "frame", "cap", size }`. An archival photo baked once with an effect (`none`, `faded`, `sepia`, `bw`, `duotone`, `pinkwash`, `halftone`, `riso`, `vhs`; vintage looks add grain, scratches and dust) in a paper frame (`polaroid`, `tape`, `torn`, `cutout`, `stamp`, `white`, `tv`, `plain`), with a slow Ken Burns zoom. |
| doodle | `{ "k": "doodle", "shape": "circle", "arrow" or "underline", "color" }`. A hand-drawn mark. |
| img | `{ "k": "img", "src": "file.png", size }`. One of your own images. |

Timing on any item:
- `at`: seconds into the shot, or `"wN"` to appear when the shot's Nth spoken word starts (counting from 0).
- `in`: the entrance, one of `pop`, `drop`, `rise`, `slam`, `zoom`, `left`, `right`, `fade` or `none`.

## 2. Make it

```bash
cd <repo>
npm i --no-save playwright                      # once, if missing
.claude/skills/collage-reel/scripts/make.sh .claude/skills/collage-reel/examples/luxury-beliefs.json video-work/luxury-beliefs --stills
# look at video-work/<slug>/contact.jpg and the still_NN.png files
.claude/skills/collage-reel/scripts/make.sh SCRIPT.json video-work/<slug> --name <slug>.mp4 --workers 4
```

- **Check every still before rendering.** Look for:
  - text running off the window or wrapping badly (lower `size`);
  - stickers covering words;
  - anything under the host in the lower-left (keep items above y 68% when x < 32%);
  - white or neon text on a pale scene.
- **Render time.** About 4 frames a second on 4 cores, so 7–8 minutes for a minute of film. `--scale 0.5` makes quick drafts. `--from/--to` renders a slice.
- **Live preview.** Open `engine/reel.html?reel=...&voice=...&stickers=...` from a static server.
- **Compare with a reference.** `video-recipe`'s `analyze.py` and `compare.py` work on the output.

## Rules

- **Style, not content.** Never reuse a reference creator's face, footage, audio, logos or text. The default host is an original character. Use a real person's photo only if it is the user's own.
- **No impersonation.** Don't put words in a real person's mouth as fake posts or tweets. Attribute ideas ("Henderson argues...") and paraphrase. Keep any quotes short and exact.
- **Credits to pass on with the video:**
  - Voice: Piper, LibriTTS model (CC BY 4.0).
  - Stickers: Microsoft Fluent Emoji (MIT).
  - Fonts: SIL OFL.
  - Music and sound effects: generated.
- **The voice is synthetic.** Say so when you report back.
