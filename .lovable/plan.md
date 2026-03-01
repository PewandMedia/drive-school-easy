

## Preise im Formular editierbar machen

### Uebersicht

Die Info-Box im Dialog "Neuer Fahrschueler" wird so erweitert, dass die Preise fuer Grundbetrag und Lernmaterial nicht nur angezeigt, sondern auch direkt im Formular geaendert werden koennen. Die statische Preisanzeige wird durch editierbare Input-Felder ersetzt.

### Aenderungen

**Datei: `src/pages/dashboard/Fahrschueler.tsx`**

**1. Neuer State fuer editierbare Preise**

Ein neuer State `customPrices` speichert die individuell angepassten Preise als `Record<string, number>` (Key = Preis-ID, Value = angepasster Preis). Dieser wird initial aus den geladenen `autoPrices` befuellt, sobald diese verfuegbar sind (via `useEffect`).

**2. Info-Box: Preis-Anzeige durch Input-Felder ersetzen**

Statt der statischen Preisanzeige bekommt jede Zeile ein kleines Eingabefeld (type="number") rechts, in dem der Preis editierbar ist. Das Gesamt wird dynamisch aus `customPrices` berechnet.

```text
┌─────────────────────────────────────────┐
│  Automatisch hinzugefuegte Leistungen:  │
│                                         │
│  ✓ Grundbetrag           [ 299,00 ] EUR │
│  ✓ Lernmaterial          [  80,00 ] EUR │
│  ─────────────────────────────────────  │
│  Gesamt                     379,00 EUR  │
└─────────────────────────────────────────┘
```

**3. Mutation anpassen: Editierte Preise verwenden**

Die `createMutation` verwendet beim Einfuegen der Services nicht mehr `p.preis` aus der Preisliste, sondern den Wert aus `customPrices[p.id]`. So wird der vom Nutzer angepasste Preis gespeichert.

**4. Reset bei Dialog-Schliessung**

Beim Schliessen/Zuruecksetzen des Dialogs wird `customPrices` ebenfalls zurueckgesetzt.

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/Fahrschueler.tsx` | State `customPrices` + `useEffect` fuer Initialisierung, Input-Felder in Info-Box, Mutation nutzt editierte Preise, Reset beim Schliessen |

