import React, { useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { usePandemicStore } from '../../stores/pandemicStore';
import { PATHOGEN_PRESETS } from '../../utils/pandemicEngine';
import type { PandemicDayState } from '../../utils/pandemicEngine';

function formatN(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

type OutbreakStatus =
  | 'STABLE'
  | 'OUTBREAK'
  | 'EPIDEMIC'
  | 'PANDEMIC'
  | 'COLLAPSE';

function getStatus(state: PandemicDayState, population: number): OutbreakStatus {
  const infectedFrac = state.infected / population;
  if (state.healthSystemCollapsed) return 'COLLAPSE';
  if (infectedFrac > 0.05) return 'PANDEMIC';
  if (infectedFrac > 0.005) return 'EPIDEMIC';
  if (infectedFrac > 0.0001) return 'OUTBREAK';
  return 'STABLE';
}

const STATUS_COLORS: Record<OutbreakStatus, string> = {
  STABLE: '#00ff88',
  OUTBREAK: '#ffcc00',
  EPIDEMIC: '#ff8800',
  PANDEMIC: '#ff4400',
  COLLAPSE: '#ff0000',
};

interface SVGChartProps {
  simulation: PandemicDayState[];
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

  const lines: { key: keyof PandemicDayState; color: string; label: string }[] = [
    { key: 'susceptible', color: '#4488ff', label: 'S' },
    { key: 'infected', color: '#ff4444', label: 'I' },
    { key: 'hospitalized', color: '#ff8800', label: 'H' },
    { key: 'dead', color: '#888888', label: 'D' },
    { key: 'recovered', color: '#00ff88', label: 'R' },
  ];

  function buildPath(key: keyof PandemicDayState) {
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
          key={key as string}
          d={buildPath(key)}
          stroke={color}
          strokeWidth={1}
          fill="none"
          opacity={0.85}
        />
      ))}

      {/* Legend */}
      {lines.map(({ key, color, label }, i) => (
        <g key={key as string} transform={`translate(${PAD.l + i * 52}, 4)`}>
          <line x1={0} y1={3} x2={10} y2={3} stroke={color} strokeWidth={1.5} />
          <text x={13} y={6} fontSize={5.5} fill={color}>
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
};

interface ProgressBarProps {
  value: number;
  max: number;
  color: string;
  overflowColor?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  color,
  overflowColor = '#ff0000',
}) => {
  const pct = Math.min(100, (value / max) * 100);
  const isOver = value > max;
  return (
    <div className="h-2 bg-panel-light rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct}%`,
          backgroundColor: isOver ? overflowColor : color,
        }}
      />
    </div>
  );
};

interface Props {
  onClose?: () => void;
}

export const PandemicStats: React.FC<Props> = ({ onClose }) => {
  const { simulation, currentDay, config, selectedPathogenId } = usePandemicStore();
  const [chartCollapsed, setChartCollapsed] = React.useState(false);

  const currentState = useMemo(() => {
    if (!simulation) return null;
    return simulation[currentDay] ?? null;
  }, [simulation, currentDay]);

  const pathogen = useMemo(
    () => PATHOGEN_PRESETS.find((p) => p.id === selectedPathogenId),
    [selectedPathogenId]
  );

  if (!simulation || !currentState) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-text-muted font-mono text-xs text-center px-4">
          Configure a pandemic outbreak in the left panel and click RUN SIMULATION.
        </p>
      </div>
    );
  }

  const status = getStatus(currentState, config.populationSize);
  const statusColor = STATUS_COLORS[status];

  const icuCapacity = config.populationSize * 0.0002;
  const icuPct = Math.round((currentState.icu / icuCapacity) * 100);

  const herdThreshold = pathogen ? Math.round((1 - 1 / pathogen.R0) * 100) : 60;
  const immunePct = Math.round(
    ((currentState.recovered + currentState.dead + currentState.vaccineCoveragePercent / 100 * config.populationSize) /
      config.populationSize) *
      100
  );

  const effectiveRColor = currentState.effectiveR < 1 ? '#00ff88' : '#ff4444';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-panel-border flex-shrink-0">
        <div>
          <h2
            className="text-xs font-mono font-bold uppercase tracking-widest"
            style={{ color: '#ff66aa' }}
          >
            🦠 Pandemic Status — Day {currentState.day}
          </h2>
          <p className="text-[10px] font-mono text-text-muted mt-0.5">
            {pathogen?.name ?? config.pathogenId} · {config.originName}
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
            ✕
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-4 pb-4">

        {/* Status badge */}
        <div
          className="rounded border p-2 text-center"
          style={{ borderColor: statusColor + '60', background: statusColor + '10' }}
        >
          <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-0.5">
            Outbreak Status
          </p>
          <p className="text-sm font-mono font-bold tracking-widest" style={{ color: statusColor }}>
            {status}
          </p>
          {currentState.healthSystemCollapsed && (
            <p className="text-[9px] font-mono text-red-400 mt-0.5">
              ⚠ HEALTH SYSTEM COLLAPSED
            </p>
          )}
        </div>

        {/* Big 4 numbers */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-midnight border border-panel-border rounded p-2">
            <p className="text-[9px] font-mono text-text-muted uppercase">Susceptible</p>
            <p className="text-sm font-mono font-bold" style={{ color: '#4488ff' }}>
              {formatN(currentState.susceptible)}
            </p>
          </div>
          <div className="bg-midnight border border-yellow-900/60 rounded p-2">
            <p className="text-[9px] font-mono text-text-muted uppercase">Exposed</p>
            <p className="text-sm font-mono font-bold text-yellow-400">
              {formatN(currentState.exposed)}
            </p>
          </div>
          <div className="bg-midnight border border-red-900/60 rounded p-2">
            <p className="text-[9px] font-mono text-text-muted uppercase">Infected</p>
            <p className="text-sm font-mono font-bold text-red-400">
              {formatN(currentState.infected)}
            </p>
          </div>
          <div className="bg-midnight border border-panel-border rounded p-2">
            <p className="text-[9px] font-mono text-text-muted uppercase">Dead</p>
            <p className="text-sm font-mono font-bold" style={{ color: '#888' }}>
              {formatN(currentState.dead)}
            </p>
          </div>
        </div>

        {/* Secondary stats */}
        <div className="space-y-1">
          {[
            {
              label: 'Hospitalized',
              val: formatN(currentState.hospitalized),
              color: '#ff8800',
            },
            { label: 'ICU', val: formatN(currentState.icu), color: '#ff4444' },
            { label: 'Recovered', val: formatN(currentState.recovered), color: '#00ff88' },
            {
              label: 'Cumulative Infected',
              val: formatN(currentState.cumulativeInfected),
              color: '#ff8844',
            },
            {
              label: 'Cumulative Dead',
              val: formatN(currentState.cumulativeDead),
              color: '#ff6666',
            },
            {
              label: 'Spread Radius',
              val: `${currentState.spreadRadiusKm.toFixed(1)} km`,
              color: '#ff66aa',
            },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex justify-between items-center py-0.5">
              <span className="text-[10px] font-mono text-text-muted">{label}</span>
              <span className="text-[10px] font-mono font-bold" style={{ color }}>
                {val}
              </span>
            </div>
          ))}
        </div>

        {/* Health System */}
        <section>
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
            Health System
          </p>
          <div className="bg-midnight border border-panel-border rounded p-3 space-y-2">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-mono text-text-muted">ICU Occupancy</span>
                <span
                  className="text-[10px] font-mono font-bold"
                  style={{ color: icuPct > 100 ? '#ff0000' : icuPct > 75 ? '#ff8800' : '#00ff88' }}
                >
                  {icuPct}%
                </span>
              </div>
              <ProgressBar
                value={currentState.icu}
                max={icuCapacity}
                color="#ff8800"
                overflowColor="#ff0000"
              />
              {icuPct > 100 && (
                <p className="text-[9px] font-mono text-red-400 mt-1">
                  ⚠ CAPACITY EXCEEDED — mortality rising
                </p>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-text-muted">Infrastructure</span>
              <span
                className="text-[10px] font-mono font-bold"
                style={{
                  color:
                    currentState.infrastructureIntact > 0.8
                      ? '#00ff88'
                      : currentState.infrastructureIntact > 0.5
                      ? '#ffcc00'
                      : '#ff4444',
                }}
              >
                {Math.round(currentState.infrastructureIntact * 100)}%
              </span>
            </div>
          </div>
        </section>

        {/* Effective R */}
        <section>
          <div className="bg-midnight border border-panel-border rounded p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-text-muted">Effective R (Rt)</span>
              <span
                className="text-sm font-mono font-bold"
                style={{ color: effectiveRColor }}
              >
                {currentState.effectiveR.toFixed(2)}
              </span>
            </div>
            {pathogen && (
              <div className="flex justify-between">
                <span className="text-[10px] font-mono text-text-muted">Base R0</span>
                <span className="text-[10px] font-mono text-text-primary">{pathogen.R0}</span>
              </div>
            )}
            <p className="text-[9px] font-mono" style={{ color: effectiveRColor }}>
              {currentState.effectiveR < 1
                ? '▼ Declining — outbreak under control'
                : '▲ Growing — epidemic spreading'}
            </p>
          </div>
        </section>

        {/* Herd Immunity */}
        <section>
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
            Population Immunity
          </p>
          <div className="bg-midnight border border-panel-border rounded p-3 space-y-2">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-mono text-text-muted">
                  Herd Immunity {immunePct}% / {herdThreshold}% threshold
                </span>
                {currentState.herdImmunityReached && (
                  <span className="text-[9px] font-mono text-terminal">REACHED</span>
                )}
              </div>
              <ProgressBar
                value={immunePct}
                max={herdThreshold}
                color={currentState.herdImmunityReached ? '#00ff88' : '#ff66aa'}
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-mono text-text-muted">
                  Vaccine Coverage
                </span>
                <span className="text-[10px] font-mono" style={{ color: '#4488ff' }}>
                  {currentState.vaccineCoveragePercent}%
                </span>
              </div>
              <ProgressBar value={currentState.vaccineCoveragePercent} max={100} color="#4488ff" />
            </div>
          </div>
        </section>

        {/* Epidemic Curve */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
              Epidemic Curve
            </p>
            <button
              onClick={() => setChartCollapsed((c) => !c)}
              className="text-text-muted hover:text-text-primary"
            >
              {chartCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            </button>
          </div>
          {!chartCollapsed && (
            <div className="bg-midnight border border-panel-border rounded p-2">
              <SVGChart simulation={simulation} population={config.populationSize} />
            </div>
          )}
        </div>

        {/* Pathogen info */}
        {pathogen && (
          <div className="bg-midnight border border-panel-border rounded p-2 space-y-1">
            <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-1">
              {pathogen.name}
            </p>
            <p className="text-[10px] font-mono text-text-muted italic">{pathogen.description}</p>
            {pathogen.historicalIFR && (
              <p className="text-[9px] font-mono text-blast mt-1">
                Historical IFR: {pathogen.historicalIFR}
              </p>
            )}
            <div className="flex flex-wrap gap-1 mt-1">
              {pathogen.aerosolTransmission && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blast/10 border border-blast/30 text-blast">
                  aerosol
                </span>
              )}
              {pathogen.dropletTransmission && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blast/10 border border-blast/30 text-blast">
                  droplet
                </span>
              )}
              {pathogen.contactTransmission && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blast/10 border border-blast/30 text-blast">
                  contact
                </span>
              )}
              {pathogen.treatmentAvailable && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-terminal/10 border border-terminal/30 text-terminal">
                  treatment available
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
