import { Users, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";

const Fahrschueler = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Fahrschüler"
        description="Alle angemeldeten Fahrschüler verwalten"
        icon={Users}
        action={<Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Neuer Schüler</Button>}
      />

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Schüler suchen..." />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span>Name</span>
          <span>Klasse</span>
          <span>Angemeldet</span>
          <span>Status</span>
          <span>Aktionen</span>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">Noch keine Fahrschüler eingetragen</p>
          <Button variant="outline" size="sm" className="mt-4 gap-2">
            <Plus className="h-4 w-4" />Ersten Schüler hinzufügen
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Fahrschueler;
