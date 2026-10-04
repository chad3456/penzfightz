# Hanuman in Flight

A realistic, 38-second cinematic of Hanuman crossing the ocean toward Lanka. It is rendered live in the browser (effect `flight`) and can be rendered frame by frame to video.

## Shots

| # | Shot | Time | What happens |
|---|---|---|---|
| 1 | Dawn | 0–6.5 s | A low camera over the swell. He comes in from the horizon and passes overhead. |
| 2 | Chase | 6.5–13 s | Behind and below him, with the sea racing underneath. |
| 3 | Into the sun | 13–19.5 s | A side tracking shot, clouds sliding past. |
| 4 | Face to face | 19.5–25.5 s | Close, from in front, with hair and sash streaming. |
| 5 | The ocean | 25.5–32 s | A rising, circling crane shot. |
| 6 | Lanka | 32–38 s | A hazy coastline with a glint of gold. |

## How it is made

### The figure (`src/flight/realRig.ts`)

- **Same rig, new surface.** It uses the original rig from *The Leap to Lanka* (same bones, same poses), but the body is sculpted as one continuous surface.
- **Anatomy as shapes.** The body is described as a signed distance field:
  - shapes: rib cage, pecs, lats, obliques, abs, glutes, deltoids, biceps and triceps, forearms, curled fingers, quads, hamstrings, knees, calves, feet;
  - carved details: eye sockets, nostrils and a mouth line;
  - joined with a smooth minimum and built in an A-pose, so the limbs don't fuse.
- **Surface nets** turn the field into about 75k vertices, followed by Taubin smoothing.
- **Skinning:** each vertex is weighted to the bones whose shapes it lies near, so shoulders, elbows and hips bend smoothly.
- **Skinned parts:**
  - tail (tube);
  - hair (three strands per lock), streaming down his back in flight;
  - sash (ribbon);
  - dhoti: a hip wrap plus pleated cloth round each thigh.
- **Short fur:** eight shells pushed out along the skinned normals, each keeping only the strands long enough to reach it. The face stays bare.
- **Materials:**
  - skin: physically based, with fine pore and mottling noise and a warm rim like light under skin;
  - silk: sheen;
  - gold: metallic;
  - eyes: deep-set and amber, with a clearcoat.
- **Ornaments:**
  - a beaded necklace whose beads are snapped onto the sculpted chest surface;
  - an ornate mukut with ruby and emerald stones;
  - a fluted gada head.

### The world (`src/flight/film.ts`)

- **Sky:** Preetham atmospheric scattering, with a low sun from his left. A cube capture of it is used for reflections, and PMREM image-based light for the PBR materials.
- **Ocean:**
  - eight Gerstner waves (wavelengths 4–96 m) on a grid that crowds toward the camera;
  - procedural ripples;
  - Fresnel reflection of the sky;
  - light scattered through thin crests;
  - a sharp sun-glitter lobe and breaking foam;
  - aerial perspective that fades to the sky's own horizon colour.
- **Clouds:** cumulus built from many soft puffs, warm on the sun side and cool underneath. Some are near enough to fly past.
- **Speed cues:** spray specks streaming past the camera.
- **Shadows:** soft shadows from the sun follow him.
- **Post-processing:**
  - ACES tone mapping;
  - bloom on glitter and gold;
  - vignette and film grain;
  - SMAA anti-aliasing.
- **Determinism:** `renderAt(t)` is deterministic: pose, path, camera and waves are all functions of t.

## Rendering the video

```bash
npm run dev                                   # in one terminal
python3 scripts/flight/flight-audio.py --out flight-audio.wav
node scripts/flight/render-flight.mjs --out hanuman-in-flight.mp4 --fps 24 --audio flight-audio.wav
```

The renderer adds the title cards and fades, and pipes JPEG frames to ffmpeg. On a machine with a real GPU it runs at a few frames per second. With software WebGL (`SWIFTSHADER=1`) it takes about 3 s a frame.

The soundtrack (`flight-audio.py`) is generated from scratch: wind gusting with the shots, the sea, a rush as he passes overhead, and a low D drone.

## Honest limits

- **Procedural figure.** It is built from about 80 anatomical shapes, not hand-sculpted or scanned. It reads as a sculpted, furred figure rather than a photographic one, and the face in particular is simplified.
- **Clouds** are billboards, not volumetric.
- **Spray:** there is no wake, and no spray off the water.
