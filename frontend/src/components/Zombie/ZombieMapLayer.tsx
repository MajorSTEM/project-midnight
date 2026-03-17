import React, { useMemo } from 'react';
import { Circle, CircleMarker, Tooltip } from 'react-leaflet';
import { useZombieStore } from '../../stores/zombieStore';

export const ZombieMapLayer: React.FC = () => {
  const { config, currentState, simulation } = useZombieStore();

  const origin = config.origin;

  const state = useMemo(() => currentState, [currentState]);

  if (!origin || !state || !simulation) return null;

  const spreadMeters = state.spreadRadiusKm * 1000;

  // Sizes of rings based on spread radius
  const innerRadius = Math.max(500, spreadMeters * 0.15);
  const midRadius = Math.max(1500, spreadMeters * 0.4);
  const outerRadius = Math.max(3000, spreadMeters);

  const totalPop = state.susceptible + state.exposed + state.infected + state.recovered + state.dead;
  const infectedFrac = totalPop > 0 ? (state.infected + state.totalZombies) / totalPop : 0;
  const exposedFrac = totalPop > 0 ? state.exposed / totalPop : 0;

  return (
    <>
      {/* Outer susceptible ring */}
      <Circle
        center={[origin.lat, origin.lng]}
        radius={outerRadius}
        pathOptions={{
          color: '#ffff00',
          fillColor: '#ffff00',
          fillOpacity: 0.03 + exposedFrac * 0.05,
          weight: 1,
          opacity: 0.3,
          dashArray: '4 8',
        }}
      />

      {/* Middle exposed ring */}
      <Circle
        center={[origin.lat, origin.lng]}
        radius={midRadius}
        pathOptions={{
          color: '#ff8800',
          fillColor: '#ff8800',
          fillOpacity: 0.04 + exposedFrac * 0.1,
          weight: 1.5,
          opacity: 0.5,
        }}
      />

      {/* Inner infected/zombie zone */}
      <Circle
        center={[origin.lat, origin.lng]}
        radius={innerRadius}
        pathOptions={{
          color: '#ff2222',
          fillColor: '#ff2222',
          fillOpacity: 0.08 + infectedFrac * 0.15,
          weight: 2,
          opacity: 0.7,
        }}
      />

      {/* Origin marker */}
      <CircleMarker
        center={[origin.lat, origin.lng]}
        radius={8}
        pathOptions={{
          color: '#44ff44',
          fillColor: '#44ff44',
          fillOpacity: 0.9,
          weight: 2,
        }}
      >
        <Tooltip permanent direction="top" offset={[0, -10]}>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#44ff44' }}>
            OUTBREAK ORIGIN · Day {state.day}
          </span>
        </Tooltip>
      </CircleMarker>
    </>
  );
};
