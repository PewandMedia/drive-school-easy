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
    await supabase.from("activity_log").insert({
      user_id: userId,
      user_name: userName,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      details: params.details ?? null,
    } as any);
  } catch (e) {
    console.error("Activity log error:", e);
  }
};
