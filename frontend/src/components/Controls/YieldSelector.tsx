import React from 'react';
import { ChevronDown } from 'lucide-react';
import { WEAPON_PRESETS } from '../../utils/nuclearPhysics';
import { useSimulationStore } from '../../stores/simulationStore';
import type { NuclearNation } from '../../types';

const MIN_KT = 1;
const MAX_KT = 100000; // 100 Mt

// Log scale slider conversion
function ktToSlider(kt: number): number {
  return ((Math.log(kt) - Math.log(MIN_KT)) / (Math.log(MAX_KT) - Math.log(MIN_KT))) * 100;
}

function sliderToKt(val: number): number {
  const kt = Math.exp(
    (val / 100) * (Math.log(MAX_KT) - Math.log(MIN_KT)) + Math.log(MIN_KT)
  );
  return Math.round(kt);
}

function formatYield(kt: number): string {
  if (kt < 1000) return `${kt} kt`;
  return `${(kt / 1000).toFixed(kt >= 10000 ? 0 : 2)} Mt`;
}

export const YieldSelector: React.FC = () => {
  const { config, setYield, setNation, setPresetName } = useSimulationStore();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const handlePresetSelect = (preset: typeof WEAPON_PRESETS[number]) => {
    if (preset.name === 'Custom') {
      setPresetName('Custom');
    } else {
      setYield(preset.yield as number);
      if (preset.nation) setNation(preset.nation as NuclearNation);
      setPresetName(preset.name);
    }
    setDropdownOpen(false);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const kt = sliderToKt(Number(e.target.value));
    setYield(kt);
    setPresetName('Custom');
  };

  const sliderVal = ktToSlider(config.yieldKt);

  // Determine blast category color
  const getYieldColor = () => {
    if (config.yieldKt <= 50) return 'text-yellow-400';
    if (config.yieldKt <= 500) return 'text-thermal';
    if (config.yieldKt <= 5000) return 'text-blast';
    return 'text-purple-400';
  };

  return (
    <div className="space-y-3">
      {/* Preset selector */}
      <div>
        <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">
          Weapon Preset
        </label>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-midnight border border-panel-border rounded text-xs font-mono text-text-primary hover:border-terminal/50 transition-colors"
          >
            <span className="truncate">{config.presetName ?? 'Select weapon...'}</span>
            <ChevronDown size={13} className={`flex-shrink-0 ml-2 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-panel border border-panel-border rounded overflow-hidden shadow-2xl max-h-64 overflow-y-auto">
              {WEAPON_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => handlePresetSelect(preset)}
                  className="w-full text-left px-3 py-2 text-xs font-mono hover:bg-panel-light border-b border-panel-border/50 last:border-0 transition-colors"
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-text-primary truncate">{preset.name}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {preset.yield && (
                        <span className="text-terminal">{formatYield(preset.yield as number)}</span>
                      )}
                      {preset.nation && (
                        <span className="text-text-muted text-[10px]">{preset.nation}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Yield display */}
      <div className="flex items-baseline justify-between">
        <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
          Yield
        </label>
        <span className={`text-2xl font-mono font-bold ${getYieldColor()}`}>
          {formatYield(config.yieldKt)}
        </span>
      </div>

      {/* Log scale slider */}
      <div>
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={sliderVal}
          onChange={handleSliderChange}
          className="w-full h-2 appearance-none bg-panel-light rounded-full outline-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #00ff88 0%, #ff8800 50%, #ff4444 75%, #a855f7 100%)`,
          }}
        />
        <div className="flex justify-between text-[9px] font-mono text-text-muted mt-1">
          <span>1 kt</span>
          <span>1 Mt</span>
          <span>100 Mt</span>
        </div>
      </div>

      {/* Manual yield input */}
      <div>
        <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">
          Manual Yield (kilotons)
        </label>
        <input
          type="number"
          min={MIN_KT}
          max={MAX_KT}
          value={config.yieldKt}
          onChange={(e) => {
            const val = Math.max(MIN_KT, Math.min(MAX_KT, Number(e.target.value)));
            setYield(val);
            setPresetName('Custom');
          }}
          className="w-full bg-midnight border border-panel-border rounded px-3 py-1.5 text-xs font-mono text-text-primary focus:outline-none focus:border-terminal/50 transition-colors"
        />
      </div>
    </div>
  );
};
