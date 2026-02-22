
## Schaltstunden nur fuer B197-Schueler

### Uebersicht
Der Schaltstunden-Bereich wird so eingeschraenkt, dass ausschliesslich Fahrschueler mit `fuehrerscheinklasse = 'B197'` angezeigt und beruecksichtigt werden. Keine Datenbank-Aenderungen noetig -- das Feld `fuehrerscheinklasse` existiert bereits auf der `students`-Tabelle mit den Werten B, B78, B197.

### Aenderung: `src/pages/dashboard/Schaltstunden.tsx`

**1. Students-Query: Nur B197 laden (Zeile 76-84)**
- Filter `.eq("fuehrerscheinklasse", "B197")` zur Supabase-Query hinzufuegen
- Damit werden nur B197-Schueler im Dropdown und in der Tabelle angezeigt
- Die Filterung erfolgt datenbankseitig (nicht nur Frontend)

**2. Driving-Lessons-Query: Nur B197-Schueler (Zeile 88-98)**
- Die `fuehrerscheinklasse` ist auf der `students`-Tabelle, nicht auf `driving_lessons`
- Loesung: Erst B197-Student-IDs sammeln, dann Fahrstunden nur fuer diese IDs laden
- Alternativ: Join ueber Supabase `.in("student_id", b197StudentIds)` Filter

**3. Statistiken (Zeilen 152-179)**
- Bleiben unveraendert, da sie bereits auf den gefilterten Daten basieren
- Durch die eingeschraenkte Query kommen nur B197-Schueler-Daten an

**4. Modal "Stunde planen" (Zeilen 199-217)**
- Dropdown zeigt bereits nur die geladenen `students` -- da diese jetzt auf B197 gefiltert sind, erscheinen automatisch nur B197-Schueler

**5. Beschreibungstext aktualisieren (Zeile 185)**
- Von "Schaltstunden (Klasse A/manuelle Fahrzeuge) verwalten" zu "Schaltstunden fuer B197-Schueler (10 Pflichteinheiten)"

### Technische Umsetzung

```text
// Schritt 1: Students-Query mit B197-Filter
students query + .eq("fuehrerscheinklasse", "B197")

// Schritt 2: Driving-Lessons mit student_id-Filter
- Query haengt von students ab (enabled: students.length > 0)
- .in("student_id", b197StudentIds) filtert serverseitig
```

### Zusammenfassung

| Stelle | Aenderung |
|--------|-----------|
| Students-Query | `.eq("fuehrerscheinklasse", "B197")` hinzufuegen |
| Lessons-Query | `.in("student_id", b197Ids)` hinzufuegen, abhaengig von Students |
| Beschreibung | Text auf B197 aktualisieren |
| Statistiken | Keine Aenderung (basieren auf gefilterten Daten) |
| Modal | Keine Aenderung (nutzt gefilterte Students-Liste) |

Nur eine Datei betroffen: `Schaltstunden.tsx`. Alles andere (FahrschuelerDetail, Fahrstunden) bleibt unveraendert.
