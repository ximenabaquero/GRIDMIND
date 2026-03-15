"use client";
import { useState, useRef, KeyboardEvent } from "react";
import type { Track, Cell, Task } from "@/app/lib/types";
import { useGridStore } from "@/app/store/gridStore";
import { useUIStore } from "@/app/store/uiStore";
import { nanoid } from "@/app/lib/nanoid";

interface TasksModalProps {
  track: Track;
  cell: Cell;
}

export function TasksModal({ track, cell }: TasksModalProps) {
  const { saveTasks, toggleCell, cells } = useGridStore();
  const { closeModal } = useUIStore();

  // Use the live cell from the store so task updates reflect immediately
  const liveCell = cells[cell.id] ?? cell;
  const [tasks, setTasks] = useState<Task[]>(liveCell.tasks ?? []);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isDone = liveCell.status === "done";

  const persistTasks = async (updated: Task[]) => {
    setTasks(updated);
    await saveTasks(track.id, cell.dayIndex, updated);
  };

  const addTask = async () => {
    const text = input.trim();
    if (!text) return;
    const updated = [...tasks, { id: nanoid(), text, done: false }];
    setInput("");
    await persistTasks(updated);
    inputRef.current?.focus();
  };

  const toggleTask = async (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    await persistTasks(updated);
  };

  const removeTask = async (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    await persistTasks(updated);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") addTask();
  };

  const handleToggleDone = async () => {
    await toggleCell(track.id, cell.dayIndex);
    closeModal();
  };

  const doneTasks = tasks.filter((t) => t.done).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Track header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{track.icon}</span>
          <div>
            <p className="font-semibold text-text-primary">{track.name}</p>
            {tasks.length > 0 && (
              <p className="text-xs text-text-muted">
                {doneTasks}/{tasks.length} tasks
              </p>
            )}
          </div>
        </div>
        {isDone && (
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${track.color}22`, color: track.color }}
          >
            Done
          </span>
        )}
      </div>

      {/* Task list */}
      {tasks.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-2 group">
              <button
                onClick={() => toggleTask(task.id)}
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
                onClick={() => removeTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-secondary transition-opacity text-xs px-1"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add task input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a task..."
          className="flex-1 bg-bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-white/20 transition-colors"
        />
        <button
          onClick={addTask}
          disabled={!input.trim()}
          className="px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-30"
          style={{ backgroundColor: `${track.color}22`, color: track.color, border: `1px solid ${track.color}44` }}
        >
          Add
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleToggleDone}
          className="flex-1 py-2.5 rounded-md text-sm font-semibold transition-colors"
          style={
            isDone
              ? { backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }
              : { backgroundColor: track.color, color: "#fff" }
          }
        >
          {isDone ? "Unmark done" : "Mark done"}
        </button>
        <button
          onClick={closeModal}
          className="px-4 py-2.5 rounded-md text-sm font-medium bg-white/4 hover:bg-white/8 text-text-muted transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
