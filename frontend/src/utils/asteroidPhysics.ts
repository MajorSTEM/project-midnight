/**
 * Asteroid Impact Physics Engine
 * Based on Collins et al. (2005) "Earth Impact Effects Program"
 * Purdue University / Imperial College London
 * Simplified parametric model for educational simulation
 */

export interface AsteroidConfig {
  diameterM: number;          // Impactor diameter in meters
  densityKgM3: number;        // kg/m³ (stone: 2500, iron: 8000, comet: 1000)
  velocityKmS: number;        // Impact velocity (typical: 17 km/s)
  angleDeg: number;           // Impact angle (degrees from horizontal, 45° = typical)
  targetLat: number;
  targetLng: number;
  targetName: string;
  surfaceType: 'land' | 'ocean' | 'urban' | 'ice';
  populationDensity: number;  // people/km²
}

export interface AsteroidEffects {
  // Impactor properties
  massKg: number;
  energyMt: number;           // Energy in megatons TNT equivalent
  energyJoules: number;

  // Atmospheric effects
  airburstAltitudeKm: number | null; // null if reaches ground
  airburstEnergyFraction: number;    // Fraction of energy deposited in atmosphere

  // Ground effects (if impact)
  craterDiameterKm: number | null;
  craterDepthKm: number | null;

  // Thermal effects
  thermalRadiusKm: number;    // 3rd degree burn radius
  ignitionRadiusKm: number;   // Paper ignition radius

  // Blast / overpressure
  severeBlastRadiusKm: number;    // ~10 psi — reinforced concrete damage
  moderateBlastRadiusKm: number;  // ~5 psi — brick/wood destruction
  lightBlastRadiusKm: number;     // ~1 psi — window breakage, ear damage

  // Seismic
  richterMagnitude: number;
  seismicShakingRadiusKm: number; // Strong shaking (MMI VII)

  // Ejecta (if impact)
  ejectaThicknessM: { [radiusKm: number]: number };

  // Tsunami (if ocean impact)
  tsunamiWaveHeightM: { [distanceKm: number]: number } | null;

  // Casualties
  immediateDeaths: number;
  injuredTotal: number;
  totalAffectedKm2: number;
}

const G = 6.674e-11;
const EARTH_RADIUS_KM = 6371;
const ATM_PRESSURE_PA = 101325;
const TNT_JOULES_PER_KG = 4.184e9; // 1 ton TNT = 4.184 GJ
const MEGATONS_TO_JOULES = 4.184e15;

/**
 * Calculate asteroid mass from diameter and density
 */
function impactorMass(diameterM: number, densityKgM3: number): number {
  const radius = diameterM / 2;
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
  return volume * densityKgM3;
}

/**
 * Calculate impact energy in Joules
 */
function impactEnergy(massKg: number, velocityKmS: number): number {
  const v = velocityKmS * 1000; // m/s
  return 0.5 * massKg * v * v;
}

/**
 * Determine if impactor survives atmospheric entry
 * Small impactors (< ~25m stone) airburst, larger ones reach ground
 * Returns { survives: boolean, airburstAlt: number|null, remainingEnergy: number }
 */
function atmosphericEntry(
  diameterM: number,
  densityKgM3: number,
  velocityKmS: number,
  angleDeg: number,
  totalEnergyJ: number
): { survives: boolean; airburstAltKm: number | null; energyFraction: number } {
  // Simplified: stone impactors < 50m typically airburst
  // Iron impactors < 20m typically airburst
  // Comets < 200m typically airburst
  const isFriable = densityKgM3 < 3000; // stone/comet
  const isIron = densityKgM3 > 6000;

  let surviveThresholdM = 50;
  if (isIron) surviveThresholdM = 20;
  if (isFriable) surviveThresholdM = 80;

  if (diameterM < surviveThresholdM) {
    // Airburst
    const altitudeFactor = Math.max(0.05, angleDeg / 90);
    const airburstAlt = 20 * (1 - altitudeFactor) + 5; // 5-25km
    return {
      survives: false,
      airburstAltKm: airburstAlt,
      energyFraction: 0.85, // 85% deposited in atmosphere
    };
  }

  // Partial ablation
  const ablationFraction = Math.min(0.3, surviveThresholdM / diameterM * 0.3);
  return {
    survives: true,
    airburstAltKm: null,
    energyFraction: 1 - ablationFraction,
  };
}

/**
 * Calculate crater dimensions using Pi-scaling (Melosh 1989)
 */
function craterDimensions(
  massKg: number,
  velocityKmS: number,
  densityKgM3: number,
  angleDeg: number,
  surfaceType: AsteroidConfig['surfaceType']
): { diameterKm: number; depthKm: number } {
  // Target density (kg/m³)
  const targetDensity = surfaceType === 'ocean' ? 1025 : surfaceType === 'ice' ? 900 : 2700;

  // Pi-scaling transient crater diameter (simplified)
  const g = 9.81;
  const v = velocityKmS * 1000;
  const angleRad = angleDeg * Math.PI / 180;

  // Effective impacting energy (angle correction)
  const energyEffective = 0.5 * massKg * v * v * Math.sin(angleRad);
  const energyMt = energyEffective / MEGATONS_TO_JOULES;

  // Simple energy-diameter scaling (Holsapple 1993 approximation)
  // D_crater(km) ≈ 0.0346 * E(kt)^0.294 for rocky targets
  const energyKt = energyMt * 1e6;
  const transientDiameterKm = 0.0346 * Math.pow(energyKt, 0.294);

  // Final crater ~1.5x transient (simple craters) to 2x (complex)
  const finalDiameterKm = transientDiameterKm * 1.5;
  const depthKm = finalDiameterKm * 0.2; // depth ≈ 20% of diameter

  return { diameterKm: finalDiameterKm, depthKm };
}

/**
 * Overpressure blast radius (Collins et al. simplified)
 * Returns radius in km for given overpressure in Pa
 */
function blastRadius(energyMt: number, overpressurePa: number): number {
  // Scaling: R ∝ (E/p0)^(1/3) * f(overpressure ratio)
  // Reference: nuclear blast scaling (Glasstone-Dolan) adapted for asteroid
  const scaledEnergy = energyMt * 1e6; // kt equivalent
  const psiToKpa = 6.895;
  const overpressureKpa = overpressurePa / 1000;

  // Using nuclear weapon scaling: Rmin(km) = 1.0 * (yKt)^0.33 for ~10psi
  // Asteroid blast is similar for same energy, slightly different for airburst
  const yieldKt = energyMt * 1e6; // direct mapping: 1 Mt = 1Mt
  const pressureScaling = Math.pow(100 / overpressureKpa, 0.54);
  return pressureScaling * Math.pow(yieldKt, 0.33) * 0.8;
}

/**
 * Thermal radiation radius
 */
function thermalRadius(energyMt: number, threshold: 'lethal' | 'ignition'): number {
  // Thermal energy ≈ 35% of total for ground burst
  const thermalMt = energyMt * 0.35;
  const thresholdMt = threshold === 'lethal' ? 0.001 : 0.0003; // Mt/km² threshold
  return Math.sqrt(thermalMt / (Math.PI * thresholdMt));
}

/**
 * Seismic magnitude from impact energy (Richter approximation)
 */
function seismicMagnitude(energyJ: number): number {
  // M = 0.67 * log10(E) - 5.87  (Shoemaker, 1983)
  return 0.67 * Math.log10(energyJ) - 5.87;
}

function seismicShakingRadius(magnitude: number): number {
  // Strong shaking (MMI VII+) radius
  return Math.pow(10, (magnitude - 5.5) / 1.8) * 50; // km
}

/**
 * Tsunami height estimation (simplified)
 * Only for ocean impacts
 */
function tsunamiHeights(
  energyMt: number,
  craterDiameterKm: number
): { [distanceKm: number]: number } {
  const waveHeights: { [dist: number]: number } = {};
  // Initial wave height ≈ crater depth
  const initialHeight = craterDiameterKm * 1000 * 0.1; // m
  const distances = [100, 500, 1000, 2000, 5000];
  distances.forEach(d => {
    // Wave height decays roughly as 1/sqrt(r) for tsunamis
    waveHeights[d] = initialHeight * Math.sqrt(craterDiameterKm * 50 / d);
  });
  return waveHeights;
}

/**
 * Main calculation function
 */
export function calculateAsteroidEffects(config: AsteroidConfig): AsteroidEffects {
  const mass = impactorMass(config.diameterM, config.densityKgM3);
  const totalEnergyJ = impactEnergy(mass, config.velocityKmS);
  const energyMt = totalEnergyJ / MEGATONS_TO_JOULES;

  const entry = atmosphericEntry(
    config.diameterM,
    config.densityKgM3,
    config.velocityKmS,
    config.angleDeg,
    totalEnergyJ
  );

  const effectiveEnergyJ = totalEnergyJ * entry.energyFraction;
  const effectiveEnergyMt = effectiveEnergyJ / MEGATONS_TO_JOULES;

  // Crater (only if ground impact)
  let craterDiameterKm: number | null = null;
  let craterDepthKm: number | null = null;
  if (entry.survives) {
    const crater = craterDimensions(
      mass,
      config.velocityKmS,
      config.densityKgM3,
      config.angleDeg,
      config.surfaceType
    );
    craterDiameterKm = crater.diameterKm;
    craterDepthKm = crater.depthKm;
  }

  // Blast radii
  const severeBlastRadius = blastRadius(effectiveEnergyMt, 69000);   // ~10 psi
  const moderateBlastRadius = blastRadius(effectiveEnergyMt, 34500); // ~5 psi
  const lightBlastRadius = blastRadius(effectiveEnergyMt, 6900);     // ~1 psi

  // Thermal
  const thermalR = thermalRadius(effectiveEnergyMt, 'lethal');
  const ignitionR = thermalRadius(effectiveEnergyMt, 'ignition');

  // Seismic
  const richter = seismicMagnitude(effectiveEnergyJ);
  const shakeRadius = seismicShakingRadius(richter);

  // Tsunami
  const tsunami =
    config.surfaceType === 'ocean' && craterDiameterKm !== null
      ? tsunamiHeights(effectiveEnergyMt, craterDiameterKm)
      : null;

  // Ejecta (simplified — within 3× crater radius)
  const ejecta: { [r: number]: number } = {};
  if (craterDiameterKm) {
    const rc = craterDiameterKm / 2;
    [1, 2, 5, 10, 20].forEach(mult => {
      const r = rc * mult;
      ejecta[Math.round(r)] = Math.max(0.01, (craterDiameterKm! * 100) / Math.pow(mult, 3));
    });
  }

  // Casualties
  const severeArea = Math.PI * Math.pow(severeBlastRadius, 2);
  const moderateArea = Math.PI * (Math.pow(moderateBlastRadius, 2) - Math.pow(severeBlastRadius, 2));
  const lightArea = Math.PI * (Math.pow(lightBlastRadius, 2) - Math.pow(moderateBlastRadius, 2));
  const totalArea = Math.PI * Math.pow(lightBlastRadius, 2);

  const immediateDeaths = Math.round(
    severeArea * config.populationDensity * 0.97 +
    moderateArea * config.populationDensity * 0.45
  );
  const injured = Math.round(
    moderateArea * config.populationDensity * 0.45 +
    lightArea * config.populationDensity * 0.1
  );

  return {
    massKg: mass,
    energyMt,
    energyJoules: totalEnergyJ,
    airburstAltitudeKm: entry.airburstAltKm,
    airburstEnergyFraction: entry.energyFraction,
    craterDiameterKm,
    craterDepthKm,
    thermalRadiusKm: thermalR,
    ignitionRadiusKm: ignitionR,
    severeBlastRadiusKm: severeBlastRadius,
    moderateBlastRadiusKm: moderateBlastRadius,
    lightBlastRadiusKm: lightBlastRadius,
    richterMagnitude: Math.round(richter * 10) / 10,
    seismicShakingRadiusKm: shakeRadius,
    ejectaThicknessM: ejecta,
    tsunamiWaveHeightM: tsunami,
    immediateDeaths,
    injuredTotal: injured,
    totalAffectedKm2: totalArea,
  };
}

/**
 * Preset impactor types for the UI
 */
export interface ImpactorPreset {
  id: string;
  name: string;
  diameterM: number;
  densityKgM3: number;
  velocityKmS: number;
  composition: string;
  description: string;
  historicalExample?: string;
}

export const IMPACTOR_PRESETS: ImpactorPreset[] = [
  {
    id: 'chelyabinsk',
    name: 'Chelyabinsk-class',
    diameterM: 20,
    densityKgM3: 3300,
    velocityKmS: 19.2,
    composition: 'Chondrite (stone)',
    description: 'Airburst ~23km altitude, ~500kt energy. Breaks windows, injures 1,500+ from glass.',
    historicalExample: 'Chelyabinsk, Russia — Feb 15, 2013',
  },
  {
    id: 'tunguska',
    name: 'Tunguska-class',
    diameterM: 50,
    densityKgM3: 2700,
    velocityKmS: 27,
    composition: 'Stony asteroid',
    description: 'Airburst ~8km altitude, ~10-15 Mt. Flattens 2,000 km² of forest.',
    historicalExample: 'Tunguska, Siberia — June 30, 1908',
  },
  {
    id: 'city-killer',
    name: 'City-Killer',
    diameterM: 150,
    densityKgM3: 3000,
    velocityKmS: 20,
    composition: 'Chondrite (stone)',
    description: 'Ground impact, ~1,000 Mt equivalent. Destroys a metropolitan area entirely.',
  },
  {
    id: 'apophis',
    name: 'Apophis-class (2029 flyby)',
    diameterM: 370,
    densityKgM3: 2500,
    velocityKmS: 7.5,
    composition: 'S-type stony',
    description: 'Near-Earth asteroid with real 2029 close approach. If it hit: ~1,200 Mt, regional devastation.',
    historicalExample: 'Apophis — predicted closest approach April 13, 2029',
  },
  {
    id: 'iron-asteroid',
    name: 'Iron Asteroid (200m)',
    diameterM: 200,
    densityKgM3: 7900,
    velocityKmS: 20,
    composition: 'Iron-nickel',
    description: 'Dense iron core survives atmosphere fully. Deep impact crater, massive ground damage.',
  },
  {
    id: 'national-emergency',
    name: 'National Emergency (500m)',
    diameterM: 500,
    densityKgM3: 2700,
    velocityKmS: 20,
    composition: 'Chondrite (stone)',
    description: '~25,000 Mt equivalent. Destroys a state. Triggers firestorms across thousands of km.',
  },
  {
    id: 'extinction-level',
    name: 'Extinction-Level (1km)',
    diameterM: 1000,
    densityKgM3: 3000,
    velocityKmS: 20,
    composition: 'Carbonaceous chondrite',
    description: '~100,000 Mt. Global firestorms, impact winter, mass extinction event. K-Pg boundary analog.',
  },
  {
    id: 'dinosaur-killer',
    name: 'Dinosaur Killer (10km)',
    diameterM: 10000,
    densityKgM3: 2700,
    velocityKmS: 20,
    composition: 'Carbonaceous chondrite',
    description: '~100 billion Mt. Chicxulub-scale. End of civilization. K-Pg mass extinction.',
    historicalExample: 'Chicxulub impactor — 66 million years ago, Yucatán Peninsula',
  },
];
