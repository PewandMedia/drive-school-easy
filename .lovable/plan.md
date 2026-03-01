
## Automatische Leistungen bei Schueler-Anlage

### Uebersicht

Beim Erstellen eines neuen Fahrschuelers werden automatisch zwei Leistungen (Grundbetrag + Lernmaterial) aus der Preisliste erzeugt. Die bestehende Preisanpassbarkeit im Formular bleibt erhalten. Bestehende Schueler sind nicht betroffen.

### Aenderung

**Datei: `src/pages/dashboard/Fahrschueler.tsx`**

Die `createMutation` wird erweitert:

1. **Preise aus der Preisliste laden** -- Vor dem Insert wird die `prices`-Tabelle nach den aktiven Eintraegen "Grundbetrag" und "Lernmaterial" abgefragt.

2. **Schueler anlegen und ID zurueckbekommen** -- Der `.insert()` Aufruf wird um `.select("id")` ergaenzt, damit die neue Schueler-ID zurueckgegeben wird.

3. **Zwei Services automatisch einfuegen** -- Mit der neuen Schueler-ID werden zwei Eintraege in die `services`-Tabelle eingefuegt:
   - Grundbetrag (Preis aus Preisliste, z.B. 299 EUR)
   - Lernmaterial (Preis aus Preisliste, z.B. 80 EUR)

   Beide mit `status: "offen"` und Verweis auf die jeweilige `preis_id`.

4. **Query-Invalidierung erweitern** -- Neben `["students"]` werden auch `["services"]`, `["services_saldo"]` und `["open_items"]` invalidiert, damit Leistungen und Saldo sofort aktualisiert werden.

### Ablauf im Code (Pseudocode)

```text
mutationFn: async (values) => {
  // 1. Aktive Preise fuer Grundbetrag + Lernmaterial laden
  const prices = await supabase.from("prices")
    .select("*").eq("aktiv", true)
    .in("bezeichnung", ["Grundbetrag", "Lernmaterial"])

  // 2. Schueler anlegen, ID zurueckbekommen
  const { data: newStudent } = await supabase.from("students")
    .insert([...]).select("id").single()

  // 3. Zwei Leistungen einfuegen
  const servicesToInsert = prices.map(p => ({
    student_id: newStudent.id,
    preis_id: p.id,
    bezeichnung: p.bezeichnung,
    preis: p.preis,
    status: "offen"
  }))
  await supabase.from("services").insert(servicesToInsert)
}
```

### Wichtige Details

- Die Preise werden zum Zeitpunkt der Anlage aus der Preisliste kopiert. Spaetere Preisaenderungen betreffen nur neue Schueler.
- Falls ein Preis in der Preisliste nicht gefunden wird (z.B. deaktiviert), wird die entsprechende Leistung einfach nicht angelegt -- kein Fehler.
- Der bestehende Datenbank-Trigger `create_open_item_for_service` erzeugt automatisch die offenen Posten, sodass der Saldo sofort korrekt ist.
- Im Leistungsformular bleibt der Preis weiterhin individuell anpassbar (keine Aenderung noetig).

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/Fahrschueler.tsx` | `createMutation` erweitern: Preise laden, Schueler-ID zurueckbekommen, 2 Services einfuegen, Query-Invalidierung erweitern |

Nur eine Datei wird geaendert. Keine neuen Abhaengigkeiten, keine Schema-Aenderungen.
