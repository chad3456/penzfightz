# Hanuman Leap: Unity package

This folder contains:
- the rigged, animated Hanuman model from the web version (`src/leap/` → "Download model (.glb)" button);
- shaders and scripts to fly him over an ocean in Unity.

> These Unity files were written without a Unity editor to hand: nothing here has been compiled or play-tested. Expect to fix small things, such as model orientation, which `modelYawOffset` covers.

## What's here

| Path | What it is |
|---|---|
| `Assets/HanumanLeap/Models/Hanuman.glb` | The model: about 145 meshes on a 95-joint hierarchy (body, spine, chest, neck, head, arms, legs, an 18-joint tail, hair locks, sash, dhoti flaps, gada). It has 10 named materials (Skin, SkinLight, Gold, GoldDark, Cloth, ClothDark, Hair, Eye, Pupil, Mouth) and 5 baked clips: **Fly**, **FlyBoost**, **Idle**, **Crouch** and **Leap**. It faces +Z, stands about 2.1 units tall, and is Y-up. |
| `Shaders/ToonTwoTone.shader` | The two-tone print look: a lit colour and a shade colour, a ragged terminator, grain and rim. Built-in Render Pipeline. |
| `Shaders/OceanToon.shader` | Teal two-tone sea, with foam on crests and a sun glint. |
| `Scripts/HanumanFlight.cs` | Flight controller. **WASD / arrows** steer, **Space / Shift** boosts, **Q / E** shrink and grow. Switches between the Fly and FlyBoost clips. |
| `Scripts/ChaseCamera.cs` | Chase camera that scales its distance with his size. **C** cycles between chase, side, front and low shots. |
| `Scripts/OceanSurface.cs` | A procedural wave mesh (the same four sine waves as the web version) that follows the camera. |
| `Editor/HanumanToonSetup.cs` | **Tools ▸ Hanuman Leap ▸ Apply Two-Tone Look to Selection** swaps the glTF materials for toon materials, chosen by name. |

## Set up (Unity 2022.3 LTS or Unity 6, Built-in pipeline)

1. Copy the `Assets/HanumanLeap` folder into your project's `Assets`.
2. Install glTFast. In **Window ▸ Package Manager ▸ + ▸ Add package by name**, enter `com.unity.cloud.gltfast`.
3. Select `Hanuman.glb`. In the Inspector, set **Animation ▸ Animation Method** to **Legacy**, and click Apply. This is what `HanumanFlight` expects. If you want Mecanim instead, create an Animator Controller with states named `Fly` and `FlyBoost`.
4. Build the scene:
   1. Create an empty **Hanuman Flight** object at (0, 150, 0). Add `HanumanFlight` to it.
   2. Drag `Hanuman.glb` in as a child of that object. With the child selected, run **Tools ▸ Hanuman Leap ▸ Apply Two-Tone Look to Selection**.
   3. Add `ChaseCamera` to the Main Camera, and set its target to **Hanuman Flight**.
   4. Create an empty **Ocean** object at (0, 0, 0). Add a `MeshRenderer` with a material using `HanumanLeap/OceanToon`, and add `OceanSurface` with **follow** set to the camera.
   5. Set the Directional Light to rotation (50, -30, 0).
   6. Set the camera's Clear Flags to Solid Color `#F2F0DB`. Turn on fog (Linear, colour `#F2F0DB`, start 600, end 3200) for the cream horizon.
5. Press Play. If he flies backwards or sideways, change **modelYawOffset** on `HanumanFlight` (try 180).

## Using a different pipeline

The shaders are written for the Built-in Render Pipeline. For URP or HDRP, recreate the same idea in Shader Graph:
1. Take the main light direction · normal, add a little screen-space noise, and pass it through a steep `Smoothstep`.
2. Use the result to `Lerp` between the two colours.

The colour pairs are listed in `Editor/HanumanToonSetup.cs`.

## About the design

This Hanuman is an original stylised model, built for this project, with heroic proportions, a gold mukut, kundala, a gada, a dhoti and sash, and a long expressive tail. Its colours follow a two-tone, teal-shadowed print palette.
