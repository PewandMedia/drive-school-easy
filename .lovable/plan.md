## Ziel
`src/pages/Login.tsx` bekommt das Split-Screen-Layout aus dem hochgeladenen Screenshot – links eine farbige Marken-Sektion, rechts das eigentliche Login-Formular. Statt Blau wird die bestehende Primärfarbe Rot (`--primary: 0 78% 50%`) verwendet, und die Inhalte werden auf die Fahrschulverwaltung zugeschnitten. Kein Business-/Steuer-Kontext.

## Layout (nur `src/pages/Login.tsx`)

```text
┌───────────────────────────┬──────────────────────────┐
│  Rote Brand-Sektion       │  Weiße Login-Sektion     │
│  (nur ab md: sichtbar)    │  (immer sichtbar)        │
│                           │                          │
│  [Logo] FAHRSCHUL-        │  Willkommen zurück       │
│         VERWALTUNG        │  Bitte melden Sie sich   │
│                           │  an, um fortzufahren.    │
│  Fahrschule verwalten,    │                          │
│  neu gedacht.             │  E-Mail                  │
│                           │  [ Input                ] │
│  Die interne Software     │                          │
│  für Ihre Fahrschule…     │  Passwort                │
│                           │  [ Input            👁  ] │
│  🛡  Daten geschützt      │                          │
│      DSGVO-konform        │  [   Anmelden  →       ] │
│  🇩🇪  Hosting Deutschland │                          │
│      Serverstandort DE    │  Kein Zugang? Wenden Sie │
│                           │  sich an die Fahrschul-  │
│  © 2026 Fahrschulverw.    │  leitung.                │
└───────────────────────────┴──────────────────────────┘
```

Grid: `grid-cols-1 md:grid-cols-2`, volle Höhe (`min-h-screen`). Auf Mobil nur die rechte Karte, linke Sektion versteckt.

## Linke Sektion – rotes Panel
- `bg-primary text-primary-foreground` mit dezentem Grid-Hintergrund (SVG-Pattern via inline `backgroundImage`, weiße Linien mit ~6 % Deckkraft, damit es dem Screenshot entspricht, aber zur Rot-Palette passt).
- Oben: Logo-Badge (weißes Quadrat mit rotem `Car`-Icon) + Wortmarke „FAHRSCHULVERWALTUNG".
- Headline zweizeilig: „Fahrschule verwalten," / „neu gedacht.", groß, `font-bold`, `tracking-tight`.
- Kurzer Absatz zur Software (interne Verwaltung für Fahrschüler, Fahrstunden, Prüfungen, Zahlungen).
- Zwei Feature-Kacheln in halbtransparenten Boxen (`bg-white/10`, `border-white/15`):
  1. `ShieldCheck` – „Daten geschützt" / „DSGVO-konform, verschlüsselt".
  2. `Server` (oder `MapPin`) – „Hosting in Deutschland" / „Serverstandort DE".
- Footer: `© 2026 Fahrschulverwaltung`.

## Rechte Sektion – Login-Formular
- Zentriert, `bg-background text-foreground`, max. Breite ~`max-w-sm`.
- Überschrift „Willkommen zurück" (`text-2xl font-bold`) + Untertitel „Bitte melden Sie sich an, um fortzufahren."
- Formularfelder wie im Screenshot:
  - `E-Mail` – Input mit `Mail`-Icon links (Platzhalter `name@fahrschule.de`).
  - `Passwort` – Input mit `Lock`-Icon links und `Eye`/`EyeOff`-Toggle rechts (neuer lokaler State `showPassword`).
- Fehlermeldung wie bisher (`text-destructive`, `bg-destructive/10`).
- Anmelde-Button: `w-full`, `bg-primary`, mit `ArrowRight`-Icon rechts; Ladezustand „Anmelden…".
- Hilfetext unter dem Button: „Kein Zugang? Wenden Sie sich an die Fahrschulleitung."

## Beibehalten
- Auth-Logik (`supabase.auth.signInWithPassword`, `useAuth`, `Navigate` bei aktiver Session) bleibt unverändert.
- Keine neuen Dependencies; Icons kommen aus `lucide-react` (`Car`, `Mail`, `Lock`, `Eye`, `EyeOff`, `ShieldCheck`, `Server`, `ArrowRight`).
- Farben ausschließlich über Design-Tokens (`bg-primary`, `text-primary-foreground`, `bg-background`, `text-muted-foreground` …) – keine Hardcode-Hex-Werte.

## Verifikation
- `/login` zeigt Desktop das Split-Layout: linkes rotes Panel mit Fahrschul-Content, rechts das Formular.
- Auf Mobil (`<768px`) wird nur das Formular angezeigt, keine leere rote Fläche.
- Login funktioniert weiterhin (gleiche Handler), Passwort-Toggle schaltet zwischen `password` und `text` um.
