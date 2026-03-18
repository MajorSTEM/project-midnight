/**
 * directApi.ts
 * All external API calls run directly from the browser/WebView.
 * No backend server required — works fully offline for simulations,
 * and with user-supplied API keys for AI features and live data.
 */

import { useSettingsStore } from '../stores/settingsStore';

// ─── Weather ─────────────────────────────────────────────────────────────────

export async function fetchWeatherDirect(lat: number, lng: number): Promise<{
  windSpeedKmh: number;
  windDirectionDeg: number;
  source: string;
}> {
  // Only works for US locations — NOAA NWS public API, no key needed, has CORS
  if (lat < 24 || lat > 50 || lng < -125 || lng > -66) {
    return { windSpeedKmh: 30, windDirectionDeg: 270, source: 'default' };
  }
  try {
    const pointsRes = await fetch(
      `https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`,
      { headers: { 'User-Agent': 'GCSP-Educational-Simulator/1.0' } }
    );
    if (!pointsRes.ok) throw new Error('NWS points failed');
    const pointsData = await pointsRes.json() as { properties: { forecastGridData: string } };

    const gridRes = await fetch(pointsData.properties.forecastGridData, {
      headers: { 'User-Agent': 'GCSP-Educational-Simulator/1.0' },
    });
    if (!gridRes.ok) throw new Error('NWS grid failed');
    const gridData = await gridRes.json() as {
      properties: {
        windSpeed: { values: Array<{ value: number }> };
        windDirection: { values: Array<{ value: number }> };
      };
    };

    const speedMs = gridData.properties.windSpeed?.values?.[0]?.value ?? 8.3;
    const dir     = gridData.properties.windDirection?.values?.[0]?.value ?? 270;
    return { windSpeedKmh: Math.round(speedMs * 3.6), windDirectionDeg: Math.round(dir), source: 'noaa-nws' };
  } catch {
    return { windSpeedKmh: 30, windDirectionDeg: 270, source: 'default' };
  }
}

// ─── News ─────────────────────────────────────────────────────────────────────

export async function fetchNewsDirect(query: string): Promise<{
  score: number;
  level: string;
  articles: Array<{ title: string; description: string; url: string; source: { name: string; url: string }; publishedAt: string }>;
}> {
  const { gnewsApiKey } = useSettingsStore.getState();
  if (!gnewsApiKey) return { score: 0, level: 'LOW', articles: [] };

  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&token=${gnewsApiKey}&lang=en&max=10&in=title,description`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GNews ${res.status}`);
    const data = await res.json() as { articles: Array<{ title: string; description: string; url: string; source: { name: string; url: string }; publishedAt: string }> };
    const articles = data.articles || [];

    const highRisk = ['nuclear', 'warhead', 'missile launch', 'icbm'];
    const medRisk  = ['military escalation', 'war', 'invasion', 'strike'];
    const lowRisk  = ['sanctions', 'nato', 'tensions', 'threat'];
    let score = 0;
    for (const a of articles) {
      const t = ((a.title || '') + ' ' + (a.description || '')).toLowerCase();
      for (const kw of highRisk) if (t.includes(kw)) score += 10;
      for (const kw of medRisk)  if (t.includes(kw)) score += 8;
      for (const kw of lowRisk)  if (t.includes(kw)) score += 5;
    }
    score = Math.min(100, score);
    const level = score <= 30 ? 'LOW' : score <= 60 ? 'ELEVATED' : score <= 80 ? 'HIGH' : 'CRITICAL';
    return { score, level, articles };
  } catch {
    return { score: 0, level: 'LOW', articles: [] };
  }
}

// ─── FEMA ─────────────────────────────────────────────────────────────────────

export async function fetchFemaDirect(path: string): Promise<unknown> {
  const base = 'https://www.fema.gov/api/open';
  try {
    const res = await fetch(`${base}${path}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`FEMA ${res.status}`);
    return await res.json();
  } catch {
    return null;
  }
}

// ─── AI Streaming ─────────────────────────────────────────────────────────────

/** Parse Anthropic SSE stream, calling onChunk for each text delta */
async function streamClaude(
  prompt: string,
  model: string,
  maxTokens: number,
  onChunk: (t: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const { claudeApiKey } = useSettingsStore.getState();
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': claudeApiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true',
      'content-type': 'application/json',
    },
    signal,
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok || !res.body) throw new Error(`Claude ${res.status}`);

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const raw = line.slice(5).trim();
      if (raw === '[DONE]') return;
      try {
        const evt = JSON.parse(raw) as { type: string; delta?: { type: string; text: string } };
        if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
          onChunk(evt.delta.text);
        }
      } catch { /* skip malformed */ }
    }
  }
}

/** Parse OpenAI SSE stream */
async function streamOpenAI(
  prompt: string,
  model: string,
  maxTokens: number,
  onChunk: (t: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const { openaiApiKey } = useSettingsStore.getState();
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    signal,
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok || !res.body) throw new Error(`OpenAI ${res.status}`);

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const raw = line.slice(5).trim();
      if (raw === '[DONE]') return;
      try {
        const evt = JSON.parse(raw) as { choices?: Array<{ delta?: { content?: string } }> };
        const text = evt.choices?.[0]?.delta?.content;
        if (text) onChunk(text);
      } catch { /* skip */ }
    }
  }
}

/** Simulate streaming from a pre-written string (offline fallback) */
async function streamMock(
  text: string,
  onChunk: (t: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const words = text.split(' ');
  const chunkSize = 5;
  for (let i = 0; i < words.length; i += chunkSize) {
    if (signal?.aborted) return;
    const chunk = words.slice(i, i + chunkSize).join(' ') + (i + chunkSize < words.length ? ' ' : '');
    onChunk(chunk);
    await new Promise((r) => setTimeout(r, 18));
  }
}

// ─── Narrative prompts ────────────────────────────────────────────────────────

function buildNarrativePrompt(type: string, narrativeType: string, locationName?: string, config?: Record<string, unknown>): string {
  const loc = locationName || 'an unspecified location';
  if (type === 'nuclear') {
    const yieldKt = (config?.yieldKt as number) || 100;
    const burstType = (config?.burstType as string) || 'airburst';
    const yieldLabel = yieldKt >= 1000 ? `${(yieldKt / 1000).toFixed(1)} Mt` : `${yieldKt} kt`;
    if (narrativeType === 'aftermath') return `You are writing a vivid, educational nuclear detonation aftermath report from the perspective of an emergency manager. A ${yieldLabel} ${burstType} nuclear weapon has detonated at ${loc}. Write an hour-by-hour account over the first 72 hours. Include: flash/EMP effects, blast wave timing, firestorm, fallout, government response breakdown, survivor priorities. Use specific times (Hour 0:00, etc.). ~600 words. Educational and vivid.`;
    if (narrativeType === 'journal') return `Write a first-person 7-day survival journal from someone in ${loc} who survived a ${yieldLabel} nuclear detonation. Daily entries (Day 1-7). Include shelter-in-place, rationing, fallout monitoring, evacuation decision. Emotionally grounded. ~600 words.`;
    if (narrativeType === 'geopolitical') return `Write a geopolitical aftermath analysis following a nuclear detonation at ${loc}. Cover: attribution process, alliance activation (Article 5, Stafford Act), escalation vs de-escalation, UN Security Council response, global economic shock, 90-day outlook. ~400 words.`;
  }
  if (type === 'zombie') {
    if (narrativeType === 'aftermath') return `Write an educational outbreak narrative. A zombie-like pathogen (Category X behavioral virus) originated in ${loc}. Hour-by-hour account from patient zero through the first week. Include: initial misdiagnosis, transmission, health authority response, media coverage arc, containment collapse. ~600 words.`;
    if (narrativeType === 'journal') return `Write a first-person 7-day survival journal during a zombie outbreak near ${loc}. Day 1: awareness and shelter decision. Day 2-3: inventory, radio. Day 4-5: group dynamics, planning. Day 6-7: evacuation decision. ~600 words.`;
    if (narrativeType === 'geopolitical') return `Write a geopolitical analysis of how nations respond to a zombie-like pandemic outbreak from ${loc}. Cover: national containment, WHO coordination failures, border closures, military deployment, international cooperation, collapse scenarios. ~400 words.`;
  }
  return `Write a 400-word dramatic narrative about a catastrophic event at ${loc}.`;
}

function buildPredictionPrompt(timeframe: string, focus: string): string {
  const tf = timeframe === '30d' ? '30-DAY' : timeframe === '90d' ? '90-DAY' : '180-DAY';
  const focusNote = focus === 'nuclear'
    ? 'Focus on nuclear escalation risks.'
    : focus === 'conflict'
    ? 'Focus on conventional conflict escalation.'
    : 'Provide a combined nuclear and conventional risk assessment.';
  return `You are a senior geopolitical analyst at a fictional educational institute (GCSP). Generate a structured risk assessment for educational purposes. ${focusNote}

Format:
GCSP GEOPOLITICAL RISK ASSESSMENT — ${tf} FORECAST
================================================
1. CURRENT GLOBAL NUCLEAR RISK: [LOW/ELEVATED/HIGH/CRITICAL] ([X]/100)
2. KEY FLASHPOINTS (probability in ${tf.toLowerCase()} window):
   • [Region]: [XX]% — [reasoning]
   (5 flashpoints)
3. MOST LIKELY ESCALATION PATHWAY:
4. HISTORICAL PRECEDENT MATCH:
   Similarity score: [XX]%
5. SCENARIOS TO WATCH:
   🔴 [High urgency]: [desc]
   🟡 [Medium]: [desc]
   🟢 [Stabilizing]: [desc]
6. ${tf} OUTLOOK:

Confidence: [LOW/MODERATE/HIGH]
For educational purposes only.`;
}

// ─── Mock fallback content ────────────────────────────────────────────────────

const MOCK_NUCLEAR_AFTERMATH = `HOUR 0:00 — DETONATION

The flash arrives before the sound, before the shockwave, before any conscious thought. At ground zero, temperatures reach 100 million degrees Celsius. Everything within the fireball radius ceases to exist as solid matter. Steel evaporates. Concrete sublimates.

HOUR 0:00:02 — THE BLAST WAVE

Two seconds after detonation, the supersonic blast wave radiates outward at Mach 1.5. Within the heavy blast zone (20 psi), reinforced concrete structures collapse. At 5 psi, residential structures are destroyed. At 1 psi, windows shatter for miles. The thermal pulse has already ignited every combustible surface facing the fireball.

HOUR 0:15 — FIRESTORM INITIATION

Individual fires merge into a firestorm. Superheated air creates a low-pressure zone. Winds rush inward at 100–200 km/h. Carbon monoxide levels in shelter spaces become lethal.

HOUR 1:00 — FALLOUT CLOCK STARTS

For a ground burst, the mushroom cloud contains millions of tons of pulverized earth fused with radioactive fission products. This material begins falling downwind within 30–60 minutes. Emergency managers within 300 km downwind now face a cascading decision: fallout arrival time versus evacuation time available.

HOUR 6:00 — MEDICAL SYSTEM COLLAPSE

Hospitals within the light blast radius are overwhelmed. Triage protocols shift to expectant for radiation exposure above 600 rem. Blood supply depletes within 48 hours. The "walking wounded" period — radiation sickness not manifesting for 1–3 days — creates false hope and delays evacuation decisions.

HOUR 24:00 — DAY ONE ENDS

Survivors who sheltered effectively begin assessing situations. The fallout plume downwind carries 10–100 rem/hour at ground level in heavily contaminated areas. Potassium iodide (KI) distribution — theoretically pre-positioned — is either unavailable or administered too late.

HOUR 72:00 — THE NEW BASELINE

Emergency managers have their first reliable picture. The immediate death toll from blast and thermal effects is fixed. The radiation death toll will accumulate over weeks, months, years. The survivors begin to organize. The unprepared begin to understand what preparation would have meant.`;

const MOCK_ZOMBIE_AFTERMATH = `HOUR 0 — PATIENT ZERO

The index case presents at a rural emergency room: 34-year-old male, extreme agitation, bite wound of unknown origin, elevated temperature of 40.8°C. Unusual neurological symptoms — repetitive motion, apparent insensitivity to pain. The patient is sedated and isolated. Blood work is sent to the state lab. Nobody elevates it further. This is the last normal moment.

HOUR 6 — FIRST TRANSMISSION

The patient escapes isolation during a shift change. Three staff members are bitten before security responds. The hospital activates its violence protocol, not its outbreak protocol. The bitten staff members are treated for wounds and sent home. One has a family of four.

HOUR 24 — LOCAL AWARENESS

The county health department receives reports from five different locations. Each describes the same presentation: extreme aggression, apparent insensitivity to pain. The county epidemiologist connects the dots and calls the CDC. The CDC duty officer is skeptical. She does not recommend immediate escalation. This is the decision that will be studied for decades.

HOUR 48 — MEDIA AWARENESS

A local news station runs a story about "unexplained violent incidents." The story reaches 2 million views. The sheriff holds a press conference urging calm. He uses the word "unusual" seven times.

HOUR 96 — CONTAINMENT FAILURE

The original affected county has 300–500 infected. Adjacent counties are reporting first cases. The interstate highway system is seeding the pathogen to population centers 500 km away. A flight has carried an exposed passenger to three hub cities.

HOUR 168 — ONE WEEK IN

The pathogen is confirmed in 23 states and 8 countries. The WHO has convened an emergency committee. The word "containment" has been quietly retired from official briefings.`;

const MOCK_PREDICTION = `GCSP GEOPOLITICAL RISK ASSESSMENT — 90-DAY FORECAST
================================================

1. CURRENT GLOBAL NUCLEAR RISK: ELEVATED (72/100)
   The nuclear risk environment remains at its highest sustained level since the Cold War's final decade. Russia's ongoing war in Ukraine continues to generate nuclear signaling. Iran's enrichment program has crossed multiple IAEA red lines. North Korea has demonstrated credible ICBM capability.

2. KEY FLASHPOINTS (probability of escalation in 90 days):
   • Iran Nuclear Program: 22% — 84% enrichment confirmed; Israeli strike calculations active in Tel Aviv
   • Russia-Ukraine: 18% — tactical nuclear signaling continues; battlefield setbacks elevate risk
   • Taiwan Strait: 14% — PLA operational tempo at record levels; 2026 electoral calendar creates decision pressure
   • Korean Peninsula: 11% — seventh nuclear test imminent per satellite imagery
   • South Asia: 8% — India-Pakistan LoC remains tense following 2025 border incidents

3. MOST LIKELY ESCALATION PATHWAY:
   The most plausible path begins not with deliberate launch but with miscalculation during a conventional crisis. Scenario: Israel conducts a strike against Iranian nuclear infrastructure. Iran responds with ballistic missiles. The US activates extended deterrence. Iran, facing existential threat, convenes leadership that believes nuclear use is the only survivable option. This mirrors the 1962 Cuban Missile Crisis logic — a local actor's actions drawing superpowers toward a threshold neither intended to approach.

4. HISTORICAL PRECEDENT MATCH:
   The current environment most closely resembles 1983 — the year of Able Archer 83, when a realistic NATO exercise convinced Soviet leadership that a first strike was imminent. Multiple simultaneous crises are creating intelligence overload and worst-case interpretation bias in all major nuclear powers.
   Similarity score: 74%

5. SCENARIOS TO WATCH:
   🔴 Iranian IAEA expulsion: Would likely trigger an Israeli strike within weeks.
   🟡 Russian tactical nuclear doctrine revision: December 2024 update lowered threshold for nuclear use.
   🟢 US-China military hotline: Bilateral communication agreement invoked three times to de-escalate incidents.

6. 90-DAY OUTLOOK:
   The trajectory most likely continues elevated tension without crossing into direct nuclear crisis. Functioning US-China communication channels, NATO cohesion, and Iran's preference for nuclear ambiguity create a floor below full crisis. Probability of nuclear use in 90 days: approximately 3-4%.

Confidence: MODERATE
For educational purposes only.`;

function getMock(type: string, narrativeType: string): string {
  if (type === 'nuclear') return narrativeType === 'journal'
    ? 'DAY 1\n\nI was in the basement when it happened...\n\n[Configure a Claude or OpenAI API key in Settings for the full AI-generated survival journal.]'
    : narrativeType === 'geopolitical'
    ? 'GEOPOLITICAL AFTERMATH ANALYSIS\n\n[Configure a Claude or OpenAI API key in Settings for live AI geopolitical analysis.]\n\nKey factors: attribution process (4–6 hours via isotopic analysis), Article 5 consultation, UN Security Council paralysis if major power involved, global economic shock (GDP -8 to -15% in month 1).'
    : MOCK_NUCLEAR_AFTERMATH;
  if (type === 'zombie') return MOCK_ZOMBIE_AFTERMATH;
  return '[Configure a Claude or OpenAI API key in Settings for AI-generated content.]';
}

// ─── Public streaming API ─────────────────────────────────────────────────────

export async function streamNarrative(
  params: { type: string; narrativeType: string; locationName?: string; config?: Record<string, unknown> },
  onChunk: (text: string) => void,
  onDone: () => void,
  signal?: AbortSignal
): Promise<void> {
  const { claudeApiKey, openaiApiKey } = useSettingsStore.getState();
  const prompt = buildNarrativePrompt(params.type, params.narrativeType, params.locationName, params.config);

  try {
    if (claudeApiKey) {
      await streamClaude(prompt, 'claude-haiku-4-5-20251001', 1024, onChunk, signal);
    } else if (openaiApiKey) {
      await streamOpenAI(prompt, 'gpt-4o-mini', 1024, onChunk, signal);
    } else {
      await streamMock(getMock(params.type, params.narrativeType), onChunk, signal);
    }
  } catch (err) {
    if (err instanceof Error && err.name !== 'AbortError') {
      await streamMock(getMock(params.type, params.narrativeType), onChunk, signal);
    }
  } finally {
    onDone();
  }
}

export async function streamPrediction(
  params: { timeframe: string; focus: string },
  onChunk: (text: string) => void,
  onDone: () => void,
  signal?: AbortSignal
): Promise<void> {
  const { claudeApiKey, openaiApiKey } = useSettingsStore.getState();
  const prompt = buildPredictionPrompt(params.timeframe, params.focus);

  try {
    if (claudeApiKey) {
      await streamClaude(prompt, 'claude-haiku-4-5-20251001', 1500, onChunk, signal);
    } else if (openaiApiKey) {
      await streamOpenAI(prompt, 'gpt-4o-mini', 1500, onChunk, signal);
    } else {
      await streamMock(MOCK_PREDICTION, onChunk, signal);
    }
  } catch (err) {
    if (err instanceof Error && err.name !== 'AbortError') {
      await streamMock(MOCK_PREDICTION, onChunk, signal);
    }
  } finally {
    onDone();
  }
}
