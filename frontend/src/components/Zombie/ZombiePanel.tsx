import React, { useEffect, useRef } from 'react';
import { ChevronRight, Play, Pause, SkipBack, SkipForward, RefreshCw } from 'lucide-react';
import { ZombieTypeSelector } from './ZombieTypeSelector';
import { useZombieStore } from '../../stores/zombieStore';
import { useSimulationStore } from '../../stores/simulationStore';

const MILITARY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'local', label: 'Local' },
  { value: 'national', label: 'National' },
  { value: 'full', label: 'Full Military' },
  { value: 'global', label: 'Global Coalition' },
] as const;

const BEHAVIOR_OPTIONS = [
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'fractured', label: 'Fractured' },
  { value: 'hostile', label: 'Hostile' },
  { value: 'armed', label: 'Armed Militia' },
] as const;

const DURATION_OPTIONS = [30, 90, 180, 365];

const POPULATION_OPTIONS = [
  { label: '100K (Town)', val: 100_000 },
  { label: '1M (City)', val: 1_000_000 },
  { label: '10M (Metro)', val: 10_000_000 },
  { label: '100M (Region)', val: 100_000_000 },
  { label: '8B (Global)', val: 8_000_000_000 },
];

function formatN(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

export const ZombiePanel: React.FC = () => {
  const {
    config,
    setConfig,
    setOrigin,
    runSimulation,
    simulation,
    currentDay,
    isPlaying,
    playSpeed,
    setCurrentDay,
    play,
    pause,
    setPlaySpeed,
  } = useZombieStore();

  const { leftPanelOpen, setLeftPanelOpen } = useSimulationStore();

  // Animation loop
  const animFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

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
            <span className="text-base">🧟</span>
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: '#44ff44' }}>
              Zombie Outbreak Sim
            </h2>
          </div>
          <button onClick={() => setLeftPanelOpen(false)} className="text-text-muted hover:text-text-primary">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* Zombie Type */}
          <section>
            <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
              Zombie Type
            </label>
            <ZombieTypeSelector />
          </section>

          <div className="border-t border-panel-border" />

          {/* Outbreak Origin */}
          <section>
            <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
              Outbreak Origin
            </label>
            <div className="bg-midnight border border-panel-border rounded p-2 font-mono text-xs">
              {config.origin ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-text-muted">LAT</span>
                    <span style={{ color: '#44ff44' }}>{config.origin.lat.toFixed(4)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">LNG</span>
                    <span style={{ color: '#44ff44' }}>{config.origin.lng.toFixed(4)}°</span>
                  </div>
                </>
              ) : (
                <p className="text-text-muted text-[10px] text-center py-1">
                  Click map to set outbreak origin
                </p>
              )}
            </div>
            {config.origin && (
              <button
                onClick={() => setOrigin({ lat: 40.7128, lng: -74.006 })}
                className="mt-1 text-[9px] font-mono text-text-muted hover:text-blast transition-colors"
              >
                Reset to NYC default
              </button>
            )}
          </section>

          <div className="border-t border-panel-border" />

          {/* Parameters */}
          <section className="space-y-3">
            <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest">
              Outbreak Parameters
            </label>

            {/* Patient Zero */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-mono text-text-muted">Patient Zero Count</span>
                <span className="text-[10px] font-mono" style={{ color: '#44ff44' }}>{config.patientZeroCount}</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={config.patientZeroCount}
                onChange={(e) => setConfig({ patientZeroCount: Number(e.target.value) })}
                className="w-full h-1.5 appearance-none bg-panel-light rounded-full outline-none cursor-pointer"
              />
            </div>

            {/* Population */}
            <div>
              <label className="text-[10px] font-mono text-text-muted block mb-1.5">Population</label>
              <div className="grid grid-cols-2 gap-1">
                {POPULATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setConfig({ populationSize: opt.val })}
                    className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
                      config.populationSize === opt.val
                        ? 'border-terminal/60 text-terminal bg-terminal/5'
                        : 'border-panel-border text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Military Response */}
            <div>
              <label className="text-[10px] font-mono text-text-muted block mb-1">Military Response</label>
              <select
                value={config.militaryResponse}
                onChange={(e) => setConfig({ militaryResponse: e.target.value as typeof config.militaryResponse })}
                className="w-full bg-midnight border border-panel-border rounded px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-terminal/50"
              >
                {MILITARY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Survivor Behavior */}
            <div>
              <label className="text-[10px] font-mono text-text-muted block mb-1">Survivor Behavior</label>
              <select
                value={config.survivorBehavior}
                onChange={(e) => setConfig({ survivorBehavior: e.target.value as typeof config.survivorBehavior })}
                className="w-full bg-midnight border border-panel-border rounded px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-terminal/50"
              >
                {BEHAVIOR_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Cure Research */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cure-research"
                checked={config.cureResearch}
                onChange={(e) => setConfig({ cureResearch: e.target.checked })}
                className="w-3.5 h-3.5 accent-terminal"
              />
              <label htmlFor="cure-research" className="text-[10px] font-mono text-text-muted cursor-pointer">
                Cure Research Program
              </label>
            </div>

            {/* Sim Duration */}
            <div>
              <label className="text-[10px] font-mono text-text-muted block mb-1.5">Simulation Duration</label>
              <div className="grid grid-cols-4 gap-1">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setConfig({ simulationDays: d })}
                    className={`text-[10px] font-mono px-1 py-1 rounded border transition-colors ${
                      config.simulationDays === d
                        ? 'border-terminal/60 text-terminal bg-terminal/5'
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

          {/* Run Button */}
          <button
            onClick={() => {
              if (!config.origin) {
                setOrigin({ lat: 40.7128, lng: -74.006 });
              }
              runSimulation();
            }}
            className="w-full py-2.5 rounded border font-mono text-xs font-bold uppercase tracking-widest transition-all"
            style={{
              background: '#44ff4415',
              borderColor: '#44ff4460',
              color: '#44ff44',
              boxShadow: '0 0 12px rgba(68,255,68,0.1)',
            }}
          >
            Run Simulation
          </button>

          {/* Controls — show when simulation exists */}
          {simulation && (
            <div className="space-y-3">
              <div className="border-t border-panel-border pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-text-muted">
                    Day {currentDay} / {totalDays}
                  </span>
                  <div className="flex gap-1">
                    {([1, 5, 10, 30] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setPlaySpeed(s)}
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                          playSpeed === s
                            ? 'border-terminal/60 text-terminal bg-terminal/5'
                            : 'border-panel-border text-text-muted'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Controls */}
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
                      background: '#44ff4415',
                      borderColor: '#44ff4460',
                      color: '#44ff44',
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

                {/* Timeline scrubber */}
                <input
                  type="range"
                  min={0}
                  max={totalDays}
                  value={currentDay}
                  onChange={(e) => setCurrentDay(Number(e.target.value))}
                  className="w-full h-1.5 appearance-none rounded-full outline-none cursor-pointer"
                  style={{ accentColor: '#44ff44' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-panel-border px-4 py-2 flex-shrink-0">
          <p className="text-[9px] font-mono text-text-muted/50 text-center">
            SEIRD-Z epidemiological model · Educational simulation
          </p>
        </div>
      </div>

      {/* Collapsed tab */}
      {!leftPanelOpen && (
        <button
          onClick={() => setLeftPanelOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-[900] bg-panel border border-l-0 border-panel-border rounded-r-lg px-1.5 py-4 hover:bg-panel-light transition-colors"
          title="Open Zombie Configuration"
          style={{ color: '#44ff44' }}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm">🧟</span>
            <span className="text-[9px] font-mono uppercase tracking-wider" style={{ writingMode: 'vertical-rl' }}>
              Zombie
            </span>
          </div>
        </button>
      )}
    </>
  );
};
