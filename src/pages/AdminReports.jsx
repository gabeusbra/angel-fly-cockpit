import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

const COLORS = ["#FF4D35", "#FF8A65", "#FFB74D", "#4DB6AC", "#64B5F6", "#BA68C8"];

export default function AdminReports() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drillClient, setDrillClient] = useState(null);
  const [drillProject, setDrillProject] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Project.list(),
      base44.entities.Task.list(),
      base44.entities.PaymentIncoming.list(),
      base44.entities.PaymentOutgoing.list(),
      base44.entities.User.list(),
    ]).then(([p, t, inc, out, u]) => {
      setProjects(p); setTasks(t); setIncoming(inc); setOutgoing(out); setUsers(u); setLoading(false);
    });
  }, []);

  // --- Client profitability ---
  const clientData = () => {
    const map = {};
    projects.forEach(p => {
      const name = p.client_name || "Unknown";
      if (!map[name]) map[name] = { name, revenue: 0, costs: 0, projects: 0, budget: 0 };
      map[name].projects += 1;
      map[name].budget += p.total_budget || 0;
    });
    incoming.filter(p => p.status === "paid").forEach(p => {
      const name = p.client_name || "Unknown";
      if (map[name]) map[name].revenue += p.amount || 0;
    });
    outgoing.filter(p => p.status === "paid").forEach(p => {
      const proj = projects.find(pr => pr.id === p.project_id);
      const name = proj?.client_name || "Unknown";
      if (map[name]) map[name].costs += p.amount || 0;
    });
    return Object.values(map).map(c => ({ ...c, profit: c.revenue - c.costs, margin: c.revenue ? Math.round(((c.revenue - c.costs) / c.revenue) * 100) : 0 })).sort((a, b) => b.revenue - a.revenue);
  };

  // --- Professional profitability ---
  const proData = () => {
    const pros = users.filter(u => u.role === "professional");
    return pros.map(pro => {
      const proTasks = tasks.filter(t => t.assigned_to === pro.id);
      const done = proTasks.filter(t => t.status === "done").length;
      const total = proTasks.length;
      const paid = outgoing.filter(p => p.professional_id === pro.id && p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
      const overdue = proTasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== "done").length;
      const avgSpeed = proTasks.length > 0 ? Math.round((done / Math.max(total, 1)) * 100) : 0;
      return { name: pro.full_name || "Professional", specialty: pro.specialty, total, done, overdue, paid, completionRate: avgSpeed };
    }).sort((a, b) => b.completionRate - a.completionRate);
  };

  // --- Drill-down: client projects ---
  const clientProjects = drillClient ? projects.filter(p => p.client_name === drillClient) : [];

  // --- Drill-down: project tasks + payments ---
  const projectTasks = drillProject ? tasks.filter(t => t.project_id === drillProject.id) : [];
  const projectIncoming = drillProject ? incoming.filter(p => p.project_id === drillProject.id) : [];
  const projectOutgoing = drillProject ? outgoing.filter(p => p.project_id === drillProject.id) : [];

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Reports" subtitle="Loading report data..." />
        <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="bg-card rounded-xl border p-6 h-32 animate-pulse" />)}</div>
      </div>
    );
  }

  // Level 3: Project drill-down (tasks + payments)
  if (drillProject) {
    const rev = projectIncoming.filter(p => p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
    const cost = projectOutgoing.filter(p => p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
    const done = projectTasks.filter(t => t.status === "done").length;
    const progress = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setDrillProject(null)} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to {drillClient}
          </Button>
        </div>
        <PageHeader title={drillProject.name} subtitle={`${drillClient} · ${progress}% complete`} />

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-lg font-bold text-emerald-600">R${rev.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">Costs</p>
            <p className="text-lg font-bold text-red-500">R${cost.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">Profit</p>
            <p className={`text-lg font-bold ${rev - cost >= 0 ? "text-emerald-600" : "text-red-500"}`}>R${(rev - cost).toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="text-lg font-bold">R${(drillProject.total_budget || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold mb-3">Tasks ({projectTasks.length})</h3>
          {projectTasks.length > 0 ? (
            <div className="divide-y divide-border">
              {projectTasks.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.assigned_to_name || "Unassigned"}</p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge status={t.priority} size="xs" />
                    <StatusBadge status={t.status} size="xs" />
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No tasks</p>}
        </div>

        {(projectIncoming.length > 0 || projectOutgoing.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-sm font-semibold mb-3">Incoming Payments ({projectIncoming.length})</h3>
              <div className="divide-y divide-border">
                {projectIncoming.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm">R${(p.amount || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{p.due_date ? new Date(p.due_date).toLocaleDateString() : "No date"}</p>
                    </div>
                    <StatusBadge status={p.status} size="xs" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-sm font-semibold mb-3">Outgoing Payments ({projectOutgoing.length})</h3>
              <div className="divide-y divide-border">
                {projectOutgoing.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm">R${(p.amount || 0).toLocaleString()} — {p.professional_name}</p>
                      <p className="text-xs text-muted-foreground">{p.task_title}</p>
                    </div>
                    <StatusBadge status={p.status} size="xs" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Level 2: Client drill-down (projects)
  if (drillClient) {
    const cd = clientData().find(c => c.name === drillClient);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setDrillClient(null)} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to all clients
          </Button>
        </div>
        <PageHeader title={drillClient} subtitle={`${clientProjects.length} projects`} />

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-lg font-bold text-emerald-600">R${(cd?.revenue || 0).toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">Costs</p>
            <p className="text-lg font-bold text-red-500">R${(cd?.costs || 0).toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">Profit</p>
            <p className={`text-lg font-bold ${(cd?.profit || 0) >= 0 ? "text-emerald-600" : "text-red-500"}`}>R${(cd?.profit || 0).toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">Margin</p>
            <p className="text-lg font-bold">{cd?.margin || 0}%</p>
          </div>
        </div>

        <div className="space-y-3">
          {clientProjects.map(p => {
            const pTasks = tasks.filter(t => t.project_id === p.id);
            const done = pTasks.filter(t => t.status === "done").length;
            const prog = pTasks.length ? Math.round((done / pTasks.length) * 100) : 0;
            const rev = incoming.filter(pi => pi.project_id === p.id && pi.status === "paid").reduce((s, pi) => s + (pi.amount || 0), 0);
            return (
              <div key={p.id} onClick={() => setDrillProject(p)}
                className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{pTasks.length} tasks · {done} done</p>
                  </div>
                  <StatusBadge status={p.status} size="xs" />
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full" style={{ width: `${prog}%`, background: "linear-gradient(to right, #FF4D35, #FFB74D)" }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Budget: R${(p.total_budget || 0).toLocaleString()}</span>
                  <span>Revenue: R${rev.toLocaleString()}</span>
                  <span>{prog}% complete</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Level 1: Overview
  const clients = clientData();
  const pros = proData();
  const revenueByClient = clients.map((c, i) => ({ ...c, fill: COLORS[i % COLORS.length] }));
  const totalRevenue = clients.reduce((s, c) => s + c.revenue, 0);
  const totalCosts = clients.reduce((s, c) => s + c.costs, 0);

  return (
    <div className="space-y-8">
      <PageHeader title="Reports & Analytics" subtitle="Drill-down profitability analysis — click any client to explore" />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-600">R${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Costs</p>
          <p className="text-2xl font-bold text-red-500">R${totalCosts.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Profit</p>
          <p className={`text-2xl font-bold ${totalRevenue - totalCosts >= 0 ? "text-emerald-600" : "text-red-500"}`}>R${(totalRevenue - totalCosts).toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Margin</p>
          <p className="text-2xl font-bold">{totalRevenue ? Math.round(((totalRevenue - totalCosts) / totalRevenue) * 100) : 0}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold mb-4">Revenue by Client</h3>
          {revenueByClient.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueByClient}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `R$${v.toLocaleString()}`} />
                <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]}>
                  {revenueByClient.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">No data</div>}
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold mb-4">Profit Distribution</h3>
          {clients.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={clients.filter(c => c.revenue > 0)} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ strokeWidth: 1 }}>
                  {clients.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `R$${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">No data</div>}
        </div>
      </div>

      {/* Client Profitability Table */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold mb-4">Client Profitability (click to drill down)</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Client", "Projects", "Revenue", "Costs", "Profit", "Margin"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.name} onClick={() => setDrillClient(c.name)}
                  className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.projects}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-emerald-600">R${c.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-red-500">R${c.costs.toLocaleString()}</td>
                  <td className={`px-4 py-3 text-sm font-bold ${c.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>R${c.profit.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.margin >= 50 ? "bg-emerald-100 text-emerald-700" : c.margin >= 20 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{c.margin}%</span>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No client data yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Professional Performance Table */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold mb-4">Professional Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Professional", "Specialty", "Tasks", "Done", "Overdue", "Completion", "Paid"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pros.map(p => (
                <tr key={p.name} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.specialty || "—"}</td>
                  <td className="px-4 py-3 text-sm">{p.total}</td>
                  <td className="px-4 py-3 text-sm text-emerald-600">{p.done}</td>
                  <td className={`px-4 py-3 text-sm ${p.overdue > 0 ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>{p.overdue}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${p.completionRate}%`, background: "linear-gradient(to right, #FF4D35, #FFB74D)" }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{p.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">R${p.paid.toLocaleString()}</td>
                </tr>
              ))}
              {pros.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No professionals yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
