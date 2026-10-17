import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './TrainingMap.css';

export default function TrainingMap({
  entities = {},
  mapFeatures = {},
  activeRelay = null,
  obstacle = null,
  weatherIntensity = 0.2,
  cameraFocus = null,
  onUnitSelect = null,
}) {
  const svgRef = useRef(null);
  const viewBoxRef = useRef({ x: 0, y: 0, w: 800, h: 440 });
  const unitElementsRef = useRef({});

  // 1. Smooth GSAP camera pan/zoom when cameraFocus changes
  useEffect(() => {
    if (!svgRef.current) return;

    let targetX = 0;
    let targetY = 0;
    let targetW = 800;
    let targetH = 440;

    if (cameraFocus) {
      const zoom = cameraFocus.zoom || 1.15;
      targetW = 800 / zoom;
      targetH = 440 / zoom;
      targetX = Math.max(0, Math.min(800 - targetW, cameraFocus.x - targetW / 2));
      targetY = Math.max(0, Math.min(440 - targetH, cameraFocus.y - targetH / 2));
    }

    gsap.to(viewBoxRef.current, {
      x: targetX,
      y: targetY,
      w: targetW,
      h: targetH,
      duration: 1.6,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (svgRef.current) {
          const { x, y, w, h } = viewBoxRef.current;
          svgRef.current.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
        }
      },
    });
  }, [cameraFocus]);

  // 2. Smooth GSAP unit movement when coordinates update
  useEffect(() => {
    Object.entries(entities).forEach(([id, unit]) => {
      const el = unitElementsRef.current[id];
      if (el && unit.position) {
        gsap.to(el, {
          x: unit.position.x,
          y: unit.position.y,
          duration: 1.8,
          ease: 'power2.out',
        });
      }
    });
  }, [entities]);

  const commandBase = { x: 90, y: 350 };
  const { checkpoints = [], primaryRoute = [] } = mapFeatures;
  const routePoints = primaryRoute.map(p => `${p.x},${p.y}`).join(' ');

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return '#1b7a4b';
      case 'degraded':
      case 'delayed':
        return '#d97706';
      case 'lost':
      default:
        return '#b42318';
    }
  };

  return (
    <div className="sim-map">
      {/* Restrained Top Telemetry Strip */}
      <div className="sim-map__telemetry-bar">
        <div className="sim-map__brand">
          <span className="sim-map__radar-dot" />
          <span className="sim-map__theater-title">TACTICAL THEATER — SECTOR 7</span>
        </div>

        {/* Clean Status Badges for Alpha, Bravo, Charlie */}
        <div className="sim-map__unit-status-group">
          {Object.values(entities).map(unit => {
            const isLost = unit.commStatus === 'lost';
            const isDegraded = unit.commStatus === 'degraded';
            const color = getStatusColor(unit.commStatus);

            return (
              <div
                key={unit.id}
                className={`sim-map__status-pill sim-map__status-pill--${unit.commStatus}`}
                onClick={() => onUnitSelect && onUnitSelect(unit.id)}
              >
                <span className="sim-map__status-dot" style={{ backgroundColor: color }} />
                <span className="sim-map__status-name">{unit.name}</span>
                <span className="sim-map__status-state" style={{ color }}>
                  {isLost ? 'CARRIER LOST' : isDegraded ? `DEGRADED (${unit.lastUpdateSec}s)` : `LIVE (${unit.lastUpdateSec}s)`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Weather Indicator */}
        <div className="sim-map__weather-pill">
          <span className="sim-map__weather-icon">☁</span>
          <span>STORM FRONT: {Math.round(weatherIntensity * 100)}%</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="sim-map__viewport">
        <svg
          ref={svgRef}
          viewBox="0 0 800 440"
          className="sim-map__svg"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Simulation Tactical Map"
        >
          <defs>
            {/* Subtle Grid Pattern */}
            <pattern id="tacticalGrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" strokeWidth="0.75" strokeDasharray="3 3" />
            </pattern>

            {/* Drop Shadow for Units */}
            <filter id="unitShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.15" />
            </filter>

            {/* Soft Shadow Hatch Pattern */}
            <pattern id="shadowHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="1" opacity="0.4" />
            </pattern>
          </defs>

          {/* Background Map Base */}
          <rect width="800" height="440" fill="#f8fafc" />
          <rect width="800" height="440" fill="url(#tacticalGrid)" opacity="0.8" />

          {/* Clean Soft Topographical Regions */}
          {/* Southern Ridge Contour */}
          <path
            d="M 280 440 Q 360 310 460 330 T 650 440 Z"
            fill="#edf2f7"
            stroke="#cbd5e1"
            strokeWidth="1"
          />

          {/* Eastern Bluff & Northern Gorge Terrain Mass */}
          <path
            d="M 320 280 C 370 210, 440 220, 490 180 C 530 150, 500 50, 680 40 L 790 40 L 790 280 C 690 320, 560 310, 490 280 Z"
            fill="#e2e8f0"
            stroke="#cbd5e1"
            strokeWidth="1.2"
          />

          {/* The Gorge Cut Corridor (Natural Chokepoint) */}
          <path
            d="M 470 190 Q 530 160 570 110 T 670 70"
            fill="none"
            stroke="#f8fafc"
            strokeWidth="38"
            strokeLinecap="round"
          />
          <path
            d="M 470 190 Q 530 160 570 110 T 670 70"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* RF Shadow Zone Inside the Gorge */}
          <g className="sim-map__rf-shadow">
            <rect
              x="490"
              y="65"
              width="170"
              height="95"
              rx="8"
              fill="url(#shadowHatch)"
              stroke="#94a3b8"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            <text
              x="575"
              y="85"
              textAnchor="middle"
              fill="#475569"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fontWeight="700"
              letterSpacing="0.05em"
            >
              ▲ NORTHERN GORGE (RF SHADOW)
            </text>
          </g>

          {/* Primary Route Guideline */}
          {routePoints && (
            <polyline
              points={routePoints}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="6 5"
              opacity="0.65"
            />
          )}

          {/* Waypoints / Checkpoints */}
          {checkpoints.map(cp => (
            <g key={cp.id} className="sim-map__checkpoint">
              <circle cx={cp.x} cy={cp.y} r="3" fill="#64748b" />
              <circle cx={cp.x} cy={cp.y} r="6" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
              <text
                x={cp.x}
                y={cp.y + 14}
                textAnchor="middle"
                fill="#64748b"
                fontSize="8"
                fontFamily="var(--font-mono)"
                fontWeight="600"
              >
                {cp.name}
              </text>
            </g>
          ))}

          {/* Dynamic Weather Front Overlay */}
          <g className="sim-map__weather-front">
            <path
              d={`M 400 0 Q ${600 + weatherIntensity * 50} ${80 + weatherIntensity * 140} 800 ${110 + weatherIntensity * 160} L 800 0 Z`}
              fill="rgba(100, 116, 139, 0.16)"
            />
            <path
              d={`M 400 0 Q ${600 + weatherIntensity * 50} ${80 + weatherIntensity * 140} 800 ${110 + weatherIntensity * 160}`}
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity="0.8"
            />
            <text
              x="660"
              y={30 + weatherIntensity * 60}
              fill="#475569"
              fontSize="8"
              fontFamily="var(--font-mono)"
              fontWeight="700"
            >
              STORM FRONT ENVELOPE
            </text>
          </g>

          {/* Rockfall Obstacle (Discovered in Phase 2) */}
          {obstacle && (
            <g className="sim-map__obstacle" transform={`translate(${obstacle.x}, ${obstacle.y})`}>
              <polygon points="0,-12 11,8 -11,8" fill="#dc2626" />
              <text y="3" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="700">!</text>
              <rect x="-44" y="11" width="88" height="15" fill="#fef2f2" stroke="#fca5a5" rx="3" />
              <text y="22" textAnchor="middle" fill="#b91c1c" fontSize="7.5" fontFamily="var(--font-mono)" fontWeight="700">
                ROCKFALL OBSTACLE
              </text>
            </g>
          )}

          {/* Command HQ Base */}
          <g className="sim-map__hq" transform={`translate(${commandBase.x}, ${commandBase.y})`}>
            <circle r="16" fill="#1e293b" />
            <text y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="var(--font-mono)" fontWeight="700">HQ</text>
            <text y="24" textAnchor="middle" fill="#1e293b" fontSize="8.5" fontFamily="var(--font-mono)" fontWeight="700">
              COMMAND BASE
            </text>
          </g>

          {/* Communication Datalink Rays */}
          {Object.values(entities).map(unit => {
            const pos = unit.position || { x: 100, y: 100 };
            const isLost = unit.commStatus === 'lost';
            const isDegraded = unit.commStatus === 'degraded';
            const color = getStatusColor(unit.commStatus);

            if (isLost) {
              // Severed Link: drawn only partially to gorge boundary with break marker
              const midX = (commandBase.x + pos.x) * 0.58;
              const midY = (commandBase.y + pos.y) * 0.58;
              return (
                <g key={`link-${unit.id}`} className="sim-map__ray--severed">
                  <line
                    x1={commandBase.x}
                    y1={commandBase.y}
                    x2={midX}
                    y2={midY}
                    stroke="#b42318"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.6"
                  />
                  {/* Break cross indicator */}
                  <line x1={midX - 5} y1={midY - 5} x2={midX + 5} y2={midY + 5} stroke="#b42318" strokeWidth="2.5" />
                  <line x1={midX - 5} y1={midY + 5} x2={midX + 5} y2={midY - 5} stroke="#b42318" strokeWidth="2.5" />
                </g>
              );
            }

            return (
              <line
                key={`link-${unit.id}`}
                x1={commandBase.x}
                y1={commandBase.y}
                x2={pos.x}
                y2={pos.y}
                stroke={color}
                strokeWidth={isDegraded ? '1.5' : '2'}
                strokeDasharray={isDegraded ? '5 4' : 'none'}
                opacity={isDegraded ? '0.6' : '0.8'}
                className={isDegraded ? 'sim-map__ray--flicker' : 'sim-map__ray--stable'}
              />
            );
          })}

          {/* Active Tactical Relay Link (Alpha bridging to Bravo) */}
          {activeRelay && entities[activeRelay.from] && entities[activeRelay.to] && (
            <g className="sim-map__relay-link">
              <line
                x1={entities[activeRelay.from].position.x}
                y1={entities[activeRelay.from].position.y}
                x2={entities[activeRelay.to].position.x}
                y2={entities[activeRelay.to].position.y}
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeDasharray="5 3"
                className="sim-map__relay-beam"
              />
              <rect
                x={(entities[activeRelay.from].position.x + entities[activeRelay.to].position.x) / 2 - 45}
                y={(entities[activeRelay.from].position.y + entities[activeRelay.to].position.y) / 2 - 16}
                width="90"
                height="15"
                fill="#f0f9ff"
                stroke="#0284c7"
                rx="3"
              />
              <text
                x={(entities[activeRelay.from].position.x + entities[activeRelay.to].position.x) / 2}
                y={(entities[activeRelay.from].position.y + entities[activeRelay.to].position.y) / 2 - 5}
                fill="#0369a1"
                fontSize="7.5"
                fontFamily="var(--font-mono)"
                fontWeight="700"
                textAnchor="middle"
              >
                TACTICAL RELAY LINK
              </text>
            </g>
          )}

          {/* Unit Tokens (Animated with GSAP) */}
          {Object.values(entities).map(unit => {
            const isLost = unit.commStatus === 'lost';
            const isDegraded = unit.commStatus === 'degraded';
            const color = getStatusColor(unit.commStatus);
            const pos = unit.position || { x: 100, y: 100 };
            const uncertainty = unit.uncertaintyRadius || (isLost ? 45 : 0);

            return (
              <g
                key={unit.id}
                ref={el => (unitElementsRef.current[unit.id] = el)}
                className={`sim-map__unit-group sim-map__unit--${unit.commStatus}`}
                transform={`translate(${pos.x}, ${pos.y})`}
                filter="url(#unitShadow)"
              >
                {/* Expanding Uncertainty Radius for Lost Unit */}
                {uncertainty > 0 && (
                  <g className="sim-map__uncertainty-container">
                    <circle
                      r={uncertainty}
                      fill="rgba(180, 35, 24, 0.08)"
                      stroke="#b42318"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      className="sim-map__uncertainty-ring"
                    />
                    <text
                      y={-uncertainty - 4}
                      textAnchor="middle"
                      fill="#b42318"
                      fontSize="7.5"
                      fontFamily="var(--font-mono)"
                      fontWeight="700"
                    >
                      UNCERTAINTY AREA (? RADIUS)
                    </text>
                  </g>
                )}

                {/* Subtle Pulse Halo for Live Unit */}
                {!isLost && !isDegraded && (
                  <circle r="18" fill="rgba(27, 122, 75, 0.12)" />
                )}

                {/* Degraded Pulse Ring */}
                {isDegraded && (
                  <circle
                    r="20"
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    className="sim-map__degraded-ring"
                  />
                )}

                {/* Core Token Circle */}
                <circle
                  r="13"
                  fill="#ffffff"
                  stroke={color}
                  strokeWidth="2.5"
                />

                {/* Unit Symbol / Letter */}
                <text
                  y="4.5"
                  textAnchor="middle"
                  fill="#0f172a"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  fontWeight="700"
                >
                  {isLost ? '?' : unit.name.charAt(0)}
                </text>

                {/* Minimal Label Below Token */}
                <text
                  y="22"
                  textAnchor="middle"
                  fill={isLost ? '#b42318' : '#334155'}
                  fontSize="8"
                  fontFamily="var(--font-mono)"
                  fontWeight="700"
                  letterSpacing="0.04em"
                >
                  {isLost ? `${unit.name} (LAST KNOWN)` : unit.name.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
