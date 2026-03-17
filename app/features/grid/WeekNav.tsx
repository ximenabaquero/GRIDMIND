"use client";
import { getWeekDates, getWeekId, DAY_LABELS } from "@/app/lib/types";

interface WeekNavProps {
  weekId: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

export function WeekNav({ weekId, onPrev, onNext, onToday }: WeekNavProps) {
  const dates = getWeekDates(weekId);
  const currentWeekId = getWeekId(new Date());
  const isCurrentWeek = weekId === currentWeekId;

  const start = dates[0];
  const end = dates[6];
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const label =
    start.getUTCMonth() === end.getUTCMonth()
      ? `${MONTH_NAMES[start.getUTCMonth()]} ${startDay} – ${endDay}, ${start.getUTCFullYear()}`
      : `${MONTH_NAMES[start.getUTCMonth()]} ${startDay} – ${MONTH_NAMES[end.getUTCMonth()]} ${endDay}, ${end.getUTCFullYear()}`;

  return (
    <div className="flex flex-col gap-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-text-primary">{label}</h2>
          {isCurrentWeek && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/8 text-text-secondary">
              This week
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isCurrentWeek && (
            <button
              onClick={onToday}
              className="text-[10px] font-medium px-2 py-1 rounded-full bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/25 hover:border-violet-500/40 transition-colors"
            >
              Today
            </button>
          )}
          <button
            onClick={onPrev}
            className="text-[10px] font-medium px-2 py-1 rounded-full bg-white/8 hover:bg-white/12 text-text-secondary hover:text-text-primary border border-white/10 hover:border-white/20 transition-colors"
          >
            ← Prev week
          </button>
          <button
            onClick={onNext}
            className="text-[10px] font-medium px-2 py-1 rounded-full bg-white/8 hover:bg-white/12 text-text-secondary hover:text-text-primary border border-white/10 hover:border-white/20 transition-colors"
          >
            Next week →
          </button>
        </div>
      </div>

      {/* Day labels + dates */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:block w-[10px] shrink-0" /> {/* spacer matching drag handle */}
        <div className="min-w-[44px] sm:min-w-[110px] shrink-0" /> {/* spacer matching track label */}
        <div className="flex-1 grid grid-cols-7 gap-1 sm:gap-1.5">
          {dates.map((date, i) => {
            const isToday =
              isCurrentWeek &&
              new Date().getUTCDay() === (i === 6 ? 0 : i + 1); // Mon=1..Sun=0
            return (
              <div key={i} className={`flex flex-col items-center gap-0.5 rounded-md py-1 ${isToday ? "bg-white/6" : ""}`}>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide leading-none ${
                    isToday ? "text-violet-300" : "text-text-muted"
                  }`}
                >
                  {DAY_LABELS[i]}
                </span>
                <span
                  className={`text-[12px] leading-none ${
                    isToday
                      ? "text-violet-200 font-bold"
                      : "text-text-muted"
                  }`}
                >
                  {date.getUTCDate()}
                </span>
              </div>
            );
          })}
        </div>
        <div className="hidden sm:block w-12 shrink-0" /> {/* spacer matching progress bar */}
      </div>
    </div>
  );
}
