
Zuerst: Ich habe deinen Punkt verstanden. Du willst **2 komplett getrennte Projekte**:
1) dieses produktive Fahrschul-Projekt  
2) ein Remix als Demo-Projekt für andere Fahrschulen  
ohne Daten- oder Änderungs-Überschneidung.

### Was ich bereits verifiziert habe
Aktuell zeigt dieses Projekt noch eindeutig auf die alte Supabase-Instanz `okisvoalmfkohpuymzmr`:
- `supabase/config.toml` → `project_id = "okisvoalmfkohpuymzmr"`
- `src/integrations/supabase/client.ts` → URL mit `okisvoalmfkohpuymzmr.supabase.co`
- `.env` → `VITE_SUPABASE_PROJECT_ID="okisvoalmfkohpuymzmr"`

Das erklärt die Überschneidung der Daten.

### Umsetzungsplan (nächster Durchlauf)
1. **Projekt-Trennung final herstellen (wichtigster Schritt)**
   - Im **Demo-Remix-Projekt** die alte Supabase-Verknüpfung trennen.
   - Danach **nur dort** das neue Supabase-Projekt verbinden.

2. **Verbindung technisch verifizieren**
   - Prüfen, dass im Demo-Remix danach **nicht mehr** `okisvoalmfkohpuymzmr` in:
     - `supabase/config.toml`
     - `.env`
     - `src/integrations/supabase/client.ts`
   - Falls dort noch alte Werte stehen: Verbindung ist nicht korrekt umgestellt.

3. **Demo-Datenbank initialisieren**
   - Im Demo-Projekt Migrationen laufen lassen (Schema aufbauen).
   - Seed/Grunddaten (Preise, Fahrlehrer) nur in der Demo-DB anlegen.

4. **Bereits vermischte Daten aufräumen**
   - In diesem Projekt die versehentlich angelegten Test-Datensätze (z. B. test2) gezielt löschen.
   - Danach keine Demo-Seeds mehr in dieser produktiven DB ausführen.

5. **Isolations-Test (Ende-zu-Ende)**
   - In Demo einen neuen Test-Schüler anlegen.
   - Im Produktiv-Projekt prüfen, dass dieser dort **nicht** erscheint (und umgekehrt).

6. **Dauerhafte Schutzmaßnahme gegen Verwechslung**
   - Sichtbares ENV-Label im UI einbauen (z. B. „PRODUKTIV“ vs. „DEMO“), damit du sofort siehst, in welchem Projekt du gerade arbeitest.

### Technische Details
- Ein Remix kopiert den Code, aber startet oft mit derselben Supabase-Verbindung, bis man sie explizit umstellt.
- Eine neue Supabase in „anderem Projekt“ reicht nicht, wenn das Remix-Projekt weiterhin auf die alte `project_id` zeigt.
- Nach Umstellung einmal ab-/anmelden (Session/JWT neu), damit kein alter Token-Eindruck bleibt.
- Die vorhandene Lösch-Migration mit fixer Student-ID ist eine einmalige Bereinigung; für die Zukunft sollten solche Einzel-Löschungen nicht als dauerhafte Standardmigrationen im Projekt bleiben.

### Zielzustand nach Umsetzung
- Beide Lovable-Projekte sind getrennt.
- Jede App schreibt in ihre eigene Supabase-DB.
- Änderungen und Testdaten aus Demo beeinflussen dieses Produktivprojekt nicht mehr.
