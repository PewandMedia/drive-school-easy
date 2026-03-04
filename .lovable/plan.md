

## Zwei Aenderungen im Schuelerprofil

### 1. Fehlstunde: individueller Preis (40 EUR vorgemerkt)

- `fsFahrstunde` State um `fehlstundePreis: "40"` erweitern
- Im Dialog bei `typ === "fehlstunde"`: editierbares Preis-Input statt fester Text, vorausgefuellt mit 40
- Beim Insert: wenn fehlstunde, `preis` Feld mitsenden
- DB-Migration: Trigger `calculate_driving_lesson_price` anpassen -- bei fehlstunde den uebergebenen Preis beibehalten (Default 40 wenn NULL)

### 2. Datum merken nach Speichern (Fahrstunden, Zahlungen, Theorie)

In den `onSuccess`-Handlern das vorherige Datum beibehalten statt auf `new Date()` zurueckzusetzen:

- **Fahrstunde**: `datum: prev.datum` statt `new Date().toISOString().slice(0, 16)`
- **Zahlung**: `datum: prev.datum` statt `new Date().toISOString().slice(0, 10)`
- **Theorie**: `datum: prev.datum` statt `new Date().toISOString().slice(0, 10)`

### Dateien

| Datei | Aenderung |
|---|---|
| `FahrschuelerDetail.tsx` | Fehlstunde-Preis editierbar, Datum beibehalten bei Fahrstunden + Zahlungen + Theorie |
| DB-Migration (neu) | Trigger: bei fehlstunde uebergebenen Preis nutzen statt fest 40 |

