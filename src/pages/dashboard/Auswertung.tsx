import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetchAllRows";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Euro, Car, BookOpen, BarChart3, Users, GraduationCap, TrendingUp, Wallet, UserPlus } from "lucide-react";
import { startOfMonth, endOfMonth, isWithinInterval, subMonths, format } from "date-fns";
import { de } from "date-fns/locale";
import { Link } from "react-router-dom";

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

const formatEUR = (v: number) =>
  v.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

const Auswertung = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth()));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const isAllMonths = selectedMonth === "all";

  // ── Queries ──
  const { data: payments = [], isLoading: l1 } = useQuery({
    queryKey: ["aw-payments"],
    queryFn: () => fetchAllRows(supabase.from("payments").select("datum, betrag").order("datum")),
  });
  const { data: lessons = [], isLoading: l2 } = useQuery({
    queryKey: ["aw-lessons"],
    queryFn: () => fetchAllRows(supabase.from("driving_lessons").select("datum, typ, einheiten, student_id").order("datum")),
  });
  const { data: theory = [], isLoading: l3 } = useQuery({
    queryKey: ["aw-theory"],
    queryFn: () => fetchAllRows(supabase.from("theory_sessions").select("datum").order("datum")),
  });
  const { data: exams = [], isLoading: l4 } = useQuery({
    queryKey: ["aw-exams"],
    queryFn: () => fetchAllRows(supabase.from("exams").select("datum, typ, status").order("datum")),
  });
  const { data: students = [], isLoading: l5 } = useQuery({
    queryKey: ["aw-students"],
    queryFn: () => fetchAllRows(supabase.from("students").select("id, vorname, nachname, created_at, status").order("nachname")),
  });
  const { data: openItems = [], isLoading: l6 } = useQuery({
    queryKey: ["aw-open-items"],
    queryFn: () => fetchAllRows(supabase.from("open_items").select("student_id, betrag_gesamt, betrag_bezahlt, status")),
  });

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6;

  // ── Years ──
  const availableYears = useMemo(() => {
    const yrs = new Set<number>();
    [...payments, ...lessons, ...theory, ...exams].forEach((r: any) => yrs.add(new Date(r.datum).getFullYear()));
    students.forEach((s: any) => yrs.add(new Date(s.created_at).getFullYear()));
    if (yrs.size === 0) yrs.add(now.getFullYear());
    return Array.from(yrs).sort((a, b) => b - a);
  }, [payments, lessons, theory, exams, students]);

  // ── Filter helpers ──
  const inPeriod = useMemo(() => {
    if (isAllMonths) {
      const yr = Number(selectedYear);
      return (datum: string) => new Date(datum).getFullYear() === yr;
    }
    const d = new Date(Number(selectedYear), Number(selectedMonth), 1);
    const iv = { start: startOfMonth(d), end: endOfMonth(d) };
    return (datum: string) => isWithinInterval(new Date(datum), iv);
  }, [selectedMonth, selectedYear, isAllMonths]);

  const prevPeriodFilter = useMemo(() => {
    if (isAllMonths) return null;
    const prev = subMonths(new Date(Number(selectedYear), Number(selectedMonth), 1), 1);
    const iv = { start: startOfMonth(prev), end: endOfMonth(prev) };
    return (datum: string) => isWithinInterval(new Date(datum), iv);
  }, [selectedMonth, selectedYear, isAllMonths]);

  // ── KPIs ──
  const kpis = useMemo(() => {
    const totalRevenue = payments.reduce((s: number, p: any) => s + Number(p.betrag), 0);
    const periodRevenue = payments.filter((p: any) => inPeriod(p.datum)).reduce((s: number, p: any) => s + Number(p.betrag), 0);
    const activeStudents = students.filter((s: any) => s.status !== "abgeschlossen" && s.status !== "abgebrochen").length;
    const newStudents = students.filter((s: any) => inPeriod(s.created_at)).length;
    const periodLessons = lessons.filter((l: any) => l.typ !== "fehlstunde" && inPeriod(l.datum)).reduce((s: number, l: any) => s + Number(l.einheiten), 0);
    const periodTheory = theory.filter((t: any) => inPeriod(t.datum)).length;
    const periodExams = exams.filter((e: any) => inPeriod(e.datum)).length;
    const relevantExams = exams.filter((e: any) => inPeriod(e.datum) && (e.status === "bestanden" || e.status === "nicht_bestanden"));
    const passed = relevantExams.filter((e: any) => e.status === "bestanden").length;
    const passRate = relevantExams.length > 0 ? Math.round((passed / relevantExams.length) * 100) : null;
    const openBalance = openItems.filter((o: any) => o.status !== "bezahlt").reduce((s: number, o: any) => s + (Number(o.betrag_gesamt) - Number(o.betrag_bezahlt)), 0);

    // Prev month
    let prevRevenue = 0, prevLessons = 0, prevNewStudents = 0;
    if (prevPeriodFilter) {
      prevRevenue = payments.filter((p: any) => prevPeriodFilter(p.datum)).reduce((s: number, p: any) => s + Number(p.betrag), 0);
      prevLessons = lessons.filter((l: any) => l.typ !== "fehlstunde" && prevPeriodFilter(l.datum)).reduce((s: number, l: any) => s + Number(l.einheiten), 0);
      prevNewStudents = students.filter((s: any) => prevPeriodFilter(s.created_at)).length;
    }

    return { totalRevenue, periodRevenue, activeStudents, newStudents, periodLessons, periodTheory, periodExams, passRate, openBalance, prevRevenue, prevLessons, prevNewStudents };
  }, [payments, lessons, theory, exams, students, openItems, inPeriod, prevPeriodFilter]);

  // ── Chart data ──
  const chartData = useMemo(() => {
    const yr = Number(selectedYear);
    const months = Array.from({ length: 12 }, (_, i) => ({
      name: MONTHS[i].substring(0, 3),
      umsatz: 0, schueler: 0, einheiten: 0,
    }));

    const yearFilter = (d: string) => new Date(d).getFullYear() === yr;
    payments.filter((p: any) => yearFilter(p.datum)).forEach((p: any) => { months[new Date(p.datum).getMonth()].umsatz += Number(p.betrag); });
    students.filter((s: any) => yearFilter(s.created_at)).forEach((s: any) => { months[new Date(s.created_at).getMonth()].schueler += 1; });
    lessons.filter((l: any) => l.typ !== "fehlstunde" && yearFilter(l.datum)).forEach((l: any) => { months[new Date(l.datum).getMonth()].einheiten += Number(l.einheiten); });

    return months;
  }, [payments, students, lessons, selectedYear]);

  // ── Betriebsübersicht ──
  const ops = useMemo(() => {
    const active = kpis.activeStudents || 1;
    const avgLessons = (lessons.filter((l: any) => l.typ !== "fehlstunde").reduce((s: number, l: any) => s + Number(l.einheiten), 0) / active).toFixed(1);
    const avgRevenue = kpis.totalRevenue / active;

    // Best month
    const byMonth: Record<string, number> = {};
    payments.forEach((p: any) => {
      const key = format(new Date(p.datum), "MMMM yyyy", { locale: de });
      byMonth[key] = (byMonth[key] || 0) + Number(p.betrag);
    });
    const bestMonth = Object.entries(byMonth).sort((a, b) => b[1] - a[1])[0];

    // Top 5 open saldo
    const byStudent: Record<string, number> = {};
    openItems.filter((o: any) => o.status !== "bezahlt").forEach((o: any) => {
      byStudent[o.student_id] = (byStudent[o.student_id] || 0) + (Number(o.betrag_gesamt) - Number(o.betrag_bezahlt));
    });
    const top5 = Object.entries(byStudent)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, amount]) => {
        const st = students.find((s: any) => s.id === id);
        return { id, name: st ? `${st.nachname}, ${st.vorname}` : id, amount };
      });

    return { avgLessons, avgRevenue, bestMonth, top5 };
  }, [kpis, lessons, payments, openItems, students]);

  const pctChange = (cur: number, prev: number) => {
    if (prev === 0) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 100);
  };

  const ChangeBadge = ({ cur, prev }: { cur: number; prev: number }) => {
    if (isAllMonths) return null;
    const pct = pctChange(cur, prev);
    return (
      <Badge variant="outline" className={`text-[10px] ml-2 ${pct >= 0 ? "text-emerald-600 border-emerald-300" : "text-red-600 border-red-300"}`}>
        {pct >= 0 ? "+" : ""}{pct}%
      </Badge>
    );
  };

  const kpiCards = [
    { title: "Gesamtumsatz", value: formatEUR(kpis.totalRevenue), icon: Euro },
    { title: isAllMonths ? `Umsatz ${selectedYear}` : `Umsatz ${MONTHS[Number(selectedMonth)]}`, value: formatEUR(kpis.periodRevenue), icon: TrendingUp, change: { cur: kpis.periodRevenue, prev: kpis.prevRevenue } },
    { title: "Aktive Schüler", value: String(kpis.activeStudents), icon: Users },
    { title: "Neue Schüler", value: String(kpis.newStudents), icon: UserPlus, change: { cur: kpis.newStudents, prev: kpis.prevNewStudents } },
    { title: "Fahrstunden (Einh.)", value: String(kpis.periodLessons), icon: Car, change: { cur: kpis.periodLessons, prev: kpis.prevLessons } },
    { title: "Theoriestunden", value: String(kpis.periodTheory), icon: BookOpen },
    { title: "Prüfungen", value: String(kpis.periodExams), icon: GraduationCap },
    { title: "Bestehensquote", value: kpis.passRate !== null ? `${kpis.passRate}%` : "–", icon: BarChart3 },
    { title: "Offener Saldo", value: formatEUR(kpis.openBalance), icon: Wallet },
  ];

  const chartConfig = {
    umsatz: { label: "Umsatz (€)", color: "hsl(var(--primary))" },
    schueler: { label: "Neue Schüler", color: "hsl(var(--primary))" },
    einheiten: { label: "Einheiten", color: "hsl(var(--primary))" },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Auswertung" description="Management-Dashboard" icon={BarChart3} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Auswertung" description="Management-Dashboard – Kennzahlen, Trends & Betriebsübersicht" icon={BarChart3} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Monate</SelectItem>
            {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">{kpi.value}</span>
                {kpi.change && <ChangeBadge cur={kpi.change.cur} prev={kpi.change.prev} />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {([
          { key: "umsatz" as const, title: "Umsatzentwicklung" },
          { key: "schueler" as const, title: "Schülerentwicklung" },
          { key: "einheiten" as const, title: "Fahrstunden-Auslastung" },
        ]).map(({ key, title }) => (
          <Card key={key}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{title} ({selectedYear})</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={{ [key]: chartConfig[key] }} className="h-[200px] w-full">
                <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey={key} fill={`var(--color-${key})`} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Betriebsübersicht */}
      <Card>
        <CardHeader><CardTitle className="text-base">Betriebsübersicht</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Ø Fahrstunden / Schüler</p>
              <p className="text-xl font-bold">{ops.avgLessons} Einh.</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ø Umsatz / Schüler</p>
              <p className="text-xl font-bold">{formatEUR(ops.avgRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stärkster Monat</p>
              <p className="text-xl font-bold">{ops.bestMonth ? formatEUR(ops.bestMonth[1]) : "–"}</p>
              {ops.bestMonth && <p className="text-xs text-muted-foreground">{ops.bestMonth[0]}</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Top 5 offene Salden</p>
              {ops.top5.length === 0 && <p className="text-sm text-muted-foreground">Keine offenen Posten</p>}
              <div className="space-y-1.5">
                {ops.top5.map((s) => (
                  <div key={s.id} className="flex justify-between text-xs">
                    <Link to={`/dashboard/fahrschueler/${s.id}`} className="text-primary hover:underline truncate mr-2">{s.name}</Link>
                    <span className="font-medium text-red-600 shrink-0">{formatEUR(s.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auswertung;
