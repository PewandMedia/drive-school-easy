

## Bearbeitungsbuttons in allen Einzelbereichen

### Uebersicht
In allen 6 Einzelseiten (Fahrstunden, Theorie, Schaltstunden, Pruefungen, Leistungen, Zahlungen) wird pro Zeile ein Stift-Button ergaenzt, der einen Bearbeitungsdialog oeffnet. Die Logik orientiert sich am bestehenden Muster in FahrschuelerDetail.tsx.

### Betroffene Dateien und Aenderungen

**1. Fahrstunden.tsx**
- Neuer State: `editingLesson` (null oder DrivingLesson-Objekt)
- Neuer State: `editForm` mit typ, fahrzeug_typ, vehicle_id, instructor_id, dauer_minuten, datum
- Neue `updateMutation`: UPDATE `driving_lessons`, danach `.select()` fuer neuen Preis, dann `open_items` WHERE `referenz_id` manuell synchronisieren (Betrag + Beschreibung)
- Pencil-Button in `renderRow` neben dem Loeschen-Button
- Edit-Dialog mit denselben Feldern wie der Erstellen-Dialog (Typ, Fahrzeug, Fahrlehrer, Dauer, Datum)
- Query-Invalidierung: `driving_lessons`, `open_items`

**2. Theorie.tsx (src/pages/dashboard/Theorie.tsx)**
- Neuer State: `editingSession` (null oder TheorySession-Objekt)
- Neuer State: `editForm` mit lektion, instructor_id, datum
- Neue `updateMutation`: UPDATE `theory_sessions` (lektion, typ via lektionToTyp(), instructor_id, datum)
- Pencil-Button in `renderRow`
- Edit-Dialog mit Lektion-Select, Fahrlehrer-Select, Datum
- Kein open_items-Sync noetig (Theorie hat keine offenen Posten)

**3. Schaltstunden.tsx**
- Neuer State: `editingLesson` (null oder SchaltstundeRow)
- Neuer State: `editForm` mit typ, dauer_minuten, datum
- Neue `updateMutation`: UPDATE `driving_lessons` (typ, dauer_minuten, datum), danach `open_items` WHERE `referenz_id` synchronisieren
- Pencil-Button in `renderRow`
- Edit-Dialog mit Typ-Select, Dauer-Buttons, Datum

**4. Pruefungen.tsx**
- Neuer State: `editingExam` (null oder Exam-Objekt)
- Neuer State: `editForm` mit typ, fahrzeug_typ, instructor_id, datum, status, preis
- Neue `updateMutation`: UPDATE `exams`, danach `open_items` WHERE `referenz_id` synchronisieren (Beschreibung + Betrag)
- Pencil-Button pro Zeile (neben Status-Badge und Loeschen)
- Edit-Dialog mit allen Feldern (Typ, Fahrzeug, Fahrlehrer, Datum, Status, Preis)

**5. Leistungen.tsx**
- Neuer State: `editingService` (null oder Service-Objekt)
- Neuer State: `editForm` mit bezeichnung, preis, status
- Neue `updateMutation`: UPDATE `services`, danach `open_items` WHERE `referenz_id` synchronisieren (Beschreibung + Betrag)
- Pencil-Button pro Leistungszeile
- Edit-Dialog mit Bezeichnung, Preis, Status

**6. Zahlungen.tsx**
- Neuer State: `editingPayment` (null oder Payment-Objekt)
- Neuer State: `editForm` mit betrag, zahlungsart, datum
- Neue `updateMutation`: UPDATE `payments` (betrag, zahlungsart, datum)
- Pencil-Button in `renderRow`
- Edit-Dialog mit Betrag, Zahlungsart, Datum
- Kein open_items-Sync noetig (Zahlungen haben keine direkte open_items-Referenz)

### Datenkonsistenz (kritisch)

Fuer Fahrstunden, Schaltstunden, Pruefungen und Leistungen muss nach jedem Update die `open_items`-Tabelle manuell synchronisiert werden, da kein UPDATE-Trigger existiert:

```text
1. driving_lessons UPDATE -> open_items.betrag_gesamt = neuer Preis, beschreibung aktualisieren
2. exams UPDATE          -> open_items.betrag_gesamt = neuer Preis, beschreibung aktualisieren
3. services UPDATE       -> open_items.betrag_gesamt = neuer Preis, beschreibung aktualisieren
```

Nach jedem erfolgreichen Update werden alle relevanten Query-Keys invalidiert, damit sowohl die Einzelseite als auch das Schuelerprofil (FahrschuelerDetail) immer aktuelle Daten anzeigt.

### UI-Muster (einheitlich)
- Jede Zeile bekommt einen `Pencil`-Icon-Button (ghost, size="icon") links neben dem Loeschen-Button
- Klick oeffnet einen Dialog mit vorausgefuellten Feldern
- Dialog-Titel: "[Typ] bearbeiten" (z.B. "Fahrstunde bearbeiten")
- Speichern-Button fuehrt die Update-Mutation aus
- Nach Erfolg: Dialog schliesst, Toast-Nachricht, Queries werden invalidiert

### Keine Datenbank-Migrationen noetig
Alle UPDATE-RLS-Policies sind bereits fuer alle Tabellen vorhanden.

