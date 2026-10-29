# Pip-Boy 3000

## Dial travel limits match six and five clicks (v0.11.10)

- Kept the original **15° per click**, but corrected the mechanical limit—not the step size.
- **Upper left dial:** six forward clicks (15°, 30°, 45°, 60°, 75°, 90°); the following click resets it to home. The new maximum is **90°**, not the previous 150°.
- **Lower left dial:** five forward clicks (15°, 30°, 45°, 60°, 75°); the following click resets it to home. The new maximum is **75°**, not the previous 125°.
- Removed the previous **+35° lower-dial home-position adjustment**, which was shifting its entire rotation arc away from the source model's resting position. The lower dial now starts from the original 3D model's authored orientation.
- Hold-and-drag remains bounded within each dial's own arc, and reverse movement from rest still clamps to zero rather than wrapping backwards.
- The third small POWER dial, right cosmetic dial, five physical red navigation buttons, original screen, 3D inventory, and CRT effects are unchanged.
- Source-level click and limit checks passed. The physical fit must still be confirmed in the browser.

## Restore original knob click size (v0.11.9)

- Restored the original **15° per click** for BOTH the upper and lower cosmetic knobs. The previous update accidentally increased their click size to 25°, making each reach its stop too soon.
- Kept the existing independent travel limits: upper **150°** (10 clicks to the stop, reset on click 11); lower **125°** (9 clicks to the stop, reset on click 10). These are *actual* limits, not larger click increments.
- Fixed an off-by-one boundary issue: the last step of a knob is clamped to its mechanical end stop, rather than instantly resetting when a 15° increment would overshoot it. Only a further forward click after reaching the stop returns to home.
- The lower dial's improved **35° resting orientation**, click/drag interactions, small physical POWER dial, five silver-rimmed red navigation buttons, inventory, and CRT remain unchanged.
- Both dials were checked for every click through their stops and reset, including reverse motion from zero.

## Tuned upper/lower dial detents and lower home position (v0.11.8)

- The **upper-left dial** now advances **25° per click**, reaches its 150° mechanical end stop after **six** clicks, and resets to its zero position on the **seventh** forward click.
- The **lower-left dial** advances **25° per click**, reaches its shorter 125° end stop after **five** clicks, and resets on the **sixth** forward click.
- Adjusted the lower-left dial's authored resting orientation by **+35°** around its original pivot to give the handle a more balanced initial pose. This is its new home position when the dial resets.
- Hold-and-drag continues to work, with per-dial travel limits and no jump when dragging backward from zero; clicking and keyboard arrows use the correct detent for the selected dial.
- The right-hand cosmetic dial retains its former 150° range and 15° click increments. The small POWER knob, fifth silver-rimmed red button, CRT, and 3D inventory are unaffected.
- Click counts and end-stop behavior were checked for all three cosmetic dials; visually fine-tuning the lower knob's new home position requires a browser screenshot.

## Corrected physical knob limits (v0.11.7)

- Fixed the dial bounds after the previous 300° wraparound caused a **reverse drag from the starting position to jump almost a full rotation backwards**.
- The cosmetic upper/lower and side tuning dials now have a **150° forward mechanical arc**, with a hard stop at zero for reverse movement. The only wrap is a forward turn that reaches the maximum; that returns the dial to its authored starting rotation.
- **Hold and drag** to rotate; the dial keeps its position when released. Mouse dragging is less sensitive (approximately 218px for a full arc); a click or arrow-key input moves one 15° step. Returning from the forward stop is smoothed, not an instant visual teleport.
- Knob rotation never moves the parts backward into the casing, changes tabs, or adjusts radio. The **small POWER dial**, five physical silver-rimmed red tab buttons, CRT, camera, and 3D inventory are unchanged.
- Rotation bounds have been checked against forward, reverse, overtravel, and reset scenarios; live browser feel still needs a visual check.

## Drag-to-turn knobs, power dial, and matching fifth bezel (v0.11.6)

- The **small third dial** is once again the real POWER switch. Its brief tactile twist calls the existing device power toggle, even while the device is off.
- The **two large left knobs** and the right-side tuner are cosmetic, with genuine pointer-captured **hold-and-drag rotation** rather than a single click that springs back. Drag to adjust freely; releasing the pointer keeps that orientation. Each dial wraps to its original rotation only after reaching the 300° mechanical maximum (also supports keyboard arrow-key nudges and click-to-turn).
- No knob changes tabs or tunes stations. Only the existing **five red buttons** select STAT, INV, DATA, MAP and RADIO.
- The fifth red button now clones **two real source GLB components**: the red `light4_low` lens **and the separate textured silver `Rim4_low` ring**, each offset by the same inter-button spacing, so the new hardware has the same original metallic border and materials.
- No green hover outline; descriptive labels still appear above the physical controls.
- Native 3D screen, embedded inventory drag/zoom, audio, CRT, and saved state remain unchanged. No dependencies added; live browser appearance still requires visual verification.

## Five red buttons and cosmetic spring-return knobs (v0.11.5)

- Removed the glowing green hover/focus outline and background from all physical hardware hit areas. The **small descriptive label above the control still appears on hover or keyboard focus**.
- The Pip-Boy's original knobs (including the two large visible left dials and right tuner) are now **cosmetic only**: clicking produces a short, maximum **18°** turn that returns smoothly to the knob's exact original rotation. No knob changes tabs, radio stations, or power, and none moves backward into the body.
- Preserved the four original red buttons, mapped to **STAT, INV, DATA, MAP**.
- Added one **fifth matching red 3D button** immediately to the right of the existing row, built by duplicating the fourth button's actual textured GLB mesh and material. The new physical button opens **RADIO**. Its invisible clickable surface and label use the same accessibility and event isolation as the existing buttons.
- Top-right POWER and CONFIG, the working on-screen five-tab navigation, boot sequence, 3D model stabilization, and transparent interactive inventory are untouched. No new dependencies or external assets.
- Source checks are performed against the repo; positioning and movement need confirmation in the local browser.

## Real clickable hardware targets (v0.11.4)

This fixes a recurring issue in which the visible Pip-Boy's red buttons and physical knobs could not be clicked even though event handlers existed. Earlier 3D raycast proxy spheres were positioned at mesh centers and could sit behind the model's casing or collide with the screen; they were not sufficiently reliable.

- **Eight real controls** (four red buttons, the three left-side knobs and the right-hand radio tuner) now have transparent **HTML button hit surfaces** anchored to the actual glTF mesh bounding boxes and positioned just beyond each part's front surface. The layout is calculated from the shipped GLB rather than arbitrary 2D pixel coordinates.
- The controls remain visually the **original physical 3D meshes**; no additional visible fake hardware. Hover or keyboard focus shows a subtle green highlight and a descriptive label.
- Front buttons 1–4: STAT, INV, DATA and MAP. Left knobs: previous tab, next tab, and power. Right tuner: cycle to the next radio station.
- Real mesh pivot rotation/press and indicator feedback continue, and the native screen remains fully interactive.
- Since buttons are DOM controls, pointer events can no longer be lost to mesh raycasting. Clicking hardware does not trigger unrelated controls in the embedded INV viewer; inventory hold-to-drag still works.
- Model license, zoom/stabilize mode, startup, CRT theme, personal inventory and saved data are unchanged. No new dependencies.

## Actual clickable 3D hardware (v0.11.3)

The physical controls on the **existing** textured Fallout 3 Pip-Boy are now significantly more reliable and visibly interactive. This corrects the previous implementation, which had event-picking and mesh-pivot issues.

- The GLB was inspected directly to identify the eight real, separately named hardware parts (three left knobs, the right tuning knob, and four front buttons). Controls now have **transparent raycast-only hit targets** centered on each physical mesh, including extended coverage for the long right knob. No visible fake controls or new boxes are added.
- Hover over each real knob or button to see a small floating label, plus a pointer cursor. Mouse clicks animate the actual GLB control's **pivot node** (instead of incorrectly rotating child geometry around the origin). The four front buttons visibly press and illuminate; dials turn in place.
- **Knob 1:** previous main tab; **Knob 2:** next main tab; **Knob 3:** power toggle; **right knob:** next radio station (and switch to RADIO). **Front buttons 1–4:** STAT, INV, DATA, MAP.
- Clicking the broad stationary `Radio_low` housing no longer selects RADIO accidentally. The hardware click handler rejects events from the live screen and its separate inventory WebGL canvas. Those events must remain intact for inventory hold-to-drag rotation, which is unchanged.
- To access knobs outside the close-up screen frame, use **UNLOCK 3D**. The existing STABILIZE VIEW, boot sequence, CRT effects, fully transparent inventory models, and AirPods animation remain unchanged.
- No extra dependencies or model re-uploads. Hardware animation and hover labels should be visually verified in the browser after pulling.

## True hold-to-drag inventory rotation (v0.11.2)

The previous radio-switching fix stopped every pointer event on the inventory preview wrapper. That also prevented the nested Three.js OrbitControls from receiving the release event, resulting in a sticky click-to-drag interaction.

- Removed pointer-event blockers from the **inventory viewer** so users **press and hold** the left mouse button to rotate a model, then **release** to stop controlling it. Trackpad and touch gestures can use the same native orbit controls.
- Kept accidental hardware activation fixed by checking `event.sourceEvent.target === gl.domElement` for **both click and hover** handlers on the physical Pip-Boy; events from the transparent inventory canvas cannot operate the radio dial or other hardware.
- Preserved the transparent, borderless 3D presentation, AirPods lid animation, reset, zoom and optional auto-spin.
- No changes to model files, dependencies, saves, or screen boot.

## Seamless in-device inventory and drag isolation (v0.11.1)

- Fixed an event-bubbling bug: dragging or releasing a 3D inventory model could make the **physical radio knob behind the screen** receive a click and unexpectedly switch to RADIO. The outer hardware raycaster now accepts only pointer events originating directly on its own WebGL canvas; events from the live HTML screen (including the nested inventory canvas) cannot operate physical hardware.
- The inventory viewer also contains its own pointer, click and wheel events while preserving inner OrbitControls, AirPods case controls and other inventory buttons.
- Removed the inventory viewer's visible border, gradient panel background and decorative label. Its WebGL canvas now clears with **zero alpha** and floats directly on the Pip-Boy's existing CRT background. Model credits and compact interaction controls remain.
- No new dependencies, no changes to saved data, six bundled GLBs, model licensing or camera stabilization.

## Interactive 3D inventory preview (v0.11.0)

The INV detail panel now displays **real, rotatable 3D GLB models**, replacing the old static line icons for the six bundled items. Selecting a model-backed item lazy-loads that file into a small independent React Three Fiber canvas inside the existing live Pip-Boy screen; the outer 3D device and camera remain untouched.

- **M2 Midnight / M4 Silver:** show distinct uploaded, recolored GLB assets. The M4 is currently a silver **M2-geometry visual placeholder**.
- **Wallet, car keys, house key:** display their real uploaded meshes (wallet black; both keys unchanged).
- **AirPods Pro:** **OPEN CASE / CLOSE CASE** plays the uploaded model's actual lid + earbuds animation. Clicking the model also toggles it.
- **All six:** drag to orbit, wheel/trackpad to zoom, **RESET** camera, optional **AUTO SPIN** (disabled under reduced-motion preferences).
- A clear 3D loading or error state appears instead of a silent missing object. User-created inventory entries without a model keep the original icon.
- Models are loaded only when a corresponding item is selected on INV; the AirPods source is still automatically restored from its versioned gzip archive by the existing npm predev/prebuild script.
- The existing inventory list, category filters, edit/delete, quests, camera stabilization, sound preferences, CRT screen and screen boot remain unchanged.

After pulling, restart the dev server with `npm run dev` to ensure the AirPods asset preparation script runs, then open **INV**. The browser must support WebGL.

## Versioned 3D inventory assets (v0.10.3)

The six prepared inventory models are now stored directly in this repository under `public/models/inventory/`; **you no longer need to download the ZIP or install the models manually**.

- **MacBook Air M2 Midnight:** `macbook_air_m2_midnight.glb`
- **MacBook Air M4 Silver (visual placeholder):** `macbook_air_m4_silver_visual.glb`; this uses the M2 mesh with a silver finish, not authentic M4 geometry.
- **Black leather wallet:** `wallet_black.glb`
- **Electronic car fob:** `electronic_car_key.glb`
- **House key:** `cute_key.glb` (unmodified)
- **AirPods Pro:** `airpods_pro.glb.gz` (lossless gzip of the original animated GLB). The original `airpods_pro.glb` is automatically reconstructed and SHA-256 checked whenever you run `npm run dev` or `npm run build`.

All original creator credits and CC BY 4.0 source links are documented in [the asset guide](docs/INVENTORY_3D_ASSETS.md). **These files are committed, but the in-device INV tab still uses icons** until we build its interactive 3D inspector. No camera, boot-sequence or save-data changes are introduced here.

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
