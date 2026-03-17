/**
 * Pandemic Simulation Engine
 * Standard SEIR model adapted for diverse pathogen types
 * Separate from zombie module — models real-world disease dynamics
 */

export interface PathogenType {
  id: string;
  name: string;
  category: 'respiratory' | 'hemorrhagic' | 'neurological' | 'vector-borne' | 'bioweapon' | 'novel';
  R0: number;              // Basic reproduction number
  incubationDays: number;  // Exposure to infectious
  infectiousDays: number;  // Duration of infectiousness
  IFR: number;             // Infection fatality rate (0-1)
  CFR: number;             // Case fatality rate (0-1, for symptomatic only)
  asymptomaticRate: number;// Fraction of cases asymptomatic (0-1)
  hospitalizationRate: number; // Fraction requiring hospitalization
  icuRate: number;         // Fraction requiring ICU
  vaccineDaysToDeployment: number | null; // Days until vaccine available, null = never
  treatmentAvailable: boolean;
  treatmentEfficacy: number; // Reduces IFR by this fraction if treated
  aerosolTransmission: boolean;
  dropletTransmission: boolean;
  contactTransmission: boolean;
  bloodborneTransmission: boolean;
  maskEfficacy: number;     // Fraction reduction in transmission from N95
  color: string;            // Hex for map
  threatLevel: 1 | 2 | 3 | 4 | 5;
  historicalIFR?: string;
  description: string;
}

export interface PandemicConfig {
  pathogenId: string;
  originLat: number;
  originLng: number;
  originName: string;
  patientZeroCount: number;
  populationSize: number;
  populationDensity: number; // people/km²
  publicHealthResponse: 'none' | 'weak' | 'moderate' | 'strong' | 'extreme';
  vaccineCampaign: boolean;
  quarantineEffectiveness: number; // 0-1
  simulationDays: number;
  internationalTravel: boolean;    // Affects global spread
}

export interface PandemicDayState {
  day: number;
  susceptible: number;
  exposed: number;
  infected: number;        // Active symptomatic
  asymptomatic: number;    // Infected but asymptomatic
  hospitalized: number;
  icu: number;
  recovered: number;
  dead: number;
  cumulativeInfected: number;
  cumulativeDead: number;
  spreadRadiusKm: number;
  effectiveR: number;      // R_t (real-time reproduction number)
  herdImmunityReached: boolean;
  healthSystemCollapsed: boolean;  // ICU capacity exceeded
  vaccineCoveragePercent: number;
  infrastructureIntact: number;    // 0-1
}

// Standard SEIR with asymptomatic/hospitalization compartments
export function runPandemicSimulation(
  config: PandemicConfig,
  pathogen: PathogenType
): PandemicDayState[] {
  const N = config.populationSize;
  let S = N - config.patientZeroCount;
  let E = 0;
  let I = config.patientZeroCount;        // Symptomatic infected
  let A = 0;                               // Asymptomatic infected
  let H = 0;                               // Hospitalized
  let ICU = 0;
  let R = 0;
  let D = 0;
  let cumulativeInfected = config.patientZeroCount;
  let cumulativeDead = 0;
  let vaccineCoverage = 0;
  let spreadRadius = 0.5;

  // Public health response multiplier on R0
  const responseMultiplier: Record<typeof config.publicHealthResponse, number> = {
    none: 1.0,
    weak: 0.8,
    moderate: 0.65,
    strong: 0.45,
    extreme: 0.25,
  };
  const responseEffect = responseMultiplier[config.publicHealthResponse];

  // ICU capacity: ~20 ICU beds per 100,000 people (US average)
  const icuCapacity = N * 0.0002;

  const sigma = 1 / pathogen.incubationDays;  // E→I rate
  const gamma = 1 / pathogen.infectiousDays;  // I→R/D rate
  const asymptFrac = pathogen.asymptomaticRate;
  const hospFrac = pathogen.hospitalizationRate;
  const icuFrac = pathogen.icuRate;

  const results: PandemicDayState[] = [];

  for (let day = 0; day <= config.simulationDays; day++) {
    // Effective R0 accounting for interventions, quarantine, population immunity
    const immuneFrac = (R + D) / N;
    const quarantineEffect = 1 - config.quarantineEffectiveness * 0.5;
    const vaccineEffect = 1 - vaccineCoverage / 100 * 0.85; // 85% vaccine efficacy
    const healthSystemStrain = H > icuCapacity ? 1.15 : 1.0; // Stressed system = worse outcomes
    const effectiveR = pathogen.R0 * responseEffect * quarantineEffect * vaccineEffect * (1 - immuneFrac);

    const beta = effectiveR * gamma;

    // Transmission from both symptomatic and (less) asymptomatic
    const infectiousPressure = I + A * 0.5; // Asymptomatics 50% as infectious
    const newExposed = (beta * S * infectiousPressure) / N;

    // Transitions
    const newSymptInfected = sigma * E * (1 - asymptFrac);
    const newAsymptInfected = sigma * E * asymptFrac;

    // From symptomatic: some hospitalized, some recover/die at home
    const newHospitalized = gamma * I * hospFrac;
    const newHomeRecovered = gamma * I * (1 - hospFrac) * (1 - pathogen.IFR);
    const newHomeDead = gamma * I * (1 - hospFrac) * pathogen.IFR;

    // From hospitalized: ICU or recover
    const newICU = H * 0.05 * (icuFrac / hospFrac); // Daily ICU admission rate
    const newHospRecovered = H * 0.07 * (1 - pathogen.CFR * 0.4);
    const newHospDead = H * 0.07 * pathogen.CFR * 0.4;

    // ICU — high mortality if over capacity
    const icuMortality = ICU > icuCapacity ? pathogen.CFR : pathogen.CFR * 0.3;
    const newICURecovered = ICU * 0.05 * (1 - icuMortality);
    const newICUDead = ICU * 0.05 * icuMortality;

    // Asymptomatic recovery (faster, no deaths typically)
    const newAsymptRecovered = A * gamma;

    // Update compartments
    S = Math.max(0, S - newExposed);
    E = Math.max(0, E + newExposed - newSymptInfected - newAsymptInfected);
    I = Math.max(0, I + newSymptInfected - newHospitalized - newHomeRecovered - newHomeDead);
    A = Math.max(0, A + newAsymptInfected - newAsymptRecovered);
    H = Math.max(0, H + newHospitalized - newICU - newHospRecovered - newHospDead);
    ICU = Math.max(0, ICU + newICU - newICURecovered - newICUDead);
    R = Math.max(0, R + newHomeRecovered + newHospRecovered + newICURecovered + newAsymptRecovered);
    D = Math.max(0, D + newHomeDead + newHospDead + newICUDead);

    cumulativeInfected += newSymptInfected + newAsymptInfected;
    cumulativeDead += newHomeDead + newHospDead + newICUDead;

    // Vaccine rollout
    if (config.vaccineCampaign && pathogen.vaccineDaysToDeployment !== null) {
      if (day > pathogen.vaccineDaysToDeployment) {
        const daysVaccinating = day - pathogen.vaccineDaysToDeployment;
        vaccineCoverage = Math.min(70, daysVaccinating * 0.3); // 0.3% per day up to 70%
      }
    }

    // Spread radius grows with cumulative infections
    spreadRadius = Math.min(
      20000,
      0.5 + Math.sqrt(cumulativeInfected / config.populationDensity) * (config.internationalTravel ? 3 : 1)
    );

    // Herd immunity threshold: 1 - 1/R0
    const herdImmunityThreshold = 1 - 1 / pathogen.R0;
    const herdReached = (R + D + vaccineCoverage / 100 * N) / N >= herdImmunityThreshold;

    // Infrastructure stress
    const infrastructureIntact = Math.max(0.3,
      1 - (D / N) * 10 - Math.max(0, (ICU - icuCapacity) / icuCapacity) * 0.3
    );

    results.push({
      day,
      susceptible: Math.round(S),
      exposed: Math.round(E),
      infected: Math.round(I),
      asymptomatic: Math.round(A),
      hospitalized: Math.round(H),
      icu: Math.round(ICU),
      recovered: Math.round(R),
      dead: Math.round(D),
      cumulativeInfected: Math.round(cumulativeInfected),
      cumulativeDead: Math.round(cumulativeDead),
      spreadRadiusKm: Math.round(spreadRadius * 10) / 10,
      effectiveR: Math.round(effectiveR * 100) / 100,
      herdImmunityReached: herdReached,
      healthSystemCollapsed: ICU > icuCapacity,
      vaccineCoveragePercent: Math.round(vaccineCoverage),
      infrastructureIntact: Math.round(infrastructureIntact * 100) / 100,
    });

    if (I < 1 && E < 1 && A < 1 && day > 30) break;
  }

  return results;
}

/**
 * 20+ pathogen presets
 */
export const PATHOGEN_PRESETS: PathogenType[] = [
  {
    id: 'covid-19',
    name: 'COVID-19 (Wildtype)',
    category: 'respiratory',
    R0: 2.9,
    incubationDays: 5,
    infectiousDays: 10,
    IFR: 0.006,
    CFR: 0.022,
    asymptomaticRate: 0.35,
    hospitalizationRate: 0.05,
    icuRate: 0.015,
    vaccineDaysToDeployment: 365,
    treatmentAvailable: true,
    treatmentEfficacy: 0.4,
    aerosolTransmission: true,
    dropletTransmission: true,
    contactTransmission: true,
    bloodborneTransmission: false,
    maskEfficacy: 0.85,
    color: '#4488ff',
    threatLevel: 3,
    historicalIFR: '0.5–1.0% (2020–21 original strain)',
    description: 'Original SARS-CoV-2 strain as emerged in Wuhan, China in late 2019.',
  },
  {
    id: 'covid-omicron',
    name: 'COVID-19 (Omicron BA.2)',
    category: 'respiratory',
    R0: 12,
    incubationDays: 3,
    infectiousDays: 5,
    IFR: 0.001,
    CFR: 0.005,
    asymptomaticRate: 0.5,
    hospitalizationRate: 0.015,
    icuRate: 0.003,
    vaccineDaysToDeployment: 30,
    treatmentAvailable: true,
    treatmentEfficacy: 0.6,
    aerosolTransmission: true,
    dropletTransmission: true,
    contactTransmission: false,
    bloodborneTransmission: false,
    maskEfficacy: 0.7,
    color: '#66aaff',
    threatLevel: 2,
    description: 'Highly transmissible Omicron variant with significantly reduced severity.',
  },
  {
    id: 'influenza-1918',
    name: 'Spanish Flu (1918 H1N1)',
    category: 'respiratory',
    R0: 3.0,
    incubationDays: 1.5,
    infectiousDays: 5,
    IFR: 0.025,
    CFR: 0.10,
    asymptomaticRate: 0.2,
    hospitalizationRate: 0.15,
    icuRate: 0.05,
    vaccineDaysToDeployment: null,
    treatmentAvailable: false,
    treatmentEfficacy: 0,
    aerosolTransmission: true,
    dropletTransmission: true,
    contactTransmission: true,
    bloodborneTransmission: false,
    maskEfficacy: 0.5,
    color: '#ff8844',
    threatLevel: 5,
    historicalIFR: '2.5% — killed 50–100 million 1918-1919',
    description: 'The deadliest pandemic in modern history — killed 50–100 million in 1918–1919.',
  },
  {
    id: 'influenza-seasonal',
    name: 'Seasonal Influenza (H3N2)',
    category: 'respiratory',
    R0: 1.5,
    incubationDays: 2,
    infectiousDays: 5,
    IFR: 0.001,
    CFR: 0.003,
    asymptomaticRate: 0.3,
    hospitalizationRate: 0.01,
    icuRate: 0.002,
    vaccineDaysToDeployment: 30,
    treatmentAvailable: true,
    treatmentEfficacy: 0.5,
    aerosolTransmission: true,
    dropletTransmission: true,
    contactTransmission: false,
    bloodborneTransmission: false,
    maskEfficacy: 0.6,
    color: '#88ccff',
    threatLevel: 2,
    description: 'Standard seasonal influenza — reference baseline for outbreak simulation.',
  },
  {
    id: 'ebola-makona',
    name: 'Ebola (Makona strain, 2014)',
    category: 'hemorrhagic',
    R0: 2.0,
    incubationDays: 11,
    infectiousDays: 7,
    IFR: 0.50,
    CFR: 0.70,
    asymptomaticRate: 0.0,
    hospitalizationRate: 0.80,
    icuRate: 0.40,
    vaccineDaysToDeployment: 300,
    treatmentAvailable: true,
    treatmentEfficacy: 0.5,
    aerosolTransmission: false,
    dropletTransmission: false,
    contactTransmission: true,
    bloodborneTransmission: true,
    maskEfficacy: 0.3,
    color: '#cc2200',
    threatLevel: 5,
    historicalIFR: '40–90% depending on strain and healthcare access',
    description: 'West African Ebola outbreak strain — 50% fatality rate, spread by direct contact with bodily fluids.',
  },
  {
    id: 'smallpox',
    name: 'Smallpox (Variola Major)',
    category: 'respiratory',
    R0: 6.0,
    incubationDays: 12,
    infectiousDays: 8,
    IFR: 0.30,
    CFR: 0.30,
    asymptomaticRate: 0.0,
    hospitalizationRate: 0.60,
    icuRate: 0.20,
    vaccineDaysToDeployment: 90,
    treatmentAvailable: false,
    treatmentEfficacy: 0,
    aerosolTransmission: true,
    dropletTransmission: true,
    contactTransmission: true,
    bloodborneTransmission: false,
    maskEfficacy: 0.8,
    color: '#cc6600',
    threatLevel: 5,
    historicalIFR: '30% — eradicated 1980, WHO stockpiles maintained',
    description: 'Eradicated in 1980 but maintained in WHO-monitored labs. 30% fatality, airborne transmission.',
  },
  {
    id: 'plague-pneumonic',
    name: 'Pneumonic Plague (Yersinia pestis)',
    category: 'respiratory',
    R0: 1.8,
    incubationDays: 2,
    infectiousDays: 3,
    IFR: 0.90,
    CFR: 0.90,
    asymptomaticRate: 0.05,
    hospitalizationRate: 0.90,
    icuRate: 0.80,
    vaccineDaysToDeployment: null,
    treatmentAvailable: true,
    treatmentEfficacy: 0.95, // Antibiotics highly effective if given early
    aerosolTransmission: true,
    dropletTransmission: true,
    contactTransmission: false,
    bloodborneTransmission: false,
    maskEfficacy: 0.85,
    color: '#442200',
    threatLevel: 5,
    historicalIFR: 'Near 100% untreated. Black Death killed 30-60% of Europe.',
    description: 'Pneumonic plague — nearly 100% fatal untreated but responds to antibiotics if caught early.',
  },
  {
    id: 'mers-cov',
    name: 'MERS-CoV',
    category: 'respiratory',
    R0: 0.9,
    incubationDays: 5,
    infectiousDays: 7,
    IFR: 0.35,
    CFR: 0.35,
    asymptomaticRate: 0.15,
    hospitalizationRate: 0.50,
    icuRate: 0.30,
    vaccineDaysToDeployment: null,
    treatmentAvailable: false,
    treatmentEfficacy: 0,
    aerosolTransmission: false,
    dropletTransmission: true,
    contactTransmission: true,
    bloodborneTransmission: false,
    maskEfficacy: 0.75,
    color: '#ddaa00',
    threatLevel: 3,
    historicalIFR: '34% as of 2023 (2,519 deaths, 2,600 cases WHO-confirmed)',
    description: 'Middle East Respiratory Syndrome — 34% fatality rate but limited human-to-human transmission.',
  },
  {
    id: 'nipah-virus',
    name: 'Nipah Virus (Bangladesh)',
    category: 'neurological',
    R0: 0.5,
    incubationDays: 14,
    infectiousDays: 7,
    IFR: 0.70,
    CFR: 0.75,
    asymptomaticRate: 0.05,
    hospitalizationRate: 0.70,
    icuRate: 0.50,
    vaccineDaysToDeployment: null,
    treatmentAvailable: false,
    treatmentEfficacy: 0,
    aerosolTransmission: false,
    dropletTransmission: true,
    contactTransmission: true,
    bloodborneTransmission: true,
    maskEfficacy: 0.7,
    color: '#aa4488',
    threatLevel: 4,
    historicalIFR: '40–75% depending on strain',
    description: 'Bat-origin neurological virus with 40-75% fatality rate — feared pandemic candidate.',
  },
  {
    id: 'marburg',
    name: 'Marburg Virus',
    category: 'hemorrhagic',
    R0: 1.8,
    incubationDays: 7,
    infectiousDays: 10,
    IFR: 0.55,
    CFR: 0.55,
    asymptomaticRate: 0.0,
    hospitalizationRate: 0.85,
    icuRate: 0.50,
    vaccineDaysToDeployment: null,
    treatmentAvailable: false,
    treatmentEfficacy: 0.2,
    aerosolTransmission: false,
    dropletTransmission: false,
    contactTransmission: true,
    bloodborneTransmission: true,
    maskEfficacy: 0.3,
    color: '#880000',
    threatLevel: 5,
    description: 'Marburg hemorrhagic fever — closely related to Ebola, 55% average fatality rate.',
  },
  {
    id: 'disease-x-moderate',
    name: 'Disease X (Moderate Pandemic)',
    category: 'novel',
    R0: 4.0,
    incubationDays: 4,
    infectiousDays: 8,
    IFR: 0.02,
    CFR: 0.05,
    asymptomaticRate: 0.4,
    hospitalizationRate: 0.08,
    icuRate: 0.02,
    vaccineDaysToDeployment: 270,
    treatmentAvailable: false,
    treatmentEfficacy: 0,
    aerosolTransmission: true,
    dropletTransmission: true,
    contactTransmission: true,
    bloodborneTransmission: false,
    maskEfficacy: 0.75,
    color: '#ff66aa',
    threatLevel: 3,
    description: 'WHO "Disease X" hypothetical — novel pathogen with COVID-level transmissibility and higher severity.',
  },
  {
    id: 'disease-x-severe',
    name: 'Disease X (Severe Pandemic)',
    category: 'novel',
    R0: 6.0,
    incubationDays: 3,
    infectiousDays: 7,
    IFR: 0.10,
    CFR: 0.25,
    asymptomaticRate: 0.2,
    hospitalizationRate: 0.20,
    icuRate: 0.08,
    vaccineDaysToDeployment: null,
    treatmentAvailable: false,
    treatmentEfficacy: 0,
    aerosolTransmission: true,
    dropletTransmission: true,
    contactTransmission: true,
    bloodborneTransmission: false,
    maskEfficacy: 0.8,
    color: '#ff0066',
    threatLevel: 5,
    description: 'Worst-case Disease X — flu transmissibility combined with 10% IFR. Civilization-threatening.',
  },
  {
    id: 'bioweapon-anthrax',
    name: 'Anthrax (Inhalation)',
    category: 'bioweapon',
    R0: 0.5, // Not person-to-person primarily
    incubationDays: 4,
    infectiousDays: 5,
    IFR: 0.80,
    CFR: 0.80,
    asymptomaticRate: 0.0,
    hospitalizationRate: 0.90,
    icuRate: 0.60,
    vaccineDaysToDeployment: 60,
    treatmentAvailable: true,
    treatmentEfficacy: 0.7,
    aerosolTransmission: false,
    dropletTransmission: false,
    contactTransmission: false,
    bloodborneTransmission: false,
    maskEfficacy: 0.95,
    color: '#666600',
    threatLevel: 4,
    description: 'Weaponized Bacillus anthracis — 80% lethal inhalation form, not person-to-person contagious.',
  },
  {
    id: 'bioweapon-engineered',
    name: 'Engineered Pathogen (Hypothetical)',
    category: 'bioweapon',
    R0: 8.0,
    incubationDays: 2,
    infectiousDays: 6,
    IFR: 0.30,
    CFR: 0.40,
    asymptomaticRate: 0.3,
    hospitalizationRate: 0.40,
    icuRate: 0.15,
    vaccineDaysToDeployment: null,
    treatmentAvailable: false,
    treatmentEfficacy: 0,
    aerosolTransmission: true,
    dropletTransmission: true,
    contactTransmission: true,
    bloodborneTransmission: false,
    maskEfficacy: 0.6,
    color: '#440044',
    threatLevel: 5,
    description: 'Hypothetical engineered bioweapon — maximum transmissibility combined with high lethality. Classified threat scenario.',
  },
  {
    id: 'cholera-pandemic',
    name: 'Cholera (Pandemic Strain)',
    category: 'vector-borne',
    R0: 3.5,
    incubationDays: 2,
    infectiousDays: 5,
    IFR: 0.015,
    CFR: 0.40, // Without treatment
    asymptomaticRate: 0.75,
    hospitalizationRate: 0.10,
    icuRate: 0.02,
    vaccineDaysToDeployment: 60,
    treatmentAvailable: true,
    treatmentEfficacy: 0.99, // ORS nearly 100% effective
    aerosolTransmission: false,
    dropletTransmission: false,
    contactTransmission: true,
    bloodborneTransmission: false,
    maskEfficacy: 0.1,
    color: '#004488',
    threatLevel: 3,
    description: 'Waterborne cholera — nearly harmless with clean water, devastating without it.',
  },
];
