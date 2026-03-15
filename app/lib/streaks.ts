import type { Cell } from "./types";
import { getMondayOfWeek, offsetWeek } from "./types";

export function computeStreak(
  cells: Cell[],
  weeklyTarget: number,
  currentWeekId: string
): number {
  if (weeklyTarget <= 0) return 0;

  // Count done cells per weekId, excluding the current (in-progress) week
  const doneCounts: Record<string, number> = {};
  const seenWeeks = new Set<string>();

  for (const cell of cells) {
    if (cell.weekId === currentWeekId) continue;
    seenWeeks.add(cell.weekId);
    if (cell.status === "done") {
      doneCounts[cell.weekId] = (doneCounts[cell.weekId] ?? 0) + 1;
    }
  }

  if (seenWeeks.size === 0) return 0;

  // Find the most recent past week with any data
  const sortedWeeks = Array.from(seenWeeks).sort(
    (a, b) => getMondayOfWeek(b).getTime() - getMondayOfWeek(a).getTime()
  );
  const mostRecentWeek = sortedWeeks[0];

  // Walk backward from most recent week, counting consecutive successes
  let streak = 0;
  let probe = mostRecentWeek;

  for (let i = 0; i < 52; i++) {
    const done = doneCounts[probe] ?? 0;
    if (done >= weeklyTarget) {
      streak++;
      probe = offsetWeek(probe, -1);
    } else {
      break;
    }
  }

  return streak;
}
