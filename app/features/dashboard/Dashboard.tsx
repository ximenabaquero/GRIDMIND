"use client";
import { useMemo } from "react";
import { useTrackStore } from "@/app/store/trackStore";
import { useGridStore } from "@/app/store/gridStore";

const TILE_COLORS = ["#8B5CF6", "#F59E0B", "#3B82F6"];

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TILE_COLORS.map((color, i) => (
        <div
          key={i}
          className="relative flex flex-col gap-1.5 bg-bg-surface border border-border rounded-xl p-3 overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl" style={{ backgroundColor: color }} />
          <div className="h-2.5 w-10 rounded bg-white/5 animate-pulse mt-0.5" />
          <div className="h-7 w-14 rounded bg-white/5 animate-pulse" />
          <div className="h-2 w-16 rounded bg-white/5 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function Dashboard() {
  const { tracks, loaded } = useTrackStore();
  const { cells, weekId } = useGridStore();

  const stats = useMemo(() => {
    const weekCells = Object.values(cells).filter((c) => c.weekId === weekId);
    const doneCells = weekCells.filter((c) => c.status === "done");
    const totalTarget = tracks.reduce((a, t) => a + t.weeklyTarget, 0);
    const pct = totalTarget > 0 ? Math.round((doneCells.length / totalTarget) * 100) : 0;

    const practiceTracks = tracks.filter((t) => t.type === "practice");
    const practiceMinutes = doneCells
      .filter((c) => practiceTracks.some((t) => t.id === c.trackId))
      .reduce((acc, c) => acc + Math.floor((c.session?.duration ?? 0) / 60), 0);

    const today = new Date().getDay();
    const todayIndex = today === 0 ? 6 : today - 1;
    const todayDone = doneCells.filter((c) => c.dayIndex === todayIndex).length;
    const remaining = Math.max(0, tracks.length - todayDone);

    return { pct, doneCells: doneCells.length, totalTarget, practiceMinutes, remaining };
  }, [cells, tracks, weekId]);

  if (!loaded) return <DashboardSkeleton />;

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
          className="relative flex flex-col gap-1.5 bg-bg-surface border border-border rounded-xl p-3 overflow-hidden"
        >
          <div
            className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl"
            style={{ backgroundColor: tile.color }}
          />
          <p className="text-[10px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: `${tile.color}99` }}>
            {tile.label}
          </p>
          <p
            className="text-[26px] font-bold leading-none tabular-nums"
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
