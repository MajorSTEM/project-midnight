import React from 'react';
import { Skull, Heart, Radiation, Users } from 'lucide-react';
import type { SimulationResult } from '../../types';
import { formatNumber, formatCompact } from '../../utils/casualties';
import { formatDistance, formatArea } from '../../utils/nuclearPhysics';

interface CasualtyReportProps {
  result: SimulationResult;
}

export const CasualtyReport: React.FC<CasualtyReportProps> = ({ result }) => {
  const { effects, casualties } = result;

  const ringRows = [
    {
      label: 'Fireball',
      color: '#ffffff',
      bg: 'rgba(255,255,255,0.08)',
      radius: effects.fireballRadius,
      deaths: casualties.breakdown.fireballDeaths,
      deathRate: '100%',
    },
    {
      label: '20 psi Heavy Blast',
      color: '#ff4444',
      bg: 'rgba(255,68,68,0.08)',
      radius: effects.heavyBlastRadius,
      deaths: casualties.breakdown.heavyBlastDeaths,
      deathRate: '90%',
    },
    {
      label: '5 psi Moderate Damage',
      color: '#ff8800',
      bg: 'rgba(255,136,0,0.08)',
      radius: effects.moderateBlastRadius,
      deaths: casualties.breakdown.moderateBlastDeaths,
      deathRate: '50%',
    },
    {
      label: '1 psi Light Damage',
      color: '#ffdd00',
      bg: 'rgba(255,221,0,0.06)',
      radius: effects.lightBlastRadius,
      deaths: casualties.breakdown.lightBlastDeaths,
      deathRate: '10%',
    },
    {
      label: 'Thermal Burns',
      color: '#ff6600',
      bg: 'rgba(255,102,0,0.06)',
      radius: effects.thermalRadius,
      deaths: null,
      deathRate: 'injury',
    },
    {
      label: 'Lethal Radiation',
      color: '#00ff88',
      bg: 'rgba(0,255,136,0.06)',
      radius: effects.radiationRadius,
      deaths: null,
      deathRate: 'varies',
    },
  ];

  return (
    <div className="space-y-4 pb-4">

      {/* Casualty summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-midnight border border-blast/20 rounded p-3 text-center">
          <Skull size={16} className="text-blast mx-auto mb-1" />
          <div className="text-lg font-mono font-bold text-blast">
            {formatCompact(casualties.immediateDeaths)}
          </div>
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-wide">
            Immediate<br />Deaths
          </div>
        </div>
        <div className="bg-midnight border border-thermal/20 rounded p-3 text-center">
          <Heart size={16} className="text-thermal mx-auto mb-1" />
          <div className="text-lg font-mono font-bold text-thermal">
            {formatCompact(casualties.injured)}
          </div>
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-wide">
            Injured
          </div>
        </div>
        <div className="bg-midnight border border-terminal/20 rounded p-3 text-center">
          <Radiation size={16} className="text-terminal mx-auto mb-1" />
          <div className="text-lg font-mono font-bold text-terminal">
            {formatCompact(casualties.longTermRadiationDeaths)}
          </div>
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-wide">
            Radiation<br />Deaths
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="bg-panel-light border border-panel-border rounded p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-text-muted" />
          <span className="text-xs font-mono text-text-muted">Estimated Total Affected</span>
        </div>
        <span className="text-sm font-mono font-bold text-text-primary">
          {formatNumber(casualties.total)}
        </span>
      </div>

      {/* Disclaimer */}
      <div className="text-[10px] font-mono text-text-muted/60 bg-midnight border border-panel-border/40 rounded p-2">
        * Estimates based on assumed {result.effects.yieldKt < 100 ? 'urban' : 'city center'} population density of {' '}
        <span className="text-text-muted">2,500/km²</span>. Actual casualties depend on population distribution, time of day, shelter availability, and emergency response.
      </div>

      {/* Ring table */}
      <div>
        <h3 className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
          Blast Ring Analysis
        </h3>
        <div className="space-y-1">
          {ringRows.map((row, i) => (
            <div
              key={i}
              className="rounded p-2.5 border"
              style={{ background: row.bg, borderColor: row.color + '33' }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: row.color }}
                  />
                  <span className="text-xs font-mono font-medium" style={{ color: row.color }}>
                    {row.label}
                  </span>
                </div>
                {row.deaths !== null && (
                  <span className="text-[10px] font-mono text-blast">
                    ~{formatCompact(row.deaths)} deaths
                  </span>
                )}
              </div>
              <div className="flex gap-4 text-[10px] font-mono text-text-muted pl-3.5">
                <span>Radius: {formatDistance(row.radius)}</span>
                <span>Mortality: {row.deathRate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Affected area stats */}
      <div>
        <h3 className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
          Affected Areas
        </h3>
        <div className="bg-midnight rounded border border-panel-border overflow-hidden">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-panel-border">
                <th className="text-left px-3 py-2 text-text-muted font-normal">Zone</th>
                <th className="text-right px-3 py-2 text-text-muted font-normal">Area</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Total destruction', area: effects.fireballAreaKm2, color: '#ffffff' },
                { label: 'Heavy blast damage', area: effects.heavyBlastAreaKm2, color: '#ff4444' },
                { label: 'Moderate damage', area: effects.moderateBlastAreaKm2, color: '#ff8800' },
                { label: 'Light damage', area: effects.lightBlastAreaKm2, color: '#ffdd00' },
                {
                  label: 'Total blast affected',
                  area: Math.PI * effects.lightBlastRadius ** 2,
                  color: '#e6edf3',
                },
              ].map((row, i) => (
                <tr key={i} className="border-b border-panel-border/40 last:border-0">
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: row.color }} />
                      <span style={{ color: row.color }}>{row.label}</span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-right text-terminal">
                    {formatArea(row.area)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
