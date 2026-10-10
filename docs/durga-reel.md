# Maa Durga’s Valour — the reel

A one-minute vertical reel (1080 × 1920, 30 fps) of the goddess’s battles, cut
from the Navadurga gallery’s own pictures and music:

- the hatched pen-and-ink Durga, her lion, and the gods;
- Mahishasura and the shapes he takes;
- Smoke-eyes, Kali, Raktabija and the Mothers;
- the nine night portraits.

Every frame is a pure function of its time, and the score is rendered offline
from the music room’s own instruments, so the page and the file match.

- `src/navadurga/reel.ts` — the shots, captions, effects and score.
- `reels/durga.html` — plays it in the browser (`npm run dev`, then
  `/reels/durga.html`), with a scrubber.
- `scripts/render-durga-reel.mjs` — writes the MP4. It starts its own Vite
  server, so nothing else needs to be running:

      node scripts/render-durga-reel.mjs durga-reel.mp4 1920 30

## The cut

The cut runs at 120 bpm, so every cut lands on a beat. Hits get a shake and a
white flash. The biggest hits (the reveal, the killing blow, हुं, Kali) also
get a two-frame inverted “impact frame”.

| time | shot | score |
| --- | --- | --- |
| 0–1.5 | hook: “No god could *defeat* him.” — the buffalo in the dark | conch, a riser |
| 1.5–3 | “So they made *HER*.” — her face, close | dhaak drops |
| 3–6 | Mahishasura charges and drives the gods out of heaven | dhaak |
| 6–9 | the gods’ fury becomes light, one god at a time | dhaak |
| 9–11 | the light becomes Durga — दुर्गा | dhaak |
| 11–15 | every god arms her, one weapon each half-beat, each named | dhaak |
| 15–17 | the mountain gives her a lion | dhaak |
| 17–24 | he becomes buffalo, lion, warrior, elephant, buffalo; she answers noose, sword, arrows, sword, trident | dhunuchi |
| 24–28 | the leap and the blow — महिषासुरमर्दिनी | dhunuchi |
| 28–31 | Smoke-eyes comes to drag her by the hair | dhaak |
| 31–34 | one sound — हुं — and he is ash | silence, then a low chord |
| 34–37 | her face darkens, and Kali springs from her frown | dhunuchi |
| 37–40 | Kali swallows their weapons — चामुण्डा | dhunuchi |
| 40–43 | every drop of Raktabija’s blood becomes another demon, ×2 … ×32 | dhaak |
| 43–46 | not one drop touches the ground | dhaak |
| 46–51 | the Mothers return into her: “Who else is there besides me?” (एकैवाहं जगत्यत्र द्वितीया का ममापरा, Devi Mahatmya 10.3) | dhunuchi |
| 51–55.5 | nine nights, nine forms — the portraits, half a beat each | garba |
| 55.5–60 | या देवी सर्वभूतेषु शक्तिरूपेण संस्थिता नमस्तस्यै नमो नमः — JAI MAA DURGA | conch, gong, ulu |

The English captions are written for this reel, not taken from any
translation. Everything is drawn and synthesised in code; no outside pictures
or recordings are used.

## Posting

The file is H.264 + AAC with `+faststart`, which Instagram, YouTube Shorts
and WhatsApp all take. All the words sit between y ≈ 240 and y ≈ 1540, so the
app's username, caption and buttons at the bottom don't cover them.
