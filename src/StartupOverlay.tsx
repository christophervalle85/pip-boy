import { ChevronRight, Cpu } from 'lucide-react';
import { BOOT_CHECKS } from './BootScreen';

export default function StartupOverlay({ step, onSkip }: { step: number; onSkip: () => void }) {
  const pct = Math.min(100, Math.round((step / BOOT_CHECKS.length) * 100));
  return (
    <div className="device-intro" aria-label="Pip-Boy startup animation">
      <div className="device-intro-vignette" aria-hidden="true" />
      <div className="device-intro-identity" aria-hidden="true">
        <small>VAULT-TEC FIELD SYSTEMS · PERSONAL INFORMATION PROCESSOR</small>
        <strong>PIP-BOY <span>3000</span></strong>
        <span className="device-intro-underline" />
        <p><Cpu size={14} /> {step >= BOOT_CHECKS.length ? 'LINK ESTABLISHED' : 'INITIALIZING HARDWARE'}</p>
        <div className="device-intro-progress"><span style={{ width: pct + '%' }} /></div>
        <span className="device-intro-percent">{pct}%</span>
      </div>
      <button type="button" className="device-intro-skip" onClick={onSkip}>
        SKIP INTRO <ChevronRight size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
