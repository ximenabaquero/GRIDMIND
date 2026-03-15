"use client";
import { useState } from "react";
import type { Track, TrackType, TrackConfig } from "@/app/lib/types";
import { useTrackStore } from "@/app/store/trackStore";
import { useUIStore } from "@/app/store/uiStore";

const PRESET_COLORS = [
  "#8B5CF6", // violet
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];

const PRESET_ICONS = ["🎸", "💪", "📚", "🏃", "🎨", "🎯", "📖", "🧘", "💻", "🎵", "🏋️", "🌱"];

interface TrackFormProps {
  existing?: Track;
}

export function TrackForm({ existing }: TrackFormProps) {
  const { addTrack, editTrack, removeTrack } = useTrackStore();
  const { closeModal } = useUIStore();

  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<TrackType>(existing?.type ?? "habit");
  const [color, setColor] = useState(existing?.color ?? PRESET_COLORS[0]);
  const [icon, setIcon] = useState(existing?.icon ?? "🎯");
  const [weeklyTarget, setWeeklyTarget] = useState(existing?.weeklyTarget ?? 5);

  // Effort-specific
  const [totalSquares, setTotalSquares] = useState(
    existing?.config.kind === "effort" ? existing.config.totalSquares : 5
  );
  const [subject, setSubject] = useState(
    existing?.config.kind === "effort" ? (existing.config.subject ?? "") : ""
  );

  // Practice-specific
  const [metricLabel, setMetricLabel] = useState(
    existing?.config.kind === "practice" ? existing.config.metricLabel : ""
  );
  const [metricUnit, setMetricUnit] = useState(
    existing?.config.kind === "practice" ? existing.config.metricUnit : ""
  );

  const buildConfig = (): TrackConfig => {
    if (type === "effort") return { kind: "effort", totalSquares, subject };
    if (type === "practice") return { kind: "practice", metricLabel, metricUnit, hasTimer: true, hasNotes: true };
    return { kind: "habit" };
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const data = {
      name: name.trim(),
      type,
      color,
      icon,
      weeklyTarget,
      config: buildConfig(),
    };
    if (existing) {
      await editTrack(existing.id, data);
    } else {
      await addTrack(data);
    }
    closeModal();
  };

  const handleDelete = async () => {
    if (!existing) return;
    await removeTrack(existing.id);
    closeModal();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Name + Icon */}
      <div className="flex gap-2">
        <div className="relative">
          <button className="w-10 h-10 flex items-center justify-center text-xl bg-bg-elevated border border-border rounded-md">
            {icon}
          </button>
          {/* Icon picker on click would be v2 — use emoji input for now */}
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            maxLength={2}
          />
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Track name…"
          autoFocus
          className="flex-1 bg-bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-white/25 transition-colors"
        />
      </div>

      {/* Quick icon picker */}
      <div>
        <p className="text-xs text-text-muted mb-1.5">Icon</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_ICONS.map((e) => (
            <button
              key={e}
              onClick={() => setIcon(e)}
              className={`text-lg p-1 rounded-md transition-colors ${icon === e ? "bg-white/12" : "hover:bg-white/6"}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Type */}
      <div>
        <p className="text-xs text-text-muted mb-1.5">Type</p>
        <div className="grid grid-cols-3 gap-1.5">
          {(["habit", "effort", "practice"] as TrackType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                type === t
                  ? "bg-white/12 text-text-primary"
                  : "bg-white/4 text-text-muted hover:bg-white/8"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <p className="text-xs text-text-muted mb-1.5">Color</p>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full transition-transform"
              style={{
                backgroundColor: c,
                transform: color === c ? "scale(1.25)" : "scale(1)",
                outline: color === c ? `2px solid ${c}` : "none",
                outlineOffset: "2px",
              }}
            />
          ))}
        </div>
      </div>

      {/* Weekly target */}
      <div>
        <p className="text-xs text-text-muted mb-1.5">
          Weekly target: <span className="text-text-primary font-medium">{weeklyTarget} days</span>
        </p>
        <input
          type="range"
          min={1}
          max={7}
          value={weeklyTarget}
          onChange={(e) => setWeeklyTarget(Number(e.target.value))}
          className="w-full accent-current"
          style={{ accentColor: color }}
        />
      </div>

      {/* Type-specific config */}
      {type === "effort" && (
        <div className="flex gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-text-muted">Effort squares</label>
            <input
              type="number"
              value={totalSquares}
              min={1}
              max={21}
              onChange={(e) => setTotalSquares(Number(e.target.value))}
              className="bg-bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text-primary outline-none focus:border-white/20"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-text-muted">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Math, Physics…"
              className="bg-bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-white/20"
            />
          </div>
        </div>
      )}

      {type === "practice" && (
        <div className="flex gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-text-muted">Metric label</label>
            <input
              type="text"
              value={metricLabel}
              onChange={(e) => setMetricLabel(e.target.value)}
              placeholder="BPM, words, km…"
              className="bg-bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-white/20"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-text-muted">Unit</label>
            <input
              type="text"
              value={metricUnit}
              onChange={(e) => setMetricUnit(e.target.value)}
              placeholder="bpm, wpm…"
              className="bg-bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-white/20"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="flex-1 py-2.5 rounded-md text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: color }}
        >
          {existing ? "Save changes" : "Add track"}
        </button>
        {existing && (
          <button
            onClick={handleDelete}
            className="px-4 py-2.5 rounded-md text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
          >
            Archive
          </button>
        )}
      </div>
    </div>
  );
}
