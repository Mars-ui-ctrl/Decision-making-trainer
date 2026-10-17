import React from 'react';
import './CommStatusPanel.css';

export default function CommStatusPanel({ entities = {} }) {
  const getBadgeClass = (status) => {
    switch (status) {
      case 'live':
        return 'badge--beginner';
      case 'delayed':
        return 'badge--intermediate';
      case 'limited':
      case 'degraded':
        return 'badge--intermediate';
      case 'lost':
      case 'unknown':
      default:
        return 'badge--advanced';
    }
  };

  const getDotClass = (status) => {
    switch (status) {
      case 'live':
        return 'status-dot--live';
      case 'delayed':
        return 'status-dot--delayed';
      case 'limited':
      case 'degraded':
        return 'status-dot--degraded';
      case 'lost':
      case 'unknown':
      default:
        return 'status-dot--lost';
    }
  };

  const formatUpdateText = (unit) => {
    const isLost = unit.commStatus === 'lost' || unit.commStatus === 'unknown';
    const sec = unit.lastUpdateSec ?? 0;
    if (isLost) {
      return `Last confirmed: ${sec}s ago`;
    }
    return `Last update: ${sec}s ago`;
  };

  return (
    <div className="comm-panel">
      <div className="comm-panel__header">
        <h2 className="comm-panel__title">COMMUNICATION STATUS</h2>
        <span className="comm-panel__badge">3 CHANNELS</span>
      </div>

      <div className="comm-panel__list">
        {Object.values(entities).map(unit => {
          const isLost = unit.commStatus === 'lost' || unit.commStatus === 'unknown';
          const isDelayed = unit.commStatus === 'delayed';

          return (
            <div
              key={unit.id}
              className={`comm-panel__item ${isLost ? 'comm-panel__item--lost' : ''}`}
            >
              <div className="comm-panel__item-top">
                <div className="comm-panel__item-name-group">
                  <span className={`status-dot ${getDotClass(unit.commStatus)}`} />
                  <span className="comm-panel__item-name">{unit.name}</span>
                  <span className="comm-panel__item-role">[{unit.role}]</span>
                </div>
                <span className={`badge ${getBadgeClass(unit.commStatus)}`}>
                  {unit.commStatus.toUpperCase()}
                </span>
              </div>

              <div className="comm-panel__item-meta">
                <span className="comm-panel__item-time">{formatUpdateText(unit)}</span>
                <span className="comm-panel__item-signal">
                  {unit.commStatus === 'live' && 'VHF Datalink — 98% quality'}
                  {unit.commStatus === 'delayed' && 'Latency buffer active — 4800 baud'}
                  {unit.commStatus === 'limited' && 'Narrowband ping only — 12% SNR'}
                  {isLost && 'CARRIER SIGNAL UNREACHABLE'}
                </span>
              </div>

              {unit.notes && (
                <div className="comm-panel__item-notes">
                  {unit.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
