import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const FahrlehrerStatistik = () => {
  const { data: instructors, isLoading: loadingInstructors } = useQuery({
    queryKey: ["instructors-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, vorname, nachname")
        .order("nachname");
      if (error) throw error;
      return data;
    },
  });

  const { data: exams, isLoading: loadingExams } = useQuery({
    queryKey: ["exams-praxis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("instructor_id, bestanden")
        .eq("typ", "praxis")
        .not("instructor_id", "is", null);
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    if (!instructors || !exams) return [];

    const grouped: Record<string, { bestanden: number; nichtBestanden: number }> = {};
    for (const e of exams) {
      const id = e.instructor_id!;
      if (!grouped[id]) grouped[id] = { bestanden: 0, nichtBestanden: 0 };
      if (e.bestanden) grouped[id].bestanden++;
      else grouped[id].nichtBestanden++;
    }

    return instructors
      .filter((i) => grouped[i.id])
      .map((i) => {
        const g = grouped[i.id];
        const gesamt = g.bestanden + g.nichtBestanden;
        const quote = gesamt > 0 ? Math.round((g.nichtBestanden / gesamt) * 100) : 0;
        return {
          id: i.id,
          name: `${i.nachname}, ${i.vorname}`,
          gesamt,
          bestanden: g.bestanden,
          nichtBestanden: g.nichtBestanden,
          durchfallquote: quote,
        };
      })
      .sort((a, b) => b.gesamt - a.gesamt);
  }, [instructors, exams]);

  const isLoading = loadingInstructors || loadingExams;

  const barColor = (q: number) =>
    q <= 20 ? "bg-green-500" : q <= 50 ? "bg-yellow-500" : "bg-destructive";

  return (
    <div className="space-y-6">
      <PageHeader title="Fahrlehrer-Statistik" icon={UserCheck} description="Durchfallquote pro Fahrlehrer (nur Fahrprüfungen)" />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fahrlehrer</TableHead>
                <TableHead className="text-center">Gesamt</TableHead>
                <TableHead className="text-center">Bestanden</TableHead>
                <TableHead className="text-center">Nicht bestanden</TableHead>
                <TableHead className="text-center">Durchfallquote</TableHead>
                <TableHead className="w-[140px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : stats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Keine Fahrprüfungsdaten vorhanden.
                  </TableCell>
                </TableRow>
              ) : (
                stats.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-center">{s.gesamt}</TableCell>
                    <TableCell className="text-center">{s.bestanden}</TableCell>
                    <TableCell className="text-center">{s.nichtBestanden}</TableCell>
                    <TableCell className="text-center">{s.durchfallquote} %</TableCell>
                    <TableCell>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn("h-full rounded-full transition-all", barColor(s.durchfallquote))}
                          style={{ width: `${s.durchfallquote}%` }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FahrlehrerStatistik;
