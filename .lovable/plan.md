

## Landingpage entfernen und direkt zu /login weiterleiten

### Aenderungen

**1. `src/App.tsx`**
- Die Route `/` aendern: statt `<Index />` eine `<Navigate to="/login" replace />` Weiterleitung einbauen
- Den Import von `Index` entfernen

**2. `src/pages/Index.tsx`**
- Datei loeschen (wird nicht mehr gebraucht)

### Ergebnis
Jeder Aufruf von `/` leitet sofort zu `/login` weiter. Eingeloggte User werden dort automatisch zum Dashboard weitergeleitet (das macht die Login-Seite bereits).

