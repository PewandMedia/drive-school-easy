

## Dashboard-Uebersicht mit echten Daten verknuepfen

### Uebersicht
Die statische Dashboard-Uebersicht wird durch eine dynamische Version ersetzt, die echte Daten aus der Datenbank laedt und die wichtigsten Kennzahlen auf einen Blick zeigt.

### Aenderungen in `src/pages/dashboard/Dashboard.tsx`

**1. Daten laden via `useQuery` (gleiche Queries wie in Abrechnung.tsx)**
- `students` -- alle Schueler (Anzahl aktiver Schueler)
- `driving_lessons` -- alle Fahrstunden (heutige zaehlen, Umsatz berechnen)
- `exams` -- alle Pruefungen (diesen Monat zaehlen)
- `theory_sessions` -- alle Theorie-Einheiten (aktive zaehlen)
- `services` -- alle Leistungen (fuer Saldo-Berechnung)
- `payments` -- alle Zahlungen (fuer offene Zahlungen / Saldo)

**2. KPI-Karten (oben) -- 6 Karten mit Echtdaten**

| Karte | Berechnung |
|-------|-----------|
| Aktive Fahrschueler | `students.length` (Gesamtzahl) |
| Fahrstunden heute | Fahrstunden mit `datum = heute` zaehlen |
| Offene Zahlungen | Gesamtsaldo: Summe(Fahrstunden + Pruefungen + Leistungen) - Summe(Zahlungen), formatiert als EUR |
| Pruefungen diesen Monat | Pruefungen mit `datum` im aktuellen Monat zaehlen |
| Theoriestunden gesamt | `theory_sessions.length` |
| Umsatz (Monat) | Summe der Zahlungen mit `datum` im aktuellen Monat, formatiert als EUR |

**3. "Letzte Aktivitaeten" -- die 5 neuesten Eintraege ueber alle Tabellen**
- Fahrstunden, Pruefungen, Leistungen und Zahlungen werden nach `created_at` sortiert
- Jeder Eintrag zeigt: Typ-Icon, Schueler-Name, Beschreibung, Datum
- Beispiel: "Fahrstunde -- Mustermann, Max -- Uebungsstunde 45 Min -- 20.02.2026"

**4. "Naechste Pruefungen" -- kommende Pruefungen (Datum >= heute)**
- Aus `exams` alle mit `datum >= heute` selektieren, nach Datum sortiert, max. 5
- Zeigt: Schueler-Name, Pruefungstyp (Theorie/Praxis), Datum
- Falls keine: "Keine Pruefungen geplant."

**5. Neuer Bereich: "Schueler mit offenem Saldo" (Top 5)**
- Die 5 Schueler mit dem hoechsten offenen Saldo
- Zeigt: Name, Saldo-Betrag als Badge (Amber), klickbar zum Schueler-Profil
- Nutzt `useNavigate` fuer Navigation

### Layout-Struktur

```text
[KPI-Karte 1]  [KPI-Karte 2]  [KPI-Karte 3]
[KPI-Karte 4]  [KPI-Karte 5]  [KPI-Karte 6]

[Letzte Aktivitaeten (5)]    [Naechste Pruefungen (5)]

[Schueler mit offenem Saldo (Top 5)]
```

### Technische Details

- Imports: `useQuery` aus `@tanstack/react-query`, `supabase` aus Client, `useNavigate` aus react-router-dom, `format` aus `date-fns`
- Waehrungsformatierung: `toLocaleString("de-DE", { style: "currency", currency: "EUR" })`
- Datumsvergleiche: `date-fns` fuer "heute", "aktueller Monat", "Datum >= heute"
- Schueler-Name wird ueber eine Map (ID -> Name) aufgeloest fuer die Aktivitaeten-/Pruefungslisten
- Alle Karten bleiben im bestehenden Design (rounded-xl, border-border, bg-card)
- Klick auf "Schueler mit offenem Saldo"-Zeilen navigiert zu `/dashboard/fahrschueler/:id`

