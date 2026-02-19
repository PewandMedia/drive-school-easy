
## Saldo-Berechnung pro Schüler

### Übersicht

Die Saldoberechnung wird als reine Frontend-Logik implementiert. Alle nötigen Tabellen existieren bereits. Es werden **keine Datenbankänderungen** benötigt.

**Formel:**

```text
Saldo (offen) =
  Summe driving_lessons.preis
  + Summe exams.preis
  + Summe services.preis
  - Summe payments.betrag
```

Ein positiver Saldo bedeutet: Der Schüler hat noch offene Forderungen. Ein negativer oder Null-Saldo bedeutet: Alles bezahlt.

---

### 1. Schülerdetailseite (`FahrschuelerDetail.tsx`)

**Neu: `payments`-Query hinzufügen**

Ein weiterer `useQuery`-Hook lädt alle Zahlungen des Schülers:
```typescript
const { data: payments = [] } = useQuery({
  queryKey: ["payments", id],
  queryFn: async () => supabase.from("payments").select("*").eq("student_id", id!)...
});
```

**Saldo-Berechnung im Code:**
```typescript
const totalFahrstunden = lessons.reduce((s, l) => s + Number(l.preis), 0);
const totalPruefungen  = exams.reduce((s, e) => s + Number(e.preis), 0);
const totalLeistungen  = services.reduce((s, sv) => s + Number(sv.preis), 0);
const totalZahlungen   = payments.reduce((s, p) => s + Number(p.betrag), 0);
const saldo            = totalFahrstunden + totalPruefungen + totalLeistungen - totalZahlungen;
```

**Erweiterung der linken Profilkarte** – der bestehende „Übersicht"-Block wird durch eine vollständige Saldo-Aufschlüsselung ersetzt:

```
┌─────────────────────────────────┐
│  Übersicht / Saldo              │
│  Fahrstunden (n)     123,45 €   │
│  Prüfungen (n)        45,00 €   │
│  Leistungen (n)       30,00 €   │
│  Zahlungen (n)       −80,00 €   │
│  ─────────────────────────────  │
│  Offener Saldo       118,45 €   │  ← amber wenn > 0, grün wenn = 0
│  oder: Ausgeglichen   0,00 €    │
└─────────────────────────────────┘
```

Farben:
- Saldo > 0 → `text-amber-400` (offen)
- Saldo <= 0 → `text-green-400` (ausgeglichen)

**Zahlungsliste** – unterhalb der Leistungen-Liste wird ein neuer Block „Zahlungen" eingefügt (analog zu Fahrstunden/Leistungen), der die letzten Zahlungen des Schülers zeigt (Datum, Zahlungsart, Betrag).

---

### 2. Abrechnungsseite (`Abrechnung.tsx`) – vollständige Implementierung

Die bisherige Platzhalterseite wird vollständig durch echte Supabase-Daten ersetzt.

**Queries (alle Schüler auf einmal):**
- `students` – alle Schüler
- `driving_lessons` – alle Fahrstunden (nur `student_id`, `preis`)
- `exams` – alle Prüfungen (nur `student_id`, `preis`)
- `services` – alle Leistungen (nur `student_id`, `preis`)
- `payments` – alle Zahlungen (nur `student_id`, `betrag`)

**Saldo pro Schüler** wird im Frontend berechnet:
```typescript
const saldoMap = students.map(s => ({
  ...s,
  fahrstunden: driving_lessons.filter(l => l.student_id === s.id).reduce(...),
  pruefungen: exams.filter(e => e.student_id === s.id).reduce(...),
  leistungen: services.filter(sv => sv.student_id === s.id).reduce(...),
  zahlungen: payments.filter(p => p.student_id === s.id).reduce(...),
  saldo: ... // Summe der drei Positionen - Zahlungen
}));
```

**Layout der Abrechnungsseite:**

Oben: 3 Statistik-Karten:
- Gesamtforderungen (Fahrstunden + Prüfungen + Leistungen aller Schüler)
- Eingegangene Zahlungen (gesamt)
- Offener Gesamtsaldo

Darunter: Tabelle aller Schüler sortiert nach höchstem Saldo:

| Schüler | Klasse | Fahrstunden | Prüfungen | Leistungen | Zahlungen | Saldo |
|---|---|---|---|---|---|---|
| Mustermann, Max | B197 | 195,00 € | 45,00 € | 30,00 € | −100,00 € | 170,00 € |

- Saldo-Spalte: amber (offen) oder grünes Badge (ausgeglichen)
- Zeilen-Klick → Link zur Detailseite des Schülers
- Schüler mit Saldo = 0 können ausgegraut werden oder am Ende erscheinen

---

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `src/pages/dashboard/FahrschuelerDetail.tsx` | Neuer `payments`-Query, Saldo-Berechnung, erweiterter Übersichtsblock in Profilkarte, neuer Zahlungs-Block |
| `src/pages/dashboard/Abrechnung.tsx` | Vollständige Neuentwicklung mit Supabase-Daten, Statistik-Karten und Schüler-Saldo-Tabelle |

Keine Datenbankänderungen erforderlich – alle Tabellen und Spalten existieren bereits.
