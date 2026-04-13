import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FolderKanban, TicketCheck, CheckSquare, CreditCard, Clock, ArrowRight, Sparkles } from "lucide-react";
import { filterMyRecords, safeList } from "@/lib/entity-helpers";
import StatusBadge from "../components/StatusBadge";

export default function ClientDashboard({ user }) {
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      filterMyRecords(base44.entities.Project, "client_id", user, "client_name"),
      filterMyRecords(base44.entities.Ticket, "client_id", user, "client_name"),
      safeList(base44.entities.Task),
      filterMyRecords(base44.entities.PaymentIncoming, "client_id", user, "client_name"),
    ]).then(([p, t, allTasks, pay]) => {
      setProjects(p);
      setTickets(t);
      const projectIds = new Set(p.map(pr => pr.id));
      setApprovals(allTasks.filter(tk => tk.status === "client_approval" && projectIds.has(tk.project_id)));
      setPayments(pay);
      setLoading(false);
    });
  }, [user]);

  const openTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress").length;
  const nextPayment = payments.filter(p => p.status === "pending").sort((a, b) => new Date(a.due_date || "2099") - new Date(b.due_date || "2099"))[0];
  const companyName = user?.company || "Your Company";
  const logo = user?.avatar_url;

  const stats = [
    { label: "Active Projects", value: projects.filter(p => p.status === "active").length, icon: FolderKanban, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Open Tickets", value: openTickets, icon: TicketCheck, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Pending Approvals", value: approvals.length, icon: CheckSquare, color: "text-primary", bg: "bg-orange-50" },
    { label: "Next Payment", value: nextPayment ? `R$${(nextPayment.amount || 0).toLocaleString()}` : "—", icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50",
      sub: nextPayment?.due_date ? `Due ${new Date(nextPayment.due_date).toLocaleDateString()}` : "No pending" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero welcome — branded */}
      <div className="relative overflow-hidden rounded-2xl p-8" style={{ background: "linear-gradient(135deg, hsl(8,100%,60%) 0%, hsl(20,90%,62%) 50%, hsl(35,95%,62%) 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {logo ? (
                <img src={logo} alt={companyName} className="w-12 h-12 rounded-xl object-contain bg-white/90 p-1 shadow-lg" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {companyName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-white/80 text-xs font-medium">{companyName}</p>
                <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back, {user?.full_name?.split(" ")[0] || "there"}</h1>
              </div>
            </div>
            <p className="text-white/70 text-sm">Here's an overview of your projects and deliverables</p>
          </div>
          <div className="hidden sm:block">
            <Sparkles className="w-16 h-16 text-white/20" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${loading ? "text-muted-foreground" : ""}`}>{loading ? "..." : s.value}</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">{s.label}</p>
            {s.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Projects list */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold">Your Projects</h3>
          <a href="/client/projects" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></a>
        </div>
        {projects.length > 0 ? (
          <div className="space-y-3">
            {projects.slice(0, 5).map((p, i) => {
              const daysLeft = p.end_date ? Math.ceil((new Date(p.end_date) - new Date()) / 86400000) : null;
              return (
                <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:shadow-md hover:shadow-black/5 transition-all duration-300 hover:-translate-y-0.5"
                  style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #FF4D35, #FFB74D)" }}>
                    <FolderKanban className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold truncate">{p.name}</h4>
                    {p.scope_description && <p className="text-xs text-muted-foreground line-clamp-1">{p.scope_description}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge status={p.status} size="xs" />
                    {daysLeft !== null && (
                      <div className={`flex items-center gap-1 text-[10px] mt-1 justify-end ${daysLeft < 0 ? "text-red-600 font-medium" : daysLeft <= 7 ? "text-amber-600" : "text-muted-foreground"}`}>
                        <Clock className="w-3 h-3" />
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <FolderKanban className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No projects yet</p>
          </div>
        )}
      </div>

      {/* Quick actions */}
      {(approvals.length > 0 || openTickets > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {approvals.length > 0 && (
            <a href="/client/approvals" className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 block">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-bold text-orange-700">{approvals.length} Deliverable{approvals.length > 1 ? "s" : ""} to Review</span>
              </div>
              <p className="text-xs text-orange-600/70">Click to review and approve pending deliverables</p>
            </a>
          )}
          {openTickets > 0 && (
            <a href="/client/tickets" className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 block">
              <div className="flex items-center gap-2 mb-2">
                <TicketCheck className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-700">{openTickets} Open Ticket{openTickets > 1 ? "s" : ""}</span>
              </div>
              <p className="text-xs text-blue-600/70">Track the status of your support requests</p>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
