

## "Mehr anzeigen"-Button fuer Fahrstunden im Schuelerprofil

### Was wird gemacht
Der statische Text "+ 18 weitere Eintraege" wird durch einen klickbaren Button ersetzt, der die restlichen Fahrstunden in 10er-Schritten nachlaedt -- identisch zum Muster auf anderen Listenseiten.

### Aenderung in FahrschuelerDetail.tsx

1. Neuen State `visibleLessons` mit Startwert 10 hinzufuegen
2. `lessons.slice(0, 10)` durch `lessons.slice(0, visibleLessons)` ersetzen
3. Den statischen `<p>+ X weitere Eintraege</p>` Text durch einen Button ersetzen:
   - Zeigt "Weitere X von Y anzeigen" an
   - Klick erhoeht `visibleLessons` um 10
   - Wird ausgeblendet sobald alle Eintraege sichtbar sind

### Keine weiteren Aenderungen noetig
Nur eine Datei betroffen, nur ein State und 2 Zeilen Logik-Anpassung.

