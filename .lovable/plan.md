

## Fahrlehrer aus Screenshot in die Datenbank eintragen

### Datenbank-Insert

7 Fahrlehrer werden in die `instructors`-Tabelle eingefuegt (alle aktiv):

| Vorname | Nachname | Rolle |
|---------|----------|-------|
| Ilkay | (Nachname unbekannt) | Inhaber und Fahrlehrer |
| Azad | (Nachname unbekannt) | Fahrlehrer |
| Lukman | (Nachname unbekannt) | Fahrlehrer |
| Alan | (Nachname unbekannt) | Fahrlehrer |
| Burak | (Nachname unbekannt) | Fahrlehrer |
| Derya | (Nachname unbekannt) | Fahrlehrerin |
| Renas | (Nachname unbekannt) | Fahrlehreranwaerter |

### Hinweis

Im Screenshot sind nur die Vornamen sichtbar. Da die `nachname`-Spalte ein Pflichtfeld ist (NOT NULL), werde ich den Vornamen als Platzhalter auch fuer den Nachnamen verwenden. Du kannst die Nachnamen spaeter in der Datenbank aktualisieren.

### Technische Details

- SQL INSERT in die `instructors`-Tabelle mit `vorname`, `nachname`, `aktiv = true`
- Keine Code-Aenderungen noetig -- die Fahrlehrer erscheinen automatisch im Dropdown der Pruefungseintragung und auf der Fahrlehrer-Statistik-Seite

