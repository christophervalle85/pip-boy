# Pip-Boy 3000

A Fallout-inspired personal information processor built with React, TypeScript, Vite, Three.js, and React Three Fiber. An original fan-made UI with glowing monochrome styling and fully interactive tabs. This is an unofficial project, not affiliated with Bethesda or Vault-Tec.

## Full 3D device (v0.5.0)

The site now opens as a rotatable **3D Pip-Boy** on compatible desktop browsers, with a modeled olive-green casing, wrist cuff, recessed screen, screws, vents, tuner, power knob and clickable tab buttons. The actual live React display—including **STAT, INV, DATA, NYC MAP and RADIO**—is mounted on the virtual device screen through Drei HTML transforms; it is **not** a screenshot or a fake 3D image.

- Drag outside the screen to orbit the device, scroll over its casing to zoom, and use **RESET CAMERA** to return to the front.
- Click the physical gold tab buttons or use the live on-screen tabs / keyboard shortcuts to change sections.
- Use the real **POWER** control to turn the display on/off. The radio tuner opens RADIO.
- Select **FOCUS SCREEN / 2D** or the top **2D VIEW** control for a larger flat screen (particularly useful for the NYC map and detailed inventory editing).
- On narrow screens or without WebGL2 support, the app starts in its fully functional flat mode. View preference is saved in localStorage independently of character/inventory saves.
- No third-party 3D model or game assets are included: the shell is original geometry assembled with Three.js.

The 3D view adds rendering overhead; the flat view remains available to ensure keyboard and touchscreen use.

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
