import React, { useMemo } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useZombieStore } from '../../stores/zombieStore';
import { ZOMBIE_TYPES } from '../../utils/zombieTypes';
import type { DayState } from '../../utils/zombieEngine';

function formatN(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

type CivStatus = 'STABLE' | 'STRESSED' | 'CRISIS' | 'COLLAPSE' | 'EXTINCTION';

function getCivStatus(state: DayState, population: number): CivStatus {
  const pct = state.percentSurvivors;
  if (pct > 80) return 'STABLE';
  if (pct > 50) return 'STRESSED';
  if (pct > 20) return 'CRISIS';
  if (pct > 2) return 'COLLAPSE';
  return 'EXTINCTION';
}

const STATUS_COLORS: Record<CivStatus, string> = {
  STABLE: '#00ff88',
  STRESSED: '#ffcc00',
  CRISIS: '#ff8800',
  COLLAPSE: '#ff4400',
  EXTINCTION: '#ff0000',
};

interface SVGChartProps {
  simulation: DayState[];
  population: number;
}

const SVGChart: React.FC<SVGChartProps> = ({ simulation, population }) => {
  const W = 300;
  const H = 120;
  const PAD = { t: 8, r: 8, b: 16, l: 30 };

  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const n = simulation.length;

  function toX(i: number) {
    return PAD.l + (i / Math.max(1, n - 1)) * plotW;
  }

  function toY(val: number, max: number) {
    const v = Math.min(val, max);
    return PAD.t + plotH - (v / max) * plotH;
  }

  const maxVal = population;

  const lines: { key: keyof DayState; color: string; label: string }[] = [
    { key: 'susceptible', color: '#00ff88', label: 'S' },
    { key: 'exposed', color: '#ffcc00', label: 'E' },
    { key: 'infected', color: '#ff4444', label: 'I' },
    { key: 'recovered', color: '#4499ff', label: 'R' },
    { key: 'totalZombies', color: '#44ff44', label: 'Z' },
  ];

  function buildPath(key: keyof DayState) {
    const pts = simulation.map((d, i) => {
      const val = d[key] as number;
      return `${toX(i).toFixed(1)},${toY(val, maxVal).toFixed(1)}`;
    });
    return `M ${pts.join(' L ')}`;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ fontFamily: 'monospace' }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = PAD.t + plotH * (1 - frac);
        return (
          <g key={frac}>
            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#ffffff10" strokeWidth={0.5} />
            <text x={PAD.l - 2} y={y + 3} fontSize={5} fill="#666" textAnchor="end">
              {formatN(maxVal * frac)}
            </text>
          </g>
        );
      })}

      {/* Day labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const day = Math.round(frac * (n - 1));
        const x = PAD.l + frac * plotW;
        return (
          <text key={frac} x={x} y={H - 2} fontSize={5} fill="#666" textAnchor="middle">
            {day}d
          </text>
        );
      })}

      {/* Lines */}
      {lines.map(({ key, color }) => (
        <path
          key={key}
          d={buildPath(key)}
          stroke={color}
          strokeWidth={1}
          fill="none"
          opacity={0.85}
        />
      ))}

      {/* Legend */}
      {lines.map(({ key, color, label }, i) => (
        <g key={key} transform={`translate(${PAD.l + i * 52}, 4)`}>
          <line x1={0} y1={3} x2={10} y2={3} stroke={color} strokeWidth={1.5} />
          <text x={13} y={6} fontSize={5.5} fill={color}>{label}</text>
        </g>
      ))}
    </svg>
  );
};

interface Props {
  onClose?: () => void;
}

export const ZombieStats: React.FC<Props> = ({ onClose }) => {
  const { simulation, currentDay, config } = useZombieStore();
  const [collapsed, setCollapsed] = React.useState(false);

  const currentState = useMemo(() => {
    if (!simulation) return null;
    return simulation[currentDay] ?? null;
  }, [simulation, currentDay]);

  const zombieType = useMemo(
    () => ZOMBIE_TYPES.find((z) => z.id === config.zombieTypeId),
    [config.zombieTypeId]
  );

  if (!simulation || !currentState) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-text-muted font-mono text-xs text-center px-4">
          Configure a zombie outbreak in the left panel and click RUN SIMULATION.
        </p>
      </div>
    );
  }

  const civStatus = getCivStatus(currentState, config.populationSize);
  const statusColor = STATUS_COLORS[civStatus];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-panel-border flex-shrink-0">
        <div>
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: '#44ff44' }}>
            Zombie Outbreak Analysis
          </h2>
          <p className="text-[10px] font-mono text-text-muted mt-0.5">
            {zombieType?.name} · Day {currentState.day} / {config.simulationDays}
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-4">
        {/* Civilization Status */}
        <div
          className="rounded border p-2 text-center"
          style={{ borderColor: statusColor + '60', background: statusColor + '10' }}
        >
          <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-0.5">
            Civilization Status
          </p>
          <p
            className="text-sm font-mono font-bold tracking-widest"
            style={{ color: statusColor }}
          >
            {civStatus}
          </p>
          <p className="text-[10px] font-mono text-text-muted mt-0.5">
            {currentState.percentSurvivors.toFixed(1)}% survivors · Day {currentState.day}
          </p>
        </div>

        {/* Big numbers */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-midnight border border-panel-border rounded p-2">
            <p className="text-[9px] font-mono text-text-muted uppercase">Susceptible</p>
            <p className="text-sm font-mono font-bold text-terminal">{formatN(currentState.susceptible)}</p>
          </div>
          <div className="bg-midnight border border-red-900/60 rounded p-2">
            <p className="text-[9px] font-mono text-text-muted uppercase">Infected</p>
            <p className="text-sm font-mono font-bold text-red-400">{formatN(currentState.infected)}</p>
          </div>
          <div className="bg-midnight border border-panel-border rounded p-2">
            <p className="text-[9px] font-mono text-text-muted uppercase">Dead</p>
            <p className="text-sm font-mono font-bold" style={{ color: '#888' }}>{formatN(currentState.dead)}</p>
          </div>
          <div
            className="rounded p-2 border"
            style={{
              background: '#00ff4410',
              borderColor: '#00ff4460',
              boxShadow: '0 0 8px rgba(0,255,68,0.15)',
            }}
          >
            <p className="text-[9px] font-mono text-text-muted uppercase">Zombies</p>
            <p className="text-sm font-mono font-bold" style={{ color: '#00ff44' }}>{formatN(currentState.totalZombies)}</p>
          </div>
        </div>

        {/* Secondary stats */}
        <div className="space-y-1">
          {[
            { label: 'Exposed', val: formatN(currentState.exposed), color: '#ffcc00' },
            { label: 'Recovered', val: formatN(currentState.recovered), color: '#4499ff' },
            { label: 'Spread Radius', val: `${currentState.spreadRadiusKm.toFixed(1)} km`, color: '#00ff88' },
            { label: 'Infrastructure', val: `${currentState.infrastructureIntact.toFixed(0)}%`, color: currentState.infrastructureIntact > 50 ? '#00ff88' : '#ff8800' },
            { label: 'Military Eff.', val: `${currentState.militaryEffectiveness.toFixed(0)}%`, color: currentState.militaryEffectiveness > 50 ? '#4499ff' : '#ff4444' },
            { label: 'Cumulative Dead', val: formatN(currentState.cumulativeDeaths), color: '#ff6666' },
            ...(currentState.cureDaysRemaining !== null
              ? [{ label: 'Cure ETA', val: `${currentState.cureDaysRemaining}d`, color: '#00ffcc' }]
              : []),
          ].map(({ label, val, color }) => (
            <div key={label} className="flex justify-between items-center py-0.5">
              <span className="text-[10px] font-mono text-text-muted">{label}</span>
              <span className="text-[10px] font-mono font-bold" style={{ color }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Epidemic Chart */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
              Epidemic Curve
            </p>
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="text-text-muted hover:text-text-primary"
            >
              {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            </button>
          </div>
          {!collapsed && (
            <div className="bg-midnight border border-panel-border rounded p-2">
              <SVGChart simulation={simulation} population={config.populationSize} />
            </div>
          )}
        </div>

        {/* Zombie type info */}
        {zombieType && (
          <div className="bg-midnight border border-panel-border rounded p-2 space-y-1">
            <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-1">
              {zombieType.name}
            </p>
            <p className="text-[10px] font-mono text-text-muted italic">{zombieType.description}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {zombieType.weaknesses.slice(0, 3).map((w) => (
                <span key={w} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-terminal/10 border border-terminal/30 text-terminal">
                  -{w}
                </span>
              ))}
              {zombieType.strengths.slice(0, 3).map((s) => (
                <span key={s} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blast/10 border border-blast/30 text-blast">
                  +{s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
