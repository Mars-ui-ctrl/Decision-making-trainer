import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTraining } from '../context/TrainingContext';
import './LoginPage.css';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const { login, isLoggedIn } = useTraining();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  if (isLoggedIn) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name to continue.');
      return;
    }
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    setError('');
    login(trimmed, role.trim() || 'Trainee');
    navigate('/dashboard');
  };

  return (
    <div className="login">
      <div className="login__bg">
        <div className="login__bg-glow" />
      </div>

      <div className="login__card">
        <div className="login__header">
          <div className="login__logo">DT</div>
          <h1 className="login__title">Trainee Identification</h1>
          <p className="login__subtitle">Enter your details to begin training</p>
        </div>

        <form className="login__form" onSubmit={handleSubmit}>
          <div className="login__field">
            <label htmlFor="trainee-name" className="label">
              Full Name <span className="text-danger">*</span>
            </label>
            <input
              id="trainee-name"
              type="text"
              className="input"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              autoFocus
              autoComplete="name"
            />
            {error && <span className="login__error">{error}</span>}
          </div>

          <div className="login__field">
            <label htmlFor="trainee-role" className="label">
              Role / Designation <span className="text-muted">(optional)</span>
            </label>
            <input
              id="trainee-role"
              type="text"
              className="input"
              placeholder="e.g., Field Coordinator"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              autoComplete="organization-title"
            />
          </div>

          <button type="submit" className="btn btn--primary btn--large login__submit">
            Enter Training
          </button>
        </form>

        <div className="login__back">
          <Link to="/" className="login__back-link">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
