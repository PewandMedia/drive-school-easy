
## Benutzerverwaltung vereinfachen + Historie-Button

### Was wird entfernt
- Spalte "Letzter Login"
- Spalte "Status" (Aktiv/Inaktiv Badge)
- Aktiv/Deaktiv-Button (UserX/UserCheck) aus der Aktionen-Spalte
- `toggleAktivMutation` (wird nicht mehr gebraucht)

### Was wird hinzugefuegt
Ein **Historie-Button** (z.B. History-Icon) pro Benutzer in der Aktionen-Spalte. Beim Klick oeffnet sich ein Dialog, der alle Aktivitaeten dieses Benutzers aus `activity_log` anzeigt -- gefiltert nach `user_id`.

Der Dialog zeigt eine chronologische Liste mit:
- Aktion (erstellt/bearbeitet/geloescht)
- Typ (Fahrstunde, Theorie, Pruefung, Zahlung, Leistung)
- Datum und Uhrzeit
- Optional: Details

So kann der Admin direkt in der Benutzerverwaltung sehen, was z.B. Jiyan oder Dilan alles eingetragen hat, ohne in jede einzelne Seite gehen zu muessen.

### Neue Tabellenstruktur

| Name | E-Mail | Rolle | Aktionen |
|------|--------|-------|----------|
| Dilan | dilan@... | Sekretaerin | [Passwort] [Historie] |
| Jiyan | jiyan@... | Sekretaerin | [Passwort] [Historie] |

### Technische Umsetzung

**Datei: `src/pages/dashboard/Benutzerverwaltung.tsx`**

1. Entfernen:
   - Import von `Badge`, `UserX`, `UserCheck`
   - `toggleAktivMutation`
   - Spalten "Letzter Login" und "Status" aus Header und Body
   - Aktiv/Deaktiv-Button
   - `colSpan` von 6 auf 4 anpassen

2. Hinzufuegen:
   - Import von `History` Icon aus lucide-react
   - Import von `ScrollArea` fuer lange Listen
   - State: `historieOpen` (boolean) und `historieUserId` / `historieUserName` (string)
   - Historie-Button in der Aktionen-Spalte
   - Neuer Dialog "Historie von [Name]":
     - Laedt `activity_log` gefiltert nach `user_id = historieUserId`
     - Sortiert nach `created_at DESC` (neueste zuerst)
     - Zeigt: Datum/Uhrzeit, Aktion, Typ, Details
     - ScrollArea fuer lange Listen
     - Hinweis wenn keine Eintraege vorhanden

### Keine Datenbank-Aenderungen noetig
Die `activity_log`-Tabelle hat bereits `user_id` -- der Admin kann per SELECT darauf zugreifen (RLS erlaubt SELECT fuer Admins).
