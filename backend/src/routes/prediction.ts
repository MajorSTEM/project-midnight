import { Router, Request, Response } from 'express';

const router = Router();

// ─── Mock Prediction (current as of early 2026) ──────────────────────────────

const MOCK_PREDICTION_NUCLEAR = `GCSP GEOPOLITICAL RISK ASSESSMENT — 90-DAY FORECAST
================================================

1. CURRENT GLOBAL NUCLEAR RISK: ELEVATED (72/100)
   The global nuclear risk environment remains at its highest sustained level since the Cold War's final decade. Russia's ongoing war in Ukraine — now entering its fourth year — continues to generate periodic nuclear signaling from Moscow. US-China strategic competition has accelerated force modernization programs on both sides. Iran's nuclear program has crossed multiple IAEA red lines. North Korea has demonstrated credible ICBM capability. The convergence of these concurrent pressures places baseline risk at ELEVATED.

2. KEY FLASHPOINTS (probability of escalation in 90 days):
   • Russia-Ukraine: 18% — Russian tactical nuclear signaling continues; battlefield setbacks in Kursk and Zaporizhzhia elevate escalation risk. Putin has invoked nuclear doctrine six times in 18 months. NATO's expanded support has crossed several previously stated Russian red lines without triggering response, which may indicate either deterrence success or calibrated tolerance.
   • Taiwan Strait: 14% — PLA Navy and Air Force operational tempo in the Strait remains at record levels. Xi Jinping's third term consolidated personal authority over military command. US-Taiwan defense sales have accelerated. The 2026 Taiwan local elections create a domestic political variable. Risk remains elevated but below crisis threshold.
   • Iran Nuclear Program: 22% — Iran has enriched uranium to 84% purity at Fordow — one technical step from weapons-grade. IAEA inspections are partially suspended. The JCPOA is effectively dead. Israel's October 2024 strike on Iranian air defense systems demonstrated willingness to act preemptively. A second Israeli strike, or Iranian expulsion of remaining IAEA monitors, would trigger rapid escalation.
   • Korean Peninsula: 11% — North Korea's seventh nuclear test, deferred repeatedly, remains imminent according to satellite imagery of Punggye-ri. Kim Jong-un has framed nuclear weapons as permanent, not negotiable. The US-South Korea joint exercises have resumed at full scale. Probability of a tactical incident that escalates is moderate.
   • South Asia: 8% — India-Pakistan Line of Control remains tense following 2025 border incidents. Both states have operational nuclear triads. The risk is currently lower than other flashpoints but the India-China border dispute in Aksai Chin adds a triangular dimension.

3. MOST LIKELY ESCALATION PATHWAY:
   The most plausible path to nuclear incident in the 90-day window begins not with deliberate launch but with miscalculation during a conventional crisis. Scenario: Israel conducts a third strike against Iranian nuclear infrastructure. Iran responds with ballistic missile salvos against Israeli territory and proxies attacking US bases in the region. The US activates extended deterrence commitments. Iran, facing existential threat to the regime, convenes leadership that believes nuclear use is the only survivable option. This sequence mirrors the 1962 Cuban Missile Crisis logic — a local actor's actions drawing superpowers toward a threshold neither intended to approach. The critical difference from 1962 is the absence of a functioning US-Iran back channel.

4. HISTORICAL PRECEDENT MATCH:
   The current global nuclear environment most closely resembles 1983 — the year of Able Archer 83, when NATO's realistic nuclear war exercise convinced Soviet leadership that a first strike was imminent, generating an authentic near-launch event that remained classified until the 1990s. Today's analog: multiple simultaneous crises (Ukraine, Taiwan, Iran) are creating intelligence overload and worst-case interpretation bias in all major nuclear powers' analytical communities. The US IC's declassified threat assessments reflect genuine uncertainty about adversary intentions — the same epistemic condition that made 1983 dangerous.
   Similarity score: 74%

5. SCENARIOS TO WATCH:
   🔴 Iranian IAEA expulsion: If Tehran formally expels remaining IAEA monitors, the intelligence baseline for Iranian weapons development collapses. This would likely trigger an Israeli strike within weeks, not months. US and Israeli planners cannot tolerate a complete monitoring blackout.
   🟡 Russian tactical nuclear doctrine revision: Moscow's updated military doctrine (December 2024) lowered the threshold for nuclear use in response to conventional attacks on Russian territory — including Crimea, which Russia considers sovereign. A major Ukrainian strike on Crimean infrastructure could trigger a genuine escalation decision.
   🟢 US-China military hotline activation: The bilateral military communication agreement signed in November 2025 has been invoked three times to de-escalate South China Sea incidents. Functioning crisis communication infrastructure is the most significant stabilizing development of the past 12 months.

6. 90-DAY OUTLOOK:
   The 90-day trajectory most likely continues the current pattern of sustained elevated tension without crossing into direct nuclear crisis. The combination of functional US-China communication channels, NATO cohesion around extended deterrence, and Iran's apparent preference for nuclear ambiguity over weaponization creates a floor below full crisis. The most significant downside risk is an Israeli unilateral action against Iran that triggers a cascade none of the major powers chose. Probability of escalation to nuclear use in 90 days: approximately 3-4% — historically elevated, but not catastrophic.

Confidence: MODERATE
Analysis based on open-source information as of early 2026. For educational purposes only.`;

const MOCK_PREDICTION_CONFLICT = `GCSP GEOPOLITICAL RISK ASSESSMENT — 90-DAY CONFLICT FORECAST
================================================

1. CURRENT GLOBAL CONFLICT RISK: HIGH (81/100)
   The current period represents the highest number of active armed conflicts since World War II, with the UN tracking 56 active conflicts generating mass casualties. The Russia-Ukraine war remains the highest-intensity conventional conflict between major powers since Korea. Four additional theater-level conflicts (Sudan, Myanmar, DRC, Gaza-Lebanon) are generating humanitarian catastrophes. The convergence of great power competition, contested regional orders, and non-state actor proliferation creates a structurally elevated baseline.

2. KEY FLASHPOINTS (probability of major escalation in 90 days):
   • Russia-Ukraine: 31% — Spring 2026 offensive season approaches; both sides are reconstituting. Russian industrial capacity for artillery production has surprised Western analysts. Ukrainian drone strike range has extended to Moscow. The question is not whether fighting continues but whether the scale escalates.
   • Sudan: 27% — RSF and SAF have both received foreign material support (UAE and Egypt respectively). The humanitarian catastrophe — 12 million displaced — is the world's worst current crisis. Regional spillover into Chad and South Sudan is already occurring.
   • Taiwan Strait: 19% — PLA exercises simulating blockade have become routine. The 2026 election calendar in both the US and Taiwan creates a compressed decision window for any Chinese action if Xi has timeline pressure.
   • Gaza-West Bank-Lebanon: 24% — Israeli military operations have expanded scope. Hezbollah's post-2024 reconstitution is proceeding. Iran's proxy network, degraded but not destroyed, maintains residual capability. A trigger event — assassination, hostage incident, strike on Iranian soil — could reignite a theater-level conflict within 72 hours.
   • South China Sea: 12% — Philippine-China incidents in the Second Thomas Shoal have escalated in intensity. The US Mutual Defense Treaty with the Philippines has been explicitly confirmed to cover South China Sea engagements by two successive US administrations.

3. MOST LIKELY ESCALATION PATHWAY:
   The highest-probability escalation path in the 90-day window runs through a collapse of the Gaza ceasefire architecture, triggering Hezbollah's active intervention from Lebanon, which in turn draws Iranian direct involvement, and generates US force deployment to the region. At that point, the conflict triangle of Israel-Iran-US creates conditions where a single miscalculated strike could kill American service members, triggering a mandatory US conventional response that Iran cannot absorb without either capitulating or escalating. This scenario has played out partially in each of the last three years; the difference in 2026 is that Iran's deterrence calculus has shifted following the effectiveness of October 2024 Israeli strikes.

4. HISTORICAL PRECEDENT MATCH:
   The current multipolar conflict environment most closely resembles the pre-1914 period — not in the specific geopolitical arrangements, but in the structural dynamic of multiple interlocking alliance commitments, contested regional orders, and great power competition creating conditions where a local incident can trigger systemic response. The 1914 analog is imperfect (no formal alliance architecture as rigid as the Triple Entente/Triple Alliance) but the pattern of miscalculation chains is recognizable. The difference is nuclear weapons: the 1914 powers could fight a world war; 2026 powers cannot.
   Similarity score: 58%

5. SCENARIOS TO WATCH:
   🔴 Ukrainian strategic strike on Russian early warning radar: Ukrainian long-range drones have demonstrated the range to reach Russian strategic assets. A strike on a Voronezh radar system — accidentally or intentionally — would be interpreted in Moscow's strategic posture as a potential prelude to nuclear first strike.
   🟡 Philippine frigate sinking: A Chinese Coast Guard or PLAN vessel sinking a Philippine naval vessel in the South China Sea would force the US to make an immediate, public decision about MDT activation. Either response (act or do not act) creates serious escalation or credibility risks.
   🟢 Russia-Ukraine negotiations via Turkish mediation: Erdogan's back-channel role has maintained a residual negotiation pathway. Any movement toward a ceasefire framework — even preliminary — would be the most significant de-escalation development in the 90-day window.

6. 90-DAY OUTLOOK:
   The conflict landscape in the next 90 days will be defined by the intersection of the spring military calendar (Ukraine offensive season, Taiwan Strait weather window, Middle East escalation dynamic) and the domestic political calendars of the United States, Israel, and China. The most likely outcome is continued high-intensity conflict in existing theaters without new theater-level escalation. The structural risk of multipolar simultaneous crisis remains the central concern for deterrence stability.

Confidence: MODERATE
Analysis based on open-source information as of early 2026. For educational purposes only.`;

const MOCK_PREDICTION_COMBINED = `GCSP GEOPOLITICAL RISK ASSESSMENT — 90-DAY COMBINED ASSESSMENT
================================================

1. CURRENT GLOBAL NUCLEAR RISK: ELEVATED (72/100)
   The nuclear risk environment is at its highest sustained level since 1983. Russia-Ukraine war continues generating nuclear signaling. Iran's enrichment program has reached 84% purity — one technical step from weapons-grade. North Korea maintains an active ICBM testing program with demonstrated Pacific range. US-China strategic competition has accelerated force modernization. Four nuclear-armed states (Russia, Pakistan, China, North Korea) have updated military doctrines lowering explicit thresholds for nuclear use in the past 24 months.

2. KEY FLASHPOINTS (probability of escalation in 90 days):
   • Iran Nuclear Crisis: 22% — IAEA monitoring partially suspended; 84% enrichment confirmed; Israeli strike window calculations are active in Tel Aviv. This is the highest near-term probability flashpoint with a direct nuclear dimension.
   • Russia-Ukraine Conventional/Nuclear Threshold: 18% — Spring offensive season, battlefield reverses, and expanded NATO support combine to sustain elevated risk. Russia's revised nuclear doctrine (December 2024) has formally lowered use threshold.
   • Taiwan Strait Crisis: 14% — PLA operational tempo at record levels; US-Taiwan defense relationship at new depth; 2026 electoral calendar creates decision pressure.
   • Korean Peninsula: 11% — Seventh nuclear test imminent per satellite data; ICBM capability demonstrated; US-ROK exercise resumption.
   • Gaza-Lebanon-Iran Regional War: 24% — Proxy network reconstitution underway; Israeli military option against Iran remains active; Hezbollah partial reconstitution creates new second-strike capability.

3. MOST LIKELY ESCALATION PATHWAY:
   The highest-probability pathway to a significant escalation event combines conventional and nuclear dimensions: Israel strikes Iranian nuclear infrastructure (triggered by IAEA monitoring collapse), Iran retaliates conventionally against regional targets including US assets, the US responds with conventional strikes, Iran's regime survival calculus shifts, and the question of Iranian nuclear use — or Russian opportunistic escalation in Ukraine during US distraction — becomes active. This is not the most likely 90-day outcome, but it represents the modal path if the current trajectory continues without structural intervention.

4. HISTORICAL PRECEDENT MATCH:
   The combined conventional-nuclear risk environment most closely parallels 1983 in its systemic nature and 1962 in its Cuban Missile Crisis-style single-actor-trigger dynamic. The unique feature of the current period is the number of simultaneous, independent crisis arcs — any of which could serve as the trigger. In 1962, there was one crisis. In 1983, there was one crisis. In 2026, there are five concurrent potential triggers. The compounding effect on intelligence analysis quality and decision-maker bandwidth is without historical precedent.
   Similarity score: 68%

5. SCENARIOS TO WATCH:
   🔴 Simultaneous Iranian expulsion of IAEA + North Korean nuclear test: The combination of these two events in close temporal proximity would create intelligence and response bandwidth constraints that could enable opportunistic escalation in a third theater (Taiwan, Ukraine) while US attention is divided.
   🟡 Russian use of tactical nuclear weapon in Ukraine: Assessed at 3-5% probability over 90 days but would be the most consequential single event in the assessment window. NATO's response doctrine to a limited nuclear use in a non-NATO state is untested and contested within the alliance.
   🟢 US-China-Russia trilateral crisis communication: The existing US-China bilateral hotline could be expanded to a trilateral format, which US and Chinese officials have discussed informally. Three-way crisis communication would significantly reduce the risk of third-party miscalculation.

6. 90-DAY OUTLOOK:
   The 90-day trajectory most likely maintains current elevated tension without crossing into direct great-power military conflict or nuclear use. The structural stabilizers — functioning US-China communication channels, NATO cohesion, and nuclear-armed states' shared interest in avoiding general war — remain operative. The central risk is a cascading series of secondary escalations, each individually manageable, that cumulatively exceed deterrence architecture's capacity to contain. Probability of nuclear use in 90-day window: approximately 3-4%. Probability of a new theater-level conventional conflict: approximately 22%.

Confidence: MODERATE
Analysis based on open-source information as of early 2026. For educational purposes only.`;

// ─── Types ───────────────────────────────────────────────────────────────────

interface PredictionRequest {
  timeframe: '30d' | '90d' | '180d';
  focus: 'nuclear' | 'conflict' | 'combined';
}

function getMockPrediction(focus: string): string {
  if (focus === 'nuclear') return MOCK_PREDICTION_NUCLEAR;
  if (focus === 'conflict') return MOCK_PREDICTION_CONFLICT;
  return MOCK_PREDICTION_COMBINED;
}

function buildPredictionPrompt(timeframe: string, focus: string): string {
  const timeframeLabel =
    timeframe === '30d' ? '30-DAY' : timeframe === '90d' ? '90-DAY' : '180-DAY';

  const focusNote =
    focus === 'nuclear'
      ? 'Focus primarily on nuclear escalation risks: nuclear signaling, doctrine changes, enrichment programs, and delivery system developments.'
      : focus === 'conflict'
      ? 'Focus primarily on conventional conflict escalation: active wars, flashpoints, alliance commitments, and force posture changes.'
      : 'Provide a combined assessment covering both nuclear risks and conventional conflict, with integrated analysis of how they interact.';

  return `You are a senior geopolitical analyst at a fictional educational research institute (GCSP — Global Crisis Simulation Platform). Generate a structured geopolitical risk assessment for educational purposes.

${focusNote}

Use the following exact format:

GCSP GEOPOLITICAL RISK ASSESSMENT — ${timeframeLabel} FORECAST
================================================

1. CURRENT GLOBAL NUCLEAR RISK: [LOW/ELEVATED/HIGH/CRITICAL] ([X]/100)
   Brief explanation of current state based on general knowledge.

2. KEY FLASHPOINTS (probability of escalation in ${timeframeLabel.toLowerCase()} window):
   • [Region/Country]: [XX]% — [brief reasoning]
   • [Region/Country]: [XX]% — [brief reasoning]
   • [Region/Country]: [XX]% — [brief reasoning]
   • [Region/Country]: [XX]% — [brief reasoning]
   • [Region/Country]: [XX]% — [brief reasoning]

3. MOST LIKELY ESCALATION PATHWAY:
   [Paragraph describing most plausible path from current state to significant escalation or nuclear incident]

4. HISTORICAL PRECEDENT MATCH:
   [Compare current situation to closest historical analog — 1962, 1983, 1914, etc.]
   Similarity score: [XX]%

5. SCENARIOS TO WATCH:
   🔴 [High urgency trigger]: [description]
   🟡 [Medium urgency]: [description]
   🟢 [Stabilizing factor]: [description]

6. ${timeframeLabel} OUTLOOK:
   [2-3 sentences on most likely trajectory]

Confidence: [LOW/MODERATE/HIGH]
Analysis based on open-source information. For educational purposes only.

Base your assessment on real geopolitical knowledge as of your training cutoff. Be analytically rigorous and specific — use real country names, treaties, and programs. This is for educational simulation purposes.`;
}

/**
 * POST /api/prediction
 * Streams an AI-generated geopolitical risk forecast via SSE
 */
router.post('/', async (req: Request, res: Response) => {
  const { timeframe = '90d', focus = 'combined' } = req.body as PredictionRequest;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // ── No API key: stream mock content with artificial pacing ───────────────
  if (!apiKey) {
    const mockText = getMockPrediction(focus);
    const words = mockText.split(' ');
    const chunkSize = 5;

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk =
        words.slice(i, i + chunkSize).join(' ') +
        (i + chunkSize < words.length ? ' ' : '');
      res.write(`data: ${chunk}\n\n`);
      await new Promise((r) => setTimeout(r, 20));
    }

    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  // ── With API key: stream from Claude ────────────────────────────────────
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });

    const prompt = buildPredictionPrompt(timeframe, focus);

    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        res.write(`data: ${chunk.delta.text}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('[prediction] API error:', err);
    // Fallback to mock on API error
    const mockText = getMockPrediction(focus);
    res.write(`data: ${mockText}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

export default router;
