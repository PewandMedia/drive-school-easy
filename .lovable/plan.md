# PDF-Export auf Handy reparieren

## Problem
Auf der Handy-Ansicht funktioniert der „Drucken / Als PDF exportieren"-Button nicht zuverlässig. `window.print()` öffnet auf iOS/Android oft keinen vernünftigen Dialog, das `@media print`-Layout bricht im mobilen Viewport, und der `print-area`-Container wird durch den begrenzten Scroll-Container (`#dashboard-scroll`, `overflow-hidden`) abgeschnitten.

Betroffene Stellen:
- `src/pages/dashboard/Tagesabrechnung.tsx` – Tagesabrechnung als PDF
- `src/pages/dashboard/FahrschuelerDetail.tsx` – Druck einzelner Sektionen (Fahrstunden, Leistungen, Zahlungen, Prüfungen) und „Alles drucken"

## Lösung
Hybrid-Ansatz: Auf Mobile echten PDF-Download via `jsPDF` + `html2canvas`, auf Desktop weiterhin `window.print()` (funktioniert dort einwandfrei).

### Schritte

1. **Pakete hinzufügen**
   - `jspdf` und `html2canvas` installieren.

2. **Helper anlegen** (`src/lib/exportPdf.ts`)
   - Funktion `exportElementToPdf(elementId, filename)`:
     - Rendert den Print-Bereich mit `html2canvas` (Scale 2, weißer Hintergrund, CORS aktiv).
     - Teilt das Canvas bei Bedarf auf mehrere A4-Seiten auf (Multi-Page-Logik), damit lange Listen nicht abgeschnitten werden.
     - Speichert die Datei via `jsPDF.save(filename)` → triggert auf Mobilgeräten echten Download/Share.

3. **Print-Bereich mobil-tauglich machen**
   - Der `.print-area`-Container ist aktuell `hidden print:block`. Für die Bildschirm-Erfassung brauchen wir ihn temporär sichtbar, aber off-screen.
   - Beim Export-Klick: Klasse umschalten (`hidden` → `fixed -left-[9999px] top-0 block w-[800px]`), Canvas erzeugen, danach Klasse zurücksetzen.
   - Alternativ: zusätzliche Wrapper-Klasse `print-export-active` einführen, die per Inline-Style sichtbar macht.

4. **Mobile-Erkennung & Button-Logik**
   - In `Tagesabrechnung.tsx` und `FahrschuelerDetail.tsx`: `useIsMobile()`-Hook nutzen.
   - Beim Klick auf „Als PDF exportieren":
     - Mobile → `exportElementToPdf()` aufrufen.
     - Desktop → bisheriger `window.print()`-Pfad bleibt erhalten.

5. **Tagesabrechnung anpassen**
   - Print-Button-Handler ersetzen.
   - Sicherstellen, dass `print-area` bereits gerendert ist, bevor html2canvas läuft (in der bestehenden Struktur immer im DOM, nur via CSS versteckt).

6. **FahrschuelerDetail anpassen**
   - Bestehende Logik mit `printSection` / `printSections` beibehalten (steuert, was im print-area gerendert wird).
   - Statt direkt `window.print()` im `useEffect` aufzurufen, prüfen: Mobile → `exportElementToPdf()`, sonst `window.print()`.
   - Dateinamen sinnvoll setzen, z. B. `Schueler_<Nachname>_<Sektion>.pdf`.

7. **CSS-Anpassung** (`src/index.css`)
   - Neue Klasse `.pdf-export-mode` ergänzen, die den `.print-area` während des Exports sichtbar macht (off-screen positioniert), mit fester Breite ~800px für konsistentes Layout.
   - Bestehendes `@media print` unverändert lassen (Desktop-Druck).

## Technische Details

```ts
// src/lib/exportPdf.ts
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export async function exportElementToPdf(el: HTMLElement, filename: string) {
  el.classList.add("pdf-export-mode");
  try {
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#fff", useCORS: true });
    const pdf = new jsPDF("p", "mm", "a4");
    const pageW = 210, pageH = 297;
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    let heightLeft = imgH;
    let position = 0;
    const img = canvas.toDataURL("image/png");
    pdf.addImage(img, "PNG", 0, position, imgW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      position -= pageH;
      pdf.addPage();
      pdf.addImage(img, "PNG", 0, position, imgW, imgH);
      heightLeft -= pageH;
    }
    pdf.save(filename);
  } finally {
    el.classList.remove("pdf-export-mode");
  }
}
```

```css
/* src/index.css */
.pdf-export-mode {
  position: fixed !important;
  left: -10000px !important;
  top: 0 !important;
  display: block !important;
  width: 800px !important;
  background: white !important;
  color: black !important;
  padding: 24px !important;
  z-index: -1;
}
```

## Out of Scope
- Keine Änderungen an Inhalten/Spalten der Reports.
- Keine Änderung des Desktop-Druckverhaltens.
