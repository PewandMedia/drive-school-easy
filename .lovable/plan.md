

## Direkte Hinzufuegen-Buttons im Schuelerprofil

### Uebersicht
In der Schueler-Detailansicht werden Schnellaktionen hinzugefuegt, damit man direkt aus dem Profil heraus Fahrstunden, Schaltstunden, Theorie, Pruefungen, Leistungen und Zahlungen eintragen kann -- ohne Seitenwechsel.

### Aenderungen

**1. Zentraler Aktions-Dropdown im Header (neben Zurueck-Button)**
- Ein `DropdownMenu` mit dem Label "Aktion hinzufuegen" wird neben dem Schueler-Namen platziert
- Enthaelt 6 Eintraege: Fahrstunde, Schaltstunde, Theorie, Pruefung, Leistung, Zahlung
- Klick auf einen Eintrag oeffnet das jeweilige Modal

**2. Kleine "+"-Buttons in den Sektions-Headern**
- Fahrstunden-Sektion: "+" Button rechts oben
- Pruefungen-Sektion: "+" Button rechts oben
- Leistungen-Sektion: "+" Button rechts oben
- Zahlungen-Sektion: "+" Button rechts oben

**3. Sechs Inline-Modals mit vorausgewaehltem Schueler**
Jedes Modal uebernimmt die Formularlogik der jeweiligen Seite, aber mit dem aktuellen Schueler fest vorausgewaehlt (kein Schueler-Dropdown noetig):

- **Fahrstunde**: Typ, Fahrzeugtyp, Dauer (45/90/135), Datum. Preis wird automatisch berechnet (Dauer/45 x 65 EUR)
- **Schaltstunde**: Dauer (45/90/135), Datum
- **Theorie**: Typ (Grundstoff/Klassenspezifisch), Datum
- **Pruefung**: Typ (Theorie/Praxis), Fahrzeugtyp, Datum, Bestanden-Toggle, Preis (aus Preisliste vorausgefuellt)
- **Leistung**: Preisliste-Auswahl, Bezeichnung, Preis, Status
- **Zahlung**: Betrag, Zahlungsart (Bar/EC/Ueberweisung), Datum

Nach erfolgreichem Speichern werden die relevanten Queries invalidiert, sodass die Detailansicht sofort aktualisiert wird.

### Technische Details

**Datei: `src/pages/dashboard/FahrschuelerDetail.tsx`**

- 6 neue `useState<boolean>` fuer Dialog-Sichtbarkeit (je ein Modal)
- 6 `useState` fuer Formularwerte (angelehnt an die `defaultForm`-Objekte der jeweiligen Seiten)
- 6 `useMutation`-Hooks fuer Insert-Operationen (identisch zur Logik in den jeweiligen Seiten)
- Zusaetzliche Queries: `prices` (fuer Leistungen/Pruefungen), `vehicles` (fuer Pruefungen), `instructors` (fuer Pruefungen)
- Import von `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger` aus `@/components/ui/dropdown-menu`
- Import von `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`
- Import von `useToast`, `useMutation`, `useQueryClient`
- Neue Icons: `Plus`, `ChevronDown`

**Query-Invalidierung nach Speichern:**
- Fahrstunde: `driving_lessons`, `driving_lessons_saldo`
- Schaltstunde: `gear_lessons`
- Theorie: `theory_sessions`
- Pruefung: `exams`, `exams_saldo`
- Leistung: `services`, `services_saldo`
- Zahlung: `payments`, `payments_saldo`

**Aufbau im Header:**

```text
[<- Zurueck]  Nachname, Vorname          [Aktion hinzufuegen v]
              Fahrschueler-Details
```

**Aufbau der Sektions-Header (Beispiel Fahrstunden):**

```text
Fahrstunden (4 Einheiten)                              [+]
```

