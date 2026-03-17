import React from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import type { FalloutPlume as FalloutPlumeType } from '../../types';

interface FalloutPlumeProps {
  plume: FalloutPlumeType;
}

export const FalloutPlume: React.FC<FalloutPlumeProps> = ({ plume }) => {
  if (!plume.points || plume.points.length < 3) return null;

  const positions: [number, number][] = plume.points.map((p) => [p.lat, p.lng]);

  return (
    <Polygon
      positions={positions}
      pathOptions={{
        color: '#b8860b',
        fillColor: '#ffcc00',
        fillOpacity: 0.18,
        weight: 1.5,
        opacity: 0.6,
        dashArray: '6 4',
      }}
    >
      <Tooltip sticky>
        <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          <strong>☢ Radioactive Fallout Plume</strong>
          <br />
          Length: ~{plume.lengthKm.toFixed(0)} km downwind
          <br />
          Max width: ~{plume.widthKm.toFixed(0)} km
          <br />
          <span style={{ color: '#ff8800' }}>Surface burst only</span>
          <br />
          <em>Simplified Gaussian model</em>
        </div>
      </Tooltip>
    </Polygon>
  );
};
