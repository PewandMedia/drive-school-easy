

## Sortier-Toggle auf der Abrechnungsseite

### Uebersicht

Die Tabelle ist bereits standardmaessig nach hoechstem Saldo sortiert. Es wird ein Toggle-Button hinzugefuegt, mit dem zwischen zwei Sortierungen gewechselt werden kann: **nach offenem Saldo (absteigend)** und **alphabetisch nach Name**.

### Aenderungen

**Datei: `src/pages/dashboard/Abrechnung.tsx`**

1. **Neuer State**: `sortBySaldo: boolean` (Default: `true`, da bereits so sortiert)
2. **Toggle-Button** neben dem Suchfeld im Tabellenkopf-Bereich: 
   - Icon: `ArrowDownWideNarrow` (aus lucide-react)
   - Text: "Nach Saldo" / "Nach Name" je nach aktuellem Zustand
   - Aktiver Zustand (Saldo-Sortierung) wird visuell hervorgehoben (z.B. `variant="default"` vs `variant="outline"`)
3. **Sortierlogik anpassen**: Die bestehende `sorted`-Variable wird abhaengig vom State entweder nach `saldo` (absteigend) oder nach `nachname` (alphabetisch aufsteigend) sortiert
4. **Untertitel anpassen**: Der Text "Sortiert nach offenstem Saldo" wird dynamisch auf die aktive Sortierung angepasst

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/Abrechnung.tsx` | State, Toggle-Button, dynamische Sortierlogik |

