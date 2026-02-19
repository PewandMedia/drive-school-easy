import { Users, Car, BookOpen, CreditCard, TrendingUp, ClipboardCheck } from "lucide-react";

const stats = [
  { label: "Aktive Fahrschüler", value: "0", icon: Users, color: "text-blue-400" },
  { label: "Fahrstunden heute", value: "0", icon: Car, color: "text-green-400" },
  { label: "Offene Zahlungen", value: "0 €", icon: CreditCard, color: "text-amber-400" },
  { label: "Prüfungen diesen Monat", value: "0", icon: ClipboardCheck, color: "text-purple-400" },
  { label: "Theoriekurse aktiv", value: "0", icon: BookOpen, color: "text-cyan-400" },
  { label: "Umsatz (Monat)", value: "0 €", icon: TrendingUp, color: "text-emerald-400" },
];

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Übersicht</h1>
        <p className="text-muted-foreground mt-1">Willkommen in der Fahrschulverwaltung</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-5 flex items-center gap-4"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground mb-3">Letzte Aktivitäten</h2>
          <p className="text-sm text-muted-foreground">Noch keine Aktivitäten vorhanden.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground mb-3">Nächste Prüfungen</h2>
          <p className="text-sm text-muted-foreground">Keine Prüfungen geplant.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
