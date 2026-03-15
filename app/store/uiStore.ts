"use client";
import { create } from "zustand";
import type { Track, Cell } from "@/app/lib/types";

type ActiveModal =
  | { kind: "practice"; track: Track; cell: Cell }
  | { kind: "tasks"; track: Track; cell: Cell }
  | { kind: "addTrack" }
  | { kind: "editTrack"; track: Track }
  | null;

interface UIState {
  modal: ActiveModal;
  openPracticeModal: (track: Track, cell: Cell) => void;
  openTasksModal: (track: Track, cell: Cell) => void;
  openAddTrackModal: () => void;
  openEditTrackModal: (track: Track) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  modal: null,
  openPracticeModal: (track, cell) =>
    set({ modal: { kind: "practice", track, cell } }),
  openTasksModal: (track, cell) =>
    set({ modal: { kind: "tasks", track, cell } }),
  openAddTrackModal: () => set({ modal: { kind: "addTrack" } }),
  openEditTrackModal: (track) => set({ modal: { kind: "editTrack", track } }),
  closeModal: () => set({ modal: null }),
}));
