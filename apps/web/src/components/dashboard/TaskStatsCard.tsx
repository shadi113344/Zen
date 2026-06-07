import { Link } from "react-router-dom";
import { ChartChrome } from "@/components/charts/ChartChrome";

interface TaskStatsCardProps {
  periodTitle: string;
  pending: number;
  completed: number;
  onRemove?: () => void;
}

/** Compact pending vs completed totals for the Dashboard (period-scoped). */
export function TaskStatsCard({ periodTitle, pending, completed, onRemove }: TaskStatsCardProps) {
  return (
    <section className="card page-section task-stats-card" aria-label="Task summary">
      <div className="task-stats-card__header">
        <h3 className="page-section__title task-stats-card__title">Tasks · {periodTitle}</h3>
        <Link to="/log" className="task-stats-card__link">
          Open today →
        </Link>
      </div>
      <ChartChrome onRemove={onRemove}>
        <div className="stat-grid task-stats-card__grid">
          <div className="stat-tile">
            <div className="stat-tile__label">Pending</div>
            <div className="stat-tile__value">{pending}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__label">Completed</div>
            <div className="stat-tile__value">{completed}</div>
          </div>
        </div>
      </ChartChrome>
    </section>
  );
}
