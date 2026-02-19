import { Truck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";

const Fahrzeuge = () => (
  <div className="space-y-6">
    <PageHeader
      title="Fahrzeuge"
      description="Fahrzeugflotte verwalten und überwachen"
      icon={Truck}
      action={<Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Fahrzeug hinzufügen</Button>}
    />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[["Fahrzeuge gesamt", "0"], ["Verfügbar", "0"], ["In Wartung", "0"]].map(([l, v]) => (
        <div key={l} className="rounded-xl border border-border bg-card p-5">
          <p className="text-2xl font-bold text-foreground">{v}</p>
          <p className="text-sm text-muted-foreground mt-1">{l}</p>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="rounded-xl border border-border border-dashed bg-card/50 p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-card transition-colors">
        <Plus className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Fahrzeug hinzufügen</p>
      </div>
    </div>
  </div>
);

export default Fahrzeuge;
