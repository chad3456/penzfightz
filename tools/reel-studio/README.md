# Reel Studio

A local app for making one-minute collage explainer reels on any topic: pastel stripes and gingham under giant pink stars, a framed window or an archival photo, glossy stickers, a bobblehead host behind a laptop, loud words, fast cuts, narration and music. The look is described in `.claude/skills/collage-reel/recipe.md`.

```bash
npm install
npm i --no-save playwright      # once; the renderer drives a headless Chromium
pip install piper-tts numpy     # once; the narrator voice
export ANTHROPIC_API_KEY=...    # optional: lets Claude research and write
npm run reel-studio             # then open http://localhost:4417
```

You also need ffmpeg and python3 on your PATH. The narrator voice (about 140 MB) downloads on first use.

## How it works

### 1. Topic and sources

Say what the reel is about, then add whatever it should be built from:

- **Web links.** The readable text is pulled out of the page. A link to an `.epub` is read as a book.
- **Wikipedia.** The article for your topic.
- **EPUB books.** Drop one in. Its chapters show up with word counts, and you tick the ones the reel should draw on. Pictures inside the book go into your photo library, credited to the book. That makes an illustrated public-domain book a ready-made source of archival images.
- **Notes.** Paste anything.
- **Research the web with Claude** (needs a key). Claude searches the web and adds fact notes, with links, as a source.

Then choose **Write the script**:

- **With a key:** Claude (`claude-opus-5-5`) reads the sources and writes a fact-checked plan. Every shot gets a layout, a headline, stickers and an archival photo search. If your brief had a wrong premise, Claude fixes it and lists what it fixed. Output is constrained to a JSON schema.
- **Without a key:** you get an offline draft picked out of your sources. Rewrite it in your own words before you publish.
- **Use my own narration:** you paste what the host should say, and the studio plans all the shots, stickers and photos.

### 2. Storyboard

Each line of narration has its shots. For each shot you can change:
- how many spoken words it lasts;
- the layout;
- the headline and its type style;
- the stickers (any emoji name, such as "money bag" or "high voltage");
- the photo, with its effect and frame.

Everything saves and previews live in the phone on the right.

Layouts:

| Layout | What it shows |
|---|---|
| `intro` | Host in the clouds |
| `tv` | Host in a retro TV |
| `window` | A scene or photo in a framed window |
| `tvphoto` | An archival photo on a CRT screen |
| `polaroid` | One photo |
| `stack` | Two photos |
| `cutout` | A photo cut out like a sticker |
| `count` | A big number and a label |
| `type` | Typed text with a cursor |
| `note` | Notebook lines |
| `chat` | Chat bubbles |
| `stamp` | A rubber stamp |
| `definition` | A dictionary card |
| `outro` | The closing shot |

### 3. Photos

Search open collections from the app: Wikimedia Commons, Openverse, the Library of Congress, the Met, the Art Institute of Chicago and NASA.
- Only public domain, CC0 and CC BY or BY-SA results are marked as free to use. The app asks before adding anything else.
- You can also upload your own photos.
- Each photo is baked with an effect: `faded`, `sepia`, `bw`, `duotone`, `pinkwash`, `halftone`, `riso` or `vhs`. Archival looks add grain, film scratches and dust.
- Each photo also gets a paper frame: `polaroid`, washi `tape`, `torn`, scissor `cutout`, postage `stamp`, white, or a CRT `tv`.
- The photo look setting (Archival, Pop or Clean) picks the defaults.

### Voice and render

- **Record voice** synthesises the narration (Piper, LibriTTS voice, CC BY 4.0), so the preview plays in sync.
- **Render video** writes a 1080 × 1920 MP4 with an original score and sound effects, loudness-matched for Reels and TikTok, plus `credits.txt`. Credits list every source, photo (title, creator, licence, link), voice, sticker set and font.
- A minute takes about 5 minutes on 4 cores. **Quick draft** renders at half size.

Projects live in `video-work/studio/<project>/` (git-ignored): `project.json`, `media/`, `vo/`, `out/`.

## Settings

| Variable | Default | |
|---|---|---|
| `PORT` | 4417 | |
| `HOST` | 127.0.0.1 | The app is for your machine only |
| `ANTHROPIC_API_KEY` | | Or `ant auth login`. Enables research and writing with Claude |
| `REEL_MODEL` | `claude-opus-5-5` | |
| `REEL_OFFLINE` | | Set to ignore Claude even when a key is present |
| `REEL_STUDIO_DIR` | `video-work/studio` | Where projects are stored |
| `REEL_CACHE` | `video-work/reel-cache` | Stickers and the voice model |
| `PIPER_MODEL` | LibriTTS high | Any Piper `.onnx` voice |

## Rights

Use books, pages and photos you have the right to use. Claude is told to paraphrase and keep quotes under 15 words. Offline drafts reuse sentences from your sources, so rewrite them, especially from copyrighted books. The voice is synthetic, so say so where platforms ask.
