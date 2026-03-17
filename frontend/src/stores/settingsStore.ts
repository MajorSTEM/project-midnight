import { create } from 'zustand';

interface SettingsStore {
  claudeApiKey: string;
  openaiApiKey: string;
  gnewsApiKey: string;
  setClaude: (key: string) => void;
  setOpenAI: (key: string) => void;
  setGNews: (key: string) => void;
  hasAiKey: () => boolean;
}

const load = (key: string) => {
  try { return localStorage.getItem(key) ?? ''; } catch { return ''; }
};
const save = (key: string, val: string) => {
  try { localStorage.setItem(key, val); } catch { /* noop */ }
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  claudeApiKey: load('gcsp_claude_key'),
  openaiApiKey: load('gcsp_openai_key'),
  gnewsApiKey:  load('gcsp_gnews_key'),

  setClaude: (key) => { save('gcsp_claude_key', key); set({ claudeApiKey: key }); },
  setOpenAI: (key) => { save('gcsp_openai_key', key); set({ openaiApiKey: key }); },
  setGNews:  (key) => { save('gcsp_gnews_key',  key); set({ gnewsApiKey: key }); },

  hasAiKey: () => !!(get().claudeApiKey || get().openaiApiKey),
}));
