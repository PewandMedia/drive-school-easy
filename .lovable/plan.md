

## Details im Aktivitaetsprotokoll anzeigen

### Problem
Der Audit-Trigger speichert aktuell nur Aktion + Tabellenname, aber keine Details (z.B. welcher Schueler, welche Art Fahrstunde). Die `details`-Spalte ist immer NULL.

### Loesung
Die Trigger-Funktion `audit_entity_change()` erweitern, damit sie automatisch einen aussagekraeftigen `details`-Text generiert -- mit Schuelername und relevanten Infos.

### Was im Details-Text stehen wird

| Tabelle | Beispiel-Details |
|---------|-----------------|
| driving_lessons | "Uebungsstunde fuer Mustermann, Max (90 Min)" |
| theory_sessions | "Grundstoff Lektion 3 fuer Mustermann, Max" |
| exams | "Theorieprüfung fuer Mustermann, Max" |
| payments | "Zahlung 150.00 EUR (bar) fuer Mustermann, Max" |
| services | "Grundbetrag (250.00 EUR) fuer Mustermann, Max" |

### Technische Umsetzung

**1. Migration: Trigger-Funktion erweitern**

Die bestehende `audit_entity_change()` wird per `CREATE OR REPLACE` aktualisiert. In der Funktion:

- Schuelername wird aus `students` geladen (per `student_id` aus NEW/OLD)
- Je nach `TG_TABLE_NAME` wird ein spezifischer Details-Text gebaut:
  - `driving_lessons`: Typ + Schuelername + Dauer
  - `theory_sessions`: Typ + Lektion + Schuelername
  - `exams`: Typ + Schuelername
  - `payments`: Betrag + Zahlungsart + Schuelername
  - `services`: Bezeichnung + Preis + Schuelername

```text
-- Pseudocode der erweiterten Trigger-Funktion
_record := COALESCE(NEW, OLD);
_student_name := (SELECT nachname || ', ' || vorname FROM students WHERE id = _record.student_id);

CASE TG_TABLE_NAME
  WHEN 'driving_lessons' THEN
    _details := initcap(_record.typ) || ' fuer ' || _student_name || ' (' || _record.dauer_minuten || ' Min)';
  WHEN 'theory_sessions' THEN
    _details := initcap(_record.typ) || CASE WHEN _record.lektion IS NOT NULL THEN ' Lektion ' || _record.lektion ELSE '' END || ' fuer ' || _student_name;
  WHEN 'exams' THEN
    _details := initcap(_record.typ) || ' fuer ' || _student_name;
  WHEN 'payments' THEN
    _details := _record.betrag || ' EUR (' || _record.zahlungsart || ') fuer ' || _student_name;
  WHEN 'services' THEN
    _details := _record.bezeichnung || ' (' || _record.preis || ' EUR) fuer ' || _student_name;
END CASE;
```

Da die Spalten pro Tabelle unterschiedlich sind, wird innerhalb der Funktion mit dynamischem Record-Zugriff gearbeitet. Da PL/pgSQL keinen generischen Record-Feldzugriff erlaubt, nutze ich `hstore` oder separate IF-Bloecke mit explizitem Casting.

**2. Keine Frontend-Aenderung noetig**

Die `Benutzerverwaltung.tsx` zeigt `log.details` bereits an (Zeile 336). Sobald die Trigger-Funktion Details schreibt, erscheinen sie automatisch im Historie-Dialog.

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| Migration (SQL) | `CREATE OR REPLACE FUNCTION audit_entity_change()` mit Details-Generierung |

### Ergebnis

In der Historie steht dann z.B.:
- **Erstellt** -- 02.03.2026 07:25
- Fahrstunde
- *Uebungsstunde fuer Mustermann, Max (90 Min)*

Statt nur "Erstellt / Fahrstunde" ohne weitere Infos.

