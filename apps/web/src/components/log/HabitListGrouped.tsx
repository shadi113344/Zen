import { useCallback, useMemo, useState } from "react";
import type { Habit } from "@mottazen/core";
import { logValueForHabit } from "@mottazen/core";
import { sortHabitsByOrder } from "@/lib/sort-habits";
import { useCategoryOrder } from "@/hooks/useCategoryOrder";
import { useData, useLogs } from "@/hooks/useData";
import { useDisplayPrefs } from "@/hooks/useDisplayPrefs";
import { usePointerReorder } from "@/hooks/usePointerReorder";
import { HabitCard } from "./HabitCard";

interface HabitListGroupedProps {
  habits: Habit[];
  date: string;
  categoryFilter?: string | null;
}

export function HabitListGrouped({ habits, date, categoryFilter = null }: HabitListGroupedProps) {
  const { displayDensity } = useDisplayPrefs();
  const activityOnly = displayDensity === "activity-only";
  const { reorderHabits } = useData();
  const { logs, setLogValue } = useLogs();
  const { sortCategories, setCategoryOrder } = useCategoryOrder();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const active = useMemo(() => sortHabitsByOrder(habits.filter((h) => !h.paused)), [habits]);

  const groups = useMemo(() => {
    const map = new Map<string, Habit[]>();
    for (const h of active) {
      const cat = h.category || "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(h);
    }
    const categories = sortCategories([...map.keys()]);
    return categories.map((category) => ({
      category,
      items: sortHabitsByOrder(map.get(category) ?? []),
    }));
  }, [active, sortCategories]);

  const visibleGroups = useMemo(
    () => (categoryFilter ? groups.filter((g) => g.category === categoryFilter) : groups),
    [groups, categoryFilter],
  );

  const swapHabits = useCallback(
    (fromId: string, toId: string) => {
      const sorted = sortHabitsByOrder(active);
      const fromH = sorted.find((h) => h.id === fromId);
      const toH = sorted.find((h) => h.id === toId);
      if (!fromH || !toH) return;
      if (!activityOnly && (fromH.category || "Other") !== (toH.category || "Other")) return;
      const ids = sorted.map((h) => h.id);
      const fromIdx = ids.indexOf(fromId);
      const toIdx = ids.indexOf(toId);
      if (fromIdx < 0 || toIdx < 0) return;
      const next = [...ids];
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, fromId);
      reorderHabits(next);
    },
    [active, activityOnly, reorderHabits],
  );

  const swapGroups = useCallback(
    (fromCat: string, toCat: string) => {
      const cats = groups.map((g) => g.category);
      const fromIdx = cats.indexOf(fromCat);
      const toIdx = cats.indexOf(toCat);
      if (fromIdx < 0 || toIdx < 0) return;
      const next = [...cats];
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, fromCat);
      setCategoryOrder(next);
    },
    [groups, setCategoryOrder],
  );

  const { getDragProps: getGroupDragProps, draggingId: draggingGroupId } = usePointerReorder(
    swapGroups,
    "data-group-id",
  );
  const { getDragProps: getHabitDragProps, draggingId: draggingHabitId } = usePointerReorder(
    swapHabits,
    "data-habit-id",
  );

  const makeSkip = (habit: Habit) => () => {
    const value = logValueForHabit(logs, habit.id, date);
    const row = logs.find((l) => l.habitId === habit.id && l.date === date);
    const isRest = row?.isRest === true || value === -1;
    const isSkipped = !isRest && row != null && value === 0;
    if (isSkipped) setLogValue(habit.id, date, null, false);
    else setLogValue(habit.id, date, 0, false);
  };

  const makeRest = (habit: Habit) => () => {
    const value = logValueForHabit(logs, habit.id, date);
    const row = logs.find((l) => l.habitId === habit.id && l.date === date);
    const isRest = row?.isRest === true || value === -1;
    if (isRest) setLogValue(habit.id, date, null, false);
    else setLogValue(habit.id, date, -1, true);
  };

  if (active.length === 0) return null;

  if (activityOnly) {
    if (visibleGroups.length === 0) {
      return <p className="habit-groups__empty-filter">No activities in this category.</p>;
    }

    return (
      <div className="habit-list-activity">
        {visibleGroups.map(({ category, items }) => {
          const isCollapsed = collapsed[category] ?? false;
          return (
            <section key={category} className="habit-activity-section">
              <button
                type="button"
                className="habit-activity-section__head"
                onClick={() => setCollapsed((c) => ({ ...c, [category]: !isCollapsed }))}
                aria-expanded={!isCollapsed}
              >
                <span className="habit-activity-section__title">{category}</span>
                <span className="habit-activity-section__count">{items.length}</span>
                <span className="habit-activity-section__chev" aria-hidden>
                  {isCollapsed ? "▸" : "▾"}
                </span>
              </button>
              {!isCollapsed &&
                items.map((habit) => {
                  const habitDrag = getHabitDragProps(habit.id);
                  return (
                    <div
                      key={habit.id}
                      className={`card habit-activity-card${draggingHabitId === habit.id ? " habit-activity-card--dragging" : ""}`}
                      data-habit-id={habit.id}
                      {...habitDrag}
                    >
                      <HabitCard habit={habit} date={date} onSkip={makeSkip(habit)} onRest={makeRest(habit)} />
                    </div>
                  );
                })}
            </section>
          );
        })}
      </div>
    );
  }

  const groupsClass =
    displayDensity === "normal" ? "habit-groups habit-groups--normal" : "habit-groups habit-groups--compact";

  return (
    <div className={groupsClass}>
      {visibleGroups.length === 0 ? (
        <p className="habit-groups__empty-filter">No activities in this category.</p>
      ) : null}
      {visibleGroups.map(({ category, items }) => {
        const isCollapsed = collapsed[category] ?? false;
        const groupDrag = getGroupDragProps(category);
        return (
          <section
            key={category}
            className={`habit-group card${draggingGroupId === category ? " habit-group--dragging" : ""}`}
            data-group-id={category}
            {...groupDrag}
          >
            <button
              type="button"
              className="habit-group__header"
              onClick={() => setCollapsed((c) => ({ ...c, [category]: !isCollapsed }))}
              aria-expanded={!isCollapsed}
            >
              <span className="habit-group__title">{category.toUpperCase()}</span>
              <span className="habit-group__count">{items.length}</span>
              <span className="habit-group__chev" aria-hidden>
                {isCollapsed ? "▸" : "▾"}
              </span>
            </button>
            {!isCollapsed && (
              <div className="habit-group__list">
                {items.map((habit) => {
                  const habitDrag = getHabitDragProps(habit.id);
                  return (
                    <div
                      key={habit.id}
                      className={`habit-group__item${draggingHabitId === habit.id ? " habit-group__item--dragging" : ""}`}
                      data-habit-id={habit.id}
                      {...habitDrag}
                    >
                      <HabitCard
                        habit={habit}
                        date={date}
                        onSkip={makeSkip(habit)}
                        onRest={makeRest(habit)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
