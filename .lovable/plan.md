# Schnellerfassung vereinfachen + Fahrstunden-Dauer als Einheiten

## Schnellerfassung (`src/pages/dashboard/Schnellerfassung.tsx`)

Fahrstunden-Tab drastisch reduzieren – nur noch:

- **Datum & Uhrzeit** (bleibt)
- **Einheiten** (Auswahl): `1 Einheit (45 min · 65 €)` oder `2 Einheiten / Doppelstunde (90 min · 130 €)` — Standard = 1
- **Speichern**-Button

Entfernt aus der Schnellerfassung:
- Fahrlehrer-Auswahl
- Fahrzeug-Auswahl (Automatik/Schaltwagen)
- Typ-Auswahl (Übungsstunde/Überland/…)
- Freies Minuten-Feld in 15-min-Schritten

Beim Speichern:
- `typ = 'uebungsstunde'` (Standard)
- `fahrzeug_typ = 'automatik'` (Standard)
- `instructor_id = null`
- `dauer_minuten = einheiten * 45`
- Preis wird wie bisher vom DB-Trigger `calculate_driving_lesson_price` automatisch berechnet (65 €/45 min)

Der Zahlungs-Tab bleibt unverändert.

## Fahrstunden-Seite (`src/pages/dashboard/Fahrstunden.tsx`)

Im Fahrstunden-Dialog das Feld **„Dauer (Minuten)"** ersetzen durch **„Einheiten"** mit Auswahl:
- 1 Einheit (45 min)
- 2 Einheiten (90 min · Doppelstunde) — Standard
- 3 Einheiten (135 min)
- 4 Einheiten (180 min)

Intern weiterhin `dauer_minuten = einheiten * 45` speichern. Fehlstunde behält Sonderlogik.

Fahrlehrer / Fahrzeug / Typ bleiben auf der regulären Fahrstunden-Seite erhalten – nur die Dauer-Eingabe wird umgestellt.

## Nicht angefasst
- DB-Schema, Trigger, Preisberechnung
- Schaltstunden, Theorie, Prüfungen, Zahlungen
- Balance-/Offene-Posten-Sync (läuft weiter über die bestehenden Trigger)
