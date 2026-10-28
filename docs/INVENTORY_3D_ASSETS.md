# Inventory 3D model asset pack

## Asset names and current status

The user-approved GLB package is supplied separately in the conversation as `pipboy_inventory_models_customized.zip`. The model binaries are **not yet committed to GitHub**, and a live 3D inspector is **not yet implemented**. This step updates inventory names and prepares validated custom models, without falsely presenting icons as interactive meshes.

| Inventory ID | Desired item | Prepared GLB | Changes |
| --- | --- | --- | --- |
| `macbook-1` | MacBook Air M2 / Midnight | `macbook_air_m2_midnight.glb` | Anodized housing and keyboard-deck texture recolored dark blue-gray |
| `macbook-2` | MacBook Air M4 / Silver | `macbook_air_m4_silver_visual.glb` | Silver housing and keyboard-deck texture; **M2 geometry used as a visual placeholder**, not a physically accurate M4 |
| `wallet` | Black wallet | `wallet_black.glb` | Leather base-color texture recolored charcoal black; grain, seams, cards remain |
| `car-keys` | Electronic car fob | `electronic_car_key.glb` | Replacement uploaded GLB, unchanged |
| `house-key` | House key | `cute_key.glb` | Unchanged |
| `airpods` | AirPods Pro | `airpods_pro.glb` | Unchanged; original animation retained |

## How to install the downloadable assets locally

1. Download and unzip the asset package from the ChatGPT conversation, or keep the ZIP as-is.
2. From the repository root, run `python3 scripts/install_inventory_models.py /path/to/pipboy_inventory_models_customized.zip`.
3. This copies the six models to `public/models/inventory/`. Review the models and their licenses before publishing.
4. The upcoming interactive inspector will lazy-load `/models/inventory/<model-name>.glb` on demand. Do not claim that the live site currently renders these meshes.

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
