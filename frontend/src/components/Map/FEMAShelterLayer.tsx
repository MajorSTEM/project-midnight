import React, { useState, useEffect, useRef } from 'react';
import { CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { FEMADisaster } from '../../types';

// Reuse the same state centroid lookup as FEMADisasterLayer
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

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina',
  ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

const API_BASE = 'http://localhost:7001';

const SHELTER_GREEN = '#00ff88';

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

interface ShelterPoint {
  lat: number;
  lng: number;
  name: string;
  state: string;
  incidentType: string;
  declarationDate: string;
  disasterNumber: number;
}

function buildShelterPoints(disasters: FEMADisaster[]): ShelterPoint[] {
  return disasters
    .map((disaster, i) => {
      const centroid = STATE_CENTROIDS[disaster.state];
      if (!centroid) return null;

      // Deterministic jitter so multiple disasters in the same state don't stack
      const lat = centroid.lat + Math.sin(disaster.disasterNumber * 5.1 + i * 1.3) * 0.8;
      const lng = centroid.lng + Math.cos(disaster.disasterNumber * 2.9 + i * 0.7) * 0.8;

      const stateName = STATE_NAMES[disaster.state] ?? disaster.state;

      return {
        lat,
        lng,
        name: `FEMA Emergency Shelter - ${stateName}`,
        state: disaster.state,
        incidentType: disaster.incidentType,
        declarationDate: disaster.declarationDate,
        disasterNumber: disaster.disasterNumber,
      } satisfies ShelterPoint;
    })
    .filter((p): p is ShelterPoint => p !== null);
}

// ToggleButton renders outside the MapContainer via a Leaflet custom control
const SHELTER_ACCENT = SHELTER_GREEN;

const ToggleButton: React.FC<{
  active: boolean;
  loading: boolean;
  onClick: () => void;
}> = ({ active, loading, onClick }) => {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlRef = useRef<L.Control | null>(null);

  useEffect(() => {
    const div = L.DomUtil.create('div');
    containerRef.current = div;

    const ctrl = new L.Control({ position: 'topright' });
    ctrl.onAdd = () => div;
    ctrl.addTo(map);
    controlRef.current = ctrl;

    // Prevent map click/drag from propagating through the button
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);

    return () => {
      ctrl.remove();
    };
  }, [map]);

  // Re-render the button contents whenever props change
  useEffect(() => {
    const div = containerRef.current;
    if (!div) return;

    const bgColor = active ? 'rgba(0,255,136,0.15)' : 'rgba(13,17,23,0.92)';
    const borderColor = active ? 'rgba(0,255,136,0.7)' : 'rgba(0,255,136,0.2)';
    const textColor = active ? SHELTER_ACCENT : '#8b949e';

    div.innerHTML = `
      <button
        id="fema-shelter-toggle"
        style="
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          background: ${bgColor};
          border: 1px solid ${borderColor};
          border-radius: 4px;
          color: ${textColor};
          font-family: monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: ${loading ? 'wait' : 'pointer'};
          backdrop-filter: blur(6px);
          transition: background 0.15s, border-color 0.15s;
          margin-top: 6px;
          white-space: nowrap;
        "
      >
        <span style="
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: ${active ? SHELTER_ACCENT : '#444c56'};
          flex-shrink: 0;
        "></span>
        ${loading ? 'LOADING...' : 'SHELTERS'}
      </button>
    `;

    const btn = div.querySelector('#fema-shelter-toggle');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
      });
    }
  }, [active, loading, onClick]);

  return null;
};

// Info panel rendered via a Leaflet control in the bottom-left area
const InfoPanel: React.FC<{ count: number }> = ({ count }) => {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlRef = useRef<L.Control | null>(null);

  useEffect(() => {
    const div = L.DomUtil.create('div');
    containerRef.current = div;

    const ctrl = new L.Control({ position: 'bottomleft' });
    ctrl.onAdd = () => div;
    ctrl.addTo(map);
    controlRef.current = ctrl;

    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);

    return () => {
      ctrl.remove();
    };
  }, [map]);

  useEffect(() => {
    const div = containerRef.current;
    if (!div) return;

    div.innerHTML = `
      <div style="
        background: rgba(13,17,23,0.92);
        border: 1px solid rgba(0,255,136,0.2);
        border-radius: 6px;
        padding: 7px 12px;
        font-family: monospace;
        font-size: 11px;
        color: #8b949e;
        backdrop-filter: blur(6px);
        margin-bottom: 6px;
        margin-left: 6px;
      ">
        <span style="color: ${SHELTER_ACCENT}; font-weight: 700; letter-spacing: 0.1em;">
          ${count} SHELTER${count !== 1 ? 'S' : ''}
        </span>
        <span style="margin-left: 6px; letter-spacing: 0.06em;">
          Based on active FEMA disaster declarations
        </span>
      </div>
    `;
  }, [count]);

  return null;
};

export const FEMAShelterLayer: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shelters, setShelters] = useState<ShelterPoint[]>([]);
  const fetchedRef = useRef(false);

  const handleToggle = async () => {
    if (!visible && !fetchedRef.current) {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/fema/disasters/recent?top=20`);
        if (!res.ok) throw new Error(`FEMA API returned ${res.status}`);
        const data = await res.json() as { disasters: FEMADisaster[] };
        const disasters: FEMADisaster[] = data.disasters ?? [];
        setShelters(buildShelterPoints(disasters));
        fetchedRef.current = true;
      } catch (err) {
        console.error('[FEMAShelterLayer] fetch error:', err);
        // Fail silently — don't show broken state to user
        setShelters([]);
        fetchedRef.current = true;
      } finally {
        setLoading(false);
      }
    }

    setVisible((v) => !v);
  };

  return (
    <>
      <ToggleButton active={visible} loading={loading} onClick={handleToggle} />

      {visible && shelters.length > 0 && (
        <>
          <InfoPanel count={shelters.length} />

          {shelters.map((shelter) => (
            <CircleMarker
              key={`shelter-${shelter.disasterNumber}-${shelter.state}`}
              center={[shelter.lat, shelter.lng]}
              radius={8}
              pathOptions={{
                color: SHELTER_GREEN,
                fillColor: SHELTER_GREEN,
                fillOpacity: 0.45,
                weight: 1.5,
                opacity: 0.9,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', maxWidth: '230px' }}>
                  <div style={{ color: SHELTER_GREEN, fontWeight: 'bold', marginBottom: '3px', letterSpacing: '0.06em' }}>
                    {shelter.name}
                  </div>
                  <div style={{ color: '#e6edf3', marginBottom: '2px' }}>
                    {shelter.incidentType}
                  </div>
                  <div style={{ color: '#8b949e', fontSize: '10px' }}>
                    Declared: {formatDate(shelter.declarationDate)}
                  </div>
                  <div style={{ color: '#8b949e', fontSize: '10px' }}>
                    FEMA-{shelter.disasterNumber} · {STATE_NAMES[shelter.state] ?? shelter.state}
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </>
      )}
    </>
  );
};
