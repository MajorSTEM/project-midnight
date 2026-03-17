import React from 'react';
import { Target, Wind, Users, Crosshair, ChevronRight, Plus, Copy, Trash2 } from 'lucide-react';
import { YieldSelector } from './YieldSelector';
import { AddressLookup } from './AddressLookup';
import { useSimulationStore } from '../../stores/simulationStore';
import type { BurstType, NuclearNation, StrikeConfig } from '../../types';

const NATIONS: NuclearNation[] = [
  'USA', 'Russia', 'China', 'UK', 'France',
  'India', 'Pakistan', 'North Korea', 'Israel', 'Historical', 'Unknown',
];

const NATION_FLAGS: Record<NuclearNation, string> = {
  'USA': '🇺🇸',
  'Russia': '🇷🇺',
  'China': '🇨🇳',
  'UK': '🇬🇧',
  'France': '🇫🇷',
  'India': '🇮🇳',
  'Pakistan': '🇵🇰',
  'North Korea': '🇰🇵',
  'Israel': '🇮🇱',
  'Historical': '🕰️',
  'Unknown': '❓',
  'USA/NATO': '🇺🇸',
};

function degToCompass(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

// --- Multi-strike strike list ---
const StrikeList: React.FC = () => {
  const {
    strikes,
    activeStrikeId,
    setActiveStrike,
    removeStrike,
    duplicateStrike,
    addStrike,
  } = useSimulationStore();

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
          Active Strikes
          <span className="ml-2 px-1.5 py-0.5 rounded bg-terminal/10 border border-terminal/30 text-terminal text-[9px]">
            {strikes.length}
          </span>
        </label>
        <button
          onClick={() => addStrike({ lat: 40.7128, lng: -74.006 })}
          className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono rounded border border-terminal/40 text-terminal hover:bg-terminal/10 transition-colors"
          title="Add strike at default location"
        >
          <Plus size={10} />
          Add Strike
        </button>
      </div>

      <div className="space-y-1 max-h-40 overflow-y-auto">
        {strikes.length === 0 && (
          <p className="text-[10px] font-mono text-text-muted/60 text-center py-2">
            Click map or Add Strike to place strikes
          </p>
        )}
        {strikes.map((s, idx) => (
          <div
            key={s.id}
            onClick={() => setActiveStrike(s.id)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded border cursor-pointer transition-all ${
              activeStrikeId === s.id
                ? 'border-terminal bg-terminal/5 shadow-[0_0_6px_rgba(0,255,136,0.15)]'
                : 'border-panel-border hover:border-panel-border/80'
            }`}
          >
            <span className="text-sm flex-shrink-0">{NATION_FLAGS[s.nation]}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-mono font-bold truncate ${activeStrikeId === s.id ? 'text-terminal' : 'text-text-primary'}`}>
                Strike #{idx + 1} — {s.yieldKt}kt
              </p>
              {s.location && (
                <p className="text-[9px] font-mono text-text-muted truncate">
                  {s.location.lat.toFixed(3)}, {s.location.lng.toFixed(3)}
                </p>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); duplicateStrike(s.id); }}
              className="p-0.5 text-text-muted hover:text-terminal transition-colors flex-shrink-0"
              title="Duplicate"
            >
              <Copy size={11} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); removeStrike(s.id); }}
              className="p-0.5 text-text-muted hover:text-blast transition-colors flex-shrink-0"
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

// --- Config form for a specific strike (multi-strike mode) ---
const MultiStrikeConfigForm: React.FC = () => {
  const {
    strikes,
    activeStrikeId,
    updateStrikeField,
    liveWind,
  } = useSimulationStore();

  const strike: StrikeConfig | undefined = strikes.find((s) => s.id === activeStrikeId);

  if (!strike) {
    return (
      <p className="text-[10px] font-mono text-text-muted/60 text-center py-4">
        Select a strike above to configure it
      </p>
    );
  }

  const upd = (field: keyof StrikeConfig, val: unknown) =>
    updateStrikeField(strike.id, field, val);

  return (
    <div className="space-y-4">
      <div className="border-b border-terminal/20 pb-1">
        <p className="text-[9px] font-mono text-terminal uppercase tracking-widest">
          Configuring Strike #{(strikes.findIndex((s) => s.id === activeStrikeId) ?? 0) + 1}
        </p>
      </div>

      {/* Strike location */}
      <section>
        <AddressLookup
          label="GEOCODE TARGET"
          placeholder="City, landmark, coordinates..."
          onLocationFound={(lat, lng) => upd('location', { lat, lng })}
        />
        {strike.location && (
          <div className="bg-midnight border border-panel-border rounded p-2 font-mono text-xs mt-2">
            <div className="flex justify-between">
              <span className="text-text-muted">LAT</span>
              <span className="text-terminal">{strike.location.lat.toFixed(4)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">LNG</span>
              <span className="text-terminal">{strike.location.lng.toFixed(4)}°</span>
            </div>
          </div>
        )}
      </section>

      {/* Yield */}
      <section>
        <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
          Yield (kt)
        </label>
        <input
          type="number"
          min={1}
          max={100000}
          value={strike.yieldKt}
          onChange={(e) => upd('yieldKt', Math.max(1, Number(e.target.value)))}
          className="w-full bg-midnight border border-panel-border rounded px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-terminal/50"
        />
      </section>

      {/* Burst type */}
      <section>
        <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">Burst Type</label>
        <div className="grid grid-cols-2 gap-2">
          {(['airburst', 'surface'] as BurstType[]).map((bt) => (
            <button
              key={bt}
              onClick={() => upd('burstType', bt)}
              className={`py-2 px-3 rounded border text-xs font-mono font-bold uppercase tracking-wide transition-colors ${
                strike.burstType === bt
                  ? 'bg-terminal/10 border-terminal text-terminal'
                  : 'bg-midnight border-panel-border text-text-muted hover:border-terminal/40'
              }`}
            >
              {bt === 'airburst' ? '☁ Airburst' : '💥 Surface'}
            </button>
          ))}
        </div>
      </section>

      {/* Nation */}
      <section>
        <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
          Aggressor Nation
        </label>
        <select
          value={strike.nation}
          onChange={(e) => upd('nation', e.target.value)}
          className="w-full bg-midnight border border-panel-border rounded px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-terminal/50"
        >
          {NATIONS.map((n) => (
            <option key={n} value={n}>{NATION_FLAGS[n]} {n}</option>
          ))}
        </select>
      </section>

      {/* Wind */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest">
            <Wind size={10} className="inline mr-1" />
            Wind
          </label>
          {liveWind?.source === 'noaa' && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border text-terminal border-terminal/50 bg-terminal/10">
              ● NOAA
            </span>
          )}
        </div>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-mono text-text-muted">Direction</span>
              <span className="text-[10px] font-mono text-terminal">{strike.windDirection}° ({degToCompass(strike.windDirection)})</span>
            </div>
            <input
              type="range" min={0} max={359} value={strike.windDirection}
              onChange={(e) => upd('windDirection', Number(e.target.value))}
              className="w-full h-1.5 appearance-none bg-panel-light rounded-full outline-none cursor-pointer"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-mono text-text-muted">Speed</span>
              <span className="text-[10px] font-mono text-terminal">{strike.windSpeed} km/h</span>
            </div>
            <input
              type="range" min={5} max={100} value={strike.windSpeed}
              onChange={(e) => upd('windSpeed', Number(e.target.value))}
              className="w-full h-1.5 appearance-none bg-panel-light rounded-full outline-none cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* Population density */}
      <section>
        <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
          <Users size={10} className="inline mr-1" />
          Pop. Density (ppl/km²)
        </label>
        <input
          type="number" min={0} max={50000} value={strike.populationDensity}
          onChange={(e) => upd('populationDensity', Math.max(0, Number(e.target.value)))}
          className="w-full bg-midnight border border-panel-border rounded px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-terminal/50"
        />
        <div className="grid grid-cols-3 gap-1 mt-1.5">
          {[
            { label: 'Rural', val: 50 },
            { label: 'Suburban', val: 1500 },
            { label: 'Urban', val: 5000 },
          ].map((p) => (
            <button
              key={p.val}
              onClick={() => upd('populationDensity', p.val)}
              className={`text-[10px] font-mono px-1 py-1 rounded border transition-colors ${
                strike.populationDensity === p.val
                  ? 'border-terminal/60 text-terminal bg-terminal/5'
                  : 'border-panel-border text-text-muted hover:text-text-primary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

// --- Main panel ---
export const StrikeConfigPanel: React.FC = () => {
  const {
    config,
    leftPanelOpen,
    liveWind,
    multiStrikeMode,
    setLeftPanelOpen,
    setBurstType,
    setNation,
    setWindDirection,
    setWindSpeed,
    setPopulationDensity,
    setStrikeLocation,
  } = useSimulationStore();

  return (
    <>
      {/* Panel */}
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
            <Target size={14} className="text-terminal" />
            <h2 className="text-xs font-mono font-bold text-terminal uppercase tracking-widest">
              Strike Configuration
            </h2>
            {multiStrikeMode && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-terminal/10 border border-terminal/30 text-terminal">
                MULTI
              </span>
            )}
          </div>
          <button onClick={() => setLeftPanelOpen(false)} className="text-text-muted hover:text-text-primary">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* ---- MULTI-STRIKE MODE ---- */}
          {multiStrikeMode ? (
            <>
              <StrikeList />
              <div className="border-t border-panel-border" />
              <MultiStrikeConfigForm />
            </>
          ) : (
            /* ---- SINGLE-STRIKE MODE (existing UI) ---- */
            <>
              <section>
                <AddressLookup
                  label="GEOCODE TARGET"
                  placeholder="City, landmark, coordinates..."
                  onLocationFound={(lat, lng) => setStrikeLocation({ lat, lng })}
                />
              </section>

              <div className="border-t border-panel-border" />

              <section>
                <YieldSelector />
              </section>

              <div className="border-t border-panel-border" />

              {/* Burst Type */}
              <section>
                <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
                  Burst Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['airburst', 'surface'] as BurstType[]).map((bt) => (
                    <button
                      key={bt}
                      onClick={() => setBurstType(bt)}
                      className={`
                        py-2 px-3 rounded border text-xs font-mono font-bold uppercase tracking-wide transition-colors
                        ${config.burstType === bt
                          ? 'bg-terminal/10 border-terminal text-terminal'
                          : 'bg-midnight border-panel-border text-text-muted hover:border-terminal/40'
                        }
                      `}
                    >
                      {bt === 'airburst' ? '☁ Airburst' : '💥 Surface'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-text-muted font-mono mt-1.5">
                  {config.burstType === 'airburst'
                    ? 'Maximum blast — no fallout plume'
                    : 'Reduced blast radius × 0.75 + radioactive fallout plume'}
                </p>
              </section>

              <div className="border-t border-panel-border" />

              {/* Aggressor Nation */}
              <section>
                <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
                  <Crosshair size={10} className="inline mr-1" />
                  Aggressor Nation
                </label>
                <select
                  value={config.nation}
                  onChange={(e) => setNation(e.target.value as NuclearNation)}
                  className="w-full bg-midnight border border-panel-border rounded px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-terminal/50 transition-colors"
                >
                  {NATIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </section>

              <div className="border-t border-panel-border" />

              {/* Wind Configuration */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest">
                    <Wind size={10} className="inline mr-1" />
                    Wind (for fallout plume)
                  </label>
                  {liveWind && liveWind.source === 'noaa' && (
                    <span
                      className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border"
                      style={{
                        color: '#00ff88',
                        borderColor: '#00ff88' + '50',
                        background: '#00ff88' + '10',
                      }}
                    >
                      ● LIVE NOAA
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-mono text-text-muted">Direction (from)</span>
                      <span className="text-[10px] font-mono text-terminal">{config.windDirection}° ({degToCompass(config.windDirection)})</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={359}
                      value={config.windDirection}
                      onChange={(e) => setWindDirection(Number(e.target.value))}
                      className="w-full h-1.5 appearance-none bg-panel-light rounded-full outline-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-mono text-text-muted">Speed</span>
                      <span className="text-[10px] font-mono text-terminal">{config.windSpeed} km/h</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={100}
                      value={config.windSpeed}
                      onChange={(e) => setWindSpeed(Number(e.target.value))}
                      className="w-full h-1.5 appearance-none bg-panel-light rounded-full outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </section>

              <div className="border-t border-panel-border" />

              {/* Population Density */}
              <section>
                <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
                  <Users size={10} className="inline mr-1" />
                  Pop. Density (people/km²)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50000}
                  value={config.populationDensity}
                  onChange={(e) => setPopulationDensity(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-midnight border border-panel-border rounded px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-terminal/50 transition-colors"
                />
                <div className="grid grid-cols-3 gap-1 mt-1.5">
                  {[
                    { label: 'Rural', val: 50 },
                    { label: 'Suburban', val: 1500 },
                    { label: 'Urban', val: 5000 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      onClick={() => setPopulationDensity(p.val)}
                      className={`text-[10px] font-mono px-1 py-1 rounded border transition-colors ${
                        config.populationDensity === p.val
                          ? 'border-terminal/60 text-terminal bg-terminal/5'
                          : 'border-panel-border text-text-muted hover:border-panel-border hover:text-text-primary'
                      }`}
                    >
                      {p.label}
                      <br />{p.val.toLocaleString()}/km²
                    </button>
                  ))}
                </div>
              </section>

              <div className="border-t border-panel-border" />

              {/* Strike coordinates display */}
              {config.location && (
                <section>
                  <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1.5">
                    Strike Coordinates
                  </label>
                  <div className="bg-midnight border border-panel-border rounded p-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-muted">LAT</span>
                      <span className="text-terminal">{config.location.lat.toFixed(4)}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">LNG</span>
                      <span className="text-terminal">{config.location.lng.toFixed(4)}°</span>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-panel-border px-4 py-2 flex-shrink-0">
          <p className="text-[9px] font-mono text-text-muted/50 text-center">
            Educational simulation — Glasstone-Dolan scaling laws
          </p>
        </div>
      </div>

      {/* Collapsed tab */}
      {!leftPanelOpen && (
        <button
          onClick={() => setLeftPanelOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-[900] bg-panel border border-l-0 border-panel-border rounded-r-lg px-1.5 py-4 text-terminal hover:bg-panel-light transition-colors"
          title="Open Strike Configuration"
        >
          <div className="flex flex-col items-center gap-1">
            <Target size={14} />
            <span className="text-[9px] font-mono uppercase tracking-wider" style={{ writingMode: 'vertical-rl' }}>
              Config
            </span>
          </div>
        </button>
      )}
    </>
  );
};
