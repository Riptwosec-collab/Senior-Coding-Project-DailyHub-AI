import { taskTemplates } from "@/lib/task-templates";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TaskTemplate } from "@/types/task-template";

type TaskTemplateRow = {
  id: string;
  user_id: string | null;
  name: string;
  description: string;
  type: TaskTemplate["type"];
  schedule_type: TaskTemplate["scheduleType"];
  cron_expression: string | null;
  time: string | null;
  timezone: string;
  data_sources: string[];
  gpt_actions: string[];
  output_channels: string[];
  min_priority_score: number;
  tags: string[];
  icon: string;
  recommended_for: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
};

function useSupabasePersistence() {
  return process.env.USE_SUPABASE === "true";
}

function mapTemplateRow(row: TaskTemplateRow): TaskTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type,
    scheduleType: row.schedule_type,
    cronExpression: row.cron_expression,
    time: row.time,
    timezone: row.timezone,
    dataSources: row.data_sources ?? [],
    gptActions: row.gpt_actions ?? [],
    outputChannels: row.output_channels ?? [],
    minPriorityScore: row.min_priority_score,
    tags: row.tags ?? [],
    icon: row.icon,
    recommendedFor: row.recommended_for,
  };
}

export async function listTaskTemplates(userId?: string | null): Promise<TaskTemplate[]> {
  if (!useSupabasePersistence()) return taskTemplates;

  const supabase = createAdminClient();
  if (!supabase) return taskTemplates;

  let query = supabase.from("task_templates").select("*").order("is_system", { ascending: false }).order("created_at", {
    ascending: true,
  });

  if (userId) {
    query = query.or(`user_id.is.null,user_id.eq.${userId}`);
  } else {
    query = query.is("user_id", null);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as TaskTemplateRow[];
  if (rows.length === 0) return taskTemplates;

  return rows.map(mapTemplateRow);
}

export async function getTaskTemplateByIdFromRepository(id: string, userId?: string | null): Promise<TaskTemplate | null> {
  const templates = await listTaskTemplates(userId);
  return templates.find((template) => template.id === id) ?? null;
}
