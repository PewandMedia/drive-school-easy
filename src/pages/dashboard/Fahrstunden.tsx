import { useState, useMemo } from "react";
import { Car, Plus, Trash2, Euro, Clock, TrendingUp } from "lucide-react";
import { formatStudentName } from "@/lib/formatStudentName";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StudentCombobox from "@/components/StudentCombobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetchAllRows";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type DrivingLessonTyp = Database["public"]["Enums"]["driving_lesson_typ"];
type FahrzeugTyp = Database["public"]["Enums"]["fahrzeug_typ"];

const TYP_LABELS: Record<DrivingLessonTyp, string> = {
  uebungsstunde: "Übungsstunde",
  ueberland: "Überlandfahrt",
  autobahn: "Autobahnfahrt",
  nacht: "Nachtfahrt",
  fehlstunde: "Fehlstunde",
  testfahrt_b197: "Testfahrt B197",
};

const FAHRZEUG_LABELS: Record<FahrzeugTyp, string> = {
  automatik: "Automatik",
  schaltwagen: "Schaltwagen",
};

const DAUER_OPTIONS = [45, 90, 135];

const calculatePrice = (dauer: number) =>
  Math.round(((dauer / 45) * 65) * 100) / 100;

type Student = {
  id: string;
  vorname: string;
  nachname: string;
  geburtsdatum: string | null;
};

type Vehicle = {
  id: string;
  bezeichnung: string;
  typ: FahrzeugTyp;
  kennzeichen: string;
  aktiv: boolean;
};

type Instructor = {
  id: string;
  vorname: string;
  nachname: string;
};

type DrivingLesson = {
  id: string;
  student_id: string;
  instructor_id: string | null;
  typ: DrivingLessonTyp;
  fahrzeug_typ: FahrzeugTyp;
  dauer_minuten: number;
  einheiten: number;
  preis: number;
  datum: string;
};

const defaultForm = {
  student_id: "",
  instructor_id: "",
  typ: "uebungsstunde" as DrivingLessonTyp,
  fahrzeug_typ: "automatik" as FahrzeugTyp,
  vehicle_id: "",
  dauer_minuten: 0,
  datum: new Date().toISOString().slice(0, 16),
};

const Fahrstunden = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [filterTyp, setFilterTyp] = useState<string>("all");
  const [filterFahrzeug, setFilterFahrzeug] = useState<string>("all");
  const [filterStudent, setFilterStudent] = useState<string>("all");
  const [visibleOlderCount, setVisibleOlderCount] = useState(10);

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: () => fetchAllRows(supabase.from("students").select("id, vorname, nachname, geburtsdatum").order("nachname")),
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("aktiv", true)
        .order("bezeichnung");
      if (error) throw error;
      return (data ?? []) as Vehicle[];
    },
  });

  const { data: instructors = [] } = useQuery<Instructor[]>({
    queryKey: ["instructors_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, vorname, nachname")
        .eq("aktiv", true)
        .order("nachname");
      if (error) throw error;
      return (data ?? []) as Instructor[];
    },
  });

  const { data: lessons = [] } = useQuery<DrivingLesson[]>({
    queryKey: ["driving_lessons"],
    queryFn: () => fetchAllRows(supabase.from("driving_lessons").select("*").order("datum", { ascending: false })) as Promise<DrivingLesson[]>,
  });

  const insertMutation = useMutation({
    mutationFn: async (values: typeof defaultForm) => {
      const { error } = await supabase.from("driving_lessons").insert({
        student_id: values.student_id,
        instructor_id: values.instructor_id || null,
        typ: values.typ,
        fahrzeug_typ: values.fahrzeug_typ,
        dauer_minuten: values.dauer_minuten,
        datum: new Date(values.datum).toISOString(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driving_lessons"] });
      setForm(defaultForm);
      setOpen(false);
      toast({ title: "Fahrstunde gespeichert" });
    },
    onError: (e: Error) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("driving_lessons")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driving_lessons"] });
      toast({ title: "Fahrstunde gelöscht" });
    },
    onError: (e: Error) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id) {
      toast({ title: "Bitte einen Schüler auswählen", variant: "destructive" });
      return;
    }
    if (!form.instructor_id) {
      toast({ title: "Bitte einen Fahrlehrer auswählen", variant: "destructive" });
      return;
    }
    if (form.dauer_minuten <= 0) {
      toast({ title: "Bitte eine Dauer eingeben", variant: "destructive" });
      return;
    }
    insertMutation.mutate(form);
  };

  const studentMap = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, formatStudentName(s.nachname, s.vorname, s.geburtsdatum)])),
    [students]
  );

  const instructorMap = useMemo(
    () => Object.fromEntries(instructors.map((i) => [i.id, `${i.nachname}, ${i.vorname}`])),
    [instructors]
  );

  const filtered = useMemo(() => {
    return lessons.filter((l) => {
      if (filterTyp !== "all" && l.typ !== filterTyp) return false;
      if (filterFahrzeug !== "all" && l.fahrzeug_typ !== filterFahrzeug) return false;
      if (filterStudent !== "all" && l.student_id !== filterStudent) return false;
      return true;
    });
  }, [lessons, filterTyp, filterFahrzeug, filterStudent]);

  // Today / older split
  const todayLessons = useMemo(() => filtered.filter((l) => isToday(new Date(l.datum))), [filtered]);
  const olderLessons = useMemo(() => filtered.filter((l) => !isToday(new Date(l.datum))), [filtered]);
  const visibleOlder = olderLessons.slice(0, visibleOlderCount);
  const remainingOlder = olderLessons.length - visibleOlderCount;

  // Stats
  const gesamtumsatz = lessons.reduce((s, l) => s + Number(l.preis), 0);
  const avgDauer =
    lessons.length > 0
      ? Math.round(lessons.reduce((s, l) => s + l.dauer_minuten, 0) / lessons.length)
      : 0;

  const previewPrice = calculatePrice(form.dauer_minuten);
  const hasActiveFilters = filterTyp !== "all" || filterFahrzeug !== "all" || filterStudent !== "all";

  const renderRow = (lesson: DrivingLesson) => (
    <TableRow key={lesson.id}>
      <TableCell className="font-medium">
        {studentMap[lesson.student_id] ?? "–"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {format(new Date(lesson.datum), "dd.MM.yyyy HH:mm", { locale: de })}
      </TableCell>
      <TableCell>{TYP_LABELS[lesson.typ]}</TableCell>
      <TableCell>{FAHRZEUG_LABELS[lesson.fahrzeug_typ]}</TableCell>
      <TableCell className="text-muted-foreground">
        {lesson.instructor_id ? instructorMap[lesson.instructor_id] ?? "–" : "–"}
      </TableCell>
      <TableCell>{lesson.dauer_minuten} min ({lesson.einheiten ?? Math.floor(lesson.dauer_minuten / 45)} E)</TableCell>
      <TableCell className="text-right font-semibold">
        {Number(lesson.preis).toFixed(2)} €
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => deleteMutation.mutate(lesson.id)}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fahrstunden"
        description="Alle Fahrstunden verwalten und eintragen"
        icon={Car}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Fahrstunde eintragen
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Neue Fahrstunde</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Schüler</Label>
                  <StudentCombobox
                    students={students}
                    value={form.student_id}
                    onValueChange={(v) => setForm((f) => ({ ...f, student_id: v }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Fahrlehrer</Label>
                  <Select
                    value={form.instructor_id}
                    onValueChange={(v) => setForm((f) => ({ ...f, instructor_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Fahrlehrer wählen…" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.nachname}, {i.vorname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Typ</Label>
                  <Select
                    value={form.typ}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, typ: v as DrivingLessonTyp }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(TYP_LABELS) as [DrivingLessonTyp, string][]).map(
                        ([val, label]) => (
                          <SelectItem key={val} value={val}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Fahrzeug</Label>
                  {vehicles.length > 0 ? (
                    <Select
                      value={form.vehicle_id}
                      onValueChange={(v) => {
                        const veh = vehicles.find((x) => x.id === v);
                        setForm((f) => ({
                          ...f,
                          vehicle_id: v,
                          fahrzeug_typ: veh ? veh.typ : f.fahrzeug_typ,
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Fahrzeug wählen…" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((veh) => (
                          <SelectItem key={veh.id} value={veh.id}>
                            {veh.bezeichnung}
                            {veh.kennzeichen && ` · ${veh.kennzeichen}`}
                            {" · "}{FAHRZEUG_LABELS[veh.typ]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select
                      value={form.fahrzeug_typ}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, fahrzeug_typ: v as FahrzeugTyp }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(FAHRZEUG_LABELS) as [FahrzeugTyp, string][]).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Datum & Uhrzeit</Label>
                  <Input
                    type="datetime-local"
                    value={form.datum}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, datum: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Dauer (Minuten)</Label>
                  <div className="flex gap-2">
                    {DAUER_OPTIONS.map((d) => (
                      <Button
                        key={d}
                        type="button"
                        variant={form.dauer_minuten === d ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setForm((f) => ({ ...f, dauer_minuten: d }))
                        }
                      >
                        {d} min
                      </Button>
                    ))}
                    <Input
                      type="number"
                      min={0}
                      step={15}
                      className="w-24"
                      value={form.dauer_minuten || ""}
                      placeholder="0"
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          dauer_minuten: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Berechneter Preis
                  </span>
                  <span className="font-semibold text-foreground text-lg">
                    {form.dauer_minuten > 0 ? `${previewPrice.toFixed(2)} €` : "–"}
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={insertMutation.isPending}>
                    {insertMutation.isPending ? "Speichern…" : "Speichern"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Statistiken */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Euro className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Gesamtumsatz</p>
            <p className="text-xl font-bold text-foreground">
              {gesamtumsatz.toFixed(2)} €
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Einheiten gesamt</p>
            <p className="text-xl font-bold text-foreground">{lessons.filter(l => l.typ !== "fehlstunde").reduce((s, l) => s + (l.einheiten ?? Math.floor(l.dauer_minuten / 45)), 0)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ø Dauer</p>
            <p className="text-xl font-bold text-foreground">{avgDauer} min</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="w-52">
          <StudentCombobox
            students={students}
            value={filterStudent}
            onValueChange={setFilterStudent}
            allowAll
            placeholder="Schüler filtern"
          />
        </div>
        <Select value={filterTyp} onValueChange={setFilterTyp}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Typ filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Typen</SelectItem>
            {(Object.entries(TYP_LABELS) as [DrivingLessonTyp, string][]).map(
              ([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <Select value={filterFahrzeug} onValueChange={setFilterFahrzeug}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Fahrzeug filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Fahrzeuge</SelectItem>
            {(Object.entries(FAHRZEUG_LABELS) as [FahrzeugTyp, string][]).map(
              ([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterTyp("all");
              setFilterFahrzeug("all");
              setFilterStudent("all");
            }}
          >
            Filter zurücksetzen
          </Button>
        )}
      </div>

      {/* Tabelle */}
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Schüler</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Fahrzeug</TableHead>
              <TableHead>Fahrlehrer</TableHead>
              <TableHead>Dauer</TableHead>
              <TableHead className="text-right">Preis</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {todayLessons.length === 0 && olderLessons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Heute noch keine Fahrstunden eingetragen
                </TableCell>
              </TableRow>
            ) : (
              <>
                {todayLessons.map(renderRow)}
                {todayLessons.length > 0 && visibleOlder.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-2 text-xs text-muted-foreground bg-secondary/30">
                      Ältere Einträge
                    </TableCell>
                  </TableRow>
                )}
                {visibleOlder.map(renderRow)}
              </>
            )}
          </TableBody>
        </Table>

        {remainingOlder > 0 && (
          <div className="p-3 border-t border-border text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleOlderCount((c) => c + 10)}
            >
              Weitere {Math.min(10, remainingOlder)} von {olderLessons.length} anzeigen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Fahrstunden;
