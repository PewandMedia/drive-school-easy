import { CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";

const Zahlungen = () => (
  <div className="space-y-6">
    <PageHeader
      title="Zahlungen"
      description="Zahlungseingänge und offene Posten"
      icon={CreditCard}
      action={<Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Zahlung erfassen</Button>}
    />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[["Eingegangen (Monat)", "0,00 €", "text-green-400"], ["Offen", "0,00 €", "text-amber-400"], ["Überfällig", "0,00 €", "text-destructive"]].map(([l, v, c]) => (
        <div key={l} className="rounded-xl border border-border bg-card p-5">
          <p className={`text-2xl font-bold ${c}`}>{v}</p>
          <p className="text-sm text-muted-foreground mt-1">{l}</p>
        </div>
      ))}
    </div>
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <span>Schüler</span>
        <span>Betrag</span>
        <span>Datum</span>
        <span>Methode</span>
        <span>Status</span>
      </div>
      <div className="flex flex-col items-center justify-center py-16">
        <CreditCard className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground text-sm">Noch keine Zahlungen erfasst</p>
      </div>
    </div>
  </div>
);

export default Zahlungen;
