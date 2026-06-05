interface StreakPillsProps {
  current: number;
  best: number;
  consistency30: number;
}

export function StreakPills({ current, best, consistency30 }: StreakPillsProps) {
  return (
    <div className="streak-pills">
      <div className="streak-pill">
        <span className="streak-pill__value">{current}</span>
        <span className="streak-pill__label">Current</span>
      </div>
      <div className="streak-pill">
        <span className="streak-pill__value">{best}</span>
        <span className="streak-pill__label">Best</span>
      </div>
      <div className="streak-pill">
        <span className="streak-pill__value">{consistency30}%</span>
        <span className="streak-pill__label">30-day</span>
      </div>
    </div>
  );
}
