# Storyboard schema (engine/engine.js)

World space is **1920 × 1080**; `x`, `y` are in that space, (960, 540) is centre. Output size is `meta.width` (16:9).

```jsonc
{
  "meta": { "title": "…", "width": 1280, "fps": 30, "captions": true, "voOffset": 0.4, "tail": 0.9, "mood": "wonder", "brief": "user's original description" },
  "scenes": [{
    "id": "s01",            // used for narration file names
    "dur": 6,               // minimum seconds; stretched to narration + voOffset + tail
    "narration": "…",       // spoken + captioned; optional
    "mood": "wonder",       // score: wonder | warm | tense | sad
    "transition": "cut",    // into this scene: cut | fade | zoom | iris | whip; "transitionDur": 0.7
    "bg": { "kind": "space" },   // see backgrounds
    "camera": { "from": { "x": 0, "y": 0, "z": 1 }, "to": { "x": 60, "y": 0, "z": 1.08 } },  // eased over the scene, plus style drift
    "elements": [ { "type": "…", "x": 960, "y": 540, "s": 1, "rot": 0, "at": 0.5, "out": 6, "enter": "pop", "loop": "float", "depth": 1 } ]
  }]
}
```

## Every element
| key | meaning |
|---|---|
| `at` / `out` | appear at / leave at (seconds into the scene) |
| `enter` | `pop` `fade` `rise` `drop` `slideL` `slideR` `grow` `none` (`inDur` seconds) |
| `loop` | `float` `bob` `pulse` `spin` (`spin` rate) |
| `move` | `{ "at", "dur", "x", "y", "s" }`: eased move during the scene |
| `depth` | parallax 0–1 (0.3 = far background, 1 = foreground) |
| colours | a hex, or a role: `bg` `bg2` `ink` `hi` `sh` `a0`…`a4` (add `/d40` to darken or `/l15` to lighten), or `skinDeep` `skinMid` `skinLight` `hairBlack` `hairBrown` `white` `paper` `gold` |

## Backgrounds (`bg.kind`)
`gradient {top,bottom}` · `space {seed,stars}` · `dusk {top,bottom,sun,sunX,layers[3],hills}` · `room {wall,floor}` · `void {color,grid}`

## Element types
| type | props |
|---|---|
| `title` | `text` `size` `sub` `subColor` (case from style) |
| `text` | `text` `size` `color` `weight` `align` `upper` |
| `equation` | `text` `size` `color` `speed` (draw-on, glowing) `box` `align` |
| `figure` | `h` `skin` `hair` `hairStyle`(`parted`/`swept`/`bald`) `outfit` `jacket` `trim` `pose`(`stand` `walk` `write` `think` `wave` `hold` `present` `sit`) `facing` `prop`(`book` `letter` `chalk`) `glasses` `moustache` `mark` |
| `temple` | `w` `h` `color` `tiers` (gopuram) |
| `chapel` | `w` `h` `color` `lit` |
| `palm` | `h` `color` `seed` |
| `ship` | `w` `color` `funnel` |
| `waves` | `color` |
| `window` | `w` `h` `frame` `rain` |
| `board` | `w` `h` `color` (chalkboard) |
| `book` `letter` `notebook` | `notebook`: `lines[]` written on one by one (`gap`, `size`) |
| `planet` | `r` `color` `ring` |
| `sun` `glow` | `r` `color` `a` |
| `particles` | `n` `spread` `mode`(`orbit` `rise` `drift`) `color` `size` |
| `shape` | `kind`(`rect` `circle` `ring`) `w` `h` `r` `radius` `color` |
| `lemniscate` | `size` `speed` `color`: ∞ drawn with a glowing head |
| `halves` | `w` `h` `n` `speed`: 1 + ½ + ¼ … filling a bar |
| `staircase` | `n` `bw` `unit` `speed`: 1, 2, 3, … columns |
| `radical` | `size` `depth` `speed` `result`: nested square roots |
| `partitions` | `n` `cols` `dot` `speed`: every partition of n as dot rows |
| `counter` | `from` `to` (strings, any size) `label` `size` `speed` `prefix` |
| `piSpiral` | `speed`: π's digits in a spiral |
| `cubes` | `pairs` e.g. `[[1,12],[9,10]]`: isometric cubes and sums |
| `taxi` | `w` `color` `plate` |
| `journey` | `from` `to` `[x,y]` (relative to element) `lift` `fromLabel` `toLabel` `speed`: dotted route with a ship |

Add new types in `engine/engine.js` (`DRAW` table). Draw with `fillShape`, `rim` and `glow` so they follow the style tokens.
