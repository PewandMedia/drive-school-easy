

## Dialog scrollbar machen

### Problem
Der "Neuer Fahrschueler"-Dialog ist zu lang fuer den Bildschirm. Die Buttons "Abbrechen" und "Speichern" sind abgeschnitten und nicht erreichbar.

### Loesung
Den Dialog-Inhalt (Formular) in einen scrollbaren Bereich packen, sodass der Header oben und die Buttons unten immer sichtbar bleiben.

### Technische Umsetzung

**Datei: `src/pages/dashboard/Fahrschueler.tsx`**

1. `DialogContent` bekommt `max-h-[90vh] flex flex-col` damit er nie groesser als 90% des Bildschirms wird
2. Das `<form>` bekommt `overflow-y-auto flex-1 min-h-0` damit der Formularinhalt scrollbar wird
3. Die `DialogFooter` wird aus dem scrollbaren Bereich herausgenommen und ans Ende des Dialogs gesetzt (immer sichtbar, nicht abgeschnitten)

Konkret:
- `DialogContent`: `className="max-w-lg max-h-[90vh] flex flex-col"`
- `form`: `className="space-y-4 mt-2 overflow-y-auto flex-1 min-h-0 pr-1"` (pr-1 fuer Scrollbar-Abstand)
- `DialogFooter` bleibt innerhalb des Forms aber bekommt `sticky bottom-0 bg-background pt-4` oder alternativ wird das Form-Layout so umstrukturiert, dass die Footer-Buttons immer sichtbar sind

Ergebnis: Auf kleinen Bildschirmen kann man durch das Formular scrollen, die Buttons bleiben immer erreichbar.

