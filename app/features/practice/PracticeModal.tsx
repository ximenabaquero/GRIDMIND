"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Track, Cell, PracticeSession, PracticeConfig } from "@/app/lib/types";
import { useGridStore } from "@/app/store/gridStore";
import { useUIStore } from "@/app/store/uiStore";

interface PracticeModalProps {
  track: Track;
  cell: Cell;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function PracticeModal({ track, cell }: PracticeModalProps) {
  const config = track.config as PracticeConfig;
  const { toggleCell } = useGridStore();
  const { closeModal } = useUIStore();

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [metricStart, setMetricStart] = useState<string>("");
  const [metricEnd, setMetricEnd] = useState<string>("");
  const [note, setNote] = useState("");
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(3);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const handleSave = async () => {
    stopTimer();
    const session: PracticeSession = {
      duration: elapsed,
      metricStart: metricStart ? Number(metricStart) : undefined,
      metricEnd: metricEnd ? Number(metricEnd) : undefined,
      note: note.trim() || undefined,
      rating,
    };
    await toggleCell(track.id, cell.dayIndex, session);
    // Haptic feedback on mobile
    if ("vibrate" in navigator) navigator.vibrate(50);
    closeModal();
  };

  const handleSkip = async () => {
    // Save without session details
    await toggleCell(track.id, cell.dayIndex);
    if ("vibrate" in navigator) navigator.vibrate(30);
    closeModal();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Track header */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">{track.icon}</span>
        <div>
          <p className="font-semibold text-text-primary">{track.name}</p>
          <p className="text-xs text-text-secondary">Practice session</p>
        </div>
      </div>

      {/* Timer — only if configured */}
      {config.hasTimer && (
        <div className="flex flex-col items-center gap-3 py-2">
          <p
            className="text-5xl font-mono font-bold tabular-nums tracking-tight"
            style={{ color: track.color }}
          >
            {formatTime(elapsed)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setRunning((r) => !r)}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{
                backgroundColor: running ? `${track.color}22` : track.color,
                color: running ? track.color : "#fff",
                border: `1px solid ${track.color}55`,
              }}
            >
              {running ? "Pause" : elapsed > 0 ? "Resume" : "Start"}
            </button>
            {elapsed > 0 && (
              <button
                onClick={() => { stopTimer(); setElapsed(0); }}
                className="px-4 py-1.5 rounded-md text-sm font-medium bg-white/5 hover:bg-white/10 text-text-secondary transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Metric inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary">
            {config.metricLabel} start
          </label>
          <input
            type="number"
            value={metricStart}
            onChange={(e) => setMetricStart(e.target.value)}
            placeholder="e.g. 60"
            className="bg-bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-white/20 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary">
            {config.metricLabel} end
          </label>
          <input
            type="number"
            value={metricEnd}
            onChange={(e) => setMetricEnd(e.target.value)}
            placeholder="e.g. 80"
            className="bg-bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-white/20 transition-colors"
          />
        </div>
      </div>

      {/* Notes */}
      {config.hasNotes && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary">Session note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`e.g. "Worked on F barre transition..."`}
            rows={2}
            className="bg-bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-white/20 transition-colors resize-none"
          />
        </div>
      )}

      {/* Rating */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-secondary">Session difficulty</label>
        <div className="flex gap-1.5">
          {([1, 2, 3, 4, 5] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRating(r)}
              className="text-lg transition-all"
              style={{ opacity: r <= rating ? 1 : 0.25 }}
            >
              ⭐
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          className="flex-1 py-2.5 rounded-md text-sm font-semibold transition-colors"
          style={{ backgroundColor: track.color, color: "#fff" }}
        >
          Mark done
        </button>
        <button
          onClick={handleSkip}
          className="px-4 py-2.5 rounded-md text-sm font-medium bg-white/6 hover:bg-white/10 text-text-secondary transition-colors"
        >
          Quick
        </button>
        <button
          onClick={closeModal}
          className="px-4 py-2.5 rounded-md text-sm font-medium bg-white/4 hover:bg-white/8 text-text-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
