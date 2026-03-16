"use client";
import { useState, useRef } from "react";
import { Modal } from "@/app/components/Modal";
import { useTrackStore } from "@/app/store/trackStore";
import { useGridStore } from "@/app/store/gridStore";
import { nanoid } from "@/app/lib/nanoid";
import { getWeekIdUTC, getDayIndexUTC } from "@/app/lib/types";
import type { Task } from "@/app/lib/types";
import type { DayTask } from "./useCalendarCells";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface DayModalProps {
  dateKey: string; // "YYYY-MM-DD"
  dayTasks: DayTask[];
  onClose: () => void;
}

function parseDateKey(dk: string): [number, number, number] {
  const [y, m, d] = dk.split("-").map(Number);
  return [y, m - 1, d];
}

export function DayModal({ dateKey, dayTasks, onClose }: DayModalProps) {
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
  const [selectedTrackId, setSelectedTrackId] = useState(tracks[0]?.id ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  const tracksWithTasks = tracks.filter((t) => (tasksByTrack[t.id]?.length ?? 0) > 0);

  const toggleTask = async (trackId: string, taskId: string) => {
    const updated = (tasksByTrack[trackId] ?? []).map((t) =>
      t.id === taskId ? { ...t, done: !t.done } : t
    );
    setTasksByTrack((prev) => ({ ...prev, [trackId]: updated }));
    await saveTasksForWeek(trackId, weekId, dayIndex, updated);
  };

  const addTask = async () => {
    const text = newTaskText.trim();
    if (!text || !selectedTrackId) return;
    const newTask: Task = { id: nanoid(), text, done: false };
    const updated = [...(tasksByTrack[selectedTrackId] ?? []), newTask];
    setTasksByTrack((prev) => ({ ...prev, [selectedTrackId]: updated }));
    setNewTaskText("");
    await saveTasksForWeek(selectedTrackId, weekId, dayIndex, updated);
    inputRef.current?.focus();
  };

  return (
    <Modal open onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">

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
                    <li key={task.id} className="flex items-center gap-2">
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
          <div className="flex gap-2">
            <select
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
              className="bg-bg-elevated border border-border rounded-md px-2 py-2 text-sm text-text-primary outline-none focus:border-white/20 transition-colors"
            >
              {tracks.map((t) => (
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
              disabled={!newTaskText.trim()}
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
