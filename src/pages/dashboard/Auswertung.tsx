import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3, GraduationCap, Car, Users, Euro, PiggyBank, TrendingUp, TrendingDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, startOfMonth, startOfQuarter, startOfYear, subYears } from "date-fns";
import { de } from "date-fns/locale";

type Period = "month" | "quarter" | "year" | "lastYear" | "all";

const periodLabels: Record<Period, string> = {
  month: "Diesen Monat",
  quarter: "Dieses Quartal",
  year: "Dieses Jahr",
  lastYear: "Letztes Jahr",
  all: "Gesamt",
};

function getDateRange(period: Period): { from: Date | null; to: Date | null } {
  const now = new Date();
  switch (period) {
    case "month":
      return { from: startOfMonth(now), to: now };
    case "quarter":
      return { from: startOfQuarter(now), to: now };
    case "year":
      return { from: startOfYear(now), to: now };
    case "lastYear": {
      const ly = subYears(now, 1);
      return { from: startOfYear(ly), to: new Date(ly.getFullYear(), 11, 31, 23, 59, 59) };
    }
    case "all":
      return { from: null, to: null };
  }
}

function filterByDate<T extends { datum?: string; created_at?: string }>(
  items: T[] | undefined,
  range: { from: Date | null; to: Date | null },
  field: "datum" | "created_at" = "datum"
): T[] {
  if (!items) return [];
  if (!range.from) return items;
  return items.filter((item) => {
    const d = new Date(item[field] ?? "");
    return d >= range.from! && d <= (range.to ?? new Date());
  });
}

const CHART_GREEN = "hsl(142 71% 45%)";
const CHART_RED = "hsl(0 84% 60%)";
const CHART_PRIMARY = "hsl(38 95% 52%)";
const CHART_BLUE = "hsl(210 80% 55%)";
const CHART_CYAN = "hsl(180 70% 45%)";
const CHART_MUTED = "hsl(220 18% 25%)";

const euroFormatter = (v: number) =>
  v.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" && p.dataKey === "umsatz" ? euroFormatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

const Auswertung = () => {
  const [period, setPeriod] = useState<Period>("year");
  const range = useMemo(() => getDateRange(period), [period]);

  // ---- Queries ----
  const { data: payments } = useQuery({
    queryKey: ["auswertung-payments"],
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("id, betrag, datum");
      return data ?? [];
    },
  });

  const { data: exams } = useQuery({
    queryKey: ["auswertung-exams"],
    queryFn: async () => {
      const { data } = await supabase.from("exams").select("id, typ, bestanden, datum, student_id");
      return data ?? [];
    },
  });

  const { data: drivingLessons } = useQuery({
    queryKey: ["auswertung-driving-lessons"],
    queryFn: async () => {
      const { data } = await supabase.from("driving_lessons").select("id, datum, student_id, einheiten");
      return data ?? [];
    },
  });

  const { data: students } = useQuery({
    queryKey: ["auswertung-students"],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("id, created_at");
      return data ?? [];
    },
  });

  const { data: openItems } = useQuery({
    queryKey: ["auswertung-open-items"],
    queryFn: async () => {
      const { data } = await supabase.from("open_items").select("id, betrag_gesamt, betrag_bezahlt, datum");
      return data ?? [];
    },
  });

  // ---- Filtered data ----
  const fp = useMemo(() => filterByDate(payments, range), [payments, range]);
  const fe = useMemo(() => filterByDate(exams, range), [exams, range]);
  const fd = useMemo(() => filterByDate(drivingLessons, range), [drivingLessons, range]);
  const fs = useMemo(() => filterByDate(students, range, "created_at"), [students, range]);
  const fo = useMemo(() => filterByDate(openItems, range), [openItems, range]);

  // ---- KPIs ----
  const theorieExams = fe.filter((e) => e.typ === "theorie");
  const praxisExams = fe.filter((e) => e.typ === "praxis");
  const theorieQuote = theorieExams.length > 0
    ? Math.round((theorieExams.filter((e) => e.bestanden).length / theorieExams.length) * 100) : null;
  const praxisQuote = praxisExams.length > 0
    ? Math.round((praxisExams.filter((e) => e.bestanden).length / praxisExams.length) * 100) : null;

  const gesamtumsatz = fp.reduce((s, p) => s + Number(p.betrag), 0);

  const avgFahrstunden = useMemo(() => {
    if (!exams || !drivingLessons) return null;
    const passedStudents = exams
      .filter((e) => e.typ === "praxis" && e.bestanden)
      .map((e) => e.student_id);
    const unique = [...new Set(passedStudents)];
    if (unique.length === 0) return null;
    const counts = unique.map((sid) => drivingLessons.filter((d) => d.student_id === sid).length);
    return Math.round(counts.reduce((a, b) => a + b, 0) / counts.length);
  }, [exams, drivingLessons]);

  const totalGesamt = fo.reduce((s, o) => s + Number(o.betrag_gesamt), 0);
  const totalBezahlt = fo.reduce((s, o) => s + Number(o.betrag_bezahlt), 0);
  const bezahlQuote = totalGesamt > 0 ? Math.round((totalBezahlt / totalGesamt) * 100) : null;

  // ---- Chart data ----
  const umsatzMonatlich = useMemo(() => {
    const map = new Map<string, number>();
    fp.forEach((p) => {
      const key = format(new Date(p.datum), "MMM yy", { locale: de });
      map.set(key, (map.get(key) ?? 0) + Number(p.betrag));
    });
    return Array.from(map, ([name, umsatz]) => ({ name, umsatz }));
  }, [fp]);

  const schuelerMonatlich = useMemo(() => {
    const map = new Map<string, number>();
    fs.forEach((s) => {
      const key = format(new Date(s.created_at), "MMM yy", { locale: de });
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map, ([name, count]) => ({ name, count }));
  }, [fs]);

  const fahrstundenMonatlich = useMemo(() => {
    const map = new Map<string, number>();
    fd.forEach((d) => {
      const key = format(new Date(d.datum), "MMM yy", { locale: de });
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map, ([name, count]) => ({ name, count }));
  }, [fd]);

  const pruefungenMonatlich = useMemo(() => {
    const map = new Map<string, { name: string; bestanden: number; durchgefallen: number }>();
    fe.forEach((e) => {
      const key = format(new Date(e.datum), "MMM yy", { locale: de });
      const entry = map.get(key) ?? { name: key, bestanden: 0, durchgefallen: 0 };
      if (e.bestanden) entry.bestanden++;
      else entry.durchgefallen++;
      map.set(key, entry);
    });
    return Array.from(map.values());
  }, [fe]);

  const donutData = useMemo(() => {
    const offen = totalGesamt - totalBezahlt;
    return [
      { name: "Bezahlt", value: totalBezahlt },
      { name: "Offen", value: offen > 0 ? offen : 0 },
    ];
  }, [totalGesamt, totalBezahlt]);

  const kpis = [
    { label: "Bestandsquote Theorie", value: theorieQuote !== null ? `${theorieQuote}%` : "–", icon: GraduationCap, good: theorieQuote !== null && theorieQuote >= 70, bad: theorieQuote !== null && theorieQuote < 70 },
    { label: "Bestandsquote Praxis", value: praxisQuote !== null ? `${praxisQuote}%` : "–", icon: Car, good: praxisQuote !== null && praxisQuote >= 60, bad: praxisQuote !== null && praxisQuote < 60 },
    { label: "Ø Fahrstunden bis Prüfung", value: avgFahrstunden !== null ? `${avgFahrstunden}` : "–", icon: Car, good: false, bad: false },
    { label: "Neue Schüler", value: `${fs.length}`, icon: Users, good: false, bad: false },
    { label: "Gesamtumsatz", value: euroFormatter(gesamtumsatz), icon: Euro, good: false, bad: false },
    { label: "Bezahlquote", value: bezahlQuote !== null ? `${bezahlQuote}%` : "–", icon: PiggyBank, good: bezahlQuote !== null && bezahlQuote >= 70, bad: bezahlQuote !== null && bezahlQuote < 70 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auswertung"
        description="Statistiken und Berichte auf einen Blick"
        icon={BarChart3}
        action={
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(periodLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* KPI Cards – 3x2 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className={`transition-all hover:shadow-md ${
              kpi.good ? "border-l-4 border-l-green-500" :
              kpi.bad ? "border-l-4 border-l-destructive" : ""
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    {kpi.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                    {kpi.good && <TrendingUp className="h-5 w-5 text-green-500 shrink-0" />}
                    {kpi.bad && <TrendingDown className="h-5 w-5 text-destructive shrink-0" />}
                  </div>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                  <kpi.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Umsatzentwicklung – kompakter mit Gesamtwert im Header */}
      <Card>
        <CardHeader className="pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Umsatzentwicklung</CardTitle>
            <span className="text-xl font-bold text-primary">{euroFormatter(gesamtumsatz)}</span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {umsatzMonatlich.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={umsatzMonatlich}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 18% 16%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="umsatz" name="Umsatz" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">Keine Zahlungsdaten im Zeitraum</p>
          )}
        </CardContent>
      </Card>

      {/* 2x2 Charts mit unterschiedlichen Farben */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Schüler pro Monat – Blau */}
        <Card>
          <CardHeader className="pb-2 border-b border-border/50">
            <CardTitle className="text-base font-semibold">Schüler pro Monat</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {schuelerMonatlich.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={schuelerMonatlich}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 18% 16%)" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Schüler" fill={CHART_BLUE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Keine Daten</p>
            )}
          </CardContent>
        </Card>

        {/* Fahrstunden-Auslastung – Cyan */}
        <Card>
          <CardHeader className="pb-2 border-b border-border/50">
            <CardTitle className="text-base font-semibold">Fahrstunden-Auslastung</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {fahrstundenMonatlich.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={fahrstundenMonatlich}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 18% 16%)" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Fahrstunden" fill={CHART_CYAN} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Keine Daten</p>
            )}
          </CardContent>
        </Card>

        {/* Prüfungsergebnisse – Grün/Rot */}
        <Card>
          <CardHeader className="pb-2 border-b border-border/50">
            <CardTitle className="text-base font-semibold">Prüfungsergebnisse</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {pruefungenMonatlich.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={pruefungenMonatlich}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 18% 16%)" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="bestanden" name="Bestanden" stackId="a" fill={CHART_GREEN} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="durchgefallen" name="Durchgefallen" stackId="a" fill={CHART_RED} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Keine Prüfungsdaten</p>
            )}
          </CardContent>
        </Card>

        {/* Offene vs. Bezahlte Beträge – Donut mit Zentral-Label */}
        <Card>
          <CardHeader className="pb-2 border-b border-border/50">
            <CardTitle className="text-base font-semibold">Offene vs. Bezahlte Beträge</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {totalGesamt > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    <Cell fill={CHART_GREEN} />
                    <Cell fill={CHART_MUTED} />
                  </Pie>
                  {/* Central label */}
                  <text x="50%" y="46%" textAnchor="middle" fill="hsl(210 20% 94%)" fontSize={20} fontWeight="bold">
                    {bezahlQuote ?? 0}%
                  </text>
                  <text x="50%" y="58%" textAnchor="middle" fill="hsl(215 15% 55%)" fontSize={11}>
                    {euroFormatter(totalBezahlt)} bezahlt
                  </text>
                  <Tooltip
                    formatter={(value: number) => euroFormatter(value)}
                    contentStyle={{ backgroundColor: "hsl(220 22% 10%)", border: "1px solid hsl(220 18% 16%)", borderRadius: 8, fontSize: 12 }}
                    itemStyle={{ color: "hsl(210 20% 94%)" }}
                  />
                  <Legend
                    formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Keine offenen Posten</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auswertung;
