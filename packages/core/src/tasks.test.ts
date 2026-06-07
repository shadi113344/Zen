import { describe, expect, it } from "vitest";
import {
  orderTasksForDay,
  sortTasksByOrder,
  taskCompletedDate,
  taskCounts,
  taskCountsForPeriod,
  tasksForDay,
} from "./tasks";
import type { Task } from "./types";

const pending: Task = {
  id: "a",
  title: "Buy milk",
  done: false,
  createdAt: "2026-06-07T10:00:00Z",
  createdDate: "2026-06-07",
};
const doneToday: Task = {
  id: "b",
  title: "Call dentist",
  done: true,
  createdAt: "2026-06-07T09:00:00Z",
  createdDate: "2026-06-07",
  completedDate: "2026-06-07",
  completedAt: "2026-06-07T14:00:00Z",
};
const doneYesterday: Task = {
  id: "c",
  title: "Email",
  done: true,
  createdAt: "2026-06-05T10:00:00Z",
  createdDate: "2026-06-05",
  completedDate: "2026-06-06",
};

describe("tasksForDay", () => {
  const all = [pending, doneToday, doneYesterday];

  it("shows pending plus tasks completed that day", () => {
    expect(tasksForDay(all, "2026-06-07").map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("does not carry completed tasks to the next day", () => {
    expect(tasksForDay(all, "2026-06-08").map((t) => t.id)).toEqual(["a"]);
  });

  it("shows historical completions on past days", () => {
    expect(tasksForDay(all, "2026-06-06").map((t) => t.id)).toEqual(["c"]);
  });

  it("does not show tasks on days before they were added", () => {
    expect(tasksForDay(all, "2026-06-06").map((t) => t.id)).toEqual(["c"]);
    expect(tasksForDay(all, "2026-06-04").map((t) => t.id)).toEqual([]);
  });
});

describe("taskCompletedDate", () => {
  it("prefers completedDate over completedAt", () => {
    expect(taskCompletedDate(doneToday)).toBe("2026-06-07");
  });

  it("falls back to completedAt slice", () => {
    const t: Task = {
      id: "x",
      title: "Legacy",
      done: true,
      createdAt: "x",
      completedAt: "2026-06-04T18:30:00.000Z",
    };
    expect(taskCompletedDate(t)).toBe("2026-06-04");
  });
});

describe("taskCounts", () => {
  it("counts pending and completed totals", () => {
    expect(taskCounts([pending, doneToday, doneYesterday])).toEqual({ pending: 1, completed: 2 });
  });
});

describe("orderTasksForDay", () => {
  it("sorts open tasks by orderIndex with completed at the bottom", () => {
    const tasks: Task[] = [
      { ...doneToday, id: "done", orderIndex: 0 },
      { ...pending, id: "b", orderIndex: 2, title: "B" },
      { ...pending, id: "a", orderIndex: 1, title: "A" },
    ];
    expect(orderTasksForDay(tasks, "2026-06-07").map((t) => t.id)).toEqual(["a", "b", "done"]);
  });
});

describe("sortTasksByOrder", () => {
  it("falls back to createdAt when orderIndex ties", () => {
    const a: Task = { ...pending, id: "a", orderIndex: 1, createdAt: "2026-06-07T12:00:00Z" };
    const b: Task = { ...pending, id: "b", orderIndex: 1, createdAt: "2026-06-07T10:00:00Z" };
    expect(sortTasksByOrder([a, b]).map((t) => t.id)).toEqual(["b", "a"]);
  });
});

describe("taskCountsForPeriod", () => {
  const all = [pending, doneToday, doneYesterday];

  it("scopes completed to days in the range and pending to the period end", () => {
    expect(taskCountsForPeriod(all, ["2026-06-07"])).toEqual({ pending: 1, completed: 1 });
    expect(taskCountsForPeriod(all, ["2026-06-06", "2026-06-07"])).toEqual({ pending: 1, completed: 2 });
    expect(taskCountsForPeriod(all, ["2026-06-05", "2026-06-06"])).toEqual({ pending: 0, completed: 1 });
  });
});
