/**
 * ImmersionTimeline.js
 *
 * Professional Decision-Making Trainer Timeline for Exercise 01.
 * 
 * Flow:
 * BRIEFING & ORIENTATION
 * → NORMAL OPERATION
 * → OBSERVATION
 * → COMMUNICATION DEGRADATION
 * → INFORMATION LOSS
 * → UNCERTAINTY (Last Known Position + Delayed Report)
 * → DECISION (Context-driven)
 * → OBSERVABLE WORLD CONSEQUENCE
 */

import { scenarioAudioController } from '../audio/ScenarioAudioController.js';
import { voiceEngine } from '../audio/VoiceEngine.js';

export function createImmersionTimeline(dispatch) {
  let runId = 0;
  let sleepTimers = [];
  let destroyed = false;

  const isCurrent = (id) => id === runId && !destroyed;

  const sleep = (ms) =>
    new Promise((resolve) => {
      const t = setTimeout(resolve, ms);
      sleepTimers.push(t);
    });

  const playScenarioTrack = async (trackId, myRun) => {
    if (!isCurrent(myRun)) return;
    await scenarioAudioController.play(trackId, (sub) => {
      dispatch({ subtitle: sub, isSpeaking: !!sub });
    });
  };

  // -----------------------------------------------------------------------
  // INITIAL COORDINATES (normalised 0-100 coordinate space)
  // -----------------------------------------------------------------------
  const COMMAND = { x: 15, y: 70 };
  const ALPHA_START = { x: 32, y: 58 };
  const BRAVO_START = { x: 46, y: 46 };
  const CHARLIE_START = { x: 58, y: 66 };

  const BRAVO_APPROACHING = { x: 56, y: 38 };
  const BRAVO_GORGE_EDGE = { x: 63, y: 28 };
  const BRAVO_INSIDE = { x: 72, y: 18 };

  // -----------------------------------------------------------------------
  // START SIMULATION
  // -----------------------------------------------------------------------
  async function start() {
    runId++;
    sleepTimers.forEach((t) => clearTimeout(t));
    sleepTimers = [];
    const myRun = runId;

    // ---------------------------------------------------------------------
    // BEAT 0: INITIAL SECTOR ORIENTATION
    // Full tactical map overview, stable communications, all units visible
    // ---------------------------------------------------------------------
    dispatch({
      phase: 'briefing',
      camera: { x: 50, y: 50, zoom: 0.95 },
      entities: {
        command: { ...COMMAND, label: 'COMMAND', status: 'live' },
        alpha: { ...ALPHA_START, label: 'ALPHA', status: 'live' },
        bravo: { ...BRAVO_START, label: 'BRAVO', status: 'live' },
        charlie: { ...CHARLIE_START, label: 'CHARLIE', status: 'live' },
      },
      commLines: {
        alpha: 'live',
        bravo: 'live',
        charlie: 'live',
      },
      subtitle: null,
      decision: null,
      weatherIntensity: 0.15,
      showUncertainty: false,
      uncertaintyTarget: null,
      delayedReport: null,
      consequence: null,
      isRelayActive: false,
    });

    await sleep(200);
    if (!isCurrent(myRun)) return;

    // =====================================================================
    // LINE 1 — ROLE
    // "You are coordinating three field teams operating across Sector Seven."
    // =====================================================================
    await playScenarioTrack('briefing1', myRun);
    if (!isCurrent(myRun)) return;
    await sleep(800);
    if (!isCurrent(myRun)) return;

    // =====================================================================
    // LINE 2 — CURRENT SITUATION
    // "Alpha is holding the southern ridge. Bravo is moving toward the northern gorge."
    // Subtly highlight Alpha, then Bravo. Bravo begins drifting forward.
    // =====================================================================
    dispatch({
      highlightedUnit: 'alpha',
      camera: { x: 42, y: 52, zoom: 1.02 },
    });

    // Start playing Line 2
    const line2Promise = playScenarioTrack('briefing2', myRun);

    // After 2.4s ("Bravo is moving toward the northern gorge"), shift highlight to Bravo and begin drift
    await sleep(2400);
    if (isCurrent(myRun)) {
      dispatch({
        highlightedUnit: 'bravo',
        camera: { x: 50, y: 46, zoom: 1.03 },
        entities: {
          command: { ...COMMAND, label: 'COMMAND', status: 'live' },
          alpha: { ...ALPHA_START, label: 'ALPHA', status: 'live' },
          bravo: { x: 50, y: 43, label: 'BRAVO', status: 'live' },
          charlie: { ...CHARLIE_START, label: 'CHARLIE', status: 'live' },
        },
      });
    }

    await line2Promise;
    if (!isCurrent(myRun)) return;
    dispatch({ highlightedUnit: null });
    await sleep(800);
    if (!isCurrent(myRun)) return;

    // =====================================================================
    // LINE 3 — COMMUNICATION
    // "Communication is currently stable, and all three teams are reporting normally."
    // Stable comm lines visible
    // =====================================================================
    dispatch({
      camera: { x: 50, y: 50, zoom: 0.96 },
    });

    await playScenarioTrack('briefing3', myRun);
    if (!isCurrent(myRun)) return;
    await sleep(800);
    if (!isCurrent(myRun)) return;

    // =====================================================================
    // LINE 4 — TRAINING OBJECTIVE
    // "Your task is to maintain coordination as conditions change."
    // Pause.
    // "Do not assume that the latest information is always the most reliable."
    // =====================================================================
    await playScenarioTrack('briefing4a', myRun);
    if (!isCurrent(myRun)) return;
    await sleep(700);
    if (!isCurrent(myRun)) return;

    await playScenarioTrack('briefing4b', myRun);
    if (!isCurrent(myRun)) return;
    await sleep(900);
    if (!isCurrent(myRun)) return;

    // =====================================================================
    // LINE 5 — WHAT TO WATCH
    // "Watch the teams, listen to their reports, and pay attention when information becomes uncertain."
    // =====================================================================
    dispatch({
      camera: { x: 52, y: 46, zoom: 1.02 },
    });

    await playScenarioTrack('briefing5', myRun);
    if (!isCurrent(myRun)) return;
    await sleep(900);
    if (!isCurrent(myRun)) return;

    // =====================================================================
    // LINE 6 — START
    // "Exercise begins now."
    // Instructor stops talking. Simulation takes over.
    // =====================================================================
    await playScenarioTrack('briefing6', myRun);
    if (!isCurrent(myRun)) return;
    await sleep(1400);
    if (!isCurrent(myRun)) return;

    // ---------------------------------------------------------------------
    // BEAT 1: NORMAL OPERATION AFTER "EXERCISE BEGINS NOW" (0-5s)
    // Bravo advances toward the gorge corridor.
    // ---------------------------------------------------------------------
    dispatch({
      phase: 'observing',
      camera: { x: 52, y: 46, zoom: 1.02 },
      entities: {
        command: { ...COMMAND, label: 'COMMAND', status: 'live' },
        alpha: { ...ALPHA_START, label: 'ALPHA', status: 'live' },
        bravo: { ...BRAVO_APPROACHING, label: 'BRAVO', status: 'live' },
        charlie: { ...CHARLIE_START, label: 'CHARLIE', status: 'live' },
      },
    });

    await sleep(4000);
    if (!isCurrent(myRun)) return;

    // ---------------------------------------------------------------------
    // NORMAL RADIO CHECK-IN (5-8s)
    // Radio: "Command, Bravo. Approaching the gorge now."
    // ---------------------------------------------------------------------
    await playScenarioTrack('bravoApproaching', myRun);
    if (!isCurrent(myRun)) return;
    await sleep(1500);
    if (!isCurrent(myRun)) return;

    // ---------------------------------------------------------------------
    // BEAT 2: COMMUNICATION DEGRADATION
    // Bravo enters terrain shadow zone. RF degrades visually and audibly.
    // ---------------------------------------------------------------------
    dispatch({
      entities: {
        command: { ...COMMAND, label: 'COMMAND', status: 'live' },
        alpha: { ...ALPHA_START, label: 'ALPHA', status: 'live' },
        bravo: { ...BRAVO_GORGE_EDGE, label: 'BRAVO', status: 'degraded' },
        charlie: { ...CHARLIE_START, label: 'CHARLIE', status: 'live' },
      },
      commLines: {
        alpha: 'live',
        bravo: 'degraded',
        charlie: 'live',
      },
      camera: { x: 62, y: 28, zoom: 1.25 },
    });

    await sleep(1200);
    if (!isCurrent(myRun)) return;

    // Radio: Signal cuts out
    // "Command... Bravo... signal's getting weak..."
    await playScenarioTrack('bravoDegrading', myRun);
    if (!isCurrent(myRun)) return;

    // Final static squelch as RF carrier drops
    voiceEngine.playSound('squelch');

    // ---------------------------------------------------------------------
    // BEAT 3: INFORMATION LOSS & SILENCE
    // Comm line disappears. Bravo marker transitions to Last Known Position (LKP).
    // Subtle uncertainty area appears.
    // Trainee experiences genuine silence to observe and absorb.
    // ---------------------------------------------------------------------
    dispatch({
      entities: {
        command: { ...COMMAND, label: 'COMMAND', status: 'live' },
        alpha: { ...ALPHA_START, label: 'ALPHA', status: 'live' },
        bravo: { ...BRAVO_GORGE_EDGE, label: 'BRAVO (LKP)', status: 'lost' },
        charlie: { ...CHARLIE_START, label: 'CHARLIE', status: 'live' },
      },
      commLines: {
        alpha: 'live',
        bravo: 'none',
        charlie: 'live',
      },
      showUncertainty: true,
      uncertaintyTarget: { ...BRAVO_GORGE_EDGE, radius: 7 },
      camera: { x: 60, y: 32, zoom: 1.15 },
    });

    // Deliberate tactical silence — do NOT immediately rush or talk
    await sleep(4000);
    if (!isCurrent(myRun)) return;

    // ---------------------------------------------------------------------
    // BEAT 4: DELAYED REPORT ARRIVES
    // Trainee learns: "I have information, but I don't know if it is current."
    // ---------------------------------------------------------------------
    voiceEngine.playSound('alert');
    dispatch({
      delayedReport: {
        source: 'OBSERVER POST 2',
        latency: '3 MIN LATENCY',
        text: 'Bravo was last observed moving north through the gorge pass.',
      },
      camera: { x: 55, y: 38, zoom: 1.08 },
    });

    await sleep(3500);
    if (!isCurrent(myRun)) return;

    // ---------------------------------------------------------------------
    // BEAT 5: DECISION FRAMING
    // Context-first framing:
    // "BRAVO HAS BEEN OUT OF CONTACT."
    // "You need to decide how to respond."
    // ---------------------------------------------------------------------
    dispatch({
      phase: 'deciding',
      camera: { x: 50, y: 46, zoom: 1.0 },
      decision: {
        situation: 'BRAVO HAS BEEN OUT OF CONTACT',
        prompt: 'You need to decide how to respond.',
        options: [
          {
            id: 'hold',
            key: '1',
            title: 'Maintain current position',
            desc: "Hold Alpha and wait for Bravo's next scheduled check-in.",
          },
          {
            id: 'relay',
            key: '2',
            title: 'Redirect Alpha',
            desc: 'Move Alpha to the ridge to attempt to establish contact.',
          },
          {
            id: 'recall',
            key: '3',
            title: 'Recall Bravo',
            desc: 'Order Bravo back toward its last confirmed position.',
          },
        ],
      },
    });

    // Instructor voice introduces the decision naturally
    await playScenarioTrack('decisionPrompt', myRun);
    if (!isCurrent(myRun)) return;
  }

  // -----------------------------------------------------------------------
  // HANDLE DECISION — Observable world consequences & real trade-offs
  // -----------------------------------------------------------------------
  async function handleDecision(optionId) {
    runId++;
    sleepTimers.forEach((t) => clearTimeout(t));
    sleepTimers = [];
    const myRun = runId;

    // Immediately silence any active audio (e.g. decisionPrompt)
    scenarioAudioController.stop();
    voiceEngine.stop();

    dispatch({
      phase: 'consequence',
      decision: null,
      subtitle: null,
      delayedReport: null,
      isSpeaking: false,
    });

    if (optionId === 'relay') {
      // -------------------------------------------------------------------
      // CONSEQUENCE: REDIRECT ALPHA
      // Alpha physically moves to northern ridge overlook.
      // Line-of-sight relay links Command -> Alpha -> Bravo.
      // Bravo restores contact.
      // Trade-off: Alpha is pinned in relay duty and unavailable elsewhere.
      // -------------------------------------------------------------------
      dispatch({
        camera: { x: 48, y: 40, zoom: 1.15 },
        entities: {
          command: { ...COMMAND, label: 'COMMAND', status: 'live' },
          alpha: { x: 44, y: 46, label: 'ALPHA (MOVING)', status: 'live' },
          bravo: { ...BRAVO_GORGE_EDGE, label: 'BRAVO (LKP)', status: 'lost' },
          charlie: { ...CHARLIE_START, label: 'CHARLIE', status: 'live' },
        },
      });

      await sleep(2200);
      if (!isCurrent(myRun)) return;

      // Alpha reaches the high ridge position
      const ALPHA_RIDGE = { x: 50, y: 34 };
      dispatch({
        camera: { x: 55, y: 30, zoom: 1.2 },
        entities: {
          command: { ...COMMAND, label: 'COMMAND', status: 'live' },
          alpha: { ...ALPHA_RIDGE, label: 'ALPHA (RELAY)', status: 'live' },
          bravo: { ...BRAVO_INSIDE, label: 'BRAVO', status: 'live' },
          charlie: { ...CHARLIE_START, label: 'CHARLIE', status: 'live' },
        },
        commLines: {
          alpha: 'live',
          bravo: 'relay',
          charlie: 'live',
        },
        isRelayActive: true,
        showUncertainty: false,
      });

      await sleep(1000);
      if (!isCurrent(myRun)) return;

      // Radio: Bravo speaks via relay
      // "Command, Bravo via Alpha relay. We have you. Rockfall in the gorge, rerouting along the eastern rim."
      await playScenarioTrack('relayBravo', myRun);
      if (!isCurrent(myRun)) return;

      await sleep(1000);
      if (!isCurrent(myRun)) return;

      // Instructor debrief
      // "Communication restored. But Alpha is now committed to the ridge and cannot support elsewhere."
      await playScenarioTrack('relayInstructor', myRun);
      if (!isCurrent(myRun)) return;

      dispatch({
        consequence: {
          status: 'pass',
          statusBadge: '✓ PASSED — OPTIMAL TACTICAL DECISION',
          headline: 'CONTACT RESTORED VIA ALPHA RELAY',
          choiceMade: 'Option 2: Redirect Alpha to Ridge',
          detail: 'Alpha established an elevated relay point along the high ridge, bridging line-of-sight to Bravo in the gorge corridor. Bravo reported rockfall obstruction and rerouted safely.',
          tradeoff: 'Tactical link restored — but Alpha is now locked in relay posture on the ridge and cannot support secondary objectives.',
          explanation: 'Why this succeeded: When teams enter deep terrain gorges, VHF/UHF radio waves cannot penetrate rock masses. Rather than waiting passively or retreating, you leveraged an elevated intermediate team (Alpha) as an RF relay without risking units inside the gorge.',
          recommended: 'Ideal Tactical Principle: In non-line-of-sight environments, elevated relays bridge communications with zero casualty risk. Always leverage high ground before assuming the worst.',
        },
      });

    } else if (optionId === 'hold') {
      // -------------------------------------------------------------------
      // CONSEQUENCE: MAINTAIN POSITION
      // Alpha stays put. Bravo remains silent.
      // Storm front rolls in over northern gorge.
      // Scheduled window expires without contact.
      // Trade-off: Alpha preserved, but total loss of Bravo awareness.
      // -------------------------------------------------------------------
      dispatch({
        camera: { x: 64, y: 26, zoom: 1.18 },
        weatherIntensity: 0.65,
      });

      await sleep(2500);
      if (!isCurrent(myRun)) return;

      // Expand uncertainty ellipse as time elapses
      dispatch({
        uncertaintyTarget: { ...BRAVO_GORGE_EDGE, radius: 12 },
        weatherIntensity: 0.85,
      });

      await sleep(1200);
      if (!isCurrent(myRun)) return;

      // System notification: check-in window elapsed
      // "Scheduled check-in window elapsed. No transmission received from Bravo."
      await playScenarioTrack('holdSystem', myRun);
      if (!isCurrent(myRun)) return;

      await sleep(1000);
      if (!isCurrent(myRun)) return;

      // Instructor debrief
      // "Bravo did not check in. Uncertainty has grown. A storm front is closing the northern pass."
      await playScenarioTrack('holdInstructor', myRun);
      if (!isCurrent(myRun)) return;

      dispatch({
        consequence: {
          status: 'fail',
          statusBadge: '✕ FAILED — CRITICAL LOSS OF CONTACT',
          headline: 'CHECK-IN WINDOW EXPIRED — UNIT ISOLATED',
          choiceMade: 'Option 1: Maintain Current Position (Hold)',
          detail: 'No transmission was received during the scheduled window. The northern storm front has closed over the gorge corridor, leaving Bravo stranded in communication darkness.',
          tradeoff: 'Alpha remained stationary at the southern ridge — but Command is now completely blind to Bravo while sector conditions critically deteriorate.',
          explanation: 'Why this failed: You were deceived by the delayed radio report and assumed the radio silence was temporary. In reality, terrain obstruction was absolute. Passive waiting allowed the weather window to close, turning an RF deadzone into a mission failure.',
          recommended: 'Correct Decision: Option 2 (Redirect Alpha to Ridge). When terrain shadowing occurs, active measures like establishing a high-ground relay must be taken immediately before the operational window closes.',
        },
      });

    } else if (optionId === 'recall') {
      // -------------------------------------------------------------------
      // CONSEQUENCE: RECALL BRAVO
      // Command broadcasts emergency recall on wideband.
      // Bravo reverses heading and pulls back out of the gorge corridor.
      // Contact restored at entrance.
      // Trade-off: Team safe, but reconnaissance abandoned and time lost.
      // -------------------------------------------------------------------
      voiceEngine.playSound('squelch');
      dispatch({
        camera: { x: 62, y: 30, zoom: 1.2 },
      });

      await sleep(1800);
      if (!isCurrent(myRun)) return;

      // Bravo turns back toward the gorge edge
      const BRAVO_RECALLED = { x: 58, y: 34 };
      dispatch({
        entities: {
          command: { ...COMMAND, label: 'COMMAND', status: 'live' },
          alpha: { ...ALPHA_START, label: 'ALPHA', status: 'live' },
          bravo: { ...BRAVO_RECALLED, label: 'BRAVO (RETURNING)', status: 'degraded' },
          charlie: { ...CHARLIE_START, label: 'CHARLIE', status: 'live' },
        },
        commLines: {
          alpha: 'live',
          bravo: 'degraded',
          charlie: 'live',
        },
        showUncertainty: false,
      });

      await sleep(1000);
      if (!isCurrent(myRun)) return;

      // Radio: Bravo acknowledges recall
      // "Command... Bravo... received recall order... turning back to last known point."
      await playScenarioTrack('recallBravo', myRun);
      if (!isCurrent(myRun)) return;

      await sleep(1000);
      if (!isCurrent(myRun)) return;

      // Instructor debrief
      // "Bravo is pulling back. Contact partially restored, but operational time is lost and the objective is abandoned."
      await playScenarioTrack('recallInstructor', myRun);
      if (!isCurrent(myRun)) return;

      dispatch({
        consequence: {
          status: 'suboptimal',
          statusBadge: '⚠ SUB-OPTIMAL — OBJECTIVE ABANDONED',
          headline: 'BRAVO RECALLED — RECONNAISSANCE FAILED',
          choiceMade: 'Option 3: Recall Bravo',
          detail: 'Bravo acknowledged the wideband recall broadcast and reversed course out of the gorge corridor, re-establishing intermittent radio contact at the entrance.',
          tradeoff: 'Team preserved from isolation — but reconnaissance intelligence was completely abandoned and operational tempo was forfeited.',
          explanation: 'Why this was sub-optimal: Calling an immediate retreat was an overreaction to expected RF attenuation in a gorge. Signal degradation alone does not mean the team is in immediate jeopardy if adjacent units can provide line-of-sight relay.',
          recommended: 'Better Decision: Option 2 (Redirect Alpha to Ridge). Test communications through an elevated relay first. Only recall teams if relay attempts fail or confirmed hostile/environmental threats emerge.',
        },
      });
    }
  }

  // -----------------------------------------------------------------------
  // CLEANUP
  // -----------------------------------------------------------------------
  function cleanup() {
    destroyed = true;
    runId++;
    sleepTimers.forEach((t) => clearTimeout(t));
    sleepTimers = [];
    scenarioAudioController.stop();
  }

  return { start, handleDecision, cleanup };
}
