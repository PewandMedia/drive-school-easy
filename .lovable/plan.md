
## Zahlungen in der Saldo-Uebersicht anzeigen

### Ziel
Die eingegangenen Zahlungen sollen direkt in der linken Saldo-Uebersicht im Schuelerprofil angezeigt werden -- unterhalb der offenen Posten. So hat man alles auf einen Blick: Gutschriften, offene Posten und eingegangene Zahlungen.

### Aenderung

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/FahrschuelerDetail.tsx` (nach Zeile ~871) | Neue Sektion "Zahlungen" einfuegen, die alle Zahlungen des Schuelers auflistet |

### Details
Nach der bestehenden "Offene Posten"-Liste (Zeile ~871) wird eine neue Sektion eingefuegt:

- Ueberschrift: **ZAHLUNGEN (n)** im gleichen Stil wie "GUTSCHRIFTEN" und "OFFENE POSTEN"
- Jede Zahlung wird als Zeile dargestellt mit:
  - Datum (dd.MM.yy)
  - Zahlungsart (Bar / EC / Ueberweisung)
  - Betrag (gruen fuer positive Zahlungen, rot fuer negative/Gutschriften)
- Sortierung: neueste zuerst
- Die bestehende separate Zahlungen-Karte in der rechten Spalte bleibt erhalten

Die Daten (`payments`) sind bereits geladen und verfuegbar -- es muss kein neuer Query hinzugefuegt werden. Das Styling orientiert sich exakt an den bestehenden Gutschriften- und Offene-Posten-Listen (gleiche Schriftgroessen, Abstande, Farben).
