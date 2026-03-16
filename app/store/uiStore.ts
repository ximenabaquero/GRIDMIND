"use client";
import { create } from "zustand";
import type { Track, Cell, BossResultData } from "@/app/lib/types";

type ActiveModal =
  | { kind: "practice"; track: Track; cell: Cell }
  | { kind: "tasks"; track: Track; cell: Cell }
  | { kind: "trackTasks"; track: Track; weekId: string }
  | { kind: "addTrack" }
  | { kind: "editTrack"; track: Track }
  | { kind: "bossResult"; data: BossResultData }
  | null;

interface UIState {
  modal: ActiveModal;
  openPracticeModal: (track: Track, cell: Cell) => void;
  openTasksModal: (track: Track, cell: Cell) => void;
  openTrackTasksModal: (track: Track, weekId: string) => void;
  openAddTrackModal: () => void;
  openEditTrackModal: (track: Track) => void;
  openBossResultModal: (data: BossResultData) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  modal: null,
  openPracticeModal: (track, cell) =>
    set({ modal: { kind: "practice", track, cell } }),
  openTasksModal: (track, cell) =>
    set({ modal: { kind: "tasks", track, cell } }),
  openTrackTasksModal: (track, weekId) =>
    set({ modal: { kind: "trackTasks", track, weekId } }),
  openAddTrackModal: () => set({ modal: { kind: "addTrack" } }),
  openEditTrackModal: (track) => set({ modal: { kind: "editTrack", track } }),
  openBossResultModal: (data) => set({ modal: { kind: "bossResult", data } }),
  closeModal: () => set({ modal: null }),
}));
