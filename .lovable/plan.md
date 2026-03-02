

## Alle Demo-Daten aus der Datenbank loeschen

### Was geloescht wird

Alle Daten aus folgenden Tabellen werden komplett geleert (in der richtigen Reihenfolge wegen Abhaengigkeiten):

1. **payment_allocations** - Zahlungszuordnungen
2. **payments** - Zahlungen
3. **open_items** - Offene Posten
4. **driving_lessons** - Fahrstunden
5. **exams** - Pruefungen
6. **services** - Leistungen
7. **theory_sessions** - Theoriestunden
8. **gear_lessons** - Schaltstunden
9. **activity_log** - Aktivitaetsprotokoll
10. **students** - Fahrschueler

### Was NICHT geloescht wird

- **prices** - Preisliste (Konfigurationsdaten, keine Demo-Daten)
- **instructors** - Fahrlehrer
- **vehicles** - Fahrzeuge
- **profiles / user_roles** - Benutzerkonten

### Technische Umsetzung

Ausfuehrung ueber das Supabase Insert-Tool mit DELETE-Statements in der richtigen Reihenfolge, um Foreign-Key-Konflikte zu vermeiden.

