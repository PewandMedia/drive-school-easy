import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormData = { vorname: string; nachname: string };
type View = "list" | "form";

const InstructorManageDialog = ({ open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [view, setView] = useState<View>("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({ vorname: "", nachname: "" });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: instructors = [], isLoading } = useQuery({
    queryKey: ["instructors_manage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, vorname, nachname, aktiv")
        .order("nachname");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["instructors_manage"] });
    qc.invalidateQueries({ queryKey: ["instructors_active"] });
    qc.invalidateQueries({ queryKey: ["instructors-all"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await supabase
          .from("instructors")
          .update({ vorname: formData.vorname.trim(), nachname: formData.nachname.trim() })
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("instructors")
          .insert({ vorname: formData.vorname.trim(), nachname: formData.nachname.trim() });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      toast({ title: editId ? "Fahrlehrer aktualisiert" : "Fahrlehrer hinzugefügt" });
      goToList();
    },
    onError: (e: Error) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("instructors")
        .update({ aktiv: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Fahrlehrer deaktiviert" });
      setDeleteTarget(null);
    },
    onError: (e: Error) => {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("instructors")
        .update({ aktiv: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Fahrlehrer reaktiviert" });
    },
  });

  const goToList = () => {
    setView("list");
    setEditId(null);
    setFormData({ vorname: "", nachname: "" });
  };

  const startEdit = (i: { id: string; vorname: string; nachname: string }) => {
    setEditId(i.id);
    setFormData({ vorname: i.vorname, nachname: i.nachname });
    setView("form");
  };

  const startAdd = () => {
    setEditId(null);
    setFormData({ vorname: "", nachname: "" });
    setView("form");
  };

  const canSave = formData.vorname.trim() !== "" && formData.nachname.trim() !== "";

  const handleOpenChange = (v: boolean) => {
    if (!v) goToList();
    onOpenChange(v);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {view === "list" ? "Fahrlehrer verwalten" : editId ? "Fahrlehrer bearbeiten" : "Neuer Fahrlehrer"}
            </DialogTitle>
          </DialogHeader>

          {view === "list" ? (
            <div className="space-y-3">
              <Button size="sm" className="gap-2" onClick={startAdd}>
                <Plus className="h-4 w-4" /> Neuen Fahrlehrer hinzufügen
              </Button>

              {isLoading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Laden…</p>
              ) : instructors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Keine Fahrlehrer vorhanden.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instructors.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="font-medium">{i.nachname}, {i.vorname}</TableCell>
                        <TableCell className="text-center">
                          {i.aktiv ? (
                            <Badge variant="outline" className="border-green-500/30 text-green-500">Aktiv</Badge>
                          ) : (
                            <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">Inaktiv</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(i)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {i.aktiv ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget({ id: i.id, name: `${i.vorname} ${i.nachname}` })}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => reactivateMutation.mutate(i.id)}
                              >
                                Aktivieren
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Vorname *</Label>
                <Input
                  value={formData.vorname}
                  onChange={(e) => setFormData((f) => ({ ...f, vorname: e.target.value }))}
                  placeholder="Vorname"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nachname *</Label>
                <Input
                  value={formData.nachname}
                  onChange={(e) => setFormData((f) => ({ ...f, nachname: e.target.value }))}
                  placeholder="Nachname"
                />
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" size="sm" className="gap-1" onClick={goToList}>
                  <ArrowLeft className="h-4 w-4" /> Zurück
                </Button>
                <Button disabled={!canSave || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                  {saveMutation.isPending ? "Speichern…" : "Speichern"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fahrlehrer deaktivieren?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> wird als inaktiv markiert und erscheint nicht mehr in der Auswahl. Bestehende Prüfungsdaten bleiben erhalten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Deaktivieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InstructorManageDialog;
