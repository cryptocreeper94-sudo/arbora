import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard, Users, Briefcase, FileText, Calculator, CalendarDays,
  HardHat, Package, Wrench, ChevronLeft, ChevronRight, LogOut, TreePine, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import arboraIcon from "@assets/arbora-icon.png";

const arboraNav = [
  { path: "/arbora", label: "Dashboard", icon: LayoutDashboard },
  { path: "/arbora/clients", label: "Clients", icon: Users },
  { path: "/arbora/deals", label: "Pipeline", icon: Briefcase },
  { path: "/arbora/jobs", label: "Jobs", icon: TreePine },
  { path: "/arbora/estimates", label: "Estimates", icon: Calculator },
  { path: "/arbora/invoices", label: "Invoices", icon: FileText },
  { path: "/arbora/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/arbora/crew", label: "Crew", icon: HardHat },
  { path: "/arbora/inventory", label: "Inventory", icon: Package },
  { path: "/arbora/equipment", label: "Equipment", icon: Wrench },
];

const mobileArboraNav = [
  { path: "/arbora", label: "Home", icon: LayoutDashboard },
  { path: "/arbora/clients", label: "Clients", icon: Users },
  { path: "/arbora/jobs", label: "Jobs", icon: TreePine },
  { path: "/arbora/deals", label: "Pipeline", icon: Briefcase },
  { path: "/arbora/invoices", label: "Invoices", icon: FileText },
];

export function ArboraLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "#0a0f1a" }}>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r transition-all duration-300 lg:relative",
          collapsed ? "w-[68px]" : "w-[240px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ background: "#0f172a", borderColor: "rgba(194,112,62,0.2)" }}
      >
        <div className={cn("flex items-center gap-3 p-4 border-b", !collapsed && "justify-between")} style={{ borderColor: "rgba(194,112,62,0.2)" }}>
          <Link href="/arbora">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src={arboraIcon} alt="Arbora" className="w-8 h-8 rounded-lg flex-shrink-0" />
              {!collapsed && (
                <span className="text-lg font-bold tracking-tight" style={{ color: "#c2703e" }}>Arbora</span>
              )}
            </div>
          </Link>
          {!collapsed && (
            <Button size="icon" variant="ghost" className="hidden lg:flex w-7 h-7" onClick={() => setCollapsed(true)} style={{ color: "#94a3b8" }}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          {collapsed && (
            <Button size="icon" variant="ghost" className="hidden lg:flex w-7 h-7 mx-auto mt-1" onClick={() => setCollapsed(false)} style={{ color: "#94a3b8" }}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="lg:hidden w-7 h-7" onClick={() => setMobileOpen(false)} style={{ color: "#94a3b8" }}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {arboraNav.map((item) => {
            const isActive = location === item.path || (item.path !== "/arbora" && location.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path}>
                <div
                  data-testid={`arbora-nav-${item.label.toLowerCase()}`}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                    isActive ? "text-white" : "hover:bg-white/5",
                    !collapsed ? "" : "justify-center px-2"
                  )}
                  style={{
                    color: isActive ? "#c2703e" : "#94a3b8",
                    background: isActive ? "rgba(194,112,62,0.12)" : undefined,
                  }}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" style={{ color: isActive ? "#c2703e" : "#64748b" }} />
                  {!collapsed && <span>{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: "rgba(194,112,62,0.2)" }}>
          <Link href="/">
            <div
              className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:bg-white/5", !collapsed ? "" : "justify-center px-2")}
              style={{ color: "#64748b" }}
              data-testid="arbora-nav-back-verdara"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Back to Verdara</span>}
            </div>
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 border-b lg:hidden" style={{ background: "#0f172a", borderColor: "rgba(194,112,62,0.2)" }}>
          <Button size="icon" variant="ghost" onClick={() => setMobileOpen(true)} data-testid="arbora-mobile-menu">
            <Menu className="w-5 h-5" style={{ color: "#94a3b8" }} />
          </Button>
          <img src={arboraIcon} alt="Arbora" className="w-7 h-7 rounded-lg" />
          <span className="text-base font-bold" style={{ color: "#c2703e" }}>Arbora</span>
        </header>
        <div className="flex-1 overflow-y-auto" style={{ background: "#0a0f1a" }}>
          {children}
        </div>
        <nav className="flex items-center justify-around border-t py-2 safe-area-bottom lg:hidden" style={{ background: "#0f172a", borderColor: "rgba(194,112,62,0.2)" }}>
          {mobileArboraNav.map((item) => {
            const isActive = location === item.path || (item.path !== "/arbora" && location.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path}>
                <div className="flex flex-col items-center gap-1 px-3 py-1 cursor-pointer" data-testid={`arbora-mobile-nav-${item.label.toLowerCase()}`}>
                  <item.icon className="w-5 h-5" style={{ color: isActive ? "#c2703e" : "#64748b" }} />
                  <span className="text-[10px] font-medium" style={{ color: isActive ? "#c2703e" : "#64748b" }}>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
