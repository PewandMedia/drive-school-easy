

## Auswertung-Dashboard visuell verbessern

### Probleme im aktuellen Zustand (siehe Screenshot)

1. **KPI-Karten zu klein und unleserlich** - Icons und Trend-Pfeile sind winzig, Werte schwer zu lesen
2. **Umsatzentwicklung nimmt volle Breite ein** fuer nur 1-2 Balken - sieht leer aus
3. **Alle Balkendiagramme identisch orange** - keine visuelle Unterscheidung
4. **Donut-Chart zu klein** ohne Zahlen im Zentrum
5. **Kein visueller Kontrast** zwischen den Sektionen

### Aenderungen an `src/pages/dashboard/Auswertung.tsx`

**1. KPI-Karten aufwerten**

- Layout von 6 Spalten auf 3x2 Grid (groessere Karten)
- Icon in farbigem Kreis-Hintergrund (wie PageHeader)
- Wert groesser und prominenter
- Label ueber dem Wert statt darunter
- Trend-Icon mit Farbe und Prozent-Aenderung neben dem Wert
- Subtile Border-Akzente fuer gute/schlechte Werte (gruen/rot links-Border)

**2. Umsatzentwicklung kompakter**

- Chart-Hoehe von 260px auf 200px reduzieren
- Umsatz-Gesamtwert als grosse Zahl im CardHeader neben dem Titel anzeigen
- Abrundung der Balken beibehalten

**3. Visuelle Unterscheidung der Charts**

- Schueler pro Monat: Blau-Ton statt Orange (`hsl(210 80% 55%)`)
- Fahrstunden-Auslastung: Cyan/Tuerkis (`hsl(180 70% 45%)`)
- Pruefungsergebnisse: Gruen/Rot beibehalten (semantisch korrekt)
- Donut: Gruen/Grau beibehalten

**4. Donut-Chart mit Zentral-Label**

- Gesamtbetrag und Prozent im Zentrum des Donuts als Text anzeigen
- Bezahlt/Offen mit Euro-Betraegen in der Legende

**5. Bessere Card-Styling**

- CardHeader mit leichtem Bottom-Border zur Trennung
- Konsistente Innenabstaende
- Subtile Hover-Effekte auf KPI-Karten

### Zusammenfassung

| Bereich | Aenderung |
|---------|-----------|
| KPI-Karten | 3x2 Grid, groessere Icons, farbige Akzente, Label oben |
| Umsatz-Chart | Kompakter, Gesamtwert im Header |
| Chart-Farben | Unterschiedliche Farben pro Diagramm statt alles Orange |
| Donut | Zentrales Label mit Gesamtbetrag und Prozent |
| Cards | Bessere Abstaeende und visuelle Trennung |

