

## Automatische Leistungen im Formular anzeigen

### Uebersicht

Im Dialog "Neuer Fahrschueler" wird eine Info-Box ergaenzt, die dem Nutzer direkt zeigt, welche Leistungen automatisch hinzugefuegt werden. Die Preise werden live aus der Preisliste geladen.

### Aenderung

**Datei: `src/pages/dashboard/Fahrschueler.tsx`**

1. **Preise fuer die Anzeige laden** -- Ein separater `useQuery` laedt die aktiven Preise fuer "Grundbetrag" und "Lernmaterial" aus der `prices`-Tabelle. Diese werden nur fuer die Anzeige im Formular verwendet.

2. **Info-Box im Dialog einfuegen** -- Zwischen dem Umschreiber-Toggle und den Buttons wird ein dezenter Hinweisbereich eingefuegt:

```text
┌─────────────────────────────────────────┐
│  Automatisch hinzugefuegte Leistungen:  │
│                                         │
│  ✓ Grundbetrag              299,00 EUR  │
│  ✓ Lernmaterial              80,00 EUR  │
│  ─────────────────────────────────────  │
│  Gesamt                     379,00 EUR  │
└─────────────────────────────────────────┘
```

- Hintergrund: zartes Blau/Grau (`bg-muted/50`) mit Border
- Haekchen-Icon (CheckCircle) vor jedem Eintrag
- Preise rechtsbuendig mit Waehrungsformatierung
- Summenzeile mit Trennlinie
- Falls keine Preise in der Preisliste aktiv sind, wird die Box nicht angezeigt

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/Fahrschueler.tsx` | `useQuery` fuer Preisanzeige + Info-Box im Dialog |

Keine Logik-Aenderungen an der Mutation -- die funktioniert bereits korrekt. Nur eine visuelle Ergaenzung im Formular.

