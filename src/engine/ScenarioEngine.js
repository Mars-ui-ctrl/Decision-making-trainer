/**
 * ScenarioEngine.js
 * Event-Driven State Machine for Exercise 01: Signal Loss & Telemetry Latency
 *
 * Implements Master's directive:
 * - Strictly sequential, non-overlapping audio transmissions
 * - Each audio clip completes before the next event begins
 * - Natural pauses of observation and silence between events
 * - Physical world consequences and emergent constraints
 */

import { voiceEngine } from '../audio/VoiceEngine.js';

export class ScenarioEngine {
  constructor(scenarioDefinition, initialMode = 'guided') {
    if (!scenarioDefinition) {
      throw new Error('Invalid scenario definition provided to ScenarioEngine');
    }

    this.scenario = scenarioDefinition;
    this.listeners = new Set();
    this.trainingMode = initialMode;
    this.timelineRunId = 0;
    this.activeSleepTimers = [];

    this.state = this._buildInitialState();
  }

  _buildInitialState() {
    return {
      scenarioId: this.scenario.id,
      exerciseNumber: this.scenario.exerciseNumber || '01',
      title: this.scenario.title,
      subtitle: this.scenario.subtitle || '',
      difficulty: this.scenario.difficulty,
      trainingMode: this.trainingMode,
      briefing: this.scenario.briefing,

      // Phases: 'ready' | 'simulating' | 'decision-1' | 'consequence-1' | 'decision-2' | 'consequence-2' | 'complete'
      phase: 'ready',
      activeStep: 1,
      totalSteps: 2,

      // Environmental & Tactical Layers
      weatherIntensity: 0.2,
      obstacle: null,
      activeRelay: null,
      cameraFocus: null,

      // Tactical Entities
      entities: JSON.parse(JSON.stringify(this.scenario.initialEntities || {})),
      mapFeatures: this.scenario.mapFeatures || {},

      // Audio & Transmissions
      currentTransmission: null,
      currentGuidance: null,

      // Decisions & History
      currentDecisionPrompt: null,
      decisionHistory: [],
      startTime: null,
      endTime: null,
      elapsedSeconds: 0,
    };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const snapshot = this.getState();
    this.listeners.forEach(fn => fn(snapshot));
  }

  getState() {
    return {
      ...this.state,
      entities: JSON.parse(JSON.stringify(this.state.entities)),
      decisionHistory: [...this.state.decisionHistory],
      currentDecisionPrompt: this.state.currentDecisionPrompt
        ? { ...this.state.currentDecisionPrompt }
        : null,
    };
  }

  _sleep(ms) {
    return new Promise(resolve => {
      const id = setTimeout(resolve, ms);
      this.activeSleepTimers.push(id);
    });
  }

  _clearTimers() {
    this.timelineRunId++;
    this.activeSleepTimers.forEach(id => clearTimeout(id));
    this.activeSleepTimers = [];
    voiceEngine.stop();
  }

  /**
   * Start the simulation: triggers the sequential timeline
   */
  start(mode) {
    if (mode) this.trainingMode = mode;
    this._clearTimers();

    const runId = this.timelineRunId;

    this.state = {
      ...this._buildInitialState(),
      phase: 'simulating',
      trainingMode: this.trainingMode,
      startTime: Date.now(),
    };
    this.notify();

    this._runIntroTimeline(runId);
  }

  /**
   * Sequential timeline: strictly awaits each voice transmission before next step
   */
  async _runIntroTimeline(runId) {
    const isCurrent = () => runId === this.timelineRunId && this.state.phase === 'simulating';

    const play = async (speaker, channel, text) => {
      if (!isCurrent()) return;
      const transmission = { speaker, channel, text };
      this.state.currentTransmission = transmission;
      if (channel === 'instructor') {
        this.state.currentGuidance = {
          concept: 'Operational Briefing',
          insight: text,
        };
      }
      this.notify();
      await voiceEngine.transmit(transmission);
    };

    // 1. Initial Instructor Briefing
    await play(
      'INSTRUCTOR',
      'instructor',
      'Exercise one. You are coordinating three units across Sector Seven. Communication is currently stable. Bravo is moving toward the northern gorge.'
    );
    if (!isCurrent()) return;

    // 2. Trainee observes normal patrol motion (2.5s)
    await this._sleep(2500);
    if (!isCurrent()) return;

    // 3. Bravo approaches the gorge
    const entities1 = { ...this.state.entities };
    entities1.bravo = { ...entities1.bravo, position: { x: 470, y: 185 }, lastUpdateSec: 6 };
    entities1.alpha = { ...entities1.alpha, position: { x: 250, y: 270 }, lastUpdateSec: 4 };
    this.state.entities = entities1;
    this.notify();

    await play('BRAVO', 'radio', 'Bravo to Command. Approaching the gorge.');
    if (!isCurrent()) return;

    // 4. Bravo enters the terrain masking cut (2.5s)
    await this._sleep(2500);
    if (!isCurrent()) return;

    const entities2 = { ...this.state.entities };
    entities2.bravo = {
      ...entities2.bravo,
      position: { x: 520, y: 140 },
      commStatus: 'degraded',
      lastUpdateSec: 32,
    };
    this.state.entities = entities2;
    this.notify();

    await play('BRAVO', 'radio', 'Command, Bravo... signal is degrading.');
    if (!isCurrent()) return;

    // 5. Line flickers and snaps (2s)
    await this._sleep(2000);
    if (!isCurrent()) return;

    const entities3 = { ...this.state.entities };
    entities3.bravo = {
      ...entities3.bravo,
      position: { x: 560, y: 110 },
      commStatus: 'lost',
      lastUpdateSec: 68,
    };
    this.state.entities = entities3;
    this.state.cameraFocus = { x: 560, y: 110, zoom: 1.15 };
    this.notify();

    await play('BRAVO', 'radio', 'Command, do you copy? ... repeat ...');
    if (!isCurrent()) return;

    await this._sleep(1000);
    if (!isCurrent()) return;

    // 6. System alert
    await play('SYSTEM', 'system', 'Bravo telemetry unavailable. Last confirmed position recorded.');
    if (!isCurrent()) return;

    await this._sleep(1000);
    if (!isCurrent()) return;

    // 7. Instructor decision cue
    await play('INSTRUCTOR', 'instructor', 'You no longer have current information on Bravo.');
    if (!isCurrent()) return;

    // 8. Present Decision 1
    this.state.phase = 'decision-1';
    this.state.currentDecisionPrompt = this.scenario.decisionPoint1;
    this.notify();
  }

  /**
   * Trainee selects a choice in Decision Point 1
   */
  async makeDecision1(optionId, responseTimeMs = 0) {
    const dec1 = this.scenario.decisionPoint1;
    const selectedOption = dec1.options.find(o => o.id === optionId);
    if (!selectedOption) return;

    this._clearTimers();
    const currentRunId = this.timelineRunId;
    const isCurrent = () => currentRunId === this.timelineRunId;

    const consequence = selectedOption.consequence;

    // Record Decision 1 in history
    const record = {
      stepIndex: 1,
      stepTitle: 'Initial Signal Loss at Northern Gorge',
      selectedOptionId: selectedOption.id,
      selectedOptionLabel: selectedOption.label,
      selectedOptionTitle: selectedOption.title,
      tradeoff: selectedOption.tradeoff,
      responseTimeMs: Math.round(responseTimeMs),
      timestamp: Date.now(),
      situationAtTime: {
        known: 'Bravo entered northern gorge corridor. Telemetry carrier dropped upon entering shadow cut. Last position confirmed 68s ago.',
        uncertain: 'Exact condition and route viability of Bravo inside the gorge.',
        commStatus: 'Command: Live | Alpha: Live | Bravo: Lost | Charlie: Live',
      },
      outcome: consequence.instructorGuidance.text,
      headline: consequence.headline,
      consequenceText: consequence.instructorGuidance.text,
      tacticalAnalysis:
        selectedOption.id === 'relay'
          ? 'Evaluated using information available at the time: Leveraging elevated terrain to bridge non-line-of-sight VHF coverage directly resolved the known terrain masking without exposing secondary units inside the shadow zone.'
          : selectedOption.id === 'hold'
          ? 'Evaluated using information available at the time: Holding position conserved Alpha, but relied on a scheduled check-in when terrain masking was already confirmed.'
          : 'Evaluated using information available at the time: Recalling Bravo prioritized unit integrity over the mission objective. While it eliminated isolation risk, RF degradation alone in known shadow terrain is an expected condition that can often be resolved with relays before abandoning the mission.',
      alternativeConsideration:
        selectedOption.id === 'relay'
          ? 'Alternative to consider: If Alpha had been required for immediate flank security, Command could have established strict timed-rally triggers.'
          : selectedOption.id === 'hold'
          ? 'Alternative to consider: Vector an adjacent unit to an elevated line-of-sight position (such as Eastern Ridge) to bridge communications before the storm closes the corridor.'
          : 'Alternative to consider: Test line-of-sight relay links from adjacent high ground prior to initiating an operational abort.',
    };
    this.state.decisionHistory.push(record);

    // Apply immediate world modifications
    const updatedEntities = { ...this.state.entities };
    if (consequence.entityChanges) {
      Object.entries(consequence.entityChanges).forEach(([id, changes]) => {
        if (updatedEntities[id]) {
          updatedEntities[id] = {
            ...updatedEntities[id],
            ...changes,
            position: changes.position ? { ...changes.position } : updatedEntities[id].position,
          };
        }
      });
    }

    this.state = {
      ...this.state,
      phase: 'consequence-1',
      entities: updatedEntities,
      activeRelay: consequence.activeRelay || null,
      obstacle: consequence.obstacle || null,
      weatherIntensity: consequence.weatherIncrease || this.state.weatherIntensity,
      currentDecisionPrompt: null,
      cameraFocus: selectedOption.id === 'relay' ? { x: 420, y: 190, zoom: 1.05 } : null,
      currentTransmission: consequence.radioTransmission,
      currentGuidance: {
        concept: consequence.headline,
        insight: consequence.instructorGuidance.text,
      },
    };
    this.notify();

    // 1. Await radio response
    await voiceEngine.transmit(consequence.radioTransmission);
    if (!isCurrent()) return;

    await this._sleep(1200);
    if (!isCurrent()) return;

    // 2. Await instructor guidance
    this.state.currentTransmission = consequence.instructorGuidance;
    this.notify();
    await voiceEngine.transmit(consequence.instructorGuidance);
    if (!isCurrent()) return;

    await this._sleep(1500);
    if (!isCurrent()) return;

    // 3. Transition to Decision 2 (The emergent problem created by Decision 1)
    this._activateDecision2(selectedOption.id);
  }

  _activateDecision2(choice1Id) {
    const dec2 = this.scenario.getDecisionPoint2(choice1Id);
    this.state = {
      ...this.state,
      phase: 'decision-2',
      activeStep: 2,
      currentDecisionPrompt: dec2,
      weatherIntensity: Math.min(1.0, this.state.weatherIntensity + 0.25),
      currentTransmission: {
        speaker: 'SYSTEM',
        channel: 'system',
        text: 'Tactical constraint updated. Immediate decision required.',
      },
    };
    this.notify();
    voiceEngine.playSound('alert');
  }

  /**
   * Trainee selects a choice in Decision Point 2 (Adaptation)
   */
  async makeDecision2(optionId, responseTimeMs = 0) {
    const dec2 = this.state.currentDecisionPrompt;
    if (!dec2) return;

    const selectedOption = dec2.options.find(o => o.id === optionId);
    if (!selectedOption) return;

    this._clearTimers();
    const currentRunId = this.timelineRunId;
    const isCurrent = () => currentRunId === this.timelineRunId;

    // Record Decision 2 in history
    const record = {
      stepIndex: 2,
      stepTitle: 'Adaptation & Weather Closure',
      selectedOptionId: selectedOption.id,
      selectedOptionLabel: selectedOption.label,
      selectedOptionTitle: selectedOption.title,
      tradeoff: selectedOption.tradeoff,
      responseTimeMs: Math.round(responseTimeMs),
      timestamp: Date.now(),
      situationAtTime: {
        known: dec2.headline + (dec2.subtext ? ' — ' + dec2.subtext : ''),
        uncertain: 'Rate of storm closure across egress corridors.',
        commStatus: 'Tactical emergency channel synchronized.',
      },
      outcome: selectedOption.consequenceText,
      headline: dec2.headline,
      consequenceText: selectedOption.consequenceText,
      tacticalAnalysis: 'Evaluated using information available at the time: Under rapid environmental deterioration, committing to an extraction rally point minimizes the compound risk of lost units.',
      alternativeConsideration: 'Alternative to consider: Pre-designating fallback waypoints reduces decision latency during storm onset.',
    };
    this.state.decisionHistory.push(record);

    // World animation: Units rally to Rally Point Delta
    const updatedEntities = { ...this.state.entities };
    updatedEntities.alpha = {
      ...updatedEntities.alpha,
      position: { x: 670, y: 95 },
      commStatus: 'live',
      lastUpdateSec: 2,
    };
    updatedEntities.bravo = {
      ...updatedEntities.bravo,
      position: { x: 710, y: 80 },
      commStatus: 'live',
      lastUpdateSec: 2,
      uncertaintyRadius: 0,
    };
    updatedEntities.charlie = {
      ...updatedEntities.charlie,
      position: { x: 690, y: 110 },
      commStatus: 'live',
      lastUpdateSec: 3,
      uncertaintyRadius: 0,
    };

    const finalTransmission = {
      speaker: 'BRAVO',
      channel: 'radio',
      text: 'Command, all units accounted for at Rally Point Delta. Exercise complete.',
    };

    this.state = {
      ...this.state,
      phase: 'consequence-2',
      entities: updatedEntities,
      activeRelay: null,
      cameraFocus: null,
      currentDecisionPrompt: null,
      currentTransmission: finalTransmission,
      currentGuidance: {
        concept: 'Mission Egress Concluded',
        insight: selectedOption.consequenceText,
      },
    };
    this.notify();

    // Await final transmission
    await voiceEngine.transmit(finalTransmission);
    if (!isCurrent()) return;

    await this._sleep(1500);
    if (!isCurrent()) return;

    this.state = {
      ...this.state,
      phase: 'complete',
      endTime: Date.now(),
    };
    this.notify();
  }

  tickElapsed(sec) {
    this.state.elapsedSeconds = sec;
  }

  reset() {
    this._clearTimers();
    this.state = this._buildInitialState();
    this.notify();
  }
}
