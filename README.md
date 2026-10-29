# Pip-Boy 3000

An interactive, **Fallout-inspired 3D Pip-Boy** built with React, TypeScript, Three.js, and Vite. A textured 3D device surrounds a working, CRT-style interface for personal inventory, stats, quests, maps, and radio.

## Features

- **STAT** — S.P.E.C.I.A.L. attributes, health, radiation, and character readouts.
- **INV** — Add, edit, and remove belongings, with rotatable 3D previews of six included items.
- **DATA** — Track quests and objectives.
- **MAP** — Explore NYC subway stations and recent 311 reports on an interactive map.
- **RADIO** — Tune between three original, synthesized in-browser stations.
- **Hardware controls** — Five red tab buttons, a physical power dial, and decorative knobs you can turn. Stabilize or freely rotate the 3D Pip-Boy.
- **Personalization** — Green/amber phosphor themes, CRT effects, and browser-local saved progress.

## Getting started

Requires [Node.js](https://nodejs.org/) 20.19 or newer.

```bash
npm install
npm run dev
```

Open the local address Vite prints (usually **http://localhost:5173**).

To build and preview:

```bash
npm run build
npm run preview
```

The development and build scripts automatically restore the included compressed AirPods 3D model.

## Controls

- Click the **five red buttons** or press **1–5** to switch tabs.
- Use the **small power dial** to turn the device on or off; the other knobs are cosmetic.
- Select **STABILIZE VIEW** to focus the screen, or **UNLOCK 3D** to orbit the device.
- In **INV**, drag a 3D object to rotate it and scroll to zoom.
- Press **Esc** to close settings.

Progress is saved in your browser's local storage. There is no account or cloud sync.

## Credits and licensing

The [Pip-Boy Fallout 3 Concept](https://sketchfab.com/3d-models/pip-boy-fallout-3-concept-21bfe974c2564ebabcc974b39a2a1f00) 3D model is by **Julien Schoots (WizOfFab)**. Its textures were optimized, and its screen and controls were adapted for this project.

Inventory models (credited to their original creators):

- [MacBook Air M2](https://sketchfab.com/3d-models/macbook-air-m2-786fa23d402a4f90ae36c4168997f9cc) — **rtql8d**; Midnight and silver recolors. The silver M4 entry uses M2 geometry as a visual placeholder.
- [Old Wallet](https://sketchfab.com/3d-models/old-wallet-25a75902f3e5446a893b0de552f42862) — **Sergey Filin**; black leather recolor.
- [Electronic Car Key](https://sketchfab.com/3d-models/electronic-car-key-9e80efbaba8740288a77dcd165c3dedb) — **neeb17**.
- [Cute Key](https://sketchfab.com/3d-models/cute-key-4234dafdff39484fa6cecd65ebf5bc84) — **Incg5764**.
- [AirPods Pro](https://sketchfab.com/3d-models/airpods-pro-3f84ddc3d87a4ec0a5e5f379abfecd9c) — **Jed Falcone**.

These 3D assets are credited under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). Map data comes from [OpenStreetMap](https://www.openstreetmap.org/copyright), [MTA subway stations](https://data.ny.gov/d/39hk-dx4f), and [NYC 311](https://data.cityofnewyork.us/d/erm2-nwe9).

This is an **unofficial fan project**, not affiliated with Bethesda. Fallout-related intellectual property belongs to its respective owners.
