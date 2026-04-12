import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Star, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [pros, setPros] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [detail, setDetail] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ client_name: "", project_id: "", category: "question", subject: "", description: "", priority: "medium" });

  useEffect(() => {
    Promise.all([
      base44.entities.Ticket.list("-created_date"),
      base44.entities.User.filter({ role: "professional", status: "active" }),
      base44.entities.Project.list(),
    ]).then(([t, u, p]) => { setTickets(t); setPros(u); setProjects(p); setLoading(false); });
  }, []);

  const load = async () => {
    const t = await base44.entities.Ticket.list("-created_date");
    setTickets(t);
  };

  const handleAssign = async (ticketId, userId) => {
    const pro = pros.find(u => u.id === userId);
    await base44.entities.Ticket.update(ticketId, { assigned_to: userId, assigned_to_name: pro?.full_name || "", status: "in_progress" });
    load();
  };

  const handleStatus = async (ticketId, status) => {
    const updates = { status };
    if (status === "resolved") updates.estimated_resolution = new Date().toISOString().split("T")[0];
    await base44.entities.Ticket.update(ticketId, updates);
    load();
  };

  const handleCreate = async () => {
    const proj = projects.find(p => p.id === form.project_id);
    await base44.entities.Ticket.create({
      ...form,
      project_name: proj?.name || "",
      client_name: form.client_name || proj?.client_name || "",
      status: "open",
    });
    setShowCreate(false);
    setForm({ client_name: "", project_id: "", category: "question", subject: "", description: "", priority: "medium" });
    load();
  };

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    return (t.subject?.toLowerCase().includes(q) || t.client_name?.toLowerCase().includes(q) || t.assigned_to_name?.toLowerCase().includes(q))
      && (statusFilter === "all" || t.status === statusFilter)
      && (priorityFilter === "all" || t.priority === priorityFilter);
  });

  const rated = tickets.filter(t => t.satisfaction_rating);
  const avgSatisfaction = rated.length > 0 ? (rated.reduce((s, t) => s + t.satisfaction_rating, 0) / rated.length).toFixed(1) : null;
  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in_progress").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;
  const highPriority = tickets.filter(t => t.priority === "high" && t.status !== "resolved" && t.status !== "closed").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Ticket Management" subtitle="View and manage all support tickets across clients">
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> Create Ticket</Button>
      </PageHeader>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">Open</p>
          <p className="text-xl font-bold text-blue-600">{openCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">In Progress</p>
          <p className="text-xl font-bold text-amber-600">{inProgressCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">Resolved</p>
          <p className="text-xl font-bold text-emerald-600">{resolvedCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">High Priority</p>
          <p className={`text-xl font-bold ${highPriority > 0 ? "text-red-600" : "text-muted-foreground"}`}>{highPriority}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">Avg Satisfaction</p>
          {avgSatisfaction ? (
            <div className="flex items-center justify-center gap-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-xl font-bold">{avgSatisfaction}</span>
              <span className="text-xs text-muted-foreground">/ 5</span>
            </div>
          ) : (
            <p className="text-xl font-bold text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tickets, clients, assignees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ticket list */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="bg-card rounded-xl border p-5 h-20 animate-pulse" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(t => (
            <div key={t.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetail(t)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold">{t.subject}</h3>
                    <StatusBadge status={t.status} size="xs" />
                    <StatusBadge status={t.priority} size="xs" />
                    <StatusBadge status={t.category} size="xs" />
                  </div>
                  <p className="text-xs text-muted-foreground">{t.client_name} · {t.project_name} · {new Date(t.created_date).toLocaleDateString()}</p>
                  {t.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{t.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                  {t.satisfaction_rating && (
                    <div className="flex items-center gap-0.5 mr-2">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-semibold">{t.satisfaction_rating}</span>
                    </div>
                  )}
                  {t.status === "open" && (
                    <Select onValueChange={v => handleAssign(t.id, v)}>
                      <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue placeholder="Assign..." /></SelectTrigger>
                      <SelectContent>
                        {pros.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  {t.status === "in_progress" && <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleStatus(t.id, "resolved")}>Resolve</Button>}
                  {t.status === "resolved" && <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleStatus(t.id, "closed")}>Close</Button>}
                </div>
              </div>
              {t.assigned_to_name && <p className="text-xs text-muted-foreground mt-2">Assigned to: {t.assigned_to_name}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-sm text-muted-foreground">No tickets found</div>
      )}

      {/* Ticket detail dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{detail?.subject}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={detail.status} />
                <StatusBadge status={detail.priority} />
                <StatusBadge status={detail.category} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-xs text-muted-foreground block">Client</span>{detail.client_name || "—"}</div>
                <div><span className="text-xs text-muted-foreground block">Project</span>{detail.project_name || "—"}</div>
                <div><span className="text-xs text-muted-foreground block">Assigned To</span>{detail.assigned_to_name || "Unassigned"}</div>
                <div><span className="text-xs text-muted-foreground block">Created</span>{new Date(detail.created_date).toLocaleDateString()}</div>
                {detail.estimated_resolution && <div><span className="text-xs text-muted-foreground block">Est. Resolution</span>{new Date(detail.estimated_resolution).toLocaleDateString()}</div>}
                {detail.satisfaction_rating && (
                  <div>
                    <span className="text-xs text-muted-foreground block">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="font-semibold">{detail.satisfaction_rating}/5</span>
                    </div>
                  </div>
                )}
              </div>
              {detail.description && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Description</span>
                  <p className="text-sm bg-muted/30 rounded-lg p-3">{detail.description}</p>
                </div>
              )}
              {detail.resolution_notes && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Resolution Notes</span>
                  <p className="text-sm bg-emerald-50 rounded-lg p-3">{detail.resolution_notes}</p>
                </div>
              )}
              <div className="flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
                {detail.status === "open" && (
                  <Select onValueChange={v => { handleAssign(detail.id, v); setDetail(null); }}>
                    <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue placeholder="Assign..." /></SelectTrigger>
                    <SelectContent>
                      {pros.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {detail.status === "in_progress" && <Button size="sm" onClick={() => { handleStatus(detail.id, "resolved"); setDetail(null); }}>Resolve</Button>}
                {detail.status === "resolved" && <Button size="sm" onClick={() => { handleStatus(detail.id, "closed"); setDetail(null); }}>Close</Button>}
                <Button variant="outline" size="sm" onClick={() => setDetail(null)}>Done</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create ticket dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Ticket</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Client Name" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
            <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select Project (optional)" /></SelectTrigger>
              <SelectContent>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {p.client_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="change_request">Change Request</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
                <SelectItem value="question">Question</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <Textarea placeholder="Description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.subject}>Create Ticket</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
