

## Redesign: Helles Premium-Theme mit roter Branding-Farbe

### Uebersicht

Das gesamte Design wird von einem dunklen Navy/Amber-Theme auf ein helles, serioes-modernes Theme mit roter Branding-Akzentfarbe umgestellt. Keine Logik oder Funktionen werden veraendert -- nur CSS-Variablen, Farbklassen und das Copyright-Jahr.

---

### 1. CSS-Variablen komplett umstellen (src/index.css)

Die `:root`-Variablen werden von dunkel auf hell geaendert:

```text
Vorher (Dark):                    Nachher (Light):
--background: 220 25% 7%         --background: 0 0% 98%
--foreground: 210 20% 94%        --foreground: 220 20% 10%
--card: 220 22% 10%              --card: 0 0% 100%
--primary: 38 95% 52% (Amber)    --primary: 0 80% 50% (Rot)
--secondary: 220 18% 14%         --secondary: 220 14% 96%
--muted: 220 18% 14%             --muted: 220 14% 96%
--border: 220 18% 16%            --border: 220 13% 91%
--sidebar-background: dunkel     --sidebar-background: hell/weiss
```

Die Gradient-Variablen werden ebenfalls angepasst:
- `--gradient-hero`: Heller Gradient (weiss zu hellgrau)
- `--gradient-accent`: Rot-Gradient statt Amber
- `--shadow-glow`: Roter Schimmer statt Amber

---

### 2. Hardcoded Farben in Komponenten anpassen

Alle Stellen mit `text-amber-400`, `text-blue-400`, `text-green-400` etc. werden auf Farben umgestellt, die im hellen Theme funktionieren (dunklere Varianten wie `-600` oder `-700`):

| Datei | Aenderung |
|-------|-----------|
| `Dashboard.tsx` | Stats-Icon-Farben: `text-blue-400` wird `text-blue-600`, `text-amber-400` wird `text-red-600`, etc. Saldo-Badge von amber auf rot umstellen |
| `Fahrschueler.tsx` | `klasseColors` von `/15 + -400` auf `/10 + -600` Varianten |
| `FahrschuelerDetail.tsx` | Gleiche Farbanpassungen fuer Klasse-Badges, Saldo, Fortschrittsbalken, Sonderfahrten |
| `Leistungen.tsx` | Status-Farben von `-400` auf `-600` |
| `Zahlungen.tsx` | Statistik-Karten Farben |
| `Tagesabrechnung.tsx` | Falls amber/dark-Farben vorhanden |

---

### 3. Sidebar anpassen (AppSidebar.tsx)

- Copyright von "2025" auf "2026" aendern
- Die Sidebar nutzt CSS-Variablen (`sidebar-background`, etc.) die automatisch durch die CSS-Aenderung hell werden

---

### 4. Login-Seite (Login.tsx)

- Der Glow-Effekt wird dezenter/hell angepasst (nutzt `hsl(var(--primary))`, wird automatisch rot)
- Keine strukturellen Aenderungen noetig

---

### 5. Index/Landing Page (Index.tsx)

- Nutzt `--gradient-hero` und `--gradient-accent` -- wird automatisch durch CSS-Variablen-Aenderung hell
- Grid-Overlay Opacity ggf. leicht anpassen

---

### Zusammenfassung der Dateiaenderungen

| Datei | Was wird geaendert |
|-------|-------------------|
| `src/index.css` | Alle CSS-Variablen auf helles Theme + rote Primaerfarbe |
| `src/components/AppSidebar.tsx` | Copyright 2025 auf 2026 |
| `src/pages/dashboard/Dashboard.tsx` | Icon-Farben und Badge-Farben fuer helles Theme |
| `src/pages/dashboard/Fahrschueler.tsx` | `klasseColors` Farbanpassung |
| `src/pages/dashboard/FahrschuelerDetail.tsx` | Farbanpassungen fuer Badges, Saldo, Fortschritt |
| `src/pages/dashboard/Leistungen.tsx` | Status-Farben |
| `src/pages/dashboard/Zahlungen.tsx` | Statistik-Farben |

### Design-Richtung

- **Hintergrund**: Fast-weiss (#FAFAFA / hsl(0 0% 98%))
- **Cards**: Reines Weiss mit subtilen Borders
- **Primaerfarbe**: Modernes Rot (hsl(0 80% 50%) -- kraeftiges, aber nicht aggressives Rot)
- **Text**: Dunkles Anthrazit statt Weiss
- **Sidebar**: Heller Hintergrund, dunkler Text
- **Serioes und Clean**: Wenig Schatten, klare Linien, professionell

