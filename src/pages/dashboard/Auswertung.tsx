import { BarChart3 } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const Auswertung = () => (
  <div className="space-y-6">
    <PageHeader
      title="Auswertung"
      description="Statistiken und Berichte auf einen Blick"
      icon={BarChart3}
    />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        ["Bestandsquote Theorie", "–"],
        ["Bestandsquote Fahrprüfung", "–"],
        ["Ø Fahrstunden bis Prüfung", "–"],
        ["Neue Schüler (Monat)", "0"],
      ].map(([l, v]) => (
        <div key={l} className="rounded-xl border border-border bg-card p-5">
          <p className="text-2xl font-bold text-primary">{v}</p>
          <p className="text-sm text-muted-foreground mt-1">{l}</p>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {["Umsatzentwicklung", "Schüler pro Monat", "Prüfungsergebnisse", "Fahrstunden-Auslastung"].map((title) => (
        <div key={title} className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground mb-4">{title}</h2>
          <div className="flex items-center justify-center h-32 rounded-lg bg-secondary/40">
            <p className="text-sm text-muted-foreground">Diagramm folgt nach Dateneingabe</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Auswertung;
