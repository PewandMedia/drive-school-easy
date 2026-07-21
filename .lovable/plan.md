Ziel: Auf der Seite „Kontrolle“ soll der Nutzer wählen können, ob er nur Fahrstunden, nur Zahlungen oder beides angezeigt bekommen möchte.

Geplante Änderungen in `src/pages/dashboard/Kontrolle.tsx`:

1. Neuer Filter „Anzeige“
   - State `anzeige` mit Werten `"beides" | "fahrstunden" | "zahlungen"`.
   - Ein Select/ToggleGroup in der Filterkarte neben „Filiale“.
   - Label: „Anzeigen“ mit Optionen „Beides“, „Nur Fahrstunden“, „Nur Zahlungen“.

2. Bedingte Darstellung der Bereiche
   - Die Fahrstunden-Karte wird nur gerendert, wenn `anzeige !== "zahlungen"`.
   - Die Zahlungen-Karte wird nur gerendert, wenn `anzeige !== "fahrstunden"`.

3. Zusammenfassungskarten anpassen
   - Wenn „Nur Fahrstunden“ gewählt ist, werden nur die Fahrstunden-Summenkarten angezeigt (Zahlungskarten ausgeblendet).
   - Wenn „Nur Zahlungen“ gewählt ist, werden nur die Zahlungs-Summenkarten angezeigt (Fahrstundenkarten ausgeblendet).
   - Bei „Beides“ bleibt die aktuelle 4-Spalten-Übersicht bestehen.

4. Datenabfragen
   - Die Supabase-Queries für Fahrstunden und Zahlungen bleiben unverändert, damit schnelles Umschalten möglich ist.
   - Filiale-Filter und Schüler-Suche wirken sich weiterhin nur auf Zahlungen bzw. beide Listen aus.

Keine Schema-Änderungen, keine neuen Dateien, keine Änderungen an anderen Seiten.