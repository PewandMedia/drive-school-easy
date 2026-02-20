
## Preisliste und Fahrzeuge entfernen

### Aenderungen

**1. Sidebar (`src/components/AppSidebar.tsx`)**
- "Preisliste" und "Fahrzeuge" aus dem `verwaltungItems`-Array entfernen
- Da dann nur noch "Leistungen" uebrig bleibt, bleibt die Verwaltung-Gruppe mit einem Eintrag bestehen
- Unbenutzte Imports entfernen: `DollarSign`, `Truck`

**2. Router (`src/App.tsx`)**
- Route `/dashboard/preisliste` entfernen
- Route `/dashboard/fahrzeuge` entfernen
- Unbenutzte Imports entfernen: `Preisliste`, `Fahrzeuge`

**3. Dateien loeschen**
- `src/pages/dashboard/Preisliste.tsx`
- `src/pages/dashboard/Fahrzeuge.tsx`
