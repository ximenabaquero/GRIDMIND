"use client";
import { create } from "zustand";
import type { Cell, PracticeSession, Task } from "@/app/lib/types";
import { getWeekId, offsetWeek, isWeekBefore } from "@/app/lib/types";
import { getCellsForWeek, markCellDone, markCellEmpty, upsertCell, updateCellTasks, ghostifyWeek } from "@/app/db/queries/cells";
import { nanoid } from "@/app/lib/nanoid";

interface GridState {
  weekId: string;
  cells: Record<string, Cell>; // keyed by cell.id
  loading: boolean;
  cellVersion: number;
  _startupGhostDone: boolean;

  // Navigation
  goToWeek: (weekId: string) => Promise<void>;
  nextWeek: () => Promise<void>;
  prevWeek: () => Promise<void>;

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
    const freshCells = await getCellsForWeek(weekId);
    const freshMap: Record<string, Cell> = {};
    for (const c of freshCells) freshMap[c.id] = c;
    set((s) => {
      const merged = { ...s.cells };
      for (const key of Object.keys(merged)) {
        if (merged[key].weekId === weekId) delete merged[key];
      }
      return { cells: { ...merged, ...freshMap } };
    });
  },

  loadWeek: async (weekId) => {
    const currentRealWeekId = getWeekId(new Date());
    if (!get()._startupGhostDone) {
      set({ _startupGhostDone: true });
      const prevWeekId = offsetWeek(currentRealWeekId, -1);
      await get().ghostifyPast(prevWeekId);
    }
    set({ loading: true });
    const rows = await getCellsForWeek(weekId);
    const map: Record<string, Cell> = {};
    for (const c of rows) map[c.id] = c;
    set({ cells: map, weekId, loading: false });
  },

  goToWeek: async (weekId) => {
    await get().loadWeek(weekId);
  },

  nextWeek: async () => {
    const leavingWeekId = get().weekId;
    const currentRealWeekId = getWeekId(new Date());
    if (isWeekBefore(leavingWeekId, currentRealWeekId)) {
      await get().ghostifyPast(leavingWeekId);
    }
    const next = offsetWeek(leavingWeekId, 1);
    await get().loadWeek(next);
  },

  prevWeek: async () => {
    const prev = offsetWeek(get().weekId, -1);
    await get().loadWeek(prev);
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
      // If cell doesn't exist in DB yet, persist it first
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
