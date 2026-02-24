

## Tagesabrechnung verbessern und strukturieren

### Probleme im aktuellen Zustand

1. **Uhrzeit falsch (01:00 bei allen)**: Die Zahlungen werden mit `new Date(selectedDate)` abgefragt, was je nach Zeitzone Mitternacht UTC ergibt. Die gespeicherten Zeitstempel zeigen dann alle "01:00" (UTC+1). Das Datum wird beim Erfassen oft nur als Tageswert gespeichert.
2. **Keine Zuordnung sichtbar**: Man sieht nicht, wofuer bezahlt wurde (Fahrstunde, Pruefung, Grundbetrag etc.)
3. **Emojis statt Icons**: Die Zusammenfassungskarten nutzen Emojis statt der vorhandenen Lucide-Icons
4. **Fehlende Struktur**: Keine visuelle Gruppierung oder Zwischensummen

### Aenderungen an `src/pages/dashboard/Tagesabrechnung.tsx`

**1. Zuordnungs-Spalte hinzufuegen**

Query erweitern: Payments zusaetzlich mit `payment_allocations` und `open_items` joinen, um zu zeigen wofuer bezahlt wurde.

```text
supabase.from("payments")
  .select("id, betrag, zahlungsart, datum, 
    students(vorname, nachname, geburtsdatum),
    payment_allocations(betrag, open_items(beschreibung))")
```

Neue Spalte "Verwendungszweck" in der Tabelle:
- Zeigt z.B. "Fahrstunde 90min (2E), Grundbetrag"
- Wenn keine Zuordnung: "Freie Zahlung"

**2. Uhrzeit-Anzeige korrigieren**

Statt der Uhrzeit (die bei Tagesdatum-Erfassung immer gleich ist) das Zahlungsdatum als "dd.MM.yyyy" anzeigen. Die Spalte wird von "Uhrzeit" zu "Datum" umbenannt -- da es ein Tagesbericht ist, ist die Uhrzeit ohnehin nicht relevant.

**3. Emojis durch Icons ersetzen**

Die vier Zusammenfassungskarten bekommen die bereits importierten Lucide-Icons (Banknote, CreditCard, Building2) statt der Emojis. Zusaetzlich die Anzahl pro Zahlungsart anzeigen.

```text
Vorher: "💵 Bar gesamt"     -> Nachher: [Banknote-Icon] Bar gesamt (3 Zahlungen)
Vorher: "💳 EC gesamt"      -> Nachher: [CreditCard-Icon] EC gesamt (2 Zahlungen)
Vorher: "🏦 Ueberweisung"   -> Nachher: [Building2-Icon] Ueberweisung gesamt (0)
Vorher: "📊 Gesamtbetrag"   -> Nachher: [FileText-Icon] Gesamtbetrag (5 Zahlungen)
```

**4. Tabelle nach Zahlungsart gruppieren (optional Zwischensummen)**

Wenn der Filter auf "Alle Zahlungsarten" steht, werden am Ende der Tabelle Zwischensummen pro Zahlungsart als farbige Zeilen angezeigt.

**5. Geburtsdatum-Spalte entfernen**

Diese Spalte ist fuer einen Kassenbericht nicht relevant und nimmt Platz weg. Stattdessen kommt die neue Zuordnungs-Spalte.

**6. Druckbereich ebenfalls aktualisieren**

Der Print-Bereich bekommt die gleichen Aenderungen: Zuordnungs-Spalte, kein Geburtsdatum, korrekte Struktur.

### Neue Tabellenstruktur

```text
| Datum      | Schueler          | Verwendungszweck                    | Zahlungsart    | Betrag     |
|------------|-------------------|-------------------------------------|----------------|------------|
| 24.02.2026 | Ilkay Mustermann  | Fahrstunde 90min (2E)               | [Icon] Bar     | 440,00 EUR |
| 24.02.2026 | Ilkay Mustermann  | Grundbetrag                         | [Icon] Bar     |  20,00 EUR |
| 24.02.2026 | Simon Senf        | Theoriepruefung                     | [Icon] EC      |  65,00 EUR |
| 24.02.2026 | Max Mustermann    | Fahrstunde 90min (2E), Grundbetrag  | [Icon] Bar     | 130,00 EUR |
```

### Zusammenfassungskarten (neu)

```text
+--------------------+--------------------+--------------------+--------------------+
| [Banknote]         | [CreditCard]       | [Building2]        | [FileText]         |
| Bar gesamt         | EC gesamt          | Ueberweisung       | Gesamtbetrag       |
| 3 Zahlungen        | 2 Zahlungen        | 0 Zahlungen        | 5 Zahlungen        |
| 720,00 EUR         | 115,00 EUR         | 0,00 EUR           | 835,00 EUR         |
+--------------------+--------------------+--------------------+--------------------+
```

### Zusammenfassung

| Bereich | Aenderung |
|---------|-----------|
| Query | Payment_allocations + open_items joinen fuer Verwendungszweck |
| Tabelle | Spalte "Uhrzeit" -> "Datum", "Geburtsdatum" -> "Verwendungszweck" |
| Karten | Emojis durch Lucide-Icons ersetzen, Anzahl pro Zahlungsart |
| Druckbereich | Gleiche Struktur wie Bildschirmansicht |

