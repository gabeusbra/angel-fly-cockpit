import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DollarSign, TrendingUp, Clock, CheckSquare } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import StatCard from "../components/StatCard";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

const TREND = [
  { month: "Nov", revenue: 8500, expenses: 4200 },
  { month: "Dec", revenue: 9200, expenses: 4800 },
  { month: "Jan", revenue: 10100, expenses: 5100 },
  { month: "Feb", revenue: 11400, expenses: 5600 },
  { month: "Mar", revenue: 12000, expenses: 5900 },
  { month: "Apr", revenue: 13200, expenses: 6100 },
];

export default function AdminDashboard() {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.PaymentIncoming.list(),
      base44.entities.PaymentOutgoing.list(),
      base44.entities.Project.list(),
    ]).then(([inc, out, proj]) => {
      setIncoming(inc); setOutgoing(out); setProjects(proj); setLoading(false);
    });
  }, []);

  const totalMRR = incoming.filter(p => p.type === "recurring" && p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
  const totalOutstanding = incoming.filter(p => p.status === "pending" || p.status === "overdue").reduce((s, p) => s + (p.amount || 0), 0);
  const totalPaid = incoming.filter(p => p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
  const totalPaidOut = outgoing.filter(p => p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
  const netFlow = totalPaid - totalPaidOut;
  const pendingApprovals = outgoing.filter(p => p.status === "requested").length;

  const clientProfitMap = projects.reduce((acc, proj) => {
    const name = proj.client_name || "Unknown";
    if (!acc[name]) acc[name] = { name, budget: 0 };
    acc[name].budget += proj.total_budget || 0;
    return acc;
  }, {});
  const profitData = Object.values(clientProfitMap).slice(0, 6);

  const recentApprovals = outgoing.filter(p => p.status === "requested").slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader title="Admin Dashboard" subtitle="Financial overview & strategic control" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Monthly Revenue" value={loading ? "…" : `R$${totalMRR.toLocaleString()}`} icon={DollarSign} color="green" trend={12} />
        <StatCard label="Outstanding" value={loading ? "…" : `R$${totalOutstanding.toLocaleString()}`} icon={Clock} color="yellow" />
        <StatCard label="Net Cash Flow" value={loading ? "…" : `R$${netFlow.toLocaleString()}`} icon={TrendingUp} color="blue" />
        <StatCard label="Pending Approvals" value={loading ? "…" : pendingApprovals} icon={CheckSquare} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold mb-4">Revenue Trend (6 months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={TREND}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4D35" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#FF4D35" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#FF4D35" fill="url(#rev)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke="#FF8A65" fill="transparent" strokeWidth={2} strokeDasharray="5 5" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold mb-4">Budget by Client</h3>
          {profitData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="budget" fill="#FF4D35" radius={[6, 6, 0, 0]} name="Budget" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No project data yet</div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Pending Payment Approvals</h3>
          <a href="/admin/approvals" className="text-xs text-primary font-medium hover:underline">View all →</a>
        </div>
        {recentApprovals.length > 0 ? (
          <div className="divide-y divide-border">
            {recentApprovals.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{p.professional_name || "Professional"}</p>
                  <p className="text-xs text-muted-foreground">{p.task_title} · {p.project_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">R${(p.amount || 0).toLocaleString()}</p>
                  <StatusBadge status={p.status} size="xs" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">All caught up! No pending approvals.</p>
        )}
      </div>
    </div>
  );
}