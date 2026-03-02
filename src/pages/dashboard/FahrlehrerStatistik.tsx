import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetchAllRows";
import PageHeader from "@/components/PageHeader";
import {
  UserCheck, Car, BookOpen, ClipboardCheck, TrendingUp, Euro,
  Settings, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import InstructorManageDialog from "@/components/InstructorManageDialog";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

const quoteColor = (q: number) =>
  q >= 80 ? "text-green-600" : q >= 60 ? "text-yellow-600" : "text-destructive";

const quoteBarClass = (q: number) =>
  q >= 80 ? "bg-green-500" : q >= 60 ? "bg-yellow-500" : "bg-destructive";

type ExamSortKey = "name" | "pruefungen" | "pruefungenMonat" | "bestehensquote";
type HoursSortKey = "name" | "fahrstundenMonat" | "fahrstundenGesamt" | "theorieMonat" | "theorieGesamt" | "umsatzMonat";
type SortDir = "asc" | "desc";

const FahrlehrerStatistik = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [examSortKey, setExamSortKey] = useState<ExamSortKey>("pruefungen");
  const [examSortDir, setExamSortDir] = useState<SortDir>("desc");
  const [hoursSortKey, setHoursSortKey] = useState<HoursSortKey>("fahrstundenMonat");
  const [hoursSortDir, setHoursSortDir] = useState<SortDir>("desc");
  const [instructorDialogOpen, setInstructorDialogOpen] = useState(false);

  // ── Queries ──────────────────────────────────────────
  const { data: instructors, isLoading: l1 } = useQuery({
    queryKey: ["instructors-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, vorname, nachname")
        .order("nachname");
      if (error) throw error;
      return data;
    },
  });

  const { data: drivingLessons, isLoading: l2 } = useQuery({
    queryKey: ["driving-lessons-all-stats"],
    queryFn: () =>
      fetchAllRows(
        supabase
          .from("driving_lessons")
          .select("instructor_id, datum, einheiten, preis, typ")
          .not("instructor_id", "is", null)
      ),
  });

  const { data: theorySessions, isLoading: l3 } = useQuery({
    queryKey: ["theory-sessions-all-stats"],
    queryFn: () =>
      fetchAllRows(
        supabase
          .from("theory_sessions")
          .select("instructor_id, datum")
          .not("instructor_id", "is", null)
      ),
  });

  const { data: exams, isLoading: l4 } = useQuery({
    queryKey: ["exams-praxis-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("instructor_id, datum, status")
        .eq("typ", "praxis")
        .not("instructor_id", "is", null);
      if (error) throw error;
      return data;
    },
  });

  const isLoading = l1 || l2 || l3 || l4;

  // ── Helpers ──────────────────────────────────────────
  const monthInterval = useMemo(() => {
    const d = new Date(year, month, 1);
    return { start: startOfMonth(d), end: endOfMonth(d) };
  }, [month, year]);

  const inMonth = (datum: string) =>
    isWithinInterval(new Date(datum), monthInterval);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(now.getFullYear());
    for (const l of drivingLessons ?? []) years.add(new Date(l.datum).getFullYear());
    for (const t of theorySessions ?? []) years.add(new Date(t.datum).getFullYear());
    for (const e of exams ?? []) years.add(new Date(e.datum).getFullYear());
    return [...years].sort((a, b) => b - a);
  }, [drivingLessons, theorySessions, exams]);

  const validLessons = useMemo(
    () => (drivingLessons ?? []).filter((l) => l.typ !== "fehlstunde"),
    [drivingLessons]
  );

  // ── Per-instructor stats ─────────────────────────────
  const stats = useMemo(() => {
    if (!instructors) return [];

    return instructors.map((inst) => {
      const id = inst.id;
      const name = `${inst.nachname}, ${inst.vorname}`;

      const myLessons = validLessons.filter((l) => l.instructor_id === id);
      const fahrstundenGesamt = myLessons.reduce((s, l) => s + Number(l.einheiten), 0);
      const fahrstundenMonat = myLessons.filter((l) => inMonth(l.datum)).reduce((s, l) => s + Number(l.einheiten), 0);
      const umsatzMonat = myLessons.filter((l) => inMonth(l.datum)).reduce((s, l) => s + Number(l.preis), 0);

      const myTheory = (theorySessions ?? []).filter((t) => t.instructor_id === id);
      const theorieGesamt = myTheory.length;
      const theorieMonat = myTheory.filter((t) => inMonth(t.datum)).length;

      const myExams = (exams ?? []).filter((e) => e.instructor_id === id);
      const bestanden = myExams.filter((e) => e.status === "bestanden").length;
      const nichtBestanden = myExams.filter((e) => e.status === "nicht_bestanden").length;
      const pruefungenGesamt = bestanden + nichtBestanden;
      const pruefungenMonat = myExams.filter((e) => inMonth(e.datum) && (e.status === "bestanden" || e.status === "nicht_bestanden")).length;
      const bestehensquote = pruefungenGesamt > 0 ? Math.round((bestanden / pruefungenGesamt) * 100) : -1;

      return {
        id, name,
        fahrstundenMonat, fahrstundenGesamt,
        theorieMonat, theorieGesamt,
        pruefungen: pruefungenGesamt, pruefungenMonat,
        bestehensquote,
        umsatzMonat,
      };
    });
  }, [instructors, validLessons, theorySessions, exams, monthInterval]);

  const examStats = useMemo(() => stats.filter((s) => s.pruefungen > 0), [stats]);
  const hoursStats = useMemo(() => stats.filter((s) => s.fahrstundenGesamt > 0 || s.theorieGesamt > 0), [stats]);

  // ── Sorting ──────────────────────────────────────────
  const sortedExams = useMemo(() => {
    const arr = [...examStats];
    arr.sort((a, b) => {
      const va = (a as any)[examSortKey];
      const vb = (b as any)[examSortKey];
      if (typeof va === "string") return examSortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return examSortDir === "asc" ? va - vb : vb - va;
    });
    return arr;
  }, [examStats, examSortKey, examSortDir]);

  const sortedHours = useMemo(() => {
    const arr = [...hoursStats];
    arr.sort((a, b) => {
      const va = (a as any)[hoursSortKey];
      const vb = (b as any)[hoursSortKey];
      if (typeof va === "string") return hoursSortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return hoursSortDir === "asc" ? va - vb : vb - va;
    });
    return arr;
  }, [hoursStats, hoursSortKey, hoursSortDir]);

  const toggleExamSort = (key: ExamSortKey) => {
    if (examSortKey === key) setExamSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setExamSortKey(key); setExamSortDir("desc"); }
  };

  const toggleHoursSort = (key: HoursSortKey) => {
    if (hoursSortKey === key) setHoursSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setHoursSortKey(key); setHoursSortDir("desc"); }
  };

  // ── Global KPIs ──────────────────────────────────────
  const kpis = useMemo(() => {
    if (!stats.length) return null;
    const fahrstundenMonat = stats.reduce((s, x) => s + x.fahrstundenMonat, 0);
    const theorieMonat = stats.reduce((s, x) => s + x.theorieMonat, 0);
    const pruefungenMonat = stats.reduce((s, x) => s + x.pruefungenMonat, 0);
    const umsatzMonat = stats.reduce((s, x) => s + x.umsatzMonat, 0);
    const withQuote = stats.filter((s) => s.bestehensquote >= 0);
    const avgQuote = withQuote.length > 0 ? Math.round(withQuote.reduce((s, x) => s + x.bestehensquote, 0) / withQuote.length) : 0;
    return { fahrstundenMonat, theorieMonat, pruefungenMonat, umsatzMonat, avgQuote };
  }, [stats]);

  // ── Render ───────────────────────────────────────────
  return (
    <div className="space-y-4">
      <PageHeader
        title="Fahrlehrer-Statistik"
        icon={UserCheck}
        description="Leistungs-Dashboard pro Fahrlehrer"
        action={
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setInstructorDialogOpen(true)}>
            <Settings className="h-4 w-4" /> Fahrlehrer verwalten
          </Button>
        }
      />

      {/* Month/Year Filter */}
      <div className="flex gap-2 flex-wrap">
        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i} value={String(i)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard icon={Car} label="Fahrstunden (E)" value={kpis.fahrstundenMonat} color="bg-primary/15" iconColor="text-primary" />
          <KpiCard icon={BookOpen} label="Theoriestunden" value={kpis.theorieMonat} color="bg-blue-500/15" iconColor="text-blue-600" />
          <KpiCard icon={ClipboardCheck} label="Prüfungen" value={kpis.pruefungenMonat} color="bg-orange-500/15" iconColor="text-orange-600" />
          <KpiCard icon={TrendingUp} label="Ø Bestehensquote" value={`${kpis.avgQuote} %`} color="bg-green-500/15" iconColor="text-green-600" />
          <KpiCard icon={Euro} label="Umsatz Monat" value={`${kpis.umsatzMonat.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`} color="bg-yellow-500/15" iconColor="text-yellow-600" />
        </div>
      )}

      {/* ── Prüfungen Table ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardCheck className="h-5 w-5 text-orange-600" />
            Prüfungen
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead col="name" label="Fahrlehrer" sortKey={examSortKey} sortDir={examSortDir} onToggle={toggleExamSort} />
                <SortableHead col="pruefungen" label="Prüfungen Gesamt" sortKey={examSortKey} sortDir={examSortDir} onToggle={toggleExamSort} className="text-center" />
                <SortableHead col="pruefungenMonat" label="Prüfungen Monat" sortKey={examSortKey} sortDir={examSortDir} onToggle={toggleExamSort} className="text-center" />
                <SortableHead col="bestehensquote" label="Bestehensquote" sortKey={examSortKey} sortDir={examSortDir} onToggle={toggleExamSort} className="w-[180px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sortedExams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Keine Prüfungsdaten vorhanden.
                  </TableCell>
                </TableRow>
              ) : (
                sortedExams.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-center">{s.pruefungen}</TableCell>
                    <TableCell className="text-center">{s.pruefungenMonat}</TableCell>
                    <TableCell>
                      {s.bestehensquote >= 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                            <div
                              className={cn("h-full rounded-full transition-all", quoteBarClass(s.bestehensquote))}
                              style={{ width: `${s.bestehensquote}%` }}
                            />
                          </div>
                          <span className={cn("text-xs font-medium w-10 text-right", quoteColor(s.bestehensquote))}>
                            {s.bestehensquote} %
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">–</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Stunden & Umsatz Table ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="h-5 w-5 text-primary" />
            Stunden & Umsatz
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead col="name" label="Fahrlehrer" sortKey={hoursSortKey} sortDir={hoursSortDir} onToggle={toggleHoursSort} />
                <SortableHead col="fahrstundenMonat" label="Fahrst. (E) Monat" sortKey={hoursSortKey} sortDir={hoursSortDir} onToggle={toggleHoursSort} className="text-center" />
                <SortableHead col="fahrstundenGesamt" label="Fahrst. (E) Ges." sortKey={hoursSortKey} sortDir={hoursSortDir} onToggle={toggleHoursSort} className="text-center" />
                <SortableHead col="theorieMonat" label="Theorie Monat" sortKey={hoursSortKey} sortDir={hoursSortDir} onToggle={toggleHoursSort} className="text-center" />
                <SortableHead col="theorieGesamt" label="Theorie Ges." sortKey={hoursSortKey} sortDir={hoursSortDir} onToggle={toggleHoursSort} className="text-center" />
                <SortableHead col="umsatzMonat" label="Umsatz Monat" sortKey={hoursSortKey} sortDir={hoursSortDir} onToggle={toggleHoursSort} className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sortedHours.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Keine Stundendaten vorhanden.
                  </TableCell>
                </TableRow>
              ) : (
                sortedHours.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-center">{s.fahrstundenMonat}</TableCell>
                    <TableCell className="text-center">{s.fahrstundenGesamt}</TableCell>
                    <TableCell className="text-center">{s.theorieMonat}</TableCell>
                    <TableCell className="text-center">{s.theorieGesamt}</TableCell>
                    <TableCell className="text-right">
                      {s.umsatzMonat.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InstructorManageDialog open={instructorDialogOpen} onOpenChange={setInstructorDialogOpen} />
    </div>
  );
};

// ── Small helper components ──────────────────────────

function KpiCard({ icon: Icon, label, value, color, iconColor }: {
  icon: any; label: string; value: string | number; color: string; iconColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", color)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SortableHead<T extends string>({ col, label, sortKey, sortDir, onToggle, className }: {
  col: T; label: string; sortKey: T; sortDir: SortDir;
  onToggle: (k: T) => void; className?: string;
}) {
  return (
    <TableHead className={className}>
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => onToggle(col)}
      >
        {label}
        {sortKey !== col
          ? <ArrowUpDown className="h-3 w-3 opacity-40" />
          : sortDir === "asc"
            ? <ArrowUp className="h-3 w-3" />
            : <ArrowDown className="h-3 w-3" />
        }
      </button>
    </TableHead>
  );
}

export default FahrlehrerStatistik;
