

## Archivierung ohne Bestätigungsdialog

Der Archivieren-Button soll direkt `mutArchive.mutate(true)` aufrufen statt den Dialog zu öffnen. Der AlertDialog-Block und der `dlgArchive`-State werden entfernt.

| Datei | Änderung |
|---|---|
| `FahrschuelerDetail.tsx` | Button `onClick` von `setDlgArchive(true)` → `mutArchive.mutate(true)`. Entferne `dlgArchive` State und den AlertDialog-Block (Zeilen ~2971-2985). |

