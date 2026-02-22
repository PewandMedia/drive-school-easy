import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ListChecks, Plus, ChevronRight, Search } from "lucide-react";
import { formatStudentName } from "@/lib/formatStudentName";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StudentCombobox from "@/components/StudentCombobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";

type ServiceStatus = "offen" | "bezahlt" | "erledigt";

type Service = {
  id: string;
  created_at: string;
  student_id: string;
  preis_id: string | null;
  bezeichnung: string;
  preis: number;
  status: ServiceStatus;
  students: { vorname: string; nachname: string; geburtsdatum: string | null } | null;
};

type Price = {
  id: string;
  bezeichnung: string;
  kategorie: string;
  preis: number;
  einheit: string | null;
  aktiv: boolean;
};

type Student = {
  id: string;
  vorname: string;
  nachname: string;
  geburtsdatum: string | null;
};

const statusConfig: Record<ServiceStatus, { label: string; className: string }> = {
  offen: { label: "Offen", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  bezahlt: { label: "Bezahlt", className: "bg-green-500/15 text-green-400 border-green-500/30" },
  erledigt: { label: "Erledigt", className: "bg-secondary text-muted-foreground border-border" },
};

const defaultForm = {
  student_id: "",
  preis_id: "",
  bezeichnung: "",
  preis: "",
  status: "offen" as ServiceStatus,
};

const Leistungen = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ServiceStatus | "alle">("alle");

  // Fetch services joined with student names
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*, students(vorname, nachname, geburtsdatum)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Service[];
    },
  });

  // Fetch active prices for dropdown
  const { data: prices = [] } = useQuery({
    queryKey: ["prices", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prices")
        .select("*")
        .eq("aktiv", true)
        .order("kategorie")
        .order("bezeichnung");
      if (error) throw error;
      return data as Price[];
    },
  });

  // Fetch students for dropdown
  const { data: students = [] } = useQuery({
    queryKey: ["students", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, vorname, nachname, geburtsdatum")
        .order("nachname");
      if (error) throw error;
      return data as Student[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: typeof defaultForm) => {
      const { error } = await supabase.from("services").insert([{
        student_id: values.student_id,
        preis_id: values.preis_id || null,
        bezeichnung: values.bezeichnung,
        preis: parseFloat(values.preis) || 0,
        status: values.status,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setOpen(false);
      setForm(defaultForm);
      setFormError("");
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ServiceStatus }) => {
      const { error } = await supabase.from("services").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  // When a price is selected, auto-fill bezeichnung and preis
  const handlePreisSelect = (preisId: string) => {
    const found = prices.find((p) => p.id === preisId);
    if (found) {
      setForm((f) => ({
        ...f,
        preis_id: preisId,
        bezeichnung: found.bezeichnung,
        preis: found.preis.toString(),
      }));
    } else {
      setForm((f) => ({ ...f, preis_id: preisId }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id) { setFormError("Bitte einen Schüler auswählen."); return; }
    if (!form.bezeichnung) { setFormError("Bezeichnung ist ein Pflichtfeld."); return; }
    setFormError("");
    createMutation.mutate(form);
  };

  // Stats
  const totalOffen = services.filter((s) => s.status === "offen").reduce((sum, s) => sum + Number(s.preis), 0);
  const totalBezahlt = services.filter((s) => s.status === "bezahlt").reduce((sum, s) => sum + Number(s.preis), 0);

  // Filter
  const filtered = services.filter((s) => {
    const name = `${s.students?.nachname} ${s.students?.vorname}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || s.bezeichnung.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "alle" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Group by student
  const grouped = filtered.reduce<Record<string, Service[]>>((acc, s) => {
    const key = s.student_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leistungen"
        description="Leistungen pro Schüler verwalten und abrechnen"
        icon={ListChecks}
        action={
          <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Leistung zuordnen
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xl font-bold text-amber-400">
            {totalOffen.toFixed(2).replace(".", ",")} €
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Offene Posten</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xl font-bold text-green-400">
            {totalBezahlt.toFixed(2).replace(".", ",")} €
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Bezahlt</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xl font-bold text-foreground">{services.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Leistungen gesamt</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Schüler oder Leistung suchen..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(["alle", "offen", "bezahlt", "erledigt"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                filterStatus === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {s === "alle" ? "Alle" : statusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="rounded-xl border border-border bg-card flex flex-col items-center justify-center py-16">
          <ListChecks className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">
            {search || filterStatus !== "alle" ? "Keine Leistungen gefunden." : "Noch keine Leistungen zugeordnet."}
          </p>
          {!search && filterStatus === "alle" && (
            <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />Erste Leistung zuordnen
            </Button>
          )}
        </div>
      ) : (
        Object.entries(grouped).map(([studentId, items]) => {
          const student = items[0].students;
          const studentName = student ? formatStudentName(student.nachname, student.vorname, student.geburtsdatum) : "Unbekannt";
          const saldo = items.filter((s) => s.status === "offen").reduce((sum, s) => sum + Number(s.preis), 0);

          return (
            <div key={studentId} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Student header */}
              <button
                onClick={() => navigate(`/dashboard/fahrschueler/${studentId}`)}
                className="w-full flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/30 hover:bg-secondary/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {student?.nachname?.[0] ?? "?"}
                  </div>
                  <span className="font-medium text-foreground text-sm">{studentName}</span>
                  <span className="text-xs text-muted-foreground">{items.length} Leistung{items.length !== 1 ? "en" : ""}</span>
                </div>
                <div className="flex items-center gap-3">
                  {saldo > 0 && (
                    <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-2 py-0.5">
                      Offen: {saldo.toFixed(2).replace(".", ",")} €
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </button>

              {/* Column header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/40">
                <span>Bezeichnung</span>
                <span>Datum</span>
                <span>Preis</span>
                <span>Status</span>
              </div>

              {/* Service rows */}
              {items.map((service) => (
                <div
                  key={service.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 items-center px-5 py-3 border-b border-border/20 last:border-0 hover:bg-secondary/20 transition-colors"
                >
                  <span className="text-sm text-foreground truncate">{service.bezeichnung}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(service.created_at).toLocaleDateString("de-DE")}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {Number(service.preis).toFixed(2).replace(".", ",")} €
                  </span>
                  {/* Status Select */}
                  <Select
                    value={service.status}
                    onValueChange={(v) => updateStatusMutation.mutate({ id: service.id, status: v as ServiceStatus })}
                  >
                    <SelectTrigger className={`h-7 text-xs border rounded-md px-2 w-28 ${statusConfig[service.status].className}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([val, cfg]) => (
                        <SelectItem key={val} value={val} className="text-xs">{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          );
        })
      )}

      {/* Dialog: Leistung zuordnen */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(defaultForm); setFormError(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Leistung zuordnen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Student select */}
            <div className="space-y-2">
              <Label>Fahrschüler *</Label>
              <StudentCombobox
                students={students}
                value={form.student_id}
                onValueChange={(v) => setForm({ ...form, student_id: v })}
              />
            </div>

            {/* Price select – auto-fills bezeichnung + preis */}
            <div className="space-y-2">
              <Label>Aus Preisliste wählen</Label>
              <Select value={form.preis_id} onValueChange={handlePreisSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Leistung aus Preisliste..." />
                </SelectTrigger>
                <SelectContent>
                  {prices.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="text-xs text-muted-foreground mr-2">[{p.kategorie}]</span>
                      {p.bezeichnung}
                      <span className="ml-2 text-primary font-medium">
                        {p.preis.toFixed(2).replace(".", ",")} €
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bezeichnung (editable, pre-filled) */}
            <div className="space-y-2">
              <Label htmlFor="bezeichnung">Bezeichnung *</Label>
              <Input
                id="bezeichnung"
                placeholder="Leistungsbezeichnung"
                value={form.bezeichnung}
                onChange={(e) => setForm({ ...form, bezeichnung: e.target.value })}
              />
            </div>

            {/* Preis (editable, pre-filled) */}
            <div className="space-y-2">
              <Label htmlFor="preis">Preis (€)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                <Input
                  id="preis"
                  className="pl-7"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={form.preis}
                  onChange={(e) => setForm({ ...form, preis: e.target.value })}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ServiceStatus })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([val, cfg]) => (
                    <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{formError}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setOpen(false); setForm(defaultForm); setFormError(""); }}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Speichern..." : "Zuordnen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leistungen;
