

## Betrag automatisch aus ausgewaehlten offenen Posten berechnen

### Problem
Wenn man im "Zahlung erfassen"-Dialog einen offenen Posten per Checkbox auswaehlt, bleibt das Betrag-Feld leer. Der Benutzer muss den Betrag manuell eintippen.

### Loesung
Beim An-/Abwaehlen einer Checkbox wird der Betrag automatisch als Summe aller offenen Betraege der ausgewaehlten Posten berechnet und ins Betrag-Feld eingetragen.

### Aenderung: `src/pages/dashboard/FahrschuelerDetail.tsx`

In der `onCheckedChange`-Funktion der Checkbox (ca. Zeile 1386-1393):

- Nach dem Aktualisieren von `selectedOpenItems` auch `betrag` neu berechnen
- Summe aller offenen Betraege (`betrag_gesamt - betrag_bezahlt`) der ausgewaehlten Posten
- Wert als String ins `betrag`-Feld schreiben (z.B. "240" oder "305")

**Vorher:**
```typescript
onCheckedChange={(c) => {
  setFsZahlung((f) => ({
    ...f,
    selectedOpenItems: c
      ? [...f.selectedOpenItems, oi.id]
      : f.selectedOpenItems.filter((x) => x !== oi.id),
  }));
}}
```

**Nachher:**
```typescript
onCheckedChange={(c) => {
  setFsZahlung((f) => {
    const newSelected = c
      ? [...f.selectedOpenItems, oi.id]
      : f.selectedOpenItems.filter((x) => x !== oi.id);
    const summe = offenePosten
      .filter((item: any) => newSelected.includes(item.id))
      .reduce((sum: number, item: any) => sum + (Number(item.betrag_gesamt) - Number(item.betrag_bezahlt)), 0);
    return {
      ...f,
      selectedOpenItems: newSelected,
      betrag: summe > 0 ? summe.toFixed(2) : "",
    };
  });
}}
```

Der Betrag bleibt weiterhin manuell ueberschreibbar -- er wird nur beim Klicken auf eine Checkbox automatisch aktualisiert.

### Zusammenfassung

| Datei | Aenderung |
|-------|-----------|
| FahrschuelerDetail.tsx | Betrag automatisch aus Checkbox-Auswahl berechnen (ca. 5 Zeilen geaendert) |

