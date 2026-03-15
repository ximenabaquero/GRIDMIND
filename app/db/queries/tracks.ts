import { supabase } from "@/app/lib/supabase";
import type { Track } from "@/app/lib/types";
import { nanoid } from "@/app/lib/nanoid";

// ─── Mappers ────────────────────────────────────────────────────────────────

function rowToTrack(row: Record<string, unknown>): Track {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as Track["type"],
    color: row.color as string,
    icon: row.icon as string,
    weeklyTarget: row.weekly_target as number,
    config: row.config as Track["config"],
    createdAt: row.created_at as number,
    archivedAt: row.archived_at as number | undefined ?? undefined,
    order: row.order as number,
  };
}

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  return user!.id;
}

// ─── Queries ────────────────────────────────────────────────────────────────

export async function getActiveTracks(): Promise<Track[]> {
  const { data, error } = await supabase
    .from("tracks")
    .select("*")
    .is("archived_at", null)
    .order("order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToTrack);
}

export async function createTrack(
  data: Omit<Track, "id" | "createdAt" | "order">
): Promise<Track> {
  const userId = await getUserId();
  const { count } = await supabase
    .from("tracks")
    .select("*", { count: "exact", head: true });

  const track: Track = {
    ...data,
    id: nanoid(),
    createdAt: Date.now(),
    order: count ?? 0,
  };

  const { error } = await supabase.from("tracks").insert({
    id: track.id,
    user_id: userId,
    name: track.name,
    type: track.type,
    color: track.color,
    icon: track.icon,
    weekly_target: track.weeklyTarget,
    config: track.config,
    created_at: track.createdAt,
    archived_at: track.archivedAt ?? null,
    order: track.order,
  });
  if (error) throw error;
  return track;
}

export async function updateTrack(
  id: string,
  data: Partial<Omit<Track, "id" | "createdAt">>
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (data.name !== undefined)         row.name = data.name;
  if (data.type !== undefined)         row.type = data.type;
  if (data.color !== undefined)        row.color = data.color;
  if (data.icon !== undefined)         row.icon = data.icon;
  if (data.weeklyTarget !== undefined) row.weekly_target = data.weeklyTarget;
  if (data.config !== undefined)       row.config = data.config;
  if (data.archivedAt !== undefined)   row.archived_at = data.archivedAt;
  if (data.order !== undefined)        row.order = data.order;

  const { error } = await supabase.from("tracks").update(row).eq("id", id);
  if (error) throw error;
}

export async function archiveTrack(id: string): Promise<void> {
  const { error } = await supabase
    .from("tracks")
    .update({ archived_at: Date.now() })
    .eq("id", id);
  if (error) throw error;
}

export async function reorderTracks(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id, i) =>
      supabase.from("tracks").update({ order: i }).eq("id", id)
    )
  );
}

export async function seedDefaultTracks(): Promise<void> {
  const { count } = await supabase
    .from("tracks")
    .select("*", { count: "exact", head: true });
  if (count && count > 0) return;

  const userId = await getUserId();
  const defaults: Omit<Track, "id" | "createdAt" | "order">[] = [
    {
      name: "Guitar",
      type: "practice",
      color: "#8B5CF6",
      icon: "🎸",
      weeklyTarget: 7,
      config: { kind: "practice", metricLabel: "BPM", metricUnit: "bpm", hasTimer: true, hasNotes: true },
    },
    {
      name: "Gym",
      type: "habit",
      color: "#10B981",
      icon: "💪",
      weeklyTarget: 5,
      config: { kind: "habit" },
    },
    {
      name: "University",
      type: "effort",
      color: "#3B82F6",
      icon: "📚",
      weeklyTarget: 5,
      config: { kind: "effort", totalSquares: 5, subject: "General" },
    },
  ];

  const rows = defaults.map((d, i) => ({
    id: nanoid(),
    user_id: userId,
    name: d.name,
    type: d.type,
    color: d.color,
    icon: d.icon,
    weekly_target: d.weeklyTarget,
    config: d.config,
    created_at: Date.now(),
    archived_at: null,
    order: i,
  }));

  const { error } = await supabase.from("tracks").insert(rows);
  if (error) throw error;
}
