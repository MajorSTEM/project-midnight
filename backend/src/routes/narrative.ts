import { Router, Request, Response } from 'express';

const router = Router();

// ─── Mock narratives (used when ANTHROPIC_API_KEY is not set) ────────────────

const MOCK_NUCLEAR_AFTERMATH = `HOUR 0:00 — DETONATION

The flash arrives before the sound, before the shockwave, before any conscious thought. At ground zero, temperatures reach 100 million degrees Celsius — hotter than the surface of the sun. Everything within the fireball radius ceases to exist as solid matter. Steel evaporates. Concrete sublimates. The electromagnetic pulse from a high-altitude airburst would have already silenced every unshielded electronic device within the line of sight horizon.

HOUR 0:00:02 — THE BLAST WAVE

Two seconds after detonation, the supersonic blast wave radiates outward at Mach 1.5. Within the heavy blast zone (20 psi overpressure), reinforced concrete structures collapse. At 5 psi — the moderate blast radius — residential structures are destroyed completely. At 1 psi, windows shatter for miles. The thermal pulse has already ignited every combustible surface facing the fireball.

HOUR 0:15 — FIRESTORM INITIATION

Fifteen minutes post-detonation, individual fires merge into a firestorm. The superheated air above creates a low-pressure zone. Winds rush inward from all directions toward the fire center at 100–200 km/h. Nothing that was not already destroyed by blast will survive the thermal effects. Oxygen is consumed faster than it can be replaced. Carbon monoxide levels in shelter spaces become lethal.

HOUR 1:00 — FALLOUT CLOCK STARTS (SURFACE BURST)

For a ground burst, the mushroom cloud contains millions of tons of pulverized earth, fused with radioactive fission products. This material begins falling downwind within 30–60 minutes for the heaviest particles. Emergency managers within 300 km downwind now face a cascading decision: the arrival time of lethal fallout versus evacuation time available.

HOUR 2:00 — COMMUNICATIONS BLACKOUT

Government emergency networks are overloaded or destroyed. FEMA's Integrated Public Alert & Warning System (IPAWS) activates — if EMP has not disabled broadcast infrastructure. Cell networks fail under demand saturation. Emergency managers revert to HF radio. The President's Emergency Action Documents (EADs) are being executed, but the scale of the event means federal response will not arrive for 24–72 hours in most affected areas.

HOUR 6:00 — MEDICAL SYSTEM COLLAPSE

Hospitals within the light blast radius are overwhelmed with blast and burn casualties. Triage protocols shift to expectant for radiation exposure above 600 rem without available treatment. Blood supply nationally depletes within 48 hours. Radiation sickness in those exposed to doses of 150–600 rem will not manifest visibly for 1–3 days — the "walking wounded" period creates false hope and delays evacuation decisions.

HOUR 12:00 — GOVERNMENT RESPONSE FRAGMENTATION

The National Response Framework activates. FEMA's National Response Coordination Center opens. The President declares a major disaster and invokes the Stafford Act. But coordination between federal agencies and destroyed local emergency management infrastructure is nearly impossible. The governor of the affected state may not be reachable. Mutual aid agreements activate automatically, but roads into the affected region are blocked by debris, gridlock, and radiation.

HOUR 24:00 — DAY ONE ENDS

Survivors who sheltered effectively begin assessing their situations. Those with radiation monitoring equipment are receiving crucial information. Those without are making decisions on incomplete data. The fallout plume downwind carries 10–100 rem/hour at ground level in heavily contaminated areas. Potassium iodide (KI) distribution — theoretically pre-positioned — is either unavailable or being administered too late for thyroid protection.

HOUR 48:00 — NATIONAL CRISIS

National Guard units deploy under state emergency orders, but face radiation exposure limits that constrain their operational reach. The President may invoke the Defense Production Act to prioritize radiation monitoring equipment production. International offers of assistance begin arriving — Japan, Germany, and France have stockpiles of radiation treatment drugs. The global nuclear exchange scenario triggers alliance obligations: Article 5, Mutual Defense Treaty consultations begin.

HOUR 72:00 — THE NEW BASELINE

Seventy-two hours in, emergency managers have their first reliable picture of the affected area. The immediate death toll from blast and thermal effects is fixed. The radiation death toll will continue accumulating over weeks, months, years. Acute Radiation Syndrome casualties in the 150–400 rem range are treatable with aggressive medical intervention — but medical capacity is a fraction of what is needed.

The survivors begin to organize. The unprepared begin to understand what preparation would have meant.`;

const MOCK_NUCLEAR_JOURNAL = `DAY 1 — MONDAY

I was in the basement when it happened. We'd been watching the news all morning — the alerts were escalating in a way that felt different from the usual saber-rattling. My wife said we should go to the store. I said wait until the afternoon.

The flash came through the small basement window. I know now I was lucky — I looked away instinctively at the last second. The window shattered inward on the blast wave, probably eight seconds later. I counted the seconds, like for lightning. Eight seconds means the detonation was roughly 2.7 kilometers away. Farther than I thought.

My wife had burns on the back of her hands and neck — she'd been standing at the kitchen window upstairs. Second degree. Painful but survivable. My daughter was at school. I cannot write about that yet.

The house is partially standing. The roof on the east side collapsed. We are in the southwest corner of the basement — the safest place we could be. I have a hand-crank radio. I have been listening to what broadcasts remain.

The emergency broadcast is saying shelter in place for 24 hours minimum. Do not go outside. Do not use tap water. Seal windows and doors with tape and plastic. I am doing this.

Inventory: 6 gallons of water (stored pre-event, thank God). 12 days of shelf-stable food if we ration. First aid kit. Two wind-up flashlights. Ibuprofen. My wife's blood pressure medication — 14 days remaining. No KI tablets. I wish I had KI tablets.

DAY 2 — TUESDAY

We have not gone outside. The radio says fallout is still falling. The hand crank station is saying dose rates of 40–80 rem/hour outside, dropping. It said wait for below 2 rem/hour before brief exposure. That means tomorrow at the earliest, maybe the day after.

My wife's burns are infected. I cleaned them with boiled water and the antibiotic ointment from the first aid kit. I don't know if that's enough.

I have been rationing the radio use to save the hand crank charge. News in fragments: multiple cities hit. Congress is in relocation. The Vice President is confirmed alive. The military is responding. These phrases mean something and nothing at the same time.

I think about my daughter every waking moment and some sleeping ones.

DAY 3 — WEDNESDAY

Dose rates dropping. Radio says 5–10 rem/hour at the edge of the affected zone. Still not safe for prolonged exposure but brief forays possible with improvised protection. I wrapped myself in our thickest coats and went outside for 90 seconds to assess the street. I kept my mouth and nose covered with a wet cloth.

The neighborhood is unrecognizable. Three houses are completely collapsed. One is burning, somehow still, two days later. There are no people visible. There are things I saw that I will not write here.

I came back inside and stripped off my outer clothes in the door frame, left them outside. Washed thoroughly with our precious water. I will account for that water loss in the rations.

I found a neighbor's emergency preparedness kit in their car, which was blown against our fence but mostly intact. Included: more water, an N95 mask, a trauma kit, and a NOAA weather radio with batteries. The weather radio is invaluable.

DAY 4 — THURSDAY

Dose rates continuing to fall — the 7:10 rule is real. For every 7-fold increase in time, dose rate drops by a factor of 10. We are at roughly 72 hours. Rates outside should be approaching manageable for brief, purposeful exposure.

We made the decision today: we need to leave within 48 hours. The water will run out in 8 days but my wife needs medical care before that. The burns are showing concerning signs. We need antibiotics — real antibiotics, not ointment.

I have been planning the route. The roads directly east are in the destruction zone. We need to go perpendicular to the prevailing wind direction — northwest — to avoid moving through the fallout plume. I have a paper map. I found it in a kitchen drawer and I am so grateful for physical paper right now.

DAY 5 — FRIDAY

We packed what we can carry. Backpacks. Water distributed evenly. Food for five days. The trauma kit. The radios. My wife's remaining medication. I took the N95 masks. I took all the remaining ibuprofen.

I found a neighbor — alive — two houses down. She was sheltering with her elderly father. Her father has what I recognize now as mild radiation sickness — nausea, fatigue, some hair loss beginning. We agreed to travel together. Four is better than two.

The route northwest leads 12 kilometers to an elevated highway that should be outside the worst contamination zone. The radio mentioned a relief station at the county fairgrounds, 20 kilometers further. That is our destination.

DAY 6 — SATURDAY

We walked. Seven hours. The streets were passable but terrible — debris, abandoned vehicles, one area where we had to detour around a collapsed overpass. My wife's burns are stable but she is in pain. I gave her the last of the ibuprofen.

We encountered other people on the road. Some were hostile. Most were not — fear makes people more human, not less, at least at first. We shared what we could. We received directions from a man with a battery radio who knew where the National Guard checkpoint was.

We reached the checkpoint at dusk. A National Guard unit in full CBRN gear. They triaged us. My wife was classified as requiring medical evacuation. The elderly neighbor was taken to the medical tent.

I found out there is a survivor registration system. I registered my daughter's name and school.

DAY 7 — SUNDAY

We are at the regional relief center. I am writing this on paper provided by a Red Cross volunteer. There are thousands of people here. It is chaos and it is organized at the same time.

My wife is receiving IV antibiotics. The burns will heal.

I am waiting for word about my daughter.

What I know now that I wish I had known before: the first 24 hours of sheltering made the difference between survivable radiation exposure and a lethal dose. The shelter itself — a basement with mass above it — was the most important thing. Water storage was second. The paper map was third.

The radio was everything.`;

const MOCK_NUCLEAR_GEOPOLITICAL = `GEOPOLITICAL AFTERMATH ANALYSIS — T+90 DAYS

IMMEDIATE ATTRIBUTION AND RESPONSE (T+0 TO T+72 HOURS)

Within hours of detonation, US Strategic Command activates nuclear posture protocols. The intelligence community's attribution process — designed to operate under extreme time pressure — assesses origin within 4–6 hours based on isotopic analysis of fallout samples, satellite data, and pre-event intelligence. Attribution to a state actor triggers Article 5 consultation with NATO allies.

The President faces a decision codified in the Single Integrated Operational Plan (now OPLAN 8010): strategic retaliation, conventional escalation, or diplomatic de-escalation. History and doctrine suggest the US would not immediately launch nuclear retaliation against a nuclear-armed state, given the risk of escalation to general nuclear war.

ALLIANCE ACTIVATION

NATO invokes Article 5. The formal decision requires consensus among 32 members — a process that in practice takes 24–72 hours of urgent consultation. Germany, France, and the UK are immediately consulted. The nuclear sharing arrangements mean B61 bombs at Ramstein, Incirlik, and other European bases are placed on elevated alert status.

The UN Security Council emergency session convenes within 12 hours but is immediately paralyzed. If Russia or China is suspected of involvement, vetoes are automatic. The General Assembly activates under the Uniting for Peace resolution (Resolution 377).

ESCALATION VS. DE-ESCALATION

The critical 30-day window determines the trajectory. Economic sanctions — already at maximum on most potential state actors — have limited additional leverage. Military options risk escalation to general nuclear exchange. The de-escalation pathway requires a diplomatic off-ramp: a back-channel communication that allows the attacking state to stop without complete capitulation.

Historical precedent (1962 Cuban Missile Crisis) suggests such off-ramps are possible but require both sides to want them. The global economic shock — markets closed, supply chains frozen, energy prices tripling — creates pressure on all parties to avoid further escalation.

GLOBAL ECONOMIC SHOCK

Global GDP contracts an estimated 8–15% within the first month. Insurance markets seize. The dollar, as reserve currency, experiences unprecedented volatility. Oil supply from the Persian Gulf — structurally dependent on US security guarantees — becomes uncertain. Food prices surge globally as commodity markets freeze.

T+90 OUTLOOK

At 90 days, three scenarios are plausible: managed de-escalation with diplomatic resolution, frozen conflict with ongoing heightened alert, or continued escalation toward multiple exchanges. The Doomsday Clock, already at 90 seconds, has become irrelevant — we are living in what it was warning about.

The world that emerges will not resemble the one that preceded the detonation. International institutions will be reshaped. The nuclear taboo — maintained for 77 years after Hiroshima — has been broken. The question is whether it can be rebuilt.`;

const MOCK_ZOMBIE_AFTERMATH = `HOUR 0 — PATIENT ZERO

The index case presents at a rural emergency room: 34-year-old male, construction worker, extreme agitation, bite wound of unknown origin on his forearm, elevated temperature of 40.8°C. The attending physician notes unusual neurological symptoms — repetitive motion, apparent insensitivity to pain, aggression toward nursing staff. The patient is sedated and isolated as a precaution.

Blood work is sent to the state lab. The attending files a standard unusual neurological presentation report. Nobody elevates it further. This is the last normal moment.

HOUR 6 — FIRST TRANSMISSION

The patient escapes isolation during a shift change. Three staff members are bitten before security responds. The hospital activates its violence protocol, not its outbreak protocol. The error is understandable — nothing in the training manuals covers this. The three bitten staff members are treated for wounds and sent home. One has a family of four.

HOUR 24 — LOCAL AWARENESS

The county health department receives reports from five different locations: a nursing home, two residences, a gas station, and the hospital. Each report describes the same presentation: extreme aggression, apparent insensitivity to pain, biting behavior. The county epidemiologist connects the dots and calls the state health department. The state health department calls the CDC.

The CDC duty officer is skeptical. The presentation is unlike any known pathogen. She requests samples and asks for more information. She does not recommend immediate escalation. This is the decision that will be studied for decades.

HOUR 48 — MEDIA AWARENESS

A local news station runs a story about "unexplained violent incidents" in the county. The story is picked up by social media and reaches 2 million views within hours. The framing is sensationalist but not inaccurate. The county sheriff holds a press conference urging calm. He uses the word "unusual" seven times.

Meanwhile, the affected population has grown to an estimated 40–80 individuals across a 15-kilometer radius. The exponential doubling time, not yet recognized, is approximately 6–8 hours.

HOUR 72 — GOVERNMENT DENIAL

The CDC holds a press briefing. The spokesperson acknowledges "an unusual cluster of violent behavioral incidents" under investigation. She explicitly rules out any known pathogen. She urges the public not to speculate. Twitter and Reddit are doing nothing but speculate.

State National Guard is placed on standby — not deployed, standby. The governor is briefed. Her chief of staff recommends waiting for CDC guidance before taking action that might cause panic. This is the wrong call.

HOUR 96 — CONTAINMENT FAILURE

The original affected county now has 300–500 infected individuals. Adjacent counties are reporting their first cases. The interstate highway system — the backbone of American mobility — is seeding the pathogen to population centers 500 kilometers away. A flight from the regional airport has carried an exposed (but not yet symptomatic) passenger to three hub cities.

The CDC activates its Emergency Operations Center. The President is briefed for the first time. The words "zombie" or "undead" are not used in any official briefing — instead the clinical term "Category X Behavioral Pathogen" is adopted. This euphemism will persist for 11 days.

HOUR 120 — MILITARY DEPLOYMENT

National Guard units deploy in the original affected county. Their rules of engagement do not account for combatants who cannot be deterred by pain or verbal commands. Casualties among Guard personnel in the first 72 hours of deployment are high. The Rules of Engagement are revised twice in rapid succession.

The CDC recommends a 50-kilometer evacuation radius. State authorities begin implementing this. The roads immediately become impassable. The evacuation creates the conditions for wider spread.

HOUR 168 — ONE WEEK IN

By the end of the first week, the pathogen has been confirmed in 23 states and 8 countries. The WHO has convened an emergency committee. The word "pandemic" is now official. The word "containment" has been quietly retired from official briefings.

The military is now operating under a modified doctrine: establish perimeters, prevent spread, protect critical infrastructure. Urban centers with high population density are the highest priority and the hardest problem. The mathematics of exponential growth, finally being taken seriously, are terrifying.`;

const MOCK_ZOMBIE_JOURNAL = `DAY 1

I don't know how to start this except to say that everything changed today and I need to write it down because I need to believe I'll be alive to read this later.

I was at work when the alerts started coming in on people's phones. Not the official emergency alert — just the news apps, Twitter, people texting. "Don't go outside." "Something's wrong downtown." "Stay where you are."

I'm a librarian. I was shelving books in the 600s section (applied sciences, useful now in retrospect) when Marcus from reference came and found me. He'd been listening to his police scanner app. He said: it's bad.

We locked the library. Twelve of us total — staff and patrons who hadn't left yet. I counted the exits. Four, all securable. I started moving bookshelves in front of the two side doors.

People thought I was overreacting. I hope they remember saying that.

DAY 2

The power is still on. This is a gift and I know it won't last. I've been charging every device we have.

There are six of us now who've accepted that this is a long-term shelter situation, not a wait-and-see situation. Six out of twelve. The other six keep wanting to "check" — check on family, check if it's over, check the roads. I understand why. I also know what I've seen outside the reinforced windows.

I inventoried the staff kitchen: coffee, 14 assorted granola bars, 3 bags of rice (staff member keeps rice here for microwave lunches, God bless her), a case of water bottles, two cans of soup, and a first aid kit that needs restocking. The vending machines — I'm not proud of this — are now also inventory. Marcus knows how to open them.

We have: water for approximately 5 days if we're careful. Food for maybe 8–10 days with strict rationing.

The library has something more valuable: books. The wilderness survival section. The medical references. The military manuals someone donated in 2019 that I was about to weed from the collection. I have never been more grateful for a collection decision in my life.

DAY 3

We lost one of the reluctant ones. He went out the back to "get to his car" before we could stop him. He didn't come back. We secured the door he used and pushed a bookshelf against it.

We are now eleven.

I found the library's emergency binder — required by the city, never really taken seriously. It has useful information about the building's structure. The roof is accessible from an internal staircase. There's a water shutoff valve. There's a gas shutoff.

I also found, in the building manager's office, a radio. A real radio, not a phone. AM/FM with an antenna.

The broadcasts are fragmented but consistent: military has set up perimeters. If you are sheltered and safe, stay sheltered and safe. Evacuation corridors will be announced. DO NOT use evacuation routes unless officially directed.

I believe them about the first part. I'm not sure I believe them about the corridors.

DAY 4

Water is now the primary concern. The municipal water is still running — I don't know how, but I'm not questioning it. I've been filling every container we have as a hedge.

I've also been reading. The survival manuals. The CDC's public health emergency protocols (we have a bound copy from 2018). The military field manual on urban operations (FM 3-06, useful for understanding what's likely happening outside).

What I've learned that matters: don't move during daylight if infected individuals are active and drawn to movement. Sound discipline matters. The infected, based on everything I've seen and read, respond primarily to auditory and visual stimuli. They are not coordinated. Individual instances are manageable. Groups are not.

I've been training the others in what I've read. They're listening now.

DAY 5

We had a group meeting. Consensus: we stay until we have a confirmed evacuation route or until we run out of water — whichever comes first. The water estimate has improved; we found a large utility sink with a holding tank.

Three of us have done careful exterior reconnaissance from the second floor. The street situation is stabilizing in a terrible way: the ratio of infected to uninfected moving on the street has inverted. This is not good for going outside. This is also not immediately a problem if we stay inside.

I thought about my family. I know where they were this morning. I have to believe they're sheltering like we are.

DAY 6

Radio says the military corridors are being established. They're calling them "Green Lanes." Our nearest Green Lane corridor is 2.2 kilometers northeast. I've been studying the route on a city map from the reference section.

We can do this. Three blocks north, then east along the service road behind the commercial district (lower traffic, physical barriers on one side), then two blocks to the staging area. With twelve (eleven) people who know what they're doing, in a group, moving quickly and quietly in the early morning hours when ambient noise is lowest.

I wrote the route on a card. Everyone has a copy.

DAY 7

We made it. We're at the staging area. I'm writing this on the hood of a military vehicle while we wait for processing.

What kept us alive: staying put when everyone wanted to move, water storage, the radio, and the books. The books most of all.`;

const MOCK_ZOMBIE_GEOPOLITICAL = `GLOBAL RESPONSE TO CATEGORY X OUTBREAK — GEOPOLITICAL ANALYSIS

PHASE 1: NATIONAL CONTAINMENT (DAYS 1–14)

Individual nations respond according to their existing public health infrastructure and political culture. Nations with robust emergency management systems — Germany, Japan, South Korea, Australia — implement hard border controls within 72 hours of the WHO's emergency declaration. Nations with weaker institutional capacity struggle to respond coherently.

The United States, origin of the confirmed index case, faces the dual challenge of managing the domestic outbreak while leading international coordination efforts. The President invokes the Public Health Service Act and the Stafford Act simultaneously. The Defense Department activates NORTHCOM's CBRN response framework.

China closes its borders completely within 48 hours of the WHO declaration — no exceptions, no negotiations. This decisive action, while criticized internationally, proves effective in limiting spread. Chinese state media presents the closure as evidence of governance superiority. The comparison to the US response is implicit and internationally noted.

PHASE 2: WHO COORDINATION FAILURE (DAYS 14–30)

The WHO's International Health Regulations (IHR) framework, designed for conventional infectious disease outbreaks, is inadequate for an outbreak characterized by rapid violence and infrastructure disruption. Emergency committee meetings require consensus among member states with conflicting interests. The IHR's lack of enforcement mechanisms is exposed completely.

Russia and China use the Security Council to block binding UN resolutions. Their stated rationale: any UN-mandated "containment" operations in affected member states would violate sovereignty. The actual rationale is more complex — both nations see strategic advantage in the US being destabilized. This calculation will prove shortsighted.

NATO activates Article 5 on Day 18 when infected individuals cross from a member state into German territory. It is the first Article 5 invocation in history. The legal question of whether a non-state, non-human threat triggers collective defense obligations is unresolved in the treaty text, but the political consensus overrides the legal uncertainty.

PHASE 3: INTERNATIONAL COOPERATION EMERGES (DAYS 30–60)

The outbreak reaches Russia on Day 23. China on Day 31. At this point, the strategic calculus changes for both nations. An existential threat does not respect borders. Back-channel communications between US, Russian, and Chinese military leadership begin through pre-existing crisis communication channels.

The outcome: an informal "Pandemic War Council" of the five permanent Security Council members plus Germany and Japan. Not a UN body, not treaty-based, but functional. Information sharing on infection rates, containment tactics, and potential countermeasures begins.

Israel, leveraging its significant biodefense research capabilities, contributes crucial data on pathogen behavior. South Korea's advanced testing infrastructure deploys globally under bilateral agreements.

COLLAPSE SCENARIOS

The realistic worst case is not global extinction — it is the collapse of the modern state system in regions that lack the institutional capacity to maintain basic services under outbreak conditions. Sub-Saharan Africa, parts of Southeast Asia, and politically fractured states face the prospect of government collapse and infrastructure failure cascading beyond anything the outbreak itself causes.

The 90-day outlook hinges on a single variable: whether the research programs in seven nations working on countermeasures produce a viable result. If yes, the world is damaged but recoverable. If no, the calculus extends to years, and the question becomes what institutions survive to govern the recovery.

History suggests human institutions adapt. The question is always the cost of the adaptation.`;

// ─── Route ───────────────────────────────────────────────────────────────────

interface NarrativeRequest {
  type: 'nuclear' | 'zombie';
  narrativeType: 'aftermath' | 'journal' | 'geopolitical';
  config?: Record<string, unknown>;
  locationName?: string;
}

function getMockNarrative(type: string, narrativeType: string): string {
  if (type === 'nuclear') {
    if (narrativeType === 'aftermath') return MOCK_NUCLEAR_AFTERMATH;
    if (narrativeType === 'journal') return MOCK_NUCLEAR_JOURNAL;
    if (narrativeType === 'geopolitical') return MOCK_NUCLEAR_GEOPOLITICAL;
  } else if (type === 'zombie') {
    if (narrativeType === 'aftermath') return MOCK_ZOMBIE_AFTERMATH;
    if (narrativeType === 'journal') return MOCK_ZOMBIE_JOURNAL;
    if (narrativeType === 'geopolitical') return MOCK_ZOMBIE_GEOPOLITICAL;
  }
  return 'Narrative unavailable.';
}

function buildPrompt(type: string, narrativeType: string, locationName?: string, config?: Record<string, unknown>): string {
  const loc = locationName || 'an unspecified location';

  if (type === 'nuclear') {
    const yieldKt = (config?.yieldKt as number) || 100;
    const burstType = (config?.burstType as string) || 'airburst';
    const yieldLabel = yieldKt >= 1000 ? `${(yieldKt / 1000).toFixed(1)} Mt` : `${yieldKt} kt`;

    if (narrativeType === 'aftermath') {
      return `You are writing a vivid, educational nuclear detonation aftermath report from the perspective of an emergency manager. A ${yieldLabel} ${burstType} nuclear weapon has detonated at ${loc}.

Write an hour-by-hour account of what happens at ground zero and in the blast zones over the first 72 hours. Target: ~600 words.

Include: the immediate flash and EMP effects, blast wave timing and damage zones, firestorm development, fallout arrival time and extent (if ground burst), government response breakdown, survivor priorities. Use specific times (Hour 0:00, Hour 0:02, Hour 1:00, etc.). Be vivid, precise, and educational. Write in plain language a citizen could understand. This is for educational purposes about nuclear preparedness.`;
    }

    if (narrativeType === 'journal') {
      return `Write a first-person 7-day survival journal from someone located in ${loc} who survived a ${yieldLabel} nuclear detonation. Target: ~600 words.

Format as daily journal entries (Day 1, Day 2, etc.). Include: Day 1 — initial shock, injuries, shelter-seeking; Day 2-3 — waiting out fallout, rationing supplies, monitoring radiation; Day 4-5 — resource assessment, contact with neighbors; Day 6-7 — decision point about evacuation vs. staying. Make it emotionally grounded and realistic. Include specific preparedness details (water storage, shelter-in-place, KI tablets, communication). Educational but human.`;
    }

    if (narrativeType === 'geopolitical') {
      return `Write a geopolitical aftermath analysis following a nuclear detonation at ${loc}. Target: ~400 words.

Cover: immediate attribution process, which alliances activate and how, the escalation vs. de-escalation dynamic, UN Security Council response (and its limitations), global economic shock in the first 30 days, and the 90-day geopolitical outlook. Be analytically rigorous. Reference real treaties (Article 5, Stafford Act, NPT). Acknowledge genuine uncertainty about outcomes.`;
    }
  }

  if (type === 'zombie') {
    if (narrativeType === 'aftermath') {
      return `You are writing an educational outbreak narrative. A zombie-like pathogen (Category X behavioral virus) has originated in ${loc}.

Write an hour-by-hour account of how the outbreak unfolds from patient zero through the first week. Target: ~600 words.

Include: initial patient presentation and misdiagnosis, first transmission events, local health authority response, media coverage arc, government denial phase, military deployment decision, containment collapse. Use specific timepoints. Be realistic about institutional response failures and individual human decisions. This is for educational purposes about pandemic preparedness and emergency response.`;
    }

    if (narrativeType === 'journal') {
      return `Write a first-person 7-day survival journal from someone sheltering during a zombie outbreak that began near ${loc}. Target: ~600 words.

Format as daily journal entries. Include: Day 1 — first awareness, making the shelter decision; Day 2-3 — settling in, inventory, listening to radio; Day 4-5 — group dynamics, information gathering, planning; Day 6-7 — decision point about evacuation. Make it realistic about what works (sheltering in place, water storage, communication discipline) and what doesn't. Educational and emotionally grounded.`;
    }

    if (narrativeType === 'geopolitical') {
      return `Write a geopolitical analysis of how nations respond to a zombie-like pandemic outbreak that originated in ${loc}. Target: ~400 words.

Cover: initial national containment measures, WHO coordination and its failures, border closure decisions, military deployment doctrine, international cooperation that eventually emerges, and realistic collapse scenarios for regions without institutional capacity. Reference actual frameworks (IHR, Article 5, CDC protocols). Be analytically honest about both institutional failures and resilience.`;
    }
  }

  return `Write a 400-word dramatic narrative about a catastrophic event at ${loc}.`;
}

/**
 * POST /api/narrative
 * Streams an AI-generated narrative via SSE
 */
router.post('/', async (req: Request, res: Response) => {
  const { type, narrativeType, config, locationName } = req.body as NarrativeRequest;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // ── No API key: stream mock content with artificial pacing ───────────────
  if (!apiKey) {
    const mockText = getMockNarrative(type, narrativeType);
    const words = mockText.split(' ');
    const chunkSize = 5;

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ') + (i + chunkSize < words.length ? ' ' : '');
      res.write(`data: ${chunk}\n\n`);
      // Small artificial delay to simulate streaming
      await new Promise((r) => setTimeout(r, 20));
    }

    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  // ── With API key: stream from Claude ────────────────────────────────────
  try {
    // Dynamic import to avoid issues if package not installed
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });

    const prompt = buildPrompt(type, narrativeType, locationName, config as Record<string, unknown>);

    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
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
    console.error('[narrative] API error:', err);
    // Fallback to mock on API error
    const mockText = getMockNarrative(type, narrativeType);
    res.write(`data: ${mockText}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

export default router;
