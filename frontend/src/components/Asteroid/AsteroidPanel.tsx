import React from 'react';
import { ChevronRight } from 'lucide-react';
import { IMPACTOR_PRESETS } from '../../utils/asteroidPhysics';
import type { ImpactorPreset } from '../../utils/asteroidPhysics';
import { useAsteroidStore } from '../../stores/asteroidStore';
import { useSimulationStore } from '../../stores/simulationStore';
import { AddressLookup } from '../Controls/AddressLookup';

const SURFACE_OPTIONS: { value: 'land' | 'ocean' | 'urban' | 'ice'; label: string }[] = [
  { value: 'land', label: 'Land' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'urban', label: 'Urban' },
  { value: 'ice', label: 'Ice' },
];

const DENSITY_PRESETS = [
  { label: 'Comet', val: 1000 },
  { label: 'Stone', val: 2700 },
  { label: 'Iron', val: 7900 },
];

const POP_DENSITY_PRESETS = [
  { label: 'Rural', val: 50 },
  { label: 'Suburban', val: 1500 },
  { label: 'Urban', val: 2500 },
  { label: 'Dense', val: 10000 },
];

function formatDiameter(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${m} m`;
}

export const AsteroidPanel: React.FC = () => {
  const {
    config,
    selectedPresetId,
    setConfig,
    setPreset,
    setImpactLocation,
    runSimulation,
  } = useAsteroidStore();

  const { leftPanelOpen, setLeftPanelOpen } = useSimulationStore();

  const handlePreset = (preset: ImpactorPreset) => {
    setPreset(preset);
  };

  return (
    <>
      <div
        className={`
          fixed left-0 top-14 bottom-0 z-[900]
          w-80 bg-panel border-r border-panel-border
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${leftPanelOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-panel-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">☄</span>
            <h2
              className="text-xs font-mono font-bold uppercase tracking-widest"
              style={{ color: '#ff8844' }}
            >
              Asteroid Impact Sim
            </h2>
          </div>
          <button
            onClick={() => setLeftPanelOpen(false)}
            className="text-text-muted hover:text-text-primary"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* Impactor Type Presets */}
          <section>
            <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
              Impactor Type
            </label>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {IMPACTOR_PRESETS.map((preset) => {
                const isActive = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePreset(preset)}
                    className={`w-full text-left p-2 rounded border transition-all ${
                      isActive
                        ? 'border-orange-500/70 bg-orange-500/10 shadow-[0_0_8px_rgba(255,136,68,0.2)]'
                        : 'border-panel-border bg-midnight hover:border-panel-border/80 hover:bg-panel-light/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs font-mono font-bold truncate ${
                          isActive ? 'text-orange-400' : 'text-text-primary'
                        }`}
                      >
                        {preset.name}
                      </span>
                      <span className="text-[9px] font-mono text-text-muted flex-shrink-0">
                        {formatDiameter(preset.diameterM)}
                      </span>
                    </div>
                    <p className="text-[9px] font-mono text-text-muted mt-0.5 line-clamp-2">
                      {preset.description}
                    </p>
                    {preset.historicalExample && (
                      <p className="text-[9px] font-mono mt-0.5" style={{ color: '#ff8844' }}>
                        {preset.historicalExample}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="border-t border-panel-border" />

          {/* Custom Parameters */}
          <section className="space-y-3">
            <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest">
              Custom Parameters
            </label>

            {/* Diameter */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-mono text-text-muted">Diameter</span>
                <span className="text-[10px] font-mono" style={{ color: '#ff8844' }}>
                  {formatDiameter(config.diameterM)}
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={10000}
                step={5}
                value={config.diameterM}
                onChange={(e) => setConfig({ diameterM: Number(e.target.value) })}
                className="w-full h-1.5 appearance-none bg-panel-light rounded-full outline-none cursor-pointer"
              />
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] font-mono text-text-muted">5 m</span>
                <span className="text-[9px] font-mono text-text-muted">10 km</span>
              </div>
            </div>

            {/* Density */}
            <div>
              <label className="text-[10px] font-mono text-text-muted block mb-1.5">
                Composition / Density
              </label>
              <div className="grid grid-cols-3 gap-1 mb-1.5">
                {DENSITY_PRESETS.map((d) => (
                  <button
                    key={d.val}
                    onClick={() => setConfig({ densityKgM3: d.val })}
                    className={`text-[10px] font-mono px-1 py-1 rounded border transition-colors ${
                      config.densityKgM3 === d.val
                        ? 'border-orange-500/60 text-orange-400 bg-orange-500/5'
                        : 'border-panel-border text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-mono text-text-muted">Density</span>
                <span className="text-[10px] font-mono" style={{ color: '#ff8844' }}>
                  {config.densityKgM3.toLocaleString()} kg/m³
                </span>
              </div>
              <input
                type="range"
                min={500}
                max={9000}
                step={100}
                value={config.densityKgM3}
                onChange={(e) => setConfig({ densityKgM3: Number(e.target.value) })}
                className="w-full h-1.5 appearance-none bg-panel-light rounded-full outline-none cursor-pointer mt-1"
              />
            </div>

            {/* Velocity */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-mono text-text-muted">Velocity</span>
                <span className="text-[10px] font-mono" style={{ color: '#ff8844' }}>
                  {config.velocityKmS} km/s
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={40}
                step={0.5}
                value={config.velocityKmS}
                onChange={(e) => setConfig({ velocityKmS: Number(e.target.value) })}
                className="w-full h-1.5 appearance-none bg-panel-light rounded-full outline-none cursor-pointer"
              />
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] font-mono text-text-muted">5 km/s</span>
                <span className="text-[9px] font-mono text-text-muted">40 km/s</span>
              </div>
            </div>

            {/* Angle */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-mono text-text-muted">Impact Angle</span>
                <span className="text-[10px] font-mono" style={{ color: '#ff8844' }}>
                  {config.angleDeg}°
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={90}
                step={1}
                value={config.angleDeg}
                onChange={(e) => setConfig({ angleDeg: Number(e.target.value) })}
                className="w-full h-1.5 appearance-none bg-panel-light rounded-full outline-none cursor-pointer"
              />
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] font-mono text-text-muted">15° (grazing)</span>
                <span className="text-[9px] font-mono text-text-muted">90° (vertical)</span>
              </div>
            </div>

            {/* Surface Type */}
            <div>
              <label className="text-[10px] font-mono text-text-muted block mb-1.5">
                Surface Type
              </label>
              <div className="grid grid-cols-2 gap-1">
                {SURFACE_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setConfig({ surfaceType: s.value })}
                    className={`text-[10px] font-mono py-1 px-2 rounded border transition-colors ${
                      config.surfaceType === s.value
                        ? 'border-orange-500/60 text-orange-400 bg-orange-500/5'
                        : 'border-panel-border text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="border-t border-panel-border" />

          {/* Impact Location */}
          <section>
            <AddressLookup
              label="IMPACT LOCATION"
              placeholder="City, landmark, coordinates..."
              onLocationFound={(lat, lng, name) => setImpactLocation(lat, lng, name)}
            />
            <div className="bg-midnight border border-panel-border rounded p-2 font-mono text-xs mt-2">
              <div className="flex justify-between">
                <span className="text-text-muted">LAT</span>
                <span style={{ color: '#ff8844' }}>{config.targetLat.toFixed(4)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">LNG</span>
                <span style={{ color: '#ff8844' }}>{config.targetLng.toFixed(4)}°</span>
              </div>
              {config.targetName && (
                <div className="flex justify-between mt-1">
                  <span className="text-text-muted">TARGET</span>
                  <span className="text-text-primary truncate ml-2">{config.targetName}</span>
                </div>
              )}
            </div>
          </section>

          <div className="border-t border-panel-border" />

          {/* Population Density */}
          <section>
            <label className="text-[10px] font-mono text-text-muted block mb-1.5 uppercase tracking-widest">
              Pop. Density
            </label>
            <div className="grid grid-cols-2 gap-1 mb-2">
              {POP_DENSITY_PRESETS.map((p) => (
                <button
                  key={p.val}
                  onClick={() => setConfig({ populationDensity: p.val })}
                  className={`text-[10px] font-mono py-1 px-2 rounded border transition-colors ${
                    config.populationDensity === p.val
                      ? 'border-orange-500/60 text-orange-400 bg-orange-500/5'
                      : 'border-panel-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-mono text-text-muted">Custom</span>
              <span className="text-[10px] font-mono" style={{ color: '#ff8844' }}>
                {config.populationDensity.toLocaleString()} ppl/km²
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={50000}
              step={100}
              value={config.populationDensity}
              onChange={(e) => setConfig({ populationDensity: Number(e.target.value) })}
              className="w-full h-1.5 appearance-none bg-panel-light rounded-full outline-none cursor-pointer"
            />
          </section>

          <div className="border-t border-panel-border" />

          {/* Calculate Button */}
          <button
            onClick={runSimulation}
            className="w-full py-2.5 rounded border font-mono text-xs font-bold uppercase tracking-widest transition-all"
            style={{
              background: '#ff884415',
              borderColor: '#ff884460',
              color: '#ff8844',
              boxShadow: '0 0 12px rgba(255,136,68,0.1)',
            }}
          >
            ☄ Calculate Impact
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-panel-border px-4 py-2 flex-shrink-0">
          <p className="text-[9px] font-mono text-text-muted/50 text-center">
            Collins et al. (2005) Earth Impact Effects Program · Educational
          </p>
        </div>
      </div>

      {/* Collapsed tab */}
      {!leftPanelOpen && (
        <button
          onClick={() => setLeftPanelOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-[900] bg-panel border border-l-0 border-panel-border rounded-r-lg px-1.5 py-4 hover:bg-panel-light transition-colors"
          title="Open Asteroid Configuration"
          style={{ color: '#ff8844' }}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm">☄</span>
            <span
              className="text-[9px] font-mono uppercase tracking-wider"
              style={{ writingMode: 'vertical-rl' }}
            >
              Asteroid
            </span>
          </div>
        </button>
      )}
    </>
  );
};
