
## Schaltstunden als abgeleitete Ansicht aus Fahrstunden

### Uebersicht
Statt einer separaten `gear_lessons`-Tabelle werden Schaltstunden direkt aus `driving_lessons` abgeleitet: Jede Fahrstunde mit `fahrzeug_typ = 'schaltwagen'` und `typ != 'fehlstunde'` zaehlt automatisch als Schaltstunde. Die separate Erfassung entfaellt.

### Aenderung 1: `src/pages/dashboard/Schaltstunden.tsx` (kompletter Umbau)

**Datenquelle aendern:**
- Statt `gear_lessons`-Tabelle wird `driving_lessons` abgefragt mit Filter `fahrzeug_typ = 'schaltwagen'`
- In der UI werden nur Eintraege mit `typ != 'fehlstunde'` fuer Statistiken gezaehlt
- Typ-Spalte wird angezeigt (Uebungsstunde, Ueberlandfahrt, etc.)

**"Stunde planen"-Button:**
- Oeffnet ein vereinfachtes Formular, das eine Fahrstunde mit voreingestelltem `fahrzeug_typ = 'schaltwagen'` in `driving_lessons` anlegt
- Typ-Auswahl (Uebungsstunde, Sonderfahrten) wird angeboten
- Insert geht in `driving_lessons` statt `gear_lessons`

**Loeschen:**
- Loescht aus `driving_lessons` statt `gear_lessons`

**Statistiken:**
- Einheiten gesamt: Summe der `einheiten` aus gefilterten Fahrstunden (ohne Fehlstunden)
- Schueler abgeschlossen: basierend auf Einheiten >= 10 pro Schueler (ohne Fehlstunden)
- Durchschnittliche Dauer: alle Schaltwagen-Fahrstunden

**Query-Keys:**
- Werden auf `driving_lessons` umgestellt, damit Invalidierung korrekt funktioniert

### Aenderung 2: `src/pages/dashboard/FahrschuelerDetail.tsx`

**gear_lessons-Query entfernen (Zeilen 177-185):**
- Die Query auf `gear_lessons` wird entfernt
- `loadingGear` wird entfernt

**Schaltstunden-Berechnung umstellen (Zeilen 394-398):**
- `gearMinutesTotal` wird aus `lessons` (driving_lessons) berechnet:
  ```
  const schaltLessons = lessons.filter(
    l => l.fahrzeug_typ === "schaltwagen" && l.typ !== "fehlstunde"
  );
  const gearMinutesTotal = schaltLessons.reduce(
    (sum, l) => sum + l.dauer_minuten, 0
  );
  const gearHoursDone = Math.floor(gearMinutesTotal / 45);
  ```

**Schaltstunden-Erfassungs-Modal und Mutation entfernen (Zeilen 261-278):**
- `mutSchaltstunde`, `fsSchaltstunde`, `dlgSchaltstunde` State und zugehoeriges Dialog werden entfernt
- Stattdessen kann der bestehende Fahrstunden-Dialog genutzt werden (bereits vorhanden)

**isLoading anpassen (Zeile 364):**
- `loadingGear` aus der Bedingung entfernen

### Aenderung 3: `src/pages/dashboard/Fahrstunden.tsx`

Keine Aenderung noetig -- die Fahrstunden-Seite zeigt bereits alle Fahrstunden inklusive Schaltwagen.

### Zusammenfassung

| Datei | Was | Aenderung |
|-------|-----|-----------|
| `Schaltstunden.tsx` | Datenquelle | `gear_lessons` -> `driving_lessons` mit Filter `fahrzeug_typ = 'schaltwagen'` |
| `Schaltstunden.tsx` | Insert | Legt `driving_lessons`-Eintrag mit `fahrzeug_typ = 'schaltwagen'` an |
| `Schaltstunden.tsx` | Statistiken | Fehlstunden ausschliessen, Einheiten aus `einheiten`-Feld |
| `FahrschuelerDetail.tsx` | gear_lessons Query | Entfernen, stattdessen aus `lessons` (driving_lessons) ableiten |
| `FahrschuelerDetail.tsx` | Schaltstunden-Modal | Entfernen (Fahrstunden-Modal reicht) |
| `FahrschuelerDetail.tsx` | Progress-Berechnung | Aus `lessons` filtern statt `gearLessons` |

Die `gear_lessons`-Tabelle wird nicht geloescht (keine Datenverluste), aber nicht mehr genutzt.
