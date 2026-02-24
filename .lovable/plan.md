

## Sidebar modernisieren: Aktiver Reiter mit roetlicher Markierung

### Was wird geaendert

Der aktive Sidebar-Eintrag bekommt eine dezente roetliche Hintergrundfarbe und der Text/Icon wird in der Branding-Rot-Farbe hervorgehoben. Zusaetzlich erhaelt der aktive Eintrag einen kleinen roten Balken links als visuellen Indikator.

### Aenderungen

**1. CSS-Variablen anpassen (`src/index.css`)**

Die `--sidebar-accent` Variable wird von neutralem Grau auf ein zartes Rot geaendert:

```text
Light-Theme (:root):
  --sidebar-accent:            0 78% 50% / 0.08   (sehr zartes Rot)
  --sidebar-accent-foreground: 0 78% 45%           (roter Text)

Dark-Theme (.dark):
  --sidebar-accent:            0 78% 50% / 0.12   (zartes Rot, etwas kraeftiger)
  --sidebar-accent-foreground: 0 78% 60%           (helles Rot)
```

**2. Aktiver Sidebar-Button mit linkem Balken (`src/components/ui/sidebar.tsx`)**

In der `sidebarMenuButtonVariants` wird der aktive Zustand ergaenzt:

- `data-[active=true]:bg-sidebar-accent` bleibt (wird jetzt roetlich durch CSS-Variable)
- Zusaetzlich: `data-[active=true]:border-l-2 data-[active=true]:border-primary` fuer einen roten Strich links
- Der Hover-Effekt bleibt neutral, nur der aktive Zustand wird rot

### Ergebnis

| Zustand | Vorher | Nachher |
|---------|--------|---------|
| Normal | Grauer Text | Unveraendert |
| Hover | Grauer Hintergrund | Unveraendert |
| Aktiv | Grauer Hintergrund + fett | Zartrosa Hintergrund + roter Text + roter Balken links |

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/index.css` | `--sidebar-accent` und `--sidebar-accent-foreground` in Light und Dark auf Rot-Toene |
| `src/components/ui/sidebar.tsx` | `data-[active=true]` Klassen um Border-Left ergaenzen |

Keine Logik oder Funktionen werden veraendert.

