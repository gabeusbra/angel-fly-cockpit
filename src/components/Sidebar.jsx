import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, FolderKanban, ListChecks, TicketCheck,
  DollarSign, Users, CheckSquare, CreditCard,
  UserCircle, ChevronLeft, ChevronRight, LogOut, BarChart3,
  Moon, Sun
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const navByRole = {
  admin: [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Payment Approvals", path: "/admin/approvals", icon: CheckSquare, badgeKey: "pendingApprovals" },
    { label: "Client Payments", path: "/admin/payments", icon: CreditCard, badgeKey: "overduePayments" },
    { label: "All Projects", path: "/admin/projects", icon: FolderKanban },
    { label: "Reports", path: "/admin/reports", icon: BarChart3 },
    { label: "Users", path: "/admin/users", icon: Users },
  ],
  pm: [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Projects", path: "/pm/projects", icon: FolderKanban },
    { label: "Tickets", path: "/pm/tickets", icon: TicketCheck, badgeKey: "openTickets" },
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
          const [out, inc] = await Promise.all([
            base44.entities.PaymentOutgoing.list(),
            base44.entities.PaymentIncoming.list(),
          ]);
          counts.pendingApprovals = out.filter(p => p.status === "requested").length;
          counts.overduePayments = inc.filter(p => p.status === "overdue").length;
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
      className={`fixed top-0 left-0 h-screen z-40 flex flex-col transition-all duration-300 ${collapsed ? "w-[68px]" : "w-[240px]"}`}
      style={{ backgroundColor: "hsl(240, 22%, 11%)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0" style={{ borderBottom: "1px solid hsl(240, 15%, 20%)" }}>
        <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-bold text-white text-sm"
          style={{ background: "linear-gradient(135deg, hsl(8,100%,60%), hsl(35,95%,65%))" }}>
          AF
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white truncate leading-tight">Angel Fly</h1>
            <p className="text-[10px] truncate" style={{ color: "hsl(240,5%,55%)" }}>Cockpit</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative ${
                isActive
                  ? "text-white shadow-lg"
                  : "hover:text-white"
              }`}
              style={isActive
                ? { backgroundColor: "hsl(8, 100%, 60%)", boxShadow: "0 4px 12px rgba(255,77,53,0.3)" }
                : { color: "hsl(240,5%,65%)", backgroundColor: "transparent" }
              }
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = "hsl(240,15%,18%)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate flex-1">{item.label}</span>}
              {badgeCount > 0 && (
                <span className={`${collapsed ? "absolute top-1 right-1" : ""} min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white bg-red-500`}>
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-2" style={{ borderTop: "1px solid hsl(240, 15%, 20%)" }}>
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "hsl(240,15%,20%)" }}>
            <UserCircle className="w-4 h-4" style={{ color: "hsl(240,5%,55%)" }} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.full_name || "User"}</p>
              <p className="text-[10px] truncate" style={{ color: "hsl(240,5%,50%)" }}>{roleLabels[role]}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors flex-1"
            style={{ color: "hsl(240,5%,50%)" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "hsl(240,15%,18%)"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "hsl(240,5%,50%)"; }}
          >
            <LogOut className="w-3.5 h-3.5" />
            {!collapsed && "Sign out"}
          </button>
          <button
            onClick={() => setDark(d => !d)}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: "hsl(240,5%,50%)" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "hsl(240,15%,18%)"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "hsl(240,5%,50%)"; }}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
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
