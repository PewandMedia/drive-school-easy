
## Preislogik für Fahrstunden

### Zusammenfassung

Die Anforderung ist klar: In der Tabelle `driving_lessons` soll der `preis` automatisch nach der Formel `(dauer_minuten / 45) * 65` berechnet werden, sobald ein Eintrag gespeichert wird. Basispreis: 45 min = 65,00 €.

Der Preis soll:
- beim **Erstellen** einer neuen Fahrstunde automatisch berechnet werden
- beim **Ändern von `dauer_minuten`** automatisch neu berechnet werden
- in der UI als **Vorschau** angezeigt werden, bevor der Nutzer speichert
- **nicht manuell überschreibbar** sein (der Preis ergibt sich ausschließlich aus der Dauer)

---

### Technische Umsetzung

#### 1. Datenbankebene: PostgreSQL Trigger (sicher & zuverlässig)

Ein `BEFORE INSERT OR UPDATE`-Trigger auf `driving_lessons` berechnet den Preis automatisch serverseitig. Das stellt sicher, dass der Preis immer korrekt ist – egal ob Daten über die App, direkt über die Datenbank oder zukünftige API-Endpunkte gespeichert werden.

```sql
CREATE OR REPLACE FUNCTION public.calculate_driving_lesson_price()
RETURNS TRIGGER AS $$
BEGIN
  NEW.preis := ROUND((NEW.dauer_minuten::numeric / 45) * 65, 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_driving_lesson_price
BEFORE INSERT OR UPDATE OF dauer_minuten ON public.driving_lessons
FOR EACH ROW
EXECUTE FUNCTION public.calculate_driving_lesson_price();
```

Migration: neue Datei in `supabase/migrations/`

#### 2. Seite `/dashboard/fahrstunden` (neu implementiert)

Die Seite `Fahrstunden.tsx` wird vollständig ausgebaut:

**Formular "Fahrstunde eintragen":**
- Schüler auswählen (Dropdown aus `students`)
- Typ (uebungsstunde, ueberland, autobahn, nacht, fehlstunde, testfahrt_b197) – auf Deutsch
- Fahrzeug-Typ (automatik / schaltwagen)
- Datum & Uhrzeit
- Dauer in Minuten (Eingabe oder Auswahl: 45 / 90 / 135 min)
- **Preisvorschau:** zeigt live den berechneten Preis `(dauer / 45) * 65 €` an
- Der `preis` wird beim Speichern durch den Trigger automatisch gesetzt (kein manuelles Preis-Feld)

**Liste aller Fahrstunden:**
- Spalten: Schüler, Datum, Typ, Fahrzeug, Dauer, Preis
- Sortierung: neueste zuerst
- Filtermöglichkeit nach Typ und Fahrzeug-Typ
- Löschen-Funktion

**Statistiken oben:**
- Gesamtumsatz (Summe aller Fahrstunden)
- Anzahl Fahrstunden
- Durchschnittliche Dauer

---

### Enum-Labels (Deutsch)

| Wert | Anzeige |
|---|---|
| uebungsstunde | Übungsstunde |
| ueberland | Überlandfahrt |
| autobahn | Autobahnfahrt |
| nacht | Nachtfahrt |
| fehlstunde | Fehlstunde |
| testfahrt_b197 | Testfahrt B197 |
| automatik | Automatik |
| schaltwagen | Schaltwagen |

---

### Dateien die geändert werden

| Datei | Änderung |
|---|---|
| `supabase/migrations/[ts]_driving_lesson_price_trigger.sql` | Neu: Trigger + Funktion |
| `src/pages/dashboard/Fahrstunden.tsx` | Vollständig implementiert |

Keine Änderungen an bestehenden Tabellen oder Typen nötig – der Trigger schreibt nur in `preis`, das bereits existiert.
