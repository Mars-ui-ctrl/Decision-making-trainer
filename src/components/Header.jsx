import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTraining } from '../context/TrainingContext';
import './Header.css';

export default function Header() {
  const { trainee, isLoggedIn, logout } = useTraining();
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show header on landing page
  if (location.pathname === '/') return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="header">
      <div className="header__inner">
        <Link to={isLoggedIn ? '/dashboard' : '/'} className="header__logo">
          <span className="header__logo-mark">DT</span>
          DECSIM
        </Link>

        <nav className="header__nav">
          {isLoggedIn && (
            <>
              <Link
                to="/dashboard"
                className={`header__nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              <Link
                to="/scenarios"
                className={`header__nav-link ${location.pathname === '/scenarios' ? 'active' : ''}`}
              >
                Scenarios
              </Link>
            </>
          )}
        </nav>

        <div className="header__right">
          {isLoggedIn && trainee && (
            <>
              <div className="header__user">
                <span className="header__avatar">{getInitials(trainee.name)}</span>
                <span className="header__user-name">{trainee.name}</span>
              </div>
              <button className="header__logout" onClick={handleLogout} title="End Session">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
