import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FolderKanban, AlertTriangle, TicketCheck, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import StatCard from "../components/StatCard";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

export default function PMDashboard({ user }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      let p = [], t = [], tk = [];
      try { p = await base44.entities.Project.list(); } catch { /* ignore */ }
      try { t = await base44.entities.Task.list(); } catch { /* ignore */ }
      try { tk = await base44.entities.Ticket.list(); } catch { /* ignore */ }
      setProjects(p); setTasks(t); setTickets(tk); setLoading(false);
    };
    load();
  }, []);

  const activeProjects = projects.filter(p => p.status === "active").length;
  const overdueTasks = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== "done").length;
  const openTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress").length;

  const workload = tasks.reduce((acc, t) => {
    if (t.assigned_to_name && t.status !== "done") acc[t.assigned_to_name] = (acc[t.assigned_to_name] || 0) + 1;
    return acc;
  }, {});
  const workloadData = Object.entries(workload).map(([name, tasks]) => ({ name, tasks }));

  const recentTasks = tasks.filter(t => t.status !== "done").slice(0, 6);

  return (
    <div className="space-y-8">
      <PageHeader title="PM Dashboard" subtitle="Operations command center" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Projects" value={loading ? "…" : activeProjects} icon={FolderKanban} color="blue" />
        <StatCard label="Overdue Tasks" value={loading ? "…" : overdueTasks} icon={AlertTriangle} color="red" />
        <StatCard label="Open Tickets" value={loading ? "…" : openTickets} icon={TicketCheck} color="yellow" />
        <StatCard label="Team Size" value={loading ? "…" : workloadData.length} icon={Users} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold mb-4">Team Workload</h3>
          {workloadData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="tasks" fill="#FF4D35" radius={[6, 6, 0, 0]} name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No tasks assigned yet</div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Active Tasks</h3>
            <a href="/pm/projects" className="text-xs text-primary font-medium hover:underline">View projects →</a>
          </div>
          {recentTasks.length > 0 ? (
            <div className="divide-y divide-border">
              {recentTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.assigned_to_name || "Unassigned"} · {t.project_name}</p>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <StatusBadge status={t.priority} size="xs" />
                    <StatusBadge status={t.status} size="xs" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No active tasks</p>
          )}
        </div>
      </div>
    </div>
  );
}