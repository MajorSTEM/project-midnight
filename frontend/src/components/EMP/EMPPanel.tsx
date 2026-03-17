import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { EMP_PRESETS } from '../../utils/empPhysics';
import { calculateEMPEffects, lineOfSightRadius } from '../../utils/empPhysics';
import type { EMPPreset } from '../../utils/empPhysics';
import { useEMPStore } from '../../stores/empStore';
import { useSimulationStore } from '../../stores/simulationStore';

const NATION_OPTIONS = [
  'Russia', 'China', 'USA', 'North Korea', 'Iran', 'Pakistan', 'Unknown State',
];

const THREAT_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '#00ff88',
  2: '#88ff44',
  3: '#ffcc00',
  4: '#ff8800',
  5: '#ff2222',
};

function ThreatDots({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <span>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="inline-block w-1.5 h-1.5 rounded-full mr-0.5"
          style={{
            backgroundColor: i < level ? THREAT_COLORS[level] : '#333',
          }}
        />
      ))}
    </span>
  );
}

export const EMPPanel: React.FC = () => {
  const {
    config,
    selectedPresetId,
    result,
    setConfig,
    setPreset,
    setBurstLocation,
    runSimulation,
  } = useEMPStore();

  const { leftPanelOpen, setLeftPanelOpen } = useSimulationStore();

  // Live coverage preview — compute inline without saving to store
  const preview = useMemo(() => {
    try {
      return calculateEMPEffects(config);
    } catch {
      return null;
    }
  }, [config]);

  const handlePreset = (preset: EMPPreset) => {
    setPreset(preset);
  };

  const yieldLog = Math.log10(Math.max(1, config.yieldKt));
  const yieldMax = Math.log10(10_000); // 10 Mt

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
            <span className="text-base">⚡</span>
            <h2
              className="text-xs font-mono font-bold uppercase tracking-widest"
              style={{ color: '#ffcc00' }}
            >
              EMP Strike Simulator
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

          {/* Scenario Presets */}
          <section>
            <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
              Scenario Presets
            </label>
            <div className="space-y-1.5">
              {EMP_PRESETS.map((preset) => {
                const isActive = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePreset(preset)}
                    className={`w-full text-left p-2 rounded border transition-all ${
                      isActive
                        ? 'border-yellow-500/70 bg-yellow-500/10 shadow-[0_0_8px_rgba(255,204,0,0.2)]'
                        : 'border-panel-border bg-midnight hover:border-panel-border/80 hover:bg-panel-light/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-mono font-bold truncate ${
                          isActive ? 'text-yellow-300' : 'text-text-primary'
                        }`}
                      >
                        {preset.name}
                      </span>
                      <ThreatDots level={preset.threat} />
                    </div>
                    <p className="text-[9px] font-mono text-text-muted mt-0.5 line-clamp-2">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="border-t border-panel-border" />

          {/* Burst Parameters */}
          <section className="space-y-3">
            <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest">
              Burst Parameters
            </label>

            {/* Yield — log scale */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-mono text-text-muted">Yield</span>
                <span className="text-[10px] font-mono" style={{ color: '#ffcc00' }}>
                  {config.yieldKt >= 1000
                    ? `${(config.yieldKt / 1000).toFixed(1)} Mt`
                    : `${config.yieldKt} kt`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={yieldMax}
                step={0.01}
                value={yieldLog}
                onChange={(e) => {
                  const kt = Math.round(Math.pow(10, Number(e.target.value)));
                  setConfig({ yieldKt: Math.max(1, kt) });
                }}
                className="w-full h-1.5 appearance-none bg-panel-light rounded-full outline-none cursor-pointer"
              />
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] font-mono text-text-muted">1 kt</span>
                <span className="text-[9px] font-mono text-text-muted">10 Mt</span>
              </div>
            </div>

            {/* Altitude */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-mono text-text-muted">Altitude</span>
                <span className="text-[10px] font-mono" style={{ color: '#ffcc00' }}>
                  {config.altitudeKm} km
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={400}
                step={1}
                value={config.altitudeKm}
                onChange={(e) => setConfig({ altitudeKm: Number(e.target.value) })}
                className="w-full h-1.5 appearance-none bg-panel-light rounded-full outline-none cursor-pointer"
              />
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] font-mono text-text-muted">1 km (low)</span>
                <span className="text-[9px] font-mono text-text-muted">400 km (HEMP)</span>
              </div>
            </div>

            {/* Burst type */}
            <div>
              <label className="text-[10px] font-mono text-text-muted block mb-1.5">
                Burst Type
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['hemp', 'surface', 'low-altitude'] as const).map((bt) => (
                  <button
                    key={bt}
                    onClick={() => setConfig({ burstType: bt })}
                    className={`text-[9px] font-mono py-1 px-1 rounded border transition-colors ${
                      config.burstType === bt
                        ? 'border-yellow-500/60 text-yellow-300 bg-yellow-500/10'
                        : 'border-panel-border text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {bt === 'hemp' ? 'HEMP' : bt === 'surface' ? 'Surface' : 'Low-Alt'}
                  </button>
                ))}
              </div>
              <p className="text-[9px] font-mono text-text-muted mt-1">
                {config.burstType === 'hemp'
                  ? 'High-altitude — covers entire CONUS with E1/E2/E3'
                  : config.burstType === 'surface'
                  ? 'Surface burst — localized blast + limited EMP'
                  : 'Low-altitude — partial EMP with local blast damage'}
              </p>
            </div>
          </section>

          <div className="border-t border-panel-border" />

          {/* Burst Location */}
          <section className="space-y-2">
            <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest">
              Burst Location
            </label>
            <div className="bg-midnight border border-panel-border rounded p-2 font-mono text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-text-muted flex-shrink-0">LAT</span>
                <input
                  type="number"
                  step={0.1}
                  value={config.targetLat}
                  onChange={(e) => setBurstLocation(Number(e.target.value), config.targetLng)}
                  className="flex-1 bg-transparent outline-none text-right text-yellow-300"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-muted flex-shrink-0">LNG</span>
                <input
                  type="number"
                  step={0.1}
                  value={config.targetLng}
                  onChange={(e) => setBurstLocation(config.targetLat, Number(e.target.value))}
                  className="flex-1 bg-transparent outline-none text-right text-yellow-300"
                />
              </div>
            </div>
            <p className="text-[9px] font-mono text-text-muted">
              Click map to set burst point
            </p>
          </section>

          <div className="border-t border-panel-border" />

          {/* Nation */}
          <section>
            <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1.5">
              Aggressor Nation
            </label>
            <select
              value={config.nation}
              onChange={(e) => setConfig({ nation: e.target.value })}
              className="w-full bg-midnight border border-panel-border rounded px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-yellow-500/50"
            >
              {NATION_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </section>

          <div className="border-t border-panel-border" />

          {/* Coverage Preview */}
          {preview && (
            <section>
              <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
                Coverage Preview
              </label>
              <div className="bg-midnight border border-panel-border rounded p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[10px] font-mono text-text-muted">E1 Radius (electronics)</span>
                  <span className="text-[10px] font-mono" style={{ color: '#ff4444' }}>
                    {preview.e1RadiusKm.toFixed(0)} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-mono text-text-muted">E3 Radius (power grid)</span>
                  <span className="text-[10px] font-mono" style={{ color: '#ffaa00' }}>
                    {preview.e3RadiusKm.toFixed(0)} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-mono text-text-muted">Cities in E1 range</span>
                  <span className="text-[10px] font-mono text-text-primary">
                    {preview.affectedCities.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-mono text-text-muted">Population affected</span>
                  <span className="text-[10px] font-mono" style={{ color: '#ffcc00' }}>
                    {preview.populationAffected >= 1_000_000
                      ? `${(preview.populationAffected / 1_000_000).toFixed(1)}M`
                      : `${(preview.populationAffected / 1000).toFixed(0)}K`}
                  </span>
                </div>
              </div>
            </section>
          )}

          <div className="border-t border-panel-border" />

          {/* Calculate Button */}
          <button
            onClick={runSimulation}
            className="w-full py-2.5 rounded border font-mono text-xs font-bold uppercase tracking-widest transition-all"
            style={{
              background: '#ffcc0015',
              borderColor: '#ffcc0060',
              color: '#ffcc00',
              boxShadow: '0 0 12px rgba(255,204,0,0.1)',
            }}
          >
            ⚡ Calculate EMP
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-panel-border px-4 py-2 flex-shrink-0">
          <p className="text-[9px] font-mono text-text-muted/50 text-center">
            Glasstone &amp; Dolan (1977) · EMP Commission (2004, 2008) · Educational
          </p>
        </div>
      </div>

      {/* Collapsed tab */}
      {!leftPanelOpen && (
        <button
          onClick={() => setLeftPanelOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-[900] bg-panel border border-l-0 border-panel-border rounded-r-lg px-1.5 py-4 hover:bg-panel-light transition-colors"
          title="Open EMP Configuration"
          style={{ color: '#ffcc00' }}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm">⚡</span>
            <span
              className="text-[9px] font-mono uppercase tracking-wider"
              style={{ writingMode: 'vertical-rl' }}
            >
              EMP
            </span>
          </div>
        </button>
      )}
    </>
  );
};
