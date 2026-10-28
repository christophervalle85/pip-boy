# Pip-Boy 3000

## Direct-to-device startup, tactile hardware and CRT polish (v0.10.1)

The 3D Pip-Boy is displayed immediately, without the unnecessary camera fly-in or separate introduction overlay. Its **existing RobCo screen diagnostics** still run on initial load and on reboot. Physical hardware interactions, camera stabilization, CRT effects, and optional audio are preserved.

- **Startup:** the textured device immediately appears in its normal three-quarter view. Only its built-in CRT boots; CONFIG → REBOOT or POWER restarts that screen without repositioning the 3D camera. The screen's existing SKIP STARTUP control and reduced-motion handling remain available.
- **Physical controls:** the real exported meshes `knob1`, `knob2`, `knob3`, `RightKnob`, and `light1`–`light4` have small turn/press animations. The left knobs move between tabs, the third handles power, the right tuner cycles radio stations, and the four front buttons select STAT/INV/DATA/MAP. Clicks on the interactive DOM screen continue to work as before. All controls use real GLB geometry, not invented floating knobs.
- **CRT:** a short phosphor tune-in when switching tabs, a subtle corner vignette and adjustable scanlines. CONFIG → **CRT EFFECTS** cycles OFF / SUBTLE / VIVID; SUBTLE is the default. Reduced motion disables flicker and transitions.
- **Audio:** optional original synthesized clicks, tuning tones and power/boot chirps. CONFIG → **HARDWARE SOUND** is **OFF by default** and requires an explicit user click to enable. Audio does not start automatically on page load. CRT and audio preferences are saved locally.
- No extra third-party assets or runtime dependencies; no GitHub Actions required.

**Planned next:** [Interactive AirPods case in INV](docs/FUTURE_3D_INVENTORY.md). The AirPods entry stays functional in its current format until the model is built and inspected.

## Approved retro cartoon STAT sprites (v0.9.0)

The STAT screen now uses the **user-approved classic 1950s cartoon character artwork** instead of the previous hand-coded SVG. It is a real raster sprite atlas at `public/art/pipboy-stat-sprites.png`: six poses in a 3-column × 2-row transparent PNG, optimized to **8,004 bytes** for fast loading. No external image CDN or paid sprite subscription is required.

- **Healthy:** cheerful thumbs-up by default; **click to salute** and click again to stand down
- **Injured:** bandaged arm and concerned expression when HP is **50% or below**
- **Critical:** visibly doubled over when HP is **25% or below**
- **Irradiated:** nauseated pose when radiation reaches **400 or more**, unless more urgent HP conditions apply
- **Offline:** lying unconscious when HP reaches zero
- The pose and diagnostic label are driven by the same live saved character stats as the HP/radiation meters; switching tabs and back preserves the underlying stats
- A short pose transition and gentle idle animation respect the browser's **Reduce Motion** preference
- The amber screen theme also adapts the green sprite colors. Missing assets show an explicit status instead of silently disappearing

The original full-resolution sprite concepts remain available in the conversation archive; the shipped image is an indexed-color web optimization preserving the chosen cartoon pose designs.

## Screen integration fix (v0.7.2)

The live CRT is now recessed immediately in front of the original curved screen mesh instead of floating forward as a separate display. The oversized double-sided black rectangle has been removed. The original mesh remains opaque, and the live HTML screen uses Drei raycast occlusion plus rear/steep-angle visibility checks so it no longer draws through the physical casing. The original live React controls remain interactive from the front.

## Immersive 3D-only Pip-Boy (v0.7.1)

The textured Pip-Boy is the **only** application view. No flat-screen mockup, 2D route, or 2D toggle remains. When WebGL2 is unavailable, the app displays a clear compatibility message instead of silently changing to another view. The original live React interface stays interactive on the 3D model.

- **STABILIZE VIEW** is now in the **top-right controls** (replacing the former 2D switch). It animates the actual 3D Pip-Boy from its current orbit to a close, front-facing, *non-rotatable* screen view over approximately 0.95 seconds. All five tabs, inventory editing, radio, and maps remain live.
- **UNLOCK 3D** appears in the same **top-right** position and animates back to a three-quarter showcase angle while restoring rotation/zoom. The small camera-reset icon remains below the model only in free mode; the redundant bottom Stabilize button is gone.
- Motion is immediate instead of animated when the browser requests reduced motion.
- The 3D scene fills the page directly: no rectangular viewer border, corner decals, device status text, keyboard hints, large model credit footer, build label, logo square, or page footer.
- The **ⓘ** button opens the model attribution panel with the artist's name, original Sketchfab model link, [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/), and modification disclosure. Full credits remain in [ASSET_CREDITS.md](ASSET_CREDITS.md).
- The browser tab has no custom favicon. This presentation requires no GitHub Actions or paid generation.

A Fallout-inspired personal information processor built with React, TypeScript, Vite, Three.js, and React Three Fiber. An original fan-made UI with glowing monochrome styling and fully interactive tabs. This is an unofficial project, not affiliated with Bethesda or Vault-Tec.

## Textured Fallout 3 model integration (v0.6.0)

The user-supplied [Pip-Boy Fallout 3 Concept](https://sketchfab.com/3d-models/pip-boy-fallout-3-concept-21bfe974c2564ebabcc974b39a2a1f00) model by **Julien Schoots (WizOfFab)** replaces the original procedural shell once its GLB file is installed. The source is licensed **Creative Commons Attribution 4.0**. The optimized web copy changes its textures from 4096px PNGs to 2048px JPEGs, retaining the original geometry. Credit and license details: [ASSET_CREDITS.md](ASSET_CREDITS.md).

**Install the GLB (one time):**

1. Obtain the optimized file `pip-boy-fallout-3-web.glb` generated from your downloaded model.
2. Add it at **`public/models/pip-boy-fallout-3-web.glb`** in this repository, using GitHub's upload-file interface or your local working copy.
3. If working locally, restart or refresh the app after adding the file. The exact filename and path matter.

The 3D renderer detects the asset on load and uses the imported geometry. When the GLB is missing, the app displays a clear asset error instead of showing a different model. The imported model is recentered and fitted to the viewport. Its curved screen mesh remains as an opaque backing behind a live interactive DOM screen, sized to cover the entire CRT opening. Existing inventory editing, subway/311 map, radio, save data, and system settings continue to use the same application state. The model's named rotary knobs map to radio, tab switching, and power controls. Screen focusing uses the top-right **STABILIZE VIEW** control.

**Stabilized 3D screen:** Select **STABILIZE VIEW** in the top-right controls to animate the camera toward the physical screen and lock orbit/zoom. Select **UNLOCK 3D** in that same position to return to the rotatable model. The live screen never switches to a 2D replacement.

This is an independent fan project. The artist's CC BY license covers their contribution, not independent rights to Fallout-related intellectual property.

## Power-on experience

When you open the app, the Pip-Boy now runs through an animated hardware startup and system diagnostics before opening the STAT tab. You can skip startup, turn the device off and on using its power button, or select **REBOOT** in the settings panel. Restarting does **not** erase your saved game. Reduced-motion system preferences bypass the boot animation.

The casing has ribbed side grips, fasteners, a recessed screen, and a working illuminated power control.

## What works

- **STAT** — character stats, S.P.E.C.I.A.L. attributes, health/radiation readouts, and a simple survival simulation.
- **INV** — browse and manage everyday belongings. Add, edit, and remove personal items using a Pip-Boy-styled editor, with categories, quantity, descriptions, readouts, and optional cash amounts. Starts with two MacBooks, a wallet containing $34.53, car keys, a house key, and AirPods.
- **DATA** — track quests and mark objectives as completed.
- **MAP** — pan/zoom across all five NYC boroughs on OpenStreetMap, inspect real MTA subway stations and the nearest station to the viewport center, and scan the most recent geolocated NYC 311 reports (up to 80 from the last seven days). Click markers or the nearby data list for details.
- **RADIO** — tune three stations playing original synthesized ambient signals in your browser (no commercial music).
- **Persistence** — progress is saved locally in the browser. Earlier saves are migrated once to the new everyday-carry inventory without wiping character or quest progress; reset everything from device settings.
- **Keyboard shortcuts** — `1`–`5` switch the main tabs. `Esc` closes settings.
- **Themes** — toggle green or amber phosphor.

## Everyday-carry inventory

MacBooks are separate inventory entries so both are visible individually. The wallet records **$34.53** in cash, exactly as requested. Device models, battery percentages, key details, and unprovided prices are intentionally not invented. This is a personal property log, so these items have descriptions rather than Fallout-style consume or equip actions. The fantasy STAT tab remains a simulation, with a direct **RESTORE HP** test button instead of an unavailable Stimpak.

## Managing your inventory

From the **INV** tab, press **ADD ITEM** to register a belonging. Select an existing item and press **EDIT ITEM** to update its details. **REMOVE** opens a confirmation before deletion; it never erases an item on the first click. Each entry has a name, category (Tech, Personal, Keys, or Other), quantity, short Pip-Boy readout, description, and an optional cash amount (useful for your wallet). You can leave a description or readout blank and the app supplies a generic one.

Inventory edits save automatically to your browser's local storage, alongside the character and quest data. There is no account, sync, or server-side backup: clearing site data or changing browsers removes the local save. Restarting the Pip-Boy does not clear your inventory. Resetting the entire save from settings restores the six default belongings.

## Run locally

Install [Node.js](https://nodejs.org/) 20.19+ and run:

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

For a production build:

```bash
npm run build
npm run preview
```

## Source repository

This project lives at [christophervalle85/pip-boy](https://github.com/christophervalle85/pip-boy) (private). The app runs locally and does not require a server or account.

## Commit messages

I write commit messages in first person, keeping them short, specific, and natural. For example: `I built the first playable version of my Pip-Boy`. See [COMMIT_STYLE.md](.github/COMMIT_STYLE.md) for examples.

## Suggested next steps

- Add neighborhood bookmarks, saved apartment shortlists and commute-time comparisons.
- Add a save-slot system and character customization.
- Add a licensed or user-provided music library for the radio.
- Improve accessibility and mobile layouts.
- Add automated tests for gameplay actions.

The visual design and simulated radio are original. No copied game assets, music, or voice recordings are included.

## NYC map data

The map uses [OpenStreetMap](https://www.openstreetmap.org/copyright) map tiles, the [MTA Subway Stations dataset](https://data.ny.gov/d/39hk-dx4f), and [NYC 311 Service Requests](https://data.cityofnewyork.us/d/erm2-nwe9). These public feeds require **no personal API key** for basic use, although anonymous requests may be rate-limited. The browser connects directly to these sources; it does not upload saved game data.

Open the MAP tab, choose a borough, zoom/pan, and press **SCAN VIEW** to update 311 results for the visible area. Markers are clickable; the sidebar also shows the closest subway stations with **straight-line** distances (not walking or travel times). Subway locations/routes are a station catalog, **not real-time train arrivals or service status**. The 311 list is a capped sample of geolocated requests, updated by NYC daily, and is **not** a comprehensive count or a neighborhood safety score; missing or delayed reports are possible. Each dataset has its own source link in the map.

The free public OSM tile server is best-effort, requires visible attribution, and must not be used for bulk downloading/prefetching. If this becomes a high-traffic production site, select a suitable tile provider and review their usage terms.
