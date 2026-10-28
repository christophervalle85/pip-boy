#!/usr/bin/env python3
"""Install the reviewed, licensed inventory GLBs into the Vite public folder.

Usage:
    python3 scripts/install_inventory_models.py ~/Downloads/pipboy_inventory_models_customized.zip
The archive is produced separately from user-supplied models; this script
does not download from any third-party service or modify saved game data.
"""
from pathlib import Path
from zipfile import ZipFile
import sys

ASSETS = [
    "macbook_air_m2_midnight.glb",
    "macbook_air_m4_silver_visual.glb",
    "wallet_black.glb",
    "electronic_car_key.glb",
    "cute_key.glb",
    "airpods_pro.glb",
]

def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python3 scripts/install_inventory_models.py path/to/pipboy_inventory_models_customized.zip")
        return 2
    archive = Path(sys.argv[1]).expanduser().resolve()
    if not archive.is_file():
        print(f"Archive not found: {archive}")
        return 2
    root = Path(__file__).resolve().parents[1]
    target = root / "public" / "models" / "inventory"
    with ZipFile(archive) as pack:
        missing = [filename for filename in ASSETS if filename not in pack.namelist()]
        if missing:
            print("Missing model(s):", ", ".join(missing))
            return 2
        target.mkdir(parents=True, exist_ok=True)
        for filename in ASSETS:
            destination = target / filename
            # Only exact, known flat filenames. Reject directories/path traversal.
            destination.write_bytes(pack.read(filename))
            print(f"Installed {filename} ({destination.stat().st_size:,} bytes)")
    print(f"Inventory assets installed in {target}")
    print("The models are ready for the future 3D inventory inspector; installing them alone does not change the current SVG icon-based inventory view.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
