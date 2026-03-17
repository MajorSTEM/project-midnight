export type AppMode = 'nuclear' | 'zombie' | 'asteroid' | 'emp' | 'pandemic';

// Re-export convenience types
export type { AsteroidConfig, AsteroidEffects, ImpactorPreset } from '../utils/asteroidPhysics';
export type { EMPConfig, EMPEffects, EMPPreset } from '../utils/empPhysics';
export type { PandemicConfig, PandemicDayState, PathogenType } from '../utils/pandemicEngine';
