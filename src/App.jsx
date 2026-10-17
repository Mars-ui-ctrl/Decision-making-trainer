import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ScenarioSelectPage from './pages/ScenarioSelectPage';
import TrainingPage from './pages/TrainingPage';
import AnalysisPage from './pages/AnalysisPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/scenarios" element={<ScenarioSelectPage />} />
          <Route path="/training/:scenarioId" element={<TrainingPage />} />
          <Route path="/briefing/:scenarioId" element={<TrainingPage />} />
          <Route path="/analysis/:scenarioId" element={<AnalysisPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
