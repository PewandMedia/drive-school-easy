## Zahlungs-Labels in Schnellerfassung an normale Zahlungserfassung angleichen

In `src/pages/dashboard/Schnellerfassung.tsx` werden im Zahlungs-Tab nur die Label-Texte umbenannt, damit sie exakt dem Dialog aus `Zahlungen.tsx` entsprechen:

| Alt (Schnellerfassung) | Neu (einheitlich) |
| --- | --- |
| „Zahlungsdatum" | „Einnahmedatum (Fahrlehrer)" |
| „Im Büro eingereicht am" | „Einreichungsdatum (Büro)" |
| „Fahrlehrer" | „Fahrlehrer (optional)" |
| „Filiale" | „Abgegeben in Filiale" |
| „Gutschrift / Rückzahlung (Betrag wird negativ gebucht)" | „Gutschrift" |

Reihenfolge der Felder wird ebenfalls an den Standard-Dialog angepasst: Gutschrift-Checkbox oben, dann Einnahmedatum + Einreichungsdatum in einer Zeile, dann Fahrlehrer, dann Zahlungsart + Filiale, dann Betrag.

Keine Änderungen an Logik, State-Namen, Speicherung oder anderen Seiten – nur die sichtbaren Labels und die Feld-Reihenfolge.
