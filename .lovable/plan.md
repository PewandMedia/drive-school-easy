
## Prüfungslogik nach Führerscheinklasse

### Zusammenfassung

Die Anforderung definiert klassenspezifische Regeln für Ausbildung und Prüfung. Diese werden als rein frontendbasierte Logik und UI-Regeln implementiert – ohne Datenbankänderungen, da alle nötigen Tabellen bereits vorhanden sind (`students`, `driving_lessons`, `gear_lessons`, `exams`, `prices`).

---

### Regelwerk je Führerscheinklasse

```text
B:
  - Prüfung: Schaltwagen oder Automatik
  - Keine Schaltstunden-Pflicht
  - Keine Testfahrt-Pflicht

B78:
  - Nur Automatik (kein Schaltwagen in Fahrstunden/Prüfung)
  - Keine Schaltberechtigung
  - Schaltstunden & Testfahrt nicht relevant

B197:
  - Prüfung: Automatik (Fahrprüfung immer Automatik)
  - Zusatzpflicht: 10/10 Schaltstunden + 1× Testfahrt B197
  - Erst wenn beides erfüllt: Schaltberechtigung aktiv
  - Schaltberechtigung-Status sichtbar
```

---

### Was konkret umgesetzt wird

#### 1. `FahrschuelerDetail.tsx` – Schaltberechtigungs-Block (B197)

Der bestehende Schaltstunden-Block (B197) wird erweitert um:

- **Testfahrt B197**: Zeigt an, ob eine `driving_lesson` mit `typ = "testfahrt_b197"` für diesen Schüler existiert (0/1)
- **Schaltberechtigung-Status**: Großes Status-Badge/Banner:
  - Grün + Checkmark: "Schaltberechtigung aktiv" → wenn `gearComplete && testfahrtVorhanden`
  - Gelb: "Schaltberechtigung ausstehend" → solange eine der Bedingungen nicht erfüllt ist
  - Fortschrittsbalken für Testfahrt B197 (0/1) mit gleicher Optik wie bisherige Balken

```text
Schaltstunden  8 / 10  ▓▓▓▓▓▓▓▓░░  80%
Testfahrt B197 0 / 1   ░░░░░░░░░░   0%

⚠ Schaltberechtigung ausstehend
```

#### 2. `FahrschuelerDetail.tsx` – B78-Hinweis

Bei `fuehrerscheinklasse === "B78"`:
- Kleines Info-Banner: "Klasse B78 – Nur Automatik, keine Schaltberechtigung"
- Kein Schaltstunden-Block
- Keine Testfahrt-Anforderung

#### 3. `Pruefungen.tsx` – Vollständige Implementierung

Die Prüfungsseite wird mit echten Daten aus Supabase ausgebaut:

**Formular "Prüfung eintragen"** mit klassenspezifischen Einschränkungen:
- Schüler auswählen → Klasse wird automatisch erkannt
- Typ: Theorie / Fahrprüfung
- Fahrzeug-Typ:
  - B: Automatik oder Schaltwagen wählbar
  - B78: nur Automatik (Schaltwagen deaktiviert/ausgeblendet)
  - B197: nur Automatik (Fahrprüfung immer Automatik)
- Bestanden: Ja / Nein
- Datum
- **Preis aus Preisliste**: Beim Speichern wird in der `prices`-Tabelle ein passender Eintrag gesucht (Kategorie "Prüfungen"). Der gefundene Preis wird vorausgefüllt (überschreibbar).

**Liste aller Prüfungen:**
- Spalten: Schüler, Typ, Fahrzeug, Datum, Ergebnis, Preis
- Stats-Karten oben: Bestanden / Nicht bestanden / Gesamt

#### 4. Preislogik aus Preisliste

Beim Öffnen des Formulars wird die `prices`-Tabelle nach Kategorie "Prüfungen" abgefragt. Der erste aktive Treffer wird als Standardpreis vorausgefüllt. Der Benutzer kann den Preis manuell überschreiben. Kein Trigger – manuelle Übernahme im Frontend.

---

### Dateien die geändert werden

| Datei | Änderung |
|---|---|
| `src/pages/dashboard/FahrschuelerDetail.tsx` | Schaltstunden-Block erweitert um Testfahrt B197 + Schaltberechtigung-Badge; B78-Hinweis-Banner |
| `src/pages/dashboard/Pruefungen.tsx` | Vollständig implementiert: Supabase-Daten, Formular mit Klassenlogik, Preisübernahme aus Preisliste |

Keine Datenbankänderungen – alle Tabellen und Enums existieren bereits.

---

### Detaillogik: Schaltberechtigung B197

```typescript
const testfahrtVorhanden = lessons.some(l => l.typ === "testfahrt_b197");
const gearComplete = gearHoursDone >= 10;
const schaltberechtigungAktiv = gearComplete && testfahrtVorhanden;
```

Anzeige im Schaltstunden-Block:
- Bestehender Fortschrittsbalken Schaltstunden (10/10) bleibt
- Neuer Fortschrittsbalken: Testfahrt B197 (0 oder 1 / 1)
- Neues Status-Banner am Ende des Blocks:
  - `schaltberechtigungAktiv = true` → grünes Banner "Schaltberechtigung aktiv"
  - `schaltberechtigungAktiv = false` → gelbes Banner mit offenen Punkten

### Detaillogik: Fahrzeugtyp-Einschränkung in Prüfungen

```typescript
// Beim Schüler-Wechsel im Formular
const selectedStudent = students.find(s => s.id === form.student_id);
const klasse = selectedStudent?.fuehrerscheinklasse;

// Fahrzeugtyp-Optionen
const fahrzeugOptionen = klasse === "B78" || klasse === "B197"
  ? [{ value: "automatik", label: "Automatik" }]  // nur Automatik
  : [{ value: "automatik", label: "Automatik" }, { value: "schaltwagen", label: "Schaltwagen" }];

// Automatisch setzen wenn eingeschränkt
useEffect(() => {
  if (klasse === "B78" || klasse === "B197") {
    setForm(f => ({ ...f, fahrzeug_typ: "automatik" }));
  }
}, [form.student_id]);
```
