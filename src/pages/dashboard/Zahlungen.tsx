import { useState } from "react";
import { CreditCard, Plus, Trash2, TrendingDown, Banknote, Landmark, Search } from "lucide-react";
import { formatStudentName } from "@/lib/formatStudentName";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import StudentCombobox from "@/components/StudentCombobox";
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

type PaymentForm = {
  student_id: string;
  betrag: string;
  zahlungsart: Zahlungsart;
  datum: string;
  selectedOpenItems: string[];
};

const defaultForm = (): PaymentForm => ({
  student_id: "",
  betrag: "",
  zahlungsart: "bar",
  datum: new Date().toISOString().slice(0, 10),
  selectedOpenItems: [],
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
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, students(vorname, nachname, geburtsdatum)")
        .order("datum", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Payment allocations for display
  const { data: allAllocations = [] } = useQuery({
    queryKey: ["payment_allocations_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_allocations")
        .select("*, open_items(beschreibung, typ, datum)") as any;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, vorname, nachname, geburtsdatum")
        .order("nachname");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Open items for selected student in dialog
  const { data: openItemsForStudent = [] } = useQuery({
    queryKey: ["open_items_student", form.student_id],
    queryFn: async () => {
      if (!form.student_id) return [];
      const { data, error } = await supabase
        .from("open_items")
        .select("*")
        .eq("student_id", form.student_id)
        .neq("status", "bezahlt")
        .order("datum", { ascending: true }) as any;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!form.student_id,
  });

  // ── Mutation ─────────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const betrag = parseFloat(form.betrag) || 0;
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .insert({
          student_id: form.student_id,
          betrag,
          zahlungsart: form.zahlungsart,
          datum: new Date(form.datum).toISOString(),
        })
        .select("id")
        .single();
      if (paymentError) throw paymentError;

      // Allocate to selected open items
      if (form.selectedOpenItems.length > 0) {
        const selectedItems = openItemsForStudent
          .filter((oi: any) => form.selectedOpenItems.includes(oi.id))
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
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["payment_allocations_all"] });
      qc.invalidateQueries({ queryKey: ["open_items_student", form.student_id] });
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
      qc.invalidateQueries({ queryKey: ["payment_allocations_all"] });
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
    .filter((p: any) => {
      const d = new Date(p.datum);
      return d >= monthStart && d <= monthEnd;
    })
    .reduce((s: number, p: any) => s + Number(p.betrag), 0);

  const gesamtEingegangen = payments.reduce((s: number, p: any) => s + Number(p.betrag), 0);

  const canSave = form.student_id && form.betrag && parseFloat(form.betrag) > 0;

  // Build allocation map for display
  const allocationsByPayment = new Map<string, any[]>();
  for (const alloc of allAllocations) {
    const list = allocationsByPayment.get(alloc.payment_id) || [];
    list.push(alloc);
    allocationsByPayment.set(alloc.payment_id, list);
  }

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-2xl font-bold text-green-400">{eur(eingegangeneMonat)}</p>
          <p className="text-sm text-muted-foreground mt-1">Eingegangen (dieser Monat)</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-2xl font-bold text-foreground">{eur(gesamtEingegangen)}</p>
          <p className="text-sm text-muted-foreground mt-1">Gesamt eingegangen</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Schüler suchen…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 max-w-sm"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Schüler</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Zahlungsart</TableHead>
              <TableHead>Zuordnung</TableHead>
              <TableHead className="text-right">Betrag</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="h-4 w-48 bg-secondary/60 rounded animate-pulse mx-auto" />
                </TableCell>
              </TableRow>
            ) : payments.filter((p: any) => {
                if (!searchTerm) return true;
                const st = p.students;
                if (!st) return false;
                const name = `${st.nachname} ${st.vorname}`.toLowerCase();
                return name.includes(searchTerm.toLowerCase());
              }).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <TrendingDown className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Noch keine Zahlungen erfasst
                </TableCell>
              </TableRow>
            ) : (
              payments.filter((p: any) => {
                if (!searchTerm) return true;
                const st = p.students;
                if (!st) return false;
                const name = `${st.nachname} ${st.vorname}`.toLowerCase();
                return name.includes(searchTerm.toLowerCase());
              }).map((p: any) => {
                const st = p.students;
                const allocations = allocationsByPayment.get(p.id) || [];
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {st ? formatStudentName(st.nachname, st.vorname, st.geburtsdatum) : "–"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(p.datum), "dd.MM.yyyy", { locale: de })}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2 py-0.5 text-xs font-medium text-foreground">
                        {ZAHLUNGSART_ICONS[p.zahlungsart as Zahlungsart]}
                        {ZAHLUNGSART_LABELS[p.zahlungsart as Zahlungsart]}
                      </span>
                    </TableCell>
                    <TableCell>
                      {allocations.length > 0 ? (
                        <div className="space-y-0.5">
                          {allocations.map((a: any) => (
                            <p key={a.id} className="text-xs text-muted-foreground">
                              {a.open_items?.beschreibung ?? "–"}{" "}
                              <span className="text-foreground font-medium">{eur(Number(a.betrag))}</span>
                            </p>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Freie Zahlung</span>
                      )}
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Zahlung erfassen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Schüler */}
            <div className="space-y-1.5">
              <Label>Schüler</Label>
              <StudentCombobox
                students={students}
                value={form.student_id}
                onValueChange={(v) => setForm((f) => ({ ...f, student_id: v, selectedOpenItems: [] }))}
                placeholder="Schüler wählen…"
              />
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

            {/* Offene Posten */}
            {form.student_id && openItemsForStudent.length > 0 && (() => {
              const betragNum = parseFloat(form.betrag) || 0;
              const selectedItems = openItemsForStudent
                .filter((oi: any) => form.selectedOpenItems.includes(oi.id))
                .sort((a: any, b: any) => new Date(a.datum).getTime() - new Date(b.datum).getTime());

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
                    {openItemsForStudent.map((oi: any) => {
                      const offen = Number(oi.betrag_gesamt) - Number(oi.betrag_bezahlt);
                      const checked = form.selectedOpenItems.includes(oi.id);
                      const alloc = allocMap.get(oi.id);
                      return (
                        <label key={oi.id} className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => {
                              setForm((f) => {
                                const newSelected = c
                                  ? [...f.selectedOpenItems, oi.id]
                                  : f.selectedOpenItems.filter((x) => x !== oi.id);
                                const summe = openItemsForStudent
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
                            <p className="text-sm font-semibold text-foreground">{eur(offen)}</p>
                            {checked && alloc != null && alloc > 0 && (
                              <p className="text-xs text-green-400">→ {eur(alloc)}</p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {form.selectedOpenItems.length > 0 && betragNum > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Verteilung: {eur(Array.from(allocMap.values()).reduce((s, v) => s + v, 0))} zugeordnet
                      {remaining > 0 && ` · ${eur(remaining)} Restbetrag`}
                    </p>
                  )}
                </div>
              );
            })()}

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
