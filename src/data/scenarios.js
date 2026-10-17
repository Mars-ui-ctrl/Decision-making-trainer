/**
 * scenarios.js
 * Curriculum catalog of training exercises for the Decision-Making Trainer.
 *
 * Each exercise targets a distinct cognitive challenge and decision-making skill:
 * 1. Communication Familiarization (Beginner) — Operating with latency and signal loss
 * 2. Conflicting Reports (Intermediate) — Evaluating contradictory sources with varying freshness
 * 3. Time Pressure & Shrinking Window (Intermediate) — Balancing information gathering against time
 * 4. Resource Constraints (Advanced) — Allocating limited comm relays and bandwidth
 * 5. Multi-Factor Disruption (Advanced) — Managing simultaneous uncertainties and compounding risks
 */

export const scenarios = [
  {
    id: 'scenario-01',
    exerciseNumber: '01',
    title: 'Communication Familiarization',
    subtitle: 'Signal Loss & Telemetry Latency',
    difficulty: 'Beginner',
    trainingFocus: 'Understanding degraded communication and operating when a critical information source goes silent.',
    coreLesson: 'Communication is not always reliable. Do not assume silence means destruction, and never act on stale coordinates without verifying latency.',
    description:
      'A routine patrol enters mountainous terrain with known RF shadow zones. One unit’s telemetry lags, and another goes silent. Learn to recognize degradation and adapt without panicking.',
    briefing:
      'You are coordinating three reconnaissance units (Unit A, Unit B, Unit C) in Sector 7. Terrain masking will degrade communications as units advance. You will learn to recognize latency, manage uncertainty, and maintain mutual support.',
    domain: ['Communication', 'Unit Coordination', 'Latency Awareness'],
    estimatedTime: '5-7 min',
    decisionPoints: 6,
    locked: false,
    learningObjectives: [
      'Distinguish between live, delayed, limited, and lost communication states',
      'Understand the operational danger of treating delayed coordinates as real-time ground truth',
      'Implement disciplined line-of-sight relays rather than blind advancement',
      'Manage uncertainty calmly when a forward unit ceases transmission',
    ],
    initialComms: {
      'Unit A': 'live',
      'Unit B': 'delayed',
      'Unit C': 'limited',
    },
  },
  {
    id: 'scenario-02',
    exerciseNumber: '02',
    title: 'Conflicting Reports',
    subtitle: 'Source Reliability & Data Freshness',
    difficulty: 'Intermediate',
    trainingFocus: 'Evaluating contradictory information from sources with different observation angles, reliability levels, and latency.',
    coreLesson: 'Different information sources have different reliability and freshness. Prioritize recent direct line-of-sight confirmation over stale sensor feeds.',
    description:
      'Two different units provide contradictory status reports about an obstacle on the primary route. One source is real-time; the other is 4 minutes delayed. Determine which source to trust.',
    briefing:
      'Multiple information channels are reporting contradictory sector statuses. You must weigh data freshness, evaluate sensor angles, request clarification appropriately, and make decisions without perfect consensus.',
    domain: ['Intelligence', 'Critical Thinking', 'Contradiction Resolution'],
    estimatedTime: '7-9 min',
    decisionPoints: 6,
    locked: false, // Make accessible for training progression exploration
    learningObjectives: [
      'Cross-examine conflicting reports using timestamp comparison',
      'Identify cognitive biases that lead trainees to accept outdated data',
      'Make defensible decisions under informational ambiguity',
      'Request targeted confirmation without tying up degraded channels',
    ],
    initialComms: {
      'Source Alpha': 'live',
      'Source Beta': 'delayed',
      'Sensor Relay': 'degraded',
    },
  },
  {
    id: 'scenario-03',
    exerciseNumber: '03',
    title: 'Time Pressure & Window',
    subtitle: 'Closing Operational Window',
    difficulty: 'Intermediate',
    trainingFocus: 'Balancing the desire for more complete information against a rapidly closing operational window.',
    coreLesson: 'Waiting for certainty has a direct cost. When an operational window is closing, decide what minimum viable risk you are willing to accept.',
    description:
      'An approaching storm front gives units only 15 minutes before all extraction routes are cut off. You must decide whether to wait for confirmation or commit under partial awareness.',
    briefing:
      'An incoming weather system will close air observation and ground transit within 15 minutes. A distress beacon has pinged, but location data is incomplete. You must balance the risk of hasty action vs the fatal cost of hesitation.',
    domain: ['Time Management', 'Risk Acceptance', 'Operational Tempo'],
    estimatedTime: '8-10 min',
    decisionPoints: 6,
    locked: false,
    learningObjectives: [
      'Recognize when waiting for more information increases overall risk',
      'Calculate time costs of alternate routing and verification holds',
      'Commit to action under incomplete but time-critical conditions',
      'Establish clear go/no-go triggers before entering uncertainty zones',
    ],
    initialComms: {
      'Scout 1': 'live',
      'Scout 2': 'delayed',
      'Beacon': 'limited',
    },
  },
  {
    id: 'scenario-04',
    exerciseNumber: '04',
    title: 'Resource Constraints',
    subtitle: 'Relay Allocation & Bandwidth Triage',
    difficulty: 'Advanced',
    trainingFocus: 'Managing limited communication channels and prioritizing which units receive relay assets.',
    coreLesson: 'When communication resources are scarce, triage based on operational impact rather than equal distribution.',
    description:
      'A cascading RF failure disables secondary repeaters. You have only one portable repeater drone and must decide which sector and unit requires prioritized connectivity.',
    briefing:
      'Multiple units in dispersed valleys are requesting comm relay support simultaneously. With only one functional airborne repeater and limited battery reserves, you must allocate bandwidth where the risk of loss is highest.',
    domain: ['Resource Management', 'Bandwidth Triage', 'Asset Allocation'],
    estimatedTime: '10-12 min',
    decisionPoints: 7,
    locked: true,
    learningObjectives: [
      'Triage communication assets during cascading failures',
      'Evaluate which units can operate autonomously under SOP vs which require active coordination',
      'Accept deliberate communication gaps in secondary sectors to protect critical axes',
    ],
    initialComms: {
      'Lead Team': 'degraded',
      'Flank North': 'lost',
      'Flank South': 'lost',
      'Air Relay': 'limited',
    },
  },
  {
    id: 'scenario-05',
    exerciseNumber: '05',
    title: 'Multi-Factor Disruption',
    subtitle: 'Compound Uncertainty & Autonomous Command',
    difficulty: 'Advanced',
    trainingFocus: 'Operating when communication loss, conflicting intelligence, weather degradation, and asset failures compound simultaneously.',
    coreLesson: 'You cannot eliminate every uncertainty. A disciplined leader identifies the primary risk, accepts secondary ambiguities, and maintains momentum.',
    description:
      'The ultimate training challenge: simultaneous signal blackouts, contradictory reports, severe weather, and isolated units. Test everything learned across previous exercises.',
    briefing:
      'Severe multi-domain disruption. All primary satellite and VHF channels have failed. Conflicting reports from earlier waypoints remain unresolved as night approaches. Command must guide the mission using pre-established SOPs and courageous, calculated decisions.',
    domain: ['Compound Risk', 'Autonomous Decision-Making', 'Crisis Leadership'],
    estimatedTime: '12-15 min',
    decisionPoints: 8,
    locked: true,
    learningObjectives: [
      'Synthesize all prior decision-making principles under compound pressure',
      'Maintain strategic mission intent when tactical details are unknown',
      'Avoid paralysis by analysis during multi-factor crises',
    ],
    initialComms: {
      'Unit Alpha': 'lost',
      'Unit Bravo': 'lost',
      'Unit Charlie': 'lost',
    },
  },
];

export function getScenarioById(id) {
  return scenarios.find(s => s.id === id) || scenarios[0];
}

export function getUnlockedScenarios() {
  return scenarios.filter(s => !s.locked);
}

export function getDifficultyClass(difficulty) {
  const map = {
    Beginner: 'badge--beginner',
    Intermediate: 'badge--intermediate',
    Advanced: 'badge--advanced',
  };
  return map[difficulty] || 'badge--info';
}
