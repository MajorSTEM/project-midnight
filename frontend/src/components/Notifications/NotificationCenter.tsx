import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import {
  requestNotificationPermission,
  subscribeToPushNotifications,
  sendLocalNotification,
} from '../../utils/notificationUtils';

type EscalationThreshold = 50 | 70 | 90;

interface NotificationSettings {
  escalationAlerts: boolean;
  escalationThreshold: EscalationThreshold;
  femaAlerts: boolean;
  simulationEvents: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  escalationAlerts: false,
  escalationThreshold: 70,
  femaAlerts: false,
  simulationEvents: false,
};

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(
    'Notification' in window ? Notification.permission : 'unsupported',
  );
  const [subscribing, setSubscribing] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Refresh permission state
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, [isOpen]);

  const handleEnableNotifications = useCallback(async () => {
    setSubscribing(true);
    try {
      const granted = await requestNotificationPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');

      if (granted) {
        // Attempt push subscription (best-effort; no backend required for local use)
        await subscribeToPushNotifications();
      }
    } finally {
      setSubscribing(false);
    }
  }, []);

  const handleTestNotification = useCallback(async () => {
    await sendLocalNotification(
      'PROJECT MIDNIGHT — TEST ALERT',
      'GCSP notification system is operational. Escalation monitoring active.',
      false,
    );
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  }, []);

  const updateSetting = useCallback(
    <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  if (!isOpen) return null;

  const canEnable = permissionStatus !== 'granted' && permissionStatus !== 'unsupported';
  const isGranted = permissionStatus === 'granted';

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 rounded-lg border overflow-hidden z-50"
      style={{
        background: '#0d1117',
        borderColor: '#00ff88' + '30',
        width: '300px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,136,0.05)',
      }}
      role="dialog"
      aria-label="Notification Center"
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: '#1e2a38', background: '#00ff88' + '06' }}
      >
        <Bell size={14} style={{ color: '#00ff88' }} strokeWidth={1.5} />
        <span
          className="font-mono font-bold text-xs uppercase tracking-widest flex-1"
          style={{ color: '#00ff88' }}
        >
          NOTIFICATION CENTER
        </span>
        <button
          onClick={onClose}
          className="font-mono text-xs"
          style={{ color: '#8b949e' }}
          aria-label="Close notification center"
        >
          [X]
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Escalation alerts */}
        <div className="space-y-2">
          <label className="flex items-start gap-2.5 cursor-pointer group">
            <div className="mt-0.5">
              <input
                type="checkbox"
                checked={settings.escalationAlerts}
                onChange={(e) => updateSetting('escalationAlerts', e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors"
                style={{
                  borderColor: settings.escalationAlerts ? '#00ff88' : '#1e2a38',
                  background: settings.escalationAlerts ? '#00ff88' : 'transparent',
                }}
                onClick={() => updateSetting('escalationAlerts', !settings.escalationAlerts)}
              >
                {settings.escalationAlerts && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path
                      d="M1 3L3 5L7 1"
                      stroke="#0a0a0f"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
            <div className="flex-1">
              <p
                className="font-mono text-xs font-bold"
                style={{ color: settings.escalationAlerts ? '#e6edf3' : '#8b949e' }}
              >
                Escalation alerts
              </p>
              <p className="font-mono text-[10px] mt-0.5" style={{ color: '#8b949e' }}>
                Notify when escalation score rises above threshold
              </p>
            </div>
          </label>

          {/* Threshold selector */}
          {settings.escalationAlerts && (
            <div className="ml-6 flex items-center gap-1.5">
              <span className="font-mono text-[10px]" style={{ color: '#8b949e' }}>
                Threshold:
              </span>
              {([50, 70, 90] as EscalationThreshold[]).map((t) => (
                <button
                  key={t}
                  onClick={() => updateSetting('escalationThreshold', t)}
                  className="px-2 py-0.5 rounded border font-mono text-[10px] font-bold transition-colors"
                  style={{
                    color: settings.escalationThreshold === t ? '#0a0a0f' : '#8b949e',
                    background:
                      settings.escalationThreshold === t ? '#00ff88' : 'transparent',
                    borderColor:
                      settings.escalationThreshold === t ? '#00ff88' : '#1e2a38',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #1e2a38' }} />

        {/* FEMA alerts */}
        <label className="flex items-start gap-2.5 cursor-pointer">
          <div className="mt-0.5">
            <div
              className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors"
              style={{
                borderColor: settings.femaAlerts ? '#00ff88' : '#1e2a38',
                background: settings.femaAlerts ? '#00ff88' : 'transparent',
              }}
              onClick={() => updateSetting('femaAlerts', !settings.femaAlerts)}
            >
              {settings.femaAlerts && (
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path
                    d="M1 3L3 5L7 1"
                    stroke="#0a0a0f"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
          <div className="flex-1">
            <p
              className="font-mono text-xs font-bold"
              style={{ color: settings.femaAlerts ? '#e6edf3' : '#8b949e' }}
            >
              FEMA emergency alerts
            </p>
            <p className="font-mono text-[10px] mt-0.5" style={{ color: '#8b949e' }}>
              Real-time IPAWS integration
            </p>
          </div>
        </label>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #1e2a38' }} />

        {/* Simulation events */}
        <label className="flex items-start gap-2.5 cursor-pointer">
          <div className="mt-0.5">
            <div
              className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors"
              style={{
                borderColor: settings.simulationEvents ? '#00ff88' : '#1e2a38',
                background: settings.simulationEvents ? '#00ff88' : 'transparent',
              }}
              onClick={() =>
                updateSetting('simulationEvents', !settings.simulationEvents)
              }
            >
              {settings.simulationEvents && (
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path
                    d="M1 3L3 5L7 1"
                    stroke="#0a0a0f"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
          <div className="flex-1">
            <p
              className="font-mono text-xs font-bold"
              style={{ color: settings.simulationEvents ? '#e6edf3' : '#8b949e' }}
            >
              Simulation events
            </p>
            <p className="font-mono text-[10px] mt-0.5" style={{ color: '#8b949e' }}>
              Notify on zombie/pandemic civilization collapse event
            </p>
          </div>
        </label>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #1e2a38' }} />

        {/* Permission status */}
        {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded border"
            style={{
              borderColor: '#ffbb00' + '30',
              background: '#ffbb00' + '06',
            }}
          >
            <span className="text-[11px]">⚠</span>
            <p className="font-mono text-[10px]" style={{ color: '#8b949e' }}>
              {permissionStatus === 'denied'
                ? 'Notifications blocked. Enable in browser settings.'
                : 'Notifications permission required.'}
            </p>
          </div>
        )}
        {isGranted && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded border"
            style={{ borderColor: '#00ff88' + '30', background: '#00ff88' + '06' }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: '#00ff88' }}
            />
            <p className="font-mono text-[10px]" style={{ color: '#00ff88' }}>
              Notifications enabled
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {canEnable && (
            <button
              onClick={handleEnableNotifications}
              disabled={subscribing}
              className="w-full py-2 rounded border font-mono font-bold text-xs uppercase tracking-wider transition-colors"
              style={{
                borderColor: '#00ff88' + '60',
                color: '#00ff88',
                background: '#00ff88' + '10',
                opacity: subscribing ? 0.6 : 1,
              }}
            >
              {subscribing ? '...' : 'Enable Notifications'}
            </button>
          )}
          <button
            onClick={handleTestNotification}
            disabled={!isGranted}
            className="w-full py-2 rounded border font-mono font-bold text-xs uppercase tracking-wider transition-colors"
            style={{
              borderColor: isGranted ? '#1e2a38' : '#1e2a38',
              color: testSent ? '#00ff88' : isGranted ? '#8b949e' : '#3a3a4a',
              background: testSent ? '#00ff88' + '10' : 'transparent',
              cursor: isGranted ? 'pointer' : 'not-allowed',
            }}
          >
            {testSent ? '✓ Sent!' : 'Test Notification'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Bell icon button that toggles the NotificationCenter panel.
 * Use this in the TopBar.
 */
interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative ${className ?? ''}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center rounded border transition-colors"
        style={{
          width: '32px',
          height: '32px',
          borderColor: open ? '#00ff88' + '50' : '#1e2a38',
          background: open ? '#00ff88' + '10' : 'transparent',
          color: open ? '#00ff88' : '#8b949e',
        }}
        aria-label="Notification center"
        aria-expanded={open}
      >
        <Bell size={14} strokeWidth={1.5} />
      </button>

      <NotificationCenter isOpen={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default NotificationCenter;
