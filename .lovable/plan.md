# Saldo-Anzeige vereinheitlichen

## Problem

Bei Aleyna Kir zeigt die Fahrschüler-Liste **975,00 € offen**, das Profil aber **0 € offen + 65 € Guthaben**. Beispieldaten:

- Forderungen (driving_lessons + exams + services): **2.469 €**
- Tatsächliche Zahlungen (payments.betrag): **1.494 €** (379 + 75 + 1.040)
- Korrekt offen: **2.469 − 1.494 = 975 €** ✅ (so zeigt es die Liste)

Das Profil rechnet aber mit `open_items.betrag_bezahlt`. Diese Summe ist **2.469 €**, obwohl die `payment_allocations` nur **1.429 €** ergeben. Die Spalte `betrag_bezahlt` ist also aus dem Tritt geraten (vermutlich durch frühere Updates ohne Trigger-Sync). Dadurch sieht das Profil die Forderungen fälschlich als komplett bezahlt und meldet sogar ein „Guthaben" von 65 €.

Das Problem betrifft mehrere Schüler und ebenso die Seite **Abrechnung** (nutzt dieselbe `open_items.betrag_bezahlt`-Summe).

## Lösung

Den „Bezahlt"-Wert überall direkt aus der echten Quelle `payments.betrag` rechnen, nicht aus `open_items.betrag_bezahlt`. Damit sind Liste, Profil und Abrechnung garantiert konsistent.

### 1. `src/pages/dashboard/FahrschuelerDetail.tsx`

- `totalBezahlt` neu: `payments.reduce((s, p) => s + Number(p.betrag), 0)` (statt Summe aus `open_items.betrag_bezahlt`).
- `totalForderungen` bleibt aus `open_items.betrag_gesamt` (alternativ: lessons+exams+services — Ergebnis identisch).
- `saldoRoh = totalForderungen − totalBezahlt`.
- `saldo = max(0, saldoRoh)`.
- `guthaben = max(0, −saldoRoh)` — ersetzt die bisherige Allocations-Berechnung. Damit verschwindet das falsche „Guthaben 65 €", wenn in Wahrheit noch 975 € offen sind.
- Anzeige-Block bleibt unverändert (zeigt Forderungen / Bezahlt / ggf. Guthaben / Saldo).
- „Guthaben verrechnen"-Button bleibt; verwendet weiter die Allocation-Logik (sie wird nur nicht mehr für die Saldo-Anzeige verwendet).

### 2. `src/pages/dashboard/Abrechnung.tsx`

Analog umstellen: Pro Schüler `bezahlt` aus `payments` (Summe `betrag` je `student_id`) statt aus `open_items.betrag_bezahlt`. Forderungen weiter aus `open_items.betrag_gesamt`. Saldo, Tabelle, Statistik-Karten und Filter funktionieren weiter wie bisher — nur mit korrekten Zahlen.

- Zusätzlicher `payments`-Query via `fetchAllRows` (`student_id, betrag`).
- `saldoMapAll`: `bezahlt = Σ payments.betrag` für `student_id == s.id`, `forderungen = Σ open_items.betrag_gesamt`, `saldo = forderungen − bezahlt`.

### 3. Keine weiteren Seiten betroffen

`Fahrschueler.tsx` rechnet bereits korrekt (Forderungen aus den drei Tabellen − Σ payments). Zahlungs- und Tagesabrechnungsseiten zeigen Zahlungen direkt und sind nicht betroffen.

### 4. Keine Daten-Migration / kein DB-Eingriff

Die Spalte `open_items.betrag_bezahlt` bleibt unverändert (wird für `status` und „Guthaben verrechnen" intern weiter genutzt). Wir lesen sie nur nicht mehr für die Saldo-Anzeige. Damit ist das Problem in der UI sofort behoben, unabhängig davon, ob alte Datensätze noch out-of-sync sind.

## Ergebnis für Aleyna Kir nach Fix

- Liste: **975,00 € offen** (unverändert)
- Profil: Forderungen 2.469 €, Bezahlt −1.494 €, **Offener Saldo 975,00 €**, kein falsches Guthaben.
