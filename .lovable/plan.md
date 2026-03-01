

## Zahlungssystem: Guthaben / Vorauszahlung

### Konzept

Wenn eine Zahlung ohne Zuordnung zu offenen Posten gespeichert wird, entsteht ein **Guthaben** (Vorauszahlung). Dieses Guthaben wird im Schuelerprofil angezeigt und vom offenen Saldo abgezogen. Spaeter kann es automatisch mit neuen Leistungen verrechnet werden.

### Berechnung Guthaben

Guthaben = Summe aller Zahlungen (positiv) - Summe aller payment_allocations

Das heisst: Jeder Euro, der nicht einem offenen Posten zugeordnet wurde, ist Guthaben.

### Aenderungen

**1. Datei: `src/pages/dashboard/FahrschuelerDetail.tsx`**

- **Guthaben berechnen**: Neue Variable `guthaben` = `totalZahlungen` (nur positive Zahlungen) minus Summe aller zugeordneten `payment_allocations` fuer diesen Schueler
- Dazu: Query fuer `payment_allocations` des Schuelers hinzufuegen (oder ueber payments joinen)
- **Saldo anpassen**: Neuer Saldo = `totalForderungen - totalBezahlt - guthaben` (Guthaben reduziert den offenen Saldo)
- **Guthaben-Anzeige**: Im Profil-Panel unter der Saldo-Uebersicht eine Zeile "Guthaben" in Gruen anzeigen, wenn > 0
- **Saldo-Label**: Wenn Guthaben den Saldo uebersteigt, zeigt die Anzeige "Guthaben" statt "Offener Saldo"

**2. Datei: `src/pages/dashboard/Zahlungen.tsx`**

- In der Tabelle: Zahlungen ohne Zuordnung als "Vorauszahlung / Guthaben" kennzeichnen (statt "Freie Zahlung")
- Beide Speicher-Stellen (Zahlungen-Seite und Schuelerdetail) erlauben bereits Zahlungen ohne Zuordnung -- das funktioniert schon korrekt

**3. Datei: `src/pages/dashboard/FahrschuelerDetail.tsx` (Automatische Verrechnung)**

- Beim Speichern einer neuen Zahlung im Schuelerdetail: Falls Guthaben vorhanden ist und neue offene Posten existieren, einen Hinweis anzeigen ("Guthaben vorhanden -- soll automatisch verrechnet werden?")
- Optional: Button "Guthaben verrechnen" im Schuelerdetail, der vorhandenes Guthaben automatisch auf offene Posten verteilt (aelteste zuerst)

### Technische Details

- Neue Query im Schuelerdetail: `payment_allocations` fuer alle Payments des Schuelers laden
- Berechnung: `guthaben = positiveZahlungen - summeAllocations`
- Saldo-Formel aendert sich zu: `offenerSaldo = max(0, forderungenOffen - guthaben)`
- Kein Datenbankschema-Aenderung noetig -- alles ableitbar aus bestehenden Tabellen

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/FahrschuelerDetail.tsx` | Guthaben berechnen, anzeigen, Saldo anpassen, Verrechnung-Button |
| `src/pages/dashboard/Zahlungen.tsx` | "Freie Zahlung" -> "Vorauszahlung" Label |

