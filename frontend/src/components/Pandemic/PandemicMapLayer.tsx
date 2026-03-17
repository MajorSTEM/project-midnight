import React, { useMemo } from 'react';
import { Circle, CircleMarker, Tooltip } from 'react-leaflet';
import { usePandemicStore } from '../../stores/pandemicStore';
import { PATHOGEN_PRESETS } from '../../utils/pandemicEngine';

export const PandemicMapLayer: React.FC = () => {
  const { config, currentState, simulation, selectedPathogenId } = usePandemicStore();

  const pathogen = useMemo(
    () => PATHOGEN_PRESETS.find((p) => p.id === selectedPathogenId),
    [selectedPathogenId]
  );

  if (!currentState || !simulation) return null;

  const origin: [number, number] = [config.originLat, config.originLng];
  const spreadMeters = currentState.spreadRadiusKm * 1000;

  const totalPop =
    currentState.susceptible +
    currentState.exposed +
    currentState.infected +
    currentState.recovered +
    currentState.dead;

  const infectedFrac = totalPop > 0 ? currentState.infected / totalPop : 0;
  const exposedFrac = totalPop > 0 ? currentState.exposed / totalPop : 0;

  const innerRadius = Math.max(500, spreadMeters * 0.15);
  const midRadius = Math.max(1500, spreadMeters * 0.4);
  const outerRadius = Math.max(3000, spreadMeters);

  // Use pathogen color, fall back to pink
  const pathogenColor = pathogen?.color ?? '#ff66aa';

  return (
    <>
      {/* Outer spread zone (exposed / travel range) */}
      <Circle
        center={origin}
        radius={outerRadius}
        pathOptions={{
          color: '#ffcc00',
          fillColor: '#ffcc00',
          fillOpacity: 0.02 + exposedFrac * 0.04,
          weight: 1,
          opacity: 0.3,
          dashArray: '4 8',
        }}
      />

      {/* Middle exposed ring */}
      <Circle
        center={origin}
        radius={midRadius}
        pathOptions={{
          color: '#ff8800',
          fillColor: '#ff8800',
          fillOpacity: 0.03 + exposedFrac * 0.08,
          weight: 1.5,
          opacity: 0.5,
        }}
      />

      {/* Inner active infection zone */}
      <Circle
        center={origin}
        radius={innerRadius}
        pathOptions={{
          color: pathogenColor,
          fillColor: pathogenColor,
          fillOpacity: 0.06 + infectedFrac * 0.14,
          weight: 2,
          opacity: 0.7,
        }}
      />

      {/* Origin marker */}
      <CircleMarker
        center={origin}
        radius={8}
        pathOptions={{
          color: pathogenColor,
          fillColor: pathogenColor,
          fillOpacity: 0.9,
          weight: 2,
        }}
      >
        <Tooltip permanent direction="top" offset={[0, -10]}>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: pathogenColor }}>
            {config.originName} · Day {currentState.day}
          </span>
        </Tooltip>
      </CircleMarker>
    </>
  );
};
