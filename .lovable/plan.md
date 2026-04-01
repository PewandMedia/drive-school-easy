

## media@gmail.com Admin-Rolle + aus UI ausblenden

### Schritte

**1. Admin-Rolle zuweisen (Daten-Insert)**
- `INSERT INTO user_roles (user_id, role) VALUES ('80e68fb7-06f0-4c85-950f-4df81aa63c7c', 'admin')`

**2. `src/pages/dashboard/Benutzerverwaltung.tsx`**
- In der `admin_profiles`-Query den Account `media@gmail.com` per `.neq("email", "media@gmail.com")` herausfiltern, sodass er in der Benutzerverwaltung nicht sichtbar ist

| Aktion | Detail |
|---|---|
| Daten-Insert | Admin-Rolle für media@gmail.com in `user_roles` |
| `Benutzerverwaltung.tsx` | Account aus der Profil-Liste ausblenden |

