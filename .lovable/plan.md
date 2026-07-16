## Ziel
Neuer Menüpunkt **„Schnellerfassung"** (bestehender „Leistungen"-Bereich bleibt unverändert). Zweispaltiges Layout: links Fahrschüler-Liste mit Suche, rechts Schnellerfassung für Fahrstunden und Zahlungen inklusive kompakter Historie – damit man ohne Umweg über das Schülerprofil nacheinander Einträge für verschiedene Schüler machen kann.

## Neue Datei `src/pages/dashboard/Schnellerfassung.tsx`

Layout (Desktop):
```text
┌──────────────────────────┬────────────────────────────────────────┐
│ Fahrschüler (links)      │ Ausgewählter Schüler                   │
│ [🔎 Suche…            ]  │ Nachname, Vorname (DD.MM.YYYY)         │
│ ─────────────────────    │  Filiale · Führerscheinklasse          │
│ ● Meier, Anna (01.02…)   │ ──────────────────────────────────     │
│   Müller, Ben (…)        │ [ Fahrstunde ]  [ Zahlung ]  (Tabs)    │
│   Schulz, Chris (…)      │                                        │
│ … (Liste, scrollbar)     │  ┌─ Fahrstunde eintragen ───────────┐  │
│                          │  │ Datum · Typ · Dauer · Lehrer     │  │
│                          │  │ Fahrzeug · Notiz  → Speichern    │  │
│                          │  └──────────────────────────────────┘  │
│                          │                                        │
│                          │  Letzte 5 Fahrstunden (kompakt)        │
│                          │  ─ Tabelle: Datum · Typ · Dauer · €    │
└──────────────────────────┴────────────────────────────────────────┘
```

Bei Auswahl eines anderen Schülers bleiben Fahrlehrer und Datum „sticky" (analog Memory `fahrstunden-erfassung-workflow`), Formularinhalte werden zurückgesetzt.

### Linke Spalte – Schüler-Liste
- Query: aktive Schüler (`students`, gefiltert auf nicht archiviert), sortiert nach Nachname/Vorname.
- Suchfeld filtert nach Nachname/Vorname/Geburtsdatum (Client-seitig).
- Darstellung als Liste (nicht Karten): Format „Nachname, Vorname (DD.MM.YYYY)" via `formatStudentName`. Aktive Zeile hervorgehoben (`bg-primary/10 text-primary`).
- Scrollbereich mit fixer Höhe (`h-[calc(100vh-…)]`) und sichtbarem Scroll.

### Rechte Spalte – Erfassung
Tabs `Fahrstunde` / `Zahlung` (shadcn `Tabs`).

**Fahrstunde-Formular** (Felder & Logik übernommen aus dem bestehenden Fahrstunden-Dialog):
- Datum (default heute, sticky), Typ (`normal`/`sonderfahrt`/`fehlstunde`), Dauer in Minuten in 15er-Schritten (default 0 → verhindert versehentliches Speichern, siehe Memory), Fahrlehrer (Combobox, sticky), Fahrzeug optional, Notiz.
- Preis wird per Trigger berechnet (bestehende Business-Logik).
- Insert in `driving_lessons`, `queryClient.invalidateQueries` für `driving_lessons`, `open_items`, `students`.

**Zahlung-Formular** (Felder aus bestehendem Zahlungen-Dialog):
- Datum (default heute), Betrag, Zahlungsart (`bar`/`ueberweisung`/`karte`), Filiale (Riemke/Rathaus, default = Filiale des Schülers), Notiz.
- Insert in `payments`; danach FIFO-Zuordnung wie im bestehenden Flow (Reuse der Hilfsfunktion aus `Zahlungen.tsx` — ggf. extrahieren nach `src/lib/paymentAllocation.ts`, sonst inline).
- Invalidate `payments`, `payment_allocations`, `open_items`, `students`.

**Feedback**: Nach erfolgreichem Speichern kurze Toast-Meldung, Formular teilweise resetten (Betrag/Dauer/Notiz), Datum + Fahrlehrer bleiben. Dialog bleibt geöffnet (kein Modal – ist inline). Nach 3 Speichern-Aktionen erscheint kein Reset – Nutzer kann direkt den nächsten Schüler links anklicken.

### Historie (unter jedem Tab-Formular)
- Fahrstunde-Tab: Tabelle „Letzte 5 Fahrstunden" (Datum · Typ · Dauer · €) mit Lösch-Icon.
- Zahlung-Tab: Tabelle „Letzte 5 Zahlungen" (Datum · Betrag · Art · Filiale) mit Lösch-Icon (bestehende Delete-Logik/Sync aus Memory `zahlungs-loeschung-synchronisierung`).
- Query pro selected student, `enabled: !!selectedStudentId`.

## Routing & Navigation
- `src/App.tsx`: neuer Lazy-Import `Schnellerfassung`, Route `dashboard/schnellerfassung`.
- `src/components/AppSidebar.tsx`: neuer Eintrag in `verwaltungItems` **über** „Leistungen":
  ```ts
  { title: "Schnellerfassung", url: "/dashboard/schnellerfassung", icon: Zap },
  ```
  Icon `Zap` aus `lucide-react`. Beide Menüpunkte („Schnellerfassung", „Leistungen") sichtbar.

## Wiederverwendung / kein Doppelcode
- Für die Payment-Allokation (FIFO auf offene Posten) wird die vorhandene Logik aus `Zahlungen.tsx` in `src/lib/paymentAllocation.ts` als reine Funktion extrahiert und dort sowie in `Schnellerfassung.tsx` importiert. `FahrschuelerDetail.tsx` bleibt unverändert.
- `StudentCombobox` wird **nicht** genutzt (Schülerauswahl erfolgt über die Liste links).
- `formatStudentName`, `fetchAllRows` und bestehende Trigger übernehmen die Businessregeln.

## Nicht in Scope
- Keine Änderungen am alten `Leistungen`-Bereich (Services).
- Keine Änderungen an Prüfungen, Theorie, Schaltstunden.
- Keine Datenbankmigration nötig – alle benötigten Tabellen/Spalten existieren.

## Verifikation
- Menü zeigt „Schnellerfassung" oberhalb von „Leistungen".
- Ohne Auswahl: rechte Seite zeigt Platzhalter „Bitte Fahrschüler wählen".
- Nach Auswahl: Formular vorausgefüllt (Filiale = Schülerfiliale), Historie geladen.
- Fahrstunde speichern → erscheint in Liste; Preis korrekt (Trigger); offene Posten aktualisiert.
- Zahlung speichern → offene Posten reduzieren sich per FIFO; Filiale wird gespeichert; erscheint in Tagesabrechnung.
- Nächsten Schüler in linker Liste anklicken → Formular resettet Schüler-spezifische Felder, Datum + Fahrlehrer bleiben.
