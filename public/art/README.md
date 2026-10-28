# Approved Pip-Boy STAT sprites

`pipboy-stat-sprites.png` contains six optimized character sprites inspired by vintage mid-century cartoon proportions, derived from illustration concepts approved in the project conversation.

**Canvas size:** 465 × 380 px, paletted transparent PNG (8,004 bytes).

**Layout:** 155 × 190 px cells, three columns and two rows:

| Row | Column 1 | Column 2 | Column 3 |
| --- | --- | --- | --- |
| 1 | Healthy (thumbs-up) | Salute | Injured |
| 2 | Critical | Irradiated | Offline |

The original output images had scanlines and glow; the web atlas removes excess texture and reduces the palette so the site's existing CRT rendering adds those effects without repeated high-resolution downloads.

CSS backgrounds use `background-size: 300% 200%` and `background-position` values of 0%, 50%, 100% horizontally and 0%, 100% vertically. Avoid changing the atlas cell order without updating `src/wanderer-mascot.css`.

This sprite sheet contains generated artwork and is separate from the Julien Schoots 3D model license in `ASSET_CREDITS.md`.
