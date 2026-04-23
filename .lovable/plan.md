

## Tagesabrechnung vereinfachen + falsche Einreichungsdaten bereinigen

### Probleme
1. Alle bestehenden Zahlungen haben `einreichungsdatum = 23.04.2026` als Default (falsch — wurde automatisch beim Insert gesetzt)
2. Der Modus-Umschalter "Einreichung / Einnahme" wird nicht gebraucht — es soll nur nach Einreichungsdatum gefiltert werden

### Lösung

**1. Datenbereinigung (UPDATE statt Migration)**

Für ALLE bestehenden Zahlungen `einreichungsdatum = datum` setzen, damit das Einreichungsdatum auf den ursprünglichen Einnahmetag zeigt — statt fälschlich auf den 23.04.2026.

```sql
UPDATE payments SET einreichungsdatum = datum;
```

Damit verschwindet die falsche "23.04.2026"-Häufung. In Zukunft wird `einreichungsdatum` beim Erfassen einer neuen Zahlung korrekt vom Nutzer eingetragen (Default = heute, wie im Erfassungsdialog).

**2. Default-Wert der Spalte entfernen**

Die Spalte `einreichungsdatum` hat aktuell `DEFAULT now()` — das war der Auslöser. Diesen Default entfernen, damit nur das eingetragen wird, was die App explizit setzt:

```sql
ALTER TABLE payments ALTER COLUMN einreichungsdatum DROP DEFAULT;
```

**3. Tagesabrechnung-UI vereinfachen (`Tagesabrechnung.tsx`)**

- Radio-Group "Filtern nach: Einreichung / Einnahme" komplett entfernen
- State `filterModus` und `activeModus` entfernen
- Query filtert immer auf `einreichungsdatum`
- PageHeader-Description fix: "Täglicher Kassenbericht (nach Einreichungsdatum im Büro)"
- Datum-Label fix: "Einreichungsdatum"
- Empty-State-Text fix: "Für dieses Datum wurden keine Zahlungen im Büro eingereicht."
- PDF-Header fix: "Einreichungsdatum (Büro): …"

### Verhalten nach der Änderung

| Fall | Anzeige in Tagesabrechnung 23.04. |
|---|---|
| Bestehende Zahlung (Einnahme 20.04.) | Einreichung jetzt = 20.04. → erscheint unter 20.04., NICHT mehr unter 23.04. |
| Neue Zahlung heute eingetragen | Einreichung = heute (vom User gesetzt), erscheint korrekt |
| Neue Zahlung mit zurückdatiertem Einreichungsdatum | Erscheint am eingestellten Einreichungstag |

### Technische Details

| Datei | Änderung |
|---|---|
| Daten-Update (insert tool) | `UPDATE payments SET einreichungsdatum = datum` — bereinigt alle 200+ falsch markierten Datensätze |
| Migration | `ALTER TABLE payments ALTER COLUMN einreichungsdatum DROP DEFAULT` — verhindert künftige Auto-Defaults |
| `Tagesabrechnung.tsx` | RadioGroup-Block entfernen, `filterModus`/`activeModus` States raus, Query/Labels/PDF-Header auf "Einreichung" hartkodieren |

