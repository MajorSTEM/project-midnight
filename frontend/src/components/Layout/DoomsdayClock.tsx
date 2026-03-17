import React from 'react';

export const DoomsdayClock: React.FC = () => {
  return (
    <a
      href="https://thebulletin.org/doomsday-clock/"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-xs group"
      title="Bulletin of Atomic Scientists — Doomsday Clock"
    >
      {/* Clock SVG */}
      <div className="relative w-7 h-7 flex-shrink-0">
        <svg viewBox="0 0 28 28" className="w-full h-full">
          {/* Clock face */}
          <circle cx="14" cy="14" r="12" fill="#1a0000" stroke="#ff4444" strokeWidth="1.5" />
          {/* Hour markers */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const inner = 9;
            const outer = 11;
            return (
              <line
                key={i}
                x1={14 + inner * Math.cos(angle)}
                y1={14 + inner * Math.sin(angle)}
                x2={14 + outer * Math.cos(angle)}
                y2={14 + outer * Math.sin(angle)}
                stroke="#ff4444"
                strokeWidth={i % 3 === 0 ? 1.5 : 0.75}
                opacity={0.8}
              />
            );
          })}
          {/* Minute hand - pointing at 11:58:31 (89 seconds to midnight) */}
          {/* 89 seconds = 1 min 29 sec → minute hand at ~58.5 min */}
          {(() => {
            const minuteAngle = ((58.5 / 60) * 360 - 90) * (Math.PI / 180);
            return (
              <line
                x1="14"
                y1="14"
                x2={14 + 9 * Math.cos(minuteAngle)}
                y2={14 + 9 * Math.sin(minuteAngle)}
                stroke="#ff4444"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            );
          })()}
          {/* Hour hand - pointing just before 12 */}
          {(() => {
            const hourAngle = ((11.975 / 12) * 360 - 90) * (Math.PI / 180);
            return (
              <line
                x1="14"
                y1="14"
                x2={14 + 6.5 * Math.cos(hourAngle)}
                y2={14 + 6.5 * Math.sin(hourAngle)}
                stroke="#ff4444"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })()}
          {/* Center dot */}
          <circle cx="14" cy="14" r="1.5" fill="#ff4444" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col">
        <span className="text-blast font-mono font-bold leading-none tracking-wider">
          89 SEC TO MIDNIGHT
        </span>
        <span className="text-text-muted text-[10px] leading-none group-hover:text-text-primary transition-colors">
          Doomsday Clock (2025) ↗
        </span>
      </div>

      {/* Pulsing dot */}
      <div className="relative flex h-2 w-2 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blast opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-blast" />
      </div>
    </a>
  );
};
