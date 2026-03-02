

## Dialog kompakter machen - alles auf einen Bildschirm

### Problem
Der "Neuer Fahrschueler"-Dialog hat zu viele Felder untereinander, sodass man scrollen muss.

### Loesung
Mehr Felder nebeneinander in 2-Spalten-Grids anordnen und Abstaende reduzieren, damit alles auf einen Bildschirm passt.

### Konkrete Aenderungen in `src/pages/dashboard/Fahrschueler.tsx`

**Layout-Verdichtung (Felder nebeneinander statt untereinander):**

1. **Vorname + Nachname** - bleibt 2-spaltig (schon so)
2. **Geburtsdatum + E-Mail** - in eine Zeile (2-spaltig)
3. **Telefon + Fuehrerscheinklasse** - bleibt 2-spaltig (schon so)
4. **Fahrschule + Adresse** - in eine Zeile (2-spaltig)
5. **Umschreiber-Switch** - bleibt einzeilig

**Weitere Komprimierung:**
- Form-Spacing von `space-y-3` auf `space-y-2` reduzieren
- Label-Spacing von `space-y-2` auf `space-y-1` reduzieren
- Leistungen-Block: Padding von `p-4` auf `p-3` reduzieren
- Textarea `min-h-[60px]` auf `min-h-[40px]` reduzieren
- DialogFooter padding von `pt-3` auf `pt-2` reduzieren

### Ergebnis
Durch das Zusammenlegen von 4 einzelnen Zeilen (Geburtsdatum, E-Mail, Fahrschule, Adresse) in 2 Zeilen spart man ca. 120px Hoehe. Zusammen mit den reduzierten Abstaenden sollte alles ohne Scrollen sichtbar sein.
