import { useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTraining } from '../context/TrainingContext';
import { getScenarioById } from '../data/scenarios';
import './AnalysisPage.css';

export default function AnalysisPage() {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, getLatestResult } = useTraining();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const currentScenarioId = scenarioId || 'scenario-01';
  const scenario = getScenarioById(currentScenarioId);
  const latestResult = getLatestResult(currentScenarioId);
  const history = latestResult?.history || [];
  const trainingMode = latestResult?.trainingMode || 'guided';

  const formatMs = (ms) => {
    if (ms == null) return '—';
    const sec = (ms / 1000).toFixed(1);
    return `${sec}s`;
  };

  // Derive qualitative training observations from trainee's actual decisions
  const observations = useMemo(() => {
    if (history.length === 0) return null;

    // Analyze Step 2: Telemetry latency handling
    const step2 = history.find(h => h.stepIndex === 2);
    let infoHandling = 'Recognized latency and prioritized active relay line-of-sight.';
    if (step2?.selectedOptionLabel === 'B') {
      infoHandling = 'Accepted latency and continued via dead-reckoning; kept speed high while accepting uncertainty.';
    } else if (step2?.selectedOptionLabel === 'C') {
      infoHandling = 'Prioritized permanent communication infrastructure over operational speed.';
    }

    // Analyze Step 3: Silence / Lost contact reaction
    const step3 = history.find(h => h.stepIndex === 3);
    let uncertaintyHandling = 'Positioned nearby element on high ground to re-establish line-of-sight without panic.';
    if (step3?.selectedOptionLabel === 'A') {
      uncertaintyHandling = 'Maintained strategic intent and trusted SOPs without diverting adjacent assets.';
    } else if (step3?.selectedOptionLabel === 'C') {
      uncertaintyHandling = 'Triggered full emergency halt; showed high caution, though static resulted in operational delay.';
    } else if (step3?.selectedOptionLabel === 'D') {
      uncertaintyHandling = 'Vectored support flank to reinforce; showed high solidarity but uncovered the eastern flank.';
    }

    // Analyze Step 4: Contradiction resolution
    const step4 = history.find(h => h.stepIndex === 4);
    let contradictionHandling = 'Prioritized real-time direct line-of-sight report over stale telemetric data.';
    if (step4?.selectedOptionLabel === 'B') {
      contradictionHandling = 'Sought redundant confirmation before acting, incurring daylight delay.';
    } else if (step4?.selectedOptionLabel === 'C') {
      contradictionHandling = 'Dispatched ground inspection to uncover definitive physical evidence on the ground.';
    }

    // Analyze Step 5: Time window & risk
    const step5 = history.find(h => h.stepIndex === 5);
    let timeManagement = 'Concentrated all forces at the extraction point to beat the weather front.';
    if (step5?.selectedOptionLabel === 'B') {
      timeManagement = 'Created a security buffer probe to verify the locator beacon before committing the main body.';
    } else if (step5?.selectedOptionLabel === 'C') {
      timeManagement = 'Chose safety harbor in place; prioritized physical security over mission timetable.';
    }

    return {
      infoHandling,
      uncertaintyHandling,
      contradictionHandling,
      timeManagement,
    };
  }, [history]);

  if (!isLoggedIn) return null;

  return (
    <div className="analysis-page page--with-header">
      <div className="container">
        {/* Navigation Breadcrumb */}
        <div className="analysis-page__header">
          <div className="analysis-page__breadcrumbs">
            <Link to="/dashboard" className="analysis-page__crumb">Dashboard</Link>
            <span className="analysis-page__sep">/</span>
            <Link to="/scenarios" className="analysis-page__crumb">Curriculum</Link>
            <span className="analysis-page__sep">/</span>
            <span className="analysis-page__crumb active">Training Debrief</span>
          </div>

          <div className="analysis-page__title-row">
            <div>
              <p className="analysis-page__pretitle">
                EXERCISE {scenario.exerciseNumber || '01'} DEBRIEF — POST-TRAINING ANALYSIS
              </p>
              <h1 className="analysis-page__title">
                {scenario.title}: {scenario.subtitle || 'Signal Loss'}
              </h1>
            </div>

            <div className="analysis-page__actions-top">
              <Link to={`/training/${currentScenarioId}`} className="btn btn--secondary btn--small">
                Try Again With Different Decisions
              </Link>
              <Link to="/scenarios" className="btn btn--primary btn--small">
                Next Training Exercise
              </Link>
            </div>
          </div>
        </div>

        {/* Core Lesson Review Callout */}
        <div className="analysis-page__core-lesson">
          <div className="analysis-page__core-lesson-badge">CORE LESSON EVALUATION</div>
          <p className="analysis-page__core-lesson-text">
            <strong>"{scenario.coreLesson || 'Communication is not always reliable. Do not assume silence means destruction, and never act on stale coordinates without verifying latency.'}"</strong>
          </p>
          <span className="analysis-page__core-lesson-mode">
            Session Mode: <strong>{trainingMode.toUpperCase()}</strong> • 6 of 6 Decision Points Evaluated
          </span>
        </div>

        {/* Qualitative Training Observations */}
        {observations && (
          <div className="analysis-page__observations">
            <h2 className="analysis-page__section-title">Cognitive Performance Observations</h2>
            <div className="analysis-page__obs-grid">
              <div className="analysis-page__obs-card">
                <span className="analysis-page__obs-label">INFORMATION FRESHNESS &amp; LATENCY</span>
                <p className="analysis-page__obs-text">{observations.infoHandling}</p>
              </div>

              <div className="analysis-page__obs-card">
                <span className="analysis-page__obs-label">UNCERTAINTY &amp; SIGNAL LOSS REACTION</span>
                <p className="analysis-page__obs-text">{observations.uncertaintyHandling}</p>
              </div>

              <div className="analysis-page__obs-card">
                <span className="analysis-page__obs-label">EVALUATING CONFLICTING REPORTS</span>
                <p className="analysis-page__obs-text">{observations.contradictionHandling}</p>
              </div>

              <div className="analysis-page__obs-card">
                <span className="analysis-page__obs-label">TIME WINDOW &amp; RISK ACCEPTANCE</span>
                <p className="analysis-page__obs-text">{observations.timeManagement}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recorded Decision Chronology */}
        <div className="analysis-page__card">
          <div className="analysis-page__card-header">
            <div>
              <h2 className="analysis-page__card-title">Chronological Decision Trail &amp; Consequences</h2>
              <p className="analysis-page__card-sub">
                Review how each choice influenced the tactical situation and examine the operational takeaway.
              </p>
            </div>
            <span className="analysis-page__card-meta">
              {history.length} Decision{history.length !== 1 ? 's' : ''} Logged
            </span>
          </div>

          {history.length === 0 ? (
            <div className="analysis-page__empty">
              No decision records found for this session. Complete a training exercise run to inspect the chronology.
            </div>
          ) : (
            <div className="analysis-page__timeline">
              {history.map((rec, idx) => (
                <div key={idx} className="analysis-trail-item">
                  <div className="analysis-trail-item__step">
                    <span className="analysis-trail-item__num">STEP {rec.stepIndex}</span>
                    <span className="analysis-trail-item__latency">{formatMs(rec.responseTimeMs)}</span>
                  </div>

                  <div className="analysis-trail-item__content">
                    <div className="analysis-trail-item__header">
                      <h3 className="analysis-trail-item__title">{rec.stepTitle}</h3>
                      <div className="analysis-trail-item__action">
                        <span className="badge badge--info">OPTION {rec.selectedOptionLabel}</span>
                        <span className="analysis-trail-item__action-title">{rec.selectedOptionTitle}</span>
                        {rec.tradeoff && (
                          <span className="badge badge--beginner" style={{ marginLeft: '6px' }}>{rec.tradeoff}</span>
                        )}
                      </div>
                    </div>

                    <div className="analysis-trail-item__what-happened">
                      <span className="analysis-trail-item__sublabel">OPERATIONAL CONSEQUENCE:</span>
                      <p className="analysis-trail-item__narrative">{rec.consequenceText}</p>
                    </div>

                    {rec.teachingTakeaway && (
                      <div className="analysis-trail-item__takeaway">
                        <span className="analysis-trail-item__sublabel">PEDAGOGICAL TAKEAWAY:</span>
                        <p className="analysis-trail-item__takeaway-text">{rec.teachingTakeaway}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Replay & Progression Actions */}
        <div className="analysis-page__bottom-actions">
          <Link to="/dashboard" className="btn btn--secondary">
            Return to Dashboard
          </Link>
          <Link to={`/training/${currentScenarioId}`} className="btn btn--secondary">
            Try Again With Different Decisions
          </Link>
          <Link to="/scenarios" className="btn btn--primary">
            Continue to Next Exercise
          </Link>
        </div>
      </div>
    </div>
  );
}
