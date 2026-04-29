import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Search, ChevronRight, ArrowUpDown, CalendarIcon, CheckCircle2, Archive, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetchAllRows";
import PageHeader from "@/components/PageHeader";
import { formatStudentName } from "@/lib/formatStudentName";

type Student = {
  id: string;
  created_at: string;
  vorname: string;
  nachname: string;
  telefon: string | null;
  email: string | null;
  adresse: string | null;
  fuehrerscheinklasse: "B" | "B78" | "B197";
  ist_umschreiber: boolean;
  status: string | null;
  fahrschule: string;
  geburtsdatum: string | null;
};

const klasseColors: Record<string, string> = {
  B: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  B78: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  B197: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20",
};

const FAHRSCHULE_LABELS: Record<string, string> = {
  riemke: "Riemke Markt",
  rathaus: "Rathaus",
};

const defaultForm = {
  vorname: "",
  nachname: "",
  email: "",
  telefon: "",
  adresse: "",
  fuehrerscheinklasse: "B" as "B" | "B78" | "B197",
  fahrschule: "riemke",
  ist_umschreiber: false,
  status: "",
  geburtsdatum: undefined as Date | undefined,
  anmeldedatum: new Date() as Date | undefined,
};

const Fahrschueler = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const STORAGE_KEY = "fahrschueler-list-state";
  const savedState = (() => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}"); }
    catch { return {}; }
  })();

  const [search, setSearch] = useState<string>(savedState.search ?? "");
  const [filterFahrschule, setFilterFahrschule] = useState<"alle" | "riemke" | "rathaus">(savedState.filterFahrschule ?? "alle");
  const [showArchive, setShowArchive] = useState<boolean>(savedState.showArchive ?? false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState("");
  const [geburtsdatumText, setGeburtsdatumText] = useState("");
  const [anmeldedatumText, setAnmeldedatumText] = useState(format(new Date(), "dd.MM.yyyy"));
  const [visibleCount, setVisibleCount] = useState<number>(savedState.visibleCount ?? 30);
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [angebotsNotiz, setAngebotsNotiz] = useState("");

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => fetchAllRows(supabase.from("students").select("*").order("nachname", { ascending: true })) as Promise<Student[]>,
  });

  const { data: lessons = [], isLoading: isLoadingLessons } = useQuery({
    queryKey: ["driving_lessons_saldo"],
    queryFn: () => fetchAllRows(supabase.from("driving_lessons").select("student_id, preis")),
  });

  const { data: exams = [], isLoading: isLoadingExams } = useQuery({
    queryKey: ["exams_saldo"],
    queryFn: () => fetchAllRows(supabase.from("exams").select("student_id, preis")),
  });

  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ["services_saldo"],
    queryFn: () => fetchAllRows(supabase.from("services").select("student_id, preis")),
  });

  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ["payments_saldo"],
    queryFn: () => fetchAllRows(supabase.from("payments").select("student_id, betrag")),
  });

  const { data: autoPrices = [] } = useQuery({
    queryKey: ["auto_prices_display"],
    queryFn: async () => {
      const { data } = await supabase
        .from("prices")
        .select("*")
        .eq("aktiv", true)
        .in("bezeichnung", ["Grundbetrag", "Lernmaterial"]);
      return data || [];
    },
  });

  useEffect(() => {
    if (autoPrices.length > 0) {
      const initial: Record<string, number> = {};
      for (const p of autoPrices) {
        initial[p.id] = Number(p.preis);
      }
      setCustomPrices(initial);
    }
  }, [autoPrices]);

  const autoPricesTotal = Object.values(customPrices).reduce((sum, v) => sum + v, 0);

  const saldoMap = useMemo(() => {
    const map: Record<string, number> = {};
    const add = (items: { student_id: string; preis: number }[]) => {
      for (const item of items) {
        map[item.student_id] = (map[item.student_id] || 0) + Number(item.preis);
      }
    };
    add(lessons);
    add(exams);
    add(services);
    for (const p of payments) {
      map[p.student_id] = (map[p.student_id] || 0) - Number(p.betrag);
    }
    return map;
  }, [lessons, exams, services, payments]);

  const allLoading = isLoading || isLoadingLessons || isLoadingExams || isLoadingServices || isLoadingPayments;

  const createMutation = useMutation({
    mutationFn: async (values: typeof defaultForm) => {
      // 1. Aktive Preise für Grundbetrag + Lernmaterial laden
      const { data: prices } = await supabase
        .from("prices")
        .select("*")
        .eq("aktiv", true)
        .in("bezeichnung", ["Grundbetrag", "Lernmaterial"]);

      // 2. Schüler anlegen, ID zurückbekommen
      const { data: newStudent, error } = await supabase.from("students").insert([
        {
          vorname: values.vorname,
          nachname: values.nachname,
          email: values.email || null,
          telefon: values.telefon || null,
          adresse: values.adresse || null,
          fuehrerscheinklasse: values.fuehrerscheinklasse,
          fahrschule: values.fahrschule,
          ist_umschreiber: values.ist_umschreiber,
          status: values.status || null,
          geburtsdatum: values.geburtsdatum ? format(values.geburtsdatum, "yyyy-MM-dd") : null,
          created_at: values.anmeldedatum ? values.anmeldedatum.toISOString() : new Date().toISOString(),
        },
      ]).select("id").single();
      if (error) throw error;

      // 3. Automatisch Leistungen einfügen (Grundbetrag + Lernmaterial)
      if (prices && prices.length > 0 && newStudent) {
        const servicesToInsert = prices.map((p) => ({
          student_id: newStudent.id,
          preis_id: p.id,
          bezeichnung: p.bezeichnung,
          preis: customPrices[p.id] ?? p.preis,
          status: "offen" as const,
          notiz: angebotsNotiz.trim() || null,
          datum: values.anmeldedatum
            ? values.anmeldedatum.toISOString()
            : new Date().toISOString(),
        }));
        await supabase.from("services").insert(servicesToInsert);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["services_saldo"] });
      queryClient.invalidateQueries({ queryKey: ["open_items"] });
      setOpen(false);
      setForm(defaultForm);
      setGeburtsdatumText("");
      setAnmeldedatumText(format(new Date(), "dd.MM.yyyy"));
      setFormError("");
      const initial: Record<string, number> = {};
      for (const p of autoPrices) initial[p.id] = Number(p.preis);
      setCustomPrices(initial);
      setAngebotsNotiz("");
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase.from("students").update({ status: null }).eq("id", studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast({ title: "Schüler wiederhergestellt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const filtered = students.filter((s) => {
    // Archive filter
    const isArchived = s.status === "archiviert";
    if (showArchive && !isArchived) return false;
    if (!showArchive && isArchived) return false;

    if (filterFahrschule !== "alle" && s.fahrschule !== filterFahrschule) return false;
    const q = search.toLowerCase();
    return (
      s.vorname.toLowerCase().includes(q) ||
      s.nachname.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.fuehrerscheinklasse.toLowerCase().includes(q)
    );
  });

  // Apply limit
  const visibleStudents = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visibleCount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vorname || !form.nachname) {
      setFormError("Vor- und Nachname sind Pflichtfelder.");
      return;
    }
    if (!form.geburtsdatum) {
      setFormError("Geburtsdatum ist ein Pflichtfeld.");
      return;
    }
    setFormError("");
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fahrschüler"
        description="Alle angemeldeten Fahrschüler verwalten"
        icon={Users}
        action={
          <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Neuer Schüler
          </Button>
        }
      />

      {/* Archive Toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 w-fit">
        <button
          onClick={() => { setShowArchive(false); setVisibleCount(10); }}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${!showArchive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"}`}
        >
          Aktive Schüler
        </button>
        <button
          onClick={() => { setShowArchive(true); setVisibleCount(10); }}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${showArchive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"}`}
        >
          <Archive className="h-3.5 w-3.5" />
          Archiv
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Schüler suchen..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(10); }}
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {([["alle", "Alle"], ["riemke", "Riemke Markt"], ["rathaus", "Rathaus"]] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterFahrschule(val)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterFahrschule === val ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center text-sm text-muted-foreground">
          {filtered.length} Schüler
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <button className="flex items-center gap-1 text-left hover:text-foreground transition-colors">
            Name <ArrowUpDown className="h-3 w-3" />
          </button>
          <span>Geb.-Datum</span>
          <span>Klasse</span>
          <span>Fahrschule</span>
          <span>Umschreiber</span>
          <span>Saldo</span>
          <span />
        </div>

        {allLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-secondary/40 animate-pulse" />
            ))}
          </div>
        ) : visibleStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              {search ? "Kein Schüler gefunden." : "Noch keine Fahrschüler eingetragen."}
            </p>
            {!search && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-2"
                onClick={() => setOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Ersten Schüler hinzufügen
              </Button>
            )}
          </div>
        ) : (
          <div>
            {visibleStudents.map((student) => (
              <button
                key={student.id}
                onClick={() => navigate(`/dashboard/fahrschueler/${student.id}`)}
                className="w-full grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 border-b border-border/50 last:border-0 hover:bg-secondary/40 transition-colors text-left group"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {formatStudentName(student.nachname, student.vorname, student.geburtsdatum)}
                  </p>
                  {student.email && (
                    <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                  )}
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">
                    {student.geburtsdatum ? format(new Date(student.geburtsdatum), "dd.MM.yyyy") : "–"}
                  </span>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${klasseColors[student.fuehrerscheinklasse]}`}
                  >
                    Klasse {student.fuehrerscheinklasse}
                  </span>
                </div>

                <div>
                  <Badge variant="outline" className="text-xs font-medium">
                    {FAHRSCHULE_LABELS[student.fahrschule] || student.fahrschule}
                  </Badge>
                </div>

                <div>
                  {student.ist_umschreiber ? (
                    <Badge className="bg-amber-500/10 text-amber-700 border border-amber-500/20 hover:bg-amber-500/15 font-semibold text-xs">
                      Umschreiber
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">–</span>
                  )}
                </div>

                <div>
                  {(() => {
                    const saldo = saldoMap[student.id] || 0;
                    const color = saldo > 0 ? "text-red-600" : saldo < 0 ? "text-emerald-600" : "text-foreground";
                    return (
                      <span className={`text-sm font-medium ${color}`}>
                        {saldo.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                      </span>
                    );
                  })()}
                </div>

                {showArchive ? (
                  <div className="flex items-center gap-1">
                    <Badge className="bg-muted text-muted-foreground border-border text-xs">Archiviert</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); restoreMutation.mutate(student.id); }}
                      title="Wiederherstellen"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </button>
            ))}
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

      {/* New Student Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[96vh] flex flex-col overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neuer Fahrschüler</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-2 mt-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="vorname">Vorname *</Label>
                <Input id="vorname" placeholder="Max" value={form.vorname} onChange={(e) => setForm({ ...form, vorname: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nachname">Nachname *</Label>
                <Input id="nachname" placeholder="Mustermann" value={form.nachname} onChange={(e) => setForm({ ...form, nachname: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Geburtsdatum *</Label>
                <div className="relative">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        <CalendarIcon className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.geburtsdatum}
                        onSelect={(date) => {
                          setForm({ ...form, geburtsdatum: date });
                          setGeburtsdatumText(date ? format(date, "dd.MM.yyyy") : "");
                        }}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    placeholder="TT.MM.JJJJ"
                    className="pl-9"
                    value={geburtsdatumText}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGeburtsdatumText(val);
                      if (val.length === 10) {
                        const parsed = parse(val, "dd.MM.yyyy", new Date());
                        if (isValid(parsed) && parsed <= new Date() && parsed >= new Date("1900-01-01")) {
                          setForm((f) => ({ ...f, geburtsdatum: parsed }));
                        }
                      } else {
                        setForm((f) => ({ ...f, geburtsdatum: undefined }));
                      }
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" type="email" placeholder="max@example.de" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="telefon">Telefon</Label>
                <Input id="telefon" placeholder="+49 123 456789" value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Führerscheinklasse *</Label>
                <Select value={form.fuehrerscheinklasse} onValueChange={(v) => setForm({ ...form, fuehrerscheinklasse: v as "B" | "B78" | "B197" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B">Klasse B</SelectItem>
                    <SelectItem value="B78">Klasse B78</SelectItem>
                    <SelectItem value="B197">Klasse B197</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Fahrschule *</Label>
                <Select value={form.fahrschule} onValueChange={(v) => setForm({ ...form, fahrschule: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="riemke">Riemke Markt</SelectItem>
                    <SelectItem value="rathaus">Rathaus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="adresse">Adresse</Label>
                <Input id="adresse" placeholder="Musterstraße 1, 44791 Bochum" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Anmeldedatum</Label>
                <div className="relative">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        <CalendarIcon className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.anmeldedatum}
                        onSelect={(date) => {
                          setForm({ ...form, anmeldedatum: date });
                          setAnmeldedatumText(date ? format(date, "dd.MM.yyyy") : "");
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    placeholder="TT.MM.JJJJ"
                    className="pl-9"
                    value={anmeldedatumText}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAnmeldedatumText(val);
                      if (val.length === 10) {
                        const parsed = parse(val, "dd.MM.yyyy", new Date());
                        if (isValid(parsed)) {
                          setForm((f) => ({ ...f, anmeldedatum: parsed }));
                        }
                      } else {
                        setForm((f) => ({ ...f, anmeldedatum: undefined }));
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                checked={form.ist_umschreiber}
                onCheckedChange={(v) => setForm({ ...form, ist_umschreiber: v })}
              />
                <Label>Umschreiber</Label>
              </div>
            </div>

            {autoPrices.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
                <p className="text-sm font-medium text-foreground">Automatisch hinzugefügte Leistungen:</p>
                <div className="space-y-1.5">
                  {autoPrices.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm gap-3">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        {p.bezeichnung}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-24 h-8 text-right text-sm"
                          value={customPrices[p.id] ?? Number(p.preis)}
                          onChange={(e) =>
                            setCustomPrices((prev) => ({
                              ...prev,
                              [p.id]: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                        <span className="text-xs text-muted-foreground">€</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Gesamt</span>
                  <span>{autoPricesTotal.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</span>
                </div>
                <div className="space-y-1 pt-1">
                  <Label htmlFor="angebotsNotiz" className="text-xs text-muted-foreground">Notiz / Angebot</Label>
                  <Textarea
                    id="angebotsNotiz"
                    placeholder="z.B. Weihnachtsangebot, Sonderkonditionen..."
                    className="min-h-[40px] text-sm"
                    value={angebotsNotiz}
                    onChange={(e) => setAngebotsNotiz(e.target.value)}
                  />
                </div>
              </div>
            )}

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Speichern…" : "Speichern"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Fahrschueler;
