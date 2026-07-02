## Filiale pro Zahlung — Rathaus oder Riemke

Aktuell wird die Filiale nur beim Fahrschüler hinterlegt und der Filter in Abrechnung/Tagesabrechnung nutzt diese Zuordnung. Neu: Jede Zahlung bekommt eine eigene Filiale (wo das Geld tatsächlich abgegeben wurde), und die Tagesabrechnung/PDF filtert danach.

### 1. Datenbank

Neue Spalte `filiale` auf `payments` (Enum-artig als Text `riemke` | `rathaus`, nullable für Altdaten).

```sql
ALTER TABLE public.payments ADD COLUMN filiale text;
ALTER TABLE public.payments ADD CONSTRAINT payments_filiale_check
  CHECK (filiale IN ('riemke','rathaus') OR filiale IS NULL);
```

Altdaten bleiben `NULL` → werden als "Filiale unbekannt" behandelt und erscheinen nur bei Filter "Alle".

### 2. Zahlungserfassung — Filiale-Pflichtfeld

Betroffen: Dialog "Zahlung erfassen" und "Zahlung bearbeiten" in
- `src/pages/dashboard/Zahlungen.tsx`
- `src/pages/dashboard/FahrschuelerDetail.tsx`

Änderungen je Dialog:
- Neues Feld **Filiale** (Radio oder Select: Riemke Markt / Rathaus) direkt neben Zahlungsart.
- Default: Filiale des Schülers (falls gesetzt) — muss aber bestätigt/geändert werden können.
- Validierung: Speichern nur mit gewählter Filiale.
- Wert wird in `payments.filiale` gespeichert.

### 3. Tagesabrechnung — Filter auf Zahlungs-Filiale

`src/pages/dashboard/Tagesabrechnung.tsx`:
- Der bestehende Filiale-Filter (Alle / Riemke / Rathaus) filtert ab jetzt nach `payment.filiale` statt nach `student.fahrschule`.
- "Alle" zeigt weiterhin alles inkl. Altdaten ohne Filiale.
- Neue Spalte **Filiale** in der Tabelle (Riemke / Rathaus / — bei Altdaten).
- PDF-Druck-Header zeigt weiterhin die gewählte Filiale ("Filiale: Riemke Markt" / "Rathaus" / "Alle Filialen").
- Die Filiale-Spalte erscheint im PDF, damit bei "Alle" sichtbar ist, wo jede Zahlung abgegeben wurde.

### 4. Abrechnung (Salden-Übersicht) — unverändert

`Abrechnung.tsx` bleibt auf der Filiale des **Schülers** (nicht der Zahlung), weil dort Salden pro Schüler dargestellt werden. Das passt zum Nutzungszweck (Wem gehört der Schüler?) und du hast das nicht explizit angefragt. Kann bei Bedarf nachgezogen werden.

### Zusammenfassung

| Datei | Änderung |
|---|---|
| Migration | Spalte `payments.filiale` + Check-Constraint |
| `Zahlungen.tsx` | Filiale-Auswahl in Erfassen-/Bearbeiten-Dialog, Default vom Schüler |
| `FahrschuelerDetail.tsx` | Filiale-Auswahl in Erfassen-/Bearbeiten-Dialog, Default vom Schüler |
| `Tagesabrechnung.tsx` | Filter nach `payment.filiale`, neue Spalte Filiale in Tabelle + PDF |
