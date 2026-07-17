import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { de } from "date-fns/locale";
import {
  Zap,
  Search,
  Car,
  CreditCard,
  Save,
  Trash2,
  Banknote,
  Landmark,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetchAllRows";
import { formatStudentName } from "@/lib/formatStudentName";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Database } from "@/integrations/supabase/types";

type DrivingLessonTyp = Database["public"]["Enums"]["driving_lesson_typ"];
type FahrzeugTyp = Database["public"]["Enums"]["fahrzeug_typ"];
type Zahlungsart = "bar" | "ec" | "ueberweisung";
type Filiale = "riemke" | "rathaus";

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

const ZAHLUNGSART_LABELS: Record<Zahlungsart, string> = {
  bar: "Bar",
  ec: "EC-Karte",
  ueberweisung: "Überweisung",
};

const FILIALE_LABELS: Record<Filiale, string> = {
  riemke: "Riemke Markt",
  rathaus: "Rathaus",
};

const eur = (v: number) =>
  v.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

type Student = {
  id: string;
  vorname: string;
  nachname: string;
  geburtsdatum: string | null;
  fahrschule: Filiale | null;
  fuehrerscheinklasse: string | null;
  status: string | null;
};

type Instructor = {
  id: string;
  vorname: string;
  nachname: string;
};

type Vehicle = {
  id: string;
  bezeichnung: string;
  typ: FahrzeugTyp;
  kennzeichen: string;
  aktiv: boolean;
};

const todayLocalDate = () => new Date().toISOString().slice(0, 10);
const todayLocalDateTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const Schnellerfassung = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<"fahrstunde" | "zahlung">("fahrstunde");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  // Sticky values across student changes
  const [stickyInstructor, setStickyInstructor] = useState<string>("");
  const [stickyDatum, setStickyDatum] = useState<string>(todayLocalDateTime());
  const [stickyZahlungsDatum, setStickyZahlungsDatum] = useState<string>(
    todayLocalDate(),
  );

  // Fahrstunde form – vereinfacht: nur Einheiten (1 = 45min/65€)
  const [einheiten, setEinheiten] = useState<number>(1);

  // Zahlung form
  const [paymentForm, setPaymentForm] = useState({
    betrag: "",
    zahlungsart: "bar" as Zahlungsart,
    filiale: "riemke" as Filiale,
  });

  // Queries
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["students_schnellerfassung"],
    queryFn: () =>
      fetchAllRows(
        supabase
          .from("students")
          .select("id, vorname, nachname, geburtsdatum, fahrschule, fuehrerscheinklasse, status")
          .or("status.is.null,status.neq.archiviert")
          .order("nachname"),
      ) as Promise<Student[]>,
  });

  const { data: instructors = [] } = useQuery<Instructor[]>({
    queryKey: ["instructors_active"],
    queryFn: () =>
      fetchAllRows(
        supabase
          .from("instructors")
          .select("id, vorname, nachname")
          .eq("aktiv", true)
          .order("nachname"),
      ) as Promise<Instructor[]>,
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["vehicles_active"],
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

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  // Default filiale to student's Fahrschule when selection changes
  useEffect(() => {
    if (selectedStudent?.fahrschule) {
      setPaymentForm((f) => ({ ...f, filiale: selectedStudent.fahrschule as Filiale }));
    }
  }, [selectedStudentId]);

  // Recent lessons for selected student
  const { data: recentLessons = [] } = useQuery({
    queryKey: ["schnell_lessons", selectedStudentId],
    enabled: !!selectedStudentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("driving_lessons")
        .select("*")
        .eq("student_id", selectedStudentId!)
        .order("datum", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Recent payments for selected student
  const { data: recentPayments = [] } = useQuery({
    queryKey: ["schnell_payments", selectedStudentId],
    enabled: !!selectedStudentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("student_id", selectedStudentId!)
        .order("datum", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Mutations
  const saveLesson = useMutation({
    mutationFn: async () => {
      if (!selectedStudentId) throw new Error("Kein Fahrschüler ausgewählt");
      if (!stickyInstructor) throw new Error("Bitte Fahrlehrer wählen");
      if (einheiten <= 0) throw new Error("Bitte Einheiten wählen");
      const { error } = await supabase.from("driving_lessons").insert({
        student_id: selectedStudentId,
        instructor_id: stickyInstructor,
        typ: "uebungsstunde",
        fahrzeug_typ: "automatik",
        dauer_minuten: einheiten * 45,
        datum: new Date(stickyDatum).toISOString(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schnell_lessons", selectedStudentId] });
      qc.invalidateQueries({ queryKey: ["driving_lessons"] });
      qc.invalidateQueries({ queryKey: ["open_items"] });
      qc.invalidateQueries({ queryKey: ["students"] });
      toast({ title: "Fahrstunde gespeichert" });
    },
    onError: (e: Error) =>
      toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const savePayment = useMutation({
    mutationFn: async () => {
      if (!selectedStudentId) throw new Error("Kein Fahrschüler ausgewählt");
      const betrag = parseFloat(paymentForm.betrag);
      if (!betrag || betrag <= 0) throw new Error("Bitte gültigen Betrag eingeben");

      // Insert payment
      const { data: payment, error: payErr } = await supabase
        .from("payments")
        .insert({
          student_id: selectedStudentId,
          betrag,
          zahlungsart: paymentForm.zahlungsart,
          filiale: paymentForm.filiale,
          datum: new Date(stickyZahlungsDatum).toISOString(),
          einreichungsdatum: new Date(stickyZahlungsDatum).toISOString(),
        } as any)
        .select("id")
        .single();
      if (payErr) throw payErr;

      // FIFO allocation to open items
      const { data: openItems, error: oiErr } = await supabase
        .from("open_items")
        .select("*")
        .eq("student_id", selectedStudentId)
        .neq("status", "bezahlt")
        .order("datum", { ascending: true });
      if (oiErr) throw oiErr;

      let remaining = betrag;
      const allocations: {
        payment_id: string;
        open_item_id: string;
        betrag: number;
      }[] = [];
      for (const item of openItems ?? []) {
        if (remaining <= 0) break;
        const offen = Number(item.betrag_gesamt) - Number(item.betrag_bezahlt);
        if (offen <= 0) continue;
        const zuordnung = Math.min(remaining, offen);
        allocations.push({
          payment_id: (payment as any).id,
          open_item_id: (item as any).id,
          betrag: zuordnung,
        });
        remaining -= zuordnung;
      }
      if (allocations.length > 0) {
        const { error: allocErr } = await supabase
          .from("payment_allocations")
          .insert(allocations as any);
        if (allocErr) throw allocErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schnell_payments", selectedStudentId] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["payment_allocations_all"] });
      qc.invalidateQueries({ queryKey: ["open_items"] });
      qc.invalidateQueries({ queryKey: ["students"] });
      toast({ title: "Zahlung gespeichert" });
      setPaymentForm((f) => ({ ...f, betrag: "" }));
    },
    onError: (e: Error) =>
      toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const deleteLesson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("driving_lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schnell_lessons", selectedStudentId] });
      qc.invalidateQueries({ queryKey: ["driving_lessons"] });
      qc.invalidateQueries({ queryKey: ["open_items"] });
      toast({ title: "Fahrstunde gelöscht" });
    },
    onError: (e: Error) =>
      toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      // Delete allocations first, then payment (RLS handles rest via triggers)
      await supabase.from("payment_allocations").delete().eq("payment_id", id);
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schnell_payments", selectedStudentId] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["payment_allocations_all"] });
      qc.invalidateQueries({ queryKey: ["open_items"] });
      toast({ title: "Zahlung gelöscht" });
    },
    onError: (e: Error) =>
      toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  // Filtered student list
  const filteredStudents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = `${s.nachname} ${s.vorname}`.toLowerCase();
      const gb = s.geburtsdatum
        ? format(new Date(s.geburtsdatum), "dd.MM.yyyy")
        : "";
      return name.includes(q) || gb.includes(q);
    });
  }, [students, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedStudents = useMemo(
    () =>
      filteredStudents.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
      ),
    [filteredStudents, currentPage, pageSize],
  );

  // Reset page when search/pageSize changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize]);


  return (
    <div className="space-y-4">
      <PageHeader
        title="Schnellerfassung"
        description="Fahrstunden und Zahlungen für mehrere Schüler nacheinander erfassen"
        icon={Zap}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* LEFT: Student list */}
        <aside className="rounded-xl border border-border bg-card flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Fahrschüler suchen…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {filteredStudents.length} Fahrschüler
              {filteredStudents.length > pageSize && (
                <> · Seite {currentPage} / {totalPages}</>
              )}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {pagedStudents.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Keine Fahrschüler gefunden
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {pagedStudents.map((s) => {
                  const active = s.id === selectedStudentId;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedStudentId(s.id)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          active
                            ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                            : "hover:bg-muted/60 text-foreground border-l-2 border-transparent"
                        }`}
                      >
                        <span className="block truncate">
                          {formatStudentName(s.nachname, s.vorname, s.geburtsdatum)}
                        </span>
                        {s.fahrschule && (
                          <span className="block text-xs text-muted-foreground mt-0.5">
                            {FILIALE_LABELS[s.fahrschule]}
                            {s.fuehrerscheinklasse ? ` · ${s.fuehrerscheinklasse}` : ""}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {/* Pagination footer */}
          <div className="border-t border-border p-2 flex items-center justify-between gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(parseInt(v))}
            >
              <SelectTrigger className="h-8 w-[92px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} / Seite
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[52px] text-center">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>


        {/* RIGHT: Capture area */}
        <section className="rounded-xl border border-border bg-card min-h-[500px]">
          {!selectedStudent ? (
            <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center p-12 text-muted-foreground">
              <Zap className="h-10 w-10 mb-3 opacity-30" />
              <p className="font-medium text-foreground">Bitte Fahrschüler wählen</p>
              <p className="text-sm mt-1">
                Wählen Sie links einen Fahrschüler aus, um Fahrstunden oder Zahlungen zu erfassen.
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="pb-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">
                  {formatStudentName(
                    selectedStudent.nachname,
                    selectedStudent.vorname,
                    selectedStudent.geburtsdatum,
                  )}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {selectedStudent.fahrschule
                    ? FILIALE_LABELS[selectedStudent.fahrschule]
                    : "–"}
                  {selectedStudent.fuehrerscheinklasse
                    ? ` · Klasse ${selectedStudent.fuehrerscheinklasse}`
                    : ""}
                </p>
              </div>

              <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                <TabsList className="grid w-full max-w-sm grid-cols-2">
                  <TabsTrigger value="fahrstunde" className="gap-2">
                    <Car className="h-4 w-4" /> Fahrstunde
                  </TabsTrigger>
                  <TabsTrigger value="zahlung" className="gap-2">
                    <CreditCard className="h-4 w-4" /> Zahlung
                  </TabsTrigger>
                </TabsList>

                {/* FAHRSTUNDE */}
                <TabsContent value="fahrstunde" className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Datum & Uhrzeit</Label>
                      <Input
                        type="datetime-local"
                        value={stickyDatum}
                        onChange={(e) => setStickyDatum(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Fahrlehrer</Label>
                      <Select
                        value={stickyInstructor}
                        onValueChange={setStickyInstructor}
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
                    <div className="space-y-1.5 md:col-span-2">
                      <Label>Einheiten</Label>
                      <Select
                        value={String(einheiten)}
                        onValueChange={(v) => setEinheiten(parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Einheit (45 min · 65 €)</SelectItem>
                          <SelectItem value="2">2 Einheiten – Doppelstunde (90 min · 130 €)</SelectItem>
                          <SelectItem value="3">3 Einheiten (135 min · 195 €)</SelectItem>
                          <SelectItem value="4">4 Einheiten (180 min · 260 €)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => saveLesson.mutate()}
                      disabled={saveLesson.isPending || !stickyInstructor}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Fahrstunde speichern
                    </Button>
                  </div>

                  {/* History */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">
                        Letzte Fahrstunden
                      </p>
                    </div>
                    {recentLessons.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">
                        Noch keine Fahrstunden.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Datum</TableHead>
                            <TableHead>Typ</TableHead>
                            <TableHead>Dauer</TableHead>
                            <TableHead className="text-right">Preis</TableHead>
                            <TableHead className="w-10" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentLessons.map((l: any) => (
                            <TableRow key={l.id}>
                              <TableCell className="text-sm">
                                {format(new Date(l.datum), "dd.MM.yyyy HH:mm", {
                                  locale: de,
                                })}
                              </TableCell>
                              <TableCell className="text-sm">
                                {TYP_LABELS[l.typ as DrivingLessonTyp]}
                              </TableCell>
                              <TableCell className="text-sm">
                                {l.dauer_minuten} min
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium">
                                {eur(Number(l.preis))}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteLesson.mutate(l.id)}
                                  disabled={deleteLesson.isPending}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </TabsContent>

                {/* ZAHLUNG */}
                <TabsContent value="zahlung" className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Datum</Label>
                      <Input
                        type="date"
                        value={stickyZahlungsDatum}
                        onChange={(e) => setStickyZahlungsDatum(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Betrag (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="0,00"
                        value={paymentForm.betrag}
                        onChange={(e) =>
                          setPaymentForm((f) => ({ ...f, betrag: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Zahlungsart</Label>
                      <Select
                        value={paymentForm.zahlungsart}
                        onValueChange={(v) =>
                          setPaymentForm((f) => ({
                            ...f,
                            zahlungsart: v as Zahlungsart,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ZAHLUNGSART_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Filiale</Label>
                      <Select
                        value={paymentForm.filiale}
                        onValueChange={(v) =>
                          setPaymentForm((f) => ({ ...f, filiale: v as Filiale }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(FILIALE_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => savePayment.mutate()}
                      disabled={savePayment.isPending}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Zahlung speichern
                    </Button>
                  </div>

                  {/* History */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">
                        Letzte Zahlungen
                      </p>
                    </div>
                    {recentPayments.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">
                        Noch keine Zahlungen.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Datum</TableHead>
                            <TableHead>Art</TableHead>
                            <TableHead>Filiale</TableHead>
                            <TableHead className="text-right">Betrag</TableHead>
                            <TableHead className="w-10" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentPayments.map((p: any) => (
                            <TableRow key={p.id}>
                              <TableCell className="text-sm">
                                {format(new Date(p.datum), "dd.MM.yyyy", {
                                  locale: de,
                                })}
                              </TableCell>
                              <TableCell className="text-sm">
                                {ZAHLUNGSART_LABELS[p.zahlungsart as Zahlungsart]}
                              </TableCell>
                              <TableCell className="text-sm">
                                {p.filiale
                                  ? FILIALE_LABELS[p.filiale as Filiale]
                                  : "–"}
                              </TableCell>
                              <TableCell
                                className={`text-right text-sm font-semibold ${
                                  Number(p.betrag) < 0
                                    ? "text-purple-600 dark:text-purple-400"
                                    : "text-green-600"
                                }`}
                              >
                                {Number(p.betrag) < 0 ? "" : "+"}
                                {eur(Number(p.betrag))}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => deletePayment.mutate(p.id)}
                                  disabled={deletePayment.isPending}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Schnellerfassung;
