

## Offenes Saldo in der Fahrschueler-Uebersicht anzeigen

### Problem
In der Fahrschueler-Tabelle steht bei "Saldo" ueberall "0,00 EUR" (hardcoded). Der tatsaechliche Saldo wird nur auf der Detailseite berechnet.

### Loesung
Zusaetzliche Daten (driving_lessons, exams, services, payments) laden und pro Schueler den Saldo berechnen.

### Aenderungen in `src/pages/dashboard/Fahrschueler.tsx`

**1. Zusaetzliche Queries hinzufuegen**
- `driving_lessons` laden (nur `student_id`, `preis`)
- `exams` laden (nur `student_id`, `preis`)
- `services` laden (nur `student_id`, `preis`)
- `payments` laden (nur `student_id`, `betrag`)

**2. Saldo-Berechnung pro Schueler**
- Per `useMemo` ein `saldoMap: Record<string, number>` erstellen
- Formel (identisch zur Detailseite):
  ```text
  Saldo = Summe(driving_lessons.preis) + Summe(exams.preis) + Summe(services.preis) - Summe(payments.betrag)
  ```

**3. Anzeige in der Tabelle**
- Statt hardcoded `0,00 EUR` den berechneten Saldo anzeigen
- Farblogik:
  - Saldo > 0: amber/gelb (offener Betrag)
  - Saldo == 0: normale Farbe (ausgeglichen)
  - Saldo < 0: gruen (Ueberzahlung/Guthaben)
- Format: `482,00 EUR` mit `toLocaleString("de-DE", { style: "currency", currency: "EUR" })`

### Technische Details

- 4 neue `useQuery`-Aufrufe mit `.select("student_id, preis")` bzw. `.select("student_id, betrag")`
- `useMemo` gruppiert die Summen per `student_id` und berechnet den Saldo
- `isLoading` wird um die 4 neuen Loading-States erweitert
- Keine Aenderung an der Detailseite noetig, Logik bleibt konsistent

