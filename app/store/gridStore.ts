"use client";
import { create } from "zustand";
import type { Cell, PracticeSession, Task } from "@/app/lib/types";
import { getWeekId, offsetWeek } from "@/app/lib/types";
import { getCellsForWeek, markCellDone, markCellEmpty, upsertCell, updateCellTasks, ghostifyWeek } from "@/app/db/queries/cells";

interface GridState {
  weekId: string;
  cells: Record<string, Cell>; // keyed by cell.id
  loading: boolean;
  cellVersion: number;
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
}

export const useGridStore = create<GridState>((set, get) => ({
  weekId: getWeekId(new Date()),
  cells: {},
  loading: false,
  cellVersion: 0,
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
      const prevWeekId = offsetWeek(currentRealWeekId, -1);
      get().ghostifyPast(prevWeekId).catch(() => {});
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
      cellVersion: s.cellVersion + 1,
    }));
  },
}));
