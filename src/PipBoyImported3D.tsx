import { Suspense, useEffect, useMemo, useRef, useState, type ElementRef, type ReactNode, type RefObject } from 'react';
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber';
import { Html, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { Tab } from './data';
import PipBoy3D from './PipBoy3D';
import './pipboy-imported.css';

const MODEL_PATH = '/models/pip-boy-fallout-3-web.glb';
const TABS: Tab[] = ['STAT', 'INV', 'DATA', 'MAP', 'RADIO'];
type PowerState = 'booting' | 'ready' | 'off';

type Props = {
  display: ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onPower: () => void;
  powerState: PowerState;
  amber: boolean;
  onFlatView: () => void;
};

function Asset({ display, activeTab, onTabChange, onPower }: Pick<Props, 'display'|'activeTab'|'onTabChange'|'onPower'>) {
  const { scene } = useGLTF(MODEL_PATH);
  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // The textured GLB's original screen is curved and closes the casing.
        // Keep it as an opaque dark backing instead of removing it: otherwise
        // the wearer can see into/through the empty casing at oblique angles.
        if (child.name.startsWith('Screen_low_')) {
          child.material = new THREE.MeshBasicMaterial({
            color: '#06130b',
            side: THREE.DoubleSide,
            depthWrite: true,
          });
        }
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
    return copy;
  }, [scene]);

  const onHardwareClick = (event: ThreeEvent<MouseEvent>) => {
    const name = event.object.name.toLowerCase();
    if (name.startsWith('rightknob') || name.startsWith('radio_low')) {
      event.stopPropagation();
      onTabChange('RADIO');
    } else if (name.startsWith('knob1')) {
      event.stopPropagation();
      onTabChange(TABS[(TABS.indexOf(activeTab) + TABS.length - 1) % TABS.length]);
    } else if (name.startsWith('knob2')) {
      event.stopPropagation();
      onTabChange(TABS[(TABS.indexOf(activeTab) + 1) % TABS.length]);
    } else if (name.startsWith('knob3')) {
      event.stopPropagation();
      onPower();
    }
  };
  const onHardwareHover = (event: ThreeEvent<PointerEvent>) => {
    if (/^(rightknob|radio_low|knob[123])/.test(event.object.name.toLowerCase())) {
      document.body.style.cursor = 'pointer';
    }
  };

  return (
    <group position={[0.07, -0.247, 1.187]}>
      {/*
        Sketchfab model: the screen faces +Y and its vertical axis is -Z.
        Rotate X +90 degrees to face the camera, preserving the original form.
        The offsets recenter the physical model for proper camera framing.
      */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <primitive
          object={model}
          onClick={onHardwareClick}
          onPointerOver={onHardwareHover}
          onPointerOut={() => { document.body.style.cursor = ''; }}
        />
        {/* An opaque, double-sided underlay slightly behind the HTML screen
            ensures no daylight/gaps appear near the curved CRT's edges. */}
        <mesh position={[0.266, 0.191, -1.055]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.31, 2.40]} />
          <meshBasicMaterial color="#06130b" side={THREE.DoubleSide} depthWrite />
        </mesh>
        <Html
          transform
          center
          // Drei's transform mode scales CSS pixels by (distanceFactor || 10) / 400.
          // With the previous default of 10, our 900px UI was shrunk by 40x,
          // appearing as a single green speck in the middle of the CRT.
          // At distanceFactor 400, CSS pixels map to model units via scale.
          // Original GLB screen bounds: x -1.348..1.881 (3.229 units),
          // z -2.216..0.105 (2.321 units). Overfill by ~1% to avoid gaps.
          distanceFactor={400}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0.266, 0.232, -1.055]}
          scale={0.00363}
          className="imported-live-screen"
          zIndexRange={[12, 2]}
          style={{ width: '900px', height: '648px', pointerEvents: 'auto' }}
        >
          <div className="imported-screen-wrapper">{display}</div>
        </Html>
      </group>
    </group>
  );
}

type OrbitInstance = ElementRef<typeof OrbitControls>;

function CameraFit({
  token, stabilized, controlsRef,
}: {
  token: number;
  stabilized: boolean;
  controlsRef: RefObject<OrbitInstance>;
}) {
  const { camera, size, invalidate } = useThree();

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const fov = camera.fov * Math.PI / 180;
    const aspect = Math.max(0.4, size.width / Math.max(size.height, 1));
    // Original imported model bounds after rotation: 6.354 × 5.105 units.
    // Give the locked view extra room for the screen and surrounding hardware.
    const targetFill = stabilized ? 0.77 : 0.83;
    const fitHeight = 5.1054 / (2 * Math.tan(fov / 2) * targetFill);
    const fitWidth = 6.3544 / (2 * Math.tan(fov / 2) * aspect * targetFill);
    const distance = Math.max(fitHeight, fitWidth) + 1.1;
    const focus = new THREE.Vector3(0, stabilized ? 0.32 : 0, 0);

    // Reset the actual OrbitControls state, not just the camera transform.
    // This clears any pending drag/damping so STABILIZE really locks front-on.
    const controls = controlsRef.current;
    controls?.reset();
    controls?.target.copy(focus);

    camera.position.set(focus.x, focus.y, distance);
    camera.lookAt(focus);
    camera.updateProjectionMatrix();
    controls?.update();
    controls?.saveState();
    invalidate();
  }, [camera, controlsRef, invalidate, size.height, size.width, stabilized, token]);

  return null;
}

function LoadedScene({
  display, activeTab, onTabChange, onPower, resetToken, stabilized,
}: Props & { resetToken: number; stabilized: boolean }) {
  const controlsRef = useRef<OrbitInstance>(null);

  return (
    <Canvas
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 10], fov: 35, near: 0.05, far: 80 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <ambientLight intensity={1.3} />
      <hemisphereLight args={['#dde4d6', '#2d2921', 2]} />
      <directionalLight position={[-3, 7, 8]} color="#fff4d7" intensity={2.2} />
      <directionalLight position={[6, 3, -5]} color="#a2c497" intensity={2} />
      <pointLight position={[4, -3, 6]} color="#9ec5a1" intensity={14} distance={30} />
      <Suspense fallback={<Html center><div className="asset-loading">LOADING TEXTURED PIP-BOY…</div></Html>}>
        <Asset display={display} activeTab={activeTab} onTabChange={onTabChange} onPower={onPower} />
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={!stabilized}
        enableRotate={!stabilized}
        enableZoom={!stabilized}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={6.5}
        maxDistance={26}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI - 0.35}
        minAzimuthAngle={-Math.PI * 0.46}
        maxAzimuthAngle={Math.PI * 0.46}
      />
      <CameraFit
        token={resetToken}
        stabilized={stabilized}
        controlsRef={controlsRef}
      />
    </Canvas>
  );
}

export default function PipBoyImported3D(props: Props) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const [stabilized, setStabilized] = useState(false);
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

  // GitHub's text connector cannot upload GLB bytes. Until the downloaded file
  // is copied to public/models, preserve the previous fully working 3D view.
  if (available !== true) {
    return (
      <div className="asset-fallback-wrap">
        <PipBoy3D {...props} />
        {available === false && (
          <div className="asset-fallback-note" role="status">
            TEXTURED MODEL NOT INSTALLED · COPY pip-boy-fallout-3-web.glb TO public/models/
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="three-device-stage imported-device-stage" aria-label="Textured interactive 3D Pip-Boy model by Julien Schoots">
      <div className="three-stage-topline">
        <span><span className="three-live-dot" /> PIP-BOY 3000 / TEXTURED FIELD UNIT</span>
        <span className="three-stage-mode">MODEL: JULIEN SCHOOTS</span>
      </div>
      <div className="three-canvas-frame imported-canvas-frame">
        <LoadedScene {...props} resetToken={resetToken} stabilized={stabilized} />
        <div className="three-canvas-corner top-left" aria-hidden="true" />
        <div className="three-canvas-corner top-right" aria-hidden="true" />
        <div className="three-canvas-corner bottom-left" aria-hidden="true" />
        <div className="three-canvas-corner bottom-right" aria-hidden="true" />
      </div>
      <div className="three-stage-toolbar">
        <div className="three-control-hint">
          {stabilized ? (
            <>
              <span>● FRONT VIEW LOCKED</span>
              <span>CLICK OR SCROLL INSIDE THE SCREEN TO USE YOUR PIP-BOY</span>
            </>
          ) : (
            <>
              <span>↔ DRAG OUTSIDE SCREEN</span>
              <span>↕ SCROLL TO ZOOM</span>
              <span>CLICK THE MODEL'S KNOBS</span>
            </>
          )}
        </div>
        <div className="three-stage-actions">
          <button
            type="button"
            className={stabilized ? 'three-stabilize-action active' : 'three-stabilize-action'}
            onClick={() => setStabilized((value) => !value)}
            aria-pressed={stabilized}
            title={stabilized ? 'Allow free 3D rotation again' : 'Snap straight ahead and lock rotation for easier screen interaction'}
          >
            {stabilized ? '✓ STABILIZED · UNLOCK' : '◎ STABILIZE'}
          </button>
          <button type="button" onClick={() => setResetToken((n) => n + 1)}>RESET CAMERA</button>
          <button type="button" className="three-flat-action" onClick={props.onFlatView}>FOCUS SCREEN / 2D</button>
        </div>
      </div>
      <a className="imported-model-credit"
         href="https://sketchfab.com/3d-models/pip-boy-fallout-3-concept-21bfe974c2564ebabcc974b39a2a1f00"
         target="_blank" rel="noopener noreferrer">
        3D MODEL: JULIEN SCHOOTS · CC BY 4.0 · MODIFIED TEXTURE RESOLUTION
      </a>
    </main>
  );
}
