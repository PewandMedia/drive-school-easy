export const THEORIE_LEKTIONEN = Array.from({ length: 14 }, (_, i) => ({
  nr: i + 1,
  typ: (i < 12 ? "grundstoff" : "klassenspezifisch") as "grundstoff" | "klassenspezifisch",
  label: `Lektion ${i + 1} – ${i < 12 ? "Grundstoff" : "Klassenspezifisch"}`,
}));

export const lektionToTyp = (lektion: number): "grundstoff" | "klassenspezifisch" =>
  lektion <= 12 ? "grundstoff" : "klassenspezifisch";
