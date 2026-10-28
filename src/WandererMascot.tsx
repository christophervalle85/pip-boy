import { useEffect, useState } from 'react';
import './wanderer-mascot.css';

type Props = { hp: number; maxHp: number; rads: number };
type Pose = 'healthy' | 'salute' | 'injured' | 'critical' | 'irradiated' | 'offline';

const descriptions: Record<Pose, string> = {
  healthy: 'Cheerful wasteland explorer giving a thumbs-up',
  salute: 'Cheerful wasteland explorer saluting',
  injured: 'Injured wasteland explorer holding a bandaged arm',
  critical: 'Wasteland explorer doubled over in pain',
  irradiated: 'Nauseated wasteland explorer affected by radiation',
  offline: 'Unconscious wasteland explorer lying on the ground',
};

/** Six poses from our approved 1950s-inspired raster character sheet.
 *  We use one optimized 3 × 2 transparent PNG atlas instead of copying
 *  sprites into JSX or redrawing the approved illustration by hand. */
export default function WandererMascot({ hp, maxHp, rads }: Props) {
  const [saluting, setSaluting] = useState(false);
  const [atlasReady, setAtlasReady] = useState<boolean | null>(null);

  useEffect(() => {
    const atlas = new Image();
    atlas.onload = () => setAtlasReady(true);
    atlas.onerror = () => setAtlasReady(false);
    atlas.src = '/art/pipboy-stat-sprites.png';
    return () => { atlas.onload = null; atlas.onerror = null; };
  }, []);

  const health = maxHp > 0 ? hp / maxHp : 0;

  const condition: Exclude<Pose, 'salute'> =
    hp <= 0 ? 'offline' :
    health <= 0.25 ? 'critical' :
    health <= 0.50 ? 'injured' :
    rads >= 400 ? 'irradiated' : 'healthy';
  const pose: Pose = condition === 'healthy' && saluting ? 'salute' : condition;
  const canSalute = condition === 'healthy';

  useEffect(() => {
    if (!canSalute) setSaluting(false);
  }, [canSalute]);

  const diagnosis =
    condition === 'offline' ? 'NO VITAL SIGNAL' :
    condition === 'critical' ? 'CRITICAL CONDITION' :
    condition === 'injured' ? 'MEDICAL ATTENTION ADVISED' :
    condition === 'irradiated' ? 'RADIATION DETECTED' :
    saluting ? 'STAY SHARP, WANDERER!' :
    'ALL VITAL SIGNS NOMINAL';

  return (
    <button
      type="button"
      className={'wanderer-portrait' + (canSalute ? ' is-interactive' : '')}
      data-condition={condition}
      onClick={() => { if (canSalute) setSaluting((old) => !old); }}
      aria-label={canSalute ? (saluting ? 'Lower the explorer’s salute' : 'Make the explorer salute') : descriptions[pose]}
      aria-pressed={canSalute ? saluting : undefined}
      title={canSalute ? 'Click to salute' : diagnosis}
      disabled={!canSalute}
    >
      <span className="wanderer-sprite-frame">
        {atlasReady === true ? (
          <span
            key={pose}
            className={'wanderer-sprite wanderer-sprite--' + pose}
            role="img"
            aria-label={descriptions[pose]}
          />
        ) : (
          <span className="wanderer-asset-status" role="status">
            {atlasReady === false ? 'SPRITE ARTWORK NOT INSTALLED' : 'LOADING CHARACTER…'}
          </span>
        )}
      </span>
      <span className="wanderer-diagnostic">
        <span className="wanderer-diagnostic-dot" aria-hidden="true" />
        {diagnosis}
      </span>
      {canSalute && (
        <span className="wanderer-hint">{saluting ? 'CLICK TO STAND DOWN' : 'CLICK TO SALUTE'}</span>
      )}
    </button>
  );
}
