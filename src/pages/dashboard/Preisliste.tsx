import { DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";

const preise = [
  { name: "Fahrstunde (45 min)", preis: "0,00 €", klasse: "B" },
  { name: "Überlandfahrt", preis: "0,00 €", klasse: "B" },
  { name: "Autobahnfahrt", preis: "0,00 €", klasse: "B" },
  { name: "Nachtfahrt", preis: "0,00 €", klasse: "B" },
  { name: "Theorieprüfung (Vorbereitung)", preis: "0,00 €", klasse: "B" },
  { name: "Fahrprüfung (Vorbereitung)", preis: "0,00 €", klasse: "B" },
];

const Preisliste = () => (
  <div className="space-y-6">
    <PageHeader
      title="Preisliste"
      description="Aktuelle Preise für alle Leistungen"
      icon={DollarSign}
      action={<Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Preis hinzufügen</Button>}
    />
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-4 gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <span className="col-span-2">Leistung</span>
        <span>Klasse</span>
        <span>Preis</span>
      </div>
      {preise.map((p) => (
        <div key={p.name} className="grid grid-cols-4 gap-4 px-5 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
          <span className="col-span-2 text-sm text-foreground">{p.name}</span>
          <span className="text-sm text-muted-foreground">{p.klasse}</span>
          <span className="text-sm font-medium text-primary">{p.preis}</span>
        </div>
      ))}
    </div>
  </div>
);

export default Preisliste;
