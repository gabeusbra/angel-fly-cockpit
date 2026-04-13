import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FolderKanban, TicketCheck, CheckSquare, CreditCard, Clock } from "lucide-react";
import { filterMyRecords, safeList } from "@/lib/entity-helpers";
import StatCard from "../components/StatCard";
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

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome, {user?.full_name?.split(" ")[0] || "there"}</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's what's happening with your projects</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Projects" value={loading ? "..." : projects.filter(p => p.status === "active").length} icon={FolderKanban} color="blue" />
        <StatCard label="Open Tickets" value={loading ? "..." : openTickets} icon={TicketCheck} color="yellow" />
        <StatCard label="Pending Approvals" value={loading ? "..." : approvals.length} icon={CheckSquare} color="primary" />
        <StatCard
          label="Next Payment"
          value={nextPayment ? `R$${(nextPayment.amount || 0).toLocaleString()}` : "—"}
          subtitle={nextPayment?.due_date ? `Due ${new Date(nextPayment.due_date).toLocaleDateString()}` : "No pending"}
          icon={CreditCard}
          color="green"
        />
      </div>

      {/* Projects overview — simplified for client */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold">Your Projects</h3>
          <a href="/client/projects" className="text-xs text-primary font-medium hover:underline">View all →</a>
        </div>
        {projects.length > 0 ? (
          <div className="space-y-4">
            {projects.slice(0, 5).map(p => {
              const daysLeft = p.end_date ? Math.ceil((new Date(p.end_date) - new Date()) / 86400000) : null;
              return (
                <div key={p.id} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #FF4D35, #FFB74D)" }}>
                    <FolderKanban className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate">{p.name}</h4>
                    <p className="text-xs text-muted-foreground">{p.scope_description ? p.scope_description.slice(0, 60) + (p.scope_description.length > 60 ? "..." : "") : "No description"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge status={p.status} size="xs" />
                    {daysLeft !== null && (
                      <p className={`text-[10px] mt-1 ${daysLeft < 0 ? "text-red-600 font-medium" : daysLeft <= 7 ? "text-amber-600" : "text-muted-foreground"}`}>
                        <Clock className="w-3 h-3 inline mr-0.5" />
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">No projects yet</p>
        )}
      </div>
    </div>
  );
}
