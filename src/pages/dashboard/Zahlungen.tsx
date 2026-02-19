import { useState } from "react";
import { CreditCard, Plus, Trash2, TrendingDown, Banknote, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { de } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ── Types ──────────────────────────────────────────────────────────────────────
type Zahlungsart = "bar" | "ec" | "ueberweisung";

type Payment = {
  id: string;
  student_id: string;
  service_id: string | null;
  betrag: number;
  zahlungsart: Zahlungsart;
  datum: string;
  students: { vorname: string; nachname: string } | null;
};

type PaymentForm = {
  student_id: string;
  service_id: string;
  betrag: string;
  zahlungsart: Zahlungsart;
  datum: string;
};

const defaultForm = (): PaymentForm => ({
  student_id: "",
  service_id: "",
  betrag: "",
  zahlungsart: "bar",
  datum: new Date().toISOString().slice(0, 10),
});

// ── Labels ────────────────────────────────────────────────────────────────────
const ZAHLUNGSART_LABELS: Record<Zahlungsart, string> = {
  bar: "Bar",
  ec: "EC-Karte",
  ueberweisung: "Überweisung",
};

const ZAHLUNGSART_ICONS: Record<Zahlungsart, React.ReactNode> = {
  bar: <Banknote className="h-3.5 w-3.5" />,
  ec: <CreditCard className="h-3.5 w-3.5" />,
  ueberweisung: <Landmark className="h-3.5 w-3.5" />,
};

const eur = (v: number) =>
  v.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

// ── Component ─────────────────────────────────────────────────────────────────
const Zahlungen = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PaymentForm>(defaultForm());
  const { toast } = useToast();
  const qc = useQueryClient();

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, students(vorname, nachname)")
        .order("datum", { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, vorname, nachname")
        .order("nachname");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: openServices = [] } = useQuery({
    queryKey: ["services_offen", form.student_id],
    queryFn: async () => {
      if (!form.student_id) return [];
      const { data, error } = await supabase
        .from("services")
        .select("id, bezeichnung, preis")
        .eq("student_id", form.student_id)
        .eq("status", "offen");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!form.student_id,
  });

  // ── Mutation ─────────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("payments").insert({
        student_id: form.student_id,
        service_id: form.service_id || null,
        betrag: parseFloat(form.betrag) || 0,
        zahlungsart: form.zahlungsart,
        datum: new Date(form.datum).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast({ title: "Zahlung gespeichert" });
      setOpen(false);
      setForm(defaultForm());
    },
    onError: (e: Error) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast({ title: "Zahlung gelöscht" });
    },
    onError: (e: Error) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  // ── Stats ────────────────────────────────────────────────────────────────────
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const eingegangeneMonat = payments
    .filter((p) => {
      const d = new Date(p.datum);
      return d >= monthStart && d <= monthEnd;
    })
    .reduce((s, p) => s + Number(p.betrag), 0);

  const gesamtEingegangen = payments.reduce((s, p) => s + Number(p.betrag), 0);

  // Offene Leistungen (services mit status=offen) – separate query for total
  const { data: alleOffenen = [] } = useQuery({
    queryKey: ["services_all_offen"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("preis")
        .eq("status", "offen");
      if (error) throw error;
      return data ?? [];
    },
  });

  const totalOffen = alleOffenen.reduce((s, sv) => s + Number(sv.preis), 0);
  // Saldo = offene Leistungen - eingegangene Zahlungen (vereinfacht)
  const saldo = totalOffen - gesamtEingegangen;

  const canSave = form.student_id && form.betrag && parseFloat(form.betrag) > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zahlungen"
        description="Zahlungseingänge erfassen und offene Posten überwachen"
        icon={CreditCard}
        action={
          <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />Zahlung erfassen
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-2xl font-bold text-green-400">{eur(eingegangeneMonat)}</p>
          <p className="text-sm text-muted-foreground mt-1">Eingegangen (dieser Monat)</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-2xl font-bold text-foreground">{eur(gesamtEingegangen)}</p>
          <p className="text-sm text-muted-foreground mt-1">Gesamt eingegangen</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className={`text-2xl font-bold ${saldo > 0 ? "text-amber-400" : "text-green-400"}`}>
            {eur(Math.max(0, saldo))}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Offener Saldo</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Schüler</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Zahlungsart</TableHead>
              <TableHead className="text-right">Betrag</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="h-4 w-48 bg-secondary/60 rounded animate-pulse mx-auto" />
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <TrendingDown className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Noch keine Zahlungen erfasst
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => {
                const st = p.students;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {st ? `${st.nachname}, ${st.vorname}` : "–"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(p.datum), "dd.MM.yyyy", { locale: de })}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2 py-0.5 text-xs font-medium text-foreground">
                        {ZAHLUNGSART_ICONS[p.zahlungsart]}
                        {ZAHLUNGSART_LABELS[p.zahlungsart]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-400">
                      +{eur(Number(p.betrag))}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(p.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(defaultForm()); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Zahlung erfassen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Schüler */}
            <div className="space-y-1.5">
              <Label>Schüler</Label>
              <Select
                value={form.student_id}
                onValueChange={(v) => setForm((f) => ({ ...f, student_id: v, service_id: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Schüler wählen…" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nachname}, {s.vorname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Offene Leistung (optional) */}
            {openServices.length > 0 && (
              <div className="space-y-1.5">
                <Label>Leistung zuordnen <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Select
                  value={form.service_id}
                  onValueChange={(v) => {
                    const svc = openServices.find((s) => s.id === v);
                    setForm((f) => ({
                      ...f,
                      service_id: v,
                      betrag: svc ? String(svc.preis) : f.betrag,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Leistung wählen…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Keine Zuordnung</SelectItem>
                    {openServices.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.bezeichnung} · {eur(Number(s.preis))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Betrag */}
            <div className="space-y-1.5">
              <Label>Betrag (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={form.betrag}
                onChange={(e) => setForm((f) => ({ ...f, betrag: e.target.value }))}
              />
            </div>

            {/* Zahlungsart */}
            <div className="space-y-1.5">
              <Label>Zahlungsart</Label>
              <Select
                value={form.zahlungsart}
                onValueChange={(v) => setForm((f) => ({ ...f, zahlungsart: v as Zahlungsart }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(ZAHLUNGSART_LABELS) as [Zahlungsart, string][]).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Datum */}
            <div className="space-y-1.5">
              <Label>Datum</Label>
              <Input
                type="date"
                value={form.datum}
                onChange={(e) => setForm((f) => ({ ...f, datum: e.target.value }))}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setOpen(false); setForm(defaultForm()); }}>
                Abbrechen
              </Button>
              <Button
                disabled={!canSave || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? "Speichern…" : "Speichern"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Zahlungen;
