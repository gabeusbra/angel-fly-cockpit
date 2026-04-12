import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Clock, DollarSign, FolderKanban, TrendingUp, Zap, Target, Sparkles, CheckCircle2 } from "lucide-react";
import { filterMyRecords } from "@/lib/entity-helpers";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function getWeekDates() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function ProDashboard({ user }) {
  const [tasks, setTasks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      filterMyRecords(base44.entities.Task, "assigned_to", user, "assigned_to_name"),
      filterMyRecords(base44.entities.PaymentOutgoing, "professional_id", user, "professional_name"),
    ]).then(([t, p]) => { setTasks(t); setPayments(p); setLoading(false); });
  }, [user]);

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Stats
  const activeTasks = tasks.filter(t => t.status !== "done");
  const doneTasks = tasks.filter(t => t.status === "done");
  const dueSoon = tasks.filter(t => {
    if (!t.deadline || t.status === "done") return false;
    const diff = (new Date(t.deadline) - now) / 86400000;
    return diff <= 7 && diff >= 0;
  });
  const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== "done");
  const earnedTotal = payments.filter(p => p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
  const pendingPay = payments.filter(p => p.status === "requested" || p.status === "approved").reduce((s, p) => s + (p.amount || 0), 0);
  const activeProjects = [...new Set(activeTasks.map(t => t.project_id))].length;

  // AI Focus: highest priority unfinished task with nearest deadline
  const focusTask = activeTasks
    .sort((a, b) => {
      const prio = { urgent: 0, high: 1, medium: 2, low: 3 };
      const pa = prio[a.priority] ?? 2, pb = prio[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
      return new Date(a.deadline || "2099") - new Date(b.deadline || "2099");
    })[0];

  // Weekly task completion chart
  const weekDates = getWeekDates();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekData = weekDates.map((d, i) => {
    const dateStr = d.toISOString().split("T")[0];
    const isToday = dateStr === todayStr;
    return {
      day: dayNames[i],
      completed: doneTasks.filter(t => t.updated_date?.startsWith(dateStr) || t.created_date?.startsWith(dateStr)).length,
      isToday,
    };
  });

  // Performance score (0-100)
  const completionRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
  const onTimeCount = doneTasks.filter(t => !t.deadline || new Date(t.deadline) >= new Date(t.updated_date || t.created_date)).length;
  const onTimeRate = doneTasks.length > 0 ? Math.round((onTimeCount / doneTasks.length) * 100) : 100;
  const performanceScore = Math.round((completionRate * 0.4 + onTimeRate * 0.6));

  // AI insights
  const insights = [];
  if (overdue.length > 0) insights.push({ type: "warning", text: `${overdue.length} task${overdue.length > 1 ? "s" : ""} overdue — focus on these first` });
  if (onTimeRate >= 90 && doneTasks.length >= 3) insights.push({ type: "positive", text: `${onTimeRate}% on-time delivery rate — excellent reliability` });
  if (pendingPay > 0) insights.push({ type: "info", text: `R$${pendingPay.toLocaleString()} in pending payments being processed` });
  if (activeTasks.filter(t => t.priority === "urgent").length > 0) insights.push({ type: "warning", text: `${activeTasks.filter(t => t.priority === "urgent").length} urgent task${activeTasks.filter(t => t.priority === "urgent").length > 1 ? "s" : ""} need immediate attention` });
  if (doneTasks.length >= 10) insights.push({ type: "positive", text: `${doneTasks.length} tasks completed total — strong track record` });

  // Upcoming deadlines (next 14 days)
  const upcoming = activeTasks
    .filter(t => t.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}, {user?.full_name?.split(" ")[0] || "Pro"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTasks.length > 0 ? `${activeTasks.length} active tasks across ${activeProjects} project${activeProjects !== 1 ? "s" : ""}` : "No active tasks right now"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white ${performanceScore >= 80 ? "bg-emerald-500" : performanceScore >= 50 ? "bg-amber-500" : "bg-red-500"}`}>
            {loading ? "—" : performanceScore}
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Score</p>
            <p className="text-xs text-muted-foreground">{performanceScore >= 80 ? "Excellent" : performanceScore >= 50 ? "Good" : "Needs work"}</p>
          </div>
        </div>
      </div>

      {/* AI Focus Task */}
      {focusTask && (
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 rounded-xl border border-primary/20 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Today's Focus</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-base font-semibold truncate">{focusTask.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{focusTask.project_name}{focusTask.deadline ? ` · Due ${new Date(focusTask.deadline).toLocaleDateString()}` : ""}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={focusTask.priority} size="xs" />
              <a href="/pro/tasks"><Button size="sm" className="gap-1 h-8"><Zap className="w-3.5 h-3.5" /> Go</Button></a>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Due This Week" value={loading ? "\u2026" : dueSoon.length} icon={Clock} color={overdue.length > 0 ? "red" : "yellow"} subtitle={overdue.length > 0 ? `${overdue.length} overdue` : undefined} />
        <StatCard label="Earned Total" value={loading ? "\u2026" : `R$${earnedTotal.toLocaleString()}`} icon={DollarSign} color="green" subtitle={pendingPay > 0 ? `R$${pendingPay.toLocaleString()} pending` : undefined} />
        <StatCard label="Completion Rate" value={loading ? "\u2026" : `${completionRate}%`} icon={TrendingUp} color="blue" subtitle={`${doneTasks.length} of ${tasks.length} tasks`} />
        <StatCard label="Active Projects" value={loading ? "\u2026" : activeProjects} icon={FolderKanban} color="primary" />
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">AI Insights</h3>
          </div>
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <div key={i} className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${
                ins.type === "warning" ? "bg-amber-50 text-amber-800" :
                ins.type === "positive" ? "bg-emerald-50 text-emerald-800" :
                "bg-blue-50 text-blue-800"
              }`}>
                <span className="mt-0.5">{ins.type === "warning" ? "\u26A0" : ins.type === "positive" ? "\u2713" : "\u2139"}</span>
                <span>{ins.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">This Week</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weekData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="completed" name="Completed" radius={[6, 6, 0, 0]} fill="#FF4D35" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Upcoming Deadlines</h3>
            <a href="/pro/tasks" className="text-xs text-primary font-medium hover:underline">View tasks \u2192</a>
          </div>
          {upcoming.length > 0 ? (
            <div className="space-y-2.5">
              {upcoming.map(t => {
                const daysLeft = Math.ceil((new Date(t.deadline) - now) / 86400000);
                const isOverdue = daysLeft < 0;
                return (
                  <div key={t.id} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold shrink-0 ${
                      isOverdue ? "bg-red-100 text-red-700" : daysLeft <= 2 ? "bg-amber-100 text-amber-700" : "bg-muted text-foreground"
                    }`}>
                      <span>{new Date(t.deadline).getDate()}</span>
                      <span className="text-[8px] font-medium uppercase">{new Date(t.deadline).toLocaleString("en", { month: "short" })}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{t.project_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge status={t.priority} size="xs" />
                      <p className={`text-[10px] mt-0.5 ${isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                        {isOverdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Today" : `${daysLeft}d left`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No upcoming deadlines</p>
          )}
        </div>
      </div>

      {/* Active Tasks by Status */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Active Tasks</h3>
          <a href="/pro/tasks" className="text-xs text-primary font-medium hover:underline">Open board \u2192</a>
        </div>
        {activeTasks.length > 0 ? (
          <div className="space-y-2">
            {activeTasks.slice(0, 8).map(t => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${t.status === "review" ? "text-purple-500" : t.status === "in_progress" ? "text-amber-500" : "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.project_name}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={t.status} size="xs" />
                  <StatusBadge status={t.priority} size="xs" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs text-muted-foreground">No active tasks right now</p>
          </div>
        )}
      </div>
    </div>
  );
}
