## Fahrschüler-Liste: 30er-Schritte + Position merken

### Probleme
1. **"Weitere anzeigen"-Button** lädt aktuell nur 10 weitere Schüler — soll **30** sein.
2. Wenn man auf ein Profil klickt und mit Browser-Zurück (oder über die Sidebar "Fahrschüler") zurückkehrt, springt die Liste an den **Anfang**. Suche, Archiv-Toggle, Fahrschule-Filter, geladene Anzahl und Scroll-Position gehen verloren.

### Lösung

**1. Pagination auf 30 umstellen** (`src/pages/dashboard/Fahrschueler.tsx`)

| Stelle | Alt | Neu |
|---|---|---|
| Initialer `visibleCount` | `useState(10)` | `useState(30)` |
| Reset bei Toggle/Filter/Suche | `setVisibleCount(10)` | `setVisibleCount(30)` |
| Increment-Step im Button | `c + 10` | `c + 30` |
| Button-Label-Math | `Math.min(10, remaining)` | `Math.min(30, remaining)` |

**2. Liste-Status beim Verlassen merken**

State, der erhalten bleiben soll:
- `search` (Suchtext)
- `filterFahrschule` ("alle" / "riemke" / "rathaus")
- `showArchive` (true/false)
- `visibleCount` (geladene Anzahl)
- `window.scrollY` (Scroll-Position)

**Ansatz**: `sessionStorage` mit Key `fahrschueler-list-state`. Vorteile: einfach, überlebt sowohl Sidebar-Klick (komplettes Unmount) als auch Browser-Zurück, wird beim Tab-Schließen automatisch verworfen.

Implementierung in `Fahrschueler.tsx`:

```ts
const STORAGE_KEY = "fahrschueler-list-state";

// Beim Mount: gespeicherten State laden (lazy initial state)
const [search, setSearch] = useState(() => {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}").search ?? ""; }
  catch { return ""; }
});
// analog für filterFahrschule, showArchive, visibleCount (Default 30)

// Beim Unmount + bei jeder Navigation zum Profil: State + scrollY speichern
useEffect(() => {
  return () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      search, filterFahrschule, showArchive, visibleCount,
      scrollY: window.scrollY,
    }));
  };
}, [search, filterFahrschule, showArchive, visibleCount]);

// Nach Daten-Load: Scroll-Position wiederherstellen (einmalig)
useEffect(() => {
  if (allLoading) return;
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
    if (typeof saved.scrollY === "number") {
      window.scrollTo({ top: saved.scrollY, behavior: "instant" as ScrollBehavior });
    }
  } catch {}
  // nur einmal nach erstem erfolgreichem Load
}, [allLoading]);
```

Wichtig: Scroll-Container im Layout ist `<main class="flex-1 overflow-auto">` in `DashboardLayout.tsx` — `window.scrollY` reicht hier nicht. Stattdessen müssen wir das `<main>`-Element scrollen. Lösung:

- Im Restore: `document.querySelector("main")?.scrollTo({ top: saved.scrollY })`
- Im Save: `scrollY = document.querySelector("main")?.scrollTop ?? 0`

### Technische Details

| Datei | Änderung |
|---|---|
| `src/pages/dashboard/Fahrschueler.tsx` | `visibleCount` Default & Reset auf 30; Increment im Button auf 30; sessionStorage-basiertes State-Persisting für `search`, `filterFahrschule`, `showArchive`, `visibleCount` und `main`-Scroll-Position; Restore nach erstem Daten-Load |

Keine DB-Änderungen, keine neuen Dependencies, keine Änderungen an Sidebar/Layout.
