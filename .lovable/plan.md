

## Automatische Guthaben-Verrechnung nach Zahlungserfassung

### Problem
Nach dem Hinzufügen einer Zahlung muss man manuell hochscrollen und auf "Guthaben verrechnen" klicken. Das soll automatisch passieren.

### Lösung

**`src/pages/dashboard/FahrschuelerDetail.tsx`**

In der `mutZahlung`-Mutation (Zeile ~492, `onSuccess`-Callback): Nach erfolgreichem Speichern einer Zahlung automatisch `mutGuthabenVerrechnen.mutate()` aufrufen — aber nur wenn es keine Gutschrift ist und keine offenen Posten bereits ausgewählt wurden (da diese schon direkt zugeordnet werden).

Konkret: Im `onSuccess` von `mutZahlung` nach den `invalidateQueries`-Aufrufen eine Bedingung einfügen, die prüft ob die Zahlung keine Gutschrift war und keine spezifischen Posten ausgewählt waren. Falls ja, wird nach kurzem Delay (damit die Queries refetched sind) automatisch `mutGuthabenVerrechnen.mutate()` aufgerufen.

| Datei | Änderung |
|---|---|
| `FahrschuelerDetail.tsx` | `mutZahlung.onSuccess`: automatisch `mutGuthabenVerrechnen.mutate()` aufrufen für freie Zahlungen |

