

## STVA-Gebuehren in die Preisliste einfuegen (korrigiert)

### Aenderungen gegenueber dem urspruenglichen Plan
- **STVA BF17**: Preis korrigiert von 54,80 auf **54,90 EUR**
- **STVA Begleiter** umbenannt zu **STVA BEGPER**
- **STVA Service Begleiter** umbenannt zu **STVA Service Beg**

### Einzufuegende Leistungen

| Bezeichnung | Preis |
|---|---|
| STVA Ersterteilung | 45,90 EUR |
| STVA Service | 24,10 EUR |
| STVA BF17 | 54,90 EUR |
| STVA Service BF17 | 20,10 EUR |
| STVA BEGPER | 12,30 EUR |
| STVA Service Beg | 12,70 EUR |
| STVA FSW | 25,60 EUR |
| STVA FSW Service | 14,40 EUR |

### Technische Umsetzung
Ein einzelnes SQL-INSERT in die `prices`-Tabelle mit Kategorie "STVA Gebuehren" und `aktiv = true`. Kein Frontend-Code noetig -- die Leistungen erscheinen automatisch im "Leistung zuordnen"-Dialog und in der Auswertung.

