import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DollarSign, TrendingUp, Clock, CheckSquare, AlertTriangle, CalendarClock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import StatCard from "../components/StatCard";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

function buildRevenueTrend(incoming, outgoing) {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      month: d.toLocaleString("en-US", { month: "short" }),
      revenue: 0,
      expenses: 0,
    });
  }
  incoming.filter(p => p.status === "paid" && p.paid_date).forEach(p => {
    const key = p.paid_date.slice(0, 7);
    const m = months.find(m => m.key === key);
    if (m) m.revenue += p.amount || 0;
  });
  outgoing.filter(p => p.status === "paid" && p.paid_date).forEach(p => {
    const key = p.paid_date.slice(0, 7);
    const m = months.find(m => m.key === key);
    if (m) m.expenses += p.amount || 0;
  });
  return months;
}

function buildForecast(incoming) {
  const now = new Date();
  const periods = [
    { label: "30 days", days: 30 },
    { label: "60 days", days: 60 },
    { label: "90 days", days: 90 },
  ];
  const recurringActive = incoming.filter(p => p.type === "recurring" && p.status !== "overdue");
  const monthlyMRR = recurringActive
    .filter(p => !p.recurrence || p.recurrence === "monthly")
    .reduce((s, p) => s + (p.amount || 0), 0);
  const quarterlyMRR = recurringActive
    .filter(p => p.recurrence === "quarterly")
    .reduce((s, p) => s + (p.amount || 0) / 3, 0);
  const totalMonthlyRecurring = monthlyMRR + quarterlyMRR;

  const pendingOneTime = incoming
    .filter(p => p.type === "one-time" && p.status === "pending" && p.due_date)
    .reduce((acc, p) => {
      const due = new Date(p.due_date);
      const daysOut = Math.ceil((due - now) / 86400000);
      if (daysOut > 0 && daysOut <= 90) acc.push({ amount: p.amount || 0, days: daysOut });
      return acc;
    }, []);

  return periods.map(({ label, days }) => {
    const monthsFraction = days / 30;
    const recurring = Math.round(totalMonthlyRecurring * monthsFraction);
    const oneTime = pendingOneTime.filter(p => p.days <= days).reduce((s, p) => s + p.amount, 0);
    return { label, recurring, oneTime, total: recurring + oneTime };
  });
}

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
  const overdueCount = incoming.filter(p => p.status === "overdue").length;

  const trendData = buildRevenueTrend(incoming, outgoing);
  const forecast = buildForecast(incoming);

  const clientProfitMap = projects.reduce((acc, proj) => {
    const name = proj.client_name || "Unknown";
    if (!acc[name]) acc[name] = { name, budget: 0 };
    acc[name].budget += proj.total_budget || 0;
    return acc;
  }, {});
  const profitData = Object.values(clientProfitMap).sort((a, b) => b.budget - a.budget).slice(0, 6);

  const recentApprovals = outgoing.filter(p => p.status === "requested").slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader title="Admin Dashboard" subtitle="Financial overview & strategic control" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Monthly Revenue" value={loading ? "\u2026" : `R$${totalMRR.toLocaleString()}`} icon={DollarSign} color="green" />
        <StatCard label="Outstanding" value={loading ? "\u2026" : `R$${totalOutstanding.toLocaleString()}`} icon={Clock} color="yellow" />
        <StatCard label="Net Cash Flow" value={loading ? "\u2026" : `R$${netFlow.toLocaleString()}`} icon={TrendingUp} color="blue" />
        <StatCard label="Pending Approvals" value={loading ? "\u2026" : pendingApprovals} icon={CheckSquare} color="primary" />
      </div>

      {overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">{overdueCount} overdue payment{overdueCount > 1 ? "s" : ""}</p>
            <p className="text-xs text-red-600">R${incoming.filter(p => p.status === "overdue").reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()} total overdue</p>
          </div>
          <a href="/admin/payments" className="ml-auto text-xs text-red-700 font-medium hover:underline">View payments →</a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold mb-4">Revenue vs Expenses (6 months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4D35" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#FF4D35" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `R$${v.toLocaleString()}`} />
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
                <Tooltip formatter={(v) => `R$${v.toLocaleString()}`} />
                <Bar dataKey="budget" fill="#FF4D35" radius={[6, 6, 0, 0]} name="Budget" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No project data yet</div>
          )}
        </div>
      </div>

      {/* Revenue Forecast */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Revenue Forecast</h3>
        </div>
        {loading ? (
          <div className="h-20 animate-pulse bg-muted rounded" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {forecast.map((f) => (
              <div key={f.label} className="border border-border rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{f.label}</p>
                <p className="text-xl font-bold">R${f.total.toLocaleString()}</p>
                <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span>Recurring: R${f.recurring.toLocaleString()}</span>
                  <span>One-time: R${f.oneTime.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
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
