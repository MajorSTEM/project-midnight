import React from 'react';
import { Circle, Tooltip } from 'react-leaflet';
import type { BlastEffects } from '../../types';
import type { LatLng } from '../../types';
import { formatDistance, formatArea } from '../../utils/nuclearPhysics';

interface BlastRingsProps {
  center: LatLng;
  effects: BlastEffects;
  /** Optional color override for multi-strike mode */
  color?: string;
}

interface RingConfig {
  radius: number;
  area: number;
  color: string;
  fillColor: string;
  fillOpacity: number;
  weight: number;
  label: string;
  description: string;
}

export const BlastRings: React.FC<BlastRingsProps> = ({ center, effects, color }) => {
  // When a custom color is provided (multi-strike mode), tint the fireball and heavy blast rings
  const customFireball = color ?? '#ffffff';
  const customHeavy = color ?? '#ff4444';
  const rings: RingConfig[] = [
    {
      radius: effects.lightBlastRadius * 1000,
      area: effects.lightBlastAreaKm2,
      color: '#ffdd00',
      fillColor: '#ffdd00',
      fillOpacity: 0.04,
      weight: 1.5,
      label: '1 psi Light Damage',
      description: `Window shattering, minor structural damage\n${formatDistance(effects.lightBlastRadius)} radius / ${formatArea(effects.lightBlastAreaKm2 + Math.PI * effects.moderateBlastRadius ** 2)} total area`,
    },
    {
      radius: effects.thermalRadius * 1000,
      area: effects.thermalAreaKm2,
      color: '#ff6600',
      fillColor: '#ff6600',
      fillOpacity: 0.05,
      weight: 1.5,
      label: 'Thermal 3rd Degree Burns',
      description: `10 cal/cm² — 3rd degree burns on exposed skin\n${formatDistance(effects.thermalRadius)} radius`,
    },
    {
      radius: effects.moderateBlastRadius * 1000,
      area: effects.moderateBlastAreaKm2,
      color: '#ff8800',
      fillColor: '#ff8800',
      fillOpacity: 0.08,
      weight: 2,
      label: '5 psi Moderate Damage',
      description: `Most residential buildings collapse\n${formatDistance(effects.moderateBlastRadius)} radius`,
    },
    {
      radius: effects.heavyBlastRadius * 1000,
      area: effects.heavyBlastAreaKm2,
      color: customHeavy,
      fillColor: customHeavy,
      fillOpacity: 0.15,
      weight: 2,
      label: '20 psi Heavy Blast',
      description: `Reinforced concrete destroyed, near-total destruction\n${formatDistance(effects.heavyBlastRadius)} radius`,
    },
    {
      radius: effects.radiationRadius * 1000,
      area: Math.PI * effects.radiationRadius ** 2,
      color: '#00ff88',
      fillColor: '#00ff88',
      fillOpacity: 0.12,
      weight: 1.5,
      label: 'Lethal Radiation (500 rem)',
      description: `Prompt ionizing radiation — lethal dose\n${formatDistance(effects.radiationRadius)} radius`,
    },
    {
      radius: effects.fireballRadius * 1000,
      area: effects.fireballAreaKm2,
      color: customFireball,
      fillColor: customFireball,
      fillOpacity: 0.6,
      weight: 2,
      label: 'Fireball',
      description: `Superheated plasma — total vaporization\n${formatDistance(effects.fireballRadius)} radius`,
    },
  ];

  const centerPos: [number, number] = [center.lat, center.lng];

  return (
    <>
      {rings.map((ring, idx) => (
        <Circle
          key={idx}
          center={centerPos}
          radius={ring.radius}
          pathOptions={{
            color: ring.color,
            fillColor: ring.fillColor,
            fillOpacity: ring.fillOpacity,
            weight: ring.weight,
            opacity: 0.85,
          }}
        >
          <Tooltip sticky>
            <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
              <strong>{ring.label}</strong>
              <br />
              {ring.description.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < ring.description.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </Tooltip>
        </Circle>
      ))}
    </>
  );
};
