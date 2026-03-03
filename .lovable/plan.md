

## "Weniger anzeigen"-Button fuer Fahrstunden

### Was wird gemacht
Wenn mehr als 10 Fahrstunden sichtbar sind, wird ein zweiter Button "Weniger anzeigen" eingeblendet, der die Liste wieder auf 10 Eintraege zurueckklappt.

### Aenderung in FahrschuelerDetail.tsx

Nach dem bestehenden "Weitere X anzeigen"-Button wird ein zusaetzlicher Button ergaenzt:
- Nur sichtbar wenn `visibleLessons > 10`
- Klick setzt `visibleLessons` zurueck auf 10
- Text: "Weniger anzeigen"
- Gleicher Stil wie der "Mehr anzeigen"-Button (ghost, sm, text-xs)

Falls alle Eintraege sichtbar sind (kein "Mehr anzeigen"-Button mehr), wird nur der "Weniger anzeigen"-Button angezeigt. Falls beides sichtbar ist, stehen beide Buttons untereinander.

### Keine weiteren Dateien betroffen

