

## Schüler-Suche in Zahlungen und Abrechnung

### Uebersicht
Beide Seiten erhalten ein Suchfeld oberhalb der Tabelle, mit dem die angezeigte Liste nach Schülernamen gefiltert werden kann. So bleibt die Übersicht auch bei vielen Schülern gewährleistet.

### Aenderung 1: `src/pages/dashboard/Zahlungen.tsx`

- Neuen State `searchTerm` (useState) hinzufuegen
- Suchfeld (Input mit Search-Icon) oberhalb der Tabelle einfuegen, innerhalb des Tabellen-Containers
- Die `payments`-Liste vor dem Rendern filtern: Nur Zahlungen anzeigen, deren Schülername (Nachname + Vorname) den Suchbegriff enthaelt (case-insensitive)
- Statistiken (KPI-Karten oben) bleiben ungeaendert und beziehen sich weiterhin auf alle Zahlungen

### Aenderung 2: `src/pages/dashboard/Abrechnung.tsx`

- Neuen State `searchTerm` (useState) hinzufuegen
- Suchfeld im Tabellen-Header-Bereich (neben "Salden pro Schüler") einfuegen
- Die `sorted`-Liste vor dem Rendern filtern: Nur Schüler anzeigen, deren Name den Suchbegriff enthaelt (case-insensitive)
- Statistiken (Gesamtforderungen, Zahlungen, Saldo) bleiben ungeaendert und beziehen sich weiterhin auf alle Schüler

### Technische Details

Beide Seiten verwenden dasselbe Muster:

```text
// State
const [searchTerm, setSearchTerm] = useState("");

// Filter-Logik (Beispiel Abrechnung)
const filtered = sorted.filter((s) => {
  if (!searchTerm) return true;
  const name = `${s.nachname} ${s.vorname}`.toLowerCase();
  return name.includes(searchTerm.toLowerCase());
});

// Suchfeld: Input mit placeholder "Schüler suchen…" und Search-Icon
```

Das Suchfeld wird als einfaches Textfeld mit Lupen-Icon umgesetzt -- keine Combobox noetig, da es nur zum Filtern der bestehenden Liste dient.

### Zusammenfassung

| Datei | Aenderung |
|-------|-----------|
| `Zahlungen.tsx` | State `searchTerm`, Suchfeld ueber Tabelle, payments-Filter nach Schülername |
| `Abrechnung.tsx` | State `searchTerm`, Suchfeld im Tabellen-Header, sorted-Filter nach Schülername |

Statistiken/KPIs bleiben in beiden Seiten unberuehrt (beziehen sich auf Gesamtdaten).

