import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Plus, Pencil, Check, X, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";

type Price = {
  id: string;
  created_at: string;
  bezeichnung: string;
  kategorie: string;
  preis: number;
  einheit: string | null;
  aktiv: boolean;
};

const defaultForm = {
  bezeichnung: "",
  kategorie: "",
  preis: "",
  einheit: "",
  aktiv: true,
};

const kategorieColors: Record<string, string> = {
  Fahrstunden: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Pflichtfahrten: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Theorie: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  Prüfungen: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Sonstiges: "bg-muted text-muted-foreground border-border",
};

const getBadgeClass = (kat: string) =>
  kategorieColors[kat] ?? "bg-muted text-muted-foreground border-border";

const Preisliste = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editPreis, setEditPreis] = useState("");
  const [editBezeichnung, setEditBezeichnung] = useState("");
  const [editEinheit, setEditEinheit] = useState("");

  const { data: prices = [], isLoading } = useQuery({
    queryKey: ["prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prices")
        .select("*")
        .order("kategorie")
        .order("bezeichnung");
      if (error) throw error;
      return data as Price[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: typeof defaultForm) => {
      const { error } = await supabase.from("prices").insert([{
        bezeichnung: values.bezeichnung,
        kategorie: values.kategorie,
        preis: parseFloat(values.preis) || 0,
        einheit: values.einheit || null,
        aktiv: values.aktiv,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prices"] });
      setOpen(false);
      setForm(defaultForm);
      setFormError("");
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: Partial<Price> & { id: string }) => {
      const { error } = await supabase
        .from("prices")
        .update(values)
        .eq("id", values.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prices"] });
      setEditId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prices"] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bezeichnung || !form.kategorie) {
      setFormError("Bezeichnung und Kategorie sind Pflichtfelder.");
      return;
    }
    createMutation.mutate(form);
  };

  const startEdit = (p: Price) => {
    setEditId(p.id);
    setEditPreis(p.preis.toString());
    setEditBezeichnung(p.bezeichnung);
    setEditEinheit(p.einheit ?? "");
  };

  const saveEdit = (p: Price) => {
    updateMutation.mutate({
      id: p.id,
      bezeichnung: editBezeichnung,
      preis: parseFloat(editPreis) || 0,
      einheit: editEinheit || null,
    });
  };

  const toggleAktiv = (p: Price) => {
    updateMutation.mutate({ id: p.id, aktiv: !p.aktiv });
  };

  // Group by Kategorie
  const grouped = prices.reduce<Record<string, Price[]>>((acc, p) => {
    if (!acc[p.kategorie]) acc[p.kategorie] = [];
    acc[p.kategorie].push(p);
    return acc;
  }, {});

  const totalAktiv = prices.filter((p) => p.aktiv).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Preisliste"
        description="Leistungen und Preise der Fahrschule"
        icon={DollarSign}
        action={
          <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Neue Leistung
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          ["Leistungen gesamt", prices.length],
          ["Aktiv", totalAktiv],
          ["Kategorien", Object.keys(grouped).length],
        ].map(([l, v]) => (
          <div key={String(l)} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xl font-bold text-foreground">{v}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      {/* Grouped tables */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="rounded-xl border border-border bg-card flex flex-col items-center justify-center py-16">
          <DollarSign className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Noch keine Leistungen angelegt.</p>
          <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />Erste Leistung anlegen
          </Button>
        </div>
      ) : (
        Object.entries(grouped).map(([kategorie, items]) => (
          <div key={kategorie} className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Category header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-secondary/30">
              <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getBadgeClass(kategorie)}`}>
                {kategorie}
              </span>
              <span className="text-xs text-muted-foreground">{items.length} Leistungen</span>
            </div>

            {/* Column header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/50">
              <span>Bezeichnung</span>
              <span>Einheit</span>
              <span>Preis</span>
              <span />
            </div>

            {/* Rows */}
            {items.map((price) => {
              const isEditing = editId === price.id;
              return (
                <div
                  key={price.id}
                  className={`grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center px-5 py-3 border-b border-border/30 last:border-0 transition-colors ${
                    !price.aktiv ? "opacity-50" : "hover:bg-secondary/20"
                  }`}
                >
                  {/* Bezeichnung */}
                  <div className="min-w-0">
                    {isEditing ? (
                      <Input
                        className="h-7 text-sm"
                        value={editBezeichnung}
                        onChange={(e) => setEditBezeichnung(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm text-foreground truncate block">{price.bezeichnung}</span>
                    )}
                  </div>

                  {/* Einheit */}
                  <div>
                    {isEditing ? (
                      <Input
                        className="h-7 text-sm"
                        value={editEinheit}
                        onChange={(e) => setEditEinheit(e.target.value)}
                        placeholder="45min"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">{price.einheit ?? "–"}</span>
                    )}
                  </div>

                  {/* Preis */}
                  <div>
                    {isEditing ? (
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                        <Input
                          className="h-7 text-sm pl-6 font-medium"
                          value={editPreis}
                          onChange={(e) => setEditPreis(e.target.value)}
                          type="number"
                          step="0.01"
                        />
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-primary">
                        {price.preis.toFixed(2).replace(".", ",")} €
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-green-400 hover:text-green-300"
                          onClick={() => saveEdit(price)}
                          disabled={updateMutation.isPending}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setEditId(null)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title={price.aktiv ? "Deaktivieren" : "Aktivieren"}
                          onClick={() => toggleAktiv(price)}
                        >
                          {price.aktiv
                            ? <ToggleRight className="h-3.5 w-3.5 text-primary" />
                            : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />
                          }
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => startEdit(price)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive/60 hover:text-destructive"
                          onClick={() => deleteMutation.mutate(price.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}

      {/* New Leistung Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(defaultForm); setFormError(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Neue Leistung anlegen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="bezeichnung">Bezeichnung *</Label>
              <Input
                id="bezeichnung"
                placeholder="z. B. Fahrstunde 45 min"
                value={form.bezeichnung}
                onChange={(e) => setForm({ ...form, bezeichnung: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kategorie">Kategorie *</Label>
                <Input
                  id="kategorie"
                  placeholder="z. B. Fahrstunden"
                  value={form.kategorie}
                  onChange={(e) => setForm({ ...form, kategorie: e.target.value })}
                  list="kategorien-list"
                />
                <datalist id="kategorien-list">
                  {[...new Set(prices.map((p) => p.kategorie))].map((k) => (
                    <option key={k} value={k} />
                  ))}
                  {["Fahrstunden", "Pflichtfahrten", "Theorie", "Prüfungen", "Sonstiges"].map((k) => (
                    <option key={k} value={k} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="einheit">Einheit</Label>
                <Input
                  id="einheit"
                  placeholder="45min / pauschal"
                  value={form.einheit}
                  onChange={(e) => setForm({ ...form, einheit: e.target.value })}
                  list="einheit-list"
                />
                <datalist id="einheit-list">
                  {["45min", "90min", "pauschal", "pro Stunde"].map((e) => (
                    <option key={e} value={e} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preis">Preis (€) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                <Input
                  id="preis"
                  className="pl-7"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={form.preis}
                  onChange={(e) => setForm({ ...form, preis: e.target.value })}
                />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{formError}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setOpen(false); setForm(defaultForm); setFormError(""); }}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Speichern..." : "Anlegen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Preisliste;
