## Ziel
1. **Sync bestätigen und sicherstellen**: Alle Einträge aus der Schnellerfassung müssen im Fahrschüler-Profil und im Saldo korrekt erscheinen.
2. **Paginierung** in der Schülerliste (Schnellerfassung) mit Seitenauswahl 10 / 20 / 30 / 50 / 100.

## 1. Sync-Check (nur Prüfung, keine neuen Tabellen)

Der bestehende Code speichert in dieselben Tabellen (`driving_lessons`, `payments`, `payment_allocations`), die auch das Fahrschüler-Profil liest. Business-Trigger in der Datenbank sorgen automatisch für:
- `create_open_item_for_driving_lesson` → offener Posten wird erzeugt.
- `calculate_driving_lesson_price` → Preis korrekt (65 € / 45 min).
- `update_open_item_after_allocation` → Saldo je offenem Posten aktualisiert.
- `audit_entity_change` → Aktivitätsprotokoll.

Damit das Profil sofort aktuell ist, werden nach jeder Mutation folgende React-Query-Keys invalidiert (bereits vorhanden, ggf. ergänzen):
- `driving_lessons`, `payments`, `payment_allocations_all`, `open_items`, `students`
- Zusätzlich: `students_schnellerfassung`, `student_detail` (falls im Profil verwendet), damit die linke Liste + das Profil beim nächsten Öffnen frische Daten holen.

Ergebnis: Wenn im Profil des Schülers geöffnet wird, erscheint die neue Fahrstunde/Zahlung mit korrektem Preis, offenem Posten und Saldo. Kein zusätzlicher Code nötig — nur die Invalidierung wird geprüft/ergänzt.

## 2. Paginierung in der Schülerliste (Schnellerfassung)

**`src/pages/dashboard/Schnellerfassung.tsx`:**

```text
┌ Fahrschüler ─────────────┐
│ [🔎 Suchen…             ]│
│ 342 Fahrschüler · Seite 1/35 │
├──────────────────────────┤
│ ● Meier, Anna (…)        │
│   Müller, Ben (…)        │
│   … (aktuelle Seite)     │
├──────────────────────────┤
│ Pro Seite: [ 20 ▾ ]      │
│ ‹  1 / 35  ›             │
└──────────────────────────┘
```

- Neuer State: `pageSize` (default 20), `page` (default 1).
- Neuer `Select` mit Optionen 10 / 20 / 30 / 50 / 100 im Footer der linken Spalte.
- Sichtbare Zeilen = `filteredStudents.slice((page-1)*pageSize, page*pageSize)`.
- Prev/Next-Buttons (deaktiviert an den Rändern) + Anzeige „Seite X / Y".
- Bei Suchänderung → `page = 1` zurücksetzen.
- Bei Änderung der Seitengröße → `page = 1`.
- Auswahl eines Schülers ändert die Seite nicht (der aktive Eintrag bleibt hervorgehoben, auch wenn er auf einer anderen Seite läge).

## Nicht in Scope
- Keine Paginierung für andere Seiten in dieser Runde (siehe Memory: „Today's items have no limit. Older items and generic lists use 10-item limit with 'Load more'."). Wenn das später überall geändert werden soll, ist das ein eigener großer Umbau.
- Keine Datenbankänderungen.

## Verifikation
- In der Schnellerfassung erscheinen unten Seitengrößen-Auswahl und Blätter-Pfeile.
- Bei 100+ Schülern: nur pageSize-Einträge sichtbar, Blättern funktioniert, Anzahl-Anzeige korrekt.
- Fahrstunde eintragen → Fahrschüler-Profil öffnen → Fahrstunde erscheint mit korrektem Preis, offener Posten und Saldo aktualisiert.
- Zahlung eintragen → Fahrschüler-Profil zeigt Zahlung, FIFO-Zuordnung wurde auf offene Posten angewendet, Saldo reduziert.
