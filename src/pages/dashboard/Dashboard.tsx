import { Users, Car, CreditCard, ClipboardCheck, BookOpen, TrendingUp } from "lucide-react";
import { formatStudentName } from "@/lib/formatStudentName";
import { fetchAllRows } from "@/lib/fetchAllRows";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format, isToday, isAfter, isSameMonth } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const fmt = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

const Dashboard = () => {
  const navigate = useNavigate();
  const now = new Date();

  const { data: students = [] } = useQuery({
    queryKey: ["dashboard-students"],
    queryFn: () => fetchAllRows(supabase.from("students").select("id, vorname, nachname, geburtsdatum").order("nachname")),
  });

  const { data: drivingLessons = [] } = useQuery({
    queryKey: ["dashboard-driving-lessons"],
    queryFn: () => fetchAllRows(supabase.from("driving_lessons").select("*").order("created_at", { ascending: false })),
  });

  const { data: exams = [] } = useQuery({
    queryKey: ["dashboard-exams"],
    queryFn: () => fetchAllRows(supabase.from("exams").select("*").order("datum", { ascending: false })),
  });

  const { data: theorySessions = [] } = useQuery({
    queryKey: ["dashboard-theory"],
    queryFn: () => fetchAllRows(supabase.from("theory_sessions").select("*")),
  });

  const { data: services = [] } = useQuery({
    queryKey: ["dashboard-services"],
    queryFn: () => fetchAllRows(supabase.from("services").select("*").order("created_at", { ascending: false })),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["dashboard-payments"],
    queryFn: () => fetchAllRows(supabase.from("payments").select("*").order("created_at", { ascending: false })),
  });

  // Student name map
  const nameMap = new Map(students.map((s) => [s.id, formatStudentName(s.nachname, s.vorname, (s as any).geburtsdatum)]));

  // KPIs
  const lessonsToday = drivingLessons.filter((l) => isToday(new Date(l.datum))).length;
  const examsThisMonth = exams.filter((e) => isSameMonth(new Date(e.datum), now)).length;
  const monthlyRevenue = payments
    .filter((p) => isSameMonth(new Date(p.datum), now))
    .reduce((s, p) => s + Number(p.betrag), 0);

  // Open balance
  const totalCharges =
    drivingLessons.reduce((s, l) => s + Number(l.preis), 0) +
    exams.reduce((s, e) => s + Number(e.preis), 0) +
    services.reduce((s, sv) => s + Number(sv.preis), 0);
  const totalPayments = payments.reduce((s, p) => s + Number(p.betrag), 0);
  const openBalance = totalCharges - totalPayments;

  const stats = [
    { label: "Aktive Fahrschüler", value: String(students.length), icon: Users, color: "text-blue-600" },
    { label: "Fahrstunden heute", value: String(lessonsToday), icon: Car, color: "text-green-600" },
    { label: "Prüfungen diesen Monat", value: String(examsThisMonth), icon: ClipboardCheck, color: "text-purple-600" },
    { label: "Theoriestunden gesamt", value: String(theorySessions.length), icon: BookOpen, color: "text-cyan-600" },
  ];

  // Recent activities (5 newest across tables)
  type Activity = { type: string; studentId: string; desc: string; date: string; createdAt: string };
  const activities: Activity[] = [
    ...drivingLessons.map((l) => ({
      type: "Fahrstunde",
      studentId: l.student_id,
      desc: `${l.typ} – ${l.dauer_minuten} Min`,
      date: l.datum,
      createdAt: l.created_at,
    })),
    ...exams.map((e) => ({
      type: "Prüfung",
      studentId: e.student_id,
      desc: `${e.typ === "theorie" ? "Theorie" : "Praxis"} – ${e.status === "bestanden" ? "Bestanden" : e.status === "nicht_bestanden" ? "Nicht bestanden" : e.status === "krank" ? "Krank" : "Angemeldet"}`,
      date: e.datum,
      createdAt: e.created_at,
    })),
    ...services.map((s) => ({
      type: "Leistung",
      studentId: s.student_id,
      desc: `${s.bezeichnung} – ${fmt(Number(s.preis))}`,
      date: s.created_at,
      createdAt: s.created_at,
    })),
    ...payments.map((p) => ({
      type: "Zahlung",
      studentId: p.student_id,
      desc: `${fmt(Number(p.betrag))} (${p.zahlungsart})`,
      date: p.datum,
      createdAt: p.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Upcoming exams
  const upcomingExams = exams
    .filter((e) => isAfter(new Date(e.datum), new Date()) || isToday(new Date(e.datum)))
    .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime())
    .slice(0, 5);

  // Students with open balance (top 5)
  const studentBalances = students
    .map((s) => {
      const charges =
        drivingLessons.filter((l) => l.student_id === s.id).reduce((sum, l) => sum + Number(l.preis), 0) +
        exams.filter((e) => e.student_id === s.id).reduce((sum, e) => sum + Number(e.preis), 0) +
        services.filter((sv) => sv.student_id === s.id).reduce((sum, sv) => sum + Number(sv.preis), 0);
      const paid = payments.filter((p) => p.student_id === s.id).reduce((sum, p) => sum + Number(p.betrag), 0);
      return { ...s, saldo: charges - paid };
    })
    .filter((s) => s.saldo > 0)
    .sort((a, b) => b.saldo - a.saldo)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Übersicht</h1>
        <p className="text-muted-foreground mt-1">Willkommen in der Fahrschulverwaltung</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Letzte Aktivitäten */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground mb-3">Letzte Aktivitäten</h2>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Aktivitäten vorhanden.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="secondary" className="shrink-0 text-xs">{a.type}</Badge>
                    <span className="text-foreground truncate">{nameMap.get(a.studentId) ?? "–"}</span>
                    <span className="text-muted-foreground truncate hidden sm:inline">– {a.desc}</span>
                  </div>
                  <span className="text-muted-foreground text-xs shrink-0 ml-2">
                    {format(new Date(a.date), "dd.MM.yyyy", { locale: de })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nächste Prüfungen */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground mb-3">Nächste Prüfungen</h2>
          {upcomingExams.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Prüfungen geplant.</p>
          ) : (
            <div className="space-y-3">
              {upcomingExams.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {e.typ === "theorie" ? "Theorie" : "Praxis"}
                    </Badge>
                    <span className="text-foreground">{nameMap.get(e.student_id) ?? "–"}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {format(new Date(e.datum), "dd.MM.yyyy", { locale: de })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schüler mit offenem Saldo */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground mb-3">Schüler mit offenem Saldo</h2>
        {studentBalances.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine offenen Salden vorhanden.</p>
        ) : (
          <div className="space-y-3">
            {studentBalances.map((s) => (
              <div
                key={s.id}
                onClick={() => navigate(`/dashboard/fahrschueler/${s.id}`)}
                className="flex items-center justify-between text-sm cursor-pointer hover:bg-secondary/50 rounded-lg px-2 py-1.5 transition-colors"
              >
                <span className="text-foreground">{formatStudentName(s.nachname, s.vorname, (s as any).geburtsdatum)}</span>
                <Badge className="bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/15">
                  {fmt(s.saldo)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
