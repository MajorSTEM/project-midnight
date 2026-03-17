import { create } from 'zustand';
import type { PandemicConfig, PandemicDayState, PathogenType } from '../utils/pandemicEngine';
import { runPandemicSimulation, PATHOGEN_PRESETS } from '../utils/pandemicEngine';

interface PandemicStore {
  config: PandemicConfig;
  simulation: PandemicDayState[] | null;
  currentDay: number;
  isPlaying: boolean;
  playSpeed: 1 | 7 | 30 | 90;
  selectedPathogenId: string;

  setConfig: (config: Partial<PandemicConfig>) => void;
  setPathogen: (pathogenId: string) => void;
  setOrigin: (lat: number, lng: number, name: string) => void;
  runSimulation: () => void;
  setCurrentDay: (day: number) => void;
  play: () => void;
  pause: () => void;
  setPlaySpeed: (speed: 1 | 7 | 30 | 90) => void;
  reset: () => void;

  currentState: PandemicDayState | null;
}

const defaultConfig: PandemicConfig = {
  pathogenId: 'covid-19',
  patientZeroCount: 1,
  populationSize: 10_000_000,
  populationDensity: 2500,
  publicHealthResponse: 'moderate',
  vaccineCampaign: true,
  quarantineEffectiveness: 0.5,
  simulationDays: 365,
  internationalTravel: true,
  originLat: 40.7128,
  originLng: -74.006,
  originName: 'New York City',
};

export const usePandemicStore = create<PandemicStore>((set, get) => ({
  config: defaultConfig,
  simulation: null,
  currentDay: 0,
  isPlaying: false,
  playSpeed: 1,
  selectedPathogenId: 'covid-19',
  currentState: null,

  setConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),

  setPathogen: (pathogenId: string) =>
    set((state) => ({
      selectedPathogenId: pathogenId,
      config: { ...state.config, pathogenId },
    })),

  setOrigin: (lat: number, lng: number, name: string) =>
    set((state) => ({
      config: { ...state.config, originLat: lat, originLng: lng, originName: name },
    })),

  runSimulation: () => {
    const { config, selectedPathogenId } = get();
    const pathogen: PathogenType | undefined = PATHOGEN_PRESETS.find(
      (p) => p.id === selectedPathogenId
    );
    if (!pathogen) return;
    const simulation = runPandemicSimulation(config, pathogen);
    set({
      simulation,
      currentDay: 0,
      isPlaying: false,
      currentState: simulation[0] ?? null,
    });
  },

  setCurrentDay: (day: number) => {
    const { simulation } = get();
    if (!simulation) return;
    const clamped = Math.max(0, Math.min(day, simulation.length - 1));
    set({ currentDay: clamped, currentState: simulation[clamped] ?? null });
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  setPlaySpeed: (speed: 1 | 7 | 30 | 90) => set({ playSpeed: speed }),

  reset: () =>
    set({
      simulation: null,
      currentDay: 0,
      isPlaying: false,
      currentState: null,
      config: defaultConfig,
      selectedPathogenId: 'covid-19',
    }),
}));
