"use client";
import { useMemo } from "react";
import { useTrackStore } from "@/app/store/trackStore";
import { useGridStore } from "@/app/store/gridStore";
import type { PracticeConfig } from "@/app/lib/types";

export function Dashboard() {
  const { tracks } = useTrackStore();
  const { cells, weekId } = useGridStore();

  const stats = useMemo(() => {
    const weekCells = Object.values(cells).filter((c) => c.weekId === weekId);
    const doneCells = weekCells.filter((c) => c.status === "done");
    const totalTarget = tracks.reduce((a, t) => a + t.weeklyTarget, 0);
    const pct = totalTarget > 0 ? Math.round((doneCells.length / totalTarget) * 100) : 0;

    // Guitar / practice minutes
    const practiceTracks = tracks.filter((t) => t.type === "practice");
    const practiceMinutes = doneCells
      .filter((c) => practiceTracks.some((t) => t.id === c.trackId))
      .reduce((acc, c) => acc + Math.floor((c.session?.duration ?? 0) / 60), 0);

    // Remaining today
    const today = new Date().getDay(); // 0=Sun
    const todayIndex = today === 0 ? 6 : today - 1; // Mon=0
    const todayDone = doneCells.filter((c) => c.dayIndex === todayIndex).length;
    const todayTarget = tracks.length;
    const remaining = Math.max(0, todayTarget - todayDone);

    return { pct, doneCells: doneCells.length, totalTarget, practiceMinutes, remaining };
  }, [cells, tracks, weekId]);

  const tiles = [
    {
      label: "Week",
      value: `${stats.pct}%`,
      sub: `${stats.doneCells}/${stats.totalTarget} squares`,
      color: "#8B5CF6",
    },
    {
      label: "Today left",
      value: stats.remaining === 0 ? "Done" : `${stats.remaining}`,
      sub: stats.remaining === 0 ? "All clear" : "tracks remaining",
      color: stats.remaining === 0 ? "#10B981" : "#F59E0B",
    },
    {
      label: "Practice",
      value: stats.practiceMinutes > 0 ? `${stats.practiceMinutes}m` : "—",
      sub: "this week",
      color: "#3B82F6",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="flex flex-col gap-1 bg-bg-surface border border-border rounded-xl p-3"
        >
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-medium">
            {tile.label}
          </p>
          <p
            className="text-2xl font-bold leading-none tabular-nums"
            style={{ color: tile.color }}
          >
            {tile.value}
          </p>
          <p className="text-[10px] text-text-muted leading-tight">{tile.sub}</p>
        </div>
      ))}
    </div>
  );
}
