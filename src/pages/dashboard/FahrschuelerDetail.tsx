import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const FahrschuelerDetail = () => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/fahrschueler"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fahrschüler Details</h1>
          <p className="text-muted-foreground text-sm">ID: {id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-1">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Schüler #{id}</p>
              <p className="text-sm text-muted-foreground">Klasse B</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {[["E-Mail", "–"], ["Telefon", "–"], ["Geburtsdatum", "–"], ["Angemeldet", "–"]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{k}</span>
                <span className="text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          {["Fahrstunden", "Theorie", "Prüfungen", "Zahlungen"].map((section) => (
            <div key={section} className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold text-foreground mb-3">{section}</h2>
              <p className="text-sm text-muted-foreground">Noch keine Einträge vorhanden.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FahrschuelerDetail;
