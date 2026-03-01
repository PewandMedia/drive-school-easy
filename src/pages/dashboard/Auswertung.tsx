import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetchAllRows";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Euro, Car, BookOpen, BarChart3 } from "lucide-react";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

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

  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ["auswertung-payments"],
    queryFn: () => fetchAllRows(supabase.from("payments").select("datum, betrag").order("datum")),
  });

  const { data: drivingLessons = [], isLoading: loadingLessons } = useQuery({
    queryKey: ["auswertung-driving-lessons"],
    queryFn: () => fetchAllRows(supabase.from("driving_lessons").select("datum").order("datum")),
  });

  const { data: theorySessions = [], isLoading: loadingTheory } = useQuery({
    queryKey: ["auswertung-theory-sessions"],
    queryFn: () => fetchAllRows(supabase.from("theory_sessions").select("datum").order("datum")),
  });

  const isLoading = loadingPayments || loadingLessons || loadingTheory;

  // Available years from data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    [...payments, ...drivingLessons, ...theorySessions].forEach((r) => {
      years.add(new Date(r.datum).getFullYear());
    });
    if (years.size === 0) years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [payments, drivingLessons, theorySessions]);

  // Selected period
  const selectedDate = new Date(Number(selectedYear), Number(selectedMonth), 1);
  const interval = { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };

  const inInterval = (datum: string) => isWithinInterval(new Date(datum), interval);

  // KPIs for selected month
  const kpis = useMemo(() => {
    const revenue = payments.filter((p) => inInterval(p.datum)).reduce((s, p) => s + Number(p.betrag), 0);
    const lessons = drivingLessons.filter((l) => inInterval(l.datum)).length;
    const theory = theorySessions.filter((t) => inInterval(t.datum)).length;
    return { revenue, lessons, theory };
  }, [payments, drivingLessons, theorySessions, selectedMonth, selectedYear]);




  const kpiCards = [
    { title: "Gesamtumsatz", value: formatEUR(kpis.revenue), icon: Euro },
    { title: "Fahrstunden", value: String(kpis.lessons), icon: Car },
    { title: "Theoriestunden", value: String(kpis.theory), icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Auswertung" description="Monatliche Übersicht über Umsatz und Ausbildung" icon={BarChart3} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i} value={String(i)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpiCards.map((kpi) => (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};

export default Auswertung;
