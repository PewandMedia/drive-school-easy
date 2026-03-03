
## Fix: Open Items bei Loeschung automatisch entfernen

### Problem

Beim Loeschen einer Fahrstunde (oder Pruefung/Leistung) bleibt der zugehoerige Eintrag in der `open_items`-Tabelle bestehen. Das Schuelerprofil berechnet den Saldo anhand der `open_items` -- daher zeigt es den alten (falschen) Betrag weiterhin an. Die Schuelerliste berechnet den Saldo dagegen dynamisch aus den Rohdaten und zeigt den korrekten Wert.

### Loesung

Eine neue SQL-Migration mit drei Datenbank-Triggern, die beim Loeschen eines Eintrags den zugehoerigen offenen Posten automatisch mitloeschen:

1. **`delete_open_item_for_driving_lesson`** -- BEFORE DELETE auf `driving_lessons`: Loescht den `open_items`-Eintrag wo `referenz_id = OLD.id`
2. **`delete_open_item_for_exam`** -- BEFORE DELETE auf `exams`: Loescht den `open_items`-Eintrag wo `referenz_id = OLD.id`
3. **`delete_open_item_for_service`** -- BEFORE DELETE auf `services`: Loescht den `open_items`-Eintrag wo `referenz_id = OLD.id`

Da `payment_allocations` bereits `ON DELETE CASCADE` auf `open_items` hat, werden zugehoerige Zahlungszuordnungen automatisch mitgeloescht.

### Technische Details

```sql
CREATE OR REPLACE FUNCTION public.delete_open_item_for_entity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM open_items WHERE referenz_id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_delete_open_item_driving_lesson
  BEFORE DELETE ON driving_lessons
  FOR EACH ROW EXECUTE FUNCTION delete_open_item_for_entity();

CREATE TRIGGER trg_delete_open_item_exam
  BEFORE DELETE ON exams
  FOR EACH ROW EXECUTE FUNCTION delete_open_item_for_entity();

CREATE TRIGGER trg_delete_open_item_service
  BEFORE DELETE ON services
  FOR EACH ROW EXECUTE FUNCTION delete_open_item_for_entity();
```

Eine einzige generische Funktion fuer alle drei Tabellen, da die Logik identisch ist (`referenz_id = OLD.id`).

### Zusaetzlich im Frontend

Nach dem Loeschen einer Fahrstunde auf der Fahrstunden-Seite werden die `open_items`-Queries invalidiert, damit die Profilansicht beim naechsten Besuch den korrekten Saldo zeigt. Hierzu wird in `Fahrstunden.tsx` in der `deleteMutation.onSuccess` ein `invalidateQueries` fuer `open_items` ergaenzt.
