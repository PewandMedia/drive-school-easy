

## Standard-Leistungen in Preisliste anlegen

### Uebersicht
Die `prices`-Tabelle ist derzeit leer. Es muessen 5 Standard-Leistungen eingefuegt werden. Die Leistungen-Seite (`Leistungen.tsx`) hat bereits die komplette Dropdown-Logik mit automatischer Preisuebernahme implementiert -- es sind keine Code-Aenderungen noetig.

### Aenderung: Datenbank-Migration

Eine SQL-Migration fuegt die folgenden 5 Eintraege in die `prices`-Tabelle ein:

| Bezeichnung | Kategorie | Preis | Einheit | Aktiv |
|---|---|---|---|---|
| Grundbetrag | Anmeldung | 299,00 EUR | pauschal | Ja |
| Lernmaterial | Material | 80,00 EUR | pauschal | Ja |
| Theoriepruefung | Pruefung | 85,00 EUR | pauschal | Ja |
| Praktische Pruefung | Pruefung | 240,00 EUR | pauschal | Ja |
| Fahrstunde (45 Minuten) | Fahrstunde | 65,00 EUR | 45 Minuten | Ja |

### Keine Code-Aenderungen noetig

Die Seite `Leistungen.tsx` bietet bereits:
- Dropdown "Aus Preisliste waehlen" das aktive Preise aus der `prices`-Tabelle laedt (Zeile 81-93)
- Automatische Uebernahme von Bezeichnung und Preis bei Auswahl (Zeile 137-149)
- Manuell ueberschreibbare Felder fuer Bezeichnung und Preis (Zeile 365-392)
- Alle zugeordneten Leistungen werden im Saldo beruecksichtigt (ueber `services`-Tabelle)

### Zusammenfassung

| Aktion | Detail |
|--------|--------|
| DB-Migration | 5 Eintraege in `prices` einfuegen |
| Code | Keine Aenderungen erforderlich |

