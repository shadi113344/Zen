import { useEffect, useMemo, useState } from "react";

import {

  categoryWeightsToItems,

  habitScore,

  itemsToCategoryWeights,

  logValueForHabit,

  resolveCategoryWeights,

  weightedScoreContribution,

} from "@mottazen/core";

import { WeightEditor, type WeightItem } from "@/components/WeightEditor";

import { useAppDate } from "@/hooks/useAppDate";

import { useCategoryWeights, useHabits, useLogs } from "@/hooks/useData";



interface CategoryWeightsSectionProps {

  category: string;

}



function toWeightItems(

  weights: ReturnType<typeof resolveCategoryWeights>,

  habits: Parameters<typeof categoryWeightsToItems>[1],

  category: string,

): WeightItem[] {

  return categoryWeightsToItems(weights, habits, category).map((i) => ({

    habitId: i.habitId,

    weight: i.weight,

  }));

}



export function CategoryWeightsSection({ category }: CategoryWeightsSectionProps) {

  const { habits } = useHabits();

  const { logs } = useLogs();

  const { setWeights, allWeights } = useCategoryWeights();

  const { selectedDate } = useAppDate();



  const categoryHabits = habits.filter((h) => h.category === category && !h.paused);

  const stored = allWeights[category];

  const weightKey = JSON.stringify(stored ?? {});



  const resolved = useMemo(

    () => resolveCategoryWeights(habits, category, stored),

    [habits, category, weightKey],

  );



  const savedItems = useMemo(

    () => toWeightItems(resolved, habits, category),

    [resolved, habits, category],

  );



  const [items, setItems] = useState(savedItems);

  const [isEditing, setIsEditing] = useState(false);



  useEffect(() => {

    if (!isEditing) setItems(savedItems);

  }, [savedItems, isEditing]);



  if (categoryHabits.length === 0) return null;



  return (

    <section className="card page-section category-weights-section">

      <h3 className="page-section__title">Habit weights</h3>

      <p className="muted-text">

        Set how much each habit counts toward your <strong>{category}</strong> score. Weights should sum to 100%.

      </p>

      <WeightEditor

        items={items}

        habits={categoryHabits}

        onChange={(next) => {

          setIsEditing(true);

          setItems(next);

          setWeights(category, itemsToCategoryWeights(next));

        }}

        onNormalize={() => {

          setIsEditing(false);

          const normalized = toWeightItems(itemsToCategoryWeights(items), habits, category);

          setItems(normalized);

          setWeights(category, itemsToCategoryWeights(normalized));

        }}

      />

      <table className="history-table weight-contrib-table">

        <thead>

          <tr>

            <th>Habit</th>

            <th>Weight</th>

            <th>Contribution</th>

          </tr>

        </thead>

        <tbody>

          {categoryHabits.map((habit) => {

            const value = logValueForHabit(logs, habit.id, selectedDate);

            const row = logs.find((l) => l.habitId === habit.id && l.date === selectedDate);

            const score = habitScore(habit, value, row?.isRest);

            const weight = resolved[habit.id] ?? 0;

            const contrib = score === null ? "—" : `${weightedScoreContribution(weight, score)} pts`;

            return (

              <tr key={habit.id}>

                <td>{habit.name}</td>

                <td>{weight}%</td>

                <td>{contrib}</td>

              </tr>

            );

          })}

        </tbody>

      </table>

    </section>

  );

}


