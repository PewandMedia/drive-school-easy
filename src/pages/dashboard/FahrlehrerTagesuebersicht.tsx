import { useState, useMemo } from "react";
import { format, startOfDay, addDays } from "date-fns";
import { CalendarCheck, Car, CreditCard, Banknote, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetchAllRows";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";

type Instructor = { id: string; vorname: string; nachname: string };

type LessonRow = {
  id: string;
  datum: string;
  typ: string;
  fahrzeug_typ: string | null;
  dauer_minuten: number;
  einheiten: number;
  preis: number;
  students: { vorname: string; nachname: string } | null;
};

type Allocation = { betrag: number; open_items: { beschreibung: string } | null };

type PaymentRow = {
  id: string;
  betrag: number;
  zahlungsart: "bar" | "ec" | "ueberweisung";
  filiale: "riemke" | "rathaus" | null;
  datum: string;
  students: { vorname: string; nachname: string; fahrschule: string | null } | null;
  payment_allocations: Allocation[];
};

const formatEUR = (v: number) =>
  v.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

const zahlungsartLabel: Record<string, string> = {
  bar: "Bar",
  ec: "EC-Karte",
  ueberweisung: "Überweisung",
};

const zahlungsartIcon: Record<string, typeof Banknote> = {
  bar: Banknote,
  ec: CreditCard,
  ueberweisung: Building2,
};

const typLabel: Record<string, string> = {
  uebungsstunde: "Übungsstunde",
  ueberland: "Überland",
  autobahn: "Autobahn",
  nacht: "Nacht",
  fehlstunde: "Fehlstunde",
};

const filialeShort = (p: PaymentRow) => {
  const f = p.filiale ?? (p.students?.fahrschule as any);
  if (f === "riemke") return "Riemke";
  if (f === "rathaus") return "Rathaus";
  return "–";
};

const getVerwendungszweck = (allocations: Allocation[]) => {
  if (!allocations || allocations.length === 0) return "Freie Zahlung";
  const descriptions = allocations
    .map((a) => a.open_items?.beschreibung)
    .filter(Boolean) as string[];
  if (descriptions.length === 0) return "Freie Zahlung";
  const counts = new Map<string, number>();
  descriptions.forEach((d) => counts.set(d, (counts.get(d) ?? 0) + 1));
  return Array.from(counts.entries())
    .map(([desc, n]) => (n > 1 ? `${desc} ×${n}` : desc))
    .join(", ");
};

const studentName = (s: { vorname: string; nachname: string } | null) =>
  s ? `${s.nachname}, ${s.vorname}` : "–";

const FahrlehrerTagesuebersicht = () => {
  const [instructorId, setInstructorId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: instructors = [] } = useQuery<Instructor[]>({
    queryKey: ["instructors_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, vorname, nachname")
        .eq("aktiv", true)
        .order("nachname");
      if (error) throw error;
      return (data ?? []) as Instructor[];
    },
  });

  const enabled = !!instructorId && !!selectedDate;

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery<LessonRow[]>({
    queryKey: ["fl-tag-lessons", instructorId, selectedDate],
    enabled,
    queryFn: async () => {
      const dayStart = startOfDay(new Date(selectedDate));
      const dayEnd = addDays(dayStart, 1);
      const data = await fetchAllRows<LessonRow>(
        supabase
          .from("driving_lessons")
          .select("id, datum, typ, fahrzeug_typ, dauer_minuten, einheiten, preis, students(vorname, nachname)")
          .eq("instructor_id", instructorId)
          .gte("datum", dayStart.toISOString())
          .lt("datum", dayEnd.toISOString())
          .order("datum", { ascending: true }) as any
      );
      return data ?? [];
    },
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<PaymentRow[]>({
    queryKey: ["fl-tag-payments", instructorId, selectedDate],
    enabled,
    queryFn: async () => {
      const data = await fetchAllRows<PaymentRow>(
        supabase
          .from("payments")
          .select("id, betrag, zahlungsart, filiale, datum, students(vorname, nachname, fahrschule), payment_allocations(betrag, open_items(beschreibung))")
          .eq("instructor_id", instructorId)
          .eq("datum", selectedDate)
          .order("datum", { ascending: true }) as any
      );
      return data ?? [];
    },
  });

  const lessonTotals = useMemo(() => {
    const einheiten = lessons.reduce((s, l) => s + (l.einheiten ?? 0), 0);
    const minuten = lessons.reduce((s, l) => s + (l.dauer_minuten ?? 0), 0);
    const umsatz = lessons.reduce((s, l) => s + Number(l.preis ?? 0), 0);
    return { count: lessons.length, einheiten, minuten, umsatz };
  }, [lessons]);

  const paymentTotals = useMemo(() => {
    const t = { bar: 0, ec: 0, ueberweisung: 0, gesamt: 0 };
    const c = { bar: 0, ec: 0, ueberweisung: 0, gesamt: 0 };
    payments.forEach((p) => {
      t[p.zahlungsart] += Number(p.betrag);
      t.gesamt += Number(p.betrag);
      c[p.zahlungsart]++;
      c.gesamt++;
    });
    return { amounts: t, counts: c };
  }, [payments]);

  const selectedInstructor = instructors.find((i) => i.id === instructorId);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarCheck}
        title="Tagesübersicht Fahrlehrer"
        description="Fahrstunden und Zahlungen eines Fahrlehrers an einem bestimmten Tag – zum Abgleich mit dem Tagesnachweis"
      />

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Fahrlehrer</Label>
            <Select value={instructorId} onValueChange={setInstructorId}>
              <SelectTrigger>
                <SelectValue placeholder="Fahrlehrer auswählen…" />
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
          <div className="space-y-1.5">
            <Label>Datum</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {!enabled ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Bitte Fahrlehrer und Datum auswählen.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Fahrstunden am {format(new Date(selectedDate), "dd.MM.yyyy")}</div>
                <div className="mt-1 text-2xl font-bold">
                  {lessonTotals.count} · {lessonTotals.einheiten}E · {formatEUR(lessonTotals.umsatz)}
                </div>
                <div className="text-xs text-muted-foreground">{lessonTotals.minuten} min gesamt</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Zahlungen (kassiert am diesem Tag)</div>
                <div className="mt-1 text-2xl font-bold">
                  {paymentTotals.counts.gesamt} · {formatEUR(paymentTotals.amounts.gesamt)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Bar {formatEUR(paymentTotals.amounts.bar)} · EC {formatEUR(paymentTotals.amounts.ec)} · Überweisung {formatEUR(paymentTotals.amounts.ueberweisung)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fahrstunden */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Car className="h-4 w-4 text-primary" />
                Fahrstunden {selectedInstructor && `– ${selectedInstructor.nachname}, ${selectedInstructor.vorname}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {lessonsLoading ? (
                <div className="p-6 text-center text-muted-foreground">Lädt…</div>
              ) : lessons.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">Keine Fahrstunden an diesem Tag.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Uhrzeit</TableHead>
                      <TableHead>Fahrschüler</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead className="text-right">Einheiten</TableHead>
                      <TableHead className="text-right">Dauer</TableHead>
                      <TableHead>Fahrzeug</TableHead>
                      <TableHead className="text-right">Preis</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessons.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>{format(new Date(l.datum), "HH:mm")}</TableCell>
                        <TableCell>{studentName(l.students)}</TableCell>
                        <TableCell>{typLabel[l.typ] ?? l.typ}</TableCell>
                        <TableCell className="text-right">{l.einheiten}E</TableCell>
                        <TableCell className="text-right">{l.dauer_minuten} min</TableCell>
                        <TableCell className="capitalize text-muted-foreground">{l.fahrzeug_typ ?? "–"}</TableCell>
                        <TableCell className="text-right font-medium">{formatEUR(Number(l.preis))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="font-bold">Gesamt ({lessonTotals.count})</TableCell>
                      <TableCell className="text-right font-bold">{lessonTotals.einheiten}E</TableCell>
                      <TableCell className="text-right font-bold">{lessonTotals.minuten} min</TableCell>
                      <TableCell />
                      <TableCell className="text-right font-bold">{formatEUR(lessonTotals.umsatz)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Zahlungen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-primary" />
                Zahlungen {selectedInstructor && `– ${selectedInstructor.nachname}, ${selectedInstructor.vorname}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {paymentsLoading ? (
                <div className="p-6 text-center text-muted-foreground">Lädt…</div>
              ) : payments.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">Keine Zahlungen an diesem Tag.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fahrschüler</TableHead>
                      <TableHead>Verwendungszweck</TableHead>
                      <TableHead>Art</TableHead>
                      <TableHead>Filiale</TableHead>
                      <TableHead className="text-right">Betrag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => {
                      const Icon = zahlungsartIcon[p.zahlungsart];
                      return (
                        <TableRow key={p.id}>
                          <TableCell>{studentName(p.students)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {getVerwendungszweck(p.payment_allocations)}
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1.5">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              {zahlungsartLabel[p.zahlungsart]}
                            </span>
                          </TableCell>
                          <TableCell className={p.filiale ? "" : "italic text-muted-foreground"}>
                            {filialeShort(p)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatEUR(Number(p.betrag))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    {(["bar", "ec", "ueberweisung"] as const)
                      .filter((z) => paymentTotals.counts[z] > 0)
                      .map((z) => {
                        const Icon = zahlungsartIcon[z];
                        return (
                          <TableRow key={z}>
                            <TableCell colSpan={3} />
                            <TableCell>
                              <span className="flex items-center gap-1.5">
                                <Icon className="h-4 w-4" />
                                {zahlungsartLabel[z]} ({paymentTotals.counts[z]})
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {formatEUR(paymentTotals.amounts[z])}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    <TableRow>
                      <TableCell colSpan={3} />
                      <TableCell className="font-bold">Gesamt ({paymentTotals.counts.gesamt})</TableCell>
                      <TableCell className="text-right font-bold">
                        {formatEUR(paymentTotals.amounts.gesamt)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default FahrlehrerTagesuebersicht;
