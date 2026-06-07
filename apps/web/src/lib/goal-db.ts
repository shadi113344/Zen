import { normalizeGoal, resolveGoalCadence } from "@mottazen/core";
import type { Goal, GoalCadencePeriod, GoalHabitLink, GoalKind, GoalPeriod } from "@mottazen/core";

function dateOnly(value: unknown): string {
  if (value == null) return "2020-01-01";
  return String(value).slice(0, 10);
}

export function mapGoalRow(row: Record<string, unknown>): Goal {
  return normalizeGoal({
    id: row.id as string,
    name: row.name as string,
    kind: (row.kind as GoalKind) ?? "legacy",
    category: (row.category as string) ?? undefined,
    startDate: dateOnly(row.start_date),
    endDate: dateOnly(row.end_date ?? "2099-12-31"),
    daysPerWeek: row.days_per_week != null ? Number(row.days_per_week) : undefined,
    cadence:
      row.cadence_period === "week" || row.cadence_period === "month"
        ? {
            count: Number(row.cadence_count ?? row.days_per_week ?? 5),
            period: row.cadence_period as GoalCadencePeriod,
          }
        : undefined,
    targetTotal: row.target_total != null ? Number(row.target_total) : undefined,
    unit: (row.unit as string) ?? undefined,
    planIntervalDays: row.plan_interval_days != null ? Number(row.plan_interval_days) : undefined,
    planAmountPerSession:
      row.plan_amount_per_session != null ? Number(row.plan_amount_per_session) : undefined,
    period: (row.period as GoalPeriod) ?? undefined,
    targetPercent: row.target_percent != null ? Number(row.target_percent) : undefined,
    color: (row.color as string) ?? undefined,
  });
}

export function goalToDb(goal: Goal, userId: string) {
  const g = normalizeGoal(goal);
  const cadence = g.kind === "consistency" ? resolveGoalCadence(g) : null;
  return {
    id: g.id,
    user_id: userId,
    name: g.name,
    kind: g.kind,
    category: g.category ?? null,
    start_date: g.startDate,
    end_date: g.endDate,
    days_per_week: cadence ? (cadence.period === "week" ? cadence.count : null) : (g.daysPerWeek ?? null),
    cadence_count: cadence?.count ?? null,
    cadence_period: cadence?.period ?? null,
    target_total: g.targetTotal ?? null,
    unit: g.unit ?? null,
    plan_interval_days: g.planIntervalDays ?? null,
    plan_amount_per_session: g.planAmountPerSession ?? null,
    period: g.kind === "legacy" ? (g.period ?? "weekly") : null,
    target_percent: g.kind === "legacy" ? (g.targetPercent ?? 80) : null,
    color: g.color ?? null,
  };
}

export function goalHabitToDb(link: GoalHabitLink) {
  return {
    goal_id: link.goalId,
    habit_id: link.habitId,
    weight: link.weight,
    required: link.required,
  };
}

export function mapGoalHabitRow(row: Record<string, unknown>): GoalHabitLink {
  return {
    goalId: row.goal_id as string,
    habitId: row.habit_id as string,
    weight: Number(row.weight ?? 1),
    required: !!row.required,
  };
}
