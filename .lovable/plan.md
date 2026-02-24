

## Performance-Optimierung: Limits, "Mehr anzeigen" und Tabellenumstellung

### Uebersicht

Alle Reiter werden auf ein "Mehr anzeigen"-System umgestellt, um die Performance mit 400+ Schuelern zu gewaehrleisten. Statistik-Cards zaehlen weiterhin ueber 1000 hinaus. Fahrstunden werden von Cards auf eine Tabelle umgestellt.

---

### 1. Statistik-Cards: Zaehlung ueber 1000 hinaus

**Betrifft**: Dashboard, Fahrstunden, Theorie, Schaltstunden, Pruefungen, Leistungen, Zahlungen

Aktuell werden alle Daten korrekt gezaehlt – das Problem liegt vermutlich am Supabase-Default-Limit von 1000 Zeilen pro Query. Alle Queries die fuer Statistiken verwendet werden, bekommen ein explizites `.limit()` entfernt bzw. es wird sichergestellt, dass die Daten vollstaendig geladen werden, indem Supabase-Queries mit Paginierung oder Count-Abfragen ergaenzt werden.

**Loesung**: Fuer Statistik-Werte werden separate Count/Sum-Queries verwendet (z.B. `supabase.from("driving_lessons").select("*", { count: "exact", head: true })`) oder die Queries bekommen ein hohes Limit (z.B. 10000), damit alle Eintraege gezaehlt werden.

---

### 2. Fahrstunden-Reiter: Cards durch Tabelle ersetzen + Tages-Logik

**Datei**: `src/pages/dashboard/Fahrstunden.tsx`

- Die gruppierte Card-Ansicht (groupedByStudent) wird entfernt
- Stattdessen eine einzelne Tabelle wie bei Schaltstunden mit Spalten: Schueler, Datum, Typ, Fahrzeug, Dauer, **Preis**, Loeschen
- **Tages-Logik**: Zuerst werden alle Fahrstunden von heute angezeigt (kein Limit). Falls keine vorhanden: "Heute noch keine Fahrstunden eingetragen"
- Darunter ein "Mehr anzeigen"-Button, der jeweils 10 aeltere Eintraege nachlaedt

---

### 3. Schaltstunden-Reiter: Preis-Spalte + Limit

**Datei**: `src/pages/dashboard/Schaltstunden.tsx`

- Neue Spalte **Preis** in der Tabelle (Daten sind bereits in `driving_lessons.preis` vorhanden, muessen nur im Query mit selektiert werden)
- Tages-Logik: Alle von heute anzeigen, dann "Mehr anzeigen" fuer aeltere (10er-Limit)

---

### 4. Theorie-Reiter: Tages-Logik

**Datei**: `src/pages/dashboard/Theorie.tsx`

- Alle Theoriestunden von **heute** komplett anzeigen (kein Limit)
- Falls keine vorhanden: "Heute noch keine Theoriestunden hinzugefuegt"
- Button "Aeltere Eintraege anzeigen" laedt jeweils 10 weitere aus vergangenen Tagen

---

### 5. Pruefungen-Reiter: 10er-Limit

**Datei**: `src/pages/dashboard/Pruefungen.tsx`

- Standardmaessig nur die neusten 10 Pruefungen anzeigen
- "Mehr anzeigen"-Button laedt jeweils 10 weitere nach

---

### 6. Leistungen-Reiter: 10er-Limit

**Datei**: `src/pages/dashboard/Leistungen.tsx`

- Standardmaessig nur die neusten 10 Leistungen anzeigen (gruppiert nach Schueler bleibt, aber mit Limit auf die Gesamtanzahl)
- "Mehr anzeigen"-Button laedt jeweils 10 weitere nach

---

### 7. Zahlungen-Reiter: Tages-Logik + Limit

**Datei**: `src/pages/dashboard/Zahlungen.tsx`

- Zuerst alle Zahlungen von **heute** anzeigen (kein Limit)
- Falls keine vorhanden: "Heute noch keine Zahlungen erfasst"
- "Mehr anzeigen"-Button laedt jeweils 10 aeltere Zahlungen nach

---

### 8. Fahrschueler-Reiter: 10er-Limit

**Datei**: `src/pages/dashboard/Fahrschueler.tsx`

- Standardmaessig nur 10 Schueler anzeigen
- "Mehr anzeigen"-Button laedt jeweils 10 weitere nach
- Suchfunktion filtert weiterhin ueber alle Schueler

---

### Technische Umsetzung

Jede betroffene Seite bekommt einen `visibleCount`-State:

```text
const [visibleCount, setVisibleCount] = useState(10);
```

Fuer Seiten mit Tages-Logik (Fahrstunden, Theorie, Zahlungen, Schaltstunden):

```text
- todayItems = alle Eintraege von heute (immer komplett angezeigt)
- olderItems = alle aelteren Eintraege (sortiert nach Datum absteigend)
- visibleOlder = olderItems.slice(0, visibleCount)
- "Mehr anzeigen" erhoeht visibleCount um 10
```

Fuer Seiten ohne Tages-Logik (Pruefungen, Leistungen, Fahrschueler):

```text
- visibleItems = filtered.slice(0, visibleCount)
- "Mehr anzeigen" erhoeht visibleCount um 10
```

Der "Mehr anzeigen"-Button wird nur angezeigt, wenn es noch weitere Eintraege gibt. Er zeigt auch an, wie viele noch uebrig sind (z.B. "Weitere 10 von 85 anzeigen").

### Supabase Query-Limit Fix

Um das 1000-Zeilen-Default-Limit zu umgehen, werden die Haupt-Queries angepasst:
- Statistik-relevante Queries bekommen `.limit(10000)` oder nutzen `{ count: "exact", head: true }` fuer reine Zaehlung
- Listen-Queries koennen weiterhin alle Daten laden, da das Frontend das Limit uebernimmt

### Zusammenfassung der Aenderungen

| Datei | Aenderungen |
|-------|------------|
| `Fahrstunden.tsx` | Cards durch Tabelle ersetzen, Tages-Logik + Mehr anzeigen, Preis-Spalte bleibt |
| `Schaltstunden.tsx` | Preis-Spalte hinzufuegen, Tages-Logik + Mehr anzeigen |
| `Theorie.tsx` | Tages-Logik + Mehr anzeigen |
| `Pruefungen.tsx` | 10er-Limit + Mehr anzeigen |
| `Leistungen.tsx` | 10er-Limit + Mehr anzeigen |
| `Zahlungen.tsx` | Tages-Logik + Mehr anzeigen |
| `Fahrschueler.tsx` | 10er-Limit + Mehr anzeigen |
| `Dashboard.tsx` | Query-Limits erhoehen fuer korrekte Statistiken |

