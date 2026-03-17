"use client";
import { useState, useEffect, useRef } from "react";
import type { Cell, Track, Task, CellStatus } from "@/app/lib/types";
import { getWeekIdUTC, getWeekDates } from "@/app/lib/types";
import { getCellsForWeeks } from "@/app/db/queries/cells";
import { useTrackStore } from "@/app/store/trackStore";
import { useGridStore } from "@/app/store/gridStore";

export interface DayTask {
  task: Task;
  cell: Cell;
  track: Track;
}

export interface DayStatus {
  track: Track;
  status: CellStatus;
}

export type DayTaskMap = Record<string, DayTask[]>; // key: "YYYY-MM-DD"
export type DayStatusMap = Record<string, DayStatus[]>;

function getWeekIdsForMonth(year: number, month: number): string[] {
  const weekIds = new Set<string>();
  const current = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  // Walk from start to end of month, one week at a time
  while (current <= lastDay) {
    const y = current.getUTCFullYear(), m = current.getUTCMonth(), d = current.getUTCDate();
    weekIds.add(getWeekIdUTC(y, m, d));
    current.setUTCDate(current.getUTCDate() + 7);
  }
  // Ensure the last day's week is included
  const y = lastDay.getUTCFullYear(), m = lastDay.getUTCMonth(), d = lastDay.getUTCDate();
  weekIds.add(getWeekIdUTC(y, m, d));
  return Array.from(weekIds);
}

export function useCalendarCells(year: number, month: number) {
  const { tracks } = useTrackStore();
  const changedWeekId = useGridStore((s) => s.changedWeekId);
  const [dayTaskMap, setDayTaskMap] = useState<DayTaskMap>({});
  const [dayStatusMap, setDayStatusMap] = useState<DayStatusMap>({});
  const [loading, setLoading] = useState(false);
  const loadedMonthRef = useRef("");
  // Tracks which weekIds belong to the currently displayed month
  const monthWeekIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (tracks.length === 0) return;

    const monthKey = `${year}-${month}`;
    const isMonthChange = loadedMonthRef.current !== monthKey;

    // If this re-render was triggered by a cell mutation, skip unless it
    // belongs to one of this month's weeks.
    if (!isMonthChange && changedWeekId !== null && !monthWeekIdsRef.current.has(changedWeekId)) {
      return;
    }

    if (isMonthChange) {
      setLoading(true);
      loadedMonthRef.current = monthKey;
    }

    const weekIds = getWeekIdsForMonth(year, month);
    monthWeekIdsRef.current = new Set(weekIds);

    getCellsForWeeks(weekIds)
      .then((cells) => {
        const trackById = Object.fromEntries(tracks.map((t) => [t.id, t]));
        const taskMap: DayTaskMap = {};
        const statusMap: DayStatusMap = {};

        for (const cell of cells) {
          const track = trackById[cell.trackId];
          if (!track) continue;

          const dates = getWeekDates(cell.weekId);
          const date = dates[cell.dayIndex];
          const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

          if (cell.status === "done") {
            if (!statusMap[dateKey]) statusMap[dateKey] = [];
            statusMap[dateKey].push({ track, status: cell.status });
          }

          if (cell.tasks?.length) {
            if (!taskMap[dateKey]) taskMap[dateKey] = [];
            for (const task of cell.tasks) {
              taskMap[dateKey].push({ task, cell, track });
            }
          }
        }

        setDayTaskMap(taskMap);
        setDayStatusMap(statusMap);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, tracks, changedWeekId]);

  return { dayTaskMap, dayStatusMap, loading };
}
