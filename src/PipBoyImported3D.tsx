import { Suspense, useEffect, useMemo, useRef, useState, type ElementRef, type ReactNode, type RefObject } from 'react';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Info, RotateCcw } from 'lucide-react';
import type { Tab } from './data';
import './device-3d.css';
import './pipboy-imported.css';

const MODEL_PATH = '/models/pip-boy-fallout-3-web.glb';
const TABS: Tab[] = ['STAT', 'INV', 'DATA', 'MAP', 'RADIO'];
type PowerState = 'booting' | 'ready' | 'off';

type Props = {
  display: ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  powerState: PowerState;
  amber: boolean;
  stabilized: boolean;
};

type ControlId = 'knob1' | 'knob2' | 'knob3' | 'rightknob'
  | 'light1' | 'light2' | 'light3' | 'light4' | 'light5';

type HardwarePart = {
  // Animate the GLB's transformed parent (real pivot), not its child mesh.
  pivot: THREE.Object3D;
  mesh: THREE.Mesh;
  initialDepth: number;
  initialRotation: number;
  impulse: number;
  kind: 'dial' | 'button';
};

type HardwareTarget = {
  id: ControlId;
  center: [number, number, number];
  width: number;
  height: number;
  label: string;
};

// CSS sizes correspond to the actual 3D mesh bounding boxes at the existing
// Html distanceFactor 400 / scale .00351: ~285 CSS px per GLB model unit.
// Target rectangles are slightly larger than the visible mesh, for usability.
const CONTROLS: ReadonlyArray<{ id: ControlId; label: string; width: number; height: number }> = [
  { id: 'knob1', label: 'UPPER DIAL · COSMETIC', width: 255, height: 205 },
  { id: 'knob2', label: 'LOWER DIAL · COSMETIC', width: 158, height: 165 },
  { id: 'knob3', label: 'DIAL · COSMETIC', width: 107, height: 107 },
  { id: 'rightknob', label: 'RIGHT DIAL · COSMETIC', width: 92, height: 405 },
  { id: 'light1', label: 'STAT', width: 77, height: 77 },
  { id: 'light2', label: 'INVENTORY', width: 77, height: 77 },
  { id: 'light3', label: 'DATA', width: 77, height: 77 },
  { id: 'light4', label: 'MAP', width: 77, height: 77 },
  { id: 'light5', label: 'RADIO', width: 77, height: 77 },
];

function controlFromName(name: string): ControlId | null {
  const lower = name.toLowerCase();
  return CONTROLS.find((c) => lower.startsWith(c.id + '_low'))?.id ?? null;
}

function identifyHardware(object: THREE.Object3D): ControlId | null {
  let node: THREE.Object3D | null = object;
  while (node) {
    const control = controlFromName(node.name);
    if (control) return control;
    node = node.parent;
  }
  return null;
}

function Asset({
  display, activeTab, onTabChange, powerState,
}: Pick<Props, 'display' | 'activeTab' | 'onTabChange' | 'powerState'>) {
  const { scene } = useGLTF(MODEL_PATH);
  const { gl } = useThree();
  const [screenFacing, setScreenFacing] = useState(true);
  const lastFacing = useRef(true);
  const hardware = useRef<Map<ControlId, HardwarePart>>(new Map());

  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      if (child.name.startsWith('Screen_low_')) {
        // Restore the physical opaque CRT. The interactive DOM is placed in
        // front of this curved, depth-tested geometry.
        child.material = new THREE.MeshBasicMaterial({
          color: '#06130b', side: THREE.DoubleSide, depthWrite: true,
        });
      }
      if (/^light[1-5]_low/i.test(child.name) && child.material instanceof THREE.MeshStandardMaterial) {
        // Clone only the indicator materials so other GLB pieces keep their
        // original textures while the physical buttons can light up.
        child.material = child.material.clone();
        child.material.emissive.set('#e6846a');
        child.material.emissiveIntensity = .06;
      }
      child.castShadow = false;
      child.receiveShadow = false;
    });

    // Add a fifth *physical* red button, duplicating the model's existing
    // fourth button mesh/material rather than placing a flat UI decal.
    // Place it one genuine button-spacing to the right of light4.
    copy.updateMatrixWorld(true);
    const third = copy.getObjectByName('light3_low_lambert1_0');
    const fourth = copy.getObjectByName('light4_low_lambert1_0');
    if (third instanceof THREE.Mesh && fourth instanceof THREE.Mesh &&
        fourth.parent?.parent && third !== fourth) {
      const parent = fourth.parent!;
      const container = parent.parent!;
      const thirdCenter = new THREE.Box3().setFromObject(third).getCenter(new THREE.Vector3());
      const fourthCenter = new THREE.Box3().setFromObject(fourth).getCenter(new THREE.Vector3());
      const step = container.worldToLocal(fourthCenter.clone())
        .sub(container.worldToLocal(thirdCenter.clone()));
      const pivot = parent.clone(false);
      pivot.name = 'light5_low';
      pivot.position.add(step);
      const lens = fourth.clone(false);
      lens.name = 'light5_low_lambert1_0';
      if (lens.material instanceof THREE.MeshStandardMaterial) lens.material = lens.material.clone();
      pivot.add(lens);
      container.add(pivot);
      copy.updateMatrixWorld(true);
    }
    return copy;
  }, [scene]);

  // The glTF controls are authored as individual meshes. Read their *real*
  // transformed bounds, then anchor a transparent HTML button just in FRONT
  // of each mesh. This is reliable even when the physical buttons are too
  // shallow for normal R3F picking or other device geometry overlaps.
  const targets = useMemo<HardwareTarget[]>(() => {
    model.updateMatrixWorld(true);
    const result: HardwareTarget[] = [];
    for (const control of CONTROLS) {
      const meshName = (control.id === 'rightknob' ? 'RightKnob' : control.id) + '_low_lambert1_0';
      const mesh = model.getObjectByName(meshName);
      if (!(mesh instanceof THREE.Mesh)) continue;
      const bounds = new THREE.Box3().setFromObject(mesh);
      const center = bounds.getCenter(new THREE.Vector3());
      // The model faces +Y before the surrounding group's +90° X rotation.
      // Put the DOM surface slightly forward of the REAL front face,
      // avoiding invisible or occluded clicks under the metal casing.
      center.y = bounds.max.y + 0.07;
      result.push({
        id: control.id,
        center: center.toArray() as [number, number, number],
        width: control.width,
        height: control.height,
        label: control.label,
      });
    }
    return result;
  }, [model]);

  useEffect(() => {
    const parts = new Map<ControlId, HardwarePart>();
    model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const id = controlFromName(node.name);
      // Use the actual GLB pivot or our matching cloned button pivot.
      if (!id || !node.name.toLowerCase().includes('_lambert')) return;
      const pivot = node.parent;
      if (!pivot) return;
      parts.set(id, {
        pivot,
        mesh: node,
        initialDepth: pivot.position.y,
        initialRotation: pivot.rotation.y,
        impulse: 0,
        kind: id.startsWith('light') ? 'button' : 'dial',
      });
    });
    hardware.current = parts;
    return () => { hardware.current = new Map(); };
  }, [model]);

  useFrame(({ camera }, delta) => {
    const dx = camera.position.x - 0.336;
    const dy = camera.position.y - 0.808;
    const dz = camera.position.z - 1.367;
    const distance = Math.hypot(dx, dy, dz);
    const facing = distance > 0 && dz / distance > 0.42;
    if (facing !== lastFacing.current) {
      lastFacing.current = facing;
      setScreenFacing(facing);
    }

    for (const [id, part] of hardware.current) {
      // A single short impulse: up to 18 degrees, then back to the exact
      // authored resting rotation. Never accumulate a full turn or translate
      // the cosmetic knobs backwards into the shell.
      const phase = 1 - part.impulse;
      const pulse = part.impulse > 0 ? Math.sin(phase * Math.PI) : 0;
      if (part.kind === 'dial') {
        part.pivot.rotation.y = part.initialRotation + Math.max(0, pulse) * (Math.PI / 10);
        part.pivot.position.y = part.initialDepth;
      } else {
        part.pivot.rotation.y = part.initialRotation;
        // Buttons depress briefly; unlike knobs they physically push in.
        part.pivot.position.y = part.initialDepth - Math.max(0, pulse) * 1.6;
      }
      part.impulse = Math.max(0, part.impulse - Math.min(delta, 0.05) * 2.25);
      if (part.kind === 'button' && part.mesh.material instanceof THREE.MeshStandardMaterial) {
        const buttonNumber = Number(id.slice(5, 6));
        const lit = powerState === 'ready' && TABS[buttonNumber - 1] === activeTab;
        part.mesh.material.emissiveIntensity = powerState === 'off' ? 0 : lit ? .75 + part.impulse * .35 : .08 + part.impulse * .25;
      }
    }
  });

  const isPhysicalCanvasEvent = (event: ThreeEvent<MouseEvent> | ThreeEvent<PointerEvent>) => {
    // The nested INV WebGL canvas and the interactive CRT Html may bubble
    // into the outer R3F event manager. Never treat those as hardware input.
    const target = event.sourceEvent?.target;
    if (!(target instanceof Element) || target.closest('.imported-live-screen')) return false;
    // R3F usually dispatches directly from the WebGL canvas; some versions
    // attach to its immediate parent. Accept only these two physical
    // surfaces, never inner HTML or the inventory's second canvas.
    return target === gl.domElement || target === gl.domElement.parentElement;
  };

  const activateControl = (id: ControlId) => {
    if (powerState !== 'ready') return;
    const part = hardware.current.get(id);
    if (part) part.impulse = 1;
    // Every physical dial is cosmetic. Only the five red buttons navigate.
    if (id.startsWith('light')) {
      const tab = TABS[Number(id.slice(5)) - 1];
      if (tab) onTabChange(tab);
    }
  };

  const onHardwareClick = (event: ThreeEvent<MouseEvent>) => {
    if (!isPhysicalCanvasEvent(event)) return;
    const id = identifyHardware(event.object);
    if (!id) return;
    event.stopPropagation();
    activateControl(id);
  };

  const onHardwareHover = (event: ThreeEvent<PointerEvent>) => {
    if (!isPhysicalCanvasEvent(event)) return;
    const id = identifyHardware(event.object);
    if (id) document.body.style.cursor = 'pointer';
  };

  const clearHardwareHover = () => {
    document.body.style.cursor = '';
  };

  return (
    <group position={[0.07, -0.247, 1.187]}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <primitive
          object={model}
          onClick={onHardwareClick}
          onPointerOver={onHardwareHover}
          onPointerOut={clearHardwareHover}
        />
        {targets.map((target) => (
          <Html
            key={target.id}
            transform
            center
            distanceFactor={400}
            rotation={[-Math.PI / 2, 0, 0]}
            position={target.center}
            scale={0.00351}
            zIndexRange={[20, 14]}
            style={{
              width: target.width + 'px',
              height: target.height + 'px',
              pointerEvents: screenFacing ? 'auto' : 'none',
              visibility: screenFacing ? 'visible' : 'hidden',
            }}
          >
            <button
              type="button"
              className={'pipboy-hardware-target' + (target.id.startsWith('light') ? ' is-button' : ' is-knob')}
              aria-label={target.label + ' — physical Pip-Boy control'}
              title={target.label}
              disabled={powerState !== 'ready'}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                activateControl(target.id);
              }}
            >
              <span className="pipboy-hardware-label" aria-hidden="true">{target.label}</span>
            </button>
          </Html>
        ))}
        <Html
          transform
          center
          distanceFactor={400}
          occlude
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0.266, 0.184, -1.055]}
          scale={0.00351}
          className="imported-live-screen"
          zIndexRange={[12, 2]}
          style={{
            width: '900px',
            height: '648px',
            pointerEvents: screenFacing && powerState !== 'off' ? 'auto' : 'none',
            visibility: screenFacing ? 'visible' : 'hidden',
          }}
        >
          <div className="imported-screen-wrapper">{display}</div>
        </Html>
      </group>
    </group>
  );
}

type OrbitInstance = ElementRef<typeof OrbitControls>;

type CameraFlight = {
  fromPosition: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toPosition: THREE.Vector3;
  toTarget: THREE.Vector3;
  elapsed: number;
  duration: number;
};

/**
 * Both orbit and stabilized camera states render the SAME interactive GLB.
 * Free mode starts in a three-quarter showcase view. Stabilize animates to a
 * true front-facing close-up of the screen and locks OrbitControls.
 */
function CameraMotion({
  stabilized, resetToken, controlsRef, onAnimating,
}: {
  stabilized: boolean;
  resetToken: number;
  controlsRef: RefObject<OrbitInstance>;
  onAnimating: (value: boolean) => void;
}) {
  const { camera, size, invalidate } = useThree();
  const initialized = useRef(false);
  const flight = useRef<CameraFlight | null>(null);

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const aspect = Math.max(0.4, size.width / Math.max(1, size.height));
    const halfFovTan = Math.tan((camera.fov * Math.PI) / 360);
    const controls = controlsRef.current;
    if (!controls) return;

    // GLB bounds after rotation: 6.354 × 5.105. The initial free camera
    // frames the entire object at a flattering angle.
    const freeDistance = Math.max(
      5.1054 / (2 * halfFovTan * 0.72),
      6.3544 / (2 * halfFovTan * aspect * 0.78),
    ) + 1.2;
    const freeTarget = new THREE.Vector3(0, 0.16, 0);
    const freePosition = new THREE.Vector3(
      freeDistance * 0.31,
      freeTarget.y + freeDistance * 0.105,
      freeDistance * 0.946,
    );

    // In the GLB's world coordinates, the CRT is centered around
    // x=0.336, y=0.808, z=1.42. Aim the camera at that actual display,
    // moving close enough to make the interactive UI comfortably legible.
    // Fit to both width and height so narrower windows remain usable.
    const screenTarget = new THREE.Vector3(0.336, 0.808, 0);
    const screenDistance = Math.max(
      2.35 / (2 * halfFovTan * 0.84),
      3.3 / (2 * halfFovTan * aspect * 0.80),
    ) + 1.42;
    const closePosition = new THREE.Vector3(
      screenTarget.x, screenTarget.y, screenDistance,
    );

    const toPosition = stabilized ? closePosition : freePosition;
    const toTarget = stabilized ? screenTarget : freeTarget;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // Present the 3D device immediately on mount. Only the user-triggered
    // Stabilize/Unlock action or Reset Camera animates the model.

    const alreadyThere = camera.position.distanceTo(toPosition) < 0.015 &&
      controls.target.distanceTo(toTarget) < 0.015;
    if (!initialized.current || reducedMotion || alreadyThere) {
      flight.current = null;
      camera.position.copy(toPosition);
      controls.target.copy(toTarget);
      camera.lookAt(controls.target);
      controls.update();
      camera.updateProjectionMatrix();
      initialized.current = true;
      onAnimating(false);
      invalidate();
      return;
    }

    // Preserve the current user-controlled orbit as the starting pose.
    // Smoothstep eases the camera's position AND its look-at target,
    // making the 3D Pip-Boy rotate and approach without a hard cut.
    flight.current = {
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPosition, toTarget,
      elapsed: 0,
      duration: 0.95,
    };
    onAnimating(true);
    invalidate();
  }, [camera, size.width, size.height, stabilized, resetToken, controlsRef, onAnimating, invalidate]);

  useFrame((_, delta) => {
    const current = flight.current;
    const controls = controlsRef.current;
    if (!current || !controls) return;

    current.elapsed = Math.min(current.duration, current.elapsed + Math.min(delta, 0.05));
    const t = current.elapsed / current.duration;
    const ease = t * t * (3 - 2 * t);
    camera.position.lerpVectors(current.fromPosition, current.toPosition, ease);
    controls.target.lerpVectors(current.fromTarget, current.toTarget, ease);
    controls.update();
    invalidate();

    if (t >= 1) {
      flight.current = null;
      controls.saveState();
      onAnimating(false);
    }
  });
  return null;
}

function LoadedScene({
  display, activeTab, onTabChange, powerState, resetToken, stabilized,
}: Props & { resetToken: number }) {
  const controlsRef = useRef<OrbitInstance>(null);
  const [animating, setAnimating] = useState(false);

  return (
    <Canvas
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 12], fov: 35, near: 0.05, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <ambientLight intensity={1.3} />
      <hemisphereLight args={['#dde4d6', '#2d2921', 2]} />
      <directionalLight position={[-3, 7, 8]} color="#fff4d7" intensity={2.2} />
      <directionalLight position={[6, 3, -5]} color="#a2c497" intensity={2} />
      <pointLight position={[4, -3, 6]} color="#9ec5a1" intensity={14} distance={30} />
      <Suspense fallback={<Html center><div className="asset-loading">LOADING TEXTURED PIP-BOY…</div></Html>}>
        <Asset display={display} activeTab={activeTab} onTabChange={onTabChange} powerState={powerState} />
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={!stabilized && !animating && powerState === 'ready'}
        enableRotate={!stabilized && !animating && powerState === 'ready'}
        enableZoom={!stabilized && !animating && powerState === 'ready'}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={5.3}
        maxDistance={29}
        minPolarAngle={0.30}
        maxPolarAngle={Math.PI - 0.35}
        minAzimuthAngle={-Math.PI * 0.46}
        maxAzimuthAngle={Math.PI * 0.46}
      />
      <CameraMotion
        stabilized={stabilized}
        resetToken={resetToken}
        controlsRef={controlsRef}
        onAnimating={setAnimating}
      />
    </Canvas>
  );
}

export default function PipBoyImported3D(props: Props) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const { stabilized } = props;
  const [creditsOpen, setCreditsOpen] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(MODEL_PATH, { method: 'HEAD', signal: controller.signal })
      .then((response) => {
        // Vite and static SPA hosts sometimes return index.html with 200 for missing assets.
        const mime = response.headers.get('content-type') || '';
        const length = Number(response.headers.get('content-length') || 0);
        setAvailable(response.ok && !mime.includes('text/html') &&
          !mime.includes('text/plain') && (length === 0 || length > 20000));
      })
      .catch(() => { if (!controller.signal.aborted) setAvailable(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    return () => { document.body.style.cursor = ''; };
  }, []);

  if (available !== true) {
    return (
      <main className="three-device-stage imported-device-stage" role="status">
        <div className="pipboy-asset-status">
          {available === null ? (
            <strong>INITIALIZING PIP-BOY…</strong>
          ) : (
            <>
              <strong>3D MODEL UNAVAILABLE</strong>
              <p>Check that <code>public/models/pip-boy-fallout-3-web.glb</code> exists, then refresh.</p>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main
      className={'three-device-stage imported-device-stage' + (stabilized ? ' is-stabilized' : '')}
      aria-label="Interactive 3D Pip-Boy"
    >
      <div className="three-canvas-frame imported-canvas-frame">
        <LoadedScene {...props} resetToken={resetToken} stabilized={stabilized} />
      </div>

      {!stabilized && (
        <div className="pipboy-viewport-controls">
          <button
            type="button"
            className="pipboy-reset-button"
            onClick={() => setResetToken((n) => n + 1)}
            aria-label="Reset the 3D camera"
            title="Reset 3D camera"
          >
            <RotateCcw size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="pipboy-credits">
        <button
          className="pipboy-credits-button"
          type="button"
          aria-label="About the 3D model and its license"
          aria-controls="pipboy-credits-panel"
          aria-expanded={creditsOpen}
          onClick={() => setCreditsOpen((open) => !open)}
          title="Model information and attribution"
        >
          <Info size={19} aria-hidden="true" />
        </button>
        {creditsOpen && (
          <div className="pipboy-credits-panel" id="pipboy-credits-panel" role="region" aria-label="3D model attribution">
            <strong>3D MODEL CREDIT</strong>
            <p>
              <a href="https://sketchfab.com/3d-models/pip-boy-fallout-3-concept-21bfe974c2564ebabcc974b39a2a1f00"
                target="_blank" rel="noopener noreferrer">Pip-Boy Fallout 3 Concept by Julien Schoots (WizOfFab)</a>
            </p>
            <p>
              Licensed under <a href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank" rel="noopener noreferrer">CC BY 4.0</a>.
              Textures were resized and converted for faster web loading. The original screen was adapted for an interactive interface.
            </p>
            <button type="button" className="pipboy-credits-close" onClick={() => setCreditsOpen(false)}>CLOSE</button>
          </div>
        )}
      </div>
    </main>
  );
}
