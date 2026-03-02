import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetchAllRows";
import PageHeader from "@/components/PageHeader";
import {
  UserCheck, Car, BookOpen, ClipboardCheck, TrendingUp, Euro,
  Settings, ArrowUpDown, ArrowUp, ArrowDown, CalendarDays,
  CheckCircle2, XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import InstructorManageDialog from "@/components/InstructorManageDialog";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from "date-fns";

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

const MONTHS_SHORT = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

const quoteColor = (q: number) =>
  q >= 80 ? "text-green-600" : q >= 60 ? "text-yellow-600" : "text-destructive";

const quoteBarClass = (q: number) =>
  q >= 80 ? "bg-green-500" : q >= 60 ? "bg-yellow-500" : "bg-destructive";

const dimZero = (val: number) => val === 0 ? "text-muted-foreground/60" : "";

type ExamSortKey = "name" | "pruefungen" | "bestanden" | "nichtBestanden" | "bestehensquote";
type HoursSortKey = "name" | "fahrstundenPeriod" | "fahrstundenGesamt" | "theoriePeriod" | "theorieGesamt" | "umsatzPeriod" | "avgEinheiten";
type SortDir = "asc" | "desc";
type ViewMode = "month" | "year";

const FahrlehrerStatistik = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [examSortKey, setExamSortKey] = useState<ExamSortKey>("pruefungen");
  const [examSortDir, setExamSortDir] = useState<SortDir>("desc");
  const [hoursSortKey, setHoursSortKey] = useState<HoursSortKey>("fahrstundenPeriod");
  const [hoursSortDir, setHoursSortDir] = useState<SortDir>("desc");
  const [instructorDialogOpen, setInstructorDialogOpen] = useState(false);

  const periodLabel = viewMode === "year" ? String(year) : MONTHS[month];

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
  const periodInterval = useMemo(() => {
    const d = new Date(year, month, 1);
    return viewMode === "year"
      ? { start: startOfYear(d), end: endOfYear(d) }
      : { start: startOfMonth(d), end: endOfMonth(d) };
  }, [month, year, viewMode]);

  const inPeriod = (datum: string) =>
    isWithinInterval(new Date(datum), periodInterval);

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
      const fahrstundenPeriod = myLessons.filter((l) => inPeriod(l.datum)).reduce((s, l) => s + Number(l.einheiten), 0);
      const umsatzPeriod = myLessons.filter((l) => inPeriod(l.datum)).reduce((s, l) => s + Number(l.preis), 0);

      // Active months for average
      const activeMonths = new Set(myLessons.map((l) => {
        const d = new Date(l.datum);
        return `${d.getFullYear()}-${d.getMonth()}`;
      }));
      const avgEinheiten = activeMonths.size > 0 ? Math.round((fahrstundenGesamt / activeMonths.size) * 10) / 10 : 0;

      const myTheory = (theorySessions ?? []).filter((t) => t.instructor_id === id);
      const theorieGesamt = myTheory.length;
      const theoriePeriod = myTheory.filter((t) => inPeriod(t.datum)).length;

      const myExams = (exams ?? []).filter((e) => e.instructor_id === id);
      const myPeriodExams = myExams.filter((e) => inPeriod(e.datum));
      const bestanden = myPeriodExams.filter((e) => e.status === "bestanden").length;
      const nichtBestanden = myPeriodExams.filter((e) => e.status === "nicht_bestanden").length;
      const pruefungen = bestanden + nichtBestanden;
      const bestehensquote = pruefungen > 0 ? Math.round((bestanden / pruefungen) * 100) : -1;

      return {
        id, name,
        fahrstundenPeriod, fahrstundenGesamt, avgEinheiten,
        theoriePeriod, theorieGesamt,
        pruefungen, bestanden, nichtBestanden,
        bestehensquote,
        umsatzPeriod,
      };
    });
  }, [instructors, validLessons, theorySessions, exams, periodInterval]);

  const examStats = useMemo(() => stats.filter((s) => s.pruefungen > 0), [stats]);

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
    const arr = [...stats];
    arr.sort((a, b) => {
      const va = (a as any)[hoursSortKey];
      const vb = (b as any)[hoursSortKey];
      if (typeof va === "string") return hoursSortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return hoursSortDir === "asc" ? va - vb : vb - va;
    });
    return arr;
  }, [stats, hoursSortKey, hoursSortDir]);

  // ── Totals ───────────────────────────────────────────
  const totals = useMemo(() => ({
    fahrstundenPeriod: stats.reduce((s, x) => s + x.fahrstundenPeriod, 0),
    fahrstundenGesamt: stats.reduce((s, x) => s + x.fahrstundenGesamt, 0),
    theoriePeriod: stats.reduce((s, x) => s + x.theoriePeriod, 0),
    theorieGesamt: stats.reduce((s, x) => s + x.theorieGesamt, 0),
    umsatzPeriod: stats.reduce((s, x) => s + x.umsatzPeriod, 0),
    avgEinheiten: stats.length > 0 ? Math.round((stats.reduce((s, x) => s + x.avgEinheiten, 0) / stats.length) * 10) / 10 : 0,
  }), [stats]);

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
    const totalPruefungen = stats.reduce((s, x) => s + x.pruefungen, 0);
    const totalBestanden = stats.reduce((s, x) => s + x.bestanden, 0);
    const totalNichtBestanden = stats.reduce((s, x) => s + x.nichtBestanden, 0);
    const withQuote = stats.filter((s) => s.bestehensquote >= 0);
    const avgQuote = withQuote.length > 0 ? Math.round(withQuote.reduce((s, x) => s + x.bestehensquote, 0) / withQuote.length) : 0;
    return {
      fahrstundenPeriod: totals.fahrstundenPeriod,
      theoriePeriod: totals.theoriePeriod,
      totalPruefungen,
      totalBestanden,
      totalNichtBestanden,
      umsatzPeriod: totals.umsatzPeriod,
      avgQuote,
    };
  }, [stats, totals]);

  // ── Render ───────────────────────────────────────────
  return (
    <div className="space-y-6">
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

      {/* ── Filter Bar ────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Row 1: View mode toggle + Year select + Period badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="inline-flex rounded-lg border bg-muted p-1 gap-0.5">
                <Button
                  size="sm"
                  variant={viewMode === "month" ? "default" : "ghost"}
                  className="h-8 px-4 text-xs font-semibold"
                  onClick={() => setViewMode("month")}
                >
                  Monat
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "year" ? "default" : "ghost"}
                  className="h-8 px-4 text-xs font-semibold"
                  onClick={() => setViewMode("year")}
                >
                  Ganzes Jahr
                </Button>
              </div>

              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Badge variant="secondary" className="h-8 px-3 text-sm font-medium gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {viewMode === "year" ? `Jahr ${year}` : `${MONTHS[month]} ${year}`}
              </Badge>
            </div>

            {/* Row 2: Month buttons (only when viewMode=month) */}
            {viewMode === "month" && (
              <div className="flex gap-1 flex-wrap">
                {MONTHS_SHORT.map((m, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={month === i ? "default" : "outline"}
                    className={cn(
                      "h-8 px-3 text-xs font-medium transition-all",
                      month === i && "shadow-sm"
                    )}
                    onClick={() => setMonth(i)}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── KPI Cards ──────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard icon={Car} label={`Fahrstunden ${periodLabel}`} value={kpis.fahrstundenPeriod} color="bg-primary/15" iconColor="text-primary" />
          <KpiCard icon={BookOpen} label={`Theorie ${periodLabel}`} value={kpis.theoriePeriod} color="bg-blue-500/15" iconColor="text-blue-600" />
          <KpiCard
            icon={ClipboardCheck}
            label={`Prüfungen ${periodLabel}`}
            value={kpis.totalPruefungen}
            color="bg-orange-500/15"
            iconColor="text-orange-600"
            detail={
              <span className="text-xs text-muted-foreground mt-0.5">
                <span className="text-green-600 font-medium">{kpis.totalBestanden}</span>
                {" ✓ / "}
                <span className="text-destructive font-medium">{kpis.totalNichtBestanden}</span>
                {" ✗"}
              </span>
            }
          />
          <KpiCard icon={TrendingUp} label="Ø Bestehensquote" value={`${kpis.avgQuote} %`} color="bg-green-500/15" iconColor="text-green-600" />
          <KpiCard
            icon={Euro}
            label={`Umsatz ${periodLabel}`}
            value={`${kpis.umsatzPeriod.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`}
            color="bg-yellow-500/15"
            iconColor="text-yellow-600"
          />
        </div>
      )}

      {/* ── Prüfungen Table ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardCheck className="h-5 w-5 text-orange-600" />
            Prüfungen
            <Badge variant="outline" className="ml-auto text-xs font-normal">{periodLabel}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <SortableHead col="name" label="Fahrlehrer" sortKey={examSortKey} sortDir={examSortDir} onToggle={toggleExamSort} />
                <SortableHead col="pruefungen" label="Gesamt" sortKey={examSortKey} sortDir={examSortDir} onToggle={toggleExamSort} className="text-center" />
                <SortableHead col="bestanden" label="Bestanden" sortKey={examSortKey} sortDir={examSortDir} onToggle={toggleExamSort} className="text-center" />
                <SortableHead col="nichtBestanden" label="Nicht best." sortKey={examSortKey} sortDir={examSortDir} onToggle={toggleExamSort} className="text-center" />
                <SortableHead col="bestehensquote" label="Bestehensquote" sortKey={examSortKey} sortDir={examSortDir} onToggle={toggleExamSort} className="w-[180px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sortedExams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Keine Prüfungsdaten vorhanden.
                  </TableCell>
                </TableRow>
              ) : (
                sortedExams.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className={cn("text-center font-semibold", dimZero(s.pruefungen))}>{s.pruefungen}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn("inline-flex items-center gap-1 font-semibold", s.bestanden > 0 ? "text-green-600" : "text-muted-foreground/60")}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {s.bestanden}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn("inline-flex items-center gap-1 font-semibold", s.nichtBestanden > 0 ? "text-destructive" : "text-muted-foreground/60")}>
                        <XCircle className="h-3.5 w-3.5" />
                        {s.nichtBestanden}
                      </span>
                    </TableCell>
                    <TableCell>
                      {s.bestehensquote >= 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                            <div
                              className={cn("h-full rounded-full transition-all", quoteBarClass(s.bestehensquote))}
                              style={{ width: `${s.bestehensquote}%` }}
                            />
                          </div>
                          <span className={cn("text-xs font-bold w-10 text-right", quoteColor(s.bestehensquote))}>
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
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="h-5 w-5 text-primary" />
            Stunden & Umsatz
            <Badge variant="outline" className="ml-auto text-xs font-normal">{periodLabel}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <SortableHead col="name" label="Fahrlehrer" sortKey={hoursSortKey} sortDir={hoursSortDir} onToggle={toggleHoursSort} />
                <SortableHead col="fahrstundenPeriod" label={`Fahrst. ${periodLabel}`} sortKey={hoursSortKey} sortDir={hoursSortDir} onToggle={toggleHoursSort} className="text-center" />
                <SortableHead col="fahrstundenGesamt" label="Fahrst. Ges." sortKey={hoursSortKey} sortDir={hoursSortDir} onToggle={toggleHoursSort} className="text-center" />
                <SortableHead col="avgEinheiten" label="Ø/Monat" sortKey={hoursSortKey} sortDir={hoursSortDir} onToggle={toggleHoursSort} className="text-center" />
                <SortableHead col="theoriePeriod" label={`Theorie ${periodLabel}`} sortKey={hoursSortKey} sortDir={hoursSortDir} onToggle={toggleHoursSort} className="text-center" />
                <SortableHead col="theorieGesamt" label="Theorie Ges." sortKey={hoursSortKey} sortDir={hoursSortDir} onToggle={toggleHoursSort} className="text-center" />
                <SortableHead col="umsatzPeriod" label={`Umsatz ${periodLabel}`} sortKey={hoursSortKey} sortDir={hoursSortDir} onToggle={toggleHoursSort} className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sortedHours.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Keine Fahrlehrer vorhanden.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {sortedHours.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className={cn("text-center", dimZero(s.fahrstundenPeriod))}>{s.fahrstundenPeriod}</TableCell>
                      <TableCell className={cn("text-center", dimZero(s.fahrstundenGesamt))}>{s.fahrstundenGesamt}</TableCell>
                      <TableCell className={cn("text-center", dimZero(s.avgEinheiten))}>{s.avgEinheiten}</TableCell>
                      <TableCell className={cn("text-center", dimZero(s.theoriePeriod))}>{s.theoriePeriod}</TableCell>
                      <TableCell className={cn("text-center", dimZero(s.theorieGesamt))}>{s.theorieGesamt}</TableCell>
                      <TableCell className={cn("text-right", dimZero(s.umsatzPeriod))}>
                        {s.umsatzPeriod.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals row */}
                  <TableRow className="bg-muted/30 font-semibold border-t-2">
                    <TableCell>Gesamt</TableCell>
                    <TableCell className="text-center">{totals.fahrstundenPeriod}</TableCell>
                    <TableCell className="text-center">{totals.fahrstundenGesamt}</TableCell>
                    <TableCell className="text-center">{totals.avgEinheiten}</TableCell>
                    <TableCell className="text-center">{totals.theoriePeriod}</TableCell>
                    <TableCell className="text-center">{totals.theorieGesamt}</TableCell>
                    <TableCell className="text-right">
                      {totals.umsatzPeriod.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                    </TableCell>
                  </TableRow>
                </>
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

function KpiCard({ icon: Icon, label, value, color, iconColor, detail }: {
  icon: any; label: string; value: string | number; color: string; iconColor: string; detail?: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", color)}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-2xl font-bold leading-tight">{value}</p>
          {detail}
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
