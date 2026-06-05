export const WEIGHT_SLIDER_STEP = 5;

export interface WeightItem {
  habitId: string;
  weight: number;
}

export function snapWeight(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value / WEIGHT_SLIDER_STEP) * WEIGHT_SLIDER_STEP));
}

/** When locked, changing one slider scales the others to keep the total at 100%. */
export function applyLockedWeightChange(
  items: WeightItem[],
  changedIndex: number,
  rawNew: number,
): WeightItem[] {
  const n = items.length;
  if (n === 0) return items;
  if (n === 1) return [{ ...items[0]!, weight: 100 }];

  const newWeight = snapWeight(Math.min(100, Math.max(0, rawNew)));
  const next = items.map((item) => ({ ...item, weight: snapWeight(item.weight) }));
  next[changedIndex] = { ...next[changedIndex]!, weight: newWeight };

  const otherIndices = next.map((_, i) => i).filter((i) => i !== changedIndex);
  const budget = 100 - newWeight;

  if (otherIndices.length === 0) return next;

  const othersSum = otherIndices.reduce((sum, i) => sum + next[i]!.weight, 0);

  if (othersSum === 0 || budget <= 0) {
    distributeEvenly(next, otherIndices, budget);
    return next;
  }

  let distributed = 0;
  otherIndices.forEach((i, j) => {
    if (j === otherIndices.length - 1) {
      next[i] = { ...next[i]!, weight: snapWeight(Math.max(0, budget - distributed)) };
      return;
    }
    const share = snapWeight((next[i]!.weight / othersSum) * budget);
    next[i] = { ...next[i]!, weight: share };
    distributed += share;
  });

  reconcileTotal(next, changedIndex);
  return next;
}

function distributeEvenly(next: WeightItem[], indices: number[], budget: number) {
  if (indices.length === 0) return;
  const steps = Math.max(0, Math.floor(budget / WEIGHT_SLIDER_STEP));
  const per = Math.floor(steps / indices.length) * WEIGHT_SLIDER_STEP;
  let leftover = budget;
  indices.forEach((i, j) => {
    const w =
      j === indices.length - 1 ? snapWeight(Math.max(0, leftover)) : Math.min(leftover, per);
    next[i] = { ...next[i]!, weight: w };
    leftover -= w;
  });
}

function reconcileTotal(next: WeightItem[], pinnedIndex: number) {
  const total = next.reduce((sum, item) => sum + item.weight, 0);
  const diff = 100 - total;
  if (diff === 0) return;

  const adjustable = next
    .map((_, i) => i)
    .filter((i) => i !== pinnedIndex && next[i]!.weight > 0);
  const target = adjustable.length > 0 ? adjustable[adjustable.length - 1]! : pinnedIndex;
  next[target] = {
    ...next[target]!,
    weight: snapWeight(Math.max(0, Math.min(100, next[target]!.weight + diff))),
  };
}
