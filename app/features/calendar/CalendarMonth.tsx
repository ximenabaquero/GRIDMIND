"use client";
import { useState } from "react";
import { useCalendarCells } from "./useCalendarCells";
import { DayModal } from "./DayModal";
import type { DayTask } from "./useCalendarCells";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CalendarDay {
  dateKey: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

function buildCalendarGrid(year: number, month: number): CalendarDay[] {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const lastOfMonth = new Date(Date.UTC(year, month + 1, 0));

  // Find Monday of the week containing the 1st
  const startDow = firstOfMonth.getUTCDay(); // 0=Sun…6=Sat
  const startOffset = startDow === 0 ? -6 : 1 - startDow;
  const gridStart = new Date(Date.UTC(year, month, 1 + startOffset));

  // Find Sunday of the week containing the last day
  const endDow = lastOfMonth.getUTCDay();
  const endOffset = endDow === 0 ? 0 : 7 - endDow;
  const gridEnd = new Date(lastOfMonth);
  gridEnd.setUTCDate(lastOfMonth.getUTCDate() + endOffset);

  // "Today" using local date components (consistent with getWeekId behavior)
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const days: CalendarDay[] = [];
  const cur = new Date(gridStart);
  while (cur <= gridEnd) {
    const y = cur.getUTCFullYear(), m = cur.getUTCMonth(), d = cur.getUTCDate();
    const dateKey = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({
      dateKey,
      dayOfMonth: d,
      isCurrentMonth: m === month,
      isToday: dateKey === todayKey,
    });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

export function CalendarMonth() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const { dayTaskMap, loading } = useCalendarCells(year, month);
  const days = buildCalendarGrid(year, month);

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  return (
    <div className="flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">
          {MONTH_NAMES[month]} {year}
          {loading && (
            <span className="ml-2 text-[10px] font-normal text-text-muted">…</span>
          )}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-md hover:bg-white/8 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Previous month"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-md hover:bg-white/8 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Next month"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
              <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-px">
        {DAY_HEADERS.map((label) => (
          <div
            key={label}
            className="text-center text-[10px] font-semibold uppercase tracking-wide text-text-muted py-1"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px">
        {days.map((day) => {
          const tasks: DayTask[] = dayTaskMap[day.dateKey] ?? [];
          const visibleTasks = tasks.slice(0, 3);
          const overflow = tasks.length - visibleTasks.length;

          return (
            <button
              key={day.dateKey}
              onClick={() => setSelectedDateKey(day.dateKey)}
              className={[
                "relative flex flex-col gap-0.5 p-1.5 rounded-md text-left transition-colors min-h-[56px]",
                "hover:bg-white/5",
                day.isToday
                  ? "ring-1 ring-violet-500/40 bg-violet-500/5"
                  : "bg-white/2",
                !day.isCurrentMonth ? "opacity-30" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span
                className={[
                  "text-[11px] font-semibold leading-none",
                  day.isToday ? "text-violet-300" : "text-text-secondary",
                ].join(" ")}
              >
                {day.dayOfMonth}
              </span>

              <div className="flex flex-col gap-px mt-0.5">
                {visibleTasks.map((dt) => (
                  <div
                    key={dt.task.id}
                    className="flex items-center gap-0.5 overflow-hidden"
                  >
                    <div
                      className="shrink-0 w-1 h-1 rounded-full"
                      style={{ backgroundColor: dt.track.color }}
                    />
                    <span
                      className="text-[9px] leading-tight truncate"
                      style={{
                        color: dt.task.done
                          ? "rgba(255,255,255,0.3)"
                          : "rgba(255,255,255,0.7)",
                        textDecoration: dt.task.done ? "line-through" : "none",
                      }}
                    >
                      {dt.task.text}
                    </span>
                  </div>
                ))}
                {overflow > 0 && (
                  <span className="text-[9px] text-text-muted leading-tight">
                    +{overflow} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Day detail modal — remounts per dateKey to reset local state */}
      {selectedDateKey && (
        <DayModal
          key={selectedDateKey}
          dateKey={selectedDateKey}
          dayTasks={dayTaskMap[selectedDateKey] ?? []}
          onClose={() => setSelectedDateKey(null)}
        />
      )}
    </div>
  );
}
