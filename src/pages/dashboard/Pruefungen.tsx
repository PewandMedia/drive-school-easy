import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ClipboardCheck, Plus, CheckCircle2, XCircle, Car, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

// ── Types ──────────────────────────────────────────────────────────────────────
type ExamForm = {
  student_id: string;
  typ: "theorie" | "praxis";
  fahrzeug_typ: "automatik" | "schaltwagen";
  vehicle_id: string;
  datum: string;
  bestanden: boolean;
  preis: string;
};

const defaultForm = (): ExamForm => ({
  student_id: "",
  typ: "theorie",
  fahrzeug_typ: "automatik",
  vehicle_id: "",
  datum: new Date().toISOString().slice(0, 10),
  bestanden: false,
  preis: "0",
});

// ── Helpers ────────────────────────────────────────────────────────────────────
const statusBadge = (bestanden: boolean) =>
  bestanden
    ? "bg-green-500/15 text-green-400 border-green-500/30"
    : "bg-red-500/15 text-red-400 border-red-500/30";

const Pruefungen = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ExamForm>(defaultForm());
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const qc = useQueryClient();
  const typFilter = searchParams.get("typ") || "all";

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: exams = [], isLoading: loadingExams } = useQuery({
    queryKey: ["exams_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*, students(vorname, nachname, fuehrerscheinklasse)")
        .order("datum", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, vorname, nachname, fuehrerscheinklasse")
        .order("nachname");
      if (error) throw error;
      return data;
    },
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

  // ── Derived class logic ────────────────────────────────────────────────────
  const selectedStudent = students.find((s) => s.id === form.student_id);
  const klasse = selectedStudent?.fuehrerscheinklasse;
  const nurAutomatik = klasse === "B78" || klasse === "B197";

  // Auto-set fahrzeug_typ when class restricts
  useEffect(() => {
    if (nurAutomatik) {
      setForm((f) => ({ ...f, fahrzeug_typ: "automatik" }));
    }
  }, [form.student_id, nurAutomatik]);

  // Auto-fill price from Preisliste when typ changes or dialog opens
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

  // ── Mutation ─────────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("exams").insert({
        student_id: form.student_id,
        typ: form.typ,
        fahrzeug_typ: form.fahrzeug_typ,
        datum: new Date(form.datum).toISOString(),
        bestanden: form.bestanden,
        preis: parseFloat(form.preis) || 0,
      });
      if (error) throw error;
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

  // ── Filter + Stats ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (typFilter === "theorie") return exams.filter((e) => e.typ === "theorie");
    if (typFilter === "praxis") return exams.filter((e) => e.typ === "praxis");
    return exams;
  }, [exams, typFilter]);

  const bestanden = filtered.filter((e) => e.bestanden).length;
  const nichtBestanden = filtered.filter((e) => !e.bestanden).length;
  const gesamt = filtered.length;

  const canSave = form.student_id && form.datum;

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
          <span>Ergebnis</span>
        </div>

        {loadingExams ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-8 w-48 rounded-lg bg-secondary/60 animate-pulse" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">Noch keine Prüfungen eingetragen</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((exam) => {
              const st = exam.students as { vorname: string; nachname: string; fuehrerscheinklasse: string } | null;
              return (
                <div key={exam.id} className="grid grid-cols-6 gap-4 px-5 py-3 items-center text-sm">
                  <div className="col-span-2">
                    <span className="font-medium text-foreground">
                      {st ? `${st.nachname}, ${st.vorname}` : "–"}
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
                    {format(new Date(exam.datum), "dd.MM.yyyy", { locale: de })}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold w-fit ${statusBadge(exam.bestanden)}`}
                  >
                    {exam.bestanden ? (
                      <><CheckCircle2 className="h-3 w-3" /> Bestanden</>
                    ) : (
                      <><XCircle className="h-3 w-3" /> Nicht bestanden</>
                    )}
                  </span>
                </div>
              );
            })}
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
            {/* Schüler */}
            <div className="space-y-1.5">
              <Label>Schüler</Label>
              <Select
                value={form.student_id}
                onValueChange={(v) => setForm((f) => ({ ...f, student_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Schüler wählen…" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nachname}, {s.vorname} – Kl. {s.fuehrerscheinklasse}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* B78 Hinweis */}
              {klasse === "B78" && (
                <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                  <Car className="h-3 w-3" /> Klasse B78 – nur Automatik, keine Schaltberechtigung
                </p>
              )}
              {/* B197 Hinweis */}
              {klasse === "B197" && (
                <p className="text-xs text-cyan-400 flex items-center gap-1 mt-1">
                  <Car className="h-3 w-3" /> Klasse B197 – Fahrprüfung immer mit Automatik
                </p>
              )}
            </div>

            {/* Typ */}
            <div className="space-y-1.5">
              <Label>Prüfungstyp</Label>
              <Select
                value={form.typ}
                onValueChange={(v) => setForm((f) => ({ ...f, typ: v as "theorie" | "praxis" }))}
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

            {/* Fahrzeug */}
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
                      // nur setzen wenn nicht durch Klasse eingeschränkt
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

            {/* Datum */}
            <div className="space-y-1.5">
              <Label>Datum</Label>
              <Input
                type="date"
                value={form.datum}
                onChange={(e) => setForm((f) => ({ ...f, datum: e.target.value }))}
              />
            </div>

            {/* Bestanden */}
            <div className="space-y-1.5">
              <Label>Ergebnis</Label>
              <Select
                value={form.bestanden ? "ja" : "nein"}
                onValueChange={(v) => setForm((f) => ({ ...f, bestanden: v === "ja" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ja">Bestanden</SelectItem>
                  <SelectItem value="nein">Nicht bestanden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preis */}
            <div className="space-y-1.5">
              <Label>
                Preis (€)
                {priceEntries.length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    aus Preisliste vorausgefüllt
                  </span>
                )}
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.preis}
                onChange={(e) => setForm((f) => ({ ...f, preis: e.target.value }))}
              />
            </div>

            {/* Actions */}
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
    </div>
  );
};

export default Pruefungen;
