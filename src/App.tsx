import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Login from "./pages/Login";

const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const Fahrschueler = lazy(() => import("./pages/dashboard/Fahrschueler"));
const FahrschuelerDetail = lazy(() => import("./pages/dashboard/FahrschuelerDetail"));
const Leistungen = lazy(() => import("./pages/dashboard/Leistungen"));
const Schnellerfassung = lazy(() => import("./pages/dashboard/Schnellerfassung"));
const Fahrstunden = lazy(() => import("./pages/dashboard/Fahrstunden"));
const Theorie = lazy(() => import("./pages/dashboard/Theorie"));
const Schaltstunden = lazy(() => import("./pages/dashboard/Schaltstunden"));
const Pruefungen = lazy(() => import("./pages/dashboard/Pruefungen"));
const Zahlungen = lazy(() => import("./pages/dashboard/Zahlungen"));
const Abrechnung = lazy(() => import("./pages/dashboard/Abrechnung"));
const FahrlehrerStatistik = lazy(() => import("./pages/dashboard/FahrlehrerStatistik"));
const Tagesabrechnung = lazy(() => import("./pages/dashboard/Tagesabrechnung"));
const Auswertung = lazy(() => import("./pages/dashboard/Auswertung"));
const Benutzerverwaltung = lazy(() => import("./pages/dashboard/Benutzerverwaltung"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="flex h-full w-full items-center justify-center p-12">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />

              {/* Protected Dashboard Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="fahrschueler" element={<Fahrschueler />} />
                <Route path="fahrschueler/:id" element={<FahrschuelerDetail />} />
                <Route path="leistungen" element={<Leistungen />} />
                <Route path="schnellerfassung" element={<Schnellerfassung />} />
                <Route path="fahrstunden" element={<Fahrstunden />} />
                <Route path="theorie" element={<Theorie />} />
                <Route path="schaltstunden" element={<Schaltstunden />} />
                <Route path="pruefungen" element={<Pruefungen />} />
                <Route path="zahlungen" element={<Zahlungen />} />
                <Route path="abrechnung" element={<Abrechnung />} />

                {/* Admin-only routes */}
                <Route path="fahrlehrer-statistik" element={<ProtectedRoute requiredRole="admin"><FahrlehrerStatistik /></ProtectedRoute>} />
                <Route path="tagesabrechnung" element={<Tagesabrechnung />} />
                <Route path="auswertung" element={<ProtectedRoute requiredRole="admin"><Auswertung /></ProtectedRoute>} />
                <Route path="benutzerverwaltung" element={<ProtectedRoute requiredRole="admin"><Benutzerverwaltung /></ProtectedRoute>} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </ThemeProvider>
  </QueryClientProvider>
);

export default App;
