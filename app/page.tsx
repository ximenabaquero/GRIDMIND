"use client";
import { useState } from "react";
import { useUIStore } from "@/app/store/uiStore";
import { WeeklyGrid } from "@/app/features/grid/WeeklyGrid";
import { Dashboard } from "@/app/features/dashboard/Dashboard";
import { CalendarMonth } from "@/app/features/calendar/CalendarMonth";
import { ModalController } from "@/app/components/ModalController";

type View = "grid" | "calendar";

export default function Home() {
  const { openAddTrackModal } = useUIStore();
  const [view, setView] = useState<View>("grid");

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 flex flex-col gap-6">

        {/* Header */}
        <header className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              GridMind
            </h1>
            <p className="text-xs text-text-muted mt-0.5">conquer the board</p>
          </div>
          <button
            onClick={openAddTrackModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/25 hover:border-violet-500/40 transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add track
          </button>
        </header>

        {/* Dashboard stats */}
        <Dashboard />

        {/* View toggle */}
        <div className="flex items-center bg-bg-surface border border-border rounded-lg p-0.5 self-start">
          <button
            onClick={() => setView("grid")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              view === "grid"
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                : "text-text-muted hover:text-text-base"
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              view === "calendar"
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                : "text-text-muted hover:text-text-base"
            }`}
          >
            Calendar
          </button>
        </div>

        {/* Active view */}
        <section aria-label={view === "grid" ? "Weekly grid" : "Monthly calendar"}>
          {view === "grid" ? <WeeklyGrid /> : <CalendarMonth />}
        </section>

      </div>

      {/* Global modal controller */}
      <ModalController />
    </div>
  );
}
