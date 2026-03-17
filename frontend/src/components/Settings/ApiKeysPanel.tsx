import React, { useState } from 'react';
import { X, Key, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';

interface ApiKeysPanelProps {
  onClose: () => void;
}

const PANEL: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 200,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(0,0,0,0.75)',
};
const CARD: React.CSSProperties = {
  background: '#0d1117', border: '1px solid rgba(0,255,136,0.2)',
  borderRadius: 8, padding: 24, width: '100%', maxWidth: 480,
  margin: 16, fontFamily: 'monospace',
};

function KeyField({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; hint: string;
}) {
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onChange(value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ color: '#8b949e', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%', background: '#161b22', border: '1px solid #1e2a38',
              borderRadius: 4, padding: '8px 32px 8px 10px', fontSize: 12,
              color: '#e6edf3', fontFamily: 'monospace', boxSizing: 'border-box',
            }}
          />
          <button
            onClick={() => setShow(!show)}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#8b949e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
        <button
          onClick={handleSave}
          style={{
            padding: '8px 12px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace',
            fontWeight: 'bold', cursor: 'pointer', border: '1px solid',
            borderColor: saved ? '#00ff88' : 'rgba(0,255,136,0.4)',
            color: saved ? '#0a0a0f' : '#00ff88',
            background: saved ? '#00ff88' : 'rgba(0,255,136,0.1)',
            display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
          }}
        >
          {saved ? <><CheckCircle size={12} /> SAVED</> : 'SAVE'}
        </button>
      </div>
      <div style={{ color: '#8b949e', fontSize: 10, marginTop: 4 }}>{hint}</div>
    </div>
  );
}

export const ApiKeysPanel: React.FC<ApiKeysPanelProps> = ({ onClose }) => {
  const { claudeApiKey, openaiApiKey, gnewsApiKey, setClaude, setOpenAI, setGNews } = useSettingsStore();
  const [claude, setCl] = useState(claudeApiKey);
  const [openai, setOa] = useState(openaiApiKey);
  const [gnews, setGn] = useState(gnewsApiKey);

  return (
    <div style={PANEL} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={CARD}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={16} color="#00ff88" />
            <span style={{ color: '#e6edf3', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              API Keys
            </span>
          </div>
          <button onClick={onClose} style={{ color: '#8b949e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        {/* Info banner */}
        <div style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 6, padding: '10px 12px', marginBottom: 20, fontSize: 11, color: '#8b949e', lineHeight: 1.5 }}>
          Keys are stored <span style={{ color: '#00ff88' }}>only on your device</span> (localStorage). They are never sent to any server — all API calls go directly from the app to the respective service.
        </div>

        <KeyField
          label="Anthropic Claude API Key"
          value={claude}
          onChange={(v) => { setCl(v); setClaude(v); }}
          placeholder="sk-ant-..."
          hint="Powers AI narratives and geopolitical predictions. Get yours at console.anthropic.com"
        />

        <KeyField
          label="OpenAI API Key (alternative)"
          value={openai}
          onChange={(v) => { setOa(v); setOpenAI(v); }}
          placeholder="sk-..."
          hint="Used if no Claude key is set. Calls GPT-4o-mini. Get yours at platform.openai.com"
        />

        <KeyField
          label="GNews API Key"
          value={gnews}
          onChange={(v) => { setGn(v); setGNews(v); }}
          placeholder="your-gnews-token"
          hint="Enables live geopolitical headlines and escalation scoring. Free tier at gnews.io"
        />

        {/* Offline note */}
        <div style={{ background: 'rgba(255,187,0,0.06)', border: '1px solid rgba(255,187,0,0.2)', borderRadius: 6, padding: '10px 12px', fontSize: 11, color: '#8b949e', lineHeight: 1.5 }}>
          <span style={{ color: '#ffbb00' }}>No keys required</span> for core simulations — nuclear, asteroid, EMP, pandemic, and zombie models run entirely offline. API keys only enhance the AI narrative and live news features.
        </div>

        <button
          onClick={onClose}
          style={{ width: '100%', marginTop: 16, padding: '10px', borderRadius: 4, border: '1px solid #1e2a38', background: 'transparent', color: '#8b949e', fontFamily: 'monospace', fontSize: 12, cursor: 'pointer' }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};
