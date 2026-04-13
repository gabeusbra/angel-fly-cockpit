import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

export default function PMProjects() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", client_id: "", client_name: "", scope_description: "", status: "active", start_date: "", end_date: "", total_budget: "", payment_type: "one-time" });

  useEffect(() => {
    Promise.all([
      base44.entities.Project.list("-created_date"),
      base44.entities.Task.list(),
      base44.entities.User.list(),
    ]).then(([p, t, u]) => {
      setProjects(p);
      setTasks(t);
      setClients(u.filter(usr => usr.role === "client" && usr.status !== "inactive"));
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    const client = clients.find(c => c.id === form.client_id);
    await base44.entities.Project.create({
      ...form,
      client_name: client?.full_name || client?.company || form.client_name || "",
      total_budget: form.total_budget ? parseFloat(form.total_budget) : 0,
    });
    setShowCreate(false);
    setForm({ name: "", client_id: "", client_name: "", scope_description: "", status: "active", start_date: "", end_date: "", total_budget: "", payment_type: "one-time" });
    const p = await base44.entities.Project.list("-created_date");
    setProjects(p);
  };

  const getProgress = (pid) => {
    const t = tasks.filter(t => t.project_id === pid);
    if (!t.length) return 0;
    return Math.round((t.filter(t => t.status === "done").length / t.length) * 100);
  };

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    return (p.name?.toLowerCase().includes(q) || p.client_name?.toLowerCase().includes(q))
      && (statusFilter === "all" || p.status === statusFilter);
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" subtitle="Manage all client projects">
        <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> New Project</Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-card rounded-xl border p-5 h-40 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const prog = getProgress(p.id);
            const taskCount = tasks.filter(t => t.project_id === p.id).length;
            return (
              <Link key={p.id} to={`/pm/projects/${p.id}`}
                className="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 group block">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold group-hover:text-primary transition-colors truncate pr-2">{p.name}</h3>
                  <StatusBadge status={p.status} size="xs" />
                </div>
                <p className="text-xs text-muted-foreground mb-3">{p.client_name || "No client"}</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{taskCount} tasks</span>
                    <span className="font-medium">{prog}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${prog}%`, background: "linear-gradient(to right, #FF4D35, #FFB74D)" }} />
                  </div>
                </div>
                <div className="flex justify-between mt-3 text-xs text-muted-foreground">
                  <span>R${(p.total_budget || 0).toLocaleString()}</span>
                  {p.end_date && <span>Due {new Date(p.end_date).toLocaleDateString()}</span>}
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && <p className="col-span-3 text-center text-sm text-muted-foreground py-12">No projects found</p>}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Project Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />

            {/* Client selector */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Client</label>
              {clients.length > 0 ? (
                <Select value={form.client_id} onValueChange={v => {
                  const c = clients.find(cl => cl.id === v);
                  setForm({ ...form, client_id: v, client_name: c?.full_name || c?.company || "" });
                }}>
                  <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.full_name || c.email}{c.company ? ` — ${c.company}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input placeholder="Client Name (no clients in system yet)" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
              )}
            </div>

            <Textarea placeholder="Scope Description" value={form.scope_description} onChange={e => setForm({ ...form, scope_description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Start Date</label>
                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Delivery Date</label>
                <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <Input type="number" placeholder="Budget (R$)" value={form.total_budget} onChange={e => setForm({ ...form, total_budget: e.target.value })} />
            <Select value={form.payment_type} onValueChange={v => setForm({ ...form, payment_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="one-time">One-time</SelectItem>
                <SelectItem value="recurring">Recurring</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.name}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
