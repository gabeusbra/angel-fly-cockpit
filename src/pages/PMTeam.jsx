import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Search, AlertTriangle, Clock, TrendingUp, ListChecks, Sparkles, Plus, Pencil, Trash2, Upload, UserCircle, ChevronRight, CheckCircle2, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember } from "@/lib/team-store";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

const ROLE_COLORS = { admin: "bg-purple-100 text-purple-700", pm: "bg-blue-100 text-blue-700", professional: "bg-orange-100 text-orange-700" };
const ROLE_LABELS = { admin: "Admin", pm: "PM", professional: "Professional" };
const STATUS_COLORS = { backlog: "bg-slate-300", assigned: "bg-blue-400", in_progress: "bg-amber-400", review: "bg-purple-400", client_approval: "bg-orange-400", done: "bg-emerald-400" };
const MAX_CAPACITY = 8;

const emptyForm = { name: "", role: "professional", specialty: "", email: "", phone: "", avatar_url: "", hourly_rate: "", default_delivery_days: "", max_tasks_capacity: "8", user_email: "", status: "active", notes: "" };

export default function PMTeam() {
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    setMembers(getTeamMembers());
    const loadData = async () => {
      let t = [], tk = [], u = [];
      try { t = await base44.entities.Task.list(); } catch { /* ignore */ }
      try { tk = await base44.entities.Ticket.list(); } catch { /* ignore */ }
      try { u = await base44.entities.User.list(); } catch { /* ignore */ }
      setTasks(t); setTickets(tk); setUsers(u); setLoading(false);
    };
    loadData();
  }, []);

  const reload = () => setMembers(getTeamMembers());

  // --- Stats per member ---
  const getStats = (member) => {
    const myTasks = tasks.filter(t =>
      t.assigned_to_name?.toLowerCase() === member.name?.toLowerCase() ||
      (member.user_email && t.assigned_to_name?.toLowerCase() === users.find(u => u.email?.toLowerCase() === member.user_email?.toLowerCase())?.full_name?.toLowerCase())
    );
    const active = myTasks.filter(t => t.status !== "done");
    const done = myTasks.filter(t => t.status === "done");
    const overdue = active.filter(t => t.deadline && new Date(t.deadline) < new Date());
    const dueSoon = active.filter(t => {
      if (!t.deadline) return false;
      const d = (new Date(t.deadline) - new Date()) / 86400000;
      return d >= 0 && d <= 3;
    });
    const statusBreakdown = {};
    myTasks.forEach(t => { statusBreakdown[t.status] = (statusBreakdown[t.status] || 0) + 1; });
    const total = myTasks.length;
    const completionRate = total > 0 ? Math.round((done.length / total) * 100) : 0;
    const onTimeRate = done.length > 0 ? Math.round(((done.length - overdue.length) / done.length) * 100) : 100;
    const capacity = parseInt(member.max_tasks_capacity) || MAX_CAPACITY;
    const workloadPct = Math.min(Math.round((active.length / capacity) * 100), 100);
    const myTickets = tickets.filter(t => t.assigned_to_name?.toLowerCase() === member.name?.toLowerCase() && t.status !== "closed" && t.status !== "resolved");
    return { active, done, overdue, dueSoon, statusBreakdown, total, completionRate, onTimeRate, workloadPct, capacity, myTickets };
  };

  // --- Filtered members ---
  const filtered = useMemo(() => {
    return members.filter(m => {
      if (m.status === "inactive") return false;
      const q = search.toLowerCase();
      const matchesSearch = (m.name || "").toLowerCase().includes(q) || (m.email || "").toLowerCase().includes(q) || (m.specialty || "").toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || m.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [members, search, roleFilter]);

  // --- Summary stats ---
  const summary = useMemo(() => {
    let totalActive = 0, totalOverdue = 0, rates = [];
    members.filter(m => m.status === "active").forEach(m => {
      const s = getStats(m);
      totalActive += s.active.length;
      totalOverdue += s.overdue.length;
      if (s.total > 0) rates.push(s.completionRate);
    });
    return { teamSize: members.filter(m => m.status === "active").length, totalActive, totalOverdue, avgCompletion: rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0 };
  }, [members, tasks]);

  // --- Smart insights ---
  const insights = useMemo(() => {
    const ins = [];
    members.filter(m => m.status === "active").forEach(m => {
      const s = getStats(m);
      if (s.active.length >= 6) ins.push({ type: "overloaded", member: m, text: `${m.name} is overloaded with ${s.active.length} active tasks` });
      if (s.overdue.length >= 2) ins.push({ type: "overdue", member: m, text: `${m.name} has ${s.overdue.length} overdue tasks` });
      if (s.active.length === 0 && s.total > 0) ins.push({ type: "idle", member: m, text: `${m.name} has no active tasks` });
      if (s.dueSoon.length >= 3) ins.push({ type: "deadline", member: m, text: `${m.name} has ${s.dueSoon.length} tasks due in 3 days` });
    });
    return ins;
  }, [members, tasks]);

  // --- Form handlers ---
  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowAdd(true); };
  const openEdit = (m) => {
    setEditing(m);
    setForm({ name: m.name || "", role: m.role || "professional", specialty: m.specialty || "", email: m.email || "", phone: m.phone || "", avatar_url: m.avatar_url || "", hourly_rate: m.hourly_rate ? String(m.hourly_rate) : "", default_delivery_days: m.default_delivery_days ? String(m.default_delivery_days) : "", max_tasks_capacity: m.max_tasks_capacity ? String(m.max_tasks_capacity) : "8", user_email: m.user_email || "", status: m.status || "active", notes: m.notes || "" });
    setShowAdd(true);
  };
  const handleSave = () => {
    const data = { ...form, hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null, default_delivery_days: form.default_delivery_days ? parseInt(form.default_delivery_days) : null, max_tasks_capacity: form.max_tasks_capacity ? parseInt(form.max_tasks_capacity) : MAX_CAPACITY };
    if (editing) updateTeamMember(editing.id, data); else createTeamMember(data);
    setShowAdd(false); reload();
  };
  const handleDelete = () => { if (confirmDelete) { deleteTeamMember(confirmDelete.id); setConfirmDelete(null); setSelectedMember(null); reload(); } };
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingAvatar(true);
    try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setForm(f => ({ ...f, avatar_url: file_url })); } catch { /* ignore */ }
    setUploadingAvatar(false);
  };

  // --- Detail panel data ---
  const detailStats = selectedMember ? getStats(selectedMember) : null;
  const chartData = detailStats ? Object.entries(detailStats.statusBreakdown).map(([status, count]) => ({ status: status.replace(/_/g, " "), count })) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor workloads, deadlines, and performance</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Member</Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Team Size" value={loading ? "..." : summary.teamSize} icon={Users} color="blue" />
        <StatCard label="Active Tasks" value={loading ? "..." : summary.totalActive} icon={ListChecks} color="primary" />
        <StatCard label="Overdue" value={loading ? "..." : summary.totalOverdue} icon={AlertTriangle} color={summary.totalOverdue > 0 ? "red" : "green"} />
        <StatCard label="Avg Completion" value={loading ? "..." : `${summary.avgCompletion}%`} icon={TrendingUp} color="green" />
      </div>

      {/* Smart insights */}
      {insights.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Insights</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {insights.map((ins, i) => (
              <button key={i} onClick={() => setSelectedMember(ins.member)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:shadow-sm ${
                  ins.type === "overloaded" ? "bg-amber-50 text-amber-800 border border-amber-200" :
                  ins.type === "overdue" ? "bg-red-50 text-red-800 border border-red-200" :
                  ins.type === "idle" ? "bg-blue-50 text-blue-800 border border-blue-200" :
                  "bg-orange-50 text-orange-800 border border-orange-200"
                }`}>
                {ins.type === "overloaded" ? <Flame className="w-3 h-3" /> :
                 ins.type === "overdue" ? <AlertTriangle className="w-3 h-3" /> :
                 <Clock className="w-3 h-3" />}
                {ins.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search team..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {["all", "admin", "pm", "professional"].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${roleFilter === r ? "bg-primary text-white shadow-sm" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
              {r === "all" ? "All" : ROLE_LABELS[r] || r}
            </button>
          ))}
        </div>
      </div>

      {/* Team cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-card rounded-xl border p-5 h-72 animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(m => {
            const s = getStats(m);
            const initials = (m.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            return (
              <div key={m.id} onClick={() => setSelectedMember(m)}
                className="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:shadow-black/5 transition-all cursor-pointer group">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="w-11 h-11 rounded-xl object-cover" />
                  ) : (
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm ${m.role === "admin" ? "bg-purple-500" : m.role === "pm" ? "bg-blue-500" : "bg-gradient-to-br from-[#FF4D35] to-[#FFB74D]"}`}>
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold truncate">{m.name}</h3>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${ROLE_COLORS[m.role] || "bg-muted text-muted-foreground"}`}>{ROLE_LABELS[m.role] || m.role}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{m.specialty || m.email || "No specialty"}</p>
                    {m.hourly_rate && <p className="text-[10px] text-muted-foreground">R${m.hourly_rate}/hr</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Currently working on */}
                {s.active.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Working on</p>
                    {s.active.slice(0, 2).map(t => {
                      const isOverdue = t.deadline && new Date(t.deadline) < new Date();
                      const daysLeft = t.deadline ? Math.ceil((new Date(t.deadline) - new Date()) / 86400000) : null;
                      return (
                        <div key={t.id} className="flex items-center justify-between py-1">
                          <span className="text-xs truncate flex-1 pr-2">{t.title}</span>
                          {daysLeft !== null && (
                            <span className={`text-[10px] shrink-0 ${isOverdue ? "text-red-600 font-semibold" : daysLeft <= 3 ? "text-amber-600" : "text-muted-foreground"}`}>
                              {isOverdue ? `${Math.abs(daysLeft)}d late` : daysLeft === 0 ? "today" : `${daysLeft}d`}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {s.active.length > 2 && <p className="text-[10px] text-muted-foreground">+{s.active.length - 2} more</p>}
                  </div>
                )}

                {/* Status breakdown bar */}
                {s.total > 0 && (
                  <div className="mb-4">
                    <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                      {Object.entries(s.statusBreakdown).map(([status, count]) => (
                        <div key={status} className={`${STATUS_COLORS[status] || "bg-muted"}`} style={{ width: `${(count / s.total) * 100}%` }} title={`${status}: ${count}`} />
                      ))}
                    </div>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      {Object.entries(s.statusBreakdown).filter(([, c]) => c > 0).map(([status, count]) => (
                        <span key={status} className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[status]}`} />{count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center bg-muted/30 rounded-lg py-2">
                    <p className={`text-sm font-bold ${s.workloadPct >= 80 ? "text-red-600" : s.workloadPct >= 50 ? "text-amber-600" : "text-emerald-600"}`}>{s.active.length}/{s.capacity}</p>
                    <p className="text-[9px] text-muted-foreground">Workload</p>
                  </div>
                  <div className="text-center bg-muted/30 rounded-lg py-2">
                    <p className={`text-sm font-bold ${s.completionRate >= 70 ? "text-emerald-600" : s.completionRate >= 40 ? "text-amber-600" : "text-red-600"}`}>{s.completionRate}%</p>
                    <p className="text-[9px] text-muted-foreground">Completion</p>
                  </div>
                  <div className="text-center bg-muted/30 rounded-lg py-2">
                    <p className={`text-sm font-bold ${s.onTimeRate >= 80 ? "text-emerald-600" : "text-amber-600"}`}>{s.onTimeRate}%</p>
                    <p className="text-[9px] text-muted-foreground">On-time</p>
                  </div>
                </div>

                {/* Warnings */}
                {(s.overdue.length > 0 || s.workloadPct >= 80) && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs">
                    {s.overdue.length > 0 && <span className="text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{s.overdue.length} overdue</span>}
                    {s.workloadPct >= 80 && <span className="text-amber-600 flex items-center gap-1"><Flame className="w-3 h-3" />High load</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-16 text-center">
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium">No team members{search || roleFilter !== "all" ? " match your filters" : " yet"}</p>
          <p className="text-xs text-muted-foreground mt-1">Add your first team member to get started</p>
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedMember && detailStats && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3 mt-2">
                  {selectedMember.avatar_url ? (
                    <img src={selectedMember.avatar_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg ${selectedMember.role === "admin" ? "bg-purple-500" : selectedMember.role === "pm" ? "bg-blue-500" : "bg-gradient-to-br from-[#FF4D35] to-[#FFB74D]"}`}>
                      {(selectedMember.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <SheetTitle>{selectedMember.name}</SheetTitle>
                    <p className="text-xs text-muted-foreground">{selectedMember.specialty || selectedMember.role} · {selectedMember.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { openEdit(selectedMember); setSelectedMember(null); }}><Pencil className="w-4 h-4" /></Button>
                </div>
              </SheetHeader>

              {/* Quick stats */}
              <div className="grid grid-cols-4 gap-2 mt-6">
                <div className="text-center bg-muted/30 rounded-lg py-2"><p className="text-lg font-bold">{detailStats.active.length}</p><p className="text-[9px] text-muted-foreground">Active</p></div>
                <div className="text-center bg-muted/30 rounded-lg py-2"><p className="text-lg font-bold text-emerald-600">{detailStats.done.length}</p><p className="text-[9px] text-muted-foreground">Done</p></div>
                <div className="text-center bg-muted/30 rounded-lg py-2"><p className={`text-lg font-bold ${detailStats.overdue.length > 0 ? "text-red-600" : ""}`}>{detailStats.overdue.length}</p><p className="text-[9px] text-muted-foreground">Overdue</p></div>
                <div className="text-center bg-muted/30 rounded-lg py-2"><p className="text-lg font-bold">{detailStats.myTickets.length}</p><p className="text-[9px] text-muted-foreground">Tickets</p></div>
              </div>

              <Tabs defaultValue="tasks" className="mt-6">
                <TabsList className="w-full">
                  <TabsTrigger value="tasks" className="flex-1">Active Tasks</TabsTrigger>
                  <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
                  <TabsTrigger value="performance" className="flex-1">Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="tasks" className="mt-4 space-y-2">
                  {detailStats.overdue.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-red-700 mb-2">Overdue ({detailStats.overdue.length})</p>
                      {detailStats.overdue.map(t => (
                        <div key={t.id} className="flex items-center justify-between py-1">
                          <span className="text-xs text-red-800 truncate flex-1">{t.title}</span>
                          <div className="flex gap-1.5 shrink-0"><StatusBadge status={t.priority} size="xs" /></div>
                        </div>
                      ))}
                    </div>
                  )}
                  {detailStats.active.filter(t => !detailStats.overdue.includes(t)).length > 0 ? (
                    detailStats.active.filter(t => !detailStats.overdue.includes(t)).map(t => (
                      <div key={t.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{t.title}</p>
                          <p className="text-[10px] text-muted-foreground">{t.project_name}{t.deadline ? ` · Due ${new Date(t.deadline).toLocaleDateString()}` : ""}</p>
                        </div>
                        <StatusBadge status={t.status} size="xs" />
                        <StatusBadge status={t.priority} size="xs" />
                      </div>
                    ))
                  ) : detailStats.overdue.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">No active tasks</p>
                  )}
                </TabsContent>

                <TabsContent value="completed" className="mt-4 space-y-2">
                  {detailStats.done.length > 0 ? detailStats.done.slice(0, 10).map(t => (
                    <div key={t.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{t.title}</p>
                        <p className="text-[10px] text-muted-foreground">{t.project_name}</p>
                      </div>
                    </div>
                  )) : <p className="text-sm text-muted-foreground text-center py-6">No completed tasks</p>}
                </TabsContent>

                <TabsContent value="performance" className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card border border-border rounded-xl p-4 text-center">
                      <p className={`text-2xl font-bold ${detailStats.completionRate >= 70 ? "text-emerald-600" : "text-amber-600"}`}>{detailStats.completionRate}%</p>
                      <p className="text-xs text-muted-foreground">Completion Rate</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4 text-center">
                      <p className={`text-2xl font-bold ${detailStats.onTimeRate >= 80 ? "text-emerald-600" : "text-amber-600"}`}>{detailStats.onTimeRate}%</p>
                      <p className="text-xs text-muted-foreground">On-time Rate</p>
                    </div>
                  </div>
                  {chartData.length > 0 && (
                    <div className="bg-card border border-border rounded-xl p-4">
                      <p className="text-xs font-semibold mb-3">Task Breakdown</p>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={chartData}>
                          <XAxis dataKey="status" tick={{ fontSize: 9 }} />
                          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#FF4D35" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="text-center text-xs text-muted-foreground">
                    {selectedMember.hourly_rate && <span>R${selectedMember.hourly_rate}/hr · </span>}
                    {selectedMember.default_delivery_days && <span>{selectedMember.default_delivery_days}d avg delivery · </span>}
                    <span>Max {selectedMember.max_tasks_capacity || MAX_CAPACITY} tasks</span>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 flex gap-2">
                <Button variant="outline" className="flex-1 gap-1" onClick={() => { openEdit(selectedMember); setSelectedMember(null); }}><Pencil className="w-3.5 h-3.5" /> Edit Profile</Button>
                <Button variant="ghost" className="text-red-500 hover:text-red-700 gap-1" onClick={() => { setConfirmDelete(selectedMember); setSelectedMember(null); }}><Trash2 className="w-3.5 h-3.5" /> Remove</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add/Edit dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Team Member" : "Add Team Member"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center"><UserCircle className="w-8 h-8 text-muted-foreground" /></div>
              )}
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted/30 cursor-pointer w-fit">
                  <Upload className="w-3.5 h-3.5" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                </label>
                {uploadingAvatar && <p className="text-[10px] text-muted-foreground">Uploading...</p>}
              </div>
            </div>

            <Input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="pm">Project Manager</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Specialty (e.g. Frontend Developer)" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <Input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-[10px] text-muted-foreground block mb-1">Rate (R$/hr)</label><Input type="number" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} /></div>
              <div><label className="text-[10px] text-muted-foreground block mb-1">Delivery (days)</label><Input type="number" value={form.default_delivery_days} onChange={e => setForm({ ...form, default_delivery_days: e.target.value })} /></div>
              <div><label className="text-[10px] text-muted-foreground block mb-1">Max Tasks</label><Input type="number" value={form.max_tasks_capacity} onChange={e => setForm({ ...form, max_tasks_capacity: e.target.value })} /></div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Link User Account (optional)</label>
              <Input placeholder="User email" value={form.user_email} onChange={e => setForm({ ...form, user_email: e.target.value })} />
              {users.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {users.filter(u => u.email).slice(0, 8).map(u => (
                    <button key={u.email} onClick={() => setForm({ ...form, user_email: u.email })}
                      className={`text-[10px] px-2 py-1 rounded-full transition-all ${form.user_email === u.email ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                      {u.full_name || u.email}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.name}>{editing ? "Save" : "Add Member"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove Team Member</DialogTitle></DialogHeader>
          <p className="text-sm">Remove <strong>{confirmDelete?.name}</strong> from the team?</p>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Remove</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
