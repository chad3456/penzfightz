# Recipe: scrapbook collage reel

What this format is, learned by measuring and looking at a creator's 22-second reel (720 × 1280, 30 fps). Only the format was taken. No frames, faces, footage, audio, logos or text from it are reused. The host, scenes, type and score here are all new.

## Numbers from the reference

| Measure | Reference |
|---|---|
| Shot length (median / mean) | 0.67 s / 1.32 s |
| Cuts per minute | 45 |
| Transitions | Hard cuts (no fades) |
| Camera | Mostly locked. Small vertical pans and push-ins on the clip window |
| Palette | Cream `#f5f5de`, bubblegum pink `#e396ad` and `#e15c9b`, blush `#e8cad2`, periwinkle `#919bb0` and `#6f6b98`, cocoa `#917051` and `#5b463b`, near-black ink `#261b20` |
| Surface | Bright (L 0.66), low contrast, soft glow, almost no grain |
| Speech | Talking about a third of the time over music, fast while talking |

## Look

- **Backdrop.** A pastel textile fills the frame: vertical candy stripes (pink/cream or sage/cream), gingham, grid paper, checks or plaid. Giant hand-drawn pink five-point stars float over it, cropped by the edges.
- **Clip window.** One big portrait window holds the "footage". It has a thick white border (sometimes hot pink or navy, sometimes a white mat) and a soft drop shadow. Sometimes two windows are stacked.
- **Stickers.** Glossy objects (money, bags, gems, cake, coins) are die-cut with a white edge and a soft shadow. They hang over the window edges and pop in.
- **Host.** A cut-out bobblehead in the lower-left corner, with a big head and a small body. It sits behind a silver laptop decorated with stickers, and stays on screen through the middle of the reel. The intro shows the host full-body in a dreamy pink-cloud meadow, then inside a CRT TV with a hypnotic heart tunnel and stage lights.
- **Type.** One or two loud words per shot rather than full captions. Mixed voices:
  - a heavy geometric sans: white with a shadow, neon lime, hot pink with a white edge, or ALL CAPS;
  - a gold wedding script;
  - a handwritten marker;
  - a typing line with a cursor;
  - iMessage bubbles;
  - big counted numbers ("3 Brand Trips").
- **Edit.** A new idea every 1–2 seconds, a hard cut on the beat of the speech, and an occasional white flash on a reveal.
- **Structure.**
  1. Cold "hey" plus the host.
  2. TV hook.
  3. Body beats inside the collage frame.
  4. A thesis or test.
  5. A follow call to action back in the cloud meadow.

## How this repo builds it

| Reference element | Here |
|---|---|
| Creator's own cut-out face | Original drawn host (copper curls, star clip, lilac turtleneck), or `meta.host.image` with your own cut-out |
| Phone footage in windows | Code-drawn scenes (`room`, `campus`, `city`, `suburb`, `street`, `stage`, `vintage`, `dream`, `sky`, `paper`, solid colours), or your own photos via `win.img` |
| Photo stickers | Microsoft Fluent 3D emoji (MIT), fetched by name, with a baked white edge |
| Fonts | Poppins 500–900, Great Vibes, Caveat, Courier Prime (all SIL OFL, from Google Fonts) |
| Voice | Piper TTS, LibriTTS high model (CC BY 4.0), speaker 60 |
| Music | Original synthesised bubblegum pop (116 bpm, I–V–vi–IV), ducked under the voice, with pop, blip, ding and type sound effects |
