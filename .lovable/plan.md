
## Fix: Verwaiste Open Items bereinigen

### Problem
Die neuen Datenbank-Trigger funktionieren fuer zukuenftige Loeschungen, aber es existieren bereits 3 verwaiste Eintraege in `open_items` (insgesamt 325 EUR) von zuvor geloeschten Fahrstunden. Das erklaert die Differenz: 1.535 - 325 = 1.210 EUR (korrekter Saldo).

### Loesung
Eine einmalige SQL-Migration, die alle verwaisten `open_items` bereinigt -- also Eintraege, deren `referenz_id` auf keine existierende Fahrstunde, Pruefung oder Leistung mehr verweist.

```sql
DELETE FROM open_items oi
WHERE NOT EXISTS (
  SELECT 1 FROM driving_lessons dl WHERE dl.id = oi.referenz_id
) AND NOT EXISTS (
  SELECT 1 FROM exams e WHERE e.id = oi.referenz_id
) AND NOT EXISTS (
  SELECT 1 FROM services s WHERE s.id = oi.referenz_id
);
```

Eine einzige Datei, eine einzige SQL-Anweisung. Danach zeigt der Saldo korrekt 1.210 EUR an.
