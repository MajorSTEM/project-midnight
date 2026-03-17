/**
 * Electromagnetic Pulse (EMP) Physics Engine
 * Models High-altitude EMP (HEMP) effects from nuclear detonation
 * Reference: Glasstone & Dolan (1977), EMP Commission Reports (2004, 2008)
 */

export interface EMPConfig {
  yieldKt: number;            // Nuclear yield in kilotons
  altitudeKm: number;         // Burst altitude (km above ground)
  targetLat: number;          // Ground zero lat (point below burst)
  targetLng: number;
  nation: string;
  burstType: 'hemp' | 'surface' | 'low-altitude'; // High-altitude EMP vs surface
}

export interface EMPEffects {
  // Coverage geometry
  lineOfSightRadiusKm: number;    // Radius of EMP coverage on ground (line-of-sight from burst)
  groundZeroLat: number;
  groundZeroLng: number;

  // EMP components (HEMP only)
  e1RadiusKm: number;   // Fast E1 — destroys electronics, ~ns duration
  e2RadiusKm: number;   // E2 — like lightning, ~ms duration
  e3RadiusKm: number;   // Slow E3 — destroys power grid, ~minutes

  // Peak field strengths (V/m)
  e1PeakVm: number;     // E1 peak
  e2PeakVm: number;
  e3PeakVm: number;

  // Infrastructure impacts
  affectedCities: EMPCity[];
  powerGridsAffected: number;      // Estimated number of grid regions
  transformersAtRisk: number;      // High-voltage transformers (take 1-2 years to replace)

  // Recovery timeline
  recoveryTimeline: {
    week1: string;
    month1: string;
    year1: string;
    longTerm: string;
  };

  // Nuclear blast effects (if applicable)
  hasBlastRadius: boolean;
  blastRadiusKm: number;

  // Casualties
  directDeaths: number;           // From nuclear blast itself (near zero for HEMP)
  indirectDeaths: string;         // From infrastructure collapse (range description)
  populationAffected: number;
}

export interface EMPCity {
  name: string;
  lat: number;
  lng: number;
  population: number;
  distanceKm: number;
  e1Intensity: 'full' | 'partial' | 'edge';
  affectedSystems: string[];
}

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate line-of-sight radius from burst altitude
 * This is the maximum ground radius that can "see" the burst
 */
export function lineOfSightRadius(altitudeKm: number): number {
  // R = sqrt((R_e + h)² - R_e²) ≈ sqrt(2 * R_e * h) for h << R_e
  return Math.sqrt(2 * EARTH_RADIUS_KM * altitudeKm + altitudeKm * altitudeKm);
}

/**
 * EMP field strength at distance from ground zero
 * Returns V/m for E1 component
 */
function e1FieldStrength(yieldKt: number, distanceKm: number, altitudeKm: number): number {
  // Peak E1 at high altitude burst: ~50,000 V/m at ground zero
  // Decays across the coverage area but relatively uniform
  const peakE1 = Math.min(50000, 25000 * Math.pow(yieldKt / 1000, 0.1));
  const falloff = Math.max(0.3, 1 - (distanceKm / (lineOfSightRadius(altitudeKm) * 1.2)));
  return peakE1 * falloff;
}

/**
 * Calculate HEMP effects for a high-altitude burst
 */
export function calculateEMPEffects(config: EMPConfig): EMPEffects {
  const isHEMP = config.burstType === 'hemp' || config.altitudeKm >= 30;

  const losRadius = lineOfSightRadius(config.altitudeKm);

  // E1: covers entire line-of-sight radius (instantaneous, destroys semiconductors)
  const e1Radius = isHEMP ? losRadius : config.altitudeKm * 3;

  // E2: slightly smaller than E1 (lightning-like, 0.1ms - 1s)
  const e2Radius = e1Radius * 0.85;

  // E3: very large area, up to 1.5x E1 radius (slow, destroys grid transformers)
  const e3Radius = isHEMP ? losRadius * 1.3 : e1Radius * 0.5;

  // Peak field strengths
  const e1Peak = isHEMP
    ? Math.min(50000, 25000 * Math.pow(config.yieldKt / 1000, 0.1))
    : 5000;
  const e2Peak = e1Peak * 0.1;
  const e3Peak = 0.1; // V/m but sustained (grid resonance amplifies this)

  // Affected US cities if targeting CONUS
  const affectedCities = getAffectedCities(
    config.targetLat,
    config.targetLng,
    e1Radius,
    config.yieldKt
  );

  // Infrastructure estimates
  const coverageAreaKm2 = Math.PI * Math.pow(e1Radius, 2);
  const avgPopDensity = 40; // rough US average people/km²
  const populationAffected = Math.round(coverageAreaKm2 * avgPopDensity * 0.7);

  // US has ~450,000 miles of high-voltage transmission lines, ~3,000 extra-high-voltage transformers
  const gridCoverage = Math.min(1, coverageAreaKm2 / 8_000_000); // Fraction of CONUS
  const transformersAtRisk = Math.round(3000 * gridCoverage);
  const powerGridsAffected = Math.round(10 * gridCoverage); // NERC grid regions

  // Recovery timeline
  const recoveryTimeline = buildRecoveryTimeline(config.yieldKt, isHEMP, e1Radius);

  // Direct deaths from blast (HEMP: near-zero, low altitude: significant)
  const directDeaths = isHEMP ? 0 : Math.round(Math.PI * Math.pow(config.altitudeKm * 2, 2) * 1000 * 0.5);

  return {
    lineOfSightRadiusKm: losRadius,
    groundZeroLat: config.targetLat,
    groundZeroLng: config.targetLng,
    e1RadiusKm: e1Radius,
    e2RadiusKm: e2Radius,
    e3RadiusKm: e3Radius,
    e1PeakVm: e1Peak,
    e2PeakVm: e2Peak,
    e3PeakVm: e3Peak,
    affectedCities,
    powerGridsAffected,
    transformersAtRisk,
    recoveryTimeline,
    hasBlastRadius: config.altitudeKm < 30,
    blastRadiusKm: config.altitudeKm < 30 ? config.altitudeKm * 5 : 0,
    directDeaths,
    indirectDeaths: estimateIndirectDeaths(populationAffected, e1Radius),
    populationAffected,
  };
}

function buildRecoveryTimeline(
  yieldKt: number,
  isHEMP: boolean,
  radius: number
): EMPEffects['recoveryTimeline'] {
  if (!isHEMP) {
    return {
      week1: 'Local power restored in unaffected areas. Emergency services functional.',
      month1: 'Most commercial infrastructure repaired. Some electronics destroyed.',
      year1: 'Full recovery unless transformers heavily damaged.',
      longTerm: 'No permanent infrastructure loss in unaffected zones.',
    };
  }

  const severity = radius > 2000 ? 'catastrophic' : radius > 1000 ? 'severe' : 'moderate';

  if (severity === 'catastrophic') {
    return {
      week1: 'Total blackout across affected region. Vehicles with electronic ignition non-functional. Hospital generators critical. Water treatment offline. Communications down except hardened military systems.',
      month1: 'Starvation and exposure casualties mounting. No fuel supply chain. Medical supply chain collapsed. Some military power restored. Cascading failures in nuclear plants (backup generators exhausted after ~7 days).',
      year1: 'Population displacement on massive scale. Industrial recovery impossible without transformer replacements (lead time: 1-2 years, mostly foreign manufacture). Estimated 70-90% mortality in affected region.',
      longTerm: 'Civilization reset in affected zone. Recovery requires external industrial capacity — unprecedented in modern history.',
    };
  }

  return {
    week1: 'Widespread power outages. Transportation disrupted. Banking/communications degraded. Hospitals on generator power.',
    month1: 'Partial power restoration in urban cores. Critical infrastructure slowly recovering. Significant economic damage ($1T+).',
    year1: 'Most essential systems restored. Long-term transformer damage still being repaired. Economic recession.',
    longTerm: 'Full recovery in 3-5 years. Policy changes for grid hardening likely.',
  };
}

function estimateIndirectDeaths(population: number, radiusKm: number): string {
  if (radiusKm < 500) return '10,000 – 100,000 (regional disruption)';
  if (radiusKm < 1500) return '1 – 10 million (prolonged infrastructure collapse)';
  return '100 million+ within 1 year (societal collapse across affected zone)';
}

// Major world cities for affected-city calculation
const WORLD_CITIES: Array<{ name: string; lat: number; lng: number; population: number }> = [
  { name: 'New York', lat: 40.7128, lng: -74.006, population: 19_000_000 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, population: 13_000_000 },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298, population: 9_500_000 },
  { name: 'Washington DC', lat: 38.9072, lng: -77.0369, population: 6_300_000 },
  { name: 'Houston', lat: 29.7604, lng: -95.3698, population: 7_200_000 },
  { name: 'Phoenix', lat: 33.4484, lng: -112.0740, population: 5_000_000 },
  { name: 'Philadelphia', lat: 39.9526, lng: -75.1652, population: 6_000_000 },
  { name: 'San Antonio', lat: 29.4241, lng: -98.4936, population: 2_500_000 },
  { name: 'Dallas', lat: 32.7767, lng: -96.7970, population: 7_600_000 },
  { name: 'San Jose', lat: 37.3382, lng: -121.8863, population: 2_000_000 },
  { name: 'Seattle', lat: 47.6062, lng: -122.3321, population: 4_000_000 },
  { name: 'Denver', lat: 39.7392, lng: -104.9903, population: 2_900_000 },
  { name: 'Atlanta', lat: 33.7490, lng: -84.3880, population: 6_200_000 },
  { name: 'Miami', lat: 25.7617, lng: -80.1918, population: 6_200_000 },
  { name: 'Minneapolis', lat: 44.9778, lng: -93.2650, population: 3_600_000 },
  { name: 'Detroit', lat: 42.3314, lng: -83.0458, population: 4_400_000 },
  { name: 'Boston', lat: 42.3601, lng: -71.0589, population: 4_900_000 },
  { name: 'Toronto', lat: 43.6510, lng: -79.3470, population: 6_300_000 },
  { name: 'Montreal', lat: 45.5017, lng: -73.5673, population: 4_200_000 },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332, population: 22_000_000 },
  { name: 'London', lat: 51.5074, lng: -0.1278, population: 9_400_000 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, population: 12_000_000 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050, population: 3_700_000 },
  { name: 'Moscow', lat: 55.7558, lng: 37.6173, population: 12_500_000 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, population: 37_000_000 },
  { name: 'Beijing', lat: 39.9042, lng: 116.4074, population: 21_000_000 },
  { name: 'Seoul', lat: 37.5665, lng: 126.9780, population: 25_000_000 },
];

function distanceBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = EARTH_RADIUS_KM;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getAffectedCities(
  lat: number,
  lng: number,
  radiusKm: number,
  yieldKt: number
): EMPCity[] {
  return WORLD_CITIES
    .map(city => {
      const dist = distanceBetween(lat, lng, city.lat, city.lng);
      if (dist > radiusKm) return null;
      const fraction = dist / radiusKm;
      const intensity: EMPCity['e1Intensity'] =
        fraction < 0.6 ? 'full' : fraction < 0.85 ? 'partial' : 'edge';
      const systems = intensity === 'full'
        ? ['Power grid', 'Communications', 'Transportation', 'Banking', 'Water/Sewer', 'Medical devices']
        : intensity === 'partial'
        ? ['Power grid', 'Communications', 'Some transportation']
        : ['Power grid (partial)'];
      return {
        name: city.name,
        lat: city.lat,
        lng: city.lng,
        population: city.population,
        distanceKm: Math.round(dist),
        e1Intensity: intensity,
        affectedSystems: systems,
      } as EMPCity;
    })
    .filter(Boolean) as EMPCity[];
}

/**
 * EMP scenario presets
 */
export interface EMPPreset {
  id: string;
  name: string;
  altitudeKm: number;
  yieldKt: number;
  targetLat: number;
  targetLng: number;
  description: string;
  threat: 1 | 2 | 3 | 4 | 5;
}

export const EMP_PRESETS: EMPPreset[] = [
  {
    id: 'conus-hemp',
    name: 'CONUS HEMP Strike',
    altitudeKm: 400,
    yieldKt: 1000,
    targetLat: 39.5,
    targetLng: -98.0,
    description: 'Single warhead detonated at 400km altitude over Kansas. Covers entire continental US with E1/E2/E3.',
    threat: 5,
  },
  {
    id: 'regional-hemp',
    name: 'Regional HEMP (East Coast)',
    altitudeKm: 100,
    yieldKt: 500,
    targetLat: 39.5,
    targetLng: -75.0,
    description: 'Lower altitude burst covering Eastern US — Washington, NYC, Boston, Philadelphia.',
    threat: 4,
  },
  {
    id: 'low-altitude',
    name: 'Low-Altitude Burst (30km)',
    altitudeKm: 30,
    yieldKt: 300,
    targetLat: 38.9072,
    targetLng: -77.0369,
    description: 'Near Washington DC. Limited EMP effect but significant blast radius below.',
    threat: 4,
  },
  {
    id: 'europe-hemp',
    name: 'European HEMP Strike',
    altitudeKm: 350,
    yieldKt: 800,
    targetLat: 50.0,
    targetLng: 10.0,
    description: 'Central Europe burst covering NATO nations. Knocks out EU power grid.',
    threat: 5,
  },
  {
    id: 'nk-emp',
    name: 'North Korea Test HEMP',
    altitudeKm: 150,
    yieldKt: 50,
    targetLat: 37.5,
    targetLng: 127.0,
    description: 'Lower yield burst over Korea. Affects South Korea, Japan, portions of China.',
    threat: 3,
  },
];
