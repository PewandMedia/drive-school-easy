import { useState } from "react";
import { Shield, Plus, RotateCcw, History, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import InstructorManageDialog from "@/components/InstructorManageDialog";

type Profile = {
  id: string;
  email: string;
  display_name: string;
  aktiv: boolean;
  last_sign_in: string | null;
  created_at: string;
};

type UserRole = {
  user_id: string;
  role: string;
};

type ActivityLog = {
  id: string;
  action: string;
  entity_type: string;
  details: string | null;
  created_at: string;
};

const entityTypeLabels: Record<string, string> = {
  driving_lessons: "Fahrstunde",
  theory_sessions: "Theorie",
  exams: "Prüfung",
  payments: "Zahlung",
  services: "Leistung",
};

const actionLabels: Record<string, string> = {
  erstellt: "Erstellt",
  bearbeitet: "Bearbeitet",
  geloescht: "Gelöscht",
  INSERT: "Erstellt",
  UPDATE: "Bearbeitet",
  DELETE: "Gelöscht",
};

const Benutzerverwaltung = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState({ email: "", password: "", display_name: "", role: "sekretaerin" });
  const [historieOpen, setHistorieOpen] = useState(false);
  const [historieUserId, setHistorieUserId] = useState("");
  const [historieUserName, setHistorieUserName] = useState("");
  const [fahrlehrerOpen, setFahrlehrerOpen] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").neq("email", "media@gmail.com").order("created_at") as any;
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["admin_user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role") as any;
      if (error) throw error;
      return data as UserRole[];
    },
  });

  const { data: userLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["user_activity_log", historieUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("id, action, entity_type, details, created_at")
        .eq("user_id", historieUserId)
        .order("created_at", { ascending: false })
        .limit(200) as any;
      if (error) throw error;
      return data as ActivityLog[];
    },
    enabled: !!historieUserId && historieOpen,
  });

  const roleMap = Object.fromEntries(roles.map((r) => [r.user_id, r.role]));

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "create_user", ...form },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_profiles"] });
      qc.invalidateQueries({ queryKey: ["admin_user_roles"] });
      setCreateOpen(false);
      setForm({ email: "", password: "", display_name: "", role: "sekretaerin" });
      toast({ title: "Account erstellt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "reset_password", user_id: resetUserId, new_password: newPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      setResetOpen(false);
      setNewPassword("");
      toast({ title: "Passwort zurückgesetzt" });
    },
    onError: (e: Error) => toast({ title: "Fehler", description: e.message, variant: "destructive" }),
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      await (supabase.from("user_roles").delete().eq("user_id", userId) as any);
      const { error } = await (supabase.from("user_roles").insert({ user_id: userId, role: newRole } as any) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_user_roles"] });
      toast({ title: "Rolle geändert" });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Benutzerverwaltung"
        description="Accounts und Rollen verwalten"
        icon={Shield}
        action={
          <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />Account erstellen
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead className="w-32">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <div className="h-4 w-48 bg-secondary/60 rounded animate-pulse mx-auto" />
                </TableCell>
              </TableRow>
            ) : profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  Keine Accounts vorhanden
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.display_name || "–"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.email}</TableCell>
                  <TableCell>
                    <Select
                      value={roleMap[p.id] || "sekretaerin"}
                      onValueChange={(v) => changeRoleMutation.mutate({ userId: p.id, newRole: v })}
                    >
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="sekretaerin">Sekretärin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Passwort zurücksetzen"
                        onClick={() => { setResetUserId(p.id); setResetOpen(true); }}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Historie anzeigen"
                        onClick={() => {
                          setHistorieUserId(p.id);
                          setHistorieUserName(p.display_name || p.email || "Benutzer");
                          setHistorieOpen(true);
                        }}
                      >
                        <History className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Neuen Account erstellen</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Anzeigename</Label>
              <Input value={form.display_name} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>E-Mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Passwort</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={6} />
            </div>
            <div className="space-y-1.5">
              <Label>Rolle</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sekretaerin">Sekretärin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Abbrechen</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Erstelle…" : "Erstellen"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Passwort zurücksetzen</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); resetMutation.mutate(); }} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Neues Passwort</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>Abbrechen</Button>
              <Button type="submit" disabled={resetMutation.isPending}>
                {resetMutation.isPending ? "Setze zurück…" : "Zurücksetzen"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Historie Dialog */}
      <Dialog open={historieOpen} onOpenChange={setHistorieOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Historie von {historieUserName}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] mt-2">
            {logsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-secondary/60 rounded animate-pulse" />
                ))}
              </div>
            ) : userLogs.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                Keine Aktivitäten vorhanden
              </p>
            ) : (
              <div className="space-y-2">
                {userLogs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {actionLabels[log.action] || log.action}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {format(new Date(log.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">
                      {entityTypeLabels[log.entity_type] || log.entity_type}
                    </p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Benutzerverwaltung;
