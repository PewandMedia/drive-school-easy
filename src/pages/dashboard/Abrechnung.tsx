import { Receipt, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";

const Abrechnung = () => (
  <div className="space-y-6">
    <PageHeader
      title="Abrechnung"
      description="Abrechnungen erstellen und verwalten"
      icon={Receipt}
      action={<Button size="sm" className="gap-2"><Download className="h-4 w-4" />Export</Button>}
    />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground mb-4">Monatsabrechnung</h2>
        <div className="space-y-3">
          {[["Einnahmen", "0,00 €"], ["Ausgaben", "0,00 €"], ["Gewinn", "0,00 €"]].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm py-2 border-b border-border/50 last:border-0">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium text-foreground">{v}</span>
            </div>
          ))}
        </div>
        <Button className="w-full mt-4" variant="outline" size="sm">Abrechnung generieren</Button>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground mb-4">Offene Rechnungen</h2>
        <div className="flex flex-col items-center justify-center py-10">
          <Receipt className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Keine offenen Rechnungen</p>
        </div>
      </div>
    </div>
  </div>
);

export default Abrechnung;
