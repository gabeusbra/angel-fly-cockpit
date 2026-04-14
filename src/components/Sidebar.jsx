import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, FolderKanban, ListChecks, TicketCheck,
  DollarSign, Users, CheckSquare, CreditCard, FileText, Building2,
  ChevronLeft, ChevronRight, LogOut, BarChart3,
  Moon, Sun
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const navByRole = {
  admin: [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Payment Approvals", path: "/admin/approvals", icon: CheckSquare, badgeKey: "pendingApprovals" },
    { label: "Client Payments", path: "/admin/payments", icon: CreditCard, badgeKey: "overduePayments" },
    { label: "All Projects", path: "/admin/projects", icon: FolderKanban },
    { label: "Tickets", path: "/admin/tickets", icon: TicketCheck, badgeKey: "openTickets" },
    { label: "Clients", path: "/admin/clients", icon: Building2 },
    { label: "Quotes", path: "/admin/quotes", icon: FileText },
    { label: "Reports", path: "/admin/reports", icon: BarChart3 },
    { label: "Users", path: "/admin/users", icon: Users },
  ],
  pm: [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Projects", path: "/pm/projects", icon: FolderKanban },
    { label: "Tickets", path: "/pm/tickets", icon: TicketCheck, badgeKey: "openTickets" },
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
  admin: "Admin \u2014 Gabe",
  pm: "Project Manager",
  professional: "Professional",
  client: "Client",
};

export default function Sidebar({ user, collapsed, onToggle }) {
  const location = useLocation();
  const role = user?.role || "client";
  const items = navByRole[role] || navByRole.client;
  const [badges, setBadges] = useState({});

  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  // Fetch notification counts
  useEffect(() => {
    if (!user) return;
    const fetchBadges = async () => {
      try {
        const counts = {};
        if (role === "admin") {
          const [out, inc, tickets] = await Promise.all([
            base44.entities.PaymentOutgoing.list(),
            base44.entities.PaymentIncoming.list(),
            base44.entities.Ticket.list(),
          ]);
          counts.pendingApprovals = out.filter(p => p.status === "requested").length;
          counts.overduePayments = inc.filter(p => p.status === "overdue").length;
          counts.openTickets = tickets.filter(t => t.status === "open").length;
        } else if (role === "pm") {
          const tickets = await base44.entities.Ticket.list();
          counts.openTickets = tickets.filter(t => t.status === "open").length;
        } else if (role === "professional") {
          const tasks = await base44.entities.Task.filter({ assigned_to: user.id });
          counts.assignedTasks = tasks.filter(t => t.status === "assigned").length;
        } else if (role === "client") {
          const tasks = await base44.entities.Task.filter({ status: "client_approval" });
          counts.clientApprovals = tasks.length;
        }
        setBadges(counts);
      } catch {
        // Silently fail — badges are non-critical
      }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    return () => clearInterval(interval);
  }, [user, role]);

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 flex flex-col transition-all duration-300 ${collapsed ? "w-[68px]" : "w-[260px]"}`}
      style={{ backgroundColor: "hsl(228, 25%, 10%)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0" style={{ borderBottom: "1px solid hsl(228, 20%, 16%)" }}>
        <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-extrabold text-white text-xs tracking-tight brand-gradient shadow-lg shadow-primary/20">
          AF
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-extrabold text-white truncate leading-tight tracking-tight">Angel Fly</h1>
            <p className="text-[10px] font-medium truncate" style={{ color: "hsl(220,10%,50%)" }}>Marketing Cockpit</p>
          </div>
        )}
      </div>

      {/* Role label */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: "hsl(220,10%,40%)" }}>{roleLabels[role]}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 relative ${
                isActive
                  ? "text-white"
                  : "hover:text-white"
              }`}
              style={isActive
                ? { background: "linear-gradient(135deg, hsl(8,100%,60%), hsl(20,90%,62%))", boxShadow: "0 4px 16px rgba(255,77,53,0.35)" }
                : { color: "hsl(220,10%,55%)", backgroundColor: "transparent" }
              }
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = "hsl(228,20%,15%)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "" : "opacity-70"}`} />
              {!collapsed && <span className="truncate flex-1">{item.label}</span>}
              {badgeCount > 0 && (
                <span className={`${collapsed ? "absolute top-1 right-1" : ""} min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white bg-red-500 shadow-sm shadow-red-500/30`}>
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-2" style={{ borderTop: "1px solid hsl(228, 20%, 16%)" }}>
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-bold text-white" style={{ backgroundColor: "hsl(228,20%,18%)" }}>
            {(user?.full_name || "U").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || "User"}</p>
              <p className="text-[10px] truncate" style={{ color: "hsl(220,10%,45%)" }}>{user?.email || ""}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1"
            style={{ color: "hsl(220,10%,45%)" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "hsl(228,20%,15%)"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "hsl(220,10%,45%)"; }}
          >
            <LogOut className="w-3.5 h-3.5" />
            {!collapsed && "Sign out"}
          </button>
          <button
            onClick={() => setDark(d => !d)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "hsl(220,10%,45%)" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "hsl(228,20%,15%)"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "hsl(220,10%,45%)"; }}
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: "hsl(240,5%,50%)" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "hsl(240,15%,18%)"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "hsl(240,5%,50%)"; }}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
