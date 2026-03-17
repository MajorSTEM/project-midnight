import React from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import { useSimulationStore } from '../../stores/simulationStore';
import type { FEMADisaster } from '../../types';

// Approximate state centroids for mapping disasters without explicit lat/lng
const STATE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  AL: { lat: 32.806671, lng: -86.791130 },
  AK: { lat: 61.370716, lng: -152.404419 },
  AZ: { lat: 33.729759, lng: -111.431221 },
  AR: { lat: 34.969704, lng: -92.373123 },
  CA: { lat: 36.116203, lng: -119.681564 },
  CO: { lat: 39.059811, lng: -105.311104 },
  CT: { lat: 41.597782, lng: -72.755371 },
  DE: { lat: 39.318523, lng: -75.507141 },
  FL: { lat: 27.766279, lng: -81.686783 },
  GA: { lat: 33.040619, lng: -83.643074 },
  HI: { lat: 21.094318, lng: -157.498337 },
  ID: { lat: 44.240459, lng: -114.478828 },
  IL: { lat: 40.349457, lng: -88.986137 },
  IN: { lat: 39.849426, lng: -86.258278 },
  IA: { lat: 42.011539, lng: -93.210526 },
  KS: { lat: 38.526600, lng: -96.726486 },
  KY: { lat: 37.668140, lng: -84.670067 },
  LA: { lat: 31.169960, lng: -91.867805 },
  ME: { lat: 44.693947, lng: -69.381927 },
  MD: { lat: 39.063946, lng: -76.802101 },
  MA: { lat: 42.230171, lng: -71.530106 },
  MI: { lat: 43.326618, lng: -84.536095 },
  MN: { lat: 45.694454, lng: -93.900192 },
  MS: { lat: 32.741646, lng: -89.678696 },
  MO: { lat: 38.456085, lng: -92.288368 },
  MT: { lat: 46.921925, lng: -110.454353 },
  NE: { lat: 41.125370, lng: -98.268082 },
  NV: { lat: 38.313515, lng: -117.055374 },
  NH: { lat: 43.452492, lng: -71.563896 },
  NJ: { lat: 40.298904, lng: -74.521011 },
  NM: { lat: 34.840515, lng: -106.248482 },
  NY: { lat: 42.165726, lng: -74.948051 },
  NC: { lat: 35.630066, lng: -79.806419 },
  ND: { lat: 47.528912, lng: -99.784012 },
  OH: { lat: 40.388783, lng: -82.764915 },
  OK: { lat: 35.565342, lng: -96.928917 },
  OR: { lat: 44.572021, lng: -122.070938 },
  PA: { lat: 40.590752, lng: -77.209755 },
  RI: { lat: 41.680893, lng: -71.511780 },
  SC: { lat: 33.856892, lng: -80.945007 },
  SD: { lat: 44.299782, lng: -99.438828 },
  TN: { lat: 35.747845, lng: -86.692345 },
  TX: { lat: 31.054487, lng: -97.563461 },
  UT: { lat: 40.150032, lng: -111.862434 },
  VT: { lat: 44.045876, lng: -72.710686 },
  VA: { lat: 37.769337, lng: -78.169968 },
  WA: { lat: 47.400902, lng: -121.490494 },
  WV: { lat: 38.491226, lng: -80.954453 },
  WI: { lat: 44.268543, lng: -89.616508 },
  WY: { lat: 42.755966, lng: -107.302490 },
};

function disasterColor(incidentType: string): string {
  const type = (incidentType || '').toLowerCase();
  if (type.includes('nuclear') || type.includes('radiolog')) return '#ff4444';
  if (type.includes('hurricane') || type.includes('flood') || type.includes('typhoon')) return '#4499ff';
  if (type.includes('fire') || type.includes('wildfire')) return '#ff8800';
  return '#888888';
}

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString?.split('T')[0] ?? '';
  }
}

export const FEMADisasterLayer: React.FC = () => {
  const { femaDisasters, showFEMALayer } = useSimulationStore();

  if (!showFEMALayer || !femaDisasters || femaDisasters.length === 0) return null;

  return (
    <>
      {femaDisasters.map((disaster: FEMADisaster, i: number) => {
        // Use explicit coordinates if available, otherwise fall back to state centroid
        let lat = disaster.lat;
        let lng = disaster.lng;

        if (!lat || !lng) {
          const centroid = STATE_CENTROIDS[disaster.state];
          if (!centroid) return null;
          // Add small jitter so markers don't perfectly overlap
          lat = centroid.lat + (Math.sin(disaster.disasterNumber * 7.3) * 0.5);
          lng = centroid.lng + (Math.cos(disaster.disasterNumber * 3.7) * 0.5);
        }

        const color = disasterColor(disaster.incidentType);

        return (
          <CircleMarker
            key={`fema-${disaster.disasterNumber}-${i}`}
            center={[lat, lng]}
            radius={8}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.55,
              weight: 1.5,
              opacity: 0.85,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', maxWidth: '220px' }}>
                <div style={{ color, fontWeight: 'bold', marginBottom: '2px' }}>
                  {disaster.incidentType}
                </div>
                <div style={{ color: '#e6edf3' }}>
                  {disaster.declarationTitle}
                </div>
                <div style={{ color: '#8b949e', marginTop: '2px' }}>
                  {disaster.designatedArea}, {disaster.state} · {formatDate(disaster.declarationDate)}
                </div>
                <div style={{ color: '#8b949e', fontSize: '10px' }}>
                  FEMA-{disaster.disasterNumber}
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
};
