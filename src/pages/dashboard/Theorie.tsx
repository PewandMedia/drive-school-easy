import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";

const Theorie = () => (
  <div className="space-y-6">
    <PageHeader
      title="Theorie"
      description="Theorieunterricht und Kurse verwalten"
      icon={BookOpen}
      action={<Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Kurs erstellen</Button>}
    />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[["Aktive Kurse", "0"], ["Teilnehmer gesamt", "0"], ["Stunden absolviert", "0"]].map(([l, v]) => (
        <div key={l} className="rounded-xl border border-border bg-card p-5">
          <p className="text-2xl font-bold text-foreground">{v}</p>
          <p className="text-sm text-muted-foreground mt-1">{l}</p>
        </div>
      ))}
    </div>
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-4 gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <span>Kursname</span>
        <span>Datum</span>
        <span>Teilnehmer</span>
        <span>Status</span>
      </div>
      <div className="flex flex-col items-center justify-center py-16">
        <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground text-sm">Noch keine Kurse angelegt</p>
      </div>
    </div>
  </div>
);

export default Theorie;
