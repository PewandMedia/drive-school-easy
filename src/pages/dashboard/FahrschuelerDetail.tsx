import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, CheckCircle2, Car, BookOpen, Settings, GraduationCap, XCircle, AlertTriangle, ShieldCheck, ShieldAlert, CreditCard, Plus, ChevronDown, Cake, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { THEORIE_LEKTIONEN, lektionToTyp } from "@/lib/theorieLektionen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Constants ────────────────────────────────────────────────────────────────
const PFLICHT: Record<string, number> = { ueberland: 5, autobahn: 4, nacht: 3 };

const THEORIE_PFLICHT: Record<string, number> = { grundstoff: 12, klassenspezifisch: 2 };
const THEORIE_LABELS: Record<string, string> = {
  grundstoff: "Grundstoff",
  klassenspezifisch: "Klassenspezifisch",
};

const SCHALTSTUNDEN_PFLICHT = 10;

const SONDER_LABELS: Record<string, string> = {
  ueberland: "Überlandfahrt",
  autobahn: "Autobahnfahrt",
  nacht: "Nachtfahrt",
};

const TYP_LABELS: Record<string, string> = {
  uebungsstunde: "Übungsstunde",
  ueberland: "Überlandfahrt",
  autobahn: "Autobahnfahrt",
  nacht: "Nachtfahrt",
  fehlstunde: "Fehlstunde",
  testfahrt_b197: "Testfahrt B197",
};

const FAHRZEUG_LABELS: Record<string, string> = {
  automatik: "Automatik",
  schaltwagen: "Schaltwagen",
};

const KLASSE_COLORS: Record<string, string> = {
  B: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  B78: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  B197: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20",
};

const SERVICE_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  offen: { label: "Offen", cls: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  bezahlt: { label: "Bezahlt", cls: "bg-green-500/10 text-green-700 border-green-500/20" },
  erledigt: { label: "Erledigt", cls: "bg-muted text-muted-foreground border-border" },
};

const DAUER_OPTIONS = [45, 90, 135];
const calculatePrice = (dauer: number) => Math.round(((dauer / 45) * 65) * 100) / 100;

type DrivingLessonTyp = "uebungsstunde" | "ueberland" | "autobahn" | "nacht" | "fehlstunde" | "testfahrt_b197";
type FahrzeugTyp = "automatik" | "schaltwagen";
type ServiceStatus = "offen" | "bezahlt" | "erledigt";
type Zahlungsart = "bar" | "ec" | "ueberweisung";

// ── Component ─────────────────────────────────────────────────────────────────
const FahrschuelerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Dialog states ──
  const [dlgFahrstunde, setDlgFahrstunde] = useState(false);
  // dlgSchaltstunde removed – use Fahrstunden-Dialog with fahrzeug_typ=schaltwagen
  const [dlgTheorie, setDlgTheorie] = useState(false);
  const [dlgPruefung, setDlgPruefung] = useState(false);
  const [dlgLeistung, setDlgLeistung] = useState(false);
  const [dlgZahlung, setDlgZahlung] = useState(false);

  // ── Form states ──
  const [fsFahrstunde, setFsFahrstunde] = useState({
    typ: "uebungsstunde" as DrivingLessonTyp,
    fahrzeug_typ: "automatik" as FahrzeugTyp,
    dauer_minuten: 45,
    datum: new Date().toISOString().slice(0, 16),
  });
  // fsSchaltstunde removed – Fahrstunden-Dialog handles schaltwagen
  const [fsTheorie, setFsTheorie] = useState({
    lektion: 1,
    datum: new Date().toISOString().slice(0, 16),
  });
  const [fsPruefung, setFsPruefung] = useState({
    typ: "theorie" as "theorie" | "praxis",
    fahrzeug_typ: "automatik" as FahrzeugTyp,
    instructor_id: "",
    datum: new Date().toISOString().slice(0, 10),
    bestanden: false,
    preis: "0",
  });
  const [fsLeistung, setFsLeistung] = useState({
    preis_id: "",
    bezeichnung: "",
    preis: "",
    status: "offen" as ServiceStatus,
  });
  const [fsZahlung, setFsZahlung] = useState({
    betrag: "",
    zahlungsart: "bar" as Zahlungsart,
    datum: new Date().toISOString().slice(0, 10),
    selectedOpenItems: [] as string[],
  });

  // ── Data queries ──
  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: lessons = [], isLoading: loadingLessons } = useQuery({
    queryKey: ["driving_lessons", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("driving_lessons").select("*").eq("student_id", id!).order("datum", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ["services", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").eq("student_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: theorySessions = [], isLoading: loadingTheory } = useQuery({
    queryKey: ["theory_sessions", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("theory_sessions").select("*").eq("student_id", id!).order("datum", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // gear_lessons query removed – Schaltstunden derived from driving_lessons

  const { data: exams = [], isLoading: loadingExams } = useQuery({
    queryKey: ["exams", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("exams").select("*").eq("student_id", id!).order("datum", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ["payments", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("*").eq("student_id", id!).order("datum", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Open items query
  const { data: openItems = [] } = useQuery({
    queryKey: ["open_items", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("open_items")
        .select("*")
        .eq("student_id", id!)
        .order("datum", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Additional queries for modals
  const { data: prices = [] } = useQuery({
    queryKey: ["prices", "active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("prices").select("*").eq("aktiv", true).order("kategorie").order("bezeichnung");
      if (error) throw error;
      return data;
    },
  });

  const { data: instructors = [] } = useQuery({
    queryKey: ["instructors_active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("instructors").select("id, vorname, nachname").eq("aktiv", true).order("nachname");
      if (error) throw error;
      return data;
    },
  });

  // Auto-fill exam price
  useEffect(() => {
    if (prices.length > 0 && dlgPruefung) {
      const pruefPreise = prices.filter((p) => p.kategorie.toLowerCase().includes("prüfung"));
      const match = pruefPreise.find((p) =>
        fsPruefung.typ === "theorie"
          ? p.bezeichnung.toLowerCase().includes("theorie")
          : p.bezeichnung.toLowerCase().includes("fahr") || p.bezeichnung.toLowerCase().includes("praxis")
      ) ?? pruefPreise[0];
      if (match) setFsPruefung((f) => ({ ...f, preis: String(match.preis) }));
    }
  }, [fsPruefung.typ, dlgPruefung, prices]);

  // ── Mutations ──
  const mutFahrstunde = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("driving_lessons").insert({
        student_id: id!,
        typ: fsFahrstunde.typ,
        fahrzeug_typ: fsFahrstunde.fahrzeug_typ,
        dauer_minuten: fsFahrstunde.dauer_minuten,
        datum: new Date(fsFahrstunde.datum).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driving_lessons", id] });
      queryClient.invalidateQueries({ queryKey: ["driving_lessons"] });
      queryClient.invalidateQueries({ queryKey: ["open_items", id] });
      setDlgFahrstunde(false);
      setFsFahrstunde({ typ: "uebungsstunde", fahrzeug_typ: "automatik", dauer_minuten: 45, datum: new Date().toISOString().slice(0, 16) });
      toast({ title: "Fahrstunde gespeichert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  // mutSchaltstunde removed – Fahrstunden-Dialog handles schaltwagen entries

  const mutTheorie = useMutation({
    mutationFn: async () => {
      const typ = lektionToTyp(fsTheorie.lektion);
      const { error } = await supabase.from("theory_sessions").insert({
        student_id: id!,
        datum: new Date(fsTheorie.datum).toISOString(),
        typ,
        lektion: fsTheorie.lektion,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theory_sessions", id] });
      queryClient.invalidateQueries({ queryKey: ["theory_sessions"] });
      setDlgTheorie(false);
      setFsTheorie({ lektion: 1, datum: new Date().toISOString().slice(0, 16) });
      toast({ title: "Theoriestunde gespeichert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const mutPruefung = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("exams").insert({
        student_id: id!,
        typ: fsPruefung.typ,
        fahrzeug_typ: fsPruefung.fahrzeug_typ,
        datum: new Date(fsPruefung.datum).toISOString(),
        bestanden: fsPruefung.bestanden,
        preis: parseFloat(fsPruefung.preis) || 0,
        instructor_id: fsPruefung.typ === "praxis" && fsPruefung.instructor_id ? fsPruefung.instructor_id : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams", id] });
      queryClient.invalidateQueries({ queryKey: ["exams_all"] });
      queryClient.invalidateQueries({ queryKey: ["open_items", id] });
      setDlgPruefung(false);
      setFsPruefung({ typ: "theorie", fahrzeug_typ: "automatik", instructor_id: "", datum: new Date().toISOString().slice(0, 10), bestanden: false, preis: "0" });
      toast({ title: "Prüfung eingetragen" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const mutLeistung = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("services").insert({
        student_id: id!,
        preis_id: fsLeistung.preis_id || null,
        bezeichnung: fsLeistung.bezeichnung,
        preis: parseFloat(fsLeistung.preis) || 0,
        status: fsLeistung.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", id] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["open_items", id] });
      setDlgLeistung(false);
      setFsLeistung({ preis_id: "", bezeichnung: "", preis: "", status: "offen" });
      toast({ title: "Leistung hinzugefügt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const mutZahlung = useMutation({
    mutationFn: async () => {
      const betrag = parseFloat(fsZahlung.betrag) || 0;
      // Insert payment
      const { data: paymentData, error: paymentError } = await supabase.from("payments").insert({
        student_id: id!,
        betrag,
        zahlungsart: fsZahlung.zahlungsart,
        datum: new Date(fsZahlung.datum).toISOString(),
      }).select("id").single();
      if (paymentError) throw paymentError;

      // Allocate to selected open items
      if (fsZahlung.selectedOpenItems.length > 0) {
        const selectedItems = openItems
          .filter((oi: any) => fsZahlung.selectedOpenItems.includes(oi.id))
          .sort((a: any, b: any) => new Date(a.datum).getTime() - new Date(b.datum).getTime());

        let remaining = betrag;
        const allocations: { payment_id: string; open_item_id: string; betrag: number }[] = [];
        for (const item of selectedItems) {
          if (remaining <= 0) break;
          const offen = Number(item.betrag_gesamt) - Number(item.betrag_bezahlt);
          const zuordnung = Math.min(remaining, offen);
          allocations.push({ payment_id: paymentData.id, open_item_id: item.id, betrag: zuordnung });
          remaining -= zuordnung;
        }
        if (allocations.length > 0) {
          const { error: allocError } = await supabase.from("payment_allocations").insert(allocations as any);
          if (allocError) throw allocError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", id] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["open_items", id] });
      setDlgZahlung(false);
      setFsZahlung({ betrag: "", zahlungsart: "bar", datum: new Date().toISOString().slice(0, 10), selectedOpenItems: [] });
      toast({ title: "Zahlung erfasst" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  // ── Derived data ────────────────────────────────────────────────────────────
  const isLoading = loadingStudent || loadingLessons || loadingServices || loadingTheory || loadingExams || loadingPayments;

  const initials = student
    ? `${student.vorname[0]}${student.nachname[0]}`.toUpperCase()
    : "??";

  const sonderCounts = {
    ueberland: lessons.filter((l) => l.typ === "ueberland").reduce((s, l) => s + (l.einheiten || 1), 0),
    autobahn: lessons.filter((l) => l.typ === "autobahn").reduce((s, l) => s + (l.einheiten || 1), 0),
    nacht: lessons.filter((l) => l.typ === "nacht").reduce((s, l) => s + (l.einheiten || 1), 0),
  };

  const uebungsstundenEinheiten = lessons
    .filter((l) => l.typ === "uebungsstunde")
    .reduce((s, l) => s + (l.einheiten || 1), 0);

  const gesamtEinheiten = lessons.filter((l) => l.typ !== "fehlstunde").reduce((s, l) => s + (l.einheiten || 1), 0);

  // Unique lesson-based counting
  const completedLektionen = new Set(
    theorySessions
      .filter((s: any) => s.lektion != null)
      .map((s: any) => s.lektion as number)
  );
  const uniqueGrundstoff = Array.from(completedLektionen).filter((n) => n >= 1 && n <= 12);
  const uniqueKlassen = Array.from(completedLektionen).filter((n) => n >= 13 && n <= 14);
  // Legacy data without lektion
  const altGrundstoff = theorySessions.filter((s: any) => s.lektion == null && s.typ === "grundstoff").length;
  const altKlassen = theorySessions.filter((s: any) => s.lektion == null && s.typ === "klassenspezifisch").length;

  const theoryCounts = {
    grundstoff: uniqueGrundstoff.length + altGrundstoff,
    klassenspezifisch: uniqueKlassen.length + altKlassen,
  };

  const allTheorieComplete =
    theoryCounts.grundstoff >= THEORIE_PFLICHT.grundstoff &&
    theoryCounts.klassenspezifisch >= THEORIE_PFLICHT.klassenspezifisch;

  const isB197 = student?.fuehrerscheinklasse === "B197";
  const isB78 = student?.fuehrerscheinklasse === "B78";

  const schaltLessons = lessons.filter(
    (l) => l.fahrzeug_typ === "schaltwagen" && l.typ !== "fehlstunde"
  );
  const gearEinheitenTotal = schaltLessons.reduce(
    (sum, l) => sum + (l.einheiten || Math.floor(l.dauer_minuten / 45)), 0
  );
  const gearHoursDone = gearEinheitenTotal;
  const gearHoursRequired = SCHALTSTUNDEN_PFLICHT;
  const gearPct = Math.min(100, Math.round((gearHoursDone / gearHoursRequired) * 100));
  const gearComplete = gearHoursDone >= gearHoursRequired;

  const allSonderComplete =
    !student?.ist_umschreiber &&
    sonderCounts.ueberland >= PFLICHT.ueberland &&
    sonderCounts.autobahn >= PFLICHT.autobahn &&
    sonderCounts.nacht >= PFLICHT.nacht &&
    (!isB197 || gearComplete);

  const testfahrtVorhanden = lessons.some((l) => l.typ === "testfahrt_b197");
  const testfahrtPct = testfahrtVorhanden ? 100 : 0;
  const schaltberechtigungAktiv = isB197 && gearComplete && testfahrtVorhanden;

  const totalFahrstunden = lessons.reduce((sum, l) => sum + Number(l.preis), 0);
  const totalPruefungen  = exams.reduce((sum, e) => sum + Number(e.preis), 0);
  const totalLeistungen  = services.reduce((sum, sv) => sum + Number(sv.preis), 0);
  const totalZahlungen   = payments.reduce((sum, p) => sum + Number(p.betrag), 0);

  // Saldo aus open_items berechnen
  const totalForderungen = openItems.reduce((sum: number, oi: any) => sum + Number(oi.betrag_gesamt), 0);
  const totalBezahlt = openItems.reduce((sum: number, oi: any) => sum + Number(oi.betrag_bezahlt), 0);
  const saldo = totalForderungen - totalBezahlt;

  const previewPrice = calculatePrice(fsFahrstunde.dauer_minuten);

  // ── Section "+" Button helper ──
  const SectionAddBtn = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <Button variant="outline" size="sm" className="text-xs h-7 px-2.5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary" onClick={onClick}>
      {label}
    </Button>
  );

  // ── Skeleton ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/fahrschueler"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="h-7 w-48 rounded-lg bg-secondary/60 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="h-80 rounded-xl bg-secondary/40 animate-pulse" />
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-secondary/40 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <p className="text-muted-foreground">Schüler nicht gefunden.</p>
        <Button variant="outline" asChild>
          <Link to="/dashboard/fahrschueler"><ArrowLeft className="h-4 w-4 mr-2" />Zurück</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/fahrschueler"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {student.nachname}, {student.vorname}
            </h1>
            <p className="text-muted-foreground text-sm">Fahrschüler-Details</p>
          </div>
        </div>

        {/* ── Central Action Dropdown ── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Aktion hinzufügen
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => setDlgFahrstunde(true)}>
              <Car className="h-4 w-4 mr-2" />Fahrstunde eintragen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setFsFahrstunde((f) => ({ ...f, fahrzeug_typ: "schaltwagen" }));
              setDlgFahrstunde(true);
            }}>
              <Settings className="h-4 w-4 mr-2" />Schaltstunde planen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDlgTheorie(true)}>
              <BookOpen className="h-4 w-4 mr-2" />Theorieeinheit eintragen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDlgPruefung(true)}>
              <GraduationCap className="h-4 w-4 mr-2" />Prüfung eintragen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDlgLeistung(true)}>
              <CreditCard className="h-4 w-4 mr-2" />Leistung hinzufügen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDlgZahlung(true)}>
              <CreditCard className="h-4 w-4 mr-2" />Zahlung erfassen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left Column: Profil-Karte ── */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-1 space-y-5">
          {/* Avatar & Name */}
          <div className="flex flex-col items-center gap-3 text-center">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground text-lg">
                {student.vorname} {student.nachname}
              </p>
              <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${KLASSE_COLORS[student.fuehrerscheinklasse]}`}>
                  Klasse {student.fuehrerscheinklasse}
                </span>
                <Badge variant="outline" className="text-xs">
                  {(student as any).fahrschule === "rathaus" ? "Miro-Drive (Rathaus)" : "Miro-Drive (Riemke Markt)"}
                </Badge>
                {student.ist_umschreiber && (
                  <Badge className="bg-amber-500/10 text-amber-700 border border-amber-500/20 hover:bg-amber-500/15 text-xs">
                    Umschreiber
                  </Badge>
                )}
                {student.status && (
                  <Badge variant="outline" className="text-xs">{student.status}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Kontakt */}
          <div className="space-y-2.5">
            {student.email && (
              <div className="flex items-start gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-foreground break-all">{student.email}</span>
              </div>
            )}
            {student.telefon && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{student.telefon}</span>
              </div>
            )}
            {student.adresse && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-foreground">{student.adresse}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                Angemeldet {format(new Date(student.created_at), "dd. MMMM yyyy", { locale: de })}
              </span>
            </div>
            {(student as any).geburtsdatum && (
              <div className="flex items-center gap-3 text-sm">
                <Cake className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">
                  Geb. {format(new Date((student as any).geburtsdatum), "dd.MM.yyyy")}
                </span>
              </div>
            )}
          </div>

          {(!student.email && !student.telefon && !student.adresse) && (
            <p className="text-xs text-muted-foreground text-center">Keine Kontaktdaten hinterlegt.</p>
          )}

          <div className="border-t border-border" />

          {/* Saldo Übersicht */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Übersicht / Saldo</p>
            {[
              { label: `Forderungen gesamt`, value: totalForderungen, sign: "" },
              { label: `Davon bezahlt`, value: totalBezahlt, sign: "−", cls: "text-green-600" },
            ].map(({ label, value, sign, cls }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-medium ${cls ?? "text-foreground"}`}>
                  {sign}{value.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                </span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between text-sm">
              <span className="font-semibold text-foreground">
                {saldo > 0 ? "Offener Saldo" : "Ausgeglichen"}
              </span>
              <span className={`font-bold ${saldo > 0 ? "text-red-600" : "text-green-600"}`}>
                {saldo.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
              </span>
            </div>
          </div>

          {/* Offene Posten Liste */}
          {(() => {
            const offene = openItems.filter((oi: any) => oi.status !== "bezahlt");
            if (offene.length === 0) return null;
            const sorted = [...offene].sort((a: any, b: any) => new Date(b.datum).getTime() - new Date(a.datum).getTime());
            return (
              <div className="space-y-2 mt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Offene Posten ({offene.length})
                </p>
                <div className="space-y-1.5">
                  {sorted.map((oi: any) => {
                    const offen = Number(oi.betrag_gesamt) - Number(oi.betrag_bezahlt);
                    const istTeilbezahlt = oi.status === "teilbezahlt";
                    return (
                      <div key={oi.id} className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-muted-foreground shrink-0">
                            {format(new Date(oi.datum), "dd.MM.yy")}
                          </span>
                          <span className="text-foreground truncate">{oi.beschreibung}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-medium text-foreground">
                            {offen.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            istTeilbezahlt
                              ? "bg-orange-500/10 text-orange-600 border border-orange-500/20"
                              : "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                          }`}>
                            {istTeilbezahlt
                              ? `${Number(oi.betrag_bezahlt).toLocaleString("de-DE", { minimumFractionDigits: 0 })}€ bez.`
                              : "offen"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* ── B78 Info-Banner ── */}
          {isB78 && (
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-purple-600 shrink-0" />
              <p className="text-sm text-purple-700">
                <span className="font-semibold">Klasse B78</span> – Nur Automatik, keine Schaltberechtigung
              </p>
            </div>
          )}

          {/* ── Sonderfahrten Fortschritt ── */}
          {student.ist_umschreiber ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-amber-600" />
                <span className="font-semibold text-foreground">Sonderfahrten</span>
                <Badge className="ml-auto bg-amber-500/10 text-amber-700 border border-amber-500/20 hover:bg-amber-500/15 text-xs">
                  Umschreiber – keine Sonderfahrten erforderlich
                </Badge>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-semibold text-foreground">Fahrstunden Übersicht</h2>
                </div>
                <div className="flex items-center gap-2">
                  {allSonderComplete && (
                    <div className="flex items-center gap-1.5 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Alle Pflichtfahrten absolviert</span>
                    </div>
                  )}
                  <SectionAddBtn label="+ Fahrstunde hinzufügen" onClick={() => setDlgFahrstunde(true)} />
                </div>
              </div>

              <div className="space-y-4">
                {/* Übungsstunden */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">Übungsstunden</span>
                  <span className="text-muted-foreground font-semibold">{uebungsstundenEinheiten}</span>
                </div>

                {(["ueberland", "autobahn", "nacht"] as const).map((typ) => {
                  const done = sonderCounts[typ];
                  const required = PFLICHT[typ];
                  const pct = Math.min(100, Math.round((done / required) * 100));
                  const completed = done >= required;

                  return (
                    <div key={typ} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{SONDER_LABELS[typ]}</span>
                        <div className="flex items-center gap-2">
                          <span className={completed ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                            {done} / {required}
                          </span>
                          {completed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </div>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            completed ? "bg-green-500" : "bg-primary"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{pct}%</p>
                    </div>
                  );
                })}

                {/* Schaltstunden – nur bei B197 */}
                {isB197 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">Schaltstunden</span>
                      <div className="flex items-center gap-2">
                      <span className={gearComplete ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                          {gearHoursDone} / {SCHALTSTUNDEN_PFLICHT}
                        </span>
                        {gearComplete && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </div>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          gearComplete ? "bg-green-500" : "bg-primary"
                        }`}
                        style={{ width: `${gearPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{gearPct}%</p>
                  </div>
                )}

                {/* Gesamt-Fahrstunden */}
                <div className="border-t border-border pt-3 flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">Gesamt-Fahrstunden</span>
                  <span className="font-bold text-foreground">{gesamtEinheiten} Einheiten</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Theorie Fortschritt ── */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold text-foreground">Theorieunterricht</h2>
              </div>
              <div className="flex items-center gap-2">
                {allTheorieComplete && (
                  <div className="flex items-center gap-1.5 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Pflicht erfüllt</span>
                  </div>
                )}
                <SectionAddBtn label="+ Theoriestunde hinzufügen" onClick={() => setDlgTheorie(true)} />
              </div>
            </div>
            <div className="space-y-4">
              {(["grundstoff", "klassenspezifisch"] as const).map((typ) => {
                const done = theoryCounts[typ];
                const required = THEORIE_PFLICHT[typ];
                const pct = Math.min(100, Math.round((done / required) * 100));
                const completed = done >= required;
                return (
                  <div key={typ} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{THEORIE_LABELS[typ]}</span>
                      <div className="flex items-center gap-2">
                        <span className={completed ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                          {done} / {required}
                        </span>
                        {completed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </div>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${completed ? "bg-green-500" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{pct}%</p>
                  </div>
                );
              })}

              {/* Lektionen-Checkliste */}
              <div className="border-t border-border pt-3 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Grundstoff (Lektion 1–12)</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                    {THEORIE_LEKTIONEN.filter((l) => l.nr <= 12).map((l) => {
                      const done = completedLektionen.has(l.nr);
                      return (
                        <div
                          key={l.nr}
                          className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${
                            done
                              ? "border-green-500/20 bg-green-500/10 text-green-700"
                              : "border-border bg-muted/30 text-muted-foreground"
                          }`}
                        >
                          {done ? <Check className="h-3 w-3" /> : <span className="h-3 w-3" />}
                          L{l.nr}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Klassenspezifisch (Lektion 13–14)</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                    {THEORIE_LEKTIONEN.filter((l) => l.nr >= 13).map((l) => {
                      const done = completedLektionen.has(l.nr);
                      return (
                        <div
                          key={l.nr}
                          className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${
                            done
                              ? "border-green-500/20 bg-green-500/10 text-green-700"
                              : "border-border bg-muted/30 text-muted-foreground"
                          }`}
                        >
                          {done ? <Check className="h-3 w-3" /> : <span className="h-3 w-3" />}
                          L{l.nr}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Schaltstunden + Schaltberechtigung (B197 only) ── */}
          {isB197 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold text-foreground">Schaltstunden & Schaltberechtigung</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">Schaltstunden absolviert</span>
                    <div className="flex items-center gap-2">
                      <span className={gearComplete ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                        {gearHoursDone} / {gearHoursRequired}
                      </span>
                      {gearComplete && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </div>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${gearComplete ? "bg-green-500" : "bg-primary"}`}
                      style={{ width: `${gearPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{gearPct}% · {gearHoursDone} Einheiten gesamt</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">Testfahrt B197</span>
                    <div className="flex items-center gap-2">
                      <span className={testfahrtVorhanden ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                        {testfahrtVorhanden ? 1 : 0} / 1
                      </span>
                      {testfahrtVorhanden && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </div>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${testfahrtVorhanden ? "bg-green-500" : "bg-primary"}`}
                      style={{ width: `${testfahrtPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{testfahrtPct}%</p>
                </div>

                <div className={`flex items-center gap-3 rounded-lg border p-3 ${
                  schaltberechtigungAktiv
                    ? "border-green-500/20 bg-green-500/10"
                    : "border-amber-500/20 bg-amber-500/10"
                }`}>
                  {schaltberechtigungAktiv ? (
                    <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <p className={`text-sm font-semibold ${schaltberechtigungAktiv ? "text-green-600" : "text-amber-600"}`}>
                      {schaltberechtigungAktiv ? "Schaltberechtigung aktiv" : "Schaltberechtigung ausstehend"}
                    </p>
                    {!schaltberechtigungAktiv && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Erforderlich:{" "}
                        {!gearComplete && `${gearHoursRequired - gearHoursDone} Schaltstunden`}
                        {!gearComplete && !testfahrtVorhanden && " · "}
                        {!testfahrtVorhanden && "Testfahrt B197"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Prüfungen ── */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold text-foreground">
                  Prüfungen
                  <span className="ml-2 text-sm font-normal text-muted-foreground">({exams.length})</span>
                </h2>
              </div>
              <SectionAddBtn label="+ Prüfung eintragen" onClick={() => setDlgPruefung(true)} />
            </div>
            {exams.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Prüfungen eingetragen.</p>
            ) : (
              <div className="space-y-0 divide-y divide-border/50">
                {exams.map((exam) => {
                  const isTheorie = exam.typ === "theorie";
                  return (
                    <div key={exam.id} className="flex items-center gap-4 py-2.5 first:pt-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {isTheorie ? "Theorieprüfung" : "Fahrprüfung"}
                          </p>
                          {!isTheorie && (
                            <span className="text-xs text-muted-foreground">
                              · {FAHRZEUG_LABELS[exam.fahrzeug_typ] ?? exam.fahrzeug_typ}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(exam.datum), "dd.MM.yyyy", { locale: de })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {exam.bestanden ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-700">
                            <CheckCircle2 className="h-3 w-3" /> Bestanden
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                            <XCircle className="h-3 w-3" /> Nicht bestanden
                          </span>
                        )}
                        <span className="text-sm font-semibold text-foreground w-20 text-right">
                          {Number(exam.preis).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Fahrstunden Liste ── */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">
                Fahrstunden
                <span className="ml-2 text-sm font-normal text-muted-foreground">({lessons.reduce((s, l) => s + (Number((l as any).einheiten) || Math.floor(l.dauer_minuten / 45)), 0)} Einheiten)</span>
              </h2>
              <SectionAddBtn label="+ Fahrstunde hinzufügen" onClick={() => setDlgFahrstunde(true)} />
            </div>
            {lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Fahrstunden eingetragen.</p>
            ) : (
              <div className="space-y-0 divide-y divide-border/50">
                {lessons.slice(0, 10).map((lesson) => (
                  <div key={lesson.id} className="flex items-center gap-4 py-2.5 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {TYP_LABELS[lesson.typ] ?? lesson.typ}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(lesson.datum), "dd.MM.yyyy HH:mm", { locale: de })} · {lesson.dauer_minuten} min · {FAHRZEUG_LABELS[lesson.fahrzeug_typ] ?? lesson.fahrzeug_typ}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground shrink-0">
                      {Number(lesson.preis).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                    </span>
                  </div>
                ))}
                {lessons.length > 10 && (
                  <p className="text-xs text-muted-foreground pt-3">
                    + {lessons.length - 10} weitere Einträge
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Leistungen Liste ── */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">
                Leistungen
                <span className="ml-2 text-sm font-normal text-muted-foreground">({services.length})</span>
              </h2>
              <SectionAddBtn label="+ Leistung hinzufügen" onClick={() => setDlgLeistung(true)} />
            </div>
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Leistungen erfasst.</p>
            ) : (
              <div className="space-y-0 divide-y divide-border/50">
                {services.map((service) => {
                  const status = SERVICE_STATUS_LABELS[service.status] ?? { label: service.status, cls: "" };
                  return (
                    <div key={service.id} className="flex items-center gap-4 py-2.5 first:pt-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{service.bezeichnung}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(service.created_at), "dd.MM.yyyy", { locale: de })}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold shrink-0 ${status.cls}`}
                      >
                        {status.label}
                      </span>
                      <span className="text-sm font-semibold text-foreground shrink-0 w-20 text-right">
                        {Number(service.preis).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Zahlungen Liste ── */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold text-foreground">
                  Zahlungen
                  <span className="ml-2 text-sm font-normal text-muted-foreground">({payments.length})</span>
                </h2>
              </div>
              <SectionAddBtn label="+ Zahlung hinzufügen" onClick={() => setDlgZahlung(true)} />
            </div>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Zahlungen erfasst.</p>
            ) : (
              <div className="space-y-0 divide-y divide-border/50">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center gap-4 py-2.5 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground capitalize">
                        {payment.zahlungsart === "bar" ? "Bar" : payment.zahlungsart === "ec" ? "EC" : "Überweisung"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payment.datum), "dd.MM.yyyy", { locale: de })}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-green-400 shrink-0">
                      {Number(payment.betrag).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODALS
         ═══════════════════════════════════════════════════════════════════════ */}

      {/* ── Modal: Fahrstunde ── */}
      <Dialog open={dlgFahrstunde} onOpenChange={setDlgFahrstunde}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neue Fahrstunde</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); mutFahrstunde.mutate(); }} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Typ</Label>
              <Select value={fsFahrstunde.typ} onValueChange={(v) => setFsFahrstunde((f) => ({ ...f, typ: v as DrivingLessonTyp }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYP_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fahrzeugtyp</Label>
              <Select value={fsFahrstunde.fahrzeug_typ} onValueChange={(v) => setFsFahrstunde((f) => ({ ...f, fahrzeug_typ: v as FahrzeugTyp }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatik">Automatik</SelectItem>
                  <SelectItem value="schaltwagen">Schaltwagen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Datum & Uhrzeit</Label>
              <Input type="datetime-local" value={fsFahrstunde.datum} onChange={(e) => setFsFahrstunde((f) => ({ ...f, datum: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Dauer (Minuten)</Label>
              <div className="flex gap-2">
                {DAUER_OPTIONS.map((d) => (
                  <Button key={d} type="button" variant={fsFahrstunde.dauer_minuten === d ? "default" : "outline"} size="sm" onClick={() => setFsFahrstunde((f) => ({ ...f, dauer_minuten: d }))}>
                    {d} min
                  </Button>
                ))}
                <Input type="number" min={1} className="w-24" value={fsFahrstunde.dauer_minuten} onChange={(e) => setFsFahrstunde((f) => ({ ...f, dauer_minuten: parseInt(e.target.value) || 45 }))} />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Berechneter Preis</span>
              <span className="font-semibold text-foreground text-lg">{previewPrice.toFixed(2)} €</span>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setDlgFahrstunde(false)}>Abbrechen</Button>
              <Button type="submit" disabled={mutFahrstunde.isPending}>{mutFahrstunde.isPending ? "Speichern…" : "Speichern"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schaltstunden-Modal entfernt – Fahrstunden-Dialog reicht */}

      {/* ── Modal: Theorie ── */}
      <Dialog open={dlgTheorie} onOpenChange={setDlgTheorie}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neue Theoriestunde</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); mutTheorie.mutate(); }} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Theorielektion</Label>
              <Select value={String(fsTheorie.lektion)} onValueChange={(v) => setFsTheorie((f) => ({ ...f, lektion: parseInt(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {THEORIE_LEKTIONEN.map((l) => (
                    <SelectItem key={l.nr} value={String(l.nr)}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Duplikat-Warnung */}
              {(() => {
                const existing = theorySessions.find((s: any) => s.lektion === fsTheorie.lektion);
                if (!existing) return null;
                return (
                  <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Lektion {fsTheorie.lektion} wurde bereits am {format(new Date(existing.datum), "dd.MM.yyyy", { locale: de })} besucht. Sie wird nicht doppelt für die Pflicht gezählt.
                  </p>
                );
              })()}
            </div>
            <div className="space-y-1.5">
              <Label>Datum & Uhrzeit</Label>
              <Input type="datetime-local" value={fsTheorie.datum} onChange={(e) => setFsTheorie((f) => ({ ...f, datum: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setDlgTheorie(false)}>Abbrechen</Button>
              <Button type="submit" disabled={mutTheorie.isPending}>{mutTheorie.isPending ? "Speichern…" : "Speichern"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Prüfung ── */}
      <Dialog open={dlgPruefung} onOpenChange={(v) => { setDlgPruefung(v); if (!v) setFsPruefung({ typ: "theorie", fahrzeug_typ: "automatik", instructor_id: "", datum: new Date().toISOString().slice(0, 10), bestanden: false, preis: "0" }); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Prüfung eintragen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Prüfungstyp</Label>
              <Select value={fsPruefung.typ} onValueChange={(v) => setFsPruefung((f) => ({ ...f, typ: v as "theorie" | "praxis", instructor_id: v === "theorie" ? "" : f.instructor_id }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="theorie">Theorieprüfung</SelectItem>
                  <SelectItem value="praxis">Fahrprüfung</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {fsPruefung.typ === "praxis" && (
              <div className="space-y-1.5">
                <Label>Fahrlehrer</Label>
                <Select value={fsPruefung.instructor_id} onValueChange={(v) => setFsPruefung((f) => ({ ...f, instructor_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Fahrlehrer wählen…" /></SelectTrigger>
                  <SelectContent>
                    {instructors.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.nachname}, {i.vorname}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Fahrzeugtyp</Label>
              <Select value={fsPruefung.fahrzeug_typ} onValueChange={(v) => setFsPruefung((f) => ({ ...f, fahrzeug_typ: v as FahrzeugTyp }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatik">Automatik</SelectItem>
                  <SelectItem value="schaltwagen">Schaltwagen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Datum</Label>
              <Input type="date" value={fsPruefung.datum} onChange={(e) => setFsPruefung((f) => ({ ...f, datum: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Ergebnis</Label>
              <Select value={fsPruefung.bestanden ? "ja" : "nein"} onValueChange={(v) => setFsPruefung((f) => ({ ...f, bestanden: v === "ja" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ja">Bestanden</SelectItem>
                  <SelectItem value="nein">Nicht bestanden</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Preis (€)</Label>
              <Input type="number" step="0.01" min="0" value={fsPruefung.preis} onChange={(e) => setFsPruefung((f) => ({ ...f, preis: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDlgPruefung(false)}>Abbrechen</Button>
              <Button disabled={mutPruefung.isPending} onClick={() => mutPruefung.mutate()}>
                {mutPruefung.isPending ? "Speichern…" : "Speichern"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Leistung ── */}
      <Dialog open={dlgLeistung} onOpenChange={(v) => { setDlgLeistung(v); if (!v) setFsLeistung({ preis_id: "", bezeichnung: "", preis: "", status: "offen" }); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Leistung hinzufügen</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!fsLeistung.bezeichnung) { toast({ title: "Bezeichnung ist Pflicht", variant: "destructive" }); return; }
            mutLeistung.mutate();
          }} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Aus Preisliste wählen</Label>
              <Select value={fsLeistung.preis_id} onValueChange={(preisId) => {
                const found = prices.find((p) => p.id === preisId);
                if (found) setFsLeistung((f) => ({ ...f, preis_id: preisId, bezeichnung: found.bezeichnung, preis: String(found.preis) }));
                else setFsLeistung((f) => ({ ...f, preis_id: preisId }));
              }}>
                <SelectTrigger><SelectValue placeholder="Leistung aus Preisliste..." /></SelectTrigger>
                <SelectContent>
                  {prices.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="text-xs text-muted-foreground mr-2">[{p.kategorie}]</span>
                      {p.bezeichnung} – {Number(p.preis).toFixed(2)} €
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Bezeichnung *</Label>
              <Input placeholder="Leistungsbezeichnung" value={fsLeistung.bezeichnung} onChange={(e) => setFsLeistung((f) => ({ ...f, bezeichnung: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Preis (€)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0,00" value={fsLeistung.preis} onChange={(e) => setFsLeistung((f) => ({ ...f, preis: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={fsLeistung.status} onValueChange={(v) => setFsLeistung((f) => ({ ...f, status: v as ServiceStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="offen">Offen</SelectItem>
                  <SelectItem value="bezahlt">Bezahlt</SelectItem>
                  <SelectItem value="erledigt">Erledigt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDlgLeistung(false)}>Abbrechen</Button>
              <Button type="submit" disabled={mutLeistung.isPending}>{mutLeistung.isPending ? "Speichern…" : "Zuordnen"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Zahlung ── */}
      <Dialog open={dlgZahlung} onOpenChange={(v) => { setDlgZahlung(v); if (!v) setFsZahlung({ betrag: "", zahlungsart: "bar", datum: new Date().toISOString().slice(0, 10), selectedOpenItems: [] }); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Zahlung erfassen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Datum</Label>
              <Input type="date" value={fsZahlung.datum} onChange={(e) => setFsZahlung((f) => ({ ...f, datum: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Zahlungsart</Label>
              <Select value={fsZahlung.zahlungsart} onValueChange={(v) => setFsZahlung((f) => ({ ...f, zahlungsart: v as Zahlungsart }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="ec">EC-Karte</SelectItem>
                  <SelectItem value="ueberweisung">Überweisung</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Betrag (€)</Label>
              <Input type="number" step="0.01" min="0.01" placeholder="0,00" value={fsZahlung.betrag} onChange={(e) => setFsZahlung((f) => ({ ...f, betrag: e.target.value }))} />
            </div>

            {/* Offene Posten */}
            {(() => {
              const offenePosten = openItems.filter((oi: any) => oi.status !== "bezahlt");
              if (offenePosten.length === 0) return null;

              const betragNum = parseFloat(fsZahlung.betrag) || 0;
              const selectedItems = offenePosten
                .filter((oi: any) => fsZahlung.selectedOpenItems.includes(oi.id))
                .sort((a: any, b: any) => new Date(a.datum).getTime() - new Date(b.datum).getTime());

              // Calculate allocations for preview
              let remaining = betragNum;
              const allocMap = new Map<string, number>();
              for (const item of selectedItems) {
                if (remaining <= 0) break;
                const offen = Number(item.betrag_gesamt) - Number(item.betrag_bezahlt);
                const zuordnung = Math.min(remaining, offen);
                allocMap.set(item.id, zuordnung);
                remaining -= zuordnung;
              }

              return (
                <div className="space-y-2">
                  <Label>Offene Posten zuordnen</Label>
                  <div className="rounded-lg border border-border divide-y divide-border max-h-60 overflow-y-auto">
                    {offenePosten.map((oi: any) => {
                      const offen = Number(oi.betrag_gesamt) - Number(oi.betrag_bezahlt);
                      const checked = fsZahlung.selectedOpenItems.includes(oi.id);
                      const alloc = allocMap.get(oi.id);
                      return (
                        <label key={oi.id} className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => {
                              setFsZahlung((f) => {
                                const newSelected = c
                                  ? [...f.selectedOpenItems, oi.id]
                                  : f.selectedOpenItems.filter((x) => x !== oi.id);
                                const summe = offenePosten
                                  .filter((item: any) => newSelected.includes(item.id))
                                  .reduce((sum: number, item: any) => sum + (Number(item.betrag_gesamt) - Number(item.betrag_bezahlt)), 0);
                                return {
                                  ...f,
                                  selectedOpenItems: newSelected,
                                  betrag: summe > 0 ? summe.toFixed(2) : "",
                                };
                              });
                            }}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(oi.datum), "dd.MM.yyyy", { locale: de })}
                              </span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {oi.typ === "fahrstunde" ? "Fahrstunde" : oi.typ === "pruefung" ? "Prüfung" : "Leistung"}
                              </Badge>
                            </div>
                            <p className="text-sm text-foreground truncate">{oi.beschreibung}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-foreground">{offen.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</p>
                            {checked && alloc != null && alloc > 0 && (
                              <p className="text-xs text-green-400">
                                → {alloc.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {fsZahlung.selectedOpenItems.length > 0 && betragNum > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Verteilung: {Array.from(allocMap.values()).reduce((s, v) => s + v, 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })} zugeordnet
                      {remaining > 0 && ` · ${remaining.toLocaleString("de-DE", { style: "currency", currency: "EUR" })} Restbetrag`}
                    </p>
                  )}
                </div>
              );
            })()}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDlgZahlung(false)}>Abbrechen</Button>
              <Button disabled={!fsZahlung.betrag || mutZahlung.isPending} onClick={() => mutZahlung.mutate()}>
                {mutZahlung.isPending ? "Speichern…" : "Speichern"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FahrschuelerDetail;
