import { useState } from "react";
import { CreditCard, Plus, Trash2, TrendingDown, Banknote, Landmark, Search, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ActivityInfoButton from "@/components/ActivityInfoButton";
import { formatStudentName } from "@/lib/formatStudentName";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "@/components/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "@/lib/fetchAllRows";
import { format, startOfMonth, endOfMonth, isToday } from "date-fns";
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

type Zahlungsart = "bar" | "ec" | "ueberweisung";

type PaymentForm = {
  student_id: string;
  betrag: string;
  zahlungsart: Zahlungsart;
  datum: string;
  selectedOpenItems: string[];
  istGutschrift: boolean;
  gutschriftNotiz: string;
};

const defaultForm = (): PaymentForm => ({
  student_id: "",
  betrag: "",
  zahlungsart: "bar",
  datum: new Date().toISOString().slice(0, 10),
  selectedOpenItems: [],
  istGutschrift: false,
  gutschriftNotiz: "",
});

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

const Zahlungen = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PaymentForm>(defaultForm());
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleOlderCount, setVisibleOlderCount] = useState(10);
  const [editingPayment, setEditingPayment] = useState<any | null>(null);
  const [editPaymentForm, setEditPaymentForm] = useState({ betrag: "", zahlungsart: "bar" as Zahlungsart, datum: "" });
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const qc = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: () => fetchAllRows(supabase.from("payments").select("*, students(vorname, nachname, geburtsdatum)").order("datum", { ascending: false })) as Promise<any[]>,
  });

  const { data: allAllocations = [] } = useQuery({
    queryKey: ["payment_allocations_all"],
    queryFn: () => fetchAllRows(supabase.from("payment_allocations").select("*, open_items(beschreibung, typ, datum)") as any) as Promise<any[]>,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students_list"],
    queryFn: () => fetchAllRows(supabase.from("students").select("id, vorname, nachname, geburtsdatum").order("nachname")),
  });

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const rawBetrag = parseFloat(form.betrag) || 0;
      const betrag = form.istGutschrift ? -Math.abs(rawBetrag) : rawBetrag;
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .insert({
          student_id: form.student_id,
          betrag,
          zahlungsart: form.zahlungsart,
          datum: new Date(form.datum).toISOString(),
          einreichungsdatum: new Date(form.einreichungsdatum).toISOString(),
        })
        .select("id")
        .single();
      if (paymentError) throw paymentError;

      if (form.istGutschrift) {
        const { error: oiError } = await supabase.from("open_items").insert({
          student_id: form.student_id,
          typ: "gutschrift",
          referenz_id: paymentData.id,
          datum: new Date(form.datum).toISOString(),
          beschreibung: form.gutschriftNotiz ? `Gutschrift – ${form.gutschriftNotiz}` : "Gutschrift",
          betrag_gesamt: betrag,
          status: "bezahlt",
        } as any);
        if (oiError) throw oiError;
      } else if (form.selectedOpenItems.length > 0) {
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
      return paymentData;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["payment_allocations_all"] });
      qc.invalidateQueries({ queryKey: ["open_items_student", form.student_id] });
      qc.invalidateQueries({ queryKey: ["open_items"] });
      toast({ title: form.istGutschrift ? "Gutschrift gespeichert" : "Zahlung gespeichert" });
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
      return id;
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

  const updatePaymentMutation = useMutation({
    mutationFn: async (vals: { id: string; betrag: string; zahlungsart: Zahlungsart; datum: string }) => {
      const { error } = await supabase.from("payments").update({
        betrag: parseFloat(vals.betrag) || 0,
        zahlungsart: vals.zahlungsart,
        datum: new Date(vals.datum).toISOString(),
      }).eq("id", vals.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["payment_allocations_all"] });
      qc.invalidateQueries({ queryKey: ["open_items"] });
      setEditingPayment(null);
      toast({ title: "Zahlung aktualisiert" });
    },
    onError: (e: Error) => { toast({ title: "Fehler", description: e.message, variant: "destructive" }); },
  });

  // Stats
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

  const allocationsByPayment = new Map<string, any[]>();
  for (const alloc of allAllocations) {
    const list = allocationsByPayment.get(alloc.payment_id) || [];
    list.push(alloc);
    allocationsByPayment.set(alloc.payment_id, list);
  }

  // Search filter
  const searchFiltered = payments.filter((p: any) => {
    if (!searchTerm) return true;
    const st = p.students;
    if (!st) return false;
    const name = `${st.nachname} ${st.vorname}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  // Today / older split
  const todayPayments = searchFiltered.filter((p: any) => isToday(new Date(p.datum)));
  const olderPayments = searchFiltered.filter((p: any) => !isToday(new Date(p.datum)));
  const visibleOlder = olderPayments.slice(0, visibleOlderCount);
  const remainingOlder = olderPayments.length - visibleOlderCount;

  const renderRow = (p: any) => {
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
          {Number(p.betrag) < 0 ? (
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium italic">Gutschrift</span>
          ) : allocations.length > 0 ? (
            <div className="space-y-0.5">
              {allocations.map((a: any) => (
                <p key={a.id} className="text-xs text-muted-foreground">
                  {a.open_items?.beschreibung ?? "–"}{" "}
                  <span className="text-foreground font-medium">{eur(Number(a.betrag))}</span>
                </p>
              ))}
            </div>
          ) : (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium italic">Vorauszahlung / Guthaben</span>
          )}
        </TableCell>
        <TableCell className={`text-right font-semibold ${Number(p.betrag) < 0 ? "text-purple-600 dark:text-purple-400" : "text-green-600"}`}>
          {Number(p.betrag) < 0 ? "" : "+"}{eur(Number(p.betrag))}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => {
              setEditingPayment(p);
              setEditPaymentForm({ betrag: String(Math.abs(Number(p.betrag))), zahlungsart: p.zahlungsart as Zahlungsart, datum: new Date(p.datum).toISOString().slice(0, 10) });
            }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <ActivityInfoButton entityId={p.id} />
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(p.id)} disabled={deleteMutation.isPending}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

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
          <p className="text-2xl font-bold text-green-600">{eur(eingegangeneMonat)}</p>
          <p className="text-sm text-muted-foreground mt-1">Eingegangen (dieser Monat)</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-2xl font-bold text-foreground">{eur(gesamtEingegangen)}</p>
          <p className="text-sm text-muted-foreground mt-1">Gesamt eingegangen</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {eur(Math.abs(payments.filter((p: any) => Number(p.betrag) < 0).reduce((s: number, p: any) => s + Number(p.betrag), 0)))}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Gutschriften</p>
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
            ) : todayPayments.length === 0 && olderPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <TrendingDown className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Heute noch keine Zahlungen erfasst
                </TableCell>
              </TableRow>
            ) : (
              <>
                {todayPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-sm text-muted-foreground">
                      Heute noch keine Zahlungen erfasst
                    </TableCell>
                  </TableRow>
                ) : (
                  todayPayments.map(renderRow)
                )}
                {visibleOlder.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-2 text-xs text-muted-foreground bg-secondary/30">
                      Ältere Einträge
                    </TableCell>
                  </TableRow>
                )}
                {visibleOlder.map(renderRow)}
              </>
            )}
          </TableBody>
        </Table>

        {remainingOlder > 0 && (
          <div className="p-3 border-t border-border text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleOlderCount((c) => c + 10)}
            >
              Weitere {Math.min(10, remainingOlder)} von {olderPayments.length} anzeigen
            </Button>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(defaultForm()); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.istGutschrift ? "Gutschrift erfassen" : "Zahlung erfassen"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={form.istGutschrift}
                onCheckedChange={(c) => setForm((f) => ({ ...f, istGutschrift: !!c, selectedOpenItems: [] }))}
              />
              <span className="text-sm font-medium text-foreground">Gutschrift</span>
            </label>

            <div className="space-y-1.5">
              <Label>Schüler</Label>
              <StudentCombobox
                students={students}
                value={form.student_id}
                onValueChange={(v) => setForm((f) => ({ ...f, student_id: v, selectedOpenItems: [] }))}
                placeholder="Schüler wählen…"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Datum</Label>
              <Input
                type="date"
                value={form.datum}
                onChange={(e) => setForm((f) => ({ ...f, datum: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Einreichungsdatum (Büro)</Label>
              <Input
                type="date"
                value={form.einreichungsdatum}
                onChange={(e) => setForm((f) => ({ ...f, einreichungsdatum: e.target.value }))}
              />
            </div>

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

            {form.istGutschrift && (
              <div className="space-y-1.5">
                <Label>Notiz (optional)</Label>
                <Textarea
                  placeholder="Grund für die Gutschrift…"
                  value={form.gutschriftNotiz}
                  onChange={(e) => setForm((f) => ({ ...f, gutschriftNotiz: e.target.value }))}
                  className="min-h-[60px]"
                />
              </div>
            )}

            {!form.istGutschrift && form.student_id && openItemsForStudent.length > 0 && (() => {
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
                        <label key={oi.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/30 cursor-pointer transition-colors">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => {
                              setForm((f) => ({
                                ...f,
                                selectedOpenItems: c
                                  ? [...f.selectedOpenItems, oi.id]
                                  : f.selectedOpenItems.filter((x) => x !== oi.id),
                              }));
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{oi.beschreibung}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(oi.datum), "dd.MM.yyyy", { locale: de })} · Offen: {eur(offen)}
                            </p>
                          </div>
                          {checked && alloc !== undefined && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {eur(alloc)}
                            </Badge>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

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

      {/* Edit Payment Dialog */}
      <Dialog open={!!editingPayment} onOpenChange={(v) => { if (!v) setEditingPayment(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Zahlung bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Datum</Label>
              <Input type="date" value={editPaymentForm.datum} onChange={(e) => setEditPaymentForm((f) => ({ ...f, datum: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Zahlungsart</Label>
              <Select value={editPaymentForm.zahlungsart} onValueChange={(v) => setEditPaymentForm((f) => ({ ...f, zahlungsart: v as Zahlungsart }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(ZAHLUNGSART_LABELS) as [Zahlungsart, string][]).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Betrag (€)</Label>
              <Input type="number" step="0.01" min="0.01" value={editPaymentForm.betrag} onChange={(e) => setEditPaymentForm((f) => ({ ...f, betrag: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingPayment(null)}>Abbrechen</Button>
              <Button disabled={updatePaymentMutation.isPending} onClick={() => {
                if (editingPayment) {
                  const isGutschrift = Number(editingPayment.betrag) < 0;
                  updatePaymentMutation.mutate({
                    id: editingPayment.id,
                    betrag: isGutschrift ? String(-Math.abs(parseFloat(editPaymentForm.betrag))) : editPaymentForm.betrag,
                    zahlungsart: editPaymentForm.zahlungsart,
                    datum: editPaymentForm.datum,
                  });
                }
              }}>
                {updatePaymentMutation.isPending ? "Speichern…" : "Speichern"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Zahlungen;
