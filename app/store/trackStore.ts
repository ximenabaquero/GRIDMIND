"use client";
import { create } from "zustand";
import type { Track } from "@/app/lib/types";
import {
  getActiveTracks,
  createTrack,
  updateTrack,
  archiveTrack,
  seedDefaultTracks,
  reorderTracks,
} from "@/app/db/queries/tracks";

interface TrackState {
  tracks: Track[];
  loaded: boolean;
  load: () => Promise<void>;
  addTrack: (data: Omit<Track, "id" | "createdAt" | "order">) => Promise<Track>;
  editTrack: (id: string, data: Partial<Omit<Track, "id" | "createdAt">>) => Promise<void>;
  removeTrack: (id: string) => Promise<void>;
  reorder: (ids: string[]) => Promise<void>;
}

export const useTrackStore = create<TrackState>((set, get) => ({
  tracks: [],
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    set({ loaded: true }); // block concurrent calls immediately
    await seedDefaultTracks();
    const tracks = await getActiveTracks();
    set({ tracks });
  },

  addTrack: async (data) => {
    const track = await createTrack(data);
    set((s) => ({ tracks: [...s.tracks, track] }));
    return track;
  },

  editTrack: async (id, data) => {
    await updateTrack(id, data);
    set((s) => ({
      tracks: s.tracks.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }));
  },

  removeTrack: async (id) => {
    await archiveTrack(id);
    set((s) => ({ tracks: s.tracks.filter((t) => t.id !== id) }));
  },

  reorder: async (ids) => {
    await reorderTracks(ids);
    set((s) => ({
      tracks: ids
        .map((id) => s.tracks.find((t) => t.id === id)!)
        .filter(Boolean),
    }));
  },
}));
