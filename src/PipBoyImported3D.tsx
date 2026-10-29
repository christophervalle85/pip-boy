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
  onRadioNext: () => void;
  onPower: () => void;
  powerState: PowerState;
  amber: boolean;
  stabilized: boolean;
};

type HardwarePart = {
  mesh: THREE.Mesh;
  initialY: number;
  initialRotation: number;
  targetRotation: number;
  impulse: number;
  kind: 'dial' | 'button';
};

function identifyHardware(object: THREE.Object3D): string | null {
  // The 43 exported GLB nodes are named: knob1/2/3_low, RightKnob_low,
  // light1/2/3/4_low, and Radio_low / RadioInside_low.
  let node: THREE.Object3D | null = object;
  while (node) {
    const name = node.name.toLowerCase();
    if (/^(knob[123]_low|rightknob_low|light[1234]_low|radio_low|radioinside_low)/.test(name)) return name;
    node = node.parent;
  }
  return null;
}

function Asset({
  display, activeTab, onTabChange, onRadioNext, onPower, powerState,
}: Pick<Props, 'display' | 'activeTab' | 'onTabChange' | 'onRadioNext' | 'onPower' | 'powerState'>) {
  const { scene } = useGLTF(MODEL_PATH);
  const { gl } = useThree();
  const [screenFacing, setScreenFacing] = useState(true);
  const lastFacing = useRef(true);
  const hardware = useRef<Map<string, HardwarePart>>(new Map());

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
      if (/^light[1-4]_low/i.test(child.name) && child.material instanceof THREE.MeshStandardMaterial) {
        // Clone only the indicator materials so other GLB pieces keep their
        // original textures while the physical buttons can light up.
        child.material = child.material.clone();
        child.material.emissive.set('#e6846a');
        child.material.emissiveIntensity = .06;
      }
      child.castShadow = false;
      child.receiveShadow = false;
    });
    return copy;
  }, [scene]);

  useEffect(() => {
    const parts = new Map<string, HardwarePart>();
    model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const name = node.name.toLowerCase();
      if (!/^(knob[123]_low|rightknob_low|light[1234]_low)/.test(name)) return;
      parts.set(name, {
        mesh: node,
        initialY: node.position.y,
        initialRotation: node.rotation.y,
        targetRotation: node.rotation.y,
        impulse: 0,
        kind: name.startsWith('light') ? 'button' : 'dial',
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

    const smoothing = 1 - Math.exp(-Math.min(delta, .05) * 16);
    for (const part of hardware.current.values()) {
      part.mesh.rotation.y += (part.targetRotation - part.mesh.rotation.y) * smoothing;
      part.impulse = Math.max(0, part.impulse - Math.min(delta, .05) * 4);
      const depression = Math.sin(part.impulse * Math.PI) * (part.kind === 'button' ? .03 : .012);
      part.mesh.position.y = part.initialY - depression;
      if (part.kind === 'button' && part.mesh.material instanceof THREE.MeshStandardMaterial) {
        const buttonNumber = Number(part.mesh.name.toLowerCase().slice(5, 6));
        const lit = powerState === 'ready' && TABS[buttonNumber - 1] === activeTab;
        part.mesh.material.emissiveIntensity = powerState === 'off' ? 0 : lit ? .65 + part.impulse * .35 : .06 + part.impulse * .24;
      }
    }
  });

  const onHardwareClick = (event: ThreeEvent<MouseEvent>) => {
    // R3F can receive events bubbling from the inner INV canvas via the
    // Drei Html overlay. Only a real click on THIS canvas may operate
    // physical hardware, never a click from the nested viewer or CRT UI.
    if (event.sourceEvent?.target !== gl.domElement) return;
    const name = identifyHardware(event.object);
    if (!name) return;
    event.stopPropagation();

    const matching = [...hardware.current.values()].find((part) => part.mesh.name.toLowerCase() === name);
    if (matching) {
      matching.impulse = .97;
      if (matching.kind === 'dial') {
        // Mesh pivots are the original exported local origins. A small turn
        // avoids unseating the hardware while making the control feel tactile.
        matching.targetRotation += name.startsWith('rightknob') ? .18 : .15;
      }
    }

    if (name.startsWith('rightknob') || name.startsWith('radio')) onRadioNext();
    else if (name.startsWith('knob1')) onTabChange(TABS[(TABS.indexOf(activeTab) + TABS.length - 1) % TABS.length]);
    else if (name.startsWith('knob2')) onTabChange(TABS[(TABS.indexOf(activeTab) + 1) % TABS.length]);
    else if (name.startsWith('knob3')) onPower();
    else {
      const index = Number(name.slice(5, 6)) - 1;
      if (index >= 0 && index < 4) onTabChange(TABS[index]);
    }
  };

  const onHardwareHover = (event: ThreeEvent<PointerEvent>) => {
    if (event.sourceEvent?.target !== gl.domElement) return;
    if (identifyHardware(event.object)) document.body.style.cursor = 'pointer';
  };

  return (
    <group position={[0.07, -0.247, 1.187]}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <primitive
          object={model}
          onClick={onHardwareClick}
          onPointerOver={onHardwareHover}
          onPointerOut={() => { document.body.style.cursor = ''; }}
        />
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
  display, activeTab, onTabChange, onRadioNext, onPower, powerState, resetToken, stabilized,
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
        <Asset display={display} activeTab={activeTab} onTabChange={onTabChange} onRadioNext={onRadioNext} onPower={onPower} powerState={powerState} />
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
