import { ClipboardCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    bestanden: "bg-green-500/15 text-green-400",
    "nicht bestanden": "bg-red-500/15 text-red-400",
    geplant: "bg-amber-500/15 text-amber-400",
  };
  return map[status] ?? "bg-secondary text-muted-foreground";
};

const Pruefungen = () => (
  <div className="space-y-6">
    <PageHeader
      title="Prüfungen"
      description="Theorie- und Fahrprüfungen verwalten"
      icon={ClipboardCheck}
      action={<Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Prüfung eintragen</Button>}
    />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[["Geplant", "0", "text-amber-400"], ["Bestanden", "0", "text-green-400"], ["Nicht bestanden", "0", "text-destructive"]].map(([l, v, c]) => (
        <div key={l} className="rounded-xl border border-border bg-card p-5">
          <p className={`text-2xl font-bold ${c}`}>{v}</p>
          <p className="text-sm text-muted-foreground mt-1">{l}</p>
        </div>
      ))}
    </div>
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <span>Schüler</span>
        <span>Typ</span>
        <span>Datum</span>
        <span>Ort</span>
        <span>Ergebnis</span>
      </div>
      <div className="flex flex-col items-center justify-center py-16">
        <ClipboardCheck className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground text-sm">Noch keine Prüfungen eingetragen</p>
      </div>
    </div>
  </div>
);

export default Pruefungen;
