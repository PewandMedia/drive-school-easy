

## Loeschfunktion fuer Pruefungen und Leistungen

### Was wird gemacht
Auf den Seiten "Pruefungen" und "Leistungen" wird jeweils ein Loeschen-Button (Papierkorb-Icon) pro Eintrag ergaenzt -- genau wie es bereits bei Fahrstunden und Theorie existiert.

### Aenderungen

**1. Pruefungen.tsx**
- Import `Trash2` von lucide-react hinzufuegen
- Eine `deleteMutation` ergaenzen, die den Eintrag aus `exams` loescht und danach `exams_all` sowie `open_items` Queries invalidiert
- In jeder Zeile neben dem Status-Badge und dem ActivityInfoButton einen Loeschen-Button (Trash2-Icon) rendern

**2. Leistungen.tsx**
- Import `Trash2` von lucide-react hinzufuegen
- Eine `deleteMutation` ergaenzen, die den Eintrag aus `services` loescht und danach `services` sowie `open_items` Queries invalidiert
- In jeder Zeile neben dem Status-Dropdown und dem ActivityInfoButton einen Loeschen-Button (Trash2-Icon) rendern

### Technische Details

Beide Mutations folgen dem bestehenden Muster aus `Fahrstunden.tsx`:

```typescript
const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) throw error;
  },
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ["exams_all"] });
    qc.invalidateQueries({ queryKey: ["open_items"] });
    toast({ title: "Prüfung gelöscht" });
  },
  onError: (e: Error) => {
    toast({ title: "Fehler", description: e.message, variant: "destructive" });
  },
});
```

Der Button wird als `variant="ghost" size="icon"` gerendert mit Trash2-Icon, identisch zum bestehenden Design in Fahrstunden/Theorie. Keine Datenbankmigrationen noetig -- die DELETE-Trigger und RLS-Policies existieren bereits.
