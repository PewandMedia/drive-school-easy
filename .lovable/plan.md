

## Schülerprofil: Umschreiber-Status bearbeiten + Schüler löschen

### Aktuelle Situation
Das Bearbeitungs-Dialog enthält bereits Führerscheinklasse, Name, Kontaktdaten etc. Es fehlen:
1. **Umschreiber-Status** (ist_umschreiber) — kann aktuell nicht nachträglich geändert werden
2. **Schüler komplett löschen** — keine Möglichkeit vorhanden

### Änderungen

**`src/pages/dashboard/FahrschuelerDetail.tsx`**

1. **contactForm-State erweitern** um `ist_umschreiber: boolean` und `fahrschule: string`
2. **Im Bearbeitungs-Dialog** zwei neue Felder hinzufügen:
   - Checkbox "Umschreiber" (ein/aus)
   - Select "Fahrschule" (Riemke Markt / Rathaus)
3. **mutEditContact** erweitern: `ist_umschreiber` und `fahrschule` ins Update-Objekt aufnehmen
4. **Schüler-Löschfunktion**: 
   - Neuer State `deletingStudent` für AlertDialog-Bestätigung
   - Mutation die den Schüler aus `students` löscht (CASCADE löscht abhängige Daten)
   - Nach Löschen: Redirect zur Schülerliste
   - Button "Schüler löschen" (rot, destruktiv) im Bearbeitungs-Dialog oder als separater Button im Profil

| Bereich | Änderung |
|---|---|
| contactForm State | `ist_umschreiber` und `fahrschule` hinzufügen |
| Bearbeitungs-Dialog | Umschreiber-Checkbox + Fahrschule-Select einfügen |
| mutEditContact | `ist_umschreiber` und `fahrschule` mitspeichern |
| Neuer AlertDialog | Sicherheitsabfrage vor Schüler-Löschung |
| Neue Mutation | `supabase.from("students").delete().eq("id", id)` + Redirect |
| Profil-UI | Roter "Schüler löschen"-Button unterhalb des Drucken-Buttons |

