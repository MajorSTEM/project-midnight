import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ChevronRight, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { PATHOGEN_PRESETS } from '../../utils/pandemicEngine';
import type { PathogenType } from '../../utils/pandemicEngine';
import { usePandemicStore } from '../../stores/pandemicStore';
import { useSimulationStore } from '../../stores/simulationStore';
import { AddressLookup } from '../Controls/AddressLookup';

const CATEGORY_COLORS: Record<PathogenType['category'], string> = {
  respiratory: '#4488ff',
  hemorrhagic: '#cc2200',
  neurological: '#aa44cc',
  'vector-borne': '#2288aa',
  bioweapon: '#666600',
  novel: '#ff66aa',
};

const CATEGORY_LABELS: Record<PathogenType['category'], string> = {
  respiratory: 'RESP',
  hemorrhagic: 'HEMO',
  neurological: 'NEURO',
  'vector-borne': 'VECTOR',
  bioweapon: 'BIOWEAP',
  novel: 'NOVEL',
};

const PH_OPTIONS: { value: string; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'weak', label: 'Weak' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'strong', label: 'Strong' },
  { value: 'extreme', label: 'Extreme' },
];

const DURATION_OPTIONS = [90, 180, 365, 730];

const POPULATION_OPTIONS = [
  { label: '100K', val: 100_000 },
  { label: '1M', val: 1_000_000 },
  { label: '10M', val: 10_000_000 },
  { label: '100M', val: 100_000_000 },
];

function SkullRating({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <span className="text-[10px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ opacity: i < level ? 1 : 0.2, color: '#ff4444' }}>
          ☠
        </span>
      ))}
    </span>
  );
}

export const PandemicPanel: React.FC = () => {
  const {
    config,
    selectedPathogenId,
    simulation,
    currentDay,
    isPlaying,
    playSpeed,
    setConfig,
    setPathogen,
    setOrigin,
    runSimulation,
    setCurrentDay,
    play,
    pause,
    setPlaySpeed,
  } = usePandemicStore();

  const { leftPanelOpen, setLeftPanelOpen } = useSimulationStore();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PathogenType['category'] | 'all'>('all');

  const animFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // Animation loop — mirrors ZombiePanel pattern
  useEffect(() => {
    if (!isPlaying || !simulation) {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const msPerDay = 1000 / playSpeed;

    const tick = (now: number) => {
      if (now - lastTickRef.current >= msPerDay) {
        lastTickRef.current = now;
        const next = currentDay + 1;
        if (next >= simulation.length) {
          pause();
          return;
        }
        setCurrentDay(next);
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPlaying, simulation, currentDay, playSpeed, setCurrentDay, pause]);

  const categories = useMemo(
    () => Array.from(new Set(PATHOGEN_PRESETS.map((p) => p.category))),
    []
  );

  const filteredPathogens = useMemo(
    () =>
      PATHOGEN_PRESETS.filter((p) => {
        const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
        const matchSearch =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
      }),
    [search, categoryFilter]
  );

  const totalDays = simulation ? simulation.length - 1 : config.simulationDays;

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
            <span className="text-base">🦠</span>
            <h2
              className="text-xs font-mono font-bold uppercase tracking-widest"
              style={{ color: '#ff66aa' }}
            >
              Pandemic Simulator
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

          {/* Pathogen Type */}
          <section>
            <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
              Pathogen Type
            </label>

            {/* Search */}
            <input
              type="text"
              placeholder="Search pathogens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-midnight border border-panel-border rounded px-3 py-1.5 text-xs font-mono text-text-primary focus:outline-none focus:border-pink-500/50 transition-colors mb-2"
            />

            {/* Category filter */}
            <div className="flex flex-wrap gap-1 mb-2">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-2 py-0.5 rounded text-[9px] font-mono border transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-pink-500/10 border-pink-500/60 text-pink-300'
                    : 'border-panel-border text-text-muted hover:text-text-primary'
                }`}
              >
                ALL
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono border transition-colors ${
                    categoryFilter === cat
                      ? 'border-current'
                      : 'border-panel-border text-text-muted hover:text-text-primary'
                  }`}
                  style={
                    categoryFilter === cat
                      ? {
                          background: CATEGORY_COLORS[cat] + '20',
                          color: CATEGORY_COLORS[cat],
                          borderColor: CATEGORY_COLORS[cat] + '60',
                        }
                      : {}
                  }
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {/* Pathogen list */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {filteredPathogens.map((pathogen) => {
                const isActive = selectedPathogenId === pathogen.id;
                const catColor = CATEGORY_COLORS[pathogen.category];
                return (
                  <button
                    key={pathogen.id}
                    onClick={() => setPathogen(pathogen.id)}
                    className={`w-full text-left p-2 rounded border transition-all ${
                      isActive
                        ? 'border-pink-500/70 bg-pink-500/10 shadow-[0_0_8px_rgba(255,102,170,0.2)]'
                        : 'border-panel-border bg-midnight hover:border-panel-border/80 hover:bg-panel-light/30'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: pathogen.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-[10px] font-mono font-bold truncate ${
                              isActive ? 'text-pink-300' : 'text-text-primary'
                            }`}
                          >
                            {pathogen.name}
                          </span>
                          <SkullRating level={pathogen.threatLevel} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="px-1 py-0.5 rounded text-[8px] font-mono"
                            style={{
                              background: catColor + '20',
                              color: catColor,
                              border: `1px solid ${catColor}50`,
                            }}
                          >
                            {CATEGORY_LABELS[pathogen.category]}
                          </span>
                          <span className="text-[9px] font-mono text-text-muted">
                            R0={pathogen.R0}
                          </span>
                          <span className="text-[9px] font-mono text-blast">
                            IFR={(pathogen.IFR * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="border-t border-panel-border" />

          {/* Outbreak Origin */}
          <section>
            <AddressLookup
              label="OUTBREAK ORIGIN"
              placeholder="City, landmark, coordinates..."
              onLocationFound={(lat, lng, name) => setOrigin(lat, lng, name)}
            />
            <div className="bg-midnight border border-panel-border rounded p-2 font-mono text-xs mt-2">
              <div className="flex justify-between">
                <span className="text-text-muted">LAT</span>
                <span style={{ color: '#ff66aa' }}>{config.originLat.toFixed(4)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">LNG</span>
                <span style={{ color: '#ff66aa' }}>{config.originLng.toFixed(4)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">ORIGIN</span>
                <span className="text-text-primary truncate ml-2">{config.originName}</span>
              </div>
            </div>
          </section>

          <div className="border-t border-panel-border" />

          {/* Parameters */}
          <section className="space-y-3">
            <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest">
              Parameters
            </label>

            {/* Patient Zero */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-mono text-text-muted">Patient Zero Count</span>
                <span className="text-[10px] font-mono" style={{ color: '#ff66aa' }}>
                  {config.patientZeroCount}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={1000}
                value={config.patientZeroCount}
                onChange={(e) => setConfig({ patientZeroCount: Number(e.target.value) })}
                className="w-full h-1.5 appearance-none bg-panel-light rounded-full outline-none cursor-pointer"
              />
            </div>

            {/* Population */}
            <div>
              <label className="text-[10px] font-mono text-text-muted block mb-1.5">
                Population
              </label>
              <div className="grid grid-cols-2 gap-1">
                {POPULATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setConfig({ populationSize: opt.val })}
                    className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
                      config.populationSize === opt.val
                        ? 'border-pink-500/60 text-pink-300 bg-pink-500/5'
                        : 'border-panel-border text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Public Health Response */}
            <div>
              <label className="text-[10px] font-mono text-text-muted block mb-1">
                Public Health Response
              </label>
              <select
                value={config.publicHealthResponse}
                onChange={(e) =>
                  setConfig({
                    publicHealthResponse: e.target.value as typeof config.publicHealthResponse,
                  })
                }
                className="w-full bg-midnight border border-panel-border rounded px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-pink-500/50"
              >
                {PH_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quarantine Effectiveness */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-mono text-text-muted">Quarantine Effectiveness</span>
                <span className="text-[10px] font-mono" style={{ color: '#ff66aa' }}>
                  {Math.round(config.quarantineEffectiveness * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={config.quarantineEffectiveness}
                onChange={(e) => setConfig({ quarantineEffectiveness: Number(e.target.value) })}
                className="w-full h-1.5 appearance-none bg-panel-light rounded-full outline-none cursor-pointer"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="vaccine-campaign"
                  checked={config.vaccineCampaign}
                  onChange={(e) => setConfig({ vaccineCampaign: e.target.checked })}
                  className="w-3.5 h-3.5 accent-pink-500"
                />
                <label htmlFor="vaccine-campaign" className="text-[10px] font-mono text-text-muted cursor-pointer">
                  Vaccine Campaign
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="intl-travel"
                  checked={config.internationalTravel}
                  onChange={(e) => setConfig({ internationalTravel: e.target.checked })}
                  className="w-3.5 h-3.5 accent-pink-500"
                />
                <label htmlFor="intl-travel" className="text-[10px] font-mono text-text-muted cursor-pointer">
                  International Travel
                </label>
              </div>
            </div>

            {/* Simulation Duration */}
            <div>
              <label className="text-[10px] font-mono text-text-muted block mb-1.5">
                Simulation Duration
              </label>
              <div className="grid grid-cols-4 gap-1">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setConfig({ simulationDays: d })}
                    className={`text-[10px] font-mono px-1 py-1 rounded border transition-colors ${
                      config.simulationDays === d
                        ? 'border-pink-500/60 text-pink-300 bg-pink-500/5'
                        : 'border-panel-border text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="border-t border-panel-border" />

          {/* Run button */}
          <button
            onClick={runSimulation}
            className="w-full py-2.5 rounded border font-mono text-xs font-bold uppercase tracking-widest transition-all"
            style={{
              background: '#ff66aa15',
              borderColor: '#ff66aa60',
              color: '#ff66aa',
              boxShadow: '0 0 12px rgba(255,102,170,0.1)',
            }}
          >
            ▶ Run Simulation
          </button>

          {/* Playback controls — show when simulation exists */}
          {simulation && (
            <div className="space-y-3">
              <div className="border-t border-panel-border pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-text-muted">
                    Day {currentDay} / {totalDays}
                  </span>
                  <div className="flex gap-1">
                    {([1, 7, 30, 90] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setPlaySpeed(s)}
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                          playSpeed === s
                            ? 'border-pink-500/60 text-pink-300 bg-pink-500/5'
                            : 'border-panel-border text-text-muted'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-2">
                  <button
                    onClick={() => setCurrentDay(0)}
                    className="p-1.5 rounded border border-panel-border text-text-muted hover:text-text-primary transition-colors"
                    title="Go to start"
                  >
                    <SkipBack size={12} />
                  </button>
                  <button
                    onClick={() => setCurrentDay(Math.max(0, currentDay - 1))}
                    className="p-1.5 rounded border border-panel-border text-text-muted hover:text-text-primary transition-colors"
                    title="Previous day"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => (isPlaying ? pause() : play())}
                    className="px-4 py-1.5 rounded border font-mono text-xs font-bold transition-all"
                    style={{
                      background: '#ff66aa15',
                      borderColor: '#ff66aa60',
                      color: '#ff66aa',
                    }}
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button
                    onClick={() => setCurrentDay(Math.min(totalDays, currentDay + 1))}
                    className="p-1.5 rounded border border-panel-border text-text-muted hover:text-text-primary transition-colors"
                    title="Next day"
                  >
                    ▶
                  </button>
                  <button
                    onClick={() => setCurrentDay(totalDays)}
                    className="p-1.5 rounded border border-panel-border text-text-muted hover:text-text-primary transition-colors"
                    title="Go to end"
                  >
                    <SkipForward size={12} />
                  </button>
                </div>

                <input
                  type="range"
                  min={0}
                  max={totalDays}
                  value={currentDay}
                  onChange={(e) => setCurrentDay(Number(e.target.value))}
                  className="w-full h-1.5 appearance-none rounded-full outline-none cursor-pointer"
                  style={{ accentColor: '#ff66aa' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-panel-border px-4 py-2 flex-shrink-0">
          <p className="text-[9px] font-mono text-text-muted/50 text-center">
            SEIR epidemiological model · Educational simulation
          </p>
        </div>
      </div>

      {/* Collapsed tab */}
      {!leftPanelOpen && (
        <button
          onClick={() => setLeftPanelOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-[900] bg-panel border border-l-0 border-panel-border rounded-r-lg px-1.5 py-4 hover:bg-panel-light transition-colors"
          title="Open Pandemic Configuration"
          style={{ color: '#ff66aa' }}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm">🦠</span>
            <span
              className="text-[9px] font-mono uppercase tracking-wider"
              style={{ writingMode: 'vertical-rl' }}
            >
              Pandemic
            </span>
          </div>
        </button>
      )}
    </>
  );
};
