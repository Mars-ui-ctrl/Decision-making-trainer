/**
 * ImmersionScene.jsx
 *
 * Professional Decision-Making Trainer — Exercise 01: Communication Familiarization
 *
 * Architectural & Design Principles:
 * - 85% TACTICAL WORLD, 15% MINIMAL HUD
 * - Trainee learns by WATCHING & LISTENING before deciding
 * - Natural neural TTS drives scenario beats before decisions appear
 * - Uncertainty expressed through Last Known Position & uncertainty perimeter
 * - Consequence unfolds visually in the world with observable trade-offs
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { createImmersionTimeline } from './ImmersionTimeline.js';
import { scenarioAudioController } from '../audio/ScenarioAudioController.js';
import { voiceEngine } from '../audio/VoiceEngine.js';
import './ImmersionScene.css';

export default function ImmersionScene({ onExit, onComplete: _onComplete }) {
  const [started, setStarted] = useState(false);
  const [world, setWorld] = useState({
    phase: 'ready', // ready | briefing | observing | deciding | consequence
    camera: { x: 50, y: 50, zoom: 1 },
    entities: {},
    commLines: {},
    subtitle: null,
    decision: null,
    weatherIntensity: 0.15,
    showUncertainty: false,
    uncertaintyTarget: null,
    delayedReport: null,
    consequence: null,
    isSpeaking: false,
    isRelayActive: false,
  });

  const timelineRef = useRef(null);
  const svgRef = useRef(null);
  const viewBoxRef = useRef({ x: -40, y: 0, w: 180, h: 100 });
  const entityRefs = useRef({});

  // Timeline dispatch merges partial state patches
  const dispatch = useCallback((patch) => {
    setWorld((prev) => ({ ...prev, ...patch }));
  }, []);

  // Initialize timeline
  useEffect(() => {
    const tl = createImmersionTimeline(dispatch);
    timelineRef.current = tl;
    return () => tl.cleanup();
  }, [dispatch]);

  // GSAP Camera Smooth Zoom and Pan with responsive aspect ratio
  useEffect(() => {
    if (!svgRef.current) return;

    const updateCamera = () => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const aspect =
        rect.width && rect.height
          ? rect.width / rect.height
          : window.innerWidth / Math.max(1, window.innerHeight);

      const cam = world.camera;
      const zoom = Math.max(0.6, Math.min(2.5, cam.zoom || 1));

      // Calculate viewBox dimensions matching viewport aspect ratio
      // Guaranteeing 100% of vertical sector space (0-100) is visible without any cropping
      const h = 100 / zoom;
      const w = h * Math.max(1, aspect);

      const x = cam.x - w / 2;
      const y = cam.y - h / 2;

      gsap.to(viewBoxRef.current, {
        x,
        y,
        w,
        h,
        duration: 1.8,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (svgRef.current) {
            const v = viewBoxRef.current;
            svgRef.current.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`);
          }
        },
      });
    };

    updateCamera();
    window.addEventListener('resize', updateCamera);
    return () => window.removeEventListener('resize', updateCamera);
  }, [world.camera]);

  // GSAP Entity Position Interpolation
  useEffect(() => {
    Object.entries(world.entities).forEach(([id, entity]) => {
      const el = entityRefs.current[id];
      if (el && entity.x != null && entity.y != null) {
        gsap.to(el, {
          attr: { transform: `translate(${entity.x}, ${entity.y})` },
          duration: 2.2,
          ease: 'power2.out',
        });
      }
    });
  }, [world.entities]);

  const [isAudioOn, setIsAudioOn] = useState(voiceEngine.isAudioEnabled);

  // Subscribe to VoiceEngine audio state
  useEffect(() => {
    return voiceEngine.subscribe((state) => {
      setIsAudioOn(state.isAudioEnabled);
    });
  }, []);

  const handleDecision = useCallback((optionId) => {
    if (world.phase !== 'deciding') return;
    // Silence audio immediately so previous speech does not collapse with consequence audio
    scenarioAudioController.stop();
    voiceEngine.stop();
    if (timelineRef.current) {
      timelineRef.current.handleDecision(optionId);
    }
  }, [world.phase]);

  // Keyboard Shortcuts (1, 2, 3) for Decision
  useEffect(() => {
    if (!world.decision || world.phase !== 'deciding') return;
    const handler = (e) => {
      const opt = world.decision.options.find((o) => o.key === e.key);
      if (opt) {
        handleDecision(opt.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [world.decision, world.phase, handleDecision]);

  // Handlers
  const handleStart = useCallback(() => {
    // 1. Immediately and synchronously unlock browser audio
    voiceEngine.unlockAudio();
    voiceEngine.playSound('alert');
    setStarted(true);
    if (timelineRef.current) {
      timelineRef.current.start();
    }
  }, []);

  const handleToggleAudio = useCallback(() => {
    voiceEngine.setAudioEnabled(!isAudioOn);
  }, [isAudioOn]);

  const handleRestart = useCallback(() => {
    scenarioAudioController.stop();
    voiceEngine.stop();
    voiceEngine.unlockAudio();
    if (timelineRef.current) {
      timelineRef.current.start();
    }
  }, []);

  const handleExit = useCallback(() => {
    scenarioAudioController.stop();
    voiceEngine.stop();
    if (timelineRef.current) {
      timelineRef.current.cleanup();
    }
    if (onExit) onExit();
  }, [onExit]);

  // Visual helper tokens
  const getCommColor = (status) => {
    switch (status) {
      case 'live':
        return 'rgba(74, 222, 128, 0.65)';
      case 'degraded':
        return 'rgba(251, 191, 36, 0.55)';
      default:
        return 'transparent';
    }
  };

  const {
    entities,
    commLines,
    subtitle,
    decision,
    consequence,
    delayedReport,
    showUncertainty,
    uncertaintyTarget,
    weatherIntensity,
    isRelayActive,
    highlightedUnit,
  } = world;

  // Derive worst signal status from commLines for signal strength indicator
  const signalStatus = (() => {
    const statuses = Object.values(commLines);
    if (statuses.includes('none') || statuses.includes('lost')) return 'lost';
    if (statuses.includes('degraded')) return 'degraded';
    return 'strong';
  })();

  const commandPos = entities.command || { x: 12, y: 78 };
  const alphaPos = entities.alpha || { x: 30, y: 62 };
  const bravoPos = entities.bravo || { x: 45, y: 52 };

  return (
    <div className="immersion">
      {/* Scanline CRT overlay */}
      <div className="immersion__scanline" />

      {/* ================================================================= */}
      {/* 1. MINIMAL OBJECTIVE INDICATOR (Trainer Introduction)             */}
      {/* ================================================================= */}
      <div className="immersion__hud-objective">
        <div className="immersion__hud-badge">TRAINING EXERCISE 01</div>
        <div className="immersion__hud-title">COMMUNICATION FAMILIARIZATION</div>
        <div className="immersion__hud-sub">
          <span className="immersion__hud-sublabel">TRAINING OBJECTIVE: </span>
          <span className="immersion__hud-subtext">
            Maintain coordination when communication becomes unreliable.
          </span>
        </div>
      </div>

      {/* Top right controls */}
      <div className="immersion__top-controls">
        <button
          className={`immersion__audio-toggle ${isAudioOn ? 'is-active' : 'is-muted'}`}
          onClick={handleToggleAudio}
          title={isAudioOn ? 'Audio active (Click to mute)' : 'Audio muted (Click to unmute)'}
        >
          <span className="immersion__audio-icon">{isAudioOn ? '🔊' : '🔇'}</span>
          <span>{isAudioOn ? 'AUDIO ON' : 'AUDIO OFF'}</span>
          {world.isSpeaking && isAudioOn && <span className="immersion__audio-pulse" />}
        </button>

        <button className="immersion__exit" onClick={handleExit} title="Exit simulation">
          EXIT
        </button>
      </div>

      {/* ================================================================= */}
      {/* SIGNAL STRENGTH INDICATOR — top-center popup on degradation       */}
      {/* ================================================================= */}
      {started && signalStatus !== 'strong' && (
        <div className={`immersion__signal-indicator is-${signalStatus}`} key={signalStatus}>
          <span className="immersion__signal-dot" />
          <span className="immersion__signal-bars">
            <span className={`immersion__signal-bar is-bar-1 ${signalStatus !== 'strong' ? 'is-active' : ''}`} />
            <span className={`immersion__signal-bar is-bar-2 ${signalStatus === 'degraded' ? 'is-active' : ''}`} />
            <span className="immersion__signal-bar is-bar-3" />
            <span className={`immersion__signal-bar is-bar-4`} />
          </span>
          <span className="immersion__signal-label">
            {signalStatus === 'degraded' ? 'WEAK SIGNAL' : 'SIGNAL LOST'}
          </span>
          {signalStatus === 'lost' && (
            <span className="immersion__signal-unit">BRAVO — NO CONTACT</span>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* SVG TACTICAL WORLD — The full viewport screen                     */}
      {/* ================================================================= */}
      <div className="immersion__world">
        <svg
          ref={svgRef}
          viewBox="-40 0 180 100"
          className="immersion__svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Terrain gradient */}
            <linearGradient id="terrainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#141a24" />
              <stop offset="50%" stopColor="#1a2533" />
              <stop offset="100%" stopColor="#121820" />
            </linearGradient>

            {/* Mountain mass */}
            <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#243342" />
              <stop offset="100%" stopColor="#1a2533" />
            </linearGradient>

            {/* ── ELEVATION ZONE GRADIENTS ── */}
            <linearGradient id="elevLowland" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="rgba(22, 78, 56, 0.18)" />
              <stop offset="100%" stopColor="rgba(22, 78, 56, 0.05)" />
            </linearGradient>
            <linearGradient id="elevMidland" x1="0%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="rgba(120, 113, 80, 0.14)" />
              <stop offset="100%" stopColor="rgba(120, 113, 80, 0.04)" />
            </linearGradient>
            <linearGradient id="elevHighland" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(148, 130, 100, 0.16)" />
              <stop offset="100%" stopColor="rgba(100, 90, 75, 0.06)" />
            </linearGradient>

            {/* ── RIVER WATER GRADIENT ── */}
            <linearGradient id="riverWater" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(56, 145, 190, 0.22)" />
              <stop offset="50%" stopColor="rgba(40, 120, 160, 0.15)" />
              <stop offset="100%" stopColor="rgba(30, 100, 140, 0.08)" />
            </linearGradient>
            <linearGradient id="riverBank" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(80, 70, 55, 0.20)" />
              <stop offset="100%" stopColor="rgba(60, 55, 45, 0.08)" />
            </linearGradient>

            {/* ── CONTOUR LINE FILTER (subtle emboss) ── */}
            <filter id="contourSoftness" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="0.06" />
            </filter>

            {/* RF Shadow Zone radial gradient */}
            <radialGradient id="shadowZone" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(239, 68, 68, 0.09)" />
              <stop offset="60%" stopColor="rgba(239, 68, 68, 0.03)" />
              <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
            </radialGradient>

            {/* Uncertainty zone radial gradient */}
            <radialGradient id="uncertaintyGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(251, 191, 36, 0.08)" />
              <stop offset="70%" stopColor="rgba(251, 191, 36, 0.03)" />
              <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
            </radialGradient>

            {/* Tactical coordinate grid */}
            <pattern id="gridPattern" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.1" />
            </pattern>

            {/* Comm glow filter */}
            <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.25" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glowCyan" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.25" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background and grid — extended for all widescreen viewports */}
          <rect x="-100" y="-50" width="300" height="200" fill="url(#terrainGrad)" />
          <rect x="-100" y="-50" width="300" height="200" fill="url(#gridPattern)" />

          {/* ============================================================= */}
          {/* TOPOGRAPHIC TERRAIN LAYER — Elevation, Contours, Riverbed      */}
          {/* ============================================================= */}

          {/* ── ELEVATION ZONES (subtle shaded polygons) ── */}
          {/* Lowland basin — south/southwest where Command HQ sits */}
          <path
            d="M -50 100 L -50 72 Q -20 68, 0 70 Q 15 72, 28 68 Q 35 66, 42 70 L 42 100 Z"
            fill="url(#elevLowland)"
          />
          {/* Midland plateau — central operational area */}
          <path
            d="M -30 72 Q -10 62, 10 60 Q 25 58, 35 55 Q 42 52, 50 48 L 50 65 Q 35 68, 20 70 Q 5 72, -10 70 Z"
            fill="url(#elevMidland)"
          />
          {/* Highland ridge zone — northeast mountains */}
          <path
            d="M 42 52 Q 50 42, 58 34 Q 65 26, 72 20 Q 80 14, 90 10 L 100 8 L 100 45 Q 85 48, 70 46 Q 58 48, 48 50 Z"
            fill="url(#elevHighland)"
          />

          {/* ── CONTOUR LINES — 5 elevation levels ── */}
          {/* Contour Level 1 — 200m (lowland perimeter) */}
          <path
            d="M -40 82 Q -15 76, 5 78 Q 20 80, 35 76 Q 48 73, 55 72"
            fill="none"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="0.2"
            filter="url(#contourSoftness)"
          />
          {/* Contour Level 2 — 400m */}
          <path
            d="M -35 72 Q -10 65, 8 66 Q 22 68, 32 64 Q 42 60, 52 58"
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="0.2"
            filter="url(#contourSoftness)"
          />
          {/* Contour Level 3 — 600m (mid-elevation) */}
          <path
            d="M -20 65 Q 0 58, 15 56 Q 28 54, 38 50 Q 46 46, 54 42 Q 60 38, 62 35"
            fill="none"
            stroke="rgba(255,255,255,0.11)"
            strokeWidth="0.2"
            filter="url(#contourSoftness)"
          />
          {/* Contour Level 4 — 800m */}
          <path
            d="M 20 52 Q 32 46, 42 40 Q 50 34, 58 28 Q 65 22, 72 16"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.2"
            filter="url(#contourSoftness)"
          />
          {/* Contour Level 5 — 1000m (summit ridge) */}
          <path
            d="M 55 32 Q 62 26, 68 20 Q 74 14, 82 10 Q 88 7, 95 5"
            fill="none"
            stroke="rgba(255,255,255,0.13)"
            strokeWidth="0.2"
            filter="url(#contourSoftness)"
          />

          {/* ── ELEVATION LABELS (subtle topo markers) ── */}
          <text x="-25" y="80" fill="rgba(255,255,255,0.14)" fontSize="1.0" fontFamily="monospace">200m</text>
          <text x="-5" y="67" fill="rgba(255,255,255,0.14)" fontSize="1.0" fontFamily="monospace">400m</text>
          <text x="18" y="55" fill="rgba(255,255,255,0.14)" fontSize="1.0" fontFamily="monospace">600m</text>
          <text x="40" y="42" fill="rgba(255,255,255,0.14)" fontSize="1.0" fontFamily="monospace">800m</text>
          <text x="62" y="24" fill="rgba(255,255,255,0.14)" fontSize="1.0" fontFamily="monospace">1000m</text>

          {/* ── GLACIAL RIVERBED — winding through the northern gorge ── */}
          {/* River banks (wider, darker path underneath) */}
          <path
            d="M -30 15 Q -18 18, -8 22 Q 2 28, 12 30 Q 22 32, 30 28 Q 38 24, 45 18 Q 52 12, 58 8 Q 62 5, 68 3"
            fill="none"
            stroke="rgba(80, 70, 55, 0.18)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* River water (main channel) */}
          <path
            d="M -30 15 Q -18 18, -8 22 Q 2 28, 12 30 Q 22 32, 30 28 Q 38 24, 45 18 Q 52 12, 58 8 Q 62 5, 68 3"
            fill="none"
            stroke="rgba(56, 145, 190, 0.18)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* River center highlight (glacial blue shimmer) */}
          <path
            d="M -30 15 Q -18 18, -8 22 Q 2 28, 12 30 Q 22 32, 30 28 Q 38 24, 45 18 Q 52 12, 58 8 Q 62 5, 68 3"
            fill="none"
            stroke="rgba(100, 180, 220, 0.12)"
            strokeWidth="0.6"
            strokeLinecap="round"
            className="immersion__river-shimmer"
          />
          {/* River delta/fork near gorge entry */}
          <path
            d="M 45 18 Q 50 20, 55 24 Q 58 27, 60 30"
            fill="none"
            stroke="rgba(56, 145, 190, 0.12)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          {/* River label */}
          <text
            x="8"
            y="24"
            fill="rgba(100, 180, 220, 0.25)"
            fontSize="1.1"
            fontFamily="monospace"
            letterSpacing="0.12em"
            transform="rotate(-12, 8, 24)"
          >
            GLACIAL RUNOFF
          </text>

          {/* ── ROCKY TERRAIN HASH MARKS (scree / talus slopes) ── */}
          <g opacity="0.08" stroke="rgba(255,255,255,1)" strokeWidth="0.14">
            {/* Eastern ridge scree */}
            <line x1="60" y1="35" x2="61" y2="36" />
            <line x1="63" y1="32" x2="64" y2="33.5" />
            <line x1="66" y1="29" x2="67.5" y2="30" />
            <line x1="70" y1="25" x2="71" y2="26.5" />
            <line x1="74" y1="21" x2="75.5" y2="22" />
            <line x1="78" y1="17" x2="79" y2="18.5" />
            <line x1="82" y1="13" x2="83.5" y2="14" />
            {/* Western slope scree */}
            <line x1="48" y1="45" x2="49" y2="46.5" />
            <line x1="50" y1="42" x2="51.5" y2="43" />
            <line x1="53" y1="38" x2="54" y2="39.5" />
            <line x1="56" y1="33" x2="57.5" y2="34" />
          </g>

          {/* ── TERRAIN ZONE LABEL ── */}
          <text
            x="-15"
            y="90"
            fill="rgba(255,255,255,0.12)"
            fontSize="1.2"
            fontFamily="monospace"
            letterSpacing="0.1em"
          >
            LOWLAND BASIN — ELEV 180-280m
          </text>
          <text
            x="25"
            y="58"
            fill="rgba(255,255,255,0.10)"
            fontSize="1.0"
            fontFamily="monospace"
            letterSpacing="0.08em"
          >
            MIDLAND PLATEAU
          </text>

          {/* Topography: Ridge & basin */}
          <path
            d="M -50 100 L -50 65 Q 15 55, 30 60 Q 40 58, 42 55 L 42 100 Z"
            fill="rgba(255,255,255,0.02)"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.2"
          />

          {/* Eastern ridge mass */}
          <path
            d="M 38 55 Q 48 40, 55 35 Q 62 28, 68 22 Q 75 15, 85 10 L 100 10 L 100 50 Q 80 55, 65 50 Q 55 48, 45 52 Z"
            fill="url(#mountainGrad)"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.2"
          />

          {/* Mountain peak contour contours */}
          <path d="M 55 35 Q 60 30, 65 25" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.15" />
          <path d="M 60 32 Q 65 27, 72 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.15" />
          <path d="M 68 25 Q 75 18, 82 14" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.15" />

          {/* The Gorge Corridor — carved through high terrain */}
          <path
            d="M 55 42 Q 63 32, 68 22 Q 73 14, 82 10"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M 55 42 Q 63 32, 68 22 Q 73 14, 82 10"
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.3"
            strokeDasharray="1 1"
          />

          {/* Terrain label */}
          <text
            x="76"
            y="28"
            fill="rgba(255,255,255,0.18)"
            fontSize="1.3"
            fontFamily="monospace"
            letterSpacing="0.08em"
          >
            NORTHERN GORGE CORRIDOR
          </text>

          {/* RF Shadow Zone in Gorge */}
          <ellipse
            cx="70"
            cy="18"
            rx="14"
            ry="10"
            fill="url(#shadowZone)"
            stroke="rgba(239, 68, 68, 0.12)"
            strokeWidth="0.2"
            strokeDasharray="0.8 0.6"
          />
          <text
            x="70"
            y="9"
            textAnchor="middle"
            fill="rgba(239, 68, 68, 0.22)"
            fontSize="1.4"
            fontFamily="monospace"
            fontWeight="600"
            letterSpacing="0.08em"
          >
            RF TERRAIN OBSTRUCTION ZONE
          </text>

          {/* Weather front drifting overlay */}
          <g className="immersion__weather-layer" opacity={weatherIntensity}>
            <path
              d={`M 45 0 Q ${65 + weatherIntensity * 15} ${5 + weatherIntensity * 25}, 100 ${15 + weatherIntensity * 30} L 100 0 Z`}
              fill="rgba(148, 163, 184, 0.14)"
            />
            <path
              d={`M 45 0 Q ${65 + weatherIntensity * 15} ${5 + weatherIntensity * 25}, 100 ${15 + weatherIntensity * 30}`}
              fill="none"
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="0.3"
              strokeDasharray="1 0.8"
            />
          </g>

          {/* Reconnaissance Route Path (subtle dashed guideline) */}
          <polyline
            points="30,62 45,52 56,38 63,28 72,18 85,10"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.2"
            strokeDasharray="1 1"
          />

          {/* =============================================================== */}
          {/* COMMUNICATION LINES                                             */}
          {/* Note: Disappears cleanly when lost (no giant red X)             */}
          {/* =============================================================== */}
          {Object.entries(commLines).map(([unitId, status]) => {
            if (unitId === 'command' || status === 'lost' || status === 'none' || status === 'relay') return null;
            const unit = entities[unitId];
            if (!unit) return null;

            return (
              <line
                key={`comm-${unitId}`}
                x1={commandPos.x}
                y1={commandPos.y}
                x2={unit.x}
                y2={unit.y}
                stroke={getCommColor(status)}
                strokeWidth={status === 'degraded' ? '0.18' : '0.22'}
                strokeDasharray={status === 'degraded' ? '0.6 0.6' : 'none'}
                className={status === 'degraded' ? 'immersion__comm-degraded' : ''}
                filter={status === 'live' ? 'url(#glowGreen)' : 'none'}
              />
            );
          })}

          {/* RELAY COMMUNICATION LINK (Command -> Alpha -> Bravo) */}
          {isRelayActive && (
            <g key="comm-relay-link">
              {/* HQ to Alpha */}
              <line
                x1={commandPos.x}
                y1={commandPos.y}
                x2={alphaPos.x}
                y2={alphaPos.y}
                stroke="#38bdf8"
                strokeWidth="0.25"
                filter="url(#glowCyan)"
              />
              {/* Alpha Relay to Bravo */}
              <line
                x1={alphaPos.x}
                y1={alphaPos.y}
                x2={bravoPos.x}
                y2={bravoPos.y}
                stroke="#38bdf8"
                strokeWidth="0.22"
                strokeDasharray="1 0.5"
                filter="url(#glowCyan)"
              />
            </g>
          )}

          {/* =============================================================== */}
          {/* 7. UNCERTAINTY AREA & LAST KNOWN POSITION (LKP)                 */}
          {/* =============================================================== */}
          {showUncertainty && uncertaintyTarget && (
            <g key="uncertainty-zone">
              {/* Expanding uncertainty perimeter */}
              <ellipse
                cx={uncertaintyTarget.x}
                cy={uncertaintyTarget.y}
                rx={uncertaintyTarget.radius || 7}
                ry={(uncertaintyTarget.radius || 7) * 0.75}
                fill="url(#uncertaintyGrad)"
                stroke="rgba(251, 191, 36, 0.3)"
                strokeWidth="0.2"
                strokeDasharray="0.8 0.6"
                className="immersion__uncertainty-ring"
              />
              <text
                x={uncertaintyTarget.x}
                y={uncertaintyTarget.y - (uncertaintyTarget.radius || 7) * 0.75 - 1.2}
                textAnchor="middle"
                fill="rgba(251, 191, 36, 0.45)"
                fontSize="1.1"
                fontFamily="monospace"
                letterSpacing="0.08em"
              >
                POSITION UNCERTAINTY AREA
              </text>
            </g>
          )}

          {/* =============================================================== */}
          {/* UNIT TOKENS                                                     */}
          {/* =============================================================== */}
          {Object.entries(entities).map(([id, unit]) => {
            const isCommand = id === 'command';
            const isLost = unit.status === 'lost';
            const isDegraded = unit.status === 'degraded';
            const r = isCommand ? 2.5 : 1.8;

            let tokenColor = '#4ade80';
            if (isCommand) tokenColor = '#38bdf8';
            else if (isLost) tokenColor = '#fbbf24'; // Last known amber
            else if (isDegraded) tokenColor = '#fbbf24';

            return (
              <g
                key={id}
                ref={(el) => (entityRefs.current[id] = el)}
                transform={`translate(${unit.x}, ${unit.y})`}
              >
                {/* Live pulse for active units */}
                {unit.status === 'live' && !isCommand && (
                  <circle r="3" fill="rgba(74, 222, 128, 0.15)" className="immersion__live-pulse" />
                )}

                {/* Subtle trainer focus ring when unit is referenced */}
                {highlightedUnit === id && (
                  <circle
                    r={r + 1.8}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="0.25"
                    strokeDasharray="0.6 0.4"
                    className="immersion__highlight-pulse"
                  />
                )}

                {/* Base circle token */}
                <circle
                  r={r}
                  fill={isLost ? 'rgba(30, 41, 59, 0.4)' : '#1e293b'}
                  stroke={tokenColor}
                  strokeWidth={isCommand ? '0.4' : '0.3'}
                  strokeDasharray={isLost ? '0.6 0.4' : 'none'}
                />

                {/* Inner Icon / Glyph */}
                <text
                  y={isCommand ? 0.7 : 0.6}
                  textAnchor="middle"
                  fill={isLost ? '#fbbf24' : '#ffffff'}
                  fontSize={isCommand ? '1.5' : '1.1'}
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  {isCommand ? 'HQ' : isLost ? 'LKP' : unit.label?.charAt(0) || id.charAt(0).toUpperCase()}
                </text>

                {/* Name Label */}
                <text
                  y={r + 2.2}
                  textAnchor="middle"
                  fill={isLost ? '#fbbf24' : 'rgba(255, 255, 255, 0.45)'}
                  fontSize="1.1"
                  fontFamily="monospace"
                  fontWeight="600"
                  letterSpacing="0.06em"
                >
                  {isLost ? 'BRAVO [LAST KNOWN]' : unit.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ================================================================= */}
      {/* INITIALIZATION OVERLAY (Audio Context unlock & Welcome)           */}
      {/* ================================================================= */}
      {!started && (
        <div className="immersion__start-overlay">
          <div className="immersion__start-card">
            <div className="immersion__start-badge">DECISION-MAKING TRAINER</div>
            <div className="immersion__start-title">Exercise 01: Northern Gorge Reconnaissance</div>
            <div className="immersion__start-objective">
              Maintain coordination when communication becomes unreliable.
            </div>
            <div className="immersion__start-instructions">
              Listen to the instructor briefing and observe tactical unit movement across Sector Seven.
            </div>
            <button className="immersion__start-btn" onClick={handleStart} autoFocus>
              ▶ INITIALIZE EXERCISE (ENABLE AUDIO)
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 6. DELAYED REPORT (Information Event)                             */}
      {/* ================================================================= */}
      {delayedReport && (
        <div className="immersion__delayed-report">
          <div className="immersion__delayed-header">
            <span className="immersion__delayed-indicator" />
            <span className="immersion__delayed-tag">DELAYED REPORT</span>
            <span className="immersion__delayed-latency">{delayedReport.latency}</span>
          </div>
          <div className="immersion__delayed-source">{delayedReport.source}</div>
          <div className="immersion__delayed-text">"{delayedReport.text}"</div>
        </div>
      )}

      {/* ================================================================= */}
      {/* RADIO SUBTITLES & AUDIO DISPLAY                                   */}
      {/* ================================================================= */}
      {subtitle && (
        <div className="immersion__subtitle-area">
          <div className="immersion__subtitle" key={subtitle.text}>
            <div className="immersion__subtitle-speaker">
              <span className={`immersion__speaker-dot ${subtitle.speaker.toLowerCase()}`} />
              {subtitle.speaker}
            </div>
            <div className="immersion__subtitle-text">{subtitle.text}</div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 8. DECISION PROMPT (Framed by Situation, not an exam question)    */}
      {/* ================================================================= */}
      {decision && (
        <div className="immersion__decision">
          <div className="immersion__decision-situation">{decision.situation}</div>
          <div className="immersion__decision-prompt">{decision.prompt}</div>
          <div className="immersion__decision-options">
            {decision.options.map((opt) => (
              <button
                key={opt.id}
                className="immersion__option"
                onClick={() => handleDecision(opt.id)}
              >
                <div className="immersion__option-key">{opt.key}</div>
                <div className="immersion__option-content">
                  <div className="immersion__option-title">{opt.title}</div>
                  <div className="immersion__option-desc">{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 9 & 10. OBSERVABLE CONSEQUENCE, TACTICAL ANALYSIS & RECOMMENDATION */}
      {/* ================================================================= */}
      {consequence && (
        <div className={`immersion__consequence ${consequence.status ? `is-${consequence.status}` : ''}`}>
          <div className="immersion__consequence-header-row">
            <div className="immersion__consequence-tag">DEBRIEF & CONSEQUENCE</div>
            {consequence.statusBadge && (
              <div className={`immersion__consequence-badge is-${consequence.status}`}>
                {consequence.statusBadge}
              </div>
            )}
          </div>

          <div className="immersion__consequence-headline">{consequence.headline}</div>

          {consequence.choiceMade && (
            <div className="immersion__consequence-choice">
              <span className="immersion__consequence-choice-label">YOUR DECISION: </span>
              <span className="immersion__consequence-choice-val">{consequence.choiceMade}</span>
            </div>
          )}

          <div className="immersion__consequence-detail">{consequence.detail}</div>

          {consequence.tradeoff && (
            <div className="immersion__consequence-tradeoff-box">
              <div className="immersion__consequence-tradeoff-label">OPERATIONAL TRADE-OFF</div>
              <div className="immersion__consequence-tradeoff-text">{consequence.tradeoff}</div>
            </div>
          )}

          {consequence.explanation && (
            <div className="immersion__consequence-explanation-box">
              <div className="immersion__consequence-explanation-label">
                {consequence.status === 'pass' ? 'TACTICAL ANALYSIS (WHY THIS SUCCEEDED)' : 'TACTICAL ANALYSIS (WHY THIS WAS WRONG / SUB-OPTIMAL)'}
              </div>
              <div className="immersion__consequence-explanation-text">{consequence.explanation}</div>
            </div>
          )}

          {consequence.recommended && (
            <div className="immersion__consequence-recommended-box">
              <div className="immersion__consequence-recommended-label">
                RECOMMENDED DOCTRINE / WHAT ANSWER SHOULD BE THERE
              </div>
              <div className="immersion__consequence-recommended-text">{consequence.recommended}</div>
            </div>
          )}

          <div className="immersion__consequence-actions">
            <button className="immersion__btn-replay" onClick={handleRestart}>
              RETRY EXERCISE
            </button>
            <button className="immersion__btn-exit" onClick={handleExit}>
              EXIT EXERCISE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
