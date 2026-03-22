import { useState, useEffect, useMemo } from "react";
import { parse, isValid } from "date-fns";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, CheckCircle2, Car, BookOpen, Settings, GraduationCap, XCircle, AlertTriangle, ShieldCheck, ShieldAlert, CreditCard, Plus, ChevronDown, Cake, Check, Pencil, Trash2, Printer, Archive, RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { THEORIE_LEKTIONEN, lektionToTyp } from "@/lib/theorieLektionen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  

  // ── Dialog states ──
  const [dlgFahrstunde, setDlgFahrstunde] = useState(false);
  // dlgSchaltstunde removed – use Fahrstunden-Dialog with fahrzeug_typ=schaltwagen
  const [dlgTheorie, setDlgTheorie] = useState(false);
  const [dlgPruefung, setDlgPruefung] = useState(false);
  const [dlgLeistung, setDlgLeistung] = useState(false);
  const [dlgZahlung, setDlgZahlung] = useState(false);
  const [editingExamStatusId, setEditingExamStatusId] = useState<string | null>(null);
  const [visibleLessons, setVisibleLessons] = useState(10);

  // ── Edit states ──
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [editingTheory, setEditingTheory] = useState<any | null>(null);
  const [editingExam, setEditingExam] = useState<any | null>(null);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [editingPayment, setEditingPayment] = useState<any | null>(null);
  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ vorname: "", nachname: "", fuehrerscheinklasse: "" as "B" | "B78" | "B197", email: "", telefon: "", adresse: "", geburtsdatum: "", anmeldedatum: "", ist_umschreiber: false, fahrschule: "riemke" });
  const [deletingStudent, setDeletingStudent] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ type: "fahrstunde" | "theorie" | "pruefung" | "leistung" | "zahlung"; id: string; label: string } | null>(null);
  const [printSection, setPrintSection] = useState<"fahrstunden" | "leistungen" | "zahlungen" | "pruefungen" | null>(null);
  const [printSections, setPrintSections] = useState<string[]>([]);
  const [dlgPrint, setDlgPrint] = useState(false);
  const [dlgPrintSel, setDlgPrintSel] = useState<string[]>([]);

  // ── Form states ──
  const [fsFahrstunde, setFsFahrstunde] = useState({
    typ: "uebungsstunde" as DrivingLessonTyp,
    fahrzeug_typ: "automatik" as FahrzeugTyp,
    instructor_id: "",
    dauer_minuten: 45,
    datum: new Date().toISOString().slice(0, 16),
    fehlstundePreis: "40",
  });
  // fsSchaltstunde removed – Fahrstunden-Dialog handles schaltwagen
  const [fsTheorie, setFsTheorie] = useState({
    lektion: 1,
    instructor_id: "",
    datum: new Date().toISOString().slice(0, 16),
  });
  const [fsPruefung, setFsPruefung] = useState({
    typ: "theorie" as "theorie" | "praxis",
    fahrzeug_typ: "automatik" as FahrzeugTyp,
    instructor_id: "",
    datum: new Date().toISOString().slice(0, 10),
    status: "angemeldet" as "angemeldet" | "bestanden" | "nicht_bestanden" | "krank",
    preis: "0",
  });
  const [fsLeistung, setFsLeistung] = useState({
    preis_id: "",
    bezeichnung: "",
    preis: "",
    datum: new Date().toISOString().slice(0, 16),
    status: "offen" as ServiceStatus,
  });
  const [fsZahlung, setFsZahlung] = useState({
    betrag: "",
    zahlungsart: "bar" as Zahlungsart,
    datum: new Date().toISOString().slice(0, 10),
    einreichungsdatum: new Date().toISOString().slice(0, 10),
    selectedOpenItems: [] as string[],
    istGutschrift: false,
    gutschriftNotiz: "",
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

  // Payment allocations for Guthaben calculation
  const { data: paymentAllocations = [] } = useQuery({
    queryKey: ["payment_allocations", id],
    queryFn: async () => {
      const { data: paymentIds } = await supabase.from("payments").select("id").eq("student_id", id!);
      if (!paymentIds || paymentIds.length === 0) return [];
      const ids = paymentIds.map((p: any) => p.id);
      const { data, error } = await supabase
        .from("payment_allocations")
        .select("*")
        .in("payment_id", ids);
      if (error) throw error;
      return data ?? [];
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

  // Print trigger
  useEffect(() => {
    if (!printSection && printSections.length === 0) return;
    const timer = setTimeout(() => window.print(), 100);
    const onAfterPrint = () => {
      setPrintSection(null);
      setPrintSections([]);
    };
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [printSection, printSections]);

  // ── Archive mutation ──
  const mutArchive = useMutation({
    mutationFn: async (archive: boolean) => {
      const { error } = await supabase.from("students").update({ status: archive ? "archiviert" : null }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: (_, archive) => {
      queryClient.invalidateQueries({ queryKey: ["student", id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      
      toast({ title: archive ? "Schüler archiviert" : "Schüler wiederhergestellt" });
      if (archive) navigate("/dashboard/fahrschueler");
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const isArchived = student?.status === "archiviert";

  // ── Mutations ──
  const mutFahrstunde = useMutation({
    mutationFn: async () => {
      if (!fsFahrstunde.instructor_id) throw new Error("Bitte einen Fahrlehrer auswählen");
      const insertData: any = {
        student_id: id!,
        instructor_id: fsFahrstunde.instructor_id,
        typ: fsFahrstunde.typ,
        fahrzeug_typ: fsFahrstunde.fahrzeug_typ,
        dauer_minuten: fsFahrstunde.dauer_minuten,
        datum: new Date(fsFahrstunde.datum).toISOString(),
      };
      if (fsFahrstunde.typ === "fehlstunde") {
        insertData.preis = parseFloat(fsFahrstunde.fehlstundePreis) || 40;
      }
      const { error } = await supabase.from("driving_lessons").insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driving_lessons", id] });
      queryClient.invalidateQueries({ queryKey: ["driving_lessons"] });
      queryClient.invalidateQueries({ queryKey: ["open_items", id] });
      setFsFahrstunde(prev => ({ typ: "uebungsstunde", fahrzeug_typ: "automatik", instructor_id: prev.instructor_id, dauer_minuten: 45, datum: prev.datum, fehlstundePreis: "40" }));
      toast({ title: "Fahrstunde gespeichert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  // mutSchaltstunde removed – Fahrstunden-Dialog handles schaltwagen entries

  const mutTheorie = useMutation({
    mutationFn: async () => {
      if (!fsTheorie.instructor_id) throw new Error("Bitte einen Fahrlehrer auswählen");
      const typ = lektionToTyp(fsTheorie.lektion);
      const { error } = await supabase.from("theory_sessions").insert({
        student_id: id!,
        instructor_id: fsTheorie.instructor_id,
        datum: new Date(fsTheorie.datum).toISOString(),
        typ,
        lektion: fsTheorie.lektion,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theory_sessions", id] });
      queryClient.invalidateQueries({ queryKey: ["theory_sessions"] });
      setFsTheorie(prev => ({ lektion: 1, instructor_id: prev.instructor_id, datum: prev.datum }));
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
        status: fsPruefung.status,
        preis: parseFloat(fsPruefung.preis) || 0,
        instructor_id: fsPruefung.typ === "praxis" && fsPruefung.instructor_id ? fsPruefung.instructor_id : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams", id] });
      queryClient.invalidateQueries({ queryKey: ["exams_all"] });
      queryClient.invalidateQueries({ queryKey: ["open_items", id] });
      setFsPruefung(prev => ({ typ: "theorie", fahrzeug_typ: "automatik", instructor_id: "", datum: new Date().toISOString().slice(0, 10), status: "angemeldet", preis: "0" }));
      toast({ title: "Prüfung eingetragen" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const mutExamStatus = useMutation({
    mutationFn: async ({ examId, status }: { examId: string; status: string }) => {
      const { error } = await supabase.from("exams").update({ status }).eq("id", examId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams", id] });
      queryClient.invalidateQueries({ queryKey: ["exams_all"] });
      queryClient.invalidateQueries({ queryKey: ["open_items", id] });
      setEditingExamStatusId(null);
      toast({ title: "Status aktualisiert" });
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
        datum: new Date(fsLeistung.datum).toISOString(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", id] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["open_items", id] });
      setFsLeistung({ preis_id: "", bezeichnung: "", preis: "", datum: new Date().toISOString().slice(0, 16), status: "offen" });
      toast({ title: "Leistung hinzugefügt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const mutZahlung = useMutation({
    mutationFn: async () => {
      const rawBetrag = parseFloat(fsZahlung.betrag) || 0;
      const betrag = fsZahlung.istGutschrift ? -Math.abs(rawBetrag) : rawBetrag;
      // Insert payment
      const { data: paymentData, error: paymentError } = await supabase.from("payments").insert({
        student_id: id!,
        betrag,
        zahlungsart: fsZahlung.zahlungsart,
        datum: new Date(fsZahlung.datum).toISOString(),
        einreichungsdatum: new Date(fsZahlung.einreichungsdatum).toISOString(),
      }).select("id").single();
      if (paymentError) throw paymentError;

      if (fsZahlung.istGutschrift) {
        // Create negative open_item to reduce saldo
        const { error: oiError } = await supabase.from("open_items").insert({
          student_id: id!,
          typ: "gutschrift",
          referenz_id: paymentData.id,
          datum: new Date(fsZahlung.datum).toISOString(),
          beschreibung: fsZahlung.gutschriftNotiz ? `Gutschrift – ${fsZahlung.gutschriftNotiz}` : "Gutschrift",
          betrag_gesamt: betrag,
          status: "bezahlt",
        } as any);
        if (oiError) throw oiError;
      } else if (fsZahlung.selectedOpenItems.length > 0) {
        // Allocate to selected open items
        const selectedItems = openItems
          .filter((oi: any) => fsZahlung.selectedOpenItems.includes(oi.id))
          .sort((a: any, b: any) => new Date(a.datum).getTime() - new Date(b.datum).getTime());

        let remaining = rawBetrag;
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
      queryClient.invalidateQueries({ queryKey: ["payment_allocations", id] });
      queryClient.invalidateQueries({ queryKey: ["open_items", id] });
      queryClient.invalidateQueries({ queryKey: ["open_items"] });
      setFsZahlung(prev => ({ betrag: "", zahlungsart: "bar", datum: prev.datum, einreichungsdatum: new Date().toISOString().slice(0, 10), selectedOpenItems: [], istGutschrift: false, gutschriftNotiz: "" }));
      toast({ title: fsZahlung.istGutschrift ? "Gutschrift gespeichert" : "Zahlung erfasst" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  // ── Contact Edit Mutation ──
  const mutEditContact = useMutation({
    mutationFn: async () => {
      const parsedGeb = contactForm.geburtsdatum ? parse(contactForm.geburtsdatum, "dd.MM.yyyy", new Date()) : null;
      const parsedAnm = contactForm.anmeldedatum ? parse(contactForm.anmeldedatum, "dd.MM.yyyy", new Date()) : null;
      const updateData: any = {
        vorname: contactForm.vorname,
        nachname: contactForm.nachname,
        fuehrerscheinklasse: contactForm.fuehrerscheinklasse,
        email: contactForm.email || null,
        telefon: contactForm.telefon || null,
        adresse: contactForm.adresse || null,
        geburtsdatum: parsedGeb && isValid(parsedGeb) ? format(parsedGeb, "yyyy-MM-dd") : null,
        ist_umschreiber: contactForm.ist_umschreiber,
        fahrschule: contactForm.fahrschule,
      };
      if (parsedAnm && isValid(parsedAnm)) {
        updateData.created_at = parsedAnm.toISOString();
      }
      const { error } = await supabase.from("students").update(updateData).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setEditingContact(false);
      toast({ title: "Kontaktdaten aktualisiert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  // ── Edit Mutations ──
  const mutEditFahrstunde = useMutation({
    mutationFn: async (lesson: any) => {
      const { data, error } = await supabase
        .from("driving_lessons")
        .update({
          typ: lesson.typ,
          fahrzeug_typ: lesson.fahrzeug_typ,
          instructor_id: lesson.instructor_id,
          dauer_minuten: lesson.dauer_minuten,
          datum: new Date(lesson.datum).toISOString(),
        })
        .eq("id", lesson.id)
        .select("preis, einheiten, dauer_minuten")
        .single();
      if (error) throw error;
      // Sync open_items
      await supabase.from("open_items")
        .update({
          betrag_gesamt: data.preis,
          beschreibung: `Fahrstunde ${data.dauer_minuten}min (${data.einheiten}E)`,
          datum: new Date(lesson.datum).toISOString(),
        })
        .eq("referenz_id", lesson.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driving_lessons", id] });
      queryClient.invalidateQueries({ queryKey: ["driving_lessons"] });
      queryClient.invalidateQueries({ queryKey: ["open_items", id] });
      queryClient.invalidateQueries({ queryKey: ["open_items"] });
      setEditingLesson(null);
      toast({ title: "Fahrstunde aktualisiert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const mutEditTheorie = useMutation({
    mutationFn: async (session: any) => {
      const typ = lektionToTyp(session.lektion);
      const { error } = await supabase
        .from("theory_sessions")
        .update({
          lektion: session.lektion,
          instructor_id: session.instructor_id,
          datum: new Date(session.datum).toISOString(),
          typ,
        })
        .eq("id", session.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theory_sessions", id] });
      queryClient.invalidateQueries({ queryKey: ["theory_sessions"] });
      setEditingTheory(null);
      toast({ title: "Theoriestunde aktualisiert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const mutEditPruefung = useMutation({
    mutationFn: async (exam: any) => {
      const { error } = await supabase
        .from("exams")
        .update({
          typ: exam.typ,
          fahrzeug_typ: exam.fahrzeug_typ,
          instructor_id: exam.typ === "praxis" && exam.instructor_id ? exam.instructor_id : null,
          datum: new Date(exam.datum).toISOString(),
          status: exam.status,
          preis: parseFloat(exam.preis) || 0,
        })
        .eq("id", exam.id);
      if (error) throw error;
      // Sync open_items
      await supabase.from("open_items")
        .update({
          betrag_gesamt: parseFloat(exam.preis) || 0,
          beschreibung: exam.typ === "theorie" ? "Theorieprüfung" : "Fahrprüfung",
          datum: new Date(exam.datum).toISOString(),
        })
        .eq("referenz_id", exam.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams", id] });
      queryClient.invalidateQueries({ queryKey: ["exams_all"] });
      queryClient.invalidateQueries({ queryKey: ["open_items", id] });
      queryClient.invalidateQueries({ queryKey: ["open_items"] });
      setEditingExam(null);
      toast({ title: "Prüfung aktualisiert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const mutEditLeistung = useMutation({
    mutationFn: async (service: any) => {
      const { error } = await supabase
        .from("services")
        .update({
          bezeichnung: service.bezeichnung,
          preis: parseFloat(service.preis) || 0,
          status: service.status,
          datum: service.datum ? new Date(service.datum).toISOString() : undefined,
        } as any)
        .eq("id", service.id);
      if (error) throw error;
      // Sync open_items
      await supabase.from("open_items")
        .update({
          betrag_gesamt: parseFloat(service.preis) || 0,
          beschreibung: service.bezeichnung,
        })
        .eq("referenz_id", service.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", id] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["open_items", id] });
      queryClient.invalidateQueries({ queryKey: ["open_items"] });
      setEditingService(null);
      toast({ title: "Leistung aktualisiert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const mutEditZahlung = useMutation({
    mutationFn: async (payment: any) => {
      const { error } = await supabase
        .from("payments")
        .update({
          betrag: parseFloat(payment.betrag) || 0,
          zahlungsart: payment.zahlungsart,
          datum: new Date(payment.datum).toISOString(),
        })
        .eq("id", payment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", id] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment_allocations", id] });
      queryClient.invalidateQueries({ queryKey: ["open_items", id] });
      queryClient.invalidateQueries({ queryKey: ["open_items"] });
      setEditingPayment(null);
      toast({ title: "Zahlung aktualisiert" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  // ── Guthaben verrechnen Mutation ──
  const mutGuthabenVerrechnen = useMutation({
    mutationFn: async () => {
      // Find unallocated payments (positive, with remaining unallocated amount)
      const paymentIds = payments.filter((p: any) => Number(p.betrag) > 0).map((p: any) => p.id);
      if (paymentIds.length === 0) return;

      const { data: existingAllocs } = await supabase
        .from("payment_allocations")
        .select("payment_id, betrag")
        .in("payment_id", paymentIds);

      const allocByPayment = new Map<string, number>();
      for (const a of (existingAllocs ?? [])) {
        allocByPayment.set(a.payment_id, (allocByPayment.get(a.payment_id) || 0) + Number(a.betrag));
      }

      // Build list of payments with remaining unallocated amounts
      const unallocated: { id: string; remaining: number }[] = [];
      for (const p of payments.filter((p: any) => Number(p.betrag) > 0)) {
        const allocated = allocByPayment.get(p.id) || 0;
        const rem = Number(p.betrag) - allocated;
        if (rem > 0.005) unallocated.push({ id: p.id, remaining: rem });
      }

      // Get open items that need payment
      const offene = openItems
        .filter((oi: any) => oi.status !== "bezahlt" && oi.typ !== "gutschrift")
        .sort((a: any, b: any) => new Date(a.datum).getTime() - new Date(b.datum).getTime());

      const newAllocations: { payment_id: string; open_item_id: string; betrag: number }[] = [];
      let uIdx = 0;

      for (const oi of offene) {
        if (uIdx >= unallocated.length) break;
        let oiOffen = Number(oi.betrag_gesamt) - Number(oi.betrag_bezahlt);
        while (oiOffen > 0.005 && uIdx < unallocated.length) {
          const zuordnung = Math.min(oiOffen, unallocated[uIdx].remaining);
          newAllocations.push({ payment_id: unallocated[uIdx].id, open_item_id: oi.id, betrag: zuordnung });
          oiOffen -= zuordnung;
          unallocated[uIdx].remaining -= zuordnung;
          if (unallocated[uIdx].remaining < 0.005) uIdx++;
        }
      }

      if (newAllocations.length > 0) {
        const { error } = await supabase.from("payment_allocations").insert(newAllocations as any);
        if (error) throw error;
      } else {
        throw new Error("Keine offenen Posten zum Verrechnen vorhanden");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment_allocations", id] });
      queryClient.invalidateQueries({ queryKey: ["open_items", id] });
      queryClient.invalidateQueries({ queryKey: ["open_items"] });
      toast({ title: "Guthaben verrechnet", description: "Guthaben wurde auf offene Posten verteilt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  // ── Delete Mutation ──
  const mutDeleteItem = useMutation({
    mutationFn: async (item: { type: string; id: string }) => {
      if (item.type === "fahrstunde") {
        const { error } = await supabase.from("driving_lessons").delete().eq("id", item.id);
        if (error) throw error;
      } else if (item.type === "theorie") {
        const { error } = await supabase.from("theory_sessions").delete().eq("id", item.id);
        if (error) throw error;
      } else if (item.type === "pruefung") {
        const { error } = await supabase.from("exams").delete().eq("id", item.id);
        if (error) throw error;
      } else if (item.type === "leistung") {
        const { error } = await supabase.from("services").delete().eq("id", item.id);
        if (error) throw error;
      } else if (item.type === "zahlung") {
        const { data: allocations } = await supabase
          .from("payment_allocations")
          .select("id, open_item_id, betrag")
          .eq("payment_id", item.id);
        const affectedOpenItemIds = [...new Set((allocations ?? []).map(a => a.open_item_id))];
        if (allocations && allocations.length > 0) {
          const { error: delAllocErr } = await supabase
            .from("payment_allocations")
            .delete()
            .eq("payment_id", item.id);
          if (delAllocErr) throw delAllocErr;
        }
        for (const oiId of affectedOpenItemIds) {
          const { data: remainingAllocs } = await supabase
            .from("payment_allocations")
            .select("betrag")
            .eq("open_item_id", oiId);
          const totalPaid = (remainingAllocs ?? []).reduce((s, a) => s + Number(a.betrag), 0);
          const { data: oiData } = await supabase
            .from("open_items")
            .select("betrag_gesamt")
            .eq("id", oiId)
            .single();
          const gesamt = oiData ? Number(oiData.betrag_gesamt) : 0;
          const newStatus = totalPaid >= gesamt ? "bezahlt" : totalPaid > 0 ? "teilbezahlt" : "offen";
          await supabase
            .from("open_items")
            .update({ betrag_bezahlt: totalPaid, status: newStatus })
            .eq("id", oiId);
        }
        await supabase.from("open_items").delete().eq("typ", "gutschrift").eq("referenz_id", item.id);
        const { error } = await supabase.from("payments").delete().eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driving_lessons", id] });
      queryClient.invalidateQueries({ queryKey: ["driving_lessons"] });
      queryClient.invalidateQueries({ queryKey: ["theory_sessions", id] });
      queryClient.invalidateQueries({ queryKey: ["theory_sessions"] });
      queryClient.invalidateQueries({ queryKey: ["exams", id] });
      queryClient.invalidateQueries({ queryKey: ["exams_all"] });
      queryClient.invalidateQueries({ queryKey: ["services", id] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["payments", id] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment_allocations", id] });
      queryClient.invalidateQueries({ queryKey: ["open_items", id] });
      queryClient.invalidateQueries({ queryKey: ["open_items"] });
      setDeletingItem(null);
      toast({ title: "Eintrag gelöscht" });
    },
    onError: (e: Error) => {
      toast({ title: "Fehler beim Löschen", description: e.message, variant: "destructive" });
      setDeletingItem(null);
    },
  });

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

  const instructorMap = Object.fromEntries(
    instructors.map((i) => [i.id, `${i.vorname} ${i.nachname}`])
  );

  // Unique lesson-based counting
  const completedLektionen = new Set(
    theorySessions
      .filter((s: any) => s.lektion != null)
      .map((s: any) => s.lektion as number)
  );

  // Map lektion -> instructor name for display
  const lektionInstructorMap: Record<number, string> = {};
  for (const s of theorySessions as any[]) {
    if (s.lektion != null && s.instructor_id) {
      lektionInstructorMap[s.lektion] = instructorMap[s.instructor_id] ?? "";
    }
  }
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

  // Guthaben = positive Zahlungen - zugeordnete Beträge
  const positiveZahlungen = payments.filter((p: any) => Number(p.betrag) > 0).reduce((s: number, p: any) => s + Number(p.betrag), 0);
  const summeAllocations = paymentAllocations.reduce((s: number, a: any) => s + Number(a.betrag), 0);
  const guthaben = Math.max(0, positiveZahlungen - summeAllocations);

  const saldoRoh = totalForderungen - totalBezahlt;
  const saldo = Math.max(0, saldoRoh - guthaben);

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
    <>
    <div className="space-y-6 print:hidden">
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

        {/* ── Action buttons ── */}
        <div className="flex items-center gap-2">
          {isArchived ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => mutArchive.mutate(false)}>
              <RotateCcw className="h-4 w-4" />
              Wiederherstellen
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => mutArchive.mutate(true)}>
              <Archive className="h-4 w-4" />
              Archivieren
            </Button>
          )}

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
      </div>

      {/* Archive banner */}
      {isArchived && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3">
          <Archive className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">Dieser Schüler ist archiviert.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => mutArchive.mutate(false)}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Wiederherstellen
          </Button>
        </div>
      )}

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
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kontaktdaten</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setContactForm({
                    vorname: student.vorname || "",
                    nachname: student.nachname || "",
                    fuehrerscheinklasse: student.fuehrerscheinklasse,
                    email: student.email || "",
                    telefon: student.telefon || "",
                    adresse: student.adresse || "",
                    geburtsdatum: (student as any).geburtsdatum ? format(new Date((student as any).geburtsdatum), "dd.MM.yyyy") : "",
                    anmeldedatum: format(new Date(student.created_at), "dd.MM.yyyy"),
                    ist_umschreiber: student.ist_umschreiber,
                    fahrschule: (student as any).fahrschule || "riemke",
                  });
                  setEditingContact(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
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

          <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setDlgPrint(true)}>
            <Printer className="h-4 w-4 mr-2" />
            Übersicht drucken
          </Button>


          <Dialog open={editingContact} onOpenChange={setEditingContact}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kontaktdaten bearbeiten</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Vorname</Label>
                    <Input value={contactForm.vorname} onChange={(e) => setContactForm(f => ({ ...f, vorname: e.target.value }))} placeholder="Vorname" />
                  </div>
                  <div>
                    <Label>Nachname</Label>
                    <Input value={contactForm.nachname} onChange={(e) => setContactForm(f => ({ ...f, nachname: e.target.value }))} placeholder="Nachname" />
                  </div>
                </div>
                <div>
                  <Label>Führerscheinklasse</Label>
                  <Select value={contactForm.fuehrerscheinklasse} onValueChange={(v) => setContactForm(f => ({ ...f, fuehrerscheinklasse: v as "B" | "B78" | "B197" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="B78">B78</SelectItem>
                      <SelectItem value="B197">B197</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>E-Mail</Label>
                  <Input value={contactForm.email} onChange={(e) => setContactForm(f => ({ ...f, email: e.target.value }))} placeholder="E-Mail" />
                </div>
                <div>
                  <Label>Telefon</Label>
                  <Input value={contactForm.telefon} onChange={(e) => setContactForm(f => ({ ...f, telefon: e.target.value }))} placeholder="Telefon" />
                </div>
                <div>
                  <Label>Adresse</Label>
                  <Textarea value={contactForm.adresse} onChange={(e) => setContactForm(f => ({ ...f, adresse: e.target.value }))} placeholder="Adresse" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Geburtsdatum</Label>
                    <Input value={contactForm.geburtsdatum} onChange={(e) => setContactForm(f => ({ ...f, geburtsdatum: e.target.value }))} placeholder="TT.MM.JJJJ" />
                  </div>
                  <div>
                    <Label>Anmeldedatum</Label>
                    <Input value={contactForm.anmeldedatum} onChange={(e) => setContactForm(f => ({ ...f, anmeldedatum: e.target.value }))} placeholder="TT.MM.JJJJ" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Fahrschule</Label>
                    <Select value={contactForm.fahrschule} onValueChange={(v) => setContactForm(f => ({ ...f, fahrschule: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="riemke">Miro-Drive (Riemke Markt)</SelectItem>
                        <SelectItem value="rathaus">Miro-Drive (Rathaus)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={contactForm.ist_umschreiber}
                        onCheckedChange={(checked) => setContactForm(f => ({ ...f, ist_umschreiber: !!checked }))}
                      />
                      <span className="text-sm font-medium">Umschreiber</span>
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="destructive"
                  className="sm:mr-auto"
                  onClick={() => { setEditingContact(false); setDeletingStudent(true); }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Schüler löschen
                </Button>
                <Button variant="outline" onClick={() => setEditingContact(false)}>Abbrechen</Button>
                <Button onClick={() => mutEditContact.mutate()} disabled={mutEditContact.isPending}>
                  {mutEditContact.isPending ? "Speichern…" : "Speichern"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Student AlertDialog */}
          <AlertDialog open={deletingStudent} onOpenChange={setDeletingStudent}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Schüler endgültig löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  <strong>{student.vorname} {student.nachname}</strong> und alle zugehörigen Daten (Fahrstunden, Prüfungen, Zahlungen, Leistungen, Theoriestunden) werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async () => {
                    try {
                      // Delete dependent data first
                      const studentId = id!;
                      // Delete payment allocations for this student's payments
                      const { data: studentPayments } = await supabase.from("payments").select("id").eq("student_id", studentId);
                      if (studentPayments && studentPayments.length > 0) {
                        const paymentIds = studentPayments.map(p => p.id);
                        await supabase.from("payment_allocations").delete().in("payment_id", paymentIds);
                      }
                      // Delete open items
                      await supabase.from("open_items").delete().eq("student_id", studentId);
                      // Delete payments
                      await supabase.from("payments").delete().eq("student_id", studentId);
                      // Delete services
                      await supabase.from("services").delete().eq("student_id", studentId);
                      // Delete driving lessons
                      await supabase.from("driving_lessons").delete().eq("student_id", studentId);
                      // Delete theory sessions
                      await supabase.from("theory_sessions").delete().eq("student_id", studentId);
                      // Delete exams
                      await supabase.from("exams").delete().eq("student_id", studentId);
                      // Delete gear lessons
                      await supabase.from("gear_lessons").delete().eq("student_id", studentId);
                      // Finally delete the student
                      const { error } = await supabase.from("students").delete().eq("id", studentId);
                      if (error) throw error;
                      toast({ title: "Schüler gelöscht", description: `${student.vorname} ${student.nachname} wurde gelöscht.` });
                      navigate("/dashboard/fahrschueler");
                    } catch (e: any) {
                      toast({ title: "Fehler beim Löschen", description: e.message, variant: "destructive" });
                    }
                  }}
                >
                  Endgültig löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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
            {guthaben > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Guthaben (Vorauszahlung)</span>
                <span className="font-medium text-green-600">
                  −{guthaben.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                </span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between text-sm">
              <span className="font-semibold text-foreground">
                {saldo > 0 ? "Offener Saldo" : guthaben > 0 ? "Guthaben" : "Ausgeglichen"}
              </span>
              <span className={`font-bold ${saldo > 0 ? "text-red-600" : "text-green-600"}`}>
                {saldo > 0
                  ? saldo.toLocaleString("de-DE", { style: "currency", currency: "EUR" })
                  : guthaben > 0
                    ? guthaben.toLocaleString("de-DE", { style: "currency", currency: "EUR" })
                    : (0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })
                }
              </span>
            </div>
          </div>

          {/* Guthaben verrechnen Button */}
          {guthaben > 0 && openItems.some((oi: any) => oi.status !== "bezahlt" && oi.typ !== "gutschrift") && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs border-green-500/30 text-green-700 hover:bg-green-500/10"
              onClick={() => mutGuthabenVerrechnen.mutate()}
              disabled={mutGuthabenVerrechnen.isPending}
            >
              {mutGuthabenVerrechnen.isPending ? "Verrechne…" : "Guthaben verrechnen"}
            </Button>
          )}

          {(() => {
            const gutschriften = openItems.filter((oi: any) => oi.typ === "gutschrift");
            if (gutschriften.length === 0) return null;
            return (
              <div className="space-y-2 mt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Gutschriften ({gutschriften.length})
                </p>
                <div className="space-y-1.5">
                  {gutschriften.map((oi: any) => (
                    <div key={oi.id} className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-muted-foreground shrink-0">
                          {format(new Date(oi.datum), "dd.MM.yy")}
                        </span>
                        <span className="text-foreground truncate">{oi.beschreibung}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-medium text-green-600">
                          {Number(oi.betrag_gesamt).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                          Gutschrift
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Offene Posten Liste */}
          {(() => {
            const offene = openItems.filter((oi: any) => oi.status !== "bezahlt" && oi.typ !== "gutschrift");
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

          {/* ── Zahlungen ── */}
          {payments && payments.length > 0 && (() => {
            const sorted = [...payments].sort((a: any, b: any) => new Date(b.datum).getTime() - new Date(a.datum).getTime());
            const zahlungsartLabel: Record<string, string> = { bar: "Bar", ec: "EC", ueberweisung: "Überweisung" };
            return (
              <div className="space-y-2 mt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Zahlungen ({payments.length})
                </p>
                <div className="space-y-1.5">
                  {sorted.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-muted-foreground shrink-0">
                          {format(new Date(p.datum), "dd.MM.yy")}
                        </span>
                        <span className="text-foreground truncate">
                          {zahlungsartLabel[p.zahlungsart] || p.zahlungsart}
                        </span>
                      </div>
                      <span className={`font-medium shrink-0 ${Number(p.betrag) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {Number(p.betrag).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                      </span>
                    </div>
                  ))}
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
                    <TooltipProvider delayDuration={200}>
                    {THEORIE_LEKTIONEN.filter((l) => l.nr <= 12).map((l) => {
                      const done = completedLektionen.has(l.nr);
                      const instrName = lektionInstructorMap[l.nr];
                      const handleEditTheory = () => {
                        if (!done) return;
                        const session = theorySessions.find((s: any) => s.lektion === l.nr);
                        if (session) setEditingTheory({ ...session, datum: new Date(session.datum).toISOString().slice(0, 16), instructor_id: session.instructor_id || "" });
                      };
                      const chip = (
                        <div
                          key={l.nr}
                          className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${
                            done
                              ? "border-green-500/20 bg-green-500/10 text-green-700 cursor-pointer hover:bg-green-500/20"
                              : "border-border bg-muted/30 text-muted-foreground"
                          }`}
                          onClick={handleEditTheory}
                        >
                          {done ? <Check className="h-3 w-3" /> : <span className="h-3 w-3" />}
                          L{l.nr}
                        </div>
                      );
                      if (done && instrName) {
                        return (
                          <Tooltip key={l.nr}>
                            <TooltipTrigger asChild>{chip}</TooltipTrigger>
                            <TooltipContent><p>{instrName} · Klicken zum Bearbeiten</p></TooltipContent>
                          </Tooltip>
                        );
                      }
                      return chip;
                    })}
                    </TooltipProvider>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Klassenspezifisch (Lektion 13–14)</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                    <TooltipProvider delayDuration={200}>
                    {THEORIE_LEKTIONEN.filter((l) => l.nr >= 13).map((l) => {
                      const done = completedLektionen.has(l.nr);
                      const instrName = lektionInstructorMap[l.nr];
                      const handleEditTheory = () => {
                        if (!done) return;
                        const session = theorySessions.find((s: any) => s.lektion === l.nr);
                        if (session) setEditingTheory({ ...session, datum: new Date(session.datum).toISOString().slice(0, 16), instructor_id: session.instructor_id || "" });
                      };
                      const chip = (
                        <div
                          key={l.nr}
                          className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${
                            done
                              ? "border-green-500/20 bg-green-500/10 text-green-700 cursor-pointer hover:bg-green-500/20"
                              : "border-border bg-muted/30 text-muted-foreground"
                          }`}
                          onClick={handleEditTheory}
                        >
                          {done ? <Check className="h-3 w-3" /> : <span className="h-3 w-3" />}
                          L{l.nr}
                        </div>
                      );
                      if (done && instrName) {
                        return (
                          <Tooltip key={l.nr}>
                            <TooltipTrigger asChild>{chip}</TooltipTrigger>
                            <TooltipContent><p>{instrName} · Klicken zum Bearbeiten</p></TooltipContent>
                          </Tooltip>
                        );
                      }
                      return chip;
                    })}
                    </TooltipProvider>
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
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPrintSection("pruefungen")} title="Prüfungen drucken">
                  <Printer className="h-4 w-4" />
                </Button>
                <SectionAddBtn label="+ Prüfung eintragen" onClick={() => setDlgPruefung(true)} />
              </div>
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
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingExam({
                        ...exam,
                        datum: new Date(exam.datum).toISOString().slice(0, 10),
                        preis: String(exam.preis),
                        instructor_id: exam.instructor_id || "",
                      })}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setDeletingItem({ type: "pruefung", id: exam.id, label: `${isTheorie ? "Theorieprüfung" : "Fahrprüfung"} vom ${format(new Date(exam.datum), "dd.MM.yyyy")}` })}> 
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <div className="flex items-center gap-2 shrink-0">
                        {editingExamStatusId === exam.id ? (
                          <Select
                            value={exam.status}
                            onValueChange={(v) => mutExamStatus.mutate({ examId: exam.id, status: v })}
                            onOpenChange={(open) => { if (!open) setEditingExamStatusId(null); }}
                            defaultOpen
                          >
                            <SelectTrigger className="h-7 w-[150px] text-xs">
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
                            type="button"
                            className="cursor-pointer"
                            onClick={() => setEditingExamStatusId(exam.id)}
                          >
                            {exam.status === "bestanden" ? (
                              <span className="inline-flex items-center gap-1 rounded-md border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-700">
                                <CheckCircle2 className="h-3 w-3" /> Bestanden
                              </span>
                            ) : exam.status === "nicht_bestanden" ? (
                              <span className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                                <XCircle className="h-3 w-3" /> Nicht bestanden
                              </span>
                            ) : exam.status === "krank" ? (
                              <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                <AlertTriangle className="h-3 w-3" /> Krank
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                <Calendar className="h-3 w-3" /> Angemeldet
                              </span>
                            )}
                          </button>
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
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="icon" className="h-7 w-7 border-border text-muted-foreground hover:text-foreground" onClick={() => setPrintSection("fahrstunden")} title="Als PDF drucken">
                  <Printer className="h-3.5 w-3.5" />
                </Button>
                <SectionAddBtn label="+ Fahrstunde hinzufügen" onClick={() => setDlgFahrstunde(true)} />
              </div>
            </div>
            {lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Fahrstunden eingetragen.</p>
            ) : (
              <div className="space-y-0 divide-y divide-border/50">
                {lessons.slice(0, visibleLessons).map((lesson) => (
                  <div key={lesson.id} className="flex items-center gap-4 py-2.5 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {TYP_LABELS[lesson.typ] ?? lesson.typ}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(lesson.datum), "dd.MM.yyyy HH:mm", { locale: de })} · {lesson.dauer_minuten} min · {FAHRZEUG_LABELS[lesson.fahrzeug_typ] ?? lesson.fahrzeug_typ}
                        {(lesson as any).instructor_id && instructors.length > 0 && (() => {
                          const instr = instructors.find((i) => i.id === (lesson as any).instructor_id);
                          return instr ? ` · ${instr.vorname} ${instr.nachname}` : "";
                        })()}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingLesson({
                      ...lesson,
                      datum: new Date(lesson.datum).toISOString().slice(0, 16),
                    })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setDeletingItem({ type: "fahrstunde", id: lesson.id, label: `${TYP_LABELS[lesson.typ] ?? lesson.typ} vom ${format(new Date(lesson.datum), "dd.MM.yyyy")}` })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-sm font-semibold text-foreground shrink-0">
                      {Number(lesson.preis).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                    </span>
                  </div>
                ))}
                {(lessons.length > visibleLessons || visibleLessons > 10) && (
                  <div className="pt-3 flex flex-col gap-1">
                    {lessons.length > visibleLessons && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground"
                        onClick={() => setVisibleLessons((c) => c + 10)}
                      >
                        Weitere {Math.min(10, lessons.length - visibleLessons)} von {lessons.length - visibleLessons} anzeigen
                      </Button>
                    )}
                    {visibleLessons > 10 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground"
                        onClick={() => setVisibleLessons(10)}
                      >
                        Weniger anzeigen
                      </Button>
                    )}
                  </div>
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
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="icon" className="h-7 w-7 border-border text-muted-foreground hover:text-foreground" onClick={() => setPrintSection("leistungen")} title="Als PDF drucken">
                  <Printer className="h-3.5 w-3.5" />
                </Button>
                <SectionAddBtn label="+ Leistung hinzufügen" onClick={() => setDlgLeistung(true)} />
              </div>
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
                          {format(new Date((service as any).datum || service.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingService({
                        ...service,
                        preis: String(service.preis),
                        datum: new Date((service as any).datum || service.created_at).toISOString().slice(0, 16),
                      })}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setDeletingItem({ type: "leistung", id: service.id, label: `${service.bezeichnung}` })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="icon" className="h-7 w-7 border-border text-muted-foreground hover:text-foreground" onClick={() => setPrintSection("zahlungen")} title="Als PDF drucken">
                  <Printer className="h-3.5 w-3.5" />
                </Button>
                <SectionAddBtn label="+ Zahlung hinzufügen" onClick={() => setDlgZahlung(true)} />
              </div>
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
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingPayment({
                      ...payment,
                      betrag: String(Math.abs(Number(payment.betrag))),
                      datum: new Date(payment.datum).toISOString().slice(0, 10),
                    })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setDeletingItem({ type: "zahlung", id: payment.id, label: `${Number(payment.betrag).toLocaleString("de-DE", { style: "currency", currency: "EUR" })} vom ${format(new Date(payment.datum), "dd.MM.yyyy")}` })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
              <Select value={fsFahrstunde.typ} onValueChange={(v) => {
                const newTyp = v as DrivingLessonTyp;
                setFsFahrstunde((f) => ({ ...f, typ: newTyp, dauer_minuten: newTyp === "fehlstunde" ? 0 : (f.dauer_minuten === 0 ? 45 : f.dauer_minuten), fehlstundePreis: newTyp === "fehlstunde" ? f.fehlstundePreis : "40" }));
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYP_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fahrlehrer</Label>
              <Select value={fsFahrstunde.instructor_id} onValueChange={(v) => setFsFahrstunde((f) => ({ ...f, instructor_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Fahrlehrer wählen…" /></SelectTrigger>
                <SelectContent>
                  {instructors.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.nachname}, {i.vorname}</SelectItem>
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
            {fsFahrstunde.typ !== "fehlstunde" && (
            <div className="space-y-1.5">
              <Label>Dauer (Minuten)</Label>
              <div className="flex gap-2">
                {DAUER_OPTIONS.map((d) => (
                  <Button key={d} type="button" variant={fsFahrstunde.dauer_minuten === d ? "default" : "outline"} size="sm" onClick={() => setFsFahrstunde((f) => ({ ...f, dauer_minuten: d }))}>
                    {d} min
                  </Button>
                ))}
                <Input type="number" min={0} step={15} className="w-24" value={fsFahrstunde.dauer_minuten} onChange={(e) => setFsFahrstunde((f) => ({ ...f, dauer_minuten: parseInt(e.target.value) || 45 }))} />
              </div>
            </div>
            )}
            {fsFahrstunde.typ === "fehlstunde" && (
            <div className="space-y-1.5">
              <Label>Preis (EUR)</Label>
              <Input type="number" min={0} step={1} value={fsFahrstunde.fehlstundePreis} onChange={(e) => setFsFahrstunde((f) => ({ ...f, fehlstundePreis: e.target.value }))} className="w-32" />
            </div>
            )}
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Berechneter Preis</span>
              <span className="font-semibold text-foreground text-lg">{fsFahrstunde.typ === "fehlstunde" ? `${(parseFloat(fsFahrstunde.fehlstundePreis) || 40).toFixed(2)} €` : `${previewPrice.toFixed(2)} €`}</span>
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
              <Label>Fahrlehrer</Label>
              <Select value={fsTheorie.instructor_id} onValueChange={(v) => setFsTheorie((f) => ({ ...f, instructor_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Fahrlehrer wählen" /></SelectTrigger>
                <SelectContent>
                  {instructors.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.vorname} {i.nachname}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
      <Dialog open={dlgPruefung} onOpenChange={(v) => { setDlgPruefung(v); if (!v) setFsPruefung({ typ: "theorie", fahrzeug_typ: "automatik", instructor_id: "", datum: new Date().toISOString().slice(0, 10), status: "angemeldet", preis: "0" }); }}>
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
              <Label>Status</Label>
              <Select value={fsPruefung.status} onValueChange={(v) => setFsPruefung((f) => ({ ...f, status: v as "angemeldet" | "bestanden" | "nicht_bestanden" | "krank" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
      <Dialog open={dlgLeistung} onOpenChange={(v) => { setDlgLeistung(v); if (!v) setFsLeistung({ preis_id: "", bezeichnung: "", preis: "", datum: new Date().toISOString().slice(0, 16), status: "offen" }); }}>
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
              <Label>Datum & Uhrzeit</Label>
              <Input type="datetime-local" value={fsLeistung.datum} onChange={(e) => setFsLeistung((f) => ({ ...f, datum: e.target.value }))} />
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
      <Dialog open={dlgZahlung} onOpenChange={(v) => { setDlgZahlung(v); if (!v) setFsZahlung({ betrag: "", zahlungsart: "bar", datum: new Date().toISOString().slice(0, 10), einreichungsdatum: new Date().toISOString().slice(0, 10), selectedOpenItems: [], istGutschrift: false, gutschriftNotiz: "" }); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{fsZahlung.istGutschrift ? "Gutschrift erfassen" : "Zahlung erfassen"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={fsZahlung.istGutschrift}
                onCheckedChange={(c) => setFsZahlung((f) => ({ ...f, istGutschrift: !!c, selectedOpenItems: [] }))}
              />
              <span className="text-sm font-medium text-foreground">Gutschrift</span>
            </label>
            <div className="space-y-1.5">
              <Label>Datum</Label>
              <Input type="date" value={fsZahlung.datum} onChange={(e) => setFsZahlung((f) => ({ ...f, datum: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Einreichungsdatum (Büro)</Label>
              <Input type="date" value={fsZahlung.einreichungsdatum} onChange={(e) => setFsZahlung((f) => ({ ...f, einreichungsdatum: e.target.value }))} />
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

            {fsZahlung.istGutschrift && (
              <div className="space-y-1.5">
                <Label>Notiz (optional)</Label>
                <Textarea
                  placeholder="Grund für die Gutschrift…"
                  value={fsZahlung.gutschriftNotiz}
                  onChange={(e) => setFsZahlung((f) => ({ ...f, gutschriftNotiz: e.target.value }))}
                  className="min-h-[60px]"
                />
              </div>
            )}

            {/* Offene Posten */}
            {!fsZahlung.istGutschrift && (() => {
              const offenePosten = openItems.filter((oi: any) => oi.status !== "bezahlt" && Number(oi.betrag_gesamt) > 0);
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

      {/* ═══════════════════════════════════════════════════════════════════════
          EDIT MODALS
         ═══════════════════════════════════════════════════════════════════════ */}

      {/* ── Edit: Fahrstunde ── */}
      <Dialog open={!!editingLesson} onOpenChange={(v) => { if (!v) setEditingLesson(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fahrstunde bearbeiten</DialogTitle>
          </DialogHeader>
          {editingLesson && (
            <form onSubmit={(e) => { e.preventDefault(); mutEditFahrstunde.mutate(editingLesson); }} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Typ</Label>
                <Select value={editingLesson.typ} onValueChange={(v) => setEditingLesson((prev: any) => ({ ...prev, typ: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYP_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fahrlehrer</Label>
                <Select value={editingLesson.instructor_id || ""} onValueChange={(v) => setEditingLesson((prev: any) => ({ ...prev, instructor_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Fahrlehrer wählen…" /></SelectTrigger>
                  <SelectContent>
                    {instructors.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.nachname}, {i.vorname}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fahrzeugtyp</Label>
                <Select value={editingLesson.fahrzeug_typ} onValueChange={(v) => setEditingLesson((prev: any) => ({ ...prev, fahrzeug_typ: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatik">Automatik</SelectItem>
                    <SelectItem value="schaltwagen">Schaltwagen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Datum & Uhrzeit</Label>
                <Input type="datetime-local" value={editingLesson.datum} onChange={(e) => setEditingLesson((prev: any) => ({ ...prev, datum: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Dauer (Minuten)</Label>
                <div className="flex gap-2">
                  {DAUER_OPTIONS.map((d) => (
                    <Button key={d} type="button" variant={editingLesson.dauer_minuten === d ? "default" : "outline"} size="sm" onClick={() => setEditingLesson((prev: any) => ({ ...prev, dauer_minuten: d }))}>
                      {d} min
                    </Button>
                  ))}
                  <Input type="number" min={0} step={15} className="w-24" value={editingLesson.dauer_minuten} onChange={(e) => setEditingLesson((prev: any) => ({ ...prev, dauer_minuten: parseInt(e.target.value) || 45 }))} />
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Berechneter Preis</span>
                <span className="font-semibold text-foreground text-lg">{calculatePrice(editingLesson.dauer_minuten).toFixed(2)} €</span>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setEditingLesson(null)}>Abbrechen</Button>
                <Button type="submit" disabled={mutEditFahrstunde.isPending}>{mutEditFahrstunde.isPending ? "Speichern…" : "Speichern"}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit: Theorie ── */}
      <Dialog open={!!editingTheory} onOpenChange={(v) => { if (!v) setEditingTheory(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Theoriestunde bearbeiten</DialogTitle>
          </DialogHeader>
          {editingTheory && (
            <form onSubmit={(e) => { e.preventDefault(); mutEditTheorie.mutate(editingTheory); }} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Theorielektion</Label>
                <Select value={String(editingTheory.lektion ?? 1)} onValueChange={(v) => setEditingTheory((prev: any) => ({ ...prev, lektion: parseInt(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {THEORIE_LEKTIONEN.map((l) => (
                      <SelectItem key={l.nr} value={String(l.nr)}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fahrlehrer</Label>
                <Select value={editingTheory.instructor_id || ""} onValueChange={(v) => setEditingTheory((prev: any) => ({ ...prev, instructor_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Fahrlehrer wählen" /></SelectTrigger>
                  <SelectContent>
                    {instructors.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.vorname} {i.nachname}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Datum & Uhrzeit</Label>
                <Input type="datetime-local" value={editingTheory.datum} onChange={(e) => setEditingTheory((prev: any) => ({ ...prev, datum: e.target.value }))} />
              </div>
              <div className="flex justify-between pt-1">
                <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                  const session = editingTheory;
                  setEditingTheory(null);
                  setDeletingItem({ type: "theorie", id: session.id, label: `Theorielektion ${session.lektion ?? ""}` });
                }}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Löschen
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditingTheory(null)}>Abbrechen</Button>
                  <Button type="submit" disabled={mutEditTheorie.isPending}>{mutEditTheorie.isPending ? "Speichern…" : "Speichern"}</Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit: Prüfung ── */}
      <Dialog open={!!editingExam} onOpenChange={(v) => { if (!v) setEditingExam(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Prüfung bearbeiten</DialogTitle>
          </DialogHeader>
          {editingExam && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Prüfungstyp</Label>
                <Select value={editingExam.typ} onValueChange={(v) => setEditingExam((prev: any) => ({ ...prev, typ: v, instructor_id: v === "theorie" ? "" : prev.instructor_id }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theorie">Theorieprüfung</SelectItem>
                    <SelectItem value="praxis">Fahrprüfung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingExam.typ === "praxis" && (
                <div className="space-y-1.5">
                  <Label>Fahrlehrer</Label>
                  <Select value={editingExam.instructor_id || ""} onValueChange={(v) => setEditingExam((prev: any) => ({ ...prev, instructor_id: v }))}>
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
                <Select value={editingExam.fahrzeug_typ} onValueChange={(v) => setEditingExam((prev: any) => ({ ...prev, fahrzeug_typ: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatik">Automatik</SelectItem>
                    <SelectItem value="schaltwagen">Schaltwagen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Datum</Label>
                <Input type="date" value={editingExam.datum} onChange={(e) => setEditingExam((prev: any) => ({ ...prev, datum: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editingExam.status} onValueChange={(v) => setEditingExam((prev: any) => ({ ...prev, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Input type="number" step="0.01" min="0" value={editingExam.preis} onChange={(e) => setEditingExam((prev: any) => ({ ...prev, preis: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingExam(null)}>Abbrechen</Button>
                <Button disabled={mutEditPruefung.isPending} onClick={() => mutEditPruefung.mutate(editingExam)}>
                  {mutEditPruefung.isPending ? "Speichern…" : "Speichern"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit: Leistung ── */}
      <Dialog open={!!editingService} onOpenChange={(v) => { if (!v) setEditingService(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Leistung bearbeiten</DialogTitle>
          </DialogHeader>
          {editingService && (
            <form onSubmit={(e) => { e.preventDefault(); mutEditLeistung.mutate(editingService); }} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Bezeichnung *</Label>
                <Input value={editingService.bezeichnung} onChange={(e) => setEditingService((prev: any) => ({ ...prev, bezeichnung: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Preis (€)</Label>
                <Input type="number" step="0.01" min="0" value={editingService.preis} onChange={(e) => setEditingService((prev: any) => ({ ...prev, preis: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Datum & Uhrzeit</Label>
                <Input type="datetime-local" value={editingService.datum || ""} onChange={(e) => setEditingService((prev: any) => ({ ...prev, datum: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editingService.status} onValueChange={(v) => setEditingService((prev: any) => ({ ...prev, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offen">Offen</SelectItem>
                    <SelectItem value="bezahlt">Bezahlt</SelectItem>
                    <SelectItem value="erledigt">Erledigt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingService(null)}>Abbrechen</Button>
                <Button type="submit" disabled={mutEditLeistung.isPending}>{mutEditLeistung.isPending ? "Speichern…" : "Speichern"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit: Zahlung ── */}
      <Dialog open={!!editingPayment} onOpenChange={(v) => { if (!v) setEditingPayment(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Zahlung bearbeiten</DialogTitle>
          </DialogHeader>
          {editingPayment && (
            <form onSubmit={(e) => { e.preventDefault(); mutEditZahlung.mutate(editingPayment); }} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Datum</Label>
                <Input type="date" value={editingPayment.datum} onChange={(e) => setEditingPayment((prev: any) => ({ ...prev, datum: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Zahlungsart</Label>
                <Select value={editingPayment.zahlungsart} onValueChange={(v) => setEditingPayment((prev: any) => ({ ...prev, zahlungsart: v }))}>
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
                <Input type="number" step="0.01" min="0" value={editingPayment.betrag} onChange={(e) => setEditingPayment((prev: any) => ({ ...prev, betrag: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setEditingPayment(null)}>Abbrechen</Button>
                <Button type="submit" disabled={mutEditZahlung.isPending}>{mutEditZahlung.isPending ? "Speichern…" : "Speichern"}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => { if (!open) setDeletingItem(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              „{deletingItem?.label}" wird unwiderruflich gelöscht. Alle zugehörigen offenen Posten und Zahlungszuordnungen werden ebenfalls entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingItem) mutDeleteItem.mutate({ type: deletingItem.type, id: deletingItem.id });
              }}
              disabled={mutDeleteItem.isPending}
            >
              {mutDeleteItem.isPending ? "Lösche…" : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

      {/* ===== PRINT AREA ===== */}
      {printSection && (
        <div className="print-area hidden print:block">
          <div className="mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold">
              Fahrschulverwaltung – {printSection === "fahrstunden" ? "Fahrstunden" : printSection === "leistungen" ? "Leistungen" : printSection === "pruefungen" ? "Prüfungen" : "Zahlungen"}
            </h1>
            <p className="text-lg mt-1">
              Schüler: {student.nachname}, {student.vorname} (Klasse {student.fuehrerscheinklasse})
            </p>
            <p className="text-sm mt-1">
              Datum: {format(new Date(), "dd.MM.yyyy", { locale: de })}
            </p>
          </div>

          {printSection === "fahrstunden" && (
            <>
              <table className="w-full text-sm border-collapse mb-6">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Datum</th>
                    <th className="text-left py-1">Typ</th>
                    <th className="text-left py-1">Dauer</th>
                    <th className="text-left py-1">Fahrlehrer</th>
                    <th className="text-right py-1">Preis</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((l) => {
                    const instr = instructors.find((i) => i.id === (l as any).instructor_id);
                    return (
                      <tr key={l.id} className="border-b">
                        <td className="py-1">{format(new Date(l.datum), "dd.MM.yyyy")}</td>
                        <td className="py-1">{TYP_LABELS[l.typ] ?? l.typ}</td>
                        <td className="py-1">{l.dauer_minuten} min</td>
                        <td className="py-1">{instr ? `${instr.vorname} ${instr.nachname}` : "–"}</td>
                        <td className="py-1 text-right">{Number(l.preis).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-base font-bold">
                Gesamt: {lessons.reduce((s, l) => s + Number(l.preis), 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
              </p>
            </>
          )}

          {printSection === "leistungen" && (
            <>
              <table className="w-full text-sm border-collapse mb-6">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Datum</th>
                    <th className="text-left py-1">Bezeichnung</th>
                    <th className="text-left py-1">Status</th>
                    <th className="text-right py-1">Preis</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="py-1">{format(new Date((s as any).datum || s.created_at), "dd.MM.yyyy")}</td>
                      <td className="py-1">{s.bezeichnung}</td>
                      <td className="py-1">{(SERVICE_STATUS_LABELS[s.status] ?? { label: s.status }).label}</td>
                      <td className="py-1 text-right">{Number(s.preis).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-base font-bold">
                Gesamt: {services.reduce((s, sv) => s + Number(sv.preis), 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
              </p>
            </>
          )}

          {printSection === "zahlungen" && (
            <>
              <table className="w-full text-sm border-collapse mb-6">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Datum</th>
                    <th className="text-left py-1">Zahlungsart</th>
                    <th className="text-right py-1">Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="py-1">{format(new Date(p.datum), "dd.MM.yyyy")}</td>
                      <td className="py-1">{p.zahlungsart === "bar" ? "Bar" : p.zahlungsart === "ec" ? "EC-Karte" : "Überweisung"}</td>
                      <td className="py-1 text-right">{Number(p.betrag).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-base font-bold">
                Gesamt: {payments.reduce((s, p) => s + Number(p.betrag), 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
              </p>
            </>
          )}

          {printSection === "pruefungen" && (
            <>
              <table className="w-full text-sm border-collapse mb-6">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Datum</th>
                    <th className="text-left py-1">Typ</th>
                    <th className="text-left py-1">Ergebnis</th>
                    <th className="text-right py-1">Preis</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((e: any) => (
                    <tr key={e.id} className="border-b">
                      <td className="py-1">{format(new Date(e.datum), "dd.MM.yyyy")}</td>
                      <td className="py-1">{e.typ === "theorie" ? "Theorie" : "Praxis"}</td>
                      <td className="py-1">{e.status === "bestanden" ? "Bestanden" : "Nicht bestanden"}</td>
                      <td className="py-1 text-right">{Number(e.preis).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-base font-bold">
                Gesamt: {exams.reduce((s: number, e: any) => s + Number(e.preis), 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Print Selection Dialog ── */}
      <Dialog open={dlgPrint} onOpenChange={(v) => { setDlgPrint(v); if (v) setDlgPrintSel([]); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Übersicht drucken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="print-all"
                checked={["fahrstunden", "pruefungen", "leistungen", "zahlungen"].every(k => dlgPrintSel.includes(k))}
                onCheckedChange={() => {
                  const allKeys = ["fahrstunden", "pruefungen", "leistungen", "zahlungen"];
                  setDlgPrintSel(allKeys.every(k => dlgPrintSel.includes(k)) ? [] : [...allKeys]);
                }}
              />
              <label htmlFor="print-all" className="text-sm font-medium cursor-pointer">Alle auswählen</label>
            </div>
            <div className="space-y-2 ml-2">
              {([["fahrstunden", "Fahrstunden"], ["pruefungen", "Prüfungen"], ["leistungen", "Leistungen"], ["zahlungen", "Zahlungen"]] as const).map(([k, label]) => (
                <div key={k} className="flex items-center gap-2">
                  <Checkbox
                    id={`print-${k}`}
                    checked={dlgPrintSel.includes(k)}
                    onCheckedChange={(checked) => setDlgPrintSel(prev => checked ? [...prev, k] : prev.filter(x => x !== k))}
                  />
                  <label htmlFor={`print-${k}`} className="text-sm cursor-pointer">{label}</label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDlgPrint(false)}>Abbrechen</Button>
              <Button
                disabled={dlgPrintSel.length === 0}
                onClick={() => {
                  setPrintSections([...dlgPrintSel]);
                  setDlgPrint(false);
                }}
              >
                Drucken
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== MULTI-PRINT AREA ===== */}
      {printSections.length > 0 && (
        <div className="print-area hidden print:block">
          <div className="mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold">Fahrschulverwaltung – Übersicht</h1>
            <p className="text-lg mt-1">
              Schüler: {student.nachname}, {student.vorname} (Klasse {student.fuehrerscheinklasse})
            </p>
            <p className="text-sm mt-1">
              Datum: {format(new Date(), "dd.MM.yyyy", { locale: de })}
            </p>
          </div>

          {printSections.includes("fahrstunden") && (
            <div className="mb-8" style={{ pageBreakInside: "avoid" }}>
              <h2 className="text-lg font-bold mb-2 border-b pb-1">Fahrstunden</h2>
              <table className="w-full text-sm border-collapse mb-2">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Datum</th>
                    <th className="text-left py-1">Typ</th>
                    <th className="text-left py-1">Dauer</th>
                    <th className="text-left py-1">Fahrlehrer</th>
                    <th className="text-right py-1">Preis</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((l) => {
                    const instr = instructors.find((i) => i.id === (l as any).instructor_id);
                    return (
                      <tr key={l.id} className="border-b">
                        <td className="py-1">{format(new Date(l.datum), "dd.MM.yyyy")}</td>
                        <td className="py-1">{TYP_LABELS[l.typ] ?? l.typ}</td>
                        <td className="py-1">{l.dauer_minuten} min</td>
                        <td className="py-1">{instr ? `${instr.vorname} ${instr.nachname}` : "–"}</td>
                        <td className="py-1 text-right">{Number(l.preis).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-sm font-bold">
                Gesamt: {lessons.reduce((s, l) => s + Number(l.preis), 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
              </p>
            </div>
          )}

          {printSections.includes("pruefungen") && (
            <div className="mb-8" style={{ pageBreakInside: "avoid" }}>
              <h2 className="text-lg font-bold mb-2 border-b pb-1">Prüfungen</h2>
              <table className="w-full text-sm border-collapse mb-2">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Datum</th>
                    <th className="text-left py-1">Typ</th>
                    <th className="text-left py-1">Ergebnis</th>
                    <th className="text-right py-1">Preis</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((e: any) => (
                    <tr key={e.id} className="border-b">
                      <td className="py-1">{format(new Date(e.datum), "dd.MM.yyyy")}</td>
                      <td className="py-1">{e.typ === "theorie" ? "Theorie" : "Praxis"}</td>
                      <td className="py-1">{e.status === "bestanden" ? "Bestanden" : "Nicht bestanden"}</td>
                      <td className="py-1 text-right">{Number(e.preis).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-sm font-bold">
                Gesamt: {exams.reduce((s: number, e: any) => s + Number(e.preis), 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
              </p>
            </div>
          )}

          {printSections.includes("leistungen") && (
            <div className="mb-8" style={{ pageBreakInside: "avoid" }}>
              <h2 className="text-lg font-bold mb-2 border-b pb-1">Leistungen</h2>
              <table className="w-full text-sm border-collapse mb-2">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Datum</th>
                    <th className="text-left py-1">Bezeichnung</th>
                    <th className="text-left py-1">Status</th>
                    <th className="text-right py-1">Preis</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="py-1">{format(new Date((s as any).datum || s.created_at), "dd.MM.yyyy")}</td>
                      <td className="py-1">{s.bezeichnung}</td>
                      <td className="py-1">{(SERVICE_STATUS_LABELS[s.status] ?? { label: s.status }).label}</td>
                      <td className="py-1 text-right">{Number(s.preis).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-sm font-bold">
                Gesamt: {services.reduce((s, sv) => s + Number(sv.preis), 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
              </p>
            </div>
          )}

          {printSections.includes("zahlungen") && (
            <div className="mb-8" style={{ pageBreakInside: "avoid" }}>
              <h2 className="text-lg font-bold mb-2 border-b pb-1">Zahlungen</h2>
              <table className="w-full text-sm border-collapse mb-2">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Datum</th>
                    <th className="text-left py-1">Zahlungsart</th>
                    <th className="text-right py-1">Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="py-1">{format(new Date(p.datum), "dd.MM.yyyy")}</td>
                      <td className="py-1">{p.zahlungsart === "bar" ? "Bar" : p.zahlungsart === "ec" ? "EC-Karte" : "Überweisung"}</td>
                      <td className="py-1 text-right">{Number(p.betrag).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-sm font-bold">
                Gesamt: {payments.reduce((s, p) => s + Number(p.betrag), 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FahrschuelerDetail;
