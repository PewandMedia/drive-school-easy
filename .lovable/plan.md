
## Notizfeld fuer automatische Leistungen beim Schueler-Anlegen

### Ziel
Ein Textfeld unterhalb der automatisch hinzugefuegten Leistungen (Grundbetrag/Lernmaterial), in das man z.B. "Weihnachtsangebot" schreiben kann. Diese Notiz wird bei den zugehoerigen Leistungen gespeichert.

### Umsetzung

**1. Migration: `notiz`-Spalte in `services` hinzufuegen**
- `ALTER TABLE services ADD COLUMN notiz TEXT DEFAULT NULL;`
- Kein Pflichtfeld, rein optional

**2. Frontend: `src/pages/dashboard/Fahrschueler.tsx`**
- Neuen State `angebotsNotiz` (string) hinzufuegen
- Textarea-Feld im Leistungen-Block einbauen (unter der Gesamt-Zeile), Placeholder: "z.B. Weihnachtsangebot, Sonderkonditionen..."
- Beim Speichern (`createMutation`) die Notiz an jede automatisch erstellte Leistung uebergeben (`notiz: angebotsNotiz || null`)
- Import von `Textarea` aus `@/components/ui/textarea`
- State im `onSuccess`-Callback zuruecksetzen

**3. Supabase Types**
- `types.ts` wird automatisch aktualisiert mit dem neuen `notiz`-Feld in der `services`-Tabelle

### Betroffene Dateien
| Datei | Aenderung |
|-------|-----------|
| Migration (SQL) | `ALTER TABLE services ADD COLUMN notiz TEXT` |
| `src/pages/dashboard/Fahrschueler.tsx` | Textarea + State + Insert-Logik |
| `src/integrations/supabase/types.ts` | Neues Feld `notiz` |
