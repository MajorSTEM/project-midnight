import React from 'react';
import { Circle, CircleMarker, Tooltip } from 'react-leaflet';
import { useAsteroidStore } from '../../stores/asteroidStore';

export const AsteroidMapLayer: React.FC = () => {
  const { config, result } = useAsteroidStore();

  if (!result) return null;

  const center: [number, number] = [config.targetLat, config.targetLng];

  return (
    <>
      {/* Light blast radius — yellow, low opacity */}
      <Circle
        center={center}
        radius={result.lightBlastRadiusKm * 1000}
        pathOptions={{
          color: '#ffcc00',
          fillColor: '#ffcc00',
          fillOpacity: 0.04,
          weight: 1,
          opacity: 0.4,
          dashArray: '6 6',
        }}
      />

      {/* Ignition radius — blue dashed */}
      <Circle
        center={center}
        radius={result.ignitionRadiusKm * 1000}
        pathOptions={{
          color: '#4488ff',
          fillColor: '#4488ff',
          fillOpacity: 0.03,
          weight: 1,
          opacity: 0.5,
          dashArray: '4 8',
        }}
      />

      {/* Thermal radius — purple/pink */}
      <Circle
        center={center}
        radius={result.thermalRadiusKm * 1000}
        pathOptions={{
          color: '#cc44ff',
          fillColor: '#cc44ff',
          fillOpacity: 0.05,
          weight: 1.5,
          opacity: 0.6,
        }}
      />

      {/* Moderate blast — orange */}
      <Circle
        center={center}
        radius={result.moderateBlastRadiusKm * 1000}
        pathOptions={{
          color: '#ff6600',
          fillColor: '#ff6600',
          fillOpacity: 0.08,
          weight: 2,
          opacity: 0.7,
        }}
      />

      {/* Severe blast — red */}
      <Circle
        center={center}
        radius={result.severeBlastRadiusKm * 1000}
        pathOptions={{
          color: '#ff2222',
          fillColor: '#ff2222',
          fillOpacity: 0.15,
          weight: 2,
          opacity: 0.85,
        }}
      />

      {/* Crater outline (if ground impact) */}
      {result.craterDiameterKm !== null && (
        <Circle
          center={center}
          radius={(result.craterDiameterKm / 2) * 1000}
          pathOptions={{
            color: '#aa6633',
            fillColor: '#aa6633',
            fillOpacity: 0.25,
            weight: 2,
            opacity: 0.9,
            dashArray: '5 5',
          }}
        />
      )}

      {/* Impact point crosshair */}
      <CircleMarker
        center={center}
        radius={8}
        pathOptions={{
          color: '#ff8844',
          fillColor: '#ff8844',
          fillOpacity: 0.9,
          weight: 2,
        }}
      >
        <Tooltip permanent direction="top" offset={[0, -10]}>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#ff8844' }}>
            {result.airburstAltitudeKm !== null
              ? `AIRBURST · ${result.airburstAltitudeKm.toFixed(1)} km`
              : `IMPACT · ${config.targetName}`}
          </span>
        </Tooltip>
      </CircleMarker>
    </>
  );
};
