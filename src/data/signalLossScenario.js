/**
 * signalLossScenario.js
 * Immersive Scenario Definition for Exercise 01:
 * "Signal Loss & Telemetry Latency"
 *
 * Implements Master's directive:
 * - WORLD > TEXT
 * - LESS UI, MORE SIMULATION
 * - SEE -> HEAR -> NOTICE -> UNDERSTAND -> THINK -> DECIDE -> WATCH CONSEQUENCE -> ADAPT
 * - Units visibly move in real-time
 * - Audio drives the scenario BEFORE decisions (Instructor, Radio, System)
 * - Obvious focused decision prompts with high-stakes trade-offs
 * - Consequences physically manifest in the world and cascade into future problems
 */

export const SIGNAL_LOSS_SCENARIO = {
  id: 'scenario-01',
  exerciseNumber: '01',
  title: 'Signal Loss & Telemetry Latency',
  subtitle: 'Northern Gorge Reconnaissance',
  difficulty: 'Beginner',
  estimatedTime: '4-6 min',
  trainingCategory: 'Communication Degradation',
  trainingFocus: 'Maintaining operational coordination when a primary unit enters an RF shadow zone and telemetry goes dark.',
  coreLesson: 'Do not assume silence means destruction. Committing assets to restore communication creates new operational constraints.',

  briefing: {
    role: 'Communications Coordinator',
    objective: 'Maintain coordination between three units operating across Sector Seven as communication conditions deteriorate.',
    currentPriority: 'Observe Bravo.',
    summary: 'Sector Seven is an active mountainous reconnaissance theater with known RF terrain masking around the Northern Gorge. Three units are currently deployed.',
    learningObjectives: [
      'Learn to notice latency and signal decay before complete loss.',
      'Resist acting precipitously on stale telemetry coordinates.',
      'Evaluate the real operational cost of establishing a relay.',
      'Adapt when previous decisions constrain your available assets.',
    ],
  },

  mapFeatures: {
    sectors: [
      { id: 'sec-7a', name: 'BASIN SECTOR (ALPHA)', bounds: { x: 40, y: 160, w: 250, h: 250 } },
      { id: 'sec-7b', name: 'EASTERN RIDGE', bounds: { x: 310, y: 200, w: 220, h: 210 } },
      { id: 'sec-7c', name: 'NORTHERN GORGE CORRIDOR', bounds: { x: 470, y: 40, w: 290, h: 170 } },
    ],
    terrainShadows: [
      {
        id: 'gorge-shadow',
        label: 'NORTHERN GORGE (RF SHADOW ZONE)',
        x: 500,
        y: 60,
        w: 160,
        h: 90,
        description: 'Steep granite cuts block line-of-sight VHF signals to Command HQ.',
      },
      {
        id: 'eastern-bluff',
        label: 'EASTERN BLUFF RIDGE',
        x: 350,
        y: 220,
        w: 120,
        h: 60,
        description: 'Elevated ridgeline with line-of-sight into both Basin and Gorge.',
      },
    ],
    checkpoints: [
      { id: 'CP-1', name: 'CP-1 (Gorge Entry)', x: 480, y: 180 },
      { id: 'CP-2', name: 'CP-2 (Ridge Top)', x: 380, y: 220 },
      { id: 'CP-3', name: 'CP-3 (Gorge Pass)', x: 570, y: 110 },
      { id: 'RP-Delta', name: 'Rally Point Delta', x: 710, y: 80 },
    ],
    primaryRoute: [
      { x: 230, y: 290 },
      { x: 380, y: 250 },
      { x: 480, y: 180 },
      { x: 570, y: 110 },
      { x: 710, y: 80 },
    ],
  },

  initialEntities: {
    alpha: {
      id: 'alpha',
      name: 'Alpha',
      fullDesignation: 'Unit Alpha (Lead Scout)',
      role: 'Lead Scout',
      commStatus: 'live',
      lastUpdateSec: 3,
      position: { x: 220, y: 280 },
      route: [{ x: 250, y: 270 }, { x: 280, y: 260 }],
      notes: 'Operating in open basin. Clear line-of-sight.',
    },
    bravo: {
      id: 'bravo',
      name: 'Bravo',
      fullDesignation: 'Unit Bravo (Support Recon)',
      role: 'Support Recon',
      commStatus: 'live',
      lastUpdateSec: 2,
      position: { x: 360, y: 240 },
      route: [{ x: 420, y: 210 }, { x: 480, y: 180 }, { x: 560, y: 110 }],
      notes: 'Moving north along route towards gorge corridor.',
    },
    charlie: {
      id: 'charlie',
      name: 'Charlie',
      fullDesignation: 'Unit Charlie (Flank Guard)',
      role: 'Flank Guard',
      commStatus: 'live',
      lastUpdateSec: 4,
      position: { x: 430, y: 340 },
      route: [{ x: 450, y: 330 }],
      notes: 'Stationary on southern ridge overlooking sector.',
    },
  },

  // Timeline events before Decision 1
  introTimeline: [
    {
      timeMs: 500,
      type: 'INSTRUCTOR',
      speaker: 'INSTRUCTOR',
      channel: 'instructor',
      text: 'Exercise one. You are coordinating three units operating across Sector Seven. Communication is currently stable. Bravo is moving toward the northern gorge. Your task is to maintain coordination as communication conditions deteriorate.',
      cameraFocus: null,
    },
    {
      timeMs: 6500,
      type: 'RADIO',
      speaker: 'BRAVO',
      channel: 'radio',
      text: 'Bravo to Command. Approaching the gorge.',
      entityUpdates: {
        bravo: { position: { x: 470, y: 185 }, lastUpdateSec: 6 },
        alpha: { position: { x: 250, y: 270 }, lastUpdateSec: 4 },
      },
    },
    {
      timeMs: 11000,
      type: 'RADIO',
      speaker: 'BRAVO',
      channel: 'radio',
      text: 'Command, Bravo... signal is degrading.',
      entityUpdates: {
        bravo: { position: { x: 520, y: 140 }, commStatus: 'degraded', lastUpdateSec: 32 },
      },
    },
    {
      timeMs: 15500,
      type: 'RADIO_LOST',
      speaker: 'BRAVO',
      channel: 'radio',
      text: 'Command, do you copy? ... [STATIC] ... repeat ... [CARRIER LOST]',
      entityUpdates: {
        bravo: { position: { x: 560, y: 110 }, commStatus: 'lost', lastUpdateSec: 68 },
      },
      cameraFocus: { x: 560, y: 110, zoom: 1.15 },
    },
    {
      timeMs: 18500,
      type: 'SYSTEM',
      speaker: 'SYSTEM',
      channel: 'system',
      text: 'Bravo telemetry unavailable. Last confirmed position recorded.',
    },
    {
      timeMs: 20000,
      type: 'DECISION_READY',
      speaker: 'INSTRUCTOR',
      channel: 'instructor',
      text: 'You no longer have current information on Bravo.',
    },
  ],

  // Decision Point 1
  decisionPoint1: {
    id: 'dec-1',
    headline: 'BRAVO HAS LOST CONTACT IN THE NORTHERN GORGE',
    subtext: 'Telemetry carrier dropped upon entering the shadow zone. Last position confirmed 68s ago.',
    options: [
      {
        id: 'hold',
        key: '1',
        label: 'A',
        title: 'HOLD POSITION',
        tagline: 'Maintain current dispersion and await scheduled check-in',
        pros: 'Preserves Alpha and Charlie in their designated sectors',
        cons: 'Remains completely blind to Bravo condition and obstacle',
        tradeoff: '+ Preserves assets | - Blind to Bravo',
        consequence: {
          type: 'hold',
          headline: 'HELD POSTURE — UNCERTAINTY EXPANDED',
          radioTransmission: {
            speaker: 'SYSTEM',
            channel: 'system',
            text: 'Bravo scheduled check-in window elapsed without contact.',
          },
          instructorGuidance: {
            speaker: 'INSTRUCTOR',
            channel: 'instructor',
            text: 'Bravo did not check in. Uncertainty has grown, and weather is now closing the pass.',
          },
          entityChanges: {
            bravo: { uncertaintyRadius: 55, commStatus: 'lost', lastUpdateSec: 210 },
          },
          weatherIncrease: 0.65,
          nextProblemText: 'A heavy mountain storm front is rolling into the northern corridor, threatening to trap Bravo entirely.',
        },
      },
      {
        id: 'relay',
        key: '2',
        label: 'B',
        title: 'DISPATCH ALPHA AS RELAY',
        tagline: 'Maneuver Alpha to Eastern Ridge CP-2 to establish line-of-sight',
        pros: 'High probability of restoring communication with Bravo',
        cons: 'Commits Alpha to static relay duty; basin flank left unguarded',
        tradeoff: '+ Restores Bravo link | - Commits Alpha',
        consequence: {
          type: 'relay',
          headline: 'ALPHA DISPATCHED AS RELAY — CONTACT RESTORED',
          radioTransmission: {
            speaker: 'BRAVO',
            channel: 'radio',
            text: 'Bravo to Command... we have you through Alpha relay. Rockfall ahead in gorge, we are rerouting.',
          },
          instructorGuidance: {
            speaker: 'INSTRUCTOR',
            channel: 'instructor',
            text: 'Communication was restored, but Alpha is now committed to relay support.',
          },
          activeRelay: { from: 'alpha', to: 'bravo' },
          obstacle: { x: 590, y: 105, label: 'ROCKFALL' },
          entityChanges: {
            alpha: { position: { x: 380, y: 220 }, commStatus: 'live', lastUpdateSec: 2, role: 'Active Relay' },
            bravo: { commStatus: 'live', lastUpdateSec: 3, uncertaintyRadius: 0 },
          },
          weatherIncrease: 0.45,
          nextProblemText: 'Alpha is now locked on the ridge holding the relay link. Charlie reports deteriorating weather on the southern pass and requests immediate Alpha assistance.',
        },
      },
      {
        id: 'move',
        key: '3',
        label: 'C',
        title: 'ORDER CHARLIE TO ADVANCE',
        tagline: 'Vector Charlie from high ground into the gorge to search for Bravo',
        pros: 'Sends physical support toward Bravo last known position',
        cons: 'Sends second unit into the exact same RF shadow zone',
        tradeoff: '+ Active physical search | - Risks losing Charlie too',
        consequence: {
          type: 'move',
          headline: 'CHARLIE ENTERED GORGE — SECOND CARRIER LOST',
          radioTransmission: {
            speaker: 'CHARLIE',
            channel: 'radio',
            text: 'Command, Charlie entering gorge cut... heavy interference... losing carrier...',
          },
          instructorGuidance: {
            speaker: 'INSTRUCTOR',
            channel: 'instructor',
            text: 'Charlie entered the shadow zone. You now have two silent units.',
          },
          entityChanges: {
            charlie: { position: { x: 500, y: 170 }, commStatus: 'lost', uncertaintyRadius: 40, lastUpdateSec: 75 },
            bravo: { uncertaintyRadius: 45, lastUpdateSec: 130 },
          },
          weatherIncrease: 0.60,
          nextProblemText: 'Acting on incomplete information doubled your uncertainty. Both Bravo and Charlie are now silent in the gorge.',
        },
      },
    ],
  },

  // Decision Point 2 (Adaptation to the new problem created by Decision 1)
  getDecisionPoint2: (choice1) => {
    if (choice1 === 'relay') {
      return {
        id: 'dec-2-relay',
        headline: 'STORM CLOSING RAPIDLY — ALPHA IS LOCKED ON RELAY',
        subtext: 'Charlie reports sudden weather closure on the southern flank. Alpha cannot move without severing Bravo in the rockfall cut.',
        options: [
          {
            id: 'break-relay-retreat',
            key: '1',
            label: 'A',
            title: 'RELEASE ALPHA & ORDER ALL-UNIT RALLY',
            tagline: 'Break relay link, transmit emergency egress coordinates to Rally Point Delta, and sprint',
            tradeoff: '+ Saves all units from storm | - Bravo navigates rockfall blind',
            consequenceText: 'Alpha detached and guided Charlie out of the weather pocket. Bravo cleared the rockfall on dead reckoning and met at Delta.',
          },
          {
            id: 'hold-relay-charlie-solo',
            key: '2',
            label: 'B',
            title: 'MAINTAIN RELAY & DIRECT CHARLIE TO PULL BACK SOLO',
            tagline: 'Keep Alpha locked on ridge to shepherd Bravo past the rockfall while Charlie retreats alone',
            tradeoff: '+ Ensures Bravo bypasses hazard | - Charlie faces storm unassisted',
            consequenceText: 'Bravo safely navigated the rockfall with Alpha guidance. Charlie sustained minor delays in storm front but reached Delta.',
          },
        ],
      };
    }

    if (choice1 === 'hold') {
      return {
        id: 'dec-2-hold',
        headline: 'CHECK-IN ELAPSED — STORM SEVERING GORGE PASS',
        subtext: 'Bravo has been silent for over 3 minutes. The storm front is 90 seconds from rendering the gorge pass impassable.',
        options: [
          {
            id: 'emergency-probe',
            key: '1',
            label: 'A',
            title: 'DISPATCH RAPID PROBE INTO GORGE MOUTH',
            tagline: 'Order Alpha to sprint to CP-1 to attempt line-of-sight visual contact before storm seals entrance',
            tradeoff: '+ Last chance to locate Bravo | - Places Alpha inside storm hazard',
            consequenceText: 'Alpha reached CP-1 and spotted Bravo emergency flare. Both units linked up and beat the weather front.',
          },
          {
            id: 'order-egress-delta',
            key: '2',
            label: 'B',
            title: 'ORDER FALLBACK TO RALLY POINT DELTA',
            tagline: 'Adhere to emergency protocol: initiate fallback of Alpha and Charlie to pre-briefed rally point',
            tradeoff: '+ Preserves Alpha and Charlie | - Assumes Bravo will execute SOP independently',
            consequenceText: 'Alpha and Charlie secured Rally Point Delta. 12 minutes later, Bravo emerged from gorge bypass on emergency SOP.',
          },
        ],
      };
    }

    // Advance (Charlie also lost)
    return {
      id: 'dec-2-move',
      headline: 'TWO UNITS SILENT IN GORGE CORRIDOR',
      subtext: 'Both Bravo and Charlie have dropped off telemetry inside the northern shadow cut. Alpha is your only active asset.',
      options: [
        {
          id: 'alpha-to-ridge',
          key: '1',
          label: 'A',
          title: 'VECTOR ALPHA TO HIGH RIDGE CREST',
          tagline: 'Position Alpha on the Eastern Ridge to regain line-of-sight with both units from high ground',
          tradeoff: '+ Restores dual line-of-sight | - Alpha is your final uncommitted asset',
          consequenceText: 'Alpha cresting the ridge opened a wide-angle relay channel, recovering carrier with both Bravo and Charlie simultaneously.',
        },
        {
          id: 'signal-flares-delta',
          key: '2',
          label: 'B',
          title: 'BROADCAST EMERGENCY BURST & RALLY DELTA',
          tagline: 'Fire high-altitude signal flares and order immediate egress to Rally Point Delta',
          tradeoff: '+ Clear visual beacon | - Relies on visual sighting in overcast weather',
          consequenceText: 'Flares penetrated cloud ceiling. Both units recognized emergency egress signal and retreated along safe valley floor.',
        },
      ],
    };
  },
};
