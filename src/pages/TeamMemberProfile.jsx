import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "@/api/client";
import { ArrowLeft, CheckCircle2, AlertTriangle, Flame, TrendingUp, ListChecks, Calendar, Settings, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getTeamMemberById, updateTeamMember, deleteTeamMember } from "@/lib/team-store";
import StatusBadge from "../components/StatusBadge";

const STATUS_COLORS = { backlog: "#94a3b8", assigned: "#60a5fa", in_progress: "#fbbf24", review: "#a78bfa", client_approval: "#fb923c", done: "#34d399" };

export default function TeamMemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = location.pathname.startsWith("/admin") ? "/admin/team" : "/pm/team";

  const [member, setMember] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState("all");
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const load = async () => {
      const m = await getTeamMemberById(id);
      setMember(m);
      let t = [], tk = [];
      try { t = await api.entities.Task.list(); } catch { /* ignore */ }
      try { tk = await api.entities.Ticket.list(); } catch { /* ignore */ }
      setTasks(t);
      setTickets(tk.filter(x => x.category !== "client_record" && x.category !== "team_record"));
      let u = [];
      try { u = await api.entities.User.list(); } catch { /* ignore */ }
      setUsers(u.filter(usr => usr.role !== "client" && usr.email));
      setLoading(false);
    };
    load();
  }, [id]);

  const openSettings = () => {
    if (!member) return;
    setSettingsForm({ name: member.name || "", role: member.role || "professional", specialty: member.specialty || "", email: member.email || "", phone: member.phone || "", avatar_url: member.avatar_url || "", hourly_rate: member.hourly_rate ? String(member.hourly_rate) : "", default_delivery_days: member.default_delivery_days ? String(member.default_delivery_days) : "", max_tasks_capacity: member.max_tasks_capacity ? String(member.max_tasks_capacity) : "8", user_email: member.user_email || "", notes: member.notes || "" });
    setShowSettings(true);
  };
  const handleSaveSettings = async () => {
    await updateTeamMember(id, { ...settingsForm, hourly_rate: settingsForm.hourly_rate ? parseFloat(settingsForm.hourly_rate) : null, default_delivery_days: settingsForm.default_delivery_days ? parseInt(settingsForm.default_delivery_days) : null, max_tasks_capacity: settingsForm.max_tasks_capacity ? parseInt(settingsForm.max_tasks_capacity) : 8 });
    const updated = await getTeamMemberById(id);
    setMember(updated);
    setShowSettings(false);
  };

  const handleDeleteMember = async () => {
    await deleteTeamMember(id);
    setConfirmDelete(false);
    navigate(backPath);
  };

  // Match tasks to this member
  const myTasks = useMemo(() => {
    if (!member) return [];
    return tasks.filter(t =>
      t.assigned_to_name?.toLowerCase() === member.name?.toLowerCase()
    );
  }, [member, tasks]);

  const myTickets = useMemo(() => {
    if (!member) return [];
    return tickets.filter(t =>
      t.assigned_to_name?.toLowerCase() === member.name?.toLowerCase() &&
      t.status !== "closed"
    );
  }, [member, tickets]);

  // Stats
  const active = myTasks.filter(t => t.status !== "done");
  const done = myTasks.filter(t => t.status === "done");
  const overdue = active.filter(t => t.deadline && new Date(t.deadline) < new Date());
  const inProgress = active.filter(t => t.status === "in_progress");
  const review = active.filter(t => t.status === "review" || t.status === "client_approval");
  const assigned = active.filter(t => t.status === "assigned" || t.status === "backlog");
  const dueSoon = active.filter(t => { if (!t.deadline) return false; const d = (new Date(t.deadline) - new Date()) / 86400000; return d >= 0 && d <= 7; });
  const completionRate = myTasks.length > 0 ? Math.round((done.length / myTasks.length) * 100) : 0;
  const onTimeRate = done.length > 0 ? Math.round(((done.length - overdue.length) / done.length) * 100) : 100;
  const capacity = parseInt(member?.max_tasks_capacity) || 8;

  // Projects
  const projects = [...new Set(myTasks.map(t => t.project_name).filter(Boolean))];
  const filteredTasks = projectFilter === "all" ? active : active.filter(t => t.project_name === projectFilter);

  // Milestones
  const milestones = [...new Set(myTasks.map(t => t.milestone).filter(Boolean))];

  // Chart data
  const statusChart = useMemo(() => {
    const counts = {};
    myTasks.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({ status: status.replace(/_/g, " "), count, fill: STATUS_COLORS[status] || "#94a3b8" }));
  }, [myTasks]);

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="h-40 bg-muted rounded-xl animate-pulse" />
      <div className="grid grid-cols-2 gap-4"><div className="h-64 bg-muted rounded-xl animate-pulse" /><div className="h-64 bg-muted rounded-xl animate-pulse" /></div>
    </div>
  );

  if (!member) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground">Team member not found</p>
      <Button variant="outline" onClick={() => navigate(backPath)} className="mt-4">Back to Team</Button>
    </div>
  );

  const initials = (member.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => navigate(backPath)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Team
      </button>

      {/* Profile header */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="h-2" style={{ background: "linear-gradient(to right, #FF4D35, #FFB74D)" }} />
        <div className="p-6">
          <div className="flex items-start gap-5">
            {member.avatar_url ? (
              <img src={member.avatar_url} alt="" className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl ${member.role === "admin" ? "bg-purple-500" : member.role === "pm" ? "bg-blue-500" : "bg-gradient-to-br from-[#FF4D35] to-[#FFB74D]"}`}>
                {initials}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight">{member.name}</h1>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${member.role === "admin" ? "bg-purple-100 text-purple-700" : member.role === "pm" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                  {member.role === "pm" ? "PM" : member.role?.charAt(0).toUpperCase() + member.role?.slice(1)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{member.specialty || "No specialty"} · {myTasks.length} tasks · {projects.length} project{projects.length !== 1 ? "s" : ""}</p>
              {member.email && <p className="text-xs text-muted-foreground mt-0.5">{member.email}</p>}
            </div>
            <Button variant="ghost" size="sm" onClick={openSettings} className="shrink-0 gap-1.5"><Settings className="w-4 h-4" /> Settings</Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="shrink-0 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20">
              <Trash2 className="w-4 h-4" /> Remove
            </Button>
            <div className="flex items-center gap-4 text-center">
              <div>
                <p className={`text-2xl font-bold ${active.length >= capacity ? "text-red-600" : "text-foreground"}`}>{active.length}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{done.length}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Done</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${overdue.length > 0 ? "text-red-600" : "text-muted-foreground"}`}>{overdue.length}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Overdue</p>
              </div>
            </div>
          </div>

          {/* Performance bar */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            <div className="bg-muted/30 rounded-xl p-3 text-center">
              <p className={`text-lg font-bold ${completionRate >= 70 ? "text-emerald-600" : "text-amber-600"}`}>{completionRate}%</p>
              <p className="text-[9px] text-muted-foreground">Completion</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3 text-center">
              <p className={`text-lg font-bold ${onTimeRate >= 80 ? "text-emerald-600" : "text-amber-600"}`}>{onTimeRate}%</p>
              <p className="text-[9px] text-muted-foreground">On-time</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3 text-center">
              <p className="text-lg font-bold">{member.hourly_rate ? `R$${member.hourly_rate}` : "—"}</p>
              <p className="text-[9px] text-muted-foreground">Rate/hr</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3 text-center">
              <p className="text-lg font-bold">{member.default_delivery_days || "—"}</p>
              <p className="text-[9px] text-muted-foreground">Avg Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: In Progress + Overdue */}
        <div className="space-y-4">
          {/* Overdue */}
          {overdue.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-bold text-red-700">Overdue ({overdue.length})</span>
              </div>
              {overdue.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-red-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-800 truncate">{t.title}</p>
                    <p className="text-[10px] text-red-600">{t.project_name} · {Math.abs(Math.ceil((new Date(t.deadline) - new Date()) / 86400000))}d late</p>
                  </div>
                  <StatusBadge status={t.priority} size="xs" />
                </div>
              ))}
            </div>
          )}

          {/* In Progress */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold">In Progress ({inProgress.length})</span>
            </div>
            {inProgress.length > 0 ? inProgress.map(t => {
              const daysLeft = t.deadline ? Math.ceil((new Date(t.deadline) - new Date()) / 86400000) : null;
              return (
                <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                  <div className="w-1.5 h-8 rounded-full bg-amber-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <p className="text-[10px] text-muted-foreground">{t.project_name}{t.milestone ? ` · ${t.milestone}` : ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge status={t.priority} size="xs" />
                    {daysLeft !== null && <p className={`text-[10px] mt-0.5 ${daysLeft < 0 ? "text-red-600" : daysLeft <= 3 ? "text-amber-600" : "text-muted-foreground"}`}>{daysLeft < 0 ? `${Math.abs(daysLeft)}d late` : daysLeft === 0 ? "today" : `${daysLeft}d`}</p>}
                  </div>
                </div>
              );
            }) : <p className="text-sm text-muted-foreground text-center py-4">No tasks in progress</p>}
          </div>

          {/* In Review */}
          {review.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-bold">In Review ({review.length})</span>
              </div>
              {review.map(t => (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-1.5 h-8 rounded-full bg-purple-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{t.title}</p>
                    <p className="text-[10px] text-muted-foreground">{t.project_name}</p>
                  </div>
                  <StatusBadge status={t.status} size="xs" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Pending + Stats */}
        <div className="space-y-4">
          {/* Due this week */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">Due This Week ({dueSoon.length})</span>
            </div>
            {dueSoon.length > 0 ? dueSoon.sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).map(t => (
              <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-[10px] text-muted-foreground">{t.project_name}{t.milestone ? ` · ${t.milestone}` : ""}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.milestone && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t.milestone}</span>}
                  <span className="text-xs text-muted-foreground">{new Date(t.deadline).toLocaleDateString()}</span>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground text-center py-4">No deadlines this week</p>}
          </div>

          {/* Backlog */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold">Backlog ({assigned.length})</span>
            </div>
            {assigned.length > 0 ? assigned.slice(0, 8).map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{t.title}</p>
                  <p className="text-[10px] text-muted-foreground">{t.project_name}</p>
                </div>
                <StatusBadge status={t.priority} size="xs" />
              </div>
            )) : <p className="text-sm text-muted-foreground text-center py-4">No backlog tasks</p>}
            {assigned.length > 8 && <p className="text-[10px] text-muted-foreground text-center mt-2">+{assigned.length - 8} more</p>}
          </div>

          {/* Task breakdown chart */}
          {statusChart.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold">Task Breakdown</span>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={statusChart}>
                  <XAxis dataKey="status" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {statusChart.map((entry, i) => (
                      <rect key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Project filter */}
      {projects.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Filter by project:</span>
          <button onClick={() => setProjectFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${projectFilter === "all" ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground"}`}>
            All Projects
          </button>
          {projects.map(p => (
            <button key={p} onClick={() => setProjectFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${projectFilter === p ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground"}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="space-y-3">
          {milestones.map(m => {
            const mTasks = myTasks.filter(t => t.milestone === m);
            const mDone = mTasks.filter(t => t.status === "done").length;
            const pct = mTasks.length > 0 ? Math.round((mDone / mTasks.length) * 100) : 0;
            return (
              <div key={m} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">{m}</span>
                  <span className="text-xs text-muted-foreground">{mDone}/{mTasks.length} · {pct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(to right, #FF4D35, #FFB74D)" }} />
                </div>
                <div className="mt-2 space-y-1">
                  {mTasks.filter(t => t.status !== "done").slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center justify-between py-1">
                      <span className="text-xs truncate flex-1">{t.title}</span>
                      <div className="flex gap-1.5 shrink-0">
                        <StatusBadge status={t.status} size="xs" />
                        <StatusBadge status={t.priority} size="xs" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent completions */}
      {done.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-bold">Recent Completions</span>
          </div>
          <div className="space-y-2">
            {done.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center gap-2 py-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-sm text-muted-foreground truncate">{t.title}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{t.project_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Settings — {member?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              {settingsForm.avatar_url ? (
                <img src={settingsForm.avatar_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center"><Settings className="w-6 h-6 text-muted-foreground" /></div>
              )}
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted/30 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Upload
                <input type="file" accept="image/*" className="hidden" disabled={uploadingAvatar} onChange={async (e) => {
                  const file = e.target.files?.[0]; if (!file) return;
                  setUploadingAvatar(true);
                  try { const { file_url } = await api.integrations.Core.UploadFile({ file }); setSettingsForm(f => ({ ...f, avatar_url: file_url })); } catch {}
                  setUploadingAvatar(false);
                }} />
              </label>
            </div>
            {/* Quick Start — Link User Account */}
            {users.length > 0 && (
              <div className="bg-muted/30 rounded-xl p-3">
                <label className="text-xs font-semibold text-muted-foreground block mb-2">Quick Start — Link User Account</label>
                <div className="flex flex-wrap gap-1.5">
                  {users.slice(0, 10).map((u, i) => (
                    <button key={u.email || i} onClick={() => setSettingsForm(f => ({ ...f, user_email: u.email, name: u.full_name || f.name, email: u.email || f.email }))}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-all ${settingsForm.user_email === u.email ? "bg-primary text-white shadow-sm" : "bg-card border border-border text-foreground hover:border-primary/50"}`}>
                      {u.full_name || u.email}
                    </button>
                  ))}
                </div>
                {settingsForm.user_email && (
                  <p className="text-[10px] text-emerald-600 mt-2">Linked to: {settingsForm.user_email}</p>
                )}
              </div>
            )}

            <Input placeholder="Full Name" value={settingsForm.name || ""} onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={settingsForm.role || "professional"} onValueChange={v => setSettingsForm({ ...settingsForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="pm">PM</SelectItem><SelectItem value="professional">Professional</SelectItem></SelectContent>
              </Select>
              <div>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {["Frontend Developer", "Backend Developer", "Full-Stack Developer", "UI/UX Designer", "Social Media Manager", "Marketing Strategist", "Content Creator", "SEO Specialist", "Video Editor", "Copywriter"].map(s => (
                    <button key={s} onClick={() => setSettingsForm({ ...settingsForm, specialty: s })}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-medium transition-all ${settingsForm.specialty === s ? "bg-primary text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <Input placeholder="Or custom specialty..." value={settingsForm.specialty || ""} onChange={e => setSettingsForm({ ...settingsForm, specialty: e.target.value })} className="text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Email" value={settingsForm.email || ""} onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })} />
              <Input placeholder="Phone" value={settingsForm.phone || ""} onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-[10px] text-muted-foreground">Rate (R$/hr)</label><Input type="number" value={settingsForm.hourly_rate || ""} onChange={e => setSettingsForm({ ...settingsForm, hourly_rate: e.target.value })} /></div>
              <div><label className="text-[10px] text-muted-foreground">Delivery (days)</label><Input type="number" value={settingsForm.default_delivery_days || ""} onChange={e => setSettingsForm({ ...settingsForm, default_delivery_days: e.target.value })} /></div>
              <div><label className="text-[10px] text-muted-foreground">Max Tasks</label><Input type="number" value={settingsForm.max_tasks_capacity || ""} onChange={e => setSettingsForm({ ...settingsForm, max_tasks_capacity: e.target.value })} /></div>
            </div>
            <Textarea placeholder="Notes" value={settingsForm.notes || ""} onChange={e => setSettingsForm({ ...settingsForm, notes: e.target.value })} rows={2} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
              <Button onClick={handleSaveSettings}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove Team Member</DialogTitle></DialogHeader>
          <p className="text-sm">Remove <strong>{member?.name}</strong> from Team?</p>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteMember}>Remove</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
