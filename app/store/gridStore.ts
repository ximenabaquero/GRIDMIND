"use client";
import { create } from "zustand";
import type { Cell, PracticeSession, Task } from "@/app/lib/types";
import { getWeekId, offsetWeek } from "@/app/lib/types";
import { getCellsForWeek, markCellDone, markCellEmpty, upsertCell, updateCellTasks, ghostifyWeek, ghostifyAllPastWeeks } from "@/app/db/queries/cells";
import { useTrackStore } from "@/app/store/trackStore";
import { useUIStore } from "@/app/store/uiStore";
import { getBossForWeek } from "@/app/features/boss/bosses";

interface GridState {
  weekId: string;
  cells: Record<string, Cell>; // keyed by cell.id
  loading: boolean;
  changedWeekId: string | null; // weekId of the most recently mutated cell
  _startupGhostDone: boolean;

  // Navigation
  goToWeek: (weekId: string) => void;
  nextWeek: () => void;
  prevWeek: () => void;

  // Cell actions
  loadWeek: (weekId: string) => Promise<void>;
  ghostifyPast: (weekId: string) => Promise<void>;
  toggleCell: (trackId: string, dayIndex: number, session?: PracticeSession) => Promise<void>;
  ensureCell: (trackId: string, dayIndex: number) => Cell;
  saveTasks: (trackId: string, dayIndex: number, tasks: Task[]) => Promise<Cell>;
  saveTasksForWeek: (trackId: string, weekId: string, dayIndex: number, tasks: Task[]) => Promise<Cell>;
}

export const useGridStore = create<GridState>((set, get) => ({
  weekId: getWeekId(new Date()),
  cells: {},
  loading: false,
  changedWeekId: null,
  _startupGhostDone: false,

  ghostifyPast: async (weekId) => {
    await ghostifyWeek(weekId);
    // No store update needed: the user has already navigated away.
    // Cells reload fresh from DB the next time this week is visited.
  },

  loadWeek: async (weekId) => {
    const currentRealWeekId = getWeekId(new Date());
    if (!get()._startupGhostDone) {
      set({ _startupGhostDone: true });
      ghostifyAllPastWeeks(currentRealWeekId).catch(() => {});
    }
    // Update weekId and clear cells immediately — UI responds at once
    set({ loading: true, weekId, cells: {} });
    try {
      const rows = await getCellsForWeek(weekId);
      // Guard against a newer navigation having taken over
      if (get().weekId !== weekId) return;
      const map: Record<string, Cell> = {};
      for (const c of rows) map[c.id] = c;
      set({ cells: map, loading: false });
    } catch {
      if (get().weekId === weekId) set({ loading: false });
    }
  },

  // Navigation is synchronous: weekId updates instantly, cells load in background
  goToWeek: (weekId) => {
    const currentWeekId = get().weekId;
    const todayWeekId = getWeekId(new Date());

    // Show boss result when navigating away from the current real week
    if (
      typeof window !== "undefined" &&
      currentWeekId === todayWeekId &&
      weekId !== currentWeekId
    ) {
      const storageKey = `boss_result_${currentWeekId}`;
      if (!localStorage.getItem(storageKey)) {
        const cells = get().cells;
        const tracks = useTrackStore.getState().tracks;
        const doneCells = Object.values(cells).filter(
          (c) => c.weekId === currentWeekId && c.status === "done"
        ).length;
        const totalTarget = tracks.filter((t) => !t.archivedAt).reduce((s, t) => s + t.weeklyTarget, 0);
        if (totalTarget > 0) {
          const boss = getBossForWeek(currentWeekId);
          const pct = Math.round((doneCells / totalTarget) * 100);
          const resultData: import("@/app/lib/types").BossResultData = {
            won: pct >= 100,
            pct,
            doneCells,
            totalTarget,
            weekId: currentWeekId,
            boss,
          };
          localStorage.setItem(storageKey, JSON.stringify(resultData));
          useUIStore.getState().openBossResultModal(resultData);
        }
      }
    }

    get().loadWeek(weekId).catch(() => {});
  },

  nextWeek: () => {
    get().goToWeek(offsetWeek(get().weekId, 1));
  },

  prevWeek: () => {
    get().goToWeek(offsetWeek(get().weekId, -1));
  },

  ensureCell: (trackId, dayIndex) => {
    const { weekId, cells } = get();
    const id = `${trackId}_${weekId}_${dayIndex}`;
    if (cells[id]) return cells[id];
    return {
      id,
      trackId,
      weekId,
      dayIndex,
      status: "empty",
    };
  },

  saveTasks: async (trackId, dayIndex, tasks) => {
    let cell = get().ensureCell(trackId, dayIndex);
    if (!get().cells[cell.id]) {
      await upsertCell(cell);
    }
    const updated = await updateCellTasks(cell, tasks);
    set((s) => ({ cells: { ...s.cells, [updated.id]: updated } }));
    return updated;
  },

  saveTasksForWeek: async (trackId, weekId, dayIndex, tasks) => {
    const cellId = `${trackId}_${weekId}_${dayIndex}`;
    const cell: Cell = get().cells[cellId] ?? { id: cellId, trackId, weekId, dayIndex, status: "empty" };
    if (!get().cells[cellId]) {
      await upsertCell(cell);
    }
    const updated = await updateCellTasks(cell, tasks);
    set((s) => ({
      cells: { ...s.cells, [updated.id]: updated },
      changedWeekId: weekId,
    }));
    return updated;
  },

  toggleCell: async (trackId, dayIndex, session) => {
    const cell = get().ensureCell(trackId, dayIndex);

    let updated: Cell;
    if (cell.status === "done") {
      updated = await markCellEmpty(cell);
    } else {
      if (!get().cells[cell.id]) {
        await upsertCell(cell);
      }
      updated = await markCellDone(cell, session);
    }

    set((s) => ({
      cells: { ...s.cells, [updated.id]: updated },
      changedWeekId: get().weekId,
    }));
  },
}));
