import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTraining } from '../context/TrainingContext';
import { scenarios, getDifficultyClass } from '../data/scenarios';
import './ScenarioSelectPage.css';

const FILTERS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function ScenarioSelectPage() {
  const { isLoggedIn, completedScenarios } = useTraining();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const filtered = useMemo(() => {
    if (activeFilter === 'All') return scenarios;
    return scenarios.filter(s => s.difficulty === activeFilter);
  }, [activeFilter]);

  if (!isLoggedIn) return null;

  const getCommDotClass = (status) => {
    const map = {
      live: 'scenario-card__comm-dot--live',
      delayed: 'scenario-card__comm-dot--delayed',
      limited: 'scenario-card__comm-dot--limited',
      degraded: 'scenario-card__comm-dot--degraded',
      lost: 'scenario-card__comm-dot--lost',
    };
    return map[status] || '';
  };

  return (
    <div className="scenarios">
      <div className="container">
        {/* Header */}
        <div className="scenarios__header">
          <p className="scenarios__label">TRAINING CURRICULUM</p>
          <h1 className="scenarios__title">Decision-Making Exercises</h1>
          <p className="scenarios__subtitle">
            Progressive simulation exercises designed to teach and evaluate decision-making under
            degraded, delayed, conflicting, or unavailable information.
          </p>
        </div>

        {/* Filters */}
        <div className="scenarios__filters">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`scenarios__filter-btn ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Scenario Grid */}
        <div className="scenarios__grid">
          {filtered.map(scenario => {
            const isCompleted = completedScenarios.includes(scenario.id);
            const isLocked = scenario.locked;

            return (
              <div
                key={scenario.id}
                className={`scenario-card ${isLocked ? 'scenario-card--locked' : ''}`}
              >
                {/* Title + Exercise ID */}
                <div className="scenario-card__top">
                  <div>
                    <span className="scenario-card__exercise-tag">
                      EXERCISE {scenario.exerciseNumber || '01'}
                    </span>
                    <h2 className="scenario-card__title">{scenario.title}</h2>
                    {scenario.subtitle && (
                      <p className="scenario-card__subtitle">{scenario.subtitle}</p>
                    )}
                  </div>
                  <span className="scenario-card__id">
                    {scenario.id.replace('scenario-', '#')}
                  </span>
                </div>

                {/* Difficulty + Meta */}
                <div className="scenario-card__meta">
                  <span className={`badge ${getDifficultyClass(scenario.difficulty)}`}>
                    {scenario.difficulty}
                  </span>
                  <span className="scenario-card__meta-item">
                    <span className="scenario-card__meta-icon">⏱</span>
                    {scenario.estimatedTime}
                  </span>
                  <span className="scenario-card__meta-item">
                    <span className="scenario-card__meta-icon">◇</span>
                    {scenario.decisionPoints} decision points
                  </span>
                  {isCompleted && (
                    <span className="badge badge--info">Completed</span>
                  )}
                </div>

                {/* Training Focus & Core Lesson */}
                {scenario.trainingFocus && (
                  <div className="scenario-card__focus-box">
                    <span className="scenario-card__focus-label">TRAINING FOCUS:</span>
                    <p className="scenario-card__focus-text">{scenario.trainingFocus}</p>
                  </div>
                )}

                {/* Description */}
                <p className="scenario-card__desc">{scenario.description}</p>

                {/* Domain tags */}
                <div className="scenario-card__domains">
                  {scenario.domain.map(d => (
                    <span key={d} className="scenario-card__domain-tag">{d}</span>
                  ))}
                </div>

                {/* Communication Channel Preview */}
                {scenario.initialComms && (
                  <div className="scenario-card__comms">
                    {Object.entries(scenario.initialComms).map(([unit, status]) => (
                      <span key={unit} className="scenario-card__comm">
                        <span className={`scenario-card__comm-dot ${getCommDotClass(status)}`} />
                        {unit}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="scenario-card__actions">
                  {isLocked ? (
                    <span className="scenario-card__lock-msg">
                      🔒 Complete earlier exercises to unlock
                    </span>
                  ) : (
                    <>
                      <Link
                        to={`/training/${scenario.id}`}
                        className="btn btn--primary btn--small"
                      >
                        {isCompleted ? 'Replay Exercise' : 'Begin Exercise'}
                      </Link>
                      <Link
                        to={`/briefing/${scenario.id}`}
                        className="btn btn--secondary btn--small"
                      >
                        Read Briefing
                      </Link>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
