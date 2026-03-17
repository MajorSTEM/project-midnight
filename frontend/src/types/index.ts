export interface LatLng {
  lat: number;
  lng: number;
}

export type BurstType = 'airburst' | 'surface';

export type NuclearNation =
  | 'USA'
  | 'Russia'
  | 'China'
  | 'UK'
  | 'France'
  | 'India'
  | 'Pakistan'
  | 'North Korea'
  | 'Israel'
  | 'Historical'
  | 'Unknown'
  | 'USA/NATO';

export interface WeaponPreset {
  name: string;
  yield: number | null;
  nation: NuclearNation | null;
}

export interface BlastEffects {
  yieldKt: number;
  burstType: BurstType;
  fireballRadius: number;       // km
  heavyBlastRadius: number;     // 20 psi - km
  moderateBlastRadius: number;  // 5 psi - km
  lightBlastRadius: number;     // 1 psi - km
  radiationRadius: number;      // lethal 500 rem - km
  thermalRadius: number;        // 3rd degree burns - km
  fireballAreaKm2: number;
  heavyBlastAreaKm2: number;
  moderateBlastAreaKm2: number;
  lightBlastAreaKm2: number;
  thermalAreaKm2: number;
}

export interface CasualtyEstimate {
  immediateDeaths: number;
  injured: number;
  longTermRadiationDeaths: number;
  total: number;
  breakdown: {
    fireballDeaths: number;
    heavyBlastDeaths: number;
    moderateBlastDeaths: number;
    lightBlastDeaths: number;
  };
}

export interface FalloutPlume {
  points: LatLng[];
  lengthKm: number;
  widthKm: number;
}

export interface StrikeConfig {
  id: string;
  location: LatLng | null;
  yieldKt: number;
  burstType: BurstType;
  nation: NuclearNation;
  windDirection: number;   // degrees, 0 = North
  windSpeed: number;       // km/h
  populationDensity: number; // people/km²
  presetName: string | null;
}

export interface SimulationResult {
  effects: BlastEffects;
  casualties: CasualtyEstimate;
  falloutPlume: FalloutPlume | null;
  strikeLocation: LatLng;
  timestamp: Date;
}

export interface MultiStrikeScenario {
  id: string;
  name: string;
  strikes: StrikeConfig[];
  createdAt: string;
}

export interface AggregateResult {
  strikes: SimulationResult[];
  totalImmediateDeaths: number;
  totalInjured: number;
  totalLongTermDeaths: number;
  totalAffectedAreaKm2: number;
  citiesAffected: number;
}

export interface UserLocation {
  address: string;
  coords: LatLng | null;
  distanceFromStrike: number | null;
  zone: 'fireball' | 'heavy' | 'moderate' | 'light' | 'thermal' | 'radiation' | 'fallout' | 'safe' | null;
  recommendation: 'evacuate-immediately' | 'bug-out' | 'shelter-in-place' | 'safe' | null;
}

export type ResultTab = 'impact' | 'survivability' | 'preparedness' | 'narrative';

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: { name: string; url: string };
  publishedAt: string;
}

export interface EscalationData {
  score: number;
  level: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  articles: NewsArticle[];
  lastUpdated: string;
}

export interface FEMADisaster {
  disasterNumber: number;
  declarationDate: string;
  declarationTitle: string;
  incidentType: string;
  state: string;
  designatedArea: string;
  lat?: number;
  lng?: number;
}

export interface IPAWSAlert {
  identifier: string;
  sender: string;
  sent: string;
  status: string;
  msgType: string;
  scope: string;
  note: string;
  areaDesc: string;
}

export type SimulationMode = 'nuclear' | 'zombie' | 'asteroid' | 'emp' | 'pandemic';

export interface ZombieSimConfig {
  origin: LatLng | null;
  zombieTypeId: string;
  patientZeroCount: number;
  populationSize: number;
  militaryResponse: 'none' | 'local' | 'national' | 'full' | 'global';
  simulationDays: number;
  cureResearch: boolean;
  survivorBehavior: 'cooperative' | 'fractured' | 'hostile' | 'armed';
}

export interface SEIRDState {
  day: number;
  susceptible: number;
  exposed: number;
  infected: number;
  recovered: number;
  dead: number;
  reanimated: number;
  totalZombies: number;
  spreadRadiusKm: number;
  infrastructureIntact: number;
  militaryEffectiveness: number;
}

export interface SavedScenario {
  id: string;
  name: string;
  type: 'nuclear' | 'zombie';
  savedAt: string;
  nuclear?: {
    config: StrikeConfig | StrikeConfig[];
    isMultiStrike: boolean;
  };
  zombie?: {
    config: ZombieSimConfig;
    zombieTypeId: string;
    peakInfected: number;
    daysSurvived: number;
  };
  thumbnail?: string;
}
