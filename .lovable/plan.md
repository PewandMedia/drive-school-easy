

## Theme-Toggle: Glocke durch Dark/Light-Umschalter ersetzen

### Uebersicht

Die Glocke (Bell-Icon) im Header wird durch einen Theme-Toggle-Button ersetzt. Nutzer koennen damit zwischen hellem und dunklem Theme wechseln. Das Projekt hat `next-themes` bereits installiert und `darkMode: ["class"]` ist in der Tailwind-Config aktiv.

---

### 1. Dark-Theme CSS-Variablen hinzufuegen (src/index.css)

Unter den bestehenden `:root`-Variablen wird ein `.dark`-Block ergaenzt mit invertierten Farben:

```text
.dark {
  --background: 220 25% 7%
  --foreground: 210 20% 94%
  --card: 220 22% 10%
  --card-foreground: 210 20% 94%
  --primary: 0 78% 50%  (Rot bleibt gleich)
  --secondary: 220 18% 14%
  --muted: 220 18% 14%
  --muted-foreground: 215 15% 55%
  --border: 220 18% 16%
  --input: 220 18% 16%
  --sidebar-background: 220 22% 10%
  ... etc
}
```

Die rote Primaerfarbe bleibt in beiden Themes gleich fuer konsistentes Branding.

---

### 2. ThemeProvider einbinden (src/App.tsx)

`next-themes` ThemeProvider um die App wrappen:

```text
import { ThemeProvider } from "next-themes"

<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
  ... bestehender App-Inhalt ...
</ThemeProvider>
```

---

### 3. Header: Glocke durch Theme-Toggle ersetzen (src/components/DashboardLayout.tsx)

- `Bell` Import entfernen, `Sun` und `Moon` importieren
- `useTheme()` Hook von `next-themes` verwenden
- Button zeigt Sun-Icon im Dark-Mode, Moon-Icon im Light-Mode
- Klick wechselt zwischen `"light"` und `"dark"`

```text
Vorher:  <Bell />  (keine Funktion)
Nachher: <Sun />   oder  <Moon />  (wechselt Theme)
```

---

### Zusammenfassung

| Datei | Aenderung |
|-------|-----------|
| `src/index.css` | `.dark` Block mit Dark-Theme CSS-Variablen |
| `src/App.tsx` | ThemeProvider wrappen |
| `src/components/DashboardLayout.tsx` | Bell durch Sun/Moon Theme-Toggle ersetzen |

Keine Logik oder Funktionen werden veraendert -- nur die Glocke wird durch den Theme-Umschalter ersetzt.
