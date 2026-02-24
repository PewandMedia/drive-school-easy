import { useState, useMemo } from "react";
import { format, startOfDay, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { FileText, Printer, Banknote, CreditCard, Building2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type PaymentRow = {
  id: string;
  betrag: number;
  zahlungsart: "bar" | "ec" | "ueberweisung";
  datum: string;
  students: { vorname: string; nachname: string; geburtsdatum: string | null } | null;
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

    const { data, error } = await supabase
      .from("payments")
      .select("id, betrag, zahlungsart, datum, students(vorname, nachname, geburtsdatum)")
      .gte("datum", dayStart.toISOString())
      .lt("datum", dayEnd.toISOString())
      .order("datum", { ascending: true });

    if (error) {
      toast.error("Fehler beim Laden der Zahlungen");
      console.error(error);
    } else {
      setPayments((data as unknown as PaymentRow[]) || []);
    }
    setSubmitted(true);
    setLoading(false);
  };

  const totals = useMemo(() => {
    const t = { bar: 0, ec: 0, ueberweisung: 0, gesamt: 0 };
    payments.forEach((p) => {
      t[p.zahlungsart] += p.betrag;
      t.gesamt += p.betrag;
    });
    return t;
  }, [payments]);

  const filteredPayments = useMemo(() => {
    if (filterZahlungsart === "alle") return payments;
    return payments.filter((p) => p.zahlungsart === filterZahlungsart);
  }, [payments, filterZahlungsart]);

  const formatEUR = (v: number) =>
    v.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

  const renderTable = (rows: PaymentRow[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Uhrzeit</TableHead>
          <TableHead>Schüler</TableHead>
          <TableHead>Geburtsdatum</TableHead>
          <TableHead>Zahlungsart</TableHead>
          <TableHead className="text-right">Betrag</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((p) => {
          const Icon = zahlungsartIcon[p.zahlungsart];
          return (
            <TableRow key={p.id}>
              <TableCell>{format(new Date(p.datum), "HH:mm")}</TableCell>
              <TableCell>
                {p.students ? `${p.students.vorname} ${p.students.nachname}` : "–"}
              </TableCell>
              <TableCell>
                {p.students?.geburtsdatum
                  ? format(new Date(p.students.geburtsdatum), "dd.MM.yyyy")
                  : "–"}
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {zahlungsartLabel[p.zahlungsart]}
                </span>
              </TableCell>
              <TableCell className="text-right font-medium">{formatEUR(p.betrag)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  return (
    <>
      {/* ===== SCREEN VIEW ===== */}
      <div className="space-y-6 print:hidden">
        <PageHeader icon={FileText} title="Tagesabrechnung" description="Täglicher Kassenbericht" />

        {/* Date + Button */}
        <Card>
          <CardContent className="flex flex-wrap items-end gap-4 p-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Datum</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSubmitted(false);
                }}
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

        {/* Results */}
        {submitted && (
          payments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Für dieses Datum wurden keine Zahlungen erfasst.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Table */}
              <Card>
                <CardContent className="p-0">{renderTable(filteredPayments)}</CardContent>
              </Card>

              {/* Totals */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {([
                  { label: "💵 Bar gesamt", value: totals.bar },
                  { label: "💳 EC gesamt", value: totals.ec },
                  { label: "🏦 Überweisung gesamt", value: totals.ueberweisung },
                  { label: "📊 Gesamtbetrag", value: totals.gesamt },
                ] as const).map((t) => (
                  <Card key={t.label}>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">{t.label}</p>
                      <p className="text-xl font-bold">{formatEUR(t.value)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                Anzahl Zahlungen: <strong>{payments.length}</strong>
              </p>

              {/* Notes */}
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
            Datum: {format(new Date(selectedDate), "dd.MM.yyyy", { locale: de })}
          </p>
        </div>

        {payments.length > 0 && (
          <>
            <table className="w-full text-sm border-collapse mb-6">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Uhrzeit</th>
                  <th className="text-left py-1">Schüler</th>
                  <th className="text-left py-1">Geburtsdatum</th>
                  <th className="text-left py-1">Zahlungsart</th>
                  <th className="text-right py-1">Betrag</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="py-1">{format(new Date(p.datum), "HH:mm")}</td>
                    <td className="py-1">
                      {p.students ? `${p.students.vorname} ${p.students.nachname}` : "–"}
                    </td>
                    <td className="py-1">
                      {p.students?.geburtsdatum
                        ? format(new Date(p.students.geburtsdatum), "dd.MM.yyyy")
                        : "–"}
                    </td>
                    <td className="py-1">{zahlungsartLabel[p.zahlungsart]}</td>
                    <td className="py-1 text-right">{formatEUR(p.betrag)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mb-6 text-sm space-y-1">
              <p><strong>Bar gesamt:</strong> {formatEUR(totals.bar)}</p>
              <p><strong>EC gesamt:</strong> {formatEUR(totals.ec)}</p>
              <p><strong>Überweisung gesamt:</strong> {formatEUR(totals.ueberweisung)}</p>
              <p className="text-base font-bold mt-2">Gesamtbetrag: {formatEUR(totals.gesamt)}</p>
              <p>Anzahl Zahlungen: {payments.length}</p>
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
