/**
 * ScenarioAudioController.js
 * 
 * Clean audio abstraction separating scenario dialogue orchestration
 * from the low-level VoiceEngine playback mechanics.
 * 
 * Maps each trainer briefing beat and tactical radio report to high-fidelity
 * neural voice tracks in /audio/exercise-01/.
 */

import { voiceEngine } from './VoiceEngine.js';

export const SCENARIO_TRACKS = {
  briefing1: {
    speaker: 'Instructor',
    channel: 'instructor',
    text: 'You are coordinating three field teams operating across Sector Seven.',
    audioUrl: '/audio/exercise-01/briefing_1.mp3',
  },
  briefing2: {
    speaker: 'Instructor',
    channel: 'instructor',
    text: 'Alpha is holding the southern ridge. Bravo is moving toward the northern gorge.',
    audioUrl: '/audio/exercise-01/briefing_2.mp3',
  },
  briefing3: {
    speaker: 'Instructor',
    channel: 'instructor',
    text: 'Communication is currently stable, and all three teams are reporting normally.',
    audioUrl: '/audio/exercise-01/briefing_3.mp3',
  },
  briefing4a: {
    speaker: 'Instructor',
    channel: 'instructor',
    text: 'Your task is to maintain coordination as conditions change.',
    audioUrl: '/audio/exercise-01/briefing_4a.mp3',
  },
  briefing4b: {
    speaker: 'Instructor',
    channel: 'instructor',
    text: 'Do not assume that the latest information is always the most reliable.',
    audioUrl: '/audio/exercise-01/briefing_4b.mp3',
  },
  briefing5: {
    speaker: 'Instructor',
    channel: 'instructor',
    text: 'Watch the teams, listen to their reports, and pay attention when information becomes uncertain.',
    audioUrl: '/audio/exercise-01/briefing_5.mp3',
  },
  briefing6: {
    speaker: 'Instructor',
    channel: 'instructor',
    text: 'Exercise begins now.',
    audioUrl: '/audio/exercise-01/briefing_6.mp3',
  },
  bravoApproaching: {
    speaker: 'Bravo',
    channel: 'radio',
    text: 'Command, Bravo. Approaching the gorge now.',
    audioUrl: '/audio/exercise-01/bravo_approaching.mp3',
  },
  bravoDegrading: {
    speaker: 'Bravo',
    channel: 'radio',
    text: "Command... Bravo... signal's getting weak...",
    audioUrl: '/audio/exercise-01/bravo_degrading.mp3',
  },
  decisionPrompt: {
    speaker: 'Instructor',
    channel: 'instructor',
    text: 'Bravo has been out of contact. You need to decide how to respond.',
    audioUrl: '/audio/exercise-01/decision_prompt.mp3',
  },
  holdSystem: {
    speaker: 'System',
    channel: 'system',
    text: 'Scheduled check-in window elapsed. No transmission received from Bravo.',
    audioUrl: '/audio/exercise-01/hold_system.mp3',
  },
  holdInstructor: {
    speaker: 'Instructor',
    channel: 'instructor',
    text: 'Bravo did not check in. Uncertainty has grown. A storm front is closing the northern pass.',
    audioUrl: '/audio/exercise-01/hold_instructor.mp3',
  },
  relayBravo: {
    speaker: 'Bravo',
    channel: 'radio',
    text: 'Command, Bravo via Alpha relay. We have you. Rockfall in the gorge, rerouting along the eastern rim.',
    audioUrl: '/audio/exercise-01/relay_bravo.mp3',
  },
  relayInstructor: {
    speaker: 'Instructor',
    channel: 'instructor',
    text: 'Communication restored. But Alpha is now committed to the ridge and cannot support elsewhere.',
    audioUrl: '/audio/exercise-01/relay_instructor.mp3',
  },
  recallBravo: {
    speaker: 'Bravo',
    channel: 'radio',
    text: 'Command... Bravo... received recall order... turning back to last known point.',
    audioUrl: '/audio/exercise-01/recall_bravo.mp3',
  },
  recallInstructor: {
    speaker: 'Instructor',
    channel: 'instructor',
    text: 'Bravo is pulling back. Contact partially restored, but operational time is lost and the objective is abandoned.',
    audioUrl: '/audio/exercise-01/recall_instructor.mp3',
  },
};

class ScenarioAudioController {
  /**
   * Play a registered scenario track by its semantic ID
   * @param {string} trackId
   * @param {function} [onSubtitle] - callback to update subtitle UI
   * @returns {Promise<void>}
   */
  async play(trackId, onSubtitle) {
    const track = SCENARIO_TRACKS[trackId];
    if (!track) {
      console.warn(`[ScenarioAudioController] Unknown track ID: ${trackId}`);
      return;
    }

    if (onSubtitle) {
      onSubtitle({ speaker: track.speaker, text: track.text });
    }

    await voiceEngine.transmit({
      speaker: track.speaker,
      text: track.text,
      channel: track.channel,
      audioUrl: track.audioUrl,
    });

    if (onSubtitle) {
      onSubtitle(null);
    }
  }

  /**
   * Stop any active audio transmission immediately
   */
  stop() {
    voiceEngine.stop();
  }

  /**
   * Procedural audio sound effects
   */
  playSfx(type) {
    voiceEngine.playSound(type);
  }
}

export const scenarioAudioController = new ScenarioAudioController();
