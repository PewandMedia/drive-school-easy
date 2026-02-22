import { useState } from "react";
import { ToggleLeft, Plus, Trash2, Clock, Users, TrendingUp } from "lucide-react";
import { formatStudentName } from "@/lib/formatStudentName";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
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
import { useToast } from "@/hooks/use-toast";

const DAUER_OPTIONS = [45, 90, 135];
const SCHALTSTUNDEN_PFLICHT = 10;

const TYP_LABELS: Record<string, string> = {
  uebungsstunde: "Übungsstunde",
  ueberland: "Überlandfahrt",
  autobahn: "Autobahnfahrt",
  nacht: "Nachtfahrt",
  fehlstunde: "Fehlstunde",
  testfahrt_b197: "Testfahrt B197",
};

type DrivingLessonTyp = "uebungsstunde" | "ueberland" | "autobahn" | "nacht" | "fehlstunde" | "testfahrt_b197";

type Student = { id: string; vorname: string; nachname: string; geburtsdatum: string | null };
type SchaltstundeRow = {
  id: string;
  student_id: string;
  datum: string;
  dauer_minuten: number;
  einheiten: number;
  typ: string;
};

const defaultForm = {
  student_id: "",
  typ: "uebungsstunde" as DrivingLessonTyp,
  dauer_minuten: 45,
  datum: new Date().toISOString().slice(0, 16),
};

const Schaltstunden = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [filterStudentId, setFilterStudentId] = useState<string>("all");

  // Nur B197-Schüler laden (datenbankseitig gefiltert)
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["students", "b197"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, vorname, nachname, geburtsdatum")
        .eq("fuehrerscheinklasse", "B197")
        .order("nachname");
      if (error) throw error;
      return data ?? [];
    },
  });

  const b197StudentIds = students.map((s) => s.id);

  // Schaltwagen-Fahrstunden nur für B197-Schüler
  const { data: lessons = [] } = useQuery<SchaltstundeRow[]>({
    queryKey: ["driving_lessons", "schaltwagen", "b197", b197StudentIds],
    queryFn: async () => {
      if (b197StudentIds.length === 0) return [];
      const { data, error } = await supabase
        .from("driving_lessons")
        .select("id, student_id, datum, dauer_minuten, einheiten, typ")
        .eq("fahrzeug_typ", "schaltwagen")
        .in("student_id", b197StudentIds)
        .order("datum", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SchaltstundeRow[];
    },
    enabled: b197StudentIds.length > 0,
  });

  // Insert mutation – legt driving_lesson mit fahrzeug_typ=schaltwagen an
  const insertMutation = useMutation({
    mutationFn: async (values: typeof defaultForm) => {
      const { error } = await supabase.from("driving_lessons").insert({
        student_id: values.student_id,
        typ: values.typ,
        fahrzeug_typ: "schaltwagen" as const,
        dauer_minuten: values.dauer_minuten,
        datum: new Date(values.datum).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driving_lessons"] });
      setForm(defaultForm);
      setOpen(false);
      toast({ title: "Schaltstunde gespeichert" });
    },
    onError: (e: Error) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  // Delete mutation – löscht aus driving_lessons
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("driving_lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driving_lessons"] });
      toast({ title: "Schaltstunde gelöscht" });
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
    insertMutation.mutate(form);
  };

  const studentMap = Object.fromEntries(
    students.map((s) => [s.id, formatStudentName(s.nachname, s.vorname, s.geburtsdatum)])
  );

  // Nur Nicht-Fehlstunden für Statistiken
  const statsLessons = lessons.filter((l) => l.typ !== "fehlstunde");

  // Einheiten gesamt (aus einheiten-Feld)
  const totalEinheiten = statsLessons.reduce(
    (sum, l) => sum + (l.einheiten || Math.floor(l.dauer_minuten / 45)), 0
  );

  // Filter
  const filtered =
    filterStudentId === "all"
      ? lessons
      : lessons.filter((l) => l.student_id === filterStudentId);

  // Ø Dauer (alle Schaltwagen-Fahrstunden)
  const avgDauer =
    lessons.length > 0
      ? Math.round(lessons.reduce((s, l) => s + l.dauer_minuten, 0) / lessons.length)
      : 0;

  // Einheiten pro Schüler (ohne Fehlstunden)
  const einheitenPerStudent: Record<string, number> = {};
  for (const l of statsLessons) {
    einheitenPerStudent[l.student_id] = (einheitenPerStudent[l.student_id] ?? 0) + (l.einheiten || Math.floor(l.dauer_minuten / 45));
  }

  const studentsCompleted = Object.values(einheitenPerStudent)
    .filter((count) => count >= SCHALTSTUNDEN_PFLICHT).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schaltstunden"
        description="Schaltstunden für B197-Schüler (10 Pflichteinheiten)"
        icon={ToggleLeft}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Stunde planen
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Neue Schaltstunde</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                {/* Schüler */}
                <div className="space-y-1.5">
                  <Label>Schüler</Label>
                  <Select
                    value={form.student_id}
                    onValueChange={(v) => setForm((f) => ({ ...f, student_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Schüler auswählen…" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {formatStudentName(s.nachname, s.vorname, s.geburtsdatum)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Typ */}
                <div className="space-y-1.5">
                  <Label>Typ</Label>
                  <Select
                    value={form.typ}
                    onValueChange={(v) => setForm((f) => ({ ...f, typ: v as DrivingLessonTyp }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["uebungsstunde", "ueberland", "autobahn", "nacht", "testfahrt_b197"] as const).map((t) => (
                        <SelectItem key={t} value={t}>
                          {TYP_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Datum & Uhrzeit */}
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

                {/* Dauer */}
                <div className="space-y-1.5">
                  <Label>Dauer (Minuten)</Label>
                  <div className="flex gap-2 flex-wrap">
                    {DAUER_OPTIONS.map((d) => (
                      <Button
                        key={d}
                        type="button"
                        variant={form.dauer_minuten === d ? "default" : "outline"}
                        size="sm"
                        onClick={() => setForm((f) => ({ ...f, dauer_minuten: d }))}
                      >
                        {d} min
                      </Button>
                    ))}
                    <Input
                      type="number"
                      min={1}
                      className="w-24"
                      value={form.dauer_minuten}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          dauer_minuten: parseInt(e.target.value) || 45,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
            <ToggleLeft className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Einheiten gesamt</p>
            <p className="text-xl font-bold text-foreground">{totalEinheiten}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Schüler abgeschlossen (≥ 10)</p>
            <p className="text-xl font-bold text-foreground">{studentsCompleted}</p>
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
        <Select value={filterStudentId} onValueChange={setFilterStudentId}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Schüler filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Schüler</SelectItem>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {formatStudentName(s.nachname, s.vorname, s.geburtsdatum)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filterStudentId !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterStudentId("all")}
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
              <TableHead>Typ</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Dauer</TableHead>
              <TableHead>Einheit</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Noch keine Schaltstunden eingetragen
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell className="font-medium">
                    {studentMap[lesson.student_id] ?? "–"}
                  </TableCell>
                  <TableCell>{TYP_LABELS[lesson.typ] ?? lesson.typ}</TableCell>
                  <TableCell>
                    {format(new Date(lesson.datum), "dd.MM.yyyy HH:mm", { locale: de })}
                  </TableCell>
                  <TableCell>{lesson.dauer_minuten} min</TableCell>
                  <TableCell className="text-muted-foreground">
                    {lesson.einheiten || Math.floor(lesson.dauer_minuten / 45)}E
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Schaltstunden;
