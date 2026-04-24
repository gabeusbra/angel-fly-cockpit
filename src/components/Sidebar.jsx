import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, FolderKanban, ListChecks, TicketCheck,
  DollarSign, Users, CheckSquare, CreditCard, FileText, Building2, UserCircle,
  ChevronLeft, ChevronRight, LogOut, BarChart3, Moon, Sun,
} from "lucide-react";
import { api } from "@/api/client";

const navByRole = {
  admin: [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Payment Approvals", path: "/admin/approvals", icon: CheckSquare, badgeKey: "pendingApprovals" },
    { label: "Client Payments", path: "/admin/payments", icon: CreditCard, badgeKey: "overduePayments" },
    { label: "All Projects", path: "/admin/projects", icon: FolderKanban },
    { label: "Tickets", path: "/admin/tickets", icon: TicketCheck, badgeKey: "openTickets" },
    { label: "Clients", path: "/admin/clients", icon: Building2 },
    { label: "Team", path: "/admin/team", icon: Users },
    { label: "Quotes", path: "/admin/quotes", icon: FileText },
    { label: "Reports", path: "/admin/reports", icon: BarChart3 },
    { label: "Users", path: "/admin/users", icon: UserCircle },
  ],
  pm: [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Projects", path: "/pm/projects", icon: FolderKanban },
    { label: "Tickets", path: "/pm/tickets", icon: TicketCheck, badgeKey: "openTickets" },
    { label: "Clients", path: "/pm/clients", icon: Building2 },
    { label: "Quotes", path: "/pm/quotes", icon: FileText },
    { label: "Payment Requests", path: "/pm/payments", icon: DollarSign },
    { label: "Team", path: "/pm/team", icon: Users },
  ],
  professional: [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "My Tasks", path: "/pro/tasks", icon: ListChecks, badgeKey: "assignedTasks" },
    { label: "My Projects", path: "/pro/projects", icon: FolderKanban },
    { label: "Payments", path: "/pro/payments", icon: DollarSign },
  ],
  client: [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "My Projects", path: "/client/projects", icon: FolderKanban },
    { label: "Approvals", path: "/client/approvals", icon: CheckSquare, badgeKey: "clientApprovals" },
    { label: "Support Tickets", path: "/client/tickets", icon: TicketCheck },
    { label: "Payments", path: "/client/payments", icon: CreditCard },
  ],
};

const roleLabels = {
  admin: "Admin — Gabe",
  pm: "Project Manager",
  professional: "Professional",
  client: "Client",
};

function getInitials(name) {
  return String(name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Sidebar({ user, collapsed, onToggle, mobileMenuOpen, setMobileMenuOpen }) {
  const location = useLocation();
  const role = user?.role || "client";
  const items = navByRole[role] || navByRole.client;
  const [badges, setBadges] = useState({});
  const [dark, setDark] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("theme") === "dark" : false));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if (!user) return;
    const fetchBadges = async () => {
      try {
        const counts = {};
        if (role === "admin") {
          const [out, inc, tickets] = await Promise.all([
            api.entities.PaymentOutgoing.list(),
            api.entities.PaymentIncoming.list(),
            api.entities.Ticket.list(),
          ]);
          counts.pendingApprovals = out.filter((p) => p.status === "requested").length;
          counts.overduePayments = inc.filter((p) => p.status === "overdue").length;
          counts.openTickets = tickets.filter((t) => t.status === "open").length;
        } else if (role === "pm") {
          const tickets = await api.entities.Ticket.list();
          counts.openTickets = tickets.filter((t) => t.status === "open").length;
        } else if (role === "professional") {
          const tasks = await api.entities.Task.filter({ assigned_to: user.id });
          counts.assignedTasks = tasks.filter((t) => t.status === "assigned").length;
        } else if (role === "client") {
          const tasks = await api.entities.Task.filter({ status: "client_approval" });
          counts.clientApprovals = tasks.length;
        }
        setBadges(counts);
      } catch {
        // Badges are non-critical.
      }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    return () => clearInterval(interval);
  }, [user, role]);

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen z-50 flex flex-col transition-all duration-300 ${
          collapsed ? "md:w-[96px]" : "md:w-[272px]"
        } w-[272px] ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="h-full m-2 rounded-xl bg-sidebar/80 dark:bg-sidebar/85 border border-black/10 dark:border-white/10 glass shadow-xl shadow-black/5 overflow-hidden">
          <div className="flex items-center gap-3 px-4 h-16 shrink-0 border-b border-black/10 dark:border-white/10">
            <img
              src="/branding/logo-angelfly.png"
              alt="Angel Fly"
              className="w-9 h-9 rounded-md shrink-0 object-cover border border-black/10 dark:border-white/10"
            />
            {(!collapsed || mobileMenuOpen) && (
              <div className="overflow-hidden flex-1">
                <h1 className="text-sm font-bold text-sidebar-foreground truncate leading-tight">Angel Fly</h1>
                <p className="text-[11px] font-medium text-muted-foreground truncate">Marketing Cockpit</p>
              </div>
            )}
          </div>

          {(!collapsed || mobileMenuOpen) && (
            <div className="px-4 pt-4 pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{roleLabels[role]}</p>
            </div>
          )}

          <nav className="flex-1 px-3 space-y-2 overflow-y-auto">
            {items.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center gap-3 py-2 rounded-md text-[13px] font-semibold transition-all duration-200 relative ${
                    collapsed && !mobileMenuOpen ? "justify-center px-2" : "px-3"
                  } ${
                    isActive
                      ? "text-white shadow-md"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-[2px]"
                  }`}
                  style={isActive ? { background: "linear-gradient(135deg, #ff3932, #ff8348)" } : undefined}
                  onClick={() => {
                    if (window.innerWidth < 768) setMobileMenuOpen(false);
                  }}
                >
                  <span
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 ${
                      isActive
                        ? "bg-white/20"
                        : "bg-black/5 dark:bg-white/10 group-hover:rotate-[8deg] group-hover:scale-105 group-hover:bg-gradient-to-br group-hover:from-[#ff3932] group-hover:to-[#ff8348]"
                    }`}
                  >
                    <Icon className={`w-[16px] h-[16px] transition-colors ${isActive ? "text-white" : "text-muted-foreground group-hover:text-white"}`} />
                  </span>
                  {(!collapsed || mobileMenuOpen) && <span className="truncate flex-1">{item.label}</span>}
                  {badgeCount > 0 && (!collapsed || mobileMenuOpen) && (
                    <span className={`${collapsed ? "absolute top-1 right-1" : ""} min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white bg-red-500`}>
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 space-y-2 border-t border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2.5 px-1">
              <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-[10px] font-semibold text-sidebar-foreground bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10">
                {getInitials(user?.full_name)}
              </div>
              {(!collapsed || mobileMenuOpen) && (
                <div className="overflow-hidden flex-1 min-w-0">
                  <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.full_name || "User"}</p>
                  <p className="text-[10px] truncate text-muted-foreground">{user?.email || ""}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => api.auth.logout()}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
              >
                <LogOut className="w-3.5 h-3.5" />
                {(!collapsed || mobileMenuOpen) && "Sign out"}
              </button>
              <button
                onClick={() => setDark((d) => !d)}
                className="p-1.5 rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                title={dark ? "Light mode" : "Dark mode"}
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={onToggle}
                className="hidden md:inline-flex p-1.5 rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
