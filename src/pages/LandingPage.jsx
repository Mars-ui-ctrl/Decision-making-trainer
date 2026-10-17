import { Link } from 'react-router-dom';
import './LandingPage.css';

const steps = [
  {
    number: '01',
    title: 'Receive Briefing',
    desc: 'Understand the scenario, the units involved, and the current communication state.',
  },
  {
    number: '02',
    title: 'Analyze Information',
    desc: 'Assess what you know, what is delayed, what is missing, and what might be wrong.',
  },
  {
    number: '03',
    title: 'Make Decisions',
    desc: 'Choose an action based on the information available — not the information you wish you had.',
  },
  {
    number: '04',
    title: 'Review Performance',
    desc: 'See how your decisions affected the scenario and understand your strengths and weaknesses.',
  },
];

const commStates = [
  {
    label: 'LIVE',
    dotClass: 'landing__comm-dot--live',
    desc: 'Information is current and reliable. Full situational awareness.',
  },
  {
    label: 'DELAYED',
    dotClass: 'landing__comm-dot--delayed',
    desc: 'Information arrives late. You must decide whether old data is still useful.',
  },
  {
    label: 'DEGRADED',
    dotClass: 'landing__comm-dot--degraded',
    desc: 'Partial information. Some details may be missing or unreliable.',
  },
  {
    label: 'LOST',
    dotClass: 'landing__comm-dot--lost',
    desc: 'No new information. Last known status is outdated. You are operating blind.',
  },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* Hero */}
      <section className="landing__hero">
        <div className="landing__hero-bg">
          <div className="landing__grid-pattern" />
          <div className="landing__glow" />
        </div>

        <div className="landing__hero-content">
          <div className="landing__badge">
            <span className="landing__badge-dot" />
            Decision-Making Training Platform
          </div>

          <h1 className="landing__title">
            Train to Decide Under{' '}
            <span className="landing__title-accent">Degraded Communication</span>
          </h1>

          <p className="landing__subtitle">
            An interactive simulator that places you in scenarios where communication is
            delayed, degraded, or lost — forcing you to make critical decisions with
            incomplete information.
          </p>

          <div className="landing__actions">
            <Link to="/login" className="btn btn--primary btn--large">
              Start Training
            </Link>
            <a href="#how-it-works" className="btn btn--secondary btn--large">
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="landing__section landing__section--alt">
        <div className="landing__section-header">
          <p className="landing__section-label">How It Works</p>
          <h2 className="landing__section-title">Four Steps to Better Decisions</h2>
          <p className="landing__section-desc">
            Each training scenario follows a structured flow designed to build
            decision-making skills under information uncertainty.
          </p>
        </div>

        <div className="landing__steps">
          {steps.map(step => (
            <div key={step.number} className="landing__step">
              <div className="landing__step-number">{step.number}</div>
              <h3 className="landing__step-title">{step.title}</h3>
              <p className="landing__step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Communication States */}
      <section className="landing__section">
        <div className="landing__section-header">
          <p className="landing__section-label">Core Mechanic</p>
          <h2 className="landing__section-title">Communication Degradation</h2>
          <p className="landing__section-desc">
            The quality of your information changes throughout each scenario.
            Your decisions must account for what you actually know — not what you assume.
          </p>
        </div>

        <div className="landing__comm-grid">
          {commStates.map(state => (
            <div key={state.label} className="landing__comm-card">
              <div className="landing__comm-header">
                <span className={`landing__comm-dot ${state.dotClass}`} />
                <span className="landing__comm-label">{state.label}</span>
              </div>
              <p className="landing__comm-desc">{state.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing__footer">
        <p className="landing__footer-text">
          DECSIM — Decision-Making Trainer for Degraded Communication Environments
        </p>
      </footer>
    </div>
  );
}
