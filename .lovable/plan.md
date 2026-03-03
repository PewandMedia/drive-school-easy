

## Kontaktdaten-Bearbeitung im Schuelerprofil

### Was wird gemacht
Ein Bearbeiten-Button (Stift-Icon) wird neben den Kontaktdaten im Schuelerprofil hinzugefuegt. Klick oeffnet einen Dialog zum Bearbeiten von E-Mail, Telefon, Adresse, Geburtsdatum und Anmeldedatum.

### Aenderungen in FahrschuelerDetail.tsx

1. **Neuer State**: `editingContact` (boolean) und `contactForm` mit email, telefon, adresse, geburtsdatum, anmeldedatum (created_at)

2. **Neue Update-Mutation**: `mutEditContact` -- UPDATE `students` SET email, telefon, adresse, geburtsdatum. Fuer `created_at` (Anmeldedatum) ebenfalls updaten.

3. **UI**: Kleiner Pencil-Button rechts oben neben dem Kontaktdaten-Bereich (Zeile ~877). Klick oeffnet einen Dialog mit Eingabefeldern fuer alle Kontaktfelder, vorausgefuellt mit aktuellen Werten.

4. **Nach Erfolg**: Query invalidieren, Dialog schliessen, Toast anzeigen.

