"use client";
import { useState, useEffect, useRef } from "react";
import type { Cell, Track, Task } from "@/app/lib/types";
import { getWeekId, getWeekDates } from "@/app/lib/types";
import { getCellsForWeeks } from "@/app/db/queries/cells";
import { useTrackStore } from "@/app/store/trackStore";
import { useGridStore } from "@/app/store/gridStore";

export interface DayTask {
  task: Task;
  cell: Cell;
  track: Track;
}

export type DayTaskMap = Record<string, DayTask[]>; // key: "YYYY-MM-DD"

function getWeekIdsForMonth(year: number, month: number): string[] {
  const weekIds = new Set<string>();
  const current = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  // Walk from start to end of month, one week at a time
  while (current <= lastDay) {
    const y = current.getUTCFullYear(), m = current.getUTCMonth(), d = current.getUTCDate();
    weekIds.add(getWeekId(new Date(y, m, d)));
    current.setUTCDate(current.getUTCDate() + 7);
  }
  // Ensure the last day's week is included
  const y = lastDay.getUTCFullYear(), m = lastDay.getUTCMonth(), d = lastDay.getUTCDate();
  weekIds.add(getWeekId(new Date(y, m, d)));
  return Array.from(weekIds);
}

export function useCalendarCells(year: number, month: number) {
  const { tracks } = useTrackStore();
  const cellVersion = useGridStore((s) => s.cellVersion);
  const [dayTaskMap, setDayTaskMap] = useState<DayTaskMap>({});
  const [loading, setLoading] = useState(false);
  const loadedMonthRef = useRef("");

  useEffect(() => {
    if (tracks.length === 0) return;

    const monthKey = `${year}-${month}`;
    if (loadedMonthRef.current !== monthKey) {
      setLoading(true);
      loadedMonthRef.current = monthKey;
    }

    const weekIds = getWeekIdsForMonth(year, month);
    getCellsForWeeks(weekIds)
      .then((cells) => {
        const trackById = Object.fromEntries(tracks.map((t) => [t.id, t]));
        const map: DayTaskMap = {};

        for (const cell of cells) {
          if (!cell.tasks?.length) continue;
          const track = trackById[cell.trackId];
          if (!track) continue;

          const dates = getWeekDates(cell.weekId);
          const date = dates[cell.dayIndex];
          const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

          if (!map[dateKey]) map[dateKey] = [];
          for (const task of cell.tasks) {
            map[dateKey].push({ task, cell, track });
          }
        }

        setDayTaskMap(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, tracks, cellVersion]);

  return { dayTaskMap, loading };
}
