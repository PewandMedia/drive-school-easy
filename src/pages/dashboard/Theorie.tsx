import { useState } from "react";
import { BookOpen, Plus, Trash2, Users, GraduationCap, BookMarked } from "lucide-react";
import { formatStudentName } from "@/lib/formatStudentName";
import { THEORIE_LEKTIONEN, lektionToTyp } from "@/lib/theorieLektionen";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

type Student = { id: string; vorname: string; nachname: string; geburtsdatum: string | null };
type TheorySession = {
  id: string;
  student_id: string;
  datum: string;
  typ: "grundstoff" | "klassenspezifisch";
  lektion: number | null;
};

const defaultForm = {
  student_id: "",
  lektion: 1,
  datum: new Date().toISOString().slice(0, 16),
};

const Theorie = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [filterStudentId, setFilterStudentId] = useState<string>("all");
  const [visibleOlderCount, setVisibleOlderCount] = useState(10);

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: () => fetchAllRows(supabase.from("students").select("id, vorname, nachname, geburtsdatum").order("nachname")),
  });

  const { data: sessions = [] } = useQuery<TheorySession[]>({
    queryKey: ["theory_sessions"],
    queryFn: () => fetchAllRows(supabase.from("theory_sessions").select("id, student_id, datum, typ, lektion").order("datum", { ascending: false })) as Promise<TheorySession[]>,
  });

  const insertMutation = useMutation({
    mutationFn: async (values: typeof defaultForm) => {
      const typ = lektionToTyp(values.lektion);
      const { error } = await supabase.from("theory_sessions").insert({
        student_id: values.student_id,
        datum: new Date(values.datum).toISOString(),
        typ,
        lektion: values.lektion,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theory_sessions"] });
      setForm(defaultForm);
      setOpen(false);
      toast({ title: "Theoriestunde gespeichert" });
    },
    onError: (e: Error) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("theory_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theory_sessions"] });
      toast({ title: "Theoriestunde gelöscht" });
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

  // Session numbering
  const sessionsSortedAsc = [...sessions].sort(
    (a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime()
  );
  const sessionNumberMap: Record<string, number> = {};
  const counterPerStudent: Record<string, number> = {};
  for (const s of sessionsSortedAsc) {
    counterPerStudent[s.student_id] = (counterPerStudent[s.student_id] ?? 0) + 1;
    sessionNumberMap[s.id] = counterPerStudent[s.student_id];
  }

  const filtered =
    filterStudentId === "all"
      ? sessions
      : sessions.filter((s) => s.student_id === filterStudentId);

  // Today / older split
  const todaySessions = filtered.filter((s) => isToday(new Date(s.datum)));
  const olderSessions = filtered.filter((s) => !isToday(new Date(s.datum)));
  const visibleOlder = olderSessions.slice(0, visibleOlderCount);
  const remainingOlder = olderSessions.length - visibleOlderCount;

  // Stats
  const studentsWithGrundstoff = new Set(
    sessions.filter((s) => s.typ === "grundstoff").map((s) => s.student_id)
  ).size;
  const klassenspezifischCount = sessions.filter((s) => s.typ === "klassenspezifisch").length;

  const renderRow = (session: TheorySession) => {
    const typ = session.lektion ? lektionToTyp(session.lektion) : session.typ;
    const lektionLabel = session.lektion
      ? `Lektion ${session.lektion}`
      : (session.typ === "grundstoff" ? "Grundstoff" : "Klassenspezifisch");
    const typLabel = typ === "grundstoff" ? "Grundstoff" : "Klassenspezifisch";

    return (
      <TableRow key={session.id}>
        <TableCell className="font-medium">
          {studentMap[session.student_id] ?? "–"}
        </TableCell>
        <TableCell>
          {format(new Date(session.datum), "dd.MM.yyyy HH:mm", { locale: de })}
        </TableCell>
        <TableCell>
          <Badge variant={typ === "grundstoff" ? "default" : "secondary"}>
            {session.lektion ? `${lektionLabel} (${typLabel})` : lektionLabel}
          </Badge>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {sessionNumberMap[session.id]}. Stunde
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => deleteMutation.mutate(session.id)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Theorie"
        description="Theorieunterricht und Kurse verwalten"
        icon={BookOpen}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Stunde eintragen
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Neue Theoriestunde</DialogTitle>
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
                  <Label>Datum & Uhrzeit</Label>
                  <Input
                    type="datetime-local"
                    value={form.datum}
                    onChange={(e) => setForm((f) => ({ ...f, datum: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Theorielektion</Label>
                  <Select
                    value={String(form.lektion)}
                    onValueChange={(v) => setForm((f) => ({ ...f, lektion: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THEORIE_LEKTIONEN.map((l) => (
                        <SelectItem key={l.nr} value={String(l.nr)}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Theoriestunden gesamt</p>
            <p className="text-xl font-bold text-foreground">{sessions.length}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Schüler mit Grundstoff</p>
            <p className="text-xl font-bold text-foreground">{studentsWithGrundstoff}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Klassenspezifisch</p>
            <p className="text-xl font-bold text-foreground">{klassenspezifischCount}</p>
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
          <Button variant="ghost" size="sm" onClick={() => setFilterStudentId("all")}>
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
              <TableHead>Lektion</TableHead>
              <TableHead>Einheit</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {todaySessions.length === 0 && olderSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <BookMarked className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Heute noch keine Theoriestunden hinzugefügt
                </TableCell>
              </TableRow>
            ) : (
              <>
                {todaySessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-sm text-muted-foreground">
                      Heute noch keine Theoriestunden hinzugefügt
                    </TableCell>
                  </TableRow>
                ) : (
                  todaySessions.map(renderRow)
                )}
                {visibleOlder.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-2 text-xs text-muted-foreground bg-secondary/30">
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
              Weitere {Math.min(10, remainingOlder)} von {olderSessions.length} anzeigen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Theorie;
