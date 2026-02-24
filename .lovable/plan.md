

## Datenbank mit 400 Demo-Fahrschuelern fuellen

### Uebersicht

Es wird eine Supabase Edge Function erstellt, die einmalig aufgerufen wird und 400 realistische Fahrschueler mit allen zugehoerigen Daten generiert. Die Daten decken die letzten 3 Monate ab (Dezember 2025 bis Februar 2026).

### Was wird generiert

| Daten | Details |
|-------|---------|
| **400 Fahrschueler** | Realistische deutsche Vor-/Nachnamen, Geburtsdaten (17-35 Jahre), zufaellige Adressen, Telefonnummern, E-Mails |
| **Fuehrerscheinklassen** | Zufaellig verteilt: ca. 60% B, 25% B197, 15% B78 |
| **Fahrschule** | Zufaellig "riemke" oder "rathaus" |
| **Anmeldedatum** | Verteilt ueber die letzten 3 Monate |
| **Fahrstunden** | 0-25 pro Schueler je nach "Fortschritt", unterschiedliche Typen (Uebungsstunde, Ueberland, Autobahn, Nacht, Testfahrt B197) |
| **Theoriestunden** | 0-14 Grundstoff + 0-2 klassenspezifisch pro Schueler |
| **Schaltstunden** | Fuer B197-Schueler: 0-10 Schaltstunden |
| **Pruefungen** | Theorie- und Fahrpruefungen mit bestanden/nicht bestanden, Fahrpruefungen mit zufaelligem Fahrlehrer |
| **Leistungen (Services)** | Grundbetrag, Lernmaterial etc. aus bestehender Preisliste |
| **Zahlungen** | Realistische Zahlungen (bar, EC, Ueberweisung) die offenen Posten zugeordnet werden |

### Wichtige Regeln

- **Bestehende Fahrlehrer** werden verwendet (7 aktive Fahrlehrer)
- **Bestehende Preise** werden verwendet (5 aktive Preise)
- **Trigger** arbeiten automatisch: Fahrstunden-Preise werden berechnet, offene Posten werden erstellt
- **Zahlungen** werden ueber `payment_allocations` den offenen Posten zugeordnet, sodass der Trigger den Status aktualisiert
- Unterschiedliche Fortschrittsstufen: Anfaenger (nur Anmeldung), Fortgeschrittene (viele Fahrstunden), Pruefungsreife (Pruefungen abgelegt)

### Technischer Ablauf

**Neue Datei: `supabase/functions/seed-demo-data/index.ts`**

1. Edge Function mit Service Role Key (umgeht RLS)
2. Generiert 400 Schueler in Batches (50er Batches fuer Performance)
3. Pro Schueler wird ein zufaelliger "Fortschrittsgrad" (0-100%) bestimmt
4. Basierend auf dem Fortschritt werden Fahrstunden, Theorie, Pruefungen etc. erstellt
5. Wartet nach jedem Insert auf die Trigger (open_items werden automatisch erstellt)
6. Erstellt Zahlungen und ordnet sie den entstandenen offenen Posten zu

**Fortschrittsstufen:**

```text
0-20%  : Nur Anmeldung + Grundbetrag/Lernmaterial
20-50% : + einige Theoriestunden + erste Fahrstunden
50-75% : + viele Fahrstunden + Sonderfahrten + Theoriepruefung
75-100%: + Fahrpruefung, teilweise bestanden
```

**Zahlungslogik:**
- Jeder Schueler hat zwischen 30-90% seiner offenen Posten bezahlt
- Zahlungen werden chronologisch den aeltesten offenen Posten zugeordnet
- Zahlungsarten zufaellig verteilt (bar, EC, Ueberweisung)

### Aufruf

Nach dem Deployment wird die Funktion einmalig per curl aufgerufen. Danach kann sie wieder geloescht werden.

### Dateien

| Datei | Aktion |
|-------|--------|
| `supabase/functions/seed-demo-data/index.ts` | Neu erstellen |
| `supabase/config.toml` | `verify_jwt = false` fuer die Funktion |

