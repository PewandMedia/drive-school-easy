import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { formatStudentName } from "@/lib/formatStudentName";
import { ClipboardCheck, Plus, CheckCircle2, XCircle, Car, Filter, Pencil, Calendar, AlertTriangle, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ActivityInfoButton from "@/components/ActivityInfoButton";
import InstructorManageDialog from "@/components/InstructorManageDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetchAllRows";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StudentCombobox from "@/components/StudentCombobox";

// ── Types ──────────────────────────────────────────────────────────────────────
type ExamStatus = "angemeldet" | "bestanden" | "nicht_bestanden" | "krank";

type ExamForm = {
  student_id: string;
  typ: "theorie" | "praxis";
  fahrzeug_typ: "automatik" | "schaltwagen";
  vehicle_id: string;
  instructor_id: string;
  datum: string;
  status: ExamStatus;
  preis: string;
};

const defaultForm = (): ExamForm => ({
  student_id: "",
  typ: "theorie",
  fahrzeug_typ: "automatik",
  vehicle_id: "",
  instructor_id: "",
  datum: new Date().toISOString().slice(0, 10),
  status: "angemeldet",
  preis: "0",
});

const STATUS_CONFIG: Record<ExamStatus, { label: string; cls: string; icon: React.ElementType }> = {
  angemeldet: { label: "Angemeldet", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: Calendar },
  bestanden: { label: "Bestanden", cls: "bg-green-500/15 text-green-400 border-green-500/30", icon: CheckCircle2 },
  nicht_bestanden: { label: "Nicht bestanden", cls: "bg-red-500/15 text-red-400 border-red-500/30", icon: XCircle },
  krank: { label: "Krank", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: AlertTriangle },
};

const Pruefungen = () => {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ExamForm>(defaultForm());
  const [instructorDialogOpen, setInstructorDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [visibleCount, setVisibleCount] = useState(10);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();
  const typFilter = searchParams.get("typ") || "all";

  const { data: exams = [], isLoading: loadingExams } = useQuery({
    queryKey: ["exams_all"],
    queryFn: () => fetchAllRows(supabase.from("exams").select("*, students(vorname, nachname, fuehrerscheinklasse, geburtsdatum)").order("datum", { ascending: false })),
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students_list"],
    queryFn: () => fetchAllRows(supabase.from("students").select("id, vorname, nachname, fuehrerscheinklasse, geburtsdatum").order("nachname")),
  });

  const { data: priceEntries = [] } = useQuery({
    queryKey: ["prices_pruefungen"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prices")
        .select("*")
        .eq("aktiv", true)
        .ilike("kategorie", "Prüfungen");
      if (error) throw error;
      return data;
    },
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("aktiv", true)
        .order("bezeichnung");
      if (error) throw error;
      return data as { id: string; bezeichnung: string; typ: "automatik" | "schaltwagen"; kennzeichen: string }[];
    },
  });

  const { data: instructors = [] } = useQuery({
    queryKey: ["instructors_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, vorname, nachname")
        .eq("aktiv", true)
        .order("nachname");
      if (error) throw error;
      return data;
    },
  });

  const selectedStudent = students.find((s) => s.id === form.student_id);
  const klasse = selectedStudent?.fuehrerscheinklasse;
  const nurAutomatik = klasse === "B78" || klasse === "B197";

  useEffect(() => {
    if (nurAutomatik) {
      setForm((f) => ({ ...f, fahrzeug_typ: "automatik" }));
    }
  }, [form.student_id, nurAutomatik]);

  useEffect(() => {
    if (priceEntries.length > 0 && open) {
      const match = priceEntries.find((p) =>
        form.typ === "theorie"
          ? p.bezeichnung.toLowerCase().includes("theorie")
          : p.bezeichnung.toLowerCase().includes("fahr") || p.bezeichnung.toLowerCase().includes("praxis")
      ) ?? priceEntries[0];
      if (match) {
        setForm((f) => ({ ...f, preis: String(match.preis) }));
      }
    }
  }, [form.typ, open, priceEntries]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("exams").insert({
        student_id: form.student_id,
        typ: form.typ,
        fahrzeug_typ: form.fahrzeug_typ,
        datum: new Date(form.datum).toISOString(),
        status: form.status,
        preis: parseFloat(form.preis) || 0,
        instructor_id: form.typ === "praxis" ? form.instructor_id : null,
      }).select("id").single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams_all"] });
      toast({ title: "Prüfung eingetragen" });
      setOpen(false);
      setForm(defaultForm());
    },
    onError: (e: Error) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ examId, status }: { examId: string; status: ExamStatus }) => {
      const { error } = await supabase.from("exams").update({ status }).eq("id", examId);
      if (error) throw error;
      return examId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams_all"] });
      qc.invalidateQueries({ queryKey: ["exams"] });
      setEditingStatusId(null);
      toast({ title: "Status aktualisiert" });
    },
    onError: (e: Error) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams_all"] });
      qc.invalidateQueries({ queryKey: ["open_items"] });
      toast({ title: "Prüfung gelöscht" });
    },
    onError: (e: Error) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  const filtered = useMemo(() => {
    if (typFilter === "theorie") return exams.filter((e) => e.typ === "theorie");
    if (typFilter === "praxis") return exams.filter((e) => e.typ === "praxis");
    return exams;
  }, [exams, typFilter]);

  const visibleExams = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visibleCount;

  const bestanden = filtered.filter((e) => e.status === "bestanden").length;
  const nichtBestanden = filtered.filter((e) => e.status === "nicht_bestanden").length;
  const gesamt = filtered.length;

  const canSave = form.student_id && form.datum && (form.typ === "praxis" ? !!form.instructor_id : true);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prüfungen"
        description="Theorie- und Fahrprüfungen verwalten"
        icon={ClipboardCheck}
        action={
          <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />Prüfung eintragen
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          ["Gesamt", gesamt, "text-foreground"],
          ["Bestanden", bestanden, "text-green-400"],
          ["Nicht bestanden", nichtBestanden, "text-destructive"],
        ].map(([l, v, c]) => (
          <div key={l as string} className="rounded-xl border border-border bg-card p-5">
            <p className={`text-2xl font-bold ${c}`}>{v}</p>
            <p className="text-sm text-muted-foreground mt-1">{l}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select
          value={typFilter}
          onValueChange={(v) => {
            if (v === "all") {
              searchParams.delete("typ");
              setSearchParams(searchParams);
            } else {
              setSearchParams({ typ: v });
            }
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Prüfungen</SelectItem>
            <SelectItem value="theorie">Theorieprüfung</SelectItem>
            <SelectItem value="praxis">Fahrprüfung</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-6 gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span className="col-span-2">Schüler</span>
          <span>Typ</span>
          <span>Fahrzeug</span>
          <span>Datum</span>
          <span>Status</span>
        </div>

        {loadingExams ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-8 w-48 rounded-lg bg-secondary/60 animate-pulse" />
          </div>
        ) : visibleExams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">Noch keine Prüfungen eingetragen</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {visibleExams.map((exam) => {
              const st = exam.students as { vorname: string; nachname: string; fuehrerscheinklasse: string; geburtsdatum: string | null } | null;
              const status = (exam.status || "angemeldet") as ExamStatus;
              const cfg = STATUS_CONFIG[status];
              const Icon = cfg.icon;
              return (
                <div key={exam.id} className="grid grid-cols-6 gap-4 px-5 py-3 items-center text-sm">
                  <div className="col-span-2">
                    <span className="font-medium text-foreground">
                      {st ? formatStudentName(st.nachname, st.vorname, st.geburtsdatum) : "–"}
                    </span>
                    {st && (
                      <span className="ml-2 text-xs text-muted-foreground">Kl. {st.fuehrerscheinklasse}</span>
                    )}
                  </div>
                  <span className="text-muted-foreground capitalize">
                    {exam.typ === "theorie" ? "Theorie" : "Fahrprüfung"}
                  </span>
                  <span className="text-muted-foreground capitalize">
                    {exam.fahrzeug_typ === "automatik" ? "Automatik" : "Schaltwagen"}
                  </span>
                  <span className="text-muted-foreground">
                    {exam.datum && !isNaN(new Date(exam.datum).getTime())
                      ? format(new Date(exam.datum), "dd.MM.yyyy", { locale: de })
                      : "–"}
                  </span>
                  <div className="relative flex items-center gap-1">
                    {editingStatusId === exam.id ? (
                      <Select
                        value={status}
                        onValueChange={(v) => updateStatusMutation.mutate({ examId: exam.id, status: v as ExamStatus })}
                      >
                        <SelectTrigger className="h-7 text-xs w-fit">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="angemeldet">Angemeldet</SelectItem>
                          <SelectItem value="bestanden">Bestanden</SelectItem>
                          <SelectItem value="nicht_bestanden">Nicht bestanden</SelectItem>
                          <SelectItem value="krank">Krank</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <button
                        onClick={() => setEditingStatusId(exam.id)}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold w-fit cursor-pointer hover:opacity-80 transition-opacity ${cfg.cls}`}
                      >
                        <Icon className="h-3 w-3" /> {cfg.label}
                      </button>
                    )}
                    <ActivityInfoButton entityId={exam.id} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(exam.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {remaining > 0 && (
          <div className="p-3 border-t border-border text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleCount((c) => c + 10)}
            >
              Weitere {Math.min(10, remaining)} von {filtered.length} anzeigen
            </Button>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(defaultForm()); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Prüfung eintragen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Schüler</Label>
              <StudentCombobox
                students={students}
                value={form.student_id}
                onValueChange={(v) => setForm((f) => ({ ...f, student_id: v }))}
                placeholder="Schüler wählen…"
              />
              {klasse === "B78" && (
                <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                  <Car className="h-3 w-3" /> Klasse B78 – nur Automatik, keine Schaltberechtigung
                </p>
              )}
              {klasse === "B197" && (
                <p className="text-xs text-cyan-400 flex items-center gap-1 mt-1">
                  <Car className="h-3 w-3" /> Klasse B197 – Fahrprüfung immer mit Automatik
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Prüfungstyp</Label>
              <Select
                value={form.typ}
                onValueChange={(v) => setForm((f) => ({ ...f, typ: v as "theorie" | "praxis", instructor_id: v === "theorie" ? "" : f.instructor_id }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="theorie">Theorieprüfung</SelectItem>
                  <SelectItem value="praxis">Fahrprüfung</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.typ === "praxis" && (
              <div className="space-y-1.5">
                <Label>Fahrlehrer *</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={form.instructor_id}
                    onValueChange={(v) => setForm((f) => ({ ...f, instructor_id: v }))}
                  >
                    <SelectTrigger className="flex-1">
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
                  <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => setInstructorDialogOpen(true)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {form.typ === "praxis" && (
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
                        fahrzeug_typ: !nurAutomatik && veh ? veh.typ : f.fahrzeug_typ,
                      }));
                    }}
                    disabled={nurAutomatik && false}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Fahrzeug wählen…" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles
                        .filter((v) => !nurAutomatik || v.typ === "automatik")
                        .map((veh) => (
                          <SelectItem key={veh.id} value={veh.id}>
                            {veh.bezeichnung}
                            {veh.kennzeichen && ` · ${veh.kennzeichen}`}
                            {" · "}{veh.typ === "automatik" ? "Automatik" : "Schaltwagen"}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={form.fahrzeug_typ}
                    onValueChange={(v) => setForm((f) => ({ ...f, fahrzeug_typ: v as "automatik" | "schaltwagen" }))}
                    disabled={nurAutomatik}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatik">Automatik</SelectItem>
                      {!nurAutomatik && <SelectItem value="schaltwagen">Schaltwagen</SelectItem>}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Termin-Datum</Label>
              <Input
                type="date"
                value={form.datum}
                onChange={(e) => setForm((f) => ({ ...f, datum: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as ExamStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="angemeldet">Angemeldet</SelectItem>
                  <SelectItem value="bestanden">Bestanden</SelectItem>
                  <SelectItem value="nicht_bestanden">Nicht bestanden</SelectItem>
                  <SelectItem value="krank">Krank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Preis (€)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.preis}
                onChange={(e) => setForm((f) => ({ ...f, preis: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setOpen(false); setForm(defaultForm()); }}>
                Abbrechen
              </Button>
              <Button
                disabled={!canSave || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? "Speichern…" : "Speichern"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <InstructorManageDialog open={instructorDialogOpen} onOpenChange={setInstructorDialogOpen} />
    </div>
  );
};

export default Pruefungen;
