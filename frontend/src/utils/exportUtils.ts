import type { SimulationResult, StrikeConfig, AggregateResult } from '../types';

function formatNum(n: number): string {
  return n.toLocaleString('en-US');
}

function formatKm(n: number): string {
  return n.toFixed(2);
}

function pad(label: string, width: number): string {
  return label.padEnd(width, ' ');
}

function buildResultText(result: SimulationResult, config: StrikeConfig): string {
  const { effects, casualties, falloutPlume, strikeLocation } = result;
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  const lines: string[] = [
    'PROJECT MIDNIGHT — GCSP SIMULATION REPORT',
    '==========================================',
    `Generated: ${timestamp}`,
    '',
    'STRIKE CONFIGURATION',
    `  ${pad('Yield:', 24)}${effects.yieldKt} kt`,
    `  ${pad('Burst Type:', 24)}${effects.burstType}`,
    `  ${pad('Nation:', 24)}${config.nation}`,
    `  ${pad('Coordinates:', 24)}${strikeLocation.lat.toFixed(4)}°, ${strikeLocation.lng.toFixed(4)}°`,
    `  ${pad('Wind Direction:', 24)}${config.windDirection}°`,
    `  ${pad('Wind Speed:', 24)}${config.windSpeed} km/h`,
    `  ${pad('Pop. Density:', 24)}${formatNum(config.populationDensity)} people/km²`,
    '',
    'BLAST EFFECTS',
    `  ${pad('Fireball Radius:', 26)}${formatKm(effects.fireballRadius)} km`,
    `  ${pad('Heavy Blast (20 psi):', 26)}${formatKm(effects.heavyBlastRadius)} km`,
    `  ${pad('Moderate Blast (5 psi):', 26)}${formatKm(effects.moderateBlastRadius)} km`,
    `  ${pad('Light Blast (1 psi):', 26)}${formatKm(effects.lightBlastRadius)} km`,
    `  ${pad('Thermal Burns:', 26)}${formatKm(effects.thermalRadius)} km`,
    `  ${pad('Radiation Zone:', 26)}${formatKm(effects.radiationRadius)} km`,
    '',
    'CASUALTY ESTIMATE',
    `  ${pad('Immediate Deaths:', 24)}${formatNum(casualties.immediateDeaths)}`,
    `  ${pad('Injured:', 24)}${formatNum(casualties.injured)}`,
    `  ${pad('Long-term Deaths:', 24)}${formatNum(casualties.longTermRadiationDeaths)}`,
    `  ${pad('Total Affected:', 24)}${formatNum(casualties.total)}`,
  ];

  if (falloutPlume) {
    lines.push('');
    lines.push('FALLOUT PLUME (Surface Burst)');
    lines.push(`  ${pad('Plume Length:', 24)}${formatKm(falloutPlume.lengthKm)} km`);
    lines.push(`  ${pad('Plume Width:', 24)}${formatKm(falloutPlume.widthKm)} km`);
  }

  lines.push('');
  lines.push('---');
  lines.push('Educational simulation. Glasstone-Dolan scaling laws.');
  lines.push('LandScan population model approximation.');
  lines.push('Project Midnight — Global Catastrophe Simulation Platform');

  return lines.join('\n');
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportResultsAsText(result: SimulationResult, config: StrikeConfig): void {
  const text = buildResultText(result, config);
  const timestamp = Date.now();
  triggerDownload(text, `gcsp-simulation-${timestamp}.txt`, 'text/plain');
}

export function exportResultsAsJSON(result: SimulationResult, config: StrikeConfig): void {
  const payload = {
    meta: {
      generated: new Date().toISOString(),
      platform: 'GCSP — Project Midnight',
      version: '1.5',
    },
    config,
    result: {
      ...result,
      timestamp: result.timestamp.toISOString(),
    },
  };
  const json = JSON.stringify(payload, null, 2);
  const timestamp = Date.now();
  triggerDownload(json, `gcsp-simulation-${timestamp}.json`, 'application/json');
}

export function exportAggregateAsText(
  aggregateResult: AggregateResult,
  strikes: StrikeConfig[],
): void {
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  const lines: string[] = [
    'PROJECT MIDNIGHT — GCSP MULTI-STRIKE AGGREGATE REPORT',
    '======================================================',
    `Generated: ${timestamp}`,
    '',
    'AGGREGATE SUMMARY',
    `  ${pad('Strikes:', 30)}${aggregateResult.citiesAffected}`,
    `  ${pad('Total Immediate Deaths:', 30)}${formatNum(aggregateResult.totalImmediateDeaths)}`,
    `  ${pad('Total Injured:', 30)}${formatNum(aggregateResult.totalInjured)}`,
    `  ${pad('Total Long-term Deaths:', 30)}${formatNum(aggregateResult.totalLongTermDeaths)}`,
    `  ${pad('Total Affected Area:', 30)}${aggregateResult.totalAffectedAreaKm2.toFixed(0)} km²`,
    '',
    'PER-STRIKE BREAKDOWN',
  ];

  aggregateResult.strikes.forEach((sr, idx) => {
    const cfg = strikes[idx];
    lines.push('');
    lines.push(`  Strike #${idx + 1}${cfg?.presetName ? ` — ${cfg.presetName}` : ''}`);
    lines.push(`    ${pad('Yield:', 22)}${sr.effects.yieldKt} kt`);
    lines.push(`    ${pad('Burst Type:', 22)}${sr.effects.burstType}`);
    lines.push(`    ${pad('Nation:', 22)}${cfg?.nation ?? 'Unknown'}`);
    lines.push(
      `    ${pad('Coordinates:', 22)}${sr.strikeLocation.lat.toFixed(4)}°, ${sr.strikeLocation.lng.toFixed(4)}°`,
    );
    lines.push(`    ${pad('Immediate Deaths:', 22)}${formatNum(sr.casualties.immediateDeaths)}`);
    lines.push(`    ${pad('Injured:', 22)}${formatNum(sr.casualties.injured)}`);
  });

  lines.push('');
  lines.push('---');
  lines.push('Educational simulation. Glasstone-Dolan scaling laws.');
  lines.push('Project Midnight — Global Catastrophe Simulation Platform');

  const tsNum = Date.now();
  triggerDownload(lines.join('\n'), `gcsp-aggregate-${tsNum}.txt`, 'text/plain');
}

export async function copyResultsToClipboard(
  result: SimulationResult,
  config: StrikeConfig,
): Promise<void> {
  const text = buildResultText(result, config);
  await navigator.clipboard.writeText(text);
}
