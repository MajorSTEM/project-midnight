import React, { useState } from 'react';
import { Package, Droplets, Utensils, Radio, Heart, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface CheckSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  items: string[];
}

const SECTIONS: CheckSection[] = [
  {
    id: 'water',
    title: 'Water (72-Hour Supply)',
    icon: <Droplets size={14} />,
    color: '#4fc3f7',
    items: [
      '1 gallon per person per day (drinking + sanitation)',
      'Store at least 3 gallons per person minimum',
      'Use food-grade containers with tight-fitting lids',
      'Store away from direct sunlight, heat sources',
      'Rotate stock every 6 months',
      'Water purification tablets (iodine or chlorine)',
      'Portable water filter (e.g., LifeStraw)',
      'Extra water for pets (1 quart/day for medium dog)',
    ],
  },
  {
    id: 'food',
    title: 'Food (72-Hour Supply)',
    icon: <Utensils size={14} />,
    color: '#aed581',
    items: [
      'Minimum 2,000 calories per adult per day',
      'Non-perishable, no-cook foods preferred',
      'Canned goods: beans, vegetables, fish, fruit',
      'High-calorie dense foods: peanut butter, nuts, dried fruit',
      'Energy/granola bars',
      'Manual can opener (critical)',
      'Comfort foods — important for morale',
      'Special dietary needs: infant formula, medications',
      'Paper plates, utensils (conserve water)',
    ],
  },
  {
    id: 'radiation',
    title: 'Nuclear/Radiation Preparedness',
    icon: <AlertTriangle size={14} />,
    color: '#00ff88',
    items: [
      'Potassium iodide (KI) tablets — blocks thyroid uptake of radioactive iodine',
      'Only use KI when directed by authorities',
      'NIOSH N95/P100 respirator masks',
      'Plastic sheeting and duct tape for window sealing',
      'Identify the most interior, lowest-floor room in your building',
      'Battery-powered NOAA Weather Radio for official alerts',
      'Radiation dosimeter or Geiger counter (optional but valuable)',
      'Understand "Shielding Factor" — concrete/brick provides best protection',
      'Know your local emergency management plan and evacuation routes',
      'Plan to shelter for 24 hours minimum (fallout reduces 90% in 7 hours)',
    ],
  },
  {
    id: 'communication',
    title: 'Communications & Information',
    icon: <Radio size={14} />,
    color: '#ffd54f',
    items: [
      'Battery-powered or hand-crank NOAA All Hazards Radio (WX emergency alerts)',
      'AM/FM portable radio (backup)',
      'Extra batteries (AA, AAA — labeled and dated)',
      'Charged power bank (min. 20,000 mAh) for phones',
      'Written list of emergency contacts (phones die)',
      'Physical map of your local area (GPS may be disrupted)',
      'Whistle for signaling if trapped',
      'Designate out-of-state contact — local lines may be congested',
      'Family meeting point if separated',
      'FEMA app downloaded with local alerts',
    ],
  },
  {
    id: 'firstaid',
    title: 'First Aid & Medical',
    icon: <Heart size={14} />,
    color: '#ef9a9a',
    items: [
      'Standard first aid kit (bandages, antiseptic, gauze)',
      '7-day supply of all prescription medications',
      'Over-the-counter: aspirin, ibuprofen, antidiarrheal, antacids',
      'Burn treatment: aloe vera gel, burn dressings',
      'Eye wash solution',
      'Nitrile gloves (2+ pairs)',
      'First aid manual (Red Cross or equivalent)',
      'Tourniquet and hemostatic gauze (advanced)',
      'CPR face shield',
      'Know nearest trauma center and alternate routes',
    ],
  },
  {
    id: 'kit',
    title: 'Go-Bag / Bug-Out Bag',
    icon: <Package size={14} />,
    color: '#ce93d8',
    items: [
      'Ready to grab in under 90 seconds',
      'Sturdy backpack (35-50L) per person',
      'Copies of essential documents (ID, passport, insurance) in waterproof bag',
      'Cash in small bills (ATMs will be down)',
      'USB/portable chargers',
      'Change of clothes and sturdy shoes',
      'Dust masks / N95 respirators (2-3 per person)',
      'Mylar emergency blanket',
      'Multi-tool or Swiss Army knife',
      'Headlamp with extra batteries',
      'Lightsticks (chemical, no battery needed)',
      'Personal hygiene kit (travel size)',
      'Pet supplies if applicable',
      'Printed family emergency plan',
    ],
  },
];

export const PreparednesGuide: React.FC = () => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['radiation']));
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleItem = (key: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalItems = SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
  const checkedCount = checkedItems.size;
  const progress = Math.round((checkedCount / totalItems) * 100);

  return (
    <div className="space-y-4 pb-4">

      {/* Progress bar */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
            Preparedness Level
          </span>
          <span className="text-[10px] font-mono text-terminal">
            {checkedCount}/{totalItems} ({progress}%)
          </span>
        </div>
        <div className="w-full bg-panel-light rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: progress < 30 ? '#ff4444' : progress < 60 ? '#ff8800' : progress < 90 ? '#ffdd00' : '#00ff88',
            }}
          />
        </div>
        <p className="text-[10px] font-mono text-text-muted/60 mt-1">
          {progress < 30 ? '⚠ Critical gaps — address nuclear/radiation section first'
            : progress < 60 ? '⚡ Basic preparations started — continue building'
            : progress < 90 ? '✓ Good preparedness — review remaining items'
            : '✅ Excellent — review and rotate supplies regularly'}
        </p>
      </div>

      <div className="bg-blast/5 border border-blast/20 rounded p-3">
        <p className="text-xs font-mono text-text-muted leading-relaxed">
          <span className="text-blast font-bold">IMPORTANT:</span>{' '}
          In a nuclear event, <span className="text-text-primary">time is critical</span>.
          Fallout arrives 15–30 minutes after detonation within 50 km. The following checklist
          is for <span className="text-terminal">advance preparation</span>, not during-event improvisation.
        </p>
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => {
        const sectionChecked = section.items.filter((_, i) =>
          checkedItems.has(`${section.id}-${i}`)
        ).length;
        const isOpen = openSections.has(section.id);

        return (
          <div
            key={section.id}
            className="border border-panel-border rounded overflow-hidden"
          >
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-3 bg-panel-light hover:bg-panel transition-colors"
            >
              <div className="flex items-center gap-2">
                <span style={{ color: section.color }}>{section.icon}</span>
                <span className="text-xs font-mono font-bold text-text-primary">{section.title}</span>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{
                    background: section.color + '15',
                    color: section.color,
                  }}
                >
                  {sectionChecked}/{section.items.length}
                </span>
              </div>
              {isOpen ? <ChevronUp size={13} className="text-text-muted" /> : <ChevronDown size={13} className="text-text-muted" />}
            </button>

            {isOpen && (
              <div className="bg-midnight p-3 space-y-1.5">
                {section.items.map((item, i) => {
                  const key = `${section.id}-${i}`;
                  const checked = checkedItems.has(key);
                  return (
                    <label
                      key={i}
                      className="flex items-start gap-2.5 cursor-pointer group"
                    >
                      <div
                        className={`
                          w-4 h-4 flex-shrink-0 mt-0.5 rounded border transition-colors
                          ${checked
                            ? 'border-terminal bg-terminal/20'
                            : 'border-panel-border group-hover:border-terminal/50'
                          }
                        `}
                        onClick={() => toggleItem(key)}
                      >
                        {checked && (
                          <svg viewBox="0 0 16 16" className="w-full h-full p-0.5">
                            <polyline
                              points="2,9 6,13 14,4"
                              fill="none"
                              stroke="#00ff88"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className={`text-xs font-mono leading-relaxed transition-colors ${
                          checked ? 'text-text-muted line-through' : 'text-text-primary'
                        }`}
                        onClick={() => toggleItem(key)}
                      >
                        {item}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Resources */}
      <div className="bg-midnight border border-panel-border rounded p-3 space-y-1.5">
        <h4 className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
          Official Resources
        </h4>
        {[
          { label: 'FEMA Ready.gov', url: 'https://www.ready.gov/nuclear-explosion' },
          { label: 'CDC Radiation Emergencies', url: 'https://emergency.cdc.gov/radiation/' },
          { label: 'Bulletin of Atomic Scientists', url: 'https://thebulletin.org/' },
          { label: 'NukeMap (CTBTO)', url: 'https://nuclearsecrecy.com/nukemap/' },
        ].map((r, i) => (
          <a
            key={i}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs font-mono text-terminal/80 hover:text-terminal transition-colors"
          >
            ↗ {r.label}
          </a>
        ))}
      </div>
    </div>
  );
};
