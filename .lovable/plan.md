

## Zahlungen an offene Posten koppeln

### Uebersicht
Aktuell werden Zahlungen "frei" erfasst und der Saldo rein rechnerisch ermittelt (Summe Fahrstunden + Pruefungen + Leistungen - Zahlungen). Das neue System fuehrt eine zentrale `open_items`-Tabelle ein, die alle kostenpflichtigen Buchungen als offene Posten erfasst, sowie eine `payment_allocations`-Tabelle, die Zahlungen konkret einzelnen Posten zuordnet.

### Aenderung 1: Datenbank-Migration

**Neue Tabelle `open_items`:**

| Spalte | Typ | Default |
|--------|-----|---------|
| id | uuid | gen_random_uuid() |
| student_id | uuid | NOT NULL |
| typ | text | NOT NULL (fahrstunde / pruefung / leistung) |
| referenz_id | uuid | NOT NULL (ID aus driving_lessons / exams / services) |
| datum | timestamptz | now() |
| beschreibung | text | NOT NULL |
| betrag_gesamt | numeric | NOT NULL |
| betrag_bezahlt | numeric | 0 |
| status | text | 'offen' (offen / teilbezahlt / bezahlt) |
| created_at | timestamptz | now() |

**Neue Tabelle `payment_allocations`:**

| Spalte | Typ | Default |
|--------|-----|---------|
| id | uuid | gen_random_uuid() |
| payment_id | uuid | NOT NULL |
| open_item_id | uuid | NOT NULL |
| betrag | numeric | NOT NULL |
| created_at | timestamptz | now() |

**DB-Trigger: Automatisch offene Posten erstellen**

Drei Trigger-Funktionen die nach INSERT auf `driving_lessons`, `exams` und `services` automatisch einen Eintrag in `open_items` erzeugen:

- `driving_lessons` INSERT -> open_item mit typ='fahrstunde', beschreibung z.B. "Fahrstunde 90min (2E)", betrag_gesamt = preis
- `exams` INSERT -> open_item mit typ='pruefung', beschreibung z.B. "Theoriepruefung" oder "Fahrpruefung", betrag_gesamt = preis
- `services` INSERT -> open_item mit typ='leistung', beschreibung = bezeichnung, betrag_gesamt = preis

**DB-Trigger: Offene Posten nach Zahlung aktualisieren**

Nach INSERT auf `payment_allocations`:
- Berechne SUM(betrag) aller Zuordnungen fuer den open_item
- Setze `betrag_bezahlt` = diese Summe
- Setze `status` = 'bezahlt' wenn betrag_bezahlt >= betrag_gesamt, 'teilbezahlt' wenn betrag_bezahlt > 0, sonst 'offen'

**Bestehende Daten migrieren:**

SQL-Script das fuer alle existierenden `driving_lessons`, `exams` und `services` nachtraeglich open_items erzeugt. Bestehende Zahlungen bleiben als "freie Zahlungen" bestehen (ohne Zuordnung).

**RLS-Policies:**

Gleiche Struktur wie bestehende Tabellen (authentifizierte Benutzer koennen alles).

### Aenderung 2: `src/pages/dashboard/FahrschuelerDetail.tsx`

**Zahlung-Dialog komplett ueberarbeiten:**

Statt nur Betrag/Zahlungsart/Datum neu:

1. Zahlungsdatum (Default: heute)
2. Zahlungsart (Bar / EC / Ueberweisung)
3. Betrag (eingehender Gesamtbetrag)
4. "Offene Posten zuordnen" -- Liste mit Checkboxen:
   - Jeder offene Posten des Schuelers wird angezeigt mit:
     - Datum
     - Typ-Icon + Beschreibung
     - Betrag offen (betrag_gesamt - betrag_bezahlt)
   - Sortiert nach Datum (aelteste zuerst)
   - Nur Posten mit status != 'bezahlt' werden angezeigt

5. Verteilungslogik (Option B -- automatisch):
   - Ausgewaehlte Posten werden nach Datum sortiert (aelteste zuerst)
   - Der eingegebene Betrag wird automatisch verteilt
   - Anzeige wie viel auf jeden Posten entfaellt
   - Wenn Betrag kleiner als Summe der Posten -> Teilzahlung auf aeltesten Posten

6. Speichern:
   - Payment in `payments` einfuegen
   - Fuer jeden zugeordneten Posten einen Eintrag in `payment_allocations`
   - Trigger aktualisiert automatisch `open_items.betrag_bezahlt` und `status`

**Neue Query: Offene Posten laden**
```text
supabase.from("open_items")
  .select("*")
  .eq("student_id", id)
  .neq("status", "bezahlt")
  .order("datum", { ascending: true })
```

**Saldo-Berechnung anpassen:**

Der Saldo wird nun aus `open_items` berechnet:
```text
saldo = SUM(open_items.betrag_gesamt) - SUM(open_items.betrag_bezahlt)
```
Das ersetzt die bisherige Berechnung aus 4 separaten Tabellen.

**Fahrstunden / Pruefungen / Leistungen Anzeige erweitern:**

Bei jedem Eintrag zusaetzlich anzeigen:
- Status-Badge: offen / teilbezahlt / bezahlt (aus zugehoerigem open_item)
- Bei teilbezahlt: "65€ bezahlt / 65€ offen"

### Aenderung 3: `src/pages/dashboard/Zahlungen.tsx`

**Zahlungsliste erweitern:**

Neue Spalte "Zuordnung" in der Tabelle die zeigt, wofuer bezahlt wurde:
- Query erweitern: Payments mit payment_allocations und open_items joinen
- Anzeige: z.B. "Fahrstunde 90min (24.02.2026)" oder "Grundbetrag"
- Wenn keine Zuordnung: "Freie Zahlung"

**Zahlung-Dialog ueberarbeiten:**

Gleiche Logik wie im Schuelerprofil:
- Nach Schueler-Auswahl: offene Posten laden
- Checkbox-Liste der offenen Posten
- Automatische Verteilung des Betrags

### Aenderung 4: `src/pages/dashboard/Abrechnung.tsx`

**Saldo-Berechnung umstellen:**

Statt 4 separate Queries (driving_lessons, exams, services, payments) nur noch:
- `open_items` mit SUM(betrag_gesamt) und SUM(betrag_bezahlt) pro Student
- Saldo = betrag_gesamt - betrag_bezahlt

### Aenderung 5: `src/integrations/supabase/types.ts`

Wird automatisch aktualisiert nach der Migration (neue Tabellen open_items und payment_allocations).

### Technische Details

**Trigger-Funktion fuer driving_lessons:**
```text
CREATE FUNCTION create_open_item_for_driving_lesson()
RETURNS trigger AS $$
BEGIN
  INSERT INTO open_items (student_id, typ, referenz_id, datum, beschreibung, betrag_gesamt)
  VALUES (
    NEW.student_id,
    'fahrstunde',
    NEW.id,
    NEW.datum,
    'Fahrstunde ' || NEW.dauer_minuten || 'min (' || NEW.einheiten || 'E)',
    NEW.preis
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger-Funktion fuer payment_allocations:**
```text
CREATE FUNCTION update_open_item_after_allocation()
RETURNS trigger AS $$
DECLARE
  total_paid numeric;
  item_total numeric;
BEGIN
  SELECT COALESCE(SUM(betrag), 0) INTO total_paid
  FROM payment_allocations WHERE open_item_id = NEW.open_item_id;

  SELECT betrag_gesamt INTO item_total
  FROM open_items WHERE id = NEW.open_item_id;

  UPDATE open_items SET
    betrag_bezahlt = total_paid,
    status = CASE
      WHEN total_paid >= item_total THEN 'bezahlt'
      WHEN total_paid > 0 THEN 'teilbezahlt'
      ELSE 'offen'
    END
  WHERE id = NEW.open_item_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Bestehende Daten migrieren:**
```text
-- Fahrstunden -> open_items
INSERT INTO open_items (student_id, typ, referenz_id, datum, beschreibung, betrag_gesamt)
SELECT student_id, 'fahrstunde', id, datum,
  'Fahrstunde ' || dauer_minuten || 'min (' || einheiten || 'E)',
  preis
FROM driving_lessons;

-- Pruefungen -> open_items
INSERT INTO open_items (...)
SELECT student_id, 'pruefung', id, datum,
  CASE WHEN typ='theorie' THEN 'Theoriepruefung' ELSE 'Fahrpruefung' END,
  preis
FROM exams;

-- Leistungen -> open_items
INSERT INTO open_items (...)
SELECT student_id, 'leistung', id, created_at, bezeichnung, preis
FROM services;
```

**Frontend Zahlungs-Verteilungslogik:**
```text
// Ausgewaehlte Posten nach Datum sortieren
const sorted = selectedItems.sort((a, b) => new Date(a.datum) - new Date(b.datum));
let remaining = parseFloat(betrag);
const allocations = [];

for (const item of sorted) {
  if (remaining <= 0) break;
  const offen = item.betrag_gesamt - item.betrag_bezahlt;
  const zuordnung = Math.min(remaining, offen);
  allocations.push({ open_item_id: item.id, betrag: zuordnung });
  remaining -= zuordnung;
}
```

### Zusammenfassung

| Bereich | Aenderung |
|---------|-----------|
| DB-Migration | Tabellen `open_items` + `payment_allocations`, 4 Trigger, Datenmigration, RLS |
| FahrschuelerDetail.tsx | Zahlung-Dialog mit offenen Posten Checkboxen, Status bei Eintraegen, neuer Saldo |
| Zahlungen.tsx | Zuordnungs-Spalte, offene Posten im Dialog |
| Abrechnung.tsx | Saldo aus open_items statt 4 Tabellen |

