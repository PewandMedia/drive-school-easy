import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, CheckCircle2, Car, BookOpen, Settings, GraduationCap, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";

// ── Constants ────────────────────────────────────────────────────────────────
const PFLICHT: Record<string, number> = { ueberland: 5, autobahn: 4, nacht: 3 };

const THEORIE_PFLICHT: Record<string, number> = { grundstoff: 12, klassenspezifisch: 2 };
const THEORIE_LABELS: Record<string, string> = {
  grundstoff: "Grundstoff",
  klassenspezifisch: "Klassenspezifisch",
};

const SCHALTSTUNDEN_PFLICHT = 10; // Stunden in Minuten × Einheiten egal – hier Einträge

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
  B: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  B78: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  B197: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};

const SERVICE_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  offen: { label: "Offen", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  bezahlt: { label: "Bezahlt", cls: "bg-green-500/15 text-green-400 border-green-500/30" },
  erledigt: { label: "Erledigt", cls: "bg-muted text-muted-foreground border-border" },
};

// ── Component ─────────────────────────────────────────────────────────────────
const FahrschuelerDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: lessons = [], isLoading: loadingLessons } = useQuery({
    queryKey: ["driving_lessons", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("driving_lessons")
        .select("*")
        .eq("student_id", id!)
        .order("datum", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ["services", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("student_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: theorySessions = [], isLoading: loadingTheory } = useQuery({
    queryKey: ["theory_sessions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("theory_sessions")
        .select("*")
        .eq("student_id", id!)
        .order("datum", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: gearLessons = [], isLoading: loadingGear } = useQuery({
    queryKey: ["gear_lessons", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gear_lessons")
        .select("*")
        .eq("student_id", id!)
        .order("datum", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: exams = [], isLoading: loadingExams } = useQuery({
    queryKey: ["exams", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("student_id", id!)
        .order("datum", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // ── Derived data ────────────────────────────────────────────────────────────
  const isLoading = loadingStudent || loadingLessons || loadingServices || loadingTheory || loadingGear || loadingExams;

  const initials = student
    ? `${student.vorname[0]}${student.nachname[0]}`.toUpperCase()
    : "??";

  const sonderCounts = {
    ueberland: lessons.filter((l) => l.typ === "ueberland").length,
    autobahn: lessons.filter((l) => l.typ === "autobahn").length,
    nacht: lessons.filter((l) => l.typ === "nacht").length,
  };

  const allSonderComplete =
    !student?.ist_umschreiber &&
    sonderCounts.ueberland >= PFLICHT.ueberland &&
    sonderCounts.autobahn >= PFLICHT.autobahn &&
    sonderCounts.nacht >= PFLICHT.nacht;

  const theoryCounts = {
    grundstoff: theorySessions.filter((s) => s.typ === "grundstoff").length,
    klassenspezifisch: theorySessions.filter((s) => s.typ === "klassenspezifisch").length,
  };

  const allTheorieComplete =
    theoryCounts.grundstoff >= THEORIE_PFLICHT.grundstoff &&
    theoryCounts.klassenspezifisch >= THEORIE_PFLICHT.klassenspezifisch;

  const isB197 = student?.fuehrerscheinklasse === "B197";
  const gearMinutesTotal = gearLessons.reduce((sum, g) => sum + Number(g.dauer_minuten), 0);
  const gearHoursDone = Math.floor(gearMinutesTotal / 45); // 1 Einheit = 45 min
  const gearHoursRequired = SCHALTSTUNDEN_PFLICHT;
  const gearPct = Math.min(100, Math.round((gearHoursDone / gearHoursRequired) * 100));
  const gearComplete = gearHoursDone >= gearHoursRequired;

  const totalLessonsPrice = lessons.reduce((sum, l) => sum + Number(l.preis), 0);
  const totalServicesOpen = services
    .filter((s) => s.status === "offen")
    .reduce((sum, s) => sum + Number(s.preis), 0);

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
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${KLASSE_COLORS[student.fuehrerscheinklasse]}`}
                >
                  Klasse {student.fuehrerscheinklasse}
                </span>
                {student.ist_umschreiber && (
                  <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 text-xs">
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
          </div>

          {(!student.email && !student.telefon && !student.adresse) && (
            <p className="text-xs text-muted-foreground text-center">Keine Kontaktdaten hinterlegt.</p>
          )}

          <div className="border-t border-border" />

          {/* Saldo Übersicht */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Übersicht</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fahrstunden ({lessons.length})</span>
              <span className="font-medium text-foreground">
                {totalLessonsPrice.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Offene Leistungen</span>
              <span className={`font-medium ${totalServicesOpen > 0 ? "text-amber-400" : "text-foreground"}`}>
                {totalServicesOpen.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
              </span>
            </div>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* ── Sonderfahrten Fortschritt ── */}
          {student.ist_umschreiber ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-amber-400" />
                <span className="font-semibold text-foreground">Sonderfahrten</span>
                <Badge className="ml-auto bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 text-xs">
                  Umschreiber – keine Sonderfahrten erforderlich
                </Badge>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-semibold text-foreground">Sonderfahrten</h2>
                </div>
                {allSonderComplete && (
                  <div className="flex items-center gap-1.5 text-sm text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Alle Pflichtfahrten absolviert</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
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
                          <span className={completed ? "text-green-400 font-semibold" : "text-muted-foreground"}>
                            {done} / {required}
                          </span>
                          {completed && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                        </div>
                      </div>
                      {/* Custom progress bar with conditional color */}
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
              {allTheorieComplete && (
                <div className="flex items-center gap-1.5 text-sm text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Pflicht erfüllt</span>
                </div>
              )}
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
                        <span className={completed ? "text-green-400 font-semibold" : "text-muted-foreground"}>
                          {done} / {required}
                        </span>
                        {completed && <CheckCircle2 className="h-4 w-4 text-green-400" />}
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
            </div>
          </div>

          {/* ── Schaltstunden (B197 only) ── */}
          {isB197 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-semibold text-foreground">Schaltstunden</h2>
                </div>
                {gearComplete && (
                  <div className="flex items-center gap-1.5 text-sm text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Pflicht erfüllt</span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">Schaltstunden absolviert</span>
                  <div className="flex items-center gap-2">
                    <span className={gearComplete ? "text-green-400 font-semibold" : "text-muted-foreground"}>
                      {gearHoursDone} / {gearHoursRequired}
                    </span>
                    {gearComplete && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                  </div>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${gearComplete ? "bg-green-500" : "bg-primary"}`}
                    style={{ width: `${gearPct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{gearPct}% · {gearMinutesTotal} min gesamt · {gearLessons.length} Einträge</p>
              </div>
            </div>
          )}

          {/* ── Prüfungen ── */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">
                Prüfungen
                <span className="ml-2 text-sm font-normal text-muted-foreground">({exams.length})</span>
              </h2>
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
                          <span className="inline-flex items-center gap-1 rounded-md border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-400">
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
            <h2 className="font-semibold text-foreground mb-4">
              Fahrstunden
              <span className="ml-2 text-sm font-normal text-muted-foreground">({lessons.length})</span>
            </h2>
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
            <h2 className="font-semibold text-foreground mb-4">
              Leistungen
              <span className="ml-2 text-sm font-normal text-muted-foreground">({services.length})</span>
            </h2>
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
        </div>
      </div>
    </div>
  );
};

export default FahrschuelerDetail;
