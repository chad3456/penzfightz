# The Leap to Lanka

An interactive 3D flight across the ocean as Hanuman, from Mount Mahendra to the Ashoka grove, after the Sundara Kanda of Valmiki's Ramayana. You can watch it as a film with cinematic cameras, or fly it yourself. The same model exports as a rigged, animated `.glb` file for Unity or Blender.

## The model (`src/leap/hanuman.ts`)

- **An original, stylised design** built entirely in code, with heroic proportions.
  - Head and dress: a tiered gold mukut, kundala earrings, a muzzled face with brow and eyes, and five locks of hair.
  - Ornaments: a gold necklace and pendant, bajuband armbands, gauntlets and anklets.
  - Clothing: a dhoti with front and back flaps, a sash.
  - Tail and gada: an 18-segment tail and a gada with a ribbed head.
- **Rig:** about 145 meshes on a joint hierarchy (`body → hips → spine → chest → neck → head`, arms, legs, gada). Hair, sash, flaps and tail are chains of joints, so all motion is plain joint rotation. That keeps it exportable.
- **Poses:** `fly`, `stand`, `crouch`, `leap` and `offer` are rotation tables. `applyPose` blends between two poses and adds travelling waves to the tail, hair and cloth, stronger in the wind and when boosting.
- **Export:** `bakeClip` samples a pose into a looping glTF `AnimationClip`. `exportableCopy` swaps the toon shaders for named PBR materials. The **Download model (.glb)** button writes `Hanuman.glb` with the clips Fly, FlyBoost, Idle, Crouch and Leap. A copy lives in `unity/HanumanLeap/Assets/HanumanLeap/Models/`.

## The look (`src/leap/toon.ts`)

Two-tone print shading: every surface is either its lit colour or its shadow colour, split by a slightly ragged terminator, with a rim light and paper grain.

| Part | Lit | Shadow |
|---|---|---|
| Skin | orange `#e0914f` | teal `#247684` |
| Cloth | rust `#c35b24` | navy |
| Ornaments | gold | olive-gold |

The sky is cream `#f2f0db`, with a CSS grain overlay. These were taken as broad palette cues from the reference image; the model and its shapes are new.

- **Shared state:** light direction, fog and night are shared uniforms, so the time of day updates every material at once.
- **Ocean:** four summed sine waves with analytic normals, two-tone lit/shade, crest foam and a sun glint.
- **Sky:** a gradient that goes from morning to dusk to moonlit night as the crossing proceeds, with stars at night.

## The crossing (`src/leap/story.ts`, `World.tsx`)

Distance runs from 0 to 6150 units and is shown as 0–100 yojanas, since Valmiki's ocean is a hundred yojanas wide. Story mode follows a keyed path of position, size and speed.

| Episode | What happens |
|---|---|
| Mahendra | He crouches on the summit, then leaps; the camera shakes. |
| Mainaka | The golden mountain rises from the sea as he approaches. |
| Surasa | A coiled serpent whose jaws open wider as he grows. He shrinks to 0.35× and flies through her mouth. |
| Simhika | A dark swirling pool. Shadow arms rise and track his shadow while he flies low over it. He shrinks, dives and bursts free. |
| Lanka | A golden city of about 150 domed and spired buildings below the three peaks of Trikuta, lit windows at night, and the Ashoka grove. |
| Finale | Hanuman perched on a branch of the shimshapa tree above Sita (small, still, with a soft glow). **Give Rama's ring** brightens her glow and changes his pose to *offer*. |

**Free flight:**
- Steer with the mouse or WASD (touch: drag). Boost with Space. Shrink and grow with Q / E.
- Encounters react: Mainaka gives rest. Surasa checks whether you are small and inside her mouth. Simhika slows you while she holds your shadow; shrink and boost to escape.

**Cameras:**
- **Cinematic** shots: chase, side, front, wide, low, and a reveal of Lanka.
- **Chase**, or **Orbit** (drag).
- **Inspect the 3D model**: an orbit viewer on Mahendra's summit, with five poses and front, side, back and ¾ views.

**Sound:** wind noise filtered by speed, over a soft drone.

## Unity

See `unity/HanumanLeap/README.md`. It contains the GLB, a two-tone toon shader, an ocean shader, a flight controller, a chase camera, a procedural ocean mesh, and an editor menu that applies the toon materials by name.

The Unity scripts were written without a Unity editor available and have not been compiled.

## Sources and licence

- **Episodes:** retold in our own words after Valmiki's Sundara Kanda, sarga 1 (the leap, Mainaka, Surasa, Simhika, the arrival at Lanka). The shimshapa tree in the Ashoka grove and Rama's ring come from the following sargas.
- **Reference image:** the user's image was used only for its palette and its two-tone, teal-shadowed manner.
