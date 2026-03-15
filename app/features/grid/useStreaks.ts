"use client";
import { useState, useEffect } from "react";
import type { Track } from "@/app/lib/types";
import { getWeekId } from "@/app/lib/types";
import { getCellsForTrack } from "@/app/db/queries/cells";
import { computeStreak } from "@/app/lib/streaks";
import { useGridStore } from "@/app/store/gridStore";

export function useStreaks(tracks: Track[]): Record<string, number> {
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const cellVersion = useGridStore((s) => s.cellVersion);
  const trackKey = tracks.map((t) => t.id).join(",");

  useEffect(() => {
    if (tracks.length === 0) return;
    const currentWeekId = getWeekId(new Date());

    Promise.all(
      tracks.map(async (track) => {
        const cells = await getCellsForTrack(track.id);
        return {
          id: track.id,
          streak: computeStreak(cells, track.weeklyTarget, currentWeekId),
        };
      })
    ).then((results) => {
      const map: Record<string, number> = {};
      for (const r of results) map[r.id] = r.streak;
      setStreaks(map);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackKey, cellVersion]);

  return streaks;
}
