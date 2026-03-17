import { create } from 'zustand';
import type { ZombieSimConfig, LatLng } from '../types';
import { runZombieSimulation, type DayState } from '../utils/zombieEngine';
import { ZOMBIE_TYPES } from '../utils/zombieTypes';

interface ZombieStore {
  config: ZombieSimConfig;
  simulation: DayState[] | null;
  currentDay: number;
  isPlaying: boolean;
  playSpeed: 1 | 5 | 10 | 30;

  setConfig: (config: Partial<ZombieSimConfig>) => void;
  setOrigin: (origin: LatLng) => void;
  runSimulation: () => void;
  setCurrentDay: (day: number) => void;
  play: () => void;
  pause: () => void;
  setPlaySpeed: (speed: 1 | 5 | 10 | 30) => void;
  reset: () => void;

  // Derived current state
  currentState: DayState | null;
}

const defaultConfig: ZombieSimConfig = {
  zombieTypeId: 'classic-romero',
  patientZeroCount: 1,
  populationSize: 10000000,
  militaryResponse: 'national',
  simulationDays: 365,
  cureResearch: false,
  survivorBehavior: 'cooperative',
  origin: null,
};

export const useZombieStore = create<ZombieStore>((set, get) => ({
  config: defaultConfig,
  simulation: null,
  currentDay: 0,
  isPlaying: false,
  playSpeed: 1,
  currentState: null,

  setConfig: (partial) => set((state) => ({ config: { ...state.config, ...partial } })),

  setOrigin: (origin: LatLng) => set((state) => ({ config: { ...state.config, origin } })),

  runSimulation: () => {
    const { config } = get();
    const zombieType = ZOMBIE_TYPES.find((z) => z.id === config.zombieTypeId);
    if (!zombieType) return;

    const days = runZombieSimulation({
      population: config.populationSize,
      patientZero: config.patientZeroCount,
      R0: zombieType.R0,
      incubationDays: zombieType.incubationDays,
      infectiousDays: zombieType.infectiousDays,
      mortalityRate: zombieType.mortalityRate,
      reanimationRate: zombieType.reanimationRate,
      mobilityKmPerDay: zombieType.mobilityKmPerDay,
      militaryResponse: config.militaryResponse,
      cureResearch: config.cureResearch,
      survivorBehavior: config.survivorBehavior,
      totalDays: config.simulationDays,
    });

    set({
      simulation: days,
      currentDay: 0,
      isPlaying: false,
      currentState: days[0] ?? null,
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

  setPlaySpeed: (speed: 1 | 5 | 10 | 30) => set({ playSpeed: speed }),

  reset: () => set({
    simulation: null,
    currentDay: 0,
    isPlaying: false,
    currentState: null,
    config: defaultConfig,
  }),
}));
