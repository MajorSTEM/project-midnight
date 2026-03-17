import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { useAsteroidStore } from '../../stores/asteroidStore';
import { useEMPStore } from '../../stores/empStore';
import { usePandemicStore } from '../../stores/pandemicStore';
import { useZombieStore } from '../../stores/zombieStore';

interface Props {
  ionToken: string | null;
  onTokenSave: (token: string) => void;
}

// ── Token entry screen ────────────────────────────────────────────────────────
const TokenPrompt: React.FC<{ onSave: (t: string) => void }> = ({ onSave }) => {
  const [val, setVal] = useState('');
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-midnight/95 z-10">
      <div className="w-[440px] bg-panel border border-panel-border rounded-lg p-6 space-y-4">
        <div className="text-center">
          <p className="text-lg font-mono font-bold text-terminal mb-1">3D CESIUM MODE</p>
          <p className="text-xs font-mono text-text-muted leading-relaxed">
            Enter your free Cesium Ion access token to enable photorealistic 3D globe with
            OSM building models. Zoom in on any city to see full 3D architecture.
          </p>
        </div>
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Paste your Cesium Ion token..."
          className="w-full bg-midnight border border-panel-border rounded px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-terminal/50"
          onKeyDown={(e) => { if (e.key === 'Enter' && val.trim()) onSave(val.trim()); }}
        />
        <button
          onClick={() => { if (val.trim()) onSave(val.trim()); }}
          className="w-full py-2 text-xs font-mono rounded border border-terminal/40 text-terminal hover:bg-terminal/10 transition-colors"
        >
          Enable 3D Globe + OSM Buildings
        </button>
        <div className="text-center space-y-1">
          <p className="text-[10px] font-mono text-text-muted">
            Free token at{' '}
            <a href="https://cesium.com/ion/signup" target="_blank" rel="noopener noreferrer" className="text-terminal underline">
              cesium.com/ion/signup
            </a>
            {' '}— sign up and copy the default token from your dashboard.
          </p>
          <p className="text-[10px] font-mono text-text-muted opacity-60">
            3D buildings use the free OSM Buildings tileset (Cesium ion asset 96188)
          </p>
        </div>
      </div>
    </div>
  );
};

const CesiumError: React.FC<{ msg?: string }> = ({ msg }) => (
  <div className="absolute inset-0 flex items-center justify-center bg-midnight/95 z-10">
    <div className="text-center space-y-3 max-w-sm px-6">
      <p className="text-sm font-mono font-bold text-blast">3D mode unavailable</p>
      <p className="text-xs font-mono text-text-muted leading-relaxed">
        {msg ?? 'CesiumJS failed to initialize.'}
      </p>
      <p className="text-[10px] font-mono text-text-muted opacity-60">
        WebGL is required. Check chrome://flags for WebGL settings, or switch back to 2D mode.
      </p>
    </div>
  </div>
);

// ── Globe component ───────────────────────────────────────────────────────────
const CesiumGlobe: React.FC<{ ionToken: string }> = ({ ionToken }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);

  // Stores
  const simulationMode = useSimulationStore((s) => s.simulationMode);
  const nuclearResult   = useSimulationStore((s) => s.result);
  const setStrikeLocation = useSimulationStore((s) => s.setStrikeLocation);
  const asteroidResult   = useAsteroidStore((s) => s.result);
  const asteroidConfig   = useAsteroidStore((s) => s.config);
  const setImpactLocation = useAsteroidStore((s) => s.setImpactLocation);
  const empResult       = useEMPStore((s) => s.result);
  const setBurstLocation  = useEMPStore((s) => s.setBurstLocation);
  const setZombieOrigin   = useZombieStore((s) => s.setOrigin);
  const setPandemicOrigin = usePandemicStore((s) => s.setOrigin);

  // ── Init viewer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Cesium: any = await import('cesium');
        if (cancelled || !containerRef.current) return;

        Cesium.Ion.defaultAccessToken = ionToken;

        const viewer = new Cesium.Viewer(containerRef.current, {
          baseLayerPicker: false,
          navigationHelpButton: false,
          homeButton: false,
          sceneModePicker: false,
          animation: false,
          timeline: false,
          geocoder: false,
          fullscreenButton: false,
          infoBox: false,
          selectionIndicator: false,
          // Real-time sun position requires a JulianDate clock
          shouldAnimate: false,
          // Use Cesium World Terrain for realistic elevation
          terrainProvider: await Cesium.CesiumTerrainProvider.fromIonAssetId(1),
        });

        viewerRef.current = viewer;

        // ── Real-time sun lighting ─────────────────────────────────────────
        // Set clock to current real-world time so sun is in the correct position
        viewer.clock.currentTime = Cesium.JulianDate.now();
        viewer.clock.shouldAnimate = false;
        viewer.scene.globe.enableLighting = true;
        viewer.scene.globe.nightFadeOutDistance = 20000000;
        viewer.scene.globe.nightFadeInDistance = 10000000;
        // Atmosphere quality
        viewer.scene.skyAtmosphere.show = true;
        viewer.scene.fog.enabled = true;
        viewer.scene.fog.density = 0.00002;

        // ── City lights at night (NASA Black Marble, Cesium ion asset 3812) ─
        try {
          const nightLayer = await Cesium.IonImageryProvider.fromAssetId(3812);
          const nl = viewer.imageryLayers.addImageryProvider(nightLayer);
          nl.alpha = 1.0;
          nl.nightAlpha = 1.0;
          nl.dayAlpha = 0.0;
        } catch (nightErr) {
          console.warn('[CesiumView] Night lights layer unavailable:', nightErr);
        }

        // ── OSM 3D Buildings (ion asset 96188) ────────────────────────────
        try {
          const osmBuildings = await Cesium.createOsmBuildingsAsync();
          if (!cancelled) viewer.scene.primitives.add(osmBuildings);
        } catch (buildingErr) {
          console.warn('[CesiumView] OSM buildings unavailable:', buildingErr);
        }

        // ── Click handler ─────────────────────────────────────────────────
        viewer.screenSpaceEventHandler.setInputAction(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (event: any) => {
            const cartesian = viewer.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid);
            if (!cartesian) return;
            const carto = Cesium.Cartographic.fromCartesian(cartesian);
            const lat = Cesium.Math.toDegrees(carto.latitude);
            const lng = Cesium.Math.toDegrees(carto.longitude);
            const currentMode = useSimulationStore.getState().simulationMode;
            if (currentMode === 'nuclear') {
              setStrikeLocation({ lat, lng });
            } else if (currentMode === 'asteroid') {
              setImpactLocation(lat, lng);
            } else if (currentMode === 'emp') {
              setBurstLocation(lat, lng);
            } else if (currentMode === 'zombie') {
              setZombieOrigin({ lat, lng });
            } else if (currentMode === 'pandemic') {
              setPandemicOrigin(lat, lng, `${lat.toFixed(2)}, ${lng.toFixed(2)}`);
            }
          },
          Cesium.ScreenSpaceEventType.LEFT_CLICK,
        );

        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) {
          console.error('[CesiumView] Init error:', err);
          setError('WebGL initialization failed. Your browser may not support WebGL2 or it may be disabled.');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (viewerRef.current) {
        try { viewerRef.current.destroy(); } catch { /* ignore */ }
        viewerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ionToken]);

  // ── Update nuclear entities ────────────────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || simulationMode !== 'nuclear') return;

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Cesium: any = await import('cesium');
        viewer.entities.removeAll();
        if (!nuclearResult?.strikeLocation) return;

        const { lat, lng } = nuclearResult.strikeLocation;
        const { effects } = nuclearResult;
        const strikePos = Cesium.Cartesian3.fromDegrees(lng, lat, 0);
        const blastR = effects.lightBlastRadius * 1000;
        const heavyR = effects.heavyBlastRadius * 1000;
        const fireR  = effects.fireballRadius * 1000;

        viewer.entities.add({
          position: strikePos,
          ellipsoid: {
            radii: new Cesium.Cartesian3(fireR, fireR, fireR),
            material: Cesium.Color.RED.withAlpha(0.45),
            outline: true,
            outlineColor: Cesium.Color.RED,
          },
        });
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
          cylinder: {
            length: 2000,
            topRadius: heavyR,
            bottomRadius: heavyR,
            material: Cesium.Color.ORANGE.withAlpha(0.22),
            outline: true,
            outlineColor: Cesium.Color.ORANGE,
          },
        });
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
          cylinder: {
            length: 800,
            topRadius: blastR,
            bottomRadius: blastR,
            material: Cesium.Color.YELLOW.withAlpha(0.12),
            outline: true,
            outlineColor: Cesium.Color.YELLOW.withAlpha(0.6),
          },
        });
        viewer.entities.add({
          position: strikePos,
          point: { pixelSize: 14, color: Cesium.Color.WHITE, outlineColor: Cesium.Color.RED, outlineWidth: 3 },
          label: {
            text: '☢ STRIKE POINT',
            font: '13px monospace',
            fillColor: Cesium.Color.RED,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -18),
          },
        });

        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lng, lat, Math.max(blastR * 3, 50000)),
          duration: 2.5,
        });
      } catch (err) {
        console.error('[CesiumView] Nuclear entity error:', err);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nuclearResult, simulationMode, ready]);

  // ── Update asteroid entities ───────────────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || simulationMode !== 'asteroid') return;

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Cesium: any = await import('cesium');
        viewer.entities.removeAll();
        if (!asteroidResult) return;

        const lat = asteroidConfig.targetLat;
        const lng = asteroidConfig.targetLng;
        const craterR = (asteroidResult.craterDiameterKm ?? 0.1) * 500; // km → m, then /2 for radius
        const thermalR = asteroidResult.thermalRadiusKm * 1000;
        const shockR   = asteroidResult.severeBlastRadiusKm * 1000;
        const outerR   = asteroidResult.lightBlastRadiusKm * 1000;

        // Crater
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
          ellipse: {
            semiMajorAxis: craterR,
            semiMinorAxis: craterR,
            material: Cesium.Color.fromCssColorString('#2a0a00').withAlpha(0.9),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#ff4400'),
            height: 0,
          },
        });
        // Thermal ring
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
          ellipse: { semiMajorAxis: thermalR, semiMinorAxis: thermalR, material: Cesium.Color.fromCssColorString('#ff8800').withAlpha(0.15), outline: true, outlineColor: Cesium.Color.fromCssColorString('#ff8800').withAlpha(0.5), height: 0 },
        });
        // Shockwave rings
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
          ellipse: { semiMajorAxis: shockR, semiMinorAxis: shockR, material: Cesium.Color.fromCssColorString('#ffcc00').withAlpha(0.1), outline: true, outlineColor: Cesium.Color.fromCssColorString('#ffcc00').withAlpha(0.4), height: 0 },
        });
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
          ellipse: { semiMajorAxis: outerR, semiMinorAxis: outerR, material: Cesium.Color.fromCssColorString('#ffffff').withAlpha(0.05), outline: true, outlineColor: Cesium.Color.WHITE.withAlpha(0.2), height: 0 },
        });
        // Marker
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lng, lat, craterR * 2),
          point: { pixelSize: 14, color: Cesium.Color.fromCssColorString('#ff6600'), outlineColor: Cesium.Color.WHITE, outlineWidth: 2 },
          label: { text: '☄ IMPACT POINT', font: '13px monospace', fillColor: Cesium.Color.fromCssColorString('#ff6600'), outlineWidth: 2, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -18) },
        });

        viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lng, lat, Math.max(outerR * 2, 100000)), duration: 2.5 });
      } catch (err) {
        console.error('[CesiumView] Asteroid entity error:', err);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asteroidResult, simulationMode, ready]);

  // ── Update EMP entities ────────────────────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || simulationMode !== 'emp') return;

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Cesium: any = await import('cesium');
        viewer.entities.removeAll();
        if (!empResult) return;

        const { groundZeroLat: lat, groundZeroLng: lng } = empResult;
        const e1R = empResult.e1RadiusKm * 1000;
        const e2R = empResult.e2RadiusKm * 1000;
        const e3R = empResult.e3RadiusKm * 1000;
        const altKm = 400000; // burst altitude in meters

        // Burst point in space
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lng, lat, altKm),
          point: { pixelSize: 10, color: Cesium.Color.fromCssColorString('#ffee00'), outlineColor: Cesium.Color.WHITE, outlineWidth: 2 },
          label: { text: '⚡ BURST POINT', font: '12px monospace', fillColor: Cesium.Color.fromCssColorString('#ffee00'), verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -14) },
        });

        // E3 (outermost, slowest)
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(lng, lat, 0), ellipse: { semiMajorAxis: e3R, semiMinorAxis: e3R, material: Cesium.Color.fromCssColorString('#ff4444').withAlpha(0.06), outline: true, outlineColor: Cesium.Color.fromCssColorString('#ff4444').withAlpha(0.3), height: 0 } });
        // E2
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(lng, lat, 0), ellipse: { semiMajorAxis: e2R, semiMinorAxis: e2R, material: Cesium.Color.fromCssColorString('#ffaa00').withAlpha(0.08), outline: true, outlineColor: Cesium.Color.fromCssColorString('#ffaa00').withAlpha(0.4), height: 0 } });
        // E1 (innermost, strongest)
        viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(lng, lat, 0), ellipse: { semiMajorAxis: e1R, semiMinorAxis: e1R, material: Cesium.Color.fromCssColorString('#ffee00').withAlpha(0.12), outline: true, outlineColor: Cesium.Color.fromCssColorString('#ffee00').withAlpha(0.6), height: 0 } });

        // Line from burst to ground
        viewer.entities.add({
          polyline: {
            positions: [Cesium.Cartesian3.fromDegrees(lng, lat, altKm), Cesium.Cartesian3.fromDegrees(lng, lat, 0)],
            width: 1,
            material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#ffee00').withAlpha(0.3) }),
          },
        });

        viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lng, lat, e1R * 2.5), duration: 2.5 });
      } catch (err) {
        console.error('[CesiumView] EMP entity error:', err);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empResult, simulationMode, ready]);

  // ── Clear entities when switching modes ───────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (viewer) {
      try { viewer.entities.removeAll(); } catch { /* ignore */ }
    }
  }, [simulationMode]);

  // ── Geolocation sync ──────────────────────────────────────────────────────
  const flyToMyLocation = useCallback(async () => {
    if (!viewerRef.current || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Cesium: any = await import('cesium');
          viewerRef.current?.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
              pos.coords.longitude,
              pos.coords.latitude,
              2500, // 2.5km altitude — street level perspective
            ),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-30),
              roll: 0,
            },
            duration: 3,
          });
        } catch { /* ignore */ }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  if (error) return <CesiumError msg={error} />;

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#0a0a0f' }} />

      {/* Mode indicator overlay */}
      {ready && (
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <div className="bg-panel/80 border border-panel-border rounded px-2.5 py-1 font-mono text-[10px] text-text-muted backdrop-blur-sm">
            3D GLOBE · {simulationMode.toUpperCase()} MODE · Click globe to place target
          </div>
        </div>
      )}

      {/* 3D controls */}
      {ready && (
        <div className="absolute bottom-10 right-4 z-10 flex flex-col gap-2">
          {/* My Location */}
          <button
            onClick={flyToMyLocation}
            disabled={locating}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono rounded border transition-colors backdrop-blur-sm"
            style={{
              background: 'rgba(10,10,15,0.85)',
              borderColor: locating ? '#00ff8840' : '#00ff8860',
              color: locating ? '#484f58' : '#00ff88',
            }}
            title="Fly to my location (real-time day/night)"
          >
            {locating ? '⟳ Locating...' : '◎ My Location'}
          </button>

          {/* Sun time display */}
          <div
            className="px-2.5 py-1.5 text-[10px] font-mono rounded border backdrop-blur-sm text-center"
            style={{ background: 'rgba(10,10,15,0.85)', borderColor: '#ffffff15', color: '#484f58' }}
          >
            ☀ {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Public export ─────────────────────────────────────────────────────────────
export const CesiumView: React.FC<Props> = ({ ionToken, onTokenSave }) => {
  const handleSave = useCallback((token: string) => {
    localStorage.setItem('cesium_ion_token', token);
    onTokenSave(token);
  }, [onTokenSave]);

  if (!ionToken) return <TokenPrompt onSave={handleSave} />;

  return (
    <div className="absolute inset-0">
      <React.Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <p className="text-terminal font-mono text-xs animate-pulse">Loading 3D globe...</p>
        </div>
      }>
        <CesiumGlobe ionToken={ionToken} />
      </React.Suspense>
    </div>
  );
};
