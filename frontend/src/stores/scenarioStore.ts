import { create } from 'zustand';
import type { SavedScenario } from '../types';

const STORAGE_KEY = 'gcsp_scenarios';

function loadFromStorage(): SavedScenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedScenario[];
  } catch {
    return [];
  }
}

function saveToStorage(scenarios: SavedScenario[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  } catch {
    console.error('[scenarioStore] Failed to save to localStorage');
  }
}

interface ScenarioStore {
  scenarios: SavedScenario[];
  loadScenarios: () => void;
  saveScenario: (name: string, scenario: Omit<SavedScenario, 'id' | 'savedAt' | 'name'>) => void;
  deleteScenario: (id: string) => void;
  exportScenario: (id: string) => void;
  importScenario: (json: string) => void;
}

export const useScenarioStore = create<ScenarioStore>((set, get) => ({
  scenarios: [],

  loadScenarios: () => {
    const loaded = loadFromStorage();
    set({ scenarios: loaded });
  },

  saveScenario: (name, scenario) => {
    const newScenario: SavedScenario = {
      id: crypto.randomUUID(),
      name,
      savedAt: new Date().toISOString(),
      ...scenario,
    };
    const updated = [newScenario, ...get().scenarios];
    set({ scenarios: updated });
    saveToStorage(updated);
  },

  deleteScenario: (id) => {
    const updated = get().scenarios.filter((s) => s.id !== id);
    set({ scenarios: updated });
    saveToStorage(updated);
  },

  exportScenario: (id) => {
    const scenario = get().scenarios.find((s) => s.id === id);
    if (!scenario) return;
    const blob = new Blob([JSON.stringify(scenario, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gcsp-scenario-${scenario.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importScenario: (json) => {
    try {
      const parsed = JSON.parse(json) as SavedScenario;
      // Assign a new ID to avoid collisions
      const imported: SavedScenario = {
        ...parsed,
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
      };
      const updated = [imported, ...get().scenarios];
      set({ scenarios: updated });
      saveToStorage(updated);
    } catch {
      console.error('[scenarioStore] Failed to import scenario');
    }
  },
}));
