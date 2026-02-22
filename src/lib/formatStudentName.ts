import { format } from "date-fns";

export const formatStudentName = (
  nachname: string,
  vorname: string,
  geburtsdatum?: string | null
): string => {
  if (geburtsdatum) {
    return `${nachname}, ${vorname} (${format(new Date(geburtsdatum), "dd.MM.yyyy")})`;
  }
  return `${nachname}, ${vorname}`;
};
