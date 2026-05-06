# Mobile-Druck mit nativem Dialog

## Problem
Der aktuelle Mobile-Export erzeugt zwar eine PDF, öffnet sie aber nur als Vorschau ohne Druck-/Speichern-Button (iOS Safari / Android Chrome zeigen das PDF inline an, ohne Aktionen).

## Lösung
Statt einer fertigen PDF-Datei via jsPDF zu generieren, öffnen wir den Print-Bereich in einem neuen Fenster/Tab und rufen dort den nativen Druckdialog auf. Damit bekommt der Nutzer auf jedem Gerät:
- iOS: Teilen-Sheet mit „Drucken" und „In Dateien sichern"
- Android: Druckdialog mit „Als PDF speichern" und Druckerauswahl
- Desktop: gewohnter Druckdialog

Ergebnis: identisches Verhalten wie auf dem PC, mit echtem Drucken-Button.

## Technische Schritte

1. **`src/lib/exportPdf.ts` umbauen**
   - Funktion `printElement(el, title)`:
     - Öffnet `window.open("", "_blank")`.
     - Schreibt ein vollständiges HTML-Dokument: `<html>` mit allen aktuellen `<style>`/`<link>`-Tags der App + dem `outerHTML` des Print-Bereichs.
     - CSS direkt einbettet (A4-Layout, Tabellen-Styles, schwarze Schrift) – identisch zum bisherigen `.pdf-export-mode`.
     - Nach `onload`: `win.focus(); win.print();` – Browser zeigt nativen Drucken-Dialog.
   - Bisheriger jsPDF-Pfad bleibt als Fallback, falls Popup blockiert wird (toast mit Hinweis).
   - jspdf/html2canvas-Imports entfernen (nicht mehr nötig).

2. **`src/pages/dashboard/Tagesabrechnung.tsx`**
   - `handleExport`: auf Mobile `printElement(printRef.current, "Tagesabrechnung_<datum>")` aufrufen, Desktop weiter `window.print()`.

3. **`src/pages/dashboard/FahrschuelerDetail.tsx`**
   - Print-Trigger im `useEffect`: Mobile → `printElement(...)`, Desktop → `window.print()`.

4. **CSS / Print-Styles**
   - Im neuen Fenster ein eingebettetes Stylesheet mit den bestehenden Print-Regeln (A4, Tabellen, Schriftgrößen) verwenden, damit das Ergebnis sauber aussieht.

## Erwartung
Nutzer tippt auf „Als PDF exportieren" → es öffnet sich der native Druckdialog des Geräts → Nutzer kann „Als PDF speichern" oder direkt drucken wählen, genau wie am PC.

## Out of Scope
- Backend-Änderungen.
- Inhaltliche Änderungen an den Berichten.
