import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Star, Plus, Sparkles, ListChecks, Clock, AlertTriangle, CheckCircle2, MessageSquare, User, ExternalLink, Paperclip, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatusBadge from "../components/StatusBadge";

const CATEGORY_CONFIG = {
  bug: { label: "Bug", emoji: "🐛", bg: "bg-red-50 border-red-200", text: "text-red-700" },
  change_request: { label: "Change Request", emoji: "🔄", bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
  complaint: { label: "Complaint", emoji: "⚡", bg: "bg-orange-50 border-orange-200", text: "text-orange-700" },
  question: { label: "Question", emoji: "❓", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
};

const PRIORITY_DOT = { low: "bg-slate-400", medium: "bg-blue-500", high: "bg-orange-500", urgent: "bg-red-500" };

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [pros, setPros] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [detail, setDetail] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ client_name: "", project_id: "", category: "question", subject: "", description: "", priority: "medium" });
  const [convertTicket, setConvertTicket] = useState(null);
  const [convertForm, setConvertForm] = useState({ project_id: "", assigned_to: "", priority: "medium", milestone: "", deadline: "" });

  useEffect(() => {
    const init = async () => {
      let t = [], u = [], p = [], tk = [];
      try { t = await base44.entities.Ticket.list("-created_date"); } catch { try { t = await base44.entities.Ticket.list(); } catch { /* ignore */ } }
      try { u = await base44.entities.User.list(); u = u.filter(usr => ["professional", "pm", "admin"].includes(usr.role) && usr.status !== "inactive"); } catch {
        try { u = await base44.entities.User.filter({ status: "active" }); u = u.filter(usr => ["professional", "pm", "admin"].includes(usr.role)); } catch { /* ignore */ }
      }
      try { p = await base44.entities.Project.list(); } catch { /* ignore */ }
      try { tk = await base44.entities.Task.list(); } catch { /* ignore */ }
      // If no pros found from User entity, extract from task assignments
      if (u.length === 0 && tk.length > 0) {
        const proMap = {};
        tk.forEach(task => {
          if (task.assigned_to && task.assigned_to_name) {
            proMap[task.assigned_to] = { id: task.assigned_to, full_name: task.assigned_to_name, role: "professional" };
          }
        });
        // Also extract from ticket assignments
        t.forEach(ticket => {
          if (ticket.assigned_to && ticket.assigned_to_name) {
            proMap[ticket.assigned_to] = { id: ticket.assigned_to, full_name: ticket.assigned_to_name, role: "professional" };
          }
        });
        u = Object.values(proMap);
      }
      // Use team store for assign dropdown (works for PM too)
      import("@/lib/team-store").then(async ({ getTeamMembers }) => {
        const team = (await getTeamMembers()).filter(m => m.status === "active");
        if (team.length > 0) setPros(team.map(m => ({ id: m.id, full_name: m.name, specialty: m.specialty })));
      });
      setTickets(t); if (u.length > 0) setPros(prev => prev.length > 0 ? prev : u); setProjects(p); setTasks(tk); setLoading(false);
    };
    init();
  }, []);

  const load = async () => {
    let t = [], tk = [];
    try { t = await base44.entities.Ticket.list("-created_date"); } catch { try { t = await base44.entities.Ticket.list(); } catch { /* ignore */ } }
    try { tk = await base44.entities.Task.list(); } catch { /* ignore */ }
    setTickets(t); setTasks(tk);
  };

  const handleAssign = async (ticket, userId) => {
    const pro = pros.find(u => u.id === userId);
    await base44.entities.Ticket.update(ticket.id, {
      assigned_to: userId, assigned_to_name: pro?.full_name || "",
      status: ticket.status === "open" ? "in_progress" : ticket.status,
    });
    const existing = tasks.find(t => t.title === `[Ticket] ${ticket.subject}` && t.project_id === ticket.project_id);
    if (existing) {
      await base44.entities.Task.update(existing.id, { assigned_to: userId, assigned_to_name: pro?.full_name || "" });
    } else {
      const attachmentText = ticket.attachments?.length ? `\n\n--- Attachments ---\n${ticket.attachments.map((u, i) => `${i + 1}. ${u}`).join("\n")}` : "";
      await base44.entities.Task.create({
        title: `[Ticket] ${ticket.subject}`, description: `${ticket.description || ""}\n\n--- Ticket | ${ticket.category} | ${ticket.priority} priority | Client: ${ticket.client_name}${attachmentText}`,
        project_id: ticket.project_id || "", project_name: ticket.project_name || "", client_name: ticket.client_name || "",
        assigned_to: userId, assigned_to_name: pro?.full_name || "", status: "assigned", priority: ticket.priority || "medium",
        deadline: ticket.estimated_resolution || "", deliverable_url: ticket.attachments?.[0] || "", subtasks: "[]", comments: "[]",
      });
    }
    load();
  };

  const handleStatus = async (ticketId, status) => {
    await base44.entities.Ticket.update(ticketId, { status, ...(status === "resolved" ? { estimated_resolution: new Date().toISOString().split("T")[0] } : {}) });
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      const lt = tasks.find(t => t.title === `[Ticket] ${ticket.subject}` && t.project_id === ticket.project_id);
      if (lt) await base44.entities.Task.update(lt.id, { status: status === "resolved" || status === "closed" ? "done" : lt.status });
    }
    load();
  };

  const handleCreate = async () => {
    const proj = projects.find(p => p.id === form.project_id);
    await base44.entities.Ticket.create({ ...form, project_name: proj?.name || "", client_name: form.client_name || proj?.client_name || "", status: "open" });
    setShowCreate(false);
    setForm({ client_name: "", project_id: "", category: "question", subject: "", description: "", priority: "medium" });
    load();
  };

  const handleDuplicate = async (ticket) => {
    await base44.entities.Ticket.create({
      subject: `${ticket.subject} (copy)`,
      description: ticket.description || "",
      category: ticket.category || "question",
      priority: ticket.priority || "medium",
      client_id: ticket.client_id || "",
      client_name: ticket.client_name || "",
      project_id: ticket.project_id || "",
      project_name: ticket.project_name || "",
      status: "open",
      attachments: ticket.attachments || [],
    });
    load();
  };

  const openConvert = (ticket) => {
    setConvertTicket(ticket);
    setConvertForm({ project_id: ticket.project_id || "", assigned_to: ticket.assigned_to || "", priority: ticket.priority || "medium", milestone: "", deadline: ticket.estimated_resolution || "" });
  };

  const handleConvert = async () => {
    if (!convertTicket) return;
    const pro = pros.find(u => u.id === convertForm.assigned_to);
    const proj = projects.find(p => p.id === convertForm.project_id);
    const attachmentText = convertTicket.attachments?.length ? `\n\n--- Attachments ---\n${convertTicket.attachments.map((u, i) => `${i + 1}. ${u}`).join("\n")}` : "";
    await base44.entities.Task.create({
      title: `[Ticket] ${convertTicket.subject}`, description: `${convertTicket.description || ""}\n\n--- Ticket | ${convertTicket.category} | ${convertTicket.priority} priority | Client: ${convertTicket.client_name}${attachmentText}`,
      project_id: convertForm.project_id, project_name: proj?.name || convertTicket.project_name || "", client_name: convertTicket.client_name || proj?.client_name || "",
      assigned_to: convertForm.assigned_to, assigned_to_name: pro?.full_name || "", status: convertForm.assigned_to ? "assigned" : "backlog",
      priority: convertForm.priority, deadline: convertForm.deadline, milestone: convertForm.milestone, deliverable_url: convertTicket.attachments?.[0] || "", subtasks: "[]", comments: "[]",
    });
    if (convertTicket.status === "open") await base44.entities.Ticket.update(convertTicket.id, { status: "in_progress", ...(convertForm.assigned_to ? { assigned_to: convertForm.assigned_to, assigned_to_name: pro?.full_name || "" } : {}) });
    setConvertTicket(null); load();
  };

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    return (t.subject?.toLowerCase().includes(q) || t.client_name?.toLowerCase().includes(q) || t.assigned_to_name?.toLowerCase().includes(q))
      && (statusFilter === "all" || t.status === statusFilter) && (priorityFilter === "all" || t.priority === priorityFilter);
  });

  const rated = tickets.filter(t => t.satisfaction_rating);
  const avgSat = rated.length > 0 ? (rated.reduce((s, t) => s + t.satisfaction_rating, 0) / rated.length).toFixed(1) : null;
  const counts = { open: tickets.filter(t => t.status === "open").length, in_progress: tickets.filter(t => t.status === "in_progress").length, resolved: tickets.filter(t => t.status === "resolved" || t.status === "closed").length };
  const highP = tickets.filter(t => t.priority === "high" && t.status !== "resolved" && t.status !== "closed").length;
  const getLinkedTask = (ticket) => tasks.find(t => t.title === `[Ticket] ${ticket.subject}` && t.project_id === ticket.project_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">{tickets.length} total · {counts.open} need attention</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> New Ticket</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Open", value: counts.open, color: "text-blue-600", icon: <MessageSquare className="w-4 h-4" />, bg: "bg-blue-50", filter: "open" },
          { label: "In Progress", value: counts.in_progress, color: "text-amber-600", icon: <Clock className="w-4 h-4" />, bg: "bg-amber-50", filter: "in_progress" },
          { label: "Resolved", value: counts.resolved, color: "text-emerald-600", icon: <CheckCircle2 className="w-4 h-4" />, bg: "bg-emerald-50", filter: "resolved" },
          { label: "High Priority", value: highP, color: highP > 0 ? "text-red-600" : "text-muted-foreground", icon: <AlertTriangle className="w-4 h-4" />, bg: highP > 0 ? "bg-red-50" : "bg-muted/30", filter: "high_p" },
          { label: "Satisfaction", value: avgSat ? `${avgSat}/5` : "—", color: "text-amber-600", icon: <Star className="w-4 h-4 fill-amber-400 text-amber-400" />, bg: "bg-amber-50", filter: null },
        ].map((s, i) => (
          <button key={i}
            onClick={() => { if (s.filter === "high_p") setPriorityFilter(priorityFilter === "high" ? "all" : "high"); else if (s.filter) setStatusFilter(statusFilter === s.filter ? "all" : s.filter); }}
            className={`${s.bg} rounded-xl p-4 text-left transition-all hover:shadow-sm ${(statusFilter === s.filter || (s.filter === "high_p" && priorityFilter === "high")) ? "ring-2 ring-primary/30 shadow-sm" : ""}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`${s.color}`}>{s.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <div className="flex gap-2">
          {["all", "open", "in_progress", "resolved", "closed"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-primary text-white shadow-sm" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
              {s === "all" ? "All" : s === "in_progress" ? "Active" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket list */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-card rounded-xl border p-5 h-24 animate-pulse" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(t => {
            const cat = CATEGORY_CONFIG[t.category] || CATEGORY_CONFIG.question;
            const linkedTask = getLinkedTask(t);
            const age = Math.ceil((new Date() - new Date(t.created_date)) / 86400000);
            return (
              <div key={t.id} className="bg-card rounded-xl border border-border hover:shadow-lg hover:shadow-black/5 transition-all cursor-pointer group" onClick={() => setDetail(t)}>
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Category icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border ${cat.bg}`}>
                      {cat.emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-bold">{t.subject}</h3>
                        <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[t.priority] || PRIORITY_DOT.medium}`} title={t.priority} />
                        {linkedTask && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 font-medium">Task linked</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{t.client_name}{t.project_name ? ` · ${t.project_name}` : ""}</p>
                      {t.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{t.description}</p>}
                      {t.attachments?.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Paperclip className="w-3 h-3 text-muted-foreground" />
                          {t.attachments.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors">
                              File {i + 1}
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{age === 0 ? "Today" : age === 1 ? "Yesterday" : `${age}d ago`}</span>
                        </div>
                        {t.assigned_to_name && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>{t.assigned_to_name}</span>
                          </div>
                        )}
                        {t.satisfaction_rating && (
                          <div className="flex items-center gap-0.5 text-xs">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="font-medium">{t.satisfaction_rating}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      {(t.status === "open" || t.status === "in_progress") && (
                        <Select value={t.assigned_to || ""} onValueChange={v => handleAssign(t, v)}>
                          <SelectTrigger className="h-9 text-xs w-[130px] rounded-lg">
                            <SelectValue placeholder="Assign..." />
                          </SelectTrigger>
                          <SelectContent>{pros.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                      {!linkedTask && t.status !== "closed" && (
                        <Button size="sm" variant="outline" className="h-9 text-xs gap-1 rounded-lg" onClick={() => openConvert(t)}>
                          <ListChecks className="w-3 h-3" /> Task
                        </Button>
                      )}
                      {t.status === "in_progress" && <Button size="sm" className="h-9 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStatus(t.id, "resolved")}>Resolve</Button>}
                      {t.status === "resolved" && <Button size="sm" variant="outline" className="h-9 text-xs rounded-lg" onClick={() => handleStatus(t.id, "closed")}>Close</Button>}
                    </div>
                  </div>
                </div>

                {/* Status bar */}
                <div className={`h-1 rounded-b-xl ${
                  t.status === "open" ? "bg-blue-500" : t.status === "in_progress" ? "bg-amber-500" : t.status === "resolved" ? "bg-emerald-500" : "bg-slate-300"
                }`} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-16 text-center">
          <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium">No tickets found</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg">
          {detail && (() => {
            const cat = CATEGORY_CONFIG[detail.category] || CATEGORY_CONFIG.question;
            const lt = getLinkedTask(detail);
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border ${cat.bg}`}>{cat.emoji}</div>
                    <div>
                      <DialogTitle>{detail.subject}</DialogTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{detail.client_name} · {cat.label}</p>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={detail.status} />
                    <StatusBadge status={detail.priority} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-xs text-muted-foreground block">Project</span>{detail.project_name || "—"}</div>
                    <div><span className="text-xs text-muted-foreground block">Assigned To</span>{detail.assigned_to_name || "Unassigned"}</div>
                    <div><span className="text-xs text-muted-foreground block">Created</span>{new Date(detail.created_date).toLocaleDateString()}</div>
                    {detail.estimated_resolution && <div><span className="text-xs text-muted-foreground block">Est. Resolution</span>{new Date(detail.estimated_resolution).toLocaleDateString()}</div>}
                    {detail.satisfaction_rating && <div><span className="text-xs text-muted-foreground block">Rating</span><div className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /><span className="font-semibold">{detail.satisfaction_rating}/5</span></div></div>}
                  </div>
                  {detail.description && <div><span className="text-xs text-muted-foreground block mb-1">Description</span><p className="text-sm bg-muted/30 rounded-lg p-3">{detail.description}</p></div>}
                  {detail.attachments?.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-2">Attachments</span>
                      <div className="space-y-1.5">
                        {detail.attachments.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 text-xs text-primary hover:underline bg-muted/30 rounded-lg px-3 py-2">
                            <ExternalLink className="w-3.5 h-3.5" /> {url.split("/").pop() || `Attachment ${i + 1}`}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {lt ? (
                    <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1"><Sparkles className="w-3.5 h-3.5 text-emerald-600" /><span className="text-xs font-semibold text-emerald-700">Linked Task</span></div>
                      <p className="text-sm font-medium">{lt.title}</p>
                      <p className="text-xs text-muted-foreground">{lt.assigned_to_name} · <StatusBadge status={lt.status} size="xs" /></p>
                    </div>
                  ) : detail.status !== "closed" && (
                    <Button variant="outline" className="w-full gap-1.5" onClick={() => { setDetail(null); openConvert(detail); }}>
                      <ListChecks className="w-4 h-4" /> Convert to Task
                    </Button>
                  )}
                  <div className="flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
                    {(detail.status === "open" || detail.status === "in_progress") && (
                      <Select value={detail.assigned_to || ""} onValueChange={v => { handleAssign(detail, v); setDetail(null); }}>
                        <SelectTrigger className="h-9 text-xs w-[140px]"><SelectValue placeholder={detail.assigned_to_name || "Assign..."} /></SelectTrigger>
                        <SelectContent>{pros.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                    {detail.status === "in_progress" && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { handleStatus(detail.id, "resolved"); setDetail(null); }}>Resolve</Button>}
                    {detail.status === "resolved" && <Button size="sm" onClick={() => { handleStatus(detail.id, "closed"); setDetail(null); }}>Close</Button>}
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => { handleDuplicate(detail); setDetail(null); }}><Copy className="w-3 h-3" /> Duplicate</Button>
                    <Button variant="outline" size="sm" onClick={() => setDetail(null)}>Done</Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Create ticket */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Ticket</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="text-base font-medium" />
            <Input placeholder="Client Name" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
            <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
              <SelectTrigger><SelectValue placeholder="Project (optional)" /></SelectTrigger>
              <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <button key={key} onClick={() => setForm({ ...form, category: key })}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${form.category === key ? `${cfg.bg} ${cfg.text} shadow-sm` : "border-border hover:bg-muted/30"}`}>
                    <span>{cfg.emoji}</span> {cfg.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">Priority</label>
              <div className="flex gap-2">
                {["low", "medium", "high"].map(p => (
                  <button key={p} onClick={() => setForm({ ...form, priority: p })}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium flex-1 justify-center transition-all ${form.priority === p ? "bg-primary text-white shadow-sm" : "border border-border hover:bg-muted/30"}`}>
                    <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[p]}`} /> {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <Textarea placeholder="Describe the issue..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.subject}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert to task */}
      <Dialog open={!!convertTicket} onOpenChange={() => setConvertTicket(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Convert to Task</DialogTitle></DialogHeader>
          {convertTicket && (
            <div className="space-y-3 pt-2">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-sm font-semibold">{convertTicket.subject}</p>
                <p className="text-xs text-muted-foreground">{convertTicket.client_name} · {convertTicket.priority}</p>
              </div>
              <Select value={convertForm.project_id} onValueChange={v => setConvertForm({ ...convertForm, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Project" /></SelectTrigger>
                <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={convertForm.assigned_to} onValueChange={v => setConvertForm({ ...convertForm, assigned_to: v })}>
                <SelectTrigger><SelectValue placeholder="Assign to (optional)" /></SelectTrigger>
                <SelectContent>{pros.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}</SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={convertForm.deadline} onChange={e => setConvertForm({ ...convertForm, deadline: e.target.value })} />
                <Input placeholder="Milestone" value={convertForm.milestone} onChange={e => setConvertForm({ ...convertForm, milestone: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setConvertTicket(null)}>Cancel</Button>
                <Button onClick={handleConvert} className="gap-1"><ListChecks className="w-4 h-4" /> Create Task</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
