import type { SEIRDState } from '../types';

export interface SEIRDZParams {
  population: number;
  patientZero: number;
  R0: number;
  incubationDays: number;
  infectiousDays: number;
  mortalityRate: number;
  reanimationRate: number;
  mobilityKmPerDay: number;
  militaryResponse: 'none' | 'local' | 'national' | 'full' | 'global';
  cureResearch: boolean;
  survivorBehavior: 'cooperative' | 'fractured' | 'hostile' | 'armed';
  totalDays: number;
}

export interface DayState extends SEIRDState {
  cumulativeDeaths: number;
  cumulativeInfected: number;
  percentSurvivors: number;
  cureDaysRemaining: number | null;
}

const MILITARY_KILL_RATE: Record<SEIRDZParams['militaryResponse'], number> = {
  none: 0,
  local: 0.02,
  national: 0.05,
  full: 0.1,
  global: 0.15,
};

const SURVIVOR_BEHAVIOR_FACTOR: Record<SEIRDZParams['survivorBehavior'], number> = {
  cooperative: 1.0,
  fractured: 0.8,
  hostile: 0.6,
  armed: 1.3,
};

export function runZombieSimulation(params: SEIRDZParams): DayState[] {
  const {
    population,
    patientZero,
    R0,
    incubationDays,
    infectiousDays,
    mortalityRate,
    reanimationRate,
    mobilityKmPerDay,
    militaryResponse,
    cureResearch,
    survivorBehavior,
    totalDays,
  } = params;

  // Model parameters
  const beta = R0 / infectiousDays;
  const sigma = incubationDays > 300 ? 0.001 : (incubationDays > 0 ? 1 / incubationDays : 1);
  const gamma = 1 / infectiousDays;
  const mu = mortalityRate * gamma;
  const rho = (1 - mortalityRate) * gamma;

  const militaryKillRate = MILITARY_KILL_RATE[militaryResponse];
  const behaviorFactor = SURVIVOR_BEHAVIOR_FACTOR[survivorBehavior];

  // Cure day
  const cureDay = cureResearch ? Math.round(30 + R0 * 5) : null;

  // Initial state
  let S = population - patientZero;
  let E = 0;
  let I = patientZero;
  let R = 0;
  let D = 0;
  let Z = 0;
  let spreadRadius = 1;
  let infrastructure = 100;
  let milEff = 1.0;
  let cumulativeDeaths = 0;
  let cumulativeInfected = patientZero;
  let cureApplied = false;

  const results: DayState[] = [];

  for (let day = 0; day <= totalDays; day++) {
    const N = Math.max(1, S + E + I + R); // living population

    // Cure event
    if (cureResearch && cureDay !== null && day === cureDay && !cureApplied) {
      I = Math.max(0, I * 0.1);
      E = Math.max(0, E * 0.1);
      cureApplied = true;
    }

    // Record state
    const totalZombies = Math.max(0, Z);
    results.push({
      day,
      susceptible: Math.max(0, Math.round(S)),
      exposed: Math.max(0, Math.round(E)),
      infected: Math.max(0, Math.round(I)),
      recovered: Math.max(0, Math.round(R)),
      dead: Math.max(0, Math.round(D)),
      reanimated: Math.max(0, Math.round(Z)),
      totalZombies: Math.max(0, Math.round(totalZombies)),
      spreadRadiusKm: Math.round(spreadRadius * 10) / 10,
      infrastructureIntact: Math.max(0, Math.min(100, Math.round(infrastructure))),
      militaryEffectiveness: Math.max(0, Math.min(100, Math.round(milEff * 100))),
      cumulativeDeaths: Math.max(0, Math.round(cumulativeDeaths)),
      cumulativeInfected: Math.max(0, Math.round(cumulativeInfected)),
      percentSurvivors: Math.max(0, Math.min(100, (S + R) / population * 100)),
      cureDaysRemaining: (cureResearch && cureDay !== null && day < cureDay && !cureApplied)
        ? cureDay - day
        : null,
    });

    if (day === totalDays) break;

    // SEIRD-Z differential equations (Euler method, dt=1 day)
    const infectionPressure = beta * S * I / N * behaviorFactor;
    const exposureRate = sigma * E;
    const recoveryRate = rho * I;
    const deathRate = mu * I;

    // Zombie dynamics
    const zombieNewReanimation = D * reanimationRate * 0.1;
    const zombieEating = 0.001 * totalZombies * S / Math.max(1, N);
    const militaryKills = milEff * militaryKillRate * totalZombies;
    const zombieDecay = totalZombies * 0.005; // slow natural decay

    // Update compartments
    const dS = -infectionPressure - zombieEating;
    const dE = infectionPressure - exposureRate;
    const dI = exposureRate - recoveryRate - deathRate;
    const dR = recoveryRate;
    const dD = deathRate + zombieEating;
    const dZ = zombieNewReanimation - militaryKills - zombieDecay;

    S = Math.max(0, S + dS);
    E = Math.max(0, E + dE);
    I = Math.max(0, I + dI);
    R = Math.max(0, R + dR);
    D = Math.max(0, D + dD);
    Z = Math.max(0, Z + dZ);

    cumulativeDeaths += Math.max(0, deathRate + zombieEating);
    cumulativeInfected += Math.max(0, exposureRate);

    // Spread radius grows
    spreadRadius += mobilityKmPerDay * Math.sqrt(totalZombies / 1000);
    // Cap at ~20000 km (half Earth circumference-ish)
    spreadRadius = Math.min(spreadRadius, 20000);

    // Infrastructure decay: decays as infected percentage grows
    const infectedFraction = (I + Z) / population;
    infrastructure -= infectedFraction * 0.5;
    infrastructure = Math.max(0, infrastructure);

    // Military effectiveness degrades as infrastructure falls
    milEff = 0.1 + (infrastructure / 100) * 0.9;
    milEff = Math.max(0.05, Math.min(1, milEff));
  }

  return results;
}
