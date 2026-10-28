import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
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
        // Replace the baked, noninteractive CRT glass with our actual React interface.
        if (child.name.startsWith('Screen_low_')) child.visible = false;
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
        <mesh position={[0.266, 0.18, -1.055]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.06, 2.19]} />
          <meshBasicMaterial color="#07130a" />
        </mesh>
        <Html
          transform
          center
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0.266, 0.215, -1.055]}
          scale={0.00335}
          className="imported-live-screen"
          zIndexRange={[12, 2]}
          style={{ width: '900px', height: '615px', pointerEvents: 'auto' }}
        >
          <div className="imported-screen-wrapper">{display}</div>
        </Html>
      </group>
    </group>
  );
}

function CameraFit({ token }: { token: number }) {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const fov = camera.fov * Math.PI / 180;
    const aspect = Math.max(0.4, size.width / Math.max(size.height, 1));
    // Measured from the supplied GLB after its 90-degree rotation:
    // 6.354 wide × 5.105 high × 3.437 deep (not guessed from a render).
    // Keep a little clearance for the parts of the shell closest to the camera.
    const targetFill = 0.83;
    const fitHeight = 5.1054 / (2 * Math.tan(fov / 2) * targetFill);
    const fitWidth = 6.3544 / (2 * Math.tan(fov / 2) * aspect * targetFill);
    const distance = Math.max(fitHeight, fitWidth) + 1.1;
    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, invalidate, token]);
  return null;
}

function LoadedScene({ display, activeTab, onTabChange, onPower, resetToken }: Props & { resetToken: number }) {
  return (
    <Canvas
      // Absolutely fill the entire flex frame. A percentage-height Canvas
      // collapsed to a short strip at the top on desktop (the screenshot bug).
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
        makeDefault
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
      <CameraFit token={resetToken} />
    </Canvas>
  );
}

export default function PipBoyImported3D(props: Props) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [resetToken, setResetToken] = useState(0);
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
        <LoadedScene {...props} resetToken={resetToken} />
        <div className="three-canvas-corner top-left" aria-hidden="true" />
        <div className="three-canvas-corner top-right" aria-hidden="true" />
        <div className="three-canvas-corner bottom-left" aria-hidden="true" />
        <div className="three-canvas-corner bottom-right" aria-hidden="true" />
      </div>
      <div className="three-stage-toolbar">
        <div className="three-control-hint">
          <span>↔ DRAG OUTSIDE SCREEN</span>
          <span>↕ SCROLL TO ZOOM</span>
          <span>CLICK THE MODEL'S KNOBS</span>
        </div>
        <div className="three-stage-actions">
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
