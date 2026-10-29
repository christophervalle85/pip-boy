# 3D everyday-carry inventory

## Interactive AirPods case (basic open/close implemented in v0.11.0)

The **INV** detail pane now loads real interactive 3D models for six bundled items. The AirPods GLB's original lid-and-earbuds animation is controlled by an OPEN CASE / CLOSE CASE button. The inventory list, filters, editor and saved game remain intact.

A **future enhancement** is a larger dedicated inspect mode with independent click-to-lift controls for each earbud; the current GLB groups the earbuds under one animated node, so independent left/right handling would require editing the source model.

### Next phase user experience

1. Select **AirPods** from the inventory and expand the existing 3D preview into a dedicated **INSPECT 3D** view.
2. A lightweight white AirPods charging case appears in a dark green Pip-Boy inspection viewport, with a simple orbit/zoom and reset control.
3. Preserve the working case OPEN/CLOSE animation and add an expanded detail view.
4. Clicking either earbud selects it, subtly lifts it out, and reveals its label/details; clicking again returns it. Preserve positions when inspecting, and provide **RESET ITEM**.
5. Allow the 3D inspect panel to close without losing the selected inventory item, description, quantity or persisted inventory data.

### Modeling and implementation

- Prefer a small, original low-poly glTF/GLB model, not an embedded photo or a flattened CSS trick. Separate nodes for `CaseLower`, `CaseLid`, `EarbudLeft`, and `EarbudRight` with correctly centered hinge and pickup pivots.
- Use existing React Three Fiber / Three.js; no new framework. Separate item camera from the device's main camera, so stabilization remains unchanged.
- Accessible DOM buttons for OPEN/CLOSE, LEFT/RIGHT and RESET work alongside mesh clicks, including keyboard and touch input.
- Correct glossy white plastic materials, subtle specular highlights, controlled lighting, and realistic lid motion; make sure open case reveals exactly two earbuds.
- Lazy-load only when the item inspector is opened, with a loading placeholder; keep mesh size and draw calls low and honor reduced-motion settings.
- No physical device/account pairing: this is a visual inventory item inspector only.
- Credit external asset licenses if a downloadable model is used; do not claim this to be an official Apple 3D model.

### Acceptance criteria

User can select the AirPods in INV, inspect an actual 3D charging case, open the lid to see two earbuds, interact with each, close it, and return to the same inventory state. The 3D Pip-Boy remains visible and functional.
