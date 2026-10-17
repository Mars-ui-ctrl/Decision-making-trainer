import { useState } from 'react';
import './SituationPanel.css';

export default function SituationPanel({
  situation = {},
  currentStep = 1,
  totalSteps = 6,
  lastConsequence = null,
  teachingGuidance = null,
  trainingMode = 'guided',
}) {
  const [showGuidance, setShowGuidance] = useState(true);

  const {
    headline = 'Operational Update Pending',
    narrative = 'Stand by for synchronized scenario feed.',
    criticalInfo = '',
    reliabilityLevel = 'NORMAL',
    title = '',
  } = situation;

  const getReliabilityBadge = (level) => {
    switch (level) {
      case 'HIGH':
      case 'VERIFIED':
        return 'badge--beginner';
      case 'MODERATE':
        return 'badge--info';
      case 'CONFLICTING':
      case 'LOW / TIME-CRITICAL':
        return 'badge--warning';
      case 'DEGRADED':
      case 'UNKNOWN':
      default:
        return 'badge--advanced';
    }
  };

  return (
    <div className="situation-panel">
      {/* Header bar with step tracker & reliability */}
      <div className="situation-panel__header">
        <div className="situation-panel__header-left">
          <span className="situation-panel__label">CURRENT SITUATION</span>
          <span className="situation-panel__step">
            STEP {currentStep} OF {totalSteps}
          </span>
          {title && <span className="situation-panel__step-title">— {title}</span>}
        </div>
        <div className="situation-panel__header-right">
          <span className="situation-panel__rel-label">DATA RELIABILITY:</span>
          <span className={`badge ${getReliabilityBadge(reliabilityLevel)}`}>
            {reliabilityLevel}
          </span>
        </div>
      </div>

      <div className="situation-panel__content">
        {/* Consequence of Previous Decision ("WHAT HAPPENED") */}
        {lastConsequence && (
          <div className="situation-panel__consequence" role="status">
            <div className="situation-panel__consequence-header">
              <span className="situation-panel__consequence-tag">WHAT HAPPENED</span>
              <span className="situation-panel__consequence-choice">
                You chose: <strong>Option {lastConsequence.chosenLabel}</strong> ({lastConsequence.chosenTitle})
              </span>
            </div>

            <p className="situation-panel__consequence-text">
              {lastConsequence.text}
            </p>

            {lastConsequence.teachingTakeaway && (
              <div className="situation-panel__consequence-lesson">
                <span className="situation-panel__lesson-label">OPERATIONAL TAKEAWAY:</span>{' '}
                {lastConsequence.teachingTakeaway}
              </div>
            )}
          </div>
        )}

        {/* Guided Training Teaching Insight */}
        {teachingGuidance && trainingMode === 'guided' && (
          <div className="situation-panel__guidance">
            <div className="situation-panel__guidance-top">
              <div className="situation-panel__guidance-title-row">
                <span className="situation-panel__guidance-badge">LEARNING POINT</span>
                <span className="situation-panel__guidance-concept">
                  {teachingGuidance.concept}
                </span>
              </div>
              <button
                type="button"
                className="situation-panel__guidance-toggle"
                onClick={() => setShowGuidance(!showGuidance)}
              >
                {showGuidance ? 'Hide Tip' : 'Show Tip'}
              </button>
            </div>

            {showGuidance && (
              <div className="situation-panel__guidance-body">
                <p className="situation-panel__guidance-insight">
                  {teachingGuidance.insight}
                </p>
                {teachingGuidance.rule && (
                  <div className="situation-panel__guidance-rule">
                    <strong>Rule:</strong> {teachingGuidance.rule}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Current Tactical Event Headline */}
        <h3 className="situation-panel__headline">{headline}</h3>

        {/* Operational Narrative */}
        <p className="situation-panel__narrative">{narrative}</p>

        {/* Critical Constraint */}
        {criticalInfo && (
          <div className="situation-panel__critical">
            <span className="situation-panel__critical-icon">!</span>
            <div className="situation-panel__critical-text">
              <strong>OPERATIONAL CONSTRAINT:</strong> {criticalInfo}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
