

## Rollen- und Berechtigungssystem mit Aktivitaetsprotokoll

### Uebersicht

Ein vollstaendiges System mit Rollentrennung (Admin/Sekretaerin), Benutzerverwaltung, und lueckenlosem Aktivitaetsprotokoll. Jede Aktion wird mit User-ID, Name, Zeitstempel und Aktionstyp gespeichert.

---

### Phase 1: Datenbank-Grundlagen

**Neue Tabellen und Funktionen per Migration:**

```text
1. ENUM: app_role ('admin', 'sekretaerin')

2. Tabelle: user_roles
   - id (uuid, PK)
   - user_id (uuid, FK -> auth.users, ON DELETE CASCADE)
   - role (app_role)
   - UNIQUE(user_id, role)
   - RLS: nur Admins koennen lesen/schreiben

3. Tabelle: profiles
   - id (uuid, PK, FK -> auth.users)
   - email (text)
   - display_name (text)
   - aktiv (boolean, default true)
   - last_sign_in (timestamptz)
   - created_at (timestamptz)
   - RLS: Admins sehen alle, User sieht eigenes Profil

4. Tabelle: activity_log
   - id (uuid, PK)
   - user_id (uuid)
   - user_name (text)
   - action (text: 'erstellt' | 'bearbeitet' | 'geloescht')
   - entity_type (text: 'fahrstunde' | 'theorie' | 'pruefung' | 'zahlung' | 'leistung' | 'gutschrift')
   - entity_id (uuid)
   - details (text, optional)
   - created_at (timestamptz)
   - RLS: nur Admins koennen lesen, INSERT fuer alle authenticated

5. Funktion: has_role(uuid, app_role) -> boolean
   SECURITY DEFINER, um RLS-Rekursion zu vermeiden

6. Trigger: Bei neuem Auth-User automatisch Profil erstellen
```

**Bestehenden Admin zuweisen:**
- INSERT in user_roles fuer admin@fahrschule.de mit Rolle 'admin'
- INSERT in profiles fuer den bestehenden User

---

### Phase 2: Auth-Context erweitern

| Datei | Aenderung |
|-------|-----------|
| `src/contexts/AuthContext.tsx` | Rolle und Profil-Daten laden |

- Nach Login: `user_roles` abfragen um Rolle zu ermitteln
- Neuer State: `role: 'admin' | 'sekretaerin' | null`
- Neuer State: `profile: { display_name, email } | null`
- Exportiert: `isAdmin` boolean Helper

---

### Phase 3: Navigation nach Rolle filtern

| Datei | Aenderung |
|-------|-----------|
| `src/components/AppSidebar.tsx` | Menu-Items nach Rolle ein-/ausblenden |

- `useAuth()` importieren
- Fuer Sekretaerinnen ausblenden:
  - Fahrlehrer-Statistik
  - Auswertung
  - Tagesabrechnung
  - Benutzerverwaltung (neu)
- Admin sieht alles plus neuen Menuepunkt "Benutzerverwaltung"

---

### Phase 4: Routen-Schutz

| Datei | Aenderung |
|-------|-----------|
| `src/components/ProtectedRoute.tsx` | Optionaler `requiredRole` Prop |
| `src/App.tsx` | Admin-Routen mit `requiredRole="admin"` schuetzen |

- ProtectedRoute bekommt optionalen Prop `requiredRole`
- Wenn gesetzt: prueft ob User die Rolle hat, sonst Redirect zu /dashboard
- Neue Route: `/dashboard/benutzerverwaltung`

---

### Phase 5: Benutzerverwaltung (Admin-Seite)

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/Benutzerverwaltung.tsx` | Neue Seite |

Funktionen:
- Liste aller Accounts mit: Name, E-Mail, Rolle, Letzter Login, Aktiv/Inaktiv
- Neuen Account erstellen (ruft Edge Function auf)
- Account deaktivieren (setzt `aktiv = false` in profiles)
- Rolle aendern (UPDATE auf user_roles)
- Passwort zuruecksetzen (Edge Function mit Service Role Key)

**Edge Function: `manage-users`**
- Erstellt neue User via `supabase.auth.admin.createUser()`
- Setzt Passwoerter zurueck via `supabase.auth.admin.updateUserById()`
- Nutzt SUPABASE_SERVICE_ROLE_KEY (bereits vorhanden)

---

### Phase 6: Aktivitaetsprotokoll einbauen

| Datei | Aenderung |
|-------|-----------|
| `src/lib/activityLog.ts` | Helper-Funktion zum Loggen |
| `src/pages/dashboard/Fahrstunden.tsx` | Log bei Insert/Delete |
| `src/pages/dashboard/Theorie.tsx` | Log bei Insert/Delete |
| `src/pages/dashboard/Pruefungen.tsx` | Log bei Insert/Update/Delete |
| `src/pages/dashboard/Zahlungen.tsx` | Log bei Insert/Delete |
| `src/pages/dashboard/Leistungen.tsx` | Log bei Insert/Update/Delete |

Helper-Funktion:
```text
logActivity({
  action: 'erstellt' | 'bearbeitet' | 'geloescht',
  entity_type: 'fahrstunde' | 'theorie' | ...,
  entity_id: string,
  details?: string
})
```
- Liest user_id und display_name aus AuthContext
- INSERT in activity_log Tabelle
- Wird in `onSuccess` der jeweiligen Mutations aufgerufen

---

### Phase 7: Info-Button (nur Admin)

| Datei | Aenderung |
|-------|-----------|
| `src/components/ActivityInfoButton.tsx` | Neue Komponente |
| Alle Tabellen-Seiten | Info-Button in jeder Zeile |

- Kleiner Info-Icon-Button neben jedem Eintrag
- Nur sichtbar wenn `isAdmin === true`
- Bei Klick: Popup/Dialog mit:
  - "Eingetragen von: [Name]"
  - "Datum: [TT.MM.JJJJ]"
  - "Uhrzeit: [HH:MM]"
  - "Letzte Aenderung: [Datum/Uhrzeit]"
- Laedt Daten aus `activity_log` gefiltert nach `entity_id`

---

### Zusammenfassung der neuen Dateien

| Neue Datei | Zweck |
|------------|-------|
| `src/pages/dashboard/Benutzerverwaltung.tsx` | Admin-Seite fuer Account-Verwaltung |
| `src/lib/activityLog.ts` | Helper zum Schreiben von Aktivitaetsprotokollen |
| `src/components/ActivityInfoButton.tsx` | Info-Popup pro Eintrag |
| `supabase/functions/manage-users/index.ts` | Edge Function fuer User-Erstellung/Passwort-Reset |

### Zusammenfassung der geaenderten Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/contexts/AuthContext.tsx` | Rolle + Profil laden |
| `src/components/AppSidebar.tsx` | Menu nach Rolle filtern |
| `src/components/ProtectedRoute.tsx` | Rollen-Check |
| `src/App.tsx` | Neue Route + Admin-Schutz |
| `src/pages/dashboard/Fahrstunden.tsx` | Activity-Log + Info-Button |
| `src/pages/dashboard/Theorie.tsx` | Activity-Log + Info-Button |
| `src/pages/dashboard/Pruefungen.tsx` | Activity-Log + Info-Button |
| `src/pages/dashboard/Zahlungen.tsx` | Activity-Log + Info-Button |
| `src/pages/dashboard/Leistungen.tsx` | Activity-Log + Info-Button |

### Migrationen

1. Enum + user_roles + has_role Funktion
2. profiles Tabelle + Trigger
3. activity_log Tabelle
4. RLS Policies fuer alle neuen Tabellen
5. Bestehenden Admin-User in user_roles + profiles eintragen

