import { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Link } from "react-router-dom";
import { Search, FolderKanban, Clock, DollarSign, CheckCircle2, Users, ArrowRight, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StatusBadge from "../components/StatusBadge";

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    Promise.all([
      api.entities.Project.list("-created_date"),
      api.entities.Task.list(),
      api.entities.PaymentIncoming.list(),
    ]).then(([p, t, i]) => { setProjects(p); setTasks(t); setIncoming(i); setLoading(false); });
  }, []);

  const getStats = (pid) => {
    const t = tasks.filter(t => t.project_id === pid);
    const done = t.filter(t => t.status === "done").length;
    const active = t.filter(t => t.status !== "done").length;
    const overdue = t.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== "done").length;
    const progress = t.length ? Math.round((done / t.length) * 100) : 0;
    const team = [...new Set(t.map(t => t.assigned_to_name).filter(Boolean))];
    return { total: t.length, done, active, overdue, progress, team };
  };

  const getBudget = (pid) => {
    const used = incoming.filter(p => p.project_id === pid && p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
    const proj = projects.find(p => p.id === pid);
    return { budget: proj?.total_budget || 0, used };
  };

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    return (p.name?.toLowerCase().includes(q) || p.client_name?.toLowerCase().includes(q))
      && (statusFilter === "all" || p.status === statusFilter);
  });

  const totalBudget = projects.reduce((s, p) => s + (p.total_budget || 0), 0);
  const activeCount = projects.filter(p => p.status === "active").length;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === "done").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">{projects.length} projects · R${totalBudget.toLocaleString()} total budget</p>
        </div>
        <Link to="/pm/projects"><Button variant="outline" className="gap-2"><Plus className="w-4 h-4" /> New Project</Button></Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2"><FolderKanban className="w-4 h-4 text-primary" /></div>
          <p className="text-2xl font-bold">{activeCount}</p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Active Projects</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
          <p className="text-2xl font-bold">{doneTasks}<span className="text-sm font-normal text-muted-foreground">/{totalTasks}</span></p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Tasks Done</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-emerald-500" /></div>
          <p className="text-2xl font-bold">R${totalBudget.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total Budget</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-blue-500" /></div>
          <p className="text-2xl font-bold">{[...new Set(tasks.map(t => t.assigned_to_name).filter(Boolean))].length}</p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Team Members</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search projects or clients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <div className="flex gap-2">
          {["all", "active", "paused", "completed"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-primary text-white shadow-sm" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Project cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="bg-card rounded-xl border p-5 h-52 animate-pulse" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.filter(p => p && p.id).map(p => {
            const stats = getStats(p.id);
            const budget = getBudget(p.id);
            const budgetPct = budget.budget > 0 ? Math.round((budget.used / budget.budget) * 100) : 0;
            const daysLeft = p.end_date ? Math.ceil((new Date(p.end_date) - new Date()) / 86400000) : null;
            return (
              <Link key={p.id} to={`/admin/projects/${p.id}`}
                className="bg-card rounded-xl border border-border hover:shadow-lg hover:shadow-black/5 transition-all group block overflow-hidden">

                {/* Status bar top */}
                <div className={`h-1 ${p.status === "active" ? "bg-emerald-500" : p.status === "paused" ? "bg-amber-500" : "bg-blue-500"}`} />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #FF4D35, #FFB74D)" }}>
                        <FolderKanban className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold group-hover:text-primary transition-colors">{p.name}</h3>
                        <p className="text-xs text-muted-foreground">{p.client_name || "No client"}</p>
                      </div>
                    </div>
                    <StatusBadge status={p.status} size="xs" />
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{stats.done}/{stats.total} tasks</span>
                      <span className="font-semibold">{stats.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${stats.progress}%`, background: "linear-gradient(to right, #FF4D35, #FFB74D)" }} />
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center bg-muted/30 rounded-lg py-2">
                      <p className="text-sm font-bold text-amber-600">{stats.active}</p>
                      <p className="text-[10px] text-muted-foreground">Active</p>
                    </div>
                    <div className="text-center bg-muted/30 rounded-lg py-2">
                      <p className="text-sm font-bold text-emerald-600">{stats.done}</p>
                      <p className="text-[10px] text-muted-foreground">Done</p>
                    </div>
                    <div className="text-center bg-muted/30 rounded-lg py-2">
                      <p className={`text-sm font-bold ${stats.overdue > 0 ? "text-red-600" : "text-muted-foreground"}`}>{stats.overdue}</p>
                      <p className="text-[10px] text-muted-foreground">Overdue</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-3">
                      {/* Budget */}
                      <div className="text-xs">
                        <span className="text-muted-foreground">R${budget.used.toLocaleString()}</span>
                        <span className="text-muted-foreground/50"> / R${budget.budget.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {daysLeft !== null && (
                        <div className={`flex items-center gap-1 text-xs ${daysLeft < 0 ? "text-red-600 font-medium" : daysLeft <= 7 ? "text-amber-600" : "text-muted-foreground"}`}>
                          <Clock className="w-3 h-3" />
                          <span>{daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Due today" : `${daysLeft}d left`}</span>
                        </div>
                      )}
                      <span className="text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Open <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  {/* Team avatars */}
                  {stats.team.length > 0 && (
                    <div className="flex items-center gap-1 mt-3">
                      {stats.team.slice(0, 4).map((name, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground border-2 border-card -ml-1 first:ml-0" title={name}>
                          {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                      ))}
                      {stats.team.length > 4 && <span className="text-[10px] text-muted-foreground ml-1">+{stats.team.length - 4}</span>}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-16 text-center">
          <FolderKanban className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium">No projects found</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}