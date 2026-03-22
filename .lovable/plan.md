

## Tagesabrechnung für Sekretärinnen freigeben

Aktuell ist die Route `/dashboard/tagesabrechnung` mit `requiredRole="admin"` geschützt und in der Sidebar mit `adminOnly: true` markiert. Beide Einschränkungen werden entfernt, damit Sekretärinnen ebenfalls Zugriff haben.

### Änderungen

| Datei | Änderung |
|---|---|
| `src/App.tsx` (Zeile ~67) | `ProtectedRoute requiredRole="admin"` um die Tagesabrechnung-Route entfernen — nur das äußere `ProtectedRoute` (Login-Schutz) bleibt |
| `src/components/AppSidebar.tsx` (Zeile ~51) | `adminOnly: true` vom Tagesabrechnung-Eintrag in `finanzItems` entfernen |

