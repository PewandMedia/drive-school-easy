import { ToggleLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";

const Schaltstunden = () => (
  <div className="space-y-6">
    <PageHeader
      title="Schaltstunden"
      description="Schaltstunden (Klasse A/manuelle Fahrzeuge) verwalten"
      icon={ToggleLeft}
      action={<Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Stunde planen</Button>}
    />
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <span>Schüler</span>
        <span>Datum</span>
        <span>Uhrzeit</span>
        <span>Fahrzeug</span>
        <span>Status</span>
      </div>
      <div className="flex flex-col items-center justify-center py-16">
        <ToggleLeft className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground text-sm">Noch keine Schaltstunden eingetragen</p>
      </div>
    </div>
  </div>
);

export default Schaltstunden;
