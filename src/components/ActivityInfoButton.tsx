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
    // Always reload on open
    setLoading(true);
    const { data } = await supabase
      .from("activity_log")
      .select("id, user_name, action, created_at, details")
      .eq("entity_id", entityId)
      .order("created_at", { ascending: true })
      .limit(20) as any;
    setLogs(data ?? []);
    setLoading(false);
  };

  const erstelltLog = logs?.find((l) => l.action === "erstellt") ?? logs?.[0];
  const letzteAenderung = logs && logs.length > 1 ? logs[logs.length - 1] : null;

  const formatDatum = (iso: string) => format(new Date(iso), "dd.MM.yyyy", { locale: de });
  const formatUhrzeit = (iso: string) => format(new Date(iso), "HH:mm", { locale: de });

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
          <p className="text-xs text-muted-foreground">Kein Protokoll vorhanden (vor Audit-Aktivierung erstellt)</p>
        ) : (
          <div className="space-y-1.5 text-xs">
            {erstelltLog && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Eingetragen von</span>
                  <span className="font-medium text-foreground">{erstelltLog.user_name ?? "–"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Datum</span>
                  <span className="text-foreground">{formatDatum(erstelltLog.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uhrzeit</span>
                  <span className="text-foreground">{formatUhrzeit(erstelltLog.created_at)} Uhr</span>
                </div>
              </>
            )}
            {letzteAenderung && (
              <>
                <div className="border-t border-border my-1.5" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Letzte Änderung</span>
                  <span className="text-foreground">
                    {formatDatum(letzteAenderung.created_at)} {formatUhrzeit(letzteAenderung.created_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Von</span>
                  <span className="font-medium text-foreground">{letzteAenderung.user_name ?? "–"}</span>
                </div>
              </>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default ActivityInfoButton;
