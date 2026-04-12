import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FolderKanban, TicketCheck, CheckSquare, CreditCard } from "lucide-react";
import StatCard from "../components/StatCard";
import PageHeader from "../components/PageHeader";
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
      base44.entities.Project.filter({ client_id: user.id }),
      base44.entities.Ticket.filter({ client_id: user.id }),
      base44.entities.Task.filter({ status: "client_approval" }),
      base44.entities.PaymentIncoming.filter({ client_id: user.id }),
    ]).then(([p, t, a, pay]) => { setProjects(p); setTickets(t); setApprovals(a); setPayments(pay); setLoading(false); });
  }, [user]);

  const openTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress").length;
  const nextPayment = payments.filter(p => p.status === "pending").sort((a, b) => new Date(a.due_date || "2099") - new Date(b.due_date || "2099"))[0];

  return (
    <div className="space-y-8">
      <PageHeader title="My Dashboard" subtitle={`Welcome, ${user?.full_name || "Client"}`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Projects" value={loading ? "…" : projects.filter(p => p.status === "active").length} icon={FolderKanban} color="blue" />
        <StatCard label="Open Tickets" value={loading ? "…" : openTickets} icon={TicketCheck} color="yellow" />
        <StatCard label="Pending Approvals" value={loading ? "…" : approvals.length} icon={CheckSquare} color="primary" />
        <StatCard
          label="Next Payment"
          value={nextPayment ? `R$${(nextPayment.amount || 0).toLocaleString()}` : "—"}
          subtitle={nextPayment?.due_date ? `Due ${new Date(nextPayment.due_date).toLocaleDateString()}` : "No pending"}
          icon={CreditCard}
          color="green"
        />
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">My Projects</h3>
          <a href="/client/projects" className="text-xs text-primary font-medium hover:underline">View all →</a>
        </div>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.slice(0, 4).map((p) => (
              <div key={p.id} className="border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold truncate">{p.name}</h4>
                  <StatusBadge status={p.status} size="xs" />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{p.scope_description || "No description"}</p>
                {p.end_date && <p className="text-xs text-muted-foreground mt-2">Deadline: {new Date(p.end_date).toLocaleDateString()}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">No projects yet</p>
        )}
      </div>
    </div>
  );
}