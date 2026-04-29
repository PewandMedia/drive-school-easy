## Ziel

Beim Klick auf einen Fahrschüler die ID merken und beim Zurückkehren genau zu dieser Zeile in der Liste scrollen — unabhängig davon, ob die Liste in der Zwischenzeit anders gerendert wurde.

## Problem in der aktuellen Implementierung

In `Fahrschueler.tsx` wird `document.querySelector("main")` verwendet, um die Scroll-Position zu speichern und wiederherzustellen. Das Layout enthält jedoch zwei `<main>`-Elemente:

- `SidebarInset` (`src/components/ui/sidebar.tsx`) rendert ein `<main>` ohne Scroll
- `DashboardLayout` (`src/components/DashboardLayout.tsx`) rendert _innerhalb_ davon ein zweites `<main className="flex-1 overflow-auto p-6">` — das ist der echte Scroll-Container

`querySelector("main")` trifft den ersten Treffer (den nicht-scrollenden), folglich ist `scrollTop` immer 0 und das Restore tut nichts Sichtbares.

## Lösung

### 1. `DashboardLayout.tsx` — Scroll-Container eindeutig markieren

Dem scrollenden `<main>` ein stabiles Attribut geben, z. B. `id="dashboard-scroll"`, damit alle Seiten denselben Container ansprechen können.

### 2. `Fahrschueler.tsx` — ID-basiertes Restore

- Beim Klick auf einen Schüler vor dem `navigate(...)` die `student.id` zusammen mit Filterzustand und visibleCount in `sessionStorage` speichern (Key bleibt `fahrschueler-list-state`, neues Feld `lastStudentId`).
- `scrollY` parallel weiter speichern als Fallback (gegen `#dashboard-scroll`).
- Restore-Logik (nach `allLoading === false`):
  1. Wenn `lastStudentId` vorhanden: Element via `document.querySelector(\`[data-student-id="\${id}"]\`)` suchen, in zwei `requestAnimationFrame`-Frames auf den Container scrollen (`scrollIntoView({ block: "center" })`). Kurzes Highlight (z. B. `ring-2 ring-primary/40` für ~1.2s) zur visuellen Bestätigung.
  2. Sonst Fallback auf gespeichertes `scrollY`.
  3. `lastStudentId` nach erfolgreichem Restore löschen, damit ein normales Neuladen der Seite oben startet.
- Den Listen-Eintrag (`<button>`) mit `data-student-id={student.id}` versehen.
- Alle vorhandenen `document.querySelector("main")` durch `document.getElementById("dashboard-scroll")` ersetzen.

### 3. Edge Cases

- Wenn der Nutzer einen Filter ändert und der gemerkte Schüler nicht mehr sichtbar ist (z. B. Klasse passt nicht), greift der Fallback auf `scrollY`.
- Sidebar-Navigation („Fahrschüler" erneut klicken) führt aktuell schon dazu, dass die Komponente bestehen bleibt; der Fix ändert daran nichts.

## Technische Details

| Datei | Änderung |
|---|---|
| `src/components/DashboardLayout.tsx` | `<main>` erhält `id="dashboard-scroll"` |
| `src/pages/dashboard/Fahrschueler.tsx` | `STORAGE_KEY` um `lastStudentId` erweitern; `onClick` der Schülerzeile setzt `lastStudentId` vor `navigate`; `data-student-id` am Listen-Button; Restore-`useEffect` scrollt zur Zeile via `scrollIntoView`, mit Fallback auf `scrollY`; alle `querySelector("main")` ersetzt durch `getElementById("dashboard-scroll")`; kurzer Highlight-State (`highlightId`) für ~1200 ms |

Keine DB-Änderungen, keine neuen Dependencies, keine Logikänderung an Daten.
