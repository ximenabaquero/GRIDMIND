"use client";
import { useEffect, useCallback, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { useTrackStore } from "@/app/store/trackStore";
import { useGridStore } from "@/app/store/gridStore";
import { useUIStore } from "@/app/store/uiStore";
import { getWeekId } from "@/app/lib/types";
import type { Track, Cell } from "@/app/lib/types";
import { WeekNav } from "./WeekNav";
import { GridRow } from "./GridRow";
import { useStreaks } from "./useStreaks";

interface SortableRowProps {
  track: Track;
  cells: (Cell | null)[];
  todayIndex: number;
  streak: number;
  onCellClick: (dayIndex: number, cell: Cell | null) => void;
  onTrackClick: () => void;
  onDragEnd: () => void;
}

function SortableRow({ track, cells, todayIndex, streak, onCellClick, onTrackClick, onDragEnd }: SortableRowProps) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={track}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      className="list-none"
    >
      <GridRow
        track={track}
        cells={cells}
        todayIndex={todayIndex}
        streak={streak}
        onCellClick={onCellClick}
        onTrackClick={onTrackClick}
        onDragHandlePointerDown={(e) => controls.start(e)}
      />
    </Reorder.Item>
  );
}

export function WeeklyGrid() {
  const { tracks, loaded, load, reorder } = useTrackStore();
  const { weekId, cells, loading, loadWeek, nextWeek, prevWeek, goToWeek, toggleCell, ensureCell } =
    useGridStore();
  const { openPracticeModal, openTasksModal, openTrackTasksModal } = useUIStore();

  const [orderedTracks, setOrderedTracks] = useState<Track[]>(tracks);

  // Sync when tracks load from DB
  useEffect(() => { setOrderedTracks(tracks); }, [tracks]);

  // Load tracks + current week on mount
  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  useEffect(() => {
    loadWeek(weekId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayIndex = useCallback(() => {
    const today = getWeekId(new Date());
    if (weekId !== today) return -1;
    const day = new Date().getDay(); // 0=Sun, 1=Mon…6=Sat
    return day === 0 ? 6 : day - 1; // convert to Mon=0…Sun=6
  }, [weekId]);

  const handleCellClick = useCallback(
    (track: Track, dayIndex: number, existingCell: Cell | null) => {
      if (track.type === "practice" && existingCell?.status !== "done") {
        const cell = ensureCell(track.id, dayIndex);
        openPracticeModal(track, cell);
      } else if (track.type === "effort" || track.type === "habit") {
        const cell = ensureCell(track.id, dayIndex);
        openTasksModal(track, cell);
      } else {
        toggleCell(track.id, dayIndex);
      }
    },
    [ensureCell, openPracticeModal, openTasksModal, toggleCell]
  );

  const handleDragEnd = useCallback(() => {
    reorder(orderedTracks.map((t) => t.id));
  }, [orderedTracks, reorder]);

  const todayIdx = todayIndex();
  const streaks = useStreaks(tracks);

  // Overplanning indicator
  const totalCells = orderedTracks.reduce((acc, t) => acc + t.weeklyTarget, 0);
  const overplanning = totalCells > 35;

  return (
    <div className="flex flex-col gap-4">
      <WeekNav weekId={weekId} onPrev={prevWeek} onNext={nextWeek} onToday={() => goToWeek(getWeekId(new Date()))} />

      {overplanning && (
        <div className="text-[11px] text-amber-400/70 bg-amber-400/5 border border-amber-400/15 rounded-md px-3 py-1.5">
          Probability of suffering detected — {totalCells} squares this week.
        </div>
      )}

      {loading && orderedTracks.length === 0 ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 rounded-md bg-white/3 animate-pulse" />
          ))}
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={orderedTracks}
          onReorder={setOrderedTracks}
          className="flex flex-col gap-2"
        >
          {orderedTracks.map((track) => {
            const trackCells: (Cell | null)[] = Array.from({ length: 7 }, (_, i) => {
              const id = `${track.id}_${weekId}_${i}`;
              return cells[id] ?? null;
            });

            return (
              <SortableRow
                key={track.id}
                track={track}
                cells={trackCells}
                todayIndex={todayIdx}
                streak={streaks[track.id] ?? 0}
                onCellClick={(dayIndex, cell) => handleCellClick(track, dayIndex, cell)}
                onTrackClick={() => openTrackTasksModal(track, weekId)}
                onDragEnd={handleDragEnd}
              />
            );
          })}
        </Reorder.Group>
      )}
    </div>
  );
}
