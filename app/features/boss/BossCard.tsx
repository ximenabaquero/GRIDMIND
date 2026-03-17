"use client";
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTrackStore } from "@/app/store/trackStore";
import { useGridStore } from "@/app/store/gridStore";
import { getBossForWeek } from "./bosses";
import { getWeekId } from "@/app/lib/types";
import type { BossResultData } from "@/app/lib/types";

function loadStoredResult(weekId: string): BossResultData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`boss_result_${weekId}`);
    if (!raw) return null;
    return JSON.parse(raw) as BossResultData;
  } catch {
    return null;
  }
}

function getTierIcon(pct: number): { icon: string; color: string } {
  if (pct >= 100) return { icon: "✓", color: "#10B981" };
  if (pct >= 70)  return { icon: "~", color: "#F59E0B" };
  return                  { icon: "✗", color: "#EF4444" };
}

export function BossCard() {
  const { tracks } = useTrackStore();
  const { cells, weekId } = useGridStore();
  const todayWeekId = getWeekId(new Date());
  const isFutureWeek = weekId > todayWeekId;
  const isPastWeek  = weekId < todayWeekId;
  const isCurrentWeek = weekId === todayWeekId;

  // localStorage reads live in useEffect — safe from SSR and private-mode crashes
  const [pastResult, setPastResult] = useState<BossResultData | null>(null);
  const [history, setHistory] = useState<{ weekId: string; result: BossResultData | null }[]>([]);

  useEffect(() => {
    try {
      const past = (isPastWeek && !isFutureWeek) ? loadStoredResult(weekId) : null;
      setPastResult(past);

      // Find all weeks with stored results, sorted newest-first, excluding current view
      const activeWeeks = Object.keys(localStorage)
        .filter((k) => k.startsWith("boss_result_"))
        .map((k) => k.slice("boss_result_".length))
        .filter((wid) => wid !== weekId)
        .sort()
        .reverse()
        .slice(0, 4)
        .reverse(); // oldest-first for left-to-right display

      setHistory(activeWeeks.map((wid) => ({ weekId: wid, result: loadStoredResult(wid) })));
    } catch {
      // localStorage unavailable (private mode, etc.)
      setPastResult(null);
      setHistory([]);
    }
  }, [weekId, isPastWeek, isFutureWeek]);

  const { boss, hpPct, doneCells, totalTarget } = useMemo(() => {
    const boss = getBossForWeek(weekId);
    const activeTracks = tracks.filter((t) => !t.archivedAt);
    const totalTarget = activeTracks.reduce((a, t) => a + t.weeklyTarget, 0);
    const doneCells = isPastWeek
      ? (pastResult?.doneCells ?? 0)
      : isFutureWeek
        ? 0
        : Object.values(cells).filter((c) => c.weekId === weekId && c.status === "done").length;
    const hpPct =
      totalTarget > 0
        ? Math.max(0, ((totalTarget - doneCells) / totalTarget) * 100)
        : 100;
    return { boss, hpPct, doneCells, totalTarget };
  }, [cells, tracks, weekId, isPastWeek, pastResult]);

  const hpColor =
    hpPct > 60 ? "#EF4444" : hpPct > 25 ? "#F59E0B" : "#10B981";

  const defeated = isCurrentWeek && hpPct === 0;

  // For past weeks, derive display from stored result
  const pastTier = pastResult ? getTierIcon(pastResult.pct) : null;

  return (
    <div className="col-span-3 relative flex items-center gap-3 bg-bg-surface border border-border rounded-xl p-3 overflow-hidden">
      {/* Colored top accent */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl transition-colors duration-700"
        style={{
          backgroundColor: isFutureWeek
            ? "rgba(139,92,246,0.4)"
            : isPastWeek
              ? (pastTier?.color ?? "#6B7280")
              : hpColor,
        }}
      />

      {/* Boss emoji */}
      <motion.div
        key={String(defeated)}
        className="text-3xl flex-shrink-0 select-none"
        animate={defeated ? { rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5 }}
      >
        {isFutureWeek
          ? boss.emoji
          : isPastWeek
            ? (pastResult ? (pastResult.pct >= 100 ? "💀" : pastResult.pct >= 70 ? "🩸" : "😈") : boss.emoji)
            : defeated ? "💀" : boss.emoji}
      </motion.div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-xs font-semibold text-text-primary truncate">
            {isFutureWeek
              ? boss.name
              : isPastWeek
                ? (pastResult
                    ? pastResult.pct >= 100 ? "Derrotado" : pastResult.pct >= 70 ? "Herido" : "Escapó"
                    : boss.name)
                : defeated ? "¡Derrotado!" : boss.name}
          </p>
          {isFutureWeek ? (
            <span className="ml-2 flex-shrink-0 text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/25">
              Upcoming
            </span>
          ) : (
            <p className="text-[10px] text-text-muted ml-2 flex-shrink-0 tabular-nums">
              {doneCells}/{totalTarget}
            </p>
          )}
        </div>

        {isFutureWeek ? (
          <p className="text-[10px] text-text-muted mb-1.5 truncate">{boss.flavor}</p>
        ) : isPastWeek ? (
          pastResult ? (
            <p className="text-[10px] mb-1.5" style={{ color: pastTier?.color }}>
              {pastResult.pct}% de daño infligido
            </p>
          ) : (
            <p className="text-[10px] text-text-muted mb-1.5 truncate">{boss.flavor}</p>
          )
        ) : (
          <p className="text-[10px] text-text-muted mb-1.5 truncate">
            {defeated ? "Has completado la semana" : boss.flavor}
          </p>
        )}

        {/* HP bar — only for current week */}
        {isCurrentWeek && (
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: hpColor }}
              animate={{ width: `${hpPct}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 18 }}
            />
          </div>
        )}

        {/* Mini history (only on current week) */}
        {isCurrentWeek && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[9px] text-text-muted uppercase tracking-widest">Historial</span>
            {history.map(({ weekId: wid, result }) => {
              const t = result ? getTierIcon(result.pct) : null;
              return (
                <span
                  key={wid}
                  className="text-[11px] font-bold"
                  style={{ color: t ? t.color : "#ffffff20" }}
                  title={result ? `${result.boss.name} — ${result.pct}%` : wid}
                >
                  {t ? t.icon : "·"}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* HP label — only current week */}
      {isCurrentWeek && (
        <p
          className="text-[10px] uppercase tracking-widest font-semibold flex-shrink-0"
          style={{ color: `${hpColor}99` }}
        >
          HP
        </p>
      )}
    </div>
  );
}
