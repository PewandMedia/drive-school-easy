# Mobile-Performance verbessern

## Ziel
Schnellere Ladezeiten und flüssigere Bedienung auf Handys, ohne Funktionalität oder Design zu ändern.

## Maßnahmen

### 1. Code-Splitting via Lazy Loading
Aktuell wird in `src/App.tsx` jede Dashboard-Seite synchron importiert (~9.500 Zeilen Code im initialen Bundle, plus jspdf/html2canvas). Auf Mobile = sehr großer JS-Download.
- Alle Dashboard-Routen mit `React.lazy()` laden.
- `<Suspense>` mit kleinem Lade-Spinner um die Routes legen.
- `Login` und `DashboardLayout` bleiben eager (sofort sichtbar).
- Erwartung: initiales Bundle ~60–80 % kleiner.

### 2. PDF-Export-Libs nur bei Bedarf laden
`jspdf` und `html2canvas` (~400 KB) werden in `src/lib/exportPdf.ts` aktuell statisch importiert.
- Auf dynamische Imports umstellen (`await import("jspdf")`).
- Wird damit erst geladen, wenn der Nutzer wirklich auf "PDF exportieren" tippt.

### 3. React Query Defaults schärfen
In `src/App.tsx` wird `new QueryClient()` ohne Defaults verwendet → unnötiges Refetching auf Mobile (jeder Tab-Wechsel triggert Netzwerk).
- `staleTime: 60_000` (Daten 1 min frisch).
- `refetchOnWindowFocus: false`, `refetchOnReconnect: false`.
- `gcTime: 5 * 60_000`.

### 4. Schwere Listen weniger render-intensiv
- `Fahrschueler.tsx` (786 Zeilen, große Studentenliste): Listenzeilen mit `React.memo` umhüllen, damit nicht alle Zeilen bei Highlight/State-Änderung neu rendern.
- Bestehende Pagination (`visibleCount` mit "Load more") bleibt — sie schützt vor zu vielen DOM-Knoten.

### 5. Kleinere Mobile-Optimierungen
- In `index.html` `<meta name="viewport">` prüfen und falls nötig `viewport-fit=cover` ergänzen.
- `will-change`/Animationen auf Mobile reduzieren ist nicht nötig — Code nutzt bereits Tailwind-Standardanimationen.

## Out of Scope
- FahrschuelerDetail.tsx (3130 Zeilen) komplett refactoren — zu großer Eingriff, separater Plan empfohlen.
- Backend/Query-Änderungen.
- Design-Änderungen.

## Erwartung
- Initialer Login → Dashboard deutlich schneller auf Mobile (kleineres JS-Bundle).
- Weniger Netzwerk-Traffic beim Tab-Wechsel.
- PDF-Funktion lädt ihre Libs erst bei Klick → spart ~400 KB beim Start.
