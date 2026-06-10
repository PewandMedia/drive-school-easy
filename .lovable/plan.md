# Filiale-Filter für Abrechnungen

Auf den Abrechnungsseiten soll man nach Fahrschul-Filiale filtern können (Riemke Markt / Rathaus / Alle), analog zum Filter auf der Fahrschüler-Seite.

## Änderungen

### 1. `src/pages/dashboard/Abrechnung.tsx`
- Neuer State `filterFahrschule: "alle" | "riemke" | "rathaus"` (Default `"alle"`).
- Drei Filter-Buttons (Alle / Riemke Markt / Rathaus) in der Toolbar neben "Nach Saldo" / Suche, gleiches Styling wie auf der Fahrschüler-Seite.
- Filterung von `sorted` zusätzlich nach `s.fahrschule`.
- Statistik-Karten (Gesamtforderungen, Bezahlt, Saldo) werden ebenfalls auf die gefilterte Filiale berechnet, damit Zahlen zur Auswahl passen.

### 2. `src/pages/dashboard/Tagesabrechnung.tsx`
- Neuer State `filterFahrschule`.
- Filter-Buttons im Header (Alle / Riemke Markt / Rathaus).
- Payments werden über `student_id → students.fahrschule` der gewählten Filiale zugeordnet. Dafür `students` (id, fahrschule) zusätzlich via `fetchAllRows` laden und beim Filtern joinen.
- Summen (Bar / EC / Überweisung / Gesamt) und Tabelle reagieren auf den Filter.
- PDF-Export nimmt den aktuell gefilterten Zustand (Titel zeigt Filialname, z. B. "Tagesabrechnung – Riemke Markt – TT.MM.JJJJ").

## Technische Hinweise
- `FAHRSCHULE_LABELS = { riemke: "Riemke Markt", rathaus: "Rathaus" }` lokal je Datei (wie bereits in Fahrschüler.tsx).
- Keine DB-Änderungen nötig, das Feld `students.fahrschule` existiert.
- Keine Änderung an Berechtigungen/RLS.
