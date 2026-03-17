import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle2, XCircle, Navigation, MapPin } from 'lucide-react';
import { AddressLookup } from '../Controls/AddressLookup';
import { useSimulationStore } from '../../stores/simulationStore';
import { haversineDistance } from '../../utils/nuclearPhysics';
import type { UserLocation, FEMADisaster } from '../../types';

// Approximate US state from lat/lng
function latLngToState(lat: number, lng: number): string {
  if (lat >= 24 && lat <= 31 && lng >= -88 && lng <= -80) return 'FL';
  if (lat >= 26 && lat <= 36 && lng >= -107 && lng <= -93) return 'TX';
  if (lat >= 36 && lat <= 41 && lng >= -85 && lng <= -75) return 'VA';
  if (lat >= 38 && lat <= 43 && lng >= -80 && lng <= -71) return 'PA';
  if (lat >= 40 && lat <= 45 && lng >= -79 && lng <= -71) return 'NY';
  if (lat >= 32 && lat <= 42 && lng >= -124 && lng <= -114) return 'CA';
  if (lat >= 42 && lat <= 49 && lng >= -124 && lng <= -116) return 'WA';
  if (lat >= 37 && lat <= 41 && lng >= -109 && lng <= -102) return 'CO';
  if (lat >= 32 && lat <= 35 && lng >= -107 && lng <= -103) return 'NM';
  if (lat >= 31 && lat <= 37 && lng >= -115 && lng <= -109) return 'AZ';
  if (lat >= 42 && lat <= 47 && lng >= -83 && lng <= -82) return 'MI';
  if (lat >= 41 && lat <= 43 && lng >= -88 && lng <= -84) return 'IN';
  if (lat >= 41 && lat <= 43 && lng >= -91 && lng <= -87) return 'IL';
  if (lat >= 36 && lat <= 40 && lng >= -92 && lng <= -88) return 'MO';
  if (lat >= 30 && lat <= 33 && lng >= -94 && lng <= -89) return 'LA';
  if (lat >= 32 && lat <= 35 && lng >= -91 && lng <= -85) return 'AL';
  if (lat >= 30 && lat <= 35 && lng >= -85 && lng <= -81) return 'GA';
  return 'TX';
}

export const SurvivabilityReport: React.FC = () => {
  const { result, userLocation, setUserLocation } = useSimulationStore();
  const [analyzed, setAnalyzed] = useState(false);

  if (!result) return null;

  const handleAddressFound = (lat: number, lng: number, name: string) => {
    const dist = haversineDistance(
      lat, lng,
      result.strikeLocation.lat, result.strikeLocation.lng
    );

    const { effects } = result;

    let zone: UserLocation['zone'] = 'safe';
    let recommendation: UserLocation['recommendation'] = 'safe';

    if (dist <= effects.fireballRadius) {
      zone = 'fireball';
      recommendation = 'evacuate-immediately';
    } else if (dist <= effects.heavyBlastRadius) {
      zone = 'heavy';
      recommendation = 'evacuate-immediately';
    } else if (dist <= effects.moderateBlastRadius) {
      zone = 'moderate';
      recommendation = 'bug-out';
    } else if (dist <= effects.thermalRadius || dist <= effects.lightBlastRadius) {
      zone = dist <= effects.thermalRadius ? 'thermal' : 'light';
      recommendation = 'shelter-in-place';
    } else if (dist <= effects.radiationRadius) {
      zone = 'radiation';
      recommendation = 'shelter-in-place';
    } else if (result.falloutPlume && dist <= result.falloutPlume.lengthKm / 2) {
      zone = 'fallout';
      recommendation = 'shelter-in-place';
    } else {
      zone = 'safe';
      recommendation = 'safe';
    }

    setUserLocation({
      address: name,
      coords: { lat, lng },
      distanceFromStrike: dist,
      zone,
      recommendation,
    });
    setAnalyzed(true);
  };

  const loc = userLocation;

  return (
    <div className="space-y-4 pb-4">
      <div>
        <AddressLookup
          label="YOUR LOCATION"
          placeholder="Enter your address or zip code..."
          onLocationFound={handleAddressFound}
        />
      </div>

      {analyzed && loc && (
        <>
          {/* Zone status */}
          <ZoneStatus location={loc} />

          {/* Recommendation card */}
          <RecommendationCard location={loc} />

          {/* Shelter effectiveness */}
          <ShelterInfo location={loc} />
        </>
      )}

      {/* Regional Risk Context — FEMA disasters */}
      {result && <RegionalRiskContext lat={result.strikeLocation.lat} lng={result.strikeLocation.lng} />}

      {!analyzed && (
        <div className="bg-midnight border border-panel-border rounded p-4 text-center">
          <Shield size={24} className="text-text-muted mx-auto mb-2" />
          <p className="text-xs font-mono text-text-muted">
            Enter your address above to receive a personal survivability assessment based on your distance from the strike point.
          </p>
        </div>
      )}
    </div>
  );
};

const ZoneStatus: React.FC<{ location: UserLocation }> = ({ location }) => {
  const zoneData: Record<NonNullable<UserLocation['zone']>, { label: string; color: string; desc: string }> = {
    fireball: { label: 'FIREBALL ZONE', color: '#ffffff', desc: 'Total vaporization — survival impossible' },
    heavy: { label: 'HEAVY BLAST ZONE', color: '#ff4444', desc: 'Severe structural collapse — very high fatality' },
    moderate: { label: 'MODERATE BLAST ZONE', color: '#ff8800', desc: 'Most buildings collapse — high injury risk' },
    light: { label: 'LIGHT DAMAGE ZONE', color: '#ffdd00', desc: 'Windows shattered, minor structural damage' },
    thermal: { label: 'THERMAL BURN ZONE', color: '#ff6600', desc: '3rd degree burns on exposed skin' },
    radiation: { label: 'RADIATION ZONE', color: '#00ff88', desc: 'Potential lethal dose — shelter critical' },
    fallout: { label: 'FALLOUT ZONE', color: '#b8860b', desc: 'Radioactive particles — stay indoors' },
    safe: { label: 'OUTSIDE BLAST RADIUS', color: '#00ff88', desc: 'No immediate direct blast effects' },
  };

  const data = zoneData[location.zone ?? 'safe'];

  return (
    <div
      className="rounded border p-3"
      style={{ borderColor: data.color + '40', background: data.color + '08' }}
    >
      <div className="flex items-start gap-2 mb-2">
        {location.zone === 'safe' ? (
          <CheckCircle2 size={16} style={{ color: data.color }} className="flex-shrink-0 mt-0.5" />
        ) : location.zone === 'fireball' || location.zone === 'heavy' ? (
          <XCircle size={16} style={{ color: data.color }} className="flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle size={16} style={{ color: data.color }} className="flex-shrink-0 mt-0.5" />
        )}
        <div>
          <div className="text-xs font-mono font-bold" style={{ color: data.color }}>
            {data.label}
          </div>
          <div className="text-[11px] font-mono text-text-muted mt-0.5">{data.desc}</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 pl-6">
        <Navigation size={11} className="text-text-muted" />
        <span className="text-[11px] font-mono text-text-muted">
          {location.distanceFromStrike?.toFixed(1)} km from strike point
        </span>
      </div>

      <div className="mt-1.5 pl-6 text-[10px] font-mono text-text-muted/70 truncate">
        {location.address.split(',').slice(0, 3).join(', ')}
      </div>
    </div>
  );
};

const RecommendationCard: React.FC<{ location: UserLocation }> = ({ location }) => {
  const recommendations: Record<NonNullable<UserLocation['recommendation']>, {
    title: string;
    color: string;
    steps: string[];
    icon: string;
  }> = {
    'evacuate-immediately': {
      title: 'EVACUATE IMMEDIATELY',
      color: '#ff4444',
      icon: '🚨',
      steps: [
        'You are within the lethal blast radius.',
        'Survival is unlikely or impossible.',
        'If somehow warned in advance: evacuate perpendicular to prevailing winds.',
        'Do NOT attempt to shelter in place.',
        'Move away from the epicenter as fast as possible.',
      ],
    },
    'bug-out': {
      title: 'BUG OUT — EVACUATE NOW',
      color: '#ff8800',
      icon: '⚠️',
      steps: [
        'Significant blast damage likely — many structures will collapse.',
        'Evacuate immediately if you receive warning.',
        'Travel perpendicular to wind direction to avoid fallout.',
        'Do not stop within 50 km if surface burst.',
        'Seek underground or reinforced shelter only if evacuation is impossible.',
      ],
    },
    'shelter-in-place': {
      title: 'SHELTER IN PLACE',
      color: '#ffdd00',
      icon: '🏠',
      steps: [
        'Move to the most interior, lowest floor of the building.',
        'Stay away from windows — flying glass is lethal.',
        'Put as many walls between you and the blast as possible.',
        'If outdoors: drop face-down, cover head, behind any solid object.',
        'Stay sheltered for at least 24 hours after attack.',
        'Monitor emergency broadcasts when possible.',
      ],
    },
    'safe': {
      title: 'MONITOR SITUATION',
      color: '#00ff88',
      icon: '✅',
      steps: [
        'You are outside the immediate blast radius.',
        'Watch for fallout plume — stay upwind or evacuate if needed.',
        'Monitor official emergency broadcasts.',
        'Avoid consuming outdoor food/water until cleared.',
        'Prepare 72-hour emergency kit if not already done.',
      ],
    },
  };

  const rec = recommendations[location.recommendation ?? 'safe'];

  return (
    <div>
      <h3 className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
        Recommendation
      </h3>
      <div
        className="rounded border p-3"
        style={{ borderColor: rec.color + '50', background: rec.color + '08' }}
      >
        <div className="text-sm font-mono font-bold mb-2" style={{ color: rec.color }}>
          {rec.icon} {rec.title}
        </div>
        <ul className="space-y-1">
          {rec.steps.map((step, i) => (
            <li key={i} className="flex gap-2 text-xs font-mono text-text-muted">
              <span style={{ color: rec.color }} className="flex-shrink-0">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const RegionalRiskContext: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const { femaDisasters, loadFEMADisasters } = useSimulationStore();
  const state = latLngToState(lat, lng);

  React.useEffect(() => {
    loadFEMADisasters();
  }, [loadFEMADisasters]);

  const regionalDisasters: FEMADisaster[] = React.useMemo(() => {
    if (!femaDisasters) return [];
    return femaDisasters
      .filter((d) => d.state === state)
      .slice(0, 3);
  }, [femaDisasters, state]);

  return (
    <div className="mt-4">
      <h3 className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1">
        <MapPin size={10} />
        Regional Risk Context ({state})
      </h3>
      {femaDisasters === null && (
        <div className="bg-midnight border border-panel-border rounded p-3 text-center">
          <p className="text-xs font-mono text-text-muted animate-pulse">Loading FEMA data...</p>
        </div>
      )}
      {femaDisasters !== null && regionalDisasters.length === 0 && (
        <div className="bg-midnight border border-panel-border rounded p-3 text-center">
          <p className="text-xs font-mono text-text-muted">No recent FEMA declarations for {state}.</p>
        </div>
      )}
      {regionalDisasters.length > 0 && (
        <div className="space-y-1.5">
          {regionalDisasters.map((d, i) => (
            <div
              key={i}
              className="bg-midnight border border-panel-border/50 rounded p-2"
            >
              <div className="flex justify-between items-start gap-1">
                <span className="text-xs font-mono text-text-primary leading-snug">{d.declarationTitle}</span>
                <span
                  className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{
                    color: d.incidentType?.toLowerCase().includes('fire') ? '#ff8800'
                      : d.incidentType?.toLowerCase().includes('flood') || d.incidentType?.toLowerCase().includes('hurricane') ? '#4499ff'
                      : d.incidentType?.toLowerCase().includes('nuclear') ? '#ff4444'
                      : '#888888',
                    borderColor: 'currentColor',
                    border: '1px solid',
                    background: 'transparent',
                  }}
                >
                  {d.incidentType}
                </span>
              </div>
              <p className="text-[10px] font-mono text-text-muted mt-0.5">
                {d.designatedArea} · {d.declarationDate ? new Date(d.declarationDate).toLocaleDateString() : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ShelterInfo: React.FC<{ location: UserLocation }> = ({ location }) => {
  if (location.zone === 'fireball' || location.zone === 'heavy') return null;

  const shelterTypes = [
    {
      name: 'Underground/Basement',
      factor: '× 200',
      effectiveness: 95,
      desc: 'Best protection from radiation and blast overpressure',
      color: '#00ff88',
    },
    {
      name: 'Concrete building (center)',
      factor: '× 40',
      effectiveness: 75,
      desc: 'Multi-story concrete or brick, interior rooms',
      color: '#00cc6a',
    },
    {
      name: 'Brick/masonry home',
      factor: '× 10',
      effectiveness: 55,
      desc: 'Inner rooms, away from windows',
      color: '#ffdd00',
    },
    {
      name: 'Wood-frame home',
      factor: '× 3',
      effectiveness: 35,
      desc: 'Some protection — better than outdoors',
      color: '#ff8800',
    },
    {
      name: 'Vehicle / outdoors',
      factor: '× 1',
      effectiveness: 5,
      desc: 'Minimal protection — only use if evacuation is imminent',
      color: '#ff4444',
    },
  ];

  return (
    <div>
      <h3 className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
        Shelter Effectiveness (Radiation Protection Factor)
      </h3>
      <div className="space-y-1.5">
        {shelterTypes.map((s, i) => (
          <div key={i} className="bg-midnight border border-panel-border/50 rounded p-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-mono" style={{ color: s.color }}>{s.name}</span>
              <span className="text-xs font-mono font-bold" style={{ color: s.color }}>{s.factor}</span>
            </div>
            <div className="w-full bg-panel-light rounded-full h-1 mb-1">
              <div
                className="h-1 rounded-full transition-all duration-500"
                style={{ width: `${s.effectiveness}%`, background: s.color }}
              />
            </div>
            <p className="text-[10px] font-mono text-text-muted">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
