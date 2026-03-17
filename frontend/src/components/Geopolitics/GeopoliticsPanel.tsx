import React, { useEffect, useState } from 'react';
import { X, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';
import type { EscalationData } from '../../types';

type GeoTab = 'intel' | 'arsenal' | 'treaties' | 'history';

function scoreColor(score: number): string {
  if (score <= 30) return '#00ff88';
  if (score <= 60) return '#ffbb00';
  if (score <= 80) return '#ff8800';
  return '#ff4444';
}

function levelBadgeStyle(level: EscalationData['level']): React.CSSProperties {
  const colors: Record<EscalationData['level'], string> = {
    LOW: '#00ff88',
    ELEVATED: '#ffbb00',
    HIGH: '#ff8800',
    CRITICAL: '#ff4444',
  };
  const color = colors[level];
  return {
    color,
    borderColor: color + '60',
    backgroundColor: color + '12',
  };
}

function formatRelativeTime(isoString: string): string {
  try {
    const now = Date.now();
    const then = new Date(isoString).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  } catch {
    return '';
  }
}

// ─── INTEL TAB ───────────────────────────────────────────────────────────────
const IntelTab: React.FC = () => {
  const { escalationData, fetchEscalation } = useSimulationStore();
  const isCritical = escalationData?.level === 'CRITICAL';
  const score = escalationData?.score ?? 0;
  const color = scoreColor(score);

  return (
    <div className="space-y-5">
      {/* Escalation Score */}
      <div
        className="rounded-lg border p-5 text-center"
        style={{ borderColor: color + '40', background: color + '08' }}
      >
        <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: '#8b949e' }}>
          Global Escalation Score
        </p>
        <div
          className="font-mono font-bold leading-none"
          style={{
            fontSize: '4rem',
            color,
            animation: isCritical ? 'pulse 1s infinite' : 'none',
          }}
        >
          {score}
        </div>
        <div
          className="inline-block mt-3 px-4 py-1 rounded border font-mono font-bold text-xs uppercase tracking-widest"
          style={levelBadgeStyle(escalationData?.level ?? 'LOW')}
        >
          {escalationData?.level ?? 'LOW'}
        </div>
        {escalationData?.lastUpdated && (
          <p className="font-mono text-[10px] mt-2" style={{ color: '#8b949e' }}>
            Last updated: {formatRelativeTime(escalationData.lastUpdated)}
            {' '}· {new Date(escalationData.lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Score legend */}
      <div className="rounded border p-3" style={{ borderColor: '#1e2a38', background: '#0a0a0f' }}>
        <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: '#8b949e' }}>
          Score Legend
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { range: '0–30', label: 'LOW', color: '#00ff88' },
            { range: '31–60', label: 'ELEVATED', color: '#ffbb00' },
            { range: '61–80', label: 'HIGH', color: '#ff8800' },
            { range: '81–100', label: 'CRITICAL', color: '#ff4444' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="font-mono font-bold text-xs" style={{ color: item.color }}>{item.label}</div>
              <div className="font-mono text-[10px]" style={{ color: '#8b949e' }}>{item.range}</div>
            </div>
          ))}
        </div>
      </div>

      {/* News headlines */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-xs uppercase tracking-widest" style={{ color: '#8b949e' }}>
            Intelligence Feed
          </p>
          <button
            onClick={fetchEscalation}
            className="flex items-center gap-1.5 px-3 py-1 rounded border font-mono text-xs transition-colors"
            style={{ borderColor: '#00ff88' + '40', color: '#00ff88', background: '#00ff88' + '08' }}
          >
            <RefreshCw size={11} />
            Refresh
          </button>
        </div>

        {!escalationData && (
          <div className="text-center py-8">
            <div className="font-mono text-xs animate-pulse" style={{ color: '#8b949e' }}>
              Fetching intelligence data...
            </div>
          </div>
        )}

        {escalationData && escalationData.articles.length === 0 && (
          <div className="rounded border p-4 text-center" style={{ borderColor: '#1e2a38' }}>
            <p className="font-mono text-xs" style={{ color: '#8b949e' }}>
              No recent articles found. API quota may be exhausted.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {(escalationData?.articles ?? []).map((article, i) => (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded border p-3 transition-colors group"
              style={{ borderColor: '#1e2a38', background: '#0a0a0f' }}
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className="font-mono text-xs leading-snug group-hover:text-white transition-colors"
                  style={{ color: '#e6edf3' }}
                >
                  {article.title}
                </p>
                <ExternalLink size={11} className="flex-shrink-0 mt-0.5" style={{ color: '#8b949e' }} />
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="font-mono text-[10px]" style={{ color: '#00ff88' }}>
                  {article.source?.name ?? 'Unknown Source'}
                </span>
                <span style={{ color: '#8b949e' }} className="font-mono text-[10px]">·</span>
                <span className="font-mono text-[10px]" style={{ color: '#8b949e' }}>
                  {formatRelativeTime(article.publishedAt)}
                </span>
              </div>
              {article.description && (
                <p className="font-mono text-[10px] mt-1 line-clamp-2" style={{ color: '#8b949e' }}>
                  {article.description}
                </p>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── ARSENAL TAB ─────────────────────────────────────────────────────────────
const ARSENAL_DATA = [
  { flag: '🇺🇸', nation: 'USA',       total: 5550, deployed: 1670, strategic: 1419, tactical: 100,  status: 'ACTIVE',      statusColor: '#00ff88' },
  { flag: '🇷🇺', nation: 'Russia',    total: 6257, deployed: 1710, strategic: 1674, tactical: 36,   status: 'ACTIVE',      statusColor: '#00ff88' },
  { flag: '🇨🇳', nation: 'China',     total: 500,  deployed: null, strategic: null, tactical: null, status: 'MODERNIZING', statusColor: '#ffbb00' },
  { flag: '🇫🇷', nation: 'France',    total: 290,  deployed: 280,  strategic: 280,  tactical: null, status: 'ACTIVE',      statusColor: '#00ff88' },
  { flag: '🇬🇧', nation: 'UK',        total: 225,  deployed: 120,  strategic: 120,  tactical: null, status: 'ACTIVE',      statusColor: '#00ff88' },
  { flag: '🇮🇳', nation: 'India',     total: 172,  deployed: null, strategic: null, tactical: null, status: 'DEVELOPING',  statusColor: '#ffbb00' },
  { flag: '🇵🇰', nation: 'Pakistan',  total: 170,  deployed: null, strategic: null, tactical: null, status: 'DEVELOPING',  statusColor: '#ffbb00' },
  { flag: '🇮🇱', nation: 'Israel',    total: 90,   deployed: null, strategic: null, tactical: null, status: 'UNDISCLOSED', statusColor: '#8b949e' },
  { flag: '🇰🇵', nation: 'N. Korea',  total: 50,   deployed: null, strategic: null, tactical: null, status: 'TESTING',     statusColor: '#ff4444' },
];

const maxTotal = Math.max(...ARSENAL_DATA.map((d) => d.total));

const ArsenalTab: React.FC = () => (
  <div className="space-y-4">
    <div className="rounded border p-3" style={{ borderColor: '#1e2a38', background: '#0a0a0f' }}>
      <p className="font-mono font-bold text-xs uppercase tracking-widest mb-0.5" style={{ color: '#00ff88' }}>
        Global Nuclear Arsenals
      </p>
      <p className="font-mono text-[10px]" style={{ color: '#8b949e' }}>
        Last updated: SIPRI Yearbook 2024
      </p>
    </div>

    {/* Bar chart */}
    <div className="space-y-2">
      {ARSENAL_DATA.map((d) => (
        <div key={d.nation}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-mono text-xs" style={{ color: '#e6edf3' }}>
              {d.flag} {d.nation}
            </span>
            <span className="font-mono text-xs font-bold" style={{ color: d.statusColor }}>
              {d.total.toLocaleString()}
            </span>
          </div>
          <div className="rounded overflow-hidden" style={{ background: '#1e2a38', height: '6px' }}>
            <div
              className="h-full rounded transition-all"
              style={{
                width: `${(d.total / maxTotal) * 100}%`,
                background: d.statusColor,
                opacity: 0.7,
              }}
            />
          </div>
        </div>
      ))}
    </div>

    {/* Detailed table */}
    <div className="rounded border overflow-hidden" style={{ borderColor: '#1e2a38' }}>
      <div
        className="grid font-mono text-[9px] uppercase tracking-widest px-3 py-2 border-b"
        style={{
          gridTemplateColumns: '1fr 50px 60px 60px 55px 80px',
          color: '#8b949e',
          borderColor: '#1e2a38',
          background: '#0d1117',
        }}
      >
        <span>Nation</span>
        <span className="text-right">Total</span>
        <span className="text-right">Deployed</span>
        <span className="text-right">Strategic</span>
        <span className="text-right">Tactical</span>
        <span className="text-right">Status</span>
      </div>
      {ARSENAL_DATA.map((d) => (
        <div
          key={d.nation}
          className="grid font-mono text-[10px] px-3 py-2 border-b items-center"
          style={{
            gridTemplateColumns: '1fr 50px 60px 60px 55px 80px',
            borderColor: '#1e2a38',
            background: '#0a0a0f',
          }}
        >
          <span style={{ color: '#e6edf3' }}>{d.flag} {d.nation}</span>
          <span className="text-right font-bold" style={{ color: '#e6edf3' }}>{d.total.toLocaleString()}</span>
          <span className="text-right" style={{ color: '#8b949e' }}>{d.deployed?.toLocaleString() ?? '—'}</span>
          <span className="text-right" style={{ color: '#8b949e' }}>{d.strategic?.toLocaleString() ?? '—'}</span>
          <span className="text-right" style={{ color: '#8b949e' }}>{d.tactical?.toLocaleString() ?? '—'}</span>
          <span className="text-right font-bold text-[9px]" style={{ color: d.statusColor }}>
            {d.status === 'ACTIVE' ? '● ' : d.status === 'TESTING' ? '⚠ ' : d.status === 'UNDISCLOSED' ? '? ' : '△ '}
            {d.status}
          </span>
        </div>
      ))}
    </div>

    <p className="font-mono text-[9px]" style={{ color: '#8b949e' }}>
      Data: SIPRI Yearbook 2024. Deployed = operationally deployed warheads. Some figures estimated.
    </p>
  </div>
);

// ─── TREATIES TAB ─────────────────────────────────────────────────────────────
const TREATIES = [
  {
    name: 'NEW START (2010)',
    status: 'SUSPENDED',
    statusIcon: '⚠',
    statusColor: '#ffbb00',
    detail: 'Russia suspended participation Feb 2023',
    parties: 'USA, Russia',
    extra: 'Warhead limit: 1,550 deployed strategic. No longer verified; limits technically in force.',
  },
  {
    name: 'Non-Proliferation Treaty (NPT, 1968)',
    status: 'IN FORCE',
    statusIcon: '✓',
    statusColor: '#00ff88',
    detail: '191 state parties',
    parties: 'Multilateral',
    extra: 'India, Pakistan, Israel never signed. North Korea withdrew 2003.',
  },
  {
    name: 'Comprehensive Test Ban Treaty (CTBT, 1996)',
    status: 'NOT IN FORCE',
    statusIcon: '⚠',
    statusColor: '#ffbb00',
    detail: 'Not ratified by 8 Annex 2 states',
    parties: '178 ratified',
    extra: 'Missing: USA, China, India, Pakistan, Egypt, Iran, Israel, N. Korea.',
  },
  {
    name: 'JCPOA — Iran Nuclear Deal (2015)',
    status: 'COLLAPSED',
    statusIcon: '⚠',
    statusColor: '#ff8800',
    detail: 'USA withdrew 2018, Iran exceeded limits',
    parties: 'USA, EU3, Russia, China, Iran',
    extra: 'Current: Negotiations ongoing, no formal agreement in place.',
  },
  {
    name: 'INF Treaty (1987)',
    status: 'TERMINATED',
    statusIcon: '✗',
    statusColor: '#ff4444',
    detail: 'USA & Russia both withdrew 2019',
    parties: 'USA, Russia',
    extra: 'Medium-range missiles now unconstrained by international law.',
  },
  {
    name: 'Open Skies Treaty (1992)',
    status: 'TERMINATED',
    statusIcon: '✗',
    statusColor: '#ff4444',
    detail: 'USA withdrew 2020, Russia 2021',
    parties: '35 original signatories',
    extra: 'Aerial surveillance verification regime ended.',
  },
];

const TreatiesTab: React.FC = () => (
  <div className="space-y-3">
    <div className="rounded border p-3" style={{ borderColor: '#1e2a38', background: '#0a0a0f' }}>
      <p className="font-mono font-bold text-xs uppercase tracking-widest" style={{ color: '#ff8800' }}>
        Arms Control Treaty Status
      </p>
    </div>

    {TREATIES.map((t) => (
      <div
        key={t.name}
        className="rounded border p-3"
        style={{ borderColor: t.statusColor + '30', background: t.statusColor + '06' }}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="font-mono text-xs font-bold" style={{ color: '#e6edf3' }}>{t.name}</p>
          <span
            className="flex-shrink-0 font-mono font-bold text-[10px] px-2 py-0.5 rounded border uppercase tracking-wide"
            style={{
              color: t.statusColor,
              borderColor: t.statusColor + '40',
              background: t.statusColor + '12',
            }}
          >
            {t.statusIcon} {t.status}
          </span>
        </div>
        <p className="font-mono text-[10px] mb-1" style={{ color: t.statusColor }}>{t.detail}</p>
        <p className="font-mono text-[10px] mb-1" style={{ color: '#8b949e' }}>
          Parties: {t.parties}
        </p>
        <p className="font-mono text-[10px]" style={{ color: '#8b949e' }}>{t.extra}</p>
      </div>
    ))}
  </div>
);

// ─── HISTORY TAB ──────────────────────────────────────────────────────────────
const TIMELINE_EVENTS = [
  {
    year: '1962',
    title: 'CUBAN MISSILE CRISIS',
    detail: '13 days. Kennedy vs. Khrushchev. The B-59 submarine incident — Vasili Arkhipov refused to authorize a nuclear torpedo launch against US destroyers, potentially averting immediate nuclear war. Resolution: Soviet missiles removed from Cuba in exchange for US pledge not to invade and secret removal of Jupiter missiles from Turkey.',
    severity: 'CRITICAL',
  },
  {
    year: '1983 — Sept 26',
    title: 'PETROV INCIDENT',
    detail: "Soviet early warning satellite reported 5 US Minuteman ICBMs inbound. Lt. Col. Stanislav Petrov judged it a false alarm — correctly. Soviet doctrine required immediate retaliation. If he had reported it as real, the chain of command would have launched. Cause: satellite glare from high-altitude cloud formations.",
    severity: 'CRITICAL',
  },
  {
    year: '1983 — November',
    title: 'ABLE ARCHER 83',
    detail: "NATO war exercise so realistic in simulating a nuclear first strike that Soviet leadership believed it was real. KGB ordered nuclear forces to highest alert. Reagan was unaware of how frightened Soviet leadership was. British double agent Oleg Gordievsky reported the Soviet response. Reagan later said the episode changed his view of Soviet fear.",
    severity: 'HIGH',
  },
  {
    year: '1995',
    title: 'NORWEGIAN ROCKET INCIDENT',
    detail: 'Russian early warning radar detected a Norwegian scientific research rocket (Black Brant XII, studying northern lights) as an incoming US Trident submarine-launched ballistic missile. Yeltsin activated his nuclear "Cheget" briefcase — the first time in history a Russian president activated the nuclear command system in a potential launch scenario. Resolved within 8 minutes.',
    severity: 'HIGH',
  },
  {
    year: '2010',
    title: 'MINUTEMAN III OUTAGE',
    detail: '50 Minuteman III ICBMs — one ninth of the entire US land-based arsenal — went offline simultaneously for 45 minutes at F.E. Warren Air Force Base, Wyoming. Cause: faulty circuit card in an underground launch control center. The missiles remained safe, but the Air Force lost the ability to monitor or communicate with them.',
    severity: 'MODERATE',
  },
  {
    year: '2018',
    title: 'HAWAII MISSILE ALERT',
    detail: '"BALLISTIC MISSILE THREAT INBOUND TO HAWAII. SEEK IMMEDIATE SHELTER. THIS IS NOT A DRILL." The alert went to all phones and broadcast stations. 38 minutes of statewide panic before a correction was issued. Cause: a human employee selected the wrong option during a drill. Exposed critical gaps in alert system UI design.',
    severity: 'MODERATE',
  },
  {
    year: '2022–PRESENT',
    title: 'UKRAINE WAR — NUCLEAR SIGNALING',
    detail: 'First explicit nuclear threats by a major power since the Cold War. Russian military doctrine invokes tactical nuclear weapons in escalation scenarios. Doomsday Clock moved to 90 seconds to midnight — the closest in its history, surpassing even the 1953 reading after the first Soviet H-bomb test. Ongoing as of 2025.',
    severity: 'CRITICAL',
  },
];

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ff4444',
  HIGH: '#ff8800',
  MODERATE: '#ffbb00',
};

const HistoryTab: React.FC = () => (
  <div className="space-y-4">
    <div className="rounded border p-3" style={{ borderColor: '#1e2a38', background: '#0a0a0f' }}>
      <p className="font-mono font-bold text-xs uppercase tracking-widest" style={{ color: '#ff4444' }}>
        Nuclear Close Calls &amp; Crises
      </p>
      <p className="font-mono text-[10px] mt-0.5" style={{ color: '#8b949e' }}>
        Documented incidents where nuclear war nearly occurred
      </p>
    </div>

    <div className="relative">
      {/* Vertical line */}
      <div
        className="absolute top-0 bottom-0 left-[7px] w-px"
        style={{ background: '#1e2a38' }}
      />

      <div className="space-y-4 pl-6">
        {TIMELINE_EVENTS.map((event, i) => {
          const color = SEVERITY_COLORS[event.severity] ?? '#8b949e';
          return (
            <div key={i} className="relative">
              {/* Dot */}
              <div
                className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 flex-shrink-0"
                style={{
                  borderColor: color,
                  background: color + '30',
                  boxShadow: `0 0 6px ${color}60`,
                }}
              />

              <div
                className="rounded border p-3"
                style={{ borderColor: color + '25', background: color + '05' }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <span className="font-mono text-[10px] font-bold" style={{ color: '#00ff88' }}>
                      {event.year}
                    </span>
                    <span className="font-mono text-xs font-bold ml-2" style={{ color }}>
                      — {event.title}
                    </span>
                  </div>
                  <span
                    className="flex-shrink-0 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                    style={{ color, background: color + '15', border: `1px solid ${color}40` }}
                  >
                    {event.severity}
                  </span>
                </div>
                <p className="font-mono text-[10px] leading-relaxed" style={{ color: '#8b949e' }}>
                  {event.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <p className="font-mono text-[9px]" style={{ color: '#8b949e' }}>
      Sources: Nuclear Threat Initiative (NTI), Bulletin of the Atomic Scientists, declassified government documents.
    </p>
  </div>
);

// ─── MAIN PANEL ──────────────────────────────────────────────────────────────

const GEO_TABS: { id: GeoTab; label: string }[] = [
  { id: 'intel', label: 'INTEL' },
  { id: 'arsenal', label: 'ARSENAL' },
  { id: 'treaties', label: 'TREATIES' },
  { id: 'history', label: 'HISTORY' },
];

export const GeopoliticsPanel: React.FC = () => {
  const { showGeopoliticsPanel, escalationData, toggleGeopoliticsPanel, fetchEscalation } =
    useSimulationStore();
  const [activeTab, setActiveTab] = useState<GeoTab>('intel');

  // Fetch on first open
  useEffect(() => {
    if (showGeopoliticsPanel && !escalationData) {
      fetchEscalation();
    }
  }, [showGeopoliticsPanel, escalationData, fetchEscalation]);

  if (!showGeopoliticsPanel) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) toggleGeopoliticsPanel();
      }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg border overflow-hidden"
        style={{ background: '#0d1117', borderColor: '#1e2a38' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: '#1e2a38' }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} style={{ color: '#ff8800' }} />
            <h2
              className="font-mono font-bold uppercase tracking-widest text-sm"
              style={{ color: '#ff8800' }}
            >
              Geopolitical Intelligence
            </h2>
          </div>
          <button
            onClick={toggleGeopoliticsPanel}
            className="p-1 rounded transition-colors"
            style={{ color: '#8b949e' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab bar */}
        <div
          className="flex border-b flex-shrink-0"
          style={{ borderColor: '#1e2a38' }}
        >
          {GEO_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2"
              style={{
                color: activeTab === tab.id ? '#ff8800' : '#8b949e',
                borderColor: activeTab === tab.id ? '#ff8800' : 'transparent',
                background: 'transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'intel' && <IntelTab />}
          {activeTab === 'arsenal' && <ArsenalTab />}
          {activeTab === 'treaties' && <TreatiesTab />}
          {activeTab === 'history' && <HistoryTab />}
        </div>

        {/* Footer */}
        <div
          className="border-t px-5 py-2 flex-shrink-0 flex items-center justify-between"
          style={{ borderColor: '#1e2a38' }}
        >
          <p className="font-mono text-[9px]" style={{ color: '#8b949e' }}>
            Powered by GNews · Dev tier (100 req/day)
          </p>
          <p className="font-mono text-[9px]" style={{ color: '#8b949e' }}>
            For educational/simulation purposes only
          </p>
        </div>
      </div>
    </div>
  );
};
