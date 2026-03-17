"use client";
import { useState, KeyboardEvent } from "react";
import type { Track, Task } from "@/app/lib/types";
import { DAY_LABELS } from "@/app/lib/types";
import { useGridStore } from "@/app/store/gridStore";
import { useUIStore } from "@/app/store/uiStore";
import { nanoid } from "@/app/lib/nanoid";

interface TrackTasksModalProps {
  track: Track;
  weekId: string;
}

export function TrackTasksModal({ track, weekId }: TrackTasksModalProps) {
  const { cells, saveTasks } = useGridStore();
  const { closeModal, openEditTrackModal } = useUIStore();

  const [addingDay, setAddingDay] = useState<number | null>(null);
  const [inputText, setInputText] = useState("");
  const [editingTask, setEditingTask] = useState<{ dayIndex: number; taskId: string } | null>(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const getTasksForDay = (dayIndex: number): Task[] => {
    const id = `${track.id}_${weekId}_${dayIndex}`;
    return cells[id]?.tasks ?? [];
  };

  const toggleTask = async (dayIndex: number, taskId: string) => {
    setError(null);
    try {
      const tasks = getTasksForDay(dayIndex);
      const updated = tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t));
      await saveTasks(track.id, dayIndex, updated);
    } catch {
      setError("Failed to save — check your connection and try again.");
    }
  };

  const removeTask = async (dayIndex: number, taskId: string) => {
    setError(null);
    try {
      const tasks = getTasksForDay(dayIndex);
      const updated = tasks.filter((t) => t.id !== taskId);
      await saveTasks(track.id, dayIndex, updated);
    } catch {
      setError("Failed to save — check your connection and try again.");
    }
  };

  const startEdit = (dayIndex: number, task: Task) => {
    setEditingTask({ dayIndex, taskId: task.id });
    setEditText(task.text);
  };

  const saveEdit = async () => {
    if (!editingTask) return;
    const text = editText.trim();
    if (!text) return;
    setError(null);
    try {
      const tasks = getTasksForDay(editingTask.dayIndex);
      const updated = tasks.map((t) => (t.id === editingTask.taskId ? { ...t, text } : t));
      await saveTasks(track.id, editingTask.dayIndex, updated);
      setEditingTask(null);
      setEditText("");
    } catch {
      setError("Failed to save — check your connection and try again.");
    }
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditText("");
  };

  const addTask = async (dayIndex: number) => {
    const text = inputText.trim();
    if (!text) return;
    setError(null);
    try {
      const tasks = getTasksForDay(dayIndex);
      const updated = [...tasks, { id: nanoid(), text, done: false }];
      setInputText("");
      setAddingDay(null);
      await saveTasks(track.id, dayIndex, updated);
    } catch {
      setInputText(text); // restore on failure
      setError("Failed to save — check your connection and try again.");
    }
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>, dayIndex: number) => {
    if (e.key === "Enter") await addTask(dayIndex);
    if (e.key === "Escape") { setAddingDay(null); setInputText(""); }
  };

  const handleEditKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") await saveEdit();
    if (e.key === "Escape") cancelEdit();
  };

  // Summary
  let totalCount = 0;
  let doneCount = 0;
  for (let i = 0; i < 7; i++) {
    const t = getTasksForDay(i);
    totalCount += t.length;
    doneCount += t.filter((t) => t.done).length;
  }

  const daysWithTasks = Array.from({ length: 7 }, (_, i) => i).filter(
    (i) => getTasksForDay(i).length > 0
  );

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      {/* Summary */}
      {totalCount > 0 ? (
        <p className="text-xs text-text-muted">
          {totalCount - doneCount} pending · {doneCount} done this week
        </p>
      ) : (
        <p className="text-xs text-text-muted">No tasks added yet this week.</p>
      )}

      {/* Days with tasks */}
      <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
        {daysWithTasks.length === 0 && addingDay === null && (
          <p className="text-sm text-text-muted/50 text-center py-4">
            Click a day below to add tasks.
          </p>
        )}

        {Array.from({ length: 7 }, (_, dayIndex) => {
          const tasks = getTasksForDay(dayIndex);
          const isAdding = addingDay === dayIndex;

          if (tasks.length === 0 && !isAdding) return null;

          return (
            <div key={dayIndex}>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
                {DAY_LABELS[dayIndex]}
              </p>

              {tasks.length > 0 && (
                <ul className="flex flex-col gap-1 mb-2">
                  {tasks.map((task) => (
                    <li key={task.id} className="flex items-center gap-2 group">
                      {editingTask?.dayIndex === dayIndex && editingTask?.taskId === task.id ? (
                        <>
                          <div className="shrink-0 w-4" />
                          <input
                            autoFocus
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            className="flex-1 bg-bg-elevated border border-border rounded-md px-2 py-1 text-sm text-text-primary outline-none focus:border-white/20 transition-colors"
                          />
                          <button
                            onClick={saveEdit}
                            className="text-xs px-2 py-1 rounded transition-colors"
                            style={{ backgroundColor: `${track.color}22`, color: track.color }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-text-muted hover:text-text-secondary transition-colors text-xs px-2 py-1 rounded hover:bg-white/5"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => toggleTask(dayIndex, task.id)}
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
                            onClick={() => startEdit(dayIndex, task)}
                            className="flex-1 text-sm cursor-text hover:text-text-primary transition-colors"
                            style={{
                              color: task.done ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.85)",
                              textDecoration: task.done ? "line-through" : "none",
                            }}
                          >
                            {task.text}
                          </span>
                          <button
                            onClick={() => removeTask(dayIndex, task.id)}
                            className="text-text-muted hover:text-text-secondary transition-colors text-xs px-2 py-1 rounded hover:bg-white/5"
                            aria-label="Delete task"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {isAdding ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, dayIndex)}
                    placeholder="New task..."
                    className="flex-1 bg-bg-elevated border border-border rounded-md px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-white/20 transition-colors"
                  />
                  <button
                    onClick={() => addTask(dayIndex)}
                    disabled={!inputText.trim()}
                    className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-30"
                    style={{
                      backgroundColor: `${track.color}22`,
                      color: track.color,
                      border: `1px solid ${track.color}44`,
                    }}
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setAddingDay(dayIndex); setInputText(""); }}
                  className="text-[11px] text-text-muted/50 hover:text-text-muted transition-colors"
                >
                  + add task
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add task to a day that has no tasks yet */}
      {addingDay === null && (
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 7 }, (_, i) => i)
            .filter((i) => getTasksForDay(i).length === 0)
            .map((dayIndex) => (
              <button
                key={dayIndex}
                onClick={() => { setAddingDay(dayIndex); setInputText(""); }}
                className="text-[11px] px-2 py-1 rounded border border-border text-text-muted/60 hover:text-text-muted hover:border-white/20 transition-colors"
              >
                + {DAY_LABELS[dayIndex]}
              </button>
            ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex gap-2 pt-1 border-t border-border">
        <button
          onClick={() => { closeModal(); setTimeout(() => openEditTrackModal(track), 50); }}
          className="px-4 py-2.5 rounded-md text-sm font-medium bg-white/4 hover:bg-white/8 text-text-muted transition-colors"
        >
          Edit track
        </button>
        <button
          onClick={closeModal}
          className="flex-1 py-2.5 rounded-md text-sm font-medium bg-white/4 hover:bg-white/8 text-text-muted transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
