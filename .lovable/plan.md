
## Geburtsdatum-Feld: Texteingabe + Kalender kombinieren

### Uebersicht
Das Geburtsdatum-Feld im "Neuer Fahrschueler"-Modal wird so umgebaut, dass man das Datum direkt eintippen kann (Format TT.MM.JJJJ) UND optional ueber das Kalender-Icon einen Kalender oeffnen kann.

### Aenderung in `src/pages/dashboard/Fahrschueler.tsx` (Zeilen 370-397)

Das bisherige Popover-Button-Feld wird ersetzt durch eine Kombination aus:
- Einem **Input-Feld** mit Placeholder `TT.MM.JJJJ` zum direkten Eintippen
- Einem **Kalender-Icon-Button** links im Input, der bei Klick den Kalender-Popover oeffnet

**Aufbau:**
```text
+--------------------------------------+
| [Kalender-Icon] | 15.03.1999         |
+--------------------------------------+
         |
         v (nur bei Klick auf Icon)
  +------------------+
  |    Kalender       |
  +------------------+
```

**Technische Details:**

1. Ein `Input`-Feld mit `placeholder="TT.MM.JJJJ"` zeigt den formatierten Datumswert oder ist leer
2. Das Kalender-Icon links im Input ist in einen Popover-Trigger eingebettet
3. Bei manueller Eingabe: `onChange`-Handler parst den eingegebenen Text im Format `dd.MM.yyyy` mit `date-fns/parse` und setzt `form.geburtsdatum` wenn gueltig
4. Bei Kalender-Auswahl: wie bisher, `onSelect` setzt das Datum und schliesst den Popover
5. Eingabevalidierung: Ungueltige Daten werden nicht uebernommen, das Feld bleibt aber editierbar (kein Fehler beim Tippen, erst beim Absenden)

**Neuer State:**
- `geburtsdatumText: string` -- haelt den aktuellen Textinhalt des Inputs (damit man frei tippen kann ohne sofortige Validierung)
- Synchronisation: Kalenderauswahl setzt sowohl `geburtsdatum` als auch `geburtsdatumText`; Texteingabe setzt `geburtsdatumText` sofort und `geburtsdatum` nur wenn gueltig geparst

### Keine weiteren Dateien betroffen
Die Aenderung ist auf das Geburtsdatum-Feld im "Neuer Fahrschueler"-Dialog in `Fahrschueler.tsx` beschraenkt.
