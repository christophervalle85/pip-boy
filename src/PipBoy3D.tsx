import { Component, useEffect, useState, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, OrbitControls, RoundedBox } from '@react-three/drei';
import type { Tab } from './data';
import './device-3d.css';

type PowerState = 'booting' | 'ready' | 'off';

type DeviceProps = {
  display: ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onPower: () => void;
  powerState: PowerState;
  amber: boolean;
  onFlatView: () => void;
};

const tabs: Tab[] = ['STAT', 'INV', 'DATA', 'MAP', 'RADIO'];
const shell = '#5c6049';
const lip = '#363e32';
const metal = '#a7a18b';
class SceneErrorBoundary extends Component<{ children: ReactNode; onFlatView: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="three-webgl-fallback">
          <strong>3D RENDERER UNAVAILABLE</strong>
          <p>Your Pip-Boy data is safe. The full application is available in flat view.</p>
          <button type="button" onClick={this.props.onFlatView}>OPEN FLAT VIEW</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const screws = [
  [-7.65, 4.3], [7.55, 4.3],
  [-7.65, -4.35], [7.55, -4.35],
  [-6.55, 3.68], [5.00, 3.68],
  [-6.55, -3.15], [5.00, -3.15],
] as const;

function BeveledPanel({
  position, size, color, radius = 0.15, metalness = 0.42, roughness = 0.56,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  radius?: number;
  metalness?: number;
  roughness?: number;
}) {
  return (
    <RoundedBox args={size} radius={radius} smoothness={4} position={position} castShadow receiveShadow>
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </RoundedBox>
  );
}

function Screw({ x, y, z = 1.11 }: { x: number; y: number; z?: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.098, 0.098, 0.065, 16]} />
        <meshStandardMaterial color="#787869" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.044]} rotation={[0, 0, -Math.PI / 5]}>
        <boxGeometry args={[0.12, 0.022, 0.006]} />
        <meshBasicMaterial color="#23281f" />
      </mesh>
    </group>
  );
}

function CylinderKnob({
  position, radius, active = false, onClick, label, color = '#302f28',
}: {
  position: [number, number, number];
  radius: number;
  active?: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius * 1.17, radius * 1.17, 0.14, 32]} />
        <meshStandardMaterial color="#1c221e" metalness={0.72} roughness={0.35} />
      </mesh>
      <mesh
        position={[0, 0, 0.12]}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={(event) => { event.stopPropagation(); onClick(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = ''; }}
      >
        <cylinderGeometry args={[radius, radius * 1.04, 0.22, 40]} />
        <meshStandardMaterial color={active ? '#ae733b' : color} metalness={0.62} roughness={0.35} />
      </mesh>
      <mesh position={[0, radius * 0.68, 0.255]} rotation={[0, 0, Math.PI / 7]}>
        <boxGeometry args={[radius * 0.13, radius * 0.32, 0.021]} />
        <meshBasicMaterial color={active ? '#ffe09c' : metal} />
      </mesh>
      <Html transform center zIndexRange={[8, 2]} position={[0, -radius - 0.34, 0.22]} scale={0.009}>
        <span className="three-hardware-label">{label}</span>
      </Html>
    </group>
  );
}

function TabSwitch({
  tab, position, active, onSelect, glow,
}: {
  tab: Tab;
  position: [number, number, number];
  active: boolean;
  onSelect: () => void;
  glow: string;
}) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.33, 0.34, 0.11, 26]} />
        <meshStandardMaterial color="#252e25" metalness={0.6} roughness={0.36} />
      </mesh>
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 0.13]}
        onClick={(event) => { event.stopPropagation(); onSelect(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = ''; }}
      >
        <cylinderGeometry args={[0.25, 0.28, 0.14, 32]} />
        <meshStandardMaterial
          color={active ? '#b47d46' : '#6c634d'}
          metalness={0.54}
          roughness={0.34}
          emissive={active ? glow : '#000000'}
          emissiveIntensity={active ? 0.22 : 0}
        />
      </mesh>
      <Html transform center zIndexRange={[8, 2]} position={[0, 0.63, 0.2]} scale={0.0094}>
        <span className={'three-hardware-label' + (active ? ' selected' : '')}>{tab}</span>
      </Html>
    </group>
  );
}

function ArmCuff() {
  return (
    <group position={[5.85, -0.35, -1.28]} rotation={[0.06, 0, -0.04]}>
      <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[2.63, 0.82, 14, 44]} />
        <meshStandardMaterial color="#3c4235" metalness={0.28} roughness={0.83} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[2.51, 0.45, 12, 44]} />
        <meshStandardMaterial color="#1b221c" roughness={0.98} />
      </mesh>
      <mesh position={[1.18, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[2.58, 0.24, 12, 44]} />
        <meshStandardMaterial color="#999178" metalness={0.84} roughness={0.37} />
      </mesh>
      {[-1.15, -0.65, -0.15, 0.35, 0.85].map((x) => (
        <mesh key={x} position={[x, -2.68, 0]}>
          <boxGeometry args={[0.21, 0.1, 2.3]} />
          <meshStandardMaterial color="#262c26" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function VentGrille({ x, y, z, count = 8 }: { x: number; y: number; z: number; count?: number }) {
  return (
    <group position={[x, y, z]}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[(i - (count - 1) / 2) * 0.18, 0, 0]}>
          <boxGeometry args={[0.086, 0.66, 0.035]} />
          <meshStandardMaterial color={i % 2 ? '#202820' : '#29332a'} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function FaceHardware({
  display, activeTab, onTabChange, onPower, powerState, amber,
}: Omit<DeviceProps, 'onFlatView'>) {
  const glow = amber ? '#ffc66d' : '#b4ed7b';
  return (
    <group rotation={[0, -0.04, 0]}>
      <ArmCuff />
      <BeveledPanel position={[0, 0, -0.05]} size={[16.35, 9.65, 1.86]} color={shell} radius={0.65} />
      <BeveledPanel position={[0, 0, 0.92]} size={[15.95, 9.25, 0.17]} color="#727761" radius={0.52} metalness={0.72} roughness={0.42} />
      <BeveledPanel position={[-0.85, 0.36, 1.055]} size={[12.7, 7.05, 0.30]} color={lip} radius={0.39} />
      <BeveledPanel position={[-0.85, 0.36, 1.235]} size={[12.3, 6.69, 0.05]} color="#080f0b" radius={0.30} metalness={0.11} roughness={0.32} />
      <BeveledPanel position={[-0.85, 0.36, 1.268]} size={[11.94, 6.49, 0.015]} color={powerState === 'off' ? '#030503' : '#0b1c10'} radius={0.25} metalness={0.02} roughness={0.52} />
      {screws.map(([x, y]) => <Screw x={x} y={y} key={x + ':' + y} />)}

      {/* Screen is real DOM held in the 3D device, not a rendered texture. */}
      <Html
        transform
        center
        position={[-0.85, 0.36, 1.316]}
        scale={0.0124}
        className="three-screen-host"
        zIndexRange={[8, 2]}
        style={{ width: '950px', height: '520px', pointerEvents: 'auto' }}
      >
        <div className="three-screen-wrapper">{display}</div>
      </Html>

      <BeveledPanel position={[-0.85, 4.17, 1.07]} size={[12.05, 0.52, 0.25]} color="#353c32" radius={0.12} />
      <Html transform center zIndexRange={[8, 2]} scale={0.0108} position={[-5.05, 4.24, 1.26]}>
        <span className="three-device-brand">PIP-BOY <b>3000</b></span>
      </Html>

      <BeveledPanel position={[-0.75, -4.02, 1.04]} size={[11.83, 1.04, 0.30]} color="#474e3e" radius={0.17} />
      {tabs.map((tab, i) => (
        <TabSwitch
          key={tab}
          tab={tab}
          position={[-5.50 + i * 2.25, -4.12, 1.25]}
          active={tab === activeTab}
          onSelect={() => onTabChange(tab)}
          glow={glow}
        />
      ))}

      <BeveledPanel position={[6.45, 0.4, 1.14]} size={[1.75, 7.65, 0.45]} color="#454b3b" radius={0.30} />
      <VentGrille x={6.44} y={2.66} z={1.40} count={7} />
      <CylinderKnob
        position={[6.44, 0.83, 1.45]}
        radius={0.72}
        active={activeTab === 'RADIO'}
        onClick={() => onTabChange('RADIO')}
        label="TUNER"
      />
      <CylinderKnob
        position={[6.44, -1.38, 1.43]}
        radius={0.55}
        active={powerState !== 'off'}
        onClick={onPower}
        label={powerState === 'off' ? 'POWER ON' : 'POWER'}
        color="#79654d"
      />
      <mesh position={[6.46, -2.83, 1.45]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={powerState === 'off' ? '#45483c' : glow}
          emissive={powerState === 'off' ? '#000000' : glow}
          emissiveIntensity={powerState === 'off' ? 0 : 1.6}
        />
      </mesh>
      <VentGrille x={6.44} y={-3.43} z={1.40} count={6} />
      <BeveledPanel position={[0, -4.67, 0.45]} size={[9, 0.18, 0.35]} color="#333a30" radius={0.08} />
    </group>
  );
}

function ResetCamera({ token }: { token: number }) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    camera.position.set(0, 0.1, 19.5);
    camera.lookAt(0, 0, 0);
    invalidate();
  }, [camera, invalidate, token]);
  return null;
}

export default function PipBoy3D({
  display, activeTab, onTabChange, onPower, powerState, amber, onFlatView,
}: DeviceProps) {
  const [resetToken, setResetToken] = useState(0);

  useEffect(() => {
    return () => { document.body.style.cursor = ''; };
  }, []);

  return (
    <main className="three-device-stage" aria-label="Interactive three-dimensional Pip-Boy">
      <div className="three-stage-topline">
        <span><span className="three-live-dot" /> VAULT FIELD UNIT / MK IV</span>
        <span className="three-stage-mode">3D HARDWARE ONLINE</span>
      </div>
      <div className="three-canvas-frame">
        <SceneErrorBoundary onFlatView={onFlatView}>
        <Canvas
          shadows={false}
          dpr={[1, 1.75]}
          camera={{ position: [0, 0.1, 19.5], fov: 36, near: 0.1, far: 110 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          fallback={<div className="three-webgl-fallback"><strong>WEBGL UNAVAILABLE</strong><button type="button" onClick={onFlatView}>OPEN FLAT VIEW</button></div>}
        >
          <ambientLight intensity={1.15} />
          <hemisphereLight args={['#d5e0c0', '#161a16', 1.5]} />
          <directionalLight position={[-7, 10, 12]} intensity={2.15} color="#f4e4bf" />
          <pointLight position={[8, -2, 6]} intensity={22} distance={35} color="#9abf93" />
          <FaceHardware
            display={display}
            activeTab={activeTab}
            onTabChange={onTabChange}
            onPower={onPower}
            powerState={powerState}
            amber={amber}
          />
          <OrbitControls
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            minDistance={13.4}
            maxDistance={26}
            minPolarAngle={Math.PI * 0.29}
            maxPolarAngle={Math.PI * 0.72}
            minAzimuthAngle={-Math.PI * 0.32}
            maxAzimuthAngle={Math.PI * 0.32}
          />
          <ResetCamera token={resetToken} />
        </Canvas>
        </SceneErrorBoundary>
        <div className="three-canvas-corner top-left" aria-hidden="true" />
        <div className="three-canvas-corner top-right" aria-hidden="true" />
        <div className="three-canvas-corner bottom-left" aria-hidden="true" />
        <div className="three-canvas-corner bottom-right" aria-hidden="true" />
      </div>
      <div className="three-stage-toolbar">
        <div className="three-control-hint"><span>↔ DRAG TO ROTATE</span><span>↕ SCROLL TO ZOOM</span><span>● HARDWARE BUTTONS ACTIVE</span></div>
        <div className="three-stage-actions">
          <button type="button" onClick={() => setResetToken((n) => n + 1)}>RESET CAMERA</button>
          <button type="button" className="three-flat-action" onClick={onFlatView}>FOCUS SCREEN / 2D</button>
        </div>
      </div>
    </main>
  );
}
