

## Bearbeitungsfunktion fuer alle Eintraege im Schuelerprofil

### Uebersicht
In jeder Sektion (Fahrstunden, Theorie, Pruefungen, Leistungen, Zahlungen) wird pro Eintrag ein Bearbeiten-Button (Stift-Icon) ergaenzt. Klick oeffnet einen Dialog mit den vorausgefuellten Daten, die dann geaendert und gespeichert werden koennen.

### Wichtig: Datenkonsistenz mit offenen Posten
Die Tabelle `open_items` wird nur bei INSERT/DELETE ueber Trigger aktualisiert -- es gibt keinen UPDATE-Trigger. Daher muss bei jeder Bearbeitung von Fahrstunden, Pruefungen und Leistungen der zugehoerige offene Posten (Beschreibung + Betrag) manuell mitaktualisiert werden.

### Aenderungen in FahrschuelerDetail.tsx

**1. Neue States**
- `editingLesson` / `editingTheory` / `editingExam` / `editingService` / `editingPayment` -- jeweils `null` oder das zu bearbeitende Objekt
- Separate Edit-Form-States (oder Wiederverwendung der bestehenden Form-States mit einem `isEditing`-Flag)

**2. Neue Update-Mutations (5 Stueck)**

a) `mutEditFahrstunde` -- UPDATE `driving_lessons` (typ, fahrzeug_typ, instructor_id, dauer_minuten, datum). Danach: neuen Preis/Einheiten via `.select()` zuruecklesen (Server-Trigger berechnet diese), dann `open_items` WHERE `referenz_id = lesson.id` mit neuem Betrag und neuer Beschreibung updaten.

b) `mutEditTheorie` -- UPDATE `theory_sessions` (lektion, instructor_id, datum). Kein open_item betroffen.

c) `mutEditPruefung` -- UPDATE `exams` (typ, fahrzeug_typ, instructor_id, datum, status, preis). Danach `open_items` WHERE `referenz_id = exam.id` updaten (Beschreibung + Betrag).

d) `mutEditLeistung` -- UPDATE `services` (bezeichnung, preis, status). Danach `open_items` WHERE `referenz_id = service.id` updaten (Beschreibung + Betrag).

e) `mutEditZahlung` -- UPDATE `payments` (betrag, zahlungsart, datum). Kein open_item direkt betroffen (Zahlungen haben keine open_items).

**3. UI je Sektion**
- Jede Zeile bekommt einen kleinen Stift-Button (Pencil-Icon, ghost variant)
- Klick setzt den jeweiligen `editing*`-State und oeffnet den Bearbeitungs-Dialog
- Dialog-Titel aendert sich zu "Fahrstunde bearbeiten" etc.
- Speichern-Button fuehrt die Update-Mutation aus
- Nach Erfolg: alle relevanten Queries invalidieren (gleiche Keys wie beim Erstellen + `open_items`)

**4. Query-Invalidierung bei Updates**
Jede Update-Mutation invalidiert:
- Die eigene Tabelle (`driving_lessons`, `theory_sessions`, etc.)
- `open_items` (fuer Fahrstunden, Pruefungen, Leistungen)
- Globale Listen-Queries (z.B. `exams_all`, `services`)

### Technisches Detail: Open-Item-Sync

```typescript
// Beispiel fuer Fahrstunde-Update
const mutEditFahrstunde = useMutation({
  mutationFn: async (lesson: EditLessonData) => {
    const { data, error } = await supabase
      .from("driving_lessons")
      .update({ typ: lesson.typ, fahrzeug_typ: lesson.fahrzeug_typ, 
                instructor_id: lesson.instructor_id,
                dauer_minuten: lesson.dauer_minuten, 
                datum: new Date(lesson.datum).toISOString() })
      .eq("id", lesson.id)
      .select("preis, einheiten, dauer_minuten")
      .single();
    if (error) throw error;
    // Open Item synchronisieren
    await supabase.from("open_items")
      .update({ 
        betrag_gesamt: data.preis,
        beschreibung: `Fahrstunde ${data.dauer_minuten}min (${data.einheiten}E)`,
        datum: new Date(lesson.datum).toISOString()
      })
      .eq("referenz_id", lesson.id);
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["driving_lessons", id] });
    queryClient.invalidateQueries({ queryKey: ["driving_lessons"] });
    queryClient.invalidateQueries({ queryKey: ["open_items", id] });
    queryClient.invalidateQueries({ queryKey: ["open_items"] });
    setEditingLesson(null);
    toast({ title: "Fahrstunde aktualisiert" });
  },
});
```

### Keine Datenbank-Migrationen noetig
Alle UPDATE-Rechte (RLS-Policies) sind bereits fuer alle Tabellen vorhanden.

