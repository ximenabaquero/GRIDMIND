import { supabase } from "@/app/lib/supabase";
import type { Cell, CellStatus, PracticeSession, Task } from "@/app/lib/types";

// ─── Mappers ────────────────────────────────────────────────────────────────

function rowToCell(row: Record<string, unknown>): Cell {
  return {
    id: row.id as string,
    trackId: row.track_id as string,
    weekId: row.week_id as string,
    dayIndex: row.day_index as number,
    status: row.status as CellStatus,
    completedAt: row.completed_at as number | undefined ?? undefined,
    session: row.session as PracticeSession | undefined ?? undefined,
    tasks: row.tasks as Task[] | undefined ?? undefined,
  };
}

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  return user!.id;
}

// ─── Queries ────────────────────────────────────────────────────────────────

export async function getCellsForWeek(weekId: string): Promise<Cell[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("cells")
    .select("*")
    .eq("user_id", userId)
    .eq("week_id", weekId);
  if (error) throw error;
  return (data ?? []).map(rowToCell);
}

export async function getCellsForTrack(trackId: string): Promise<Cell[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("cells")
    .select("*")
    .eq("user_id", userId)
    .eq("track_id", trackId);
  if (error) throw error;
  return (data ?? []).map(rowToCell);
}

export async function upsertCell(cell: Cell): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase.from("cells").upsert({
    id: cell.id,
    user_id: userId,
    track_id: cell.trackId,
    week_id: cell.weekId,
    day_index: cell.dayIndex,
    status: cell.status,
    completed_at: cell.completedAt ?? null,
    session: cell.session ?? null,
    tasks: cell.tasks ?? null,
  });
  if (error) throw error;
}

export async function markCellDone(
  cell: Cell,
  session?: PracticeSession
): Promise<Cell> {
  const userId = await getUserId();
  const updated: Cell = {
    ...cell,
    status: "done",
    completedAt: Date.now(),
    ...(session ? { session } : {}),
  };
  const { error } = await supabase.from("cells").upsert({
    id: updated.id,
    user_id: userId,
    track_id: updated.trackId,
    week_id: updated.weekId,
    day_index: updated.dayIndex,
    status: updated.status,
    completed_at: updated.completedAt ?? null,
    session: updated.session ?? null,
    tasks: updated.tasks ?? null,
  });
  if (error) throw error;
  return updated;
}

export async function markCellEmpty(cell: Cell): Promise<Cell> {
  const userId = await getUserId();
  const updated: Cell = {
    ...cell,
    status: "empty",
    completedAt: undefined,
    session: undefined,
  };
  const { error } = await supabase.from("cells").upsert({
    id: updated.id,
    user_id: userId,
    track_id: updated.trackId,
    week_id: updated.weekId,
    day_index: updated.dayIndex,
    status: "empty",
    completed_at: null,
    session: null,
    tasks: updated.tasks ?? null,
  });
  if (error) throw error;
  return updated;
}

export async function ghostifyWeek(weekId: string): Promise<void> {
  const { error } = await supabase
    .from("cells")
    .update({ status: "ghost" })
    .eq("week_id", weekId)
    .eq("status", "empty");
  if (error) throw error;
}

export async function updateCellTasks(cell: Cell, tasks: Task[]): Promise<Cell> {
  const userId = await getUserId();
  const updated: Cell = { ...cell, tasks };
  const { error } = await supabase.from("cells").upsert({
    id: updated.id,
    user_id: userId,
    track_id: updated.trackId,
    week_id: updated.weekId,
    day_index: updated.dayIndex,
    status: updated.status,
    completed_at: updated.completedAt ?? null,
    session: updated.session ?? null,
    tasks: tasks,
  });
  if (error) throw error;
  return updated;
}
