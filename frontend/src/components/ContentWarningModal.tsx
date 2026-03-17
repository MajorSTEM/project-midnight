import React, { useState } from 'react';
import { ShieldAlert, Radiation } from 'lucide-react';
import { useSimulationStore } from '../stores/simulationStore';

export const ContentWarningModal: React.FC = () => {
  const acceptWarning = useSimulationStore((s) => s.acceptWarning);
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="max-w-lg w-full bg-panel border border-panel-border rounded-xl overflow-hidden shadow-2xl"
        style={{ boxShadow: '0 0 60px rgba(255,68,68,0.15)' }}
      >
        {/* Header */}
        <div className="bg-blast/10 border-b border-blast/20 px-6 py-4 flex items-center gap-3">
          <div className="relative">
            <Radiation size={28} className="text-blast" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blast animate-ping" />
          </div>
          <div>
            <h1 className="text-base font-mono font-bold text-blast uppercase tracking-widest">
              Project Midnight
            </h1>
            <p className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
              Global Catastrophe Simulation Platform — v0.1
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex gap-3">
            <ShieldAlert size={20} className="text-thermal flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-mono font-bold text-text-primary mb-2">
                Content Advisory
              </h2>
              <p className="text-xs font-sans text-text-muted leading-relaxed">
                This platform is an <strong className="text-text-primary">educational simulation tool</strong> for
                civil preparedness and geopolitical awareness. Content depicts the effects of nuclear weapons based on{' '}
                <strong className="text-text-primary">declassified scientific data</strong> (Glasstone-Dolan, 1977;
                FEMA nuclear planning guidance).
              </p>
            </div>
          </div>

          <div className="bg-midnight border border-panel-border rounded-lg p-4 space-y-2.5">
            {[
              {
                icon: '☢',
                text: 'Casualty figures are presented to contextualize real-world risk, not as entertainment.',
              },
              {
                icon: '📚',
                text: 'Blast radii use declassified Glasstone-Dolan nuclear weapons effects scaling laws.',
              },
              {
                icon: '🚨',
                text: 'This simulation does not glorify or promote violence of any kind.',
              },
              {
                icon: '🏛',
                text: 'Built for civil defense awareness, policy education, and academic research.',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <span className="text-sm flex-shrink-0 mt-px">{item.icon}</span>
                <p className="text-xs font-sans text-text-muted leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer group">
            <div
              className={`
                w-4 h-4 flex-shrink-0 mt-0.5 rounded border transition-colors
                ${acknowledged
                  ? 'border-terminal bg-terminal/20'
                  : 'border-panel-border group-hover:border-terminal/50'
                }
              `}
              onClick={() => setAcknowledged(!acknowledged)}
            >
              {acknowledged && (
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
              className="text-xs font-mono text-text-muted leading-relaxed select-none"
              onClick={() => setAcknowledged(!acknowledged)}
            >
              I understand this is an educational simulation. I am 18+ years of age and
              will use this platform responsibly.
            </span>
          </label>
        </div>

        {/* Footer / CTA */}
        <div className="px-6 pb-5">
          <button
            onClick={() => acknowledged && acceptWarning()}
            disabled={!acknowledged}
            className={`
              w-full py-3 rounded-lg font-mono font-bold text-sm uppercase tracking-widest transition-all duration-200
              ${acknowledged
                ? 'bg-terminal/10 border border-terminal text-terminal hover:bg-terminal/20 cursor-pointer'
                : 'bg-panel-light border border-panel-border text-text-muted/40 cursor-not-allowed'
              }
            `}
          >
            {acknowledged ? '[ I Understand — Enter Simulation ]' : '[ Acknowledge to Continue ]'}
          </button>
          <p className="text-[10px] font-mono text-text-muted/40 text-center mt-2">
            This tool does not collect personal data. All simulation runs client-side.
          </p>
        </div>
      </div>
    </div>
  );
};
