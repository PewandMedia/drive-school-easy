import { Receipt, TrendingUp, Wallet, AlertCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const fmt = (v: number) =>
  v.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

const Abrechnung = () => {
  const navigate = useNavigate();

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").order("nachname");
      if (error) throw error;
      return data;
    },
  });

  const { data: drivingLessons = [] } = useQuery({
    queryKey: ["driving_lessons_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("driving_lessons").select("student_id, preis");
      if (error) throw error;
      return data;
    },
  });

  const { data: exams = [] } = useQuery({
    queryKey: ["exams_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exams").select("student_id, preis");
      if (error) throw error;
      return data;
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("student_id, preis");
      if (error) throw error;
      return data;
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payments_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("student_id, betrag");
      if (error) throw error;
      return data;
    },
  });

  // ── Saldo pro Schüler berechnen ──────────────────────────────────────────────
  const saldoMap = students.map((s) => {
    const fahrstunden = drivingLessons
      .filter((l) => l.student_id === s.id)
      .reduce((acc, l) => acc + Number(l.preis), 0);
    const pruefungen = exams
      .filter((e) => e.student_id === s.id)
      .reduce((acc, e) => acc + Number(e.preis), 0);
    const leistungen = services
      .filter((sv) => sv.student_id === s.id)
      .reduce((acc, sv) => acc + Number(sv.preis), 0);
    const zahlungen = payments
      .filter((p) => p.student_id === s.id)
      .reduce((acc, p) => acc + Number(p.betrag), 0);
    const saldo = fahrstunden + pruefungen + leistungen - zahlungen;
    return { ...s, fahrstunden, pruefungen, leistungen, zahlungen, saldo };
  });

  // Sortiert: höchster Saldo zuerst
  const sorted = [...saldoMap].sort((a, b) => b.saldo - a.saldo);

  // ── Gesamtstatistiken ────────────────────────────────────────────────────────
  const gesamtForderungen = saldoMap.reduce(
    (acc, s) => acc + s.fahrstunden + s.pruefungen + s.leistungen,
    0,
  );
  const gesamtZahlungen = saldoMap.reduce((acc, s) => acc + s.zahlungen, 0);
  const gesamtSaldo = gesamtForderungen - gesamtZahlungen;

  const stats = [
    {
      label: "Gesamtforderungen",
      value: fmt(gesamtForderungen),
      icon: TrendingUp,
      cls: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Eingegangene Zahlungen",
      value: fmt(gesamtZahlungen),
      icon: Wallet,
      cls: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
    },
    {
      label: "Offener Gesamtsaldo",
      value: fmt(gesamtSaldo),
      icon: AlertCircle,
      cls: gesamtSaldo > 0 ? "text-amber-400" : "text-green-400",
      bg: gesamtSaldo > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-green-500/10 border-green-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abrechnung"
        description="Saldo-Übersicht aller Fahrschüler"
        icon={Receipt}
      />

      {/* ── Statistik-Karten ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, cls, bg }) => (
          <div key={label} className={`rounded-xl border p-5 ${bg}`}>
            <div className="flex items-center gap-3 mb-2">
              <Icon className={`h-5 w-5 ${cls}`} />
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Schüler-Tabelle ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Salden pro Schüler</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sortiert nach offenstem Saldo · Klick auf Zeile öffnet Schülerdetail
          </p>
        </div>
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Receipt className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Noch keine Schüler vorhanden.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Schüler</TableHead>
                <TableHead>Klasse</TableHead>
                <TableHead className="text-right">Fahrstunden</TableHead>
                <TableHead className="text-right">Prüfungen</TableHead>
                <TableHead className="text-right">Leistungen</TableHead>
                <TableHead className="text-right">Zahlungen</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((s) => {
                const ausgeglichen = s.saldo <= 0;
                return (
                  <TableRow
                    key={s.id}
                    className={`cursor-pointer ${ausgeglichen ? "opacity-60" : ""}`}
                    onClick={() => navigate(`/dashboard/fahrschueler/${s.id}`)}
                  >
                    <TableCell className="font-medium">
                      {s.nachname}, {s.vorname}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {s.fuehrerscheinklasse}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {fmt(s.fahrstunden)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {fmt(s.pruefungen)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {fmt(s.leistungen)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-green-400">
                      −{fmt(s.zahlungen)}
                    </TableCell>
                    <TableCell className="text-right">
                      {ausgeglichen ? (
                        <Badge className="bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/20">
                          Ausgeglichen
                        </Badge>
                      ) : (
                        <span className="font-bold text-amber-400 tabular-nums">
                          {fmt(s.saldo)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default Abrechnung;
