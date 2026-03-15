"use client";
import type { Track, Cell } from "@/app/lib/types";
import { GridCell } from "./GridCell";
import { DAY_LABELS } from "@/app/lib/types";

interface GridRowProps {
  track: Track;
  cells: (Cell | null)[];   // length 7, null = virtual empty cell
  todayIndex: number;       // 0-6 or -1 if not current week
  streak: number;
  onCellClick: (dayIndex: number, cell: Cell | null) => void;
  onTrackClick: () => void;
  onDragHandlePointerDown: (e: React.PointerEvent) => void;
}

export function GridRow({
  track,
  cells,
  todayIndex,
  streak,
  onCellClick,
  onTrackClick,
  onDragHandlePointerDown,
}: GridRowProps) {
  const doneCount = cells.filter((c) => c?.status === "done").length;
  const pct = Math.round((doneCount / track.weeklyTarget) * 100);

  return (
    <div className="flex items-center gap-2 sm:gap-3 group">
      {/* Drag handle */}
      <div
        onPointerDown={onDragHandlePointerDown}
        className="opacity-0 group-hover:opacity-40 hover:!opacity-100 cursor-grab active:cursor-grabbing shrink-0 flex items-center touch-none"
        title="Drag to reorder"
      >
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" className="text-text-muted">
          <circle cx="2.5" cy="2.5"  r="1.5"/>
          <circle cx="7.5" cy="2.5"  r="1.5"/>
          <circle cx="2.5" cy="8"    r="1.5"/>
          <circle cx="7.5" cy="8"    r="1.5"/>
          <circle cx="2.5" cy="13.5" r="1.5"/>
          <circle cx="7.5" cy="13.5" r="1.5"/>
        </svg>
      </div>

      {/* Track label */}
      <button
        onClick={onTrackClick}
        className="flex items-center gap-1.5 min-w-[90px] sm:min-w-[110px] text-left shrink-0 rounded-md px-1.5 py-1 hover:bg-white/5 transition-colors"
      >
        <span className="text-base leading-none">{track.icon}</span>
        <div className="overflow-hidden">
          <p className="text-xs font-medium text-text-primary truncate leading-tight">
            {track.name}
          </p>
          <p className="text-[10px] text-text-muted leading-tight">
            {doneCount}/{track.weeklyTarget}
          </p>
          {streak >= 1 && (
            <p className="text-[10px] font-semibold text-orange-400 leading-tight">
              🔥{streak}
            </p>
          )}
        </div>
      </button>

      {/* Cells */}
      <div className="flex-1 grid grid-cols-7 gap-1 sm:gap-1.5">
        {cells.map((cell, i) => {
          const virtualCell: Cell = cell ?? {
            id: `${track.id}_virtual_${i}`,
            trackId: track.id,
            weekId: "",
            dayIndex: i,
            status: "empty",
          };
          return (
            <GridCell
              key={i}
              track={track}
              cell={virtualCell}
              isToday={todayIndex === i}
              isBonus={i >= track.weeklyTarget}
              onClick={() => onCellClick(i, cell)}
            />
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="hidden sm:flex items-center w-12 shrink-0">
        <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: track.color,
            }}
          />
        </div>
      </div>
    </div>
  );
}
