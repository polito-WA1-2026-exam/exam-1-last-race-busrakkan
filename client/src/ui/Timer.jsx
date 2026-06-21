import { useState, useEffect } from "react";

function Timer({ onTimeout }) {
  const totalSeconds = 90;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeout();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, onTimeout]);

  const percentRemaining = timeLeft / totalSeconds;
  const displayColor = timeLeft <= 5 ? '#e74c3c' : timeLeft <= 15 ? '#f39c12' : '#2ecc71';

  return (
    <div className="text-center mb-2">
      <div className="fw-bold" style={{ fontSize: '28px', color: displayColor }}>{timeLeft}s</div>
      <div className="progress" style={{ height: '8px' }}>
        <div className="progress-bar" style={{ width: (percentRemaining * 100) + '%', backgroundColor: displayColor }} />
      </div>
    </div>
  );
}

export default Timer;