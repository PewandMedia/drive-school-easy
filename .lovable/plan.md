

## PDF-Layout der Tagesabrechnung verbessern

### Probleme im aktuellen PDF (siehe Screenshot)
1. Die Spalten "Einnahme am" und "Einreichung am" sind eng gequetscht und brechen auf zwei Zeilen um — die Header sehen abgeschnitten aus
2. Die Beschriftungen sind nicht eindeutig: nicht klar, was "Einnahme" und "Einreichung" jeweils bedeuten
3. Die Spaltenbreiten sind nicht optimal verteilt (z.B. "Verwendungszweck" zu schmal, Datums-Spalten zu breit)
4. Bei vielen Allokationen (z.B. "Omran Abo Shaar" mit 8x Fahrstunde) wird die Liste sehr lang — Zeile sprengt das Layout

### Lösung

**1. Spaltenüberschriften klarer & kompakter**

| Alt | Neu |
|---|---|
| "Einnahme am" | "Kassiert am" |
| "Einreichung am" | "Im Büro am" |
| "Zahlungsart" | "Art" |

Beide Datumsspalten bekommen einen kurzen, eindeutigen Titel der nicht umbricht. "Kassiert am" = Fahrlehrer hat Geld vom Schüler bekommen. "Im Büro am" = im Büro abgegeben.

**2. Feste Spaltenbreiten via `<colgroup>` im Print-Table**

```text
Schüler           15%
Verwendungszweck  32%
Fahrlehrer        13%
Art                8%
Kassiert am       10%
Im Büro am        10%
Betrag            12%  (rechtsbündig)
```

Plus `table-layout: fixed` und `word-wrap: break-word`, damit lange Inhalte sauber umbrechen statt das Layout zu sprengen.

**3. Verwendungszweck bei vielen Allokationen kompakter**

Wenn mehr als 3 gleiche Einträge (z.B. "Fahrstunde 45min (1E)" 7×), zusammenfassen zu „Fahrstunde 45min (1E) ×7, Fahrstunde 90min (2E)". Spart Platz, bleibt lesbar.

**4. Header-Bereich aufräumen**

- Titel einzeilig: „Tagesabrechnung – Fahrschulverwaltung"
- Untertitel kleiner: „Im Büro eingereicht am: 22.04.2026"
- Optional Filter-Hinweis nur wenn aktiv

**5. Summen-Block als Box rechts unten statt linksbündig**

Bar / EC / Überweisung Subtotals + Gesamt in einer kleinen Tabelle rechts, klar abgegrenzt — wirkt professioneller.

**6. Schriftgröße & Zeilenhöhe**

- Tabelle: `font-size: 10pt`, `line-height: 1.3`
- Header: `font-size: 9pt`, fett, kein Umbruch (`white-space: nowrap`)

### Bildschirm-Tabelle ebenfalls anpassen

Damit Screen und PDF konsistent sind: Spaltenüberschriften „Kassiert am" / „Im Büro am" / „Art" auch in der Live-Tabelle übernehmen.

### Technische Details

| Datei | Änderung |
|---|---|
| `src/pages/dashboard/Tagesabrechnung.tsx` | Spaltennamen umbenennen (Screen + Print); `<colgroup>` mit festen Breiten im Print-Table; `table-layout: fixed`; Verwendungszweck-Funktion `getVerwendungszweck` um Gruppierung gleicher Beschreibungen erweitern (`×N`); Print-Header-Bereich neu strukturieren (kleinerer Untertitel); Summen-Block rechtsbündig in Box |
| `src/index.css` | Print-Bereich: spezifische Regeln für `.print-area table { table-layout: fixed; font-size: 10pt; } .print-area th { white-space: nowrap; font-size: 9pt; }` ergänzen |

Keine DB-Änderungen, keine neuen Dependencies.

