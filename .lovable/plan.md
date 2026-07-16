
## Ziel
Eine neue Seite, auf der man **einen Fahrlehrer + ein Datum** auswählt und dann alle an diesem Tag erfassten **Fahrstunden** und **Zahlungen** dieses Fahrlehrers übersichtlich sieht — zum Abgleich mit dem Tagesnachweis.

## Neue Seite: `src/pages/dashboard/FahrlehrerTag.tsx`
Route: `/dashboard/fahrlehrer-tag` (für alle eingeloggten Nutzer, kein Admin-Zwang — Sekretärinnen kontrollieren mit).

### Aufbau
1. **Filterleiste (oben)**
   - Combobox: Fahrlehrer (aus `instructors`, aktive zuerst)
   - Datepicker: Datum (Standard = heute)

2. **KPI-Zeile**
   - Anzahl Fahrstunden · Summe Einheiten · Summe Minuten · Summe Umsatz Fahrstunden
   - Anzahl Zahlungen · Summe Zahlungen

3. **Tabelle "Fahrstunden"**
   Spalten: Uhrzeit · Fahrschüler (Nachname, Vorname) · Typ · Einheiten · Dauer (Min) · Preis
   Sortiert nach `datum` aufsteigend.

4. **Tabelle "Zahlungen"**
   Spalten: Uhrzeit · Fahrschüler · Zahlungsart · Betrag · Notiz
   Zahlungen werden dem Fahrlehrer über `instructor_id` in `payments` zugeordnet (Feld existiert laut Tagesabrechnung-Logik). Falls `payments.instructor_id` nicht existiert → nur "Zahlungen des Tages der Fahrschüler dieses Fahrlehrers" wäre unzuverlässig; deshalb muss diese Zuordnung geprüft werden — siehe Rückfrage unten.

### Queries
- `driving_lessons` filtern: `instructor_id = X` **und** `datum` liegt zwischen `YYYY-MM-DD 00:00` und `YYYY-MM-DD 23:59`, join mit `students(vorname,nachname)`.
- `payments` filtern: analog per Datum (`datum`-Spalte) + `instructor_id`.
- React Query, staleTime 30s.

## Navigation
Neuer Sidebar-Eintrag **"Tagesübersicht Fahrlehrer"** unter Gruppe *Schüler & Ausbildung*, Icon `CalendarCheck`, sichtbar für alle.

## Nicht angefasst
- DB-Schema, Trigger, Preisberechnung, Salden, sonstige Seiten.
- Schaltstunden/Theorie/Prüfungen bleiben außen vor (können später ergänzt werden).

## Offene Rückfrage
Sollen bei Zahlungen wirklich nur Zahlungen mit `instructor_id = ausgewählter Fahrlehrer` erscheinen (üblich bei Barzahlungen an den Fahrlehrer), oder **alle** Zahlungen der Fahrschüler dieses Fahrlehrers am Tag? Ich gehe im Plan von **Variante A: `payments.instructor_id`** aus — das entspricht dem Zweck "was der Fahrlehrer an diesem Tag kassiert hat".
