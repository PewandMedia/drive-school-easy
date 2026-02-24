
## Browser-Header und -Footer beim PDF-Druck entfernen

### Problem

Beim PDF-Export ueber `window.print()` fuegt der Browser automatisch hinzu:
- **Oben**: Datum/Uhrzeit und "Lovable App" (Seitentitel)
- **Unten**: Die URL und Seitenzahl

### Loesung

In `src/index.css` wird innerhalb des bestehenden `@media print` Blocks eine `@page`-Regel ergaenzt, die die Browser-Raender auf 0 setzt und so Header/Footer entfernt. Zusaetzlich wird ein kleines Padding auf dem Body gesetzt, damit der Inhalt nicht am Seitenrand klebt.

### Aenderung in `src/index.css`

Im `@media print` Block (Zeile 77-93) wird folgendes ergaenzt:

```css
@page {
  margin: 0;
}
```

Und auf `.print-area` wird ein eigenes Padding gesetzt (z.B. `padding: 20mm`), damit der Inhalt trotzdem korrekt positioniert ist.
