import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, useMapEvents, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { BlastRings } from './BlastRings';
import { FalloutPlume } from './FalloutPlume';
import { FEMADisasterLayer } from './FEMADisasterLayer';
import { FEMAShelterLayer } from './FEMAShelterLayer';
import { MapModeToggle } from './MapModeToggle';
import { CesiumView } from './CesiumView';
import { ZombieMapLayer } from '../Zombie/ZombieMapLayer';
import { AsteroidMapLayer } from '../Asteroid/AsteroidMapLayer';
import { EMPMapLayer } from '../EMP/EMPMapLayer';
import { PandemicMapLayer } from '../Pandemic/PandemicMapLayer';
import { MapStyleSelector, type MapStyle } from './MapStyleSelector';
import { useSimulationStore } from '../../stores/simulationStore';
import { useZombieStore } from '../../stores/zombieStore';
import { useAsteroidStore } from '../../stores/asteroidStore';
import { useEMPStore } from '../../stores/empStore';
import { usePandemicStore } from '../../stores/pandemicStore';
import { useTimelineStore } from '../../stores/timelineStore';

// Fix Leaflet default icon paths for Vite
import L from 'leaflet';
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Click handler component — handles both single and multi-strike modes, and zombie origin
const MapClickHandler: React.FC = () => {
  const {
    setStrikeLocation,
    multiStrikeMode,
    addStrike,
    simulationMode,
  } = useSimulationStore();
  const { setOrigin: setZombieOrigin } = useZombieStore();
  const { setImpactLocation } = useAsteroidStore();
  const { setBurstLocation } = useEMPStore();
  const { setOrigin: setPandemicOrigin } = usePandemicStore();

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (simulationMode === 'zombie') {
        setZombieOrigin({ lat, lng });
        return;
      }
      if (simulationMode === 'asteroid') {
        setImpactLocation(lat, lng);
        return;
      }
      if (simulationMode === 'emp') {
        setBurstLocation(lat, lng);
        return;
      }
      if (simulationMode === 'pandemic') {
        setPandemicOrigin(lat, lng, `${lat.toFixed(2)}, ${lng.toFixed(2)}`);
        return;
      }
      // Nuclear mode
      if (multiStrikeMode) {
        addStrike({ lat, lng });
      } else {
        setStrikeLocation({ lat, lng });
      }
    },
  });

  return null;
};

// Pan to location component
const MapPanController: React.FC = () => {
  const result = useSimulationStore((s) => s.result);
  const map = useMap();
  const prevLocation = useRef<string>('');

  useEffect(() => {
    if (result?.strikeLocation) {
      const key = `${result.strikeLocation.lat},${result.strikeLocation.lng}`;
      if (key !== prevLocation.current) {
        prevLocation.current = key;
        const radius = result.effects.lightBlastRadius * 1000;
        const center = L.latLng(result.strikeLocation.lat, result.strikeLocation.lng);
        const bounds = center.toBounds(radius * 2.5);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      }
    }
  }, [result, map]);

  return null;
};

// Strike colors for multi-strike mode
const STRIKE_COLORS = [
  '#ff4444', '#ff8800', '#ffcc00', '#44ffff', '#cc44ff',
  '#ff44aa', '#44ff88', '#ff6644', '#4488ff', '#ffff44',
];

const CARTO_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
const ESRI_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
const ESRI_SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

const TILE_LAYERS: Record<Exclude<MapStyle, 'auto'>, { url: string; attribution: string; subdomains?: string; maxZoom?: number }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: CARTO_ATTRIBUTION,
    subdomains: 'abcd',
    maxZoom: 20,
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: CARTO_ATTRIBUTION,
    subdomains: 'abcd',
    maxZoom: 20,
  },
  satellite: {
    url: ESRI_SATELLITE_URL,
    attribution: ESRI_ATTRIBUTION,
    maxZoom: 19,
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
  // FLIR uses satellite base — filter applied via TilePaneFilter
  flir: {
    url: ESRI_SATELLITE_URL,
    attribution: ESRI_ATTRIBUTION,
    maxZoom: 19,
  },
};

// Applies CSS filter to the Leaflet tile pane only — doesn't affect overlays
const TilePaneFilter: React.FC<{ active: boolean }> = ({ active }) => {
  const map = useMap();
  useEffect(() => {
    const tilePane = map.getPane('tilePane');
    if (tilePane) {
      tilePane.style.filter = active
        ? 'grayscale(1) contrast(1.6) brightness(0.85) sepia(0.5) hue-rotate(75deg) saturate(4)'
        : '';
    }
  }, [map, active]);
  return null;
};

const LeafletMap: React.FC<{ simulationMode: string; mapStyle: MapStyle }> = ({ simulationMode, mapStyle }) => {
  const {
    result,
    config,
    showFEMALayer,
    toggleFEMALayer,
    loadFEMADisasters,
    liveWind,
    multiStrikeMode,
    aggregateResult,
    strikes,
    setActiveStrike,
  } = useSimulationStore();

  const timelineProgress = useTimelineStore((s) => s.progress);

  useEffect(() => {
    loadFEMADisasters();
  }, [loadFEMADisasters]);

  // Resolve effective style for 'auto' mode
  const effectiveStyle: Exclude<MapStyle, 'auto'> = useMemo(() => {
    if (mapStyle === 'auto') {
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mapStyle as Exclude<MapStyle, 'auto'>;
  }, [mapStyle]);

  const tileConfig = TILE_LAYERS[effectiveStyle];

  // Scale blast effects for nuclear animation
  const animatedEffects = useMemo(() => {
    if (!result || simulationMode !== 'nuclear') return result?.effects ?? null;
    const p = timelineProgress;
    // fireball: grows in first 15% of timeline
    const fireScale = Math.min(1, p / 0.15);
    // blast rings: grow from 15% to 60%
    const blastScale = p < 0.15 ? 0 : Math.min(1, (p - 0.15) / 0.45);
    // thermal: grows from 10% to 50%
    const thermalScale = p < 0.10 ? 0 : Math.min(1, (p - 0.10) / 0.40);

    return {
      ...result.effects,
      fireballRadius: result.effects.fireballRadius * fireScale,
      fireballAreaKm2: result.effects.fireballAreaKm2 * fireScale * fireScale,
      heavyBlastRadius: result.effects.heavyBlastRadius * blastScale,
      heavyBlastAreaKm2: result.effects.heavyBlastAreaKm2 * blastScale * blastScale,
      moderateBlastRadius: result.effects.moderateBlastRadius * blastScale,
      moderateBlastAreaKm2: result.effects.moderateBlastAreaKm2 * blastScale * blastScale,
      lightBlastRadius: result.effects.lightBlastRadius * blastScale,
      lightBlastAreaKm2: result.effects.lightBlastAreaKm2 * blastScale * blastScale,
      radiationRadius: result.effects.radiationRadius * blastScale,
      thermalRadius: result.effects.thermalRadius * thermalScale,
      thermalAreaKm2: result.effects.thermalAreaKm2 * thermalScale * thermalScale,
    };
  }, [result, simulationMode, timelineProgress]);

  // Fallout only shows after 65% progress for nuclear
  const showFallout = simulationMode !== 'nuclear' || timelineProgress > 0.65;

  return (
    <>
      <MapContainer
        center={[38.9, -77.0]}
        zoom={8}
        style={{ height: '100%', width: '100%', background: '#0a0a0f' }}
        zoomControl={true}
      >
        {/* Dynamic tile layer — no key prop so React-Leaflet calls setUrl() in-place (no black screen) */}
        <TileLayer
          url={tileConfig.url}
          attribution={tileConfig.attribution}
          subdomains={tileConfig.subdomains}
          maxZoom={tileConfig.maxZoom ?? 19}
        />

        {/* IR thermal filter applied directly to the Leaflet tile pane */}
        <TilePaneFilter active={effectiveStyle === 'flir'} />

        <MapClickHandler />
        <MapPanController />

        {/* ---- Single strike mode ---- */}
        {!multiStrikeMode && result && simulationMode === 'nuclear' && (
          <>
            <CircleMarker
              center={[result.strikeLocation.lat, result.strikeLocation.lng]}
              radius={18}
              pathOptions={{ color: '#ff4444', fillColor: '#ff4444', fillOpacity: 0.08, weight: 1, opacity: 0.4 }}
            />
            <CircleMarker
              center={[result.strikeLocation.lat, result.strikeLocation.lng]}
              radius={10}
              pathOptions={{ color: '#ff4444', fillColor: '#ff4444', fillOpacity: 0.15, weight: 1.5, opacity: 0.7 }}
            />
            <CircleMarker
              center={[result.strikeLocation.lat, result.strikeLocation.lng]}
              radius={5}
              pathOptions={{ color: '#ffffff', fillColor: '#ff4444', fillOpacity: 1, weight: 2, opacity: 1 }}
            >
              <Tooltip permanent direction="top" offset={[0, -8]}>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#ff4444' }}>
                  ☢ STRIKE POINT
                </span>
              </Tooltip>
            </CircleMarker>
            {animatedEffects && (
              <BlastRings center={result.strikeLocation} effects={animatedEffects} />
            )}
            {showFallout && result.falloutPlume && <FalloutPlume plume={result.falloutPlume} />}
          </>
        )}

        {/* Pending location */}
        {!multiStrikeMode && config.location && !result && simulationMode === 'nuclear' && (
          <CircleMarker
            center={[config.location.lat, config.location.lng]}
            radius={6}
            pathOptions={{ color: '#00ff88', fillColor: '#00ff88', fillOpacity: 0.5, weight: 2 }}
          />
        )}

        {/* ---- Multi-strike mode ---- */}
        {multiStrikeMode && aggregateResult?.strikes && strikes.map((strike, idx) => {
          const strikeResult = aggregateResult.strikes[idx];
          const color = STRIKE_COLORS[idx % STRIKE_COLORS.length];
          if (!strike.location || !strikeResult) return null;
          return (
            <React.Fragment key={strike.id}>
              {/* Blast rings */}
              <BlastRings center={strike.location} effects={strikeResult.effects} color={color} />
              {/* Fallout plume */}
              {strikeResult.falloutPlume && <FalloutPlume plume={strikeResult.falloutPlume} />}
              {/* Strike marker */}
              <CircleMarker
                center={[strike.location.lat, strike.location.lng]}
                radius={8}
                pathOptions={{ color: '#ffffff', fillColor: color, fillOpacity: 1, weight: 2 }}
                eventHandlers={{ click: () => setActiveStrike(strike.id) }}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', color }}>
                    ☢ Strike #{idx + 1} · {strike.yieldKt}kt
                  </span>
                </Tooltip>
              </CircleMarker>
            </React.Fragment>
          );
        })}

        {/* Zombie overlay */}
        {simulationMode === 'zombie' && <ZombieMapLayer />}

        {/* Asteroid overlay */}
        {simulationMode === 'asteroid' && <AsteroidMapLayer />}

        {/* EMP overlay */}
        {simulationMode === 'emp' && <EMPMapLayer />}

        {/* Pandemic overlay */}
        {simulationMode === 'pandemic' && <PandemicMapLayer />}

        {/* FEMA Disaster overlay */}
        <FEMADisasterLayer />

        {/* FEMA Shelter overlay */}
        <FEMAShelterLayer />
      </MapContainer>

      {/* FEMA layer toggle button */}
      <div className="absolute bottom-8 right-4 z-[500] flex flex-col gap-2">
        <button
          onClick={toggleFEMALayer}
          className={`
            px-3 py-1.5 rounded border text-xs font-mono font-bold uppercase tracking-wide transition-colors
            ${showFEMALayer
              ? 'bg-blue-900/40 border-blue-500/60 text-blue-400'
              : 'bg-panel/90 border-panel-border text-text-muted hover:border-blue-500/40 hover:text-blue-400'
            }
            backdrop-blur-sm
          `}
        >
          {showFEMALayer ? '● ' : '○ '}FEMA
        </button>
      </div>

      {/* Live NOAA wind badge */}
      {liveWind && liveWind.source === 'noaa' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
          <div className="bg-panel/90 border border-terminal/40 rounded-lg px-3 py-1.5 text-terminal font-mono text-xs backdrop-blur-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-terminal animate-pulse inline-block" />
            LIVE NOAA · {liveWind.directionDeg}° · {liveWind.speedKmh} km/h
          </div>
        </div>
      )}

      {/* Click instruction overlay */}
      {simulationMode === 'nuclear' && !result && !multiStrikeMode && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
          <div className="bg-panel/90 border border-terminal/30 rounded-lg px-4 py-2 text-terminal font-mono text-xs backdrop-blur-sm text-center">
            <span className="animate-pulse">▶</span>
            {' '}Click anywhere on the map to place a nuclear strike
          </div>
        </div>
      )}
      {simulationMode === 'nuclear' && multiStrikeMode && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
          <div className="bg-panel/90 border border-terminal/30 rounded-lg px-4 py-2 text-terminal font-mono text-xs backdrop-blur-sm text-center">
            <span className="animate-pulse">▶</span>
            {' '}MULTI-STRIKE MODE — Click map to add strikes
          </div>
        </div>
      )}
      {simulationMode === 'zombie' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
          <div className="bg-panel/90 border border-green-400/30 rounded-lg px-4 py-2 font-mono text-xs backdrop-blur-sm text-center" style={{ color: '#44ff44' }}>
            <span className="animate-pulse">▶</span>
            {' '}ZOMBIE MODE — Click map to set outbreak origin
          </div>
        </div>
      )}
      {simulationMode === 'asteroid' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
          <div className="bg-panel/90 border border-orange-400/30 rounded-lg px-4 py-2 font-mono text-xs backdrop-blur-sm text-center text-orange-400">
            <span className="animate-pulse">▶</span>
            {' '}ASTEROID MODE — Click map to set impact target
          </div>
        </div>
      )}
      {simulationMode === 'emp' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
          <div className="bg-panel/90 border border-yellow-400/30 rounded-lg px-4 py-2 font-mono text-xs backdrop-blur-sm text-center text-yellow-400">
            <span className="animate-pulse">▶</span>
            {' '}EMP MODE — Click map to set burst position
          </div>
        </div>
      )}
      {simulationMode === 'pandemic' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
          <div className="bg-panel/90 border border-purple-400/30 rounded-lg px-4 py-2 font-mono text-xs backdrop-blur-sm text-center text-purple-400">
            <span className="animate-pulse">▶</span>
            {' '}PANDEMIC MODE — Click map to set Patient Zero origin
          </div>
        </div>
      )}
    </>
  );
};

export const SimulationMap: React.FC = () => {
  const { simulationMode } = useSimulationStore();
  const [mapMode, setMapMode] = useState<'2d' | '3d'>('2d');
  const [mapStyle, setMapStyle] = useState<MapStyle>('dark');
  const [cesiumToken, setCesiumToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cesium_ion_token');
    }
    return null;
  });

  const handleTokenSave = useCallback((token: string) => {
    localStorage.setItem('cesium_ion_token', token);
    setCesiumToken(token);
  }, []);

  return (
    <div className="absolute inset-0 top-14" style={{ zIndex: 1 }}>
      {/* Map mode toggle — top right */}
      <div className="absolute top-3 right-3 z-[500]">
        <MapModeToggle mode={mapMode} onModeChange={setMapMode} />
      </div>

      {/* Map style selector — bottom left */}
      {mapMode === '2d' && (
        <div className="absolute bottom-16 left-3 z-[500]">
          <MapStyleSelector mapStyle={mapStyle} setMapStyle={setMapStyle} />
        </div>
      )}

      {mapMode === '2d' ? (
        <LeafletMap simulationMode={simulationMode} mapStyle={mapStyle} />
      ) : (
        <CesiumView ionToken={cesiumToken} onTokenSave={handleTokenSave} />
      )}
    </div>
  );
};
