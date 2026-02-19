import { Car, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";

const Fahrstunden = () => (
  <div className="space-y-6">
    <PageHeader
      title="Fahrstunden"
      description="Alle Fahrstunden verwalten und planen"
      icon={Car}
      action={<Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Fahrstunde planen</Button>}
    />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Kalenderansicht</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">Noch keine Fahrstunden geplant</p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground mb-4">Heute</h2>
        <p className="text-sm text-muted-foreground">Keine Fahrstunden heute.</p>
      </div>
    </div>
  </div>
);

export default Fahrstunden;
