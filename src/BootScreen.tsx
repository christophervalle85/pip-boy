import { ChevronRight, Cpu, Zap } from 'lucide-react';

export const BOOT_CHECKS = [
  ['PROCESSOR / MEMORY', '4096K OK'],
  ['PHOSPHOR DISPLAY', 'CALIBRATED'],
  ['LOCAL DATA BANK', 'MOUNTED'],
  ['RADIO TRANSCEIVER', 'ONLINE'],
  ['PERSONNEL DATABASE', 'VERIFIED'],
] as const;

export default function BootScreen({ step, onSkip }: { step: number; onSkip: () => void }) {
  const progress = Math.round(100 * step / BOOT_CHECKS.length);
  return (
    <div className="boot-sequence" aria-label="Pip-Boy startup">
      <div className="boot-header"><span>ROBCO INDUSTRIES UNIFIED OPERATING SYSTEM</span><span>RBIOS v1.77</span></div>
      <div className="boot-identity">
        <span className="boot-emblem"><Zap size={31} fill="currentColor" /></span>
        <div><small>PERSONAL INFORMATION PROCESSOR</small><strong>PIP-BOY <em>3000</em></strong><small>MK IV / VAULT-TEC FIELD EDITION</small></div>
      </div>
      <div className="boot-terminal">
        <div className="boot-terminal-heading"><Cpu size={15} /> RUNNING STARTUP DIAGNOSTICS <span className="boot-cursor">_</span></div>
        <div className="boot-log" aria-live="polite">
          {BOOT_CHECKS.slice(0, step).map(([name, result]) => (
            <div className="boot-line" key={name}><span>&gt; {name}</span><span className="boot-dots" aria-hidden="true" /><strong>{result}</strong></div>
          ))}
        </div>
      </div>
      <div className="boot-progress-label"><span>LOADING VAULT-TEC OS</span><span>{progress}%</span></div>
      <div className="boot-progress-track" role="progressbar" aria-label="Startup progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
        <span style={{ width: progress + '%' }} />
      </div>
      <div className="boot-bottom"><span>AUTHORIZED PERSONNEL ONLY · VAULT-TEC PROPERTY</span><button type="button" onClick={onSkip}>SKIP STARTUP <ChevronRight size={14} /></button></div>
    </div>
  );
}
