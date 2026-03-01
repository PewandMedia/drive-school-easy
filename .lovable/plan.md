

## Notiz-Feld fuer Gutschriften

### Uebersicht

Ein optionales Textfeld "Notiz / Vermerk" wird im Gutschrift-Dialog hinzugefuegt (sowohl im Schuelerprofil als auch auf der Zahlungen-Seite). Die Notiz wird in der `beschreibung` des `open_items`-Eintrags gespeichert, sodass sie im Schuelerprofil bei den offenen Posten sichtbar ist. Keine DB-Migration noetig, da `open_items.beschreibung` bereits existiert.

### Aenderungen

**Datei: `src/pages/dashboard/FahrschuelerDetail.tsx`**

1. `fsZahlung`-State um `gutschriftNotiz: string` erweitern (Default: `""`)
2. Im Dialog: Wenn `istGutschrift` aktiv, ein Textarea-Feld "Notiz (optional)" nach dem Betrag-Feld anzeigen
3. In `mutZahlung`: Die `beschreibung` des `open_items`-Eintrags wird auf `"Gutschrift"` + ggf. ` – [Notiz]` gesetzt, falls eine Notiz vorhanden ist
4. Reset beim Schliessen des Dialogs anpassen

**Datei: `src/pages/dashboard/Zahlungen.tsx`**

1. `PaymentForm`-Typ um `gutschriftNotiz: string` erweitern
2. Gleiches Textarea-Feld im Dialog wenn Gutschrift aktiv
3. Gleiche Logik in `saveMutation` fuer die `beschreibung`
4. Reset anpassen

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/FahrschuelerDetail.tsx` | Notiz-Feld im Gutschrift-Dialog, beschreibung in open_items anpassen |
| `src/pages/dashboard/Zahlungen.tsx` | Notiz-Feld im Gutschrift-Dialog, beschreibung in open_items anpassen |

