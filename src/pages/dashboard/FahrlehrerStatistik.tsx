import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { UserCheck, ClipboardCheck, TrendingDown, Trophy, AlertTriangle, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import InstructorManageDialog from "@/components/InstructorManageDialog";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer, Tooltip,
} from "recharts";

const barColor = (q: number) =>
  q <= 20 ? "hsl(142, 71%, 45%)" : q <= 40 ? "hsl(48, 96%, 53%)" : "hsl(0, 84%, 60%)";

const barColorClass = (q: number) =>
  q <= 20 ? "bg-green-500" : q <= 40 ? "bg-yellow-500" : "bg-destructive";

const FahrlehrerStatistik = () => {
  const [instructorDialogOpen, setInstructorDialogOpen] = useState(false);
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
        .select("instructor_id, status")
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
      if (e.status !== "bestanden" && e.status !== "nicht_bestanden") continue;
      const id = e.instructor_id!;
      if (!grouped[id]) grouped[id] = { bestanden: 0, nichtBestanden: 0 };
      if (e.status === "bestanden") grouped[id].bestanden++;
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
      .sort((a, b) => b.durchfallquote - a.durchfallquote);
  }, [instructors, exams]);

  const kpis = useMemo(() => {
    if (!stats.length) return null;
    const gesamtPruefungen = stats.reduce((s, x) => s + x.gesamt, 0);
    const durchschnittQuote = Math.round(stats.reduce((s, x) => s + x.durchfallquote, 0) / stats.length);
    const bester = [...stats].sort((a, b) => a.durchfallquote - b.durchfallquote)[0];
    const schlechtester = stats[0]; // already sorted desc
    return { gesamtPruefungen, durchschnittQuote, bester, schlechtester };
  }, [stats]);

  const isLoading = loadingInstructors || loadingExams;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Fahrlehrer-Statistik"
        icon={UserCheck}
        description="Durchfallquote pro Fahrlehrer (nur Fahrprüfungen)"
        action={
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setInstructorDialogOpen(true)}>
            <Settings className="h-4 w-4" /> Fahrlehrer verwalten
          </Button>
        }
      />

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <ClipboardCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gesamt Fahrprüfungen</p>
                <p className="text-2xl font-bold">{kpis.gesamtPruefungen}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500/15">
                <TrendingDown className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ø Durchfallquote</p>
                <p className="text-2xl font-bold">{kpis.durchschnittQuote} %</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/15">
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bester Fahrlehrer</p>
                <p className="text-sm font-bold truncate">{kpis.bester.name}</p>
                <p className="text-xs text-green-600">{kpis.bester.durchfallquote} %</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/15">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Höchste Durchfallquote</p>
                <p className="text-sm font-bold truncate">{kpis.schlechtester.name}</p>
                <p className="text-xs text-destructive">{kpis.schlechtester.durchfallquote} %</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart + Table */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <Card>
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-sm font-medium">Durchfallquote pro Fahrlehrer</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : stats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Keine Daten vorhanden.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, stats.length * 40)}>
                <BarChart data={stats} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={12} />
                  <YAxis type="category" dataKey="name" width={120} fontSize={12} tick={{ fill: "hsl(var(--foreground))" }} />
                  <Tooltip
                    formatter={(value: number) => [`${value} %`, "Durchfallquote"]}
                    contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="durchfallquote" radius={[0, 4, 4, 0]} barSize={20}>
                    {stats.map((s) => (
                      <Cell key={s.id} fill={barColor(s.durchfallquote)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fahrlehrer</TableHead>
                  <TableHead className="text-center">Gesamt</TableHead>
                  <TableHead className="text-center">Bestanden</TableHead>
                  <TableHead className="text-center">Nicht best.</TableHead>
                  <TableHead className="w-[200px]">Durchfallquote</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : stats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                            <div
                              className={cn("h-full rounded-full transition-all", barColorClass(s.durchfallquote))}
                              style={{ width: `${s.durchfallquote}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-10 text-right">{s.durchfallquote} %</span>
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
      <InstructorManageDialog open={instructorDialogOpen} onOpenChange={setInstructorDialogOpen} />
    </div>
  );
};

export default FahrlehrerStatistik;
