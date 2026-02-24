import { useState } from "react";
import { Receipt, TrendingUp, Wallet, AlertCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatStudentName } from "@/lib/formatStudentName";
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
  const [searchTerm, setSearchTerm] = useState("");

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").order("nachname");
      if (error) throw error;
      return data;
    },
  });

  const { data: openItems = [] } = useQuery({
    queryKey: ["open_items_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("open_items").select("student_id, betrag_gesamt, betrag_bezahlt") as any;
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Saldo pro Schüler berechnen (aus open_items) ─────────────────────────────
  const saldoMap = students.map((s) => {
    const items = openItems.filter((oi: any) => oi.student_id === s.id);
    const forderungen = items.reduce((acc: number, oi: any) => acc + Number(oi.betrag_gesamt), 0);
    const bezahlt = items.reduce((acc: number, oi: any) => acc + Number(oi.betrag_bezahlt), 0);
    const saldo = forderungen - bezahlt;
    return { ...s, forderungen, bezahlt, saldo };
  });

  // Sortiert: höchster Saldo zuerst
  const sorted = [...saldoMap].sort((a, b) => b.saldo - a.saldo);

  // ── Gesamtstatistiken ────────────────────────────────────────────────────────
  const gesamtForderungen = saldoMap.reduce((acc, s) => acc + s.forderungen, 0);
  const gesamtBezahlt = saldoMap.reduce((acc, s) => acc + s.bezahlt, 0);
  const gesamtSaldo = gesamtForderungen - gesamtBezahlt;

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
      value: fmt(gesamtBezahlt),
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
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-foreground">Salden pro Schüler</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sortiert nach offenstem Saldo · Klick auf Zeile öffnet Schülerdetail
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Schüler suchen…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
        </div>
        {(() => {
          const filtered = sorted.filter((s) => {
            if (!searchTerm) return true;
            const name = `${s.nachname} ${s.vorname}`.toLowerCase();
            return name.includes(searchTerm.toLowerCase());
          });
          return filtered.length === 0 ? (
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
                <TableHead className="text-right">Forderungen</TableHead>
                <TableHead className="text-right">Bezahlt</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const ausgeglichen = s.saldo <= 0;
                return (
                  <TableRow
                    key={s.id}
                    className={`cursor-pointer ${ausgeglichen ? "opacity-60" : ""}`}
                    onClick={() => navigate(`/dashboard/fahrschueler/${s.id}`)}
                  >
                    <TableCell className="font-medium">
                      {formatStudentName(s.nachname, s.vorname, (s as any).geburtsdatum)}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {s.fuehrerscheinklasse}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {fmt(s.forderungen)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-green-400">
                      −{fmt(s.bezahlt)}
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
        );
        })()}
      </div>
    </div>
  );
};

export default Abrechnung;
