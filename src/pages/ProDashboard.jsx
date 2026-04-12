import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ListChecks, Clock, DollarSign, FolderKanban } from "lucide-react";
import StatCard from "../components/StatCard";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

export default function ProDashboard({ user }) {
  const [tasks, setTasks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      base44.entities.Task.filter({ assigned_to: user.id }),
      base44.entities.PaymentOutgoing.filter({ professional_id: user.id }),
    ]).then(([t, p]) => { setTasks(t); setPayments(p); setLoading(false); });
  }, [user]);

  const dueSoon = tasks.filter(t => {
    if (!t.deadline || t.status === "done") return false;
    const diff = (new Date(t.deadline) - new Date()) / 86400000;
    return diff <= 7 && diff >= 0;
  }).length;

  const earnedThisMonth = payments.filter(p => p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
  const pendingPay = payments.filter(p => p.status === "requested" || p.status === "approved").length;
  const activeProjects = [...new Set(tasks.filter(t => t.status !== "done").map(t => t.project_id))].length;

  const upcomingTasks = tasks
    .filter(t => t.status !== "done")
    .sort((a, b) => new Date(a.deadline || "2099") - new Date(b.deadline || "2099"))
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <PageHeader title="My Dashboard" subtitle={`Welcome back, ${user?.full_name || "Professional"}`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Due This Week" value={loading ? "…" : dueSoon} icon={Clock} color="yellow" />
        <StatCard label="Earned Total" value={loading ? "…" : `R$${earnedThisMonth.toLocaleString()}`} icon={DollarSign} color="green" />
        <StatCard label="Pending Payments" value={loading ? "…" : pendingPay} icon={DollarSign} color="blue" />
        <StatCard label="Active Projects" value={loading ? "…" : activeProjects} icon={FolderKanban} color="primary" />
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Upcoming Tasks</h3>
          <a href="/pro/tasks" className="text-xs text-primary font-medium hover:underline">View all →</a>
        </div>
        {upcomingTasks.length > 0 ? (
          <div className="divide-y divide-border">
            {upcomingTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.project_name}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <StatusBadge status={t.priority} size="xs" />
                  {t.deadline && <span className="text-xs text-muted-foreground">{new Date(t.deadline).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">No tasks assigned yet</p>
        )}
      </div>
    </div>
  );
}