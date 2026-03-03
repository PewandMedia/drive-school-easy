

## Namensbearbeitung und Loeschbuttons im Schuelerprofil

### Uebersicht
Zwei Erweiterungen in `FahrschuelerDetail.tsx`:
1. **Kontaktdaten-Dialog erweitern**: Vorname, Nachname und Fuehrerscheinklasse als bearbeitbare Felder hinzufuegen.
2. **Loeschbuttons**: Neben jedem Bearbeitungs-Stift (Fahrstunden, Pruefungen, Leistungen, Zahlungen, Theorie) einen Papierkorb-Button ergaenzen, der nach Bestaetigungsabfrage den Eintrag loescht.

### Technische Details

#### 1. Kontaktdaten-Dialog: Name bearbeitbar machen

- `contactForm` State erweitern um `vorname`, `nachname`, `fuehrerscheinklasse`
- Beim Oeffnen des Dialogs diese Felder vorausfuellen
- Im Dialog zwei neue Felder (Vorname, Nachname) als erstes einfuegen, darunter Fuehrerscheinklasse als Select
- `mutEditContact` erweitern: zusaetzlich `vorname`, `nachname`, `fuehrerscheinklasse` an den UPDATE uebergeben

#### 2. Loeschbuttons + Bestaetigungsdialog

**Neuer State:**
- `deletingItem`: `{ type: "fahrstunde" | "theorie" | "pruefung" | "leistung" | "zahlung", id: string, label: string } | null`

**Neue Delete-Mutations (5 Stueck):**

| Typ | Tabelle | Besonderheit |
|---|---|---|
| Fahrstunde | `driving_lessons` | DB-Trigger loescht `open_items` automatisch |
| Theorie | `theory_sessions` | Keine open_items betroffen |
| Pruefung | `exams` | DB-Trigger loescht `open_items` automatisch |
| Leistung | `services` | DB-Trigger loescht `open_items` automatisch |
| Zahlung | `payments` | Muss zuerst `payment_allocations` loeschen, dann Payment. Danach open_items-Status recalcen via Query-Invalidierung (der DB-Trigger `update_open_item_after_allocation` greift nicht bei DELETE, daher muessen `open_items` manuell zurueckgesetzt werden) |

**Zahlung loeschen – kritischer Ablauf:**
1. Alle `payment_allocations` fuer diese `payment_id` laden
2. Merken welche `open_item_id`s betroffen sind
3. `payment_allocations` WHERE `payment_id` = id loeschen
4. Fuer jede betroffene `open_item_id`: Summe der verbleibenden Allocations neu berechnen, `betrag_bezahlt` und `status` updaten
5. `payments` WHERE `id` = id loeschen
6. Falls Gutschrift: zugehoeriger `open_items`-Eintrag (typ=gutschrift, referenz_id=payment_id) loeschen

**UI pro Zeile:**
- Trash2-Icon-Button (ghost, destructive hover) neben dem Pencil-Button
- Klick setzt `deletingItem` State
- AlertDialog zeigt: "Eintrag loeschen? [Beschreibung] wird unwiderruflich geloescht."
- Bestaetigung fuehrt die passende Delete-Mutation aus

**Query-Invalidierungen nach Delete:**
Alle relevanten Keys: entity-spezifisch + `open_items` + `payment_allocations` + `payments` (student-spezifisch und global)

### Keine Datenbank-Migrationen noetig
Die DELETE-Trigger (`delete_open_item_for_entity`) existieren bereits fuer `driving_lessons`, `exams` und `services`. Payment-Allocations werden manuell bereinigt.

