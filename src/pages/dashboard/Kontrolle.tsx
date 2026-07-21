import { useState, useMemo } from "react";
import { format, startOfMonth } from "date-fns";
import { ClipboardCheck, Car, CreditCard, Search } from "lucide-react";
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
import { formatStudentName } from "@/lib/formatStudentName";

type Filiale = "alle" | "riemke" | "rathaus";
type Anzeige = "beides" | "fahrstunden" | "zahlungen";

type LessonRow = {
  id: string;
  datum: string;
  typ: string;
  dauer_minuten: number;
  einheiten: number;
  preis: number;
  students: { vorname: string; nachname: string; geburtsdatum: string | null } | null;
  instructors: { vorname: string; nachname: string } | null;
};

type PaymentRow = {
  id: string;
  datum: string;
  einreichungsdatum: string | null;
  betrag: number;
  zahlungsart: "bar" | "ec" | "ueberweisung";
  filiale: "riemke" | "rathaus" | null;
  students: { vorname: string; nachname: string; geburtsdatum: string | null } | null;
  instructors: { vorname: string; nachname: string } | null;
};

const formatEUR = (v: number) =>
  v.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

const zahlungsartLabel: Record<string, string> = {
  bar: "Bar",
  ec: "EC-Karte",
  ueberweisung: "Überweisung",
};

const typLabel: Record<string, string> = {
  uebungsstunde: "Übungsstunde",
  ueberland: "Überland",
  autobahn: "Autobahn",
  nacht: "Nacht",
  fehlstunde: "Fehlstunde",
};

const filialeLabel = (f: string | null) =>
  f === "riemke" ? "Riemke" : f === "rathaus" ? "Rathaus" : "–";

const fmtDate = (d: string) => format(new Date(d), "dd.MM.yyyy");

const Kontrolle = () => {
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const [von, setVon] = useState(monthStart);
  const [bis, setBis] = useState(today);
  const [filiale, setFiliale] = useState<Filiale>("alle");
  const [search, setSearch] = useState("");
  const [anzeige, setAnzeige] = useState<Anzeige>("beides");

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ["kontrolle-lessons", von, bis],
    queryFn: async () => {
      return fetchAllRows<LessonRow>(
        supabase
          .from("driving_lessons")
          .select(
            "id,datum,typ,dauer_minuten,einheiten,preis," +
              "students(vorname,nachname,geburtsdatum)," +
              "instructors(vorname,nachname)",
          )
          .gte("datum", von)
          .lte("datum", bis)
          .order("datum", { ascending: false }) as any,
      );
    },
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["kontrolle-payments", von, bis],
    queryFn: async () => {
      return fetchAllRows<PaymentRow>(
        supabase
          .from("payments")
          .select(
            "id,datum,einreichungsdatum,betrag,zahlungsart,filiale," +
              "students(vorname,nachname,geburtsdatum)," +
              "instructors(vorname,nachname)",
          )
          .gte("datum", von)
          .lte("datum", bis)
          .order("datum", { ascending: false }) as any,
      );
    },
  });

  const filteredLessons = useMemo(() => {
    const s = search.trim().toLowerCase();
    return lessons.filter((l) => {
      if (!s) return true;
      const name = l.students
        ? `${l.students.nachname} ${l.students.vorname}`.toLowerCase()
        : "";
      return name.includes(s);
    });
  }, [lessons, search]);

  const filteredPayments = useMemo(() => {
    const s = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (filiale !== "alle" && p.filiale !== filiale) return false;
      if (!s) return true;
      const name = p.students
        ? `${p.students.nachname} ${p.students.vorname}`.toLowerCase()
        : "";
      return name.includes(s);
    });
  }, [payments, search, filiale]);

  const lessonSum = filteredLessons.reduce((s, l) => s + Number(l.preis || 0), 0);
  const einheitenSum = filteredLessons.reduce((s, l) => s + Number(l.einheiten || 0), 0);
  const paymentSum = filteredPayments.reduce((s, p) => s + Number(p.betrag || 0), 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Kontrolle"
        description="Alle Fahrstunden & Zahlungen in einem Zeitraum prüfen"
        icon={ClipboardCheck}
      />

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="von">Von</Label>
              <Input id="von" type="date" value={von} onChange={(e) => setVon(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bis">Bis</Label>
              <Input id="bis" type="date" value={bis} onChange={(e) => setBis(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Filiale (Zahlungen)</Label>
              <Select value={filiale} onValueChange={(v) => setFiliale(v as Filiale)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Filialen</SelectItem>
                  <SelectItem value="riemke">Riemke Markt</SelectItem>
                  <SelectItem value="rathaus">Rathaus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Anzeigen</Label>
              <Select value={anzeige} onValueChange={(v) => setAnzeige(v as Anzeige)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beides">Beides</SelectItem>
                  <SelectItem value="fahrstunden">Nur Fahrstunden</SelectItem>
                  <SelectItem value="zahlungen">Nur Zahlungen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Schüler suchen</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  className="pl-8"
                  placeholder="Nachname / Vorname"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className={"grid gap-4 " + (anzeige === "beides" ? "md:grid-cols-4" : "md:grid-cols-2")}>
        {anzeige !== "zahlungen" && (
          <>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Fahrstunden</p>
                <p className="text-2xl font-bold">{filteredLessons.length}</p>
                <p className="text-xs text-muted-foreground">{einheitenSum} Einheiten</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Umsatz Fahrstunden</p>
                <p className="text-2xl font-bold">{formatEUR(lessonSum)}</p>
              </CardContent>
            </Card>
          </>
        )}
        {anzeige !== "fahrstunden" && (
          <>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Zahlungen</p>
                <p className="text-2xl font-bold">{filteredPayments.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Summe Zahlungen</p>
                <p className="text-2xl font-bold">{formatEUR(paymentSum)}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Fahrstunden */}
      {anzeige !== "zahlungen" && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="h-4 w-4 text-primary" /> Fahrstunden
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lessonsLoading ? (
            <p className="text-sm text-muted-foreground">Lädt…</p>
          ) : filteredLessons.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Fahrstunden im Zeitraum.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Schüler</TableHead>
                    <TableHead>Fahrlehrer</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead className="text-right">Einheiten</TableHead>
                    <TableHead className="text-right">Dauer</TableHead>
                    <TableHead className="text-right">Preis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLessons.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{fmtDate(l.datum)}</TableCell>
                      <TableCell>
                        {l.students
                          ? formatStudentName(l.students.nachname, l.students.vorname, l.students.geburtsdatum)
                          : "–"}
                      </TableCell>
                      <TableCell>
                        {l.instructors ? `${l.instructors.nachname}, ${l.instructors.vorname}` : "–"}
                      </TableCell>
                      <TableCell>{typLabel[l.typ] ?? l.typ}</TableCell>
                      <TableCell className="text-right">{l.einheiten}</TableCell>
                      <TableCell className="text-right">{l.dauer_minuten} min</TableCell>
                      <TableCell className="text-right">{formatEUR(Number(l.preis))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4}>Summe</TableCell>
                    <TableCell className="text-right">{einheitenSum}</TableCell>
                    <TableCell />
                    <TableCell className="text-right">{formatEUR(lessonSum)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Zahlungen */}
      {anzeige !== "fahrstunden" && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" /> Zahlungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <p className="text-sm text-muted-foreground">Lädt…</p>
          ) : filteredPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Zahlungen im Zeitraum.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Einnahme</TableHead>
                    <TableHead>Im Büro</TableHead>
                    <TableHead>Schüler</TableHead>
                    <TableHead>Fahrlehrer</TableHead>
                    <TableHead>Art</TableHead>
                    <TableHead>Filiale</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{fmtDate(p.datum)}</TableCell>
                      <TableCell>{p.einreichungsdatum ? fmtDate(p.einreichungsdatum) : "–"}</TableCell>
                      <TableCell>
                        {p.students
                          ? formatStudentName(p.students.nachname, p.students.vorname, p.students.geburtsdatum)
                          : "–"}
                      </TableCell>
                      <TableCell>
                        {p.instructors ? `${p.instructors.nachname}, ${p.instructors.vorname}` : "–"}
                      </TableCell>
                      <TableCell>{zahlungsartLabel[p.zahlungsart] ?? p.zahlungsart}</TableCell>
                      <TableCell>{filialeLabel(p.filiale)}</TableCell>
                      <TableCell className="text-right">{formatEUR(Number(p.betrag))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={6}>Summe</TableCell>
                    <TableCell className="text-right">{formatEUR(paymentSum)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default Kontrolle;
