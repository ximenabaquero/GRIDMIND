"use client";
import { useUIStore } from "@/app/store/uiStore";
import { WeeklyGrid } from "@/app/features/grid/WeeklyGrid";
import { Dashboard } from "@/app/features/dashboard/Dashboard";
import { ModalController } from "@/app/components/ModalController";

export default function Home() {
  const { openAddTrackModal } = useUIStore();

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-text-primary tracking-tight">GridMind</h1>
            <p className="text-xs text-text-muted">conquer the board</p>
          </div>
          <button
            onClick={openAddTrackModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white/6 hover:bg-white/10 text-text-secondary hover:text-text-primary border border-border transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Add track
          </button>
        </header>

        {/* Dashboard stats */}
        <Dashboard />

        {/* THE GRID */}
        <section>
          <WeeklyGrid />
        </section>

      </div>

      {/* Global modal controller */}
      <ModalController />
    </div>
  );
}
