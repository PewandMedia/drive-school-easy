

## Gutschrift-Funktion ueber Zahlungen

### Uebersicht

Im Zahlungen-Dialog wird eine Option "Gutschrift" hinzugefuegt. Eine Gutschrift ist eine Zahlung mit negativem Betrag, die den Saldo des Schuelers reduziert. Sie wird als normaler `payments`-Eintrag gespeichert (mit negativem `betrag`), ohne Zuordnung zu offenen Posten. Keine DB-Migration noetig.

### Aenderungen

**Datei: `src/pages/dashboard/Zahlungen.tsx`**

**1. Gutschrift-Toggle im Formular**

- Neues State-Feld `istGutschrift: boolean` im `PaymentForm`-Typ (Default: `false`)
- Im Dialog wird oberhalb der Felder ein Toggle oder Checkbox eingefuegt: "Gutschrift"
- Wenn aktiv:
  - Dialog-Titel aendert sich zu "Gutschrift erfassen"
  - Das Betrag-Feld bleibt positiv (Nutzer gibt z.B. 80 ein), wird aber intern als `-80` gespeichert
  - Die Sektion "Offene Posten zuordnen" wird ausgeblendet (Gutschriften werden keinen offenen Posten zugeordnet)
  - Ein optionales Textfeld "Grund" erscheint (wird nicht in der DB gespeichert, nur UX)

**2. Mutation anpassen**

- In `saveMutation`: Wenn `form.istGutschrift === true`, wird `betrag` als negativer Wert eingefuegt (`-Math.abs(betrag)`)
- Keine `payment_allocations` bei Gutschriften

**3. Tabellen-Darstellung anpassen**

- Gutschriften (negative Betraege) werden in der Tabelle rot/lila dargestellt statt gruen
- Betrag-Spalte: `-80,00 EUR` statt `+80,00 EUR`
- In der Zuordnungs-Spalte: "Gutschrift" als Label

**4. Statistik anpassen**

- Die Statistik-Karten beruecksichtigen Gutschriften korrekt (negative Betraege reduzieren die Summe)
- Optional: Dritte Statistik-Karte "Gutschriften" die nur negative Betraege summiert

**5. Saldo-Auswirkung**

Da der Saldo ueber `open_items` berechnet wird (nicht ueber `payments`), beeinflusst eine Gutschrift den Saldo nicht direkt. Um den Saldo zu reduzieren, muss die Gutschrift als negativer offener Posten erfasst werden. Dafuer wird in der Mutation zusaetzlich ein `open_items`-Eintrag mit negativem `betrag_gesamt` erstellt:

```text
INSERT INTO open_items (student_id, typ, referenz_id, datum, beschreibung, betrag_gesamt, status)
VALUES (student_id, 'gutschrift', payment_id, datum, 'Gutschrift', -betrag, 'bezahlt')
```

So wird der Saldo korrekt reduziert und die Gutschrift erscheint auch in der offenen-Posten-Liste des Schuelerprofils.

**6. Schuelerprofil: Gutschrift-Darstellung**

In `FahrschuelerDetail.tsx` werden offene Posten mit negativem `betrag_gesamt` (Typ `gutschrift`) mit gruener Farbe und "Gutschrift"-Label dargestellt.

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/Zahlungen.tsx` | Gutschrift-Toggle, Mutation mit negativem Betrag + open_item, Tabellen-Darstellung |
| `src/pages/dashboard/FahrschuelerDetail.tsx` | Gutschrift-Eintraege in offenen Posten farblich hervorheben |

### Ablauf aus Nutzersicht

1. Zahlungen-Seite oeffnen
2. "Zahlung erfassen" klicken
3. Checkbox "Gutschrift" aktivieren
4. Schueler waehlen, Betrag eingeben (z.B. 80 EUR)
5. Speichern -- Gutschrift erscheint:
   - In der Zahlungstabelle mit negativem Betrag und "Gutschrift"-Label
   - Im Saldo des Schuelers als Reduzierung
   - Im Schuelerprofil als gruener Gutschrift-Eintrag

