

## Tagesabrechnung-PDF: Spaltenabstände & Datums-Spalten fixen

### Probleme im aktuellen PDF (Screenshot)
1. **Header verschmelzen**: "Kassiert am" und "Im Büro am" stehen ohne Lücke direkt aneinander → liest sich als "Kassiert amIm Büro am"
2. **Datum bricht um**: "22.04.2026" passt nicht in 10% Spaltenbreite und wird zu "22.04.20 / 26" auf zwei Zeilen umgebrochen
3. **Insgesamt zu wenig horizontaler Abstand** zwischen den Spalten

### Ursache
- Spaltenbreiten 10% pro Datum sind zu knapp für ein 10pt-Datum mit Padding
- `pr-2` (8px) Padding reicht nicht als visuelle Trennung zwischen Spalten
- Keine vertikale Trennlinie / Padding-Left zwischen Zellen

### Lösung

**1. Spaltenbreiten neu verteilen — Datums-Spalten breiter**

| Spalte | Alt | Neu |
|---|---|---|
| Schüler | 15% | 14% |
| Verwendungszweck | 32% | 28% |
| Fahrlehrer | 13% | 12% |
| Art | 8% | 7% |
| Kassiert am | 10% | **13%** |
| Im Büro am | 10% | **13%** |
| Betrag | 12% | 13% |

Mit 13% ist genug Platz für "22.04.2026" in 10pt-Schrift ohne Umbruch.

**2. Globales Zell-Padding statt nur `pr-2`**

In `src/index.css` für `.print-area td` und `.print-area th` ein konsequentes `padding: 4px 8px` setzen — gibt jeder Zelle links UND rechts Luft, sodass benachbarte Header nicht mehr verschmelzen können.

```css
.print-area th,
.print-area td {
  padding: 4px 8px;
}
.print-area th:first-child,
.print-area td:first-child {
  padding-left: 0;
}
.print-area th:last-child,
.print-area td:last-child {
  padding-right: 0;
}
```

**3. Datums-Spalten zusätzlich `white-space: nowrap` auf den Zellen (nicht nur Header)**

Damit das Datum 22.04.2026 nie umbricht — falls die Spalte trotzdem mal eng wird, wird die Spalte automatisch verbreitert statt umgebrochen.

```css
.print-area td.nowrap { white-space: nowrap; }
```

In `Tagesabrechnung.tsx` die beiden Datums-`<td>` und den Betrag-`<td>` mit `className="nowrap"` markieren.

**4. Inline `pr-2`-Klassen aus den `<th>`/`<td>` entfernen**

Werden durch das globale CSS-Padding ersetzt → konsistenter und sauberer.

### Technische Details

| Datei | Änderung |
|---|---|
| `src/index.css` | `.print-area th, .print-area td { padding: 4px 8px; }` ergänzen; first/last-child padding-reset; `.nowrap`-Helper |
| `src/pages/dashboard/Tagesabrechnung.tsx` | colgroup-Breiten anpassen (Datums-Spalten 13%); `pr-2`-Klassen aus Print-`<th>`/`<td>` entfernen; Datums- und Betrag-Zellen `className="nowrap"` |

Keine DB-Änderungen, keine Logik-Änderungen — reines Layout.

