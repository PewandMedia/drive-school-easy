import { useState, useMemo } from "react";
import { format, startOfDay, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { FileText, Printer, Banknote, CreditCard, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type FilterModus = "einreichung" | "einnahme";

type Allocation = {
  betrag: number;
  open_items: { beschreibung: string } | null;
};

type PaymentRow = {
  id: string;
  betrag: number;
  zahlungsart: "bar" | "ec" | "ueberweisung";
  datum: string;
  einreichungsdatum: string | null;
  instructor_id: string | null;
  students: { vorname: string; nachname: string } | null;
  instructors: { vorname: string; nachname: string } | null;
  payment_allocations: Allocation[];
};

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

const formatEUR = (v: number) =>
  v.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

const getVerwendungszweck = (allocations: Allocation[]) => {
  if (!allocations || allocations.length === 0) return "Freie Zahlung";
  const descriptions = allocations
    .map((a) => a.open_items?.beschreibung)
    .filter(Boolean);
  return descriptions.length > 0 ? descriptions.join(", ") : "Freie Zahlung";
};

const getInstructorName = (p: PaymentRow) =>
  p.instructors ? `${p.instructors.vorname} ${p.instructors.nachname}` : "–";

const Tagesabrechnung = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [notiz, setNotiz] = useState("");
  const [filterZahlungsart, setFilterZahlungsart] = useState("alle");

  const fetchPayments = async () => {
    setLoading(true);
    const dayStart = startOfDay(new Date(selectedDate));
    const dayEnd = addDays(dayStart, 1);

    // Filter nach Einreichungsdatum (mit Fallback auf datum für Altdaten ohne einreichungsdatum)
    const { data, error } = await supabase
      .from("payments")
      .select("id, betrag, zahlungsart, datum, einreichungsdatum, instructor_id, students(vorname, nachname), instructors(vorname, nachname), payment_allocations(betrag, open_items(beschreibung))")
      .or(`and(einreichungsdatum.gte.${dayStart.toISOString()},einreichungsdatum.lt.${dayEnd.toISOString()}),and(einreichungsdatum.is.null,datum.gte.${dayStart.toISOString()},datum.lt.${dayEnd.toISOString()})`)
      .order("einreichungsdatum", { ascending: true });

    if (error) {
      toast.error("Fehler beim Laden der Zahlungen");
      console.error(error);
    } else {
      setPayments((data as unknown as PaymentRow[]) || []);
    }
    setSubmitted(true);
    setLoading(false);
  };

  const filteredPayments = useMemo(() => {
    if (filterZahlungsart === "alle") return payments;
    return payments.filter((p) => p.zahlungsart === filterZahlungsart);
  }, [payments, filterZahlungsart]);

  const totals = useMemo(() => {
    const t = { bar: 0, ec: 0, ueberweisung: 0, gesamt: 0 };
    const c = { bar: 0, ec: 0, ueberweisung: 0, gesamt: 0 };
    filteredPayments.forEach((p) => {
      t[p.zahlungsart] += p.betrag;
      t.gesamt += p.betrag;
      c[p.zahlungsart]++;
      c.gesamt++;
    });
    return { amounts: t, counts: c };
  }, [filteredPayments]);

  const summaryCards = [
    { key: "bar", label: "Bar gesamt", icon: Banknote, amount: totals.amounts.bar, count: totals.counts.bar },
    { key: "ec", label: "EC gesamt", icon: CreditCard, amount: totals.amounts.ec, count: totals.counts.ec },
    { key: "ueberweisung", label: "Überweisung gesamt", icon: Building2, amount: totals.amounts.ueberweisung, count: totals.counts.ueberweisung },
    { key: "gesamt", label: "Gesamtbetrag", icon: FileText, amount: totals.amounts.gesamt, count: totals.counts.gesamt },
  ];

  const renderTable = (rows: PaymentRow[], showSubtotals: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Schüler</TableHead>
          <TableHead>Verwendungszweck</TableHead>
          <TableHead>Fahrlehrer</TableHead>
          <TableHead>Zahlungsart</TableHead>
          <TableHead>Einnahme am</TableHead>
          <TableHead>Einreichung am</TableHead>
          <TableHead className="text-right">Betrag</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((p) => {
          const Icon = zahlungsartIcon[p.zahlungsart];
          const einreichung = p.einreichungsdatum ?? p.datum;
          return (
            <TableRow key={p.id}>
              <TableCell>
                {p.students ? `${p.students.vorname} ${p.students.nachname}` : "–"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {getVerwendungszweck(p.payment_allocations)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {getInstructorName(p)}
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {zahlungsartLabel[p.zahlungsart]}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(p.datum), "dd.MM.yyyy")}
              </TableCell>
              <TableCell>
                {format(new Date(einreichung), "dd.MM.yyyy")}
              </TableCell>
              <TableCell className="text-right font-medium">{formatEUR(p.betrag)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      {showSubtotals && (
        <TableFooter>
          {filterZahlungsart === "alle" && (["bar", "ec", "ueberweisung"] as const).filter(z => totals.counts[z] > 0).map((z) => {
            const Icon = zahlungsartIcon[z];
            return (
              <TableRow key={z}>
                <TableCell colSpan={5} />
                <TableCell>
                  <span className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4" />
                    {zahlungsartLabel[z]} ({totals.counts[z]})
                  </span>
                </TableCell>
                <TableCell className="text-right font-bold">{formatEUR(totals.amounts[z])}</TableCell>
              </TableRow>
            );
          })}
          <TableRow>
            <TableCell colSpan={5} />
            <TableCell className="font-bold">Gesamt ({totals.counts.gesamt})</TableCell>
            <TableCell className="text-right font-bold">{formatEUR(totals.amounts.gesamt)}</TableCell>
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );

  return (
    <>
      {/* ===== SCREEN VIEW ===== */}
      <div className="space-y-6 print:hidden">
        <PageHeader icon={FileText} title="Tagesabrechnung" description="Täglicher Kassenbericht (nach Einreichungsdatum im Büro)" />

        <Card>
          <CardContent className="flex flex-wrap items-end gap-4 p-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Einreichungsdatum</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setSubmitted(false); }}
                className="w-48"
              />
            </div>
            <Button onClick={fetchPayments} disabled={loading}>
              {loading ? "Laden…" : "Tagesabrechnung erstellen"}
            </Button>
            {submitted && payments.length > 0 && (
              <>
                <Select value={filterZahlungsart} onValueChange={setFilterZahlungsart}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Zahlungsart" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Zahlungsarten</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="ec">EC-Karte</SelectItem>
                    <SelectItem value="ueberweisung">Überweisung</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-1 h-4 w-4" /> Als PDF exportieren
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {submitted && (
          payments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Für dieses Datum wurden keine Zahlungen im Büro eingereicht.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="p-0">{renderTable(filteredPayments, true)}</CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {summaryCards.map((c) => {
                  const Icon = c.icon;
                  return (
                    <Card key={c.key}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Icon className="h-4 w-4" />
                          <span>{c.label}</span>
                        </div>
                        <p className="text-xl font-bold mt-1">{formatEUR(c.amount)}</p>
                        <p className="text-xs text-muted-foreground">{c.count} {c.count === 1 ? "Zahlung" : "Zahlungen"}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card>
                <CardContent className="p-4 space-y-2">
                  <label className="text-sm font-medium">Tagesnotizen / Kassenvermerk</label>
                  <Textarea
                    value={notiz}
                    onChange={(e) => setNotiz(e.target.value)}
                    placeholder="Optionale Tagesnotizen hier eingeben…"
                    rows={4}
                  />
                </CardContent>
              </Card>
            </>
          )
        )}
      </div>

      {/* ===== PRINT AREA ===== */}
      <div className="print-area hidden print:block">
        <div className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold">Fahrschulverwaltung – Tagesabrechnung</h1>
          <p className="text-lg mt-1">
            Einreichungsdatum: {selectedDate ? format(new Date(selectedDate), "dd.MM.yyyy", { locale: de }) : "–"}
          </p>
          {filterZahlungsart !== "alle" && (
            <p className="text-sm mt-1 italic">Filter: Nur {zahlungsartLabel[filterZahlungsart]}</p>
          )}
        </div>

        {filteredPayments.length > 0 && (
          <>
            <table className="w-full text-sm border-collapse mb-6">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Schüler</th>
                  <th className="text-left py-1">Verwendungszweck</th>
                  <th className="text-left py-1">Fahrlehrer</th>
                  <th className="text-left py-1">Zahlungsart</th>
                  <th className="text-left py-1">Einnahme am</th>
                  <th className="text-left py-1">Einreichung am</th>
                  <th className="text-right py-1">Betrag</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => {
                  const einreichung = p.einreichungsdatum ?? p.datum;
                  return (
                    <tr key={p.id} className="border-b">
                      <td className="py-1">
                        {p.students ? `${p.students.vorname} ${p.students.nachname}` : "–"}
                      </td>
                      <td className="py-1">{getVerwendungszweck(p.payment_allocations)}</td>
                      <td className="py-1">{getInstructorName(p)}</td>
                      <td className="py-1">{zahlungsartLabel[p.zahlungsart]}</td>
                      <td className="py-1">{format(new Date(p.datum), "dd.MM.yyyy")}</td>
                      <td className="py-1">{format(new Date(einreichung), "dd.MM.yyyy")}</td>
                      <td className="py-1 text-right">{formatEUR(p.betrag)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mb-6 text-sm space-y-1">
              {(["bar", "ec", "ueberweisung"] as const).filter(z => filterZahlungsart === "alle" || filterZahlungsart === z).filter(z => totals.counts[z] > 0).map((z) => (
                <p key={z}><strong>{zahlungsartLabel[z]} gesamt ({totals.counts[z]}):</strong> {formatEUR(totals.amounts[z])}</p>
              ))}
              <p className="text-base font-bold mt-2">Gesamtbetrag ({totals.counts.gesamt}): {formatEUR(totals.amounts.gesamt)}</p>
            </div>
          </>
        )}

        {notiz && (
          <div className="mb-6">
            <p className="font-bold text-sm mb-1">Tagesnotizen / Kassenvermerk:</p>
            <p className="text-sm whitespace-pre-wrap border p-2">{notiz}</p>
          </div>
        )}

        <div className="mt-12 text-sm space-y-6">
          <p>Kassenprüfung durchgeführt von: ______________________________</p>
          <p>Datum: ______________________________</p>
          <p>Unterschrift: ______________________________</p>
        </div>
      </div>
    </>
  );
};

export default Tagesabrechnung;
