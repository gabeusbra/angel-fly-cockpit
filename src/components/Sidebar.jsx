import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FolderKanban, ListChecks, TicketCheck,
  DollarSign, Users, CheckSquare, CreditCard, ClipboardList,
  UserCircle, ChevronLeft, ChevronRight, LogOut, BarChart3
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const navByRole = {
  admin: [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Payment Approvals", path: "/admin/approvals", icon: CheckSquare },
    { label: "Client Payments", path: "/admin/payments", icon: CreditCard },
    { label: "All Projects", path: "/admin/projects", icon: FolderKanban },
    { label: "Reports", path: "/admin/reports", icon: BarChart3 },
  ],
  pm: [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Projects", path: "/pm/projects", icon: FolderKanban },
    { label: "Tickets", path: "/pm/tickets", icon: TicketCheck },
    { label: "Payment Requests", path: "/pm/payments", icon: DollarSign },
    { label: "Team", path: "/pm/team", icon: Users },
  ],
  professional: [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "My Tasks", path: "/pro/tasks", icon: ListChecks },
    { label: "My Projects", path: "/pro/projects", icon: FolderKanban },
    { label: "Payments", path: "/pro/payments", icon: DollarSign },
  ],
  client: [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "My Projects", path: "/client/projects", icon: FolderKanban },
    { label: "Approvals", path: "/client/approvals", icon: CheckSquare },
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

export default function Sidebar({ user, collapsed, onToggle }) {
  const location = useLocation();
  const role = user?.role || "client";
  const items = navByRole[role] || navByRole.client;

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
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
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
              {!collapsed && <span className="truncate">{item.label}</span>}
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