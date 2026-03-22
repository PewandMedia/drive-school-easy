

## Abrechnung: Statistik-Karten nur für Admins

### Änderung

**`src/pages/dashboard/Abrechnung.tsx`**

Die drei Statistik-Karten (Gesamtforderungen, Eingegangene Zahlungen, Offener Gesamtsaldo) werden nur angezeigt, wenn der Benutzer die Rolle `admin` hat. Sekretärinnen sehen weiterhin die Schüler-Tabelle, aber nicht die Gesamtübersicht.

- `useAuth()` importieren und `isAdmin` auslesen
- Die Stats-Karten in eine `{isAdmin && ...}` Bedingung wrappen

