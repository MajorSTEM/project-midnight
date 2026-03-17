import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { ZOMBIE_TYPES, type ZombieType } from '../../utils/zombieTypes';
import { useZombieStore } from '../../stores/zombieStore';

const CATEGORY_LABELS: Record<ZombieType['category'], string> = {
  undead: 'Undead',
  infected: 'Infected',
  parasite: 'Parasite',
  fungal: 'Fungal',
  nano: 'Nano',
  supernatural: 'Supernatural',
  mutant: 'Mutant',
};

const CATEGORY_COLORS: Record<ZombieType['category'], string> = {
  undead: '#7a5c3a',
  infected: '#cc2200',
  parasite: '#cc7700',
  fungal: '#667722',
  nano: '#0099ff',
  supernatural: '#553366',
  mutant: '#4a1a6b',
};

const SKULL = '☠';

function SkullRating({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <span className="text-[10px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ opacity: i < level ? 1 : 0.2, color: '#ff4444' }}>
          {SKULL}
        </span>
      ))}
    </span>
  );
}

const SPEED_BADGE: Record<ZombieType['speed'], string> = {
  shamble: 'SHAMBLE',
  walk: 'WALK',
  run: 'RUN',
  sprint: 'SPRINT',
  supernatural: 'SUPNAT',
};

const INTEL_BADGE: Record<ZombieType['intelligence'], string> = {
  mindless: 'MINDLESS',
  basic: 'BASIC',
  pack: 'PACK',
  tactical: 'TACTICAL',
  hive: 'HIVE',
};

export const ZombieTypeSelector: React.FC = () => {
  const { config, setConfig } = useZombieStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ZombieType['category'] | 'all'>('all');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(ZOMBIE_TYPES.map((z) => z.category)));
    return cats;
  }, []);

  const filtered = useMemo(() => {
    return ZOMBIE_TYPES.filter((z) => {
      const matchCat = categoryFilter === 'all' || z.category === categoryFilter;
      const matchSearch =
        !search ||
        z.name.toLowerCase().includes(search.toLowerCase()) ||
        z.source.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, categoryFilter]);

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search zombie types..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-midnight border border-panel-border rounded pl-7 pr-3 py-1.5 text-xs font-mono text-text-primary focus:outline-none focus:border-terminal/50 transition-colors"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
            categoryFilter === 'all'
              ? 'bg-terminal/10 border-terminal text-terminal'
              : 'border-panel-border text-text-muted hover:text-text-primary'
          }`}
        >
          ALL
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
              categoryFilter === cat
                ? 'border-terminal text-terminal'
                : 'border-panel-border text-text-muted hover:text-text-primary'
            }`}
            style={categoryFilter === cat ? { background: CATEGORY_COLORS[cat] + '20' } : {}}
          >
            {CATEGORY_LABELS[cat].toUpperCase()}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-[10px] font-mono text-text-muted">{filtered.length} types</p>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
        {filtered.map((zombie) => {
          const isActive = config.zombieTypeId === zombie.id;
          return (
            <button
              key={zombie.id}
              onClick={() => setConfig({ zombieTypeId: zombie.id })}
              className={`text-left p-2 rounded border transition-all ${
                isActive
                  ? 'border-terminal bg-terminal/5 shadow-[0_0_8px_rgba(0,255,136,0.2)]'
                  : 'border-panel-border bg-midnight hover:border-panel-border/80 hover:bg-panel-light/30'
              }`}
            >
              <div className="flex items-start gap-2">
                {/* Color swatch */}
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: zombie.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-mono font-bold truncate ${isActive ? 'text-terminal' : 'text-text-primary'}`}>
                      {zombie.name}
                    </span>
                    <SkullRating level={zombie.threatLevel} />
                  </div>
                  <div className="text-[9px] font-mono text-text-muted truncate">{zombie.source}</div>
                  <div className="flex gap-1 mt-0.5">
                    <span
                      className="px-1 py-0.5 rounded text-[8px] font-mono"
                      style={{
                        background: CATEGORY_COLORS[zombie.category] + '30',
                        color: CATEGORY_COLORS[zombie.category],
                        border: `1px solid ${CATEGORY_COLORS[zombie.category]}60`,
                      }}
                    >
                      {SPEED_BADGE[zombie.speed]}
                    </span>
                    <span className="px-1 py-0.5 rounded text-[8px] font-mono bg-panel-light border border-panel-border text-text-muted">
                      {INTEL_BADGE[zombie.intelligence]}
                    </span>
                    <span className="px-1 py-0.5 rounded text-[8px] font-mono bg-panel-light border border-panel-border text-blast">
                      R0={zombie.R0}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
