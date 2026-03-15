"use client";
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

  return (
    <motion.button
      onClick={onClick}
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
      title={isDone && cell.session?.metricEnd ? `${cell.session.metricEnd} ${(track.config as any).metricUnit ?? ""}` : undefined}
    >
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
        <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
          {cell.tasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className="w-1 h-1 rounded-full"
              style={{
                backgroundColor: task.done ? track.color : `${track.color}44`,
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
