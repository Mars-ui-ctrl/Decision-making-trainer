/**
 * VoiceEngine.js
 * Professional tactical voice transmission system.
 *
 * Implements:
 * 1. Synchronous user-gesture audio unlocking (AudioContext & HTML5 Audio)
 * 2. Hardware-accelerated HTML5 Audio playback for pre-rendered MP3 tracks
 * 3. Base64 audio playback for server-synthesized Neural TTS (/api/tts)
 * 4. Procedural tactical radio squelch & alert sound effects
 * 5. Sequential non-overlapping playback with session invalidation
 * 6. High-fidelity browser speech synthesis fallback
 */

class VoiceEngine {
  constructor() {
    // Default to true — ensure audio is active
    this.isAudioEnabled = true;
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('decisim_audio_enabled');
      if (stored === 'false') {
        this.isAudioEnabled = false;
      }
    }

    this.audioCtx = null;
    this.isSpeaking = false;
    this.currentSpeaker = null;
    this.currentText = '';
    this.listeners = new Set();
    this.audioCache = new Map();
    this.activeSource = null;
    this.activeAudio = null;
    this.availableVoices = [];
    this.playbackCounter = 0;
    this.isUnlocked = false;

    this.unlockAudio = this.unlockAudio.bind(this);
    this._initAudioContext = this._initAudioContext.bind(this);

    if (typeof window !== 'undefined') {
      window.addEventListener('click', this.unlockAudio, { once: false });
      window.addEventListener('keydown', this.unlockAudio, { once: false });

      if (window.speechSynthesis) {
        this.availableVoices = window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          this.availableVoices = window.speechSynthesis.getVoices();
        };
      }
    }
  }

  /**
   * Explicitly unlock both Web Audio API & HTML5 Audio from a user gesture
   */
  unlockAudio() {
    this._initAudioContext();

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    if (!this.isUnlocked) {
      this.isUnlocked = true;
      // Play a tiny silent buffer to warm up the audio hardware
      try {
        if (this.audioCtx) {
          const buf = this.audioCtx.createBuffer(1, 1, 22050);
          const src = this.audioCtx.createBufferSource();
          src.buffer = buf;
          src.connect(this.audioCtx.destination);
          src.start(0);
        }
      } catch {}

      // Warm up HTML5 Audio
      try {
        const silent = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        silent.volume = 0.01;
        silent.play().catch(() => {});
      } catch {}
    }
  }

  _initAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = {
      isAudioEnabled: this.isAudioEnabled,
      isSpeaking: this.isSpeaking,
      currentSpeaker: this.currentSpeaker,
      currentText: this.currentText,
    };
    this.listeners.forEach(fn => fn(state));
  }

  setAudioEnabled(enabled) {
    this.isAudioEnabled = enabled;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('decisim_audio_enabled', enabled ? 'true' : 'false');
    }
    if (enabled) {
      this.unlockAudio();
      this.playSound('alert');
    } else {
      this.stop();
    }
    this.notify();
  }

  /**
   * Procedural audio sound effects
   */
  playSound(type = 'squelch') {
    if (!this.isAudioEnabled) return;
    this.unlockAudio();
    if (!this.audioCtx) return;

    try {
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (type === 'squelch') {
        const bufferSize = Math.floor(ctx.sampleRate * 0.07);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 3.5;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
      } else if (type === 'alert') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.06);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.14);
      }
    } catch {
      // AudioContext error suppressed
    }
  }

  /**
   * Transmit spoken audio message.
   * Returns a Promise that resolves ONLY when the speech has completely finished.
   */
  transmit({ speaker = 'RADIO', text = '', channel = 'radio', audioUrl = null, onEnd = null }) {
    return new Promise((resolve) => {
      (async () => {
        // Stop any currently playing audio BEFORE generating the new sessionId
        this.stop();
        const sessionId = ++this.playbackCounter;

        this.currentSpeaker = speaker;
        this.currentText = text;
        this.notify();

        if (!this.isAudioEnabled || !text) {
          if (onEnd) onEnd();
          return resolve();
        }

        this.unlockAudio();

        if (channel === 'radio') {
          this.playSound('squelch');
        } else if (channel === 'system') {
          this.playSound('alert');
        }

        let isCompleted = false;
        const completeTransmission = () => {
          if (isCompleted) return;
          isCompleted = true;
          if (sessionId === this.playbackCounter) {
            this.isSpeaking = false;
            this.activeAudio = null;
            if (channel === 'radio') {
              this.playSound('squelch');
            }
            this.notify();
          }
          if (onEnd) onEnd();
          resolve();
        };

        // Safety fallback timeout to ensure timeline never permanently locks
        const estDuration = Math.max(4500, Math.ceil(text.length * 90) + 1500);
        const safetyTimer = setTimeout(() => {
          if (sessionId === this.playbackCounter && !isCompleted) {
            console.warn('[VoiceEngine] Safety timeout reached for:', text.slice(0, 35));
            completeTransmission();
          }
        }, estDuration);

        // ---------------------------------------------------------------------
        // Strategy A: Direct HTML5 Audio playback for local pre-rendered audio
        // ---------------------------------------------------------------------
        if (audioUrl) {
          try {
            const audio = new Audio(audioUrl);
            audio.volume = 1.0;
            this.activeAudio = audio;

            audio.onended = () => {
              clearTimeout(safetyTimer);
              completeTransmission();
            };

            audio.onerror = (e) => {
              console.warn('[VoiceEngine] Local audio file error for:', audioUrl, e);
              this.activeAudio = null;
              clearTimeout(safetyTimer);
              // Fallback to browser speech synthesis
              if (sessionId === this.playbackCounter && !isCompleted) {
                this._speakBrowserFallback({
                  text,
                  channel,
                  speaker,
                  sessionId,
                  onComplete: () => {
                    completeTransmission();
                  },
                });
              } else {
                completeTransmission();
              }
            };

            this.isSpeaking = true;
            this.notify();
            await audio.play();
            return; // Playing via HTML5 Audio, completion handled in onended/onerror
          } catch (audioErr) {
            console.warn('[VoiceEngine] HTML5 Audio play error:', audioErr.message);
            this.activeAudio = null;
          }
        }

        // ---------------------------------------------------------------------
        // Strategy B: Server-side Neural TTS endpoint (/api/tts)
        // ---------------------------------------------------------------------
        let voiceName = 'Charon';
        if (speaker.includes('Bravo') || channel === 'radio') {
          voiceName = 'Puck';
        } else if (channel === 'instructor') {
          voiceName = 'Charon';
        }

        try {
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              voiceName,
              channel,
            }),
          });

          if (sessionId !== this.playbackCounter) {
            clearTimeout(safetyTimer);
            return resolve();
          }

          if (res.ok) {
            const data = await res.json();
            if (data.audioContent && !data.simulated) {
              const mime = data.audioContent.startsWith('UklGR') ? 'audio/wav' : 'audio/mp3';
              const audioDataUri = `data:${mime};base64,${data.audioContent}`;
              const audio = new Audio(audioDataUri);
              audio.volume = 1.0;
              this.activeAudio = audio;

              audio.onended = () => {
                clearTimeout(safetyTimer);
                completeTransmission();
              };

              audio.onerror = () => {
                this.activeAudio = null;
                clearTimeout(safetyTimer);
                completeTransmission();
              };

              this.isSpeaking = true;
              this.notify();
              await audio.play();
              return;
            }
          }
        } catch (err) {
          console.warn('[VoiceEngine] API TTS error:', err.message);
        }

        // ---------------------------------------------------------------------
        // Strategy C: Browser Speech Synthesis Fallback
        // ---------------------------------------------------------------------
        if (sessionId !== this.playbackCounter) {
          clearTimeout(safetyTimer);
          return resolve();
        }

        this._speakBrowserFallback({
          text,
          channel,
          speaker,
          sessionId,
          onComplete: () => {
            clearTimeout(safetyTimer);
            completeTransmission();
          },
        });
      })();
    });
  }

  _speakBrowserFallback({ text, channel, speaker, sessionId, onComplete }) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (onComplete) onComplete();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    if (channel === 'instructor') {
      utterance.rate = 0.92;
      utterance.pitch = 0.95;
    } else if (channel === 'radio') {
      utterance.rate = 1.02;
      utterance.pitch = speaker.includes('Bravo') ? 0.9 : 1.0;
    } else {
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
    }

    const voices = this.availableVoices.length > 0 ? this.availableVoices : window.speechSynthesis.getVoices();
    let bestVoice = null;

    if (channel === 'instructor') {
      bestVoice =
        voices.find(v => v.lang.startsWith('en') && (v.name.includes('Guy') || v.name.includes('Christopher') || v.name.includes('David') || v.name.includes('Natural'))) ||
        voices.find(v => v.lang.startsWith('en'));
    } else {
      bestVoice =
        voices.find(v => v.lang.startsWith('en') && (v.name.includes('Mark') || v.name.includes('George') || v.name.includes('Male'))) ||
        voices.find(v => v.lang.startsWith('en'));
    }

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    this.isSpeaking = true;
    this.notify();

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (sessionId === this.playbackCounter) {
        this.isSpeaking = false;
        if (channel === 'radio') {
          this.playSound('squelch');
        }
        this.notify();
      }
      if (onComplete) onComplete();
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    window.speechSynthesis.speak(utterance);
  }

  stop() {
    this.playbackCounter++;
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
        this.activeAudio.onended = null;
        this.activeAudio.onerror = null;
        this.activeAudio.src = '';
      } catch {}
      this.activeAudio = null;
    }
    if (this.activeSource) {
      try {
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch {}
      this.activeSource = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.notify();
  }
}

export const voiceEngine = new VoiceEngine();
