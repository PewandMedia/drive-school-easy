import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  Users,
  ListChecks,
  Car,
  BookOpen,
  ToggleLeft,
  ClipboardCheck,
  UserCheck,
  CreditCard,
  Receipt,
  FileText,
  BarChart3,
  Shield,
} from "lucide-react";

const navItems = [
  { title: "Übersicht", url: "/dashboard", icon: LayoutDashboard, exact: true },
];

const schuelerItems = [
  { title: "Fahrschüler", url: "/dashboard/fahrschueler", icon: Users },
  { title: "Fahrstunden", url: "/dashboard/fahrstunden", icon: Car },
  { title: "Schaltstunden", url: "/dashboard/schaltstunden", icon: ToggleLeft },
  { title: "Theorie", url: "/dashboard/theorie", icon: BookOpen },
  { title: "Prüfungen", url: "/dashboard/pruefungen", icon: ClipboardCheck },
  { title: "Fahrlehrer-Statistik", url: "/dashboard/fahrlehrer-statistik", icon: UserCheck, adminOnly: true },
];

const verwaltungItems = [
  { title: "Leistungen", url: "/dashboard/leistungen", icon: ListChecks },
];

const finanzItems = [
  { title: "Zahlungen", url: "/dashboard/zahlungen", icon: CreditCard },
  { title: "Abrechnung", url: "/dashboard/abrechnung", icon: Receipt },
  { title: "Tagesabrechnung", url: "/dashboard/tagesabrechnung", icon: FileText, adminOnly: true },
  { title: "Auswertung", url: "/dashboard/auswertung", icon: BarChart3, adminOnly: true },
];

const adminItems = [
  { title: "Benutzerverwaltung", url: "/dashboard/benutzerverwaltung", icon: Shield },
];

export function AppSidebar() {
  const location = useLocation();
  const { isAdmin } = useAuth();

  const isActive = (url: string, exact = false) => {
    if (exact) return location.pathname === url;
    return location.pathname === url || location.pathname.startsWith(url + "/");
  };

  const filterItems = (items: typeof schuelerItems) =>
    items.filter((item) => !(item as any).adminOnly || isAdmin);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Car className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="truncate font-bold text-sidebar-foreground text-sm leading-tight">
            Fahrschul<span className="text-primary">verwaltung</span>
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {/* Main */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)} tooltip={item.title}>
                    <NavLink to={item.url} end={item.exact}>
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Schüler */}
        <SidebarGroup>
          <SidebarGroupLabel>Schüler & Ausbildung</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterItems(schuelerItems).map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Verwaltung */}
        <SidebarGroup>
          <SidebarGroupLabel>Verwaltung</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {verwaltungItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Finanzen */}
        <SidebarGroup>
          <SidebarGroupLabel>Finanzen</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterItems(finanzItems).map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <NavLink to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <p className="px-2 text-[10px] text-muted-foreground truncate">© 2026 Fahrschulverwaltung</p>
      </SidebarFooter>
    </Sidebar>
  );
}
