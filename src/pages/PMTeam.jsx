import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "../components/PageHeader";

export default function PMTeam() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState("professional");
  const [form, setForm] = useState({ specialty: "", hourly_rate: "", company: "", phone: "" });

  useEffect(() => {
    Promise.all([
      base44.entities.User.list(),
      base44.entities.Task.list(),
    ]).then(([u, t]) => { setUsers(u); setTasks(t); setLoading(false); });
  }, []);

  const load = async () => {
    const u = await base44.entities.User.list();
    setUsers(u);
  };

  const handleAdd = async () => {
    const payload = {
      role: addType,
      status: "active",
      phone: form.phone || "",
    };
    if (addType === "professional") {
      payload.specialty = form.specialty;
      payload.hourly_rate = form.hourly_rate ? parseFloat(form.hourly_rate) : null;
    } else {
      payload.company = form.company;
    }
    await base44.entities.User.create(payload);
    setShowAdd(false);
    setForm({ specialty: "", hourly_rate: "", company: "", phone: "" });
    load();
  };

  const professionals = users.filter(u => u.role === "professional" && u.status === "active");
  const clients = users.filter(u => u.role === "client" && u.status === "active");

  const getStats = (userId) => {
    const myTasks = tasks.filter(t => t.assigned_to === userId);
    const active = myTasks.filter(t => t.status !== "done").length;
    const done = myTasks.filter(t => t.status === "done").length;
    const overdue = myTasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== "done").length;
    const load = myTasks.length > 0 ? Math.round((active / Math.max(myTasks.length, 1)) * 100) : 0;
    return { active, done, overdue, load, total: myTasks.length };
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Team & Clients" subtitle="Manage your professionals and client accounts">
        <Button onClick={() => { setAddType("professional"); setShowAdd(true); }} className="gap-2"><Plus className="w-4 h-4" /> Add Member</Button>
      </PageHeader>

      {/* Professionals */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Professionals ({professionals.length})
        </h3>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-card rounded-xl border p-5 h-40 animate-pulse" />)}
          </div>
        ) : professionals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {professionals.map(u => {
              const stats = getStats(u.id);
              return (
                <div key={u.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold">{u.full_name || "Professional"}</h3>
                      <p className="text-xs text-muted-foreground">{u.specialty || "No specialty"}</p>
                      {u.hourly_rate && <p className="text-xs text-muted-foreground">R${u.hourly_rate}/hr</p>}
                      {u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}
                    </div>
                    <div className={`text-xs font-semibold px-2 py-1 rounded-full ${stats.load > 80 ? "bg-red-100 text-red-700" : stats.load > 50 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {stats.load}% load
                    </div>
                  </div>

                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(stats.load, 100)}%`, background: stats.load > 80 ? "#ef4444" : "linear-gradient(to right, #FF4D35, #FFB74D)" }} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold">{stats.active}</p>
                      <p className="text-[10px] text-muted-foreground">Active</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-600">{stats.done}</p>
                      <p className="text-[10px] text-muted-foreground">Done</p>
                    </div>
                    <div>
                      <p className={`text-lg font-bold ${stats.overdue > 0 ? "text-red-600" : ""}`}>{stats.overdue}</p>
                      <p className="text-[10px] text-muted-foreground">Overdue</p>
                    </div>
                  </div>

                  {stats.active > 5 && (
                    <p className="text-xs text-amber-600 mt-3 font-medium">High workload — consider redistributing tasks</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
            No professionals yet. Add your first team member above.
          </div>
        )}
      </div>

      {/* Clients */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Clients ({clients.length})
          </h3>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { setAddType("client"); setShowAdd(true); }}>
            <Plus className="w-3 h-3" /> Add Client
          </Button>
        </div>
        {clients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {clients.map(u => (
              <div key={u.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
                <h4 className="text-sm font-semibold">{u.full_name || "Client"}</h4>
                {u.company && <p className="text-xs text-muted-foreground">{u.company}</p>}
                {u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
                {u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
            No clients yet.
          </div>
        )}
      </div>

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>{addType === "professional" ? "Add Professional" : "Add Client"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Select value={addType} onValueChange={setAddType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>

            {addType === "professional" ? (
              <>
                <Input placeholder="Specialty (e.g. Designer, Developer, Marketer)" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} />
                <Input type="number" placeholder="Hourly Rate (R$)" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} />
              </>
            ) : (
              <Input placeholder="Company Name" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
            )}

            <Input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Add {addType === "professional" ? "Professional" : "Client"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
