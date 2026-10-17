import { useState, useEffect } from 'react';
import { voiceEngine } from '../audio/VoiceEngine';
import './RadioStrip.css';

export default function RadioStrip({ transmission = null }) {
  const [voiceState, setVoiceState] = useState({
    isAudioEnabled: voiceEngine.isAudioEnabled,
    isSpeaking: false,
    currentSpeaker: null,
    currentText: '',
  });

  useEffect(() => {
    const unsub = voiceEngine.subscribe(setVoiceState);
    return unsub;
  }, []);

  const speaker = voiceState.currentSpeaker || transmission?.speaker || 'NET CONTROL';
  const text = voiceState.currentText || transmission?.text || 'All units synchronized. Monitoring tactical frequency.';
  const channel = transmission?.channel || 'radio';

  const toggleAudio = () => {
    voiceEngine.setAudioEnabled(!voiceState.isAudioEnabled);
  };

  return (
    <div className={`radio-strip radio-strip--${channel}`}>
      <div className="radio-strip__left">
        <span className="radio-strip__indicator">
          {voiceState.isSpeaking ? (
            <span className="radio-strip__waveform">
              <span className="bar bar-1" />
              <span className="bar bar-2" />
              <span className="bar bar-3" />
              <span className="bar bar-4" />
            </span>
          ) : (
            <span className="radio-strip__mic-icon">📻</span>
          )}
        </span>
        <span className="radio-strip__speaker">{speaker}:</span>
      </div>

      <div className="radio-strip__message">
        <span className="radio-strip__text">"{text}"</span>
      </div>

      <div className="radio-strip__right">
        <button
          type="button"
          className={`radio-strip__audio-toggle ${voiceState.isAudioEnabled ? 'active' : ''}`}
          onClick={toggleAudio}
          title={voiceState.isAudioEnabled ? 'Disable tactical radio voice' : 'Enable tactical radio voice'}
        >
          {voiceState.isAudioEnabled ? '🔊 RADIO ON' : '🔇 AUDIO MUTED'}
        </button>
      </div>
    </div>
  );
}
