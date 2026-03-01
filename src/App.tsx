import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

// Dashboard pages
import Dashboard from "./pages/dashboard/Dashboard";
import Fahrschueler from "./pages/dashboard/Fahrschueler";
import FahrschuelerDetail from "./pages/dashboard/FahrschuelerDetail";
import Leistungen from "./pages/dashboard/Leistungen";
import Fahrstunden from "./pages/dashboard/Fahrstunden";
import Theorie from "./pages/dashboard/Theorie";
import Schaltstunden from "./pages/dashboard/Schaltstunden";
import Pruefungen from "./pages/dashboard/Pruefungen";
import Zahlungen from "./pages/dashboard/Zahlungen";
import Abrechnung from "./pages/dashboard/Abrechnung";

import FahrlehrerStatistik from "./pages/dashboard/FahrlehrerStatistik";
import Tagesabrechnung from "./pages/dashboard/Tagesabrechnung";
import Auswertung from "./pages/dashboard/Auswertung";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
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
              <Route path="fahrstunden" element={<Fahrstunden />} />
              <Route path="theorie" element={<Theorie />} />
              <Route path="schaltstunden" element={<Schaltstunden />} />
              <Route path="pruefungen" element={<Pruefungen />} />
              <Route path="zahlungen" element={<Zahlungen />} />
              <Route path="abrechnung" element={<Abrechnung />} />
              
              <Route path="fahrlehrer-statistik" element={<FahrlehrerStatistik />} />
              <Route path="tagesabrechnung" element={<Tagesabrechnung />} />
              <Route path="auswertung" element={<Auswertung />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </ThemeProvider>
  </QueryClientProvider>
);

export default App;
