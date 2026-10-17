import { createContext, useContext, useState, useCallback } from 'react';

const TrainingContext = createContext(null);

export function TrainingProvider({ children }) {
  const [trainee, setTrainee] = useState(null);
  const [completedScenarios, setCompletedScenarios] = useState([]);
  const [scenarioHistory, setScenarioHistory] = useState([]);

  const isLoggedIn = trainee !== null;

  const login = useCallback((name, role) => {
    setTrainee({
      name,
      role: role || 'Trainee',
      id: `TRN-${Date.now().toString(36).toUpperCase()}`,
      joinedAt: Date.now(),
    });
  }, []);

  const logout = useCallback(() => {
    setTrainee(null);
    setCompletedScenarios([]);
    setScenarioHistory([]);
  }, []);

  const completeScenario = useCallback((scenarioId, result) => {
    setCompletedScenarios(prev => {
      if (prev.includes(scenarioId)) return prev;
      return [...prev, scenarioId];
    });
    setScenarioHistory(prev => [
      ...prev,
      {
        scenarioId,
        result,
        attempt: prev.filter(h => h.scenarioId === scenarioId).length + 1,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const getScenarioAttempts = useCallback(
    (scenarioId) => scenarioHistory.filter(h => h.scenarioId === scenarioId),
    [scenarioHistory]
  );

  const getLatestResult = useCallback(
    (scenarioId) => {
      const attempts = scenarioHistory.filter(h => h.scenarioId === scenarioId);
      return attempts.length > 0 ? attempts[attempts.length - 1].result : null;
    },
    [scenarioHistory]
  );

  return (
    <TrainingContext.Provider
      value={{
        trainee,
        isLoggedIn,
        completedScenarios,
        scenarioHistory,
        login,
        logout,
        completeScenario,
        getScenarioAttempts,
        getLatestResult,
      }}
    >
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining() {
  const ctx = useContext(TrainingContext);
  if (!ctx) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return ctx;
}
