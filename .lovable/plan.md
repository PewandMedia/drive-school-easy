## Zahlungsformular in Schnellerfassung vervollständigen

In `src/pages/dashboard/Schnellerfassung.tsx` bekommt der Tab „Zahlung" dieselben Felder wie das normale Zahlungsformular in `Zahlungen.tsx`.

### Neue/geänderte Felder im Formular
1. **Zahlungsdatum** (bereits vorhanden als `stickyZahlungsDatum`) – bleibt.
2. **Einreichungsdatum im Büro** – neuer eigener `date`-Input, Default = Zahlungsdatum, wird sticky zwischen Schülern gemerkt.
3. **Betrag** – bleibt, zusätzlich Checkbox **„Gutschrift / Rückzahlung"** (macht den Betrag negativ, wie in `Zahlungen.tsx`).
4. **Zahlungsart** – bleibt (Bar / EC / Überweisung).
5. **Filiale** – bleibt (Default aus `student.fahrschule`).
6. **Fahrlehrer** – neues Pflichtfeld-artiges Select (leer erlaubt = „–"), wird per Schülerwechsel automatisch aus `lastInstructorByStudent` vorbelegt (gleiche Logik wie bei Fahrstunden), bleibt danach sticky.

### Speicherlogik (`savePayment`)
- `einreichungsdatum` kommt jetzt aus dem eigenen Feld statt aus `stickyZahlungsDatum`.
- `instructor_id` wird mitgespeichert (`null` wenn leer).
- Betrag wird bei aktivierter Gutschrift-Checkbox negiert.
- FIFO-Zuweisung auf offene Posten bleibt unverändert (nur bei positivem Betrag; bei Gutschrift keine Allocation, analog zur bestehenden Logik in `Zahlungen.tsx`).

### Sticky-Verhalten
- `stickyEinreichungsdatum` (neuer State), `stickyInstructor` (bereits vorhanden, wird jetzt auch für Zahlungen genutzt).
- Beim Schülerwechsel: Fahrlehrer wird wie bei Fahrstunden aus `lastInstructorByStudent` vorgeschlagen; Filiale weiterhin aus `student.fahrschule`.

### Nicht geändert
- „Letzte Zahlungen"-Tabelle, Fahrstunden-Tab, DB-Schema, andere Seiten.

### Technisch
- Neue States: `stickyEinreichungsdatum: string`, `paymentForm.istGutschrift: boolean`.
- Instructor-Select nutzt vorhandene `instructors`-Query und `stickyInstructor`.
- Nach erfolgreichem Speichern: bestehende Query-Invalidations bleiben; `stickyEinreichungsdatum` und `stickyInstructor` bleiben erhalten.
