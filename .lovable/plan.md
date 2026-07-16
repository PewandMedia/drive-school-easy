
# Fahrlehrer-Tagesübersicht

Neue Seite, auf der man einen Fahrlehrer und ein Datum auswählt und dann alle an diesem Tag erfassten Fahrstunden und Zahlungen dieses Fahrlehrers sieht – zum Abgleich mit dem Tagesnachweis.

## Neue Route
- Pfad: `/dashboard/fahrlehrer-tagesuebersicht`
- Neue Datei: `src/pages/dashboard/FahrlehrerTagesuebersicht.tsx`
- Route in `src/App.tsx` registrieren (lazy import), sichtbar für **admin und sekretaerin** (kein `requiredRole`).
- Sidebar-Eintrag in `src/components/AppSidebar.tsx` unter „Schüler & Ausbildung" direkt unter „Fahrlehrer-Statistik", Icon `CalendarCheck`, Titel **„Tagesübersicht Fahrlehrer"**. Ohne `adminOnly`, damit auch die Sekretärin kontrollieren kann.

## Bedienung
1. **Fahrlehrer** – Select mit allen aktiven Fahrlehrern (`instructors` where `aktiv = true`), sortiert nach Nachname.
2. **Datum** – Datumsfeld, Default = heute.
3. Darunter zwei Blöcke, nur gerendert wenn Fahrlehrer gewählt ist:

### Block A – Fahrstunden
Tabelle mit allen `driving_lessons` mit `instructor_id = <selected>` und `datum::date = <selected>`:
Spalten: Uhrzeit · Fahrschüler (`Nachname, Vorname`) · Typ (Übungsstunde / Überland / …) · Einheiten (`dauer_minuten/45`) · Dauer (min) · Fahrzeug (automatik/schaltwagen) · Preis.
Footer: Anzahl Fahrstunden, Summe Einheiten, Summe Preis.

### Block B – Zahlungen
Tabelle mit allen `payments` mit `instructor_id = <selected>` und `datum = <selected>`:
Spalten: Fahrschüler · Betrag · Zahlungsart (Bar/EC/Überweisung) · Filiale · Verwendungszweck (aus `payment_allocations → open_items.beschreibung`, gleiches Muster wie `Tagesabrechnung.tsx`).
Footer: Anzahl Zahlungen, Summe Betrag, aufgeteilt nach Bar / EC / Überweisung.

### Zusammenfassung oben
Kleine Karte mit: „X Fahrstunden · Y Einheiten · Z € Umsatz Fahrstunden" und „N Zahlungen · Σ € eingenommen" – so sieht der Kontrolleur sofort, ob die Zahlen zum Tagesnachweis passen.

## Daten
- React Query, Key `["fahrlehrer-tagesuebersicht", instructorId, date]`, nur enabled wenn `instructorId` gesetzt.
- Zwei parallele Queries analog zu `Tagesabrechnung.tsx`:
  - `driving_lessons` mit Join auf `students(vorname,nachname)`, gefiltert per `.eq("instructor_id", …).gte("datum", startOfDay).lt("datum", startOfDay+1d)` (weil `datum` `timestamp` ist).
  - `payments` mit Joins auf `students(vorname,nachname)` und `payment_allocations(betrag, open_items(beschreibung))`, gefiltert per `.eq("instructor_id", …).eq("datum", selectedDate)`.
- `fetchAllRows` verwenden, um am 1000-Zeilen-Limit vorbeizukommen.

## Nicht angefasst
- Keine Änderungen an DB, Triggern, Preisberechnung, Saldo-Logik.
- Keine Änderungen an bestehender `Tagesabrechnung`, `FahrlehrerStatistik`, `Zahlungen`, `Fahrstunden`.
- Keine PDF-Export in dieser ersten Version (kann später ergänzt werden, wenn gewünscht).

## Technische Details
- Instructor-Namen konsistent als `Nachname, Vorname` (bestehende Konvention).
- Zahlungsart-Icons/Labels wie in `Tagesabrechnung.tsx` wiederverwenden.
- Datumsfilter mit `format(date, "yyyy-MM-dd")`.
