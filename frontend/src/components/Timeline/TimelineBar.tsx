import React, { useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { useTimelineStore } from '../../stores/timelineStore';
import { useSimulationStore } from '../../stores/simulationStore';
import { useZombieStore } from '../../stores/zombieStore';
import { usePandemicStore } from '../../stores/pandemicStore';
import { useAsteroidStore } from '../../stores/asteroidStore';
import { useEMPStore } from '../../stores/empStore';
import type { SimulationMode } from '../../types';

// ── Mode-specific config ──────────────────────────────────────────────────────
const MODE_CONFIG: Record<SimulationMode, {
  label: string;
  color: string;
  phases: { at: number; label: string }[];
  timeLabel: (progress: number) => string;
  ticksPerSecond: number; // how much progress advances per real second at 1x speed
}> = {
  nuclear: {
    label: 'NUCLEAR DETONATION',
    color: '#ff4444',
    phases: [
      { at: 0,    label: 'DETONATION' },
      { at: 0.15, label: 'FIREBALL' },
      { at: 0.35, label: 'BLAST WAVE' },
      { at: 0.65, label: 'THERMAL PULSE' },
      { at: 0.80, label: 'FALLOUT' },
    ],
    timeLabel: (p) => {
      const sec = p * 120;
      if (sec < 60) return `T+${sec.toFixed(1)}s`;
      return `T+${(sec / 60).toFixed(1)}min`;
    },
    ticksPerSecond: 1 / 120, // 120 second total duration at 1x
  },
  asteroid: {
    label: 'ASTEROID IMPACT',
    color: '#ff8800',
    phases: [
      { at: 0,    label: 'ENTRY' },
      { at: 0.05, label: 'IMPACT' },
      { at: 0.15, label: 'SHOCKWAVE' },
      { at: 0.40, label: 'CRATER FORM' },
      { at: 0.70, label: 'EJECTA PLUME' },
    ],
    timeLabel: (p) => {
      const sec = p * 300;
      if (sec < 60) return `T+${sec.toFixed(0)}s`;
      return `T+${(sec / 60).toFixed(1)}min`;
    },
    ticksPerSecond: 1 / 60, // 60s real time = full sim
  },
  emp: {
    label: 'EMP PULSE SEQUENCE',
    color: '#ffcc00',
    phases: [
      { at: 0,    label: 'BURST' },
      { at: 0.10, label: 'E1 PULSE' },
      { at: 0.35, label: 'E2 SURGE' },
      { at: 0.60, label: 'E3 GRID BURN' },
    ],
    timeLabel: (p) => {
      const ms = p * 60000; // 0 to 60 minutes
      if (ms < 1000) return `T+${ms.toFixed(0)}ms`;
      if (ms < 60000) return `T+${(ms/1000).toFixed(1)}s`;
      return `T+${(ms/60000).toFixed(0)}min`;
    },
    ticksPerSecond: 1 / 45,
  },
  zombie: {
    label: 'ZOMBIE OUTBREAK',
    color: '#44ff88',
    phases: [
      { at: 0,    label: 'PATIENT ZERO' },
      { at: 0.05, label: 'LOCAL SPREAD' },
      { at: 0.15, label: 'CITY OUTBREAK' },
      { at: 0.35, label: 'REGIONAL' },
      { at: 0.65, label: 'CIVILIZATION COLLAPSE' },
    ],
    timeLabel: (p) => `Day ${Math.round(p * 365)}`,
    ticksPerSecond: 1 / 30, // 30 real seconds = 365 sim days at 1x
  },
  pandemic: {
    label: 'PANDEMIC SPREAD',
    color: '#cc44ff',
    phases: [
      { at: 0,    label: 'EMERGENCE' },
      { at: 0.08, label: 'OUTBREAK' },
      { at: 0.20, label: 'EPIDEMIC' },
      { at: 0.40, label: 'PANDEMIC PEAK' },
      { at: 0.70, label: 'ENDEMIC / RECOVERY' },
    ],
    timeLabel: (p) => `Day ${Math.round(p * 365)}`,
    ticksPerSecond: 1 / 30,
  },
};

export const TimelineBar: React.FC = () => {
  const { isPlaying, speed, progress, play, pause, reset, setProgress, setSpeed } = useTimelineStore();
  const simulationMode = useSimulationStore((s) => s.simulationMode);
  const nuclearResult = useSimulationStore((s) => s.result);
  const zombieSimulation = useZombieStore((s) => s.simulation);
  const pandemicSimulation = usePandemicStore((s) => s.simulation);
  const asteroidResult = useAsteroidStore((s) => s.result);
  const empResult = useEMPStore((s) => s.result);

  // Determine if there's anything to animate
  const hasData = (() => {
    switch (simulationMode) {
      case 'nuclear': return nuclearResult !== null;
      case 'zombie': return zombieSimulation !== null;
      case 'pandemic': return pandemicSimulation !== null;
      case 'asteroid': return asteroidResult !== null;
      case 'emp': return empResult !== null;
      default: return false;
    }
  })();

  const cfg = MODE_CONFIG[simulationMode];
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Sync zombie/pandemic stores with our progress
  const setZombieDay = useZombieStore((s) => s.setCurrentDay);
  const setPandemicDay = usePandemicStore((s) => s.setCurrentDay);
  const zombieTotal = useZombieStore((s) => s.simulation?.length ?? 0);
  const pandemicTotal = usePandemicStore((s) => s.simulation?.length ?? 0);

  useEffect(() => {
    if (simulationMode === 'zombie' && zombieTotal > 0) {
      setZombieDay(Math.round(progress * (zombieTotal - 1)));
    } else if (simulationMode === 'pandemic' && pandemicTotal > 0) {
      setPandemicDay(Math.round(progress * (pandemicTotal - 1)));
    }
  }, [progress, simulationMode, zombieTotal, pandemicTotal, setZombieDay, setPandemicDay]);

  // Animation loop
  const tick = useCallback((timestamp: number) => {
    if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
    const delta = (timestamp - lastTimeRef.current) / 1000; // seconds
    lastTimeRef.current = timestamp;

    const advance = cfg.ticksPerSecond * speed * delta;
    useTimelineStore.setState((state) => {
      const next = state.progress + advance;
      if (next >= 1) {
        return { progress: 1, isPlaying: false };
      }
      return { progress: next };
    });

    if (useTimelineStore.getState().isPlaying) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [cfg.ticksPerSecond, speed]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPlaying, tick]);

  if (!hasData) return null;

  // Find current phase
  const currentPhase = [...cfg.phases].reverse().find((p) => progress >= p.at) ?? cfg.phases[0];

  const SPEEDS: Array<1 | 5 | 10 | 50> = [1, 5, 10, 50];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[600] pointer-events-none"
      style={{ paddingBottom: '0px' }}
    >
      <div className="flex justify-center pb-4 px-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-3xl rounded-xl border backdrop-blur-md px-5 py-3"
          style={{
            background: 'rgba(10,10,15,0.92)',
            borderColor: cfg.color + '40',
            boxShadow: `0 0 24px ${cfg.color}18`,
          }}
        >
          {/* Top row: mode label + phase + time */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-[9px] tracking-widest font-bold px-2 py-0.5 rounded"
                style={{ background: cfg.color + '20', color: cfg.color, border: `1px solid ${cfg.color}40` }}
              >
                {cfg.label}
              </span>
              <span className="font-mono text-[10px] text-text-muted">
                ▶ <span style={{ color: cfg.color }}>{currentPhase.label}</span>
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold" style={{ color: cfg.color }}>
              {cfg.timeLabel(progress)}
            </span>
          </div>

          {/* Progress bar with phase markers */}
          <div className="relative mb-3">
            {/* Phase tick marks */}
            {cfg.phases.map((phase) => (
              <div
                key={phase.label}
                className="absolute top-0 w-px h-3 opacity-30"
                style={{ left: `${phase.at * 100}%`, background: cfg.color }}
              />
            ))}
            {/* Track */}
            <div
              className="w-full h-2 rounded-full cursor-pointer relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                setProgress(p);
              }}
            >
              {/* Fill */}
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-none"
                style={{
                  width: `${progress * 100}%`,
                  background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
                  boxShadow: `0 0 8px ${cfg.color}60`,
                }}
              />
              {/* Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-md -translate-x-1/2"
                style={{
                  left: `${progress * 100}%`,
                  background: cfg.color,
                  boxShadow: `0 0 6px ${cfg.color}`,
                }}
              />
            </div>
            {/* Phase labels below bar */}
            <div className="relative h-4 mt-0.5">
              {cfg.phases.map((phase) => (
                <span
                  key={phase.label}
                  className="absolute font-mono text-[8px] opacity-40 -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `${phase.at * 100}%`, color: cfg.color }}
                >
                  {phase.label}
                </span>
              ))}
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3">
            {/* Reset */}
            <button
              onClick={reset}
              className="p-1.5 rounded text-text-muted hover:text-white transition-colors"
              title="Reset"
            >
              <RotateCcw size={14} />
            </button>

            {/* Play / Pause */}
            <button
              onClick={isPlaying ? pause : play}
              className="flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all"
              style={{
                borderColor: cfg.color,
                color: cfg.color,
                background: isPlaying ? cfg.color + '20' : 'transparent',
                boxShadow: isPlaying ? `0 0 12px ${cfg.color}40` : 'none',
              }}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying
                ? <Pause size={14} fill="currentColor" />
                : <Play size={14} fill="currentColor" />
              }
            </button>

            {/* Speed controls */}
            <div className="flex items-center gap-1 ml-1">
              <Zap size={11} className="text-text-muted" />
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className="font-mono text-[9px] px-1.5 py-0.5 rounded transition-colors"
                  style={{
                    background: speed === s ? cfg.color + '20' : 'transparent',
                    color: speed === s ? cfg.color : '#484f58',
                    border: `1px solid ${speed === s ? cfg.color + '50' : 'transparent'}`,
                  }}
                >
                  {s}×
                </button>
              ))}
            </div>

            {/* Progress percentage */}
            <div className="ml-auto font-mono text-[10px] text-text-muted">
              {Math.round(progress * 100)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
