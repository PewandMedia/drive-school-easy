

## Anmeldedatum-Feld im "Neuer Fahrschueler"-Dialog hinzufuegen

### Was wird gemacht
Ein neues Datumsfeld "Anmeldedatum" wird im Erstellen-Dialog fuer Fahrschueler hinzugefuegt. Dieses Feld setzt das `created_at` des Schuelers auf das eingegebene Datum (Standard: heute).

### Aenderung in Fahrschueler.tsx

1. **defaultForm erweitern**: Neues Feld `anmeldedatum` mit Default `new Date()` und separater `anmeldedatumText` State (wie bei Geburtsdatum).

2. **Formular-UI**: Neues Datumsfeld mit Kalender-Picker + Texteingabe (gleicher Stil wie Geburtsdatum), platziert im Grid neben einem bestehenden Feld (z.B. neben Adresse oder als eigene Zeile).

3. **createMutation anpassen**: Beim Insert wird `created_at` auf das gewaehlte Anmeldedatum gesetzt:
   ```
   created_at: form.anmeldedatum ? form.anmeldedatum.toISOString() : new Date().toISOString()
   ```

### Keine Datenbank-Migration noetig
`created_at` ist bereits optional beim Insert und kann frei gesetzt werden.

