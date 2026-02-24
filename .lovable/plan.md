

## "Sonstiges" Option in der Preisliste mit Notizfeld

### Was wird geaendert

In der "Leistung zuordnen"-Dialog wird eine neue Option **"Sonstiges"** in der Preisliste-Auswahl ergaenzt. Wenn "Sonstiges" gewaehlt wird, erscheint ein Notizfeld (Textarea) fuer eine Beschreibung (z.B. "Strassenverkehrsamt Gebuehren") und das Preisfeld bleibt leer zum manuellen Eintragen.

### Aenderungen in `src/pages/dashboard/Leistungen.tsx`

**1. Formular-State erweitern**

- Neues Feld `notiz` im `defaultForm` hinzufuegen (leerer String)

**2. "Sonstiges" in der Preisliste-Auswahl**

- Nach den bestehenden Preisen aus der Datenbank wird ein zusaetzlicher Eintrag **"Sonstiges"** mit dem Wert `"sonstiges"` angezeigt (Kategorie: `[Sonstiges]`)
- Wenn "Sonstiges" gewaehlt wird:
  - `bezeichnung` wird auf "Sonstiges" gesetzt
  - `preis` bleibt leer (manuell eintragbar)
  - `preis_id` wird auf leer gesetzt (kein Preis-Datensatz)

**3. Notizfeld anzeigen**

- Ein Textarea-Feld erscheint **nur wenn "Sonstiges" gewaehlt** ist (oder generell nuetzlich: immer sichtbar als optionales Feld)
- Label: "Notiz / Beschreibung"
- Placeholder: "z.B. Strassenverkehrsamt Gebuehren..."
- Der Notiz-Text wird an die Bezeichnung angehaengt beim Speichern: `"Sonstiges - Strassenverkehrsamt Gebuehren"`

**4. Submit-Logik anpassen**

- Wenn "Sonstiges" gewaehlt und eine Notiz vorhanden: `bezeichnung` = `"Sonstiges – " + notiz`
- Preis muss manuell eingetragen werden (Validierung: Preis > 0 bei Sonstiges)

### Technische Details

| Bereich | Detail |
|---------|--------|
| Datei | `src/pages/dashboard/Leistungen.tsx` |
| Neue Komponente | Textarea aus `@/components/ui/textarea` (bereits vorhanden) |
| Neuer State | `notiz: string` im Formular |
| Sonstiges-Erkennung | `form.preis_id === "sonstiges"` |
| Bezeichnung-Logik | Bei Sonstiges: Notiz wird Teil der Bezeichnung |

