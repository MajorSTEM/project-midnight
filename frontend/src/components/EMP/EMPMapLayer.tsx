import React from 'react';
import { Circle, CircleMarker, Tooltip } from 'react-leaflet';
import { useEMPStore } from '../../stores/empStore';
import type { EMPCity } from '../../utils/empPhysics';

const INTENSITY_COLOR: Record<EMPCity['e1Intensity'], string> = {
  full: '#ff2222',
  partial: '#ff8800',
  edge: '#ffcc00',
};

export const EMPMapLayer: React.FC = () => {
  const { config, result } = useEMPStore();

  if (!result) return null;

  const center: [number, number] = [result.groundZeroLat, result.groundZeroLng];

  return (
    <>
      {/* E3 — outermost, yellow dashed (power grid) */}
      <Circle
        center={center}
        radius={result.e3RadiusKm * 1000}
        pathOptions={{
          color: '#ffcc00',
          fillColor: '#ffcc00',
          fillOpacity: 0.02,
          weight: 1,
          opacity: 0.4,
          dashArray: '8 8',
        }}
      />

      {/* E2 — orange dashed (lightning-like) */}
      <Circle
        center={center}
        radius={result.e2RadiusKm * 1000}
        pathOptions={{
          color: '#ff8800',
          fillColor: '#ff8800',
          fillOpacity: 0.03,
          weight: 1.5,
          opacity: 0.5,
          dashArray: '5 6',
        }}
      />

      {/* E1 — red, low opacity (destroys electronics) */}
      <Circle
        center={center}
        radius={result.e1RadiusKm * 1000}
        pathOptions={{
          color: '#ff4444',
          fillColor: '#ff2222',
          fillOpacity: 0.05,
          weight: 2,
          opacity: 0.6,
        }}
      />

      {/* Blast radius (if not HEMP) */}
      {result.hasBlastRadius && result.blastRadiusKm > 0 && (
        <Circle
          center={center}
          radius={result.blastRadiusKm * 1000}
          pathOptions={{
            color: '#ff0000',
            fillColor: '#ff0000',
            fillOpacity: 0.2,
            weight: 2,
            opacity: 0.9,
          }}
        />
      )}

      {/* Affected city markers */}
      {result.affectedCities.map((city) => (
        <CircleMarker
          key={city.name}
          center={[city.lat, city.lng]}
          radius={5}
          pathOptions={{
            color: INTENSITY_COLOR[city.e1Intensity],
            fillColor: INTENSITY_COLOR[city.e1Intensity],
            fillOpacity: 0.8,
            weight: 1.5,
          }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>
              <span style={{ color: INTENSITY_COLOR[city.e1Intensity] }}>
                [{city.e1Intensity.toUpperCase()}]
              </span>{' '}
              {city.name} — {city.distanceKm} km
              <br />
              Pop: {city.population >= 1_000_000
                ? `${(city.population / 1_000_000).toFixed(1)}M`
                : `${(city.population / 1000).toFixed(0)}K`}
            </span>
          </Tooltip>
        </CircleMarker>
      ))}

      {/* Burst point */}
      <CircleMarker
        center={center}
        radius={8}
        pathOptions={{
          color: '#ffcc00',
          fillColor: '#ffcc00',
          fillOpacity: 0.9,
          weight: 2,
        }}
      >
        <Tooltip permanent direction="top" offset={[0, -10]}>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#ffcc00' }}>
            EMP BURST · {config.altitudeKm} km altitude
          </span>
        </Tooltip>
      </CircleMarker>
    </>
  );
};
