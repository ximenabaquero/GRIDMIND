"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Track, Cell } from "@/app/lib/types";

interface GridCellProps {
  track: Track;
  cell: Cell;
  isToday?: boolean;
  isBonus?: boolean;
  onClick: () => void;
}

export function GridCell({ track, cell, isToday, isBonus, onClick }: GridCellProps) {
  const isDone = cell.status === "done";
  const isGhost = cell.status === "ghost";
  const dimmed = isBonus && !isDone && !isGhost;

  const metricValue = isDone && cell.session?.metricEnd ? String(cell.session.metricEnd) : null;
  const metricUnit: string = (track.config as any)?.metricUnit ?? "";

  const [tipVisible, setTipVisible] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = () => {
    if (!metricValue) return;
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setTipVisible(true);
      setTimeout(() => setTipVisible(false), 1800);
    }, 450);
  };

  const handleTouchEnd = () => cancelLongPress();
  const handleTouchMove = () => cancelLongPress();

  const handleClick = () => {
    if (didLongPress.current) {
      didLongPress.current = false;
      return;
    }
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      disabled={isGhost}
      whileTap={!isGhost ? { scale: 0.88 } : undefined}
      className={[
        "relative w-full aspect-square rounded-md transition-all duration-150 outline-none",
        "focus-visible:ring-2 focus-visible:ring-white/30",
        isGhost
          ? "cursor-default"
          : "cursor-pointer hover:brightness-125 active:brightness-110",
        isToday && !isDone ? "ring-1 ring-white/20" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundColor: isDone
          ? track.color
          : `${track.color}18`,
        border: isDone
          ? "none"
          : `1.5px ${dimmed ? "dashed" : "solid"} ${track.color}${isGhost ? "22" : "55"}`,
        boxShadow: isDone ? `0 0 12px ${track.color}55` : "none",
      }}
      title={metricValue ? `${metricValue}${metricUnit ? ` ${metricUnit}` : ""}` : undefined}
    >
      {/* Long-press metric tooltip (mobile) */}
      <AnimatePresence>
        {tipVisible && metricValue && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap"
          >
            <div
              className="text-[11px] font-semibold px-2 py-1 rounded-md shadow-xl border border-white/15"
              style={{ backgroundColor: track.color, color: "rgba(0,0,0,0.85)" }}
            >
              {metricValue}{metricUnit ? ` ${metricUnit}` : ""}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDone && (
          <motion.div
            key="fill"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* If practice with metric, show the value; else show check */}
            {cell.session?.metricEnd ? (
              <span
                className="text-[9px] font-bold leading-none"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                {cell.session.metricEnd}
              </span>
            ) : (
              <motion.svg
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.25, delay: 0.05 }}
                viewBox="0 0 12 12"
                fill="none"
                className="w-3/5 h-3/5"
              >
                <motion.path
                  d="M2 6.5L5 9.5L10 3"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task progress dots */}
      {!isDone && !isGhost && cell.tasks && cell.tasks.length > 0 && (
        <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
          {cell.tasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{
                backgroundColor: task.done ? track.color : `${track.color}44`,
                boxShadow: task.done ? `0 0 4px ${track.color}88` : "none",
              }}
            />
          ))}
        </div>
      )}

      {/* Ghost overlay */}
      {isGhost && (
        <div
          className="absolute inset-0 rounded-md"
          style={{ backgroundColor: `${track.color}08` }}
        />
      )}
    </motion.button>
  );
}
