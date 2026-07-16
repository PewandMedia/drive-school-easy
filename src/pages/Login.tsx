import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Car,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Server,
  ArrowRight,
} from "lucide-react";

const Login = () => {
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to="/dashboard" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background">
      {/* Brand panel */}
      <aside
        className="relative hidden md:flex flex-col justify-between overflow-hidden bg-primary text-primary-foreground p-12"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 0% 100% / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      >
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-transparent via-transparent to-black/20" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground">
            <Car className="h-6 w-6 text-primary" />
          </div>
          <span className="text-sm font-bold tracking-[0.2em]">
            FAHRSCHULVERWALTUNG
          </span>
        </div>

        <div className="relative z-10 space-y-8 max-w-lg">
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight">
            Fahrschule verwalten,
            <br />
            neu gedacht.
          </h1>
          <p className="text-base text-primary-foreground/85 leading-relaxed">
            Die interne Software für Ihre Fahrschule. Entwickelt für den Alltag —
            Fahrschüler, Fahrstunden, Prüfungen und Zahlungen an einem Ort.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4 rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Daten geschützt</p>
                <p className="text-sm text-primary-foreground/75">
                  DSGVO-konform, verschlüsselt
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Hosting in Deutschland</p>
                <p className="text-sm text-primary-foreground/75">
                  Serverstandort DE
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-primary-foreground/70">
          © 2026 Fahrschulverwaltung
        </p>
      </aside>

      {/* Login form */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Willkommen zurück
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Bitte melden Sie sich an, um fortzufahren.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@fahrschule.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive rounded-lg bg-destructive/10 px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full h-11 group" disabled={loading}>
              {loading ? (
                "Anmelden..."
              ) : (
                <>
                  Anmelden
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Kein Zugang? Wenden Sie sich an die Fahrschulleitung.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
