

## Tagesabrechnung nach Einreichungsdatum + Fahrlehrer-Zuordnung

Aktuell wird die Tagesabrechnung nach dem Zahlungsdatum (`datum`) gefiltert. Das Feld `einreichungsdatum` existiert bereits in der `payments`-Tabelle, wird aber nirgendwo genutzt. Es fehlt außerdem eine Fahrlehrer-Zuordnung pro Zahlung.

### Änderungen

**1. Datenbank-Migration**
- Spalte `instructor_id uuid` (nullable) zur Tabelle `payments` hinzufügen
- Bestehende Zahlungen erhalten `einreichungsdatum = datum` als Fallback (Backfill-Update)

**2. Zahlung erfassen (`Zahlungen.tsx` und `FahrschuelerDetail.tsx`)**

Im "Zahlung erfassen"-Dialog zwei neue Felder:
- **Einnahmedatum beim Fahrlehrer** (= bisheriges `datum`-Feld, Beschriftung anpassen)
- **Einreichungsdatum im Büro** (default: heute, separates Datums-Feld)
- **Fahrlehrer** (Dropdown aus `instructors_active`, optional — nur relevant für Bar-/EC-Übergaben durch Fahrlehrer)

Bearbeiten-Dialog erhält dieselben drei Felder.

**3. Tagesabrechnung (`Tagesabrechnung.tsx`)**

Logik:
- Filter wechselt von `datum` auf `einreichungsdatum` (mit COALESCE-Fallback auf `datum` für Altdaten)
- Query lädt zusätzlich `einreichungsdatum`, `instructor_id`, `instructors(vorname, nachname)`

Tabelle erhält neue Spalten:
| Datum | Schüler | Verwendungszweck | Fahrlehrer | Zahlungsart | Einnahme am | Einreichung am | Betrag |

- "Einnahme am" = `datum` (originaler Tag der Geldannahme)
- "Einreichung am" = `einreichungsdatum` (Tag der Bürobgabe — das Filterkriterium)
- "Fahrlehrer" = Name aus `instructors`-Join, "–" falls keiner zugeordnet

Print/PDF-Export wird entsprechend erweitert (gleiche Spalten).

**4. Memory-Update**
Die alte Memory-Notiz (`features/tagesabrechnung-kassenbericht`) besagt, dass kein Einreichungsdatum verwendet wird — diese wird in der Implementierung implizit überschrieben durch das neue Verhalten.

### Beispiel-Verhalten
- Fahrlehrer kassiert am 15.03. 100 € → speichert "Einnahmedatum: 15.03., Einreichungsdatum: 17.03., Fahrlehrer: Müller"
- Tagesabrechnung vom 17.03. zeigt diesen Eintrag mit Hinweis "Einnahme am 15.03." und Spalte "Fahrlehrer: Müller"

### Technische Details

| Datei | Änderung |
|---|---|
| Migration | `ALTER TABLE payments ADD COLUMN instructor_id uuid`; Backfill `einreichungsdatum = datum WHERE einreichungsdatum IS NULL` |
| `Zahlungen.tsx` | Form um `einreichungsdatum` + `instructor_id` erweitern; Insert/Update mitschreiben; Edit-Dialog ebenso |
| `FahrschuelerDetail.tsx` | Gleiche Erweiterung für `mutZahlung` und `mutEditZahlung` |
| `Tagesabrechnung.tsx` | Query: `einreichungsdatum, instructor_id, instructors(vorname, nachname)` joinen; Filter auf `COALESCE(einreichungsdatum, datum)`; Tabelle + Print um Spalten "Fahrlehrer", "Einnahme am", "Einreichung am" erweitern |
| Default-Wert | Beim Erfassen: `einreichungsdatum = heute`, `datum = heute` (Fahrlehrer kann zurückdatieren) |

