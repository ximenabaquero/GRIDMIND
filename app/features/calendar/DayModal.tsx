"use client";
import { useState, useRef, useMemo } from "react";
import { Modal } from "@/app/components/Modal";
import { useTrackStore } from "@/app/store/trackStore";
import { useGridStore } from "@/app/store/gridStore";
import { nanoid } from "@/app/lib/nanoid";
import { getWeekIdUTC, getDayIndexUTC } from "@/app/lib/types";
import type { Task } from "@/app/lib/types";
import type { DayTask, DayStatus } from "./useCalendarCells";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface DayModalProps {
  dateKey: string; // "YYYY-MM-DD"
  dayTasks: DayTask[];
  dayStatuses: DayStatus[];
  onClose: () => void;
}

function parseDateKey(dk: string): [number, number, number] {
  const [y, m, d] = dk.split("-").map(Number);
  return [y, m - 1, d];
}

export function DayModal({ dateKey, dayTasks, dayStatuses, onClose }: DayModalProps) {
  const { tracks } = useTrackStore();
  const { saveTasksForWeek } = useGridStore();

  const [y, m0, d] = parseDateKey(dateKey);
  const weekId = getWeekIdUTC(y, m0, d);
  const dayIndex = getDayIndexUTC(y, m0, d);
  const title = `${MONTH_NAMES[m0]} ${d}, ${y}`;

  // Local task state, initialized once from props (component remounts per dateKey)
  const [tasksByTrack, setTasksByTrack] = useState<Record<string, Task[]>>(() => {
    const grouped: Record<string, Task[]> = {};
    for (const dt of dayTasks) {
      if (!grouped[dt.track.id]) grouped[dt.track.id] = [];
      grouped[dt.track.id].push(dt.task);
    }
    return grouped;
  });

  const [newTaskText, setNewTaskText] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState(() => {
    const firstWithTasks = tracks.find((t) => dayTasks.some((dt) => dt.track.id === t.id));
    return firstWithTasks?.id ?? tracks[0]?.id ?? "";
  });
  const [saving, setSaving] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const tracksWithTasks = tracks.filter((t) => (tasksByTrack[t.id]?.length ?? 0) > 0);

  const toggleTask = async (trackId: string, taskId: string) => {
    if (togglingIds.has(taskId)) return;
    const previous = tasksByTrack[trackId] ?? [];
    const updated = previous.map((t) =>
      t.id === taskId ? { ...t, done: !t.done } : t
    );
    setTasksByTrack((prev) => ({ ...prev, [trackId]: updated }));
    setTogglingIds((prev) => new Set(prev).add(taskId));
    setError(null);
    try {
      await saveTasksForWeek(trackId, weekId, dayIndex, updated);
    } catch {
      setTasksByTrack((prev) => ({ ...prev, [trackId]: previous }));
      setError("Failed to save — check your connection and try again.");
    } finally {
      setTogglingIds((prev) => { const s = new Set(prev); s.delete(taskId); return s; });
    }
  };

  const addTask = async () => {
    const text = newTaskText.trim();
    if (!text || !selectedTrackId || saving) return;
    const newTask: Task = { id: nanoid(), text, done: false };
    const previous = tasksByTrack[selectedTrackId] ?? [];
    const updated = [...previous, newTask];
    setTasksByTrack((prev) => ({ ...prev, [selectedTrackId]: updated }));
    setNewTaskText("");
    setError(null);
    setSaving(true);
    try {
      await saveTasksForWeek(selectedTrackId, weekId, dayIndex, updated);
      inputRef.current?.focus();
    } catch {
      // Revert optimistic update and restore input text
      setTasksByTrack((prev) => ({ ...prev, [selectedTrackId]: previous }));
      setNewTaskText(text);
      setError("Failed to save — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (trackId: string, taskId: string) => {
    const previous = tasksByTrack[trackId] ?? [];
    const updated = previous.filter((t) => t.id !== taskId);
    setTasksByTrack((prev) => ({ ...prev, [trackId]: updated }));
    setError(null);
    try {
      await saveTasksForWeek(trackId, weekId, dayIndex, updated);
    } catch {
      setTasksByTrack((prev) => ({ ...prev, [trackId]: previous }));
      setError("Failed to save — check your connection and try again.");
    }
  };

  // Tracks with tasks on this day come first, then the rest
  const sortedTracks = useMemo(() => {
    const hasTasks = new Set(
      Object.keys(tasksByTrack).filter((id) => (tasksByTrack[id]?.length ?? 0) > 0)
    );
    return [...tracks].sort((a, b) => (hasTasks.has(a.id) ? 0 : 1) - (hasTasks.has(b.id) ? 0 : 1));
  }, [tracks, tasksByTrack]);

  return (
    <Modal open onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {/* Habit status for this day */}
        {tracks.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tracks.map((track) => {
              const isDone = dayStatuses.some((s) => s.track.id === track.id);
              return (
                <div
                  key={track.id}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px]"
                  style={{
                    backgroundColor: isDone ? `${track.color}22` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isDone ? track.color + "44" : "rgba(255,255,255,0.08)"}`,
                  }}
                  title={isDone ? `${track.name}: done` : `${track.name}: not done`}
                >
                  <span className="leading-none">{track.icon}</span>
                  <span style={{ color: isDone ? track.color : "rgba(255,255,255,0.3)" }}>
                    {track.name}
                  </span>
                  {isDone && (
                    <svg viewBox="0 0 8 8" fill="none" className="w-2 h-2 shrink-0">
                      <path d="M1 4l2 2 4-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: track.color }} />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tasks grouped by track */}
        {tracksWithTasks.length > 0 ? (
          <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
            {tracksWithTasks.map((track) => (
              <div key={track.id}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm leading-none">{track.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: track.color }}>
                    {track.name}
                  </span>
                </div>
                <ul className="flex flex-col gap-1 pl-1">
                  {(tasksByTrack[track.id] ?? []).map((task) => (
                    <li key={task.id} className="flex items-center gap-2 group/task">
                      <button
                        onClick={() => toggleTask(track.id, task.id)}
                        className="shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: task.done ? track.color : "transparent",
                          borderColor: task.done ? track.color : "rgba(255,255,255,0.2)",
                        }}
                      >
                        {task.done && (
                          <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                            <path
                              d="M2 5.5L4 7.5L8 3"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                      <span
                        className="flex-1 text-sm"
                        style={{
                          color: task.done ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.85)",
                          textDecoration: task.done ? "line-through" : "none",
                        }}
                      >
                        {task.text}
                      </span>
                      <button
                        onClick={() => deleteTask(track.id, task.id)}
                        className="shrink-0 opacity-0 group-hover/task:opacity-100 focus-visible:opacity-100 w-4 h-4 flex items-center justify-center rounded transition-opacity text-text-muted hover:text-red-400"
                        aria-label="Delete task"
                      >
                        <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                          <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted text-center py-2">
            No tasks yet — add one below.
          </p>
        )}

        <div className="border-t border-border" />

        {/* Add task */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
            Add task
          </p>
          <div className="flex gap-2 min-w-0">
            <select
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
              className="min-w-0 max-w-[130px] shrink-0 bg-bg-elevated border border-border rounded-md px-2 py-2 text-sm text-text-primary outline-none focus:border-white/20 transition-colors"
            >
              {sortedTracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.name}
                </option>
              ))}
            </select>
            <input
              ref={inputRef}
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Task description…"
              className="flex-1 bg-bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-white/20 transition-colors"
            />
            <button
              onClick={addTask}
              disabled={!newTaskText.trim() || saving}
              className="px-3 py-2 rounded-md text-sm font-medium bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/25 transition-colors disabled:opacity-30"
            >
              Add
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
}
