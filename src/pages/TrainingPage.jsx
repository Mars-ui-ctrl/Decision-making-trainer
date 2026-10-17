import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTraining } from '../context/TrainingContext';
import { SIGNAL_LOSS_SCENARIO } from '../data/signalLossScenario';
import ImmersionScene from '../immersion/ImmersionScene';
import './TrainingPage.css';

export default function TrainingPage() {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, completeScenario } = useTraining();

  const [phase, setPhase] = useState('ready'); // 'ready' | 'immersion' | 'complete'
  const [decisionHistory, setDecisionHistory] = useState([]);
  const hasCompletedRef = useRef(false);

  // Auth Guard
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Start the immersive simulation
  const handleStartSim = useCallback(() => {
    setPhase('immersion');
    hasCompletedRef.current = false;
  }, []);

  // Exit from immersion scene
  const handleExit = useCallback(() => {
    if (window.confirm('Exit simulation?')) {
      navigate('/scenarios');
    }
  }, [navigate]);

  // Completion from immersion scene
  const handleComplete = useCallback((history) => {
    if (!hasCompletedRef.current) {
      hasCompletedRef.current = true;
      setDecisionHistory(history || []);
      completeScenario(scenarioId || 'scenario-01', {
        decisionCount: history?.length || 0,
        completedAt: Date.now(),
        history: history || [],
        trainingMode: 'immersion',
      });
      setPhase('complete');
    }
  }, [scenarioId, completeScenario]);

  // Restart
  const handleRestart = useCallback(() => {
    hasCompletedRef.current = false;
    setDecisionHistory([]);
    setPhase('immersion');
  }, []);

  if (!isLoggedIn) return null;

  const scenario = SIGNAL_LOSS_SCENARIO;

  // -------------------------------------------------------------------------
  // 1. IMMERSION MODE — Full-screen scene takes over
  // -------------------------------------------------------------------------
  if (phase === 'immersion') {
    return (
      <ImmersionScene
        onExit={handleExit}
        onComplete={handleComplete}
      />
    );
  }

  // -------------------------------------------------------------------------
  // 2. Ready State: Crisp 3-Line Mission Orientation
  // -------------------------------------------------------------------------
  if (phase === 'ready') {
    return (
      <div className="sim-ready page--with-header">
        <div className="container">
          <div className="sim-ready__card">
            <div className="sim-ready__badge-strip">
              <span className="sim-ready__badge">EXERCISE {scenario.exerciseNumber}</span>
              <span className="sim-ready__mode-tag">IMMERSIVE SIMULATION</span>
            </div>

            <h1 className="sim-ready__title">{scenario.title}</h1>
            <p className="sim-ready__subtitle">{scenario.subtitle}</p>

            {/* Crisp 3-point briefing */}
            <div className="sim-ready__role-card">
              <div className="sim-ready__role-item">
                <span className="sim-ready__label">ROLE</span>
                <span className="sim-ready__value">{scenario.briefing.role}</span>
              </div>
              <div className="sim-ready__role-item">
                <span className="sim-ready__label">OBJECTIVE</span>
                <span className="sim-ready__value">{scenario.briefing.objective}</span>
              </div>
              <div className="sim-ready__role-item">
                <span className="sim-ready__label">CURRENT PRIORITY</span>
                <span className="sim-ready__value sim-ready__value--alert">
                  {scenario.briefing.currentPriority}
                </span>
              </div>
            </div>

            <p className="sim-ready__action-hint">
              You will observe a live situation unfold. Watch, listen, and decide when the moment comes.
            </p>

            <div className="sim-ready__actions">
              <button
                type="button"
                className="btn btn--primary btn--large sim-ready__launch-btn"
                onClick={handleStartSim}
                autoFocus
              >
                ▶ Enter Simulation
              </button>
              <Link to="/scenarios" className="btn btn--secondary btn--large">
                Back to Curriculum
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 3. Complete State
  // -------------------------------------------------------------------------
  return (
    <div className="sim-complete page--with-header">
      <div className="container">
        <div className="sim-complete__card">
          <div className="sim-complete__icon">✓</div>
          <p className="sim-complete__label">SIMULATION EXERCISE CONCLUDED</p>
          <h1 className="sim-complete__title">Exercise {scenario.exerciseNumber} Completed</h1>
          <p className="sim-complete__desc">
            Your decisions and their consequences have been recorded for debrief.
          </p>

          <div className="sim-complete__stats">
            <div className="sim-complete__stat">
              <span className="sim-complete__stat-label">DECISIONS COMMITTED</span>
              <span className="sim-complete__stat-val">{decisionHistory.length}</span>
            </div>
          </div>

          <div className="sim-complete__actions">
            <Link
              to={`/analysis/${scenarioId || 'scenario-01'}`}
              className="btn btn--primary btn--large"
            >
              Review Training Debrief
            </Link>
            <button
              type="button"
              className="btn btn--secondary btn--large"
              onClick={handleRestart}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
