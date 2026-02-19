import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Search, ChevronRight, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";

type Student = {
  id: string;
  created_at: string;
  vorname: string;
  nachname: string;
  telefon: string | null;
  email: string | null;
  adresse: string | null;
  fuehrerscheinklasse: "B" | "B78" | "B197";
  ist_umschreiber: boolean;
  status: string | null;
};

const klasseColors: Record<string, string> = {
  B: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  B78: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  B197: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};

const defaultForm = {
  vorname: "",
  nachname: "",
  email: "",
  telefon: "",
  adresse: "",
  fuehrerscheinklasse: "B" as "B" | "B78" | "B197",
  ist_umschreiber: false,
  status: "",
};

const Fahrschueler = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState("");

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("nachname", { ascending: true });
      if (error) throw error;
      return data as Student[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: typeof defaultForm) => {
      const { error } = await supabase.from("students").insert([
        {
          vorname: values.vorname,
          nachname: values.nachname,
          email: values.email || null,
          telefon: values.telefon || null,
          adresse: values.adresse || null,
          fuehrerscheinklasse: values.fuehrerscheinklasse,
          ist_umschreiber: values.ist_umschreiber,
          status: values.status || null,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setOpen(false);
      setForm(defaultForm);
      setFormError("");
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.vorname.toLowerCase().includes(q) ||
      s.nachname.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.fuehrerscheinklasse.toLowerCase().includes(q)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vorname || !form.nachname) {
      setFormError("Vor- und Nachname sind Pflichtfelder.");
      return;
    }
    setFormError("");
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fahrschüler"
        description="Alle angemeldeten Fahrschüler verwalten"
        icon={Users}
        action={
          <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Neuer Schüler
          </Button>
        }
      />

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Schüler suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center text-sm text-muted-foreground">
          {filtered.length} Schüler
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <button className="flex items-center gap-1 text-left hover:text-foreground transition-colors">
            Name <ArrowUpDown className="h-3 w-3" />
          </button>
          <span>Klasse</span>
          <span>Umschreiber</span>
          <span>Saldo</span>
          <span />
        </div>

        {/* Rows */}
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-secondary/40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              {search ? "Kein Schüler gefunden." : "Noch keine Fahrschüler eingetragen."}
            </p>
            {!search && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-2"
                onClick={() => setOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Ersten Schüler hinzufügen
              </Button>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((student) => (
              <button
                key={student.id}
                onClick={() => navigate(`/dashboard/fahrschueler/${student.id}`)}
                className="w-full grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 border-b border-border/50 last:border-0 hover:bg-secondary/40 transition-colors text-left group"
              >
                {/* Name */}
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {student.nachname}, {student.vorname}
                  </p>
                  {student.email && (
                    <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                  )}
                </div>

                {/* Klasse */}
                <div>
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${klasseColors[student.fuehrerscheinklasse]}`}
                  >
                    Klasse {student.fuehrerscheinklasse}
                  </span>
                </div>

                {/* Umschreiber */}
                <div>
                  {student.ist_umschreiber ? (
                    <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-semibold text-xs">
                      Umschreiber
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">–</span>
                  )}
                </div>

                {/* Saldo */}
                <div>
                  <span className="text-sm font-medium text-foreground">0,00 €</span>
                </div>

                {/* Arrow */}
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New Student Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neuer Fahrschüler</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vorname">Vorname *</Label>
                <Input
                  id="vorname"
                  placeholder="Max"
                  value={form.vorname}
                  onChange={(e) => setForm({ ...form, vorname: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nachname">Nachname *</Label>
                <Input
                  id="nachname"
                  placeholder="Mustermann"
                  value={form.nachname}
                  onChange={(e) => setForm({ ...form, nachname: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="max@example.de"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefon">Telefon</Label>
                <Input
                  id="telefon"
                  placeholder="+49 123 456789"
                  value={form.telefon}
                  onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Führerscheinklasse *</Label>
                <Select
                  value={form.fuehrerscheinklasse}
                  onValueChange={(v) =>
                    setForm({ ...form, fuehrerscheinklasse: v as "B" | "B78" | "B197" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B">Klasse B</SelectItem>
                    <SelectItem value="B78">Klasse B78</SelectItem>
                    <SelectItem value="B197">Klasse B197</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                placeholder="Musterstraße 1, 12345 Musterstadt"
                value={form.adresse}
                onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                placeholder="z. B. Aktiv, Pausiert..."
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Umschreiber</p>
                <p className="text-xs text-muted-foreground">Hat bereits einen ausländischen Führerschein</p>
              </div>
              <Switch
                checked={form.ist_umschreiber}
                onCheckedChange={(v) => setForm({ ...form, ist_umschreiber: v })}
              />
            </div>

            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{formError}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setOpen(false); setForm(defaultForm); setFormError(""); }}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Speichern..." : "Schüler anlegen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Fahrschueler;
