

## Test-Account "test test" loeschen

### Ursache

Beide Projekte teilen dieselbe Supabase-Datenbank. Das Remix-Projekt muss mit einer eigenen Supabase-Instanz verbunden werden, damit Daten getrennt bleiben.

### Loesung

1. **SQL-Migration**: Alle Daten des Schuelers `eddb0f9e-fdb2-4152-ba6a-0544ad541c63` loeschen (gleiche Reihenfolge wie beim letzten Mal: payment_allocations → open_items → services → activity_log → students)

2. **Empfehlung**: Im Remix-Projekt eine neue Supabase-Verbindung einrichten, damit die Datenbanken getrennt sind.

| Datei | Aenderung |
|---|---|
| SQL-Migration | DELETE-Statements fuer Student `eddb0f9e-fdb2-4152-ba6a-0544ad541c63` |

