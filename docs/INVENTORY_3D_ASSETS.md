# Inventory 3D model asset pack

## Files in GitHub and current status

All six assets are now versioned in `public/models/inventory/`. Five are regular GLB files. The animated AirPods GLB is stored as `airpods_pro.glb.gz` due to GitHub binary-transfer limits, and is **automatically expanded without loss** by `scripts/prepare_inventory_models.mjs` when starting the development server or building for production. No download, ZIP or manual Python installation is required.

| Inventory ID | Item | File in GitHub | Changes |
| --- | --- | --- | --- |
| `macbook-1` | MacBook Air M2 / Midnight | `macbook_air_m2_midnight.glb` | Anodized housing and keyboard-deck texture recolored dark blue-gray |
| `macbook-2` | MacBook Air M4 / Silver | `macbook_air_m4_silver_visual.glb` | Silver housing and keyboard-deck texture; **M2 geometry visual placeholder** |
| `wallet` | Black leather wallet | `wallet_black.glb` | Leather recolored charcoal black while retaining grain, seams and cards |
| `car-keys` | Electronic car fob | `electronic_car_key.glb` | Uploaded replacement, unchanged |
| `house-key` | House key | `cute_key.glb` | Unchanged |
| `airpods` | AirPods Pro | `airpods_pro.glb.gz` → `airpods_pro.glb` at dev/build | **Lossless archive** of original GLB with its animation intact |

### How to use

Run `git pull --ff-only origin main` and `npm run dev` as usual. The AirPods restoration runs automatically; its generated `.glb` is Git-ignored, while the original compressed archive is tracked. Running `npm run build` also restores the model before copying the public assets into the production build.

The optional `scripts/install_inventory_models.py` from the earlier version is no longer necessary. The interactive 3D item inspector has not been built yet; these are prepared assets, **not a claim that the current inventory UI renders 3D models**.

## Attribution and modifications (CC BY 4.0)

All listed source assets embed `CC-BY-4.0` metadata in their `asset.extras`. Keep attribution visible when using or distributing the modified assets.

- **MacBook Air M2** by [rtql8d](https://sketchfab.com/rtql8d): [source](https://sketchfab.com/3d-models/macbook-air-m2-786fa23d402a4f90ae36c4168997f9cc). Edited twice: Midnight and Silver variants; the Silver file is labeled as an M4 **visual placeholder using M2 geometry**.
- **Old Wallet** by [Sergey Filin](https://sketchfab.com/sergey.s.filin): [source](https://sketchfab.com/3d-models/old-wallet-25a75902f3e5446a893b0de552f42862). Black leather texture recolor.
- **Cute Key** by [Incg5764](https://sketchfab.com/incg5764): [source](https://sketchfab.com/3d-models/cute-key-4234dafdff39484fa6cecd65ebf5bc84). No changes.
- **Electronic Car Key** by [neeb17](https://sketchfab.com/neeb17): [source](https://sketchfab.com/3d-models/electronic-car-key-9e80efbaba8740288a77dcd165c3dedb). No changes.
- **AirPods Pro** by [Jed Falcone](https://sketchfab.com/jedlas012): [source](https://sketchfab.com/3d-models/airpods-pro-3f84ddc3d87a4ec0a5e5f379abfecd9c). No changes; retains the original animation.

License: https://creativecommons.org/licenses/by/4.0/

## Acceptance criteria for the future inspector

Actual 3D meshes appear inside the in-device INV screen; visitors can rotate and zoom the selected item, and the AirPods case opens to reveal its two earbuds. The selected inventory item, existing editor, radio, and device stabilization must continue to function. Do not upload a restricted Porsche key model.
