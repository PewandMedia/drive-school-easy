## Ziel
Beim Drucken der Zahlungs­übersicht eines Schülers soll man vorher nach Filiale filtern (Riemke Markt / Rathaus / Beide) und die gewählte Filiale wird in jeder Zeile der PDF sowie im Kopfbereich angezeigt.

## Änderungen in `src/pages/dashboard/FahrschuelerDetail.tsx`

1. **Neuer State**
   - `printFilialeFilter: "alle" | "riemke" | "rathaus"` (Default `"alle"`).

2. **Auslöser für Zahlungs-Druck anpassen**
   - Klick auf das Drucker-Icon im Zahlungs-Abschnitt (Zeile 2006) öffnet nicht mehr direkt den Druck, sondern einen kleinen Auswahl-Dialog „Filiale wählen" mit drei Optionen (Riemke Markt / Rathaus / Beide zusammen). Erst „Drucken" setzt `setPrintSection("zahlungen")`.
   - Im Sammel-Druck-Dialog (Alle-Bereiche-Auswahl) wird zusätzlich derselbe Filialen-Selector eingeblendet, sobald „Zahlungen" mit ausgewählt ist.

3. **Filterlogik für den Druck**
   - Helper `filteredPrintPayments = payments.filter(p => filter==="alle" || (p.filiale ?? student.fahrschule) === filter)`.
   - Wird sowohl im `singlePrintRef`-Block (Zeilen 2886–2910) als auch im `multiPrintRef`-Block für Zahlungen verwendet.

4. **PDF-Darstellung**
   - Kopfzeile bekommt eine zusätzliche Zeile: `Filiale: Riemke Markt` / `Rathaus` / `Alle Filialen`.
   - Neue Spalte **„Filiale"** in der Zahlungs-Tabelle (Single- und Multi-Print) mit Werten „Riemke", „Rathaus" oder „–" (bei Altdaten ohne Zuordnung greift Fallback auf Schüler-Filiale).
   - Gesamtsumme berechnet sich aus den gefilterten Zahlungen.

5. **Bildschirm-Ansicht** bleibt unverändert – nur der Druck-Workflow wird erweitert.

## Verifikation
- Manuell: Drucker-Icon bei Zahlungen → Dialog erscheint → jede Filialen-Option erzeugt die richtige PDF-Vorschau (Kopf + Zeilen + Summe).
- Für Altzahlungen ohne `filiale` wird die Fahrschule des Schülers als Fallback benutzt, damit historische Datensätze korrekt gruppiert werden.