# Future feature: 3D everyday-carry inventory

## Interactive AirPods case (planned, not yet implemented)

The AirPods item in **INV** should open a dedicated interactive 3D item-inspection surface. Keep the existing list, filtering, and editor for all items intact.

### User experience

1. Select **AirPods** from the inventory and open **INSPECT 3D**.
2. A lightweight white AirPods charging case appears in a dark green Pip-Boy inspection viewport, with a simple orbit/zoom and reset control.
3. Click **OPEN CASE** or the lid to rotate it around a real hinge pivot, revealing **two separate earbuds inside**. Click again to close.
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
