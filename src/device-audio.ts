import { useCallback, useEffect, useRef } from 'react';

export type DeviceSound = 'press' | 'dial' | 'power' | 'select' | 'boot' | 'static';

/** Tiny original Web Audio sound effects. No asset files, autoplay or new dependencies. */
export function useDeviceAudio(enabled: boolean) {
  const context = useRef<AudioContext | null>(null);
  const isEnabled = useRef(enabled);
  useEffect(() => { isEnabled.current = enabled; }, [enabled]);

  useEffect(() => () => {
    const active = context.current;
    context.current = null;
    if (active) void active.close();
  }, []);

  return useCallback((kind: DeviceSound) => {
    // Only call this from the user's physical interaction (or a subsequent
    // explicit reboot after audio was opted in). Never auto-play on load.
    if (!isEnabled.current) return;
    try {
      let ctx = context.current;
      if (!ctx) {
        ctx = new AudioContext();
        context.current = ctx;
      }
      if (ctx.state === 'suspended') void ctx.resume();
      const at = ctx.currentTime;
      const duration = kind === 'boot' ? .46 : kind === 'power' ? .28 : kind === 'static' ? .22 : .08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const output = ctx.createBiquadFilter();
      output.type = 'lowpass';
      output.frequency.value = kind === 'static' ? 1700 : 2600;
      osc.type = kind === 'dial' || kind === 'static' ? 'sawtooth' : 'triangle';
      const startFreq: Record<DeviceSound, number> = {
        press: 230, dial: 410, power: 175, select: 580, boot: 165, static: 1380,
      };
      const f = startFreq[kind];
      osc.frequency.setValueAtTime(f, at);
      osc.frequency.exponentialRampToValueAtTime(
        kind === 'boot' ? 710 : kind === 'power' ? 80 : kind === 'static' ? 280 : f * 0.72,
        at + duration,
      );
      gain.gain.setValueAtTime(.0001, at);
      gain.gain.exponentialRampToValueAtTime(kind === 'static' ? .022 : .032, at + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
      osc.connect(output);
      output.connect(gain);
      gain.connect(ctx.destination);
      osc.start(at);
      osc.stop(at + duration + .015);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); output.disconnect(); };
    } catch {
      // Unsupported/blocked Web Audio must never interrupt the actual UI.
    }
  }, []);
}
