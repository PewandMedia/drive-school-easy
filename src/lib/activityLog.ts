import { supabase } from "@/integrations/supabase/client";

type ActivityAction = "erstellt" | "bearbeitet" | "geloescht";
type EntityType = "fahrstunde" | "theorie" | "pruefung" | "zahlung" | "leistung" | "gutschrift";

interface LogParams {
  action: ActivityAction;
  entity_type: EntityType;
  entity_id: string;
  details?: string;
}

export const logActivity = async (
  params: LogParams,
  userId: string,
  userName: string
) => {
  try {
    const { error } = await supabase.from("activity_log").insert({
      user_id: userId,
      user_name: userName,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      details: params.details ?? null,
    } as any);
    if (error) {
      console.error("Activity log insert failed:", error.message, error.details, error.hint);
    }
  } catch (e) {
    console.error("Activity log unexpected error:", e);
  }
};
