

## Fahrlehrer-Verwaltung unterhalb der Benutzerliste anzeigen

### Änderung

**`src/pages/dashboard/Benutzerverwaltung.tsx`**

Den "Fahrlehrer verwalten"-Button aus dem PageHeader entfernen und stattdessen unterhalb der Benutzer-Tabelle einen eigenen Abschnitt einfügen:

- Überschrift "Fahrlehrer" mit dem Users-Icon
- Button "Fahrlehrer verwalten" daneben
- Darunter eine Tabelle mit allen Fahrlehrern (Name, Status aktiv/inaktiv) — direkt inline, nicht im Dialog
- Der Dialog (`InstructorManageDialog`) bleibt für Hinzufügen/Bearbeiten/Deaktivieren erhalten und wird über den Button geöffnet

Alternativ: Die Fahrlehrer-Liste direkt inline anzeigen (aus der `instructors`-Tabelle laden) mit einer eigenen Query, sodass man auf einen Blick sieht welche Fahrlehrer es gibt, ohne den Dialog öffnen zu müssen.

### Technische Details

| Bereich | Änderung |
|---|---|
| PageHeader `action` | "Fahrlehrer verwalten"-Button entfernen, nur "Account erstellen" bleibt |
| Neuer Abschnitt nach Benutzer-Tabelle | Überschrift "Fahrlehrer" + Button + Inline-Tabelle |
| Neue Query `instructors_manage` | `supabase.from("instructors").select("id, vorname, nachname, aktiv").order("nachname")` |
| Inline-Tabelle | Spalten: Name, Status (Aktiv/Inaktiv Badge) |
| Button "Fahrlehrer verwalten" | Öffnet weiterhin `InstructorManageDialog` zum Hinzufügen/Bearbeiten |

