import { useState, useEffect, useRef } from 'react';
import './ScenarioTimer.css';

export default function ScenarioTimer({ isActive, onTick, initialSeconds = 0 }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const startTimeRef = useRef(null);
  const accumulatedRef = useRef(initialSeconds);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000) + accumulatedRef.current;
      setSeconds(elapsed);
      if (onTick) {
        onTick(elapsed);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      accumulatedRef.current = seconds;
    };
  }, [isActive, onTick, seconds]);

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="scenario-timer" role="timer" aria-live="off">
      <span className="scenario-timer__label">TIME</span>
      <span className="scenario-timer__digits">{formatTime(seconds)}</span>
    </div>
  );
}
