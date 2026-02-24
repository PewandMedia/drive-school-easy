

## Fixes: Supabase 1000-Limit, Schaltstunden Tages-Logik, Abrechnung Pagination

### Uebersicht

Drei Hauptprobleme werden behoben:
1. Supabase-Queries ohne `.limit(10000)` geben maximal 1000 Zeilen zurueck, was falsche Zahlen in Statistik-Cards und "Weitere X von 1000" verursacht
2. Schaltstunden zeigt bereits Tages-Logik korrekt an (besteht schon), aber es fehlt die Trennung "heute keine" + trotzdem aeltere anzeigen
3. Abrechnung hat keine Pagination ("Mehr anzeigen")

---

### 1. Fehlende `.limit(10000)` ergaenzen

Alle Queries die grosse Datenmengen laden koennen, aber noch kein `.limit(10000)` haben, werden ergaenzt. Das behebt sowohl die falschen Statistik-Zahlen (z.B. "1000" statt der echten Zahl) als auch die falsche Anzeige "Weitere 10 von 1000".

| Datei | Query/Tabelle | Problem |
|-------|--------------|---------|
| `Abrechnung.tsx` | `students.select("*")` | Kein Limit |
| `Abrechnung.tsx` | `open_items.select(...)` | Kein Limit |
| `Fahrstunden.tsx` | `students.select(...)` | Kein Limit |
| `Theorie.tsx` | `students.select(...)` | Kein Limit |
| `Pruefungen.tsx` | `students.select(...)` | Kein Limit |
| `Zahlungen.tsx` | `students.select(...)` | Kein Limit |
| `Zahlungen.tsx` | `payment_allocations.select(...)` | Kein Limit |
| `Leistungen.tsx` | `students.select(...)` | Kein Limit |

Alle diese Queries bekommen `.limit(10000)` angehaengt.

---

### 2. Abrechnung: Pagination mit "Mehr anzeigen"

**Datei**: `src/pages/dashboard/Abrechnung.tsx`

- Neuer State: `const [visibleCount, setVisibleCount] = useState(10)`
- Die gefilterte Schueler-Liste wird auf `visibleCount` begrenzt: `filtered.slice(0, visibleCount)`
- Ein "Mehr anzeigen"-Button wird unter der Tabelle angezeigt, wenn es weitere Eintraege gibt
- Der Button zeigt "Weitere X von Y anzeigen" an
- Bei Suchfilter-Aenderung wird `visibleCount` auf 10 zurueckgesetzt

---

### 3. Schaltstunden: Korrekte Tages-Logik

**Datei**: `src/pages/dashboard/Schaltstunden.tsx`

Die bestehende Tages-Logik ist korrekt implementiert. Es wird nur sichergestellt, dass wenn heute keine Schaltstunden vorhanden sind ABER aeltere existieren, die Meldung "Heute noch keine Schaltstunden eingetragen" angezeigt wird und die aelteren trotzdem sichtbar sind (mit "Mehr anzeigen"). Aktuell zeigt es nur die leere Meldung wenn BEIDES leer ist.

**Aenderung**: Die leere-Meldung wird nur gezeigt wenn `todayLessons.length === 0`. Falls `olderLessons.length > 0` werden diese trotzdem darunter angezeigt.

---

### Zusammenfassung der Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `Abrechnung.tsx` | `.limit(10000)` fuer beide Queries + `visibleCount` State + "Mehr anzeigen" Button + Search-Reset |
| `Schaltstunden.tsx` | Tages-Logik Fix: leere-Meldung nur fuer heute, aeltere trotzdem anzeigen |
| `Fahrstunden.tsx` | `.limit(10000)` fuer students-Query |
| `Theorie.tsx` | `.limit(10000)` fuer students-Query |
| `Pruefungen.tsx` | `.limit(10000)` fuer students-Query |
| `Zahlungen.tsx` | `.limit(10000)` fuer students- und payment_allocations-Queries |
| `Leistungen.tsx` | `.limit(10000)` fuer students-Query |

