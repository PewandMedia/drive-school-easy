import { ListChecks, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";

const leistungen = [
  "Fahrstunde (45 min)", "Überlandfahrt", "Autobahnfahrt", "Nachtfahrt",
  "Begleitetes Fahren", "Theorieprüfung", "Fahrprüfung",
];

const Leistungen = () => (
  <div className="space-y-6">
    <PageHeader
      title="Leistungen"
      description="Angebotene Leistungen der Fahrschule"
      icon={ListChecks}
      action={<Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Neue Leistung</Button>}
    />
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-4 gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <span className="col-span-2">Bezeichnung</span>
        <span>Dauer</span>
        <span>Aktionen</span>
      </div>
      {leistungen.map((l) => (
        <div key={l} className="grid grid-cols-4 gap-4 px-5 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
          <span className="col-span-2 text-sm text-foreground">{l}</span>
          <span className="text-sm text-muted-foreground">–</span>
          <Button variant="ghost" size="sm" className="w-fit">Bearbeiten</Button>
        </div>
      ))}
    </div>
  </div>
);

export default Leistungen;
