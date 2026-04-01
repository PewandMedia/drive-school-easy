

## Fahrlehrer-Verwaltung in Benutzerverwaltung einbinden

### Aktuelle Situation
- Es gibt bereits ein fertiges `InstructorManageDialog`-Komponente mit Hinzufügen, Bearbeiten, Deaktivieren und Reaktivieren
- Die `instructors`-Tabelle ist bereits systemweit integriert (Fahrstunden, Theorie, Prüfungen, Fahrlehrer-Statistik) — alle Stellen nutzen Query-Keys wie `instructors_active` die automatisch invalidiert werden
- Es fehlt nur der Aufruf-Button in der Benutzerverwaltung

### Änderung

**`src/pages/dashboard/Benutzerverwaltung.tsx`**
- `InstructorManageDialog` importieren
- State `fahrlehrerOpen` hinzufügen
- Neben dem "Account erstellen"-Button einen zweiten Button "Fahrlehrer verwalten" einfügen
- Das `InstructorManageDialog` am Ende der Seite rendern

Ein neuer Fahrlehrer ist sofort überall verfügbar, da alle Komponenten im System die `instructors`-Tabelle direkt abfragen.

| Datei | Änderung |
|---|---|
| `Benutzerverwaltung.tsx` | Button + InstructorManageDialog einbinden |

