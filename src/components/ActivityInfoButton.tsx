import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Props {
  entityId: string;
}

type LogEntry = {
  id: string;
  user_name: string;
  action: string;
  created_at: string;
  details: string | null;
};

const ActivityInfoButton = ({ entityId }: Props) => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAdmin) return null;

  const loadLogs = async () => {
    if (logs) return;
    setLoading(true);
    const { data } = await supabase
      .from("activity_log")
      .select("id, user_name, action, created_at, details")
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(10) as any;
    setLogs(data ?? []);
    setLoading(false);
  };

  const actionLabel = (a: string) =>
    a === "erstellt" ? "Erstellt" : a === "bearbeitet" ? "Bearbeitet" : a === "geloescht" ? "Gelöscht" : a;

  return (
    <Popover onOpenChange={(open) => open && loadLogs()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
          <Info className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <p className="text-xs font-semibold text-foreground mb-2">Aktivitätsprotokoll</p>
        {loading ? (
          <div className="h-8 flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !logs || logs.length === 0 ? (
          <p className="text-xs text-muted-foreground">Keine Einträge vorhanden</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="text-xs border-b border-border pb-1.5 last:border-0">
                <p className="font-medium text-foreground">{actionLabel(log.action)} von {log.user_name}</p>
                <p className="text-muted-foreground">
                  {format(new Date(log.created_at), "dd.MM.yyyy", { locale: de })} um {format(new Date(log.created_at), "HH:mm", { locale: de })} Uhr
                </p>
                {log.details && <p className="text-muted-foreground mt-0.5">{log.details}</p>}
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default ActivityInfoButton;
