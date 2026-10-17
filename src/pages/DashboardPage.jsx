import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTraining } from '../context/TrainingContext';
import { scenarios } from '../data/scenarios';
import './DashboardPage.css';

export default function DashboardPage() {
  const { trainee, isLoggedIn, completedScenarios, scenarioHistory } = useTraining();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn || !trainee) return null;

  const totalScenarios = scenarios.length;
  const completedCount = completedScenarios.length;
  const progressPercent = totalScenarios > 0 ? (completedCount / totalScenarios) * 100 : 0;

  // Compute average metrics from history
  const avgMetric = (key) => {
    if (scenarioHistory.length === 0) return '—';
    const values = scenarioHistory
      .filter(h => h.result && h.result[key] != null)
      .map(h => h.result[key]);
    if (values.length === 0) return '—';
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length) + '%';
  };

  const metrics = [
    { label: 'Scenarios', value: `${completedCount} / ${totalScenarios}`, sub: 'Completed' },
    { label: 'Decision Quality', value: avgMetric('decisionQuality'), sub: 'Average' },
    { label: 'Response Time', value: avgMetric('responseTime'), sub: 'Average' },
    { label: 'Info Utilization', value: avgMetric('infoUtilization'), sub: 'Average' },
    { label: 'Risk Awareness', value: avgMetric('riskAwareness'), sub: 'Average' },
  ];

  // Recent attempts (last 5)
  const recentAttempts = [...scenarioHistory]
    .reverse()
    .slice(0, 5)
    .map(h => {
      const sc = scenarios.find(s => s.id === h.scenarioId);
      return {
        name: sc ? sc.title : h.scenarioId,
        score: h.result && h.result.overall != null ? `${h.result.overall}%` : '—',
        timestamp: h.timestamp,
      };
    });

  return (
    <div className="dashboard">
      <div className="container">
        {/* Header */}
        <div className="dashboard__header">
          <p className="dashboard__welcome">Training Dashboard</p>
          <h1 className="dashboard__title">Welcome, {trainee.name}</h1>
          <p className="dashboard__subtitle">
            {completedCount === 0
              ? 'Begin your first training scenario to start building your profile.'
              : `You've completed ${completedCount} scenario${completedCount !== 1 ? 's' : ''}. Keep training to improve.`}
          </p>
        </div>

        {/* Metrics */}
        <div className="dashboard__metrics">
          {metrics.map(m => (
            <div key={m.label} className="dashboard__metric">
              <div className="dashboard__metric-label">{m.label}</div>
              <div className="dashboard__metric-value">{m.value}</div>
              <div className="dashboard__metric-sub">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="dashboard__grid">
          {/* Progress + Recent */}
          <div className="dashboard__progress-card">
            <h2 className="dashboard__card-title">
              <span className="dashboard__card-icon">▶</span>
              Training Progress
            </h2>

            <div className="dashboard__progress-info">
              <span className="dashboard__progress-label">Overall Completion</span>
              <span className="dashboard__progress-count">
                {completedCount} / {totalScenarios}
              </span>
            </div>
            <div className="dashboard__progress-bar">
              <div
                className="dashboard__progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <h3 className="dashboard__card-title" style={{ fontSize: 'var(--text-sm)' }}>
              Recent Attempts
            </h3>
            {recentAttempts.length > 0 ? (
              <div className="dashboard__recent-list">
                {recentAttempts.map((item, i) => (
                  <div key={i} className="dashboard__recent-item">
                    <span className="dashboard__recent-name">{item.name}</span>
                    <span className="dashboard__recent-score">{item.score}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard__empty">
                No attempts yet. Complete a scenario to see your history.
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="dashboard__actions-card">
            <h2 className="dashboard__card-title">
              <span className="dashboard__card-icon">◇</span>
              Quick Actions
            </h2>

            <div className="dashboard__quick-actions">
              <Link to="/scenarios" className="dashboard__quick-action">
                <span className="dashboard__quick-action-icon">◆</span>
                <div className="dashboard__quick-action-info">
                  <div className="dashboard__quick-action-title">Browse Scenarios</div>
                  <div className="dashboard__quick-action-desc">
                    View all available training scenarios
                  </div>
                </div>
                <span className="dashboard__quick-action-arrow">→</span>
              </Link>

              {completedCount > 0 && (
                <Link
                  to={`/scenarios`}
                  className="dashboard__quick-action"
                >
                  <span className="dashboard__quick-action-icon">↻</span>
                  <div className="dashboard__quick-action-info">
                    <div className="dashboard__quick-action-title">Replay Scenario</div>
                    <div className="dashboard__quick-action-desc">
                      Retry a completed scenario for a better score
                    </div>
                  </div>
                  <span className="dashboard__quick-action-arrow">→</span>
                </Link>
              )}

              <Link to="/scenarios" className="dashboard__quick-action">
                <span className="dashboard__quick-action-icon">◈</span>
                <div className="dashboard__quick-action-info">
                  <div className="dashboard__quick-action-title">Next Recommended</div>
                  <div className="dashboard__quick-action-desc">
                    {completedCount === 0 ? 'Signal Loss (Beginner)' : 'Continue your training path'}
                  </div>
                </div>
                <span className="dashboard__quick-action-arrow">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
