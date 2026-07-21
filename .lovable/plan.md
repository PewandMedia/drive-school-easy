## Erweiterung Schnellerfassung

Zwei Ergänzungen in `src/pages/dashboard/Schnellerfassung.tsx`:

### 1. Neuer Tab „Prüfung"
Die Tab-Leiste wird von 2 auf 3 Spalten erweitert: **Fahrstunde | Zahlung | Prüfung**.

Formularfelder (analog zu `Pruefungen.tsx`):
- **Typ**: Theorie / Praxis (Radio/Select)
- **Datum** (sticky wie bisher)
- **Fahrlehrer** (nur bei Praxis Pflicht, bei Theorie ausgeblendet — bestehende Trigger-Logik `validate_exam_instructor` setzt Theorie automatisch auf NULL)
- **Fahrzeug** (nur bei Praxis, optional)
- **Ergebnis**: offen / bestanden / nicht bestanden (Default: offen)
- **Preis** (Vorbelegung aus `prices`-Tabelle wie in Pruefungen.tsx: `pruefung_theorie` / `pruefung_praxis`)

Speichern schreibt in `exams`. Der bestehende Trigger `create_open_item_for_exam` legt automatisch den offenen Posten an — keine zusätzliche Logik nötig.

Nach dem Speichern: Toast, Formular zurücksetzen (Datum & Lehrer bleiben sticky), Historie & Query-Cache invalidieren (`exams`, `open_items`).

### 2. Panel „Letzte Einträge" unter der Schülerliste (linke Spalte)
Unterhalb der Schülerliste eine neue Card mit den **letzten 10 Einträgen** (übergreifend über alle Schüler, session-weit):
- Icon je Typ (Fahrstunde / Zahlung / Prüfung)
- Schülername (Nachname, Vorname)
- Kurzbeschreibung (z. B. „90 min · 130 €", „50 € Barzahlung", „Theorieprüfung bestanden")
- Relative Zeit („vor 2 Min")
- Klick auf Eintrag → wählt den entsprechenden Schüler in der linken Liste aus

Die Liste wird lokal im Component-State geführt (`recentEntries`) und bei jedem erfolgreichen `saveDrivingLesson` / `savePayment` / `saveExam` Mutation-Success vorne eingefügt (max. 10). Kein zusätzlicher DB-Fetch nötig — es sind die Einträge, die in dieser Session per Schnellerfassung angelegt wurden.

### Technische Details
- Neuer State: `activeTab: 'fahrstunde' | 'zahlung' | 'pruefung'`, `examForm`, `stickyExamDate`, `recentEntries[]`.
- Neue Mutation `saveExam` analog zu `saveDrivingLesson`.
- Vehicles-Query hinzufügen (bereits als Muster in Pruefungen.tsx vorhanden).
- Preis-Vorbelegung: einmalige Query auf `prices` (kategorie `pruefung_theorie`/`pruefung_praxis`).
- Keine DB-Migrationen erforderlich — `exams`-Tabelle und Trigger existieren bereits.
