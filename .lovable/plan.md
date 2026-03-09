

## Anmeldedatum fuer automatische Leistungen uebernehmen

### Problem

Beim Anlegen eines Schuelers werden Grundbetrag und Lernmaterial mit dem heutigen Datum gespeichert, statt mit dem gewaehlten Anmeldedatum.

### Loesung

In `src/pages/dashboard/Fahrschueler.tsx`, Zeile 173-181: Beim Erstellen der `servicesToInsert` das `datum`-Feld auf das Anmeldedatum setzen.

```typescript
const servicesToInsert = prices.map((p) => ({
  student_id: newStudent.id,
  preis_id: p.id,
  bezeichnung: p.bezeichnung,
  preis: customPrices[p.id] ?? p.preis,
  status: "offen" as const,
  notiz: angebotsNotiz.trim() || null,
  datum: values.anmeldedatum
    ? values.anmeldedatum.toISOString()
    : new Date().toISOString(),
}));
```

### Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/dashboard/Fahrschueler.tsx` | `datum`-Feld mit Anmeldedatum in services-Insert hinzufuegen |

