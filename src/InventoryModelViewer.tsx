import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, type ThreeEvent, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, useGLTF } from '@react-three/drei';
import { Box as BoxIcon, RotateCcw } from 'lucide-react';
import * as THREE from 'three';
import './inventory-3d.css';

/**
 * Actual licensed GLBs stored in public/models/inventory.
 * AirPods is restored from the versioned .glb.gz file by the npm predev /
 * prebuild script, so do not request the compressed archive in the browser.
 */
const MODEL_URLS: Record<string, string> = {
  'macbook-1': '/models/inventory/macbook_air_m2_midnight.glb',
  'macbook-2': '/models/inventory/macbook_air_m4_silver_visual.glb',
  'wallet': '/models/inventory/wallet_black.glb',
  'car-keys': '/models/inventory/electronic_car_key.glb',
  'house-key': '/models/inventory/cute_key.glb',
  'airpods': '/models/inventory/airpods_pro.glb',
};

// Source authors and exact model links retained for CC BY 4.0 attribution.
const MODEL_CREDITS: Record<string, { author: string; url: string; modifications: string }> = {
  'macbook-1': { author: 'rtql8d', url: 'https://sketchfab.com/3d-models/macbook-air-m2-786fa23d402a4f90ae36c4168997f9cc', modifications: 'Midnight recolor' },
  'macbook-2': { author: 'rtql8d', url: 'https://sketchfab.com/3d-models/macbook-air-m2-786fa23d402a4f90ae36c4168997f9cc', modifications: 'Silver recolor; M2 mesh placeholder' },
  'wallet': { author: 'Sergey Filin', url: 'https://sketchfab.com/3d-models/old-wallet-25a75902f3e5446a893b0de552f42862', modifications: 'Black leather recolor' },
  'car-keys': { author: 'neeb17', url: 'https://sketchfab.com/3d-models/electronic-car-key-9e80efbaba8740288a77dcd165c3dedb', modifications: 'Unmodified' },
  'house-key': { author: 'Incg5764', url: 'https://sketchfab.com/3d-models/cute-key-4234dafdff39484fa6cecd65ebf5bc84', modifications: 'Unmodified' },
  'airpods': { author: 'Jed Falcone', url: 'https://sketchfab.com/3d-models/airpods-pro-3f84ddc3d87a4ec0a5e5f379abfecd9c', modifications: 'Unmodified' },
};

export const inventoryHas3DModel = (id: string) =>
  Object.prototype.hasOwnProperty.call(MODEL_URLS, id);

type ModelProps = {
  src: string;
  isAirpods: boolean;
  open: boolean;
  onToggle: () => void;
};

function Model({ src, isAirpods, open, onToggle }: ModelProps) {
  const { scene, animations } = useGLTF(src);

  // The underlying cached GLTF is shared; clone it so animations and
  // transforms never mutate a model used by another viewer.
  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(copy);
    const center = bounds.getCenter(new THREE.Vector3());
    const dimensions = bounds.getSize(new THREE.Vector3());
    const longest = Math.max(dimensions.x, dimensions.y, dimensions.z, 0.001);
    const scale = 2.8 / longest;
    copy.scale.multiplyScalar(scale);
    copy.position.addScaledVector(center, -scale);
    return copy;
  }, [scene]);

  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  const clip = isAirpods ? animations[0] : undefined;
  const time = useRef(0);

  useEffect(() => {
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.play();
    time.current = 0;
    mixer.setTime(0);
    return () => {
      action.stop();
      mixer.stopAllAction();
    };
  }, [clip, mixer]);

  useFrame((_, delta) => {
    if (!clip) return;
    const destination = open ? clip.duration : 0;
    // A reversible timeline: opening and closing the actual GLB's Lid and
    // Airpods channels, rather than moving a fake lid or replacing the mesh.
    const next = THREE.MathUtils.damp(time.current, destination, 5.5, Math.min(delta, 0.05));
    if (Math.abs(next - time.current) < 0.00001 && Math.abs(destination - next) < 0.002) return;
    time.current = Math.abs(destination - next) < 0.002 ? destination : next;
    mixer.setTime(time.current);
  });

  const onModelClick = (event: ThreeEvent<MouseEvent>) => {
    if (!isAirpods || event.delta > 5) return;
    event.stopPropagation();
    onToggle();
  };

  return <primitive object={model} onClick={onModelClick} />;
}

function LoadingModel() {
  return <Html center>
    <div className="inventory-model-status" role="status">LOADING 3D ASSET…</div>
  </Html>;
}

class ModelErrorBoundary extends Component<
  { children: ReactNode; name: string },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return <div className="inventory-viewer-error" role="alert">
      <BoxIcon size={25} aria-hidden="true" />
      <strong>3D MODEL UNAVAILABLE</strong>
      <span>Could not load {this.props.name}. Verify the model file and restart npm run dev.</span>
    </div>;
    return this.props.children;
  }
}

export default function InventoryModelViewer({ itemId, itemName }: { itemId: string; itemName: string }) {
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const src = MODEL_URLS[itemId];
  const credit = MODEL_CREDITS[itemId];
  const isAirpods = itemId === 'airpods';
  const reducedMotion = typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <section className="inventory-viewer" aria-label={'Interactive 3D model of ' + itemName}>
      <div className="inventory-viewer-caption">
        <span className="inventory-viewer-live" aria-hidden="true" />
        3D OBJECT / {itemId === 'macbook-2' ? 'M4 VISUAL' : 'INSPECTION'}
      </div>
      <a className="inventory-viewer-credit" href={credit.url} target="_blank" rel="noopener noreferrer"
        title={`3D model by ${credit.author}. CC BY 4.0. ${credit.modifications}. Opens the original Sketchfab model.`}>
        CREDIT ↗
      </a>
      <div className="inventory-viewer-canvas">
        <ModelErrorBoundary key={src} name={itemName}>
          <Canvas
            key={src + '-' + resetCount}
            dpr={[1, 1.5]}
            camera={{ position: [3.7, 2.3, 5.6], fov: 37, near: 0.01, far: 120 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
          >
            <ambientLight intensity={1.5} />
            <hemisphereLight args={['#edf8e6', '#4c5649', 1.2]} />
            <directionalLight position={[3, 5, 6]} intensity={2.7} color="#f4fff0" />
            <directionalLight position={[-4, 2, -3]} intensity={1.6} color="#a1c5cc" />
            <Suspense fallback={<LoadingModel />}>
              <Model src={src} isAirpods={isAirpods} open={open} onToggle={() => setOpen((v) => !v)} />
            </Suspense>
            <OrbitControls
              makeDefault
              enablePan={false}
              enableZoom
              enableDamping
              dampingFactor={0.12}
              minDistance={3.0}
              maxDistance={12}
              minPolarAngle={0.08}
              maxPolarAngle={Math.PI - 0.08}
              autoRotate={spinning && !reducedMotion}
              autoRotateSpeed={1.6}
            />
          </Canvas>
        </ModelErrorBoundary>
      </div>
      <div className="inventory-viewer-controls">
        {isAirpods && (
          <button type="button" className="inventory-viewer-primary"
            aria-pressed={open} onClick={() => setOpen((v) => !v)}>
            {open ? 'CLOSE CASE' : 'OPEN CASE'}
          </button>
        )}
        <button type="button" aria-pressed={spinning} disabled={reducedMotion}
          onClick={() => setSpinning((v) => !v)} title="Rotate model automatically">
          {spinning ? 'STOP SPIN' : 'AUTO SPIN'}
        </button>
        <button type="button" onClick={() => setResetCount((n) => n + 1)}
          title="Reset the 3D object camera" aria-label="Reset object view">
          <RotateCcw size={11} aria-hidden="true" /> RESET
        </button>
      </div>
      <span className="inventory-viewer-help">DRAG TO ROTATE · SCROLL TO ZOOM</span>
    </section>
  );
}
