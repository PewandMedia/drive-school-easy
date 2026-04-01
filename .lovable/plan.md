

## Test-Fahrlehrer "Test, Test" löschen

Der Fahrlehrer "Test, Test" (ID: `872171a9-9256-4bc9-a254-2692dbec18d5`) ist bereits inaktiv und hat keine verknüpften Fahrstunden, Prüfungen oder Theoriestunden. Er kann sicher gelöscht werden.

### Änderung

**Datenbank-Migration:**
```sql
DELETE FROM instructors WHERE id = '872171a9-9256-4bc9-a254-2692dbec18d5';
```

Keine Code-Änderungen nötig.

