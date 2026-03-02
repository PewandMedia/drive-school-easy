

## Pruefungsstatus im Schuelerprofil aenderbar machen

### Problem
Im Schuelerprofil werden Pruefungen mit ihrem Status (Angemeldet, Bestanden, etc.) angezeigt, aber man kann den Status dort nicht aendern. Man muss dafuer auf die separate Pruefungsseite wechseln.

### Loesung
Die Status-Badges der Pruefungen im Schuelerprofil werden klickbar gemacht. Bei Klick oeffnet sich ein Dropdown (Select), ueber das der Status direkt geaendert werden kann -- genau wie auf der Pruefungsseite.

### Aenderung

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/FahrschuelerDetail.tsx` | Status-Badge klickbar machen mit Inline-Select zum Aendern |

### Details

1. Neuer State: `editingExamStatusId` (string oder null) -- speichert welche Pruefung gerade bearbeitet wird
2. Neue Mutation: `updateExamStatusMutation` -- ruft `supabase.from("exams").update({ status }).eq("id", examId)` auf
3. Im Pruefungs-Bereich (Zeilen ~1243-1260): Status-Badge wird zu einem klickbaren Button. Bei Klick wird `editingExamStatusId` gesetzt und ein Select-Dropdown erscheint mit den Optionen: Angemeldet, Bestanden, Nicht bestanden, Krank
4. Nach Statusaenderung werden die Queries `exams` und `open_items` invalidiert

Das Verhalten ist identisch zur bestehenden Inline-Status-Aenderung auf der Pruefungsseite (`Pruefungen.tsx`, Zeilen ~220-240).

